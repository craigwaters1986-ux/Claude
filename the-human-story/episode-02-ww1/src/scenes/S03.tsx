// s03 — Chapter 2: Sarajevo and the July Crisis (110–190 s; local frames 0–2399). Storyboard S03-01 … S03-08.
// Sarajevo is non-graphic (storyboard 1.6, decision 2): no gun is shown; the reverse angle on the crowd cuts in on the
// first report (sfx sync 126.95 s = local 508; second 520), pigeons scatter, then a slow fade to the empty back seat.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack, SplitPanels} from '../components/Camera';
import {HistoryRoom, Chalk, Interior, Flag, Street, StreetLamp, Building} from '../components/Environment';
import {Newspaper} from '../components/Vehicles';
import {CAR_COLORS, EmptyBackSeat} from '../components/VehiclesWW1';
import {Crowd} from '../characters/Crowd';
import {stand, cower, mixPose, addPose, point, shrug, run, paperWave, seated, talkGesture} from '../characters/poses';
import {MapEurope1914, CAM_1914} from '../maps/MapsWW1';
import {BookCard} from '../maps/IconsWW1';
import {camLerp} from '../maps/GeoMap';
import {DateCard, FactPill, TermCard} from '../components/Text';
import {prog, easeOut, easeIn, easeInOut, clamp} from '../animations/core';
import {sec, Fig, Shot, ck, ChalkPath, ChalkBox} from './kit';
import {CarParty, PigeonBurst, TimedTag, TimedGroupTag, SarajevoStreet, Desk, PanelHead, Boxed, GroundMist, vis} from './kit-ep02';

const {b, cut} = sec('s03');
const T1 = cut(1); // 335  S03-01 → 02
const STOP = 399; // car brakes (sfx 123.3 s)
const RPT = 508; // first report (126.95 s); second at 520 — reverse angle on the crowd
const SEAT = 548; // slow fade to the empty back seat (≈128.3 s)
const T2 = cut(2); // 596  → 03 (FADE)
const T3 = cut(3); // 802  → 04 (FADE)
const T4 = cut(5); // 1112 → 05 (CUT)
const T5 = cut(7); // 1492 → 06 (DIP)
const T6 = 1716; // → 07 (WIPE): storyboard 167.7 s; just before b8 (1721) so the newspaper reads
const T7 = cut(10); // 1926 → 08 (FADE)
const END = 2400;

const CIVILIANS = ['man1', 'man2', 'man3', 'woman1', 'woman2', 'woman3'];

// ---------------------------------------------------------------- S03-01 street level, the couple in the open car
const TRACK = 3.0; // px/frame the camera tracks with the car
const carX = (f: number) => 700 + f * 3.25;
const StreetShot: React.FC<{f: number}> = ({f}) => {
  const x = carX(f);
  const y = 880;
  return (
    <Shot f={f} bg="#8DBBD0" keys={ck([0, 1.08, 960, 600], [T1, 1.3, 1000, 650])}>
      <g transform={`translate(${-f * TRACK},0)`}>
        <SarajevoStreet f={f} x0={-400} x1={3400} seed={23} />
        <Crowd f={f} count={40} x0={-300} x1={3300} yBack={650} yFront={700} scaleBack={0.42} scaleFront={0.56} pool={CIVILIANS} mix={{wave: 3, clap: 2, stand: 1}} expression="happy" randomHats seed={13} />
        {/* the officials' escort car follows */}
        <CarParty f={f} x={x - 700} y={y} dist={x} s={0.95} color={CAR_COLORS.escort} riders={['worker', 'politician', 'politician2']} wave={false} poses={[seated(f, 1), seated(f, 4), seated(f, 5)]} expr={['neutral', 'neutral', 'neutral']} />
        <CarParty f={f} x={x} y={y} dist={x} riders={['worker', 'sophie', 'franzFerdinand']} />
        <TimedTag f={f} at={129} until={330} x={x - 70 + 160} y={y - 330} text="ARCHDUKE FRANZ FERDINAND" sub="heir to Austria-Hungary's throne" />
        <TimedTag f={f} at={129} until={330} x={x - 150 - 170} y={y - 262} text="SOPHIE" sub="his wife" />
      </g>
    </Shot>
  );
};

