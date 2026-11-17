// Geographic data + projections.  Base geography: Natural Earth (public domain)
// via the world-atlas package.  Historical borders (1919–1939) are simplified,
// hand-plotted approximations in lon/lat, clipped to the coastline at render time.
import {feature} from 'topojson-client';
import {geoConicConformal, geoMercator, geoPath, GeoProjection} from 'd3-geo';
import countries50 from 'world-atlas/countries-50m.json';
import land50 from 'world-atlas/land-50m.json';
import countries110 from 'world-atlas/countries-110m.json';
import type {Feature, FeatureCollection, Geometry, Polygon} from 'geojson';
// Natural Earth 1:10m land clipped to a small Normandy box (generated once; ~600 points).
import normandyLand from './data/normandy-land-10m.json';
// Natural Earth 1:10m land clipped to the Dardanelles box 25.2–27.8°E, 39.5–41.0°N (ep02 M-04).
import gallipoliLand from './data/gallipoli-land-10m.json';

type Countries = FeatureCollection<Geometry, {name: string}>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const topo50 = countries50 as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const topoLand = land50 as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const topo110 = countries110 as any;

export const COUNTRIES50 = feature(topo50, topo50.objects.countries) as unknown as Countries;
export const COUNTRIES110 = feature(topo110, topo110.objects.countries) as unknown as Countries;
export const LAND50 = feature(topoLand, topoLand.objects.land) as unknown as FeatureCollection;

export const country = (name: string, set: Countries = COUNTRIES50) => set.features.find((f) => f.properties.name === name);

export const poly = (ring: [number, number][]): Feature<Polygon> => {
  // d3-geo expects clockwise exterior rings for spherical polygons; ensure small area winding
  const r = [...ring, ring[0]];
  let area = 0;
  for (let i = 0; i < r.length - 1; i++) area += (r[i + 1][0] - r[i][0]) * (r[i + 1][1] + r[i][1]);
  const ordered = area < 0 ? r.slice().reverse() : r; // d3 wants clockwise in screen (lon right, lat up)
  return {type: 'Feature', properties: {}, geometry: {type: 'Polygon', coordinates: [ordered]}};
};

