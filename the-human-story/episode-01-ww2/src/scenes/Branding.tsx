// Channel branding for THE HUMAN STORY (all periods, not episode-specific).
//  - BrandLogoA / BrandLogoB: 800x800 profile pictures (YouTube crops to a circle, shown down to ~48 px)
//  - BrandBanner: 2560x1440 channel art; text and key art inside the 1546x423 safe area
//    (x 507-2053, y 508-931). Desktop shows the full width of the band y 508-931.
// Built only from the shared character library; no flags, symbols or weapons.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {StickFigure} from '../characters/StickFigure';
import type {FigureProps} from '../characters/StickFigure';
import {Head, HatShape} from '../characters/Head';
import type {Hat} from '../characters/Head';
import {walk} from '../characters/poses';
import {C, FONT} from '../styles/theme';
import {boil} from '../animations/core';

const ink = C.ink;
const F = 20; // fixed frame for the hand-drawn boil

export const LOGO_SIZE = 800;
export const BANNER_W = 2560;
export const BANNER_H = 1440;
export const SAFE = {x: 507, y: 508, w: 1546, h: 423};

/** White text with a thick ink outline and a hard drop shadow (same treatment as the thumbnails). */
const InkText: React.FC<{x: number; y: number; size: number; weight?: number; shadow?: number; spacing?: string; children: string}> = ({x, y, size, weight = 900, shadow = 0.07, spacing = '-0.01em', children}) => (
  <g fontFamily={FONT.sans} fontWeight={weight} fontSize={size} textAnchor="middle" style={{letterSpacing: spacing}}>
    {shadow > 0 && <text x={x + size * shadow} y={y + size * shadow * 1.1} fill={ink} stroke={ink} strokeWidth={size * 0.16} strokeLinejoin="round">{children}</text>}
    <text x={x} y={y} fill="#FFFFFF" stroke={ink} strokeWidth={size * 0.16} strokeLinejoin="round" style={{paintOrder: 'stroke'}}>{children}</text>
  </g>
);

