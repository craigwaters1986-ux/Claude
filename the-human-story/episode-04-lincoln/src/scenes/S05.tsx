// s05 · A house divided (3:25–4:30). Storyboard shots 5.1–5.7; poses and contacts from s04-solve.ts.
import React from 'react';
import {Shots, Frame} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {CineCam, CineDefs, LightPool, Rim, TitlePlate, LightLeak, GodRays} from '../kit/Cinema';
import {PropAt, STOVEPIPE} from '../kit/Props';
import {Chair} from '../kit/Seats';
import {DocSheet, DocText, doc, layoutDoc} from '../kit/Documents';
import {Study, OilLamp} from '../kit/Sets04';
import {HallBack, Stage, Lectern, Benches, Crowd} from '../kit/Sets04b';
import {USMap, usProjection, TerritoryShape, KANSAS_T, NEBRASKA_T, PlaceDot, DEBATE_TOWNS, StateLabel, MAPC} from '../kit/USMap';
import {PlaceTag} from '../kit/Places';
import {stand} from '../characters/poses';
import {prog, kf} from '../animations/core';
import {FONT} from '../styles/theme';
import {T} from '../timeline';
import * as Q from './s04-solve';
import {FigEl, Look, IrisOpen, Motes, Legislature, MeetingRoom, DebateField, CrowdBacks, Reporters, NEWSPAPER, Broadsheet} from './s04-sets';

const {AT5, S5, E5, DUR5} = Q;
const fr = (s: number) => Math.round(s * 30);

/** A plain label plate (top right), for the storyboard's map labels. */
const Plate: React.FC<{text: string; t: number; x?: number; y?: number}> = ({text, t, x = 1850, y = 60}) => {
  if (t <= 0) return null;
  const w = text.length * 23 + 60;
  return (
    <g opacity={Math.min(1, t * 2)} transform={`translate(${x - w + (1 - Math.min(1, t)) * 40},${y})`}>
      <rect x={6} y={8} width={w} height={70} rx={8} fill="rgba(0,0,0,0.3)" />
      <rect width={w} height={70} rx={8} fill="#22324A" stroke="#151515" strokeWidth={4} />
      <rect width={14} height={70} rx={4} fill="#E3C77A" stroke="#151515" strokeWidth={3} />
      <text x={38} y={47} fontFamily={FONT.sans} fontWeight={900} fontSize={36} fill="#FFFFFF">{text}</text>
    </g>
  );
};

