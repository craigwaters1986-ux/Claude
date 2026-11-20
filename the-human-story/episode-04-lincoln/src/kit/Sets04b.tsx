// Episode 4 sets, part 2 (kit build, shared): the US Capitol in three states, a 19th-century hall interior,
// a gaslit night street with a façade slot, low-detail crowds, and a period train for the funeral journey.
// Flat vector, series style (flat muted colours, ink outlines). Generic period places unless the storyboard
// names them; never add signage that claims a specific building.
//
// PUBLIC API
//   <Capitol x base s? dome='bulfinch'|'unfinished'|'finished' f lit? />
//       'bulfinch'  = 1847 (old low copper dome, no extension wings)   (shot 4.7)
//       'unfinished'= 4 March 1861 (new cast-iron drum part-built, dome ribs, crane on top, scaffold; wings up) (6.5)
//       'finished'  = 4 March 1865 (dome complete with the Statue of Freedom, set Dec 1863)                    (8.4)
//       Width ≈ 1500·s, height to the top ≈ 640·s (unfinished) / 760·s (finished). CAPITOL_STEPS(x, base, s) gives
//       the top-of-steps point for placing figures (east front speaker's stand).
//   <Crowd x0 x1 y f rows? n? s? seed? fromBehind? hats? />     low-detail crowd (heads and shoulders), breathing
//   <HallBack f floor lit? />   arched hall with columns and gas jets (Cooper Union style, generic)
//   <Stage x floor w h? />      raised platform; STAGE_H = default height
//   <Lectern x floor s? />      lectern standing on `floor` (e.g. the stage top); LECTERN_TOP(s) = top height above floor
//   <Benches y f rows? crowd? />  foreground benches with an audience seen from behind (parallax foreground)
//   <GasLamp x base f h? />     street gas lamp with flicker and halo
//   <GaslitStreet f floor slotX? slotW? slot? fog? />  night street; `slot` (ReactNode) is drawn in a gap of
//                               width slotW at slotX (e.g. a theatre façade, a house front); lamps either side
//   <Locomotive pl d f draped? smoke? />   4-4-0 "American" engine + tender, drivers turn with d (local px)
//   <RailCar pl d draped? lit? />          period passenger car
//   <Train x y s? dir? d f cars? draped? />  engine + cars; TRAIN_LEN(cars, s)
//   <Track y x0? x1? s? />                 rails and sleepers
//
// USAGE
//   <CineCam …>{(layer) => [layer(0.2, <SkyGrad time="day" id="k"/>), layer(0.8, <Capitol x={960} base={820} s={0.9} dome="unfinished" f={f}/>),
//                          layer(1.2, <Crowd x0={200} x1={1700} y={1000} f={f} rows={3} />)]}</CineCam>
//   <Train x={200 + f * 3} y={820} d={f * 3} f={f} cars={3} draped />
import React from 'react';
import {C} from '../styles/theme';
import {hash, noise1} from '../animations/core';
import {Smoke} from '../components/Effects';

const ink = C.ink;
const o = (w = 4) => ({stroke: ink, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});

