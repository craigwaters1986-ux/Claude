// s06/s07 shared drawing helpers (figures from solvers, look, date cards, labels, paper props) and the
// chapter 6 sets: the Chicago convention hall, a farmhouse kitchen, Lincoln's study, the Davis inset and
// Charleston harbour at night. Generic period places; only the storyboard's labels are written on screen.
import React from 'react';
import {Person, CAST} from '../kit/Cast';
import {GradeLayer, Grain, Vig, Grade} from '../kit/Cinema';
import {C, FONT} from '../styles/theme';
import {clamp, easeOut, easeIn, hash, noise1, prog} from '../animations/core';
import {scribble, INK_BROWN} from '../kit/Paper';
import {Pose, pose, stand} from '../characters/poses';
import {PropXf} from '../kit/Props';
import {Smoke} from '../components/Effects';
import type {Fig} from './reelSolve';

const ink = C.ink;
const o = (w = 4) => ({stroke: ink, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});

// ---------------------------------------------------------------- figures and look
const castS = (id: string) => CAST[id].scale ?? 1;
/** Draws a solver figure (placements already include the cast scale). */
export const FigEl: React.FC<{g: Fig; f: number; seed?: number; lod?: 'full' | 'low'; opacity?: number}> = ({g, f, seed = 1, lod, opacity}) => (
  <Person
    id={g.id} x={g.pl.x} y={g.pl.y} scale={(g.pl.scale ?? 1) / castS(g.id)} dir={g.pl.dir} pose={g.P} f={f} seed={seed}
    look={g.look} talking={g.talking} tag={g.tag} fromBehind={g.fromBehind} eyesClosed={g.eyesClosed} lod={lod} opacity={opacity}
    head={{...(g.ex ? {expression: g.ex.expression as never, exprFrom: g.ex.exprFrom as never, exprT: g.ex.exprT} : {}), ...(g.noHat ? {hat: 'none'} : {})}}
  />
);

export const Look: React.FC<{f: number; grade: Grade; vig?: number; amount?: number}> = ({f, grade, vig = 0.5, amount = 1}) => (
  <>
    <GradeLayer grade={grade} amount={amount} />
    <Vig amount={vig} />
    <Grain f={f} />
  </>
);

// ---------------------------------------------------------------- on-screen text (local frames, passed in)
const textW = (s: string, size: number, k = 0.6) => s.length * size * k;
/** Date card, top left under the logo zone (y 150). Shown from `at` to `until` (shot-local frames). */
export const DateCardF: React.FC<{f: number; at: number; until: number; date: string; sub?: string; x?: number; y?: number}> = ({f, at, until, date, sub, x = 70, y = 160}) => {
  if (f < at - 1 || f > until + 1) return null;
  const tin = prog(f, at, at + 14, easeOut);
  const tout = prog(f, until - 12, until, easeIn);
  const w = Math.max(textW(date, 46, 0.62), sub ? textW(sub, 30, 0.58) : 0) + 80;
  const h = sub ? 124 : 82;
  return (
    <g transform={`translate(${x + (1 - tin) * -40 + tout * -30},${y})`} opacity={tin * (1 - tout)}>
      <rect x={8} y={10} width={w} height={h} rx={10} fill="rgba(0,0,0,0.35)" />
      <rect width={w} height={h} rx={10} fill={C.navy} stroke={ink} strokeWidth={5} />
      <rect width={14} height={h} rx={4} fill={C.dustyYellow} stroke={ink} strokeWidth={4} />
      <text x={40} y={56} fontFamily={FONT.sans} fontWeight={900} fontSize={46} fill="#FFFFFF" letterSpacing={1}>{date}</text>
      {sub && <text x={40} y={102} fontFamily={FONT.sans} fontWeight={700} fontSize={30} fill={C.dustyYellow}>{sub}</text>}
    </g>
  );
};

