// Episode 3 places, in the series style: flat muted colours, thick ink outlines.
// All sets are drawn in 1920 x 1080 scene space with the ground above the caption band (y < 916).
import React from 'react';
import {C, FONT} from '../styles/theme';
import {hash, noise1, clamp, rng} from '../animations/core';
import {Fire, Smoke, Candle} from '../components/Effects';

export const INK = '#2B2729';
const o = (w = 6) => ({stroke: INK, strokeWidth: w, strokeLinejoin: 'round' as const});

export type Time = 'day' | 'dusk' | 'night' | 'dawn' | 'grey';
const SKIES: Record<Time, [string, string]> = {
  day: ['#AFC6CB', '#EADCBC'],
  dusk: ['#6E7894', '#E7B98A'],
  night: ['#1E2638', '#3F4A63'],
  dawn: ['#9CA8B8', '#F0CDA5'],
  grey: ['#9EA6A6', '#D3CFC3'],
};
export const Sky: React.FC<{time: Time; id: string; f?: number}> = ({time, id, f = 0}) => (
  <g>
    <defs>
      <linearGradient id={`sky-${id}`} x1={0} y1={0} x2={0} y2={1}>
        <stop offset={0} stopColor={SKIES[time][0]} />
        <stop offset={1} stopColor={SKIES[time][1]} />
      </linearGradient>
    </defs>
    <rect x={-300} y={-300} width={2520} height={1500} fill={`url(#sky-${id})`} />
    {time === 'night' && <Stars f={f} />}
    {time === 'night' && <circle cx={1580} cy={170} r={54} fill="#EFE8D2" opacity={0.9} />}
  </g>
);
export const Stars: React.FC<{f: number; n?: number}> = ({f, n = 70}) => {
  const r = rng(77);
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const x = r() * 2000 - 40, y = r() * 520, s = 1 + r() * 2.2;
        return <circle key={i} cx={x} cy={y} r={s} fill="#F4F0DE" opacity={0.45 + 0.4 * Math.sin(f / (14 + (i % 7)) + i)} />;
      })}
    </g>
  );
};

/** River with moving ripples between y0 and y1. */
export const River: React.FC<{y0: number; y1: number; f: number; color?: string; night?: boolean}> = ({y0, y1, f, color = '#7F9AA1', night}) => (
  <g>
    <rect x={-300} y={y0} width={2520} height={y1 - y0} fill={night ? '#2E3A4E' : color} />
    {Array.from({length: 18}, (_, i) => {
      const y = y0 + 14 + ((i * 37) % (y1 - y0 - 20));
      const x = ((i * 263 + f * (0.6 + (i % 3) * 0.3)) % 2300) - 200;
      return <path key={i} d={`M${x},${y} q30,-8 60,0 t60,0`} stroke={night ? '#56647D' : '#A9C0C3'} strokeWidth={4} fill="none" opacity={0.8} />;
    })}
  </g>
);

const win = (x: number, y: number, w: number, h: number, lit: number, k: number) => (
  <g key={k}>
    <path d={`M${x},${y + h} V${y + w / 2} Q${x + w / 2},${y - w * 0.15} ${x + w},${y + w / 2} V${y + h}Z`} fill={lit > 0 ? `rgba(246,205,120,${0.35 + 0.6 * lit})` : '#5C6466'} {...o(4)} />
    <path d={`M${x + w / 2},${y + 4} V${y + h} M${x},${y + h * 0.55} H${x + w}`} stroke={INK} strokeWidth={3} />
  </g>
);

