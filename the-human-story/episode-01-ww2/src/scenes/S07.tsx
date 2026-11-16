// s07 — Chapter 6: The Turning Points (330-390 s). Storyboard S07-01 … S07-09 (scored tail 380.8-390 s).
import React from 'react';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack, SplitPanels, Camera} from '../components/Camera';
import {Sky, Ground, Hills, Clouds, Sea, HistoryRoom, Chalk, Flag} from '../components/Environment';
import {Smoke, Particles} from '../components/Effects';
import {Tank, Plane, CarrierTop} from '../components/Vehicles';
import {Stalingrad, Factory} from '../components/env/Places';
import {MapMidway, MapStalingrad} from '../maps/EpisodeMaps';
import {CarrierTally} from '../maps/MapKit';
import {walk, stand, point, shrug, talkGesture, mixPose, crouchRun, handsUp, binocularsPose, holdFront, cheerV, run} from '../characters/poses';
import {Binoculars, RifleBetween} from '../characters/props';
import {DateCard, FactPill} from '../components/Text';
import {prog, clamp, lerp} from '../animations/core';
import {sec, Fig, Walker, Shot, ck, ChalkPath} from './kit';

const {b, cut} = sec('s07');
const T = [0, cut(1), 278, cut(2), cut(3), cut(4), cut(5), cut(6), 1440, 1800];

// ------------------------------------------------------------ S07-01 history room: the tide turns
const Tide: React.FC<{f: number}> = ({f}) => {
  const tap = f > 90;
  return (
    <Shot f={f} bg={C.wallYellow} keys={ck([0, 1.0, 960, 540], [T[1], 1.05, 1000, 520])}>
      <HistoryRoom
        f={f}
        board={
          <g>
            <ChalkPath d="M640,600 L1640,600 M640,600 L640,200" reveal={prog(f, 4, 20)} w={5} />
            <ChalkPath d="M660,260 C820,300 900,520 1080,560 C1260,600 1380,380 1620,220" reveal={prog(f, 20, 85)} w={9} />
            <Chalk x={1460} y={250} text="1942" size={52} reveal={prog(f, 70, 90)} />
            {tap && <circle cx={1560} cy={260} r={22 + 8 * Math.abs(Math.sin(f / 4))} fill="none" stroke="#F4F1E8" strokeWidth={4} opacity={0.8} />}
          </g>
        }
      />
      <Fig k="guide" x={tap ? 520 : 360} y={900} f={f} s={1.5} pose={tap ? point(f, 135) : talkGesture(f, 1)} expr="determined" talking={f > b.at(0) && f < b.endOf(0)} turn={0.35} />
    </Shot>
  );
};

// ------------------------------------------------------------ S07-02 Midway map
const Midway: React.FC<{f: number}> = ({f}) => (
  <Shot f={f} bg="#9DBCC4">
    <MapMidway f={f - T[1]} />
  </Shot>
);

// ------------------------------------------------------------ S07-03 dive bombers over the carrier
const Dive: React.FC<{f: number}> = ({f}) => {
  const t = f - T[2];
  const struck = clamp(Math.floor((t - 20) / 30) + 1, 0, 4);
  return (
    <Shot f={f} bg="#5E8394" keys={ck([T[2], 1.0, 960, 540], [T[3], 1.1, 900, 600])}>
      <rect x={-200} y={-200} width={2400} height={1500} fill="#4E7384" />
      {Array.from({length: 26}).map((_, i) => (
        <path key={i} d={`M${(i * 337) % 2200 - 150 + Math.sin(f / 30 + i) * 10},${(i * 211) % 1200} q20,-8 40,0 t40,0`} stroke="#fff" strokeWidth={3} opacity={0.3} fill="none" />
      ))}
      <CarrierTop x={900} y={680} f={f} s={1.1} rot={-12} burning={prog(t, 50, 110)} />
      {[0, 1, 2].map((i) => {
        const k = prog(t, i * 18, 70 + i * 18);
        return <Plane key={i} x={lerp(1900 + i * 120, 950 + i * 60, k) - Math.max(0, t - 70 - i * 18) * 8} y={lerp(-80 - i * 60, 470, k) - Math.max(0, t - 70 - i * 18) * 9} f={f} kind="dauntless" s={0.5} dir={-1} bank={-40} brakes={k > 0.2 ? 1 : 0} />;
      })}
      <Smoke x={900} y={640} f={f} n={8} size={60} rise={500} drift={150} color="#2A2A2A" opacity={0.6 * prog(t, 60, 90)} seed={3} />
      <Clouds f={f} n={4} seed={31} speed={1.2} yMin={50} yMax={420} color="#F4F4EE" />
      <g transform="translate(1340,430)">
        <CarrierTally x={0} y={0} struck={struck} f={f} />
      </g>
    </Shot>
  );
};

