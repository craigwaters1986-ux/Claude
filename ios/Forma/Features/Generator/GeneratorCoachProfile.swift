import SwiftUI
import SwiftData
import GymCore
import UniformTypeIdentifiers
import AuthenticationServices

// MARK: - AI generator

struct GeneratorView: View {
    @Environment(\.modelContext) private var context
    @Environment(AppState.self) private var app
    @State var prefillTargets: [Muscle]
    @State private var goal: TrainingGoal = .hypertrophy
    @State private var minutes = 45
    @State private var injuries: Set<JointStress> = []
    @State private var plan: GeneratedPlan?
    @State private var issues: [String] = []
    @State private var busy = false

    var body: some View {
        let repo = WorkoutRepository(context: context)
        Form {
            Section("Goal") { Picker("Goal", selection: $goal) { ForEach(TrainingGoal.allCases, id: \.self) { Text($0.rawValue.capitalized).tag($0) } }.pickerStyle(.segmented) }
            Section("Duration") { Picker("Minutes", selection: $minutes) { ForEach([20, 30, 45, 60, 75, 90], id: \.self) { Text("\($0)").tag($0) } }.pickerStyle(.segmented) }
            Section("Target muscles (empty = recovery decides)") {
                ScrollView(.horizontal, showsIndicators: false) { HStack { ForEach(Muscle.allCases) { m in
                    Toggle(m.displayName, isOn: Binding(get: { prefillTargets.contains(m) }, set: { on in if on { prefillTargets.append(m) } else { prefillTargets.removeAll { $0 == m } } })).toggleStyle(.button)
                } } }
            }
            Section("Injuries / restrictions") {
                ForEach(JointStress.allCases, id: \.self) { j in Toggle(j.rawValue.capitalized, isOn: Binding(get: { injuries.contains(j) }, set: { $0 ? _ = injuries.insert(j) : _ = injuries.remove(j) })) }
                Text("Restricted joints remove exercises that load them. Not medical advice.").font(.caption).foregroundStyle(Theme.text2)
            }
            Section {
                Button { Task { await generate(repo) } } label: { Label(busy ? "Thinking…" : "Generate workout", systemImage: "sparkles") }.buttonStyle(PrimaryButtonStyle(ai: true)).disabled(busy)
            }.listRowBackground(Color.clear)
            if let plan {
                Section(plan.name) {
                    ForEach(issues, id: \.self) { Label($0, systemImage: "shield.lefthalf.filled").font(.caption) }
                    ForEach(plan.notes, id: \.self) { Text($0).font(.footnote).foregroundStyle(Theme.text1) }
                    ForEach(Array(plan.items.enumerated()), id: \.offset) { _, it in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(ExerciseLibrary.byID[it.exerciseID]?.name ?? it.exerciseID).font(.headline)
                            Text("\(it.sets) × \(it.repRange.map(String.init).joined(separator: "–")) · rest \(it.restSeconds)s\(it.suggestedWeightKg.map { " · \($0.formatted()) kg" } ?? "")").font(.subheadline.monospacedDigit())
                            ForEach(it.rationale, id: \.self) { Text("• \($0)").font(.caption).foregroundStyle(Theme.text2) }
                        }
                    }
                    Text("≈ \(OfflineGenerator.estimateMinutes(plan.items)) min").foregroundStyle(Theme.text2)
                    Button("Start this workout") { app.start(WorkoutSession.fromPlan(plan, history: repo.completedWorkouts()), repo: repo) }.buttonStyle(PrimaryButtonStyle())
                }
            }
        }
        .navigationTitle("AI generator")
    }

    private func generate(_ repo: WorkoutRepository) async {
        busy = true; defer { busy = false }
        let p = repo.profile()
        let constraints = GenerationConstraints(experience: Experience(rawValue: p.experience) ?? .intermediate,
                                                equipment: Set(p.equipment.compactMap(Equipment.init(rawValue:))),
                                                injuries: injuries.union(p.injuries.compactMap(JointStress.init(rawValue:))), dislikes: Set(p.dislikes))
        let history = repo.completedWorkouts()
        let local = OfflineGenerator.generate(.init(goal: goal, durationMinutes: minutes, targets: prefillTargets, constraints: constraints, preferred: Set(p.likes)),
                                              recovery: repo.recovery(health: app.health), history: history, catalog: repo.catalog())
        // Cloud AI (when enabled) would be called here via AIClient; its plan is ALWAYS
        // re-validated on device. The offline plan is used if the call fails or is disabled.
        let v = PlanValidator.validate(local, constraints: constraints, history: history, catalog: repo.catalog())
        withAnimation(Theme.Motion.spring) { plan = v.plan; issues = v.issues }
        Haptics.success()
    }
}

