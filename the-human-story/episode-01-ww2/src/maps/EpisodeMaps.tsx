// Ready-made animated map shots for Episode 1 (one component per storyboard map shot).
// Each takes the SHOT-LOCAL frame `f` and optional cue overrides (frames, shot-local), so
// the video-editor can snap cues to narration beats.  Data: ./history.ts (sources and
// simplifications: production/environments/ep01-ww2/map-notes.md).
import React from 'react';
import {C} from '../styles/theme';
import {clamp, easeInOut, easeOut, prog, lerp} from '../animations/core';
import {GeoMap, MapArrow, MapLabel, CityMarker, Cam, camLerp, Highlight, Globe} from './GeoMap';
import {CITY, GERMANY_1937, EAST_PRUSSIA, ALSACE_LORRAINE, LOST_TO_POLAND, POLAND_1939, POLAND_GERMAN_ZONE, POLAND_SOVIET_ZONE, MR_LINE_COORDS} from './geo';
import * as HX from './history';
import * as VX from './versailles';
import {FrontLine, LineBracket, pocketHighlight, reichHighlights, CarrierIcon, ParachuteIcon} from './MapKit';

type Cues = Record<string, number>;
const cue = (defaults: Cues, over?: Partial<Cues>) => ({...defaults, ...(over ?? {})}) as Cues;
const camAt = (f: number, a: Cam, b: Cam, f0: number, f1: number) => camLerp(a, b, prog(f, f0, f1, easeInOut));
const fadeTo = (f: number, at: number, d = 15) => prog(f, at, at + d, easeOut);

// Shared palette for map fills
export const MAPC = {
  germany: '#97938A', ussr: '#C98272', sphere: '#E0AFA3', poland: '#D9A6A0', france: C.alliedLight, uk: C.allied, denmark: '#E3C77A',
  belgium: '#C9B26A', lithuania: '#A9B7A6', czech: '#9FB58A', hungary: '#C9A27A', free: '#F2EBDC', japan: C.japan, china: '#D8CDA8', neutral: C.land,
};

// ================================================================ M-01 (S02-04) Germany 1914 → Versailles losses
/** S02-04. Cues: lose0..lose7 (each lost territory flashes red then turns to its new owner), globe (colony inset). */
export const MapVersailles: React.FC<{f: number; cues?: Partial<Cues>; inset?: boolean}> = ({f, cues, inset = true}) => {
  const q = cue({start: 10, stagger: 14, globe: 60, colonies: 80}, cues);
  const cam = camAt(f, {lon: 13.5, lat: 52, zoom: 1.4}, {lon: 13.5, lat: 52, zoom: 1.2}, 0, 200);
  const hl: Highlight[] = [
    {feature: GERMANY_1937, fill: MAPC.germany, opacity: 0.85},
    {feature: EAST_PRUSSIA, fill: MAPC.germany, opacity: 0.85},
  ];
  const outlines: React.ReactNode[] = [];
  VX.LOSSES.forEach((L, i) => {
    const t0 = q.start + i * q.stagger;
    const k = prog(f, t0 + 10, t0 + 30, easeInOut);
    hl.push({feature: L.feature, fill: MAPC.germany, opacity: 0.85 * (1 - k)});
    hl.push({feature: L.feature, fill: L.color, opacity: 0.9 * k, stroke: f > t0 && f < t0 + 34 ? C.red : undefined});
  });
  return (
    <GeoMap kind="europe" cam={cam} f={f} highlights={hl}>
      {({toScreen}) => (
        <g>
          {VX.LOSSES.map((L, i) => {
            const t0 = q.start + i * q.stagger;
            // each label shows while its piece changes hands, then fades (keeps the map legible)
            const o = fadeTo(f, t0 + 6) * (1 - prog(f, t0 + q.stagger * 2.5, t0 + q.stagger * 2.5 + 12));
            if (o <= 0) return null;
            const p = toScreen(L.labelAt);
            return (
              <g key={i} opacity={o}>
                <MapLabel at={p} text={L.label} size={26} />
                <MapLabel at={p} dy={28} text={`→ ${L.owner}`} size={22} weight={800} color={C.darkRed} />
              </g>
            );
          })}
          {outlines}
          <MapLabel at={toScreen([10.4, 51.3])} text="GERMANY" size={40} opacity={0.9} />
          {inset && (
            <g opacity={fadeTo(f, q.globe)}>
              <Globe f={f} lon={lerp(10, 40, prog(f, q.globe, q.globe + 150))} lat={-2} r={110} cx={190} cy={480} highlights={[]}>
                {({proj}) => (
                  <g>
                    {VX.COLONIES.map((c, i) => {
                      const p = proj(c.at);
                      if (!p) return null;
                      const out = prog(f, q.colonies + i * 8, q.colonies + i * 8 + 12);
                      return <circle key={i} cx={p[0]} cy={p[1]} r={9 * (1 - out) + 0.01} fill={MAPC.germany} stroke={C.ink} strokeWidth={2.5} opacity={1 - out} />;
                    })}
                  </g>
                )}
              </Globe>
              <MapLabel at={[190, 625]} text="COLONIES" size={24} />
            </g>
          )}
        </g>
      )}
    </GeoMap>
  );
};

