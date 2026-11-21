// s07 sets: a White House bedroom at dawn, the Cabinet room, a recruiting street with a marching column,
// the Gettysburg fields at dusk, the cemetery rows, a White House door (generic, pale painted wall with
// pilasters), a desk surface for documents, and map arrows. Non-graphic throughout: no weapons, no bodies.
import React from 'react';
import {Person} from '../kit/Cast';
import {parishWalk} from '../characters/parishWalk';
import {stand} from '../characters/poses';
import {castBuild, castScale} from '../kit/Cast';
import {C} from '../styles/theme';
import {clamp, hash, noise1} from '../animations/core';
import {Smoke} from '../components/Effects';
import {Tree} from '../components/Environment';

const ink = C.ink;
const o = (w = 4) => ({stroke: ink, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});

// ---------------------------------------------------------------- 7.2 bedroom at dawn
export const Bedroom: React.FC<{f: number; floor: number}> = ({f, floor}) => (
  <g>
    <rect x={-700} y={-400} width={3400} height={1900} fill="#B8A890" />
    {Array.from({length: 30}, (_, i) => <path key={i} d={`M${-640 + i * 110},-400 V${floor - 200}`} stroke="#AC9C84" strokeWidth={10} />)}
    <rect x={-700} y={floor - 200} width={3400} height={200} fill="#6E5A46" {...o(4)} />
    <rect x={1440} y={floor - 640} width={250} height={360} fill="#E8C8B0" {...o(7)} />
    <path d={`M1565,${floor - 640} V${floor - 280} M1440,${floor - 460} H1690`} stroke="#5A4434" strokeWidth={8} />
    <path d={`M1420,${floor - 660} Q1450,${floor - 470} 1430,${floor - 260} L1480,${floor - 260} Q1470,${floor - 480} 1490,${floor - 660}Z`} fill="#3A3644" {...o(3)} />
    <path d={`M1700,${floor - 660} Q1670,${floor - 470} 1690,${floor - 260} L1640,${floor - 260} Q1650,${floor - 480} 1630,${floor - 660}Z`} fill="#3A3644" {...o(3)} />
    <rect x={-700} y={floor} width={3400} height={600} fill="#5A4636" />
    {Array.from({length: 20}, (_, i) => <line key={i} x1={-600 + i * 180} y1={floor} x2={-800 + i * 210} y2={floor + 300} stroke="#45362A" strokeWidth={3} opacity={0.6} />)}
    <line x1={-700} y1={floor} x2={2700} y2={floor} stroke={ink} strokeWidth={6} />
    {/* dust in the window light */}
    {Array.from({length: 14}, (_, i) => <circle key={i} cx={1300 + ((i * 97 + f * 0.25) % 380) - 200} cy={floor - 520 + ((i * 53 + f * 0.4) % 360)} r={2.2} fill="#FFF2DA" opacity={0.5} />)}
  </g>
);
/** Small, neatly made, empty bed (no one in it). */
export const SmallBed: React.FC<{x: number; floor: number}> = ({x, floor}) => (
  <g>
    <rect x={x - 180} y={floor - 230} width={22} height={230} fill="#6A4A30" {...o(3.5)} />
    <rect x={x + 160} y={floor - 160} width={22} height={160} fill="#6A4A30" {...o(3.5)} />
    <rect x={x - 168} y={floor - 120} width={340} height={56} rx={6} fill="#E6DCC4" {...o(4)} />
    <rect x={x - 40} y={floor - 132} width={210} height={30} rx={10} fill="#5E6A84" {...o(3.5)} />
    <rect x={x - 150} y={floor - 150} width={86} height={34} rx={14} fill="#F4EEE0" {...o(3.5)} />
    <rect x={x - 168} y={floor - 66} width={340} height={14} fill="#6A4A30" {...o(3)} />
  </g>
);

