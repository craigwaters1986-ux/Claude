// Episode 2 (WW1) animated maps: M-01 Europe 1914, M-02 Western Front (+ wall-map inset),
// M-03 Eastern Front, M-04 Gallipoli, M-05 Europe 1919–23.
// Every animation is driven by plain progress props (0..1 unless noted), so the video editor
// can key them from narration beats:  <MapEurope1914 f={f} entente={prog(f, a, b)} ... />.
// Data and sources: ./ww1.ts, production/environments/ep02-ww1/map-notes.md.
import React from 'react';
import {C, FONT, W, H} from '../styles/theme';
import {clamp, easeBack, easeIn, easeInOut, easeOut, lerp} from '../animations/core';
import {GeoMap, MapArrow, MapLabel, CityMarker, Cam, camLerp} from './GeoMap';
import {FrontLine, WallMap} from './MapKit';
import {lerpLine} from './history';
import {poly, ALSACE_LORRAINE, POLAND_WEST_CHAIN} from './geo';
import * as X from './ww1';
import type {State14, State19, LL} from './ww1';
import {StateLayer, StateStyle, Borders, borderPath, samplePoints, cf, mix, along, linePath, StateClips, StateArea, viewBox} from './StateMap';
import {TrainIcon, ShipIcon, Envelope, Stopwatch, HourDial, FlipCalendar, TickList, Marcher, RedFlagIcon, CrownIcon} from './IconsWW1';

const ink = C.ink;
type ToScreen = (ll: [number, number]) => [number, number];
const P = X.P14;

// ================================================================== shared helpers
/** Map label that is dropped when it would touch the channel-logo zone (x < 170, y < 150) or leave the frame. */
export const SafeLabel: React.FC<React.ComponentProps<typeof MapLabel>> = (p) => {
  const size = p.size ?? 36;
  const w = p.text.length * size * 0.7;
  const x = p.at[0];
  const y = p.at[1] + (p.dy ?? 0);
  if (x - w / 2 < 175 && y - size < 155) return null;
  if (x < -200 || x > W + 200 || y < -50 || y > H + 50) return null;
  if ((p.opacity ?? 1) <= 0.01) return null;
  return <MapLabel size={size} {...p} />;
};
/** Two-line label (e.g. KINGDOM OF SERBS, / CROATS AND SLOVENES). */
const Label2: React.FC<{at: [number, number]; lines: string[]; size?: number; opacity?: number; color?: string; scale?: number}> = ({at, lines, size = 36, opacity = 1, color, scale = 1}) => (
  <g transform={`translate(${at[0]},${at[1]}) scale(${scale}) translate(${-at[0]},${-at[1]})`}>
    {lines.map((t, i) => <SafeLabel key={i} at={at} dy={(i - (lines.length - 1) / 2) * size * 1.1} text={t} size={size} opacity={opacity} color={color} />)}
  </g>
);
const pts = (ts: ToScreen, a: LL[]) => a.map(ts) as [number, number][];
const pop = (k: number) => easeBack(clamp(k));
const seg = (t: number, a: number, b: number, e: (x: number) => number = easeInOut) => e(clamp((t - a) / (b - a)));

/** Thin animated link line between two points (solid / dotted / dashed), drawn on with progress. */
const LinkLine: React.FC<{a: [number, number]; b: [number, number]; progress: number; style?: 'solid' | 'dotted' | 'dashed'; color?: string; width?: number; bend?: number}> = ({
  a, b, progress, style = 'solid', color = ink, width = 7, bend = 0.15,
}) => {
  if (progress <= 0.001) return null;
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend;
  const my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  const d = `M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}`;
  const dash = style === 'dotted' ? `0.1 ${width * 2.2}` : style === 'dashed' ? `${width * 3} ${width * 2}` : undefined;
  const k = clamp(progress);
  return (
    <g>
      <path d={d} fill="none" stroke="#fff" strokeWidth={width + 6} strokeLinecap="round" pathLength={1} strokeDasharray={`${k} 2`} opacity={0.85} />
      <mask id={`lk-${Math.round(a[0])}-${Math.round(b[0])}-${Math.round(a[1])}`}>
        <path d={d} fill="none" stroke="#fff" strokeWidth={width + 8} pathLength={1} strokeDasharray={`${k} 2`} />
      </mask>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} mask={`url(#lk-${Math.round(a[0])}-${Math.round(b[0])}-${Math.round(a[1])})`} />
    </g>
  );
};

/** Drawn tick + text ("✓ 29 SEPT") — the tick is a path, so it does not depend on font glyphs. */
const TickTag: React.FC<{at: [number, number]; text: string; opacity: number; scale?: number}> = ({at, text, opacity, scale = 1}) => {
  if (opacity <= 0.01) return null;
  const w = text.length * 26 + 80;
  return (
    <g transform={`translate(${at[0]},${at[1]}) scale(${scale})`} opacity={opacity}>
      <rect x={-w / 2} y={-30} width={w} height={60} rx={10} fill="#F5EFDF" stroke={ink} strokeWidth={4} />
      <path d={`M${-w / 2 + 18},0 l10,12 l22,-26`} fill="none" stroke={C.militaryGreen} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <text x={-w / 2 + 62} y={13} fontFamily={FONT.sans} fontWeight={900} fontSize={36} fill={ink}>{text}</text>
    </g>
  );
};

// ================================================================== M-01 Europe 1914
export type Style14 = Partial<Record<State14, StateStyle>>;
const ALL14 = X.ORDER_1914;
const GREAT: State14[] = ['GER', 'AH', 'RUS', 'FRA', 'GBR', 'ITA', 'OTT'];
const neutralStyle = (s: State14): StateStyle => ({fill: s === 'OTT' ? P.minor : P.neutral});

/** Preset fills.  'alliances' = end of S02-03; 'war1914' = the two blocs, end of 1914; 'war1918' = autumn 1918. */
export const PRESET_1914: Record<'neutral' | 'alliances' | 'war1914' | 'war1918', Style14> = {
  neutral: {},
  alliances: {FRA: {fill: P.entente}, RUS: {fill: P.entente}, GBR: {fill: P.ententeLight}, GER: {fill: P.central}, AH: {fill: P.central}},
  war1914: {
    FRA: {fill: P.entente}, RUS: {fill: P.entente}, GBR: {fill: P.entente}, SRB: {fill: P.entente}, BEL: {fill: P.entente}, MNE: {fill: P.entente},
    GER: {fill: P.central}, AH: {fill: P.central}, OTT: {fill: P.central},
  },
  war1918: {
    FRA: {fill: P.entente}, GBR: {fill: P.entente}, ITA: {fill: P.entente}, SRB: {fill: P.entente}, BEL: {fill: P.entente}, GRC: {fill: P.entente},
    PRT: {fill: P.entente}, MNE: {fill: P.entente}, RUS: {fill: P.neutral}, ROU: {fill: P.ententeLight},
    GER: {fill: P.central}, AH: {fill: P.central}, OTT: {fill: P.central}, BGR: {fill: P.central},
  },
};
export const CAM_1914 = {
  europe: {lon: 14, lat: 50, zoom: 1.0} as Cam,
  wide: {lon: 15, lat: 50, zoom: 1.4} as Cam,
  balkans: {lon: 19.5, lat: 44.8, zoom: 2.4} as Cam,
  austria: {lon: 18.5, lat: 46.5, zoom: 1.9} as Cam,
  west: {lon: 6, lat: 50, zoom: 1.6} as Cam,
  viennaBelgrade: {lon: 18.6, lat: 46.4, zoom: 2.0} as Cam,
  belgium: {lon: 5.2, lat: 50.4, zoom: 3.0} as Cam,
  central: {lon: 18, lat: 49, zoom: 1.3} as Cam,
};

export type Europe1914Props = {
  f: number;
  cam?: Cam;
  idSuffix?: string;
  dim?: number;
  base?: keyof typeof PRESET_1914;
  /** Great powers fade from pale to neutral grey (start of S02-02). */
  powers?: number;
  /** France + Russia fill Entente and the solid link draws. */
  entente?: number;
  /** Britain fills a lighter tint and the dotted links draw. */
  britain?: number;
  /** Germany + Austria-Hungary fill Central and their solid link draws. */
  central?: number;
  /** Italy hatched tint + dashed link (Triple Alliance on paper). */
  italy?: number;
  /** Italy's tint fades to neutral and the "NEUTRAL IN 1914" tag shows. */
  italyNeutral?: number;
  /** S01-02: the powers flash in sequence A-H, Russia, Germany, France, Britain (0..5). */
  flash?: number;
  labels?: number;
  labelSet?: State14[];
  capitals?: number;
  capitalSet?: string[];
  balkans?: {serbiaPulse?: number; peoples?: number; tension?: number; ahBorder?: number; labels?: number};
  warPlan?: {west?: number; east?: number; trains?: number; stopwatch?: number};
  july?: {ultimatum?: number; clock?: number; reply?: number; ticks?: number; declare?: number; marchers?: number; calendar?: number; calendarShow?: number};
  y1918?: {trains?: number; usShip?: number};
  collapse?: {bulgaria?: number; ottoman?: number; austria?: number; kiel?: number; redDots?: number; kaiser?: number};
  debate?: {fischer?: number; clark?: number};
  styles?: Style14;
  children?: (ctx: {toScreen: ToScreen; z: number}) => React.ReactNode;
};

