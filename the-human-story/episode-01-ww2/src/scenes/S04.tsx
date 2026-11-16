// s04 — Chapter 3: World War II Begins (150-210 s). Storyboard S04-01 … S04-09.
import React from 'react';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack, SplitPanels, Camera} from '../components/Camera';
import {Sky, Ground, Hills, Interior, Table, Radio, Document, Building, Tree, Flag, Clouds} from '../components/Environment';
import {Smoke, Explosion, Particles} from '../components/Effects';
import {Tank, Plane, Train} from '../components/Vehicles';
import {KremlinOffice, BorderCrossing} from '../components/env/Places';
import {MapSpheres1939, MapEastAsia, MAPC} from '../maps/EpisodeMaps';
import {GeoMap, MapArrow, MapLabel, CityMarker, camLerp, growArrow, Globe} from '../maps/GeoMap';
import {GERMANY_1937, EAST_PRUSSIA, POLAND_1939, POLAND_GERMAN_ZONE, POLAND_SOVIET_ZONE, CITY} from '../maps/geo';
import {walk, stand, standStiff, seated, signDocument, kneelAim, takeCover, holdFront, wave, waveSide, mixPose, march} from '../characters/poses';
import {Handshake, Hug} from '../characters/interactions';
import {castProps} from '../characters/cast';
import {Pen, RifleAim} from '../characters/props';
import {DateCard, Stamp} from '../components/Text';
import {prog, clamp, lerp} from '../animations/core';
import {sec, Fig, Walker, Shot, ck, SimpleFlag} from './kit';

const {b, cut} = sec('s04');
const T = [0, cut(1), cut(2), cut(3), cut(4), cut(5), cut(6), cut(7), cut(9), 1800];

const reich = [
  {feature: GERMANY_1937, fill: MAPC.germany, opacity: 0.85},
  {feature: EAST_PRUSSIA, fill: MAPC.germany, opacity: 0.85},
  {name: 'Austria', fill: MAPC.germany, opacity: 0.85},
  {name: 'Czechia', fill: MAPC.germany, opacity: 0.85},
];

// ------------------------------------------------------------ S04-01 Poland next
const PolandMap: React.FC<{f: number}> = ({f}) => {
  const cam = camLerp({lon: 16, lat: 51, zoom: 1.0}, {lon: 19.5, lat: 52, zoom: 1.6}, prog(f, 0, T[1]));
  return (
    <Shot f={f} bg="#9DBCC4">
      <GeoMap kind="europe" cam={cam} f={f} highlights={[...reich, {feature: POLAND_1939, fill: MAPC.poland, opacity: 1, pulse: 1, stroke: C.red}]}>
        {({toScreen}) => (
          <g>
            <MapLabel at={toScreen([19.6, 52.2])} text="POLAND" size={36} opacity={prog(f, 20, 40)} />
            <MapLabel at={toScreen([10.8, 51.2])} text="GERMANY" size={32} />
            <CityMarker at={toScreen(CITY.Danzig)} name="Danzig" f={f} size={24} />
          </g>
        )}
      </GeoMap>
    </Shot>
  );
};

// ------------------------------------------------------------ S04-02 the Kremlin: the pact
const Pact: React.FC<{f: number}> = ({f}) => {
  const t = f - T[1];
  const molo = signDocument(t, {seated: true});
  const ribb = signDocument(t - 70, {seated: false});
  const shake = t > 150;
  return (
    <Shot f={f} bg="#6E4A34" keys={ck([T[1], 1.0, 1100, 560], [T[2], 1.08, 1160, 580])}>
      <KremlinOffice f={f} />
      <Fig k="stalin" x={1560} y={880} f={f} s={1.05} pose={stand(f, 3)} expr="smug" tag look={[-0.6, 0.3]} />
      <Table x={900} y={830} w={420} cloth="#5A2A22" h={80} />
      {!shake && (
        <g>
          <Fig k="molotov" x={980} y={905} f={f} pose={t < 75 ? molo.pose : seated(f, 1)} expr="neutral" overlayFront={t < 75 ? (sk) => <Pen x={sk.armR.hx} y={sk.armR.hy} /> : undefined} tag />
          <Fig k="ribbentrop" x={1290} y={905} f={f} dir={-1} pose={t >= 70 ? ribb.pose : standStiff(f, 2)} expr="neutral" overlayFront={t >= 70 ? (sk) => <Pen x={sk.armR.hx} y={sk.armR.hy} /> : undefined} tag />
        </g>
      )}
      {shake && <Handshake f={t} x={1130} y={905} start={152} a={{...castProps('molotov'), head: {...castProps('molotov').head, expression: 'smug'}}} b={{...castProps('ribbentrop'), head: {...castProps('ribbentrop').head, expression: 'smug'}}} />}
      <g transform="translate(1110,820) scale(0.5,0.3)">
        <Document x={-110} y={-140} title="NON-AGGRESSION PACT" sign={prog(t, 20, 140)} />
      </g>
    </Shot>
  );
};