// ---------------------------------------------------------------- S03-02a corner: the car stops near Princip
const CornerShot: React.FC<{f: number}> = ({f}) => {
  const arrive = prog(f, T1, STOP, easeOut);
  const cx = 760 - 520 * (1 - arrive);
  const stall = prog(f, STOP, STOP + 36);
  const look = f > STOP + 20;
  return (
    <Shot f={f} bg="#8DBBD0" keys={ck([T1, 1.05, 900, 600], [RPT, 1.24, 1220, 580])}>
      <SarajevoStreet f={f} base={760} road={800} quay={false} seed={34} x0={-200} x1={2400} />
      <g>
        <path d="M1380,548 L1700,548 L1730,592 L1350,592Z" fill="#B23A2E" stroke={C.ink} strokeWidth={4} />
        {Array.from({length: 13}).map((_, i) => (
          <path key={i} d={`M${1350 + i * 30},592 q15,16 30,0`} fill="#B23A2E" stroke={C.ink} strokeWidth={3} />
        ))}
        <text x={1540} y={580} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={30} fill="#F4EBD6">
          CAFÉ
        </text>
      </g>
      {[1180, 1530, 1640].map((px, i) => (
        <Fig key={i} k={CIVILIANS[(i * 2 + 1) % 6]} x={px} y={790} f={f} s={0.82} dir={-1} pose={stand(f, i + 4)} seed={40 + i} expr="neutral" />
      ))}
      {/* Princip: hands at his sides, no gun; he turns his head towards the stopped car */}
      <Fig k="princip" x={1340} y={800} f={f} s={0.86} dir={look ? -1 : 1} turn={look ? -0.1 : -0.4} pose={stand(f, 2)} expr="neutral" />
      <CarParty f={f} x={cx} y={930} dist={cx + 40 * stall} stall={stall} running={stall < 0.6} riders={['worker', 'sophie', 'franzFerdinand']} wave={false} poses={[seated(f, 1), seated(f, 2), seated(f, 3)]} expr={['neutral', 'neutral', 'neutral']} />
      <TimedTag f={f} at={375} until={RPT - 4} x={1340} y={560} text="GAVRILO PRINCIP" sub="Bosnian Serb, aged 19" />
    </Shot>
  );
};

// ---------------------------------------------------------------- S03-02b reverse angle: the crowd recoils, pigeons scatter → empty seat
const BACKS: [string, number, number, number][] = [
  ['man2', 250, 1010, 1.2], ['woman1', 560, 1040, 1.25], ['man1', 900, 1000, 1.18], ['woman3', 1180, 1050, 1.28], ['man3', 1480, 1015, 1.2], ['woman2', 1760, 1035, 1.24], ['man2', 60, 1060, 1.3],
];
const CrowdBackShot: React.FC<{f: number}> = ({f}) => {
  const seat = prog(f, SEAT, SEAT + 36);
  const push = prog(f, SEAT, T2 + 12, (t) => t);
  return (
    <Shot
      f={f}
      bg="#8DBBD0"
      keys={ck([RPT, 1.0, 960, 560], [SEAT, 1.04, 960, 520])}
      sombre={0.5 * prog(f, RPT, SEAT) + 0.2 * seat}
      over={
        seat > 0 ? (
          <g opacity={seat}>
            <g transform={`translate(1180,700) scale(${1 + 0.06 * push}) translate(-1180,-700)`}>
              <EmptyBackSeat f={f} desat={0.7} />
            </g>
          </g>
        ) : undefined
      }
    >
      <SarajevoStreet f={f} base={700} road={760} quay={false} seed={51} x0={-300} x1={2400} />
      <Crowd f={f} count={22} x0={-100} x1={2100} yBack={760} yFront={800} scaleBack={0.5} scaleFront={0.6} pool={CIVILIANS} view="back" mix={{still: 2, stand: 1}} sombre randomHats seed={19} />
      <PigeonBurst f={f} at={RPT + 2} x={980} y={300} n={22} spread={1100} seed={8} />
      {BACKS.map(([k, x, y, s], i) => {
        const rec = prog(f, RPT + 3 + (i % 3) * 3, RPT + 15 + (i % 3) * 3, easeOut);
        return <Fig key={i} k={k} x={x} y={y} f={f} s={s} fromBehind pose={mixPose(stand(f, i), cower(f, i), rec * 0.75)} seed={60 + i} />;
      })}
    </Shot>
  );
};

