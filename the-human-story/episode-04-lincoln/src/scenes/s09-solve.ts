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

const seatChk = (pl: Placement, P: Pose, build: Build, seatY: number): SeatCheck => ({x: pl.x, hipY: hipWorldY(pl, P, build), seatY, feet: feetWorld(pl, P, build), floor: pl.y});
void handWorld;

// ---------------------------------------------------------------- 9.3 corridor: a still, dark figure (never glamorised)
export const CORRIDOR_FLOOR = 880;
export function solveCorridor(f: number): Solved {
  const id = 'booth';
  const build = castBuild(id);
  const pl: Placement = {x: 760, y: CORRIDOR_FLOOR, scale: castScale(id) * 1.0, dir: 1};
  const P = mixPose(stand(f, 21), pose({hipL: -4, hipR: 4, shL: -4, elL: 6, shR: 4, elR: 8, headTilt: -2}), 0.6);
  return {
    figs: [{id, pl, P: {...P, bob: Math.sin(f / 26) * 1}, build}],
    checks: [], seats: [],
    cam: [[0, 1.28, 870, 600], [8, 1.29, 868, 600], [232, 1.45, 830, 600], [245, 1.455, 829, 600]],
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
  {id: 's09-9.4b', dur: 280},
] as const;
export const S09_SOLVERS: Record<string, (f: number) => Solved> = {'s09-9.3': solveCorridor, 's09-9.4b': solveParlour};
export const camZoom = (cam: CamKey[], f: number) => kf(f, cam.map((k) => [k[0], k[1]] as [number, number]));
