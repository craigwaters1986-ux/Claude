import Foundation
import SwiftData
import Network
import Security
import CryptoKit
import BackgroundTasks
import AuthenticationServices
import GymCore

/// Session token storage (Keychain, this device only).
enum Keychain {
    private static let service = "app.forma.session"
    static func set(_ value: String?) {
        let base: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service]
        SecItemDelete(base as CFDictionary)
        guard let value else { return }
        var add = base; add[kSecValueData as String] = Data(value.utf8); add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        SecItemAdd(add as CFDictionary, nil)
    }
    static func get() -> String? {
        let q: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecReturnData as String: true, kSecMatchLimit as String: kSecMatchLimitOne]
        var out: AnyObject?
        guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let d = out as? Data else { return nil }
        return String(decoding: d, as: UTF8.self)
    }
}

/// Accounts (Sign in with Apple) + offline-first sync with the Forma server.
/// Uses GymCore.SyncEngine (tested) for change detection and conflict handling.
@MainActor @Observable
final class SyncService {
    static let shared = SyncService()
    static let backgroundTaskID = "app.forma.sync"

    var baseURL = URL(string: UserDefaults.standard.string(forKey: "forma.server") ?? "https://api.forma.app")!
    private(set) var isSignedIn = Keychain.get() != nil
    private(set) var lastSync: Date? = UserDefaults.standard.object(forKey: "forma.lastSync") as? Date
    private(set) var lastError: String?
    private var running = false
    private let monitor = NWPathMonitor()
    private var pendingNonce: String?

    private struct State: Codable { var cursor: Int64 = 0; var meta: SyncEngine.Meta = [:] }
    private var stateURL: URL { FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("sync-state.json") }
    private func loadState() -> State { (try? JSONDecoder().decode(State.self, from: Data(contentsOf: stateURL))) ?? State() }
    private func saveState(_ s: State) { try? JSONEncoder().encode(s).write(to: stateURL, options: .atomic) }

    // MARK: Sign in with Apple

    /// Configure the ASAuthorizationAppleIDRequest (SignInWithAppleButton onRequest).
    func prepare(_ request: ASAuthorizationAppleIDRequest) {
        let raw = UUID().uuidString + UUID().uuidString
        pendingNonce = raw
        request.requestedScopes = []                                  // no name/email needed
        request.nonce = SHA256.hash(data: Data(raw.utf8)).map { String(format: "%02x", $0) }.joined()
    }

    func complete(_ result: Result<ASAuthorization, Error>, context: ModelContext) async {
        guard case .success(let auth) = result, let cred = auth.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = cred.identityToken, let token = String(data: tokenData, encoding: .utf8) else { lastError = "Sign in was cancelled."; return }
        do {
            struct Resp: Decodable { var token: String; var userId: String }
            let r: Resp = try await post("v1/auth/apple", ["identityToken": token, "nonce": pendingNonce ?? ""], auth: false)
            Keychain.set(r.token); isSignedIn = true
            saveState(State())                                        // fresh account link → full sync
            await sync(context: context)
        } catch { lastError = "Couldn't sign in: \(error.localizedDescription)" }
    }

    func signOut() { Keychain.set(nil); isSignedIn = false; saveState(State()) }

    func deleteAccount() async {
        do { _ = try await request("v1/account", method: "DELETE", body: Optional<Data>.none); signOut() }
        catch { lastError = "Couldn't delete the cloud account: \(error.localizedDescription)" }
    }

    // MARK: Triggers

    func start(container: ModelContainer) {
        monitor.pathUpdateHandler = { [weak self] path in
            guard path.status == .satisfied else { return }
            Task { @MainActor in await self?.sync(context: ModelContext(container)) }
        }
        monitor.start(queue: .global(qos: .utility))
        BGTaskScheduler.shared.register(forTaskWithIdentifier: Self.backgroundTaskID, using: nil) { task in
            Task { @MainActor in
                await SyncService.shared.sync(context: ModelContext(container))
                task.setTaskCompleted(success: SyncService.shared.lastError == nil)
                SyncService.shared.scheduleBackground()
            }
        }
        scheduleBackground()
    }

    func scheduleBackground() {
        let r = BGAppRefreshTaskRequest(identifier: Self.backgroundTaskID)
        r.earliestBeginDate = .now.addingTimeInterval(30 * 60)
        try? BGTaskScheduler.shared.submit(r)
    }

    // MARK: Sync round

    func sync(context: ModelContext) async {
        guard isSignedIn, !running else { return }
        running = true; defer { running = false }
        let repo = WorkoutRepository(context: context)
        let engine = SyncEngine()
        var state = loadState()
        do {
            let pushed = engine.collect(entities: try repo.syncEntities(), meta: state.meta, now: Int64(Date.now.timeIntervalSince1970 * 1000))
            var outgoing = pushed
            var res: SyncResponse
            repeat {
                res = try await post("v1/sync", SyncRequest(cursor: state.cursor, changes: outgoing))
                let (actions, meta) = engine.reconcile(remote: res.changes, pushed: outgoing, meta: state.meta)
                try repo.apply(actions)
                state.meta = meta; state.cursor = res.cursor; outgoing = []
                saveState(state)
            } while res.more
            if !res.stale.isEmpty { state.cursor = 0; saveState(state); running = false; await sync(context: context); return }
            try repo.clearOutbox()
            lastSync = .now; lastError = nil
            UserDefaults.standard.set(lastSync, forKey: "forma.lastSync")
        } catch HTTPError.status(401) {
            signOut(); lastError = "Your session expired — please sign in again."
        } catch {
            lastError = "Sync will retry: \(error.localizedDescription)"     // changes stay local and are retried
        }
    }

