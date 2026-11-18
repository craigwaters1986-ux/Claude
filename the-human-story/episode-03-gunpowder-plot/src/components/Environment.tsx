// Reusable flat 2D cartoon environment pieces.
import React from 'react';
import {C, W, H, FONT} from '../styles/theme';
import {rng, noise1, hash, boil} from '../animations/core';

const ink = C.ink;

export const Sky: React.FC<{top?: string; bottom?: string; h?: number}> = ({top = C.sky, bottom = '#E6EEE6', h = H}) => (
  <>
    <defs>
      <linearGradient id={`sky-${top.slice(1)}-${bottom.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={top} />
        <stop offset="1" stopColor={bottom} />
      </linearGradient>
    </defs>
    <rect x={-200} y={-200} width={W + 400} height={h + 200} fill={`url(#sky-${top.slice(1)}-${bottom.slice(1)})`} />
  </>
);

export const Sun: React.FC<{x: number; y: number; r?: number; color?: string; f: number}> = ({x, y, r = 70, color = '#F6DC8A', f}) => (
  <g>
    <circle cx={x} cy={y} r={r * 1.5 + Math.sin(f / 30) * 4} fill={color} opacity={0.25} />
    <circle cx={x} cy={y} r={r} fill={color} stroke={ink} strokeWidth={4} />
  </g>
);

export const Cloud: React.FC<{x: number; y: number; s?: number; color?: string; outline?: boolean}> = ({x, y, s = 1, color = '#FBFBF7', outline = true}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path
      d="M-90,20 C-120,20 -120,-15 -88,-15 C-85,-50 -35,-55 -20,-28 C-5,-62 55,-58 58,-22 C95,-30 110,18 80,20 Z"
      fill={color}
      stroke={outline ? ink : 'none'}
      strokeWidth={4 / s}
      strokeLinejoin="round"
    />
  </g>
);

/** Clouds drifting across the sky. */
export const Clouds: React.FC<{f: number; n?: number; seed?: number; speed?: number; yMin?: number; yMax?: number; color?: string; s?: number}> = ({
  f, n = 5, seed = 1, speed = 0.4, yMin = 60, yMax = 300, color, s = 1,
}) => {
  const r = rng(seed);
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const sc = (0.6 + r() * 0.8) * s;
        const span = W + 500;
        const x = ((r() * span + f * speed * (0.6 + sc * 0.5)) % span) - 250;
        const y = yMin + r() * (yMax - yMin);
        return <Cloud key={i} x={x} y={y} s={sc} color={color} />;
      })}
    </g>
  );
};

export const Ground: React.FC<{y: number; color?: string; line?: boolean; h?: number}> = ({y, color = C.grass, line = true, h = H}) => (
  <g>
    <rect x={-200} y={y} width={W + 400} height={h - y + 300} fill={color} />
    {line && <line x1={-200} y1={y} x2={W + 200} y2={y} stroke={ink} strokeWidth={5} />}
  </g>
);

export const Hills: React.FC<{y: number; color?: string; amp?: number; seed?: number; outline?: boolean}> = ({y, color = C.grassDark, amp = 60, seed = 2, outline = true}) => {
  const pts: string[] = [];
  for (let x = -200; x <= W + 200; x += 40) pts.push(`${x},${y - Math.abs(noise1(x / 260, seed)) * amp - amp * 0.3}`);
  return <path d={`M-200,${H + 100} L${pts.join(' L')} L${W + 200},${H + 100}Z`} fill={color} stroke={outline ? ink : 'none'} strokeWidth={4} strokeLinejoin="round" />;
};

