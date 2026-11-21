// s09 sets (Ford's Theatre chapter): gaslit night street, Ford's Theatre façade (simplified flat vector:
// five arched doors, arched windows above), a passing carriage, the playbill as a labelled summary panel,
// the theatre box from below, the corridor, the empty chair, the Petersen House front, the small back room
// seen from the doorway (empty of detail), the front parlour and the mantel clock. Sombre: no event is drawn.
import React from 'react';
import {C, FONT} from '../styles/theme';
import {clamp, hash, noise1} from '../animations/core';
import {SummaryPanel} from '../kit/Documents';
import {Quad, quadRig} from '../kit/Horse';
import {Person} from '../kit/Cast';

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

/** A closed carriage (brougham) drawn by a horse, side view, travelling right; `d` = distance travelled (px).
 *  Family review (Nov 2026): the horse is the kit's walking horse rig (planted hooves, jointed legs, mane, tail,
 *  head nod), in harness (collar, traces, shafts, reins), with a coachman in a top hat on the box and lit coach lamps. */
export const Carriage: React.FC<{x: number; base: number; d: number; s?: number; f?: number}> = ({x, base, d, s = 1, f = 0}) => {
  const dl = d / s; // distance in the carriage's own units
  const wheel = (cx: number, r: number, spokes = 12) => (
    <g transform={`translate(${cx},${-r}) rotate(${(dl / r) * 57.3})`}>
      <circle r={r} fill="none" stroke={ink} strokeWidth={9} />
      <circle r={r - 2} fill="none" stroke="#B0302A" strokeWidth={4} />
      {Array.from({length: spokes}, (_, i) => <line key={i} x1={0} y1={0} x2={Math.cos((i * 2 * Math.PI) / spokes) * (r - 4)} y2={Math.sin((i * 2 * Math.PI) / spokes) * (r - 4)} stroke="#8A2622" strokeWidth={3} />)}
      <circle r={9} fill="#2A1A14" {...o(3)} />
    </g>
  );
  const rig = quadRig(dl, {kind: 'horse', f, seed: 7});
  const horseX = 470; // horse placement in carriage units (barrel centre)
  const hl = (p: {x: number; y: number}) => ({x: horseX + p.x, y: p.y}); // horse local -> carriage local
  const shoulder = hl({x: 60, y: -205 + rig.bob});
  const bit = hl(rig.bit);
  const bounce = Math.sin(dl / 38) * 1.6; // body rocks on its springs
  const lampGlow = 0.8 + noise1(f / 6, 3) * 0.15;
  const hands = {x: 158, y: -258 + bounce};
  return (
    <g transform={`translate(${x},${base}) scale(${s})`}>
      <ellipse cx={180} cy={4} rx={360} ry={12} fill="rgba(0,0,0,0.22)" />
      {/* far wheels */}
      <g opacity={0.55}>{wheel(-60, 66)}{wheel(150, 50)}</g>
      {/* the horse (drawn in the carriage's units) */}
      <Quad rig={rig} pl={{x: horseX, y: 0, scale: 1, dir: 1}} f={f} coat="#4A2E22" dark="#33201A" mane="#1A1210" />
      {/* harness: collar, hames, traces back to the splinter bar, shafts along the flank */}
      <path d={`M${shoulder.x - 6},${shoulder.y - 34} Q${shoulder.x + 26},${shoulder.y} ${shoulder.x - 2},${shoulder.y + 42}`} fill="none" stroke="#1A1210" strokeWidth={14} strokeLinecap="round" />
      <path d={`M${shoulder.x - 6},${shoulder.y - 34} Q${shoulder.x + 26},${shoulder.y} ${shoulder.x - 2},${shoulder.y + 42}`} fill="none" stroke="#C9A24A" strokeWidth={4} strokeLinecap="round" />
      <path d={`M${shoulder.x},${shoulder.y + 14} L172,${-112 + bounce}`} stroke="#1A1210" strokeWidth={5} />
      <path d={`M${horseX - 40},${-226 + rig.bob} L${horseX + 40},${-224 + rig.bob}`} stroke="#1A1210" strokeWidth={7} strokeLinecap="round" />
      <path d={`M168,${-128 + bounce} L${horseX + 52},${-190 + rig.bob}`} stroke={ink} strokeWidth={9} strokeLinecap="round" />
      <path d={`M168,${-128 + bounce} L${horseX + 52},${-190 + rig.bob}`} stroke="#5A3A24" strokeWidth={4} strokeLinecap="round" />
      {/* reins from the coachman's hands to the bit */}
      <path d={`M${hands.x},${hands.y} Q${(hands.x + bit.x) / 2},${(hands.y + bit.y) / 2 + 30} ${bit.x},${bit.y}`} fill="none" stroke="#2A1A14" strokeWidth={2.5} />
      <g transform={`translate(0,${bounce})`}>
        {/* undercarriage: perch and C-springs */}
        <path d="M-120,-74 L190,-74" stroke={ink} strokeWidth={10} strokeLinecap="round" />
        <path d="M-80,-74 q-10,-40 20,-60 M140,-74 q14,-36 -14,-56" fill="none" stroke={ink} strokeWidth={7} />
        {/* the body: rounded brougham with a curved front, a door and a lit window */}
        <path d="M-120,-110 Q-128,-210 -60,-226 L80,-226 Q110,-226 112,-200 L118,-110 Q120,-92 100,-92 L-100,-92 Q-120,-92 -120,-110Z" fill="#1E2230" {...o(5)} />
        <path d="M112,-170 Q150,-170 160,-130 L160,-108 L118,-108" fill="#1E2230" {...o(5)} />
        <path d="M-60,-226 Q10,-240 80,-226" fill="none" stroke="#C9A24A" strokeWidth={4} />
        <rect x={-40} y={-206} width={70} height={56} rx={6} fill="#F2C060" opacity={0.55 * lampGlow} stroke={ink} strokeWidth={3} />
        <path d="M-50,-212 L40,-212 L40,-100 L-50,-100Z" fill="none" stroke="#C9A24A" strokeWidth={3} />
        <circle cx={28} cy={-140} r={4} fill="#C9A24A" />
        <path d="M-120,-150 L118,-150" stroke="#B0302A" strokeWidth={3} />
        {/* box seat and footboard, coachman holding the reins */}
        <path d="M110,-232 L190,-232 L196,-222 L110,-222Z" fill="#1E2230" {...o(3)} />
        <path d="M150,-222 L172,-150" stroke={ink} strokeWidth={6} />
        <Person id="townsman" x={142} y={-150} scale={0.86} dir={1} f={f} seed={95}
          head={{hat: 'stovepipe', hatColor: '#141418'} as never} outfit={{kind: 'longcoat', color: '#2A2A30'} as never}
          pose={{lean: 4, hipL: 84, kneeL: 92, hipR: 88, kneeR: 96, shL: 58, elL: 40, shR: 52, elR: 44, bob: 52, headTilt: Math.sin(f / 30) * 2}} />
        {/* coach lamps */}
        {[[-126, -150], [118, -164]].map(([lx, ly], i) => (
          <g key={i}>
            <circle cx={lx} cy={ly} r={34} fill="#FFD27A" opacity={0.25 * lampGlow} />
            <rect x={lx - 8} y={ly - 14} width={16} height={24} rx={3} fill="#FFE2A0" stroke={ink} strokeWidth={3} />
          </g>
        ))}
      </g>
      {/* near wheels */}
      {wheel(-60, 66)}
      {wheel(150, 50)}
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
export const Corridor: React.FC<{f: number; floor: number; open?: number}> = ({f, floor, open = 0}) => {
  const fl = 1 + noise1(f / 5, 8) * 0.07;
  const dw = 200 * (1 - 0.42 * open); // hinge on the left: the door's free edge swings away, a gap of light opens
  return (
    <g>
      <rect x={-900} y={-700} width={3700} height={2400} fill="#2A2420" />
      <path d={`M-900,-700 L760,330 L760,${floor - 40} L-900,${floor + 400}Z`} fill="#3A302A" {...o(4)} />
      <path d={`M2800,-700 L1240,330 L1240,${floor - 40} L2800,${floor + 400}Z`} fill="#342A24" {...o(4)} />
      <rect x={760} y={330} width={480} height={floor - 370} fill="#2E2622" {...o(4)} />
      {/* the closed door at the end */}
      {open > 0 && (
        <g>
          <rect x={900} y={430} width={200} height={floor - 470} fill="#FFD890" opacity={0.85 * open} />
          <path d={`M${900 + dw},${floor - 40} L1100,${floor - 40} L${1100 + 520 * open},${floor + 400} L${900 + dw - 180 * open},${floor + 400}Z`} fill="#FFD890" opacity={0.22 * open} />
        </g>
      )}
      <rect x={900} y={430} width={dw} height={floor - 470} fill="#4A3424" {...o(5)} />
      <circle cx={900 + dw - 20} cy={650} r={7} fill="#C9A86A" />
      <path d={`M-900,${floor + 400} L760,${floor - 40} L1240,${floor - 40} L2800,${floor + 400}Z`} fill="#3E3028" {...o(4)} />
      {/* sconce on the right wall */}
      <ellipse cx={1500} cy={300} rx={260 * fl} ry={220 * fl} fill="url(#s09gas)" />
      <path d="M1490,330 l20,0 l-4,-50 l-12,0Z" fill="#FFE2A0" opacity={0.9} {...o(3)} />
    </g>
  );
};

/** Inside the presidential box, seen from the side (family review, Nov 2026): papered back wall, the box door on the
 *  left, the balustrade on the right draped with flags, the lit stage beyond it, a gas sconce. The chairs are drawn by
 *  the shot (rocking chair for Lincoln, an upholstered chair for Mary). */
export const BoxInterior: React.FC<{f: number; floor: number}> = ({f, floor}) => {
  const stage = 0.85 + noise1(f / 9, 4) * 0.08;
  const fl = 1 + noise1(f / 5, 11) * 0.07;
  return (
    <g>
      <rect x={-900} y={-700} width={3700} height={2400} fill="#3A1E1E" />
      {/* papered wall with a faint damask stripe */}
      <rect x={-900} y={0} width={2500} height={floor} fill="#5A2A28" />
      {Array.from({length: 40}, (_, i) => <rect key={i} x={-900 + i * 64} y={0} width={20} height={floor} fill="#62302C" />)}
      <rect x={-900} y={floor - 150} width={2500} height={150} fill="#4A2622" {...o(4)} />
      <path d={`M-900,${floor - 150} H1600`} stroke="#C9A86A" strokeWidth={6} />
      {/* the box door (left), standing open */}
      <rect x={250} y={floor - 560} width={210} height={560} fill="#1A0E0C" {...o(5)} />
      <path d={`M250,${floor - 560} L170,${floor - 600} L170,${floor + 30} L250,${floor}Z`} fill="#5A3424" {...o(5)} />
      {/* gas sconce */}
      <ellipse cx={720} cy={240} rx={300 * fl} ry={260 * fl} fill="url(#s09gas)" />
      <path d="M712,280 l16,0 l-3,-40 l-10,0Z" fill="#FFE2A0" {...o(2.5)} />
      {/* the stage beyond the balustrade (right): warm light, a painted backdrop */}
      <rect x={1600} y={-700} width={1300} height={2400} fill="#F2C878" opacity={0.55 * stage} />
      <rect x={1600} y={120} width={1300} height={600} fill="#B8905A" opacity={0.5} />
      <path d="M1600,-700 L1600,1400" stroke="#2A1414" strokeWidth={30} />
      {/* curtains framing the box opening */}
      <path d={`M1560,-700 Q${1640 + Math.sin(f / 50) * 6},300 1580,${floor + 20} L1700,${floor + 20} Q1720,300 1700,-700Z`} fill="#7A1E24" {...o(4)} />
      {/* balustrade with draped flags (the box was decorated with flags that night) */}
      <rect x={1540} y={floor - 330} width={420} height={330} fill="#3A2420" {...o(5)} />
      {[0, 1].map((k) => (
        <g key={k} transform={`translate(${1560 + k * 190},${floor - 320})`}>
          <path d={`M0,0 H180 Q${170 + Math.sin(f / 40 + k) * 4},90 90,140 Q10,90 0,0Z`} fill="#F4EEE2" {...o(3)} />
          {[0, 1, 2, 3].map((r) => <path key={r} d={`M${8 + r * 6},${22 + r * 24} Q90,${40 + r * 26} ${172 - r * 6},${22 + r * 24}`} fill="none" stroke="#B0302A" strokeWidth={9} />)}
          <path d="M0,0 H70 V46 Q30,52 0,40Z" fill="#2A3A6A" {...o(2.5)} />
          {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={14 + c * 20} cy={12 + r * 12} r={3} fill="#F4EEE2" />))}
        </g>
      ))}
      <rect x={1530} y={floor - 344} width={440} height={22} fill="#C9A86A" {...o(4)} />
    </g>
  );
};

