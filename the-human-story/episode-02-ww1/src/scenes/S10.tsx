// s10 — Chapter 9: 1918: The Last Battles (560–620 s, 1,800 frames). Storyboard S10-01 … S10-06 (ep02, editor B).
// M-01 trains west + US ship → MATCH M-02 Spring Offensive bulge · Foch at the wall map · Amiens: tanks out of the
// dawn mist · Hundred Days (M-02) → collapse (M-01) · Compiègne carriage before dawn · 11 o'clock: the pocket watch,
// helmets off, no-man's land with empty helmets beyond the wire (sombre, nobody cheers).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack, Camera} from '../components/Camera';
import {Sky, Ground, Hills, Interior, Tree} from '../components/Environment';
import {Particles, Smoke} from '../components/Effects';
import {RhomboidTank, TANK_DEPTH} from '../components/VehiclesWW1';
import {Trench, TRENCH, NML, MistBands, WireCoils} from '../components/env/Trench';
import {MapEurope1914, CAM_1914, MapWesternFront, CAM_WF, WesternFrontWallMap} from '../maps/MapsWW1';
import {camLerp} from '../maps/GeoMap';
import * as X from '../maps/ww1';
import {mix} from '../maps/StateMap';
import {walk, stand, point, addPose, mixPose, helmetToChest, hatOff, headBowed, standStiff, holdFront} from '../characters/poses';
import {RifleSlung} from '../characters/props';
import {CAST} from '../characters/cast';
import {GroupTag} from '../characters/StickFigure';
import {DateCard, FactPill, MemorialCard} from '../components/Text';
import {prog, clamp, lerp, easeInOut, easeOut} from '../animations/core';
import {sec, Fig, Shot, ck, fio} from './kit';
import {OLabel, Label, Ticker, PocketWatch} from './kit-b';

const {b, cut, abs} = sec('s10');
const END = b.dur; // 1800
const ELEVEN = b.at(7); // 11:00 — the guns fall silent
const T = [0, cut(2), cut(3), cut(4), cut(6), cut(7), END];
const ink = C.ink;

// ------------------------------------------------------------ S10-01 M-01 (trains west, US ship) → MATCH M-02 Spring Offensive
const WEST_CLOSE = {lon: 4.3, lat: 49.4, zoom: 4.6};
const Spring: React.FC<{f: number}> = ({f}) => {
  const m0 = b.at(1) - 18;
  const match = prog(f, m0, m0 + 26, easeInOut);
  const pan = camLerp(CAM_1914.central, CAM_1914.west, prog(f, 0, m0, easeInOut));
  const camA = camLerp(pan, WEST_CLOSE, prog(f, m0 - 20, m0 + 26, easeInOut));
  const camB = camLerp(CAM_WF.full, CAM_WF.amiens, prog(f, m0 + 30, T[1], easeInOut));
  return (
    <Shot f={f} bg="#9DBCC4">
      {match < 1 && (
        <g opacity={1 - match}>
          <MapEurope1914 f={f} cam={camA} idSuffix="-s10a" base="war1918" labels={prog(f, 10, 30) * (1 - prog(f, m0 - 30, m0))} y1918={{trains: prog(f, 20, m0 - 10), usShip: prog(f, 30, m0)}} />
        </g>
      )}
      {match > 0 && (
        <g opacity={match}>
          <MapWesternFront f={f} cam={camB} idSuffix="-s10b" era="1918" occupied={1} spring={prog(f, b.at(1) + 20, b.endOf(1) - 10)} cities={['Paris', 'Arras', 'Compiègne', 'Verdun']} labels={1} />
        </g>
      )}
    </Shot>
  );
};

