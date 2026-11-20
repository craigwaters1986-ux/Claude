// s08 "Malice toward none" (Chapter 8, 6:55–8:00): the Hodges letter written at night, Atlanta and the
// 1864 election, the House vote on the Thirteenth Amendment (119 to 56), the Second Inaugural on the
// Capitol steps, the reception handshake with Frederick Douglass, Appomattox, the empty fields at dusk.
// Poses and contacts come from s08-solve.ts (checked by scripts/check-contacts.mjs).
import React from 'react';
import {Shots, Frame} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {CineCam, CineDefs, LightPool, GodRays, TitlePlate, PassBy, Rim, GradeLayer} from '../kit/Cinema';
import {PropAt, QUILL, InkPot} from '../kit/Props';
import {Chair, WritingDesk} from '../kit/Seats';
import {Attribution} from '../kit/Bubbles';
import {DocText, doc, layoutDoc} from '../kit/Documents';
import {SkyGrad, Ridge, TreeRow, Study, OilLamp, WritingSlope, ReceptionRoom} from '../kit/Sets04';
import {PaperHand} from '../kit/Paper';
import {PlaceTag} from '../kit/Places';
import {Birds} from '../components/Environment';
import {clamp, prog} from '../animations/core';
import * as S8 from './s08-solve';
import {FigEl, Look, IrisOpen, PageInsert, DeskTop, HouseChamber, ChamberRows, TallyBoard, Parlour, GrassField, RailFence, QuietLabel} from './s08-sets';
import {AtlantaShot, CapitolWide} from './s08-map';

const {A08} = S8;

