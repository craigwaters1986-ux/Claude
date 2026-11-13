import Foundation
import HealthKit
import CoreMotion
import WatchConnectivity
import WatchKit
import GymCore

/// Owns the HKWorkoutSession. An active workout session is what lets a
/// watchOS app keep running (and keep reading motion + heart rate) with the
/// screen off — without it the app is suspended within seconds.
@MainActor @Observable
final class WorkoutManager: NSObject {
    private let store = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?

    var heartRate: Double = 0
    var activeEnergyKcal: Double = 0     // Apple Watch's own estimate via HealthKit
    var startDate: Date?
    var isRunning = false
    private var hrSamples: [Double] = []

    func requestAuthorization() async throws {
        try await store.requestAuthorization(toShare: [HKObjectType.workoutType()],
                                             read: [HKQuantityType(.heartRate), HKQuantityType(.activeEnergyBurned)])
    }

    func start() async throws {
        let config = HKWorkoutConfiguration()
        config.activityType = .traditionalStrengthTraining
        config.locationType = .indoor
        let s = try HKWorkoutSession(healthStore: store, configuration: config)
        let b = s.associatedWorkoutBuilder()
        b.dataSource = HKLiveWorkoutDataSource(healthStore: store, workoutConfiguration: config)
        s.delegate = self; b.delegate = self
        session = s; builder = b
        let now = Date()
        s.startActivity(with: now)
        try await b.beginCollection(at: now)
        startDate = now; isRunning = true
    }

    func end() async -> (kcal: Double, avgHR: Double?) {
        session?.end()
        let now = Date()
        try? await builder?.endCollection(at: now)
        _ = try? await builder?.finishWorkout()   // saved to Apple Health
        isRunning = false
        let avg = hrSamples.isEmpty ? nil : hrSamples.reduce(0, +) / Double(hrSamples.count)
        return (activeEnergyKcal, avg)
    }

    /// Average HR since `date` (for per-set summaries).
    func averageHeartRate(since date: Date) -> Double? { hrSamples.isEmpty ? nil : hrSamples.suffix(30).reduce(0, +) / Double(min(30, hrSamples.count)) }
}

extension WorkoutManager: HKWorkoutSessionDelegate, HKLiveWorkoutBuilderDelegate {
    nonisolated func workoutSession(_ s: HKWorkoutSession, didChangeTo to: HKWorkoutSessionState, from: HKWorkoutSessionState, date: Date) {}
    nonisolated func workoutSession(_ s: HKWorkoutSession, didFailWithError error: Error) {}
    nonisolated func workoutBuilderDidCollectEvent(_ b: HKLiveWorkoutBuilder) {}
    nonisolated func workoutBuilder(_ b: HKLiveWorkoutBuilder, didCollectDataOf types: Set<HKSampleType>) {
        let hr = b.statistics(for: HKQuantityType(.heartRate))?.mostRecentQuantity()?.doubleValue(for: .count().unitDivided(by: .minute()))
        let kcal = b.statistics(for: HKQuantityType(.activeEnergyBurned))?.sumQuantity()?.doubleValue(for: .kilocalorie())
        Task { @MainActor in
            if let hr { self.heartRate = hr; self.hrSamples.append(hr) }
            if let kcal { self.activeEnergyKcal = kcal }
        }
    }
}

/// Streams CMDeviceMotion into GymCore.RepCounter while a set is in progress.
/// 50 Hz is enough for gym tempos (reps ≈ 0.3–1 Hz) and cheap on battery.
/// (watchOS 10's CMBatchedSensorManager offers 200 Hz accelerometer batches —
/// worth evaluating once a per-exercise model is trained.)
@MainActor @Observable
final class MotionRepTracker {
    private let motion = CMMotionManager()
    private let queue = OperationQueue()
    private(set) var counter: RepCounter?
    var reps: Int { counter?.count ?? manualReps }
    private var manualReps = 0
    var isCounting = false
    /// Opt-in raw motion capture for labelled recordings (see docs/04).
    var recordMotion = false
    private var recorded: [MotionSample] = []
    private var exerciseID = ""
    var autoAvailable: Bool { counter != nil }

