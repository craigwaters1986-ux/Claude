// s04 — Chapter 3: 1914: The War of Movement Stops (190–260 s; local frames 0–2099). Storyboard S04-01 … S04-06.
// Departures (British platform, then French and German panels slide in) · M-02 advance and Mons · the Marne ·
// M-02 race to the sea → front line → zoom into the trench · Christmas night · the truce in no-man's land.
// Christmas whistle sync 248.4 s = local 1752; ball thumps 1596 / 1638 / 1683.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, W, H} from '../styles/theme';
import {ShotTrack} from '../components/Camera';
import {Sky, Hills, Tree, Flag, Clouds} from '../components/Environment';
import {Smoke, Explosion, Particles} from '../components/Effects';
import {Trench, TRENCH, WoodenCross, Football} from '../components/env/Trench';
import {MapWesternFront, CAM_WF} from '../maps/MapsWW1';
import {camLerp} from '../maps/GeoMap';
import {Hug, Handshake} from '../characters/interactions';
import {castProps} from '../characters/cast';
import {stand, walk, waveSide, kneelAim, point, addPose, talkGesture, helmetToChest, headBowed, run, mixPose} from '../characters/poses';
import {RifleAim, RifleSlung} from '../characters/props';
import {DateCard, FactPill} from '../components/Text';
import {prog, easeOut, easeInOut, clamp, lerp} from '../animations/core';
import {sec, Fig, Shot, ck} from './kit';
import {Station1914, WindowWavers, Boxed, QuoteCard} from './kit-ep02';

const {b, cut} = sec('s04');
const T1 = b.at(1) + 45; // 178: S04-01 → 02 (b1 + 1.5 s)
const T2 = cut(3); // 396 → 03 (WIPE)
const T3 = cut(4); // 622 → 04 (CUT)
const T4 = cut(7); // 1188 → 05 (DIP)
const T5 = b.at(8) + 162; // 1451 → 06 (CUT, b8 + 5.4 s)
const END = 2100;
const WHISTLE = 1752; // 248.4 s
const KICKS = [1596, 1638, 1683];