// ------------------------------------------------------------ S07-04 El Alamein: night → first light
const Alamein: React.FC<{f: number}> = ({f}) => {
  const t = f - T[3];
  const dawn = prog(t, 40, 200);
  const top = dawn < 0.5 ? '#1A2238' : '#6E7A92';
  return (
    <Shot f={f} bg="#C9A86A" keys={ck([T[3], 1.0, 960, 560], [T[4], 1.08, 1060, 560])}>
      <Sky top={top} bottom={dawn < 0.5 ? '#3A3448' : '#F0C890'} />
      <rect x={-200} y={-200} width={2400} height={900} fill="#F0C890" opacity={dawn * 0.5} />
      {Array.from({length: 8}).map((_, i) => {
        const fl = Math.max(0, Math.sin(f / 4 + i * 2.1)) ** 14;
        return <ellipse key={i} cx={100 + i * 250} cy={620} rx={80} ry={26} fill="#FFD27A" opacity={fl * (1 - dawn * 0.6)} />;
      })}
      <Hills y={630} color="#C9A86A" seed={21} amp={25} />
      <Ground y={660} color="#D9C08E" />
      {[0, 1, 2, 3].map((i) => {
        const x = -300 + i * 420 + t * 2.2;
        return <Tank key={i} x={x} y={i % 2 ? 800 : 740} dist={x} s={i % 2 ? 0.75 : 0.55} f={f} color="#B8A06A" mark="none" />;
      })}
      {[0, 1, 2].map((i) => (
        <Walker key={i} k={i === 1 ? 'ausSoldierDesert' : 'britSoldierDesert'} f={t} x0={-100 + i * 170} speed={1.6} y={960} expr="determined" />
      ))}
      <Particles f={f} kind="dust" n={30} seed={5} wind={1.5} opacity={0.5} />
      <Tank x={1500} y={880} dist={0} s={1.0} f={f} color="#B8A06A" mark="none" exhaust dust={false} />
      <Fig k="montgomery" x={1500} y={760} f={f} s={0.95} pose={binocularsPose(f, prog(t, 20, 40))} nearArmFront overlayTop={(sk) => <Binoculars head={sk.head} r={sk.d.R} t={prog(t, 20, 40)} />} expr="determined" cutBelow={720} tag />
    </Shot>
  );
};

// ------------------------------------------------------------ S07-05 Stalingrad ruins → pincer map (match)
const StalingradShot: React.FC<{f: number}> = ({f}) => {
  const t = f - T[4];
  const toMap = prog(f, 772, 790);
  return (
    <Shot f={f} bg="#8C9298" keys={ck([T[4], 1.0, 960, 560], [790, 1.12, 1000, 560])}>
      <g opacity={1 - toMap}>
        <Stalingrad f={f} />
        {[0, 1, 2].map((i) => (
          <Fig key={i} k="sovietWinter" x={-100 + i * 160 + t * 7} y={900 + (i % 2) * 20} f={f} pose={crouchRun(t / 9 + i)} expr="determined" />
        ))}
        <Particles f={f} kind="snow" n={60} seed={2} wind={-1} />
      </g>
      <g opacity={toMap}>
        <MapStalingrad f={f - 772} cues={{pincers: 10, pocket: 60}} />
      </g>
    </Shot>
  );
};

// ------------------------------------------------------------ S07-06 the surrender (sombre, not triumphant)
const Surrender: React.FC<{f: number}> = ({f}) => {
  const t = f - T[5];
  return (
    <Shot f={f} bg="#C9CED2" keys={ck([T[5], 1.0, 860, 560], [T[6], 1.0, 1080, 560])} sombre={0.2}>
      <Sky top="#9AA0A8" bottom="#D8D8D4" />
      <Ground y={700} color={C.snow} />
      {Array.from({length: 9}).map((_, i) => (
        <Fig key={i} k="germanWinter" x={-200 + i * 190 + t * 1.1} y={860 + (i % 2) * 30} f={f} s={0.85} pose={{...walk(t / 34 + i * 0.3, 0.45), shL: 165, elL: 15, shR: 165, elR: 15}} expr="tired" lod={i % 2 ? 'low' : undefined} />
      ))}
      {[0, 1].map((i) => (
        <Fig key={'g' + i} k="sovietWinter" x={600 + i * 800} y={980} f={f} dir={-1} pose={stand(f, i)} expr="solemn" s={1.05} />
      ))}
      <Particles f={f} kind="snow" n={70} seed={6} wind={-0.6} />
    </Shot>
  );
};

