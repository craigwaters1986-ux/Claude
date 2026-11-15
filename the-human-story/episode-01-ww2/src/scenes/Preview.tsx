// Work-in-progress preview: the 30-second opening hook built from the engine so far.
// Draft only — script not yet approved, no music/SFX yet.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, W, H, FONT} from '../styles/theme';
import {Stage, Camera, ShotTrack} from '../components/Camera';
import {Sky, Clouds, Sun, Street, StreetLamp, Birds, Tree, HistoryRoom, Chalk} from '../components/Environment';
import {Fire, Vignette} from '../components/Effects';
import {Newspaper} from '../components/Vehicles';
import {StickFigure} from '../characters/StickFigure';
import {CAST} from '../characters/cast';
import {walk, holdFront, stand, shrug, point, mixPose} from '../characters/poses';
import {GeoMap, MapArrow, camLerp, growArrow, MapLabel} from '../maps/GeoMap';
import {GERMANY_1937, CITY} from '../maps/geo';
import {DateCard, BigTitle, Captions} from '../components/Text';
import {Globe} from '../maps/GeoMap';
import {prog, kf, easeOut, easeInOut, clamp} from '../animations/core';

// sentence starts (frames) from narration.json, section s01
const B = [48, 124, 212, 377, 427, 472, 562, 627];

const Walker: React.FC<{f: number; who: string; x0: number; speed: number; y: number; seed: number; surprised: boolean; s?: number}> = ({f, who, x0, speed, y, seed, surprised, s = 1}) => {
  const c = CAST[who];
  // walkers slow to a halt when the news arrives
  const stopAt = 200;
  const dist = f < stopAt ? f * speed : stopAt * speed + (1 - Math.exp(-(f - stopAt) / 10)) * speed * 10;
  const span = W + 300;
  const x = ((((x0 + dist) % span) + span) % span) - 150;
  const moving = f < stopAt + 15;
  const p = moving ? walk(Math.abs(dist) / 150) : stand(f, seed);
  return (
    <StickFigure x={x} y={y} f={f} seed={seed} scale={s} dir={speed >= 0 ? 1 : -1} pose={p} head={{...c.head, expression: surprised ? 'surprised' : 'happy'}} outfit={c.outfit} child={c.child} look={surprised ? [0.6, -1] : undefined} />
  );
};

const StreetShot: React.FC<{f: number}> = ({f}) => {
  const surprised = f > 205;
  const paperT = prog(f, 186, 236, easeInOut);
  return (
    <Stage bg={C.sky}>
      <Camera keys={[[0, 1.04, W / 2, H / 2], [200, 1.1, W / 2 + 40, H / 2 - 10], [240, 1.12, W / 2 + 40, H / 2 - 10]]}>
        <Sky top="#9FC6D3" bottom="#F1E6C8" />
        <Sun x={1600} y={170} f={f} />
        <Clouds f={f} n={5} seed={4} speed={0.5} yMin={70} yMax={260} />
        <Birds f={f} n={5} seed={3} y={140} />
        <Street base={770} seed={7} f={f} awnings />
        <rect x={-200} y={770} width={W + 400} height={400} fill="#C9C2B4" />
        <line x1={-200} y1={770} x2={W + 200} y2={770} stroke={C.ink} strokeWidth={5} />
        <rect x={-200} y={900} width={W + 400} height={300} fill="#9A958A" />
        <line x1={-200} y1={900} x2={W + 200} y2={900} stroke={C.ink} strokeWidth={4} />
        <StreetLamp x={300} y={790} />
        <StreetLamp x={1450} y={790} />
        <Tree x={980} y={790} s={0.9} f={f} />
        {/* bench reader */}
        <rect x={560} y={815} width={170} height={14} fill={C.brown} stroke={C.ink} strokeWidth={3.5} />
        <rect x={570} y={829} width={10} height={36} fill={C.ink} />
        <rect x={710} y={829} width={10} height={36} fill={C.ink} />
        <StickFigure x={640} y={870} f={f} seed={11} pose={{...holdFront(f, 2), hipL: 88, kneeL: 88, hipR: 92, kneeR: 92, bob: 0}} head={{...CAST.man2.head, expression: surprised ? 'surprised' : 'neutral'}} outfit={CAST.man2.outfit} turn={0.5} />
        {!surprised && (
          <g transform={`translate(${705 + Math.sin(f / 25) * 2},${728}) rotate(${-4 + Math.sin(f / 30) * 2})`}>
            <Newspaper w={96} h={120} headline="TENSIONS" masthead="DAILY" date="AUGUST 1939" />
          </g>
        )}
        <Walker f={f} who="anna" x0={200} speed={2.1} y={845} seed={2} surprised={surprised} />
        <Walker f={f} who="leo" x0={290} speed={2.1} y={850} seed={3} surprised={surprised} />
        <Walker f={f} who="man1" x0={1500} speed={-1.8} y={850} seed={4} surprised={surprised} />
        <Walker f={f} who="woman1" x0={1100} speed={1.5} y={1000} seed={5} surprised={surprised} s={1.15} />
        <Walker f={f} who="tom" x0={1800} speed={-2.4} y={1010} seed={6} surprised={surprised} s={1.15} />
      </Camera>
      {/* newspaper flies into the foreground */}
      {paperT > 0 && (
        <g transform={`translate(${kf(paperT * 100, [[0, 1500], [100, W / 2]])},${kf(paperT * 100, [[0, 320], [100, H / 2]])}) rotate(${(1 - paperT) * 540}) scale(${0.6 + paperT * 6.8})`}>
          <Newspaper w={140} h={150} headline="WAR!" masthead="THE DAILY CHRONICLE" date="SEPTEMBER 1939" />
        </g>
      )}
      <Vignette strength={0.3} />
    </Stage>
  );
};

