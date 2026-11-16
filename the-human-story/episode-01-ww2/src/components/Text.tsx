// On-screen factual text: date cards, fact pills, stamps, big titles, captions, end card.
// Overlays live in the upper part of frame; subtitles have their own band at the bottom (y >= 900).
// Layout rules (storyboard 1.2): DateCard TL at y 120, TermCard TR at y 120, fact text >= 32-36 px,
// nothing but captions below y 900.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT, W, H} from '../styles/theme';
import {clamp, easeOut, easeIn, easeBack, prog} from '../animations/core';
import {ALL_CAPTIONS} from '../timeline/timing';

const ink = C.ink;

/** Approximate text width for layout (Montserrat bold). */
export const textW = (s: string, size: number, k = 0.62) => s.length * size * k;

// Exact width with the loaded web font (fonts are loaded via delayRender before any frame renders).
let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();
export const measureW = (s: string, size: number, weight = 800, k = 0.66, italic = false): number => {
  const key = `${weight}|${size}|${italic}|${s}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let w = textW(s, size, k);
  if (typeof document !== 'undefined') {
    if (!ctx) ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px Montserrat, Arial, sans-serif`;
      w = ctx.measureText(s).width;
    }
  }
  cache.set(key, w);
  return w;
};

/** Split text into at most `maxLines` lines no wider than maxW (greedy, then balanced for 2 lines). */
export const wrapText = (text: string, size: number, maxW: number, weight = 800, maxLines = 2): string[] => {
  if (measureW(text, size, weight) <= maxW) return [text];
  const words = text.split(' ');
  if (maxLines === 2) {
    let best: string[] = [text];
    let bestCost = 1e9;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      const cost = Math.max(measureW(a, size, weight), measureW(b, size, weight));
      if (cost < bestCost) {
        bestCost = cost;
        best = [a, b];
      }
    }
    return best;
  }
  const lines: string[] = [];
  let cur = '';
  for (const wd of words) {
    const nx = cur ? cur + ' ' + wd : wd;
    if (measureW(nx, size, weight) > maxW && cur) {
      lines.push(cur);
      cur = wd;
    } else cur = nx;
  }
  if (cur) lines.push(cur);
  return lines;
};

/**
 * Date + headline card (T-01). Appears at `at`, leaves at `until` (local frames).
 * Top-left at y = 120 by default (clear of the chapter banner at y 32-92). Long titles wrap
 * onto two lines (max width 1040 px) and shrink if still too wide; the sub-line is 32 px.
 */
export const DateCard: React.FC<{at: number; until: number; date: string; title: string; sub?: string; x?: number; y?: number; tone?: 'navy' | 'red' | 'dark' | 'paper'; align?: 'left' | 'center' | 'right'; maxW?: number}> = ({
  at, until, date, title, sub, x = 70, y = 120, tone = 'navy', align = 'left', maxW = 1040,
}) => {
  const f = useCurrentFrame();
  if (f < at - 1 || f > until + 1) return null;
  const tin = prog(f, at, at + 14, easeOut);
  const tout = prog(f, until - 12, until, easeIn);
  let titleSize = 52;
  let lines = wrapText(title, titleSize, maxW, 900);
  const widest = () => Math.max(...lines.map((l) => measureW(l, titleSize, 900)));
  while (widest() > maxW && titleSize > 38) {
    titleSize -= 2;
    lines = wrapText(title, titleSize, maxW, 900);
  }
  const subSize = 32;
  const lineH = titleSize * 1.12;
  const w = Math.max(widest(), measureW(date, 34, 800) + 2 * 34, sub ? measureW(sub, subSize, 700) : 0) + 80;
  const titleY0 = 104;
  const titleEnd = titleY0 + (lines.length - 1) * lineH;
  const h = titleEnd + (sub ? 64 : 36);
  const bg = tone === 'red' ? C.darkRed : tone === 'dark' ? '#1A1A1A' : tone === 'paper' ? '#F4EBD6' : C.navy;
  const fg = tone === 'paper' ? ink : '#FFFFFF';
  const dateCol = tone === 'paper' ? C.darkRed : C.dustyYellow;
  const x0 = align === 'center' ? W / 2 - w / 2 : align === 'right' ? W - x - w : x;
  const slide = (1 - tin) * -40 + tout * -30;
  return (
    <g transform={`translate(${x0 + (align === 'left' ? slide : 0)},${y + (align !== 'left' ? slide : 0)})`} opacity={tin * (1 - tout)}>
      <rect x={8} y={10} width={w} height={h} rx={10} fill="rgba(0,0,0,0.35)" />
      <rect width={w} height={h} rx={10} fill={bg} stroke={ink} strokeWidth={5} />
      <rect x={0} y={0} width={14} height={h} rx={4} fill={dateCol} stroke={ink} strokeWidth={4} />
      <text x={38} y={50} fontFamily={FONT.sans} fontWeight={800} fontSize={34} fill={dateCol} letterSpacing={2}>
        {date}
      </text>
      {lines.map((l, i) => (
        <text key={i} x={38} y={titleY0 + i * lineH} fontFamily={FONT.sans} fontWeight={900} fontSize={titleSize} fill={fg}>
          {l}
        </text>
      ))}
      {sub && (
        <text x={38} y={titleEnd + 46} fontFamily={FONT.sans} fontWeight={700} fontSize={subSize} fill={fg} opacity={0.92}>
          {sub}
        </text>
      )}
    </g>
  );
};

