// Big round white cartoon head with expressive eyes, brows and mouth,
// plus hairstyles, facial hair and headwear for different historical periods.
import React from 'react';
import {C} from '../styles/theme';
import {hash, noise1} from '../animations/core';

export type Expression =
  | 'neutral' | 'happy' | 'joy' | 'angry' | 'furious' | 'sad' | 'grief' | 'scared'
  | 'surprised' | 'determined' | 'sleepy' | 'smug' | 'worried' | 'cold' | 'shout'
  // sombre set (no cartoon marks): tired = heavy half-closed lids; solemn = still, closed mouth
  | 'tired' | 'solemn'
  // branding / all-period additions: curious = raised brows, small smile
  | 'curious'
  // ep02 (WW1): stare = wide fixed eyes, flat brows, flat mouth (shell shock; no cartoon marks)
  | 'stare';

export type Hair =
  | 'none' | 'spiky' | 'mop' | 'short' | 'side' | 'slick' | 'swept' | 'bald' | 'baldFringe'
  | 'bob' | 'bun' | 'curly' | 'crew' | 'long';

export type Hat =
  | 'none' | 'brodie' | 'stahlhelm' | 'm1' | 'adrian' | 'sovietHelmet' | 'ushanka' | 'pickelhaube'
  | 'officerCap' | 'beret' | 'flatCap' | 'fedora' | 'sidecap' | 'headscarf' | 'tophat' | 'sailor' | 'pilot' | 'stripedCap'
  // ep01 additions
  | 'jpFieldCap' // Imperial Japanese Army field cap with neck flaps
  | 'jpHelmet' // Type 90-style rounded helmet (plain, no emblem)
  | 'chineseCap' // NRA soft peaked cap
  | 'kepi' // plain brown party cap (no emblem)
  | 'slouch' // Australian slouch hat, brim pinned up on one side
  | 'm1Camo' // US M1 helmet with a camouflage cover (Marines)
  | 'nurseCap'
  // all-period additions (channel branding, Rome and later episodes)
  | 'laurel' // Roman laurel wreath (hair shows)
  | 'hood' // medieval hood with a short cape and a hanging tail (liripipe)
  | 'tricorn' // 18th-century three-cornered hat
  | 'bonnet' // Victorian bonnet with a ribbon under the chin
  | 'baseballCap' // modern cap with a forward peak
  // ep02 (WW1) additions
  | 'serviceCap' // soft peaked service cap (British 1914 SD cap, Russian furazhka): band in `accent`, leather peak
  | 'kepi1914' // French 1914 kepi: crown in `color` (red), band in `accent` (dark blue), black peak
  | 'feldkappe' // Austro-Hungarian soft field cap with buttoned front flap
  | 'kabalak' // Ottoman wrapped-cloth "Enveriye"/kabalak helmet
  | 'papakha' // Russian fur hat (winter)
  | 'mobCap' // munitionette's gathered mob cap
  | 'vadVeil' // VAD nurse's white headdress veil hanging at the back
  | 'plumedHat' // Austrian general's hat with green plumes (Franz Ferdinand)
  | 'pagri' // Indian Army wrapped turban: layered dome, neat front crossing, small fan (turra) and tail at the back
  | 'wideBrim'; // Edwardian summer hat with a wide brim and a band (Sophie, 1914); hair shows below

export type FacialHair = 'none' | 'toothbrush' | 'walrus' | 'kaiser' | 'handlebar' | 'thin' | 'bushy' | 'stubble'
  | 'goatee' // ep02: small moustache + short pointed chin beard (Lenin)
  | 'shortBeard'; // ep02: short full beard along the jaw + moustache (Tsar Nicholas II)

export type HeadSpec = {
  hair?: Hair;
  hairColor?: string;
  hat?: Hat;
  hatColor?: string;
  facial?: FacialHair;
  facialColor?: string;
  glasses?: 'none' | 'round' | 'pince' | 'dark';
  expression?: Expression;
  wide?: number; // head width multiplier
  hatAccent?: string; // band colour for officerCap / chineseCap / kepi / fedora
  chinStrap?: boolean; // helmet chin strap (paratroopers)
  hatBadge?: 'none' | 'redcross'; // medic helmet: red cross on a white disc
  gasMask?: boolean | string; // WW1 respirator over the face (string = facepiece colour); brows stay visible
};

type Props = HeadSpec & {
  r: number;
  f: number;
  seed: number;
  turn?: number; // -1..1 face turned left/right
  look?: [number, number]; // gaze offset -1..1
  talking?: boolean;
  blink?: boolean; // allow automatic blinking
  angerMark?: boolean;
  sweat?: boolean;
  tear?: boolean;
  eyesClosed?: boolean; // closed "u" eyes (prayer, grief, bowed head)
  back?: boolean; // seen from behind: no face, hair covers the back of the head
  lod?: 'full' | 'low'; // low = crowd detail level (no highlights, glasses or marks)
};

const ink = C.ink;
// hats that leave the hairstyle visible
const HAIR_SHOWS: Hat[] = ['beret', 'flatCap', 'sidecap', 'fedora', 'nurseCap', 'laurel', 'baseballCap', 'tricorn', 'wideBrim'];

