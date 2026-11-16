// YouTube thumbnail for ep01-ww2 ("WW2 - From Start to Finish"), Concept B: "1939 -> 1945".
// Split frame: left = muted grey-blue 1939 (a worried man reading a blank newspaper);
// right = warm 1945 (a small crowd celebrating).  Built from the shared character library;
// no flags, no symbols, no legible headline.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {StickFigure} from '../characters/StickFigure';
import {CAST} from '../characters/cast';
import type {Expression} from '../characters/Head';
import {holdFront, cheerV, waveSide, addPose} from '../characters/poses';
import type {Pose} from '../characters/poses';
import {C, FONT} from '../styles/theme';
import {boil} from '../animations/core';

export const THUMB_W = 1280;
export const THUMB_H = 720;
const ink = C.ink;
const F = 20; // fixed frame for the hand-drawn boil and pose phases
const SPLIT = 640;

const COLD = {wall: '#8C9AA8', wallDark: '#76858F', ground: '#5E6A74', groundLine: '#4C5760'};
const WARM = {wall: '#F2D9A6', wallLight: '#F7E7C2', ground: '#D9B878', groundLine: '#BF9C5C'};

const Fig: React.FC<{k: string; x: number; y: number; s: number; pose: Pose; expr: Expression; dir?: 1 | -1; seed?: number; look?: [number, number]; overlay?: React.ComponentProps<typeof StickFigure>['overlay']}> = ({k, x, y, s, pose, expr, dir = 1, seed = 1, look, overlay}) => {
  const c = CAST[k];
  return <StickFigure x={x} y={y} f={F} seed={seed} scale={s} dir={dir} pose={pose} head={{...c.head, expression: expr}} outfit={c.outfit} child={c.child} look={look} overlay={overlay} shadow />;
};

