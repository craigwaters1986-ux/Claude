// Episode 1 location backgrounds (MUST set from asset-requests B2).  Each draws a full
// 1920x1080 scene (with a 200 px margin for camera moves) in the flat, thick-ink style.
// All take the shot-local frame `f`; state props are 0..1 unless noted.  No people are drawn
// here (characters/crowds come from the animator's library); only tiny distant silhouettes.
import React from 'react';
import {C, W, H, FONT} from '../../styles/theme';
import {rng, clamp, lerp, hash, noise1} from '../../animations/core';
import {Sky, Ground, Hills, Building, Street, Tree, Sea, Rubble, BarbedWire, Cloud, Skyline} from '../Environment';
import {Smoke, Fire, Candle} from '../Effects';
import {Ship, SmallBoat, Plane, Tank} from '../Vehicles';
import {Hedgehog, Stake} from './Obstacles';

const ink = C.ink;
const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(t))).toString(16).padStart(2, '0')).join('');
};

/** Tiny distant figure silhouettes (troops in a queue, etc.). Cheap: one path. */
export const DistantFigures: React.FC<{pts: [number, number][]; s?: number; color?: string; f?: number}> = ({pts, s = 1, color = '#3A3A36', f = 0}) => {
  let d = '';
  pts.forEach(([x, y], i) => {
    const b = Math.sin(f / 6 + i) * 0.8 * s;
    d += `M${x},${y - 18 * s + b} a${4 * s},${4 * s} 0 1 0 0.1,0 M${x - 3 * s},${y - 13 * s + b} h${6 * s} v${13 * s} h${-6 * s}Z `;
  });
  return <path d={d} fill={color} />;
};

// =================================================================== B-01 Hall of Mirrors
export const HallOfMirrors: React.FC<{f: number}> = ({f}) => (
  <g>
    <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#C9A35A" />
    <rect x={-200} y={-200} width={W + 400} height={330} fill="#B48A44" />
    <rect x={-200} y={120} width={W + 400} height={24} fill="#E2B23C" stroke={ink} strokeWidth={4} />
    {Array.from({length: 8}).map((_, i) => {
      const x = -140 + i * 290;
      return (
        <g key={i}>
          <rect x={x - 26} y={144} width={52} height={600} fill="#D9B46A" stroke={ink} strokeWidth={4} />
          <path d={`M${x + 50},740 L${x + 50},300 Q${x + 145},180 ${x + 240},300 L${x + 240},740Z`} fill="#A9C4CC" stroke={ink} strokeWidth={5} />
          {[0, 1, 2].map((r) => <line key={r} x1={x + 50} y1={330 + r * 140} x2={x + 240} y2={330 + r * 140} stroke="#7E9AA4" strokeWidth={3} />)}
          <line x1={x + 145} y1={240} x2={x + 145} y2={740} stroke="#7E9AA4" strokeWidth={3} />
          <path d={`M${x + 80},${700 - ((f * 0.6 + i * 40) % 200)} l60,-90`} stroke="#fff" strokeWidth={10} opacity={0.35} strokeLinecap="round" />
        </g>
      );
    })}
    {/* chandeliers */}
    {[260, 960, 1660].map((cx, i) => (
      <g key={i} transform={`rotate(${Math.sin(f / 40 + i) * 1.6},${cx},-60)`}>
        <line x1={cx} y1={-60} x2={cx} y2={150} stroke={ink} strokeWidth={4} />
        <path d={`M${cx - 90},200 Q${cx},270 ${cx + 90},200 L${cx + 60},170 L${cx - 60},170Z`} fill="#E2B23C" stroke={ink} strokeWidth={4} />
        {[-80, -40, 0, 40, 80].map((dx, k) => (
          <g key={k}>
            <line x1={cx + dx} y1={200} x2={cx + dx} y2={176} stroke={ink} strokeWidth={3} />
            <circle cx={cx + dx} cy={170} r={7} fill="#FFE9A8" stroke={ink} strokeWidth={2} />
            <circle cx={cx + dx} cy={170} r={16} fill="#FFE9A8" opacity={0.3 + 0.08 * Math.sin(f / 5 + k)} />
          </g>
        ))}
      </g>
    ))}
    {/* parquet floor */}
    <rect x={-200} y={740} width={W + 400} height={540} fill="#9A6E44" />
    <line x1={-200} y1={740} x2={W + 200} y2={740} stroke={ink} strokeWidth={5} />
    {Array.from({length: 16}).map((_, i) => <line key={i} x1={W / 2 + (i - 8) * 60} y1={740} x2={W / 2 + (i - 8) * 260} y2={1280} stroke="#86603A" strokeWidth={3} />)}
    {/* long table with green cloth, receding */}
    <path d="M300,1080 L760,790 L1160,790 L1620,1080Z" fill="#3E6B4A" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M300,1080 L1620,1080 L1620,1110 L300,1110Z" fill="#2F5539" />
    {Array.from({length: 6}).map((_, i) => {
      const t = i / 6;
      const y = lerp(800, 1040, t * t);
      const x0 = lerp(780, 340, t * t);
      const x1 = lerp(1140, 1580, t * t);
      return <g key={i}><rect x={x0 + 20} y={y} width={30 + t * 30} height={8 + t * 8} fill="#F6F0DE" stroke={ink} strokeWidth={2} /><rect x={x1 - 50 - t * 30} y={y} width={30 + t * 30} height={8 + t * 8} fill="#F6F0DE" stroke={ink} strokeWidth={2} /></g>;
    })}
  </g>
);

// =================================================================== B-03 New York 1929
/** crash 0..1 draws the plunging line on the big board. */
export const WallStreet1929: React.FC<{f: number; crash?: number}> = ({f, crash = 1}) => {
  const pts: string[] = [];
  const N = 24;
  const shown = Math.max(2, Math.round(N * clamp(crash)));
  for (let i = 0; i < shown; i++) {
    const t = i / (N - 1);
    const v = t < 0.45 ? 0.75 + Math.sin(i * 1.7) * 0.04 + t * 0.2 : 0.84 - (t - 0.45) * 1.35 + Math.sin(i * 2.3) * 0.03;
    pts.push(`${120 + t * 460},${560 - v * 300}`);
  }
  return (
    <g>
      <Sky top="#8E9AA2" bottom="#D8D2C2" />
      {/* skyscrapers */}
      {[[60, 260, 420], [300, 200, 520], [1180, 220, 600], [1420, 180, 470], [1620, 240, 380], [-120, 200, 330]].map(([x, w, h], i) => (
        <g key={i}>
          <rect x={x} y={760 - h} width={w} height={h} fill={i % 2 ? '#9C9688' : '#ADA694'} stroke={ink} strokeWidth={4} />
          <rect x={x + w * 0.2} y={760 - h - 50} width={w * 0.6} height={52} fill={i % 2 ? '#9C9688' : '#ADA694'} stroke={ink} strokeWidth={4} />
          <rect x={x + w * 0.38} y={760 - h - 110} width={w * 0.24} height={62} fill={i % 2 ? '#9C9688' : '#ADA694'} stroke={ink} strokeWidth={4} />
          {Array.from({length: Math.floor(h / 50)}).map((_, r) => <line key={r} x1={x + 14} y1={760 - h + 30 + r * 50} x2={x + w - 14} y2={760 - h + 30 + r * 50} stroke="#6E6A60" strokeWidth={6} strokeDasharray="14 12" />)}
        </g>
      ))}
      {/* Exchange façade */}
      <path d="M640,330 L960,230 L1280,330Z" fill="#E8E1CF" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
      <rect x={620} y={330} width={680} height={40} fill="#E8E1CF" stroke={ink} strokeWidth={5} />
      {Array.from({length: 6}).map((_, i) => (
        <g key={i}>
          <rect x={660 + i * 112} y={370} width={44} height={330} fill="#F2EBDC" stroke={ink} strokeWidth={4} />
          {[0, 1, 2].map((k) => <line key={k} x1={672 + i * 112 + k * 10} y1={380} x2={672 + i * 112 + k * 10} y2={690} stroke="#C9C0AA" strokeWidth={2} />)}
        </g>
      ))}
      <rect x={620} y={700} width={680} height={60} fill="#D8D0BC" stroke={ink} strokeWidth={5} />
      <Ground y={760} color="#8E8A80" />
      <rect x={-200} y={880} width={W + 400} height={400} fill="#77736A" />
      {/* big board */}
      <g transform="translate(20,-20)">
        <rect x={90} y={210} width={520} height={380} rx={8} fill="#22302A" stroke={ink} strokeWidth={6} />
        {Array.from({length: 6}).map((_, i) => <line key={i} x1={110} y1={240 + i * 60} x2={590} y2={240 + i * 60} stroke="#3C5248" strokeWidth={2} />)}
        <polyline points={pts.join(' ')} fill="none" stroke={crash > 0.5 ? '#E0574A' : '#9BD18A'} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
        <path d={`M560,${470 + Math.sin(f / 4) * 3} l20,30 l20,-30`} fill="none" stroke="#E0574A" strokeWidth={6} opacity={crash > 0.9 ? 1 : 0} />
      </g>
    </g>
  );
};

