// E-01 WW1 trench set (ep02).  Flat fills, thick ink outlines, muted period palette.
// Views (prop `view`): 'trench' (side-on front-line trench: firestep, sandbag parapet, revetment,
// duckboards, sump, ladders, box periscope, dugout entrance with gas curtain, wire beyond),
// 'mud' (Passchendaele crater field), 'nomansland' (over-the-parapet view), 'cutaway' (front /
// support / reserve diagram) and 'dugout' (interior).  Weather / time props restyle each view.
// Storyboard variants a–g are presets: <Trench variant="b" f={f} />.
// Characters: stand them on TRENCH.firestepY (heads clear the parapet) or TRENCH.floorY (in cover).
// Everything moving is driven by `f` or by explicit progress props, so shots can be keyed.
import React from 'react';
import {C, FONT, W, H} from '../../styles/theme';
import {clamp, hash, noise1, rng, easeOut} from '../../animations/core';
import {Particles, Smoke, Candle} from '../Effects';

const ink = C.ink;

// ------------------------------------------------------------------ layout (scale 1)
/** Trench view layout (screen y).  An adult StickFigure at scale 1 is ~280 px tall (eyes ~236 px above the feet). */
export const TRENCH = {
  horizonY: 300,
  crestY: 545, // top of the parapet sandbags: eyes of a man on the firestep are just above it
  firestepY: 760, // stand figures here to look over the parapet
  floorY: 878, // duckboards: figures here are in cover
  ladderX: [420, 1560],
  periscopeX: 980,
  sumpX: [560, 900] as [number, number],
  dugoutX: 1300,
};
export const MUD = {horizonY: 420, trackY: 884};
export const NML = {horizonY: 380, farParapetY: 392, nearY: 905};
export const DUGOUT = {bunkSeatY: 745, floorY: 930, candle: [1240, 818] as [number, number], entranceX: 240};
export const CUTAWAY = {frontY: 360, supportY: 590, reserveY: 820};

export type TrenchView = 'trench' | 'mud' | 'nomansland' | 'cutaway' | 'dugout';
export type Weather = 'clear' | 'rain' | 'frost' | 'mist' | 'snow';
export type TimeOfDay = 'day' | 'night' | 'dawn' | 'grey';
export type RatSpec = {lane: 'floor' | 'parapet' | 'firestep'; t: number; dir?: 1 | -1};

/** Storyboard variants: a day+rain · b winter night · c dawn mist/smoke · d mud · e over the parapet · f cutaway · g dugout. */
export const TRENCH_VARIANTS: Record<'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g', {view: TrenchView; weather: Weather; time: TimeOfDay}> = {
  a: {view: 'trench', weather: 'rain', time: 'day'},
  b: {view: 'trench', weather: 'frost', time: 'night'},
  c: {view: 'trench', weather: 'mist', time: 'dawn'},
  d: {view: 'mud', weather: 'rain', time: 'grey'},
  e: {view: 'nomansland', weather: 'frost', time: 'day'},
  f: {view: 'cutaway', weather: 'clear', time: 'day'},
  g: {view: 'dugout', weather: 'clear', time: 'night'},
};

// ------------------------------------------------------------------ colour helpers
const hx = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const mixc = (a: string, b: string, t: number) => {
  const A = hx(a);
  const B = hx(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * clamp(t)).toString(16).padStart(2, '0')).join('');
};
type Tone = (c: string) => string;
const toneFor = (time: TimeOfDay, weather: Weather): Tone => {
  const base: Tone = time === 'night' ? (c) => mixc(c, '#162036', 0.6) : time === 'dawn' ? (c) => mixc(c, '#E9B98C', 0.14) : time === 'grey' ? (c) => mixc(c, '#8C929A', 0.28) : (c) => c;
  if (weather === 'rain') return (c) => mixc(base(c), '#56606C', 0.16);
  if (weather === 'mist') return (c) => mixc(base(c), '#C9CCC6', 0.12);
  return base;
};
const SKY: Record<TimeOfDay, [string, string]> = {day: ['#B9C3C0', '#E4DFCF'], night: ['#0E1626', '#2A3550'], dawn: ['#A9B4C0', '#F1C99A'], grey: ['#9EA4A8', '#C9CAC2']};
const skyFor = (time: TimeOfDay, weather: Weather): [string, string] => (weather === 'rain' && time === 'day' ? ['#8E979C', '#BFC1BA'] : SKY[time]);

// ------------------------------------------------------------------ building blocks
const Sky: React.FC<{top: string; bottom: string; y1: number; id: string}> = ({top, bottom, y1, id}) => (
  <g>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={top} />
        <stop offset="1" stopColor={bottom} />
      </linearGradient>
    </defs>
    <rect x={-400} y={-600} width={W + 800} height={y1 + 600} fill={`url(#${id})`} />
  </g>
);

/** A wall of sandbags between y0 and y1 (rounded flat bags, staggered rows). */
export const Sandbags: React.FC<{x0?: number; x1?: number; y0: number; y1: number; tone?: Tone; frost?: number; bag?: number; seed?: number}> = ({x0 = -80, x1 = W + 80, y0, y1, tone = (c) => c, frost = 0, bag = 1, seed = 1}) => {
  const out: React.ReactNode[] = [];
  const h = 44 * bag;
  const w = 108 * bag;
  const cols = [tone('#B5A37A'), tone('#A8956A'), tone('#BCAB84'), tone('#9E8C62')];
  let r = 0;
  for (let y = y0; y < y1; y += h - 6, r++) {
    for (let x = x0 - (r % 2) * (w / 2); x < x1; x += w - 4) {
      const k = Math.floor(hash(r * 13.1 + x * 0.07 + seed) * 4);
      out.push(<rect key={`${r}-${x}`} x={x} y={y + (hash(x + r + seed) - 0.5) * 4} width={w} height={h} rx={h * 0.42} fill={cols[k]} stroke={ink} strokeWidth={3.5} />);
      if (frost > 0) out.push(<path key={`f${r}-${x}`} d={`M${x + 12},${y + 5} Q${x + w / 2},${y - 3} ${x + w - 12},${y + 5}`} stroke="#F4F7FA" strokeWidth={6} fill="none" opacity={frost} strokeLinecap="round" />);
    }
  }
  return <g>{out}</g>;
};

