// s03 — Chapter 2: Hitler's Rise to Power (90-150 s). Storyboard S03-01 … S03-10.
// Symbol policy: plain dark-red banners and armbands, no emblems; propaganda labelled; Hitler at eye level, tagged.
import React from 'react';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack, SplitPanels, Camera} from '../components/Camera';
import {Sky, Ground, Clouds, Interior, Table, Chair, Building, Street, Document, Hills} from '../components/Environment';
import {Smoke, Particles} from '../components/Effects';
import {Plane} from '../components/Vehicles';
import {PosterWall, Factory, Reichstag} from '../components/env/Places';
import {MapCzech, czechHighlights} from '../maps/EpisodeMaps';
import {WallMap} from '../maps/MapKit';
import {GeoMap, MapArrow, MapLabel, camLerp, growArrow} from '../maps/GeoMap';
import {GERMANY_1937, RHINELAND, CITY} from '../maps/geo';
import {walk, stand, talkGesture, fistShake, mixPose, seated, signDocument, paperWave, waveSide, point, standStiff, holdFront} from '../characters/poses';
import {Handshake} from '../characters/interactions';
import {Crowd} from '../characters/Crowd';
import {castProps, CAST} from '../characters/cast';
import {NameTag} from '../characters/StickFigure';
import {handWorld} from '../characters/skeleton';
import {Pen, PaperSheet, FlyingPaper} from '../characters/props';
import {DateCard, FactPill, TermCard, Stamp} from '../components/Text';
import {prog, clamp, lerp, easeOut} from '../animations/core';
import {sec, Fig, Walker, Shot, ck, PlainBanner, fio} from './kit';

const {b, cut} = sec('s03');
const T = [0, cut(1), cut(2), cut(3), cut(4), cut(5), cut(6), cut(8), 1440, cut(10), 1800];

// ------------------------------------------------------------ S03-01 meeting hall
const Hall: React.FC<{f: number}> = ({f}) => {
  const pose = f < 90 ? talkGesture(f, 1) : mixPose(talkGesture(f, 1), fistShake(f), prog(f, 90, 100));
  return (
    <Shot f={f} bg="#4A3E36" keys={ck([0, 1.0, 960, 560], [T[1], 1.08, 960, 540])}>
      <Interior wall="#5E5048" floor="#4A3A2E" floorY={760} />
      {[260, 620, 1170, 1530].map((x, i) => (
        <PlainBanner key={i} x={x} y={90} f={f} seed={i} />
      ))}
      <rect x={560} y={640} width={800} height={120} fill="#6A4A32" stroke={C.ink} strokeWidth={5} />
      <rect x={890} y={560} width={140} height={90} fill="#5A3E2A" stroke={C.ink} strokeWidth={4} />
      <Fig k="hitler" x={960} y={650} f={f} s={1.0} pose={pose} expr={f < 90 ? 'determined' : 'angry'} talking tag />
      <Smoke x={960} y={500} f={f} n={8} size={140} color="#8A7E70" opacity={0.18} rise={0.3} drift={0.2} seed={3} outline={false} />
      <Crowd f={f} count={34} x0={80} x1={1840} yBack={880} yFront={1060} scaleBack={0.75} scaleFront={0.95} pool="germany1930s" view="back" mix={{cheer: 2, stand: 3}} excitement={0.7} seed={5} />
    </Shot>
  );
};

