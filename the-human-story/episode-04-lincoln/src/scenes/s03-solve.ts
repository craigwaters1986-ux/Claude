// Chapter 3 "The rail-splitter": pure per-shot solvers (poses, props, camera, contact checks).
// Drawn by S03.tsx and measured frame by frame by scripts/check-contacts.mjs.
import {Pose, pose, stand, mixPose} from '../characters/poses';
import {Placement, Pt, headWorld, solveSkeleton} from '../characters/skeleton';
import {clamp, easeInOut, kf, lerp, prog} from '../animations/core';
import {AXE, gripWorld, handsOn, approach, PropXf} from '../kit/Props';
import {chopRail, chopImpactPoint, grabCarry, exprAt, track, CHOP_CYCLE} from '../kit/Actions';
import {castBuild, castScale} from '../kit/Cast';
import {T, sectionWindow, FPS} from '../timeline';
import type {CamKey} from '../kit/Cinema';
import type {Fig, Solved, Check} from './reelSolve';
import {chk} from './s02-solve';
import {SACK, LETTER} from './s02-parts';
import {polePushFlatboat, boatX, PoleOpts} from '../kit/Flatboat';

export type {Fig, Solved};

// ---------------------------------------------------------------- shot times (programme seconds)
const [S, E] = sectionWindow('s03');
export const AT03 = {
  river: S, // 3.1 title plate in beat 0, flatboat at dawn
  map: T('helped take a flatboat') + 0.07, // 3.2 the route to New Orleans
  rails: T('In 1830') - 0.21, // 3.3 Illinois, splitting rails
  orleans: T('Rails like these'), // 3.4 the campaign rail, then New Orleans at dusk
  salem: T('At New Salem') - 0.3, // 3.5 store clerk, postmaster, surveyor
  captain: T('In the Black Hawk War') + 1.45, // 3.6 elected captain
  end: E,
};
const ORDER = ['river', 'map', 'rails', 'orleans', 'salem', 'captain'] as const;
export const DUR03: Record<string, number> = Object.fromEntries(ORDER.map((k, i) => [k, Math.round(((i + 1 < ORDER.length ? AT03[ORDER[i + 1]] : AT03.end) - AT03[k]) * FPS)]));
export const lf3 = (t: number, shot: keyof typeof AT03) => Math.round((t - AT03[shot]) * FPS);

// ---------------------------------------------------------------- 3.1 river at dawn: the flatboat (kit polePushFlatboat)
export const RIVER_OPTS: PoleOpts = {x0: 760, waterY: 700, bedY: 900, v: 1.4, dir: 1, s: 0.9, id: 'abeYoung', phase: 20};
export function solveRiver(f: number): Solved {
  const d = DUR03.river;
  const p = polePushFlatboat(f, RIVER_OPTS);
  const bx0 = boatX(0, RIVER_OPTS);
  const bx1 = boatX(d, RIVER_OPTS);
  return {
    figs: [{id: p.fig.id, pl: p.fig.pl, P: p.fig.P, build: p.fig.build, ex: exprAt(f, [[0, 'determined'], [120, 'neutral']]), look: [0.8, 0.2], tag: f >= 96 && f < d - 4}],
    checks: p.checks, seats: [], pole: p,
    // title plate (0–90): wider and lower so the poler sits below the title, then settle on the boat
    cam: [[0, 0.95, bx0 + 120, 340], [80, 0.98, boatX(80, RIVER_OPTS) + 120, 360], [118, 1.12, boatX(118, RIVER_OPTS) + 120, 560], [d, 1.22, bx1 + 100, 580]],
  };
}

// ---------------------------------------------------------------- 3.3 Illinois clearing: splitting rails (test-reel staging)
export const RAILS_FLOOR = 860;
export function solveRails(f: number): Solved {
  const d = DUR03.rails;
  const id = 'abeYoung';
  const build = castBuild(id);
  const pl: Placement = {x: 860, y: RAILS_FLOOR, scale: castScale(id), dir: 1};
  const start = 12;
  const out = chopRail(f, pl, build, start);
  const impact = chopImpactPoint(pl, build);
  const ax = out.props.axe;
  const impacts = [0, 1, 2, 3].map((k) => start + k * CHOP_CYCLE + 31);
  const nImp = impacts.filter((i) => f >= i).length;
  const ex = exprAt(f, [[0, 'determined'], [impacts[0] + 2, 'grim'], [impacts[0] + 12, 'determined'], [impacts[2] + 2, 'grim'], [impacts[2] + 12, 'determined']]);
  return {
    figs: [{id, pl, P: out.P, build, ex}],
    checks: [chk('R axe', pl, out.P, 'R', gripWorld(ax, AXE.grips.handle!), build), chk('L axe', pl, out.P, 'L', gripWorld(ax, AXE.grips.grip2!), build)],
    seats: [], axe: ax, impact, impacts, split: Math.min(1, (nImp % 2) / 1 + (nImp >= 2 ? 0 : 0)), rails: 2 + Math.floor(nImp / 2), nImp,
    cam: [[0, 1.0, 1000, 520], [60, 1.05, 990, 530], [d, 1.45, impact.x - 60, 600]],
  };
}

