// Episode 4 sets: Indiana/Illinois woods (parallax planes), log-cabin interior, a Springfield house front
// with a working door, a lamp-lit office and a reception room. Generic period places: never labelled
// as a specific original building unless the storyboard sources it.
import React from 'react';
import {C} from '../styles/theme';
import {noise1, hash} from '../animations/core';
import {Fire, Smoke} from '../components/Effects';
import {Tree} from '../components/Environment';

const ink = C.ink;
const o = (w = 4) => ({stroke: ink, strokeWidth: w, strokeLinejoin: 'round' as const});

/** Sky gradient by time of day. */
export const SkyGrad: React.FC<{time: 'dawn' | 'day' | 'golden' | 'dusk' | 'night'; id: string}> = ({time, id}) => {
  const c = {dawn: ['#9AB0CC', '#F2C8B0'], day: ['#9CC4D8', '#E6EEE6'], golden: ['#E9B872', '#FBE3B0'], dusk: ['#4A5A84', '#D8907A'], night: ['#101A30', '#2A3A5A']}[time];
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c[0]} />
          <stop offset="1" stopColor={c[1]} />
        </linearGradient>
      </defs>
      <rect x={-800} y={-600} width={3520} height={2000} fill={`url(#${id})`} />
    </g>
  );
};

/** Far ridge line (a plane: put it on a low depth layer). */
export const Ridge: React.FC<{y: number; color: string; seed?: number; amp?: number}> = ({y, color, seed = 2, amp = 50}) => {
  const pts: string[] = [];
  for (let x = -900; x <= 2900; x += 60) pts.push(`${x},${y - Math.abs(noise1(x / 420, seed)) * amp - 20 * hash(x + seed)}`);
  return <path d={`M-900,1400 L${pts.join(' L')} L2900,1400Z`} fill={color} stroke={ink} strokeWidth={3} strokeLinejoin="round" />;
};

/** A row of trees (plane). */
export const TreeRow: React.FC<{y: number; f: number; n?: number; s?: number; color?: string; seed?: number; x0?: number; x1?: number; kind?: 'round' | 'pine' | 'bare'}> = ({y, f, n = 10, s = 1, color = C.grassDark, seed = 3, x0 = -700, x1 = 2600, kind = 'round'}) => (
  <g>
    {Array.from({length: n}, (_, i) => (
      <Tree key={i} x={x0 + ((x1 - x0) * (i + 0.5 * hash(i + seed))) / n} y={y + hash(i * 3 + seed) * 20} s={s * (0.8 + 0.4 * hash(i + seed * 7))} color={color} f={f} seed={i + seed} kind={kind} />
    ))}
  </g>
);

/** Clearing floor with grass tufts and a chopping area. */
export const Clearing: React.FC<{y: number; color?: string}> = ({y, color = '#9A8A50'}) => (
  <g>
    <rect x={-900} y={y} width={3800} height={900} fill={color} />
    <line x1={-900} y1={y} x2={2900} y2={y} stroke={ink} strokeWidth={5} />
    {Array.from({length: 40}, (_, i) => <path key={i} d={`M${-800 + i * 95},${y + 30 + (i % 5) * 26} l8,-18 l6,16 l7,-14`} stroke="#6E6232" strokeWidth={3} fill="none" />)}
  </g>
);

/** Stack of split rails (fence-rail pile). */
export const RailPile: React.FC<{x: number; y: number; n?: number}> = ({x, y, n = 5}) => (
  <g>
    {Array.from({length: n}, (_, i) => (
      <g key={i} transform={`translate(${x + (i % 2) * 20},${y - i * 22})`}>
        <path d="M-130,0 L130,-6 L126,-24 L-132,-18Z" fill="#9A7046" {...o(3)} />
        <path d="M-132,-18 L-130,0" stroke="#C49A62" strokeWidth={5} />
      </g>
    ))}
  </g>
);

