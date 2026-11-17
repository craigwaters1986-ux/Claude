// Small flat map icons for the WW1 maps (screen space): trains, ships, envelopes, stopwatch,
// 48-hour dial, flip calendar, tick list, marching figures, plain red flag, crown, book cards.
import React from 'react';
import {C, FONT} from '../styles/theme';
import {clamp, easeBack, easeOut} from '../animations/core';

const ink = C.ink;
const txt = (size: number, weight = 900) => ({fontFamily: FONT.sans, fontWeight: weight, fontSize: size});

/** Side-view steam train icon (engine + 2 wagons), heading `ang` radians; flips so it never runs upside down. */
export const TrainIcon: React.FC<{x: number; y: number; ang?: number; s?: number; f?: number; color?: string}> = ({x, y, ang = 0, s = 1, f = 0, color = '#3A3A3A'}) => {
  const deg = (ang * 180) / Math.PI;
  const flip = Math.cos(ang) < 0;
  return (
    <g transform={`translate(${x},${y}) rotate(${flip ? deg + 180 : deg}) scale(${flip ? -s : s},${s})`}>
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={-26 - i * 6 + Math.sin(f / 6 + i) * 1.5} cy={-30 - i * 7} r={5 + i * 1.6} fill="#E8E4DA" stroke={ink} strokeWidth={2} opacity={0.9 - i * 0.2} />
      ))}
      <rect x={-34} y={-20} width={30} height={16} rx={3} fill={color} stroke={ink} strokeWidth={3} />
      <rect x={-30} y={-27} width={7} height={9} fill={ink} />
      <rect x={-14} y={-30} width={12} height={14} fill={color} stroke={ink} strokeWidth={3} />
      <rect x={-62} y={-18} width={24} height={14} fill="#7A5A3A" stroke={ink} strokeWidth={3} />
      <rect x={-88} y={-18} width={24} height={14} fill="#7A5A3A" stroke={ink} strokeWidth={3} />
      {[-82, -70, -56, -44, -28, -12].map((cx) => <circle key={cx} cx={cx} cy={-2} r={3.5} fill={ink} />)}
    </g>
  );
};

/** Small warship / troopship icon seen from the side (map scale), with a bow wave. */
export const ShipIcon: React.FC<{x: number; y: number; s?: number; dir?: 1 | -1; f?: number; color?: string; seed?: number}> = ({x, y, s = 1, dir = 1, f = 0, color = '#6E767C', seed = 0}) => (
  <g transform={`translate(${x},${y + Math.sin(f / 14 + seed) * 2}) scale(${s * dir},${s})`}>
    <path d="M-40,0 L44,0 L34,12 L-34,12Z" fill={color} stroke={ink} strokeWidth={3.5} strokeLinejoin="round" />
    <rect x={-16} y={-12} width={26} height={12} fill={color} stroke={ink} strokeWidth={3} />
    <rect x={-6} y={-24} width={8} height={12} fill="#4A4C4F" stroke={ink} strokeWidth={2.5} />
    <path d={`M44,6 q8,${3 + Math.sin(f / 5 + seed) * 2} 14,0`} fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
    <path d={`M-40,10 q-14,${2 + Math.sin(f / 6 + seed)} -30,1`} fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
  </g>
);

/** Sealed envelope (ultimatum / reply). */
export const Envelope: React.FC<{x: number; y: number; s?: number; rot?: number; seal?: string}> = ({x, y, s = 1, rot = 0, seal = C.red}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-34} y={-22} width={68} height={44} rx={4} fill="#F5EFDF" stroke={ink} strokeWidth={4} />
    <path d="M-34,-22 L0,6 L34,-22" fill="none" stroke={ink} strokeWidth={3.5} strokeLinejoin="round" />
    <circle cx={0} cy={6} r={8} fill={seal} stroke={ink} strokeWidth={2.5} />
  </g>
);