// ------------------------------------------------------------ S10-02 Allied HQ: Foch at the wall map
const officer = (k: string, hat: string, hatColor: string) => ({...CAST[k].head, hat: hat as never, hatColor, expression: 'determined' as const});
const HQ: React.FC<{f: number}> = ({f}) => {
  const t = f - T[1];
  const sweep = prog(f, abs(578.4), abs(579.4), easeInOut);
  const lean = prog(t, 20, 60);
  return (
    <Shot f={f} bg="#C8B89A" keys={ck([T[1], 1.0, 900, 540], [T[2], 1.08, 1080, 520])}>
      <Interior wall="#D6C8A8" floor="#7A5E44" floorY={860} />
      {/* tall château windows */}
      {[60, 1700].map((x) => (
        <g key={x}>
          <rect x={x} y={120} width={180} height={640} fill="#C9DCE2" stroke={ink} strokeWidth={6} />
          <line x1={x + 90} y1={120} x2={x + 90} y2={760} stroke={ink} strokeWidth={4} />
          {[1, 2, 3].map((i) => <line key={i} x1={x} y1={120 + i * 160} x2={x + 180} y2={120 + i * 160} stroke={ink} strokeWidth={4} />)}
          <path d={`M${x},120 L${x + 180},120 L${x + 520},1100 L${x + 200},1100Z`} fill="#FFF6D8" opacity={0.12} />
        </g>
      ))}
      <rect x={-200} y={170} width={W + 400} height={14} fill="#B89A6A" opacity={0.6} />
      <WesternFrontWallMap x={560} y={140} w={1040} f={f} reverse={prog(f, abs(578.0), abs(579.6))} id="s10hq" />
      {/* Foch points decisively; on "struck back" he sweeps his arm across the map */}
      <Fig k="foch" x={400} y={930} f={f} s={1.12} dir={1} tag pose={mixPose(point(f, 112), point(f, 82), sweep)} expr="determined" talking={f > b.at(2) && f < b.endOf(2) && f % 90 < 50} />
      {/* unnamed British, French and US officers step in close (seen from behind, looking at the map) */}
      {[
        ['britSoldier1916', 'officerCap', '#6E6448', 860],
        ['frenchSoldier1915', 'kepi1914', '#6F86A0', 1130],
        ['usSoldier1918', 'officerCap', '#646238', 1400],
      ].map(([k, hat, col, x], i) => (
        <Fig key={i} k={k as string} x={(x as number) - lean * 40} y={1050 + (i % 2) * 14} f={f + i * 9} s={1.08} dir={-1} fromBehind
          pose={addPose(stand(f, i), {headTilt: -4 + Math.sin((f + i * 20) / 18) * 3 * prog(f, abs(576.0), abs(577.0))})} head={officer(k as string, hat as string, col as string)} />
      ))}
    </Shot>
  );
};