// ------------------------------------------------------------ S07-07 history room: no single battle
const NoSingle: React.FC<{f: number}> = ({f}) => {
  const t = f - T[6];
  const pose = t < 30 ? {...stand(f, 1), shR: 165, elR: 10} : t < 55 ? {...stand(f, 1), headTilt: 8 * Math.sin(t / 3)} : shrug(f);
  const icons: [string, number][] = [['MIDWAY', 760], ['EL ALAMEIN', 1140], ['STALINGRAD', 1520]];
  return (
    <Shot f={f} bg={C.wallYellow} keys={ck([T[6], 1.0, 960, 540], [T[7], 1.03, 960, 540])}>
      <HistoryRoom
        f={f}
        board={
          <g>
            <ChalkPath d="M690,330 l140,0 l-20,40 l-100,0 Z M740,330 l0,-50 l40,0 l0,50" reveal={1} w={5} />
            <ChalkPath d="M1070,370 l140,0 l0,-40 l-140,0 Z M1110,330 l0,-30 l60,0 l0,30 M1170,315 l60,0" reveal={1} w={5} />
            <ChalkPath d="M1450,370 l0,-90 l40,0 l0,40 l30,-20 l0,70 M1530,370 l0,-60 l50,0 l0,60" reveal={1} w={5} />
            {icons.map(([n, x], i) => (
              <Chalk key={i} x={x} y={440} text={n} size={34} />
            ))}
            <Chalk x={950} y={345} text="+" size={70} />
            <Chalk x={1330} y={345} text="+" size={70} />
          </g>
        }
      />
      <Fig k="guide" x={340} y={900} f={f} s={1.5} pose={pose} expr="neutral" talking={f > b.at(5) && f < b.endOf(5)} turn={0.3} />
    </Shot>
  );
};

// ------------------------------------------------------------ S07-08 the aircraft factory
const FactoryShot: React.FC<{f: number}> = ({f}) => {
  const t = f - T[7];
  return (
    <Shot f={f} bg="#9AA8AE" keys={ck([T[7], 1.1, 600, 640], [1300, 1.1, 1000, 640], [T[8], 1.1, 1400, 620])}>
      <Factory f={f} kind="aircraft" doors={prog(t, 110, 170)} speed={1.3} />
      {[0, 1, 2, 3, 4].map((i) => {
        const k = i % 2 ? 'workerW' : 'worker';
        const x = 250 + i * 330;
        return <Fig key={i} k={k} x={x} y={960} f={f + i * 11} pose={i === 2 ? walk(t / 18) : {...holdFront(f + i * 9, i), shR: 90 + 20 * Math.sin(f / 3 + i), elR: 30}} expr="determined" />;
      })}
    </Shot>
  );
};

