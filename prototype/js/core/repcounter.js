// Wrist-motion repetition counter (reference implementation).
//
// Mirrors ios/GymCore/Sources/GymCore/RepCounter.swift. Input is Core-Motion-
// style device motion: gravity (unit-ish vector, device frame) and
// userAcceleration (g, gravity removed), sampled at ~50 Hz.
//
// Two signal strategies, chosen per exercise:
//  • 'orientation' — the forearm rotates (curls, lateral raises). The gravity
//    vector in the watch's frame swings through a large angle each rep; we
//    track its component on the axis with the most variance. Very clean.
//  • 'vertical' — the wrist translates up/down without much rotation
//    (presses, rows, pulldowns). Project userAcceleration onto gravity, then
//    leaky-integrate to a velocity-like signal so each rep is one cycle.
//
// Reps are counted with an adaptive-hysteresis peak/valley state machine plus
// timing constraints. Analogy: a turnstile that only clicks when the arm
// swings all the way over the top bar AND all the way back below the bottom
// bar — small wobbles in between never click it.

export const REP_PROFILES = {
  curl:           { signal: 'orientation', minRepSec: 0.9, maxRepSec: 7, minAmplitude: 0.25, hysteresis: 0.35 },
  lateralRaise:   { signal: 'orientation', minRepSec: 0.9, maxRepSec: 7, minAmplitude: 0.2,  hysteresis: 0.35 },
  verticalPush:   { signal: 'vertical',    minRepSec: 0.9, maxRepSec: 7, minAmplitude: 0.2,  hysteresis: 0.3 },
  horizontalPull: { signal: 'vertical',    minRepSec: 0.9, maxRepSec: 7, minAmplitude: 0.2,  hysteresis: 0.3 },
  generic:        { signal: 'vertical',    minRepSec: 1.0, maxRepSec: 8, minAmplitude: 0.2,  hysteresis: 0.35 },
};

/** Map an exercise (from exercises.js) to a rep-counting profile, or null if unsupported. */
export function profileForExercise(ex) {
  if (!ex || ex.watch === 'unsupported') return null;
  if (ex.pattern === 'curl') return { id: 'curl', ...REP_PROFILES.curl };
  if (ex.pattern === 'lateralRaise' || ex.pattern === 'rearDelt' || ex.pattern === 'chestFly') return { id: 'lateralRaise', ...REP_PROFILES.lateralRaise };
  if (ex.pattern === 'verticalPush' || ex.pattern === 'horizontalPush') return { id: 'verticalPush', ...REP_PROFILES.verticalPush };
  if (ex.pattern === 'horizontalPull' || ex.pattern === 'verticalPull') return { id: 'horizontalPull', ...REP_PROFILES.horizontalPull };
  return { id: 'generic', ...REP_PROFILES.generic };
}

class LowPass {
  constructor(cutoffHz, sampleHz) { this.set(cutoffHz, sampleHz); this.y = null; }
  set(fc, fs) { const rc = 1 / (2 * Math.PI * fc); const dt = 1 / fs; this.a = dt / (rc + dt); }
  push(x) { this.y = this.y == null ? x : this.y + this.a * (x - this.y); return this.y; }
}

export class RepCounter {
  constructor(profile = REP_PROFILES.generic, { sampleHz = 50 } = {}) {
    this.p = { ...REP_PROFILES.generic, ...profile };
    this.fs = sampleHz;
    this.reset();
  }

  reset() {
    this.count = 0;
    this.lp = [0, 1, 2].map(() => new LowPass(this.p.signal === 'orientation' ? 2.0 : 3.0, this.fs));
    this.vel = 0; this.velHp = new LowPass(0.1, this.fs);
    this.win = [];            // trailing window of {t, v[3]} or {t, s}
    this.axis = null;
    this.state = 'seekHigh';  // seekHigh → seekLow → (count) → seekHigh
    this.lastRepT = null; this.highT = null; this.cycleStartT = null;
    this.events = [];
    this.lastSignal = 0; this.lastBand = null;
    this.peak = -Infinity; this.typicalSwing = null; // rep-consistency gate
    this.repPeriod = null;                             // adaptive window (slow tempos)
  }

