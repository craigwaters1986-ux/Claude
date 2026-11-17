// s05 — Chapter 4: Europe Falls (210-270 s). Storyboard S05-01 … S05-10 (scored tail 261-270 s).
import React from 'react';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack} from '../components/Camera';
import {Sky, Ground, Hills, Interior, Table, Tree, Flag, Clouds, Birds, Skyline, Building, Rubble, Street, Sun} from '../components/Environment';
import {Smoke, Fire, Particles, Searchlights, BarrageBalloon, Flak} from '../components/Effects';
import {Tank, Plane, SmallBoat} from '../components/Vehicles';
import {Dunkirk, ParisBoulevard, UndergroundShelter} from '../components/env/Places';
import {Map1940} from '../maps/EpisodeMaps';
import {walk, run, stand, march, sitGround, fistShake, talkGesture, mixPose, wade, bucketChain, holdFront, seated, slump, point} from '../characters/poses';
import {Hug} from '../characters/interactions';
import {castProps} from '../characters/cast';
import {RifleBetween, HeldItem} from '../characters/props';
import {DateCard, FactPill} from '../components/Text';
import {prog, clamp, lerp} from '../animations/core';
import {sec, Fig, Walker, Shot, ck, Microphone} from './kit';

const {b, cut} = sec('s05');
const T = [0, cut(1), cut(3), cut(4), cut(5), cut(6), cut(7), cut(8), 1369, cut(9), 1800];

// ------------------------------------------------------------ S05-01 phoney war
const Phoney: React.FC<{f: number}> = ({f}) => (
  <Shot f={f} bg="#C9CED2" keys={ck([0, 1.05, 860, 560], [T[1], 1.05, 1060, 560])}>
    <Sky top="#A9B2B8" bottom="#E4E4DE" />
    <Hills y={640} color="#D8DCDC" seed={3} />
    <Ground y={720} color={C.snow} />
    <path d="M300,720 L320,560 L760,560 L780,720 Z" fill="#9A9690" stroke={C.ink} strokeWidth={5} />
    <rect x={430} y={610} width={220} height={30} fill="#2A2A28" />
    <Birds f={f} n={1} seed={6} y={200} />
    <Fig k="frenchSoldier" x={900} y={890} f={f} pose={{...stand(f, 1), shL: 160 + 10 * Math.sin(f / 12), elL: 30}} expr="sleepy" />
    <Fig k="frenchSoldier" x={1180} y={895} f={f} pose={march(f / 10)} expr="cold" />
    <Fig k="frenchSoldier" x={1450} y={890} f={f} dir={-1} pose={holdFront(f, 2)} expr="neutral" holdR={<rect x={-6} y={-30} width={40} height={50} fill="#F4EBD6" stroke={C.ink} strokeWidth={2.5} />} />
    <Particles f={f} kind="snow" n={50} seed={3} opacity={0.8} />
  </Shot>
);

// ------------------------------------------------------------ S05-02 map: north, then the Low Countries
const North: React.FC<{f: number}> = ({f}) => {
  const t = f - T[1];
  return (
    <Shot f={f} bg="#9DBCC4">
      <Map1940 f={t} cues={{north: b.at(1) - T[1] + 15, low: b.at(2) - T[1] + 5, sickle: 9999, pocket: 9999}} />
    </Shot>
  );
};