// ------------------------------------------------------------ S03-02 poster wall (labelled propaganda)
const Posters: React.FC<{f: number}> = ({f}) => {
  const t = f - T[1];
  const shown = clamp(t / 40, 0, 6);
  const leave = prog(t, 150, 175);
  return (
    <Shot f={f} bg="#C9C2B4" keys={ck([T[1], 1.08, 820, 520], [T[2], 1.08, 1120, 520])}>
      <PosterWall f={f} shown={shown} n={6} />
      <Walker k="man2" f={t} x0={1700} speed={-1.6} y={930} expr="neutral" />
      <Fig k="worker" x={700} y={925} f={f} pose={stand(f, 2)} expr="neutral" look={[0, -1]} turn={0.6} />
      <Fig k="woman1" x={1500} y={935} f={f} pose={{...stand(f, 4), headTilt: 6 * Math.sin(f / 10)}} expr="neutral" look={[0.4, -1]} />
      <Fig k="anna" x={leave > 0 ? 1100 - (t - 150) * 3 : 1100} y={930} f={f} dir={leave > 0 ? -1 : 1} pose={leave > 0 ? walk(t / 22) : stand(f, 5)} expr="worried" />
      <Fig k="leo" x={leave > 0 ? 1160 - (t - 150) * 3 : 1160} y={935} f={f} dir={leave > 0 ? -1 : 1} pose={leave > 0 ? walk(t / 16) : stand(f, 6)} expr="worried" look={[0.3, -1]} />
    </Shot>
  );
};

// ------------------------------------------------------------ S03-03 the Chancellorship
const Office: React.FC<{f: number}> = ({f}) => {
  const t = f - T[2];
  return (
    <Shot f={f} bg="#6E5A44" keys={ck([T[2], 1.0, 1100, 560], [T[3], 1.08, 1180, 580])}>
      <Interior wall="#7A6248" floor="#5A4434" floorY={800} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={-100 + i * 300} y={180} width={240} height={420} fill="none" stroke="#5A4434" strokeWidth={6} />
      ))}
      <rect x={1500} y={200} width={8} height={70} fill={C.ink} />
      <circle cx={1504} cy={290} r={34} fill="#E8E0CC" stroke={C.ink} strokeWidth={5} />
      <line x1={1504} y1={290} x2={1504 + 20 * Math.sin(f / 6)} y2={290 - 20 * Math.cos(f / 6)} stroke={C.ink} strokeWidth={3} />
      <Table x={980} y={790} w={260} />
      <Handshake f={f} x={1280} y={900} scale={1.15} start={T[2] + 30} a={{...castProps('hindenburg'), head: {...castProps('hindenburg').head, expression: 'neutral'}}} b={{...castProps('hitler'), head: {...castProps('hitler').head, expression: 'smug'}}} />
      <g transform={`translate(${lerp(1180, 1250, prog(t, 0, 25))},${lerp(720, 700, prog(t, 0, 25))}) scale(0.35)`} opacity={1 - prog(t, 28, 34)}>
        <Document x={-100} y={-140} title="APPOINTMENT" />
      </g>
    </Shot>
  );
};

