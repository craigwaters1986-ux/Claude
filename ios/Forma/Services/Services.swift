import Foundation
import UIKit
import HealthKit
import WatchConnectivity
import GymCore

// MARK: - Haptics

@MainActor
enum Haptics {
    static var enabled = true
    static func tap() { guard enabled else { return }; UIImpactFeedbackGenerator(style: .light).impactOccurred() }
    static func heavy() { guard enabled else { return }; UIImpactFeedbackGenerator(style: .heavy).impactOccurred() }
    static func success() { guard enabled else { return }; UINotificationFeedbackGenerator().notificationOccurred(.success) }
    static func warning() { guard enabled else { return }; UINotificationFeedbackGenerator().notificationOccurred(.warning) }
}

// MARK: - HealthKit (optional; every read degrades gracefully to nil)

@MainActor
final class HealthKitManager {
    static let shared = HealthKitManager()
    private let store = HKHealthStore()
    var isAvailable: Bool { HKHealthStore.isHealthDataAvailable() }

    private let readTypes: Set<HKObjectType> = [
        HKCategoryType(.sleepAnalysis), HKQuantityType(.restingHeartRate), HKQuantityType(.heartRateVariabilitySDNN),
        HKQuantityType(.heartRate), HKQuantityType(.activeEnergyBurned), HKObjectType.workoutType(),
    ]
    private let writeTypes: Set<HKSampleType> = [HKObjectType.workoutType(), HKQuantityType(.activeEnergyBurned)]

    /// Shows the system permission sheet. HealthKit never reveals whether READ access was denied,
    /// so callers must treat "no data" and "no permission" identically.
    func requestAuthorization() async throws { try await store.requestAuthorization(toShare: writeTypes, read: readTypes) }

    /// Signals for the recovery model, relative to the user's own 30-day baseline.
    func recoverySignals(now: Date = .now) async -> HealthSignals {
        async let sleep = lastNightSleepHours(now: now)
        async let hrv = zScore(.heartRateVariabilitySDNN, unit: .secondUnit(with: .milli), now: now)
        async let rhr = delta(.restingHeartRate, unit: .count().unitDivided(by: .minute()), now: now)
        return await HealthSignals(sleepHours: sleep, hrvZScore: hrv, restingHRDelta: rhr)
    }

    private func samples(_ type: HKQuantityType, from: Date, to: Date) async -> [HKQuantitySample] {
        let d = HKSampleQueryDescriptor(predicates: [.quantitySample(type: type, predicate: HKQuery.predicateForSamples(withStart: from, end: to))], sortDescriptors: [SortDescriptor(\.startDate)])
        return (try? await d.result(for: store)) ?? []
    }

    private func zScore(_ id: HKQuantityTypeIdentifier, unit: HKUnit, now: Date) async -> Double? {
        let all = await samples(HKQuantityType(id), from: now.addingTimeInterval(-30 * 86_400), to: now).map { $0.quantity.doubleValue(for: unit) }
        guard all.count >= 7, let today = all.last else { return nil }  // need a baseline
        let base = all.dropLast(); let m = base.reduce(0, +) / Double(base.count)
        let sd = (base.reduce(0) { $0 + ($1 - m) * ($1 - m) } / Double(base.count)).squareRoot()
        return sd > 0 ? (today - m) / sd : nil
    }

    private func delta(_ id: HKQuantityTypeIdentifier, unit: HKUnit, now: Date) async -> Double? {
        let all = await samples(HKQuantityType(id), from: now.addingTimeInterval(-30 * 86_400), to: now).map { $0.quantity.doubleValue(for: unit) }
        guard all.count >= 7, let today = all.last else { return nil }
        return today - all.dropLast().reduce(0, +) / Double(all.count - 1)
    }

    private func lastNightSleepHours(now: Date) async -> Double? {
        let start = Calendar.current.date(byAdding: .hour, value: -18, to: now)!
        let d = HKSampleQueryDescriptor(predicates: [.categorySample(type: HKCategoryType(.sleepAnalysis), predicate: HKQuery.predicateForSamples(withStart: start, end: now))], sortDescriptors: [])
        guard let s = try? await d.result(for: store), !s.isEmpty else { return nil }
        let asleep = s.filter { HKCategoryValueSleepAnalysis.allAsleepValues.map(\.rawValue).contains($0.value) }
        let secs = asleep.reduce(0) { $0 + $1.endDate.timeIntervalSince($1.startDate) }
        return secs > 0 ? secs / 3600 : nil
    }
}

