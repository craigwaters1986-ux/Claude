// Episode 2 (WW1) scene-assembly helpers shared by S01–S05 (video editor A). Editor B may import these too.
// Only composition helpers live here; characters, sets, vehicles and maps come from the libraries.
import React from 'react';
import {C, W, H, FONT} from '../styles/theme';
import {NameTag, GroupTag} from '../characters/StickFigure';
import {HatShape} from '../characters/Head';
import {CAST} from '../characters/cast';
import {seated, seatedWave, waveSide} from '../characters/poses';
import type {Pose} from '../characters/poses';
import {TouringCar, CAR_SEATS, CAR_COLORS} from '../components/VehiclesWW1';
import {Train} from '../components/Vehicles';
import {Smoke} from '../components/Effects';
import {measureW} from '../components/Text';
import {clamp, prog, easeOut, easeIn, easeInOut, rng} from '../animations/core';
import {Fig, Bunting} from './kit';

const ink = C.ink;

/** Fade 0..1 for an element visible from `a` to `b` (local frames). */
export const vis = (f: number, a: number, b: number, d = 12) => clamp(Math.min((f - a) / d, (b - f) / d));

/** Yellow name tag (real people only) that fades in/out between `at` and `until`. */
export const TimedTag: React.FC<{f: number; at: number; until: number; x: number; y: number; text: string; sub?: string}> = ({f, at, until, x, y, text, sub}) => {
  const o = vis(f, at, until);
  return o <= 0 ? null : <NameTag x={x} y={y} text={text} sub={sub} opacity={o} />;
};

/** Grey group label (unnamed groups) with a fade. */
export const TimedGroupTag: React.FC<{f: number; at: number; until: number; x: number; y: number; text: string; sub?: string; scale?: number}> = ({f, at, until, x, y, text, sub, scale}) => {
  const o = vis(f, at, until);
  return o <= 0 ? null : <GroupTag x={x} y={y} text={text} sub={sub} opacity={o} scale={scale} />;
};

/** Open touring car with seated passengers drawn between the car's back and front layers.
 *  `riders`: cast keys for [driver, rearLeft, rearRight] (null = empty seat). */
export const CarParty: React.FC<{
  f: number; x: number; y: number; dist: number; s?: number; color?: string; turn?: number; stall?: number; running?: boolean;
  riders: [string | null, string | null, string | null]; wave?: boolean; poses?: (Pose | undefined)[]; expr?: ('neutral' | 'happy' | 'worried' | 'solemn')[];
}> = ({f, x, y, dist, s = 1, color = CAR_COLORS.archduke, turn = 0, stall = 0, running = true, riders, wave = true, poses = [], expr = []}) => {
  const sx = 1 - 0.42 * easeOut(clamp(turn));
  const seats = [CAR_SEATS.driver, CAR_SEATS.rearLeft, CAR_SEATS.rearRight];
  return (
    <g>
      <TouringCar x={x} y={y} dist={dist} s={s} f={f} color={color} layer="back" turn={turn} stall={stall} running={running} />
      {riders.map((k, i) =>
        k ? (
          <Fig
            key={i}
            k={k}
            x={x + seats[i].x * s * sx}
            y={y + seats[i].y * s}
            f={f}
            s={s}
            seed={i * 7 + 3}
            pose={poses[i] ?? (i > 0 && wave ? seatedWave(f, i * 3) : seated(f, i))}
            expr={expr[i] ?? (i > 0 ? 'happy' : 'neutral')}
          />
        ) : null,
      )}
      <TouringCar x={x} y={y} dist={dist} s={s} f={f} color={color} layer="front" turn={turn} stall={stall} running={running} />
    </g>
  );
};

