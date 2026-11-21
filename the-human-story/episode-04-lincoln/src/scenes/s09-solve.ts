// s09 "Ford's Theatre": pure solvers for the figure shots (9.3 the silhouette in the corridor, 9.4 Mary and
// Robert in the Petersen House front parlour). Used by S09.tsx and scripts/check-contacts.mjs.
// Sombre chapter: slow, small movements only; no action is ever shown.
import {Pose, pose, stand, mixPose} from '../characters/poses';
import {Build, Placement, handWorld} from '../characters/skeleton';
import {kf, noise1} from '../animations/core';
import {exprAt} from '../kit/Actions';
import {seatHeight, seatPose, hipWorldY, feetWorld} from '../kit/Seats';
import {castBuild, castScale} from '../kit/Cast';
import type {CamKey} from '../kit/Cinema';
import type {Solved, SeatCheck} from './reelSolve';
import {walker, walkDist} from './sets';

const seatChk = (pl: Placement, P: Pose, build: Build, seatY: number): SeatCheck => ({x: pl.x, hipY: hipWorldY(pl, P, build), seatY, feet: feetWorld(pl, P, build), floor: pl.y});

// ---------------------------------------------------------------- 9.3 corridor: a still, dark figure (never glamorised)
export const CORRIDOR_FLOOR = 880;
export const DOOR_REACH = 166; // frame the hand reaches the box door's handle
export const DOOR_OPEN = 184; // the door begins to open
export function solveCorridor(f: number): Solved {
  const id = 'booth';
  const build = castBuild(id);
  // Phase D: he walks away from us down the corridor (silhouette, three-quarter back), stops at the box door and
  // reaches for the handle; the door opens a crack. Nothing beyond the door is shown.
  const W0 = 8, W1 = 148; // John North: the corridor shot is 7.2 s, so walk, reach and door are 20 frames earlier
  const D = walkDist(W1 + 60, W0, W1, 2.0);
  const wk = walker(f, W0, W1, 2.0);
  const u = Math.min(1, wk.d / D);
  const e = u * u * (3 - 2 * u) * 0.35 + u * 0.65;
  const x = 330 + (985 - 330) * e;
  const y = 1010 + (842 - 1010) * e;
  const sc = castScale(id) * (2.1 + (1.05 - 2.1) * e);
  const pl: Placement = {x, y, scale: sc, dir: 1};
  const reach = kf(f, [[DOOR_REACH - 22, 0], [DOOR_REACH, 1]]);
  const P0 = f < W0 ? stand(f, 21) : wk.p;
  const P = mixPose(P0, pose({...P0, shR: 74, elR: 18, headTilt: -4}), reach);
  return {
    figs: [{id, pl, P: {...P, bob: (P.bob ?? 0) + Math.sin(f / 26) * 0.6}, build}],
    checks: [], seats: [],
    cam: [[0, 1.06, 640, 610], [W1, 1.3, 900, 580], [DOOR_OPEN + 40, 1.42, 980, 560]],
  };
}

