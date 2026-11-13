import { test } from 'node:test';
import assert from 'node:assert/strict';

import { computeRecovery, sessionStimulus, hoursUntil, statusFor, adaptFromFeedback, healthModifier, DEFAULT_RECOVERY_CONFIG } from '../prototype/js/core/recovery.js';
import { e1rm, detectPRs, suggestNext, weekStreak, workoutVolume, roundToIncrement } from '../prototype/js/core/metrics.js';
import { generateWorkout, regenerateExercise, generateProgram, validatePlan, estimateMinutes } from '../prototype/js/core/generator.js';
import { RepCounter, REP_PROFILES, synthesize, countSamples, profileForExercise } from '../prototype/js/core/repcounter.js';
import { EXERCISE_BY_ID, EXERCISES } from '../prototype/js/core/exercises.js';
import { MUSCLES } from '../prototype/js/core/muscles.js';
import { toDisplay, fromDisplay, fmtWeight } from '../prototype/js/core/units.js';
import { seedSampleData } from '../prototype/js/core/seed.js';
import { answer, findExercise } from '../prototype/js/core/coach.js';

const H = 3600e3, D = 24 * H;
const NOW = Date.UTC(2026, 10, 13, 12);
const set = (weightKg, reps, extra = {}) => ({ uid: Math.random().toString(36), type: 'working', weightKg, reps, done: true, ...extra });
const wk = (id, hoursAgo, items) => ({ id, startedAt: NOW - hoursAgo * H - 3600e3, endedAt: NOW - hoursAgo * H, exercises: items.map(([exerciseId, sets]) => ({ exerciseId, sets })) });

// ── Recovery model ──────────────────────────────────────────────────────────
test('untrained user is 100% recovered everywhere', () => {
  const r = computeRecovery([], NOW);
  assert.equal(r.overall, 100);
  assert.ok(r.muscles.every((m) => m.pct === 100 && m.status === 'ready' && m.hoursToReady === 0));
});

test('stimulus: primary full, secondary partial, warm-ups ignored, RIR scales effort', () => {
  const s = sessionStimulus(wk('a', 0, [['bench', [set(60, 10, { type: 'warmup' }), set(80, 8, { rir: 0 }), set(80, 8, { rir: 4 })]]]));
  const cfg = DEFAULT_RECOVERY_CONFIG;
  assert.ok(Math.abs(s.chest - (1 + cfg.effortByRir[4])) < 1e-9);
  assert.ok(Math.abs(s.triceps - (1 + cfg.effortByRir[4]) * cfg.secondaryRole) < 1e-9);
});

test('recovery rises monotonically with time and reaches ready', () => {
  const ws = [wk('a', 0, [['bench', Array.from({ length: 8 }, () => set(80, 8, { rpe: 9 }))]])];
  let prev = -1;
  for (const h of [0, 6, 12, 24, 48, 72, 120]) {
    const p = computeRecovery(ws, NOW + h * H).byId.chest.pct;
    assert.ok(p >= prev, `pct should not drop (h=${h})`); prev = p;
  }
  const at0 = computeRecovery(ws, NOW).byId.chest;
  assert.ok(at0.pct < 50 && at0.status !== 'ready');
  assert.equal(computeRecovery(ws, NOW + (at0.hoursToReady + 1) * H).byId.chest.status, 'ready');
});

test('hoursUntil is consistent with the decay curve', () => {
  const F = 0.6, tau = 24;
  const h = hoursUntil(F, tau, 90);
  assert.ok(Math.abs(F * Math.exp(-h / tau) - 0.1) < 1e-9);
  assert.equal(hoursUntil(0.05, tau, 90), 0);
});

test('status colour bands match the spec', () => {
  assert.equal(statusFor(95), 'ready'); assert.equal(statusFor(90), 'ready');
  assert.equal(statusFor(89), 'light'); assert.equal(statusFor(70), 'light');
  assert.equal(statusFor(69), 'caution'); assert.equal(statusFor(40), 'caution');
  assert.equal(statusFor(39), 'fatigued'); assert.equal(statusFor(0), 'fatigued');
});

