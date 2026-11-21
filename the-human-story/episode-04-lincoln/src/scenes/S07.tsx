// s07 · War and emancipation (5:25–6:55). Storyboard shots 7.1–7.10.
// 7.1 Bull Run map (title plate in beat 0) · 7.2 Willie's empty bed at dawn (sombre) · 7.3 the Greeley letter ·
// 7.4 the Cabinet passes the draft hand to hand · 7.5 the signing, then the Proclamation's key phrase ·
// 7.6 where it applied · 7.7 Black soldiers enlist and march; Douglass recruits · 7.8 Gettysburg at dusk ·
// 7.9 10 August 1863: Douglass at the White House door · 7.8 (return) the cemetery, silent beat · 7.10 the Bliss copy.
import React from 'react';
import {Shots, Frame} from '../kit/Shots';
import {T, sectionWindow, beat} from '../timeline';
import {CineCam, CineDefs, TitlePlate, LightPool, GodRays, Rim, PassBy} from '../kit/Cinema';
import {PropAt, QUILL, Door, DOOR_W, DOOR_H, InkPot} from '../kit/Props';
import {Chair, WritingDesk} from '../kit/Seats';
import {DocSheet, DocText, doc, layoutDoc, measure, nibAt, DOC_FONT} from '../kit/Documents';
import {Study, OilLamp, WritingSlope, SkyGrad} from '../kit/Sets04';
import * as M from '../kit/USMap';
import {Person} from '../kit/Cast';
import {C, FONT} from '../styles/theme';
import {clamp, kf, prog, easeInOut} from '../animations/core';
import {stand} from '../characters/poses';
import {sf} from './s06-solve';
import {solveWillie, solveCabinet, solveSign, solveRecruit, solveMeeting, WILLIE_FLOOR, CAB_FLOOR, CAB_TABLE_TOP, SIGN_FLOOR, SIGN_SLOPE, REC_FLOOR, RECRUIT_TABLE, DOOR_FLOOR, DOOR_X, DOOR_S} from './s07-solve';
import {FigEl, Look, DateCardF, FactLabel, SheetAt, WrittenLines, CrowdRow} from './s06-sets';
import {Bedroom, SmallBed, CabinetRoom, CabinetTable, RecruitStreet, RecruitTable, MarchingColumn, Fields, CemeteryRows, WhiteHouseFront, WHInterior, DocDesk, MapArrow} from './s07-sets';

const [S, E] = sectionWindow('s07');
const A = {
  bull: S,
  willie: T('his son Willie died'),
  greeley: T('In August he wrote publicly'),
  cabinet: T('shown his Cabinet a draft'),
  sign: T('On the first of January'),
  procDoc: T('the Emancipation Proclamation declared'),
  procMap: T('It could not free anyone'),
  recruit: T('It also opened the army'),
  gettys: T('In July the Union won'),
  meeting: T('Frederick Douglass protested'), // John North: 'That August,' stays on the Gettysburg shot, which would otherwise be 3 s
  cemetery: T('In November, Lincoln helped'),
  bliss: T('The signed copy begins'),
};
const rel = (t: number, at: number) => sf(t - at);

