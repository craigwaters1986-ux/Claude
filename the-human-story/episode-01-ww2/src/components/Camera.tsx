// Camera + shot sequencing.  A Camera wraps scene content with keyframed
// pan/zoom, gentle handheld drift and optional shake.  ShotTrack plays a list
// of shots back-to-back with crossfade / wipe transitions between them.
import React from 'react';
import {useCurrentFrame, AbsoluteFill} from 'remotion';
import {W, H, C} from '../styles/theme';
import {kf, noise1, clamp, easeInOut} from '../animations/core';

export type CamKey = [number, number, number, number]; // frame, zoom, cx, cy (focus point in scene coords)

export const Camera: React.FC<{keys?: CamKey[]; drift?: number; shake?: number; children: React.ReactNode; seed?: number; f?: number}> = ({keys, drift = 1, shake = 0, children, seed = 1, f: fOverride}) => {
  const fr = useCurrentFrame();
  const f = fOverride ?? fr;
  const k = keys ?? [[0, 1, W / 2, H / 2]];
  const zoom = kf(f, k.map((x) => [x[0], x[1]] as [number, number]));
  const cx = kf(f, k.map((x) => [x[0], x[2]] as [number, number]));
  const cy = kf(f, k.map((x) => [x[0], x[3]] as [number, number]));
  const dx = noise1(f / 70, seed) * 6 * drift + noise1(f / 1.6, seed + 4) * shake;
  const dy = noise1(f / 80, seed + 2) * 4 * drift + noise1(f / 1.7, seed + 8) * shake;
  return <g transform={`translate(${W / 2 + dx},${H / 2 + dy}) scale(${zoom}) translate(${-cx},${-cy})`}>{children}</g>;
};

/** Full-frame SVG stage. */
export const Stage: React.FC<{children: React.ReactNode; bg?: string}> = ({children, bg = '#000'}) => (
  <AbsoluteFill style={{background: bg}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', overflow: 'hidden'}}>
      {children}
    </svg>
  </AbsoluteFill>
);

export type Shot = {from: number; to: number; el: React.ReactNode; trans?: 'fade' | 'cut' | 'wipe' | 'iris' | 'dip'};

/**
 * Plays shots; each shot is visible [from, to) with an 12-frame transition overlapping
 * its start.  Shot elements are built by the section with the section-local frame.
 */
export const ShotTrack: React.FC<{shots: Shot[]; overlap?: number; f?: number}> = ({shots, overlap = 12, f: fOverride}) => {
  const fr = useCurrentFrame();
  const f = fOverride ?? fr;
  return (
    <>
      {shots.map((s, i) => {
        const start = i === 0 ? -1e9 : s.from - (s.trans === 'cut' ? 0 : overlap);
        const end = s.to;
        if (f < start - 1 || f >= end + 1) return null;
        const trans = i === 0 ? 'cut' : s.trans ?? 'fade';
        const t = clamp((f - start) / Math.max(1, overlap));
        let style: React.CSSProperties = {};
        if (trans === 'fade') style = {opacity: easeInOut(t)};
        if (trans === 'dip') style = {opacity: clamp((f - s.from) / 10)};
        if (trans === 'wipe') {
          const p = easeInOut(t) * 110;
          style = {clipPath: `polygon(0 0, ${p}% 0, ${p - 10}% 100%, 0 100%)`};
        }
        if (trans === 'iris') {
          const p = easeInOut(t) * 80;
          style = {clipPath: `circle(${p}% at 50% 50%)`};
        }
        return (
          <AbsoluteFill key={i} style={style}>
            {s.el}
          </AbsoluteFill>
        );
      })}
      {shots.map((s, i) =>
        s.trans === 'dip' && f >= s.from - 12 && f < s.from + 10 ? (
          <AbsoluteFill key={'d' + i} style={{background: '#000', opacity: f < s.from ? (f - (s.from - 12)) / 12 : 1 - (f - s.from) / 10}} />
        ) : null,
      )}
    </>
  );
};

/** Ink-blot style wipe overlay (used between chapters). */
export const InkWipe: React.FC<{at: number; dur?: number; color?: string}> = ({at, dur = 20, color = C.ink}) => {
  const f = useCurrentFrame();
  const t = (f - at) / dur;
  if (t < 0 || t > 1) return null;
  const r = Math.sin(t * Math.PI) * 1300;
  return (
    <AbsoluteFill>
      <svg width={W} height={H}>
        <circle cx={W / 2} cy={H / 2} r={r} fill={color} />
      </svg>
    </AbsoluteFill>
  );
};

/**
 * T-05 split screen: 2 or 3 vertical panels inside one Stage, each clipped, with an ink divider.
 * `reveal` 0..1 opens the panels from the centre (split wipe); each panel node draws in full-frame
 * coordinates and can carry its own <Camera f=...>.
 */
export const SplitPanels: React.FC<{id: string; panels: {x0: number; x1: number; node: React.ReactNode}[]; reveal?: number; divider?: number}> = ({id, panels, reveal = 1, divider = 12}) => {
  const r = clamp(reveal);
  return (
    <g>
      <defs>
        {panels.map((p, i) => {
          const cx = (p.x0 + p.x1) / 2;
          const hw = ((p.x1 - p.x0) / 2) * r;
          return (
            <clipPath key={i} id={`${id}-p${i}`}>
              <rect x={cx - hw} y={-10} width={hw * 2} height={H + 20} />
            </clipPath>
          );
        })}
      </defs>
      {panels.map((p, i) => (
        <g key={i} clipPath={`url(#${id}-p${i})`}>
          {p.node}
        </g>
      ))}
      {panels.slice(1).map((p, i) => (
        <g key={'d' + i}>
          <rect x={p.x0 - divider / 2} y={-10} width={divider} height={H + 20} fill={C.ink} />
          <path d={`M${p.x0 - divider / 2 - 3},0 q6,${H / 4} 0,${H / 2} t0,${H / 2}`} stroke={C.ink} strokeWidth={5} fill="none" />
        </g>
      ))}
    </g>
  );
};
