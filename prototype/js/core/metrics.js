// Strength metrics: estimated 1RM, PR detection, volume, streaks and
// progressive-overload suggestions. All weights are stored in kilograms.

import { EXERCISE_BY_ID } from './exercises.js';
import { rirOf } from './recovery.js';

const DAY = 86400000;

/**
 * Estimated one-rep max (Epley), using reps-to-failure = reps + RIR when RIR
 * is known. Returns null for sets where an estimate would be unreliable
 * (>12 effective reps, zero load).
 */
export function e1rm(weightKg, reps, rir = 0) {
  if (!(weightKg > 0) || !(reps > 0)) return null;
  const r = reps + (rir || 0);
  if (r > 12) return null;
  if (r === 1) return weightKg;
  return weightKg * (1 + r / 30);
}

export const workingSets = (item) => (item.sets || []).filter((s) => s.done !== false && s.type !== 'warmup');

export function setVolume(s) { return (s.weightKg || 0) * (s.reps || 0); }

export function workoutVolume(w) {
  return (w.exercises || []).reduce((a, it) => a + workingSets(it).reduce((b, s) => b + setVolume(s), 0), 0);
}

export function workoutSetCount(w) {
  return (w.exercises || []).reduce((a, it) => a + workingSets(it).length, 0);
}

/** All logged sets for an exercise, newest workout first. */
export function exerciseHistory(workouts, exerciseId) {
  const out = [];
  for (const w of [...workouts].sort((a, b) => b.startedAt - a.startedAt)) {
    const items = (w.exercises || []).filter((i) => i.exerciseId === exerciseId);
    if (!items.length) continue;
    const sets = items.flatMap(workingSets);
    if (!sets.length) continue;
    const best = sets.reduce((b, s) => {
      const v = e1rm(s.weightKg, s.reps, rirOf(s) ?? 0) || 0;
      return v > b.v ? { v, s } : b;
    }, { v: 0, s: null });
    out.push({ workoutId: w.id, date: w.startedAt, sets, bestE1rm: best.v || null, bestSet: best.s,
      topWeight: Math.max(...sets.map((s) => s.weightKg || 0)), volume: sets.reduce((a, s) => a + setVolume(s), 0) });
  }
  return out;
}

/** Records established across a list of workouts (optionally before a timestamp). */
export function recordsFor(workouts, exerciseId, before = Infinity) {
  const rec = { maxWeight: 0, bestE1rm: 0, bestSetVolume: 0, repsAtWeight: {} };
  for (const w of workouts) {
    if (w.startedAt >= before) continue;
    for (const it of w.exercises || []) {
      if (it.exerciseId !== exerciseId) continue;
      for (const s of workingSets(it)) {
        rec.maxWeight = Math.max(rec.maxWeight, s.weightKg || 0);
        rec.bestE1rm = Math.max(rec.bestE1rm, e1rm(s.weightKg, s.reps, rirOf(s) ?? 0) || 0);
        rec.bestSetVolume = Math.max(rec.bestSetVolume, setVolume(s));
        const k = String(s.weightKg);
        rec.repsAtWeight[k] = Math.max(rec.repsAtWeight[k] || 0, s.reps || 0);
      }
    }
  }
  return rec;
}

/**
 * Detect PRs in `workout` against everything before it.
 * Returns [{exerciseId, kind, value, previous, setUid}] — at most one entry
 * per (exercise, kind), keeping the best.
 */
export function detectPRs(workout, history) {
  const prs = new Map();
  for (const it of workout.exercises || []) {
    const prev = recordsFor(history.filter((w) => w.id !== workout.id), it.exerciseId, workout.startedAt);
    const hasHistory = prev.maxWeight > 0;
    if (!hasHistory) continue; // first time ever: baseline, not a PR
    for (const s of workingSets(it)) {
      const cand = [
        ['weight', s.weightKg, prev.maxWeight],
        ['e1rm', e1rm(s.weightKg, s.reps, rirOf(s) ?? 0), prev.bestE1rm],
        ['volume', setVolume(s), prev.bestSetVolume],
      ];
      for (const [kind, value, previous] of cand) {
        if (!value || value <= previous + 1e-9) continue;
        const key = `${it.exerciseId}:${kind}`;
        if (!prs.has(key) || prs.get(key).value < value) prs.set(key, { exerciseId: it.exerciseId, kind, value, previous, setUid: s.uid });
      }
    }
  }
  return [...prs.values()];
}

/** Is this single set a PR vs history (used for live badges while logging)? */
export function isLivePR(set, exerciseId, history, before = Infinity) {
  const prev = recordsFor(history, exerciseId, before);
  if (!prev.maxWeight) return null;
  if ((set.weightKg || 0) > prev.maxWeight) return 'weight';
  const v = e1rm(set.weightKg, set.reps, rirOf(set) ?? 0) || 0;
  if (v > prev.bestE1rm + 1e-9) return 'e1rm';
  return null;
}

