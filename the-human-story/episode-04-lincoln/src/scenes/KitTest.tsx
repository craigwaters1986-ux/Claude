// Kit test reel (composition `KitTest`, input prop `debug` draws the contact overlay): every shared kit piece of
// the kit build in motion — horse + rider, ox wagon, flatboat poling, flag halyard, the US maps (1816–1865),
// the Capitol in 1847 / 1861 / 1865, hall, gaslit street and the funeral train. Poses come from kitSolve.ts.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Shots, ShotDef, Frame} from '../kit/Shots';
import {Person, CAST} from '../kit/Cast';
import {CineCam, CineDefs, GradeLayer, Grain, Vig, LightPool} from '../kit/Cinema';
import {GripDebug} from '../kit/Props';
import {SkyGrad, Ridge, TreeRow, Clearing, HouseFront} from '../kit/Sets04';
import {ChannelLogo} from '../components/ChannelLogo';
import {loadFonts} from '../components/Fonts';
import {FONT} from '../styles/theme';
import {prog} from '../animations/core';
import * as M from '../kit/USMap';
import {Quad, Reins, Wagon, Yoke} from '../kit/Horse';
import {Flatboat, Pole, RiverBed, RiverWater, RiverBank, MistBand} from '../kit/Flatboat';
import {FlagPole, Flag1861} from '../kit/Flag';
import {Capitol, Crowd, HallBack, Stage, Lectern, Benches, GaslitStreet, Train, Track, STAGE_H} from '../kit/Sets04b';
import {Stars} from '../kit/Places';
import * as K from './kitSolve';
import type {KFig} from './kitSolve';

loadFonts();
const castS = (id: string) => CAST[id].scale ?? 1;
const Fig: React.FC<{g: KFig; f: number; seed?: number; shadow?: boolean}> = ({g, f, seed = 1, shadow = false}) => (
  <Person id={g.id} x={g.pl.x} y={g.pl.y} scale={(g.pl.scale ?? 1) / castS(g.id)} dir={g.pl.dir} pose={g.P} f={f} seed={seed} shadow={shadow} />
);
const Label: React.FC<{text: string; f: number}> = ({text, f}) => (
  <g opacity={prog(f, 2, 10)}>
    <rect x={1880 - text.length * 13 - 70} y={36} width={text.length * 13 + 50} height={46} rx={8} fill="rgba(11,11,13,0.7)" />
    <text x={1860} y={67} textAnchor="end" fontFamily={FONT.sans} fontWeight={700} fontSize={22} fill="#F4EBD6">{text}</text>
  </g>
);
const Look: React.FC<{f: number; grade: Parameters<typeof GradeLayer>[0]['grade']}> = ({f, grade}) => (
  <><GradeLayer grade={grade} /><Vig amount={0.45} /><Grain f={f} /></>
);
type P = {f: number; d: number; debug: boolean};

