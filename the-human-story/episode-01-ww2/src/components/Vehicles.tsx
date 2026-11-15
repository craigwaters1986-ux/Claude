// Animated vehicles: tanks with rotating tracks, aircraft with spinning propellers,
// ships, small boats, landing craft, trucks and trains.  All side-view, facing right
// (use dir=-1 to face left).  `dist` = distance travelled (px) for wheel/track rotation.
import React from 'react';
import {C, FONT} from '../styles/theme';
import {Smoke} from './Effects';

const ink = C.ink;

export const Insignia: React.FC<{kind: 'cross' | 'star' | 'usstar' | 'roundel' | 'hinomaru' | 'none'; x: number; y: number; s?: number}> = ({kind, x, y, s = 1}) => {
  const g = (c: React.ReactNode) => <g transform={`translate(${x},${y}) scale(${s})`}>{c}</g>;
  switch (kind) {
    case 'cross':
      return g(<><path d="M-14,-4 L-4,-4 L-4,-14 L4,-14 L4,-4 L14,-4 L14,4 L4,4 L4,14 L-4,14 L-4,4 L-14,4Z" fill="#fff" /><path d="M-10,-2.5 L-2.5,-2.5 L-2.5,-10 L2.5,-10 L2.5,-2.5 L10,-2.5 L10,2.5 L2.5,2.5 L2.5,10 L-2.5,10 L-2.5,2.5 L-10,2.5Z" fill={ink} /></>);
    case 'star':
      return g(<path d="M0,-14 L4,-4 L14,-4 L6,3 L9,13 L0,7 L-9,13 L-6,3 L-14,-4 L-4,-4Z" fill={C.red} stroke={ink} strokeWidth={1.5} />);
    case 'usstar':
      return g(<><circle r={15} fill="#1F2E5A" /><path d="M0,-13 L3.5,-4 L13,-4 L5.5,2.5 L8,12 L0,6.5 L-8,12 L-5.5,2.5 L-13,-4 L-3.5,-4Z" fill="#fff" /></>);
    case 'roundel':
      return g(<><circle r={15} fill="#1F3A7A" /><circle r={10} fill="#fff" /><circle r={5.5} fill="#C8102E" /></>);
    case 'hinomaru':
      return g(<><circle r={14} fill="#fff" /><circle r={11} fill="#BC002D" /></>);
    default:
      return null;
  }
};

