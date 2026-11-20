// Chapters 4–5 local sets and helpers: figure element, look, iris, legislature room, ballroom with musicians,
// parlour, courthouse, House chamber, meeting room, debate platform, newspapers, the "4 sons" icon row.
// Generic period places (never labelled as a specific original interior unless the storyboard sources it).
import React from 'react';
import {Person, CAST} from '../kit/Cast';
import {GradeLayer, Grain, Vig} from '../kit/Cinema';
import {C, FONT} from '../styles/theme';
import {clamp, easeInOut, hash, noise1, prog} from '../animations/core';
import {scribble, Hand} from '../kit/Paper';
import {Chair} from '../kit/Seats';
import {seatHeight} from '../kit/Seats';
import {castBuild, castScale} from '../kit/Cast';
import {walk, stand} from '../characters/poses';
import type {Fig} from './reelSolve';
import type {PropDef} from '../kit/Props';

const ink = C.ink;
const o = (w = 4) => ({stroke: ink, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});
const castS = (id: string) => CAST[id].scale ?? 1;

/** A solved figure drawn as its cast member (solver placements already include the cast scale). */
export const FigEl: React.FC<{g: Fig; f: number; seed?: number; lod?: 'full' | 'low'; label?: string; outfit?: Record<string, unknown>; opacity?: number}> = ({g, f, seed = 1, lod, label, outfit, opacity}) => (
  <Person
    id={g.id}
    x={g.pl.x}
    y={g.pl.y}
    scale={(g.pl.scale ?? 1) / castS(g.id)}
    dir={g.pl.dir}
    pose={g.P}
    f={f}
    seed={seed}
    look={g.look}
    talking={g.talking}
    tag={label ? false : g.tag}
    label={label && g.tag ? label : undefined}
    fromBehind={g.fromBehind}
    eyesClosed={g.eyesClosed}
    lod={lod}
    opacity={opacity ?? g.opacity}
    outfit={outfit as never}
    head={{...(g.ex ? {expression: g.ex.expression as never, exprFrom: g.ex.exprFrom as never, exprT: g.ex.exprT} : {}), ...(g.noHat ? {hat: 'none'} : {})}}
  />
);

export const Look: React.FC<{f: number; grade: Parameters<typeof GradeLayer>[0]['grade']; vig?: number; amount?: number}> = ({f, grade, vig = 0.5, amount}) => (
  <>
    <GradeLayer grade={grade} amount={amount} />
    <Vig amount={vig} />
    <Grain f={f} />
  </>
);

/** Chapter-change iris: a black mask whose hole opens over the first n frames of the chapter. */
export const IrisOpen: React.FC<{f: number; n?: number}> = ({f, n = 20}) => {
  if (f >= n) return null;
  const r = easeInOut(clamp(f / n)) * 1150;
  return <path d={`M-10,-10 H1930 V1090 H-10Z M${960 - r},520 a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0Z`} fill="#0B0B0D" fillRule="evenodd" />;
};

/** Dust motes drifting in a light beam (world space). */
export const Motes: React.FC<{f: number; x: number; y: number; w: number; h: number; n?: number; seed?: number}> = ({f, x, y, w, h, n = 26, seed = 3}) => (
  <g style={{mixBlendMode: 'screen'}}>
    {Array.from({length: n}, (_, i) => {
      const px = x + ((hash(i * 7 + seed) * w + f * (0.2 + hash(i + seed) * 0.4)) % w);
      const py = y + ((hash(i * 13 + seed) * h - f * (0.15 + hash(i * 3) * 0.3) + h * 10) % h);
      return <circle key={i} cx={px} cy={py} r={1.6 + hash(i * 5) * 2} fill="#FFF3D0" opacity={0.25 + 0.3 * Math.sin(f / 20 + i)} />;
    })}
  </g>
);

/** A seated member on a chair (solved figure + matching chair). */
export const SeatedFig: React.FC<{g: Fig; f: number; seed?: number; floor: number; lod?: 'full' | 'low'; color?: string}> = ({g, f, seed, floor, lod, color}) => (
  <g>
    <Chair x={g.pl.x} floor={floor} h={seatHeight(g.build, g.pl.scale)} dir={g.pl.dir} color={color} />
    <FigEl g={g} f={f} seed={seed} lod={lod} />
  </g>
);