// ------------------------------------------------------------ S03-04 tracking: parties banned → press → dictatorship
const Crackdown: React.FC<{f: number}> = ({f}) => {
  const t = f - T[3];
  const pressRun = 1 - prog(f, 649, 700);
  const shutter = prog(f, 660, 680);
  const lock = prog(f, 590, 615);
  const lights = 0.6 * (1 - prog(f, 700, 735));
  return (
    <Shot f={f} bg="#8D969A" keys={ck([T[3], 1.0, 960, 540], [620, 1.0, 1100, 540], [655, 1.0, 2650, 540], [690, 1.0, 2700, 540], [715, 1.0, 4300, 520], [T[4], 1.02, 4350, 520])}>
      {/* party office */}
      <Sky top="#8D969A" bottom="#CFCBC0" />
      <rect x={-200} y={-200} width={5600} height={900} fill="#A9B2B4" />
      <Building x={300} base={800} w={900} h={520} color="#A59E90" seed={11} roof="flat" door={false} />
      <rect x={640} y={560} width={220} height={240} fill="#5A4434" stroke={C.ink} strokeWidth={5} />
      <rect x={668} y={520} width={164} height={34} fill="#F4EBD6" stroke={C.ink} strokeWidth={3} />
      <text x={750} y={545} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={20} fill={C.ink}>PARTY OFFICE</text>
      <g opacity={lock}>
        <line x1={640} y1={690} x2={860} y2={690} stroke="#3A3A3A" strokeWidth={10} />
        <rect x={738} y={680 + (1 - lock) * 20} width={28} height={30} rx={4} fill="#B8A050" stroke={C.ink} strokeWidth={3} />
      </g>
      <Ground y={800} color="#9A958A" />
      <rect x={-200} y={800} width={5600} height={400} fill="#9A958A" />
      <Fig k="partyMember" x={560 + Math.min(t, 40) * 2} y={900} f={f} s={1.1} pose={t < 40 ? walk(t / 18) : point(f, 80)} expr="angry" />
      <Fig k="partyMember" x={930} y={905} f={f} s={1.1} dir={-1} pose={stand(f, 2)} expr="neutral" />
      {/* newspaper office + press */}
      <Building x={1900} base={800} w={1500} h={560} color="#958C7E" seed={13} roof="flat" door={false} windows={false} />
      <rect x={2050} y={330} width={1200} height={470} fill="#6E6860" stroke={C.ink} strokeWidth={5} />
      <rect x={2050} y={330 + shutter * 0} width={1200} height={470 * shutter} fill="#8A8A86" stroke={C.ink} strokeWidth={5} />
      {shutter > 0 && Array.from({length: Math.floor(shutter * 12)}).map((_, i) => <line key={i} x1={2050} y1={340 + i * 38} x2={3250} y2={340 + i * 38} stroke="#5A5A56" strokeWidth={3} />)}
      {shutter < 1 && (
        <g>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${2300 + i * 260},${640}) rotate(${(f * 12 * pressRun) % 360})`}>
              <circle r={70} fill="#4A4A48" stroke={C.ink} strokeWidth={5} />
              <line x1={-70} y1={0} x2={70} y2={0} stroke="#2A2A2A" strokeWidth={5} />
            </g>
          ))}
          <rect x={2200} y={560} width={700} height={14} fill="#F4EBD6" stroke={C.ink} strokeWidth={2} />
          <Fig k="worker" x={3050} y={800} f={f} s={0.9} pose={pressRun > 0.5 ? holdFront(f, 1) : walk(f / 20)} expr="worried" dir={1} />
        </g>
      )}
      <text x={2650} y={300} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={40} fill={C.ink}>NEWSPAPER</text>
      {/* Reichstag */}
      <g transform="translate(3400,0)">
        <Reichstag f={f} lit={lights} street={false} base={800} />
      </g>
    </Shot>
  );
};

// ------------------------------------------------------------ S03-05 map: Nazi ideology (intent arrows)
const Ideology: React.FC<{f: number}> = ({f}) => {
  const t = f - T[4];
  const cam = camLerp({lon: 13, lat: 51, zoom: 1.5}, {lon: 15, lat: 51, zoom: 1.2}, prog(t, 0, 130));
  const dirs: [number, number][][] = [
    [[13, 51], [19, 51.5], [26, 52]],
    [[13, 51], [16, 48.5], [20, 46.5]],
    [[10.5, 52.5], [7, 54], [4, 55]],
    [[13, 52], [16, 55], [19, 57]],
  ];
  return (
    <Shot f={f} bg="#9DBCC4">
      <GeoMap kind="europe" cam={cam} f={f} highlights={[{feature: GERMANY_1937, fill: C.axis, opacity: 0.85, pulse: 1}]}>
        {({toScreen}) => (
          <g>
            {dirs.map((d, i) => (
              <MapArrow key={i} pts={d.map(toScreen)} progress={growArrow(t, 10 + i * 12, 50 + i * 12)} color={C.axisDark} width={22} dashed opacity={0.55 + 0.35 * Math.sin(f / 8 + i)} />
            ))}
            <MapLabel at={toScreen([10.5, 51.2])} text="GERMANY" size={38} color="#fff" stroke="rgba(0,0,0,0.6)" />
          </g>
        )}
      </GeoMap>
    </Shot>
  );
};

// ------------------------------------------------------------ S03-06 split: persecution | rearmament
const Split: React.FC<{f: number}> = ({f}) => {
  const t = f - T[5];
  const shut = prog(t, 20, 45);
  const go = Math.max(0, t - 55);
  const left = (
    <Camera f={f} keys={ck([T[5], 1.0, 480, 560], [T[6], 1.05, 520, 560])} drift={1}>
      <Sky top="#8D969A" bottom="#CFCBC0" />
      <Street base={800} seed={21} f={f} x0={-200} x1={1000} />
      <rect x={180} y={520} width={360} height={280} fill="#3A3634" />
      <rect x={180} y={520} width={360} height={280 * shut} fill="#8A8A86" stroke={C.ink} strokeWidth={4} />
      <Ground y={800} color="#9A958A" />
      <Fig k="man2" x={330 - go * 2.2} y={910} f={f} dir={-1} pose={go > 0 ? walk(go / 22, 0.7) : stand(f, 1)} expr="sad" holdR={<rect x={-10} y={-10} width={60} height={42} rx={4} fill="#6A4A32" stroke={C.ink} strokeWidth={3} />} />
      <Fig k="woman3" x={430 - go * 2.2} y={915} f={f} dir={-1} pose={go > 0 ? walk(go / 22 + 0.5, 0.7) : stand(f, 2)} expr="sad" />
      <Fig k="kid2" x={520 - go * 2.2} y={920} f={f} dir={-1} pose={go > 0 ? walk(go / 16, 0.7) : stand(f, 3)} expr="worried" />
    </Camera>
  );
  return (
    <Shot f={f} bg="#222" drift={0.5}>
      <SplitPanels id="s0306" reveal={prog(t, 0, 18)} panels={[{x0: -10, x1: 960, node: left}, {x0: 960, x1: 1930, node: <g transform="translate(480,0)"><Camera f={f} keys={ck([T[5], 1.0, 960, 560], [T[6], 1.06, 960, 560])}><Factory f={f} kind="tank" speed={1.2} /></Camera></g>}]} />
    </Shot>
  );
};

// ------------------------------------------------------------ S03-07 map: Rhineland → Austria
const Expansion: React.FC<{f: number}> = ({f}) => {
  const t = f - T[6];
  const b7 = b.at(7) - T[6];
  const cam = camLerp({lon: 8.5, lat: 50.6, zoom: 2.1}, {lon: 13.5, lat: 48.6, zoom: 2.0}, prog(t, b7 - 30, b7 + 20));
  const aus = prog(t, b7 + 10, b7 + 50);
  return (
    <Shot f={f} bg="#9DBCC4">
      <GeoMap
        kind="europe"
        cam={cam}
        f={f}
        highlights={[
          {feature: GERMANY_1937, fill: C.axis, opacity: 0.85},
          {feature: RHINELAND, fill: C.axisDark, opacity: 0.6 * prog(t, 10, 30), hatch: true},
          {name: 'Austria', fill: C.axis, opacity: 0.85 * aus, stroke: aus > 0 && aus < 1 ? C.red : undefined},
          {name: 'Austria', fill: '#E3C77A', opacity: 0.6 * (1 - aus)},
        ]}
      >
        {({toScreen}) => (
          <g>
            {[[[8.8, 51.6], [7.2, 51.0]], [[9.0, 50.3], [7.3, 50.0]], [[9.2, 49.4], [7.6, 49.3]]].map((p, i) => (
              <MapArrow key={i} pts={(p as [number, number][]).map(toScreen)} progress={growArrow(t, 25 + i * 8, 65 + i * 8)} color={C.axisDark} width={20} />
            ))}
            <MapLabel at={toScreen([7.0, 50.6])} text="RHINELAND" size={30} opacity={prog(t, 20, 35)} />
            <MapArrow pts={[CITY.Munich, [14.0, 48.3], CITY.Vienna].map((p) => toScreen(p as [number, number]))} progress={growArrow(t, b7 + 5, b7 + 45)} color={C.axisDark} width={22} />
            <MapLabel at={toScreen([14.3, 47.4])} text="AUSTRIA" size={32} opacity={prog(t, b7 - 10, b7 + 10)} />
          </g>
        )}
      </GeoMap>
    </Shot>
  );
};

// ------------------------------------------------------------ S03-08 Munich conference
const Munich: React.FC<{f: number}> = ({f}) => {
  const t = f - T[7];
  const leaders: [string, number][] = [['chamberlain', 420], ['daladier', 700], ['hitler', 1000], ['mussolini', 1280]];
  const tagAt = (i: number) => 10 + i * 22;
  return (
    <Shot f={f} bg="#7A6248" keys={ck([T[7], 1.12, 700, 600], [T[8], 1.12, 1180, 600])}>
      <Interior wall="#8A7458" floor="#5A4434" floorY={820} />
      <WallMap x={760} y={150} w={520} kind="europe" cam={{lon: 15.8, lat: 49.6, zoom: 2.0}} f={f} highlights={czechHighlights(1)} id="munich" />
      <Table x={250} y={830} w={1400} cloth="#3E6B4A" h={90} />
      {leaders.map(([k, x], i) => {
        const sg = signDocument(f + i * 20, {start: 0});
        const signing = t > 70 && i !== 2;
        const pose = k === 'hitler' ? (t < 70 ? point(f, 70) : standStiff(f, 2)) : signing ? sg.pose : standStiff(f, i);
        return (
          <g key={k}>
            <Fig k={k} x={x} y={900} f={f} pose={pose} expr={k === 'hitler' ? 'smug' : k === 'chamberlain' ? 'neutral' : 'neutral'} dir={k === 'hitler' ? -1 : 1} overlayFront={signing ? (sk) => <Pen x={sk.armR.hx} y={sk.armR.hy} /> : undefined} />
            <NameTag x={x} y={560} text={CAST[k].label ?? ''} sub={CAST[k].sublabel} opacity={prog(t, tagAt(i), tagAt(i) + 10)} />
          </g>
        );
      })}
      <Chair x={1560} y={900} dir={-1} />
      <rect x={1520} y={770} width={90} height={50} fill="#F4EBD6" stroke={C.ink} strokeWidth={3} />
      <text x={1565} y={802} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={12} fill={C.ink}>CZECHOSLOVAKIA</text>
    </Shot>
  );
};

// ------------------------------------------------------------ S03-09 airfield: "It didn't work."
const Airfield: React.FC<{f: number}> = ({f}) => {
  const rel = b.at(9) + 4;
  const pl = {x: 900, y: 880, scale: 1.15, dir: 1 as const};
  const pw = paperWave(Math.min(f, rel));
  const hw = handWorld(pl, paperWave(rel), 'R');
  const quiet = prog(f, rel, rel + 25);
  return (
    <Shot f={f} bg="#AFCFD6" keys={ck([T[8], 1.0, 900, 560], [rel, 1.05, 900, 540], [T[9], 1.12, 1100, 420])}>
      <Sky top="#9FC0CC" bottom="#E6E2D0" />
      <Clouds f={f} n={4} seed={9} speed={0.4 + quiet * 1.5} yMin={60} yMax={260} />
      <Hills y={700} color="#9DB07A" seed={4} />
      <Ground y={720} color="#B8B79A" />
      <Plane x={420} y={640} f={f} kind="airliner" s={2.2} door gear prop={false} />
      <Crowd f={f} count={26} x0={1150} x1={1850} yBack={800} yFront={960} scaleBack={0.55} scaleFront={0.85} pool="britain1938" mix={{cheer: 3, wave: 2}} excitement={1 - quiet} expression={quiet > 0.5 ? 'neutral' : 'happy'} seed={4} />
      <Fig k="chamberlain" x={pl.x} y={pl.y} f={f} s={pl.scale} pose={pw} expr={quiet > 0.3 ? 'worried' : 'happy'} holdR={f < rel ? <PaperSheet flutter={1} /> : undefined} tag />
      {f >= rel && <FlyingPaper f={f} start={rel} x0={hw.x} y0={hw.y} wind={[8, -6]} scale={1.3} />}
    </Shot>
  );
};

// ------------------------------------------------------------ S03-10 map: the Czech lands occupied
const Czech: React.FC<{f: number}> = ({f}) => {
  const t = f - T[9];
  const stage = 1 + prog(t, 20, 70);
  const cam = camLerp({lon: 15.4, lat: 49.8, zoom: 1.6}, {lon: 14.6, lat: 50.0, zoom: 2.2}, prog(t, 0, 230));
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapCzech f={f} stage={stage} cam={cam} />
    </Shot>
  );
};

export const S03Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: T[0], to: T[1], el: <Hall f={f} />},
      {from: T[1], to: T[2], el: <Posters f={f} />, trans: 'cut'},
      {from: T[2], to: T[3], el: <Office f={f} />},
      {from: T[3], to: T[4], el: <Crackdown f={f} />, trans: 'cut'},
      {from: T[4], to: T[5], el: <Ideology f={f} />},
      {from: T[5], to: T[6], el: <Split f={f} />, trans: 'wipe'},
      {from: T[6], to: T[7], el: <Expansion f={f} />, trans: 'cut'},
      {from: T[7], to: T[8], el: <Munich f={f} />},
      {from: T[8], to: T[9], el: <Airfield f={f} />, trans: 'cut'},
      {from: T[9], to: T[10], el: <Czech f={f} />},
    ]}
  />
);

export const S03Overlay: React.FC = () => (
  <g>
    <Stamp at={b.at(1) + 30} until={T[2] - 4} text="NAZI PROPAGANDA" x={1450} y={180} rot={-8} size={58} />
    <DateCard at={T[2] + 8} until={T[3] - 4} date="1933" title="HITLER BECOMES CHANCELLOR" sub="30 January 1933" />
    <Stamp at={590} until={T[4] - 2} text="RIVAL PARTIES BANNED" x={600} y={190} rot={-6} size={50} />
    <Stamp at={655} until={T[4] - 2} text="FREE PRESS CRUSHED" x={1000} y={300} rot={5} size={50} />
    <Stamp at={712} until={T[4] - 2} text="DICTATORSHIP" x={1400} y={190} rot={-8} size={56} />
    <TermCard at={T[4] + 10} until={T[5] - 4} term="ANTISEMITISM" meaning="Hostility to, prejudice against or hatred of Jewish people" />
    <FactPill at={T[5] + 12} until={T[6] - 4} text="JEWISH GERMANS STRIPPED OF THEIR RIGHTS" x={480} y={120} anchor="middle" size={34} maxW={800} />
    <FactPill at={925} until={T[6] - 4} text="REARMAMENT" x={1440} y={120} anchor="middle" />
    <DateCard at={T[6] + 12} until={b.at(7) - 6} date="1936" title="RHINELAND REOCCUPIED" />
    <DateCard at={b.at(7)} until={T[7] - 4} date="1938" title="AUSTRIA ANNEXED" sub="March 1938" />
    <DateCard at={T[7] + 6} until={T[8] - 4} date="1938" title="MUNICH AGREEMENT" sub="Germany, Britain, France and Italy sign" />
    <FactPill at={1340} until={T[8] - 4} text="CZECHOSLOVAKIA NOT INVITED" x={1880} y={560} anchor="end" />
    <DateCard at={T[9] + 10} until={1735} date="MARCH 1939" title="GERMANY OCCUPIES THE CZECH LANDS" />
    <TermCard at={1660} until={1792} term="APPEASEMENT" meaning="Giving in to an aggressor's demands to avoid war" />
    <Stamp at={1705} until={1792} text="FAILED" x={1560} y={250} rot={-10} size={70} />
  </g>
);