test('poor sleep slows recovery, but modifiers are capped', () => {
  const ws = [wk('a', 20, [['squat', Array.from({ length: 6 }, () => set(100, 6))]])];
  const base = computeRecovery(ws, NOW).byId.quads.pct;
  const tired = computeRecovery(ws, NOW, { health: { sleepHours: 4.5, hrvZ: -2, rhrDelta: 9 } }).byId.quads.pct;
  assert.ok(tired < base);
  assert.equal(healthModifier({ sleepHours: 3, hrvZ: -3, rhrDelta: 20 }).factor, DEFAULT_RECOVERY_CONFIG.health.maxCombined);
});

test('personal feedback adapts tau within bounds', () => {
  let p = {};
  for (let i = 0; i < 50; i++) p = adaptFromFeedback(p, 'chest', 90, 'verySore');
  assert.equal(p.chest, DEFAULT_RECOVERY_CONFIG.personal.max);
  p = adaptFromFeedback({}, 'chest', 50, 'fresh');
  assert.ok(p.chest < 1);
});

test('future-dated workouts are ignored', () => {
  assert.equal(computeRecovery([wk('f', -10, [['bench', [set(80, 8)]]])], NOW).overall, 100);
});

test('every exercise references known muscles', () => {
  const ids = new Set(MUSCLES.map((m) => m.id));
  for (const e of EXERCISES) for (const m of [...e.primary, ...e.secondary]) assert.ok(ids.has(m), `${e.id}: ${m}`);
});

// ── Metrics ─────────────────────────────────────────────────────────────────
test('e1rm (Epley) and guards', () => {
  assert.equal(e1rm(100, 1), 100);
  assert.ok(Math.abs(e1rm(100, 5) - 116.667) < 0.01);
  assert.ok(Math.abs(e1rm(100, 5, 2) - e1rm(100, 7)) < 1e-9);
  assert.equal(e1rm(100, 20), null);
  assert.equal(e1rm(0, 5), null);
});

test('PR detection: weight/e1rm/volume PRs only vs earlier history; first session is baseline', () => {
  const a = wk('a', 72, [['bench', [set(80, 8)]]]);
  assert.deepEqual(detectPRs(a, [a]), []);
  const b = wk('b', 0, [['bench', [set(82.5, 8), set(80, 9)]]]);
  const kinds = detectPRs(b, [a, b]).map((p) => p.kind).sort();
  assert.deepEqual(kinds, ['e1rm', 'volume', 'weight']);
  const c = wk('c', 0, [['bench', [set(75, 8)]]]);
  assert.deepEqual(detectPRs(c, [a, c]), []);
});

test('progressive overload: increase when top of range hit with reps in reserve', () => {
  const ws = [wk('a', 48, [['bench', [set(80, 10, { rir: 2 }), set(80, 10, { rir: 2 }), set(80, 10, { rir: 3 })]]])];
  const s = suggestNext(ws, 'bench', { repRange: [6, 10] });
  assert.equal(s.action, 'increase'); assert.equal(s.weightKg, 82.5);
});

test('progressive overload: add reps when range not yet complete; deload after two misses', () => {
  const ws = [wk('a', 48, [['bench', [set(80, 8), set(80, 7)]]])];
  assert.deepEqual([suggestNext(ws, 'bench').action, suggestNext(ws, 'bench').reps], ['reps', 9]);
  const miss = [wk('a', 96, [['bench', [set(80, 5)]]]), wk('b', 48, [['bench', [set(80, 4)]]])];
  const d = suggestNext(miss, 'bench', { repRange: [6, 10] });
  assert.equal(d.action, 'deload'); assert.equal(d.weightKg, 72.5);
});

test('progressive overload never jumps more than 10% (light dumbbells)', () => {
  const ws = [wk('a', 48, [['lateralRaise', [set(6, 15, { rir: 3 }), set(6, 15, { rir: 3 })]]])];
  const s = suggestNext(ws, 'lateralRaise', { repRange: [10, 15] });
  assert.ok(s.weightKg == null || s.weightKg <= 6 * 1.1);
});

test('no history → no fabricated weight', () => {
  const s = suggestNext([], 'bench');
  assert.equal(s.weightKg, null); assert.equal(s.action, 'baseline');
});