/** Log-cabin interior: log walls, a stone hearth at `fireX`, a small window, packed-earth floor. */
export const CabinInterior: React.FC<{f: number; floor?: number; fireX?: number}> = ({f, floor = 860, fireX = 420}) => (
  <g>
    <rect x={-600} y={-400} width={3200} height={1900} fill="#5A3E28" />
    {Array.from({length: 16}, (_, i) => (
      <g key={i}>
        <rect x={-600} y={floor - 40 - i * 56} width={3200} height={50} rx={22} fill={i % 2 ? '#7A5536' : '#6E4C30'} stroke="#2A1C12" strokeWidth={3} />
        {Array.from({length: 7}, (_, k) => <line key={k} x1={-400 + k * 470 + (i % 3) * 60} y1={floor - 30 - i * 56} x2={-340 + k * 470 + (i % 3) * 60} y2={floor - 26 - i * 56} stroke="#3E2A1A" strokeWidth={2.5} />)}
      </g>
    ))}
    <rect x={1260} y={floor - 520} width={170} height={150} fill="#1A2440" {...o(6)} />
    <path d={`M1345,${floor - 520} V${floor - 370} M1260,${floor - 445} H1430`} stroke="#3A2A1A" strokeWidth={7} />
    {/* stone hearth and chimney */}
    <rect x={fireX - 190} y={floor - 640} width={380} height={640} fill="#8A847A" {...o(5)} />
    {Array.from({length: 22}, (_, i) => <rect key={i} x={fireX - 180 + (i % 4) * 92 + (Math.floor(i / 4) % 2) * 40} y={floor - 630 + Math.floor(i / 4) * 92} width={80} height={80} rx={14} fill="#9A9488" stroke="#5A564E" strokeWidth={2.5} />)}
    <path d={`M${fireX - 120},${floor} V${floor - 190} Q${fireX},${floor - 260} ${fireX + 120},${floor - 190} V${floor}Z`} fill="#1E1614" {...o(5)} />
    <Fire x={fireX} y={floor - 14} f={f} s={0.7} seed={3} />
    <path d={`M${fireX - 80},${floor - 10} H${fireX + 80}`} stroke="#3E2C20" strokeWidth={16} strokeLinecap="round" />
    <rect x={-600} y={floor} width={3200} height={700} fill="#6A5236" />
    <line x1={-600} y1={floor} x2={2600} y2={floor} stroke={ink} strokeWidth={6} />
  </g>
);

/** Cabin exterior (generic period cabin: never labelled as the original). */
export const CabinExterior: React.FC<{x: number; base: number; f: number; lit?: number}> = ({x, base, f, lit = 0.6}) => (
  <g>
    <rect x={x - 220} y={base - 210} width={440} height={210} fill="#7A5536" {...o(5)} />
    {Array.from({length: 6}, (_, i) => <line key={i} x1={x - 220} y1={base - 35 - i * 35} x2={x + 220} y2={base - 35 - i * 35} stroke="#3E2A1A" strokeWidth={3} />)}
    <path d={`M${x - 250},${base - 205} L${x},${base - 330} L${x + 250},${base - 205}Z`} fill="#5A4A3A" {...o(5)} />
    <rect x={x + 120} y={base - 380} width={60} height={160} fill="#8A847A" {...o(4)} />
    <Smoke x={x + 150} y={base - 380} f={f} n={6} size={0.8} seed={4} opacity={0.5} />
    <rect x={x - 40} y={base - 130} width={70} height={130} fill="#3A2818" {...o(4)} />
    <rect x={x + 70} y={base - 140} width={70} height={60} fill="#F2B04A" opacity={lit} {...o(4)} />
  </g>
);

/** Clapboard house front (Springfield, 1840s style) with a doorway opening at `doorX`. The door itself is
 *  drawn by <Door> from Props so its handle can be gripped. */
export const HouseFront: React.FC<{floor: number; doorX: number; lit?: number; dw?: number; dh?: number}> = ({floor, doorX, lit = 1, dw = 118, dh = 236}) => (
  <g>
    <rect x={-700} y={floor - 640} width={3400} height={640} fill="#C9B79A" stroke={ink} strokeWidth={5} />
    {Array.from({length: 20}, (_, i) => <line key={i} x1={-700} y1={floor - 30 - i * 32} x2={2700} y2={floor - 30 - i * 32} stroke="#A8957A" strokeWidth={3} />)}
    {[doorX - 560, doorX - 330, doorX + 400, doorX + 620].map((wx, i) => (
      <g key={i}>
        <rect x={wx} y={floor - 470} width={130} height={200} fill="#F2C060" opacity={0.25 + 0.6 * lit} {...o(5)} />
        <path d={`M${wx + 65},${floor - 470} V${floor - 270} M${wx},${floor - 370} H${wx + 130}`} stroke="#3A3A3A" strokeWidth={5} />
        <rect x={wx - 22} y={floor - 480} width={22} height={220} fill="#3E5A3E" {...o(3)} />
        <rect x={wx + 130} y={floor - 480} width={22} height={220} fill="#3E5A3E" {...o(3)} />
      </g>
    ))}
    <rect x={doorX - 26} y={floor - dh - 30} width={dw + 52} height={dh + 30} fill="#E6DCC4" {...o(4)} />
    <path d={`M${doorX - 40},${floor - dh - 30} H${doorX + dw + 40} L${doorX + dw + 20},${floor - dh - 56} H${doorX - 20}Z`} fill="#D8CCB0" {...o(4)} />
    <rect x={-700} y={floor} width={3400} height={500} fill="#8A7A62" />
    <rect x={doorX - 40} y={floor} width={200} height={18} fill="#9A9488" {...o(3)} />
    <line x1={-700} y1={floor} x2={2700} y2={floor} stroke={ink} strokeWidth={6} />
  </g>
);
/** Lamp-lit interior seen through the open doorway (drawn inside the doorway rect). */
export const DoorwayInterior: React.FC<{x: number; floor: number; w?: number; h?: number}> = ({x, floor, w = 118, h = 236}) => (
  <g>
    <rect x={x} y={floor - h} width={w} height={h} fill="#3A2A1E" />
    <rect x={x} y={floor - h * 0.22} width={w} height={h * 0.22} fill="#5A4030" />
    <ellipse cx={x + w * 0.6} cy={floor - h * 0.62} rx={w * 0.5} ry={h * 0.3} fill="#F2B04A" opacity={0.35} />
  </g>
);

