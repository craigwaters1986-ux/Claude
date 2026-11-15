// On-screen factual text: date cards, fact pills, stamps, big titles, captions.
// Overlays live in the upper part of frame; subtitles have their own band at the bottom.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT, W, H} from '../styles/theme';
import {clamp, easeOut, easeIn, easeBack, prog} from '../animations/core';
import {ALL_CAPTIONS} from '../timeline/timing';

const ink = C.ink;

/** Approximate text width for layout (Montserrat bold). */
export const textW = (s: string, size: number, k = 0.62) => s.length * size * k;

/**
 * Date + headline card.  Appears at `at`, leaves at `until` (local frames).
 * Sits top-left by default, clear of characters' faces and the caption band.
 */
export const DateCard: React.FC<{at: number; until: number; date: string; title: string; sub?: string; x?: number; y?: number; tone?: 'navy' | 'red' | 'dark' | 'paper'; align?: 'left' | 'center' | 'right'}> = ({
  at, until, date, title, sub, x = 70, y = 70, tone = 'navy', align = 'left',
}) => {
  const f = useCurrentFrame();
  if (f < at - 1 || f > until + 1) return null;
  const tin = prog(f, at, at + 14, easeOut);
  const tout = prog(f, until - 12, until, easeIn);
  const titleSize = 52;
  const w = Math.max(textW(title, titleSize, 0.66), textW(date, 34, 0.68), sub ? textW(sub, 27, 0.56) : 0) + 70;
  const h = sub ? 196 : 152;
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
      <text x={38} y={52} fontFamily={FONT.sans} fontWeight={800} fontSize={34} fill={dateCol} letterSpacing={2}>
        {date}
      </text>
      <text x={38} y={112} fontFamily={FONT.sans} fontWeight={900} fontSize={titleSize} fill={fg} letterSpacing={0.5}>
        {title}
      </text>
      {sub && (
        <text x={38} y={160} fontFamily={FONT.sans} fontWeight={600} fontSize={27} fill={fg} opacity={0.9}>
          {sub}
        </text>
      )}
    </g>
  );
};

/** Small fact pill, e.g. "ARMY CAPPED AT 100,000". */
export const FactPill: React.FC<{at: number; until: number; text: string; x: number; y: number; icon?: string; color?: string; size?: number; anchor?: 'start' | 'middle'}> = ({
  at, until, text, x, y, icon, color = '#F4EBD6', size = 36, anchor = 'start',
}) => {
  const f = useCurrentFrame();
  if (f < at - 1 || f > until + 1) return null;
  const tin = prog(f, at, at + 12, easeBack);
  const tout = prog(f, until - 10, until, easeIn);
  const w = textW(text, size, 0.64) + (icon ? size * 1.5 : 0) + 50;
  const h = size * 1.75;
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  return (
    <g transform={`translate(${x0 + w / 2},${y + h / 2}) scale(${0.6 + 0.4 * tin}) translate(${-w / 2},${-h / 2})`} opacity={clamp(tin * 1.5) * (1 - tout)}>
      <rect x={6} y={7} width={w} height={h} rx={h / 2} fill="rgba(0,0,0,0.3)" />
      <rect width={w} height={h} rx={h / 2} fill={color} stroke={ink} strokeWidth={4.5} />
      {icon && (
        <text x={28} y={h * 0.68} fontFamily={FONT.sans} fontWeight={900} fontSize={size * 1.05} fill={C.darkRed}>
          {icon}
        </text>
      )}
      <text x={(icon ? size * 1.5 : 0) + 25} y={h * 0.66} fontFamily={FONT.sans} fontWeight={800} fontSize={size} fill={ink}>
        {text}
      </text>
    </g>
  );
};

