// Episode 4 US maps, 1809–1865 (kit build, shared by all chapters).
// Base data: us-atlas 3 `states-10m.json` (ISC licence, Census cartographic boundaries) for the states, and
// world-atlas `countries-50m.json` (Natural Earth, public domain) for Canada / Mexico / Cuba / Bahamas.
// See production/scripts/ep04-lincoln/credits-maps.md.
//
// ACCURACY NOTES (say these in map-notes if a shot leans on them):
// - Modern state outlines are a simplification of period boundaries.
// - `year` decides each state's status: 'state' (admitted by then, normal land), 'territory' (US land not yet a
//   state: ONE muted tint, no internal borders, no labels) or 'foreign' (not US at all then, paler: Texas before
//   Dec 1845, Oregon Country before 1846, the Mexican Cession before 1848, Florida before 1821). Whole-state
//   granularity: e.g. Colorado/Wyoming are treated as territory throughout.
// - Before 20 June 1863 West Virginia is drawn as part of Virginia (no border). Before 1820 Maine is part of
//   Massachusetts. DC is always drawn with Maryland (put a Washington dot on it).
// - Rivers (Ohio, Mississippi, Missouri, Tennessee, Wabash, Potomac) and the Great Lakes: Natural Earth 1:50m
//   (public domain), extracted into src/kit/data/ne-water.json. Modern courses; 1:50m generalisation.
// - Kansas and Nebraska Territory (1854) polygons are approximate (west edge = continental divide, simplified).
// - Emancipation Proclamation excepted areas (LA parishes around New Orleans, VA Eastern Shore and Norfolk area)
//   are simplified hand polygons; label the map "excepted areas simplified" (EXCEPTED_NOTE).
//
// PUBLIC API
//   usProjection(view: USView | keyof VIEWS, box?: [x0,y0,x1,y1]) -> d3 GeoProjection (cached; pure)
//   VIEWS: KY_IN_IL, RIVER_ROUTE, ILLINOIS, NATION, SOUTH (secession), WAR_EAST, FUNERAL, VIRGINIA
//   <USMap proj f year states? wv? neighbours? rivers? lakes? sea? id? stateFill? />
//        states = {SC: {fill: '#B23A2E', t: 0..1 (blend from the base fill), lift: px (peel up with a shadow),
//                       hatch: 0..1 (diagonal hatch overlay), outline?: colour}} — keys are postal codes; 'VA'
//                       covers WV while merged.
//        rivers = {ohio: t, mississippi: t, missouri?, tennessee?, wabash?, potomac?} draw-on 0..1 (1 = shown).
//   <StateLabel proj code text? t size dx dy color />   (label at the state's centroid, or LABEL_AT override)
//   <PlaceDot proj at label t side size color ring />   (pops in; `ring` pulses)
//   <RouteLine proj pts t color width dashed icon='none'|'dot'|'train'|'wagon'|'boat' iconScale />
//   <RiverLine proj pts t width />
//   <BattleMarker proj at label t side />   (crossed sabres in a ring; non-graphic)
//   <TerritoryShape proj pts t fill hatch label labelAt />   (clipped to US land; e.g. KANSAS_T / NEBRASKA_T)
//   <ExceptedAreas proj t />   (blank patches over the excepted LA/VA areas, dashed outline)
//   <MapNote text x y t anchor />   (small boxed note, e.g. EXCEPTED_NOTE)
//   <Legend items={[{fill, label, hatch?}]} x y t />
//   routeAt(proj, pts, t) -> {x, y, angle}   (pure; place a moving icon yourself)
//   statusOf(code, year) -> 'state' | 'territory' | 'foreign'
//   DATA: PLACES, DEBATE_TOWNS, SECESSION, FREE_1860, SLAVE_1860, BORDER_STATES, CONFEDERACY, PROCLAMATION_SHADED,
//         FUNERAL_ROUTE, FUNERAL_PATH, FUNERAL_STOPS, FLATBOAT_1828, MOVE_1816, MOVE_1830, BATTLES, RIVERS, OHIO, MISSISSIPPI,
//         KANSAS_T, NEBRASKA_T, SECESSION_LATER, STATE_NAME, EXCEPTED_NOTE
//   COLOURS: MAPC (free, slave, union, confed, border, territory, sea, land, route)
//
// USAGE (inside a shot; never put a Frame inside another Frame's svg):
//   const proj = usProjection('SOUTH');
//   <Frame bg={MAPC.sea}>
//     <CineCam f={f} keys={[[0, 1, 960, 500], [d, 1.08, 960, 480]]}>{(layer) => [layer(1, (
//       <g>
//         <USMap proj={proj} f={f} year={1861} id="sec" states={Object.fromEntries(SECESSION.map((s, i) =>
//           [s.code, {fill: MAPC.confed, t: prog(f, 20 + i * 18, 34 + i * 18), lift: 10 * prog(f, 20 + i * 18, 34 + i * 18)}]))} />
//         {SECESSION.map((s, i) => <StateLabel key={s.code} proj={proj} code={s.code} t={prog(f, 26 + i * 18, 40 + i * 18)} />)}
//       </g>))]}
//     </CineCam>
//   </Frame>
import React from 'react';
import {geoConicEqualArea, geoPath, GeoProjection} from 'd3-geo';
import {feature, merge, mesh} from 'topojson-client';
import usTopo from 'us-atlas/states-10m.json';
import world from 'world-atlas/countries-50m.json';
import WATER from './data/ne-water.json';
import {C, FONT} from '../styles/theme';
import {clamp, easeBack, easeOut} from '../animations/core';

