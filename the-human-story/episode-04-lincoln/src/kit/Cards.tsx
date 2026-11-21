// Title card, chapter cards, end card and the caption layer for Episode 3.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT} from '../styles/theme';
import {clamp, prog, easeOut, easeBack} from '../animations/core';
import {CUES, FPS, speaking} from '../timeline';
import {Letter} from './Paper';

/** Chapter card: dark paper with the chapter number, the title and an ink rule that draws across. */
export const ChapterCard: React.FC<{f: number; d: number; num: number; title: string; date?: string}> = ({f, d, num, title, date}) => {
  const tin = prog(f, 0, 16, easeOut);
  const rule = prog(f, 6, 40);
  const out = prog(f, d - 12, d);
  const words = title.toUpperCase();
  const size = words.length > 26 ? 76 : 88;
  return (
    <g opacity={1 - out * 0.0}>
      <rect width={1920} height={1080} fill="#1E1B1A" />
      {Array.from({length: 40}, (_, i) => <circle key={i} cx={(i * 397) % 1920} cy={(i * 251) % 1080} r={2 + (i % 4)} fill="#2C2826" />)}
      <g opacity={tin} transform={`translate(960,${470 + (1 - tin) * 30})`}>
        <text textAnchor="middle" y={-110} fontFamily={FONT.sans} fontWeight={800} fontSize={34} fill={C.dustyYellow} letterSpacing={10}>
          CHAPTER {num}
        </text>
        <text textAnchor="middle" y={0} fontFamily={FONT.serif} fontWeight={900} fontSize={size} fill="#F4EBD6">
          {words}
        </text>
        <path d={`M${-420 * rule},48 H${420 * rule}`} stroke={C.dustyYellow} strokeWidth={5} strokeLinecap="round" />
        {date && (
          <text textAnchor="middle" y={118} fontFamily={FONT.sans} fontWeight={700} fontSize={36} fill="#CFC2A4" letterSpacing={4} opacity={prog(f, 18, 34)}>
            {date}
          </text>
        )}
      </g>
    </g>
  );
};

/** Series title over the letter (no signature is drawn: the real letter has none). */
export const TitleOverLetter: React.FC<{f: number; d: number}> = ({f, d}) => {
  const t = prog(f, 4, 28, easeOut);
  const sub = prog(f, 26, 50, easeOut);
  return (
    <g>
      <rect width={1920} height={1080} fill="#3C2C22" />
      <g transform={`translate(0,${-f * 0.15})`} opacity={0.55}>
        <Letter x={960} y={560} s={1.2} rot={-3} reveal={1} />
      </g>
      <rect width={1920} height={1080} fill="#1A1210" opacity={0.45} />
      <g opacity={t} transform={`translate(960,${480 + (1 - t) * 24})`}>
        <text textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={34} fill={C.dustyYellow} letterSpacing={12} y={-120}>THE HUMAN STORY</text>
        <text textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={136} fill="#F4EBD6" stroke={C.ink} strokeWidth={8} paintOrder="stroke">THE GUNPOWDER PLOT</text>
      </g>
      <text x={960} y={600} textAnchor="middle" fontFamily={FONT.sans} fontWeight={600} fontStyle="italic" fontSize={46} fill="#F4EBD6" opacity={sub} stroke={C.ink} strokeWidth={5} paintOrder="stroke">
        The Letter That Changed the Fifth of November
      </text>
      <rect width={1920} height={1080} fill="#000" opacity={prog(f, d - 10, d) * 0.6} />
    </g>
  );
};

/** End card over the surviving letter. */
export const EndCardScene: React.FC<{f: number}> = ({f}) => {
  const t = prog(f, 0, 22, easeOut);
  const b = prog(f, 18, 40, easeBack);
  const bw = 760;
  return (
    <g>
      <rect width={1920} height={1080} fill="#2A201A" />
      <g opacity={0.35}>
        <Letter x={960} y={560} s={1.1} rot={2} />
      </g>
      <g opacity={t} transform={`translate(960,${330 - (1 - t) * 30})`}>
        <text textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={110} fill="#FFFFFF" stroke={C.ink} strokeWidth={9} paintOrder="stroke" letterSpacing={5}>THE HUMAN STORY</text>
        <text y={80} textAnchor="middle" fontFamily={FONT.sans} fontWeight={600} fontStyle="italic" fontSize={48} fill="#FFF3D6" stroke={C.ink} strokeWidth={6} paintOrder="stroke">History is made by people.</text>
      </g>
      <g opacity={clamp(b * 1.4)} transform={`translate(960,560) scale(${0.7 + 0.3 * b})`}>
        <rect x={-bw / 2 + 6} y={-44 + 8} width={bw} height={88} rx={44} fill="rgba(0,0,0,0.35)" />
        <rect x={-bw / 2} y={-44} width={bw} height={88} rx={44} fill={C.red} stroke={C.ink} strokeWidth={6} />
        <text y={13} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={36} fill="#FFFFFF" letterSpacing={2}>SUBSCRIBE FOR THE NEXT STORY</text>
      </g>
    </g>
  );
};

/** Captions: bottom band (y 916-1080) shown while the narrator speaks; one or two lines per cue. */
export const CaptionLayer: React.FC = () => {
  const fr = useCurrentFrame();
  const t = fr / FPS;
  const on = speaking(t);
  // ease the band in/out over ~8 frames around each narration group
  const near = [0, 4, 8].map((k) => (speaking(t - k / FPS) ? 1 : 0) + (speaking(t + k / FPS) ? 1 : 0));
  const band = clamp((near.reduce((a, b) => a + b, 0)) / 6);
  if (band <= 0 && !on) return null;
  const cue = CUES.find((c) => t >= c.start - 0.03 && t < c.end + 0.1);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
      <g opacity={band}>
        <rect y={916} width={1920} height={164} fill="#292A29" />
        <path d="M0 916H1920" stroke="#C0A573" strokeWidth={5} />
      </g>
      {cue && (
        <text x={960} textAnchor="middle" fontFamily={FONT.sans} fontWeight={600} fontSize={45} fill="#FFF6E5">
          {cue.lines.map((line, i) => (
            <tspan key={i} x={960} y={(cue.lines.length === 1 ? 1010 : 979) + i * 55}>
              {line}
            </tspan>
          ))}
        </text>
      )}
    </svg>
  );
};
