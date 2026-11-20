// s01 — The Hook (0-30 s). Storyboard S01-01 … S01-06. Replaces the old Preview opening (T-03).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack} from '../components/Camera';
import {Sky, Clouds, Sun, Street, StreetLamp, Birds, Tree, HistoryRoom, Chalk} from '../components/Environment';
import {Fire, Particles} from '../components/Effects';
import {Newspaper} from '../components/Vehicles';
import {holdFront, shrug, point, mixPose, walk, stand, sit} from '../characters/poses';
import {GeoMap, MapArrow, camLerp, growArrow, MapLabel, Globe} from '../maps/GeoMap';
import {GERMANY_1937, CITY} from '../maps/geo';
import {DateCard, BigTitle} from '../components/Text';
import {prog, kf, easeOut, easeInOut, clamp} from '../animations/core';
import {sec, Fig, Shot, ck, Bench} from './kit';

const {b, cut} = sec('s01');
const T1 = cut(1); // S01-01 → 02
const T2 = cut(2); // → 03 (newspaper)
const T3 = cut(3); // → 04 (map)
const T4 = cut(6); // → 05 (room)
const T5 = b.endOf(7) + 1; // → 06 title (22.8 s)
const NEWS = T2 - 30; // headline paper starts flying

const StreetScene: React.FC<{f: number; keys: [number, number, number, number][]}> = ({f, keys}) => {
  const slow = prog(f, T2 - 40, T2 - 10); // walkers slow at the end
  const frown = f > T1 + 20;
  const lowered = prog(f, T1 + 10, T1 + 30);
  const dist = (sp: number) => f * sp * (1 - 0.6 * slow);
  const walker = (k: string, x0: number, sp: number, y: number, s = 1, expr: 'happy' | 'neutral' = 'happy') => {
    const d = dist(sp);
    const span = W + 400;
    const x = ((((x0 + d) % span) + span) % span) - 200;
    return <Fig key={k + x0} k={k} x={x} y={y} f={f} s={s} dir={sp >= 0 ? 1 : -1} pose={walk(Math.abs(d) / 150, 1 - slow * 0.5)} expr={expr} />;
  };
  const ballY = 790 - Math.abs(Math.sin(f / 9)) * 70;
  return (
    <Shot f={f} bg={C.sky} keys={keys}>
      <Sky top="#9FC6D3" bottom="#F1E6C8" />
      <Sun x={1600} y={170} f={f} />
      <Clouds f={f} n={5} seed={4} speed={0.5} yMin={70} yMax={260} />
      <Birds f={f} n={5} seed={3} y={140} />
      <Street base={770} seed={7} f={f} awnings />
      <rect x={-200} y={770} width={W + 400} height={400} fill="#C9C2B4" />
      <line x1={-200} y1={770} x2={W + 200} y2={770} stroke={C.ink} strokeWidth={5} />
      <rect x={-200} y={905} width={W + 400} height={300} fill="#9A958A" />
      <line x1={-200} y1={905} x2={W + 200} y2={905} stroke={C.ink} strokeWidth={4} />
      <StreetLamp x={300} y={790} />
      <StreetLamp x={1450} y={790} />
      <Tree x={980} y={790} s={0.9} f={f} />
      <Bench x={645} y={870} />
      <Fig k="man2" x={640} y={870} f={f} pose={{...(lowered > 0.5 ? sit(f, 2) : holdFront(f, 2)), hipL: 88, kneeL: 88, hipR: 92, kneeR: 92, bob: 0}} expr={frown ? 'worried' : 'neutral'} turn={0.5} />
      <g transform={`translate(${705 + Math.sin(f / 25) * 2},${728 + lowered * 70}) rotate(${-4 + Math.sin(f / 30) * 2 + lowered * 10})`}>
        <Newspaper w={96} h={120} headline="DANZIG CRISIS" masthead="DAILY" date="AUGUST 1939" />
      </g>
      {walker('anna', 120, 2.1, 860)}
      <Fig k="leo" x={((120 + dist(2.1) + 95) % (W + 400)) - 200} y={865} f={f} pose={walk(Math.abs(dist(2.1)) / 110, 1.2)} expr="happy" />
      <g transform={`translate(${((120 + dist(2.1) + 150) % (W + 400)) - 200},${ballY})`}>
        <circle r={16} fill={C.red} stroke={C.ink} strokeWidth={4} />
      </g>
      {walker('man1', 1500, -1.8, 850, 1, 'neutral')}
      {walker('woman1', 1100, 1.5, 1010, 1.15)}
      {walker('britSoldier', 1800, -2.4, 1015, 1.15, 'neutral')}
    </Shot>
  );
};