// MARK: - Coach (cloud assistant through Forma's server; grounded context only)

struct CoachView: View {
    @State private var messages: [(Bool, String)] = []
    @State private var draft = ""
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 10) {
                    if messages.isEmpty {
                        GlassCard { Text("Ask about your training. Answers use only your logged workouts and estimated recovery — the coach says so when it lacks data, and never invents records.").font(.subheadline) }
                    }
                    ForEach(Array(messages.enumerated()), id: \.offset) { _, m in
                        Text(m.1).padding(12).background(m.0 ? AnyShapeStyle(Theme.accentGradient) : AnyShapeStyle(Color.white.opacity(0.07)), in: RoundedRectangle(cornerRadius: 18))
                            .frame(maxWidth: .infinity, alignment: m.0 ? .trailing : .leading)
                    }
                }.padding()
            }
            .safeAreaInset(edge: .bottom) {
                HStack { TextField("Ask your coach…", text: $draft).textFieldStyle(.roundedBorder)
                    Button { messages.append((true, draft)); messages.append((false, "The cloud coach requires the Forma server (see server/README.md). The prototype includes an offline coach engine.")); draft = "" } label: { Image(systemName: "paperplane.fill") }.disabled(draft.isEmpty)
                }.padding()
            }
            .background(Theme.bg0).navigationTitle("Coach")
        }
    }
}

// MARK: - Profile & settings

struct ProfileView: View {
    @Environment(\.modelContext) private var context
    @Query private var profiles: [ProfileEntity]
    @State private var exportURL: URL?
    @State private var confirmDelete = false

    var body: some View {
        let repo = WorkoutRepository(context: context)
        let p = profiles.first ?? repo.profile()
        NavigationStack {
            Form {
                Section("Training") {
                    Picker("Goal", selection: Bindable(p).goal) { ForEach(TrainingGoal.allCases, id: \.self) { Text($0.rawValue.capitalized).tag($0.rawValue) } }
                    Picker("Experience", selection: Bindable(p).experience) { ForEach(Experience.allCases, id: \.self) { Text($0.rawValue.capitalized).tag($0.rawValue) } }
                    Picker("Units", selection: Bindable(p).unitsRaw) { Text("kg").tag("kg"); Text("lb").tag("lb") }.pickerStyle(.segmented)
                    Stepper("Default rest: \(p.restDefaultSeconds)s", value: Bindable(p).restDefaultSeconds, in: 15...600, step: 15)
                    Toggle("Haptics", isOn: Bindable(p).hapticsEnabled).onChange(of: p.hapticsEnabled) { _, v in Haptics.enabled = v }
                }
                Section {
                    Toggle("Apple Health", isOn: Bindable(p).healthKitEnabled).onChange(of: p.healthKitEnabled) { _, on in if on { Task { try? await HealthKitManager.shared.requestAuthorization() } } }
                    LabeledContent("Apple Watch", value: PhoneSessionManager.shared.isWatchAvailable ? "Forma installed" : "Not paired / not installed")
                    Toggle("Help improve rep counting", isOn: Binding(get: { MotionRecordings.optedIn }, set: { MotionRecordings.optedIn = $0 }))
                    if !MotionRecordings.files.isEmpty { ShareLink("Export \(MotionRecordings.files.count) motion recordings", items: MotionRecordings.files) }
                } header: { Text("Devices & health") } footer: { Text("Health reads sleep, resting HR and HRV to adjust estimated recovery (optional). Logging works without a watch.") }
                Section {
                    Toggle("Coach can use my workout history", isOn: Bindable(p).coachUsesHistory)
                    Toggle("Cloud AI", isOn: Bindable(p).cloudAIEnabled)
                } header: { Text("AI & privacy") } footer: { Text("Cloud AI sends a minimal training summary (no name, no notes) to Forma's server, which calls the model. No AI keys are stored on this device.") }
                Section {
                    let sync = SyncService.shared
                    if sync.isSignedIn {
                        LabeledContent("Last synced", value: sync.lastSync.map { $0.formatted(.relative(presentation: .named)) } ?? "Not yet")
                        Button("Sync now") { Task { await sync.sync(context: context) } }
                        Button("Sign out on this iPhone") { sync.signOut() }
                        Button("Delete cloud account", role: .destructive) { Task { await sync.deleteAccount() } }
                    } else {
                        SignInWithAppleButton(.signIn) { sync.prepare($0) } onCompletion: { r in Task { await sync.complete(r, context: context) } }
                            .signInWithAppleButtonStyle(.white).frame(height: 48)
                    }
                    if let e = sync.lastError { Text(e).font(.caption).foregroundStyle(.orange) }
                } header: { Text("Account & sync") } footer: { Text("Optional. Backs up workouts, templates and settings and keeps your devices in step. Logging always works offline.") }
                Section("Your data") {
                    Button("Export all data (JSON)") {
                        let url = FileManager.default.temporaryDirectory.appendingPathComponent("forma-export.json")
                        if let d = try? repo.exportAll(), (try? d.write(to: url)) != nil { exportURL = url }
                    }
                    if let exportURL { ShareLink(item: exportURL) }
                    Button("Delete all data", role: .destructive) { confirmDelete = true }
                }
            }
            .navigationTitle("Profile")
            .confirmationDialog("Delete everything?", isPresented: $confirmDelete, titleVisibility: .visible) { Button("Delete all data", role: .destructive) { try? repo.deleteAll() } } message: { Text("Workouts, templates and settings on this device will be permanently erased.") }
        }
    }
}

