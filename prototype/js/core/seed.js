// Deterministic SAMPLE training history (≈10 weeks of push/pull/legs) so the
// prototype's dashboards have something realistic to show. Always labelled as
// sample data in the UI and removable from Profile → Data.
//
// The bench press deliberately plateaus over the last ~4–5 weeks so the coach's
// "why has my bench stopped improving?" analysis has a real pattern to find.

import { uid } from './store.js';
import { roundToIncrement } from './metrics.js';

const DAY = 86400000;

const DAYS = {
  push: [['bench', 4, 8, 80], ['inclineDb', 3, 10, 28], ['ohp', 3, 8, 45], ['lateralRaise', 3, 14, 10], ['tricepPushdown', 3, 12, 30]],
  pull: [['row', 3, 8, 70], ['pullup', 3, 8, 0], ['latPulldown', 3, 10, 60], ['facePull', 3, 15, 20], ['dbCurl', 3, 10, 14]],
  legs: [['squat', 4, 6, 110], ['rdl', 3, 8, 90], ['legPress', 3, 12, 180], ['legCurl', 3, 12, 45], ['calfRaise', 4, 12, 80]],
};
const NAMES = { push: 'Push Day', pull: 'Pull Day', legs: 'Leg Day' };
const INC = { bench: 2.5, inclineDb: 2, ohp: 2.5, lateralRaise: 1, tricepPushdown: 2.5, row: 2.5, pullup: 0, latPulldown: 5, facePull: 2.5, dbCurl: 1, squat: 5, rdl: 5, legPress: 10, legCurl: 5, calfRaise: 5 };

export function seedSampleData(now = Date.now()) {
  let a = 42;
  const rand = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
  // Session offsets (days ago), oldest first; most recent: push yesterday.
  const offsets = [];
  for (let d = 70; d >= 1; ) { offsets.push(d); d -= [2, 2, 3][offsets.length % 3]; }
  if (offsets[offsets.length - 1] !== 1) offsets.push(1);
  const order = ['push', 'pull', 'legs'];
  const n = offsets.length;
  const workouts = [];
  offsets.forEach((daysAgo, i) => {
    const type = order[(i + (3 - ((n - 1) % 3))) % 3]; // ensures the last session is push
    const progress = i / n;
    const start = new Date(now - daysAgo * DAY); start.setHours(18, 10 + Math.floor(rand() * 40), 0, 0);
    const exercises = DAYS[type].map(([id, sets, reps, base]) => {
      let p = 0.82 + 0.18 * progress;
      if (id === 'bench') p = 0.84 + 0.16 * Math.min(progress, 0.55) / 0.55; // plateau over the final ~45%
      const top = base ? roundToIncrement(base * p, INC[id]) : 0;
      const out = [];
      if (['bench', 'squat', 'row', 'ohp'].includes(id)) out.push({ uid: uid('s'), type: 'warmup', weightKg: roundToIncrement(top * 0.5, INC[id]), reps: 10, done: true });
      for (let k = 0; k < sets; k++) {
        const ramp = id === 'bench' ? [0.75, 0.875, 1, 1][k] : 1;
        const fatigueDrop = k >= sets - 1 && rand() > 0.5 ? 1 : 0;
        const w = id === 'bench' ? roundToIncrement(top * ramp, 2.5) : top;
        const r = id === 'bench' ? [12, 10, 8, 7][k] : Math.max(3, reps + Math.round((rand() - 0.5) * 2) - fatigueDrop);
        out.push({ uid: uid('s'), type: 'working', weightKg: w, reps: r, rpe: Math.min(10, 7 + k * 0.5 + (rand() > 0.7 ? 0.5 : 0)), done: true });
      }
      return { uid: uid('i'), exerciseId: id, sets: out, notes: '' };
    });
    const dur = 48 + Math.floor(rand() * 25);
    workouts.push({ id: uid('w_'), name: NAMES[type], startedAt: start.getTime(), endedAt: start.getTime() + dur * 60000, notes: '', exercises, sample: true });
  });
  // Make the most recent push match the reference example: 60×12, 70×10, 80×8, 80×7.
  const last = workouts[workouts.length - 1];
  const bench = last.exercises.find((e) => e.exerciseId === 'bench');
  [[60, 12], [70, 10], [80, 8], [80, 7]].forEach(([w, r], k) => Object.assign(bench.sets[k + 1], { weightKg: w, reps: r }));
  return workouts;
}

export const SAMPLE_TEMPLATES = [
  { id: 'tpl_push', name: 'Push Day', exercises: DAYS.push.map(([id, sets, reps]) => ({ exerciseId: id, sets, reps })) },
  { id: 'tpl_pull', name: 'Pull Day', exercises: DAYS.pull.map(([id, sets, reps]) => ({ exerciseId: id, sets, reps })) },
  { id: 'tpl_legs', name: 'Leg Day', exercises: DAYS.legs.map(([id, sets, reps]) => ({ exerciseId: id, sets, reps })) },
];

export const SAMPLE_HEALTH = { sleepHours: 6.6, hrv: 58, hrvZ: -0.4, restingHr: 54, rhrDelta: 1, source: 'simulated' };