// ---------------------------------------------------------------- 4.1 / 4.3b Illinois legislature (generic)
export const Legislature: React.FC<{f: number; floor: number}> = ({f, floor}) => (
  <g>
    <rect x={-800} y={-500} width={3600} height={2000} fill="#D9CDB2" />
    {Array.from({length: 7}, (_, i) => {
      const x = -380 + i * 470;
      return (
        <g key={i}>
          <rect x={x} y={floor - 640} width={170} height={360} rx={4} fill="#BFD2D8" {...o(6)} />
          <path d={`M${x + 85},${floor - 640} V${floor - 280} M${x},${floor - 520} H${x + 170} M${x},${floor - 400} H${x + 170}`} stroke="#7A6A52" strokeWidth={6} />
          <path d={`M${x - 20},${floor - 660} H${x + 190}`} stroke="#8A7A5E" strokeWidth={14} strokeLinecap="round" />
          <rect x={x + 210} y={floor - 700} width={46} height={700} fill="#E8DFCA" {...o(4)} />
          <rect x={x + 200} y={floor - 712} width={66} height={22} fill="#D2C6AA" {...o(3)} />
        </g>
      );
    })}
    <rect x={-800} y={floor - 230} width={3600} height={230} fill="#8A6A48" stroke={ink} strokeWidth={4} />
    {Array.from({length: 22}, (_, i) => <rect key={i} x={-760 + i * 170} y={floor - 206} width={130} height={180} rx={4} fill="#7A5C3E" stroke="#3E2C1C" strokeWidth={3} />)}
    {/* speaker's dais at the back */}
    <rect x={820} y={floor - 330} width={300} height={100} fill="#6E4C30" {...o(4)} />
    <rect x={800} y={floor - 342} width={340} height={18} rx={4} fill="#5A3E28" {...o(3.5)} />
    <rect x={-800} y={floor} width={3600} height={700} fill="#7A6450" />
    {Array.from({length: 24}, (_, i) => <line key={i} x1={-700 + i * 170} y1={floor} x2={-950 + i * 200} y2={floor + 300} stroke="#5E4A38" strokeWidth={3} opacity={0.6} />)}
    <line x1={-800} y1={floor} x2={2800} y2={floor} stroke={ink} strokeWidth={6} />
    <circle cx={960} cy={floor - 760} r={140 + noise1(f / 30, 2) * 5} fill="#FFF0C8" opacity={0.12} />
  </g>
);

/** Members' desks (side view, low): drawn in front of the chairs. */
export const MemberDesk: React.FC<{x: number; floor: number; w?: number; h?: number}> = ({x, floor, w = 150, h = 92}) => (
  <g>
    <rect x={x - w / 2} y={floor - h} width={w} height={h} fill="#6A4A30" {...o(4)} />
    <rect x={x - w / 2 - 8} y={floor - h - 12} width={w + 16} height={14} rx={3} fill="#5A3E28" {...o(3.5)} />
    <rect x={x - w / 2 + 14} y={floor - h + 18} width={w - 28} height={h - 36} rx={3} fill="none" stroke="#3E2A1A" strokeWidth={3} />
  </g>
);

// ---------------------------------------------------------------- 4.4 the ball
export const BallRoom: React.FC<{f: number; floor: number}> = ({f, floor}) => (
  <g>
    <rect x={-800} y={-500} width={3600} height={2000} fill="#C9A878" />
    {Array.from({length: 40}, (_, i) => <path key={i} d={`M${-760 + i * 90},-400 V${floor - 200}`} stroke="#BC9A6A" strokeWidth={14} opacity={0.5} />)}
    {Array.from({length: 6}, (_, i) => {
      const x = -300 + i * 560;
      return (
        <g key={i}>
          <rect x={x} y={floor - 700} width={200} height={420} rx={100} fill="#3A3048" {...o(5)} />
          <path d={`M${x - 26},${floor - 720} Q${x + 10},${floor - 470} ${x - 6},${floor - 240} L${x + 40},${floor - 240} Q${x + 20},${floor - 500} ${x + 30},${floor - 720}Z`} fill="#7E2620" {...o(3)} />
          <path d={`M${x + 226},${floor - 720} Q${x + 190},${floor - 470} ${x + 206},${floor - 240} L${x + 160},${floor - 240} Q${x + 180},${floor - 500} ${x + 170},${floor - 720}Z`} fill="#7E2620" {...o(3)} />
        </g>
      );
    })}
    <rect x={-800} y={floor - 200} width={3600} height={200} fill="#8A6440" stroke={ink} strokeWidth={4} />
    <rect x={-800} y={floor} width={3600} height={700} fill="#9A7650" />
    {Array.from({length: 30}, (_, i) => <line key={i} x1={-700 + i * 130} y1={floor} x2={-1000 + i * 160} y2={floor + 300} stroke="#7A5A3A" strokeWidth={3} opacity={0.6} />)}
    <line x1={-800} y1={floor} x2={2800} y2={floor} stroke={ink} strokeWidth={6} />
    {/* chandelier */}
    {[400, 1500].map((cx, k) => (
      <g key={k}>
        <line x1={cx} y1={-300} x2={cx} y2={150} stroke={ink} strokeWidth={4} />
        <path d={`M${cx - 110},170 Q${cx},230 ${cx + 110},170`} fill="none" stroke="#B08A3A" strokeWidth={8} />
        {[-110, -55, 0, 55, 110].map((dx, i) => (
          <g key={i}>
            <rect x={cx + dx - 5} y={140 + Math.abs(dx) * -0.2} width={10} height={26} fill="#F4EBD6" stroke={ink} strokeWidth={2} />
            <path d={`M${cx + dx},${138 - Math.abs(dx) * 0.2} q-5,-10 0,-${16 + noise1(f / 3 + i, k) * 3} q5,10 0,${16 + noise1(f / 3 + i, k) * 3}Z`} fill="#FFB43A" />
          </g>
        ))}
        <circle cx={cx} cy={160} r={230 + noise1(f / 6, k) * 8} fill="#FFE2A0" opacity={0.18} />
      </g>
    ))}
  </g>
);