// ------------------------------------------------------------------ Capitol
const STONE = '#E8E2D2';
const STONE_D = '#CFC7B2';
const Columns: React.FC<{x0: number; x1: number; y0: number; y1: number; n: number; w?: number}> = ({x0, x1, y0, y1, n, w = 10}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const x = x0 + ((x1 - x0) * i) / (n - 1);
      return <rect key={i} x={x - w / 2} y={y0} width={w} height={y1 - y0} fill={STONE} stroke={ink} strokeWidth={2.5} />;
    })}
  </g>
);
const Block: React.FC<{x0: number; x1: number; top: number; base: number; win?: number; lit?: number; portico?: number}> = ({x0, x1, top, base, win = 0, lit = 0, portico = 0}) => {
  const w = x1 - x0;
  return (
    <g>
      <rect x={x0} y={top} width={w} height={base - top} fill={STONE} {...o(4)} />
      <rect x={x0 - 6} y={top - 10} width={w + 12} height={12} fill={STONE_D} {...o(3)} />
      <path d={`M${x0},${base - (base - top) * 0.36} H${x1}`} stroke={STONE_D} strokeWidth={3} />
      {Array.from({length: win}, (_, i) => (
        <g key={i}>
          <rect x={x0 + 18 + (i * (w - 36)) / win} y={top + 22} width={Math.min(16, (w - 36) / win - 8)} height={(base - top) * 0.28} fill={lit ? '#F2C060' : '#7E8A94'} opacity={lit ? 0.4 + 0.5 * lit : 1} stroke={ink} strokeWidth={2} />
          <rect x={x0 + 18 + (i * (w - 36)) / win} y={base - (base - top) * 0.3} width={Math.min(16, (w - 36) / win - 8)} height={(base - top) * 0.2} fill={lit ? '#F2C060' : '#7E8A94'} opacity={lit ? 0.3 + 0.5 * lit : 1} stroke={ink} strokeWidth={2} />
        </g>
      ))}
      {portico > 0 && (
        <g>
          <path d={`M${(x0 + x1) / 2 - portico / 2 - 10},${top - 8} L${(x0 + x1) / 2},${top - 8 - portico * 0.22} L${(x0 + x1) / 2 + portico / 2 + 10},${top - 8}Z`} fill={STONE} {...o(3.5)} />
          <rect x={(x0 + x1) / 2 - portico / 2} y={top} width={portico} height={base - top} fill="#BDB5A0" stroke={ink} strokeWidth={3} />
          <Columns x0={(x0 + x1) / 2 - portico / 2 + 8} x1={(x0 + x1) / 2 + portico / 2 - 8} y0={top} y1={base} n={Math.max(4, Math.round(portico / 30))} />
        </g>
      )}
    </g>
  );
};

/** Top-of-steps point (world) on the Capitol's east front, for placing figures. */
export const CAPITOL_STEPS = (x: number, base: number, s = 1) => ({x, y: base - 70 * s});

