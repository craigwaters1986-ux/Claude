import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {W, H, FONT, C} from '../../styles/theme';

export type Panel = {title: string; at?: number; el: (f: number) => React.ReactNode};

/** A grid of full-size 1920x1080 panels scaled into one frame. */
export const Sheet: React.FC<{panels: Panel[]; cols?: number}> = ({panels, cols = 2}) => {
  const f = useCurrentFrame();
  const rows = Math.ceil(panels.length / cols);
  const pw = W / cols;
  const ph = H / rows;
  const s = Math.min(pw / W, ph / H);
  return (
    <AbsoluteFill style={{background: '#222'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {panels.map((p, i) => {
          const x = (i % cols) * pw + (pw - W * s) / 2;
          const y = Math.floor(i / cols) * ph + (ph - H * s) / 2;
          return (
            <g key={i}>
              <svg x={x + 3} y={y + 3} width={W * s - 6} height={H * s - 6} viewBox={`0 0 ${W} ${H}`} overflow="hidden">
                <rect width={W} height={H} fill="#000" />
                {p.el(f + (p.at ?? 0))}
              </svg>
              <rect x={x + 3} y={y + 3} width={Math.max(140, p.title.length * 11 + 16)} height={26} fill="rgba(0,0,0,0.7)" />
              <text x={x + 11} y={y + 22} fontFamily={FONT.sans} fontWeight={800} fontSize={17} fill={C.dustyYellow}>{p.title}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Single full-frame scene (for benchmarks). */
export const Full: React.FC<{el: (f: number) => React.ReactNode}> = ({el}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', overflow: 'hidden'}}>{el(f)}</svg>
    </AbsoluteFill>
  );
};
