import Foundation

// MARK: - Muscles

public enum Muscle: String, CaseIterable, Codable, Sendable, Identifiable {
    case chest, frontDelts, sideDelts, rearDelts, biceps, triceps, forearms
    case abs, obliques, traps, lats, upperBack, lowerBack
    case glutes, quads, hamstrings, adductors, calves

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .chest: "Chest"; case .frontDelts: "Front Delts"; case .sideDelts: "Side Delts"; case .rearDelts: "Rear Delts"
        case .biceps: "Biceps"; case .triceps: "Triceps"; case .forearms: "Forearms"; case .abs: "Abs"; case .obliques: "Obliques"
        case .traps: "Traps"; case .lats: "Lats"; case .upperBack: "Upper Back"; case .lowerBack: "Lower Back"
        case .glutes: "Glutes"; case .quads: "Quads"; case .hamstrings: "Hamstrings"; case .adductors: "Adductors"; case .calves: "Calves"
        }
    }

    /// Fatigue-decay time constant (hours). Configurable heuristic, NOT a validated constant.
    public var tauHours: Double {
        switch self {
        case .chest, .lats: 26; case .frontDelts, .triceps, .traps: 22; case .sideDelts, .rearDelts, .biceps: 20
        case .forearms, .abs: 16; case .obliques, .calves: 18; case .upperBack: 24; case .lowerBack: 36
        case .glutes: 30; case .quads: 32; case .hamstrings: 34; case .adductors: 26
        }
    }

    /// Relative weight in the overall recovery score.
    public var size: Double {
        switch self {
        case .quads: 4; case .chest, .lats, .glutes, .hamstrings: 3; case .upperBack: 2
        case .triceps, .abs, .traps, .lowerBack, .adductors, .calves: 1.5
        default: 1
        }
    }
}

// MARK: - Exercises

public enum Equipment: String, Codable, CaseIterable, Sendable { case barbell, dumbbell, cable, machine, bench, rack, pullupBar, dipStation }
public enum JointStress: String, Codable, CaseIterable, Sendable { case shoulder, knee, lowerBack, wrist, elbow }
public enum WatchSupport: String, Codable, Sendable { case supported, experimental, unsupported }
public enum Mechanics: String, Codable, Sendable { case compound, isolation }

public struct ExerciseDefinition: Codable, Hashable, Sendable, Identifiable {
    public var id: String
    public var name: String
    public var primary: [Muscle]
    public var secondary: [Muscle]
    public var equipment: [Equipment]
    public var pattern: String
    public var mechanics: Mechanics
    public var incrementKg: Double
    public var stress: [JointStress]
    public var watch: WatchSupport
    public var isCustom: Bool

    public init(id: String, name: String, primary: [Muscle], secondary: [Muscle] = [], equipment: [Equipment] = [], pattern: String,
                mechanics: Mechanics = .compound, incrementKg: Double = 2.5, stress: [JointStress] = [], watch: WatchSupport = .unsupported, isCustom: Bool = false) {
        self.id = id; self.name = name; self.primary = primary; self.secondary = secondary; self.equipment = equipment
        self.pattern = pattern; self.mechanics = mechanics; self.incrementKg = incrementKg; self.stress = stress; self.watch = watch; self.isCustom = isCustom
    }
}

// MARK: - Logged training (value types used by the engines)

public enum SetKind: String, Codable, Sendable { case warmup, working, drop, failure }

public struct LoggedSet: Codable, Hashable, Sendable, Identifiable {
    public var id: UUID
    public var kind: SetKind
    public var weightKg: Double?
    public var reps: Int?
    public var rpe: Double?
    public var rir: Double?
    public var isDone: Bool
    public var completedAt: Date?

    public init(id: UUID = UUID(), kind: SetKind = .working, weightKg: Double? = nil, reps: Int? = nil, rpe: Double? = nil, rir: Double? = nil, isDone: Bool = false, completedAt: Date? = nil) {
        self.id = id; self.kind = kind; self.weightKg = weightKg; self.reps = reps; self.rpe = rpe; self.rir = rir; self.isDone = isDone; self.completedAt = completedAt
    }

    /// Reps in reserve from RIR, or derived from RPE (RIR = 10 − RPE).
    public var effectiveRIR: Double? { rir ?? rpe.map { max(0, 10 - $0) } }
    public var countsAsHardSet: Bool { isDone && kind != .warmup }
    public var volumeKg: Double { (weightKg ?? 0) * Double(reps ?? 0) }
}

public struct LoggedExercise: Codable, Hashable, Sendable, Identifiable {
    public var id: UUID
    public var exerciseID: String
    public var sets: [LoggedSet]
    public var supersetGroup: UUID?
    public var restSeconds: Int?
    public var notes: String

    public init(id: UUID = UUID(), exerciseID: String, sets: [LoggedSet] = [], supersetGroup: UUID? = nil, restSeconds: Int? = nil, notes: String = "") {
        self.id = id; self.exerciseID = exerciseID; self.sets = sets; self.supersetGroup = supersetGroup; self.restSeconds = restSeconds; self.notes = notes
    }
    public var workingSets: [LoggedSet] { sets.filter(\.countsAsHardSet) }
}

public struct WorkoutRecord: Codable, Hashable, Sendable, Identifiable {
    public var id: UUID
    public var name: String
    public var startedAt: Date
    public var endedAt: Date?
    public var exercises: [LoggedExercise]
    public var notes: String

    public init(id: UUID = UUID(), name: String, startedAt: Date = .now, endedAt: Date? = nil, exercises: [LoggedExercise] = [], notes: String = "") {
        self.id = id; self.name = name; self.startedAt = startedAt; self.endedAt = endedAt; self.exercises = exercises; self.notes = notes
    }
    public var volumeKg: Double { exercises.flatMap(\.workingSets).reduce(0) { $0 + $1.volumeKg } }
    public var hardSetCount: Int { exercises.reduce(0) { $0 + $1.workingSets.count } }
}

public enum Units: String, Codable, Sendable {
    case kg, lb
    public static let kgPerLb = 0.45359237
    public func display(_ kg: Double) -> Double { self == .kg ? (kg * 100).rounded() / 100 : ((kg / Units.kgPerLb) * 2).rounded() / 2 }
    public func toKg(_ value: Double) -> Double { self == .kg ? value : value * Units.kgPerLb }
}
