// Episode 3 papers: the anonymous letter, the Commons Journal, the proclamation, examiners' sheets and the
// thanksgiving Act.  Handwriting is drawn as illegible procedural "secretary hand" scribble, so nothing is
// put in anyone's mouth: only words quoted in the narration are ever set in readable type (QuoteType).
import React from 'react';
import {C, FONT} from '../styles/theme';
import {hash, clamp} from '../animations/core';

export const PAPER = '#EFE2C2';
export const PAPER_DARK = '#D9C69C';
export const INK_BROWN = '#4A3524';

/** One line of illegible handwriting as an SVG path (x0..x0+w at baseline y). */
export function scribble(x0: number, y: number, w: number, seed: number, size = 14): string {
  let x = x0;
  let d = `M${x},${y}`;
  let k = 0;
  while (x < x0 + w - size) {
    const word = 3 + Math.floor(hash(seed * 31 + k) * 6);
    d += ` M${x},${y}`;
    for (let i = 0; i < word && x < x0 + w - size * 0.6; i++) {
      const r = hash(seed * 97 + k * 13 + i);
      const h = size * (r > 0.86 ? 1.5 : r < 0.12 ? -0.9 : 0.55 + r * 0.4);
      const step = size * (0.45 + hash(seed + k * 7 + i * 3) * 0.35);
      d += ` q${step * 0.25},${-h} ${step * 0.5},${-h * 0.15} q${step * 0.2},${h * 0.5} ${step * 0.5},${h * 0.15}`;
      x += step;
    }
    x += size * (0.5 + hash(seed * 3 + k) * 0.5);
    k++;
  }
  return d;
}

/** Block of handwriting lines; `reveal` 0..1 writes the lines in order (stroke-dash on each line). */
export const Hand: React.FC<{x: number; y: number; w: number; lines: number; gap?: number; size?: number; seed?: number; reveal?: number; color?: string; width?: number; indent?: number; lastShort?: boolean}> = ({
  x, y, w, lines, gap = 34, size = 14, seed = 1, reveal = 1, color = INK_BROWN, width = 2.4, indent = 0, lastShort = true,
}) => (
  <g fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
    {Array.from({length: lines}, (_, i) => {
      const lw = (i === 0 ? w - indent : w) * (lastShort && i === lines - 1 ? 0.45 : 0.9 + hash(seed + i) * 0.1);
      const t = clamp(reveal * lines - i);
      if (t <= 0) return null;
      const L = lw * 3.2;
      return <path key={i} d={scribble(x + (i === 0 ? indent : 0), y + i * gap, lw, seed * 50 + i, size)} strokeDasharray={`${L} ${L}`} strokeDashoffset={L * (1 - t)} />;
    })}
  </g>
);

