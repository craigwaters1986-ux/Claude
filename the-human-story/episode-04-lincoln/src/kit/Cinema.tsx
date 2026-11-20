// Episode 4 cinematic look: a layered parallax camera with depth of field, time-of-day grades, rim light,
// flickering light pools, god-rays, film grain, light leaks (title only) and cinematic title plates.
// All in SVG so it renders deterministically with the rest of the engine.
import React from 'react';
import {C, FONT} from '../styles/theme';
import {clamp, easeInOut, easeOut, kf, noise1, prog} from '../animations/core';

export type CamKey = [number, number, number, number]; // frame, zoom, cx, cy (scene coords of the subject plane)

/** Layered camera. `children(layer)`; call layer(depth, node, blurPx) for each plane:
 *  depth 0.15 sky · 0.4 far · 0.7 mid · 1 subject · 1.25–1.6 foreground. Far planes move and zoom less,
 *  foreground planes more. `hand` adds a gentle handheld drift (tense scenes only). */
export const CineCam: React.FC<{f: number; keys: CamKey[]; hand?: number; seed?: number; children: (layer: (depth: number, node: React.ReactNode, blur?: number) => React.ReactNode) => React.ReactNode}> = ({f, keys, hand = 0, seed = 1, children}) => {
  const z = kf(f, keys.map((k) => [k[0], k[1]] as [number, number]));
  const cx = kf(f, keys.map((k) => [k[0], k[2]] as [number, number]));
  const cy = kf(f, keys.map((k) => [k[0], k[3]] as [number, number]));
  const hx = hand * (noise1(f / 26, seed) * 7 + noise1(f / 9, seed + 7) * 1.5);
  const hy = hand * (noise1(f / 31, seed + 3) * 5 + noise1(f / 11, seed + 9) * 1.2);
  const hr = hand * noise1(f / 40, seed + 5) * 0.35;
  const drift = noise1(f / 90, seed + 11) * 3;
  const layer = (depth: number, node: React.ReactNode, blur = 0) => {
    const zl = 1 + (z - 1) * Math.pow(depth, 0.85);
    const lx = 960 + (cx - 960) * depth;
    const ly = 540 + (cy - 540) * depth;
    return (
      <g key={`${depth}-${blur}`} filter={blur > 0 ? `url(#dof${Math.round(blur)})` : undefined}>
        <g transform={`translate(${960 + hx * depth + drift * depth},${540 + hy * depth}) rotate(${hr}) scale(${zl}) translate(${-lx},${-ly})`}>{node}</g>
      </g>
    );
  };
  return <g>{children(layer)}</g>;
};

/** Filter defs used by the look (put once per shot frame). */
export const CineDefs: React.FC = () => (
  <defs>
    {[2, 3, 4, 5, 6].map((b) => (
      <filter key={b} id={`dof${b}`} x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation={b} />
      </filter>
    ))}
    {/* rim light: a light-coloured edge on the side facing the light (dx < 0 = light from the left) */}
    {(['warm', 'cool', 'moon'] as const).map((k) => (
      <React.Fragment key={k}>
        {[-1, 1].map((sd) => (
          <filter key={sd} id={`rim-${k}-${sd < 0 ? 'l' : 'r'}`} x="-20%" y="-20%" width="140%" height="140%">
            <feFlood floodColor={k === 'warm' ? '#FFD38A' : k === 'cool' ? '#CFE4FF' : '#B8C8E8'} result="c" />
            <feComposite in="c" in2="SourceAlpha" operator="in" result="a" />
            <feOffset in="SourceAlpha" dx={-4 * sd} dy={1} result="sh" />
            <feComposite in="a" in2="sh" operator="out" result="rim" />
            <feGaussianBlur in="rim" stdDeviation={0.8} result="rimb" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="rimb" />
            </feMerge>
          </filter>
        ))}
      </React.Fragment>
    ))}
  </defs>
);

/** Wrap a figure: rim light from `side` ('l' = light source on the left). */
export const Rim: React.FC<{kind?: 'warm' | 'cool' | 'moon'; side?: 'l' | 'r'; children: React.ReactNode}> = ({kind = 'warm', side = 'l', children}) => <g filter={`url(#rim-${kind}-${side})`}>{children}</g>;