// ---------------------------------------------------------------- S04-01 departures
const trainX = (f: number) => 760 + 0.9 * f + 0.012 * f * f;
const Flowers: React.FC<{f: number; tx: number}> = ({f, tx}) => (
  <g>
    {[0, 1, 2, 3].map((i) => {
      const t = ((f + i * 23) % 70) / 70;
      const x0 = 520 + i * 260;
      const x = lerp(x0, tx - 300 - i * 180, t);
      const y = 900 - 360 * t + 300 * t * t;
      return <circle key={i} cx={x} cy={y} r={11} fill={i % 2 ? '#C7362B' : '#E8C440'} stroke={C.ink} strokeWidth={3} opacity={t < 0.9 ? 1 : 0} />;
    })}
  </g>
);
const Platform: React.FC<{f: number; k: string; flag: 'uk' | 'fr' | 'de-imperial'; bunting: boolean; boarding?: boolean}> = ({f, k, flag, bunting, boarding}) => {
  const tx = trainX(f);
  return (
    <g>
      <Station1914 f={f} trainX={tx} bunting={bunting} />
      <WindowWavers f={f} trainX={tx} k={k} />
      <Flag x={300} y={440} f={f} kind={flag} w={150} h={95} pole={360} seed={k.length} />
      {boarding &&
        [0, 1].map((i) => <Fig key={i} k={k} x={1240 - i * 150 + ((f * 1.1) % 120)} y={980 + i * 15} f={f} s={0.9} dir={1} pose={walk(f / 16 + i)} back={<RifleSlung />} expr="determined" seed={i + 3} />)}
    </g>
  );
};
const DepartureShot: React.FC<{f: number}> = ({f}) => {
  const tx = trainX(f);
  const split = prog(f, 92, 124, easeInOut);
  const sx = W - (W - 640) * split; // left edge of the slide-in panels
  return (
    <Shot
      f={f}
      bg="#B8B4A6"
      keys={ck([0, 1.0, 900, 560], [T1, 1.06, 1180, 560])}
      over={
        split > 0 ? (
          <g>
            <defs>
              <clipPath id="s0401panels">
                <rect x={sx} y={0} width={W - sx + 4} height={H} />
              </clipPath>
            </defs>
            <g clipPath="url(#s0401panels)">
              <Boxed x={sx} y={0} w={640} h={H} vb={[700, -40, 820, 1384]}>
                <Platform f={f + 30} k="frenchSoldier1914" flag="fr" bunting boarding />
              </Boxed>
              <Boxed x={sx + 640} y={0} w={640} h={H} vb={[700, -40, 820, 1384]}>
                <Platform f={f + 60} k="germanSoldier1914" flag="de-imperial" bunting={false} boarding />
              </Boxed>
            </g>
            <rect x={sx - 6} y={-10} width={12} height={H + 20} fill={C.ink} />
            <rect x={sx + 634} y={-10} width={12} height={H + 20} fill={C.ink} />
          </g>
        ) : undefined
      }
    >
      <Platform f={f} k="britSoldier1914" flag="uk" bunting />
      <Flowers f={f} tx={tx} />
      <Fig k="woman1" x={560} y={990} f={f} s={1.0} pose={waveSide(f, 1)} expr="happy" />
      <Fig k="kid1" x={660} y={1000} f={f} s={1.0} pose={waveSide(f, 4)} expr="happy" />
      <Hug f={f} x={1000} y={1010} scale={1.0} kind="embrace" adult={{...castProps('britSoldier1914')}} other={{...castProps('woman3')}} start={4} />
      <Fig k="man1" x={1420} y={995} f={f} s={0.95} pose={waveSide(f, 6)} dir={-1} expr="happy" />
    </Shot>
  );
};

// ---------------------------------------------------------------- S04-02 M-02: through Belgium, Mons, retreat
const AdvanceMap: React.FC<{f: number}> = ({f}) => {
  const cam = camLerp(CAM_WF.full, {lon: 3.7, lat: 49.95, zoom: 6.4}, prog(f, T1, T2));
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapWesternFront f={f} idSuffix="-s0402" cam={cam} cities={['Paris', 'Mons']} advance={prog(f, T1 + 2, 280)} mons={prog(f, 282, 322) + prog(f, 334, 388)} />
    </Shot>
  );
};

