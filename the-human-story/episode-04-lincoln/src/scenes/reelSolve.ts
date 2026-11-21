// Upgrade test reel: pure per-shot solvers (pose, props, camera, contact checks). Used by the
// UpgradeTest composition to draw, and by scripts/check-contacts.mjs to measure every frame.
import {Pose, pose, stand, mixPose} from '../characters/poses';
import {Build, Placement, Pt, handWorld, headWorld, solveSkeleton, toWorld} from '../characters/skeleton';
import {parishWalk} from '../characters/parishWalk';
import {clamp, easeInOut, easeOut, kf, lerp, noise1, prog} from '../animations/core';
import {AXE, BOOK, QUILL, STOVEPIPE, gripWorld, handsOn, approach, PropXf, doorHandle, DOOR_W, DOOR_H} from '../kit/Props';
import {chopRail, chopImpactPoint, grabCarry, pageTurn, writeAt, shakeHands, exprAt, track, localXf, CHOP_CYCLE} from '../kit/Actions';
import {seatHeight, seatPose, sitDown, hipWorldY, feetWorld} from '../kit/Seats';
import {layoutDoc, nibAt, doc} from '../kit/Documents';
import {castBuild, castScale} from '../kit/Cast';
import type {CamKey} from '../kit/Cinema';

export type Check = {label: string; hand: Pt; grip: Pt};
export type SeatCheck = {x: number; hipY: number; seatY: number; feet: Pt[]; floor: number};
export type Fig = {id: string; pl: Placement; P: Pose; build?: Build; ex?: ReturnType<typeof exprAt>; look?: [number, number]; talking?: boolean; tag?: boolean; noHat?: boolean; fromBehind?: boolean; eyesClosed?: boolean; opacity?: number; clip?: [number, number, number, number]};
export type Solved = {figs: Fig[]; checks: Check[]; seats: SeatCheck[]; cam: CamKey[]; [k: string]: unknown};

export const SHOTS = [
  {id: 'woods', dur: 150, title: 'Axe chop · parallax · golden hour'},
  {id: 'cabin', dur: 165, title: 'Pick up and read a book by firelight'},
  {id: 'write', dur: 165, title: 'Writing real text with a quill'},
  {id: 'door', dur: 180, title: 'Opening a door and walking through'},
  {id: 'office', dur: 165, title: 'Hat off, put down, sit at the desk'},
  {id: 'reception', dur: 240, title: 'Handshake · documented speech bubbles'},
  {id: 'street', dur: 135, title: 'Expressions · shout and thought bubbles'},
] as const;
export const REEL_FRAMES = SHOTS.reduce((a, s) => a + s.dur, 0);

const chk = (label: string, pl: Placement, P: Pose, side: 'L' | 'R', grip: Pt, build?: Build): Check => ({label, hand: handWorld(pl, P, side, build), grip});
const seatChk = (pl: Placement, P: Pose, build: Build, seatY: number): SeatCheck => ({x: pl.x, hipY: hipWorldY(pl, P, build), seatY, feet: feetWorld(pl, P, build), floor: pl.y});

/** Walk that plants the feet (parishWalk) for any build; returns distance travelled and pose. */
export function walk04(f: number, start: number, stop: number, speed: number, build: Build, phase0 = 0.1) {
  const g = Math.max(0, f - start);
  const end = stop - start;
  const d = speed * (Math.min(g, end) + 24 * (1 - Math.exp(-Math.max(0, g - end) / 24)));
  const settle = prog(f, stop, stop + 30);
  return {d, P: f >= start ? parishWalk(d, build ?? false, phase0, settle) : stand(f, 3)};
}

