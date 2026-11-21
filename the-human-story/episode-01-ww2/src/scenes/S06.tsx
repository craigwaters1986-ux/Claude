// s06 — Chapter 5: The War Becomes Global (270-330 s). Storyboard S06-01 … S06-10.
import React from 'react';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack} from '../components/Camera';
import {Sky, Ground, Hills, Tree, Flag, Clouds, Building, Interior, Table, Sea, Document} from '../components/Environment';
import {Smoke, Fire, Particles, Explosion} from '../components/Effects';
import {Tank, Plane, SmallBoat, Newspaper} from '../components/Vehicles';
import {MoscowSkyline, PearlHarbor, OahuAirfield} from '../components/env/Places';
import {MapBarbarossa, MapEastAsia} from '../maps/EpisodeMaps';
import {Globe} from '../maps/GeoMap';
import {GlobeHotspot, HOTSPOTS} from '../maps/MapKit';
import {walk, run, stand, march, talkGesture, mixPose, cower, takeCover, helmetToChest, hatOff, headBowed, kneel, point, slump} from '../characters/poses';
import {Crowd} from '../characters/Crowd';
import {DateCard, FactPill, TermCard} from '../components/Text';
import {prog, clamp, lerp} from '../animations/core';
import {sec, Fig, Walker, Shot, ck, Microphone, HandCart} from './kit';

const {b, cut} = sec('s06');
const T = [0, cut(1), cut(2), cut(3), cut(4), cut(5), 1120, cut(6), cut(7), cut(8), 1800];

// ------------------------------------------------------------ S06-01 Barbarossa at dawn
const Dawn: React.FC<{f: number}> = ({f}) => (
  <Shot f={f} bg="#C9B49A" keys={ck([0, 1.0, 960, 540], [T[1], 1.08, 1000, 560])}>
    <Sky top="#6E7A92" bottom="#F0C890" />
    {Array.from({length: 7}).map((_, i) => {
      const fl = Math.max(0, Math.sin(f / 5 + i * 2.3)) ** 12;
      return <ellipse key={i} cx={150 + i * 280} cy={640} rx={90} ry={30} fill="#FFD27A" opacity={fl * 0.8} />;
    })}
    <Hills y={650} color="#7E8A62" seed={11} amp={20} />
    {[1500, 1600, 1700, 1780].map((x, i) => (
      <Tree key={i} x={x} y={660} kind="round" s={0.5} color="#6E7E4E" seed={i} f={f} />
    ))}
    <Ground y={680} color="#8E9A66" />
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const go = Math.max(0, f - 20 - i * 8) * 1.6;
      const x = 150 + (i % 3) * 600 + go;
      return <Tank key={i} x={x} y={i < 3 ? 760 : 880} dist={x} s={i < 3 ? 0.55 : 0.85} f={f} />;
    })}
    {[0, 1, 2, 3, 4].map((i) => (
      <Walker key={i} k="germanSoldier" f={f} x0={-100 + i * 140} speed={1.4} y={990} s={0.9} expr="determined" />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <Plane key={i} x={-300 + f * 6 - i * 200} y={120 + i * 40} f={f} kind={i % 2 ? 'stuka' : 'bf109'} s={0.35} />
    ))}
  </Shot>
);

// ------------------------------------------------------------ S06-02 map: the front
const FrontMap: React.FC<{f: number}> = ({f}) => (
  <Shot f={f} bg="#9DBCC4">
    <MapBarbarossa f={f - T[1]} cues={{front: 5, arrows: 30, bracket: b.at(1) + 94 - T[1]}} />
  </Shot>
);

