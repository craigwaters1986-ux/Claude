// Skeletal pose library for stick figures.  All angles are in degrees.
//  hip*: thigh swing from vertical (+ = forward)      knee*: knee bend (+ = shin swings back)
//  sh*:  arm swing from hanging down (+ = forward/up)  el*:  elbow bend (+ = forearm further forward/up)
import {noise1} from '../animations/core';
import {reach as reachTo, solveSkeleton} from './skeleton';

export type Pose = {
  lean: number;
  hipL: number; kneeL: number; hipR: number; kneeR: number;
  shL: number; elL: number; shR: number; elR: number;
  headTilt: number;
  bob: number; // vertical body offset (px, negative = up)
};

export const ZERO: Pose = {lean: 0, hipL: 0, kneeL: 0, hipR: 0, kneeR: 0, shL: 0, elL: 0, shR: 0, elR: 0, headTilt: 0, bob: 0};

export const pose = (p: Partial<Pose>): Pose => ({...ZERO, ...p});

export function mixPose(a: Pose, b: Pose, t: number): Pose {
  const o = {} as Pose;
  (Object.keys(a) as (keyof Pose)[]).forEach((k) => {
    o[k] = a[k] + (b[k] - a[k]) * t;
  });
  return o;
}

export const addPose = (a: Pose, b: Partial<Pose>): Pose => {
  const o = {...a};
  (Object.keys(b) as (keyof Pose)[]).forEach((k) => {
    o[k] = a[k] + (b[k] ?? 0);
  });
  return o;
};

const TAU = Math.PI * 2;

/** Idle standing with gentle breathing and arm sway. */
export const stand = (f: number, seed = 0): Pose =>
  pose({
    hipL: -5, hipR: 5,
    shL: -8 + noise1(f / 40, seed) * 3, elL: 8,
    shR: 8 + noise1(f / 45, seed + 3) * 3, elR: 10,
    bob: Math.sin(f / 22 + seed) * 1.2,
    headTilt: noise1(f / 60, seed + 9) * 3,
  });

/** Walk cycle; phase in cycles (0..1 per stride pair). */
export function walk(phase: number, amp = 1): Pose {
  const a = phase * TAU;
  const s = Math.sin(a);
  const kL = Math.max(0, Math.sin(a + Math.PI * 0.5)) * 38 * amp + 6;
  const kR = Math.max(0, Math.sin(a + Math.PI * 1.5)) * 38 * amp + 6;
  return pose({
    lean: 3,
    hipL: 26 * s * amp, kneeL: kL,
    hipR: -26 * s * amp, kneeR: kR,
    shL: -24 * s * amp, elL: 14,
    shR: 24 * s * amp, elR: 14,
    bob: -Math.abs(Math.cos(a)) * 4 * amp + 2,
    headTilt: 2,
  });
}

/** Run cycle. */
export function run(phase: number, amp = 1): Pose {
  const a = phase * TAU;
  const s = Math.sin(a);
  const kL = Math.max(0, Math.sin(a + Math.PI * 0.5)) * 75 * amp + 18;
  const kR = Math.max(0, Math.sin(a + Math.PI * 1.5)) * 75 * amp + 18;
  return pose({
    lean: 14,
    hipL: 42 * s * amp, kneeL: kL,
    hipR: -42 * s * amp, kneeR: kR,
    shL: -50 * s * amp + 10, elL: 85,
    shR: 50 * s * amp + 10, elR: 85,
    bob: -Math.abs(Math.cos(a)) * 9 * amp + 4,
    headTilt: 4,
  });
}

/** Stiff military march. */
export function march(phase: number): Pose {
  const a = phase * TAU;
  const s = Math.sin(a);
  return pose({
    lean: 1,
    hipL: 24 * s, kneeL: Math.max(0, Math.sin(a + Math.PI * 0.5)) * 18 + 2,
    hipR: -24 * s, kneeR: Math.max(0, Math.sin(a + Math.PI * 1.5)) * 18 + 2,
    shL: -6, elL: 4, // left arm holds rifle strap
    shR: 30 * s, elR: 6,
    bob: -Math.abs(Math.cos(a)) * 3 + 1,
  });
}

