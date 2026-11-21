// Chapter 2 "A cabin in Kentucky": pure per-shot solvers (poses, props, camera, contact checks).
// Drawn by S02.tsx and measured frame by frame by scripts/check-contacts.mjs.
import {Pose, pose, stand, mixPose} from '../characters/poses';
import {Build, Placement, Pt, handWorld, headWorld, solveSkeleton, toWorld} from '../characters/skeleton';
import {parishWalk} from '../characters/parishWalk';
import {clamp, easeIn, easeInOut, kf, lerp, prog} from '../animations/core';
import {BOOK, gripWorld, handsOn, approach, PropXf, PropDef} from '../kit/Props';
import {grabCarry, pageTurn, exprAt, track, localXf} from '../kit/Actions';
import {seatHeight, seatPose, sitDown, hipWorldY, feetWorld} from '../kit/Seats';
import {castBuild, castScale} from '../kit/Cast';
import {T, TE, sectionWindow, FPS} from '../timeline';
import type {CamKey} from '../kit/Cinema';
import type {Fig, Solved, Check, SeatCheck} from './reelSolve';
import {SHORT_AXE, PLANE, BUNDLE, WAGON} from './s02-parts';

export type {Fig, Solved};
const D2R = Math.PI / 180;

export const chk = (label: string, pl: Placement, P: Pose, side: 'L' | 'R', grip: Pt, build?: Build): Check => ({label, hand: handWorld(pl, P, side, build), grip});
export const seatChk = (pl: Placement, P: Pose, build: Build, seatY: number): SeatCheck => ({x: pl.x, hipY: hipWorldY(pl, P, build), seatY, feet: feetWorld(pl, P, build), floor: pl.y});

// ---------------------------------------------------------------- shot times (programme seconds)
const [S, E] = sectionWindow('s02');
export const AT02 = {
  cabin: S, // 2.1 title plate in beat 0, then the winter cabin
  family: T("his father's farm") + 1.0, // 2.2
  map: T('the family moved to Indiana'), // 2.3
  chop: T('An axe was put'), // 2.4
  grave: T('An axe was put') + 6.0, // 2.5 (dip) over the silent beat, before "his mother died"
  arrive: T('His stepmother') + 1.06, // 2.6 wagon and the book
  read: T('He wrote of himself') + 1.6, // 2.6 reading by firelight
  end: E,
};
const ORDER = ['cabin', 'family', 'map', 'chop', 'grave', 'arrive', 'read'] as const;
export const DUR02: Record<string, number> = Object.fromEntries(ORDER.map((k, i) => [k, Math.round(((i + 1 < ORDER.length ? AT02[ORDER[i + 1]] : AT02.end) - AT02[k]) * FPS)]));
export const lf = (t: number, shot: keyof typeof AT02) => Math.round((t - AT02[shot]) * FPS);
void TE;

// ---------------------------------------------------------------- generic chop (any prop, any reach)
/** chopRail generalised: prop def, hand radius from the shoulder, number of strokes then rest at the ready. */
export function chopWith(f: number, pl: Placement, build: Build, start: number, def: PropDef, r: number, strokes = 99, cycle = 50, headPt: Pt = {x: 70, y: 4}) {
  const g = Math.max(0, f - start);
  const done = g >= strokes * cycle;
  const c = done ? 0 : g % cycle;
  const keys: [number, number, number, number, number][] = [
    [0, 14, 6, 12, 2],
    [14, -126, -7, 6, -2],
    [24, -132, -8, 6, -3],
    [31, 40, 16, 26, 7],
    [36, 46, 18, 28, 8],
    [50, 14, 6, 12, 2],
  ];
  let i = 0;
  while (i < keys.length - 2 && c > keys[i + 1][0]) i++;
  const [f0, a0, l0, k0, b0] = keys[i];
  const [f1, a1, l1, k1, b1] = keys[i + 1];
  const t = (i === 2 ? easeIn : easeInOut)(clamp((c - f0) / (f1 - f0)));
  const breathe = done ? Math.sin(f / 9) * 2 : 0;
  const a = lerp(a0, a1, t);
  const base = pose({lean: lerp(l0, l1, t) + breathe, hipL: -16, kneeL: lerp(k0, k1, t), hipR: 18, kneeR: lerp(k0, k1, t) * 0.8, bob: lerp(b0, b1, t) - breathe * 0.5, headTilt: lerp(l0, l1, t) * 0.6 - (done ? 6 : 0), shL: 30, elL: 30, shR: 30, elR: 30});
  const sk = solveSkeleton(base, build);
  const hl = {x: sk.sh.x + Math.cos(a * D2R) * r, y: sk.sh.y + Math.sin(a * D2R) * r};
  const xf = localXf(pl, hl, a + 10);
  const gR = gripWorld(xf, def.grips.handle!);
  const gL = gripWorld(xf, def.grips.grip2!);
  const P = handsOn(pl, base, {R: gR, L: gL}, build);
  const n = Math.min(strokes, Math.floor(g / cycle) + 1);
  const impacts = Array.from({length: n}, (_, k) => start + k * cycle + 31).filter((x) => x <= f + 100);
  const impact = (() => {
    const tmp = chopPose31(pl, build, def, r, headPt);
    return tmp;
  })();
  return {P, xf, gR, gL, impacts, impact};
}
function chopPose31(pl: Placement, build: Build, def: PropDef, r: number, headPt: Pt): Pt {
  const base = pose({lean: 16, hipL: -16, kneeL: 26, hipR: 18, kneeR: 26 * 0.8, bob: 7, headTilt: 16 * 0.6, shL: 30, elL: 30, shR: 30, elR: 30});
  const sk = solveSkeleton(base, build);
  const a = 40;
  const hl = {x: sk.sh.x + Math.cos(a * D2R) * r, y: sk.sh.y + Math.sin(a * D2R) * r};
  void def;
  return gripWorld(localXf(pl, hl, a + 10), headPt);
}

