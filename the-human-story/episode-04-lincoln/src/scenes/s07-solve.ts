// s07 (War and emancipation): pure per-shot solvers for the shots with hand/seat/foot contacts.
// Drawn by S07.tsx and measured frame by frame by scripts/check-contacts.mjs (limit 3 px).
import {Pose, pose, stand, mixPose} from '../characters/poses';
import {headBowed} from '../characters/poses';
import {Placement, Pt, solveSkeleton, toWorld} from '../characters/skeleton';
import {clamp, kf, prog} from '../animations/core';
import {QUILL, gripWorld, handsOn, PropXf, approach, doorHandle} from '../kit/Props';
import {writeAt, exprAt, track, shakeHands} from '../kit/Actions';
import {seatHeight, seatPose, sitDown} from '../kit/Seats';
import {castBuild, castScale} from '../kit/Cast';
import './s07-cast';
import {T} from '../timeline';
import type {CamKey} from '../kit/Cinema';
import {walk04} from './reelSolve';
import {chk, seatChk, holdPose, HoldSpan, SHEET, linesNib, sf, Solved, Check} from './s06-solve';

// ---------------------------------------------------------------- 7.2 Willie's room at dawn
export const WILLIE_FLOOR = 900;
export function solveWillie(f: number): Solved {
  const id = 'abePres';
  const build = castBuild(id);
  const s = castScale(id);
  const pl: Placement = {x: 820, y: WILLIE_FLOOR, scale: s, dir: 1};
  const h = seatHeight(build, s);
  // slow breath; the head stays bowed
  const base = headBowed(seatPose(pl, h, build, f * 0.5, 31, {lean: 16 + Math.sin(f / 40) * 1.2, hipR: 86, headTilt: 10}), 1);
  const sk = solveSkeleton(base, build);
  const knee = toWorld(pl, {x: sk.legR.kx - 10, y: sk.legR.ky - 6});
  const knee2 = toWorld(pl, {x: sk.legR.kx - 26, y: sk.legR.ky - 4});
  const P = handsOn(pl, base, {R: knee, L: knee2}, build);
  return {
    figs: [{id, pl, P, build, ex: {expression: 'grief'}, noHat: true, eyesClosed: true}],
    checks: [chk('R knee', pl, P, 'R', knee, build), chk('L knee', pl, P, 'L', knee2, build)],
    seats: [seatChk(pl, P, build, WILLIE_FLOOR - h)], seatH: h,
    cam: [[0, 1.0, 960, 560], [400, 1.22, 1000, 600]] as CamKey[],
  };
}

