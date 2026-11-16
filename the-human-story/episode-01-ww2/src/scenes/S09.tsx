// s09 — Chapter 8: The Fall of Nazi Germany (450-510 s). Storyboard S09-01 … S09-10.
// Holocaust passage (S09-02 … S09-05): sombre, no bodies, no camp interiors, no counters, no inscription.
import React from 'react';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack} from '../components/Camera';
import {Sky, Ground, Clouds, Sea, Interior, Table, Flag, Document, Building, Street, Sun} from '../components/Environment';
import {Smoke, Fire, Particles, Candle, sombreFrame} from '../components/Effects';
import {Tank, Ship} from '../components/Vehicles';
import {CampPerimeter, Memorial, BerlinRuins, Bunker} from '../components/env/Places';
import {MapEurope1945} from '../maps/EpisodeMaps';
import {walk, stand, standStiff, signDocument, helmetToChest, hatOff, headBowed, survivorStand, survivorSit, receiveBothHands, holdFront, march, cheerV, waveSide} from '../characters/poses';
import {Pen, HeldItem} from '../characters/props';
import {Hug} from '../characters/interactions';
import {Crowd} from '../characters/Crowd';
import {castProps} from '../characters/cast';
import {GroupTag} from '../characters/StickFigure';
import {DateCard, FactPill, ListPill, MemorialCard, Stamp} from '../components/Text';
import {prog, clamp, lerp} from '../animations/core';
import {sec, Fig, Shot, ck, Bunting} from './kit';

const {b, cut} = sec('s09');
const T = [0, cut(1), cut(2), cut(3), cut(4), cut(5), cut(6), cut(7), 1545, cut(8), 1800];

// ------------------------------------------------------------ S09-01 converging on Berlin
const Converge: React.FC<{f: number}> = ({f}) => {
  const k = prog(f, 0, T[1]);
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapEurope1945 f={f} t={1 + k} cam={{lon: lerp(13, 13.4, k), lat: lerp(50.5, 52.2, k), zoom: lerp(1.4, 2.0, k)}} cues={{arrows: 20}} />
    </Shot>
  );
};

// ------------------------------------------------------------ S09-02 the road to the camp
const Road: React.FC<{f: number}> = ({f}) => {
  const t = f - T[1];
  const sf = sombreFrame(f, 1);
  const slow = prog(t, 60, 120);
  return (
    <Shot f={f} bg="#8A8C8C" keys={ck([T[1], 1.0, 960, 560], [T[2], 1.06, 960, 520])} sombre={0.45}>
      <CampPerimeter f={f} view="road" />
      {[0, 1, 2].map((i) => {
        const d = t * 1.4 * (1 - slow * 0.8);
        return <Fig key={i} k={i === 1 ? 'britSoldier' : 'usSoldier'} x={760 + i * 150} y={1000 - d * 0.5} f={sf} s={0.95 - d * 0.0012} fromBehind pose={slow > 0.95 ? stand(sf, i) : walk(d / 60, 0.6)} expr="solemn" />;
      })}
    </Shot>
  );
};

// ------------------------------------------------------------ S09-03 liberation: survivors, with dignity
const Barracks: React.FC<{f: number}> = ({f}) => {
  const t = f - T[2];
  const sf = sombreFrame(f, 1);
  const give = prog(t, 70, 130);
  return (
    <Shot f={f} bg="#8A8C8C" keys={ck([T[2], 1.0, 860, 560], [T[3], 1.0, 1000, 560])} sombre={0.45}>
      <CampPerimeter f={f} view="barracks" />
      <Fig k="survivor" x={520} y={860} f={sf} s={0.8} pose={survivorStand(sf, 1)} expr="tired" />
      <Fig k="survivorNoCap" x={650} y={865} f={sf} s={0.8} pose={survivorSit(sf, 2)} expr="sad" />
      <Fig k="survivor" x={1460} y={860} f={sf} s={0.8} dir={-1} pose={survivorStand(sf, 3)} expr="neutral" />
      <Fig k="britSoldier" x={1180} y={880} f={sf} s={0.85} dir={-1} pose={helmetToChest(sf, prog(t, 20, 60))} hatInHand={hatOff(prog(t, 20, 60)) ? {} : undefined} expr="solemn" />
      <Fig k="usSoldier" x={880} y={880} f={sf} s={0.85} pose={{...holdFront(sf, 1), shR: 60 + give * 20, shL: 55 + give * 20}} expr="solemn" overlayFront={(sk) => <HeldItem a={{x: sk.armL.hx, y: sk.armL.hy}} b={{x: sk.armR.hx, y: sk.armR.hy}} kind="blanket" />} />
      <Fig k="survivorNoCap" x={1000} y={875} f={sf} s={0.8} dir={-1} pose={receiveBothHands(sf, give)} expr="tired" />
    </Shot>
  );
};

