// s09 sets (Ford's Theatre chapter): gaslit night street, Ford's Theatre façade (simplified flat vector:
// five arched doors, arched windows above), a passing carriage, the playbill as a labelled summary panel,
// the theatre box from below, the corridor, the empty chair, the Petersen House front, the small back room
// seen from the doorway (empty of detail), the front parlour and the mantel clock. Sombre: no event is drawn.
import React from 'react';
import {C, FONT} from '../styles/theme';
import {clamp, hash, noise1} from '../animations/core';
import {SummaryPanel} from '../kit/Documents';

const ink = C.ink;
const o = (w = 4) => ({stroke: ink, strokeWidth: w, strokeLinejoin: 'round' as const});

/** Defs used by the chapter: flat dark-grey silhouette filter and a soft gas-glow gradient. */
export const S09Defs: React.FC = () => (
  <defs>
    <filter id="s09sil" x="-20%" y="-20%" width="140%" height="140%">
      <feFlood floodColor="#2C2C32" result="c" />
      <feComposite in="c" in2="SourceAlpha" operator="in" />
    </filter>
    <radialGradient id="s09gas">
      <stop offset="0" stopColor="#FFD890" stopOpacity={0.55} />
      <stop offset="0.5" stopColor="#FFB860" stopOpacity={0.16} />
      <stop offset="1" stopColor="#FFB860" stopOpacity={0} />
    </radialGradient>
  </defs>
);
export const Silhouette: React.FC<{children: React.ReactNode; op?: number}> = ({children, op = 1}) => <g filter="url(#s09sil)" opacity={op}>{children}</g>;

/** Gas street lamp on a post; base on the pavement. */
export const GasLamp: React.FC<{x: number; base: number; f: number; s?: number; seed?: number}> = ({x, base, f, s = 1, seed = 1}) => {
  const fl = 1 + noise1(f / 4, seed) * 0.08 + noise1(f / 11, seed + 3) * 0.05;
  return (
    <g transform={`translate(${x},${base}) scale(${s})`}>
      <ellipse cx={0} cy={-300} rx={170 * fl} ry={170 * fl} fill="url(#s09gas)" />
      <rect x={-7} y={-280} width={14} height={280} fill="#1E2024" {...o(3)} />
      <rect x={-16} y={-12} width={32} height={12} fill="#1E2024" {...o(3)} />
      <path d="M-24,-282 L24,-282 L18,-330 L-18,-330Z" fill="#FFE2A0" opacity={0.9 * fl} {...o(3)} />
      <path d="M-28,-330 L28,-330 L0,-350Z" fill="#1E2024" {...o(3)} />
      <path d={`M0,-292 q-6,-10 0,${-20 * fl} q6,10 0,${20 * fl}Z`} fill="#FFB43A" />
    </g>
  );
};

/** Night street: sky, distant rooflines, cobbles and pavement. `floor` = kerb line. */
export const NightStreet: React.FC<{f: number; floor: number; far?: boolean}> = ({f, floor, far = true}) => (
  <g>
    <rect x={-900} y={-700} width={3700} height={floor + 700} fill="#101A30" />
    {Array.from({length: 60}, (_, i) => (
      <circle key={i} cx={-800 + hash(i * 7) * 3500} cy={-600 + hash(i * 13) * 900} r={1.4 + hash(i) * 1.6} fill="#E6ECF4" opacity={0.35 + 0.35 * Math.sin(f / 20 + i)} />
    ))}
    {far && (
      <path
        d={`M-900,${floor} ${Array.from({length: 24}, (_, i) => {
          const x = -900 + i * 160;
          const h = 360 + hash(i * 5) * 200;
          return `L${x},${floor - h} L${x + 150},${floor - h}`;
        }).join(' ')} L2900,${floor} Z`}
        fill="#1C2234"
        stroke={ink}
        strokeWidth={3}
      />
    )}
    <rect x={-900} y={floor} width={3700} height={60} fill="#5A5850" {...o(4)} />
    <rect x={-900} y={floor + 60} width={3700} height={700} fill="#3E3C38" />
    {Array.from({length: 90}, (_, i) => (
      <ellipse key={i} cx={-880 + (i % 30) * 125 + (Math.floor(i / 30) % 2) * 60} cy={floor + 100 + Math.floor(i / 30) * 60} rx={50} ry={14} fill="#4A4842" stroke="#2A2826" strokeWidth={2} />
    ))}
  </g>
);