    func begin(for exercise: ExerciseDefinition?) {
        manualReps = 0; recorded = []; exerciseID = exercise?.id ?? ""
        if recordMotion, motion.isDeviceMotionAvailable, exercise.flatMap(RepProfile.forExercise) == nil {
            // Unsupported exercises can still contribute data for future models.
            motion.deviceMotionUpdateInterval = 1.0 / 50
            motion.startDeviceMotionUpdates(to: queue) { [weak self] m, _ in
                guard let m else { return }
                let s = MotionSample(t: m.timestamp, gravity: SIMD3(m.gravity.x, m.gravity.y, m.gravity.z), userAcceleration: SIMD3(m.userAcceleration.x, m.userAcceleration.y, m.userAcceleration.z))
                Task { @MainActor in self?.recorded.append(s) }
            }
        }
        counter = exercise.flatMap(RepProfile.forExercise).map { RepCounter(profile: $0, sampleRate: 50) }
        isCounting = true
        guard counter != nil, motion.isDeviceMotionAvailable else { return }
        motion.deviceMotionUpdateInterval = 1.0 / 50
        motion.startDeviceMotionUpdates(to: queue) { [weak self] m, _ in
            guard let m else { return }
            let sample = MotionSample(t: m.timestamp, gravity: SIMD3(m.gravity.x, m.gravity.y, m.gravity.z),
                                      userAcceleration: SIMD3(m.userAcceleration.x, m.userAcceleration.y, m.userAcceleration.z))
            Task { @MainActor in
                guard let self, self.isCounting else { return }
                if self.recordMotion { self.recorded.append(sample) }
                if self.counter?.push(sample) == true { WKInterfaceDevice.current().play(.click) }
            }
        }
    }

    /// Digital Crown / buttons. Corrections are kept as training labels.
    func correct(by delta: Int) {
        if counter != nil { counter?.correct(by: delta) } else { manualReps = max(0, manualReps + delta) }
        WKInterfaceDevice.current().play(.click)
    }

    func end() -> (reps: Int, auto: Bool, corrections: Int, recording: MotionRecording?) {
        motion.stopDeviceMotionUpdates(); isCounting = false
        // Label = the count the user confirmed (auto count + Digital Crown corrections).
        let rec = recordMotion && !recorded.isEmpty
            ? MotionRecording(exerciseID: exerciseID, sampleRate: 50, trueReps: reps, autoCount: counter.map { $0.count - $0.corrections },
                              user: Self.anonymousID, source: "watch", samples: recorded)
            : nil
        recorded = []
        return (reps, counter != nil, counter?.corrections ?? 0, rec)
    }

    /// Random per-install id: lets the evaluator count distinct people without identifying anyone.
    static var anonymousID: String {
        if let id = UserDefaults.standard.string(forKey: "forma.anonID") { return id }
        let id = "anon-" + UUID().uuidString.prefix(8); UserDefaults.standard.set(id, forKey: "forma.anonID"); return id
    }
}

/// Watch side of WatchConnectivity.
@MainActor @Observable
final class WatchSessionManager: NSObject, WCSessionDelegate {
    var plan: ActivePlan?
    var onPlan: ((ActivePlan) -> Void)?
    private var dedup = EnvelopeDeduplicator()

    /// Queued file transfer to the iPhone (survives suspension; delivered when reachable).
    func send(recording r: MotionRecording) {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("\(r.exerciseID)-\(Int(Date.now.timeIntervalSince1970)).csv")
        guard (try? r.csv().write(to: url, atomically: true, encoding: .utf8)) != nil else { return }
        WCSession.default.transferFile(url, metadata: ["type": "motionRecording"])
    }

    func activate() { WCSession.default.delegate = self; WCSession.default.activate() }

    func send(_ m: WatchMessage) {
        guard let data = try? Envelope(message: m).encoded() else { return }
        // Completed sets must arrive → queued transfer; also try live for low latency (phone de-dups).
        WCSession.default.transferUserInfo([Envelope.key: data])
        if WCSession.default.isReachable { WCSession.default.sendMessageData(data, replyHandler: nil, errorHandler: nil) }
    }

    private func handle(_ data: Data) {
        guard let env = try? Envelope.decode(data), dedup.accept(env) else { return }
        switch env.message {
        case .plan(let p): plan = p; onPlan?(p)
        case .rest(_, let until): WKInterfaceDevice.current().play(.start); _ = until
        default: break
        }
    }

    nonisolated func session(_ s: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {
        if let data = s.receivedApplicationContext[Envelope.key] as? Data { Task { @MainActor in self.handle(data) } }
    }
    nonisolated func session(_ s: WCSession, didReceiveApplicationContext ctx: [String: Any]) { if let d = ctx[Envelope.key] as? Data { Task { @MainActor in self.handle(d) } } }
    nonisolated func session(_ s: WCSession, didReceiveMessageData data: Data) { Task { @MainActor in self.handle(data) } }
    nonisolated func session(_ s: WCSession, didReceiveUserInfo info: [String: Any]) { if let d = info[Envelope.key] as? Data { Task { @MainActor in self.handle(d) } } }
}