test('volume, streaks, rounding', () => {
  assert.equal(workoutVolume(wk('a', 0, [['bench', [set(100, 5), set(50, 10, { type: 'warmup' })]]])), 500);
  assert.equal(roundToIncrement(81.3, 2.5), 82.5);
  const ws = [0, 7, 14].map((d, i) => wk(`w${i}`, d * 24, [['bench', [set(80, 5)]]]));
  assert.equal(weekStreak(ws, NOW), 3);
});

test('unit conversion round-trips', () => {
  assert.equal(toDisplay(100, 'lb'), 220.5);
  assert.ok(Math.abs(fromDisplay('220.5', 'lb') - 100.017) < 0.01);
  assert.equal(fmtWeight(82.5, 'kg'), '82.5 kg');
  assert.equal(fromDisplay('abc'), null);
});

// ── Generator + safeguards ─────────────────────────────────────────────────
const baseInput = { goal: 'hypertrophy', experience: 'intermediate', durationMin: 45, location: 'gym' };

test('generator respects duration, equipment and target', () => {
  for (const durationMin of [20, 30, 45, 60, 75, 90]) {
    const p = generateWorkout({ ...baseInput, durationMin, target: ['chest', 'arms'] });
    assert.ok(p.exercises.length >= 1, `${durationMin}`);
    assert.ok(p.estimatedMinutes <= durationMin + 2, `${durationMin}: ${p.estimatedMinutes}`);
  }
  const home = generateWorkout({ ...baseInput, location: 'bodyweight', target: ['legs'] });
  assert.ok(home.exercises.every((e) => EXERCISE_BY_ID[e.exerciseId].equipment.length === 0));
});

test('generator excludes injuries and avoided muscles', () => {
  const p = generateWorkout({ ...baseInput, durationMin: 90, injuries: ['shoulder', 'knee'], avoid: ['arms'] });
  for (const e of p.exercises) {
    const ex = EXERCISE_BY_ID[e.exerciseId];
    assert.ok(!ex.stress.includes('shoulder') && !ex.stress.includes('knee'), ex.id);
    assert.ok(!ex.primary.some((m) => ['biceps', 'triceps', 'forearms'].includes(m)), ex.id);
  }
  assert.ok(p.notes.some((n) => /not medical advice/.test(n)));
});

test('generator skips fatigued muscles and lightens when overall recovery is low', () => {
  const ws = [wk('a', 2, [['bench', Array.from({ length: 12 }, () => set(80, 8, { rpe: 10 }))]])];
  const rec = computeRecovery(ws, NOW);
  const p = generateWorkout({ ...baseInput, target: ['chest', 'back'] }, { workouts: ws, recovery: rec });
  assert.ok(p.exercises.every((e) => !EXERCISE_BY_ID[e.exerciseId].primary.includes('chest')));
  assert.ok(p.warnings.some((w) => /Chest/.test(w)));
  const lowRec = { ...rec, overall: 30 };
  assert.ok(generateWorkout({ ...baseInput, target: ['legs'] }, { workouts: ws, recovery: lowRec }).warnings.some((w) => /lighter session/.test(w)));
});

test('generator respects per-session volume caps', () => {
  const p = generateWorkout({ ...baseInput, experience: 'beginner', durationMin: 90, target: ['chest'] });
  const chest = p.exercises.filter((e) => e.targetMuscles.primary.includes('chest')).reduce((a, e) => a + e.sets, 0);
  assert.ok(chest <= 6, `chest sets ${chest}`);
});

test('regenerate a single exercise keeps the rest and targets the same muscles', () => {
  const p = generateWorkout({ ...baseInput, target: ['chest', 'back'] });
  const q = regenerateExercise(p, 0, {});
  assert.notEqual(q.exercises[0].exerciseId, p.exercises[0].exerciseId);
  assert.deepEqual(q.exercises.slice(1).map((e) => e.exerciseId), p.exercises.slice(1).map((e) => e.exerciseId));
  const before = EXERCISE_BY_ID[p.exercises[0].exerciseId], after = EXERCISE_BY_ID[q.exercises[0].exerciseId];
  assert.ok(after.pattern === before.pattern || after.primary.some((m) => before.primary.includes(m)));
});