const FlyingPaper: React.FC<{f: number}> = ({f}) => {
  const t = prog(f, NEWS, T2, easeInOut);
  if (t <= 0) return null;
  return (
    <g transform={`translate(${kf(t * 100, [[0, 1500], [100, W / 2]])},${kf(t * 100, [[0, 320], [100, H / 2]])}) rotate(${(1 - t) * 540}) scale(${0.6 + t * 6.8})`}>
      <Newspaper w={140} h={150} headline="WAR" masthead="THE DAILY CHRONICLE" date="SEPTEMBER 1939" />
    </g>
  );
};

const NewspaperShot: React.FC<{f: number}> = ({f}) => {
  const t = f - T2;
  const land = prog(t, 0, 24, easeOut);
  const z = (1 + t * 0.00035) * (0.85 + 0.15 * land);
  return (
    <Shot f={f} bg="#2A2620" vignette={0.5}>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#4A3524" />
      {Array.from({length: 9}).map((_, i) => (
        <line key={i} x1={-200} y1={-100 + i * 150} x2={W + 200} y2={-60 + i * 150} stroke="#3A2A1C" strokeWidth={6} />
      ))}
      <g transform={`translate(${W / 2},${H / 2 - 40}) scale(${z}) rotate(${-2 + Math.sin(t / 40) + (1 - land) * 12})`}>
        <rect x={-760} y={-420} width={1520} height={860} fill="#F2EBDC" stroke={C.ink} strokeWidth={8} />
        <text x={0} y={-320} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={96} fill={C.ink}>The Daily Chronicle</text>
        <line x1={-720} y1={-285} x2={720} y2={-285} stroke={C.ink} strokeWidth={5} />
        <text x={-720} y={-250} fontFamily={FONT.sans} fontWeight={700} fontSize={28} fill={C.ink}>SEPTEMBER 1939</text>
        <text x={720} y={-250} textAnchor="end" fontFamily={FONT.sans} fontWeight={700} fontSize={28} fill={C.ink}>ONE PENNY</text>
        <line x1={-720} y1={-235} x2={720} y2={-235} stroke={C.ink} strokeWidth={3} />
        <text x={0} y={-110} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={128} fill={C.ink} letterSpacing={2}>WAR BREAKS OUT</text>
        <text x={0} y={20} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={128} fill={C.ink} letterSpacing={2}>IN EUROPE</text>
        <text x={0} y={100} textAnchor="middle" fontFamily={FONT.serif} fontWeight={700} fontSize={44} fill={C.darkRed}>Germany invades Poland · Britain and France declare war</text>
        {[0, 1, 2].map((c) => (
          <g key={c}>
            {Array.from({length: 7}).map((_, i) => (
              <line key={i} x1={-700 + c * 480} y1={160 + i * 34} x2={-280 + c * 480 - (i % 4) * 30} y2={160 + i * 34} stroke="#A49A86" strokeWidth={12} />
            ))}
          </g>
        ))}
      </g>
    </Shot>
  );
};

