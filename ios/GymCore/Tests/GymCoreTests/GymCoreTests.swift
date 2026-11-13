import XCTest
@testable import GymCore

private let now = Date(timeIntervalSince1970: 1_800_000_000)
private func set(_ w: Double, _ r: Int, kind: SetKind = .working, rir: Double? = nil, rpe: Double? = nil) -> LoggedSet {
    LoggedSet(kind: kind, weightKg: w, reps: r, rpe: rpe, rir: rir, isDone: true)
}
private func workout(_ hoursAgo: Double, _ items: [(String, [LoggedSet])]) -> WorkoutRecord {
    let end = now.addingTimeInterval(-hoursAgo * 3600)
    return WorkoutRecord(name: "W", startedAt: end.addingTimeInterval(-3600), endedAt: end, exercises: items.map { LoggedExercise(exerciseID: $0.0, sets: $0.1) })
}

final class RecoveryTests: XCTestCase {
    let engine = RecoveryEngine()

    func testUntrainedIsFullyRecovered() {
        let s = engine.snapshot(workouts: [], at: now)
        XCTAssertEqual(s.overall, 100)
        XCTAssertTrue(s.muscles.allSatisfy { $0.percent == 100 && $0.status == .ready })
    }

    func testStimulusRolesAndEffort() {
        let w = workout(0, [("bench", [set(60, 10, kind: .warmup), set(80, 8, rir: 0), set(80, 8, rir: 4)])])
        let s = engine.stimulus(of: w)
        XCTAssertEqual(s[.chest]!, 1 + 0.65, accuracy: 1e-9)
        XCTAssertEqual(s[.triceps]!, (1 + 0.65) * 0.45, accuracy: 1e-9)
    }

    func testRecoveryIsMonotonicAndReachesReady() {
        let ws = [workout(0, [("bench", Array(repeating: set(80, 8, rpe: 9), count: 8))])]
        var prev = -1
        for h in [0.0, 6, 12, 24, 48, 72, 120] {
            let p = engine.snapshot(workouts: ws, at: now.addingTimeInterval(h * 3600))[.chest].percent
            XCTAssertGreaterThanOrEqual(p, prev); prev = p
        }
        let first = engine.snapshot(workouts: ws, at: now)[.chest]
        XCTAssertLessThan(first.percent, 50)
        XCTAssertEqual(engine.snapshot(workouts: ws, at: now.addingTimeInterval(Double(first.hoursToReady + 1) * 3600))[.chest].status, .ready)
    }

    func testStatusBands() {
        XCTAssertEqual(engine.status(for: 90), .ready); XCTAssertEqual(engine.status(for: 89), .light)
        XCTAssertEqual(engine.status(for: 69), .caution); XCTAssertEqual(engine.status(for: 39), .fatigued)
    }

    func testHealthSignalsSlowRecoveryButAreCapped() {
        let ws = [workout(20, [("squat", Array(repeating: set(100, 6), count: 6))])]
        let base = engine.snapshot(workouts: ws, at: now)[.quads].percent
        let tired = engine.snapshot(workouts: ws, at: now, health: .init(sleepHours: 4.5, hrvZScore: -2, restingHRDelta: 9))[.quads].percent
        XCTAssertLessThan(tired, base)
        XCTAssertEqual(engine.healthModifier(.init(sleepHours: 3, hrvZScore: -3, restingHRDelta: 20)).factor, 1.3, accuracy: 1e-9)
    }

    func testPersonalAdaptationBounded() {
        var p: [Muscle: Double] = [:]
        for _ in 0..<50 { p = engine.adapt(p, muscle: .chest, predicted: 90, feel: .verySore) }
        XCTAssertEqual(p[.chest], 1.5)
        XCTAssertLessThan(engine.adapt([:], muscle: .chest, predicted: 50, feel: .fresh)[.chest]!, 1)
    }
}

final class StrengthTests: XCTestCase {
    func testOneRepMax() {
        XCTAssertEqual(estimatedOneRepMax(weightKg: 100, reps: 1), 100)
        XCTAssertEqual(estimatedOneRepMax(weightKg: 100, reps: 5)!, 116.667, accuracy: 0.01)
        XCTAssertNil(estimatedOneRepMax(weightKg: 100, reps: 20))
    }

    func testPRDetection() {
        let a = workout(72, [("bench", [set(80, 8)])])
        XCTAssertTrue(StrengthAnalytics.personalRecords(in: a, history: [a]).isEmpty, "first session is a baseline")
        let b = workout(0, [("bench", [set(82.5, 8), set(80, 9)])])
        XCTAssertEqual(Set(StrengthAnalytics.personalRecords(in: b, history: [a, b]).map(\.kind)), [.weight, .e1rm, .volume])
    }