/** Ford's Theatre façade (simplified): three storeys of brick, five arched doors, arched windows, cornice. */
export const FordsFacade: React.FC<{x: number; base: number; f: number; w?: number}> = ({x, base, f, w = 860}) => {
  const h = 640;
  const bays = 5;
  const bw = w / bays;
  const lit = 0.75 + noise1(f / 30, 4) * 0.08;
  return (
    <g>
      <rect x={x - w / 2} y={base - h} width={w} height={h} fill="#7A4436" {...o(5)} />
      {Array.from({length: 26}, (_, i) => <line key={i} x1={x - w / 2} y1={base - 20 - i * 24} x2={x + w / 2} y2={base - 20 - i * 24} stroke="#6A3A2E" strokeWidth={2} />)}
      {/* cornice and pediment band */}
      <rect x={x - w / 2 - 20} y={base - h - 30} width={w + 40} height={34} fill="#8A7A6A" {...o(4)} />
      <path d={`M${x - w / 2 + 40},${base - h - 30} L${x},${base - h - 110} L${x + w / 2 - 40},${base - h - 30}Z`} fill="#7A4436" {...o(4)} />
      <rect x={x - w / 2 - 10} y={base - 210} width={w + 20} height={14} fill="#8A7A6A" {...o(3)} />
      {Array.from({length: bays}, (_, i) => {
        const cx = x - w / 2 + bw * (i + 0.5);
        return (
          <g key={i}>
            {/* ground-floor arched doorway, lit inside */}
            <path d={`M${cx - 52},${base} V${base - 130} A52,52 0 0 1 ${cx + 52},${base - 130} V${base}Z`} fill="#F2B04A" opacity={lit} />
            <path d={`M${cx - 52},${base} V${base - 130} A52,52 0 0 1 ${cx + 52},${base - 130} V${base}`} fill="none" {...o(5)} />
            <path d={`M${cx},${base} V${base - 120}`} stroke="#3A2418" strokeWidth={5} />
            {/* tall arched windows */}
            <path d={`M${cx - 36},${base - 260} V${base - 400} A36,36 0 0 1 ${cx + 36},${base - 400} V${base - 260}Z`} fill="#F2C060" opacity={0.35 + 0.25 * hash(i + 3)} {...o(4)} />
            <path d={`M${cx},${base - 260} V${base - 430}`} stroke="#3A2418" strokeWidth={4} />
            {/* top-floor windows */}
            <rect x={cx - 26} y={base - 560} width={52} height={80} fill="#2A2C3A" {...o(4)} />
          </g>
        );
      })}
    </g>
  );
};

/** A closed carriage with a horse (side view, travelling right); `d` = distance travelled (px). */
export const Carriage: React.FC<{x: number; base: number; d: number; s?: number}> = ({x, base, d, s = 1}) => {
  const wheel = (cx: number, r: number) => (
    <g transform={`translate(${cx},${-r}) rotate(${(d / r) * 57.3})`}>
      <circle r={r} fill="none" stroke={ink} strokeWidth={6} />
      {Array.from({length: 8}, (_, i) => <line key={i} x1={0} y1={0} x2={Math.cos((i * Math.PI) / 4) * r} y2={Math.sin((i * Math.PI) / 4) * r} stroke="#3A3430" strokeWidth={3} />)}
      <circle r={6} fill={ink} />
    </g>
  );
  const ph = d / 22;
  const leg = (lx: number, k: number) => {
    const a = Math.sin(ph + k) * 22;
    return <path d={`M${lx},-96 l${Math.sin((a * Math.PI) / 180) * 50},48 l${Math.sin(((a - 10) * Math.PI) / 180) * 6},46`} stroke="#2A2220" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  };
  return (
    <g transform={`translate(${x},${base}) scale(${s})`}>
      {/* horse */}
      {leg(250, 0)}
      {leg(330, Math.PI)}
      <path d="M230,-150 Q290,-170 350,-150 Q368,-120 350,-96 L240,-96 Q222,-118 230,-150Z" fill="#3A2C26" {...o(4)} />
      <path d="M340,-150 Q370,-200 400,-206 L420,-180 Q392,-170 372,-130Z" fill="#3A2C26" {...o(4)} />
      {leg(240, Math.PI * 0.5)}
      {leg(345, Math.PI * 1.5)}
      <path d="M210,-120 L120,-110" stroke="#2A2220" strokeWidth={5} />
      {/* carriage body */}
      <path d="M-40,-80 L130,-80 L150,-200 L-20,-210 Z" fill="#1E1E24" {...o(5)} />
      <rect x={10} y={-185} width={70} height={60} fill="#F2C060" opacity={0.45} {...o(3)} />
      <path d="M-30,-212 Q60,-232 150,-202" fill="none" stroke={ink} strokeWidth={6} />
      {wheel(-10, 60)}
      {wheel(120, 46)}
    </g>
  );
};