/** Office / study: papered wall, wainscot, window, lamp. */
export const Study: React.FC<{f: number; floor?: number; windowX?: number; night?: boolean}> = ({f, floor = 880, windowX = 1300, night = false}) => (
  <g>
    <rect x={-700} y={-400} width={3400} height={1900} fill="#7E6A52" />
    {Array.from({length: 30}, (_, i) => <line key={i} x1={-600 + i * 110} y1={-400} x2={-600 + i * 110} y2={floor - 220} stroke="#6E5C46" strokeWidth={3} />)}
    <rect x={-700} y={floor - 220} width={3400} height={220} fill="#4E3A2A" stroke={ink} strokeWidth={4} />
    {Array.from({length: 18}, (_, i) => <rect key={i} x={-660 + i * 190} y={floor - 196} width={150} height={170} rx={4} fill="#5A4432" stroke="#2A1C14" strokeWidth={3} />)}
    <rect x={windowX} y={floor - 700} width={280} height={380} fill={night ? '#1A2440' : '#BFD4DC'} stroke={ink} strokeWidth={7} />
    <path d={`M${windowX + 140},${floor - 700} V${floor - 320} M${windowX},${floor - 510} H${windowX + 280}`} stroke="#3A2A1A" strokeWidth={8} />
    <path d={`M${windowX - 40},${floor - 720} Q${windowX - 20},${floor - 500} ${windowX - 30},${floor - 300} L${windowX + 40},${floor - 300} Q${windowX + 30},${floor - 520} ${windowX + 50},${floor - 720}Z`} fill="#6A2A24" {...o(3)} />
    <rect x={-700} y={floor} width={3400} height={600} fill="#5A4230" />
    {Array.from({length: 20}, (_, i) => <line key={i} x1={-600 + i * 180} y1={floor} x2={-800 + i * 210} y2={floor + 300} stroke="#3E2C20" strokeWidth={3} opacity={0.6} />)}
    <line x1={-700} y1={floor} x2={2700} y2={floor} stroke={ink} strokeWidth={6} />
  </g>
);

/** Oil lamp on a surface at (x, y). */
export const OilLamp: React.FC<{x: number; y: number; f: number; s?: number}> = ({x, y, f, s = 1}) => {
  const fl = 1 + noise1(f / 3, 9) * 0.1;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M-22,0 L-16,-30 L16,-30 L22,0Z" fill="#B08A3A" {...o(3)} />
      <path d="M-14,-30 Q-26,-62 -10,-88 L10,-88 Q26,-62 14,-30Z" fill="#F4E8C0" opacity={0.75} {...o(3)} />
      <path d={`M0,-40 q${-6 * fl},-12 0,${-24 * fl} q${6 * fl},12 0,${24 * fl}Z`} fill="#FFB43A" />
    </g>
  );
};

/** Writing slope (a sloped writing box on the desk) whose page faces the camera. Returns nothing else. */
export const WritingSlope: React.FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) => (
  <g>
    <path d={`M${x - 14},${y + h + 18} L${x + w + 14},${y + h + 18} L${x + w + 4},${y - 12} L${x - 4},${y - 12}Z`} fill="#6A4A30" {...o(4)} />
    <rect x={x} y={y} width={w} height={h} fill="#EFE2C2" stroke={ink} strokeWidth={3} />
  </g>
);

/** Reception room (White House East Room style, generic): pale walls, columns, a chandelier glow. */
export const ReceptionRoom: React.FC<{f: number; floor?: number}> = ({f, floor = 900}) => (
  <g>
    <rect x={-700} y={-400} width={3400} height={1900} fill="#D8CCB0" />
    {Array.from({length: 9}, (_, i) => (
      <g key={i}>
        <rect x={-560 + i * 420} y={-200} width={70} height={floor + 200} fill="#E8DEC6" {...o(4)} />
        <rect x={-580 + i * 420} y={floor - 60} width={110} height={60} fill="#CFC2A4" {...o(3)} />
      </g>
    ))}
    {Array.from({length: 8}, (_, i) => <rect key={i} x={-400 + i * 420} y={140} width={240} height={360} fill="#C9B07A" opacity={0.5} {...o(3)} />)}
    <circle cx={960} cy={60} r={180 + noise1(f / 20, 4) * 6} fill="#FFE6A8" opacity={0.18} />
    <rect x={-700} y={floor} width={3400} height={600} fill="#8A5A40" />
    {Array.from({length: 22}, (_, i) => <line key={i} x1={-600 + i * 160} y1={floor} x2={-900 + i * 200} y2={floor + 300} stroke="#6A4430" strokeWidth={3} opacity={0.6} />)}
    <line x1={-700} y1={floor} x2={2700} y2={floor} stroke={ink} strokeWidth={6} />
  </g>
);
