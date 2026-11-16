// s10 — Chapter 9: How World War II Finally Ended (510-570 s). Storyboard S10-01 … S10-10.
// Hiroshima/Nagasaki: no people, no mushroom cloud, no explosion graphics; flash on frame 15992 (local 692),
// Nagasaki glow on frame 16485 (local 1185) to match the mix's silence windows.
import React from 'react';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack} from '../components/Camera';
import {Sky, Ground, Hills, Clouds, Sea, Interior, Table, Radio, Document, HistoryRoom, Chalk, Flag} from '../components/Environment';
import {Smoke, Particles, ScreenFlash} from '../components/Effects';
import {Plane, Ship} from '../components/Vehicles';
import {Hiroshima, Nagasaki, MissouriDeck} from '../components/env/Places';
import {MapIslandHopping, MapEastAsia} from '../maps/EpisodeMaps';
import {walk, stand, standStiff, seated, signDocument, crouchRun, kneelSit, headBowed, talkGesture, point, mixPose} from '../characters/poses';
import {Pen} from '../characters/props';
import {GroupTag} from '../characters/StickFigure';
import {DateCard, FactPill, TermCard} from '../components/Text';
import {prog, clamp, lerp} from '../animations/core';
import {sec, Fig, Shot, ck, ChalkPath} from './kit';

const {b, cut} = sec('s10');
const FLASH = 15992 - 15300; // 692
const GLOW = 16485 - 15300; // 1185
const T = [0, cut(1), cut(2), cut(3), FLASH, cut(5), cut(6), cut(7), 1373, cut(8), 1800];

// ------------------------------------------------------------ S10-01 island hopping
const Islands: React.FC<{f: number}> = ({f}) => (
  <Shot f={f} bg="#9DBCC4">
    <MapIslandHopping f={f + 30} cues={{route: 40, dur: 160}} />
  </Shot>
);

// ------------------------------------------------------------ S10-02 Okinawa in the rain
const Okinawa: React.FC<{f: number}> = ({f}) => {
  const t = f - T[1];
  return (
    <Shot f={f} bg="#7E868A" keys={ck([T[1], 1.05, 1100, 560], [T[2], 1.05, 820, 580])}>
      <Sky top="#5E666C" bottom="#9AA0A0" />
      <Sea y={560} f={f} colors={['#5E6E74', '#4E5E64']} amp={4} layers={2} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <Ship x={1300 + i * 280} y={560} f={f} s={0.2} kind="warship" seed={i} smoke={false} />
          {Math.sin(f / 9 + i * 2) > 0.93 && <circle cx={1300 + i * 280 + 40} cy={540} r={14} fill="#FFD27A" />}
        </g>
      ))}
      <path d="M-200,640 Q400,560 900,620 T2200,600 L2200,1300 L-200,1300 Z" fill="#6E6450" stroke={C.ink} strokeWidth={5} />
      <path d="M200,760 Q900,700 1700,740" stroke="#8A7A5E" strokeWidth={40} fill="none" />
      {[0, 1, 2].map((i) => (
        <Fig key={'c' + i} k={['japaneseWoman', 'japaneseMan', 'japaneseChild'][i]} x={1300 + i * 70 + t * 0.8} y={735} f={f} s={0.4} pose={walk(t / 30 + i, 0.6)} expr="sad" opacity={0.75} limbColor="#3A3A36" />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Fig key={i} k="usMarine" x={-100 + i * 200 + t * 2.5} y={940 + (i % 2) * 20} f={f} pose={crouchRun(t / 10 + i)} expr="determined" />
      ))}
      <Smoke x={700} y={620} f={f} n={6} size={60} rise={260} drift={-80} color="#4A4A4A" opacity={0.5} seed={7} />
      <g opacity={0.8}>
        <Particles f={f} kind="rain" n={110} seed={6} wind={-0.4} />
      </g>
    </Shot>
  );
};

