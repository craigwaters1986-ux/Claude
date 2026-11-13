// rep-eval — measure wrist rep-counting accuracy on labelled recordings.
//   swift run rep-eval <dir-of-csv>                 evaluate recordings
//   swift run rep-eval --synthesize <dir> [n]       write a synthetic demo dataset
import Foundation
import GymCore

let args = Array(CommandLine.arguments.dropFirst())
let fm = FileManager.default

if args.first == "--synthesize", args.count >= 2 {
    let dir = URL(fileURLWithPath: args[1]); let n = args.count > 2 ? Int(args[2]) ?? 12 : 12
    try fm.createDirectory(at: dir, withIntermediateDirectories: true)
    let plan: [(String, SyntheticMotion.Kind)] = [("dbCurl", .curl), ("lateralRaise", .lateralRaise), ("dbShoulderPress", .press), ("ohp", .press)]
    var i = 0
    for (ex, kind) in plan { for k in 0..<n {
        let reps = 6 + k % 8, tempo = 1.4 + Double(k % 5) * 0.5
        let rec = MotionRecording(exerciseID: ex, sampleRate: 50, trueReps: reps, autoCount: nil, user: "synthetic-\(k % 6)", source: "synthetic",
                                  samples: SyntheticMotion.trace(kind, reps: reps, repSeconds: tempo, noise: 0.04, seed: UInt64(k + 1)))
        try rec.csv().write(to: dir.appendingPathComponent(String(format: "%@-%03d.csv", ex, k)), atomically: true, encoding: .utf8); i += 1
    } }
    print("Wrote \(i) synthetic recordings to \(dir.path) (SYNTHETIC — not real-world accuracy)")
    exit(0)
}

let verbose = args.contains("--verbose")
let positional = args.filter { !$0.hasPrefix("--") }
guard let path = positional.first else { print("usage: rep-eval <dir> | --synthesize <dir> [n]"); exit(2) }
let files = try fm.contentsOfDirectory(atPath: path).filter { $0.hasSuffix(".csv") }.sorted()
var recs: [MotionRecording] = []
for f in files {
    do { recs.append(try MotionRecording.parse(csv: String(contentsOfFile: (path as NSString).appendingPathComponent(f), encoding: .utf8))) }
    catch { FileHandle.standardError.write("skipped \(f): \(error)\n".data(using: .utf8)!) }
}
print("\(recs.count) recordings from \(Set(recs.map(\.user)).count) people (sources: \(Set(recs.map(\.source)).sorted().joined(separator: ", ")))\n")
print(RepEvaluator.markdown(RepEvaluator.evaluate(recs)))
if verbose {
    for (f, r) in zip(files, recs) {
        guard let ex = ExerciseLibrary.byID[r.exerciseID], let p = RepProfile.forExercise(ex) else { continue }
        var rc = RepCounter(profile: p, sampleRate: r.sampleRate); r.samples.forEach { rc.push($0) }
        if rc.count != r.trueReps { print("MISS \(f): counted \(rc.count), true \(r.trueReps)") }
    }
}
print("Gate: auto-count on by default only with ≥\(Int(RepEvaluator.minExact * 100))% exact over ≥\(RepEvaluator.minSets) sets from ≥\(RepEvaluator.minUsers) people.")