/** Coiled barbed wire on crossed stakes, from x0 to x1 at ground line y (scale s). */
export const WireCoils: React.FC<{x0: number; x1: number; y: number; s?: number; seed?: number; color?: string; frost?: number}> = ({x0, x1, y, s = 1, seed = 1, color = ink, frost = 0}) => {
  const stakes: React.ReactNode[] = [];
  const step = 150 * s;
  for (let x = x0, i = 0; x <= x1; x += step, i++) {
    const jx = (hash(i + seed) - 0.5) * 20 * s;
    stakes.push(<path key={i} d={`M${x + jx - 16 * s},${y} L${x + jx + 10 * s},${y - 70 * s} M${x + jx + 16 * s},${y} L${x + jx - 10 * s},${y - 70 * s}`} stroke={color} strokeWidth={6 * s} strokeLinecap="round" />);
  }
  // concertina loops
  const loops: string[] = [];
  const r = 24 * s;
  for (let x = x0; x <= x1; x += r * 0.9) loops.push(`M${x - r},${y - 30 * s} a${r},${r * 1.15} 0 1 1 ${2 * r},0 a${r},${r * 1.15} 0 1 1 ${-2 * r},0`);
  return (
    <g>
      {stakes}
      <path d={loops.join(' ')} fill="none" stroke={color} strokeWidth={2.2 * Math.max(0.7, s)} opacity={0.85} />
      {frost > 0 && <path d={loops.join(' ')} fill="none" stroke="#F4F7FA" strokeWidth={1.2} opacity={0.6 * frost} transform="translate(0,-1.5)" />}
    </g>
  );
};

/** Trench ladder (two rails + rungs), foot at (x, y), top at y - h, slight lean. */
export const TrenchLadder: React.FC<{x: number; y: number; h?: number; tone?: Tone; lean?: number}> = ({x, y, h = 400, tone = (c) => c, lean = 18}) => (
  <g>
    <line x1={x - 26} y1={y} x2={x - 26 + lean} y2={y - h} stroke={ink} strokeWidth={14} strokeLinecap="round" />
    <line x1={x + 26} y1={y} x2={x + 26 + lean} y2={y - h} stroke={ink} strokeWidth={14} strokeLinecap="round" />
    <line x1={x - 26} y1={y} x2={x - 26 + lean} y2={y - h} stroke={tone('#8A6A44')} strokeWidth={7} strokeLinecap="round" />
    <line x1={x + 26} y1={y} x2={x + 26 + lean} y2={y - h} stroke={tone('#8A6A44')} strokeWidth={7} strokeLinecap="round" />
    {Array.from({length: Math.floor(h / 52)}).map((_, i) => {
      const t = (i + 0.6) / (h / 52);
      return <line key={i} x1={x - 26 + lean * t} y1={y - h * t} x2={x + 26 + lean * t} y2={y - h * t} stroke={ink} strokeWidth={6} strokeLinecap="round" />;
    })}
  </g>
);

/** Box periscope standing against the parapet: foot at (x, y), mirror head `h` above. */
export const BoxPeriscope: React.FC<{x: number; y: number; h?: number; tone?: Tone; glint?: number}> = ({x, y, h = 300, tone = (c) => c, glint = 0}) => (
  <g>
    <rect x={x - 16} y={y - h} width={32} height={h} fill={tone('#7A6A50')} stroke={ink} strokeWidth={4} />
    <path d={`M${x - 16},${y - h} L${x - 16},${y - h - 40} L${x + 22},${y - h - 40} L${x + 16},${y - h}Z`} fill={tone('#6A5A42')} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={x - 12} y={y - h - 34} width={22} height={14} fill={tone('#9FB8C2')} stroke={ink} strokeWidth={2.5} />
    {glint > 0 && <circle cx={x} cy={y - h - 27} r={10} fill="#fff" opacity={glint * 0.8} />}
    <rect x={x - 12} y={y - 120} width={22} height={16} fill={tone('#9FB8C2')} stroke={ink} strokeWidth={2.5} />
  </g>
);

/** Hanging oil lantern (glows when lit 0..1). */
export const Lantern: React.FC<{x: number; y: number; f: number; lit?: number; s?: number; seed?: number}> = ({x, y, f, lit = 1, s = 1, seed = 1}) => {
  const fl = 0.85 + 0.15 * noise1(f / 7, seed);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {lit > 0 && <circle cx={0} cy={18} r={70} fill="#FFD27A" opacity={0.22 * lit * fl} />}
      {lit > 0 && <circle cx={0} cy={18} r={34} fill="#FFE3A0" opacity={0.3 * lit * fl} />}
      <path d="M-8,-10 Q0,-22 8,-10" fill="none" stroke={ink} strokeWidth={3} />
      <rect x={-13} y={-8} width={26} height={8} fill="#4A4A44" stroke={ink} strokeWidth={3} />
      <rect x={-11} y={0} width={22} height={30} rx={4} fill={lit > 0 ? mixc('#C9B98A', '#FFE08A', lit * fl) : '#9A9A88'} stroke={ink} strokeWidth={3} />
      <rect x={-14} y={30} width={28} height={7} fill="#4A4A44" stroke={ink} strokeWidth={3} />
    </g>
  );
};

/** Small grey rat with a running cycle (side view, facing dir). */
export const Rat: React.FC<{x: number; y: number; f: number; dir?: 1 | -1; s?: number; run?: boolean; color?: string}> = ({x, y, f, dir = 1, s = 1, run = true, color = '#7E7E78'}) => {
  const ph = run ? f / 1.6 : 0;
  const b = run ? Math.abs(Math.sin(ph)) * 3 : 0;
  const l1 = Math.sin(ph) * 8;
  const l2 = -l1;
  return (
    <g transform={`translate(${x},${y - b}) scale(${s * dir},${s})`}>
      <path d={`M-22,-8 Q-44,${-14 + Math.sin(f / 3) * 4} -60,${-4 + Math.sin(f / 4) * 3}`} fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <path d={`M-8,-8 L${-12 + l1},0 M14,-8 L${16 + l2},0`} stroke={ink} strokeWidth={3.5} strokeLinecap="round" />
      <ellipse cx={0} cy={-13} rx={24} ry={11} fill={color} stroke={ink} strokeWidth={3} />
      <path d="M18,-20 Q34,-16 36,-10 Q28,-6 18,-7Z" fill={color} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
      <circle cx={18} cy={-22} r={5} fill={mixc(color, '#C9A0A0', 0.4)} stroke={ink} strokeWidth={2} />
      <circle cx={27} cy={-15} r={2} fill={ink} />
      <circle cx={36} cy={-10} r={2} fill={ink} />
    </g>
  );
};