const NewspaperShot: React.FC<{f: number}> = ({f}) => {
  const t = f - 212;
  const z = 1 + t * 0.0009;
  return (
    <Stage bg="#2A2620">
      <g transform={`translate(${W / 2},${H / 2}) scale(${z}) rotate(${-2 + Math.sin(t / 40)})`}>
        <rect x={-760} y={-470} width={1520} height={940} fill="#F2EBDC" stroke={C.ink} strokeWidth={8} />
        <text x={0} y={-370} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={96} fill={C.ink}>The Daily Chronicle</text>
        <line x1={-720} y1={-335} x2={720} y2={-335} stroke={C.ink} strokeWidth={5} />
        <text x={-720} y={-300} fontFamily={FONT.sans} fontWeight={700} fontSize={28} fill={C.ink}>SEPTEMBER 1939</text>
        <text x={720} y={-300} textAnchor="end" fontFamily={FONT.sans} fontWeight={700} fontSize={28} fill={C.ink}>ONE PENNY</text>
        <line x1={-720} y1={-285} x2={720} y2={-285} stroke={C.ink} strokeWidth={3} />
        <text x={0} y={-150} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={128} fill={C.ink} letterSpacing={2}>WAR BREAKS OUT</text>
        <text x={0} y={-20} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={128} fill={C.ink} letterSpacing={2}>IN EUROPE</text>
        <text x={0} y={60} textAnchor="middle" fontFamily={FONT.serif} fontWeight={700} fontSize={44} fill={C.darkRed}>Germany invades Poland · Britain and France declare war</text>
        {[0, 1, 2].map((c) => (
          <g key={c}>
            {Array.from({length: 9}).map((_, i) => (
              <line key={i} x1={-700 + c * 480} y1={120 + i * 34} x2={-280 + c * 480 - (i % 4) * 30} y2={120 + i * 34} stroke="#A49A86" strokeWidth={12} />
            ))}
          </g>
        ))}
      </g>
      <Vignette strength={0.5} />
    </Stage>
  );
};

const MapShot: React.FC<{f: number}> = ({f}) => {
  const t = prog(f, 377, 470, easeInOut);
  const cam = camLerp({lon: 14, lat: 52, zoom: 1.9}, {lon: 15, lat: 51, zoom: 1.0}, t);
  const dim = prog(f, 470, 500) * 0.55;
  const fires = ['Warsaw', 'Rotterdam', 'London', 'Coventry', 'Stalingrad', 'Leningrad'];
  return (
    <Stage bg="#9DBCC4">
      <GeoMap kind="europe" cam={cam} f={f} dim={dim} highlights={[{feature: GERMANY_1937, fill: C.axis, opacity: 0.85}, {name: 'Austria', fill: C.axis, opacity: 0.85}]}>
        {({toScreen}) => (
          <g>
            <MapLabel at={toScreen([10.5, 51.2])} text="GERMANY" size={34} color="#fff" stroke="rgba(0,0,0,0.6)" />
            <MapArrow pts={[[13.4, 52.5], [17, 52.4], [21, 52.2]].map((p) => toScreen(p as [number, number]))} progress={growArrow(f, 380, 420)} color={C.axisDark} width={24} />
            <MapArrow pts={[[7.5, 50.3], [5.2, 49.6], [2.6, 48.9]].map((p) => toScreen(p as [number, number]))} progress={growArrow(f, 395, 435)} color={C.axisDark} width={24} />
            <MapArrow pts={[[10, 54.5], [10.4, 57.5], [10.7, 59.6]].map((p) => toScreen(p as [number, number]))} progress={growArrow(f, 405, 445)} color={C.axisDark} width={20} />
            <MapArrow pts={[[22, 52.5], [29, 54], [36.5, 55.6]].map((p) => toScreen(p as [number, number]))} progress={growArrow(f, 415, 465)} color={C.axisDark} width={24} />
            {fires.map((n, i) => {
              const at = 430 + i * 6;
              if (f < at) return null;
              const [x, y] = toScreen(CITY[n]);
              return <Fire key={n} x={x} y={y + 8} f={f} s={0.32 * clamp((f - at) / 10)} seed={i} />;
            })}
          </g>
        )}
      </GeoMap>
      <BigTitle at={474} until={575} text="WORLD WAR II" sub="1939 – 1945" size={150} />
      <Vignette strength={0.45} />
    </Stage>
  );
};