// ---------------------------------------------------------------- 5.1 the Kansas–Nebraska Act opens the West
const KN_VIEW = {lon0: -118, lat0: 29, lon1: -80, lat1: 50};
const KNMap: React.FC<{f: number; d: number}> = ({f, d}) => {
  const proj = usProjection(KN_VIEW, [0, 0, 1920, 1000]);
  const tAct = fr(T('the Kansas–Nebraska Act') - S5);
  const tWest = fr(T('of slavery in the western territories') - S5);
  const [kx, ky] = proj([-99, 40.5])!;
  return (
    <Frame bg={MAPC.sea}>
      <CineDefs />
      <CineCam f={f} keys={[[0, 1.0, 960, 500], [tAct, 1.05, 960, 500], [d, 1.5, kx, ky]]} seed={81}>
        {(layer) => [
          layer(1, (
            <g>
              <USMap proj={proj} f={f} year={1854} id="kn54" />
              <TerritoryShape proj={proj} pts={NEBRASKA_T} id="neb54" t={prog(f, tAct, tAct + 24)} hatch={prog(f, tWest, tWest + 40)} label="NEBRASKA" labelAt={[-104, 44.5]} size={34} />
              <TerritoryShape proj={proj} pts={KANSAS_T} id="kan54" t={prog(f, tAct + 8, tAct + 32)} hatch={prog(f, tWest + 10, tWest + 50)} label="KANSAS" labelAt={[-100.5, 38.5]} size={34} />
              <StateLabel proj={proj} code="IL" text="ILLINOIS" t={prog(f, 40, 70)} size={26} year={1854} />
            </g>
          )),
        ]}
      </CineCam>
      <Look f={f} grade="day" vig={0.35} amount={0.6} />
      <LightLeak f={f} t={1 - prog(f, 60, 100)} />
      <TitlePlate f={f} d={90} num={5} title="A house divided" />
      <Plate text="Kansas–Nebraska Act, 1854" t={prog(f, tAct, tAct + 14)} />
      <IrisOpen f={f} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 5.2 the new Republican Party: hat in hand
const Meet: React.FC<{f: number; d: number}> = ({f}) => {
  const s = Q.solveMeet(f);
  const abe = s.figs[s.figs.length - 1];
  return (
    <Frame bg="#A8987A">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={82}>
        {(layer) => [
          layer(0.88, <MeetingRoom f={f} floor={Q.MEET_FLOOR} />, 3),
          layer(0.92, <g>{[180, 330, 700, 1080, 1620, 1760].map((x, i) => <Person key={i} id={['townsman', 'farmer', 'visitor'][i % 3]} x={x} y={Q.MEET_FLOOR - 24} f={f + i * 11} seed={120 + i} pose={stand(f + i * 11, 120 + i)} lod="low" scale={0.86} dir={x < 900 ? 1 : -1} look={[x < 900 ? 0.6 : -0.6, -0.1]} />)}</g>, 2),
          layer(1, (
            <g>
              {s.figs.slice(0, -1).map((g, i) => <FigEl key={i} g={g} f={f} seed={83 + i} />)}
              <Rim kind="warm" side="r"><FigEl g={abe} f={f} seed={86} /></Rim>
              {!s.hatOnHead && <PropAt def={STOVEPIPE} xf={s.hat as never} st={{f}} />}
            </g>
          )),
        ]}
      </CineCam>
      <LightPool x={960} y={360} r={700} f={f} color="#FFD890" seed={11} strength={0.18} />
      <Look f={f} grade="lamp" vig={0.5} amount={0.6} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 5.3 Springfield, June 1858: at the lectern, then the words
const Speaker: React.FC<{s: Q.Solved; f: number; seed: number}> = ({s, f, seed}) => (
  <g>
    <Stage x={960} floor={Q.HALL_FLOOR} w={760} />
    <Rim kind="warm" side="l"><FigEl g={s.figs[0]} f={f} seed={seed} /></Rim>
    <Lectern x={Q.LECT.x} floor={Q.STAGE_TOP} s={Q.LECT.s} />
  </g>
);
const Hall: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = Q.solveHall(f);
  return (
    <Frame bg="#3A2E26">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={87}>
        {(layer) => [
          layer(0.88, <Legislature f={f} floor={Q.HALL_FLOOR} />, 3),
          layer(0.88, <rect x={-800} y={-500} width={3600} height={2000} fill="#1A1420" opacity={0.45} />),
          layer(1, <Speaker s={s} f={f} seed={88} />),
          layer(1.3, <Benches y={850} f={f} rows={2} seed={9} />, 3),
        ]}
      </CineCam>
      {[420, 1500].map((x, i) => <LightPool key={i} x={x} y={300} r={520} f={f} color="#FFC870" seed={12 + i} strength={0.3} />)}
      <LightPool x={980} y={560} r={500} f={f} color="#FFB060" seed={14} strength={0.22} />
      <Look f={f} grade="lamp" vig={0.6} />
      <PlaceTag text="Springfield, Illinois" sub="June 1858" t={prog(f, 8, 22) * (1 - prog(f, d - 14, d))} />
    </Frame>
  );
};
const HouseDoc: React.FC<{f: number; d: number}> = ({f, d}) => {
  const dd = doc('houseDivided');
  return (
    <Frame bg="#2A2018">
      <CineDefs />
      <CineCam f={f} keys={[[0, 1.0, 960, 500], [d, 1.08, 960, 490]]} seed={89}>
        {(layer) => [
          layer(0.9, <g><rect x={-800} y={-500} width={3600} height={2000} fill="#3A2A1E" />{Array.from({length: 14}, (_, i) => <line key={i} x1={-800} y1={i * 90} x2={2800} y2={i * 90 + 20} stroke="#2E2018" strokeWidth={8} />)}</g>),
          layer(1, <DocSheet d={dd} x={190} y={230} w={1540} h={420} size={56} f={f} maxWords={12} pad={70} />),
        ]}
      </CineCam>
      <LightPool x={760} y={420} r={900} f={f} color="#FFB060" seed={15} strength={0.2} />
      <Motes f={f} x={200} y={100} w={1500} h={700} n={20} seed={7} />
      <Look f={f} grade="lamp" vig={0.55} amount={0.6} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 5.4 seven debates across Illinois; Douglas on the platform
const IL_BOX: [number, number, number, number] = [640, 30, 1280, 830];
const ILMap: React.FC<{f: number; d: number}> = ({f, d}) => {
  const proj = usProjection('ILLINOIS', IL_BOX);
  return (
    <Frame bg={MAPC.sea}>
      <CineDefs />
      <CineCam f={f} keys={[[0, 1.0, 960, 470], [d, 1.08, 960, 470]]} seed={90}>
        {(layer) => [
          layer(1, (
            <g>
              <USMap proj={proj} f={f} year={1858} id="il58" states={{IL: {fill: '#E9DDB4', t: 1, lift: 6}}} />
              <StateLabel proj={proj} code="IL" text="ILLINOIS" t={prog(f, 0, 10)} size={34} dy={-40} year={1858} />
              {DEBATE_TOWNS.map((tw, i) => (
                <PlaceDot key={tw.name} proj={proj} at={tw.at} label={tw.name} t={prog(f, 4 + i * 6, 14 + i * 6)} side={tw.name === 'Quincy' || tw.name === 'Galesburg' || tw.name === 'Alton' ? 'left' : 'right'} size={28} ring={1} f={f + i * 6} />
              ))}
            </g>
          )),
        ]}
      </CineCam>
      <Look f={f} grade="day" vig={0.35} amount={0.6} />
    </Frame>
  );
};
const Debate: React.FC<{f: number; d: number}> = ({f}) => {
  const s = Q.solveDebate(f);
  const [dg, abe] = s.figs;
  return (
    <Frame bg="#AFC8D0">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={91}>
        {(layer) => [
          layer(0.8, <DebateField f={f} plat={Q.PLAT_FLOOR} />, 1),
          layer(1, (
            <g>
              <Chair x={abe.pl.x} floor={Q.PLAT_FLOOR} h={s.seatH as number} dir={-1} />
              <FigEl g={abe} f={f} seed={92} />
              <Rim kind="warm" side="l"><FigEl g={dg} f={f} seed={93} /></Rim>
            </g>
          )),
          layer(1.12, <Reporters f={f} x={600} floor={840} />, 2),
          layer(1.3, <CrowdBacks f={f} y={800} n={9} x0={760} dx={170} s={1.0} seed={3} />, 3),
        ]}
      </CineCam>
      <Look f={f} grade="day" vig={0.4} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 5.5 Charleston: the printed words (still, sombre, no reaction)
const QBOX = {x: 400, y: 300, w: 1120, h: 380};
const Charleston: React.FC<{f: number; d: number}> = ({f, d}) => {
  const dd = doc('charleston');
  const L = layoutDoc(dd.text, dd.hand, 52, QBOX.w - 100, QBOX.x + 50, QBOX.y + 90, 1.32, 9);
  return (
    <Frame bg="#1E1C1A">
      <CineDefs />
      <CineCam f={f} keys={[[0, 1.0, 960, 500], [d, 1.1, 960, 480]]} seed={94}>
        {(layer) => [
          layer(0.9, <rect x={-800} y={-500} width={3600} height={2000} fill="#2A2622" />),
          layer(1, (
            <g>
              <Broadsheet x={180} y={40} w={1560} h={1000} seed={6} skip={[QBOX.x - 20, QBOX.y - 20, QBOX.w + 40, QBOX.h + 40]} />
              <rect x={QBOX.x} y={QBOX.y} width={QBOX.w} height={QBOX.h} fill="#EFE6CE" stroke="#3A3430" strokeWidth={2} />
              <DocText L={L} id="charl" />
            </g>
          )),
        ]}
      </CineCam>
      <LightPool x={960} y={460} r={900} f={f} color="#FFE0A8" seed={16} strength={0.12} flicker={0.4} />
      <Look f={f} grade="sombre" vig={0.6} />
      <g opacity={prog(f, 8, 22)}>
        <rect x={1860 - dd.title.length * 12.5 - 40} y={40} width={dd.title.length * 12.5 + 40} height={44} rx={6} fill="rgba(20,18,16,0.85)" />
        <text x={1840} y={70} textAnchor="end" fontFamily={FONT.sans} fontWeight={700} fontSize={22} fill="#F4EBD6">{dd.title}</text>
      </g>
    </Frame>
  );
};

// ---------------------------------------------------------------- 5.6 the result: grim, then thinking
const Result: React.FC<{f: number; d: number}> = ({f}) => {
  const s = Q.solveResult(f);
  const g = s.figs[0];
  return (
    <Frame bg="#3A2A1E">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={95}>
        {(layer) => [
          layer(0.85, <Study f={f} floor={Q.NEWS_FLOOR} night windowX={1250} />, 4),
          layer(0.9, <OilLamp x={1180} y={Q.NEWS_FLOOR - 300} f={f} s={1.2} />, 2),
          layer(1, (
            <g>
              <PropAt def={NEWSPAPER} xf={s.paper as never} st={{f}} />
              <Rim kind="warm" side="r"><FigEl g={g} f={f} seed={96} /></Rim>
            </g>
          )),
        ]}
      </CineCam>
      <LightPool x={1250} y={460} r={760} f={f} color="#FFA850" seed={17} strength={0.3} />
      <Look f={f} grade="lamp" vig={0.62} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 5.7 Cooper Union, New York: the hall, then the line
const Cooper: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = Q.solveCooper(f);
  const dd = doc('cooperUnion');
  const tq = fr(T('let us have faith that right makes might') - AT5.cooper);
  return (
    <Frame bg="#2A2220">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={97}>
        {(layer) => [
          layer(0.85, <HallBack f={f} floor={Q.HALL_FLOOR} lit={0.9} />, 2),
          layer(1, <Speaker s={s} f={f} seed={98} />),
          layer(1.04, <Crowd x0={-400} x1={2300} y={Q.HALL_FLOOR + 10} f={f} rows={3} s={0.9} seed={4} fromBehind hats={0.3} />, 1),
          layer(1.3, <Benches y={930} f={f} rows={2} seed={13} />, 3),
        ]}
      </CineCam>
      {[300, 960, 1620].map((x, i) => <LightPool key={i} x={x} y={260} r={460} f={f} color="#FFD080" seed={18 + i} strength={0.24} />)}
      <GodRays x={960} y={-40} w={500} f={f} angle={0} len={900} color="#FFE6B0" op={0.06} />
      <Look f={f} grade="lamp" vig={0.55} />
      <PlaceTag text="Cooper Union, New York" sub="February 1860" t={prog(f, 10, 24) * (1 - prog(f, tq - 20, tq - 4))} />
      {f >= tq - 2 && <DocSheet d={dd} x={1000} y={170 + (1 - prog(f, tq, tq + 14)) * 30} w={840} h={430} size={40} f={f - tq} maxWords={7} pad={50} />}
    </Frame>
  );
};

export const S05: React.FC = () => (
  <Shots
    start={S5}
    end={E5}
    shots={[
      {at: AT5.map, el: (f, d) => <KNMap f={f} d={d} />},
      {at: AT5.meet, trans: 'cut', el: (f, d) => <Meet f={f} d={d} />},
      {at: AT5.hall, trans: 'cut', el: (f, d) => <Hall f={f} d={d} />},
      {at: AT5.hdoc, trans: 'page', el: (f, d) => <HouseDoc f={f} d={d} />},
      {at: AT5.ilmap, trans: 'whip', el: (f, d) => <ILMap f={f} d={d} />},
      {at: AT5.debate, trans: 'cut', el: (f, d) => <Debate f={f} d={d} />},
      {at: AT5.charleston, trans: 'cut', el: (f, d) => <Charleston f={f} d={d} />},
      {at: AT5.result, trans: 'cut', el: (f, d) => <Result f={f} d={d} />},
      {at: AT5.cooper, trans: 'fade', el: (f, d) => <Cooper f={f} d={d} />},
    ]}
  />
);
export {stand, kf, Person, DUR5};
