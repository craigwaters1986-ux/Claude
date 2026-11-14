import Foundation
import Observation

/// A template row (shared by the app's SwiftData templates and plans).
public struct TemplateItem: Codable, Hashable, Sendable {
    public var exerciseID: String; public var sets: Int; public var restSeconds: Int?; public var supersetGroup: UUID?
    public init(exerciseID: String, sets: Int, restSeconds: Int? = nil, supersetGroup: UUID? = nil) { self.exerciseID = exerciseID; self.sets = sets; self.restSeconds = restSeconds; self.supersetGroup = supersetGroup }
}

/// State + behaviour for the live workout (the logger's brain). Pure Swift
/// (no UI) so it builds and is unit-tested on Linux; mirrors
/// prototype/js/screens/workout.js + core/session.js.
@MainActor @Observable
public final class WorkoutSession {
    public private(set) var workout: WorkoutRecord
    public private(set) var restEndsAt: Date?
    public private(set) var lastPR: StrengthAnalytics.PersonalRecord?
    public let history: [WorkoutRecord]
    public let catalog: ExerciseCatalog
    public var units: Units
    public var restDefault: Int
    public var onChange: ((WorkoutRecord) -> Void)?

    public init(workout: WorkoutRecord, history: [WorkoutRecord], catalog: ExerciseCatalog, units: Units, restDefault: Int) {
        self.workout = workout; self.history = history; self.catalog = catalog; self.units = units; self.restDefault = restDefault
    }

    // MARK: Building

    public static func fromTemplate(name: String, items: [TemplateItem], history: [WorkoutRecord]) -> WorkoutRecord {
        var w = WorkoutRecord(name: name)
        for i in items { w.exercises.append(prefilled(i.exerciseID, sets: i.sets, history: history, rest: i.restSeconds, superset: i.supersetGroup)) }
        return w
    }

    public static func fromPlan(_ p: GeneratedPlan, history: [WorkoutRecord]) -> WorkoutRecord {
        var w = WorkoutRecord(name: p.name)
        for i in p.items {
            var e = prefilled(i.exerciseID, sets: i.sets, history: history, rest: i.restSeconds, superset: nil)
            if let kg = i.suggestedWeightKg { for k in e.sets.indices { e.sets[k].weightKg = kg } }
            if let top = i.repRange.last { for k in e.sets.indices where e.sets[k].reps == nil { e.sets[k].reps = top } }
            w.exercises.append(e)
        }
        return w
    }

    /// New exercise rows pre-filled from the previous session ("previous performance").
    public static func prefilled(_ id: String, sets: Int?, history: [WorkoutRecord], rest: Int?, superset: UUID?) -> LoggedExercise {
        let last = StrengthAnalytics.history(history, exerciseID: id).first?.sets ?? []
        let n = sets ?? max(3, last.count)
        let rows = (0..<n).map { i -> LoggedSet in let p = last.isEmpty ? nil : last[min(i, last.count - 1)]; return LoggedSet(weightKg: p?.weightKg, reps: p?.reps) }
        return LoggedExercise(exerciseID: id, sets: rows, supersetGroup: superset, restSeconds: rest)
    }

    // MARK: Queries

    public func previous(_ exerciseID: String) -> [LoggedSet] { StrengthAnalytics.history(history, exerciseID: exerciseID, before: workout.startedAt).first?.sets ?? [] }

    public var currentSet: (exercise: Int, set: Int)? {
        for (i, e) in workout.exercises.enumerated() { if let j = e.sets.firstIndex(where: { !$0.isDone }) { return (i, j) } }
        return nil
    }

    public func suggestion(for exerciseID: String, goal: String) -> ProgressionAdvice {
        let range: ClosedRange<Int> = switch goal { case "strength": 3...6; case "endurance": 15...20; case "fatLoss": 10...15; default: 6...10 }
        return ProgressionAdvisor.next(for: exerciseID, history: history, repRange: range, catalog: catalog)
    }

    public func isPR(_ set: LoggedSet, exerciseID: String) -> StrengthAnalytics.PRKind? {
        guard set.countsAsHardSet else { return nil }
        let prev = StrengthAnalytics.records(history, exerciseID: exerciseID, before: workout.startedAt)
        guard prev.maxWeight > 0 else { return nil }
        if (set.weightKg ?? 0) > prev.maxWeight { return .weight }
        if let w = set.weightKg, let r = set.reps, let e = estimatedOneRepMax(weightKg: w, reps: r, rir: set.effectiveRIR ?? 0), e > prev.bestE1RM + 1e-9 { return .e1rm }
        return nil
    }

    // MARK: Mutations (each autosaves through onChange)

    private func mutate(_ f: (inout WorkoutRecord) -> Void) { f(&workout); onChange?(workout) }

    public func addExercise(_ id: String) { mutate { $0.exercises.append(Self.prefilled(id, sets: nil, history: history, rest: nil, superset: nil)) } }
    public func removeExercise(at i: Int) { mutate { $0.exercises.remove(at: i) } }
    public func addSet(to i: Int) { mutate { let last = $0.exercises[i].sets.last; $0.exercises[i].sets.append(LoggedSet(weightKg: last?.weightKg, reps: last?.reps)) } }
    public func setWeight(_ kg: Double?, _ i: Int, _ j: Int) { mutate { $0.exercises[i].sets[j].weightKg = kg } }
    public func setReps(_ r: Int?, _ i: Int, _ j: Int) { mutate { $0.exercises[i].sets[j].reps = r } }
    public func setRPE(_ rpe: Double?, _ i: Int, _ j: Int) { mutate { $0.exercises[i].sets[j].rpe = rpe; $0.exercises[i].sets[j].rir = rpe.map { max(0, 10 - $0) } } }

