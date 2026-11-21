// s02 · A cabin in Kentucky (0:35–1:30) · shots 2.1–2.6 from the storyboard.
// Poses, props and cameras come from the pure solvers in s02-solve.ts (contacts measured by check-contacts).
import React from 'react';
import {Shots, Frame} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {CineCam, CineDefs, LightPool, TitlePlate, PassBy, Rim} from '../kit/Cinema';
import {PropAt, BOOK, Chips} from '../kit/Props';
import {Stool} from '../kit/Seats';
import {SkyGrad, Ridge, TreeRow, Clearing, CabinInterior, CabinExterior} from '../kit/Sets04';
import {usProjection, USMap, StateLabel, RouteLine, RiverLine, MOVE_1816, OHIO, MAPC} from '../kit/USMap';
import {StickFigure} from '../characters/StickFigure';
import {Particles, Smoke} from '../components/Effects';
import {T} from '../timeline';
import {C, FONT} from '../styles/theme';
import {prog, kf, clamp, easeInOut} from '../animations/core';
import {FigEl, Look, DateTag, SHORT_AXE, PLANE, BUNDLE, Ox, Wagon, WAGON, SnowGround, Breath, Block, Billet, Grave, Sawhorse, Shavings} from './s02-parts';
import * as Q from './s02-solve';

const AT = Q.AT02;
const lf = Q.lf;

/** Iris opening from black at a chapter start (the previous chapter ends on black). */
export const IrisIn: React.FC<{f: number; n?: number}> = ({f, n = 18}) => {
  if (f >= n) return null;
  const r = easeInOut(clamp(f / n)) * 1150;
  return <path d={`M-10,-10 H1930 V1090 H-10Z M${960 - r},520 a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0Z`} fill="#0B0B0D" fillRule="evenodd" />;
};
/** Tail fade to black before the next chapter's iris. */
export const TailDip: React.FC<{f: number; d: number; n?: number}> = ({f, d, n = 14}) => <rect width={1920} height={1080} fill="#0B0B0D" opacity={prog(f, d - n, d)} />;

const WinterSky: React.FC<{id: string}> = ({id}) => (
  <g>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8EA2B8" />
        <stop offset="1" stopColor="#DCE2E4" />
      </linearGradient>
    </defs>
    <rect x={-800} y={-900} width={3520} height={2400} fill={`url(#${id})`} />
  </g>
);

/** Foreground bare branch hanging in from the top right (2.1 parallax, sways in the wind). */
const ForeBranch: React.FC<{f: number}> = ({f}) => {
  const sw = Math.sin(f / 38) * 1.6;
  return (
    <g transform={`rotate(${sw},2250,-260)`}>
      <path d="M2250,-260 Q1900,-60 1560,40 M1900,-80 Q1830,40 1760,140 M1720,-4 Q1640,-60 1560,-110 M1640,22 Q1560,90 1470,120" stroke="#2E2A28" strokeWidth={26} strokeLinecap="round" fill="none" />
      <path d="M1600,30 Q1520,44 1440,80 M1780,110 Q1740,180 1700,220" stroke="#2E2A28" strokeWidth={12} strokeLinecap="round" fill="none" />
      <path d="M2250,-262 Q1900,-64 1560,36" stroke="#F4F6F8" strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.8} />
    </g>
  );
};

