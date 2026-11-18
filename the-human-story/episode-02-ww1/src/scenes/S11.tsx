// s11 — Chapter 10: The Cost and the Legacy (620–720 s, 3,000 frames). Storyboard S11-01 … S11-09 (ep02, editor B).
// War cemetery (pull back) · refugees on a ruined road → crane into a grey globe (flu) · M-01 → M-05 new states ·
// St Symphorien: Parr and Ellison face each other · remembrance at a town memorial (poppies, Binyon) ·
// Hall of Mirrors · MapVersailles → Berlin street (whip) · history room: 1919 → 20 YEARS → 1939 · end card.
// Sombre throughout: slow camera, wind, leaves and petals only; estimates labelled as estimates.
import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack, Camera} from '../components/Camera';
import {Sky, Ground, Clouds, Birds, Building, Rubble, Street, HistoryRoom, Chalk, Tree, Document} from '../components/Environment';
import {Particles, Smoke, Candle} from '../components/Effects';
import {Newspaper} from '../components/Vehicles';
import {Cemetery, HallOfMirrors} from '../components/env/Places';
import {PoppyWreath, PoppyPetals, TownWarMemorial} from '../components/env/Remembrance';
import {Globe} from '../maps/GeoMap';
import {MapEurope1919, CAM_1919} from '../maps/MapsWW1';
import {MapVersailles} from '../maps/EpisodeMaps';
import {walk, stand, seated, signDocument, point, talkGesture, holdFront, addPose, mixPose, headBowed, helmetToChest, hatOff, standStiff} from '../characters/poses';
import {Pen} from '../characters/props';
import {Crowd} from '../characters/Crowd';
import {CAST, castWith} from '../characters/cast';
import {StickFigure, GroupTag} from '../characters/StickFigure';
import {DateCard, FactPill, ListPill} from '../components/Text';
import {prog, clamp, lerp, easeInOut, easeOut} from '../animations/core';
import {sec, Fig, Shot, ck, ChalkPath, HandCart, Bench, fio} from './kit';
import {OLabel, Headstone, WhipPan, QuoteCard, ListLabel, EndCardWW1} from './kit-b';

const {b, cut, abs} = sec('s11');
const END = b.dur; // 3000
const ENDC = b.endOf(13) + 6; // end card (≈714.2 s, after the last word)
const T = [0, cut(2), cut(4), cut(5), cut(6), cut(10), cut(11), cut(12), ENDC, END];
const ink = C.ink;

// ------------------------------------------------------------ S11-01 war cemetery, overcast: a single visitor; pull back high and wide
const Graves: React.FC<{f: number}> = ({f}) => {
  const stop = 150;
  const x = f < stop ? 980 + f * 0.6 : 980 + stop * 0.6;
  return (
    <Shot f={f} bg="#B8BCC0" keys={ck([0, 1.35, 1060, 640], [b.at(1), 1.3, 1060, 630], [T[1], 1.0, 960, 520])} sombre={0.3} drift={0.6}>
      <Cemetery f={f} dusk={0.3} />
      <rect x={-200} y={-200} width={W + 400} height={760} fill="#A8AEB6" opacity={0.45} />
      <Clouds f={f} n={6} seed={101} speed={0.25} yMin={60} yMax={420} color="#C8CCD0" />
      <Birds f={f * 0.6} n={3} seed={6} y={240} />
      <Fig k="woman3" x={x} y={700} f={f} s={0.42} dir={1} pose={f < stop ? walk(f / 30, 0.4) : headBowed(stand(f, 2), prog(f, stop, stop + 40))} expr="solemn" />
      {/* wind in the grass */}
      {Array.from({length: 60}).map((_, i) => {
        const gx = -150 + i * 38;
        const gy = 1000 + (i % 5) * 18;
        const sw = Math.sin(f / 22 + i * 0.7) * 10;
        return <path key={i} d={`M${gx},${gy} q${4 + sw * 0.3},-30 ${sw},-60`} stroke="#5E6E4A" strokeWidth={4} fill="none" strokeLinecap="round" />;
      })}
    </Shot>
  );
};

