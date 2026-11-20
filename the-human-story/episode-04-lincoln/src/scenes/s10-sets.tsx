// Chapter 10 sets (train, hall and lectern come from kit/Sets04b): a night station platform, the railway car with
// two draped coffins, the Lincoln Memorial (front, interior statue, carved inscription), the 1922 dedication
// seating with a roped-off section, a lectern, the historians' grey tags and the end card over the woods.
// Flat vector, generic: nothing here adds a fact beyond the storyboard.
import React from 'react';
import {Person} from '../kit/Cast';
import {DocText, layoutDoc, doc} from '../kit/Documents';
import {C, FONT} from '../styles/theme';
import {clamp, easeBack, easeOut, hash, noise1, prog} from '../animations/core';
import {seatHeight, seatPose} from '../kit/Seats';
import {TALL} from '../characters/skeleton';

const ink = C.ink;
const o = (w = 4) => ({stroke: ink, strokeWidth: w, strokeLinejoin: 'round' as const});

// ---------------------------------------------------------------- night station (the train itself is the kit's Sets04b Train)
/** Night station: back wall with lit windows, gas lamps, rails, platform. Platform floor at `floor`. */
export const StationNight: React.FC<{f: number; floor: number}> = ({f, floor}) => (
  <g>
    <rect x={-700} y={-400} width={3320} height={1900} fill="#141C30" />
    {Array.from({length: 60}, (_, i) => <circle key={i} cx={-600 + hash(i * 3) * 3100} cy={-300 + hash(i * 7) * 620} r={1.6 + hash(i) * 1.8} fill="#E8E4D0" opacity={0.4 + 0.5 * Math.abs(Math.sin(f / 40 + i))} />)}
    {/* station building far behind the tracks */}
    <rect x={-300} y={420} width={2500} height={300} fill="#232838" {...o(3)} />
    <path d="M-340,420 L960,300 L2260,420Z" fill="#1C2030" {...o(3)} />
    {Array.from({length: 14}, (_, i) => <rect key={i} x={-220 + i * 180} y={500} width={70} height={110} rx={30} fill="#FFC27A" opacity={0.28 + 0.15 * hash(i * 5)} {...o(2)} />)}
    <rect x={-700} y={floor - 130} width={3320} height={40} fill="#2A2A30" />
    <line x1={-700} y1={floor - 110} x2={2620} y2={floor - 110} stroke="#6A6A72" strokeWidth={5} />
  </g>
);
export const PlatformFront: React.FC<{f: number; floor: number}> = ({f, floor}) => (
  <g>
    <rect x={-700} y={floor - 90} width={3320} height={22} fill="#5A5048" {...o(3)} />
    <rect x={-700} y={floor - 68} width={3320} height={800} fill="#3E3832" />
    {Array.from({length: 22}, (_, i) => <line key={i} x1={-640 + i * 160} y1={floor - 68} x2={-700 + i * 190} y2={floor + 300} stroke="#2E2A26" strokeWidth={3} />)}
    {[160, 960, 1760].map((x, i) => (
      <g key={i}>
        <rect x={x - 6} y={floor - 380} width={12} height={300} fill="#1A1A1E" {...o(2.5)} />
        <path d={`M${x - 22},${floor - 380} L${x + 22},${floor - 380} L${x + 16},${floor - 420} L${x - 16},${floor - 420}Z`} fill="#FFD9A0" opacity={0.9 + noise1(f / 4, i) * 0.08} {...o(3)} />
      </g>
    ))}
  </g>
);