test('weekly programme: split choice and weekly caps', () => {
  const prog = generateProgram({ ...baseInput, daysPerWeek: 6, durationMin: 90, experience: 'beginner' });
  assert.equal(prog.split, 'ppl'); assert.equal(prog.sessions.length, 6);
  for (const v of Object.values(prog.weeklySets)) assert.ok(v <= 10, `weekly ${v}`);
  assert.equal(generateProgram({ ...baseInput, daysPerWeek: 4 }).split, 'upperLower');
});

test('validatePlan strips unsafe cloud output', () => {
  const ws = [wk('a', 72, [['bench', [set(80, 8)]]])];
  const plan = { exercises: [
    { exerciseId: 'bench', sets: 4, suggestedWeightKg: 140 },          // unrealistic jump
    { exerciseId: 'squat', sets: 3 },                                   // knee injury
    { exerciseId: 'madeUp', name: 'Hyper Mega Press', sets: 3 },        // hallucinated
    { exerciseId: 'dbBench', sets: 20, suggestedWeightKg: 30 },         // no history, absurd sets
  ] };
  const v = validatePlan(plan, { ...baseInput, injuries: ['knee'] }, { workouts: ws });
  assert.equal(v.ok, false);
  assert.deepEqual(v.plan.exercises.map((e) => e.exerciseId), ['bench', 'dbBench']);
  assert.equal(v.plan.exercises[0].suggestedWeightKg, 88);
  assert.equal(v.plan.exercises[1].suggestedWeightKg, null);
  assert.ok(v.plan.exercises[1].sets <= 6);
});

test('estimateMinutes is positive and grows with sets', () => {
  const a = estimateMinutes([{ exerciseId: 'bench', sets: 3, restSec: 120 }]);
  const b = estimateMinutes([{ exerciseId: 'bench', sets: 5, restSec: 120 }]);
  assert.ok(a > 0 && b > a);
});

// ── Rep counter ────────────────────────────────────────────────────────────
test('rep counter: exact on synthetic curls, raises and presses across tempos', () => {
  const cases = [['curl', 'curl'], ['lateralRaise', 'lateralRaise'], ['press', 'verticalPush']];
  for (const [kind, prof] of cases) for (const seed of [1, 2, 3]) for (const reps of [5, 12]) for (const repSec of [1.4, 2.5, 3.5]) {
    assert.equal(countSamples(synthesize({ kind, reps, seed, repSec, noise: 0.04 }), REP_PROFILES[prof]), reps, `${kind} s${seed} r${reps} t${repSec}`);
  }
});

test('rep counter: holding still counts zero; manual correction works', () => {
  assert.equal(countSamples(synthesize({ kind: 'curl', reps: 0, restBefore: 15 }), REP_PROFILES.curl), 0);
  assert.equal(countSamples(synthesize({ kind: 'press', reps: 0, restBefore: 15, noise: 0.04 }), REP_PROFILES.verticalPush), 0);
  const rc = new RepCounter(REP_PROFILES.curl);
  assert.equal(rc.correct(+2), 2); assert.equal(rc.correct(-5), 0);
});

test('rep counter refuses unsupported exercises', () => {
  assert.equal(profileForExercise(EXERCISE_BY_ID.legPress), null);
  assert.equal(profileForExercise(EXERCISE_BY_ID.plank), null);
  assert.equal(profileForExercise(EXERCISE_BY_ID.dbCurl).id, 'curl');
});

