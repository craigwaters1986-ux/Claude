// s06 (President of a breaking country): pure per-shot solvers for the shots with hand/seat contacts.
// Drawn by S06.tsx and measured frame by frame by scripts/check-contacts.mjs (limit 3 px).
// Also exports the small generic helpers that s07-solve.ts reuses (hold schedules on a moving prop).
import {Pose, pose, stand, mixPose} from '../characters/poses';
import {Build, Placement, Pt, handWorld, solveSkeleton} from '../characters/skeleton';
import {clamp, easeInOut, kf, prog} from '../animations/core';
import {QUILL, gripWorld, handsOn, PropXf} from '../kit/Props';
import {writeAt, exprAt, track, localXf} from '../kit/Actions';
import {seatHeight, seatPose, hipWorldY, feetWorld} from '../kit/Seats';
import {castBuild, castScale} from '../kit/Cast';
import {T, FPS} from '../timeline';
import type {CamKey} from '../kit/Cinema';
import type {Fig, Solved, Check, SeatCheck} from './reelSolve';

export type {Fig, Solved, Check, SeatCheck};
export const sf = (s: number) => Math.round(s * FPS);

// ---------------------------------------------------------------- shared helpers
export const chk = (label: string, pl: Placement, P: Pose, side: 'L' | 'R', grip: Pt, build?: Build): Check => ({label, hand: handWorld(pl, P, side, build), grip});
export const seatChk = (pl: Placement, P: Pose, build: Build, seatY: number): SeatCheck => ({x: pl.x, hipY: hipWorldY(pl, P, build), seatY, feet: feetWorld(pl, P, build), floor: pl.y});

/** A sheet of paper as a prop (drawn in s06-sets): 72 x 96 local px, centred; grips at the side edges. */
export const SHEET = {w: 72, h: 96, grips: {handle: {x: -34, y: 6}, grip2: {x: 34, y: 6}}};

/** One hand holding a prop grip from frame a to b; the hand approaches/leaves over `ap` frames. */
export type HoldSpan = {side: 'L' | 'R'; grip: Pt; a: number; b: number; ap?: number; label: string};
/** Applies hold spans to a base pose: each arm blends towards its grip target. Returns the pose and the
 *  contacts that must hold (frames a..b). */
export function holdPose(f: number, pl: Placement, base: Pose, build: Build, xf: PropXf, spans: HoldSpan[]): {P: Pose; checks: Check[]} {
  let P = base;
  const checks: Check[] = [];
  for (const s of spans) {
    const ap = s.ap ?? 8;
    const u = f < s.a ? clamp(1 - (s.a - f) / ap) : f > s.b ? clamp(1 - (f - s.b) / ap) : 1;
    if (u <= 0) continue;
    const target = gripWorld(xf, s.grip);
    const g = handsOn(pl, P, {[s.side]: target}, build);
    const k = easeInOut(u);
    P = s.side === 'R' ? {...P, shR: P.shR + (g.shR - P.shR) * k, elR: P.elR + (g.elR - P.elR) * k} : {...P, shL: P.shL + (g.shL - P.shL) * k, elL: P.elL + (g.elL - P.elL) * k};
    if (f >= s.a && f <= s.b) checks.push(chk(s.label, pl, P, s.side, target, build));
  }
  return {P, checks};
}

/** Writing lines of (illegible) handwriting on a page: nib position for progress u over `n` lines. */
export function linesNib(x0: number, y0: number, w: number, gap: number, n: number, u: number, f: number): Pt {
  const c = clamp(u) * n;
  const i = Math.min(n - 1, Math.floor(c));
  const k = c - i;
  return {x: x0 + w * k + Math.sin(f * 2.3) * 1.5, y: y0 + i * gap - 3 - Math.abs(Math.sin(f * 1.15)) * 6};
}

// ---------------------------------------------------------------- 6.2a Grace Bedell writes
export const GRACE_FLOOR = 900;
export const GRACE_SLOPE = {x: 0, y: 0, w: 66, h: 50};
export function solveGrace(f: number, d = 108): Solved {
  const id = 'grace';
  const build = castBuild(id);
  const s = castScale(id, 1.35);
  const pl: Placement = {x: 860, y: GRACE_FLOOR, scale: s, dir: 1};
  const h = seatHeight(build, s);
  const tableTop = GRACE_FLOOR - 92;
  const SL = {x: pl.x + 34, y: tableTop - 56, w: 62, h: 46};
  const u = prog(f, 8, d - 18, (t) => t);
  const writing = f >= 8 && f < d - 18;
  const nib = linesNib(SL.x + 8, SL.y + 14, SL.w - 16, 12, 3, u, f);
  const lean = 4 + 12 * clamp((nib.x - SL.x) / SL.w);
  const base = seatPose(pl, h, build, f, 21, {lean, hipR: 86, headTilt: -4});
  const w = writeAt(f, pl, base, writing ? nib : {x: nib.x, y: nib.y - 8}, build, writing);
  const steady = {x: SL.x + 6, y: SL.y + SL.h - 10};
  const P = handsOn(pl, w.P, {L: steady}, build);
  const q = w.props.quill;
  const checks = [chk('R quill', pl, P, 'R', gripWorld(q, QUILL.grips.handle!), build), chk('L page', pl, P, 'L', steady, build)];
  const ex = exprAt(f, [[0, 'thinking'], [30, 'determined'], [80, 'hopeful']]);
  return {
    figs: [{id, pl, P, build, ex, look: [0.8, 0.9], tag: f > 6 && f < d - 6}],
    checks, seats: [seatChk(pl, P, build, GRACE_FLOOR - h)], quill: q, slope: SL, u, tableTop, seatH: h,
    cam: [[0, 1.55, 930, 700], [d * 0.6, 1.75, 940, 690], [d, 2.6, SL.x + 30, SL.y + 20]] as CamKey[],
  };
}