// ---------------- Historical regions (approximate) ----------------
// Corrected 2026-11-15 from the researcher's R-01 review (production/research/ep01-ww2/map-sources.md §3, §5).
export const GERMANY_1937 = poly([
  [6.9, 53.65], [7.2, 53.2], [6.9, 52.6], [6.7, 52.0], [6.0, 51.8], [5.95, 50.75], [6.3, 50.3], [6.1, 50.1], [6.45, 49.5],
  [7.0, 49.15], [8.2, 48.97], [7.6, 47.6], [8.6, 47.65], [9.6, 47.55], [10.4, 47.4], [11.3, 47.45], [12.2, 47.65], [13.0, 47.5],
  [12.8, 48.0], [13.8, 48.6], [12.6, 49.4], [12.1, 50.25], [12.5, 50.4], [14.3, 51.0], [15.0, 50.85], [16.4, 50.65], [16.6, 50.2],
  [17.7, 50.2], [18.4, 50.05], [18.75, 50.22], [19.0, 50.36], [18.8, 50.48], [18.55, 50.75], [18.4, 50.9], [17.75, 51.4], [17.0, 51.55],
  [16.3, 51.7], [15.9, 52.3], [16.0, 52.9], [16.6, 53.05], [17.1, 53.05], [17.4, 53.3], [17.4, 53.9], [17.6, 54.2], [17.9, 54.5], [18.0, 54.83],
  [18.0, 55.1], [14.5, 55.0], [10.5, 55.2], [9.75, 54.85], [9.42, 54.83], [8.66, 54.91], [8.3, 55.06], [7.8, 54.5],
]);
/** East Prussia 1920–39, incl. the Marienwerder/Marienburg plebiscite area (voted to stay German, 1920). */
export const EAST_PRUSSIA = poly([
  [19.3, 54.4], [19.3, 54.27], [19.15, 54.15], [19.0, 54.03], [18.85, 53.9], [18.87, 53.6], [19.2, 53.55], [19.45, 53.55],
  [19.65, 53.55], [19.95, 53.45], [20.35, 53.33], [20.5, 53.25], [21.0, 53.3], [21.6, 53.45], [22.1, 53.5], [22.5, 53.7], [22.75, 54.05],
  [22.85, 54.38], [22.85, 54.8], [22.6, 55.05], [22.0, 55.07], [21.5, 55.22], [21.25, 55.27], [20.95, 55.27], [20.0, 55.2],
]);
/** Demilitarised Rhineland (Art. 42: left bank + 50 km east of the Rhine, incl. the Baden strip). */
export const RHINELAND = poly([
  [6.0, 51.85], [6.9, 52.05], [7.3, 51.75], [7.5, 51.45], [7.65, 50.95], [8.05, 50.6], [8.35, 50.35], [8.95, 50.1],
  [9.1, 49.5], [9.0, 49.0], [8.6, 48.5], [8.25, 48.0], [8.3, 47.62], [7.6, 47.6], [8.2, 48.97], [7.0, 49.1], [6.4, 49.5], [6.1, 50.1], [5.95, 50.8],
]);
/** Alsace-Lorraine (German 1871–1918): Vosges crest – Donon – Avricourt – west of Metz. */
export const ALSACE_LORRAINE = poly([
  [5.95, 49.48], [6.37, 49.47], [7.0, 49.12], [7.95, 49.03], [8.23, 48.97], [7.59, 47.59], [7.1, 47.5], [6.85, 47.82],
  [7.05, 48.15], [7.12, 48.5], [6.8, 48.62], [6.45, 48.8], [6.2, 48.9], [6.0, 48.98], [5.95, 49.1],
]);
/** Posen + West Prussia (the Corridor) + Soldau, to Poland 1920 — EXCLUDES Danzig and the Marienwerder area. */
export const LOST_TO_POLAND = poly([
  [15.9, 52.3], [16.0, 52.9], [16.6, 53.05], [17.1, 53.05], [17.4, 53.3], [17.4, 53.9], [17.6, 54.2], [17.9, 54.5], [18.0, 54.83],
  [18.85, 54.75], [18.56, 54.47], [18.4, 54.4], [18.42, 54.25], [18.6, 54.15], [18.8, 54.13],
  [18.85, 53.9], [18.87, 53.6], [19.2, 53.55], [19.45, 53.55], [19.65, 53.55], [19.95, 53.45], [20.35, 53.33], [20.4, 53.15],
  [19.3, 53.05], [18.75, 52.9], [18.35, 52.6], [17.8, 52.3], [17.95, 51.75], [17.75, 51.4], [17.0, 51.55], [16.3, 51.7],
]);
export const POLAND_WEST_CHAIN: [number, number][] = [
  [18.85, 49.5], [18.55, 49.9], [18.4, 50.05], [18.75, 50.22], [19.0, 50.36], [18.8, 50.48], [18.55, 50.75], [18.4, 50.9],
  [17.75, 51.4], [17.0, 51.55], [16.3, 51.7], [15.9, 52.3], [16.0, 52.9], [16.6, 53.05], [17.1, 53.05], [17.4, 53.3], [17.4, 53.9],
  [17.6, 54.2], [17.9, 54.5], [18.0, 54.83], [18.85, 54.75], [18.56, 54.47], [18.4, 54.4], [18.42, 54.25], [18.6, 54.15], [18.8, 54.13],
  [18.85, 53.9], [18.87, 53.6], [19.2, 53.55], [19.45, 53.55], [19.65, 53.55], [19.95, 53.45], [20.35, 53.33], [20.5, 53.25],
  [21.0, 53.3], [21.6, 53.45], [22.1, 53.5], [22.5, 53.7], [22.75, 54.05], [22.85, 54.38],
];
/** 23 Aug 1939 secret protocol: "the line of the rivers Narew, Vistula and San" (through Warsaw). Use in S04-03. */
export const MR_LINE_AUG1939: [number, number][] = [
  [21.85, 53.45], [21.88, 53.23], [21.57, 53.08], [21.3, 52.92], [21.08, 52.7], [21.05, 52.52], [20.7, 52.43],
  [21.0, 52.25], [21.25, 51.95], [21.6, 51.65], [21.85, 51.45], [21.95, 51.0], [21.84, 50.68],
  [22.12, 50.52], [22.42, 50.26], [22.68, 50.01], [22.77, 49.78], [22.4, 49.6], [22.2, 49.56], [22.33, 49.47], [22.6, 49.2], [22.65, 49.0],
];
/** 28 Sept 1939 Boundary and Friendship Treaty: Pisa – Narew – Bug – San. Use for the partition shot, labelled "28 SEPT 1939". */
export const MR_LINE_SEPT1939: [number, number][] = [
  [21.85, 53.45], [21.88, 53.23], [21.65, 53.1], [22.1, 52.95], [22.32, 52.67], [22.6, 52.4], [23.2, 52.25], [23.65, 52.1],
  [23.6, 51.55], [23.85, 51.2], [24.05, 50.85], [24.2, 50.5], [23.6, 50.3], [23.0, 50.1], [22.77, 49.78],
  [22.4, 49.6], [22.2, 49.56], [22.33, 49.47], [22.6, 49.2], [22.65, 49.0],
];
const POLAND_EAST_CHAIN: [number, number][] = [
  [22.85, 54.38], [23.5, 54.1], [24.8, 55.0], [26.6, 55.7], [27.6, 55.6], [27.8, 54.6], [26.9, 53.9], [27.0, 53.0], [26.9, 52.3], [27.3, 51.7],
  [26.6, 51.3], [26.5, 50.5], [26.2, 50.0], [26.3, 49.3], [26.1, 48.6], [25.4, 47.95], [24.6, 48.0], [23.5, 48.6], [22.65, 49.0],
];
const POLAND_SOUTH_CHAIN: [number, number][] = [[22.65, 49.0], [21.6, 49.4], [20.5, 49.4], [19.8, 49.2], [19.0, 49.4]];
// West chain up to the East Prussian border vertex just west of where the Pisa line starts.
const WEST_TO_PISA = POLAND_WEST_CHAIN.slice(0, POLAND_WEST_CHAIN.findIndex((p) => p[0] === 21.6 && p[1] === 53.45) + 1);
const WEST_FROM_PISA = POLAND_WEST_CHAIN.slice(WEST_TO_PISA.length);
export const POLAND_1939 = poly([...POLAND_WEST_CHAIN, ...POLAND_EAST_CHAIN.slice(1), ...POLAND_SOUTH_CHAIN.slice(1)]);
export const POLAND_GERMAN_ZONE = poly([...WEST_TO_PISA, ...MR_LINE_SEPT1939, ...POLAND_SOUTH_CHAIN.slice(1)]);
export const POLAND_SOVIET_ZONE = poly([...WEST_FROM_PISA, ...POLAND_EAST_CHAIN.slice(1), ...MR_LINE_SEPT1939.slice().reverse()]);
/** Back-compat alias (now the corrected 28 Sept 1939 line). */
export const MR_LINE_COORDS = MR_LINE_SEPT1939;

