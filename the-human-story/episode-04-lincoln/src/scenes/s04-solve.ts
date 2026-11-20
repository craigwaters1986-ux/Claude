// Chapters 4 and 5 (s04 "Lawyer and politician", s05 "A house divided"): pure per-shot solvers.
// Poses, held props, seats and camera keys for every shot with a contact (hand on a prop, hip on a seat),
// used by S04.tsx / S05.tsx to draw and by scripts/check-contacts.mjs to measure every frame.
import {Pose, pose, stand, mixPose, talkGesture, orate, addPose} from '../characters/poses';
import {Build, Placement, Pt, handWorld, headWorld, solveSkeleton, toWorld} from '../characters/skeleton';
import {parishWalk} from '../characters/parishWalk';
import {clamp, kf, noise1, prog} from '../animations/core';
import {BOOK, QUILL, STOVEPIPE, gripWorld, handsOn, approach, PropXf, doorHandle, DOOR_W, DOOR_H} from '../kit/Props';
import {grabCarry, pageTurn, writeAt, doffHat, exprAt, localXf, track} from '../kit/Actions';
import {seatHeight, seatPose, sitDown, standUp, hipWorldY, feetWorld} from '../kit/Seats';
import {castBuild, castScale} from '../kit/Cast';
import {T, beat, sectionWindow} from '../timeline';
import type {CamKey} from '../kit/Cinema';
import type {Check, SeatCheck, Fig, Solved} from './reelSolve';

export type {Fig, Solved};
const chk = (label: string, pl: Placement, P: Pose, side: 'L' | 'R', grip: Pt, build?: Build): Check => ({label, hand: handWorld(pl, P, side, build), grip});
const seatChk = (pl: Placement, P: Pose, build: Build, seatY: number): SeatCheck => ({x: pl.x, hipY: hipWorldY(pl, P, build), seatY, feet: feetWorld(pl, P, build), floor: pl.y});
const fr = (s: number) => Math.round(s * 30);

// ---------------------------------------------------------------- shot times (programme seconds)
export const [S4, E4] = sectionWindow('s04');
export const [S5, E5] = sectionWindow('s05');
export const AT4 = {
  leg: S4,
  hand: T('He borrowed law books'),
  read: T('He studied with nobody'),
  ride: T('In 1837 he moved to Springfield'),
  protest: T('That year he joined a protest'),
  ball: T('He met Mary Todd at a ball'),
  ball2: beat('s04', 1)[0],
  window: T('Their engagement broke off'),
  wed: T('But in November 1842'),
  door: T('But in November 1842') + 2.2,
  circuit: T('He rode the legal circuit'),
  capitol: T('In 1846 he was elected to Congress'),
  speak: T('where he opposed the war with Mexico'),
  bill: T('bill to begin ending slavery'),
};
export const AT5 = {
  map: S5,
  meet: T('and drew Lincoln back into politics'),
  hall: T('In June 1858'),
  hdoc: T('A house divided against itself'),
  ilmap: T('the Democrat Stephen Douglas'),
  debate: T('the Democrat Stephen Douglas') + 1.95,
  charleston: T('At Charleston he said') + 1.6,
  result: T('The legislature, which chose senators'),
  cooper: T('and in February 1860'),
};
const seq = (o: Record<string, number>, end: number) => {
  const ks = Object.keys(o);
  return Object.fromEntries(ks.map((k, i) => [k, fr((i + 1 < ks.length ? o[ks[i + 1]] : end) - o[k])])) as Record<string, number>;
};
/** shot lengths in frames */
export const DUR4 = seq(AT4, E4);
export const DUR5 = seq(AT5, E5);

const LAW = 'abeLawyer';
const A58 = 'abe1858';