export const Mountains: React.FC<{y: number; color?: string; seed?: number; snow?: boolean}> = ({y, color = '#9AA6A8', seed = 3, snow = false}) => {
  const r = rng(seed);
  const peaks: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const cx = -100 + i * 260 + r() * 80;
    const h = 160 + r() * 200;
    const w = 220 + r() * 120;
    peaks.push(
      <g key={i}>
        <path d={`M${cx - w},${y} L${cx},${y - h} L${cx + w},${y}Z`} fill={color} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
        {snow && <path d={`M${cx - w * 0.28},${y - h * 0.72} L${cx},${y - h} L${cx + w * 0.28},${y - h * 0.72} L${cx + w * 0.1},${y - h * 0.66} L${cx},${y - h * 0.74} L${cx - w * 0.12},${y - h * 0.65}Z`} fill={C.snow} stroke={ink} strokeWidth={3} strokeLinejoin="round" />}
      </g>,
    );
  }
  return <g>{peaks}</g>;
};

export type BuildingOpts = {
  x: number; base: number; w: number; h: number; color: string; roof?: 'pitched' | 'flat' | 'dome' | 'step';
  windows?: boolean; lit?: number; damaged?: number; seed?: number; f?: number; door?: boolean; awning?: string;
};

/** A single European town-house style building.  damaged 0..1 crumbles the roofline. */
export const Building: React.FC<BuildingOpts> = ({x, base, w, h, color, roof = 'pitched', windows = true, lit = 0, damaged = 0, seed = 1, f = 0, door = true, awning}) => {
  const r = rng(seed * 97 + 3);
  const top = base - h;
  let body: string;
  if (damaged > 0) {
    const pts = [`${x},${base}`, `${x},${top + h * 0.15 * damaged * r()}`];
    const n = 6;
    for (let i = 1; i < n; i++) pts.push(`${x + (w * i) / n},${top + h * damaged * (0.1 + r() * 0.6)}`);
    pts.push(`${x + w},${top + h * 0.3 * damaged * r()}`, `${x + w},${base}`);
    body = `M${pts.join(' L')}Z`;
  } else body = `M${x},${base} L${x},${top} L${x + w},${top} L${x + w},${base}Z`;
  const winRows = Math.max(1, Math.floor((h - 70) / 70));
  const winCols = Math.max(1, Math.floor(w / 60));
  const wins: React.ReactNode[] = [];
  if (windows)
    for (let row = 0; row < winRows; row++)
      for (let col = 0; col < winCols; col++) {
        const wx = x + ((col + 0.5) * w) / winCols - 13;
        const wy = top + 30 + row * 70;
        if (damaged > 0 && wy < top + h * damaged * 0.65) continue;
        const isLit = hash(seed * 13 + row * 7 + col) < lit;
        const broken = damaged > 0 && hash(seed * 5 + row * 3 + col) < damaged;
        wins.push(
          <rect key={`${row}-${col}`} x={wx} y={wy} width={26} height={38} fill={broken ? '#1D1D1D' : isLit ? '#FFD86B' : '#5E7884'} stroke={ink} strokeWidth={3} />,
        );
      }
  return (
    <g>
      {roof === 'pitched' && damaged === 0 && <path d={`M${x - 10},${top} L${x + w / 2},${top - Math.min(90, w * 0.45)} L${x + w + 10},${top}Z`} fill={C.darkRed} stroke={ink} strokeWidth={4} strokeLinejoin="round" />}
      {roof === 'dome' && damaged === 0 && <path d={`M${x + 8},${top} C${x + 8},${top - w * 0.55} ${x + w - 8},${top - w * 0.55} ${x + w - 8},${top}Z`} fill="#8A9A8A" stroke={ink} strokeWidth={4} />}
      {roof === 'step' && damaged === 0 && <path d={`M${x},${top} L${x},${top - 30} L${x + w * 0.2},${top - 30} L${x + w * 0.2},${top - 60} L${x + w * 0.4},${top - 60} L${x + w * 0.4},${top - 85} L${x + w * 0.6},${top - 85} L${x + w * 0.6},${top - 60} L${x + w * 0.8},${top - 60} L${x + w * 0.8},${top - 30} L${x + w},${top - 30} L${x + w},${top}Z`} fill={color} stroke={ink} strokeWidth={4} />}
      <path d={body} fill={color} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      {roof === 'flat' && damaged === 0 && <rect x={x - 6} y={top - 10} width={w + 12} height={12} fill={C.darkGrey} stroke={ink} strokeWidth={3} />}
      {wins}
      {door && <rect x={x + w / 2 - 18} y={base - 62} width={36} height={62} fill={damaged > 0.3 ? '#1D1D1D' : C.darkBrown} stroke={ink} strokeWidth={3.5} />}
      {awning && (
        <g>
          <path d={`M${x + 4},${base - 95} L${x + w - 4},${base - 95} L${x + w + 8},${base - 65} L${x - 8},${base - 65}Z`} fill={awning} stroke={ink} strokeWidth={3.5} />
          {Array.from({length: Math.floor(w / 26)}).map((_, i) => (
            <path key={i} d={`M${x - 8 + i * 26},${base - 65} q13,14 26,0`} fill={awning} stroke={ink} strokeWidth={3} />
          ))}
        </g>
      )}
    </g>
  );
};