// ---------------- Projections ----------------
export const W = 1920;
export const H = 1080;

/** Fixed base projections; camera moves are applied as SVG transforms for speed. */
export const PROJ = {
  europe: () => geoConicConformal().parallels([40, 62]).rotate([-14, 0]).center([0, 51]).scale(2200).translate([W / 2, H / 2]),
  normandy: () => geoMercator().center([-0.7, 49.3]).scale(30000).translate([W / 2, H / 2]),
  pacific: () => geoMercator().rotate([-160, 0]).center([0, 22]).scale(620).translate([W / 2, H / 2]),
  eastAsia: () => geoMercator().center([125, 38]).scale(1300).translate([W / 2, H / 2]),
  africa: () => geoMercator().center([22, 32]).scale(2600).translate([W / 2, H / 2]),
  /** Eastern Front: Baltic to Black Sea, Berlin to Stalingrad (zoom 1 spans ~10°E–56°E). */
  /** Gallipoli / Dardanelles (ep02 M-04): zoom 1 spans ~25.45–27.35°E.  Uses the 1:10m coast extract. */
  gallipoli: () => geoMercator().center([26.4, 40.2]).scale(58000).translate([W / 2, H / 2]),
  eastFront: () => geoConicConformal().parallels([45, 60]).rotate([-33, 0]).center([0, 52]).scale(3800).translate([W / 2, H / 2]),
};
export type MapKind = keyof typeof PROJ;