// ---------------------------------------------------------------- 2.1 winter woods, the cabin (crane down)
const CabinWoods: React.FC<{f: number; d: number}> = ({f, d}) => {
  const fl = 800;
  const born = lf(T('was born on the twelfth'), 'cabin');
  return (
    <Frame bg="#8EA2B8">
      <CineDefs />
      <CineCam f={f} keys={[[0, 1.18, 960, 200], [90, 1.12, 960, 330], [born + 60, 1.0, 960, 540], [d, 1.04, 960, 545]]} seed={21}>
        {(layer) => [
          layer(0.12, <WinterSky id="s21sky" />),
          layer(0.3, <Ridge y={600} color="#9AA6B4" seed={7} amp={60} />),
          layer(0.5, <TreeRow y={680} f={f} n={14} s={1.0} color="#6A6A70" seed={5} kind="bare" />, 2),
          layer(0.75, (
            <g>
              <SnowGround y={760} color="#DDE3E6" />
              <TreeRow y={770} f={f} n={9} s={1.3} color="#5A5450" seed={9} kind="bare" />
            </g>
          )),
          layer(1, (
            <g>
              <SnowGround y={fl} />
              <g transform={`translate(960,${fl}) scale(1.25) translate(-960,${-fl})`}>
                <Smoke x={1110} y={fl - 350} f={f} n={14} size={30} rise={400} drift={130} color="#A4A6AE" opacity={0.6} seed={9} outline={false} />
                <CabinExterior x={960} base={fl} f={f} lit={0.75} />
                <path d={`M${960 - 262},${fl - 200} Q${960},${fl - 340} ${960 + 262},${fl - 200} L${960 + 250},${fl - 206} L${960},${fl - 326} L${960 - 250},${fl - 206}Z`} fill="#F4F6F8" stroke={C.ink} strokeWidth={3} />
              </g>
              <TreeRow y={fl + 10} f={f} n={4} s={1.6} color="#4A4440" seed={3} kind="bare" x0={-300} x1={560} />
              <TreeRow y={fl + 10} f={f} n={3} s={1.7} color="#4A4440" seed={13} kind="bare" x0={1420} x1={2200} />
              <path d={`M560,${fl + 4} Q700,${fl + 60} 880,${fl + 40}`} stroke="#C4CED6" strokeWidth={8} fill="none" />
            </g>
          )),
          layer(1.45, <ForeBranch f={f} />, 4),
        ]}
      </CineCam>
      <Particles f={f} kind="snow" n={70} seed={21} wind={0.6} speed={0.55} opacity={0.85} />
      <Look f={f} grade="dawn" vig={0.5} amount={0.6} />
      <TitlePlate f={f} d={90} num={2} title="A cabin in Kentucky" />
      <DateTag f={f} at={born + 8} until={d - 8} text="12 February 1809 · Kentucky" />
      <IrisIn f={f} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 2.2 Thomas at the sawhorse, Nancy with the baby, young Sarah
const Family: React.FC<{f: number; d: number}> = ({f}) => {
  const s = Q.solveFamily(f);
  const fl = Q.FAM_FLOOR;
  const [th, na, sa] = s.figs;
  return (
    <Frame bg="#9AAEC2">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={22}>
        {(layer) => [
          layer(0.12, <WinterSky id="s22sky" />),
          layer(0.45, <TreeRow y={640} f={f} n={12} s={1.1} color="#6A6A70" seed={11} kind="bare" />, 3),
          layer(0.9, (
            <g>
              <SnowGround y={fl - 10} color="#D8DEE2" />
              <g transform={`translate(1290,${fl}) scale(3) translate(-1290,${-fl})`}>
                <CabinExterior x={1300} base={fl} f={f} lit={0.5} />
              </g>
            </g>
          ), 0),
          layer(1, (
            <g>
              <rect x={-600} y={fl} width={3200} height={400} fill="#B8AE9A" />
              <line x1={-600} y1={fl} x2={2600} y2={fl} stroke={C.ink} strokeWidth={5} />
              <Sawhorse x0={Q.FAM.saw0} x1={Q.FAM.saw1} top={Q.FAM.boardTop} floor={fl} />
              <Shavings x={780} y={fl + 6} f={f} n={Math.min(14, 4 + (s.strokes as number))} />
              <Rim kind="cool" side="r"><FigEl g={th} f={f} seed={31} /></Rim>
              <PropAt def={PLANE} xf={s.plane as never} st={{f}} />
              <FigEl g={sa} f={f} seed={33} />
              <FigEl g={na} f={f} seed={32} />
              <PropAt def={BUNDLE} xf={s.bundle as never} st={{f}} />
            </g>
          )),
        ]}
      </CineCam>
      <Particles f={f} kind="snow" n={30} seed={22} wind={0.4} speed={0.4} opacity={0.6} />
      <Look f={f} grade="day" vig={0.45} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 2.3 map: Kentucky to Indiana (1816)
const MoveMap: React.FC<{f: number; d: number}> = ({f, d}) => {
  const proj = usProjection('KY_IN_IL');
  const tPartly = lf(T('on account of slavery'), 'map');
  const route = prog(f, 40, 150, (t) => t);
  return (
    <Frame bg={MAPC.sea}>
      <CineCam f={f} keys={[[0, 1.25, 1100, 600], [d, 1.42, 1095, 610]]} seed={23}>
        {(layer) => [
          layer(1, (
            <g>
              <USMap proj={proj} f={f} year={1816} id="s23" states={{KY: {fill: '#D9C08E', t: prog(f, 4, 24)}, IN: {fill: '#B9C99A', t: prog(f, 100, 130), lift: 6 * prog(f, 100, 130)}}} rivers={{ohio: 1}} />
              <RiverLine proj={proj} pts={OHIO} t={1} width={7} />
              <StateLabel proj={proj} code="KY" text="KENTUCKY" t={prog(f, 8, 24)} size={40} dy={30} />
              <StateLabel proj={proj} code="IN" text="INDIANA" t={prog(f, 104, 124)} size={40} />
              <StateLabel proj={proj} code="IL" text="ILLINOIS" t={prog(f, 10, 30) * 0.5} size={30} />
              <g opacity={prog(f, 30, 44)} transform={`translate(${proj([-85.3, 38.95])![0]},${proj([-85.3, 38.95])![1]})`}>
                <rect x={-95} y={-26} width={190} height={38} rx={8} fill="rgba(244,235,214,0.9)" stroke={C.ink} strokeWidth={3} />
                <text y={3} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontStyle="italic" fontSize={24} fill="#3E5A62">Ohio River</text>
              </g>
              <RouteLine proj={proj} pts={MOVE_1816} t={route} icon="wagon" iconScale={1.2} />
            </g>
          )),
        ]}
      </CineCam>
      {/* his own account: "partly … but chiefly" — slavery the lesser reason, land titles the main one */}
      <g opacity={prog(f, tPartly - 6, tPartly + 8)} transform={`translate(960,${118 + (1 - prog(f, tPartly - 6, tPartly + 8)) * 16})`}>
        <rect x={-560} y={-58} width={1120} height={100} rx={14} fill="#F4EBD6" stroke={C.ink} strokeWidth={5} />
        <text textAnchor="middle" y={8} fontFamily={FONT.sans} fontSize={40} fill={C.ink}>
          <tspan fontWeight={600} fill="#5A4A3A">partly on account of slavery</tspan>
          <tspan fontWeight={800}> · </tspan>
          <tspan fontWeight={900} fill={C.darkRed} opacity={prog(f, tPartly + 40, tPartly + 54) * 0.75 + 0.25}>chiefly land titles</tspan>
        </text>
      </g>
      <Look f={f} grade="day" vig={0.35} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 2.4 the boy chops (Indiana woods, cold)
const Chop: React.FC<{f: number; d: number}> = ({f}) => {
  const s = Q.solveChop(f);
  const fl = Q.CHOP_FLOOR;
  const imp = s.impact as {x: number; y: number};
  const imps = s.impacts as number[];
  const hw = s.head as {x: number; y: number; r: number};
  const blockTop = imp.y + 6;
  const lastImp = imps.filter((a) => f >= a).pop() ?? -999;
  return (
    <Frame bg="#A9B4BC">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={24} hand={0}>
        {(layer) => [
          layer(0.12, <WinterSky id="s24sky" />),
          layer(0.35, <Ridge y={560} color="#8C9488" seed={3} amp={50} />, 3),
          layer(0.6, <TreeRow y={720} f={f} n={12} s={1.2} color="#55603E" seed={6} kind="pine" />, 2),
          layer(1, (
            <g>
              <Clearing y={fl} color="#8E8668" />
              <TreeRow y={fl} f={f} n={3} s={1.8} color="#4E5A36" seed={17} kind="pine" x0={1250} x1={1900} />
              <g opacity={0.9}>{[0, 1, 2, 3].map((i) => <rect key={i} x={1080 + (i % 2) * 30} y={fl - 20 - i * 18} width={110} height={18} rx={6} fill="#B8905A" stroke={C.ink} strokeWidth={3} />)}</g>
              <Block x={imp.x} top={blockTop} floor={fl} w={80} />
              <Billet x={imp.x} y={blockTop} f={f} at={imps[Math.max(0, imps.findIndex((a) => f < a + 40)) === 0 && f >= imps[imps.length - 1] + 40 ? imps.length - 1 : Math.max(0, imps.findIndex((a) => f < a + 40))]} s={1.3} />
              {((s.axe as {rot: number}).rot ?? 0) < -45 && <PropAt def={SHORT_AXE} xf={s.axe as never} st={{f}} />}
              <Rim kind="cool" side="l"><FigEl g={s.figs[0]} f={f} seed={34} /></Rim>
              {((s.axe as {rot: number}).rot ?? 0) >= -45 && <PropAt def={SHORT_AXE} xf={s.axe as never} st={{f}} />}
              {imps.map((a) => <Chips key={a} x={imp.x} y={blockTop} f={f} at={a} />)}
              <Breath x={hw.x + hw.r * 0.9} y={hw.y + hw.r * 0.3} f={Math.max(0, f - lastImp)} every={9999} s={1} />
              <Breath x={hw.x + hw.r * 0.9} y={hw.y + hw.r * 0.3} f={f} every={56} s={0.8} />
            </g>
          )),
          layer(1.5, <PassBy f={f} x0={-260} speed={0.8} y={1140} kind="grass" s={1.6} />),
        ]}
      </CineCam>
      <Look f={f} grade="day" vig={0.5} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 2.5 the grave at dusk (sombre)
const GraveShot: React.FC<{f: number; d: number}> = ({f}) => {
  const s = Q.solveGrave(f);
  const fl = Q.GRAVE_FLOOR;
  const [th, boy, sis] = s.figs;
  return (
    <Frame bg="#4A5A84">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={25}>
        {(layer) => [
          layer(0.12, <SkyGrad time="dusk" id="s25sky" />),
          layer(0.35, <Ridge y={600} color="#5A6078" seed={9} amp={50} />, 3),
          layer(0.6, <TreeRow y={720} f={f * 0.5} n={10} s={1.3} color="#3A3E4A" seed={12} kind="bare" />, 2),
          layer(1, (
            <g>
              <Clearing y={fl} color="#5E5A48" />
              <TreeRow y={fl - 4} f={f * 0.5} n={2} s={2.2} color="#2E2E36" seed={4} kind="round" x0={1180} x1={1700} />
              <Grave x={1380} floor={fl} s={1.3} />
              <FigEl g={boy} f={f} seed={35} slow={0.6} />
              <FigEl g={sis} f={f} seed={36} slow={0.6} />
              <FigEl g={th} f={f} seed={37} slow={0.6} />
            </g>
          )),
        ]}
      </CineCam>
      <Particles f={f} kind="ash" n={14} seed={25} wind={0.25} speed={0.25} opacity={0.35} />
      <Look f={f} grade="dusk" vig={0.6} />
      <Look f={f} grade="sombre" vig={0.2} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 2.6 the wagon arrives: Sarah Bush Johnston and the book
const KID_SPECS = [
  {head: {hair: 'bob' as const, hairColor: '#5A4030'}, outfit: {kind: 'dress' as const, color: '#7A6A8A', accent: '#E6D8B8'}},
  {head: {hair: 'mop' as const, hairColor: '#6A4A30'}, outfit: {kind: 'shirt' as const, color: '#9A8A6A', trousers: '#4E4434'}},
  {head: {hair: 'long' as const, hairColor: '#4A3424'}, outfit: {kind: 'dress' as const, color: '#8A6A5A', accent: '#E6D8B8'}},
];
const Arrive: React.FC<{f: number; d: number}> = ({f}) => {
  const s = Q.solveArrive(f);
  const fl = Q.ARR_FLOOR;
  const wx = s.wx as number;
  const roll = s.roll as number;
  const walking = s.walking as number;
  const [sb, boy, sis] = s.figs;
  return (
    <Frame bg="#9AAEC2">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={26}>
        {(layer) => [
          layer(0.12, <WinterSky id="s26sky" />),
          layer(0.4, <TreeRow y={660} f={f} n={12} s={1.1} color="#6A6A70" seed={14} kind="bare" />, 3),
          layer(0.8, (
            <g>
              <SnowGround y={fl - 30} color="#D8DEE2" />
              <g transform={`translate(330,${fl - 30}) scale(1.6) translate(-330,${-(fl - 30)})`}><CabinExterior x={330} base={fl - 30} f={f} lit={0.4} /></g>
            </g>
          ), 2),
          layer(1, (
            <g>
              <rect x={-600} y={fl} width={3600} height={400} fill="#C4BCA8" />
              <line x1={-600} y1={fl} x2={3200} y2={fl} stroke={C.ink} strokeWidth={5} />
              {Array.from({length: 8}, (_, i) => <path key={i} d={`M${2600 - i * 260 + (roll % 260)},${fl + 30 + (i % 3) * 22} h-70`} stroke="#9A9282" strokeWidth={5} strokeLinecap="round" opacity={0.6} />)}
              <Wagon x={wx} floor={fl} roll={roll} part="back" cover />
              {KID_SPECS.map((k, i) => (
                <StickFigure key={i} x={wx - 50 + i * 85} y={fl - WAGON.bedBottom + 10 + Math.sin(roll / 30 + i) * 2 * walking} scale={1.05 - i * 0.05} dir={-1} f={f + i * 13} seed={40 + i} child head={{...k.head, expression: f > 70 ? 'curious' : 'neutral'}} outfit={k.outfit} look={f > 70 ? [-0.8, 0.1] : [-0.3, 0]} />
              ))}
              <Wagon x={wx} floor={fl} roll={roll} />
              <Ox x={wx - WAGON.half - 250} y={fl} s={1.25} dir={-1} phase={roll / 210} walking={walking} f={f} />
              <FigEl g={sis} f={f} seed={38} />
              <FigEl g={boy} f={f} seed={39} />
              <FigEl g={sb} f={f} seed={41} />
              <PropAt def={BOOK} xf={s.book as never} st={{f, open: 0}} />
            </g>
          )),
        ]}
      </CineCam>
      <Particles f={f} kind="snow" n={24} seed={26} wind={0.4} speed={0.35} opacity={0.5} />
      <Look f={f} grade="day" vig={0.45} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 2.6 reading by firelight (from the fire to his face)
const Read: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = Q.solveRead(f);
  const fl = Q.READ_FLOOR;
  const g = s.figs[0];
  return (
    <Frame bg="#2A1C12">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={27}>
        {(layer) => [
          layer(0.9, <CabinInterior f={f} floor={fl} fireX={420} />, 0),
          layer(1, (
            <g>
              <Stool x={g.pl.x} floor={fl} h={s.seatH as number} />
              <Rim kind="warm" side="l"><FigEl g={g} f={f} seed={42} /></Rim>
              <PropAt def={BOOK} xf={s.book as never} st={{f, open: 1, page: s.page as number}} />
            </g>
          )),
        ]}
      </CineCam>
      <LightPool x={kf(f, [[0, 900], [s.pullF as number, 640]])} y={760} r={760} f={f} color="#FF9A40" seed={27} strength={0.4} />
      <Look f={f} grade="lamp" vig={0.62} />
      <TailDip f={f} d={d} />
    </Frame>
  );
};

export const S02: React.FC = () => (
  <Shots
    start={AT.cabin}
    end={AT.end}
    overlap={14}
    shots={[
      {at: AT.cabin, el: (f, d) => <CabinWoods f={f} d={d} />},
      {at: AT.family, trans: 'cut', el: (f, d) => <Family f={f} d={d} />},
      {at: AT.map, trans: 'whip', el: (f, d) => <MoveMap f={f} d={d} />},
      {at: AT.chop, trans: 'cut', el: (f, d) => <Chop f={f} d={d} />},
      {at: AT.grave, trans: 'dip', el: (f, d) => <GraveShot f={f} d={d} />},
      {at: AT.arrive, trans: 'cut', el: (f, d) => <Arrive f={f} d={d} />},
      {at: AT.read, trans: 'fade', el: (f, d) => <Read f={f} d={d} />},
    ]}
  />
);
void Person;