// ---------------------------------------------------------------- railway car interior with two draped coffins
const Coffin: React.FC<{x: number; y: number; len: number; h: number}> = ({x, y, len, h}) => {
  const n = Math.max(3, Math.round(len / 120));
  const sw = len / n;
  const hem = Array.from({length: n}, (_, i) => `Q${x + i * sw + sw / 2},${y + h * 0.95} ${x + (i + 1) * sw},${y + h * 0.78}`).join(' ');
  return (
    <g>
      {/* bier */}
      <rect x={x + 16} y={y + h + 4} width={len - 32} height={16} fill="#2A1C16" {...o(3)} />
      {[x + 34, x + len - 46].map((lx, i) => <rect key={i} x={lx} y={y + h + 20} width={12} height={70} fill="#2A1C16" {...o(2.5)} />)}
      {/* the coffin: wood box with a rounded lid */}
      <rect x={x} y={y + 6} width={len} height={h - 2} rx={6} fill="#5A3A26" {...o(4)} />
      {/* black pall over the lid, hanging in swags, silver fringe */}
      <path d={`M${x - 8},${y + h * 0.78} L${x - 4},${y + 4} Q${x + len / 2},${y - 22} ${x + len + 4},${y + 4} L${x + len + 8},${y + h * 0.78} L${x - 8},${y + h * 0.78} Z`} fill="#24202A" {...o(4)} />
      <path d={`M${x - 8},${y + h * 0.78} ${hem}`} fill="#24202A" stroke="#C8C4CC" strokeWidth={3} />
      {Array.from({length: n - 1}, (_, i) => <path key={i} d={`M${x + (i + 1) * sw},${y + 2} Q${x + (i + 1) * sw - 6},${y + h * 0.4} ${x + (i + 1) * sw},${y + h * 0.78}`} stroke="#4A4452" strokeWidth={3} fill="none" />)}
      <path d={`M${x + 10},${y + 2} Q${x + len / 2},${y - 18} ${x + len - 10},${y + 2}`} stroke="#6A6474" strokeWidth={3} fill="none" opacity={0.8} />
      {/* white flowers on the lid */}
      {Array.from({length: 5}, (_, i) => <circle key={i} cx={x + len * 0.5 + i * 15 - 30} cy={y - 14 - (i % 2) * 5} r={8} fill="#F4F0E6" {...o(2)} />)}
      <path d={`M${x + len * 0.5 - 40},${y - 8} Q${x + len * 0.5},${y - 18} ${x + len * 0.5 + 40},${y - 8}`} stroke="#5A7A4A" strokeWidth={4} fill="none" />
    </g>
  );
};
export const RailCarInterior: React.FC<{f: number; floor: number}> = ({f, floor}) => (
  <g>
    <rect x={-700} y={-400} width={3320} height={1900} fill="#3A261E" />
    {/* clerestory roof */}
    <path d={`M-700,140 Q960,-20 2620,140 L2620,200 Q960,40 -700,200Z`} fill="#2A1A14" {...o(4)} />
    {/* windows with the night passing */}
    {Array.from({length: 8}, (_, i) => {
      const wx = -300 + i * 330;
      return (
        <g key={i}>
          <rect x={wx} y={300} width={170} height={200} rx={10} fill="#0E1424" {...o(5)} />
          <g clipPath={`url(#rcw${i})`}>
            <defs>
              <clipPath id={`rcw${i}`}><rect x={wx} y={300} width={170} height={200} rx={10} /></clipPath>
            </defs>
            {Array.from({length: 3}, (_, k) => {
              const lx = wx + 170 - ((f * 9 + k * 140 + i * 57) % 420);
              return <rect key={k} x={lx} y={380 + k * 30} width={26} height={6} rx={3} fill="#FFD08A" opacity={0.55} />;
            })}
          </g>
          {/* black drapery over each window */}
          <path d={`M${wx - 18},290 Q${wx + 85},350 ${wx + 188},290 L${wx + 188},280 L${wx - 18},280Z`} fill="#121214" {...o(2.5)} />
        </g>
      );
    })}
    <rect x={-700} y={floor - 300} width={3320} height={300} fill="#4A3024" {...o(3)} />
    {Array.from({length: 22}, (_, i) => <rect key={i} x={-660 + i * 160} y={floor - 270} width={120} height={230} rx={4} fill="none" stroke="#2E1C16" strokeWidth={3} />)}
    <rect x={-700} y={floor} width={3320} height={600} fill="#2A1C16" />
    <line x1={-700} y1={floor} x2={2620} y2={floor} stroke={ink} strokeWidth={6} />
  </g>
);
export const TwoCoffins: React.FC<{floor: number}> = ({floor}) => (
  <g>
    <Coffin x={420} y={floor - 178} len={720} h={70} />
    <Coffin x={1250} y={floor - 160} len={360} h={52} />
  </g>
);