// ================================================================ M-02 (S03-08 wall map, S03-10) Czechoslovakia 1938–39
/** stage: 0 = Czechoslovakia before Munich; 1 = Sudetenland ceded (Oct 1938); 2 = March 1939 (Czech lands occupied). Fractions animate. */
export const czechHighlights = (stage: number): Highlight[] => {
  const s1 = clamp(stage);
  const s2 = clamp(stage - 1);
  return [
    {feature: GERMANY_1937, fill: MAPC.germany, opacity: 0.85},
    {name: 'Austria', fill: MAPC.germany, opacity: 0.85},
    {name: 'Czechia', fill: MAPC.czech, opacity: 1 - s2},
    {name: 'Czechia', fill: MAPC.germany, opacity: 0.85 * s2},
    {name: 'Slovakia', fill: MAPC.czech, opacity: 1 - s2 * 0.6},
    {feature: HX.RUTHENIA, fill: MAPC.czech, opacity: 1 - s2},
    {feature: HX.RUTHENIA, fill: MAPC.hungary, opacity: s2},
    {feature: VX.SUDETENLAND, fill: MAPC.germany, opacity: 0.9 * s1, stroke: stage > 0.05 && stage < 1 ? C.red : undefined},
  ];
};
export const MapCzech: React.FC<{f: number; stage: number; cam?: Cam; labels?: boolean; prague?: boolean}> = ({f, stage, cam = {lon: 15.8, lat: 49.6, zoom: 2.0}, labels = true, prague = true}) => (
  <GeoMap kind="europe" cam={cam} f={f} highlights={czechHighlights(stage)}>
    {({toScreen}) =>
      labels && (
        <g>
          <MapLabel at={toScreen([11.0, 51.6])} text="GERMANY" size={36} />
          {stage > 0.4 && stage < 1.6 && <MapLabel at={toScreen([13.4, 50.65])} text="SUDETENLAND" size={26} color={C.darkRed} opacity={clamp((stage - 0.4) * 3) * clamp((1.6 - stage) * 3)} />}
          <MapLabel at={toScreen([15.4, 49.5])} text={stage < 1.5 ? 'CZECHOSLOVAKIA' : 'BOHEMIA AND MORAVIA'} size={30} />
          {stage >= 1.5 && <MapLabel at={toScreen([15.4, 49.5])} dy={30} text="(occupied by Germany)" size={20} weight={700} />}
          {stage >= 1.5 && <MapLabel at={toScreen([19.6, 48.75])} text="SLOVAKIA" size={26} />}
          {prague && <CityMarker at={toScreen(CITY.Prague)} name="Prague" f={f} size={24} color={stage >= 1.5 ? C.red : C.ink} pulse={stage >= 1.5} />}
        </g>
      )
    }
  </GeoMap>
);

// ================================================================ M-03 (S04-03) Nazi–Soviet spheres
/** S04-03. Cues: spheres (Soviet sphere fills), line (Poland line draws), labels. line 'aug' = Narew–Vistula–San (23 Aug 1939 protocol); 'sept' = final Sept 1939 boundary. */
export const MapSpheres1939: React.FC<{f: number; cues?: Partial<Cues>; line?: 'aug' | 'sept'}> = ({f, cues, line = 'aug'}) => {
  const q = cue({spheres: 20, line: 50, labels: 80}, cues);
  const cam = camAt(f, {lon: 22, lat: 53, zoom: 1.25}, {lon: 25, lat: 54, zoom: 1.45}, 0, 240);
  const k = fadeTo(f, q.spheres, 30);
  const hl: Highlight[] = [
    {name: 'Russia', fill: MAPC.ussr, opacity: 0.8},
    {name: 'Belarus', fill: MAPC.ussr, opacity: 0.8},
    {name: 'Ukraine', fill: MAPC.ussr, opacity: 0.8},
    {name: 'Austria', fill: MAPC.germany, opacity: 0.85},
    {name: 'Czechia', fill: MAPC.germany, opacity: 0.85},
    {name: 'Finland', fill: MAPC.sphere, opacity: k},
    {name: 'Estonia', fill: MAPC.sphere, opacity: k},
    {name: 'Latvia', fill: MAPC.sphere, opacity: k},
    {feature: GERMANY_1937, fill: MAPC.germany, opacity: 0.85},
    {feature: EAST_PRUSSIA, fill: MAPC.germany, opacity: 0.85},
    {feature: VX.MEMEL, fill: MAPC.germany, opacity: 0.85},
    {feature: POLAND_1939, fill: MAPC.poland, opacity: 1},
    {feature: HX.BESSARABIA, fill: MAPC.sphere, opacity: k},
  ];
  const pl = line === 'aug' ? HX.PACT_LINE_AUG1939 : (MR_LINE_COORDS as HX.LL[]);
  return (
    <GeoMap kind="europe" cam={cam} f={f} highlights={hl}>
      {({toScreen}) => (
        <g>
          <FrontLine pts={pl} toScreen={toScreen} progress={prog(f, q.line, q.line + 40)} style="dashed" color={C.ink} width={6} />
          <g opacity={fadeTo(f, q.labels)}>
            <MapLabel at={toScreen([18.6, 50.9])} text="GERMAN SPHERE" size={28} color={C.axisDark} />
            <MapLabel at={toScreen([25.8, 57.4])} text="SOVIET SPHERE" size={28} color={C.darkRed} />
            <MapLabel at={toScreen([24.0, 55.4])} text="LITHUANIA" size={20} weight={700} />
          </g>
          <MapLabel at={toScreen([20.3, 53.6])} text="POLAND" size={28} opacity={fadeTo(f, q.spheres)} />
        </g>
      )}
    </GeoMap>
  );
};

