// E-08 Dominoes for the history room (S02-07): cream blocks with chalk-style labels that topple
// along a row (`topple` 0..1), and a chalk line-art version for the board: chalk dominoes falling
// across a chalk outline of Europe to a "SARAJEVO" dot that glows (`glow` 0..1).
import React from 'react';
import {geoConicConformal, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import land110 from 'world-atlas/land-110m.json';
import {C, FONT} from '../../styles/theme';
import {clamp, easeIn, easeOut, boil} from '../../animations/core';

const ink = C.ink;
const CHALK = '#F4F1E8';

/** Angle (deg) of domino i at row progress t: each falls in turn and leans on the next (the last falls flat). */
function fallAngle(i: number, n: number, t: number, rest: number) {
  const span = 1 / (n + 1.5);
  const k = clamp((t - i * span) / (span * 2.2));
  const max = i === n - 1 ? 84 : rest;
  return easeIn(k) * max;
}

export type DominoRowProps = {
  x: number;
  /** Table-top line the dominoes stand on. */
  y: number;
  labels: string[];
  /** 0..1: the chain topples left → right. */
  topple?: number;
  w?: number;
  h?: number;
  gap?: number;
  f?: number;
  color?: string;
  /** 0..1 wobble of the first domino (a nudge before the fall). */
  nudge?: number;
};
/** A row of cream domino blocks with chalk-style vertical labels. */
export const DominoRow: React.FC<DominoRowProps> = ({x, y, labels, topple = 0, w = 96, h = 290, gap = 108, f = 0, color = '#F1E7CF', nudge = 0}) => {
  const n = labels.length;
  const rest = (Math.asin(Math.min(1, (gap + w * 0.1) / h)) * 180) / Math.PI + 6;
  return (
    <g>
      {labels.map((lab, i) => {
        const bx = x + i * (w + gap);
        let a = fallAngle(i, n, topple, rest);
        if (i === 0 && nudge > 0 && a < 1) a = Math.sin(nudge * Math.PI) * 5;
        return (
          <g key={i} transform={`rotate(${a},${bx + w},${y})`}>
            <rect x={bx + 6} y={y - h + 6} width={w} height={h} rx={10} fill="rgba(0,0,0,0.18)" />
            <rect x={bx} y={y - h} width={w} height={h} rx={10} fill={color} stroke={ink} strokeWidth={5} />
            <line x1={bx + 12} y1={y - h / 2} x2={bx + w - 12} y2={y - h / 2} stroke={ink} strokeWidth={3} opacity={0.35} />
            <text
              transform={`translate(${bx + w / 2 + 13 + boil(f, i, 0.4)},${y - h / 2}) rotate(-90)`}
              textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={lab.length > 10 ? 36 : 40} fill="#3E3A34" letterSpacing={1.5}
              stroke="#3E3A34" strokeWidth={0.8} strokeDasharray="3 2" opacity={0.92}
            >
              {lab}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------ chalk board version
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const L110 = feature(land110 as any, (land110 as any).objects.land) as any;
const chalkCache = new Map<string, string>();
/** Chalk outline of Europe fitted to a board rect (Natural Earth 1:110m land, public domain). */
function europeChalk(x: number, y: number, w: number, h: number) {
  const k = `${x},${y},${w},${h}`;
  const hit = chalkCache.get(k);
  if (hit) return {d: hit, proj: chalkProj(x, y, w, h)};
  const p = chalkProj(x, y, w, h);
  const d = geoPath(p).digits(1)(L110) ?? '';
  chalkCache.set(k, d);
  return {d, proj: p};
}
const chalkProj = (x: number, y: number, w: number, h: number) =>
  geoConicConformal().parallels([40, 62]).rotate([-14, 0]).center([0, 49]).scale(w * 1.05).translate([x + w / 2, y + h / 2]).clipExtent([[x, y], [x + w, y + h]]);

export type ChalkDominoesProps = {
  /** Board rect (defaults to HistoryRoom's board: x 520–1760, y 130–694). */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  f: number;
  /** 0..1 chalk outline draws on. */
  draw?: number;
  /** 0..1 chalk dominoes topple along the route to Sarajevo. */
  topple?: number;
  /** 0..1 the Sarajevo dot glows warm yellow. */
  glow?: number;
  /** 0..1 "SARAJEVO" label. */
  label?: number;
};
/** Chalk route from the west of Europe to Sarajevo (lon/lat), along which chalk dominoes fall. */
const ROUTE: [number, number][] = [[2.0, 50.6], [6.0, 50.9], [10.0, 50.6], [13.4, 49.6], [16.0, 48.2], [17.4, 46.4], [18.1, 44.9], [18.41, 43.86]];
export const ChalkDominoes: React.FC<ChalkDominoesProps> = ({x = 540, y = 150, w = 1200, h = 524, f, draw = 1, topple = 0, glow = 0, label = 1}) => {
  const {d, proj} = europeChalk(x, y, w, h);
  const pts = ROUTE.map((ll) => proj(ll) as [number, number]);
  // dominoes spaced along the route
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = lens[lens.length - 1];
  const N = 14;
  const at = (t: number): [number, number, number] => {
    const tg = total * t;
    for (let i = 1; i < pts.length; i++)
      if (lens[i] >= tg) {
        const k = (tg - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
        return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k, Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])];
      }
    return [pts[pts.length - 1][0], pts[pts.length - 1][1], 0];
  };
  const sj = pts[pts.length - 1];
  const g = clamp(glow);
  return (
    <g>
      <path d={d} fill="none" stroke={CHALK} strokeWidth={3.2} strokeLinejoin="round" opacity={0.85} pathLength={1} strokeDasharray={`${clamp(draw)} 1`} transform={`translate(${boil(f, 1, 0.5)},${boil(f, 2, 0.5)})`} />
      <path d={d} fill="none" stroke={CHALK} strokeWidth={1.5} opacity={0.35} pathLength={1} strokeDasharray={`${clamp(draw)} 1`} transform="translate(2,1.5)" />
      {Array.from({length: N}).map((_, i) => {
        const [px, py, ang] = at((i + 0.5) / (N + 0.5));
        const k = clamp((topple * (N + 2) - i) / 1.6);
        const sgn = Math.cos(ang) >= 0 ? 1 : -1;
        const lean = easeIn(k) * (i === N - 1 ? 80 : 62) * sgn;
        return (
          <g key={i} transform={`translate(${px},${py}) rotate(${lean},${6 * sgn},0)`} opacity={clamp(draw * 2 - 0.8)}>
            <rect x={-6} y={-36} width={12} height={36} rx={2} fill="none" stroke={CHALK} strokeWidth={3} />
          </g>
        );
      })}
      {/* Sarajevo dot */}
      {g > 0 && <circle cx={sj[0]} cy={sj[1]} r={18 + 30 * g + Math.sin(f / 6) * 4 * g} fill="#FFD27A" opacity={0.35 * g} />}
      {g > 0 && <circle cx={sj[0]} cy={sj[1]} r={12 + 8 * g} fill="#FFD27A" opacity={0.5 * g} />}
      <circle cx={sj[0]} cy={sj[1]} r={11} fill={g > 0 ? `rgb(${244 + 11 * g},${241 - 30 * g},${232 - 110 * g})` : CHALK} stroke={CHALK} strokeWidth={3} />
      {label > 0 && (
        <text x={sj[0] + 26} y={sj[1] + 54} fontFamily={FONT.sans} fontWeight={900} fontSize={44} fill={g > 0.5 ? '#FFE3A0' : CHALK} opacity={easeOut(clamp(label)) * 0.95} letterSpacing={2}>
          SARAJEVO
        </text>
      )}
    </g>
  );
};
