import XCTest
@testable import GymCore

final class RepEvaluationTests: XCTestCase {
    func testCSVRoundTrip() throws {
        let r = MotionRecording(exerciseID: "dbCurl", sampleRate: 50, trueReps: 8, autoCount: 7, user: "u1", samples: SyntheticMotion.trace(.curl, reps: 8, seed: 3))
        let back = try MotionRecording.parse(csv: r.csv())
        XCTAssertEqual(back.exerciseID, "dbCurl"); XCTAssertEqual(back.trueReps, 8); XCTAssertEqual(back.autoCount, 7)
        XCTAssertEqual(back.samples.count, r.samples.count)
        XCTAssertEqual(back.samples[100].gravity.x, r.samples[100].gravity.x, accuracy: 1e-4)
    }

    func testEvaluatorGatesOnAccuracySetsAndPeople() {
        func recs(_ ex: String, _ kind: SyntheticMotion.Kind, count: Int, users: Int, wrongLabel: Bool = false) -> [MotionRecording] {
            (0..<count).map { k in MotionRecording(exerciseID: ex, sampleRate: 50, trueReps: 8 + (wrongLabel ? 3 : 0), autoCount: nil, user: "u\(k % users)", samples: SyntheticMotion.trace(kind, reps: 8, seed: UInt64(k + 1))) }
        }
        let reports = RepEvaluator.evaluate(recs("dbCurl", .curl, count: 30, users: 5) + recs("lateralRaise", .lateralRaise, count: 10, users: 2) + recs("ohp", .press, count: 30, users: 6, wrongLabel: true) + recs("legPress", .press, count: 5, users: 5))
        let by = Dictionary(uniqueKeysWithValues: reports.map { ($0.exerciseID, $0) })
        XCTAssertEqual(by["dbCurl"]?.exactRate, 1); XCTAssertEqual(by["dbCurl"]?.enableByDefault, true)
        XCTAssertEqual(by["lateralRaise"]?.enableByDefault, false, "too few sets/people")
        XCTAssertEqual(by["ohp"]?.enableByDefault, false); XCTAssertEqual(by["ohp"]!.meanAbsoluteError, 3, accuracy: 0.01)
        XCTAssertNil(by["legPress"], "unsupported exercises are not evaluated")
        XCTAssertTrue(RepEvaluator.markdown(reports).contains("| dbCurl | 30 | 5 | 100% |"))
    }
}
