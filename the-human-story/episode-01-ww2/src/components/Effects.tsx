// Procedural particle and effect animations: smoke, fire, explosions, snow, rain, ash, confetti...
import React from 'react';
import {C, W, H} from '../styles/theme';
import {rng, hash, clamp, noise1} from '../animations/core';

const ink = C.ink;

/** Rising smoke column from (x,y). */
export const Smoke: React.FC<{x: number; y: number; f: number; n?: number; color?: string; size?: number; rise?: number; drift?: number; seed?: number; opacity?: number; outline?: boolean}> = ({
  x, y, f, n = 10, color = C.smoke, size = 40, rise = 380, drift = 90, seed = 1, opacity = 0.85, outline = true,
}) => {
  const life = 90;
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const t = ((f + (i * life) / n + hash(seed + i) * 10) % life) / life;
        const px = x + t * drift + noise1(t * 3 + i, seed) * 22;
        const py = y - t * rise;
        const r = size * (0.45 + t * 1.3);
        const op = opacity * Math.min(1, t * 6) * (1 - t);
        return <circle key={i} cx={px} cy={py} r={r} fill={color} opacity={op} stroke={outline ? ink : 'none'} strokeWidth={2.5} strokeOpacity={op * 0.6} />;
      })}
    </g>
  );
};

/** Flickering cartoon fire. */
export const Fire: React.FC<{x: number; y: number; f: number; s?: number; seed?: number}> = ({x, y, f, s = 1, seed = 1}) => {
  const fl = (k: number) => Math.sin(f / 2.3 + k + seed) * 0.12 + noise1(f / 5 + k, seed) * 0.1;
  const flame = (w: number, h: number, color: string, k: number) => (
    <path d={`M${-w},0 C${-w},${-h * 0.5} ${-w * 0.2},${-h * (0.6 + fl(k))} 0,${-h * (1 + fl(k + 1))} C${w * 0.3},${-h * (0.6 + fl(k + 2))} ${w},${-h * 0.45} ${w},0Z`} fill={color} />
  );
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <g stroke={ink} strokeWidth={4} strokeLinejoin="round">{flame(48, 130, C.fire, 0)}</g>
      {flame(32, 90, C.fireYellow, 3)}
      {flame(14, 45, '#FFF3C4', 6)}
    </g>
  );
};

/** Cartoon explosion that plays from frame `at` over `dur` frames. */
export const Explosion: React.FC<{x: number; y: number; f: number; at: number; s?: number; dur?: number; seed?: number}> = ({x, y, f, at, s = 1, dur = 40, seed = 1}) => {
  const t = (f - at) / dur;
  if (t < 0 || t > 1.6) return null;
  const r = rng(seed);
  const flash = clamp(1 - t * 4);
  const ball = Math.sin(clamp(t * 1.6) * Math.PI) * 110;
  const puffs = Array.from({length: 9}).map((_, i) => {
    const a = (i / 9) * Math.PI * 2 + r();
    const d = 40 + t * 110 * (0.6 + r() * 0.6);
    return {x: Math.cos(a) * d, y: Math.sin(a) * d * 0.6 - t * 90, r: (30 + r() * 25) * (0.5 + t)};
  });
  const debris = Array.from({length: 10}).map((_, i) => {
    const a = -Math.PI * (0.1 + r() * 0.8);
    const v = 9 + r() * 10;
    const tt = (f - at) * 0.9;
    return {x: Math.cos(a) * v * tt, y: Math.sin(a) * v * tt + 0.35 * tt * tt, rot: tt * 20 * (r() - 0.5)};
  });
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {puffs.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={C.smoke} opacity={clamp(1.4 - t) * 0.9} stroke={ink} strokeWidth={3} strokeOpacity={clamp(1.4 - t) * 0.5} />
      ))}
      {t < 1 && (
        <g>
          <path
            d={Array.from({length: 16}).map((_, i) => {
              const a = (i / 16) * Math.PI * 2;
              const rr = ball * (i % 2 ? 0.62 : 1);
              return `${i ? 'L' : 'M'}${Math.cos(a) * rr},${Math.sin(a) * rr * 0.85 - 20}`;
            }).join(' ') + 'Z'}
            fill={C.fire}
            stroke={ink}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <circle cx={0} cy={-20} r={ball * 0.5} fill={C.fireYellow} />
          <circle cx={0} cy={-20} r={ball * 0.22} fill="#FFF6D8" />
        </g>
      )}
      {t < 1.2 && debris.map((d, i) => <rect key={i} x={d.x} y={d.y - 20} width={9} height={9} fill={ink} transform={`rotate(${d.rot},${d.x},${d.y - 20})`} />)}
      {flash > 0 && <circle cx={0} cy={-20} r={180} fill="#FFF8D0" opacity={flash * 0.5} />}
    </g>
  );
};