// ---------------------------------------------------------------- S03-03 Berlin: the "blank cheque"
const SLIDE = 648; // paper slide (131.6 s)
const TAKE = 712;
const Cheque: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-95} y={-40} width={190} height={80} rx={4} fill="#DCE8D2" stroke={C.ink} strokeWidth={4} />
    <line x1={-80} y1={-18} x2={20} y2={-18} stroke="#8C9A86" strokeWidth={4} />
    <line x1={-80} y1={2} x2={40} y2={2} stroke="#8C9A86" strokeWidth={4} />
    <line x1={-80} y1={22} x2={-10} y2={22} stroke="#8C9A86" strokeWidth={4} />
    {/* the empty amount box */}
    <rect x={38} y={8} width={46} height={24} fill="#F7FBF2" stroke={C.ink} strokeWidth={3} />
  </g>
);
const OfficeShot: React.FC<{f: number}> = ({f}) => {
  const slide = prog(f, SLIDE - 10, SLIDE + 30);
  const taken = f >= TAKE;
  const bow = prog(f, TAKE + 20, TAKE + 44) * (1 - prog(f, TAKE + 70, TAKE + 96));
  const reachO = prog(f, SLIDE - 30, SLIDE - 10) * (1 - prog(f, SLIDE + 40, SLIDE + 60));
  const reachE = prog(f, TAKE - 24, TAKE) * (1 - prog(f, TAKE + 6, TAKE + 26));
  const sec2 = Math.floor(f / 30); // clock tick each second
  return (
    <Shot f={f} bg="#6E5A44" keys={ck([T2, 1.0, 960, 540], [T3, 1.07, 1020, 600])}>
      <Interior wall="#7A6248" floor="#5A4632" floorY={820} />
      {/* wood panelling */}
      {Array.from({length: 9}).map((_, i) => (
        <rect key={i} x={-120 + i * 250} y={640} width={210} height={150} rx={6} fill="none" stroke="#4E3C2A" strokeWidth={4} />
      ))}
      {/* window with an Imperial German flag outside */}
      <defs>
        <clipPath id="s0303win">
          <rect x={1260} y={170} width={380} height={400} />
        </clipPath>
      </defs>
      <g clipPath="url(#s0303win)">
        <rect x={1260} y={170} width={380} height={400} fill="#A9C4CF" />
        <rect x={1260} y={470} width={380} height={100} fill="#C9C0AA" />
        <Flag x={1340} y={300} f={f} kind="de-imperial" w={180} h={115} pole={290} seed={4} />
      </g>
      <rect x={1260} y={170} width={380} height={400} fill="none" stroke={C.ink} strokeWidth={10} />
      <line x1={1450} y1={170} x2={1450} y2={570} stroke={C.ink} strokeWidth={8} />
      <line x1={1260} y1={370} x2={1640} y2={370} stroke={C.ink} strokeWidth={8} />
      <rect x={1240} y={570} width={420} height={22} fill="#8A6A44" stroke={C.ink} strokeWidth={4} />
      {/* wall clock, ticking */}
      <g transform="translate(520,300)">
        <circle r={74} fill="#F4EBD6" stroke={C.ink} strokeWidth={6} />
        {Array.from({length: 12}).map((_, i) => (
          <line key={i} x1={0} y1={-60} x2={0} y2={-50} stroke={C.ink} strokeWidth={4} transform={`rotate(${i * 30})`} />
        ))}
        <line x1={0} y1={0} x2={0} y2={-34} stroke={C.ink} strokeWidth={7} strokeLinecap="round" transform="rotate(300)" />
        <line x1={0} y1={0} x2={0} y2={-52} stroke={C.ink} strokeWidth={5} strokeLinecap="round" transform="rotate(84)" />
        <line x1={0} y1={8} x2={0} y2={-56} stroke={C.red} strokeWidth={2.5} transform={`rotate(${sec2 * 6})`} />
        <circle r={6} fill={C.ink} />
      </g>
      {/* German official behind the desk */}
      <Fig k="politician" x={800} y={830} f={f} s={1.05} dir={1} turn={0.35} pose={addPose(stand(f, 3), {shR: 70 * reachO, elR: 10 * reachO, lean: 6 * reachO})} expr="neutral" />
      <Desk x0={600} x1={1290} y={700} h={120} />
      {/* desk top surface + the cheque */}
      <path d="M600,700 L630,662 L1260,662 L1290,700Z" fill="#B07E4E" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      {!taken && <Cheque x={880 + 300 * slide} y={682} s={0.8} rot={-3 + 3 * slide} />}
      {/* Austro-Hungarian envoy: takes the cheque and bows */}
      <Fig
        k="politician2"
        x={1450}
        y={850}
        f={f}
        s={1.05}
        dir={-1}
        turn={0.3}
        pose={addPose(stand(f, 5), {shR: 80 * reachE + (taken ? 40 : 0), elR: 15 * reachE + (taken ? 70 : 0), lean: 18 * bow, headTilt: 16 * bow})}
        holdR={taken ? <Cheque x={30} y={0} s={0.35} rot={-80} /> : undefined}
        expr="neutral"
      />
      <TimedGroupTag f={f} at={612} until={790} x={800} y={470} text="GERMAN GOVERNMENT" />
      <TimedGroupTag f={f} at={622} until={790} x={1450} y={490} text="AUSTRO-HUNGARIAN ENVOY" />
    </Shot>
  );
};

