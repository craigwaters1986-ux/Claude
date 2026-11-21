// s04 · Lawyer and politician (2:20–3:25). Storyboard shots 4.1–4.7; poses and contacts from s04-solve.ts.
import React from 'react';
import {Shots, Frame} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {CineCam, CineDefs, GodRays, LightPool, Rim, TitlePlate, LightLeak, PassBy} from '../kit/Cinema';
import {PropAt, BOOK, QUILL, InkPot, Door} from '../kit/Props';
import {Chair, WritingDesk} from '../kit/Seats';
import {SummaryPanel} from '../kit/Documents';
import {SkyGrad, Study, OilLamp, WritingSlope, HouseFront, DoorwayInterior} from '../kit/Sets04';
import {PlaceTag} from '../kit/Places';
import {DateCard} from '../components/Text';
import {Particles} from '../components/Effects';
import {stand, addPose} from '../characters/poses';
import {prog} from '../animations/core';
import * as Q from './s04-solve';
import {T, beat} from '../timeline';
import {FigEl, Look, IrisOpen, Motes, SeatedFig, Legislature, MemberDesk, BallRoom, Dancers, Musicians, NightWindow, DeskCandle, SlopeScribble, Parlour, HouseHall, SonsRow} from './s04-sets';
import {RideShot, CircuitShot, CapitolShot} from './s04-ride';

const {AT4, S4, E4} = Q;
const sec = (t: number) => Math.round((t - S4) * 30); // section-local frame of a programme time (for DateCard)