const deepOf = (fill: string) => (fill === P.entente ? P.ententeDeep : fill === P.central ? P.centralDeep : fill === P.ententeLight ? P.entente : mix(fill, '#6B5E48', 0.25));

export function styles1914(p: Europe1914Props): Record<State14, StateStyle> {
  const st = {} as Record<State14, StateStyle>;
  const preset = PRESET_1914[p.base ?? 'neutral'];
  for (const s of ALL14) st[s] = {...neutralStyle(s), ...(preset[s] ?? {})};
  const set = (s: State14, fill: string) => (st[s] = {...st[s], fill});
  if (p.powers) for (const s of GREAT) set(s, mix(st[s].fill, P.greyStart, p.powers));
  if (p.entente) (['FRA', 'RUS'] as State14[]).forEach((s) => set(s, mix(st[s].fill, P.entente, p.entente!)));
  if (p.britain) set('GBR', mix(st.GBR.fill, P.ententeLight, p.britain));
  if (p.central) (['GER', 'AH'] as State14[]).forEach((s) => set(s, mix(st[s].fill, P.central, p.central!)));
  if (p.italy) {
    const k = clamp(p.italy) * (1 - clamp(p.italyNeutral ?? 0));
    st.ITA = {...st.ITA, fill: mix(st.ITA.fill, P.centralLight, k * 0.6), hatch: P.central, hatchOpacity: k};
    if (p.italyNeutral) st.ITA.fill = mix(st.ITA.fill, P.neutral, p.italyNeutral);
  }
  if (p.flash !== undefined) {
    const seq: [State14, string][] = [['AH', P.central], ['RUS', P.entente], ['GER', P.central], ['FRA', P.entente], ['GBR', P.ententeLight]];
    seq.forEach(([s, target], i) => {
      const k = clamp(p.flash! - i);
      if (k <= 0) return;
      set(s, k < 0.25 ? mix(st[s].fill, '#FBF6EA', k / 0.25) : mix('#FBF6EA', target, (k - 0.25) / 0.75));
    });
  }
  const b = p.balkans;
  if (b?.serbiaPulse) st.SRB = {...st.SRB, fill: mix(st.SRB.fill, '#C9564A', b.serbiaPulse), pulse: b.serbiaPulse};
  if (b?.ahBorder) st.AH = {...st.AH, edge: '#3E3426', edgeAmount: b.ahBorder};
  const j = p.july;
  if (j?.declare) {
    const steps: State14[][] = [['AH', 'SRB'], ['RUS'], ['GER'], ['FRA'], ['BEL', 'GBR']];
    steps.forEach((ss, i) => {
      const k = seg(j.declare!, i + 0.2, i + 0.8);
      ss.forEach((s) => {
        if (k > 0) set(s, mix(st[s].fill, s === 'SRB' ? '#B5574A' : s === 'BEL' ? P.entente : deepOf(st[s].fill), k));
      });
    });
  }
  const c = p.collapse;
  if (c) {
    const grey = '#B4B0A6';
    if (c.bulgaria) set('BGR', mix(st.BGR.fill, grey, c.bulgaria));
    if (c.ottoman) set('OTT', mix(st.OTT.fill, grey, c.ottoman));
    if (c.austria) set('AH', mix(st.AH.fill, grey, c.austria));
  }
  if (p.styles) for (const [k, v] of Object.entries(p.styles)) st[k as State14] = {...st[k as State14], ...v};
  return st;
}

/** The 1914 state layer + faint 1914 borders, for any GeoMap kind (europe / eastFront / wall maps). */
export const Layers1914: React.FC<{kind: 'europe' | 'eastFront'; z: number; clipId: string; focus: [number, number]; f: number; styles: Record<State14, StateStyle>; extra?: React.ReactNode}> = ({kind, z, clipId, focus, f, styles, extra}) => (
  <g>
    <StateLayer kind={kind} z={z} clipId={clipId} focus={focus} f={f} states={ALL14.map((s) => ({key: s, ops: X.STATES_1914[s], style: styles[s]}))} />
    {extra}
    <Borders d={borderPath(kind, '1914', X.MODERN_TO_1914, X.MESH_EXCLUDE_1914, X.LINES_1914)} z={z} clipId={clipId} />
  </g>
);

const CAPS = ['London', 'Paris', 'Berlin', 'Vienna', 'St Petersburg', 'Rome', 'Constantinople'];
const peopleColors = ['#C9564A', '#3F6EA6', '#E3C77A', '#5E8C4E', '#8A5A9A', '#D98A3A'];