// ---------------------------------------------------------------- 3.5 New Salem: store clerk, postmaster, surveyor (one tracking move)
export const SALEM_FLOOR = 860;
export const SALEM = {a: 640, b: 1900, c: 3160};
export function solveSalem(f: number): Solved {
  const d = DUR03.salem;
  const id = 'abeYoung';
  const build = castBuild(id);
  const s = castScale(id, 1.1);
  const fl = SALEM_FLOOR;
  const checks: Check[] = [];
  // A · store: lift a sack off a crate and set it on the counter
  const plA: Placement = {x: SALEM.a, y: fl, scale: s, dir: 1};
  const crateTop = fl - 112;
  const counterTop = fl - 186;
  const onCrate: PropXf = {x: SALEM.a + 92, y: crateTop - 30, rot: 0, s: 1};
  const lifted: PropXf = {x: SALEM.a + 104, y: crateTop - 92, rot: -6, s: 1};
  const onCounter: PropXf = {x: SALEM.a + 120, y: counterTop - 30, rot: 0, s: 1};
  const leanA = kf(f, [[0, 6], [14, 26], [22, 26], [36, 12], [50, 16], [58, 16], [70, 6]]);
  const baseA = pose({...stand(f, 2), lean: leanA, hipL: -10, hipR: 12, kneeL: 10 * (leanA / 26), kneeR: 8 * (leanA / 26), headTilt: 8});
  const grab = 18;
  const put = 56;
  const sack = grabCarry(f, plA, baseA, baseA, {grips: {handle: SACK.grips.handle!, grip2: SACK.grips.grip2!}}, [[grab, onCrate], [grab + 18, lifted], [put, onCounter]], grab, put, 'both', build, 12, 'sack');
  if (f >= grab && f <= put) checks.push(chk('A R sack', plA, sack.P, 'R', gripWorld(sack.props.sack, SACK.grips.handle!), build), chk('A L sack', plA, sack.P, 'L', gripWorld(sack.props.sack, SACK.grips.grip2!), build));
  // B · post office: letters from the mailbag to the sorted pile
  const plB: Placement = {x: SALEM.b, y: fl, scale: s, dir: 1};
  const tableTop = fl - 176;
  const mouth = {x: SALEM.b + 76, y: tableTop - 58};
  const pile = {x: SALEM.b + 124, y: tableTop - 10};
  const bagRim = {x: SALEM.b + 96, y: tableTop - 56};
  const g0 = 46;
  const cyc = 34;
  const gb = Math.max(0, f - g0);
  const c = gb % cyc;
  const nSorted = f < g0 ? 0 : Math.floor(gb / cyc);
  const held = c < 22;
  const pathPt = c < 8 ? mouth : c < 22 ? {x: lerp(mouth.x, pile.x, easeInOut((c - 8) / 14)), y: lerp(mouth.y, pile.y, easeInOut((c - 8) / 14)) - Math.sin(Math.PI * (c - 8) / 14) * 26} : {x: lerp(pile.x, mouth.x, easeInOut((c - 22) / 12)), y: lerp(pile.y, mouth.y, easeInOut((c - 22) / 12)) - Math.sin(Math.PI * (c - 22) / 12) * 20};
  const letter: PropXf = {x: pathPt.x + 12, y: pathPt.y - 2, rot: c < 22 ? -10 + (c - 8) * 0.8 : 0, s: 1.3};
  const gL = gripWorld(letter, LETTER.grips.handle!);
  const baseB = pose({...stand(f, 4), lean: 16, hipL: -8, hipR: 10, headTilt: 12});
  const PB = handsOn(plB, baseB, {R: f < g0 ? gripWorld({...letter, x: mouth.x + 12, y: mouth.y - 2}, LETTER.grips.handle!) : gL, L: bagRim}, build);
  checks.push(chk('B L bag', plB, PB, 'L', bagRim, build));
  if (f >= g0 && held) checks.push(chk('B R letter', plB, PB, 'R', gL, build));
  // C · surveyor: the chain held taut at the waist, sighting along it
  const plC: Placement = {x: SALEM.c, y: fl, scale: s, dir: 1};
  const pull = Math.sin(f / 16) * 4;
  const cR = {x: SALEM.c + 70 - pull, y: fl - 196};
  const cL = {x: SALEM.c + 44 - pull, y: fl - 190};
  const baseC = pose({...stand(f, 6), lean: -4, hipL: -12, hipR: 14, kneeR: 6, headTilt: 4});
  const PC = handsOn(plC, baseC, {R: cR, L: cL}, build);
  checks.push(chk('C R chain', plC, PC, 'R', cR, build), chk('C L chain', plC, PC, 'L', cL, build));
  const hA = headWorld(plA, sack.P, build);
  return {
    figs: [
      {id, pl: plA, P: sack.P, build, ex: exprAt(f, [[0, 'neutral'], [18, 'determined'], [58, 'happy']]), look: [0.7, 0.6], tag: f >= 4 && f < 64},
      {id, pl: plB, P: PB, build, ex: exprAt(f, [[0, 'curious'], [90, 'thinking'], [130, 'happy']]), look: [0.6, 0.8]},
      {id, pl: plC, P: PC, build, ex: exprAt(f, [[0, 'thinking'], [150, 'determined']]), look: [1, 0.1]},
    ],
    checks, seats: [], sack: sack.props.sack, sackPlaced: f > put, letter, letterHeld: f >= g0 && held, nSorted, chainR: cR, chainL: cL, headA: hA,
    crateTop, counterTop, tableTop,
    cam: [[0, 1.75, SALEM.a + 60, 600], [44, 1.75, SALEM.a + 130, 600], [70, 1.75, SALEM.b + 40, 600], [118, 1.75, SALEM.b + 110, 600], [140, 1.75, SALEM.c + 120, 600], [d, 1.8, SALEM.c + 200, 600]],
  };
}

