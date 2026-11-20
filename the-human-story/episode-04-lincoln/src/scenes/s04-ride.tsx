// s04 riding shots (kit Horse): 4.3 into Springfield with two saddlebags, 4.7a the legal circuit in the rain,
// and 4.7b the Capitol (pre-dome) with the date card.
import React from 'react';
import {Frame} from '../kit/Shots';
import {Person, castScale} from '../kit/Cast';
import {CineCam, CineDefs, PassBy} from '../kit/Cinema';
import {Quad, Reins, RideOut, walkDist} from '../kit/Horse';
import {SkyGrad, Ridge, TreeRow} from '../kit/Sets04';
import {PlaceTag} from '../kit/Places';
import {Particles} from '../components/Effects';
import {C} from '../styles/theme';
import {hash, prog} from '../animations/core';
import {stand} from '../characters/poses';
import * as Q from './s04-solve';
import {Look, Courthouse, PrairieRoad} from './s04-sets';
import {CapitolShot} from './s04-capitol';

const ink = C.ink;
const o = (w = 4) => ({stroke: ink, strokeWidth: w, strokeLinejoin: 'round' as const});

/** Rider on the horse (horse, rider, reins) from a RideOut. */
export const Rider: React.FC<{r: RideOut; f: number; ex?: string; look?: [number, number]; seed?: number}> = ({r, f, ex, look, seed = 5}) => (
  <g>
    <Quad rig={r.rig} pl={r.horsePl} f={f} saddle saddlebags />
    <Person id="abeLawyer" x={r.rider.pl.x} y={r.rider.pl.y} scale={(r.rider.pl.scale ?? 1) / castScale('abeLawyer')} dir={r.rider.pl.dir} pose={r.rider.P} f={f} seed={seed} shadow={false} look={look} head={ex ? {expression: ex as never} : undefined} />
    <Reins r={r} />
  </g>
);

/** Dust kicked up behind the horse: puffs that spawn at the hooves and drift back. */
const Dust: React.FC<{r: RideOut; f: number; color?: string; n?: number; x0?: number; s?: number; dir?: number; speed?: number}> = ({r, f, color = '#D8C49A', n = 10, x0 = 520, s = 1.1, dir = 1, speed = 2.3}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const age = (f + i * 6) % 60;
      const born = f - age;
      const x = x0 + dir * s * walkDist(Math.max(0, born), 0, 400, speed) - dir * (90 + hash(i) * 80 + age * 0.8);
      const y = r.horsePl.y - 6 - age * 0.6;
      return <circle key={i} cx={x} cy={y} r={10 + age * 0.9} fill={color} opacity={0.45 * (1 - age / 60)} />;
    })}
  </g>
);

/** 1830s frame buildings with false fronts along a street (generic, never labelled as specific buildings). */
const FrameTown: React.FC<{base: number; f: number}> = ({base, f}) => (
  <g>
    {Array.from({length: 9}, (_, i) => {
      const x = -400 + i * 420 + hash(i) * 60;
      const w = 300 + hash(i * 3) * 80;
      const h = 260 + hash(i * 5) * 130;
      const fill = ['#C9B79A', '#B8A07A', '#D2C4A4', '#A89070'][i % 4];
      return (
        <g key={i}>
          <rect x={x} y={base - h} width={w} height={h} fill={fill} {...o(5)} />
          {Array.from({length: Math.floor(h / 30)}, (_, k) => <line key={k} x1={x} y1={base - 26 - k * 30} x2={x + w} y2={base - 26 - k * 30} stroke="#8A7A5E" strokeWidth={2.5} opacity={0.6} />)}
          <rect x={x - 8} y={base - h - 18} width={w + 16} height={22} fill="#7A6A52" {...o(3.5)} />
          {[0.18, 0.62].map((k, j) => <rect key={j} x={x + w * k} y={base - h + 50} width={70} height={90} fill="#3A4A5A" {...o(3.5)} />)}
          <rect x={x + w * 0.4} y={base - 150} width={70} height={150} fill="#5A3E28" {...o(3.5)} />
          <rect x={x - 20} y={base - 170} width={w + 40} height={14} fill="#6A5038" {...o(3)} />
          {[0, 1].map((k) => <rect key={k} x={x - 14 + k * (w + 20)} y={base - 160} width={10} height={160} fill="#6A5038" {...o(2.5)} />)}
        </g>
      );
    })}
    <rect x={-600} y={base} width={4400} height={24} fill="#8A6A48" {...o(3.5)} />
  </g>
);

