// s07 — Chapter 6: 1916: Verdun and the Somme (390–450 s, 1,800 frames). Storyboard S07-01 … S07-07 (ep02, editor B).
// Verdun (M-02) · the road to Verdun in rain · the Somme map → the week of shelling (trench at night) ·
// 1 July (whistles at 418.6; men walk into smoke, seen from behind; nobody falls) · Pals street · Somme creep · the debate.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, W, H} from '../styles/theme';
import {ShotTrack} from '../components/Camera';
import {Sky, Ground, Hills, Tree, Rubble, HistoryRoom} from '../components/Environment';
import {Particles, Smoke} from '../components/Effects';
import {DistantFigures} from '../components/env/Places';
import {Truck} from '../components/Vehicles';
import {Trench, TRENCH, MistBands} from '../components/env/Trench';
import {MapWesternFront, CAM_WF} from '../maps/MapsWW1';
import {camLerp} from '../maps/GeoMap';
import {FlipCalendar} from '../maps/IconsWW1';
import {walk, seated, stand, point, addPose, holdFront, talkGesture, mixPose} from '../characters/poses';
import {RifleSlung} from '../characters/props';
import {Hug} from '../characters/interactions';
import {CAST} from '../characters/cast';
import {DateCard, FactPill, TermCard} from '../components/Text';
import {prog, clamp, lerp} from '../animations/core';
import {sec, Fig, Shot, ck, Crater} from './kit';
import {OLabel, Bicycle, CurtainWindow, ChalkScale} from './kit-b';

const {b, cut, abs} = sec('s07');
const END = b.dur; // 1800
const WHISTLE = abs(418.6); // sfx sync point (Somme whistles)
const T = [0, cut(2), cut(3), WHISTLE - 6, cut(5), cut(6), cut(7), END];

// ------------------------------------------------------------ S07-01 Western Front: bumps, then Verdun
const Verdun: React.FC<{f: number}> = ({f}) => {
  const a1 = b.at(1);
  const cam = f < a1 ? camLerp({lon: 4.3, lat: 49.4, zoom: 5.4}, CAM_WF.full, prog(f, 0, a1)) : camLerp(CAM_WF.full, CAM_WF.verdun, prog(f, a1, a1 + 120));
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapWesternFront f={f} cam={cam} idSuffix="-s07a" front={1} occupied={1} bumps={prog(f, 10, a1 - 5)} verdun={prog(f, a1 + 30, a1 + 140)} cities={['Paris', 'Verdun']} />
    </Shot>
  );
};

// ------------------------------------------------------------ S07-02 the road to Verdun (rain)
const VerdunRoad: React.FC<{f: number}> = ({f}) => {
  const t = f - T[1];
  return (
    <Shot f={f} bg="#6E7276" keys={ck([T[1], 1.12, 960, 640], [T[2], 1.06, 960, 470])}>
      <Sky top="#6A6E74" bottom="#A6A69E" />
      <Smoke x={1400} y={330} f={f} n={8} size={50} rise={200} drift={60} color="#7A7670" opacity={0.6} outline={false} />
      <Smoke x={700} y={360} f={f + 40} n={6} size={40} rise={160} drift={40} color="#7A7670" opacity={0.5} outline={false} />
      <Hills y={400} color="#7A6E5A" seed={9} amp={50} />
      {/* ruined fort outline on the ridge */}
      <path d="M1180,380 L1210,330 L1300,330 L1320,350 L1420,350 L1440,322 L1520,322 L1550,380 Z" fill="#8A847A" stroke={C.ink} strokeWidth={4} />
      <DistantFigures pts={[[1240, 330], [1262, 331], [1460, 323], [1484, 324], [1600, 380]]} s={1.2} color="#3A3C38" f={f} />
      <Ground y={470} color="#8A7656" />
      {[[240, 560, 260], [900, 520, 200], [1560, 600, 300], [600, 700, 240], [1300, 760, 220]].map(([x, y, w], i) => <Crater key={i} x={x} y={y} w={w} />)}
      {[[120, 520], [480, 480], [1100, 500], [1720, 520], [1840, 470]].map(([x, y], i) => <Tree key={i} x={x} y={y} s={0.8} kind="bare" color="#4A3E30" f={f} seed={i + 4} />)}
      <Rubble x={1450} y={430} w={220} seed={6} color="#8A847A" />
      {/* muddy road */}
      <path d="M-200,900 Q600,820 1000,700 Q1300,600 1700,470 L1800,480 Q1400,620 1060,760 Q700,900 -200,1060 Z" fill="#6E5A42" stroke={C.ink} strokeWidth={4} />
      <Truck x={lerp(300, 1150, prog(t, 0, 260))} y={lerp(890, 700, prog(t, 0, 260))} dist={t * 3} s={0.55} cover="#6E7A6A" mark="none" />
      {Array.from({length: 7}).map((_, i) => {
        const p = ((t * 0.0022 + i * 0.13) % 1);
        const x = lerp(-60, 1500, p);
        const y = lerp(1000, 560, p);
        return <Fig key={i} k="frenchSoldier1915" x={x} y={y} f={f + i * 9} s={lerp(0.72, 0.36, p)} pose={addPose(walk((t + i * 13) / 16, 0.7), {headTilt: 12})} back={<RifleSlung />} expr="tired" />;
      })}
      {/* walking wounded coming back, a comrade's arm round him */}
      {[0, 1].map((i) => {
        const p = clamp(0.62 - t * 0.0016 - i * 0.18);
        const x = lerp(-60, 1500, p) + 70;
        const y = lerp(1000, 560, p) + 30;
        const s = lerp(0.72, 0.36, p);
        return (
          <g key={'w' + i}>
            <Fig k="frenchSoldier1915" x={x} y={y} f={f} s={s} dir={-1} pose={addPose(walk(t / 22, 0.4), {lean: 10, headTilt: 16})} expr="tired" />
            <Fig k="frenchSoldier1915" x={x - 40 * s} y={y} f={f + 5} s={s} dir={-1} pose={addPose(walk(t / 22 + 0.5, 0.4), {shL: 70, elL: 30})} expr="solemn" />
          </g>
        );
      })}
      <Particles f={f} kind="rain" n={90} seed={12} wind={-0.4} opacity={0.6} />
    </Shot>
  );
};