const PALETTE_TOWN = ['#D9B98A', '#C9A27A', '#B9B3A2', '#E3D2A8', '#A9B7A6', '#C98E6E', '#D7C7B0', '#9FA9B3'];

/** A street row of buildings (seeded, deterministic). */
export const Street: React.FC<{base: number; seed?: number; f?: number; lit?: number; damaged?: number; palette?: string[]; scale?: number; x0?: number; x1?: number; awnings?: boolean}> = ({
  base, seed = 1, f = 0, lit = 0, damaged = 0, palette = PALETTE_TOWN, scale = 1, x0 = -100, x1 = W + 100, awnings = false,
}) => {
  const r = rng(seed);
  const out: React.ReactNode[] = [];
  let x = x0;
  let i = 0;
  while (x < x1) {
    const w = (150 + r() * 120) * scale;
    const h = (240 + r() * 220) * scale;
    const roof = (['pitched', 'flat', 'step', 'pitched'] as const)[Math.floor(r() * 4)];
    out.push(
      <Building key={i} x={x} base={base} w={w} h={h} color={palette[Math.floor(r() * palette.length)]} roof={roof} lit={lit} damaged={damaged > 0 ? damaged * (0.5 + r() * 0.5) : 0} seed={seed * 10 + i} f={f} awning={awnings && r() < 0.35 ? ['#B23A2E', '#3F6EA6', '#566B3C'][i % 3] : undefined} />,
    );
    x += w + 6 * scale;
    i++;
  }
  return <g>{out}</g>;
};

/** Skyline silhouette (for distant cities / night scenes). */
export const Skyline: React.FC<{base: number; color: string; seed?: number; dome?: number; tall?: number; lit?: number}> = ({base, color, seed = 5, dome, tall = 1, lit = 0}) => {
  const r = rng(seed);
  const parts: React.ReactNode[] = [];
  let x = -100;
  let i = 0;
  while (x < W + 100) {
    const w = 60 + r() * 110;
    const h = (80 + r() * 200) * tall;
    parts.push(<rect key={i} x={x} y={base - h} width={w + 2} height={h + 300} fill={color} />);
    if (lit > 0)
      for (let k = 0; k < 6; k++) {
        if (r() < lit) parts.push(<rect key={`${i}-w${k}`} x={x + 10 + r() * (w - 25)} y={base - h + 20 + r() * (h - 40)} width={9} height={12} fill="#FFD86B" opacity={0.9} />);
      }
    x += w;
    i++;
  }
  if (dome !== undefined)
    parts.push(
      <g key="dome" transform={`translate(${dome},${base})`} fill={color}>
        <rect x={-110} y={-200} width={220} height={200} />
        <rect x={-80} y={-250} width={160} height={60} />
        <path d="M-75,-250 C-75,-370 75,-370 75,-250Z" />
        <rect x={-8} y={-400} width={16} height={50} />
        <circle cx={0} cy={-405} r={11} />
      </g>,
    );
  return <g>{parts}</g>;
};