// ---------------------------------------------------------------- 7.1 Bull Run
const BULL_VIEW: M.USView = {lon0: -78.7, lat0: 38.25, lon1: -76.3, lat1: 39.55};
const BullRun: React.FC<{f: number; d: number}> = ({f, d}) => {
  const proj = M.usProjection(BULL_VIEW);
  const w = proj(M.PLACES.Washington)!;
  const b = proj(M.PLACES.BullRun)!;
  const fd = rel(T('defeat at Bull Run'), A.bull);
  const toward: [number, number] = [b[0] + (w[0] - b[0]) * 0.22, b[1] + (w[1] - b[1]) * 0.22 - 10];
  const adv = prog(f, 40, fd + 10);
  const back = prog(f, fd + 22, fd + 70);
  return (
    <Frame bg={M.MAPC.sea}>
      <CineDefs />
      <CineCam f={f} keys={[[0, 1.0, 960, 470], [d, 1.12, (w[0] + b[0]) / 2, (w[1] + b[1]) / 2]]} seed={71}>
        {(layer) => [layer(1, (
          <g>
            <M.USMap proj={proj} f={f} year={1861} id="bull" states={{VA: {fill: M.MAPC.confed, t: 0.7}, MD: {fill: M.MAPC.union, t: 0.5}, DE: {fill: M.MAPC.union, t: 0.5}, PA: {fill: M.MAPC.union, t: 0.5}}} />
            <M.StateLabel proj={proj} code="VA" year={1861} text="VIRGINIA" dx={-140} dy={150} size={40} />
            <M.StateLabel proj={proj} code="MD" year={1861} text="MARYLAND" dx={-60} dy={-60} size={40} />
            <g opacity={1 - back * 0.65}><MapArrow a={[w[0] + 10, w[1] + 20]} b={toward} t={adv} color={M.MAPC.union} bend={0.15} /></g>
            <MapArrow a={[toward[0] + 30, toward[1] - 40]} b={[w[0] - 30, w[1] - 30]} t={back} color="#7FA3CC" bend={0.25} dashed w={13} />
            <M.BattleMarker proj={proj} at={M.PLACES.BullRun} label="Bull Run" t={prog(f, fd - 6, fd + 10)} side="left" s={1.5} size={40} />
            <M.PlaceDot proj={proj} at={M.PLACES.Washington} label="Washington" t={prog(f, 10, 24)} side="right" size={38} dot={14} />
          </g>
        ))]}
      </CineCam>
      <Look f={f} grade="day" vig={0.4} amount={0.6} />
      {/* Phase D2: the plate lasts the card beat (2.5 s) and the date card follows the marker (they were fixed at 90 and 94) */}
      <TitlePlate f={f} d={Math.round((beat('s07', 0)[1] - beat('s07', 0)[0]) * 30)} num={7} title="War and emancipation" />
      <DateCardF f={f} at={fd + 18} until={d + 20} date="Bull Run, July 1861" />
    </Frame>
  );
};

// ---------------------------------------------------------------- 7.2 Willie's room at dawn (sombre)
const Willie: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = solveWillie(f);
  const g = s.figs[0];
  return (
    <Frame bg="#B8A890">
      <CineDefs />
      <CineCam f={f} keys={[[0, 1.2, 1000, 640], [d, 1.38, 1010, 660]]} seed={72}>
        {(layer) => [
          layer(0.9, <Bedroom f={f} floor={WILLIE_FLOOR} />, 2),
          layer(1, (
            <g>
              <SmallBed x={1180} floor={WILLIE_FLOOR} />
              <Chair x={g.pl.x} floor={WILLIE_FLOOR} h={s.seatH as number} />
              <Rim kind="cool" side="r"><FigEl g={g} f={f * 0.5} seed={72} /></Rim>
            </g>
          )),
        ]}
      </CineCam>
      <GodRays x={1560} y={260} w={240} f={f} angle={-34} len={1000} color="#FFE0C8" op={0.14} />
      <Look f={f} grade="dawn" vig={0.6} />
      <Look f={f} grade="sombre" vig={0.2} />
      <FactLabel f={f} at={16} until={d + 20} text="Willie Lincoln, 1850–1862" x={1820} y={160} anchor="end" size={40} tone="paper" />
    </Frame>
  );
};