// ---------------------------------------------------------------- 7.4 Cabinet room
export const CabinetRoom: React.FC<{f: number; floor: number}> = ({f, floor}) => (
  <g>
    <rect x={-700} y={-400} width={3400} height={1900} fill="#5E6A52" />
    {Array.from({length: 16}, (_, i) => <rect key={i} x={-600 + i * 230} y={floor - 600} width={170} height={330} rx={4} fill="#56624A" stroke="#3E4834" strokeWidth={3} />)}
    {[300, 1500].map((x, i) => <rect key={i} x={x} y={floor - 560} width={150} height={190} fill="#7A6A50" {...o(5)} />)}
    <rect x={820} y={floor - 640} width={260} height={360} fill="#AFC2C8" {...o(7)} />
    <path d={`M950,${floor - 640} V${floor - 280} M820,${floor - 460} H1080`} stroke="#3A2A1A" strokeWidth={8} />
    <rect x={-700} y={floor - 220} width={3400} height={220} fill="#4A3A2A" {...o(4)} />
    <rect x={-700} y={floor} width={3400} height={600} fill="#4E3A2A" />
    <line x1={-700} y1={floor} x2={2700} y2={floor} stroke={ink} strokeWidth={6} />
    <circle cx={950} cy={-40} r={200 + noise1(f / 30, 3) * 5} fill="#FFE6A8" opacity={0.12} />
  </g>
);
/** Long table seen from the front, covering the sitters' legs; papers and an ink stand on top. */
export const CabinetTable: React.FC<{x0: number; x1: number; top: number; floor: number}> = ({x0, x1, top, floor}) => (
  <g>
    <rect x={x0} y={top} width={x1 - x0} height={floor - top + 4} fill="#3F5E45" {...o(5)} />
    <rect x={x0 - 10} y={top - 10} width={x1 - x0 + 20} height={18} rx={4} fill="#6A4A30" {...o(4)} />
    <path d={`M${x0},${top + 60} H${x1}`} stroke="#2E4834" strokeWidth={4} />
    {[x0 + 120, x0 + 420, x1 - 260].map((x, i) => <rect key={i} x={x} y={top - 16} width={70} height={8} fill="#F1E6C8" {...o(2)} />)}
  </g>
);