// ------------------------------------------------------------ S05-03 Ardennes → sickle map (match)
const Ardennes: React.FC<{f: number}> = ({f}) => {
  const t = f - T[2];
  const toMap = prog(t, 88, 104);
  return (
    <Shot f={f} bg="#2E3A2E">
      <g opacity={1 - toMap} transform={`translate(${W / 2},${H / 2}) scale(${1 + toMap * 0.6}) translate(${-W / 2},${-H / 2})`}>
        <Sky top="#7E8A84" bottom="#B8B8A4" />
        {Array.from({length: 14}).map((_, i) => (
          <Tree key={i} x={-100 + i * 160} y={640 + (i % 3) * 10} kind="pine" s={1.5} color="#2E4A34" seed={i} f={f} />
        ))}
        <path d="M-200,760 Q960,690 2120,760 L2120,1300 L-200,1300Z" fill="#7A6A4E" stroke={C.ink} strokeWidth={5} />
        {[0, 1, 2, 3].map((i) => {
          const x = -400 + i * 480 + t * 6;
          return <Tank key={i} x={x} y={820 + (i % 2) * 20} dist={x} s={0.75} f={f} />;
        })}
        {Array.from({length: 10}).map((_, i) => (
          <Tree key={'n' + i} x={-150 + i * 230} y={1110} kind="pine" s={2.2} color="#22382A" seed={i + 40} f={f} />
        ))}
        <text x={1700} y={180} textAnchor="end" fontFamily={FONT.sans} fontWeight={900} fontSize={44} fill="#F4EBD6" stroke={C.ink} strokeWidth={5} paintOrder="stroke" letterSpacing={3} opacity={prog(t, 10, 25)}>
          ARDENNES
        </text>
      </g>
      <g opacity={toMap}>
        <Map1940 f={t - 95} cues={{north: -300, low: -200, sickle: 5, pocket: 75}} />
      </g>
    </Shot>
  );
};

// ------------------------------------------------------------ S05-04 Dunkirk
const DunkirkShot: React.FC<{f: number}> = ({f}) => {
  const t = f - T[3];
  return (
    <Shot f={f} bg="#9A9C98" keys={ck([T[3], 1.15, 650, 600], [T[3] + 100, 1.15, 760, 620], [T[3] + 170, 1.3, 1350, 760], [T[4], 1.32, 1400, 770])}>
      <Dunkirk f={f} />
      <Plane x={1800 - t * 3} y={180} f={f} kind="bf109" s={0.25} dir={-1} />
      <Plane x={2100 - t * 3} y={220} f={f} kind="bf109" s={0.22} dir={-1} />
      <SmallBoat x={1260} y={840} f={f} s={0.7} color="#3F6EA6" seed={5} passengers={2} />
      <Fig k="tom" x={lerp(1150, 1225, prog(t, 150, 220))} y={850} f={f} s={0.55} pose={wade(t / 30, 60)} cutBelow={850} expr="determined" nearArmFront overlayTop={(sk) => <RifleBetween a={{x: sk.armL.hx - 20, y: sk.armL.hy}} b={{x: sk.armR.hx + 30, y: sk.armR.hy}} />} />
      <Fig k="sailor" x={1300} y={835} f={f} s={0.55} dir={-1} pose={{...stand(f, 1), shR: 80, elR: 20, lean: 12}} expr="determined" cutBelow={812} />
    </Shot>
  );
};

// ------------------------------------------------------------ S05-05 Paris falls
const Paris40: React.FC<{f: number}> = ({f}) => (
  <Shot f={f} bg="#A9C4D0" keys={ck([T[4], 1.0, 960, 560], [T[5], 1.05, 960, 570])}>
    <ParisBoulevard f={f} />
    {Array.from({length: 8}).map((_, i) => (
      <Fig key={i} k="germanSoldier" x={-200 + (i % 4) * 130 + (f - T[4]) * 3 + Math.floor(i / 4) * 60} y={860 + Math.floor(i / 4) * 40} f={f} s={0.8} pose={march(f / 12 + (i % 2) * 0.5)} expr="neutral" lod="low" />
    ))}
    <Fig k="woman1" x={1300} y={960} f={f} s={1.05} dir={-1} pose={{...stand(f, 2), shR: 150, elR: 125, headTilt: 10}} nearArmFront expr="sad" />
    <Fig k="man2" x={1460} y={955} f={f} s={1.05} dir={-1} pose={stand(f, 3)} expr="sad" />
    <Fig k="kid1" x={1580} y={960} f={f} s={1.05} dir={-1} pose={stand(f, 4)} expr="worried" />
    <Fig k="man1" x={1720} y={950} f={f} s={1.05} dir={-1} pose={slump(f, 4)} expr="sad" />
  </Shot>
);