// ---------------------------------------------------------------- 4.1 legislature: he stands to speak
export const LEG_FLOOR = 900;
export const LEG_STAND = 112;
export function solveLeg(f: number): Solved {
  const build = castBuild(LAW);
  const s = castScale(LAW);
  const pl: Placement = {x: 1010, y: LEG_FLOOR, scale: s, dir: 1};
  const h = seatHeight(build, s);
  const seatP = seatPose(pl, h, build, f, 3, {lean: 3});
  const talk = mixPose(stand(f, 3), talkGesture(f, 3), prog(f, 150, 168));
  const P = f < LEG_STAND ? seatP : standUp(seatP, talk, prog(f, LEG_STAND, LEG_STAND + 26, (t) => t));
  const seats = f < LEG_STAND ? [seatChk(pl, P, build, LEG_FLOOR - h)] : [];
  // members on their chairs (illustrative, unnamed)
  const mem: Fig[] = [
    {id: 'townsman', x: 470, dir: 1 as const, sd: 11},
    {id: 'visitor', x: 690, dir: 1 as const, sd: 12},
    {id: 'farmer', x: 1330, dir: -1 as const, sd: 13},
    {id: 'townsman', x: 1550, dir: -1 as const, sd: 14},
  ].map((m) => {
    const b = castBuild(m.id);
    const mpl: Placement = {x: m.x, y: LEG_FLOOR, scale: castScale(m.id), dir: m.dir};
    const mh = seatHeight(b, mpl.scale);
    return {id: m.id, pl: mpl, P: seatPose(mpl, mh, b, f + m.sd * 20, m.sd, {lean: 2}), build: b, look: [m.dir === 1 ? 0.6 : -0.6, -0.1] as [number, number], ex: {expression: f > 150 ? 'curious' : 'neutral'}, noHat: true};
  });
  mem.forEach((m) => seats.push(seatChk(m.pl, m.P, m.build, LEG_FLOOR - seatHeight(m.build, m.pl.scale))));
  const ex = exprAt(f, [[0, 'neutral'], [LEG_STAND, 'determined'], [170, 'neutral']]);
  return {
    figs: [{id: LAW, pl, P, build, ex, talking: f > 150, look: [0.3, -0.2]}, ...mem],
    checks: [], seats, seatH: h,
    cam: [[0, 1.0, 960, 540], [96, 1.0, 960, 540], [210, 1.5, 1010, 600], [400, 1.6, 1010, 600]],
  };
}

// ---------------------------------------------------------------- 4.2a Stuart hands over a law book (OTS)
export const HAND_FLOOR = 880;
const BOOK_S = 1.35;
const SPINE: Pt = {x: 3, y: -6};
const FORE: Pt = {x: 27, y: -6};
export function solveHand(f: number): Solved {
  const bS = castBuild('stuart');
  const bL = castBuild(LAW);
  const plS: Placement = {x: 1010, y: HAND_FLOOR, scale: castScale('stuart'), dir: -1};
  const plL: Placement = {x: 850, y: HAND_FLOOR, scale: castScale(LAW), dir: 1};
  const baseS = addPose(stand(f, 4), {lean: kf(f, [[0, 0], [30, 0], [56, 8], [80, 8], [100, 2]])});
  const baseL = addPose(stand(f, 6), {lean: kf(f, [[0, 2], [40, 2], [60, 8], [90, 3]])});
  const skS = solveSkeleton(stand(0, 4), bS);
  const chestS = toWorld(plS, {x: skS.sh.x + 30, y: skS.sh.y + 42});
  const skL = solveSkeleton(stand(0, 6), bL);
  const chestL = toWorld(plL, {x: skL.sh.x + 34, y: skL.sh.y + 52});
  const meet = {x: 930, y: 728};
  // book origin = spine; it opens to the right (towards Stuart, who holds the fore-edge)
  const at = (p: Pt): PropXf => ({x: p.x - 15 * BOOK_S, y: p.y, rot: 0, s: BOOK_S});
  const keys: [number, PropXf][] = [[0, at(chestS)], [26, at(chestS)], [56, at(meet)], [74, at(meet)], [104, at({x: chestL.x, y: chestL.y})], [400, at({x: chestL.x, y: chestL.y})]];
  const bk = track(f, keys);
  const outS = grabCarry(f, plS, baseS, baseS, {grips: {handle: FORE}}, keys, -20, 70, 'R', bS, 12, 'book');
  const outL = grabCarry(f, plL, baseL, baseL, {grips: {handle: SPINE}}, keys, 62, 1e9, 'R', bL, 14, 'book');
  const checks: Check[] = [];
  if (f <= 70) checks.push(chk('Stuart book', plS, outS.P, 'R', gripWorld(bk, FORE), bS));
  if (f >= 62) checks.push(chk('Lincoln book', plL, outL.P, 'R', gripWorld(bk, SPINE), bL));
  return {
    figs: [
      {id: 'stuart', pl: plS, P: outS.P, build: bS, ex: exprAt(f, [[0, 'neutral'], [20, 'happy'], [90, 'curious']]), talking: f > 8 && f < 48, tag: f > 8, look: [-0.6, 0.2]},
      {id: LAW, pl: plL, P: outL.P, build: bL, fromBehind: true},
    ],
    checks, seats: [], book: bk,
    cam: [[0, 1.45, 950, 620], [200, 1.6, 960, 610]],
  };
}

