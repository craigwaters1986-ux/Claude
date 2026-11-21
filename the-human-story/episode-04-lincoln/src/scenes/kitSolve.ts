// Kit test reel (KitTest): pure per-shot solvers for the moving kit pieces (horse + rider, ox wagon + driver,
// flatboat poling, flag halyard). Drawn by KitTest.tsx and measured every frame by scripts/check-contacts.mjs.
import {kf} from '../animations/core';
import {Placement, Pt} from '../characters/skeleton';
import {Pose} from '../characters/poses';
import {Build} from '../characters/skeleton';
import {rideHorse, walkDist, wagonRig, quadPlants, RideOut} from '../kit/Horse';
import {polePushFlatboat, PoleOpts, boatX, POLE_CYCLE} from '../kit/Flatboat';
import {raiseFlag} from '../kit/Flag';
import {seatPose, hipWorldY, feetWorld} from '../kit/Seats';
import {castBuild, castScale} from '../kit/Cast';
import type {CamKey} from '../kit/Cinema';

export type Check = {label: string; hand: Pt; grip: Pt};
export type SeatCheck = {x: number; hipY: number; seatY: number; feet: Pt[]; floor: number};
export type KFig = {id: string; pl: Placement; P: Pose; build?: Build};
export type KSolved = {figs: KFig[]; checks: Check[]; seats: SeatCheck[]; cam: CamKey[]; [k: string]: unknown};

export const KIT_SOLVED_SHOTS = [
  {id: 'kit-ride', dur: 160},
  {id: 'kit-wagon', dur: 140},
  {id: 'kit-flatboat', dur: POLE_CYCLE + 20},
  {id: 'kit-flag', dur: 180},
] as const;

// ---------------------------------------------------------------- ride: Lincoln rides into town with saddlebags
export const RIDE_GROUND = 860;
export function solveRide(f: number): KSolved & {r: RideOut; d: number} {
  const d = walkDist(f, 6, 130, 2.6);
  const r = rideHorse(d, {horse: {x0: 320, y: RIDE_GROUND, s: 1, dir: 1}, riderId: 'abeLawyer', f, amp: Math.min(1, (walkDist(f + 1, 6, 130, 2.6) - d) / 2.6 + 0.02)});
  return {
    figs: [{id: 'abeLawyer', pl: r.rider.pl, P: r.rider.P, build: r.rider.build}],
    checks: [...r.checks, ...r.plants], seats: [], r, d,
    cam: [[0, 1.0, 560, 600], [160, 1.2, 720, 560]],
  };
}

// ---------------------------------------------------------------- wagon: ox team, seated driver
export const WAGON_GROUND = 880;
export function solveWagon(f: number) {
  const d = walkDist(f, 0, 110, 1.8);
  const amp = Math.min(1, (walkDist(f + 1, 0, 110, 1.8) - d) / 1.8 + 0.02);
  const w = wagonRig(d, {x0: 260, y: WAGON_GROUND, s: 0.9, dir: 1, team: 'ox', f, amp});
  const id = 'sarahBush';
  const build = castBuild(id);
  const sc = castScale(id) * 0.9;
  const pl: Placement = {x: w.seat.x, y: w.footboard.y, scale: sc, dir: 1};
  const h = w.footboard.y - w.seat.y;
  const P = seatPose(pl, h, build, f, 3, {lean: 6, hipR: 70, shR: 40, elR: 60, shL: 30, elL: 60});
  const seats: SeatCheck[] = [{x: pl.x, hipY: hipWorldY(pl, P, build), seatY: w.seat.y, feet: feetWorld(pl, P, build), floor: w.footboard.y}];
  const plants = w.team.flatMap((t, i) => quadPlants(t.pl, t.rig, `ox${i}`));
  return {figs: [{id, pl, P, build}], checks: plants, seats, w, d, cam: [[0, 1.0, 900, 600], [140, 1.1, 1100, 600]] as CamKey[]};
}

// ---------------------------------------------------------------- flatboat: one full poling cycle
export const BOAT_OPTS: PoleOpts = {x0: 700, waterY: 700, bedY: 930, v: 1.3, dir: 1, s: 1, id: 'abeYoung'};
export function solveFlatboat(f: number) {
  const p = polePushFlatboat(f, BOAT_OPTS);
  const bx = boatX(f, BOAT_OPTS);
  return {figs: [{id: 'abeYoung', pl: p.fig.pl, P: p.fig.P, build: p.fig.build}], checks: p.checks, seats: [] as SeatCheck[], p, cam: [[0, 0.95, bx - 40, 600], [1, 0.95, bx - 40, 600]] as CamKey[]};
}

// ---------------------------------------------------------------- flag: hauled up, then lowered
export const FLAG_POLE = {x: 1000, base: 860, h: 560};
export function solveFlag(f: number) {
  const t = f < 100 ? kf(f, [[10, 0], [92, 1]]) : kf(f, [[110, 1], [176, 0]]);
  const out = raiseFlag(f, t, {pole: FLAG_POLE, fig: {id: 'unionSoldier', x: 940, y: 860, dir: 1}});
  return {figs: [{id: 'unionSoldier', pl: out.fig!.pl, P: out.fig!.P, build: out.fig!.build}], checks: out.checks, seats: [] as SeatCheck[], out, cam: [[0, 1.0, 1000, 540], [180, 1.15, 1000, 520]] as CamKey[]};
}

export const KIT_SOLVERS: Record<string, (f: number) => {checks: Check[]; seats: SeatCheck[]; cam: CamKey[]}> = {'kit-ride': solveRide, 'kit-wagon': solveWagon, 'kit-flatboat': solveFlatboat, 'kit-flag': solveFlag};
export const camZoom = (cam: CamKey[], f: number) => kf(f, cam.map((k) => [k[0], k[1]] as [number, number]));
// the checker reads SHOTS / SOLVERS (same shape as reelSolve)
export const SHOTS = KIT_SOLVED_SHOTS;
export const SOLVERS = KIT_SOLVERS;