// ================================================================ M-04 (S05-02, S05-03) 1940 campaigns
/** S05-02/S05-03. Cues: north (Denmark/Norway), low (Low Countries), sickle, pocket. */
export const Map1940: React.FC<{f: number; cues?: Partial<Cues>; cam?: Cam}> = ({f, cues, cam}) => {
  const q = cue({north: 10, low: 120, sickle: 170, pocket: 260}, cues);
  const c = cam ?? (f < q.low ? camAt(f, {lon: 10, lat: 59, zoom: 1.25}, {lon: 9, lat: 57, zoom: 1.25}, 0, q.low) : camAt(f, {lon: 9, lat: 57, zoom: 1.25}, {lon: 4, lat: 50.6, zoom: 2.2}, q.low - 20, q.low + 40));
  const A = HX.ARROWS_1940;
  const hl: Highlight[] = [
    {feature: GERMANY_1937, fill: MAPC.germany, opacity: 0.85},
    {name: 'Austria', fill: MAPC.germany, opacity: 0.85},
    {name: 'Czechia', fill: MAPC.germany, opacity: 0.85},
    {feature: POLAND_GERMAN_ZONE, fill: MAPC.germany, opacity: 0.85},
    {name: 'France', fill: MAPC.france, opacity: 0.8},
    {name: 'United Kingdom', fill: MAPC.uk, opacity: 0.7},
    {feature: HX.DUNKIRK_POCKET, fill: C.alliedLight, opacity: fadeTo(f, q.pocket) * (0.75 + 0.2 * Math.sin(f / 7)), stroke: C.ink},
  ];
  return (
    <GeoMap kind="europe" cam={c} f={f} highlights={hl}>
      {({toScreen}) => {
        const S = (pts: HX.LL[]) => pts.map(toScreen);
        return (
          <g>
            <MapArrow pts={S(A.denmark)} progress={prog(f, q.north, q.north + 30)} width={20} />
            <MapArrow pts={S(A.oslo)} progress={prog(f, q.north + 8, q.north + 50)} width={16} dashed />
            <MapArrow pts={S(A.bergen)} progress={prog(f, q.north + 14, q.north + 56)} width={16} dashed />
            <MapArrow pts={S(A.trondheim)} progress={prog(f, q.north + 20, q.north + 62)} width={16} dashed />
            <MapArrow pts={S(A.narvik)} progress={prog(f, q.north + 26, q.north + 76)} width={16} dashed />
            <MapArrow pts={S(A.netherlands)} progress={prog(f, q.low, q.low + 30)} width={22} />
            <MapArrow pts={S(A.belgium)} progress={prog(f, q.low + 6, q.low + 40)} width={22} />
            <MapArrow pts={S(A.sickle)} progress={prog(f, q.sickle, q.sickle + 60)} width={28} />
            {f > q.sickle + 50 && <CityMarker at={toScreen(CITY.Abbeville)} name="Abbeville" f={f} size={22} labelDy={30} opacity={fadeTo(f, q.sickle + 50)} />}
            {f > q.pocket && <CityMarker at={toScreen(CITY.Dunkirk)} name="Dunkirk" f={f} size={26} color={C.allied} opacity={fadeTo(f, q.pocket)} />}
            <MapLabel at={toScreen(CITY.Sedan)} dy={-26} text="Sedan" size={20} opacity={fadeTo(f, q.sickle + 15)} />
          </g>
        );
      }}
    </GeoMap>
  );
};