/** Couples dancing in the background (illustrative, low detail). */
export const Dancers: React.FC<{f: number; floor: number; xs: number[]}> = ({f, floor, xs}) => (
  <g>
    {xs.map((x, i) => {
      const sway = Math.sin(f / 18 + i * 1.7) * 30;
      const ph = f / 26 + i * 0.3;
      return (
        <g key={i}>
          <Person id={i % 2 ? 'visitor' : 'townsman'} x={x + sway} y={floor} f={f + i * 7} seed={40 + i} pose={walk(ph, 0.35)} lod="low" dir={1} scale={0.9} head={{hat: 'none'}} />
          <Person id="townswoman" x={x + 76 + sway} y={floor} f={f + i * 9} seed={50 + i} pose={walk(ph + 0.5, 0.35)} lod="low" dir={-1} scale={0.86} head={{hat: 'none'}} outfit={{color: ['#6A3A5A', '#3A5A6A', '#7A6A3A'][i % 3]}} />
        </g>
      );
    })}
  </g>
);

/** Musicians (foreground, blurred by the layer): a fiddler and a cellist. */
export const Musicians: React.FC<{f: number; floor: number; x: number}> = ({f, floor, x}) => {
  const bow = Math.sin(f / 5) * 26;
  return (
    <g>
      <Person id="visitor" x={x} y={floor} f={f} seed={61} pose={{...stand(f, 61), shR: 70 + bow * 0.4, elR: 60, shL: 120, elL: 70, headTilt: 14}} dir={1} scale={1.25} head={{hat: 'none', expression: 'happy'}} />
      <g transform={`translate(${x + 40},${floor - 300}) rotate(-24)`}>
        <ellipse cx={0} cy={0} rx={34} ry={16} fill="#8A4A24" {...o(3)} />
        <line x1={20} y1={0} x2={70} y2={0} stroke={ink} strokeWidth={6} />
      </g>
      <line x1={x + 70 + bow} y1={floor - 260} x2={x - 10 + bow} y2={floor - 330} stroke="#D8CCB0" strokeWidth={4} />
      <Person id="townsman" x={x + 300} y={floor} f={f + 20} seed={62} pose={{...stand(f + 20, 62), shR: 40, elR: 30 + Math.sin(f / 6) * 20, shL: 60, elL: 60}} dir={-1} scale={1.25} head={{hat: 'none', expression: 'neutral'}} />
      <path d={`M${x + 250},${floor - 30} Q${x + 200},${floor - 120} ${x + 240},${floor - 200} Q${x + 290},${floor - 120} ${x + 250},${floor - 30}Z`} fill="#7A4020" {...o(3)} />
    </g>
  );
};