/** Lincoln's rocking chair (upholstered, high back) and Mary's plain chair; x = seat centre. */
export const RockingChair: React.FC<{x: number; floor: number; h: number; rock?: number}> = ({x, floor, h, rock = 0}) => (
  <g transform={`rotate(${rock},${x},${floor})`}>
    <path d={`M${x - 70},${floor - 4} Q${x},${floor + 14} ${x + 70},${floor - 4}`} fill="none" stroke={ink} strokeWidth={10} strokeLinecap="round" />
    <path d={`M${x - 70},${floor - 4} Q${x},${floor + 14} ${x + 70},${floor - 4}`} fill="none" stroke="#6A3A24" strokeWidth={5} strokeLinecap="round" />
    <path d={`M${x - 40},${floor - h} L${x - 44},${floor + 2} M${x + 36},${floor - h} L${x + 40},${floor + 2}`} stroke={ink} strokeWidth={8} />
    <rect x={x - 48} y={floor - h - 6} width={96} height={18} rx={6} fill="#8A2A2A" {...o(3.5)} />
    <path d={`M${x - 44},${floor - h} L${x - 58},${floor - h - 170} Q${x - 40},${floor - h - 190} ${x - 22},${floor - h - 168} L${x - 20},${floor - h}`} fill="#8A2A2A" {...o(4)} />
    <path d={`M${x - 46},${floor - h - 60} L${x + 34},${floor - h - 54}`} stroke="#6A3A24" strokeWidth={7} strokeLinecap="round" />
  </g>
);

