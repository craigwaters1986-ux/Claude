// Scene-assembly kit for Episode 1 (video-editor): small helpers shared by S01-S11.
// Only composition helpers and simple scene props live here; characters, places, vehicles and
// maps come from the animator's and environment designer's libraries.
import React from 'react';
import {C, W, H, FONT, FPS} from '../styles/theme';
import {Stage, Camera, CamKey} from '../components/Camera';
import {Vignette, SombreGrade} from '../components/Effects';
import {StickFigure, FigureProps} from '../characters/StickFigure';
import {CAST} from '../characters/cast';
import {stand, walk} from '../characters/poses';
import type {Expression} from '../characters/Head';
import {beats} from '../timeline/timing';
import {clamp, prog, easeInOut} from '../animations/core';

const ink = C.ink;

/** Beat helpers for a section: `b` = beats(), cut(k) = midpoint of the gap before sentence k,
 *  mid(k, fr) = a fraction through sentence k, abs(t) = local frame of an absolute time (s). */
export function sec(id: string) {
  const b = beats(id);
  const cut = (k: number) => (k <= 0 ? 0 : Math.round((b.endOf(k - 1) + b.at(k)) / 2));
  const mid = (k: number, fr: number) => Math.round(b.at(k) + fr * (b.endOf(k) - b.at(k)));
  const abs = (t: number) => Math.round((t - b.section.start) * FPS);
  return {b, cut, mid, abs};
}

/** Cast figure shorthand. `tag` shows the preset's name tag (historical figures only). */
export const Fig: React.FC<{k: string; x: number; y: number; f: number; expr?: Expression; s?: number; tag?: boolean} & Partial<FigureProps>> = ({k, x, y, f, expr, s = 1, tag = false, pose, seed, ...rest}) => {
  const c = CAST[k];
  return (
    <StickFigure
      x={x}
      y={y}
      f={f}
      seed={seed ?? Math.round(Math.abs(x * 7 + y)) % 97}
      scale={s}
      pose={pose ?? stand(f, Math.round(x) % 13)}
      head={{...c.head, expression: expr ?? c.head.expression ?? 'neutral'}}
      outfit={c.outfit}
      child={c.child}
      label={tag ? c.label : undefined}
      sublabel={tag ? c.sublabel : undefined}
      {...rest}
    />
  );
};

/** A figure walking at constant speed (px/frame; negative = leftwards). */
export const Walker: React.FC<{k: string; f: number; x0: number; speed: number; y: number; s?: number; expr?: Expression; amp?: number; stride?: number} & Partial<FigureProps>> = ({k, f, x0, speed, y, s = 1, expr, amp = 1, stride = 150, ...rest}) => {
  const dist = f * speed;
  return <Fig k={k} x={x0 + dist} y={y} f={f} s={s} dir={speed >= 0 ? 1 : -1} expr={expr} pose={walk(Math.abs(dist) / (stride * s), amp)} {...rest} />;
};

/** One shot: full-frame Stage with a Camera (drift >= 1 always), screen-space overlay, vignette, optional sombre grade. */
export const Shot: React.FC<{f: number; bg?: string; keys?: CamKey[]; drift?: number; shake?: number; over?: React.ReactNode; vignette?: number; sombre?: number; children: React.ReactNode; seed?: number}> = ({
  f, bg = '#000', keys, drift = 1, shake = 0, over, vignette = 0.35, sombre = 0, children, seed = 1,
}) => (
  <Stage bg={bg}>
    <Camera f={f} keys={keys} drift={drift} shake={shake} seed={seed}>
      {children}
    </Camera>
    {over}
    {vignette > 0 && <Vignette strength={vignette} />}
    {sombre > 0 && <SombreGrade amount={sombre} />}
  </Stage>
);

/** Camera keys helper: [[frame, zoom, cx, cy], ...] with cx/cy defaulting to the centre. */
export const ck = (...k: [number, number, number?, number?][]): CamKey[] => k.map(([a, z, x, y]) => [a, z, x ?? W / 2, y ?? H / 2]);

// ---------------------------------------------------------------- chalk line-art (history room board)
/** Chalk stroke revealed along its length (reveal 0..1). */
export const ChalkPath: React.FC<{d: string; reveal: number; w?: number; color?: string; dash?: boolean}> = ({d, reveal, w = 7, color = '#F4F1E8', dash}) =>
  reveal <= 0 ? null : (
    <path d={d} pathLength={1} strokeDasharray={dash ? undefined : `${clamp(reveal)} 1`} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
  );