// ---------------------------------------------------------------- S03-04 ultimatum (M-01, Vienna–Belgrade)
const UltimatumMap: React.FC<{f: number}> = ({f}) => {
  const c1 = camLerp({...CAM_1914.viennaBelgrade, zoom: 1.85}, CAM_1914.viennaBelgrade, prog(f, T3, b.at(4)));
  const cam = camLerp(c1, {lon: 17.8, lat: 47.1, zoom: 2.05}, prog(f, b.at(4), T4)); // follows the reply back
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapEurope1914
        f={f}
        idSuffix="-s0304"
        cam={cam}
        base="alliances"
        july={{
          ultimatum: prog(f, 826, 890),
          clock: prog(f, 868, 1010, (t) => t),
          reply: prog(f, 1015, 1066),
          ticks: 5 * prog(f, 1060, 1100, (t) => t),
        }}
      />
    </Shot>
  );
};

// ---------------------------------------------------------------- S03-05 declarations (M-01, whole Europe → Belgium)
const DeclareMap: React.FC<{f: number}> = ({f}) => {
  const c1 = camLerp(CAM_1914.viennaBelgrade, CAM_1914.europe, prog(f, T4, b.at(6)));
  const cam = camLerp(c1, {lon: 5.6, lat: 50.5, zoom: 1.8}, prog(f, 1386, T5 + 4));
  const declare = prog(f, 1122, 1178) + prog(f, 1246, 1300) + prog(f, 1302, 1352) + prog(f, 1369, 1404) + prog(f, 1406, 1462);
  // FlipCalendar flips during the first 30 % of each index step, so a settled page sits at n + 0.3 or more
  const flips = [1244, 1310, 1372, 1406].filter((a) => f >= a);
  const cal = flips.length === 0 ? 0 : flips.length + Math.min(0.5, (0.3 * (f - flips[flips.length - 1])) / 12);
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapEurope1914
        f={f}
        idSuffix="-s0305"
        cam={cam}
        base="alliances"
        july={{declare, calendar: cal, calendarShow: vis(f, 1122, 1488, 14), marchers: f > 1430 ? (f - 1430) / 140 : 0}}
      />
    </Shot>
  );
};