// ---------------------------------------------------------------- 4.5 a night room with a window (moonlight)
export const NightWindow: React.FC<{f: number; floor: number; x: number}> = ({f, floor, x}) => (
  <g>
    <rect x={-800} y={-500} width={3600} height={2000} fill="#4A4A5A" />
    {Array.from({length: 30}, (_, i) => <line key={i} x1={-600 + i * 110} y1={-400} x2={-600 + i * 110} y2={floor - 220} stroke="#424252" strokeWidth={3} />)}
    <rect x={-800} y={floor - 220} width={3600} height={220} fill="#3A3240" stroke={ink} strokeWidth={4} />
    <rect x={x} y={floor - 720} width={300} height={420} fill="#14203A" stroke={ink} strokeWidth={8} />
    <circle cx={x + 210} cy={floor - 620} r={34} fill="#E8EEF6" opacity={0.95} />
    {Array.from({length: 9}, (_, i) => <circle key={i} cx={x + 30 + hash(i) * 240} cy={floor - 700 + hash(i * 3) * 260} r={2} fill="#E8EEF6" opacity={0.4 + 0.5 * Math.abs(Math.sin(f / 30 + i))} />)}
    <path d={`M${x + 150},${floor - 720} V${floor - 300} M${x},${floor - 510} H${x + 300}`} stroke="#2A2232" strokeWidth={9} />
    <path d={`M${x - 50},${floor - 740} Q${x - 20},${floor - 520} ${x - 34},${floor - 290} L${x + 34},${floor - 290} Q${x + 24},${floor - 520} ${x + 46},${floor - 740}Z`} fill="#3A2A3A" {...o(3)} />
    <rect x={x - 20} y={floor - 300} width={340} height={20} fill="#5A4A50" {...o(3)} />
    <rect x={-800} y={floor} width={3600} height={700} fill="#3A3238" />
    <line x1={-800} y1={floor} x2={2800} y2={floor} stroke={ink} strokeWidth={6} />
    {/* moonlight patch on the floor */}
    <path d={`M${x},${floor - 300} L${x + 300},${floor - 300} L${x + 120},${floor + 120} L${x - 260},${floor + 120}Z`} fill="#B8C8E8" opacity={0.08} />
  </g>
);

/** A candle in a holder (on a desk at x, y). */
export const DeskCandle: React.FC<{x: number; y: number; f: number}> = ({x, y, f}) => {
  const fl = 1 + noise1(f / 2.6, 7) * 0.14;
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={0} cy={-3} rx={18} ry={5} fill="#8A7A5A" {...o(3)} />
      <rect x={-6} y={-46} width={12} height={42} fill="#F4EBD6" {...o(2.5)} />
      <path d={`M0,-48 q${-6 * fl},-12 0,${-24 * fl} q${6 * fl},12 0,${24 * fl}Z`} fill="#FFB43A" />
    </g>
  );
};

/** Scribbled lines on the writing slope, revealed with u (matches the solver's nib path). */
export const SlopeScribble: React.FC<{x0: number; y0: number; w: number; lines: number; gap: number; u: number; seed?: number}> = ({x0, y0, w, lines, gap, u, seed = 3}) => (
  <g fill="none" stroke="#3A2A1E" strokeWidth={1.8} strokeLinecap="round">
    {Array.from({length: lines}, (_, i) => {
      const t = clamp(u * lines - i);
      if (t <= 0) return null;
      const lw = w * (i === lines - 1 ? 0.45 : 0.95);
      const L = lw * 3.2;
      return <path key={i} d={scribble(x0, y0 + i * gap, lw, seed * 40 + i, 9)} strokeDasharray={`${L} ${L}`} strokeDashoffset={L * (1 - t)} />;
    })}
  </g>
);

// ---------------------------------------------------------------- 4.6 parlour (wedding)
export const Parlour: React.FC<{f: number; floor: number}> = ({f, floor}) => (
  <g>
    <rect x={-800} y={-500} width={3600} height={2000} fill="#B8A890" />
    {Array.from({length: 46}, (_, i) => <circle key={i} cx={-760 + (i % 23) * 160 + (Math.floor(i / 23) % 2) * 80} cy={-200 + Math.floor(i / 23) * 260 + 200} r={10} fill="#A89878" />)}
    {Array.from({length: 40}, (_, i) => <circle key={'b' + i} cx={-680 + (i % 20) * 180} cy={360 + Math.floor(i / 20) * 180} r={9} fill="#A89878" />)}
    <rect x={-800} y={floor - 200} width={3600} height={200} fill="#6A5038" stroke={ink} strokeWidth={4} />
    {/* mantelpiece with candles and flowers */}
    <rect x={820} y={floor - 330} width={240} height={330} fill="#E6DCC4" {...o(4)} />
    <rect x={870} y={floor - 230} width={140} height={230} fill="#2A2018" {...o(4)} />
    <rect x={800} y={floor - 346} width={280} height={20} fill="#D8CCB0" {...o(3.5)} />
    {[850, 1030].map((x, i) => <DeskCandle key={i} x={x} y={floor - 346} f={f + i * 13} />)}
    <g transform={`translate(940,${floor - 346})`}>
      <path d="M-18,0 L-14,-36 L14,-36 L18,0Z" fill="#7A8AA6" {...o(3)} />
      {[-22, -8, 6, 20].map((dx, i) => <circle key={i} cx={dx} cy={-48 - (i % 2) * 12} r={11} fill={i % 2 ? '#E6D8B8' : '#D88A8A'} {...o(2.5)} />)}
    </g>
    <rect x={260} y={floor - 640} width={220} height={320} fill="#DCE6E6" {...o(6)} />
    <path d={`M370,${floor - 640} V${floor - 320} M260,${floor - 480} H480`} stroke="#6A5038" strokeWidth={7} />
    <rect x={1420} y={floor - 640} width={220} height={320} fill="#DCE6E6" {...o(6)} />
    <path d={`M1530,${floor - 640} V${floor - 320} M1420,${floor - 480} H1640`} stroke="#6A5038" strokeWidth={7} />
    <rect x={-800} y={floor} width={3600} height={700} fill="#7A5A44" />
    <rect x={560} y={floor + 6} width={800} height={60} rx={8} fill="#8A3A3A" opacity={0.85} />
    <line x1={-800} y1={floor} x2={2800} y2={floor} stroke={ink} strokeWidth={6} />
  </g>
);