// ---------------------------------------------------------------- moving kit
const Ride: React.FC<P> = ({f, debug}) => {
  const s = K.solveRide(f);
  const r = s.r;
  return (
    <Frame bg="#E9B872">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={3}>
        {(layer) => [
          layer(0.15, <SkyGrad time="day" id="rsky" />),
          layer(0.4, <Ridge y={640} color="#B8B08A" seed={4} amp={60} />, 2),
          layer(0.7, <HouseFront floor={K.RIDE_GROUND - 40} doorX={1300} lit={0} />),
          layer(1, (
            <g>
              <Clearing y={K.RIDE_GROUND} color="#B8A27A" />
              <Quad rig={r.rig} pl={r.horsePl} f={f} saddle saddlebags />
              <Fig g={s.figs[0]} f={f} seed={4} />
              <Reins r={r} />
              {debug && <GripDebug items={s.checks} />}
            </g>
          )),
        ]}
      </CineCam>
      <Look f={f} grade="day" />
      <Label text="KIT · rideHorse (planted hooves, hip on saddle, hands on reins)" f={f} />
    </Frame>
  );
};
const WagonShot: React.FC<P> = ({f, debug}) => {
  const s = K.solveWagon(f);
  const w = s.w;
  return (
    <Frame bg="#E9B872">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={5}>
        {(layer) => [
          layer(0.15, <SkyGrad time="golden" id="wsky2" />),
          layer(0.5, <TreeRow y={700} f={f} n={9} s={1} color="#7A7A40" seed={4} />, 2),
          layer(1, (
            <g>
              <Clearing y={K.WAGON_GROUND} />
              <Quad rig={w.team[1].rig} pl={w.team[1].pl} f={f} dark="#5E4E3A" coat="#7E6A50" />
              <Wagon pl={w.wagonPl} d={s.d} cover />
              <Fig g={s.figs[0]} f={f} seed={6} />
              <Yoke team={w.team} hitch={w.hitch} />
              <Quad rig={w.team[0].rig} pl={w.team[0].pl} f={f} />
              {debug && <GripDebug items={s.checks} />}
            </g>
          )),
        ]}
      </CineCam>
      <Look f={f} grade="golden" />
      <Label text="KIT · ox wagon (wagonRig) + seated driver" f={f} />
    </Frame>
  );
};
const Boat: React.FC<P> = ({f, debug}) => {
  const s = K.solveFlatboat(f);
  const o = K.BOAT_OPTS;
  const p = s.p;
  return (
    <Frame bg="#9AB0CC">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={7}>
        {(layer) => [
          layer(0.12, <SkyGrad time="dawn" id="bsky" />),
          layer(0.45, <RiverBank f={f} y={620} />, 2),
          layer(0.6, <MistBand f={f} y={630} op={0.45} />),
          layer(1, (
            <g>
              <RiverBed f={f} bed={o.bedY} y0={o.waterY} />
              <Flatboat pl={p.boat} f={f} />
              <Fig g={s.figs[0]} f={f} seed={8} />
              <Pole out={p} />
              <RiverWater f={f} y0={o.waterY} bed={o.bedY} />
              {debug && <GripDebug items={s.checks} />}
            </g>
          )),
          layer(1.3, <MistBand f={f} y={760} op={0.25} seed={3} />),
        ]}
      </CineCam>
      <Look f={f} grade="dawn" />
      <Label text="KIT · polePushFlatboat (tip planted on the bed, walking the deck)" f={f} />
    </Frame>
  );
};
const FlagShot: React.FC<P> = ({f, debug}) => {
  const s = K.solveFlag(f);
  return (
    <Frame bg="#4A5A84">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={9}>
        {(layer) => [
          layer(0.15, <SkyGrad time="dusk" id="fsky" />),
          layer(1, (
            <g>
              <rect x={-800} y={860} width={3600} height={500} fill="#6A6A5A" />
              <rect x={-800} y={700} width={3600} height={160} fill="#8A7A62" stroke="#151515" strokeWidth={5} />
              <FlagPole out={s.out} f={f} />
              <Fig g={s.figs[0]} f={f} seed={10} />
              {debug && <GripDebug items={s.checks} />}
            </g>
          )),
        ]}
      </CineCam>
      <Look f={f} grade="dusk" />
      <Label text="KIT · raiseFlag (up, then reversed: down)" f={f} />
    </Frame>
  );
};