// ---------------------------------------------------------------- Lincoln Memorial (front; statue and inscription seen between the centre columns)
const MARBLE = '#E8E4DA';
export const MemorialDefs: React.FC = () => (
  <defs>
    <filter id="marble" x="-20%" y="-20%" width="140%" height="140%">
      <feColorMatrix type="matrix" values="0.18 0.18 0.18 0 0.56  0.18 0.18 0.18 0 0.55  0.18 0.18 0.18 0 0.52  0 0 0 1 0" />
    </filter>
  </defs>
);
/** Columns span x 360–1560; the centre bay (x 820–1100) shows the interior. Floor of the hall at y 700. */
export const Memorial: React.FC<{f: number; epitaphT?: number}> = ({f, epitaphT = 1}) => {
  const E = doc('epitaph');
  const L = layoutDoc(E.text, E.hand, 12.5, 240, 0, 0, 1.38, 99);
  const lines = L.lines.map((ln) => ({...ln, x: 958 - ln.w / 2, y: 372 + (ln.y - L.lines[0].y)}));
  const sb = 0.74;
  const sp = {x: 935, y: 700, scale: sb, dir: 1 as const};
  const sh = seatHeight(TALL, sb * 1.15);
  const P = seatPose({...sp, scale: 1.15 * sb}, sh, TALL, 0, 3, {shL: 30, elL: 50, shR: 34, elR: 52, headTilt: 0, lean: 0});
  const cols = Array.from({length: 12}, (_, i) => 380 + i * 105);
  return (
    <g>
      {/* interior: inner wall, inscription, the seated statue on its block */}
      <rect x={800} y={330} width={320} height={380} fill="#8E887C" />
      <rect x={800} y={330} width={320} height={380} fill="url(#memShade)" />
      <defs>
        <linearGradient id="memShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7A746A" stopOpacity={0.5} />
          <stop offset="1" stopColor="#FFF6E0" stopOpacity={0.1} />
        </linearGradient>
      </defs>
      <g opacity={epitaphT}>
        <DocText L={{...L, lines}} id="memEpitaph" />
      </g>
      <rect x={900} y={700 - sh} width={120} height={sh} fill={MARBLE} {...o(3.5)} />
      <rect x={880} y={696} width={160} height={14} fill="#D8D2C4" {...o(3)} />
      <g filter="url(#marble)">
        <Person id="abePres" x={sp.x} y={sp.y} scale={sb} dir={1} pose={P} f={0} head={{hat: 'none', expression: 'solemn'}} />
      </g>
      {/* stylobate, columns, entablature, attic */}
      <rect x={300} y={700} width={1320} height={24} fill={MARBLE} {...o(4)} />
      {cols.map((x, i) => (i === 5 || i === 6 ? null : (
        <g key={i}>
          <rect x={x - 22} y={340} width={44} height={360} fill={MARBLE} {...o(3.5)} />
          {[-11, 0, 11].map((k) => <line key={k} x1={x + k} y1={346} x2={x + k} y2={696} stroke="#C8C2B4" strokeWidth={2.5} />)}
          <rect x={x - 30} y={330} width={60} height={14} fill={MARBLE} {...o(3)} />
        </g>
      )))}
      <rect x={330} y={262} width={1260} height={70} fill={MARBLE} {...o(4)} />
      {Array.from({length: 36}, (_, i) => <rect key={i} x={346 + i * 34.6} y={280} width={18} height={34} fill="none" stroke="#C8C2B4" strokeWidth={2} />)}
      <rect x={360} y={180} width={1200} height={84} fill="#EDE9E0" {...o(4)} />
      <rect x={350} y={170} width={1220} height={14} fill={MARBLE} {...o(3)} />
      {/* steps */}
      {Array.from({length: 14}, (_, i) => (
        <rect key={i} x={300 - i * 22} y={724 + i * 22} width={1320 + i * 44} height={22} fill={i % 2 ? '#DCD6C8' : '#E2DDD0'} {...o(2.5)} />
      ))}
      <rect x={-800} y={1032} width={3520} height={500} fill="#9AAE6A" />
    </g>
  );
};