/** Playbill pasted on a board by the door: a period paper sheet carrying the labelled summary panel. */
export const PlaybillBoard: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => (
  <g>
    <rect x={x - 40} y={y - 40} width={820} height={420} fill="#4A3A2C" {...o(5)} />
    <rect x={x - 14} y={y - 14} width={768} height={368} fill="#E9DCB8" {...o(4)} />
    <SummaryPanel title="Playbill" lines={['Our American Cousin', "Ford's Theatre, Washington", 'Evening of 14 April 1865']} x={x + 22} y={y + 22} w={700} t={t} />
  </g>
);

/** The theatre seen from the stalls, looking up at the box (right) in silhouette. */
export const TheatreFromStalls: React.FC<{f: number; inBox?: React.ReactNode}> = ({f, inBox}) => {
  const stage = 0.8 + noise1(f / 9, 2) * 0.06;
  return (
    <g>
      <rect x={-900} y={-700} width={3700} height={2400} fill="#2A1E1E" />
      {/* proscenium and stage light from the left */}
      <rect x={-900} y={-100} width={1100} height={1300} fill="#4A2A26" {...o(4)} />
      <rect x={-900} y={160} width={1050} height={700} fill="#F2C878" opacity={0.4 * stage} />
      <path d="M150,-100 Q120,400 180,860" stroke="#7A2A24" strokeWidth={60} fill="none" />
      {/* tiers */}
      <path d="M260,330 Q1100,250 2600,320 L2600,370 Q1100,300 260,380Z" fill="#5A3A30" {...o(4)} />
      {Array.from({length: 20}, (_, i) => <rect key={i} x={300 + i * 120} y={330 - Math.sin((i / 19) * Math.PI) * 30} width={10} height={44} fill="#C9A86A" />)}
      {/* the box */}
      <g transform="translate(1380,250)">
        <rect x={-30} y={-40} width={520} height={330} fill="#1A1414" {...o(5)} />
        <path d="M-40,-50 Q120,30 250,-30 Q380,30 500,-50 L500,-80 L-40,-80Z" fill="#6A2026" {...o(4)} />
        <path d="M-40,-50 Q-20,120 -40,290" stroke="#6A2026" strokeWidth={40} fill="none" />
        <path d="M500,-50 Q520,120 500,290" stroke="#6A2026" strokeWidth={40} fill="none" />
        {inBox}
        <rect x={-30} y={170} width={520} height={110} fill="#3A2A28" {...o(5)} />
        {Array.from({length: 9}, (_, i) => <rect key={i} x={-10 + i * 58} y={186} width={18} height={80} rx={6} fill="#5A443A" stroke={ink} strokeWidth={2} />)}
        <rect x={-40} y={160} width={540} height={20} fill="#C9A86A" {...o(3)} />
      </g>
      {/* audience heads in the stalls (illustrative, from behind) */}
      {Array.from({length: 22}, (_, i) => {
        const x = -400 + i * 130 + hash(i) * 40;
        const y = 1000 + (i % 3) * 30 + Math.sin(f / 40 + i) * 2;
        return <circle key={i} cx={x} cy={y} r={56} fill="#141216" />;
      })}
    </g>
  );
};