export type LonLat = [number, number];
export type USView = {lon0: number; lat0: number; lon1: number; lat1: number};
export type StateStyle = {fill?: string; t?: number; lift?: number; hatch?: number; outline?: string; opacity?: number};
type Box = [number, number, number, number];

export const MAPC = {
  sea: '#9DB7BD',
  seaLine: '#B3CACE',
  land: '#E6D9B8',
  territory: '#D6CBA2',
  foreign: '#C4C0B6',
  neighbour: '#C4C0B6',
  free: '#6F8FB8',
  union: '#3F6EA6',
  slave: '#C27A5A',
  confed: '#8E8A80',
  confedDark: '#6E6A62',
  border: '#D9C08E',
  route: C.darkRed,
  river: '#7FA6B0',
  ink: C.ink,
};
export const EXCEPTED_NOTE = 'excepted areas simplified';

// ------------------------------------------------------------------ data: states
const FIPS: Record<string, string> = {
  '01': 'AL', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS',
  '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ', '35': 'NM',
  '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA',
  '53': 'WA', '54': 'WV', '55': 'WI', '56': 'WY',
};
/** Admission as a state (fractional year). */
const ADMITTED: Record<string, number> = {
  DE: 1787, PA: 1787, NJ: 1787, GA: 1788, CT: 1788, MA: 1788, MD: 1788, SC: 1788, NH: 1788, VA: 1788, NY: 1788, NC: 1789, RI: 1790, VT: 1791, KY: 1792, TN: 1796, OH: 1803,
  LA: 1812.33, IN: 1816.95, MS: 1817.94, IL: 1818.92, AL: 1819.95, ME: 1820.21, MO: 1821.61, AR: 1836.45, MI: 1837.07, FL: 1845.17, TX: 1845.99, IA: 1846.99, WI: 1848.41,
  CA: 1850.69, MN: 1858.36, OR: 1859.12, KS: 1861.08, WV: 1863.47, NV: 1864.83, NE: 1867.17, CO: 1876.6, ND: 1889.84, SD: 1889.84, MT: 1889.86, WA: 1889.86, ID: 1890.5, WY: 1890.52,
  UT: 1896, OK: 1907.87, NM: 1912, AZ: 1912.12, DC: 1788,
};
/** Year from which the land was US (before: foreign). Whole-state simplification. */
const US_FROM: Record<string, number> = {FL: 1821.5, TX: 1845.99, OR: 1846.45, WA: 1846.45, ID: 1846.45, CA: 1848.1, NV: 1848.1, UT: 1848.1, AZ: 1848.1, NM: 1848.1};
export function statusOf(code: string, year: number): 'state' | 'territory' | 'foreign' {
  if (year < (US_FROM[code] ?? 0)) return 'foreign';
  return year >= (ADMITTED[code] ?? 9999) ? 'state' : 'territory';
}
export const STATE_NAME: Record<string, string> = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TOPO = usTopo as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GEOMS: any[] = TOPO.objects.states.geometries.filter((g: any) => FIPS[g.id]);
GEOMS.forEach((g) => (STATE_NAME[FIPS[g.id]] = g.properties.name));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WORLD = world as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NEIGHBOURS: any[] = (feature(WORLD, WORLD.objects.countries) as any).features.filter((f: {properties: {name: string}}) => ['Canada', 'Mexico', 'Cuba', 'Bahamas'].includes(f.properties.name));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NATION: any = merge(TOPO, GEOMS);

/** The display unit a feature belongs to in a given year (WV -> VA before 1863, ME -> MA before 1820, DC -> MD). */
const unitOf = (code: string, year: number, wvSeparate?: boolean) => {
  if (code === 'DC') return 'MD';
  if (code === 'WV' && !(wvSeparate ?? year >= ADMITTED.WV)) return 'VA';
  if (code === 'ME' && year < ADMITTED.ME) return 'MA';
  return code;
};

