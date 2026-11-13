// JS twin of `swift run rep-eval`: evaluates labelled CSV recordings with the
// prototype's rep counter. Same CSV format as GymCore.MotionRecording.
//   node tools/rep-eval.mjs <dir> [--verbose]
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RepCounter, profileForExercise } from '../prototype/js/core/repcounter.js';
import { EXERCISE_BY_ID } from '../prototype/js/core/exercises.js';

export function parseRecording(text) {
  const meta = {}; const samples = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    if (line.startsWith('#')) { for (const kv of line.slice(1).split(',')) { const [k, v] = kv.split('=').map((x) => x.trim()); if (k) meta[k] = v; } continue; }
    if (line.startsWith('t,')) continue;
    const v = line.split(',').map(Number);
    samples.push({ t: v[0], gravity: [v[1], v[2], v[3]], userAccel: [v[4], v[5], v[6]] });
  }
  return { exercise: meta.exercise, sampleRate: +meta.sampleRate || 50, trueReps: +meta.trueReps, user: meta.user || 'anon', samples };
}

export function countRecording(r) {
  const p = profileForExercise(EXERCISE_BY_ID[r.exercise]);
  if (!p) return null;
  const rc = new RepCounter(p, { sampleHz: r.sampleRate });
  for (const s of r.samples) rc.push(s);
  return rc.count;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2]; const verbose = process.argv.includes('--verbose');
  const by = {};
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.csv')).sort()) {
    const r = parseRecording(readFileSync(join(dir, f), 'utf8'));
    const n = countRecording(r); if (n == null) continue;
    const e = (by[r.exercise] ||= { sets: 0, exact: 0, within: 0, abs: 0, users: new Set() });
    const err = Math.abs(n - r.trueReps);
    e.sets++; e.exact += err === 0; e.within += err <= 1; e.abs += err; e.users.add(r.user);
    if (verbose && err) console.log(`MISS ${f}: counted ${n}, true ${r.trueReps}`);
  }
  console.log('| Exercise | Sets | People | Exact | ±1 rep | MAE |\n|---|---|---|---|---|---|');
  for (const [k, e] of Object.entries(by).sort()) console.log(`| ${k} | ${e.sets} | ${e.users.size} | ${Math.round(100 * e.exact / e.sets)}% | ${Math.round(100 * e.within / e.sets)}% | ${(e.abs / e.sets).toFixed(2)} |`);
}