// ------------------------------------------------------------ S10-03 Amiens: tanks out of the dawn mist
const AUS_BRODIE = {...CAST.ausSoldier.head, hat: 'brodie' as const, hatColor: '#5E5A3A', expression: 'determined' as const};
const Amiens: React.FC<{f: number}> = ({f}) => {
  const t = f - T[2];
  const crane = abs(584.8);
  const near = (g: number) => 260 + (g - T[2]) * 1.6;
  const tanks: {x: number; y: number; d: keyof typeof TANK_DEPTH; sp: number}[] = [
    {x: -620, y: 690, d: 'far', sp: 0.6}, {x: -100, y: 700, d: 'far', sp: 0.6}, {x: 480, y: 694, d: 'far', sp: 0.6}, {x: 1100, y: 704, d: 'far', sp: 0.6}, {x: 1700, y: 690, d: 'far', sp: 0.6},
    {x: -300, y: 790, d: 'mid', sp: 1.0}, {x: 620, y: 800, d: 'mid', sp: 1.0}, {x: 1500, y: 790, d: 'mid', sp: 1.0},
  ];
  return (
    <Shot f={f} bg="#B9BCB4" keys={ck([T[2], 1.3, near(T[2]) + 180, 760], [crane, 1.28, near(crane) + 160, 740], [crane + 80, 1.0, 960, 520], [T[3], 1.0, 1000, 520])}>
      <Sky top="#9CA6AC" bottom="#E6DCC8" />
      <circle cx={1500} cy={430} r={80} fill="#F6E2B4" opacity={0.6} />
      <Hills y={620} color="#9AA088" seed={18} amp={30} />
      <Ground y={660} color="#8E9470" />
      <Smoke x={1700} y={640} f={f} n={6} size={40} rise={200} drift={-60} color="#A8A8A0" opacity={0.35} outline={false} />
      {tanks.map((k, i) => {
        const dp = TANK_DEPTH[k.d];
        const dist = (f + i * 37) * k.sp * 2;
        return <RhomboidTank key={i} x={k.x + t * k.sp} y={k.y} dist={dist} s={dp.s} f={f + i * 11} silhouette={dp.silhouette} mistColor="#B9BCB4" />;
      })}
      {/* infantry walking behind the mid tanks */}
      {[-300, 620, 1500].map((tx, gi) =>
        [0, 1, 2].map((j) => {
          const k = ['britSoldier1916', 'ausSoldier', 'canSoldier'][(gi + j) % 3];
          const x = tx - 260 - j * 70 + t * 1.0;
          return <Fig key={gi * 3 + j} k={k} x={x} y={800 + j * 6} f={f + j * 9} s={0.42} pose={walk((t + j * 9) / 13, 0.6)} expr="determined" back={<RifleSlung />} {...(k === 'ausSoldier' ? {head: AUS_BRODIE} : {})} />;
        }),
      )}
      <MistBands f={f} y0={600} y1={860} amount={0.75} />
      {/* the near tank we track beside, and its infantry */}
      <RhomboidTank x={near(f)} y={960} dist={(f - T[2]) * 3.2} s={1} f={f} />
      {[0, 1].map((j) => (
        <Fig key={'n' + j} k={j ? 'canSoldier' : 'britSoldier1916'} x={near(f) - 420 - j * 110} y={968 + j * 8} f={f + j * 13} s={0.8} pose={walk((t + j * 11) / 18, 0.6)} expr="determined" back={<RifleSlung />} />
      ))}
      <MistBands f={f} y0={880} y1={1080} amount={0.45} />
      <Particles f={f} kind="dust" n={20} seed={52} wind={0.5} opacity={0.3} />
    </Shot>
  );
};

// ------------------------------------------------------------ S10-04 the Hundred Days (M-02) → collapse and revolution (M-01)
const Collapse: React.FC<{f: number}> = ({f}) => {
  const t = f - T[3];
  const back = b.at(5) - 6;
  const toEurope = prog(f, back, back + 26, easeInOut);
  const camWF = camLerp(CAM_WF.full, {lon: 4.6, lat: 50.0, zoom: 5.0}, prog(t, 0, back - T[3], easeInOut));
  const camEU = camLerp({lon: 8, lat: 50.5, zoom: 2.0}, {lon: 14, lat: 49.5, zoom: 1.08}, prog(f, back, back + 60, easeInOut));
  // grey-outs via style overrides (the map's own tick tags would duplicate the storyboard ticker above)
  const grey = (k: number) => ({fill: mix(X.P14.central, '#B4B0A6', k)});
  const greys = {BGR: grey(prog(f, abs(595.0), abs(595.6))), OTT: grey(prog(f, abs(595.7), abs(596.3))), AH: grey(prog(f, abs(596.4), abs(597.0)))};
  const c = {
    kiel: prog(f, abs(596.6), abs(597.0)),
    redDots: prog(f, abs(597.2), abs(598.6)),
    kaiser: prog(f, abs(598.6), abs(600.2), easeInOut),
  };
  return (
    <Shot f={f} bg="#9DBCC4">
      {toEurope < 1 && (
        <g opacity={1 - toEurope}>
          <MapWesternFront f={f} cam={camWF} idSuffix="-s10c" occupied={1} hundred={prog(f, b.at(4) - 10, back - 10, easeInOut)} cities={['Paris', 'Amiens', 'Mons', 'Compiègne', 'Verdun']} labels={1} />
        </g>
      )}
      {toEurope > 0 && (
        <g opacity={toEurope}>
          <MapEurope1914 f={f} cam={camEU} idSuffix="-s10d" base="war1918" labels={prog(f, back + 20, back + 40)} collapse={c} styles={greys}>
            {({toScreen}) => {
              const kiel = toScreen(X.PLACE['Kiel']);
              const nl = toScreen([5.4, 52.2]);
              return (
                <g>
                  <Label op={fio(f, abs(596.8), abs(598.6))} text="KIEL: SAILORS MUTINY" x={kiel[0] - 50} y={kiel[1] - 40} size={36} anchor="end" />
                  <Label op={fio(f, abs(598.6), abs(601.6))} text="THE KAISER FLEES TO THE NETHERLANDS" x={nl[0] + 40} y={nl[1] + 70} size={36} anchor="start" />
                </g>
              );
            }}
          </MapEurope1914>
        </g>
      )}
    </Shot>
  );
};

