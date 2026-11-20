// Chapters 2–3 (s02, s03) shared parts: figure renderer for solver output, local props (short axe, plane,
// baby bundle, sack, letter), ox and wagon, winter set pieces, the date card and grey caution tag.
// Owned by the s02/s03 build; kit files are not edited.
import React from 'react';
import {Person, CAST} from '../kit/Cast';
import {GradeLayer, Grain, Vig} from '../kit/Cinema';
import type {PropDef} from '../kit/Props';
import {blinkAt} from '../kit/Actions';
import {C, FONT} from '../styles/theme';
import {prog, easeOut, noise1, hash} from '../animations/core';
import {measureW} from '../components/Text';
import type {Fig} from './reelSolve';

const ink = C.ink;
const o = (w = 4) => ({stroke: ink, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});
const castS = (id: string) => CAST[id].scale ?? 1;

/** Draw a solved figure (placements include the cast scale, so it is divided back out). */
export const FigEl: React.FC<{g: Fig; f: number; seed?: number; lod?: 'full' | 'low'; label?: string; sublabel?: string; slow?: number}> = ({g, f, seed = 1, lod, label, sublabel, slow = 1}) => (
  <Person
    id={g.id}
    x={g.pl.x}
    y={g.pl.y}
    scale={(g.pl.scale ?? 1) / castS(g.id)}
    dir={g.pl.dir}
    pose={g.P}
    f={f * slow}
    seed={seed}
    look={g.look}
    talking={g.talking}
    tag={g.tag && !label}
    label={g.tag && label ? label : undefined}
    sublabel={g.tag && label ? sublabel : undefined}
    fromBehind={g.fromBehind}
    eyesClosed={g.eyesClosed ?? blinkAt(Math.floor(f * slow), seed)}
    opacity={g.opacity}
    lod={lod}
    head={{...(g.ex ? {expression: g.ex.expression as never, exprFrom: g.ex.exprFrom as never, exprT: g.ex.exprT} : {})}}
  />
);

export const Look: React.FC<{f: number; grade: Parameters<typeof GradeLayer>[0]['grade']; vig?: number; amount?: number}> = ({f, grade, vig = 0.5, amount = 1}) => (
  <>
    <GradeLayer grade={grade} amount={amount} />
    <Vig amount={vig} />
    <Grain f={f} />
  </>
);

/** Date card (shot-local frames): "12 February 1809 · Kentucky". Top right, clear of the logo zone. */
export const DateTag: React.FC<{f: number; at: number; until: number; text: string; x?: number; y?: number}> = ({f, at, until, text, x = 1850, y = 70}) => {
  const t = prog(f, at, at + 14, easeOut) * (1 - prog(f, until - 12, until));
  if (t <= 0) return null;
  const w = measureW(text, 40, 800) + 70;
  return (
    <g opacity={t} transform={`translate(${x - w + (1 - t) * 30},${y})`}>
      <rect x={6} y={8} width={w} height={74} rx={10} fill="rgba(0,0,0,0.35)" />
      <rect width={w} height={74} rx={10} fill={C.navy} stroke={ink} strokeWidth={5} />
      <rect width={14} height={74} rx={4} fill={C.dustyYellow} stroke={ink} strokeWidth={4} />
      <text x={40} y={50} fontFamily={FONT.sans} fontWeight={800} fontSize={40} fill="#FFFFFF">{text}</text>
    </g>
  );
};

/** Grey caution tag: "Later accounts · treated with caution". */
export const GreyTag: React.FC<{f: number; at: number; until: number; text: string; x?: number; y?: number}> = ({f, at, until, text, x = 1850, y = 820}) => {
  const t = prog(f, at, at + 14, easeOut) * (1 - prog(f, until - 12, until));
  if (t <= 0) return null;
  const w = measureW(text, 34, 700) + 56;
  return (
    <g opacity={t} transform={`translate(${x - w},${y})`}>
      <rect width={w} height={58} rx={29} fill="#6E6E72" stroke={ink} strokeWidth={4} />
      <text x={w / 2} y={40} textAnchor="middle" fontFamily={FONT.sans} fontWeight={700} fontSize={34} fill="#F2F0EA">{text}</text>
    </g>
  );
};

/** Map-side label pill (exact storyboard wording). */
export const Pill: React.FC<{t: number; text: string; x: number; y: number; size?: number; anchor?: 'start' | 'middle' | 'end'; fill?: string; color?: string}> = ({t, text, x, y, size = 40, anchor = 'middle', fill = '#F4EBD6', color = ink}) => {
  if (t <= 0) return null;
  const w = measureW(text, size, 800) + 50;
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return (
    <g opacity={t} transform={`translate(${x0},${y - size * 0.95 + (1 - t) * 14})`}>
      <rect x={5} y={7} width={w} height={size * 1.55} rx={12} fill="rgba(0,0,0,0.3)" />
      <rect width={w} height={size * 1.55} rx={12} fill={fill} stroke={ink} strokeWidth={4} />
      <text x={w / 2} y={size * 1.08} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={size} fill={color}>{text}</text>
    </g>
  );
};