// ---------------------------------------------------------------- 1 woods: axe chop
export const WOODS_FLOOR = 860;
export function solveWoods(f: number): Solved {
  const id = 'abeYoung';
  const build = castBuild(id);
  const pl: Placement = {x: 860, y: WOODS_FLOOR, scale: castScale(id), dir: 1};
  const out = chopRail(f, pl, build, 18);
  const impact = chopImpactPoint(pl, build);
  const ax = out.props.axe;
  const checks = [chk('R axe', pl, out.P, 'R', gripWorld(ax, AXE.grips.handle!), build), chk('L axe', pl, out.P, 'L', gripWorld(ax, AXE.grips.grip2!), build)];
  const impacts = [0, 1, 2].map((k) => 18 + k * CHOP_CYCLE + 31);
  const nImp = impacts.filter((i) => f >= i).length;
  const ex = exprAt(f, [[0, 'neutral'], [30, 'determined'], [impacts[0] + 2, 'grim'], [impacts[0] + 12, 'determined']]);
  return {
    figs: [{id, pl, P: out.P, build, ex, tag: f > 96 && f < 150}],
    checks, seats: [], axe: ax, impact, impacts, split: Math.min(1, nImp / 3),
    cam: [[0, 1.0, 960, 540], [40, 1.0, 960, 540], [150, 1.6, impact.x - 70, 600]],
  };
}

// ---------------------------------------------------------------- 2 cabin: pick up a book and read by firelight
export const CABIN_FLOOR = 860;
export function solveCabin(f: number): Solved {
  const id = 'abeBoy';
  const build = castBuild(id);
  const s = castScale(id);
  const pl: Placement = {x: 980, y: CABIN_FLOOR, scale: s, dir: -1};
  const h = seatHeight(build, s);
  const boxTop = CABIN_FLOOR - 46;
  const lean = kf(f, [[0, 2], [26, 2], [40, 30], [48, 30], [70, 4]]);
  const seated = seatPose(pl, h, build, f, 2, {lean, hipR: 86});
  const rest: PropXf = {x: 938, y: boxTop - 14, rot: 0, s, flip: true};
  // reading position in front of the face (local space)
  const read = (P: Pose): PropXf => {
    const sk = solveSkeleton(P, build);
    return localXf(pl, {x: sk.sh.x + 27, y: sk.sh.y + 20 + Math.sin(f / 30) * 1.2}, -8);
  };
  const readXf = read(seatPose(pl, h, build, f, 2, {lean: 4, hipR: 86}));
  const grab = 46;
  const keys: [number, PropXf][] = [[grab, rest], [grab + 4, {...rest, y: rest.y - 6}], [72, readXf]];
  const free = seated;
  const out = grabCarry(f, pl, seated, free, {grips: {handle: BOOK.grips.handle!, grip2: BOOK.grips.grip2!}}, keys, grab, 1e9, 'both', build, 14, 'book');
  const bk = out.props.book;
  const open = prog(f, 76, 92);
  const page = pageTurn(f, 108, 50);
  const checks = f >= grab ? [chk('R book', pl, out.P, 'R', gripWorld(bk, BOOK.grips.handle!), build), chk('L book', pl, out.P, 'L', gripWorld(bk, BOOK.grips.grip2!), build)] : [];
  // eyes first, then head, then body: gaze to the book at 20, lean from 26
  const look: [number, number] = f < 20 ? [0.6, 0] : f < 72 ? [-0.6, 1] : [-0.4, 0.8];
  const ex = exprAt(f, [[0, 'neutral'], [20, 'curious'], [96, 'thinking'], [128, 'happy']]);
  return {
    figs: [{id, pl, P: out.P, build, ex, look, eyesClosed: false}],
    checks, seats: [seatChk(pl, out.P, build, CABIN_FLOOR - h)], book: bk, open, page, seatH: h, boxTop,
    cam: [[0, 1.25, 900, 700], [80, 1.35, 905, 680], [165, 2.3, 930, 640]],
  };
}