// ---------------------------------------------------------------- 4.3 into Springfield, 1837
export const RideShot: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = Q.solveRide(f);
  const r = s.ride as RideOut;
  return (
    <Frame bg="#9CC4D8">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={71}>
        {(layer) => [
          layer(0.15, <SkyGrad time="day" id="rsky04" />),
          layer(0.45, <TreeRow y={560} f={f} n={14} s={1.1} color="#7A8A50" seed={6} x0={-600} x1={3400} />, 2),
          layer(0.8, (
            <g>
              <FrameTown base={Q.RIDE_FLOOR - 120} f={f} />
              {[700, 1500, 2300].map((x, i) => <Person key={i} id={['townsman', 'townswoman', 'farmer'][i]} x={x} y={Q.RIDE_FLOOR - 96} f={f + i * 20} seed={90 + i} pose={stand(f + i * 13, 90 + i)} lod="low" scale={0.8} dir={-1} look={[-0.7, 0]} />)}
            </g>
          ), 1),
          layer(1, (
            <g>
              <rect x={-600} y={Q.RIDE_FLOOR - 40} width={4400} height={900} fill="#B89A6A" />
              <line x1={-600} y1={Q.RIDE_FLOOR - 40} x2={3800} y2={Q.RIDE_FLOOR - 40} stroke={ink} strokeWidth={4} />
              {Array.from({length: 30}, (_, i) => <path key={i} d={`M${-500 + i * 150},${Q.RIDE_FLOOR + 30 + (i % 3) * 30} q20,-6 40,0`} stroke="#8A6E48" strokeWidth={3} fill="none" />)}
              <Dust r={r} f={f} />
              <Rider r={r} f={f} ex={s.figs[0].ex?.expression} look={s.figs[0].look} />
            </g>
          )),
          layer(1.45, <PassBy f={f} x0={2400} speed={-4.5} y={1240} kind="post" s={1} />),
        ]}
      </CineCam>
      <Particles f={f} kind="dust" n={40} seed={4} wind={0.6} />
      <Look f={f} grade="day" vig={0.4} />
      <PlaceTag text="Springfield, 1837" t={prog(f, 12, 26) * (1 - prog(f, d - 14, d))} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 4.7a the legal circuit: horseback in the rain, to the courthouse
export const CircuitShot: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = Q.solveCircuit(f, d);
  const r = s.ride as RideOut;
  return (
    <Frame bg="#5A6A78">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={72}>
        {(layer) => [
          layer(0.15, <SkyGrad time="dusk" id="csky04" />),
          layer(0.15, <rect x={-800} y={-600} width={3600} height={2000} fill="#5A6878" opacity={0.6} />),
          layer(0.35, <Ridge y={640} color="#6A7468" seed={7} amp={40} />, 3),
          layer(0.6, <TreeRow y={720} f={f} n={12} s={1.1} color="#4E5E44" seed={9} x0={-600} x1={3200} />, 2),
          layer(0.92, <Courthouse x={1380 + d * 2.5} base={Q.RIDE_FLOOR - 50} f={f} />, 1),
          layer(1, (
            <g>
              <PrairieRoad y={Q.RIDE_FLOOR - 40} f={f} />
              <Rider r={r} f={f} ex={s.figs[0].ex?.expression} look={s.figs[0].look} seed={7} />
            </g>
          )),
          layer(1.5, <PassBy f={f} x0={1700} speed={-5} y={1180} kind="grass" s={1.8} />),
        ]}
      </CineCam>
      <Particles f={f} kind="rain" n={170} seed={9} wind={-1.2} />
      <Look f={f} grade="dusk" vig={0.55} />
    </Frame>
  );
};

export {CapitolShot};