// ------------------------------------------------------------ S07-03 Somme map → the week of shelling (trench at night)
const Shelling: React.FC<{f: number}> = ({f}) => {
  const t = f - T[2];
  const a4 = b.at(4);
  const toTrench = prog(f, a4 - 10, a4 + 14);
  const cam = camLerp(CAM_WF.full, {lon: 3.6, lat: 49.6, zoom: 6.2}, prog(t, 0, 140));
  const flash = Math.max(0, Math.sin(f / 5) * Math.sin(f / 13 + 1)) * 0.25;
  return (
    <Shot f={f} bg="#1A2030" keys={ck([a4, 1.1, 760, 600], [T[3], 1.12, 1160, 600])}>
      {toTrench < 1 && (
        <g opacity={1 - toTrench}>
          <MapWesternFront f={f} cam={cam} idSuffix="-s07b" front={1} occupied={1} verdun={1} somme={prog(t, 15, 80)} sommeLink={prog(t, 60, 120)} cities={['Albert', 'Verdun']} />
        </g>
      )}
      {toTrench > 0 && (
        <g opacity={toTrench}>
          <Trench f={f} view="trench" weather="clear" time="night" flashes={1} farLanterns={0} id="s07n" />
          {[560, 760, 1000, 1240, 1440].map((x, i) => (
            <Fig key={i} k="britSoldier1916" x={x} y={TRENCH.floorY} f={f + i * 11} pose={addPose(seated(f, i), {headTilt: i % 2 ? -10 : 6})} expr={i % 2 ? 'worried' : 'tired'} back={<RifleSlung />} />
          ))}
          <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#F0C070" opacity={flash} />
        </g>
      )}
    </Shot>
  );
};

// ------------------------------------------------------------ S07-04 1 July 1916: over the top into the mist
const OverTheTop: React.FC<{f: number}> = ({f}) => {
  const t = f - WHISTLE;
  const men: React.ReactNode[] = [];
  const ladders = [420, 1560];
  for (let i = 0; i < 10; i++) {
    const L = ladders[i % 2];
    const k = Math.floor(i / 2);
    const st = 8 + k * 22 + (i % 2) * 6;
    const climb = clamp((t - st) / 36);
    const go = clamp((t - st - 36) / 170);
    let x = L + (i % 2 ? -1 : 1) * (60 + k * 70) * (1 - prog(t, st - 30, st));
    let y = TRENCH.floorY;
    let s = 1;
    let op = 1;
    if (climb > 0) {
      x = L + (i % 2 ? -1 : 1) * 10;
      y = lerp(TRENCH.floorY, TRENCH.crestY, climb);
    }
    if (go > 0) {
      x = L + (i % 2 ? -1 : 1) * (10 + go * (120 + k * 40));
      y = lerp(TRENCH.crestY, TRENCH.horizonY + 70, go);
      s = lerp(1, 0.38, go);
      op = 1 - prog(go, 0.45, 0.95);
    }
    if (op <= 0) continue;
    men.push(<Fig key={i} k="britSoldier1916" x={x} y={y} f={f + i * 7} s={s} opacity={op} fromBehind pose={climb > 0 && climb < 1 ? addPose(walk(t / 6, 0.8), {shL: 120, shR: 110}) : walk(t / 18 + i * 0.3, go > 0 ? 0.7 : 0.2)} back={<RifleSlung />} />);
  }
  const grade = prog(t, 60, 300);
  return (
    <Shot f={f} bg="#C9C2B0" keys={ck([T[3], 1.14, 960, 650], [T[3] + 210, 1.02, 960, 520], [T[4], 1.0, 960, 540])} sombre={0.15 + grade * 0.45} drift={0.7}>
      <Trench f={f} variant="c" smoke={1} mist={0.8} id="s07d" />
      {men}
      <MistBands f={f} y0={300} y1={560} amount={0.9} />
    </Shot>
  );
};

