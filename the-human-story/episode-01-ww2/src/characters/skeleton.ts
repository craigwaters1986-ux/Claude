// Skeleton maths shared by StickFigure, two-figure interactions, props and IK.
// Local figure space: origin on the ground line between the feet, y down,
// +x = the direction the figure faces (before `dir` mirroring and `scale`).
import type {Pose} from './poses';

export type Pt = {x: number; y: number};

export type Dims = {L: number; T: number; R: number; UA: number; FA: number};
export const ADULT: Dims = {L: 108, T: 88, R: 44, UA: 48, FA: 45};
export const CHILD: Dims = {L: 74, T: 58, R: 42, UA: 34, FA: 32};
export const dimsOf = (child?: boolean) => (child ? CHILD : ADULT);

export type Arm = {ex: number; ey: number; hx: number; hy: number; ang: number};
export type Leg = {kx: number; ky: number; fx: number; fy: number};

export type Skeleton = {
  d: Dims;
  hip: Pt;
  neck: Pt;
  sh: Pt;
  head: Pt; // head centre
  armL: Arm; // far arm
  armR: Arm; // near arm
  legL: Leg;
  legR: Leg;
};

const rad = (d: number) => (d * Math.PI) / 180;
const degs = (r: number) => (r * 180) / Math.PI;

export function solveSkeleton(P: Pose, child?: boolean): Skeleton {
  const d = dimsOf(child);
  const {L, T, R, UA, FA} = d;
  const hip = {x: 0, y: -L + P.bob};
  const leg = (hipA: number, knee: number): Leg => {
    const a = rad(hipA);
    const kx = hip.x + Math.sin(a) * L * 0.52;
    const ky = hip.y + Math.cos(a) * L * 0.52;
    const b = rad(hipA - knee);
    return {kx, ky, fx: kx + Math.sin(b) * L * 0.5, fy: ky + Math.cos(b) * L * 0.5};
  };
  const lean = rad(P.lean);
  const neck = {x: hip.x + Math.sin(lean) * T, y: hip.y - Math.cos(lean) * T};
  const sh = {x: hip.x + Math.sin(lean) * T * 0.88, y: hip.y - Math.cos(lean) * T * 0.88};
  const arm = (shA: number, el: number): Arm => {
    const a = rad(shA);
    const ex = sh.x + Math.sin(a) * UA;
    const ey = sh.y + Math.cos(a) * UA;
    const b = rad(shA + el);
    return {ex, ey, hx: ex + Math.sin(b) * FA, hy: ey + Math.cos(b) * FA, ang: shA + el};
  };
  const head = {x: neck.x + Math.sin(lean) * R * 0.9, y: neck.y - Math.cos(lean) * R * 0.9 - 2};
  return {d, hip, neck, sh, head, armL: arm(P.shL, P.elL), armR: arm(P.shR, P.elR), legL: leg(P.hipL, P.kneeL), legR: leg(P.hipR, P.kneeR)};
}

/**
 * Two-bone arm IK.  Returns {sh, el} angles (pose convention) that put the hand on
 * `target` (local figure space).  `elbowDown` picks the natural elbow bend
 * (elbowDown = the lower of the two elbow solutions, false = raised elbow); out-of-reach targets give a straight arm pointing at them.
 */
export function armIK(P: Pose, target: Pt, child?: boolean, elbowDown = true): {sh: number; el: number} {
  const s = solveSkeleton(P, child);
  const {UA, FA} = s.d;
  const dx = target.x - s.sh.x;
  const dy = target.y - s.sh.y;
  const dist = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(UA - FA) + 1), UA + FA - 0.5);
  const theta = degs(Math.atan2(dx, dy)); // angle from "hanging down", + = forward
  const cosA = (UA * UA + dist * dist - FA * FA) / (2 * UA * dist);
  const alpha = degs(Math.acos(Math.max(-1, Math.min(1, cosA))));
  // two solutions; pick the one whose elbow is lower (elbowDown) or higher
  const c1 = theta + alpha;
  const c2 = theta - alpha;
  const lower = Math.cos(rad(c1)) >= Math.cos(rad(c2)) ? c1 : c2;
  const sh = elbowDown ? lower : lower === c1 ? c2 : c1;
  const ex = s.sh.x + Math.sin(rad(sh)) * UA;
  const ey = s.sh.y + Math.cos(rad(sh)) * UA;
  const tx = s.sh.x + (dx / Math.max(1e-6, Math.hypot(dx, dy))) * dist;
  const ty = s.sh.y + (dy / Math.max(1e-6, Math.hypot(dx, dy))) * dist;
  const fore = degs(Math.atan2(tx - ex, ty - ey));
  let el = fore - sh;
  while (el > 180) el -= 360;
  while (el < -180) el += 360;
  return {sh, el};
}

/** Returns a copy of P with one arm (R = near, L = far) reaching for a local-space target. */
export function reach(P: Pose, side: 'L' | 'R', target: Pt, child?: boolean, elbowDown = true): Pose {
  const {sh, el} = armIK(P, target, child, elbowDown);
  return side === 'R' ? {...P, shR: sh, elR: el} : {...P, shL: sh, elL: el};
}

/** Figure placement as used by <StickFigure x y scale dir>. */
export type Placement = {x: number; y: number; scale?: number; dir?: 1 | -1};

export const toWorld = (pl: Placement, p: Pt): Pt => ({x: pl.x + p.x * (pl.scale ?? 1) * (pl.dir ?? 1), y: pl.y + p.y * (pl.scale ?? 1)});
export const toLocal = (pl: Placement, p: Pt): Pt => ({x: (p.x - pl.x) / ((pl.scale ?? 1) * (pl.dir ?? 1)), y: (p.y - pl.y) / (pl.scale ?? 1)});

/** World position (and forearm angle in world degrees, 0 = pointing right) of a hand. */
export function handWorld(pl: Placement, P: Pose, side: 'L' | 'R', child?: boolean): Pt & {angle: number} {
  const s = solveSkeleton(P, child);
  const a = side === 'R' ? s.armR : s.armL;
  const w = toWorld(pl, {x: a.hx, y: a.hy});
  const local = 90 - a.ang; // SVG rotation of the forearm in local space
  return {...w, angle: (pl.dir ?? 1) === 1 ? local : 180 - local};
}

/** World shoulder point — attach parachute rigging lines (V-02) here. */
export function shoulderWorld(pl: Placement, P: Pose, child?: boolean): Pt {
  return toWorld(pl, solveSkeleton(P, child).sh);
}

/** World head centre and radius (useful for speech bubbles, hats flying off, etc.). */
export function headWorld(pl: Placement, P: Pose, child?: boolean): Pt & {r: number} {
  const s = solveSkeleton(P, child);
  return {...toWorld(pl, s.head), r: s.d.R * (pl.scale ?? 1)};
}