/** The old Palace of Westminster from the river: Westminster Hall, St Stephen's Chapel and the Lords. */
export const OldPalace: React.FC<{f: number; time?: Time; lit?: number; x?: number; s?: number; lantern?: number}> = ({f, time = 'day', lit = 0, x = 0, s = 1, lantern = 0}) => {
  const night = time === 'night';
  const stone = night ? '#6C6E78' : '#C9B993';
  const stone2 = night ? '#5D5F6A' : '#B7A57E';
  const roof = night ? '#434A57' : '#77706A';
  return (
    <g transform={`translate(${x},0) scale(${s})`}>
      {/* Westminster Hall: the great gable */}
      <path d="M220,780 V420 L520,180 L820,420 V780Z" fill={stone} {...o()} />
      <path d="M200,430 L520,166 L840,430" fill="none" {...o(10)} />
      <rect x={490} y={120} width={60} height={70} fill={roof} {...o(5)} />
      <path d="M484,124 L520,84 L556,124Z" fill={roof} {...o(5)} />
      {[260, 380, 660, 780].map((bx) => <path key={bx} d={`M${bx - 16},780 V470 L${bx},440 L${bx + 16},470 V780Z`} fill={stone2} {...o(4)} />)}
      <path d="M440,560 Q520,470 600,560 V700 H440Z" fill={lit ? `rgba(246,205,120,${0.3 + 0.5 * lit})` : '#5C6466'} {...o(5)} />
      <path d="M520,500 V700 M470,590 H570" stroke={INK} strokeWidth={4} />
      <path d="M470,780 V720 Q520,680 570,720 V780Z" fill="#5B4A3C" {...o(5)} />
      {/* St Stephen's Chapel (the Commons) */}
      <rect x={900} y={360} width={380} height={420} fill={stone2} {...o()} />
      <path d="M890,370 L1090,250 L1290,370Z" fill={roof} {...o()} />
      {[900, 1280].map((px) => (
        <g key={px}>
          <rect x={px - 22} y={250} width={44} height={530} fill={stone} {...o(5)} />
          <path d={`M${px - 26},252 L${px},168 L${px + 26},252Z`} fill={roof} {...o(5)} />
        </g>
      ))}
      {[960, 1060, 1160].map((wx, i) => win(wx, 420, 64, 210, lit, i))}
      {/* the Lords and lesser buildings */}
      <rect x={1330} y={500} width={460} height={280} fill={stone} {...o()} />
      <path d="M1320,508 L1440,420 L1560,508 L1680,420 L1800,508Z" fill={roof} {...o()} />
      {[1370, 1470, 1590, 1690].map((wx, i) => win(wx, 560, 54, 130, lit * (i % 2 ? 1 : 0.6), 10 + i))}
      <rect x={-80} y={560} width={300} height={220} fill={stone2} {...o()} />
      <path d="M-90,568 L70,470 L230,568Z" fill={roof} {...o()} />
      {win(20, 610, 50, 120, lit * 0.8, 20)}{win(110, 610, 50, 120, lit * 0.5, 21)}
      {/* embankment */}
      <rect x={-300} y={780} width={2520} height={40} fill={night ? '#4E505A' : '#A49577'} {...o(5)} />
      {lantern > 0 && (
        <g opacity={lantern}>
          <circle cx={1500} cy={740} r={70} fill="#FFD27A" opacity={0.18} />
          <circle cx={1500} cy={740} r={12} fill="#FFE1A0" />
        </g>
      )}
      {night && <rect x={-300} y={-300} width={2520} height={1500} fill="#0A1020" opacity={0.18} />}
      {noise1(f / 50, 2) > 2 && null}
    </g>
  );
};

