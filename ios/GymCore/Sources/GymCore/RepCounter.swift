import Foundation

/// Wrist-motion repetition counter. Same algorithm as prototype/js/core/repcounter.js
/// (tests use the same synthetic traces). Input mirrors CMDeviceMotion:
/// `gravity` (unit vector, device frame) and `userAcceleration` (g).
///
/// Strategies:
///  • .orientation — forearm rotates (curls, raises): track the gravity component
///    on the axis with the most variance.
///  • .vertical — wrist translates (presses, rows): project userAcceleration on
///    gravity and leaky-integrate to a velocity-like signal (one cycle per rep).
/// Reps are counted by an adaptive-hysteresis state machine with timing and
/// swing-consistency gates. Corrections from the Digital Crown are recorded
/// as labels for calibration / future model training.
public struct RepProfile: Sendable, Equatable, Codable {
    public enum Signal: String, Sendable, Codable { case orientation, vertical }
    public var id: String
    public var signal: Signal
    public var minRepSeconds: Double
    public var maxRepSeconds: Double
    public var minAmplitude: Double
    public var hysteresis: Double

    public static let curl = RepProfile(id: "curl", signal: .orientation, minRepSeconds: 0.9, maxRepSeconds: 7, minAmplitude: 0.25, hysteresis: 0.35)
    public static let lateralRaise = RepProfile(id: "lateralRaise", signal: .orientation, minRepSeconds: 0.9, maxRepSeconds: 7, minAmplitude: 0.2, hysteresis: 0.35)
    public static let verticalPush = RepProfile(id: "verticalPush", signal: .vertical, minRepSeconds: 0.9, maxRepSeconds: 7, minAmplitude: 0.2, hysteresis: 0.3)
    public static let pull = RepProfile(id: "horizontalPull", signal: .vertical, minRepSeconds: 0.9, maxRepSeconds: 7, minAmplitude: 0.2, hysteresis: 0.3)

    /// nil = auto counting not offered for this exercise (manual entry only).
    public static func forExercise(_ ex: ExerciseDefinition) -> RepProfile? {
        guard ex.watch != .unsupported else { return nil }
        switch ex.pattern {
        case "curl": return .curl
        case "lateralRaise", "rearDelt", "chestFly": return .lateralRaise
        case "verticalPush", "horizontalPush": return .verticalPush
        case "horizontalPull", "verticalPull": return .pull
        default: return RepProfile(id: "generic", signal: .vertical, minRepSeconds: 1, maxRepSeconds: 8, minAmplitude: 0.2, hysteresis: 0.35)
        }
    }
}

public struct MotionSample: Sendable {
    public var t: TimeInterval
    public var gravity: SIMD3<Double>
    public var userAcceleration: SIMD3<Double>
    public init(t: TimeInterval, gravity: SIMD3<Double>, userAcceleration: SIMD3<Double>) { self.t = t; self.gravity = gravity; self.userAcceleration = userAcceleration }
}

public struct RepCounter: Sendable {
    public let profile: RepProfile
    public let sampleRate: Double
    public private(set) var count = 0
    public private(set) var corrections = 0
    public private(set) var repTimestamps: [TimeInterval] = []
    public private(set) var lastSignal = 0.0

    private var lp: [Double?] = [nil, nil, nil]
    private var lpAlpha: Double
    private var vel = 0.0, velDrift: Double? = nil, driftAlpha: Double
    private var window: [(t: Double, v: SIMD3<Double>)] = []
    private var axis: Int? = nil
    private var seekingHigh = true
    private var highT = 0.0, peak = -Double.infinity
    private var lastRepT: Double? = nil
    private var typicalSwing: Double? = nil

    public init(profile: RepProfile, sampleRate: Double = 50) {
        self.profile = profile; self.sampleRate = sampleRate
        func alpha(_ fc: Double) -> Double { let rc = 1 / (2 * .pi * fc), dt = 1 / sampleRate; return dt / (rc + dt) }
        lpAlpha = alpha(profile.signal == .orientation ? 2.0 : 3.0)
        driftAlpha = alpha(0.1)
    }

    private mutating func lowPass(_ i: Int, _ x: Double) -> Double { let y = lp[i].map { $0 + lpAlpha * (x - $0) } ?? x; lp[i] = y; return y }