export const sit = (f = 0, seed = 0): Pose =>
  pose({hipL: 88, kneeL: 88, hipR: 92, kneeR: 92, lean: -2, shL: 30, elL: 50, shR: 35, elR: 55, bob: 0, headTilt: noise1(f / 60, seed) * 3});

/** Right arm points at angle (deg, 90 = straight ahead, 140 = up-forward). */
export const point = (f: number, angle = 100, seed = 0): Pose =>
  addPose(stand(f, seed), {shR: angle - 8, elR: 4 - (stand(f, seed).elR - 0), shL: -4});

export const cheer = (f: number, seed = 0): Pose =>
  pose({
    hipL: -8, hipR: 8,
    shL: 160 + Math.sin(f / 4 + seed) * 14, elL: 10,
    shR: 165 + Math.sin(f / 4 + seed + 1.5) * 14, elR: 10,
    bob: -Math.abs(Math.sin(f / 5 + seed)) * 14,
    headTilt: -6,
  });

export const wave = (f: number, seed = 0): Pose =>
  addPose(stand(f, seed), {shR: 150, elR: 20 + Math.sin(f / 3 + seed) * 25});

export const cower = (f: number, seed = 0): Pose =>
  pose({
    lean: 22, hipL: 40, kneeL: 70, hipR: 34, kneeR: 64,
    shL: 150, elL: 120, shR: 140, elR: 125,
    bob: 20 + Math.sin(f / 2 + seed) * 1.5,
    headTilt: 12,
  });

export const shrug = (f: number): Pose =>
  pose({hipL: -5, hipR: 5, shL: 30, elL: 95, shR: 30, elR: 95, bob: -2 + Math.sin(f / 6) * 1, headTilt: 8});

export const slump = (f: number, seed = 0): Pose =>
  pose({lean: 12, hipL: -3, hipR: 3, kneeL: 4, kneeR: 4, shL: 4, elL: 2, shR: 6, elR: 2, headTilt: 14 + noise1(f / 50, seed) * 2, bob: 3});

export const holdFront = (f: number, seed = 0): Pose =>
  addPose(stand(f, seed), {shL: 55, elL: 50, shR: 60, elR: 48});

export const fistShake = (f: number): Pose =>
  pose({hipL: -6, hipR: 6, lean: 4, shL: 10, elL: 30, shR: 140 + Math.sin(f / 2.5) * 12, elR: 40 + Math.sin(f / 2.5) * 20, bob: Math.sin(f / 2.5) * 2});

export const talkGesture = (f: number, seed = 0): Pose =>
  addPose(stand(f, seed), {
    shR: 55 + Math.sin(f / 9 + seed) * 22,
    elR: 55 + Math.sin(f / 7 + seed) * 25,
    shL: 20 + Math.sin(f / 11 + seed + 2) * 10,
    elL: 40,
  });

export const handsUp = (f: number, seed = 0): Pose =>
  pose({hipL: -4, hipR: 4, shL: 165, elL: -10, shR: 168, elR: -12, bob: Math.sin(f / 20 + seed), headTilt: 10});

export const kneel = (f = 0): Pose =>
  pose({lean: 6, hipL: 80, kneeL: 85, hipR: -5, kneeR: 95, shL: 40, elL: 30, shR: 50, elR: 40, bob: 52, headTilt: 10 + Math.sin(f / 30) * 2});

export const salute = (f = 0): Pose =>
  pose({hipL: -3, hipR: 3, shL: -2, elL: 0, shR: 120, elR: 135, bob: Math.sin(f / 22) * 1});

// ===========================================================================
// Episode 1 additions (asset requests A-04 … A-24).  Pure functions of the frame
// so every pose is deterministic and loopable.  `t` arguments are 0..1 progress
// values the scene computes with prog()/kf(); `phase` arguments are cycles.
// ===========================================================================

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};

/** Piecewise interpolation between key poses: keys = [[t, pose], ...] (t ascending). */
export function keyPoses(t: number, keys: [number, Pose][]): Pose {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, p0] = keys[i];
    const [t1, p1] = keys[i + 1];
    if (t <= t1) return mixPose(p0, p1, smooth((t - t0) / Math.max(1e-6, t1 - t0)));
  }
  return keys[keys.length - 1][1];
}