/** Westminster Hall interior: the hammerbeam roof receding toward the great north window. */
export const HallInterior: React.FC<{f: number; light?: number}> = ({f, light = 1}) => (
  <g>
    <rect x={-300} y={-300} width={2520} height={1500} fill="#8A7A62" />
    <path d="M960,120 L1180,300 V700 H740 V300Z" fill="#C9B58E" {...o(5)} />
    <path d="M900,250 Q960,170 1020,250 V560 H900Z" fill={`rgba(236,220,170,${0.5 + 0.3 * light})`} {...o(5)} />
    <path d="M960,210 V560 M900,330 H1020 M900,430 H1020" stroke={INK} strokeWidth={4} />
    {[0, 1, 2, 3, 4].map((i) => {
      const k = 1 - i * 0.17;
      const w = 1060 * k, top = 120 + (1 - k) * 210, y0 = 700 - (1 - k) * 40;
      return (
        <g key={i} opacity={0.95}>
          <path d={`M${960 - w},${y0} V${top + 260 * k} L${960},${top} L${960 + w},${top + 260 * k} V${y0}`} fill="none" stroke="#5A4630" strokeWidth={26 * k} strokeLinejoin="round" />
          <path d={`M${960 - w * 0.86},${top + 300 * k} Q${960 - w * 0.6},${top + 120 * k} ${960 - w * 0.25},${top + 120 * k} M${960 + w * 0.86},${top + 300 * k} Q${960 + w * 0.6},${top + 120 * k} ${960 + w * 0.25},${top + 120 * k}`} fill="none" stroke="#6C5538" strokeWidth={16 * k} />
        </g>
      );
    })}
    <path d="M-300,700 L740,700 L1180,700 L2220,700 V1200 H-300Z" fill="#9D8C70" {...o(5)} />
    {Array.from({length: 9}, (_, i) => <path key={i} d={`M${960 - (i - 4) * 60},700 L${960 - (i - 4) * 420},1100`} stroke="#8C7B60" strokeWidth={4} />)}
    <rect x={-300} y={-300} width={2520} height={1500} fill="#000" opacity={0.08 + 0.04 * Math.sin(f / 70)} />
  </g>
);

/** The Lords chamber prepared for a State Opening: throne under a canopy, benches on both sides. */
export const LordsChamber: React.FC<{f: number}> = ({f}) => (
  <g>
    <rect x={-300} y={-300} width={2520} height={1500} fill="#6B4A3E" />
    {Array.from({length: 9}, (_, i) => (
      <g key={i}>
        <rect x={-60 + i * 240} y={140} width={200} height={360} fill={i % 2 ? '#7F5B48' : '#86604A'} {...o(4)} />
        <path d={`M${-30 + i * 240},200 h140 M${-30 + i * 240},300 h140 M${-30 + i * 240},400 h140`} stroke="#5C3F33" strokeWidth={4} />
      </g>
    ))}
    {/* canopy and throne */}
    <path d="M800,120 H1120 L1090,210 H830Z" fill="#9E2E26" {...o(5)} />
    <rect x={830} y={210} width={260} height={330} fill="#B23A2E" {...o(5)} />
    <path d="M900,560 V330 Q960,280 1020,330 V560Z" fill={C.gold} {...o(5)} />
    <rect x={880} y={540} width={160} height={40} fill="#8E2A22" {...o(4)} />
    <rect x={760} y={580} width={400} height={50} fill="#7A5A3A" {...o(5)} />
    {/* benches */}
    {[0, 1].map((side) => (
      <g key={side}>
        {[0, 1, 2].map((r) => (
          <path key={r} d={side === 0 ? `M${-200},${660 + r * 70} L${700 - r * 60},${640 + r * 70} V${690 + r * 70} L${-200},${720 + r * 70}Z` : `M${2120},${660 + r * 70} L${1220 + r * 60},${640 + r * 70} V${690 + r * 70} L${2120},${720 + r * 70}Z`} fill="#A3342A" {...o(5)} />
        ))}
      </g>
    ))}
    <path d="M-300,860 H2220 V1200 H-300Z" fill="#5D3B2E" {...o(5)} />
    <rect x={-300} y={-300} width={2520} height={1500} fill="#FFDCA0" opacity={0.05 + 0.02 * Math.sin(f / 40)} />
  </g>
);