// ---------------------------------------------------------------- 2.2 family: Thomas planes, Nancy with the baby, Sarah
export const FAM_FLOOR = 860;
export const FAM = {boardTop: FAM_FLOOR - 150, saw0: 640, saw1: 920};
export function solveFamily(f: number): Solved {
  const d = DUR02.family;
  const bT = castBuild('thomas');
  const plT: Placement = {x: 620, y: FAM_FLOOR, scale: 1.5, dir: 1};
  const cyc = 44;
  const c = f % cyc;
  const u = c < 26 ? easeInOut(c / 26) : 1 - easeInOut((c - 26) / 18);
  const plane: PropXf = {x: 680 + 50 * u, y: FAM.boardTop, rot: 0, s: 1.5};
  const baseT = pose({lean: 14 + 16 * u, hipL: -16, kneeL: 10, hipR: 18, kneeR: 8 + 6 * u, headTilt: 10, bob: 2 + 3 * u});
  const gR = gripWorld(plane, PLANE.grips.handle!);
  const gL = gripWorld(plane, PLANE.grips.grip2!);
  const PT = handsOn(plT, baseT, {R: gR, L: gL}, bT);
  // Nancy at the door with the baby
  const bN = castBuild('nancy');
  const plN: Placement = {x: 1275, y: FAM_FLOOR, scale: 1.5, dir: -1};
  const baseN = mixPose(stand(f, 4), pose({lean: 4, hipL: -4, hipR: 4, headTilt: 10}), 0.7);
  const skN = solveSkeleton(baseN, bN);
  const rock = Math.sin(f / 18) * 3;
  const bundle = localXf(plN, {x: skN.sh.x + 26, y: skN.sh.y + 46 + rock * 0.3}, -10 + rock, 1 / 1.5 * 1.5);
  const nR = gripWorld(bundle, BUNDLE.grips.handle!);
  const nL = gripWorld(bundle, BUNDLE.grips.grip2!);
  const PN = handsOn(plN, baseN, {R: nR, L: nL}, bN);
  // young Sarah beside her
  const plS: Placement = {x: 1440, y: FAM_FLOOR, scale: 1.5, dir: -1};
  const PS = stand(f, 7);
  const tagN = lf(T('and Nancy Hanks'), 'family');
  return {
    figs: [
      {id: 'thomas', pl: plT, P: PT, build: bT, ex: exprAt(f, [[0, 'determined'], [120, 'happy']]), look: f > 110 && f < 170 ? [0.8, -0.3] : [0.6, 0.8], tag: f >= 8 && f < tagN - 6}, // Phase D2: Thomas's tag stays until Nancy is named (it ended at a fixed frame 120, before his name was spoken)
      {id: 'nancy', pl: plN, P: PN, build: bN, ex: exprAt(f, [[0, 'happy'], [90, 'curious'], [140, 'happy']]), look: f < 80 ? [-0.3, 0.6] : [-0.7, 0], tag: f >= tagN - 20 && f < d - 4},
      {id: 'sarahSister', pl: plS, P: PS, build: true, ex: exprAt(f, [[0, 'curious'], [120, 'happy']]), look: [-0.8, 0.1], tag: f >= 150 && f < d - 4},
    ],
    checks: [chk('Thomas R plane', plT, PT, 'R', gR, bT), chk('Thomas L plane', plT, PT, 'L', gL, bT), chk('Nancy R baby', plN, PN, 'R', nR, bN), chk('Nancy L baby', plN, PN, 'L', nL, bN)],
    seats: [], plane, bundle, strokes: Math.floor(f / cyc),
    cam: [[0, 1.24, 1000, 600], [d, 1.36, 990, 590]],
  };
}

