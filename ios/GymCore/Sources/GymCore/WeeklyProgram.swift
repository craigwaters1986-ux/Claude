import Foundation

/// Weekly programme generation (port of generateProgram in prototype/js/core/generator.js).
public enum TrainingSplit: String, Codable, Sendable, CaseIterable {
    case fullBody, upperLower, ppl

    public var label: String { switch self { case .fullBody: "Full body"; case .upperLower: "Upper / Lower"; case .ppl: "Push / Pull / Legs" } }

    public var days: [(name: String, muscles: [Muscle])] {
        switch self {
        case .fullBody: [("Full Body", [.chest, .lats, .upperBack, .quads, .hamstrings, .frontDelts, .sideDelts, .biceps, .triceps, .abs])]
        case .upperLower: [("Upper", [.chest, .lats, .upperBack, .frontDelts, .sideDelts, .rearDelts, .biceps, .triceps]),
                           ("Lower", [.quads, .hamstrings, .glutes, .calves, .abs, .adductors])]
        case .ppl: [("Push", [.chest, .frontDelts, .sideDelts, .triceps]), ("Pull", [.lats, .upperBack, .rearDelts, .biceps, .traps]),
                    ("Legs", [.quads, .hamstrings, .glutes, .calves, .abs])]
        }
    }

    /// 2–3 days → full body, 4 → upper/lower, 5–6 → push/pull/legs.
    public static func auto(daysPerWeek: Int) -> TrainingSplit { daysPerWeek <= 3 ? .fullBody : daysPerWeek == 4 ? .upperLower : .ppl }
}

public struct WeeklyProgram: Sendable {
    public let split: TrainingSplit
    public let sessions: [GeneratedPlan]
    public let weeklySets: [Muscle: Int]
    public let rationale: [String]
}

extension OfflineGenerator {
    /// Future days assume recovery between sessions, but hard sets accumulate
    /// across the week so each muscle stays within the experience-level cap.
    public static func program(_ input: GeneratorInput, daysPerWeek: Int, split: TrainingSplit? = nil, history: [WorkoutRecord], catalog: ExerciseCatalog = .init()) -> WeeklyProgram {
        let days = min(6, max(2, daysPerWeek))
        let s = split ?? .auto(daysPerWeek: days)
        var planned: [Muscle: Int] = [:]
        var sessions: [GeneratedPlan] = []
        for d in 0..<days {
            let day = s.days[d % s.days.count]
            let wanted = input.targets.isEmpty ? day.muscles : day.muscles.filter(input.targets.contains)
            var dayInput = input; dayInput.targets = wanted.isEmpty ? day.muscles : wanted
            // Fresh recovery for future days, with this week's already-planned sets counted toward the cap.
            let snapshot = RecoverySnapshot(
                muscles: Muscle.allCases.map { MuscleRecovery(muscle: $0, percent: 100, status: .ready, hoursToReady: 0, hoursToFull: 0, lastTrained: nil, weeklySets: Double(planned[$0] ?? 0), tauHours: $0.tauHours) },
                overall: 100, healthFactor: 1, healthReasons: [])
            var plan = generate(dayInput, recovery: snapshot, history: history, catalog: catalog)
            plan.name = "Day \(d + 1): \(day.name) — \(input.goal.rawValue.capitalized)"
            plan.notes.removeAll { $0.hasPrefix("No target selected") }
            for item in plan.items { for m in catalog[item.exerciseID]?.primary ?? [] { planned[m, default: 0] += item.sets } }
            sessions.append(plan)
        }
        let perMuscle = days >= 4 && s != .fullBody ? "about twice" : "\(min(days, 3))×"
        return WeeklyProgram(split: s, sessions: sessions, weeklySets: planned, rationale: [
            "\(s.label) fits \(days) training days: each muscle is trained \(perMuscle) per week.",
            "Weekly hard sets per muscle are capped at \(input.constraints.experience.weeklyCap) for your experience level to limit overtraining risk.",
        ])
    }
}
