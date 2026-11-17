// Episode 2 (WW1) vehicles: V-01 1914 open touring car (+ escort colour, empty back seat close-up),
// V-02 rhomboid tank (Mark V style), V-03 U-boat periscope + torpedo wake + distant water column.
// Side view facing right (dir = -1 faces left).  `dist` = distance travelled in px (wheel/track
// rotation), so motion stays keyable: dist = x - x0.
import React from 'react';
import {C} from '../styles/theme';
import {clamp, easeOut, hash, noise1} from '../animations/core';
import {Smoke} from './Effects';
import {HatShape} from '../characters/Head';

const ink = C.ink;

// ================================================================== V-01 touring car
export const CAR_COLORS = {archduke: '#33503A', escort: '#2B2B30'};
/**
 * Seat anchors (car-local px at s = 1, facing right): the StickFigure (x, y) for a `seated` pose, i.e.
 * figure x = car.x + seat.x * s * dir, figure y = car.y + seat.y * s, figure scale = s.  Draw the
 * figures BETWEEN <TouringCar layer="back"> and <TouringCar layer="front"> so the doors hide their legs.
 */
export const CAR_SEATS = {driver: {x: 95, y: -58}, rearLeft: {x: -150, y: -64}, rearRight: {x: -70, y: -64}};

export type TouringCarProps = {
  x: number;
  /** Ground line (bottom of the wheels). */
  y: number;
  dist: number;
  s?: number;
  dir?: 1 | -1;
  f?: number;
  color?: string;
  /** 'back' (far-side bodywork, seats), 'front' (doors, wheels, bonnet, flags) or 'all'. */
  layer?: 'back' | 'front' | 'all';
  /** 0..1 turn-in: the car swings away (three-quarter view, foreshortened) for the turn into the side street. */
  turn?: number;
  /** 0..1 engine stall: a judder and a puff of exhaust, then still. */
  stall?: number;
  /** Two small pennants on the front wings (true by default). */
  pennants?: boolean;
  /** Engine running (exhaust puffs). */
  running?: boolean;
};

const Wheel: React.FC<{cx: number; r: number; rot: number}> = ({cx, r, rot}) => (
  <g transform={`translate(${cx},${-r}) rotate(${rot})`}>
    <circle r={r} fill="#2A2A2A" stroke={ink} strokeWidth={5} />
    <circle r={r - 9} fill="#C9B88E" stroke={ink} strokeWidth={3} />
    {Array.from({length: 12}).map((_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <line key={i} x1={0} y1={0} x2={Math.cos(a) * (r - 10)} y2={Math.sin(a) * (r - 10)} stroke="#6B5A3A" strokeWidth={3} />;
    })}
    <circle r={9} fill="#6B5A3A" stroke={ink} strokeWidth={3} />
  </g>
);

