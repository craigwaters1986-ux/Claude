// Chapter 8 (and shared ch 8/10) sets and helpers: figure element from solver output, the look stack,
// the chapter iris, a document insert page, the House chamber with its tally board, the Appomattox
// parlour and the empty fields at dusk. Generic period places, flat vector, parallax-ready planes.
import React from 'react';
import {Person, CAST} from '../kit/Cast';
import {GradeLayer, Grain, Vig} from '../kit/Cinema';
import {DocText, Layout, Doc} from '../kit/Documents';
import {C, FONT} from '../styles/theme';
import {clamp, easeInOut, easeOut, hash, noise1, prog} from '../animations/core';
import type {Fig} from './reelSolve';

const ink = C.ink;
const o = (w = 4) => ({stroke: ink, strokeWidth: w, strokeLinejoin: 'round' as const});

// ---------------------------------------------------------------- helpers
const castS = (id: string) => CAST[id].scale ?? 1;
/** A solver figure (placement already includes the cast scale). */
export const FigEl: React.FC<{g: Fig; f: number; seed?: number; lod?: 'full' | 'low'; opacity?: number; labelSide?: 'top' | 'right' | 'left'}> = ({g, f, seed = 1, lod, opacity, labelSide}) => (
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
    tag={g.tag}
    fromBehind={g.fromBehind}
    eyesClosed={g.eyesClosed}
    lod={lod}
    opacity={opacity}
    labelSide={labelSide}
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

/** Chapter-opening iris: a black frame with a growing circular hole over the first `n` frames. */
export const IrisOpen: React.FC<{f: number; n?: number}> = ({f, n = 18}) => {
  if (f >= n) return null;
  const r = easeInOut(clamp(f / n)) * 1150;
  return <path d={`M-10,-10 H1930 V1090 H-10Z M${960 - r},520 a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0Z`} fill="#0B0B0D" fillRule="evenodd" />;
};

/** Small dark label plate (top right, clear of the logo zone). */
export const Plate: React.FC<{text: string; t: number; x?: number; y?: number; size?: number; anchor?: 'end' | 'middle' | 'start'; italic?: boolean}> = ({text, t, x = 1860, y = 70, size = 26, anchor = 'end', italic}) => {
  if (t <= 0) return null;
  const w = text.length * size * 0.56 + 44;
  const x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
  return (
    <g opacity={clamp(t)}>
      <rect x={x0} y={y - size - 12} width={w} height={size + 30} rx={8} fill="rgba(14,13,12,0.76)" />
      <text x={x0 + w / 2} y={y + 4} textAnchor="middle" fontFamily={FONT.sans} fontWeight={700} fontStyle={italic ? 'italic' : undefined} fontSize={size} fill="#F4EBD6">
        {text}
      </text>
    </g>
  );
};

/** A document sheet seen close (insert). Draws the paper, the text (`reveal`) and the source title plate. */
export const PageInsert: React.FC<{d: Doc; L: Layout; x: number; y: number; w: number; h: number; reveal?: number; f: number; id: string; tone?: string; label?: boolean; children?: React.ReactNode}> = ({d, L, x, y, w, h, reveal = 1, f, id, tone = '#EFE2C2', label = true, children}) => (
  <g>
    <rect x={x + 14} y={y + 18} width={w} height={h} fill="rgba(0,0,0,0.32)" />
    <rect x={x} y={y} width={w} height={h} fill={tone} stroke={ink} strokeWidth={5} />
    {Array.from({length: 7}, (_, i) => <circle key={i} cx={x + w * hash(i * 7 + 3)} cy={y + h * hash(i * 11 + 5)} r={30 + 50 * hash(i)} fill="#D9C69C" opacity={0.18} />)}
    <DocText L={L} reveal={reveal} id={id} />
    {children}
    {label && (
      <g opacity={prog(f, 6, 22, easeOut)}>
        <rect x={x + w - d.title.length * 12.4 - 46} y={y - 50} width={d.title.length * 12.4 + 40} height={38} rx={6} fill="rgba(20,18,16,0.84)" />
        <text x={x + w - 26} y={y - 24} textAnchor="end" fontFamily={FONT.sans} fontWeight={700} fontSize={21} fill="#F4EBD6">
          {d.title}
        </text>
      </g>
    )}
  </g>
);

/** Desk surface under an insert (warm wood, slow grain). */
export const DeskTop: React.FC<{tone?: 'warm' | 'night' | 'stone'}> = ({tone = 'warm'}) => {
  const base = tone === 'night' ? '#3A2A1E' : tone === 'stone' ? '#6A665E' : '#5B4030';
  const line = tone === 'night' ? '#2E2016' : tone === 'stone' ? '#5E5A52' : '#4C3426';
  return (
    <g>
      <rect x={-400} y={-300} width={2720} height={1680} fill={base} />
      {Array.from({length: 13}, (_, i) => <path key={i} d={`M-400,${-140 + i * 120} C400,${-160 + i * 120 + (i % 2) * 30} 1300,${-110 + i * 120} 2320,${-136 + i * 120}`} stroke={line} strokeWidth={5} fill="none" />)}
    </g>
  );
};

// ---------------------------------------------------------------- 8.3 House chamber and tally board
const MEMBER_IDS = ['townsman', 'visitor', 'farmer', 'townsman', 'visitor'];
/** One curved row of desks with seated members seen from behind (legs hidden by the desk fronts). */
const DeskRow: React.FC<{y: number; s: number; f: number; n: number; x0: number; x1: number; seed: number; sag: number; lookUp: number}> = ({y, s, f, n, x0, x1, seed, sag, lookUp}) => {
  const items = Array.from({length: n}, (_, i) => {
    const u = i / (n - 1);
    const x = x0 + (x1 - x0) * u;
    const yy = y - Math.sin(Math.PI * u) * sag;
    return {x, y: yy, i};
  });
  return (
    <g>
      {items.map(({x, y: yy, i}) => {
        const id = MEMBER_IDS[(i + seed) % MEMBER_IDS.length];
        const empty = hash(i * 13 + seed) < 0.12;
        if (empty) return null;
        return (
          <Person
            key={i}
            id={id}
            x={x + noise1(i, seed) * 10}
            y={yy + 62 * s}
            scale={s * 0.95}
            dir={x < 960 ? 1 : -1}
            f={f}
            seed={seed * 10 + i}
            fromBehind
            lod="low"
            head={{hat: 'none'}}
            pose={{lean: 2, hipL: 86, kneeL: 84, hipR: 90, kneeR: 88, shL: 34, elL: 50, shR: 38, elR: 52, bob: 54 + Math.sin(f / 26 + i) * 0.8, headTilt: -lookUp * 6 + noise1(f / 50 + i, seed) * 4}}
          />
        );
      })}
      <path
        d={`M${x0 - 120},${y + 6 * s} Q960,${y - sag * 2 + 6 * s} ${x1 + 120},${y + 6 * s} L${x1 + 120},${y + 120 * s} Q960,${y - sag * 2 + 120 * s} ${x0 - 120},${y + 120 * s}Z`}
        fill="#6A4630"
        {...o(4)}
      />
      <path d={`M${x0 - 120},${y + 6 * s} Q960,${y - sag * 2 + 6 * s} ${x1 + 120},${y + 6 * s}`} stroke="#8A6040" strokeWidth={10 * s} fill="none" />
      {Array.from({length: n + 1}, (_, i) => {
        const u = i / n;
        const x = x0 - 60 + (x1 - x0 + 120) * u;
        const yy = y - Math.sin(Math.PI * u) * sag * 1.0;
        return <line key={i} x1={x} y1={yy + 22 * s} x2={x} y2={yy + 110 * s} stroke="#4A3020" strokeWidth={3} />;
      })}
    </g>
  );
};

export const HouseChamber: React.FC<{f: number; lookUp?: number}> = ({f, lookUp = 0}) => (
  <g>
    <rect x={-700} y={-400} width={3320} height={1900} fill="#CBB892" />
    {/* gallery */}
    <rect x={-700} y={170} width={3320} height={150} fill="#B5A07A" {...o(4)} />
    {Array.from({length: 26}, (_, i) => (
      <Person key={i} id={i % 3 === 0 ? 'townswoman' : i % 3 === 1 ? 'townsman' : 'visitor'} x={-560 + i * 120 + (i % 2) * 30} y={330} scale={0.5} f={f} seed={100 + i} lod="low" dir={i % 2 ? 1 : -1} look={[0, 0.6]} />
    ))}
    <rect x={-700} y={300} width={3320} height={44} fill="#8A6A44" {...o(4)} />
    {Array.from({length: 60}, (_, i) => <line key={i} x1={-680 + i * 56} y1={302} x2={-680 + i * 56} y2={342} stroke="#5A4028" strokeWidth={4} />)}
    {/* pilasters */}
    {Array.from({length: 9}, (_, i) => <rect key={i} x={-560 + i * 420} y={344} width={64} height={600} fill="#D9C8A4" {...o(3.5)} />)}
    {/* rostrum */}
    <rect x={700} y={560} width={520} height={260} fill="#E2D8C4" {...o(4)} />
    <rect x={760} y={500} width={400} height={70} fill="#EAE2D0" {...o(4)} />
    <rect x={680} y={540} width={560} height={28} fill="#CFC2A6" {...o(3)} />
    {Array.from({length: 5}, (_, i) => <rect key={i} x={730 + i * 96} y={600} width={70} height={180} rx={6} fill="none" stroke="#B8AC92" strokeWidth={3} />)}
    <rect x={-700} y={820} width={3320} height={700} fill="#7A4A34" />
    <line x1={-700} y1={820} x2={2620} y2={820} stroke={ink} strokeWidth={5} />
  </g>
);
export const ChamberRows: React.FC<{f: number; lookUp?: number}> = ({f, lookUp = 0}) => (
  <g>
    <DeskRow y={720} s={0.66} f={f} n={13} x0={180} x1={1740} seed={1} sag={18} lookUp={lookUp} />
    <DeskRow y={812} s={0.8} f={f} n={11} x0={60} x1={1860} seed={2} sag={24} lookUp={lookUp} />
    <DeskRow y={930} s={0.98} f={f} n={9} x0={-80} x1={2000} seed={3} sag={30} lookUp={lookUp} />
  </g>
);

/** The tally board: three split tiles that flip from blank to "119", "to", "56" from `at` (local frames). */
export const TallyBoard: React.FC<{x: number; y: number; f: number; at: number}> = ({x, y, f, at}) => {
  const tiles = [
    {t: '119', w: 150, size: 84, font: FONT.serif},
    {t: 'to', w: 84, size: 46, font: FONT.serif},
    {t: '56', w: 120, size: 84, font: FONT.serif},
  ];
  const gap = 14;
  const total = tiles.reduce((a, b) => a + b.w, 0) + gap * (tiles.length - 1);
  let cx = x - total / 2;
  return (
    <g>
      <rect x={x - total / 2 - 30} y={y - 74} width={total + 60} height={148} rx={8} fill="#4A3222" {...o(5)} />
      <rect x={x - total / 2 - 18} y={y - 62} width={total + 36} height={124} rx={4} fill="#2A1E16" />
      {tiles.map((tl, i) => {
        const a = at + i * 9;
        const u = prog(f, a, a + 14);
        const sc = Math.abs(Math.cos(u * Math.PI));
        const shown = u >= 0.5;
        const x0 = cx;
        cx += tl.w + gap;
        return (
          <g key={i}>
            <rect x={x0} y={y - 52} width={tl.w} height={104} rx={4} fill="#1A1410" />
            <g transform={`translate(${x0 + tl.w / 2},${y}) scale(1,${Math.max(0.02, sc)})`}>
              <rect x={-tl.w / 2} y={-52} width={tl.w} height={104} rx={4} fill={shown ? '#F2E8CE' : '#3A2C20'} stroke={ink} strokeWidth={3} />
              {shown && (
                <text y={tl.size * 0.34} textAnchor="middle" fontFamily={tl.font} fontWeight={900} fontSize={tl.size} fill="#1E1A16">
                  {tl.t}
                </text>
              )}
            </g>
            <line x1={x0} y1={y} x2={x0 + tl.w} y2={y} stroke="#0E0A08" strokeWidth={2} opacity={0.6} />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------- 8.6 Appomattox parlour (generic period parlour)
export const Parlour: React.FC<{f: number; floor?: number}> = ({f, floor = 880}) => (
  <g>
    <rect x={-700} y={-400} width={3320} height={1900} fill="#B9A67E" />
    {Array.from({length: 44}, (_, i) => <line key={i} x1={-680 + i * 76} y1={-400} x2={-680 + i * 76} y2={floor - 190} stroke="#A8956C" strokeWidth={10} />)}
    {Array.from({length: 44}, (_, i) => <circle key={i} cx={-642 + i * 76} cy={160 + (i % 2) * 120} r={7} fill="#9A865E" />)}
    <rect x={-700} y={floor - 190} width={3320} height={190} fill="#6E4E34" {...o(4)} />
    <rect x={-700} y={floor - 200} width={3320} height={16} fill="#8A6444" {...o(3)} />
    {/* window, daylight */}
    <rect x={180} y={floor - 640} width={290} height={400} fill="#D8E4E2" {...o(7)} />
    <path d={`M325,${floor - 640} V${floor - 240} M180,${floor - 440} H470`} stroke="#4A3626" strokeWidth={8} />
    <path d={`M150,${floor - 670} Q172,${floor - 460} 160,${floor - 230} L215,${floor - 230} Q205,${floor - 470} 220,${floor - 670}Z`} fill="#6A3A30" {...o(3)} />
    <path d={`M500,${floor - 670} Q478,${floor - 460} 490,${floor - 230} L435,${floor - 230} Q445,${floor - 470} 430,${floor - 670}Z`} fill="#6A3A30" {...o(3)} />
    <rect x={130} y={floor - 690} width={390} height={26} rx={6} fill="#5A4030" {...o(3)} />
    {/* fireplace and mantel clock */}
    <rect x={1400} y={floor - 330} width={330} height={330} fill="#7A6A5A" {...o(4)} />
    <rect x={1460} y={floor - 230} width={210} height={230} fill="#2A2018" {...o(3)} />
    <rect x={1380} y={floor - 350} width={370} height={26} fill="#5A4636" {...o(4)} />
    <rect x={1534} y={floor - 420} width={62} height={70} rx={10} fill="#8A6A3A" {...o(3)} />
    <circle cx={1565} cy={floor - 392} r={20} fill="#F2E8CE" {...o(2.5)} />
    <path d={`M1565,${floor - 392} l${Math.cos(f / 300) * 12},${Math.sin(f / 300) * 12} M1565,${floor - 392} l0,-14`} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
    {/* picture frame */}
    <rect x={760} y={floor - 600} width={220} height={160} fill="#9A8A6A" {...o(5)} />
    <rect x={782} y={floor - 578} width={176} height={116} fill="#7E8A7A" />
    <path d={`M790,${floor - 470} Q840,${floor - 530} 880,${floor - 500} T950,${floor - 520} V${floor - 466} H790Z`} fill="#6A7A5A" />
    {/* two small tables */}
    {[560, 1290].map((x, i) => (
      <g key={i}>
        <path d={`M${x - 8},${floor - 112} L${x - 26},${floor} M${x + 8},${floor - 112} L${x + 26},${floor}`} stroke={ink} strokeWidth={9} strokeLinecap="round" />
        <path d={`M${x - 8},${floor - 112} L${x - 26},${floor} M${x + 8},${floor - 112} L${x + 26},${floor}`} stroke="#6A4A30" strokeWidth={5} strokeLinecap="round" />
        <ellipse cx={x} cy={floor - 118} rx={92} ry={16} fill="#E8E2D6" {...o(4)} />
        <rect x={x - 30} y={floor - 140} width={52} height={14} fill="#EFE2C2" {...o(2)} transform={`rotate(${i ? 6 : -8},${x},${floor - 134})`} />
      </g>
    ))}
    <rect x={-700} y={floor} width={3320} height={700} fill="#7E3A2C" />
    {Array.from({length: 30}, (_, i) => <path key={i} d={`M${-640 + i * 120},${floor + 40 + (i % 3) * 60} l20,-14 l20,14 l-20,14Z`} fill="#9A5A3A" opacity={0.6} />)}
    <line x1={-700} y1={floor} x2={2620} y2={floor} stroke={ink} strokeWidth={6} />
  </g>
);

// ---------------------------------------------------------------- 8.7 empty fields at dusk
/** Wind-swept grass field: blades bend with a travelling gust. */
export const GrassField: React.FC<{y: number; f: number; n?: number; s?: number; color?: string; seed?: number; x0?: number; x1?: number}> = ({y, f, n = 120, s = 1, color = '#4E5A34', seed = 1, x0 = -500, x1 = 2400}) => (
  <g stroke={color} strokeWidth={4 * s} fill="none" strokeLinecap="round">
    {Array.from({length: n}, (_, i) => {
      const x = x0 + ((x1 - x0) * (i + hash(i * 3 + seed))) / n;
      const yy = y + hash(i * 5 + seed) * 40 * s;
      const gust = Math.sin(f / 22 - x / 260) * 0.5 + 0.5;
      const bend = (10 + 26 * gust + noise1(f / 18 + i, seed) * 5) * s;
      const h = (40 + 46 * hash(i * 7 + seed)) * s;
      return <path key={i} d={`M${x},${yy} Q${x + bend * 0.3},${yy - h * 0.6} ${x + bend},${yy - h}`} />;
    })}
  </g>
);

/** A broken split-rail fence (zig-zag), nothing else: no figures, no objects. */
export const RailFence: React.FC<{x: number; y: number; n?: number; s?: number}> = ({x, y, n = 7, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {Array.from({length: n}, (_, i) => (
      <g key={i}>
        <path d={`M${i * 150},0 L${i * 150 + 150},-40`} stroke={ink} strokeWidth={13} strokeLinecap="round" />
        <path d={`M${i * 150},0 L${i * 150 + 150},-40`} stroke="#6A5440" strokeWidth={8} strokeLinecap="round" />
        {i % 3 !== 2 && (
          <>
            <path d={`M${i * 150},-34 L${i * 150 + 150},-74`} stroke={ink} strokeWidth={13} strokeLinecap="round" />
            <path d={`M${i * 150},-34 L${i * 150 + 150},-74`} stroke="#6A5440" strokeWidth={8} strokeLinecap="round" />
          </>
        )}
      </g>
    ))}
  </g>
);

/** Quiet text card in the scene (sombre labels such as the estimated toll). */
export const QuietLabel: React.FC<{text: string; x?: number; y?: number; t: number; size?: number}> = ({text, x = 960, y = 400, t, size = 64}) => (
  <g opacity={clamp(t)} transform={`translate(${x},${y + (1 - clamp(t)) * 14})`}>
    <text textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={size} fill="#F2EADA" stroke="#14141A" strokeWidth={7} paintOrder="stroke" letterSpacing={1}>
      {text}
    </text>
  </g>
);