/** Stopwatch with a spinning hand (`spin` = turns). */
export const Stopwatch: React.FC<{x: number; y: number; spin: number; s?: number; opacity?: number}> = ({x, y, spin, s = 1, opacity = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={opacity}>
    <rect x={-12} y={-96} width={24} height={18} rx={4} fill="#B7B2A4" stroke={ink} strokeWidth={4} />
    <circle cx={0} cy={0} r={78} fill="#F5EFDF" stroke={ink} strokeWidth={7} />
    {Array.from({length: 12}).map((_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <line key={i} x1={Math.sin(a) * 60} y1={-Math.cos(a) * 60} x2={Math.sin(a) * 70} y2={-Math.cos(a) * 70} stroke={ink} strokeWidth={i % 3 === 0 ? 6 : 3} />;
    })}
    <line x1={0} y1={0} x2={Math.sin(spin * Math.PI * 2) * 58} y2={-Math.cos(spin * Math.PI * 2) * 58} stroke={C.red} strokeWidth={6} strokeLinecap="round" />
    <circle r={8} fill={ink} />
  </g>
);

/** 48-hour dial: a red wedge sweeps round with `sweep` 0..1. */
export const HourDial: React.FC<{x: number; y: number; sweep: number; label?: string; r?: number; opacity?: number}> = ({x, y, sweep, label = '48 HOURS', r = 96, opacity = 1}) => {
  const a = clamp(sweep) * Math.PI * 2;
  const large = a > Math.PI ? 1 : 0;
  const ex = Math.sin(a) * (r - 10);
  const ey = -Math.cos(a) * (r - 10);
  const [n, unit] = label.split(' ');
  return (
    <g transform={`translate(${x},${y})`} opacity={opacity}>
      <circle r={r} fill="#F5EFDF" stroke={ink} strokeWidth={7} />
      {sweep > 0.001 && (sweep >= 0.999 ? <circle r={r - 10} fill={C.red} opacity={0.55} /> : <path d={`M0,0 L0,${-(r - 10)} A${r - 10},${r - 10} 0 ${large} 1 ${ex},${ey}Z`} fill={C.red} opacity={0.55} />)}
      <text y={-2} textAnchor="middle" {...txt(54)} fill={ink}>{n}</text>
      <text y={38} textAnchor="middle" {...txt(36)} fill={ink}>{unit}</text>
    </g>
  );
};

/** Flip calendar: shows entries[i], flipping as `idx` passes each integer. */
export const FlipCalendar: React.FC<{x: number; y: number; idx: number; entries: string[]; opacity?: number}> = ({x, y, idx, entries, opacity = 1}) => {
  const i = Math.max(0, Math.min(entries.length - 1, Math.floor(idx)));
  const fr = idx - Math.floor(idx);
  // flip in the first 30 % of each step
  const k = i > 0 && fr < 0.3 ? fr / 0.3 : 1;
  const sy = Math.abs(Math.cos((1 - k) * Math.PI));
  const shown = k < 0.5 && i > 0 ? entries[i - 1] : entries[i];
  return (
    <g transform={`translate(${x},${y})`} opacity={opacity}>
      <rect x={-130} y={-80} width={260} height={160} rx={12} fill="#F5EFDF" stroke={ink} strokeWidth={6} />
      <rect x={-130} y={-80} width={260} height={40} rx={12} fill={C.red} stroke={ink} strokeWidth={6} />
      <circle cx={-70} cy={-82} r={8} fill={ink} />
      <circle cx={70} cy={-82} r={8} fill={ink} />
      <g transform={`translate(0,20) scale(1,${Math.max(0.05, sy)})`}>
        <text y={18} textAnchor="middle" {...txt(54)} fill={ink}>{shown}</text>
      </g>
    </g>
  );
};

/** Reply list: ticks then crosses (marks e.g. "vvvvx"); `shown` = how many marks are visible (fractional pops). */
export const TickList: React.FC<{x: number; y: number; marks: string; shown: number; title?: string}> = ({x, y, marks, shown, title}) => {
  const n = marks.length;
  const w = n * 64 + 36;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-w / 2} y={title ? -96 : -46} width={w} height={title ? 140 : 92} rx={12} fill="#F5EFDF" stroke={ink} strokeWidth={5} />
      {title && <text y={-52} textAnchor="middle" {...txt(36)} fill={ink}>{title}</text>}
      {marks.split('').map((m, i) => {
        const k = easeBack(clamp(shown - i));
        if (k <= 0) return null;
        const cx = -w / 2 + 50 + i * 64;
        return (
          <g key={i} transform={`translate(${cx},0) scale(${k})`}>
            {m === 'v' ? (
              <path d="M-18,0 L-6,14 L20,-16" fill="none" stroke={C.militaryGreen} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M-16,-16 L16,16 M16,-16 L-16,16" fill="none" stroke={C.red} strokeWidth={10} strokeLinecap="round" />
            )}
          </g>
        );
      })}
    </g>
  );
};

