import SwiftUI
import SwiftData
import GymCore

struct HomeView: View {
    @Environment(\.modelContext) private var context
    @Environment(AppState.self) private var app
    @State private var coachOpen = false

    var body: some View {
        let repo = WorkoutRepository(context: context)
        let snapshot = repo.recovery(health: app.health)
        let workouts = repo.completedWorkouts(since: .now.addingTimeInterval(-14 * 86_400))
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    GlassCard(glow: true) {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack { Text("ESTIMATED RECOVERY").font(.caption.weight(.semibold)).foregroundStyle(Theme.text2); Spacer()
                                Text(app.health == nil ? "Training log only" : "Apple Health").font(.caption2.bold()).padding(6).background(.white.opacity(0.08), in: Capsule()) }
                            HStack(spacing: 18) {
                                RecoveryRing(percent: snapshot.overall)
                                VStack(alignment: .leading, spacing: 6) {
                                    Text(snapshot.overall >= 90 ? "Primed" : snapshot.overall >= 75 ? "Ready" : snapshot.overall >= 55 ? "Moderate" : "Recover")
                                        .font(.title.bold()).foregroundStyle(Theme.accentGradient)
                                    Text("\(snapshot.muscles.filter { $0.status == .ready }.count) of \(Muscle.allCases.count) muscle groups ready").font(.subheadline).foregroundStyle(Theme.text1)
                                }
                            }
                            EstimateDisclaimer()
                        }
                    }
                    SuggestedWorkoutCard(snapshot: snapshot)
                    GlassCard {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("This week").font(.headline)
                            let week = workouts.filter { $0.startedAt > .now.addingTimeInterval(-7 * 86_400) }
                            HStack {
                                stat("\(week.count)", "Workouts"); stat("\(week.reduce(0) { $0 + $1.hardSetCount })", "Sets")
                                stat(week.reduce(0) { $0 + $1.volumeKg }.formatted(.number.notation(.compactName)), "kg lifted")
                            }
                        }
                    }
                    Button { coachOpen = true } label: { Label("Ask your coach", systemImage: "sparkles").frame(maxWidth: .infinity) }.buttonStyle(PrimaryButtonStyle(ai: true))
                }
                .padding(16)
            }
            .background(Theme.bg0)
            .navigationTitle(greeting)
            .sheet(isPresented: $coachOpen) { CoachView() }
        }
    }

    private var greeting: String { let h = Calendar.current.component(.hour, from: .now); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening" }
    private func stat(_ v: String, _ l: String) -> some View { VStack(alignment: .leading) { Text(v).font(.title2.bold().monospacedDigit()); Text(l.uppercased()).font(.caption2.weight(.semibold)).foregroundStyle(Theme.text2) }.frame(maxWidth: .infinity, alignment: .leading) }
}

private struct SuggestedWorkoutCard: View {
    @Environment(\.modelContext) private var context
    @Environment(AppState.self) private var app
    let snapshot: RecoverySnapshot
    var body: some View {
        let ready = snapshot.muscles.filter { $0.status == .ready }.sorted { $0.weeklySets < $1.weeklySets }.prefix(4).map(\.muscle)
        GlassCard {
            VStack(alignment: .leading, spacing: 8) {
                Label("NEXT SUGGESTED WORKOUT", systemImage: "sparkles").font(.caption.weight(.semibold)).foregroundStyle(Theme.violet)
                Text(ready.isEmpty ? "Rest & mobility" : ready.map(\.displayName).joined(separator: " · ")).font(.title3.bold())
                Text("Built from your freshest, least-trained muscles. Open the generator to customise.").font(.footnote).foregroundStyle(Theme.text1)
                NavigationLink { GeneratorView(prefillTargets: Array(ready)) } label: { Label("Generate", systemImage: "wand.and.stars").frame(maxWidth: .infinity) }.buttonStyle(PrimaryButtonStyle(ai: true))
            }
        }
    }
}

struct TrainView: View {
    @Environment(\.modelContext) private var context
    @Environment(AppState.self) private var app
    @Query(sort: \TemplateEntity.createdAt) private var templates: [TemplateEntity]
    @State private var showWatch = false

    var body: some View {
        let repo = WorkoutRepository(context: context)
        NavigationStack {
            List {
                Section {
                    Button { app.start(WorkoutRecord(name: "\(Date.now.formatted(.dateTime.weekday(.wide))) Workout"), repo: repo) } label: { Label("Start empty workout", systemImage: "plus") }
                        .buttonStyle(PrimaryButtonStyle()).listRowBackground(Color.clear).disabled(app.session != nil)
                    NavigationLink { GeneratorView(prefillTargets: []) } label: { Label("AI workout generator", systemImage: "sparkles") }
                    NavigationLink { ExerciseLibraryView() } label: { Label("Exercise library", systemImage: "list.bullet.rectangle") }
                }
                Section("Templates") {
                    if templates.isEmpty { Text("Finish a workout and save it as a template.").foregroundStyle(Theme.text2) }
                    ForEach(templates) { t in
                        Button { app.start(WorkoutSession.fromTemplate(name: t.name, items: t.items, history: repo.completedWorkouts()), repo: repo) } label: {
                            VStack(alignment: .leading) { Text(t.name).font(.headline); Text(t.items.compactMap { ExerciseLibrary.byID[$0.exerciseID]?.name }.joined(separator: " · ")).font(.caption).foregroundStyle(Theme.text2).lineLimit(2) }
                        }
                    }.onDelete { idx in idx.map { templates[$0] }.forEach(context.delete) }
                }
                Section("Recent") {
                    ForEach(repo.completedWorkouts().suffix(10).reversed()) { w in
                        VStack(alignment: .leading) { Text(w.name).font(.headline); Text("\(w.hardSetCount) sets · \(Int(w.volumeKg)) kg · \(w.startedAt.formatted(.relative(presentation: .named)))").font(.caption).foregroundStyle(Theme.text2) }
                    }
                }
            }
            .scrollContentBackground(.hidden).background(Theme.bg0)
            .navigationTitle("Train")
        }
    }
}

struct ExerciseLibraryView: View {
    @State private var query = ""
    var body: some View {
        List(ExerciseLibrary.all.filter { query.isEmpty || $0.name.localizedCaseInsensitiveContains(query) }) { ex in
            VStack(alignment: .leading, spacing: 6) {
                HStack { Text(ex.name).font(.headline); Spacer(); if ex.watch == .supported { Image(systemName: "applewatch").foregroundStyle(Theme.ice).accessibilityLabel("Apple Watch rep counting target") } }
                MuscleTags(def: ex)
            }
        }
        .searchable(text: $query).navigationTitle("Exercises")
    }
}

struct ExercisePicker: View {
    let catalog: ExerciseCatalog
    let onPick: (String) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var query = ""
    var body: some View {
        NavigationStack {
            List(catalog.byID.values.sorted { $0.name < $1.name }.filter { query.isEmpty || $0.name.localizedCaseInsensitiveContains(query) || $0.primary.contains { $0.displayName.localizedCaseInsensitiveContains(query) } }) { ex in
                Button { onPick(ex.id); Haptics.tap(); dismiss() } label: { VStack(alignment: .leading, spacing: 6) { Text(ex.name).font(.headline); MuscleTags(def: ex) } }
            }
            .searchable(text: $query, prompt: "Search exercises").navigationTitle("Add exercise")
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
        }
    }
}
