// s02 — Chapter 1: Europe Before 1914 (35–110 s; local frames 0–2249). Storyboard S02-01 … S02-07.
// Tail 100.4–110 s (no narration): dominoes topple (clacks from local 1964), chalk dominoes (2085–2175),
// Sarajevo glows (2190). The last push centres the Sarajevo dot so the s03 ink wipe opens on it.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {geoConicConformal} from 'd3-geo';
import {C, W, H} from '../styles/theme';
import {ShotTrack, SplitPanels, Camera} from '../components/Camera';
import {Street, StreetLamp, Tree, HistoryRoom, Chalk, Flag, Clouds, Sky} from '../components/Environment';
import {Newspaper} from '../components/Vehicles';
import {Factory} from '../components/env/Places';
import {DominoRow, ChalkDominoes} from '../components/env/Dominoes';
import {Globe} from '../maps/GeoMap';
import {MapEurope1914, CAM_1914} from '../maps/MapsWW1';
import {ShipIcon} from '../maps/IconsWW1';
import {paperWave, stand, point, march, mixPose, shrug, addPose, pose} from '../characters/poses';
import {FactPill, TermCard} from '../components/Text';
import {camLerp} from '../maps/GeoMap';
import {prog, easeIn, easeOut, easeInOut, clamp, kf} from '../animations/core';
import {sec, Fig, Walker, Shot, ck, Bunting} from './kit';
import {Desk} from './kit-ep02';

const {b, cut} = sec('s02');
const T1 = cut(2); // 394 S02-01 → 02
const T2 = cut(4); // 693 → 03 (cut, same map)
const T3 = cut(5); // 984 → 04 (wipe)
const T4 = cut(6); // 1170 → 05 (fade)
const T5 = cut(8); // 1477 → 06 (cut)
const T6 = cut(9); // 1754 → 07 (cut)
const END = 2250;
const FLY = b.at(1); // 176: the newspaper flies at camera (paper whoosh 40.5 s = local 165)
const CLACK = 1964; // first domino clack (100.45 s)
const CHALK0 = 2085; // first chalk-domino tick (104.5 s)
const GLOW = 2190; // Sarajevo glows (108.0 s)

// ---------------------------------------------------------------- S02-01 1914 promenade → newspaper → globe
const STROLL: [string, number, number, number][] = [
  ['man1', 100, 1.6, 900], ['woman1', 700, -1.4, 910], ['woman2', 1300, 1.3, 960], ['kid1', 1380, 1.3, 960], ['man3', 1900, -1.7, 930], ['man2', -300, 1.5, 990],
];
const Promenade: React.FC<{f: number}> = ({f}) => {
  const fly = prog(f, FLY - 14, FLY + 10, easeIn);
  const globeO = prog(f, FLY + 4, FLY + 20);
  const t = f - FLY;
  const lon = kf(f, [[FLY, -10], [T1, 22]]);
  // trade routes (dashed) and ships sliding along them
  const routes: [number, number][][] = [
    [[-1, 50], [-12, 46], [-25, 38], [-45, 30], [-70, 38]],
    [[-1, 50], [-10, 40], [-17, 15], [-5, 0], [10, -20]],
    [[5, 43], [20, 35], [32, 31], [43, 13], [60, 10], [73, 15]],
  ];
  return (
    <Shot
      f={f}
      bg="#AFCFD6"
      keys={ck([0, 1.02, 860, 560], [FLY - 10, 1.06, 1060, 560])}
      over={
        <g>
          {fly > 0 && fly < 1 && (
            <g transform={`translate(${1220 - 260 * fly},${560 - 40 * fly}) rotate(${(1 - fly) * 160}) scale(${0.9 + fly * 18})`}>
              <Newspaper w={80} h={100} headline="" masthead="THE DAILY NEWS" date="1914" />
            </g>
          )}
          {globeO > 0 && (
            <g opacity={globeO}>
              <rect width={W} height={H} fill="#1E2C40" />
              <g transform={`translate(${W / 2},${H / 2 + 20}) scale(${0.9 + 0.1 * prog(t, 0, 30, easeOut)}) translate(${-W / 2},${-H / 2 - 20})`}>
                <Globe f={f} lon={lon} lat={30} r={430} cx={W / 2} cy={H / 2 + 40}>
                  {({proj, path}) => (
                    <g>
                      {routes.map((r, i) => (
                        <path key={i} d={path({type: 'LineString', coordinates: r})} stroke="#7E2620" strokeWidth={5} strokeDasharray="14 10" fill="none" opacity={prog(t, 10 + i * 12, 30 + i * 12)} />
                      ))}
                      {routes.map((r, i) => {
                        const u = ((t * 0.006 + i * 0.33) % 1) * (r.length - 1);
                        const k = Math.floor(u);
                        const a = r[k], c = r[Math.min(k + 1, r.length - 1)];
                        const p = proj([a[0] + (c[0] - a[0]) * (u - k), a[1] + (c[1] - a[1]) * (u - k)]);
                        return p ? <ShipIcon key={i} x={p[0]} y={p[1]} s={1.1} dir={c[0] >= a[0] ? 1 : -1} f={f} seed={i} /> : null;
                      })}
                    </g>
                  )}
                </Globe>
              </g>
            </g>
          )}
        </g>
      }
    >
      <Sky top="#9FC6D3" bottom="#F1E6C8" />
      <Clouds f={f} n={5} seed={4} speed={0.5} yMin={60} yMax={240} />
      <Street base={760} seed={12} f={f} x0={-300} x1={2400} awnings />
      <Bunting x0={-100} x1={900} y={330} sag={50} f={f} />
      <Bunting x0={1000} x1={2200} y={300} sag={50} f={f} seed={2} />
      <rect x={-300} y={760} width={2700} height={500} fill="#CFC7B6" stroke={C.ink} strokeWidth={5} />
      <StreetLamp x={250} y={780} />
      <StreetLamp x={1650} y={780} />
      <Tree x={820} y={790} s={0.9} f={f} />
      {STROLL.map(([k, x0, sp, y], i) => {
        const span = 2900;
        const d = f * sp;
        const x = ((((x0 + d + 300) % span) + span) % span) - 300;
        return <Walker key={i} k={k} f={f} x0={x - d} speed={sp} y={y} expr="happy" seed={i * 11 + 2} />;
      })}
      {/* newspaper seller waving a paper */}
      <Fig k="worker" x={1200} y={900} f={f} pose={paperWave(f, 2)} dir={-1} expr="happy" talking={f < FLY - 14} holdR={f < FLY - 14 ? <g transform="rotate(-90)"><Newspaper w={60} h={78} headline="" masthead="DAILY NEWS" /></g> : undefined} />
    </Shot>
  );
};