// ---------------------------------------------------------------- maps
const MapFrame: React.FC<{f: number; d: number; label: string; view: M.ViewName; children: (proj: ReturnType<typeof M.usProjection>) => React.ReactNode}> = ({f, d, label, view, children}) => {
  const proj = M.usProjection(view);
  return (
    <Frame bg={M.MAPC.sea}>
      <CineCam f={f} keys={[[0, 1.0, 960, 480], [d, 1.05, 960, 470]]}>{(layer) => [layer(1, <g>{children(proj)}</g>)]}</CineCam>
      <Vig amount={0.35} />
      <Label text={label} f={f} />
    </Frame>
  );
};
const MapKY: React.FC<P> = ({f, d}) => (
  <MapFrame f={f} d={d} view="KY_IN_IL" label="MAP · Kentucky–Indiana–Illinois, 1816 (Ohio River approx.)">
    {(proj) => (
      <g>
        <M.USMap proj={proj} f={f} year={1816.96} id="ky" rivers={{ohio: 1, mississippi: 1}} states={{KY: {fill: '#E3C77A', t: 1}, IN: {fill: '#B9C79A', t: 1}}} />
        <M.StateLabel proj={proj} code="KY" text="Kentucky" />
        <M.StateLabel proj={proj} code="IN" text="Indiana" />
        <M.StateLabel proj={proj} code="IL" text="Illinois Territory" size={24} year={1816.96} />
        <M.PlaceDot proj={proj} at={M.PLACES.KnobCreek} label="Knob Creek" side="right" t={prog(f, 5, 20)} />
        <M.RouteLine proj={proj} pts={M.MOVE_1816} t={prog(f, 20, 80)} icon="wagon" />
        <M.PlaceDot proj={proj} at={M.PLACES.PigeonCreek} label="Little Pigeon Creek" side="above" t={prog(f, 70, 85)} />
      </g>
    )}
  </MapFrame>
);
const MapRiver: React.FC<P> = ({f, d}) => (
  <MapFrame f={f} d={d} view="RIVER_ROUTE" label="MAP · flatboat route to New Orleans, 1828">
    {(proj) => (
      <g>
        <M.USMap proj={proj} f={f} year={1828} id="riv" rivers={{ohio: 1, mississippi: 1}} />
        <M.RouteLine proj={proj} pts={M.FLATBOAT_1828} t={prog(f, 8, 82)} icon="boat" />
        <M.PlaceDot proj={proj} at={M.PLACES.Rockport} label="Rockport" side="right" />
        <M.PlaceDot proj={proj} at={M.PLACES.NewOrleans} label="New Orleans" side="right" t={prog(f, 78, 90)} />
      </g>
    )}
  </MapFrame>
);
const MapIL: React.FC<P> = ({f, d}) => (
  <MapFrame f={f} d={d} view="ILLINOIS" label="MAP · Illinois, the seven 1858 debates">
    {(proj) => (
      <g>
        <M.USMap proj={proj} f={f} year={1858} id="il" rivers={{mississippi: 1, ohio: 1}} states={{IL: {fill: '#E3C77A', t: 1}}} />
        <M.PlaceDot proj={proj} at={M.PLACES.Springfield} label="Springfield" side="left" color="#3F6EA6" />
        {M.DEBATE_TOWNS.map((t, i) => <M.PlaceDot key={t.name} proj={proj} at={t.at} label={`${t.name} · ${t.date}`} side={t.name === 'Charleston' || t.name === 'Ottawa' ? 'right' : 'left'} t={prog(f, 6 + i * 10, 18 + i * 10)} ring={1} f={f} size={26} />)}
      </g>
    )}
  </MapFrame>
);
const MapKN: React.FC<P> = ({f, d}) => (
  <MapFrame f={f} d={d} view="NATION" label="MAP · 1854 Kansas–Nebraska (territories approx.)">
    {(proj) => (
      <g>
        <M.USMap proj={proj} f={f} year={1854.4} id="kn" />
        <M.TerritoryShape proj={proj} pts={M.NEBRASKA_T} id="ne" t={prog(f, 10, 30)} hatch={prog(f, 40, 70)} label="NEBRASKA TERR." />
        <M.TerritoryShape proj={proj} pts={M.KANSAS_T} id="ks" t={prog(f, 10, 30)} hatch={prog(f, 40, 70)} label="KANSAS TERR." size={24} />
      </g>
    )}
  </MapFrame>
);
const Map1860: React.FC<P> = ({f, d}) => (
  <MapFrame f={f} d={d} view="NATION" label="MAP · 1860 free and slave states">
    {(proj) => (
      <g>
        <M.USMap proj={proj} f={f} year={1860.85} id="el" states={Object.fromEntries([...M.FREE_1860.map((c) => [c, {fill: M.MAPC.free, t: prog(f, 10, 40)}]), ...M.SLAVE_1860.map((c) => [c, {fill: M.MAPC.slave, t: prog(f, 10, 40)}])])} />
        <M.Legend x={1400} y={700} t={prog(f, 30, 45)} items={[{fill: M.MAPC.free, label: 'Free states'}, {fill: M.MAPC.slave, label: 'Slave states'}, {fill: M.MAPC.territory, label: 'Territories'}]} />
      </g>
    )}
  </MapFrame>
);
const MapSec: React.FC<P> = ({f, d}) => (
  <MapFrame f={f} d={d} view="SOUTH" label="MAP · secession Dec 1860 – Feb 1861">
    {(proj) => (
      <g>
        <M.USMap proj={proj} f={f} year={1861.05} id="sec" states={Object.fromEntries(M.SECESSION.map((s, i) => [s.code, {fill: M.MAPC.confed, t: prog(f, 6 + i * 10, 16 + i * 10), lift: 8 * prog(f, 6 + i * 10, 16 + i * 10)}]))} />
        {M.SECESSION.map((s, i) => <M.StateLabel key={s.code} proj={proj} code={s.code} text={s.date} size={20} dy={-8 * prog(f, 6 + i * 10, 16 + i * 10)} t={prog(f, 10 + i * 10, 20 + i * 10)} />)}
      </g>
    )}
  </MapFrame>
);
const MapEP: React.FC<P> = ({f, d}) => (
  <MapFrame f={f} d={d} view="SOUTH" label="MAP · Emancipation Proclamation, 1 January 1863">
    {(proj) => (
      <g>
        <M.USMap proj={proj} f={f} year={1863.0} wv="separate" id="ep" states={Object.fromEntries(M.PROCLAMATION_SHADED.map((c) => [c, {fill: M.MAPC.confedDark, t: prog(f, 8, 30), hatch: prog(f, 20, 40)}]))} />
        <M.ExceptedAreas proj={proj} id="ep" t={prog(f, 30, 45)} />
        <M.MapNote text={M.EXCEPTED_NOTE} x={1840} y={860} anchor="end" t={prog(f, 40, 55)} />
      </g>
    )}
  </MapFrame>
);
const MapWar: React.FC<P> = ({f, d}) => (
  <MapFrame f={f} d={d} view="WAR_EAST" label="MAP · Bull Run, Gettysburg, Atlanta, Appomattox">
    {(proj) => (
      <g>
        <M.USMap proj={proj} f={f} year={1864} id="war" states={Object.fromEntries(M.CONFEDERACY.map((c) => [c, {fill: M.MAPC.confed, t: 1}]))} />
        <M.PlaceDot proj={proj} at={M.PLACES.Washington} label="Washington" side="above" color="#3F6EA6" />
        {M.BATTLES.map((b, i) => <M.BattleMarker key={b.name} proj={proj} at={b.at} label={b.name} side={b.name === 'Atlanta' || b.name === 'Gettysburg' ? 'right' : 'left'} t={prog(f, 6 + i * 14, 18 + i * 14)} size={26} />)}
      </g>
    )}
  </MapFrame>
);
const MapFuneral: React.FC<P> = ({f, d}) => {
  const proj = M.usProjection('FUNERAL');
  const t = prog(f, 6, d - 10, (x) => x);
  return (
    <MapFrame f={f} d={d} view="FUNERAL" label="MAP · funeral train route, April–May 1865">
      {() => (
        <g>
          <M.USMap proj={proj} f={f} year={1865.3} id="fun" />
          <M.RouteLine proj={proj} pts={M.FUNERAL_PATH} t={t} icon="train" color="#1E1C22" dashed={false} width={6} />
          {M.FUNERAL_ROUTE.map((p, i) => <M.PlaceDot key={i} proj={proj} at={p} label={M.FUNERAL_STOPS[i]} size={22} dot={8} color="#1E1C22" side={['Baltimore', 'Philadelphia', 'Columbus', 'Indianapolis', 'Springfield'].includes(M.FUNERAL_STOPS[i]) ? 'below' : 'above'} t={prog(t, i / 11 - 0.02, i / 11 + 0.04, (x) => x)} />)}
        </g>
      )}
    </MapFrame>
  );
};

