import Foundation

/// Arbitrary JSON (sync payloads are the app's own Codable records).
public enum JSONValue: Codable, Equatable, Sendable {
    case null, bool(Bool), number(Double), string(String), array([JSONValue]), object([String: JSONValue])

    public init(from d: Decoder) throws {
        let c = try d.singleValueContainer()
        if c.decodeNil() { self = .null }
        else if let b = try? c.decode(Bool.self) { self = .bool(b) }
        else if let n = try? c.decode(Double.self) { self = .number(n) }
        else if let s = try? c.decode(String.self) { self = .string(s) }
        else if let a = try? c.decode([JSONValue].self) { self = .array(a) }
        else { self = .object(try c.decode([String: JSONValue].self)) }
    }
    public func encode(to e: Encoder) throws {
        var c = e.singleValueContainer()
        switch self {
        case .null: try c.encodeNil(); case .bool(let b): try c.encode(b); case .number(let n): try c.encode(n)
        case .string(let s): try c.encode(s); case .array(let a): try c.encode(a); case .object(let o): try c.encode(o)
        }
    }
    public static func from<T: Encodable>(_ v: T) throws -> JSONValue { try JSONDecoder().decode(JSONValue.self, from: try JSONEncoder().encode(v)) }
    public func decode<T: Decodable>(_ t: T.Type) throws -> T { try JSONDecoder().decode(T.self, from: try JSONEncoder().encode(self)) }
}

/// Wire format of /v1/sync (matches server/src/app.ts).
public struct SyncChange: Codable, Equatable, Sendable {
    public var kind: String; public var id: String; public var updatedAt: Int64; public var deleted: Bool; public var payload: JSONValue?
    public init(kind: String, id: String, updatedAt: Int64, deleted: Bool, payload: JSONValue?) { self.kind = kind; self.id = id; self.updatedAt = updatedAt; self.deleted = deleted; self.payload = payload }
    public var key: String { "\(kind):\(id)" }
}
public struct SyncRequest: Codable, Sendable { public var cursor: Int64; public var changes: [SyncChange]; public init(cursor: Int64, changes: [SyncChange]) { self.cursor = cursor; self.changes = changes } }
public struct SyncResponse: Codable, Sendable {
    public struct Ref: Codable, Sendable { public var kind: String; public var id: String }
    public var cursor: Int64; public var changes: [SyncChange]; public var more: Bool; public var applied: Int; public var stale: [Ref]
}

/// Pure sync logic (mirrors prototype/js/core/sync.js). Diff-based change
/// detection against the hashes recorded at the last successful sync.
public struct SyncEngine: Sendable {
    public struct Entry: Codable, Equatable, Sendable { public var hash: String?; public var updatedAt: Int64; public var deleted: Bool }
    public typealias Meta = [String: Entry]

    public enum Action: Equatable, Sendable { case upsert(kind: String, id: String, payload: JSONValue), delete(kind: String, id: String) }

    public init() {}

    public static func hash(_ v: JSONValue) -> String {
        let enc = JSONEncoder(); enc.outputFormatting = .sortedKeys
        let data = (try? enc.encode(v)) ?? Data()
        var h: UInt64 = 0xcbf29ce484222325
        for b in data { h ^= UInt64(b); h = h &* 0x100000001b3 }
        return String(h, radix: 36)
    }

    /// Changes to push: new/edited entities and tombstones for vanished ones.
    public func collect(entities: [String: JSONValue], meta: Meta, now: Int64) -> [SyncChange] {
        var out: [SyncChange] = []
        for (key, value) in entities.sorted(by: { $0.key < $1.key }) where meta[key]?.hash != Self.hash(value) {
            let (k, id) = split(key)
            out.append(.init(kind: k, id: id, updatedAt: max(now, (meta[key]?.updatedAt ?? 0) + 1), deleted: false, payload: value))
        }
        for (key, e) in meta.sorted(by: { $0.key < $1.key }) where entities[key] == nil && !e.deleted {
            let (k, id) = split(key)
            out.append(.init(kind: k, id: id, updatedAt: max(now, e.updatedAt + 1), deleted: true, payload: nil))
        }
        return out
    }

    /// Decide what to apply locally from a server response, and the new meta.
    public func reconcile(remote: [SyncChange], pushed: [SyncChange], meta: Meta) -> (actions: [Action], meta: Meta) {
        var m = meta; var actions: [Action] = []
        let pushedAt = Dictionary(pushed.map { ($0.key, $0.updatedAt) }, uniquingKeysWith: max)
        for c in remote {
            if let mine = pushedAt[c.key], mine > c.updatedAt { continue }   // our newer local edit wins
            if c.deleted || c.payload == nil { actions.append(.delete(kind: c.kind, id: c.id)); m[c.key] = Entry(hash: nil, updatedAt: c.updatedAt, deleted: true) }
            else { actions.append(.upsert(kind: c.kind, id: c.id, payload: c.payload!)); m[c.key] = Entry(hash: Self.hash(c.payload!), updatedAt: c.updatedAt, deleted: false) }
        }
        for c in pushed where m[c.key].map({ $0.updatedAt <= c.updatedAt }) ?? true {
            m[c.key] = Entry(hash: c.payload.map(Self.hash), updatedAt: c.updatedAt, deleted: c.deleted)
        }
        return (actions, m)
    }

    private func split(_ key: String) -> (String, String) {
        let i = key.firstIndex(of: ":")!
        return (String(key[..<i]), String(key[key.index(after: i)...]))
    }
}
