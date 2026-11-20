// s09 · Ford's Theatre (8:00–8:50) · sombre. Storyboard 9.1–9.5:
// 9.1 EW gaslit street, the theatre façade, a carriage passes · 9.2 the playbill (summary panel) → the box
// from below in silhouette · 9.3 a dark-grey silhouette in the corridor (grey tag), then cut to the empty
// chair: no gun, no wound, no blood, no leap · 9.4 the Petersen House steps → the small back room from the
// doorway, empty of detail → Mary and Robert in the front parlour · 9.5 CU the clock at 7:22, morning light.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Shots, Frame, sf} from '../kit/Shots';
import {Person, CAST} from '../kit/Cast';
import {CineCam, CineDefs, GradeLayer, Grain, Vig, LightPool, GodRays, TitlePlate, PassBy} from '../kit/Cinema';
import {Particles} from '../components/Effects';
import {T, TE, beat, sectionWindow} from '../timeline';
import {C, FONT} from '../styles/theme';
import {clamp, easeInOut, easeOut, kf, prog} from '../animations/core';
import {S09Defs, Silhouette, GasLamp, NightStreet, FordsFacade, Carriage, PlaybillBoard, TheatreFromStalls, Corridor, EmptyChairSet, PetersenFront, BackRoomFromDoor, Parlour, MantelClock, GreyTag} from './s09-sets';
import * as S9 from './s09-solve';
import type {Fig} from './reelSolve';

const [S, E] = sectionWindow('s09');
const ink = C.ink;
const castS = (id: string) => CAST[id].scale ?? 1;

const FigEl: React.FC<{g: Fig; f: number; seed?: number; label?: string}> = ({g, f, seed = 1, label}) => (
  <Person
    id={g.id} x={g.pl.x} y={g.pl.y} scale={(g.pl.scale ?? 1) / castS(g.id)} dir={g.pl.dir} pose={g.P} f={f} seed={seed}
    look={g.look} tag={g.tag} eyesClosed={g.eyesClosed} label={label}
    head={g.ex ? {expression: g.ex.expression as never, exprFrom: g.ex.exprFrom as never, exprT: g.ex.exprT} : {}}
  />
);

/** The chapter's look: sombre desaturation on top of the time-of-day grade, vignette and grain. */
const Look: React.FC<{f: number; grade?: Parameters<typeof GradeLayer>[0]['grade']; sombre?: number; vig?: number}> = ({f, grade, sombre = 1, vig = 0.6}) => (
  <>
    {grade && <GradeLayer grade={grade} />}
    <GradeLayer grade="sombre" amount={sombre} />
    <Vig amount={vig} />
    <Grain f={f} />
  </>
);