// ---------------------------------------------------------------- 1922 dedication seating with a roped-off section
const SEATED_IDS = ['visitor', 'townsman', 'townswoman', 'visitor', 'townswoman', 'townsman'];
const HAT_1922: Record<string, Record<string, unknown>> = {visitor: {hat: 'fedora', hatColor: '#4A4238'}, townsman: {hat: 'fedora', hatColor: '#2E2A28'}, townswoman: {hat: 'wideBrim', hatColor: '#8A7A6A'}};
const SeatRow: React.FC<{y: number; s: number; f: number; x0: number; x1: number; n: number; seed: number; gapX: number}> = ({y, s, f, x0, x1, n, seed, gapX}) => {
  const xs = Array.from({length: n}, (_, i) => x0 + ((x1 - x0) * i) / (n - 1)).filter((x) => Math.abs(x - gapX) > 70 * s);
  return (
    <g>
      {xs.map((x, i) => {
        const id = SEATED_IDS[(i + seed) % SEATED_IDS.length];
        if (hash(i * 31 + seed) < 0.1) return null;
        return (
          <Person
            key={i}
            id={id}
            x={x}
            y={y + 60 * s}
            scale={s}
            dir={1}
            f={f}
            seed={seed * 20 + i}
            fromBehind
            lod="low"
            head={HAT_1922[id] as never}
            outfit={id === 'townswoman' ? {kind: 'dress', color: ['#5A6A7A', '#7A6A5A', '#6A5A6A'][i % 3]} : {color: ['#4A4A52', '#3A3A40', '#5A5048'][i % 3]}}
            pose={{lean: 2, hipL: 86, kneeL: 84, hipR: 90, kneeR: 88, shL: 30, elL: 50, shR: 34, elR: 52, bob: 54 + Math.sin(f / 30 + i) * 0.7, headTilt: noise1(f / 60 + i, seed) * 3}}
          />
        );
      })}
      {/* chair backs and the row in front hide the legs */}
      {xs.map((x, i) => <rect key={i} x={x - 30 * s} y={y - 6 * s} width={60 * s} height={44 * s} rx={4} fill="#7A5A3A" {...o(2.5)} />)}
      <rect x={x0 - 80 * s} y={y + 34 * s} width={x1 - x0 + 160 * s} height={200 * s} fill="#8EA062" />
    </g>
  );
};
export const DedicationSeating: React.FC<{f: number; aisle: number}> = ({f, aisle}) => {
  const rows = [
    {y: 600, s: 0.62},
    {y: 680, s: 0.72},
    {y: 770, s: 0.84},
    {y: 870, s: 0.98},
  ];
  return (
    <g>
      {rows.map((r, i) => (
        <g key={i}>
          <SeatRow y={r.y} s={r.s} f={f} x0={-200 + i * -60} x1={2120 + i * 60} n={20 - i * 3} seed={i + 2} gapX={aisle} />
          {/* rope posts along the aisle */}
          <g>
            <rect x={aisle - 5 * r.s} y={r.y - 70 * r.s} width={10 * r.s} height={110 * r.s} fill="#C9A24A" {...o(2.5)} />
            <circle cx={aisle} cy={r.y - 74 * r.s} r={9 * r.s} fill="#C9A24A" {...o(2.5)} />
          </g>
        </g>
      ))}
      {/* the rope: post to post along the aisle, then across the front of the section */}
      {rows.slice(0, -1).map((r, i) => {
        const q = rows[i + 1];
        const a = {x: aisle, y: r.y - 70 * r.s};
        const b = {x: aisle, y: q.y - 70 * q.s};
        return <path key={i} d={`M${a.x},${a.y} Q${a.x + 8},${(a.y + b.y) / 2 + 18} ${b.x},${b.y}`} stroke="#8A2A22" strokeWidth={6} fill="none" />;
      })}
      {Array.from({length: 4}, (_, i) => {
        const r = rows[3];
        const x0 = aisle + i * 260;
        return (
          <g key={i}>
            <rect x={x0 + 255} y={r.y - 70 * r.s + 40} width={10} height={110} fill="#C9A24A" {...o(2.5)} />
            <path d={`M${x0},${r.y - 70 * r.s + 40} Q${x0 + 130},${r.y - 70 * r.s + 40 + 26 + Math.sin(f / 40 + i) * 2} ${x0 + 260},${r.y - 70 * r.s + 40}`} stroke="#8A2A22" strokeWidth={7} fill="none" />
          </g>
        );
      })}
    </g>
  );
};