/** Stiff, formal standing (delegations, honour guards): almost no sway. */
export const standStiff = (f: number, seed = 0): Pose =>
  pose({hipL: -3, hipR: 3, shL: -3, elL: 3, shR: 3, elR: 3, bob: Math.sin(f / 30 + seed) * 0.5, headTilt: noise1(f / 90, seed) * 1});

/** Seated on a chair/bench with the FEET ON THE GROUND LINE (seat height = half a leg). */
export const seated = (f = 0, seed = 0): Pose =>
  pose({hipL: 88, kneeL: 86, hipR: 92, kneeR: 90, lean: 2, shL: 35, elL: 45, shR: 40, elR: 50, bob: 54, headTilt: noise1(f / 60, seed) * 3});

/** Sitting on the ground, knees up, arms resting on the knees. */
export const sitGround = (f = 0, seed = 0): Pose =>
  pose({hipL: 118, kneeL: 70, hipR: 122, kneeR: 74, lean: 6, shL: 70, elL: 30, shR: 75, elR: 28, bob: 100, headTilt: 6 + noise1(f / 70, seed) * 2});

// ---- A-04 paratrooper -------------------------------------------------------
/** Hanging under a canopy: legs together, knees soft, hands up on the front and rear risers
 *  (kept clear of the big head so they read), slow sway.  Attach rigging lines at
 *  shoulderWorld() (skeleton.ts); the risers can run through handWorld(..., 'R'/'L'). */
export const dangle = (f: number, seed = 0): Pose => {
  const sw = Math.sin(f / 28 + seed);
  return pose({lean: sw * 2, hipL: 8 + sw * 4, kneeL: 16, hipR: 3 + sw * 4, kneeR: 10, shL: -100, elL: -62, shR: 102, elR: 62, headTilt: 3 + sw * 2});
};

// ---- A-05 survivors (dignified; no exaggeration) ----------------------------
/** Standing quietly, slight stoop, hands together in front. */
export const survivorStand = (f: number, seed = 0): Pose => {
  const b = pose({lean: 6, hipL: -3, hipR: 3, kneeL: 3, kneeR: 3, bob: 2 + Math.sin(f / 34 + seed) * 0.6, headTilt: 7 + noise1(f / 80, seed) * 2});
  return {...b, shR: -6, elR: 44, shL: -3, elL: 46};
};

/** Slow seated pose (on a bench/step, feet on the ground), hands in the lap. */
export const survivorSit = (f: number, seed = 0): Pose => {
  const b = pose({hipL: 88, kneeL: 86, hipR: 92, kneeR: 90, lean: 9, bob: 54 + Math.sin(f / 40 + seed) * 0.5, headTilt: 9 + noise1(f / 90, seed) * 2});
  return {...b, shR: 8, elR: 62, shL: 12, elL: 58};
};

/** Receive with both hands.  t: 0 = hands together at the waist, 0.5 = both arms
 *  extended forward (taking), 1 = holding the item close to the chest.
 *  Draw the item with props.HeldItem between the hands (overlayFront). */
export const receiveBothHands = (f: number, t: number, seed = 0): Pose => {
  const base = survivorStand(f, seed);
  const reachP = {...base, lean: 10, shL: 72, elL: 8, shR: 66, elR: 12, headTilt: 4};
  const hold = {...base, lean: 5, shL: 30, elL: 95, shR: 26, elR: 100, headTilt: 8};
  return keyPoses(t, [[0, base], [0.5, reachP], [1, hold]]);
};

// ---- A-06 respect -------------------------------------------------------------
/** Remove the helmet/cap and hold it at the chest.  t: 0 = arms down, 0.35 = hand at the
 *  helmet (it leaves the head here — use hatOff(t)), 1 = held at the chest, head slightly bowed.
 *  kneeling = true works from the kneel() pose. */