// ---------------------------------------------------------------- 4.7 courthouse (generic county courthouse)
export const Courthouse: React.FC<{x: number; base: number; f: number}> = ({x, base, f}) => (
  <g>
    <rect x={x - 300} y={base - 360} width={600} height={360} fill="#C9B79A" {...o(5)} />
    {Array.from({length: 10}, (_, i) => <line key={i} x1={x - 300} y1={base - 30 - i * 32} x2={x + 300} y2={base - 30 - i * 32} stroke="#A8957A" strokeWidth={3} />)}
    <path d={`M${x - 330},${base - 360} L${x},${base - 470} L${x + 330},${base - 360}Z`} fill="#D8CCB0" {...o(5)} />
    <rect x={x - 50} y={base - 560} width={100} height={110} fill="#E6DCC4" {...o(4)} />
    <path d={`M${x - 64},${base - 560} L${x},${base - 630} L${x + 64},${base - 560}Z`} fill="#6A7A8A" {...o(4)} />
    <circle cx={x} cy={base - 510} r={28} fill="#F4EBD6" {...o(3)} />
    <path d={`M${x},${base - 510} L${x},${base - 528} M${x},${base - 510} L${x + 12},${base - 504}`} stroke={ink} strokeWidth={3} />
    {[-220, -120, 120, 220].map((dx, i) => (
      <g key={i}>
        <rect x={x + dx - 30} y={base - 300} width={60} height={110} fill="#F2C060" opacity={0.35 + 0.15 * Math.sin(f / 40 + i)} {...o(4)} />
        <rect x={x + dx - 30} y={base - 160} width={60} height={110} fill="#F2C060" opacity={0.35} {...o(4)} />
      </g>
    ))}
    {[-70, -24, 24, 70].map((dx, i) => <rect key={i} x={x + dx - 10} y={base - 350} width={20} height={300} fill="#EEE6D2" {...o(3)} />)}
    <rect x={x - 46} y={base - 160} width={92} height={110} fill="#3A2818" {...o(4)} />
    {[0, 1, 2].map((k) => <rect key={k} x={x - 120 - k * 20} y={base - 50 + k * 17} width={240 + k * 40} height={17} fill="#B8AE9A" {...o(3)} />)}
  </g>
);

/** Prairie road with puddles (rain) for the circuit. */
export const PrairieRoad: React.FC<{y: number; f: number}> = ({y, f}) => (
  <g>
    <rect x={-1200} y={y} width={6000} height={700} fill="#6E6A48" />
    <rect x={-1200} y={y + 30} width={6000} height={90} fill="#7A6A50" />
    <line x1={-1200} y1={y} x2={4800} y2={y} stroke={ink} strokeWidth={5} />
    {Array.from({length: 40}, (_, i) => (
      <ellipse key={i} cx={-1100 + i * 150 + hash(i) * 60} cy={y + 60 + hash(i * 3) * 50} rx={30 + hash(i * 5) * 30} ry={6} fill="#9AA8B0" opacity={0.6} />
    ))}
    {Array.from({length: 40}, (_, i) => {
      const cx = -1100 + i * 150 + hash(i) * 60;
      const cy = y + 60 + hash(i * 3) * 50;
      const r = ((f + i * 7) % 24) * 1.6;
      return <ellipse key={'r' + i} cx={cx} cy={cy} rx={r} ry={r * 0.22} fill="none" stroke="#D8E2E8" strokeWidth={1.5} opacity={1 - ((f + i * 7) % 24) / 24} />;
    })}
  </g>
);