// ------------------------------------------------------------ S11-02 refugees on a ruined road → crane up into a grey globe
const FLU: [number, number][] = [
  [-75, 42], [-100, 35], [-58, -22], [-46, -10], [-70, 5], [2, 48], [13, 52], [37, 55], [-3, 40], [12, 42], [28, 44], [31, 30], [8, 9],
  [36, -1], [18, -26], [-15, 14], [45, 25], [78, 22], [88, 24], [72, 30], [104, 35], [116, 40], [127, 37], [139, 36], [106, 12], [120, 15],
  [151, -33], [174, -41], [-150, 61], [-170, -14], [100, 0], [-90, 15],
];
const Refugees: React.FC<{f: number}> = ({f}) => {
  const t = f - T[1];
  const m0 = b.at(3) - 10;
  const rise = prog(f, m0, m0 + 45, easeInOut);
  const globe = prog(f, m0 + 15, m0 + 45, easeInOut);
  const walkP = t * 0.9;
  return (
    <Shot f={f} bg="#8C9096" drift={0.6} sombre={0.3}>
      {globe < 1 && (
        <g transform={`translate(0,${rise * 900})`} opacity={1 - globe * 0.9}>
          <Camera f={f} keys={[[T[1], 1.08, 900, 560], [m0, 1.12, 1100, 540]]} drift={0.6}>
            <Sky top="#7A8088" bottom="#C8C2B6" />
            <rect x={-200} y={-1300} width={W + 400} height={1500} fill="#7A8088" />
            {[[-120, 360, 420], [260, 300, 360], [1340, 340, 460], [1700, 320, 400]].map(([x, w, h], i) => (
              <Building key={i} x={x} base={740} w={w} h={h} color={['#A49A88', '#9A9080', '#ABA090', '#948A7C'][i]} damaged={1} seed={i + 41} f={f} />
            ))}
            <Ground y={740} color="#8A8070" />
            <path d="M780,740 L1120,740 L1600,1200 L320,1200Z" fill="#A89C86" stroke={ink} strokeWidth={4} />
            <Rubble x={420} y={820} w={300} seed={3} />
            <Rubble x={1480} y={830} w={340} seed={7} />
            <Smoke x={300} y={600} f={f} n={5} size={30} rise={200} drift={60} color="#9A9A96" opacity={0.35} outline={false} />
            <Smoke x={1600} y={560} f={f} n={5} size={30} rise={200} drift={60} color="#9A9A96" opacity={0.3} outline={false} seed={4} />
            {/* the family walks slowly away up the road, pushing a hand cart */}
            {(() => {
              const k = clamp(walkP / 700);
              const s = lerp(0.62, 0.42, k);
              const bx = lerp(820, 1080, k);
              const by = lerp(880, 790, k);
              return (
                <g>
                  <HandCart x={bx + 150 * s} y={by} dist={walkP * 2} s={s} load="#9A8A6A" />
                  <Fig k="man1" x={bx} y={by + 6} f={f} s={s} pose={addPose(walk(walkP / 20, 0.4), {shR: 60, elR: 20, lean: 10})} expr="tired" />
                  <Fig k="woman2" x={bx - 120 * s} y={by + 16} f={f + 7} s={s} pose={addPose(walk(walkP / 20 + 0.5, 0.4), {shL: 40, elL: 10})} expr="sad" />
                  <Fig k="kid1" x={bx - 210 * s} y={by + 22} f={f + 3} s={s} pose={addPose(walk(walkP / 14, 0.5), {shR: 70, elR: 5})} expr="sad" />
                </g>
              );
            })()}
          </Camera>
        </g>
      )}
      {globe > 0 && (
        <g opacity={globe}>
          <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#5A6070" />
          <g transform={`translate(0,${(1 - globe) * 300})`}>
            <Globe f={f} lon={lerp(-30, 40, prog(f, m0, T[2]))} lat={22} r={420} cy={560} landColor="#B8B2A4" seaColor="#8C9AA4">
              {({proj}) => (
                <g>
                  {FLU.map((ll, i) => {
                    const p = proj(ll);
                    if (!p) return null;
                    const g = prog(f, m0 + 40 + ((i * 37) % 120), m0 + 160 + ((i * 37) % 120));
                    if (g <= 0) return null;
                    return (
                      <g key={i}>
                        <circle cx={p[0]} cy={p[1]} r={8 + g * 34} fill="#6A6A6E" opacity={0.28 * g} />
                        <circle cx={p[0]} cy={p[1]} r={7} fill="#4A4A4E" stroke={ink} strokeWidth={2} opacity={g} />
                      </g>
                    );
                  })}
                </g>
              )}
            </Globe>
          </g>
        </g>
      )}
    </Shot>
  );
};