/** Pigeons bursting up from rooftops at `at` (scatter, rising and spreading). Before `at`, a few sit on the ridge. */
export const PigeonBurst: React.FC<{f: number; at: number; x: number; y: number; n?: number; spread?: number; seed?: number; s?: number}> = ({f, at, x, y, n = 18, spread = 520, seed = 3, s = 1}) => {
  const r = rng(seed);
  const birds = Array.from({length: n}).map(() => ({dx: (r() - 0.5) * spread, vx: (r() - 0.3) * 9, vy: -(5 + r() * 7), ph: r() * 6}));
  const t = f - at;
  return (
    <g stroke={ink} strokeLinecap="round" fill="#8E9096">
      {birds.map((b, i) => {
        if (t < 0) return null;
        const k = Math.min(t, 140);
        const bx = x + b.dx + b.vx * k * s;
        const by = y + b.vy * k * s + 0.012 * k * k * s;
        const flap = Math.sin(f / 1.6 + b.ph) * 14 * s;
        return (
          <g key={i} opacity={clamp(1 - (t - 110) / 30)}>
            <path d={`M${bx - 22 * s},${by - flap} Q${bx - 9 * s},${by - 8 * s} ${bx},${by} Q${bx + 9 * s},${by - 8 * s} ${bx + 22 * s},${by - flap}`} fill="none" strokeWidth={4 * s} />
            <ellipse cx={bx} cy={by + 2 * s} rx={7 * s} ry={5 * s} strokeWidth={2} />
          </g>
        );
      })}
    </g>
  );
};

/** A plain wooden post with an empty helmet / cap from a cast preset sitting on top (S01-03). */
export const HelmetPost: React.FC<{x: number; y: number; h?: number; s?: number; k?: string; tone?: string}> = ({x, y, h = 300, s = 1, k, tone = '#6A5844'}) => {
  const hd = k ? CAST[k].head : undefined;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-13} y={-h} width={26} height={h} fill={tone} stroke={ink} strokeWidth={4} />
      <path d={`M-13,${-h} L0,${-h - 10} L13,${-h}`} fill={tone} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      {hd && hd.hat && (
        <g transform={`translate(0,${-h + 6})`}>
          <HatShape hat={hd.hat} r={44} color={hd.hatColor} accent={hd.hatAccent} />
        </g>
      )}
    </g>
  );
};

/** List pill whose lines strike through one after another (S01-03 "4 EMPIRES FALL"). */
export const StrikeList: React.FC<{f: number; at: number; until: number; heading: string; lines: string[]; x: number; y: number; strikeAt: number; strikeStep: number; size?: number}> = ({
  f, at, until, heading, lines, x, y, strikeAt, strikeStep, size = 38,
}) => {
  const o = vis(f, at, until, 18);
  if (o <= 0) return null;
  const hs = size + 6;
  const tw = Math.max(measureW(heading, hs, 900), ...lines.map((l) => measureW(l, size, 800)));
  const w = tw + 80;
  const lh = size * 1.42;
  const hgt = 46 + hs + lines.length * lh + 18;
  return (
    <g transform={`translate(${x - w / 2},${y})`} opacity={o}>
      <rect x={6} y={7} width={w} height={hgt} rx={14} fill="rgba(0,0,0,0.3)" />
      <rect width={w} height={hgt} rx={14} fill="#E9E6DE" stroke={ink} strokeWidth={4.5} />
      <text x={40} y={30 + hs} fontFamily={FONT.sans} fontWeight={900} fontSize={hs} fill={C.darkRed} letterSpacing={1.5}>
        {heading}
      </text>
      {lines.map((l, i) => {
        const ly = 30 + hs + (i + 1) * lh;
        const st = prog(f, strikeAt + i * strikeStep, strikeAt + i * strikeStep + 12, easeOut);
        const lw = measureW(l, size, 800);
        return (
          <g key={i} opacity={prog(f, at + 10 + i * 8, at + 24 + i * 8)}>
            <text x={40} y={ly} fontFamily={FONT.sans} fontWeight={800} fontSize={size} fill={ink} opacity={1 - 0.35 * st}>
              {l}
            </text>
            {st > 0 && <line x1={34} y1={ly - size * 0.32} x2={34 + (lw + 12) * st} y2={ly - size * 0.32} stroke={C.darkRed} strokeWidth={5} strokeLinecap="round" />}
          </g>
        );
      })}
    </g>
  );
};

