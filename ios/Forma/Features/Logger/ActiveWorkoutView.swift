import SwiftUI
import GymCore

/// Full-screen logger optimised for one-handed use: the bottom "thumb bar"
/// always targets the next incomplete set.
struct ActiveWorkoutView: View {
    @Bindable var model: WorkoutSession
    var goal: String
    var onFinish: (WorkoutRecord, [StrengthAnalytics.PersonalRecord]) -> Void
    var onDiscard: () -> Void
    @State private var showingPicker = false
    @State private var confirmFinish = false
    @State private var prBanner: String?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack(alignment: .bottom) {
            Theme.bg0.ignoresSafeArea()
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(Array(model.workout.exercises.enumerated()), id: \.element.id) { i, item in
                        ExerciseCard(model: model, index: i, item: item, goal: goal) { prBanner = $0 }
                    }
                    Button { showingPicker = true } label: { Label("Add exercise", systemImage: "plus").frame(maxWidth: .infinity, minHeight: 52) }
                        .buttonStyle(.bordered).tint(.white)
                    Button("Discard workout", role: .destructive) { onDiscard() }.padding(.top, 8)
                    Color.clear.frame(height: 200)
                }
                .padding(.horizontal, 16)
            }
            .safeAreaInset(edge: .top) { header }
            ThumbBar(model: model) { prBanner = $0 }
                .padding(.horizontal, 10).padding(.bottom, 6)
        }
        .overlay(alignment: .top) {
            if let prBanner {
                Text(prBanner).font(.subheadline.weight(.semibold)).padding(.horizontal, 18).padding(.vertical, 12)
                    .background(.ultraThinMaterial, in: Capsule()).overlay(Capsule().stroke(Theme.pr.opacity(0.6)))
                    .shadow(color: Theme.pr.opacity(0.3), radius: 20).transition(.move(edge: .top).combined(with: .opacity))
                    .task { try? await Task.sleep(for: .seconds(2.5)); withAnimation { self.prBanner = nil } }
            }
        }
        .animation(Theme.Motion.spring, value: prBanner)
        .sheet(isPresented: $showingPicker) { ExercisePicker(catalog: model.catalog) { model.addExercise($0) } }
        .confirmationDialog("Finish workout?", isPresented: $confirmFinish, titleVisibility: .visible) {
            Button("Finish") { let (w, prs) = model.finished(); Haptics.success(); onFinish(w, prs) }
        } message: { Text("Sets not marked complete won't be saved.") }
        .preferredColorScheme(.dark)
    }

    private var header: some View {
        VStack(spacing: 10) {
            HStack {
                Button { dismiss() } label: { Image(systemName: "chevron.down").frame(width: 44, height: 44) }.accessibilityLabel("Minimise workout")
                Spacer()
                VStack(spacing: 2) {
                    Text(model.workout.name).font(.headline)
                    TimelineView(.periodic(from: .now, by: 1)) { ctx in
                        Text(Duration.seconds(ctx.date.timeIntervalSince(model.workout.startedAt)), format: .time(pattern: .minuteSecond)).font(.subheadline.monospacedDigit()).foregroundStyle(Theme.ice)
                    }
                }
                Spacer()
                Button("Finish") { confirmFinish = true }.buttonStyle(.borderedProminent).tint(Theme.accent)
            }
            if let end = model.restEndsAt { RestTimerBar(endsAt: end, model: model) }
        }
        .padding(.horizontal, 16).padding(.bottom, 10)
        .background(.ultraThinMaterial)
    }
}

private struct RestTimerBar: View {
    let endsAt: Date
    let model: WorkoutSession
    var body: some View {
        TimelineView(.periodic(from: .now, by: 0.5)) { ctx in
            let left = max(0, endsAt.timeIntervalSince(ctx.date))
            HStack {
                Image(systemName: "timer").foregroundStyle(Theme.ice)
                VStack(alignment: .leading) { Text("REST").font(.caption2.weight(.bold)).foregroundStyle(Theme.text2); Text(Duration.seconds(left), format: .time(pattern: .minuteSecond)).font(.title2.bold().monospacedDigit()) }
                Spacer()
                Button("−15") { model.adjustRest(by: -15) }.buttonStyle(.bordered)
                Button("+15") { model.adjustRest(by: 15) }.buttonStyle(.bordered)
                Button { model.skipRest() } label: { Image(systemName: "xmark") }.buttonStyle(.bordered).accessibilityLabel("Skip rest")
            }
            .onChange(of: left == 0) { _, done in if done { Haptics.warning(); model.skipRest() } }
        }
        .padding(12).background(Color.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 18))
    }
}