/** Small wooden cross (Christmas Truce burials, S04-06) and a football (props). */
export const WoodenCross: React.FC<{x: number; y: number; s?: number; tone?: Tone}> = ({x, y, s = 1, tone = (c) => c}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-6} y={-90} width={12} height={90} fill={tone('#8A6A44')} stroke={ink} strokeWidth={3.5} />
    <rect x={-28} y={-70} width={56} height={11} fill={tone('#8A6A44')} stroke={ink} strokeWidth={3.5} />
  </g>
);
export const Football: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x},${y - 14 * s}) rotate(${rot}) scale(${s})`}>
    <circle r={14} fill="#8A5A34" stroke={ink} strokeWidth={3} />
    <path d="M-13,-3 Q0,4 13,-3 M0,-14 L0,14" stroke={ink} strokeWidth={2} fill="none" />
  </g>
);

/** Falling dust from a roof (progress 0..1 after a cue; e.g. dust = prog(f, cue, cue + 50)). */
export const DustFall: React.FC<{progress: number; x0: number; x1: number; y0: number; y1: number; n?: number; seed?: number}> = ({progress, x0, x1, y0, y1, n = 46, seed = 3}) => {
  if (progress <= 0 || progress >= 1) return null;
  const r = rng(seed);
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const x = x0 + r() * (x1 - x0);
        const d = r() * 0.35;
        const sp = 0.7 + r() * 0.6;
        const t = clamp((progress - d) / (1 - d));
        if (t <= 0) return null;
        const y = y0 + (y1 - y0) * Math.pow(t, 1.6) * sp;
        return <circle key={i} cx={x + Math.sin(t * 6 + i) * 6} cy={y} r={2 + r() * 3} fill="#B9A988" opacity={(1 - t) * 0.85} />;
      })}
      <path d={`M${x0},${y0} L${x1},${y0}`} stroke="#B9A988" strokeWidth={10} opacity={0.5 * (1 - progress)} strokeDasharray="4 18" />
    </g>
  );
};

const Stars: React.FC<{f: number; y1: number; n?: number}> = ({f, y1, n = 70}) => {
  const r = rng(91);
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const x = r() * W;
        const y = r() * y1 * 0.95;
        const tw = 0.55 + 0.45 * Math.sin(f / (12 + (i % 7)) + i);
        if (x < 175 && y < 155) return null; // keep the logo zone clear
        return <circle key={i} cx={x} cy={y} r={1.6 + (i % 3)} fill="#F4F1E0" opacity={tw} />;
      })}
    </g>
  );
};

/** Drifting translucent mist bands between y0 and y1. */
export const MistBands: React.FC<{f: number; y0: number; y1: number; amount?: number; color?: string; n?: number}> = ({f, y0, y1, amount = 1, color = '#E6E6DE', n = 6}) => (
  <g opacity={amount}>
    {Array.from({length: n}).map((_, i) => {
      const y = y0 + ((y1 - y0) * (i + 0.5)) / n;
      const x = ((f * (0.4 + (i % 3) * 0.2) + i * 333) % (W + 900)) - 700;
      return <ellipse key={i} cx={x + 450} cy={y} rx={700} ry={34 + (i % 3) * 14} fill={color} opacity={0.32} />;
    })}
  </g>
);

/** Distant gun flashes on the horizon (intensity 0..1; pseudo-random flickers). */
export const HorizonFlashes: React.FC<{f: number; y: number; intensity: number}> = ({f, y, intensity}) => {
  if (intensity <= 0) return null;
  return (
    <g>
      {[0, 1, 2, 3].map((i) => {
        const step = Math.floor(f / 6) + i * 17;
        const on = hash(step * 3.1 + i) > 0.62 ? 1 - ((f % 6) / 6) : 0;
        if (!on) return null;
        const x = 200 + hash(step + i * 9) * (W - 400);
        return <ellipse key={i} cx={x} cy={y} rx={220} ry={70} fill="#FFD9A0" opacity={0.45 * on * intensity} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ props for the set
export type TrenchProps = {
  f: number;
  variant?: keyof typeof TRENCH_VARIANTS;
  view?: TrenchView;
  weather?: Weather;
  time?: TimeOfDay;
  /** Rain / snow particle density multiplier (0 = none; defaults from weather). */
  precip?: number;
  /** Mist amount 0..1 (defaults from weather). */
  mist?: number;
  /** Smoke on the horizon 0..1 (dawn variant default 0.7). */
  smoke?: number;
  /** Distant gun flashes on the horizon 0..1 (S07-03). */
  flashes?: number;
  /** Lanterns along the far (German) parapet 0..1 (night variant default 1). */
  farLanterns?: number;
  /** Rats: a number = that many rats on auto-run (driven by f); or explicit specs (t 0..1 across frame). */
  rats?: number | RatSpec[];
  ladders?: number[];
  periscope?: number | false;
  dugoutEntrance?: boolean;
  /** Gas-curtain sway / lift 0..1 (someone passing through). */
  curtain?: number;
  /** Water level in the sump 0..1 (1 = brim). */
  sump?: number;
  candles?: boolean;
  /** Dust falling from the dugout roof (progress 0..1 after a cue). */
  dust?: number;
  /** Cutaway: lines draw on (0..1), labels (0..1), figure flow (loop phase; defaults to f-driven). */
  draw?: number;
  labels?: number;
  flow?: number;
  /** No-man's-land: show our parapet along the bottom (default true). */
  nearParapet?: boolean;
  /** Mud view: rain-ripple strength. */
  ripples?: number;
};

const rain = (f: number, n: number, op = 1) => <Particles f={f} kind="rain" n={n} seed={5} wind={-0.6} opacity={op} />;

// ================================================================== 'trench'
const TrenchView: React.FC<Required<Pick<TrenchProps, 'f' | 'weather' | 'time'>> & TrenchProps & {tone: Tone; id: string}> = (p) => {
  const {f, tone, time, weather, id} = p;
  const night = time === 'night';
  const frost = weather === 'frost' || weather === 'snow' ? 1 : 0;
  const L = TRENCH;
  const [sTop, sBot] = skyFor(time, weather);
  const ground = tone(frost ? '#B9BBAE' : '#8C7A5A');
  const wall = tone('#7A6248');
  const ladders = p.ladders ?? L.ladderX;
  const sump = p.sump ?? 0.75;
  const farLan = p.farLanterns ?? (night ? 1 : 0);
  const smoke = p.smoke ?? (time === 'dawn' ? 0.7 : 0);
  const [sx0, sx1] = L.sumpX;
  const ratList: RatSpec[] = typeof p.rats === 'number' ? Array.from({length: p.rats}).map((_, i) => ({lane: (['floor', 'parapet', 'firestep'] as const)[i % 3], t: (((f * (2.6 + i * 0.4)) / (W + 400) + i * 0.37) % 1), dir: i % 2 ? -1 : 1})) : p.rats ?? [];
  const laneY = {floor: L.floorY + 18, parapet: L.crestY - 2, firestep: L.firestepY + 2};
  return (
    <g>
      <Sky top={sTop} bottom={sBot} y1={L.horizonY + 40} id={`${id}-sky`} />
      {night && <Stars f={f} y1={L.horizonY} />}
      {night && <circle cx={1560} cy={150} r={46} fill="#EDE8D0" opacity={0.9} />}
      <HorizonFlashes f={f} y={L.horizonY} intensity={p.flashes ?? 0} />
      {/* distant German parapet, trees, no-man's land */}
      <path d={`M-100,${L.horizonY + 20} ${Array.from({length: 26}).map((_, i) => `L${i * 80 - 60},${L.horizonY - 6 + hash(i * 3.3) * 10}`).join(' ')} L${W + 100},${L.horizonY + 20}Z`} fill={tone('#A4987A')} stroke={ink} strokeWidth={3} />
      {[180, 640, 1180, 1720].map((x, i) => (
        <g key={i} transform={`translate(${x},${L.horizonY + 2}) scale(${0.55 + (i % 2) * 0.15})`} stroke={tone('#3A3A36')} strokeWidth={8} strokeLinecap="round" fill="none">
          <path d="M0,0 L-4,-120 M-3,-70 L-30,-100 M-4,-95 L16,-130" />
        </g>
      ))}
      {farLan > 0 && [260, 520, 760, 1010, 1270, 1500, 1760].map((x, i) => <Lantern key={i} x={x} y={L.horizonY - 30} f={f + i * 13} lit={farLan} s={0.55} seed={i} />)}
      <rect x={-100} y={L.horizonY + 8} width={W + 200} height={L.crestY - L.horizonY} fill={ground} />
      {[[300, 380, 90], [900, 420, 120], [1500, 390, 80], [1200, 470, 150], [520, 470, 130]].map(([x, y, r], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.22} fill={tone(frost ? '#9EA196' : '#6E5E44')} stroke={ink} strokeWidth={2.5} />
          <ellipse cx={x} cy={y + 2} rx={r * 0.7} ry={r * 0.13} fill={tone(night ? '#2A3550' : '#8FA2A8')} opacity={0.7} />
        </g>
      ))}
      {smoke > 0 && [240, 760, 1320, 1700].map((x, i) => <Smoke key={i} x={x} y={L.horizonY + 10} f={f} n={7} size={46} rise={220} drift={120} color={tone('#8C8C86')} opacity={0.55 * smoke} outline={false} seed={i + 3} />)}
      <WireCoils x0={-60} x1={W + 60} y={L.crestY - 32} s={0.85} seed={4} color={tone('#2E2A24')} frost={frost} />
      {/* parapet + front wall */}
      <Sandbags y0={L.crestY - 14} y1={L.crestY + 120} tone={tone} frost={frost} />
      <rect x={-100} y={L.crestY + 118} width={W + 200} height={L.firestepY - L.crestY - 118} fill={wall} />
      {/* wicker / timber revetment */}
      {Array.from({length: 9}).map((_, i) => {
        const x0 = -60 + i * 250;
        return (
          <g key={i}>
            {Array.from({length: 6}).map((__, k) => {
              const y = L.crestY + 132 + k * 18;
              return <path key={k} d={`M${x0},${y} Q${x0 + 60},${y + (k % 2 ? 6 : -6)} ${x0 + 125},${y} T${x0 + 250},${y}`} fill="none" stroke={tone('#5E4A30')} strokeWidth={6} opacity={0.8} />;
            })}
            <rect x={x0 - 11} y={L.crestY + 60} width={22} height={L.firestepY - L.crestY - 60} fill={tone('#6B4E32')} stroke={ink} strokeWidth={3.5} />
          </g>
        );
      })}
      {/* dugout entrance with gas curtain */}
      {p.dugoutEntrance !== false && (
        <g>
          <rect x={L.dugoutX - 95} y={L.crestY + 150} width={190} height={L.floorY - L.crestY - 150} fill="#1E1812" stroke={ink} strokeWidth={5} />
          {[0, 1, 2].map((k) => <rect key={k} x={L.dugoutX - 80 + k * 10} y={L.floorY - 40 - k * 40} width={160 - k * 20} height={10} fill="#3A2E22" />)}
          <rect x={L.dugoutX - 110} y={L.crestY + 135} width={220} height={22} fill={tone('#6B4E32')} stroke={ink} strokeWidth={4} />
          <rect x={L.dugoutX - 110} y={L.crestY + 150} width={20} height={L.floorY - L.crestY - 150} fill={tone('#6B4E32')} stroke={ink} strokeWidth={4} />
          <rect x={L.dugoutX + 90} y={L.crestY + 150} width={20} height={L.floorY - L.crestY - 150} fill={tone('#6B4E32')} stroke={ink} strokeWidth={4} />
          {(() => {
            const lift = clamp(p.curtain ?? 0);
            const sway = Math.sin(f / 22) * 6 + lift * 30;
            const top = L.crestY + 157;
            const bot = L.floorY - 10 - lift * 170;
            return (
              <g>
                <path d={`M${L.dugoutX - 88},${top} L${L.dugoutX + 88},${top} L${L.dugoutX + 88 + sway},${bot} Q${L.dugoutX + sway * 0.5},${bot + 12} ${L.dugoutX - 88 + sway},${bot}Z`} fill={tone('#6E6A4E')} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
                <rect x={L.dugoutX - 92} y={top - 4} width={184} height={20} rx={9} fill={tone('#5E5A40')} stroke={ink} strokeWidth={3.5} />
                <path d={`M${L.dugoutX - 40 + sway * 0.4},${top + 30} L${L.dugoutX - 38 + sway * 0.8},${bot - 10} M${L.dugoutX + 30 + sway * 0.4},${top + 30} L${L.dugoutX + 34 + sway * 0.8},${bot - 10}`} stroke={ink} strokeWidth={2} opacity={0.4} />
              </g>
            );
          })()}
        </g>
      )}
      {/* lanterns on posts, candle stubs on the firestep */}
      {(night || time === 'dawn') && [250, 1000, 1750].map((x, i) => <Lantern key={i} x={x + 11} y={L.crestY + 76} f={f + i * 20} lit={night ? 1 : 0.4} seed={i + 7} />)}
      {(p.candles ?? night) && [640, 1460].map((x, i) => <Candle key={i} x={x} y={L.firestepY + 2} f={f} s={0.38} seed={i + 2} />)}
      {/* firestep */}
      <rect x={-100} y={L.firestepY} width={W + 200} height={L.floorY - L.firestepY} fill={tone('#5E4630')} stroke={ink} strokeWidth={4} />
      <rect x={-100} y={L.firestepY - 4} width={W + 200} height={14} fill={tone(frost ? '#C9C2B0' : '#A88A5E')} stroke={ink} strokeWidth={4} />
      {Array.from({length: 18}).map((_, i) => <line key={i} x1={i * 115 - 40} y1={L.firestepY + 10} x2={i * 115 - 40} y2={L.floorY} stroke={ink} strokeWidth={3} opacity={0.55} />)}
      {/* floor, duckboards, sump */}
      <rect x={-100} y={L.floorY} width={W + 200} height={H - L.floorY + 200} fill={tone('#6A5440')} />
      <path d={`M-100,${L.floorY} L${W + 100},${L.floorY}`} stroke={ink} strokeWidth={4} />
      <g>
        <rect x={sx0} y={L.floorY + 6} width={sx1 - sx0} height={120} rx={20} fill={tone('#4A3A2A')} stroke={ink} strokeWidth={4} />
        <rect x={sx0 + 6} y={L.floorY + 6 + 110 * (1 - sump)} width={sx1 - sx0 - 12} height={Math.max(0, 110 * sump)} rx={16} fill={tone(night ? '#2C3A50' : '#7C8E88')} opacity={0.95} />
        {[0, 1, 2].map((k) => {
          const t = ((f + k * 30) % 90) / 90;
          const cx = sx0 + (sx1 - sx0) * (0.25 + 0.25 * k);
          return <ellipse key={k} cx={cx} cy={L.floorY + 14 + 110 * (1 - sump)} rx={10 + t * 70} ry={3 + t * 8} fill="none" stroke="#E6EEEE" strokeWidth={2.5} opacity={(1 - t) * 0.8} />;
        })}
      </g>
      {[[-100, sx0 - 20], [sx1 + 20, W + 100]].map(([a, b], j) => (
        <g key={j}>
          <rect x={a} y={L.floorY + 6} width={b - a} height={40} fill={tone(frost ? '#BDAE8A' : '#A88A5E')} stroke={ink} strokeWidth={4} />
          {Array.from({length: Math.ceil((b - a) / 46)}).map((_, i) => <line key={i} x1={a + i * 46} y1={L.floorY + 6} x2={a + i * 46 - 6} y2={L.floorY + 46} stroke={ink} strokeWidth={3} />)}
        </g>
      ))}
      {/* broken duckboard tilting into the sump */}
      <path d={`M${sx0 - 20},${L.floorY + 8} L${sx0 + 120},${L.floorY + 40 + 110 * (1 - sump) * 0.3} L${sx0 + 110},${L.floorY + 70} L${sx0 - 22},${L.floorY + 46}Z`} fill={tone('#9A7E56')} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      {/* ladders + periscope */}
      {ladders.map((x, i) => <TrenchLadder key={i} x={x} y={L.floorY + 20} h={L.floorY - L.crestY + 70} tone={tone} />)}
      {p.periscope !== false && <BoxPeriscope x={p.periscope ?? L.periscopeX} y={L.firestepY} h={L.firestepY - L.crestY + 40} tone={tone} glint={night ? 0 : 0.6 + 0.4 * Math.sin(f / 15)} />}
      {/* rats */}
      {ratList.map((r, i) => (
        <Rat key={i} x={-120 + (W + 240) * (r.dir === -1 ? 1 - r.t : r.t)} y={laneY[r.lane]} f={f + i * 5} dir={r.dir ?? 1} s={0.9} color={tone('#7E7E78')} />
      ))}
      {/* weather */}
      {weather === 'rain' && rain(f, Math.round(130 * (p.precip ?? 1)), 0.9)}
      {weather === 'snow' && <Particles f={f} kind="snow" n={Math.round(60 * (p.precip ?? 1))} seed={6} wind={0.4} speed={0.5} />}
      {(p.mist ?? (weather === 'mist' ? 1 : 0)) > 0 && <MistBands f={f} y0={L.horizonY - 40} y1={L.crestY + 60} amount={p.mist ?? 1} color={time === 'night' ? '#6A7488' : '#E8E6DE'} />}
    </g>
  );
};

// ================================================================== 'mud' (Passchendaele)
const MudView: React.FC<TrenchProps & {f: number; tone: Tone; time: TimeOfDay; weather: Weather; id: string}> = (p) => {
  const {f, tone, id} = p;
  const M = MUD;
  const [sTop, sBot] = skyFor(p.time, p.weather);
  const r = rng(77);
  const holes = Array.from({length: 22}).map((_, i) => {
    const depth = r();
    const y = M.horizonY + 30 + depth * depth * 380;
    const s = 0.25 + depth * 1.2;
    return {x: r() * (W + 200) - 100, y, rx: (60 + r() * 70) * s, ry: (14 + r() * 10) * s, i};
  }).sort((a, b) => a.y - b.y);
  const rip = p.ripples ?? (p.weather === 'rain' ? 1 : 0.3);
  return (
    <g>
      <Sky top={sTop} bottom={sBot} y1={M.horizonY + 30} id={`${id}-sky`} />
      <HorizonFlashes f={f} y={M.horizonY} intensity={p.flashes ?? 0} />
      <path d={`M-100,${M.horizonY + 10} ${Array.from({length: 22}).map((_, i) => `L${i * 95 - 80},${M.horizonY - 4 + hash(i * 5.1) * 12}`).join(' ')} L${W + 100},${M.horizonY + 10}Z`} fill={tone('#7E7262')} />
      <rect x={-100} y={M.horizonY + 6} width={W + 200} height={H} fill={tone('#6E604C')} />
      {/* mud ridges */}
      {Array.from({length: 9}).map((_, i) => {
        const y = M.horizonY + 24 + i * i * 7 + i * 20;
        return <path key={i} d={`M-100,${y} ${Array.from({length: 12}).map((_, k) => `Q${k * 180 - 10},${y - 10 - hash(i * 9 + k) * 18} ${k * 180 + 80},${y}`).join(' ')}`} fill="none" stroke={tone('#5A4C3A')} strokeWidth={3 + i * 0.6} opacity={0.7} />;
      })}
      {/* water-filled shell holes */}
      {holes.map((h) => (
        <g key={h.i}>
          <ellipse cx={h.x} cy={h.y} rx={h.rx * 1.12} ry={h.ry * 1.25} fill={tone('#5A4A38')} stroke={ink} strokeWidth={2.5} />
          <ellipse cx={h.x} cy={h.y + h.ry * 0.12} rx={h.rx} ry={h.ry} fill={tone('#7C8A8A')} />
          <ellipse cx={h.x - h.rx * 0.3} cy={h.y - h.ry * 0.2} rx={h.rx * 0.35} ry={h.ry * 0.25} fill="#C9D2D0" opacity={0.35} />
          {rip > 0 &&
            [0, 1].map((k) => {
              const t = ((f + h.i * 13 + k * 23) % 46) / 46;
              return <ellipse key={k} cx={h.x + (hash(h.i + k) - 0.5) * h.rx} cy={h.y} rx={4 + t * h.rx * 0.3} ry={1.5 + t * h.ry * 0.3} fill="none" stroke="#EEF2F0" strokeWidth={1.8} opacity={(1 - t) * 0.8 * rip} />;
            })}
        </g>
      ))}
      {/* shattered stumps */}
      {[[160, 520, 0.6], [470, 470, 0.45], [820, 560, 0.75], [1130, 480, 0.5], [1420, 590, 0.85], [1730, 500, 0.55], [60, 700, 1.2], [1840, 760, 1.3]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x},${y}) scale(${s})`}>
          <path d={`M-16,0 L-14,-120 L-6,-150 L2,-128 L8,-170 L14,-118 L16,0Z`} fill={tone('#4E4236')} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
          <path d="M8,-110 L40,-140" stroke={ink} strokeWidth={6} strokeLinecap="round" />
        </g>
      ))}
      {/* receding duckboard track */}
      {(() => {
        const pts: [number, number, number][] = [[1500, 850, 1], [1300, 760, 0.8], [1180, 680, 0.62], [1000, 610, 0.48], [820, 560, 0.38], [700, 520, 0.3], [560, 490, 0.24], [460, 468, 0.2]];
        return (
          <g>
            {pts.slice(0, -1).map((a, i) => {
              const b = pts[i + 1];
              const w0 = 34 * a[2];
              const w1 = 34 * b[2];
              return (
                <g key={i}>
                  <path d={`M${a[0]},${a[1] - w0} L${b[0]},${b[1] - w1} L${b[0]},${b[1] + w1} L${a[0]},${a[1] + w0}Z`} fill={tone('#9A7E56')} stroke={ink} strokeWidth={2.5 + a[2] * 1.5} strokeLinejoin="round" />
                  {Array.from({length: 5}).map((_, k) => {
                    const t = (k + 0.5) / 5;
                    const x = a[0] + (b[0] - a[0]) * t;
                    const y = a[1] + (b[1] - a[1]) * t;
                    const w = w0 + (w1 - w0) * t;
                    return <line key={k} x1={x - 4} y1={y - w} x2={x + 4} y2={y + w} stroke={ink} strokeWidth={1.5 + a[2]} opacity={0.6} />;
                  })}
                </g>
              );
            })}
          </g>
        );
      })()}
      {/* main foreground duckboard track (figures walk on MUD.trackY) */}
      <rect x={-100} y={M.trackY - 10} width={W + 200} height={44} fill={tone('#A88A5E')} stroke={ink} strokeWidth={4.5} />
      {Array.from({length: 46}).map((_, i) => <line key={i} x1={i * 46 - 60} y1={M.trackY - 10} x2={i * 46 - 66} y2={M.trackY + 34} stroke={ink} strokeWidth={3.5} />)}
      <rect x={-100} y={M.trackY + 34} width={W + 200} height={H} fill={tone('#5E5040')} />
      <ellipse cx={720} cy={M.trackY + 120} rx={300} ry={40} fill={tone('#7C8A8A')} stroke={ink} strokeWidth={3} />
      <ellipse cx={1600} cy={M.trackY + 150} rx={240} ry={34} fill={tone('#7C8A8A')} stroke={ink} strokeWidth={3} />
      {p.weather === 'rain' && rain(f, Math.round(170 * (p.precip ?? 1)), 0.9)}
      <MistBands f={f} y0={M.horizonY - 30} y1={M.horizonY + 160} amount={p.mist ?? 0.8} color="#C9CCC6" />
    </g>
  );
};

