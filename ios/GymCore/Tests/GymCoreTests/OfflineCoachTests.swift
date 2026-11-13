import XCTest
@testable import GymCore

final class OfflineCoachTests: XCTestCase {
    let now = Date(timeIntervalSince1970: 1_800_000_000)
    func ctx(_ h: [WorkoutRecord], health: Bool = false) -> OfflineCoach.Context {
        .init(history: h, recovery: RecoveryEngine().snapshot(workouts: h, at: now), constraints: .init(experience: .intermediate, equipment: Set(Equipment.allCases)),
              goal: .hypertrophy, durationMinutes: 45, healthConnected: health)
    }
    func bench(_ daysAgo: Double, _ w: Double, _ r: Int) -> WorkoutRecord {
        let t = now.addingTimeInterval(-daysAgo * 86_400)
        return WorkoutRecord(name: "Push", startedAt: t, endedAt: t.addingTimeInterval(3600), exercises: [LoggedExercise(exerciseID: "bench", sets: [LoggedSet(weightKg: w, reps: r, isDone: true)])])
    }

    func testNeverInventsData() {
        XCTAssertTrue(OfflineCoach.answer("How much should I bench next session?", ctx([])).text.contains("haven't logged"))
        XCTAssertTrue(OfflineCoach.answer("What was my HRV?", ctx([])).text.contains("don't have access"))
        XCTAssertTrue(OfflineCoach.answer("What should I train today?", ctx([])).text.contains("haven't logged"))
    }

    func testPlateauNextWeightAlternativesAndBuild() {
        let flat = [bench(47, 75, 8), bench(40, 77.5, 8), bench(33, 80, 8), bench(26, 80, 8), bench(19, 80, 8), bench(12, 80, 8), bench(5, 80, 8)]
        let p = OfflineCoach.answer("Why has my bench press stopped improving?", ctx(flat))
        XCTAssertTrue(p.text.contains("flat"), p.text); XCTAssertTrue(p.text.contains("same top weight"))
        XCTAssertTrue(OfflineCoach.answer("How much weight should I attempt next session on bench?", ctx(flat)).text.contains("Last Barbell Bench Press"))
        XCTAssertTrue(OfflineCoach.answer("Give me an alternative to barbell squats", ctx(flat)).text.contains("Alternatives to Barbell Back Squat"))
        let b = OfflineCoach.answer("Build me a 45-minute chest and triceps workout.", ctx([]))
        XCTAssertNotNil(b.plan); XCTAssertLessThanOrEqual(OfflineGenerator.estimateMinutes(b.plan!.items), 47)
        XCTAssertTrue(b.plan!.items.allSatisfy { !Set(ExerciseLibrary.byID[$0.exerciseID]!.primary).isDisjoint(with: [.chest, .triceps]) })
    }
}