// ---------------------------------------------------------------- 4.2b reading alone at a lamp-lit desk (INS)
export const READ_FLOOR = 880;
export function solveRead(f: number): Solved {
  const build = castBuild(LAW);
  const s = castScale(LAW);
  const pl: Placement = {x: 880, y: READ_FLOOR, scale: s, dir: 1};
  const h = seatHeight(build, s);
  const base = seatPose(pl, h, build, f, 7, {lean: 8, hipR: 86, headTilt: 6});
  const sk = solveSkeleton(base, build);
  const xf = localXf(pl, {x: sk.sh.x + 46, y: sk.sh.y + 20 + Math.sin(f / 30) * 1.2}, -10, 1);
  const out = grabCarry(f, pl, base, base, {grips: {handle: BOOK.grips.handle!, grip2: BOOK.grips.grip2!}}, [[0, xf]], -50, 1e9, 'both', build, 12, 'book');
  const bk = xf;
  return {
    figs: [{id: LAW, pl, P: out.P, build, ex: exprAt(f, [[0, 'thinking'], [44, 'determined']]), look: [0.7, 0.9]}],
    checks: [chk('R book', pl, out.P, 'R', gripWorld(bk, BOOK.grips.handle!), build), chk('L book', pl, out.P, 'L', gripWorld(bk, BOOK.grips.grip2!), build)],
    seats: [seatChk(pl, out.P, build, READ_FLOOR - h)], book: bk, page: pageTurn(f, 26, 60), seatH: h,
    cam: [[0, 1.75, 960, 650], [120, 1.95, 985, 640]],
  };
}