// =================================================================== B-04 Reichstag (pre-1933 glass dome)
/** lit 0..1 lights windows; crack 0..1 draws the thin ink crack across the façade; street adds the grey street. */
export const Reichstag: React.FC<{f: number; lit?: number; crack?: number; street?: boolean; base?: number}> = ({f, lit = 0.2, crack = 0, street = true, base = 800}) => {
  const top = base - 360;
  const win = (x: number, y: number, k: number) => <rect key={`${x}-${y}`} x={x} y={y} width={30} height={56} fill={hash(k * 7.7) < lit ? '#FFD86B' : '#5E6E74'} stroke={ink} strokeWidth={3} />;
  const wins: React.ReactNode[] = [];
  [[330, 3], [1250, 3]].forEach(([x0, n], j) => {
    for (let c = 0; c < (n as number) * 3; c++) for (let r = 0; r < 2; r++) wins.push(win((x0 as number) + c * 38, top + 80 + r * 110, j * 50 + c * 3 + r));
  });
  return (
    <g>
      <Sky top="#8D969A" bottom="#CFCBC0" />
      {/* glass dome: steel lattice */}
      <g>
        <rect x={860} y={top - 60} width={200} height={70} fill="#9A9686" stroke={ink} strokeWidth={4} />
        <path d={`M860,${top - 60} Q860,${top - 190} 960,${top - 200} Q1060,${top - 190} 1060,${top - 60}Z`} fill="#A9C1C6" stroke={ink} strokeWidth={5} />
        {[-70, -35, 0, 35, 70].map((dx, i) => <path key={i} d={`M${960 + dx},${top - 60} Q${960 + dx * 0.9},${top - 170} 960,${top - 200}`} fill="none" stroke={ink} strokeWidth={3} />)}
        {[0.35, 0.65].map((k, i) => <line key={i} x1={865 + k * 25} y1={top - 60 - k * 120} x2={1055 - k * 25} y2={top - 60 - k * 120} stroke={ink} strokeWidth={3} />)}
        <rect x={952} y={top - 225} width={16} height={26} fill={ink} />
      </g>
      {/* main block + corner towers */}
      <rect x={300} y={top} width={1320} height={360} fill="#B5AC94" stroke={ink} strokeWidth={5} />
      {[300, 1520].map((x, i) => <rect key={i} x={x - 30} y={top - 70} width={130} height={430} fill="#ABA288" stroke={ink} strokeWidth={5} />)}
      {[270, 1490].map((x, i) => [0, 1, 2, 3].map((k) => <rect key={`${i}${k}`} x={x + 10 + k * 30} y={top - 90} width={18} height={22} fill="#ABA288" stroke={ink} strokeWidth={3} />))}
      {wins}
      {/* portico */}
      <path d={`M700,${top + 20} L960,${top - 50} L1220,${top + 20}Z`} fill="#C4BBA2" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
      <rect x={700} y={top + 20} width={520} height={30} fill="#C4BBA2" stroke={ink} strokeWidth={4} />
      {Array.from({length: 6}).map((_, i) => <rect key={i} x={725 + i * 86} y={top + 50} width={36} height={250} fill="#D4CCB4" stroke={ink} strokeWidth={4} />)}
      <rect x={680} y={base - 60} width={560} height={60} fill="#A39A80" stroke={ink} strokeWidth={4} />
      {crack > 0 && (
        <path d={`M300,${top + 60} L520,${top + 120} L610,${top + 90} L760,${top + 200} L930,${top + 170} L1040,${top + 260} L1260,${top + 210} L1420,${top + 300} L1620,${top + 270}`} fill="none" stroke={ink} strokeWidth={5} strokeLinejoin="miter" strokeDasharray={1500} strokeDashoffset={1500 * (1 - clamp(crack))} />
      )}
      {street && (
        <g>
          <Ground y={base} color="#9A958A" />
          <rect x={-200} y={base + 110} width={W + 400} height={400} fill="#7E7A70" />
          <line x1={-200} y1={base + 110} x2={W + 200} y2={base + 110} stroke={ink} strokeWidth={4} />
        </g>
      )}
      <g opacity={0.25}><Cloud x={(200 + f * 0.4) % (W + 300) - 150} y={120} s={1.2} color="#E8E8E2" outline={false} /></g>
    </g>
  );
};

// =================================================================== B-05 Berlin 1945 ruins
export const BerlinRuins: React.FC<{f: number}> = ({f}) => (
  <g>
    <Sky top="#6F6A64" bottom="#B7AA98" />
    {/* Brandenburg Gate silhouette */}
    <g fill="#5E5A54" stroke={ink} strokeWidth={4}>
      <rect x={760} y={330} width={400} height={50} />
      <rect x={740} y={380} width={440} height={24} />
      {Array.from({length: 6}).map((_, i) => <rect key={i} x={760 + i * 74} y={404} width={30} height={250} />)}
      <path d="M900,330 L900,300 L1020,300 L1020,330Z" />
      <path d="M940,300 L948,262 L975,262 L985,300Z" />
    </g>
    <Smoke x={420} y={520} f={f} n={8} size={60} rise={520} drift={140} color="#4A4744" seed={3} />
    <Smoke x={1500} y={560} f={f + 30} n={8} size={55} rise={500} drift={120} color="#57534E" seed={5} />
    {[[-150, 260, 420], [130, 220, 360], [1300, 250, 400], [1560, 260, 460]].map(([x, w, h], i) => (
      <Building key={i} x={x} base={760} w={w} h={h} color={['#8E867A', '#7D766C', '#958C80', '#857D72'][i]} damaged={0.65 + (i % 2) * 0.2} seed={i + 30} roof="flat" />
    ))}
    <Ground y={760} color="#8A8276" />
    <Rubble x={-100} y={790} w={600} seed={2} />
    <Rubble x={1200} y={800} w={700} seed={6} />
    <Rubble x={620} y={770} w={280} seed={9} color="#8F887C" />
    <Fire x={260} y={760} f={f} s={0.5} seed={2} />
    <Fire x={1700} y={770} f={f} s={0.45} seed={5} />
  </g>
);