// ---------------------------------------------------------------- 7.4 the Cabinet passes the draft
export const CAB_FLOOR = 900;
export const CAB_TABLE_TOP = CAB_FLOOR - 80;
type Member = {id: string; x: number; dir: 1 | -1; s?: number};
export const CABINET: Member[] = [
  {id: 'cabA', x: 560, dir: 1},
  {id: 'cabB', x: 790, dir: 1},
  {id: 'cabC', x: 1020, dir: 1},
  {id: 'abePres', x: 1268, dir: -1},
];
export function solveCabinet(f: number): Solved {
  const yR = CAB_FLOOR - 118; // reading height
  const yP = CAB_FLOOR - 124; // hand-over height
  const P0: PropXf = {x: 1228, y: yR - 20, rot: 4, s: 1};
  const p1: PropXf = {x: 1150, y: yP, rot: 0, s: 1};
  const rC: PropXf = {x: 1080, y: yR, rot: -4, s: 1};
  const p2: PropXf = {x: 914, y: yP, rot: 0, s: 1};
  const rB: PropXf = {x: 850, y: yR, rot: -4, s: 1};
  const p3: PropXf = {x: 688, y: yP, rot: 0, s: 1};
  const rA: PropXf = {x: 622, y: yR, rot: -4, s: 1};
  const xf = track(f, [[0, P0], [6, P0], [16, p1], [22, p1], [32, rC], [44, rC], [54, p2], [60, p2], [70, rB], [80, rB], [90, p3], [96, p3], [106, rA]]);
  const G = SHEET.grips;
  const spans: Record<string, HoldSpan[]> = {
    abePres: [{side: 'R', grip: G.grip2, a: -100, b: 20, ap: 10, label: 'Lincoln draft'}],
    cabC: [{side: 'R', grip: G.handle, a: 14, b: 46, label: 'C draft R'}, {side: 'L', grip: G.grip2, a: 36, b: 60, label: 'C draft L'}],
    cabB: [{side: 'R', grip: G.handle, a: 52, b: 80, label: 'B draft R'}, {side: 'L', grip: G.grip2, a: 70, b: 96, label: 'B draft L'}],
    cabA: [{side: 'R', grip: G.handle, a: 88, b: 1e9, label: 'A draft R'}, {side: 'L', grip: G.grip2, a: 104, b: 1e9, label: 'A draft L'}],
  };
  const figs = [];
  const checks: Check[] = [];
  const seats = [];
  let i = 0;
  for (const m of CABINET) {
    const build = castBuild(m.id);
    const s = castScale(m.id, m.s ?? 1);
    const pl: Placement = {x: m.x, y: CAB_FLOOR, scale: s, dir: m.dir};
    const h = seatHeight(build, s);
    const base = seatPose(pl, h, build, f, 40 + i, {lean: 10, hipR: 86});
    const out = holdPose(f, pl, base, build, xf, spans[m.id]);
    checks.push(...out.checks);
    seats.push(seatChk(pl, out.P, build, CAB_FLOOR - h));
    const holding = spans[m.id].some((sp) => f >= sp.a - 6 && f <= sp.b + 4);
    figs.push({id: m.id, pl, P: out.P, build, noHat: true, look: (holding ? [0.7, 0.8] : [0.8, 0.1]) as [number, number], ex: {expression: m.id === 'abePres' ? 'determined' : holding ? 'thinking' : 'neutral'}});
    i++;
  }
  return {figs, checks, seats, draft: xf, cam: [[0, 1.5, 1060, 690], [112, 1.62, 900, 690]] as CamKey[]};
}

// ---------------------------------------------------------------- 7.5a Lincoln signs (1 January 1863)
export const SIGN_FLOOR = 900;
export const SIGN_SLOPE = {x: 816, y: 718, w: 128, h: 80};
export function solveSign(f: number, d = 118): Solved {
  const id = 'abePres';
  const build = castBuild(id);
  const s = castScale(id);
  const pl: Placement = {x: 760, y: SIGN_FLOOR, scale: s, dir: 1};
  const h = seatHeight(build, s);
  const SL = SIGN_SLOPE;
  const u = prog(f, 22, d - 26, (t) => t);
  const writing = f >= 22 && f < d - 26;
  const nb = linesNib(SL.x + 40, SL.y + 62, SL.w - 56, 0, 1, u, f);
  const nib = writing ? nb : {x: nb.x, y: nb.y - 10};
  const lean = 10 + 22 * clamp((nib.x - SL.x) / SL.w);
  const base = seatPose(pl, h, build, f, 4, {lean, hipR: 86, headTilt: -4});
  const w = writeAt(f, pl, base, nib, build, writing);
  const q = w.props.quill;
  const steady = {x: SL.x + 6, y: SL.y + SL.h - 18};
  const P = handsOn(pl, w.P, {L: steady}, build);
  return {
    figs: [{id, pl, P, build, ex: exprAt(f, [[0, 'solemn'], [24, 'determined'], [d - 20, 'solemn']]), look: [0.8, 0.9], noHat: true}],
    checks: [chk('R quill', pl, P, 'R', gripWorld(q, QUILL.grips.handle!), build), chk('L page', pl, P, 'L', steady, build)],
    seats: [seatChk(pl, P, build, SIGN_FLOOR - h)], quill: q, u, seatH: h,
    cam: [[0, 1.25, 880, 650], [d, 2.3, SL.x + 60, SL.y + 40]] as CamKey[],
  };
}