// ------------------------------------------------------------ S06-03 the village road
const Village: React.FC<{f: number}> = ({f}) => {
  const t = f - T[2];
  return (
    <Shot f={f} bg="#B8B4A4" keys={ck([T[2], 1.05, 900, 560], [T[3], 1.05, 1060, 560])}>
      <Sky top="#8C9298" bottom="#D8CFB8" />
      {[1500, 1620, 1740].map((x, i) => (
        <Building key={i} x={x} base={640} w={90} h={70} color="#8A7A62" seed={i + 50} />
      ))}
      <Fire x={1620} y={600} f={f} s={0.35} seed={2} />
      <Smoke x={1620} y={590} f={f} n={8} size={40} rise={300} drift={80} color="#4A4A4A" opacity={0.6} seed={3} />
      {[200, 330, 470, 1200].map((x, i) => (
        <Tree key={i} x={x} y={660} kind="bare" s={0.8} color="#E8E4DA" seed={i} f={f} />
      ))}
      <Ground y={650} color="#9A9A72" />
      <path d="M-200,820 Q960,760 2200,830 L2200,1000 Q960,930 -200,1000 Z" fill="#8A7A62" stroke={C.ink} strokeWidth={4} />
      {[0, 1, 2].map((i) => {
        const x = 1500 - t * 1.1 - i * 380;
        return (
          <g key={i}>
            <HandCart x={x} y={930} dist={-x} s={0.75} dir={-1} />
            <Fig k={['woman2', 'man1', 'woman3'][i]} x={x - 170} y={935} f={f} dir={-1} pose={{...walk(t / 30 + i, 0.6), lean: 10, shR: 80, elR: 20}} expr="sad" />
          </g>
        );
      })}
      <Fig k="kid1" x={1200 - t * 1.1} y={935} f={f} dir={-1} pose={walk(t / 20, 0.6)} expr="sad" />
      {[0, 1, 2, 3].map((i) => (
        <Walker key={i} k="sovietSoldier" f={t} x0={-300 - i * 120} speed={1.8} y={850} s={0.75} expr="determined" />
      ))}
    </Shot>
  );
};

// ------------------------------------------------------------ S06-04 outside Moscow → the counter-attack
const Moscow: React.FC<{f: number}> = ({f}) => {
  const t = f - T[3];
  const attack = Math.max(0, f - 745);
  return (
    <Shot f={f} bg="#C9CED2" keys={ck([T[3], 1.0, 900, 560], [740, 1.0, 950, 560], [790, 1.0, 1700, 560], [T[4], 1.0, 1760, 560])}>
      <rect x={-200} y={-200} width={3400} height={1000} fill="#BFC6CC" />
      <Sky top="#9AA4AC" bottom="#DADCD8" />
      <MoscowSkyline base={660} x0={800} />
      <Ground y={680} color={C.snow} />
      <rect x={-200} y={680} width={3400} height={600} fill={C.snow} />
      <rect x={180} y={600} width={10} height={140} fill="#5A4A3A" stroke={C.ink} strokeWidth={2} />
      <rect x={110} y={600} width={160} height={50} fill="#F4EBD6" stroke={C.ink} strokeWidth={3} />
      <text x={190} y={636} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={30} fill={C.ink}>MOSCOW</text>
      <Tank x={700} y={860} dist={0} s={0.9} f={0} exhaust={false} snow />
      {[0, 1, 2].map((i) => (
        <Fig key={i} k="germanSoldier" x={380 + i * 160 + (i === 1 ? 600 : 0)} y={920 + (i % 2) * 20} f={f} pose={{...cower(f, i), lean: 4}} expr="cold" />
      ))}
      {Array.from({length: 10}).map((_, i) => (
        <Tree key={i} x={2100 + i * 110} y={700} kind="bare" s={1.1} color="#ECE8DE" seed={i} f={f} />
      ))}
      {[0, 1].map((i) => {
        const x = 2400 - attack * 3.5 - i * 300;
        return <Tank key={'t' + i} x={x} y={840 + i * 60} dist={-x} s={0.8} dir={-1} f={f} variant="t34" snow />;
      })}
      {[0, 1, 2, 3, 4].map((i) => (
        <Fig key={'s' + i} k="sovietWinter" x={2200 + i * 120 - attack * 4.2} y={930 + (i % 2) * 25} f={f} dir={-1} pose={attack > 0 ? run(attack / 9 + i) : stand(f, i)} expr="determined" />
      ))}
      <Particles f={f} kind="snow" n={110} seed={8} wind={-2} speed={1.6} />
    </Shot>
  );
};

// ------------------------------------------------------------ S06-05 East Asia 1941
const Asia41: React.FC<{f: number}> = ({f}) => {
  const t = f - T[4];
  const cam = {lon: lerp(122, 116, prog(t, 0, 150)), lat: lerp(36, 28, prog(t, 0, 150)), zoom: 1.0};
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapEastAsia f={t} cam={cam} show1941 cues={{japan1941: 10}} />
    </Shot>
  );
};