// ------------------------------------------------------------ S05-06 Churchill
const Churchill: React.FC<{f: number}> = ({f}) => {
  const t = f - T[5];
  const pose = t < 50 ? mixPose(stand(f, 1), {...fistShake(f), shR: 40, elR: 30}, prog(t, 10, 22)) : mixPose(fistShake(f), talkGesture(f, 1), prog(t, 50, 64));
  return (
    <Shot f={f} bg="#6E5A44" keys={ck([T[5], 1.0, 1000, 560], [T[6], 1.12, 1060, 520])}>
      <Interior wall="#6A5A48" floor="#4A3A2E" floorY={820} />
      <rect x={260} y={200} width={360} height={300} fill="#9FB6C8" stroke={C.ink} strokeWidth={6} />
      <line x1={440} y1={200} x2={440} y2={500} stroke={C.ink} strokeWidth={5} />
      <Flag x={1560} y={760} f={f} kind="uk" w={170} h={105} pole={420} seed={3} />
      <Table x={760} y={780} w={520} color="#5A3E2A" />
      <Microphone x={1210} y={660} s={1.0} />
      <Fig k="churchill" x={lerp(1000, 1060, prog(t, 50, 70))} y={900} f={f} s={1.1} pose={pose} expr="determined" talking={t > 50} tag />
    </Shot>
  );
};

// ------------------------------------------------------------ S05-07 RAF airfield → dogfight
const Battle: React.FC<{f: number}> = ({f}) => {
  const t = f - T[6];
  return (
    <Shot f={f} bg="#AFCFD6" keys={ck([T[6], 1.0, 960, 560], [T[6] + 55, 1.0, 960, 520], [T[6] + 95, 1.0, 960, -380], [T[7], 1.0, 1000, -420])}>
      <rect x={-200} y={-1400} width={2400} height={1500} fill="#8FB7CF" />
      <Sky top="#9FC6D8" bottom="#E8E6D2" />
      <Clouds f={f} n={5} seed={14} speed={0.6} yMin={-1000} yMax={-200} />
      <Clouds f={f} n={3} seed={15} speed={0.4} yMin={60} yMax={300} />
      <Hills y={700} color="#8DA35A" seed={6} />
      <Ground y={740} color="#9BB066" />
      {[600, 1050, 1500].map((x, i) => (
        <Plane key={i} x={x} y={800} f={f} kind="spitfire" s={0.8} gear prop={t > 40 + i * 6} />
      ))}
      {[0, 1, 2].map((i) => (
        <Fig key={i} k="rafPilot" x={lerp(200 + i * 90, 560 + i * 450, prog(t, 0, 40 + i * 5))} y={900} f={f} pose={t < 45 ? run(t / 9 + i) : stand(f, i)} expr="determined" />
      ))}
      {/* dogfight high above */}
      {[0, 1, 2].map((i) => (
        <Plane key={'s' + i} x={(200 + i * 400 + t * 9) % 2600 - 300} y={-600 + i * 110 + Math.sin(t / 15 + i) * 60} f={f} kind="spitfire" s={0.5} bank={Math.sin(t / 15 + i) * 20} trail />
      ))}
      {[0, 1, 2].map((i) => (
        <Plane key={'m' + i} x={(1900 - i * 420 - t * 7) % 2600 + 300} y={-520 + i * 120 + Math.cos(t / 13 + i) * 50} f={f} kind="bf109" s={0.45} dir={-1} bank={Math.cos(t / 13 + i) * 18} trail />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Plane key={'b' + i} x={2200 - t * 2.5 - i * 170} y={-900 + i * 50} f={f} kind="bomber" s={0.4} dir={-1} />
      ))}
    </Shot>
  );
};

