// s06 — Chapter 5: A World War (320–390 s, 2,100 frames). Storyboard S06-01 … S06-07 (ep02, editor B).
// Tannenberg (globe → M-03 match) · Gallipoli (M-04) · the evacuation · the world at war (globe) · Empire troops ·
// the Armenian Genocide (sombre, non-graphic: empty doorway, distant silhouettes, a candle).
import React from 'react';
import {geoInterpolate} from 'd3-geo';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack} from '../components/Camera';
import {Sky, Ground, Hills, Sea, Tree, Clouds, Birds} from '../components/Environment';
import {Particles, Smoke, Candle, SombreGrade} from '../components/Effects';
import {DistantFigures} from '../components/env/Places';
import {Ship, SmallBoat} from '../components/Vehicles';
import {Globe} from '../maps/GeoMap';
import {GlobeHotspot} from '../maps/MapKit';
import {MapEasternFront, CAM_EF, MapGallipoli, CAM_GP} from '../maps/MapsWW1';
import {camLerp} from '../maps/GeoMap';
import {P14} from '../maps/ww1';
import {march, seated, slump, walk, stand, wave, salute, addPose} from '../characters/poses';
import {RifleSlung} from '../characters/props';
import {DateCard, FactPill, TermCard, MemorialCard} from '../components/Text';
import {prog, clamp, lerp, easeInOut, easeOut} from '../animations/core';
import {sec, Fig, Shot, ck, fio} from './kit';
import {OLabel, Label, StoneHouse, WashingLine, SimpleChair} from './kit-b';

const {b, cut, abs} = sec('s06');
const END = b.dur; // 2100
// Shot boundaries (section-local frames), snapped to beats.
const T = [0, cut(2), cut(3), abs(344.4), abs(351.8), cut(6), cut(8), END];

type LL = [number, number];
const ENT = ['France', 'United Kingdom', 'Russia', 'Serbia', 'Belgium', 'Montenegro'];
const CEN = ['Germany', 'Austria', 'Hungary', 'Czechia', 'Slovakia', 'Turkey', 'Bulgaria', 'Syria', 'Iraq'];
const blocs = (italy: number) => [
  ...ENT.map((name) => ({name, fill: P14.entente})),
  ...CEN.map((name) => ({name, fill: P14.central})),
  {name: 'Italy', fill: italy > 0.5 ? P14.entente : P14.neutral},
];

// ------------------------------------------------------------ S06-01 globe → Eastern Front (Tannenberg)
const Tannenberg: React.FC<{f: number}> = ({f}) => {
  const m0 = b.at(1) - 10;
  const match = prog(f, m0, m0 + 30, easeInOut);
  const t = f - m0;
  const lon = lerp(48, 20, prog(f, -20, m0 + 20));
  const cam = camLerp(CAM_EF.poland, CAM_EF.tannenberg, prog(f, m0 + 5, m0 + 70));
  return (
    <Shot f={f} bg={C.deepNavy}>
      {match < 1 && (
        <g opacity={1 - match} transform={`translate(${W / 2},${H / 2 + 40}) scale(${1 + match * 2.6}) translate(${-W / 2},${-H / 2 - 40})`}>
          <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={C.deepNavy} />
          <Globe f={f} lon={lon} lat={38} r={410} cy={580} highlights={blocs(0)}>
            {({proj}) => (
              <g>
                {([[3, 50], [24, 52.5], [12.5, 46.2], [40, 33], [35, -5], [21, 42]] as LL[]).map((at, i) => (
                  <GlobeHotspot key={i} proj={proj} at={at} f={f} delay={i * 8} r={20} />
                ))}
              </g>
            )}
          </Globe>
        </g>
      )}
      {match > 0 && (
        <g opacity={match}>
          <MapEasternFront
            f={f}
            cam={cam}
            idSuffix="-s06a"
            labels={prog(t, 20, 40)}
            tannenberg={prog(t, 30, 80)}
            pincers={prog(t, 80, 135)}
            breakup={prog(t, 140, 185)}
          />
        </g>
      )}
    </Shot>
  );
};

// ------------------------------------------------------------ S06-02 Gallipoli (M-04)
const Gallipoli: React.FC<{f: number}> = ({f}) => {
  const t = f - T[1];
  const cam = camLerp(CAM_GP.wide, CAM_GP.peninsula, prog(t, 60, 250));
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapGallipoli f={f} cam={cam} idSuffix="-s06" labels={prog(t, 5, 25)} ships={prog(t, 0, 110)} landings={prog(t, 90, 150)} ottoman={prog(t, 160, 200)} inset={prog(t, 180, 215)} />
    </Shot>
  );
};