// ---------------------------------------------------------------- 3 write: real text under the nib
export const WRITE_FLOOR = 900;
export const SLOPE = {x: 816, y: 718, w: 128, h: 80};
export function solveWrite(f: number): Solved {
  const id = 'abePres';
  const build = castBuild(id);
  const s = castScale(id);
  const pl: Placement = {x: 760, y: WRITE_FLOOR, scale: s, dir: 1};
  const h = seatHeight(build, s);
  const d = doc('bliss');
  const L = layoutDoc('Four score and seven years ago our fathers', d.hand, 19, SLOPE.w - 24, SLOPE.x + 12, SLOPE.y + 26, 1.25, 3);
  const u = prog(f, 34, 158, (t) => t);
  const writing = f >= 34 && f < 158;
  const nibBase = nibAt(L, u);
  const nib = {x: nibBase.x + (writing ? Math.sin(f * 2.1) * 1.5 : 0), y: nibBase.y - 4 - (writing ? Math.abs(Math.sin(f * 1.3)) * 9 : 6)};
  const lean = 8 + 24 * clamp((nib.x - SLOPE.x) / SLOPE.w) + 6 * clamp((nib.y - SLOPE.y) / SLOPE.h);
  const base = seatPose(pl, h, build, f, 4, {lean, hipR: 86, headTilt: -4});
  const w = writeAt(f, pl, base, nib, build, writing);
  const q = w.props.quill;
  // far hand steadies the page at its left edge
  const steady = {x: SLOPE.x + 6, y: SLOPE.y + SLOPE.h - 18};
  const P = handsOn(pl, w.P, {L: steady}, build);
  const checks = [chk('R quill', pl, P, 'R', gripWorld(q, QUILL.grips.handle!), build), chk('L page', pl, P, 'L', steady, build)];
  const ex = exprAt(f, [[0, 'thinking'], [40, 'determined'], [150, 'solemn']]);
  return {
    figs: [{id, pl, P, build, ex, look: [0.8, 0.9], noHat: true}],
    checks, seats: [seatChk(pl, P, build, WRITE_FLOOR - h)], quill: q, layout: L, reveal: u, nib, seatH: h,
    cam: [[0, 1.05, 900, 640], [30, 1.15, 880, 660], [70, 2.9, nibBase.x - 10, nibBase.y - 6], [165, 3.0, nibBase.x + 6, nibBase.y]],
  };
}

// ---------------------------------------------------------------- 4 door: open it and walk through
export const DOOR_FLOOR = 900;
export const DOOR_X = 860; // hinge
export const DOOR_S = 1.55;
export function solveDoor(f: number): Solved {
  const id = 'abeLawyer';
  const build = castBuild(id);
  const s = castScale(id);
  const angle = kf(f, [[0, 0], [110, 0], [138, 60], [180, 60]]);
  const handle = doorHandle(DOOR_X, DOOR_FLOOR, angle, DOOR_S);
  // walk in from the right, stop beside the handle, then step left with the opening door (feet planted)
  const w = walk04(f, 0, 62, 2.6, build, 0.3);
  const stopX = 1290 - w.d;
  const dFollow = 2.2 * clamp(f - 110, 0, 30);
  const dThrough = 2.6 * clamp(f - 146, 0, 34);
  const x = stopX - dFollow - dThrough;
  let P: Pose = f < 104 ? w.P : f < 110 ? mixPose(w.P, stand(f, 2), prog(f, 104, 110)) : f < 146 ? parishWalk(dFollow, build ?? false, 0.2, prog(f, 140, 146)) : parishWalk(dFollow + dThrough, build ?? false, 0.2, 0);
  const pl: Placement = {x, y: DOOR_FLOOR - prog(f, 150, 180) * 22, scale: s * (1 - 0.14 * prog(f, 150, 180)), dir: -1};
  const grab = 104;
  const release = 140;
  const free = P;
  const gripP = handsOn(pl, P, {R: handle}, build);
  let uu = 1;
  if (f < grab) uu = clamp(1 - (grab - f) / 12);
  else if (f > release) uu = clamp(1 - (f - release) / 10);
  P = approach(free, gripP, uu);
  const checks = f >= grab && f <= release ? [chk('R handle', pl, P, 'R', handle, build)] : [];
  const ex = exprAt(f, [[0, 'neutral'], [70, 'curious'], [110, 'determined'], [140, 'happy']]);
  return {
    figs: [{id, pl, P, build, ex, look: f < 60 ? [-0.6, 0] : [-0.8, 0.3], fromBehind: f >= 150, tag: f > 10 && f < 100}],
    checks, seats: [], angle, handle, inside: f >= 150,
    cam: [[0, 1.0, 960, 560], [70, 1.0, 1000, 560], [110, 1.5, 1010, 640], [180, 1.6, 980, 640]],
  };
}

