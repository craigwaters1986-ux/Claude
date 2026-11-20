// Episode 4 flagpole, halyard and a waving US flag of 1861 (kit build, shared).
// Simple stars and stripes: 13 stripes, a blue canton with 33 white stars (Fort Sumter, April 1861; pass
// stars={34} from 4 July 1861, 35 from June 1863, 36 from October 1864). Not detailed on purpose.
//
// PUBLIC API
//   raiseFlag(f, t, {pole: {x, base, h, side?}, fig?: {id | build+scale, x, y, dir}}) -> FlagOut   (pure)
//     t 0..1 = how far the flag is up (0 = at the bottom, 1 = at the truck). For the flag coming DOWN pass a
//     falling t (e.g. 1 - prog(f, a, b)). The halyard's hauling line moves exactly opposite to the flag; with a
//     figure, its hands go hand-over-hand on the hauling line (holding hand rides with the rope, the free hand
//     reaches back), contacts ≤ 3 px in `checks`.
//     Returns {flagTop: Pt (hoist top grommet), haulX, fig?: {pl, P, build}, checks, pole}
//   <FlagPole out={…} f wind? stars? />   pole, truck, halyard lines and the waving flag (draw before the figure
//                                         if the figure stands in front of the pole)
//   <Flag1861 x y w h f wind? stars? side? seed? />   the waving cloth alone (hoist edge at x; fly to the right
//                                         for side = 1). Use for flags on buildings, cemetery rows, crowds.
//
// USAGE (flag coming down at a beat, no figure):
//   const out = raiseFlag(f, 1 - prog(f, 30, 120), {pole: {x: 1200, base: 700, h: 420}});
//   <FlagPole out={out} f={f} />
// With a figure hauling: const out = raiseFlag(f, prog(f, 20, 200), {pole, fig: {id: 'unionSoldier', x: 1150, y: 700, dir: 1}});
//   <FlagPole out={out} f={f} />  <Person id="unionSoldier" x={out.fig.pl.x} … pose={out.fig.P} />
import React from 'react';
import {C} from '../styles/theme';
import {Pose, stand} from '../characters/poses';
import {Build, handWorld, Placement, Pt, solveSkeleton, toWorld} from '../characters/skeleton';
import {clamp, noise1} from '../animations/core';
import {handsOn} from './Props';
import {castBuild, castScale} from './Cast';

const ink = C.ink;

export type PoleSpec = {x: number; base: number; h: number; side?: 1 | -1; fw?: number; fh?: number};
export type FlagOut = {pole: Required<PoleSpec>; flagTop: Pt; haulX: number; t: number; fig?: {pl: Placement; P: Pose; build: Build}; checks: {label: string; hand: Pt; grip: Pt}[]};

export function raiseFlag(f: number, t: number, opts: {pole: PoleSpec; fig?: {id?: string; build?: Build; scale?: number; x: number; y: number; dir?: 1 | -1}}): FlagOut {
  const p0 = opts.pole;
  const pole: Required<PoleSpec> = {side: 1, fw: p0.h * 0.42, fh: p0.h * 0.27, ...p0};
  const tc = clamp(t);
  const lowTop = pole.base - 150; // flag hoist top when lowered (bottom grommet just above the cleat)
  const highTop = pole.base - pole.h + 12;
  const flagTop = {x: pole.x + pole.side * 5, y: lowTop + (highTop - lowTop) * tc};
  const haulX = pole.x - pole.side * 9;
  const out: FlagOut = {pole, flagTop, haulX, t: tc, checks: []};
  if (!opts.fig) return out;
  const fg = opts.fig;
  const build = fg.id ? castBuild(fg.id) : fg.build;
  const sc = fg.id ? castScale(fg.id) : fg.scale ?? 1;
  const pl: Placement = {x: fg.x, y: fg.y, scale: sc, dir: fg.dir ?? 1};
  let P = stand(f, 6);
  P = {...P, lean: 4, headTilt: -8};
  const sk = solveSkeleton(P, build);
  const S = toWorld(pl, sk.sh);
  const yH = S.y - 46 * sc; // reach-up grab height
  const K = 80 * sc; // rope pulled per hand
  const travel = (lowTop - flagTop.y); // rope hauled so far (px)
  const k = Math.floor(travel / K);
  const w = (travel - k * K) / K;
  const hold = {x: haulX, y: yH + w * K};
  const free = {x: haulX - (pl.dir ?? 1) * 26 * sc * Math.sin(Math.PI * w), y: yH + K - w * K};
  const holdSide: 'R' | 'L' = k % 2 === 0 ? 'R' : 'L';
  const freeSide: 'R' | 'L' = holdSide === 'R' ? 'L' : 'R';
  P = {...P, lean: 4 + 5 * w, bob: 2 * w};
  P = handsOn(pl, P, {[holdSide]: hold, [freeSide]: free}, build, false);
  out.fig = {pl, P, build};
  out.checks = [{label: `${holdSide} halyard`, hand: handWorld(pl, P, holdSide, build), grip: hold}];
  // the free hand re-grips at the top of its reach: count it as holding in the last/first 10 % too
  if (w < 0.1 || w > 0.9) out.checks.push({label: `${freeSide} halyard`, hand: handWorld(pl, P, freeSide, build), grip: free});
  return out;
}