// ---------------------------------------------------------------- local props (grip points in local px)

/** Short hatchet for the boy (child reach): handle end at the origin along +x, head at x 58–74. */
export const SHORT_AXE: PropDef = {
  grips: {handle: {x: 4, y: 0}, grip2: {x: 20, y: 0}},
  draw: () => (
    <g>
      <path d="M0,0 L64,-1" stroke="#2A1D12" strokeWidth={9} strokeLinecap="round" />
      <path d="M0,0 L64,-1" stroke="#9A7046" strokeWidth={5} strokeLinecap="round" />
      <path d="M56,-10 L72,-13 Q78,-1 72,11 L56,8Z" fill="#8E949A" {...o(3)} />
      <path d="M71,-11 Q76,-1 71,9" fill="none" stroke="#D8DCE0" strokeWidth={2.2} />
    </g>
  ),
};

/** Carpenter's hand plane: rear tote (handle) and front knob (grip2); sole at y = 0. */
export const PLANE: PropDef = {
  grips: {handle: {x: -14, y: -18}, grip2: {x: 10, y: -12}},
  draw: () => (
    <g>
      <rect x={-26} y={-10} width={50} height={10} rx={2} fill="#9A7046" {...o(3)} />
      <path d="M-20,-10 Q-20,-22 -10,-22 L-8,-10Z" fill="#7A5232" {...o(2.5)} />
      <circle cx={10} cy={-13} r={4} fill="#7A5232" {...o(2.5)} />
      <path d="M-2,-10 L4,-18" stroke="#8E949A" strokeWidth={3} />
    </g>
  ),
};

/** Baby wrapped in a blanket (held in both arms); the face looks along +x before mirroring. */
export const BUNDLE: PropDef = {
  grips: {handle: {x: 14, y: 10}, grip2: {x: -18, y: 4}},
  draw: () => (
    <g>
      <ellipse cx={-2} cy={0} rx={32} ry={17} fill="#E6DCC4" {...o(3.5)} />
      <path d="M-26,-6 Q-6,6 22,-4" stroke="#B8A888" strokeWidth={2.5} fill="none" />
      <circle cx={22} cy={-8} r={12} fill="#FFFFFF" {...o(3)} />
      <path d="M20,-9 q2,2 4,0 M26,-9 q1.5,2 3,0" stroke={ink} strokeWidth={1.6} fill="none" />
    </g>
  ),
};

/** Grain sack: origin at the centre; both hands at the shoulders of the sack. */
export const SACK: PropDef = {
  grips: {handle: {x: -24, y: -16}, grip2: {x: 24, y: -16}},
  draw: () => (
    <g>
      <path d="M-28,-26 Q-36,10 -26,28 Q0,36 26,28 Q36,10 28,-26 Q14,-34 0,-30 Q-14,-34 -28,-26Z" fill="#CDB98C" {...o(3.5)} />
      <path d="M-10,-30 Q0,-40 10,-30" stroke="#7A6A4A" strokeWidth={3} fill="none" />
      <path d="M-16,4 H16 M-12,12 H12" stroke="#A8946A" strokeWidth={2.5} />
    </g>
  ),
};

/** Folded letter held at its left edge. */
export const LETTER: PropDef = {
  grips: {handle: {x: -12, y: 2}},
  draw: () => (
    <g>
      <rect x={-14} y={-10} width={30} height={20} fill="#F4EAD0" {...o(2.5)} />
      <path d="M-14,-10 L1,2 L16,-10" stroke="#8A7A5E" strokeWidth={1.8} fill="none" />
      <circle cx={1} cy={3} r={3} fill="#9A2A22" />
    </g>
  ),
};

// ---------------------------------------------------------------- ox and wagon