export const Tree: React.FC<{x: number; y: number; s?: number; color?: string; f?: number; seed?: number; kind?: 'round' | 'pine' | 'palm' | 'bare'}> = ({x, y, s = 1, color = C.grassDark, f = 0, seed = 1, kind = 'round'}) => {
  const sway = Math.sin(f / 35 + seed) * 2;
  if (kind === 'pine')
    return (
      <g transform={`translate(${x},${y}) scale(${s}) rotate(${sway * 0.5})`}>
        <rect x={-7} y={-30} width={14} height={30} fill={C.brown} stroke={ink} strokeWidth={3} />
        <path d="M0,-200 L-55,-80 L-30,-85 L-70,-25 L70,-25 L30,-85 L55,-80Z" fill={color} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      </g>
    );
  if (kind === 'palm')
    return (
      <g transform={`translate(${x},${y}) scale(${s})`}>
        <path d="M0,0 Q10,-90 25,-180" stroke={C.brown} strokeWidth={16} fill="none" strokeLinecap="round" />
        <path d="M0,0 Q10,-90 25,-180" stroke={ink} strokeWidth={4} fill="none" strokeDasharray="4 18" />
        {[-150, -110, -60, -20, 20].map((a, i) => (
          <path key={i} transform={`translate(25,-180) rotate(${a + sway * 2})`} d="M0,0 Q50,-30 100,10 Q50,-10 0,0Z" fill={color} stroke={ink} strokeWidth={3.5} strokeLinejoin="round" />
        ))}
      </g>
    );
  if (kind === 'bare')
    return (
      <g transform={`translate(${x},${y}) scale(${s})`} stroke={ink} strokeWidth={7} strokeLinecap="round" fill="none">
        <path d="M0,0 L0,-120 M0,-70 L-40,-110 M0,-90 L35,-140 M-40,-110 L-55,-135 M35,-140 L50,-160" />
      </g>
    );
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-8} y={-70} width={16} height={70} fill={C.brown} stroke={ink} strokeWidth={3.5} />
      <g transform={`rotate(${sway},0,-70)`}>
        <circle cx={0} cy={-125} r={62} fill={color} stroke={ink} strokeWidth={4} />
        <circle cx={-35} cy={-100} r={40} fill={color} stroke={ink} strokeWidth={4} />
        <circle cx={38} cy={-98} r={38} fill={color} stroke={ink} strokeWidth={4} />
        <circle cx={0} cy={-115} r={52} fill={color} />
      </g>
    </g>
  );
};

