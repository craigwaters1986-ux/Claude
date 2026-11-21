// s01 "Two minutes": pure per-shot solvers for the figure shots (1.1 writing the Bliss copy, 1.4 the quill
// is laid down). Used by S01.tsx to draw and by scripts/check-contacts.mjs to measure every frame.
// Same study geometry as the approved test reel (reelSolve.solveWrite) so the writing hand stays on the nib.
import {Pose} from '../characters/poses';
import {Build, Placement, Pt, handWorld} from '../characters/skeleton';
import {clamp, kf, prog} from '../animations/core';
import {QUILL, gripWorld, handsOn, approach, PropXf} from '../kit/Props';
import {writeAt, exprAt, track} from '../kit/Actions';
import {seatHeight, seatPose, hipWorldY, feetWorld} from '../kit/Seats';
import {layoutDoc, nibAt, doc, Layout} from '../kit/Documents';
import {castBuild, castScale} from '../kit/Cast';
import type {CamKey} from '../kit/Cinema';
import type {Solved, Check, SeatCheck} from './reelSolve';

export const S01_FLOOR = 900;
export const S01_SLOPE = {x: 816, y: 712, w: 128, h: 86};
export const S01_DESK = {x: 1000, w: 320, h: 100};
const ID = 'abePres';

const chk = (label: string, pl: Placement, P: Pose, side: 'L' | 'R', grip: Pt, build: Build): Check => ({label, hand: handWorld(pl, P, side, build), grip});
const seatChk = (pl: Placement, P: Pose, build: Build, seatY: number): SeatCheck => ({x: pl.x, hipY: hipWorldY(pl, P, build), seatY, feet: feetWorld(pl, P, build), floor: pl.y});

/** The opening of the Bliss copy (exact, documents.json), four words a line on the writing slope. */
export function blissLayout(): Layout {
  const d = doc('bliss');
  const first = d.text.split('\n')[0];
  return layoutDoc(first, d.hand, 15, S01_SLOPE.w - 20, S01_SLOPE.x + 10, S01_SLOPE.y + 22, 1.3, 4);
}
/** Characters of the first line "Four score and seven years ago our fathers" as a share of the layout. */
const FIRST = 'Four score and seven years ago our fathers'.length;

function base(f: number) {
  const build = castBuild(ID);
  const s = castScale(ID);
  const pl: Placement = {x: 760, y: S01_FLOOR, scale: s, dir: 1};
  const h = seatHeight(build, s);
  return {build, s, pl, h};
}

// ---------------------------------------------------------------- 1.1 ECU: the first line writes on
export const S11_LEN = 200; // frames (0 → just past the 1.2 cut)
export function solve11(f: number): Solved {
  const {build, pl, h} = base(f);
  const L = blissLayout();
  const uEnd = FIRST / L.chars;
  const u = prog(f, 12, 182, (t) => t) * uEnd;
  const writing = f >= 12 && f < 182;
  const nb = nibAt(L, u);
  const nib = {x: nb.x + (writing ? Math.sin(f * 2.1) * 1.4 : 0), y: nb.y - 4 - (writing ? Math.abs(Math.sin(f * 1.3)) * 7 : 6)};
  const SL = S01_SLOPE;
  const lean = 8 + 24 * clamp((nib.x - SL.x) / SL.w) + 6 * clamp((nib.y - SL.y) / SL.h);
  const b = seatPose(pl, h, build, f, 4, {lean, hipR: 86, headTilt: -4});
  const w = writeAt(f, pl, b, nib, build, writing);
  const q = w.props.quill;
  const steady = {x: SL.x + 6, y: SL.y + SL.h - 16};
  const P = handsOn(pl, w.P, {L: steady}, build);
  // camera: ECU that travels with the line being written (keys every 6 frames, smoothed nib x)
  const cam: CamKey[] = [];
  for (let g = 0; g <= S11_LEN; g += 6) {
    const ug = prog(g, 12, 182, (t) => t) * uEnd;
    const n = nibAt(L, Math.max(0, ug - 0.04));
    const z = 4.2 + 1.0 * prog(g, 0, 70);
    cam.push([g, z, n.x + 40, n.y + 18]);
  }
  const ex = exprAt(f, [[0, 'thinking'], [30, 'determined']]);
  return {
    figs: [{id: ID, pl, P, build, ex, look: [0.8, 0.9], noHat: true}],
    checks: [chk('R quill', pl, P, 'R', gripWorld(q, QUILL.grips.handle!), build), chk('L page', pl, P, 'L', steady, build)],
    seats: [seatChk(pl, P, build, S01_FLOOR - h)],
    quill: q, layout: L, reveal: u, seatH: h, cam,
  };
}

// ---------------------------------------------------------------- 1.4 MCU: the quill is laid down
export const S14_LEN = 130; // figure part (the title dissolve follows inside the same shot)
export const QUILL_REST: PropXf = {x: 902, y: 797, rot: 37, s: 0};
export function solve14(f: number): Solved {
  const {build, s, pl, h} = base(f);
  const L = blissLayout();
  const SL = S01_SLOPE;
  const done = FIRST / L.chars;
  const nb = nibAt(L, done);
  const hover: PropXf = {x: nb.x + 4, y: nb.y - 12, rot: 0, s: s * 0.9};
  const rest: PropXf = {...QUILL_REST, s: s * 0.9};
  const q = track(f, [[0, hover], [18, hover], [34, {...hover, x: hover.x + 14, y: hover.y + 24, rot: 20}], [52, {...rest, y: rest.y - 6}], [58, rest]]);
  const g = gripWorld(q, QUILL.grips.handle!);
  const lean = kf(f, [[0, 26], [26, 36], [62, 36], [104, 14], [130, 8]]);
  const b = seatPose(pl, h, build, f, 4, {lean, hipR: 86, headTilt: -4 + 6 * prog(f, 60, 110)});
  const grip = handsOn(pl, b, {R: g}, build);
  const release = 60;
  const P0 = f <= release ? grip : approach(b, grip, 1 - clamp((f - release) / 18));
  const steady = {x: SL.x + 6, y: SL.y + SL.h - 16};
  const leave = 84;
  const Ps = handsOn(pl, P0, {L: steady}, build);
  const P = f <= leave ? Ps : approach(P0, Ps, 1 - clamp((f - leave) / 20));
  const checks: Check[] = [];
  if (f <= release) checks.push(chk('R quill', pl, P, 'R', g, build));
  if (f <= leave) checks.push(chk('L page', pl, P, 'L', steady, build));
  const ex = exprAt(f, [[0, 'determined'], [40, 'thinking'], [96, 'solemn']]);
  return {
    figs: [{id: ID, pl, P, build, ex, look: f < 70 ? [0.8, 0.9] : [0.5, 0.4], noHat: true}],
    checks, seats: [seatChk(pl, P, build, S01_FLOOR - h)],
    quill: q, layout: L, done, seatH: h,
    cam: [[0, 2.9, 830, 690], [60, 3.0, 830, 680], [130, 3.3, 815, 665]],
  };
}

export const S01_SHOTS = [
  {id: 's01-1.1', dur: S11_LEN},
  {id: 's01-1.4', dur: S14_LEN},
] as const;
export const S01_SOLVERS: Record<string, (f: number) => Solved> = {'s01-1.1': solve11, 's01-1.4': solve14};
export const camZoom = (cam: CamKey[], f: number) => kf(f, cam.map((k) => [k[0], k[1]] as [number, number]));