// =================================================================== B-06 Bunker
/** view 'exterior' | 'interior'; door 0 (open) → 1 (closed) for the steel door at the corridor's end. */
export const Bunker: React.FC<{f: number; view?: 'exterior' | 'interior'; door?: number}> = ({f, view = 'interior', door = 0}) => {
  if (view === 'exterior')
    return (
      <g>
        <Sky top="#6E6A66" bottom="#A79C8E" />
        <Smoke x={1500} y={500} f={f} n={8} size={60} rise={480} drift={100} color="#4E4A46" seed={4} />
        <Tree x={250} y={760} kind="bare" s={1.8} />
        <Tree x={1650} y={770} kind="bare" s={1.5} />
        <Ground y={760} color="#7C7466" />
        <g stroke={ink} strokeWidth={5} strokeLinejoin="round">
          <path d="M700,770 L700,470 L1220,470 L1220,770Z" fill="#9C9A92" />
          <path d="M680,470 L1240,470 L1240,430 L680,430Z" fill="#8A8880" />
          <rect x={860} y={560} width={200} height={210} fill="#1E1E1E" />
          <rect x={1100} y={520} width={90} height={40} fill="#2A2A2A" />
        </g>
        {Array.from({length: 7}).map((_, i) => <line key={i} x1={720} y1={500 + i * 40} x2={1200} y2={500 + i * 40} stroke="#86847C" strokeWidth={2} />)}
        <Rubble x={300} y={800} w={330} seed={11} />
        <Rubble x={1260} y={810} w={420} seed={12} />
      </g>
    );
  const swing = Math.sin(f / 22) * 10;
  const vx = 960;
  const vy = 470;
  const flicker = 0.85 + 0.15 * Math.sin(f * 1.3) * (hash(Math.floor(f / 5)) > 0.85 ? 1 : 0);
  const dw = 220 * clamp(door);
  return (
    <g>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#7A7870" />
      <path d={`M-200,-200 L${vx - 200},${vy - 170} L${vx + 200},${vy - 170} L${W + 200},-200Z`} fill="#8E8C84" stroke={ink} strokeWidth={4} />
      <path d={`M-200,${H + 200} L${vx - 200},${vy + 170} L${vx + 200},${vy + 170} L${W + 200},${H + 200}Z`} fill="#6A6860" stroke={ink} strokeWidth={4} />
      <path d={`M-200,-200 L${vx - 200},${vy - 170} L${vx - 200},${vy + 170} L-200,${H + 200}Z`} fill="#85837A" stroke={ink} strokeWidth={4} />
      <path d={`M${W + 200},-200 L${vx + 200},${vy - 170} L${vx + 200},${vy + 170} L${W + 200},${H + 200}Z`} fill="#807E75" stroke={ink} strokeWidth={4} />
      {[0.25, 0.5, 0.75].map((k, i) => {
        const x0 = lerp(-200, vx - 200, k);
        const x1 = lerp(W + 200, vx + 200, k);
        const y0 = lerp(-200, vy - 170, k);
        const y1 = lerp(H + 200, vy + 170, k);
        return <path key={i} d={`M${x0},${y0} L${x0},${y1} M${x1},${y0} L${x1},${y1} M${x0},${y0} L${x1},${y0}`} stroke="#5E5C55" strokeWidth={4} fill="none" />;
      })}
      <path d={`M-200,180 L${vx - 200},${vy - 120}`} stroke="#4E4C46" strokeWidth={14} />
      <path d={`M-200,230 L${vx - 200},${vy - 100}`} stroke="#5A5852" strokeWidth={8} />
      {/* doorway + heavy steel door */}
      <rect x={vx - 110} y={vy - 120} width={220} height={290} fill="#151515" stroke={ink} strokeWidth={5} />
      {door > 0 && (
        <g>
          <rect x={vx - 110} y={vy - 120} width={dw} height={290} fill="#5A5E5C" stroke={ink} strokeWidth={5} />
          {[0.2, 0.5, 0.8].map((k, i) => <line key={i} x1={vx - 110} y1={vy - 120 + 290 * k} x2={vx - 110 + dw} y2={vy - 120 + 290 * k} stroke="#3E4240" strokeWidth={6} />)}
        </g>
      )}
      {/* swinging bulb */}
      <g transform={`rotate(${swing},${vx},-60)`}>
        <line x1={vx} y1={-60} x2={vx} y2={260} stroke={ink} strokeWidth={4} />
        <circle cx={vx} cy={280} r={110} fill="#FFE6A0" opacity={0.18 * flicker} />
        <path d={`M${vx - 16},252 L${vx + 16},252 L${vx + 12},264 L${vx - 12},264Z`} fill="#3A3A3A" stroke={ink} strokeWidth={3} />
        <circle cx={vx} cy={280} r={18} fill="#FFE6A0" stroke={ink} strokeWidth={3} opacity={flicker} />
      </g>
    </g>
  );
};

// =================================================================== B-08 Propaganda poster wall
/** shown: number of posters on the wall (fractional = the next one slapping on).  No text, no faces. */
export const PosterWall: React.FC<{f: number; shown?: number; n?: number}> = ({f, shown = 6, n = 6}) => {
  const designs = (i: number, w: number, h: number) => {
    const bg = ['#E9DFC6', '#B23A2E', '#1E1E1E'][i % 3];
    const fg = ['#B23A2E', '#1E1E1E', '#B23A2E'][i % 3];
    const fg2 = ['#1E1E1E', '#E9DFC6', '#E9DFC6'][i % 3];
    const k = i % 4;
    return (
      <g>
        <rect width={w} height={h} fill={bg} stroke={ink} strokeWidth={5} />
        {k === 0 && <path d={`M${w * 0.15},${h * 0.8} L${w * 0.55},${h * 0.3} L${w * 0.45},${h * 0.3} L${w * 0.75},${h * 0.12} L${w * 0.75},${h * 0.42} L${w * 0.66},${h * 0.36} L${w * 0.3},${h * 0.88}Z`} fill={fg} />}
        {k === 1 && Array.from({length: 9}).map((_, r) => <path key={r} d={`M${w / 2},${h * 0.9} L${w / 2 + Math.cos(Math.PI + (r + 0.5) * (Math.PI / 9)) * w},${h * 0.9 + Math.sin(Math.PI + (r + 0.5) * (Math.PI / 9)) * h * 0.8} L${w / 2 + Math.cos(Math.PI + (r + 0.9) * (Math.PI / 9)) * w},${h * 0.9 + Math.sin(Math.PI + (r + 0.9) * (Math.PI / 9)) * h * 0.8}Z`} fill={fg} />)}
        {k === 2 && <g><rect x={w * 0.3} y={h * 0.32} width={w * 0.4} height={h * 0.34} rx={18} fill={fg} /><rect x={w * 0.38} y={h * 0.62} width={w * 0.24} height={h * 0.3} fill={fg} />{[0, 1, 2].map((q) => <line key={q} x1={w * (0.4 + q * 0.1)} y1={h * 0.33} x2={w * (0.4 + q * 0.1)} y2={h * 0.45} stroke={bg} strokeWidth={5} />)}</g>}
        {k === 3 && <g><rect x={w * 0.1} y={h * 0.15} width={w * 0.8} height={h * 0.18} fill={fg} /><rect x={w * 0.1} y={h * 0.42} width={w * 0.8} height={h * 0.08} fill={fg2} /><circle cx={w / 2} cy={h * 0.72} r={w * 0.18} fill={fg} /></g>}
      </g>
    );
  };
  return (
    <g>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#C9BCA0" />
      {Array.from({length: 18}).map((_, r) => <line key={r} x1={-200} y1={60 + r * 50} x2={W + 200} y2={60 + r * 50} stroke="#B3A688" strokeWidth={3} />)}
      {Array.from({length: n}).map((_, i) => {
        const k = clamp(shown - i);
        if (k <= 0) return null;
        const x = 80 + i * 300;
        const y = 150 + (i % 2) * 60;
        const sc = k < 1 ? 1.25 - 0.25 * k : 1;
        const rot = (hash(i * 3.1) - 0.5) * 6;
        return (
          <g key={i} transform={`translate(${x + 120},${y + 170}) rotate(${rot}) scale(${sc}) translate(-120,-170)`} opacity={Math.min(1, k * 3)}>
            {designs(i, 240, 340)}
          </g>
        );
      })}
      <Ground y={820} color="#9A958A" />
    </g>
  );
};

