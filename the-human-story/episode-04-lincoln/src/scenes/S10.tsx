// s10 "Legacy" (Chapter 10, 8:50–10:00): the funeral train on the map and at a night station (hats off),
// the two coffins in one car, the Thirteenth Amendment (December 1865), the Lincoln Memorial (1922) and the
// roped-off section at its dedication, Frederick Douglass at a lectern with the historians' debate, the
// last line of the Bliss copy, and the series end card over the woods at golden hour.
// Poses and contacts come from s10-solve.ts (checked by scripts/check-contacts.mjs).
import React from 'react';
import {Shots, Frame} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {CineCam, CineDefs, LightPool, GodRays, TitlePlate, PassBy, Rim, GradeLayer, LightLeak} from '../kit/Cinema';
import {PropAt, STOVEPIPE} from '../kit/Props';
import {doc, layoutDoc, nibAt} from '../kit/Documents';
import {SkyGrad, Ridge, TreeRow, Clearing} from '../kit/Sets04';
import {PlaceTag} from '../kit/Places';
import {Birds, Clouds} from '../components/Environment';
import {USMap, usProjection, RouteLine, PlaceDot, FUNERAL_ROUTE, PLACES, MAPC, MapNote} from '../kit/USMap';
import {clamp, kf, prog} from '../animations/core';
import {FONT} from '../styles/theme';
import * as S10S from './s10-solve';
import {FigEl, Look, IrisOpen, PageInsert, DeskTop, Plate} from './s08-sets';
import {StationNight, PlatformFront, RailCarInterior, TwoCoffins, Memorial, MemorialDefs, DedicationSeating, GreyTag, EndCardOver} from './s10-sets';
import {Train, Track, HallBack, Lectern} from '../kit/Sets04b';

const {A10} = S10S;