// MARK: - Onboarding

struct OnboardingView: View {
    @Environment(\.modelContext) private var context
    @State private var step = 0
    @State private var goal: TrainingGoal = .hypertrophy
    @State private var experience: Experience = .intermediate
    @State private var days: Set<Int> = [1, 2, 4, 5]
    @State private var units = "kg"
    @State private var minutes = 60
    @State private var equipment = Set(Equipment.allCases)

    var body: some View {
        VStack(spacing: 20) {
            ProgressView(value: Double(step), total: 6).tint(Theme.ice)
            TabView(selection: $step) {
                page(0, "Forma", "Effortless logging. Intelligent recovery. Training that adapts to you.") { EmptyView() }
                page(1, "Your goal", "Shapes rep ranges, rest and exercise choice.") { Picker("", selection: $goal) { ForEach(TrainingGoal.allCases, id: \.self) { Text($0.rawValue.capitalized).tag($0) } }.pickerStyle(.wheel) }
                page(2, "Experience", "Sets safe volume limits for the AI.") { Picker("", selection: $experience) { ForEach(Experience.allCases, id: \.self) { Text($0.rawValue.capitalized).tag($0) } }.pickerStyle(.segmented) }
                page(3, "Training days & length", "We'll suggest a split that fits.") {
                    HStack { ForEach(1...7, id: \.self) { d in Toggle(Calendar.current.veryShortWeekdaySymbols[d % 7], isOn: Binding(get: { days.contains(d) }, set: { $0 ? _ = days.insert(d) : _ = days.remove(d) })).toggleStyle(.button) } }
                    Picker("Minutes", selection: $minutes) { ForEach([20, 30, 45, 60, 75, 90], id: \.self) { Text("\($0) min").tag($0) } }.pickerStyle(.menu)
                }
                page(4, "Equipment & units", "") {
                    Picker("Units", selection: $units) { Text("Kilograms").tag("kg"); Text("Pounds").tag("lb") }.pickerStyle(.segmented)
                    ForEach(Equipment.allCases, id: \.self) { e in Toggle(e.rawValue.capitalized, isOn: Binding(get: { equipment.contains(e) }, set: { $0 ? _ = equipment.insert(e) : _ = equipment.remove(e) })) }
                }
                page(5, "Apple Health (optional)", "Sleep, resting HR and HRV can refine recovery estimates. Everything works without it.") {
                    Button("Connect Apple Health") { Task { try? await HealthKitManager.shared.requestAuthorization(); WorkoutRepository(context: context).profile().healthKitEnabled = true } }.buttonStyle(.bordered)
                }
                page(6, "Apple Watch (optional)", "Pair later from Profile. You don't need a watch to log workouts. Automatic rep counting is experimental and limited to supported exercises.") { EmptyView() }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            Button(step == 6 ? "Start training" : "Continue") {
                if step < 6 { withAnimation { step += 1 } } else { finish() }
            }.buttonStyle(PrimaryButtonStyle())
        }
        .padding(24).background(Theme.bg0).preferredColorScheme(.dark)
    }

    private func page<C: View>(_ tag: Int, _ title: String, _ sub: String, @ViewBuilder _ content: () -> C) -> some View {
        VStack(spacing: 16) { Text(title).font(.largeTitle.bold()); if !sub.isEmpty { Text(sub).multilineTextAlignment(.center).foregroundStyle(Theme.text1) }; content() }.tag(tag)
    }

    private func finish() {
        let p = WorkoutRepository(context: context).profile()
        p.goal = goal.rawValue; p.experience = experience.rawValue; p.trainingDays = days.sorted(); p.unitsRaw = units
        p.durationMinutes = minutes; p.equipment = equipment.map(\.rawValue); p.onboarded = true
        try? context.save(); Haptics.success()
    }
}
