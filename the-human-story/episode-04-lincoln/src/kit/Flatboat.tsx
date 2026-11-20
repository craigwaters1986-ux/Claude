// Episode 4 flatboat on a river, with a long setting pole (kit build, shared). Pure solver + drawing.
//
// PUBLIC API
//   polePushFlatboat(f, opts) -> PoleOut   (pure; scripts/check-contacts.mjs evaluates it every frame)
//     opts: {x0: boat world x at f = 0, waterY: world waterline, bedY: world riverbed y (below waterY),
//            v?: drift px/frame (default 1.4), dir?: 1 | -1 (travel direction), s?: boat scale, id?: cast id
//            (default 'abeYoung'), phase?: frame offset into the poling cycle}
//     The poler plants the pole tip on the riverbed near the bow, then WALKS THE DECK towards the stern leaning on
//     the pole (feet planted on the moving deck, tip fixed on the bed in world space), lifts it out, turns, walks
//     back to the bow trailing the pole, turns and plants again (cycle POLE_CYCLE frames).
//     Returns {boat: {x, y, s, dir} (draw <Flatboat pl={boat} …/>), fig: {pl, P, build, id}, pole: {tip, top},
//              grips: {R, L}, checks: [{label, hand, grip}] (hands on the pole, ≤ 3 px), planted: boolean}
//     Camera tracking with the current: follow boatX(f, opts).
//   <Flatboat pl f cargo? />                  hull, deck, cabin, stern sweep oar (bobbing is in pl.y from the solver)
//   <Pole out={…} />                          the setting pole (draw after the figure)
//   <RiverWater f y0 bed x0? x1? night? />    translucent water band (draw LAST over hull bottom and submerged pole)
//   <RiverBed f bed y0 />                     riverbed and murky depths (draw FIRST)
//   <RiverBank f y side='far' color />        far bank strip with trees; <MistBand f y op /> dawn mist
//
// USAGE
//   const o = {x0: 300, waterY: 700, bedY: 880, v: 1.4, id: 'abeYoung'};
//   const p = polePushFlatboat(f, o);
//   <CineCam f={f} keys={[[0, 1, 960 + boatX(0, o) - 300, 560], [d, 1, 960 + boatX(d, o) - 300, 560]]}>…
//     <RiverBed f={f} bed={o.bedY} y0={o.waterY} />  <Flatboat pl={p.boat} f={f} />
//     <Person id="abeYoung" x={p.fig.pl.x} y={p.fig.pl.y} scale={p.fig.pl.scale / castScale('abeYoung')} dir={p.fig.pl.dir} pose={p.fig.P} f={f} shadow={false} />
//     <Pole out={p} />  <RiverWater f={f} y0={o.waterY} bed={o.bedY} />
import React from 'react';
import {C} from '../styles/theme';
import {Pose, stand, mixPose} from '../characters/poses';
import {Build, handWorld, Placement, Pt, solveSkeleton, toWorld} from '../characters/skeleton';
import {parishWalk} from '../characters/parishWalk';
import {clamp, easeInOut, hash, noise1} from '../animations/core';
import {handsOn} from './Props';
import {castBuild, castScale} from './Cast';
import {Tree} from '../components/Environment';

const ink = C.ink;
const o = (w = 4) => ({stroke: ink, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});

export const FLATBOAT = {bow: 420, stern: -420, deck: -40, draft: 22, cabin: [-410, -150] as [number, number], cabinH: 104, walkBow: 330, walkStern: -70};
const PLANT = 14;
const PUSH = 150;
const LIFT = 14;
const TURN = 8;
const RET = 110;
export const POLE_CYCLE = PLANT + PUSH + LIFT + TURN + RET + TURN;

export type PoleOpts = {x0: number; waterY: number; bedY: number; v?: number; dir?: 1 | -1; s?: number; id?: string; phase?: number};
export type PoleOut = {
  boat: Placement; fig: {pl: Placement; P: Pose; build: Build; id: string}; pole: {tip: Pt; top: Pt}; grips: {R: Pt; L: Pt};
  checks: {label: string; hand: Pt; grip: Pt}[]; planted: boolean;
};

const bobAt = (f: number) => Math.sin(f / 22) * 3 + Math.sin(f / 9.3) * 0.8;
export const boatX = (f: number, op: PoleOpts) => op.x0 + (op.dir ?? 1) * (op.v ?? 1.4) * f;