// ------------------------------------------------------------ S07-05 a northern terraced street: Pals battalions
const Pals: React.FC<{f: number}> = ({f}) => {
  const t = f - T[4];
  const len = T[5] - T[4];
  return (
    <Shot f={f} bg="#8A8A8A" keys={ck([T[4], 1.06, 820, 560], [T[5], 1.08, 1140, 560])} sombre={0.25}>
      <Sky top="#9A9EA4" bottom="#C8C6BE" />
      {Array.from({length: 7}).map((_, i) => {
        const x = -160 + i * 330;
        return (
          <g key={i}>
            <rect x={x + 60} y={140} width={40} height={70} fill="#7A4A3A" stroke={C.ink} strokeWidth={3} />
            <Smoke x={x + 80} y={130} f={f + i * 20} n={4} size={16} rise={80} drift={60} color="#8A8A86" opacity={0.5} outline={false} />
            <rect x={x} y={200} width={330} height={560} fill={i % 2 ? '#9A5A44' : '#8E5240'} stroke={C.ink} strokeWidth={5} />
            <path d={`M${x - 10},200 L${x + 340},200 L${x + 330},180 L${x},180 Z`} fill="#4A4A50" stroke={C.ink} strokeWidth={4} />
            <CurtainWindow x={x + 40} y={270} closed={prog(t, 10 + i * 22, 40 + i * 22)} />
            <CurtainWindow x={x + 180} y={270} closed={prog(t, 20 + i * 22, 50 + i * 22)} color="#5A4A6A" />
            <CurtainWindow x={x + 180} y={500} w={110} h={150} closed={prog(t, 30 + i * 18, 60 + i * 18)} />
            <rect x={x + 40} y={560} width={100} height={200} fill="#2E3A44" stroke={C.ink} strokeWidth={4} />
          </g>
        );
      })}
      <path d="M-200,760 L2300,760 L2300,830 L-200,830 Z" fill="#9A9890" stroke={C.ink} strokeWidth={4} />
      <rect x={-200} y={830} width={2500} height={400} fill="#6A6862" />
      {/* neighbours at their doors */}
      <Fig k="woman1" x={230} y={790} f={f} s={0.72} pose={stand(f, 1)} expr="sad" />
      <Fig k="man1" x={560} y={790} f={f + 9} s={0.72} pose={addPose(stand(f, 3), {headTilt: 12})} expr="solemn" />
      <Fig k="woman2" x={1550} y={790} f={f + 4} s={0.72} pose={stand(f, 5)} expr="sad" />
      <Fig k="woman3" x={1880} y={790} f={f + 2} s={0.72} pose={addPose(stand(f, 2), {headTilt: 10})} expr="solemn" />
      {/* a woman with a letter to her chest, a neighbour's arm round her */}
      <Hug
        f={f}
        x={1080}
        y={800}
        scale={0.78}
        kind="comfort"
        adult={{head: {...CAST.woman2.head, expression: 'sad'}, outfit: CAST.woman2.outfit}}
        other={{head: {...CAST.woman1.head, expression: 'grief'}, outfit: {...CAST.woman1.outfit, color: '#4A4A5A'}, pose: addPose(holdFront(f, 2), {headTilt: 14}), eyesClosed: true}}
        start={T[4] + 20}
      />
      {/* the telegram boy wheels his bicycle slowly down the street */}
      {(() => {
        const x = lerp(1900, 1250, clamp(t / len));
        return (
          <g>
            <Bicycle x={x - 60} y={880} dist={-x} s={0.75} dir={-1} />
            <Fig k="kid1" x={x + 10} y={884} f={f} s={0.78} dir={-1} pose={addPose(walk(t / 24, 0.5), {shR: 60, elR: 20})} expr="solemn" />
          </g>
        );
      })()}
    </Shot>
  );
};

