// s08 — Chapter 7: D-Day and the Liberation of Europe (390-450 s). Storyboard S08-01 … S08-10 (tail 442.5-450 s).
import React from 'react';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack} from '../components/Camera';
import {Sky, Ground, Hills, Clouds, Sea, Interior, Table, Flag, Tree} from '../components/Environment';
import {Smoke, Explosion, Particles, Flak, BarrageBalloon} from '../components/Effects';
import {Tank, Plane, Ship, LandingCraft, Truck, Glider, Parachute} from '../components/Vehicles';
import {NormandyNight, DDayBeach, ParisBoulevard} from '../components/env/Places';
import {MapNormandy, MapBagration, MapEurope1945, Europe1944Content} from '../maps/EpisodeMaps';
import {WallMap, Gauge} from '../maps/MapKit';
import {walk, run, stand, point, dangle, wade, takeCover, crouchRun, kneel, cheerV, waveSide, holdFront, sitGround, talkGesture} from '../characters/poses';
import {shoulderWorld} from '../characters/skeleton';
import {RifleBetween} from '../characters/props';
import {Crowd} from '../characters/Crowd';
import {DateCard, FactPill, TermCard} from '../components/Text';
import {prog, clamp, lerp} from '../animations/core';
import {sec, Fig, Walker, Shot, ck} from './kit';

const {b, cut} = sec('s08');
const T = [0, cut(1), cut(2), 432, cut(3), cut(4), cut(5), cut(6), cut(7), 1590, 1800];

// ------------------------------------------------------------ S08-01 Allied HQ briefing
const Briefing: React.FC<{f: number}> = ({f}) => (
  <Shot f={f} bg="#7A6A58" keys={ck([0, 1.0, 960, 540], [T[1], 1.12, 1000, 480])}>
    <Interior wall="#8A7A64" floor="#5A4A3A" floorY={820} />
    <WallMap x={560} y={110} w={820} kind="europe" cam={{lon: 12, lat: 49, zoom: 0.9}} f={f} id="hq">
      {({toScreen}) => <Europe1944Content toScreen={toScreen} f={f} />}
    </WallMap>
    <Fig k="eisenhower" x={460} y={900} f={f} s={1.05} pose={f > 40 ? point(f, 128) : talkGesture(f, 1)} expr="determined" talking={f > b.at(0) && f < b.endOf(0)} tag />
    {[0, 1, 2].map((i) => (
      <Fig key={i} k={i === 1 ? 'britSoldier' : 'usSoldier'} x={1250 + i * 190} y={910} f={f} dir={-1} pose={{...stand(f, i), lean: 8 * prog(f, 30 + i * 10, 60 + i * 10)}} expr="neutral" look={[-0.8, -0.5]} />
    ))}
  </Shot>
);

// ------------------------------------------------------------ S08-02 night drop over Normandy
const Drop: React.FC<{f: number}> = ({f}) => {
  const t = f - T[1];
  const paras = Array.from({length: 8}).map((_, i) => {
    const t0 = 5 + i * 7;
    const k = Math.max(0, t - t0);
    const x = 300 + i * 190 + Math.sin(i * 3) * 40 + k * 0.6;
    const y = 160 + (i % 3) * 40 + k * 2.4;
    const open = clamp(k / 14);
    const pl = {x, y, scale: 0.35, dir: 1 as const};
    const sh = shoulderWorld(pl, dangle(f + i));
    return {x, y, open, sh, pl, i};
  });
  return (
    <Shot f={f} bg="#0E1626" keys={ck([T[1], 1.0, 960, 500], [T[2], 1.04, 960, 560])}>
      <NormandyNight f={f} />
      <Flak f={f} seed={9} n={5} y0={80} y1={360} />
      {[0, 1, 2, 3].map((i) => (
        <Plane key={i} x={-300 + t * 9 + i * 260} y={110 + (i % 2) * 50} f={f} kind="dakota" s={0.4} />
      ))}
      {paras.map((p) => (
        <g key={p.i}>
          <Parachute x={p.sh.x} y={p.sh.y} f={f} open={p.open} s={0.35} seed={p.i} />
          <Fig k="paratrooper" x={p.x} y={p.y} f={f + p.i} s={0.35} pose={dangle(f + p.i)} expr="determined" />
        </g>
      ))}
      <Glider x={lerp(1900, 1200, prog(t, 0, 100))} y={lerp(380, 600, prog(t, 0, 100))} f={f} s={0.45} dir={-1} pitch={-8} mark="roundel" stripes />
    </Shot>
  );
};