export const Capitol: React.FC<{x: number; base: number; s?: number; dome: 'bulfinch' | 'unfinished' | 'finished'; f: number; lit?: number}> = ({x, base, s = 1, dome, f, lit = 0}) => {
  const top = -210;
  const sway = Math.sin(f / 50) * 0.6;
  return (
    <g transform={`translate(${x},${base}) scale(${s})`}>
      {/* wings */}
      {dome === 'bulfinch' ? (
        <g>
          <Block x0={-470} x1={-250} top={-180} base={-60} win={5} lit={lit} />
          <Block x0={250} x1={470} top={-180} base={-60} win={5} lit={lit} />
        </g>
      ) : (
        <g>
          <Block x0={-760} x1={-300} top={-180} base={-60} win={10} lit={lit} portico={180} />
          <Block x0={300} x1={760} top={-180} base={-60} win={10} lit={lit} portico={180} />
          <Block x0={-310} x1={-250} top={-190} base={-60} />
          <Block x0={250} x1={310} top={-190} base={-60} />
        </g>
      )}
      {/* central building */}
      <Block x0={-260} x1={260} top={top + 10} base={-60} win={6} lit={lit} portico={250} />
      {/* steps */}
      {Array.from({length: 6}, (_, i) => <rect key={i} x={-150 - i * 14} y={-70 + i * 12} width={300 + i * 28} height={12} fill={i % 2 ? STONE_D : STONE} stroke={ink} strokeWidth={2} />)}
      <rect x={-900} y={-60} width={1800} height={60} fill="#BDB5A0" {...o(4)} />
      {/* dome */}
      {dome === 'bulfinch' && (
        <g>
          <rect x={-100} y={top - 40} width={200} height={42} fill={STONE} {...o(3.5)} />
          <path d={`M-110,${top - 38} Q-100,${top - 140} 0,${top - 146} Q100,${top - 140} 110,${top - 38}Z`} fill="#8A7A5A" {...o(4)} />
          {[-60, -20, 20, 60].map((r) => <path key={r} d={`M${r},${top - 40} Q${r * 0.8},${top - 120} 0,${top - 144}`} fill="none" stroke="#6A5A40" strokeWidth={2.5} />)}
          <rect x={-14} y={top - 170} width={28} height={26} fill={STONE} {...o(3)} />
        </g>
      )}
      {dome !== 'bulfinch' && (
        <g>
          {/* drum with its peristyle */}
          <rect x={-170} y={top - 40} width={340} height={42} fill={STONE_D} {...o(3.5)} />
          <rect x={-160} y={top - 150} width={320} height={112} fill={STONE} {...o(4)} />
          <Columns x0={-150} x1={150} y0={top - 146} y1={top - 42} n={13} w={9} />
          <rect x={-168} y={top - 162} width={336} height={14} fill={STONE_D} {...o(3)} />
          {dome === 'unfinished' && (
            <g>
              {/* half-built attic and dome ribs, open to the sky; scaffold and a derrick crane on top */}
              <rect x={-140} y={top - 200} width={280} height={40} fill={STONE} {...o(3.5)} />
              {[-120, -80, -40, 0, 40, 80, 120].map((r) => <path key={r} d={`M${r},${top - 200} Q${r * 0.9},${top - 250} ${r * 0.72},${top - 268}`} fill="none" stroke="#9A9488" strokeWidth={6} />)}
              <path d={`M-140,${top - 200} Q-130,${top - 248} -100,${top - 268} M140,${top - 200} Q130,${top - 248} 100,${top - 268}`} fill="none" stroke={ink} strokeWidth={4} />
              {Array.from({length: 7}, (_, i) => <path key={i} d={`M${-150 + i * 50},${top - 165} V${top - 260}`} stroke="#8A6440" strokeWidth={3} />)}
              {[0, 1, 2].map((i) => <path key={i} d={`M-150,${top - 190 - i * 30} H150`} stroke="#8A6440" strokeWidth={3} />)}
              <g transform={`translate(0,${top - 268}) rotate(${sway})`}>
                <path d="M0,0 L0,-170" stroke={ink} strokeWidth={9} />
                <path d="M0,0 L0,-170" stroke="#6E5A40" strokeWidth={5} />
                <path d="M0,-150 L140,-110" stroke={ink} strokeWidth={7} />
                <path d="M0,-150 L140,-110" stroke="#6E5A40" strokeWidth={3.5} />
                <path d="M0,-170 L-80,0 M0,-170 L80,0" stroke="#6E5A40" strokeWidth={2.5} />
                <path d={`M136,-110 L136,${-40 + Math.sin(f / 25) * 4}`} stroke="#3A3A3A" strokeWidth={2} />
                <rect x={126} y={-40 + Math.sin(f / 25) * 4} width={20} height={14} fill="#7A7A7E" {...o(2)} />
              </g>
            </g>
          )}
          {dome === 'finished' && (
            <g>
              <rect x={-140} y={top - 200} width={280} height={40} fill={STONE} {...o(3.5)} />
              {Array.from({length: 9}, (_, i) => <rect key={i} x={-120 + i * 28} y={top - 194} width={12} height={22} fill="#7E8A94" stroke={ink} strokeWidth={1.5} />)}
              <path d={`M-140,${top - 200} Q-140,${top - 360} 0,${top - 380} Q140,${top - 360} 140,${top - 200}Z`} fill={STONE} {...o(4.5)} />
              {[-100, -60, -20, 20, 60, 100].map((r) => <path key={r} d={`M${r},${top - 200} Q${r * 0.95},${top - 340} ${r * 0.25},${top - 378}`} fill="none" stroke={STONE_D} strokeWidth={3} />)}
              {[0, 1].map((i) => <path key={i} d={`M${-128 + i * 14},${top - 250 - i * 50} Q0,${top - 262 - i * 50} ${128 - i * 14},${top - 250 - i * 50}`} fill="none" stroke={STONE_D} strokeWidth={3} />)}
              {/* lantern, tholos and the statue */}
              <rect x={-30} y={top - 440} width={60} height={64} fill={STONE} {...o(3.5)} />
              <Columns x0={-22} x1={22} y0={top - 436} y1={top - 380} n={4} w={6} />
              <path d={`M-34,${top - 440} Q0,${top - 476} 34,${top - 440}Z`} fill={STONE} {...o(3)} />
              <path d={`M-6,${top - 470} L-8,${top - 520} Q0,${top - 536} 8,${top - 520} L6,${top - 470}Z`} fill="#4A4E50" {...o(2.5)} />
              <circle cx={0} cy={top - 530} r={7} fill="#4A4E50" stroke={ink} strokeWidth={2.5} />
            </g>
          )}
        </g>
      )}
    </g>
  );
};