// ------------------------------------------------------------------ data: places (lon, lat)
export const PLACES: Record<string, LonLat> = {
  Hodgenville: [-85.74, 37.57], // Sinking Spring Farm, birthplace (1809)
  KnobCreek: [-85.68, 37.63],
  PigeonCreek: [-86.99, 38.12], // Little Pigeon Creek, Indiana (1816)
  Rockport: [-87.05, 37.88],
  Decatur: [-88.95, 39.84],
  NewSalem: [-89.84, 40.01],
  Springfield: [-89.65, 39.8],
  Chicago: [-87.63, 41.88],
  NewOrleans: [-90.07, 29.95],
  StLouis: [-90.19, 38.63],
  Cairo: [-89.18, 37.0],
  Louisville: [-85.76, 38.25],
  Cincinnati: [-84.51, 39.1],
  Pittsburgh: [-80.0, 40.44],
  Washington: [-77.04, 38.9],
  Richmond: [-77.43, 37.54],
  Baltimore: [-76.61, 39.29],
  Harrisburg: [-76.88, 40.27],
  Philadelphia: [-75.16, 39.95],
  NewYork: [-74.0, 40.71],
  Albany: [-73.76, 42.65],
  Buffalo: [-78.88, 42.89],
  Cleveland: [-81.69, 41.5],
  Columbus: [-82.99, 39.96],
  Indianapolis: [-86.16, 39.77],
  Charleston_SC: [-79.93, 32.78],
  FortSumter: [-79.87, 32.75],
  BullRun: [-77.52, 38.81],
  Gettysburg: [-77.23, 39.83],
  Atlanta: [-84.39, 33.75],
  Appomattox: [-78.8, 37.38],
  Vicksburg: [-90.88, 32.35],
  Montgomery: [-86.3, 32.38],
  // 1858 debate towns
  Ottawa: [-88.84, 41.35],
  Freeport: [-89.62, 42.3],
  Jonesboro: [-89.27, 37.45],
  Charleston: [-88.18, 39.5], // Charleston, Illinois
  Galesburg: [-90.37, 40.95],
  Quincy: [-91.41, 39.94],
  Alton: [-90.18, 38.89],
};
export const DEBATE_TOWNS: {name: string; at: LonLat; date: string}[] = [
  {name: 'Ottawa', at: PLACES.Ottawa, date: '21 Aug'},
  {name: 'Freeport', at: PLACES.Freeport, date: '27 Aug'},
  {name: 'Jonesboro', at: PLACES.Jonesboro, date: '15 Sep'},
  {name: 'Charleston', at: PLACES.Charleston, date: '18 Sep'},
  {name: 'Galesburg', at: PLACES.Galesburg, date: '7 Oct'},
  {name: 'Quincy', at: PLACES.Quincy, date: '13 Oct'},
  {name: 'Alton', at: PLACES.Alton, date: '15 Oct'},
];
/** Secession, December 1860 – February 1861 (the first seven), then the four after Fort Sumter. */
export const SECESSION: {code: string; date: string}[] = [
  {code: 'SC', date: '20 Dec 1860'}, {code: 'MS', date: '9 Jan 1861'}, {code: 'FL', date: '10 Jan 1861'}, {code: 'AL', date: '11 Jan 1861'},
  {code: 'GA', date: '19 Jan 1861'}, {code: 'LA', date: '26 Jan 1861'}, {code: 'TX', date: '1 Feb 1861'},
];
export const SECESSION_LATER: {code: string; date: string}[] = [{code: 'VA', date: '17 Apr 1861'}, {code: 'AR', date: '6 May 1861'}, {code: 'NC', date: '20 May 1861'}, {code: 'TN', date: '8 Jun 1861'}];
export const FREE_1860 = ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA', 'OH', 'IN', 'IL', 'MI', 'WI', 'MN', 'IA', 'CA', 'OR'];
export const SLAVE_1860 = ['DE', 'MD', 'VA', 'NC', 'SC', 'GA', 'FL', 'AL', 'MS', 'LA', 'TX', 'AR', 'TN', 'KY', 'MO'];
export const BORDER_STATES = ['DE', 'MD', 'KY', 'MO']; // (+ West Virginia from 1863)
export const CONFEDERACY = ['SC', 'MS', 'FL', 'AL', 'GA', 'LA', 'TX', 'VA', 'AR', 'NC', 'TN'];
/** Shaded on the 1 Jan 1863 Proclamation map. Tennessee wholly excepted; WV counties excepted (use wv="separate"
 *  and leave WV blank); parts of LA and VA excepted (ExceptedAreas, simplified). */
export const PROCLAMATION_SHADED = ['SC', 'MS', 'FL', 'AL', 'GA', 'LA', 'TX', 'VA', 'AR', 'NC'];
export const FUNERAL_ROUTE: LonLat[] = ['Washington', 'Baltimore', 'Harrisburg', 'Philadelphia', 'NewYork', 'Albany', 'Buffalo', 'Cleveland', 'Columbus', 'Indianapolis', 'Chicago', 'Springfield'].map((k) => PLACES[k]);
/** Drawn path for the funeral train: the 12 stops plus shore waypoints (via Erie, Pennsylvania) so the line keeps to
 *  land along Lake Erie. Use FUNERAL_ROUTE for stop dots, FUNERAL_PATH for the RouteLine. */
export const FUNERAL_PATH: LonLat[] = [...FUNERAL_ROUTE.slice(0, 7), [-79.6, 42.35], [-80.08, 42.13], [-80.9, 41.85], ...FUNERAL_ROUTE.slice(7)];
export const FUNERAL_STOPS = ['Washington', 'Baltimore', 'Harrisburg', 'Philadelphia', 'New York', 'Albany', 'Buffalo', 'Cleveland', 'Columbus', 'Indianapolis', 'Chicago', 'Springfield'];
export const BATTLES: {name: string; at: LonLat; date: string}[] = [
  {name: 'Bull Run', at: PLACES.BullRun, date: 'July 1861'},
  {name: 'Gettysburg', at: PLACES.Gettysburg, date: 'July 1863'},
  {name: 'Atlanta', at: PLACES.Atlanta, date: 'September 1864'},
  {name: 'Appomattox', at: PLACES.Appomattox, date: 'April 1865'},
];
/** Kentucky -> Indiana, December 1816 (wagon; approximate, crossing the Ohio near Troy). */
export const MOVE_1816: LonLat[] = [PLACES.KnobCreek, [-86.1, 37.85], [-86.7, 37.93], [-86.76, 37.98], PLACES.PigeonCreek];
/** Indiana -> Macon County, Illinois, March 1830 (approximate). */
export const MOVE_1830: LonLat[] = [PLACES.PigeonCreek, [-87.5, 38.68], [-88.2, 39.35], PLACES.Decatur];