// ================================================================== 'nomansland' (over the parapet)
const NoMansLandView: React.FC<TrenchProps & {f: number; tone: Tone; time: TimeOfDay; weather: Weather; id: string}> = (p) => {
  const {f, tone, id} = p;
  const N = NML;
  const frost = p.weather === 'frost' || p.weather === 'snow' ? 1 : 0;
  const [sTop, sBot] = skyFor(p.time, p.weather);
  const groundC = tone(frost ? '#C3C6BA' : '#9A8C6A');
  const r = rng(55);
  const craters = Array.from({length: 16}).map((_, i) => {
    const d = r();
    return {x: r() * (W + 200) - 100, y: N.horizonY + 40 + d * d * 520, s: 0.3 + d * 1.1, i};
  }).sort((a, b) => a.y - b.y);
  const farLan = p.farLanterns ?? (p.time === 'night' ? 1 : 0);
  const smoke = p.smoke ?? (p.time === 'dawn' ? 0.7 : 0);
  return (
    <g>
      <Sky top={sTop} bottom={sBot} y1={N.horizonY + 30} id={`${id}-sky`} />
      {p.time === 'night' && <Stars f={f} y1={N.horizonY} />}
      <HorizonFlashes f={f} y={N.horizonY} intensity={p.flashes ?? 0} />
      {[140, 420, 980, 1350, 1640, 1860].map((x, i) => (
        <g key={i} transform={`translate(${x},${N.horizonY - 2}) scale(${0.8 + (i % 3) * 0.2})`} stroke={tone('#3A3A36')} strokeWidth={8} strokeLinecap="round" fill="none">
          <path d="M0,0 L-4,-130 M-3,-80 L-34,-112 M-4,-104 L18,-140 M-34,-112 L-44,-128" />
        </g>
      ))}
      <rect x={-100} y={N.horizonY} width={W + 200} height={H} fill={groundC} />
      {/* far (German) parapet */}
      <Sandbags y0={N.farParapetY - 16} y1={N.farParapetY + 14} bag={0.32} tone={tone} frost={frost} seed={9} />
      {farLan > 0 && [200, 470, 760, 1060, 1330, 1620].map((x, i) => <Lantern key={i} x={x} y={N.farParapetY - 30} f={f + i * 11} lit={farLan} s={0.45} seed={i} />)}
      <WireCoils x0={-60} x1={W + 60} y={N.farParapetY + 52} s={0.4} seed={2} color={tone('#3A3630')} frost={frost} />
      {craters.map((c) => (
        <g key={c.i} transform={`translate(${c.x},${c.y}) scale(${c.s})`}>
          <ellipse rx={110} ry={26} fill={tone(frost ? '#A9AC9E' : '#7A6A4C')} stroke={ink} strokeWidth={3} />
          <ellipse cy={3} rx={78} ry={15} fill={tone(frost ? '#D6DCDC' : '#6A5A40')} />
        </g>
      ))}
      {smoke > 0 && [300, 900, 1500].map((x, i) => <Smoke key={i} x={x} y={N.horizonY + 30} f={f} n={8} size={60} rise={260} drift={140} color={tone('#9A9A94')} opacity={0.6 * smoke} outline={false} seed={i + 1} />)}
      {/* our wire with gaps (centre is open for figures) */}
      <WireCoils x0={-60} x1={560} y={N.nearY - 70} s={0.8} seed={6} color={tone('#2E2A24')} frost={frost} />
      <WireCoils x0={1380} x1={W + 60} y={N.nearY - 70} s={0.8} seed={8} color={tone('#2E2A24')} frost={frost} />
      {p.nearParapet !== false && <Sandbags y0={N.nearY + 40} y1={H + 60} tone={tone} frost={frost} seed={3} />}
      {p.weather === 'snow' && <Particles f={f} kind="snow" n={Math.round(60 * (p.precip ?? 1))} seed={6} wind={0.4} speed={0.5} />}
      {p.weather === 'rain' && rain(f, Math.round(120 * (p.precip ?? 1)), 0.9)}
      {(p.mist ?? (p.weather === 'mist' ? 1 : 0)) > 0 && <MistBands f={f} y0={N.horizonY - 20} y1={N.nearY} amount={p.mist ?? 1} />}
    </g>
  );
};

