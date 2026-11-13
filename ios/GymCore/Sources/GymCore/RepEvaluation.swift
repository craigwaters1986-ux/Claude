import Foundation

/// One labelled set of raw wrist motion: the input for measuring and improving
/// rep counting. `trueReps` is the user-confirmed count (after any Digital
/// Crown correction), which makes every corrected set a free training label.
///
/// CSV format (shared with tools/rep-eval.mjs):
///   # exercise=dbCurl,sampleRate=50,trueReps=10,autoCount=9,user=anon-3f2a,source=watch
///   t,gx,gy,gz,ax,ay,az
///   0.000,0.01,-0.99,0.02,0.00,0.01,-0.01
public struct MotionRecording: Sendable {
    public var exerciseID: String
    public var sampleRate: Double
    public var trueReps: Int
    public var autoCount: Int?
    public var user: String
    public var source: String
    public var samples: [MotionSample]

    public init(exerciseID: String, sampleRate: Double, trueReps: Int, autoCount: Int?, user: String = "anon", source: String = "watch", samples: [MotionSample]) {
        self.exerciseID = exerciseID; self.sampleRate = sampleRate; self.trueReps = trueReps; self.autoCount = autoCount; self.user = user; self.source = source; self.samples = samples
    }

    public func csv() -> String {
        var s = "# exercise=\(exerciseID),sampleRate=\(sampleRate),trueReps=\(trueReps),autoCount=\(autoCount.map(String.init) ?? ""),user=\(user),source=\(source)\nt,gx,gy,gz,ax,ay,az\n"
        s.reserveCapacity(samples.count * 48)
        for m in samples {
            s += [m.t, m.gravity.x, m.gravity.y, m.gravity.z, m.userAcceleration.x, m.userAcceleration.y, m.userAcceleration.z].map { String(format: "%.4f", $0) }.joined(separator: ",") + "\n"
        }
        return s
    }

    public static func parse(csv: String) throws -> MotionRecording {
        enum ParseError: Error { case missingHeader, badRow(Int) }
        var meta: [String: String] = [:]; var samples: [MotionSample] = []
        for (n, line) in csv.split(whereSeparator: \.isNewline).enumerated() {
            if line.hasPrefix("#") {
                for kv in line.dropFirst().split(separator: ",") { let p = kv.split(separator: "=", maxSplits: 1).map { $0.trimmingCharacters(in: .whitespaces) }; if p.count == 2 { meta[p[0]] = p[1] } }
                continue
            }
            if line.hasPrefix("t,") { continue }
            let v = line.split(separator: ",").compactMap { Double($0) }
            guard v.count == 7 else { throw ParseError.badRow(n + 1) }
            samples.append(MotionSample(t: v[0], gravity: SIMD3(v[1], v[2], v[3]), userAcceleration: SIMD3(v[4], v[5], v[6])))
        }
        guard let ex = meta["exercise"], let reps = meta["trueReps"].flatMap(Int.init) else { throw ParseError.missingHeader }
        return MotionRecording(exerciseID: ex, sampleRate: meta["sampleRate"].flatMap(Double.init) ?? 50, trueReps: reps, autoCount: meta["autoCount"].flatMap(Int.init),
                               user: meta["user"] ?? "anon", source: meta["source"] ?? "unknown", samples: samples)
    }
}

/// Measures counting accuracy per exercise and decides whether auto-count is
/// good enough to switch on by default (doc 04: ≥ 90 % exact sets over ≥ 30
/// sets from ≥ 5 people).
public enum RepEvaluator {
    public struct ExerciseReport: Sendable, Equatable {
        public let exerciseID: String
        public let sets: Int
        public let users: Int
        public let exactRate: Double
        public let withinOneRate: Double
        public let meanAbsoluteError: Double
        public let enableByDefault: Bool
    }

    public static let minExact = 0.9, minSets = 30, minUsers = 5

    public static func evaluate(_ recordings: [MotionRecording], catalog: ExerciseCatalog = .init()) -> [ExerciseReport] {
        Dictionary(grouping: recordings, by: \.exerciseID).compactMap { id, recs -> ExerciseReport? in
            guard let ex = catalog[id], let profile = RepProfile.forExercise(ex) else { return nil }
            var exact = 0, within = 0, absErr = 0
            for r in recs {
                var rc = RepCounter(profile: profile, sampleRate: r.sampleRate)
                r.samples.forEach { rc.push($0) }
                let e = abs(rc.count - r.trueReps)
                if e == 0 { exact += 1 }; if e <= 1 { within += 1 }; absErr += e
            }
            let n = Double(recs.count), users = Set(recs.map(\.user)).count
            let exactRate = Double(exact) / n
            return ExerciseReport(exerciseID: id, sets: recs.count, users: users, exactRate: exactRate, withinOneRate: Double(within) / n,
                                  meanAbsoluteError: Double(absErr) / n, enableByDefault: exactRate >= minExact && recs.count >= minSets && users >= minUsers)
        }.sorted { $0.exerciseID < $1.exerciseID }
    }

    public static func markdown(_ reports: [ExerciseReport]) -> String {
        var s = "| Exercise | Sets | People | Exact | ±1 rep | MAE | Auto-count by default |\n|---|---|---|---|---|---|---|\n"
        for r in reports {
            s += "| \(r.exerciseID) | \(r.sets) | \(r.users) | \(Int((r.exactRate * 100).rounded()))% | \(Int((r.withinOneRate * 100).rounded()))% | \(String(format: "%.2f", r.meanAbsoluteError)) | \(r.enableByDefault ? "yes" : "no") |\n"
        }
        return s
    }
}