// ------------------------------------------------------------ S04-03 secret protocol → spheres map (match)
const Protocol: React.FC<{f: number}> = ({f}) => {
  const t = f - T[2];
  const flip = prog(t, 10, 26);
  const toMap = prog(t, 70, 95);
  return (
    <Shot f={f} bg="#3A2A20">
      <g opacity={toMap}>
        <MapSpheres1939 f={t - 70} line="aug" cues={{spheres: 15, line: b.at(2) + 100 - T[2] - 70, labels: 507 - T[2] - 70 + 10}} />
      </g>
      <g opacity={1 - toMap} transform={`translate(${W / 2},${H / 2}) scale(${1.6 + t * 0.01 + toMap * 2})`}>
        <rect x={-500} y={-330} width={1000} height={660} fill="#5A3E2A" />
        <g transform={`scale(${1 - 2 * Math.min(flip, 0.5)},1)`}>
          {flip < 0.5 ? <Document x={-150} y={-200} w={300} h={400} title="NON-AGGRESSION PACT" sign={1} /> : null}
        </g>
        {flip >= 0.5 && (
          <g transform={`scale(${2 * flip - 1},1)`}>
            <Document x={-150} y={-200} w={300} h={400} title="SECRET PROTOCOL" lines={9} />
          </g>
        )}
      </g>
      {flip >= 0.6 && toMap < 1 && (
        <g opacity={1 - toMap}>
          <Stamp at={T[2] + 30} until={T[2] + 95} text="SECRET" x={W / 2 + 40} y={H / 2 - 40} size={80} />
        </g>
      )}
    </Shot>
  );
};

// ------------------------------------------------------------ S04-04 the border, 1 September
const Border: React.FC<{f: number}> = ({f}) => {
  const t = f - T[3];
  const snap = t > 30;
  return (
    <Shot f={f} bg="#9FB6C8" keys={ck([T[3], 1.0, 1000, 560], [T[4], 1.06, 760, 580])}>
      <BorderCrossing f={f} barrier={prog(t, 10, 28)} snap={snap} dawn={0.4 + prog(t, 0, 170) * 0.3} />
      {[0, 1, 2].map((i) => {
        const x = 2300 + i * 520 - Math.max(0, t - 20) * 7;
        return <Tank key={i} x={x} y={820 + (i % 2) * 30} dist={-x} s={0.9} dir={-1} f={f} />;
      })}
      <Walker k="germanSoldier" f={f} x0={1500} speed={-2.2} y={900} expr="determined" />
      <Walker k="germanSoldier" f={f} x0={1650} speed={-2.2} y={920} expr="determined" />
      <Fig k="germanSoldier" x={1180} y={890} f={f} pose={t < 30 ? {...holdFront(f, 1), shR: 120, shL: 110} : stand(f, 3)} expr="determined" />
    </Shot>
  );
};

