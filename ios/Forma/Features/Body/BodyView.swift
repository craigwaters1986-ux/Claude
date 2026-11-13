import SwiftUI
import SceneKit
import ModelIO
import SceneKit.ModelIO
import SwiftData
import GymCore

/// Body tab: 3D muscle map + recovery dashboard.
///
/// The mannequin is the same procedural, stylised muscle-GROUP model as the
/// prototype (prototype/js/ui/mannequin.js). For production, replace
/// `MuscleMapScene.build()` with a licensed segmented anatomy asset (USDZ with
/// one node per muscle, named by `Muscle.rawValue`) — colouring, picking and
/// camera code stay unchanged. See docs/01-product-design.md.
struct BodyView: View {
    @Environment(\.modelContext) private var context
    @Environment(AppState.self) private var app
    @State private var selected: Muscle?
    @State private var showBack = false
    @State private var tab = 0
    @AppStorage("forma.anatomicalModel") private var anatomical = false

    var body: some View {
        let repo = WorkoutRepository(context: context)
        let snap = repo.recovery(health: app.health)
        NavigationStack {
            ScrollView {
                VStack(spacing: 14) {
                    Picker("View", selection: $tab) { Text("Anatomy").tag(0); Text("Recovery dashboard").tag(1) }.pickerStyle(.segmented)
                    if tab == 0 {
                        ZStack(alignment: .top) {
                            MuscleMapView(colors: Dictionary(uniqueKeysWithValues: snap.muscles.map { ($0.muscle, UIColor(Theme.recovery($0.status))) }), selected: $selected, showBack: showBack, anatomical: anatomical)
                                .id(anatomical)
                                .frame(height: 460)
                                .accessibilityLabel("3D muscle model. Use the list below for VoiceOver.")
                            Picker("Side", selection: $showBack) { Text("Front").tag(false); Text("Rear").tag(true) }.pickerStyle(.segmented).frame(width: 160)
                        }
                        if let m = selected { MuscleCallout(r: snap[m], repo: repo) }
                        else { Text("Tap a muscle for details").font(.footnote).foregroundStyle(Theme.text2) }
                        Picker("Model", selection: $anatomical) { Text("Stylised").tag(false); Text("Anatomical").tag(true) }.pickerStyle(.segmented)
                        Text(anatomical ? "Muscle meshes from BodyParts3D © DBCLS (see Acknowledgements). Abs and lats are approximate." : "Stylised muscle-group model for training guidance — not anatomically exact.")
                            .font(.caption2).foregroundStyle(Theme.text2)
                    } else {
                        RecoveryDashboard(snapshot: snap, health: app.health)
                    }
                    GlassCard {
                        VStack(spacing: 0) {
                            ForEach(snap.muscles.sorted { $0.percent < $1.percent }) { r in
                                Button { selected = r.muscle; tab = 0 } label: {
                                    HStack { Circle().fill(Theme.recovery(r.status)).frame(width: 8); Text(r.muscle.displayName); Spacer(); Text("\(r.percent)%").monospacedDigit().bold() }.padding(.vertical, 10)
                                }.accessibilityLabel("\(r.muscle.displayName), \(r.percent) percent estimated recovery, \(Theme.label(r.status))")
                            }
                        }
                    }
                }.padding(16)
            }
            .background(Theme.bg0).navigationTitle("Muscle map")
        }
    }
}