/** 1914 open touring car (long bonnet, spoked wheels, running boards, folded hood, pennants). */
export const TouringCar: React.FC<TouringCarProps> = ({x, y, dist, s = 1, dir = 1, f = 0, color = CAR_COLORS.archduke, layer = 'all', turn = 0, stall = 0, pennants = true, running = true}) => {
  const rot = (dist / 46) * (180 / Math.PI);
  const t = clamp(turn);
  const judder = stall > 0 && stall < 0.6 ? Math.sin(f * 2.1) * 3 * (1 - stall / 0.6) : 0;
  const bob = running && stall < 0.6 ? Math.sin(f / 3) * 1.2 : 0;
  const sx = 1 - 0.42 * easeOut(t); // foreshortening as it turns away
  const dark = (k: number) => {
    const n = parseInt(color.slice(1), 16);
    const ch = (sh: number) => Math.round(((n >> sh) & 255) * k);
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  };
  const back = (
    <g>
      {/* folded hood at the back, far-side body, seat backs */}
      <path d="M-260,-150 Q-262,-196 -214,-200 L-176,-200 Q-196,-186 -198,-150Z" fill="#3A342C" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M-250,-176 L-205,-176 M-252,-162 L-202,-162" stroke="#5A5246" strokeWidth={3} />
      <rect x={-205} y={-170} width={190} height={44} rx={10} fill={dark(0.7)} stroke={ink} strokeWidth={4} />
      <rect x={-196} y={-196} width={30} height={78} rx={8} fill="#5A3A2A" stroke={ink} strokeWidth={4} />
      <rect x={52} y={-176} width={26} height={60} rx={8} fill="#5A3A2A" stroke={ink} strokeWidth={4} />
      {/* windscreen */}
      <path d="M134,-128 L150,-206 L158,-206 L144,-128Z" fill="#B9D0D6" stroke={ink} strokeWidth={3.5} opacity={0.85} />
      {/* steering wheel */}
      <ellipse cx={128} cy={-150} rx={8} ry={20} fill="none" stroke={ink} strokeWidth={4} transform="rotate(-25,128,-150)" />
      <line x1={128} y1={-150} x2={150} y2={-118} stroke={ink} strokeWidth={4} />
    </g>
  );
  const front = (
    <g>
      {/* body: rear tonneau, doors, scuttle, long bonnet, radiator */}
      <path d="M-250,-60 L-250,-128 Q-250,-150 -226,-150 L-30,-148 L-20,-128 L40,-128 L52,-150 L140,-128 L330,-122 L330,-60Z" fill={color} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
      <path d="M150,-124 L330,-118 L330,-92 L150,-96Z" fill={dark(0.82)} stroke={ink} strokeWidth={3.5} />
      {[180, 210, 240, 270, 300].map((lx) => <line key={lx} x1={lx} y1={-110} x2={lx} y2={-98} stroke={ink} strokeWidth={3} />)}
      <rect x={326} y={-132} width={22} height={74} rx={5} fill="#B8A06A" stroke={ink} strokeWidth={4} />
      <line x1={-150} y1={-140} x2={-150} y2={-66} stroke={ink} strokeWidth={3} opacity={0.6} />
      <line x1={40} y1={-126} x2={40} y2={-66} stroke={ink} strokeWidth={3} opacity={0.6} />
      <circle cx={-110} cy={-104} r={5} fill="#B8A06A" stroke={ink} strokeWidth={2} />
      {/* headlamp */}
      <circle cx={344} cy={-140} r={14} fill="#E8E2C8" stroke={ink} strokeWidth={4} />
      {/* mudguards + running board */}
      <path d="M-276,-60 Q-262,-122 -190,-122 Q-130,-122 -112,-62" fill={dark(0.6)} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
      <path d="M150,-60 Q170,-122 236,-122 Q300,-122 322,-62" fill={dark(0.6)} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
      <rect x={-118} y={-66} width={272} height={14} rx={4} fill="#3A3A36" stroke={ink} strokeWidth={4} />
      <Wheel cx={-192} r={56} rot={rot} />
      <Wheel cx={236} r={56} rot={rot} />
      {/* pennants on the front wings (plain yellow-and-black pennants, no emblem) */}
      {pennants &&
        [190, 286].map((px, i) => {
          const w = Math.sin(f / 4 + i) * 6;
          return (
            <g key={px}>
              <line x1={px} y1={-122} x2={px} y2={-190} stroke={ink} strokeWidth={4} />
              <path d={`M${px},-190 Q${px - 22},${-184 + w} ${px - 48},${-176 + w * 1.4} L${px},-166Z`} fill="#E2B23C" stroke={ink} strokeWidth={3} strokeLinejoin="round" />
              <path d={`M${px},-178 L${px - 30},${-174 + w}`} stroke="#2A2A2A" strokeWidth={5} />
            </g>
          );
        })}
      {running && stall < 0.95 && <Smoke x={-262} y={-40} f={f} n={5} size={10 + stall * 14} rise={30} drift={-90} color="#8A8A86" opacity={0.45 + stall * 0.3} outline={false} seed={3} />}
    </g>
  );
  return (
    <g transform={`translate(${x + judder},${y + bob}) scale(${s * dir * sx},${s})`}>
      {layer !== 'front' && back}
      {layer !== 'back' && front}
    </g>
  );
};

