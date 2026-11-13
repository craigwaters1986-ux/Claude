import Foundation

/// Messages exchanged between iPhone and Apple Watch over WatchConnectivity.
///
/// Transport rules (implemented in PhoneSessionManager / WatchSessionManager):
///  • Live, reachable  → `sendMessageData` (low latency, drops if unreachable).
///  • Must arrive      → `transferUserInfo` (queued, delivered in order, survives
///                        app suspension) — used for completed sets & workouts.
///  • Latest state     → `updateApplicationContext` (only newest value kept) —
///                        used for the "current plan" the watch should show.
/// Every message carries an id + timestamp so the receiver can de-duplicate
/// (a message may arrive via both live and queued channels).
public enum WatchMessage: Codable, Sendable, Equatable {
    /// Phone → Watch: the plan for the active workout.
    case plan(ActivePlan)
    /// Watch → Phone: a set was finished on the wrist.
    case setCompleted(SetResult)
    /// Watch → Phone: the user corrected the rep count (training label).
    case repCorrection(exerciseID: String, setIndex: Int, autoCount: Int, finalCount: Int)
    /// Either direction: workout lifecycle.
    case workoutStarted(workoutID: UUID, at: Date)
    case workoutEnded(workoutID: UUID, at: Date, activeEnergyKcal: Double?, avgHeartRate: Double?)
    /// Phone → Watch: start a rest timer.
    case rest(seconds: Int, until: Date)
}

public struct ActivePlan: Codable, Sendable, Equatable {
    public struct Item: Codable, Sendable, Equatable {
        public var exerciseID: String; public var name: String
        public var targetSets: [Target]; public var autoCount: Bool
        public init(exerciseID: String, name: String, targetSets: [Target], autoCount: Bool) { self.exerciseID = exerciseID; self.name = name; self.targetSets = targetSets; self.autoCount = autoCount }
    }
    public struct Target: Codable, Sendable, Equatable {
        public var weightKg: Double?; public var reps: Int?; public var done: Bool
        public init(weightKg: Double?, reps: Int?, done: Bool) { self.weightKg = weightKg; self.reps = reps; self.done = done }
    }
    public var workoutID: UUID
    public var name: String
    public var items: [Item]
    public var units: Units
    /// User opted in to contributing labelled motion recordings (Profile → Help improve rep counting).
    public var recordMotion: Bool?
    public init(workoutID: UUID, name: String, items: [Item], units: Units, recordMotion: Bool? = nil) { self.workoutID = workoutID; self.name = name; self.items = items; self.units = units; self.recordMotion = recordMotion }

    public static func from(_ w: WorkoutRecord, units: Units, recordMotion: Bool = false, catalog: ExerciseCatalog = .init()) -> ActivePlan {
        ActivePlan(workoutID: w.id, name: w.name, items: w.exercises.map { e in
            let def = catalog[e.exerciseID]
            return Item(exerciseID: e.exerciseID, name: def?.name ?? "Exercise", targetSets: e.sets.map { .init(weightKg: $0.weightKg, reps: $0.reps, done: $0.isDone) },
                        autoCount: def.flatMap(RepProfile.forExercise) != nil)
        }, units: units, recordMotion: recordMotion)
    }
}

public struct SetResult: Codable, Sendable, Equatable {
    public var workoutID: UUID
    public var exerciseID: String
    public var setIndex: Int
    public var reps: Int
    public var weightKg: Double?
    public var autoCounted: Bool
    public var corrections: Int
    public var averageHeartRate: Double?
    public var completedAt: Date
    public init(workoutID: UUID, exerciseID: String, setIndex: Int, reps: Int, weightKg: Double?, autoCounted: Bool, corrections: Int, averageHeartRate: Double?, completedAt: Date) {
        self.workoutID = workoutID; self.exerciseID = exerciseID; self.setIndex = setIndex; self.reps = reps; self.weightKg = weightKg
        self.autoCounted = autoCounted; self.corrections = corrections; self.averageHeartRate = averageHeartRate; self.completedAt = completedAt
    }
}

public struct Envelope: Codable, Sendable, Equatable {
    public var id: UUID
    public var sentAt: Date
    public var message: WatchMessage
    public init(id: UUID = UUID(), sentAt: Date = .now, message: WatchMessage) { self.id = id; self.sentAt = sentAt; self.message = message }

    public static let key = "forma.envelope"
    public func encoded() throws -> Data { let e = JSONEncoder(); e.dateEncodingStrategy = .millisecondsSince1970; return try e.encode(self) }
    public static func decode(_ data: Data) throws -> Envelope { let d = JSONDecoder(); d.dateDecodingStrategy = .millisecondsSince1970; return try d.decode(Envelope.self, from: data) }
}

/// De-duplicates envelopes that arrive through more than one channel.
public struct EnvelopeDeduplicator: Sendable {
    private var seen: [UUID] = []
    private let capacity: Int
    public init(capacity: Int = 256) { self.capacity = capacity }
    public mutating func accept(_ e: Envelope) -> Bool {
        guard !seen.contains(e.id) else { return false }
        seen.append(e.id); if seen.count > capacity { seen.removeFirst(seen.count - capacity) }
        return true
    }
}

extension WorkoutRecord {
    /// Applies a watch-completed set idempotently (same set index overwrites).
    public mutating func apply(_ r: SetResult) {
        guard r.workoutID == id, let i = exercises.firstIndex(where: { $0.exerciseID == r.exerciseID }) else { return }
        while exercises[i].sets.count <= r.setIndex { exercises[i].sets.append(LoggedSet(weightKg: r.weightKg)) }
        exercises[i].sets[r.setIndex].reps = r.reps
        if exercises[i].sets[r.setIndex].weightKg == nil { exercises[i].sets[r.setIndex].weightKg = r.weightKg }
        exercises[i].sets[r.setIndex].isDone = true
        exercises[i].sets[r.setIndex].completedAt = r.completedAt
    }
}