// ------------------------------------------------------------ S06-03 the cliffs at dusk → night evacuation
const Cliffs: React.FC<{f: number}> = ({f}) => {
  const t = f - T[2];
  const len = T[3] - T[2];
  const night = prog(t, len * 0.35, len * 0.7);
  const sky0 = lerp(0, 1, night);
  const top = sky0 < 0.5 ? '#6E6A8A' : '#1E2638';
  const bottom = sky0 < 0.5 ? '#E8A878' : '#3A4660';
  return (
    <Shot f={f} bg="#2A3040" keys={ck([T[2], 1.18, 820, 430], [T[3], 1.06, 960, 610])} sombre={0.15}>
      <Sky top={top} bottom={bottom} />
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#1E2638" opacity={night * 0.55} />
      {night > 0.3 && Array.from({length: 26}).map((_, i) => <circle key={i} cx={(i * 263) % 2100 - 90} cy={40 + ((i * 97) % 300)} r={2.2} fill="#F4F1E8" opacity={(night - 0.3) * (0.6 + 0.4 * Math.sin(f / 9 + i))} />)}
      <Ship x={1650} y={720} f={f} s={0.55} kind="warship" color="#3A4048" smoke={false} dir={-1} />
      <Sea y={730} f={f} colors={['#4A5E70', '#3E5062', '#2E3E4E']} amp={8} speed={0.6} />
      {/* steep scrub cliff, narrow beach */}
      <path d="M-200,120 L120,140 Q420,260 560,470 Q700,640 900,760 L1060,800 L-200,1300 Z" fill="#8A7454" stroke={C.ink} strokeWidth={5} />
      <path d="M-200,880 L760,780 Q1100,770 1400,820 L2200,900 L2200,1300 L-200,1300 Z" fill="#C9B48A" stroke={C.ink} strokeWidth={5} />
      {Array.from({length: 34}).map((_, i) => {
        const x = -150 + ((i * 137) % 900);
        const y = 160 + ((i * 89) % 600) + x * 0.4;
        return y < 780 + (x > 600 ? -50 : 0) ? <circle key={i} cx={x} cy={y} r={14 + (i % 3) * 5} fill="#5E6A3E" stroke={C.ink} strokeWidth={2.5} /> : null;
      })}
      {/* dug-outs on the slope: tired men sit */}
      {([[200, 360, 'ausSoldier'], [330, 450, 'britSoldier1914'], [450, 560, 'ausSoldier']] as [number, number, string][]).map(([x, y, k], i) => (
        <g key={i} opacity={1 - prog(t, len * 0.45, len * 0.6)}>
          <path d={`M${x - 70},${y + 4} Q${x},${y - 90} ${x + 70},${y + 4} Z`} fill="#5E4E38" stroke={C.ink} strokeWidth={3} />
          <Fig k={k} x={x} y={y} f={f + i * 17} s={0.42} pose={addPose(seated(f, i), {headTilt: 14, lean: 6})} expr="tired" />
        </g>
      ))}
      {/* night: men file down to the beach and into boats */}
      {Array.from({length: 7}).map((_, i) => {
        const p = clamp((t - len * 0.5 - i * 7) / (len * 0.5));
        if (p <= 0) return null;
        const x = lerp(380, 1020, p);
        const y = lerp(560, 800, p);
        return <Fig key={'w' + i} k={i % 2 ? 'ausSoldier' : 'britSoldier1914'} x={x} y={y} f={f} s={0.4} pose={walk((t + i * 9) / 14, 0.6)} opacity={1 - prog(p, 0.85, 1)} back={<RifleSlung />} />;
      })}
      {[0, 1, 2].map((i) => {
        const p = clamp((t - len * 0.55 - i * 20) / (len * 0.6));
        return <SmallBoat key={i} x={lerp(1080 + i * 90, 1500 + i * 60, p)} y={lerp(800, 742, p) + i * 10} f={f + i * 11} s={0.38 - p * 0.1} passengers={4} color="#4A3A2E" seed={i + 3} />;
      })}
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#0E1420" opacity={night * 0.3} />
    </Shot>
  );
};

