// s06 shots built on the shared kit (Sets04b Capitol and crowd, Flag): 6.5 the Capitol with its unfinished
// dome on 4 March 1861, Lincoln (beard) on the steps; and the Fort Sumter flag coming down on the beat.
import React from 'react';
import {Frame} from '../kit/Shots';
import {CineCam, CineDefs} from '../kit/Cinema';
import {SkyGrad} from '../kit/Sets04';
import {Capitol, CAPITOL_STEPS, Crowd, Lectern} from '../kit/Sets04b';
import {raiseFlag, FlagPole} from '../kit/Flag';
import {Person} from '../kit/Cast';
import {Clouds} from '../components/Environment';
import {orate} from '../characters/poses';
import {Look, DateCardF, CrowdRow} from './s06-sets';

export const CapitolShot: React.FC<{f: number; d: number}> = ({f, d}) => {
  const base = 800;
  const s = 0.95;
  const st = CAPITOL_STEPS(960, base, s);
  return (
    <Frame bg="#9CC4D8">
      <CineDefs />
      <CineCam f={f} keys={[[0, 1.0, 960, 500], [d, 1.42, 960, st.y - 70]]} seed={67}>
        {(layer) => [
          layer(0.15, <SkyGrad time="day" id="cap-sky" />),
          layer(0.25, <Clouds f={f} n={5} seed={4} speed={0.4} yMin={60} yMax={260} />),
          layer(1, (
            <g>
              <Capitol x={960} base={base} s={s} dome="unfinished" f={f} />
              <rect x={-800} y={base} width={3600} height={600} fill="#8DA35A" />
              <Lectern x={st.x + 34} floor={st.y} s={0.42} />
              <Person id="abePres" x={st.x - 4} y={st.y} scale={0.4} dir={1} pose={orate(f, 3)} f={f} seed={67} look={[0.8, 0]} expression="determined" />
              <CrowdRow f={f} y={base + 30} x0={300} x1={1620} n={22} s={0.34} seed={9} mood="listen" />
            </g>
          )),
          layer(1.25, <Crowd x0={-300} x1={2200} y={1060} f={f} rows={3} s={1.1} seed={6} fromBehind />, 3),
        ]}
      </CineCam>
      <Look f={f} grade="day" vig={0.4} />
      <DateCardF f={f} at={8} until={d + 20} date="4 March 1861" />
    </Frame>
  );
};

/** The fort's flag on its pole; `lower` 0..1 brings it down (raiseFlag reversed). */
export const SumterFlag: React.FC<{f: number; x: number; base: number; h: number; lower: number}> = ({f, x, base, h, lower}) => {
  const out = raiseFlag(f, 1 - lower, {pole: {x, base, h}});
  return <FlagPole out={out} f={f} wind={1.2} stars={33} poleColor="#8A8478" />;
};