export const MapEurope1914: React.FC<Europe1914Props> = (p) => {
  const {f, cam = CAM_1914.europe, idSuffix = '', dim = 0} = p;
  const st = styles1914(p);
  const labelSet = p.labelSet ?? (['GER', 'AH', 'RUS', 'FRA', 'GBR', 'ITA', 'OTT'] as State14[]);
  const ahPeople = p.balkans?.peoples
    ? samplePoints('ah-people', 70, [12.5, 43.0, 26.5, 51.0], ['Austria', 'Hungary', 'Czechia', 'Slovakia', 'Slovenia', 'Croatia', 'Bosnia and Herz.'].map(cf).concat([X.GALICIA_1914]), [X.OLD_ROMANIA], 7)
    : [];
  const ruDots = p.july?.declare ? samplePoints('ru-mob', 60, [24, 47, 45, 61], [cf('Russia'), cf('Belarus'), cf('Ukraine')], [X.GALICIA_1914], 11) : [];
  const deDots = p.collapse?.redDots ? samplePoints('de-red', 46, [6, 47.5, 15, 55], [cf('Germany')], [], 13) : [];
  return (
    <GeoMap kind="europe" cam={cam} f={f} idSuffix={idSuffix} dim={dim} land={P.outside} borders={false}
      layers={(ctx) => <Layers1914 {...ctx} kind="europe" f={f} styles={st} />}>
      {({toScreen, z}) => {
        const ts = toScreen;
        const P0 = (n: string) => ts(X.PLACE[n]);
        const b = p.balkans ?? {};
        const w = p.warPlan ?? {};
        const j = p.july ?? {};
        const y18 = p.y1918 ?? {};
        const c = p.collapse ?? {};
        const dbt = p.debate ?? {};
        const ital = clamp(p.italy ?? 0) * (1 - clamp(p.italyNeutral ?? 0));
        return (
          <g>
            {/* alliance links */}
            <LinkLine a={P0('Paris')} b={P0('St Petersburg')} progress={p.entente ?? 0} color={P.ententeDeep} width={9} bend={-0.12} />
            <LinkLine a={P0('London')} b={P0('Paris')} progress={p.britain ?? 0} style="dotted" color={P.ententeDeep} width={9} bend={0.3} />
            <LinkLine a={P0('London')} b={P0('St Petersburg')} progress={p.britain ?? 0} style="dotted" color={P.ententeDeep} width={9} bend={-0.1} />
            <LinkLine a={P0('Berlin')} b={P0('Vienna')} progress={p.central ?? 0} color={P.centralDeep} width={9} bend={0.2} />
            <LinkLine a={P0('Rome')} b={P0('Vienna')} progress={ital} style="dashed" color={P.centralDeep} width={7} bend={-0.15} />
            <LinkLine a={P0('Rome')} b={P0('Berlin')} progress={ital} style="dashed" color={P.centralDeep} width={7} bend={0.12} />
            {/* Balkans: many peoples, tension arrows */}
            {ahPeople.map((q, i) => {
              const d = Math.hypot(q[0] - 17, q[1] - 47);
              const k = pop(clamp((b.peoples ?? 0) * 1.6 - d / 14));
              if (k <= 0) return null;
              const s = ts(q);
              return <circle key={i} cx={s[0]} cy={s[1]} r={(5 + 2 * Math.sin(f / 9 + i)) * Math.min(1.6, z / 1.6) * k} fill={peopleColors[i % 6]} stroke={ink} strokeWidth={2} />;
            })}
            {(b.tension ?? 0) > 0 && (
              <g>
                <MapArrow pts={pts(ts, [[17.6, 44.05], [18.6, 44.2], [19.1, 44.22]])} progress={b.tension!} color={P.centralDeep} width={16} />
                <MapArrow pts={pts(ts, [[21.0, 44.1], [20.1, 44.15], [19.55, 44.12]])} progress={b.tension!} color="#B5574A" width={16} />
              </g>
            )}
            {(b.labels ?? 0) > 0 && (
              <g opacity={b.labels}>
                <SafeLabel at={ts([21.25, 43.35])} text="SERBIA" size={40} color={C.darkRed} />
                <SafeLabel at={ts([17.6, 44.15])} text="BOSNIA" size={38} />
                <SafeLabel at={ts([17.6, 44.15])} dy={38} text="(ruled by" size={36} weight={700} />
                <SafeLabel at={ts([17.6, 44.15])} dy={76} text="Austria-Hungary)" size={36} weight={700} />
                <SafeLabel at={ts([18.6, 47.1])} text="AUSTRIA-HUNGARY" size={40} />
                <CityMarker at={P0('Vienna')} name="VIENNA" f={f} size={36} color={ink} pulse={false} labelDx={-20} labelDy={-26} />
                <CityMarker at={P0('Belgrade')} name="BELGRADE" f={f} size={36} labelDx={130} labelDy={12} />
              </g>
            )}
            {/* war plan (S02-06) */}
            <MapArrow pts={pts(ts, [[7.0, 51.0], [5.7, 50.75], [4.4, 50.75], [3.3, 50.2], [2.7, 49.55], [2.45, 49.0]])} progress={w.west ?? 0} color={P.centralDeep} width={30} />
            <MapArrow pts={pts(ts, [[12.0, 52.0], [15.5, 52.6], [19.5, 53.0], [23.0, 53.5], [26.5, 54.3]])} progress={w.east ?? 0} color={P.centralDeep} width={30} />
            {(w.trains ?? 0) > 0 &&
              [0, 1, 2].map((i) => {
                const route = (w.east ?? 0) > 0.05 ? pts(ts, [[12.0, 52.0], [15.5, 52.6], [19.5, 53.0], [23.0, 53.5]]) : pts(ts, [[8.5, 51.2], [7.0, 51.0], [5.7, 50.75], [4.4, 50.75]]);
                const t = clamp(((w.trains ?? 0) * 1.4 - i * 0.2) % 1.0001);
                const a = along(route, t);
                return <TrainIcon key={i} x={a.p[0]} y={a.p[1] - 26} ang={a.ang} s={0.75} f={f + i * 9} />;
              })}
            {(w.stopwatch ?? 0) > 0 && <Stopwatch x={1700} y={300} spin={f / 30} opacity={w.stopwatch} s={0.95} />}
            {/* July Crisis (S03-04, S03-05) */}
            {(j.ultimatum ?? 0) > 0 && (j.reply ?? 0) < 0.02 && <MapArrow pts={pts(ts, [[16.5, 48.1], [18.7, 46.6], [20.3, 45.1]])} progress={j.ultimatum!} color="#F5EFDF" width={12} dashed />}
            {(j.ultimatum ?? 0) > 0 && (j.reply ?? 0) < 0.02 && (() => {
              const a = along(pts(ts, [[16.5, 48.1], [18.7, 46.6], [20.3, 45.1]]), easeInOut(clamp(j.ultimatum!)));
              return <Envelope x={a.p[0]} y={a.p[1] - 34} s={1.2} rot={-8 + Math.sin(f / 6) * 4} />;
            })()}
            {(j.reply ?? 0) > 0 && (() => {
              const route = pts(ts, [[20.3, 45.1], [18.7, 46.6], [16.5, 48.1]]);
              const a = along(route, easeInOut(clamp(j.reply!)));
              return (
                <g>
                  <MapArrow pts={route} progress={j.reply!} color="#F5EFDF" width={12} dashed />
                  <Envelope x={a.p[0]} y={a.p[1] - 34} s={1.2} rot={8} seal={C.militaryGreen} />
                  {(j.ticks ?? 0) > 0 && <TickList x={a.p[0] + 230} y={a.p[1] - 40} marks="vvvvx" shown={j.ticks!} />}
                </g>
              );
            })()}
            {(j.clock ?? 0) > 0 && <HourDial x={1700} y={280} sweep={j.clock!} opacity={clamp(j.clock! * 8) * (1 - seg(j.reply ?? 0, 0.6, 1))} />}
            {(j.declare ?? 0) > 0 && (
              <g>
                <MapArrow pts={pts(ts, [[16.6, 48.0], [18.6, 46.4], [20.2, 45.1]])} progress={seg(j.declare!, 0, 0.8)} color={P.centralDeep} width={22} />
                {ruDots.map((q, i) => {
                  const d = Math.hypot(q[0] - 30.3, (q[1] - 59.9) * 1.6);
                  const k = pop(clamp((j.declare! - 1) * 2.2 - d / 12));
                  if (k <= 0) return null;
                  const s = ts(q);
                  return <circle key={i} cx={s[0]} cy={s[1]} r={6 * k} fill={P.ententeDeep} stroke={ink} strokeWidth={2} />;
                })}
                <MapArrow pts={pts(ts, [[13.8, 52.6], [17.5, 52.8], [21.2, 53.2]])} progress={seg(j.declare!, 2, 2.8)} color={P.centralDeep} width={22} />
                <MapArrow pts={pts(ts, [[8.6, 49.6], [6.7, 49.05], [5.0, 48.75]])} progress={seg(j.declare!, 3, 3.8)} color={P.centralDeep} width={22} />
                <MapArrow pts={pts(ts, [[7.4, 50.95], [5.9, 50.72], [4.5, 50.78]])} progress={seg(j.declare!, 4, 4.8)} color={P.centralDeep} width={34} />
              </g>
            )}
            {(j.marchers ?? 0) > 0 &&
              Array.from({length: 14}).map((_, i) => {
                const lane = i % 4;
                const t = clamp((j.marchers! * 1.5 - (i / 14) * 0.5) % 1.0001);
                const a = ts([lerp(6.6, 4.9, t), 50.95 - lane * 0.14 - t * 0.12]);
                return <Marcher key={i} x={a[0]} y={a[1]} s={Math.min(1.6, z / 1.6)} f={f} seed={i} />;
              })}
            {(j.calendarShow ?? (j.calendar !== undefined ? 1 : 0)) > 0 && j.calendar !== undefined && (
              <FlipCalendar x={1700} y={430} idx={j.calendar} entries={['28 JUL', '30–31 JUL', '1 AUG', '3 AUG', '4 AUG']} opacity={j.calendarShow ?? 1} />
            )}
            {/* 1918: troops move west by train; Americans cross the Atlantic */}
            {(y18.trains ?? 0) > 0 &&
              [0, 1, 2, 3].map((i) => {
                const route = pts(ts, [[23.7, 52.1], [21.0, 52.3], [17.0, 52.4], [13.4, 52.5], [10.0, 51.6], [7.0, 50.9], [4.8, 50.2], [3.3, 49.85]]);
                const t = clamp(y18.trains! * 1.6 - i * 0.2);
                if (t <= 0 || t >= 1) return null;
                const a = along(route, t);
                return <TrainIcon key={i} x={a.p[0]} y={a.p[1] - 20} ang={a.ang} s={0.8} f={f + i * 7} />;
              })}
            {(y18.usShip ?? 0) > 0 && (() => {
              const a = ts([lerp(-24, -7, easeInOut(clamp(y18.usShip!))), lerp(46.0, 47.4, clamp(y18.usShip!))]);
              return <ShipIcon x={a[0]} y={a[1]} s={1.1} f={f} color="#5E6E7E" />;
            })()}
            {/* autumn 1918 collapse */}
            <TickTag at={ts([25.3, 42.7])} text="29 SEPT" opacity={seg(c.bulgaria ?? 0, 0.5, 1)} />
            <TickTag at={ts([33.0, 39.4])} text="30 OCT" opacity={seg(c.ottoman ?? 0, 0.5, 1)} />
            <TickTag at={ts([18.8, 47.4])} text="3 NOV" opacity={seg(c.austria ?? 0, 0.5, 1)} />
            {(c.kiel ?? 0) > 0 && <RedFlagIcon x={P0('Kiel')[0]} y={P0('Kiel')[1]} f={f} pop={c.kiel!} s={1.1} />}
            {deDots.map((q, i) => {
              const d = Math.hypot(q[0] - 10.1, q[1] - 54.3);
              const k = pop(clamp((c.redDots ?? 0) * 1.6 - d / 9));
              if (k <= 0) return null;
              const s = ts(q);
              return <circle key={i} cx={s[0]} cy={s[1]} r={7 * k} fill={C.red} stroke={ink} strokeWidth={2} />;
            })}
            {(c.kaiser ?? 0) > 0 && (() => {
              const a = ts([lerp(13.4, 5.5, easeInOut(clamp(c.kaiser!))), lerp(52.52, 52.05, clamp(c.kaiser!))]);
              return <CrownIcon x={a[0]} y={a[1] - 10} s={1.1} rot={Math.sin(f / 8) * 5} />;
            })()}
            {/* historians' debate minis (S03-08) */}
            {(dbt.fischer ?? 0) > 0 && (
              <g>
                <MapArrow pts={pts(ts, [[9.0, 48.6], [11.4, 50.7], [12.9, 52.1]])} progress={dbt.fischer!} color={C.red} width={26} />
                <MapArrow pts={pts(ts, [[12.0, 45.6], [14.4, 46.9], [15.9, 47.95]])} progress={seg(dbt.fischer!, 0.3, 1)} color={C.red} width={26} />
              </g>
            )}
            {(dbt.clark ?? 0) > 0 &&
              ([['Vienna', 'Belgrade'], ['Berlin', 'Vienna'], ['St Petersburg', 'Belgrade'], ['Paris', 'St Petersburg'], ['London', 'Paris'], ['Berlin', 'Paris'], ['Vienna', 'St Petersburg'], ['London', 'Berlin'], ['Belgrade', 'Vienna']] as [string, string][]).map(([a, bb], i) => (
                <MapArrow key={i} pts={[P0(a), [(P0(a)[0] + P0(bb)[0]) / 2 + (i % 2 ? 40 : -40), (P0(a)[1] + P0(bb)[1]) / 2 + (i % 3 ? -30 : 30)], P0(bb)]} progress={seg(dbt.clark!, i * 0.08, i * 0.08 + 0.4)} color={i % 2 ? '#5E523E' : C.red} width={9} />
              ))}
            {/* state labels + capitals */}
            {(p.labels ?? 0) > 0 &&
              labelSet.map((s) => {
                const at = X.LABEL_1914[s];
                if (!at) return null;
                const big = GREAT.includes(s);
                const name = s === 'ITA' && (p.italyNeutral ?? 0) > 0.5 ? 'ITALY' : X.NAME_1914[s];
                return <SafeLabel key={s} at={ts(at)} text={name} size={big ? 40 : 36} opacity={p.labels} />;
              })}
            {(p.italyNeutral ?? 0) > 0 && (
              <g opacity={seg(p.italyNeutral!, 0.3, 1)}>
                <rect x={ts([12.8, 42.6])[0] - 190} y={ts([12.8, 42.6])[1] + 14} width={380} height={56} rx={10} fill="#F5EFDF" stroke={ink} strokeWidth={4} />
                <text x={ts([12.8, 42.6])[0]} y={ts([12.8, 42.6])[1] + 54} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={36} fill={ink}>NEUTRAL IN 1914</text>
              </g>
            )}
            {(p.capitals ?? 0) > 0 &&
              (p.capitalSet ?? CAPS).map((n) => {
                const a = P0(n);
                return <CityMarker key={n} at={a} f={f} opacity={p.capitals} color={ink} pulse={false} name={undefined} />;
              })}
            {p.children?.({toScreen: ts, z})}
          </g>
        );
      }}
    </GeoMap>
  );
};