// ---------------------------------------------------------------- S02-02/03 alliance maps
const EntenteMap: React.FC<{f: number}> = ({f}) => {
  const cam = camLerp({lon: 12, lat: 50, zoom: 1.0}, {lon: 18, lat: 51, zoom: 1.15}, prog(f, T1, b.at(3)));
  const cam2 = camLerp(cam, {lon: 9, lat: 53.5, zoom: 1.12}, prog(f, b.at(3) + 60, T2));
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapEurope1914
        f={f}
        idSuffix="-s0202"
        cam={cam2}
        powers={prog(f, b.at(2), b.at(2) + 40)}
        capitals={prog(f, b.at(2) + 10, b.at(2) + 40)}
        entente={prog(f, b.at(3), b.at(3) + 40)}
        britain={prog(f, b.at(3) + 70, b.at(3) + 110)}
        labels={prog(f, b.at(3), b.at(3) + 30)}
        labelSet={['FRA', 'RUS', 'GBR']}
      />
    </Shot>
  );
};
const AllianceMap: React.FC<{f: number}> = ({f}) => {
  const cam = camLerp({lon: 14, lat: 49.5, zoom: 1.15}, {lon: 15, lat: 46.5, zoom: 1.3}, prog(f, T2, T3));
  const NEUT = Math.round(64.0 * 30 - 35 * 30); // 870
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapEurope1914
        f={f}
        idSuffix="-s0203"
        cam={cam}
        base="alliances"
        central={prog(f, b.at(4), b.at(4) + 40)}
        italy={prog(f, b.at(4) + 60, b.at(4) + 100)}
        italyNeutral={prog(f, NEUT, NEUT + 40)}
        labels={prog(f, b.at(4), b.at(4) + 30)}
        labelSet={['GER', 'AH', 'ITA']}
      />
    </Shot>
  );
};