/** Centred quote card on a dark translucent panel (attributed quotations; no bounce). */
export const QuoteCard: React.FC<{f: number; at: number; until: number; quote: string; credit: string; y?: number; size?: number}> = ({f, at, until, quote, credit, y = 300, size = 50}) => {
  const o = clamp(Math.min((f - at) / 24, (until - f) / 24));
  if (o <= 0) return null;
  const qw = measureW(quote, size, 800, 0.66, true);
  const cw = measureW(credit, 30, 700);
  const w = Math.max(qw, cw) + 110;
  const h = size * 1.3 + 30 + 70;
  return (
    <g opacity={o}>
      <rect x={W / 2 - w / 2} y={y} width={w} height={h} rx={16} fill="rgba(20,22,28,0.78)" stroke="#F4EBD6" strokeWidth={2} />
      <text x={W / 2} y={y + size * 1.15 + 12} textAnchor="middle" fontFamily={FONT.sans} fontStyle="italic" fontWeight={800} fontSize={size} fill="#F4EBD6">
        {quote}
      </text>
      <text x={W / 2} y={y + h - 30} textAnchor="middle" fontFamily={FONT.sans} fontWeight={700} fontSize={30} fill="#F2D9A6" letterSpacing={1}>
        {credit}
      </text>
    </g>
  );
};

/** Bold panel heading on a paper strip (split screens, S03-08). */
export const PanelHead: React.FC<{x: number; y: number; text: string; o: number; size?: number; maxW?: number; color?: string}> = ({x, y, text, o, size = 40, maxW = 860, color = C.darkRed}) => {
  if (o <= 0) return null;
  // two lines when too wide
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const wd of words) {
    const nx = cur ? cur + ' ' + wd : wd;
    if (measureW(nx, size, 900) > maxW && cur) {
      lines.push(cur);
      cur = wd;
    } else cur = nx;
  }
  if (cur) lines.push(cur);
  const w = Math.max(...lines.map((l) => measureW(l, size, 900))) + 50;
  const h = lines.length * size * 1.18 + 26;
  return (
    <g opacity={o} transform={`translate(${x - w / 2},${y})`}>
      <rect x={5} y={6} width={w} height={h} rx={10} fill="rgba(0,0,0,0.25)" />
      <rect width={w} height={h} rx={10} fill="#F4EBD6" stroke={ink} strokeWidth={4} />
      {lines.map((l, i) => (
        <text key={i} x={w / 2} y={size * 1.05 + 6 + i * size * 1.18} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={size} fill={color}>
          {l}
        </text>
      ))}
    </g>
  );
};

/** Simple wooden desk front (history room). Top surface at y. */
export const Desk: React.FC<{x0: number; x1: number; y: number; h?: number}> = ({x0, x1, y, h = 200}) => (
  <g>
    <rect x={x0} y={y} width={x1 - x0} height={22} fill="#9A6A3E" stroke={ink} strokeWidth={5} />
    <rect x={x0 + 20} y={y + 22} width={x1 - x0 - 40} height={h} fill="#7A5230" stroke={ink} strokeWidth={5} />
    <line x1={x0 + 20} y1={y + 70} x2={x1 - 20} y2={y + 70} stroke={ink} strokeWidth={3} />
  </g>
);

/** 1914 station platform (lifted from ep01's S04 station composition): canopy columns, platform edge,
 *  a departing train (dist drives the wheels) and steam. Draw figures after it. */
export const Station1914: React.FC<{f: number; trainX: number; bunting?: boolean; x0?: number; x1?: number}> = ({f, trainX, bunting = true, x0 = -400, x1 = 2600}) => (
  <g>
    <rect x={x0} y={-300} width={x1 - x0} height={1700} fill="#B8B4A6" />
    <rect x={x0} y={-300} width={x1 - x0} height={360} fill="#8E8C84" />
    {Array.from({length: Math.ceil((x1 - x0) / 380)}).map((_, i) => (
      <g key={i}>
        <rect x={x0 + 100 + i * 380} y={60} width={20} height={600} fill="#4A4A48" stroke={ink} strokeWidth={3} />
        <path d={`M${x0 + 100 + i * 380},80 L${x0 + 380 + i * 380},40`} stroke={ink} strokeWidth={8} />
      </g>
    ))}
    <rect x={x0} y={0} width={x1 - x0} height={60} fill="#5A5A58" stroke={ink} strokeWidth={4} />
    {bunting && <Bunting x0={x0 + 200} x1={x1 - 200} y={90} sag={40} f={f} />}
    <rect x={x0} y={720} width={x1 - x0} height={30} fill="#6A6460" />
    <Train x={trainX} y={760} dist={trainX} f={f} cars={4} s={1.1} dir={1} color="#3A4A3A" />
    <Smoke x={trainX + 120} y={520} f={f} n={10} size={70} rise={220} drift={-160} color="#E8E8E4" opacity={0.6} outline={false} seed={4} />
    <rect x={x0} y={800} width={x1 - x0} height={500} fill="#B4ACA0" stroke={ink} strokeWidth={5} />
    <line x1={x0} y1={820} x2={x1} y2={820} stroke="#E3C77A" strokeWidth={8} strokeDasharray="40 30" />
  </g>
);