// ================================================================== M-02 Western Front
export const CAM_WF = {
  full: {lon: 4.3, lat: 49.4, zoom: 4.6} as Cam,
  belgium: {lon: 4.4, lat: 50.1, zoom: 5.6} as Cam,
  mons: {lon: 3.6, lat: 49.9, zoom: 6.5} as Cam,
  marne: {lon: 3.3, lat: 49.1, zoom: 6.5} as Cam,
  north: {lon: 3.0, lat: 50.3, zoom: 6.0} as Cam,
  verdun: {lon: 5.3, lat: 49.2, zoom: 9.0} as Cam,
  somme: {lon: 2.75, lat: 50.0, zoom: 9.0} as Cam,
  sommeClose: {lon: 2.76, lat: 50.02, zoom: 15} as Cam,
  amiens: {lon: 2.8, lat: 49.9, zoom: 7.5} as Cam,
  trench: {lon: 2.72, lat: 50.0, zoom: 60} as Cam,
};
const APR1918 = [...X.WF_NORTH, ...X.WF_MID_APR1918.slice(1), ...X.WF_SOUTH.slice(1)];

export type WesternFrontProps = {
  f: number;
  cam?: Cam;
  idSuffix?: string;
  /** Aug 1914: German armies sweep through Belgium (0..1). */
  advance?: number;
  /** British arrow at Mons: 0..1 grows and holds; 1..2 bends back south (retreat). */
  mons?: number;
  /** Marne: German arrows fade and fall back to the Aisne (0..1). */
  marne?: number;
  /** "QUICK VICTORY" label: 0 hidden, 0..0.3 shows, 0.3..0.6 cracks, 0.6..1 falls apart. */
  quickVictory?: number;
  /** Race to the sea: four leapfrogging arrow pairs (0..1). */
  race?: number;
  /** Front line draws coast → Swiss border (0..1). */
  front?: number;
  /** Final zoom into the line: it thickens and becomes a top-down zig-zag trench (0..1; also moves the camera). */
  trenchZoom?: number;
  /** Little arrows bump against the static line and bounce back (0..1). */
  bumps?: number;
  verdun?: number;
  somme?: number;
  sommeLink?: number;
  /** Somme 1916: the line creeps east a few miles (0..1). */
  sommeCreep?: number;
  sommeDots?: number;
  /** Spring Offensive 1918: bulge towards Amiens (0..1). */
  spring?: number;
  /** Hundred Days: the front is pushed back to about Mons by 11 November (0..1). */
  hundred?: number;
  /** Hatched German-occupied territory behind the front (0..1). */
  occupied?: number;
  /** Era for the static line when no 1918 progress is given. */
  era?: '1915' | '1918';
  labels?: number;
  cities?: string[];
  children?: (ctx: {toScreen: ToScreen; z: number}) => React.ReactNode;
};

export function westernFront(p: Pick<WesternFrontProps, 'spring' | 'hundred' | 'era'>): LL[] {
  if ((p.hundred ?? 0) > 0) return lerpLine(APR1918, X.WF_NOV1918, easeInOut(clamp(p.hundred!)), 60);
  if ((p.spring ?? 0) > 0) return [...X.WF_NORTH, ...lerpLine(X.WF_MID_MAR1918, X.WF_MID_APR1918, easeOut(clamp(p.spring!)), 14).slice(1), ...X.WF_SOUTH.slice(1)];
  return p.era === '1918' ? X.WF_MAR1918 : X.WF_1915;
}
const WF_STYLE = (): Record<State14, StateStyle> => {
  const st = styles1914({base: 'war1914', f: 0});
  st.GBR = {fill: P.ententeLight};
  st.BEL = {fill: mix(P.entente, P.ententeLight, 0.5)};
  return st;
};

/** Top-down zig-zag trench (screen space) for the zoom-in match cut into E-01. */
const TrenchTopDown: React.FC<{k: number; f: number}> = ({k, f}) => {
  if (k <= 0) return null;
  const zz: string[] = [];
  for (let x = -100, i = 0; x <= W + 100; x += 120, i++) zz.push(`${x},${H / 2 + (i % 2 ? -46 : 46)}`);
  const d = 'M' + zz.join(' L');
  return (
    <g opacity={k}>
      <rect x={-50} y={-50} width={W + 100} height={H + 100} fill="#8C7A58" />
      {Array.from({length: 40}).map((_, i) => <circle key={i} cx={(i * 173) % W} cy={(i * 97) % H} r={18 + (i % 4) * 8} fill="#7A6A4C" opacity={0.6} />)}
      <path d={d} fill="none" stroke="#5E4A32" strokeWidth={96} strokeLinejoin="miter" />
      <path d={d} fill="none" stroke="#3E3022" strokeWidth={64} strokeLinejoin="miter" />
      <path d={d} fill="none" stroke="#B5A37A" strokeWidth={10} strokeDasharray="22 10" strokeLinejoin="miter" transform="translate(0,-40)" />
      <path d={d} fill="none" stroke="#A8956A" strokeWidth={10} strokeDasharray="22 10" strokeLinejoin="miter" transform="translate(0,40)" />
      <path d={d} fill="none" stroke="#A88A5E" strokeWidth={14} strokeDasharray="6 10" />
      <path d={`M-50,${H / 2 - 150 + Math.sin(f / 30) * 2} L${W + 50},${H / 2 - 150}`} stroke={ink} strokeWidth={3} strokeDasharray="10 8" opacity={0.6} />
    </g>
  );
};