// ------------------------------------------------------------ S11-03 M-01 → M-05: four empires collapse, new states appear
const NewStates: React.FC<{f: number}> = ({f}) => {
  const t = f - T[2];
  const e0 = abs(644.6);
  const s0 = abs(647.8);
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapEurope1919 f={f} cam={{lon: lerp(17, 19, prog(t, 0, T[3] - T[2])), lat: lerp(51, 50, prog(t, 0, T[3] - T[2])), zoom: lerp(1.0, 1.2, prog(t, 0, T[3] - T[2], easeInOut))}} idSuffix="-s11"
        empires={clamp((f - e0) / 32, 0, 4)} states={clamp((f - s0) / 15, 0, 9)} disputed={prog(f, abs(651.0), abs(652.0))} note={prog(f, abs(649.0), abs(649.6))} />
    </Shot>
  );
};

// ------------------------------------------------------------ S11-04 St Symphorien: two headstones face each other across a path
const Symphorien: React.FC<{f: number}> = ({f}) => {
  const pan = abs(660.1);
  const crane = abs(665.6);
  const PX = 520;
  const EX = 1460;
  return (
    <Shot f={f} bg="#9AAA88" keys={ck([T[3], 1.55, PX + 300, 560], [pan, 1.55, PX + 330, 560], [pan + 60, 1.55, EX + 300, 560], [crane, 1.55, EX + 320, 560], [crane + 70, 1.0, 990, 520], [T[4], 1.0, 980, 510])} sombre={0.3} drift={0.6}>
      <Sky top="#9AAAB4" bottom="#E2DCCA" />
      {[-60, 260, 980, 1700, 2000].map((x, i) => <Tree key={i} x={x} y={600} s={2.2 + (i % 2) * 0.4} color={i % 2 ? '#5E7A44' : '#6A8A4E'} f={f} seed={i + 30} />)}
      <Ground y={600} color="#7E9A5E" />
      {/* the short path between them */}
      <path d="M900,600 L1080,600 L1260,1200 L720,1200Z" fill="#CFC6AE" stroke={ink} strokeWidth={4} />
      {/* dappled light */}
      {Array.from({length: 14}).map((_, i) => (
        <ellipse key={i} cx={(i * 211) % 2000} cy={640 + ((i * 97) % 380)} rx={70} ry={20} fill="#FFF6D8" opacity={0.12 + 0.08 * Math.sin(f / 30 + i)} />
      ))}
      {/* each stone turned slightly towards the other */}
      <g transform={`translate(${PX},860) skewY(-6) translate(${-PX},-860)`}>
        <Headstone x={PX} y={860} s={1} lines={['J. PARR', '21 AUGUST 1914']} />
      </g>
      <g transform={`translate(${EX},860) skewY(6) translate(${-EX},-860)`}>
        <Headstone x={EX} y={860} s={1} lines={['G. E. ELLISON', '11 NOVEMBER 1918']} />
      </g>
      {/* falling leaves */}
      {Array.from({length: 16}).map((_, i) => {
        const y = ((f * (0.7 + (i % 3) * 0.25) + i * 113) % 1000) + 40;
        const x = ((i * 173 + Math.sin(f / 30 + i) * 70 + f * 0.5) % 2300) - 150;
        return <ellipse key={i} cx={x} cy={y} rx={10} ry={5} fill={i % 2 ? '#B8863A' : '#9A6A2E'} stroke={ink} strokeWidth={1.5} transform={`rotate(${f * 2.4 + i * 50},${x},${y})`} />;
      })}
    </Shot>
  );
};