/** Screen-space falling particles (snow / rain / ash / confetti / embers). */
export const Particles: React.FC<{f: number; kind: 'snow' | 'rain' | 'ash' | 'confetti' | 'embers' | 'dust'; n?: number; seed?: number; wind?: number; speed?: number; opacity?: number}> = ({
  f, kind, n = 120, seed = 3, wind = 0.5, speed = 1, opacity = 1,
}) => {
  const r = rng(seed);
  const colors = ['#B23A2E', '#3F6EA6', '#E3C77A', '#FFFFFF', '#566B3C'];
  return (
    <g opacity={opacity}>
      {Array.from({length: n}).map((_, i) => {
        const z = 0.4 + r() * 0.8;
        const x0 = r() * (W + 400) - 200;
        const y0 = r() * (H + 200);
        const vs = (kind === 'rain' ? 26 : kind === 'embers' ? -2.2 : kind === 'ash' ? 1.0 : kind === 'dust' ? 0.3 : 2.2) * z * speed;
        const span = H + 200;
        let y = (((y0 + f * vs) % span) + span) % span - 100;
        let x = x0 + f * wind * z + Math.sin(f / 25 + i) * 18 * (kind === 'rain' ? 0 : 1);
        x = ((x % (W + 400)) + W + 400) % (W + 400) - 200;
        if (kind === 'rain') return <line key={i} x1={x} y1={y} x2={x - 6} y2={y + 30 * z} stroke="#BFD3DE" strokeWidth={2.5} opacity={0.6} />;
        if (kind === 'confetti') return <rect key={i} x={x} y={y} width={12 * z} height={7 * z} fill={colors[i % 5]} transform={`rotate(${f * 6 + i * 40},${x},${y})`} />;
        if (kind === 'embers') return <circle key={i} cx={x} cy={y} r={3.2 * z} fill={i % 2 ? C.fireYellow : C.fire} opacity={0.8} />;
        if (kind === 'ash') return <circle key={i} cx={x} cy={y} r={3.5 * z} fill="#8A8A86" opacity={0.75} />;
        if (kind === 'dust') return <circle key={i} cx={x} cy={y} r={2.5 * z} fill="#FFF6DD" opacity={0.35} />;
        return <circle key={i} cx={x} cy={y} r={5 * z} fill="#FFFFFF" opacity={0.92} stroke={ink} strokeWidth={z > 1 ? 1.5 : 0} />;
      })}
    </g>
  );
};

/** Searchlight beams sweeping a night sky. */
export const Searchlights: React.FC<{f: number; xs: number[]; base: number; seed?: number}> = ({f, xs, base, seed = 1}) => (
  <g>
    {xs.map((x, i) => {
      const a = Math.sin(f / 50 + i * 2 + seed) * 28 - 90 + (i - xs.length / 2) * 8;
      const rad = (a * Math.PI) / 180;
      const len = 1500;
      const spread = 0.045;
      const x1 = x + Math.cos(rad - spread) * len;
      const y1 = base + Math.sin(rad - spread) * len;
      const x2 = x + Math.cos(rad + spread) * len;
      const y2 = base + Math.sin(rad + spread) * len;
      return <path key={i} d={`M${x},${base} L${x1},${y1} L${x2},${y2}Z`} fill="#FFF6C8" opacity={0.16} />;
    })}
  </g>
);