/** "QUICK VICTORY" label that cracks and falls apart. */
const CrackLabel: React.FC<{at: [number, number]; t: number; id: string}> = ({at, t, id}) => {
  if (t <= 0 || t >= 1) return null;
  const show = seg(t, 0, 0.15, easeOut);
  const crack = seg(t, 0.3, 0.6);
  const fall = seg(t, 0.6, 1, easeIn);
  const [x, y] = at;
  const label = (
    <g>
      <rect x={x - 240} y={y - 44} width={480} height={80} rx={12} fill="#F5EFDF" stroke={ink} strokeWidth={5} />
      <text x={x} y={y + 14} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={44} fill={C.darkRed}>QUICK VICTORY</text>
    </g>
  );
  const cd = `M${x + 10},${y - 50} L${x - 14},${y - 18} L${x + 16},${y + 4} L${x - 8},${y + 24} L${x + 6},${y + 44}`;
  return (
    <g opacity={show * (1 - fall)}>
      <defs>
        <clipPath id={`${id}-l`}><path d={`M${x - 300},${y - 60} L${x + 10},${y - 60} L${x - 14},${y - 18} L${x + 16},${y + 4} L${x - 8},${y + 24} L${x + 6},${y + 60} L${x - 300},${y + 60}Z`} /></clipPath>
        <clipPath id={`${id}-r`}><path d={`M${x + 300},${y - 60} L${x + 10},${y - 60} L${x - 14},${y - 18} L${x + 16},${y + 4} L${x - 8},${y + 24} L${x + 6},${y + 60} L${x + 300},${y + 60}Z`} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-l)`} transform={`translate(${-fall * 40},${fall * 70}) rotate(${-fall * 8},${x},${y})`}>{label}</g>
      <g clipPath={`url(#${id}-r)`} transform={`translate(${fall * 40},${fall * 90}) rotate(${fall * 10},${x},${y})`}>{label}</g>
      {crack > 0 && <path d={cd} fill="none" stroke={ink} strokeWidth={6} pathLength={1} strokeDasharray={`${crack} 1`} />}
    </g>
  );
};

export const MapWesternFront: React.FC<WesternFrontProps> = (p) => {
  const {f, idSuffix = ''} = p;
  const cam = (p.trenchZoom ?? 0) > 0 ? camLerp(p.cam ?? CAM_WF.full, CAM_WF.trench, easeIn(clamp(p.trenchZoom!))) : p.cam ?? CAM_WF.full;
  const st = WF_STYLE();
  const front = westernFront(p);
  const occ = clamp(p.occupied ?? 0);
  // occupied France/Belgium/Luxembourg = east of the front, minus Germany, the Netherlands and Switzerland
  const occPoly = occ > 0 ? poly([...front, [9.5, 47.2], [9.5, 52.0], [front[0][0] + 0.6, 51.9], [front[0][0] - 0.3, 51.4]]) : null;
  const bulge = (p.spring ?? 0) > 0 && !(p.hundred ?? 0) ? poly([...X.WF_MID_MAR1918, ...lerpLine(X.WF_MID_MAR1918, X.WF_MID_APR1918, easeOut(clamp(p.spring!)), 14).slice().reverse()]) : null;
  const sommeNow = lerpLine(X.SOMME_JUL1916, X.SOMME_NOV1916, easeInOut(clamp(p.sommeCreep ?? 0)), 10);
  const sliver = (p.sommeCreep ?? 0) > 0 ? poly([...X.SOMME_JUL1916, ...sommeNow.slice().reverse()]) : null;
  const cities = p.cities ?? ['Paris', 'Mons', 'Ypres', 'Arras', 'Amiens', 'Verdun', 'Compiègne', 'Nieuport'];
  const labelOff: Record<string, [number, number]> = {Paris: [0, 44], Mons: [-30, 46], Ypres: [-70, -18], Arras: [-74, 10], Amiens: [-30, 44], Verdun: [0, 46], 'Compiègne': [-10, 44], Nieuport: [-40, -24], Albert: [-70, 0]};
  return (
    <GeoMap kind="europe" cam={cam} f={f} idSuffix={idSuffix} land={P.outside} borders={false}
      layers={(ctx) => (
        <Layers1914 {...ctx} kind="europe" f={f} styles={st}
          extra={
            <g>
              {occPoly && (
                <StateLayer {...ctx} kind="europe" f={f} tag="occ" states={[{key: 'occ', ops: [{add: occPoly}, {sub: 'Germany'}, {sub: ALSACE_LORRAINE}, {sub: 'Netherlands'}, {sub: 'Switzerland'}, {sub: 'United Kingdom'}], style: {fill: mix(P.entente, P.central, 0.55), opacity: occ, hatch: P.centralDeep, hatchOpacity: 0.6}}]} />
              )}
              {bulge && <StateLayer {...ctx} kind="europe" f={f} tag="blg" states={[{key: 'b', ops: [{add: bulge}], style: {fill: P.central, opacity: 0.95, hatch: P.centralDeep, hatchOpacity: 0.5}}]} />}
              {sliver && <StateLayer {...ctx} kind="europe" f={f} tag="slv" states={[{key: 's', ops: [{add: sliver}], style: {fill: '#E9D27A', opacity: 0.95}}]} />}
            </g>
          }
        />
      )}>
      {({toScreen, z}) => {
        const ts = toScreen;
        const A = X.WF_ARROWS;
        const mons = p.mons ?? 0;
        const marne = clamp(p.marne ?? 0);
        const adv = clamp(p.advance ?? 0) * (1 - seg(marne, 0, 0.5));
        const race = clamp(p.race ?? 0);
        const tz = clamp(p.trenchZoom ?? 0);
        const fw = 8 + 26 * seg(tz, 0, 0.5);
        const bumps = p.bumps ?? 0;
        const sp = clamp(p.spring ?? 0);
        const hd = clamp(p.hundred ?? 0);
        return (
          <g>
            {/* 1914 advance + Mons + Marne */}
            <MapArrow pts={pts(ts, A.germanRight)} progress={adv} color={P.centralDeep} width={30} />
            <MapArrow pts={pts(ts, A.germanCentre)} progress={adv * 0.95} color={P.centralDeep} width={30} />
            <MapArrow pts={pts(ts, A.germanLeft)} progress={adv * 0.9} color={P.centralDeep} width={30} />
            {mons > 0 && mons < 1.05 && <MapArrow pts={pts(ts, A.britishMons)} progress={clamp(mons)} color={P.ententeLight} width={26} />}
            {mons > 1 && <MapArrow pts={pts(ts, A.britishRetreat)} progress={clamp(mons - 1)} color={P.ententeLight} width={22} />}
            {marne > 0 && (
              <g>
                <MapArrow pts={pts(ts, A.marneBack)} progress={seg(marne, 0.3, 1)} color={P.centralDeep} width={26} />
                <MapArrow pts={pts(ts, A.marneBack2)} progress={seg(marne, 0.35, 1)} color={P.centralDeep} width={26} />
                <FrontLine pts={[[2.9, 49.42], [3.3, 49.42], [3.7, 49.42], [4.05, 49.3]]} toScreen={ts} progress={seg(marne, 0.7, 1)} color={P.centralDeep} width={8} style="line" />
                <SafeLabel at={ts([3.5, 49.42])} dy={-26} text="THE AISNE" size={36} opacity={seg(marne, 0.75, 1)} />
              </g>
            )}
            <CrackLabel at={ts([3.4, 48.45])} t={p.quickVictory ?? 0} id={`qv${idSuffix}`} />
            {/* race to the sea */}
            {race > 0 &&
              X.RACE_PAIRS.map((pr, i) => {
                const k = seg(race, i * 0.22, i * 0.22 + 0.3);
                return (
                  <g key={i} opacity={1 - 0.5 * seg(race, i * 0.22 + 0.35, i * 0.22 + 0.6)}>
                    <MapArrow pts={pts(ts, pr.allied)} progress={k} color={P.entente} width={20} />
                    <MapArrow pts={pts(ts, pr.german)} progress={seg(race, i * 0.22 + 0.05, i * 0.22 + 0.35)} color={P.centralDeep} width={20} />
                  </g>
                );
              })}
            {/* the front line */}
            {(p.front ?? 0) > 0 && <FrontLine pts={front} toScreen={ts} progress={p.front} color={C.red} width={fw} style="front" teethSide={-1} />}
            {/* 1915 bumps */}
            {bumps > 0 &&
              A.bumps.map((b, i) => {
                const t = clamp(bumps * 1.4 - i * 0.07);
                const k = Math.sin(Math.PI * t) * 0.95;
                return <MapArrow key={i} pts={pts(ts, b)} progress={k} color={i % 2 ? P.centralDeep : P.entente} width={16} />;
              })}
            {/* Verdun + Somme */}
            {(p.verdun ?? 0) > 0 && (
              <g>
                {A.verdun.map((v, i) => <MapArrow key={i} pts={pts(ts, v)} progress={seg(p.verdun!, 0.1 + i * 0.1, 0.6 + i * 0.1)} color={P.centralDeep} width={22} />)}
                <MapArrow pts={pts(ts, A.voieSacree)} progress={seg(p.verdun!, 0.5, 1)} color={P.entente} width={20} />
                <CityMarker at={ts(X.PLACE.Verdun)} f={f} color={C.red} size={40} name="VERDUN" labelDy={56} />
              </g>
            )}
            {(p.somme ?? 0) > 0 && <MapArrow pts={pts(ts, A.somme)} progress={p.somme!} color={P.ententeLight} width={26} />}
            {(p.sommeLink ?? 0) > 0 && <LinkLine a={ts([2.85, 50.0])} b={ts(X.PLACE.Verdun)} progress={p.sommeLink!} style="dashed" color={C.darkRed} width={8} bend={0.12} />}
            {(p.sommeCreep ?? 0) > 0 && (
              <g>
                <FrontLine pts={sommeNow} toScreen={ts} color={C.red} width={9} style="front" teethSide={-1} />
                <SafeLabel at={ts([2.78, 50.03])} dy={-70} text="A FEW MILES" size={44} opacity={seg(p.sommeCreep!, 0.3, 0.7)} />
              </g>
            )}
            {(p.sommeDots ?? 0) > 0 &&
              Array.from({length: 40}).map((_, i) => {
                const k = clamp(p.sommeDots! * 40 - i);
                if (k <= 0) return null;
                const side = i % 2 ? -1 : 1;
                const lat = 49.94 + ((i * 37) % 17) / 100;
                const lon = 2.74 + side * (0.05 + ((i * 53) % 11) / 100);
                const q = ts([lon, lat]);
                return <circle key={i} cx={q[0]} cy={q[1]} r={7 * pop(k)} fill="#8A8C8E" stroke={ink} strokeWidth={2} opacity={0.9} />;
              })}
            {/* 1918 */}
            {sp > 0 && !hd && (
              <g>
                <MapArrow pts={pts(ts, [[3.25, 50.05], [2.95, 49.95], [2.62, 49.85]])} progress={sp} color={P.centralDeep} width={26} />
                <MapArrow pts={pts(ts, [[3.4, 49.72], [3.0, 49.68], [2.7, 49.68]])} progress={sp * 0.9} color={P.centralDeep} width={26} />
                <CityMarker at={ts(X.PLACE.Amiens)} f={f} color={C.red} name="AMIENS" size={38} labelDy={46} />
              </g>
            )}
            {hd > 0 &&
              ([[[2.6, 49.85], [3.4, 50.05], [3.9, 50.4]], [[2.9, 49.6], [3.8, 49.75], [4.4, 50.0]], [[3.2, 50.75], [3.6, 50.85]], [[4.2, 49.4], [4.8, 49.6]]] as LL[][]).map((a, i) => (
                <MapArrow key={i} pts={pts(ts, a)} progress={seg(hd, i * 0.12, 0.6 + i * 0.1)} color={P.entente} width={24} />
              ))}
            {/* labels */}
            {(p.labels ?? 1) > 0 && tz < 0.5 && (
              <g opacity={(p.labels ?? 1) * (1 - seg(tz, 0, 0.4))}>
                <SafeLabel at={ts([5.05, 50.9])} text="BELGIUM" size={40} />
                <SafeLabel at={ts([2.9, 48.25])} text="FRANCE" size={44} />
                <SafeLabel at={ts([7.6, 50.3])} text="GERMANY" size={44} />
                <SafeLabel at={ts([5.6, 52.3])} text="NETHERLANDS" size={36} />
                {cities.map((n) => {
                  const o = labelOff[n] ?? [0, -24];
                  return <CityMarker key={n} at={ts(X.PLACE[n])} f={f} color={ink} pulse={false} name={n === 'Albert' ? 'THE SOMME' : n.toUpperCase()} size={36} labelDx={o[0]} labelDy={o[1]} />;
                })}
              </g>
            )}
            <TrenchTopDown k={seg(tz, 0.55, 1)} f={f} />
            {p.children?.({toScreen: ts, z})}
          </g>
        );
      }}
    </GeoMap>
  );
};

