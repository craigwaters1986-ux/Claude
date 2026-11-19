// YouTube thumbnail (1280 x 720): the unsigned letter, a lantern-lit Guy Fawkes, the title and the date.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Person} from '../kit/Cast';
import {Letter} from '../kit/Paper';
import {Lantern} from './sets';
import {standStiff, addPose} from '../characters/poses';
import {C, FONT} from '../styles/theme';
import {loadFonts} from '../components/Fonts';

loadFonts();
export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{background: '#20160F'}}>
    <svg width={1280} height={720} viewBox="0 0 1920 1080">
      <defs>
        <radialGradient id="glow" cx="0.72" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#E9A955" stopOpacity={0.55} />
          <stop offset="1" stopColor="#20160F" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1920} height={1080} fill="#2A1C14" />
      <rect width={1920} height={1080} fill="url(#glow)" />
      <g transform="translate(1640,580) rotate(7)">
        <Letter x={0} y={0} s={1.2} question={1} />
      </g>
      <Person id="fawkes" x={1230} y={1260} scale={3.0} f={12} seed={4} pose={addPose(standStiff(12, 4), {shR: 80, elR: 40})} holdR={<Lantern f={12} />} look={[0.7, 0]} expression="worried" />
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