/** Plain ox walking along -x (dir -1) or +x; `phase` drives the legs, `walking` 0..1. */
export const Ox: React.FC<{x: number; y: number; s?: number; dir?: 1 | -1; phase: number; walking: number; f: number; color?: string}> = ({x, y, s = 1, dir = -1, phase, walking, f, color = '#8A5E3A'}) => {
  const a = phase * Math.PI * 2;
  const leg = (lx: number, k: number) => {
    const sw = Math.sin(a + k) * 18 * walking;
    return <path d={`M${lx},-70 L${lx + sw * 0.5},-36 L${lx + sw},0`} stroke={ink} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  };
  const nod = Math.sin(a * 2) * 3 * walking + noise1(f / 40, 3) * 2;
  return (
    <g transform={`translate(${x},${y}) scale(${dir * s},${s})`}>
      {leg(-60, Math.PI)}
      {leg(50, 0)}
      <path d="M-90,-120 Q-96,-60 -70,-56 L70,-56 Q100,-64 96,-118 Q70,-142 0,-140 Q-70,-142 -90,-120Z" fill={color} {...o(5)} />
      <path d="M-40,-120 Q-20,-110 0,-124 M20,-90 q20,6 34,-4" stroke="#6A4628" strokeWidth={3} fill="none" />
      {leg(-46, 0)}
      {leg(64, Math.PI)}
      <path d="M-90,-110 Q-110,-90 -104,-70" stroke={ink} strokeWidth={5} fill="none" />
      <g transform={`translate(${100},${-118 + nod})`}>
        <path d="M-6,-14 Q14,-30 40,-12 L50,22 Q42,34 26,32 L4,16Z" fill={color} {...o(5)} />
        <ellipse cx={44} cy={26} rx={10} ry={8} fill="#C9A88A" {...o(3)} />
        <circle cx={28} cy={-2} r={3.5} fill={ink} />
        <path d="M10,-16 Q0,-34 -14,-36 M30,-20 Q40,-38 54,-38" stroke="#EDE2C8" strokeWidth={7} fill="none" strokeLinecap="round" />
        <path d="M10,-16 Q0,-34 -14,-36 M30,-20 Q40,-38 54,-38" stroke={ink} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.6} />
      </g>
    </g>
  );
};

/** Farm wagon (side view), bed centred at x; `roll` = distance rolled (turns the wheels). Front at -x. */
export const WAGON = {bedTop: 170, bedBottom: 92, wheelR: 70, seatTop: 206, foot: 120, half: 210};
export const Wagon: React.FC<{x: number; floor: number; roll: number; part?: 'back' | 'front'; cover?: boolean}> = ({x, floor, roll, part = 'front', cover = false}) => {
  const W = WAGON;
  const wheel = (wx: number) => (
    <g transform={`translate(${wx},${floor - W.wheelR}) rotate(${(-roll / W.wheelR) * (180 / Math.PI)})`}>
      <circle r={W.wheelR} fill="none" stroke="#3E2A1A" strokeWidth={12} />
      <circle r={W.wheelR} fill="none" {...o(3)} />
      {[0, 45, 90, 135].map((a) => <line key={a} x1={-W.wheelR * Math.cos((a * Math.PI) / 180)} y1={-W.wheelR * Math.sin((a * Math.PI) / 180)} x2={W.wheelR * Math.cos((a * Math.PI) / 180)} y2={W.wheelR * Math.sin((a * Math.PI) / 180)} stroke="#5A3E28" strokeWidth={6} />)}
      <circle r={12} fill="#5A3E28" {...o(3)} />
    </g>
  );
  if (part === 'back')
    return (
      <g>
        {cover && <path d={`M${x - W.half + 30},${floor - W.bedTop} Q${x - W.half + 10},${floor - W.bedTop - 190} ${x},${floor - W.bedTop - 200} Q${x + W.half - 10},${floor - W.bedTop - 190} ${x + W.half - 20},${floor - W.bedTop}Z`} fill="#E6DCC4" {...o(4)} />}
        {wheel(x + 130)}
      </g>
    );
  return (
    <g>
      <path d={`M${x - W.half - 120},${floor - 110} L${x - W.half},${floor - 104}`} stroke="#5A3E28" strokeWidth={10} strokeLinecap="round" />
      <rect x={x - W.half} y={floor - W.bedTop} width={W.half * 2} height={W.bedTop - W.bedBottom} fill="#8A6440" {...o(5)} />
      <path d={`M${x - W.half},${floor - W.bedTop + 26} H${x + W.half} M${x - W.half},${floor - W.bedTop + 52} H${x + W.half}`} stroke="#5E4128" strokeWidth={3} />
      <rect x={x - W.half - 6} y={floor - W.seatTop} width={60} height={14} fill="#6E4C30" {...o(3)} />
      <path d={`M${x - W.half + 4},${floor - W.seatTop + 14} V${floor - W.bedTop}`} stroke={ink} strokeWidth={5} />
      <rect x={x - W.half - 50} y={floor - W.foot - 6} width={56} height={10} fill="#6E4C30" {...o(3)} />
      {wheel(x - 130)}
    </g>
  );
};

// ---------------------------------------------------------------- set pieces