private struct ExerciseCard: View {
    let model: WorkoutSession
    let index: Int
    let item: LoggedExercise
    let goal: String
    let onPR: (String) -> Void

    var body: some View {
        let def = model.catalog[item.exerciseID]
        let prev = model.previous(item.exerciseID)
        let advice = model.suggestion(for: item.exerciseID, goal: goal)
        GlassCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    if item.supersetGroup != nil { Text("SUPERSET").font(.caption2.bold()).foregroundStyle(Theme.violet) }
                    Text(def?.name ?? "Exercise").font(.title3.weight(.semibold))
                    Spacer()
                    Menu {
                        Button("Superset with next", systemImage: "link") { model.toggleSuperset(index) }
                        Button("Add set", systemImage: "plus") { model.addSet(to: index) }
                        Button("Remove", systemImage: "trash", role: .destructive) { model.removeExercise(at: index) }
                    } label: { Image(systemName: "ellipsis.circle").font(.title3) }
                }
                if let def { MuscleTags(def: def) }
                if advice.action != .baseline {
                    Label { Text(advice.reason).font(.footnote) } icon: { Image(systemName: "sparkles").foregroundStyle(Theme.ice) }
                        .padding(10).background(Theme.accent.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                }
                Grid(horizontalSpacing: 6, verticalSpacing: 6) {
                    GridRow { Text("SET"); Text("PREV"); Text(model.units.rawValue.uppercased()); Text("REPS"); Text("RPE"); Text("") }
                        .font(.caption2.weight(.bold)).foregroundStyle(Theme.text2)
                    ForEach(Array(item.sets.enumerated()), id: \.element.id) { j, s in
                        SetRow(model: model, i: index, j: j, set: s, prev: j < prev.count ? prev[j] : nil, onPR: onPR)
                    }
                }
                Button { model.addSet(to: index) } label: { Label("Add set", systemImage: "plus").frame(maxWidth: .infinity) }.buttonStyle(.bordered)
            }
        }
    }
}

private struct SetRow: View {
    let model: WorkoutSession
    let i: Int, j: Int
    let set: LoggedSet
    let prev: LoggedSet?
    let onPR: (String) -> Void

    var body: some View {
        GridRow {
            Button { model.cycleKind(i, j); Haptics.tap() } label: {
                Text(set.kind == .warmup ? "W" : set.kind == .drop ? "D" : set.kind == .failure ? "F" : "\(j + 1)").font(.footnote.bold()).frame(width: 30, height: 30)
                    .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 9))
            }.accessibilityLabel("Set \(j + 1), \(set.kind.rawValue). Double tap to change type")
            Button { model.copyPrevious(i, j); Haptics.tap() } label: {
                Text(prev.map { "\(fmt(model.units.display($0.weightKg ?? 0)))×\($0.reps ?? 0)" } ?? "—").font(.caption.monospacedDigit()).foregroundStyle(Theme.text2)
            }.disabled(prev == nil).accessibilityLabel(prev == nil ? "No previous set" : "Copy previous set")
            TextField("kg", value: Binding(get: { set.weightKg.map { model.units.display($0) } }, set: { model.setWeight($0.map(model.units.toKg), i, j) }), format: .number)
                .keyboardType(.decimalPad).multilineTextAlignment(.center).font(.body.weight(.semibold).monospacedDigit())
                .frame(height: 40).background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 10))
            TextField("reps", value: Binding(get: { set.reps }, set: { model.setReps($0, i, j) }), format: .number)
                .keyboardType(.numberPad).multilineTextAlignment(.center).font(.body.weight(.semibold).monospacedDigit())
                .frame(height: 40).background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 10))
            Menu(set.rpe.map { fmt($0) } ?? "RPE") {
                Button("None") { model.setRPE(nil, i, j) }
                ForEach([6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10], id: \.self) { v in Button(fmt(v)) { model.setRPE(v, i, j) } }
            }.font(.caption.bold()).frame(minWidth: 40)
            Button {
                if let pr = model.toggleDone(i, j) { Haptics.heavy(); onPR("🏆 New \(pr == .weight ? "weight" : "estimated 1RM") PR") } else { Haptics.success() }
            } label: {
                Image(systemName: "checkmark").font(.body.bold()).frame(width: 40, height: 40)
                    .background(set.isDone ? Color(hex: 0x30E8A0) : Color.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 12))
                    .foregroundStyle(set.isDone ? Color.black : .white)
            }
            .sensoryFeedback(.success, trigger: set.isDone)
            .accessibilityLabel(set.isDone ? "Mark set \(j + 1) incomplete" : "Complete set \(j + 1)")
        }
        .padding(.vertical, 2)
        .background(set.isDone ? Color(hex: 0x30E8A0, opacity: 0.06) : .clear, in: RoundedRectangle(cornerRadius: 12))
    }
    private func fmt(_ v: Double) -> String { v.formatted(.number.precision(.fractionLength(0...2))) }
}