private struct MuscleCallout: View {
    let r: MuscleRecovery
    let repo: WorkoutRepository
    var body: some View {
        GlassCard(glow: true) {
            VStack(alignment: .leading, spacing: 10) {
                Text(r.muscle.displayName.uppercased()).font(.caption.weight(.semibold)).foregroundStyle(Theme.text2)
                HStack(alignment: .firstTextBaseline) { Text("\(r.percent)%").font(.system(size: 46, weight: .bold, design: .rounded)).foregroundStyle(Theme.recovery(r.status)); Text("recovered").foregroundStyle(Theme.text1) }
                Grid(alignment: .leading, horizontalSpacing: 16, verticalSpacing: 8) {
                    GridRow { kv("Est. ready (≥90%)", r.hoursToReady == 0 ? "Now" : "\(r.hoursToReady) h"); kv("Est. full (≥95%)", r.hoursToFull == 0 ? "Now" : "\(r.hoursToFull) h") }
                    GridRow { kv("Last trained", r.lastTrained.map { $0.formatted(.relative(presentation: .named)) } ?? "Not logged"); kv("Weekly sets", r.weeklySets.formatted()) }
                }
                Label(r.status.recommendation, systemImage: "sparkles").font(.footnote)
                HStack {
                    ForEach(RecoveryEngine.Feel.allCases, id: \.self) { f in
                        Button(f.rawValue.capitalized) {
                            let p = repo.profile()
                            let personal = Dictionary(uniqueKeysWithValues: p.personalRecovery.compactMap { k, v in Muscle(rawValue: k).map { ($0, v) } })
                            p.personalRecovery = Dictionary(uniqueKeysWithValues: RecoveryEngine().adapt(personal, muscle: r.muscle, predicted: r.percent, feel: f).map { ($0.key.rawValue, $0.value) })
                            Haptics.success()
                        }.buttonStyle(.bordered).font(.caption)
                    }
                }
                EstimateDisclaimer(text: "Estimate, not a physiological measurement. Feedback tunes your personal model.")
            }
        }
    }
    private func kv(_ k: String, _ v: String) -> some View { VStack(alignment: .leading) { Text(k.uppercased()).font(.caption2.weight(.semibold)).foregroundStyle(Theme.text2); Text(v).font(.headline) } }
}

struct RecoveryDashboard: View {
    let snapshot: RecoverySnapshot
    let health: HealthSignals?
    var body: some View {
        VStack(spacing: 12) {
            GlassCard(glow: true) { HStack(spacing: 16) { RecoveryRing(percent: snapshot.overall, size: 120); Text("Overall estimated recovery").font(.headline) } }
            GlassCard {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Recovery signals").font(.headline)
                    if let h = health {
                        Text("Sleep \(h.sleepHours.map { String(format: "%.1f h", $0) } ?? "—") · HRV \(h.hrvZScore.map { String(format: "%+.1f SD", $0) } ?? "—") · RHR \(h.restingHRDelta.map { String(format: "%+.0f bpm", $0) } ?? "—")").font(.subheadline)
                        Text(snapshot.healthReasons.isEmpty ? "No adjustment today." : "Adjusting ×\(snapshot.healthFactor.formatted(.number.precision(.fractionLength(2)))): \(snapshot.healthReasons.joined(separator: "; "))").font(.footnote).foregroundStyle(Theme.text1)
                    } else { Text("Apple Health not connected — estimates use your training log only.").font(.footnote).foregroundStyle(Theme.text1) }
                    EstimateDisclaimer(text: "Sleep, HRV and resting HR vary for many reasons; they adjust recovery speed by at most 30% and are never used for diagnosis.")
                }
            }
        }
    }
}

// MARK: - SceneKit mannequin

struct MuscleMapView: UIViewRepresentable {
    var colors: [Muscle: UIColor]
    @Binding var selected: Muscle?
    var showBack: Bool
    var anatomical = false

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIView(context: Context) -> SCNView {
        let v = SCNView()
        v.scene = (anatomical ? MuscleMapScene.loadAnatomical() : nil) ?? MuscleMapScene.build()
        v.backgroundColor = .clear
        v.allowsCameraControl = true            // 360° rotate + pinch zoom
        v.defaultCameraController.interactionMode = .orbitTurntable
        v.defaultCameraController.maximumVerticalAngle = 35
        v.antialiasingMode = .multisampling4X
        v.addGestureRecognizer(UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.tap(_:))))
        return v
    }

    func updateUIView(_ v: SCNView, context: Context) {
        context.coordinator.parent = self
        v.scene?.rootNode.enumerateChildNodes { node, _ in
            guard let name = node.name, let m = AnatomyMapping.muscle(forMeshName: name), let mat = node.geometry?.firstMaterial else { return }
            let c = colors[m] ?? .darkGray
            mat.diffuse.contents = c
            mat.emission.contents = c.withAlphaComponent(m == selected ? 0.9 : (selected == nil ? 0.35 : 0.1))
        }
        let target: Float = showBack ? .pi : 0
        if let body = v.scene?.rootNode.childNode(withName: "body", recursively: false), body.eulerAngles.y != target {
            SCNTransaction.begin(); SCNTransaction.animationDuration = 0.6; body.eulerAngles.y = target; SCNTransaction.commit()
        }
    }

    final class Coordinator: NSObject {
        var parent: MuscleMapView
        init(_ p: MuscleMapView) { parent = p }
        @MainActor @objc func tap(_ g: UITapGestureRecognizer) {
            guard let v = g.view as? SCNView else { return }
            let hit = v.hitTest(g.location(in: v), options: [.searchMode: SCNHitTestSearchMode.closest.rawValue]).first { $0.node.name.flatMap(AnatomyMapping.muscle(forMeshName:)) != nil }
            parent.selected = hit?.node.name.flatMap(AnatomyMapping.muscle(forMeshName:))
            if hit != nil { Haptics.tap() }
        }
    }
}