/** Tiny marching figure (map scale): round white head, ink body, swinging legs. */
export const Marcher: React.FC<{x: number; y: number; s?: number; f?: number; seed?: number; color?: string}> = ({x, y, s = 1, f = 0, seed = 0, color = '#6A6F5D'}) => {
  const sw = Math.sin(f / 4 + seed) * 6;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d={`M0,-10 L${sw},4 M0,-10 L${-sw},4`} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <rect x={-4} y={-24} width={8} height={15} rx={2} fill={color} stroke={ink} strokeWidth={2} />
      <circle cx={0} cy={-31} r={6} fill="#fff" stroke={ink} strokeWidth={2.5} />
    </g>
  );
};

/** Plain red flag on a pole (no emblem). */
export const RedFlagIcon: React.FC<{x: number; y: number; s?: number; f?: number; pop?: number}> = ({x, y, s = 1, f = 0, pop = 1}) => {
  const k = easeBack(clamp(pop));
  if (k <= 0) return null;
  const w = Math.sin(f / 5) * 4;
  return (
    <g transform={`translate(${x},${y}) scale(${s * k})`}>
      <line x1={0} y1={0} x2={0} y2={-70} stroke={ink} strokeWidth={5} strokeLinecap="round" />
      <path d={`M2,-68 Q20,${-74 + w} 42,-66 L42,-38 Q20,${-46 + w} 2,-40Z`} fill={C.red} stroke={ink} strokeWidth={3.5} strokeLinejoin="round" />
    </g>
  );
};

/** Simple crown icon. */
export const CrownIcon: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-30,14 L-34,-16 L-16,0 L0,-24 L16,0 L34,-16 L30,14Z" fill={C.gold} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={-31} y={12} width={62} height={10} fill={C.gold} stroke={ink} strokeWidth={4} />
    {[-34, 0, 34].map((cx, i) => <circle key={i} cx={cx} cy={i === 1 ? -26 : -18} r={5} fill={C.red} stroke={ink} strokeWidth={2} />)}
  </g>
);

/** Generic book-cover card (title only, no real cover art): for the historians' debate (S03-08). */
export const BookCard: React.FC<{x: number; y: number; title: string; sub: string; color?: string; slide?: number; rot?: number}> = ({x, y, title, sub, color = '#6F5B46', slide = 1, rot = -4}) => {
  const k = easeOut(clamp(slide));
  return (
    <g transform={`translate(${x - (1 - k) * 260},${y}) rotate(${rot})`} opacity={k}>
      <rect x={-130} y={-170} width={260} height={340} rx={8} fill={color} stroke={ink} strokeWidth={6} />
      <rect x={-130} y={-170} width={26} height={340} fill="rgba(0,0,0,0.18)" />
      <rect x={-96} y={-120} width={200} height={6} fill="#F5EFDF" opacity={0.8} />
      <text x={4} y={-40} textAnchor="middle" {...txt(40)} fill="#F5EFDF">{title}</text>
      <text x={4} y={20} textAnchor="middle" {...txt(36, 800)} fill="#F5EFDF">{sub}</text>
      <rect x={-96} y={80} width={200} height={6} fill="#F5EFDF" opacity={0.8} />
    </g>
  );
};