/** Rubber stamp that thumps onto the screen. */
export const Stamp: React.FC<{at: number; until?: number; text: string; x: number; y: number; rot?: number; color?: string; size?: number}> = ({at, until = 99999, text, x, y, rot = -12, color = C.red, size = 64}) => {
  const f = useCurrentFrame();
  if (f < at || f > until) return null;
  const t = prog(f, at, at + 8, easeOut);
  const sc = 2.2 - 1.2 * t;
  const w = textW(text, size, 0.7) + 50;
  const out = prog(f, until - 10, until, easeIn);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${sc})`} opacity={t * (1 - out)}>
      <rect x={-w / 2} y={-size * 0.85} width={w} height={size * 1.4} rx={8} fill="none" stroke={color} strokeWidth={8} />
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

/** Explanation box for unfamiliar terms. */
export const TermCard: React.FC<{at: number; until: number; term: string; meaning: string; x?: number; y?: number; width?: number}> = ({at, until, term, meaning, x = W - 70, y = 70, width = 640}) => {
  const f = useCurrentFrame();
  if (f < at - 1 || f > until + 1) return null;
  const tin = prog(f, at, at + 14, easeOut);
  const tout = prog(f, until - 12, until, easeIn);
  // wrap meaning
  const words = meaning.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const wd of words) {
    if (textW(cur + ' ' + wd, 28, 0.55) > width - 60 && cur) {
      lines.push(cur);
      cur = wd;
    } else cur = cur ? cur + ' ' + wd : wd;
  }
  if (cur) lines.push(cur);
  const h = 90 + lines.length * 38;
  return (
    <g transform={`translate(${x - width + (1 - tin) * 40},${y})`} opacity={tin * (1 - tout)}>
      <rect x={7} y={8} width={width} height={h} rx={10} fill="rgba(0,0,0,0.3)" />
      <rect width={width} height={h} rx={10} fill="#F4EBD6" stroke={ink} strokeWidth={5} />
      <text x={30} y={54} fontFamily={FONT.sans} fontWeight={900} fontSize={36} fill={C.darkRed} letterSpacing={1.5}>
        {term}
      </text>
      {lines.map((l, i) => (
        <text key={i} x={30} y={98 + i * 38} fontFamily={FONT.sans} fontWeight={600} fontSize={28} fill={ink}>
          {l}
        </text>
      ))}
    </g>
  );
};

/** Subtitles: global, driven by the narration timing; separate from fact overlays. */
export const Captions: React.FC<{t: number}> = ({t}) => {
  const c = ALL_CAPTIONS.find((x) => t >= x.start - 0.05 && t <= x.end + 0.15);
  if (!c) return null;
  // wrap into max 2 lines
  const words = c.text.split(' ');
  let best = [c.text];
  if (c.text.length > 44) {
    let bestCost = 1e9;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      const cost = Math.max(a.length, b.length);
      if (cost < bestCost) {
        bestCost = cost;
        best = [a, b];
      }
    }
  }
  const size = 42;
  const lineH = 54;
  const maxW = Math.max(...best.map((l) => textW(l, size, 0.56)));
  const h = best.length * lineH + 22;
  const y0 = H - 50 - h;
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

/** Chapter banner shown at the start of each section. */
export const ChapterBanner: React.FC<{num: number; title: string; at?: number; dur?: number}> = ({num, title, at = 0, dur = 75}) => {
  const f = useCurrentFrame();
  if (f < at || f > at + dur) return null;
  const tin = prog(f, at, at + 14, easeOut);
  const tout = prog(f, at + dur - 14, at + dur, easeIn);
  const text = title.toUpperCase();
  const w = textW(text, 30, 0.7) + textW(`CHAPTER ${num}`, 22, 0.75) + 110;
  return (
    <g transform={`translate(${W / 2 - w / 2},${32 - (1 - tin) * 80 - tout * 80})`}>
      <rect x={5} y={6} width={w} height={60} rx={30} fill="rgba(0,0,0,0.35)" />
      <rect width={w} height={60} rx={30} fill={C.ink} stroke={C.dustyYellow} strokeWidth={3} />
      <text x={34} y={39} fontFamily={FONT.sans} fontWeight={800} fontSize={22} fill={C.dustyYellow} letterSpacing={3}>
        CHAPTER {num}
      </text>
      <text x={34 + textW(`CHAPTER ${num}`, 22, 0.75) + 30} y={41} fontFamily={FONT.sans} fontWeight={900} fontSize={30} fill="#FFFFFF" letterSpacing={1.5}>
        {text}
      </text>
    </g>
  );
};