/** The corridor behind the boxes: dim walls in perspective, a closed door at the end, a gas sconce. */
export const Corridor: React.FC<{f: number; floor: number}> = ({f, floor}) => {
  const fl = 1 + noise1(f / 5, 8) * 0.07;
  return (
    <g>
      <rect x={-900} y={-700} width={3700} height={2400} fill="#2A2420" />
      <path d={`M-900,-700 L760,330 L760,${floor - 40} L-900,${floor + 400}Z`} fill="#3A302A" {...o(4)} />
      <path d={`M2800,-700 L1240,330 L1240,${floor - 40} L2800,${floor + 400}Z`} fill="#342A24" {...o(4)} />
      <rect x={760} y={330} width={480} height={floor - 370} fill="#2E2622" {...o(4)} />
      {/* the closed door at the end */}
      <rect x={900} y={430} width={200} height={floor - 470} fill="#4A3424" {...o(5)} />
      <circle cx={1080} cy={650} r={7} fill="#C9A86A" />
      <path d={`M-900,${floor + 400} L760,${floor - 40} L1240,${floor - 40} L2800,${floor + 400}Z`} fill="#3E3028" {...o(4)} />
      {/* sconce on the right wall */}
      <ellipse cx={1500} cy={300} rx={260 * fl} ry={220 * fl} fill="url(#s09gas)" />
      <path d="M1490,330 l20,0 l-4,-50 l-12,0Z" fill="#FFE2A0" opacity={0.9} {...o(3)} />
    </g>
  );
};

/** The empty chair in the box: a curtain, the balustrade and one chair, in still, dim light. */
export const EmptyChairSet: React.FC<{f: number; floor: number}> = ({f, floor}) => (
  <g>
    <rect x={-900} y={-700} width={3700} height={2400} fill="#241C1C" />
    <path d={`M-900,-700 H2800 V-80 Q1960,30 960,-40 Q0,30 -900,-80Z`} fill="#5A1C22" {...o(4)} />
    <path d={`M1500,-700 Q1560,${floor / 2} 1480,${floor}`} stroke="#4A161C" strokeWidth={140} fill="none" />
    <rect x={-900} y={floor} width={3700} height={700} fill="#3A2826" {...o(4)} />
    <rect x={-900} y={floor - 300} width={3700} height={24} fill="#C9A86A" {...o(3)} />
    {/* chair: upholstered, seen from the side */}
    <g transform={`translate(860,${floor})`}>
      <path d="M-120,0 L-110,-160 M110,0 L100,-160" stroke="#2A1A14" strokeWidth={14} strokeLinecap="round" />
      <rect x={-140} y={-200} width={260} height={56} rx={14} fill="#6A2A2A" {...o(5)} />
      <path d="M-150,-196 Q-180,-330 -150,-470 Q-100,-500 -60,-470 Q-80,-330 -60,-196Z" fill="#6A2A2A" {...o(5)} />
      <path d="M-160,-260 Q-60,-280 60,-250" stroke="#4A1A1A" strokeWidth={22} fill="none" strokeLinecap="round" />
    </g>
    {/* motes in the lamp light */}
    {Array.from({length: 26}, (_, i) => (
      <circle key={i} cx={500 + hash(i) * 900 + Math.sin(f / 50 + i) * 30} cy={((hash(i * 3) * 900 - f * (0.3 + hash(i) * 0.4)) % 900 + 900) % 900} r={2 + hash(i * 5) * 2} fill="#F4E2B8" opacity={0.25} />
    ))}
  </g>
);

/** The Petersen House (simplified): a narrow brick row house with curved front steps to a raised door. */
export const PetersenFront: React.FC<{f: number; base: number}> = ({f, base}) => {
  const lit = 0.7 + noise1(f / 20, 6) * 0.08;
  return (
    <g>
      {/* neighbours */}
      <rect x={-900} y={base - 620} width={1300} height={620} fill="#3A2C2A" {...o(4)} />
      <rect x={1520} y={base - 600} width={1400} height={600} fill="#33282A" {...o(4)} />
      {/* the house */}
      <rect x={400} y={base - 700} width={1120} height={700} fill="#6E3E32" {...o(5)} />
      {Array.from({length: 28}, (_, i) => <line key={i} x1={400} y1={base - 20 - i * 24} x2={1520} y2={base - 20 - i * 24} stroke="#5E3428" strokeWidth={2} />)}
      <rect x={390} y={base - 720} width={1140} height={26} fill="#5A4A40" {...o(4)} />
      {[[560, 300], [860, 300], [1180, 300], [560, 520], [860, 520], [1180, 520]].map(([wx, dy], i) => (
        <rect key={i} x={wx} y={base - dy - 150} width={110} height={150} fill={i === 0 ? '#F2B04A' : '#22283A'} opacity={i === 0 ? lit : 1} {...o(4)} />
      ))}
      {/* raised door and the curved steps */}
      <rect x={1000} y={base - 350} width={110} height={190} fill="#2A1A14" {...o(5)} />
      <path d={`M1000,${base - 160} H1160 L1160,${base - 140} H990Z`} fill="#8A8478" {...o(3)} />
      {Array.from({length: 7}, (_, i) => {
        const y = base - 140 + i * 20;
        const x0 = 1000 - i * 34 - i * i * 3;
        return <path key={i} d={`M${x0},${y} H${1160 + i * 6} V${y + 20} H${x0 - 6}Z`} fill="#9A9488" stroke={ink} strokeWidth={2.5} />;
      })}
      <path d={`M1160,${base - 150} Q${1000},${base - 60} ${780},${base - 6}`} stroke="#1A1A1E" strokeWidth={6} fill="none" />
      {Array.from({length: 8}, (_, i) => <line key={i} x1={1160 - i * 50} y1={base - 150 + i * 18} x2={1160 - i * 50} y2={base - 110 + i * 18} stroke="#1A1A1E" strokeWidth={3} />)}
    </g>
  );
};