// ------------------------------------------------------------ S06-06 Pearl Harbor
const Pearl: React.FC<{f: number}> = ({f}) => {
  const t = f - T[5];
  const burning = [0, 1, 2, 3, 4, 5].map((i) => (t > 30 + i * 14 ? 1 : 0));
  return (
    <Shot f={f} bg="#8FB9D2" shake={1.5 * prog(t, 25, 40)} keys={ck([T[5], 1.0, 960, 560], [T[6], 1.06, 960, 600])}>
      <PearlHarbor f={f} burning={burning} />
      {[0, 1, 2, 3].map((i) => {
        const k = prog(t, i * 10, 40 + i * 10);
        return <Plane key={i} x={lerp(2000, 300 + i * 330, k) - Math.max(0, t - 40 - i * 10) * 6} y={lerp(-60, 520, k) - Math.max(0, t - 40 - i * 10) * 5} f={f} kind={i % 2 ? 'kate' : 'zero'} s={0.4} dir={-1} bank={-30 * (1 - k)} />;
      })}
      {[0, 1, 2, 3].map((i) => (
        <Explosion key={i} x={260 + i * 330} y={690} f={t} at={30 + i * 14} s={0.6} seed={i} />
      ))}
    </Shot>
  );
};

// ------------------------------------------------------------ S06-07 Oahu's airfields
const Oahu: React.FC<{f: number}> = ({f}) => (
  <Shot f={f} bg="#8FB9D2" keys={ck([T[6], 1.05, 800, 560], [T[7], 1.05, 1120, 560])}>
    <OahuAirfield f={f} burning={[1, 0, 1, 1, 0, 1]} />
    {[0, 1, 2].map((i) => (
      <Fig key={i} k="sailor" x={1500 + i * 120} y={960} f={f} pose={i === 1 ? kneel(f) : takeCover(f, i)} expr="scared" s={0.9} />
    ))}
    <Plane x={2100 - (f - T[6]) * 9} y={200} f={f} kind="zero" s={0.35} dir={-1} />
  </Shot>
);

// ------------------------------------------------------------ S06-08 aftermath: silence (sombre)
const Mourn: React.FC<{f: number}> = ({f}) => {
  const t = f - T[7];
  const sf = f * 0.6;
  return (
    <Shot f={f} bg="#8FA0AA" keys={ck([T[7], 1.0, 960, 560], [T[8], 1.06, 960, 580])} sombre={0.3}>
      <PearlHarbor f={f} burning={[0, 1, 0, 1, 0, 0]} calm />
      <Smoke x={600} y={640} f={f} n={8} size={80} rise={500} drift={200} color="#3A3A3A" opacity={0.5} seed={4} />
      <SmallBoat x={980} y={900} f={f} s={1.2} color="#7D868C" seed={3} />
      {[0, 1, 2].map((i) => (
        <Fig key={i} k="sailor" x={880 + i * 100} y={860} f={sf} s={0.75} pose={headBowed(helmetToChest(sf, 1), 1)} hatInHand={hatOff(1) ? {} : undefined} expr="solemn" eyesClosed cutBelow={872} />
      ))}
    </Shot>
  );
};

// ------------------------------------------------------------ S06-09 Congress → newspaper
const Congress: React.FC<{f: number}> = ({f}) => {
  const t = f - T[8];
  const rise = prog(t, 30, 50);
  return (
    <Shot f={f} bg="#B8A88A" keys={ck([T[8], 1.0, 960, 540], [1450, 1.06, 960, 540], [1490, 1.3, 2560, 560], [T[9], 1.34, 2560, 560])}>
      <Interior wall="#B8A88A" floor="#6A4A32" floorY={760} />
      <rect x={1950} y={-200} width={1300} height={1500} fill="#5A3E2A" />
      <Flag x={600} y={560} f={f} kind="us" w={150} h={90} pole={360} seed={1} />
      <Flag x={1300} y={560} f={f} kind="us" w={150} h={90} pole={360} seed={2} />
      <rect x={830} y={540} width={260} height={220} fill="#6A4A32" stroke={C.ink} strokeWidth={5} />
      <Microphone x={910} y={430} s={0.7} />
      <Microphone x={1010} y={430} s={0.7} />
      <Fig k="roosevelt" x={960} y={620} f={f} pose={talkGesture(f, 2)} expr="determined" talking={f < b.endOf(7)} tag />
      <Crowd f={f} count={30} x0={60} x1={1860} yBack={880} yFront={1060} scaleBack={0.7} scaleFront={0.9} pool="congress1941" view="back" mix={rise > 0.5 ? {clap: 3, cheer: 1} : {stand: 1}} excitement={rise} seed={8} />
      <g transform={`translate(2560,600) rotate(-4)`}>
        <Newspaper w={540} h={420} headline="GERMANY DECLARES WAR" sub="ON THE UNITED STATES" masthead="THE EVENING STAR" date="11 DECEMBER 1941" />
      </g>
    </Shot>
  );
};