// ------------------------------------------------------------ S10-05 Compiègne: the railway carriage before dawn
const Carriage: React.FC<{x: number; y: number; f: number}> = ({x, y, f}) => (
  <g transform={`translate(${x},${y})`}>
    {/* rails */}
    <rect x={-700} y={10} width={1400} height={12} fill="#5A5048" />
    {Array.from({length: 18}).map((_, i) => <rect key={i} x={-680 + i * 80} y={8} width={40} height={20} fill="#4A3E34" />)}
    <path d="M-520,-330 Q0,-380 520,-330 L520,-40 L-520,-40Z" fill="#3E3428" stroke={ink} strokeWidth={6} />
    <rect x={-540} y={-50} width={1080} height={24} fill="#2A2420" stroke={ink} strokeWidth={4} />
    {[-400, -200, 0, 200, 400].map((wx, i) => {
      const glow = 0.85 + 0.08 * Math.sin(f / 13 + i * 2);
      return (
        <g key={i}>
          <rect x={wx - 70} y={-280} width={140} height={120} rx={8} fill="#F2C870" opacity={glow} stroke={ink} strokeWidth={4} />
          {/* silhouettes lean over the table (no faces) */}
          {i >= 1 && i <= 3 && (
            <g opacity={0.85} transform={`translate(${wx + (i - 2) * 18},-160) rotate(${(i === 2 ? 14 : -10) + Math.sin(f / 45 + i) * 4})`}>
              <path d="M-34,0 L-26,-46 Q0,-58 26,-46 L34,0Z" fill="#2A2018" />
              <circle cx={i === 2 ? 14 : -10} cy={-70} r={17} fill="#2A2018" />
            </g>
          )}
          {i >= 1 && i <= 3 && <rect x={wx - 70} y={-176} width={140} height={14} fill="#4A3828" />}
        </g>
      );
    })}
    {[-380, 380].map((wx) => (
      <g key={wx} transform={`translate(${wx},0)`}>
        <circle cx={-60} cy={-6} r={30} fill="#1E1A16" stroke={ink} strokeWidth={4} />
        <circle cx={60} cy={-6} r={30} fill="#1E1A16" stroke={ink} strokeWidth={4} />
      </g>
    ))}
  </g>
);
const Compiegne: React.FC<{f: number}> = ({f}) => {
  const t = f - T[4];
  const pace = Math.sin(t / 70);
  const sx = 1500 + pace * 160;
  const facing = Math.cos(t / 70) >= 0 ? 1 : -1;
  return (
    <Shot f={f} bg="#2A3040" keys={ck([T[4], 1.0, 960, 560], [T[5], 1.14, 900, 520])} sombre={0.35} drift={0.7} vignette={0.5}>
      <Sky top="#1E2638" bottom="#5A6478" />
      {Array.from({length: 8}).map((_, i) => (
        <Tree key={i} x={-80 + i * 300 + (i % 2) * 60} y={720 - (i % 3) * 20} s={1.4 + (i % 3) * 0.2} kind="bare" color="#3A3A40" f={f} seed={i + 5} />
      ))}
      <Ground y={720} color="#4E5444" />
      <Carriage x={900} y={760} f={f} />
      <ellipse cx={900} cy={800} rx={600} ry={60} fill="#F2C870" opacity={0.08} />
      {/* a sentry paces slowly in the mist; breath vapour */}
      <Fig k="frenchSoldier1915" x={sx} y={860} f={f} s={0.75} dir={facing as 1 | -1} pose={walk(t / 24, 0.35)} expr="tired" back={<RifleSlung />} />
      <Smoke x={sx + facing * 26} y={860 - 196} f={f} n={3} size={10} rise={40} drift={facing * 30} color="#E8ECF0" opacity={0.35} outline={false} />
      <MistBands f={f} y0={600} y1={900} amount={0.8} />
      {/* falling leaves */}
      {Array.from({length: 14}).map((_, i) => {
        const y = ((t * (0.8 + (i % 3) * 0.3) + i * 97) % 900) + 80;
        const x = (i * 157 + Math.sin(t / 30 + i) * 60 + t * 0.4) % 2000;
        if (x < 175 && y < 155) return null;
        return <ellipse key={i} cx={x} cy={y} rx={9} ry={5} fill={i % 2 ? '#8A5A2E' : '#A8743A'} stroke={ink} strokeWidth={1.5} transform={`rotate(${t * 3 + i * 40},${x},${y})`} />;
      })}
    </Shot>
  );
};