export const helmetToChest = (f: number, t: number, kneeling = false, seed = 0): Pose => {
  const base = kneeling ? {...kneel(f), shL: 30, elL: 20, shR: 10, elR: 5, headTilt: 4} : standStiff(f, seed);
  const atHead = {...base, shR: 150, elR: 95, headTilt: base.headTilt - 2};
  const lift = {...base, shR: 125, elR: 70};
  const sk0 = solveSkeleton(base);
  const chest = {...reachTo(base, 'R', {x: sk0.sh.x + 20, y: sk0.sh.y + 30}), headTilt: base.headTilt + 12};
  return keyPoses(t, [[0, base], [0.3, atHead], [0.45, lift], [1, chest]]);
};
/** True once the hat has left the head (pass `hatInHand` to StickFigure). */
export const hatOff = (t: number) => t >= 0.32;

/** Bow the head about 15° (amt 0..1) on top of any pose.  Combine with eyesClosed on the figure. */
export const headBowed = (base: Pose, amt = 1): Pose => addPose(base, {headTilt: 15 * amt, lean: 3 * amt});

// ---- A-07 signing -----------------------------------------------------------------
export type SignOpts = {
  seated?: boolean;
  deskX?: number; // local x of the writing point (default 58)
  deskY?: number; // local y of the table top (default -92: a table for a seated or standing adult)
  start?: number; // frame the writing starts
  lookUps?: [number, number][]; // frame windows where the signer pauses and looks up
  seed?: number;
};
/** Writing at a table: small loops along a line, head down; optional pause-and-look-up.
 *  Put the pen in the hand with overlayFront={(sk) => <Pen x={sk.armR.hx} y={sk.armR.hy} />}. */
export function signDocument(f: number, o: SignOpts = {}): {pose: Pose; lookingUp: boolean} {
  const seed = o.seed ?? 0;
  const base = o.seated ? seated(f, seed) : standStiff(f, seed);
  const lookingUp = (o.lookUps ?? []).some(([a, b]) => f >= a && f < b);
  const up = (o.lookUps ?? []).reduce((m, [a, b]) => Math.max(m, Math.min(smooth((f - a) / 8), smooth((b - f) / 8))), 0);
  const lean = o.seated ? 16 : 12;
  const p0 = {...base, lean: lean - up * 8, headTilt: 20 - up * 24};
  const lf = f - (o.start ?? 0);
  const writing = 1 - up;
  const loop = lf / 3.2;
  const drift = ((lf % 75) / 75) * 34;
  const dx = o.deskX ?? 58;
  const dy = o.deskY ?? (o.seated ? -92 : -118);
  const tR = {x: dx - 10 + drift * writing + Math.cos(loop) * 4 * writing, y: dy - 4 + Math.sin(loop) * 3 * writing - up * 12};
  const tL = {x: dx - 34, y: dy - 2};
  let p = reachTo(p0, 'R', tR);
  p = reachTo(p, 'L', tL);
  return {pose: p, lookingUp};
}

// ---- A-14 wading ---------------------------------------------------------------------
/** High-step wade with the rifle held above the head.  `depth` (local px) sinks the body:
 *  set the figure's y to the WATER SURFACE and cutBelow = that y; draw the rifle with
 *  overlayTop={(sk) => <RifleBetween a={{x: sk.armL.hx - 20, y: sk.armL.hy}} b={{x: sk.armR.hx + 30, y: sk.armR.hy}} />}
 *  (overlayTop so the rifle reads over the helmet) and nearArmFront. */
export function wade(phase: number, depth = 70): Pose {
  const a = phase * TAU;
  const s = Math.sin(a);
  return pose({
    lean: 7,
    hipL: 12 + 40 * Math.max(0, s) - 14 * Math.max(0, -s), kneeL: 10 + 70 * Math.max(0, s),
    hipR: 12 + 40 * Math.max(0, -s) - 14 * Math.max(0, s), kneeR: 10 + 70 * Math.max(0, -s),
    shL: 175 + s * 3, elL: -10, shR: 128 + s * 3, elR: 36,
    bob: depth - Math.abs(s) * 6,
    headTilt: -4,
  });
}

// ---- A-15 bucket chain -------------------------------------------------------------------
/** Bend, lift from behind, swing forward and pass.  Loop with phase = f / period + index * offset.
 *  `holding` tells the scene when to draw the brick/bucket between the hands. */
