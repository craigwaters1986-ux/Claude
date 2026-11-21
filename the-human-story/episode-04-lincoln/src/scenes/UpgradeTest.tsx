// Phase B upgrade test reel (composition `UpgradeTest`, input prop `debug` draws the contact overlay).
// Seven short shots that exercise the Episode 4 engine: cinematic camera and look, prop/grip actions,
// seats, expressions, speech bubbles and real readable documents. All poses come from reelSolve.ts.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Shots, ShotDef, Frame} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {CineCam, CineDefs, GradeLayer, Grain, Vig, LightPool, GodRays, TitlePlate, LightLeak, PassBy, Rim} from '../kit/Cinema';
import {PropAt, AXE, BOOK, QUILL, STOVEPIPE, Door, RailLog, Chips, InkPot, GripDebug} from '../kit/Props';
import {Stool, Chair, WritingDesk, SeatDebug} from '../kit/Seats';
import {Bubble, Attribution} from '../kit/Bubbles';
import {DocText, doc} from '../kit/Documents';
import {SkyGrad, Ridge, TreeRow, Clearing, RailPile, CabinInterior, CabinExterior, HouseFront, DoorwayInterior, Study, OilLamp, WritingSlope, ReceptionRoom} from '../kit/Sets04';
import {ChannelLogo} from '../components/ChannelLogo';
import {loadFonts} from '../components/Fonts';
import {C, FONT} from '../styles/theme';
import {prog} from '../animations/core';
import {headWorld} from '../characters/skeleton';
import * as RS from './reelSolve';
import type {Fig, Solved} from './reelSolve';

loadFonts();

const FigEl: React.FC<{g: Fig; f: number; seed?: number; lod?: 'full' | 'low'}> = ({g, f, seed = 1, lod}) => (
  <Person
    id={g.id}
    x={g.pl.x}
    y={g.pl.y}
    scale={(g.pl.scale ?? 1) / castS(g.id)}
    dir={g.pl.dir}
    pose={g.P}
    f={f}
    seed={seed}
    look={g.look}
    talking={g.talking}
    tag={g.tag}
    fromBehind={g.fromBehind}
    eyesClosed={g.eyesClosed}
    lod={lod}
    head={{...(g.ex ? {expression: g.ex.expression as never, exprFrom: g.ex.exprFrom as never, exprT: g.ex.exprT} : {}), ...(g.noHat ? {hat: 'none'} : {})}}
  />
);
// Person multiplies by the cast scale, while solver placements already include it: divide it back out.
import {CAST} from '../kit/Cast';
const castS = (id: string) => CAST[id].scale ?? 1;

const Debug: React.FC<{s: Solved; on: boolean}> = ({s, on}) =>
  on ? (
    <g>
      <GripDebug items={s.checks} />
      {s.seats.map((q, i) => <SeatDebug key={i} x={q.x} hipY={q.hipY} seatY={q.seatY} feet={q.feet} floor={q.floor} />)}
    </g>
  ) : null;

const Label: React.FC<{n: number; text: string; f: number}> = ({n, text, f}) => (
  <g opacity={prog(f, 4, 16) * (1 - prog(f, 120, 140))}>
    <rect x={1880 - text.length * 13 - 90} y={36} width={text.length * 13 + 70} height={46} rx={8} fill="rgba(11,11,13,0.7)" />
    <text x={1860} y={67} textAnchor="end" fontFamily={FONT.sans} fontWeight={700} fontSize={22} fill="#F4EBD6">
      TEST {n} · {text}
    </text>
  </g>
);

const Look: React.FC<{f: number; grade: Parameters<typeof GradeLayer>[0]['grade']; vig?: number}> = ({f, grade, vig = 0.5}) => (
  <>
    <GradeLayer grade={grade} />
    <Vig amount={vig} />
    <Grain f={f} />
  </>
);