// ---------------------------------------------------------------- S02-04 naval arms race: two shipyards
const Yard: React.FC<{f: number; launch: number; mirror?: boolean; flag: 'uk' | 'de-imperial'}> = ({f, launch, mirror, flag}) => {
  const hammer = (k: number) => addPose(stand(f, k), {shR: 100 + Math.abs(Math.sin(f / 5 + k)) * 50, elR: 60, headTilt: 6});
  const done = launch > 0.95;
  const inner = (
    <g>
      <Factory f={f} kind="shipyard" launch={launch} />
      {[150, 330].map((x, i) => (
        <Fig key={i} k="worker" x={x} y={740 + i * 20} f={f} s={0.75} pose={done ? addPose(stand(f, i), {shR: 115, elR: 40 + Math.sin(f / 3 + i) * 25}) : hammer(i)} expr={done ? 'happy' : 'determined'} seed={i + (mirror ? 9 : 1)} />
      ))}
    </g>
  );
  return (
    <g>
      {mirror ? <g transform={`translate(${W},0) scale(-1,1)`}>{inner}</g> : inner}
      <Flag x={mirror ? 1640 : 600} y={560} f={f} kind={flag} w={150} h={95} pole={300} seed={mirror ? 3 : 1} />
    </g>
  );
};
const ArmsRace: React.FC<{f: number}> = ({f}) => {
  const lL = prog(f, 1040, 1098, easeIn); // left hull hits the water with the splash SFX (71.6 s)
  const lR = prog(f, 1075, 1140, easeIn);
  const marchers = ['germanSoldier1914', 'frenchSoldier1914', 'russianSoldier', 'britSoldier1914'];
  return (
    <Shot f={f} bg="#9AA8AE" keys={ck([T3, 1.0, W / 2, H / 2], [T4, 1.04, W / 2, H / 2 + 10])}>
      <SplitPanels
        id="s0204"
        reveal={prog(f, T3, T3 + 20)}
        panels={[
          {x0: 0, x1: W / 2, node: <Yard f={f} launch={lL} flag="uk" />},
          {x0: W / 2, x1: W, node: <Yard f={f} launch={lR} flag="de-imperial" mirror />},
        ]}
      />
      {/* strip of marching ranks crossing the frame */}
      <rect x={-100} y={850} width={W + 200} height={260} fill="#7C7262" stroke={C.ink} strokeWidth={5} />
      {Array.from({length: 12}).map((_, i) => {
        const x = ((i * 190 + (f - T3) * 2.6) % 2280) - 180;
        return <Fig key={i} k={marchers[Math.floor(i / 3) % 4]} x={x} y={1000} f={f} s={0.48} pose={march((f - T3) / 14 + i * 0.1)} expr="determined" lod="low" seed={i} />;
      })}
    </Shot>
  );
};

// ---------------------------------------------------------------- S02-05 Balkans
const BalkansMap: React.FC<{f: number}> = ({f}) => {
  const z1 = camLerp({lon: 17, lat: 47, zoom: 1.3}, CAM_1914.balkans, prog(f, T4, b.at(7)));
  const cam = camLerp(z1, CAM_1914.austria, prog(f, b.at(7), b.at(7) + 70));
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapEurope1914
        f={f}
        idSuffix="-s0205"
        cam={cam}
        base="alliances"
        balkans={{
          serbiaPulse: prog(f, b.at(6), b.at(6) + 30),
          labels: prog(f, b.at(6), b.at(6) + 30),
          peoples: prog(f, b.at(7), b.at(7) + 60),
          ahBorder: prog(f, b.at(7) + 50, b.at(7) + 90),
          tension: prog(f, b.at(7) + 80, b.at(7) + 140),
        }}
      />
    </Shot>
  );
};

// ---------------------------------------------------------------- S02-06 war plan
const WarPlanMap: React.FC<{f: number}> = ({f}) => {
  const EAST = Math.round(89.3 * 30 - 35 * 30); // 1629
  const c1 = camLerp({lon: 12, lat: 50, zoom: 1.4}, {lon: 6, lat: 50, zoom: 1.6}, prog(f, T5, EAST));
  const cam = camLerp(c1, {lon: 17, lat: 51, zoom: 1.35}, prog(f, EAST, T6));
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapEurope1914
        f={f}
        idSuffix="-s0206"
        cam={cam}
        base="alliances"
        warPlan={{west: prog(f, b.at(8) + 20, b.at(8) + 110), east: prog(f, EAST, EAST + 70), trains: prog(f, EAST + 40, T6) , stopwatch: prog(f, b.at(8), b.at(8) + 20)}}
        labels={prog(f, b.at(8) + 20, b.at(8) + 50)}
        labelSet={['BEL']}
        capitals={prog(f, b.at(8) + 60, b.at(8) + 90)}
        capitalSet={['Paris']}
      />
    </Shot>
  );
};