// Rivers and Great Lakes: Natural Earth 1:50m (public domain), extracted to ./data/ne-water.json
// (rivers ordered source -> mouth so draw-on runs downstream).
export const RIVERS = WATER.rivers as Record<'ohio' | 'mississippi' | 'missouri' | 'tennessee' | 'wabash' | 'potomac', LonLat[]>;
export const OHIO: LonLat[] = RIVERS.ohio;
export const MISSISSIPPI: LonLat[] = RIVERS.mississippi;
const nearest = (pts: LonLat[], q: LonLat) => pts.reduce((bi, p, i) => (Math.hypot(p[0] - q[0], p[1] - q[1]) < Math.hypot(pts[bi][0] - q[0], pts[bi][1] - q[1]) ? i : bi), 0);
/** 1828 flatboat trip: Rockport down the Ohio and Mississippi to New Orleans (about 1,222 miles per the storyboard). */
export const FLATBOAT_1828: LonLat[] = [PLACES.Rockport, ...OHIO.slice(nearest(OHIO, PLACES.Rockport) + 1), ...MISSISSIPPI.slice(nearest(MISSISSIPPI, PLACES.Cairo) + 1, nearest(MISSISSIPPI, PLACES.NewOrleans) + 1), PLACES.NewOrleans];
// Kansas–Nebraska Act territories (1854): APPROXIMATE (west edge simplified along the continental divide).
export const KANSAS_T: LonLat[] = [[-94.62, 37.0], [-94.61, 39.1], [-94.9, 39.5], [-95.1, 39.8], [-95.31, 40.0], [-105.85, 40.0], [-105.9, 39.6], [-106.2, 39.1], [-106.3, 38.5], [-106.6, 37.9], [-106.8, 37.0]];
export const NEBRASKA_T: LonLat[] = [
  [-95.31, 40.0], [-95.75, 40.6], [-95.88, 41.25], [-96.1, 41.8], [-96.4, 42.5], [-97.4, 42.85], [-98.4, 42.95], [-99.3, 43.6], [-100.35, 44.37], [-100.6, 45.6], [-100.8, 46.8],
  [-101.4, 47.3], [-102.0, 47.55], [-102.4, 48.2], [-102.2, 49.0], [-114.05, 49.0], [-113.7, 48.5], [-113.0, 47.4], [-112.4, 46.4], [-113.0, 45.6], [-112.2, 44.6], [-111.3, 44.6],
  [-110.5, 44.3], [-109.6, 43.2], [-108.9, 42.35], [-107.6, 41.6], [-107.2, 41.0], [-106.4, 40.5], [-105.85, 40.0],
];
// Excepted areas of the Proclamation (simplified): Louisiana parishes around New Orleans; Virginia's Eastern Shore
// and the Norfolk / Hampton Roads counties.
const EXC_LA: LonLat[] = [[-91.95, 30.4], [-90.9, 30.38], [-90.4, 30.12], [-89.6, 30.08], [-89.3, 29.85], [-89.0, 29.3], [-89.6, 28.9], [-90.6, 28.95], [-91.5, 29.25], [-91.95, 29.5]];
const EXC_VA1: LonLat[] = [[-76.1, 38.05], [-75.2, 38.05], [-75.5, 37.5], [-75.9, 37.05], [-76.1, 37.1]];
const EXC_VA2: LonLat[] = [[-76.75, 37.4], [-76.25, 37.4], [-75.85, 36.9], [-75.8, 36.5], [-76.55, 36.5], [-76.65, 36.85]];
// Great Lakes (Natural Earth lakes) drawn over the neighbours: Natural Earth countries include the Canadian halves.
const LAKES: LonLat[][][] = WATER.lakes as LonLat[][][];

// ------------------------------------------------------------------ views and projection
export const VIEWS = {
  KY_IN_IL: {lon0: -91.8, lat0: 36.4, lon1: -83.2, lat1: 42.4},
  RIVER_ROUTE: {lon0: -96.5, lat0: 28.6, lon1: -80.5, lat1: 41.2},
  ILLINOIS: {lon0: -92.0, lat0: 36.9, lon1: -87.1, lat1: 42.6},
  NATION: {lon0: -124.8, lat0: 24.3, lon1: -66.8, lat1: 49.4},
  SOUTH: {lon0: -106.8, lat0: 24.8, lon1: -74.5, lat1: 40.6},
  WAR_EAST: {lon0: -89.0, lat0: 32.0, lon1: -73.5, lat1: 42.0},
  FUNERAL: {lon0: -91.5, lat0: 37.6, lon1: -72.6, lat1: 44.2},
  VIRGINIA: {lon0: -81.0, lat0: 36.4, lon1: -75.6, lat1: 40.3},
} satisfies Record<string, USView>;
export type ViewName = keyof typeof VIEWS;

const PROJ_CACHE = new Map<string, GeoProjection>();
/** Conic equal-area projection centred on the view, fitted into `box` (default leaves the caption band clear). */
export function usProjection(view: USView | ViewName, box: Box = [80, 40, 1840, 900]): GeoProjection {
  const v = typeof view === 'string' ? VIEWS[view] : view;
  const key = [v.lon0, v.lat0, v.lon1, v.lat1, ...box].join(',');
  const hit = PROJ_CACHE.get(key);
  if (hit) return hit;
  const pts: LonLat[] = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    pts.push([v.lon0 + (v.lon1 - v.lon0) * u, v.lat0], [v.lon0 + (v.lon1 - v.lon0) * u, v.lat1]);
  }
  pts.push([v.lon0, (v.lat0 + v.lat1) / 2], [v.lon1, (v.lat0 + v.lat1) / 2]);
  const cLon = (v.lon0 + v.lon1) / 2;
  const p = geoConicEqualArea().parallels([v.lat0 + (v.lat1 - v.lat0) / 6, v.lat1 - (v.lat1 - v.lat0) / 6]).rotate([-cLon, 0]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  p.fitExtent([[box[0], box[1]], [box[2], box[3]]], {type: 'MultiPoint', coordinates: pts} as any);
  PROJ_CACHE.set(key, p);
  return p;
}