// ------------------------------------------------------------ S05-08 the Blitz at night
const Blitz: React.FC<{f: number}> = ({f}) => {
  const t = f - T[7];
  return (
    <Shot f={f} bg="#141C2A" keys={ck([T[7], 1.05, 800, 540], [T[8], 1.05, 1120, 540])}>
      <Sky top="#0E1626" bottom="#3A3040" />
      <Searchlights f={f} xs={[300, 900, 1500]} base={760} />
      <rect x={-200} y={600} width={2400} height={200} fill="#C8642A" opacity={0.18} />
      <Skyline base={800} color="#1E2230" seed={9} dome={1000} lit={0.15} />
      {[400, 1350, 1700].map((x, i) => (
        <Fire key={i} x={x} y={720} f={f} s={0.5} seed={i} />
      ))}
      <Smoke x={1350} y={680} f={f} n={8} size={60} rise={400} drift={100} color="#2A2A2A" opacity={0.6} seed={5} />
      {[[300, 300], [1000, 220], [1600, 340]].map(([x, y], i) => (
        <BarrageBalloon key={i} x={x} y={y} f={f} s={0.6} seed={i} />
      ))}
      {[0, 1, 2].map((i) => (
        <Plane key={i} x={2000 - t * 4 - i * 220} y={120 + i * 40} f={f} kind="bomber" s={0.35} dir={-1} />
      ))}
      <Flak f={f} seed={4} n={6} y0={60} y1={380} />
      <rect x={-200} y={800} width={2400} height={500} fill="#141820" />
    </Shot>
  );
};

// ------------------------------------------------------------ S05-09 the Underground shelter
const Shelter: React.FC<{f: number}> = ({f}) => {
  const thuds = [f - 1380, f - 1420, f - 1455];
  const thud = Math.max(...thuds.map((d) => (d >= 0 && d < 20 ? 1 - d / 20 : 0)));
  return (
    <Shot f={f} bg="#C9BFA8" keys={ck([T[8], 1.0, 960, 600], [T[9], 1.1, 960, 640])} shake={thud * 1.5}>
      <UndergroundShelter f={f} />
      <Fig k="man1" x={260} y={900} f={f} pose={sitGround(f, 1)} expr="tired" />
      <Fig k="woman2" x={430} y={905} f={f} pose={sitGround(f, 2)} expr="worried" />
      <Fig k="kid2" x={560} y={910} f={f} pose={sitGround(f, 3)} expr="scared" look={[0, -1]} />
      <Hug f={f} x={960} y={910} kind="comfort" adult={{...castProps('anna'), pose: sitGround(f, 4), head: {...castProps('anna').head, expression: 'worried'}}} other={{...castProps('leo'), pose: sitGround(f, 5), head: {...castProps('leo').head, expression: 'scared'}, look: [0, -1]}} />
      <Fig k="politician2" x={1380} y={905} f={f} pose={sitGround(f, 6)} expr="tired" />
      <Fig k="woman1" x={1520} y={905} f={f} pose={sitGround(f, 7)} expr="sad" />
      <g opacity={0.5 + thud * 0.5}>
        <Particles f={f} kind="dust" n={40} seed={7} opacity={0.7} />
      </g>
      <rect x={-200} y={-200} width={2400} height={1500} fill="#000" opacity={0.12 + 0.12 * Math.max(0, Math.sin(f * 1.7)) * (Math.sin(f / 13) > 0.6 ? 1 : 0)} />
    </Shot>
  );
};