// ---------------------------------------------------------------- S04-03 the Marne: advance in open order, kneel, fire, walk on
const ALLIES: [string, number, number][] = [
  ['frenchSoldier1914', 240, 880], ['britSoldier1914', 470, 930], ['frenchSoldier1914', 690, 870], ['britSoldier1914', 900, 940], ['frenchSoldier1914', 1120, 885], ['britSoldier1914', 1330, 925],
];
const FIRE0 = 470;
const FIRE1 = 548;
const Haystack: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-70,0 Q-70,-110 0,-118 Q70,-110 70,0Z" fill="#D9B95E" stroke={C.ink} strokeWidth={4} />
    <path d="M-50,-30 Q0,-44 50,-30 M-56,-66 Q0,-80 56,-66" fill="none" stroke="#A88A3A" strokeWidth={3} />
  </g>
);
const MarneShot: React.FC<{f: number}> = ({f}) => {
  const t = f - T2;
  const pan = t * 1.6;
  const walkK = (i: number) => (f < FIRE0 + i * 4 ? 1 : f < FIRE1 + i * 3 ? 0 : 1);
  return (
    <Shot f={f} bg="#C9D9C8" keys={ck([T2, 1.1, 800, 640], [560, 1.1, 1000, 640], [T3, 1.04, 1080, 520])}>
      <Sky top="#A9C9D6" bottom="#F2E2B8" />
      <Clouds f={f} n={4} seed={7} speed={0.4} yMin={60} yMax={220} />
      <g transform={`translate(${-pan * 0.3},0)`}>
        <Hills y={600} color="#A7B07A" amp={50} seed={4} />
        {[0, 1, 2].map((i) => (
          <Smoke key={i} x={500 + i * 700} y={560} f={f + i * 40} n={7} size={60} rise={260} drift={90} color="#8E8E88" opacity={0.5} outline={false} seed={i + 2} />
        ))}
        {[420, 1150, 1900].map((x, i) => (
          <Explosion key={i} x={x} y={640} f={f} at={T2 + 40 + i * 70} s={0.3} dur={46} seed={i + 5} />
        ))}
        {/* Germans falling back over the far ridge (walking away; no one is hit) */}
        {[0, 1, 2, 3, 4].map((i) => {
          const gx = 1700 + i * 70 + t * 1.2;
          return <Fig key={i} k="germanSoldier1914" x={gx} y={610 + (i % 2) * 8} f={f} s={0.32} dir={1} pose={walk(t / 9 + i)} lod="low" expr="worried" seed={i + 20} opacity={clamp(1 - (gx - 1950) / 200)} />;
        })}
      </g>
      <g transform={`translate(${-pan * 0.6},0)`}>
        <rect x={-200} y={640} width={3200} height={600} fill="#B7B66E" />
        <path d="M-200,700 Q600,680 1300,720 T3000,700 L3000,760 Q1300,780 -200,750Z" fill="#7DA2AE" stroke={C.ink} strokeWidth={4} />
        {[180, 360, 1500, 1700, 2300].map((x, i) => (
          <Tree key={i} x={x} y={680} s={0.75} f={f} kind="pine" color="#6F8546" seed={i} />
        ))}
        <Haystack x={1080} y={800} />
        <Haystack x={1980} y={790} s={0.8} />
      </g>
      <g transform={`translate(${-pan},0)`}>
        <rect x={-200} y={820} width={3400} height={400} fill="#A9A562" />
        {ALLIES.map(([k, x0, y], i) => {
          const wk = walkK(i);
          const d0 = Math.min(f, FIRE0 + i * 4) - T2;
          const d1 = Math.max(0, f - FIRE1 - i * 3);
          const x = x0 + d0 * 2.0 + d1 * 2.0;
          const firing = wk === 0;
          const ps = firing ? kneelAim(f, i) : walk((d0 + d1) / 18 + i * 0.3);
          const muzzle = firing && ((f - FIRE0 - i * 5) % 34 < 5) && f > FIRE0 + 14;
          return (
            <g key={i}>
              <Fig
                k={k}
                x={x}
                y={y}
                f={f}
                s={0.9}
                dir={1}
                pose={ps}
                expr="determined"
                seed={i + 2}
                back={firing ? undefined : <RifleSlung />}
                overlay={firing ? (sk) => <RifleAim stock={{x: sk.armL.hx - 10, y: sk.armL.hy}} grip={{x: sk.armR.hx, y: sk.armR.hy}} /> : undefined}
              />
              {muzzle && <circle cx={x + 150} cy={y - 125} r={14} fill="#EDEDE6" stroke={C.ink} strokeWidth={2} opacity={0.85} />}
            </g>
          );
        })}
      </g>
    </Shot>
  );
};

// ---------------------------------------------------------------- S04-04 M-02: Marne → race to the sea → front line → into the trench
const FrontMap: React.FC<{f: number}> = ({f}) => {
  const c1 = camLerp({...CAM_WF.marne, zoom: 5.8}, CAM_WF.marne, prog(f, T3, b.at(5)));
  const c2 = camLerp(c1, CAM_WF.north, prog(f, b.at(5) - 10, b.endOf(5)));
  const cam = camLerp(c2, CAM_WF.full, prog(f, b.at(6) - 8, b.at(6) + 80));
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapWesternFront
        f={f}
        idSuffix="-s0404"
        cam={cam}
        cities={['Paris', 'Ypres', 'Verdun']}
        marne={prog(f, b.at(4), b.at(4) + 70)}
        quickVictory={prog(f, b.at(4) + 6, b.endOf(4) + 6, (t) => t)}
        race={prog(f, b.at(5), b.endOf(5), (t) => t)}
        front={prog(f, b.at(6), b.at(6) + 170)}
        trenchZoom={prog(f, 1132, T4 - 10, (t) => t)}
      />
    </Shot>
  );
};