/** M-02 wall-map inset for Foch's HQ (S10-02): the 1918 bulge with arrows that reverse at `reverse` 0.5. */
export const WesternFrontWallMap: React.FC<{x: number; y: number; w: number; f: number; reverse?: number; id?: string}> = ({x, y, w, f, reverse = 0, id = 'foch'}) => {
  const st = WF_STYLE();
  const r = clamp(reverse);
  const front = westernFront({spring: 1});
  return (
    <WallMap x={x} y={y} w={w} kind="europe" cam={{lon: 3.6, lat: 49.6, zoom: 5.2}} f={f} id={id} borders={false}
      layers={(ctx) => <Layers1914 {...ctx} kind="europe" f={f} styles={st} />}>
      {({toScreen}) => (
        <g>
          <FrontLine pts={front} toScreen={toScreen} color={C.red} width={12} style="front" teethSide={-1} />
          {[[[3.4, 50.0], [2.8, 49.9]], [[3.5, 49.7], [2.9, 49.65]]].map((a, i) => (
            <MapArrow key={'g' + i} pts={pts(toScreen, a as LL[])} progress={(1 - seg(r, 0.3, 0.5)) * 0.9} color={P.centralDeep} width={40} />
          ))}
          {[[[2.5, 49.9], [3.3, 50.05]], [[2.6, 49.6], [3.4, 49.7]], [[3.6, 49.35], [4.3, 49.5]]].map((a, i) => (
            <MapArrow key={'a' + i} pts={pts(toScreen, a as LL[])} progress={seg(r, 0.5, 0.9 + i * 0.03)} color={P.entente} width={40} />
          ))}
          <MapLabel at={toScreen([2.3, 49.89])} dy={-30} text="AMIENS" size={60} />
        </g>
      )}
    </WallMap>
  );
};

// ================================================================== M-03 Eastern Front
export const CAM_EF = {
  tannenberg: {lon: 20.8, lat: 53.55, zoom: 3.4} as Cam,
  poland: {lon: 22.5, lat: 52.5, zoom: 1.5} as Cam,
  brest: {lon: 28.0, lat: 54.0, zoom: 0.62} as Cam,
};
export type EasternFrontProps = {
  f: number;
  cam?: Cam;
  idSuffix?: string;
  /** Russian Second Army arrow into East Prussia (0..1). */
  tannenberg?: number;
  /** German pincers close round it (0..1). */
  pincers?: number;
  /** The Russian arrow breaks up and fades (0..1). */
  breakup?: number;
  /** Eastern front line, winter 1917–18 (0..1 draw). */
  front1917?: number;
  /** Brest-Litovsk hatch over the lands Russia gave up (0..1). */
  brest?: number;
  /** The front line vanishes (0..1). */
  frontVanish?: number;
  labels?: number;
  brestLabels?: number;
  children?: (ctx: {toScreen: ToScreen; z: number}) => React.ReactNode;
};
export const MapEasternFront: React.FC<EasternFrontProps> = (p) => {
  const {f, cam = CAM_EF.tannenberg, idSuffix = ''} = p;
  const st = styles1914({base: 'war1914', f});
  st.ROU = {fill: P.neutral};
  st.OTT = {fill: P.minor};
  const br = clamp(p.brest ?? 0);
  const lost = [{add: 'Finland'}, {add: 'Estonia'}, {add: 'Latvia'}, {add: 'Lithuania'}, {add: 'Poland'}, {add: X.BREST_BELARUS}, {add: 'Ukraine'}, {sub: X.GERMAN_EAST_1914}, {sub: X.GALICIA_1914}] as X.Op[];
  return (
    <GeoMap kind="eastFront" cam={cam} f={f} idSuffix={idSuffix} land={P.outside} borders={false}
      layers={(ctx) => (
        <Layers1914 {...ctx} kind="eastFront" f={f} styles={st}
          extra={br > 0 ? <StateLayer {...ctx} kind="eastFront" f={f} tag="bl" states={[{key: 'lost', ops: lost, style: {fill: mix(P.entente, '#E9DCC4', 0.55), opacity: br, hatch: P.hatchLost, hatchOpacity: 0.75}}]} /> : null}
        />
      )}>
      {({toScreen, z}) => {
        const ts = toScreen;
        const T = X.TANNENBERG;
        const brk = clamp(p.breakup ?? 0);
        const rArrow = pts(ts, T.russianArrow);
        return (
          <g>
            {(p.tannenberg ?? 0) > 0 && <MapArrow pts={rArrow} progress={p.tannenberg!} color={P.ententeDeep} width={30} opacity={1 - seg(brk, 0, 0.4)} />}
            {brk > 0 &&
              Array.from({length: 9}).map((_, i) => {
                const a = along(rArrow, (i + 0.5) / 9);
                const dx = Math.cos(i * 2.3) * 60 * brk;
                const dy = Math.sin(i * 2.3) * 60 * brk;
                return <rect key={i} x={a.p[0] + dx - 14} y={a.p[1] + dy - 10} width={28} height={20} rx={4} fill={P.ententeDeep} stroke={ink} strokeWidth={3} opacity={clamp(1 - brk * 1.1) * clamp(brk * 6)} transform={`rotate(${i * 40 * brk},${a.p[0] + dx},${a.p[1] + dy})`} />;
              })}
            <MapArrow pts={pts(ts, T.germanWest)} progress={p.pincers ?? 0} color={P.centralDeep} width={26} />
            <MapArrow pts={pts(ts, T.germanEast)} progress={seg(p.pincers ?? 0, 0.1, 1)} color={P.centralDeep} width={26} />
            {(p.front1917 ?? 0) > 0 && <FrontLine pts={X.EAST_FRONT_1917} toScreen={ts} progress={p.front1917} color={C.red} width={8} style="front" opacity={1 - clamp(p.frontVanish ?? 0)} />}
            {(p.labels ?? 1) > 0 && (
              <g opacity={p.labels ?? 1}>
                <SafeLabel at={ts([21.0, 54.15])} text="EAST PRUSSIA" size={40} />
                <SafeLabel at={ts([cam.zoom > 1.5 ? 23.6 : 34, cam.zoom > 1.5 ? 52.4 : 55.5])} text="RUSSIA" size={44} />
                {cam.zoom > 1.5 && <CityMarker at={ts(X.PLACE.Tannenberg)} f={f} color={C.red} name="TANNENBERG" size={36} labelDy={48} opacity={clamp((p.pincers ?? 0) * 3)} />}
                {cam.zoom > 1.5 && <CityMarker at={ts(X.PLACE.Warsaw)} f={f} color={ink} pulse={false} name="WARSAW" size={36} labelDy={44} />}
                {cam.zoom <= 1.5 && <SafeLabel at={ts([11.5, 51.0])} text="GERMANY" size={40} />}
              </g>
            )}
            {(p.brestLabels ?? 0) > 0 && (
              <g opacity={p.brestLabels}>
                <rect x={W / 2 - 520} y={170} width={1040} height={130} rx={14} fill="#F5EFDF" stroke={ink} strokeWidth={5} />
                <text x={W / 2} y={226} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={42} fill={ink}>TREATY OF BREST-LITOVSK · MARCH 1918</text>
                <text x={W / 2} y={278} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={36} fill={P.hatchLost}>lands given up (approx.)</text>
              </g>
            )}
            {p.children?.({toScreen: ts, z})}
          </g>
        );
      }}
    </GeoMap>
  );
};