// ---------------------------------------------------------------- 5 office: hat off, put it down, sit at the desk
export const OFFICE_FLOOR = 880;
export const OFFICE_DESK = {x: 968, w: 300, h: 104};
export function solveOffice(f: number): Solved {
  const id = 'abe1858';
  const build = castBuild(id);
  const s = castScale(id);
  const pl: Placement = {x: 780, y: OFFICE_FLOOR, scale: s, dir: 1};
  const h = seatHeight(build, s);
  const st = stand(f, 5);
  const seatP = seatPose(pl, h, build, f, 5, {lean: 6, hipR: 86, shR: 40, elR: 50});
  const sitU = prog(f, 56, 82, (t) => t);
  const bodyAt = (g: number) => (g < 56 ? stand(g, 5) : sitDown(stand(g, 5), seatPose(pl, h, build, g, 5, {lean: 6, hipR: 86, shR: 40, elR: 50}), prog(g, 56, 82, (t) => t)));
  const body = bodyAt(f);
  void st; void seatP; void sitU;
  // hat: on the head until 24; lifted off and held at the chest while he sits; set on the desk from the chair at 126
  const hw = headWorld(pl, stand(24, 5), build);
  const R = 44 * s;
  const hs = (R * 1.12) / 48;
  const onHead: PropXf = {x: hw.x, y: hw.y - R * 0.66, rot: 0, s: hs};
  const chestOf = (g: number): PropXf => {
    const sk = solveSkeleton(bodyAt(g), build);
    const c = toWorld(pl, {x: sk.sh.x + 34, y: sk.sh.y + 40});
    return {x: c.x, y: c.y, rot: -64, s: hs};
  };
  const deskTop = OFFICE_FLOOR - OFFICE_DESK.h;
  const spot: PropXf = {x: 832, y: deskTop, rot: 0, s: hs};
  let hat: PropXf;
  if (f < 34) hat = track(f, [[24, onHead], [34, {...onHead, y: onHead.y - 8, x: onHead.x + 4, rot: -8}]]);
  else if (f < 50) hat = track(f, [[34, {...onHead, y: onHead.y - 8, x: onHead.x + 4, rot: -8}], [50, chestOf(50)]]);
  else if (f < 100) hat = chestOf(f);
  else hat = track(f, [[100, chestOf(100)], [120, {...spot, y: spot.y - 10, rot: -4}], [126, spot]]);
  const g = gripWorld(hat, STOVEPIPE.grips.handle!);
  const free = body;
  const gripP = handsOn(pl, body, {R: g}, build);
  let uu = 1;
  if (f < 24) uu = clamp(1 - (24 - f) / 10);
  else if (f > 126) uu = clamp(1 - (f - 126) / 10);
  const outP = approach(free, gripP, uu);
  const out = {P: outP};
  const checks = f >= 24 && f <= 126 ? [chk('R hat', pl, outP, 'R', g, build)] : [];
  const seats = f >= 82 ? [seatChk(pl, outP, build, OFFICE_FLOOR - h)] : [];
  const ex = exprAt(f, [[0, 'neutral'], [30, 'relieved'], [60, 'tired'], [130, 'thinking'], [150, 'determined']]);
  return {
    figs: [{id, pl, P: out.P, build, ex, noHat: f >= 24, look: f > 60 && f < 90 ? [1, 0.6] : [0.4, 0]}],
    checks, seats, hat, hatOnHead: f < 24, seatH: h, deskTop, sitting: f >= 56,
    cam: [[0, 1.0, 960, 560], [50, 1.15, 900, 580], [100, 1.15, 900, 600], [165, 1.7, 820, 600]],
  };
}