/** Pistol smoke and the muzzle flash at (x, y); g = frames since the shot. */
export const ShotSmoke: React.FC<{x: number; y: number; g: number}> = ({x, y, g}) => {
  if (g < 0) return null;
  const flash = g < 4 ? 1 - g / 4 : 0;
  return (
    <g>
      {flash > 0 && (
        <g opacity={flash}>
          <circle cx={x + 18} cy={y} r={60} fill="#FFF2C0" opacity={0.5} />
          <path d={`M${x},${y} l44,-14 l-20,14 l34,6 l-36,6 l20,14 l-44,-12Z`} fill="#FFE27A" stroke="#E08A2A" strokeWidth={3} />
        </g>
      )}
      {[0, 1, 2, 3, 4].map((k) => {
        const t = Math.max(0, g - k * 2);
        const r = 14 + t * 1.6 + k * 6;
        const op = Math.max(0, 0.55 - t / 110);
        return <circle key={k} cx={x + 20 + k * 14 - t * 0.6} cy={y - 6 - t * (0.9 + k * 0.2)} r={r} fill="#D8D4CC" opacity={op} />;
      })}
    </g>
  );
};

/** The empty chair in the box: a curtain, the balustrade and one chair, in still, dim light. */
/** The playbill's fall from the seat: u 0..1 (slide off the cushion, then a slow flutter to the floor). */
const playbillAt = (u: number, floor: number) => {
  const slide = clamp(u / 0.18);
  const fall = clamp((u - 0.18) / 0.82);
  const x = 860 + 40 * slide + 150 * fall + Math.sin(fall * 9) * 40 * (1 - fall);
  const y = floor - 214 + 30 * slide * slide + (200 + 4) * (fall * fall * 0.35 + fall * 0.65);
  const rot = -6 + 24 * slide + Math.sin(fall * 8) * 34 * (1 - fall) + 78 * fall;
  return {x, y: Math.min(y, floor - 6), rot: fall >= 1 ? 84 : rot};
};
export const EmptyChairSet: React.FC<{f: number; floor: number; dim?: number; bill?: number; sway?: number}> = ({f, floor, dim = 0, bill = 0, sway = 0}) => {
  const pb = playbillAt(bill, floor);
  const sw = Math.sin(f / 22) * 46 * sway + Math.sin(f / 9) * 10 * sway;
  return (
  <g>
    <rect x={-900} y={-700} width={3700} height={2400} fill="#241C1C" />
    {/* stage glow from the left, fading as the house goes quiet */}
    <ellipse cx={-200} cy={300} rx={1100} ry={800} fill="#FFC070" opacity={0.18 * (1 - dim)} />
    <path d={`M-900,-700 H2800 V-80 Q1960,${30 + sw * 0.3} 960,-40 Q0,30 -900,-80Z`} fill="#5A1C22" {...o(4)} />
    <path d={`M1500,-700 Q${1560 + sw},${floor / 2} ${1480 + sw * 0.6},${floor}`} stroke="#4A161C" strokeWidth={140} fill="none" />
    <path d={`M1680,-700 Q${1720 + sw * 0.7},${floor / 2} ${1690 + sw * 0.4},${floor}`} stroke="#3E1218" strokeWidth={90} fill="none" />
    <rect x={-900} y={floor} width={3700} height={700} fill="#3A2826" {...o(4)} />
    <rect x={-900} y={floor - 300} width={3700} height={24} fill="#C9A86A" {...o(3)} />
    {/* chair: upholstered, seen from the side */}
    <g transform={`translate(860,${floor})`}>
      <path d="M-120,0 L-110,-160 M110,0 L100,-160" stroke="#2A1A14" strokeWidth={14} strokeLinecap="round" />
      <rect x={-140} y={-200} width={260} height={56} rx={14} fill="#6A2A2A" {...o(5)} />
      <path d="M-150,-196 Q-180,-330 -150,-470 Q-100,-500 -60,-470 Q-80,-330 -60,-196Z" fill="#6A2A2A" {...o(5)} />
      <path d="M-160,-260 Q-60,-280 60,-250" stroke="#4A1A1A" strokeWidth={22} fill="none" strokeLinecap="round" />
    </g>
    {/* the playbill (no text: a plain folded sheet) */}
    <g transform={`translate(${pb.x},${pb.y}) rotate(${pb.rot})`}>
      <rect x={-46} y={-30} width={92} height={60} rx={3} fill="#E8DCC0" stroke="#2A1A14" strokeWidth={3} />
      {[-14, -2, 10].map((yy) => <line key={yy} x1={-30} y1={yy} x2={30} y2={yy} stroke="#9A8A70" strokeWidth={3} />)}
    </g>
    {/* motes in the lamp light */}
    {Array.from({length: 26}, (_, i) => (
      <circle key={i} cx={500 + hash(i) * 900 + Math.sin(f / 50 + i) * 30} cy={((hash(i * 3) * 900 - f * (0.3 + hash(i) * 0.4)) % 900 + 900) % 900} r={2 + hash(i * 5) * 2} fill="#F4E2B8" opacity={0.25} />
    ))}
    {/* the house lights going down */}
    <rect x={-900} y={-700} width={3700} height={2400} fill="#0A0608" opacity={0.42 * dim} />
  </g>
  );
};

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
export const BackRoomFromDoor: React.FC<{f: number; far?: React.ReactNode; near?: React.ReactNode; covered?: boolean}> = ({f, far, near, covered = false}) => {
  const fl = 1 + noise1(f / 4, 12) * 0.08;
  return (
    <g>
      <rect x={-900} y={-700} width={3700} height={2400} fill="#4A4234" />
      <rect x={300} y={140} width={1320} height={660} fill="#6A6048" {...o(4)} />
      <rect x={300} y={800} width={1320} height={240} fill="#4A3A2C" {...o(4)} />
      {far}
      {/* bed, set diagonally, plain cover only */}
      <path d="M520,760 L1180,700 L1420,820 L700,900Z" fill="#CFC6AE" {...o(4)} />
      <path d="M520,760 L520,640 L560,630 L560,752" fill="#4A3424" {...o(4)} />
      <path d="M700,900 L700,940 M1420,820 L1420,860" stroke={ink} strokeWidth={8} />
      {covered && (
        <g>
          {/* a long figure under the cover, lying corner to corner (too tall to lie straight); head turned away, no face */}
          <ellipse cx={612} cy={758} rx={58} ry={26} fill="#EDE6D2" {...o(3)} />
          <ellipse cx={622} cy={744} rx={30} ry={22} fill="#2A2420" {...o(3)} />
          <path d={`M640,770 Q900,${742 + Math.sin(f / 45) * 1.5} 1350,792 Q1370,806 1344,818 Q900,${806 + Math.sin(f / 45) * 1.5} 650,800 Q624,790 640,770Z`} fill="#A89A80" {...o(4)} />
          <path d="M700,786 Q1000,770 1320,800" stroke="#8A7E66" strokeWidth={4} fill="none" />
        </g>
      )}
      {/* small table and lamp */}
      <rect x={1380} y={600} width={150} height={20} fill="#5A4030" {...o(3)} />
      <path d="M1395,620 V780 M1515,620 V780" stroke={ink} strokeWidth={8} />
      <ellipse cx={1455} cy={520} rx={320 * fl} ry={280 * fl} fill="url(#s09gas)" />
      <path d="M1440,600 L1444,560 L1466,560 L1470,600Z" fill="#B08A3A" {...o(2.5)} />
      <path d="M1445,560 Q1436,530 1448,512 L1462,512 Q1474,530 1465,560Z" fill="#F4E8C0" opacity={0.8} {...o(2.5)} />
      {near}
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
