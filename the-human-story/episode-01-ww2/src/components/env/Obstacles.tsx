// V-03 Beach obstacles (D-Day): steel "Czech hedgehogs" and angled wooden stakes.
// (x, y) = ground contact point; s = perspective scale (≈0.4 far … 1 near).
import React from 'react';
import {C} from '../../styles/theme';

const ink = C.ink;

export const Hedgehog: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s}) rotate(${rot})`} strokeLinejoin="round">
    <ellipse cx={0} cy={4} rx={90} ry={12} fill="rgba(0,0,0,0.18)" />
    {[
      'M-80,0 L-66,-14 L66,-140 L80,-126 L-66,0Z',
      'M80,0 L66,-14 L-66,-140 L-80,-126 L66,0Z',
      'M-12,10 L12,10 L12,-160 L-12,-160Z',
    ].map((d, i) => (
      <path key={i} d={d} fill={['#5A5450', '#6A6460', '#4E4A46'][i]} stroke={ink} strokeWidth={5} />
    ))}
    <circle cx={0} cy={-70} r={9} fill="#3A3634" stroke={ink} strokeWidth={3} />
  </g>
);

/** Angled wooden stake (log ramp) with a mine on top. */
export const Stake: React.FC<{x: number; y: number; s?: number; mine?: boolean}> = ({x, y, s = 1, mine = true}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={70} ry={10} fill="rgba(0,0,0,0.18)" />
    <path d="M-60,0 L-44,0 L70,-150 L56,-160Z" fill="#7A5A3A" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M10,0 L24,0 L10,-80 L-4,-80Z" fill="#6A4C30" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
    {mine && <g transform="translate(64,-160) rotate(-37)"><rect x={-18} y={-12} width={36} height={20} rx={6} fill="#5E6238" stroke={ink} strokeWidth={4} /></g>}
  </g>
);