// ---------------------------------------------------------------- S03-06 London, 11 p.m.
const CHIME = 1509; // 160.3 s: the big clock's hands click over to 11
const RUN = 1640; // newsboy runs in (footsteps 164.9 s); slap 1668
const ClockTower: React.FC<{f: number}> = ({f}) => {
  const click = prog(f, CHIME, CHIME + 4, easeOut);
  const minute = -6 + 6 * click + (click > 0 && click < 1 ? 2 : 0);
  return (
    <g>
      <rect x={1400} y={-160} width={220} height={940} fill="#4E4A44" stroke={C.ink} strokeWidth={6} />
      <path d="M1390,-160 L1510,-420 L1630,-160Z" fill="#3E3A36" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      {Array.from({length: 6}).map((_, i) => (
        <rect key={i} x={1440} y={140 + i * 100} width={36} height={56} fill="#E8C870" stroke={C.ink} strokeWidth={3} opacity={0.85} />
      ))}
      {Array.from({length: 6}).map((_, i) => (
        <rect key={'r' + i} x={1544} y={140 + i * 100} width={36} height={56} fill="#E8C870" stroke={C.ink} strokeWidth={3} opacity={0.85} />
      ))}
      <g transform="translate(1510,-40)">
        <circle r={128} fill="#FFE9A8" opacity={0.25} />
        <circle r={92} fill="#F6E7BE" stroke={C.ink} strokeWidth={7} />
        {Array.from({length: 12}).map((_, i) => (
          <line key={i} x1={0} y1={-80} x2={0} y2={-66} stroke={C.ink} strokeWidth={5} transform={`rotate(${i * 30})`} />
        ))}
        <line x1={0} y1={0} x2={0} y2={-44} stroke={C.ink} strokeWidth={9} strokeLinecap="round" transform={`rotate(${330 + 0.5 * minute})`} />
        <line x1={0} y1={0} x2={0} y2={-72} stroke={C.ink} strokeWidth={6} strokeLinecap="round" transform={`rotate(${minute})`} />
        <circle r={8} fill={C.ink} />
      </g>
    </g>
  );
};
const LONDONERS: [string, number, number][] = [
  ['man1', 330, 960], ['woman1', 470, 975], ['man3', 760, 965], ['woman3', 900, 985], ['man2', 1130, 960], ['woman2', 1270, 980], ['man1', 1680, 970],
];
const LondonShot: React.FC<{f: number}> = ({f}) => {
  const turned = f > CHIME + 12;
  const boyT = prog(f, RUN, RUN + 28, (t) => t);
  const boyX = 2120 - 560 * boyT;
  const slap = prog(f, 1668, 1684, easeOut);
  return (
    <Shot
      f={f}
      bg="#141E2E"
      keys={ck([T5, 1.45, 1510, 40], [T5 + 20, 1.45, 1510, 50], [T5 + 140, 1.05, 1000, 600], [T6, 1.08, 1060, 610])}
      over={
        slap > 0 ? (
          <g transform={`translate(${1500 + 300 * (1 - slap)},${610}) rotate(${-4 + 10 * (1 - slap)}) scale(${0.3 + 0.7 * slap})`} opacity={clamp(slap * 2)}>
            <rect x={-200} y={-250} width={400} height={500} fill="rgba(0,0,0,0.35)" transform="translate(10,12)" />
            <Newspaper w={400} h={500} headline="BRITAIN AT WAR" masthead="THE DAILY NEWS" sub="4 August 1914" />
          </g>
        ) : undefined
      }
    >
      <defs>
        <linearGradient id="s0306sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0E1626" />
          <stop offset="1" stopColor="#2A3550" />
        </linearGradient>
      </defs>
      <rect x={-400} y={-700} width={2800} height={1600} fill="url(#s0306sky)" />
      {Array.from({length: 40}).map((_, i) => (
        <circle key={i} cx={(i * 197) % 2400 - 200} cy={-600 + ((i * 113) % 700)} r={2 + (i % 3)} fill="#F4F1E8" opacity={0.4 + 0.3 * Math.sin(f / 20 + i)} />
      ))}
      <ClockTower f={f} />
      <Street base={790} seed={41} f={f} lit={1} x0={-300} x1={1380} />
      <Street base={790} seed={44} f={f} lit={1} x0={1640} x1={2300} />
      <rect x={-400} y={-700} width={2800} height={1500} fill="#1A2236" opacity={0.35} />
      <rect x={-400} y={790} width={2800} height={500} fill="#4A4A50" stroke={C.ink} strokeWidth={5} />
      <GroundMist f={f} y0={760} y1={900} amount={0.7} color="#9AA4B8" />
      {[180, 760, 1260, 1880].map((x) => (
        <StreetLamp key={x} x={x} y={880} lit />
      ))}
      <Crowd f={f} count={30} x0={-150} x1={2100} yBack={830} yFront={870} scaleBack={0.42} scaleFront={0.52} pool={CIVILIANS} mix={{stand: 3, still: 1}} randomHats seed={23} expression="neutral" />
      {LONDONERS.map(([k, x, y], i) => (
        <Fig
          key={i}
          k={k}
          x={x}
          y={y}
          f={f}
          s={0.78}
          dir={turned ? (i % 2 ? -1 : 1) : 1}
          turn={turned ? 0.4 : 0.2}
          pose={turned ? talkGesture(f, i) : addPose(stand(f, i), {headTilt: -16})}
          talking={turned && (f + i * 20) % 90 < 50}
          expr={turned ? 'worried' : 'neutral'}
          seed={70 + i}
        />
      ))}
      {/* newsboy */}
      {f > RUN - 2 && (
        <Fig
          k="kid2"
          x={boyX}
          y={990}
          f={f}
          s={0.85}
          dir={-1}
          pose={boyT < 1 ? run(f / 7) : paperWave(f, 2)}
          expr="surprised"
          talking={boyT >= 1}
          holdR={
            <g transform="rotate(-90)">
              <Newspaper w={70} h={90} headline="WAR" masthead="DAILY NEWS" />
            </g>
          }
        />
      )}
      <rect x={-400} y={-700} width={2800} height={2200} fill="#0E1626" opacity={0.18} />
    </Shot>
  );
};