enum MuscleMapScene {
    /// Bundled BodyParts3D muscle model (USD text, built by tools/anatomy/build-bodyparts3d.mjs).
    /// Any USD/USDZ whose mesh names use anatomical terms works the same way.
    static func loadAnatomical(named name: String = "bodyparts3d-muscles", ext: String = "usda") -> SCNScene? {
        guard let url = Bundle.main.url(forResource: name, withExtension: ext) else { return nil }
        let asset = MDLAsset(url: url)
        guard asset.count > 0 else { return nil }
        let loaded = SCNScene(mdlAsset: asset)
        let scene = SCNScene()
        let body = SCNNode(); body.name = "body"; scene.rootNode.addChildNode(body)
        loaded.rootNode.childNodes.forEach { body.addChildNode($0) }
        body.enumerateChildNodes { node, _ in
            guard node.geometry != nil else { return }
            let mat = SCNMaterial(); mat.lightingModel = .physicallyBased; mat.roughness.contents = 0.45
            if node.name.flatMap(AnatomyMapping.muscle(forMeshName:)) == nil { mat.diffuse.contents = UIColor(red: 0.08, green: 0.1, blue: 0.15, alpha: 1) }
            node.geometry?.materials = [mat]
        }
        let base = build()      // reuse camera + lights from the stylised scene
        base.rootNode.childNodes.filter { $0.light != nil || $0.camera != nil }.forEach { scene.rootNode.addChildNode($0) }
        return scene
    }