/** Static close-up of the empty back seat with the plumed hat lying on it (S03-02). desat 0..1 greys it. */
export const EmptyBackSeat: React.FC<{f: number; desat?: number; hat?: boolean; color?: string}> = ({f, desat = 0.3, hat = true, color = CAR_COLORS.archduke}) => {
  const k = clamp(desat);
  const leather = k > 0 ? `rgb(${Math.round(110 - 20 * k)},${Math.round(62 + 10 * k)},${Math.round(44 + 20 * k)})` : '#6E3E2C';
  return (
    <g>
      <rect x={-100} y={-100} width={2120} height={1280} fill="#C9C2AE" />
      {/* street beyond (soft, out of focus) */}
      <rect x={-100} y={-100} width={2120} height={520} fill="#D9CFB4" opacity={0.8} />
      {[120, 520, 980, 1420].map((x, i) => <rect key={i} x={x} y={40} width={300} height={380} fill={['#E2D3A8', '#D8C090', '#E6D9B6', '#CDB98A'][i]} opacity={0.6} />)}
      {/* seat back: tufted leather */}
      <rect x={260} y={300} width={1400} height={360} rx={50} fill={leather} stroke={ink} strokeWidth={8} />
      {Array.from({length: 3}).map((_, r) =>
        Array.from({length: 9}).map((__, c) => <circle key={`${r}${c}`} cx={380 + c * 145 + (r % 2) * 72} cy={380 + r * 95} r={9} fill="#3E2216" />),
      )}
      {/* cushion */}
      <path d="M220,660 Q960,610 1700,660 L1740,820 Q960,860 180,820Z" fill={leather} stroke={ink} strokeWidth={8} strokeLinejoin="round" />
      <path d="M260,700 Q960,660 1660,700" fill="none" stroke="#3E2216" strokeWidth={4} opacity={0.5} />
      {/* door + body side in front */}
      <path d="M-100,840 L2020,840 L2020,1180 L-100,1180Z" fill={color} stroke={ink} strokeWidth={8} />
      <rect x={-100} y={828} width={2120} height={26} fill="#B8A06A" stroke={ink} strokeWidth={6} />
      {/* the archduke's hat (green plumes) lying on the seat */}
      {hat && (
        <g transform={`translate(1180,${700 + Math.sin(f / 60) * 1}) rotate(-12) scale(3.2)`}>
          <HatShape hat="plumedHat" color="#2A2A2A" />
        </g>
      )}
      <rect x={-100} y={-100} width={2120} height={1280} fill="#7A8090" opacity={0.18 * k} />
    </g>
  );
};

