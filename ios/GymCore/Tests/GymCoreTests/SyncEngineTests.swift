import XCTest
@testable import GymCore

final class SyncEngineTests: XCTestCase {
    let engine = SyncEngine()

    func testCollectReconcileRoundTripIsClean() throws {
        let w = try JSONValue.from(WorkoutRecord(name: "Push", startedAt: Date(timeIntervalSince1970: 1), endedAt: Date(timeIntervalSince1970: 2)))
        let ents = ["workout:a": w, "profile:me": .object(["units": .string("kg")])]
        let first = engine.collect(entities: ents, meta: [:], now: 1000)
        XCTAssertEqual(first.map(\.key), ["profile:me", "workout:a"])
        let (actions, meta) = engine.reconcile(remote: first, pushed: first, meta: [:])
        XCTAssertEqual(actions.count, 2)
        XCTAssertTrue(engine.collect(entities: ents, meta: meta, now: 2000).isEmpty, "nothing to push after a successful sync")
        // Delete locally → tombstone
        let gone = engine.collect(entities: ["profile:me": ents["profile:me"]!], meta: meta, now: 3000)
        XCTAssertEqual(gone.map { [$0.id, String($0.deleted)] }, [["a", "true"]])
        XCTAssertGreaterThan(gone[0].updatedAt, 1000)
    }

    func testNewerLocalEditBeatsOlderRemoteAndRemoteDeletesApply() throws {
        let mine = SyncChange(kind: "workout", id: "x", updatedAt: 50, deleted: false, payload: .object(["name": .string("Mine")]))
        let theirs = SyncChange(kind: "workout", id: "x", updatedAt: 40, deleted: false, payload: .object(["name": .string("Theirs")]))
        let r = engine.reconcile(remote: [theirs], pushed: [mine], meta: [:])
        XCTAssertTrue(r.actions.isEmpty); XCTAssertEqual(r.meta["workout:x"]?.updatedAt, 50)
        let d = engine.reconcile(remote: [SyncChange(kind: "template", id: "t", updatedAt: 9, deleted: true, payload: nil)], pushed: [], meta: [:])
        XCTAssertEqual(d.actions, [.delete(kind: "template", id: "t")])
    }

    func testWireFormatMatchesServer() throws {
        let json = #"{"cursor":7,"changes":[{"kind":"workout","id":"w1","updatedAt":10,"deleted":false,"payload":{"id":"w1","n":1.5,"ok":true,"xs":[1,null]}}],"more":false,"applied":1,"stale":[]}"#
        let r = try JSONDecoder().decode(SyncResponse.self, from: Data(json.utf8))
        XCTAssertEqual(r.cursor, 7); XCTAssertEqual(r.changes[0].payload, .object(["id": .string("w1"), "n": .number(1.5), "ok": .bool(true), "xs": .array([.number(1), .null])]))
        let back = try JSONValue.from(WorkoutRecord(name: "A")).decode(WorkoutRecord.self)
        XCTAssertEqual(back.name, "A")
    }
}