/**
 * Fact pill, e.g. "ARMY CAPPED AT 100,000 MEN". Wraps onto two lines when wider than maxW and is
 * kept inside the frame (40 px margin). `sub` adds a smaller second line (e.g. "BY SEA AND BY AIR").
 */
export const FactPill: React.FC<{at: number; until: number; text: string; x: number; y: number; icon?: string; color?: string; size?: number; anchor?: 'start' | 'middle' | 'end'; maxW?: number; sub?: string; subAt?: number}> = ({
  at, until, text, x, y, icon, color = '#F4EBD6', size = 36, anchor = 'start', maxW = 1100, sub, subAt,
}) => {
  const f = useCurrentFrame();
  if (f < at - 1 || f > until + 1) return null;
  const tin = prog(f, at, at + 12, easeBack);
  const tout = prog(f, until - 10, until, easeIn);
  const lines = wrapText(text, size, maxW, 800);
  const subSize = Math.round(size * 0.8);
  const iconW = icon ? size * 1.5 : 0;
  const tw = Math.max(...lines.map((l) => measureW(l, size, 800)), sub ? measureW(sub, subSize, 800) : 0);
  const w = tw + iconW + 60;
  const lineH = size * 1.2;
  const h = size * 1.75 + (lines.length - 1) * lineH + (sub ? subSize * 1.3 : 0);
  let x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  x0 = Math.max(40, Math.min(W - 40 - w, x0));
  const rx = lines.length > 1 || sub ? 22 : h / 2;
  const subOp = subAt === undefined ? 1 : prog(f, subAt, subAt + 12);
  return (
    <g transform={`translate(${x0 + w / 2},${y + h / 2}) scale(${0.6 + 0.4 * tin}) translate(${-w / 2},${-h / 2})`} opacity={clamp(tin * 1.5) * (1 - tout)}>
      <rect x={6} y={7} width={w} height={h} rx={rx} fill="rgba(0,0,0,0.3)" />
      <rect width={w} height={h} rx={rx} fill={color} stroke={ink} strokeWidth={4.5} />
      {icon && (
        <text x={28} y={size * 1.75 * 0.68} fontFamily={FONT.sans} fontWeight={900} fontSize={size * 1.05} fill={C.darkRed}>
          {icon}
        </text>
      )}
      {lines.map((l, i) => (
        <text key={i} x={iconW + 30} y={size * 1.75 * 0.66 + i * lineH} fontFamily={FONT.sans} fontWeight={800} fontSize={size} fill={ink}>
          {l}
        </text>
      ))}
      {sub && (
        <text x={iconW + 30} y={size * 1.75 * 0.66 + (lines.length - 1) * lineH + subSize * 1.35} fontFamily={FONT.sans} fontWeight={800} fontSize={subSize} fill={C.darkRed} opacity={subOp}>
          {sub}
        </text>
      )}
    </g>
  );
};