// ---------------------------------------------------------------- shots
const Woods: React.FC<{f: number; debug: boolean}> = ({f, debug}) => {
  const s = RS.solveWoods(f);
  const fl = RS.WOODS_FLOOR;
  const imp = s.impact as {x: number; y: number};
  const impacts = s.impacts as number[];
  return (
    <Frame bg="#E9B872">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={2}>
        {(layer) => [
          layer(0.12, <SkyGrad time="golden" id="wsky" />),
          layer(0.12, <circle cx={420} cy={300} r={90} fill="#FFE6A0" opacity={0.85} />),
          layer(0.35, <Ridge y={600} color="#B89A6A" seed={5} amp={70} />, 3),
          layer(0.55, <TreeRow y={700} f={f} n={9} s={1.1} color="#7A7A40" seed={4} />, 2),
          layer(0.8, <g><CabinExterior x={280} base={fl - 10} f={f} /><TreeRow y={fl - 10} f={f} n={5} s={1.5} color="#5E6A32" seed={8} x0={1300} x1={2400} /></g>),
          layer(1, (
            <g>
              <Clearing y={fl} />
              <RailPile x={1450} y={fl} n={5} />
              <rect x={imp.x - 60} y={imp.y + 30} width={120} height={fl - imp.y - 30} fill="#7A5A3A" stroke={C.ink} strokeWidth={4} />
              <RailLog x={imp.x} y={imp.y + 30} split={s.split as number} />
              <Rim kind="warm" side="l"><FigEl g={s.figs[0]} f={f} seed={3} /></Rim>
              <PropAt def={AXE} xf={s.axe as never} st={{f}} />
              {impacts.map((a) => <Chips key={a} x={imp.x} y={imp.y} f={f} at={a} />)}
              <Debug s={s} on={debug} />
            </g>
          )),
          layer(1.5, <PassBy f={f} x0={-200} speed={3.4} y={1120} kind="grass" s={1.6} />),
        ]}
      </CineCam>
      <Look f={f} grade="golden" vig={0.45} />
      <LightLeak f={f} t={1 - prog(f, 90, 130)} />
      <TitlePlate f={f} d={96} title="Abraham Lincoln" sub="ENGINE TEST REEL · PHASE B" big />
      <Label n={1} text="axe chop · parallax · golden hour" f={f - 96} />
    </Frame>
  );
};

const Cabin: React.FC<{f: number; debug: boolean}> = ({f, debug}) => {
  const s = RS.solveCabin(f);
  const fl = RS.CABIN_FLOOR;
  const g = s.figs[0];
  return (
    <Frame bg="#2A1C12">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={4}>
        {(layer) => [
          layer(0.9, <CabinInterior f={f} floor={fl} fireX={420} />, 0),
          layer(1, (
            <g>
              <rect x={890} y={s.boxTop as number} width={70} height={fl - (s.boxTop as number)} fill="#6E4C30" stroke={C.ink} strokeWidth={4} />
              <Stool x={g.pl.x} floor={fl} h={s.seatH as number} />
              <Rim kind="warm" side="l"><FigEl g={g} f={f} seed={5} /></Rim>
              <PropAt def={BOOK} xf={s.book as never} st={{f, open: s.open as number, page: s.page as number}} />
              <Debug s={s} on={debug} />
            </g>
          )),
        ]}
      </CineCam>
      <LightPool x={600} y={760} r={760} f={f} color="#FF9A40" seed={3} strength={0.38} />
      <Look f={f} grade="lamp" vig={0.62} />
      <Label n={2} text="pick up and read a book by firelight" f={f} />
    </Frame>
  );
};

const Write: React.FC<{f: number; debug: boolean}> = ({f, debug}) => {
  const s = RS.solveWrite(f);
  const fl = RS.WRITE_FLOOR;
  const g = s.figs[0];
  const SL = RS.SLOPE;
  const d = doc('bliss');
  return (
    <Frame bg="#3A2A1E">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={6}>
        {(layer) => [
          layer(0.85, <Study f={f} floor={fl} night windowX={1300} />, 2),
          layer(1, (
            <g>
              <Chair x={g.pl.x} floor={fl} h={s.seatH as number} />
              <WritingDesk x={1000} floor={fl} w={320} h={100} />
              <OilLamp x={1110} y={fl - 100} f={f} s={1.1} />
              <InkPot x={958} y={fl - 100} />
              <WritingSlope x={SL.x} y={SL.y} w={SL.w} h={SL.h} />
              <DocText L={s.layout as never} reveal={s.reveal as number} id="bliss-w" />
              <FigEl g={g} f={f} seed={7} />
              <PropAt def={QUILL} xf={s.quill as never} st={{f}} />
              <Debug s={s} on={debug} />
            </g>
          )),
        ]}
      </CineCam>
      <LightPool x={1300} y={420} r={900} f={f} color="#FFB060" seed={6} strength={0.3} />
      <Look f={f} grade="lamp" vig={0.55} />
      <g opacity={prog(f, 70, 86)}>
        <rect x={1180} y={830} width={700} height={44} rx={8} fill="rgba(11,11,13,0.78)" />
        <text x={1860} y={860} textAnchor="end" fontFamily={FONT.sans} fontWeight={700} fontSize={22} fill="#F4EBD6">
          {d.title} · text from documents.json
        </text>
      </g>
      <Label n={3} text="writing real text with a quill" f={f} />
    </Frame>
  );
};