export const BarrageBalloon: React.FC<{x: number; y: number; f: number; s?: number; seed?: number}> = ({x, y, f, s = 1, seed = 1}) => {
  const bob = Math.sin(f / 40 + seed) * 8;
  return (
    <g transform={`translate(${x},${y + bob}) scale(${s})`}>
      <line x1={0} y1={30} x2={20} y2={900} stroke="#2A2A2A" strokeWidth={2} />
      <ellipse cx={0} cy={0} rx={80} ry={34} fill="#8E949A" stroke={ink} strokeWidth={4} />
      <path d="M60,-10 L100,-35 L95,0 L100,35 L60,10Z" fill="#8E949A" stroke={ink} strokeWidth={3.5} strokeLinejoin="round" />
    </g>
  );
};

/** Flak bursts in the sky. */
export const Flak: React.FC<{f: number; seed?: number; n?: number; y0?: number; y1?: number}> = ({f, seed = 7, n = 6, y0 = 80, y1 = 420}) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const period = 50 + Math.floor(hash(seed + i) * 40);
    const ph = (f + i * 17) % period;
    const cycle = Math.floor((f + i * 17) / period);
    const x = hash(seed * 3 + i * 11 + cycle) * W;
    const y = y0 + hash(seed * 5 + i * 7 + cycle) * (y1 - y0);
    const t = ph / 25;
    if (t > 1) continue;
    out.push(
      <g key={i}>
        {t < 0.2 && <circle cx={x} cy={y} r={20} fill={C.fireYellow} />}
        <circle cx={x} cy={y} r={14 + t * 30} fill="#3A3A3A" opacity={0.8 * (1 - t)} />
      </g>,
    );
  }
  return <g>{out}</g>;
};

/** Full-screen colour flash (e.g. bomb) between frames. */
export const ScreenFlash: React.FC<{f: number; at: number; dur?: number; color?: string; hold?: number}> = ({f, at, dur = 45, color = '#FFFFFF', hold = 8}) => {
  const t = f - at;
  if (t < 0) return null;
  const op = t < hold ? Math.min(1, t / 3) : clamp(1 - (t - hold) / dur);
  if (op <= 0) return null;
  return <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={color} opacity={op} />;
};

/** Vignette + paper grain overlay for a hand-made documentary look. */
export const Vignette: React.FC<{strength?: number}> = ({strength = 0.45}) => (
  <>
    <defs>
      <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.55" stopColor="#000" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={strength} />
      </radialGradient>
    </defs>
    <rect x={0} y={0} width={W} height={H} fill="url(#vig)" pointerEvents="none" />
  </>
);

/** Candle (for memorial scenes). */
export const Candle: React.FC<{x: number; y: number; f: number; s?: number; seed?: number; lit?: number}> = ({x, y, f, s = 1, seed = 1, lit = 1}) => {
  const fl = Math.sin(f / 3 + seed) * 0.08 + noise1(f / 6, seed) * 0.08;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {lit > 0 && <circle cx={0} cy={-78} r={46} fill="#FFD27A" opacity={0.18 * lit} />}
      <rect x={-14} y={-60} width={28} height={60} rx={3} fill="#F2EBDC" stroke={ink} strokeWidth={3} />
      <line x1={0} y1={-60} x2={0} y2={-68} stroke={ink} strokeWidth={2.5} />
      {lit > 0 && (
        <g opacity={lit}>
          <path d={`M0,-66 C-9,-74 -6,-${88 + fl * 20} 0,-${100 + fl * 30} C6,-${88 + fl * 20} 9,-74 0,-66Z`} fill={C.fire} />
          <path d={`M0,-68 C-4,-74 -3,-82 0,-${88 + fl * 15} C3,-82 4,-74 0,-68Z`} fill={C.fireYellow} />
        </g>
      )}
    </g>
  );
};