/** Panelled room with a leaded window, optional fireplace and candles. `tone` sets the wood. */
export const Room: React.FC<{f: number; tone?: 'oak' | 'dark' | 'plain' | 'green'; fire?: boolean; window?: Time | 'none'; candles?: [number, number][]; floorY?: number; windowX?: number; fireX?: number}> = ({
  f, tone = 'oak', fire = false, window = 'dusk', candles = [], floorY = 800, windowX = 1340, fireX = 360,
}) => {
  const wall = tone === 'oak' ? '#8C6A4B' : tone === 'dark' ? '#5E4636' : tone === 'green' ? '#6E7A5E' : '#C9B79A';
  const panel = tone === 'oak' ? '#7A5B40' : tone === 'dark' ? '#503B2D' : tone === 'green' ? '#5F6A50' : '#B7A585';
  return (
    <g>
      <rect x={-300} y={-300} width={2520} height={1500} fill={wall} />
      {Array.from({length: 12}, (_, i) => (
        <g key={i}>
          <rect x={-120 + i * 190} y={floorY - 330} width={160} height={140} rx={4} fill={panel} {...o(3)} />
          <rect x={-120 + i * 190} y={floorY - 170} width={160} height={140} rx={4} fill={panel} {...o(3)} />
        </g>
      ))}
      <rect x={-300} y={floorY - 360} width={2520} height={20} fill={panel} {...o(4)} />
      {window !== 'none' && (
        <g>
          <rect x={windowX} y={170} width={300} height={360} fill={SKIES[window][1]} {...o(6)} />
          <rect x={windowX} y={170} width={300} height={180} fill={SKIES[window][0]} opacity={0.8} />
          {Array.from({length: 6}, (_, i) => <path key={i} d={`M${windowX + i * 60},170 L${windowX + 300},${170 + 300 - i * 60} M${windowX + 300 - i * 60},170 L${windowX},${170 + 300 - i * 60}`} stroke={INK} strokeWidth={2} opacity={0.5} />)}
          <path d={`M${windowX + 150},170 V530 M${windowX},350 H${windowX + 300}`} stroke={INK} strokeWidth={8} />
          <rect x={windowX - 20} y={530} width={340} height={22} fill={panel} {...o(4)} />
        </g>
      )}
      {fire && (
        <g>
          <rect x={fireX - 170} y={floorY - 330} width={340} height={330} fill="#7B746A" {...o(6)} />
          <rect x={fireX - 200} y={floorY - 350} width={400} height={40} fill="#6A645B" {...o(5)} />
          <path d={`M${fireX - 110},${floorY} V${floorY - 200} Q${fireX},${floorY - 270} ${fireX + 110},${floorY - 200} V${floorY}Z`} fill="#2A2222" {...o(5)} />
          <circle cx={fireX} cy={floorY - 70} r={140} fill="#FFB060" opacity={0.12 + 0.04 * Math.sin(f / 3)} />
          <Fire x={fireX} y={floorY - 18} f={f} s={0.62} seed={4} />
          <path d={`M${fireX - 70},${floorY - 14} H${fireX + 70}`} stroke="#3E2C20" strokeWidth={16} strokeLinecap="round" />
        </g>
      )}
      <rect x={-300} y={floorY} width={2520} height={600} fill={tone === 'plain' ? '#9E8B6E' : '#6B5039'} />
      <line x1={-300} y1={floorY} x2={2220} y2={floorY} stroke={INK} strokeWidth={6} />
      {Array.from({length: 14}, (_, i) => <line key={i} x1={-200 + i * 170} y1={floorY} x2={-420 + i * 200} y2={floorY + 300} stroke="#5A422F" strokeWidth={3} opacity={0.6} />)}
      {candles.map(([cx, cy], i) => <Candle key={i} x={cx} y={cy} f={f} s={0.8} seed={i + 2} />)}
    </g>
  );
};

/** A table seen side-on with an optional cloth colour (council green, household brown). */
export const BoardTable: React.FC<{x: number; y: number; w: number; cloth?: string; h?: number}> = ({x, y, w, cloth = '#3F5E45', h = 140}) => (
  <g>
    <rect x={x + 30} y={y} width={16} height={h} fill="#4A3526" {...o(3)} />
    <rect x={x + w - 46} y={y} width={16} height={h} fill="#4A3526" {...o(3)} />
    <path d={`M${x - 10},${y - 18} H${x + w + 10} V${y + 46} H${x - 10}Z`} fill={cloth} {...o(5)} />
    <path d={`M${x - 10},${y + 4} H${x + w + 10}`} stroke="rgba(0,0,0,0.2)" strokeWidth={6} />
  </g>
);