/** Deck position (boat local x) of the poler and the facing at cycle frame c. */
function deckAt(c: number) {
  const D = FLATBOAT.walkBow - FLATBOAT.walkStern;
  if (c < PLANT) return {x: FLATBOAT.walkBow, walked: 0, face: -1, mode: 'plant' as const, u: c / PLANT};
  c -= PLANT;
  if (c < PUSH) return {x: FLATBOAT.walkBow - (D * c) / PUSH, walked: (D * c) / PUSH, face: -1, mode: 'push' as const, u: c / PUSH};
  c -= PUSH;
  if (c < LIFT) return {x: FLATBOAT.walkStern, walked: D, face: -1, mode: 'lift' as const, u: c / LIFT};
  c -= LIFT;
  if (c < TURN) return {x: FLATBOAT.walkStern, walked: D, face: c < TURN / 2 ? -1 : 1, mode: 'turn1' as const, u: c / TURN};
  c -= TURN;
  if (c < RET) return {x: FLATBOAT.walkStern + (D * c) / RET, walked: D + (D * c) / RET, face: 1, mode: 'ret' as const, u: c / RET};
  c -= RET;
  return {x: FLATBOAT.walkBow, walked: 2 * D, face: c < TURN / 2 ? 1 : -1, mode: 'turn2' as const, u: c / TURN};
}

export function polePushFlatboat(f: number, op: PoleOpts): PoleOut {
  const B = op.dir ?? 1;
  const s = op.s ?? 1;
  const v = op.v ?? 1.4;
  const id = op.id ?? 'abeYoung';
  const build = castBuild(id);
  const fs = castScale(id) * s;
  const g = f + (op.phase ?? 0);
  const n = Math.floor(g / POLE_CYCLE);
  const c = g - n * POLE_CYCLE;
  const boatAt = (ff: number): Placement => ({x: boatX(ff, op), y: op.waterY + bobAt(ff) * s, scale: s, dir: B});
  const boat = boatAt(f);
  const st = deckAt(c);
  const deckY = (pl: Placement) => pl.y + FLATBOAT.deck * s;
  // figure pose: walk while pushing / returning, stand otherwise; lean into the pole while pushing
  const stepLocal = (st.walked * s) / fs;
  let P: Pose;
  if (st.mode === 'push' || st.mode === 'ret') {
    P = parishWalk(stepLocal, build ?? false, 0.1, 0);
    const ramp = Math.min(clamp(st.u * 6), clamp((1 - st.u) * 6));
    P = mixPose(stand(f, 4), P, ramp);
  } else P = stand(f, 4);
  const lean = st.mode === 'push' ? 14 * Math.sin(Math.PI * Math.min(1, st.u * 1.6)) + 6 : st.mode === 'plant' ? 6 * st.u : st.mode === 'lift' ? 6 * (1 - st.u) : 0;
  P = {...P, lean: P.lean + lean, headTilt: P.headTilt + lean * 0.3};
  const figDir = (st.face * B) as 1 | -1;
  const figPl: Placement = {x: boat.x + B * st.x * s, y: deckY(boat), scale: fs, dir: figDir};
  const sk = solveSkeleton(P, build);
  const S = toWorld(figPl, sk.sh);
  const A = {x: S.x - B * 14 * fs, y: S.y + 22 * fs};
  // tip: planted on the bed during push (fixed in world: the point chosen when the push began)
  const plantTip = (cycleStart: number): Pt => {
    const pb = boatAt(cycleStart + PLANT);
    const sx = pb.x + B * FLATBOAT.walkBow * s;
    return {x: sx - B * 175 * fs, y: op.bedY};
  };
  const cycStart = n * POLE_CYCLE - (op.phase ?? 0);
  const T = plantTip(cycStart);
  const carry = (a: Pt): Pt => ({x: a.x - B * 250 * fs * Math.cos(0.55), y: a.y + 250 * fs * Math.sin(0.55)});
  let tip: Pt;
  let planted = false;
  if (st.mode === 'plant') {
    const k = easeInOut(clamp(st.u));
    const from = carry(A);
    tip = {x: from.x + (T.x - from.x) * k, y: from.y + (T.y - from.y) * k};
  } else if (st.mode === 'push') {
    tip = T;
    planted = true;
  } else if (st.mode === 'lift') {
    const k = easeInOut(clamp(st.u));
    const to = carry(A);
    tip = {x: T.x + (to.x - T.x) * k, y: T.y + (to.y - T.y) * k};
  } else tip = carry(A);
  const len = Math.hypot(A.x - tip.x, A.y - tip.y);
  const u = {x: (A.x - tip.x) / len, y: (A.y - tip.y) / len};
  const gUp = A;
  const gLo = {x: A.x - u.x * 50 * fs, y: A.y - u.y * 50 * fs};
  const top = {x: tip.x + u.x * (len + 150 * fs), y: tip.y + u.y * (len + 150 * fs)};
  // near hand (R) low on the pole, far hand (L) high
  const Pg = handsOn(figPl, P, {R: gLo, L: gUp}, build);
  const checks: {label: string; hand: Pt; grip: Pt}[] = [
    {label: 'R pole', hand: handWorld(figPl, Pg, 'R', build), grip: gLo},
    {label: 'L pole', hand: handWorld(figPl, Pg, 'L', build), grip: gUp},
  ];
  if (planted) checks.push({label: 'pole tip bed', hand: tip, grip: {x: T.x, y: op.bedY}});
  return {boat, fig: {pl: figPl, P: Pg, build, id}, pole: {tip, top}, grips: {R: gLo, L: gUp}, checks, planted};
}