// ================================================================== 'cutaway' (front · support · reserve)
const zigzag = (y: number, x0: number, x1: number, amp = 26, step = 70) => {
  const pts: [number, number][] = [];
  for (let x = x0, i = 0; x <= x1; x += step, i++) pts.push([x, y + (i % 2 ? -amp : amp) * 0.5]);
  return pts;
};
const crenel = (y: number, x0: number, x1: number) => {
  // fire-bay "battlement" trace seen from above
  const pts: [number, number][] = [];
  for (let x = x0, i = 0; x <= x1; x += 60, i++) {
    const yy = y + (i % 2 ? -22 : 22);
    pts.push([x, yy], [x + 60, yy]);
  }
  return pts;
};
const pathD = (pts: [number, number][]) => 'M' + pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' L');
const alongPts = (pts: [number, number][], t: number): [number, number] => {
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tg = lens[lens.length - 1] * clamp(t);
  for (let i = 1; i < pts.length; i++)
    if (lens[i] >= tg) {
      const k = (tg - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
    }
  return pts[pts.length - 1];
};
const CutawayView: React.FC<TrenchProps & {f: number; tone: Tone}> = (p) => {
  const {f, tone} = p;
  const Y = CUTAWAY;
  const draw = clamp(p.draw ?? 1);
  const lab = clamp(p.labels ?? 1);
  const x0 = 470;
  const x1 = 1860;
  const lines = [crenel(Y.frontY, x0, x1), zigzag(Y.supportY, x0, x1, 30, 90), zigzag(Y.reserveY, x0, x1, 30, 110)];
  const commA = [[760, Y.reserveY + 230], [740, Y.reserveY + 120], [790, Y.reserveY], [730, Y.reserveY - 80], [800, Y.supportY + 60], [760, Y.supportY], [820, Y.supportY - 90], [760, Y.frontY + 70], [800, Y.frontY]] as [number, number][];
  const commB = [[1500, Y.frontY], [1450, Y.frontY + 80], [1520, Y.supportY - 70], [1470, Y.supportY], [1530, Y.supportY + 80], [1470, Y.reserveY - 60], [1520, Y.reserveY], [1480, Y.reserveY + 120], [1520, Y.reserveY + 230]] as [number, number][];
  const flow = p.flow ?? f / 420;
  const trench = (pts: [number, number][], w: number, k: string) => (
    <g key={k}>
      <path d={pathD(pts)} fill="none" stroke={tone('#B5A37A')} strokeWidth={w + 16} strokeLinejoin="miter" pathLength={1} strokeDasharray={`${draw} 2`} />
      <path d={pathD(pts)} fill="none" stroke={ink} strokeWidth={w + 6} strokeLinejoin="miter" pathLength={1} strokeDasharray={`${draw} 2`} />
      <path d={pathD(pts)} fill="none" stroke={tone('#4A3A28')} strokeWidth={w} strokeLinejoin="miter" pathLength={1} strokeDasharray={`${draw} 2`} />
    </g>
  );
  return (
    <g>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={tone('#A99A72')} />
      {Array.from({length: 40}).map((_, i) => <circle key={i} cx={(i * 211) % W} cy={170 + ((i * 137) % 900)} r={20 + (i % 5) * 14} fill={tone('#9A8B64')} opacity={0.6} />)}
      {/* enemy line + no-man's land */}
      <rect x={-200} y={160} width={W + 400} height={Y.frontY - 230} fill={tone('#8E8262')} opacity={0.6} />
      <path d={pathD(crenel(205, 180, W + 60))} fill="none" stroke={tone('#5A5040')} strokeWidth={18} opacity={0.55} />
      <WireCoils x0={x0 - 40} x1={x1 + 40} y={Y.frontY - 58} s={0.45} seed={3} color={tone('#2E2A24')} />
      {trench(commA, 20, 'ca')}
      {trench(commB, 20, 'cb')}
      {lines.map((l, i) => trench(l, i === 0 ? 30 : 26, 'l' + i))}
      {/* figure tokens filing forward (left) and back (right), in a loop */}
      {draw > 0.95 &&
        [commA, commB].map((route, r) =>
          Array.from({length: 9}).map((_, i) => {
            const t = (((flow + i / 9) % 1) + 1) % 1;
            const q = alongPts(route, t);
            const fade = Math.min(1, t * 8, (1 - t) * 8);
            return (
              <g key={`${r}-${i}`} opacity={fade}>
                <circle cx={q[0]} cy={q[1] - 4} r={10} fill="#fff" stroke={ink} strokeWidth={3} />
                <circle cx={q[0]} cy={q[1] + 9} r={6} fill={tone(r ? '#6E5A3A' : '#5E6238')} stroke={ink} strokeWidth={2} />
              </g>
            );
          }),
        )}
      {/* line labels (left, outside the logo zone) */}
      {(['FRONT LINE', 'SUPPORT', 'RESERVE'] as const).map((t, i) => {
        const y = [Y.frontY, Y.supportY, Y.reserveY][i];
        const k = easeOut(clamp(lab * 3 - i));
        return (
          <g key={t} opacity={k} transform={`translate(${(1 - k) * -40},0)`}>
            <rect x={60} y={y - 34} width={370} height={68} rx={12} fill="#F5EFDF" stroke={ink} strokeWidth={5} />
            <text x={245} y={y + 13} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={40} fill={ink}>{t}</text>
            <line x1={430} y1={y} x2={x0 - 10} y2={y} stroke={ink} strokeWidth={4} strokeDasharray="10 8" />
          </g>
        );
      })}
      <text x={1180} y={196} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={36} fill={tone('#3A3226')} opacity={0.75 * lab}>ENEMY LINES</text>
    </g>
  );
};

// ================================================================== 'dugout' (interior)
const DugoutView: React.FC<TrenchProps & {f: number; tone: Tone}> = (p) => {
  const {f} = p;
  const D = DUGOUT;
  const breathe = 0.85 + 0.15 * noise1(f / 9, 4);
  const tone = (c: string) => mixc(c, '#1A140E', 0.35);
  return (
    <g>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={tone('#5A4632')} />
      {/* plank back wall */}
      {Array.from({length: 13}).map((_, i) => <rect key={i} x={-40} y={120 + i * 62} width={W + 80} height={58} fill={tone(i % 2 ? '#6E5638' : '#664F34')} stroke={ink} strokeWidth={3} />)}
      {/* roof beams */}
      <rect x={-100} y={60} width={W + 200} height={80} fill={tone('#4A3624')} stroke={ink} strokeWidth={5} />
      {[180, 640, 1100, 1560].map((x) => <rect key={x} x={x - 60} y={40} width={120} height={110} fill={tone('#5E4630')} stroke={ink} strokeWidth={5} />)}
      {/* props (posts) */}
      {[360, 1000, 1640].map((x) => <rect key={x} x={x - 26} y={140} width={52} height={D.floorY - 140} fill={tone('#6B4E32')} stroke={ink} strokeWidth={5} />)}
      {/* entrance steps with gas curtain (left) */}
      <rect x={60} y={300} width={200} height={D.floorY - 300} fill="#14100C" stroke={ink} strokeWidth={5} />
      {[0, 1, 2, 3, 4].map((k) => <rect key={k} x={70} y={D.floorY - 60 - k * 90} width={180 - k * 10} height={16} fill="#3A2E22" />)}
      <rect x={110} y={300} width={110} height={60} fill="#C9C6A8" opacity={0.25} />
      <path d={`M70,310 L250,310 L${250 + Math.sin(f / 30) * 6},${D.floorY - 40} L${70 + Math.sin(f / 30) * 6},${D.floorY - 40}Z`} fill={tone('#6E6A4E')} stroke={ink} strokeWidth={4} opacity={0.92} />
      {/* bunks: two tiers, wire-mesh beds */}
      {[[440, D.bunkSeatY], [440, 470]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y - 30} width={520} height={34} fill={tone('#7A5E3E')} stroke={ink} strokeWidth={5} />
          <path d={Array.from({length: 26}).map((_, k) => `M${x + 10 + k * 20},${y - 28} l10,30 l10,-30`).join(' ')} fill="none" stroke={ink} strokeWidth={1.6} opacity={0.5} />
          <rect x={x + 30} y={y - 52} width={120} height={26} rx={10} fill={tone('#8C866E')} stroke={ink} strokeWidth={3.5} />
        </g>
      ))}
      {[440, 960].map((x) => <rect key={x} x={x - 12} y={420} width={24} height={D.floorY - 420} fill={tone('#6B4E32')} stroke={ink} strokeWidth={4} />)}
      {/* blanket on the lower bunk */}
      <path d={`M600,${D.bunkSeatY - 30} L900,${D.bunkSeatY - 30} L920,${D.bunkSeatY + 50} L620,${D.bunkSeatY + 40}Z`} fill={tone('#7A6A5A')} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      {/* hanging greatcoat on a nail */}
      <g transform={`rotate(${Math.sin(f / 40) * 1.5},1500,250)`}>
        <circle cx={1500} cy={250} r={6} fill={ink} />
        <path d="M1500,252 L1440,290 L1420,560 L1470,600 L1530,600 L1580,560 L1560,290Z" fill={tone('#6A6650')} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
        <path d="M1500,262 L1500,590" stroke={ink} strokeWidth={3} opacity={0.6} />
        {[330, 400, 470, 540].map((y) => <circle key={y} cx={1490} cy={y} r={5} fill={tone('#C9B26A')} stroke={ink} strokeWidth={2} />)}
      </g>
      {/* crate table with candle */}
      <rect x={1130} y={D.candle[1]} width={220} height={D.floorY - D.candle[1]} fill={tone('#8A6A44')} stroke={ink} strokeWidth={5} />
      <line x1={1130} y1={D.candle[1] + 50} x2={1350} y2={D.candle[1] + 50} stroke={ink} strokeWidth={3} />
      <rect x={1260} y={D.candle[1] - 22} width={50} height={22} rx={4} fill={tone('#9A9A88')} stroke={ink} strokeWidth={3} />
      <Candle x={D.candle[0]} y={D.candle[1]} f={f} s={0.55} seed={4} />
      {/* floor */}
      <rect x={-200} y={D.floorY} width={W + 400} height={300} fill={tone('#4A3A2A')} />
      <path d={`M-200,${D.floorY} L${W + 200},${D.floorY}`} stroke={ink} strokeWidth={5} />
      {/* candlelight */}
      <defs>
        <radialGradient id="dugout-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFD58A" stopOpacity={0.42 * breathe} />
          <stop offset="1" stopColor="#FFD58A" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="dugout-dark" cx="0.62" cy="0.7" r="0.75">
          <stop offset="0.35" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.55} />
        </radialGradient>
      </defs>
      <ellipse cx={D.candle[0]} cy={D.candle[1] - 40} rx={760} ry={560} fill="url(#dugout-glow)" />
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="url(#dugout-dark)" />
      <DustFall progress={p.dust ?? 0} x0={150} x1={1750} y0={140} y1={D.floorY} />
    </g>
  );
};