// =================================================================== B-11 Factory interiors
/** kind: 'aircraft' (conveyor + hangar doors), 'tank' (tank line), 'shipyard' (slipway; launch 0..1). doors 0..1 opens the back doors. */
export const Factory: React.FC<{f: number; kind?: 'aircraft' | 'tank' | 'shipyard'; doors?: number; launch?: number; speed?: number}> = ({f, kind = 'aircraft', doors = 0, launch = 0, speed = 1}) => {
  if (kind === 'shipyard') {
    const t = clamp(launch);
    const slide = t * t * 900;
    return (
      <g>
        <Sky top="#9AA8AE" bottom="#DCD6C6" />
        {[200, 1500].map((x, i) => (
          <g key={i} stroke={ink} strokeWidth={5} fill="none">
            <path d={`M${x},820 L${x},200 L${x + 300 * (i ? -1 : 1)},200`} />
            <path d={`M${x + 260 * (i ? -1 : 1)},200 L${x + 260 * (i ? -1 : 1)},${330 + Math.sin(f / 30 + i) * 10}`} strokeWidth={3} />
            <path d={`M${x - 30},820 L${x},200 L${x + 30},820`} strokeWidth={3} />
          </g>
        ))}
        <Sea y={830} f={f} amp={6} layers={2} />
        <path d="M-200,700 L1300,900 L1300,1300 L-200,1300Z" fill="#8A8478" stroke={ink} strokeWidth={5} />
        <g transform={`translate(${slide * 0.99},${slide * 0.133}) rotate(7.6,500,620)`}>
          <path d="M100,560 L900,560 L860,700 L180,700Z" fill="#6E767A" stroke={ink} strokeWidth={6} strokeLinejoin="round" />
          <rect x={300} y={500} width={300} height={60} fill="#7E868A" stroke={ink} strokeWidth={5} />
          <line x1={150} y1={620} x2={880} y2={620} stroke="#B23A2E" strokeWidth={10} />
        </g>
        {t > 0.85 && <g opacity={clamp((t - 0.85) * 6) * (1 - clamp((t - 0.98) * 20))}>{[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={1300 + i * 40} cy={830 - Math.sin(i) * 40} r={20 + i * 6} fill="#fff" opacity={0.8} />)}</g>}
      </g>
    );
  }
  const off = (f * 2 * speed) % 600;
  return (
    <g>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#9C988C" />
      {/* back wall with sliding doors */}
      <rect x={560} y={260} width={800} height={480} fill="#BFD3D9" stroke={ink} strokeWidth={5} />
      <rect x={560} y={260} width={400 * (1 - doors)} height={480} fill="#7E7A70" stroke={ink} strokeWidth={5} />
      <rect x={1360 - 400 * (1 - doors)} y={260} width={400 * (1 - doors)} height={480} fill="#7E7A70" stroke={ink} strokeWidth={5} />
      {/* roof trusses */}
      {Array.from({length: 9}).map((_, i) => <path key={i} d={`M${-200 + i * 280},40 L${-60 + i * 280},180 L${80 + i * 280},40`} fill="none" stroke={ink} strokeWidth={5} />)}
      <line x1={-200} y1={40} x2={W + 200} y2={40} stroke={ink} strokeWidth={8} />
      <line x1={-200} y1={180} x2={W + 200} y2={180} stroke={ink} strokeWidth={6} />
      {Array.from({length: 5}).map((_, i) => <g key={i}><line x1={i * 480 - 100} y1={180} x2={i * 480 - 100} y2={330} stroke={ink} strokeWidth={3} /><path d={`M${i * 480 - 120},330 l20,25 l20,-25`} fill="none" stroke={ink} strokeWidth={4} /></g>)}
      <rect x={-200} y={780} width={W + 400} height={500} fill="#7A766C" />
      <line x1={-200} y1={780} x2={W + 200} y2={780} stroke={ink} strokeWidth={5} />
      {/* conveyor */}
      <rect x={-200} y={800} width={W + 400} height={40} fill="#4A4A46" stroke={ink} strokeWidth={5} />
      <line x1={-200} y1={820} x2={W + 200} y2={820} stroke="#8A8A80" strokeWidth={6} strokeDasharray="20 20" strokeDashoffset={-f * 2 * speed} />
      {[-1, 0, 1, 2, 3].map((i) => {
        const x = i * 600 + off - 200;
        return kind === 'aircraft' ? (
          <Plane key={i} x={x} y={760} f={0} s={0.9} kind="bomber" prop={false} mark="none" />
        ) : (
          <Tank key={i} x={x} y={800} dist={0} s={0.85} mark="none" exhaust={false} dust={false} />
        );
      })}
    </g>
  );
};

// =================================================================== B-14 Kremlin office + Moscow skyline
/** Distant Moscow skyline with onion domes and a Kremlin tower (for horizons). */
export const MoscowSkyline: React.FC<{base: number; color?: string; x0?: number; s?: number}> = ({base, color = '#7E7A84', x0 = 700, s = 1}) => (
  <g fill={color} transform={`translate(${x0},${base}) scale(${s})`}>
    <rect x={-500} y={-70} width={1100} height={70} />
    <path d="M-40,-70 L-40,-230 L-25,-230 L-25,-290 L0,-340 L25,-290 L25,-230 L40,-230 L40,-70Z" />
    {[[160, 140, 46], [250, 170, 56], [340, 130, 40], [-220, 120, 40], [-320, 150, 50]].map(([x, h, r], i) => (
      <g key={i}>
        <rect x={x - r * 0.6} y={-70 - h} width={r * 1.2} height={h} />
        <path d={`M${x - r * 0.75},${-70 - h} C${x - r},${-70 - h - r * 0.9} ${x},${-70 - h - r * 1.1} ${x},${-70 - h - r * 1.6} C${x},${-70 - h - r * 1.1} ${x + r},${-70 - h - r * 0.9} ${x + r * 0.75},${-70 - h}Z`} />
      </g>
    ))}
  </g>
);
export const KremlinOffice: React.FC<{f: number}> = ({f}) => (
  <g>
    <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#7A5A3A" />
    {Array.from({length: 12}).map((_, i) => <rect key={i} x={-180 + i * 190} y={520} width={160} height={220} fill="#6A4C30" stroke={ink} strokeWidth={3} />)}
    <rect x={1150} y={140} width={520} height={380} fill="#A9BCC6" stroke={ink} strokeWidth={6} />
    <g>
      <rect x={1150} y={420} width={520} height={100} fill="#9E3B30" />
      <svg x={1150} y={140} width={520} height={380} viewBox="0 0 520 380" overflow="hidden">
        <MoscowSkyline base={330} x0={260} s={0.55} color="#5E7A6E" />
        <g opacity={0.6}><Cloud x={(80 + f * 0.3) % 600 - 40} y={70} s={0.6} outline={false} /></g>
      </svg>
      <line x1={1410} y1={140} x2={1410} y2={520} stroke={ink} strokeWidth={8} />
      <line x1={1150} y1={330} x2={1670} y2={330} stroke={ink} strokeWidth={8} />
      <rect x={1150} y={140} width={520} height={380} fill="none" stroke={ink} strokeWidth={8} />
    </g>
    <path d="M1100,120 L1150,120 L1150,560 L1080,560Z" fill="#8E2E26" stroke={ink} strokeWidth={4} />
    <path d="M1720,120 L1670,120 L1670,560 L1740,560Z" fill="#8E2E26" stroke={ink} strokeWidth={4} />
    <rect x={-200} y={760} width={W + 400} height={500} fill="#5A3E28" />
    <line x1={-200} y1={760} x2={W + 200} y2={760} stroke={ink} strokeWidth={5} />
    <path d="M200,860 L1400,860 L1500,960 L100,960Z" fill="#8E2E26" opacity={0.9} />
  </g>
);

