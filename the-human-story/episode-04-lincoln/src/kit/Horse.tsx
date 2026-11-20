// Episode 4 horse (and ox) rig, rider solver and a farm / covered wagon (kit build, shared by all chapters).
// Series style: flat colours, thick ink outline, stick legs with small dark hooves. Pure solver functions (no
// React) so scripts/check-contacts.mjs can evaluate every frame.
//
// RIG (local space, px at s = 1, origin on the ground under the barrel, facing +x, y down; s = 1 matches the
// adult stick figures at scale 1 — a horse stands about 1.5 m at the withers):
//   quadRig(d, {kind: 'horse'|'ox', f, amp}) -> QuadRig      d = distance walked (local px; any easing is fine)
//     Four-beat lateral walk (LH, LF, RH, RF), duty 0.62. In stance a hoof's local x falls exactly as fast as the
//     body moves, so a hoof is PLANTED in the world while d advances; legs are 2-bone IK (knee forward on the
//     forelegs, hock back on the hind legs). Standing still (d constant) the horse breathes, swishes its tail
//     and nods. `amp` 0..1 scales the hoof lift (ease it to 0 when stopping).
//   quadWorld(pl, p) / quadPlants(pl, rig) -> world points; plants = [{label, hoof, target}] for stance legs.
//   <Quad rig pl f kind? coat? mane? saddle? saddlebags? blanket? />     draws a horse or ox.
//
// RIDER:
//   rideHorse(d, {horse: {x0, y, s, dir}, riderId? | build+scale, f, lean?, reinsSlack?}) -> RideOut
//     {horsePl, rig, rider: {pl, P, build}, hands: {R, L}, bit, checks: Check[], plants}
//     The rider's hip is locked to the saddle point every frame (pl derived from it), legs astride (thigh forward,
//     shin down to the stirrup), both hands IK'd onto the rein grip just above the withers (≤ 3 px), reins drawn
//     from the hands to the bit with <Reins>. horsePl.x = x0 + dir * s * d.
//   Draw: <Quad rig={r.rig} pl={r.horsePl} f={f} saddle saddlebags/> then
//         <Person id=… x={r.rider.pl.x} y={r.rider.pl.y} scale={r.rider.pl.scale / castScale(id)} dir={r.rider.pl.dir}
//                 pose={r.rider.P} f={f} shadow={false}/>  then <Reins r={r} />.
//
// WAGON:
//   wagonRig(d, {x0, y, s, dir, team: 'ox' | 'horse', pairs?}) -> {wagonPl, team: [{pl, rig}], seat, footboard, hitch}
//   <Wagon pl d cover? f />  (wheel spokes turn with d; the seat point and footboard are returned by wagonRig)
//   <Yoke a b /> draws the yoke/traces between the team and the wagon tongue.
//
// USAGE:
//   const d = walkDist(f, 0, 200, 2.2);                        // ease-in walk, settle at the end
//   const r = rideHorse(d, {horse: {x0: 300, y: 860, s: 1, dir: 1}, riderId: 'abeLawyer', f});
//   <Quad rig={r.rig} pl={r.horsePl} f={f} saddle saddlebags />
//   <Person id="abeLawyer" … pose={r.rider.P} … shadow={false} />  <Reins r={r} />
import React from 'react';
import {C} from '../styles/theme';
import {Pose, pose} from '../characters/poses';
import {Build, handWorld, Placement, Pt, toWorld, dimsOf} from '../characters/skeleton';
import {noise1} from '../animations/core';
import {handsOn} from './Props';
import {castBuild, castScale} from './Cast';

const ink = C.ink;
const o = (w = 4) => ({stroke: ink, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});