// ---------------------------------------------------------------- 4.7 House of Representatives chamber (generic)
export const HouseHall: React.FC<{f: number; floor: number}> = ({f, floor}) => (
  <g>
    <rect x={-800} y={-500} width={3600} height={2000} fill="#CDBF9E" />
    {Array.from({length: 9}, (_, i) => {
      const x = -560 + i * 400;
      return (
        <g key={i}>
          <rect x={x} y={-300} width={64} height={floor - 120 + 300} fill="#E4D8BC" {...o(4)} />
          <rect x={x - 14} y={floor - 160} width={92} height={40} fill="#D2C4A4" {...o(3)} />
          <path d={`M${x + 64},-200 Q${x + 200},${-60 + Math.sin(f / 50 + i) * 3} ${x + 336},-200`} fill="none" stroke="#7E2620" strokeWidth={34} opacity={0.85} />
        </g>
      );
    })}
    {/* gallery rail and tiers of desks */}
    <rect x={-800} y={floor - 420} width={3600} height={40} fill="#8A6A48" {...o(4)} />
    {Array.from({length: 26}, (_, i) => <rect key={i} x={-760 + i * 140} y={floor - 380} width={12} height={60} fill="#6A4A30" />)}
    {Array.from({length: 2}, (_, r) => (
      <g key={r}>
        {Array.from({length: 16}, (_, i) => <rect key={i} x={-700 + i * 230 + r * 110} y={floor - 300 + r * 90} width={170} height={60} rx={4} fill={r ? '#6A4A30' : '#5A3E28'} {...o(3)} />)}
      </g>
    ))}
    <rect x={-800} y={floor - 120} width={3600} height={120} fill="#7A5A3A" stroke={ink} strokeWidth={4} />
    <rect x={-800} y={floor} width={3600} height={700} fill="#6A4A3A" />
    {Array.from({length: 24}, (_, i) => <line key={i} x1={-700 + i * 170} y1={floor} x2={-950 + i * 200} y2={floor + 300} stroke="#4E3628" strokeWidth={3} opacity={0.6} />)}
    <line x1={-800} y1={floor} x2={2800} y2={floor} stroke={ink} strokeWidth={6} />
  </g>
);

// ---------------------------------------------------------------- 5.2 meeting room (1854)
export const MeetingRoom: React.FC<{f: number; floor: number}> = ({f, floor}) => (
  <g>
    <rect x={-800} y={-500} width={3600} height={2000} fill="#A8987A" />
    {Array.from({length: 36}, (_, i) => <line key={i} x1={-760 + i * 100} y1={-400} x2={-760 + i * 100} y2={floor - 240} stroke="#9A8A6C" strokeWidth={4} />)}
    <rect x={-800} y={floor - 240} width={3600} height={240} fill="#6A5038" stroke={ink} strokeWidth={4} />
    {/* bunting (no lettering) */}
    {Array.from({length: 14}, (_, i) => {
      const x = -600 + i * 260;
      const sag = 40 + Math.sin(f / 40 + i) * 3;
      return (
        <g key={i}>
          <path d={`M${x},120 Q${x + 130},${120 + sag * 2} ${x + 260},120 L${x + 260},150 Q${x + 130},${150 + sag * 2} ${x},150Z`} fill={['#B23A2E', '#F4EBD6', '#3F5E8A'][i % 3]} {...o(3)} />
        </g>
      );
    })}
    {[300, 1620].map((x, i) => (
      <g key={i}>
        <path d={`M${x},${floor - 560} v-40`} stroke={ink} strokeWidth={4} />
        <path d={`M${x - 16},${floor - 560} L${x + 16},${floor - 560} L${x + 10},${floor - 500} L${x - 10},${floor - 500}Z`} fill="#F4E8C0" opacity={0.8} {...o(3)} />
        <circle cx={x} cy={floor - 530} r={90 + noise1(f / 5, i) * 4} fill="#FFD890" opacity={0.18} />
      </g>
    ))}
    <rect x={-800} y={floor} width={3600} height={700} fill="#6A5442" />
    <line x1={-800} y1={floor} x2={2800} y2={floor} stroke={ink} strokeWidth={6} />
  </g>
);

