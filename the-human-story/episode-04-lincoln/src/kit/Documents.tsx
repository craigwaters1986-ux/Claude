// Episode 4 readable documents: real, sourced text only (src/timeline/documents.json), never scribble.
// `layoutDoc` wraps a document's text with the real font metrics; `DocText` draws it with an optional
// write-on reveal (a clip that advances character by character) and `nibAt` gives the point under the
// reveal edge, so a quill can sit exactly where the ink appears. Background paper smaller than 14 px a
// line may still use the old scribble; anything readable must come from documents.json.
import React from 'react';
import docs from '../timeline/documents.json';
import {C, FONT} from '../styles/theme';
import {clamp, prog, easeOut} from '../animations/core';
import type {Pt} from '../characters/skeleton';

export type Doc = {id: string; title: string; hand: 'lincoln' | 'print' | 'carved' | 'type'; text: string; sign?: string; source: string; transcribed: boolean; sic?: string};
export const DOCS = docs as Doc[];
export const doc = (id: string): Doc => {
  const d = DOCS.find((x) => x.id === id);
  if (!d) throw new Error('unknown document ' + id);
  return d;
};

export const DOC_FONT: Record<Doc['hand'], {family: string; weight: number; k: number; color: string}> = {
  lincoln: {family: FONT.hand, weight: 400, k: 0.43, color: '#2B2018'},
  print: {family: FONT.print, weight: 400, k: 0.56, color: '#1E1A16'},
  carved: {family: FONT.serif, weight: 700, k: 0.6, color: '#3A3632'},
  type: {family: FONT.type, weight: 400, k: 0.6, color: '#1E1A16'},
};

let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();
export function measure(s: string, size: number, hand: Doc['hand']): number {
  const ft = DOC_FONT[hand];
  const key = `${hand}|${size}|${s}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let w = s.length * size * ft.k;
  if (typeof document !== 'undefined') {
    if (!ctx) ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.font = `${ft.weight} ${size}px ${ft.family}`;
      w = ctx.measureText(s).width;
    }
  }
  cache.set(key, w);
  return w;
}

export type Line = {text: string; x: number; y: number; w: number; start: number; end: number}; // start/end = char offsets
export type Layout = {lines: Line[]; chars: number; size: number; hand: Doc['hand']; height: number};

/** Wrap text (paragraphs split on blank lines / newlines) to `width`, at most `maxWords` words a line. */
export function layoutDoc(text: string, hand: Doc['hand'], size: number, width: number, x = 0, y = 0, lh = 1.32, maxWords = 99): Layout {
  const lines: Line[] = [];
  let cy = y;
  let off = 0;
  const paras = text.split(/\n/);
  for (const para of paras) {
    if (!para.trim()) {
      cy += size * lh * 0.5;
      continue;
    }
    const words = para.split(' ');
    let cur: string[] = [];
    const push = () => {
      const t = cur.join(' ');
      lines.push({text: t, x, y: cy, w: measure(t, size, hand), start: off, end: off + t.length});
      off += t.length + 1;
      cy += size * lh;
      cur = [];
    };
    for (const wd of words) {
      const nx = [...cur, wd].join(' ');
      if (cur.length && (measure(nx, size, hand) > width || cur.length >= maxWords)) push();
      cur.push(wd);
    }
    if (cur.length) push();
  }
  return {lines, chars: off, size, hand, height: cy - y};
}

/** Point under the reveal edge for progress u (0..1 of all characters): where the nib should be. */
export function nibAt(L: Layout, u: number): Pt & {line: number} {
  const c = clamp(u) * L.chars;
  let i = L.lines.findIndex((ln) => c <= ln.end);
  if (i < 0) i = L.lines.length - 1;
  const ln = L.lines[i];
  const k = clamp((c - ln.start) / Math.max(1, ln.end - ln.start));
  const sub = ln.text.slice(0, Math.round(k * ln.text.length));
  return {x: ln.x + measure(sub, L.size, L.hand), y: ln.y, line: i};
}

/** Draws a laid-out document; `reveal` 0..1 writes it on (clip per line, edge = nib). */
export const DocText: React.FC<{L: Layout; reveal?: number; id: string; opacity?: number}> = ({L, reveal = 1, id, opacity = 1}) => {
  const ft = DOC_FONT[L.hand];
  const c = clamp(reveal) * L.chars;
  return (
    <g opacity={opacity}>
      {L.lines.map((ln, i) => {
        if (c <= ln.start) return null;
        const k = clamp((c - ln.start) / Math.max(1, ln.end - ln.start));
        const sub = ln.text.slice(0, Math.round(k * ln.text.length));
        const cw = k >= 1 ? ln.w + 40 : measure(sub, L.size, L.hand);
        const cid = `${id}-l${i}`;
        return (
          <g key={i}>
            <defs>
              <clipPath id={cid}>
                <rect x={ln.x - 10} y={ln.y - L.size * 1.1} width={cw + 10} height={L.size * 1.5} />
              </clipPath>
            </defs>
            <text x={ln.x} y={ln.y} fontFamily={ft.family} fontWeight={ft.weight} fontSize={L.size} fill={ft.color} clipPath={`url(#${cid})`}>
              {ln.text}
            </text>
          </g>
        );
      })}
    </g>
  );
};