/** Side-view tank.  variant 't34' (ep01) = sloped hull and rounded turret; defaults to Soviet green with a red star. */
export const Tank: React.FC<{x: number; y: number; dist: number; s?: number; dir?: 1 | -1; color?: string; mark?: 'cross' | 'star' | 'usstar' | 'none'; turret?: number; f?: number; exhaust?: boolean; dust?: boolean; variant?: 'panzer' | 't34'; snow?: boolean}> = ({
  x, y, dist, s = 1, dir = 1, color: colorIn, mark: markIn, turret = 0, f = 0, exhaust = true, dust = true, variant = 'panzer', snow = false,
}) => {
  const t34 = variant === 't34';
  const color = colorIn ?? (t34 ? '#4E5E34' : C.germanGrey);
  const mark = markIn ?? (t34 ? 'star' : 'cross');
  const wheelR = 20;
  const wheels = [-95, -50, -5, 40, 85];
  const rot = (dist / wheelR) * (180 / Math.PI);
  const bob = Math.sin(dist / 18) * 1.5;
  return (
    <g transform={`translate(${x},${y}) scale(${s * dir},${s})`}>
      {exhaust && <g transform={`scale(${dir},1)`}><Smoke x={-140 * dir} y={-70} f={f} n={6} size={14} rise={90} drift={-60 * dir} color="#6E6E6E" opacity={0.5} outline={false} /></g>}
      {dust && <g opacity={0.5}>{[0, 1, 2].map((i) => <circle key={i} cx={-150 - ((dist * 0.5 + i * 30) % 90)} cy={-12} r={12 + ((dist * 0.5 + i * 30) % 90) * 0.25} fill="#BFAF8A" opacity={1 - ((dist * 0.5 + i * 30) % 90) / 90} />)}</g>}
      <g transform={`translate(0,${bob})`}>
        {/* track */}
        <rect x={-135} y={-50} width={270} height={52} rx={26} fill="#3A3A36" stroke={ink} strokeWidth={5} />
        <rect x={-135} y={-50} width={270} height={52} rx={26} fill="none" stroke="#7A7A70" strokeWidth={5} strokeDasharray="10 9" strokeDashoffset={-dist} />
        {wheels.map((wx, i) => (
          <g key={i} transform={`translate(${wx},${-24}) rotate(${rot})`}>
            <circle r={wheelR} fill="#55554E" stroke={ink} strokeWidth={4} />
            <line x1={-wheelR + 5} y1={0} x2={wheelR - 5} y2={0} stroke={ink} strokeWidth={3} />
            <line x1={0} y1={-wheelR + 5} x2={0} y2={wheelR - 5} stroke={ink} strokeWidth={3} />
            <circle r={5} fill={ink} />
          </g>
        ))}
        {t34 ? (
          <g>
            {/* sloped hull: long glacis at the front, sloped rear */}
            <path d="M-150,-50 L-128,-96 L60,-96 L162,-54 L150,-50Z" fill={color} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
            {snow && <path d="M-128,-96 L60,-96 L80,-88 L-132,-88Z" fill={C.snow} />}
            <g transform={`translate(-20,-96) rotate(${-turret})`}>
              <rect x={45} y={-34} width={150} height={12} rx={4} fill={color} stroke={ink} strokeWidth={4} />
              <path d="M-62,0 C-62,-40 -40,-56 0,-56 C40,-56 62,-40 66,0Z" fill={color} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
              <circle cx={-6} cy={-58} r={10} fill={color} stroke={ink} strokeWidth={4} />
            </g>
            <Insignia kind={mark} x={-20} y={-122} s={1.1} />
          </g>
        ) : (
          <g>
            {/* hull */}
            <path d="M-150,-50 L-140,-100 L130,-100 L160,-62 L150,-50Z" fill={color} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
            {snow && <path d="M-140,-100 L130,-100 L134,-92 L-141,-92Z" fill={C.snow} />}
            {/* turret */}
            <g transform={`translate(-5,-100) rotate(${-turret})`}>
              <rect x={50} y={-38} width={150} height={13} rx={4} fill={color} stroke={ink} strokeWidth={4} />
              <path d="M-70,0 L-60,-55 L55,-55 L75,0Z" fill={color} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
              <rect x={-30} y={-70} width={40} height={16} rx={4} fill={color} stroke={ink} strokeWidth={4} />
            </g>
            <Insignia kind={mark} x={-60} y={-76} s={1.1} />
          </g>
        )}
      </g>
    </g>
  );
};

export type PlaneKind = 'spitfire' | 'bf109' | 'bomber' | 'zero' | 'stuka' | 'p51' | 'dakota' | 'heavy' | 'dauntless' | 'kate' | 'p40' | 'airliner';

/**
 * Side-view aircraft.  New (ep01): kind 'dauntless' (US Navy dive bomber; `brakes` 0..1 opens the
 * perforated dive brakes), 'kate' (Japanese carrier attack bomber, hinomaru only), 'p40' (US fighter),
 * 'airliner' (1930s twin-engine airliner, silver, no national markings; `door` shows the open door).
 * `gear` shows the landing wheels; `prop={false}` stops the propeller (parked aircraft).
 */