// ------------------------------------------------------------------ crowd (low LOD)
/** Rows of people at low detail: heads (white, series style) and shoulders in muted coats, gentle breathing. */
export const Crowd: React.FC<{x0: number; x1: number; y: number; f: number; rows?: number; n?: number; s?: number; seed?: number; fromBehind?: boolean; hats?: number; colors?: string[]}> = ({
  x0, x1, y, f, rows = 3, n, s = 1, seed = 1, fromBehind = false, hats = 0.45, colors = ['#2A2A30', '#4A4238', '#3A4458', '#5A4A3A', '#1E1C22', '#6A5A48'],
}) => {
  const per = n ?? Math.round((x1 - x0) / (46 * s));
  const out: React.ReactNode[] = [];
  for (let r = rows - 1; r >= 0; r--) {
    const rs = s * (1 - r * 0.12);
    const ry = y - r * 34 * s;
    for (let i = 0; i < per; i++) {
      const h = hash(i * 7 + r * 131 + seed);
      const x = x0 + ((x1 - x0) * (i + 0.5 + (r % 2) * 0.5 + (h - 0.5) * 0.4)) / per;
      const bob = Math.sin(f / (24 + h * 10) + h * 6) * 1.6 * rs;
      const col = colors[Math.floor(h * colors.length) % colors.length];
      const hat = hash(i * 3 + r * 17 + seed) < hats;
      out.push(
        <g key={`${r}-${i}`} transform={`translate(${x},${ry + bob}) scale(${rs})`}>
          <path d="M-26,40 Q-24,0 0,-2 Q24,0 26,40Z" fill={col} stroke={ink} strokeWidth={3} />
          <circle cx={0} cy={-22} r={20} fill="#FFFFFF" stroke={ink} strokeWidth={3.5} />
          {fromBehind ? <path d="M-19,-26 Q0,-48 19,-26 Q10,-14 0,-12 Q-10,-14 -19,-26Z" fill={h > 0.5 ? '#3A2A20' : '#5A4A3A'} /> : (
            <g>
              <circle cx={-6} cy={-24} r={2.4} fill={ink} />
              <circle cx={6} cy={-24} r={2.4} fill={ink} />
            </g>
          )}
          {hat && <g><rect x={-14} y={-66} width={28} height={30} fill="#1C1C20" stroke={ink} strokeWidth={2.5} /><rect x={-22} y={-40} width={44} height={6} rx={2} fill="#1C1C20" stroke={ink} strokeWidth={2.5} /></g>}
        </g>,
      );
    }
  }
  return <g>{out}</g>;
};

