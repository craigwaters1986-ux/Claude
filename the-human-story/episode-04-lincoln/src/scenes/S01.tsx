// s01 · Two minutes (0:00–0:35) · cold open. Storyboard 1.1–1.4:
// 1.1 ECU the Bliss copy writes on under lamplight · 1.2 two lecterns at dusk, two clocks (two hours / two
// minutes) · 1.3 five copies fan out, one stays bright (signed) and is seen framed in a quiet room ·
// 1.4 MCU the quill is laid down, then the page dissolves into the title plate over the cabin woods.
import React from 'react';
import {Shots, Frame, sf} from '../kit/Shots';
import {Person, CAST} from '../kit/Cast';
import {CineCam, CineDefs, GradeLayer, Grain, Vig, LightPool, GodRays, TitlePlate, LightLeak, PassBy, Rim} from '../kit/Cinema';
import {PropAt, QUILL, InkPot} from '../kit/Props';
import {Chair, WritingDesk} from '../kit/Seats';
import {DocText, doc, layoutDoc, DOC_FONT} from '../kit/Documents';
import {SkyGrad, Ridge, TreeRow, Clearing, CabinExterior, Study, OilLamp, WritingSlope, RailPile} from '../kit/Sets04';
import {Sheet, Hand} from '../kit/Paper';
import {Birds} from '../components/Environment';
import {Particles} from '../components/Effects';
import {T, beat, sectionWindow} from '../timeline';
import {C, FONT} from '../styles/theme';
import {clamp, easeInOut, easeOut, hash, kf, noise1, prog} from '../animations/core';
import * as S1 from './s01-solve';
import type {Fig} from './reelSolve';

const [S, E] = sectionWindow('s01');
const ink = C.ink;
const castS = (id: string) => CAST[id].scale ?? 1;

const FigEl: React.FC<{g: Fig; f: number; seed?: number}> = ({g, f, seed = 1}) => (
  <Person
    id={g.id} x={g.pl.x} y={g.pl.y} scale={(g.pl.scale ?? 1) / castS(g.id)} dir={g.pl.dir} pose={g.P} f={f} seed={seed}
    look={g.look} talking={g.talking} tag={g.tag} fromBehind={g.fromBehind} eyesClosed={g.eyesClosed}
    head={{...(g.ex ? {expression: g.ex.expression as never, exprFrom: g.ex.exprFrom as never, exprT: g.ex.exprT} : {}), ...(g.noHat ? {hat: 'none'} : {})}}
  />
);

const Look: React.FC<{f: number; grade: Parameters<typeof GradeLayer>[0]['grade']; vig?: number; amount?: number}> = ({f, grade, vig = 0.5, amount = 1}) => (
  <>
    <GradeLayer grade={grade} amount={amount} />
    <Vig amount={vig} />
    <Grain f={f} />
  </>
);