// ================================================================ M-05 Eastern Front
/** USSR in June 1941 (incl. Baltic states, eastern Poland, Bessarabia), with Axis neighbours grey. */
const ussr1941: Highlight[] = [
  {name: 'Germany', fill: MAPC.germany, opacity: 1},
  {name: 'Poland', fill: MAPC.germany, opacity: 1},
  {name: 'Czechia', fill: MAPC.germany, opacity: 1},
  {name: 'Austria', fill: MAPC.germany, opacity: 1},
  {name: 'Slovakia', fill: MAPC.germany, opacity: 1},
  {name: 'Hungary', fill: MAPC.germany, opacity: 1},
  {name: 'Romania', fill: MAPC.germany, opacity: 1},
  {name: 'Finland', fill: MAPC.germany, opacity: 1},
  {name: 'Russia', fill: MAPC.ussr, opacity: 1},
  {name: 'Belarus', fill: MAPC.ussr, opacity: 1},
  {name: 'Ukraine', fill: MAPC.ussr, opacity: 1},
  {name: 'Moldova', fill: MAPC.ussr, opacity: 1},
  {name: 'Lithuania', fill: MAPC.ussr, opacity: 1},
  {name: 'Latvia', fill: MAPC.ussr, opacity: 1},
  {name: 'Estonia', fill: MAPC.ussr, opacity: 1},
  {feature: EAST_PRUSSIA, fill: MAPC.germany, opacity: 1},
  {feature: POLAND_SOVIET_ZONE, fill: MAPC.ussr, opacity: 1},
  {feature: HX.RUTHENIA, fill: MAPC.germany, opacity: 1},
];

/** S06-02. Cues: front (start line draws), arrows, bracket, counter (Moscow counter-attack, optional, -1 = off). */
export const MapBarbarossa: React.FC<{f: number; cues?: Partial<Cues>; cam?: Cam}> = ({f, cues, cam}) => {
  const q = cue({front: 5, arrows: 40, bracket: 120, counter: -1}, cues);
  const c = cam ?? camAt(f, {lon: 28, lat: 54.5, zoom: 0.95}, {lon: 31, lat: 54.5, zoom: 1.1}, 0, 260);
  const A = HX.ARROWS_1941;
  return (
    <GeoMap kind="eastFront" cam={c} f={f} highlights={ussr1941}>
      {({toScreen}) => {
        const S = (pts: HX.LL[]) => pts.map(toScreen);
        return (
          <g>
            <FrontLine pts={HX.FRONT_JUNE1941} toScreen={toScreen} progress={prog(f, q.front, q.front + 40)} color={C.red} teethSide={1} />
            <MapArrow pts={S(A.leningrad)} progress={prog(f, q.arrows, q.arrows + 70)} width={26} />
            <MapArrow pts={S(A.moscow)} progress={prog(f, q.arrows + 10, q.arrows + 80)} width={30} />
            <MapArrow pts={S(A.kyiv)} progress={prog(f, q.arrows + 20, q.arrows + 80)} width={26} />
            <LineBracket pts={HX.FRONT_JUNE1941} toScreen={toScreen} label="NEARLY 3,000 KM" progress={prog(f, q.bracket, q.bracket + 40)} offset={60} labelAt={0.5} />
            {q.counter >= 0 && (
              <g>
                <MapArrow pts={S(A.moscowCounter)} progress={prog(f, q.counter, q.counter + 40)} color={C.soviet} width={24} />
                <MapArrow pts={S(A.moscowCounterSouth)} progress={prog(f, q.counter + 8, q.counter + 46)} color={C.soviet} width={20} />
              </g>
            )}
            <CityMarker at={toScreen(CITY.Leningrad)} name="Leningrad" f={f} size={24} pulse={false} />
            <CityMarker at={toScreen(CITY.Moscow)} name="Moscow" f={f} size={28} pulse={false} />
            <CityMarker at={toScreen(CITY.Kyiv)} name="Kyiv" f={f} size={24} pulse={false} labelDy={34} />
            <MapLabel at={toScreen([40, 57.5])} text="SOVIET UNION" size={40} opacity={0.9} />
          </g>
        );
      }}
    </GeoMap>
  );
};

/** Simplified Don and Volga near Stalingrad (for context at high zoom). */
export const RIVERS_STALINGRAD: Record<string, HX.LL[]> = {
  don: [[42.0, 49.9], [42.73, 49.58], [43.06, 49.31], [43.6, 49.2], [43.95, 49.05], [43.75, 48.85], [43.53, 48.69], [43.2, 48.3], [42.5, 47.85], [42.1, 47.65]],
  volga: [[45.4, 50.08], [45.0, 49.4], [44.65, 48.95], [44.5, 48.7], [44.55, 48.45], [44.9, 48.15], [45.6, 47.7], [46.6, 47.0], [48.0, 46.35]],
};
const River: React.FC<{pts: HX.LL[]; toScreen: (ll: [number, number]) => [number, number]; label?: string; labelIdx?: number}> = ({pts, toScreen, label, labelIdx = 2}) => {
  const sp = pts.map(toScreen);
  const d = 'M' + sp.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L');
  return (
    <g>
      <path d={d} fill="none" stroke={C.ink} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#7FA8BA" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      {label && <MapLabel at={sp[labelIdx]} dy={-16} text={label} size={22} italic color="#2E5A6E" />}
    </g>
  );
};