    func testProgression() {
        let up = [workout(48, [("bench", [set(80, 10, rir: 2), set(80, 10, rir: 3)])])]
        XCTAssertEqual(ProgressionAdvisor.next(for: "bench", history: up), .init(action: .increase, weightKg: 82.5, reps: 6, reason: ProgressionAdvisor.next(for: "bench", history: up).reason))
        let miss = [workout(96, [("bench", [set(80, 5)])]), workout(48, [("bench", [set(80, 4)])])]
        let d = ProgressionAdvisor.next(for: "bench", history: miss)
        XCTAssertEqual(d.action, .deload); XCTAssertEqual(d.weightKg, 72.5)
        XCTAssertEqual(ProgressionAdvisor.next(for: "bench", history: []).weightKg, nil)
        let light = [workout(48, [("lateralRaise", [set(6, 15, rir: 3)])])]
        let l = ProgressionAdvisor.next(for: "lateralRaise", history: light, repRange: 10...15)
        XCTAssertTrue(l.weightKg == nil || l.weightKg! <= 6.6)
    }

    func testUnits() {
        XCTAssertEqual(Units.lb.display(100), 220.5)
        XCTAssertEqual(Units.lb.toKg(220.5), 100.017, accuracy: 0.01)
    }
}

final class RepCounterTests: XCTestCase {
    func count(_ trace: [MotionSample], _ p: RepProfile) -> Int { var rc = RepCounter(profile: p); trace.forEach { rc.push($0) }; return rc.count }

    func testExactOnSyntheticTraces() {
        let cases: [(SyntheticMotion.Kind, RepProfile)] = [(.curl, .curl), (.lateralRaise, .lateralRaise), (.press, .verticalPush)]
        for (kind, p) in cases { for seed in 1...3 { for reps in [5, 12] { for tempo in [1.4, 2.5, 3.5] {
            XCTAssertEqual(count(SyntheticMotion.trace(kind, reps: reps, repSeconds: tempo, noise: 0.04, seed: UInt64(seed)), p), reps, "\(kind) seed \(seed) reps \(reps) tempo \(tempo)")
        } } } }
    }

    func testStillnessCountsZeroAndCorrectionsClamp() {
        XCTAssertEqual(count(SyntheticMotion.trace(.curl, reps: 0, restBefore: 15), .curl), 0)
        XCTAssertEqual(count(SyntheticMotion.trace(.press, reps: 0, noise: 0.04, restBefore: 15), .verticalPush), 0)
        var rc = RepCounter(profile: .curl); rc.correct(by: 2); rc.correct(by: -5)
        XCTAssertEqual(rc.count, 0); XCTAssertEqual(rc.corrections, -3)
    }

    func testUnsupportedExercisesHaveNoProfile() {
        XCTAssertNil(RepProfile.forExercise(ExerciseLibrary.byID["legPress"]!))
        XCTAssertNil(RepProfile.forExercise(ExerciseLibrary.byID["plank"]!))
        XCTAssertEqual(RepProfile.forExercise(ExerciseLibrary.byID["dbCurl"]!), .curl)
    }
}

final class ProtocolAndSafetyTests: XCTestCase {
    func testEnvelopeRoundTripAndDedup() throws {
        let r = SetResult(workoutID: UUID(), exerciseID: "dbCurl", setIndex: 0, reps: 10, weightKg: 14, autoCounted: true, corrections: -1, averageHeartRate: 128, completedAt: now)
        let e = Envelope(sentAt: now, message: .setCompleted(r))
        XCTAssertEqual(try Envelope.decode(try e.encoded()), e)
        var d = EnvelopeDeduplicator()
        XCTAssertTrue(d.accept(e)); XCTAssertFalse(d.accept(e))
    }

    func testApplyingWatchSetIsIdempotent() {
        var w = WorkoutRecord(name: "Arms", exercises: [LoggedExercise(exerciseID: "dbCurl", sets: [LoggedSet(weightKg: 14, reps: 10)])])
        let r = SetResult(workoutID: w.id, exerciseID: "dbCurl", setIndex: 0, reps: 9, weightKg: 14, autoCounted: true, corrections: 0, averageHeartRate: nil, completedAt: now)
        w.apply(r); w.apply(r)
        XCTAssertEqual(w.exercises[0].sets.count, 1); XCTAssertEqual(w.exercises[0].sets[0].reps, 9); XCTAssertTrue(w.exercises[0].sets[0].isDone)
    }

