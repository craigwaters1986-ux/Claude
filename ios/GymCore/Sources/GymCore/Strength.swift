import Foundation

/// Estimated one-rep max (Epley), using reps-to-failure = reps + RIR.
/// Returns nil when the estimate would be unreliable (>12 effective reps or no load).
public func estimatedOneRepMax(weightKg: Double, reps: Int, rir: Double = 0) -> Double? {
    guard weightKg > 0, reps > 0 else { return nil }
    let r = Double(reps) + rir
    guard r <= 12 else { return nil }
    return r == 1 ? weightKg : weightKg * (1 + r / 30)
}

public struct ExerciseSession: Sendable {
    public let workoutID: UUID
    public let date: Date
    public let sets: [LoggedSet]
    public var topWeight: Double { sets.compactMap(\.weightKg).max() ?? 0 }
    public var bestE1RM: Double? { sets.compactMap { s in s.weightKg.flatMap { w in s.reps.flatMap { estimatedOneRepMax(weightKg: w, reps: $0, rir: s.effectiveRIR ?? 0) } } }.max() }
}

public enum StrengthAnalytics {
    /// Working sets for an exercise, newest session first.
    public static func history(_ workouts: [WorkoutRecord], exerciseID: String, before: Date = .distantFuture) -> [ExerciseSession] {
        workouts.filter { $0.startedAt < before }.sorted { $0.startedAt > $1.startedAt }.compactMap { w in
            let sets = w.exercises.filter { $0.exerciseID == exerciseID }.flatMap(\.workingSets)
            return sets.isEmpty ? nil : ExerciseSession(workoutID: w.id, date: w.startedAt, sets: sets)
        }
    }

    public struct Records: Sendable { public var maxWeight = 0.0, bestE1RM = 0.0, bestSetVolume = 0.0 }

    public static func records(_ workouts: [WorkoutRecord], exerciseID: String, before: Date = .distantFuture) -> Records {
        var r = Records()
        for s in history(workouts, exerciseID: exerciseID, before: before).flatMap(\.sets) {
            r.maxWeight = max(r.maxWeight, s.weightKg ?? 0)
            if let w = s.weightKg, let reps = s.reps, let e = estimatedOneRepMax(weightKg: w, reps: reps, rir: s.effectiveRIR ?? 0) { r.bestE1RM = max(r.bestE1RM, e) }
            r.bestSetVolume = max(r.bestSetVolume, s.volumeKg)
        }
        return r
    }

    public enum PRKind: String, Codable, Sendable { case weight, e1rm, volume }
    public struct PersonalRecord: Codable, Hashable, Sendable { public let exerciseID: String; public let kind: PRKind; public let value: Double; public let previous: Double; public let setID: UUID }

    /// PRs in `workout` vs everything logged before it. A first-ever session sets a baseline, not a PR.
    public static func personalRecords(in workout: WorkoutRecord, history all: [WorkoutRecord]) -> [PersonalRecord] {
        var best: [String: PersonalRecord] = [:]
        let others = all.filter { $0.id != workout.id }
        for item in workout.exercises {
            let prev = records(others, exerciseID: item.exerciseID, before: workout.startedAt)
            guard prev.maxWeight > 0 else { continue }
            for s in item.workingSets {
                let e = s.weightKg.flatMap { w in s.reps.flatMap { estimatedOneRepMax(weightKg: w, reps: $0, rir: s.effectiveRIR ?? 0) } } ?? 0
                for (kind, value, previous) in [(PRKind.weight, s.weightKg ?? 0, prev.maxWeight), (.e1rm, e, prev.bestE1RM), (.volume, s.volumeKg, prev.bestSetVolume)] where value > previous + 1e-9 {
                    let key = "\(item.exerciseID):\(kind.rawValue)"
                    if (best[key]?.value ?? 0) < value { best[key] = PersonalRecord(exerciseID: item.exerciseID, kind: kind, value: value, previous: previous, setID: s.id) }
                }
            }
        }
        return Array(best.values)
    }
}

/// Double-progression overload advisor with safeguards (mirrors suggestNext in metrics.js).
public struct ProgressionAdvice: Sendable, Equatable {
    public enum Action: String, Sendable { case baseline, increase, reps, deload }
    public let action: Action
    public let weightKg: Double?
    public let reps: Int
    public let reason: String
}

public enum ProgressionAdvisor {
    public static func round(_ kg: Double, to inc: Double) -> Double { inc > 0 ? (kg / inc).rounded() * inc : (kg * 2).rounded() / 2 }

    public static func next(for exerciseID: String, history workouts: [WorkoutRecord], repRange: ClosedRange<Int> = 6...10, maxJump: Double = 0.10, catalog: ExerciseCatalog = .init()) -> ProgressionAdvice {
        let h = StrengthAnalytics.history(workouts, exerciseID: exerciseID)
        guard let last = h.first else {
            return .init(action: .baseline, weightKg: nil, reps: repRange.upperBound, reason: "No history yet — choose a weight you could lift for 2–3 more reps than the target.")
        }
        let inc = catalog[exerciseID]?.incrementKg ?? 2.5
        let top = last.topWeight
        let topSets = last.sets.filter { $0.weightKg == top }
        let allHitTop = topSets.allSatisfy { ($0.reps ?? 0) >= repRange.upperBound }
        let rirs = topSets.compactMap(\.effectiveRIR)
        let easy = rirs.isEmpty || (rirs.min() ?? 0) >= 2
        let missedLow = topSets.contains { ($0.reps ?? 0) < repRange.lowerBound }
        let missedBefore = h.count > 1 && h[1].topWeight == top && h[1].sets.filter { $0.weightKg == top }.contains { ($0.reps ?? 0) < repRange.lowerBound }

        if missedLow && missedBefore {
            let w = round(top * 0.9, to: inc)
            return .init(action: .deload, weightKg: w, reps: repRange.upperBound, reason: "Two sessions short of \(repRange.lowerBound) reps — drop ~10% and build back up.")
        }
        if allHitTop && easy {
            let w = round(top + inc, to: inc)
            if w > top * (1 + maxJump) + 1e-9 { return .init(action: .reps, weightKg: top, reps: repRange.upperBound + 1, reason: "The next jump would exceed \(Int(maxJump * 100))% — add a rep instead.") }
            return .init(action: .increase, weightKg: w, reps: repRange.lowerBound, reason: "Every top set reached \(repRange.upperBound) reps — add \(w - top) kg.")
        }
        let best = topSets.compactMap(\.reps).max() ?? repRange.lowerBound
        return .init(action: .reps, weightKg: top, reps: min(repRange.upperBound, best + 1), reason: "Stay at this weight and add a rep; increase once every set reaches \(repRange.upperBound).")
    }
}