// ---------------------------------------------------------------- 7.7 Douglass at the recruiting table
export const REC_FLOOR = 900;
export const RECRUIT_TABLE = {x: 1250, w: 240, h: 100};
export function solveRecruit(f: number, d = 278): Solved {
  const id = 'douglass1863';
  const build = castBuild(id);
  const s = castScale(id);
  const pl: Placement = {x: 1430, y: REC_FLOOR, scale: s, dir: -1};
  const h = seatHeight(build, s);
  const SL = {x: pl.x - 128, y: REC_FLOOR - 166, w: 84, h: 56};
  // writes in the enlistment ledger in two bursts, looks up at the recruit between
  const burst = (a: number, b: number) => prog(f, a, b, (t) => t);
  // Phase D2: the second burst runs to 27 frames before the shot ends (it was fixed at 250 of 277), so he is not left idle
  const u = 0.5 * burst(20, 110) + 0.5 * burst(170, d - 27);
  const writing = (f >= 20 && f < 110) || (f >= 170 && f < d - 27);
  const nb = linesNib(SL.x + SL.w - 10, SL.y + 16, -(SL.w - 22), 13, 3, u, f);
  const nib = writing ? nb : {x: nb.x, y: nb.y - 10};
  const lean = 12 + 16 * clamp((pl.x - nib.x - 40) / SL.w);
  const base = seatPose(pl, h, build, f, 51, {lean, hipR: 86, headTilt: writing ? 6 : -4});
  const w = writeAt(f, pl, base, nib, build, writing);
  const q = w.props.quill;
  const steady = {x: SL.x + SL.w - 6, y: SL.y + SL.h - 10};
  const P = handsOn(pl, w.P, {L: steady}, build);
  // the recruit stands at the table; the next men wait in line
  const rpl: Placement = {x: 1060, y: REC_FLOOR, scale: castScale('recruit'), dir: 1};
  return {
    figs: [
      {id, pl, P, build, ex: exprAt(f, [[0, 'determined'], [112, 'hopeful'], [168, 'determined']]), look: writing ? [-0.8, 0.8] as [number, number] : [-0.9, -0.2] as [number, number], tag: f > sf(T('Frederick Douglass recruited') - T('It also opened the army')) && f < d - 4},
      {id: 'recruit', pl: rpl, P: stand(f, 52), ex: {expression: 'determined'}, look: [0.9, 0.3] as [number, number]},
    ],
    checks: [chk('R quill', pl, P, 'R', gripWorld(q, QUILL.grips.handle!), build), chk('L ledger', pl, P, 'L', steady, build)],
    seats: [seatChk(pl, P, build, REC_FLOOR - h)], quill: q, slope: SL, u, seatH: h,
    cam: [[0, 1.0, 760, 560], [70, 1.0, 820, 560], [150, 1.45, 1180, 640], [d, 1.55, 1200, 640]] as CamKey[],
  };
}