/** Chalk box with a label. */
export const ChalkBox: React.FC<{x: number; y: number; w: number; h: number; text: string; reveal: number; size?: number}> = ({x, y, w, h, text, reveal, size = 34}) => (
  <g opacity={clamp(reveal * 3)}>
    <ChalkPath d={`M${x},${y} h${w} v${h} h${-w} Z`} reveal={reveal} w={5} />
    <text x={x + w / 2} y={y + h / 2 + size * 0.36} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={size} fill="#F4F1E8" opacity={clamp(reveal * 2 - 0.6)}>
      {text}
    </text>
  </g>
);

/** Chalk eraser smudge (wiping a word off the board). */
export const ChalkSmudge: React.FC<{x: number; y: number; w: number; t: number}> = ({x, y, w, t}) =>
  t <= 0 ? null : <rect x={x - w / 2} y={y - 70} width={w * clamp(t)} height={100} fill={C.board} opacity={0.97} rx={20} />;

// ---------------------------------------------------------------- simple scene props (composed here, no new library assets)
/** Simple waving tricolour (horizontal or vertical stripes) — used where the Flag library has no kind
 *  (Weimar black-red-gold, Italy, Czechoslovakia, Republic of China via `roc`). */
export const SimpleFlag: React.FC<{x: number; y: number; f: number; colors?: string[]; vertical?: boolean; roc?: boolean; w?: number; h?: number; pole?: number; seed?: number}> = ({
  x, y, f, colors = ['#151515', '#C8302A', '#E8B830'], vertical = false, roc = false, w = 150, h = 95, pole = 260, seed = 1,
}) => {
  const id = `sflag-${seed}-${colors.join('').replace(/#/g, '')}${roc ? 'r' : ''}`;
  const top = y - pole;
  const N = 10;
  const wv = (i: number) => Math.sin(f / 7 + i * 0.9 + seed) * 6 * (i / N);
  const pts = Array.from({length: N + 1}, (_, i) => [x + (w * i) / N, top + wv(i)]);
  const d = `M${pts.map((p) => p.join(',')).join(' L')} L${pts
    .slice()
    .reverse()
    .map((p) => `${p[0]},${p[1] + h}`)
    .join(' L')} Z`;
  return (
    <g>
      <rect x={x - 5} y={top - 10} width={8} height={pole + 10} fill="#5A4A3A" stroke={ink} strokeWidth={2.5} />
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {roc ? (
          <g>
            <rect x={x} y={top - 20} width={w + 10} height={h + 40} fill="#C8302A" />
            <rect x={x} y={top - 20} width={w / 2} height={h / 2 + 20} fill="#1F3A8A" />
            <circle cx={x + w / 4} cy={top + h / 4 - 2} r={h / 9} fill="#fff" />
          </g>
        ) : (
          colors.map((c, i) =>
            vertical ? (
              <rect key={i} x={x + (w / colors.length) * i} y={top - 20} width={w / colors.length + 1} height={h + 40} fill={c} />
            ) : (
              <rect key={i} x={x - 5} y={top - 10 + ((h + 20) / colors.length) * i} width={w + 15} height={(h + 20) / colors.length + 1} fill={c} />
            ),
          )
        )}
      </g>
      <path d={d} fill="none" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
};

/** Plain dark-red vertical banner, no emblem (storyboard 1.6), gently swaying. */
export const PlainBanner: React.FC<{x: number; y: number; f: number; w?: number; h?: number; color?: string; seed?: number}> = ({x, y, f, w = 130, h = 420, color = '#7A1F1A', seed = 1}) => {
  const sw = Math.sin(f / 30 + seed) * 6;
  return (
    <g>
      <rect x={x - 12} y={y - 8} width={w + 24} height={12} rx={4} fill="#4A3A2A" stroke={ink} strokeWidth={3} />
      <path d={`M${x},${y} L${x + w},${y} L${x + w + sw},${y + h} L${x + w / 2 + sw},${y + h - 40} L${x + sw},${y + h} Z`} fill={color} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
};

/** BBC-style ribbon microphone on a stand. */
export const Microphone: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-4} y={0} width={8} height={120} fill="#3A3A3A" stroke={ink} strokeWidth={2} />
    <ellipse cx={0} cy={124} rx={34} ry={8} fill="#3A3A3A" stroke={ink} strokeWidth={3} />
    <rect x={-22} y={-58} width={44} height={60} rx={14} fill="#8A8C8E" stroke={ink} strokeWidth={4} />
    {[0, 1, 2, 3].map((i) => (
      <line key={i} x1={-14} y1={-46 + i * 12} x2={14} y2={-46 + i * 12} stroke={ink} strokeWidth={2} />
    ))}
  </g>
);