/** Blank folded newspaper: masthead and headline are solid bars, never legible text. */
const BlankPaper: React.FC<{x: number; y: number; w: number; h: number; rot?: number}> = ({x, y, w, h, rot = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#EFE8D8" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
    <line x1={0} y1={-h / 2 + 4} x2={0} y2={h / 2 - 4} stroke="#BDB5A2" strokeWidth={2} />
    <rect x={-w / 2 + 8} y={-h / 2 + 8} width={w - 16} height={h * 0.09} fill="#3A3A3A" />
    <rect x={-w / 2 + 8} y={-h / 2 + 8 + h * 0.14} width={w - 16} height={h * 0.13} fill="#6E6A62" />
    {Array.from({length: 7}).map((_, i) => (
      <g key={i}>
        <line x1={-w / 2 + 9} x2={-6} y1={-h / 2 + h * (0.42 + i * 0.075)} y2={-h / 2 + h * (0.42 + i * 0.075)} stroke="#A49C8A" strokeWidth={h * 0.035} />
        <line x1={6} x2={w / 2 - 9} y1={-h / 2 + h * (0.42 + i * 0.075)} y2={-h / 2 + h * (0.42 + i * 0.075)} stroke="#A49C8A" strokeWidth={h * 0.035} />
      </g>
    ))}
  </g>
);

/** Plain bunting: coloured pennants only (no symbols). */
const Bunting: React.FC<{x0: number; x1: number; y: number; sag: number}> = ({x0, x1, y, sag}) => {
  const n = 9;
  const cols = ['#B23A2E', '#F4EBD6', '#3F6EA6', '#E2B23C'];
  const at = (t: number) => ({x: x0 + (x1 - x0) * t, y: y + Math.sin(Math.PI * t) * sag});
  return (
    <g>
      <path d={`M${x0},${y} Q${(x0 + x1) / 2},${y + sag * 2} ${x1},${y}`} fill="none" stroke={ink} strokeWidth={3} />
      {Array.from({length: n}).map((_, i) => {
        const a = at((i + 0.25) / n);
        const b = at((i + 0.75) / n);
        const m = at((i + 0.5) / n);
        return <path key={i} d={`M${a.x},${a.y} L${b.x},${b.y} L${m.x},${m.y + 34}Z`} fill={cols[i % 4]} stroke={ink} strokeWidth={3} strokeLinejoin="round" />;
      })}
    </g>
  );
};

const Confetti: React.FC = () => {
  const cols = ['#B23A2E', '#3F6EA6', '#E2B23C', '#F4EBD6', '#6F8546'];
  return (
    <g>
      {Array.from({length: 26}).map((_, i) => {
        const x = SPLIT + 30 + ((i * 397) % 600);
        const y = 40 + ((i * 211) % 330);
        return <rect key={i} x={x} y={y} width={12} height={7} rx={1} fill={cols[i % 5]} stroke={ink} strokeWidth={1.5} transform={`rotate(${(i * 47) % 180},${x + 6},${y + 3})`} />;
      })}
    </g>
  );
};

/** Big date with thick ink outline and a hard drop shadow (Montserrat 900). */
const BigText: React.FC<{x: number; y: number; size: number; children: string}> = ({x, y, size, children}) => (
  <g fontFamily={FONT.sans} fontWeight={900} fontSize={size} textAnchor="middle" style={{letterSpacing: '-0.02em'}}>
    <text x={x + 9} y={y + 10} fill={ink} stroke={ink} strokeWidth={size * 0.16} strokeLinejoin="round">{children}</text>
    <text x={x} y={y} fill="#FFFFFF" stroke={ink} strokeWidth={size * 0.16} strokeLinejoin="round" style={{paintOrder: 'stroke'}}>{children}</text>
  </g>
);

/** Drawn arrow (the bundled Montserrat subset has no arrow glyph). */
const Arrow: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => {
  const h = w * 0.62;
  const d = `M${-w / 2},${-h * 0.2} L${w * 0.08},${-h * 0.2} L${w * 0.08},${-h / 2} L${w / 2},0 L${w * 0.08},${h / 2} L${w * 0.08},${h * 0.2} L${-w / 2},${h * 0.2}Z`;
  return (
    <g transform={`translate(${x},${y})`}>
      <path d={d} transform="translate(8,9)" fill={ink} stroke={ink} strokeWidth={14} strokeLinejoin="round" />
      <path d={d} fill="#FFFFFF" stroke={ink} strokeWidth={14} strokeLinejoin="round" style={{paintOrder: 'stroke'}} />
    </g>
  );
};

export const Thumbnail: React.FC = () => {
  const b = (k: number) => boil(F, k, 1.2);
  // 1939 reader: both hands in front, holding the paper; worried, eyes down at the paper.
  const reader = addPose(holdFront(F, 3), {shL: 34, elL: 78, shR: 38, elR: 74, headTilt: 9});
  const crowd: {k: string; x: number; y: number; s: number; dir: 1 | -1; pose: Pose; expr: Expression}[] = [
    {k: 'sailor', x: 1150, y: 690, s: 0.98, dir: -1, pose: cheerV(F, 1), expr: 'joy'},
    {k: 'woman1', x: 830, y: 700, s: 1.0, dir: 1, pose: cheerV(F, 2.4), expr: 'joy'},
    {k: 'man2', x: 1010, y: 712, s: 1.08, dir: -1, pose: cheerV(F, 4), expr: 'happy'},
    {k: 'kid1', x: 1215, y: 716, s: 1.0, dir: -1, pose: waveSide(F, 5), expr: 'joy'},
    {k: 'woman2', x: 720, y: 718, s: 1.0, dir: 1, pose: cheerV(F, 3.1), expr: 'happy'},
  ];
  return (
    <AbsoluteFill style={{background: COLD.wall}}>
      <svg width={1280} height={720} viewBox="0 0 1280 720">
        {/* ---- left: 1939, cold ---- */}
        <rect x={0} y={0} width={SPLIT} height={720} fill={COLD.wall} />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={40 + i * 150} y={-20} width={70} height={500} fill={COLD.wallDark} opacity={0.35} />)}
        <rect x={0} y={560} width={SPLIT} height={160} fill={COLD.ground} />
        <line x1={0} y1={560} x2={SPLIT} y2={560} stroke={ink} strokeWidth={5} />
        {/* ---- right: 1945, warm ---- */}
        <rect x={SPLIT} y={0} width={640} height={720} fill={WARM.wall} />
        {Array.from({length: 10}).map((_, i) => {
          const a = (-80 + i * 17) * (Math.PI / 180);
          return <path key={i} d={`M960,700 L${960 + Math.cos(a - 0.07) * 1100},${700 + Math.sin(a - 0.07) * 1100} L${960 + Math.cos(a + 0.07) * 1100},${700 + Math.sin(a + 0.07) * 1100}Z`} fill={WARM.wallLight} opacity={0.75} />;
        })}
        <rect x={SPLIT} y={560} width={640} height={160} fill={WARM.ground} />
        <line x1={SPLIT} y1={560} x2={1280} y2={560} stroke={ink} strokeWidth={5} />
        <Bunting x0={SPLIT} x1={1290} y={30} sag={28} />
        <Confetti />

        {/* the 1939 reader */}
        <Fig
          k="man1"
          x={300}
          y={712}
          s={1.25}
          seed={3}
          pose={reader}
          expr="worried"
          look={[1, 1]}
          overlay={(sk) => <BlankPaper x={(sk.armL.hx + sk.armR.hx) / 2 + 6} y={(sk.armL.hy + sk.armR.hy) / 2 + 8} w={112} h={128} rot={-4} />}
        />

        {/* the 1945 crowd */}
        {crowd.map((c, i) => <Fig key={c.k} k={c.k} x={c.x} y={c.y} s={c.s} dir={c.dir} pose={c.pose} expr={c.expr} seed={i + 10} />)}

        {/* split line */}
        <line x1={SPLIT + b(1)} y1={-10} x2={SPLIT + b(2)} y2={730} stroke={ink} strokeWidth={8} />

        {/* dates */}
        <BigText x={318} y={322} size={200}>1939</BigText>
        <BigText x={962} y={322} size={200}>1945</BigText>
        <Arrow x={SPLIT} y={250} w={120} />

        {/* channel mark */}
        <g fontFamily={FONT.sans} fontWeight={900} fontSize={21} style={{letterSpacing: '0.06em'}}>
          <rect x={18} y={18} width={262} height={38} rx={6} fill={ink} />
          <text x={153} y={45} textAnchor="middle" fill="#FFFFFF">THE HUMAN STORY</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