// ---------------------------------------------------------------- 6.2b the letter on Lincoln's desk; the beard
export const LETTER_FLOOR = 900;
export const LETTER_DESK = {x: 1010, w: 300, h: 104};
export function letterTimes() {
  const at = T('wrote to him about a beard');
  const swap = sf(T('he became the first President') - at) - 6;
  const d = sf(T('In November he won') - at);
  return {at, swap, d};
}
export function solveLetter(f: number): Solved {
  const {swap, d} = letterTimes();
  const id = f < swap ? 'abe1858' : 'abePres';
  const build = castBuild('abe1858');
  const s = castScale('abe1858');
  const pl: Placement = {x: 860, y: LETTER_FLOOR, scale: s, dir: 1};
  const h = seatHeight(build, s);
  const deskTop = LETTER_FLOOR - LETTER_DESK.h;
  const grab = 40;
  const base = seatPose(pl, h, build, f, 23, {lean: kf(f, [[0, 6], [grab - 16, 6], [grab, 24], [grab + 28, 6]]), hipR: 86, headTilt: 4});
  const sk = solveSkeleton(base, build);
  const read = localXf(pl, {x: sk.sh.x + 58, y: sk.sh.y + 22 + Math.sin(f / 28) * 1.2}, -4);
  const rest: PropXf = {x: 935, y: deskTop - 3, rot: 0, s};
  const low = localXf(pl, {x: sk.sh.x + 42, y: sk.sh.y + 54}, -10);
  const xf = track(f, [[grab, rest], [grab + 8, {...rest, y: rest.y - 12}], [grab + 30, read], [swap + 8, read], [swap + 30, low], [d, low]]);
  const flat = 1 - prog(f, grab + 2, grab + 22);
  const spans: HoldSpan[] = [
    {side: 'R', grip: SHEET.grips.grip2, a: grab, b: 1e9, ap: 12, label: 'R letter'},
    {side: 'L', grip: SHEET.grips.handle, a: grab + 26, b: 1e9, ap: 10, label: 'L letter'},
  ];
  // the near hand goes to the far edge of the flat sheet first (grip2 on the desk side)
  const out = holdPose(f, pl, base, build, xf, spans);
  const ex = exprAt(f, [[0, 'neutral'], [grab - 10, 'curious'], [grab + 40, 'thinking'], [swap, 'thinking'], [swap + 30, 'hopeful']]);
  const look: [number, number] = f < grab ? [0.9, 0.9] : [0.7, 0.5];
  return {
    figs: [{id, pl, P: out.P, build, ex, look, noHat: true}],
    checks: out.checks, seats: [seatChk(pl, out.P, build, LETTER_FLOOR - h)], letter: xf, flat, deskTop, seatH: h, read,
    cam: [
      [0, 3.4, rest.x, rest.y - 10], [34, 1.3, 960, 640], [grab + 40, 1.42, 950, 640],
      [swap - 16, 6.2, read.x, read.y], [swap + 6, 6.2, read.x, read.y], [swap + 44, 2.0, 920, 640], [d, 2.2, 910, 630],
    ] as CamKey[],
  };
}

export const SOLVERS06: Record<string, {dur: () => number; solve: (f: number) => Solved}> = {
  's06-grace': {dur: () => sf(T('wrote to him about a beard') - T('That October')), solve: (f) => solveGrace(f, sf(T('wrote to him about a beard') - T('That October')))},
  's06-letter': {dur: () => letterTimes().d, solve: solveLetter},
};
export {kf, mixPose, stand, pose};
// for scripts/check-contacts.mjs
export const S06_SHOTS = Object.entries(SOLVERS06).map(([id, s]) => ({id, dur: s.dur()}));
export const S06_SOLVERS: Record<string, (f: number) => Solved> = Object.fromEntries(Object.entries(SOLVERS06).map(([id, s]) => [id, s.solve]));
export const camZoom = (cam: CamKey[], f: number) => kf(f, cam.map((k) => [k[0], k[1]] as [number, number]));