// ------------------------------------------------------------------ drawing
/** The flatboat (side view). Origin = waterline at the hull centre. */
export const Flatboat: React.FC<{pl: Placement; f: number; cargo?: boolean}> = ({pl, f, cargo = true}) => {
  const s = pl.scale ?? 1;
  const dir = pl.dir ?? 1;
  const F = FLATBOAT;
  const sweep = Math.sin(f / 40) * 3;
  return (
    <g transform={`translate(${pl.x},${pl.y}) scale(${s * dir},${s})`}>
      {/* stern sweep oar */}
      <path d={`M${F.stern + 10},${F.deck - 70} L${F.stern - 190},${F.draft + 10 + sweep}`} stroke={ink} strokeWidth={11} strokeLinecap="round" />
      <path d={`M${F.stern + 10},${F.deck - 70} L${F.stern - 190},${F.draft + 10 + sweep}`} stroke="#9A7046" strokeWidth={6} strokeLinecap="round" />
      <path d={`M${F.stern - 150},${F.draft - 4 + sweep * 0.8} l-50,${16 + sweep * 0.2} l6,12 l50,-14Z`} fill="#9A7046" {...o(3)} />
      {/* hull */}
      <path d={`M${F.stern - 10},${F.deck} L${F.bow + 10},${F.deck} L${F.bow - 14},${F.draft} L${F.stern + 14},${F.draft}Z`} fill="#7A5536" {...o(5)} />
      {[0, 1, 2].map((i) => <line key={i} x1={F.stern + 4} y1={F.deck + 14 + i * 14} x2={F.bow - 4} y2={F.deck + 14 + i * 14} stroke="#4E3420" strokeWidth={2.5} />)}
      <rect x={F.stern - 12} y={F.deck - 10} width={F.bow - F.stern + 24} height={10} fill="#9A7046" {...o(3.5)} />
      {/* cabin */}
      <rect x={F.cabin[0]} y={F.deck - 10 - F.cabinH} width={F.cabin[1] - F.cabin[0]} height={F.cabinH} fill="#8A6440" {...o(4.5)} />
      {Array.from({length: 5}, (_, i) => <line key={i} x1={F.cabin[0] + 4} y1={F.deck - 26 - i * 18} x2={F.cabin[1] - 4} y2={F.deck - 26 - i * 18} stroke="#5E4128" strokeWidth={2.5} />)}
      <path d={`M${F.cabin[0] - 12},${F.deck - 10 - F.cabinH} Q${(F.cabin[0] + F.cabin[1]) / 2},${F.deck - 30 - F.cabinH} ${F.cabin[1] + 12},${F.deck - 10 - F.cabinH}Z`} fill="#6E4C30" {...o(4)} />
      <rect x={F.cabin[1] - 44} y={F.deck - 70} width={28} height={60} fill="#3A2818" {...o(3)} />
      <rect x={F.cabin[0] + 30} y={F.deck - 18 - F.cabinH + 30} width={30} height={22} fill="#F2B04A" opacity={0.55} {...o(3)} />
      {cargo && (
        <g>
          {[-370, -330, -290, -250].map((x, i) => (
            <g key={x} transform={`translate(${x},${F.deck - 10 - F.cabinH - 14 + (i % 2) * 2})`}>
              <rect x={-17} y={-26} width={34} height={40} rx={8} fill="#A8865A" {...o(3)} />
              <path d="M-17,-12 H17 M-17,2 H17" stroke="#5E4128" strokeWidth={3} />
            </g>
          ))}
          <rect x={F.bow - 44} y={F.deck - 46} width={36} height={36} fill="#B89A6A" {...o(3)} />
        </g>
      )}
    </g>
  );
};