function hairShape(h: Hair, R: number, color: string, f: number, seed: number, lowBun = false) {
  const sw = R * 0.1;
  switch (h) {
    case 'spiky': {
      // reference-style spiky crown
      const pts: string[] = [];
      const n = 15;
      for (let i = 0; i <= n; i++) {
        const a = Math.PI * (1.05 + (i / n) * 0.9);
        const rr = i % 2 === 0 ? R * 1.0 : R * (1.32 + hash(i + seed) * 0.12);
        pts.push(`${Math.cos(a) * rr},${Math.sin(a) * rr - (i % 2 ? R * 0.05 : 0)}`);
      }
      return (
        <g>
          <path d={`M${-R * 0.98},${-R * 0.1} L${pts.join(' L')} L${R * 0.98},${-R * 0.1} Q0,${-R * 0.55} ${-R * 0.98},${-R * 0.1}Z`} fill={color} stroke={ink} strokeWidth={sw * 0.4} strokeLinejoin="round" />
        </g>
      );
    }
    case 'mop':
      return (
        <path
          d={`M${-R * 1.05},${R * 0.05} C${-R * 1.2},${-R * 0.9} ${-R * 0.5},${-R * 1.35} ${R * 0.1},${-R * 1.2} C${R * 0.8},${-R * 1.25} ${R * 1.25},${-R * 0.7} ${R * 1.05},${R * 0.05}
          L${R * 0.85},${-R * 0.25} L${R * 0.7},${-R * 0.05} L${R * 0.55},${-R * 0.4} L${R * 0.3},${-R * 0.2} L${R * 0.1},${-R * 0.45} L${-R * 0.15},${-R * 0.22} L${-R * 0.35},${-R * 0.42} L${-R * 0.6},${-R * 0.18} L${-R * 0.8},${-R * 0.35} Z`}
          fill={color}
        />
      );
    case 'short':
      return <path d={`M${-R * 1.0},${-R * 0.12} C${-R * 1.05},${-R * 1.1} ${R * 1.05},${-R * 1.1} ${R * 1.0},${-R * 0.12} C${R * 0.6},${-R * 0.55} ${-R * 0.6},${-R * 0.55} ${-R * 1.0},${-R * 0.12}Z`} fill={color} />;
    case 'crew':
      return <path d={`M${-R * 0.95},${-R * 0.3} C${-R * 0.9},${-R * 1.08} ${R * 0.9},${-R * 1.08} ${R * 0.95},${-R * 0.3} C${R * 0.5},${-R * 0.7} ${-R * 0.5},${-R * 0.7} ${-R * 0.95},${-R * 0.3}Z`} fill={color} />;
    case 'side':
      // side parting with a heavy fringe swept across the forehead
      return (
        <path
          d={`M${-R * 1.0},${-R * 0.05} C${-R * 1.1},${-R * 1.05} ${R * 0.9},${-R * 1.2} ${R * 1.02},${-R * 0.2} L${R * 0.75},${-R * 0.42} C${R * 0.2},${-R * 0.55} ${-R * 0.2},${-R * 0.42} ${-R * 0.55},${-R * 0.12} C${-R * 0.7},${-R * 0.25} ${-R * 0.85},${-R * 0.2} ${-R * 1.0},${-R * 0.05}Z`}
          fill={color}
        />
      );
    case 'slick':
      return <path d={`M${-R * 1.0},${-R * 0.15} C${-R * 1.0},${-R * 1.12} ${R * 1.0},${-R * 1.12} ${R * 1.0},${-R * 0.15} C${R * 0.7},${-R * 0.62} ${-R * 0.2},${-R * 0.75} ${-R * 0.35},${-R * 0.55} C${-R * 0.55},${-R * 0.45} ${-R * 0.8},${-R * 0.35} ${-R * 1.0},${-R * 0.15}Z`} fill={color} />;
    case 'swept':
      return <path d={`M${-R * 1.02},${-R * 0.1} C${-R * 1.15},${-R * 1.2} ${R * 1.15},${-R * 1.25} ${R * 1.02},${-R * 0.1} C${R * 0.6},${-R * 0.72} ${-R * 0.6},${-R * 0.72} ${-R * 1.02},${-R * 0.1}Z`} fill={color} />;
    case 'bald':
      return (
        <g>
          <path d={`M${-R * 0.98},${-R * 0.05} q${-R * 0.12},${-R * 0.3} ${R * 0.08},${-R * 0.5} q${-R * 0.02},${R * 0.3} ${R * 0.05},${R * 0.45}Z`} fill={color} />
          <path d={`M${R * 0.98},${-R * 0.05} q${R * 0.12},${-R * 0.3} ${-R * 0.08},${-R * 0.5} q${R * 0.02},${R * 0.3} ${-R * 0.05},${R * 0.45}Z`} fill={color} />
          <path d={`M${-R * 0.1},${-R * 0.98} q${R * 0.15},${-R * 0.25} ${R * 0.3},${-R * 0.05}`} stroke={color} strokeWidth={R * 0.05} fill="none" strokeLinecap="round" />
        </g>
      );
    case 'baldFringe':
      return (
        <g>
          <path d={`M${-R * 1.0},${R * 0.05} C${-R * 1.05},${-R * 0.55} ${-R * 0.7},${-R * 0.7} ${-R * 0.55},${-R * 0.72} C${-R * 0.75},${-R * 0.45} ${-R * 0.85},${-R * 0.2} ${-R * 0.8},${R * 0.05}Z`} fill={color} />
          <path d={`M${R * 1.0},${R * 0.05} C${R * 1.05},${-R * 0.55} ${R * 0.7},${-R * 0.7} ${R * 0.55},${-R * 0.72} C${R * 0.75},${-R * 0.45} ${R * 0.85},${-R * 0.2} ${R * 0.8},${R * 0.05}Z`} fill={color} />
        </g>
      );
    case 'bob':
      return (
        <path
          d={`M${-R * 1.12},${R * 0.55} C${-R * 1.3},${-R * 0.9} ${-R * 0.5},${-R * 1.3} ${0},${-R * 1.18} C${R * 0.5},${-R * 1.3} ${R * 1.3},${-R * 0.9} ${R * 1.12},${R * 0.55} L${R * 0.82},${R * 0.5} C${R * 0.92},${-R * 0.1} ${R * 0.6},${-R * 0.42} ${R * 0.1},${-R * 0.52} C${-R * 0.4},${-R * 0.35} ${-R * 0.8},${-R * 0.2} ${-R * 0.82},${R * 0.5}Z`}
          fill={color}
        />
      );
    case 'bun':
      return (
        <g>
          {/* lowBun: chignon at the back of the head, under a wide hat brim */}
          <circle cx={lowBun ? -R * 0.92 : R * 0.05} cy={lowBun ? -R * 0.32 : -R * 1.15} r={R * 0.32} fill={color} />
          <path d={`M${-R * 1.02},${-R * 0.0} C${-R * 1.1},${-R * 1.15} ${R * 1.1},${-R * 1.15} ${R * 1.02},${-R * 0.0} C${R * 0.7},${-R * 0.55} ${-R * 0.7},${-R * 0.55} ${-R * 1.02},${-R * 0.0}Z`} fill={color} />
        </g>
      );
    case 'curly': {
      const circles = [];
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (1.0 + (i / 8) * 1.0);
        circles.push(<circle key={i} cx={Math.cos(a) * R * 0.92} cy={Math.sin(a) * R * 0.92} r={R * 0.3} fill={color} />);
      }
      return <g>{circles}</g>;
    }
    case 'long':
      return (
        <path
          d={`M${-R * 1.1},${R * 1.1} C${-R * 1.35},${-R * 0.9} ${-R * 0.5},${-R * 1.3} 0,${-R * 1.18} C${R * 0.5},${-R * 1.3} ${R * 1.35},${-R * 0.9} ${R * 1.1},${R * 1.1} L${R * 0.82},${R * 1.0} C${R * 0.92},${-R * 0.1} ${R * 0.6},${-R * 0.42} ${R * 0.1},${-R * 0.52} C${-R * 0.4},${-R * 0.35} ${-R * 0.8},${-R * 0.2} ${-R * 0.82},${R * 1.0}Z`}
          fill={color}
        />
      );
    default:
      return null;
  }
}