// ------------------------------------------------------------ S04-05 the Polish army fights back
const PolishFront: React.FC<{f: number}> = ({f}) => {
  const t = f - T[4];
  const dive = prog(t, 20, 70);
  const cutIn = t > 92;
  return (
    <Shot
      f={f}
      bg="#C9D2C8"
      shake={2 * Math.max(0, Math.sin(Math.PI * clamp((t - 30) / 50)))}
      keys={cutIn ? ck([T[4] + 92, 1.7, 700, 720], [T[5], 1.8, 720, 720]) : ck([T[4], 1.0, 960, 540], [T[4] + 90, 1.05, 960, 560])}
    >
      <Sky top="#B8C4C8" bottom="#E8DDC0" />
      <Hills y={640} color="#A5B07A" seed={8} />
      {[1300, 1450, 1560].map((x, i) => (
        <Building key={i} x={x} base={650} w={110} h={90} color="#C9BFA8" seed={i + 30} />
      ))}
      <Smoke x={1450} y={600} f={f} n={8} size={50} rise={240} drift={60} color="#5A5A5A" opacity={0.5} seed={2} />
      <Ground y={700} color="#A9A36A" />
      <Explosion x={1250} y={700} f={t} at={45} s={0.6} seed={3} />
      <Explosion x={1600} y={690} f={t} at={95} s={0.5} seed={5} />
      {[0, 1, 2].map((i) => (
        <Plane key={i} x={lerp(1900 + i * 160, 900 + i * 260, dive)} y={lerp(90 + i * 60, 420 + i * 50, dive * dive) - Math.max(0, t - 70) * 3} f={f} kind="stuka" s={0.55} dir={-1} bank={-25 * dive + 10} />
      ))}
      <path d="M-200,860 Q400,820 960,850 T2200,840 L2200,1300 L-200,1300 Z" fill="#7A6248" stroke={C.ink} strokeWidth={5} />
      <SimpleFlag x={250} y={830} f={f} colors={['#FFFFFF', '#DC143C']} pole={220} w={130} h={80} seed={11} />
      {[0, 1, 2, 3].map((i) => (
        <Fig key={i} k="polishSoldier" x={520 + i * 230} y={890} f={f + i * 7} pose={i % 2 ? kneelAim(f, i) : takeCover(f, i)} expr="determined" overlay={i % 2 ? (sk) => <RifleAim stock={{x: sk.armL.hx - 10, y: sk.armL.hy}} grip={{x: sk.armR.hx, y: sk.armR.hy}} /> : undefined} />
      ))}
    </Shot>
  );
};

// ------------------------------------------------------------ S04-06 split: London / Paris radios
const Radios: React.FC<{f: number}> = ({f}) => {
  const t = f - T[5];
  const left = (
    <Camera f={f} keys={ck([T[5], 1.0, 960, 540], [T[6], 1.05, 960, 560])}>
      <Interior wall="#B9A88A" floor="#7A5A3A" floorY={820} />
      <rect x={120} y={260} width={240} height={180} fill="#9FC0CC" stroke={C.ink} strokeWidth={5} />
      <Flag x={600} y={480} f={f} kind="uk" w={110} h={70} pole={180} seed={2} />
      <Table x={330} y={760} w={220} />
      <Radio x={440} y={740} f={f} s={1.2} />
      <Fig k="anna" x={240} y={910} f={f} pose={mixPose(stand(f, 2), {...stand(f, 2), shR: 150, elR: 120}, prog(t, 40, 55))} expr={t > 40 ? 'worried' : 'neutral'} nearArmFront={t > 45} />
      <Fig k="leo" x={140} y={915} f={f} pose={stand(f, 3)} expr="worried" look={[0.6, -0.4]} />
    </Camera>
  );
  const right = (
    <Camera f={f} keys={ck([T[5], 1.0, 960, 540], [T[6], 1.05, 960, 560])}>
      <rect x={760} y={-200} width={1400} height={1500} fill="#C9B48A" />
      <rect x={760} y={820} width={1400} height={400} fill="#8A6A4A" />
      <line x1={760} y1={820} x2={2160} y2={820} stroke={C.ink} strokeWidth={5} />
      <rect x={1100} y={240} width={600} height={260} fill="#9FC0CC" stroke={C.ink} strokeWidth={5} />
      <text x={1400} y={300} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={42} fill="#7A2A22">CAFÉ</text>
      <Flag x={1780} y={500} f={f} kind="fr" w={110} h={70} pole={180} seed={3} />
      <Table x={1290} y={760} w={220} />
      <Radio x={1400} y={740} f={f} s={1.2} />
      <Fig k="man2" x={1200} y={910} f={f} pose={holdFront(f, 1)} expr="worried" />
      <Fig k="woman1" x={1600} y={912} f={f} dir={-1} pose={stand(f, 4)} expr="worried" />
    </Camera>
  );
  return (
    <Shot f={f} bg="#222" drift={0.5}>
      <SplitPanels id="s0406" panels={[{x0: -10, x1: 960, node: left}, {x0: 960, x1: 1930, node: right}]} />
    </Shot>
  );
};