// ------------------------------------------------------------ S11-05 remembrance at a town war memorial (11:00), poppies, Binyon
const POOL = ['man1', 'man2', 'woman1', 'woman2', 'woman3', 'worker', 'workerW', 'kid2', 'politician2'];
const Remembrance: React.FC<{f: number}> = ({f}) => {
  const t = f - T[4];
  const crane = abs(674.5);
  const lift = prog(f, crane, crane + 150, easeInOut);
  const hat = prog(t, 40, 100);
  const MX = 1420;
  return (
    <Shot f={f} bg="#A8ACB0" keys={ck([T[4], 1.1, 760, 600], [crane, 1.16, 820, 600], [crane + 160, 1.3, MX - 60, 560], [T[5], 1.34, MX - 40, 540])} sombre={0.3} drift={0.6}
      over={<PoppyPetals f={f} n={18} lift={lift} wind={0.6} opacity={0.4 + 0.6 * lift} />}>
      <Sky top="#8E969E" bottom="#D8D6CE" />
      <Clouds f={f} n={5} seed={111} speed={0.25} yMin={40} yMax={260} color="#C2C6CA" />
      {/* church tower with the clock at 11:00 */}
      <g>
        <rect x={360} y={150} width={180} height={560} fill="#A8A090" stroke={ink} strokeWidth={5} />
        <path d="M340,150 L450,30 L560,150Z" fill="#6A6A6E" stroke={ink} strokeWidth={5} />
        <circle cx={450} cy={260} r={60} fill="#F4F0E4" stroke={ink} strokeWidth={5} />
        <line x1={450} y1={260} x2={450} y2={212} stroke={ink} strokeWidth={6} />
        <line x1={450} y1={260} x2={426} y2={226} stroke={ink} strokeWidth={8} />
      </g>
      {[[-200, 380, 360, '#B8AA94'], [640, 260, 300, '#A89A86'], [1840, 360, 380, '#B0A28E']].map(([x, w, h, c], i) => (
        <Building key={i} x={x as number} base={720} w={w as number} h={h as number} color={c as string} seed={i + 61} f={f} />
      ))}
      <Ground y={720} color="#9A9A90" />
      <TownWarMemorial x={MX} y={860} s={0.62} />
      <PoppyWreath x={MX - 110} y={862} s={0.42} tilt={-6} />
      <PoppyWreath x={MX + 110} y={866} s={0.42} tilt={5} />
      <PoppyWreath x={MX} y={830} s={0.36} />
      <Candle x={MX - 220} y={866} f={f} s={0.9} seed={2} />
      <Candle x={MX + 220} y={868} f={f} s={0.9} seed={5} />
      {/* the crowd stands in silence, facing the memorial */}
      <Crowd f={f} count={34} x0={-40} x1={1100} yBack={760} yFront={900} scaleBack={0.4} scaleFront={0.62} pool={POOL} sombre facing={1} expression="solemn" seed={21} />
      {/* an old man takes off his hat; a child holds her mother's hand */}
      <Fig k="man1" x={980} y={970} f={f} s={0.78} dir={1} pose={headBowed(helmetToChest(f, hat), 0.5)} hatInHand={hatOff(hat) ? {} : undefined} expr="solemn" eyesClosed />
      <Fig k="woman1" x={760} y={985} f={f + 5} s={0.78} dir={1} pose={headBowed(addPose(standStiff(f, 1), {shL: 20, elL: 5}), 0.6)} expr="solemn" outfit={{...CAST.woman1.outfit, color: '#4A4A58'}} />
      <Fig k="kid2" x={690} y={992} f={f + 9} s={0.78} dir={1} pose={addPose(standStiff(f, 2), {shR: 40, elR: 10})} expr="solemn" />
    </Shot>
  );
};