// ---------------------------------------------------------------- S03-07 history room: trigger ≠ causes
const LOGS = ['ALLIANCES', 'ARMS RACE', 'NATIONALISM', 'EMPIRES', 'WAR PLANS'];
const TriggerShot: React.FC<{f: number}> = ({f}) => {
  const b8 = b.at(8), b9 = b.at(9);
  const fl = Math.sin(f / 2.3) * 6;
  const pose = f < b9 ? point(f, f < b8 + 60 ? 95 : 108) : f < b9 + 50 ? shrug(f) : point(f, 100);
  return (
    <Shot f={f} bg={C.wallYellow} keys={ck([T6, 1.0, 960, 540], [b9, 1.0, 960, 540], [T7 + 12, 1.12, 1140, 560])}>
      <HistoryRoom
        f={f}
        board={
          <g>
            {/* the match */}
            <ChalkPath d="M600,540 L700,420" reveal={prog(f, b8 + 2, b8 + 16)} w={9} />
            <ChalkPath d="M700,420 m-14,0 a14,14 0 1,0 28,0 a14,14 0 1,0 -28,0" reveal={prog(f, b8 + 14, b8 + 22)} w={7} />
            {f > b8 + 22 && <ChalkPath d={`M700,400 C${688 + fl},380 ${694 - fl},356 ${704 + fl * 0.6},${330 + fl} C${716 - fl},356 ${716 + fl * 0.4},380 706,400`} reveal={1} w={6} color="#F2D27A" />}
            <Chalk x={650} y={600} text="TRIGGER" size={44} reveal={prog(f, b8 + 20, b8 + 40)} />
            {/* ≠ */}
            <Chalk x={835} y={500} text="≠" size={120} reveal={prog(f, 1765, 1772)} />
            {/* the log pile of causes */}
            {LOGS.map((l, i) => (
              <ChalkBox key={l} x={930 + (i % 2) * 24} y={210 + i * 66} w={560} h={56} text={l} size={32} reveal={prog(f, b8 + 26 + i * 9, b8 + 44 + i * 9)} />
            ))}
            <Chalk x={1150} y={668} text="WHO WAS MOST TO BLAME?" size={54} reveal={prog(f, b9 + 18, b9 + 60, (t) => t)} />
          </g>
        }
      />
      <Fig k="guide" x={380} y={940} f={f} s={1.45} pose={pose} expr={f < b9 ? 'neutral' : 'curious'} talking={(f >= b8 && f < b.endOf(8)) || (f >= b9 && f < b.endOf(9))} turn={f >= b9 && f < b9 + 50 ? 0.05 : 0.3} dir={1} />
    </Shot>
  );
};