// =================================================================== B-15 Polish border crossing
/** barrier: 0 = down, 0..1 = lifting; snap = true breaks it in two instead. dawn 0..1 warms the sky. */
export const BorderCrossing: React.FC<{f: number; barrier?: number; snap?: boolean; dawn?: number}> = ({f, barrier = 0, snap = false, dawn = 0.6}) => {
  const ang = snap ? 0 : -80 * clamp(barrier);
  const stripes = (len: number) => Array.from({length: 8}).map((_, i) => <rect key={i} x={(i * len) / 8} y={-9} width={len / 8} height={18} fill={i % 2 ? '#fff' : '#C8102E'} />);
  return (
    <g>
      <Sky top={mix('#3E4E6A', '#9FB6C8', dawn)} bottom={mix('#C98E6E', '#F2D9A6', dawn)} />
      <circle cx={1500} cy={640 - dawn * 120} r={70} fill="#F6C67A" opacity={0.9} />
      <Hills y={700} color="#7E8C5A" amp={40} seed={4} />
      <Ground y={730} color="#9AA25E" />
      {Array.from({length: 6}).map((_, i) => <line key={i} x1={-200} y1={760 + i * 50} x2={W + 200} y2={770 + i * 60} stroke="#86904F" strokeWidth={4} />)}
      {/* sentry box */}
      <g stroke={ink} strokeWidth={5} strokeLinejoin="round">
        <path d="M1180,830 L1180,560 L1320,560 L1320,830Z" fill="#E8E1CF" />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M1180,${600 + i * 60} L1320,${620 + i * 60}`} stroke="#C8102E" strokeWidth={14} />)}
        <path d="M1160,560 L1250,500 L1340,560Z" fill="#8E2E26" />
        <rect x={1210} y={620} width={80} height={90} fill="#2A2A2A" />
      </g>
      {/* barrier post + pole */}
      <rect x={930} y={720} width={40} height={130} fill="#E8E1CF" stroke={ink} strokeWidth={4} />
      {snap && barrier > 0 ? (
        <g>
          <g transform="translate(950,740)"><rect x={0} y={-9} width={260} height={18} fill="none" stroke={ink} strokeWidth={4} />{stripes(260)}</g>
          <g transform={`translate(${1210 + 60 * barrier},${740 + 110 * barrier}) rotate(${60 * barrier})`}>{stripes(320)}<rect x={0} y={-9} width={320} height={18} fill="none" stroke={ink} strokeWidth={4} /></g>
        </g>
      ) : (
        <g transform={`translate(950,740) rotate(${ang})`}>
          {stripes(580)}
          <rect x={0} y={-9} width={580} height={18} fill="none" stroke={ink} strokeWidth={4} />
        </g>
      )}
      <circle cx={950} cy={740} r={12} fill={ink} />
      <rect x={1520} y={760} width={30} height={90} fill="#E8E1CF" stroke={ink} strokeWidth={4} />
    </g>
  );
};

// =================================================================== B-21 Dunkirk
/** Wide view: town with black oil smoke (left), beach with troop queues, the long East Mole with destroyers alongside, little ships ferrying to larger ships. */
export const Dunkirk: React.FC<{f: number}> = ({f}) => {
  const r = rng(21);
  const beachQueues: [number, number][] = [];
  for (let q = 0; q < 4; q++) for (let k = 0; k < 16; k++) beachQueues.push([1000 + q * 190 + k * 9, 770 + k * 9 + r() * 3]);
  const moleTroops: [number, number][] = [];
  for (let k = 0; k < 38; k++) moleTroops.push([180 + k * 18, 615 - k * 1.2]);
  return (
    <g>
      <Sky top="#7E8790" bottom="#CFC6B2" />
      <Skyline base={640} color="#6E6A66" seed={8} tall={0.7} />
      <Smoke x={160} y={560} f={f} n={10} size={80} rise={640} drift={360} color="#1E1E1E" opacity={0.9} seed={2} />
      <Smoke x={420} y={570} f={f + 40} n={9} size={70} rise={600} drift={330} color="#262626" opacity={0.85} seed={4} />
      <Sea y={600} f={f} amp={6} layers={2} colors={['#5E8394', '#4E7384']} />
      {/* East Mole: long jetty into the sea */}
      <path d="M-200,640 L1000,590 L1000,604 L-200,662Z" fill="#9A9488" stroke={ink} strokeWidth={4} />
      {Array.from({length: 22}).map((_, i) => <line key={i} x1={-180 + i * 55} y1={662 - i * 2.6} x2={-180 + i * 55} y2={690 - i * 2.6} stroke={ink} strokeWidth={4} />)}
      <Ship x={420} y={575} f={f} s={0.42} kind="warship" seed={1} />
      <Ship x={820} y={560} f={f} s={0.36} kind="warship" seed={2} />
      <DistantFigures pts={moleTroops} s={0.9} f={f} />
      <Ship x={1500} y={575} f={f} s={0.3} kind="freighter" seed={3} />
      {[0, 1, 2, 3].map((i) => {
        const t = ((f * 0.8 + i * 160) % 640) / 640;
        const x = lerp(1180 + i * 120, 1480 + i * 40, t < 0.5 ? t * 2 : 2 - t * 2);
        return <SmallBoat key={i} x={x} y={665 + i * 12} f={f} s={0.32} dir={t < 0.5 ? 1 : -1} seed={i} color={['#B23A2E', '#3F6EA6', '#EEE8D8', '#566B3C'][i]} passengers={t < 0.5 ? 0 : 3} />;
      })}
      {/* beach */}
      <path d="M-200,700 Q700,680 2120,740 L2120,1300 L-200,1300Z" fill="#D9C08E" stroke={ink} strokeWidth={5} />
      <path d={`M900,${720 + Math.sin(f / 15) * 4} Q1400,${728 + Math.sin(f / 15) * 4} ${W + 200},${745 + Math.sin(f / 15) * 4}`} stroke="#fff" strokeWidth={6} fill="none" opacity={0.7} />
      <DistantFigures pts={beachQueues} s={1.5} f={f} color="#4A4A36" />
    </g>
  );
};

// =================================================================== B-22 Paris boulevard
/** flags 0..1 unfurls tricolours from the balconies. */
export const ParisBoulevard: React.FC<{f: number; flags?: number}> = ({f, flags = 0}) => (
  <g>
    <Sky top="#A9C4D0" bottom="#EDE4CC" />
    {/* Eiffel Tower */}
    <g fill="none" stroke="#5E5A56" strokeWidth={6} strokeLinejoin="round">
      <path d="M880,640 Q930,420 950,180 L970,180 Q990,420 1040,640" />
      <path d="M902,560 L1018,560 M922,430 L998,430 M942,300 L978,300" />
      <path d="M902,640 Q960,590 1018,640" />
      <line x1={960} y1={180} x2={960} y2={130} />
    </g>
    {[[-150, 1], [1240, -1]].map(([x0, d], j) => (
      <g key={j}>
        {[0, 1].map((b) => {
          const x = (x0 as number) + b * 420;
          return (
            <g key={b}>
              <rect x={x} y={300} width={400} height={480} fill="#E8DCC0" stroke={ink} strokeWidth={5} />
              <path d={`M${x - 10},300 L${x + 30},230 L${x + 370},230 L${x + 410},300Z`} fill="#6E7680" stroke={ink} strokeWidth={5} />
              {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => (
                <g key={`${r}${c}`}>
                  <rect x={x + 30 + c * 92} y={340 + r * 140} width={50} height={90} fill="#5E7884" stroke={ink} strokeWidth={3} />
                  <path d={`M${x + 22 + c * 92},${432 + r * 140} h66 M${x + 22 + c * 92},${416 + r * 140} h66`} stroke={ink} strokeWidth={3} />
                  {flags > 0 && r === 0 && c % 2 === (b + j) % 2 && (
                    <g transform={`translate(${x + 30 + c * 92},${432 + r * 140}) scale(1,${clamp(flags * 1.5 - c * 0.1)}) skewX(${Math.sin(f / 9 + c) * 4})`}>
                      <rect x={0} y={0} width={17} height={110} fill="#22397A" /><rect x={17} y={0} width={17} height={110} fill="#fff" /><rect x={34} y={0} width={17} height={110} fill="#C8102E" />
                      <rect x={0} y={0} width={51} height={110} fill="none" stroke={ink} strokeWidth={3} />
                    </g>
                  )}
                </g>
              )))}
            </g>
          );
        })}
      </g>
    ))}
    <Tree x={700} y={790} f={f} s={1.1} />
    <Tree x={1220} y={790} f={f} s={1.0} seed={3} />
    <Ground y={780} color="#BDB6A6" />
    <rect x={-200} y={880} width={W + 400} height={400} fill="#8E887C" />
    <line x1={-200} y1={880} x2={W + 200} y2={880} stroke={ink} strokeWidth={4} />
  </g>
);

// =================================================================== B-24 Underground shelter
export const UndergroundShelter: React.FC<{f: number}> = ({f}) => {
  const flick = hash(Math.floor(f / 3)) > 0.9 ? 0.4 : 1;
  return (
    <g>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#2A2A28" />
      <path d={`M-200,800 L-200,300 Q960,-260 ${W + 200},300 L${W + 200},800Z`} fill="#E3DCC4" stroke={ink} strokeWidth={6} />
      {Array.from({length: 26}).map((_, i) => <line key={i} x1={-200 + i * 90} y1={100} x2={-200 + i * 90} y2={800} stroke="#CFC6AA" strokeWidth={2} />)}
      {Array.from({length: 12}).map((_, i) => <line key={i} x1={-200} y1={250 + i * 50} x2={W + 200} y2={250 + i * 50} stroke="#CFC6AA" strokeWidth={2} />)}
      <rect x={-200} y={560} width={W + 400} height={36} fill="#3F6EA6" opacity={0.85} />
      <g transform="translate(960,300)">
        <rect x={-260} y={-50} width={520} height={100} rx={6} fill="#22324A" stroke={ink} strokeWidth={5} />
        <text x={0} y={18} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={54} fill="#F4EBD6" letterSpacing={4}>UNDERGROUND</text>
      </g>
      {[380, 1540].map((x, i) => (
        <g key={i} opacity={i === 1 ? flick : 1}>
          <circle cx={x} cy={200} r={90} fill="#FFE6A0" opacity={0.18} />
          <circle cx={x} cy={200} r={22} fill="#FFE6A0" stroke={ink} strokeWidth={4} />
        </g>
      ))}
      {[200, 1100].map((x, i) => <g key={i}><rect x={x} y={720} width={420} height={22} fill="#7A5A3A" stroke={ink} strokeWidth={4} /><rect x={x + 20} y={742} width={14} height={58} fill={ink} /><rect x={x + 386} y={742} width={14} height={58} fill={ink} /></g>)}
      <rect x={-200} y={800} width={W + 400} height={160} fill="#8A8478" stroke={ink} strokeWidth={5} />
      <rect x={-200} y={800} width={W + 400} height={14} fill="#E3C77A" />
      <rect x={-200} y={960} width={W + 400} height={400} fill="#3A3634" stroke={ink} strokeWidth={5} />
      <line x1={-200} y1={1010} x2={W + 200} y2={1010} stroke="#8A8A80" strokeWidth={8} />
      <line x1={-200} y1={1060} x2={W + 200} y2={1060} stroke="#8A8A80" strokeWidth={8} />
    </g>
  );
};

// =================================================================== B-28 Pearl Harbor + Oahu airfield
/** Battleships moored along Ford Island under green hills.  burning: per-ship 0/1 flags. */
export const PearlHarbor: React.FC<{f: number; burning?: number[]; calm?: boolean}> = ({f, burning = [], calm = false}) => (
  <g>
    <Sky top="#8FB9D2" bottom="#EAE6CF" />
    <Hills y={470} color="#5E8A4E" amp={150} seed={7} />
    <Hills y={540} color="#7AA05A" amp={70} seed={3} />
    <Sea y={560} f={calm ? 0 : f} amp={calm ? 2 : 6} layers={2} colors={['#5E93A6', '#4E8396']} />
    {/* Ford Island */}
    <path d="M200,600 Q960,560 1800,610 L1760,640 Q960,615 240,640Z" fill="#B9B08A" stroke={ink} strokeWidth={4} />
    {[500, 900, 1300].map((x, i) => <rect key={i} x={x} y={572} width={110} height={36} fill="#9C9A92" stroke={ink} strokeWidth={3} />)}
    {[0, 1, 2, 3, 4].map((i) => (
      <Ship key={i} x={260 + i * 330} y={700 + (i % 2) * 18} f={calm ? 0 : f} s={0.55} kind="warship" seed={i + 1} smoke={false} burning={burning[i] === 1} />
    ))}
  </g>
);
export const OahuAirfield: React.FC<{f: number; burning?: number[]}> = ({f, burning = [1, 0, 1, 0, 0, 1]}) => (
  <g>
    <Sky top="#8FB9D2" bottom="#EAE6CF" />
    <Hills y={520} color="#6E9256" amp={120} seed={11} />
    {[0, 1, 2].map((i) => (
      <g key={i} stroke={ink} strokeWidth={5}>
        <path d={`M${120 + i * 620},620 L${120 + i * 620},450 Q${330 + i * 620},360 ${540 + i * 620},450 L${540 + i * 620},620Z`} fill="#A8A498" />
        <rect x={240 + i * 620} y={510} width={180} height={110} fill="#3A3A3A" />
      </g>
    ))}
    <rect x={-200} y={620} width={W + 400} height={700} fill="#B3AE9E" stroke={ink} strokeWidth={5} />
    {[0, 1].map((row) => Array.from({length: 6}).map((_, i) => {
      const x = 80 + i * 330 + row * 120;
      const y = 740 + row * 150;
      const b = burning[i] === 1 && row === 0;
      return (
        <g key={`${row}${i}`}>
          <Plane x={x} y={y} f={f} s={0.7 + row * 0.15} kind="p40" prop={false} gear />
          {b && <Fire x={x - 10} y={y + 20} f={f} s={0.6} seed={i} />}
          {b && <Smoke x={x} y={y - 40} f={f} n={8} size={40} rise={420} drift={120} color="#2E2E2E" seed={i + 2} />}
        </g>
      );
    }))}
  </g>
);

// =================================================================== B-31 Stalingrad
export const Stalingrad: React.FC<{f: number}> = ({f}) => (
  <g>
    <Sky top="#8C9298" bottom="#D2D4D0" />
    {/* Volga behind, iced */}
    <rect x={-200} y={560} width={W + 400} height={70} fill="#9DB4BE" stroke={ink} strokeWidth={4} />
    <rect x={-200} y={545} width={W + 400} height={18} fill="#B9B8AE" />
    {/* grain elevator */}
    <g stroke={ink} strokeWidth={5} fill="#8A8680">
      <rect x={1250} y={250} width={150} height={360} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={1400 + i * 70} y={370} width={64} height={240} rx={30} />)}
      <path d="M1250,250 L1270,230 L1330,236 L1380,222 L1400,250Z" />
    </g>
    <Smoke x={1300} y={240} f={f} n={8} size={45} rise={300} drift={100} color="#55524E" seed={4} />
    {[[-160, 240, 380], [140, 200, 300], [420, 260, 420], [760, 220, 340], [1640, 260, 300]].map(([x, w, h], i) => (
      <Building key={i} x={x} base={780} w={w} h={h} color={['#A49A8C', '#958C80', '#ACA294', '#9A9286', '#A0988C'][i]} damaged={0.55 + (i % 3) * 0.15} seed={i + 60} roof="flat" />
    ))}
    <Ground y={780} color={C.snow} />
    <Rubble x={-100} y={810} w={520} seed={31} color="#BDB8AE" />
    <Rubble x={1100} y={820} w={620} seed={32} color="#B6B1A6" />
    <path d="M-200,790 Q500,770 960,800 T2120,790" fill="none" stroke="#D9DEE2" strokeWidth={14} />
  </g>
);

// =================================================================== B-33 Normandy night fields
export const NormandyNight: React.FC<{f: number}> = ({f}) => {
  const r = rng(33);
  const stars = Array.from({length: 60}).map(() => [r() * W, r() * 420, r()] as const);
  return (
    <g>
      <Sky top="#0E1626" bottom="#2E3F5A" />
      {stars.map(([x, y, k], i) => <circle key={i} cx={x} cy={y} r={1.5 + k * 1.5} fill="#F4F1E0" opacity={0.4 + 0.5 * Math.abs(Math.sin(f / 30 + i))} />)}
      <circle cx={1560} cy={170} r={60} fill="#F2EBD0" stroke={ink} strokeWidth={4} />
      <circle cx={1560} cy={170} r={110} fill="#F2EBD0" opacity={0.12} />
      <path d="M1180,600 L1180,470 L1200,470 L1210,380 L1220,470 L1240,470 L1240,600Z" fill="#1E2838" stroke={ink} strokeWidth={3} />
      <Hills y={600} color="#22303E" amp={40} seed={5} outline={false} />
      {/* patchwork fields with hedgerows, receding */}
      {[0, 1, 2, 3].map((row) => {
        const y0 = 610 + row * row * 40 + row * 30;
        const y1 = 610 + (row + 1) * (row + 1) * 40 + (row + 1) * 30;
        return (
          <g key={row}>
            <rect x={-200} y={y0} width={W + 400} height={y1 - y0} fill={['#2E4034', '#34483A', '#2A3C30', '#3A4E3E'][row]} />
            <path d={`M-200,${y1} ${Array.from({length: 24}).map((_, i) => `L${-200 + i * 100},${y1 - 6 - Math.abs(noise1(i * 0.7, row)) * (8 + row * 6)}`).join(' ')} L${W + 200},${y1}Z`} fill="#18241C" />
            {Array.from({length: 4}).map((_, i) => <line key={i} x1={(i + 0.5 + row * 0.3) * 520 - 200} y1={y0} x2={(i + 0.5 + row * 0.3) * 520 - 200 + (i - 1.5) * 60 * (row + 1)} y2={y1} stroke="#18241C" strokeWidth={6 + row * 3} />)}
          </g>
        );
      })}
      <Tree x={300} y={700} kind="round" s={0.9} color="#1E2E24" f={f} />
      <Tree x={1700} y={760} kind="round" s={1.1} color="#1A2820" f={f} seed={4} />
    </g>
  );
};

// =================================================================== B-34 D-Day beach
/** sky 0 = day, 1 = dusk, 2 = night (built-in time lapse); obstacles in perspective; surf animates. */
export const DDayBeach: React.FC<{f: number; sky?: number; obstacles?: boolean}> = ({f, sky = 0, obstacles = true}) => {
  const top = sky < 1 ? mix('#8FA6B4', '#C98E6E', sky) : mix('#C98E6E', '#141E2E', sky - 1);
  const bot = sky < 1 ? mix('#D8D6C8', '#F2C08A', sky) : mix('#F2C08A', '#3A4A60', sky - 1);
  const dark = clamp(sky - 1) * 0.5;
  return (
    <g>
      <Sky top={top} bottom={bot} />
      <rect x={-200} y={430} width={W + 400} height={120} fill={mix('#6E8C9A', '#2A3A4C', clamp(sky / 2))} />
      {/* bluffs */}
      <path d="M-200,520 L-200,330 Q200,300 500,350 Q800,290 1100,340 Q1500,300 2120,350 L2120,520Z" fill="#8C9460" stroke={ink} strokeWidth={5} />
      <path d="M-200,520 L-200,400 Q300,380 700,420 Q1200,390 2120,420 L2120,520Z" fill="#A89C78" stroke={ink} strokeWidth={4} />
      {/* shingle bank */}
      <path d="M-200,560 Q960,520 2120,560 L2120,600 Q960,570 -200,600Z" fill="#8A8478" stroke={ink} strokeWidth={4} />
      <rect x={-200} y={590} width={W + 400} height={700} fill="#D2BE8E" />
      {/* surf */}
      {[0, 1].map((k) => <path key={k} d={`M-200,${880 + k * 60 + Math.sin(f / 20 + k) * 10} Q480,${860 + k * 60} 960,${885 + k * 60 + Math.sin(f / 20 + k) * 10} T2120,${880 + k * 60}`} stroke="#fff" strokeWidth={8} fill="none" opacity={0.7} />)}
      <rect x={-200} y={900 + Math.sin(f / 20) * 10} width={W + 400} height={400} fill="#6E8C9A" opacity={0.85} />
      {obstacles && (
        <g>
          {[[200, 690, 0.5], [520, 670, 0.4], [880, 700, 0.55], [1240, 680, 0.45], [1600, 700, 0.5], [380, 800, 0.85], [1050, 820, 0.9], [1500, 810, 0.8]].map(([x, y, s], i) => (i % 3 === 2 ? <Stake key={i} x={x} y={y} s={s} /> : <Hedgehog key={i} x={x} y={y} s={s} />))}
        </g>
      )}
      {dark > 0 && <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#0E1520" opacity={dark} />}
    </g>
  );
};

// =================================================================== B-36 Camp perimeter (sombre)
/** view 'road' (gate, fence, watchtower) or 'barracks' (rows of empty huts).  Desaturated; no inscription, no interiors. */
export const CampPerimeter: React.FC<{f: number; view?: 'road' | 'barracks'}> = ({f, view = 'road'}) => (
  <g>
    <Sky top="#8A8C8C" bottom="#C2C2BC" />
    <g opacity={0.5}><Cloud x={(300 + f * 0.15) % (W + 400) - 200} y={150} s={1.6} color="#A6A8A6" outline={false} /><Cloud x={(1300 + f * 0.12) % (W + 400) - 200} y={220} s={1.3} color="#9EA09E" outline={false} /></g>
    <Ground y={640} color="#8E8C80" />
    {view === 'road' ? (
      <g>
        <path d="M860,640 L1060,640 L1600,1300 L320,1300Z" fill="#A09A8C" />
        <Tree x={250} y={700} kind="bare" s={1.6} />
        <Tree x={1650} y={720} kind="bare" s={1.4} />
        <BarbedWire x0={-200} x1={820} y={660} posts={8} h={120} />
        <BarbedWire x0={1100} x1={2120} y={660} posts={8} h={120} />
        {/* plain wooden gate — no inscription */}
        <g stroke={ink} strokeWidth={5} fill="#6E6A60">
          <rect x={820} y={480} width={34} height={180} />
          <rect x={1066} y={480} width={34} height={180} />
          <rect x={800} y={470} width={320} height={26} />
          <path d="M854,520 L1066,520 L1066,660 L854,660Z" fill="none" />
          <path d="M854,520 L1066,660 M1066,520 L854,660" strokeWidth={3} />
        </g>
        {/* wooden watchtower */}
        <g stroke={ink} strokeWidth={5} fill="#6E6A60">
          <path d="M1310,660 L1350,420 M1450,660 L1410,420 M1330,560 L1430,560" fill="none" />
          <rect x={1320} y={360} width={120} height={70} />
          <path d="M1300,360 L1380,310 L1460,360Z" />
          <rect x={1340} y={375} width={80} height={30} fill="#3A3A38" />
        </g>
      </g>
    ) : (
      <g>
        {[0, 1, 2, 3].map((row) => {
          const s = 0.5 + row * 0.25;
          const y = 640 + row * row * 30 + row * 40;
          return Array.from({length: 4}).map((_, i) => {
            const x = -100 + i * 560 * s + row * 120;
            return (
              <g key={`${row}${i}`} transform={`translate(${x},${y}) scale(${s})`} stroke={ink} strokeWidth={5 / s}>
                <path d="M0,0 L0,-140 L60,-200 L440,-200 L500,-140 L500,0Z" fill="#7E7A70" />
                <path d="M0,-140 L60,-200 L440,-200 L500,-140Z" fill="#5E5A54" />
                {[0, 1, 2, 3].map((k) => <rect key={k} x={50 + k * 110} y={-110} width={50} height={40} fill="#4A4A48" strokeWidth={3 / s} />)}
              </g>
            );
          }).reverse();
        }).reverse()}
        <BarbedWire x0={-200} x1={2120} y={980} posts={10} h={160} />
      </g>
    )}
  </g>
);

// =================================================================== B-37 Memorial (sombre)
/** reveal 0..1 brings up the plain memorial wall; candles = how many candles are lit (rows in perspective, max 48). */
export const Memorial: React.FC<{f: number; reveal?: number; candles?: number}> = ({f, reveal = 1, candles = 48}) => {
  const items: React.ReactNode[] = [];
  let n = 0;
  for (let row = 0; row < 4; row++) {
    const s = 0.45 + row * 0.22;
    const y = 700 + row * 70 + row * row * 12;
    const count = 14 - row * 2;
    for (let i = 0; i < count; i++) {
      const lit = clamp(candles - n);
      n++;
      if (lit <= 0) continue;
      const x = W / 2 + (i - (count - 1) / 2) * 120 * s * 1.4;
      items.push(<Candle key={`${row}-${i}`} x={x} y={y} f={f} s={s} seed={row * 20 + i} lit={lit} />);
    }
  }
  return (
    <g>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#0C0C0E" />
      <g opacity={reveal}>
        <rect x={260} y={120} width={1400} height={560} fill="#3A3A3C" stroke={ink} strokeWidth={6} />
        {Array.from({length: 7}).map((_, r) => <line key={r} x1={260} y1={120 + r * 80} x2={1660} y2={120 + r * 80} stroke="#2E2E30" strokeWidth={3} />)}
        {Array.from({length: 7}).map((_, r) => Array.from({length: 7}).map((__, c) => <line key={`${r}${c}`} x1={260 + c * 200 + (r % 2) * 100} y1={120 + r * 80} x2={260 + c * 200 + (r % 2) * 100} y2={200 + r * 80} stroke="#2E2E30" strokeWidth={3} />))}
        <rect x={-200} y={680} width={W + 400} height={600} fill="#2A2A2A" />
      </g>
      <ellipse cx={W / 2} cy={820} rx={900} ry={220} fill="#FFD27A" opacity={0.06 * Math.min(1, candles / 10)} />
      {items}
    </g>
  );
};

// =================================================================== B-42 Hiroshima (no people)
/** state 'before' = morning river-delta city with the domed Industrial Promotion Hall; 'after' = flattened grey silhouette with the dome skeleton. */
export const Hiroshima: React.FC<{f: number; state?: 'before' | 'after'}> = ({f, state = 'before'}) => {
  const after = state === 'after';
  const r = rng(42);
  const blocks: React.ReactNode[] = [];
  for (let row = 0; row < 7; row++) {
    const y = 470 + row * row * 9 + row * 40;
    const s = 0.4 + row * 0.12;
    for (let i = 0; i < 26; i++) {
      const x = -150 + i * 85 * s * 1.5 + (row % 2) * 30 + r() * 20;
      const w = (40 + r() * 30) * s;
      const h = (after ? 4 + r() * 10 : 18 + r() * 30) * s;
      if (r() < (after ? 0.75 : 0.1)) continue;
      blocks.push(<rect key={`${row}-${i}`} x={x} y={y - h} width={w} height={h} fill={after ? '#5E5C58' : ['#C9B89A', '#B5A58A', '#A89A80', '#D2C4A6'][i % 4]} stroke={after ? 'none' : ink} strokeWidth={2} />);
      if (!after && r() < 0.6) blocks.push(<path key={`r${row}-${i}`} d={`M${x - 3},${y - h} L${x + w / 2},${y - h - 10 * s} L${x + w + 3},${y - h}Z`} fill="#5E5A56" />);
    }
  }
  const sky = after ? ['#8E8C88', '#A9A7A2'] : ['#9EC4D8', '#F2E6C6'];
  const land = after ? '#77756F' : '#A9B184';
  const river = after ? '#8A8C8C' : '#6E9CB0';
  return (
    <g>
      <Sky top={sky[0]} bottom={sky[1]} />
      <Hills y={420} color={after ? '#6E6C68' : '#6E8A5E'} amp={70} seed={42} outline={!after} />
      <rect x={-200} y={430} width={W + 400} height={900} fill={land} />
      {/* river delta: branches flowing to the sea (bottom) */}
      {[[300, -80], [760, 40], [1180, 120], [1600, 240]].map(([x, dx], i) => (
        <path key={i} d={`M${x},430 C${x + dx * 0.3},600 ${x + dx},800 ${x + dx * 1.6},1300 L${x + dx * 1.6 + 120},1300 C${x + dx + 70},800 ${x + dx * 0.3 + 30},600 ${x + 34},430Z`} fill={river} stroke={after ? 'none' : ink} strokeWidth={3} />
      ))}
      {/* T-shaped Aioi bridge near the dome */}
      <path d="M740,600 L900,600 M820,600 L820,640" stroke={after ? '#4A4A48' : ink} strokeWidth={8} />
      {blocks}
      {/* Industrial Promotion Hall */}
      <g transform="translate(940,590)">
        {after ? (
          <g stroke="#2E2E2E" strokeWidth={5} fill="none">
            <path d="M-70,0 L-70,-40 L-30,-40 L-30,-58 M70,0 L70,-30 L30,-36" />
            <path d="M-26,-58 Q-26,-100 0,-104 Q26,-100 26,-58" />
            <path d="M-13,-60 Q-13,-96 0,-104 M13,-60 Q13,-96 0,-104 M-24,-80 L24,-80" strokeWidth={3} />
          </g>
        ) : (
          <g stroke={ink} strokeWidth={4}>
            <rect x={-80} y={-40} width={160} height={40} fill="#D8CDB0" />
            <rect x={-30} y={-60} width={60} height={22} fill="#D8CDB0" />
            <path d="M-26,-58 Q-26,-102 0,-104 Q26,-102 26,-58Z" fill="#6E8A7A" />
          </g>
        )}
      </g>
      {after && <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#B9B7B2" opacity={0.25 + 0.05 * Math.sin(f / 60)} />}
    </g>
  );
};

// =================================================================== B-43 Nagasaki (no people)
export const Nagasaki: React.FC<{f: number; state?: 'before' | 'after'}> = ({f, state = 'before'}) => {
  const after = state === 'after';
  const r = rng(43);
  const houses: React.ReactNode[] = [];
  for (let i = 0; i < 70; i++) {
    const x = 200 + r() * 1500;
    const y = 520 + r() * 170 - Math.max(0, Math.abs(x - 960) - 300) * 0.2;
    if (after && r() < 0.8) continue;
    houses.push(<rect key={i} x={x} y={y} width={after ? 18 : 30} height={after ? 6 : 20} fill={after ? '#5E5C58' : ['#D2C4A6', '#B9A88A', '#C9B89A'][i % 3]} stroke={after ? 'none' : ink} strokeWidth={2} />);
  }
  return (
    <g>
      <Sky top={after ? '#8E8C88' : '#A6C8D8'} bottom={after ? '#ADABA6' : '#F2E6C6'} />
      <path d="M-200,700 L-200,330 Q200,250 500,420 Q700,520 960,560 Q1250,520 1450,400 Q1750,250 2120,330 L2120,700Z" fill={after ? '#6E6C68' : '#5E8A4E'} stroke={after ? 'none' : ink} strokeWidth={5} />
      <path d="M-200,700 L-200,470 Q300,420 600,560 Q960,640 1340,560 Q1650,430 2120,470 L2120,700Z" fill={after ? '#7A7872' : '#7AA05A'} stroke={after ? 'none' : ink} strokeWidth={4} />
      {houses}
      <Sea y={700} f={f} amp={after ? 2 : 6} layers={2} colors={after ? ['#8A8C8C', '#7E8080'] : ['#5E93A6', '#4E8396']} />
      {after && <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#B9B7B2" opacity={0.25} />}
    </g>
  );
};

// =================================================================== B-44 USS Missouri deck
export const MissouriDeck: React.FC<{f: number}> = ({f}) => (
  <g>
    <Sky top="#8EA8B8" bottom="#E2DCC8" />
    <Hills y={470} color="#7E8C7A" amp={50} seed={44} />
    <Sea y={480} f={f} amp={4} layers={2} colors={['#5E8394', '#4E7384']} />
    <Ship x={300} y={520} f={f} s={0.25} kind="warship" seed={3} smoke={false} />
    <Ship x={1700} y={515} f={f} s={0.22} kind="warship" seed={5} smoke={false} />
    {/* deck planking in perspective */}
    <path d="M-200,1300 L-200,640 L2120,640 L2120,1300Z" fill="#B59A6E" />
    {Array.from({length: 20}).map((_, i) => <line key={i} x1={W / 2 + (i - 10) * 50} y1={640} x2={W / 2 + (i - 10) * 260} y2={1300} stroke="#9A8058" strokeWidth={3} />)}
    {/* rails */}
    <g stroke={ink} strokeWidth={4}>
      <line x1={-200} y1={560} x2={W + 200} y2={560} />
      <line x1={-200} y1={600} x2={W + 200} y2={600} />
      {Array.from({length: 24}).map((_, i) => <line key={i} x1={-200 + i * 100} y1={560} x2={-200 + i * 100} y2={640} />)}
    </g>
    <line x1={-200} y1={640} x2={W + 200} y2={640} stroke={ink} strokeWidth={5} />
    {/* big triple-gun turret (left) */}
    <g stroke={ink} strokeWidth={6} strokeLinejoin="round">
      {[0, 1, 2].map((i) => <rect key={i} x={340} y={330 + i * 34} width={520} height={20} rx={8} fill="#6E767A" transform={`rotate(-6,340,${340 + i * 34})`} />)}
      <path d="M-120,700 L-90,360 L380,330 L440,700Z" fill="#7E868A" />
      <rect x={-40} y={420} width={300} height={30} fill="#6E767A" />
    </g>
    {/* signing table with green cloth */}
    <rect x={1080} y={760} width={560} height={60} fill="#3E6B4A" stroke={ink} strokeWidth={5} />
    <rect x={1080} y={760} width={560} height={140} fill="#3E6B4A" stroke={ink} strokeWidth={5} />
    <rect x={1220} y={746} width={110} height={16} fill="#F6F0DE" stroke={ink} strokeWidth={2} transform="rotate(-4,1275,754)" />
    <rect x={1400} y={748} width={110} height={14} fill="#F6F0DE" stroke={ink} strokeWidth={2} transform="rotate(5,1455,755)" />
  </g>
);

// =================================================================== B-45 War cemetery at dusk (sombre)
export const Cemetery: React.FC<{f: number; dusk?: number}> = ({f, dusk = 1}) => {
  const stones: React.ReactNode[] = [];
  for (let row = 0; row < 7; row++) {
    const s = 0.35 + row * 0.13;
    const yBase = 560 + row * 38 + row * row * 6;
    for (let i = -2; i < 22; i++) {
      const x = -200 + i * 110 * s * 1.6 + (row % 2) * 40 * s;
      const y = yBase - Math.sin((x / W) * Math.PI) * 60 * (1 - row / 8);
      stones.push(<path key={`${row}-${i}`} d={`M${x - 14 * s},${y} L${x - 14 * s},${y - 34 * s} Q${x},${y - 46 * s} ${x + 14 * s},${y - 34 * s} L${x + 14 * s},${y}Z`} fill="#EEEBE2" stroke={ink} strokeWidth={2.5} />);
    }
  }
  return (
    <g>
      <Sky top={mix('#8EA8B8', '#5E5A72', dusk)} bottom={mix('#E8DCC0', '#F0B07A', dusk)} />
      <circle cx={1540} cy={430} r={70} fill="#F6C67A" opacity={0.95} />
      <circle cx={1540} cy={430} r={130} fill="#F6C67A" opacity={0.18} />
      <path d={`M-200,600 Q${W / 2},420 ${W + 200},600 L${W + 200},1300 L-200,1300Z`} fill={mix('#7E9A5E', '#5E6E4A', dusk)} stroke={ink} strokeWidth={5} />
      {stones.reverse().reverse()}
      <Tree x={1450} y={560} s={1.4} color={mix('#5E7A44', '#3E4E34', dusk)} f={f} />
    </g>
  );
};