export function bucketChain(phase: number): {pose: Pose; holding: boolean} {
  const t = ((phase % 1) + 1) % 1;
  const rest = pose({lean: 4, hipL: -6, hipR: 8, kneeL: 6, kneeR: 6, shL: 20, elL: 30, shR: 24, elR: 30});
  const take = pose({lean: 32, hipL: -10, hipR: 14, kneeL: 30, kneeR: 26, shL: -38, elL: 30, shR: -32, elR: 30, bob: 10, headTilt: -6});
  const lift = pose({lean: 12, hipL: -6, hipR: 10, kneeL: 14, kneeR: 12, shL: 30, elL: 60, shR: 34, elR: 60, bob: 4});
  const pass = pose({lean: 10, hipL: -2, hipR: 14, kneeL: 4, kneeR: 8, shL: 82, elL: 10, shR: 88, elR: 8, headTilt: 4});
  const p = keyPoses(t, [[0, rest], [0.22, take], [0.42, lift], [0.62, pass], [0.75, pass], [1, rest]]);
  return {pose: p, holding: t > 0.24 && t < 0.7};
}

// ---- A-18 combat movement -----------------------------------------------------------------
/** Low run, head down, rifle held across the body. */
export function crouchRun(phase: number, amp = 1): Pose {
  const r = run(phase, 0.8 * amp);
  return {...r, lean: 30, kneeL: r.kneeL + 22, kneeR: r.kneeR + 22, bob: r.bob + 20, shL: 55, elL: 55, shR: 35, elR: 75, headTilt: 10};
}
/** Crouched behind cover, one hand holding the helmet, small breathing motion. */
export const takeCover = (f: number, seed = 0): Pose =>
  pose({lean: 30, hipL: 100, kneeL: 150, hipR: 92, kneeR: 146, shL: 62, elL: 58, shR: 132, elR: 105, bob: 80 + Math.sin(f / 6 + seed) * 1.2, headTilt: 16});
/** Kneel and aim along the facing direction.  Draw the rifle with RifleAim (props.tsx). */
export const kneelAim = (f: number, seed = 0): Pose => {
  const k = {...kneel(f), lean: 10, headTilt: 6 + Math.sin(f / 50 + seed)};
  let p = reachTo(k, 'R', {x: 40, y: -140});
  p = reachTo(p, 'L', {x: 86, y: -150});
  return p;
};

// ---- A-20 paper wave ------------------------------------------------------------------------
/** Waving a paper overhead (Chamberlain, Heston 1938).  Paper in holdR via <PaperSheet/>. */
export const paperWave = (f: number, seed = 0): Pose =>
  addPose(stand(f, seed), {shR: 118 + Math.sin(f / 4 + seed) * 10, elR: 40 + Math.sin(f / 4 + seed + 0.6) * 14, shL: 4, headTilt: -4});

/** Wave that stays clear of the big head (crowds, Leo waving to camera). */
export const waveSide = (f: number, seed = 0): Pose =>
  addPose(stand(f, seed), {shR: 112, elR: 45 + Math.sin(f / 3 + seed) * 28, headTilt: -3});

/** Crowd cheer that reads in profile: near arm up-forward, far arm up-back (a "V"), bouncing.
 *  (The original cheer() raises both arms straight up, where the big head hides them.) */
export const cheerV = (f: number, seed = 0): Pose =>
  pose({
    hipL: -8, hipR: 8,
    shL: 245 + Math.sin(f / 4 + seed) * 10, elL: -45,
    shR: 115 + Math.sin(f / 4 + seed + 1.5) * 10, elR: 45,
    bob: -Math.abs(Math.sin(f / 5 + seed)) * 12,
    headTilt: -6,
  });

// ---- A-21 seiza -----------------------------------------------------------------------------------
/** Kneeling on the heels, hands on the thighs, head bowed (listening). */
export const kneelSit = (f = 0, seed = 0): Pose => {
  const b = pose({lean: -2, hipL: 90, kneeL: 176, hipR: 87, kneeR: 172, bob: 98, headTilt: 12 + noise1(f / 80, seed) * 1.5});
  let p = reachTo(b, 'R', {x: 34, y: -16});
  p = reachTo(p, 'L', {x: 26, y: -16});
  return p;
};