/** S07-05 (map half). Cues: pincers, pocket. */
export const MapStalingrad: React.FC<{f: number; cues?: Partial<Cues>; cam?: Cam}> = ({f, cues, cam}) => {
  const q = cue({pincers: 20, pocket: 75}, cues);
  const c = cam ?? camAt(f, {lon: 43.95, lat: 48.9, zoom: 4.6}, {lon: 44.05, lat: 48.85, zoom: 5.4}, 0, 220);
  const S = HX.STALINGRAD;
  const hl: Highlight[] = [{name: 'Russia', fill: '#E6C9B8'}];
  if (f > q.pocket) hl.push(pocketHighlight(S.pocket, f, MAPC.germany));
  return (
    <GeoMap kind="eastFront" cam={c} f={f} highlights={hl} borders={false}>
      {({toScreen}) => (
        <g>
          <River pts={RIVERS_STALINGRAD.don} toScreen={toScreen} label="DON" labelIdx={7} />
          <River pts={RIVERS_STALINGRAD.volga} toScreen={toScreen} label="VOLGA" labelIdx={1} />
          <MapArrow pts={S.northPincer.map(toScreen)} progress={prog(f, q.pincers, q.pincers + 50)} color={C.soviet} width={24} />
          <MapArrow pts={S.southPincer.map(toScreen)} progress={prog(f, q.pincers + 6, q.pincers + 56)} color={C.soviet} width={24} />
          <CityMarker at={toScreen(S.city)} name="Stalingrad" f={f} size={36} labelDx={120} labelDy={12} />
          <MapLabel at={toScreen(CITY.Kalach)} dy={48} text="Kalach" size={26} opacity={fadeTo(f, q.pincers + 50)} />
          {f > q.pocket && <MapLabel at={toScreen([44.05, 48.82])} text="TRAPPED" size={30} color={C.darkRed} opacity={fadeTo(f, q.pocket + 10)} />}
        </g>
      )}
    </GeoMap>
  );
};

/** S08-08. Cues: front, arrows, after (front moves west to the Vistula). */
export const MapBagration: React.FC<{f: number; cues?: Partial<Cues>; cam?: Cam}> = ({f, cues, cam}) => {
  const q = cue({front: 5, arrows: 30, after: 120}, cues);
  const c = cam ?? camAt(f, {lon: 28, lat: 54, zoom: 1.9}, {lon: 25, lat: 53.5, zoom: 1.4}, 0, 240);
  const A = HX.ARROWS_BAGRATION;
  const k = prog(f, q.after, q.after + 60);
  const front = HX.lerpLine(HX.FRONT_JUNE1944_BELARUS, [[23.0, 56.6], [23.5, 55.5], [22.6, 54.6], [22.0, 53.6], [21.3, 52.6], [21.1, 52.25], [21.6, 51.6], [21.75, 50.7], [22.6, 49.8], [24.2, 48.6]], k);
  return (
    <GeoMap kind="eastFront" cam={c} f={f} highlights={[{name: 'Russia', fill: MAPC.ussr}, {name: 'Ukraine', fill: MAPC.ussr}, {feature: HX.heldEastOf(front), fill: MAPC.ussr}, {feature: HX.heldWestOf(front), fill: MAPC.germany}]}>
      {({toScreen}) => {
        const S = (pts: HX.LL[]) => pts.map(toScreen);
        return (
          <g>
            <FrontLine pts={front} toScreen={toScreen} progress={prog(f, q.front, q.front + 30)} color={C.red} teethSide={-1} />
            <MapArrow pts={S(A.north)} progress={prog(f, q.arrows, q.arrows + 50)} color={C.soviet} width={24} />
            <MapArrow pts={S(A.centreN)} progress={prog(f, q.arrows + 6, q.arrows + 50)} color={C.soviet} width={28} />
            <MapArrow pts={S(A.centreS)} progress={prog(f, q.arrows + 12, q.arrows + 56)} color={C.soviet} width={28} />
            <MapArrow pts={S(A.west)} progress={prog(f, q.after - 10, q.after + 60)} color={C.soviet} width={26} />
            <CityMarker at={toScreen(CITY.Minsk)} name="Minsk" f={f} size={26} pulse={false} />
            <CityMarker at={toScreen(CITY.Warsaw)} name="Warsaw" f={f} size={24} pulse={false} opacity={fadeTo(f, q.after)} />
            <MapLabel at={toScreen([28.5, 52.6])} text="BELARUS" size={26} weight={700} />
          </g>
        );
      }}
    </GeoMap>
  );
};