    func testValidatorStripsUnsafeCloudOutput() {
        let history = [workout(72, [("bench", [set(80, 8)])])]
        let plan = GeneratedPlan(name: "AI", items: [
            .init(exerciseID: "bench", sets: 4, repRange: [6, 10], restSeconds: 120, suggestedWeightKg: 140),
            .init(exerciseID: "squat", sets: 3, repRange: [6, 10], restSeconds: 120),
            .init(exerciseID: "hyperMegaPress", sets: 3, repRange: [6, 10], restSeconds: 90),
            .init(exerciseID: "dbBench", sets: 20, repRange: [8, 12], restSeconds: 90, suggestedWeightKg: 30),
        ])
        let c = GenerationConstraints(experience: .intermediate, equipment: Set(Equipment.allCases), injuries: [.knee])
        let r = PlanValidator.validate(plan, constraints: c, history: history)
        XCTAssertEqual(r.plan.items.map(\.exerciseID), ["bench", "dbBench"])
        XCTAssertEqual(r.plan.items[0].suggestedWeightKg, 88)
        XCTAssertNil(r.plan.items[1].suggestedWeightKg)
        XCTAssertLessThanOrEqual(r.plan.items[1].sets, 5) // 9 chest cap − 4 bench sets
        XCTAssertFalse(r.issues.isEmpty)
    }
}

final class OfflineGeneratorTests: XCTestCase {
    let all = Set(Equipment.allCases)

    func testRespectsDurationEquipmentAndInjuries() {
        let rec = RecoveryEngine().snapshot(workouts: [], at: now)
        for minutes in [20, 30, 45, 60, 75, 90] {
            let p = OfflineGenerator.generate(.init(goal: .hypertrophy, durationMinutes: minutes, targets: [.chest, .triceps], constraints: .init(experience: .intermediate, equipment: all)), recovery: rec, history: [])
            XCTAssertFalse(p.items.isEmpty, "\(minutes)")
            XCTAssertLessThanOrEqual(OfflineGenerator.estimateMinutes(p.items), minutes + 2)
        }
        let p = OfflineGenerator.generate(.init(goal: .strength, durationMinutes: 90, targets: [.quads, .chest], constraints: .init(experience: .intermediate, equipment: all, injuries: [.knee, .shoulder])), recovery: rec, history: [])
        for it in p.items { XCTAssertTrue(ExerciseLibrary.byID[it.exerciseID]!.stress.allSatisfy { $0 != .knee && $0 != .shoulder }, it.exerciseID) }
    }

    func testSkipsFatiguedTargetsAndOutputPassesValidator() {
        let ws = [workout(2, [("bench", Array(repeating: set(80, 8, rpe: 10), count: 12))])]
        let rec = RecoveryEngine().snapshot(workouts: ws, at: now)
        let c = GenerationConstraints(experience: .beginner, equipment: all)
        let p = OfflineGenerator.generate(.init(goal: .hypertrophy, durationMinutes: 60, targets: [.chest, .lats], constraints: c), recovery: rec, history: ws)
        XCTAssertFalse(p.items.contains { ExerciseLibrary.byID[$0.exerciseID]!.primary.contains(.chest) })
        XCTAssertTrue(p.notes.contains { $0.contains("Chest") })
        XCTAssertTrue(PlanValidator.validate(p, constraints: c, history: ws).issues.isEmpty, "engine output is already safe")
    }
}

final class WeeklyProgramTests: XCTestCase {
    func testSplitChoiceAndWeeklyCaps() {
        let c = GenerationConstraints(experience: .beginner, equipment: Set(Equipment.allCases))
        let p = OfflineGenerator.program(.init(goal: .hypertrophy, durationMinutes: 90, targets: [], constraints: c), daysPerWeek: 6, history: [])
        XCTAssertEqual(p.split, .ppl); XCTAssertEqual(p.sessions.count, 6)
        XCTAssertTrue(p.sessions.allSatisfy { !$0.items.isEmpty })
        for (m, v) in p.weeklySets { XCTAssertLessThanOrEqual(v, Experience.beginner.weeklyCap, m.rawValue) }
        XCTAssertEqual(TrainingSplit.auto(daysPerWeek: 4), .upperLower)
        XCTAssertEqual(TrainingSplit.auto(daysPerWeek: 2), .fullBody)
        let pushDay = p.sessions[0].items.flatMap { ExerciseLibrary.byID[$0.exerciseID]!.primary }
        XCTAssertTrue(Set(pushDay).isSubset(of: [.chest, .frontDelts, .sideDelts, .triceps]), "push day stays on push muscles")
    }
}