    /// Returns true when this sample completed a repetition.
    @discardableResult
    public mutating func push(_ s: MotionSample) -> Bool {
        let signal: Double
        let horizon = profile.signal == .orientation ? 3.0 : 4.0
        if profile.signal == .orientation {
            let g = SIMD3(lowPass(0, s.gravity.x), lowPass(1, s.gravity.y), lowPass(2, s.gravity.z))
            window.append((s.t, g))
            trim(s.t, horizon)
            guard Double(window.count) >= sampleRate * 0.6 else { return false }
            let vars = (0..<3).map { i in variance(window.map { $0.v[i] }) }
            let best = vars.indices.max { vars[$0] < vars[$1] }!
            if axis == nil || vars[best] > 1.8 * vars[axis!] { axis = best }
            signal = g[axis!]
        } else {
            let n = (s.gravity.x * s.gravity.x + s.gravity.y * s.gravity.y + s.gravity.z * s.gravity.z).squareRoot()
            let gu = n > 0 ? s.gravity / n : SIMD3(0, -1, 0)
            let vert = (s.userAcceleration * gu).sum()
            let f = lowPass(0, vert)
            vel = vel * 0.99 + f / sampleRate * 9.81
            let d = velDrift.map { $0 + driftAlpha * (vel - $0) } ?? vel; velDrift = d
            signal = vel - d
            window.append((s.t, SIMD3(signal, 0, 0)))
            trim(s.t, horizon)
            guard Double(window.count) >= sampleRate * 0.6 else { return false }
        }
        lastSignal = signal
        let vals = window.map { profile.signal == .orientation ? $0.v[axis!] : $0.v.x }
        let hi = vals.max()!, lo = vals.min()!
        let amp = (hi - lo) / 2, mid = (hi + lo) / 2
        guard amp >= profile.minAmplitude / 2 else { seekingHigh = true; return false }
        let upper = mid + profile.hysteresis * amp, lower = mid - profile.hysteresis * amp

        if seekingHigh, signal > upper { seekingHigh = false; highT = s.t; peak = signal; return false }
        guard !seekingHigh else { return false }
        peak = max(peak, signal)
        guard signal < lower else { return false }
        seekingHigh = true
        let sinceLast = lastRepT.map { s.t - $0 } ?? .infinity
        let swing = peak - signal
        let consistent = typicalSwing.map { swing >= 0.5 * $0 } ?? true
        guard sinceLast >= profile.minRepSeconds, s.t - highT <= profile.maxRepSeconds, consistent else { return false }
        typicalSwing = typicalSwing.map { 0.7 * $0 + 0.3 * swing } ?? swing
        count += 1; lastRepT = s.t; repTimestamps.append(s.t)
        return true
    }

    /// Manual correction (Digital Crown / buttons). Never goes below zero.
    public mutating func correct(by delta: Int) { count = max(0, count + delta); corrections += delta }

    private mutating func trim(_ t: Double, _ seconds: Double) {
        if let i = window.firstIndex(where: { $0.t >= t - seconds }), i > 0 { window.removeFirst(i) }
    }
    private func variance(_ a: [Double]) -> Double { let m = a.reduce(0, +) / Double(a.count); return a.reduce(0) { $0 + ($1 - m) * ($1 - m) } / Double(a.count) }
}

// MARK: - Synthetic traces (unit tests, previews, simulator demos)

public enum SyntheticMotion {
    public enum Kind: Sendable { case curl, lateralRaise, press }

    /// Deterministic noisy trace matching the JS generator's shape (not its exact RNG).
    public static func trace(_ kind: Kind, reps: Int, sampleRate: Double = 50, repSeconds: Double = 2.2, noise: Double = 0.03,
                             restBefore: Double = 1.5, restAfter: Double = 1.5, slowdown: Double = 0.06, seed: UInt64 = 1) -> [MotionSample] {
        var state = seed &* 6364136223846793005 &+ 1442695040888963407
        func rand() -> Double { state = state &* 6364136223846793005 &+ 1442695040888963407; return Double(state >> 11) / Double(1 << 53) }
        func gauss() -> Double { (-2 * log(rand() + 1e-12)).squareRoot() * cos(2 * .pi * rand()) }
        var out: [MotionSample] = []; var t = 0.0; let dt = 1 / sampleRate
        func still(_ d: Double) { for _ in 0..<Int(d * sampleRate) { out.append(.init(t: t, gravity: SIMD3(noise * gauss(), -1 + noise * gauss() * 0.3, noise * gauss()), userAcceleration: SIMD3(noise * gauss(), noise * gauss(), noise * gauss()))); t += dt } }
        still(restBefore)
        for r in 0..<reps {
            let d = repSeconds * (1 + slowdown * Double(r)) * (1 + 0.15 * (rand() - 0.5))
            let n = Int((d * sampleRate).rounded())
            for k in 0..<n {
                let ph = Double(k) / Double(n)
                switch kind {
                case .curl, .lateralRaise:
                    let a = (kind == .curl ? 2.1 : 1.5) * (0.5 - 0.5 * cos(2 * .pi * ph))
                    out.append(.init(t: t, gravity: SIMD3(sin(a) + noise * gauss(), -cos(a) + noise * gauss(), noise * gauss()), userAcceleration: SIMD3(0.15 * sin(2 * .pi * ph) + noise * gauss(), noise * gauss(), noise * gauss())))
                case .press:
                    let w = 2 * .pi / d, acc = (0.45 / 2) * w * w * cos(2 * .pi * ph) / 9.81
                    out.append(.init(t: t, gravity: SIMD3(noise * gauss() * 0.3, -1 + noise * gauss() * 0.1, noise * gauss() * 0.3), userAcceleration: SIMD3(noise * gauss(), -acc + noise * gauss(), noise * gauss())))
                }
                t += dt
            }
        }
        still(restAfter)
        return out
    }
}