// ================================================================== M-04 Gallipoli
export const CAM_GP = {wide: {lon: 26.35, lat: 40.2, zoom: 1.0} as Cam, peninsula: {lon: 26.3, lat: 40.17, zoom: 1.6} as Cam};
const GP_BOX = poly([[25.2, 39.5], [27.8, 39.5], [27.8, 41.0], [25.2, 41.0]]);
const IMBROS_TENEDOS = [poly([[25.6, 40.05], [26.05, 40.05], [26.05, 40.28], [25.6, 40.28]]), poly([[25.92, 39.76], [26.12, 39.76], [26.12, 39.9], [25.92, 39.9]])];
export type GallipoliProps = {
  f: number;
  cam?: Cam;
  idSuffix?: string;
  /** Allied ship icons approach from the Aegean (0..1). */
  ships?: number;
  /** Landing arrows at Cape Helles and Anzac Cove (0..1). */
  landings?: number;
  /** The Ottoman Empire fills in Central colour (0..1). */
  ottoman?: number;
  /** Inset with Constantinople and the Ottoman–German link (0..1). */
  inset?: number;
  labels?: number;
  suvla?: boolean;
};
export const MapGallipoli: React.FC<GallipoliProps> = (p) => {
  const {f, cam = CAM_GP.wide, idSuffix = ''} = p;
  const ot = clamp(p.ottoman ?? 0);
  const G = X.GALLIPOLI;
  const ins = clamp(p.inset ?? 0);
  return (
    <g>
      <GeoMap kind="gallipoli" cam={cam} f={f} idSuffix={idSuffix} land={P.neutral} borders={false} seaLines={14}
        layers={(ctx) => (
          <StateLayer {...ctx} kind="gallipoli" f={f} tag="gp" states={[{key: 'ott', ops: [{add: GP_BOX}, ...IMBROS_TENEDOS.map((x) => ({sub: x}))], style: {fill: mix(P.neutral, P.central, ot)}}]} />
        )}>
        {({toScreen}) => {
          const ts = toScreen;
          const sh = clamp(p.ships ?? 0);
          return (
            <g>
              {sh > 0 &&
                G.ships.map((s, i) => {
                  const tgt = i % 2 ? G.landingAnzac[0] : G.landingHelles[0];
                  const ll: LL = [lerp(s[0] - 0.35, tgt[0] - 0.04, easeOut(sh)), lerp(s[1] - 0.05, tgt[1] + (i - 1.5) * 0.03, easeOut(sh))];
                  const q = ts(ll);
                  return <ShipIcon key={i} x={q[0]} y={q[1]} s={1.15} f={f} seed={i} />;
                })}
              <MapArrow pts={pts(ts, G.landingHelles)} progress={p.landings ?? 0} color={P.ententeLight} width={26} />
              <MapArrow pts={pts(ts, G.landingAnzac)} progress={seg(p.landings ?? 0, 0.1, 1)} color={P.ententeLight} width={26} />
              {(p.labels ?? 1) > 0 && (
                <g opacity={p.labels ?? 1}>
                  <CityMarker at={ts(G.helles)} f={f} color={C.red} name="CAPE HELLES" size={40} labelDx={150} labelDy={50} pulse={(p.landings ?? 0) > 0.6} />
                  <CityMarker at={ts(G.anzac)} f={f} color={C.red} name="ANZAC COVE" size={40} labelDx={150} labelDy={-20} pulse={(p.landings ?? 0) > 0.6} />
                  {p.suvla && <SafeLabel at={ts(G.suvla)} dy={-40} text="SUVLA BAY" size={36} />}
                  <SafeLabel at={ts([26.62, 40.06])} text="DARDANELLES" size={40} italic color="#2F5A6A" stroke="rgba(255,255,255,0.7)" />
                  <SafeLabel at={ts([26.55, 40.33])} text="GALLIPOLI" size={40} />
                  <SafeLabel at={ts([26.55, 40.33])} dy={42} text="PENINSULA" size={36} />
                  <SafeLabel at={ts([25.75, 39.95])} text="AEGEAN SEA" size={36} italic color="#2F5A6A" stroke="rgba(255,255,255,0.7)" />
                  {ot > 0.3 && <SafeLabel at={ts([27.0, 39.9])} text="OTTOMAN EMPIRE" size={40} opacity={seg(ot, 0.3, 0.8)} />}
                </g>
              )}
            </g>
          );
        }}
      </GeoMap>
      {ins > 0 && <GallipoliInset f={f} k={ins} ottoman={ot} />}
    </g>
  );
};
/** Inset (bottom right, above the caption band): Germany–Austria-Hungary–Ottoman link and Constantinople. */
const GallipoliInset: React.FC<{f: number; k: number; ottoman: number}> = ({f, k, ottoman}) => {
  const st = styles1914({base: 'neutral', f});
  st.GER = {fill: P.central};
  st.AH = {fill: P.central};
  st.OTT = {fill: mix(P.neutral, P.central, ottoman)};
  const x = 1250;
  const y = 520;
  const w = 620;
  const h = (w * H) / W;
  return (
    <g opacity={easeOut(k)} transform={`translate(0,${(1 - easeOut(k)) * 40})`}>
      <rect x={x - 10} y={y - 10} width={w + 20} height={h + 20} rx={10} fill="#F5EFDF" stroke={ink} strokeWidth={5} />
      <svg x={x} y={y} width={w} height={h} viewBox={`0 0 ${W} ${H}`} overflow="hidden">
        <GeoMap kind="europe" cam={{lon: 21.5, lat: 46.5, zoom: 1.45}} f={f} idSuffix="-gpinset" land={P.outside} borders={false} seaLines={0}
          layers={(ctx) => <Layers1914 {...ctx} kind="europe" f={f} styles={st} />}>
          {({toScreen}) => {
            const b = toScreen(X.PLACE.Berlin);
            const c = toScreen(X.PLACE.Constantinople);
            const g = toScreen([26.3, 40.2]);
            return (
              <g>
                <LinkLine a={b} b={c} progress={seg(k, 0.3, 1)} color={P.centralDeep} width={16} bend={0.1} />
                <CityMarker at={b} f={f} color={ink} pulse={false} name="BERLIN" size={112} labelDy={-50} />
                <CityMarker at={c} f={f} color={C.red} name="CONSTANTINOPLE" size={112} labelDx={-260} labelDy={130} />
                <rect x={g[0] - 50} y={g[1] - 40} width={100} height={80} fill="none" stroke={C.red} strokeWidth={10} />
              </g>
            );
          }}
        </GeoMap>
      </svg>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={ink} strokeWidth={4} />
    </g>
  );
};