// ---------------------------------------------------------------- sets
const CapitolShot: React.FC<P & {dome: 'bulfinch' | 'unfinished' | 'finished'; year: string}> = ({f, d, dome, year}) => (
  <Frame bg="#9CC4D8">
    <CineCam f={f} keys={[[0, 1.0, 960, 520], [d, 1.06, 960, 510]]} seed={11}>
      {(layer) => [
        layer(0.15, <SkyGrad time={dome === 'finished' ? 'day' : 'dawn'} id={`csky${dome}`} />),
        layer(0.8, <g><rect x={-800} y={800} width={3600} height={400} fill="#7A8A50" /><Capitol x={960} base={800} s={0.9} dome={dome} f={f} /></g>),
        layer(1.2, dome === 'bulfinch' ? <g /> : <Crowd x0={-100} x1={2000} y={930} f={f} rows={3} fromBehind seed={dome === 'finished' ? 7 : 3} />),
      ]}
    </CineCam>
    <Look f={f} grade={dome === 'finished' ? 'day' : 'dawn'} />
    <Label text={`SET · Capitol, ${year} (${dome})`} f={f} />
  </Frame>
);
const HallShot: React.FC<P> = ({f, d}) => (
  <Frame bg="#3A2A1E">
    <CineDefs />
    <CineCam f={f} keys={[[0, 1.0, 960, 560], [d, 1.12, 960, 520]]} seed={12}>
      {(layer) => [
        layer(0.8, <HallBack f={f} floor={860} />, 2),
        layer(1, (
          <g>
            <Stage x={960} floor={860} w={900} />
            <Lectern x={1010} floor={860 - STAGE_H} />
            <Person id="abe1858" x={900} y={860 - STAGE_H} f={f} head={{hat: 'none'}} pose={undefined} />
          </g>
        )),
        layer(1.35, <Benches y={1000} f={f} rows={2} />),
      ]}
    </CineCam>
    <LightPool x={960} y={400} r={800} f={f} color="#FFC070" seed={5} strength={0.25} />
    <Look f={f} grade="lamp" />
    <Label text="SET · hall interior (gaslight, lectern, benches, crowd)" f={f} />
  </Frame>
);
const StreetShot: React.FC<P> = ({f, d}) => (
  <Frame bg="#101A30">
    <CineCam f={f} keys={[[0, 1.0, 900, 540], [d, 1.0, 1020, 540]]} seed={13}>
      {(layer) => [
        layer(1, <GaslitStreet f={f} floor={880} slotX={760} slotW={520} slot={<g><rect x={760} y={360} width={520} height={480} fill="#8A7A6A" stroke="#151515" strokeWidth={5} /><text x={1020} y={620} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={30} fill="#151515">façade slot</text></g>} />),
      ]}
    </CineCam>
    <Look f={f} grade="night" />
    <Label text="SET · gaslit night street with façade slot" f={f} />
  </Frame>
);
const TrainShot: React.FC<P> = ({f, d}) => {
  const x = 300 + f * 4;
  return (
    <Frame bg="#101A30">
      <CineCam f={f} keys={[[0, 1.0, 900, 560], [d, 1.0, 1100, 560]]} seed={14}>
        {(layer) => [
          layer(0.12, <g><SkyGrad time="night" id="tsky" /><Stars f={f} /></g>),
          layer(0.5, <Ridge y={700} color="#1E2A3A" seed={3} amp={40} />),
          layer(1, (
            <g>
              <rect x={-800} y={820} width={3600} height={400} fill="#1E2430" />
              <Track y={820} />
              <Train x={x} y={820} d={f * 4} f={f} cars={3} draped lit={0.6} s={0.9} />
            </g>
          )),
          layer(1.3, <Crowd x0={-300} x1={2400} y={990} f={f} rows={2} fromBehind hats={0.6} seed={9} />),
        ]}
      </CineCam>
      <Look f={f} grade="night" />
      <Label text="SET · funeral train (draped 4-4-0 and cars)" f={f} />
    </Frame>
  );
};
const FlagsRow: React.FC<P> = ({f}) => (
  <Frame bg="#C8907A">
    <SkyGrad time="dusk" id="fr" />
    <rect x={0} y={760} width={1920} height={400} fill="#5E6A3A" />
    {Array.from({length: 9}, (_, i) => <g key={i}><path d={`M${200 + i * 190},${900} V${780}`} stroke="#151515" strokeWidth={4} /><Flag1861 x={200 + i * 190} y={780} w={70} h={44} f={f} seed={i} wind={0.6} /></g>)}
    <Flag1861 x={700} y={200} w={520} h={320} f={f} stars={34} />
    <Label text="KIT · Flag1861 cloth (33 / 34 stars)" f={f} />
  </Frame>
);