// ------------------------------------------------------------ S07-09 three panels → bombers fly east (tail)
const Production: React.FC<{f: number}> = ({f}) => {
  const t = f - T[8];
  const merge = prog(f, 1525, 1575);
  const panel = (k: number, node: React.ReactNode, flag: 'su' | 'uk' | 'us') => (
    <g>
      <g transform={`translate(${k * 640 - 640},0)`}>{node}</g>
      <Flag x={k * 640 + 40} y={160} f={f} kind={flag} w={90} h={56} pole={110} seed={k + 40} />
    </g>
  );
  const tanks = (
    <Camera f={f} keys={ck([T[8], 1.0, 960, 560], [1530, 1.05, 960, 560])}>
      <Sky top="#9AA4AC" bottom="#DADCD8" />
      <Ground y={720} color="#8A8A72" />
      {[0, 1, 2, 3].map((i) => {
        const x = 300 + i * 420 + t * 3;
        return <Tank key={i} x={x} y={820} dist={x} s={0.75} f={f} variant="t34" />;
      })}
    </Camera>
  );
  const ships = (
    <Camera f={f} keys={ck([T[8], 1.0, 960, 560], [1530, 1.05, 960, 560])}>
      <Factory f={f} kind="shipyard" launch={prog(t, 15, 75)} />
      {[0, 1, 2].map((i) => (
        <Fig key={i} k={i === 1 ? 'workerW' : 'worker'} x={700 + i * 220} y={940} f={f} pose={t > 60 ? cheerV(f, i) : stand(f, i)} expr={t > 60 ? 'joy' : 'neutral'} />
      ))}
    </Camera>
  );
  const field = (
    <Camera f={f} keys={ck([T[8], 1.0, 960, 560], [1530, 1.05, 960, 560])}>
      <Sky top="#9FC6D8" bottom="#E8E6D2" />
      <Ground y={720} color="#9BB066" />
      {[0, 1].map((i) => (
        <Plane key={i} x={600 + i * 700 + Math.max(0, t - 20 - i * 25) ** 1.6} y={800 - Math.max(0, t - 50 - i * 25) * 4} f={f} kind="heavy" s={0.7} gear={t < 50 + i * 25} />
      ))}
    </Camera>
  );
  return (
    <Shot f={f} bg="#E8E6D2" drift={0.8}>
      <g opacity={1 - merge}>
        <SplitPanels id="s0709" reveal={prog(t, 0, 20)} panels={[{x0: -10, x1: 640, node: panel(0, tanks, 'su')}, {x0: 640, x1: 1280, node: panel(1, ships, 'uk')}, {x0: 1280, x1: 1930, node: panel(2, field, 'us')}]} />
      </g>
      <g opacity={merge}>
        <Sky top="#4E5A7A" bottom="#E8A870" />
        <Clouds f={f} n={5} seed={41} speed={0.6} yMin={60} yMax={400} color="#F2D8C0" />
        <Sea y={880} f={f} colors={['#4E6070', '#3E5060']} amp={6} layers={2} />
        <path d="M-200,880 L500,860 L700,880 Z" fill="#6E7A5A" />
        {Array.from({length: 9}).map((_, i) => (
          <Plane key={i} x={-400 + (f - 1525) * 4 + (i % 3) * 140 - Math.floor(i / 3) * 260} y={260 + (i % 3) * 50 + Math.floor(i / 3) * 90} f={f} kind="heavy" s={0.3} />
        ))}
      </g>
    </Shot>
  );
};

export const S07Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: T[0], to: T[1], el: <Tide f={f} />},
      {from: T[1], to: T[2], el: <Midway f={f} />},
      {from: T[2], to: T[3], el: <Dive f={f} />, trans: 'cut'},
      {from: T[3], to: T[4], el: <Alamein f={f} />, trans: 'wipe'},
      {from: T[4], to: T[5], el: <StalingradShot f={f} />},
      {from: T[5], to: T[6], el: <Surrender f={f} />, trans: 'cut'},
      {from: T[6], to: T[7], el: <NoSingle f={f} />, trans: 'cut'},
      {from: T[7], to: T[8], el: <FactoryShot f={f} />, trans: 'cut'},
      {from: T[8], to: T[9], el: <Production f={f} />, trans: 'wipe'},
    ]}
  />
);

export const S07Overlay: React.FC = () => (
  <g>
    <DateCard at={T[1] + 10} until={T[2] - 2} date="1942" title="MIDWAY" sub="June 1942" />
    <FactPill at={T[2] + 8} until={T[3] - 4} text="FOUR JAPANESE CARRIERS SUNK" x={1880} y={300} anchor="end" />
    <DateCard at={T[3] + 10} until={T[4] - 4} date="1942" title="EL ALAMEIN" sub="October–November 1942" />
    <FactPill at={780} until={T[5] - 4} text="MORE THAN 250,000 AXIS TROOPS TRAPPED (EST.)" x={1880} y={330} anchor="end" maxW={760} />
    <DateCard at={T[5] + 6} until={1000} date="1943" title="GERMAN DEFEAT AT STALINGRAD" sub="February 1943" />
    <FactPill at={990} until={T[6] - 4} text="AROUND 91,000 AXIS PRISONERS TAKEN" x={1880} y={300} anchor="end" />
    <FactPill at={T[7] + 15} until={T[8] - 4} text="THE ALLIES BUILT MORE THAN TWICE AS MANY AIRCRAFT AS THE AXIS" x={W / 2} y={150} anchor="middle" maxW={1500} />
  </g>
);