// ---------------------------------------------------------------- 7.3 the Greeley letter (readable, exact)
const Greeley: React.FC<{f: number; d: number}> = ({f, d}) => {
  const dc = doc('greeley');
  const a = rel(T('My paramount object'), A.greeley);
  const b = rel(T('or to destroy slavery', 0, 'end'), A.greeley);
  return (
    <Frame bg="#4A3424">
      <CineDefs />
      <CineCam f={f} keys={[[0, 1.0, 960, 520], [d, 1.1, 980, 500]]} seed={73}>
        {(layer) => [
          layer(0.6, <DocDesk f={f} />),
          layer(1, <DocSheet d={dc} x={250} y={300} w={1420} h={330} size={56} reveal={prog(f, a - 4, b - 8, (t) => t)} rot={-1} f={f} maxWords={9} />),
        ]}
      </CineCam>
      <LightPool x={900} y={500} r={1000} f={f} color="#FFC070" seed={73} strength={0.18} />
      <Look f={f} grade="lamp" vig={0.5} amount={0.6} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 7.4 Cabinet, July 1862: the draft passes hand to hand
const Cabinet: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = solveCabinet(f);
  return (
    <Frame bg="#5E6A52">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={74}>
        {(layer) => [
          layer(0.85, <CabinetRoom f={f} floor={CAB_FLOOR} />, 2),
          layer(1, (
            <g>
              {s.figs.map((g, i) => (
                <g key={i}>
                  <Chair x={g.pl.x} floor={CAB_FLOOR} h={56} dir={g.pl.dir} />
                  <FigEl g={g} f={f} seed={74 + i} />
                </g>
              ))}
              <CabinetTable x0={380} x1={1460} top={CAB_TABLE_TOP} floor={CAB_FLOOR} />
              <SheetAt xf={s.draft as never} seed={21} lines={7} />
            </g>
          )),
        ]}
      </CineCam>
      <LightPool x={950} y={420} r={800} f={f} color="#FFD8A0" seed={74} strength={0.16} />
      <Look f={f} grade="day" vig={0.55} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 7.5a the signing (1 January 1863)
const Sign: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = solveSign(f, d);
  const g = s.figs[0];
  const SL = SIGN_SLOPE;
  return (
    <Frame bg="#3A2A1E">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={75}>
        {(layer) => [
          layer(0.85, <Study f={f} floor={SIGN_FLOOR} night windowX={1300} />, 2),
          layer(1, (
            <g>
              <Chair x={g.pl.x} floor={SIGN_FLOOR} h={s.seatH as number} />
              <WritingDesk x={1000} floor={SIGN_FLOOR} w={320} h={100} />
              <OilLamp x={1110} y={SIGN_FLOOR - 100} f={f} s={1.1} />
              <InkPot x={958} y={SIGN_FLOOR - 100} />
              <WritingSlope x={SL.x} y={SL.y} w={SL.w} h={SL.h} />
              <WrittenLines x={SL.x + 10} y={SL.y + 14} w={SL.w - 20} gap={10} n={4} u={1} seed={31} size={4} width={1.1} />
              <WrittenLines x={SL.x + 40} y={SL.y + 62} w={SL.w - 56} gap={0} n={1} u={s.u as number} seed={33} size={8} width={2} />
              {/* quill behind the figure: the feather passes behind the head */}
              <PropAt def={QUILL} xf={s.quill as never} st={{f}} />
              <FigEl g={g} f={f} seed={75} />
            </g>
          )),
        ]}
      </CineCam>
      <LightPool x={1250} y={500} r={900} f={f} color="#FFB060" seed={75} strength={0.3} />
      <Look f={f} grade="lamp" vig={0.55} />
      <DateCardF f={f} at={6} until={d + 30} date="1 January 1863" />
    </Frame>
  );
};

// ---------------------------------------------------------------- 7.5b the Proclamation's key phrase (exact)
const ProcDoc: React.FC<{f: number; d: number}> = ({f, d}) => {
  const dc = doc('emancipation');
  const W = 1460;
  const size = 56;
  const pad = 56;
  const L = layoutDoc(dc.text, dc.hand, size, W - pad * 2, pad, pad + size, 1.3, 8);
  const phrase = 'are, and henceforward shall be free';
  const p0 = dc.text.indexOf(phrase);
  const p1 = p0 + phrase.length;
  const hl = prog(f, rel(T('as slaves in the rebel states'), A.procDoc) + 40, rel(T('and henceforward shall be free'), A.procDoc) + 30);
  const reveal = prog(f, 0, rel(T('and henceforward shall be free', 0, 'end'), A.procDoc) - 10, (t) => t);
  const X = 230;
  const Y = 260;
  return (
    <Frame bg="#3A2A1E">
      <CineDefs />
      <CineCam f={f} keys={[[0, 1.0, 960, 520], [d * 0.55, 1.05, 960, 520], [d, 1.22, 1000, 600]]} seed={76}>
        {(layer) => [
          layer(0.6, <DocDesk f={f} tone="#3A2A1E" />),
          layer(1, (
            <g>
              <DocSheet d={dc} x={X} y={Y} w={W} h={L.height + pad * 2 + 10} size={size} reveal={reveal} f={f} maxWords={8} />
              {/* Phase D2: the highlight is drawn over the sheet (multiply), it used to sit under the opaque paper and never showed */}
              <g transform={`translate(${X},${Y})`} style={{mixBlendMode: 'multiply'}}>
                {L.lines.map((ln, i) => {
                  const a0 = Math.max(p0, ln.start);
                  const a1 = Math.min(p1, ln.end, reveal * L.chars); // never ahead of the write-on
                  if (a1 <= a0) return null;
                  const x0 = ln.x + measure(ln.text.slice(0, a0 - ln.start), size, dc.hand);
                  const x1 = ln.x + measure(ln.text.slice(0, a1 - ln.start), size, dc.hand);
                  return <rect key={i} x={x0 - 6} y={ln.y - size * 0.85} width={(x1 - x0 + 12) * hl} height={size * 1.12} rx={6} fill="#E3C77A" opacity={0.6} />;
                })}
              </g>
            </g>
          )),
        ]}
      </CineCam>
      <Look f={f} grade="lamp" vig={0.5} amount={0.5} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 7.6 where the Proclamation applied
const ProcMap: React.FC<{f: number; d: number}> = ({f, d}) => {
  const proj = M.usProjection('SOUTH');
  const states: Record<string, M.StateStyle> = {};
  [...M.FREE_1860, 'KS', 'WV'].forEach((c) => (states[c] = {fill: M.MAPC.union, t: 0.45}));
  M.PROCLAMATION_SHADED.forEach((c, i) => (states[c] = {fill: '#9A5E44', t: prog(f, 6 + i * 4, 26 + i * 4), hatch: prog(f, 20 + i * 4, 40 + i * 4)}));
  const tb = rel(T('left slavery untouched'), A.procMap);
  [...M.BORDER_STATES, 'TN'].forEach((c) => (states[c] = {outline: prog(f, tb, tb + 10) > 0.5 ? C.dustyYellow : undefined}));
  return (
    <Frame bg={M.MAPC.sea}>
      <CineDefs />
      <CineCam f={f} keys={[[0, 1.0, 960, 500], [d, 1.08, 1040, 540]]} seed={77}>
        {(layer) => [layer(1, (
          <g>
            <M.USMap proj={proj} f={f} year={1863} wv="separate" id="proc" states={states} />
            <M.ExceptedAreas proj={proj} id="proc" t={prog(f, tb, tb + 16)} />
            {['KY', 'MO', 'MD', 'TN'].map((c) => <M.StateLabel key={c} proj={proj} code={c} year={1863} t={prog(f, tb + 4, tb + 18)} size={24} />)}
          </g>
        ))]}
      </CineCam>
      <M.Legend items={[{fill: '#9A5E44', label: 'Rebel states (shaded)', hatch: true}]} x={90} y={760} t={prog(f, 30, 46)} id="proc" size={28} />
      <M.MapNote text={M.EXCEPTED_NOTE} x={1830} y={740} anchor="end" t={prog(f, tb + 10, tb + 24)} />
      <Look f={f} grade="day" vig={0.35} amount={0.5} />
      <FactLabel f={f} at={tb} until={d + 20} text="Did not apply: border states and excepted areas" x={1090} y={770} size={40} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 7.7 Black soldiers enlist and march; Douglass recruits
const Recruit: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = solveRecruit(f, d);
  const [dg, rc] = s.figs;
  const SL = s.slope as {x: number; y: number; w: number; h: number};
  const t200 = rel(T('nearly two hundred thousand served'), A.recruit);
  return (
    <Frame bg="#B8D0DC">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={78}>
        {(layer) => [
          layer(0.2, <SkyGrad time="day" id="rec-sky" />),
          layer(0.75, <RecruitStreet f={f} floor={REC_FLOOR} />, 2),
          layer(0.82, <MarchingColumn f={f} y={760} x0={1226 - 1.9 * d} n={14} gap={92} s={0.6} speed={1.9} seed={2} />, 2),
          layer(1, (
            <g>
              {/* Phase D2: x0 follows the shot length so the lead man stops short of the recruiting table, as in the first render */}
              <MarchingColumn f={f} y={810} x0={1130 - 2.2 * d} n={12} gap={104} s={0.74} speed={2.2} lod="full" seed={3} />
              {[860, 950].map((x, i) => <Person key={i} id={i ? 'recruit' : 'recruit2'} x={x} y={REC_FLOOR + 10} scale={0.98} dir={1} pose={stand(f + i * 20, 80 + i)} f={f} seed={80 + i} expression="determined" look={[0.8, 0]} />)}
              <FigEl g={rc} f={f} seed={79} />
              <RecruitTable x={RECRUIT_TABLE.x} floor={REC_FLOOR} w={RECRUIT_TABLE.w} h={RECRUIT_TABLE.h} />
              <WritingSlope x={SL.x} y={SL.y} w={SL.w} h={SL.h} />
              <WrittenLines x={SL.x + SL.w - 10} y={SL.y + 16} w={-(SL.w - 22)} gap={13} n={3} u={s.u as number} seed={41} size={6} width={1.4} />
              <Chair x={dg.pl.x} floor={REC_FLOOR} h={s.seatH as number} dir={-1} />
              {/* quill behind the figure: the feather passes behind the head */}
              <PropAt def={QUILL} xf={s.quill as never} st={{f}} />
              <FigEl g={dg} f={f} seed={78} />
            </g>
          )),
        ]}
      </CineCam>
      <Look f={f} grade="day" vig={0.4} />
      <FactLabel f={f} at={t200} until={d + 20} text="nearly 200,000 served" x={960} y={150} size={46} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 7.8a Gettysburg at dusk (sombre; no bodies)
const Gettysburg: React.FC<{f: number; d: number}> = ({f, d}) => (
  <Frame bg="#4A5A84">
    <CineDefs />
    <CineCam f={f} keys={[[0, 1.12, 960, 620], [d, 1.0, 960, 520]]} seed={79}>
      {(layer) => [
        layer(0.15, <SkyGrad time="dusk" id="get-sky" />),
        layer(0.15, <circle cx={1300} cy={520} r={90} fill="#F2B080" opacity={0.7} />),
        layer(0.8, <Fields f={f} horizon={620} />),
      ]}
    </CineCam>
    <Look f={f} grade="dusk" vig={0.6} />
    <Look f={f} grade="sombre" vig={0.2} />
    <FactLabel f={f} at={20} until={d + 20} text="50,000+ casualties (est.)" x={1830} y={160} anchor="end" size={42} />
  </Frame>
);

// ---------------------------------------------------------------- 7.9 10 August 1863: Douglass at the White House door
const Meeting: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = solveMeeting(f);
  const [li, dg] = s.figs;
  const dw = DOOR_W * DOOR_S;
  const dh = DOOR_H * DOOR_S;
  return (
    <Frame bg="#EDE8DC">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={80}>
        {(layer) => [
          layer(1, (
            <g>
              <defs><clipPath id="wh-door"><rect x={DOOR_X} y={DOOR_FLOOR - dh} width={dw} height={dh} /></clipPath></defs>
              <WhiteHouseFront floor={DOOR_FLOOR} doorX={DOOR_X} dw={dw} dh={dh} />
              <WHInterior x={DOOR_X} floor={DOOR_FLOOR} w={dw} h={dh} />
              {s.insideA ? <g clipPath="url(#wh-door)"><FigEl g={li} f={f} seed={81} /></g> : null}
              <Door x={DOOR_X} floor={DOOR_FLOOR} angle={s.angle as number} s={DOOR_S} color="#5A3A28" />
              {!s.insideA ? <FigEl g={li} f={f} seed={81} /> : null}
              <FigEl g={dg} f={f} seed={82} />
            </g>
          )),
          layer(1.4, <PassBy f={f} x0={1850} speed={-1.2} y={1200} kind="post" s={0.7} />),
        ]}
      </CineCam>
      <Look f={f} grade="day" vig={0.45} />
      <DateCardF f={f} at={6} until={d + 20} date="10 August 1863" sub="White House" />
    </Frame>
  );
};

// ---------------------------------------------------------------- 7.8 (return) the cemetery rows at dusk, silent beat
const Cemetery: React.FC<{f: number; d: number}> = ({f, d}) => {
  const fb = rel(T('dedicate a cemetery there', 0, 'end'), A.cemetery);
  return (
    <Frame bg="#4A5A84">
      <CineDefs />
      <CineCam f={f} keys={[[0, 1.18, 960, 660], [d, 1.0, 960, 470]]} seed={83}>
        {(layer) => [
          layer(0.15, <SkyGrad time="dusk" id="cem-sky" />),
          layer(0.4, <path d="M-900,520 Q0,470 900,500 T2900,490 V1400 H-900Z" fill="#4E5A3E" stroke={C.ink} strokeWidth={3} />),
          layer(0.55, (
            <g opacity={1 - prog(f, fb, fb + 40)}>
              <rect x={1380} y={470} width={220} height={40} fill="#6A4A30" stroke={C.ink} strokeWidth={3} />
              <CrowdRow f={f} y={520} x0={1200} x1={1800} n={14} s={0.3} seed={8} mood="listen" />
            </g>
          )),
          layer(0.8, (
            <g>
              <path d="M-900,580 Q0,540 900,570 T2900,560 V1500 H-900Z" fill="#5E6A44" stroke={C.ink} strokeWidth={3} />
              <CemeteryRows f={f} cx={960} cy={560} rows={7} />
            </g>
          )),
        ]}
      </CineCam>
      <Look f={f} grade="dusk" vig={0.62} />
      <Look f={f} grade="sombre" vig={0.2} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 7.10 the Bliss copy: the opening words (exact)
const Bliss: React.FC<{f: number; d: number}> = ({f, d}) => {
  const dc = doc('bliss');
  const text = dc.text.split('\n')[0];
  const size = 70;
  const X = 160;
  const Y = 200;
  const W = 1600;
  const L = layoutDoc(text, dc.hand, size, W - 140, X + 70, Y + 70 + size, 1.45);
  const a = rel(T('Four score and seven years ago'), A.bliss);
  const b = rel(T('men are created equal', 0, 'end'), A.bliss); // Phase D2: the end of the cue (was its start + 30 frames)
  const at = (g: number) => nibAt(L, prog(g, a, b, (t) => t));
  const sm = [-12, -6, 0, 6, 12].map((k) => at(f + k));
  const nx = sm.reduce((p, q) => p + q.x, 0) / sm.length;
  const ny = sm.reduce((p, q) => p + q.y, 0) / sm.length;
  const hold = prog(f, b + 10, b + 70, easeInOut);
  const z = kf(f, [[0, 1.0], [a, 1.55], [b + 10, 1.55], [b + 70, 1.0]]);
  const cx = (1 - hold) * (f < a ? kf(f, [[0, 960], [a, nx]]) : nx) + hold * 960;
  const cy = (1 - hold) * (f < a ? kf(f, [[0, 520], [a, ny]]) : ny) + hold * 520;
  const ft = DOC_FONT[dc.hand];
  void ft;
  void z; void cx; void cy; void hold;
  return (
    <Frame bg="#3A2A1E">
      <CineDefs />
      {/* Phase D: steady slow push over the whole page (the camera no longer chases the nib, which read as dizzy) */}
      <CineCam f={f} keys={[[0, 1.0, 960, 500], [d, 1.12, 960, 470]]} seed={84}>
        {(layer) => [
          layer(0.6, <DocDesk f={f} tone="#3A2A1E" />),
          layer(1, (
            <g>
              <rect x={X + 10} y={Y + 14} width={W} height={L.height + 160} fill="rgba(0,0,0,0.3)" />
              <rect x={X} y={Y} width={W} height={L.height + 160} fill="#EFE2C2" stroke={C.ink} strokeWidth={4} />
              <DocText L={L} id="bliss-open" />
              {f >= a - 10 && f < b + 40 && <ellipse cx={nx - 120} cy={ny - size * 0.35} rx={330} ry={size * 0.75} fill="#FFE6A0" opacity={0.2 * prog(f, a - 10, a + 10) * (1 - prog(f, b + 10, b + 40))} style={{mixBlendMode: 'multiply'}} />}
            </g>
          )),
        ]}
      </CineCam>
      <LightPool x={960} y={480} r={1000} f={f} color="#FFC070" seed={84} strength={0.2} />
      <Look f={f} grade="lamp" vig={0.55} amount={0.6} />
      <g opacity={prog(f, 10, 26)}>
        <rect x={1840 - dc.title.length * 12.5 - 40} y={846} width={dc.title.length * 12.5 + 40} height={44} rx={8} fill="rgba(20,18,16,0.82)" />
        <text x={1820} y={876} textAnchor="end" fontFamily={FONT.sans} fontWeight={700} fontSize={22} fill="#F4EBD6">{dc.title}</text>
      </g>
    </Frame>
  );
};

export const S07: React.FC = () => (
  <Shots
    start={S}
    end={E}
    shots={[
      {at: A.bull, el: (f, d) => <BullRun f={f} d={d} />},
      {at: A.willie, trans: 'dip', el: (f, d) => <Willie f={f} d={d} />},
      {at: A.greeley, trans: 'page', el: (f, d) => <Greeley f={f} d={d} />},
      {at: A.cabinet, trans: 'cut', el: (f, d) => <Cabinet f={f} d={d} />},
      {at: A.sign, trans: 'cut', el: (f, d) => <Sign f={f} d={d} />},
      {at: A.procDoc, trans: 'cut', el: (f, d) => <ProcDoc f={f} d={d} />},
      {at: A.procMap, trans: 'whip', el: (f, d) => <ProcMap f={f} d={d} />},
      {at: A.recruit, trans: 'cut', el: (f, d) => <Recruit f={f} d={d} />},
      {at: A.gettys, trans: 'fade', el: (f, d) => <Gettysburg f={f} d={d} />},
      {at: A.meeting, trans: 'cut', el: (f, d) => <Meeting f={f} d={d} />},
      {at: A.cemetery, trans: 'fade', el: (f, d) => <Cemetery f={f} d={d} />},
      {at: A.bliss, trans: 'page', el: (f, d) => <Bliss f={f} d={d} />},
    ]}
  />
);