// ------------------------------------------------------------ S09-04 / S09-05 candles → memorial wall
const Candles: React.FC<{f: number; phase: 1 | 2}> = ({f, phase}) => {
  const sf = sombreFrame(f, 1);
  const n = phase === 1 ? Math.round(1 + 47 * prog(f, T[3] + 30, T[4] - 20)) : 48;
  const reveal = phase === 1 ? 0 : prog(f, T[4], T[4] + 120);
  const keys = phase === 1 ? ck([T[3], 1.15, 960, 760], [T[4], 1.08, 960, 700]) : ck([T[4], 1.08, 960, 700], [T[5], 1.0, 960, 560]);
  return (
    <Shot f={f} bg="#050505" keys={keys} drift={0.6} sombre={0.3}>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#050505" />
      <Memorial f={sf} reveal={reveal} candles={n} />
    </Shot>
  );
};

// ------------------------------------------------------------ S09-06 the Battle of Berlin
const Berlin45: React.FC<{f: number}> = ({f}) => {
  const t = f - T[5];
  return (
    <Shot f={f} bg="#6F6A64" keys={ck([T[5], 1.0, 860, 560], [T[6], 1.05, 1080, 560])}>
      <BerlinRuins f={f} />
      {[0, 1].map((i) => {
        const x = -200 - i * 450 + t * 4;
        return <Tank key={i} x={x} y={860 + i * 50} dist={x} s={0.8} f={f} variant="t34" />;
      })}
      {[0, 1, 2, 3].map((i) => (
        <Fig key={i} k="sovietSoldier" x={-100 + i * 140 + t * 3.5} y={960} f={f} pose={walk(t / 14 + i)} expr="determined" />
      ))}
    </Shot>
  );
};

// ------------------------------------------------------------ S09-07 the bunker (no figure shown)
const BunkerShot: React.FC<{f: number}> = ({f}) => {
  const t = f - T[6];
  const inside = t > 60;
  const door = prog(t, 90, 150);
  const fade = prog(t, 140, 175);
  return (
    <Shot f={f} bg="#000" keys={inside ? ck([T[6] + 60, 1.0, 960, 540], [T[7], 1.15, 960, 520]) : ck([T[6], 1.0, 960, 540], [T[6] + 60, 1.1, 1000, 560])}>
      {inside ? <Bunker f={f} view="interior" door={door} /> : <Bunker f={f} view="exterior" />}
      {inside && (
        <g transform={`translate(960,60) rotate(${Math.sin(t / 14) * 10})`}>
          <line x1={0} y1={0} x2={0} y2={170} stroke={C.ink} strokeWidth={4} />
          <circle cx={0} cy={186} r={18} fill="#FFE8A0" stroke={C.ink} strokeWidth={3} />
          <circle cx={0} cy={186} r={70} fill="#FFE8A0" opacity={0.15} />
        </g>
      )}
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#000" opacity={fade * 0.8} />
    </Shot>
  );
};

// ------------------------------------------------------------ S09-08 unconditional surrender
const SurrenderRoom: React.FC<{f: number}> = ({f}) => {
  const t = f - T[7];
  const sg = signDocument(t, {seated: true});
  return (
    <Shot f={f} bg="#9A9488" keys={ck([T[7], 1.0, 960, 560], [T[8], 1.15, 900, 640])}>
      <Interior wall="#A8A294" floor="#6A5E50" floorY={800} />
      <Table x={560} y={800} w={800} cloth="#5E6A5A" h={100} />
      <Fig k="germanOfficer" x={800} y={900} f={f} pose={sg.pose} expr="solemn" overlayFront={(sk) => <Pen x={sk.armR.hx} y={sk.armR.hy} />} />
      <Fig k="germanOfficer" x={640} y={900} f={f} pose={standStiff(f, 2)} expr="solemn" />
      <GroupTag x={720} y={560} text="GERMAN DELEGATION" />
      {[0, 1, 2].map((i) => (
        <Fig key={i} k={i === 1 ? 'britSoldier' : 'usSoldier'} x={1300 + i * 170} y={905} f={f} dir={-1} pose={standStiff(f, i)} expr="neutral" />
      ))}
      <g transform="translate(960,790) scale(0.55,0.32)">
        <Document x={-110} y={-140} title="UNCONDITIONAL SURRENDER" sign={prog(t, 10, 80)} />
      </g>
      <Stamp at={1500} until={T[8] + 2} text="UNCONDITIONAL SURRENDER" x={1000} y={420} rot={-8} size={52} />
    </Shot>
  );
};