// ------------------------------------------------------------ S05-10 the morning after → Spitfires (tail)
const After: React.FC<{f: number}> = ({f}) => {
  const t = f - T[9];
  const ppl = ['anna', 'man1', 'woman2', 'worker', 'man3'];
  return (
    <Shot f={f} bg="#C9C6BA" keys={ck([T[9], 1.05, 900, 560], [1620, 1.05, 960, 520], [1730, 1.0, 960, -120], [1800, 1.0, 980, -160])}>
      <rect x={-200} y={-900} width={2400} height={1000} fill="#9FC0D0" />
      <Sky top="#A9C4D0" bottom="#E8DCC0" />
      <Sun x={1500} y={-300} f={f} />
      <Clouds f={f} n={5} seed={22} speed={0.5} yMin={-700} yMax={150} />
      <Skyline base={640} color="#8A8C90" seed={12} dome={980} />
      <Smoke x={980} y={600} f={f} n={8} size={90} rise={500} drift={80} color="#B8B4AC" opacity={0.45 * (1 - prog(t, 0, 300))} outline={false} seed={6} />
      <Street base={760} seed={31} f={f} damaged={0.7} />
      <Ground y={760} color="#B2ACA0" />
      <Rubble x={1250} y={800} w={600} seed={7} />
      {ppl.map((k, i) => {
        const c = bucketChain(f / 40 + i * 0.18);
        return <Fig key={i} k={k} x={200 + i * 150} y={900} f={f} pose={c.pose} expr="determined" overlayFront={c.holding ? (sk) => <HeldItem a={{x: sk.armL.hx, y: sk.armL.hy}} b={{x: sk.armR.hx, y: sk.armR.hy}} kind="brick" /> : undefined} />;
      })}
      <Fig k="leo" x={lerp(1000, 1320, prog(t, 10, 120))} y={910} f={f} pose={t < 120 ? walk(t / 14) : holdFront(f, 2)} expr="happy" holdR={<g><rect x={-4} y={-14} width={22} height={20} rx={3} fill="#F4F1E8" stroke={C.ink} strokeWidth={2.5} /></g>} />
      <Fig k="britSoldier" x={1420} y={905} f={f} dir={-1} pose={t > 120 ? {...stand(f, 2), shR: 70, elR: 30} : stand(f, 2)} expr={t > 120 ? 'happy' : 'tired'} />
      {[0, 1, 2].map((i) => (
        <Plane key={i} x={-300 + (t - 150) * 9 - i * 160} y={-260 + i * 50} f={f} kind="spitfire" s={0.45} />
      ))}
      <Birds f={f} n={4} seed={9} y={300} />
    </Shot>
  );
};

export const S05Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: T[0], to: T[1], el: <Phoney f={f} />},
      {from: T[1], to: T[2], el: <North f={f} />},
      {from: T[2], to: T[3], el: <Ardennes f={f} />, trans: 'cut'},
      {from: T[3], to: T[4], el: <DunkirkShot f={f} />},
      {from: T[4], to: T[5], el: <Paris40 f={f} />, trans: 'cut'},
      {from: T[5], to: T[6], el: <Churchill f={f} />},
      {from: T[6], to: T[7], el: <Battle f={f} />, trans: 'cut'},
      {from: T[7], to: T[8], el: <Blitz f={f} />, trans: 'dip'},
      {from: T[8], to: T[9], el: <Shelter f={f} />},
      {from: T[9], to: T[10], el: <After f={f} />},
    ]}
  />
);

export const S05Overlay: React.FC = () => (
  <g>
    <DateCard at={b.at(1) + 6} until={T[2] - 145} date="APRIL 1940" title="DENMARK AND NORWAY INVADED" />
    <FactPill at={b.at(2)} until={T[2] - 4} text="MAY 1940: NETHERLANDS · BELGIUM · LUXEMBOURG · FRANCE" x={1880} y={330} anchor="end" maxW={760} />
    <FactPill at={T[3] + 12} until={b.at(4) + 145} text="MORE THAN 330,000 TROOPS EVACUATED" x={1880} y={300} anchor="end" />
    <FactPill at={b.at(4) + 150} until={T[4] - 2} text="MOST LEFT FROM THE HARBOUR MOLE ON LARGER SHIPS" x={1880} y={300} anchor="end" maxW={820} />
    <DateCard at={T[4] + 2} until={T[4] + 92} date="MAY–JUNE 1940" title="FALL OF FRANCE" />
    <DateCard at={T[6] + 8} until={T[7] - 4} date="1940" title="BATTLE OF BRITAIN" sub="Summer and autumn 1940" />
    <DateCard at={T[7] + 12} until={T[8] - 2} date="1940–1941" title="THE BLITZ" />
    <FactPill at={T[8] + 6} until={T[9] - 2} text="MORE THAN 40,000 CIVILIANS KILLED IN THE BLITZ" x={W / 2} y={300} anchor="middle" />
  </g>
);
