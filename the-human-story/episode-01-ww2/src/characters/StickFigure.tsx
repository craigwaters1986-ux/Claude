// Reusable skeletal stick figure in the channel's reference style:
// thin black limbs, big round white head, thick ink outlines, flat colours.
import React from 'react';
import {C, FONT} from '../styles/theme';
import {Head, HeadSpec} from './Head';
import {Pose, ZERO} from './poses';
import {boil} from '../animations/core';

export type Outfit = {
  kind: 'none' | 'coat' | 'longcoat' | 'tunic' | 'suit' | 'dress' | 'shirt' | 'stripes' | 'overalls' | 'sailor';
  color?: string;
  accent?: string; // tie / belt / collar colour
  bowtie?: boolean;
  medals?: boolean;
  armband?: string;
};

export type FigureProps = {
  x: number;
  y: number; // ground line
  scale?: number;
  dir?: 1 | -1;
  pose?: Pose;
  f: number;
  seed?: number;
  head?: HeadSpec;
  outfit?: Outfit;
  child?: boolean;
  turn?: number;
  look?: [number, number];
  talking?: boolean;
  angerMark?: boolean;
  sweat?: boolean;
  tear?: boolean;
  label?: string;
  sublabel?: string;
  labelSide?: 'top' | 'right' | 'left';
  holdR?: React.ReactNode; // drawn in right-hand space (x along forearm)
  holdL?: React.ReactNode;
  back?: React.ReactNode; // e.g. rifle on back (torso space)
  opacity?: number;
  limbColor?: string;
  shadow?: boolean;
  thin?: number; // limb width multiplier
};

const rad = (d: number) => (d * Math.PI) / 180;