/** Aged sheet with fold creases and a soft shadow; children draw in sheet coordinates (0,0 top-left). */
export const Sheet: React.FC<{x: number; y: number; w: number; h: number; rot?: number; folds?: 'letter' | 'none'; fold?: number; color?: string; children?: React.ReactNode; shadow?: boolean}> = ({
  x, y, w, h, rot = 0, folds = 'letter', fold = 0, color = PAPER, children, shadow = true,
}) => {
  // fold 0 = flat, 1 = folded shut (the sheet squashes about its middle crease)
  const sy = 1 - 0.5 * clamp(fold);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(1,${sy}) translate(${-w / 2},${-h / 2})`}>
      {shadow && <rect x={10} y={14} width={w} height={h} rx={4} fill="rgba(0,0,0,0.22)" />}
      <rect width={w} height={h} rx={4} fill={color} stroke={C.ink} strokeWidth={4} />
      <rect x={6} y={6} width={w - 12} height={h - 12} rx={2} fill="none" stroke={PAPER_DARK} strokeWidth={6} opacity={0.5} />
      {folds === 'letter' && (
        <g stroke={PAPER_DARK} strokeWidth={3} opacity={0.9}>
          <line x1={0} y1={h / 3} x2={w} y2={h / 3} />
          <line x1={0} y1={(h * 2) / 3} x2={w} y2={(h * 2) / 3} />
          <line x1={w / 2} y1={0} x2={w / 2} y2={h} opacity={0.6} />
        </g>
      )}
      {children}
    </g>
  );
};

/** The Monteagle letter: unsigned, undated. `reveal` writes the hand; `glow` warms the paper. */
export const Letter: React.FC<{x: number; y: number; s?: number; rot?: number; reveal?: number; fold?: number; seed?: number; question?: number}> = ({x, y, s = 1, rot = 0, reveal = 1, fold = 0, seed = 5, question = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <Sheet x={0} y={0} w={520} h={680} rot={rot} fold={fold}>
      <Hand x={48} y={92} w={430} lines={15} gap={34} size={13} seed={seed} reveal={reveal} indent={60} />
      {/* no signature, no date: the space at the foot of the page stays empty */}
      {question > 0 && (
        <text x={360} y={640} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={110} fill={C.red} opacity={clamp(question)} transform={`rotate(${-6 + 6 * (1 - clamp(question))} 360 600)`}>
          ?
        </text>
      )}
    </Sheet>
  </g>
);

/** Large readable type for words the narration quotes from a document, e.g. “a terrible blow”. */
export const QuoteType: React.FC<{x: number; y: number; text: string; t: number; size?: number; color?: string; sub?: string}> = ({x, y, text, t, size = 96, color = '#FFF5DD', sub}) => {
  if (t <= 0) return null;
  return (
    <g opacity={clamp(t * 1.5)} transform={`translate(${x},${y + (1 - clamp(t)) * 20})`}>
      <text textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={size} fill={color} stroke={C.ink} strokeWidth={10} paintOrder="stroke" fontStyle="italic">
        {text}
      </text>
      {sub && (
        <text y={size * 0.62} textAnchor="middle" fontFamily={FONT.sans} fontWeight={700} fontSize={28} fill="#FFF5DD" stroke={C.ink} strokeWidth={6} paintOrder="stroke" letterSpacing={2}>
          {sub}
        </text>
      )}
    </g>
  );
};

/** The open manuscript Commons Journal with a margin. `note` 0..1 writes the clerk's marginal note;
 *  `transcript` shows the readable transcription panel of the note (historical spelling). */
export const Journal: React.FC<{x: number; y: number; s?: number; note?: number; seed?: number}> = ({x, y, s = 1, note = 0, seed = 11}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-640,-380 Q-320,-410 0,-370 Q320,-410 640,-380 L650,400 Q320,370 0,410 Q-320,370 -650,400Z" fill="rgba(0,0,0,0.25)" transform="translate(14,18)" />
    <path d="M-640,-380 Q-320,-410 0,-370 L0,410 Q-320,370 -650,400Z" fill={PAPER} stroke={C.ink} strokeWidth={5} />
    <path d="M0,-370 Q320,-410 640,-380 L650,400 Q320,370 0,410Z" fill="#F2E7CB" stroke={C.ink} strokeWidth={5} />
    <path d="M0,-370 L0,410" stroke={PAPER_DARK} strokeWidth={10} />
    <Hand x={-560} y={-300} w={500} lines={18} gap={36} size={12} seed={seed} />
    {/* right page: main column, ruled margin on the left of the page */}
    <line x1={190} y1={-340} x2={190} y2={370} stroke="#B9A47A" strokeWidth={3} />
    <Hand x={215} y={-300} w={380} lines={18} gap={36} size={12} seed={seed + 3} />
    <Hand x={40} y={-210} w={130} lines={9} gap={30} size={10} seed={seed + 9} reveal={note} color="#2B1E14" width={2.2} lastShort={false} />
  </g>
);

/** A royal proclamation broadside: heading in large type, then print-like rows. */
export const Proclamation: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s}) rotate(${rot})`}>
    <Sheet x={0} y={0} w={300} h={400} folds="none" color="#F1E6CB">
      <text x={150} y={58} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={34} fill={C.ink}>BY THE KING</text>
      <path d="M60,76 H240" stroke={C.ink} strokeWidth={3} />
      {Array.from({length: 11}, (_, i) => <rect key={i} x={36} y={100 + i * 24} width={228 - (i === 10 ? 120 : (i * 37) % 20)} height={8} rx={2} fill="#6B5B48" opacity={0.75} />)}
    </Sheet>
  </g>
);

