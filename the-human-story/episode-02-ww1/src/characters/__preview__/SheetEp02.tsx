// Episode 2 (WW1) storyboard cast sheet: A-01 … A-06 presets + A-S1 tremble (animator verification only).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../../styles/theme';
import {StickFigure} from '../StickFigure';
import {Head} from '../Head';
import {CAST, castWith} from '../cast';
import {seatedWave, signDocument, orate, point, march, walk, hugKnees, tremble} from '../poses';
import {RifleSlung, Pen, DocumentOnTable} from '../props';
import type {Expression} from '../Head';
import type {CastMember} from '../cast';

const Fig: React.FC<{c: CastMember; x: number; y: number; f: number; pose: any; expr: Expression; dir?: 1 | -1} & Record<string, any>> = ({c, x, y, f, pose, expr, dir, ...rest}) => (
  <StickFigure x={x} y={y} f={f} seed={(x % 97) + 1} dir={dir} pose={pose} head={{...c.head, expression: expr}} outfit={c.outfit} child={c.child} label={c.label} sublabel={c.sublabel} {...rest} />
);

export const SheetEp02Cast: React.FC = () => {
  const f = useCurrentFrame();
  const gy = 900;
  const sign = signDocument(f, {seated: true});
  return (
    <AbsoluteFill style={{background: C.wallYellow}}>
      <svg width={1920} height={1080}>
        <rect y={gy} width={1920} height={180} fill={C.floor} />
        <line x1={0} y1={gy} x2={1920} y2={gy} stroke={C.ink} strokeWidth={4} />
        {/* bench stand-ins for seats */}
        <rect x={110} y={gy - 54} width={110} height={54} fill="#6B4E32" stroke={C.ink} strokeWidth={4} />
        <rect x={340} y={gy - 54} width={70} height={54} fill="#6B4E32" stroke={C.ink} strokeWidth={4} />
        <rect x={420} y={gy - 92} width={140} height={14} fill="#8A5A33" stroke={C.ink} strokeWidth={4} />
        <line x1={540} y1={gy - 80} x2={540} y2={gy} stroke={C.ink} strokeWidth={6} />
        <DocumentOnTable x={470} y={gy - 92} signed={0.6} />

        <Fig c={CAST.sophie} x={150} y={gy} f={f} pose={seatedWave(f)} expr="happy" />
        <Fig c={CAST.tsarNicholas} x={390} y={gy} f={f} pose={sign.pose} expr="solemn" overlayFront={(sk: any) => <Pen x={sk.armR.hx} y={sk.armR.hy} />} />
        <Fig c={CAST.lenin} x={740} y={gy} f={f} pose={orate(f)} expr="determined" talking />
        <Fig c={CAST.foch} x={1100} y={gy} f={f} pose={point(f, 105)} expr="determined" />
        <Fig c={CAST.indianSoldier} x={1360} y={gy} f={f} pose={march(f / 30)} expr="determined" back={<RifleSlung />} />
        <Fig c={CAST.usSoldier1918} x={1580} y={gy} f={f} pose={walk(f / 30)} expr="neutral" />
        <Fig c={CAST.britSoldier1916} x={1800} y={gy} f={f} pose={tremble(hugKnees(f), f)} expr="stare" />

        {/* head close-ups: new hats / facial hair / expression */}
        {([
          [{...CAST.indianSoldier.head}, 'determined'],
          [{...CAST.sophie.head}, 'happy'],
          [{...CAST.tsarNicholas.head}, 'solemn'],
          [{...castWith('lenin', {hat: 'flatCap', hatColor: '#2F2F33'}).head}, 'neutral'],
          [{...CAST.foch.head}, 'determined'],
          [{...CAST.usSoldier1918.head}, 'neutral'],
          [{hair: 'short', hat: 'brodie', hatColor: '#6E6A44'}, 'stare'],
        ] as [any, Expression][]).map(([h, e], i) => (
          <g key={i} transform={`translate(${170 + i * 260},${210}) scale(1.55)`}>
            <Head r={44} f={f} seed={i + 3} {...h} expression={e} turn={0.35} />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