// ------------------------------------------------------------ S10-03 Tokyo: the terms refused
const Cabinet: React.FC<{f: number}> = ({f}) => {
  const t = f - T[2];
  return (
    <Shot f={f} bg="#9A8E7A" keys={ck([T[2], 1.0, 960, 560], [T[3], 1.06, 960, 600])}>
      <Interior wall="#B8AA90" floor="#7A6A52" floorY={800} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={200 + i * 420} y={180} width={320} height={400} fill="#D8CCB0" stroke={C.ink} strokeWidth={4} />)}
      <Table x={560} y={790} w={800} cloth="#5A4A3A" h={100} />
      {['japaneseOfficer', 'japaneseDelegate', 'japaneseDelegate2', 'japaneseOfficer'].map((k, i) => (
        <Fig key={i} k={k} x={600 + i * 240} y={900} f={f} pose={seated(f, i)} expr="solemn" />
      ))}
      <GroupTag x={960} y={520} text="JAPAN'S LEADERS" />
      <g transform={`translate(${lerp(1000, 760, prog(t, 20, 60))},780) scale(0.5,0.3)`}>
        <Document x={-110} y={-140} title="ALLIED SURRENDER TERMS" lines={6} />
      </g>
      <g transform="translate(1380,250)">
        <rect x={-190} y={-40} width={380} height={130} rx={8} fill="#F4EBD6" stroke={C.ink} strokeWidth={4} opacity={prog(t, 5, 15)} />
        <text x={0} y={0} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={28} fill={C.ink} opacity={prog(t, 5, 15)}>ALLIED SURRENDER TERMS</text>
        <text x={0} y={46} textAnchor="middle" fontFamily={FONT.sans} fontWeight={700} fontSize={26} fill={C.darkRed} opacity={prog(t, 5, 15)}>POTSDAM · 26 JULY 1945</text>
      </g>
    </Shot>
  );
};

// ------------------------------------------------------------ S10-04 Hiroshima, morning → flash
const HiroBefore: React.FC<{f: number}> = ({f}) => {
  const t = f - T[3];
  const px = lerp(-200, 1500, prog(t, 0, FLASH - T[3]));
  return (
    <Shot f={f} bg="#A6C8D8" keys={ck([T[3], 1.0, 960, 560], [FLASH, 1.06, 960, 540])}>
      <Hiroshima f={f} state="before" />
      <path d={`M-200,120 L${px - 40},${120 + (px + 200) * 0.02}`} stroke="#FFFFFF" strokeWidth={6} opacity={0.75} />
      <Plane x={px} y={120 + (px + 200) * 0.02} f={f} kind="heavy" s={0.12} />
      <ScreenFlash f={f} at={FLASH - 2} dur={30} hold={40} />
    </Shot>
  );
};

// ------------------------------------------------------------ S10-05 aftermath (no people)
const HiroAfter: React.FC<{f: number}> = ({f}) => {
  const t = f - FLASH;
  const white = 1 - prog(t, 0, 90);
  return (
    <Shot f={f} bg="#8E8C88" keys={ck([FLASH, 1.03, 960, 540], [T[5], 1.0, 960, 540])} drift={0.6} sombre={0.5}>
      <Hiroshima f={f * 0.4} state="after" />
      <Smoke x={960} y={600} f={f} n={8} size={160} rise={200} drift={60} color="#9A9894" opacity={0.3} outline={false} seed={9} />
      <Particles f={f} kind="ash" n={50} seed={8} opacity={0.7} />
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#FFFFFF" opacity={white} />
    </Shot>
  );
};

// ------------------------------------------------------------ S10-06 the Soviet invasion of Manchuria
const Manchuria: React.FC<{f: number}> = ({f}) => {
  const t = f - T[5];
  const cam = {lon: lerp(126, 124, prog(t, 0, 220)), lat: lerp(45, 42, prog(t, 0, 220)), zoom: lerp(1.5, 1.15, prog(t, 0, 220))};
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapEastAsia f={t} cam={cam} cues={{soviet45: 989 - T[5]}} />
    </Shot>
  );
};

// ------------------------------------------------------------ S10-07 Nagasaki: glow behind the hills (no people)
const NagasakiShot: React.FC<{f: number}> = ({f}) => {
  const g = f - GLOW;
  const glow = g < 0 ? 0 : g < 25 ? g / 25 : Math.max(0, 1 - (g - 25) / 50);
  const grey = prog(g, 30, 50);
  return (
    <Shot f={f} bg="#A6C8D8" keys={ck([T[6], 1.0, 960, 540], [T[7], 1.02, 960, 540])} drift={0.6} sombre={grey * 0.5}>
      <g opacity={1 - grey}>
        <Nagasaki f={f} state="before" />
      </g>
      <g opacity={grey}>
        <Nagasaki f={f * 0.4} state="after" />
      </g>
      <ellipse cx={1150} cy={450} rx={900 * glow + 1} ry={500 * glow + 1} fill="#FFF6E0" opacity={glow * 0.85} />
      {grey > 0 && <Particles f={f} kind="ash" n={40} seed={10} opacity={0.7 * grey} />}
    </Shot>
  );
};