const cache = new Map<string, {proj: GeoProjection; paths: Map<string, string>; land: string; borders: string}>();

export function baseMap(kind: MapKind) {
  let c = cache.get(kind);
  if (!c) {
    // Clip geometry to a margin around the frame (camera zoom is always >= ~1) and
    // round coordinates: keeps SVG path strings small, which is the main render cost.
    const proj = PROJ[kind]().clipExtent([[-900, -700], [W + 900, H + 700]]);
    const gp = geoPath(proj).digits(1);
    const paths = new Map<string, string>();
    for (const f of COUNTRIES50.features) {
      const d = gp(f);
      if (d) paths.set(f.properties.name, d);
    }
    // Thin internal borders use the lighter 1:110m dataset (5x fewer points): at their faint
    // 1.4 px weight the difference is invisible, and they were ~80% of map paint time.
    const borders = COUNTRIES110.features.map((f) => gp(f) ?? '').join(' ');
    // Normandy is shown at ~30x the Europe scale: use the 1:10m coast extract there.
    const landGeo = kind === 'normandy' ? (normandyLand as unknown as Feature) : kind === 'gallipoli' ? (gallipoliLand as unknown as Feature) : LAND50;
    c = {proj, paths, land: gp(landGeo) ?? '', borders};
    cache.set(kind, c);
  }
  return c;
}

const fpCache = new Map<MapKind, WeakMap<Feature, string>>();
/** Projected path of a feature in base-projection coords; memoised per (kind, feature object). */
export function featurePath(kind: MapKind, f: Feature) {
  let m = fpCache.get(kind);
  if (!m) fpCache.set(kind, (m = new WeakMap()));
  const hit = m.get(f);
  if (hit !== undefined) return hit;
  const d = geoPath(baseMap(kind).proj).digits(1)(f) ?? '';
  m.set(f, d);
  return d;
}