// ------------------------------------------------------------ S11-06 the Hall of Mirrors: the German delegates sign
const Versailles: React.FC<{f: number}> = ({f}) => {
  const t = f - T[5];
  const seats: [number, number, number, 1 | -1][] = [
    [745, 805, 0.5, 1], [690, 845, 0.58, 1], [610, 905, 0.68, 1], [500, 985, 0.8, 1],
    [1175, 805, 0.5, -1], [1230, 845, 0.58, -1], [1310, 905, 0.68, -1], [1420, 985, 0.8, -1],
  ];
  const keys = ['politician', 'politician2', 'man2', 'politician', 'politician2', 'politician', 'man2', 'politician2'];
  const delegate = castWith('politician', {expression: 'worried'}, {color: '#6E6F72'});
  const delegate2 = castWith('man2', {expression: 'solemn'}, {color: '#4E5052'});
  const signer = (k: number) => {
    const st = 30 + k * 95;
    const step = prog(t, st - 50, st);
    const sg = signDocument(t, {start: st});
    const done = t > st + 70;
    return {step, sg, done, st};
  };
  const signed = prog(t, 40, 230);
  return (
    <Shot f={f} bg="#C9A35A" keys={ck([T[5], 1.0, 960, 540], [T[6], 1.2, 960, 650])}>
      <HallOfMirrors f={f} />
      {seats.map(([x, y, s, d], i) => (
        <Fig key={i} k={keys[i]} x={x - d * 30} y={y} f={f} s={s} dir={d} pose={seated(f, i)} expr={i % 3 === 0 ? 'neutral' : 'solemn'} turn={0.4} look={[d * 0.6, 0]} />
      ))}
      <g transform="translate(960,842) scale(0.6,0.32)">
        <Document x={-75} y={-95} w={150} h={190} title="TREATY OF VERSAILLES" sign={signed} />
      </g>
      {[0, 1].map((k) => {
        const s = signer(k);
        const head = k ? delegate2 : delegate;
        const x = s.done ? lerp(1010, 1150, prog(t, s.st + 70, s.st + 130)) : lerp(1120 + k * 140, 1010, s.step);
        const pose = s.done ? walk(t / 20, prog(t, s.st + 70, s.st + 80) * (1 - prog(t, s.st + 120, s.st + 130))) : s.step <= 0 ? stand(f, k) : s.step < 1 ? walk(t / 20, 0.8) : s.sg.pose;
        if (k === 1 && t < 30) return null;
        return <StickFigure key={k} x={x} y={790} f={f + k * 9} scale={0.62} dir={s.done ? 1 : -1} head={head.head} outfit={head.outfit} pose={pose} overlayFront={!s.done && s.step >= 1 ? (sk) => <Pen x={sk.armR.hx} y={sk.armR.hy} /> : undefined} />;
      })}
    </Shot>
  );
};

// ------------------------------------------------------------ S11-07 MapVersailles → whip to a Berlin street
const WHIP = abs(700.4);
const Resentment: React.FC<{f: number}> = ({f}) => {
  const t = f - T[6];
  const vet = castWith('germanSoldier1916', {hat: 'flatCap', hatColor: '#5A5A50', expression: 'sad'}, {color: '#6E6E5E'});
  const street = (
    <Camera f={f} keys={[[WHIP, 1.08, 900, 560], [T[7], 1.0, 1060, 540]]}>
      <Sky top="#8E969E" bottom="#D2D0C8" />
      <Street base={760} seed={7} f={f} palette={['#A89A86', '#9A8C78', '#B0A08A', '#948876']} />
      <Ground y={760} color="#8E8A82" />
      <rect x={-200} y={760} width={2400} height={30} fill="#A8A49A" stroke={ink} strokeWidth={3} />
      <Bench x={640} y={900} w={300} />
      {[0, 1].map((i) => (
        <Fig key={i} k={i ? 'man2' : 'man1'} x={560 + i * 160} y={900} f={f + i * 7} s={0.85} dir={i ? -1 : 1} pose={addPose(seated(f, i), {shL: 60, elL: 50, shR: 60, elR: 50, headTilt: Math.sin(f / 9 + i) * 8})} expr="sad"
          overlayFront={i === 0 ? (sk) => <g transform={`translate(${(sk.armL.hx + sk.armR.hx) / 2 + 40},${(sk.armL.hy + sk.armR.hy) / 2 - 20})`}><Newspaper w={110} h={130} masthead="BERLINER ZEITUNG" headline="PEACE TERMS" /></g> : undefined} />
      ))}
      <StickFigure x={1120 - (f - WHIP) * 1.0} y={850} f={f} scale={0.78} dir={-1} head={vet.head} outfit={vet.outfit} pose={headBowed(walk((f - WHIP) / 22, 0.4), 1)} />
      <Particles f={f} kind="dust" n={14} seed={71} wind={-0.6} opacity={0.3} />
    </Camera>
  );
  return (
    <Shot f={f} bg="#9DBCC4" drift={0}>
      <WhipPan f={f} p={prog(f, WHIP, WHIP + 18)} a={<Camera f={f} keys={[[T[6], 1.0, 960, 540], [WHIP, 1.06, 900, 520]]}><MapVersailles f={t} cues={{start: 6, stagger: 16, globe: 120, colonies: 140}} /></Camera>} b={street} />
    </Shot>
  );
};