// ---------------------------------------------------------------- writing on a slope (4.3b protest, 4.5 letter, 4.7d bill)
export const SLOPE04 = {x: 816, y: 718, w: 128, h: 80};
export const WRITE04_FLOOR = 900;
export const SCRIB = {lines: 3, gap: 20, x0: SLOPE04.x + 12, y0: SLOPE04.y + 22, w: SLOPE04.w - 24};
/** Seated at the desk writing scribbled lines; `stopAt` lifts the quill and turns to the window. */
function writeShot(f: number, id: string, w0: number, w1: number, stopAt = 1e9, lookOut = false, seed = 4) {
  const build = castBuild(id);
  const s = castScale(id);
  const pl: Placement = {x: 760, y: WRITE04_FLOOR, scale: s, dir: 1};
  const h = seatHeight(build, s);
  const u = prog(f, w0, Math.min(w1, stopAt), (t) => t);
  const writing = f >= w0 && f < Math.min(w1, stopAt);
  const li = Math.min(SCRIB.lines - 1, Math.floor(u * SCRIB.lines));
  const lt = clamp(u * SCRIB.lines - li);
  const lw = SCRIB.w * (li === SCRIB.lines - 1 ? 0.45 : 0.95);
  const nibBase = {x: SCRIB.x0 + lt * lw, y: SCRIB.y0 + li * SCRIB.gap};
  const lift = f >= stopAt ? 6 + 16 * prog(f, stopAt, stopAt + 18) : 0;
  const nib = {x: nibBase.x + (writing ? Math.sin(f * 2.1) * 1.5 : 0), y: nibBase.y - 4 - (writing ? Math.abs(Math.sin(f * 1.3)) * 7 : 4) - lift};
  const lean = 8 + 24 * clamp((nib.x - SLOPE04.x) / SLOPE04.w) + 6 * clamp((nib.y - SLOPE04.y) / SLOPE04.h) - (lookOut ? 6 * prog(f, stopAt, stopAt + 30) : 0);
  const base = seatPose(pl, h, build, f, seed, {lean, hipR: 86, headTilt: lookOut ? -4 - 6 * prog(f, stopAt + 10, stopAt + 40) : -4});
  const w = writeAt(f, pl, base, nib, build, writing);
  const q = w.props.quill;
  const steady = {x: SLOPE04.x + 6, y: SLOPE04.y + SLOPE04.h - 18};
  const P = handsOn(pl, w.P, {L: steady}, build);
  return {
    pl, P, build, h, quill: q, reveal: u, nib,
    checks: [chk('R quill', pl, P, 'R', gripWorld(q, QUILL.grips.handle!), build), chk('L page', pl, P, 'L', steady, build)],
    seats: [seatChk(pl, P, build, WRITE04_FLOOR - h)],
  };
}

export function solveProtest(f: number): Solved {
  const w = writeShot(f, LAW, 16, 112, 1e9, false, 5);
  const mb = castBuild('visitor');
  const mpl: Placement = {x: 1180, y: WRITE04_FLOOR, scale: castScale('visitor'), dir: -1};
  return {
    figs: [
      {id: LAW, pl: w.pl, P: w.P, build: w.build, ex: exprAt(f, [[0, 'determined'], [100, 'solemn']]), look: [0.8, 0.9]},
      {id: 'visitor', pl: mpl, P: addPose(stand(f, 8), {lean: 6, shL: 30, elL: 60}), build: mb, ex: {expression: 'solemn'}, look: [-0.7, 0.6], noHat: true},
    ],
    checks: w.checks, seats: w.seats, quill: w.quill, reveal: w.reveal, seatH: w.h,
    cam: [[0, 1.2, 930, 640], [140, 1.42, 900, 660]],
  };
}

export function solveWindow(f: number): Solved {
  const stop = DUR4.window - 72; // "Friends spoke of his bouts…": he stops and looks out
  const w = writeShot(f, LAW, 24, 210, stop, true, 6);
  const look: [number, number] = f < stop + 12 ? [0.8, 0.9] : [1, -0.25];
  return {
    figs: [{id: LAW, pl: w.pl, P: w.P, build: w.build, ex: exprAt(f, [[0, 'tired'], [stop + 10, 'sad']], 14), look}],
    checks: w.checks, seats: w.seats, quill: w.quill, reveal: w.reveal, seatH: w.h, stop,
    cam: [[0, 1.02, 980, 560], [400, 1.16, 960, 590]],
  };
}

export function solveBill(f: number): Solved {
  const w = writeShot(f, LAW, 14, 230, 1e9, false, 9);
  const pull = fr(beat('s04', 3)[0] - AT4.bill);
  return {
    figs: [{id: LAW, pl: w.pl, P: w.P, build: w.build, ex: exprAt(f, [[0, 'determined'], [pull, 'thinking']]), look: [0.8, 0.9]}],
    checks: w.checks, seats: w.seats, quill: w.quill, reveal: w.reveal, seatH: w.h, pull,
    cam: [[0, 2.2, 880, 690], [pull, 2.3, 875, 690], [pull + 90, 1.0, 960, 560], [400, 0.98, 960, 560]],
  };
}

