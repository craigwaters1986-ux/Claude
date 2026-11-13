import Foundation

/// Estimated muscle recovery — a transparent, configurable heuristic.
/// NOT a physiological measurement. Mirrors prototype/js/core/recovery.js;
/// see docs/03-recovery-model.md for the derivation and its limits.
///
///   F_m(t) = Σ fatiguePerSet · Σ(role · effort · setType) · e^(−Δt/τ_m)
///   recovery% = 100 · (1 − min(1, F_m))
public struct RecoveryConfig: Sendable, Codable {
    public var fatiguePerSet = 0.085
    public var secondaryRole = 0.45
    public var setTypeFactor: [SetKind: Double] = [.warmup: 0, .working: 1, .drop: 0.5, .failure: 1.15]
    public var effortByRIR: [Double] = [1.0, 1.0, 0.9, 0.8, 0.65, 0.45]
    public var effortUnknown = 0.85
    public var horizonHours = 240.0
    public var readyThreshold = 90.0
    public var lightThreshold = 70.0
    public var cautionThreshold = 40.0
    public var maxHealthFactor = 1.3
    public var personalMin = 0.7, personalMax = 1.5, learningRate = 0.005
    public init() {}
}

public enum RecoveryStatus: String, Codable, Sendable {
    case ready, light, caution, fatigued
    public var recommendation: String {
        switch self {
        case .ready: "Ready for hard training."
        case .light: "Light training or additional recovery."
        case .caution: "Prefer other muscle groups today."
        case .fatigued: "Rest this muscle — train something else."
        }
    }
}

/// Optional Apple Health signals. All fields optional — absent data simply isn't used.
public struct HealthSignals: Sendable, Codable, Equatable {
    public var sleepHours: Double?
    public var hrvZScore: Double?        // today's HRV vs personal baseline, in SDs
    public var restingHRDelta: Double?   // bpm above personal baseline
    public init(sleepHours: Double? = nil, hrvZScore: Double? = nil, restingHRDelta: Double? = nil) {
        self.sleepHours = sleepHours; self.hrvZScore = hrvZScore; self.restingHRDelta = restingHRDelta
    }
}

public struct MuscleRecovery: Sendable, Identifiable, Equatable {
    public var id: Muscle { muscle }
    public let muscle: Muscle
    public let percent: Int
    public let status: RecoveryStatus
    public let hoursToReady: Int
    public let hoursToFull: Int
    public let lastTrained: Date?
    public let weeklySets: Double
    public let tauHours: Double
}

public struct RecoverySnapshot: Sendable {
    public let muscles: [MuscleRecovery]
    public let overall: Int
    public let healthFactor: Double
    public let healthReasons: [String]
    public subscript(m: Muscle) -> MuscleRecovery { muscles.first { $0.muscle == m }! }
}

public struct RecoveryEngine: Sendable {
    public var config: RecoveryConfig
    public var catalog: ExerciseCatalog
    public init(config: RecoveryConfig = .init(), catalog: ExerciseCatalog = .init()) { self.config = config; self.catalog = catalog }

    public func effort(_ set: LoggedSet) -> Double {
        guard let rir = set.effectiveRIR else { return config.effortUnknown }
        let i = min(config.effortByRIR.count - 1, Int(rir.rounded()))
        return config.effortByRIR[max(0, i)]
    }

    /// Effective hard sets each muscle received in one workout.
    public func stimulus(of workout: WorkoutRecord) -> [Muscle: Double] {
        var out: [Muscle: Double] = [:]
        for item in workout.exercises {
            guard let ex = catalog[item.exerciseID] else { continue }
            for set in item.sets where set.isDone {
                let s = (config.setTypeFactor[set.kind] ?? 1) * effort(set)
                guard s > 0 else { continue }
                for m in ex.primary { out[m, default: 0] += s }
                for m in ex.secondary { out[m, default: 0] += s * config.secondaryRole }
            }
        }
        return out
    }