const MapShot: React.FC<{f: number}> = ({f}) => {
  const b3 = b.at(3), b4 = b.at(4), b5 = b.at(5);
  const t = prog(f, b3 - 10, b5, easeInOut);
  const cam = camLerp({lon: 14, lat: 52, zoom: 1.9}, {lon: 15, lat: 51, zoom: 1.0}, t);
  const cam2 = camLerp(cam, {lon: 15, lat: 51, zoom: 0.92}, prog(f, b5, T4 + 12));
  const dim = prog(f, b5, b5 + 30) * 0.6;
  const fires = ['Warsaw', 'Rotterdam', 'London', 'Coventry', 'Leningrad', 'Stalingrad'];
  return (
    <Shot f={f} bg="#9DBCC4" vignette={0.45}>
      <GeoMap kind="europe" cam={cam2} f={f} dim={dim} highlights={[{feature: GERMANY_1937, fill: C.axis, opacity: 0.85}, {name: 'Austria', fill: C.axis, opacity: 0.85}]}>
        {({toScreen}) => (
          <g>
            <MapLabel at={toScreen([10.5, 51.2])} text="GERMANY" size={34} color="#fff" stroke="rgba(0,0,0,0.6)" />
            <MapArrow pts={[[13.4, 52.5], [17, 52.4], [21, 52.2]].map((p) => toScreen(p as [number, number]))} progress={growArrow(f, b3, b3 + 40)} color={C.axisDark} width={24} />
            <MapArrow pts={[[7.5, 50.3], [5.2, 49.6], [2.6, 48.9]].map((p) => toScreen(p as [number, number]))} progress={growArrow(f, b3 + 10, b3 + 50)} color={C.axisDark} width={24} />
            <MapArrow pts={[[10, 54.5], [10.4, 57.5], [10.7, 59.6]].map((p) => toScreen(p as [number, number]))} progress={growArrow(f, b3 + 20, b3 + 55)} color={C.axisDark} width={20} />
            <MapArrow pts={[[22, 52.5], [29, 54], [36.5, 55.6]].map((p) => toScreen(p as [number, number]))} progress={growArrow(f, b3 + 25, b4 + 30)} color={C.axisDark} width={24} />
            {fires.map((n, i) => {
              const at = b4 + i * 6;
              if (f < at) return null;
              const [x, y] = toScreen(CITY[n]);
              return <Fire key={n} x={x} y={y + 8} f={f} s={0.26 * clamp((f - at) / 10)} seed={i} />;
            })}
          </g>
        )}
      </GeoMap>
      <g opacity={prog(f, b5, b5 + 30)}>
        <Particles f={f} kind="ash" n={40} seed={5} opacity={0.6} />
      </g>
    </Shot>
  );
};

const RoomShot: React.FC<{f: number}> = ({f}) => {
  const b6 = b.at(6), b7 = b.at(7);
  const pose = f < b7 ? shrug(f) : mixPose(shrug(f), point(f, 115), prog(f, b7, b7 + 13));
  return (
    <Shot f={f} bg={C.wallYellow} keys={ck([T4, 1.0, W / 2, H / 2], [T5, 1.06, W / 2 - 30, H / 2])}>
      <HistoryRoom
        f={f}
        board={
          <g>
            <Chalk x={1140} y={330} text="1939" size={110} reveal={prog(f, T4 + 14, T4 + 34)} />
            <Chalk x={1140} y={460} text="→  ?  →" size={90} reveal={prog(f, b6 + 25, b6 + 45)} />
            <Chalk x={1140} y={600} text="1945" size={110} reveal={prog(f, b7, b7 + 20)} />
          </g>
        }
      />
      <Fig k="guide" x={330} y={900} f={f} s={1.55} pose={pose} expr={f < b7 ? 'worried' : 'determined'} talking={(f >= b6 && f < b.endOf(6)) || (f >= b7 && f < b.endOf(7))} turn={f < b7 ? 0.1 : 0.4} />
    </Shot>
  );
};