/** Waving flag on a pole. pattern: stripes spec. */
export const Flag: React.FC<{x: number; y: number; f: number; w?: number; h?: number; pole?: number; kind: 'uk' | 'fr' | 'us' | 'pl' | 'su' | 'red' | 'white' | 'de-imperial' | 'nl' | 'be' | 'jp' | 'un'; seed?: number}> = ({
  x, y, f, w = 150, h = 95, pole = 260, kind, seed = 1,
}) => {
  const id = `flag-${kind}-${seed}`;
  const wavePath = () => {
    const pts: string[] = [];
    const N = 12;
    const top: string[] = [];
    const bot: string[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const dy = Math.sin(u * 5 - f / 5 + seed) * 8 * u;
      top.push(`${u * w},${dy}`);
      bot.unshift(`${u * w},${h + dy}`);
    }
    pts.push(...top, ...bot);
    return `M${pts.join(' L')}Z`;
  };
  const d = wavePath();
  let content: React.ReactNode;
  switch (kind) {
    case 'uk':
      content = (
        <g>
          <rect width={w} height={h} fill="#22397A" />
          <path d={`M0,0 L${w},${h} M${w},0 L0,${h}`} stroke="#fff" strokeWidth={h * 0.2} />
          <path d={`M0,0 L${w},${h} M${w},0 L0,${h}`} stroke="#C8102E" strokeWidth={h * 0.07} />
          <path d={`M${w / 2},0 L${w / 2},${h} M0,${h / 2} L${w},${h / 2}`} stroke="#fff" strokeWidth={h * 0.33} />
          <path d={`M${w / 2},0 L${w / 2},${h} M0,${h / 2} L${w},${h / 2}`} stroke="#C8102E" strokeWidth={h * 0.2} />
        </g>
      );
      break;
    case 'fr':
      content = (
        <g>
          <rect width={w / 3} height={h} fill="#22397A" />
          <rect x={w / 3} width={w / 3} height={h} fill="#fff" />
          <rect x={(2 * w) / 3} width={w / 3} height={h} fill="#C8102E" />
        </g>
      );
      break;
    case 'nl':
      content = (<g><rect width={w} height={h / 3} fill="#AE1C28" /><rect y={h / 3} width={w} height={h / 3} fill="#fff" /><rect y={(2 * h) / 3} width={w} height={h / 3} fill="#21468B" /></g>);
      break;
    case 'be':
      content = (<g><rect width={w / 3} height={h} fill="#1A1A1A" /><rect x={w / 3} width={w / 3} height={h} fill="#FDDA24" /><rect x={(2 * w) / 3} width={w / 3} height={h} fill="#EF3340" /></g>);
      break;
    case 'pl':
      content = (<g><rect width={w} height={h / 2} fill="#fff" /><rect y={h / 2} width={w} height={h / 2} fill="#DC143C" /></g>);
      break;
    case 'us':
      content = (
        <g>
          {Array.from({length: 13}).map((_, i) => <rect key={i} y={(i * h) / 13} width={w} height={h / 13 + 0.5} fill={i % 2 ? '#fff' : '#B22234'} />)}
          <rect width={w * 0.42} height={(h * 7) / 13} fill="#3C3B6E" />
          {Array.from({length: 12}).map((_, i) => <circle key={i} cx={8 + (i % 4) * (w * 0.1)} cy={8 + Math.floor(i / 4) * 14} r={2.4} fill="#fff" />)}
        </g>
      );
      break;
    case 'su':
      content = (<g><rect width={w} height={h} fill="#C8102E" /><path d={`M${w * 0.12},${h * 0.12} l6,10 l10,0 l-8,7 l3,10 l-11,-6 l-11,6 l3,-10 l-8,-7 l10,0z`} fill={C.gold} /></g>);
      break;
    case 'jp':
      content = (<g><rect width={w} height={h} fill="#fff" /><circle cx={w / 2} cy={h / 2} r={h * 0.3} fill="#BC002D" /></g>);
      break;
    case 'de-imperial':
      content = (<g><rect width={w} height={h / 3} fill="#1A1A1A" /><rect y={h / 3} width={w} height={h / 3} fill="#fff" /><rect y={(2 * h) / 3} width={w} height={h / 3} fill="#DD0000" /></g>);
      break;
    case 'un':
      content = (<g><rect width={w} height={h} fill="#5B92E5" /><circle cx={w / 2} cy={h / 2} r={h * 0.28} fill="none" stroke="#fff" strokeWidth={4} /></g>);
      break;
    case 'red':
      content = <rect width={w} height={h} fill={C.darkRed} />;
      break;
    default:
      content = <rect width={w} height={h} fill="#fff" />;
  }
  return (
    <g transform={`translate(${x},${y})`}>
      <line x1={0} y1={0} x2={0} y2={pole} stroke={ink} strokeWidth={7} strokeLinecap="round" />
      <circle cx={0} cy={-4} r={7} fill={C.gold} stroke={ink} strokeWidth={2.5} />
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <g transform={`translate(0,${Math.sin(-f / 5 + seed) * 2})`}>{content}</g>
      </g>
      <path d={d} fill="none" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
};

/** Layered animated sea waves. */
export const Sea: React.FC<{y: number; f: number; colors?: string[]; amp?: number; speed?: number; layers?: number}> = ({y, f, colors = [C.sea, '#5D8EA3', C.seaDark], amp = 12, speed = 1, layers = 3}) => (
  <g>
    {Array.from({length: layers}).map((_, li) => {
      const yy = y + li * 55;
      const pts: string[] = [];
      for (let x = -100; x <= W + 100; x += 30) {
        const yv = yy + Math.sin(x / (120 - li * 18) + (f * speed * (0.05 + li * 0.02)) + li) * amp * (1 + li * 0.25);
        pts.push(`${x},${yv}`);
      }
      return <path key={li} d={`M-100,${H + 200} L${pts.join(' L')} L${W + 100},${H + 200}Z`} fill={colors[li % colors.length]} stroke={ink} strokeWidth={li === 0 ? 4 : 3} strokeLinejoin="round" />;
    })}
  </g>
);

/** Birds flapping across the sky. */
export const Birds: React.FC<{f: number; n?: number; seed?: number; y?: number}> = ({f, n = 4, seed = 2, y = 200}) => {
  const r = rng(seed);
  return (
    <g stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round">
      {Array.from({length: n}).map((_, i) => {
        const sp = 2 + r() * 1.5;
        const x = ((r() * W + f * sp) % (W + 200)) - 100;
        const yy = y + r() * 120 + Math.sin(f / 20 + i) * 10;
        const flap = Math.sin(f / 3 + i * 2) * 10;
        return <path key={i} d={`M${x - 18},${yy - flap} Q${x - 8},${yy - 6} ${x},${yy} Q${x + 8},${yy - 6} ${x + 18},${yy - flap}`} />;
      })}
    </g>
  );
};

export const StreetLamp: React.FC<{x: number; y: number; lit?: boolean}> = ({x, y, lit}) => (
  <g transform={`translate(${x},${y})`}>
    <line x1={0} y1={0} x2={0} y2={-260} stroke={ink} strokeWidth={8} />
    <path d="M-20,-260 L20,-260 L12,-300 L-12,-300Z" fill={lit ? '#FFE08A' : '#E8E1CF'} stroke={ink} strokeWidth={4} />
    {lit && <circle cx={0} cy={-280} r={60} fill="#FFE08A" opacity={0.25} />}
  </g>
);

export const BarbedWire: React.FC<{x0: number; x1: number; y: number; posts?: number; h?: number}> = ({x0, x1, y, posts = 6, h = 140}) => {
  const step = (x1 - x0) / posts;
  return (
    <g stroke={ink}>
      {Array.from({length: posts + 1}).map((_, i) => (
        <line key={i} x1={x0 + i * step} y1={y} x2={x0 + i * step + 4} y2={y - h} strokeWidth={8} />
      ))}
      {[0.2, 0.45, 0.7, 0.92].map((k, j) => (
        <g key={j}>
          <path d={`M${x0},${y - h * k} ${Array.from({length: posts * 4}).map((_, i) => `L${x0 + ((i + 1) * step) / 4},${y - h * k + Math.sin(i * 1.7 + j) * 4}`).join(' ')}`} fill="none" strokeWidth={2.5} />
          {Array.from({length: posts * 4}).map((_, i) => (
            <path key={i} d={`M${x0 + ((i + 0.5) * step) / 4 - 5},${y - h * k - 5} l10,10 m0,-10 l-10,10`} strokeWidth={2} />
          ))}
        </g>
      ))}
    </g>
  );
};

/** The channel's "history room": yellow wall + green chalkboard (from the reference image). */
export const HistoryRoom: React.FC<{f: number; board?: React.ReactNode; boardX?: number; boardW?: number}> = ({f, board, boardX = 520, boardW = 1240}) => (
  <g>
    <defs>
      <radialGradient id="wallGlow" cx="0.5" cy="0.35" r="0.8">
        <stop offset="0" stopColor="#F2D886" />
        <stop offset="1" stopColor={C.wallYellowDark} />
      </radialGradient>
    </defs>
    <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="url(#wallGlow)" />
    <rect x={-200} y={820} width={W + 400} height={400} fill={C.floor} />
    {Array.from({length: 14}).map((_, i) => <line key={i} x1={-100 + i * 160} y1={820} x2={-300 + i * 200} y2={1100} stroke="#C4BEB3" strokeWidth={3} />)}
    <line x1={-200} y1={820} x2={W + 200} y2={820} stroke={ink} strokeWidth={5} />
    <rect x={boardX - 18} y={112} width={boardW + 36} height={600} rx={6} fill={C.boardFrame} stroke={ink} strokeWidth={5} />
    <rect x={boardX} y={130} width={boardW} height={564} fill={C.board} stroke={ink} strokeWidth={4} />
    <rect x={boardX + 20} y={150} width={boardW - 40} height={524} fill={C.board} opacity={0.6} />
    <ellipse cx={boardX + boardW * 0.3} cy={300} rx={260} ry={120} fill="#fff" opacity={0.04} />
    <rect x={boardX - 10} y={706} width={boardW + 20} height={16} fill={C.boardFrame} stroke={ink} strokeWidth={4} />
    <rect x={boardX + boardW - 200} y={694} width={60} height={14} rx={3} fill="#EEE" stroke={ink} strokeWidth={2} />
    <g transform={`translate(0,${boil(f, 3, 0.4)})`}>{board}</g>
  </g>
);

/** Chalk handwriting text on the board. */
export const Chalk: React.FC<{x: number; y: number; text: string; size?: number; reveal?: number; anchor?: 'start' | 'middle' | 'end'; color?: string}> = ({x, y, text, size = 64, reveal = 1, anchor = 'middle', color = '#F4F1E8'}) => {
  const n = Math.round(text.length * Math.max(0, Math.min(1, reveal)));
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT.sans} fontWeight={800} fontSize={size} fill={color} opacity={0.92} letterSpacing={1}>
      {text.slice(0, n)}
    </text>
  );
};