// ---------------------------------------------------------------- 9.3b the box (family review, Nov 2026)
// Inside the presidential box, side view: Lincoln in the rocking chair, Mary beside him, both watching the stage
// (light from the right). Booth stands behind Lincoln with the derringer raised; on the narrator's word "shot" the
// pistol fires (flash and smoke), Lincoln slumps forward, Mary turns to him. Non-graphic: no wound, no blood.
export const BOX_FLOOR = 900;
export const BOX_S = 1.22; // figure scale in this shot
export const BOX = {abe: 1010, mary: 1360, booth: 760};
/** Local frame of the shot within the shot (set by S09.tsx from the narration; default for the contact checker). */
export function solveBox(f: number, fire = 10): Solved {
  const bA = castBuild('abe1865');
  const bM = castBuild('mary');
  const bB = castBuild('booth');
  const sA = castScale('abe1865') * BOX_S;
  const sM = castScale('mary') * BOX_S;
  const sB = castScale('booth') * BOX_S;
  const plA: Placement = {x: BOX.abe, y: BOX_FLOOR, scale: sA, dir: 1};
  const plM0: Placement = {x: BOX.mary, y: BOX_FLOOR, scale: sM, dir: 1};
  const hA = seatHeight(bA, sA);
  const hM = seatHeight(bM, sM);
  const rock = f < fire ? Math.sin(f / 14) * 2.5 : 0;
  const slump = kf(f, [[fire + 1, 0], [fire + 16, 1]]);
  // Lincoln: relaxed in the rocking chair, then slumps forward and to the side, arms falling
  const PA = seatPose(plA, hA, bA, f, 41, {lean: 4 + rock + 22 * slump, hipR: 86, shL: 22 - 12 * slump, elL: 52 - 40 * slump, shR: 28 - 16 * slump, elR: 58 - 44 * slump, headTilt: -4 + 30 * slump});
  // Mary: watching, then turns to him (faces left) and reaches for him
  const turn = f >= fire + 6;
  const plM: Placement = {...plM0, dir: turn ? -1 : 1};
  const reach = kf(f, [[fire + 6, 0], [fire + 18, 1]]);
  const PM = seatPose(plM, hM, bM, f, 43, {lean: 6 + 16 * reach, hipR: 86, shL: 30 + 60 * reach, elL: 60 - 40 * reach, shR: 34 + 70 * reach, elR: 70 - 50 * reach, headTilt: 4 + 6 * reach});
  // Booth: standing behind Lincoln, right arm raised and aimed; a small recoil on the shot, then the arm drops
  const plB: Placement = {x: BOX.booth - kf(f, [[fire + 1, 0], [fire + 6, 10], [fire + 40, 16]]), y: BOX_FLOOR, scale: sB, dir: 1};
  const aim = kf(f, [[0, 0.75], [fire - 2, 1], [fire + 30, 1], [fire + 50, 0.15]]);
  const recoil = kf(f, [[fire, 0], [fire + 2, 8], [fire + 8, 0]]);
  const PB = mixPose(stand(f, 47), pose({...stand(f, 47), shR: 92 + recoil, elR: 4, shL: 10, elL: 24, lean: 4, headTilt: -2}), aim);
  const hand = handWorld(plB, PB, 'R', bB);
  return {
    figs: [
      {id: 'booth', pl: plB, P: PB, build: bB, ex: exprAt(f, [[0, 'grim' as never], [fire + 4, 'angry']]), look: [1, 0.1], tag: f > 4 && f < fire + 70},
      {id: 'abe1865', pl: plA, P: PA, build: bA, ex: exprAt(f, [[0, 'happy'], [fire + 1, 'surprised']]), look: [1, 0.2], eyesClosed: f > fire + 4},
      {id: 'mary', pl: plM, P: PM, build: bM, ex: exprAt(f, [[0, 'happy'], [fire + 4, 'scared']]), look: [turn ? 1 : 0.8, 0.3], talking: turn && f < fire + 40},
    ],
    checks: [],
    seats: [seatChk(plA, PA, bA, BOX_FLOOR - hA), seatChk(plM, PM, bM, BOX_FLOOR - hM)],
    seatA: hA, seatM: hM, muzzle: {x: hand.x + 26 * sB, y: hand.y - 4 * sB}, hand, fire,
    cam: [[0, 1.32, 1030, 640], [fire, 1.35, 1030, 640], [fire + 30, 1.5, 1080, 650], [130, 1.56, 1090, 655]],
  };
}

// ---------------------------------------------------------------- 9.4b front parlour: Mary seated, Robert beside her
export const PARLOUR_FLOOR = 880;
export const SOFA_X = 860;
export function solveParlour(f: number): Solved {
  const mId = 'maryMourning';
  const rId = 'robert';
  const bM = castBuild(mId);
  const bR = castBuild(rId);
  const sM = castScale(mId);
  const plM: Placement = {x: SOFA_X, y: PARLOUR_FLOOR, scale: sM, dir: 1};
  const h = seatHeight(bM, sM);
  // Mary: seated, hands in her lap, head slowly bowing; breathing only
  const PM = seatPose(plM, h, bM, f, 31, {lean: 10 + Math.sin(f / 40) * 1.2, hipR: 86, shL: 30, elL: 70, shR: 34, elR: 76, headTilt: kf(f, [[0, 6], [160, 14]])});
  // Robert: standing beside the sofa, head lowered, very still
  const plR: Placement = {x: 1150, y: PARLOUR_FLOOR, scale: castScale(rId), dir: -1};
  const PR = mixPose(stand(f, 33), pose({hipL: -4, hipR: 4, shL: -4, elL: 30, shR: 6, elR: 34, headTilt: 10 + noise1(f / 70, 4) * 2}), 0.8);
  const exM = exprAt(f, [[0, 'grief']]);
  const exR = exprAt(f, [[0, 'solemn'], [120, 'sad']]);
  return {
    figs: [
      {id: mId, pl: plM, P: PM, build: bM, ex: exM, look: [0.3, 0.8], tag: false},
      {id: rId, pl: plR, P: PR, build: bR, ex: exR, look: [0.6, 0.6], tag: true},
    ],
    checks: [], seats: [seatChk(plM, PM, bM, PARLOUR_FLOOR - h)], seatH: h,
    cam: [[0, 1.45, 760, 680], [270, 1.62, 820, 690]],
  };
}

export const S09_SHOTS = [
  {id: 's09-9.3', dur: 245},
  {id: 's09-9.3b', dur: 122},
  {id: 's09-9.4b', dur: 280},
] as const;
export const S09_SOLVERS: Record<string, (f: number) => Solved> = {'s09-9.3': solveCorridor, 's09-9.3b': (f: number) => solveBox(f), 's09-9.4b': solveParlour};
export const camZoom = (cam: CamKey[], f: number) => kf(f, cam.map((k) => [k[0], k[1]] as [number, number]));