// ---------------------------------------------------------------- S03-08 the historians' debate (split panels)
const CLARK = 2063; // "Others stress…"
const SCALE = 2280; // ≈186 s: the balance tilts, then settles level
const Paper: React.FC<{x0: number; x1: number; color: string}> = ({x0, x1, color}) => (
  <g>
    <rect x={x0} y={-20} width={x1 - x0} height={H + 40} fill={color} />
    {Array.from({length: 12}).map((_, i) => (
      <line key={i} x1={x0} y1={120 + i * 80} x2={x1} y2={120 + i * 80} stroke="#000" strokeWidth={2} opacity={0.04} />
    ))}
  </g>
);
const MiniMap: React.FC<{f: number; x: number; id: string; cam: {lon: number; lat: number; zoom: number}; fischer?: number; clark?: number; caps: string[]; capsO: number}> = ({f, x, id, cam, fischer, clark, caps, capsO}) => (
  <g>
    <rect x={x - 6} y={474} width={532} height={304} rx={8} fill="rgba(0,0,0,0.25)" />
    <Boxed x={x - 12} y={464} w={532} h={304}>
      <rect width={W} height={H} fill="#9DBCC4" />
      <MapEurope1914 f={f} idSuffix={id} cam={cam} base="alliances" debate={{fischer, clark}} capitals={capsO} capitalSet={caps} />
    </Boxed>
    <rect x={x - 12} y={464} width={532} height={304} rx={6} fill="none" stroke={C.ink} strokeWidth={5} />
  </g>
);
const Balance: React.FC<{f: number}> = ({f}) => {
  const o = prog(f, SCALE - 16, SCALE + 6);
  if (o <= 0) return null;
  const t = f - SCALE;
  const ang = t < 0 ? 0 : 9 * Math.sin(Math.min(t, 40) / 40 * Math.PI * 0.5) * Math.exp(-Math.max(0, t - 40) / 30);
  const r = (ang * Math.PI) / 180;
  const pan = (side: 1 | -1) => {
    const px = 960 + side * 130 * Math.cos(r);
    const py = 150 + side * 130 * Math.sin(r);
    return (
      <g key={side}>
        <line x1={px} y1={py} x2={px - 40} y2={py + 70} stroke={C.ink} strokeWidth={3} />
        <line x1={px} y1={py} x2={px + 40} y2={py + 70} stroke={C.ink} strokeWidth={3} />
        <path d={`M${px - 52},${py + 70} Q${px},${py + 102} ${px + 52},${py + 70}Z`} fill="#E3C77A" stroke={C.ink} strokeWidth={4} />
      </g>
    );
  };
  return (
    <g opacity={o}>
      <rect x={780} y={96} width={360} height={190} rx={16} fill="#F4EBD6" stroke={C.ink} strokeWidth={4} />
      <line x1={960} y1={150} x2={960} y2={268} stroke={C.ink} strokeWidth={8} />
      <path d="M915,270 L1005,270 L990,256 L930,256Z" fill={C.ink} />
      <line x1={960 - 130 * Math.cos(r)} y1={150 - 130 * Math.sin(r)} x2={960 + 130 * Math.cos(r)} y2={150 + 130 * Math.sin(r)} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
      <circle cx={960} cy={150} r={9} fill={C.ink} />
      {pan(-1)}
      {pan(1)}
    </g>
  );
};
const DebateShot: React.FC<{f: number}> = ({f}) => {
  const left = (
    <g>
      <Paper x0={0} x1={W / 2} color="#EFE4CB" />
      <BookCard x={215} y={640} title="FISCHER" sub="1961" color="#7A3B2E" slide={prog(f, 1940, 1980)} />
      <text x={215} y={866} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={36} fill={C.ink} opacity={prog(f, 1960, 1990)}>
        Fritz Fischer
      </text>
      <MiniMap f={f} x={400} id="-s0308a" cam={{lon: 14, lat: 49.5, zoom: 1.6}} fischer={prog(f, 1985, 2050)} caps={['Berlin', 'Vienna']} capsO={prog(f, 1975, 1995)} />
      <PanelHead x={470} y={300} o={prog(f, 1946, 1964)} text="MAIN RESPONSIBILITY: GERMANY & AUSTRIA-HUNGARY" maxW={820} />
    </g>
  );
  const right = (
    <g>
      <Paper x0={W / 2} x1={W} color="#E6E0CF" />
      <BookCard x={1705} y={640} title="CLARK" sub="2012" color="#2F4A5E" slide={prog(f, CLARK, CLARK + 40)} rot={4} />
      <text x={1705} y={866} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={36} fill={C.ink} opacity={prog(f, CLARK + 20, CLARK + 50)}>
        Christopher Clark
      </text>
      <MiniMap f={f} x={1010} id="-s0308b" cam={{lon: 15, lat: 49.5, zoom: 1.0}} clark={prog(f, CLARK + 40, 2240, (t) => t)} caps={['London', 'Paris', 'Berlin', 'Vienna', 'St Petersburg', 'Belgrade']} capsO={prog(f, CLARK + 30, CLARK + 50)} />
      <PanelHead x={1450} y={300} o={prog(f, CLARK + 6, CLARK + 24)} text="SHARED RESPONSIBILITY: A TANGLED SYSTEM" maxW={820} />
    </g>
  );
  return (
    <Shot f={f} bg="#EFE4CB" keys={ck([T7, 1.15, 835, 560], [CLARK - 10, 1.15, 835, 560], [CLARK + 40, 1.15, 1085, 560], [2247, 1.15, 1085, 560], [2300, 1.0, 960, 540], [END, 1.02, 960, 540])}>
      <SplitPanels
        id="s0308"
        reveal={1}
        panels={[
          {x0: 0, x1: W / 2, node: left},
          {x0: W / 2, x1: W, node: right},
        ]}
      />
      <Balance f={f} />
    </Shot>
  );
};