// ================================================================== V-02 rhomboid tank
export const TANK_DEPTH = {near: {s: 1, silhouette: 0}, mid: {s: 0.55, silhouette: 0.35}, far: {s: 0.3, silhouette: 0.75}};
/** Rhomboid hull outline (track runs round the whole body). Local coords, facing right, ground at y = 0. */
const HULL = 'M-300,-40 L-240,-180 L150,-196 Q250,-190 300,-110 L330,-40 Q300,0 250,0 L-250,0 Q-300,0 -300,-40Z';
export type RhomboidTankProps = {x: number; y: number; dist: number; s?: number; dir?: 1 | -1; f?: number; color?: string; exhaust?: boolean; silhouette?: number; mistColor?: string};
/** WW1 rhomboid tank (Mark V style): track round the hull, side sponson with a short gun, top cab, exhaust. */
export const RhomboidTank: React.FC<RhomboidTankProps> = ({x, y, dist, s = 1, dir = 1, f = 0, color = '#7A6A48', exhaust = true, silhouette = 0, mistColor = '#B9BCB4'}) => {
  const bob = Math.sin(dist / 18) * 1.5;
  const sil = clamp(silhouette);
  const body = sil > 0 ? mixHex(color, mistColor, sil) : color;
  const dark = sil > 0 ? mixHex('#4A402C', mistColor, sil) : '#4A402C';
  const st = 5 / Math.max(0.6, s);
  return (
    <g transform={`translate(${x},${y + bob}) scale(${s * dir},${s})`}>
      {exhaust && <Smoke x={-150} y={-250} f={f} n={7} size={22} rise={150} drift={-140} color={sil > 0.5 ? mixHex('#6A6A66', mistColor, sil * 0.6) : '#5A5A56'} opacity={0.6 * (1 - sil * 0.5)} outline={false} seed={Math.round(x) % 9} />}
      {/* exhaust pipe + cab */}
      <rect x={-160} y={-252} width={16} height={60} fill={dark} stroke={ink} strokeWidth={st} />
      <path d="M40,-196 L60,-246 L170,-246 L190,-196Z" fill={body} stroke={ink} strokeWidth={st} strokeLinejoin="round" />
      <rect x={80} y={-236} width={26} height={14} fill="#2A2A26" />
      <rect x={124} y={-236} width={26} height={14} fill="#2A2A26" />
      {/* track: dark band round the hull with moving links */}
      <path d={HULL} fill={dark} stroke={ink} strokeWidth={st * 1.2} strokeLinejoin="round" />
      <path d={HULL} fill="none" stroke={sil > 0.5 ? mixHex('#8A7A5A', mistColor, sil) : '#8A7A5A'} strokeWidth={14} strokeDasharray="10 16" strokeDashoffset={-dist} strokeLinejoin="round" transform="scale(0.985)" />
      {/* inner hull side plate */}
      <path d="M-262,-46 L-214,-160 L140,-172 Q222,-166 262,-104 L286,-48 Q262,-24 230,-24 L-232,-24 Q-262,-24 -262,-46Z" fill={body} stroke={ink} strokeWidth={st} strokeLinejoin="round" />
      {Array.from({length: 9}).map((_, i) => <circle key={i} cx={-200 + i * 52} cy={-150 + (i > 6 ? (i - 6) * 10 : 0)} r={4} fill={ink} opacity={0.5} />)}
      {/* sponson with a short gun barrel */}
      <path d="M-70,-140 L60,-140 L80,-80 L-90,-80Z" fill={body} stroke={ink} strokeWidth={st} strokeLinejoin="round" />
      <rect x={70} y={-122} width={70} height={16} rx={4} fill={dark} stroke={ink} strokeWidth={st * 0.8} />
      <rect x={-40} y={-128} width={30} height={16} fill="#2A2A26" />
      {/* road wheels (rotate with distance) */}
      {Array.from({length: 7}).map((_, i) => (
        <g key={i} transform={`translate(${-210 + i * 72},-12) rotate(${(dist / 14) * (180 / Math.PI)})`}>
          <circle r={11} fill={dark} stroke={ink} strokeWidth={3} />
          <line x1={-8} y1={0} x2={8} y2={0} stroke={ink} strokeWidth={2.5} />
        </g>
      ))}
      {/* mud on the tracks */}
      {[-240, -40, 180].map((mx, i) => <ellipse key={i} cx={mx + (hash(i) - 0.5) * 30} cy={-4} rx={30} ry={7} fill="#5E5040" opacity={0.7 * (1 - sil)} />)}
    </g>
  );
};
function mixHex(a: string, b: string, t: number) {
  const A = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const B = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * clamp(t)).toString(16).padStart(2, '0')).join('');
}

// ================================================================== V-03 periscope, torpedo wake, water column
/** U-boat periscope head cutting the water at (x, waterline y), with a white feather wake trailing behind. */
export const Periscope: React.FC<{x: number; y: number; f: number; s?: number; dir?: 1 | -1; wake?: boolean; height?: number}> = ({x, y, f, s = 1, dir = 1, wake = true, height = 1}) => {
  const h = 110 * clamp(height);
  const bob = Math.sin(f / 9) * 3;
  return (
    <g transform={`translate(${x},${y + bob}) scale(${s * dir},${s})`}>
      {wake && (
        <g>
          {Array.from({length: 9}).map((_, i) => {
            const t = ((f * 0.9 + i * 14) % 126) / 126;
            const wx = -10 - t * 260;
            const spread = 6 + t * 46;
            return <path key={i} d={`M${wx},${-2 - spread * 0.25} q-22,${spread * 0.25} -44,0 M${wx},${2 + spread * 0.25} q-22,${-spread * 0.1} -44,0`} stroke="#F4F7F8" strokeWidth={4 * (1 - t) + 1} fill="none" opacity={(1 - t) * 0.9} strokeLinecap="round" />;
          })}
          <path d={`M10,0 Q-6,-14 -26,-8 Q-6,${-4 + Math.sin(f / 3) * 2} 10,0Z`} fill="#F4F7F8" stroke={ink} strokeWidth={2} />
          <path d={`M10,0 Q-6,10 -30,8 Q-8,${4 + Math.sin(f / 4) * 2} 10,0Z`} fill="#E6EEF0" stroke={ink} strokeWidth={2} />
        </g>
      )}
      {h > 0 && (
        <g>
          <rect x={-6} y={-h} width={12} height={h} fill="#4E5458" stroke={ink} strokeWidth={4} />
          <path d={`M-9,${-h} L-9,${-h - 22} L16,${-h - 22} L12,${-h}Z`} fill="#4E5458" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
          <rect x={6} y={-h - 18} width={8} height={11} fill="#9FB8C2" stroke={ink} strokeWidth={2} />
        </g>
      )}
    </g>
  );
};