/** Simple interior wall + floor. */
export const Interior: React.FC<{wall: string; floor: string; floorY?: number; panel?: boolean}> = ({wall, floor, floorY = 800, panel = true}) => (
  <g>
    <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={wall} />
    {panel && <rect x={-200} y={floorY - 150} width={W + 400} height={150} fill="rgba(0,0,0,0.08)" />}
    {panel && <line x1={-200} y1={floorY - 150} x2={W + 200} y2={floorY - 150} stroke={ink} strokeWidth={3} opacity={0.5} />}
    <rect x={-200} y={floorY} width={W + 400} height={H} fill={floor} />
    <line x1={-200} y1={floorY} x2={W + 200} y2={floorY} stroke={ink} strokeWidth={5} />
  </g>
);

export const Table: React.FC<{x: number; y: number; w: number; color?: string; cloth?: string; h?: number}> = ({x, y, w, color = C.brown, cloth, h = 110}) => (
  <g>
    <rect x={x + 20} y={y} width={10} height={h} fill={ink} />
    <rect x={x + w - 30} y={y} width={10} height={h} fill={ink} />
    <rect x={x} y={y - 16} width={w} height={20} rx={4} fill={cloth ?? color} stroke={ink} strokeWidth={4} />
    {cloth && <rect x={x} y={y - 16} width={w} height={50} fill={cloth} stroke={ink} strokeWidth={4} />}
  </g>
);