// MARK: - WatchConnectivity (iPhone side)

@MainActor
final class PhoneSessionManager: NSObject, WCSessionDelegate {
    static let shared = PhoneSessionManager()
    var onSetCompleted: ((SetResult) -> Void)?
    private var dedup = EnvelopeDeduplicator()

    func activate() { guard WCSession.isSupported() else { return }; WCSession.default.delegate = self; WCSession.default.activate() }

    var isWatchAvailable: Bool { WCSession.isSupported() && WCSession.default.isPaired && WCSession.default.isWatchAppInstalled }

    /// Newest plan wins → application context (delivered even if the watch app isn't running).
    func publish(plan: ActivePlan) {
        guard isWatchAvailable, let data = try? Envelope(message: .plan(plan)).encoded() else { return }
        try? WCSession.default.updateApplicationContext([Envelope.key: data])
    }

    func send(_ message: WatchMessage) {
        guard isWatchAvailable, let data = try? Envelope(message: message).encoded() else { return }
        if WCSession.default.isReachable {
            WCSession.default.sendMessageData(data, replyHandler: nil) { _ in WCSession.default.transferUserInfo([Envelope.key: data]) }
        } else {
            WCSession.default.transferUserInfo([Envelope.key: data])   // queued, survives suspension
        }
    }

    private func handle(_ data: Data) {
        guard let env = try? Envelope.decode(data), dedup.accept(env) else { return }
        if case .setCompleted(let r) = env.message { onSetCompleted?(r) }
    }

    nonisolated func session(_ s: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {}
    nonisolated func sessionDidBecomeInactive(_ s: WCSession) {}
    nonisolated func sessionDidDeactivate(_ s: WCSession) { s.activate() }
    nonisolated func session(_ s: WCSession, didReceiveMessageData data: Data) { Task { @MainActor in self.handle(data) } }
    nonisolated func session(_ s: WCSession, didReceiveUserInfo info: [String: Any]) {
        guard let data = info[Envelope.key] as? Data else { return }
        Task { @MainActor in self.handle(data) }
    }
}

// MARK: - AI client (talks ONLY to Forma's server; no model API keys on device)

struct AIClient {
    var baseURL: URL
    var authToken: () async -> String?   // app session token (Sign in with Apple), not an AI key

    struct GenerateRequest: Encodable { var input: [String: AnyEncodable]; var context: TrainingContext }
    struct TrainingContext: Encodable {
        var profile: [String: AnyEncodable]
        var recovery: [RecoveryItem]
        var history: [HistoryItem]
        var exerciseCatalog: [String]
        struct RecoveryItem: Encodable { var muscle: String; var estimatedPct: Int; var weeklySets: Double; var hoursToReady: Int }
        struct HistoryItem: Encodable { var exerciseId: String; var recent: [Session]; struct Session: Encodable { var date: String; var sets: [[Double?]] } }
    }
    struct GenerateResponse: Decodable { var plan: GeneratedPlan; var explanation: [String]? }

    func generate(_ req: GenerateRequest) async throws -> GenerateResponse {
        var r = URLRequest(url: baseURL.appendingPathComponent("v1/workouts/generate"))
        r.httpMethod = "POST"; r.timeoutInterval = 30
        r.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let t = await authToken() { r.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization") }
        r.httpBody = try JSONEncoder().encode(req)
        let (data, resp) = try await URLSession.shared.data(for: r)
        guard (resp as? HTTPURLResponse)?.statusCode == 200 else { throw URLError(.badServerResponse) }
        return try JSONDecoder().decode(GenerateResponse.self, from: data)
        // Callers ALWAYS pass the plan through PlanValidator.validate before display.
    }
}

struct AnyEncodable: Encodable {
    private let enc: (Encoder) throws -> Void
    init<T: Encodable>(_ v: T) { enc = v.encode }
    func encode(to encoder: Encoder) throws { try enc(encoder) }
}