// ------------------------------------------------------------ S09-09 / S09-10 VE Day → evening sea (continuous)
const VEDay: React.FC<{f: number}> = ({f}) => {
  const t = f - T[8];
  const up = prog(f, T[9] - 10, T[10] - 40);
  const pan = prog(f, T[9] + 40, T[10]);
  const lift = prog(t, 30, 50);
  const tomP = {...stand(f, 3), shR: 150 - lift * 20, elR: 40, shL: 150 - lift * 20, elL: 40};
  return (
    <Shot f={f} bg="#A9C4D0" keys={ck([T[8], 1.0, 960, 560], [T[9], 1.02, 960, 520], [T[10] - 60, 1.0, 960, -500], [T[10], 1.0, 1400, -560])}>
      <rect x={-200} y={-1400} width={3200} height={1500} fill={`rgb(${lerp(160, 200, up)},${lerp(196, 140, up)},${lerp(208, 120, up)})`} />
      <Sky top="#A9C4D0" bottom="#EDE4CC" />
      <Clouds f={f} n={5} seed={51} speed={0.5} yMin={-1100} yMax={150} color={up > 0.5 ? '#F2C8A8' : '#FBFBF7'} />
      <Sun x={2100} y={-470} r={90} f={f} color="#F6B070" />
      <g opacity={pan}>
        <Sea y={-430} f={f} colors={['#7A6A7A', '#5A5068', '#4A4058']} amp={4} layers={2} />
        {[1500, 1850, 2200].map((x, i) => (
          <Ship key={i} x={x} y={-430} f={f} s={0.18} kind="warship" color="#3A3440" seed={i} smoke={false} />
        ))}
      </g>
      <Street base={780} seed={41} f={f} />
      <Bunting x0={-100} x1={900} y={380} f={f} seed={1} />
      <Bunting x0={900} x1={2000} y={400} f={f} seed={2} />
      <Flag x={200} y={760} f={f} kind="uk" pole={300} seed={5} />
      <Flag x={1700} y={760} f={f} kind="us" pole={300} seed={6} />
      <Flag x={1100} y={760} f={f} kind="su" pole={280} seed={7} w={120} h={76} />
      <Flag x={600} y={760} f={f} kind="fr" pole={280} seed={8} w={120} h={76} />
      <Ground y={780} color="#B2ACA0" />
      <Crowd f={f} count={45} x0={-100} x1={1100} yBack={850} yFront={1040} scaleBack={0.6} scaleFront={0.9} pool="london1945" mix={{cheer: 3, wave: 2}} excitement={1} seed={21} />
      <Hug f={f} x={1420} y={960} kind="comfort" adult={{...castProps('anna'), head: {...castProps('anna').head, expression: 'joy'}}} other={{...castProps('leo'), head: {...castProps('leo').head, expression: 'joy'}}} />
      {t > 25 && <Fig k="tom" x={1640} y={965} f={f} dir={-1} pose={tomP} expr="joy" />}
      {t > 25 && <Fig k="leo" x={1580} y={965 - lift * 150} f={f} pose={cheerV(f, 1)} expr="joy" />}
      <Particles f={f} kind="confetti" n={50} seed={13} opacity={1 - up} />
    </Shot>
  );
};

export const S09Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: T[0], to: T[1], el: <Converge f={f} />},
      {from: T[1], to: T[2], el: <Road f={f} />},
      {from: T[2], to: T[3], el: <Barracks f={f} />},
      {from: T[3], to: T[4], el: <Candles f={f} phase={1} />, trans: 'dip'},
      {from: T[4], to: T[5], el: <Candles f={f} phase={2} />},
      {from: T[5], to: T[6], el: <Berlin45 f={f} />, trans: 'cut'},
      {from: T[6], to: T[7], el: <BunkerShot f={f} />},
      {from: T[7], to: T[8], el: <SurrenderRoom f={f} />, trans: 'cut'},
      {from: T[8], to: T[10], el: <VEDay f={f} />},
    ]}
  />
);

export const S09Overlay: React.FC = () => (
  <g>
    <ListPill at={T[2] + 12} until={T[3] - 4} heading="CAMP LIBERATIONS" lines={['MAJDANEK · JULY 1944', 'AUSCHWITZ · JANUARY 1945', 'BUCHENWALD, BERGEN-BELSEN, DACHAU · APRIL 1945']} x={1880} y={120} size={34} />
    <MemorialCard at={T[3] + 20} until={T[4] - 6} heading="THE HOLOCAUST" lines={[{text: 'APPROXIMATELY SIX MILLION JEWS MURDERED', at: T[3] + 60}]} y={200} />
    <MemorialCard
      at={T[4] + 15}
      until={T[5] - 25}
      heading="MILLIONS OF OTHERS PERSECUTED AND KILLED"
      lines={[{text: 'ROMA', at: 950}, {text: 'DISABLED PEOPLE', at: 985}, {text: 'POLISH CIVILIANS', at: 1025}, {text: 'SOVIET PRISONERS OF WAR', at: 1060}]}
      y={150}
      headSize={46}
      size={42}
    />
    <FactPill at={T[5] + 6} until={T[6] - 4} text="APRIL 1945: BATTLE OF BERLIN" x={1880} y={300} anchor="end" />
    <DateCard at={T[6] + 8} until={T[7] - 4} date="30 APRIL 1945" title="HITLER DIES" sub="In his Berlin bunker" />
    <FactPill at={T[7] + 8} until={T[8] - 4} text="7–8 MAY 1945" x={1880} y={300} anchor="end" />
    <DateCard at={T[8] + 2} until={T[9] - 2} date="8 MAY 1945" title="VICTORY IN EUROPE" />
  </g>
);