export const Bench: React.FC<{x: number; y: number; w: number; color?: string}> = ({x, y, w, color = '#6B4A30'}) => (
  <g>
    <rect x={x} y={y - 54} width={w} height={16} rx={3} fill={color} {...o(4)} />
    <rect x={x + 16} y={y - 40} width={12} height={40} fill={color} {...o(3)} />
    <rect x={x + w - 28} y={y - 40} width={12} height={40} fill={color} {...o(3)} />
  </g>
);

/** Timber-framed house (Hoxton, parish street): x = left edge, base = ground y. */
export const Timbered: React.FC<{x: number; base: number; w?: number; h?: number; fill?: string; lit?: number; door?: boolean; doorOpen?: number; seed?: number}> = ({x, base, w = 300, h = 380, fill = '#DCC7A0', lit = 0, door = true, doorOpen = 0, seed = 1}) => {
  const top = base - h;
  return (
    <g>
      <path d={`M${x},${base} V${top + 110} L${x + w / 2},${top - 30} L${x + w},${top + 110} V${base}Z`} fill={fill} {...o(7)} />
      <path d={`M${x - 20},${top + 120} L${x + w / 2},${top - 50} L${x + w + 20},${top + 120} L${x + w},${top + 128} L${x + w / 2},${top - 20} L${x},${top + 128}Z`} fill="#6E5A55" {...o(6)} />
      <path d={`M${x + 6},${top + 150} H${x + w - 6} M${x + 4},${top + h * 0.62} H${x + w - 4} M${x + w / 2},${top + 30} V${base} M${x + 12},${top + 160} L${x + w / 2 - 12},${top + h * 0.6} M${x + w / 2 + 12},${top + h * 0.6} L${x + w - 12},${top + 160}`} stroke={INK} strokeWidth={6} fill="none" />
      {[0, 1].map((k) => {
        const wx = x + (k ? w * 0.62 : w * 0.12), wy = top + h * 0.7;
        return (
          <g key={k}>
            <rect x={wx} y={wy} width={w * 0.24} height={h * 0.18} fill={lit > 0 ? `rgba(246,205,120,${0.4 + 0.55 * lit * (0.85 + 0.15 * hash(seed + k))})` : '#A9B6AC'} {...o(4)} />
            <path d={`M${wx + w * 0.12},${wy} v${h * 0.18} M${wx},${wy + h * 0.09} h${w * 0.24}`} stroke={INK} strokeWidth={3} />
          </g>
        );
      })}
      {door && (
        <g>
          <path d={`M${x + w * 0.4},${base} V${base - 120} Q${x + w * 0.5},${base - 150} ${x + w * 0.6},${base - 120} V${base}Z`} fill={doorOpen > 0 ? '#2C2420' : '#6A5646'} {...o(5)} />
          {doorOpen > 0 && <circle cx={x + w * 0.5} cy={base - 60} r={60} fill="#FFC870" opacity={0.25 * doorOpen} />}
          {doorOpen > 0 && <path d={`M${x + w * 0.4},${base} V${base - 120} L${x + w * 0.4 - 50 * doorOpen},${base - 112} V${base + 4}Z`} fill="#6A5646" {...o(4)} />}
        </g>
      )}
    </g>
  );
};

