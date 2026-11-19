// YouTube thumbnail (1280 x 720): a lantern-lit Guy Fawkes before the old Palace of Westminster at night, the title and the date.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Person} from '../kit/Cast';
import {OldPalace, Sky, River} from '../kit/Places';
import {Lantern} from './sets';
import {standStiff, addPose} from '../characters/poses';
import {C, FONT} from '../styles/theme';
import {loadFonts} from '../components/Fonts';

loadFonts();
export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{background: '#20160F'}}>
    <svg width={1280} height={720} viewBox="0 0 1920 1080">
      <defs>
      </defs>
      <Sky time="night" id="thumb" f={20} />
      <g transform="translate(330,70) scale(0.88)">
        <OldPalace f={0} time="grey" lit={1} />
      </g>
      <rect x={0} y={0} width={1920} height={760} fill="#1C2746" opacity={0.42} />
      <River y0={755} y1={930} f={30} night />
      <rect x={0} y={900} width={1920} height={180} fill="#3A3842" stroke="#1A1820" strokeWidth={6} />
      {Array.from({length: 12}, (_, i) => <path key={i} d={`M${i * 170 + 20},${930 + (i % 3) * 40} q20 -6 40 0`} stroke="#2A2830" strokeWidth={4} fill="none" />)}
      <defs>
        <linearGradient id="fadeL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0E1220" stopOpacity={0.92} />
          <stop offset="0.45" stopColor="#0E1220" stopOpacity={0.55} />
          <stop offset="0.7" stopColor="#0E1220" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect width={1920} height={1080} fill="url(#fadeL)" />
      <defs>
        <radialGradient id="lamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFD27A" stopOpacity={0.5} />
          <stop offset="1" stopColor="#FFD27A" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={1560} cy={730} r={420} fill="url(#lamp)" />
      <Person id="fawkes" x={1390} y={1290} scale={3.1} f={12} seed={4} pose={addPose(standStiff(12, 4), {shR: 80, elR: 40})} holdR={<Lantern f={12} />} look={[0.7, 0]} expression="worried" />
      <text x={70} y={240} fontFamily={FONT.sans} fontWeight={900} fontSize={128} fill="#F4EBD6" stroke={C.ink} strokeWidth={14} paintOrder="stroke">THE</text>
      <text x={70} y={390} fontFamily={FONT.sans} fontWeight={900} fontSize={128} fill="#F4EBD6" stroke={C.ink} strokeWidth={14} paintOrder="stroke">GUNPOWDER</text>
      <text x={70} y={540} fontFamily={FONT.sans} fontWeight={900} fontSize={128} fill="#F4EBD6" stroke={C.ink} strokeWidth={14} paintOrder="stroke">PLOT</text>
      <g transform="translate(70,610)">
        <rect x={0} y={0} width={640} height={110} rx={14} fill={C.darkRed} stroke={C.ink} strokeWidth={8} />
        <text x={320} y={78} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={66} fill={C.dustyYellow} letterSpacing={2}>5 NOV 1605</text>
      </g>
    </svg>
  </AbsoluteFill>
);