function hatShape(h: Hat, R: number, color: string, accent?: string) {
  const s = R * 0.08;
  const o = {stroke: ink, strokeWidth: s, strokeLinejoin: 'round' as const};
  switch (h) {
    case 'brodie': // British "soup bowl" helmet
      return (
        <g>
          <ellipse cx={0} cy={-R * 0.55} rx={R * 1.55} ry={R * 0.22} fill={color} {...o} />
          <path d={`M${-R * 0.85},${-R * 0.55} C${-R * 0.85},${-R * 1.35} ${R * 0.85},${-R * 1.35} ${R * 0.85},${-R * 0.55}Z`} fill={color} {...o} />
          <path d={`M${-R * 0.8},${-R * 0.5} L${-R * 0.55},${R * 0.75}`} stroke={C.darkBrown} strokeWidth={R * 0.06} />
        </g>
      );
    case 'stahlhelm':
      return (
        <g>
          <path d={`M${-R * 1.12},${R * 0.15} L${-R * 1.05},${-R * 0.35} C${-R * 1.05},${-R * 1.35} ${R * 1.05},${-R * 1.35} ${R * 1.05},${-R * 0.35} L${R * 1.12},${R * 0.15} L${R * 0.9},${R * 0.1} L${R * 0.85},${-R * 0.25} L${-R * 0.85},${-R * 0.25} L${-R * 0.9},${R * 0.1}Z`} fill={color} {...o} />
        </g>
      );
    case 'm1':
      return (
        <g>
          <path d={`M${-R * 1.12},${-R * 0.15} C${-R * 1.1},${-R * 1.4} ${R * 1.1},${-R * 1.4} ${R * 1.12},${-R * 0.15} Q0,${-R * 0.3} ${-R * 1.12},${-R * 0.15}Z`} fill={color} {...o} />
          <path d={`M${-R * 0.95},${-R * 0.2} L${-R * 0.7},${R * 0.8}`} stroke={C.darkBrown} strokeWidth={R * 0.05} />
        </g>
      );
    case 'adrian':
      return (
        <g>
          <ellipse cx={0} cy={-R * 0.42} rx={R * 1.25} ry={R * 0.18} fill={color} {...o} />
          <path d={`M${-R * 0.9},${-R * 0.42} C${-R * 0.9},${-R * 1.35} ${R * 0.9},${-R * 1.35} ${R * 0.9},${-R * 0.42}Z`} fill={color} {...o} />
          <path d={`M${-R * 0.6},${-R * 1.12} Q0,${-R * 1.45} ${R * 0.6},${-R * 1.12}`} fill="none" {...o} strokeWidth={R * 0.12} />
        </g>
      );
    case 'sovietHelmet':
      return <path d={`M${-R * 1.1},${-R * 0.12} C${-R * 1.1},${-R * 1.4} ${R * 1.1},${-R * 1.4} ${R * 1.1},${-R * 0.12} L${R * 1.2},${-R * 0.05} L${-R * 1.2},${-R * 0.05}Z`} fill={color} {...o} />;
    case 'ushanka':
      return (
        <g>
          <path d={`M${-R * 1.12},${R * 0.35} L${-R * 1.12},${-R * 0.5} C${-R * 1.1},${-R * 1.45} ${R * 1.1},${-R * 1.45} ${R * 1.12},${-R * 0.5} L${R * 1.12},${R * 0.35} L${R * 0.85},${R * 0.3} L${R * 0.85},${-R * 0.35} L${-R * 0.85},${-R * 0.35} L${-R * 0.85},${R * 0.3}Z`} fill={color} {...o} />
          <rect x={-R * 1.0} y={-R * 0.62} width={R * 2.0} height={R * 0.3} rx={R * 0.12} fill="#7A6A55" {...o} />
          <circle cx={0} cy={-R * 0.98} r={R * 0.1} fill={C.red} />
        </g>
      );
    case 'pickelhaube':
      return (
        <g>
          <path d={`M${-R * 1.0},${-R * 0.3} C${-R * 1.0},${-R * 1.3} ${R * 1.0},${-R * 1.3} ${R * 1.0},${-R * 0.3}Z`} fill={color} {...o} />
          <path d={`M${-R * 0.1},${-R * 1.03} L0,${-R * 1.6} L${R * 0.1},${-R * 1.03}Z`} fill={accent ?? C.gold} {...o} />
          <path d={`M${R * 0.9},${-R * 0.3} L${R * 1.35},${-R * 0.22}`} {...o} strokeWidth={R * 0.1} />
        </g>
      );
    case 'officerCap':
      return (
        <g>
          <path d={`M${-R * 0.95},${-R * 0.5} L${-R * 1.1},${-R * 1.05} Q0,${-R * 1.55} ${R * 1.15},${-R * 1.1} L${R * 0.95},${-R * 0.5}Z`} fill={color} {...o} />
          <rect x={-R * 0.95} y={-R * 0.72} width={R * 1.9} height={R * 0.22} fill={accent ?? C.darkRed} {...o} />
          <path d={`M${R * 0.2},${-R * 0.5} Q${R * 1.0},${-R * 0.55} ${R * 1.3},${-R * 0.28} L${R * 0.4},${-R * 0.4}Z`} fill={ink} />
        </g>
      );
    case 'beret':
      return (
        <g>
          <path d={`M${-R * 1.05},${-R * 0.45} C${-R * 1.3},${-R * 1.35} ${R * 0.9},${-R * 1.55} ${R * 1.2},${-R * 0.75} C${R * 1.0},${-R * 0.55} ${R * 0.5},${-R * 0.45} ${-R * 1.05},${-R * 0.45}Z`} fill={color} {...o} />
          <circle cx={-R * 0.35} cy={-R * 0.78} r={R * 0.13} fill={C.gold} />
        </g>
      );
    case 'flatCap':
      return (
        <g>
          <path d={`M${-R * 1.02},${-R * 0.45} C${-R * 1.05},${-R * 1.25} ${R * 0.9},${-R * 1.3} ${R * 1.05},${-R * 0.6} Q${R * 1.55},${-R * 0.5} ${R * 1.35},${-R * 0.35} L${-R * 1.02},${-R * 0.45}Z`} fill={color} {...o} />
        </g>
      );
    case 'fedora':
      return (
        <g>
          <ellipse cx={0} cy={-R * 0.62} rx={R * 1.45} ry={R * 0.2} fill={color} {...o} />
          <path d={`M${-R * 0.85},${-R * 0.62} L${-R * 0.75},${-R * 1.3} Q0,${-R * 1.1} ${R * 0.75},${-R * 1.3} L${R * 0.85},${-R * 0.62}Z`} fill={color} {...o} />
          <rect x={-R * 0.84} y={-R * 0.86} width={R * 1.68} height={R * 0.16} fill={ink} />
        </g>
      );
    case 'tophat':
      return (
        <g>
          <ellipse cx={0} cy={-R * 0.65} rx={R * 1.25} ry={R * 0.16} fill={color} {...o} />
          <rect x={-R * 0.72} y={-R * 1.85} width={R * 1.44} height={R * 1.2} fill={color} {...o} />
        </g>
      );
    case 'sidecap':
      return <path d={`M${-R * 0.95},${-R * 0.6} L${-R * 0.7},${-R * 1.15} L${R * 0.8},${-R * 1.12} L${R * 0.95},${-R * 0.6} Q0,${-R * 0.75} ${-R * 0.95},${-R * 0.6}Z`} fill={color} {...o} />;
    case 'headscarf':
      return (
        <g>
          <path d={`M${-R * 1.12},${R * 0.3} C${-R * 1.3},${-R * 1.25} ${R * 1.3},${-R * 1.25} ${R * 1.12},${R * 0.3} L${R * 0.88},${R * 0.2} C${R * 0.85},${-R * 0.55} ${-R * 0.85},${-R * 0.55} ${-R * 0.88},${R * 0.2}Z`} fill={color} {...o} />
          <path d={`M${-R * 0.2},${R * 0.95} l${-R * 0.25},${R * 0.35} l${R * 0.45},${-R * 0.05}Z`} fill={color} {...o} />
        </g>
      );
    case 'sailor':
      return (
        <g>
          <ellipse cx={0} cy={-R * 0.85} rx={R * 0.95} ry={R * 0.3} fill={C.paper} {...o} />
          <rect x={-R * 0.8} y={-R * 0.85} width={R * 1.6} height={R * 0.25} fill={C.paper} {...o} />
        </g>
      );
    case 'pilot':
      return (
        <g>
          <path d={`M${-R * 1.08},${R * 0.2} C${-R * 1.15},${-R * 1.3} ${R * 1.15},${-R * 1.3} ${R * 1.08},${R * 0.2} L${R * 0.88},${R * 0.1} L${R * 0.88},${-R * 0.4} L${-R * 0.88},${-R * 0.4} L${-R * 0.88},${R * 0.1}Z`} fill={color} {...o} />
          <circle cx={-R * 0.35} cy={-R * 0.7} r={R * 0.24} fill="#9FC3D0" {...o} />
          <circle cx={R * 0.35} cy={-R * 0.7} r={R * 0.24} fill="#9FC3D0" {...o} />
        </g>
      );
    case 'stripedCap':
      return (
        <g>
          <path d={`M${-R * 0.95},${-R * 0.5} C${-R * 0.95},${-R * 1.15} ${R * 0.95},${-R * 1.15} ${R * 0.95},${-R * 0.5}Z`} fill="#9DA3AA" {...o} />
          <path d={`M${-R * 0.5},${-R * 0.95} L${-R * 0.5},${-R * 0.55} M0,${-R * 1.05} L0,${-R * 0.55} M${R * 0.5},${-R * 0.95} L${R * 0.5},${-R * 0.55}`} stroke="#4E5A6E" strokeWidth={R * 0.12} />
        </g>
      );
    case 'jpFieldCap': // soft cap with short peak and neck flaps hanging at the back (-x)
      return (
        <g>
          <path d={`M${-R * 1.0},${-R * 0.42} L${-R * 1.1},${R * 0.5} L${-R * 0.7},${R * 0.46} L${-R * 0.66},${-R * 0.36}Z`} fill={color} {...o} strokeWidth={s * 0.8} />
          <path d={`M${-R * 0.96},${-R * 0.1} L${-R * 0.98},${R * 0.45} M${-R * 0.82},${-R * 0.1} L${-R * 0.84},${R * 0.44}`} stroke={ink} strokeWidth={s * 0.45} />
          <path d={`M${-R * 0.98},${-R * 0.42} C${-R * 1.0},${-R * 1.2} ${R * 0.95},${-R * 1.22} ${R * 0.98},${-R * 0.42}Z`} fill={color} {...o} />
          <path d={`M${R * 0.35},${-R * 0.44} Q${R * 1.05},${-R * 0.48} ${R * 1.35},${-R * 0.28} L${R * 0.5},${-R * 0.34}Z`} fill={ink} />
        </g>
      );
    case 'jpHelmet':
      return (
        <g>
          <path d={`M${-R * 1.06},${-R * 0.2} C${-R * 1.08},${-R * 1.38} ${R * 1.08},${-R * 1.38} ${R * 1.06},${-R * 0.2} L${R * 1.16},${-R * 0.12} L${-R * 1.16},${-R * 0.12}Z`} fill={color} {...o} />
          <path d={`M${-R * 0.8},${-R * 0.75} Q0,${-R * 0.95} ${R * 0.8},${-R * 0.75}`} fill="none" stroke={ink} strokeWidth={s * 0.5} opacity={0.5} />
        </g>
      );
    case 'chineseCap': // soft flat-topped peaked cap
      return (
        <g>
          <path d={`M${-R * 0.92},${-R * 0.45} L${-R * 1.0},${-R * 1.12} L${R * 1.02},${-R * 1.14} L${R * 0.94},${-R * 0.45}Z`} fill={color} {...o} />
          <rect x={-R * 0.93} y={-R * 0.66} width={R * 1.86} height={R * 0.18} fill={accent ?? color} {...o} strokeWidth={s * 0.7} />
          <path d={`M${R * 0.25},${-R * 0.46} Q${R * 1.0},${-R * 0.5} ${R * 1.3},${-R * 0.3} L${R * 0.45},${-R * 0.38}Z`} fill={ink} />
        </g>
      );
    case 'kepi': // party cap: slanted crown, short peak, chin strap, NO emblem
      return (
        <g>
          <path d={`M${-R * 0.95},${-R * 0.42} L${-R * 0.85},${-R * 1.22} L${R * 0.7},${-R * 1.08} L${R * 0.95},${-R * 0.42}Z`} fill={color} {...o} />
          <path d={`M${R * 0.3},${-R * 0.44} Q${R * 1.0},${-R * 0.48} ${R * 1.28},${-R * 0.3} L${R * 0.5},${-R * 0.36}Z`} fill={ink} />
          <line x1={-R * 0.9} y1={-R * 0.55} x2={R * 0.92} y2={-R * 0.55} stroke={accent ?? ink} strokeWidth={s * 0.8} />
        </g>
      );
    case 'slouch': // brim pinned up on the near-left side
      return (
        <g>
          <path d={`M${-R * 1.55},${-R * 0.5} Q0,${-R * 0.7} ${R * 1.55},${-R * 0.5} Q${R * 1.6},${-R * 0.36} ${R * 1.3},${-R * 0.36} Q0,${-R * 0.5} ${-R * 0.95},${-R * 0.42}Z`} fill={color} {...o} />
          <path d={`M${-R * 0.98},${-R * 0.46} Q${-R * 1.3},${-R * 0.9} ${-R * 1.1},${-R * 1.22} Q${-R * 0.85},${-R * 1.1} ${-R * 0.7},${-R * 0.9}Z`} fill={color} {...o} />
          <path d={`M${-R * 0.8},${-R * 0.5} C${-R * 0.85},${-R * 1.45} ${R * 0.85},${-R * 1.45} ${R * 0.85},${-R * 0.5}Z`} fill={color} {...o} />
          <path d={`M${-R * 0.5},${-R * 1.25} Q0,${-R * 1.05} ${R * 0.5},${-R * 1.25}`} fill="none" stroke={ink} strokeWidth={s * 0.6} />
          <rect x={-R * 0.82} y={-R * 0.72} width={R * 1.66} height={R * 0.16} fill={accent ?? '#5B4A2E'} />
        </g>
      );
    case 'm1Camo':
      return (
        <g>
          <path d={`M${-R * 1.12},${-R * 0.15} C${-R * 1.1},${-R * 1.4} ${R * 1.1},${-R * 1.4} ${R * 1.12},${-R * 0.15} Q0,${-R * 0.3} ${-R * 1.12},${-R * 0.15}Z`} fill={color} {...o} />
          <ellipse cx={-R * 0.5} cy={-R * 0.62} rx={R * 0.22} ry={R * 0.13} fill="#3F4A2A" />
          <ellipse cx={R * 0.25} cy={-R * 0.9} rx={R * 0.26} ry={R * 0.12} fill="#8C7A4E" />
          <ellipse cx={R * 0.65} cy={-R * 0.45} rx={R * 0.2} ry={R * 0.12} fill="#3F4A2A" />
          <ellipse cx={-R * 0.1} cy={-R * 0.4} rx={R * 0.18} ry={R * 0.09} fill="#7A5A3A" />
          <path d={`M${-R * 0.95},${-R * 0.2} L${-R * 0.7},${R * 0.8}`} stroke={C.darkBrown} strokeWidth={R * 0.05} />
        </g>
      );
    case 'nurseCap':
      return (
        <g>
          <path d={`M${-R * 0.8},${-R * 0.72} L${-R * 0.6},${-R * 1.22} L${R * 0.6},${-R * 1.22} L${R * 0.8},${-R * 0.72} Q0,${-R * 0.85} ${-R * 0.8},${-R * 0.72}Z`} fill={C.paper} {...o} strokeWidth={s * 0.8} />
        </g>
      );
    case 'laurel': {
      // front half of a wreath ring round the crown, leaves in pairs along it
      const leaves: React.ReactNode[] = [];
      const n = 9;
      for (let i = 0; i < n; i++) {
        const t = Math.PI * (1.0 - i / (n - 1)); // left (back) to right (front) along the lower half of the ring
        const x = Math.cos(t) * R * 0.98;
        const y = -R * 0.6 + Math.sin(t) * R * 0.16;
        const ang = (Math.atan2(R * 0.16 * Math.cos(t), -R * 0.98 * Math.sin(t)) * 180) / Math.PI;
        for (const side of [-1, 1]) {
          leaves.push(
            <ellipse key={`${i}${side}`} cx={0} cy={side * R * 0.09} rx={R * 0.16} ry={R * 0.075} fill={color} stroke={ink} strokeWidth={s * 0.45}
              transform={`translate(${x},${y}) rotate(${ang + side * 28})`} />,
          );
        }
      }
      return (
        <g>
          <path d={`M${-R * 0.98},${-R * 0.6} Q0,${-R * 0.36} ${R * 0.98},${-R * 0.6}`} fill="none" stroke={ink} strokeWidth={s * 0.6} />
          {leaves}
        </g>
      );
    }
    case 'hood':
      return (
        <g>
          <path d={`M${-R * 0.75},${-R * 0.82} C${-R * 1.3},${-R * 0.9} ${-R * 1.75},${-R * 0.3} ${-R * 1.7},${R * 0.55} Q${-R * 1.5},${R * 0.1} ${-R * 1.05},${-R * 0.2}Z`} fill={color} {...o} />
          <path
            fillRule="evenodd"
            d={`M${-R * 1.35},${R * 1.32} C${-R * 1.25},${R * 0.7} ${-R * 1.3},${-R * 1.3} ${-R * 0.05},${-R * 1.25} C${R * 1.25},${-R * 1.25} ${R * 1.3},${R * 0.5} ${R * 1.3},${R * 1.32} Q0,${R * 1.5} ${-R * 1.35},${R * 1.32}Z M${R * 0.92},${R * 0.1} C${R * 0.92},${-R * 0.95} ${-R * 0.72},${-R * 0.95} ${-R * 0.72},${R * 0.1} C${-R * 0.72},${R * 1.02} ${R * 0.92},${R * 1.02} ${R * 0.92},${R * 0.1}Z`}
            fill={color}
            {...o}
          />
        </g>
      );
    case 'tricorn':
      return (
        <g>
          <path d={`M${-R * 1.35},${-R * 0.5} L${-R * 0.95},${-R * 1.3} Q0,${-R * 1.0} ${R * 0.95},${-R * 1.3} L${R * 1.45},${-R * 0.42} Q0,${-R * 0.72} ${-R * 1.35},${-R * 0.5}Z`} fill={color} {...o} />
          <path d={`M${-R * 0.95},${-R * 1.22} Q0,${-R * 0.92} ${R * 0.95},${-R * 1.22}`} fill="none" stroke={accent ?? C.dustyYellow} strokeWidth={s * 0.8} strokeLinecap="round" />
        </g>
      );
    case 'bonnet':
      return (
        <g>
          <path d={`M${-R * 0.98},${R * 0.35} C${-R * 1.25},${-R * 1.3} ${R * 0.95},${-R * 1.6} ${R * 1.3},${-R * 0.5} L${R * 1.02},${-R * 0.3} C${R * 0.75},${-R * 0.98} ${-R * 0.45},${-R * 1.0} ${-R * 0.62},${R * 0.3}Z`} fill={color} {...o} />
          <path d={`M${-R * 0.72},${R * 0.55} Q${-R * 0.55},${R * 1.0} ${R * 0.05},${R * 1.04}`} fill="none" stroke={accent ?? C.red} strokeWidth={s * 0.9} strokeLinecap="round" />
          <path d={`M${R * 0.05},${R * 1.02} l${R * 0.2},${R * 0.22} M${R * 0.05},${R * 1.02} l${-R * 0.08},${R * 0.28}`} stroke={accent ?? C.red} strokeWidth={s * 0.7} strokeLinecap="round" />
        </g>
      );
    case 'baseballCap':
      return (
        <g>
          <path d={`M${R * 0.55},${-R * 0.5} Q${R * 1.35},${-R * 0.58} ${R * 1.62},${-R * 0.36} L${R * 0.75},${-R * 0.38}Z`} fill={accent ?? color} {...o} />
          <path d={`M${-R * 0.98},${-R * 0.42} C${-R * 1.02},${-R * 1.32} ${R * 0.98},${-R * 1.32} ${R * 0.98},${-R * 0.42} Q0,${-R * 0.55} ${-R * 0.98},${-R * 0.42}Z`} fill={color} {...o} />
          <circle cx={0} cy={-R * 1.1} r={R * 0.07} fill={ink} />
        </g>
      );
    case 'serviceCap':
      return (
        <g>
          <path d={`M${-R * 0.95},${-R * 0.48} L${-R * 1.1},${-R * 0.98} Q0,${-R * 1.24} ${R * 1.14},${-R * 1.0} L${R * 0.95},${-R * 0.48}Z`} fill={color} {...o} />
          <rect x={-R * 0.96} y={-R * 0.72} width={R * 1.92} height={R * 0.24} fill={accent ?? color} {...o} strokeWidth={s * 0.7} />
          <circle cx={R * 0.38} cy={-R * 0.86} r={R * 0.09} fill="#B89A4A" stroke={ink} strokeWidth={s * 0.4} />
          <path d={`M${R * 0.25},${-R * 0.5} Q${R * 1.0},${-R * 0.54} ${R * 1.32},${-R * 0.3} L${R * 0.42},${-R * 0.4}Z`} fill={C.darkBrown} stroke={ink} strokeWidth={s * 0.5} strokeLinejoin="round" />
        </g>
      );
    case 'kepi1914':
      return (
        <g>
          <path d={`M${-R * 0.92},${-R * 0.45} L${-R * 0.82},${-R * 1.32} L${R * 0.66},${-R * 1.16} L${R * 0.92},${-R * 0.45}Z`} fill={color} {...o} />
          <path d={`M${-R * 0.92},${-R * 0.45} L${-R * 0.882},${-R * 0.8} L${R * 0.8},${-R * 0.8} L${R * 0.92},${-R * 0.45}Z`} fill={accent ?? C.navy} {...o} strokeWidth={s * 0.7} />
          <path d={`M${R * 0.3},${-R * 0.47} Q${R * 1.0},${-R * 0.5} ${R * 1.3},${-R * 0.3} L${R * 0.5},${-R * 0.38}Z`} fill={ink} />
        </g>
      );
    case 'feldkappe':
      return (
        <g>
          {hatShape('kepi', R, color, color)}
          <path d={`M${R * 0.15},${-R * 0.5} L${R * 0.2},${-R * 0.98}`} stroke={ink} strokeWidth={s * 0.45} opacity={0.6} />
          <circle cx={R * 0.32} cy={-R * 0.62} r={R * 0.06} fill="#B89A4A" stroke={ink} strokeWidth={s * 0.3} />
          <circle cx={R * 0.34} cy={-R * 0.85} r={R * 0.06} fill="#B89A4A" stroke={ink} strokeWidth={s * 0.3} />
        </g>
      );
    case 'kabalak':
      return (
        <g>
          <path d={`M${-R * 1.0},${-R * 0.36} C${-R * 1.14},${-R * 1.25} ${-R * 0.6},${-R * 1.62} 0,${-R * 1.6} C${R * 0.6},${-R * 1.62} ${R * 1.14},${-R * 1.25} ${R * 1.0},${-R * 0.36} Q0,${-R * 0.52} ${-R * 1.0},${-R * 0.36}Z`} fill={color} {...o} />
          <g fill="none" stroke={ink} strokeWidth={s * 0.45} opacity={0.55} strokeLinecap="round">
            <path d={`M${-R * 0.98},${-R * 0.72} Q0,${-R * 0.98} ${R * 1.0},${-R * 0.66}`} />
            <path d={`M${-R * 0.85},${-R * 1.08} Q0,${-R * 1.34} ${R * 0.9},${-R * 1.02}`} />
            <path d={`M${-R * 0.62},${-R * 0.46} L${-R * 0.18},${-R * 1.52}`} />
            <path d={`M${R * 0.12},${-R * 0.5} L${R * 0.58},${-R * 1.42}`} />
          </g>
        </g>
      );
    case 'papakha':
      return (
        <g>
          <path d={`M${-R * 0.95},${-R * 0.5} L${-R * 1.02},${-R * 1.32} Q0,${-R * 1.46} ${R * 1.02},${-R * 1.32} L${R * 0.95},${-R * 0.5} Q0,${-R * 0.62} ${-R * 0.95},${-R * 0.5}Z`} fill={color} {...o} />
          <g fill="none" stroke={ink} strokeWidth={s * 0.4} opacity={0.5} strokeLinecap="round">
            {[-0.7, -0.35, 0, 0.35, 0.7].map((x, i) => <path key={i} d={`M${R * (x - 0.1)},${-R * (0.85 + (i % 2) * 0.25)} q${R * 0.1},${-R * 0.12} ${R * 0.2},0`} />)}
          </g>
        </g>
      );
    case 'mobCap':
      return (
        <g>
          <path d={`M${-R * 1.12},${-R * 0.22} C${-R * 1.38},${-R * 1.05} ${-R * 0.7},${-R * 1.58} ${R * 0.05},${-R * 1.52} C${R * 0.8},${-R * 1.56} ${R * 1.36},${-R * 1.0} ${R * 1.12},${-R * 0.32} Q0,${-R * 0.62} ${-R * 1.12},${-R * 0.22}Z`} fill={color} {...o} />
          <path d={`M${-R * 1.04},${-R * 0.42} Q0,${-R * 0.82} ${R * 1.06},${-R * 0.52}`} fill="none" stroke={accent ?? ink} strokeWidth={s * 0.7} strokeLinecap="round" />
          <g stroke={ink} strokeWidth={s * 0.35} opacity={0.5} strokeLinecap="round">
            {[-0.6, -0.2, 0.2, 0.6].map((x, i) => <line key={i} x1={R * x} y1={-R * (0.72 + Math.abs(x) * -0.08)} x2={R * x * 1.1} y2={-R * (1.02 - Math.abs(x) * 0.1)} />)}
          </g>
        </g>
      );
    case 'vadVeil':
      return (
        <g>
          <path d={`M${R * 0.95},${-R * 0.45} C${R * 0.98},${-R * 1.32} ${-R * 0.95},${-R * 1.38} ${-R * 1.06},${-R * 0.5} C${-R * 1.14},${R * 0.1} ${-R * 1.24},${R * 0.7} ${-R * 1.42},${R * 1.28} L${-R * 0.66},${R * 1.18} C${-R * 0.78},${R * 0.62} ${-R * 0.84},${R * 0.02} ${-R * 0.8},${-R * 0.38} Q0,${-R * 0.6} ${R * 0.95},${-R * 0.45}Z`} fill={color} {...o} />
          <path d={`M${-R * 0.8},${-R * 0.4} Q0,${-R * 0.62} ${R * 0.94},${-R * 0.47}`} fill="none" stroke={ink} strokeWidth={s * 0.4} opacity={0.5} />
        </g>
      );
    case 'plumedHat':
      return (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${R * 0.05},${-R * 1.25} C${-R * (0.2 + i * 0.12)},${-R * (1.9 - i * 0.05)} ${-R * (0.9 + i * 0.12)},${-R * (1.6 - i * 0.12)} ${-R * (1.05 + i * 0.1)},${-R * (0.95 - i * 0.1)}`} fill="none" stroke={ink} strokeWidth={s * 2.1} strokeLinecap="round" />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={`g${i}`} d={`M${R * 0.05},${-R * 1.25} C${-R * (0.2 + i * 0.12)},${-R * (1.9 - i * 0.05)} ${-R * (0.9 + i * 0.12)},${-R * (1.6 - i * 0.12)} ${-R * (1.05 + i * 0.1)},${-R * (0.95 - i * 0.1)}`} fill="none" stroke={accent ?? '#4F7A3A'} strokeWidth={s * 1.3} strokeLinecap="round" />
          ))}
          <path d={`M${-R * 1.0},${-R * 0.5} L${-R * 0.82},${-R * 1.25} Q0,${-R * 1.4} ${R * 0.82},${-R * 1.25} L${R * 1.0},${-R * 0.5} Q0,${-R * 0.64} ${-R * 1.0},${-R * 0.5}Z`} fill={color} {...o} />
          <path d={`M${-R * 0.95},${-R * 0.66} Q0,${-R * 0.8} ${R * 0.95},${-R * 0.66}`} fill="none" stroke={C.gold} strokeWidth={s * 0.8} />
        </g>
      );
    case 'pagri': {
      // dignified, plain khaki turban: no jewel or badge; identity comes from the wrap only
      // wrap layers slope up from the back (-x) towards the front, like folds of wound cloth
      const band = (y0: number, y1: number, k: string) => (
        <path key={k} d={`M${-R * 0.98},${-R * y0} Q${-R * 0.1},${-R * (y0 + 0.22)} ${R * 0.98},${-R * y1}`} fill="none" stroke={ink} strokeWidth={s * 0.45} opacity={0.5} strokeLinecap="round" />
      );
      return (
        <g>
          {/* tail (shamla) hanging at the back of the head */}
          <path d={`M${-R * 0.72},${-R * 0.95} C${-R * 1.25},${-R * 0.85} ${-R * 1.3},${-R * 0.2} ${-R * 1.22},${R * 0.35} L${-R * 0.96},${R * 0.3} C${-R * 1.02},${-R * 0.2} ${-R * 0.95},${-R * 0.6} ${-R * 0.6},${-R * 0.8}Z`} fill={accent ?? color} {...o} />
          {/* fan (turra) standing up at the back-top */}
          <path d={`M${-R * 0.42},${-R * 1.38} L${-R * 0.82},${-R * 1.88} Q${-R * 0.55},${-R * 2.02} ${-R * 0.28},${-R * 1.92} Q${-R * 0.12},${-R * 1.8} ${-R * 0.1},${-R * 1.62}Z`} fill={accent ?? color} {...o} />
          <path d={`M${-R * 0.38},${-R * 1.45} L${-R * 0.62},${-R * 1.9} M${-R * 0.3},${-R * 1.48} L${-R * 0.38},${-R * 1.94}`} stroke={ink} strokeWidth={s * 0.35} opacity={0.5} />
          {/* layered dome */}
          <path d={`M${-R * 1.04},${-R * 0.32} C${-R * 1.22},${-R * 1.3} ${-R * 0.55},${-R * 1.7} ${R * 0.1},${-R * 1.62} C${R * 0.8},${-R * 1.58} ${R * 1.22},${-R * 1.12} ${R * 1.06},${-R * 0.3} Q0,${-R * 0.56} ${-R * 1.04},${-R * 0.32}Z`} fill={color} {...o} />
          {band(0.5, 0.82, 'b1')}
          {band(0.8, 1.12, 'b2')}
          {band(1.1, 1.38, 'b3')}
        </g>
      );
    }
    case 'wideBrim':
      return (
        <g>
          <path d={`M${-R * 0.72},${-R * 0.72} C${-R * 0.75},${-R * 1.45} ${R * 0.75},${-R * 1.45} ${R * 0.72},${-R * 0.72}Z`} fill={color} {...o} />
          <path d={`M${-R * 0.74},${-R * 0.86} Q0,${-R * 1.02} ${R * 0.74},${-R * 0.86} L${R * 0.72},${-R * 0.72} Q0,${-R * 0.86} ${-R * 0.72},${-R * 0.72}Z`} fill={accent ?? '#C9B98A'} stroke={ink} strokeWidth={s * 0.5} />
          <ellipse cx={0} cy={-R * 0.7} rx={R * 1.72} ry={R * 0.24} fill={color} {...o} transform={`rotate(-4)`} />
          {/* small feather spray at the back of the crown */}
          <path d={`M${-R * 0.55},${-R * 0.95} C${-R * 0.95},${-R * 1.45} ${-R * 1.35},${-R * 1.3} ${-R * 1.45},${-R * 1.05} C${-R * 1.1},${-R * 1.12} ${-R * 0.85},${-R * 1.0} ${-R * 0.55},${-R * 0.95}Z`} fill={C.paper} stroke={ink} strokeWidth={s * 0.45} strokeLinejoin="round" />
        </g>
      );
    default:
      return null;
  }
}

/** Draw a hat on its own (e.g. a helmet held at the chest or a pickelhaube in the hand).
 *  Coordinates are head-relative: the brim sits about y = -0.5R above the origin. */
export const HatShape: React.FC<{hat: Hat; r?: number; color?: string; accent?: string; badge?: HeadSpec['hatBadge']}> = ({hat, r = 44, color, accent, badge}) => (
  <g>
    {hatShape(hat, r, color ?? C.khaki, accent)}
    {badge === 'redcross' && <RedCrossBadge R={r} />}
  </g>
);

const RedCrossBadge: React.FC<{R: number}> = ({R}) => (
  <g transform={`translate(${R * 0.05},${-R * 0.78})`}>
    <circle r={R * 0.26} fill={C.paper} stroke={ink} strokeWidth={R * 0.04} />
    <rect x={-R * 0.07} y={-R * 0.18} width={R * 0.14} height={R * 0.36} fill="#C62828" />
    <rect x={-R * 0.18} y={-R * 0.07} width={R * 0.36} height={R * 0.14} fill="#C62828" />
  </g>
);

/** WW1 respirator: rubberised facepiece with two glass eyepieces, a valve and a ribbed hose
 *  running down to the haversack on the chest (Outfit.satchel).  Eyes are drawn over the glass. */
function gasMaskBack(R: number, mx: number, eyeSep: number, eyeY: number, color: string) {
  const sw = R * 0.08;
  return (
    <g>
      <path d={`M${mx + R * 0.1},${R * 0.9} C${mx + R * 0.15},${R * 1.3} ${mx - R * 0.25},${R * 1.4} ${mx - R * 0.2},${R * 1.85}`} fill="none" stroke={ink} strokeWidth={R * 0.26} strokeLinecap="round" />
      <path d={`M${mx + R * 0.1},${R * 0.9} C${mx + R * 0.15},${R * 1.3} ${mx - R * 0.25},${R * 1.4} ${mx - R * 0.2},${R * 1.85}`} fill="none" stroke={color} strokeWidth={R * 0.16} strokeLinecap="round" />
      <path d={`M${mx + R * 0.1},${R * 0.9} C${mx + R * 0.15},${R * 1.3} ${mx - R * 0.25},${R * 1.4} ${mx - R * 0.2},${R * 1.85}`} fill="none" stroke={ink} strokeWidth={R * 0.17} strokeDasharray={`${R * 0.03} ${R * 0.09}`} opacity={0.55} />
      <path d={`M${mx - R * 0.8},${-R * 0.16} Q${mx},${-R * 0.34} ${mx + R * 0.84},${-R * 0.16} C${mx + R * 0.98},${R * 0.4} ${mx + R * 0.62},${R * 0.98} ${mx + R * 0.05},${R * 1.02} C${mx - R * 0.55},${R * 0.98} ${mx - R * 0.95},${R * 0.4} ${mx - R * 0.8},${-R * 0.16}Z`} fill={color} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
      {[-1, 1].map((k) => <circle key={k} cx={mx + k * eyeSep} cy={eyeY} r={R * 0.21} fill="#D9E6E4" />)}
      <rect x={mx - R * 0.14} y={R * 0.5} width={R * 0.34} height={R * 0.36} rx={R * 0.1} fill="#4A4C44" stroke={ink} strokeWidth={sw * 0.7} />
    </g>
  );
}

/** Back-of-head hair: covers the upper part of the skull. */
function hairBack(h: Hair, R: number, color: string) {
  if (h === 'none' || h === 'bald') return null;
  if (h === 'baldFringe') return <path d={`M${-R * 0.98},${R * 0.1} Q0,${R * 0.45} ${R * 0.98},${R * 0.1} L${R * 0.9},${-R * 0.4} Q0,${-R * 0.05} ${-R * 0.9},${-R * 0.4}Z`} fill={color} />;
  const low = h === 'bob' ? R * 0.6 : h === 'long' ? R * 1.15 : h === 'crew' ? -R * 0.05 : R * 0.25;
  const wideK = h === 'bob' || h === 'long' || h === 'curly' || h === 'mop' ? 1.1 : 1.0;
  return (
    <g>
      <path d={`M${-R * wideK},${low} C${-R * 1.15 * wideK},${-R * 1.35} ${R * 1.15 * wideK},${-R * 1.35} ${R * wideK},${low} Q0,${low + R * 0.18} ${-R * wideK},${low}Z`} fill={color} />
      {h === 'bun' && <circle cx={0} cy={-R * 0.55} r={R * 0.3} fill={color} stroke={C.paper} strokeWidth={R * 0.03} />}
    </g>
  );
}

function facialHair(fh: FacialHair, R: number, color: string, mx: number) {
  switch (fh) {
    case 'toothbrush':
      return <rect x={mx - R * 0.11} y={R * 0.3} width={R * 0.22} height={R * 0.13} rx={R * 0.02} fill={color} />;
    case 'walrus':
      return <path d={`M${mx - R * 0.42},${R * 0.5} C${mx - R * 0.35},${R * 0.22} ${mx + R * 0.35},${R * 0.22} ${mx + R * 0.42},${R * 0.5} C${mx + R * 0.2},${R * 0.38} ${mx - R * 0.2},${R * 0.38} ${mx - R * 0.42},${R * 0.5}Z`} fill={color} />;
    case 'kaiser':
      return <path d={`M${mx},${R * 0.32} C${mx - R * 0.25},${R * 0.25} ${mx - R * 0.45},${R * 0.35} ${mx - R * 0.55},${R * 0.05} C${mx - R * 0.42},${R * 0.48} ${mx - R * 0.15},${R * 0.42} ${mx},${R * 0.42} C${mx + R * 0.15},${R * 0.42} ${mx + R * 0.42},${R * 0.48} ${mx + R * 0.55},${R * 0.05} C${mx + R * 0.45},${R * 0.35} ${mx + R * 0.25},${R * 0.25} ${mx},${R * 0.32}Z`} fill={color} />;
    case 'handlebar':
      return <path d={`M${mx},${R * 0.3} C${mx - R * 0.35},${R * 0.22} ${mx - R * 0.6},${R * 0.35} ${mx - R * 0.62},${R * 0.55} C${mx - R * 0.4},${R * 0.45} ${mx - R * 0.2},${R * 0.48} ${mx},${R * 0.44} C${mx + R * 0.2},${R * 0.48} ${mx + R * 0.4},${R * 0.45} ${mx + R * 0.62},${R * 0.55} C${mx + R * 0.6},${R * 0.35} ${mx + R * 0.35},${R * 0.22} ${mx},${R * 0.3}Z`} fill={color} />;
    case 'thin':
      return <path d={`M${mx - R * 0.22},${R * 0.38} Q${mx},${R * 0.3} ${mx + R * 0.22},${R * 0.38}`} stroke={color} strokeWidth={R * 0.06} fill="none" strokeLinecap="round" />;
    case 'bushy':
      return <path d={`M${mx - R * 0.32},${R * 0.44} C${mx - R * 0.3},${R * 0.25} ${mx + R * 0.3},${R * 0.25} ${mx + R * 0.32},${R * 0.44} Q${mx},${R * 0.36} ${mx - R * 0.32},${R * 0.44}Z`} fill={color} />;
    case 'goatee':
      return (
        <g fill={color}>
          <path d={`M${mx - R * 0.26},${R * 0.42} C${mx - R * 0.22},${R * 0.28} ${mx + R * 0.22},${R * 0.28} ${mx + R * 0.26},${R * 0.42} Q${mx},${R * 0.35} ${mx - R * 0.26},${R * 0.42}Z`} />
          <path d={`M${mx - R * 0.2},${R * 0.64} Q${mx},${R * 0.6} ${mx + R * 0.2},${R * 0.64} Q${mx + R * 0.16},${R * 0.86} ${mx + R * 0.02},${R * 1.06} Q${mx - R * 0.14},${R * 0.86} ${mx - R * 0.2},${R * 0.64}Z`} />
        </g>
      );
    case 'shortBeard':
      return (
        <g fill={color}>
          <path d={`M${R * 0.93},${R * 0.3} A${R * 0.98},${R * 1.0} 0 0,1 ${-R * 0.93},${R * 0.3} Q${-R * 0.86},${R * 0.42} ${-R * 0.74},${R * 0.3} Q${mx},${R * 1.02} ${R * 0.74},${R * 0.3} Q${R * 0.86},${R * 0.42} ${R * 0.93},${R * 0.3}Z`} transform={`scale(1.04,1.07)`} />
          <path d={`M${mx - R * 0.34},${R * 0.44} C${mx - R * 0.3},${R * 0.27} ${mx + R * 0.3},${R * 0.27} ${mx + R * 0.34},${R * 0.44} Q${mx},${R * 0.37} ${mx - R * 0.34},${R * 0.44}Z`} />
        </g>
      );
    case 'stubble': {
      const dots = [];
      for (let i = 0; i < 14; i++) {
        const a = Math.PI * (0.15 + (i / 13) * 0.7);
        dots.push(<circle key={i} cx={mx + Math.cos(a) * R * 0.6 * (0.9 + hash(i) * 0.2)} cy={Math.sin(a) * R * 0.75} r={R * 0.025} fill={color} />);
      }
      return <g>{dots}</g>;
    }
    default:
      return null;
  }
}

export const Head: React.FC<Props> = (p) => {
  const R = p.r;
  const {f, seed} = p;
  const turn = p.turn ?? 0;
  const ex: Expression = p.expression ?? 'neutral';
  const mx = turn * R * 0.36; // face feature shift
  const eyeSep = R * 0.3 * (1 - Math.abs(turn) * 0.25);
  const lx = (p.look?.[0] ?? 0) * R * 0.05;
  const ly = (p.look?.[1] ?? 0) * R * 0.05;
  const sw = R * 0.12;
  const wide = p.wide ?? 1;
  const lod = p.lod ?? 'full';

  // blinking
  const period = 95 + Math.floor(hash(seed) * 70);
  const ph = (f + Math.floor(hash(seed + 1) * period)) % period;
  const blinking = p.blink !== false && ph < 5 && ex !== 'sleepy';
  const blinkSquash = blinking ? (ph < 2 || ph > 3 ? 0.35 : 0.06) : 1;

  // talking mouth openness
  const open = p.talking ? Math.max(0, 0.25 + 0.75 * Math.abs(noise1(f * 0.32, seed + 5)) * (Math.sin(f * 0.9 + seed) > -0.6 ? 1 : 0.2)) : 0;

  const eyeY = R * 0.02;
  const eyeRx = R * 0.1;
  const eyeRy = R * 0.14;

  // ---- eyes ----
  let eyes: React.ReactNode;
  if (p.eyesClosed || ex === 'sleepy' || (ex === 'grief' && !p.talking)) {
    eyes = [-1, 1].map((s) => (
      <path key={s} d={`M${mx + s * eyeSep - R * 0.13},${eyeY} Q${mx + s * eyeSep},${eyeY + R * 0.13} ${mx + s * eyeSep + R * 0.13},${eyeY}`} stroke={ink} strokeWidth={sw * 0.5} fill="none" strokeLinecap="round" />
    ));
  } else if (ex === 'joy') {
    eyes = [-1, 1].map((s) => (
      <path key={s} d={`M${mx + s * eyeSep - R * 0.13},${eyeY + R * 0.04} Q${mx + s * eyeSep},${eyeY - R * 0.14} ${mx + s * eyeSep + R * 0.13},${eyeY + R * 0.04}`} stroke={ink} strokeWidth={sw * 0.5} fill="none" strokeLinecap="round" />
    ));
  } else if (ex === 'stare') {
    eyes = [-1, 1].map((s) => (
      <g key={s}>
        <ellipse cx={mx + s * eyeSep} cy={eyeY - R * 0.01} rx={R * 0.15} ry={R * 0.18 * blinkSquash} fill={C.paper} stroke={ink} strokeWidth={sw * 0.35} />
        <circle cx={mx + s * eyeSep + lx} cy={eyeY + ly} r={R * 0.055 * Math.min(1, blinkSquash * 2)} fill={ink} />
      </g>
    ));
  } else if (ex === 'surprised' || ex === 'scared') {
    eyes = [-1, 1].map((s) => (
      <g key={s}>
        <ellipse cx={mx + s * eyeSep} cy={eyeY - R * 0.02} rx={R * 0.16} ry={R * 0.2 * blinkSquash} fill={C.paper} stroke={ink} strokeWidth={sw * 0.35} />
        <circle cx={mx + s * eyeSep + lx} cy={eyeY + ly} r={R * 0.07 * Math.min(1, blinkSquash * 2)} fill={ink} />
      </g>
    ));
  } else if (lod === 'low') {
    const ry = eyeRy * blinkSquash * (ex === 'angry' || ex === 'furious' ? 0.85 : ex === 'smug' || ex === 'tired' ? 0.6 : 1);
    const e = (cx: number) => `M${cx - eyeRx},${eyeY + ly}a${eyeRx},${ry} 0 1,0 ${eyeRx * 2},0a${eyeRx},${ry} 0 1,0 ${-eyeRx * 2},0`;
    eyes = <path d={e(mx - eyeSep + lx) + e(mx + eyeSep + lx)} fill={ink} />;
  } else {
    const squint = ex === 'angry' || ex === 'furious' ? 0.85 : ex === 'smug' ? 0.6 : ex === 'tired' ? 0.55 : 1;
    const lowered = ex === 'tired' ? R * 0.035 : 0;
    eyes = [-1, 1].map((s) => (
      <g key={s}>
        <ellipse cx={mx + s * eyeSep + lx} cy={eyeY + ly + lowered} rx={eyeRx} ry={eyeRy * blinkSquash * squint} fill={ink} />
        {ex === 'tired' && blinkSquash > 0.5 && (
          <line x1={mx + s * eyeSep - R * 0.14} y1={eyeY - R * 0.05} x2={mx + s * eyeSep + R * 0.14} y2={eyeY - R * 0.05} stroke={ink} strokeWidth={sw * 0.4} strokeLinecap="round" />
        )}
        {blinkSquash > 0.5 && <circle cx={mx + s * eyeSep + lx + R * 0.035} cy={eyeY + ly - R * 0.05 + lowered} r={R * 0.03} fill={C.paper} />}
      </g>
    ));
  }

  // ---- brows ----
  const browY = -R * 0.3;
  const browTable: Record<string, [number, number]> = {
    neutral: [0, 0], happy: [-4, -0.04], joy: [-6, -0.08], angry: [24, 0.05], furious: [32, 0.07], sad: [-20, -0.02],
    grief: [-24, -0.02], scared: [-18, -0.12], surprised: [-6, -0.16], determined: [14, 0.03], sleepy: [0, 0.02], smug: [10, -0.02],
    worried: [-16, -0.05], cold: [-14, -0.04], shout: [26, 0.04], tired: [-10, 0.04], solemn: [-8, 0.0], curious: [-10, -0.1], stare: [0, -0.1],
  };
  const [bAng, bOff] = browTable[ex] ?? [0, 0];
  const browSegs = [-1, 1].map((s) => {
    const cx = mx + s * eyeSep;
    const cy = browY + bOff * R;
    const half = R * 0.16;
    const a = ((bAng * Math.PI) / 180) * -s;
    return `M${cx - Math.cos(a) * half},${cy - Math.sin(a) * half}L${cx + Math.cos(a) * half},${cy + Math.sin(a) * half}`;
  });
  const brows = lod === 'low' ? [<path key="b" d={browSegs.join('')} stroke={ink} strokeWidth={sw * 0.62} strokeLinecap="round" />] : [-1, 1].map((s) => {
    const cx = mx + s * eyeSep;
    const cy = browY + bOff * R;
    const half = R * 0.16;
    const a = ((bAng * Math.PI) / 180) * -s; // inner end down for positive angle
    const dx = Math.cos(a) * half;
    const dy = Math.sin(a) * half;
    return <line key={s} x1={cx - dx} y1={cy - dy} x2={cx + dx} y2={cy + dy} stroke={ink} strokeWidth={sw * 0.62} strokeLinecap="round" />;
  });

  // ---- mouth ----
  const my = R * 0.5;
  let mouth: React.ReactNode;
  const mw = R * 0.2;
  if (open > 0.05 || ex === 'shout') {
    const o = ex === 'shout' ? 0.7 + open * 0.3 : open;
    mouth = <ellipse cx={mx} cy={my} rx={mw * (0.7 + o * 0.35)} ry={R * 0.03 + o * R * 0.13} fill={ink} />;
  } else {
    switch (ex) {
      case 'happy':
      case 'smug':
      case 'curious':
        mouth = <path d={`M${mx - mw},${my - R * 0.04} Q${mx},${my + R * 0.12} ${mx + mw},${my - R * 0.04}`} stroke={ink} strokeWidth={sw * 0.5} fill="none" strokeLinecap="round" />;
        break;
      case 'joy':
        mouth = <path d={`M${mx - mw * 1.3},${my - R * 0.06} Q${mx},${my + R * 0.3} ${mx + mw * 1.3},${my - R * 0.06}Z`} fill={ink} stroke={ink} strokeWidth={sw * 0.3} strokeLinejoin="round" />;
        break;
      case 'angry':
      case 'furious':
      case 'determined':
        // small tight frown with a wobble, like the reference
        mouth = <path d={`M${mx - mw},${my + R * 0.04} Q${mx - mw * 0.5},${my - R * 0.06} ${mx},${my - R * 0.02} Q${mx + mw * 0.5},${my - R * 0.06} ${mx + mw},${my + R * 0.04}`} stroke={ink} strokeWidth={sw * 0.5} fill="none" strokeLinecap="round" />;
        break;
      case 'sad':
      case 'grief':
      case 'worried':
      case 'cold':
        mouth = <path d={`M${mx - mw},${my + R * 0.06} Q${mx},${my - R * 0.08} ${mx + mw},${my + R * 0.06}`} stroke={ink} strokeWidth={sw * 0.5} fill="none" strokeLinecap="round" />;
        break;
      case 'surprised':
      case 'scared':
        mouth = <ellipse cx={mx} cy={my + R * 0.02} rx={R * 0.08} ry={R * 0.11} fill={ink} />;
        break;
      case 'tired':
      case 'solemn':
      case 'stare':
        mouth = <line x1={mx - mw * 0.6} y1={my + R * 0.02} x2={mx + mw * 0.6} y2={my + R * 0.02} stroke={ink} strokeWidth={sw * 0.45} strokeLinecap="round" />;
        break;
      case 'sleepy':
        mouth = <path d={`M${mx - mw * 0.6},${my} Q${mx},${my - R * 0.04} ${mx + mw * 0.6},${my + R * 0.02}`} stroke={ink} strokeWidth={sw * 0.45} fill="none" strokeLinecap="round" />;
        break;
      default:
        mouth = <path d={`M${mx - mw * 0.7},${my} Q${mx},${my + R * 0.03} ${mx + mw * 0.7},${my}`} stroke={ink} strokeWidth={sw * 0.5} fill="none" strokeLinecap="round" />;
    }
  }

  const hairColor = p.hairColor ?? ink;
  const hatOn = p.hat && p.hat !== 'none';
  const hairBehind = p.hair === 'bob' || p.hair === 'long';

  if (p.back) {
    return (
      <g>
        <ellipse cx={0} cy={0} rx={R * wide} ry={R} fill={C.head} stroke={ink} strokeWidth={sw * 0.95} />
        {p.hair && (!hatOn || p.hair === 'bob' || p.hair === 'long' || p.hair === 'bun' || p.hair === 'baldFringe') && hairBack(p.hair, R, hairColor)}
        {hatOn && hatShape(p.hat!, R, p.hatColor ?? C.khaki, p.hatAccent)}
      </g>
    );
  }

  return (
    <g>
      {hairBehind && (!hatOn || HAIR_SHOWS.includes(p.hat!)) && hairShape(p.hair!, R, hairColor, f, seed)}
      <ellipse cx={0} cy={0} rx={R * wide} ry={R} fill={C.head} stroke={ink} strokeWidth={sw * 0.95} />
      {!hairBehind && p.hair && p.hair !== 'none' &&
        (!hatOn || HAIR_SHOWS.includes(p.hat!) || p.hair === 'bald' || p.hair === 'baldFringe') &&
        hairShape(p.hair, R, hairColor, f, seed, p.hat === 'wideBrim')}
      {hatOn && hatShape(p.hat!, R, p.hatColor ?? C.khaki, p.hatAccent)}
      {hatOn && p.hatBadge === 'redcross' && <RedCrossBadge R={R} />}
      {hatOn && p.chinStrap && (
        <path d={`M${-R * 0.9},${-R * 0.18} Q${-R * 0.82},${R * 0.72} ${-R * 0.25},${R * 0.97}`} fill="none" stroke={C.darkBrown} strokeWidth={R * 0.07} strokeLinecap="round" />
      )}
      {!p.gasMask && brows}
      {p.gasMask && gasMaskBack(R, mx, eyeSep, eyeY, typeof p.gasMask === 'string' ? p.gasMask : '#6E7258')}
      {p.gasMask && brows}
      {eyes}
      {p.gasMask && [-1, 1].map((k) => <circle key={k} cx={mx + k * eyeSep} cy={eyeY} r={R * 0.21} fill="none" stroke={ink} strokeWidth={sw * 0.5} />)}
      {lod !== 'low' && p.glasses === 'round' && (
        <g fill="none" stroke={ink} strokeWidth={sw * 0.3}>
          <circle cx={mx - eyeSep} cy={eyeY} r={R * 0.19} />
          <circle cx={mx + eyeSep} cy={eyeY} r={R * 0.19} />
          <line x1={mx - eyeSep + R * 0.19} y1={eyeY} x2={mx + eyeSep - R * 0.19} y2={eyeY} />
        </g>
      )}
      {p.glasses === 'pince' && (
        <g fill="none" stroke={ink} strokeWidth={sw * 0.25}>
          <ellipse cx={mx - eyeSep} cy={eyeY} rx={R * 0.17} ry={R * 0.15} />
          <ellipse cx={mx + eyeSep} cy={eyeY} rx={R * 0.17} ry={R * 0.15} />
          <path d={`M${mx - eyeSep + R * 0.17},${eyeY} Q${mx},${eyeY - R * 0.08} ${mx + eyeSep - R * 0.17},${eyeY}`} />
        </g>
      )}
      {p.glasses === 'dark' && (
        <g>
          <ellipse cx={mx - eyeSep} cy={eyeY} rx={R * 0.2} ry={R * 0.15} fill={ink} />
          <ellipse cx={mx + eyeSep} cy={eyeY} rx={R * 0.2} ry={R * 0.15} fill={ink} />
          <line x1={mx - eyeSep} y1={eyeY} x2={mx + eyeSep} y2={eyeY} stroke={ink} strokeWidth={sw * 0.3} />
        </g>
      )}
      {!p.gasMask && mouth}
      {!p.gasMask && p.facial && p.facial !== 'none' && facialHair(p.facial, R, p.facialColor ?? ink, mx)}
      {p.angerMark && lod !== 'low' && (
        <g transform={`translate(${-R * 0.55},${-R * 0.55}) scale(${R / 50})`} stroke={C.red} strokeWidth={5} fill="none" strokeLinecap="round">
          <path d="M-12,-4 Q-4,-4 -4,-12 M4,-12 Q4,-4 12,-4 M12,4 Q4,4 4,12 M-4,12 Q-4,4 -12,4" />
        </g>
      )}
      {p.sweat && (
        <path d={`M${R * 0.78},${-R * 0.45} q${R * 0.12},${R * 0.22} 0,${R * 0.3} q${-R * 0.12},${-R * 0.08} 0,${-R * 0.3}Z`} fill="#8FC7E8" stroke={ink} strokeWidth={sw * 0.2} transform={`translate(0,${(f % 40) * R * 0.004})`} />
      )}
      {p.tear && (
        <path d={`M${mx - eyeSep},${eyeY + R * 0.18 + ((f * 0.6) % 20) * R * 0.012} q${R * 0.06},${R * 0.1} 0,${R * 0.16} q${-R * 0.06},${-R * 0.06} 0,${-R * 0.16}Z`} fill="#8FC7E8" />
      )}
    </g>
  );
};