export type QuadKind = 'horse' | 'ox';
type Spec = {fx: number; hx: number; jy: number; seg: number; S: number; duty: number; lift: number; barrel: [number, number, number, number]; saddle: Pt; rein: Pt};
const SPECS: Record<QuadKind, Spec> = {
  // fx/hx: fore/hind leg top x; jy: leg-top height; seg: upper = lower segment; S: stride per cycle
  horse: {fx: 70, hx: -78, jy: -165, seg: 88, S: 150, duty: 0.62, lift: 30, barrel: [0, -196, 118, 46], saddle: {x: -10, y: -240}, rein: {x: 46, y: -268}},
  ox: {fx: 82, hx: -86, jy: -128, seg: 70, S: 120, duty: 0.66, lift: 20, barrel: [0, -168, 132, 58], saddle: {x: 0, y: -226}, rein: {x: 60, y: -230}},
};
export const quadSpec = (k: QuadKind = 'horse') => SPECS[k];

export type Leg = {top: Pt; knee: Pt; hoof: Pt; target: Pt; stance: boolean};
export type QuadRig = {kind: QuadKind; bob: number; neck: number; tail: number; legs: {LF: Leg; RF: Leg; LH: Leg; RH: Leg}; saddle: Pt; rein: Pt; bit: Pt; head: Pt; poll: Pt; neckBase: Pt; d: number};

const OFFS = {LH: 0, LF: 0.25, RH: 0.5, RF: 0.75} as const;
const smooth = (t: number) => t * t * (3 - 2 * t);

function legIK(top: Pt, target: Pt, seg: number, kneeFwd: boolean): {knee: Pt; hoof: Pt} {
  const dx = target.x - top.x;
  const dy = target.y - top.y;
  const dist0 = Math.hypot(dx, dy);
  const dist = Math.min(dist0, seg * 2 - 0.5);
  const ux = dx / dist0;
  const uy = dy / dist0;
  const h = Math.sqrt(Math.max(0, seg * seg - (dist / 2) * (dist / 2)));
  // perpendicular pointing forward (+x) relative to a downward leg is (uy, -ux)... choose by sign
  let px = -uy;
  let py = ux;
  if ((px > 0) !== kneeFwd) { px = -px; py = -py; }
  const mx = top.x + (ux * dist) / 2;
  const my = top.y + (uy * dist) / 2;
  return {knee: {x: mx + px * h, y: my + py * h}, hoof: {x: top.x + ux * dist, y: top.y + uy * dist}};
}

/** Pose a horse / ox for distance walked d (local px). */
export function quadRig(d: number, opts: {kind?: QuadKind; f?: number; amp?: number; seed?: number} = {}): QuadRig {
  const kind = opts.kind ?? 'horse';
  const sp = SPECS[kind];
  const f = opts.f ?? 0;
  const amp = opts.amp ?? 1;
  const seed = opts.seed ?? 1;
  const ph = d / sp.S;
  const bob = 2.5 * Math.cos(ph * Math.PI * 4) * amp + Math.sin(f / 26 + seed) * 1.2; // walk bob + breathing
  const neck = 4 * Math.sin(ph * Math.PI * 4 + 0.6) * amp + noise1(f / 50, seed) * 3;
  const tail = Math.sin(f / 17 + seed) * 6 + noise1(f / 40, seed + 4) * 8;
  const legs = {} as QuadRig['legs'];
  (Object.keys(OFFS) as (keyof typeof OFFS)[]).forEach((k) => {
    const fore = k[1] === 'F';
    const base = fore ? sp.fx : sp.hx;
    const p = (((ph + OFFS[k]) % 1) + 1) % 1;
    const half = (sp.S * sp.duty) / 2;
    let tx: number;
    let ty = 0;
    let stance = true;
    if (p < sp.duty) tx = base + half - sp.S * p;
    else {
      const q = (p - sp.duty) / (1 - sp.duty);
      tx = base - half + 2 * half * smooth(q);
      ty = -Math.sin(Math.PI * q) * sp.lift * amp;
      stance = amp < 0.05;
    }
    const top = {x: base, y: sp.jy + bob};
    const ik = legIK(top, {x: tx, y: ty}, sp.seg, fore);
    legs[k] = {top, knee: ik.knee, hoof: ik.hoof, target: {x: tx, y: ty}, stance};
  });
  const nb = kind === 'horse' ? {x: 86, y: -214 + bob} : {x: 112, y: -176 + bob};
  const a = (neck * Math.PI) / 180;
  const rot = (p: Pt): Pt => ({x: nb.x + (p.x - nb.x) * Math.cos(a) - (p.y - nb.y) * Math.sin(a), y: nb.y + (p.x - nb.x) * Math.sin(a) + (p.y - nb.y) * Math.cos(a)});
  const poll = rot(kind === 'horse' ? {x: 158, y: -318 + bob} : {x: 168, y: -196 + bob});
  const head = rot(kind === 'horse' ? {x: 214, y: -268 + bob} : {x: 210, y: -150 + bob});
  const bit = rot(kind === 'horse' ? {x: 200, y: -272 + bob} : {x: 200, y: -156 + bob});
  return {kind, bob, neck, tail, legs, saddle: {x: sp.saddle.x, y: sp.saddle.y + bob}, rein: {x: sp.rein.x, y: sp.rein.y + bob + neck * 0.4}, bit, head, poll, neckBase: nb, d};
}