/** Date card (series navy card, yellow stripe), drawn from the shot frame. */
const DateOnly: React.FC<{f: number; at: number; until: number; text: string}> = ({f, at, until, text}) => {
  const tin = prog(f, at, at + 14, easeOut);
  const tout = prog(f, until - 12, until);
  const w = text.length * 22 + 90;
  return (
    <g transform={`translate(${70 - (1 - tin) * 40},150)`} opacity={tin * (1 - tout)}>
      <rect x={8} y={10} width={w} height={74} rx={10} fill="rgba(0,0,0,0.35)" />
      <rect width={w} height={74} rx={10} fill={C.navy} stroke={ink} strokeWidth={5} />
      <rect width={14} height={74} rx={4} fill={C.dustyYellow} stroke={ink} strokeWidth={4} />
      <text x={40} y={49} fontFamily={FONT.sans} fontWeight={800} fontSize={36} fill={C.dustyYellow} letterSpacing={1.5}>
        {text}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------- 9.1 EW night street, theatre façade, carriage
const Shot91: React.FC<{f: number; d: number}> = ({f, d}) => {
  const fl = 860;
  const iris = easeInOut(clamp(f / 20));
  const titleD = sf(beat('s09', 0)[1] - beat('s09', 0)[0]);
  return (
    <AbsoluteFill style={{clipPath: iris < 1 ? `circle(${iris * 75}% at 50% 48%)` : undefined}}>
      <Frame bg="#101A30">
        <CineDefs />
        <S09Defs />
        <CineCam f={f} keys={[[0, 0.9, 960, 520], [d, 0.98, 1000, 520]]} seed={91}>
          {(layer) => [
            layer(0.3, <NightStreet f={f} floor={fl} />),
            layer(1, (
              <g>
                <FordsFacade x={1060} base={fl} f={f} />
                {[220, 1700].map((x, i) => <GasLamp key={x} x={x} base={fl + 30} f={f} seed={i + 3} />)}
                <Carriage x={-560 + f * 9} base={fl + 40} d={f * 9} s={0.95} />
              </g>
            )),
            layer(1.45, <PassBy f={f} x0={1900} speed={-1.4} y={1200} kind="post" s={1} />),
          ]}
        </CineCam>
        <LightPool x={1060} y={760} r={600} f={f} color="#FFB060" seed={91} strength={0.2} />
        <Look f={f} grade="night" sombre={0.7} />
        <TitlePlate f={f} d={titleD} num={9} title="Ford's Theatre" />
        <DateOnly f={f} at={titleD + 4} until={d + 20} text="14 April 1865 · Washington" />
      </Frame>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 9.2 INS playbill → W the box from below
const BoxHeads: React.FC<{f: number}> = ({f}) => (
  <Silhouette>
    {[[130, 128, 1], [300, 120, 0.92]].map(([x, y, s], i) => (
      <g key={i} transform={`translate(${x},${y + Math.sin(f / 30 + i) * 1.2}) scale(${s})`}>
        <circle cx={0} cy={-40} r={42} fill="#000" />
        <path d="M-60,40 Q-56,-4 0,-6 Q56,-4 60,40Z" fill="#000" />
      </g>
    ))}
  </Silhouette>
);
const Shot92: React.FC<{f: number; d: number}> = ({f, d}) => {
  const sw = 75;
  const mix = prog(f, sw, sw + 16);
  return (
    <Frame bg="#141016">
      <CineDefs />
      <S09Defs />
      {mix < 1 && (
        <g>
          <CineCam f={f} keys={[[0, 1.35, 960, 470], [sw + 16, 1.48, 960, 470]]} seed={92}>
            {(layer) => [
              layer(1, (
                <g>
                  <rect x={-900} y={-700} width={3700} height={2400} fill="#5A3428" />
                  {Array.from({length: 60}, (_, i) => <line key={i} x1={-900} y1={-700 + i * 34} x2={2800} y2={-700 + i * 34} stroke="#4E2C22" strokeWidth={3} />)}
                  <PlaybillBoard x={590} y={290} t={prog(f, 2, 14)} />
                </g>
              )),
            ]}
          </CineCam>
          <LightPool x={420} y={300} r={700} f={f} color="#FFB060" seed={92} strength={0.3} />
        </g>
      )}
      {mix > 0 && (
        <g opacity={mix}>
          <CineCam f={f} keys={[[sw, 1.0, 1100, 520], [d, 1.12, 1300, 470]]} seed={93}>
            {(layer) => [layer(0.9, <TheatreFromStalls f={f} inBox={<BoxHeads f={f} />} />), layer(1.3, <g />)]}
          </CineCam>
        </g>
      )}
      <Look f={f} grade="lamp" sombre={0.8} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 9.3 corridor silhouette (grey tag) → the empty chair
const Shot93: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = S9.solveCorridor(f);
  const g = s.figs[0];
  return (
    <Frame bg="#1A1614">
      <CineDefs />
      <S09Defs />
      <CineCam f={f} keys={s.cam} seed={94}>
        {(layer) => [
          layer(1, (
            <g>
              <Corridor f={f} floor={S9.CORRIDOR_FLOOR} />
              <ellipse cx={g.pl.x} cy={560} rx={260} ry={360} fill="#8A7A66" opacity={0.28} />
              <Silhouette>
                <FigEl g={g} f={f} seed={21} />
              </Silhouette>
              <GreyTag x={g.pl.x} y={400} text="JOHN WILKES BOOTH" t={prog(f, 16, 30) * (1 - prog(f, d - 30, d - 12))} />
            </g>
          )),
        ]}
      </CineCam>
      <Look f={f} grade="night" sombre={1} vig={0.75} />
    </Frame>
  );
};
const ShotChair: React.FC<{f: number; d: number}> = ({f, d}) => (
  <Frame bg="#1A1414">
    <CineDefs />
    <S09Defs />
    <CineCam f={f} keys={[[0, 1.08, 880, 560], [d, 1.2, 860, 580]]} seed={95}>
      {(layer) => [layer(1, <EmptyChairSet f={f} floor={900} />)]}
    </CineCam>
    <LightPool x={900} y={460} r={640} f={f} color="#FFB060" seed={95} strength={0.18} flicker={0.4} />
    <Look f={f} grade="night" sombre={1} vig={0.7} />
  </Frame>
);

// ---------------------------------------------------------------- 9.4 Petersen House steps → the back room from the doorway
const Shot94: React.FC<{f: number; d: number; sw: number}> = ({f, d, sw}) => {
  const mix = prog(f, sw, sw + 22);
  return (
    <Frame bg="#101A30">
      <CineDefs />
      <S09Defs />
      {mix < 1 && (
        <g>
          <CineCam f={f} keys={[[0, 1.0, 960, 520], [sw + 22, 1.28, 1050, 600]]} seed={96}>
            {(layer) => [
              layer(0.3, <NightStreet f={f} floor={900} far={false} />),
              layer(1, <g><PetersenFront f={f} base={900} /><GasLamp x={360} base={930} f={f} seed={7} /></g>),
            ]}
          </CineCam>
          <Look f={f} grade="night" sombre={0.9} />
        </g>
      )}
      {mix > 0 && (
        <g opacity={mix}>
          <CineCam f={f} keys={[[sw, 1.0, 960, 560], [d, 1.1, 980, 580]]} seed={97}>
            {(layer) => [layer(1, <BackRoomFromDoor f={f} />)]}
          </CineCam>
          <Look f={f} grade="lamp" sombre={1} vig={0.7} />
        </g>
      )}
    </Frame>
  );
};

// ---------------------------------------------------------------- 9.4b Mary and Robert in the front parlour (mantel clock to 7:22)
const Shot94b: React.FC<{f: number; d: number; at722: number}> = ({f, d, at722}) => {
  const s = S9.solveParlour(f);
  const [m, r] = s.figs;
  const fl = S9.PARLOUR_FLOOR;
  const mins = kf(f, [[0, 8], [at722, 22]], (t) => t);
  const dawn = kf(f, [[0, 0.15], [d, 0.7]]);
  const tags = prog(f, 10, 24) * (1 - prog(f, 150, 166));
  return (
    <Frame bg="#2A2420">
      <CineDefs />
      <S09Defs />
      <CineCam f={f} keys={s.cam} seed={98}>
        {(layer) => [
          layer(1, (
            <g>
              <Parlour f={f} floor={fl} dawn={dawn} sofaX={S9.SOFA_X} sofaH={s.seatH as number} mantelX={380} clock={<MantelClock x={380} y={fl - 380 - 142 * 0.6} s={0.6} h={7} m={Math.floor(mins)} swing={Math.sin(f / 9) * 9} />} />
              <g opacity={1}>
                <FigEl g={{...m, tag: false}} f={f} seed={31} label={tags > 0.02 ? 'MARY TODD LINCOLN' : undefined} />
                <FigEl g={{...r, tag: tags > 0.02}} f={f} seed={33} />
              </g>
            </g>
          )),
        ]}
      </CineCam>
      <GodRays x={1490} y={180} w={300} f={f} angle={-30} len={900} op={0.1 * dawn} />
      <Look f={f} grade="dawn" sombre={1} vig={0.6} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 9.5 CU the clock at 7:22; the pendulum stops; morning
const Shot95: React.FC<{f: number; d: number; card: number}> = ({f, d, card}) => {
  const swing = Math.sin(f / 9) * 9 * (1 - prog(f, 10, 70));
  const morning = prog(f, 20, d - 20);
  return (
    <Frame bg="#3A3028">
      <CineDefs />
      <S09Defs />
      <CineCam f={f} keys={[[0, 1.0, 960, 520], [d, 1.12, 960, 500]]} seed={99}>
        {(layer) => [
          layer(0.8, (
            <g>
              <rect x={-900} y={-700} width={3700} height={2400} fill="#5A4E40" />
              {Array.from({length: 34}, (_, i) => <line key={i} x1={-900 + i * 110} y1={-700} x2={-900 + i * 110} y2={2000} stroke="#52473A" strokeWidth={3} />)}
            </g>
          ), 3),
          layer(1, (
            <g>
              <rect x={260} y={830} width={1400} height={50} fill="#2A2420" stroke={ink} strokeWidth={5} />
              <rect x={300} y={880} width={1320} height={400} fill="#3A322C" stroke={ink} strokeWidth={5} />
              <MantelClock x={960} y={830 - 142 * 2.6} s={2.6} h={7} m={22} swing={swing} />
            </g>
          )),
        ]}
      </CineCam>
      <GodRays x={1700} y={-80} w={420} f={f} angle={-34} len={1400} op={0.16 * morning} color="#FFF0D0" />
      <rect width={1920} height={1080} fill="#F4F0E0" opacity={0.1 * morning} style={{mixBlendMode: 'screen'}} />
      <Look f={f} grade="dawn" sombre={1 - 0.4 * morning} vig={0.55} />
      <DateOnly f={f} at={card} until={d + 30} text="15 April 1865" />
    </Frame>
  );
};

// ---------------------------------------------------------------- section
const A2 = T('watching a play');
const A3 = T('John Wilkes Booth');
const A3b = TE('a Confederate sympathiser'); // cut to the empty chair before the next words
const A4 = T('carried across the street');
const A4sw = T('and laid diagonally');
const A5 = T('Mary waited');
const A722 = T('twenty-two minutes past');
const A6 = T('He was fifty-six');
const CARD = beat('s09', 2)[0];

export const S09: React.FC = () => (
  <Shots
    start={S}
    end={E}
    overlap={18}
    shots={[
      {at: S, el: (f, d) => <Shot91 f={f} d={d} />},
      {at: A2, trans: 'cut', el: (f, d) => <Shot92 f={f} d={d} />},
      {at: A3, trans: 'cut', el: (f, d) => <Shot93 f={f} d={d} />},
      {at: A3b, trans: 'cut', el: (f, d) => <ShotChair f={f} d={d} />},
      {at: A4, trans: 'fade', el: (f, d) => <Shot94 f={f} d={d} sw={sf(A4sw - A4)} />},
      {at: A5, trans: 'fade', el: (f, d) => <Shot94b f={f} d={d} at722={sf(A722 + 1.2 - A5)} />},
      {at: A6, trans: 'cut', el: (f, d) => <Shot95 f={f} d={d} card={sf(CARD - A6)} />},
    ]}
  />
);
