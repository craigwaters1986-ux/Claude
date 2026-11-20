// s11 — Chapter 10: The Human Cost and the Legacy (570-605 s). Storyboard S11-01 … S11-06 + end card.
// Section runs 35 s (1,050 frames); end card from 595.5 s (local 765) to the last frame.
import React from 'react';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack} from '../components/Camera';
import {Sky, Ground, Hills, Clouds, Sun, Birds, Interior, Table, Flag, Document, HistoryRoom, Chalk, Tree} from '../components/Environment';
import {Particles} from '../components/Effects';
import {Cemetery} from '../components/env/Places';
import {Globe} from '../maps/GeoMap';
import {GlobeCrack, COLD_WAR_HIGHLIGHTS} from '../maps/MapKit';
import {walk, stand, kneel, signDocument, point, talkGesture, waveSide, mixPose} from '../characters/poses';
import {Pen} from '../characters/props';
import {Crowd} from '../characters/Crowd';
import {DateCard, FactPill, TermCard, EndCard} from '../components/Text';
import {prog, clamp, lerp} from '../animations/core';
import {sec, Fig, Shot, ck, ChalkPath} from './kit';

const {b, cut} = sec('s11');
const END = 765; // 595.5 s
const T = [0, cut(1), cut(2), cut(3), cut(4), cut(5), 1050];

// ------------------------------------------------------------ S11-01 war cemetery at dusk
const Graves: React.FC<{f: number}> = ({f}) => {
  const lay = prog(f, 60, 110);
  return (
    <Shot f={f} bg="#C9A890" keys={ck([0, 1.05, 860, 540], [T[1], 1.05, 1060, 540])} sombre={0.25}>
      <Cemetery f={f} dusk={1} />
      <Birds f={f} n={3} seed={4} y={200} />
      <Fig k="woman2" x={1300} y={640} f={f * 0.6} s={0.35} pose={lay > 0.5 ? kneel(f) : walk(f / 30, 0.5)} expr="solemn" />
      <g transform="translate(1335,630)" opacity={lay}>
        <circle r={6} fill={C.red} stroke={C.ink} strokeWidth={2} />
        <circle cx={9} cy={2} r={5} fill="#E8C84A" stroke={C.ink} strokeWidth={2} />
      </g>
    </Shot>
  );
};

// ------------------------------------------------------------ S11-02 the UN → the Cold War globe (match)
const UN: React.FC<{f: number}> = ({f}) => {
  const t = f - T[1];
  const toGlobe = prog(f, 262, 285);
  const sg = signDocument(t, {seated: true});
  return (
    <Shot f={f} bg="#2A3448">
      <g opacity={1 - toGlobe} transform={`translate(${W / 2},${H / 2}) scale(${1 + 0.1 * prog(t, 0, 80) + toGlobe * 0.4}) translate(${-W / 2},${-H / 2})`}>
        <Interior wall="#C9C4B8" floor="#6A5E50" floorY={800} />
        <rect x={360} y={140} width={1200} height={460} fill="#DCD6C8" stroke={C.ink} strokeWidth={4} />
        <Flag x={960} y={760 - prog(t, 0, 60) * 0} f={f} kind="un" pole={420 + prog(t, 0, 60) * 0} w={150 * (0.5 + 0.5 * prog(t, 0, 50))} h={95 * (0.5 + 0.5 * prog(t, 0, 50))} seed={9} />
        <Table x={560} y={800} w={800} cloth="#3F6EA6" h={100} />
        {['politician', 'politician2', 'man2'].map((k, i) => (
          <Fig key={i} k={k} x={700 + i * 260} y={900} f={f + i * 13} pose={i === 1 ? sg.pose : stand(f, i)} expr="happy" overlayFront={i === 1 ? (sk) => <Pen x={sk.armR.hx} y={sk.armR.hy} /> : undefined} />
        ))}
        <g transform="translate(960,790) scale(0.5,0.3)">
          <Document x={-110} y={-140} title="UNITED NATIONS CHARTER" sign={prog(t, 10, 70)} />
        </g>
      </g>
      <g opacity={toGlobe}>
        <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={C.deepNavy} />
        <Globe f={f} lon={lerp(-60, 10, prog(f, 262, 347))} lat={50} r={420} cy={560} highlights={COLD_WAR_HIGHLIGHTS(prog(f, 270, 290))}>
          {({path}) => <GlobeCrack path={path} reveal={prog(f, 285, 335)} />}
        </Globe>
      </g>
    </Shot>
  );
};

// ------------------------------------------------------------ S11-03 the lesson (dim room)
const Lesson: React.FC<{f: number}> = ({f}) => {
  const t = f - T[2];
  return (
    <Shot f={f} bg={C.wallYellow} keys={ck([T[2], 1.0, 960, 540], [T[3], 1.06, 1000, 520])}>
      <HistoryRoom
        f={f}
        board={
          <g>
            <Chalk x={1140} y={300} text="HATRED" size={78} reveal={prog(t, 5, 30)} />
            <Chalk x={1140} y={400} text="+ UNCHECKED AGGRESSION" size={64} reveal={prog(t, 30, 75)} />
            <Chalk x={1140} y={560} text="→ CATASTROPHE" size={84} reveal={prog(t, 85, 130)} />
          </g>
        }
      />
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#1A1A2A" opacity={0.3} />
      <Fig k="guide" x={340} y={900} f={f} s={1.5} pose={mixPose(point(f, 120), talkGesture(f, 2), 0.4)} expr="sad" talking={f > b.at(2) && f < b.endOf(2)} turn={0.35} />
    </Shot>
  );
};