// ------------------------------------------------------------ S08-03 the armada at dawn
const Armada: React.FC<{f: number}> = ({f}) => {
  const t = f - T[2];
  return (
    <Shot f={f} bg="#C9C2B0" keys={ck([T[2], 1.2, 960, 640], [T[3], 1.0, 960, 560])}>
      <Sky top="#8E9AA8" bottom="#F0D8B0" />
      <Sea y={560} f={f} colors={['#5E7A8A', '#4E6A7A', '#3E5A6A']} amp={8} />
      {Array.from({length: 14}).map((_, i) => (
        <Ship key={i} x={-100 + i * 160} y={560 + (i % 3) * 8} f={f} s={0.12 + (i % 3) * 0.03} kind={i % 4 === 0 ? 'liner' : 'warship'} seed={i} smoke={false} />
      ))}
      {[200, 700, 1300, 1750].map((x, i) => (
        <BarrageBalloon key={i} x={x} y={360 + (i % 2) * 40} f={f} s={0.35} seed={i} />
      ))}
      {[0, 1, 2].map((i) => (
        <Ship key={'w' + i} x={300 + i * 650} y={700 + i * 10} f={f} s={0.4} kind="warship" seed={i + 20} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <LandingCraft key={i} x={150 + i * 320} y={860 + (i % 2) * 70 + t * 0.3} f={f} s={0.7 + (i % 2) * 0.2} seed={i} troops={5} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <Plane key={'p' + i} x={-300 + t * 6 + (i % 3) * 200} y={120 + i * 35} f={f} kind="heavy" s={0.25} />
      ))}
    </Shot>
  );
};

// ------------------------------------------------------------ S08-04 Normandy map
const NormandyMap: React.FC<{f: number}> = ({f}) => (
  <Shot f={f} bg="#8FB2BC">
    <MapNormandy f={f - T[3]} cues={{drops: 10, beaches: 30, arrows: 140}} />
  </Shot>
);

// ------------------------------------------------------------ S08-05 the beach, day → night
const Beach: React.FC<{f: number}> = ({f}) => {
  const t = f - T[4];
  const sky = 2 * prog(f, 818, 905);
  const keys = ['usSoldier', 'britSoldier', 'canSoldier', 'tom', 'usSoldier'];
  return (
    <Shot f={f} bg="#C9C2B0" keys={ck([T[4], 1.1, 900, 620], [818, 1.1, 1060, 620], [T[5], 1.0, 960, 560])}>
      <DDayBeach f={f} sky={sky} />
      <Explosion x={1500} y={880} f={t} at={30} s={0.4} seed={2} />
      <Explosion x={300} y={900} f={t} at={80} s={0.35} seed={4} />
      <LandingCraft x={1650} y={1000} f={f} s={0.9} ramp={prog(t, 0, 15)} seed={7} troops={2} />
      {keys.map((k, i) => {
        const tt = t - i * 12;
        const ashore = tt > 60;
        return ashore ? (
          <Fig key={i} k={k} x={420 + i * 230} y={760 + (i % 2) * 20} f={f + i * 5} s={0.75} pose={tt < 90 ? crouchRun(tt / 9) : takeCover(f, i)} expr="determined" />
        ) : (
          <Fig key={i} k={k} x={1450 - i * 120 - tt * 3} y={930} f={f + i * 5} s={0.75} pose={wade(tt / 30, 50)} cutBelow={930} expr="determined" nearArmFront overlayTop={(sk) => <RifleBetween a={{x: sk.armL.hx - 20, y: sk.armL.hy}} b={{x: sk.armR.hx + 30, y: sk.armR.hy}} />} />
        );
      })}
      <Fig k="britSoldier" x={1260} y={790} f={f} s={0.75} pose={sitGround(f, 3)} expr="tired" />
      <Fig k="medic" x={1340} y={795} f={f} s={0.75} dir={-1} pose={kneel(f)} expr="determined" />
      {sky > 1.4 && <Flak f={f} seed={12} n={3} y0={60} y1={250} />}
      <Smoke x={900} y={560} f={f} n={6} size={60} rise={300} drift={100} color="#5A5A5A" opacity={0.5} seed={8} />
    </Shot>
  );
};