// ---------------------------------------------------------------- 4.4 the ball: over the shoulder each way
export const BALL_FLOOR = 900;
export function solveBall1(f: number): Solved {
  const bM = castBuild('mary');
  const bL = castBuild(LAW);
  const plM: Placement = {x: 1080, y: BALL_FLOOR, scale: castScale('mary'), dir: -1};
  const plL: Placement = {x: 820, y: BALL_FLOOR, scale: castScale(LAW), dir: 1};
  const bow = 14 * Math.sin(Math.PI * prog(f, 12, 46, (t) => t));
  const PL = addPose(stand(f, 3), {lean: bow, headTilt: bow * 0.5, shL: -4, shR: 10});
  const curt = Math.sin(Math.PI * prog(f, 20, 50, (t) => t));
  const PM = addPose(stand(f, 5), {lean: 6 * curt, bob: 10 * curt, kneeL: 14 * curt, kneeR: 14 * curt, hipL: -4 + 7 * curt, hipR: 4 + 7 * curt, shL: 18, elL: 50, shR: 22, elR: 60});
  return {
    figs: [
      {id: LAW, pl: plL, P: PL, build: bL, fromBehind: true},
      {id: 'mary', pl: plM, P: PM, build: bM, ex: exprAt(f, [[0, 'curious'], [22, 'happy']]), look: [-0.7, -0.2], tag: f > 3},
    ],
    checks: [], seats: [],
    cam: [[0, 1.5, 1000, 600], [120, 1.62, 1035, 595]],
  };
}
export function solveBall2(f: number): Solved {
  const bM = castBuild('mary');
  const bL = castBuild(LAW);
  const plM: Placement = {x: 850, y: BALL_FLOOR, scale: castScale('mary'), dir: 1};
  const plL: Placement = {x: 1050, y: BALL_FLOOR, scale: castScale(LAW), dir: -1};
  const meet = {x: 950, y: 752 + Math.sin(f / 20) * 1.5};
  const baseL = addPose(stand(f, 7), {lean: kf(f, [[0, 2], [26, 2], [44, 16], [80, 10]]), headTilt: kf(f, [[0, 0], [30, 0], [44, 8], [80, 4]])});
  const baseM = addPose(stand(f, 9), {lean: 2});
  const gL = handsOn(plL, baseL, {R: meet}, bL);
  const gM = handsOn(plM, baseM, {R: meet}, bM);
  const PM = approach(baseM, gM, prog(f, 14, 30, (t) => t));
  const PL = approach(baseL, gL, prog(f, 22, 36, (t) => t));
  const checks = f >= 36 ? [chk('Lincoln hand', plL, PL, 'R', meet, bL), chk('Mary hand', plM, PM, 'R', meet, bM)] : [];
  return {
    figs: [
      {id: 'mary', pl: plM, P: PM, build: bM, fromBehind: true},
      {id: LAW, pl: plL, P: PL, build: bL, ex: exprAt(f, [[0, 'curious'], [24, 'happy']]), look: [-0.7, 0.1]},
    ],
    checks, seats: [], meet,
    cam: [[0, 1.55, 960, 610], [120, 1.66, 990, 600]],
  };
}

// ---------------------------------------------------------------- 4.6a the wedding: hands joined
export const WED_FLOOR = 900;
export function solveWed(f: number): Solved {
  const bM = castBuild('mary');
  const bL = castBuild(LAW);
  const plL: Placement = {x: 862, y: WED_FLOOR, scale: castScale(LAW), dir: 1};
  const plM: Placement = {x: 1008, y: WED_FLOOR, scale: castScale('mary'), dir: -1};
  const meet = {x: 936, y: 742 + Math.sin(f / 18) * 1.2};
  const PL = handsOn(plL, addPose(stand(f, 2), {lean: 4}), {R: meet}, bL);
  const PM = handsOn(plM, addPose(stand(f, 4), {lean: 2}), {R: meet}, bM);
  return {
    figs: [
      {id: LAW, pl: plL, P: PL, build: bL, ex: {expression: 'happy'}, look: [0.7, -0.1]},
      {id: 'mary', pl: plM, P: PM, build: bM, ex: {expression: 'happy'}, look: [-0.7, -0.3]},
    ],
    checks: [chk('Lincoln hand', plL, PL, 'R', meet, bL), chk('Mary hand', plM, PM, 'R', meet, bM)], seats: [], meet,
    cam: [[0, 1.5, 935, 640], [90, 1.18, 935, 590]],
  };
}