// ---------------------------------------------------------------- S04-05 Christmas night: the carol from the German lines
const LIFT = 1300; // first head over the parapet (just before the ≈234.3 s reveal)
const Breath: React.FC<{f: number; x: number; y: number; dir: 1 | -1; seed: number}> = ({f, x, y, dir, seed}) => {
  const t = ((f + seed * 17) % 75) / 75;
  if (t > 0.6) return null;
  return <ellipse cx={x + dir * (20 + 50 * t)} cy={y - 18 * t} rx={10 + 26 * t} ry={7 + 12 * t} fill="#F4F6F8" opacity={0.45 * (1 - t / 0.6)} />;
};
const NIGHT: {x: number; up: number; dir: 1 | -1; hum?: boolean}[] = [
  {x: 700, up: LIFT, dir: 1},
  {x: 1180, up: LIFT + 45, dir: -1},
  {x: 860, up: LIFT + 90, dir: 1, hum: true},
  {x: 1440, up: LIFT + 120, dir: -1},
];
const ChristmasShot: React.FC<{f: number}> = ({f}) => (
  <Shot f={f} bg="#141E2E" keys={ck([T4, 1.3, 960, 760], [LIFT, 1.25, 960, 700], [LIFT + 70, 1.08, 960, 500], [T5, 1.06, 960, 480])} drift={0.7}>
    <Trench f={f} variant="b" id="s0405" precip={0.3} />
    {NIGHT.map((m, i) => {
      const up = prog(f, m.up, m.up + 34, easeInOut);
      const y = lerp(TRENCH.floorY, TRENCH.firestepY, up);
      const ps = up >= 1 && i === 1 ? point(f, 70) : addPose(stand(f, i), {headTilt: -12 + 4 * up, lean: -2});
      const s = 1;
      return (
        <g key={i}>
          <Fig k="britSoldier1914" x={m.x} y={y} f={f} s={s} dir={m.dir} pose={ps} expr={up > 0.5 ? 'surprised' : 'neutral'} talking={!!m.hum && f > 1230} seed={i + 30} turn={up > 0.5 ? 0.15 : 0.35} />
          <Breath f={f} x={m.x} y={y - 205} dir={m.dir} seed={i} />
        </g>
      );
    })}
    <Particles f={f} kind="snow" n={40} seed={9} wind={0.2} speed={0.35} opacity={0.6} />
  </Shot>
);