// ---------------------------------------------------------------- S02-07 dominoes → chalk map → Sarajevo
const BOARD_MAP = {x: 640, y: 250, w: 1000, h: 430};
const SJ = (() => {
  const {x, y, w, h} = BOARD_MAP;
  const p = geoConicConformal().parallels([40, 62]).rotate([-14, 0]).center([0, 49]).scale(w * 1.05).translate([x + w / 2, y + h / 2]);
  return p([18.41, 43.86]) as [number, number];
})();
const DOMINOES = ['ALLIANCES', 'ARMS RACE', 'NATIONALISM', 'EMPIRES', 'WAR PLANS'];
const DominoShot: React.FC<{f: number}> = ({f}) => {
  const b9 = b.at(9), b10 = b.at(10);
  const back = prog(f, b10 + 10, b10 + 50);
  const nudge = prog(f, CLACK - 30, CLACK);
  const topple = prog(f, CLACK - 4, CLACK + 112, (t) => t);
  const shake = f >= b9 && f < b9 + 40 ? Math.sin((f - b9) / 3) * 10 : 0;
  let ps = f < b9 ? point(f, 70) : f < b9 + 40 ? stand(f, 2) : f < b10 ? point(f, 112) : mixPose(stand(f, 3), {...shrug(f), shL: 20, elL: 40}, back);
  ps = {...ps, headTilt: ps.headTilt + shake};
  if (f >= CLACK - 30) ps = pose({...ps, lean: -8, shL: 60, elL: 90});
  return (
    <Shot
      f={f}
      bg={C.wallYellow}
      keys={ck(
        [T6, 1.05, 860, 600],
        [1900, 1.1, 760, 610],
        [CLACK + 100, 1.1, 1000, 580],
        [CHALK0 + 20, 1.35, 1140, 460],
        [GLOW, 1.5, SJ[0] - 60, SJ[1] - 20],
        [END, 3.2, SJ[0], SJ[1]],
      )}
    >
      <HistoryRoom
        f={f}
        board={
          <g>
            <Chalk x={1140} y={215} text="PRESSURES, NOT INEVITABILITY" size={54} reveal={prog(f, b9 + 30, b9 + 70)} />
            <ChalkDominoes f={f} {...BOARD_MAP} draw={prog(f, CLACK, CHALK0)} topple={prog(f, CHALK0, GLOW - 10, (t) => t)} glow={prog(f, GLOW, GLOW + 40)} label={prog(f, GLOW - 20, GLOW)} />
          </g>
        }
      />
      <Desk x0={470} y={840} x1={1420} />
      <g transform="translate(560,840) scale(0.74) translate(-560,-840)">
        <DominoRow x={560} y={840} labels={DOMINOES} topple={topple} nudge={nudge} gap={150} f={f} />
      </g>
      <Fig k="guide" x={380 - 40 * back} y={940} f={f} s={1.45} pose={ps} expr={f < b10 ? 'neutral' : 'worried'} talking={(f >= b9 && f < b.endOf(9)) || (f >= b10 && f < b.endOf(10))} turn={0.3} dir={1} />
    </Shot>
  );
};

export const S02Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: 0, to: T1, el: <Promenade f={f} />},
      {from: T1, to: T2, el: <EntenteMap f={f} />, trans: 'fade'},
      {from: T2, to: T3, el: <AllianceMap f={f} />, trans: 'cut'},
      {from: T3, to: T4, el: <ArmsRace f={f} />, trans: 'wipe'},
      {from: T4, to: T5, el: <BalkansMap f={f} />, trans: 'fade'},
      {from: T5, to: T6, el: <WarPlanMap f={f} />, trans: 'cut'},
      {from: T6, to: END, el: <DominoShot f={f} />, trans: 'cut'},
    ]}
  />
);

const sx = (t: number) => Math.round((t - 35) * 30);
export const S02Overlay: React.FC = () => {
  useCurrentFrame();
  return (
    <g>
      <FactPill at={sx(42.5)} until={T1 - 2} text="GREAT POWERS · RIVAL EMPIRES" x={W / 2} y={300} anchor="middle" size={44} />
      <TermCard at={sx(53.2)} until={T2} term="TRIPLE ENTENTE" meaning="France and Russia, with Britain more loosely tied" />
      <TermCard at={sx(59.0)} until={sx(63.9)} term="TRIPLE ALLIANCE" meaning="Germany, Austria-Hungary, Italy" />
      <FactPill at={sx(68.6)} until={T4} text="ARMS RACE" sub="NAVAL RACE: BRITAIN v GERMANY" x={W / 2} y={300} anchor="middle" size={46} />
      <FactPill at={sx(78.6)} until={T5 - 4} text="AN EMPIRE OF MANY PEOPLES" x={1860} y={600} anchor="end" size={40} />
      <FactPill at={sx(85.3)} until={T6 - 2} text="GERMANY'S WAR PLAN: FRANCE FIRST, THROUGH BELGIUM — THEN RUSSIA" x={W / 2 - 120} y={330} anchor="middle" size={40} maxW={1100} />
    </g>
  );
};

void clamp;
void easeInOut;
void Camera;