export type Grade = 'dawn' | 'day' | 'golden' | 'dusk' | 'night' | 'lamp' | 'sombre';
const GRADES: Record<Grade, {tint: string; op: number; blend: string; lift?: string; liftOp?: number}> = {
  dawn: {tint: '#E8A8B8', op: 0.16, blend: 'soft-light', lift: '#9AB4D8', liftOp: 0.1},
  day: {tint: '#FFF4DC', op: 0.06, blend: 'soft-light'},
  golden: {tint: '#FFB050', op: 0.22, blend: 'soft-light', lift: '#FF9A40', liftOp: 0.07},
  dusk: {tint: '#C87A60', op: 0.2, blend: 'multiply', lift: '#4A5A8A', liftOp: 0.12},
  night: {tint: '#2A3A66', op: 0.42, blend: 'multiply', lift: '#6A8AC8', liftOp: 0.06},
  lamp: {tint: '#FF9A3C', op: 0.18, blend: 'soft-light', lift: '#1A1A30', liftOp: 0.22},
  sombre: {tint: '#5A6A80', op: 0.3, blend: 'saturation'},
};
/** Full-frame colour grade (draw after the scene, before captions). */
export const GradeLayer: React.FC<{grade: Grade; amount?: number}> = ({grade, amount = 1}) => {
  const g = GRADES[grade];
  return (
    <g pointerEvents="none">
      <rect width={1920} height={1080} fill={g.tint} opacity={g.op * amount} style={{mixBlendMode: g.blend as React.CSSProperties['mixBlendMode']}} />
      {g.lift && <rect width={1920} height={1080} fill={g.lift} opacity={(g.liftOp ?? 0) * amount} style={{mixBlendMode: 'screen'}} />}
    </g>
  );
};

/** Warm pool of light (lamp, fire, candle) with flicker. */
export const LightPool: React.FC<{x: number; y: number; r: number; f: number; color?: string; seed?: number; strength?: number; flicker?: number}> = ({x, y, r, f, color = '#FFB866', seed = 1, strength = 0.42, flicker = 1}) => {
  const fl = 1 + flicker * (noise1(f / 3.2, seed) * 0.08 + noise1(f / 9, seed + 4) * 0.06);
  const id = `pool${seed}`;
  return (
    <g pointerEvents="none" style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity={strength} />
          <stop offset="0.45" stopColor={color} stopOpacity={strength * 0.45} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y} rx={r * fl} ry={r * 0.82 * fl} fill={`url(#${id})`} />
    </g>
  );
};

/** God-rays from a window: soft beams that shimmer slowly. */
export const GodRays: React.FC<{x: number; y: number; w: number; f: number; angle?: number; len?: number; color?: string; n?: number; op?: number}> = ({x, y, w, f, angle = 28, len = 900, color = '#FFE6B0', n = 5, op = 0.16}) => (
  <g pointerEvents="none" style={{mixBlendMode: 'screen'}}>
    <defs>
      <linearGradient id="rayg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity={1} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
    <g transform={`translate(${x},${y}) rotate(${-angle})`}>
      {Array.from({length: n}, (_, i) => {
        const bx = (i / (n - 1)) * w - w / 2;
        const bw = w / n * (0.6 + 0.4 * Math.abs(noise1(i * 3.1, 2)));
        const o = op * (0.6 + 0.4 * (noise1(f / 50 + i, 5) * 0.5 + 0.5));
        return <path key={i} d={`M${bx},0 L${bx + bw},0 L${bx + bw * 1.6},${len} L${bx - bw * 0.4},${len}Z`} fill="url(#rayg)" opacity={o} />;
      })}
    </g>
  </g>
);