// ------------------------------------------------------------ S11-04 ordinary people walk towards us
const People: React.FC<{f: number}> = ({f}) => {
  const t = f - T[3];
  const ks = ['anna', 'workerW', 'nurse', 'sovietSoldier', 'resistance', 'chineseSoldier', 'sailor', 'tom'];
  return (
    <Shot f={f} bg="#F2D9A6" keys={ck([T[3], 1.15, 960, 600], [T[4], 1.0, 960, 560])}>
      <Sky top="#9FC6D3" bottom="#F6DCA8" />
      <Sun x={1500} y={300} r={90} f={f} />
      <Clouds f={f} n={4} seed={61} speed={0.4} yMin={60} yMax={260} />
      <Hills y={660} color="#9DB07A" seed={12} />
      <Ground y={700} color="#B8B79A" />
      <path d="M860,700 L1060,700 L1500,1300 L420,1300 Z" fill="#C9B48A" stroke={C.ink} strokeWidth={4} />
      {ks.map((k, i) => (
        <Fig key={i} k={k} x={330 + i * 180} y={930 + (i % 2) * 15} f={f + i * 5} s={0.95 + t * 0.0008} pose={walk(t / 26 + i * 0.3, 0.5)} expr="determined" turn={1} />
      ))}
    </Shot>
  );
};

// ------------------------------------------------------------ S11-05 PEOPLE (warm room)
const PeopleBoard: React.FC<{f: number}> = ({f}) => {
  const t = f - T[4];
  return (
    <Shot f={f} bg={C.wallYellow} keys={ck([T[4], 1.0, 960, 540], [T[5], 1.08, 1100, 480])}>
      <HistoryRoom
        f={f}
        board={
          <g>
            <Chalk x={900} y={290} text="BATTLES" size={64} />
            <Chalk x={1380} y={290} text="LEADERS" size={64} />
            <ChalkPath d="M760,272 L1040,272" reveal={prog(t, 5, 20)} w={6} />
            <ChalkPath d="M1240,272 L1520,272" reveal={prog(t, 22, 37)} w={6} />
            <Chalk x={1140} y={540} text="PEOPLE" size={170} reveal={prog(t, 45, 85)} color="#FFF3C8" />
          </g>
        }
      />
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#FFC870" opacity={0.08} />
      <Fig k="guide" x={340} y={900} f={f} s={1.5} pose={point(f, 120)} expr="happy" talking={f > b.at(4) && f < b.endOf(4)} turn={0.35} />
    </Shot>
  );
};

// ------------------------------------------------------------ S11-06 sunrise crowd + end card
const Finale: React.FC<{f: number}> = ({f}) => {
  const t = f - T[5];
  return (
    <Shot f={f} bg="#F2C890" keys={ck([T[5], 1.12, 960, 640], [END, 1.04, 960, 600], [1050, 1.0, 960, 580])}>
      <Sky top="#7FA8C8" bottom="#F6C88A" />
      <Sun x={960} y={lerp(640, 560, prog(t, 0, 300))} r={110} f={f} color="#F8D27A" />
      <Clouds f={f} n={4} seed={71} speed={0.3} yMin={80} yMax={260} color="#FBEAD6" />
      <Birds f={f} n={5} seed={8} y={330} />
      <Hills y={720} color="#8DA35A" seed={14} />
      <Ground y={760} color="#8DA35A" />
      <Crowd f={f} count={70} x0={-60} x1={1980} yBack={800} yFront={1060} scaleBack={0.42} scaleFront={0.68} pool="finale" view="mixed" mix={{wave: 2, cheer: 1, stand: 3}} seed={9} expression="happy" />
      <Fig k="leo" x={960} y={1010} f={f} s={0.9} pose={waveSide(f, 1)} expr="joy" />
    </Shot>
  );
};

export const S11Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: T[0], to: T[1], el: <Graves f={f} />},
      {from: T[1], to: T[2], el: <UN f={f} />},
      {from: T[2], to: T[3], el: <Lesson f={f} />, trans: 'wipe'},
      {from: T[3], to: T[4], el: <People f={f} />},
      {from: T[4], to: T[5], el: <PeopleBoard f={f} />, trans: 'cut'},
      {from: T[5], to: T[6], el: <Finale f={f} />},
    ]}
  />
);

export const S11Overlay: React.FC = () => (
  <g>
    <FactPill at={42} until={T[1] - 4} text="AN ESTIMATED 60 MILLION OR MORE DEAD" sub="MOST OF THEM CIVILIANS" subAt={110} x={W / 2} y={300} anchor="middle" color="#E9E6DE" />
    <FactPill at={T[1] + 4} until={T[1] + 92} text="1945: UNITED NATIONS FOUNDED" x={1880} y={300} anchor="end" />
    <TermCard at={268} until={T[2] - 2} term="THE COLD WAR" meaning="Decades of rivalry between the United States and the Soviet Union" />
    <EndCard at={END} />
  </g>
);