// ------------------------------------------------------------ S07-06 the Somme front creeps a few miles
const Creep: React.FC<{f: number}> = ({f}) => {
  const t = f - T[5];
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapWesternFront f={f} cam={camLerp(CAM_WF.somme, CAM_WF.sommeClose, prog(t, 0, 120))} idSuffix="-s07c" front={1} occupied={1} sommeCreep={prog(t, 30, 170)} sommeDots={prog(t, 20, 200)} cities={['Albert']} />
    </Shot>
  );
};

// ------------------------------------------------------------ S07-07 history room: the debate (balance scale)
const Debate: React.FC<{f: number}> = ({f}) => {
  const t = f - T[6];
  const draw = prog(t, 6, 110);
  const tilt = Math.sin(t / 16) * 9 * (1 - prog(t, 120, 200) * 0.6);
  const chalking = t < 110;
  return (
    <Shot f={f} bg={C.wallYellow} keys={ck([T[6], 1.0, 960, 540], [T[6] + 60, 1.0, 960, 540], [END, 1.07, 1080, 480])}>
      <HistoryRoom f={f} board={<ChalkScale x={1140} y={290} tilt={tilt} reveal={draw} left={'FUTILE\nSLAUGHTER?'} right={'WORE DOWN THE\nGERMAN ARMY?'} size={36} />} />
      <Fig k="guide" x={lerp(420, 330, prog(t, 120, 160))} y={900} f={f} s={1.5} pose={chalking ? point(f, 115) : mixPose(stand(f, 2), talkGesture(f, 1), 0.3)} expr="curious" turn={0.35} talking={f > b.at(7) && f < b.endOf(7) && !chalking} />
    </Shot>
  );
};

export const S07Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: T[0], to: T[1], el: <Verdun f={f} />},
      {from: T[1], to: T[2], el: <VerdunRoad f={f} />, trans: 'fade'},
      {from: T[2], to: T[3], el: <Shelling f={f} />, trans: 'cut'},
      {from: T[3], to: T[4], el: <OverTheTop f={f} />, trans: 'cut'},
      {from: T[4], to: T[5], el: <Pals f={f} />, trans: 'dip'},
      {from: T[5], to: T[6], el: <Creep f={f} />, trans: 'fade'},
      {from: T[6], to: T[7], el: <Debate f={f} />, trans: 'wipe'},
    ]}
  />
);

/** DAY 1 … DAY 7 flip tile, upper right (414.5–418.2 s). */
const DayTile: React.FC = () => {
  const f = useCurrentFrame();
  const a = abs(414.5);
  const z = abs(418.2);
  if (f < a - 1 || f > z + 1) return null;
  const op = prog(f, a, a + 8) * (1 - prog(f, z - 8, z));
  return <FlipCalendar x={1690} y={420} idx={clamp((f - a) / ((z - a - 10) / 6.99), 0, 6.99)} entries={['DAY 1', 'DAY 2', 'DAY 3', 'DAY 4', 'DAY 5', 'DAY 6', 'DAY 7']} opacity={op} />;
};

export const S07Overlay: React.FC = () => (
  <g>
    <DateCard at={abs(395.2)} until={abs(400.2)} date="FEBRUARY 1916" title="VERDUN" />
    <FactPill at={abs(401.4)} until={abs(408.4)} text="ABOUT 300 DAYS · AROUND 700,000 CASUALTIES (EST.)" x={1860} y={170} anchor="end" maxW={760} />
    <DateCard at={abs(409.4)} until={b.endOf(3)} date="JULY 1916" title="THE SOMME" sub="partly to relieve Verdun" />
    <DayTile />
    <DateCard at={abs(418.8)} until={abs(423.6)} date="1 JULY 1916" title="FIRST DAY OF THE SOMME" />
    <OLabel at={abs(422.1)} until={abs(427.8)} text={'MORE THAN 57,000 BRITISH CASUALTIES\nOVER 19,000 DEAD'} x={1860} y={620} anchor="end" tone="dark" size={40} />
    <FactPill at={abs(428.7)} until={abs(434.6) - 6} text={'"PALS" BATTALIONS'} sub="friends and workmates from the same towns" x={1860} y={150} anchor="end" />
    <FactPill at={abs(435.3)} until={abs(441.2)} text="JULY–NOVEMBER 1916: MORE THAN 1 MILLION CASUALTIES, ALL SIDES (EST.)" x={1870} y={700} anchor="end" maxW={900} />
    <TermCard at={abs(442.2)} until={END - 8} term="A DEBATE" meaning="Historians still disagree about the Somme." />
  </g>
);
