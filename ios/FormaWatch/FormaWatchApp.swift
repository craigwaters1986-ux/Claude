import SwiftUI
import WatchKit
import GymCore

@main
struct FormaWatchApp: App {
    @State private var workout = WorkoutManager()
    @State private var tracker = MotionRepTracker()
    @State private var link = WatchSessionManager()

    var body: some Scene {
        WindowGroup {
            WatchWorkoutView(workout: workout, tracker: tracker, link: link)
                .task { link.activate(); try? await workout.requestAuthorization() }
        }
    }
}

struct WatchWorkoutView: View {
    let workout: WorkoutManager
    let tracker: MotionRepTracker
    let link: WatchSessionManager
    @State private var crown = 0.0
    @State private var restUntil: Date?
    @State private var setStart = Date()

    /// First incomplete set in the plan sent by the iPhone.
    private var target: (item: ActivePlan.Item, index: Int, set: ActivePlan.Target)? {
        guard let p = link.plan else { return nil }
        for item in p.items { if let i = item.targetSets.firstIndex(where: { !$0.done }) { return (item, i, item.targetSets[i]) } }
        return nil
    }

    var body: some View {
        if let until = restUntil, until > .now {
            RestView(until: until) { restUntil = nil }
        } else if let t = target {
            VStack(spacing: 4) {
                HStack { Text(t.item.name).font(.footnote.bold()).foregroundStyle(.cyan).lineLimit(1); Spacer(); Text("♥ \(Int(workout.heartRate))").font(.caption2).foregroundStyle(.red) }
                Text("Set \(t.index + 1)/\(t.item.targetSets.count) · \(t.set.weightKg.map { "\($0.formatted()) kg" } ?? "—") × \(t.set.reps.map(String.init) ?? "—")").font(.caption2).foregroundStyle(.secondary)
                Text("\(tracker.reps)").font(.system(size: 56, weight: .bold, design: .rounded)).monospacedDigit().contentTransition(.numericText())
                    .focusable().digitalCrownRotation($crown, from: -50, through: 50, by: 1, sensitivity: .low, isContinuous: true, isHapticFeedbackEnabled: true)
                    .onChange(of: crown) { old, new in let d = Int(new.rounded()) - Int(old.rounded()); if d != 0 { tracker.correct(by: d) } }
                    .accessibilityLabel("\(tracker.reps) reps. Turn the Digital Crown to correct.")
                Text(tracker.isCounting ? (tracker.autoAvailable ? "auto-counting · crown corrects" : "manual · use crown") : (t.item.autoCount ? "auto count available" : "manual count")).font(.caption2).foregroundStyle(.secondary)
                if tracker.isCounting {
                    Button("End set") { endSet(t) }.tint(.red)
                } else {
                    Button("Start set") { Task { if !workout.isRunning { try? await workout.start() }; setStart = .now; tracker.begin(for: ExerciseLibrary.byID[t.item.exerciseID]) } }.tint(.green)
                }
            }
        } else {
            VStack(spacing: 8) {
                Image(systemName: "iphone.and.arrow.forward").font(.title)
                Text("Start a workout on your iPhone").multilineTextAlignment(.center).font(.footnote)
                if workout.isRunning { Button("End workout") { Task { let r = await workout.end(); link.send(.workoutEnded(workoutID: link.plan?.workoutID ?? UUID(), at: .now, activeEnergyKcal: r.kcal, avgHeartRate: r.avgHR)) } } }
            }
        }
    }

    private func endSet(_ t: (item: ActivePlan.Item, index: Int, set: ActivePlan.Target)) {
        let r = tracker.end()
        guard let plan = link.plan else { return }
        link.send(.setCompleted(SetResult(workoutID: plan.workoutID, exerciseID: t.item.exerciseID, setIndex: t.index, reps: r.reps, weightKg: t.set.weightKg,
                                          autoCounted: r.auto, corrections: r.corrections, averageHeartRate: workout.averageHeartRate(since: setStart), completedAt: .now)))
        WKInterfaceDevice.current().play(.success)       // haptic: set finished
        restUntil = .now.addingTimeInterval(90)
    }
}

private struct RestView: View {
    let until: Date
    let done: () -> Void
    var body: some View {
        TimelineView(.periodic(from: .now, by: 1)) { ctx in
            let left = max(0, until.timeIntervalSince(ctx.date))
            VStack {
                Text("REST").font(.caption.bold()).foregroundStyle(.cyan)
                Gauge(value: left, in: 0...90) { EmptyView() } currentValueLabel: { Text(Duration.seconds(left), format: .time(pattern: .minuteSecond)) }.gaugeStyle(.accessoryCircular).scaleEffect(1.6).padding()
                Button("Skip", action: done)
            }
            .onChange(of: left == 0) { _, finished in if finished { WKInterfaceDevice.current().play(.notification); done() } }
        }
    }
}