// ------------------------------------------------------------ S06-10 a global war
const Global: React.FC<{f: number}> = ({f}) => {
  const t = f - T[9];
  const lon = lerp(10, 150, prog(t, 0, 220));
  const labels: [string, [number, number], number][] = [['EUROPE', HOTSPOTS.Europe, 1672], ['AFRICA', HOTSPOTS['North Africa'], 1690], ['ASIA', HOTSPOTS.Asia, 1706], ['THE PACIFIC', HOTSPOTS.Pacific, 1724]];
  return (
    <Shot f={f} bg={C.deepNavy} vignette={0.5}>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={C.deepNavy} />
      <Globe f={f} lon={lon} lat={25} r={lerp(440, 400, prog(t, 0, 220))} cy={500}>
        {({proj}) => (
          <g>
            {labels.map(([lab, at, fr], i) => (
              <GlobeHotspot key={i} proj={proj} at={at} f={f - fr} label={f >= fr ? lab : undefined} />
            ))}
          </g>
        )}
      </Globe>
    </Shot>
  );
};

export const S06Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: T[0], to: T[1], el: <Dawn f={f} />},
      {from: T[1], to: T[2], el: <FrontMap f={f} />},
      {from: T[2], to: T[3], el: <Village f={f} />, trans: 'cut'},
      {from: T[3], to: T[4], el: <Moscow f={f} />},
      {from: T[4], to: T[5], el: <Asia41 f={f} />, trans: 'wipe'},
      {from: T[5], to: T[6], el: <Pearl f={f} />, trans: 'cut'},
      {from: T[6], to: T[7], el: <Oahu f={f} />, trans: 'cut'},
      {from: T[7], to: T[8], el: <Mourn f={f} />},
      {from: T[8], to: T[9], el: <Congress f={f} />},
      {from: T[9], to: T[10], el: <Global f={f} />, trans: 'iris'},
    ]}
  />
);

export const S06Overlay: React.FC = () => (
  <g>
    <DateCard at={78} until={T[1] - 4} date="22 JUNE 1941" title="OPERATION BARBAROSSA" sub="Germany invades the Soviet Union" />
    <FactPill at={T[1] + 10} until={T[2] - 4} text="MORE THAN 3 MILLION AXIS SOLDIERS" x={1880} y={150} anchor="end" />
    <FactPill at={b.at(1) + 94} until={T[2] - 4} text="A FRONT NEARLY 3,000 KM LONG" x={1880} y={250} anchor="end" />
    <TermCard at={T[2] + 12} until={T[3] - 4} term="EASTERN FRONT" meaning="The war between Germany and its allies and the Soviet Union, 1941–45" />
    <FactPill at={745} until={T[4] - 4} text="DECEMBER 1941: THE RED ARMY STRIKES BACK" x={1880} y={330} anchor="end" />
    <DateCard at={T[5] + 8} until={T[6] - 2} date="7 DECEMBER 1941" title="PEARL HARBOR" sub="Hawaii" />
    <FactPill at={T[6] + 6} until={T[7] - 4} text="OAHU'S AIRFIELDS WERE ATTACKED TOO" x={1880} y={330} anchor="end" />
    <FactPill at={T[7] + 6} until={T[8] - 4} text="MORE THAN 2,400 AMERICANS KILLED" x={W / 2} y={300} anchor="middle" color="#E9E6DE" />
    <DateCard at={T[8] + 8} until={T[9] - 4} date="DECEMBER 1941" title="UNITED STATES ENTERS THE WAR" />
  </g>
);