// ------------------------------------------------------------ S11-08 history room: 1919 → 20 YEARS → 1939; the Guide's book
const Bridge: React.FC<{f: number}> = ({f}) => {
  const t = f - T[7];
  const push = abs(708.0);
  const book = b.at(13);
  const lift = prog(f, book - 6, book + 14);
  const shadow = prog(f, abs(707.0), abs(711.0), easeInOut);
  const tap = Math.max(0, Math.sin((f - book - 14) / 4)) * prog(f, book + 14, book + 20) * (1 - prog(f, book + 44, book + 50));
  const nod = prog(f, book + 46, book + 54) * (1 - prog(f, book + 54, book + 62));
  const writing = f < abs(708.4);
  const gPose = lift > 0 ? addPose(holdFront(f, 1), {shR: 60 + tap * 25, elR: 60, headTilt: nod * 12}) : writing ? mixPose(talkGesture(f, 2), point(f, 125), 0.6 + 0.4 * Math.sin(f / 9)) : point(f, 110);
  return (
    <Shot f={f} bg={C.wallYellow} keys={ck([T[7], 1.0, 960, 540], [push, 1.0, 980, 540], [push + 60, 1.28, 1420, 430], [book - 10, 1.3, 1430, 430], [book + 20, 1.12, 620, 560], [T[8], 1.12, 620, 560])}>
      <HistoryRoom
        f={f}
        board={
          <g>
            <Chalk x={760} y={440} text="1919" size={120} reveal={prog(t, 8, 40)} />
            <ChalkPath d="M940,400 L1310,400 M1270,370 L1312,400 L1270,430" reveal={prog(t, 45, 90)} w={8} />
            <Chalk x={1125} y={350} text="20 YEARS" size={58} reveal={prog(t, 70, 100)} />
            <Chalk x={1470} y={440} text="1939" size={120} reveal={prog(t, 105, 135)} />
            <ChalkPath d="M1360,470 L1590,470" reveal={prog(f, abs(709.0), abs(709.6))} w={9} />
          </g>
        }
      />
      {/* a long shadow slides across the board */}
      <defs>
        <clipPath id="s11board">
          <rect x={520} y={130} width={1240} height={564} />
        </clipPath>
      </defs>
      <g clipPath="url(#s11board)">
        <path d={`M${lerp(-300, 900, shadow)},130 L${lerp(500, 1700, shadow)},130 L${lerp(800, 2000, shadow)},700 L${lerp(0, 1200, shadow)},700Z`} fill="#0E0E14" opacity={0.28 * Math.min(1, shadow * 4)} />
      </g>
      {/* the desk with the book */}
      <rect x={60} y={720} width={340} height={24} fill={C.brown} stroke={ink} strokeWidth={4} />
      <rect x={80} y={744} width={20} height={120} fill={ink} />
      <rect x={360} y={744} width={20} height={120} fill={ink} />
      {lift <= 0 && <rect x={180} y={690} width={150} height={30} fill="#5A2A26" stroke={ink} strokeWidth={3} />}
      <Fig k="guide" x={420} y={900} f={f} s={1.5} pose={gPose} expr={lift > 0 ? 'solemn' : 'neutral'} talking={(f > b.at(12) && f < b.endOf(12)) || (f > b.at(13) && f < b.endOf(13))} turn={lift > 0 ? 0 : 0.35}
        overlayFront={lift > 0 ? (sk) => (
          <g transform={`translate(${(sk.armL.hx + sk.armR.hx) / 2},${(sk.armL.hy + sk.armR.hy) / 2 - 70 * lift}) rotate(-4)`}>
            <rect x={-110} y={-140} width={220} height={280} rx={8} fill="#5A2A26" stroke={ink} strokeWidth={5} />
            <rect x={-96} y={-126} width={192} height={252} rx={4} fill="none" stroke="#D9B44A" strokeWidth={3} />
            <text x={0} y={-30} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={40} fill="#F4EBD6">WORLD</text>
            <text x={0} y={20} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={40} fill="#F4EBD6">WAR II</text>
          </g>
        ) : undefined} />
    </Shot>
  );
};