// ------------------------------------------------------------ S06-04 the world at war (globe, Empire troop routes)
const ORIGINS: [string, LL][] = [['INDIA', [77, 22]], ['SOUTH AFRICA', [25, -29]], ['AUSTRALIA', [140, -28]], ['NEW ZEALAND', [172, -41]], ['CANADA', [-75, 47]], ['CARIBBEAN', [-70, 18]]];
const FRANCE: LL = [2, 49];
const WorldWar: React.FC<{f: number}> = ({f}) => {
  const t = f - T[3];
  const flip = prog(f, abs(344.5), abs(345.2));
  const arrows = abs(346.9);
  const lon = lerp(36, 6, prog(f, T[3], T[4]));
  const lat = lerp(18, 26, prog(f, arrows, arrows + 60));
  return (
    <Shot f={f} bg={C.deepNavy}>
      <Globe f={f} lon={lon} lat={lat} r={440} cy={560} highlights={blocs(flip)}>
        {({proj}) => {
          const hot: [string, LL][] = [['ALPS', [12.5, 46.4]], ['MESOPOTAMIA', [44.4, 33]], ['PALESTINE', [35, 31.6]], ['EAST AFRICA', [36, -6]]];
          const labOp = prog(t, 20, 35) * (1 - prog(f, arrows + 20, arrows + 40));
          return (
            <g>
              {flip > 0 && flip < 1 && (() => {
                const p = proj([12.5, 42.8]);
                return p ? <circle cx={p[0]} cy={p[1]} r={30 + flip * 60} fill="none" stroke={P14.entente} strokeWidth={6} opacity={1 - flip} /> : null;
              })()}
              {hot.map(([name, at], i) => {
                const p = proj(at);
                return (
                  <g key={name}>
                    <GlobeHotspot proj={proj} at={at} f={t} delay={6 + i * 6} r={18} />
                    {p && labOp > 0 && (
                      <text x={p[0] + (name === 'PALESTINE' ? -26 : 26)} y={p[1] + (name === 'MESOPOTAMIA' ? -14 : name === 'PALESTINE' ? 34 : 12)} textAnchor={name === 'PALESTINE' ? 'end' : 'start'} fontFamily={FONT.sans} fontWeight={900} fontSize={34} fill="#FFFFFF" stroke={C.ink} strokeWidth={6} paintOrder="stroke" opacity={labOp}>
                        {name}
                      </text>
                    )}
                  </g>
                );
              })}
              {ORIGINS.map(([name, o], i) => {
                const g = geoInterpolate(o, FRANCE);
                const p = clamp((f - arrows - i * 14) / 70);
                if (p <= 0) return null;
                const pts: string[] = [];
                const N = 40;
                for (let k = 0; k <= N * p; k++) {
                  const q = proj(g(k / N) as LL);
                  if (q) pts.push(`${q[0].toFixed(1)},${q[1].toFixed(1)}`);
                }
                if (pts.length < 2) return null;
                const head = pts[pts.length - 1].split(',').map(Number);
                const first = pts[0].split(',').map(Number);
                const vis = proj(o);
                return (
                  <g key={name}>
                    <polyline points={pts.join(' ')} fill="none" stroke={C.ink} strokeWidth={11} strokeLinecap="round" strokeDasharray="22 16" strokeDashoffset={-f * 1.5} opacity={0.85} />
                    <polyline points={pts.join(' ')} fill="none" stroke={C.dustyYellow} strokeWidth={6} strokeLinecap="round" strokeDasharray="22 16" strokeDashoffset={-f * 1.5} />
                    <circle cx={head[0]} cy={head[1]} r={9} fill={C.dustyYellow} stroke={C.ink} strokeWidth={3} />
                    {vis && (
                      <text x={first[0]} y={first[1] + 44} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={30} fill="#FFFFFF" stroke={C.ink} strokeWidth={6} paintOrder="stroke" opacity={prog(p, 0, 0.3)}>
                        {name}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        }}
      </Globe>
    </Shot>
  );
};

// ------------------------------------------------------------ S06-05 Empire troops on a French road
const GROUPS: {k: string; label: string}[] = [
  {k: 'indianSoldier', label: 'INDIAN ARMY'},
  {k: 'canSoldier', label: 'CANADA'},
  {k: 'ausSoldier', label: 'AUSTRALIA'},
  {k: 'britSoldier1916', label: 'BRITISH WEST INDIES REGIMENT'},
];
const Column: React.FC<{f: number}> = ({f}) => {
  const t = f - T[4];
  const speed = 2.1;
  const s = 0.66;
  const lab = prog(f, abs(351.9), abs(352.4)) * (1 - prog(f, abs(356.4), abs(356.8)));
  return (
    <Shot f={f} bg="#E8C89A" keys={ck([T[4], 1.0, 1020, 540], [T[5], 1.05, 900, 560])}>
      <Sky top="#A9C2CC" bottom="#F2DDB0" />
      <Clouds f={f} n={3} seed={23} speed={0.3} yMin={60} yMax={220} />
      <Hills y={600} color="#B9A060" seed={7} amp={40} />
      <Ground y={650} color="#A99858" />
      <path d="M-300,760 L2400,760 L2400,880 L-300,880 Z" fill="#CDB98E" stroke={C.ink} strokeWidth={4} />
      {Array.from({length: 9}).map((_, i) => (
        <Tree key={i} x={-160 + i * 300} y={700} s={1.05} color={i % 2 ? '#C98A3A' : '#B9762E'} f={f} seed={i + 2} />
      ))}
      {/* cottage with villagers in the doorway */}
      <g>
        <rect x={1540} y={420} width={420} height={300} fill="#D8C8A8" stroke={C.ink} strokeWidth={5} />
        <path d="M1520,420 L1750,300 L1980,420 Z" fill="#8A5A3A" stroke={C.ink} strokeWidth={5} />
        <rect x={1700} y={560} width={100} height={160} fill="#3A2A1E" stroke={C.ink} strokeWidth={4} />
        <Fig k="woman1" x={1740} y={730} f={f} s={0.62} pose={wave(f, 2)} expr="happy" />
        <Fig k="man1" x={1640} y={740} f={f + 9} s={0.62} pose={wave(f + 11, 4)} expr="happy" />
        <Fig k="kid1" x={1860} y={760} f={f} s={0.62} pose={salute(f)} expr="happy" dir={-1} />
      </g>
      <Particles f={f} kind="dust" n={20} seed={8} wind={0.6} opacity={0.3} />
      {GROUPS.map((g, gi) => (
        <g key={g.k}>
          {[0, 1, 2].map((j) => {
            const x0 = 1180 - gi * 330 - j * 92 + t * speed;
            const dist = (t + gi * 13 + j * 5) * speed;
            return <Fig key={j} k={g.k} x={x0} y={850 - (j % 2) * 8} f={f + j * 7} s={s} pose={march(dist / 95)} back={<RifleSlung />} expr="determined" />;
          })}
          <Label op={lab} text={g.label} x={1180 - gi * 330 - 92 + t * speed} y={gi % 2 ? 560 : 500} size={g.label.length > 20 ? 28 : 32} tone="yellow" />
        </g>
      ))}
      <Smoke x={300 + t * speed * 0.5} y={860} f={f} n={5} size={18} rise={40} drift={-120} color="#D8C8A0" opacity={0.35} outline={false} />
    </Shot>
  );
};

// ------------------------------------------------------------ S06-06 an empty doorway at dusk (sombre)
const Doorway: React.FC<{f: number}> = ({f}) => {
  const t = f - T[5];
  const len = T[6] - T[5];
  const fade = prog(t, len * 0.3, len);
  return (
    <Shot f={f} bg="#4A4A52" keys={ck([T[5], 1.0, 960, 560], [T[6], 1.05, 980, 600])} drift={0.6} sombre={0.55} vignette={0.5}>
      <Sky top="#5A5E72" bottom="#C8A890" />
      <path d="M-200,780 L2200,780 L2200,1300 L-200,1300 Z" fill="#A89878" stroke={C.ink} strokeWidth={5} />
      <StoneHouse x={-260} base={790} w={560} h={430} door={0} color="#B8AA90" />
      <StoneHouse x={640} base={790} w={660} h={470} door={0.55 + 0.12 * Math.sin(f / 40)} color="#C8B89A" />
      <StoneHouse x={1620} base={790} w={560} h={420} door={0} color="#B4A68E" />
      <WashingLine x0={320} x1={600} y={420} f={f} wind={1.2} />
      <SimpleChair x={1220} y={800} s={1.1} rot={-4} />
      {/* abandoned bundle on the step */}
      <g transform="translate(1030,800)">
        <ellipse cx={0} cy={-26} rx={56} ry={30} fill="#9A7A5A" stroke={C.ink} strokeWidth={4} />
        <path d="M-10,-54 Q0,-76 14,-56" fill="none" stroke={C.ink} strokeWidth={4} />
      </g>
      <Particles f={f} kind="dust" n={26} seed={31} wind={1.6} opacity={0.45} />
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#151820" opacity={fade * 0.4} />
    </Shot>
  );
};

// ------------------------------------------------------------ S06-07 the desert at dusk, distant silhouettes, a candle
const Desert: React.FC<{f: number}> = ({f}) => {
  const t = f - T[6];
  const down = b.at(9) - 6;
  const pts: [number, number][] = [];
  for (let i = 0; i < 46; i++) {
    const p = clamp((t * 1.2 + i * 26) / 1500);
    const x = lerp(200, 2050, p) + Math.sin(i * 1.7) * 10;
    const y = lerp(745, 600, p);
    if (x < 2000) pts.push([x, y]);
  }
  const lineOp = 1 - prog(f, down - 40, down + 10);
  return (
    <Shot f={f} bg="#3A2E30" keys={ck([T[6], 1.08, 820, 520], [down, 1.12, 1180, 500], [down + 90, 1.18, 1220, 900], [END, 1.22, 1220, 910])} drift={0.6} sombre={0.45} vignette={0.55}>
      <Sky top="#4E3E4C" bottom="#B86A52" />
      <circle cx={1500} cy={560} r={70} fill="#E89A6A" opacity={0.55} />
      <Hills y={600} color="#4A3A3A" seed={5} amp={30} />
      <path d="M-300,640 Q500,590 1100,630 Q1700,670 2400,620 L2400,1500 L-300,1500 Z" fill="#B08A64" stroke={C.ink} strokeWidth={4} />
      <path d="M-300,820 Q400,760 900,800 Q1500,850 2400,790 L2400,1500 L-300,1500 Z" fill="#9C7A58" stroke={C.ink} strokeWidth={4} />
      {Array.from({length: 7}).map((_, i) => (
        <path key={i} d={`M${-200 + i * 380 + ((t * 0.4) % 60)},${880 + (i % 3) * 60} q60,-12 120,0 t120,0`} fill="none" stroke="#7E6046" strokeWidth={3} opacity={0.6} />
      ))}
      <g opacity={lineOp}>
        <DistantFigures pts={pts.map(([x, y]) => [x, y] as [number, number])} s={2.3} color="#2A2224" f={f * 0.5} />
      </g>
      <Particles f={f} kind="dust" n={30} seed={41} wind={1.4} opacity={0.35} />
      {/* foreground stone with a single candle */}
      <path d="M1100,1180 Q1110,1080 1220,1072 Q1340,1078 1350,1180 Z" fill="#7A6A5A" stroke={C.ink} strokeWidth={5} />
      <Candle x={1225} y={1078} f={f} s={1.3} seed={3} />
    </Shot>
  );
};

export const S06Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: T[0], to: T[1], el: <Tannenberg f={f} />},
      {from: T[1], to: T[2], el: <Gallipoli f={f} />, trans: 'wipe'},
      {from: T[2], to: T[3], el: <Cliffs f={f} />, trans: 'fade'},
      {from: T[3], to: T[4], el: <WorldWar f={f} />, trans: 'fade'},
      {from: T[4], to: T[5], el: <Column f={f} />, trans: 'cut'},
      {from: T[5], to: T[6], el: <Doorway f={f} />, trans: 'dip'},
      {from: T[6], to: T[7], el: <Desert f={f} />, trans: 'cut'},
    ]}
  />
);

export const S06Overlay: React.FC = () => (
  <g>
    <DateCard at={abs(323.2)} until={b.endOf(1)} date="AUGUST 1914" title="TANNENBERG" />
    <DateCard at={abs(329.5)} until={abs(335.9)} date="25 APRIL 1915" title="GALLIPOLI" />
    <TermCard at={abs(330.9)} until={b.endOf(2)} term="ANZACS" meaning="Australian and New Zealand Army Corps" />
    <FactPill at={abs(338.5)} until={T[3] - 4} text="EVACUATED BY JANUARY 1916" sub="more than 44,000 Allied dead (est.)" x={1860} y={330} anchor="end" />
    <OLabel at={abs(344.5)} until={abs(347.6)} text="ITALY JOINS THE ALLIES · MAY 1915" x={W / 2} y={110} size={40} />
    <FactPill at={abs(347.3)} until={abs(351.0)} text="ABOUT 1.5 MILLION MEN FROM SOUTH ASIA SERVED IN THE INDIAN ARMY" x={1870} y={150} anchor="end" maxW={760} />
    <DateCard at={abs(358.0)} until={abs(367.2)} date="1915" title="OTTOMAN EMPIRE" tone="dark" />
    <OLabel at={abs(369.0)} until={abs(377.5)} text={'AN ESTIMATED 600,000 TO 1.5 MILLION\nARMENIANS DIED'} x={1860} y={170} anchor="end" tone="dark" size={40} />
    <MemorialCard
      at={abs(378.6)}
      until={END - 6}
      heading="THE ARMENIAN GENOCIDE"
      y={250}
      headSize={60}
      size={38}
      lines={[
        {text: '1915–', at: abs(379.4)},
        {text: "Turkey's government rejects the term.", at: abs(382.8)},
        {text: 'Historians and genocide scholars overwhelmingly use it.', at: abs(383.6)},
      ]}
    />
  </g>
);