    public func healthModifier(_ h: HealthSignals?) -> (factor: Double, reasons: [String]) {
        guard let h else { return (1, []) }
        var f = 1.0; var reasons: [String] = []
        if let s = h.sleepHours {
            if s < 5 { f *= 1.2; reasons.append(String(format: "Short sleep (%.1f h)", s)) }
            else if s < 6 { f *= 1.12; reasons.append(String(format: "Below-average sleep (%.1f h)", s)) }
        }
        if let z = h.hrvZScore, z < -1 { f *= 1.1; reasons.append("HRV below your baseline") }
        if let d = h.restingHRDelta, d > 5 { f *= 1.05; reasons.append("Resting HR above your baseline") }
        return (min(f, config.maxHealthFactor), reasons)
    }

    public static func hoursUntil(fatigue F: Double, tau: Double, targetPercent: Double) -> Double {
        let target = 1 - targetPercent / 100
        return F <= target ? 0 : tau * log(F / target)
    }

    public func status(for pct: Double) -> RecoveryStatus {
        pct >= config.readyThreshold ? .ready : pct >= config.lightThreshold ? .light : pct >= config.cautionThreshold ? .caution : .fatigued
    }

    public func snapshot(workouts: [WorkoutRecord], at now: Date = .now, health: HealthSignals? = nil, personal: [Muscle: Double] = [:]) -> RecoverySnapshot {
        let hm = healthModifier(health)
        var fatigue: [Muscle: Double] = [:], last: [Muscle: Date] = [:], weekly: [Muscle: Double] = [:]
        for w in workouts {
            let t = w.endedAt ?? w.startedAt
            guard t <= now else { continue }
            let ageH = now.timeIntervalSince(t) / 3600
            for (m, s) in stimulus(of: w) where s > 0 {
                let tau = m.tauHours * hm.factor * (personal[m] ?? 1)
                if ageH <= config.horizonHours { fatigue[m, default: 0] += config.fatiguePerSet * s * exp(-ageH / tau) }
                if last[m].map({ t > $0 }) ?? true { last[m] = t }
            }
            if ageH <= 24 * 7 {
                for item in w.exercises {
                    guard let ex = catalog[item.exerciseID] else { continue }
                    let n = Double(item.workingSets.count)
                    for m in ex.primary { weekly[m, default: 0] += n }
                    for m in ex.secondary { weekly[m, default: 0] += n * 0.5 }
                }
            }
        }
        let muscles = Muscle.allCases.map { m -> MuscleRecovery in
            let tau = m.tauHours * hm.factor * (personal[m] ?? 1)
            let F = min(fatigue[m] ?? 0, 1.5)
            let pct = (100 * (1 - min(1, F))).rounded()
            return MuscleRecovery(muscle: m, percent: Int(pct), status: status(for: pct),
                                  hoursToReady: Int(Self.hoursUntil(fatigue: F, tau: tau, targetPercent: config.readyThreshold).rounded(.up)),
                                  hoursToFull: Int(Self.hoursUntil(fatigue: F, tau: tau, targetPercent: 95).rounded(.up)),
                                  lastTrained: last[m], weeklySets: ((weekly[m] ?? 0) * 2).rounded() / 2, tauHours: tau)
        }
        let total = Muscle.allCases.reduce(0) { $0 + $1.size }
        let overall = muscles.reduce(0.0) { $0 + Double($1.percent) * $1.muscle.size } / total
        return RecoverySnapshot(muscles: muscles, overall: Int(overall.rounded()), healthFactor: hm.factor, healthReasons: hm.reasons)
    }

    public enum Feel: String, Codable, Sendable, CaseIterable {
        case fresh, ok, sore, verySore
        public var reportedPercent: Double { switch self { case .fresh: 95; case .ok: 78; case .sore: 50; case .verySore: 25 } }
    }

    /// Nudge one muscle's personal recovery-speed multiplier toward the user's reported feel.
    public func adapt(_ personal: [Muscle: Double], muscle: Muscle, predicted: Int, feel: Feel) -> [Muscle: Double] {
        var p = personal
        let err = feel.reportedPercent - Double(predicted)
        let next = (p[muscle] ?? 1) * exp(-config.learningRate * err)
        p[muscle] = min(config.personalMax, max(config.personalMin, (next * 1000).rounded() / 1000))
        return p
    }
}