/** Film grain at about 3 % opacity (the turbulence seed changes every frame). */
export const Grain: React.FC<{f: number; amount?: number}> = ({f, amount = 0.03}) => (
  <g pointerEvents="none">
    <defs>
      <filter id={`grain${f % 8}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={(f % 8) + 1} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </defs>
    <rect width={1920} height={1080} filter={`url(#grain${f % 8})`} opacity={amount * 2.2} style={{mixBlendMode: 'overlay'}} />
  </g>
);

/** Vignette (darker corners). */
export const Vig: React.FC<{amount?: number}> = ({amount = 0.5}) => (
  <g pointerEvents="none">
    <defs>
      <radialGradient id="cvig" cx="0.5" cy="0.48" r="0.72">
        <stop offset="0.55" stopColor="#000" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={amount} />
      </radialGradient>
    </defs>
    <rect width={1920} height={1080} fill="url(#cvig)" />
  </g>
);

/** Gentle warm light leak (title plates only). */
export const LightLeak: React.FC<{f: number; t?: number}> = ({f, t = 1}) => (
  <g pointerEvents="none" style={{mixBlendMode: 'screen'}} opacity={clamp(t)}>
    <defs>
      <radialGradient id="leak">
        <stop offset="0" stopColor="#FF9A50" stopOpacity={0.5} />
        <stop offset="1" stopColor="#FF6A30" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={-100 + f * 3.2} cy={300 + Math.sin(f / 40) * 60} rx={620} ry={420} fill="url(#leak)" />
    <ellipse cx={2100 - f * 2.1} cy={760} rx={420} ry={300} fill="url(#leak)" opacity={0.6} />
  </g>
);

/** Cinematic chapter title plate over a moving scene: number, serif title, light sweep across the letters. */
export const TitlePlate: React.FC<{f: number; d: number; num?: number; title: string; sub?: string; big?: boolean}> = ({f, d, num, title, sub, big}) => {
  const tin = prog(f, 4, 26, easeOut);
  const tout = 1 - prog(f, d - 16, d);
  const sweep = -400 + prog(f, 14, 70, easeInOut) * 2700;
  const size = big ? 150 : title.length > 24 ? 92 : 108;
  const op = tin * tout;
  return (
    <g pointerEvents="none">
      <defs>
        <linearGradient id="tpband" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={0} />
          <stop offset="0.35" stopColor="#0B0B0D" stopOpacity={0.62} />
          <stop offset="0.65" stopColor="#0B0B0D" stopOpacity={0.62} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="tpsweep" gradientUnits="userSpaceOnUse" x1={sweep - 160} y1={0} x2={sweep + 160} y2={0}>
          <stop offset="0" stopColor="#F4EBD6" />
          <stop offset="0.5" stopColor="#FFFFFF" />
          <stop offset="0.52" stopColor="#FFF6D8" />
          <stop offset="1" stopColor="#F4EBD6" />
        </linearGradient>
      </defs>
      <rect y={280} width={1920} height={420} fill="url(#tpband)" opacity={op} />
      <g opacity={op} transform={`translate(960,${500 + (1 - tin) * 26}) scale(${1 + f * 0.0004})`}>
        {num !== undefined && (
          <text textAnchor="middle" y={-size * 0.95} fontFamily={FONT.sans} fontWeight={800} fontSize={32} fill={C.dustyYellow} letterSpacing={12}>
            CHAPTER {num}
          </text>
        )}
        <text textAnchor="middle" y={size * 0.32} fontFamily={FONT.serif} fontWeight={900} fontSize={size} fill="url(#tpsweep)" letterSpacing={big ? 6 : 2} transform={`translate(-960,0)`} x={960}>
          {title.toUpperCase()}
        </text>
        <path d={`M${-380 * prog(f, 10, 44)},${size * 0.62} H${380 * prog(f, 10, 44)}`} stroke={C.dustyYellow} strokeWidth={4} strokeLinecap="round" />
        {sub && (
          <text textAnchor="middle" y={size * 0.62 + 56} fontFamily={FONT.sans} fontWeight={700} fontSize={34} fill="#E6DCC4" letterSpacing={5} opacity={prog(f, 22, 40)}>
            {sub}
          </text>
        )}
      </g>
    </g>
  );
};

/** Foreground element that passes the lens in a tracking shot (grass, a post, a lamp), blurred. */
export const PassBy: React.FC<{f: number; x0: number; speed: number; y: number; kind: 'grass' | 'post' | 'branch'; s?: number}> = ({f, x0, speed, y, kind, s = 1}) => {
  const x = x0 + f * speed;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} filter="url(#dof6)">
      {kind === 'grass' && Array.from({length: 9}, (_, i) => <path key={i} d={`M${i * 22},0 Q${i * 22 + 10},-90 ${i * 22 + 26 + Math.sin(f / 12 + i) * 8},-170`} stroke="#2E3A1E" strokeWidth={12} fill="none" strokeLinecap="round" />)}
      {kind === 'post' && <rect x={-40} y={-1100} width={80} height={1200} fill="#2A1E14" />}
      {kind === 'branch' && <path d={`M0,0 Q120,-40 260,-30 M120,-36 Q170,-90 230,-110`} stroke="#1E1A12" strokeWidth={26} fill="none" strokeLinecap="round" />}
    </g>
  );
};

/** Whip-pan streaks laid over a transition (u 0..1 across the cut). */
export const WhipStreaks: React.FC<{u: number}> = ({u}) => {
  const a = Math.sin(Math.PI * clamp(u));
  return (
    <g opacity={a} pointerEvents="none">
      {Array.from({length: 18}, (_, i) => <rect key={i} x={-200 + ((i * 337 + u * 4000) % 2300)} y={(i * 61) % 1080} width={500 + (i % 5) * 120} height={10 + (i % 4) * 8} fill="#F4EBD6" opacity={0.12} />)}
    </g>
  );
};