// ------------------------------------------------------------ S04-07 the station: Tom leaves
const Station: React.FC<{f: number}> = ({f}) => {
  const t = f - T[6];
  const go = Math.max(0, t - 48);
  const trainX = 1250 - go * go * 0.12;
  return (
    <Shot f={f} bg="#8A8E8C" keys={ck([T[6], 1.05, 900, 560], [T[7], 1.08, 760, 560])}>
      <rect x={-200} y={-200} width={2400} height={1500} fill="#9A9C98" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect x={-100 + i * 380} y={60} width={20} height={600} fill="#4A4A48" stroke={C.ink} strokeWidth={3} />
          <path d={`M${-100 + i * 380},80 L${180 + i * 380},40`} stroke={C.ink} strokeWidth={8} />
        </g>
      ))}
      <rect x={-200} y={0} width={2400} height={60} fill="#5A5A58" stroke={C.ink} strokeWidth={4} />
      <rect x={-200} y={720} width={2400} height={30} fill="#6A6460" />
      <Train x={trainX} y={760} dist={-trainX} f={f} cars={3} s={1.1} dir={-1} color="#3A4A3A" />
      <Smoke x={trainX - 80} y={560} f={f} n={10} size={70} rise={200} drift={120} color="#E8E8E4" opacity={0.6} outline={false} seed={4} />
      <rect x={-200} y={800} width={2400} height={400} fill="#B4ACA0" stroke={C.ink} strokeWidth={5} />
      {t < 40 ? (
        <Hug f={f} x={900} y={930} kind="embrace" adult={castProps('tom')} other={castProps('anna')} />
      ) : (
        <g>
          <Fig k="anna" x={860} y={930} f={f} pose={waveSide(f, 1)} expr="sad" />
          <Fig k="tom" x={trainX + 300} y={720} f={f} pose={waveSide(f, 2)} expr="sad" cutBelow={640} s={0.9} />
        </g>
      )}
      <Fig k="leo" x={1000} y={935} f={f} pose={t > 25 && t < 45 ? {...stand(f, 3), headTilt: 8} : t >= 45 ? waveSide(f, 3) : stand(f, 3)} expr="sad" />
    </Shot>
  );
};

// ------------------------------------------------------------ S04-08 Poland carved up
const Partition: React.FC<{f: number}> = ({f}) => {
  const t = f - T[7];
  const b8 = b.at(8) - T[7];
  const split = prog(t, b8, b8 + 40);
  const cam = camLerp({lon: 22, lat: 52, zoom: 2.0}, {lon: 22, lat: 52, zoom: 1.5}, prog(t, b8, T[8] - T[7]));
  const sov: [number, number][][] = [
    [[30, 55], [27.5, 54], [25.3, 53.6]],
    [[30, 52], [27.5, 51.6], [25, 51.5]],
    [[29.5, 49.5], [27, 49.8], [24.5, 50.0]],
  ];
  return (
    <Shot f={f} bg="#9DBCC4">
      <GeoMap
        kind="europe"
        cam={cam}
        f={f}
        highlights={[
          ...reich,
          {name: 'Russia', fill: MAPC.ussr, opacity: 0.8},
          {name: 'Belarus', fill: MAPC.ussr, opacity: 0.8},
          {name: 'Ukraine', fill: MAPC.ussr, opacity: 0.8},
          {feature: POLAND_1939, fill: MAPC.poland, opacity: 1 - split},
          {feature: POLAND_GERMAN_ZONE, fill: MAPC.germany, opacity: split * 0.9},
          {feature: POLAND_SOVIET_ZONE, fill: MAPC.ussr, opacity: split * 0.9},
        ]}
      >
        {({toScreen}) => (
          <g>
            {sov.map((p, i) => (
              <MapArrow key={i} pts={p.map(toScreen)} progress={growArrow(t, 15 + i * 10, 70 + i * 10)} color={C.soviet} width={24} />
            ))}
            <MapLabel at={toScreen([20.3, 52.4])} text="POLAND" size={34} opacity={1 - split} />
            <Smoke x={toScreen(CITY.Warsaw)[0]} y={toScreen(CITY.Warsaw)[1]} f={f} n={6} size={22} rise={90} drift={30} color="#5A5A5A" opacity={0.6} outline={false} seed={3} />
            <CityMarker at={toScreen(CITY.Warsaw)} name="Warsaw" f={f} size={24} pulse={false} />
          </g>
        )}
      </GeoMap>
    </Shot>
  );
};