export const Chair: React.FC<{x: number; y: number; dir?: 1 | -1; color?: string}> = ({x, y, dir = 1, color = C.brown}) => (
  <g transform={`translate(${x},${y}) scale(${dir},1)`}>
    <rect x={-40} y={-118} width={14} height={118} fill={color} stroke={ink} strokeWidth={3} />
    <rect x={-40} y={-56} width={80} height={12} fill={color} stroke={ink} strokeWidth={3} />
    <rect x={28} y={-48} width={10} height={48} fill={color} stroke={ink} strokeWidth={3} />
  </g>
);

export const Radio: React.FC<{x: number; y: number; s?: number; f: number; on?: boolean}> = ({x, y, s = 1, f, on = true}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-80,0 L-80,-110 Q-80,-160 0,-165 Q80,-160 80,-110 L80,0Z" fill="#8A5A33" stroke={ink} strokeWidth={5} />
    <path d="M-55,-30 L-55,-110 Q-55,-135 0,-138 Q55,-135 55,-110 L55,-30Z" fill="#D9C08E" stroke={ink} strokeWidth={3.5} />
    {Array.from({length: 6}).map((_, i) => <line key={i} x1={-50} y1={-120 + i * 15} x2={50} y2={-120 + i * 15} stroke="#8A6A40" strokeWidth={2.5} />)}
    <circle cx={-35} cy={-14} r={9} fill={ink} />
    <circle cx={35} cy={-14} r={9} fill={ink} />
    {on && [1, 2, 3].map((k) => <path key={k} d={`M${90 + k * 18},-110 q14,30 0,60`} fill="none" stroke={ink} strokeWidth={4} opacity={0.8 - (((f / 8 + k) % 3) / 3) * 0.6} strokeLinecap="round" />)}
  </g>
);