// ---------------------------------------------------------------- 6 reception: handshake and documented bubbles
export const REC_FLOOR = 900;
export function solveReception(f: number): Solved {
  const aId = 'abe1865';
  const bId = 'douglass';
  const bA = castBuild(aId);
  const bB = castBuild(bId);
  const plA: Placement = {x: 760, y: REC_FLOOR, scale: castScale(aId), dir: 1};
  const w = walk04(f, 10, 96, 2.4, bB, 0.6);
  const plB: Placement = {x: 1205 - w.d, y: REC_FLOOR, scale: castScale(bId), dir: -1};
  const baseA = mixPose(stand(f, 7), pose({lean: 14, hipL: -8, hipR: 8, kneeL: 4}), prog(f, 90, 110));
  const baseB = f < 96 ? w.P : mixPose(w.P, pose({lean: 10, hipL: -6, hipR: 6}), prog(f, 96, 112));
  const meet = {x: plA.x + 0.6 * (plB.x - plA.x), y: 712};
  const start = 122;
  const end = 176;
  let PA = baseA;
  let PB = baseB;
  let checks: Check[] = [];
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
  const exA = exprAt(f, [[0, 'tired'], [34, 'happy'], [176, 'relieved'], [212, 'happy']]);
  const exB = exprAt(f, [[0, 'neutral'], [60, 'hopeful'], [120, 'happy'], [170, 'solemn'], [214, 'happy']]);
  return {
    figs: [
      {id: aId, pl: plA, P: PA, build: bA, ex: exA, noHat: true, talking: f >= 40 && f < 76, tag: f > 4 && f < 60},
      {id: bId, pl: plB, P: PB, build: bB, ex: exB, talking: f >= 178 && f < 214, tag: f > 70 && f < 160, look: [-0.5, -0.3]},
    ],
    checks, seats: [],
    cam: [[0, 1.0, 960, 560], [96, 1.25, 950, 600], [150, 1.7, 1010, 560], [200, 1.7, 1010, 560], [240, 2.1, 800, 560]],
  };
}

// ---------------------------------------------------------------- 7 street: expression sweep + shout and thought bubbles
export const STREET_FLOOR = 900;
export const EXPR_SWEEP: [number, string][] = [[0, 'neutral'], [16, 'shocked'], [34, 'afraid'], [52, 'grim'], [70, 'thinking'], [88, 'hopeful'], [106, 'relieved']];
export function solveStreet(f: number): Solved {
  const boy: Placement = {x: 520, y: STREET_FLOOR, scale: castScale('newsboy'), dir: 1};
  const man: Placement = {x: 980, y: STREET_FLOOR, scale: castScale('townsman'), dir: -1};
  const woman: Placement = {x: 1320, y: STREET_FLOOR, scale: castScale('townswoman'), dir: -1};
  const shout = pose({lean: -6, shR: 150 + Math.sin(f / 4) * 10, elR: 20, shL: 20, elL: 40, hipL: -6, hipR: 6, headTilt: -8});
  return {
    figs: [
      {id: 'newsboy', pl: boy, P: shout, ex: {expression: 'shout'}, talking: f < 60},
      {id: 'townsman', pl: man, P: stand(f, 9), ex: exprAt(f, EXPR_SWEEP, 7), look: [-0.7, 0]},
      {id: 'townswoman', pl: woman, P: stand(f, 11), ex: exprAt(f, [[0, 'neutral'], [40, 'worried'], [100, 'hopeful']]), look: [-0.8, 0]},
    ],
    checks: [], seats: [],
    cam: [[0, 1.0, 960, 560], [14, 1.0, 960, 560], [30, 2.3, 980, 560], [120, 2.3, 980, 560], [135, 1.6, 980, 560]],
  };
}

export const SOLVERS: Record<string, (f: number) => Solved> = {
  woods: solveWoods, cabin: solveCabin, write: solveWrite, door: solveDoor, office: solveOffice, reception: solveReception, street: solveStreet,
};
export const camZoom = (cam: CamKey[], f: number) => kf(f, cam.map((k) => [k[0], k[1]] as [number, number]));
export {DOOR_W, DOOR_H, lerp, easeInOut, easeOut, noise1};