/** Parish church with a bell in an open tower; `bell` = swing angle in degrees. */
export const Church: React.FC<{x: number; base: number; bell?: number; fill?: string}> = ({x, base, bell = 0, fill = '#B3A791'}) => (
  <g>
    <path d={`M${x},${base} V${base - 220} L${x + 170},${base - 380} L${x + 375},${base - 214} V${base}Z`} fill={fill} {...o(7)} />
    <path d={`M${x + 260},${base} V${base - 400} H${x + 500} V${base}Z`} fill="#BFB29C" {...o(7)} />
    <path d={`M${x + 247},${base - 393} L${x + 380},${base - 604} L${x + 514},${base - 393}Z`} fill="#67746F" {...o(7)} />
    <path d={`M${x + 322},${base - 248} V${base - 315} Q${x + 378},${base - 405} ${x + 435},${base - 315} V${base - 248}Z`} fill="#56554D" />
    <g transform={`rotate(${bell} ${x + 379} ${base - 335})`} fill="#BA9664" stroke={INK} strokeWidth={5}>
      <circle cx={x + 379} cy={base - 271} r={8} />
      <path d={`M${x + 350},${base - 277} Q${x + 361},${base - 286} ${x + 361},${base - 314} Q${x + 379},${base - 340} ${x + 397},${base - 314} Q${x + 398},${base - 286} ${x + 408},${base - 277}Z`} />
    </g>
    <path d={`M${x + 324},${base} V${base - 133} Q${x + 378},${base - 215} ${x + 436},${base - 133} V${base}Z`} fill="#74685B" {...o(7)} />
  </g>
);

/** The White Tower with its four turrets behind a curtain wall. */
export const Tower: React.FC<{x: number; base: number; time?: Time}> = ({x, base, time = 'grey'}) => {
  const stone = time === 'night' ? '#7A7A80' : '#D2C7AE';
  return (
    <g>
      <rect x={x} y={base - 470} width={560} height={470} fill={stone} {...o(7)} />
      {[x - 10, x + 160, x + 330, x + 500].map((tx, i) => (
        <g key={i}>
          <rect x={tx} y={base - 590} width={70} height={130} fill={stone} {...o(6)} />
          <path d={`M${tx - 4},${base - 588} Q${tx + 35},${base - 660} ${tx + 74},${base - 588}Z`} fill="#6F7774" {...o(5)} />
        </g>
      ))}
      {Array.from({length: 4}, (_, i) => win(x + 70 + i * 120, base - 380, 46, 110, 0, i))}
      <path d={`M${x - 240},${base} V${base - 170} H${x + 800} V${base}Z`} fill="#C2B699" {...o(6)} />
      {Array.from({length: 22}, (_, i) => <rect key={i} x={x - 240 + i * 48} y={base - 196} width={26} height={28} fill="#C2B699" {...o(4)} />)}
    </g>
  );
};

/** Holbeach House, Staffordshire: a brick house with gables; `mist` 0..1 at dawn. */
export const BrickManor: React.FC<{x: number; base: number; mist?: number; f: number}> = ({x, base, mist = 0, f}) => (
  <g>
    <rect x={x} y={base - 330} width={720} height={330} fill="#A8634D" {...o(7)} />
    {[0, 1, 2].map((i) => <path key={i} d={`M${x + 20 + i * 230},${base - 330} L${x + 120 + i * 230},${base - 470} L${x + 220 + i * 230},${base - 330}Z`} fill="#A8634D" {...o(7)} />)}
    <path d={`M${x - 20},${base - 330} H${x + 740}`} {...o(10)} />
    {[0, 1, 2].map((i) => <rect key={i} x={x + 92 + i * 230} y={base - 430} width={56} height={60} fill="#C7CEC6" {...o(4)} />)}
    {Array.from({length: 5}, (_, i) => <rect key={i} x={x + 50 + i * 136} y={base - 250} width={70} height={90} fill="#C7CEC6" {...o(4)} />)}
    <path d={`M${x + 320},${base} V${base - 140} H${x + 400} V${base}Z`} fill="#5E4A3A" {...o(5)} />
    {[x + 180, x + 560].map((cx) => <rect key={cx} x={cx} y={base - 540} width={40} height={110} fill="#94503E" {...o(5)} />)}
    <Smoke x={x + 200} y={base - 540} f={f} n={6} color="#B9B4AA" size={22} rise={260} drift={-60} opacity={0.45} outline={false} />
    {mist > 0 && Array.from({length: 7}, (_, i) => <ellipse key={i} cx={((i * 340 + f * 0.6) % 2400) - 240} cy={base - 30 + (i % 3) * 30} rx={380} ry={50} fill="#EEE8DC" opacity={0.35 * mist} />)}
  </g>
);