/** Screen-space label plate (bottom right, above the caption band). */
const Plate: React.FC<{text: string; t: number; y?: number; right?: number}> = ({text, t, y = 828, right = 1860}) => {
  const w = text.length * 12.6 + 48;
  return (
    <g opacity={clamp(t)}>
      <rect x={right - w} y={y} width={w} height={48} rx={8} fill="rgba(11,11,13,0.78)" />
      <text x={right - 24} y={y + 32} textAnchor="end" fontFamily={FONT.sans} fontWeight={700} fontSize={23} fill="#F4EBD6">
        {text}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------- the lamplit study (1.1 and 1.4)
const StudySet: React.FC<{f: number; s: ReturnType<typeof S1.solve11>; reveal: number; quillOn: boolean; cam: S1Cam}> = ({f, s, reveal, quillOn, cam}) => {
  const fl = S1.S01_FLOOR;
  const g = s.figs[0];
  const SL = S1.S01_SLOPE;
  return (
    <CineCam f={f} keys={cam} seed={6}>
      {(layer) => [
        layer(0.85, <Study f={f} floor={fl} night windowX={1300} />, 2),
        layer(1, (
          <g>
            <Chair x={g.pl.x} floor={fl} h={s.seatH as number} />
            <WritingDesk x={S1.S01_DESK.x} floor={fl} w={S1.S01_DESK.w} h={S1.S01_DESK.h} />
            <OilLamp x={1110} y={fl - S1.S01_DESK.h} f={f} s={1.1} />
            <InkPot x={958} y={fl - S1.S01_DESK.h} />
            <WritingSlope x={SL.x} y={SL.y} w={SL.w} h={SL.h} />
            <DocText L={s.layout as never} reveal={reveal} id={`s01-bliss-${quillOn ? 'w' : 'r'}`} />
            <Rim kind="warm" side="r"><FigEl g={g} f={f} seed={7} /></Rim>
            {quillOn && <PropAt def={QUILL} xf={s.quill as never} st={{f}} />}
          </g>
        )),
      ]}
    </CineCam>
  );
};
type S1Cam = ReturnType<typeof S1.solve11>['cam'];

const Shot11: React.FC<{f: number}> = ({f}) => {
  const s = S1.solve11(f);
  return (
    <Frame bg="#3A2A1E">
      <CineDefs />
      <StudySet f={f} s={s} reveal={s.reveal as number} quillOn cam={s.cam} />
      <LightPool x={1250} y={480} r={950} f={f} color="#FFB060" seed={6} strength={0.34} />
      <Look f={f} grade="lamp" vig={0.62} />
      {/* cold open: a soft fade up from black over the first second */}
      <rect width={1920} height={1080} fill="#0B0B0D" opacity={1 - prog(f, 0, 30)} />
      <Plate text={doc('bliss').title} t={prog(f, 40, 60)} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 1.2 two lecterns at dusk (illustrative staging)
const Lectern: React.FC<{x: number; floor: number}> = ({x, floor}) => (
  <g>
    <path d={`M${x - 26},${floor} L${x - 18},${floor - 210} L${x + 18},${floor - 210} L${x + 26},${floor}Z`} fill="#5E4230" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
    <path d={`M${x - 70},${floor - 200} L${x + 70},${floor - 200} L${x + 80},${floor - 250} L${x - 80},${floor - 250}Z`} fill="#7A5536" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
    <rect x={x - 60} y={floor - 12} width={120} height={14} rx={4} fill="#4A3424" stroke={ink} strokeWidth={4} />
  </g>
);
const ClockFace: React.FC<{x: number; y: number; r: number; minDeg: number; hourDeg: number; glow?: number; t?: number}> = ({x, y, r, minDeg, hourDeg, glow = 0, t = 1}) => (
  <g transform={`translate(${x},${y})`} opacity={clamp(t)}>
    <circle r={r + 18} fill="#FFE2A0" opacity={0.25 * glow} />
    <circle r={r} fill="#F4EBD6" stroke={ink} strokeWidth={6} />
    {Array.from({length: 12}, (_, i) => {
      const a = (i * 30 * Math.PI) / 180;
      return <line key={i} x1={Math.sin(a) * r * 0.78} y1={-Math.cos(a) * r * 0.78} x2={Math.sin(a) * r * 0.9} y2={-Math.cos(a) * r * 0.9} stroke={ink} strokeWidth={i % 3 ? 3 : 6} strokeLinecap="round" />;
    })}
    <line x1={0} y1={0} x2={Math.sin((hourDeg * Math.PI) / 180) * r * 0.5} y2={-Math.cos((hourDeg * Math.PI) / 180) * r * 0.5} stroke={ink} strokeWidth={8} strokeLinecap="round" />
    <line x1={0} y1={0} x2={Math.sin((minDeg * Math.PI) / 180) * r * 0.76} y2={-Math.cos((minDeg * Math.PI) / 180) * r * 0.76} stroke={C.darkRed} strokeWidth={5} strokeLinecap="round" />
    <circle r={7} fill={ink} />
  </g>
);
const Shot12: React.FC<{f: number; d: number}> = ({f, d}) => {
  const fl = 860;
  const LX = 700;
  const RX = 1220;
  // left clock: two hours pass (two turns of the minute hand); then the right clock: two minutes
  const spin = prog(f, 14, 96, easeInOut);
  const tick = prog(f, 104, 134, (t) => t);
  const cam: [number, number, number, number][] = [[0, 1.0, 960, 470], [40, 1.02, 960, 480], [d, 1.4, RX - 80, 520]];
  const grass = (seed: number) => Array.from({length: 26}, (_, i) => {
    const x = -700 + i * 130 + hash(i + seed) * 60;
    const sw = Math.sin(f / 22 + i * 0.7) * 6;
    return <path key={i} d={`M${x},${fl + 6} q${4 + sw},-30 ${10 + sw},-46 M${x + 10},${fl + 6} q${-2 + sw},-24 ${2 + sw},-36`} stroke="#3E4A2A" strokeWidth={4} fill="none" strokeLinecap="round" />;
  });
  return (
    <Frame bg="#4A5A84">
      <CineDefs />
      <CineCam f={f} keys={cam} seed={12}>
        {(layer) => [
          layer(0.12, <SkyGrad time="dusk" id="s01dusk" />),
          layer(0.15, <g><circle cx={1500} cy={560} r={70} fill="#F2B880" opacity={0.7} /><Birds f={f} n={3} seed={4} y={260} /></g>),
          layer(0.35, <Ridge y={640} color="#5A5E6E" seed={9} amp={50} />, 3),
          layer(0.6, <TreeRow y={720} f={f} n={10} s={0.9} color="#3E4A3A" seed={5} />, 2),
          layer(1, (
            <g>
              <Clearing y={fl} color="#5E6A44" />
              {grass(3)}
              <Lectern x={LX} floor={fl} />
              <Lectern x={RX} floor={fl} />
              {/* the main speaker's tall pile of paper; Lincoln's two sheets */}
              <g transform={`translate(${LX},${fl - 252})`}>
                {Array.from({length: 22}, (_, i) => (
                  <rect key={i} x={-58 + (hash(i * 3) - 0.5) * 8} y={-i * 6 - 6} width={116} height={6} fill={i % 2 ? '#EFE3C6' : '#F7EDD6'} stroke={ink} strokeWidth={1.6} />
                ))}
              </g>
              <g transform={`translate(${RX},${fl - 252})`}>
                <path d="M-56,-4 L52,-8 L56,-2 L-52,2Z" fill="#F7EDD6" stroke={ink} strokeWidth={2.5} />
                <path d="M-50,-10 L58,-12 L60,-6 L-48,-4Z" fill="#EFE3C6" stroke={ink} strokeWidth={2.5} />
              </g>
              <ClockFace x={LX} y={330} r={74} minDeg={spin * 720} hourDeg={spin * 60} glow={spin > 0 && spin < 1 ? 1 : 0.3} t={prog(f, 4, 16)} />
              <ClockFace x={RX} y={330} r={74} minDeg={tick * 12} hourDeg={0} glow={f > 104 ? 1 : 0} t={prog(f, 8, 20)} />
            </g>
          )),
          layer(1.4, <PassBy f={f} x0={1700} speed={-1.6} y={1140} kind="grass" s={1.5} />),
        ]}
      </CineCam>
      <Particles f={f} kind="dust" n={20} seed={8} />
      <Look f={f} grade="dusk" vig={0.5} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 1.3 five copies; the signed Bliss copy, then framed
const BRIGHT = 2; // index of the signed page in the fan
const BlissPage: React.FC<{w: number; h: number}> = ({w, h}) => {
  const d = doc('bliss');
  const pad = 22;
  const L = layoutDoc(d.text, d.hand, 8.6, w - pad * 2, pad, pad + 10, 1.28, 99);
  const ft = DOC_FONT[d.hand];
  const sy = L.height + pad + 22;
  return (
    <g>
      <DocText L={L} id="s01-bliss-full" />
      {(d.sign ?? '').split('\n').map((t, i) => (
        <text key={i} x={w - pad} y={Math.min(h - 26, sy) + i * 14} textAnchor="end" fontFamily={ft.family} fontSize={11.5} fill={ft.color}>
          {t}
        </text>
      ))}
    </g>
  );
};
const PW = 300;
const PH = 400;
const Shot13: React.FC<{f: number; d: number}> = ({f, d}) => {
  const fan = prog(f, 0, 40, easeOut);
  const fade = prog(f, 62, 92);
  const room = prog(f, 150, 176);
  // desk insert: five sheets fan out from a stack
  const desk = (
    <g>
      <rect x={-400} y={-300} width={2720} height={1700} fill="#5B4030" />
      {Array.from({length: 12}, (_, i) => <path key={i} d={`M-400,${-120 + i * 130} C500,${-140 + i * 130 + (i % 2) * 30} 1300,${-90 + i * 130} 2320,${-116 + i * 130}`} stroke="#4C3426" strokeWidth={5} fill="none" />)}
      {[0, 1, 2, 3, 4].map((i) => {
        const k = i - 2;
        const x = 960 + k * 330 * fan;
        const y = 470 + Math.abs(k) * 26 * fan;
        const rot = k * 7 * fan + (hash(i * 5) - 0.5) * 4;
        const bright = i === BRIGHT;
        const op = bright ? 1 : 1 - fade;
        return (
          <g key={i} transform={`translate(${x},${y}) rotate(${rot})`}>
            {!bright && (
              <g>
                <rect x={-PW / 2} y={-PH / 2} width={PW} height={PH} rx={4} fill="none" stroke="#E6D8B8" strokeWidth={3} strokeDasharray="10 8" opacity={fade} />
                <g opacity={op}>
                  <Sheet x={0} y={0} w={PW} h={PH} folds="none" color={i % 2 ? '#EFE3C6' : '#F3E8CF'}>
                    <Hand x={26} y={46} w={PW - 52} lines={12} gap={26} size={9} seed={60 + i} width={1.8} />
                  </Sheet>
                </g>
              </g>
            )}
            {bright && (
              <g>
                <Sheet x={0} y={0} w={PW} h={PH} folds="none" color="#F4EAD0" />
                <g transform={`translate(${-PW / 2},${-PH / 2})`}><BlissPage w={PW} h={PH} /></g>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
  // the framed page on a wall in a quiet room (pull back)
  const framed = (
    <g>
      <rect x={-1200} y={-800} width={4320} height={1700} fill="#6E6A52" />
      {Array.from({length: 40}, (_, i) => <line key={i} x1={-1200 + i * 110} y1={-800} x2={-1200 + i * 110} y2={900} stroke="#646048" strokeWidth={3} />)}
      <rect x={-1200} y={900} width={4320} height={20} fill="#4A3A2A" stroke={ink} strokeWidth={4} />
      <rect x={-1200} y={920} width={4320} height={500} fill="#4E3E2E" />
      {Array.from({length: 22}, (_, i) => <rect key={i} x={-1160 + i * 200} y={950} width={160} height={200} rx={4} fill="#58463A" stroke="#2A1C14" strokeWidth={3} />)}
      {[600, 1320].map((x) => (
        <g key={x} transform={`translate(${x},420)`}>
          <rect x={-8} y={0} width={16} height={60} fill="#9A7A3A" stroke={ink} strokeWidth={3} />
          <path d="M-18,0 L-12,-44 L12,-44 L18,0Z" fill="#F4E8C0" opacity={0.85} stroke={ink} strokeWidth={3} />
          <path d={`M0,-10 q-5,-10 0,${-20 - noise1(f / 3, x) * 3} q5,10 0,${20 + noise1(f / 3, x) * 3}Z`} fill="#FFB43A" />
        </g>
      ))}
      <g transform="translate(960,500) scale(1.25)">
        <rect x={-PW / 2 - 70} y={-PH / 2 - 70} width={PW + 140} height={PH + 140} fill="#9A7A3A" stroke={ink} strokeWidth={6} />
        <rect x={-PW / 2 - 46} y={-PH / 2 - 46} width={PW + 92} height={PH + 92} fill="#E6DCC4" stroke={ink} strokeWidth={3} />
        <rect x={-PW / 2} y={-PH / 2} width={PW} height={PH} fill="#F4EAD0" stroke={ink} strokeWidth={2.5} />
        <g transform={`translate(${-PW / 2},${-PH / 2})`}><BlissPage w={PW} h={PH} /></g>
        {/* glass reflection drifting across */}
        <path d={`M${-PW / 2 - 46 + ((f * 1.4) % 600) - 100},${-PH / 2 - 46} l60,0 l-120,${PH + 92} l-60,0Z`} fill="#FFFFFF" opacity={0.08} />
      </g>
    </g>
  );
  const zDesk = kf(f, [[0, 1.12], [60, 1.25], [150, 1.7]]);
  const zRoom = kf(f, [[150, 2.2], [d, 1.0]], easeInOut);
  return (
    <Frame bg="#3A2A1E">
      <CineDefs />
      <g opacity={1 - room}>
        <CineCam f={f} keys={[[0, zDesk, 960, 500], [150, zDesk, 960, 470]]} seed={13}>
          {(layer) => [layer(1, desk)]}
        </CineCam>
        <LightPool x={980} y={460} r={760} f={f} color="#FFB060" seed={13} strength={0.3} />
      </g>
      {room > 0 && (
        <g opacity={room}>
          <CineCam f={f} keys={[[0, zRoom, 960, 500], [d, zRoom, 960, 540]]} seed={14}>
            {(layer) => [layer(1, framed)]}
          </CineCam>
          <LightPool x={600} y={360} r={420} f={f} color="#FFB060" seed={15} strength={0.22} />
          <LightPool x={1320} y={360} r={420} f={f} color="#FFB060" seed={16} strength={0.22} />
                  </g>
      )}
      <Look f={f} grade="lamp" vig={0.55} />
      <Plate text="Written 1864 · the only copy signed and dated" t={prog(f, 66, 82) * (1 - prog(f, 196, 212))} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 1.4 the quill rests; dissolve to the title plate
const Woods: React.FC<{f: number}> = ({f}) => {
  const fl = 860;
  return (
    <CineCam f={f} keys={[[0, 1.0, 960, 540], [300, 1.12, 900, 520]]} seed={2}>
      {(layer) => [
        layer(0.12, <SkyGrad time="golden" id="s01gold" />),
        layer(0.12, <circle cx={420} cy={300} r={90} fill="#FFE6A0" opacity={0.85} />),
        layer(0.2, <Birds f={f} n={4} seed={9} y={220} />),
        layer(0.35, <Ridge y={600} color="#B89A6A" seed={5} amp={70} />, 3),
        layer(0.55, <TreeRow y={700} f={f} n={9} s={1.1} color="#7A7A40" seed={4} />, 2),
        layer(0.8, <g><CabinExterior x={300} base={fl - 10} f={f} /><TreeRow y={fl - 10} f={f} n={5} s={1.5} color="#5E6A32" seed={8} x0={1300} x1={2400} /></g>),
        layer(1, <g><Clearing y={fl} /><RailPile x={1450} y={fl} n={5} /></g>),
        layer(1.5, <PassBy f={f} x0={-260} speed={1.2} y={1120} kind="grass" s={1.6} />),
      ]}
    </CineCam>
  );
};
const Shot14: React.FC<{f: number; d: number; tAt: number}> = ({f, d, tAt}) => {
  const s = S1.solve14(f);
  const mix = prog(f, tAt - 22, tAt + 14);
  const g = f - tAt;
  return (
    <Frame bg="#3A2A1E">
      <CineDefs />
      {mix < 1 && (
        <g>
          <StudySet f={f} s={s as never} reveal={s.done as number} quillOn cam={s.cam} />
          <LightPool x={1250} y={480} r={950} f={f} color="#FFB060" seed={6} strength={0.34} />
          <Look f={f} grade="lamp" vig={0.6} />
        </g>
      )}
      {mix > 0 && (
        <g opacity={mix}>
          <Woods f={Math.max(0, g + 22)} />
          <Particles f={f} kind="dust" n={26} seed={3} />
          <Look f={f} grade="golden" vig={0.45} />
          <LightLeak f={Math.max(0, g)} t={prog(g, 0, 20) * (1 - prog(g, d - tAt - 40, d - tAt))} />
          {g >= 0 && <TitlePlate f={g} d={d - tAt} title="Abraham Lincoln" big />}
        </g>
      )}
      {/* tail: dip toward black for the iris into chapter 2 */}
      <rect width={1920} height={1080} fill="#0B0B0D" opacity={prog(f, d - 14, d)} />
    </Frame>
  );
};

// ---------------------------------------------------------------- section
const A12 = T('That is roughly') + 2.4; // 1.1 holds the cold open and "Two minutes"
const A13 = T('Five copies survive') + 0.35;
const A14 = T('The man who wrote it');
// the plate starts 0.6 s into the title beat so it emerges on the score's chord and impact (audio.py compose_el:
// T_TITLE = beat start + 0.66 s) and holds for the rest of the 4.8 s beat (Phase D2: shorter cold open)
const TITLE = beat('s01', 1)[0] + 0.6;

export const S01: React.FC = () => (
  <Shots
    start={S}
    end={E}
    overlap={14}
    shots={[
      {at: S, el: (f) => <Shot11 f={f} />},
      {at: A12, trans: 'cut', el: (f, d) => <Shot12 f={f} d={d} />},
      {at: A13, trans: 'page', el: (f, d) => <Shot13 f={f} d={d} />},
      {at: A14, trans: 'fade', el: (f, d) => <Shot14 f={f} d={d} tAt={sf(TITLE - A14)} />},
    ]}
  />
);