/** The small back room seen from the doorway: a lamp on a table, a plain bed under a plain cover. No figure. */
export const BackRoomFromDoor: React.FC<{f: number}> = ({f}) => {
  const fl = 1 + noise1(f / 4, 12) * 0.08;
  return (
    <g>
      <rect x={-900} y={-700} width={3700} height={2400} fill="#4A4234" />
      <rect x={300} y={140} width={1320} height={660} fill="#6A6048" {...o(4)} />
      <rect x={300} y={800} width={1320} height={240} fill="#4A3A2C" {...o(4)} />
      {/* bed, set diagonally, plain cover only */}
      <path d="M520,760 L1180,700 L1420,820 L700,900Z" fill="#CFC6AE" {...o(4)} />
      <path d="M520,760 L520,640 L560,630 L560,752" fill="#4A3424" {...o(4)} />
      <path d="M700,900 L700,940 M1420,820 L1420,860" stroke={ink} strokeWidth={8} />
      {/* small table and lamp */}
      <rect x={1380} y={600} width={150} height={20} fill="#5A4030" {...o(3)} />
      <path d="M1395,620 V780 M1515,620 V780" stroke={ink} strokeWidth={8} />
      <ellipse cx={1455} cy={520} rx={320 * fl} ry={280 * fl} fill="url(#s09gas)" />
      <path d="M1440,600 L1444,560 L1466,560 L1470,600Z" fill="#B08A3A" {...o(2.5)} />
      <path d="M1445,560 Q1436,530 1448,512 L1462,512 Q1474,530 1465,560Z" fill="#F4E8C0" opacity={0.8} {...o(2.5)} />
      {/* doorway frame in the foreground (we stay at the door) */}
      <path d="M-900,-700 H2800 V1400 H-900Z M260,100 V1080 H1660 V100Z" fill="#1E1A16" fillRule="evenodd" />
      <path d="M260,1080 V100 H1660 V1080" fill="none" stroke="#3A2E24" strokeWidth={26} />
    </g>
  );
};