/**
 * T-04 stacked list pill: heading plus lines appearing one by one (camp liberations).
 * Calm: slow fades, no bounce.
 */
export const ListPill: React.FC<{at: number; until: number; heading: string; lines: string[]; x: number; y: number; stagger?: number; size?: number; anchor?: 'start' | 'end' | 'middle'; color?: string}> = ({
  at, until, heading, lines, x, y, stagger = 30, size = 34, anchor = 'end', color = '#E9E6DE',
}) => {
  const f = useCurrentFrame();
  if (f < at - 1 || f > until + 1) return null;
  const op = prog(f, at, at + 30, easeOut) * (1 - prog(f, until - 30, until, easeIn));
  const hs = size + 4;
  const tw = Math.max(measureW(heading, hs, 900), ...lines.map((l) => measureW(l, size, 800)));
  const w = tw + 70;
  const h = 40 + hs + lines.length * size * 1.45 + 24;
  const x0 = Math.max(40, Math.min(W - 40 - w, anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x));
  return (
    <g transform={`translate(${x0},${y})`} opacity={op}>
      <rect x={6} y={7} width={w} height={h} rx={14} fill="rgba(0,0,0,0.3)" />
      <rect width={w} height={h} rx={14} fill={color} stroke={ink} strokeWidth={4.5} />
      <text x={35} y={30 + hs} fontFamily={FONT.sans} fontWeight={900} fontSize={hs} fill={C.darkRed} letterSpacing={1.5}>
        {heading}
      </text>
      {lines.map((l, i) => (
        <text key={i} x={35} y={30 + hs + (i + 1) * size * 1.45} fontFamily={FONT.sans} fontWeight={800} fontSize={size} fill={ink} opacity={prog(f, at + 20 + i * stagger, at + 45 + i * stagger)}>
          {l}
        </text>
      ))}
    </g>
  );
};

/** T-04 memorial card: centred, light text on a dark translucent panel, 1 s fades, no bounce. */
export const MemorialCard: React.FC<{at: number; until: number; heading: string; lines?: {text: string; at: number}[]; y?: number; size?: number; headSize?: number}> = ({
  at, until, heading, lines = [], y = 150, size = 44, headSize = 52,
}) => {
  const f = useCurrentFrame();
  if (f < at - 1 || f > until + 1) return null;
  const op = prog(f, at, at + 30) * (1 - prog(f, until - 30, until));
  const headLines = wrapText(heading, headSize, 1500, 900);
  const lh = headSize * 1.2;
  return (
    <g opacity={op}>
      {headLines.map((l, i) => (
        <text key={i} x={W / 2} y={y + i * lh} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={headSize} fill="#F4EBD6" stroke="rgba(0,0,0,0.6)" strokeWidth={6} paintOrder="stroke" letterSpacing={2}>
          {l}
        </text>
      ))}
      {lines.map((l, i) => (
        <text key={'l' + i} x={W / 2} y={y + headLines.length * lh + 30 + i * size * 1.35} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={size} fill="#F2D9A6" stroke="rgba(0,0,0,0.6)" strokeWidth={5} paintOrder="stroke" letterSpacing={2} opacity={prog(f, l.at, l.at + 30)}>
          {l.text}
        </text>
      ))}
    </g>
  );
};