/** Fact label pill (e.g. "nearly 200,000 served"). Anchored at (x, y) = centre of the pill's top edge unless `anchor`. */
export const FactLabel: React.FC<{f: number; at: number; until: number; text: string; x: number; y: number; size?: number; anchor?: 'start' | 'middle' | 'end'; tone?: 'dark' | 'paper'}> = ({f, at, until, text, x, y, size = 42, anchor = 'middle', tone = 'dark'}) => {
  if (f < at - 1 || f > until + 1) return null;
  const t = prog(f, at, at + 14, easeOut) * (1 - prog(f, until - 12, until, easeIn));
  const w = textW(text, size, 0.6) + 64;
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  const dark = tone === 'dark';
  return (
    <g opacity={t} transform={`translate(0,${(1 - t) * 14})`}>
      <rect x={x0 + 6} y={y + 8} width={w} height={size + 40} rx={12} fill="rgba(0,0,0,0.3)" />
      <rect x={x0} y={y} width={w} height={size + 40} rx={12} fill={dark ? 'rgba(20,18,16,0.86)' : '#F1E6CB'} stroke={ink} strokeWidth={4} />
      <text x={x0 + w / 2} y={y + size + 8} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={size} fill={dark ? '#F4EBD6' : ink}>{text}</text>
    </g>
  );
};

// ---------------------------------------------------------------- paper props
/** A held sheet (letter / draft) at a prop transform; `flat` 0..1 lays it on a desk (seen edge-on). */
export const SheetAt: React.FC<{xf: PropXf; flat?: number; seed?: number; lines?: number; tone?: string}> = ({xf, flat = 0, seed = 3, lines = 6, tone = '#F1E6C8'}) => {
  const sy = 1 - 0.86 * clamp(flat);
  return (
    <g transform={`translate(${xf.x},${xf.y}) rotate(${xf.rot ?? 0}) scale(${(xf.flip ? -1 : 1) * (xf.s ?? 1)},${(xf.s ?? 1) * sy})`}>
      <rect x={-36} y={-48 + 6} width={72} height={96} rx={2} fill={tone} {...o(3)} />
      <g fill="none" stroke={INK_BROWN} strokeWidth={1.6} strokeLinecap="round">
        {Array.from({length: lines}, (_, i) => <path key={i} d={scribble(-28, -26 + i * 11, i === lines - 1 ? 30 : 54, seed * 10 + i, 7)} />)}
      </g>
    </g>
  );
};

