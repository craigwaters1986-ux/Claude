// Chapter 10 (s10 "Legacy") pure shot solvers: poses, props, camera and contact checks.
// Drawn by S10.tsx; measured every frame by scripts/check-contacts.mjs (SHOTS / SOLVERS below).
import {Pose, pose, stand, mixPose} from '../characters/poses';
import {Placement, Pt, Build, handWorld} from '../characters/skeleton';
import {clamp, kf, prog} from '../animations/core';
import {handsOn, approach, PropXf} from '../kit/Props';
import {grabCarry, exprAt} from '../kit/Actions';
import {headWorld, solveSkeleton, toWorld} from '../characters/skeleton';
import {castBuild, castScale} from '../kit/Cast';
import {T, sectionWindow, beat} from '../timeline';
import type {Check, Fig, Solved} from './reelSolve';

export const [S10_S, S10_E] = sectionWindow('s10');
export const A10 = {
  train: S10_S,
  coffins: T("His son Willie's coffin"),
  thirteenth: T('By December 1865') + 2.3, // after "By December 1865," so the card and the page land together
  memorial: T('In 1922 the Lincoln'),
  section: T('reportedly seated in a separate section') - 0.15,
  debate: T('Historians still argue'),
  bliss: T('The page he signed'),
  end: beat('s10', 2)[0] + 1.6, // the last line is held, then the end card for the rest of the 7 s silent beat
};
const fr = (a: number, b: number) => Math.round((b - a) * 30);
export const D10 = {
  train: fr(A10.train, A10.coffins),
  coffins: fr(A10.coffins, A10.thirteenth),
  thirteenth: fr(A10.thirteenth, A10.memorial),
  memorial: fr(A10.memorial, A10.section),
  section: fr(A10.section, A10.debate),
  debate: fr(A10.debate, A10.bliss),
  bliss: fr(A10.bliss, A10.end),
  end: fr(A10.end, S10_E),
};
/** 10.1: local frame where the map hands over to the station (the narration's "through hundreds of towns"). */
export const STATION_AT = fr(A10.train, T('through hundreds of towns'));

const chk = (label: string, pl: Placement, P: Pose, side: 'L' | 'R', grip: Pt, build?: Build): Check => ({label, hand: handWorld(pl, P, side, build), grip});

// ---------------------------------------------------------------- 10.1 station at night: men remove their hats as the train passes
export const STATION_FLOOR = 880;
export const DOFFERS: {x: number; dir: 1 | -1; grab: number; id: string; seed: number}[] = [
  {x: 420, dir: 1, grab: 18, id: 'townsman', seed: 1},
  {x: 760, dir: -1, grab: 30, id: 'townsman', seed: 2},
  {x: 1180, dir: 1, grab: 24, id: 'townsman', seed: 3},
  {x: 1500, dir: -1, grab: 40, id: 'townsman', seed: 4},
];
/** Hat off with a low lift (the kit's doffHat lifts beyond an adult arm at this scale): brim up a little,
 *  then down to the chest; the near hand stays on the brim edge throughout. */
function doff(f: number, pl: Placement, base: Pose, grab: number) {
  const hw = headWorld(pl, base);
  const s = pl.scale ?? 1;
  const dir = pl.dir ?? 1;
  const onHead: PropXf = {x: hw.x, y: hw.y - hw.r * 0.66, rot: 0, s};
  const lift: PropXf = {x: onHead.x + 24 * dir * s, y: onHead.y + 20 * s, rot: dir * -16, s};
  const chest = toWorld(pl, {x: 30, y: solveSkeleton(base).sh.y + 40});
  const chestXf: PropXf = {x: chest.x, y: chest.y, rot: dir * -72, s};
  const keys: [number, PropXf][] = [[grab, onHead], [grab + 10, lift], [grab + 30, chestXf]];
  const out = grabCarry(f, pl, base, base, {grips: {handle: {x: 34 * dir, y: 0}}}, keys, grab, 1e9, 'R', undefined, 10, 'hat');
  return {...out, onHead: f < grab};
}
/** f = frames since the station part started. */
export function solveStation(f: number): Solved {
  const figs: Fig[] = [];
  const checks: Check[] = [];
  const hats: PropXf[] = [];
  for (const m of DOFFERS) {
    const pl: Placement = {x: m.x, y: STATION_FLOOR, scale: castScale(m.id, 0.95), dir: m.dir};
    const base = mixPose(stand(f, m.seed), pose({lean: 4, hipL: -5, hipR: 5, headTilt: 12, shL: -6, elL: 6}), prog(f, m.grab + 20, m.grab + 50));
    const out = doff(f, pl, base, m.grab);
    figs.push({id: m.id, pl, P: out.P, noHat: !out.onHead, ex: exprAt(f, [[0, 'solemn'], [m.grab + 30, 'sad']]), look: [m.dir * 0.4, 0.3]});
    hats.push(out.props.hat);
    for (const c of out.contacts) if (f >= m.grab) checks.push(chk(`${m.id}@${m.x} hat`, pl, out.P, 'R', c.target));
  }
  return {figs, checks, seats: [], hats, cam: [[0, 1.05, 960, 560], [120, 1.12, 960, 570]]};
}

// ---------------------------------------------------------------- 10.6 Frederick Douglass, older, at a lectern
export const LECT_FLOOR = 880;
/** Kit lectern (Sets04b, s = 1) at x on the floor: its sloped top runs (x-44, floor-110)…(x+40, floor-134). */
export const LECTERN = {x: 968};
export function solveLectern(f: number): Solved {
  const id = 'douglass';
  const build = castBuild(id);
  const pl: Placement = {x: 900, y: LECT_FLOOR, scale: castScale(id), dir: 1};
  const base = mixPose(stand(f, 9), pose({lean: 6, hipL: -6, hipR: 6, headTilt: -2}), 1);
  const tL: Pt = {x: LECTERN.x - 32, y: LECT_FLOOR - 121};
  const tR: Pt = {x: LECTERN.x - 8, y: LECT_FLOOR - 125};
  const both = handsOn(pl, base, {L: tL, R: tR}, build);
  // one open-hand gesture from 96 to 168 (the near hand leaves the lectern and returns)
  const lift = pose({...both, shR: 62 + Math.sin(f / 9) * 6, elR: 70});
  const gest = f >= 96 && f <= 168;
  const uOut = prog(f, 96, 110);
  const uBack = prog(f, 154, 168);
  let P = both;
  if (gest) P = f < 154 ? approach(both, lift, uOut) : approach(lift, both, uBack);
  const checks: Check[] = [chk('L lectern', pl, P, 'L', tL, build)];
  if (f < 96 || f > 168) checks.push(chk('R lectern', pl, P, 'R', tR, build));
  return {
    figs: [{id, pl, P, build, ex: exprAt(f, [[0, 'solemn'], [60, 'thinking'], [150, 'determined'], [210, 'solemn']]), talking: f > 20 && f < 230 && Math.sin(f / 23) > -0.4, look: [0.5, 0]}],
    checks, seats: [],
    cam: [[0, 1.15, 930, 600], [90, 1.3, 925, 600], [260, 1.75, 915, 625]],
  };
}

export const SHOTS = [
  {id: 's10-station', dur: D10.train - STATION_AT},
  {id: 's10-lectern', dur: D10.debate},
];
export const SOLVERS: Record<string, (f: number) => Solved> = {'s10-station': solveStation, 's10-lectern': solveLectern};
export const camZoom = (cam: Solved['cam'], f: number) => kf(f, cam.map((k) => [k[0], k[1]] as [number, number]));
void clamp;