const xy = (proj: GeoProjection, p: LonLat): [number, number] => proj(p) ?? [-9999, -9999];
const polyD = (proj: GeoProjection, pts: LonLat[]) => 'M' + pts.map((p) => xy(proj, p).map((n) => n.toFixed(1)).join(',')).join('L') + 'Z';
const lineD = (pts: [number, number][]) => 'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L');

/** Partial polyline (screen space) for draw-on t 0..1, plus the head point and heading. */
function partial(pts: [number, number][], t: number) {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  let left = total * clamp(t);
  const out: [number, number][] = [pts[0]];
  let angle = 0;
  for (let i = 0; i < seg.length; i++) {
    angle = (Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]) * 180) / Math.PI;
    if (left <= 0) break;
    const k = Math.min(1, left / Math.max(1e-6, seg[i]));
    out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]);
    left -= seg[i];
    if (k < 1) break;
  }
  return {out, head: out[out.length - 1], angle, total};
}
/** Screen point and heading (deg) at fraction t along a lon/lat route. */
export function routeAt(proj: GeoProjection, pts: LonLat[], t: number) {
  const r = partial(pts.map((p) => xy(proj, p)), t);
  return {x: r.head[0], y: r.head[1], angle: r.angle};
}

// ------------------------------------------------------------------ geometry cache per projection + year rule
type Built = {units: Record<string, string>; borders: string; nation: string; neighbours: string[]; centroid: Record<string, [number, number]>};
const BUILT = new Map<GeoProjection, Map<string, Built>>();
function build(proj: GeoProjection, year: number, wvSep?: boolean): Built {
  const rule = `${year >= ADMITTED.ME}-${wvSep ?? year >= ADMITTED.WV}-${Object.keys(ADMITTED).map((k) => statusOf(k, year)[0]).join('')}`;
  let m = BUILT.get(proj);
  if (!m) BUILT.set(proj, (m = new Map()));
  const hit = m.get(rule);
  if (hit) return hit;
  const path = geoPath(proj);
  const groups: Record<string, unknown[]> = {};
  GEOMS.forEach((g) => (groups[unitOf(FIPS[g.id], year, wvSep)] ??= []).push(g));
  const units: Record<string, string> = {};
  const centroid: Record<string, [number, number]> = {};
  Object.entries(groups).forEach(([k, gs]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geo = merge(TOPO, gs as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    units[k] = path(geo as any) ?? '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    centroid[k] = path.centroid(geo as any) as [number, number];
  });
  // ink borders only where at least one side is a state (territories share one tint), plus the outer edge
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const borders = path(mesh(TOPO, TOPO.objects.states, (a: any, b: any) => {
    if (!FIPS[a.id] || !FIPS[b.id]) return false;
    const ua = unitOf(FIPS[a.id], year, wvSep);
    const ub = unitOf(FIPS[b.id], year, wvSep);
    if (a === b) return true;
    if (ua === ub) return false;
    return statusOf(ua, year) === 'state' || statusOf(ub, year) === 'state';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any) ?? '';
  const out: Built = {units, borders, nation: path(NATION) ?? '', neighbours: NEIGHBOURS.map((f) => path(f) ?? ''), centroid};
  m.set(rule, out);
  return out;
}

function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) + ((((pb >> s) & 255) - ((pa >> s) & 255)) * clamp(t)));
  return '#' + ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0');
}

/** Diagonal hatch pattern def (id `hatch-<id>`). */
export const HatchDef: React.FC<{id: string; color?: string; w?: number; gap?: number}> = ({id, color = C.darkRed, w = 4, gap = 16}) => (
  <pattern id={`hatch-${id}`} patternUnits="userSpaceOnUse" width={gap} height={gap} patternTransform="rotate(45)">
    <rect width={w} height={gap} fill={color} />
  </pattern>
);