// ---------------------------------------------------------------- 10.1 the funeral train: map, then a night station
const STOP_KEYS = ['Baltimore', 'Harrisburg', 'Philadelphia', 'NewYork', 'Albany', 'Buffalo', 'Cleveland', 'Columbus', 'Indianapolis', 'Chicago'];
const Train101: React.FC<{f: number; d: number}> = ({f, d}) => {
  const X = S10S.STATION_AT;
  const mix = prog(f, X - 8, X + 8);
  const proj = usProjection('FUNERAL');
  const rt = prog(f, 24, X - 20, (t) => t);
  const g = Math.max(0, f - X);
  const st = S10S.solveStation(g);
  const trainX = 560 - g * 6;
  return (
    <Frame bg={MAPC.sea}>
      <CineDefs />
      {mix < 1 && (
        <g opacity={1 - mix}>
          <CineCam f={f} keys={[[0, 1.0, 960, 470], [X, 1.08, 900, 470]]} seed={101}>
            {(layer) => [
              layer(1, (
                <g>
                  <USMap proj={proj} f={f} year={1865} id="fun" />
                  <RouteLine proj={proj} pts={FUNERAL_ROUTE} t={rt} icon="train" iconScale={1.1} color="#2A2A30" />
                  {STOP_KEYS.map((k, i) => <PlaceDot key={k} proj={proj} at={PLACES[k]} t={prog(rt, (i + 1) / 11, (i + 1) / 11 + 0.03)} dot={7} color="#F4EBD6" />)}
                  <PlaceDot proj={proj} at={PLACES.Washington} label="Washington" t={prog(f, 20, 34)} side="below" f={f} />
                  <PlaceDot proj={proj} at={PLACES.Springfield} label="Springfield" t={prog(f, X - 40, X - 26)} side="below" ring={1} f={f} />
                </g>
              )),
            ]}
          </CineCam>
          <GradeLayer grade="night" amount={0.45} />
          <MapNote text="1,654 miles" x={960} y={850} t={prog(f, 96, 112)} anchor="middle" size={40} />
        </g>
      )}
      {mix > 0 && (
        <g opacity={mix}>
          <CineCam f={g} keys={st.cam} seed={102}>
            {(layer) => [
              layer(0.6, <StationNight f={f} floor={S10S.STATION_FLOOR} />, 2),
              layer(0.8, <g><Track y={S10S.STATION_FLOOR - 110} s={0.8} /><Train x={trainX} y={S10S.STATION_FLOOR - 110} s={0.8} dir={-1} d={g * 6} f={f} cars={3} draped lit={0.6} /></g>, 1),
              layer(1, (
                <g>
                  <PlatformFront f={f} floor={S10S.STATION_FLOOR} />
                  {[300, 580, 940, 1340, 1640].map((x, i) => <Person key={i} id={i % 2 ? 'townswoman' : 'townsman'} x={x} y={S10S.STATION_FLOOR - 40} scale={0.78} f={f} seed={60 + i} lod="low" dir={i % 2 ? 1 : -1} head={{hat: 'none', expression: 'solemn'}} />)}
                  {st.figs.map((fg, i) => (
                    <g key={i}>
                      <Rim kind="moon" side="r"><FigEl g={fg} f={f} seed={70 + i} /></Rim>
                      {fg.noHat && <PropAt def={STOVEPIPE} xf={(st.hats as never[])[i]} st={{f}} />}
                    </g>
                  ))}
                </g>
              )),
            ]}
          </CineCam>
          <LightPool x={960} y={560} r={700} f={f} color="#FFC27A" seed={103} strength={0.2} />
          <Look f={f} grade="night" vig={0.6} />
        </g>
      )}
      <TitlePlate f={f} d={90} num={10} title="Legacy" />
      <IrisOpen f={f} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 10.2 two coffins in one car, lit softly
const Coffins102: React.FC<{f: number; d: number}> = ({f, d}) => {
  const fl = 860;
  const sway = Math.sin(f / 24) * 0.25;
  return (
    <Frame bg="#3A261E">
      <CineDefs />
      <g transform={`rotate(${sway},960,700)`}>
        <CineCam f={f} keys={[[0, 1.08, 980, 580], [d, 1.2, 1000, 600]]} seed={104}>
          {(layer) => [
            layer(0.85, <RailCarInterior f={f} floor={fl} />, 2),
            layer(1, (
              <g>
                <TwoCoffins floor={fl} />
                <Person id="unionSoldier" x={1760} y={fl} f={f} seed={105} dir={-1} expression="solemn" pose={undefined} />
              </g>
            )),
          ]}
        </CineCam>
      </g>
      <LightPool x={780} y={420} r={520} f={f} color="#FFD8A0" seed={106} strength={0.28} flicker={0.5} />
      <LightPool x={1420} y={440} r={420} f={f} color="#FFD8A0" seed={107} strength={0.22} flicker={0.5} />
      <Look f={f} grade="lamp" vig={0.66} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 10.3 the Thirteenth Amendment, Section 1 (held in the silent beat)
const Thirteenth103: React.FC<{f: number; d: number}> = ({f, d}) => {
  const D = doc('thirteenth');
  const P = {x: 270, y: 230, w: 1380, h: 520};
  const L = layoutDoc(D.text, D.hand, 50, P.w - 160, P.x + 80, P.y + 120, 1.42, 99);
  return (
    <Frame bg="#5B4030">
      <CineDefs />
      <CineCam f={f} keys={[[0, 1.0, 960, 490], [d, 1.1, 960, 480]]} seed={108}>
        {(layer) => [
          layer(1, (
            <g>
              <DeskTop tone="warm" />
              <PageInsert d={D} L={L} x={P.x} y={P.y} w={P.w} h={P.h} reveal={prog(f, 8, 150, (t) => t)} f={f} id="s103" tone="#F1E6CA" />
            </g>
          )),
        ]}
      </CineCam>
      <LightPool x={700} y={300} r={900} f={f} color="#FFE2B0" seed={109} strength={0.2} flicker={0.2} />
      <Look f={f} grade="day" vig={0.5} />
      <PlaceTag text="December 1865" t={prog(f, 10, 24)} y={100} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 10.4 the Lincoln Memorial: crane up the steps to the statue and the inscription
const Memorial104: React.FC<{f: number; d: number}> = ({f, d}) => {
  const cam: [number, number, number, number][] = [[0, 1.0, 960, 770], [24, 1.0, 960, 760], [Math.min(d - 30, 200), 2.55, 960, 470], [d, 2.62, 960, 466]];
  return (
    <Frame bg="#BFD4DC">
      <CineDefs />
      <MemorialDefs />
      <CineCam f={f} keys={cam} seed={110}>
        {(layer) => [
          layer(0.15, <SkyGrad time="day" id="s104sky" />),
          layer(0.2, <Clouds f={f} n={5} seed={4} speed={0.3} yMin={40} yMax={260} />),
          layer(0.5, <TreeRow y={1030} f={f} n={14} s={1.1} color="#6F8546" seed={9} />, 2),
          layer(1, <Memorial f={f} />),
          layer(1.35, (
            <g>
              <TreeRow y={1220} f={f} n={2} s={2.6} color="#4E6236" seed={2} x0={-500} x1={200} />
              <TreeRow y={1220} f={f} n={2} s={2.6} color="#4E6236" seed={5} x0={1750} x1={2450} />
            </g>
          ), 4),
        ]}
      </CineCam>
      <Look f={f} grade="day" vig={0.42} />
      <PlaceTag text="1922" t={prog(f, 12, 26) * (1 - prog(f, d - 30, d - 12))} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 10.5 the dedication: a roped-off section, shown plainly
const Section105: React.FC<{f: number; d: number}> = ({f, d}) => (
  <Frame bg="#BFD4DC">
    <CineDefs />
    <MemorialDefs />
    <CineCam f={f} keys={[[0, 1.04, 900, 560], [d, 1.08, 1010, 560]]} seed={111}>
      {(layer) => [
        layer(0.15, <SkyGrad time="day" id="s105sky" />),
        layer(0.4, <g transform="translate(560,170) scale(0.42)"><Memorial f={f} /></g>, 2),
        layer(0.55, <TreeRow y={620} f={f} n={12} s={0.8} color="#6F8546" seed={3} />, 2),
        layer(0.6, <rect x={-900} y={600} width={3800} height={900} fill="#8EA062" />, 2),
        layer(1, <DedicationSeating f={f} aisle={1180} />),
      ]}
    </CineCam>
    <Look f={f} grade="day" vig={0.42} />
  </Frame>
);

// ---------------------------------------------------------------- 10.6 Frederick Douglass, older, at a lectern; the historians' debate
const Debate106: React.FC<{f: number; d: number}> = ({f}) => {
  const s = S10S.solveLectern(f);
  const fl = S10S.LECT_FLOOR;
  const LC = S10S.LECTERN;
  const tGrew = prog(f, Math.round((570.2 - A10.debate) * 30), Math.round((570.2 - A10.debate) * 30) + 16);
  const tPushed = prog(f, Math.round((571.7 - A10.debate) * 30), Math.round((571.7 - A10.debate) * 30) + 16);
  const tHead = prog(f, 40, 56);
  return (
    <Frame bg="#8A7458">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={112}>
        {(layer) => [
          layer(0.85, <HallBack f={f} floor={fl} lit={0.85} />, 2),
          layer(1, (
            <g>
              <Rim kind="warm" side="l"><FigEl g={s.figs[0]} f={f} seed={113} /></Rim>
              <Lectern x={LC.x} floor={fl} />
            </g>
          )),
        ]}
      </CineCam>
      <LightPool x={700} y={300} r={760} f={f} color="#FFD49A" seed={114} strength={0.26} />
      <Look f={f} grade="lamp" vig={0.55} />
      <Plate text="Historians' debate" t={tHead} x={960} y={190} anchor="middle" size={28} />
      <GreyTag text="a man who grew" x={430} y={330} t={tGrew} f={f} />
      <GreyTag text="a man who was pushed" x={1490} y={330} t={tPushed} f={f} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 10.7 the Bliss copy: the last line under the camera, held
const BLISS_PAGE = {x: 380, y: 130, w: 1160, h: 820};
const blissLayout = () => {
  const D = doc('bliss');
  return layoutDoc(D.text, D.hand, 24, 1010, BLISS_PAGE.x + 74, BLISS_PAGE.y + 70, 1.36, 99);
};
const Bliss107: React.FC<{f: number; d: number}> = ({f, d}) => {
  const D = doc('bliss');
  const L = blissLayout();
  const startChar = D.text.indexOf('that government of the people');
  const u0 = startChar / L.chars;
  const a = Math.round((579.0 - A10.bliss) * 30);
  const b = Math.round((584.6 - A10.bliss) * 30);
  const read = u0 + (1 - u0) * prog(f, a, b, (t) => t);
  const p = nibAt(L, read);
  const pStart = nibAt(L, u0);
  const last = L.lines[L.lines.length - 1];
  const hold = {x: last.x + last.w / 2 - 120, y: last.y - 8};
  // the camera rides down the lines being read (text column centred), then settles on the last line
  const colX = BLISS_PAGE.x + 74 + 505;
  const lastC = {x: last.x + last.w / 2, y: last.y - 8};
  const cx = f < b ? colX : kf(f, [[b, colX], [b + 45, lastC.x]]);
  const cy = f < a ? kf(f, [[0, 540], [a, pStart.y - 8]]) : f < b ? p.y - 8 : kf(f, [[b, p.y - 8], [b + 45, lastC.y]]);
  const z = kf(f, [[0, 1.0], [12, 1.0], [a, 1.72], [b, 1.75], [b + 45, 2.5], [d, 2.65]]);
  void hold;
  const sigY = L.height + BLISS_PAGE.y + 70 + 24 * 1.6;
  return (
    <Frame bg="#3A2A1E">
      <CineDefs />
      <CineCam f={f} keys={[[0, z, cx, cy], [1, z, cx, cy]]} seed={115}>
        {(layer) => [
          layer(1, (
            <g>
              <DeskTop tone="night" />
              <PageInsert d={D} L={L} x={BLISS_PAGE.x} y={BLISS_PAGE.y} w={BLISS_PAGE.w} h={BLISS_PAGE.h} f={f} id="s107" label={f < a + 20}>
                {D.sign!.split('\n').map((sg, i) => (
                  <text key={i} x={BLISS_PAGE.x + BLISS_PAGE.w - 80} y={sigY + i * 30} textAnchor="end" fontFamily={FONT.hand} fontSize={24} fill="#2B2018">
                    {sg}
                  </text>
                ))}
              </PageInsert>
              {f >= a - 10 && <ellipse cx={f < b ? p.x - 60 : lastC.x} cy={(f < b ? p.y : lastC.y + 8) - 8} rx={260} ry={46} fill="#FFE6A0" opacity={0.16 * prog(f, a - 10, a + 10)} style={{mixBlendMode: 'screen'}} />}
            </g>
          )),
        ]}
      </CineCam>
      <LightPool x={1300} y={300} r={1000} f={f} color="#FFB060" seed={116} strength={0.26} />
      <Look f={f} grade="lamp" vig={0.6} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 10.8 end card over the woods at golden hour
const End108: React.FC<{f: number; d: number}> = ({f, d}) => (
  <Frame bg="#E9B872">
    <CineDefs />
    <CineCam f={f} keys={[[0, 1.0, 960, 540], [d, 1.06, 960, 520]]} seed={117}>
      {(layer) => [
        layer(0.12, <SkyGrad time="golden" id="s108sky" />),
        layer(0.12, <circle cx={1440} cy={330} r={90} fill="#FFE6A0" opacity={0.85} />),
        layer(0.25, <Birds f={f} n={4} seed={11} y={180} />),
        layer(0.35, <Ridge y={620} color="#B89A6A" seed={5} amp={70} />, 3),
        layer(0.55, <TreeRow y={720} f={f} n={10} s={1.1} color="#7A7A40" seed={4} />, 2),
        layer(0.8, <TreeRow y={860} f={f} n={6} s={1.6} color="#5E6A32" seed={8} />, 1),
        layer(1, <Clearing y={880} />),
        layer(1.5, <PassBy f={f} x0={-240} speed={1.4} y={1120} kind="grass" s={1.6} />),
      ]}
    </CineCam>
    <GodRays x={1440} y={330} w={300} f={f} angle={40} len={1100} op={0.12} />
    <Look f={f} grade="golden" vig={0.45} />
    <LightLeak f={f} t={0.6} />
    <EndCardOver f={f} />
  </Frame>
);

export const S10: React.FC = () => (
  <Shots
    start={S10S.S10_S}
    end={S10S.S10_E}
    shots={[
      {at: A10.train, el: (f, d) => <Train101 f={f} d={d} />},
      {at: A10.coffins, trans: 'fade', el: (f, d) => <Coffins102 f={f} d={d} />},
      {at: A10.thirteenth, trans: 'page', el: (f, d) => <Thirteenth103 f={f} d={d} />},
      {at: A10.memorial, trans: 'fade', el: (f, d) => <Memorial104 f={f} d={d} />},
      {at: A10.section, trans: 'cut', el: (f, d) => <Section105 f={f} d={d} />},
      {at: A10.debate, trans: 'cut', el: (f, d) => <Debate106 f={f} d={d} />},
      {at: A10.bliss, trans: 'page', el: (f, d) => <Bliss107 f={f} d={d} />},
      {at: A10.end, trans: 'fade', el: (f, d) => <End108 f={f} d={d} />},
    ]}
  />
);
void clamp;