// ------------------------------------------------------------ S04-09 globe → East Asia
const Asia: React.FC<{f: number}> = ({f}) => {
  const t = f - T[8];
  const toMap = prog(t, 55, 80);
  const man = 1560 - T[8];
  const china = 1660 - T[8];
  const cam = camLerp({lon: 124, lat: 42, zoom: 1.3}, {lon: 118, lat: 36, zoom: 1.15}, prog(t, china - 20, china + 40));
  const inset = prog(t, china + 30, china + 50) * (1 - prog(t, 350, 365));
  return (
    <Shot f={f} bg={C.deepNavy}>
      <g opacity={1 - toMap}>
        <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={C.deepNavy} />
        <Globe f={f} lon={lerp(15, 120, prog(t, 0, 70))} lat={lerp(48, 38, prog(t, 0, 70))} r={460} />
      </g>
      <g opacity={toMap}>
        <MapEastAsia f={t} cam={cam} cues={{manchuria: man, china}} />
      </g>
      {inset > 0 && (
        <g opacity={inset} transform="translate(1280,330)">
          <rect x={-8} y={-8} width={556} height={356} rx={12} fill={C.ink} />
          <svg x={0} y={0} width={540} height={340} viewBox="0 0 540 340">
            <rect width={540} height={340} fill="#9AA0A4" />
            <rect y={210} width={540} height={130} fill="#8A8270" />
            <rect y={170} width={540} height={60} fill="#7A766E" stroke={C.ink} strokeWidth={4} />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={i * 80} y={150} width={50} height={24} fill="#7A766E" stroke={C.ink} strokeWidth={3} />)}
            <SimpleFlag x={430} y={170} f={f} roc pole={130} w={90} h={60} seed={21} />
            {[0, 1, 2].map((i) => (
              <Fig key={i} k={i === 1 ? 'chineseSoldierKhaki' : 'chineseSoldier'} x={90 + i * 120} y={300} f={f + i * 9} s={0.6} pose={kneelAim(f, i)} expr="determined" />
            ))}
          </svg>
        </g>
      )}
    </Shot>
  );
};

export const S04Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: T[0], to: T[1], el: <PolandMap f={f} />},
      {from: T[1], to: T[2], el: <Pact f={f} />, trans: 'cut'},
      {from: T[2], to: T[3], el: <Protocol f={f} />, trans: 'cut'},
      {from: T[3], to: T[4], el: <Border f={f} />, trans: 'cut'},
      {from: T[4], to: T[5], el: <PolishFront f={f} />, trans: 'cut'},
      {from: T[5], to: T[6], el: <Radios f={f} />},
      {from: T[6], to: T[7], el: <Station f={f} />, trans: 'cut'},
      {from: T[7], to: T[8], el: <Partition f={f} />},
      {from: T[8], to: T[9], el: <Asia f={f} />, trans: 'wipe'},
    ]}
  />
);

export const S04Overlay: React.FC = () => (
  <g>
    <DateCard at={T[1] + 12} until={T[2] - 4} date="AUGUST 1939" title="NAZI–SOVIET PACT" sub="A non-aggression pact" />
    <DateCard at={T[3] + 10} until={T[4] - 4} date="1 SEPTEMBER 1939" title="GERMANY INVADES POLAND" />
    <DateCard at={T[5] + 8} until={T[6] - 2} date="3 SEPTEMBER 1939" title="BRITAIN AND FRANCE DECLARE WAR" />
    <DateCard at={T[7] + 10} until={b.endOf(7) + 10} date="17 SEPTEMBER 1939" title="SOVIET UNION INVADES EASTERN POLAND" />
    <DateCard at={1560} until={1670} date="1931" title="JAPAN INVADES MANCHURIA" />
    <DateCard at={1680} until={1792} date="1937" title="FULL-SCALE WAR AGAINST CHINA" />
  </g>
);