// ---------------------------------------------------------------- 2.4 the boy chops (short axe)
export const CHOP_FLOOR = 860;
export function solveChop(f: number): Solved {
  const d = DUR02.chop;
  const id = 'abeBoy';
  const build = castBuild(id);
  const pl: Placement = {x: 800, y: CHOP_FLOOR, scale: 1.7, dir: 1};
  const out = chopWith(f, pl, build, 10, SHORT_AXE, 30, 3);
  const imps = [0, 1, 2].map((k) => 10 + k * 50 + 31);
  const ex = exprAt(f, [[0, 'determined'], [imps[0] + 1, 'cold'], [imps[0] + 10, 'determined'], [imps[1] + 1, 'cold'], [imps[1] + 10, 'determined'], [imps[2] + 1, 'cold'], [imps[2] + 12, 'determined'], [imps[2] + 22, 'happy']]);
  const hw = headWorld(pl, out.P, build);
  return {
    figs: [{id, pl, P: out.P, build, ex, tag: f >= 12 && f < 120, look: f > imps[2] + 20 ? [0.3, 0.6] : [0.6, 0.6]}],
    checks: [chk('boy R axe', pl, out.P, 'R', out.gR, build), chk('boy L axe', pl, out.P, 'L', out.gL, build)],
    seats: [], axe: out.xf, impact: out.impact, impacts: imps, head: hw,
    cam: [[0, 1.08, 900, 600], [imps[1], 1.25, 900, 600], [imps[2] + 14, 1.3, 890, 590], [d, 2.0, hw.x + 40, hw.y + 60]],
  };
}

// ---------------------------------------------------------------- 2.5 the grave (sombre, slow)
export const GRAVE_FLOOR = 860;
export function solveGrave(f0: number): Solved {
  const d = DUR02.grave;
  const f = f0 * 0.6; // slower motion
  const bB = castBuild('abeBoy');
  const plB: Placement = {x: 880, y: GRAVE_FLOOR, scale: 1.5, dir: 1};
  const PB = pose({...stand(f, 3), headTilt: 14, lean: 2, shL: 4, shR: 6, elL: 6, elR: 8});
  const bT = castBuild('thomas');
  const plT: Placement = {x: 790, y: GRAVE_FLOOR, scale: 1.5, dir: 1};
  const shB = toWorld(plB, solveSkeleton(PB, bB).sh);
  const target = {x: shB.x - 4, y: shB.y - 3};
  const baseT = pose({...stand(f, 5), headTilt: 12, lean: 4});
  const PT = handsOn(plT, baseT, {R: target}, bT);
  const bS = castBuild('sarahSister');
  const plS: Placement = {x: 1010, y: GRAVE_FLOOR, scale: 1.45, dir: 1};
  const PS = pose({...stand(f, 8), headTilt: 16, shL: 18, elL: 40, shR: 22, elR: 46});
  return {
    figs: [
      {id: 'thomas', pl: plT, P: PT, build: bT, ex: {expression: 'solemn'}, look: [0.6, 0.6]},
      {id: 'abeBoy', pl: plB, P: PB, build: bB, ex: {expression: 'sad'}, look: [0.7, 0.7]},
      {id: 'sarahSister', pl: plS, P: PS, build: bS, ex: {expression: 'sad'}, look: [0.6, 0.7]},
    ],
    checks: [chk('Thomas hand on shoulder', plT, PT, 'R', target, bT)],
    seats: [],
    cam: [[0, 1.08, 1000, 560], [d, 1.0, 1000, 560]],
  };
}

