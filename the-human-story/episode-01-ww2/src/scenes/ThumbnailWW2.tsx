// YouTube thumbnail for ep01-ww2, version 2 (Craig, 2026-11-19): big "WW2" with tanks and armed forces.
// Allied forces only (British, American and Soviet soldiers; US- and Soviet-marked tanks; an RAF Spitfire),
// so no Axis symbols appear. Built from the shared character and vehicle library.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {StickFigure} from '../characters/StickFigure';
import {CAST} from '../characters/cast';
import type {Expression} from '../characters/Head';
import {addPose, walk} from '../characters/poses';
import type {Pose} from '../characters/poses';
import {RifleBetween} from '../characters/props';
import {Tank, Plane} from '../components/Vehicles';
import {Smoke} from '../components/Effects';
import {C, FONT} from '../styles/theme';

const ink = C.ink;
const F = 20;

const Soldier: React.FC<{k: string; x: number; y: number; s: number; phase: number; expr: Expression; seed: number}> = ({k, x, y, s, phase, expr, seed}) => {
  const c = CAST[k];
  // advancing at a steady walk, rifle held across the body (port arms)
  const p: Pose = addPose(walk(phase, 0.8), {shL: 50, elL: 70, shR: 35, elR: 85, lean: 6});
  return (
    <StickFigure
      x={x} y={y} f={F} seed={seed} scale={s} dir={1} pose={p}
      head={{...c.head, expression: expr}} outfit={c.outfit} look={[1, 0]} shadow
      overlayTop={(sk) => <RifleBetween a={{x: sk.armR.hx - 6, y: sk.armR.hy + 6}} b={{x: sk.armL.hx + 18, y: sk.armL.hy - 14}} len={150} />}
    />
  );
};

const BigText: React.FC<{x: number; y: number; size: number; fill?: string; children: string}> = ({x, y, size, fill = '#FFFFFF', children}) => (
  <g fontFamily={FONT.sans} fontWeight={900} fontSize={size} textAnchor="middle" style={{letterSpacing: '-0.02em'}}>
    <text x={x + 10} y={y + 11} fill={ink} stroke={ink} strokeWidth={size * 0.15} strokeLinejoin="round">{children}</text>
    <text x={x} y={y} fill={fill} stroke={ink} strokeWidth={size * 0.15} strokeLinejoin="round" style={{paintOrder: 'stroke'}}>{children}</text>
  </g>
);

export const ThumbnailWW2: React.FC = () => (
  <AbsoluteFill style={{background: '#C9A27A'}}>
    <svg width={1280} height={720} viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="ww2sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6E6A6C" />
          <stop offset="0.55" stopColor="#C98A55" />
          <stop offset="1" stopColor="#E6B77A" />
        </linearGradient>
      </defs>
      <rect width={1280} height={720} fill="url(#ww2sky)" />
      {/* distant smoke columns */}
      <Smoke x={980} y={470} f={F} n={9} color="#5A5552" size={46} rise={420} drift={-80} seed={3} opacity={0.6} outline={false} />
      <Smoke x={560} y={480} f={F + 30} n={8} color="#6A6460" size={38} rise={380} drift={-60} seed={7} opacity={0.5} outline={false} />
      {/* ridge and ground */}
      <path d="M0,500 C200,470 380,505 600,480 C820,455 1010,500 1280,470 V720 H0Z" fill="#7C7046" stroke={ink} strokeWidth={5} />
      <path d="M0,585 C260,565 520,600 760,580 C1000,560 1140,590 1280,575 V720 H0Z" fill="#6A603C" stroke={ink} strokeWidth={5} />
      {/* aircraft */}
      <Plane x={940} y={105} f={F} s={0.9} dir={1} kind="spitfire" mark="roundel" bank={6} />
      <Plane x={1120} y={185} f={F + 7} s={0.6} dir={1} kind="spitfire" mark="roundel" bank={4} />
      {/* tanks */}
      <Tank x={1020} y={540} dist={40} s={1.1} dir={1} f={F} variant="t34" color="#5E6B3E" mark="usstar" turret={4} exhaust dust />
      <Tank x={760} y={605} dist={80} s={1.4} dir={1} f={F + 11} variant="t34" color="#4E5E3A" mark="star" turret={6} exhaust dust />
      {/* soldiers advancing */}
      <Soldier k="britSoldier" x={150} y={716} s={1.0} phase={0.15} expr="determined" seed={11} />
      <Soldier k="usSoldier" x={300} y={706} s={0.95} phase={0.55} expr="determined" seed={12} />
      <Soldier k="sovietSoldier" x={450} y={716} s={1.0} phase={0.85} expr="determined" seed={13} />
      {/* title */}
      <BigText x={345} y={265} size={190}>WW2</BigText>
      <g transform="translate(345,345)">
        <rect x={-190} y={-52} width={380} height={74} rx={12} fill={C.darkRed} stroke={ink} strokeWidth={7} />
        <text y={8} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={48} fill={C.dustyYellow} letterSpacing={2}>1939–1945</text>
      </g>
      {/* channel mark */}
      <g fontFamily={FONT.sans} fontWeight={900} fontSize={21} style={{letterSpacing: '0.06em'}}>
        <rect x={18} y={18} width={262} height={38} rx={6} fill={ink} />
        <text x={153} y={45} textAnchor="middle" fill="#FFFFFF">THE HUMAN STORY</text>
      </g>
    </svg>
  </AbsoluteFill>
);