const DoorShot: React.FC<{f: number; debug: boolean}> = ({f, debug}) => {
  const s = RS.solveDoor(f);
  const fl = RS.DOOR_FLOOR;
  const g = s.figs[0];
  const DS = RS.DOOR_S;
  const dw = RS.DOOR_W * DS;
  const dh = RS.DOOR_H * DS;
  const clip = (
    <defs>
      <clipPath id="doorway">
        <rect x={RS.DOOR_X} y={fl - dh} width={dw} height={dh} />
      </clipPath>
    </defs>
  );
  return (
    <Frame bg="#4A5A84">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={8}>
        {(layer) => [
          layer(0.15, <SkyGrad time="dusk" id="dsky" />),
          layer(1, (
            <g>
              {clip}
              <HouseFront floor={fl} doorX={RS.DOOR_X} dw={dw} dh={dh} lit={0.9} />
              <DoorwayInterior x={RS.DOOR_X} floor={fl} w={dw} h={dh} />
              {Boolean(s.inside) && <g clipPath="url(#doorway)" opacity={1 - 0.5 * prog(f, 160, 180)}><FigEl g={g} f={f} seed={9} /></g>}
              <Door x={RS.DOOR_X} floor={fl} angle={s.angle as number} s={DS} />
              {!s.inside ? <FigEl g={g} f={f} seed={9} /> : null}
              <Debug s={s} on={debug} />
            </g>
          )),
          layer(1.45, <PassBy f={f} x0={1500} speed={-2.2} y={1200} kind="post" s={1} />),
        ]}
      </CineCam>
      <LightPool x={1000} y={700} r={420} f={f} color="#FFB060" seed={8} strength={0.22} />
      <Look f={f} grade="dusk" vig={0.5} />
      <Label n={4} text="opening a door and walking through" f={f} />
    </Frame>
  );
};

const Office: React.FC<{f: number; debug: boolean}> = ({f, debug}) => {
  const s = RS.solveOffice(f);
  const fl = RS.OFFICE_FLOOR;
  const g = s.figs[0];
  const D = RS.OFFICE_DESK;
  return (
    <Frame bg="#7E6A52">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={10}>
        {(layer) => [
          layer(0.85, <Study f={f} floor={fl} windowX={1240} />, 2),
          layer(1, (
            <g>
              <Chair x={g.pl.x} floor={fl} h={s.seatH as number} />
              <WritingDesk x={D.x} floor={fl} w={D.w} h={D.h} />
              <OilLamp x={D.x + 100} y={fl - D.h} f={f} />
              <Rim kind="warm" side="r"><FigEl g={g} f={f} seed={11} /></Rim>
              {!s.hatOnHead && <PropAt def={STOVEPIPE} xf={s.hat as never} st={{f}} />}
              <Debug s={s} on={debug} />
            </g>
          )),
        ]}
      </CineCam>
      <GodRays x={1380} y={250} w={240} f={f} angle={-28} len={900} />
      <Look f={f} grade="day" vig={0.42} />
      <Label n={5} text="hat off, sit down at the desk, hat on the desk" f={f} />
    </Frame>
  );
};