/** A sheet of period paper with a document on it, plus the source label plate (top right of the sheet). */
export const DocSheet: React.FC<{d: Doc; x: number; y: number; w: number; h: number; size: number; reveal?: number; rot?: number; label?: boolean; f?: number; pad?: number; maxWords?: number; sign?: boolean}> = ({
  d, x, y, w, h, size, reveal = 1, rot = 0, label = true, f = 0, pad = 56, maxWords = 8, sign = false,
}) => {
  const L = layoutDoc(d.text, d.hand, size, w - pad * 2, pad, pad + size, 1.3, maxWords);
  const tlab = prog(f, 6, 22, easeOut);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <rect x={8} y={10} width={w} height={h} fill="rgba(0,0,0,0.25)" />
      <rect width={w} height={h} fill="#EFE2C2" stroke={C.ink} strokeWidth={4} />
      <rect width={w} height={h} fill="url(#paperTone)" opacity={0.0} />
      {[0.33, 0.66].map((k) => <line key={k} x1={0} y1={h * k} x2={w} y2={h * k} stroke="#D2C29C" strokeWidth={2} />)}
      <DocText L={L} reveal={reveal} id={`doc-${d.id}`} />
      {sign && d.sign && reveal >= 1 && (
        <g>
          {d.sign.split('\n').map((s, i) => (
            <text key={i} x={w - pad} y={L.height + pad + size * (1.6 + i * 1.2)} textAnchor="end" fontFamily={DOC_FONT[d.hand].family} fontSize={size} fill={DOC_FONT[d.hand].color}>
              {s}
            </text>
          ))}
        </g>
      )}
      {label && (
        <g opacity={tlab}>
          <rect x={w - Math.min(w - 20, d.title.length * 11.5 + 30) - 10} y={-46} width={Math.min(w - 20, d.title.length * 11.5 + 30)} height={36} rx={6} fill="rgba(20,18,16,0.82)" />
          <text x={w - 25} y={-21} textAnchor="end" fontFamily={FONT.sans} fontWeight={700} fontSize={20} fill="#F4EBD6">
            {d.title}
          </text>
        </g>
      )}
    </g>
  );
};

/** Labelled summary panel for anything that cannot be transcribed exactly. */
export const SummaryPanel: React.FC<{title: string; lines: string[]; x: number; y: number; w: number; t: number}> = ({title, lines, x, y, w, t}) => (
  <g opacity={clamp(t)} transform={`translate(${x},${y})`}>
    <rect width={w} height={70 + lines.length * 44} rx={10} fill="#22324A" stroke={C.ink} strokeWidth={4} />
    <text x={24} y={44} fontFamily={FONT.sans} fontWeight={800} fontSize={26} fill="#E3C77A" letterSpacing={2}>
      {title.toUpperCase()} · SUMMARISED
    </text>
    {lines.map((l, i) => (
      <text key={i} x={24} y={92 + i * 44} fontFamily={FONT.sans} fontWeight={600} fontSize={30} fill="#F4EBD6">
        {l}
      </text>
    ))}
  </g>
);