// ================================================================ M-09 (S08-01 wall map, S08-09, S09-01) 1944–45
/** S08-09 / S09-01. t: 0 = Dec 1944 → 1 = Mar 1945 → 2 = Apr 1945 (fronts + shrinking fill). Cues: arrows (converging on Berlin, -1 = off). */
export const MapEurope1945: React.FC<{f: number; t: number; cues?: Partial<Cues>; cam?: Cam; italy?: boolean; label?: boolean}> = ({f, t, cues, cam, italy = true, label = true}) => {
  const q = cue({arrows: -1}, cues);
  const c = cam ?? {lon: 13, lat: 50.5, zoom: 1.6};
  const A = HX.ARROWS_1945;
  const italyLine = HX.italyFrontAt(t);
  return (
    <GeoMap kind="europe" cam={c} f={f} highlights={[...(italy ? [{feature: HX.italyHeldAt(t), fill: MAPC.germany, opacity: 0.85}] : []), ...reichHighlights(t, MAPC.germany)]}>
      {({toScreen}) => {
        const S = (pts: HX.LL[]) => pts.map(toScreen);
        return (
          <g>
            <FrontLine pts={HX.frontAt('west', t)} toScreen={toScreen} color={C.allied} teethSide={1} />
            <FrontLine pts={HX.frontAt('east', t)} toScreen={toScreen} color={C.soviet} teethSide={-1} />
            {italy && <FrontLine pts={italyLine} toScreen={toScreen} color={C.allied} teethSide={-1} />}
            {q.arrows >= 0 && (
              <g>
                <MapArrow pts={S(A.westNorth)} progress={prog(f, q.arrows, q.arrows + 50)} color={C.allied} width={26} />
                <MapArrow pts={S(A.westSouth)} progress={prog(f, q.arrows + 6, q.arrows + 56)} color={C.allied} width={26} />
                <MapArrow pts={S(A.eastBerlin)} progress={prog(f, q.arrows + 10, q.arrows + 50)} color={C.soviet} width={30} />
                <MapArrow pts={S(A.eastSouth)} progress={prog(f, q.arrows + 14, q.arrows + 56)} color={C.soviet} width={26} />
                {italy && <MapArrow pts={S(A.italy)} progress={prog(f, q.arrows + 20, q.arrows + 60)} color={C.allied} width={20} />}
              </g>
            )}
            <CityMarker at={toScreen(CITY.Berlin)} name="Berlin" f={f} size={30} />
            {label && <MapLabel at={toScreen([10.5, 49.6])} text={HX.FRONT_KEYS.labels[Math.min(2, Math.round(t))]} size={26} weight={700} opacity={0.85} />}
          </g>
        );
      }}
    </GeoMap>
  );
};

/** S08-01 wall map content: Europe in spring 1944 (Gustav Line + Anzio, Eastern Front after the winter 1943–44 offensives). */
export const EAST_SPRING1944: HX.LL[] = [[28.0, 57.8], [28.6, 56.6], [29.8, 55.6], [30.8, 55.0], [31.0, 54.4], [30.5, 53.3], [29.9, 52.5], [28.0, 51.9], [25.0, 51.3], [25.0, 49.6], [26.0, 48.3], [27.0, 47.6], [29.0, 47.0], [30.5, 46.6]];
export const Europe1944Content: React.FC<{toScreen: (ll: [number, number]) => [number, number]; f: number}> = ({toScreen, f}) => (
  <g>
    <FrontLine pts={HX.ITALY_GUSTAV_1944} toScreen={toScreen} color={C.allied} teethSide={-1} width={9} />
    <FrontLine pts={EAST_SPRING1944} toScreen={toScreen} color={C.soviet} teethSide={-1} width={9} />
    <CityMarker at={toScreen(CITY.Normandy)} f={f} color={C.allied} size={0} />
    <MapLabel at={toScreen([2.5, 46.5])} text="OCCUPIED FRANCE" size={34} />
  </g>
);