// ---------------------------------------------------------------- 7.7 recruiting street and a marching column
export const RecruitStreet: React.FC<{f: number; floor: number}> = ({f, floor}) => (
  <g>
    {/* brick fronts */}
    {Array.from({length: 7}, (_, i) => {
      const x = -700 + i * 520;
      const h = 520 + (i % 3) * 70;
      return (
        <g key={i}>
          <rect x={x} y={floor - 160 - h} width={500} height={h} fill={['#9A5A44', '#A8745A', '#8A6A58'][i % 3]} {...o(4)} />
          {Array.from({length: 6}, (_, k) => <rect key={k} x={x + 40 + (k % 3) * 150} y={floor - 120 - h + 60 + Math.floor(k / 3) * 180} width={80} height={120} fill="#3A3640" {...o(3)} />)}
        </g>
      );
    })}
    <rect x={-700} y={floor - 160} width={3400} height={160} fill="#B8A88A" />
    <rect x={-700} y={floor} width={3400} height={600} fill="#A89878" />
    <line x1={-700} y1={floor - 160} x2={2700} y2={floor - 160} stroke={ink} strokeWidth={4} />
    <line x1={-700} y1={floor} x2={2700} y2={floor} stroke={ink} strokeWidth={6} />
    {Array.from({length: 22}, (_, i) => <path key={i} d={`M${-640 + i * 160},${floor - 120 + (i % 3) * 30} l30,0`} stroke="#9A8A6A" strokeWidth={4} />)}
    {[0, 1].map((i) => <circle key={i} cx={-100 + i * 1900 + noise1(f / 80, i) * 10} cy={-60} r={140} fill="#F6EED8" opacity={0.15} />)}
  </g>
);
/** Recruiting table with a plain bunting skirt. */
export const RecruitTable: React.FC<{x: number; floor: number; w: number; h: number}> = ({x, floor, w, h}) => (
  <g>
    <rect x={x - w / 2} y={floor - h} width={w} height={h} fill="#3A4A6A" {...o(4)} />
    {Array.from({length: 4}, (_, i) => <path key={i} d={`M${x - w / 2 + (i * w) / 4},${floor - h + 8} q${w / 8},40 ${w / 4},0`} fill="none" stroke={i % 2 ? '#F2EEE4' : '#B23A2E'} strokeWidth={9} />)}
    <rect x={x - w / 2 - 10} y={floor - h - 12} width={w + 20} height={16} rx={3} fill="#6A4A30" {...o(4)} />
  </g>
);
/** A column of Black Union soldiers (in Union blue) marching left to right, feet planted (parishWalk). */
export const MarchingColumn: React.FC<{f: number; y: number; x0: number; n: number; gap: number; s: number; speed: number; lod?: 'low' | 'full'; seed?: number}> = ({f, y, x0, n, gap, s, speed, lod = 'low', seed = 1}) => {
  const build = castBuild('usct');
  const sc = castScale('usct', s);
  const d = f * speed;
  const P = parishWalk(d / sc, build ?? false, 0, 0);
  return (
    <g>
      {Array.from({length: n}, (_, i) => (
        <Person key={i} id="usct" x={x0 + d - i * gap} y={y} scale={s} dir={1} pose={{...P, shL: -12, elL: 30, shR: 14 + Math.sin(f / 9 + i) * 2, elR: 12}} f={f + i * 7} seed={seed * 10 + i} lod={lod} expression="determined" look={[0.6, 0]} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- 7.8a Gettysburg fields at dusk
export const Fields: React.FC<{f: number; horizon: number}> = ({f, horizon}) => (
  <g>
    <path d={`M-900,${horizon} Q-300,${horizon - 70} 300,${horizon - 20} T1500,${horizon - 40} T2900,${horizon - 10} V1600 H-900Z`} fill="#5E6440" {...o(3)} />
    <path d={`M-900,${horizon + 120} Q0,${horizon + 60} 900,${horizon + 110} T2900,${horizon + 90} V1600 H-900Z`} fill="#6E7048" {...o(3)} />
    {/* stone wall and fence */}
    <path d={`M-900,${horizon + 230} Q500,${horizon + 190} 2900,${horizon + 240}`} stroke="#8A8478" strokeWidth={26} fill="none" />
    <path d={`M-900,${horizon + 230} Q500,${horizon + 190} 2900,${horizon + 240}`} stroke={ink} strokeWidth={3} fill="none" strokeDasharray="22 10" />
    {Array.from({length: 18}, (_, i) => <path key={i} d={`M${-700 + i * 200},${horizon + 330} v-70`} stroke="#4A3A2A" strokeWidth={8} />)}
    <path d={`M-900,${horizon + 280} H2900 M-900,${horizon + 306} H2900`} stroke="#4A3A2A" strokeWidth={6} />
    <Tree x={1500} y={horizon + 40} s={1.4} color="#4A5232" f={f} seed={3} />
    <Tree x={300} y={horizon + 10} s={1.1} color="#4A5232" f={f} seed={5} />
    {[0, 1, 2, 3].map((i) => <Smoke key={i} x={-200 + i * 600} y={horizon + 60} f={f + i * 20} n={6} size={70} rise={160} drift={260} seed={i + 2} opacity={0.22} color="#8A8A90" outline={false} />)}
  </g>
);

// ---------------------------------------------------------------- 7.8b the cemetery rows (curved), small flags
export const CemeteryRows: React.FC<{f: number; cx: number; cy: number; rows?: number}> = ({f, cx, cy, rows = 7}) => (
  <g>
    {Array.from({length: rows}, (_, r) => {
      const R = 260 + r * 120;
      const n = 9 + r * 4;
      return (
        <g key={r}>
          {Array.from({length: n}, (_, i) => {
            const a = Math.PI * (0.12 + (0.76 * (i + 0.5)) / n);
            const x = cx + Math.cos(a) * R * 1.7;
            const y = cy + Math.sin(a) * R * 0.42;
            const s = 0.55 + (y - cy) / 520;
            const flagSway = Math.sin(f / 14 + i + r) * 3;
            return (
              <g key={i} transform={`translate(${x},${y}) scale(${s})`}>
                <rect x={-14} y={-34} width={28} height={34} rx={5} fill="#E8E4DA" {...o(2.5)} />
                {hash(r * 17 + i) > 0.35 && (
                  <g transform={`translate(18,0)`}>
                    <path d="M0,0 V-46" stroke={ink} strokeWidth={2.5} />
                    <path d={`M0,-46 l18,${2 + flagSway * 0.3} l-1,10 l-17,-2Z`} fill="#B23A2E" stroke={ink} strokeWidth={1.5} />
                    <rect x={0} y={-46} width={7} height={5} fill="#2E4A7A" />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      );
    })}
  </g>
);

// ---------------------------------------------------------------- 7.9 White House door (generic pale painted front)
export const WhiteHouseFront: React.FC<{floor: number; doorX: number; dw: number; dh: number}> = ({floor, doorX, dw, dh}) => (
  <g>
    <rect x={-700} y={floor - 900} width={3400} height={900} fill="#EDE8DC" stroke={ink} strokeWidth={5} />
    {Array.from({length: 10}, (_, i) => <rect key={i} x={-600 + i * 340} y={floor - 900} width={60} height={900} fill="#E2DCCC" stroke="#C9C2B0" strokeWidth={3} />)}
    {[doorX - 520, doorX - 300, doorX + 420, doorX + 640].map((wx, i) => (
      <g key={i}>
        <rect x={wx} y={floor - 560} width={130} height={240} fill="#5A6A7A" {...o(5)} />
        <path d={`M${wx + 65},${floor - 560} V${floor - 320} M${wx},${floor - 440} H${wx + 130}`} stroke="#EDE8DC" strokeWidth={6} />
      </g>
    ))}
    <path d={`M${doorX - 40},${floor - dh - 6} A${dw / 2 + 40},${dw / 2 + 40} 0 0 1 ${doorX + dw + 40},${floor - dh - 6}Z`} fill="#BFC8CC" {...o(4)} />
    {Array.from({length: 7}, (_, i) => <path key={i} d={`M${doorX + dw / 2},${floor - dh - 6} L${doorX + dw / 2 + Math.cos(Math.PI * (i + 0.5) / 7) * -(dw / 2 + 30)},${floor - dh - 6 - Math.sin(Math.PI * (i + 0.5) / 7) * (dw / 2 + 30)}`} stroke="#8A9498" strokeWidth={3} />)}
    <rect x={doorX - 40} y={floor - dh - 10} width={dw + 80} height={dh + 10} fill="none" {...o(5)} />
    <rect x={doorX - 70} y={floor - dh - 40} width={30} height={dh + 40} fill="#F4F0E6" {...o(4)} />
    <rect x={doorX + dw + 40} y={floor - dh - 40} width={30} height={dh + 40} fill="#F4F0E6" {...o(4)} />
    <rect x={-700} y={floor} width={3400} height={500} fill="#A8A296" />
    <rect x={doorX - 90} y={floor} width={dw + 180} height={22} fill="#C9C4B8" {...o(3)} />
    <line x1={-700} y1={floor} x2={2700} y2={floor} stroke={ink} strokeWidth={6} />
  </g>
);
export const WHInterior: React.FC<{x: number; floor: number; w: number; h: number}> = ({x, floor, w, h}) => (
  <g>
    <rect x={x} y={floor - h} width={w} height={h} fill="#6A5240" />
    <rect x={x} y={floor - h * 0.2} width={w} height={h * 0.2} fill="#7A3A30" />
    <ellipse cx={x + w * 0.6} cy={floor - h * 0.62} rx={w * 0.5} ry={h * 0.3} fill="#F2C060" opacity={0.3} />
  </g>
);

// ---------------------------------------------------------------- document desk and map arrows
export const DocDesk: React.FC<{f: number; tone?: string}> = ({f, tone = '#4A3424'}) => (
  <g>
    <rect x={-800} y={-600} width={3600} height={2400} fill={tone} />
    {Array.from({length: 26}, (_, i) => <path key={i} d={`M-800,${-500 + i * 90 + noise1(i, 3) * 10} Q900,${-480 + i * 90} 2800,${-500 + i * 90}`} stroke="#3E2A1C" strokeWidth={3} fill="none" opacity={0.55} />)}
    <circle cx={300 + noise1(f / 90, 1) * 20} cy={200} r={500} fill="#FFB060" opacity={0.08} />
  </g>
);
/** Curved campaign arrow between screen points a -> b, drawn on with t; `back` for a retreat (dashed). */
export const MapArrow: React.FC<{a: [number, number]; b: [number, number]; t: number; color: string; bend?: number; dashed?: boolean; w?: number}> = ({a, b, t, color, bend = 0.2, dashed, w = 16}) => {
  if (t <= 0) return null;
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend;
  const my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  const u = clamp(t);
  const q = (k: number): [number, number] => [(1 - k) ** 2 * a[0] + 2 * (1 - k) * k * mx + k * k * b[0], (1 - k) ** 2 * a[1] + 2 * (1 - k) * k * my + k * k * b[1]];
  const pts = Array.from({length: 24}, (_, i) => q((u * i) / 23));
  const head = pts[pts.length - 1];
  const prev = pts[pts.length - 3] ?? a;
  const ang = Math.atan2(head[1] - prev[1], head[0] - prev[0]) * (180 / Math.PI);
  const d = 'M' + pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join('L');
  return (
    <g>
      <path d={d} fill="none" stroke={ink} strokeWidth={w + 7} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dashed ? '22 14' : undefined} />
      <g transform={`translate(${head[0]},${head[1]}) rotate(${ang})`}>
        <path d={`M${w * 1.8},0 L${-w * 0.8},${-w * 1.5} L${-w * 0.8},${w * 1.5}Z`} fill={color} {...o(5)} />
      </g>
    </g>
  );
};
export {stand};