// ---------------------------------------------------------------- 5.4b debate platform outdoors
export const DebateField: React.FC<{f: number; plat: number}> = ({f, plat}) => (
  <g>
    <rect x={-800} y={-500} width={3600} height={2000} fill="#AFC8D0" />
    {Array.from({length: 5}, (_, i) => <ellipse key={i} cx={((-200 + i * 520 + f * 0.4) % 2600) - 300} cy={110 + (i % 2) * 70} rx={150} ry={36} fill="#F4F4EE" opacity={0.85} />)}
    {Array.from({length: 10}, (_, i) => {
      const x = -500 + i * 330;
      const sw = Math.sin(f / 30 + i) * 4;
      return (
        <g key={i}>
          <rect x={x - 14} y={plat - 260} width={28} height={300} fill="#5A4030" {...o(3)} />
          <ellipse cx={x + sw} cy={plat - 300} rx={120} ry={100} fill="#5E7A40" {...o(4)} />
        </g>
      );
    })}
    <rect x={-800} y={plat + 20} width={3600} height={900} fill="#7E8A4A" />
    {/* the platform */}
    <rect x={300} y={plat} width={1320} height={160} fill="#9A7650" {...o(5)} />
    {Array.from({length: 12}, (_, i) => <line key={i} x1={300 + i * 110} y1={plat} x2={300 + i * 110} y2={plat + 160} stroke="#7A5A3A" strokeWidth={3} />)}
    <rect x={290} y={plat - 8} width={1340} height={16} fill="#7A5A3A" {...o(3.5)} />
    {/* bunting along the front (no lettering) */}
    {Array.from({length: 6}, (_, i) => {
      const x = 300 + i * 220;
      return <path key={i} d={`M${x},${plat + 10} Q${x + 110},${plat + 90 + Math.sin(f / 25 + i) * 3} ${x + 220},${plat + 10}`} fill="none" stroke={['#B23A2E', '#F4EBD6', '#3F5E8A'][i % 3]} strokeWidth={26} />;
    })}
    {/* flags on poles */}
    {[330, 1590].map((x, i) => (
      <g key={i}>
        <line x1={x} y1={plat} x2={x} y2={plat - 380} stroke={ink} strokeWidth={6} />
        {Array.from({length: 7}, (_, k) => (
          <path key={k} d={`M${x},${plat - 380 + k * 12} q40,${Math.sin(f / 8 + k * 0.6 + i) * 6} 90,0 v12 q-50,${Math.sin(f / 8 + k * 0.6 + i) * 6} -90,0Z`} fill={k % 2 ? '#F4EBD6' : '#B23A2E'} />
        ))}
        <rect x={x} y={plat - 380} width={40} height={44} fill="#3F5E8A" />
      </g>
    ))}
  </g>
);

/** Rows of spectators' heads and shoulders seen from behind (foreground). */
export const CrowdBacks: React.FC<{f: number; y: number; n?: number; x0?: number; dx?: number; s?: number; seed?: number}> = ({f, y, n = 14, x0 = -100, dx = 150, s = 1, seed = 1}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const x = x0 + i * dx + hash(i + seed) * 40;
      const bob = Math.sin(f / 30 + i * 1.3) * 3;
      const hat = hash(i * 3 + seed) > 0.4;
      return (
        <g key={i} transform={`translate(${x},${y + bob + hash(i * 7) * 20}) scale(${s * (0.9 + hash(i * 5) * 0.2)})`}>
          <path d="M-70,140 Q-66,40 0,30 Q66,40 70,140Z" fill={['#3A3430', '#4A4238', '#2E3240', '#5A4A3A'][i % 4]} {...o(4)} />
          <circle cx={0} cy={-14} r={44} fill="#FFFFFF" {...o(5)} />
          <path d="M-42,-26 Q0,-70 42,-26 Q30,-50 0,-56 Q-30,-50 -42,-26Z" fill="#2A2420" />
          {hat && <g><rect x={-30} y={-110} width={60} height={64} fill="#2A2622" {...o(3.5)} /><ellipse cx={0} cy={-46} rx={50} ry={8} fill="#2A2622" {...o(3.5)} /></g>}
        </g>
      );
    })}
  </g>
);

/** Reporters' table with notebooks; pencils move (forward kinematics on drawn hands, no IK contact needed). */
export const Reporters: React.FC<{f: number; x: number; floor: number}> = ({f, x, floor}) => (
  <g>
    <rect x={x - 160} y={floor - 90} width={320} height={16} rx={3} fill="#6A4A30" {...o(3.5)} />
    <rect x={x - 150} y={floor - 76} width={12} height={76} fill="#6A4A30" {...o(3)} />
    <rect x={x + 138} y={floor - 76} width={12} height={76} fill="#6A4A30" {...o(3)} />
    {[-90, 70].map((dx, i) => {
      const px = x + dx + 30 + Math.sin(f / 2.2 + i) * 10 + ((f * 0.8 + i * 20) % 40);
      const py = floor - 98 - Math.abs(Math.sin(f / 1.6 + i)) * 6;
      return (
        <g key={i}>
          <Person id={i ? 'townsman' : 'visitor'} x={x + dx - 40} y={floor} f={f + i * 30} seed={70 + i} pose={{...stand(f, 70 + i), lean: 18, shR: 70, elR: 50, shL: 50, elL: 70, headTilt: 18}} dir={1} scale={0.95} head={{hat: 'none', expression: 'neutral'}} />
          <rect x={x + dx + 10} y={floor - 98} width={80} height={8} fill="#F4EBD6" {...o(2)} />
          <line x1={px} y1={py} x2={px - 14} y2={py - 26} stroke="#C9A24A" strokeWidth={5} strokeLinecap="round" />
        </g>
      );
    })}
  </g>
);