// ================================================================ M-06 (S04-09, S06-05, S10-06) East Asia
/** Phases: manchuria (1931 fill), china (1937 arrows), japan1941 (PENDING_R01 placeholder fill), soviet45 (Aug 1945 arrows). -1 = off. */
export const MapEastAsia: React.FC<{f: number; cues?: Partial<Cues>; cam?: Cam; show1941?: boolean}> = ({f, cues, cam, show1941 = false}) => {
  const q = cue({manchuria: -1, china: -1, japan1941: -1, soviet45: -1}, cues);
  const c = cam ?? {lon: 122, lat: 37, zoom: 1.2};
  const hl: Highlight[] = [
    {name: 'Japan', fill: MAPC.japan, opacity: 0.95},
    {name: 'North Korea', fill: MAPC.japan, opacity: 0.8},
    {name: 'South Korea', fill: MAPC.japan, opacity: 0.8},
    {name: 'Taiwan', fill: MAPC.japan, opacity: 0.8},
    {name: 'China', fill: MAPC.china, opacity: 0.9},
    {name: 'Russia', fill: MAPC.ussr, opacity: 0.6},
    {name: 'Mongolia', fill: MAPC.ussr, opacity: 0.3},
  ];
  if (q.manchuria >= 0) hl.push({feature: HX.MANCHURIA_1931, fill: MAPC.japan, opacity: 0.85 * fadeTo(f, q.manchuria, 25), stroke: f < q.manchuria + 40 ? C.red : undefined});
  if (q.japan1941 >= 0 && show1941) HX.JAPAN_1941_PLACEHOLDER.forEach((p) => hl.push({feature: p, fill: MAPC.japan, opacity: 0.8 * fadeTo(f, q.japan1941, 30)}));
  const A = HX.ARROWS_CHINA_1937;
  const B = HX.ARROWS_MANCHURIA_1945;
  return (
    <GeoMap kind="eastAsia" cam={c} f={f} highlights={hl}>
      {({toScreen}) => {
        const S = (pts: HX.LL[]) => pts.map(toScreen);
        return (
          <g>
            {q.manchuria >= 0 && <MapLabel at={toScreen([125.5, 46.0])} text="MANCHURIA" size={30} opacity={fadeTo(f, q.manchuria + 15)} />}
            {q.manchuria >= 0 && <CityMarker at={toScreen(CITY.Mukden)} name="Mukden" f={f} size={22} opacity={fadeTo(f, q.manchuria)} />}
            {q.china >= 0 && (
              <g>
                <MapArrow pts={S(A.north)} progress={prog(f, q.china, q.china + 45)} color={C.japan} width={24} />
                <MapArrow pts={S(A.shanghai)} progress={prog(f, q.china + 15, q.china + 60)} color={C.japan} width={24} />
                <CityMarker at={toScreen(CITY.Beijing)} name="Beijing" f={f} size={22} pulse={false} labelDx={-60} labelDy={-10} />
                <CityMarker at={toScreen(CITY.Shanghai)} name="Shanghai" f={f} size={22} pulse={false} labelDx={70} labelDy={8} />
                <CityMarker at={toScreen(CITY.Nanjing)} name="Nanjing" f={f} size={22} labelDx={-60} labelDy={30} opacity={fadeTo(f, q.china + 50)} />
              </g>
            )}
            {q.soviet45 >= 0 && (
              <g>
                <MapArrow pts={S(B.transbaikal)} progress={prog(f, q.soviet45, q.soviet45 + 50)} color={C.soviet} width={26} />
                <MapArrow pts={S(B.firstFarEast)} progress={prog(f, q.soviet45 + 6, q.soviet45 + 50)} color={C.soviet} width={24} />
                <MapArrow pts={S(B.secondFarEast)} progress={prog(f, q.soviet45 + 12, q.soviet45 + 56)} color={C.soviet} width={24} />
              </g>
            )}
            <MapLabel at={toScreen([138.5, 36.4])} text="JAPAN" size={30} />
            <MapLabel at={toScreen([110, 33])} text="CHINA" size={36} />
          </g>
        );
      }}
    </GeoMap>
  );
};

// ================================================================ M-07 (S07-02, S10-01) Pacific
/** S07-02. Cues: carriers (icons appear), strike (US strike arrow), hits (Japanese carriers burn). */
export const MapMidway: React.FC<{f: number; cues?: Partial<Cues>; cam?: Cam}> = ({f, cues, cam}) => {
  const q = cue({carriers: 20, strike: 70, hits: 110}, cues);
  const c = cam ?? camAt(f, {lon: 175, lat: 25, zoom: 1.0}, {lon: -177.4, lat: 29.9, zoom: 3.6}, 0, 90);
  const M = HX.MIDWAY;
  return (
    <GeoMap kind="pacific" cam={c} f={f} highlights={[{name: 'Japan', fill: MAPC.japan}, {name: 'United States of America', fill: C.alliedLight}]}>
      {({toScreen}) => {
        const jp = toScreen(M.japaneseCarriers);
        const us = toScreen(M.usCarriers);
        const mi = toScreen(M.island);
        const on = fadeTo(f, q.carriers);
        return (
          <g>
            <CityMarker at={mi} name="Midway" f={f} size={32} color={C.allied} labelDy={48} />
            <g opacity={on}>
              {[0, 1, 2, 3].map((i) => <CarrierIcon key={i} x={jp[0] - 70 + (i % 2) * 90 - Math.floor(i / 2) * 30} y={jp[1] - 40 + Math.floor(i / 2) * 70} side="jp" s={0.7} rot={130} hit={prog(f, q.hits + i * 10, q.hits + i * 10 + 10)} f={f + i * 9} />)}
              {[0, 1, 2].map((i) => <CarrierIcon key={i} x={us[0] + 10 + i * 70} y={us[1] - 20 + (i % 2) * 60} side="us" s={0.7} rot={-150} />)}
              <MapLabel at={[jp[0] - 120, jp[1] - 110]} text="JAPANESE CARRIERS" size={28} color={C.darkRed} />
              <MapLabel at={[us[0] + 150, us[1] - 90]} text="US CARRIERS" size={28} color={C.navy} />
            </g>
            <MapArrow pts={[[us[0] - 40, us[1] + 10], [lerp(us[0], jp[0], 0.5), lerp(us[1], jp[1], 0.5) - 60], [jp[0] + 40, jp[1] - 10]]} progress={prog(f, q.strike, q.strike + 35)} color={C.allied} width={18} dashed />
          </g>
        );
      }}
    </GeoMap>
  );
};