// ------------------------------------------------------------ S11-09 end card (deep navy, slow push; ep01 still in the WATCH NEXT frame)
const End: React.FC<{f: number}> = ({f}) => {
  const t = f - T[8];
  const k = prog(t, 28, 52, easeOut);
  return (
    <Shot f={f} bg={C.deepNavy} keys={ck([T[8], 1.0, 960, 540], [END, 1.02, 960, 540])} vignette={0.3}>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={C.deepNavy} />
      {Array.from({length: 40}).map((_, i) => (
        <circle key={i} cx={(i * 263 + f * 0.3) % 2000} cy={(i * 137) % 1080} r={2 + (i % 3)} fill="#F4EBD6" opacity={0.12 + 0.1 * Math.sin(f / 20 + i)} />
      ))}
      <g opacity={k}>
        <foreignObject x={W / 2 - 310} y={560 - 90 + (1 - k) * 30} width={620} height={332}>
          <Img src={staticFile('endcard/ep01-thumb.jpg')} style={{width: 620, height: 332, objectFit: 'cover', borderRadius: 8}} />
        </foreignObject>
      </g>
    </Shot>
  );
};

export const S11Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: T[0], to: T[1], el: <Graves f={f} />},
      {from: T[1], to: T[2], el: <Refugees f={f} />, trans: 'fade'},
      {from: T[2], to: T[3], el: <NewStates f={f} />, trans: 'fade'},
      {from: T[3], to: T[4], el: <Symphorien f={f} />, trans: 'dip'},
      {from: T[4], to: T[5], el: <Remembrance f={f} />, trans: 'cut'},
      {from: T[5], to: T[6], el: <Versailles f={f} />, trans: 'fade'},
      {from: T[6], to: T[7], el: <Resentment f={f} />, trans: 'cut'},
      {from: T[7], to: T[8], el: <Bridge f={f} />, trans: 'wipe'},
      {from: T[8], to: T[9], el: <End f={f} />, trans: 'fade'},
    ]}
  />
);

const GTag: React.FC<{at: number; until: number; x: number; y: number; text: string}> = ({at, until, x, y, text}) => {
  const f = useCurrentFrame();
  const o = fio(f, at, until);
  return o <= 0 ? null : <GroupTag x={x} y={y} text={text} opacity={o} pointer={false} scale={1.3} />;
};

export const S11Overlay: React.FC = () => (
  <g>
    <OLabel at={abs(624.4)} until={T[1] - 6} text={'AROUND 9–10 MILLION SERVICEMEN DIED (EST.)\nABOUT 21 MILLION WOUNDED (EST.)'} x={W / 2} y={300} size={40} />
    <FactPill at={abs(631.2)} until={abs(635.4)} text="MILLIONS OF CIVILIANS DIED (EST. 6–13 MILLION)" x={1860} y={340} anchor="end" maxW={780} />
    <FactPill at={abs(636.4)} until={T[2] - 6} text="1918–19 FLU: AT LEAST 50 MILLION DEAD WORLDWIDE (EST.)" x={1860} y={340} anchor="end" maxW={780} />
    <FactPill at={abs(654.2)} until={abs(659.1)} text="FIRST BRITISH SOLDIER KILLED (BELIEVED)" x={1860} y={340} anchor="end" maxW={760} />
    <FactPill at={abs(660.6)} until={abs(665.4)} text="LAST BRITISH SOLDIER KILLED (BELIEVED)" x={1860} y={340} anchor="end" maxW={760} />
    <OLabel at={abs(664.8)} until={T[4] - 4} text="ST SYMPHORIEN, NEAR MONS" x={W / 2} y={770} size={40} />
    <QuoteCard
      at={abs(677.8)}
      until={T[5] - 4}
      y={330}
      size={46}
      lines={[
        {text: '"They shall grow not old, as we that are left grow old,', at: abs(677.8)},
        {text: 'Age shall not weary them, nor the years condemn."', at: abs(681.5)},
      ]}
      credit={'Laurence Binyon, "For the Fallen", 1914'}
      creditAt={abs(682.4)}
    />
    <DateCard at={abs(686.2)} until={T[6] - 4} date="28 JUNE 1919" title="TREATY OF VERSAILLES" sub="five years to the day after Sarajevo" />
    <GTag at={abs(686.4)} until={abs(689.6)} x={600} y={590} text="ALLIED DELEGATES" />
    <GTag at={abs(689.8)} until={abs(693.0)} x={1180} y={500} text="GERMAN DELEGATION" />
    <ListLabel at={abs(694.7)} until={T[7] - 4} lines={['LAND AND ALL COLONIES LOST', '"WAR GUILT" CLAUSE', 'REPARATIONS', 'ARMY STRICTLY LIMITED']} x={1860} y={590} stagger={45} size={36} />
    <EndCardWW1 at={T[8] + 8} />
  </g>
);
