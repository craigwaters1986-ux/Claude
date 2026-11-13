// Workout session lifecycle (pure functions over the workout object).

import { uid } from './store.js';
import { exerciseHistory, detectPRs, suggestNext } from './metrics.js';
import { EXERCISE_BY_ID } from './exercises.js';

export function newWorkout(name = 'Workout') {
  return { id: uid('w_'), name, startedAt: Date.now(), endedAt: null, notes: '', exercises: [], rest: null };
}

export function newSet(prev = {}, type = 'working') {
  return { uid: uid('s'), type, weightKg: prev.weightKg ?? null, reps: prev.reps ?? null, rpe: null, rir: null, done: false, completedAt: null };
}

/** Add an exercise; pre-fills set rows from the last session ("previous performance"). */
export function addExercise(w, exerciseId, history = [], { sets, reps, weightKg, restSec, superset } = {}) {
  const last = exerciseHistory(history, exerciseId)[0];
  const count = sets || last?.sets.length || 3;
  const rows = Array.from({ length: count }, (_, i) => {
    const p = last?.sets[i] || last?.sets[last.sets.length - 1];
    return newSet({ weightKg: weightKg ?? p?.weightKg ?? null, reps: reps ?? p?.reps ?? null });
  });
  w.exercises.push({ uid: uid('i'), exerciseId, sets: rows, notes: '', restSec: restSec || null, superset: superset || null });
  return w;
}

export function fromTemplate(tpl, history = []) {
  const w = newWorkout(tpl.name);
  w.templateId = tpl.id;
  for (const e of tpl.exercises) addExercise(w, e.exerciseId, history, { sets: e.sets, restSec: e.restSec, superset: e.superset });
  return w;
}

export function fromPlan(plan, history = []) {
  const w = newWorkout(plan.name);
  w.generatedFrom = plan.source;
  for (const e of plan.exercises) {
    addExercise(w, e.exerciseId, history, { sets: e.sets, reps: e.reps?.[1] ?? e.reps, weightKg: e.suggestedWeightKg ?? undefined, restSec: e.restSec, superset: e.superset });
  }
  return w;
}

/** Previous session's sets for an exercise, aligned to set index (for the "Previous" column). */
export function previousFor(history, exerciseId, before = Infinity) {
  return exerciseHistory(history.filter((w) => w.startedAt < before), exerciseId)[0]?.sets || [];
}

export function cycleSetType(t) {
  const order = ['working', 'warmup', 'drop', 'failure'];
  return order[(order.indexOf(t) + 1) % order.length];
}

export function toggleSuperset(w, index) {
  const a = w.exercises[index], b = w.exercises[index + 1];
  if (!a || !b) return w;
  if (a.superset && a.superset === b.superset) { b.superset = null; if (!w.exercises.some((e, i) => i !== index && e.superset === a.superset)) a.superset = null; }
  else { const g = a.superset || uid('ss'); a.superset = g; b.superset = g; }
  return w;
}

export function suggestionFor(history, exerciseId, goal) {
  return suggestNext(history, exerciseId, { repRange: goal === 'strength' ? [3, 6] : goal === 'endurance' ? [15, 20] : goal === 'fatLoss' ? [10, 15] : [6, 10] });
}

/** Finalise: drop empty sets/exercises, stamp end time, detect PRs. */
export function finishWorkout(w, history = []) {
  const done = structuredClone(w);
  done.endedAt = Date.now();
  done.exercises = done.exercises.map((e) => ({ ...e, sets: e.sets.filter((s) => s.done && (s.reps > 0)) })).filter((e) => e.sets.length);
  delete done.rest;
  const prs = detectPRs(done, history);
  done.prs = prs;
  return done;
}

export function templateFromWorkout(w, name) {
  return {
    id: uid('tpl_'), name: name || w.name,
    exercises: w.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets.filter((s) => s.type !== 'warmup').length || e.sets.length, restSec: e.restSec, superset: e.superset })),
  };
}

export function restFor(item, profile) {
  if (item.restSec) return item.restSec;
  const ex = EXERCISE_BY_ID[item.exerciseId];
  const base = profile.restDefaultSec || 120;
  return ex?.mechanics === 'isolation' ? Math.round(base * 0.6) : base;
}