// ------------------------------------------------------------------ hall interior
const GasJet: React.FC<{x: number; y: number; f: number; seed?: number; s?: number}> = ({x, y, f, seed = 1, s = 1}) => {
  const fl = 1 + noise1(f / 3.5, seed) * 0.12;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <circle cx={0} cy={-10} r={60 * fl} fill="#FFD890" opacity={0.16} />
      <path d="M0,0 V30 M-16,30 H16" stroke={ink} strokeWidth={4} />
      <path d={`M0,-2 q${-7 * fl},-12 0,${-22 * fl} q${7 * fl},10 0,${22 * fl}Z`} fill="#FFC44A" stroke="#E08A20" strokeWidth={1.5} />
    </g>
  );
};
/** Arched hall (Cooper Union Great Hall style, generic): back wall, piers and arches, gas jets. */
export const HallBack: React.FC<{f: number; floor?: number; lit?: number}> = ({f, floor = 860, lit = 1}) => (
  <g>
    <rect x={-800} y={-500} width={3600} height={2000} fill="#B8A58A" />
    <rect x={-800} y={-500} width={3600} height={260} fill="#A8957A" />
    {Array.from({length: 10}, (_, i) => {
      const x = -560 + i * 360;
      return (
        <g key={i}>
          <path d={`M${x},${floor - 120} V${floor - 520} Q${x + 180},${floor - 700} ${x + 360},${floor - 520} V${floor - 120}`} fill="#9A876C" {...o(4)} />
          <rect x={x - 26} y={floor - 560} width={52} height={560} fill="#C9B79A" {...o(4)} />
          <rect x={x - 34} y={floor - 580} width={68} height={22} fill="#D8C8AA" {...o(3)} />
          <GasJet x={x} y={floor - 420} f={f} seed={i + 1} />
        </g>
      );
    })}
    <rect x={-800} y={floor - 120} width={3600} height={120} fill="#6E5A44" stroke={ink} strokeWidth={4} />
    <rect x={-800} y={floor} width={3600} height={800} fill="#5A4636" />
    <line x1={-800} y1={floor} x2={2800} y2={floor} stroke={ink} strokeWidth={6} />
    <rect x={-800} y={-500} width={3600} height={2000} fill="#000" opacity={0.25 * (1 - lit)} />
  </g>
);
export const STAGE_H = 90;
export const Stage: React.FC<{x: number; floor: number; w: number; h?: number}> = ({x, floor, w, h = STAGE_H}) => (
  <g>
    <rect x={x - w / 2} y={floor - h} width={w} height={h} fill="#6B4A30" {...o(5)} />
    <rect x={x - w / 2 - 10} y={floor - h - 10} width={w + 20} height={14} fill="#8A6440" {...o(4)} />
    {Array.from({length: Math.floor(w / 120)}, (_, i) => <rect key={i} x={x - w / 2 + 20 + i * 120} y={floor - h + 18} width={90} height={h - 34} rx={4} fill="none" stroke="#4A3220" strokeWidth={3} />)}
  </g>
);
export const LECTERN_TOP = (s = 1) => 128 * s;
/** Lectern with a sloped top; the top's front edge is LECTERN_TOP(s) above `floor`. */
export const Lectern: React.FC<{x: number; floor: number; s?: number}> = ({x, floor, s = 1}) => (
  <g transform={`translate(${x},${floor}) scale(${s})`}>
    <path d="M-30,0 L-20,-112 L20,-112 L30,0Z" fill="#6E4C30" {...o(4)} />
    <path d="M-44,-110 L44,-118 L40,-134 L-40,-128Z" fill="#8A6440" {...o(4)} />
    <path d="M-20,-60 H20" stroke="#4A3220" strokeWidth={3} />
  </g>
);
/** Foreground benches with an audience seen from behind (put on a foreground layer). */
export const Benches: React.FC<{y: number; f: number; rows?: number; x0?: number; x1?: number; crowd?: boolean; seed?: number}> = ({y, f, rows = 2, x0 = -300, x1 = 2300, crowd = true, seed = 5}) => (
  <g>
    {Array.from({length: rows}, (_, r) => {
      const ry = y + r * 90;
      return (
        <g key={r}>
          {crowd && <Crowd x0={x0} x1={x1} y={ry - 40} f={f} rows={1} s={1.15 + r * 0.15} seed={seed + r * 11} fromBehind hats={0.15} />}
          <rect x={x0} y={ry} width={x1 - x0} height={22} fill="#5A3E28" {...o(4)} />
          <rect x={x0} y={ry - 50} width={x1 - x0} height={14} fill="#6B4A30" {...o(3)} />
        </g>
      );
    })}
  </g>
);