/** Illegible handwriting revealed along `n` lines (matches s06-solve linesNib). */
export const WrittenLines: React.FC<{x: number; y: number; w: number; gap: number; n: number; u: number; seed?: number; size?: number; width?: number}> = ({x, y, w, gap, n, u, seed = 5, size = 9, width = 1.8}) => {
  const c = clamp(u) * n;
  return (
    <g fill="none" stroke={INK_BROWN} strokeWidth={width} strokeLinecap="round">
      {Array.from({length: n}, (_, i) => {
        const k = clamp(c - i);
        if (k <= 0) return null;
        const x0 = w < 0 ? x + w * k : x;
        return (
          <g key={i}>
            <defs><clipPath id={`wl-${seed}-${i}`}><rect x={Math.min(x0, x) - 2} y={y + i * gap - 20} width={Math.abs(w) * k + 4} height={30} /></clipPath></defs>
            <path d={scribble(Math.min(x, x + w), y + i * gap, Math.abs(w), seed * 13 + i, size)} clipPath={`url(#wl-${seed}-${i})`} />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------- crowd helpers
/** Cheering pose with arms forward-up (never straight up), phase per person. */
export const cheerUp = (f: number, seed: number): Pose => {
  const a = Math.sin(f / 5 + seed * 1.7);
  return pose({hipL: -6, hipR: 6, shR: 128 + a * 16, elR: 18, shL: 118 - a * 12, elL: 22, bob: -Math.abs(a) * 6, headTilt: -5});
};
const CROWD_IDS = ['townsman', 'visitor', 'townsman', 'farmer', 'townswoman', 'visitor'];
/** A row of low-detail people at floor y from x0 to x1. `mood` cheer | stand. */
export const CrowdRow: React.FC<{f: number; y: number; x0: number; x1: number; n: number; s: number; seed: number; mood?: 'cheer' | 'stand' | 'listen'; ids?: string[]; back?: boolean; lod?: 'low' | 'full'}> = ({f, y, x0, x1, n, s, seed, mood = 'cheer', ids = CROWD_IDS, back = false, lod = 'low'}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const k = seed * 31 + i * 7;
      const x = x0 + ((x1 - x0) * (i + 0.5 + (hash(k) - 0.5) * 0.5)) / n;
      const id = ids[Math.floor(hash(k + 3) * ids.length)];
      const cheering = mood === 'cheer' && hash(k + 5) > 0.25;
      const P = cheering ? cheerUp(f + i * 11, k) : stand(f + i * 13, k);
      return <Person key={i} id={id} x={x} y={y + (hash(k + 9) - 0.5) * 10} scale={s * (0.94 + hash(k + 1) * 0.12)} dir={hash(k + 2) > 0.5 ? 1 : -1} pose={P} f={f + i * 5} seed={k} lod={lod} fromBehind={back} expression={cheering ? 'joy' : mood === 'listen' ? 'neutral' : 'happy'} look={[0, -0.3]} />;
    })}
  </g>
);

// ---------------------------------------------------------------- 6.1 Chicago convention hall (generic wooden hall)
const Bunting: React.FC<{x0: number; x1: number; y: number; n: number; drop?: number}> = ({x0, x1, y, n, drop = 50}) => {
  const w = (x1 - x0) / n;
  const cols = ['#B23A2E', '#F2EEE4', '#2E4A7A'];
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const a = x0 + i * w;
        return cols.map((c, k) => <path key={i + '-' + k} d={`M${a},${y + k * 9} Q${a + w / 2},${y + drop - k * 6} ${a + w},${y + k * 9}`} fill="none" stroke={c} strokeWidth={10} />);
      })}
      <path d={`M${x0},${y - 4} H${x1}`} stroke={ink} strokeWidth={4} />
    </g>
  );
};
/** Hanging striped flag (plain stripes and a blue canton; no exact star count shown). */
export const HangingFlag: React.FC<{x: number; y: number; w: number; h: number; f: number; seed?: number}> = ({x, y, w, h, f, seed = 1}) => {
  const sway = noise1(f / 50, seed) * 4;
  const stripes = 7;
  return (
    <g transform={`translate(${x},${y}) skewX(${sway})`}>
      {Array.from({length: stripes}, (_, i) => <rect key={i} x={-w / 2} y={(i * h) / stripes} width={w} height={h / stripes} fill={i % 2 ? '#F2EEE4' : '#B23A2E'} />)}
      <rect x={-w / 2} y={0} width={w * 0.42} height={h * 0.55} fill="#2E4A7A" />
      {Array.from({length: 6}, (_, i) => <circle key={i} cx={-w / 2 + w * 0.08 + (i % 3) * w * 0.13} cy={h * 0.14 + Math.floor(i / 3) * h * 0.22} r={w * 0.025} fill="#F2EEE4" />)}
      <rect x={-w / 2} y={0} width={w} height={h} fill="none" {...o(3)} />
    </g>
  );
};
export const ConventionHall: React.FC<{f: number; floor: number}> = ({f, floor}) => (
  <g>
    <rect x={-700} y={-600} width={3400} height={2200} fill="#8A6A48" />
    {Array.from({length: 26}, (_, i) => <line key={i} x1={-700 + i * 140} y1={-600} x2={-700 + i * 140} y2={floor} stroke="#7A5C3C" strokeWidth={4} />)}
    {/* roof trusses */}
    {Array.from({length: 8}, (_, i) => <path key={i} d={`M${-600 + i * 480},-120 L${-360 + i * 480},-300 L${-120 + i * 480},-120`} fill="none" stroke="#5A4028" strokeWidth={14} />)}
    <rect x={-700} y={-130} width={3400} height={24} fill="#5A4028" {...o(3)} />
    {/* gallery */}
    <rect x={-700} y={250} width={3400} height={46} fill="#6A4C30" {...o(4)} />
    {Array.from({length: 30}, (_, i) => <rect key={i} x={-690 + i * 120} y={296} width={16} height={floor - 296} fill="#5A4028" {...o(2.5)} />)}
    <Bunting x0={-680} x1={2600} y={300} n={22} />
    {[200, 560, 1360, 1720].map((x, i) => <HangingFlag key={i} x={x} y={-60} w={190} h={150} f={f} seed={i + 3} />)}
    {/* stage */}
    <rect x={560} y={floor - 200} width={800} height={200} fill="#7A5A3A" {...o(5)} />
    <rect x={540} y={floor - 214} width={840} height={20} fill="#9A7A54" {...o(4)} />
    <Bunting x0={560} x1={1360} y={floor - 190} n={6} drop={70} />
    <rect x={930} y={floor - 300} width={60} height={86} fill="#5E4230" {...o(3)} />
    <rect x={-700} y={floor} width={3400} height={600} fill="#6A5236" />
    <line x1={-700} y1={floor} x2={2700} y2={floor} stroke={ink} strokeWidth={5} />
  </g>
);

