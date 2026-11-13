import Foundation

/// A generated workout (from the on-device engine or the cloud AI).
public struct GeneratedPlan: Codable, Sendable, Equatable {
    public struct Item: Codable, Sendable, Equatable {
        public var exerciseID: String
        public var sets: Int
        public var repRange: [Int]
        public var restSeconds: Int
        public var suggestedWeightKg: Double?
        public var rationale: [String]
        public init(exerciseID: String, sets: Int, repRange: [Int], restSeconds: Int, suggestedWeightKg: Double? = nil, rationale: [String] = []) {
            self.exerciseID = exerciseID; self.sets = sets; self.repRange = repRange; self.restSeconds = restSeconds; self.suggestedWeightKg = suggestedWeightKg; self.rationale = rationale
        }
    }
    public var name: String
    public var items: [Item]
    public var notes: [String]
    public init(name: String, items: [Item], notes: [String] = []) { self.name = name; self.items = items; self.notes = notes }
}

public enum Experience: String, Codable, Sendable, CaseIterable {
    case beginner, intermediate, advanced
    public var sessionCap: Int { switch self { case .beginner: 6; case .intermediate: 9; case .advanced: 12 } }
    public var weeklyCap: Int { switch self { case .beginner: 10; case .intermediate: 16; case .advanced: 20 } }
}

public struct GenerationConstraints: Codable, Sendable {
    public var experience: Experience
    public var equipment: Set<Equipment>
    public var injuries: Set<JointStress>
    public var avoid: Set<Muscle>
    public var dislikes: Set<String>
    public init(experience: Experience, equipment: Set<Equipment>, injuries: Set<JointStress> = [], avoid: Set<Muscle> = [], dislikes: Set<String> = []) {
        self.experience = experience; self.equipment = equipment; self.injuries = injuries; self.avoid = avoid; self.dislikes = dislikes
    }
}

/// Safety layer applied to EVERY plan before it is shown — including cloud AI output.
/// Removes unknown / hallucinated exercises, injury and equipment conflicts,
/// caps sets and per-muscle session volume, and clamps unrealistic weights.
public enum PlanValidator {
    public struct Result: Sendable { public let plan: GeneratedPlan; public let issues: [String] }

    public static func validate(_ plan: GeneratedPlan, constraints c: GenerationConstraints, history: [WorkoutRecord], catalog: ExerciseCatalog = .init()) -> Result {
        var issues: [String] = []; var kept: [GeneratedPlan.Item] = []; var perMuscle: [Muscle: Int] = [:]
        for var item in plan.items {
            guard let ex = catalog[item.exerciseID] else { issues.append("Removed unknown exercise “\(item.exerciseID)”."); continue }
            if !Set(ex.equipment).isSubset(of: c.equipment) || !c.injuries.isDisjoint(with: ex.stress) || !c.avoid.isDisjoint(with: ex.primary) || c.dislikes.contains(ex.id) {
                issues.append("Removed \(ex.name): conflicts with equipment, injuries or preferences."); continue
            }
            let clamped = min(max(item.sets, 1), 6)
            if clamped != item.sets { issues.append("Clamped \(ex.name) to \(clamped) sets.") }
            item.sets = ex.primary.reduce(clamped) { min($0, c.experience.sessionCap - perMuscle[$1, default: 0]) }
            guard item.sets >= 1 else { issues.append("Removed \(ex.name): session volume cap reached."); continue }
            if let w = item.suggestedWeightKg {
                let recent = StrengthAnalytics.history(history, exerciseID: ex.id).prefix(5)
                if recent.isEmpty { issues.append("Removed weight suggestion for \(ex.name): no history to base it on."); item.suggestedWeightKg = nil }
                else if let best = recent.map(\.topWeight).max(), w > best * 1.1 {
                    item.suggestedWeightKg = (best * 1.1 * 2).rounded() / 2
                    issues.append("Capped \(ex.name) at +10% over your recent best.")
                }
            }
            for m in ex.primary { perMuscle[m, default: 0] += item.sets }
            kept.append(item)
        }
        return Result(plan: GeneratedPlan(name: plan.name, items: kept, notes: plan.notes), issues: issues)
    }
}