// ---------------------------------------------------------------- 4.6b the house at Eighth and Jackson: the door opens
export const DOOR04_FLOOR = 900;
export const DOOR04_X = 820;
export const DOOR04_S = 1.45;
export function solveHouse(f: number): Solved {
  const bL = castBuild(LAW);
  const bM = castBuild('mary');
  const angle = kf(f, [[0, 0], [8, 0], [36, 58], [400, 58]]);
  const handle = doorHandle(DOOR04_X, DOOR04_FLOOR, angle, DOOR04_S);
  const dw = DOOR_W * DOOR04_S;
  // Lincoln: steps back with the opening door (feet planted by the walk), lets go, then goes in after Mary
  const dFollow = 1.9 * clamp(f - 10, 0, 28);
  const x0 = 1012;
  const inL = f >= 68;
  const dIn = 2.4 * clamp(f - 56, 0, 12);
  let PL: Pose = f < 10 ? stand(f, 3) : f < 56 ? parishWalk(dFollow, bL ?? false, 0.2, prog(f, 38, 46)) : parishWalk(dFollow + dIn + (inL ? 2.2 * (f - 68) : 0), bL ?? false, 0.2, 0);
  const xL = Math.max(DOOR04_X + dw * 0.5, x0 - dFollow - dIn);
  const recL = prog(f, 68, 96);
  const plL: Placement = {x: xL, y: DOOR04_FLOOR - recL * 22, scale: castScale(LAW) * (1 - 0.14 * recL), dir: -1};
  const free = PL;
  const gripP = handsOn(plL, PL, {R: handle}, bL);
  let u = 1;
  if (f < 4) u = clamp(1 - (4 - f) / 8);
  else if (f > 44) u = clamp(1 - (f - 44) / 10);
  PL = approach(free, gripP, u);
  const checks = f >= 4 && f <= 44 ? [chk('R handle', plL, PL, 'R', handle, bL)] : [];
  // Mary walks in from the right and goes through first
  const dM = 2.9 * Math.min(f, 52);
  const inM = f >= 52;
  const recM = prog(f, 52, 78);
  const PM = parishWalk(2.9 * f, bM ?? false, 0.5, 0);
  const plM: Placement = {x: inM ? 1068 - 2.9 * 52 : 1068 - dM, y: DOOR04_FLOOR - recM * 22, scale: castScale('mary') * (1 - 0.14 * recM), dir: -1};
  return {
    figs: [
      {id: 'mary', pl: plM, P: PM, build: bM, ex: {expression: 'happy'}, fromBehind: inM, opacity: 1 - 0.5 * prog(f, 66, 86)},
      {id: LAW, pl: plL, P: PL, build: bL, ex: exprAt(f, [[0, 'happy'], [40, 'relieved']]), look: [-0.8, 0.2], fromBehind: inL, opacity: 1 - 0.5 * prog(f, 80, 96)},
    ],
    checks, seats: [], angle, handle, inM, inL, dw, dh: DOOR_H * DOOR04_S,
    cam: [[0, 1.02, 960, 560], [120, 1.1, 940, 580]],
  };
}