export const quadWorld = (pl: Placement, p: Pt): Pt => toWorld(pl, p);
/** Planted-hoof checks (world): the drawn hoof against its ground target, for legs in stance. */
export function quadPlants(pl: Placement, rig: QuadRig, label = 'hoof') {
  return (Object.keys(rig.legs) as (keyof QuadRig['legs'])[]).filter((k) => rig.legs[k].stance).map((k) => ({label: `${label} ${k}`, hand: toWorld(pl, rig.legs[k].hoof), grip: toWorld(pl, rig.legs[k].target)}));
}

/** Eased walk distance: starts at `start`, cruises at `speed` px/frame, eases to a stop at `stop` (24 f). */
export function walkDist(f: number, start: number, stop: number, speed: number, ease = 18): number {
  const g = Math.max(0, f - start);
  const end = stop - start;
  const ramp = (x: number) => (x < ease ? (x * x) / (2 * ease) : x - ease / 2);
  if (g <= end) return speed * ramp(g);
  return speed * (ramp(end) + ease * 0.6 * (1 - Math.exp(-(g - end) / (ease * 0.6))));
}

// ------------------------------------------------------------------ drawing
export type QuadLook = {coat?: string; dark?: string; mane?: string; saddle?: boolean; saddlebags?: boolean; blanket?: string; horns?: boolean};
const LegLine: React.FC<{l: Leg; color: string; w: number; hoof: string}> = ({l, color, w, hoof}) => (
  <g>
    <path d={`M${l.top.x},${l.top.y} L${l.knee.x},${l.knee.y} L${l.hoof.x},${l.hoof.y}`} fill="none" stroke={ink} strokeWidth={w + 6} strokeLinecap="round" strokeLinejoin="round" />
    <path d={`M${l.top.x},${l.top.y} L${l.knee.x},${l.knee.y} L${l.hoof.x},${l.hoof.y}`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    <path d={`M${l.hoof.x - 9},${l.hoof.y + 2} L${l.hoof.x - 7},${l.hoof.y - 10} L${l.hoof.x + 8},${l.hoof.y - 10} L${l.hoof.x + 11},${l.hoof.y + 2}Z`} fill={hoof} {...o(3)} />
  </g>
);

/** Horse or ox in the series style. `pl` = world placement (x, ground y, scale, dir). */
export const Quad: React.FC<{rig: QuadRig; pl: Placement; f?: number} & QuadLook> = ({rig, pl, coat, dark, mane, saddle, saddlebags, blanket, horns}) => {
  const k = rig.kind;
  const sp = SPECS[k];
  const s = pl.scale ?? 1;
  const dir = pl.dir ?? 1;
  const cCoat = coat ?? (k === 'horse' ? '#8A5A3A' : '#9A8466');
  const cDark = dark ?? (k === 'horse' ? '#5E3C26' : '#6E5C46');
  const cMane = mane ?? '#2A1C14';
  const [bx, by, rx, ry] = sp.barrel;
  const B = by + rig.bob;
  const nb = rig.neckBase;
  const w = k === 'horse' ? 14 : 18;
  return (
    <g transform={`translate(${pl.x},${pl.y}) scale(${s * dir},${s})`}>
      <ellipse cx={0} cy={4} rx={rx * 1.05} ry={9} fill="rgba(0,0,0,0.16)" />
      {/* far legs */}
      <LegLine l={rig.legs.LH} color={cDark} w={w} hoof="#2A2420" />
      <LegLine l={rig.legs.LF} color={cDark} w={w} hoof="#2A2420" />
      {/* tail */}
      {k === 'horse' ? (
        <path d={`M${bx - rx + 8},${B - ry + 14} Q${bx - rx - 40},${B - 6 + rig.tail} ${bx - rx - 22 + rig.tail * 0.6},${B + 74} Q${bx - rx - 6},${B + 30} ${bx - rx + 14},${B - ry + 26}Z`} fill={cMane} {...o(3.5)} />
      ) : (
        <g>
          <path d={`M${bx - rx + 6},${B - ry + 16} Q${bx - rx - 18},${B + 20} ${bx - rx - 12 + rig.tail * 0.4},${B + 70}`} fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
          <path d={`M${bx - rx - 18 + rig.tail * 0.4},${B + 66} l6,18 l8,-16Z`} fill={cMane} {...o(2.5)} />
        </g>
      )}
      {/* body */}
      <ellipse cx={bx} cy={B} rx={rx} ry={ry} fill={cCoat} {...o(5)} />
      <ellipse cx={sp.hx + 6} cy={B + 4} rx={46} ry={ry * 0.95} fill={cCoat} {...o(5)} />
      <ellipse cx={sp.fx - 4} cy={B + 6} rx={40} ry={ry * 0.9} fill={cCoat} {...o(5)} />
      <ellipse cx={bx} cy={B} rx={rx - 3} ry={ry - 3} fill={cCoat} />
      {/* neck and head */}
      {k === 'horse' ? (
        <g>
          <path d={`M${nb.x - 40},${nb.y + 30} L${rig.poll.x - 22},${rig.poll.y + 8} Q${rig.poll.x},${rig.poll.y - 14} ${rig.poll.x + 16},${rig.poll.y + 6} L${rig.head.x},${rig.head.y - 10} Q${rig.head.x + 10},${rig.head.y + 8} ${rig.head.x - 10},${rig.head.y + 14} L${rig.poll.x + 4},${rig.poll.y + 42} L${nb.x + 34},${nb.y + 44}Z`} fill={cCoat} {...o(5)} />
          <path d={`M${nb.x - 44},${nb.y + 22} Q${(nb.x + rig.poll.x) / 2 - 30},${(nb.y + rig.poll.y) / 2 - 16} ${rig.poll.x - 10},${rig.poll.y - 4}`} fill="none" stroke={cMane} strokeWidth={14} strokeLinecap="round" />
          <path d={`M${rig.poll.x - 4},${rig.poll.y - 2} l-4,-22 l14,16Z`} fill={cCoat} {...o(3)} />
          <circle cx={rig.poll.x + 18} cy={rig.poll.y + 14} r={4} fill={ink} />
          <circle cx={rig.head.x - 6} cy={rig.head.y + 2} r={2.5} fill={ink} />
        </g>
      ) : (
        <g>
          <path d={`M${nb.x - 30},${nb.y - 20} L${rig.poll.x - 10},${rig.poll.y - 16} Q${rig.head.x + 12},${rig.head.y - 30} ${rig.head.x + 4},${rig.head.y + 2} Q${rig.head.x - 10},${rig.head.y + 16} ${rig.poll.x - 14},${rig.poll.y + 32} L${nb.x - 20},${nb.y + 40}Z`} fill={cCoat} {...o(5)} />
          {horns !== false && <path d={`M${rig.poll.x - 6},${rig.poll.y - 14} q-6,-22 10,-34 M${rig.poll.x + 4},${rig.poll.y - 14} q14,-16 26,-14`} fill="none" stroke="#EDE3C8" strokeWidth={7} strokeLinecap="round" />}
          <circle cx={rig.poll.x + 8} cy={rig.poll.y - 2} r={4} fill={ink} />
          <path d={`M${nb.x - 10},${nb.y + 40} q14,22 34,4`} fill={cCoat} {...o(3)} />
        </g>
      )}
      {blanket && <path d={`M${sp.saddle.x - 52},${B - ry + 6} L${sp.saddle.x + 44},${B - ry + 4} L${sp.saddle.x + 40},${B + 10} L${sp.saddle.x - 48},${B + 12}Z`} fill={blanket} {...o(3.5)} />}
      {saddle && (
        <g>
          <path d={`M${sp.saddle.x - 40},${B - ry + 4} Q${sp.saddle.x},${B - ry + 16} ${sp.saddle.x + 36},${B - ry + 2} L${sp.saddle.x + 30},${B - ry + 26} L${sp.saddle.x - 36},${B - ry + 28}Z`} fill="#4A2E1C" {...o(3.5)} />
          <path d={`M${sp.saddle.x + 28},${B - ry + 4} l6,-12`} stroke={ink} strokeWidth={6} strokeLinecap="round" />
          <path d={`M${sp.saddle.x - 2},${B - ry + 26} L${sp.saddle.x + 6},${B + ry * 0.9}`} stroke="#3A2416" strokeWidth={4} />
        </g>
      )}
      {saddlebags && (
        <g>
          <path d={`M${sp.saddle.x - 66},${B - ry + 14} h30 v40 q-15,8 -30,0Z`} fill="#6E4428" {...o(3.5)} />
          <path d={`M${sp.saddle.x - 66},${B - ry + 22} h30`} stroke={ink} strokeWidth={3} />
        </g>
      )}
      {/* near legs */}
      <LegLine l={rig.legs.RH} color={cCoat} w={w} hoof="#2A2420" />
      <LegLine l={rig.legs.RF} color={cCoat} w={w} hoof="#2A2420" />
    </g>
  );
};

// ------------------------------------------------------------------ rider
export type RideOut = {
  horsePl: Placement; rig: QuadRig; rider: {pl: Placement; P: Pose; build: Build}; hands: {R: Pt; L: Pt}; bit: Pt; grip: Pt;
  checks: {label: string; hand: Pt; grip: Pt}[]; plants: {label: string; hand: Pt; grip: Pt}[];
};
/** Rider on a walking horse. Hip locked to the saddle; hands on the reins (IK). */
export function rideHorse(d: number, o2: {horse: {x0: number; y: number; s?: number; dir?: 1 | -1}; riderId?: string; build?: Build; scale?: number; f?: number; lean?: number; amp?: number; seed?: number}): RideOut {
  const f = o2.f ?? 0;
  const s = o2.horse.s ?? 1;
  const dir = o2.horse.dir ?? 1;
  const rig = quadRig(d, {kind: 'horse', f, amp: o2.amp, seed: o2.seed});
  const horsePl: Placement = {x: o2.horse.x0 + dir * s * d, y: o2.horse.y, scale: s, dir};
  const build = o2.riderId ? castBuild(o2.riderId) : o2.build;
  const rs = (o2.riderId ? castScale(o2.riderId) : o2.scale ?? 1) * s;
  const L = dimsOf(build).L;
  const seat = toWorld(horsePl, rig.saddle);
  // the rider sways a little with the walk (follow-through of the horse's bob)
  const sway = Math.sin((d / SPECS.horse.S) * Math.PI * 4 - 0.8) * 2;
  const riderPl: Placement = {x: seat.x, y: seat.y + L * rs, scale: rs, dir};
  const base = pose({lean: (o2.lean ?? 6) + sway, hipL: 48, kneeL: 62, hipR: 52, kneeR: 64, headTilt: -2 + sway * 0.5 + noise1(f / 60, 3) * 2, shL: 30, elL: 50, shR: 30, elR: 50});
  const grip = toWorld(horsePl, rig.rein);
  const gR = {x: grip.x + 4 * dir * s, y: grip.y};
  const gL = {x: grip.x - 6 * dir * s, y: grip.y - 3 * s};
  const P = handsOn(riderPl, base, {R: gR, L: gL}, build);
  const checks = [
    {label: 'R rein', hand: handWorld(riderPl, P, 'R', build), grip: gR},
    {label: 'L rein', hand: handWorld(riderPl, P, 'L', build), grip: gL},
    {label: 'hip saddle', hand: toWorld(riderPl, {x: 0, y: -L + P.bob}), grip: seat},
  ];
  return {horsePl, rig, rider: {pl: riderPl, P, build}, hands: {R: gR, L: gL}, bit: toWorld(horsePl, rig.bit), grip, checks, plants: quadPlants(horsePl, rig)};
}

/** Reins from the rider's hands to the bit (draw after the rider). */
export const Reins: React.FC<{r: RideOut}> = ({r}) => {
  const {R} = r.hands;
  const b = r.bit;
  const mx = (R.x + b.x) / 2;
  const my = Math.max(R.y, b.y) + 16;
  return <path d={`M${R.x},${R.y} Q${mx},${my} ${b.x},${b.y}`} fill="none" stroke="#2A1A10" strokeWidth={3.5} strokeLinecap="round" />;
};

// ------------------------------------------------------------------ wagon
export const WAGON = {len: 300, bedY: -96, seat: {x: 118, y: -150}, footboard: {x: 160, y: -100}, wheelF: {x: 100, r: 42}, wheelB: {x: -104, r: 54}, tongue: {x: 150, y: -60}};
/** Wagon + team for distance d. Team animals walk ahead of the wagon; all share d (planted hooves). */
export function wagonRig(d: number, o2: {x0: number; y: number; s?: number; dir?: 1 | -1; team?: QuadKind; f?: number; amp?: number}) {
  const s = o2.s ?? 1;
  const dir = o2.dir ?? 1;
  const kind = o2.team ?? 'ox';
  const wagonPl: Placement = {x: o2.x0 + dir * s * d, y: o2.y, scale: s, dir};
  const gap = kind === 'ox' ? 430 : 400;
  const team = [0, 1].map((i) => {
    const pl: Placement = {x: wagonPl.x + dir * s * (gap - i * 26), y: o2.y - i * 4 * s, scale: s * (i ? 0.97 : 1), dir};
    return {pl, rig: quadRig(d, {kind, f: o2.f, amp: o2.amp, seed: 3 + i * 5}), far: i === 1};
  });
  return {wagonPl, team, seat: toWorld(wagonPl, WAGON.seat), footboard: toWorld(wagonPl, WAGON.footboard), hitch: toWorld(wagonPl, WAGON.tongue)};
}
const Wheel: React.FC<{x: number; y: number; r: number; a: number}> = ({x, y, r, a}) => (
  <g transform={`translate(${x},${y}) rotate(${a})`}>
    <circle r={r} fill="none" stroke={ink} strokeWidth={10} />
    <circle r={r} fill="none" stroke="#7A5A3A" strokeWidth={5} />
    {Array.from({length: 10}, (_, i) => <line key={i} x1={0} y1={0} x2={Math.cos((i * Math.PI) / 5) * r} y2={Math.sin((i * Math.PI) / 5) * r} stroke="#5A4028" strokeWidth={4} />)}
    <circle r={8} fill="#3A2A1C" {...o(3)} />
  </g>
);
/** Farm wagon (cover = covered wagon with a canvas bonnet). Wheels roll with d (local px). */
export const Wagon: React.FC<{pl: Placement; d: number; cover?: boolean; load?: boolean}> = ({pl, d, cover, load}) => {
  const s = pl.scale ?? 1;
  const dir = pl.dir ?? 1;
  const W = WAGON;
  const aF = ((d / W.wheelF.r) * 180) / Math.PI;
  const aB = ((d / W.wheelB.r) * 180) / Math.PI;
  return (
    <g transform={`translate(${pl.x},${pl.y}) scale(${s * dir},${s})`}>
      <ellipse cx={0} cy={4} rx={180} ry={10} fill="rgba(0,0,0,0.16)" />
      <Wheel x={W.wheelB.x + 14} y={-W.wheelB.r} r={W.wheelB.r} a={aB} />
      <path d={`M${W.tongue.x - 40},${W.tongue.y} L${W.tongue.x + 200},${W.tongue.y + 10}`} stroke={ink} strokeWidth={9} strokeLinecap="round" />
      <path d={`M${W.tongue.x - 40},${W.tongue.y} L${W.tongue.x + 200},${W.tongue.y + 10}`} stroke="#8A6440" strokeWidth={4} strokeLinecap="round" />
      <path d={`M${-W.len / 2},${W.bedY} L${W.len / 2},${W.bedY} L${W.len / 2 - 10},${W.bedY + 46} L${-W.len / 2 + 10},${W.bedY + 46}Z`} fill="#8A6440" {...o(5)} />
      {[0, 1, 2].map((i) => <line key={i} x1={-W.len / 2 + 6} y1={W.bedY + 14 + i * 12} x2={W.len / 2 - 6} y2={W.bedY + 14 + i * 12} stroke="#5E4128" strokeWidth={2.5} />)}
      {load && !cover && <path d={`M${-W.len / 2 + 20},${W.bedY} q20,-40 60,-30 q30,-30 70,-6 q30,-24 70,0 v6Z`} fill="#B89A6A" {...o(3.5)} />}
      {cover && (
        <g>
          <path d={`M${-W.len / 2 - 6},${W.bedY} Q${-W.len / 2 - 26},${W.bedY - 150} ${-W.len / 2 + 30},${W.bedY - 150} L${W.len / 2 - 70},${W.bedY - 150} Q${W.len / 2 - 14},${W.bedY - 150} ${W.len / 2 - 30},${W.bedY}Z`} fill="#EFE6CF" {...o(5)} />
          {[-0.3, 0, 0.3].map((u) => <path key={u} d={`M${u * W.len},${W.bedY} V${W.bedY - 150}`} stroke="#C9BC9A" strokeWidth={4} />)}
        </g>
      )}
      <rect x={W.seat.x - 30} y={W.seat.y} width={56} height={10} rx={3} fill="#6B4A30" {...o(3)} />
      <path d={`M${W.seat.x - 26},${W.seat.y + 10} L${W.seat.x - 26},${W.bedY}`} stroke={ink} strokeWidth={6} />
      <rect x={W.footboard.x - 22} y={W.footboard.y - 4} width={40} height={8} fill="#6B4A30" {...o(2.5)} />
      <Wheel x={W.wheelF.x} y={-W.wheelF.r} r={W.wheelF.r} a={aF} />
      <Wheel x={W.wheelB.x} y={-W.wheelB.r} r={W.wheelB.r} a={aB} />
    </g>
  );
};
/** Yoke / traces from the team to the wagon tongue (draw between the far and near animal). */
export const Yoke: React.FC<{team: {pl: Placement; rig: QuadRig}[]; hitch: Pt; kind?: QuadKind}> = ({team, hitch, kind = 'ox'}) => {
  const near = team[0];
  const nk = toWorld(near.pl, kind === 'ox' ? {x: near.rig.neckBase.x + 6, y: near.rig.neckBase.y - 24} : {x: 40, y: -210});
  return (
    <g>
      {kind === 'ox' && <rect x={nk.x - 10} y={nk.y - 8} width={20} height={16} rx={4} fill="#6B4A30" stroke={ink} strokeWidth={3} />}
      <path d={`M${hitch.x},${hitch.y} L${nk.x},${nk.y}`} stroke={ink} strokeWidth={kind === 'ox' ? 5 : 3} />
    </g>
  );
};