export const CITY: Record<string, [number, number]> = {
  London: [-0.13, 51.5], Paris: [2.35, 48.86], Berlin: [13.4, 52.52], Warsaw: [21.0, 52.23], Moscow: [37.6, 55.75], Vienna: [16.37, 48.21],
  Prague: [14.42, 50.08], Munich: [11.58, 48.14], Rome: [12.5, 41.9], Dunkirk: [2.37, 51.03], Stalingrad: [44.5, 48.7], Leningrad: [30.3, 59.94],
  Kyiv: [30.52, 50.45], Oslo: [10.75, 59.91], Copenhagen: [12.57, 55.68], Amsterdam: [4.9, 52.37], Brussels: [4.35, 50.85], Coventry: [-1.51, 52.41],
  Rotterdam: [4.48, 51.92], Normandy: [-0.6, 49.3], 'El Alamein': [28.95, 30.83], Danzig: [18.65, 54.35], Minsk: [27.56, 53.9], Sedan: [4.94, 49.7],
  Tokyo: [139.7, 35.68], 'Pearl Harbor': [-157.95, 21.35], Midway: [-177.37, 28.2], Okinawa: [127.8, 26.3], Hiroshima: [132.45, 34.39],
  Nagasaki: [129.87, 32.75], 'Iwo Jima': [141.32, 24.78], Manila: [120.98, 14.6], Guadalcanal: [160.0, -9.6], Saipan: [145.75, 15.18],
  Mukden: [123.43, 41.8], Shanghai: [121.47, 31.23], Nanjing: [118.8, 32.06], Beijing: [116.4, 39.9], Harbin: [126.6, 45.75], Tobruk: [23.96, 32.08],
  Cairo: [31.24, 30.04], Tripoli: [13.18, 32.89], Reims: [4.03, 49.26],
  // ---- M-12 additions (modern coordinates of the places named; see map-notes.md) ----
  Abbeville: [1.83, 50.11], Lublin: [22.57, 51.25], Majdanek: [22.6, 51.22], 'Oświęcim': [19.21, 50.03], Auschwitz: [19.2, 50.03],
  Buchenwald: [11.25, 51.02], Weimar: [11.33, 50.98], 'Bergen-Belsen': [9.91, 52.76], Dachau: [11.47, 48.27],
  Washington: [-77.04, 38.9], 'New York': [-74.0, 40.71], 'San Francisco': [-122.42, 37.77], Vladivostok: [131.89, 43.12],
  Khabarovsk: [135.07, 48.48], Changchun: [125.32, 43.82], Hailar: [119.7, 49.2], Seoul: [126.98, 37.57], 'Hong Kong': [114.17, 22.3],
  Singapore: [103.82, 1.35], Wuhan: [114.3, 30.59], Guangzhou: [113.26, 23.13], Chongqing: [106.55, 29.56],
  Tarawa: [172.98, 1.42], Guam: [144.79, 13.44], Leyte: [124.95, 10.95], Rabaul: [152.18, -4.2], Wake: [166.61, 19.29],
  Narvik: [17.43, 68.44], Trondheim: [10.4, 63.43], Bergen: [5.32, 60.39], Antwerp: [4.4, 51.22], 'The Hague': [4.3, 52.08],
  Anzio: [12.63, 41.45], Cassino: [13.83, 41.49], Naples: [14.27, 40.85], Aachen: [6.08, 50.78], Strasbourg: [7.75, 48.58],
  Remagen: [7.23, 50.58], Torgau: [13.0, 51.56], Magdeburg: [11.63, 52.12], 'Königsberg': [20.51, 54.71], Breslau: [17.04, 51.11],
  Budapest: [19.04, 47.5], Bucharest: [26.1, 44.43], Riga: [24.1, 56.95], Tallinn: [24.75, 59.44], Helsinki: [24.94, 60.17],
  Vilnius: [25.28, 54.69], Lviv: [24.03, 49.84], Smolensk: [32.05, 54.78], Vitebsk: [30.2, 55.19], Bobruisk: [29.22, 53.14],
  Kalach: [43.53, 48.69], Kharkiv: [36.23, 50.0], Rostov: [39.72, 47.23], Odessa: [30.73, 46.48], 'Brest-Litovsk': [23.69, 52.09],
  'Memel': [21.13, 55.71], 'Poznań': [16.93, 52.41], Bratislava: [17.1, 48.15], 'Kraków': [19.94, 50.06], Stettin: [14.55, 53.43],
  Caen: [-0.37, 49.18], Bayeux: [-0.7, 49.28], Cherbourg: [-1.62, 49.64], Carentan: [-1.25, 49.3], 'Sainte-Mère-Église': [-1.32, 49.41],
  Ranville: [-0.26, 49.23], Ouistreham: [-0.25, 49.29], 'Pegasus Bridge': [-0.27, 49.24], Gleiwitz: [18.67, 50.29],
  Tianjin: [117.2, 39.13], Hanoi: [105.85, 21.03], Saigon: [106.7, 10.78], 'Cam Ranh Bay': [109.2, 11.95], Taipei: [121.56, 25.04],
};
