import SwiftUI
import SwiftData
import GymCore

@main
struct FormaApp: App {
    let container: ModelContainer = {
        do { return try ModelContainer(for: Schema(FormaSchema.models)) }
        catch { fatalError("Could not open the local database: \(error)") }
    }()

    init() {
        PhoneSessionManager.shared.activate()
        SyncService.shared.start(container: container)   // network-regain + background refresh sync
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .preferredColorScheme(.dark)
                .tint(Theme.accent)
        }
        .modelContainer(container)
    }
}

/// App-wide state: the active workout session and derived recovery.
@MainActor @Observable
final class AppState {
    var session: WorkoutSession?
    var showingWorkout = false
    var health: HealthSignals?
    var lastSummary: (WorkoutRecord, [StrengthAnalytics.PersonalRecord])?

    func start(_ record: WorkoutRecord, repo: WorkoutRepository) {
        let p = repo.profile()
        let s = WorkoutSession(workout: record, history: repo.completedWorkouts(), catalog: repo.catalog(), units: p.units, restDefault: p.restDefaultSeconds)
        s.onChange = { w in
            ActiveWorkoutStore.save(w)                                                   // crash-safe autosave
            PhoneSessionManager.shared.publish(plan: .from(w, units: p.units, recordMotion: MotionRecordings.optedIn))           // keep the watch in sync
        }
        PhoneSessionManager.shared.onSetCompleted = { [weak s] r in s?.apply(r) }
        ActiveWorkoutStore.save(record)
        PhoneSessionManager.shared.send(.workoutStarted(workoutID: record.id, at: record.startedAt))
        session = s; showingWorkout = true
    }

    /// Restores an in-progress workout after the app was killed.
    func restore(repo: WorkoutRepository) { if session == nil, let w = ActiveWorkoutStore.load() { start(w, repo: repo); showingWorkout = false } }

    func finish(_ w: WorkoutRecord, prs: [StrengthAnalytics.PersonalRecord], repo: WorkoutRepository) {
        try? repo.save(w)
        ActiveWorkoutStore.clear()
        Task { await SyncService.shared.sync(context: repo.context) }
        PhoneSessionManager.shared.send(.workoutEnded(workoutID: w.id, at: w.endedAt ?? .now, activeEnergyKcal: nil, avgHeartRate: nil))
        session = nil; showingWorkout = false; lastSummary = (w, prs)
    }

    func discard() { ActiveWorkoutStore.clear(); session = nil; showingWorkout = false }
}

struct RootView: View {
    @Environment(\.modelContext) private var context
    @State private var app = AppState()
    @Query private var profiles: [ProfileEntity]

    var body: some View {
        let repo = WorkoutRepository(context: context)
        TabView {
            HomeView().tabItem { Label("Home", systemImage: "house.fill") }
            TrainView().tabItem { Label("Train", systemImage: "dumbbell.fill") }
            BodyView().tabItem { Label("Body", systemImage: "figure.stand") }
            ProgressDashboardView().tabItem { Label("Progress", systemImage: "chart.bar.fill") }
            ProfileView().tabItem { Label("Profile", systemImage: "person.crop.circle") }
        }
        .environment(app)
        .safeAreaInset(edge: .bottom) {
            if app.session != nil && !app.showingWorkout {
                Button { app.showingWorkout = true } label: { Label("Resume workout", systemImage: "timer").frame(maxWidth: .infinity) }
                    .buttonStyle(PrimaryButtonStyle()).padding(.horizontal).padding(.bottom, 52)
            }
        }
        .fullScreenCover(isPresented: $app.showingWorkout) {
            if let s = app.session {
                ActiveWorkoutView(model: s, goal: repo.profile().goal,
                                  onFinish: { w, prs in app.finish(w, prs: prs, repo: repo) },
                                  onDiscard: { app.discard() })
            }
        }
        .fullScreenCover(isPresented: .constant(!(profiles.first?.onboarded ?? false))) { OnboardingView() }
        .task {
            app.restore(repo: repo)
            if repo.profile().healthKitEnabled { app.health = await HealthKitManager.shared.recoverySignals() }
        }
    }
}