// ================================================================== M-05 Europe 1919–23
export const CAM_1919 = {europe: {lon: 17, lat: 51, zoom: 1.0} as Cam, central: {lon: 19, lat: 50, zoom: 1.2} as Cam};
const EMPIRES: State14[] = ['GER', 'AH', 'RUS', 'OTT'];
/** 1919 states that appear with each empire's fade (index into EMPIRES); new states (NEW_STATES_1919) reveal via `states`. */
const SUCCESSOR_OF: Partial<Record<State19, number>> = {GER: 0, SOV: 2, TUR: 3, DZG: 0};
export type Europe1919Props = {
  f: number;
  cam?: Cam;
  idSuffix?: string;
  /** 0..4: the German, Austro-Hungarian, Russian and Ottoman empire fills crack and fade, one per unit. */
  empires?: number;
  /** 0..9: new states fill and label in sequence (Poland … Finland). */
  states?: number;
  /** Hatch the disputed eastern borders (0..1). */
  disputed?: number;
  /** "BORDERS APPROXIMATE" corner note (0..1). */
  note?: number;
  /** Small detail labels (Danzig Free City, Memel 1923, Saar under the League) (0..1). */
  details?: number;
};
export const MapEurope1919: React.FC<Europe1919Props> = (p) => {
  const {f, cam = CAM_1919.europe, idSuffix = ''} = p;
  const emp = clamp(p.empires ?? 0, 0, 4);
  const ns = clamp(p.states ?? 0, 0, 9);
  const newIdx = (id: State19) => X.NEW_STATES_1919.findIndex((n) => n.id === id);
  const st14 = styles1914({base: 'war1914', f});
  const empFade = (i: number) => seg(emp - i, 0.35, 1);
  const crackK = (i: number) => seg(emp - i, 0, 0.5);
  const s19 = X.ORDER_1919.map((id) => {
    const ni = newIdx(id);
    let op = 1;
    if (ni >= 0) op = seg(ns - ni, 0, 0.6, easeOut);
    else if (SUCCESSOR_OF[id] !== undefined) op = empFade(SUCCESSOR_OF[id]!);
    const style: StateStyle = {fill: X.COLOR_1919[id], opacity: op};
    if (id === 'SOV') style.fill = mix(X.P19.soviet, '#E3D2C0', 0.25);
    return {key: id, ops: X.STATES_1919[id], style};
  });
  const empireStates = EMPIRES.map((s, i) => ({key: 'e' + s, ops: X.STATES_1914[s], style: {...st14[s], opacity: 1 - empFade(i)}}));
  const d1919 = (kind: 'europe') => borderPath(kind, '1919', X.MODERN_TO_1919, X.MESH_EXCLUDE_1919, X.LINES_1919.map(X.ringOf));
  const disp = clamp(p.disputed ?? 0);
  const morphT = seg(emp, 0, 0.6);
  return (
    <GeoMap kind="europe" cam={cam} f={f} idSuffix={idSuffix} land={P.outside} borders={false}
      layers={(ctx) => {
        const box = viewBox(ctx.focus, ctx.z);
        const zk = `${Math.round(ctx.z * 100)}-${Math.round(ctx.focus[0])}-${Math.round(ctx.focus[1])}`;
        return (
          <g>
            <StateLayer {...ctx} kind="europe" f={f} tag="n19" states={[
              {key: 'base', ops: ['France', 'United Kingdom', 'Belgium', 'Netherlands', 'Luxembourg', 'Switzerland', 'Spain', 'Portugal', 'Denmark', 'Norway', 'Sweden'].map((n) => ({add: n})), style: {fill: P.neutral}},
              ...s19,
            ]} />
            {disp > 0 && <StateLayer {...ctx} kind="europe" f={f} tag="dsp" states={[{key: 'd', ops: [{add: X.DISPUTED_EAST}], style: {fill: X.P19.poland, opacity: disp, hatch: '#8A4A40', hatchOpacity: 0.8}}]} />}
            <Borders d={d1919('europe')} z={ctx.z} clipId={ctx.clipId} />
            {/* 1914 empires on top, fading one by one; new borders crack across them first */}
            <StateLayer {...ctx} kind="europe" f={f} tag="e14" states={empireStates} />
            <defs>
              {EMPIRES.map((s) => <StateClips key={s} id={`${ctx.clipId}-ck-${s}-${zk}`} kind="europe" ops={X.STATES_1914[s]} box={box} />)}
            </defs>
            {EMPIRES.map((s, i) => {
              const k = crackK(i);
              const o = 1 - empFade(i);
              if (k <= 0 || o <= 0.01) return null;
              // cracks = the 1919 borders, drawn only inside this empire (its own add-runs, clipped like its fill)
              return (
                <g key={s} opacity={o}>
                  <defs>
                    <mask id={`${ctx.clipId}-cm-${s}-${zk}`} maskUnits="userSpaceOnUse" {...box}>
                      <StateArea id={`${ctx.clipId}-ck-${s}-${zk}`} kind="europe" ops={X.STATES_1914[s]} fill="#fff" />
                    </mask>
                  </defs>
                  <g mask={`url(#${ctx.clipId}-cm-${s}-${zk})`}>
                    <path d={d1919('europe')} fill="none" stroke="#FBF6EA" strokeWidth={9 / ctx.z} pathLength={1} strokeDasharray={`${k} 1`} strokeLinejoin="round" />
                    <path d={d1919('europe')} fill="none" stroke={ink} strokeWidth={3.5 / ctx.z} pathLength={1} strokeDasharray={`${k} 1`} strokeLinejoin="round" />
                  </g>
                </g>
              );
            })}
            {/* morph: Germany's 1914 eastern border slides to the 1919–20 border with Poland */}
            {emp > 0 && emp < 1.2 && (
              <g clipPath={`url(#${ctx.clipId})`} opacity={1 - seg(emp, 0.9, 1.2)}>
                <path d={linePath('europe', lerpLine(X.GR_BORDER_1914, POLAND_WEST_1919, morphT, 40))} fill="none" stroke={ink} strokeWidth={5 / ctx.z} strokeLinejoin="round" />
              </g>
            )}
          </g>
        );
      }}>
      {({toScreen}) => {
        const ts = toScreen;
        return (
          <g>
            {X.NEW_STATES_1919.map((n, i) => {
              const k = seg(ns - i, 0.2, 0.8, (x) => x);
              if (k <= 0) return null;
              return <Label2 key={n.id} at={ts(n.at)} lines={n.lines} size={n.id === 'AUT' ? 36 : 38} opacity={clamp(k * 2)} scale={0.6 + 0.4 * pop(k)} />;
            })}
            <SafeLabel at={ts([10.3, 51.3])} text={emp >= 0.6 ? 'GERMANY' : 'GERMAN EMPIRE'} size={40} opacity={emp < 0.3 || emp >= 0.6 ? 1 : 0.3} />
            <SafeLabel at={ts([35.5, 53.2])} text={emp >= 2.6 ? 'SOVIET RUSSIA' : 'RUSSIAN EMPIRE'} size={40} opacity={emp < 2.3 || emp >= 2.6 ? 1 : 0.3} />
            <SafeLabel at={ts([33.5, 39.2])} text={emp >= 3.6 ? 'TURKEY' : 'OTTOMAN EMPIRE'} size={40} opacity={emp < 3.3 || emp >= 3.6 ? 1 : 0.3} />
            {emp < 1.6 && ns < 1.5 && <SafeLabel at={ts([18.6, 47.4])} text="AUSTRIA-HUNGARY" size={40} opacity={(1 - seg(emp, 1.2, 1.6)) * (1 - seg(ns, 0.8, 1.5))} />}
            {(p.details ?? 0) > 0 && (
              <g opacity={p.details}>
                <CityMarker at={ts(X.PLACE.Danzig)} f={f} color="#F4EEDF" pulse={false} />
                <SafeLabel at={ts([16.8, 55.2])} text="DANZIG (FREE CITY)" size={36} />
                <SafeLabel at={ts([19.6, 56.45])} text="MEMEL (1923)" size={36} />
              </g>
            )}
            {(p.note ?? 0) > 0 && (
              <g opacity={p.note}>
                <rect x={W - 70 - 560} y={790} width={560} height={74} rx={12} fill="#F5EFDF" stroke={ink} strokeWidth={5} />
                <text x={W - 70 - 280} y={840} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={38} fill={ink}>BORDERS APPROXIMATE</text>
              </g>
            )}
          </g>
        );
      }}
    </GeoMap>
  );
};
/** Polish–German border 1920–22 (Poland's west chain reversed: East Prussia → Corridor → Posen → Upper Silesia). */
const POLAND_WEST_1919: LL[] = POLAND_WEST_CHAIN.slice().reverse() as LL[];