const TitleShot: React.FC<{f: number}> = ({f}) => {
  const t = f - T5;
  const z = 1 + 0.03 * prog(t, 0, 216);
  return (
    <Shot f={f} bg={C.deepNavy} vignette={0.4}>
      <g transform={`translate(${W / 2},${H / 2}) scale(${z}) translate(${-W / 2},${-H / 2})`}>
        <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={C.deepNavy} />
        <g opacity={0.35}>
          <Globe f={f} lon={10 + t * 0.15} lat={30} r={620} cx={W / 2} cy={H + 260} />
        </g>
        <path d={`M${W / 2 - 80},-20 L${W / 2 - 520},${H} L${W / 2 + 520},${H} L${W / 2 + 80},-20 Z`} fill="#F4EBD6" opacity={0.04} />
        <Particles f={f} kind="dust" n={30} seed={8} opacity={0.35} />
        <g transform={`translate(${W / 2},${300}) scale(${0.6 + 0.4 * prog(t, 2, 22, easeOut)})`} opacity={prog(t, 2, 16)}>
          <circle r={78} fill="#fff" stroke={C.dustyYellow} strokeWidth={8} />
          <ellipse cx={-22} cy={-4} rx={8} ry={11 * (Math.floor(t / 70) % 4 === 3 && t % 70 < 4 ? 0.15 : 1)} fill={C.ink} />
          <ellipse cx={22} cy={-4} rx={8} ry={11 * (Math.floor(t / 70) % 4 === 3 && t % 70 < 4 ? 0.15 : 1)} fill={C.ink} />
          <path d="M-20,30 Q0,44 20,30" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
      </g>
    </Shot>
  );
};

export const S01Picture: React.FC<{f: number}> = ({f}) => {
  const k1: [number, number, number, number][] = [[0, 1.04, W / 2, H / 2], [T1, 1.08, W / 2 + 20, H / 2]];
  const k2: [number, number, number, number][] = [[T1, 1.3, 760, 640], [T1 + 40, 1.35, 690, 640], [T2 - 30, 1.6, 700, 680], [T2, 1.7, 700, 690]];
  return (
    <ShotTrack
      f={f}
      shots={[
        {from: 0, to: T1, el: <StreetScene f={f} keys={k1} />},
        {
          from: T1,
          to: T2,
          trans: 'cut',
          el: (
            <>
              <StreetScene f={f} keys={k2} />
              <svg width={W} height={H} style={{position: 'absolute'}}>
                <FlyingPaper f={f} />
              </svg>
            </>
          ),
        },
        {from: T2, to: T3, el: <NewspaperShot f={f} />, trans: 'cut'},
        {from: T3, to: T4, el: <MapShot f={f} />},
        {from: T4, to: T5, el: <RoomShot f={f} />, trans: 'wipe'},
        {from: T5, to: 900, el: <TitleShot f={f} />, trans: 'dip'},
      ]}
    />
  );
};

export const S01Overlay: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <g>
      <DateCard at={24} until={204} date="SUMMER 1939" title="EUROPE" />
      <BigTitle at={T5 + 6} until={905} text="THE HUMAN STORY" size={140} y={530} />
      <g opacity={prog(f, T5 + 30, T5 + 48)}>
        <text x={W / 2} y={640} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={64} fill={C.dustyYellow} stroke={C.ink} strokeWidth={5} paintOrder="stroke" letterSpacing={2}>
          Episode 1: World War II
        </text>
      </g>
      <text x={W / 2} y={735} textAnchor="middle" fontFamily={FONT.sans} fontWeight={600} fontStyle="italic" fontSize={44} fill="#E8E1CF" opacity={prog(f, T5 + 60, T5 + 80)}>
        How It Started, How It Ended
      </text>
      {/* fade up from black (0.5 s) */}
      <rect x={0} y={0} width={W} height={H} fill="#000" opacity={1 - prog(f, 0, 15)} />
    </g>
  );
};