/** S10-01. Cues: route (draws through the stops). */
export const MapIslandHopping: React.FC<{f: number; cues?: Partial<Cues>; cam?: Cam}> = ({f, cues, cam}) => {
  const q = cue({route: 15, dur: 150}, cues);
  const c = cam ?? camAt(f, {lon: 150, lat: 8, zoom: 1.3}, {lon: 138, lat: 22, zoom: 1.7}, 0, 240);
  const p = prog(f, q.route, q.route + q.dur);
  return (
    <GeoMap kind="pacific" cam={c} f={f} highlights={[{name: 'Japan', fill: MAPC.japan}, {name: 'Australia', fill: C.alliedLight, opacity: 0.6}]}>
      {({toScreen}) => (
        <g>
          <MapArrow pts={HX.ISLAND_HOPPING.map(toScreen)} progress={p} color={C.allied} width={22} />
          {HX.ISLAND_HOPPING_STOPS.map((n, i) => (
            <CityMarker key={n} at={toScreen(CITY[n])} name={n} f={f} size={24} color={C.allied} pulse={false} labelDx={n === 'Okinawa' ? -70 : 70} labelDy={8} opacity={fadeTo(f, q.route + (i / 3) * q.dur * 0.95)} />
          ))}
          <CityMarker at={toScreen(CITY.Tokyo)} name="Tokyo" f={f} size={24} labelDx={60} />
        </g>
      )}
    </GeoMap>
  );
};

// ================================================================ M-08 (S08-04) Normandy — PENDING_R01 verification
/** S08-04. Cues: drops (parachute icons), beaches (labels), arrows (from the sea). */
export const MapNormandy: React.FC<{f: number; cues?: Partial<Cues>; cam?: Cam}> = ({f, cues, cam}) => {
  const q = cue({drops: 10, beaches: 40, arrows: 70}, cues);
  const c = cam ?? camAt(f, {lon: -1.05, lat: 49.33, zoom: 1.1}, {lon: -0.55, lat: 49.33, zoom: 1.1}, 0, 260);
  const col = {US: C.allied, UK: '#B23A2E', CA: '#C9861E'};
  return (
    <GeoMap kind="normandy" cam={c} f={f} borders={false} sea="#8FB2BC">
      {({toScreen}) => (
        <g>
          {HX.DDAY_BEACHES.map((b, i) => {
            const o = fadeTo(f, q.beaches + i * 8);
            const [a, z] = b.sector.map(toScreen);
            const p = toScreen(b.at);
            return (
              <g key={b.name} opacity={o}>
                <line x1={a[0]} y1={a[1]} x2={z[0]} y2={z[1]} stroke={C.ink} strokeWidth={16} strokeLinecap="round" />
                <line x1={a[0]} y1={a[1]} x2={z[0]} y2={z[1]} stroke={col[b.nation]} strokeWidth={10} strokeLinecap="round" />
                <MapArrow pts={[[p[0], p[1] - 130 - (i % 2) * 90], [p[0], p[1] - 40]]} progress={prog(f, q.arrows + i * 6, q.arrows + i * 6 + 30)} color={col[b.nation]} width={20} />
                <MapLabel at={[p[0], p[1] - 150 - (i % 2) * 90]} text={b.name} size={30} color={col[b.nation]} />
              </g>
            );
          })}
          {HX.DDAY_DROPS.map((d, i) => {
            const p = toScreen(d.at);
            const o = fadeTo(f, q.drops + i * 10);
            return (
              <g key={d.label} opacity={o}>
                {[0, 1, 2, 3, 4].map((k) => <ParachuteIcon key={k} x={p[0] + ((k * 47) % 110) - 55} y={p[1] + ((k * 31) % 60) - 30 - (1 - o) * 60} s={0.9} f={f} seed={k + i * 5} color={d.nation === 'US' ? '#E8E1CF' : '#D9CBA0'} />)}
                <MapLabel at={[p[0], p[1] + 62]} text={`${d.label} AIRBORNE`} size={20} weight={700} />
              </g>
            );
          })}
          <MapLabel at={toScreen([-0.75, 49.15])} text="NORMANDY" size={34} opacity={0.85} />
          <CityMarker at={toScreen(CITY.Caen)} name="Caen" f={f} size={22} pulse={false} labelDx={-50} labelDy={30} />
          <g transform="translate(1480,140)" opacity={fadeTo(f, q.beaches)}>
            <rect x={0} y={0} width={330} height={150} rx={12} fill="rgba(245,240,226,0.92)" stroke={C.ink} strokeWidth={4} />
            {([['US', 'AMERICAN'], ['UK', 'BRITISH'], ['CA', 'CANADIAN']] as const).map(([k, t], i) => (
              <g key={k} transform={`translate(24,${34 + i * 42})`}>
                <rect x={0} y={-14} width={44} height={20} fill={col[k]} stroke={C.ink} strokeWidth={3} />
                <text x={60} y={4} fontFamily="Montserrat, Arial, sans-serif" fontWeight={800} fontSize={26} fill={C.ink}>{t}</text>
              </g>
            ))}
          </g>
          <MapLabel at={toScreen([-0.8, 49.75])} text="ENGLISH CHANNEL" size={26} italic color="#2E5A6E" />
        </g>
      )}
    </GeoMap>
  );
};