/** Soldiers leaning out of a train's carriage windows (positions follow the train). */
export const WindowWavers: React.FC<{f: number; trainX: number; k: string; cars?: number; s?: number}> = ({f, trainX, k, cars = 4, s = 1.1}) => (
  <g>
    {Array.from({length: cars}).map((_, c) =>
      [60, 180].map((wx, j) => {
        const x = trainX + (-330 - c * 260 + wx) * s;
        return <Fig key={`${c}${j}`} k={k} x={x} y={760 - 70 * s} f={f} s={0.62} pose={waveSide(f, c * 2 + j)} expr="happy" cutBelow={760 - 128 * s} seed={c * 5 + j} />;
      }),
    )}
  </g>
);

/** Thin wrapper: draw a full-frame (1920×1080) node into a box (nested SVG viewport). */
export const Boxed: React.FC<{x: number; y: number; w: number; h: number; children: React.ReactNode; vb?: [number, number, number, number]}> = ({x, y, w, h, children, vb = [0, 0, W, H]}) => (
  <svg x={x} y={y} width={w} height={h} viewBox={vb.join(' ')} overflow="hidden" preserveAspectRatio="xMidYMid slice">
    {children}
  </svg>
);

/** Low drifting ground-mist bands (sombre fields). */
export const GroundMist: React.FC<{f: number; y0: number; y1: number; amount?: number; color?: string}> = ({f, y0, y1, amount = 1, color = '#E4E4DC'}) => (
  <g opacity={amount}>
    {Array.from({length: 7}).map((_, i) => {
      const yy = y0 + ((y1 - y0) * i) / 6;
      const x = ((f * (0.4 + i * 0.07) + i * 330) % 2600) - 600;
      return <ellipse key={i} cx={x} cy={yy} rx={700 + i * 40} ry={26 + i * 4} fill={color} opacity={0.22} />;
    })}
  </g>
);

// ---------------------------------------------------------------- Sarajevo, 28 June 1914 (S01-01/02, S03-01/02)
export const SARAJEVO_PALETTE = ['#E8D9B0', '#D9B97A', '#E3CFA0', '#CFA86A', '#EADFC4', '#D8C29A'];

/** Riverside street in summer sun: hills, cream and ochre façades with red roofs, Habsburg-colour pennants on
 *  balconies (plain black-and-yellow, no emblem), pavement (y pave), road, low quay wall + river strip in front. */
