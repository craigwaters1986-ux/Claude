import Foundation

public enum TrainingGoal: String, Codable, Sendable, CaseIterable {
    case hypertrophy, strength, fatLoss, endurance, general
    /// (compound reps, compound sets, compound rest, isolation reps, isolation sets, isolation rest)
    var scheme: (cr: [Int], cs: Int, crest: Int, ir: [Int], iset: Int, irest: Int) {
        switch self {
        case .hypertrophy: ([6, 10], 3, 120, [10, 15], 3, 75)
        case .strength: ([3, 6], 4, 180, [6, 10], 3, 120)
        case .fatLoss: ([10, 15], 3, 60, [12, 15], 3, 45)
        case .endurance: ([15, 20], 2, 45, [15, 25], 2, 30)
        case .general: ([8, 12], 3, 90, [10, 15], 2, 60)
        }
    }
}

public struct GeneratorInput: Codable, Sendable {
    public var goal: TrainingGoal
    public var durationMinutes: Int
    public var targets: [Muscle]          // empty → choose by recovery
    public var constraints: GenerationConstraints
    public var preferred: Set<String>
    public init(goal: TrainingGoal, durationMinutes: Int, targets: [Muscle], constraints: GenerationConstraints, preferred: Set<String> = []) {
        self.goal = goal; self.durationMinutes = durationMinutes; self.targets = targets; self.constraints = constraints; self.preferred = preferred
    }
}

/// On-device, explainable workout generator (port of prototype/js/core/generator.js,
/// single-session path). Runs offline; also the fallback when the cloud AI fails.
public enum OfflineGenerator {
    public static func estimateMinutes(_ items: [GeneratedPlan.Item], catalog: ExerciseCatalog = .init()) -> Int {
        var s = 0.0
        for (i, it) in items.enumerated() {
            s += 60
            if i == 0, catalog[it.exerciseID]?.mechanics == .compound { s += 180 }
            s += Double(it.sets) * 40 + Double(max(0, it.sets - 1) * it.restSeconds) + Double(it.restSeconds) * 0.5
        }
        return Int((s / 60).rounded())
    }

    public static func generate(_ input: GeneratorInput, recovery: RecoverySnapshot, history: [WorkoutRecord], catalog: ExerciseCatalog = .init()) -> GeneratedPlan {
        let c = input.constraints
        let sch = input.goal.scheme
        var notes: [String] = []
        var targets = input.targets.filter { !c.avoid.contains($0) }
        if targets.isEmpty {
            targets = recovery.muscles.filter { !c.avoid.contains($0.muscle) }.sorted { ($0.percent, -$0.weeklySets) > ($1.percent, -$1.weeklySets) }.prefix(5).map(\.muscle)
            notes.append("No target selected, so the plan uses your most-recovered muscles.")
        }
        let fatigued = targets.filter { recovery[$0].percent < 40 }
        if !fatigued.isEmpty { notes.append("Skipped \(fatigued.map(\.displayName).joined(separator: ", ")) — estimated recovery below 40%."); targets.removeAll { fatigued.contains($0) } }
        if !c.injuries.isEmpty { notes.append("Excluded movements that load restricted joints. Not medical advice — stop if anything hurts.") }

        func allowed(_ e: ExerciseDefinition) -> Bool {
            Set(e.equipment).isSubset(of: c.equipment) && c.injuries.isDisjoint(with: e.stress) && c.avoid.isDisjoint(with: e.primary) && !c.dislikes.contains(e.id)
        }
        var items: [GeneratedPlan.Item] = []; var used = Set<String>(); var session: [Muscle: Int] = [:]
        let ordered = targets.sorted { $0.size > $1.size }
        for pass in [Mechanics.compound, .isolation, .compound] {
            for m in ordered {
                let candidates = catalog.byID.values.filter { !used.contains($0.id) && $0.primary.contains(m) && allowed($0) }
                    .sorted { score($0, pass, input, history) > score($1, pass, input, history) || (score($0, pass, input, history) == score($1, pass, input, history) && $0.id < $1.id) }
                guard let ex = candidates.first else { continue }
                let compound = ex.mechanics == .compound
                var sets = compound ? sch.cs : sch.iset
                if recovery[m].percent < 70 { sets = max(2, sets - 1) }
                for pm in ex.primary {
                    sets = min(sets, c.experience.sessionCap - session[pm, default: 0], c.experience.weeklyCap - Int(recovery[pm].weeklySets) - session[pm, default: 0])
                }
                guard sets >= 2 else { continue }
                let range = compound ? sch.cr : sch.ir
                let advice = ProgressionAdvisor.next(for: ex.id, history: history, repRange: range[0]...range[1], catalog: catalog)
                let item = GeneratedPlan.Item(exerciseID: ex.id, sets: sets, repRange: range, restSeconds: compound ? sch.crest : sch.irest, suggestedWeightKg: advice.weightKg,
                                              rationale: ["Targets \(ex.primary.map(\.displayName).joined(separator: " & ")) (est. \(recovery[m].percent)% recovered).", advice.reason])
                guard estimateMinutes(items + [item], catalog: catalog) <= input.durationMinutes + 2 else { continue }
                items.append(item); used.insert(ex.id)
                for pm in ex.primary { session[pm, default: 0] += sets }
            }
        }
        items.sort { (catalog[$0.exerciseID]?.mechanics == .compound ? 0 : 1) < (catalog[$1.exerciseID]?.mechanics == .compound ? 0 : 1) }
        let name = (input.targets.isEmpty ? "Recovery-guided" : Array(Set(targets.map(\.displayName))).sorted().prefix(3).joined(separator: " · ")) + " — \(input.goal.rawValue.capitalized)"
        return GeneratedPlan(name: name, items: items, notes: notes)
    }

    private static func score(_ e: ExerciseDefinition, _ pass: Mechanics, _ input: GeneratorInput, _ history: [WorkoutRecord]) -> Double {
        var s = 0.0
        if input.preferred.contains(e.id) { s += 3 }
        if e.mechanics == pass { s += 2 }
        if !StrengthAnalytics.history(history, exerciseID: e.id).isEmpty { s += 1 }
        return s
    }
}
