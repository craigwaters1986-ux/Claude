// E-S1 (SHOULD, approved): poppy wreaths and slow poppy-petal particles for S11-05, plus a simple
// town war memorial (stone cross on a stepped plinth) to prop them against.  Sombre: slow, sparse.
import React from 'react';
import {C, FONT, W} from '../../styles/theme';
import {clamp, rng} from '../../animations/core';

const ink = C.ink;
export const POPPY_RED = '#C7362B';

/** One flat poppy: four rounded red petals and a black centre dot. */
export const Poppy: React.FC<{x: number; y: number; r?: number; rot?: number}> = ({x, y, r = 16, rot = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`}>
    {[0, 90, 180, 270].map((a) => (
      <ellipse key={a} cx={Math.cos((a * Math.PI) / 180) * r * 0.45} cy={Math.sin((a * Math.PI) / 180) * r * 0.45} rx={r * 0.62} ry={r * 0.55} fill={POPPY_RED} stroke={ink} strokeWidth={Math.max(1.5, r * 0.12)} />
    ))}
    <circle r={r * 0.28} fill={ink} />
  </g>
);

/** Poppy wreath ring (leaf ring + poppies + ribbon), standing propped on its lower edge at (x, y). */
export const PoppyWreath: React.FC<{x: number; y: number; s?: number; tilt?: number; ribbon?: string}> = ({x, y, s = 1, tilt = 0, ribbon = '#2A2A2A'}) => {
  const R = 110;
  const n = 18;
  return (
    <g transform={`translate(${x},${y - R * s}) rotate(${tilt}) scale(${s})`}>
      <circle r={R} fill="none" stroke={ink} strokeWidth={46} />
      <circle r={R} fill="none" stroke="#4E6B3A" strokeWidth={38} />
      {Array.from({length: 24}).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return <ellipse key={i} cx={Math.cos(a) * (R + (i % 2 ? 14 : -14))} cy={Math.sin(a) * (R + (i % 2 ? 14 : -14))} rx={12} ry={6} fill="#5E7E46" stroke={ink} strokeWidth={2} transform={`rotate(${(a * 180) / Math.PI + 45},${Math.cos(a) * (R + (i % 2 ? 14 : -14))},${Math.sin(a) * (R + (i % 2 ? 14 : -14))})`} />;
      })}
      {Array.from({length: n}).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + 0.1;
        return <Poppy key={i} x={Math.cos(a) * R} y={Math.sin(a) * R} r={19} rot={i * 23} />;
      })}
      <path d="M-30,90 L-56,190 L-36,178 L-22,196 L-10,100Z" fill={ribbon} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M30,90 L56,190 L36,178 L22,196 L10,100Z" fill={ribbon} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={0} cy={96} rx={30} ry={18} fill={ribbon} stroke={ink} strokeWidth={3} />
    </g>
  );
};

/**
 * Sparse, slow poppy petals drifting in the wind (screen space).  `lift` 0..1 raises them off the
 * ground (S11-05: petals lift and drift as the camera cranes up); `n` stays small (sombre).
 */
export const PoppyPetals: React.FC<{f: number; n?: number; seed?: number; wind?: number; lift?: number; opacity?: number; groundY?: number}> = ({f, n = 22, seed = 11, wind = 0.9, lift = 1, opacity = 1, groundY = 960}) => {
  const r = rng(seed);
  return (
    <g opacity={opacity}>
      {Array.from({length: n}).map((_, i) => {
        const x0 = r() * (W + 600) - 300;
        const ph = r() * 600;
        const sp = 0.5 + r() * 0.6;
        const t = f + ph;
        const x = ((x0 + t * wind * sp) % (W + 600)) - 300 + Math.sin(t / 40 + i) * 30;
        const yAir = 120 + ((r() * 700 + Math.sin(t / 55 + i) * 60) % 760);
        const y = groundY - (groundY - yAir) * clamp(lift * (0.6 + 0.4 * r()));
        if (x < 175 && y < 155) return null; // logo zone
        const rot = t * (1.2 + (i % 3)) + i * 40;
        const sx = 0.5 + 0.5 * Math.abs(Math.sin(t / 25 + i));
        return (
          <g key={i} transform={`translate(${x},${y}) rotate(${rot}) scale(${sx},1)`}>
            <ellipse rx={11} ry={8} fill={POPPY_RED} stroke={ink} strokeWidth={1.5} opacity={0.95} />
          </g>
        );
      })}
    </g>
  );
};

/** Present-day town war memorial: stone cross on a stepped plinth, "1914–1918" (and optional "1939–1945"). Base centre at (x, y). */
export const TownWarMemorial: React.FC<{x?: number; y?: number; s?: number; second?: boolean; stone?: string}> = ({x = W / 2, y = 900, s = 1, second = false, stone = '#B9B4A8'}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-330} y={-60} width={660} height={60} fill={stone} stroke={ink} strokeWidth={5} />
    <rect x={-250} y={-120} width={500} height={60} fill={stone} stroke={ink} strokeWidth={5} />
    <rect x={-150} y={-420} width={300} height={300} fill={stone} stroke={ink} strokeWidth={5} />
    <text x={0} y={-300} textAnchor="middle" fontFamily={FONT.serif} fontWeight={700} fontSize={40} fill="#4A4740">1914–1918</text>
    {second && <text x={0} y={-240} textAnchor="middle" fontFamily={FONT.serif} fontWeight={700} fontSize={40} fill="#4A4740">1939–1945</text>}
    <rect x={-110} y={-200} width={220} height={40} fill="none" stroke="#7A766C" strokeWidth={3} />
    <rect x={-40} y={-980} width={80} height={560} fill={stone} stroke={ink} strokeWidth={5} />
    <rect x={-150} y={-860} width={300} height={76} fill={stone} stroke={ink} strokeWidth={5} />
    <rect x={-40} y={-860} width={80} height={76} fill={stone} />
    <path d="M-36,-976 L-36,-430" stroke="#D6D2C6" strokeWidth={6} opacity={0.6} />
  </g>
);
