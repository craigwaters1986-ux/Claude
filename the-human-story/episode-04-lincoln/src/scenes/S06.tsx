// s06 · President of a breaking country (4:30–5:25). Storyboard shots 6.1–6.6.
// 6.1 Chicago convention (title plate in beat 0) · 6.2 Grace Bedell writes → match cut on the letter → Lincoln
// reads it; the push into the page carries the change to the bearded abePres · 6.3 the 1860 map (free / slave) ·
// 6.4 seven states peel away, South Carolina first; Jefferson Davis inset · 6.5 the Capitol, 4 March 1861 ·
// 6.6 Fort Sumter at night, distant flashes; the flag comes down on the silent beat.
import React from 'react';
import {Shots, Frame} from '../kit/Shots';
import {T, sectionWindow, beat} from '../timeline';
import {CineCam, CineDefs, TitlePlate, LightPool, GodRays, Rim, PassBy, LightLeak} from '../kit/Cinema';
import {PropAt, QUILL} from '../kit/Props';
import {Chair, Stool, WritingDesk} from '../kit/Seats';
import {SummaryPanel} from '../kit/Documents';
import {Study, OilLamp, WritingSlope, SkyGrad} from '../kit/Sets04';
import * as M from '../kit/USMap';
import {Stars} from '../kit/Places';
import {C, FONT} from '../styles/theme';
import {clamp, kf, prog, easeOut} from '../animations/core';
import {solveGrace, solveLetter, letterTimes, sf, GRACE_FLOOR, LETTER_FLOOR, LETTER_DESK} from './s06-solve';
import {FigEl, Look, DateCardF, FactLabel, SheetAt, WrittenLines, CrowdRow, ConventionHall, Kitchen, KitchenTable, DavisInset, HarbourNight, FortSilhouette, DistantFlash, HarbourSmoke} from './s06-sets';
import {CapitolShot, SumterFlag} from './s06-kitshots';

const [S, E] = sectionWindow('s06');
const A = {
  conv: S,
  grace: T('That October'),
  letter: T('wrote to him about a beard'),
  map: T('In November he won'),
  sec: T('Before he took office'),
  capitol: T('lay at the root of the crisis'),
  sumter: T('On the twelfth of April'),
};
const rel = (t: number, at: number) => sf(t - at);

// ---------------------------------------------------------------- 6.1 convention hall, crane down
const Convention: React.FC<{f: number; d: number}> = ({f, d}) => {
  const fl = 820;
  return (
    <Frame bg="#6A4C30">
      <CineDefs />
      <CineCam f={f} keys={[[0, 1.3, 960, 330], [90, 1.26, 960, 360], [d, 1.0, 960, 540]]} seed={61}>
        {(layer) => [
          layer(0.7, (
            <g>
              <ConventionHall f={f} floor={fl} />
              <CrowdRow f={f} y={250} x0={-600} x1={2500} n={30} s={0.4} seed={1} />
              <CrowdRow f={f + 5} y={fl} x0={-500} x1={2400} n={22} s={0.5} seed={5} />
            </g>
          ), 2),
          layer(0.85, <CrowdRow f={f + 7} y={900} x0={-500} x1={2400} n={18} s={0.62} seed={2} />),
          layer(0.95, <CrowdRow f={f + 3} y={990} x0={-400} x1={2300} n={15} s={0.78} seed={3} />),
          layer(1.2, <CrowdRow f={f + 11} y={1180} x0={-300} x1={2200} n={9} s={1.0} seed={4} back />, 3),
        ]}
      </CineCam>
      <LightPool x={960} y={360} r={900} f={f} color="#FFD08A" seed={61} strength={0.16} />
      <Look f={f} grade="golden" vig={0.5} amount={0.6} />
      <LightLeak f={f} t={1 - prog(f, 60, 100)} />
      <TitlePlate f={f} d={90} num={6} title="President of a breaking country" />
      <DateCardF f={f} at={96} until={d + 20} date="May 1860 · Chicago" />
    </Frame>
  );
};