// ================================================================== the set
/** E-01 trench set.  `variant` picks a storyboard preset; `view` / `weather` / `time` override it. */
export const Trench: React.FC<TrenchProps & {id?: string}> = (p) => {
  const pre = p.variant ? TRENCH_VARIANTS[p.variant] : TRENCH_VARIANTS.a;
  const view = p.view ?? pre.view;
  const weather = p.weather ?? pre.weather;
  const time = p.time ?? pre.time;
  const tone = toneFor(time, weather);
  const id = p.id ?? `tr${view}${time}${weather}`;
  if (view === 'mud') return <MudView {...p} tone={tone} time={time} weather={weather} id={id} />;
  if (view === 'nomansland') return <NoMansLandView {...p} tone={tone} time={time} weather={weather} id={id} />;
  if (view === 'cutaway') return <CutawayView {...p} tone={tone} />;
  if (view === 'dugout') return <DugoutView {...p} tone={tone} />;
  return <TrenchView {...p} weather={weather} time={time} tone={tone} id={id} />;
};

/**
 * Foreground layer for the trench view, drawn AFTER the characters: knee-deep flood water
 * (flood 0..1 → 0 to ~70 px over the duckboards, with ripples) and optional rain in front.
 */
export const TrenchForeground: React.FC<{f: number; flood?: number; rain?: number; time?: TimeOfDay}> = ({f, flood = 0, rain: rn = 0, time = 'day'}) => {
  const L = TRENCH;
  const lvl = L.floorY + 40 - 110 * clamp(flood);
  return (
    <g>
      {flood > 0 && (
        <g>
          <rect x={-100} y={lvl} width={W + 200} height={H - lvl + 200} fill={time === 'night' ? '#2C3A50' : '#6F817C'} opacity={0.82} />
          <path d={`M-100,${lvl} ${Array.from({length: 40}).map((_, i) => `L${i * 52 - 100},${lvl + Math.sin(f / 8 + i) * 2.5}`).join(' ')}`} stroke="#E6EEEE" strokeWidth={3} fill="none" opacity={0.7} />
          {[0, 1, 2, 3].map((k) => {
            const t = ((f + k * 22) % 88) / 88;
            return <ellipse key={k} cx={300 + k * 420} cy={lvl + 6} rx={14 + t * 90} ry={3 + t * 9} fill="none" stroke="#E6EEEE" strokeWidth={2.5} opacity={(1 - t) * 0.8} />;
          })}
        </g>
      )}
      {rn > 0 && <Particles f={f + 999} kind="rain" n={Math.round(60 * rn)} seed={12} wind={-0.6} opacity={0.9} />}
    </g>
  );
};