// ------------------------------------------------------------ S08-06 resistance sabotage at night
const Sabotage: React.FC<{f: number}> = ({f}) => {
  const t = f - T[5];
  const flash = t - 120;
  return (
    <Shot f={f} bg="#0E1626" keys={ck([T[5], 1.1, 800, 640], [T[5] + 110, 1.1, 900, 640], [T[5] + 122, 1.0, 1500, 560], [T[6], 1.0, 1520, 560])} shake={flash > 0 && flash < 15 ? 2 : 0}>
      <Sky top="#0A1220" bottom="#26344A" />
      <circle cx={300} cy={160} r={40} fill="#F4F0DC" opacity={0.85} />
      <Hills y={620} color="#1E2A22" seed={5} amp={30} />
      <Ground y={660} color="#24301E" />
      <rect x={-200} y={770} width={3000} height={16} fill="#3A3A36" />
      <rect x={-200} y={810} width={3000} height={16} fill="#3A3A36" />
      {Array.from({length: 30}).map((_, i) => <rect key={i} x={-200 + i * 100} y={762} width={20} height={72} fill="#4A3A2A" />)}
      {[200, 900, 1600, 2300].map((x, i) => (
        <g key={i}>
          <rect x={x} y={380} width={12} height={300} fill="#3A2E24" stroke={C.ink} strokeWidth={2} />
          <rect x={x - 40} y={400} width={92} height={8} fill="#3A2E24" />
          {i < 3 && <path d={`M${x + 6},402 Q${x + 356},${i === 0 && t > 70 ? 560 : 440} ${x + 706},402`} stroke="#8A8A80" strokeWidth={2} fill="none" />}
        </g>
      ))}
      <Explosion x={1700} y={780} f={t} at={120} s={0.7} seed={3} />
      <Fig k="resistance" x={lerp(700, 300, prog(t, 60, 110))} y={880} f={f} pose={t < 50 ? kneel(f) : crouchRun(t / 8)} expr="determined" dir={t < 50 ? 1 : -1} />
      <Fig k="resistance" x={lerp(860, 420, prog(t, 64, 112))} y={890} f={f + 7} pose={t < 54 ? kneel(f + 3) : crouchRun(t / 8 + 0.4)} expr="worried" dir={t < 54 ? 1 : -1} />
      <Fig k="resistance" x={260} y={880} f={f + 13} pose={t < 75 ? {...stand(f, 1), shR: 150, elR: 40} : crouchRun(t / 8)} expr="determined" />
      <Particles f={f} kind="embers" n={12} seed={4} opacity={flash > 0 ? 0.8 : 0} />
    </Shot>
  );
};

// ------------------------------------------------------------ S08-07 Paris liberated
const Paris44: React.FC<{f: number}> = ({f}) => {
  const t = f - T[6];
  return (
    <Shot f={f} bg="#A9C4D0" keys={ck([T[6], 1.15, 960, 400], [T[7], 1.05, 960, 600])}>
      <ParisBoulevard f={f} flags={prog(t, 0, 40)} />
      <Truck x={-200 + t * 6} y={880} dist={t * 6} s={0.7} jeep mark="usstar" color="#5E6238" />
      <Tank x={-650 + t * 6} y={880} dist={t * 6} s={0.6} f={f} color="#5E6238" mark="star" />
      <Crowd f={f} count={40} x0={-50} x1={1970} yBack={940} yFront={1060} scaleBack={0.7} scaleFront={0.9} pool="paris1944" mix={{cheer: 3, wave: 2}} excitement={1} seed={14} />
      <Particles f={f} kind="confetti" n={60} seed={11} opacity={0.9} />
    </Shot>
  );
};

// ------------------------------------------------------------ S08-08 Bagration
const Bagration: React.FC<{f: number}> = ({f}) => (
  <Shot f={f} bg="#9DBCC4">
    <MapBagration f={f - T[7]} />
  </Shot>
);

// ------------------------------------------------------------ S08-09 squeezed: men, fuel, time
const Squeeze: React.FC<{f: number}> = ({f}) => {
  const t = f - T[8];
  const cam = {lon: lerp(13, 12, prog(t, 0, 180)), lat: 50.5, zoom: lerp(1.3, 1.6, prog(t, 0, 180))};
  const g = (d: number) => 0.9 - 0.75 * prog(t, 80 + d, 170 + d);
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapEurope1945 f={t} t={0} cam={cam} cues={{arrows: 10}} />
      <rect x={1480} y={300} width={380} height={520} rx={18} fill="#F4EBD6" opacity={0.92} stroke={C.ink} strokeWidth={4} />
      <Gauge x={1670} y={410} value={g(0)} label="MEN" s={0.9} />
      <Gauge x={1670} y={570} value={g(15)} label="FUEL" s={0.9} />
      <Gauge x={1670} y={730} value={g(30)} label="TIME" s={0.9} />
    </Shot>
  );
};

