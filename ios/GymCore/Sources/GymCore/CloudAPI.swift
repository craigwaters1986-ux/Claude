import Foundation

/// Wire types for Forma's AI server (server/src/schemas.ts). Contract-tested in
/// both directions against shared fixtures in tests/fixtures/cloud/.
public enum CloudAPI {
    // MARK: Request

    public struct GenerateRequest: Codable, Equatable, Sendable {
        public struct Input: Codable, Equatable, Sendable {
            public var goal: String, experience: String, durationMin: Int, location: String
            public var equipment: [String], target: [String], avoid: [String], injuries: [String], likes: [String], dislikes: [String]
        }
        public var input: Input
        public var context: Context
    }

    public struct Context: Codable, Equatable, Sendable {
        public struct Recovery: Codable, Equatable, Sendable { public var muscle: String; public var estimatedPct: Int; public var weeklySets: Double; public var hoursToReady: Int }
        public struct History: Codable, Equatable, Sendable {
            public struct Session: Codable, Equatable, Sendable { public var date: String; public var sets: [[Double?]] }
            public var exerciseId: String; public var recent: [Session]
        }
        public var units: String = "kg"
        public var recovery: [Recovery]
        public var history: [History]
    }

    public struct CoachRequest: Codable, Equatable, Sendable {
        public struct Turn: Codable, Equatable, Sendable { public var role: String; public var text: String }
        public var question: String; public var transcript: [Turn]; public var context: Context; public var healthConnected: Bool
    }

    /// Server target/avoid lists use muscle *groups*.
    public static func group(for m: Muscle) -> String {
        switch m {
        case .chest: "chest"; case .frontDelts, .sideDelts, .rearDelts: "shoulders"; case .biceps, .triceps, .forearms: "arms"
        case .lats, .upperBack, .traps, .lowerBack: "back"; case .abs, .obliques: "core"
        case .quads, .hamstrings, .glutes, .adductors, .calves: "legs"
        }
    }

    /// A group is avoided server-side only when ALL its muscles are avoided; partial
    /// avoidance (e.g. calves only) is enforced on device by PlanValidator instead.
    public static func avoidGroups(_ avoid: Set<Muscle>) -> [String] {
        Dictionary(grouping: Muscle.allCases, by: group).filter { _, ms in ms.allSatisfy(avoid.contains) }.keys.sorted()
    }

    /// Minimal, privacy-preserving context: no names, no notes, ≤ 4 recent sessions per exercise.
    public static func context(recovery: RecoverySnapshot, history: [WorkoutRecord], includeHistory: Bool) -> Context {
        let rec = recovery.muscles.map { Context.Recovery(muscle: $0.muscle.rawValue, estimatedPct: $0.percent, weeklySets: $0.weeklySets, hoursToReady: $0.hoursToReady) }
        guard includeHistory else { return Context(recovery: rec, history: []) }
        let fmt = DateFormatter(); fmt.calendar = Calendar(identifier: .iso8601); fmt.locale = Locale(identifier: "en_US_POSIX"); fmt.timeZone = TimeZone(identifier: "UTC"); fmt.dateFormat = "yyyy-MM-dd"
        let ids = Array(Set(history.flatMap { $0.exercises.map(\.exerciseID) })).sorted().prefix(40)
        let hist = ids.map { id in
            Context.History(exerciseId: id, recent: StrengthAnalytics.history(history, exerciseID: id).prefix(4).map { s in
                .init(date: fmt.string(from: s.date), sets: s.sets.map { [$0.weightKg, $0.reps.map(Double.init), $0.rpe] })
            })
        }
        return Context(recovery: rec, history: Array(hist))
    }

    public static func generateRequest(_ g: GeneratorInput, location: String, likes: [String], recovery: RecoverySnapshot, history: [WorkoutRecord], includeHistory: Bool) -> GenerateRequest {
        let c = g.constraints
        return GenerateRequest(
            input: .init(goal: g.goal.rawValue, experience: c.experience.rawValue, durationMin: g.durationMinutes, location: location,
                         equipment: c.equipment.map(\.rawValue).sorted(), target: Array(Set(g.targets.map(group))).sorted(),
                         avoid: avoidGroups(c.avoid), injuries: c.injuries.map(\.rawValue).sorted(),
                         likes: likes.sorted(), dislikes: c.dislikes.sorted()),
            context: context(recovery: recovery, history: history, includeHistory: includeHistory))
    }

    // MARK: Response

    public struct GenerateResponse: Decodable, Sendable {
        public struct Plan: Decodable, Sendable {
            public struct Exercise: Decodable, Sendable {
                public var exerciseId: String; public var sets: Int; public var reps: [Int]; public var restSec: Int
                public var suggestedWeightKg: Double?; public var why: [String]
            }
            public var name: String; public var exercises: [Exercise]; public var notes: [String]
        }
        public var plan: Plan
        public var issues: [String]

        /// Convert to the app's plan type (then ALWAYS run PlanValidator on device).
        public var generatedPlan: GeneratedPlan {
            GeneratedPlan(name: plan.name, items: plan.exercises.map {
                .init(exerciseID: $0.exerciseId, sets: $0.sets, repRange: $0.reps, restSeconds: $0.restSec, suggestedWeightKg: $0.suggestedWeightKg, rationale: $0.why)
            }, notes: plan.notes)
        }
    }

    public struct CoachResponse: Decodable, Sendable { public var text: String; public var grounded: [String] }
}