export const Plane: React.FC<{x: number; y: number; f: number; s?: number; dir?: 1 | -1; kind?: PlaneKind; bank?: number; trail?: boolean; brakes?: number; gear?: boolean; prop?: boolean; door?: boolean; burning?: boolean}> = ({
  x, y, f, s = 1, dir = 1, kind = 'spitfire', bank = 0, trail = false, brakes = 0, gear = false, prop = true, door = false, burning = false,
}) => {
  const spec: Record<PlaneKind, {body: string; wing: string; mark: 'roundel' | 'cross' | 'hinomaru' | 'usstar' | 'none'; len: number; engines: number; stripes?: boolean; belly?: string}> = {
    spitfire: {body: '#6F7A4A', wing: '#8B7D55', mark: 'roundel', len: 1, engines: 1},
    bf109: {body: '#8C949A', wing: '#6F777C', mark: 'cross', len: 1, engines: 1},
    stuka: {body: '#7C8460', wing: '#6A7050', mark: 'cross', len: 1.1, engines: 1},
    bomber: {body: '#7E8478', wing: '#666C60', mark: 'cross', len: 1.6, engines: 2},
    zero: {body: '#D9D6C8', wing: '#C9C6B6', mark: 'hinomaru', len: 1, engines: 1},
    p51: {body: '#B9BEC2', wing: '#A3A8AC', mark: 'usstar', len: 1, engines: 1, stripes: true},
    dakota: {body: '#6E6A44', wing: '#5E5A38', mark: 'usstar', len: 1.7, engines: 2, stripes: true},
    heavy: {body: '#B9BEC2', wing: '#A3A8AC', mark: 'usstar', len: 2, engines: 2},
    dauntless: {body: '#3E5A7A', wing: '#34506E', mark: 'usstar', len: 1.15, engines: 1, belly: '#C9CDD0'},
    kate: {body: '#7C8A5A', wing: '#6C7A4C', mark: 'hinomaru', len: 1.3, engines: 1, belly: '#C9C6B6'},
    p40: {body: '#6B6A45', wing: '#5E5D3C', mark: 'usstar', len: 1, engines: 1, belly: '#A9ACA8'},
    airliner: {body: '#C8CCD0', wing: '#B3B8BC', mark: 'none', len: 1.9, engines: 2},
  };
  const sp = spec[kind];
  const L = 150 * sp.len;
  const propBlur = prop ? Math.abs(Math.sin(f * 1.7)) * 0.9 + 0.1 : 1;
  return (
    <g transform={`translate(${x},${y}) scale(${s * dir},${s}) rotate(${bank})`}>
      {burning && <Smoke x={-L * 0.1} y={0} f={f} n={8} size={18} rise={30} drift={-260} color="#3A3A3A" opacity={0.7} outline={false} />}
      {gear && (
        <g stroke={ink} strokeWidth={4}>
          <line x1={L * 0.12} y1={10} x2={L * 0.16} y2={44} />
          <circle cx={L * 0.16} cy={48} r={11} fill="#2E2E2E" />
          <line x1={-L * 0.55} y1={6} x2={-L * 0.57} y2={20} />
          <circle cx={-L * 0.57} cy={23} r={6} fill="#2E2E2E" />
        </g>
      )}
      {trail && <path d={`M${-L * 0.6},0 L${-L * 0.6 - 500},6`} stroke="#fff" strokeWidth={10} opacity={0.5} strokeLinecap="round" />}
      {/* far wing */}
      <path d={`M${-L * 0.05},-6 L${-L * 0.25},-38 L${L * 0.08},-38 L${L * 0.18},-6Z`} fill={sp.wing} stroke={ink} strokeWidth={4} strokeLinejoin="round" opacity={0.9} />
      {/* tail */}
      <path d={`M${-L * 0.55},-8 L${-L * 0.68},-55 L${-L * 0.52},-55 L${-L * 0.38},-10Z`} fill={sp.body} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M${-L * 0.6},0 L${-L * 0.75},4 L${-L * 0.72},12 L${-L * 0.5},8Z`} fill={sp.wing} stroke={ink} strokeWidth={3.5} strokeLinejoin="round" />
      {/* fuselage */}
      <path d={`M${-L * 0.62},-6 C${-L * 0.3},-26 ${L * 0.3},-30 ${L * 0.5},-14 L${L * 0.5},14 C${L * 0.3},22 ${-L * 0.3},16 ${-L * 0.62},6Z`} fill={sp.body} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
      {kind === 'zero' && <rect x={L * 0.38} y={-18} width={L * 0.12} height={34} fill="#2A2A2A" />}
      {/* cockpit */}
      <path d={`M${L * 0.0},-22 C${L * 0.05},-42 ${L * 0.25},-42 ${L * 0.28},-22Z`} fill="#9FC3D0" stroke={ink} strokeWidth={4} />
      {sp.belly && <path d={`M${-L * 0.55},5 C${-L * 0.3},14 ${L * 0.3},18 ${L * 0.48},11 L${L * 0.48},13 C${L * 0.3},21 ${-L * 0.3},15 ${-L * 0.6},6Z`} fill={sp.belly} />}
      {kind === 'airliner' && Array.from({length: 7}).map((_, i) => <rect key={i} x={-L * 0.32 + i * L * 0.085} y={-12} width={L * 0.045} height={10} rx={2} fill="#4E6A78" stroke={ink} strokeWidth={2} />)}
      {kind === 'airliner' && <rect x={-L * 0.45} y={-14} width={L * 0.07} height={26} rx={2} fill={door ? '#2A2A2A' : '#B3B8BC'} stroke={ink} strokeWidth={2.5} />}
      {sp.stripes && [0, 1, 2, 3, 4].map((i) => <rect key={i} x={-L * 0.35 + i * 8} y={-14} width={8} height={26} fill={i % 2 ? ink : '#fff'} opacity={0.85} />)}
      <Insignia kind={sp.mark} x={-L * 0.2} y={0} s={0.9} />
      {/* near wing */}
      <path d={`M${-L * 0.1},6 L${-L * 0.2},44 L${L * 0.15},44 L${L * 0.22},6Z`} fill={sp.wing} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      {brakes > 0 && (
        <g>
          {/* perforated split dive brakes, above and below the trailing edge */}
          <path d={`M${-L * 0.2},44 L${-L * 0.2 - 30 * brakes},${44 + 22 * brakes} L${L * 0.1 - 30 * brakes},${44 + 22 * brakes} L${L * 0.1},44Z`} fill={sp.wing} stroke={ink} strokeWidth={3} />
          {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={-L * 0.16 + i * L * 0.055 - 15 * brakes} cy={44 + 11 * brakes} r={3 * brakes} fill={ink} />)}
        </g>
      )}
      {sp.engines === 2 && (
        <g>
          <rect x={L * 0.02} y={14} width={L * 0.2} height={20} rx={8} fill={sp.body} stroke={ink} strokeWidth={3.5} />
          <ellipse cx={L * 0.24} cy={24} rx={4} ry={26 * propBlur} fill="#2A2A2A" opacity={0.6} />
        </g>
      )}
      {/* propeller */}
      <rect x={L * 0.5} y={-6} width={12} height={12} rx={4} fill={ink} />
      {prop ? (
        <>
          <ellipse cx={L * 0.5 + 12} cy={0} rx={5} ry={34 * propBlur} fill="#2A2A2A" opacity={0.65} />
          <ellipse cx={L * 0.5 + 12} cy={0} rx={2} ry={36} fill="#9A9A9A" opacity={0.25} />
        </>
      ) : (
        <path d={`M${L * 0.5 + 12},0 L${L * 0.5 + 8},-34 L${L * 0.5 + 16},-34Z M${L * 0.5 + 12},0 L${L * 0.5 + 8},34 L${L * 0.5 + 16},34Z`} fill="#2A2A2A" stroke={ink} strokeWidth={2} />
      )}
    </g>
  );
};

export const Ship: React.FC<{x: number; y: number; f: number; s?: number; dir?: 1 | -1; kind?: 'warship' | 'carrier' | 'liner' | 'freighter'; color?: string; smoke?: boolean; flagKind?: string; seed?: number; burning?: boolean}> = ({
  x, y, f, s = 1, dir = 1, kind = 'warship', color = '#7D868C', smoke = true, seed = 1, burning = false,
}) => {
  const bob = Math.sin(f / 18 + seed) * 4;
  const roll = Math.sin(f / 26 + seed) * 1.2;
  return (
    <g transform={`translate(${x},${y + bob}) rotate(${roll}) scale(${s * dir},${s})`}>
      {kind === 'carrier' ? (
        <g>
          <path d="M-330,-30 L330,-30 L300,40 L-290,40Z" fill={color} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
          <rect x={-360} y={-46} width={720} height={18} fill="#8A7A5A" stroke={ink} strokeWidth={4} />
          <rect x={120} y={-120} width={60} height={75} fill={color} stroke={ink} strokeWidth={4} />
          <rect x={140} y={-150} width={16} height={32} fill={ink} />
          {smoke && <Smoke x={150} y={-150} f={f} n={6} size={16} rise={110} drift={-80} color="#555" opacity={0.6} outline={false} seed={seed} />}
        </g>
      ) : kind === 'warship' ? (
        <g>
          <path d="M-300,-20 L310,-20 L270,40 L-270,40Z" fill={color} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
          <rect x={-120} y={-80} width={180} height={62} fill={color} stroke={ink} strokeWidth={4} />
          <rect x={-60} y={-130} width={70} height={52} fill={color} stroke={ink} strokeWidth={4} />
          <rect x={-20} y={-190} width={8} height={62} fill={ink} />
          <rect x={80} y={-110} width={34} height={92} fill="#5E666B" stroke={ink} strokeWidth={4} />
          <rect x={140} y={-38} width={110} height={10} fill={ink} />
          <rect x={-240} y={-38} width={110} height={10} fill={ink} />
          {smoke && <Smoke x={97} y={-110} f={f} n={7} size={18} rise={140} drift={-120} color="#4A4A4A" opacity={0.7} outline={false} seed={seed} />}
          {[...Array(8)].map((_, i) => <circle key={i} cx={-220 + i * 60} cy={8} r={6} fill="#2A2A2A" />)}
        </g>
      ) : (
        <g>
          <path d="M-260,-20 L270,-20 L240,40 L-240,40Z" fill={kind === 'liner' ? '#2A2A2A' : '#6A5A4A'} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
          <rect x={-150} y={-70} width={260} height={52} fill="#EEE8D8" stroke={ink} strokeWidth={4} />
          <rect x={-40} y={-120} width={38} height={52} fill={C.red} stroke={ink} strokeWidth={4} />
          {smoke && <Smoke x={-21} y={-120} f={f} n={6} size={16} rise={120} drift={-100} color="#4A4A4A" opacity={0.6} outline={false} seed={seed} />}
        </g>
      )}
      {burning && (
        <g>
          <Smoke x={-80} y={-60} f={f} n={10} size={40} rise={420} drift={80} color="#2E2E2E" seed={seed + 4} />
        </g>
      )}
    </g>
  );
};

/** Small civilian boat (Dunkirk "little ships"). */
export const SmallBoat: React.FC<{x: number; y: number; f: number; s?: number; dir?: 1 | -1; color?: string; cabin?: string; sail?: boolean; seed?: number; passengers?: number}> = ({
  x, y, f, s = 1, dir = 1, color = '#B23A2E', cabin = '#EEE8D8', sail = false, seed = 1, passengers = 3,
}) => {
  const bob = Math.sin(f / 10 + seed) * 5;
  const roll = Math.sin(f / 14 + seed) * 4;
  return (
    <g transform={`translate(${x},${y + bob}) rotate(${roll}) scale(${s * dir},${s})`}>
      {sail && (
        <g>
          <line x1={0} y1={-20} x2={0} y2={-190} stroke={ink} strokeWidth={6} />
          <path d="M5,-180 L95,-35 L5,-35Z" fill="#F2EBDC" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
        </g>
      )}
      {!sail && <rect x={-40} y={-62} width={70} height={44} fill={cabin} stroke={ink} strokeWidth={4} />}
      {Array.from({length: passengers}).map((_, i) => (
        <g key={i} transform={`translate(${-80 + i * 34},-28)`}>
          <circle r={13} fill="#fff" stroke={ink} strokeWidth={3} />
          <path d="M-14,-4 Q0,-22 14,-4" fill="#7C7346" stroke={ink} strokeWidth={2.5} />
        </g>
      ))}
      <path d="M-120,-20 L120,-20 Q110,25 70,30 L-100,30Z" fill={color} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
      <line x1={-110} y1={-6} x2={115} y2={-6} stroke="#fff" strokeWidth={4} opacity={0.7} />
    </g>
  );
};

/** Higgins-type landing craft; ramp (0..1) lowers the front ramp. */
export const LandingCraft: React.FC<{x: number; y: number; f: number; s?: number; ramp?: number; seed?: number; troops?: number}> = ({x, y, f, s = 1, ramp = 0, seed = 1, troops = 5}) => {
  const bob = Math.sin(f / 9 + seed) * 6 * (1 - ramp * 0.7);
  return (
    <g transform={`translate(${x},${y + bob}) scale(${s})`}>
      {Array.from({length: troops}).map((_, i) => (
        <g key={i} transform={`translate(${-110 + i * 38},${-58 + Math.sin(f / 7 + i) * 2})`}>
          <circle r={14} fill="#fff" stroke={ink} strokeWidth={3} />
          <path d="M-17,-2 C-17,-24 17,-24 17,-2 Q0,-6 -17,-2Z" fill="#5E6238" stroke={ink} strokeWidth={2.5} />
        </g>
      ))}
      <path d="M-160,-50 L100,-50 L100,30 L-140,30 L-160,0Z" fill="#6E7468" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
      <rect x={-150} y={-38} width={240} height={8} fill="#55594F" />
      <g transform={`translate(100,30) rotate(${ramp * 75})`}>
        <rect x={0} y={-82} width={16} height={82} fill="#7E8478" stroke={ink} strokeWidth={4} />
      </g>
    </g>
  );
};

export const Truck: React.FC<{x: number; y: number; dist: number; s?: number; dir?: 1 | -1; color?: string; mark?: 'cross' | 'star' | 'usstar' | 'none'; cover?: string; jeep?: boolean}> = ({
  x, y, dist, s = 1, dir = 1, color = '#6E6A44', mark = 'none', cover = '#8C8460', jeep = false,
}) => {
  const rot = (dist / 22) * (180 / Math.PI);
  const wheel = (wx: number, k: number) => (
    <g key={k} transform={`translate(${wx},-22) rotate(${rot})`}>
      <circle r={22} fill="#2E2E2E" stroke={ink} strokeWidth={4} />
      <circle r={9} fill="#8A8A80" />
      <line x1={-9} y1={0} x2={9} y2={0} stroke={ink} strokeWidth={3} />
    </g>
  );
  const bob = Math.sin(dist / 14) * 1.5;
  if (jeep)
    return (
      <g transform={`translate(${x},${y}) scale(${s * dir},${s})`}>
        <g transform={`translate(0,${bob})`}>
          <path d="M-90,-30 L-90,-70 L40,-70 L60,-90 L70,-90 L60,-60 L95,-58 L95,-30Z" fill={color} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
          <Insignia kind={mark} x={-30} y={-48} s={0.9} />
        </g>
        {wheel(-55, 1)}
        {wheel(60, 2)}
      </g>
    );
  return (
    <g transform={`translate(${x},${y}) scale(${s * dir},${s})`}>
      <g transform={`translate(0,${bob})`}>
        <path d="M-170,-35 L-170,-130 Q-170,-150 -150,-150 L40,-150 Q60,-150 60,-130 L60,-35Z" fill={cover} stroke={ink} strokeWidth={5} />
        <path d="M60,-35 L60,-110 L120,-110 L150,-70 L150,-35Z" fill={color} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
        <path d="M75,-100 L115,-100 L135,-72 L75,-72Z" fill="#9FC3D0" stroke={ink} strokeWidth={3.5} />
        <rect x={-175} y={-40} width={330} height={14} fill={color} stroke={ink} strokeWidth={4} />
        <Insignia kind={mark} x={100} y={-55} s={0.8} />
      </g>
      {wheel(-120, 1)}
      {wheel(-60, 2)}
      {wheel(100, 3)}
    </g>
  );
};

export const Train: React.FC<{x: number; y: number; dist: number; f: number; cars?: number; s?: number; dir?: 1 | -1; color?: string}> = ({x, y, dist, f, cars = 3, s = 1, dir = 1, color = '#3A3A3A'}) => {
  const rot = (dist / 20) * (180 / Math.PI);
  const wheel = (wx: number, k: string) => (
    <g key={k} transform={`translate(${wx},-20) rotate(${rot})`}>
      <circle r={20} fill="#2E2E2E" stroke={ink} strokeWidth={4} />
      <line x1={-16} y1={0} x2={16} y2={0} stroke="#888" strokeWidth={3} />
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${s * dir},${s})`}>
      <Smoke x={120} y={-200} f={f} n={8} size={26} rise={160} drift={-180} color="#5A5A5A" opacity={0.75} outline={false} />
      <rect x={-60} y={-140} width={220} height={100} rx={10} fill={color} stroke={ink} strokeWidth={5} />
      <rect x={-80} y={-200} width={90} height={160} fill={color} stroke={ink} strokeWidth={5} />
      <rect x={-65} y={-185} width={60} height={45} fill="#9FC3D0" stroke={ink} strokeWidth={3} />
      <rect x={105} y={-200} width={30} height={60} fill={ink} />
      <path d="M160,-60 L200,-30 L160,-30Z" fill={C.red} stroke={ink} strokeWidth={4} />
      {[-40, 30, 100].map((wx, i) => wheel(wx, `l${i}`))}
      {Array.from({length: cars}).map((_, c) => (
        <g key={c} transform={`translate(${-330 - c * 260},0)`}>
          <rect x={0} y={-150} width={240} height={110} fill="#6A4A3A" stroke={ink} strokeWidth={5} />
          <rect x={20} y={-130} width={80} height={40} fill="#4A3426" stroke={ink} strokeWidth={3} />
          <rect x={140} y={-130} width={80} height={40} fill="#4A3426" stroke={ink} strokeWidth={3} />
          {wheel(40, `c${c}a`)}
          {wheel(200, `c${c}b`)}
          <line x1={240} y1={-50} x2={260} y2={-50} stroke={ink} strokeWidth={6} />
        </g>
      ))}
    </g>
  );
};