// ---------------------------------------------------------------- 2.6 the wagon arrives; Sarah Bush Johnston gives him a book
export const ARR_FLOOR = 860;
export const ARR = {stopX: 1560, startX: 2500, stopF: 62, boyX: 770};
export function wagonX(f: number) {
  return lerp(ARR.startX, ARR.stopX, prog(f, 0, ARR.stopF, (t) => 1 - Math.pow(1 - t, 2.2)));
}
export function solveArrive(f: number): Solved {
  const d = DUR02.arrive;
  const wx = wagonX(f);
  const id = 'sarahBush';
  const build = castBuild(id);
  const s = castScale(id) * 1.5;
  const h = seatHeight(build, s);
  // seated on the wagon seat (footboard is her floor), steps down 64-88, walks to the boy 88-140
  const plSeat: Placement = {x: wx - WAGON.half + 24, y: ARR_FLOOR - WAGON.seatTop + h, scale: s, dir: -1};
  const seatP = seatPose(plSeat, h, build, f, 3, {lean: 4});
  const down0 = 64;
  const down1 = 90;
  const walk0 = 90;
  const walk1 = 140;
  const groundX = wx - WAGON.half - 70;
  const D = 198; // local units walked
  const stopX = groundX - D * s;
  let pl: Placement;
  let base: Pose;
  if (f < down0) {
    pl = plSeat;
    base = seatP;
  } else if (f < down1) {
    const u = prog(f, down0, down1);
    pl = {x: lerp(plSeat.x, groundX, u), y: lerp(plSeat.y, ARR_FLOOR, easeIn(u)) - Math.sin(Math.PI * u) * 16, scale: s, dir: -1};
    base = sitDown(pose({hipL: -10, kneeL: 20, hipR: 30, kneeR: 40, lean: 10}), seatP, 1 - u);
    if (u > 0.6) base = mixPose(base, stand(f, 3), (u - 0.6) / 0.4);
  } else {
    const dist = D * prog(f, walk0, walk1, (t) => t * t * (3 - 2 * t));
    pl = {x: groundX - dist * s, y: ARR_FLOOR, scale: s, dir: -1};
    base = f < walk1 + 4 ? parishWalk(dist, build ?? false, 0.1, prog(f, walk1 - 8, walk1 + 4)) : stand(f, 3);
    if (f >= walk1 - 8 && f < walk1 + 4) base = mixPose(base, stand(f, 3), prog(f, walk1 - 8, walk1 + 4));
  }
  const bend = prog(f, 140, 152) * (1 - prog(f, 168, 186));
  base = mixPose(base, pose({lean: 12, hipL: -10, kneeL: 8, hipR: 10, kneeR: 8, headTilt: 8, bob: 3}), bend);
  void stopX;
  // book: at her chest, then out to the meeting point, then the boy brings it to his chest
  const sk = solveSkeleton(base, build);
  const chestS = localXf(pl, {x: sk.sh.x + 26, y: sk.sh.y + 40}, 0, 1 / s);
  const id2 = 'abeBoy';
  const bB = castBuild(id2);
  const plB: Placement = {x: ARR.boyX, y: ARR_FLOOR, scale: 1.6, dir: 1};
  const baseB = mixPose(stand(f, 6), pose({lean: 6, hipL: -6, hipR: 6, headTilt: 10}), prog(f, 140, 150) * (1 - prog(f, 178, 190) * 0.6));
  const skB = solveSkeleton(baseB, bB);
  const chestB = {...localXf(plB, {x: skB.sh.x + 24, y: skB.sh.y + 34}, 0, 1 / 1.6), flip: true};
  const meet: PropXf = {x: ARR.boyX + 76, y: ARR_FLOOR - 172, rot: 0, s: 1, flip: true};
  const book = f < 140 ? chestS : track(f, [[140, chestS], [152, meet], [160, meet], [180, chestB]]);
  const bkFinal = f >= 180 ? chestB : book;
  const gR = gripWorld(bkFinal, BOOK.grips.handle!);
  const gL = gripWorld(bkFinal, BOOK.grips.grip2!);
  const release = 160;
  const releaseL = 136; // she offers the book with the near hand only
  const gripS = handsOn(pl, base, {R: gR, L: gL}, build);
  const gripS1 = handsOn(pl, base, {R: gR}, build);
  let P = f <= releaseL ? gripS : f <= release ? approach(gripS1, gripS, 1 - (f - releaseL) / 10) : approach(base, gripS1, 1 - (f - release) / 12);
  if (f > releaseL && f <= release) P = {...P, shR: gripS1.shR, elR: gripS1.elR};
  const gripB = handsOn(plB, baseB, {R: gR, L: gL}, bB);
  const PB = approach(baseB, gripB, clamp((f - 140) / 12));
  const checks: Check[] = [];
  if (f <= release) checks.push(chk('Sarah R book', pl, P, 'R', gR, build));
  if (f <= releaseL) checks.push(chk('Sarah L book', pl, P, 'L', gL, build));
  if (f >= 152) checks.push(chk('boy R book', plB, PB, 'R', gR, bB), chk('boy L book', plB, PB, 'L', gL, bB));
  const seats = f < down0 ? [seatChk(pl, P, build, plSeat.y - h)] : [];
  const hb = headWorld(plB, PB, bB);
  return {
    figs: [
      {id, pl, P, build, ex: exprAt(f, [[0, 'happy'], [120, 'curious'], [146, 'happy']]), look: f < 90 ? [-0.6, 0.2] : [-0.7, 0.5], tag: f >= 70 && f < 150},
      {id: 'abeBoy', pl: plB, P: PB, build: bB, ex: exprAt(f, [[0, 'curious'], [62, 'surprised'], [90, 'curious'], [162, 'happy']]), look: f < 160 ? [0.8, 0.1] : [0.4, 0.8]},
      {id: 'sarahSister', pl: {x: 620, y: ARR_FLOOR, scale: 1.5, dir: 1}, P: stand(f, 9), build: true, ex: exprAt(f, [[0, 'curious'], [150, 'happy']]), look: [0.8, 0]},
    ],
    checks, seats, book: bkFinal, wx, roll: ARR.startX - wx, boyHead: hb, walking: f < ARR.stopF ? 1 - prog(f, ARR.stopF - 20, ARR.stopF) : 0,
    cam: [[0, 1.0, 1080, 540], [120, 1.0, 1020, 540], [150, 1.2, 960, 580], [d, 1.85, hb.x + 60, hb.y + 70]],
  };
}