/** Waving 1861 flag; hoist edge at x (top y), fly towards `side`. */
export const Flag1861: React.FC<{x: number; y: number; w: number; h: number; f: number; wind?: number; stars?: number; side?: 1 | -1; seed?: number}> = ({x, y, w, h, f, wind = 1, stars = 33, side = 1, seed = 1}) => {
  const N = 14;
  const amp = h * 0.09 * wind;
  const P = (u: number, v: number): [number, number] => {
    const ph = u * 5.2 - f / 4.2 + seed + v * 0.6;
    const dy = Math.sin(ph) * amp * u + (1 - wind) * u * u * h * 0.5;
    const dx = -Math.abs(Math.sin(ph)) * w * 0.035 * u * wind - (1 - wind) * u * w * 0.35;
    return [x + side * (u * w + dx), y + v * h + dy + noise1(f / 30 + u, seed) * 1.5 * u];
  };
  const strip = (v0: number, v1: number, u0 = 0, u1 = 1) => {
    const top: string[] = [];
    const bot: string[] = [];
    for (let i = 0; i <= N; i++) {
      const u = u0 + ((u1 - u0) * i) / N;
      top.push(P(u, v0).map((n) => n.toFixed(1)).join(','));
      bot.unshift(P(u, v1).map((n) => n.toFixed(1)).join(','));
    }
    return `M${top.join(' L')} L${bot.join(' L')}Z`;
  };
  const rows = 5;
  const counts = Array.from({length: rows}, () => Math.floor(stars / rows));
  [0, 2, 4, 1, 3].slice(0, stars - counts[0] * rows).forEach((r) => counts[r]++);
  const starPts: [number, number][] = [];
  counts.forEach((cnt, r) => {
    for (let i = 0; i < cnt; i++) starPts.push(P(0.03 + (0.34 * (i + 0.5)) / cnt, 0.05 + (0.44 * (r + 0.5)) / rows));
  });
  return (
    <g>
      {Array.from({length: 13}, (_, i) => <path key={i} d={strip(i / 13, (i + 1) / 13)} fill={i % 2 ? '#F4EFE4' : '#B5352C'} />)}
      <path d={strip(0, 7 / 13, 0, 0.4)} fill="#2E3466" />
      {starPts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={Math.max(1.4, h * 0.016)} fill="#F4EFE4" />)}
      {/* fold shading */}
      {Array.from({length: N}, (_, i) => {
        const u0 = i / N;
        const sl = Math.cos(u0 * 5.2 - f / 4.2 + seed);
        return sl < -0.2 ? <path key={'s' + i} d={strip(0, 1, u0, u0 + 1 / N)} fill="#000" opacity={0.14 * -sl * wind} /> : null;
      })}
      <path d={strip(0, 1)} fill="none" stroke={ink} strokeWidth={Math.max(2.5, h * 0.025)} strokeLinejoin="round" />
    </g>
  );
};

/** Pole, truck, halyard and flag for a raiseFlag() result. */
export const FlagPole: React.FC<{out: FlagOut; f: number; wind?: number; stars?: number; poleColor?: string}> = ({out, f, wind = 1, stars = 33, poleColor = '#D8D0BC'}) => {
  const {pole, flagTop, haulX} = out;
  const top = pole.base - pole.h;
  const fb = flagTop.y + pole.fh;
  const handY = out.fig ? Math.min(...out.checks.map((c) => c.grip.y)) : pole.base - 100;
  const sway = Math.sin(f / 13) * 2;
  return (
    <g>
      {/* hauling line from the pulley to the hands (or the cleat) and slack below */}
      <path d={`M${haulX},${top + 10} L${haulX},${handY}`} stroke="#6A5A44" strokeWidth={2.5} />
      <path d={`M${haulX},${handY} Q${haulX + sway * 3},${(handY + pole.base - 100) / 2 + 30} ${pole.x - pole.side * 4},${pole.base - 100}`} fill="none" stroke="#6A5A44" strokeWidth={2.5} />
      {/* flag-side line: pulley -> hoist top, hoist bottom -> cleat */}
      <path d={`M${pole.x + pole.side * 5},${top + 10} L${flagTop.x},${flagTop.y} M${flagTop.x},${fb} L${pole.x + pole.side * 5},${pole.base - 100}`} stroke="#6A5A44" strokeWidth={2.5} />
      <rect x={pole.x - 7} y={top} width={14} height={pole.h} fill={poleColor} stroke={ink} strokeWidth={4} />
      <circle cx={pole.x} cy={top - 6} r={10} fill={C.gold} stroke={ink} strokeWidth={3.5} />
      <rect x={pole.x - 14} y={pole.base - 106} width={28} height={8} rx={3} fill="#5A5A5E" stroke={ink} strokeWidth={2.5} />
      <Flag1861 x={flagTop.x} y={flagTop.y} w={pole.fw} h={pole.fh} f={f} wind={wind} stars={stars} side={pole.side} />
    </g>
  );
};