// ------------------------------------------------------------ S10-06 11 o'clock: the watch → helmets off → no-man's land
const Eleven: React.FC<{f: number}> = ({f}) => {
  const pull = abs(611.1);
  const rise = b.at(8);
  const watchOut = prog(f, pull, pull + 40, easeInOut);
  const toNml = prog(f, rise, rise + 40, easeInOut);
  const tick = prog(f, ELEVEN - 4, ELEVEN + 2, easeOut);
  const minutes = 59 + tick + Math.max(0, f - ELEVEN) / 1800;
  return (
    <Shot f={f} bg="#9A9C98" drift={0} sombre={0.5} vignette={0.5}>
      {/* the trench, grey November morning: men stand, take off their helmets, look out over the parapet */}
      {toNml < 1 && (
        <g opacity={1 - toNml}>
          <Camera f={f} keys={[[pull, 1.18, 960, 640], [rise, 1.02, 960, 560], [rise + 40, 1.0, 960, 300]]} drift={0.7}>
            <Trench f={f} variant="c" time="grey" smoke={0} mist={0.7} id="s10t" />
            {['britSoldier1916', 'canSoldier', 'britSoldier1916', 'canSoldier', 'britSoldier1916'].map((k, i) => {
              const h = prog(f, pull + 20 + i * 14, pull + 70 + i * 14);
              return (
                <Fig key={i} k={k} x={480 + i * 250} y={TRENCH.firestepY} f={f + i * 13} s={1} fromBehind
                  pose={headBowed(helmetToChest(f, h, false, i), 0.3 * h)} hatInHand={hatOff(h) ? {} : undefined} expr="solemn" />
              );
            })}
          </Camera>
        </g>
      )}
      {/* no-man's land: a line of empty helmets beyond the wire */}
      {toNml > 0 && (
        <g opacity={toNml}>
          <Camera f={f} keys={[[rise, 1.12, 960, 640], [END, 1.0, 960, 520]]} drift={0.6}>
            <Trench f={f} view="nomansland" weather="mist" time="grey" mist={0.8} smoke={0} id="s10n" />
            {Array.from({length: 11}).map((_, i) => {
              const x = 280 + i * 140 + ((i * 37) % 30);
              const y = NML.horizonY + 70 + ((i * 13) % 14);
              return (
                <g key={i} transform={`translate(${x},${y}) rotate(${((i * 29) % 30) - 15})`}>
                  <path d="M-26,0 Q-24,-26 0,-28 Q24,-26 26,0Z" fill="#6A6A52" stroke={ink} strokeWidth={3} />
                  <ellipse cx={0} cy={0} rx={34} ry={7} fill="#5E5E48" stroke={ink} strokeWidth={3} />
                </g>
              );
            })}
            <MistBands f={f} y0={340} y1={620} amount={0.7} />
          </Camera>
        </g>
      )}
      {/* the pocket watch in a soldier's hand (close-up), pulls back and away */}
      {watchOut < 1 && (
        <g opacity={1 - watchOut} transform={`translate(${W / 2},${H / 2}) scale(${1 - watchOut * 0.6}) translate(${-W / 2},${-H / 2})`}>
          <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#7A7C78" opacity={1 - watchOut} />
          <g transform={`translate(0,${Math.sin(f / 40) * 3})`}>
            {/* palm and fingers (simple, white like the heads) */}
            {/* cuff and palm cupped under the watch */}
            <path d="M380,1200 L470,960 L720,1010 L660,1220Z" fill="#6E6448" stroke={ink} strokeWidth={7} strokeLinejoin="round" />
            <path d="M560,1000 Q700,780 960,770 Q1220,780 1300,900 Q1280,1010 1100,1040 L640,1060Z" fill="#F4F1E8" stroke={ink} strokeWidth={7} strokeLinejoin="round" />
            <PocketWatch x={960} y={560} r={240} minutes={minutes} f={f - ELEVEN} />
            {/* curled fingers over the right rim, thumb over the left */}
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M${1150 + i * 18},${830 - i * 70} q${70 - i * 6},-10 ${78 - i * 8},${-46 + i * 4} q4,-26 -22,-30 q-40,4 -66,${30 - i * 2}`} fill="#F4F1E8" stroke={ink} strokeWidth={6} strokeLinejoin="round" />
            ))}
            <path d="M720,850 Q690,760 730,700 Q760,670 790,690 Q800,740 790,800Z" fill="#F4F1E8" stroke={ink} strokeWidth={6} strokeLinejoin="round" />
          </g>
        </g>
      )}
    </Shot>
  );
};

export const S10Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: T[0], to: T[1], el: <Spring f={f} />},
      {from: T[1], to: T[2], el: <HQ f={f} />, trans: 'cut'},
      {from: T[2], to: T[3], el: <Amiens f={f} />, trans: 'wipe'},
      {from: T[3], to: T[4], el: <Collapse f={f} />, trans: 'fade'},
      {from: T[4], to: T[5], el: <Compiegne f={f} />, trans: 'dip'},
      {from: T[5], to: T[6], el: <Eleven f={f} />, trans: 'cut'},
    ]}
  />
);

const GTag: React.FC<{at: number; until: number; x: number; y: number; text: string}> = ({at, until, x, y, text}) => {
  const f = useCurrentFrame();
  const o = fio(f, at, until);
  return o <= 0 ? null : <GroupTag x={x} y={y} text={text} opacity={o} pointer={false} scale={1.3} />;
};

export const S10Overlay: React.FC = () => (
  <g>
    <DateCard at={abs(567.3)} until={abs(572.9)} date="21 MARCH 1918" title="SPRING OFFENSIVE" />
    <FactPill at={abs(569.0)} until={abs(572.9)} text="UP TO 40 MILES (64 KM)" x={1860} y={340} anchor="end" />
    <DateCard at={abs(580.8)} until={abs(585.5)} date="8 AUGUST 1918" title="AMIENS" />
    <MemorialCard at={abs(585.8)} until={abs(589.2)} heading={'"the black day of the German Army"'} lines={[{text: '— Ludendorff, later, in his memoirs', at: abs(586.3)}]} y={250} headSize={56} size={38} />
    <OLabel at={abs(590.0)} until={abs(593.4)} text="THE HUNDRED DAYS" x={W / 2} y={120} size={44} />
    <Ticker at={abs(595.0)} until={abs(601.0)} items={['BULGARIA 29 SEP', 'OTTOMAN EMPIRE 30 OCT', 'AUSTRIA-HUNGARY 3 NOV']} stagger={20} y={112} size={36} />
    <DateCard at={abs(602.0)} until={T[5] - 4} date="11 NOVEMBER 1918" title="COMPIÈGNE" sub="about 5 a.m." />
    <GTag at={abs(604.1)} until={T[5] - 2} x={900} y={420} text="ALLIED AND GERMAN DELEGATES" />
    <OLabel at={abs(613.3)} until={abs(619.0)} text={'EVEN THAT MORNING:\nAN ESTIMATED 2,700–3,000 MEN KILLED'} x={1860} y={340} anchor="end" tone="dark" size={38} />
  </g>
);