// ---------------------------------------------------------------- S04-06 the truce in no-man's land
const ret = (f: number) => prog(f, WHISTLE + 10, END, (t) => t);
const Ball: React.FC<{f: number}> = ({f}) => {
  const P: [number, number][] = [[1350, 852], [1490, 872], [1625, 846], [1410, 860], [1475, 890]];
  let x = P[0][0];
  let y = P[0][1];
  let h = 0;
  const legs: [number, number, number][] = [[KICKS[0], 0, 1], [KICKS[1], 1, 2], [KICKS[2], 2, 3], [WHISTLE - 8, 3, 4]];
  for (const [at, a, c] of legs) {
    if (f >= at) {
      const t = prog(f, at, at + 34, easeOut);
      x = lerp(P[a][0], P[c][0], t);
      y = lerp(P[a][1], P[c][1], t);
      h = Math.sin(Math.PI * t) * (c === 4 ? 10 : 60);
    }
  }
  return <Football x={x} y={y - h} s={1.1} rot={f * 3} />;
};
const TruceShot: React.FC<{f: number}> = ({f}) => {
  const r = ret(f);
  const snow = prog(f, 1737, 1900);
  const tin = prog(f, 1500, 1540);
  // returning: British come back towards us, Germans walk away to their own line
  const brit = (x: number, y: number, s: number, i: number, base: React.ComponentProps<typeof Fig>['pose']) =>
    r > 0 ? {x: x - 120 * r, y: y + 160 * r, s: s * (1 + 0.25 * r), pose: walk(((f - WHISTLE) * 1.4) / 18 + i), dir: -1 as const, fromBehind: false} : {x, y, s, pose: base, dir: 1 as const, fromBehind: false};
  const ger = (x: number, y: number, s: number, i: number, base: React.ComponentProps<typeof Fig>['pose'], dir: 1 | -1 = -1) =>
    r > 0 ? {x: x + 60 * r, y: y - 300 * r, s: s * (1 - 0.5 * r), pose: walk(((f - WHISTLE) * 1.4) / 18 + i), dir: 1 as const, fromBehind: true} : {x, y, s, pose: base, dir, fromBehind: false};
  const kickPose = (k: number, i: number) => {
    const near = KICKS.some((a, j) => j % 3 === k && Math.abs(f - a) < 10);
    return near ? run(f / 6 + i) : mixPose(stand(f, i), talkGesture(f, i), 0.3);
  };
  const shake = r <= 0;
  const p1 = brit(1040, 810, 0.85, 1, talkGesture(f, 1));
  const p2 = ger(1180, 805, 0.85, 2, talkGesture(f, 2));
  const k1 = ger(1330, 858, 0.75, 3, kickPose(0, 3), 1);
  const k2 = brit(1480, 878, 0.75, 4, kickPose(1, 4));
  const k3 = ger(1630, 852, 0.75, 5, kickPose(2, 5));
  return (
    <Shot
      f={f}
      bg="#DADDD6"
      keys={ck([T5, 1.3, 980, 600], [1488, 1.3, 960, 600], [1532, 1.3, 645, 580], [1572, 1.3, 645, 580], [1640, 1.3, 1275, 600], [WHISTLE, 1.3, 1275, 600], [1860, 1.03, 960, 520], [END, 1.0, 960, 540])}
      drift={0.7}
    >
      <Trench f={f} view="nomansland" weather="frost" time="day" nearParapet={false} id="s0406" />
      {/* burial party, far left, bareheaded */}
      {[300, 370, 440].map((x, i) => (
        <WoodenCross key={x} x={x} y={660 + i * 6} s={0.6} />
      ))}
      <line x1={500} y1={672} x2={530} y2={600} stroke="#5A4630" strokeWidth={6} strokeLinecap="round" />
      <line x1={230} y1={676} x2={214} y2={604} stroke="#5A4630" strokeWidth={6} strokeLinecap="round" />
      {[250, 520, 590].map((x, i) => (
        <Fig key={i} k="britSoldier1914" x={x} y={700 + i * 8} f={f * 0.6} s={0.55} dir={i === 0 ? 1 : -1} pose={headBowed(helmetToChest(f, 1, false, i), 1)} hatInHand={{side: 'R'}} expr="solemn" seed={i + 50} />
      ))}
      {/* handshake */}
      {shake ? (
        <Handshake f={f} x={860} y={790} scale={0.85} start={T5 + 6} duration={70} a={{...castProps('britSoldier1914'), seed: 61}} b={{...castProps('germanSoldier1914'), seed: 62}} />
      ) : (
        <g>
          <Fig k="britSoldier1914" x={796 - 140 * r} y={790 + 160 * r} f={f} s={0.85 * (1 + 0.25 * r)} dir={-1} pose={walk(((f - WHISTLE) * 1.4) / 18)} seed={61} />
          <Fig k="germanSoldier1914" x={924 + 60 * r} y={790 - 300 * r} f={f} s={0.85 * (1 - 0.5 * r)} dir={1} fromBehind pose={walk(((f - WHISTLE) * 1.4) / 18 + 0.5)} seed={62} />
        </g>
      )}
      {/* a cap and a tin swapped */}
      <Fig k="britSoldier1914" x={p1.x} y={p1.y} f={f} s={p1.s} dir={p1.dir} pose={p1.pose} fromBehind={p1.fromBehind} expr="happy" talking={r <= 0 && f % 80 < 40} seed={63} />
      <Fig k="germanSoldier1914" x={p2.x} y={p2.y} f={f} s={p2.s} dir={p2.dir} pose={p2.pose} fromBehind={p2.fromBehind} expr="happy" talking={r <= 0 && f % 80 >= 40} seed={64} />
      {r <= 0 && (
        <g>
          <rect x={lerp(1075, 1145, tin) - 14} y={650} width={28} height={22} rx={3} fill="#9A9C9E" stroke={C.ink} strokeWidth={3} />
          <ellipse cx={lerp(1145, 1075, tin)} cy={676} rx={20} ry={9} fill="#8C7A4E" stroke={C.ink} strokeWidth={3} />
        </g>
      )}
      {/* football, right */}
      <Fig k="germanSoldier1914" x={k1.x} y={k1.y} f={f} s={k1.s} dir={k1.dir} pose={k1.pose} fromBehind={k1.fromBehind} expr="happy" seed={65} />
      <Fig k="britSoldier1914" x={k2.x} y={k2.y} f={f} s={k2.s} dir={-1} pose={k2.pose} fromBehind={k2.fromBehind} expr="happy" seed={66} />
      <Fig k="germanSoldier1914" x={k3.x} y={k3.y} f={f} s={k3.s} dir={k3.dir} pose={k3.pose} fromBehind={k3.fromBehind} expr="happy" seed={67} />
      <Ball f={f} />
      {snow > 0 && <Particles f={f} kind="snow" n={90} seed={14} wind={0.35} speed={0.45} opacity={snow} />}
    </Shot>
  );
};