const LIST: {d: number; el: React.FC<P>}[] = [
  {d: 160, el: Ride}, {d: 140, el: WagonShot}, {d: K.KIT_SOLVED_SHOTS[2].dur, el: Boat}, {d: 180, el: FlagShot}, {d: 90, el: FlagsRow},
  {d: 90, el: MapKY}, {d: 90, el: MapRiver}, {d: 100, el: MapIL}, {d: 80, el: MapKN}, {d: 70, el: Map1860}, {d: 90, el: MapSec}, {d: 70, el: MapEP}, {d: 80, el: MapWar}, {d: 110, el: MapFuneral},
  {d: 60, el: (p) => <CapitolShot {...p} dome="bulfinch" year="1847" />}, {d: 60, el: (p) => <CapitolShot {...p} dome="unfinished" year="1861" />}, {d: 60, el: (p) => <CapitolShot {...p} dome="finished" year="1865" />},
  {d: 90, el: HallShot}, {d: 90, el: StreetShot}, {d: 120, el: TrainShot},
];
export const KIT_STARTS = LIST.reduce<number[]>((a, s, i) => [...a, i ? a[i - 1] + LIST[i - 1].d : 0], []);
export const KIT_FRAMES = LIST.reduce((a, s) => a + s.d, 0);
export const KitTest: React.FC<{debug?: boolean}> = ({debug = false}) => {
  const shots: ShotDef[] = LIST.map((s, i) => {
    const Comp = s.el;
    return {at: KIT_STARTS[i] / 30, trans: 'cut', el: (f: number, d: number) => <Comp f={f} d={d} debug={debug} />};
  });
  return (
    <AbsoluteFill style={{background: '#0B0B0D'}}>
      <Shots start={0} end={KIT_FRAMES / 30} shots={shots} />
      <ChannelLogo />
    </AbsoluteFill>
  );
};