// ---------------------------------------------------------------- 6.2a Grace Bedell writes
const Grace: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = solveGrace(f, d);
  const g = s.figs[0];
  const SL = s.slope as {x: number; y: number; w: number; h: number};
  const top = s.tableTop as number;
  return (
    <Frame bg="#D8C8A4">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={62}>
        {(layer) => [
          layer(0.85, <Kitchen f={f} floor={GRACE_FLOOR} />, 2),
          layer(1, (
            <g>
              <Stool x={g.pl.x} floor={GRACE_FLOOR} h={s.seatH as number} />
              <KitchenTable x={SL.x + 60} floor={GRACE_FLOOR} w={260} top={top} />
              <WritingSlope x={SL.x} y={SL.y} w={SL.w} h={SL.h} />
              <WrittenLines x={SL.x + 8} y={SL.y + 14} w={SL.w - 16} gap={12} n={3} u={s.u as number} seed={7} size={6} width={1.4} />
              <Rim kind="warm" side="r"><FigEl g={g} f={f} seed={62} /></Rim>
              <PropAt def={QUILL} xf={s.quill as never} st={{f}} />
            </g>
          )),
        ]}
      </CineCam>
      <GodRays x={1300} y={300} w={220} f={f} angle={-30} len={900} op={0.12} />
      <Look f={f} grade="day" vig={0.45} />
      <SummaryPanel title="Grace Bedell's letter" lines={['To Abraham Lincoln, October 1860', 'Her advice: grow a beard']} x={1150} y={170} w={700} t={prog(f, 14, 28) * (1 - prog(f, d - 10, d))} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 6.2b the letter arrives; the beard
const LetterShot: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = solveLetter(f);
  const g = s.figs[0];
  const {swap} = letterTimes();
  const flash = clamp(1 - Math.abs(f - swap) / 5);
  return (
    <Frame bg="#7E6A52">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={63}>
        {(layer) => [
          layer(0.85, <Study f={f} floor={LETTER_FLOOR} windowX={1360} />, 2),
          layer(1, (
            <g>
              <Chair x={g.pl.x} floor={LETTER_FLOOR} h={s.seatH as number} />
              <WritingDesk x={LETTER_DESK.x} floor={LETTER_FLOOR} w={LETTER_DESK.w} h={LETTER_DESK.h} />
              <OilLamp x={LETTER_DESK.x + 100} y={s.deskTop as number} f={f} />
              <Rim kind="warm" side="r"><FigEl g={g} f={f} seed={63} /></Rim>
              <SheetAt xf={s.letter as never} flat={s.flat as number} seed={11} lines={7} />
            </g>
          )),
        ]}
      </CineCam>
      <GodRays x={1460} y={240} w={240} f={f} angle={-28} len={900} op={0.12} />
      <Look f={f} grade="day" vig={0.45} />
      <rect width={1920} height={1080} fill="#FFF6E0" opacity={flash * 0.35} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 6.3 November 1860: free and slave states
const ElectionMap: React.FC<{f: number; d: number}> = ({f, d}) => {
  const proj = M.usProjection('NATION');
  const states: Record<string, M.StateStyle> = {};
  M.FREE_1860.forEach((c, i) => (states[c] = {fill: M.MAPC.free, t: prog(f, 12 + i * 2, 36 + i * 2)}));
  M.SLAVE_1860.forEach((c, i) => (states[c] = {fill: M.MAPC.slave, t: prog(f, 40 + i * 2, 64 + i * 2)}));
  return (
    <Frame bg={M.MAPC.sea}>
      <CineDefs />
      <CineCam f={f} keys={[[0, 1.0, 960, 470], [d, 1.14, 1120, 560]]} seed={64}>
        {(layer) => [layer(1, <M.USMap proj={proj} f={f} year={1860} id="el60" states={states} />)]}
      </CineCam>
      <M.Legend items={[{fill: M.MAPC.free, label: 'Free states'}, {fill: M.MAPC.slave, label: 'Slave states'}]} x={90} y={700} t={prog(f, 50, 70)} id="el" size={30} />
      <Look f={f} grade="day" vig={0.35} amount={0.6} />
      <DateCardF f={f} at={4} until={d + 20} date="November 1860" />
    </Frame>
  );
};

// ---------------------------------------------------------------- 6.4 secession: seven states, South Carolina first; Davis
const Secession: React.FC<{f: number; d: number}> = ({f, d}) => {
  const proj = M.usProjection('SOUTH');
  const peel = (i: number) => (i === 0 ? 10 : 46 + (i - 1) * 13);
  const confAt = rel(T('formed the Confederacy'), A.sec);
  const states: Record<string, M.StateStyle> = {};
  M.FREE_1860.forEach((c) => (states[c] = {fill: M.MAPC.union, t: 0.55}));
  M.SECESSION.forEach((s, i) => {
    const u = prog(f, peel(i), peel(i) + 14);
    states[s.code] = {fill: M.MAPC.confed, t: u, lift: 12 * u - 5 * prog(f, confAt, confAt + 20)};
  });
  const sc = M.stateCentre(proj, 'SC', 1861);
  return (
    <Frame bg={M.MAPC.sea}>
      <CineDefs />
      <CineCam f={f} keys={[[0, 1.18, 1180, 560], [confAt, 1.0, 960, 480], [d, 1.04, 900, 480]]} seed={65}>
        {(layer) => [layer(1, (
          <g>
            <M.USMap proj={proj} f={f} year={1861} id="sec61" states={states} />
            {M.SECESSION.map((s, i) => {
              const [x, y] = M.stateCentre(proj, s.code, 1861);
              const t = prog(f, peel(i) + 6, peel(i) + 16, easeOut);
              const lift = 12 * prog(f, peel(i), peel(i) + 14);
              return t > 0 ? (
                <g key={s.code} transform={`translate(${x},${y - lift + (s.code === 'SC' ? 34 : 0)}) scale(${t})`}>
                  <circle r={24} fill={C.darkRed} stroke={C.ink} strokeWidth={4} />
                  <text y={10} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={28} fill="#FFF">{i + 1}</text>
                </g>
              ) : null;
            })}
            <M.StateLabel proj={proj} code="SC" year={1861} t={prog(f, 16, 30)} size={26} dy={-26 - 12 * prog(f, 10, 24)} />
            <text x={sc[0] - 470} y={sc[1] + 200} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={46} letterSpacing={6} fill="#3E3226" stroke="#F4EBD6" strokeWidth={8} paintOrder="stroke" opacity={prog(f, confAt, confAt + 16)}>
              THE CONFEDERACY
            </text>
          </g>
        ))]}
      </CineCam>
      <Look f={f} grade="day" vig={0.35} amount={0.6} />
      <DavisInset f={f} t={prog(f, confAt - 4, confAt + 12)} x={1330} y={150} w={500} h={560} />
    </Frame>
  );
};

export const S06: React.FC = () => (
  <Shots
    start={S}
    end={E}
    shots={[
      {at: A.conv, el: (f, d) => <Convention f={f} d={d} />},
      {at: A.grace, trans: 'dip', el: (f, d) => <Grace f={f} d={d} />},
      {at: A.letter, trans: 'cut', el: (f, d) => <LetterShot f={f} d={d} />},
      {at: A.map, trans: 'cut', el: (f, d) => <ElectionMap f={f} d={d} />},
      {at: A.sec, trans: 'cut', el: (f, d) => <Secession f={f} d={d} />},
      {at: A.capitol, trans: 'fade', el: (f, d) => <CapitolShot f={f} d={d} />},
      {at: A.sumter, trans: 'cut', el: (f, d) => <SumterShot f={f} d={d} />},
    ]}
  />
);

// ---------------------------------------------------------------- 6.6 Fort Sumter at night (defined last: uses the flag kit)
const SumterShot: React.FC<{f: number; d: number}> = ({f, d}) => {
  const [b0] = beat('s06', 1);
  const fb = rel(b0, A.sumter); // the flag comes down on the silent beat
  const surr = rel(T('It surrendered'), A.sumter);
  const fortX = 1060;
  const waterY = 700;
  return (
    <Frame bg="#101A30">
      <CineDefs />
      <CineCam f={f} keys={[[0, 1.0, 960, 540], [fb - 30, 1.18, 1040, 560], [d, 1.62, fortX, 560]]} seed={66}>
        {(layer) => [
          layer(0.1, <g><SkyGrad time="night" id="sum-sky" /><Stars f={f} n={80} /></g>),
          layer(0.3, <path d="M-800,700 L-200,680 L200,690 L600,676 L900,694 L900,720 L-800,720Z" fill="#141C2C" />),
          layer(0.6, (
            <g>
              <HarbourNight f={f} fortX={fortX} waterY={waterY} />
              <SumterFlag f={f} x={fortX + 60} base={waterY + 50} h={400} lower={prog(f, fb + 6, fb + 96)} />
              <FortSilhouette x={fortX} y={waterY + 4} s={0.9} f={f} />
              {[0, 1, 2].map((i) => <DistantFlash key={i} x={fortX - 180 + i * 170} y={waterY - 60 - (i % 2) * 20} f={f} at={0} every={34 + i * 9} r={70} seed={i + 3} until={surr} />)}
              {[0, 1, 2].map((i) => <DistantFlash key={'s' + i} x={-200 + i * 380} y={690} f={f} at={6} every={40 + i * 7} r={44} seed={i + 9} until={surr} />)}
              <HarbourSmoke x={fortX - 120} y={waterY - 80} f={f} seed={4} />
              <HarbourSmoke x={fortX + 120} y={waterY - 70} f={f + 30} seed={5} />
            </g>
          )),
        ]}
      </CineCam>
      <Look f={f} grade="night" vig={0.6} />
      <DateCardF f={f} at={8} until={fb - 10} date="12 April 1861" sub="Fort Sumter" />
    </Frame>
  );
};