// ------------------------------------------------------------ S08-10 winter dusk: the stalled truck (tail)
const Stalled: React.FC<{f: number}> = ({f}) => {
  const t = f - T[9];
  const roll = prog(t, 0, 40);
  return (
    <Shot f={f} bg="#5E6278" keys={ck([T[9], 1.0, 960, 600], [T[9] + 120, 1.08, 960, 600], [T[10], 1.08, 960, 420])}>
      <Sky top="#3A4060" bottom="#C8A890" />
      <Hills y={640} color="#E4E4E8" seed={9} amp={20} />
      <Ground y={680} color={C.snow} />
      {[200, 400, 1500, 1700].map((x, i) => (
        <Tree key={i} x={x} y={690} kind="pine" s={0.9} color="#3E4A3E" seed={i} f={f} />
      ))}
      <Truck x={lerp(500, 820, roll)} y={860} dist={lerp(500, 820, roll)} s={1.0} color="#6A6F5D" mark="cross" cover="#7A7D68" />
      <Fig k="germanWinter" x={1150} y={920} f={f} dir={-1} pose={{...holdFront(f, 2), shR: 70 + 25 * Math.sin(f / 3) * (t > 50 && t < 120 ? 1 : 0), elR: 20}} expr={t > 120 ? 'worried' : 'cold'} look={t > 120 ? [0, -1] : undefined} holdR={<rect x={-4} y={-22} width={40} height={52} rx={4} fill="#5E6238" stroke={C.ink} strokeWidth={3} />} />
      {Array.from({length: 6}).map((_, i) => (
        <Plane key={i} x={-300 + t * 5 + (i % 3) * 170} y={120 + Math.floor(i / 3) * 60 + (i % 3) * 20} f={f} kind="heavy" s={0.18} />
      ))}
      <Particles f={f} kind="snow" n={70} seed={3} wind={-0.8} />
    </Shot>
  );
};

export const S08Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: T[0], to: T[1], el: <Briefing f={f} />},
      {from: T[1], to: T[2], el: <Drop f={f} />, trans: 'dip'},
      {from: T[2], to: T[3], el: <Armada f={f} />, trans: 'cut'},
      {from: T[3], to: T[4], el: <NormandyMap f={f} />},
      {from: T[4], to: T[5], el: <Beach f={f} />, trans: 'cut'},
      {from: T[5], to: T[6], el: <Sabotage f={f} />},
      {from: T[6], to: T[7], el: <Paris44 f={f} />, trans: 'cut'},
      {from: T[7], to: T[8], el: <Bagration f={f} />},
      {from: T[8], to: T[9], el: <Squeeze f={f} />, trans: 'cut'},
      {from: T[9], to: T[10], el: <Stalled f={f} />},
    ]}
  />
);

export const S08Overlay: React.FC = () => (
  <g>
    <FactPill at={85} until={T[1] - 4} text="ALLIES FIGHTING IN ITALY SINCE 1943" x={W / 2 + 100} y={700} anchor="middle" />
    <DateCard at={T[1] + 8} until={T[2] - 2} date="6 JUNE 1944" title="D-DAY" />
    <TermCard at={T[1] + 14} until={T[2] + 60} term="OPERATION OVERLORD" meaning="The Allied invasion of north-west Europe" />
    <FactPill at={T[2] + 70} until={T[3] - 4} text="THE LARGEST SEABORNE INVASION IN HISTORY" x={1880} y={330} anchor="end" />
    <FactPill at={T[3] + 10} until={T[4] - 4} text="AROUND 156,000 ALLIED TROOPS ASHORE ON D-DAY" sub="BY SEA AND BY AIR" subAt={564} x={1880} y={150} anchor="end" />
    <FactPill at={T[4] + 8} until={860} text="ABOUT 10,000 ALLIED CASUALTIES (EST.)" x={1880} y={300} anchor="end" />
    <DateCard at={T[6] + 4} until={T[7] - 2} date="AUGUST 1944" title="PARIS LIBERATED" sub="25 August 1944" />
    <FactPill at={T[7] + 8} until={T[8] - 4} text="JUNE 1944: OPERATION BAGRATION" x={1880} y={150} anchor="end" />
  </g>
);