// ---------------------------------------------------------------- 4.7c the House: he speaks at his desk
export const HOUSE_FLOOR = 900;
export function solveSpeak(f: number): Solved {
  const build = castBuild(LAW);
  const pl: Placement = {x: 980, y: HOUSE_FLOOR, scale: castScale(LAW), dir: -1};
  const P = mixPose(stand(f, 5), talkGesture(f, 5), prog(f, 6, 20));
  const seats: SeatCheck[] = [];
  const mem: Fig[] = [
    {id: 'townsman', x: 400, sd: 21},
    {id: 'visitor', x: 600, sd: 22},
    {id: 'farmer', x: 1400, sd: 23},
    {id: 'townsman', x: 1600, sd: 24},
  ].map((m) => {
    const b = castBuild(m.id);
    const dir = (m.x < 980 ? 1 : -1) as 1 | -1;
    const mpl: Placement = {x: m.x, y: HOUSE_FLOOR, scale: castScale(m.id), dir};
    const mh = seatHeight(b, mpl.scale);
    const MP = seatPose(mpl, mh, b, f + m.sd * 11, m.sd, {lean: 2});
    seats.push(seatChk(mpl, MP, b, HOUSE_FLOOR - mh));
    return {id: m.id, pl: mpl, P: MP, build: b, look: [dir * 0.7, -0.15] as [number, number], ex: {expression: m.sd % 2 ? 'curious' : 'neutral'}, noHat: true};
  });
  return {
    figs: [...mem, {id: LAW, pl, P, build, ex: exprAt(f, [[0, 'determined']]), talking: f > 8, look: [-0.5, -0.1]}],
    checks: [], seats,
    cam: [[0, 1.25, 980, 600], [120, 1.42, 990, 590]],
  };
}

// ---------------------------------------------------------------- 5.2 the Republican meeting: hat in hand
export const MEET_FLOOR = 900;
export function solveMeet(f: number): Solved {
  const build = castBuild(A58);
  const pl: Placement = {x: 900, y: MEET_FLOOR, scale: castScale(A58), dir: 1};
  const grab = 34;
  const base = mixPose(stand(f, 5), addPose(stand(f, 5), {lean: 6, headTilt: 6}), prog(f, grab + 10, grab + 30));
  const out = doffHat(f, pl, base, grab, build);
  const hat = out.props.hat;
  const checks = f >= grab ? [chk('R hat', pl, out.P, 'R', gripWorld(hat, {x: 34, y: 0}), build)] : [];
  const others: Fig[] = [
    {id: 'townsman', x: 1240, dir: -1 as const, sd: 31},
    {id: 'farmer', x: 1440, dir: -1 as const, sd: 32},
    {id: 'visitor', x: 560, dir: 1 as const, sd: 33},
  ].map((m) => ({id: m.id, pl: {x: m.x, y: MEET_FLOOR, scale: castScale(m.id), dir: m.dir}, P: stand(f + m.sd, m.sd), build: castBuild(m.id), ex: {expression: f > 60 ? 'happy' : 'curious'}, look: [m.dir * 0.7, -0.1] as [number, number]}));
  return {
    figs: [...others, {id: A58, pl, P: out.P, build, ex: exprAt(f, [[0, 'neutral'], [grab, 'relieved'], [grab + 40, 'happy']]), noHat: f >= grab, look: [0.6, -0.1]}],
    checks, seats: [], hat, hatOnHead: f < grab,
    cam: [[0, 1.0, 960, 560], [200, 1.32, 940, 590]],
  };
}

// ---------------------------------------------------------------- 5.4b the debate platform: Douglas speaks, Lincoln waits
export const PLAT_FLOOR = 780;
export function solveDebate(f: number): Solved {
  const bD = castBuild('douglas');
  const bL = castBuild(A58);
  const plD: Placement = {x: 860, y: PLAT_FLOOR, scale: castScale('douglas'), dir: 1};
  const plL: Placement = {x: 1330, y: PLAT_FLOOR, scale: castScale(A58), dir: -1};
  const h = seatHeight(bL, plL.scale);
  const PL = seatPose(plL, h, bL, f, 8, {lean: 4, shR: 30, elR: 70, shL: 24, elL: 64});
  const PD = (Math.floor(f / 40) % 2 ? orate(f, 3) : addPose(talkGesture(f * 1.4, 3), {lean: 8, shR: 80 + Math.sin(f / 3) * 14}));
  return {
    figs: [
      {id: 'douglas', pl: plD, P: PD, build: bD, ex: exprAt(f, [[0, 'determined'], [44, 'angry'], [70, 'determined']]), talking: true, tag: f > 6, look: [0.6, 0.2]},
      {id: A58, pl: plL, P: PL, build: bL, ex: {expression: 'grim'}, look: [-0.8, 0.1]},
    ],
    checks: [], seats: [seatChk(plL, PL, bL, PLAT_FLOOR - h)], seatH: h,
    cam: [[0, 1.0, 960, 540], [140, 1.12, 1000, 540]],
  };
}

