// Chapter 8 (s08 "Malice toward none") pure shot solvers: poses, props, camera and contact checks.
// Drawn by S08.tsx; measured every frame by scripts/check-contacts.mjs (SHOTS / SOLVERS below).
import {Pose, pose, stand, mixPose} from '../characters/poses';
import {Placement, solveSkeleton} from '../characters/skeleton';
import {clamp, kf, prog} from '../animations/core';
import {QUILL, gripWorld, handsOn, approach} from '../kit/Props';
import {writeAt, shakeHands, exprAt} from '../kit/Actions';
import {seatHeight, seatPose, hipWorldY, feetWorld} from '../kit/Seats';
import {layoutDoc, nibAt, doc, Layout} from '../kit/Documents';
import {castBuild, castScale} from '../kit/Cast';
import {T, TE, sectionWindow} from '../timeline';
import {walk04, Check, Solved} from './reelSolve';
import {handWorld, Pt, Build} from '../characters/skeleton';

export const [S08_S, S08_E] = sectionWindow('s08');
/** Shot starts (programme seconds), anchored to the captions. */
export const A08 = {
  write: S08_S,
  atlanta: T('he expected to lose'), // "That summer he expected to lose." is its own caption cue since Phase D2
  house: T('the House passed the Thirteenth Amendment'),
  capitol: T('That March'),
  reception: T("to bind up the nation's wounds"),
  appomattox: T('Appomattox Court House'),
  fields: T('An estimated six hundred'),
};
const fr = (a: number, b: number) => Math.round((b - a) * 30);
export const D08 = {
  write: fr(A08.write, A08.atlanta),
  atlanta: fr(A08.atlanta, A08.house),
  house: fr(A08.house, A08.capitol),
  capitol: fr(A08.capitol, A08.reception),
  reception: fr(A08.reception, A08.appomattox),
  appomattox: fr(A08.appomattox, A08.fields),
  fields: fr(A08.fields, S08_E),
};

const chk = (label: string, pl: Placement, P: Pose, side: 'L' | 'R', grip: Pt, build?: Build): Check => ({label, hand: handWorld(pl, P, side, build), grip});

// ---------------------------------------------------------------- 8.1 writing at night: MCU on the slope, then the insert
export const W81_FLOOR = 900;
export const SLOPE81 = {x: 816, y: 718, w: 128, h: 80};
/** Local frame where the insert takes over (cross-dissolve INS_X .. INS_X + 16). */
export const INS_X = 112;
/** Insert page geometry (screen space, no camera zoom beyond a slow push). */
export const PAGE81 = {x: 300, y: 230, w: 1320, h: 470};
export function layout81(): Layout {
  const d = doc('hodges');
  return layoutDoc(d.text, d.hand, 50, PAGE81.w - 150, PAGE81.x + 76, PAGE81.y + 118, 1.42, 99);
}
/** Write-on progress of the insert. Phase D2: anchored to the captions (was hard-coded 419.5-425.6 s): it starts 0.3 s
 *  before "I am naturally anti-slavery" is spoken (the cue opens with "Lincoln wrote,") and ends with "nothing is wrong." */
export const insReveal = (f: number) => {
  const a = Math.round((T('I am naturally anti-slavery') + 0.75 - S08_S) * 30);
  const b = Math.round((TE('nothing is wrong') - S08_S) * 30);
  return prog(f, a, b, (t) => t);
};
export function solveWrite81(f: number): Solved {
  const id = 'abePres';
  const build = castBuild(id);
  const s = castScale(id);
  const pl: Placement = {x: 760, y: W81_FLOOR, scale: s, dir: 1};
  const h = seatHeight(build, s);
  const d = doc('hodges');
  const L = layoutDoc('I am naturally anti-slavery.', d.hand, 17, SLOPE81.w - 22, SLOPE81.x + 11, SLOPE81.y + 26, 1.25, 3);
  const g = Math.min(f, INS_X + 20); // the MCU stops being drawn after the dissolve
  const u = prog(g, 18, 132, (t) => t);
  const writing = g >= 18 && g < 132;
  const nibBase = nibAt(L, u);
  const nib = {x: nibBase.x + (writing ? Math.sin(g * 2.1) * 1.5 : 0), y: nibBase.y - 4 - (writing ? Math.abs(Math.sin(g * 1.3)) * 9 : 6)};
  const lean = 8 + 24 * clamp((nib.x - SLOPE81.x) / SLOPE81.w) + 6 * clamp((nib.y - SLOPE81.y) / SLOPE81.h);
  const base = seatPose(pl, h, build, g, 4, {lean, hipR: 86, headTilt: -4});
  const w = writeAt(g, pl, base, nib, build, writing);
  const q = w.props.quill;
  const steady = {x: SLOPE81.x + 6, y: SLOPE81.y + SLOPE81.h - 18};
  const P = handsOn(pl, w.P, {L: steady}, build);
  const checks = f <= INS_X + 16 ? [chk('R quill', pl, P, 'R', gripWorld(q, QUILL.grips.handle!), build), chk('L page', pl, P, 'L', steady, build)] : [];
  const ex = exprAt(g, [[0, 'tired'], [40, 'determined'], [110, 'solemn']]);
  // insert: nib under the reveal edge of the big page, the hand drawn on the quill grip
  const IL = layout81();
  const ru = insReveal(f);
  const ib = nibAt(IL, ru);
  const iw = ru > 0 && ru < 1;
  const inib = {x: ib.x + (iw ? Math.sin(f * 2.1) * 3 : 0), y: ib.y - 6 - (iw ? Math.abs(Math.sin(f * 1.3)) * 16 : 12)};
  const iq = {x: inib.x, y: inib.y, rot: 6 + (iw ? Math.sin(f * 1.7) * 3 : 0), s: 2.6, flip: true};
  const iGrip = gripWorld(iq, QUILL.grips.handle!);
  return {
    figs: [{id, pl, P, build, ex, look: [0.8, 0.9], noHat: true}],
    checks, seats: f <= INS_X + 16 ? [{x: pl.x, hipY: hipWorldY(pl, P, build), seatY: W81_FLOOR - h, feet: feetWorld(pl, P, build), floor: W81_FLOOR}] : [],
    quill: q, layout: L, reveal: u, seatH: h, insLayout: IL, insReveal: ru, insQuill: iq, insGrip: iGrip,
    cam: [[0, 1.2, 905, 640], [70, 1.35, 890, 650], [INS_X + 16, 2.6, nibBase.x - 10, nibBase.y - 6], [400, 2.6, nibBase.x - 10, nibBase.y - 6]],
  };
}