// ------------------------------------------------------------------ gaslit night street
export const GasLamp: React.FC<{x: number; base: number; f: number; h?: number; seed?: number}> = ({x, base, f, h = 300, seed = 1}) => {
  const fl = 1 + noise1(f / 4, seed) * 0.08;
  const y = base - h;
  return (
    <g>
      <ellipse cx={x} cy={base + 4} rx={160 * fl} ry={26} fill="#F2C060" opacity={0.18} />
      <circle cx={x} cy={y - 26} r={110 * fl} fill="#FFD890" opacity={0.13} />
      <circle cx={x} cy={y - 26} r={50 * fl} fill="#FFE0A0" opacity={0.22} />
      <path d={`M${x},${base} V${y}`} stroke={ink} strokeWidth={12} />
      <path d={`M${x},${base} V${y}`} stroke="#2E3236" strokeWidth={6} />
      <path d={`M${x - 20},${y} L${x - 26},${y - 46} L${x + 26},${y - 46} L${x + 20},${y}Z`} fill="#FFE6A8" {...o(3.5)} />
      <path d={`M${x - 30},${y - 46} L${x},${y - 62} L${x + 30},${y - 46}Z`} fill="#2E3236" {...o(3)} />
      <path d={`M${x},${y - 12} q-5,-9 0,-18 q5,9 0,18Z`} fill="#FFB43A" />
      <path d={`M${x - 26},${y + 10} H${x + 26}`} stroke={ink} strokeWidth={5} />
    </g>
  );
};
const Facade: React.FC<{x: number; w: number; base: number; h: number; color: string; seed: number; f: number}> = ({x, w, base, h, color, seed, f}) => {
  const cols = Math.max(2, Math.floor(w / 90));
  const rowsN = Math.max(2, Math.floor(h / 120));
  return (
    <g>
      <rect x={x} y={base - h} width={w} height={h} fill={color} {...o(4)} />
      <rect x={x - 6} y={base - h - 14} width={w + 12} height={16} fill="#3A3230" {...o(3)} />
      {Array.from({length: rowsN * cols}, (_, k) => {
        const i = k % cols;
        const r = Math.floor(k / cols);
        const on = hash(seed * 13 + k) > 0.45;
        const fl = on ? 0.55 + 0.15 * noise1(f / 30 + k, seed) : 0;
        return <rect key={k} x={x + 22 + (i * (w - 44)) / cols} y={base - h + 30 + r * 120} width={(w - 44) / cols - 26} height={70} fill={on ? '#F2B850' : '#1E2434'} opacity={on ? fl + 0.3 : 1} stroke={ink} strokeWidth={2.5} />;
      })}
    </g>
  );
};
/** Night street: brick and clapboard fronts, gas lamps, cobbles, a gap (`slot`) for a specific façade. */
export const GaslitStreet: React.FC<{f: number; floor?: number; slotX?: number; slotW?: number; slot?: React.ReactNode; fog?: number; seed?: number}> = ({f, floor = 860, slotX = 760, slotW = 520, slot, fog = 0.25, seed = 2}) => {
  const fronts: React.ReactNode[] = [];
  let x = -700;
  let i = 0;
  while (x < 2700) {
    const w = 220 + Math.round(hash(i + seed) * 160);
    if (x + w > slotX && x < slotX + slotW) {
      x = slotX + slotW;
      continue;
    }
    const h = 380 + Math.round(hash(i * 5 + seed) * 220);
    fronts.push(<Facade key={i} x={x} w={w} base={floor - 40} h={h} color={['#5A3A30', '#4A3A34', '#5E4A3A', '#3E3A40'][i % 4]} seed={i + seed} f={f} />);
    x += w + 6;
    i++;
  }
  return (
    <g>
      <rect x={-900} y={-600} width={3800} height={2000} fill="#101A30" />
      {Array.from({length: 40}, (_, k) => <circle key={k} cx={-600 + hash(k * 3) * 3200} cy={-200 + hash(k * 7) * 400} r={1.5 + hash(k) * 1.5} fill="#E8E4D8" opacity={0.4 + 0.4 * Math.sin(f / 20 + k)} />)}
      {fronts}
      <g>{slot}</g>
      <rect x={-900} y={floor - 40} width={3800} height={40} fill="#4A4648" {...o(4)} />
      <rect x={-900} y={floor} width={3800} height={700} fill="#2E2C30" />
      {Array.from({length: 90}, (_, k) => <ellipse key={k} cx={-800 + (k % 30) * 120 + (Math.floor(k / 30) % 2) * 60} cy={floor + 30 + Math.floor(k / 30) * 40} rx={40} ry={12} fill="#3A383C" stroke="#1E1C20" strokeWidth={2} />)}
      <line x1={-900} y1={floor} x2={2900} y2={floor} stroke={ink} strokeWidth={5} />
      {[-200, 340, slotX - 80, slotX + slotW + 80, 1700, 2200].map((lx, k) => <GasLamp key={k} x={lx} base={floor - 6} f={f} seed={k + 3} />)}
      <rect x={-900} y={floor - 300} width={3800} height={360} fill="#8A9AB8" opacity={fog * (0.8 + 0.2 * Math.sin(f / 60))} style={{mixBlendMode: 'screen'}} />
    </g>
  );
};