// ---------------------------------------------------------------- 5.6 he reads the result (newspaper in both hands)
export const NEWS_FLOOR = 900;
export const NEWS_GRIPS = {handle: {x: 56, y: -4} as Pt, grip2: {x: -56, y: -4} as Pt};
export function solveResult(f: number): Solved {
  const build = castBuild(A58);
  const pl: Placement = {x: 900, y: NEWS_FLOOR, scale: castScale(A58), dir: 1};
  const lower = prog(f, 130, 160);
  const base = addPose(stand(f, 12), {lean: 6 - 3 * lower, headTilt: 12 - 12 * lower});
  const sk = solveSkeleton(base, build);
  const xf = localXf(pl, {x: sk.sh.x + 52, y: sk.sh.y + 52 + 18 * lower + Math.sin(f / 26) * 1.2}, -6 + 10 * lower, 1);
  const P = handsOn(pl, base, {R: gripWorld(xf, NEWS_GRIPS.handle), L: gripWorld(xf, NEWS_GRIPS.grip2)}, build);
  const hw = headWorld(pl, P, build);
  return {
    figs: [{id: A58, pl, P, build, ex: exprAt(f, [[0, 'grim'], [120, 'thinking']], 12), noHat: true, look: f < 125 ? [0.6, 0.9] : [0.7, -0.35]}],
    checks: [chk('R paper', pl, P, 'R', gripWorld(xf, NEWS_GRIPS.handle), build), chk('L paper', pl, P, 'L', gripWorld(xf, NEWS_GRIPS.grip2), build)],
    seats: [], paper: xf, head: hw,
    cam: [[0, 2.15, hw.x + 40, hw.y + 90], [260, 2.4, hw.x + 30, hw.y + 70]],
  };
}

// ---------------------------------------------------------------- registry for the contact checker
export const SHOTS0405: {id: string; dur: number}[] = [
  {id: 'leg', dur: DUR4.leg}, {id: 'hand', dur: DUR4.hand}, {id: 'read', dur: DUR4.read}, {id: 'protest', dur: DUR4.protest},
  {id: 'ball1', dur: fr(AT4.ball2 - AT4.ball)}, {id: 'ball2', dur: fr(AT4.window - AT4.ball2)}, {id: 'window', dur: DUR4.window},
  {id: 'wed', dur: DUR4.wed}, {id: 'house', dur: DUR4.door}, {id: 'speak', dur: DUR4.speak}, {id: 'bill', dur: DUR4.bill},
  {id: 'meet', dur: DUR5.meet}, {id: 'debate', dur: fr(AT5.charleston - AT5.debate)}, {id: 'result', dur: DUR5.result},
];
export const SOLVERS0405: Record<string, (f: number) => Solved> = {
  leg: solveLeg, hand: solveHand, read: solveRead, protest: solveProtest, ball1: solveBall1, ball2: solveBall2, window: solveWindow,
  wed: solveWed, house: solveHouse, speak: solveSpeak, bill: solveBill, meet: solveMeet, debate: solveDebate, result: solveResult,
};
export const camZoom0405 = (cam: CamKey[], f: number) => kf(f, cam.map((k) => [k[0], k[1]] as [number, number]));
export {noise1, sitDown, STOVEPIPE, BOOK, QUILL};