/** Front parlour: window with the light changing from night to morning (`dawn` 0..1), sofa, mantel and clock. */
export const Parlour: React.FC<{f: number; floor: number; dawn: number; sofaX: number; sofaH: number; mantelX?: number; clock?: React.ReactNode}> = ({f, floor, dawn, sofaX, sofaH, mantelX = 330, clock}) => {
  const sky = dawn < 0.5 ? mix('#141C30', '#5A6680', dawn * 2) : mix('#5A6680', '#D8D4C4', dawn * 2 - 1);
  return (
    <g>
      <rect x={-900} y={-700} width={3700} height={2400} fill="#5A4E40" />
      {Array.from({length: 34}, (_, i) => <line key={i} x1={-900 + i * 110} y1={-700} x2={-900 + i * 110} y2={floor - 200} stroke="#52473A" strokeWidth={3} />)}
      <rect x={-900} y={floor - 200} width={3700} height={200} fill="#3E3228" {...o(4)} />
      {/* window */}
      <rect x={1340} y={180} width={300} height={440} fill={sky} {...o(7)} />
      <path d="M1490,180 V620 M1340,400 H1640" stroke="#2A2018" strokeWidth={8} />
      <path d="M1290,150 Q1320,400 1300,640 L1360,640 Q1350,400 1370,150Z M1610,150 Q1640,400 1620,640 L1680,640 Q1660,400 1690,150Z" fill="#2E2A30" {...o(3)} />
      {/* mantelpiece */}
      <g transform={`translate(${mantelX},0)`}>
        <rect x={-260} y={floor - 380} width={520} height={30} fill="#2A2420" {...o(4)} />
        <rect x={-220} y={floor - 350} width={440} height={350} fill="#3A322C" {...o(4)} />
        <rect x={-130} y={floor - 240} width={260} height={240} fill="#141012" {...o(4)} />
      </g>
      {clock}
      {/* sofa */}
      <g>
        <rect x={sofaX - 210} y={floor - sofaH - 150} width={420} height={150} rx={30} fill="#3A2E3A" {...o(5)} />
        <rect x={sofaX - 230} y={floor - sofaH} width={460} height={sofaH - 30} rx={14} fill="#463848" {...o(5)} />
        <path d={`M${sofaX - 200},${floor - 30} V${floor} M${sofaX + 200},${floor - 30} V${floor}`} stroke={ink} strokeWidth={10} />
      </g>
      <rect x={-900} y={floor} width={3700} height={700} fill="#4A3828" />
      <line x1={-900} y1={floor} x2={2800} y2={floor} stroke={ink} strokeWidth={6} />
      {/* window light on the floor, growing with the morning */}
      <path d={`M1340,${floor} L1640,${floor} L1500,${floor + 200} L1100,${floor + 200}Z`} fill="#F4F0E0" opacity={0.18 * dawn} />
      {/* a low lamp still burning */}
      <ellipse cx={mantelX - 160} cy={floor - 420} rx={220} ry={180} fill="url(#s09gas)" opacity={1 - 0.6 * dawn + noise1(f / 4, 3) * 0.05} />
    </g>
  );
};

/** Mantel clock with hands at h:m (12-hour) and a pendulum `swing` (deg). */
export const MantelClock: React.FC<{x: number; y: number; s?: number; h: number; m: number; swing: number}> = ({x, y, s = 1, h, m, swing}) => {
  const ha = ((h % 12) + m / 60) * 30;
  const ma = m * 6;
  const hand = (a: number, len: number, w: number, col = ink) => <line x1={0} y1={0} x2={Math.sin((a * Math.PI) / 180) * len} y2={-Math.cos((a * Math.PI) / 180) * len} stroke={col} strokeWidth={w} strokeLinecap="round" />;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M-90,120 L-90,-40 Q-90,-130 0,-140 Q90,-130 90,-40 L90,120Z" fill="#5A3A24" {...o(5)} />
      <rect x={-104} y={120} width={208} height={22} rx={4} fill="#4A2E1C" {...o(4)} />
      <circle cx={0} cy={-40} r={70} fill="#F4EBD6" {...o(5)} />
      {Array.from({length: 12}, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return <line key={i} x1={Math.sin(a) * 54} y1={-40 - Math.cos(a) * 54} x2={Math.sin(a) * 64} y2={-40 - Math.cos(a) * 64} stroke={ink} strokeWidth={i % 3 ? 2.5 : 5} />;
      })}
      <g transform="translate(0,-40)">
        {hand(ha, 36, 7)}
        {hand(ma, 54, 4)}
        <circle r={5} fill={ink} />
      </g>
      {/* pendulum window */}
      <rect x={-46} y={44} width={92} height={66} rx={6} fill="#2A1E16" {...o(3)} />
      <g transform={`translate(0,46) rotate(${swing})`}>
        <line x1={0} y1={0} x2={0} y2={44} stroke="#C9A86A" strokeWidth={3} />
        <circle cx={0} cy={50} r={11} fill="#C9A86A" {...o(2)} />
      </g>
    </g>
  );
};

/** Grey name tag for the silhouette (storyboard 9.3: never the yellow tag). */
export const GreyTag: React.FC<{x: number; y: number; text: string; t: number}> = ({x, y, text, t}) => {
  const w = text.length * 17 + 44;
  return (
    <g opacity={clamp(t)} transform={`translate(${x - w / 2},${y})`}>
      <rect width={w} height={52} rx={8} fill="#5A5A60" stroke={ink} strokeWidth={4} />
      <text x={w / 2} y={35} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={27} fill="#E6E6E8" letterSpacing={1}>
        {text}
      </text>
    </g>
  );
};

function mix(a: string, b: string, t: number): string {
  const p = (s: string, i: number) => parseInt(s.slice(1 + i * 2, 3 + i * 2), 16);
  const c = [0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * clamp(t)).toString(16).padStart(2, '0'));
  return '#' + c.join('');
}