// ---------------------------------------------------------------- 8.1 writing at night: MCU, then the Hodges lines under the nib
const Write81: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = S8.solveWrite81(f);
  const fl = S8.W81_FLOOR;
  const g = s.figs[0];
  const SL = S8.SLOPE81;
  const mix = prog(f, S8.INS_X, S8.INS_X + 16);
  const IL = s.insLayout as ReturnType<typeof S8.layout81>;
  const iq = s.insQuill as {x: number; y: number; rot: number; s: number; flip: boolean};
  const grip = s.insGrip as {x: number; y: number};
  const hs = 1.25;
  const hr = 24;
  const a = (hr * Math.PI) / 180;
  // PaperHand (mirrored) pinches the quill at local (60, 8): place its origin so that point sits on the grip
  const hx = grip.x - (Math.cos(a) * -60 * hs - Math.sin(a) * 8 * hs);
  const hy = grip.y - (Math.sin(a) * -60 * hs + Math.cos(a) * 8 * hs);
  const pageCam: [number, number, number, number][] = [[0, 1.0, 960, 470], [S8.INS_X, 1.0, 960, 470], [d, 1.1, 960 + (iq.x - 960) * 0.12, 470]];
  return (
    <Frame bg="#2A1E16">
      <CineDefs />
      {mix < 1 && (
        <g opacity={1 - mix}>
          <CineCam f={f} keys={s.cam} seed={81}>
            {(layer) => [
              layer(0.85, <Study f={f} floor={fl} night windowX={1300} />, 2),
              layer(1, (
                <g>
                  <Chair x={g.pl.x} floor={fl} h={s.seatH as number} />
                  <WritingDesk x={1000} floor={fl} w={320} h={100} />
                  <OilLamp x={1110} y={fl - 100} f={f} s={1.1} />
                  <InkPot x={958} y={fl - 100} />
                  <WritingSlope x={SL.x} y={SL.y} w={SL.w} h={SL.h} />
                  <DocText L={s.layout as never} reveal={s.reveal as number} id="s81-slope" />
                  <PropAt def={QUILL} xf={s.quill as never} st={{f}} />
                  <Rim kind="warm" side="r"><FigEl g={g} f={f} seed={7} /></Rim>
                </g>
              )),
            ]}
          </CineCam>
          <LightPool x={1250} y={560} r={820} f={f} color="#FFB060" seed={81} strength={0.32} />
        </g>
      )}
      {mix > 0 && (
        <g opacity={mix}>
          <CineCam f={f} keys={pageCam} seed={82}>
            {(layer) => [
              layer(1, (
                <g>
                  <DeskTop tone="night" />
                  <PageInsert d={doc('hodges')} L={IL} x={S8.PAGE81.x} y={S8.PAGE81.y} w={S8.PAGE81.w} h={S8.PAGE81.h} reveal={s.insReveal as number} f={f - S8.INS_X} id="s81-ins" />
                  <PropAt def={QUILL} xf={iq} st={{f}} />
                  <PaperHand x={hx} y={hy} rot={hr} s={hs} dir={-1} cuff="#1C1C20" />
                </g>
              )),
            ]}
          </CineCam>
          <LightPool x={1500} y={300} r={1000} f={f} color="#FFB060" seed={83} strength={0.34} />
        </g>
      )}
      <Look f={f} grade="lamp" vig={0.6} />
      <TitlePlate f={f} d={90} num={8} title="Malice toward none" />
      <IrisOpen f={f} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 8.3 the House chamber; the tally board turns (silent beat)
const House83: React.FC<{f: number; d: number}> = ({f, d}) => {
  const flipAt = Math.round((438.3 - A08.house) * 30); // silent beat 438.3–440.3 s
  const lookUp = prog(f, 120, 170);
  const cam: [number, number, number, number][] = [[0, 1.0, 960, 560], [110, 1.06, 960, 540], [flipAt - 6, 2.15, 960, 440], [d, 2.22, 960, 438]];
  return (
    <Frame bg="#CBB892">
      <CineDefs />
      <CineCam f={f} keys={cam} seed={83}>
        {(layer) => [
          layer(0.9, (
            <g>
              <HouseChamber f={f} lookUp={lookUp} />
              <TallyBoard x={960} y={430} f={f} at={flipAt} />
            </g>
          ), 0),
          layer(1.12, <ChamberRows f={f} lookUp={lookUp} />, f > 120 ? 3 : 0),
        ]}
      </CineCam>
      <GodRays x={300} y={160} w={260} f={f} angle={-24} len={900} op={0.1} />
      <Look f={f} grade="day" vig={0.48} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 8.4 the Capitol steps, then the readable page
const Capitol84: React.FC<{f: number; d: number}> = ({f, d}) => {
  const X = Math.round((443.0 - A08.capitol) * 30);
  const mix = prog(f, X, X + 14);
  const D = doc('secondInaugural');
  const P = {x: 250, y: 250, w: 1420, h: 470};
  const L = layoutDoc(D.text, D.hand, 46, P.w - 140, P.x + 70, P.y + 110, 1.42, 99);
  const reveal = prog(f, X + 6, d - 26, (t) => t);
  return (
    <Frame bg="#9CB4C8">
      <CineDefs />
      {mix < 1 && <g opacity={1 - mix}><CapitolWide f={f} d={d} /></g>}
      {mix > 0 && (
        <g opacity={mix}>
          <CineCam f={f} keys={[[0, 1.0, 960, 480], [X, 1.0, 960, 480], [d, 1.09, 960, 480]]} seed={84}>
            {(layer) => [
              layer(1, (
                <g>
                  <DeskTop tone="warm" />
                  <PageInsert d={D} L={L} x={P.x} y={P.y} w={P.w} h={P.h} reveal={reveal} f={f - X} id="s84-ins" />
                </g>
              )),
            ]}
          </CineCam>
          <Look f={f} grade="day" vig={0.5} />
        </g>
      )}
    </Frame>
  );
};

// ---------------------------------------------------------------- 8.5 the reception: Douglass and Lincoln shake hands (no invented words)
const Reception85: React.FC<{f: number; d: number}> = ({f}) => {
  const s = S8.solveReception85(f);
  const [a, b] = s.figs;
  const tAttr = prog(f, Math.round((455.19 - A08.reception) * 30), Math.round((455.19 - A08.reception) * 30) + 12);
  return (
    <Frame bg="#D8CCB0">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={85}>
        {(layer) => [
          layer(0.8, <ReceptionRoom f={f} floor={S8.REC85_FLOOR} />, 3),
          layer(0.9, <g>{[240, 420, 1500, 1660].map((x, i) => <Person key={i} id={i % 2 ? 'townswoman' : 'townsman'} x={x} y={S8.REC85_FLOOR - 10} f={f} seed={30 + i} lod="low" scale={0.92} dir={x > 960 ? -1 : 1} />)}</g>, 3),
          layer(1, (
            <g>
              <FigEl g={a} f={f} seed={13} />
              <FigEl g={b} f={f} seed={14} />
            </g>
          )),
        ]}
      </CineCam>
      <LightPool x={960} y={120} r={700} f={f} color="#FFE2A0" seed={85} strength={0.22} flicker={0.4} />
      <Look f={f} grade="day" vig={0.45} />
      {/* No bubbles: documents.json holds no exact text for this exchange; the narration carries the recalled words. */}
      <Attribution text="as Frederick Douglass later recalled" x={960} y={870} t={tAttr} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 8.6 Appomattox: a quiet handshake
const Appomattox86: React.FC<{f: number; d: number}> = ({f}) => {
  const s = S8.solveAppomattox(f);
  const [a, b] = s.figs;
  const tDate = prog(f, 8, 22) * (1 - prog(f, 230, 250));
  return (
    <Frame bg="#B9A67E">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={86}>
        {(layer) => [
          layer(0.9, <Parlour f={f} floor={S8.APP_FLOOR} />, 2),
          layer(1, (
            <g>
              <Rim kind="cool" side="l"><FigEl g={a} f={f} seed={21} labelSide="left" /></Rim>
              <Rim kind="cool" side="l"><FigEl g={b} f={f} seed={22} labelSide="right" /></Rim>
            </g>
          )),
        ]}
      </CineCam>
      <GodRays x={330} y={260} w={260} f={f} angle={-30} len={900} op={0.14} />
      <Look f={f} grade="day" vig={0.5} />
      <PlaceTag text="9 April 1865" t={tDate} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 8.7 empty fields at dusk (sombre)
const Fields87: React.FC<{f: number; d: number}> = ({f, d}) => {
  const cam: [number, number, number, number][] = [[0, 1.24, 1010, 565], [d + 40, 0.94, 910, 535]]; // keeps moving to the last frame (Phase D: wider move, the first pass froze 2.0 s)
  const tLab = prog(f, 26, 54);
  return (
    <Frame bg="#4A5A84">
      <CineDefs />
      <CineCam f={f} keys={cam} seed={87}>
        {(layer) => [
          layer(0.12, <SkyGrad time="dusk" id="s87sky" />),
          layer(0.15, <circle cx={1380} cy={560 + f * 0.05} r={70} fill="#F2B08A" opacity={0.7} />),
          layer(0.25, <g transform={`translate(${-f * 0.12},0)`}><Birds f={f * 0.6} n={3} seed={8} y={240} /></g>),
          layer(0.35, <Ridge y={640} color="#5A5A6A" seed={7} amp={60} />, 3),
          layer(0.5, <TreeRow y={690} f={f} n={12} s={0.8} color="#3E4636" seed={6} kind="round" />, 2),
          layer(0.7, (
            <g>
              <rect x={-900} y={700} width={3800} height={800} fill="#5E6440" />
              <GrassField y={720} f={f} n={140} s={0.6} color="#4A5232" seed={3} />
              <RailFence x={80} y={790} n={6} s={0.7} />
            </g>
          )),
          layer(1, (
            <g>
              <rect x={-900} y={820} width={3800} height={800} fill="#535A38" />
              <GrassField y={830} f={f} n={110} s={1.1} color="#3E4628" seed={5} />
            </g>
          )),
          layer(1.4, <PassBy f={f} x0={-260} speed={0.6} y={1160} kind="grass" s={1.8} />),
        ]}
      </CineCam>
      <GradeLayer grade="dusk" />
      <Look f={f} grade="sombre" vig={0.62} />
      <QuietLabel text="620,000–750,000 dead (est.)" y={380} t={tLab} size={66} />
    </Frame>
  );
};

export const S08: React.FC = () => (
  <Shots
    start={S8.S08_S}
    end={S8.S08_E}
    shots={[
      {at: A08.write, el: (f, d) => <Write81 f={f} d={d} />},
      {at: A08.atlanta, trans: 'whip', el: (f, d) => <AtlantaShot f={f} d={d} />},
      {at: A08.house, trans: 'cut', el: (f, d) => <House83 f={f} d={d} />},
      {at: A08.capitol, trans: 'page', el: (f, d) => <Capitol84 f={f} d={d} />},
      {at: A08.reception, trans: 'cut', el: (f, d) => <Reception85 f={f} d={d} />},
      {at: A08.appomattox, trans: 'fade', el: (f, d) => <Appomattox86 f={f} d={d} />},
      {at: A08.fields, trans: 'dip', el: (f, d) => <Fields87 f={f} d={d} />},
    ]}
  />
);
void clamp;