/** Hand cart with sacks or bundles; wheels turn with distance. */
export const HandCart: React.FC<{x: number; y: number; dist: number; s?: number; label?: string; load?: string; dir?: 1 | -1}> = ({x, y, dist, s = 1, label, load = '#B8A47A', dir = 1}) => {
  const rot = (dist / 30) * (180 / Math.PI);
  return (
    <g transform={`translate(${x},${y}) scale(${s * dir},${s})`}>
      {[-60, -20, 20, 55].map((cx, i) => (
        <ellipse key={i} cx={cx} cy={-88 - (i % 2) * 10} rx={34} ry={26} fill={load} stroke={ink} strokeWidth={4} />
      ))}
      <rect x={-95} y={-70} width={190} height={40} fill="#7A5A3A" stroke={ink} strokeWidth={4} />
      <line x1={95} y1={-55} x2={170} y2={-70} stroke={ink} strokeWidth={6} strokeLinecap="round" />
      {label && (
        <g transform={`scale(${dir},1)`}>
          <rect x={-80} y={-66} width={160} height={30} fill="#F4EBD6" stroke={ink} strokeWidth={2.5} />
          <text x={0} y={-44} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={20} fill={ink}>
            {label}
          </text>
        </g>
      )}
      {[-50, 50].map((cx) => (
        <g key={cx} transform={`translate(${cx},-28) rotate(${rot})`}>
          <circle r={28} fill="#5A4A3A" stroke={ink} strokeWidth={4} />
          <line x1={-26} y1={0} x2={26} y2={0} stroke={ink} strokeWidth={3} />
          <line x1={0} y1={-26} x2={0} y2={26} stroke={ink} strokeWidth={3} />
        </g>
      ))}
    </g>
  );
};

/** Triangle-flag bunting string between two points. */
export const Bunting: React.FC<{x0: number; x1: number; y: number; sag?: number; f: number; seed?: number}> = ({x0, x1, y, sag = 60, f, seed = 1}) => {
  const n = Math.round((x1 - x0) / 55);
  const cols = ['#B23A2E', '#F4EBD6', '#3F6EA6'];
  const yAt = (t: number) => y + sag * 4 * t * (1 - t);
  return (
    <g>
      <path d={`M${x0},${y} Q${(x0 + x1) / 2},${y + sag * 2} ${x1},${y}`} stroke={ink} strokeWidth={3} fill="none" />
      {Array.from({length: n}).map((_, i) => {
        const t = (i + 0.5) / n;
        const x = x0 + (x1 - x0) * t;
        const yy = yAt(t);
        const sw = Math.sin(f / 9 + i + seed) * 5;
        return <path key={i} d={`M${x - 18},${yy} L${x + 18},${yy} L${x + sw},${yy + 40} Z`} fill={cols[(i + seed) % 3]} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />;
      })}
    </g>
  );
};

/** Park bench. */
export const Bench: React.FC<{x: number; y: number; w?: number}> = ({x, y, w = 170}) => (
  <g>
    <rect x={x - w / 2} y={y - 55} width={w} height={14} fill={C.brown} stroke={ink} strokeWidth={3.5} />
    <rect x={x - w / 2} y={y - 100} width={w} height={12} fill={C.brown} stroke={ink} strokeWidth={3.5} />
    <rect x={x - w / 2 + 10} y={y - 41} width={10} height={41} fill={ink} />
    <rect x={x + w / 2 - 20} y={y - 41} width={10} height={41} fill={ink} />
  </g>
);

/** Ink-outlined shell crater (WWI ground). */
export const Crater: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => (
  <g>
    <ellipse cx={x} cy={y} rx={w / 2} ry={w / 9} fill="#5E4A36" stroke={ink} strokeWidth={4} />
    <ellipse cx={x} cy={y - 4} rx={w / 2.6} ry={w / 14} fill="#7A6248" opacity={0.7} />
  </g>
);

/** Fade in/out helper for in-shot elements. */
export const fio = (f: number, a: number, b: number, d = 12) => Math.min(prog(f, a, a + d, easeInOut), 1 - prog(f, b - d, b, easeInOut));