const RoomShot: React.FC<{f: number}> = ({f}) => {
  const t = f - 562;
  const pose = f < 627 ? shrug(f) : mixPose(shrug(f), point(f, 115), prog(f, 627, 640));
  return (
    <Stage bg={C.wallYellow}>
      <Camera keys={[[562, 1.0, W / 2, H / 2], [700, 1.06, W / 2 - 30, H / 2]]}>
        <HistoryRoom
          f={f}
          board={
            <g>
              <Chalk x={1140} y={330} text="1939" size={110} reveal={prog(f, 566, 590)} />
              <Chalk x={1140} y={460} text="→  ?  →" size={90} reveal={prog(f, 590, 615)} />
              <Chalk x={1140} y={600} text="1945" size={110} reveal={prog(f, 627, 650)} />
            </g>
          }
        />
        <StickFigure x={330} y={900} f={f} seed={21} scale={1.55} pose={pose} head={{...CAST.guide.head, expression: f < 627 ? 'worried' : 'determined'}} outfit={CAST.guide.outfit} talking={(f >= 562 && f < 620) || (f >= 627 && f < 680)} turn={f < 627 ? 0.1 : 0.4} />
      </Camera>
      <Vignette strength={0.35} />
      {t < 0 ? null : null}
    </Stage>
  );
};

const TitleShot: React.FC<{f: number}> = ({f}) => {
  const t = f - 690;
  return (
    <Stage bg={C.deepNavy}>
      <rect width={W} height={H} fill={C.deepNavy} />
      <g opacity={0.35}>
        <Globe f={f} lon={10 + t * 0.15} lat={30} r={620} cx={W / 2} cy={H + 260} />
      </g>
      <g transform={`translate(${W / 2},${300}) scale(${0.6 + 0.4 * prog(f, 692, 712, easeOut)})`} opacity={prog(f, 692, 706)}>
        <circle r={78} fill="#fff" stroke={C.dustyYellow} strokeWidth={8} />
        <ellipse cx={-22} cy={-4} rx={8} ry={11} fill={C.ink} />
        <ellipse cx={22} cy={-4} rx={8} ry={11} fill={C.ink} />
        <path d="M-20,30 Q0,44 20,30" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />
      </g>
      <BigTitle at={700} until={905} text="THE HUMAN STORY" size={140} y={540} sub="" />
      <BigTitle at={730} until={905} text="" sub="EPISODE 1 · WORLD WAR II" size={120} y={600} />
      <text x={W / 2} y={790} textAnchor="middle" fontFamily={FONT.sans} fontWeight={600} fontStyle="italic" fontSize={40} fill="#E8E1CF" opacity={prog(f, 760, 780)}>
        How It Started, How It Ended
      </text>
    </Stage>
  );
};

export const Preview: React.FC = () => {
  const f = useCurrentFrame();
  const shots = [
    {from: 0, to: 236, el: <StreetShot f={f} />},
    {from: 236, to: 377, el: <NewspaperShot f={f} />, trans: 'cut' as const},
    {from: 377, to: 562, el: <MapShot f={f} />},
    {from: 562, to: 690, el: <RoomShot f={f} />, trans: 'wipe' as const},
    {from: 690, to: 900, el: <TitleShot f={f} />, trans: 'dip' as const},
  ];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile('audio/narration.wav')} endAt={900} />
      <ShotTrack shots={shots} />
      <AbsoluteFill>
        <svg width={W} height={H}>
          <DateCard at={40} until={200} date="SUMMER 1939" title="EUROPE" sub="An ordinary day — for now" />
          <Captions t={f / 30} />
          <g opacity={0.85}>
            <rect x={W - 520} y={H - 46} width={500} height={34} rx={6} fill="rgba(0,0,0,0.55)" />
            <text x={W - 270} y={H - 22} textAnchor="middle" fontFamily={FONT.sans} fontWeight={700} fontSize={18} fill={C.dustyYellow}>
              WORK IN PROGRESS · draft script · no music yet
            </text>
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