// ---- A-24 binoculars ------------------------------------------------------------------------------
/** Raise binoculars to the eyes (t 0..1) and hold.  Draw with overlayTop: <Binoculars> at the eyes. */
export const binocularsPose = (f: number, t: number, seed = 0): Pose => {
  const base = stand(f, seed);
  const up = {...standStiff(f, seed), headTilt: -3};
  let pu = reachTo(up, 'R', {x: 50, y: -236});
  pu = reachTo(pu, 'L', {x: 56, y: -244});
  return mixPose(base, pu, smooth(t));
};

// ---- two-figure helpers (see interactions.tsx) -------------------------------------------------------
/** One side of a formal handshake.  t: 0 rest → 0.3 reach → 0.3–0.8 three stiff pumps → 1 released. */
export const handshake = (f: number, t: number, reachX = 78, seed = 0): Pose => {
  const base = standStiff(f, seed);
  const pump = t > 0.3 && t < 0.8 ? Math.sin(((t - 0.3) / 0.5) * Math.PI * 3) * 5 : 0;
  const k = t < 0.3 ? smooth(t / 0.3) : t > 0.8 ? 1 - smooth((t - 0.8) / 0.2) : 1;
  const out = reachTo({...base, lean: 3}, 'R', {x: reachX, y: -168 + pump});
  return mixPose(base, out, k);
};


// ===========================================================================
// Episode 2 (WW1) additions: A-01 … A-06 and A-S1 (asset-requests.md §A)
// ===========================================================================

/** A-01 Sophie: seated (car back seat) with a gentle wave that stays clear of the big head. */
export const seatedWave = (f: number, seed = 0): Pose =>
  ({...seated(f, seed), lean: 0, shR: 112, elR: 45 + Math.sin(f / 4 + seed) * 22, shL: 30, elL: 60, headTilt: -2});

/** A-03 orator: near fist raised up-forward (clear of the head), far arm gesturing, slight lean in.
 *  Combine with talking on the figure. */
export const orate = (f: number, seed = 0): Pose =>
  pose({
    lean: 6, hipL: -6, hipR: 8,
    shR: 122 + Math.sin(f / 7 + seed) * 8, elR: 52 + Math.sin(f / 7 + seed) * 10,
    shL: 38 + Math.sin(f / 10 + seed + 2) * 14, elL: 48,
    bob: Math.sin(f / 7 + seed) * 1.5,
    headTilt: -5 + noise1(f / 40, seed) * 2,
  });

/** A-S1: sitting on the ground, knees drawn up, arms wrapped round the shins, head level (staring).
 *  Pair with expression 'stare' and wrap in tremble(). */
export const hugKnees = (f = 0, seed = 0): Pose => {
  const b = {...sitGround(f, seed), lean: 10, hipL: 128, kneeL: 112, hipR: 132, kneeR: 116, bob: 104, headTilt: 1 + noise1(f / 90, seed) * 1};
  const sk = solveSkeleton(b);
  let p = reachTo(b, 'R', {x: sk.legR.kx - 4, y: sk.legR.ky + 26});
  p = reachTo(p, 'L', {x: sk.legL.kx - 10, y: sk.legL.ky + 22});
  return p;
};

/** A-S1 `tremble` modifier: tiny high-frequency jitter on the forearms and hands (≈2–3 px at the
 *  hand for amt = 1), with a faint knee/head shiver.  Works on top of ANY pose:
 *  pose={tremble(hugKnees(f), f)}.  amt 0..1.5 scales it (0 = off, use for a calm-down ramp). */
export const tremble = (base: Pose, f: number, amt = 1, seed = 0): Pose => {
  const j = (k: number) => (Math.sin(f * 2.3 + k * 1.7 + seed) * 0.6 + noise1(f * 0.9, seed + k) * 0.8) * amt;
  return addPose(base, {
    elL: j(1) * 3, elR: j(2) * 3,
    shL: j(3) * 1.4, shR: j(4) * 1.4,
    kneeL: j(5) * 0.8, kneeR: j(6) * 0.8,
    headTilt: j(7) * 0.5,
  });
};
