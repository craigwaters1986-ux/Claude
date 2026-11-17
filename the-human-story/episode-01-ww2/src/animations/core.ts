// Core animation maths: easing, keyframes, deterministic noise.
import {Easing} from 'remotion';

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = Easing.inOut(Easing.cubic);
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeBack = Easing.out(Easing.back(1.6));

/** Progress 0..1 between frames a and b (eased). */
export const prog = (f: number, a: number, b: number, ease: (t: number) => number = easeInOut) =>
  ease(clamp((f - a) / Math.max(1, b - a)));

/**
 * Keyframe interpolation.  kf(frame, [[0, 0], [30, 100], [60, 50]])
 * Values may be numbers or number arrays (interpolated element-wise).
 */
export function kf(f: number, keys: [number, number][], ease: (t: number) => number = easeInOut): number {
  if (keys.length === 0) return 0;
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i];
    const [f1, v1] = keys[i + 1];
    if (f <= f1) return lerp(v0, v1, ease(clamp((f - f0) / Math.max(1e-6, f1 - f0))));
  }
  return keys[keys.length - 1][1];
}

/** Fade in at a..a+d, fade out at b-d..b */
export const fadeInOut = (f: number, a: number, b: number, d = 10) =>
  Math.min(prog(f, a, a + d, easeOut), 1 - prog(f, b - d, b, easeIn));

// Deterministic pseudo-random numbers (mulberry32)
export function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Smooth 1D value noise in -1..1 */
export function noise1(x: number, seed = 0) {
  const i = Math.floor(x);
  const fr = x - i;
  const a = hash(i + seed * 1013);
  const b = hash(i + 1 + seed * 1013);
  const t = fr * fr * (3 - 2 * fr);
  return (a + (b - a) * t) * 2 - 1;
}

/** Hand-drawn wobble: tiny jitter that changes ~8 times a second (boiling line effect). */
export const boil = (f: number, seed: number, amp = 1) => {
  const step = Math.floor(f / 4);
  return (hash(step * 7.13 + seed * 3.7) - 0.5) * 2 * amp;
};

export const deg = (d: number) => (d * Math.PI) / 180;