// ---------------------------------------------------------------- 6.2a farmhouse kitchen
export const Kitchen: React.FC<{f: number; floor: number}> = ({f, floor}) => (
  <g>
    <rect x={-700} y={-400} width={3400} height={1900} fill="#D8C8A4" />
    {Array.from({length: 24}, (_, i) => <line key={i} x1={-700} y1={floor - 40 - i * 40} x2={2700} y2={floor - 40 - i * 40} stroke="#C8B690" strokeWidth={3} />)}
    <rect x={-700} y={floor - 170} width={3400} height={170} fill="#8A6A48" {...o(4)} />
    {/* window with daylight and a curtain */}
    <rect x={1160} y={floor - 560} width={260} height={300} fill="#BFD4DC" {...o(7)} />
    <path d={`M1290,${floor - 560} V${floor - 260} M1160,${floor - 410} H1420`} stroke="#6A4A30" strokeWidth={8} />
    <path d={`M1150,${floor - 575} Q1180,${floor - 420 + noise1(f / 60, 2) * 6} 1160,${floor - 250} L1210,${floor - 250} Q1200,${floor - 420} 1215,${floor - 575}Z`} fill="#C9D4E6" {...o(3)} />
    {/* shelf with jars and plates */}
    <rect x={380} y={floor - 470} width={420} height={14} fill="#6A4A30" {...o(3)} />
    {[410, 470, 540, 620, 700, 760].map((x, i) => (i % 2 ? <rect key={i} x={x} y={floor - 520} width={34} height={50} rx={6} fill={['#B88A4A', '#7A8A5A', '#A86A4A'][i % 3]} {...o(3)} /> : <circle key={i} cx={x + 18} cy={floor - 506} r={30} fill="#E6DCC4" {...o(3)} />))}
    <rect x={-700} y={floor} width={3400} height={600} fill="#9A7A54" />
    {Array.from({length: 20}, (_, i) => <line key={i} x1={-600 + i * 180} y1={floor} x2={-800 + i * 210} y2={floor + 300} stroke="#7A5A3A" strokeWidth={3} opacity={0.6} />)}
    <line x1={-700} y1={floor} x2={2700} y2={floor} stroke={ink} strokeWidth={6} />
  </g>
);
/** Plain kitchen table (side-on). */
export const KitchenTable: React.FC<{x: number; floor: number; w: number; top: number}> = ({x, floor, w, top}) => (
  <g>
    <rect x={x - w / 2 + 12} y={top + 10} width={14} height={floor - top - 10} fill="#7A5A3A" {...o(3.5)} />
    <rect x={x + w / 2 - 26} y={top + 10} width={14} height={floor - top - 10} fill="#7A5A3A" {...o(3.5)} />
    <rect x={x - w / 2} y={top} width={w} height={16} rx={3} fill="#8A6A44" {...o(4)} />
  </g>
);