/** Archive reading room: shelves of grey boxes, a table with a lamp. */
export const Archive: React.FC<{f: number}> = ({f}) => (
  <g>
    <rect x={-300} y={-300} width={2520} height={1500} fill="#B9B6AA" />
    {Array.from({length: 5}, (_, r) => (
      <g key={r}>
        <rect x={-100} y={110 + r * 130} width={2120} height={14} fill="#7D7A70" {...o(3)} />
        {Array.from({length: 26}, (_, i) => <rect key={i} x={-90 + i * 82 + (r % 2) * 20} y={30 + r * 130} width={70} height={80} fill={hash(i + r * 26) > 0.7 ? '#8B9294' : '#9EA3A2'} {...o(3)} />)}
      </g>
    ))}
    <rect x={-300} y={760} width={2520} height={600} fill="#8C8170" />
    <circle cx={1500} cy={520} r={260} fill="#FFF0C4" opacity={0.15 + 0.02 * Math.sin(f / 30)} />
  </g>
);

/** Church interior from the back of the nave: pews, pulpit, windows. */
export const Nave: React.FC<{f: number}> = ({f}) => (
  <g>
    <rect x={-300} y={-300} width={2520} height={1500} fill="#CDBF9F" />
    {[300, 760, 1160, 1620].map((wx, i) => win(wx - 50, 160, 100, 300, 0.35, i))}
    <path d="M-300,640 H2220" stroke={INK} strokeWidth={5} />
    <rect x={-300} y={640} width={2520} height={600} fill="#A99272" />
    {/* pulpit */}
    <path d="M1260,640 V420 H1460 V640Z" fill="#7A5A3A" {...o(6)} />
    <rect x={1240} y={400} width={240} height={30} fill="#6B4A30" {...o(5)} />
    <path d="M1250,300 H1470 L1440,250 H1280Z" fill="#6B4A30" {...o(5)} />
    <circle cx={1360} cy={360} r={200} fill="#FFF0C4" opacity={0.08 + 0.02 * Math.sin(f / 50)} />
  </g>
);

/** Bonfire with a pile of wood; `size` scales the flames; `effigy` adds a generic straw figure (no face). */
export const Bonfire: React.FC<{x: number; y: number; f: number; size?: number; effigy?: number}> = ({x, y, f, size = 1, effigy = 0}) => (
  <g>
    <circle cx={x} cy={y - 120 * size} r={360 * size} fill="#FFB060" opacity={0.16 + 0.04 * Math.sin(f / 4)} />
    {effigy > 0 && (
      <g opacity={effigy} transform={`translate(${x},${y - 60 * size})`}>
        <line x1={0} y1={40} x2={0} y2={-330 * size} stroke="#5A4630" strokeWidth={12} />
        <path d={`M${-70 * size},${-230 * size} H${70 * size}`} stroke="#B89A5A" strokeWidth={22 * size} strokeLinecap="round" />
        <path d={`M${-40 * size},${-250 * size} L${-48 * size},${-110 * size} H${48 * size} L${40 * size},${-250 * size}Z`} fill="#C9A869" {...o(5)} />
        <circle cx={0} cy={-290 * size} r={42 * size} fill="#D8BE80" {...o(5)} />
        <path d={`M${-30 * size},${-300 * size} l60,-6 M${-24 * size},${-276 * size} l50,4`} stroke="#A88A50" strokeWidth={5} />
      </g>
    )}
    {[-1, 0, 1].map((k) => <Fire key={k} x={x + k * 70 * size} y={y - 20 * size} f={f + k * 7} s={size * (k === 0 ? 1.5 : 1.05)} seed={k + 3} />)}
    {Array.from({length: 9}, (_, i) => {
      const a = (i / 9) * Math.PI - Math.PI;
      return <line key={i} x1={x + Math.cos(a) * 30 * size} y1={y - 10} x2={x + Math.cos(a) * 190 * size} y2={y - 10 + Math.sin(a) * -10 + 30 * size} stroke="#4A3526" strokeWidth={18 * size} strokeLinecap="round" />;
    })}
    {Array.from({length: 16}, (_, i) => {
      const t = ((f * 1.3 + i * 23) % 120) / 120;
      return <circle key={'e' + i} cx={x + (hash(i) - 0.5) * 300 * size + noise1(t * 4 + i, 3) * 40} cy={y - 120 * size - t * 520 * size} r={4} fill={i % 2 ? C.fireYellow : C.fire} opacity={1 - t} />;
    })}
  </g>
);

