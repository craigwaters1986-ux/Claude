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
    @State private var weekly = false
    @State private var daysPerWeek = 4
    @State private var injuries: Set<JointStress> = []
    @State private var plan: GeneratedPlan?
    @State private var program: WeeklyProgram?
    @State private var issues: [String] = []
    @State private var source = ""
    @State private var busy = false

    var body: some View {
        let repo = WorkoutRepository(context: context)
        Form {
            Section { Picker("Plan", selection: $weekly) { Text("Single workout").tag(false); Text("Weekly programme").tag(true) }.pickerStyle(.segmented) }
            Section("Goal") { Picker("Goal", selection: $goal) { ForEach(TrainingGoal.allCases, id: \.self) { Text($0.rawValue.capitalized).tag($0) } }.pickerStyle(.segmented) }
            Section("Duration") { Picker("Minutes", selection: $minutes) { ForEach([20, 30, 45, 60, 75, 90], id: \.self) { Text("\($0)").tag($0) } }.pickerStyle(.segmented) }
            if weekly { Section("Days per week") { Stepper("\(daysPerWeek) days · \(TrainingSplit.auto(daysPerWeek: daysPerWeek).label)", value: $daysPerWeek, in: 2...6) } }
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
                Button { Task { await generate(repo) } } label: { Label(busy ? "Thinking…" : weekly ? "Generate programme" : "Generate workout", systemImage: "sparkles") }
                    .buttonStyle(PrimaryButtonStyle(ai: true)).disabled(busy)
            }.listRowBackground(Color.clear)
            if let program, weekly {
                Section(program.split.label) {
                    ForEach(program.rationale, id: \.self) { Text($0).font(.footnote).foregroundStyle(Theme.text1) }
                    ForEach(Array(program.sessions.enumerated()), id: \.offset) { _, day in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(day.name).font(.headline)
                            Text(day.items.compactMap { ExerciseLibrary.byID[$0.exerciseID]?.name }.joined(separator: " · ")).font(.caption).foregroundStyle(Theme.text2)
                            Button("Start") { app.start(WorkoutSession.fromPlan(day, history: repo.completedWorkouts()), repo: repo) }.font(.caption.bold())
                        }
                    }
                    Button("Save all as templates") {
                        for day in program.sessions { context.insert(TemplateEntity(name: day.name, items: day.items.map { TemplateItem(exerciseID: $0.exerciseID, sets: $0.sets, restSeconds: $0.restSeconds) })) }
                        try? context.save(); Haptics.success()
                    }
                }
            } else if let plan {
                Section(plan.name) {
                    Text(source).font(.caption2.bold()).foregroundStyle(Theme.violet)
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
        let history = repo.completedWorkouts(), catalog = repo.catalog()
        let recovery = repo.recovery(health: app.health)
        let input = GeneratorInput(goal: goal, durationMinutes: minutes, targets: prefillTargets, constraints: constraints, preferred: Set(p.likes))
        if weekly {
            let pr = OfflineGenerator.program(input, daysPerWeek: daysPerWeek, history: history, catalog: catalog)
            withAnimation(Theme.Motion.spring) { program = pr }; Haptics.success(); return
        }
        var candidate = OfflineGenerator.generate(input, recovery: recovery, history: history, catalog: catalog)
        var label = "On-device AI"; var extra: [String] = []
        if p.cloudAIEnabled {
            do {
                let req = CloudAPI.generateRequest(input, location: p.location, likes: p.likes, recovery: recovery, history: history, includeHistory: p.coachUsesHistory)
                let res = try await AIClient().generate(req)
                candidate = res.generatedPlan; label = "Cloud AI · validated on device"; extra = res.issues
            } catch { extra = ["Cloud AI unavailable — used the on-device engine."] }
        }
        // Defence in depth: every plan, cloud or local, passes the same safety rules.
        let v = PlanValidator.validate(candidate, constraints: constraints, history: history, catalog: catalog)
        withAnimation(Theme.Motion.spring) { plan = v.plan; issues = extra + v.issues; source = label; program = nil }
        Haptics.success()
    }
}