// ---------------------------------------------------------------- 6.4 Jefferson Davis inset (MCU in a framed panel)
export const DavisInset: React.FC<{f: number; t: number; x: number; y: number; w: number; h: number}> = ({f, t, x, y, w, h}) => {
  if (t <= 0) return null;
  const k = easeOut(clamp(t));
  return (
    <g opacity={clamp(t * 1.6)} transform={`translate(${x + (1 - k) * 80},${y})`}>
      <defs><clipPath id="davis-in"><rect width={w} height={h} rx={14} /></clipPath></defs>
      <rect x={10} y={12} width={w} height={h} rx={14} fill="rgba(0,0,0,0.35)" />
      <g clipPath="url(#davis-in)">
        <rect width={w} height={h} fill="#8A8278" />
        {Array.from({length: 8}, (_, i) => <line key={i} x1={i * 70} y1={0} x2={i * 70} y2={h} stroke="#7A7268" strokeWidth={3} />)}
        <rect y={h - 70} width={w} height={70} fill="#5A4A3A" />
        <Person id="davis" x={w / 2 - 20} y={h + 230} scale={2.1 + f * 0.0006} dir={1} pose={stand(f, 71)} f={f} seed={71} expression="grim" look={[0.4, 0]} tag />
      </g>
      <rect width={w} height={h} rx={14} fill="none" stroke={ink} strokeWidth={6} />
    </g>
  );
};

// ---------------------------------------------------------------- 6.6 Charleston harbour at night
export const HarbourNight: React.FC<{f: number; fortX: number; waterY: number}> = ({f, fortX, waterY}) => (
  <g>
    <rect x={-700} y={waterY} width={3400} height={1200} fill="#18243A" />
    {Array.from({length: 7}, (_, i) => <rect key={'m' + i} x={1420 + Math.sin(f / 9 + i * 1.7) * 30} y={waterY + 20 + i * 26} width={160 - i * 14} height={6} rx={3} fill="#C8CCD8" opacity={0.35 + 0.25 * Math.sin(f / 6 + i)} />)}
    {Array.from({length: 18}, (_, i) => (
      <path key={i} d={`M${-600 + ((i * 230 + f * (0.6 + (i % 3) * 0.2)) % 3200)},${waterY + 30 + (i % 6) * 34} q30,-6 60,0`} stroke="#3A4E70" strokeWidth={3} fill="none" opacity={0.7} />
    ))}
  </g>
);
/** Fort Sumter as a low brick pentagon on its island, seen from far off (silhouette with a few lit embrasures). */
export const FortSilhouette: React.FC<{x: number; y: number; s?: number; f: number}> = ({x, y, s = 1, f}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-260,0 L-230,-70 L230,-70 L260,0Z" fill="#2A2420" {...o(4)} />
    <path d="M-230,-70 L-200,-96 L200,-96 L230,-70Z" fill="#34302A" {...o(3)} />
    {Array.from({length: 9}, (_, i) => <rect key={i} x={-200 + i * 48} y={-56} width={14} height={12} fill="#F2B04A" opacity={0.25 + 0.2 * (noise1(f / 6 + i, 3) * 0.5 + 0.5)} />)}
    <ellipse cx={0} cy={6} rx={300} ry={16} fill="#22304A" />
  </g>
);
/** Distant flash (glow pulse) at a point; fires every `every` frames from `at`. */
export const DistantFlash: React.FC<{x: number; y: number; f: number; at: number; every: number; r?: number; seed?: number; until?: number}> = ({x, y, f, at, every, r = 60, seed = 1, until = 1e9}) => {
  if (f < at || f > until) return null;
  const g = (f - at + Math.floor(hash(seed) * every)) % every;
  const a = g < 10 ? (1 - g / 10) : 0;
  if (a <= 0) return null;
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <circle cx={x} cy={y} r={r * (0.6 + 0.6 * (1 - a))} fill="#FFB050" opacity={0.5 * a} />
      <circle cx={x} cy={y} r={r * 0.25} fill="#FFE6A0" opacity={0.9 * a} />
    </g>
  );
};
export const HarbourSmoke: React.FC<{x: number; y: number; f: number; seed: number}> = ({x, y, f, seed}) => <Smoke x={x} y={y} f={f} n={10} size={60} rise={360} drift={220} seed={seed} opacity={0.5} color="#7A7A88" outline={false} />;