    // MARK: HTTP

    enum HTTPError: Error { case status(Int) }

    private func request(_ path: String, method: String, body: Data?, auth: Bool = true) async throws -> Data {
        var r = URLRequest(url: baseURL.appendingPathComponent(path)); r.httpMethod = method; r.timeoutInterval = 30
        r.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if auth, let t = Keychain.get() { r.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization") }
        r.httpBody = body
        let (data, resp) = try await URLSession.shared.data(for: r)
        let code = (resp as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(code) else { throw HTTPError.status(code) }
        return data
    }

    private func post<B: Encodable, R: Decodable>(_ path: String, _ body: B, auth: Bool = true) async throws -> R {
        try JSONDecoder().decode(R.self, from: try await request(path, method: "POST", body: try JSONEncoder().encode(body), auth: auth))
    }
}

// MARK: - Repository ↔ sync entities

extension WorkoutRepository {
    /// Entities keyed "kind:id" (same kinds as the server and web client).
    func syncEntities() throws -> [String: JSONValue] {
        var out: [String: JSONValue] = [:]
        for w in completedWorkouts() { out["workout:\(w.id.uuidString)"] = try JSONValue.from(w) }
        for t in try context.fetch(FetchDescriptor<TemplateEntity>()) {
            struct T: Codable { var id: UUID; var name: String; var items: [TemplateItem] }
            out["template:\(t.id.uuidString)"] = try JSONValue.from(T(id: t.id, name: t.name, items: t.items))
        }
        for c in try context.fetch(FetchDescriptor<CustomExerciseEntity>()) { out["customExercise:\(c.id)"] = try JSONValue.from(c.definition) }
        let p = profile()
        out["profile:me"] = .object(["goal": .string(p.goal), "experience": .string(p.experience), "units": .string(p.unitsRaw),
                                     "durationMin": .number(Double(p.durationMinutes)), "restDefaultSec": .number(Double(p.restDefaultSeconds)),
                                     "equipment": .array(p.equipment.map { .string($0) }), "injuries": .array(p.injuries.map { .string($0) })])
        return out
    }

    /// Applies server changes WITHOUT writing outbox entries (they came from the server).
    func apply(_ actions: [SyncEngine.Action]) throws {
        for a in actions {
            switch a {
            case .upsert("workout", _, let payload):
                let rec = try payload.decode(WorkoutRecord.self); let id = rec.id
                if let e = try context.fetch(FetchDescriptor<WorkoutEntity>(predicate: #Predicate { $0.id == id })).first { try e.update(from: rec); e.isDeleted = false }
                else { context.insert(try WorkoutEntity(record: rec)) }
            case .delete("workout", let idString):
                guard let id = UUID(uuidString: idString) else { continue }
                try context.delete(model: WorkoutEntity.self, where: #Predicate { $0.id == id })
            case .upsert("template", _, let payload):
                struct T: Codable { var id: UUID; var name: String; var items: [TemplateItem] }
                let t = try payload.decode(T.self); let id = t.id
                try context.delete(model: TemplateEntity.self, where: #Predicate { $0.id == id })
                context.insert(TemplateEntity(id: t.id, name: t.name, items: t.items))
            case .delete("template", let idString):
                guard let id = UUID(uuidString: idString) else { continue }
                try context.delete(model: TemplateEntity.self, where: #Predicate { $0.id == id })
            case .upsert("customExercise", let id, let payload):
                try context.delete(model: CustomExerciseEntity.self, where: #Predicate { $0.id == id })
                context.insert(CustomExerciseEntity(try payload.decode(ExerciseDefinition.self)))
            case .delete("customExercise", let id):
                try context.delete(model: CustomExerciseEntity.self, where: #Predicate { $0.id == id })
            case .upsert("profile", _, .object(let o)):
                let p = profile()
                if case .string(let v)? = o["goal"] { p.goal = v }
                if case .string(let v)? = o["experience"] { p.experience = v }
                if case .string(let v)? = o["units"] { p.unitsRaw = v }
                if case .number(let v)? = o["durationMin"] { p.durationMinutes = Int(v) }
                if case .number(let v)? = o["restDefaultSec"] { p.restDefaultSeconds = Int(v) }
                if case .array(let a)? = o["equipment"] { p.equipment = a.compactMap { if case .string(let s) = $0 { s } else { nil } } }
                if case .array(let a)? = o["injuries"] { p.injuries = a.compactMap { if case .string(let s) = $0 { s } else { nil } } }
            default: continue
            }
        }
        try context.save()
    }

    func clearOutbox() throws { try context.delete(model: OutboxEntity.self); try context.save() }
}