// ---------------------------------------------------------------- 2.6 reading by firelight
export const READ_FLOOR = 860;
export function solveRead(f: number): Solved {
  const d = DUR02.read;
  const id = 'abeBoy';
  const build = castBuild(id);
  const s = 1.5;
  const pl: Placement = {x: 1000, y: READ_FLOOR, scale: s, dir: -1};
  const h = seatHeight(build, s);
  const base = seatPose(pl, h, build, f, 2, {lean: 6 + Math.sin(f / 50) * 2, hipR: 86, headTilt: 8});
  const sk = solveSkeleton(base, build);
  const bk = localXf(pl, {x: sk.sh.x + 27, y: sk.sh.y + 22 + Math.sin(f / 30) * 1.2}, -8, 1);
  const out = grabCarry(f, pl, base, base, {grips: {handle: BOOK.grips.handle!, grip2: BOOK.grips.grip2!}}, [[0, bk]], 0, 1e9, 'both', build, 1, 'book');
  const checks = [chk('R book', pl, out.P, 'R', gripWorld(bk, BOOK.grips.handle!), build), chk('L book', pl, out.P, 'L', gripWorld(bk, BOOK.grips.grip2!), build)];
  const hw = headWorld(pl, out.P, build);
  return {
    // Phase D2: the shot is 5.6 s now (it was 10 s), so every beat scales with its length: the same hold on the fire, pull-back
    // and push to the boy's face as before (they were fixed at frames 26, 96 and 140), a gentler final zoom, and the
    // expressions and first page turn at the same fractions of the shot
    figs: [{id, pl, P: out.P, build, ex: exprAt(f, [[0, 'curious'], [Math.round(d * 0.4), 'thinking' as string], [Math.round(d * 0.67), 'happy']]), look: [0.5, 0.8]}],
    checks, seats: [seatChk(pl, out.P, build, READ_FLOOR - h)], book: bk, open: 1, page: pageTurn(f, Math.round(d * 0.3), 70), seatH: h, head: hw,
    pullF: Math.round(d * 0.32),
    cam: [[0, 2.1, 430, 740], [Math.round(d * 0.087), 2.1, 440, 735], [Math.round(d * 0.32), 1.2, 800, 640], [Math.round(d * 0.467), 1.25, 820, 630], [d, d < 240 ? 2.2 : 2.5, hw.x - 24, hw.y + 26]],
  };
}

// ---------------------------------------------------------------- registry for the contact checker
export const S02_SHOTS = (['family', 'chop', 'grave', 'arrive', 'read'] as const).map((id) => ({id: 's02-' + id, dur: DUR02[id]}));
export const S02_SOLVERS: Record<string, (f: number) => Solved> = {'s02-family': solveFamily, 's02-chop': solveChop, 's02-grave': solveGrave, 's02-arrive': solveArrive, 's02-read': solveRead};
export const camZoom = (cam: CamKey[], f: number) => kf(f, cam.map((k) => [k[0], k[1]] as [number, number]));
