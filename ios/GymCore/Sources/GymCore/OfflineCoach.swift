import Foundation

/// On-device training assistant (port of prototype/js/core/coach.js). Answers
/// only from logged workouts and estimated recovery; says so when data is missing.
public enum OfflineCoach {
    public struct Answer: Sendable {
        public let text: String
        public let grounded: [String]          // data sources used: "history", "recovery", "library", "health"
        public let plan: GeneratedPlan?
    }

    public struct Context: Sendable {
        public var history: [WorkoutRecord]
        public var recovery: RecoverySnapshot
        public var constraints: GenerationConstraints
        public var goal: TrainingGoal
        public var durationMinutes: Int
        public var healthConnected: Bool
        public var catalog: ExerciseCatalog
        public init(history: [WorkoutRecord], recovery: RecoverySnapshot, constraints: GenerationConstraints, goal: TrainingGoal, durationMinutes: Int, healthConnected: Bool, catalog: ExerciseCatalog = .init()) {
            self.history = history; self.recovery = recovery; self.constraints = constraints; self.goal = goal; self.durationMinutes = durationMinutes; self.healthConnected = healthConnected; self.catalog = catalog
        }
    }

    static let aliases: [String: String] = ["bench press": "bench", "bench": "bench", "barbell squats": "squat", "barbell squat": "squat", "back squat": "squat", "squats": "squat", "squat": "squat",
        "deadlifts": "deadlift", "deadlift": "deadlift", "overhead press": "ohp", "ohp": "ohp", "shoulder press": "dbShoulderPress", "rows": "row", "row": "row",
        "pull-ups": "pullup", "pull ups": "pullup", "pullups": "pullup", "curls": "dbCurl", "curl": "dbCurl", "rdl": "rdl", "leg press": "legPress", "lat pulldown": "latPulldown", "dips": "dip"]
    static let muscleWords: [String: [Muscle]] = ["chest": [.chest], "triceps": [.triceps], "biceps": [.biceps], "arms": [.biceps, .triceps, .forearms],
        "shoulders": [.frontDelts, .sideDelts, .rearDelts], "back": [.lats, .upperBack], "lats": [.lats], "legs": [.quads, .hamstrings, .glutes, .calves],
        "quads": [.quads], "hamstrings": [.hamstrings], "glutes": [.glutes], "calves": [.calves], "abs": [.abs], "core": [.abs, .obliques]]

    static func has(_ s: String, _ pattern: String) -> Bool { s.range(of: pattern, options: [.regularExpression, .caseInsensitive]) != nil }

    public static func findExercise(_ text: String, catalog: ExerciseCatalog = .init()) -> ExerciseDefinition? {
        let t = text.lowercased()
        if let byName = catalog.byID.values.sorted(by: { $0.name.count > $1.name.count }).first(where: { t.contains($0.name.lowercased()) }) { return byName }
        let key = aliases.keys.sorted { $0.count > $1.count }.first { has(t, "\\b\(NSRegularExpression.escapedPattern(for: $0))\\b") }
        return key.flatMap { catalog[aliases[$0]!] }
    }