/** Rifle prop (for slinging on backs) — drawn in torso space. */
export const RifleOnBack: React.FC = () => (
  <g transform="rotate(-28) translate(-6,-30)">
    <rect x={-3} y={-70} width={6} height={110} fill="#4A3426" stroke={ink} strokeWidth={2} />
    <rect x={-2} y={-100} width={4} height={34} fill={ink} />
  </g>
);

export const Newspaper: React.FC<{w?: number; h?: number; headline?: string; masthead?: string; date?: string; sub?: string}> = ({w = 70, h = 90, headline = 'NEWS', masthead = 'DAILY', date, sub}) => (
  <g transform={`translate(${-w / 2},${-h / 2})`}>
    <rect width={w} height={h} fill="#F2EBDC" stroke={ink} strokeWidth={2.5} />
    <text x={w / 2} y={h * 0.14} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={h * 0.1} fill={ink}>{masthead}</text>
    <line x1={4} y1={h * 0.18} x2={w - 4} y2={h * 0.18} stroke={ink} strokeWidth={1.5} />
    {date && <text x={w / 2} y={h * 0.24} textAnchor="middle" fontFamily={FONT.sans} fontWeight={700} fontSize={h * 0.045} fill={ink}>{date}</text>}
    <text x={w / 2} y={h * 0.38} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={Math.min(h * 0.12, (w * 1.7) / Math.max(4, headline.length))} fill={ink}>{headline}</text>
    {sub && <text x={w / 2} y={h * 0.5} textAnchor="middle" fontFamily={FONT.sans} fontWeight={700} fontSize={h * 0.06} fill={ink}>{sub}</text>}
    {Array.from({length: 6}).map((_, i) => <line key={i} x1={6} y1={h * (0.58 + i * 0.065)} x2={w - 6} y2={h * (0.58 + i * 0.065)} stroke="#9A9180" strokeWidth={h * 0.025} />)}
  </g>
);