export const S03Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: 0, to: T1, el: <StreetShot f={f} />},
      {from: T1, to: RPT, el: <CornerShot f={f} />, trans: 'cut'},
      {from: RPT, to: T2, el: <CrowdBackShot f={f} />, trans: 'cut'},
      {from: T2, to: T3, el: <OfficeShot f={f} />, trans: 'fade'},
      {from: T3, to: T4, el: <UltimatumMap f={f} />, trans: 'fade'},
      {from: T4, to: T5, el: <DeclareMap f={f} />, trans: 'cut'},
      {from: T5, to: T6, el: <LondonShot f={f} />, trans: 'dip'},
      {from: T6, to: T7, el: <TriggerShot f={f} />, trans: 'wipe'},
      {from: T7, to: END, el: <DebateShot f={f} />, trans: 'fade'},
    ]}
  />
);

const sx = (t: number) => Math.round((t - 110) * 30);
export const S03Overlay: React.FC = () => {
  useCurrentFrame();
  return (
    <g>
      <DateCard at={sx(113.2)} until={sx(119.8)} date="28 JUNE 1914" title="SARAJEVO, BOSNIA" />
      <FactPill at={RPT + 2} until={sx(130.2)} text="THE ARCHDUKE AND SOPHIE WERE KILLED" x={1860} y={400} anchor="end" size={40} maxW={760} />
      <TermCard at={sx(131.1)} until={sx(136.7)} term={'"BLANK CHEQUE"'} meaning="Germany's promise of full backing" />
      <DateCard at={sx(137.4)} until={sx(142.7)} date="23 JULY 1914" title="ULTIMATUM TO SERBIA" />
      <FactPill at={sx(143.9)} until={T4 - 4} text="25 JULY: SERBIA ACCEPTS MOST TERMS — NOT ALL" x={1860} y={430} anchor="end" size={38} maxW={720} />
      <DateCard at={sx(156.2)} until={T5 - 8} date="4 AUGUST 1914" title="BELGIUM INVADED" />
      <FactPill at={sx(161.0)} until={sx(167.1)} text="11 P.M. LONDON TIME" sub="midnight in Berlin" x={W / 2} y={300} anchor="middle" size={44} />
      <FactPill at={sx(175.3)} until={CLARK - 8} text="A DEBATE" x={W - 70} y={120} anchor="end" size={44} />
    </g>
  );
};

void easeIn;
void easeInOut;
