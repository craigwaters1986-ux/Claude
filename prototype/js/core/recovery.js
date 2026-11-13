// Estimated muscle recovery model.
//
// ⚠ This is a transparent, configurable HEURISTIC — not a physiological
// measurement and not scientifically validated. See docs/03-recovery-model.md.
//
// Model in one sentence: every hard set adds "fatigue" to the muscles it
// trains (primary fully, secondary partially, scaled by effort), and that
// fatigue decays exponentially with a per-muscle time constant that can be
// nudged by sleep/HRV/resting-HR signals and by the user's own feedback.
//
//   F_m(t) = Σ_sessions  fatiguePerSet · Σ_sets(role · effort · type)  · e^(−Δt / τ_m)
//   recovery% = 100 · (1 − min(1, F_m))
//
// Analogy: each workout pours water into a muscle's bucket; the bucket has a
// leak whose speed depends on the muscle (calves leak fast, hamstrings slow)
// and on how well you slept. Recovery % is how empty the bucket is.

import { MUSCLES, MUSCLE_BY_ID } from './muscles.js';
import { EXERCISE_BY_ID } from './exercises.js';

export const DEFAULT_RECOVERY_CONFIG = {
  fatiguePerSet: 0.085,          // ~12 hard sets ≈ fully fatigued immediately after
  secondaryRole: 0.45,           // secondary muscles get ~half the stimulus
  setType: { warmup: 0.0, working: 1.0, drop: 0.5, failure: 1.15 },
  effortByRir: [1.0, 1.0, 0.9, 0.8, 0.65, 0.45], // index = RIR (≥5 uses last)
  effortUnknown: 0.85,           // when neither RPE nor RIR were logged
  horizonHours: 24 * 10,         // ignore sessions older than this
  thresholds: { ready: 90, light: 70, caution: 40 },
  health: {
    sleepShort: { belowHours: 6, factor: 1.12 },
    sleepVeryShort: { belowHours: 5, factor: 1.2 },
    hrvLow: { zBelow: -1, factor: 1.1 },
    rhrHigh: { bpmAbove: 5, factor: 1.05 },
    maxCombined: 1.3,
  },
  personal: { min: 0.7, max: 1.5, learningRate: 0.005 },
};

const HOUR = 3600 * 1000;

export function rirOf(set) {
  if (Number.isFinite(set.rir)) return Math.max(0, set.rir);
  if (Number.isFinite(set.rpe)) return Math.max(0, 10 - set.rpe);
  return null;
}

export function effortFactor(set, cfg = DEFAULT_RECOVERY_CONFIG) {
  const rir = rirOf(set);
  if (rir == null) return cfg.effortUnknown;
  const t = cfg.effortByRir;
  return t[Math.min(t.length - 1, Math.round(rir))];
}

/** Stimulus (in "effective hard sets") one session puts on each muscle. */
export function sessionStimulus(workout, cfg = DEFAULT_RECOVERY_CONFIG, exerciseLookup = EXERCISE_BY_ID) {
  const out = {};
  for (const item of workout.exercises || []) {
    const ex = exerciseLookup[item.exerciseId];
    if (!ex) continue;
    for (const set of item.sets || []) {
      if (set.done === false) continue;
      const typeF = cfg.setType[set.type || 'working'] ?? 1;
      if (!typeF) continue;
      const s = typeF * effortFactor(set, cfg);
      for (const m of ex.primary) out[m] = (out[m] || 0) + s;
      for (const m of ex.secondary) out[m] = (out[m] || 0) + s * cfg.secondaryRole;
    }
  }
  return out;
}

/** Multiplier (≥1 slows recovery) derived from optional Apple Health signals. */
export function healthModifier(health, cfg = DEFAULT_RECOVERY_CONFIG) {
  if (!health) return { factor: 1, reasons: [] };
  const h = cfg.health;
  let f = 1; const reasons = [];
  if (Number.isFinite(health.sleepHours)) {
    if (health.sleepHours < h.sleepVeryShort.belowHours) { f *= h.sleepVeryShort.factor; reasons.push(`Short sleep (${health.sleepHours.toFixed(1)} h)`); }
    else if (health.sleepHours < h.sleepShort.belowHours) { f *= h.sleepShort.factor; reasons.push(`Below-average sleep (${health.sleepHours.toFixed(1)} h)`); }
  }
  if (Number.isFinite(health.hrvZ) && health.hrvZ < h.hrvLow.zBelow) { f *= h.hrvLow.factor; reasons.push('HRV below your baseline'); }
  if (Number.isFinite(health.rhrDelta) && health.rhrDelta > h.rhrHigh.bpmAbove) { f *= h.rhrHigh.factor; reasons.push('Resting HR above your baseline'); }
  return { factor: Math.min(f, h.maxCombined), reasons };
}

export function statusFor(pct, cfg = DEFAULT_RECOVERY_CONFIG) {
  const t = cfg.thresholds;
  if (pct >= t.ready) return 'ready';
  if (pct >= t.light) return 'light';
  if (pct >= t.caution) return 'caution';
  return 'fatigued';
}

