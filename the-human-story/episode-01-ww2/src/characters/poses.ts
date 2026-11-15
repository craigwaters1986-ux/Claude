// Skeletal pose library for stick figures.  All angles are in degrees.
//  hip*: thigh swing from vertical (+ = forward)      knee*: knee bend (+ = shin swings back)
//  sh*:  arm swing from hanging down (+ = forward/up)  el*:  elbow bend (+ = forearm further forward/up)
import {noise1} from '../animations/core';

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
