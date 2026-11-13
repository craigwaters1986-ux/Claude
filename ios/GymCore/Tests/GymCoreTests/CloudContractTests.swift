import XCTest
@testable import GymCore

/// iPhone ↔ server contract. Fixtures live in tests/fixtures/cloud/ and are
/// checked from both sides (server/test/contract.test.ts validates the Swift
/// requests with the server's zod schemas; this test decodes the server's response).
/// Regenerate with FORMA_WRITE_FIXTURES=1 swift test && FORMA_WRITE_FIXTURES=1 npm run test:server
final class CloudContractTests: XCTestCase {
    static let dir = URL(fileURLWithPath: #filePath).deletingLastPathComponent().appendingPathComponent("../../../../tests/fixtures/cloud").standardized
    let write = ProcessInfo.processInfo.environment["FORMA_WRITE_FIXTURES"] == "1"

    private func sampleHistory() -> [WorkoutRecord] {
        let t = Date(timeIntervalSince1970: 1_799_900_000)
        return [WorkoutRecord(id: UUID(uuidString: "00000000-0000-0000-0000-000000000001")!, name: "Push", startedAt: t, endedAt: t.addingTimeInterval(3600),
                              exercises: [LoggedExercise(id: UUID(uuidString: "00000000-0000-0000-0000-000000000002")!, exerciseID: "bench",
                                                         sets: [LoggedSet(id: UUID(uuidString: "00000000-0000-0000-0000-000000000003")!, weightKg: 80, reps: 8, rpe: 8.5, isDone: true)])])]
    }

    private func check(_ name: String, _ value: some Encodable) throws {
        let enc = JSONEncoder(); enc.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try enc.encode(value)
        let url = Self.dir.appendingPathComponent(name)
        if write { try FileManager.default.createDirectory(at: Self.dir, withIntermediateDirectories: true); try data.write(to: url) }
        let fixture = try Data(contentsOf: url)
        XCTAssertEqual(try JSONSerialization.jsonObject(with: data) as! NSDictionary, try JSONSerialization.jsonObject(with: fixture) as! NSDictionary, "\(name) changed — regenerate fixtures and re-run the server contract test")
    }

    func testRequestsMatchFixtures() throws {
        let history = sampleHistory()
        let rec = RecoveryEngine().snapshot(workouts: history, at: Date(timeIntervalSince1970: 1_800_000_000))
        let input = GeneratorInput(goal: .hypertrophy, durationMinutes: 45, targets: [.chest, .triceps],
                                   constraints: .init(experience: .intermediate, equipment: [.barbell, .dumbbell, .bench], injuries: [.knee], avoid: [.calves], dislikes: ["dip"]))
        try check("generate-request.swift.json", CloudAPI.generateRequest(input, location: "gym", likes: ["bench"], recovery: rec, history: history, includeHistory: true))
        XCTAssertEqual(CloudAPI.avoidGroups([.calves]), [])
        XCTAssertEqual(CloudAPI.avoidGroups([.abs, .obliques, .calves]), ["core"])
        try check("coach-request.swift.json", CloudAPI.CoachRequest(question: "What should I train today?", transcript: [.init(role: "user", text: "hi"), .init(role: "bot", text: "hello")],
                                                                    context: CloudAPI.context(recovery: rec, history: history, includeHistory: false), healthConnected: false))
    }

    func testServerResponseDecodesAndValidates() throws {
        let data = try Data(contentsOf: Self.dir.appendingPathComponent("generate-response.server.json"))
        let r = try JSONDecoder().decode(CloudAPI.GenerateResponse.self, from: data)
        let plan = r.generatedPlan
        XCTAssertFalse(plan.items.isEmpty)
        XCTAssertEqual(plan.items[0].repRange.count, 2)
        let v = PlanValidator.validate(plan, constraints: .init(experience: .intermediate, equipment: Set(Equipment.allCases)), history: sampleHistory())
        XCTAssertEqual(v.plan.items.count, plan.items.count, "server output already satisfies on-device safety rules: \(v.issues)")
    }
}