// ── Coach grounding ────────────────────────────────────────────────────────
test('coach never invents data', () => {
  const r = answer('How much should I bench next session?', { workouts: [], profile: {} });
  assert.match(r.text, /haven't logged/);
  const h = answer('How is my HRV?', { workouts: [], profile: {}, health: null });
  assert.match(h.text, /don't have access/);
});

test('coach finds the seeded bench plateau and suggests alternatives', () => {
  const ws = seedSampleData(NOW);
  const rec = computeRecovery(ws, NOW);
  const r = answer('Why has my bench press stopped improving?', { workouts: ws, recovery: rec, profile: { units: 'kg' } });
  assert.match(r.text, /flat/);
  const a = answer('Give me an alternative to barbell squats', { workouts: ws, profile: { equipment: ['dumbbell', 'machine', 'bench'] } });
  assert.ok(a.cards.length > 0);
  assert.equal(findExercise('alternative to barbell squats').id, 'squat');
  const g = answer('Build me a 45-minute chest and triceps workout.', { workouts: ws, recovery: computeRecovery(ws, NOW + 4 * D), profile: { goal: 'hypertrophy', experience: 'intermediate', location: 'gym' } });
  assert.ok(g.plan.exercises.length >= 3);
  assert.ok(g.plan.estimatedMinutes <= 47);
});

test('generator explains when the weekly volume cap blocks a target', () => {
  const ws = [0, 1, 2].map((d) => wk(`c${d}`, 72 + d * 24, [['cableFly', Array.from({ length: 6 }, () => set(20, 12))]]));
  const rec = computeRecovery(ws, NOW);
  const p = generateWorkout({ ...baseInput, target: ['chest'] }, { workouts: ws, recovery: rec });
  assert.equal(p.exercises.length, 0);
  assert.ok(p.warnings.some((w) => /weekly cap/.test(w)), p.warnings.join(' '));
  assert.ok(!p.warnings.some((w) => /equipment/.test(w)));
});

// ── Sync (client) ─────────────────────────────────────────────────────────
import { collectChanges, applyRemote, entities } from '../prototype/js/core/sync.js';
import { defaultState } from '../prototype/js/core/store.js';

test('sync: first sync pushes everything except sample/active data; second sync pushes nothing', () => {
  const s = defaultState();
  s.workouts = [{ id: 'a', name: 'A', startedAt: 1, endedAt: 2, exercises: [] }, { id: 'sample', sample: true, endedAt: 2, startedAt: 1, exercises: [] }];
  s.active = { id: 'live', exercises: [] };
  const c1 = collectChanges(s, 1000);
  assert.deepEqual(c1.map((c) => `${c.kind}:${c.id}`).sort(), ['profile:me', 'workout:a']);
  const s2 = applyRemote(s, c1, c1);
  assert.deepEqual(collectChanges(s2, 2000), []);
  // Edit + delete produce an upsert and a tombstone
  s2.workouts[0].name = 'A2'; s2.workouts = s2.workouts.filter((w) => w.id !== 'a').concat([]);
  const c3 = collectChanges(s2, 3000);
  assert.deepEqual(c3.map((c) => [c.id, c.deleted]), [['a', true]]);
});

test('sync: remote changes upsert, delete and merge profile; newer local edits are kept', () => {
  const s = defaultState();
  s.workouts = [{ id: 'x', name: 'Old', startedAt: 1, endedAt: 2, exercises: [] }];
  const out = applyRemote(s, [
    { kind: 'workout', id: 'x', updatedAt: 10, deleted: false, payload: { id: 'x', name: 'From iPad', startedAt: 1, endedAt: 2, exercises: [] } },
    { kind: 'workout', id: 'y', updatedAt: 10, deleted: false, payload: { id: 'y', name: 'New', startedAt: 3, endedAt: 4, exercises: [] } },
    { kind: 'profile', id: 'me', updatedAt: 10, deleted: false, payload: { units: 'lb' } },
  ]);
  assert.deepEqual(out.workouts.map((w) => w.name), ['From iPad', 'New']);
  assert.equal(out.profile.units, 'lb');
  assert.deepEqual(collectChanges(out, 20).filter((c) => c.kind === 'workout'), [], 'applied remote state is clean');
  const gone = applyRemote(out, [{ kind: 'workout', id: 'y', updatedAt: 11, deleted: true, payload: null }]);
  assert.deepEqual(gone.workouts.map((w) => w.id), ['x']);
  const pushed = [{ kind: 'workout', id: 'x', updatedAt: 50, deleted: false, payload: { id: 'x', name: 'Mine' } }];
  const kept = applyRemote({ ...out, workouts: [{ id: 'x', name: 'Mine', startedAt: 1, endedAt: 2, exercises: [] }] }, [{ kind: 'workout', id: 'x', updatedAt: 40, deleted: false, payload: { id: 'x', name: 'Theirs' } }], pushed);
  assert.equal(kept.workouts[0].name, 'Mine');
  assert.ok(entities(kept)['workout:x']);
});