/** Rubber stamp that thumps onto the screen. */
export const Stamp: React.FC<{at: number; until?: number; text: string; x: number; y: number; rot?: number; color?: string; size?: number}> = ({at, until = 99999, text, x, y, rot = -12, color = C.red, size = 64}) => {
  const f = useCurrentFrame();
  if (f < at || f > until) return null;
  const t = prog(f, at, at + 8, easeOut);
  const sc = 2.2 - 1.2 * t;
  const w = measureW(text, size, 900, 0.7) + 3 * text.length + 50;
  const out = prog(f, until - 10, until, easeIn);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${sc})`} opacity={t * (1 - out)}>
      <rect x={-w / 2} y={-size * 0.85} width={w} height={size * 1.4} rx={8} fill="rgba(255,255,255,0.12)" stroke={color} strokeWidth={8} />
      <text x={0} y={size * 0.32} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={size} fill={color} letterSpacing={3}>
        {text}
      </text>
    </g>
  );
};

/** Large centred title text (with optional subtitle) that fades/scales in. */
export const BigTitle: React.FC<{at: number; until: number; text: string; sub?: string; y?: number; size?: number; color?: string; subColor?: string; shadow?: boolean}> = ({
  at, until, text, sub, y = H / 2, size = 120, color = '#FFFFFF', subColor = C.dustyYellow, shadow = true,
}) => {
  const f = useCurrentFrame();
  if (f < at - 1 || f > until + 1) return null;
  const tin = prog(f, at, at + 18, easeOut);
  const tout = prog(f, until - 14, until, easeIn);
  return (
    <g opacity={tin * (1 - tout)} transform={`translate(${W / 2},${y}) scale(${0.92 + 0.08 * tin})`}>
      <text x={0} y={0} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={size} fill={color} stroke={shadow ? ink : 'none'} strokeWidth={size * 0.08} paintOrder="stroke" letterSpacing={4}>
        {text}
      </text>
      {sub && (
        <text x={0} y={size * 0.85} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={size * 0.42} fill={subColor} stroke={shadow ? ink : 'none'} strokeWidth={size * 0.04} paintOrder="stroke" letterSpacing={6}>
          {sub}
        </text>
      )}
    </g>
  );
};

/** Counting number. */
export const Counter: React.FC<{at: number; dur: number; until: number; to: number; from?: number; x: number; y: number; size?: number; suffix?: string; prefix?: string; label?: string; color?: string}> = ({
  at, dur, until, to, from = 0, x, y, size = 110, suffix = '', prefix = '', label, color = '#FFFFFF',
}) => {
  const f = useCurrentFrame();
  if (f < at || f > until) return null;
  const t = prog(f, at, at + dur, easeOut);
  const v = Math.round(from + (to - from) * t);
  const op = prog(f, at, at + 8) * (1 - prog(f, until - 10, until));
  return (
    <g opacity={op}>
      <text x={x} y={y} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={size} fill={color} stroke={ink} strokeWidth={size * 0.07} paintOrder="stroke">
        {prefix}
        {v.toLocaleString('en-GB')}
        {suffix}
      </text>
      {label && (
        <text x={x} y={y + size * 0.55} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={size * 0.3} fill={C.dustyYellow} stroke={ink} strokeWidth={size * 0.03} paintOrder="stroke" letterSpacing={3}>
          {label}
        </text>
      )}
    </g>
  );
};

/** Explanation box for unfamiliar terms. Top-right at y = 120 by default (T-01). */
export const TermCard: React.FC<{at: number; until: number; term: string; meaning: string; x?: number; y?: number; width?: number}> = ({at, until, term, meaning, x = W - 70, y = 120, width = 640}) => {
  const f = useCurrentFrame();
  if (f < at - 1 || f > until + 1) return null;
  const tin = prog(f, at, at + 14, easeOut);
  const tout = prog(f, until - 12, until, easeIn);
  const lines = wrapText(meaning, 30, width - 60, 700, 4);
  let termSize = 38;
  while (measureW(term, termSize, 900) > width - 60 && termSize > 26) termSize -= 2;
  const h = 96 + lines.length * 40;
  return (
    <g transform={`translate(${x - width + (1 - tin) * 40},${y})`} opacity={tin * (1 - tout)}>
      <rect x={7} y={8} width={width} height={h} rx={10} fill="rgba(0,0,0,0.3)" />
      <rect width={width} height={h} rx={10} fill="#F4EBD6" stroke={ink} strokeWidth={5} />
      <text x={30} y={56} fontFamily={FONT.sans} fontWeight={900} fontSize={termSize} fill={C.darkRed} letterSpacing={1.5}>
        {term}
      </text>
      {lines.map((l, i) => (
        <text key={i} x={30} y={102 + i * 40} fontFamily={FONT.sans} fontWeight={700} fontSize={30} fill={ink}>
          {l}
        </text>
      ))}
    </g>
  );
};

/** Subtitles: global, driven by the narration timing; separate from fact overlays (band y >= 900). */
export const Captions: React.FC<{t: number}> = ({t}) => {
  const c = ALL_CAPTIONS.find((x) => t >= x.start - 0.05 && t <= x.end + 0.15);
  if (!c) return null;
  const size = 42;
  const best = c.text.length > 44 ? wrapText(c.text, size, 1500, 700) : [c.text];
  const lineH = 54;
  const maxW = Math.max(...best.map((l) => measureW(l, size, 700, 0.56)));
  const h = best.length * lineH + 22;
  const y0 = Math.max(900, H - 50 - h);
  return (
    <g>
      <rect x={W / 2 - maxW / 2 - 28} y={y0} width={maxW + 56} height={h} rx={12} fill="rgba(10,10,10,0.72)" />
      {best.map((l, i) => (
        <text key={i} x={W / 2} y={y0 + 50 + i * lineH} textAnchor="middle" fontFamily={FONT.sans} fontWeight={700} fontSize={size} fill="#FFFFFF">
          {l}
        </text>
      ))}
    </g>
  );
};

/** Chapter banner shown at the start of sections s02-s11 (T-06: s02 = CHAPTER 1 ... s11 = CHAPTER 10). */
export const ChapterBanner: React.FC<{num: number; title: string; at?: number; dur?: number}> = ({num, title, at = 0, dur = 75}) => {
  const f = useCurrentFrame();
  if (f < at || f > at + dur) return null;
  const tin = prog(f, at, at + 14, easeOut);
  const tout = prog(f, at + dur - 14, at + dur, easeIn);
  const text = title.toUpperCase();
  const cw = measureW(`CHAPTER ${num}`, 22, 800) + 3 * 10;
  const w = measureW(text, 30, 900) + 1.5 * text.length + cw + 100;
  return (
    <g transform={`translate(${W / 2 - w / 2},${32 - (1 - tin) * 80 - tout * 80})`}>
      <rect x={5} y={6} width={w} height={60} rx={30} fill="rgba(0,0,0,0.35)" />
      <rect width={w} height={60} rx={30} fill={C.ink} stroke={C.dustyYellow} strokeWidth={3} />
      <text x={34} y={39} fontFamily={FONT.sans} fontWeight={800} fontSize={22} fill={C.dustyYellow} letterSpacing={3}>
        CHAPTER {num}
      </text>
      <text x={34 + cw + 30} y={41} fontFamily={FONT.sans} fontWeight={900} fontSize={30} fill="#FFFFFF" letterSpacing={1.5}>
        {text}
      </text>
    </g>
  );
};

/** T-02 end card: upper centre, held to the last frame. `at` = local frame it starts. */
export const EndCard: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const t = prog(f, at, at + 24, easeOut);
  const b = prog(f, at + 30, at + 48, easeBack);
  const pulse = 1 + 0.025 * Math.sin((f - at) / 9) * prog(f, at + 60, at + 90);
  const bw = measureW('SUBSCRIBE FOR THE NEXT CHAPTER', 34, 900) + 90;
  return (
    <g>
      <g opacity={t} transform={`translate(${W / 2},${210 - (1 - t) * 30})`}>
        <text x={0} y={0} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={104} fill="#FFFFFF" stroke={ink} strokeWidth={9} paintOrder="stroke" letterSpacing={5}>
          THE HUMAN STORY
        </text>
        <text x={0} y={78} textAnchor="middle" fontFamily={FONT.sans} fontWeight={600} fontStyle="italic" fontSize={46} fill="#FFF3D6" stroke={ink} strokeWidth={6} paintOrder="stroke">
          History is made by people.
        </text>
      </g>
      <g opacity={clamp(b * 1.4)} transform={`translate(${W / 2},${400}) scale(${(0.7 + 0.3 * b) * pulse})`}>
        <rect x={-bw / 2 + 6} y={-44 + 8} width={bw} height={88} rx={44} fill="rgba(0,0,0,0.35)" />
        <rect x={-bw / 2} y={-44} width={bw} height={88} rx={44} fill={C.red} stroke={ink} strokeWidth={6} />
        <text x={0} y={13} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={34} fill="#FFFFFF" letterSpacing={2}>
          SUBSCRIBE FOR THE NEXT CHAPTER
        </text>
      </g>
    </g>
  );
};
