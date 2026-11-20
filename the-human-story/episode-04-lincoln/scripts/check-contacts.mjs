// Contact checker for the upgrade test reel: evaluates every frame of every shot with the same pure
// solvers the composition draws from, and reports hand-to-grip and hip-to-seat / feet-to-floor errors
// in screen pixels (scene error × camera zoom). Acceptance: all ≤ 3 px.
// Usage: node scripts/check-contacts.mjs [out.json]
import {build} from 'esbuild';
import {writeFileSync, mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
mkdirSync('output', {recursive: true});
await build({entryPoints: ['src/scenes/reelSolve.ts'], bundle: true, platform: 'node', format: 'esm', outfile: 'output/reelSolve.mjs', loader: {'.json': 'json'}, external: ['react', 'remotion'], logLevel: 'error'});
const m = await import(pathToFileURL('output/reelSolve.mjs').href + '?' + Date.now());
const rep = {};
let worst = 0;
for (const sh of m.SHOTS) {
  const r = {frames: sh.dur, contactFrames: 0, maxHandPx: 0, maxHandAt: null, seatFrames: 0, maxHipPx: 0, maxFeetPx: 0};
  for (let f = 0; f < sh.dur; f++) {
    const s = m.SOLVERS[sh.id](f);
    const z = m.camZoom(s.cam, f);
    for (const c of s.checks) {
      const d = Math.hypot(c.hand.x - c.grip.x, c.hand.y - c.grip.y) * z;
      r.contactFrames++;
      if (d > r.maxHandPx) { r.maxHandPx = d; r.maxHandAt = `${c.label} @ f${f}`; }
    }
    for (const q of s.seats) {
      r.seatFrames++;
      r.maxHipPx = Math.max(r.maxHipPx, Math.abs(q.hipY - q.seatY) * z);
      r.maxFeetPx = Math.max(r.maxFeetPx, ...q.feet.map((p) => Math.abs(p.y - q.floor) * z));
    }
  }
  for (const k of ['maxHandPx', 'maxHipPx', 'maxFeetPx']) r[k] = Math.round(r[k] * 100) / 100;
  worst = Math.max(worst, r.maxHandPx, r.maxHipPx, r.maxFeetPx);
  rep[sh.id] = r;
}
// Phase C chapters s01 + s09 (same measure; each module exports <X>_SHOTS, <X>_SOLVERS and camZoom)
for (const [file, shK, soK] of [['s01-solve', 'S01_SHOTS', 'S01_SOLVERS'], ['s09-solve', 'S09_SHOTS', 'S09_SOLVERS'], ['s02-solve', 'S02_SHOTS', 'S02_SOLVERS'], ['s03-solve', 'S03_SHOTS', 'S03_SOLVERS'], ['kitSolve', 'KIT_SOLVED_SHOTS', 'KIT_SOLVERS']]) {
  await build({entryPoints: [`src/scenes/${file}.ts`], bundle: true, platform: 'node', format: 'esm', outfile: `output/${file}.mjs`, loader: {'.json': 'json'}, external: ['react', 'remotion'], logLevel: 'error'});
  const cm = await import(pathToFileURL(`output/${file}.mjs`).href + '?' + Date.now());
  for (const sh of cm[shK]) {
    const r = {frames: sh.dur, contactFrames: 0, maxHandPx: 0, maxHandAt: null, seatFrames: 0, maxHipPx: 0, maxFeetPx: 0};
    for (let f = 0; f < sh.dur; f++) {
      const s = cm[soK][sh.id](f);
      const z = cm.camZoom(s.cam, f);
      for (const c of s.checks) {
        const d = Math.hypot(c.hand.x - c.grip.x, c.hand.y - c.grip.y) * z;
        r.contactFrames++;
        if (d > r.maxHandPx) { r.maxHandPx = d; r.maxHandAt = `${c.label} @ f${f}`; }
      }
      for (const q of s.seats) {
        r.seatFrames++;
        r.maxHipPx = Math.max(r.maxHipPx, Math.abs(q.hipY - q.seatY) * z);
        r.maxFeetPx = Math.max(r.maxFeetPx, ...q.feet.map((p) => Math.abs(p.y - q.floor) * z));
      }
    }
    for (const k of ['maxHandPx', 'maxHipPx', 'maxFeetPx']) r[k] = Math.round(r[k] * 100) / 100;
    worst = Math.max(worst, r.maxHandPx, r.maxHipPx, r.maxFeetPx);
    rep[sh.id] = r;
  }
}
console.table(rep);
console.log(worst <= 3 ? `PASS: worst contact ${worst.toFixed(2)} px (limit 3 px)` : `FAIL: worst contact ${worst.toFixed(2)} px (limit 3 px)`);
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify({limitPx: 3, worstPx: worst, pass: worst <= 3, shots: rep}, null, 1));