// MARK: - Coach (grounded; cloud via Forma's server when enabled, otherwise on device)

struct CoachView: View {
    @Environment(\.modelContext) private var context
    @Environment(AppState.self) private var app
    @State private var messages: [(user: Bool, text: String, plan: GeneratedPlan?)] = []
    @State private var draft = ""
    @State private var thinking = false
    private let suggestions = ["Build me a 45-minute chest and triceps workout.", "What muscles should I train today?", "Why has my bench press stopped improving?", "Give me an alternative to barbell squats.", "How much should I bench next session?"]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 10) {
                    if messages.isEmpty {
                        GlassCard { Text("I answer from your logged workouts and estimated recovery only. When I don't have the data, I'll say so — I never invent records.").font(.subheadline) }
                        ForEach(suggestions, id: \.self) { s in Button(s) { Task { await send(s) } }.buttonStyle(.bordered).frame(maxWidth: .infinity, alignment: .leading) }
                    }
                    ForEach(Array(messages.enumerated()), id: \.offset) { _, m in
                        VStack(alignment: .leading, spacing: 8) {
                            Text(m.text)
                            if let plan = m.plan {
                                Button("Start this workout") { let repo = WorkoutRepository(context: context); app.start(WorkoutSession.fromPlan(plan, history: repo.completedWorkouts()), repo: repo) }.buttonStyle(.borderedProminent)
                            }
                        }
                        .padding(12).background(m.user ? AnyShapeStyle(Theme.accentGradient) : AnyShapeStyle(Color.white.opacity(0.07)), in: RoundedRectangle(cornerRadius: 18))
                        .frame(maxWidth: .infinity, alignment: m.user ? .trailing : .leading)
                    }
                    if thinking { ProgressView().padding() }
                }.padding()
            }
            .safeAreaInset(edge: .bottom) {
                HStack { TextField("Ask your coach…", text: $draft).textFieldStyle(.roundedBorder).submitLabel(.send).onSubmit { Task { await send(draft) } }
                    Button { Task { await send(draft) } } label: { Image(systemName: "paperplane.fill") }.disabled(draft.isEmpty || thinking).accessibilityLabel("Send")
                }.padding()
            }
            .background(Theme.bg0).navigationTitle("Coach")
        }
    }

    private func send(_ q: String) async {
        let q = q.trimmingCharacters(in: .whitespaces); guard !q.isEmpty, !thinking else { return }
        draft = ""; messages.append((true, q, nil)); thinking = true; defer { thinking = false }
        let repo = WorkoutRepository(context: context); let p = repo.profile()
        let history = p.coachUsesHistory ? repo.completedWorkouts() : []
        let recovery = repo.recovery(health: app.health)
        let constraints = GenerationConstraints(experience: Experience(rawValue: p.experience) ?? .intermediate, equipment: Set(p.equipment.compactMap(Equipment.init(rawValue:))),
                                                injuries: Set(p.injuries.compactMap(JointStress.init(rawValue:))), dislikes: Set(p.dislikes))
        let local = OfflineCoach.answer(q, .init(history: history, recovery: recovery, constraints: constraints, goal: TrainingGoal(rawValue: p.goal) ?? .hypertrophy,
                                                 durationMinutes: p.durationMinutes, healthConnected: app.health != nil, catalog: repo.catalog()))
        if p.cloudAIEnabled {
            let transcript = messages.dropLast().suffix(8).map { CloudAPI.CoachRequest.Turn(role: $0.user ? "user" : "bot", text: $0.text) }
            if let r = try? await AIClient().coach(.init(question: q, transcript: Array(transcript), context: CloudAPI.context(recovery: recovery, history: history, includeHistory: p.coachUsesHistory), healthConnected: app.health != nil)) {
                messages.append((false, r.text, local.plan.map { PlanValidator.validate($0, constraints: constraints, history: history).plan })); return
            }
            messages.append((false, local.text + "\n\n(Cloud coach unavailable — answered on device.)", local.plan)); return
        }
        messages.append((false, local.text, local.plan))
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