// ---------------------------------------------------------------- 7.9 10 August 1863: the door and the handshake
export const DOOR_FLOOR = 900;
export const DOOR_X = 700;
export const DOOR_S = 1.55;
export function solveMeeting(f: number): Solved {
  const aId = 'abePres';
  const bId = 'douglass1863';
  const bA = castBuild(aId);
  const bB = castBuild(bId);
  const angle = kf(f, [[0, 0], [12, 0], [40, 72], [400, 72]]);
  const handle = doorHandle(DOOR_X, DOOR_FLOOR, angle, DOOR_S);
  const wA = walk04(f, 46, 80, 2.2, bA, 0.2);
  const plA: Placement = {x: 760 + wA.d, y: DOOR_FLOOR, scale: castScale(aId), dir: 1};
  const wB = walk04(f, 54, 68, 1.6, bB, 0.6);
  const plB: Placement = {x: 1120 - wB.d, y: DOOR_FLOOR, scale: castScale(bId), dir: -1};
  const baseA0 = f < 46 ? stand(f, 61) : wA.P;
  const baseB0 = f < 54 ? stand(f, 62) : wB.P;
  // Lincoln opens the door from inside with his near hand
  let PA = baseA0;
  let checks: Check[] = [];
  const grab = 6;
  const release = 42;
  const gripP = handsOn(plA, baseA0, {R: handle}, bA);
  let uu = 1;
  if (f < grab) uu = clamp(1 - (grab - f) / 6);
  else if (f > release) uu = clamp(1 - (f - release) / 10);
  PA = approach(baseA0, gripP, uu);
  if (f >= grab && f <= release) checks.push(chk('Lincoln door', plA, PA, 'R', handle, bA));
  const baseA = f < 106 ? PA : mixPose(baseA0, pose({lean: 10, hipL: -6, hipR: 6}), prog(f, 100, 114));
  const baseB = mixPose(baseB0, pose({lean: 8, hipL: -6, hipR: 6}), prog(f, 92, 106));
  let PB = baseB;
  if (f >= 100) PA = baseA;
  const meet = {x: (plA.x + plB.x) / 2, y: DOOR_FLOOR - 176};
  const start = 116;
  const end = 160;
  if (f >= start - 14) {
    const sh = shakeHands(f, plA, baseA, plB, baseB, meet, start, bA, bB);
    if (f <= end) {
      PA = sh.PA;
      PB = sh.PB;
      if (f >= start) checks = [chk('Lincoln hand', plA, PA, 'R', sh.meet, bA), chk('Douglass hand', plB, PB, 'R', sh.meet, bB)];
    } else {
      const u = clamp((f - end) / 12);
      PA = approach(baseA, sh.PA, 1 - u);
      PB = approach(baseB, sh.PB, 1 - u);
    }
  }
  return {
    figs: [
      {id: aId, pl: plA, P: PA, build: bA, ex: exprAt(f, [[0, 'neutral'], [30, 'curious'], [70, 'determined'], [130, 'solemn']]), noHat: true, look: [0.8, 0]},
      {id: bId, pl: plB, P: PB, build: bB, ex: exprAt(f, [[0, 'determined'], [110, 'solemn'], [150, 'determined']]), look: [-0.8, -0.2]},
    ],
    checks, seats: [], angle, handle, insideA: f < 46,
    cam: [[0, 1.3, 920, 640], [60, 1.35, 960, 640], [120, 1.7, (plA.x + plB.x) / 2, 620], [180, 1.75, (plA.x + plB.x) / 2, 620]] as CamKey[],
  };
}

export const solveTimes07 = () => ({
  willie: sf(T('In August he wrote publicly') - T('his son Willie died')),
  cabinet: sf(T('On the first of January') - T('shown his Cabinet a draft')),
  sign: sf(T('the Emancipation Proclamation declared') - T('On the first of January')),
  recruit: sf(T('In July the Union won') - T('It also opened the army')),
  meeting: sf(T('In November, Lincoln helped') - T('That August')),
});
export const SOLVERS07: Record<string, {dur: () => number; solve: (f: number) => Solved}> = {
  's07-willie': {dur: () => solveTimes07().willie, solve: solveWillie},
  's07-cabinet': {dur: () => solveTimes07().cabinet, solve: solveCabinet},
  's07-sign': {dur: () => solveTimes07().sign, solve: (f) => solveSign(f, solveTimes07().sign)},
  's07-recruit': {dur: () => solveTimes07().recruit, solve: (f) => solveRecruit(f, solveTimes07().recruit)},
  's07-meeting': {dur: () => solveTimes07().meeting, solve: solveMeeting},
};
export type {Pt};
// for scripts/check-contacts.mjs
export const S07_SHOTS = Object.entries(SOLVERS07).map(([id, s]) => ({id, dur: s.dur()}));
export const S07_SOLVERS: Record<string, (f: number) => Solved> = Object.fromEntries(Object.entries(SOLVERS07).map(([id, s]) => [id, s.solve]));
export const camZoom = (cam: CamKey[], f: number) => kf(f, cam.map((k) => [k[0], k[1]] as [number, number]));