/** The setting pole (draw after the poler). */
export const Pole: React.FC<{out: PoleOut}> = ({out}) => {
  const {tip, top} = out.pole;
  return (
    <g>
      <path d={`M${tip.x},${tip.y} L${top.x},${top.y}`} stroke={ink} strokeWidth={10} strokeLinecap="round" />
      <path d={`M${tip.x},${tip.y} L${top.x},${top.y}`} stroke="#B08A5A" strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

/** Riverbed and the dark depths (draw first). */
export const RiverBed: React.FC<{f: number; bed: number; y0: number; color?: string; x0?: number; x1?: number}> = ({bed, y0, color = '#3E5A5E', x0 = -2000, x1 = 6000}) => (
  <g>
    <rect x={x0} y={y0} width={x1 - x0} height={bed - y0 + 600} fill={color} />
    <rect x={x0} y={bed} width={x1 - x0} height={600} fill="#5A4A36" />
    <path d={`M${x0},${bed} ${Array.from({length: Math.ceil((x1 - x0) / 80)}, (_, i) => `L${x0 + i * 80},${bed - 6 * hash(i)}`).join(' ')} L${x1},${bed}`} fill="none" stroke={ink} strokeWidth={4} />
    {Array.from({length: Math.ceil((x1 - x0) / 140)}, (_, i) => <ellipse key={i} cx={x0 + i * 140 + 40 * hash(i + 3)} cy={bed + 14 + 10 * hash(i + 9)} rx={14 + 8 * hash(i)} ry={6} fill="#6E5C44" />)}
  </g>
);

/** Translucent water over the submerged parts, with a moving surface line and ripples (draw last). */
export const RiverWater: React.FC<{f: number; y0: number; bed: number; x0?: number; x1?: number; night?: boolean; flow?: number}> = ({f, y0, bed, x0 = -2000, x1 = 6000, night, flow = 1}) => {
  const col = night ? '#2A3A50' : '#6F98A4';
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += 40) pts.push(`${x},${y0 + Math.sin(x / 70 + f / 9) * 3}`);
  return (
    <g>
      <path d={`M${pts.join(' L')} L${x1},${bed + 40} L${x0},${bed + 40}Z`} fill={col} opacity={0.62} />
      <path d={`M${pts.join(' L')}`} fill="none" stroke="#DDEBEA" strokeWidth={4} opacity={0.8} />
      {Array.from({length: Math.ceil((x1 - x0) / 160)}, (_, i) => {
        const x = x0 + ((i * 160 + f * 1.2 * flow) % (x1 - x0));
        const y = y0 + 22 + (i % 4) * 22;
        return <path key={i} d={`M${x},${y} q20,-6 40,0`} stroke="#CFE2E2" strokeWidth={3} fill="none" opacity={0.45} />;
      })}
    </g>
  );
};

/** Far bank with a tree line (a plane; give it a low parallax depth). */
export const RiverBank: React.FC<{f: number; y: number; color?: string; tree?: string; seed?: number; x0?: number; x1?: number}> = ({f, y, color = '#7A7A48', tree = '#5E6A32', seed = 3, x0 = -1200, x1 = 4200}) => (
  <g>
    {Array.from({length: Math.ceil((x1 - x0) / 120)}, (_, i) => <Tree key={i} x={x0 + i * 120 + 50 * hash(i + seed)} y={y + 6} s={0.8 + 0.5 * hash(i * 3 + seed)} color={tree} f={f} seed={i + seed} kind={hash(i + seed * 2) > 0.7 ? 'pine' : 'round'} />)}
    <path d={`M${x0},${y} ${Array.from({length: Math.ceil((x1 - x0) / 90)}, (_, i) => `L${x0 + i * 90},${y - 8 * hash(i + seed)}`).join(' ')} L${x1},${y} L${x1},${y + 30} L${x0},${y + 30}Z`} fill={color} stroke={ink} strokeWidth={3} />
  </g>
);

/** Soft drifting mist band (dawn river). */
export const MistBand: React.FC<{f: number; y: number; op?: number; seed?: number}> = ({f, y, op = 0.35, seed = 1}) => (
  <g opacity={op} pointerEvents="none">
    {Array.from({length: 9}, (_, i) => <ellipse key={i} cx={-600 + i * 520 + ((f * 0.5 + noise1(i, seed) * 200) % 520)} cy={y + noise1(i * 2.1, seed) * 18} rx={360} ry={34} fill="#F4F0E8" />)}
  </g>
);