/** Snowy ground with drifts. */
export const SnowGround: React.FC<{y: number; color?: string}> = ({y, color = '#E8ECEE'}) => (
  <g>
    <rect x={-900} y={y} width={3800} height={900} fill={color} />
    <path d={`M-900,${y} ${Array.from({length: 40}, (_, i) => `Q${-850 + i * 100},${y - 10 - 8 * hash(i)} ${-800 + i * 100},${y}`).join(' ')}`} fill={color} stroke={ink} strokeWidth={5} />
    {Array.from({length: 30}, (_, i) => <path key={i} d={`M${-800 + i * 125},${y + 40 + (i % 4) * 30} q30,-8 60,0`} stroke="#C4CED6" strokeWidth={3} fill="none" />)}
  </g>
);

/** Breath puffs from a mouth point in the cold (every `every` frames). */
export const Breath: React.FC<{x: number; y: number; f: number; dir?: 1 | -1; every?: number; s?: number}> = ({x, y, f, dir = 1, every = 48, s = 1}) => {
  const t = f % every;
  if (t > 30) return null;
  const u = t / 30;
  return (
    <g opacity={0.55 * (1 - u)} transform={`translate(${x + dir * u * 50 * s},${y - u * 18 * s}) scale(${s * (0.6 + u)})`}>
      <ellipse cx={0} cy={0} rx={14} ry={9} fill="#FFFFFF" />
      <ellipse cx={dir * 12} cy={-4} rx={9} ry={7} fill="#FFFFFF" />
    </g>
  );
};

/** Chopping block (a short log on end). */
export const Block: React.FC<{x: number; top: number; floor: number; w?: number}> = ({x, top, floor, w = 90}) => (
  <g>
    <rect x={x - w / 2} y={top} width={w} height={floor - top} fill="#7A5A3A" {...o(4)} />
    <ellipse cx={x} cy={top} rx={w / 2} ry={10} fill="#C49A62" {...o(3)} />
  </g>
);

/** Small split stick on the block, halves fly apart at `at`. */
export const Billet: React.FC<{x: number; y: number; f: number; at: number; s?: number}> = ({x, y, f, at, s = 1}) => {
  const t = Math.max(0, f - at);
  const sp = Math.min(1, t / 8);
  const fall = Math.min(t, 14);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <g transform={`translate(${-sp * 26},${fall * 1.2}) rotate(${-sp * 30})`}><rect x={-16} y={-46} width={16} height={46} fill="#B8905A" {...o(3)} /></g>
      <g transform={`translate(${sp * 26},${fall * 1.2}) rotate(${sp * 30})`}><rect x={0} y={-46} width={16} height={46} fill="#C49A62" {...o(3)} /></g>
    </g>
  );
};

/** A small grave under trees: a low mound and a plain wooden marker (no inscription). */
export const Grave: React.FC<{x: number; floor: number; s?: number}> = ({x, floor, s = 1}) => (
  <g transform={`translate(${x},${floor}) scale(${s})`}>
    <path d="M-120,0 Q-100,-40 0,-44 Q100,-40 120,0Z" fill="#6A5A44" {...o(4)} />
    <rect x={-10} y={-150} width={20} height={120} fill="#8A6A48" {...o(3.5)} />
    <rect x={-40} y={-128} width={80} height={18} fill="#8A6A48" {...o(3.5)} />
    {[-70, -30, 40, 80].map((gx, i) => <path key={i} d={`M${gx},-10 l6,-14 l5,12`} stroke="#4E5A32" strokeWidth={3} fill="none" />)}
  </g>
);

/** Sawhorse with a board on top (board top at `top`). */
export const Sawhorse: React.FC<{x0: number; x1: number; top: number; floor: number}> = ({x0, x1, top, floor}) => (
  <g>
    {[x0 + 40, x1 - 40].map((lx, i) => <path key={i} d={`M${lx - 40},${floor} L${lx},${top + 20} L${lx + 40},${floor}`} stroke="#5A3E28" strokeWidth={12} fill="none" strokeLinejoin="round" />)}
    <rect x={x0 + 10} y={top + 14} width={x1 - x0 - 20} height={14} fill="#6E4C30" {...o(3)} />
    <rect x={x0} y={top} width={x1 - x0} height={16} fill="#D2B080" {...o(3.5)} />
  </g>
);

/** Plane shavings curling off the board. */
export const Shavings: React.FC<{x: number; y: number; f: number; n: number}> = ({x, y, f, n}) => (
  <g>
    {Array.from({length: n}, (_, i) => (
      <path key={i} d={`M${x - 120 + ((i * 37) % 240)},${y + 4 + (i % 3) * 3} q10,-12 20,0 q-6,6 -12,0`} stroke="#E8C890" strokeWidth={3} fill="none" opacity={0.9} transform={`rotate(${(i * 47) % 360 + f * 0},${x - 110 + ((i * 37) % 240)},${y})`} />
    ))}
  </g>
);
