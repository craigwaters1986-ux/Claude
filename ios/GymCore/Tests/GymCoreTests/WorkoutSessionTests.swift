import XCTest
@testable import GymCore

final class WorkoutSessionTests: XCTestCase {
    private let t0 = Date(timeIntervalSince1970: 1_800_000_000)

    private func priorBench() -> WorkoutRecord {
        WorkoutRecord(name: "Push", startedAt: t0.addingTimeInterval(-3 * 86_400), endedAt: t0.addingTimeInterval(-3 * 86_400 + 3600),
                      exercises: [LoggedExercise(exerciseID: "bench", sets: [LoggedSet(weightKg: 60, reps: 12, isDone: true), LoggedSet(weightKg: 70, reps: 10, isDone: true),
                                                                              LoggedSet(weightKg: 80, reps: 8, isDone: true), LoggedSet(weightKg: 80, reps: 7, isDone: true)])])
    }

    @MainActor private func session(_ history: [WorkoutRecord] = []) -> WorkoutSession {
        WorkoutSession(workout: WorkoutRecord(name: "Today", startedAt: t0), history: history, catalog: .init(), units: .kg, restDefault: 120)
    }

    @MainActor func testNewExercisePrefillsFromPreviousSession() async {
        let s = session([priorBench()])
        s.addExercise("bench")
        XCTAssertEqual(s.workout.exercises[0].sets.map(\.weightKg), [60, 70, 80, 80])
        XCTAssertEqual(s.previous("bench").count, 4)
    }

    @MainActor func testCompletingSetStartsRestCarriesForwardAndAutosaves() async {
        let s = session()
        var saves = 0; s.onChange = { _ in saves += 1 }
        s.addExercise("dbCurl")
        s.setWeight(14, 0, 0); s.setReps(10, 0, 0)
        s.toggleDone(0, 0, now: t0)
        XCTAssertTrue(s.workout.exercises[0].sets[0].isDone)
        XCTAssertEqual(s.workout.exercises[0].sets[1].weightKg, 14, "carried forward")
        XCTAssertEqual(s.restEndsAt, t0.addingTimeInterval(72), "isolation rest = 60% of default")
        XCTAssertGreaterThanOrEqual(saves, 4)
    }

    @MainActor func testCannotCompleteWithoutReps() async {
        let s = session(); s.addExercise("dbCurl")
        s.toggleDone(0, 0)
        XCTAssertFalse(s.workout.exercises[0].sets[0].isDone)
    }

    @MainActor func testSupersetDefersRestUntilLastExercise() async {
        let s = session(); s.addExercise("dbCurl"); s.addExercise("tricepPushdown"); s.toggleSuperset(0)
        s.setReps(10, 0, 0); s.toggleDone(0, 0)
        XCTAssertNil(s.restEndsAt)
        s.setReps(10, 1, 0); s.toggleDone(1, 0)
        XCTAssertNotNil(s.restEndsAt)
    }

    @MainActor func testLivePRAndThumbSteppersInPounds() async {
        let s = session([priorBench()]); s.units = .lb
        s.addExercise("bench")
        for j in 0..<3 { s.toggleDone(0, j) }
        s.step(weight: 5)   // +5 lb on the 4th set (80 kg prefilled)
        XCTAssertEqual(s.workout.exercises[0].sets[3].weightKg!, 80 + 5 * Units.kgPerLb, accuracy: 1e-9)
        XCTAssertEqual(s.toggleDone(0, 3), .weight)
    }

    @MainActor func testWatchResultAppliesAndFinishDropsIncomplete() async {
        let s = session(); s.addExercise("dbCurl")
        s.apply(SetResult(workoutID: s.workout.id, exerciseID: "dbCurl", setIndex: 1, reps: 9, weightKg: 12, autoCounted: true, corrections: 0, averageHeartRate: 120, completedAt: t0))
        let (done, prs) = s.finished(at: t0.addingTimeInterval(1800))
        XCTAssertEqual(done.exercises[0].sets.count, 1)
        XCTAssertEqual(done.exercises[0].sets[0].reps, 9)
        XCTAssertNotNil(done.endedAt); XCTAssertTrue(prs.isEmpty)
    }

    @MainActor func testCycleKindAndTemplates() async {
        let s = session(); s.addExercise("bench")
        s.cycleKind(0, 0); XCTAssertEqual(s.workout.exercises[0].sets[0].kind, .warmup)
        let w = WorkoutSession.fromTemplate(name: "Push", items: [TemplateItem(exerciseID: "bench", sets: 2), TemplateItem(exerciseID: "ohp", sets: 3)], history: [priorBench()])
        XCTAssertEqual(w.exercises.map(\.sets.count), [2, 3]); XCTAssertEqual(w.exercises[0].sets[1].weightKg, 70)
    }
}