// ------------------------------------------------------------ S10-08 the broadcast (Hirohito not drawn)
const Broadcast: React.FC<{f: number}> = ({f}) => {
  const t = f - T[7];
  return (
    <Shot f={f} bg="#C9B48A" keys={ck([T[7], 1.0, 960, 600], [T[8], 1.08, 960, 640])}>
      <Interior wall="#D8C8A0" floor="#B89A6A" floorY={780} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={-100 + i * 440} y={180} width={400} height={600} fill="#F2EAD6" stroke={C.ink} strokeWidth={5} />
          {[1, 2, 3].map((j) => <line key={j} x1={-100 + i * 440 + j * 100} y1={180} x2={-100 + i * 440 + j * 100} y2={780} stroke="#8A7A5A" strokeWidth={3} />)}
        </g>
      ))}
      <rect x={800} y={850} width={320} height={40} fill="#5A3E2A" stroke={C.ink} strokeWidth={4} />
      <Radio x={960} y={850} f={f} s={1.1} />
      {[['japaneseMan', 600, 1], ['japaneseWoman', 760, 1], ['japaneseChild', 1180, -1], ['japaneseWoman2', 1330, -1], ['japaneseMan2', 1480, -1]].map(([k, x, d], i) => (
        <Fig key={i} k={k as string} x={x as number} y={960} f={f} dir={d as 1 | -1} pose={headBowed(kneelSit(f, i), i === 3 ? 1.5 : 1)} expr={i === 3 ? 'grief' : 'solemn'} eyesClosed />
      ))}
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${1010 + i * 22},${780 - i * 6} q10,-${10 + i * 5} 0,-${20 + i * 10}`} stroke={C.ink} strokeWidth={3} fill="none" opacity={0.4 + 0.4 * Math.sin(f / 4 + i)} />
      ))}
    </Shot>
  );
};

// ------------------------------------------------------------ S10-09 USS Missouri
const Missouri: React.FC<{f: number}> = ({f}) => {
  const t = f - T[8];
  const sg = signDocument(t, {seated: true});
  return (
    <Shot f={f} bg="#8EA8B8" keys={ck([T[8], 1.0, 960, 540], [T[9], 1.12, 1200, 640])}>
      <MissouriDeck f={f} />
      {Array.from({length: 6}).map((_, i) => (
        <Plane key={i} x={-300 + t * 7 + (i % 3) * 160} y={120 + Math.floor(i / 3) * 60 + (i % 3) * 18} f={f} kind="heavy" s={0.18} />
      ))}
      <Flag x={1780} y={760} f={f} kind="us" pole={340} seed={4} />
      <Fig k="macarthur" x={1320} y={930} f={f} pose={sg.pose} expr="solemn" overlayFront={(sk) => <Pen x={sk.armR.hx} y={sk.armR.hy} />} tag />
      {['japaneseDelegate', 'japaneseDelegate2', 'japaneseOfficer', 'japaneseOfficer'].map((k, i) => (
        <Fig key={i} k={k} x={420 + i * 150} y={930} f={f} pose={standStiff(f, i)} expr="solemn" />
      ))}
      <GroupTag x={640} y={560} text="JAPANESE DELEGATION" />
    </Shot>
  );
};

// ------------------------------------------------------------ S10-10 the debate (chalk balance)
const Debate: React.FC<{f: number}> = ({f}) => {
  const t = f - T[9];
  const tilt = prog(t, 40, 90) * 10 - prog(t, 120, 180) * 20 + prog(t, 200, 250) * 10;
  const cx = 1140, cy = 300;
  const ax = Math.cos((tilt * Math.PI) / 180) * 330, ay = Math.sin((tilt * Math.PI) / 180) * 330;
  return (
    <Shot f={f} bg={C.wallYellow} keys={ck([T[9], 1.0, 960, 540], [T[10], 1.06, 1000, 520])}>
      <HistoryRoom
        f={f}
        board={
          <g>
            <ChalkPath d={`M${cx},${cy} L${cx},${cy + 330} M${cx - 120},${cy + 330} L${cx + 120},${cy + 330}`} reveal={prog(t, 0, 20)} w={7} />
            <g opacity={prog(t, 15, 35)}>
              <ChalkPath d={`M${cx - ax},${cy - ay} L${cx + ax},${cy + ay}`} reveal={1} w={7} />
              <ChalkPath d={`M${cx - ax - 130},${cy - ay + 120} L${cx - ax},${cy - ay} L${cx - ax + 130},${cy - ay + 120} Z`} reveal={1} w={4} />
              <ChalkPath d={`M${cx + ax - 130},${cy + ay + 120} L${cx + ax},${cy + ay} L${cx + ax + 130},${cy + ay + 120} Z`} reveal={1} w={4} />
              <Chalk x={cx - ax} y={cy - ay + 165} text="ATOMIC BOMBS" size={34} />
              <Chalk x={cx + ax} y={cy + ay + 165} text="SOVIET INVASION" size={34} />
            </g>
          </g>
        }
      />
      <Fig k="guide" x={330} y={900} f={f} s={1.5} pose={mixPose(talkGesture(f, 4), {...talkGesture(f, 4), shL: 60, elL: 10, shR: 60, elR: 10}, prog(t, 100, 120))} expr="neutral" talking={f > b.at(8) && f < b.endOf(8)} turn={0.3} />
    </Shot>
  );
};

export const S10Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: T[0], to: T[1], el: <Islands f={f} />},
      {from: T[1], to: T[2], el: <Okinawa f={f} />},
      {from: T[2], to: T[3], el: <Cabinet f={f} />, trans: 'cut'},
      {from: T[3], to: T[4], el: <HiroBefore f={f} />},
      {from: T[4], to: T[5], el: <HiroAfter f={f} />, trans: 'cut'},
      {from: T[5], to: T[6], el: <Manchuria f={f} />},
      {from: T[6], to: T[7], el: <NagasakiShot f={f} />, trans: 'cut'},
      {from: T[7], to: T[8], el: <Broadcast f={f} />},
      {from: T[8], to: T[9], el: <Missouri f={f} />, trans: 'cut'},
      {from: T[9], to: T[10], el: <Debate f={f} />, trans: 'wipe'},
    ]}
  />
);

export const S10Overlay: React.FC = () => (
  <g>
    <DateCard at={T[1] + 8} until={b.at(1) + 115} date="APRIL–JUNE 1945" title="OKINAWA" />
    <FactPill at={300} until={T[2] - 4} text="WELL OVER 100,000 SOLDIERS AND CIVILIANS KILLED" x={1880} y={330} anchor="end" maxW={800} />
    <DateCard at={T[3] + 8} until={FLASH - 4} date="6 AUGUST 1945" title="HIROSHIMA" />
    <FactPill at={FLASH + 45} until={T[5] - 4} text="HIROSHIMA: ABOUT 90,000–140,000 DEAD BY THE END OF 1945 (EST.)" x={W / 2} y={300} anchor="middle" maxW={1500} color="#E9E6DE" />
    <DateCard at={T[5] + 10} until={T[6] - 4} date="8 AUGUST 1945" title="SOVIET UNION DECLARES WAR ON JAPAN" />
    <DateCard at={T[6] + 4} until={GLOW + 20} date="9 AUGUST 1945" title="NAGASAKI" />
    <FactPill at={GLOW + 30} until={T[7] + 110} text="NAGASAKI: ABOUT 60,000–80,000 DEAD BY THE END OF 1945 (EST.)" x={W / 2} y={420} anchor="middle" maxW={1500} color="#E9E6DE" />
    <DateCard at={T[7] + 34} until={T[8] - 2} date="15 AUGUST 1945" title="JAPAN ANNOUNCES SURRENDER" sub="Emperor Hirohito's radio broadcast" />
    <DateCard at={T[8] + 4} until={T[9] - 2} date="2 SEPTEMBER 1945" title="FORMAL SURRENDER" sub="Aboard USS Missouri, Tokyo Bay" />
    <TermCard at={T[9] + 12} until={1790} term="A DEBATE" meaning="Historians disagree about how much each shaped Japan's decision" />
  </g>
);
