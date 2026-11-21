// Episode 4 speech, thought, shout and telegraph bubbles.
// Accuracy rule: a real person's bubble holds only words recorded in the research notes (put the source
// key in a comment beside the bubble). Illustrative people may say short generic lines that state no fact.
// Text appears word by word (about 14 characters a second), Montserrat 700 ≥ 34 px, ≤ 2 lines of ~22 chars.
// The bubble holds (words ÷ 3 + 1) s after the last word, then pops out over 6 frames.
import React from 'react';
import {C, FONT} from '../styles/theme';
import {clamp, easeBack, easeIn} from '../animations/core';
import {wrapText} from '../components/Text';
import type {Pt} from '../characters/skeleton';

export type BubbleKind = 'speech' | 'thought' | 'shout' | 'telegraph';
const CPS = 14;
const FPS = 30;

/** Frames a bubble needs: reveal + hold. */
export const bubbleFrames = (text: string) => {
  const words = text.split(/\s+/).length;
  return Math.ceil((text.length / CPS) * FPS + (words / 3 + 1) * FPS + 6);
};

export const Bubble: React.FC<{
  kind?: BubbleKind; text: string; f: number; at: number; x: number; y: number; tail?: Pt; size?: number; maxW?: number;
}> = ({kind = 'speech', text, f, at, x, y, tail, size = 36, maxW = 470}) => {
  const g = f - at;
  const total = bubbleFrames(text);
  if (g < 0 || g > total) return null;
  const pop = easeBack(clamp(g / 8));
  const out = 1 - easeIn(clamp((g - (total - 6)) / 6));
  const sc = pop * out;
  const lines = wrapText(text, size, maxW, 700, 2);
  const shown = Math.floor(((g - 4) / FPS) * CPS);
  // reveal word by word: count characters, but only show whole words
  let budget = Math.max(0, shown);
  const vis = lines.map((ln) => {
    const ws = ln.split(' ');
    const out2: string[] = [];
    for (const w of ws) {
      if (budget >= w.length) {
        out2.push(w);
        budget -= w.length + 1;
      } else {
        budget = -1;
        break;
      }
    }
    return out2.join(' ');
  });
  const lw = Math.max(...lines.map((l) => l.length)) * size * 0.6;
  const w = Math.min(maxW, lw) + 64;
  const h = lines.length * size * 1.2 + 44;
  const font = kind === 'telegraph' ? FONT.type : FONT.sans;
  const fill = kind === 'telegraph' ? '#F2E6C4' : '#FBF5E6';
  const ink = C.ink;
  const tx = tail ? tail.x - x : 0;
  const ty = tail ? tail.y - y : h;
  let shape: React.ReactNode;
  if (kind === 'thought') {
    const bumps = 12;
    const rx = w / 2 + 6;
    const ry = h / 2 + 6;
    let d = '';
    for (let i = 0; i < bumps; i++) {
      const a0 = (i / bumps) * Math.PI * 2;
      const a1 = ((i + 1) / bumps) * Math.PI * 2;
      const p0 = [Math.cos(a0) * rx, Math.sin(a0) * ry];
      const p1 = [Math.cos(a1) * rx, Math.sin(a1) * ry];
      const am = (a0 + a1) / 2;
      const pm = [Math.cos(am) * rx * 1.18, Math.sin(am) * ry * 1.22];
      d += `${i === 0 ? 'M' + p0[0] + ',' + p0[1] : ''} Q${pm[0]},${pm[1]} ${p1[0]},${p1[1]}`;
    }
    shape = (
      <g>
        <path d={d + 'Z'} fill={fill} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
        {[0.55, 0.75, 0.9].map((k, i) => <circle key={i} cx={tx * k} cy={ry * 0.9 + (ty - ry) * k} r={12 - i * 3.5} fill={fill} stroke={ink} strokeWidth={4} />)}
      </g>
    );
  } else if (kind === 'shout') {
    const n = 18;
    const pts: string[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = i % 2 ? 1.0 : 1.22;
      pts.push(`${Math.cos(a) * (w / 2 + 10) * k},${Math.sin(a) * (h / 2 + 10) * k}`);
    }
    shape = (
      <g>
        <path d={`M${-18},${h / 2} L${tx},${ty} L${18},${h / 2}Z`} fill={fill} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
        <path d={`M${pts.join(' L')}Z`} fill={fill} stroke={ink} strokeWidth={5} strokeLinejoin="miter" />
      </g>
    );
  } else if (kind === 'telegraph') {
    shape = (
      <g>
        <path d={`M${-12},${h / 2} L${tx * 0.45 + 14},${(ty + h / 2) * 0.45} L${tx * 0.55 - 10},${(ty + h / 2) * 0.55} L${tx},${ty} L${tx * 0.5 + 18},${(ty + h / 2) * 0.5} L${tx * 0.42 - 8},${(ty + h / 2) * 0.42} L${14},${h / 2}Z`} fill={fill} stroke={ink} strokeWidth={4.5} strokeLinejoin="round" />
        <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={fill} stroke={ink} strokeWidth={5} />
        <rect x={-w / 2 + 6} y={-h / 2 + 6} width={w - 12} height={h - 12} fill="none" stroke="#8A7A5E" strokeWidth={2} />
      </g>
    );
  } else {
    // speech: rounded, tail to the mouth
    const bx = clamp(tx * 0.25, -w / 2 + 30, w / 2 - 50);
    shape = (
      <g>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2.4} fill={fill} stroke={ink} strokeWidth={5} />
        <path d={`M${bx - 4},${h / 2 - 6} Q${(bx + tx) / 2},${(h / 2 + ty) / 2} ${tx},${ty} Q${bx + 18},${h / 2 + 8} ${bx + 30},${h / 2 - 6}`} fill={fill} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
        <rect x={bx - 6} y={h / 2 - 12} width={38} height={10} fill={fill} />
      </g>
    );
  }
  return (
    <g transform={`translate(${x},${y}) scale(${sc})`}>
      {shape}
      {vis.map((ln, i) => (
        <text key={i} x={0} y={-((lines.length - 1) * size * 1.2) / 2 + i * size * 1.2 + size * 0.36} textAnchor="middle" fontFamily={font} fontWeight={kind === 'telegraph' ? 400 : 700} fontSize={size} fill={C.ink}>
          {ln}
        </text>
      ))}
    </g>
  );
};

/** Small attribution plate under a documented line (e.g. "as Douglass later recalled"). */
export const Attribution: React.FC<{text: string; x: number; y: number; t: number}> = ({text, x, y, t}) => (
  <g opacity={clamp(t)} transform={`translate(${x},${y})`}>
    <rect x={-(text.length * 6.6) - 14} y={-20} width={text.length * 13.2 + 28} height={32} rx={6} fill="rgba(20,18,16,0.72)" />
    <text x={0} y={3} textAnchor="middle" fontFamily={FONT.sans} fontWeight={600} fontStyle="italic" fontSize={20} fill="#F4EBD6">
      {text}
    </text>
  </g>
);
