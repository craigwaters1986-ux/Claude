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
export const GERMANY_1937 = poly([
  [6.9, 53.65], [7.2, 53.2], [6.9, 52.6], [6.7, 52.0], [6.0, 51.8], [5.95, 50.75], [6.3, 50.3], [6.1, 50.1], [6.45, 49.5],
  [7.0, 49.15], [8.2, 48.97], [7.6, 47.6], [8.6, 47.65], [9.6, 47.55], [10.4, 47.4], [11.3, 47.45], [12.2, 47.65], [13.0, 47.5],
  [12.8, 48.0], [13.8, 48.6], [12.6, 49.4], [12.1, 50.25], [12.5, 50.4], [14.3, 51.0], [15.0, 50.85], [16.4, 50.65], [16.6, 50.2],
  [17.7, 50.2], [18.6, 50.3], [18.4, 50.9], [17.6, 51.3], [16.3, 51.7], [15.9, 52.3], [16.0, 52.9], [16.7, 53.2], [17.4, 53.9],
  [17.6, 54.9], [14.5, 55.0], [10.5, 55.2], [9.5, 54.85], [8.4, 55.1], [7.8, 54.5],
]);
export const EAST_PRUSSIA = poly([
  [19.2, 54.6], [19.2, 54.25], [19.5, 53.6], [20.5, 53.2], [21.5, 53.3], [22.0, 53.45], [22.8, 54.35], [22.8, 54.95], [21.3, 55.4], [20.0, 55.2],
]);
export const RHINELAND = poly([
  [6.0, 51.85], [7.0, 52.0], [7.6, 51.4], [7.5, 50.6], [8.3, 50.0], [8.6, 49.0], [8.2, 48.95], [7.0, 49.1], [6.4, 49.5], [6.1, 50.1], [5.95, 50.8],
]);
export const ALSACE_LORRAINE = poly([
  [5.9, 49.45], [6.45, 49.5], [7.0, 49.15], [8.2, 48.97], [7.6, 47.6], [7.0, 47.5], [6.8, 48.0], [6.2, 48.6],
]);
export const LOST_TO_POLAND = poly([
  [15.9, 52.3], [16.0, 52.9], [16.7, 53.2], [17.4, 53.9], [17.6, 54.85], [18.9, 54.8], [19.3, 54.0], [19.0, 53.2], [18.3, 52.6], [18.2, 51.8], [17.5, 51.4], [16.3, 51.7],
]);
const POLAND_WEST_CHAIN: [number, number][] = [
  [18.85, 49.55], [18.6, 50.3], [18.4, 50.9], [17.6, 51.3], [16.3, 51.7], [15.9, 52.3], [16.0, 52.9], [16.7, 53.2], [17.4, 53.9], [17.6, 54.85],
  [18.6, 54.9], [18.9, 54.25], [19.2, 54.2], [19.5, 53.6], [20.5, 53.2], [21.5, 53.3], [22.0, 53.45], [22.8, 54.35],
];
const MR_LINE: [number, number][] = [[22.8, 54.35], [23.6, 53.6], [23.9, 53.0], [23.4, 52.3], [23.8, 51.6], [24.1, 50.9], [23.6, 50.3], [22.9, 49.8], [22.6, 49.1]];
const POLAND_EAST_CHAIN: [number, number][] = [
  [22.8, 54.35], [23.5, 54.1], [24.8, 55.0], [26.6, 55.7], [27.6, 55.6], [27.8, 54.6], [26.9, 53.9], [27.0, 53.0], [26.9, 52.3], [27.3, 51.7],
  [26.6, 51.3], [26.5, 50.5], [26.2, 50.0], [26.3, 49.3], [26.1, 48.6], [25.4, 47.95], [24.6, 48.0], [23.5, 48.6], [22.6, 49.1],
];
const POLAND_SOUTH_CHAIN: [number, number][] = [[22.6, 49.1], [21.6, 49.4], [20.5, 49.4], [19.8, 49.2], [19.0, 49.4]];
export const POLAND_1939 = poly([...POLAND_WEST_CHAIN, ...POLAND_EAST_CHAIN.slice(1), ...POLAND_SOUTH_CHAIN.slice(1)]);
export const POLAND_GERMAN_ZONE = poly([...POLAND_WEST_CHAIN, ...MR_LINE.slice(1), ...POLAND_SOUTH_CHAIN.slice(1)]);
export const POLAND_SOVIET_ZONE = poly([...POLAND_EAST_CHAIN, ...MR_LINE.slice(0, -1).reverse()]);
export const MR_LINE_COORDS = MR_LINE;

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
    const landGeo = kind === 'normandy' ? (normandyLand as unknown as Feature) : LAND50;
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
  Abbeville: [1.83, 50.11], Lublin: [22.57, 51.25], Majdanek: [22.6, 51.22], 'Oświęcim': [19.23, 50.03], Auschwitz: [19.2, 50.03],
  Buchenwald: [11.25, 51.02], Weimar: [11.33, 50.98], 'Bergen-Belsen': [9.91, 52.76], Dachau: [11.43, 48.27],
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
  Ranville: [-0.26, 49.23], Ouistreham: [-0.25, 49.29],
};