export function roundToIncrement(kg, inc = 2.5) {
  if (!inc) return Math.round(kg * 2) / 2;
  return Math.round(kg / inc) * inc;
}

/**
 * Progressive-overload suggestion (double progression with safeguards).
 * repRange: [low, high]. Returns {action, weightKg, reps, reason}.
 */
export function suggestNext(workouts, exerciseId, { repRange = [6, 10], maxJumpPct = 0.1 } = {}) {
  const ex = EXERCISE_BY_ID[exerciseId];
  const hist = exerciseHistory(workouts, exerciseId);
  if (!hist.length) {
    return { action: 'baseline', weightKg: null, reps: repRange[1],
      reason: 'No history yet — choose a weight you could lift for 2–3 more reps than the target, and the app will calibrate from there.' };
  }
  const last = hist[0];
  const top = last.topWeight;
  const topSets = last.sets.filter((s) => s.weightKg === top);
  const inc = ex?.incrementKg ?? 2.5;
  const allHitTop = topSets.every((s) => s.reps >= repRange[1]);
  const rirs = topSets.map(rirOf).filter((x) => x != null);
  const easy = rirs.length ? Math.min(...rirs) >= 2 : true;
  const missedLow = topSets.some((s) => s.reps < repRange[0]);
  const missedBefore = hist[1] && hist[1].topWeight === top && hist[1].sets.filter((s) => s.weightKg === top).some((s) => s.reps < repRange[0]);

  if (ex?.bodyweight && !top) {
    return { action: 'reps', weightKg: 0, reps: Math.max(...last.sets.map((s) => s.reps)) + 1,
      reason: 'Bodyweight movement: aim for one more rep per set before adding load.' };
  }
  if (missedLow && missedBefore) {
    const w = roundToIncrement(top * 0.9, inc);
    return { action: 'deload', weightKg: w, reps: repRange[1],
      reason: `You fell short of ${repRange[0]} reps at ${fmtKg(top)} in two sessions running. Drop ~10% to ${fmtKg(w)} and build back up.` };
  }
  if (allHitTop && easy) {
    const w = roundToIncrement(top + inc, inc);
    if (w > top * (1 + maxJumpPct) + 1e-9) return { action: 'reps', weightKg: top, reps: repRange[1] + 1, reason: `The next plate jump would be more than ${Math.round(maxJumpPct * 100)}% — add a rep at ${fmtKg(top)} instead.` };
    return { action: 'increase', weightKg: w, reps: repRange[0],
      reason: `You hit ${repRange[1]} reps on every top set at ${fmtKg(top)}${rirs.length ? ' with reps to spare' : ''}. Add ${fmtKg(w - top)}.` };
  }
  const bestReps = Math.max(...topSets.map((s) => s.reps));
  return { action: 'reps', weightKg: top, reps: Math.min(repRange[1], bestReps + 1),
    reason: `Stay at ${fmtKg(top)} and aim for ${Math.min(repRange[1], bestReps + 1)} reps — add weight once every set reaches ${repRange[1]}.` };
}

function fmtKg(kg) { return `${+kg.toFixed(2)} kg`; }

/** Consecutive weeks (Mon-based) with ≥1 workout, counting back from this week. */
export function weekStreak(workouts, now = Date.now()) {
  const weekKey = (t) => { const d = new Date(t); const day = (d.getDay() + 6) % 7; d.setHours(0, 0, 0, 0); return d.getTime() - day * DAY; };
  const weeks = new Set(workouts.map((w) => weekKey(w.startedAt)));
  let k = weekKey(now); let n = 0;
  if (!weeks.has(k)) k -= 7 * DAY; // current week not started yet shouldn't break streak
  while (weeks.has(k)) { n++; k -= 7 * DAY; }
  return n;
}

export function bucketVolume(workouts, { days, buckets, now = Date.now() }) {
  const size = days / buckets;
  const out = Array.from({ length: buckets }, (_, i) => ({ start: now - (buckets - i) * size * DAY, volume: 0, sets: 0, workouts: 0 }));
  for (const w of workouts) {
    const idx = Math.floor((w.startedAt - (now - days * DAY)) / (size * DAY));
    if (idx < 0 || idx >= buckets) continue;
    out[idx].volume += workoutVolume(w); out[idx].sets += workoutSetCount(w); out[idx].workouts++;
  }
  return out;
}

export function muscleDistribution(workouts, { days = 30, now = Date.now() } = {}) {
  const out = {};
  for (const w of workouts) {
    if (w.startedAt < now - days * DAY) continue;
    for (const it of w.exercises || []) {
      const ex = EXERCISE_BY_ID[it.exerciseId]; if (!ex) continue;
      const n = workingSets(it).length;
      for (const m of ex.primary) out[m] = (out[m] || 0) + n;
      for (const m of ex.secondary) out[m] = (out[m] || 0) + n * 0.5;
    }
  }
  return out;
}