  /** Feed one sample: {t (s), gravity:[x,y,z], userAccel:[x,y,z]}. Returns true when a rep was counted. */
  push(sample) {
    const t = sample.t;
    let s;
    if (this.p.signal === 'orientation') {
      const g = sample.gravity.map((v, i) => this.lp[i].push(v));
      this.win.push({ t, v: g });
      this.trim(t, this.horizon(3.0));
      if (this.win.length < this.fs * 0.6) return false;
      // Dominant axis = highest variance over the window (re-evaluated, sticky).
      const vars = [0, 1, 2].map((i) => variance(this.win.map((w) => w.v[i])));
      const best = vars.indexOf(Math.max(...vars));
      if (this.axis == null || vars[best] > 1.8 * vars[this.axis]) this.axis = best;
      s = g[this.axis];
    } else {
      const g = sample.gravity; const n = Math.hypot(...g) || 1;
      const vert = sample.userAccel.reduce((a, v, i) => a + v * (g[i] / n), 0);
      const f = this.lp[0].push(vert);
      // Leaky integration → velocity-like signal; subtract slow drift.
      this.vel = this.vel * 0.99 + f / this.fs * 9.81;
      s = this.vel - this.velHp.push(this.vel);
      this.win.push({ t, v: [s, 0, 0] });
      this.trim(t, this.horizon(4.0));
      if (this.win.length < this.fs * 0.6) return false;
    }
    this.lastSignal = s;

    const vals = this.win.map((w) => (this.p.signal === 'orientation' ? w.v[this.axis] : w.v[0]));
    const hi = Math.max(...vals), lo = Math.min(...vals);
    const amp = (hi - lo) / 2, mid = (hi + lo) / 2;
    if (amp < this.p.minAmplitude / 2) { this.state = 'seekHigh'; this.lastBand = null; return false; }
    const upper = mid + this.p.hysteresis * amp, lower = mid - this.p.hysteresis * amp;
    this.lastBand = { upper, lower };

    if (this.state === 'seekHigh' && s > upper) {
      this.state = 'seekLow'; this.highT = t; this.peak = s;
      if (this.cycleStartT == null) this.cycleStartT = t;
    } else if (this.state === 'seekLow') {
      if (s > this.peak) this.peak = s;
      if (s < lower) {
        this.state = 'seekHigh';
        const sinceLast = this.lastRepT == null ? Infinity : t - this.lastRepT;
        const halfCycle = t - this.highT;
        const swing = this.peak - s;
        // Reject swings far smaller than this set's typical rep (end-of-set settling, fidgeting).
        const consistent = this.typicalSwing == null || swing >= 0.5 * this.typicalSwing;
        if (sinceLast >= this.p.minRepSec && halfCycle <= this.p.maxRepSec && consistent) {
          this.typicalSwing = this.typicalSwing == null ? swing : 0.7 * this.typicalSwing + 0.3 * swing;
          if (this.lastRepT != null) { const p = t - this.lastRepT; this.repPeriod = this.repPeriod == null ? p : 0.6 * this.repPeriod + 0.4 * p; }
          this.count++; this.lastRepT = t; this.events.push(t);
          return true;
        }
      }
    }
    return false;
  }

  /** Window ≥ 1.6 rep periods so slow reps are seen whole (clamped 3–8 s). */
  horizon(base) { return this.repPeriod == null ? base : Math.min(8, Math.max(base, 1.6 * this.repPeriod)); }

  trim(t, seconds) { while (this.win.length && this.win[0].t < t - seconds) this.win.shift(); }

  /** Manual correction from the UI (Digital Crown / buttons). Kept as a label for future model training. */
  correct(delta) { this.count = Math.max(0, this.count + delta); this.corrections = (this.corrections || 0) + delta; return this.count; }
}

function variance(a) {
  const m = a.reduce((x, y) => x + y, 0) / a.length;
  return a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length;
}

// ── Synthetic sensor data (tests + "Simulated" watch demo) ─────────────────

export function synthesize({ kind = 'curl', reps = 10, sampleHz = 50, repSec = 2.2, noise = 0.03, restBefore = 1.5, restAfter = 1.5, slowdown = 0.06, seed = 1, jitter = 0.15 } = {}) {
  let a = seed >>> 0;
  const rand = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-12)) * Math.cos(2 * Math.PI * rand());
  const samples = [];
  let t = 0; const dt = 1 / sampleHz;
  const still = (dur) => {
    for (let k = 0; k < dur * sampleHz; k++, t += dt) {
      samples.push({ t, gravity: [0 + noise * gauss(), -1 + noise * gauss() * 0.3, 0 + noise * gauss()], userAccel: [noise * gauss(), noise * gauss(), noise * gauss()] });
    }
  };
  still(restBefore);
  for (let r = 0; r < reps; r++) {
    const d = repSec * (1 + slowdown * r) * (1 + jitter * (rand() - 0.5));
    const n = Math.round(d * sampleHz);
    for (let k = 0; k < n; k++, t += dt) {
      const ph = k / n; // 0..1
      if (kind === 'curl' || kind === 'lateralRaise') {
        const ang = (kind === 'curl' ? 2.1 : 1.5) * (0.5 - 0.5 * Math.cos(2 * Math.PI * ph)); // 0 → max → 0 rad
        samples.push({ t, gravity: [Math.sin(ang) + noise * gauss(), -Math.cos(ang) + noise * gauss(), noise * gauss()],
          userAccel: [0.15 * Math.sin(2 * Math.PI * ph) + noise * gauss(), noise * gauss(), noise * gauss()] });
      } else {
        // Vertical displacement y = A(1-cos)/2 → accel = A·(2π/d)²/2 · cos(2πph)
        const A = 0.45; const w = 2 * Math.PI / d;
        const acc = (A / 2) * w * w * Math.cos(2 * Math.PI * ph) / 9.81;
        samples.push({ t, gravity: [noise * gauss() * 0.3, -1 + noise * gauss() * 0.1, noise * gauss() * 0.3],
          userAccel: [noise * gauss(), -acc + noise * gauss(), noise * gauss()] });
      }
    }
  }
  still(restAfter);
  return samples;
}

export function countSamples(samples, profile) {
  const rc = new RepCounter(profile);
  for (const s of samples) rc.push(s);
  return rc.count;
}