    /// Procedural stylised mannequin (metres). Muscle nodes are named by Muscle.rawValue.
    static func build() -> SCNScene {
        let scene = SCNScene()
        let body = SCNNode(); body.name = "body"; scene.rootNode.addChildNode(body)
        let skin = SCNMaterial(); skin.diffuse.contents = UIColor(red: 0.08, green: 0.1, blue: 0.15, alpha: 1); skin.metalness.contents = 0.35; skin.roughness.contents = 0.42; skin.lightingModel = .physicallyBased
        func part(_ g: SCNGeometry, _ p: SCNVector3, scale: SCNVector3 = SCNVector3(1, 1, 1)) { g.firstMaterial = skin; let n = SCNNode(geometry: g); n.position = p; n.scale = scale; body.addChildNode(n) }
        func muscle(_ m: Muscle, _ p: SCNVector3, _ s: SCNVector3, rotZ: Float = 0) {
            let g = SCNSphere(radius: 1); g.segmentCount = 32
            let mat = SCNMaterial(); mat.lightingModel = .physicallyBased; mat.roughness.contents = 0.35; g.firstMaterial = mat
            let n = SCNNode(geometry: g); n.name = m.rawValue; n.position = p; n.scale = s; n.eulerAngles.z = rotZ; body.addChildNode(n)
        }
        // Torso, head, limbs
        part(SCNCapsule(capRadius: 0.17, height: 0.62), SCNVector3(0, 1.21, 0), scale: SCNVector3(1, 1, 0.62))
        part(SCNSphere(radius: 0.1), SCNVector3(0, 1.69, 0), scale: SCNVector3(0.88, 1.1, 1))
        for s: Float in [-1, 1] {
            part(SCNCapsule(capRadius: 0.044, height: 0.3), SCNVector3(s * 0.235, 1.28, 0))
            part(SCNCapsule(capRadius: 0.036, height: 0.29), SCNVector3(s * 0.255, 0.98, 0.02))
            part(SCNCapsule(capRadius: 0.075, height: 0.47), SCNVector3(s * 0.09, 0.72, 0))
            part(SCNCapsule(capRadius: 0.05, height: 0.42), SCNVector3(s * 0.09, 0.27, 0))
            // Muscles (same layout as the web prototype)
            muscle(.chest, SCNVector3(s * 0.082, 1.36, 0.095), SCNVector3(0.092, 0.066, 0.045), rotZ: s * 0.12)
            muscle(.frontDelts, SCNVector3(s * 0.215, 1.42, 0.04), SCNVector3(0.046, 0.065, 0.04))
            muscle(.sideDelts, SCNVector3(s * 0.245, 1.41, 0), SCNVector3(0.035, 0.065, 0.048))
            muscle(.rearDelts, SCNVector3(s * 0.215, 1.42, -0.04), SCNVector3(0.044, 0.06, 0.036))
            muscle(.biceps, SCNVector3(s * 0.24, 1.27, 0.03), SCNVector3(0.034, 0.088, 0.03))
            muscle(.triceps, SCNVector3(s * 0.24, 1.29, -0.03), SCNVector3(0.038, 0.1, 0.031))
            muscle(.forearms, SCNVector3(s * 0.257, 0.99, 0.025), SCNVector3(0.04, 0.095, 0.036))
            muscle(.obliques, SCNVector3(s * 0.112, 1.17, 0.045), SCNVector3(0.036, 0.08, 0.045))
            muscle(.traps, SCNVector3(s * 0.075, 1.47, -0.055), SCNVector3(0.085, 0.04, 0.04), rotZ: -s * 0.35)
            muscle(.lats, SCNVector3(s * 0.112, 1.28, -0.066), SCNVector3(0.066, 0.13, 0.04), rotZ: -s * 0.18)
            muscle(.upperBack, SCNVector3(s * 0.05, 1.37, -0.1), SCNVector3(0.05, 0.065, 0.03))
            muscle(.lowerBack, SCNVector3(s * 0.032, 1.12, -0.078), SCNVector3(0.026, 0.09, 0.026))
            muscle(.glutes, SCNVector3(s * 0.075, 0.96, -0.08), SCNVector3(0.08, 0.085, 0.058))
            muscle(.quads, SCNVector3(s * 0.095, 0.74, 0.034), SCNVector3(0.064, 0.17, 0.05))
            muscle(.hamstrings, SCNVector3(s * 0.09, 0.73, -0.034), SCNVector3(0.058, 0.16, 0.046))
            muscle(.adductors, SCNVector3(s * 0.052, 0.81, 0.008), SCNVector3(0.032, 0.12, 0.04))
            muscle(.calves, SCNVector3(s * 0.09, 0.38, -0.024), SCNVector3(0.045, 0.11, 0.038))
            for y: Float in [1.1, 1.17, 1.24] { muscle(.abs, SCNVector3(s * 0.031, y, 0.083), SCNVector3(0.028, 0.03, 0.015)) }
        }
        // Lighting: cool key + blue/violet rims
        let cam = SCNNode(); cam.camera = SCNCamera(); cam.camera?.fieldOfView = 32; cam.position = SCNVector3(0, 1.0, 3.2); scene.rootNode.addChildNode(cam)
        for (color, pos, intensity) in [(UIColor.white, SCNVector3(1.5, 2.5, 3), 1200.0), (UIColor(red: 0.18, green: 0.55, blue: 1, alpha: 1), SCNVector3(-2.5, 1.5, -2.5), 1600.0), (UIColor(red: 0.43, green: 0.36, blue: 1, alpha: 1), SCNVector3(2.5, 1.2, -2), 1000.0)] {
            let l = SCNNode(); l.light = SCNLight(); l.light?.type = .directional; l.light?.color = color; l.light?.intensity = intensity; l.look(at: SCNVector3(0, 1, 0)); l.position = pos; scene.rootNode.addChildNode(l)
        }
        let amb = SCNNode(); amb.light = SCNLight(); amb.light?.type = .ambient; amb.light?.intensity = 300; amb.light?.color = UIColor(red: 0.6, green: 0.8, blue: 1, alpha: 1); scene.rootNode.addChildNode(amb)
        return scene
    }
}