/** A printed page of the Act / service book, read aloud to the congregation. */
export const PrintedPage: React.FC<{x: number; y: number; s?: number; rot?: number; heading?: string; reveal?: number}> = ({x, y, s = 1, rot = 0, heading, reveal = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s}) rotate(${rot})`}>
    <Sheet x={0} y={0} w={460} h={600} folds="none" color="#F3E9D0">
      <rect x={40} y={40} width={380} height={520} fill="none" stroke={C.ink} strokeWidth={3} />
      {heading && (
        <text x={230} y={100} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={Math.min(30, 560 / heading.length)} fill={C.ink}>
          {heading}
        </text>
      )}
      <path d="M120,124 H340" stroke={C.ink} strokeWidth={3} />
      {Array.from({length: 15}, (_, i) => (
        <rect key={i} x={66} y={152 + i * 26} width={(328 - (i === 14 ? 170 : (i * 29) % 26)) * clamp(reveal * 15 - i)} height={9} rx={2} fill="#5E5040" opacity={0.75} />
      ))}
    </Sheet>
  </g>
);

/** Examiners' sheets accumulating on a desk: `n` (fractional) sheets shown, each landing with a small drop. */
export const SheetStack: React.FC<{x: number; y: number; n: number; s?: number}> = ({x, y, n, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {Array.from({length: Math.ceil(n)}, (_, i) => {
      const t = clamp(n - i);
      const r = (hash(i * 3.1) - 0.5) * 14;
      return (
        <g key={i} opacity={clamp(t * 2)} transform={`translate(${(hash(i) - 0.5) * 40},${-i * 5 - (1 - t) * 60}) rotate(${r})`}>
          <Sheet x={0} y={0} w={260} h={330} folds="none" color={i % 2 ? '#EFE3C6' : '#F3E8CF'} shadow={i === 0}>
            <Hand x={26} y={46} w={210} lines={8} gap={32} size={10} seed={40 + i} width={2} />
          </Sheet>
        </g>
      );
    })}
  </g>
);

/** A hand (cuff + fingers) for close-ups on paper; `dir` mirrors it. */
export const PaperHand: React.FC<{x: number; y: number; rot?: number; s?: number; cuff?: string; dir?: 1 | -1}> = ({x, y, rot = 0, s = 1, cuff = '#4B3A50', dir = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s * dir},${s})`}>
    <rect x={-230} y={-38} width={150} height={76} rx={10} fill={cuff} stroke={C.ink} strokeWidth={6} />
    <rect x={-92} y={-44} width={26} height={88} rx={8} fill="#F7F3EA" stroke={C.ink} strokeWidth={5} />
    <path d="M-70,-34 Q-10,-46 40,-30 Q70,-22 92,-8 Q100,2 88,8 Q60,6 40,2 Q60,16 66,26 Q62,36 48,32 Q20,26 -10,30 Q-50,40 -70,34Z" fill="#FFFFFF" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M30,-6 Q52,-2 62,4 M20,12 Q40,14 54,22" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
  </g>
);

/** Candle-lit desk surface used under paper close-ups. */
export const Desk: React.FC<{tone?: 'warm' | 'cool'}> = ({tone = 'warm'}) => (
  <g>
    <rect width={1920} height={1080} fill={tone === 'warm' ? '#5B4030' : '#3C3F44'} />
    {Array.from({length: 9}, (_, i) => (
      <path key={i} d={`M0,${80 + i * 120} C600,${60 + i * 120 + (i % 2) * 30} 1300,${110 + i * 120} 1920,${84 + i * 120}`} stroke={tone === 'warm' ? '#4C3426' : '#33363B'} strokeWidth={5} fill="none" />
    ))}
  </g>
);