const Reception: React.FC<{f: number; debug: boolean}> = ({f, debug}) => {
  const s = RS.solveReception(f);
  const [a, b] = s.figs;
  const ha = headWorld(a.pl, a.P, a.build);
  const hb = headWorld(b.pl, b.P, b.build);
  return (
    <Frame bg="#D8CCB0">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={12}>
        {(layer) => [
          layer(0.8, <ReceptionRoom f={f} floor={RS.REC_FLOOR} />, 3),
          layer(0.9, <g opacity={0.9}>{[260, 1500, 1640].map((x, i) => <Person key={i} id={i ? 'townswoman' : 'townsman'} x={x} y={RS.REC_FLOOR - 10} f={f} seed={20 + i} pose={undefined} lod="low" scale={0.92} dir={i ? -1 : 1} />)}</g>, 3),
          layer(1, (
            <g>
              <FigEl g={a} f={f} seed={13} />
              <FigEl g={b} f={f} seed={14} />
              {/* S22 (research-notes Q11): Lincoln's greeting, as Douglass later recalled it */}
              <Bubble kind="speech" text="Here comes my friend Douglass." f={f} at={40} x={ha.x - 150} y={ha.y - 200} tail={{x: ha.x - 20, y: ha.y + 10}} />
              {/* S22 (research-notes Q11): Douglass's words to Lincoln, from his own later account */}
              <Bubble kind="speech" text="Mr. Lincoln, that was a sacred effort." f={f} at={178} x={hb.x - 20} y={hb.y - 200} tail={{x: hb.x - 18, y: hb.y + 8}} />
              <Debug s={s} on={debug} />
            </g>
          )),
        ]}
      </CineCam>
      <Look f={f} grade="day" vig={0.45} />
      <Attribution text="Both lines as Frederick Douglass later recalled them (NPS, source S22)" x={960} y={872} t={prog(f, 40, 52)} />
      <Label n={6} text="handshake · documented speech bubbles" f={f} />
    </Frame>
  );
};

const Street: React.FC<{f: number; debug: boolean}> = ({f, debug}) => {
  const s = RS.solveStreet(f);
  const [boy, man, woman] = s.figs;
  const hb = headWorld(boy.pl, boy.P, true);
  const hw = headWorld(woman.pl, woman.P);
  return (
    <Frame bg="#9CC4D8">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={14}>
        {(layer) => [
          layer(0.2, <SkyGrad time="day" id="ssky" />),
          layer(0.9, <HouseFront floor={RS.STREET_FLOOR} doorX={1600} lit={0.2} />, 2),
          layer(1, (
            <g>
              <FigEl g={boy} f={f} seed={15} />
              <FigEl g={man} f={f} seed={16} />
              <FigEl g={woman} f={f} seed={17} />
              {/* illustrative people: generic lines, no facts */}
              <Bubble kind="shout" text="Extra! Extra!" f={f} at={0} x={hb.x + 150} y={hb.y - 170} tail={{x: hb.x + 30, y: hb.y + 6}} />
              <Bubble kind="thought" text="Is it true?" f={f} at={40} x={hw.x - 40} y={hw.y - 190} tail={{x: hw.x, y: hw.y - 50}} size={34} />
              <Debug s={s} on={debug} />
            </g>
          )),
        ]}
      </CineCam>
      <Look f={f} grade="day" vig={0.4} />
      <g opacity={prog(f, 30, 40) * (1 - prog(f, 118, 130))}>
        <rect x={60} y={830} width={760} height={44} rx={8} fill="rgba(11,11,13,0.72)" />
        <text x={80} y={860} fontFamily={FONT.sans} fontWeight={700} fontSize={22} fill="#F4EBD6">
          {`expression: ${String(man.ex?.expression)}`}
        </text>
      </g>
      <Label n={7} text="new expressions · shout and thought bubbles" f={f} />
    </Frame>
  );
};

const BUILD: Record<string, React.FC<{f: number; debug: boolean}>> = {woods: Woods, cabin: Cabin, write: Write, door: DoorShot, office: Office, reception: Reception, street: Street};
const TRANS: ShotDef['trans'][] = ['cut', 'dip', 'cut', 'page', 'whip', 'fade', 'iris'];

export const UpgradeTest: React.FC<{debug?: boolean}> = ({debug = false}) => {
  useCurrentFrame();
  let t = 0;
  const shots: ShotDef[] = RS.SHOTS.map((sh, i) => {
    const at = t / 30;
    t += sh.dur;
    const Comp = BUILD[sh.id];
    return {at, trans: TRANS[i], el: (f: number) => <Comp f={f} debug={debug} />};
  });
  return (
    <AbsoluteFill style={{background: '#0B0B0D'}}>
      <Shots start={0} end={RS.REEL_FRAMES / 30} shots={shots} overlap={12} />
      <ChannelLogo />
    </AbsoluteFill>
  );
};