    public func cycleKind(_ i: Int, _ j: Int) {
        let order: [SetKind] = [.working, .warmup, .drop, .failure]
        mutate { let k = $0.exercises[i].sets[j].kind; $0.exercises[i].sets[j].kind = order[(order.firstIndex(of: k)! + 1) % order.count] }
    }

    public func copyPrevious(_ i: Int, _ j: Int) {
        let p = previous(workout.exercises[i].exerciseID); guard j < p.count else { return }
        mutate { $0.exercises[i].sets[j].weightKg = p[j].weightKg; $0.exercises[i].sets[j].reps = p[j].reps }
    }

    public func toggleSuperset(_ i: Int) {
        guard i + 1 < workout.exercises.count else { return }
        mutate {
            let a = $0.exercises[i].supersetGroup
            if a != nil, a == $0.exercises[i + 1].supersetGroup { $0.exercises[i + 1].supersetGroup = nil }
            else { let g = a ?? UUID(); $0.exercises[i].supersetGroup = g; $0.exercises[i + 1].supersetGroup = g }
        }
    }

    /// Complete (or un-complete) a set. Returns a PR kind for haptics/toast.
    /// Works on a local copy and commits once (no overlapping access to `workout`).
    @discardableResult
    public func toggleDone(_ i: Int, _ j: Int, now: Date = .now) -> StrengthAnalytics.PRKind? {
        var w = workout
        var s = w.exercises[i].sets[j]
        if s.isDone {
            s.isDone = false; s.completedAt = nil; w.exercises[i].sets[j] = s
            workout = w; onChange?(w); return nil
        }
        let prev = previous(w.exercises[i].exerciseID)
        if s.weightKg == nil, j < prev.count { s.weightKg = prev[j].weightKg }
        if s.reps == nil, j < prev.count { s.reps = prev[j].reps }
        guard (s.reps ?? 0) > 0 else { return nil }
        s.isDone = true; s.completedAt = now
        w.exercises[i].sets[j] = s
        // Carry forward into the next empty set so the thumb controls are one tap away.
        if j + 1 < w.exercises[i].sets.count, w.exercises[i].sets[j + 1].weightKg == nil, w.exercises[i].sets[j + 1].reps == nil {
            w.exercises[i].sets[j + 1].weightKg = s.weightKg; w.exercises[i].sets[j + 1].reps = s.reps
        }
        let pr = isPR(s, exerciseID: w.exercises[i].exerciseID)
        // Supersets: rest only after the last exercise of the group.
        let g = w.exercises[i].supersetGroup
        let nextInGroup = g != nil && i + 1 < w.exercises.count && w.exercises[i + 1].supersetGroup == g
        if !nextInGroup { restEndsAt = now.addingTimeInterval(TimeInterval(restSeconds(for: w.exercises[i]))) }
        workout = w; onChange?(w)
        if let pr { lastPR = .init(exerciseID: w.exercises[i].exerciseID, kind: pr, value: s.weightKg ?? 0, previous: 0, setID: s.id) }
        return pr
    }

    public func restSeconds(for e: LoggedExercise) -> Int {
        if let r = e.restSeconds { return r }
        return catalog[e.exerciseID]?.mechanics == .isolation ? Int(Double(restDefault) * 0.6) : restDefault
    }
    public func adjustRest(by seconds: Int) { restEndsAt = restEndsAt?.addingTimeInterval(TimeInterval(seconds)) }
    public func skipRest() { restEndsAt = nil }

    /// Thumb-bar steppers act on the current set, starting from the previous set's value.
    public func step(weight deltaDisplay: Double) {
        guard let c = currentSet else { return }
        let before = c.set > 0 ? workout.exercises[c.exercise].sets[c.set - 1].weightKg : nil
        let base = workout.exercises[c.exercise].sets[c.set].weightKg ?? before ?? 0
        setWeight(max(0, base + units.toKg(deltaDisplay)), c.exercise, c.set)
    }
    public func step(reps delta: Int) {
        guard let c = currentSet else { return }
        let before = c.set > 0 ? workout.exercises[c.exercise].sets[c.set - 1].reps : nil
        setReps(max(0, (workout.exercises[c.exercise].sets[c.set].reps ?? before ?? 0) + delta), c.exercise, c.set)
    }

    /// Apply a set finished on Apple Watch (idempotent).
    public func apply(_ result: SetResult) { mutate { $0.apply(result) } }

    /// Finalise: drop incomplete sets/exercises, stamp end, compute PRs.
    public func finished(at now: Date = .now) -> (WorkoutRecord, [StrengthAnalytics.PersonalRecord]) {
        var w = workout
        w.endedAt = now
        w.exercises = w.exercises.map { var e = $0; e.sets = e.sets.filter { $0.isDone && ($0.reps ?? 0) > 0 }; return e }.filter { !$0.sets.isEmpty }
        return (w, StrengthAnalytics.personalRecords(in: w, history: history + [w]))
    }
}