// ---------------------------------------------------------------- 3.6 volunteers elect him captain (no battle)
export const CAPT_FLOOR = 860;
export const VOLS = [
  {x: 1060, row: 1, at: 34}, {x: 1270, row: 1, at: 44}, {x: 1480, row: 1, at: 40}, {x: 1690, row: 1, at: 54},
  {x: 980, row: 0, at: 30}, {x: 1180, row: 0, at: 38}, {x: 1390, row: 0, at: 48}, {x: 1600, row: 0, at: 60},
];
export function solveCaptain(f: number): Solved {
  const d = DUR03.captain;
  const id = 'abeYoung';
  const build = castBuild(id);
  const pl: Placement = {x: 700, y: CAPT_FLOOR, scale: castScale(id), dir: 1};
  const P = mixPose(stand(f, 3), pose({lean: -2, hipL: -6, hipR: 6, shL: -4, elL: 10, shR: 6, elR: 14, headTilt: -4}), prog(f, 120, 150));
  const vols: Fig[] = VOLS.map((v, i) => {
    const up = prog(f, v.at, v.at + 12);
    const P2 = mixPose(stand(f, 10 + i), pose({hipL: -5, hipR: 5, shR: 124 + Math.sin(f / 7 + i) * 4, elR: 22, shL: -6, elL: 10, headTilt: -4}), up * (1 - prog(f, 170 + i * 3, 186 + i * 3)));
    const sc = v.row === 1 ? 0.92 : 1.1;
    return {id: 'farmer', pl: {x: v.x, y: CAPT_FLOOR - (v.row === 1 ? 44 : 0), scale: sc, dir: -1}, P: P2, ex: exprAt(f, [[0, 'curious'], [v.at, 'happy']]), look: [-0.9, 0]};
  });
  const hw = headWorld(pl, P, build);
  const tCU = 200;
  return {
    figs: [{id, pl, P, build, ex: exprAt(f, [[0, 'neutral'], [64, 'surprised'], [118, 'relieved'], [tCU + 20, 'happy']]), look: f < 150 ? [0.9, 0] : [0.6, 0.2]}, ...vols],
    checks: [], seats: [], head: hw,
    cam: [[0, 1.0, 1110, 540], [130, 1.04, 1080, 540], [tCU, 2.3, hw.x + 70, hw.y + 50], [d, 2.4, hw.x + 66, hw.y + 50]],
  };
}

// ---------------------------------------------------------------- registry for the contact checker
export const S03_SHOTS = (['river', 'rails', 'salem', 'captain'] as const).map((id) => ({id: 's03-' + id, dur: DUR03[id]}));
export const S03_SOLVERS: Record<string, (f: number) => Solved> = {'s03-river': solveRiver, 's03-rails': solveRails, 's03-salem': solveSalem, 's03-captain': solveCaptain};
export const camZoom = (cam: CamKey[], f: number) => kf(f, cam.map((k) => [k[0], k[1]] as [number, number]));
void clamp; void approach; void track; void solveSkeleton;
export type {Pt, Pose};