/** Short grey tag for a view attributed to historians (not a fact): fades in, gentle float. */
export const GreyTag: React.FC<{text: string; x: number; y: number; t: number; f: number}> = ({text, x, y, t, f}) => {
  if (t <= 0) return null;
  const w = text.length * 19 + 56;
  return (
    <g opacity={clamp(t)} transform={`translate(${x},${y + Math.sin(f / 40) * 3 + (1 - clamp(t)) * 16})`}>
      <rect x={-w / 2 + 5} y={-30} width={w} height={64} rx={32} fill="rgba(0,0,0,0.3)" />
      <rect x={-w / 2} y={-36} width={w} height={64} rx={32} fill="#7A7C80" stroke={ink} strokeWidth={4} />
      <text y={8} textAnchor="middle" fontFamily={FONT.sans} fontWeight={700} fontSize={32} fill="#F4F2EC">
        {text}
      </text>
    </g>
  );
};

/** The series end card content (as in kit/Cards EndCardScene), drawn over a moving scene. */
export const EndCardOver: React.FC<{f: number}> = ({f}) => {
  const t = prog(f, 0, 22, easeOut);
  const b = prog(f, 18, 40, easeBack);
  const bw = 760;
  return (
    <g>
      <rect width={1920} height={1080} fill="#1A120C" opacity={0.28 * t} />
      <g opacity={t} transform={`translate(960,${360 - (1 - t) * 30})`}>
        <text textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={110} fill="#FFFFFF" stroke={ink} strokeWidth={9} paintOrder="stroke" letterSpacing={5}>
          THE HUMAN STORY
        </text>
        <text y={80} textAnchor="middle" fontFamily={FONT.sans} fontWeight={600} fontStyle="italic" fontSize={48} fill="#FFF3D6" stroke={ink} strokeWidth={6} paintOrder="stroke">
          History is made by people.
        </text>
      </g>
      <g opacity={clamp(b * 1.4)} transform={`translate(960,590) scale(${0.7 + 0.3 * b})`}>
        <rect x={-bw / 2 + 6} y={-44 + 8} width={bw} height={88} rx={44} fill="rgba(0,0,0,0.35)" />
        <rect x={-bw / 2} y={-44} width={bw} height={88} rx={44} fill={C.red} stroke={ink} strokeWidth={6} />
        <text y={13} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={36} fill="#FFFFFF" letterSpacing={2}>
          SUBSCRIBE FOR THE NEXT STORY
        </text>
      </g>
    </g>
  );
};
