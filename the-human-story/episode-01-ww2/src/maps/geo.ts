// Geographic data + projections.  Base geography: Natural Earth (public domain)
// via the world-atlas package.  Historical borders (1919–1939) are simplified,
// hand-plotted approximations in lon/lat, clipped to the coastline at render time.
import {feature} from 'topojson-client';
import {geoConicConformal, geoMercator, geoPath, GeoProjection} from 'd3-geo';
import countries50 from 'world-atlas/countries-50m.json';
import land50 from 'world-atlas/land-50m.json';
import countries110 from 'world-atlas/countries-110m.json';
import type {Feature, FeatureCollection, Geometry, Polygon} from 'geojson';

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
};
export type MapKind = keyof typeof PROJ;

const cache = new Map<string, {proj: GeoProjection; paths: Map<string, string>; land: string}>();

export function baseMap(kind: MapKind) {
  let c = cache.get(kind);
  if (!c) {
    const proj = PROJ[kind]();
    const gp = geoPath(proj);
    const paths = new Map<string, string>();
    for (const f of COUNTRIES50.features) {
      const d = gp(f);
      if (d) paths.set(f.properties.name, d);
    }
    c = {proj, paths, land: gp(LAND50) ?? ''};
    cache.set(kind, c);
  }
  return c;
}

export function featurePath(kind: MapKind, f: Feature) {
  return geoPath(baseMap(kind).proj)(f) ?? '';
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
};