export const StickFigure: React.FC<FigureProps> = (p) => {
  const s = p.scale ?? 1;
  const dir = p.dir ?? 1;
  const P = p.pose ?? ZERO;
  const seed = p.seed ?? 1;
  const child = !!p.child;
  const L = child ? 74 : 108; // leg length
  const T = child ? 58 : 88; // torso
  const R = child ? 42 : 44; // head radius
  const UA = child ? 34 : 48;
  const FA = child ? 32 : 45;
  const limbW = (child ? 6.5 : 7.5) * (p.thin ?? 1);
  const col = p.limbColor ?? C.ink;
  const w = (n: number) => boil(p.f, seed * 31 + n, 0.6); // hand-drawn boil

  const hip = {x: 0, y: -L + P.bob};
  const legPts = (hipA: number, knee: number) => {
    const a = rad(hipA);
    const kx = hip.x + Math.sin(a) * L * 0.52;
    const ky = hip.y + Math.cos(a) * L * 0.52;
    const b = rad(hipA - knee);
    const fx = kx + Math.sin(b) * L * 0.5;
    const fy = ky + Math.cos(b) * L * 0.5;
    return {kx, ky, fx, fy};
  };
  const lL = legPts(P.hipL, P.kneeL);
  const lR = legPts(P.hipR, P.kneeR);
  const lean = rad(P.lean);
  const neck = {x: hip.x + Math.sin(lean) * T, y: hip.y - Math.cos(lean) * T};
  const sh = {x: hip.x + Math.sin(lean) * T * 0.88, y: hip.y - Math.cos(lean) * T * 0.88};
  const armPts = (shA: number, el: number) => {
    const a = rad(shA);
    const ex = sh.x + Math.sin(a) * UA;
    const ey = sh.y + Math.cos(a) * UA;
    const b = rad(shA + el);
    const hx = ex + Math.sin(b) * FA;
    const hy = ey + Math.cos(b) * FA;
    return {ex, ey, hx, hy, ang: shA + el};
  };
  const aL = armPts(P.shL, P.elL);
  const aR = armPts(P.shR, P.elR);
  const headC = {x: neck.x + Math.sin(lean) * R * 0.9, y: neck.y - Math.cos(lean) * R * 0.9 - 2};

  const limb = (pts: number[], key: string) => (
    <polyline key={key} points={pts.join(',')} fill="none" stroke={col} strokeWidth={limbW} strokeLinecap="round" strokeLinejoin="round" />
  );
  const foot = (fx: number, fy: number, key: string) => (
    <ellipse key={key} cx={fx + 7} cy={fy - 2} rx={child ? 10 : 13} ry={child ? 6 : 7} fill={col} />
  );
  const hand = (hx: number, hy: number, key: string) => <circle key={key} cx={hx} cy={hy} r={child ? 5.5 : 6.5} fill={col} />;

  // ---- garment (torso space: origin at hip, y up negative) ----
  const o = p.outfit ?? {kind: 'none'};
  let garment: React.ReactNode = null;
  if (o.kind !== 'none') {
    const c = o.color ?? C.khaki;
    const top = -T * 0.95;
    const shW = child ? 16 : 22;
    const hipW = child ? 15 : 19;
    let bottom = 14;
    let botW = hipW;
    if (o.kind === 'coat' || o.kind === 'sailor') bottom = 26;
    if (o.kind === 'longcoat') { bottom = 62; botW = hipW + 9; }
    if (o.kind === 'dress') { bottom = 52; botW = hipW + 16; }
    if (o.kind === 'tunic') bottom = 22;
    if (o.kind === 'shirt') bottom = 6;
    if (o.kind === 'stripes') { bottom = 30; botW = hipW + 3; }
    const path = `M${-shW + w(1)},${top} Q0,${top - 6} ${shW + w(2)},${top} L${botW + w(3)},${bottom} L${-botW + w(4)},${bottom}Z`;
    garment = (
      <g transform={`translate(${hip.x},${hip.y}) rotate(${P.lean})`}>
        <path d={path} fill={c} stroke={C.ink} strokeWidth={4.5} strokeLinejoin="round" />
        {o.kind === 'stripes' && [0, 1, 2, 3].map((i) => <line key={i} x1={-shW + 6 + i * 11} y1={top + 4} x2={-botW + 6 + i * 11.5} y2={bottom - 3} stroke="#4E5A6E" strokeWidth={4} />)}
        {(o.kind === 'tunic' || o.kind === 'longcoat') && <rect x={-hipW - 1} y={-6} width={hipW * 2 + 2} height={7} fill={o.accent ?? C.darkBrown} stroke={C.ink} strokeWidth={2.5} />}
        {(o.kind === 'tunic' || o.kind === 'longcoat' || o.kind === 'coat') && [0, 1, 2].map((i) => <circle key={i} cx={2} cy={top + 16 + i * 20} r={2.6} fill={C.ink} />)}
        {o.kind === 'suit' && (
          <g>
            <path d={`M-8,${top + 1} L0,${top + 26} L8,${top + 1}Z`} fill={C.paper} stroke={C.ink} strokeWidth={2.5} />
            {o.bowtie ? (
              <path d={`M-9,${top + 2} L0,${top + 7} L9,${top + 2} L9,${top + 12} L0,${top + 7} L-9,${top + 12}Z`} fill={o.accent ?? C.navy} stroke={C.ink} strokeWidth={2} />
            ) : (
              <path d={`M-3,${top + 4} L3,${top + 4} L4,${top + 24} L0,${top + 29} L-4,${top + 24}Z`} fill={o.accent ?? C.red} stroke={C.ink} strokeWidth={2} />
            )}
          </g>
        )}
        {o.kind === 'sailor' && <path d={`M${-shW},${top} L0,${top + 22} L${shW},${top} L${shW - 4},${top + 12} L0,${top + 30} L${-shW + 4},${top + 12}Z`} fill={C.navy} stroke={C.ink} strokeWidth={2} />}
        {o.medals && [0, 1, 2].map((i) => <rect key={i} x={-shW + 6 + i * 6} y={top + 14} width={4.5} height={8} fill={[C.red, C.gold, C.allied][i]} />)}
        {o.armband && <rect x={-shW - 2} y={top + 20} width={10} height={9} fill={o.armband} />}
      </g>
    );
  }

  const headSpec: HeadSpec = p.head ?? {hair: 'spiky'};
  const handProp = (a: {hx: number; hy: number; ang: number}, node: React.ReactNode) =>
    node ? <g transform={`translate(${a.hx},${a.hy}) rotate(${90 - a.ang})`}>{node}</g> : null;

  const labelEl = p.label ? (
    <NameTag x={p.x + (p.labelSide === 'right' ? 120 * s : p.labelSide === 'left' ? -120 * s : 0)} y={p.y + (headC.y - R - (headSpec.hat && headSpec.hat !== 'none' ? 62 : 40)) * s} text={p.label} sub={p.sublabel} />
  ) : null;

  return (
    <g opacity={p.opacity ?? 1}>
      {p.shadow !== false && <ellipse cx={p.x} cy={p.y + 4} rx={42 * s} ry={8 * s} fill="rgba(0,0,0,0.16)" />}
      <g transform={`translate(${p.x},${p.y}) scale(${s * dir},${s})`}>
        {p.back && <g transform={`translate(${hip.x},${hip.y}) rotate(${P.lean})`}>{p.back}</g>}
        {/* far limbs */}
        {limb([sh.x, sh.y, aL.ex + w(5), aL.ey, aL.hx, aL.hy], 'aL')}
        {hand(aL.hx, aL.hy, 'hL')}
        {handProp(aL, p.holdL)}
        {limb([hip.x, hip.y, lL.kx + w(6), lL.ky, lL.fx, lL.fy], 'lL')}
        {foot(lL.fx, lL.fy, 'fL')}
        {limb([hip.x, hip.y, lR.kx + w(7), lR.ky, lR.fx, lR.fy], 'lR')}
        {foot(lR.fx, lR.fy, 'fR')}
        {/* torso */}
        {limb([hip.x, hip.y, neck.x + w(8), neck.y], 'torso')}
        {garment}
        {/* near arm */}
        {limb([sh.x, sh.y, aR.ex + w(9), aR.ey, aR.hx, aR.hy], 'aR')}
        {hand(aR.hx, aR.hy, 'hR')}
        {handProp(aR, p.holdR)}
        <g transform={`translate(${headC.x},${headC.y}) rotate(${P.headTilt + P.lean * 0.4})`}>
          <Head
            r={R}
            f={p.f}
            seed={seed}
            {...headSpec}
            turn={p.turn ?? 0.35}
            look={p.look}
            talking={p.talking}
            angerMark={p.angerMark}
            sweat={p.sweat}
            tear={p.tear}
          />
        </g>
      </g>
      {labelEl}
    </g>
  );
};

export const NameTag: React.FC<{x: number; y: number; text: string; sub?: string; opacity?: number}> = ({x, y, text, sub, opacity = 1}) => {
  const w = Math.max(text.length * 17 + 36, (sub?.length ?? 0) * 11.5 + 30);
  const h = sub ? 66 : 44;
  return (
    <g transform={`translate(${x - w / 2},${y - h})`} opacity={opacity}>
      <rect x={4} y={5} width={w} height={h} rx={6} fill="rgba(0,0,0,0.35)" />
      <rect width={w} height={h} rx={6} fill={C.dustyYellow} stroke={C.ink} strokeWidth={3.5} />
      <text x={w / 2} y={30} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={25} fill={C.ink} letterSpacing={0.5}>
        {text}
      </text>
      {sub && (
        <text x={w / 2} y={54} textAnchor="middle" fontFamily={FONT.sans} fontWeight={600} fontSize={18} fill={C.ink}>
          {sub}
        </text>
      )}
      <path d={`M${w / 2 - 10},${h} L${w / 2},${h + 12} L${w / 2 + 10},${h}`} fill={C.dustyYellow} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    </g>
  );
};