/** A simple firework burst at (x, y) that blooms from frame `at` (period `every` frames, repeating). */
export const Firework: React.FC<{x: number; y: number; f: number; at: number; every?: number; color?: string; r?: number}> = ({x, y, f, at, every = 75, color = '#F2C14E', r = 120}) => {
  const lf = f - at;
  if (lf < 0) return null;
  const t = (lf % every) / every;
  if (t > 0.7) return null;
  const k = clamp(t / 0.7);
  return (
    <g opacity={1 - k}>
      {Array.from({length: 14}, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const d = r * Math.sqrt(k);
        return <line key={i} x1={x + Math.cos(a) * d * 0.6} y1={y + Math.sin(a) * d * 0.6 + k * 20} x2={x + Math.cos(a) * d} y2={y + Math.sin(a) * d + k * 30} stroke={color} strokeWidth={5} strokeLinecap="round" />;
      })}
    </g>
  );
};

/** Street ground with cobbles (y = kerb line). */
export const Cobbles: React.FC<{y: number; color?: string; night?: boolean}> = ({y, color = '#BAA68A', night}) => (
  <g>
    <rect x={-300} y={y} width={2520} height={1080 - y + 300} fill={night ? '#4D4A52' : color} />
    <line x1={-300} y1={y} x2={2220} y2={y} stroke={INK} strokeWidth={6} />
    {Array.from({length: 60}, (_, i) => <path key={i} d={`M${(i * 163) % 2100 - 100} ${y + 24 + ((i * 47) % 160)}q15 -5 29 0`} stroke={night ? '#3B3940' : '#97876F'} strokeWidth={3} fill="none" />)}
  </g>
);

/** Distant London roofline silhouette. */
export const Roofline: React.FC<{base: number; color: string; seed?: number}> = ({base, color, seed = 3}) => {
  const r = rng(seed);
  let d = `M-300,${base}`;
  let x = -300;
  while (x < 2300) {
    const w = 60 + r() * 120, h = 60 + r() * 140;
    if (r() > 0.85) d += ` L${x},${base - h} L${x + 10},${base - h - 120} L${x + 20},${base - h}`;
    d += ` L${x},${base - h} L${x + w / 2},${base - h - 50} L${x + w},${base - h}`;
    x += w;
  }
  d += ` L2300,${base}Z`;
  return <path d={d} fill={color} />;
};

/** Label on a set ("WESTMINSTER, 4 NOVEMBER 1605"): paper tag, upper right by default (logo stays clear). */
export const PlaceTag: React.FC<{text: string; sub?: string; t: number; x?: number; y?: number}> = ({text, sub, t, x = 1840, y = 70}) => {
  if (t <= 0) return null;
  const w = Math.max(text.length * 22, (sub?.length ?? 0) * 13.5) + 60;
  return (
    <g opacity={clamp(t * 2)} transform={`translate(${x - w + (1 - clamp(t)) * 40},${y})`}>
      <rect x={6} y={8} width={w} height={sub ? 92 : 62} rx={6} fill="rgba(0,0,0,0.3)" />
      <rect width={w} height={sub ? 92 : 62} rx={6} fill="#F1E6CB" stroke={INK} strokeWidth={4} />
      <text x={28} y={42} fontFamily={FONT.sans} fontWeight={900} fontSize={30} fill={INK} letterSpacing={1.5}>{text}</text>
      {sub && <text x={28} y={76} fontFamily={FONT.sans} fontWeight={700} fontSize={22} fill="#5A4A36">{sub}</text>}
    </g>
  );
};