export const SarajevoStreet: React.FC<{f: number; base?: number; x0?: number; x1?: number; road?: number; quay?: boolean; seed?: number; skyTop?: number}> = ({
  f, base = 640, x0 = -400, x1 = 3200, road = 700, quay = true, seed = 21, skyTop = -900,
}) => (
  <g>
    <defs>
      <linearGradient id={`sjSky${seed}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8DBBD0" />
        <stop offset="1" stopColor="#F3E6C2" />
      </linearGradient>
    </defs>
    <rect x={x0 - 400} y={skyTop} width={x1 - x0 + 800} height={base - skyTop + 20} fill={`url(#sjSky${seed})`} />
    <circle cx={x1 - 500} cy={150} r={70} fill="#F6DC8A" stroke={ink} strokeWidth={4} />
    <path d={`M${x0 - 400},${base - 170} Q${x0 + 300},${base - 330} ${x0 + 900},${base - 210} T${x0 + 2100},${base - 250} T${x1 + 400},${base - 200} L${x1 + 400},${base} L${x0 - 400},${base}Z`} fill="#9DAA78" stroke={ink} strokeWidth={4} />
    <path d={`M${x0 - 400},${base - 100} Q${x0 + 500},${base - 220} ${x0 + 1300},${base - 130} T${x1 + 400},${base - 120} L${x1 + 400},${base} L${x0 - 400},${base}Z`} fill="#86965F" stroke={ink} strokeWidth={4} />
    <g transform={`translate(${(f * 0.25) % 400},0)`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${x0 + i * 760},${70 + (i % 2) * 60})`}>
          <ellipse cx={0} cy={0} rx={90} ry={34} fill="#FBFBF7" stroke={ink} strokeWidth={3} />
          <ellipse cx={60} cy={-14} rx={60} ry={30} fill="#FBFBF7" stroke={ink} strokeWidth={3} />
        </g>
      ))}
    </g>
    <BuildingsRow f={f} base={base} x0={x0} x1={x1} seed={seed} />
    {/* pavement + road */}
    <rect x={x0 - 400} y={base} width={x1 - x0 + 800} height={road - base} fill="#D6CDBB" stroke={ink} strokeWidth={4} />
    <rect x={x0 - 400} y={road} width={x1 - x0 + 800} height={quay ? 300 : 600} fill="#B9AE98" stroke={ink} strokeWidth={4} />
    {Array.from({length: 22}).map((_, i) => (
      <line key={i} x1={x0 + i * 180} y1={road + 120} x2={x0 + i * 180 + 70} y2={road + 120} stroke="#A49A84" strokeWidth={5} />
    ))}
    {quay && (
      <g>
        <rect x={x0 - 400} y={road + 290} width={x1 - x0 + 800} height={46} fill="#CFC5AE" stroke={ink} strokeWidth={4} />
        {Array.from({length: 40}).map((_, i) => (
          <line key={i} x1={x0 - 400 + i * 110} y1={road + 290} x2={x0 - 400 + i * 110} y2={road + 336} stroke={ink} strokeWidth={2} opacity={0.5} />
        ))}
        <rect x={x0 - 400} y={road + 336} width={x1 - x0 + 800} height={400} fill="#6E9AA8" />
        {Array.from({length: 18}).map((_, i) => (
          <path key={i} d={`M${x0 + ((i * 230 + f * 1.2) % (x1 - x0))},${road + 372 + (i % 3) * 18} q20,-8 40,0`} stroke="#DDEBEE" strokeWidth={3} fill="none" opacity={0.7} />
        ))}
      </g>
    )}
  </g>
);

const BuildingsRow: React.FC<{f: number; base: number; x0: number; x1: number; seed: number}> = ({f, base, x0, x1, seed}) => {
  const r = rng(seed);
  const out: React.ReactNode[] = [];
  let x = x0;
  let i = 0;
  while (x < x1) {
    const w = 190 + r() * 110;
    const h = 260 + r() * 170;
    const col = SARAJEVO_PALETTE[Math.floor(r() * SARAJEVO_PALETTE.length)];
    const top = base - h;
    const rows = Math.floor((h - 90) / 80);
    const cols = Math.max(2, Math.floor(w / 70));
    out.push(
      <g key={i}>
        <path d={`M${x - 10},${top} L${x + w / 2},${top - 70} L${x + w + 10},${top}Z`} fill="#B5513A" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
        <rect x={x} y={top} width={w} height={h} fill={col} stroke={ink} strokeWidth={4} />
        {Array.from({length: rows}).map((_, ry) =>
          Array.from({length: cols}).map((__, cx) => (
            <rect key={`${ry}${cx}`} x={x + ((cx + 0.5) * w) / cols - 14} y={top + 34 + ry * 80} width={28} height={42} fill="#5E7884" stroke={ink} strokeWidth={3} />
          )),
        )}
        <rect x={x + w / 2 - 20} y={base - 70} width={40} height={70} fill="#5A4030" stroke={ink} strokeWidth={3.5} />
        {i % 2 === 0 && (
          <g transform={`translate(${x + w * 0.3},${top + 120})`}>
            <line x1={0} y1={0} x2={34} y2={-40} stroke={ink} strokeWidth={4} />
            <path d={`M34,-40 L${86 + Math.sin(f / 9 + i) * 4},-34 L${84 + Math.sin(f / 9 + i + 1) * 4},-14 L30,-20Z`} fill="#E8C440" stroke={ink} strokeWidth={3} />
            <path d={`M32,-30 L${85 + Math.sin(f / 9 + i) * 4},-24 L${84 + Math.sin(f / 9 + i + 1) * 4},-14 L30,-20Z`} fill="#1E1E1E" />
          </g>
        )}
      </g>,
    );
    x += w + 8;
    i++;
  }
  return <g>{out}</g>;
};

export {easeIn, easeInOut};
