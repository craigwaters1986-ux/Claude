// Chapter 8 shots built on the shared kit maps and sets: 8.2 Atlanta taken on the map, then an election-day
// queue outside a polling place (November 1864); 8.4's wide of the Capitol steps on 4 March 1865.
import React from 'react';
import {Frame} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {CineCam, CineDefs, GradeLayer} from '../kit/Cinema';
import {SkyGrad, HouseFront, TreeRow} from '../kit/Sets04';
import {Capitol, CAPITOL_STEPS, Crowd} from '../kit/Sets04b';
import {PlaceTag} from '../kit/Places';
import {USMap, usProjection, BattleMarker, PlaceDot, StateLabel, MAPC, PLACES, CONFEDERACY} from '../kit/USMap';
import {Clouds} from '../components/Environment';
import {pose, stand} from '../characters/poses';
import {handWorld} from '../characters/skeleton';
import {prog} from '../animations/core';
import {castBuild, castScale} from '../kit/Cast';
import {walk04} from './reelSolve';
import {Look, Plate} from './s08-sets';
import {T, TE} from '../timeline';
import {A08} from './s08-solve';

// ---------------------------------------------------------------- 8.2 Atlanta on the map, then the queue at the polls
const QUEUE = [
  {id: 'farmer', x: 1300, seed: 1},
  {id: 'townsman', x: 1150, seed: 2},
  {id: 'unionSoldier', x: 1000, seed: 3},
  {id: 'visitor', x: 850, seed: 4},
  {id: 'farmer', x: 700, seed: 5},
  {id: 'townsman', x: 550, seed: 6},
  {id: 'visitor', x: 400, seed: 7},
];
export const AtlantaShot: React.FC<{f: number; d: number}> = ({f, d}) => {
  // Phase D2: the map holds through "took Atlanta," (45% into the caption) and the polling queue arrives on "and in November"
  // (was a fixed frame 92)
  const cueA = T('Then Union forces took Atlanta'), cueB = TE('Then Union forces took Atlanta');
  const X = Math.round((cueA + 0.45 * (cueB - cueA) - A08.atlanta) * 30);
  const mix = prog(f, X, X + 14);
  const proj = usProjection('WAR_EAST');
  const g = Math.max(0, f - X);
  const fl = 880;
  const [ax, ay] = proj(PLACES.Atlanta)!;
  return (
    <Frame bg={MAPC.sea}>
      <CineDefs />
      {mix < 1 && (
        <g opacity={1 - mix}>
          <CineCam f={f} keys={[[0, 1.0, 960, 470], [X + 14, 1.45, ax + 60, ay - 60]]} seed={821}>
            {(layer) => [
              layer(1, (
                <g>
                  <USMap proj={proj} f={f} year={1864} id="atl" states={Object.fromEntries(CONFEDERACY.map((c) => [c, {fill: MAPC.confed, t: 1}]))} />
                  <StateLabel proj={proj} code="GA" t={prog(f, 4, 18)} />
                  <BattleMarker proj={proj} at={PLACES.Atlanta} label="Atlanta" t={prog(f, 14, 30)} side="right" s={1.1} />
                  <PlaceDot proj={proj} at={PLACES.Atlanta} t={prog(f, 24, 34)} dot={1} ring={1} f={f} color={MAPC.union} />
                </g>
              )),
            ]}
          </CineCam>
          <GradeLayer grade="day" />
        </g>
      )}
      {mix > 0 && (
        <g opacity={mix}>
          <CineCam f={g} keys={[[0, 1.12, 900, 600], [d - X, 1.2, 960, 610]]} seed={822}>
            {(layer) => [
              layer(0.15, <SkyGrad time="day" id="s82sky" />),
              layer(0.2, <Clouds f={f} n={5} seed={2} speed={0.25} yMin={30} yMax={200} color="#D8DCDC" />),
              layer(0.5, <TreeRow y={300} f={f} n={8} s={0.9} color="#5A5A44" seed={4} kind="bare" />, 2),
              layer(0.9, <HouseFront floor={fl} doorX={1500} lit={0.15} />, 1),
              layer(1, (
                <g>
                  {QUEUE.map((q, i) => {
                    // the queue shuffles forward one place, front first
                    const start = 10 + i * 9;
                    const w = walk04(g, start, start + 26, 2.2, castBuild(q.id), 0.2 + i * 0.13);
                    return <Person key={i} id={q.id} x={q.x + w.d} y={fl} scale={0.98} dir={1} pose={g < start ? stand(g, q.seed) : w.P} f={f} seed={q.seed} look={[0.6, 0]} expression={i % 3 === 0 ? 'determined' : 'neutral'} />;
                  })}
                </g>
              )),
            ]}
          </CineCam>
          <Look f={f} grade="day" vig={0.42} amount={0.6} />
        </g>
      )}
      <PlaceTag text="September 1864 · Atlanta" t={prog(f, 16, 30) * (1 - prog(f, X - 6, X + 6))} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 8.4 the Capitol steps, 4 March 1865 (finished dome), crowd
export const CapitolWide: React.FC<{f: number; d: number}> = ({f, d}) => {
  const base = 760;
  const s = 0.82;
  const st = CAPITOL_STEPS(960, base, s);
  const id = 'abe1865';
  const pl = {x: st.x - 6, y: st.y, scale: castScale(id, 0.32), dir: 1 as const};
  const P = pose({...stand(f, 3), shR: 52, elR: 58, shL: 46, elL: 62, headTilt: 8});
  const h = handWorld(pl, P, 'R', castBuild(id));
  return (
    <g>
      <CineCam f={f} keys={[[0, 1.0, 960, 560], [d, 1.14, 960, 520]]} seed={84}>
        {(layer) => [
          layer(0.15, <SkyGrad time="day" id="s84sky" />),
          layer(0.2, <Clouds f={f} n={6} seed={5} speed={0.3} yMin={30} yMax={220} />),
          layer(0.9, (
            <g>
              <Capitol x={960} base={base} s={s} dome="finished" f={f} />
              <Person id={id} x={pl.x} y={pl.y} scale={0.32} dir={1} pose={P} f={f} seed={8} head={{hat: 'none'}} />
              <rect x={h.x - 2} y={h.y - 14} width={14} height={18} fill="#F4EBD6" stroke="#151515" strokeWidth={1.5} transform={`rotate(-10,${h.x},${h.y})`} />
              <Crowd x0={180} x1={1740} y={base + 60} f={f} rows={3} s={0.55} seed={3} fromBehind hats={0.5} />
            </g>
          ), 0),
          layer(1.15, <Crowd x0={-300} x1={2220} y={1010} f={f} rows={4} s={1.15} seed={7} fromBehind hats={0.45} />),
        ]}
      </CineCam>
      <Look f={f} grade="day" vig={0.42} />
      <PlaceTag text="4 March 1865" t={prog(f, 8, 22)} />
    </g>
  );
};
void Plate;