/** Papers/documents on a table. */
export const Document: React.FC<{x: number; y: number; w?: number; h?: number; title?: string; rot?: number; stamp?: string; lines?: number; sign?: number}> = ({x, y, w = 220, h = 290, title, rot = 0, stamp, lines = 7, sign = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`}>
    <rect x={-w / 2 + 5} y={-h / 2 + 6} width={w} height={h} fill="rgba(0,0,0,0.2)" />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#F6F0DE" stroke={ink} strokeWidth={4} />
    {title && (
      <text x={0} y={-h / 2 + 42} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={Math.min(30, (w * 1.6) / title.length)} fill={ink}>
        {title}
      </text>
    )}
    {Array.from({length: lines}).map((_, i) => (
      <line key={i} x1={-w / 2 + 22} y1={-h / 2 + 75 + i * 22} x2={w / 2 - 22 - (i % 3) * 18} y2={-h / 2 + 75 + i * 22} stroke="#9A9180" strokeWidth={4} />
    ))}
    {sign > 0 && (
      <path d={`M${-w / 2 + 30},${h / 2 - 40} c20,-30 30,20 50,-5 s30,-20 40,5 s20,10 40,-10`} fill="none" stroke="#1B2D6B" strokeWidth={4} strokeDasharray={300} strokeDashoffset={300 * (1 - sign)} strokeLinecap="round" />
    )}
    {stamp && (
      <g transform={`translate(${w * 0.12},${h * 0.12}) rotate(-14)`}>
        <rect x={-w * 0.42} y={-28} width={w * 0.84} height={56} fill="none" stroke={C.red} strokeWidth={6} />
        <text x={0} y={14} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={Math.min(36, (w * 1.3) / stamp.length)} fill={C.red}>
          {stamp}
        </text>
      </g>
    )}
  </g>
);

export const Crate: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-40} y={-70} width={80} height={70} fill="#A47A4A" stroke={ink} strokeWidth={4} />
    <path d="M-40,-70 L40,0 M40,-70 L-40,0" stroke={ink} strokeWidth={3} />
  </g>
);

export const Rubble: React.FC<{x: number; y: number; w: number; seed?: number; color?: string}> = ({x, y, w, seed = 4, color = '#9A9488'}) => {
  const r = rng(seed);
  const pts: string[] = [`${x},${y}`];
  for (let i = 1; i < 12; i++) pts.push(`${x + (w * i) / 12},${y - 20 - r() * 70 * Math.sin((Math.PI * i) / 12)}`);
  pts.push(`${x + w},${y}`);
  return (
    <g>
      <path d={`M${pts.join(' L')}Z`} fill={color} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      {Array.from({length: 8}).map((_, i) => (
        <rect key={i} x={x + r() * w} y={y - 30 - r() * 40} width={14 + r() * 20} height={10 + r() * 12} fill="#B5AA98" stroke={ink} strokeWidth={2.5} transform={`rotate(${r() * 60 - 30},${x + w / 2},${y})`} />
      ))}
    </g>
  );
};