// ---------------------------------------------------------------- newspapers
/** A folded newspaper sheet as a held prop (grips at the side edges, ±40 local). Illegible columns only. */
export const NEWSPAPER: PropDef = {
  grips: {handle: {x: 40, y: -4}, grip2: {x: -40, y: -4}},
  draw: () => (
    <g>
      <rect x={-44} y={-62} width={88} height={118} fill="#E8DFC8" {...o(3)} />
      <rect x={-36} y={-54} width={72} height={10} fill="#3A3430" />
      <line x1={-36} y1={-38} x2={36} y2={-38} stroke="#3A3430" strokeWidth={2} />
      {[-34, -10, 14].map((cx, k) => Array.from({length: 11}, (_, i) => <line key={`${k}-${i}`} x1={cx} y1={-30 + i * 7.6} x2={cx + 20} y2={-30 + i * 7.6} stroke="#8A8070" strokeWidth={2} />))}
    </g>
  ),
};

/** A broadsheet page laid flat for the inserts: masthead bars, columns of small illegible type. */
export const Broadsheet: React.FC<{x: number; y: number; w: number; h: number; seed?: number; skip?: [number, number, number, number]}> = ({x, y, w, h, seed = 4, skip}) => {
  const cols = 5;
  const cw = (w - 60) / cols;
  return (
    <g>
      <rect x={x + 10} y={y + 14} width={w} height={h} fill="rgba(0,0,0,0.3)" />
      <rect x={x} y={y} width={w} height={h} fill="#E9E0C8" stroke={ink} strokeWidth={4} />
      <rect x={x + 30} y={y + 26} width={w - 60} height={54} fill="#3A3430" opacity={0.85} />
      <line x1={x + 30} y1={y + 96} x2={x + w - 30} y2={y + 96} stroke="#3A3430" strokeWidth={3} />
      <line x1={x + 30} y1={y + 104} x2={x + w - 30} y2={y + 104} stroke="#3A3430" strokeWidth={1.5} />
      {Array.from({length: cols}, (_, c) => (
        <g key={c}>
          {c > 0 && <line x1={x + 30 + c * cw} y1={y + 120} x2={x + 30 + c * cw} y2={y + h - 30} stroke="#8A8070" strokeWidth={1.5} />}
          {Array.from({length: Math.floor((h - 160) / 13)}, (_, i) => {
            const ly = y + 132 + i * 13;
            const lx = x + 38 + c * cw;
            if (skip && lx + cw > skip[0] && lx < skip[0] + skip[2] && ly > skip[1] && ly < skip[1] + skip[3]) return null;
            return <line key={i} x1={lx} y1={ly} x2={lx + (cw - 16) * (i % 9 === 8 ? 0.5 : 0.92 + hash(seed + i + c * 50) * 0.08)} y2={ly} stroke="#9A9080" strokeWidth={3} />;
          })}
        </g>
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- "4 sons" icon row
export const SonsRow: React.FC<{x: number; y: number; t: number; f: number}> = ({x, y, t, f}) => {
  if (t <= 0) return null;
  return (
    <g transform={`translate(${x},${y})`} opacity={clamp(t * 2)}>
      <rect x={6} y={8} width={480} height={128} rx={10} fill="rgba(0,0,0,0.3)" />
      <rect width={480} height={128} rx={10} fill="#F1E6CB" stroke={ink} strokeWidth={4} />
      {[0, 1, 2, 3].map((i) => {
        const u = clamp(t * 4 - i);
        const bob = Math.sin(f / 14 + i) * 2;
        return (
          <g key={i} transform={`translate(${48 + i * 60},${64 + bob}) scale(${0.4 + 0.6 * u})`} opacity={u}>
            <path d="M-20,46 Q-18,14 0,10 Q18,14 20,46Z" fill="#3A4458" {...o(3)} />
            <circle cx={0} cy={-10} r={22} fill="#FFFFFF" {...o(4)} />
            <path d="M-21,-16 Q0,-42 21,-16 Q10,-28 0,-30 Q-10,-28 -21,-16Z" fill="#2E2420" />
            <circle cx={-7} cy={-9} r={2.6} fill={ink} />
            <circle cx={7} cy={-9} r={2.6} fill={ink} />
          </g>
        );
      })}
      <text x={456} y={82} textAnchor="end" fontFamily={FONT.sans} fontWeight={900} fontSize={38} fill={ink}>
        4 sons
      </text>
    </g>
  );
};

export {castBuild, castScale, Hand, prog};