// ------------------------------------------------------------------ the map
export type USMapProps = {
  proj: GeoProjection;
  f: number;
  year: number;
  id: string;
  states?: Record<string, StateStyle>;
  /** Force West Virginia separate (e.g. the 1 Jan 1863 Proclamation map) or merged. Default: by year. */
  wv?: 'merged' | 'separate';
  neighbours?: boolean;
  rivers?: Partial<Record<'ohio' | 'mississippi' | 'missouri' | 'tennessee' | 'wabash' | 'potomac', number>>;
  lakes?: boolean;
  sea?: boolean;
  /** Base fill for states (default MAPC.land). */
  stateFill?: string;
  hatchColor?: string;
};
export const USMap: React.FC<USMapProps> = ({proj, f, year, id, states = {}, wv, neighbours = true, rivers, lakes = true, sea = true, stateFill = MAPC.land, hatchColor}) => {
  const wvSep = wv === undefined ? undefined : wv === 'separate';
  const B = build(proj, year, wvSep);
  const keys = Object.keys(B.units);
  const fillOf = (k: string) => {
    const st = statusOf(k, year);
    const base = st === 'state' ? stateFill : st === 'territory' ? MAPC.territory : MAPC.foreign;
    const s = states[k];
    return s?.fill ? mixHex(base, s.fill, s.t ?? 1) : base;
  };
  const flat = keys.filter((k) => !(states[k]?.lift && states[k]!.lift! > 0.2));
  const lifted = keys.filter((k) => states[k]?.lift && states[k]!.lift! > 0.2);
  return (
    <g>
      <defs>
        <HatchDef id={id} color={hatchColor} />
        <filter id={`lift-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx={0} dy={8} stdDeviation={5} floodColor="#000" floodOpacity={0.35} />
        </filter>
      </defs>
      {sea && (
        <g>
          <rect x={-3000} y={-3000} width={8000} height={8000} fill={MAPC.sea} />
          {Array.from({length: 16}, (_, i) => (
            <path key={i} d={`M-400,${40 + i * 66} q240,-14 480,0 t480,0 t480,0 t480,0 t480,0 t480,0`} stroke={MAPC.seaLine} strokeWidth={3} fill="none" opacity={0.5} transform={`translate(${((f * 0.4 + i * 37) % 480) - 240},0)`} />
          ))}
        </g>
      )}
      {neighbours && B.neighbours.map((d, i) => <path key={i} d={d} fill={MAPC.neighbour} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" opacity={0.95} />)}
      {flat.map((k) => (
        <path key={k} d={B.units[k]} fill={fillOf(k)} stroke={fillOf(k)} strokeWidth={1.2} opacity={states[k]?.opacity ?? 1} />
      ))}
      {flat.filter((k) => (states[k]?.hatch ?? 0) > 0).map((k) => <path key={'h' + k} d={B.units[k]} fill={`url(#hatch-${id})`} opacity={clamp(states[k]!.hatch!) * 0.55} />)}
      <path d={B.borders} fill="none" stroke={C.ink} strokeWidth={2.4} strokeLinejoin="round" />
      <path d={B.nation} fill="none" stroke={C.ink} strokeWidth={3.6} strokeLinejoin="round" />
      {lakes && LAKES.map((L, i) => <path key={i} d={L.map((r) => polyD(proj, r)).join(' ')} fill={MAPC.sea} fillRule="evenodd" stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />)}
      {rivers && (Object.keys(rivers) as (keyof typeof RIVERS)[]).map((k) => <RiverLine key={k} proj={proj} pts={RIVERS[k]} t={rivers[k] ?? 0} width={k === 'mississippi' || k === 'ohio' ? 5 : 3.5} />)}
      {flat.filter((k) => states[k]?.outline).map((k) => <path key={'o' + k} d={B.units[k]} fill="none" stroke={states[k]!.outline} strokeWidth={5} strokeLinejoin="round" />)}
      {lifted.map((k) => {
        const s = states[k]!;
        return (
          <g key={'l' + k} transform={`translate(0,${-s.lift!})`} filter={`url(#lift-${id})`}>
            <path d={B.units[k]} fill={fillOf(k)} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
            {(s.hatch ?? 0) > 0 && <path d={B.units[k]} fill={`url(#hatch-${id})`} opacity={clamp(s.hatch!) * 0.55} />}
          </g>
        );
      })}
    </g>
  );
};

/** Screen centroid of a state unit (VA includes WV while merged). */
export function stateCentre(proj: GeoProjection, code: string, year = 1860): [number, number] {
  if (LABEL_AT[code]) return xy(proj, LABEL_AT[code]);
  return build(proj, year).centroid[code] ?? [0, 0];
}
const LABEL_AT: Record<string, LonLat> = {FL: [-81.6, 28.4], LA: [-92.4, 31.1], MI: [-84.8, 43.4], KY: [-85.4, 37.55], VA: [-78.4, 37.5], MD: [-76.8, 39.45], TN: [-86.4, 35.8], NC: [-79.2, 35.55], SC: [-80.9, 33.85], TX: [-99.0, 31.4], MS: [-89.7, 32.7], AL: [-86.7, 32.7], GA: [-83.4, 32.6], AR: [-92.4, 34.8], MO: [-92.5, 38.4], IL: [-89.2, 40.0], IN: [-86.3, 39.9], OH: [-82.8, 40.3]};

/** State label (spaced capitals) at the state's centre. */
export const StateLabel: React.FC<{proj: GeoProjection; code: string; text?: string; t?: number; size?: number; dx?: number; dy?: number; color?: string; year?: number}> = ({proj, code, text, t = 1, size = 30, dx = 0, dy = 0, color = '#3E3226', year = 1860}) => {
  if (t <= 0) return null;
  const [x, y] = stateCentre(proj, code, year);
  return (
    <text x={x + dx} y={y + dy + size * 0.35} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={size} letterSpacing={size * 0.12} fill={color} stroke="#F4EBD6" strokeWidth={size * 0.16} paintOrder="stroke" opacity={clamp(t * 1.5)}>
      {(text ?? STATE_NAME[code] ?? code).toUpperCase()}
    </text>
  );
};

/** Town dot with a label; pops in with t; optional pulsing ring. */
export const PlaceDot: React.FC<{proj: GeoProjection; at: LonLat; label?: string; t?: number; side?: 'left' | 'right' | 'above' | 'below'; size?: number; dot?: number; color?: string; ring?: number; f?: number}> = ({
  proj, at, label, t = 1, side = 'right', size = 30, dot = 10, color = C.red, ring = 0, f = 0,
}) => {
  if (t <= 0) return null;
  const [x, y] = xy(proj, at);
  const k = easeBack(clamp(t * 1.6));
  const dx = side === 'right' ? dot + 12 : side === 'left' ? -dot - 12 : 0;
  const dy = side === 'above' ? -dot - 12 : side === 'below' ? dot + size + 4 : size * 0.36;
  const anchor = side === 'right' ? 'start' : side === 'left' ? 'end' : 'middle';
  const rp = ((f % 45) / 45);
  return (
    <g>
      {ring > 0 && <circle cx={x} cy={y} r={dot + rp * 34} fill="none" stroke={color} strokeWidth={4} opacity={ring * (1 - rp)} />}
      <circle cx={x} cy={y} r={dot * k} fill={color} stroke={C.ink} strokeWidth={3.5} />
      {label && (
        <text x={x + dx} y={y + dy} textAnchor={anchor} fontFamily={FONT.sans} fontWeight={800} fontSize={size} fill={C.ink} stroke="#F4EBD6" strokeWidth={size * 0.22} paintOrder="stroke" opacity={clamp((t - 0.25) * 2)}>
          {label}
        </text>
      )}
    </g>
  );
};

const Icon: React.FC<{kind: 'dot' | 'train' | 'wagon' | 'boat'; x: number; y: number; angle: number; s: number}> = ({kind, x, y, angle, s}) => {
  const flip = Math.abs(angle) > 90;
  const a = flip ? angle - 180 : angle;
  const ink = C.ink;
  if (kind === 'dot') return <circle cx={x} cy={y} r={12 * s} fill="#F4EBD6" stroke={ink} strokeWidth={4} />;
  return (
    <g transform={`translate(${x},${y}) rotate(${a * 0.25}) scale(${(flip ? -1 : 1) * s},${s})`}>
      {kind === 'train' && (
        <g>
          <rect x={-46} y={-30} width={30} height={20} fill="#2A2A30" stroke={ink} strokeWidth={3} />
          <rect x={-14} y={-24} width={36} height={14} rx={6} fill="#2A2A30" stroke={ink} strokeWidth={3} />
          <path d="M14,-24 L10,-40 L24,-40 L20,-24Z" fill="#2A2A30" stroke={ink} strokeWidth={3} />
          <path d="M22,-10 L34,-2 L22,-2Z" fill="#7E2620" stroke={ink} strokeWidth={2.5} />
          {[-38, -22, 2, 14].map((cx) => <circle key={cx} cx={cx} cy={-6} r={6} fill="#7E2620" stroke={ink} strokeWidth={2.5} />)}
          <circle cx={18} cy={-50} r={7} fill="#BDB8AE" opacity={0.8} />
        </g>
      )}
      {kind === 'wagon' && (
        <g>
          <path d="M-26,-14 Q-26,-44 0,-44 Q26,-44 26,-14Z" fill="#EFE6CF" stroke={ink} strokeWidth={3} />
          <rect x={-30} y={-16} width={60} height={12} fill="#8A6440" stroke={ink} strokeWidth={3} />
          {[-18, 18].map((cx) => <circle key={cx} cx={cx} cy={0} r={8} fill="#6B4A30" stroke={ink} strokeWidth={3} />)}
        </g>
      )}
      {kind === 'boat' && (
        <g>
          <path d="M-34,-10 L34,-10 L28,4 L-28,4Z" fill="#8A6440" stroke={ink} strokeWidth={3} />
          <rect x={-18} y={-24} width={26} height={14} fill="#A8865A" stroke={ink} strokeWidth={3} />
        </g>
      )}
    </g>
  );
};

/** A route that draws on with t (0..1); optional moving icon at its head (train, wagon, boat). */
export const RouteLine: React.FC<{proj: GeoProjection; pts: LonLat[]; t: number; color?: string; width?: number; dashed?: boolean; icon?: 'none' | 'dot' | 'train' | 'wagon' | 'boat'; iconScale?: number}> = ({
  proj, pts, t, color = MAPC.route, width = 7, dashed = true, icon = 'dot', iconScale = 1,
}) => {
  if (t <= 0) return null;
  const r = partial(pts.map((p) => xy(proj, p)), t);
  const d = lineD(r.out);
  return (
    <g>
      <path d={d} fill="none" stroke={C.ink} strokeWidth={width + 5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashed ? '18 10' : undefined} />
      {icon !== 'none' && (icon !== 'dot' || t < 0.995) && <Icon kind={icon} x={r.head[0]} y={r.head[1]} angle={r.angle} s={iconScale} />}
    </g>
  );
};

/** River (approximate polyline) that draws on with t. */
export const RiverLine: React.FC<{proj: GeoProjection; pts: LonLat[]; t?: number; width?: number}> = ({proj, pts, t = 1, width = 5}) => {
  if (t <= 0) return null;
  const d = lineD(partial(pts.map((p) => xy(proj, p)), t).out);
  return (
    <g>
      <path d={d} fill="none" stroke="#3E5A62" strokeWidth={width + 3} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={MAPC.river} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** Battle marker: crossed sabres in a ring (non-graphic), pops in with t. */
export const BattleMarker: React.FC<{proj: GeoProjection; at: LonLat; label?: string; t?: number; side?: 'left' | 'right' | 'above' | 'below'; size?: number; s?: number}> = ({proj, at, label, t = 1, side = 'right', size = 30, s = 1}) => {
  if (t <= 0) return null;
  const [x, y] = xy(proj, at);
  const k = easeBack(clamp(t * 1.6)) * s;
  const ink = C.ink;
  const dx = side === 'right' ? 34 * s : side === 'left' ? -34 * s : 0;
  const dy = side === 'above' ? -36 * s : side === 'below' ? 36 * s + size : size * 0.36;
  return (
    <g>
      <g transform={`translate(${x},${y}) scale(${k})`}>
        <circle r={24} fill="#F4EBD6" stroke={ink} strokeWidth={4} />
        {[-1, 1].map((sd) => (
          <g key={sd} transform={`rotate(${sd * 45})`}>
            <path d="M0,-17 Q3,0 0,15" stroke={ink} strokeWidth={4.5} fill="none" strokeLinecap="round" />
            <path d="M-6,10 H6" stroke={C.darkRed} strokeWidth={4} strokeLinecap="round" />
          </g>
        ))}
      </g>
      {label && (
        <text x={x + dx} y={y + dy} textAnchor={side === 'right' ? 'start' : side === 'left' ? 'end' : 'middle'} fontFamily={FONT.sans} fontWeight={800} fontSize={size} fill={ink} stroke="#F4EBD6" strokeWidth={size * 0.22} paintOrder="stroke" opacity={clamp((t - 0.25) * 2)}>
          {label}
        </text>
      )}
    </g>
  );
};

/** A hand-plotted territory polygon (e.g. KANSAS_T), clipped to US land; fades/fills in with t. */
export const TerritoryShape: React.FC<{proj: GeoProjection; pts: LonLat[]; id: string; t?: number; fill?: string; hatch?: number; hatchColor?: string; label?: string; labelAt?: LonLat; size?: number}> = ({
  proj, pts, id, t = 1, fill = '#C9A15A', hatch = 0, hatchColor = C.darkRed, label, labelAt, size = 30,
}) => {
  if (t <= 0) return null;
  const B = build(proj, 1860);
  const d = polyD(proj, pts);
  const c = labelAt ? xy(proj, labelAt) : (() => { const q = pts.map((p) => xy(proj, p)); return [q.reduce((a, b) => a + b[0], 0) / q.length, q.reduce((a, b) => a + b[1], 0) / q.length]; })();
  return (
    <g>
      <defs>
        <clipPath id={`terr-${id}`}><path d={B.nation} /></clipPath>
        <HatchDef id={`t-${id}`} color={hatchColor} />
      </defs>
      <g clipPath={`url(#terr-${id})`}>
        <path d={d} fill={fill} opacity={clamp(t) * 0.85} />
        {hatch > 0 && <path d={d} fill={`url(#hatch-t-${id})`} opacity={clamp(hatch) * 0.6} />}
        <path d={d} fill="none" stroke={C.ink} strokeWidth={3.5} strokeDasharray="12 7" opacity={clamp(t)} />
      </g>
      {label && (
        <text x={c[0]} y={c[1]} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={size} letterSpacing={size * 0.1} fill="#3E3226" stroke="#F4EBD6" strokeWidth={size * 0.18} paintOrder="stroke" opacity={clamp((t - 0.3) * 2)}>
          {label}
        </text>
      )}
    </g>
  );
};

/** Excepted areas of the Emancipation Proclamation (simplified): drawn in the base land colour with a dashed edge,
 *  over a shaded LA / VA. Pair with <MapNote text={EXCEPTED_NOTE} />. */
export const ExceptedAreas: React.FC<{proj: GeoProjection; id: string; t?: number; fill?: string}> = ({proj, id, t = 1, fill = MAPC.land}) => {
  if (t <= 0) return null;
  const B = build(proj, 1863, true);
  return (
    <g opacity={clamp(t)}>
      <defs>
        <clipPath id={`exla-${id}`}><path d={B.units.LA} /></clipPath>
        <clipPath id={`exva-${id}`}><path d={B.units.VA} /></clipPath>
      </defs>
      <g clipPath={`url(#exla-${id})`}><path d={polyD(proj, EXC_LA)} fill={fill} stroke={C.ink} strokeWidth={2.5} strokeDasharray="8 6" /></g>
      <g clipPath={`url(#exva-${id})`}>
        <path d={polyD(proj, EXC_VA1)} fill={fill} stroke={C.ink} strokeWidth={2.5} strokeDasharray="8 6" />
        <path d={polyD(proj, EXC_VA2)} fill={fill} stroke={C.ink} strokeWidth={2.5} strokeDasharray="8 6" />
      </g>
    </g>
  );
};

/** Small boxed note on a map (screen coords). */
export const MapNote: React.FC<{text: string; x: number; y: number; t?: number; anchor?: 'start' | 'middle' | 'end'; size?: number}> = ({text, x, y, t = 1, anchor = 'start', size = 24}) => {
  if (t <= 0) return null;
  const w = text.length * size * 0.56 + 36;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={clamp(t * 1.5)} transform={`translate(0,${(1 - easeOut(clamp(t))) * 10})`}>
      <rect x={x0} y={y - size - 10} width={w} height={size + 22} rx={8} fill="rgba(244,235,214,0.92)" stroke={C.ink} strokeWidth={3} />
      <text x={x0 + w / 2} y={y + 2} textAnchor="middle" fontFamily={FONT.sans} fontWeight={700} fontSize={size} fill={C.ink}>
        {text}
      </text>
    </g>
  );
};

/** Colour legend (screen coords). */
export const Legend: React.FC<{items: {fill: string; label: string; hatch?: boolean}[]; x: number; y: number; t?: number; id?: string; size?: number}> = ({items, x, y, t = 1, id = 'lg', size = 26}) => {
  if (t <= 0) return null;
  const w = Math.max(...items.map((i) => i.label.length)) * size * 0.58 + 90;
  return (
    <g opacity={clamp(t * 1.5)}>
      <defs><HatchDef id={`lg-${id}`} /></defs>
      <rect x={x} y={y} width={w} height={items.length * (size + 18) + 22} rx={10} fill="rgba(244,235,214,0.92)" stroke={C.ink} strokeWidth={3} />
      {items.map((it, i) => (
        <g key={i} transform={`translate(${x + 18},${y + 16 + i * (size + 18)})`}>
          <rect width={size + 8} height={size} rx={4} fill={it.fill} stroke={C.ink} strokeWidth={2.5} />
          {it.hatch && <rect width={size + 8} height={size} rx={4} fill={`url(#hatch-lg-${id})`} opacity={0.6} />}
          <text x={size + 22} y={size * 0.82} fontFamily={FONT.sans} fontWeight={700} fontSize={size} fill={C.ink}>
            {it.label}
          </text>
        </g>
      ))}
    </g>
  );
};