/** Torpedo wake: a thin white streak with bubbles from (x0, y0) towards (x1, y1); progress 0..1 = head position. */
export const TorpedoWake: React.FC<{x0: number; y0: number; x1: number; y1: number; progress: number; f: number; fade?: number}> = ({x0, y0, x1, y1, progress, f, fade = 0}) => {
  const p = clamp(progress);
  if (p <= 0) return null;
  const hx = x0 + (x1 - x0) * p;
  const hy = y0 + (y1 - y0) * p;
  const len = Math.hypot(hx - x0, hy - y0);
  const ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
  return (
    <g opacity={1 - clamp(fade)} transform={`translate(${x0},${y0}) rotate(${ang})`}>
      <path d={`M0,0 L${len},0`} stroke="#F4F7F8" strokeWidth={7} strokeLinecap="round" opacity={0.85} />
      <path d={`M0,0 L${len},0`} stroke="#DDE7EA" strokeWidth={16} strokeLinecap="round" opacity={0.3} />
      {Array.from({length: Math.max(1, Math.floor(len / 26))}).map((_, i) => {
        const bx = i * 26 + ((f * 2) % 26);
        if (bx > len) return null;
        const r = 2.5 + noise1(i + f / 10, 3) * 1.5 + 2;
        return <circle key={i} cx={bx} cy={(hash(i) - 0.5) * 12} r={r} fill="#fff" stroke={ink} strokeWidth={1} opacity={0.8 * (0.4 + bx / Math.max(1, len) * 0.6)} />;
      })}
      <circle cx={len} cy={0} r={6} fill="#fff" opacity={0.9} />
    </g>
  );
};

/** Distant water column at a ship's hull (x, waterline y): rises and falls with progress 0..1. No fire. */
export const WaterColumn: React.FC<{x: number; y: number; progress: number; s?: number}> = ({x, y, progress, s = 1}) => {
  const p = clamp(progress);
  if (p <= 0 || p >= 1) return null;
  const rise = Math.sin(Math.min(1, p / 0.45) * (Math.PI / 2));
  const fall = p > 0.45 ? (p - 0.45) / 0.55 : 0;
  const h = 260 * rise * (1 - fall * 0.5);
  const w = 60 + 70 * p;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={1 - fall * 0.8}>
      <path d={`M${-w / 2},0 Q${-w * 0.4},${-h * 0.6} ${-w * 0.2},${-h} Q0,${-h - 30} ${w * 0.2},${-h} Q${w * 0.4},${-h * 0.6} ${w / 2},0Z`} fill="#F1F5F6" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      {Array.from({length: 8}).map((_, i) => {
        const a = -Math.PI / 2 + (i - 3.5) * 0.28;
        const r = h * (0.5 + 0.5 * hash(i));
        return <circle key={i} cx={Math.cos(a) * r * 0.4} cy={-h * 0.4 + Math.sin(a) * r * 0.5 + fall * 80} r={8 + hash(i + 3) * 10} fill="#E6EEF0" stroke={ink} strokeWidth={2} opacity={0.9} />;
      })}
      <ellipse cx={0} cy={4} rx={w * 0.9} ry={12} fill="#F4F7F8" opacity={0.7} />
    </g>
  );
};