export const S04Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: 0, to: T1, el: <DepartureShot f={f} />},
      {from: T1, to: T2, el: <AdvanceMap f={f} />, trans: 'fade'},
      {from: T2, to: T3, el: <MarneShot f={f} />, trans: 'wipe'},
      {from: T3, to: T4, el: <FrontMap f={f} />, trans: 'cut'},
      {from: T4, to: T5, el: <ChristmasShot f={f} />, trans: 'dip'},
      {from: T5, to: END, el: <TruceShot f={f} />, trans: 'cut'},
    ]}
  />
);

const sx = (t: number) => Math.round((t - 190) * 30);
export const S04Overlay: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <g>
      <DateCard at={sx(199.2)} until={T2 - 4} date="23 AUGUST 1914" title="MONS" />
      <DateCard at={sx(203.9)} until={sx(210.6)} date="SEPTEMBER 1914" title="THE MARNE" />
      <FactPill at={sx(215.9)} until={sx(220.6)} text="THE RACE TO THE SEA" x={1860} y={380} anchor="end" size={44} />
      <FactPill at={sx(222.3)} until={sx(229.2)} text="WESTERN FRONT: ABOUT 700 KM" sub="Belgian coast to Switzerland" x={1860} y={380} anchor="end" size={42} />
      <DateCard at={sx(230.3)} until={sx(236.3)} date="CHRISTMAS 1914" title="THE WESTERN FRONT" />
      <QuoteCard f={f} at={sx(243.0)} until={sx(248.1)} quote={'"not a shot fired all day or night."'} credit="— Rifleman William Eve, diary, 25 December 1914" y={290} size={50} />
      <FactPill at={sx(248.9)} until={sx(255.6)} text="UNOFFICIAL · PATCHY · NOT EVERYWHERE" x={1860} y={400} anchor="end" size={40} maxW={800} />
    </g>
  );
};

void H;
void point;
void clamp;