private struct ThumbBar: View {
    let model: WorkoutSession
    let onPR: (String) -> Void
    var body: some View {
        if let c = model.currentSet {
            let item = model.workout.exercises[c.exercise]
            let s = item.sets[c.set]
            let inc = model.units == .lb ? 5 : (model.catalog[item.exerciseID]?.incrementKg ?? 2.5)
            VStack(spacing: 10) {
                HStack { Text(model.catalog[item.exerciseID]?.name ?? "").font(.subheadline.bold()); Spacer(); Text("Set \(c.set + 1) of \(item.sets.count)").font(.caption).foregroundStyle(Theme.text2) }
                HStack {
                    Stepper(value: s.weightKg.map { model.units.display($0) }, unit: model.units.rawValue.uppercased(), minus: { model.step(weight: -inc) }, plus: { model.step(weight: inc) })
                    Stepper(value: s.reps.map(Double.init), unit: "REPS", minus: { model.step(reps: -1) }, plus: { model.step(reps: 1) })
                }
                Button { if let pr = model.toggleDone(c.exercise, c.set) { Haptics.heavy(); onPR("🏆 New \(pr == .weight ? "weight" : "estimated 1RM") PR") } } label: { Label("Complete set", systemImage: "checkmark") }
                    .buttonStyle(PrimaryButtonStyle())
            }
            .padding(12)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 26, style: .continuous))
        }
    }

    private struct Stepper: View {
        let value: Double?; let unit: String; let minus: () -> Void; let plus: () -> Void
        var body: some View {
            HStack {
                Button(action: { minus(); Haptics.tap() }) { Image(systemName: "minus").frame(width: 44, height: 44) }.buttonStyle(.bordered).clipShape(Circle())
                VStack(spacing: 0) { Text(value.map { $0.formatted(.number.precision(.fractionLength(0...2))) } ?? "—").font(.title.bold().monospacedDigit()); Text(unit).font(.caption2.bold()).foregroundStyle(Theme.text2) }.frame(minWidth: 64)
                Button(action: { plus(); Haptics.tap() }) { Image(systemName: "plus").frame(width: 44, height: 44) }.buttonStyle(.bordered).clipShape(Circle())
            }.frame(maxWidth: .infinity)
        }
    }
}

struct MuscleTags: View {
    let def: ExerciseDefinition
    var body: some View {
        HStack(spacing: 4) {
            ForEach(def.primary, id: \.self) { Text($0.displayName).font(.caption2.weight(.semibold)).padding(.horizontal, 8).padding(.vertical, 3).background(Theme.accent.opacity(0.15), in: Capsule()).foregroundStyle(Color(hex: 0x9CCAFF)) }
            ForEach(def.secondary, id: \.self) { Text($0.displayName).font(.caption2).padding(.horizontal, 8).padding(.vertical, 3).background(Color.white.opacity(0.06), in: Capsule()).foregroundStyle(Theme.text2) }
        }
    }
}