// ============================================================ ep01 additions
/**
 * V-01 Horsa/Waco-like high-wing assault glider (side view, facing right).  `skid` 0..1 = landing
 * slide (nose dips, dust spray, wing-tip wobble).  mark: Allied roundel or US star; stripes = invasion stripes.
 */
export const Glider: React.FC<{x: number; y: number; f: number; s?: number; dir?: 1 | -1; mark?: 'roundel' | 'usstar'; skid?: number; stripes?: boolean; pitch?: number}> = ({
  x, y, f, s = 1, dir = 1, mark = 'roundel', skid = 0, stripes = true, pitch = -4,
}) => {
  const wob = skid > 0 ? Math.sin(f / 2) * 3 * (1 - skid) : Math.sin(f / 25) * 1.5;
  return (
    <g transform={`translate(${x},${y}) scale(${s * dir},${s}) rotate(${pitch + wob + skid * 6})`}>
      {skid > 0 && skid < 1 && (
        <g opacity={1 - skid}>
          {[0, 1, 2, 3].map((i) => <circle key={i} cx={-40 - i * 40 - ((f * 6) % 40)} cy={44} r={14 + i * 6} fill="#A99A78" opacity={0.6} />)}
        </g>
      )}
      {/* tail */}
      <path d="M-200,-6 L-238,-70 L-205,-70 L-170,-12Z" fill="#6E6A44" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M-215,2 L-250,4 L-245,14 L-200,12Z" fill="#5E5A38" stroke={ink} strokeWidth={3.5} strokeLinejoin="round" />
      {/* long boxy fuselage */}
      <path d="M-215,-4 L-150,-30 L150,-34 C182,-32 196,-14 196,6 C196,26 176,34 150,34 L-140,30 Z" fill="#6E6A44" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
      {/* cockpit glazing */}
      <path d="M150,-34 C176,-32 192,-18 194,-2 L160,-4 L150,-30Z" fill="#9FC3D0" stroke={ink} strokeWidth={3.5} />
      {stripes && [0, 1, 2, 3, 4].map((i) => <rect key={i} x={-110 + i * 12} y={-29} width={12} height={62} fill={i % 2 ? ink : '#fff'} opacity={0.85} />)}
      <Insignia kind={mark} x={-20} y={2} s={1.2} />
      {/* high wing seen edge-on, with a strut */}
      <path d="M-10,-34 L140,-40 L150,-48 L-20,-44Z" fill="#5E5A38" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      <line x1={60} y1={-40} x2={30} y2={28} stroke={ink} strokeWidth={4} />
      {/* skid / fixed wheel */}
      <line x1={80} y1={32} x2={86} y2={46} stroke={ink} strokeWidth={4} />
      <circle cx={86} cy={50} r={10} fill="#2E2E2E" stroke={ink} strokeWidth={3} />
      <path d="M-40,32 L120,34" stroke={ink} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

/**
 * V-02 Round parachute canopy.  (x, y) = the harness point midway between the paratrooper's
 * shoulders; the rigging lines converge on two points at ±`shoulder` px.  open 0..1 blooms the
 * canopy (scale-up with an overshoot wobble); it then sways slowly.  Draw it BEFORE (behind) the figure.
 */
export const Parachute: React.FC<{x: number; y: number; f: number; open?: number; s?: number; shoulder?: number; color?: string; seed?: number; lineLen?: number}> = ({
  x, y, f, open = 1, s = 1, shoulder = 14, color = '#E8E1CF', seed = 1, lineLen = 190,
}) => {
  if (open <= 0) return null;
  const k = Math.min(1, open);
  const bloom = k < 1 ? k * (1 + Math.sin(k * Math.PI) * 0.25) : 1 + Math.sin(f / 9 + seed) * 0.02;
  const sway = Math.sin(f / 28 + seed) * 6;
  const w = 130 * bloom;
  const cy = -lineLen * (0.35 + 0.65 * k);
  const scallops = 6;
  let rim = '';
  for (let i = 0; i < scallops; i++) {
    const x0 = -w + (2 * w * i) / scallops;
    const x1 = -w + (2 * w * (i + 1)) / scallops;
    rim += ` Q${(x0 + x1) / 2},${cy + 14 * bloom} ${x1},${cy}`;
  }
  const canopy = `M${-w},${cy} C${-w},${cy - 95 * bloom} ${w},${cy - 95 * bloom} ${w},${cy}${rim.split(' Q').reverse().length ? '' : ''}`;
  // rim drawn right-to-left back to the start
  let rimBack = '';
  for (let i = scallops; i > 0; i--) {
    const x0 = -w + (2 * w * i) / scallops;
    const x1 = -w + (2 * w * (i - 1)) / scallops;
    rimBack += ` Q${(x0 + x1) / 2},${cy + 14 * bloom} ${x1},${cy}`;
  }
  return (
    <g transform={`translate(${x},${y}) scale(${s}) rotate(${sway})`}>
      {[-1, -0.6, -0.2, 0.2, 0.6, 1].map((u, i) => (
        <line key={i} x1={u * w} y1={cy} x2={u < 0 ? -shoulder : shoulder} y2={0} stroke={ink} strokeWidth={1.8} opacity={0.85} />
      ))}
      <path d={canopy + rimBack + 'Z'} fill={color} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      {[-0.5, 0, 0.5].map((u, i) => <path key={i} d={`M${u * w},${cy + 8} Q${u * w * 0.8},${cy - 50 * bloom} 0,${cy - 70 * bloom}`} fill="none" stroke={ink} strokeWidth={2} opacity={0.5} />)}
    </g>
  );
};

/**
 * V-05 Japanese aircraft carrier seen from above (for the high-angle dive in S07-03): flight deck
 * with a red hinomaru circle near the bow, island on the starboard side.  No Rising Sun ensign.
 * `burning` 0..1 adds fires and smoke on deck.  rot in degrees.
 */
export const CarrierTop: React.FC<{x: number; y: number; f: number; s?: number; rot?: number; burning?: number; wake?: boolean}> = ({x, y, f, s = 1, rot = 0, burning = 0, wake = true}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    {wake && (
      <g opacity={0.7}>
        <path d={`M-420,-30 L-760,${-90 - Math.sin(f / 10) * 6} M-420,30 L-760,${90 + Math.sin(f / 10) * 6}`} stroke="#fff" strokeWidth={10} strokeLinecap="round" />
        <path d="M-420,0 L-800,0" stroke="#D8E6EA" strokeWidth={40} opacity={0.5} strokeLinecap="round" />
      </g>
    )}
    <path d="M-420,-46 L330,-46 L420,0 L330,46 L-420,46 L-440,0Z" fill="#6E6A62" stroke={ink} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-400} y={-38} width={740} height={76} fill="#A88A5A" stroke={ink} strokeWidth={4} />
    {Array.from({length: 12}).map((_, i) => <line key={i} x1={-380 + i * 62} y1={-38} x2={-380 + i * 62} y2={38} stroke="#8A6E44" strokeWidth={2} />)}
    <line x1={-390} y1={0} x2={330} y2={0} stroke="#F2EBDC" strokeWidth={4} strokeDasharray="30 20" />
    <circle cx={250} cy={0} r={30} fill="#fff" stroke={ink} strokeWidth={3} />
    <circle cx={250} cy={0} r={24} fill="#BC002D" />
    {/* island on the starboard side */}
    <rect x={40} y={46} width={90} height={26} fill="#7A7D78" stroke={ink} strokeWidth={4} />
    <rect x={70} y={50} width={24} height={18} fill={ink} />
    {burning > 0 && (
      <g>
        <Smoke x={-60} y={0} f={f} n={8} size={34 * burning} rise={260} drift={-160} color="#2E2E2E" opacity={0.85 * burning} seed={4} />
        <Smoke x={140} y={-10} f={f + 20} n={6} size={26 * burning} rise={220} drift={-140} color="#3A3A3A" opacity={0.8 * burning} seed={6} />
        {[-60, 140].map((fx, i) => (
          <g key={i} transform={`translate(${fx},0)`}>
            <circle r={26 * burning + Math.sin(f / 2 + i) * 4} fill={C.fire} stroke={ink} strokeWidth={3} />
            <circle r={13 * burning} fill={C.fireYellow} />
          </g>
        ))}
      </g>
    )}
  </g>
);