// ------------------------------------------------------------------ train
const Driver: React.FC<{x: number; y: number; r: number; a: number; color?: string}> = ({x, y, r, a, color = '#7E2620'}) => (
  <g transform={`translate(${x},${y}) rotate(${a})`}>
    <circle r={r} fill={color} stroke={ink} strokeWidth={4} />
    <circle r={r * 0.78} fill="none" stroke="#3A1A14" strokeWidth={2} />
    {Array.from({length: 8}, (_, i) => <line key={i} x1={0} y1={0} x2={Math.cos((i * Math.PI) / 4) * r * 0.78} y2={Math.sin((i * Math.PI) / 4) * r * 0.78} stroke="#3A1A14" strokeWidth={2.5} />)}
    <circle r={r * 0.2} fill="#2A2A2E" />
  </g>
);
const Bunting: React.FC<{x0: number; x1: number; y: number; f: number}> = ({x0, x1, y, f}) => {
  const n = Math.max(2, Math.round((x1 - x0) / 46));
  const sw = Math.sin(f / 20) * 2;
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const a = x0 + ((x1 - x0) * i) / n;
        const b = x0 + ((x1 - x0) * (i + 1)) / n;
        return <path key={i} d={`M${a},${y} Q${(a + b) / 2},${y + 22 + sw} ${b},${y}`} fill="#141416" stroke={ink} strokeWidth={2} />;
      })}
    </g>
  );
};
export const ENGINE_LEN = 430;
export const CAR_LEN = 400;
export const TRAIN_LEN = (cars: number, s = 1) => (ENGINE_LEN + cars * (CAR_LEN + 16)) * s;
/** 4-4-0 locomotive with tender. Origin: front of the cowcatcher at rail level; faces +x. */
export const Locomotive: React.FC<{pl: {x: number; y: number; scale?: number; dir?: 1 | -1}; d: number; f: number; draped?: boolean; smoke?: boolean}> = ({pl, d, f, draped, smoke = true}) => {
  const s = pl.scale ?? 1;
  const dir = pl.dir ?? 1;
  const aD = ((d / 34) * 180) / Math.PI;
  const aS = ((d / 18) * 180) / Math.PI;
  const rodA = (d / 34);
  const rx = Math.cos(rodA) * 14;
  const ry = Math.sin(rodA) * 14;
  return (
    <g>
      {smoke && <g transform={`translate(${pl.x - dir * 70 * s},${pl.y - 210 * s})`}><Smoke x={0} y={0} f={f} n={8} size={1.1 * s} drift={-dir * 2.6} rise={1.4} seed={5} opacity={0.6} /></g>}
      <g transform={`translate(${pl.x},${pl.y}) scale(${s * dir},${s}) translate(-${ENGINE_LEN},0)`}>
        {/* tender */}
        <rect x={0} y={-112} width={120} height={78} fill="#3A3A40" {...o(4)} />
        <rect x={6} y={-126} width={108} height={16} fill="#2A2A2E" {...o(3)} />
        <Driver x={30} y={-18} r={17} a={aS} color="#5A2A22" />
        <Driver x={90} y={-18} r={17} a={aS} color="#5A2A22" />
        {/* cab */}
        <rect x={130} y={-160} width={74} height={110} fill="#6E2A22" {...o(4)} />
        <path d="M124,-160 L210,-160 L204,-176 L130,-176Z" fill="#2A2A2E" {...o(3)} />
        <rect x={146} y={-146} width={40} height={36} fill="#F2C060" opacity={0.5} {...o(2.5)} />
        {/* boiler, dome, bell, stack */}
        <rect x={200} y={-122} width={178} height={62} rx={26} fill="#2E3A3A" {...o(4)} />
        {[240, 290, 340].map((x) => <line key={x} x1={x} y1={-120} x2={x} y2={-62} stroke="#C9A24A" strokeWidth={3} />)}
        <path d="M262,-122 Q262,-146 280,-146 Q298,-146 298,-122Z" fill="#C9A24A" {...o(3)} />
        <path d="M330,-140 L320,-122 H346 L338,-140Z" fill="#C9A24A" {...o(2.5)} />
        <path d="M352,-122 L344,-170 Q362,-200 392,-170 L384,-122Z" fill="#2A2A2E" {...o(4)} />
        <rect x={378} y={-150} width={26} height={24} fill="#E8D8A0" {...o(3)} />
        <circle cx={391} cy={-138} r={7} fill="#FFE6A0" />
        <rect x={192} y={-62} width={200} height={16} fill="#3A3A40" {...o(3)} />
        {/* cowcatcher */}
        <path d="M392,-50 L430,-6 L392,-6Z" fill="#7E2620" {...o(3.5)} />
        {[400, 410, 420].map((x) => <line key={x} x1={x} y1={-48 + (x - 392) * 1.1} x2={x} y2={-6} stroke={ink} strokeWidth={2} />)}
        {/* wheels and rods */}
        <Driver x={226} y={-34} r={34} a={aD} />
        <Driver x={300} y={-34} r={34} a={aD} />
        <Driver x={352} y={-18} r={17} a={aS} color="#5A2A22" />
        <Driver x={388} y={-18} r={17} a={aS} color="#5A2A22" />
        <path d={`M${226 + rx},${-34 + ry} L${300 + rx},${-34 + ry}`} stroke="#B8B8BC" strokeWidth={6} strokeLinecap="round" />
        <path d={`M${300 + rx},${-34 + ry} L350,-58`} stroke="#B8B8BC" strokeWidth={5} strokeLinecap="round" />
        {draped && (
          <g>
            <Bunting x0={200} x1={378} y={-118} f={f} />
            <Bunting x0={130} x1={204} y={-158} f={f} />
            <path d="M374,-128 l14,-6 l14,6" fill="none" stroke="#141416" strokeWidth={5} />
          </g>
        )}
      </g>
    </g>
  );
};
/** Period passenger car. Origin: front end at rail level; the car extends back (−x for dir 1). */
export const RailCar: React.FC<{pl: {x: number; y: number; scale?: number; dir?: 1 | -1}; d: number; draped?: boolean; lit?: number; color?: string; f?: number}> = ({pl, d, draped, lit = 0.3, color, f = 0}) => {
  const s = pl.scale ?? 1;
  const dir = pl.dir ?? 1;
  const aS = ((d / 18) * 180) / Math.PI;
  const body = color ?? (draped ? '#2A2426' : '#6E4430');
  return (
    <g transform={`translate(${pl.x},${pl.y}) scale(${s * dir},${s}) translate(-${CAR_LEN},0)`}>
      <rect x={6} y={-150} width={CAR_LEN - 12} height={112} rx={6} fill={body} {...o(4)} />
      <path d={`M0,-150 Q${CAR_LEN / 2},-182 ${CAR_LEN},-150Z`} fill="#3A3230" {...o(4)} />
      <rect x={CAR_LEN / 2 - 90} y={-178} width={180} height={14} fill="#4A4240" {...o(2.5)} />
      {Array.from({length: 9}, (_, i) => <rect key={i} x={30 + i * 39} y={-132} width={24} height={38} rx={3} fill="#F2C060" opacity={0.25 + 0.6 * lit + 0.05 * noise1(f / 25 + i, 3)} stroke={ink} strokeWidth={2.5} />)}
      {draped && <Bunting x0={10} x1={CAR_LEN - 10} y={-148} f={f} />}
      <rect x={20} y={-40} width={CAR_LEN - 40} height={10} fill="#2A2A2E" {...o(2.5)} />
      {[46, 92, CAR_LEN - 92, CAR_LEN - 46].map((x) => <Driver key={x} x={x} y={-18} r={17} a={aS} color="#3A3A40" />)}
    </g>
  );
};
/** Engine + cars. x = front of the engine (world), y = rail top. Cars follow behind. */
export const Train: React.FC<{x: number; y: number; s?: number; dir?: 1 | -1; d: number; f: number; cars?: number; draped?: boolean; lit?: number}> = ({x, y, s = 1, dir = 1, d, f, cars = 3, draped, lit}) => (
  <g>
    {Array.from({length: cars}, (_, i) => <RailCar key={i} pl={{x: x - dir * (ENGINE_LEN + 16 + i * (CAR_LEN + 16)) * s, y, scale: s, dir}} d={d} draped={draped} lit={lit} f={f} />)}
    <Locomotive pl={{x, y, scale: s, dir}} d={d} f={f} draped={draped} />
  </g>
);
export const Track: React.FC<{y: number; x0?: number; x1?: number; s?: number}> = ({y, x0 = -1200, x1 = 4000, s = 1}) => (
  <g>
    <rect x={x0} y={y + 6 * s} width={x1 - x0} height={22 * s} fill="#8A7A62" />
    {Array.from({length: Math.ceil((x1 - x0) / (40 * s))}, (_, i) => <rect key={i} x={x0 + i * 40 * s} y={y + 2 * s} width={22 * s} height={12 * s} fill="#5A4030" stroke={ink} strokeWidth={2} />)}
    <rect x={x0} y={y - 2 * s} width={x1 - x0} height={6 * s} fill="#9A9AA0" stroke={ink} strokeWidth={2} />
  </g>
);