export const STATUS_META = {
  ready:    { label: 'Ready',        color: 'var(--rec-green)', hex: '#30e8a0', action: 'Ready for hard training.' },
  light:    { label: 'Nearly ready', color: 'var(--rec-blue)',  hex: '#3aa8ff', action: 'Light training or additional recovery.' },
  caution:  { label: 'Recovering',   color: 'var(--rec-yellow)', hex: '#ffd23f', action: 'Prefer other muscle groups today.' },
  fatigued: { label: 'Fatigued',     color: 'var(--rec-red)',   hex: '#ff4d6d', action: 'Rest this muscle — train something else.' },
};

/** Hours until fatigue F decays to the level that corresponds to `targetPct`. */
export function hoursUntil(F, tau, targetPct) {
  const target = 1 - targetPct / 100;
  if (F <= target) return 0;
  return tau * Math.log(F / target);
}

/**
 * Compute estimated recovery for every muscle.
 * @param workouts  completed workouts ({startedAt|endedAt, exercises[]})
 * @param now       ms timestamp
 * @param opts      { health, personal: {muscleId: tauMultiplier}, config, exerciseLookup }
 */
export function computeRecovery(workouts, now = Date.now(), opts = {}) {
  const cfg = opts.config || DEFAULT_RECOVERY_CONFIG;
  const lookup = opts.exerciseLookup || EXERCISE_BY_ID;
  const hm = healthModifier(opts.health, cfg);
  const personal = opts.personal || {};

  const state = Object.fromEntries(MUSCLES.map((m) => [m.id, {
    F: 0, lastTrained: null, weeklySets: 0, sessions28: 0, rpeLogged: 0, setsLogged: 0,
  }]));

  for (const w of workouts) {
    const t = w.endedAt || w.startedAt;
    if (!t || t > now) continue;
    const ageH = (now - t) / HOUR;
    const stim = sessionStimulus(w, cfg, lookup);
    for (const [m, s] of Object.entries(stim)) {
      const st = state[m]; if (!st || s <= 0) continue;
      const tau = MUSCLE_BY_ID[m].tauHours * hm.factor * (personal[m] || 1);
      if (ageH <= cfg.horizonHours) st.F += cfg.fatiguePerSet * s * Math.exp(-ageH / tau);
      if (!st.lastTrained || t > st.lastTrained) st.lastTrained = t;
      if (ageH <= 24 * 28) st.sessions28 += 1;
    }
    if (ageH <= 24 * 7) {
      for (const item of w.exercises || []) {
        const ex = lookup[item.exerciseId]; if (!ex) continue;
        const n = (item.sets || []).filter((x) => x.done !== false && x.type !== 'warmup').length;
        const logged = (item.sets || []).filter((x) => rirOf(x) != null).length;
        for (const m of ex.primary) { state[m].weeklySets += n; state[m].rpeLogged += logged; state[m].setsLogged += n; }
        for (const m of ex.secondary) state[m].weeklySets += n * 0.5;
      }
    }
  }

  const muscles = MUSCLES.map((m) => {
    const st = state[m.id];
    const tau = m.tauHours * hm.factor * (personal[m.id] || 1);
    const F = Math.min(st.F, 1.5);
    const pct = Math.round(100 * (1 - Math.min(1, F)));
    const status = statusFor(pct, cfg);
    const confidence = st.sessions28 === 0 ? 'n/a'
      : (st.setsLogged && st.rpeLogged / st.setsLogged > 0.6 && st.sessions28 >= 3) ? 'medium' : 'low';
    return {
      id: m.id, name: m.name, pct, status,
      hoursToReady: Math.ceil(hoursUntil(F, tau, cfg.thresholds.ready)),
      hoursToFull: Math.ceil(hoursUntil(F, tau, 95)),
      lastTrained: st.lastTrained,
      weeklySets: Math.round(st.weeklySets * 2) / 2,
      sessions28: st.sessions28,
      tauHours: Math.round(tau),
      recommendation: STATUS_META[status].action,
      confidence,
    };
  });

  const totalSize = MUSCLES.reduce((a, m) => a + m.size, 0);
  const overall = Math.round(MUSCLES.reduce((a, m, i) => a + muscles[i].pct * m.size, 0) / totalSize);
  return { muscles, byId: Object.fromEntries(muscles.map((x) => [x.id, x])), overall, health: hm };
}

/**
 * Personal adaptation: the user reports how a muscle feels; nudge that
 * muscle's recovery-speed multiplier toward what they experience.
 * feel: 'fresh' | 'ok' | 'sore' | 'verySore'
 */
export const FEEL_PCT = { fresh: 95, ok: 78, sore: 50, verySore: 25 };

export function adaptFromFeedback(personal, muscleId, predictedPct, feel, cfg = DEFAULT_RECOVERY_CONFIG) {
  const reported = FEEL_PCT[feel];
  if (reported == null) return personal;
  const err = reported - predictedPct;              // negative → user is more fatigued than predicted
  const current = personal[muscleId] || 1;
  const next = current * Math.exp(-cfg.personal.learningRate * err);
  return { ...personal, [muscleId]: Math.min(cfg.personal.max, Math.max(cfg.personal.min, +next.toFixed(3))) };
}

/** Daily overall-recovery series for trend charts. */
export function recoveryTrend(workouts, days = 14, now = Date.now(), opts = {}) {
  const out = [];
  for (let d = days - 1; d >= 0; d--) {
    const t = now - d * 24 * HOUR;
    out.push({ t, overall: computeRecovery(workouts, t, opts).overall });
  }
  return out;
}