// ---------------------------------------------------------------- 8.5 reception: Douglass and Lincoln shake hands (test-reel staging)
export const REC85_FLOOR = 900;
export function solveReception85(f: number): Solved {
  const aId = 'abe1865';
  const bId = 'douglass1863';
  const bA = castBuild(aId);
  const bB = castBuild(bId);
  const plA: Placement = {x: 760, y: REC85_FLOOR, scale: castScale(aId), dir: 1};
  const w = walk04(f, 0, 52, 2.4, bB, 0.6);
  const plB: Placement = {x: 1130 - w.d, y: REC85_FLOOR, scale: castScale(bId), dir: -1};
  const baseA = mixPose(stand(f, 7), pose({lean: 14, hipL: -8, hipR: 8, kneeL: 4}), prog(f, 46, 66));
  const baseB = f < 52 ? w.P : mixPose(w.P, pose({lean: 10, hipL: -6, hipR: 6}), prog(f, 52, 68));
  const meet = {x: plA.x + 0.55 * (plB.x - plA.x), y: 712};
  const start = 80;
  const end = 150;
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
  return {
    figs: [
      {id: aId, pl: plA, P: PA, build: bA, ex: exprAt(f, [[0, 'tired'], [30, 'happy'], [150, 'relieved']]), noHat: true},
      {id: bId, pl: plB, P: PB, build: bB, ex: exprAt(f, [[0, 'neutral'], [40, 'hopeful'], [80, 'happy'], [140, 'solemn']]), look: [-0.5, -0.3]},
    ],
    checks, seats: [],
    cam: [[0, 1.05, 960, 560], [60, 1.2, 900, 600], [110, 1.45, 870, 590], [200, 1.55, 870, 585]],
  };
}

// ---------------------------------------------------------------- 8.6 Appomattox parlour: Lee and Grant shake hands, still and quiet
export const APP_FLOOR = 880;
export function solveAppomattox(f: number): Solved {
  const plA: Placement = {x: 890, y: APP_FLOOR, scale: castScale('grant'), dir: 1};
  const plB: Placement = {x: 1032, y: APP_FLOOR, scale: castScale('lee'), dir: -1};
  const baseA = mixPose(stand(f, 3), pose({lean: 8, hipL: -6, hipR: 6}), prog(f, 70, 96));
  const baseB = mixPose(stand(f, 5), pose({lean: 6, hipL: -6, hipR: 6, headTilt: 6}), prog(f, 74, 100));
  const meet = {x: 961, y: 742};
  const start = 116;
  const end = 196;
  let PA = baseA;
  let PB = baseB;
  let checks: Check[] = [];
  if (f >= start - 16) {
    const sh = shakeHands(f, plA, baseA, plB, baseB, meet, start, undefined, undefined, 16);
    if (f <= end) {
      PA = sh.PA;
      PB = sh.PB;
      if (f >= start) checks = [chk('Grant hand', plA, PA, 'R', sh.meet), chk('Lee hand', plB, PB, 'R', sh.meet)];
    } else {
      const u = clamp((f - end) / 16);
      PA = approach(baseA, sh.PA, 1 - u);
      PB = approach(baseB, sh.PB, 1 - u);
    }
  }
  return {
    figs: [
      {id: 'grant', pl: plA, P: PA, ex: exprAt(f, [[0, 'neutral'], [100, 'solemn']]), tag: f > 18 && f < D08.appomattox - 6, look: [0.6, 0]}, // Phase D2: both tags stay until both men have been named (Grant's left at a fixed frame 150, before his name)
      {id: 'lee', pl: plB, P: PB, ex: exprAt(f, [[0, 'solemn'], [120, 'tired'], [210, 'solemn']]), tag: f > 40 && f < D08.appomattox - 6, look: [-0.6, 0.2]},
    ],
    checks, seats: [],
    cam: [[0, 1.3, 960, 600], [120, 1.45, 960, 610], [290, 1.62, 960, 620]],
  };
}

export const SHOTS = [
  {id: 's08-write', dur: D08.write},
  {id: 's08-reception', dur: D08.reception},
  {id: 's08-appomattox', dur: D08.appomattox},
];
export const SOLVERS: Record<string, (f: number) => Solved> = {'s08-write': solveWrite81, 's08-reception': solveReception85, 's08-appomattox': solveAppomattox};
export const camZoom = (cam: Solved['cam'], f: number) => kf(f, cam.map((k) => [k[0], k[1]] as [number, number]));
void solveSkeleton;