    public static func answer(_ question: String, _ c: Context) -> Answer {
        let q = question.lowercased()
        let hist = c.history

        if has(q, #"\b(sleep|hrv|heart rate|resting hr)\b"#) {
            return Answer(text: c.healthConnected ? "Apple Health signals only adjust your recovery estimates slightly (at most 30%). I don't read individual readings here." : "I don't have access to Apple Health data — it isn't connected. Recovery estimates use your training log only.", grounded: c.healthConnected ? ["health"] : [], plan: nil)
        }
        if has(q, #"\b(build|create|make|generate|plan)\b.*\b(workout|session)\b"#) {
            let muscles = Array(Set(muscleWords.filter { has(q, "\\b\($0.key)\\b") }.flatMap(\.value)))
            let minutes = q.range(of: #"(\d{2,3})\s*-?\s*min"#, options: .regularExpression).flatMap { Int(q[$0].filter(\.isNumber)) } ?? c.durationMinutes
            let plan = OfflineGenerator.generate(.init(goal: c.goal, durationMinutes: minutes, targets: muscles, constraints: c.constraints), recovery: c.recovery, history: hist, catalog: c.catalog)
            return Answer(text: "Here's a \(minutes)-minute workout (≈\(OfflineGenerator.estimateMinutes(plan.items, catalog: c.catalog)) min). \(plan.notes.joined(separator: " "))", grounded: ["history", "recovery"], plan: plan)
        }
        if has(q, #"train today|what (muscles?|should).*(train|work|hit)"#) {
            guard !hist.isEmpty else { return Answer(text: "You haven't logged any workouts yet, so everything is assumed fresh — a full-body session is a great start.", grounded: [], plan: nil) }
            let ready = c.recovery.muscles.filter { $0.status == .ready }.sorted { $0.weeklySets < $1.weeklySets }.prefix(5).map(\.muscle.displayName)
            let tired = c.recovery.muscles.filter { $0.status == .caution || $0.status == .fatigued }.map { "\($0.muscle.displayName.lowercased()) (\($0.percent)%)" }
            return Answer(text: "Best candidates today: \(ready.joined(separator: ", ")) — estimated ≥90% recovered. \(tired.isEmpty ? "" : "Give \(tired.joined(separator: ", ")) more time. ")Overall estimated recovery: \(c.recovery.overall)%. (Estimates, not measurements.)", grounded: ["recovery", "history"], plan: nil)
        }
        if has(q, #"alternative|instead of|replace|substitute|swap"#) {
            guard let ex = findExercise(q, catalog: c.catalog) else { return Answer(text: "Which exercise would you like an alternative for?", grounded: [], plan: nil) }
            let alts = c.catalog.byID.values.filter { $0.id != ex.id && ($0.pattern == ex.pattern || !Set($0.primary).isDisjoint(with: ex.primary)) && Set($0.equipment).isSubset(of: c.constraints.equipment) && c.constraints.injuries.isDisjoint(with: $0.stress) }
                .sorted { ($0.pattern == ex.pattern ? 0 : 1, $0.name) < ($1.pattern == ex.pattern ? 0 : 1, $1.name) }.prefix(4)
            return Answer(text: alts.isEmpty ? "I couldn't find an alternative to \(ex.name) with your equipment and restrictions." : "Alternatives to \(ex.name): \(alts.map(\.name).joined(separator: "; ")).", grounded: ["library"], plan: nil)
        }
        if has(q, #"how much|what weight|next session|attempt"#) {
            guard let ex = findExercise(q, catalog: c.catalog) else { return Answer(text: "Which exercise? e.g. “How much should I bench next session?”", grounded: [], plan: nil) }
            guard let last = StrengthAnalytics.history(hist, exerciseID: ex.id).first else {
                return Answer(text: "You haven't logged \(ex.name) yet, so I can't base a number on your history. Start with a weight you could lift for 2–3 more reps than your target.", grounded: ["history"], plan: nil)
            }
            let a = ProgressionAdvisor.next(for: ex.id, history: hist, repRange: c.goal == .strength ? 3...6 : 6...10, catalog: c.catalog)
            let lastText = last.sets.map { "\(($0.weightKg ?? 0).formatted())×\($0.reps ?? 0)" }.joined(separator: ", ")
            return Answer(text: "Last \(ex.name): \(lastText) kg. Suggestion: \(a.weightKg.map { "\($0.formatted()) kg × \(a.reps)" } ?? "\(a.reps) reps"). \(a.reason)", grounded: ["history"], plan: nil)
        }
        if has(q, #"why|stall|plateau|stuck|not improving|stopped improving"#) {
            guard let ex = findExercise(q, catalog: c.catalog) else { return Answer(text: "Which lift has stalled?", grounded: [], plan: nil) }
            let h = Array(StrengthAnalytics.history(hist, exerciseID: ex.id).prefix(10).reversed())
            guard h.count >= 4 else { return Answer(text: "I only have \(h.count) \(ex.name) session(s) logged — not enough to see a trend yet.", grounded: ["history"], plan: nil) }
            let e = h.map { $0.bestE1RM ?? 0 }
            let recent = e.suffix(4).max() ?? 0, earlier = e.dropLast(4).max() ?? e.first ?? 0
            let change = earlier > 0 ? (recent - earlier) / earlier : 0
            if change > 0.02 { return Answer(text: "Your estimated 1RM on \(ex.name) is still rising (+\(Int(change * 100))%). Keep going.", grounded: ["history"], plan: nil) }
            var reasons = ["Your best estimated 1RM has been flat at about \(Int(recent.rounded())) kg for your last 4 sessions."]
            if h.suffix(4).allSatisfy({ $0.topWeight == h.last!.topWeight }) { reasons.append("You've used the same top weight (\(h.last!.topWeight.formatted()) kg) for 4 sessions — add a rep per session before adding load, or run a 4×6 block for 3 weeks.") }
            reasons.append("Sleep, nutrition and stress matter too, but I can only see your training log.")
            return Answer(text: reasons.joined(separator: "\n\n"), grounded: ["history", "recovery"], plan: nil)
        }
        return Answer(text: "I can build workouts, tell you what to train today, suggest alternatives and next weights, and analyse stalled lifts — using only your logged training.", grounded: [], plan: nil)
    }
}
