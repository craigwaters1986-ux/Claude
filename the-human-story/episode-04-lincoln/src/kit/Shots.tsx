// Shot sequencing for Episode 3. A section lists shots at absolute programme times (seconds, usually
// caption anchors from T()); each shot is drawn with its own local frame f and its length d (frames).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, noise1, kf} from '../animations/core';
import {FPS} from '../timeline';

export type ShotDef = {at: number; el: (f: number, d: number) => React.ReactNode; trans?: 'fade' | 'cut' | 'dip' | 'wipe' | 'whip' | 'iris' | 'page'; bg?: string};

/** Plays shots inside a section that starts at programme time `start` (s) and ends at `end` (s). */
export const Shots: React.FC<{start: number; end: number; shots: ShotDef[]; overlap?: number}> = ({start, end, shots, overlap = 14}) => {
  const fr = useCurrentFrame();
  const fs = shots.map((s) => Math.round((s.at - start) * FPS));
  const total = Math.round((end - start) * FPS);
  return (
    <>
      {shots.map((s, i) => {
        const a = fs[i];
        const b = i + 1 < shots.length ? fs[i + 1] : total;
        const trans = i === 0 ? 'cut' : s.trans ?? 'fade';
        const pre = trans === 'fade' || trans === 'wipe' || trans === 'page' ? overlap : trans === 'whip' ? 10 : trans === 'iris' ? 18 : 0;
        const nxt = shots[i + 1];
        const nPre = nxt?.trans === 'whip' ? 10 : 0;
        // the incoming shot fades in over the outgoing one, which stays drawn until its successor's start
        if (fr < a - pre || fr >= b) return null;
        let style: React.CSSProperties = {};
        if (trans === 'fade' && fr < a) style = {opacity: easeInOut(clamp((fr - (a - pre)) / pre))};
        if (nxt && nxt.trans === 'whip' && fr >= b - nPre) {
          const u = easeInOut(clamp((fr - (b - nPre)) / nPre));
          style = {transform: `translateX(${-u * 1920}px)`, filter: `blur(${Math.sin(Math.PI * u) * 18}px)`};
        }
        if (trans === 'whip' && fr < a) {
          const u = easeInOut(clamp((fr - (a - pre)) / pre));
          style = {transform: `translateX(${(1 - u) * 1920}px)`, filter: `blur(${Math.sin(Math.PI * u) * 18}px)`};
        }
        if (trans === 'iris' && fr < a) {
          const u = easeInOut(clamp((fr - (a - pre)) / pre));
          style = {clipPath: `circle(${u * 75}% at 50% 48%)`};
        }
        if (trans === 'page' && fr < a) {
          const p = easeInOut(clamp((fr - (a - pre)) / pre)) * 120;
          style = {clipPath: `polygon(${100 - p}% 0, 100% 0, 100% 100%, ${100 - p + 18}% 100%)`, boxShadow: 'inset 30px 0 40px rgba(0,0,0,0.35)'};
        }
        if (trans === 'wipe' && fr < a) {
          const p = easeInOut(clamp((fr - (a - pre)) / pre)) * 112;
          style = {clipPath: `polygon(0 0, ${p}% 0, ${p - 12}% 100%, 0 100%)`};
        }
        return (
          <AbsoluteFill key={i} style={{...style, background: s.bg}}>
            {s.el(fr - a, b - a)}
          </AbsoluteFill>
        );
      })}
      {shots.map((s, i) => {
        if (s.trans !== 'dip') return null;
        const a = fs[i];
        if (fr < a - 10 || fr >= a + 10) return null;
        const op = fr < a ? (fr - (a - 10)) / 10 : 1 - (fr - a) / 10;
        return <AbsoluteFill key={'d' + i} style={{background: '#0B0B0D', opacity: clamp(op)}} />;
      })}
    </>
  );
};

/** Full-frame SVG for one shot. */
export const Frame: React.FC<{children: React.ReactNode; bg?: string}> = ({children, bg = '#000'}) => (
  <AbsoluteFill style={{background: bg}}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', overflow: 'hidden'}}>
      {children}
    </svg>
  </AbsoluteFill>
);

/** Camera move over a shot: zoom/focus keyframes in shot-local frames plus a gentle drift. */
export const Cam: React.FC<{f: number; keys: [number, number, number, number][]; drift?: number; seed?: number; children: React.ReactNode}> = ({f, keys, drift = 1, seed = 1, children}) => {
  const z = kf(f, keys.map((k) => [k[0], k[1]] as [number, number]));
  const cx = kf(f, keys.map((k) => [k[0], k[2]] as [number, number]));
  const cy = kf(f, keys.map((k) => [k[0], k[3]] as [number, number]));
  const dx = noise1(f / 70, seed) * 5 * drift;
  const dy = noise1(f / 85, seed + 3) * 3.5 * drift;
  return <g transform={`translate(${960 + dx},${540 + dy}) scale(${z}) translate(${-cx},${-cy})`}>{children}</g>;
};

/** Parallax layer: shifts with the shot's frame (px per frame). */
export const Par: React.FC<{f: number; vx: number; vy?: number; children: React.ReactNode}> = ({f, vx, vy = 0, children}) => <g transform={`translate(${f * vx},${f * vy})`}>{children}</g>;

/** seconds -> frames */
export const sf = (s: number) => Math.round(s * FPS);
