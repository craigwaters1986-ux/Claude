// 4.7b the U.S. Capitol in 1847 (old low Bulfinch dome, before the new dome and wings), with the date card.
import React from 'react';
import {Frame} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {CineCam, CineDefs, PassBy} from '../kit/Cinema';
import {Capitol} from '../kit/Sets04b';
import {SkyGrad, TreeRow} from '../kit/Sets04';
import {DateCard} from '../components/Text';
import {Clouds} from '../components/Environment';
import {Birds} from '../components/Environment';
import {parishWalk} from '../characters/parishWalk';
import {Look} from './s04-sets';

const BASE = 800;
export const CapitolShot: React.FC<{f: number; d: number; dateAt: number}> = ({f, d, dateAt}) => (
  <Frame bg="#9CC4D8">
    <CineDefs />
    <CineCam f={f} keys={[[0, 1.0, 960, 520], [d, 1.12, 960, 540]]} seed={73}>
      {(layer) => [
        layer(0.12, <SkyGrad time="day" id="capsky04" />),
        layer(0.2, <Clouds f={f} n={5} seed={4} speed={0.5} yMin={60} yMax={260} />),
        layer(0.3, <Birds f={f} n={4} seed={3} y={240} />),
        layer(0.55, <TreeRow y={BASE - 40} f={f} n={12} s={1.0} color="#6E8A50" seed={12} x0={-600} x1={2600} />, 2),
        layer(0.8, <Capitol x={960} base={BASE} s={0.95} dome="bulfinch" f={f} />),
        layer(0.9, (
          <g>
            <rect x={-800} y={BASE} width={3600} height={600} fill="#7E9A50" />
            <path d={`M520,${BASE + 280} Q960,${BASE + 10} 1400,${BASE + 280}`} fill="none" stroke="#C9B890" strokeWidth={40} />
            {/* passers-by on the paths (illustrative) */}
            {[0, 1, 2].map((i) => {
              const dist = f * (1.6 + i * 0.2) + i * 90;
              const dir = (i % 2 ? -1 : 1) as 1 | -1;
              return <Person key={i} id={['townsman', 'townswoman', 'visitor'][i]} x={(i % 2 ? 1500 : 300) + dir * dist} y={BASE + 150 + i * 40} f={f} seed={100 + i} pose={parishWalk(dist, false, 0.2 * i, 0)} dir={dir} scale={0.55} lod="low" />;
            })}
          </g>
        )),
        layer(1.4, <PassBy f={f} x0={-300} speed={1.8} y={1180} kind="branch" s={2.2} />),
      ]}
    </CineCam>
    <Look f={f} grade="day" vig={0.4} />
    <DateCard at={dateAt + 10} until={dateAt + d - 6} date="1847" title="U.S. House of Representatives" />
  </Frame>
);