// ---------------------------------------------------------------- 4.1 legislature
const Leg: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = Q.solveLeg(f);
  const [abe, ...mem] = s.figs;
  return (
    <Frame bg="#D9CDB2">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={41}>
        {(layer) => [
          layer(0.9, <Legislature f={f} floor={Q.LEG_FLOOR} />, 0),
          layer(0.92, <g>{[260, 1720].map((x, i) => <Person key={i} id={i ? 'farmer' : 'visitor'} x={x} y={Q.LEG_FLOOR - 20} f={f + i * 40} seed={90 + i} pose={stand(f + i * 30, 90 + i)} lod="low" dir={i ? -1 : 1} scale={0.85} head={{hat: 'none'}} />)}</g>, 2),
          layer(1, (
            <g>
              {mem.map((m, i) => <SeatedFig key={i} g={m} f={f} seed={43 + i} floor={Q.LEG_FLOOR} lod="low" />)}
              {mem.map((m, i) => <MemberDesk key={'d' + i} x={m.pl.x + (m.pl.dir ?? 1) * 120} floor={Q.LEG_FLOOR} w={120} />)}
              {f < Q.LEG_STAND + 30 && <Chair x={abe.pl.x} floor={Q.LEG_FLOOR} h={s.seatH as number} />}
              <Rim kind="warm" side="l"><FigEl g={abe} f={f} seed={42} /></Rim>
              <MemberDesk x={abe.pl.x + 140} floor={Q.LEG_FLOOR} w={130} />
            </g>
          )),
        ]}
      </CineCam>
      <GodRays x={600} y={180} w={300} f={f} angle={-24} len={900} op={0.13} />
      <Motes f={f} x={300} y={200} w={900} h={600} />
      <Look f={f} grade="day" vig={0.42} />
      <LightLeak f={f} t={1 - prog(f, 60, 100)} />
      {/* Phase D2: the plate lasts the card beat (2.5 s) and the date card arrives on "In 1834," (they were fixed at 90 and 96) */}
      <TitlePlate f={f} d={sec(beat('s04', 0)[1])} num={4} title="Lawyer and politician" />
      <DateCard at={sec(T('In 1834')) + 6} until={d - 4} date="1834" title="Illinois legislature" />
      <IrisOpen f={f} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 4.2 John T. Stuart's law book (OTS), then reading alone (INS)
const Shelf: React.FC<{x: number; floor: number}> = ({x, floor}) => (
  <g>
    <rect x={x} y={floor - 560} width={300} height={560} fill="#5A3E28" stroke="#151515" strokeWidth={5} />
    {[0, 1, 2, 3].map((r) => (
      <g key={r}>
        <rect x={x + 10} y={floor - 540 + r * 130} width={280} height={10} fill="#3E2A1A" />
        {Array.from({length: 11}, (_, i) => <rect key={i} x={x + 16 + i * 25} y={floor - 640 + r * 130 + 112 - (i % 3) * 6} width={20} height={88 + (i % 3) * 6} fill={['#6E2A22', '#2A3A5A', '#5A5A2A', '#7A5A3A'][(i + r) % 4]} stroke="#151515" strokeWidth={2} />)}
      </g>
    ))}
  </g>
);
const Hand4: React.FC<{f: number; d: number}> = ({f}) => {
  const s = Q.solveHand(f);
  const [stuart, abe] = s.figs;
  return (
    <Frame bg="#7E6A52">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={44}>
        {(layer) => [
          layer(0.85, <g><Study f={f} floor={Q.HAND_FLOOR} windowX={1240} /><Shelf x={1240 + 340} floor={Q.HAND_FLOOR} /><Shelf x={420} floor={Q.HAND_FLOOR} /></g>, 3),
          layer(1, (
            <g>
              <Rim kind="warm" side="r"><FigEl g={stuart} f={f} seed={45} /></Rim>
              <PropAt def={BOOK} xf={s.book as never} st={{f, open: 0}} />
              <FigEl g={abe} f={f} seed={46} />
            </g>
          )),
        ]}
      </CineCam>
      <GodRays x={1380} y={240} w={240} f={f} angle={-28} len={900} />
      <Look f={f} grade="day" vig={0.45} />
    </Frame>
  );
};
const Read: React.FC<{f: number; d: number}> = ({f}) => {
  const s = Q.solveRead(f);
  const g = s.figs[0];
  return (
    <Frame bg="#3A2A1E">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={47}>
        {(layer) => [
          layer(0.85, <Study f={f} floor={Q.READ_FLOOR} night windowX={1300} />, 3),
          layer(1, (
            <g>
              <Chair x={g.pl.x} floor={Q.READ_FLOOR} h={s.seatH as number} />
              <WritingDesk x={1110} floor={Q.READ_FLOOR} w={240} h={110} />
              <OilLamp x={1170} y={Q.READ_FLOOR - 110} f={f} s={1.1} />
              <Rim kind="warm" side="r"><FigEl g={g} f={f} seed={48} /></Rim>
              <PropAt def={BOOK} xf={s.book as never} st={{f, open: 1, page: s.page as number}} />
            </g>
          )),
        ]}
      </CineCam>
      <LightPool x={1150} y={560} r={760} f={f} color="#FF9A40" seed={4} strength={0.34} />
      <Look f={f} grade="lamp" vig={0.62} />
    </Frame>
  );
};

// ---------------------------------------------------------------- writing at a slope (protest / letter / bill)
const SlopeDesk: React.FC<{f: number; s: Q.Solved; candle?: boolean; scribSeed?: number}> = ({f, s, candle, scribSeed = 3}) => {
  const g = s.figs[0];
  const SL = Q.SLOPE04;
  return (
    <g>
      <Chair x={g.pl.x} floor={Q.WRITE04_FLOOR} h={s.seatH as number} />
      <WritingDesk x={1000} floor={Q.WRITE04_FLOOR} w={320} h={100} />
      {candle ? <DeskCandle x={1110} y={Q.WRITE04_FLOOR - 100} f={f} /> : <OilLamp x={1110} y={Q.WRITE04_FLOOR - 100} f={f} s={1.1} />}
      <InkPot x={958} y={Q.WRITE04_FLOOR - 100} />
      <WritingSlope x={SL.x} y={SL.y} w={SL.w} h={SL.h} />
      <SlopeScribble x0={Q.SCRIB.x0} y0={Q.SCRIB.y0} w={Q.SCRIB.w} lines={Q.SCRIB.lines} gap={Q.SCRIB.gap} u={s.reveal as number} seed={scribSeed} />
    </g>
  );
};
const Protest: React.FC<{f: number; d: number}> = ({f}) => {
  const s = Q.solveProtest(f);
  const [abe, member] = s.figs;
  return (
    <Frame bg="#D9CDB2">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={49}>
        {(layer) => [
          layer(0.88, <Legislature f={f} floor={Q.WRITE04_FLOOR} />, 3),
          layer(1, (
            <g>
              <FigEl g={member} f={f} seed={50} />
              <SlopeDesk f={f} s={s} scribSeed={7} />
              <PropAt def={QUILL} xf={s.quill as never} st={{f}} />
              <Rim kind="warm" side="r"><FigEl g={abe} f={f} seed={51} /></Rim>
            </g>
          )),
        ]}
      </CineCam>
      <GodRays x={1300} y={160} w={260} f={f} angle={-26} len={900} op={0.12} />
      <Look f={f} grade="day" vig={0.48} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 4.4 the ball (over the shoulder each way)
const Ball: React.FC<{f: number; d: number; rev?: boolean}> = ({f, rev}) => {
  const s = rev ? Q.solveBall2(f) : Q.solveBall1(f);
  const [a, b] = s.figs;
  return (
    <Frame bg="#C9A878">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={rev ? 53 : 52}>
        {(layer) => [
          layer(0.8, <BallRoom f={f} floor={Q.BALL_FLOOR} />, 3),
          layer(0.88, <Dancers f={f} floor={Q.BALL_FLOOR - 10} xs={rev ? [80, 1500, 1800] : [120, 520, 1550]} />, 4),
          layer(1, (
            <g>
              <Rim kind="warm" side={rev ? 'r' : 'l'}><FigEl g={a} f={f} seed={54} label={rev ? undefined : undefined} /></Rim>
              <Rim kind="warm" side={rev ? 'r' : 'l'}><FigEl g={b} f={f} seed={55} label={rev ? undefined : 'MARY TODD'} /></Rim>
            </g>
          )),
          layer(1.45, <Musicians f={f} floor={1080} x={rev ? 1250 : 380} />, 6),
        ]}
      </CineCam>
      <LightPool x={rev ? 1400 : 500} y={180} r={700} f={f} color="#FFC870" seed={rev ? 6 : 5} strength={0.22} />
      <Look f={f} grade="lamp" vig={0.5} amount={0.7} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 4.5 January 1841: alone at the window (restrained)
const Window: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = Q.solveWindow(f);
  const g = s.figs[0];
  return (
    <Frame bg="#2A2A36">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={56}>
        {(layer) => [
          layer(0.9, <NightWindow f={f} floor={Q.WRITE04_FLOOR} x={1250} />, 2),
          layer(1, (
            <g>
              <SlopeDesk f={f} s={s} candle scribSeed={11} />
              <PropAt def={QUILL} xf={s.quill as never} st={{f}} />
              <Rim kind="moon" side="r"><FigEl g={g} f={f} seed={57} /></Rim>
            </g>
          )),
        ]}
      </CineCam>
      <LightPool x={1110} y={760} r={420} f={f} color="#FFB060" seed={7} strength={0.26} />
      <GodRays x={1400} y={190} w={260} f={f} angle={28} len={900} color="#C8D8F0" op={0.09} />
      <Motes f={f * 1.6} x={1050} y={250} w={520} h={560} n={34} seed={11} />
      <Look f={f} grade="night" vig={0.62} amount={0.7} />
      <SummaryPanel title="Letter, January 1841" lines={['Written after the engagement', 'with Mary Todd broke off']} x={1120} y={160} w={680} t={prog(f, 30, 50) * (1 - prog(f, d - 24, d - 6))} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 4.6 the wedding, then the house at Eighth and Jackson
const Wed: React.FC<{f: number; d: number}> = ({f}) => {
  const s = Q.solveWed(f);
  const [abe, mary] = s.figs;
  return (
    <Frame bg="#B8A890">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={58}>
        {(layer) => [
          layer(0.88, <Parlour f={f} floor={Q.WED_FLOOR} />, 2),
          layer(0.94, (
            <g>
              {[420, 560, 680].map((x, i) => <Person key={i} id={i % 2 ? 'townswoman' : 'townsman'} x={x} y={Q.WED_FLOOR - 16} f={f + i * 20} seed={60 + i} pose={stand(f + i * 20, 60 + i)} lod="low" scale={0.9} dir={1} head={{hat: 'none', expression: 'happy'}} />)}
            </g>
          ), 2),
          layer(1, (
            <g>
              <FigEl g={abe} f={f} seed={61} />
              <FigEl g={mary} f={f} seed={62} outfit={{color: '#E8DCC0', accent: '#B89A5A'}} />
              <FigEl g={s.figs[2]} f={f} seed={59} outfit={{color: '#1E1E24', accent: '#F4EBD6'}} />
            </g>
          )),
        ]}
      </CineCam>
      <LightPool x={940} y={420} r={600} f={f} color="#FFD090" seed={8} strength={0.2} />
      <Look f={f} grade="golden" vig={0.45} amount={0.6} />
    </Frame>
  );
};
const House: React.FC<{f: number; d: number}> = ({f}) => {
  const s = Q.solveHouse(f);
  const [mary, abe] = s.figs;
  const dw = s.dw as number;
  const dh = s.dh as number;
  const X = Q.DOOR04_X;
  const fl = Q.DOOR04_FLOOR;
  const fig = (g: Q.Fig, inside: boolean, seed: number, outfit?: Record<string, unknown>) =>
    inside ? <g clipPath="url(#door04)"><FigEl g={g} f={f} seed={seed} outfit={outfit} /></g> : <FigEl g={g} f={f} seed={seed} outfit={outfit} />;
  return (
    <Frame bg="#4A5A84">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={63}>
        {(layer) => [
          layer(0.15, <SkyGrad time="dusk" id="hsky04" />),
          layer(1, (
            <g>
              <defs>
                <clipPath id="door04">
                  <rect x={X + dw * Math.cos(((s.angle as number) * Math.PI) / 180)} y={fl - dh} width={dw * (1 - Math.cos(((s.angle as number) * Math.PI) / 180))} height={dh} />
                </clipPath>
              </defs>
              <HouseFront floor={fl} doorX={X} dw={dw} dh={dh} lit={0.8} />
              <DoorwayInterior x={X} floor={fl} w={dw} h={dh} />
              <Door x={X} floor={fl} angle={s.angle as number} s={Q.DOOR04_S} />
              {Boolean(s.inM) && fig(mary, true, 64)}
              {Boolean(s.inL) && fig(abe, true, 65)}
              {!s.inM && fig(mary, false, 64)}
              {!s.inL && fig(abe, false, 65)}
            </g>
          )),
        ]}
      </CineCam>
      <LightPool x={900} y={640} r={420} f={f} color="#FFB060" seed={9} strength={0.22} />
      <Look f={f} grade="dusk" vig={0.5} />
      <PlaceTag text="Eighth and Jackson" sub="Springfield, Illinois" t={prog(f, 4, 18)} />
      <SonsRow x={1420} y={200} t={prog(f, 26, 50)} f={f} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 4.7 the House: he speaks, then writes at his desk
const Speak: React.FC<{f: number; d: number}> = ({f}) => {
  const s = Q.solveSpeak(f);
  const abe = s.figs[s.figs.length - 1];
  const mem = s.figs.slice(0, -1);
  return (
    <Frame bg="#CDBF9E">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={66}>
        {(layer) => [
          layer(0.88, <HouseHall f={f} floor={Q.HOUSE_FLOOR} />, 3),
          layer(1, (
            <g>
              {mem.map((m, i) => <SeatedFig key={i} g={m} f={f} seed={67 + i} floor={Q.HOUSE_FLOOR} lod="low" />)}
              {mem.map((m, i) => <MemberDesk key={'d' + i} x={m.pl.x + (m.pl.dir ?? 1) * 120} floor={Q.HOUSE_FLOOR} w={120} />)}
              <Rim kind="warm" side="l"><FigEl g={abe} f={f} seed={68} /></Rim>
              <MemberDesk x={abe.pl.x - 140} floor={Q.HOUSE_FLOOR} w={130} />
            </g>
          )),
        ]}
      </CineCam>
      <GodRays x={500} y={120} w={260} f={f} angle={-22} len={900} op={0.12} />
      <Look f={f} grade="day" vig={0.45} />
    </Frame>
  );
};
const Bill: React.FC<{f: number; d: number}> = ({f}) => {
  const s = Q.solveBill(f);
  const g = s.figs[0];
  return (
    <Frame bg="#CDBF9E">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={69}>
        {(layer) => [
          layer(0.88, <HouseHall f={f} floor={Q.WRITE04_FLOOR} />, 3),
          layer(0.94, <g>{[260, 420, 1380, 1560, 1720].map((x, i) => <Person key={i} id={['townsman', 'visitor', 'farmer'][i % 3]} x={x} y={Q.WRITE04_FLOOR - 14} f={f + i * 17} seed={80 + i} pose={stand(f + i * 17, 80 + i)} lod="low" scale={0.9} dir={x < 960 ? 1 : -1} head={{hat: 'none'}} />)}</g>, 2),
          layer(1, (
            <g>
              <SlopeDesk f={f} s={s} scribSeed={13} />
              <PropAt def={QUILL} xf={s.quill as never} st={{f}} />
              <Rim kind="warm" side="r"><FigEl g={g} f={f} seed={70} /></Rim>
            </g>
          )),
        ]}
      </CineCam>
      <GodRays x={1300} y={120} w={260} f={f} angle={-24} len={900} op={0.12} />
      <Look f={f} grade="day" vig={0.48} />
    </Frame>
  );
};

export const S04: React.FC = () => (
  <Shots
    start={S4}
    end={E4}
    shots={[
      {at: AT4.leg, el: (f, d) => <Leg f={f} d={d} />},
      {at: AT4.hand, trans: 'cut', el: (f, d) => <Hand4 f={f} d={d} />},
      {at: AT4.read, trans: 'cut', el: (f, d) => <Read f={f} d={d} />},
      {at: AT4.ride, trans: 'whip', el: (f, d) => <RideShot f={f} d={d} />},
      {at: AT4.protest, trans: 'cut', el: (f, d) => <Protest f={f} d={d} />},
      {at: AT4.ball, trans: 'cut', el: (f, d) => <Ball f={f} d={d} />},
      {at: AT4.ball2, trans: 'cut', el: (f, d) => <Ball f={f} d={d} rev />},
      {at: AT4.window, trans: 'dip', el: (f, d) => <Window f={f} d={d} />},
      {at: AT4.wed, trans: 'fade', el: (f, d) => <Wed f={f} d={d} />},
      {at: AT4.door, trans: 'fade', el: (f, d) => <House f={f} d={d} />},
      {at: AT4.circuit, trans: 'cut', el: (f, d) => <CircuitShot f={f} d={d} />},
      {at: AT4.capitol, trans: 'cut', el: (f, d) => <CapitolShot f={f} d={d} dateAt={sec(AT4.capitol)} />},
      {at: AT4.speak, trans: 'cut', el: (f, d) => <Speak f={f} d={d} />},
      {at: AT4.bill, trans: 'cut', el: (f, d) => <Bill f={f} d={d} />},
    ]}
  />
);
export {Particles};