// ------------------------------------------------------------------------------------------------
// LOGO A: the Guide (reference-style spiky hair) waving hello on a warm "history room" yellow disc.
// ------------------------------------------------------------------------------------------------
export const BrandLogoA: React.FC = () => {
  const R = 190;
  const hx = 400;
  const hy = 405;
  const limb = R * 0.17; // same limb/head ratio as the figures
  const neckY = hy + R * 0.95;
  const shY = neckY + 48;
  return (
    <AbsoluteFill style={{background: C.wallYellow}}>
      <svg width={LOGO_SIZE} height={LOGO_SIZE} viewBox="0 0 800 800">
        <defs>
          <radialGradient id="la-bg" cx="0.42" cy="0.38" r="0.7">
            <stop offset="0" stopColor="#F4DC93" />
            <stop offset="1" stopColor={C.wallYellowDark} />
          </radialGradient>
        </defs>
        <rect width={800} height={800} fill="url(#la-bg)" />
        {/* stick body: torso line and arms running out of frame */}
        <g fill="none" stroke={ink} strokeWidth={limb} strokeLinecap="round" strokeLinejoin="round">
          <line x1={hx} y1={neckY - 10} x2={hx + boil(F, 1, 2)} y2={830} />
          <polyline points={`${hx},${shY} ${hx - 120},${shY + 95} ${hx - 175},${shY + 240}`} />
          <polyline points={`${hx},${shY} ${hx + 120},${shY + 95} ${hx + 175},${shY + 240}`} />
        </g>
        <g transform={`translate(${hx},${hy}) rotate(-3)`}>
          <Head r={R} f={F} seed={4} hair="spiky" expression="curious" turn={0.1} look={[0.35, -0.3]} blink={false} />
        </g>
        {/* circular frame: YouTube crops to a circle; the ring keeps the sticker-like ink outline */}
        <circle cx={400} cy={400} r={392} fill="none" stroke={ink} strokeWidth={16} />
      </svg>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------
// LOGO B: one big head in the middle of a "clock of history": the hour marks are period hats.
// ------------------------------------------------------------------------------------------------
const CLOCK_HATS: {hat: Hat; color: string; accent?: string}[] = [
  {hat: 'laurel', color: '#7E9A4E'},
  {hat: 'hood', color: '#8A6E4A'},
  {hat: 'tricorn', color: '#2E2E2E', accent: C.dustyYellow},
  {hat: 'tophat', color: '#2E2E2E'},
  {hat: 'bonnet', color: '#D9C08E', accent: C.red},
  {hat: 'flatCap', color: '#7A7D78'},
  {hat: 'fedora', color: '#5A5C5F'},
  {hat: 'headscarf', color: C.red},
  {hat: 'baseballCap', color: C.allied},
  {hat: 'beret', color: '#22324A'},
  {hat: 'nurseCap', color: C.paper},
  {hat: 'sailor', color: C.paper},
];

export const BrandLogoB: React.FC = () => {
  const ringR = 292;
  return (
    <AbsoluteFill style={{background: C.board}}>
      <svg width={LOGO_SIZE} height={LOGO_SIZE} viewBox="0 0 800 800">
        <defs>
          <radialGradient id="lb-bg" cx="0.45" cy="0.4" r="0.7">
            <stop offset="0" stopColor="#4C7D58" />
            <stop offset="1" stopColor={C.boardDark} />
          </radialGradient>
        </defs>
        <rect width={800} height={800} fill="url(#lb-bg)" />
        {/* clock face ring */}
        <circle cx={400} cy={400} r={ringR + 62} fill="none" stroke={C.cream} strokeWidth={6} opacity={0.35} />
        {CLOCK_HATS.map((h, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const x = 400 + Math.cos(a) * ringR;
          const y = 400 + Math.sin(a) * ringR;
          return (
            <g key={h.hat} transform={`translate(${x},${y + 18}) scale(0.92)`}>
              {/* a tiny ghost head so each hat sits on something */}
              <ellipse cx={0} cy={0} rx={30} ry={30} fill={C.paper} stroke={ink} strokeWidth={6} />
              <HatShape hat={h.hat} r={30} color={h.color} accent={h.accent} />
            </g>
          );
        })}
        {/* the big head */}
        <g transform="translate(400,428)">
          <Head r={138} f={F} seed={4} hair="spiky" expression="curious" turn={0.1} look={[0.3, -0.35]} blink={false} />
        </g>
        <circle cx={400} cy={400} r={392} fill="none" stroke={ink} strokeWidth={16} />
      </svg>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------
// BANNER: the march of history, walking left (ancient) to right (today) under the title.
// ------------------------------------------------------------------------------------------------
const GROUND = 852; // ground line (inside the safe band)
const SKY_TOP = '#F6E8C4';
const SKY_LOW = '#EFD597';
const FAR = '#E2C68C'; // landmark fill (recedes behind the figures)
const FAR_DARK = '#D2B377';

type Walker = {x: number; s?: number; child?: boolean; expr: NonNullable<FigureProps['head']>['expression']; head: FigureProps['head']; outfit: FigureProps['outfit']};

const WALKERS: Walker[] = [
  // ancient Rome
  {x: 150, expr: 'happy', head: {hair: 'short', hat: 'laurel', hatColor: '#7E9A4E'}, outfit: {kind: 'toga', color: '#EFE6D0', accent: '#8E2F28'}},
  {x: 345, expr: 'curious', head: {hair: 'bun', hairColor: '#3A2A1E'}, outfit: {kind: 'robe', color: '#B5674A', accent: C.dustyYellow}},
  // medieval
  {x: 545, expr: 'happy', head: {hair: 'short', hat: 'hood', hatColor: '#6F8546'}, outfit: {kind: 'robe', color: '#7A5A3A', accent: C.sand}},
  {x: 745, expr: 'happy', head: {hair: 'bob', hat: 'headscarf', hatColor: '#EFE6D0'}, outfit: {kind: 'gown', color: '#4E6E8E'}},
  // 18th century
  {x: 950, expr: 'smug', head: {hair: 'short', hat: 'tricorn', hatColor: '#2E2E2E', hatAccent: C.dustyYellow}, outfit: {kind: 'longcoat', color: '#22324A', accent: '#7A5A3A'}},
  // Victorian
  {x: 1150, expr: 'happy', head: {hair: 'bun', hairColor: '#5A3A22', hat: 'bonnet', hatColor: '#D9C08E', hatAccent: C.red}, outfit: {kind: 'gown', color: '#6E4A62'}},
  {x: 1352, expr: 'neutral', head: {hair: 'short', hat: 'tophat', hatColor: '#2E2E2E', facial: 'walrus'}, outfit: {kind: 'morningcoat', color: '#3A3A3A', accent: '#7E2620'}},
  // early 20th century
  {x: 1555, expr: 'curious', head: {hair: 'short', hat: 'flatCap', hatColor: '#7A7D78'}, outfit: {kind: 'coat', color: '#7A5A3A'}},
  // 1940s civilians
  {x: 1755, expr: 'happy', head: {hair: 'bob', hat: 'headscarf', hatColor: C.red}, outfit: {kind: 'dress', color: '#6F8546'}},
  {x: 1955, expr: 'neutral', head: {hair: 'slick', hat: 'fedora', hatColor: '#5A5C5F'}, outfit: {kind: 'suit', color: '#4A4C4F', accent: C.red}},
  // today
  {x: 2160, expr: 'happy', head: {hair: 'long', hairColor: '#5A3A22'}, outfit: {kind: 'hoodie', color: C.allied, accent: C.paper}},
  {x: 2340, child: true, expr: 'joy', head: {hair: 'mop', hat: 'baseballCap', hatColor: C.red, hatAccent: '#7E2620'}, outfit: {kind: 'shirt', color: C.dustyYellow}},
];

const Cloud: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => (
  <path
    transform={`translate(${x},${y}) scale(${k})`}
    d="M-120,30 C-150,30 -150,-10 -115,-12 C-110,-50 -50,-60 -30,-30 C-10,-70 60,-65 70,-25 C110,-35 140,0 120,30Z"
    fill="#FBF3DE"
    stroke={ink}
    strokeWidth={4 / k}
    strokeLinejoin="round"
  />
);

/** Distant landmarks, also ordered in time from left to right (pyramids ... modern skyline). */
const Skyline: React.FC = () => {
  const o = {stroke: ink, strokeWidth: 4, strokeLinejoin: 'round' as const};
  const b = (k: number) => boil(F, k, 1.5);
  // Roman aqueduct arches
  const arches = (() => {
    const x0 = 360;
    const n = 5;
    const w = 92;
    let d = `M${x0},${GROUND} L${x0},${GROUND - 168} L${x0 + n * w},${GROUND - 168} L${x0 + n * w},${GROUND}Z`;
    for (let i = 0; i < n; i++) {
      const cx = x0 + w * i + w / 2;
      d += ` M${cx - 30},${GROUND} L${cx - 30},${GROUND - 96} A30,30 0 0 1 ${cx + 30},${GROUND - 96} L${cx + 30},${GROUND}Z`;
    }
    return <path d={d} fillRule="evenodd" fill={FAR} {...o} />;
  })();
  // castle with crenellations
  const castle = (() => {
    const x0 = 800;
    const top = GROUND - 150;
    const tw = 70; // towers
    const crenel = (x: number, y: number, w: number) => {
      let d = `L${x},${y}`;
      const n = Math.round(w / 20);
      for (let i = 0; i < n; i++) d += ` L${x + (w / n) * i},${y - 16} L${x + (w / n) * (i + 0.5)},${y - 16} L${x + (w / n) * (i + 0.5)},${y}`;
      return d + ` L${x + w},${y}`;
    };
    const d = `M${x0},${GROUND} ${crenel(x0, top - 60, tw)} L${x0 + tw},${top} ${crenel(x0 + tw, top, 150)} L${x0 + tw + 150},${top - 60} ${crenel(x0 + tw + 150, top - 60, tw)} L${x0 + tw * 2 + 150},${GROUND}Z`;
    return (
      <g>
        <path d={d} fill={FAR} {...o} />
        <path d={`M${x0 + tw + 50},${GROUND} L${x0 + tw + 50},${GROUND - 50} A25,25 0 0 1 ${x0 + tw + 100},${GROUND - 50} L${x0 + tw + 100},${GROUND}`} fill={FAR_DARK} {...o} />
      </g>
    );
  })();
  // factory with chimneys and a little smoke
  const factory = (
    <g>
      <rect x={1520} y={GROUND - 140} width={46} height={140} fill={FAR_DARK} {...o} />
      <rect x={1610} y={GROUND - 165} width={40} height={165} fill={FAR_DARK} {...o} />
      <path d={`M1480,${GROUND} L1480,${GROUND - 70} L1530,${GROUND - 100} L1530,${GROUND - 70} L1580,${GROUND - 100} L1580,${GROUND - 70} L1630,${GROUND - 100} L1630,${GROUND - 70} L1680,${GROUND - 100} L1680,${GROUND}Z`} fill={FAR} {...o} />
      {[[1543, GROUND - 158, 18], [1560, GROUND - 180, 14], [1630, GROUND - 184, 16], [1648, GROUND - 204, 12]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#E9E1CF" stroke={ink} strokeWidth={3} opacity={0.9} />
      ))}
    </g>
  );
  // modern skyline (rectangles with window rows)
  const towers: [number, number, number][] = [[1990, 70, 170], [2065, 60, 250], [2130, 80, 200], [2215, 55, 300], [2275, 85, 230], [2365, 60, 330], [2430, 90, 210], [2525, 70, 270]];
  const skyline = (
    <g>
      {towers.map(([x, w, h], i) => (
        <g key={i}>
          <rect x={x} y={GROUND - h} width={w} height={h} fill={i % 2 ? FAR_DARK : FAR} {...o} />
          {Array.from({length: Math.floor((h - 30) / 34)}).map((_, j) => (
            <line key={j} x1={x + 12} x2={x + w - 12} y1={GROUND - h + 24 + j * 34} y2={GROUND - h + 24 + j * 34} stroke={ink} strokeWidth={3} strokeDasharray="10 9" opacity={0.45} />
          ))}
        </g>
      ))}
    </g>
  );
  return (
    <g>
      {/* pyramids */}
      <path d={`M-40,${GROUND} L150,${GROUND - 250} L340,${GROUND}Z`} fill={FAR} {...o} />
      <path d={`M150,${GROUND - 250} L200,${GROUND} L340,${GROUND}Z`} fill={FAR_DARK} {...o} />
      <path d={`M220,${GROUND} L330,${GROUND - 140} L440,${GROUND}Z`} fill={FAR} {...o} />
      {arches}
      {castle}
      {factory}
      {skyline}
    </g>
  );
};

export const BrandBanner: React.FC = () => {
  const cx = BANNER_W / 2;
  return (
    <AbsoluteFill style={{background: SKY_TOP}}>
      <svg width={BANNER_W} height={BANNER_H} viewBox={`0 0 ${BANNER_W} ${BANNER_H}`}>
        <defs>
          <linearGradient id="bn-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={SKY_TOP} />
            <stop offset="1" stopColor={SKY_LOW} />
          </linearGradient>
        </defs>
        <rect width={BANNER_W} height={GROUND} fill="url(#bn-sky)" />
        {/* sun and clouds (decoration; mostly outside the desktop band) */}
        <circle cx={2230} cy={330} r={120} fill="#F7DC8A" stroke={ink} strokeWidth={5} />
        <Cloud x={420} y={250} k={1.3} />
        <Cloud x={1080} y={150} k={1.0} />
        <Cloud x={1700} y={300} k={1.15} />
        <Cloud x={2480} y={560} k={0.8} />
        <Cloud x={160} y={560} k={0.75} />
        <Skyline />
        {/* ground */}
        <rect x={0} y={GROUND} width={BANNER_W} height={BANNER_H - GROUND} fill="#9C8556" />
        <rect x={0} y={GROUND} width={BANNER_W} height={18} fill="#B49B66" />
        <line x1={0} y1={GROUND} x2={BANNER_W} y2={GROUND} stroke={ink} strokeWidth={6} />
        <rect x={0} y={1010} width={BANNER_W} height={BANNER_H - 1010} fill="#857048" />
        <line x1={0} y1={1010} x2={BANNER_W} y2={1010} stroke={ink} strokeWidth={4} opacity={0.5} />
        {Array.from({length: 26}).map((_, i) => {
          const x = 40 + ((i * 523) % 2500);
          const y = 1060 + ((i * 197) % 330);
          return <path key={i} d={`M${x - 14},${y} q6,-22 10,-2 q4,-26 8,0 q5,-20 10,2`} fill="none" stroke="#5E5236" strokeWidth={4} strokeLinecap="round" />;
        })}

        {/* the march of history */}
        {WALKERS.map((w, i) => (
          <StickFigure
            key={i}
            x={w.x}
            y={GROUND + 2}
            f={F + i * 3}
            seed={i + 3}
            scale={w.s ?? 0.66}
            dir={1}
            child={w.child}
            pose={walk(0.13 + i * 0.29, 0.9)}
            head={{...w.head, expression: w.expr}}
            outfit={w.outfit}
            look={[0.3, 0]}
          />
        ))}

        {/* title + tagline (all inside the safe area) */}
        <InkText x={cx} y={634} size={122} spacing="0.005em">THE HUMAN STORY</InkText>
        <g fontFamily={FONT.sans} fontWeight={800} fontSize={54} textAnchor="middle" style={{letterSpacing: '0.01em'}}>
          <text x={cx} y={918} fill={C.cream} stroke={ink} strokeWidth={10} strokeLinejoin="round" style={{paintOrder: 'stroke'}}>History is made by people.</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
