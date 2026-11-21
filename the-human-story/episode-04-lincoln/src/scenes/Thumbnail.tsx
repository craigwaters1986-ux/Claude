// YouTube thumbnail (1280 x 720). Main: President Lincoln (stovepipe hat, beard) at golden hour before the
// Capitol with its new dome (as drawn for 1865 in s08), the title and "1809–1865".
// Alt 'memorial': the seated statue in the Lincoln Memorial with "HIS LIFE / AND LEGACY".
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Person} from '../kit/Cast';
import {SkyGrad, TreeRow} from '../kit/Sets04';
import {Capitol} from '../kit/Sets04b';
import {Memorial, MemorialDefs} from './s10-sets';
import {stand, addPose} from '../characters/poses';
import {C, FONT} from '../styles/theme';
import {loadFonts} from '../components/Fonts';

loadFonts();
const Title: React.FC<{lines: string[]; label: string; y0?: number}> = ({lines, label, y0 = 250}) => (
  <g>
    {lines.map((t, i) => (
      <text key={i} x={70} y={y0 + i * 160} fontFamily={FONT.sans} fontWeight={900} fontSize={148} fill="#F4EBD6" stroke={C.ink} strokeWidth={15} paintOrder="stroke">{t}</text>
    ))}
    <g transform={`translate(70,${y0 + (lines.length - 1) * 160 + 70})`}>
      <rect x={0} y={0} width={label.length * 44 + 80} height={112} rx={14} fill={C.darkRed} stroke={C.ink} strokeWidth={8} />
      <text x={(label.length * 44 + 80) / 2} y={80} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={72} fill={C.dustyYellow} letterSpacing={2}>{label}</text>
    </g>
  </g>
);
const FadeL: React.FC = () => (
  <>
    <defs>
      <linearGradient id="thFadeL" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#0E1220" stopOpacity={0.9} />
        <stop offset="0.42" stopColor="#0E1220" stopOpacity={0.5} />
        <stop offset="0.66" stopColor="#0E1220" stopOpacity={0} />
      </linearGradient>
    </defs>
    <rect width={1920} height={1080} fill="url(#thFadeL)" />
  </>
);

export const Thumbnail: React.FC<{variant?: 'main' | 'memorial'}> = ({variant = 'main'}) => (
  <AbsoluteFill style={{background: '#20160F'}}>
    <svg width={1280} height={720} viewBox="0 0 1920 1080">
      {variant === 'main' ? (
        <>
          <SkyGrad time="golden" id="thsky" />
          <g opacity={0.9}>
            <TreeRow y={760} f={0} n={10} s={0.9} color="#6E7A48" seed={5} x0={-200} x1={2200} />
            <Capitol x={1050} base={800} s={0.78} dome="finished" f={0} />
          </g>
          <rect x={0} y={0} width={1920} height={1080} fill="#3A2410" opacity={0.25} />
          <rect x={-10} y={800} width={1940} height={300} fill="#5E6A3A" stroke={C.ink} strokeWidth={5} />
          <FadeL />
          <defs>
            <radialGradient id="thGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#FFD9A0" stopOpacity={0.55} />
              <stop offset="1" stopColor="#FFD9A0" stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={1500} cy={600} r={480} fill="url(#thGlow)" />
          <Person id="abePres" x={1500} y={1290} scale={2.4 / 1.15} f={10} seed={3} pose={addPose(stand(10, 3), {shR: 18, elR: 30, shL: 12, elL: 20})} look={[-0.5, 0.05]} expression="solemn" />
          <Title lines={['ABRAHAM', 'LINCOLN']} label="1809–1865" />
        </>
      ) : (
        <>
          <SkyGrad time="dusk" id="thsky2" />
          <MemorialDefs />
          <g transform="translate(-420,-620) scale(2.0)">
            <Memorial f={0} epitaphT={0} />
          </g>
          <FadeL />
          <Title lines={['HIS LIFE', 'AND', 'LEGACY']} label="LINCOLN" y0={220} />
        </>
      )}
    </svg>
  </AbsoluteFill>
);
