// Historical overlay data for Episode 1 maps (lon/lat).
// Every line here is a hand-plotted APPROXIMATION, simplified for a 1080p map, and
// clipped to the Natural Earth coastline at render time. Sources and simplifications
// are recorded per item in production/environments/ep01-ww2/map-notes.md.
// Items marked PENDING_R01 wait for production/research/ep01-ww2/map-sources.md.
import type {Feature, Polygon} from 'geojson';
import {poly} from './geo';

export type LL = [number, number];

// ---------------------------------------------------------------- helpers
/** Resample a polyline to n points evenly spaced by (planar lon/lat) arc length. */
export function resample(pts: LL[], n: number): LL[] {
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = lens[lens.length - 1];
  const out: LL[] = [];
  let j = 1;
  for (let k = 0; k < n; k++) {
    const target = (total * k) / (n - 1);
    while (j < pts.length - 1 && lens[j] < target) j++;
    const seg = lens[j] - lens[j - 1] || 1;
    const t = Math.min(1, Math.max(0, (target - lens[j - 1]) / seg));
    out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * t, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * t]);
  }
  return out;
}

/** Interpolate between two polylines (resampled to the same count). */
export function lerpLine(a: LL[], b: LL[], t: number, n = 24): LL[] {
  const A = resample(a, n);
  const B = resample(b, n);
  return A.map((p, i) => [p[0] + (B[i][0] - p[0]) * t, p[1] + (B[i][1] - p[1]) * t]);
}

/** Great-circle length of a lon/lat polyline in km. */
export function lineKm(pts: LL[]): number {
  const R = 6371;
  let s = 0;
  for (let i = 1; i < pts.length; i++) {
    const [l1, p1] = pts[i - 1].map((d) => (d * Math.PI) / 180);
    const [l2, p2] = pts[i].map((d) => (d * Math.PI) / 180);
    const a = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2;
    s += 2 * R * Math.asin(Math.sqrt(a));
  }
  return s;
}

// ================================================================ M-02 Czechoslovakia
/** Carpathian Ruthenia (part of Czechoslovakia until March 1939; today Zakarpattia, Ukraine). */
export const RUTHENIA = poly([
  [22.15, 48.4], [22.55, 49.08], [23.2, 49.0], [23.9, 48.65], [24.6, 48.0], [24.0, 47.95], [23.3, 48.0], [22.9, 47.95], [22.6, 48.1],
]);
/** PENDING_R01 — Sudetenland (1938 cession): placeholder ring along the German-speaking border belt. */
export const SUDETENLAND_PLACEHOLDER = poly([
  // western/northern belt (Egerland → Northern Bohemia → Silesian part), outer edge = 1937 border
  [12.1, 50.3], [12.5, 50.4], [13.3, 50.62], [14.3, 51.05], [15.0, 50.88], [16.4, 50.65], [16.6, 50.2], [17.7, 50.25], [18.0, 49.95],
  // inner edge (heading back west, roughly 25–40 km inside the border)
  [17.3, 49.75], [16.6, 49.95], [16.0, 50.25], [15.2, 50.55], [14.3, 50.6], [13.8, 50.45], [13.3, 50.25], [13.0, 50.0], [13.1, 49.6],
  // south-west (Bohemian Forest) and south (South Moravia) narrow belt
  [13.7, 49.15], [14.4, 48.85], [15.3, 48.95], [16.0, 48.85], [16.9, 48.7], [16.95, 48.62], [16.0, 48.75], [15.0, 48.62], [14.6, 48.6],
  [13.8, 48.75], [12.8, 49.35], [12.4, 49.75],
]);

// ================================================================ M-03 Nazi–Soviet pact (23 Aug 1939)
/** Bessarabia (Romanian 1918–40; Soviet sphere under the secret protocol): Prut–Dniester–Danube. */
export const BESSARABIA = poly([
  [26.6, 48.3], [27.2, 48.45], [27.8, 48.45], [28.4, 48.15], [29.15, 47.95], [29.2, 47.3], [29.6, 46.85], [29.95, 46.55], [30.3, 46.15],
  [30.0, 45.75], [29.65, 45.35], [28.85, 45.32], [28.25, 45.45], [28.1, 45.9], [28.2, 46.5], [27.8, 47.2], [27.25, 47.75],
]);
/** Secret-protocol line in Poland, 23 Aug 1939: "approximately by the line of the rivers Narew, Vistula and San". */
export const PACT_LINE_AUG1939: LL[] = [
  [21.9, 53.42], [21.88, 53.23], [21.57, 53.08], [21.08, 52.7], [20.7, 52.43], [21.0, 52.23], [21.4, 51.9], [21.83, 51.56], [21.95, 51.1],
  [21.8, 50.68], [22.05, 50.5], [22.5, 50.1], [22.77, 49.78], [22.6, 49.35], [22.7, 49.05],
];

// ================================================================ M-04 1940 campaigns
export const ARROWS_1940 = {
  /** 9 April 1940: overland into Jutland. */
  denmark: [[9.4, 54.3], [9.3, 55.2], [9.6, 56.3]] as LL[],
  /** 9 April 1940: seaborne landings (draw dashed). */
  oslo: [[10.6, 54.6], [11.3, 56.6], [10.6, 58.7], [10.7, 59.7]] as LL[],
  bergen: [[8.0, 54.4], [6.3, 57.0], [4.9, 59.4], [5.2, 60.3]] as LL[],
  trondheim: [[7.6, 54.5], [4.5, 59.0], [6.0, 62.6], [10.2, 63.4]] as LL[],
  narvik: [[7.2, 54.6], [3.8, 60.0], [8.3, 64.8], [13.6, 67.9], [17.3, 68.4]] as LL[],
  /** 10 May 1940: Army Group B into the Netherlands and Belgium. */
  netherlands: [[7.0, 52.25], [5.9, 52.0], [4.55, 51.95]] as LL[],
  belgium: [[6.6, 51.0], [5.7, 50.85], [4.4, 50.85], [3.6, 50.7]] as LL[],
  /** 10–20 May 1940: Army Group A, Ardennes → Sedan (13 May) → Abbeville (20 May): the "sickle cut". */
  sickle: [[6.7, 50.2], [5.7, 49.9], [4.95, 49.72], [3.9, 49.83], [2.9, 49.93], [1.83, 50.11], [1.6, 50.2]] as LL[],
};
/** Allied pocket around Dunkirk, approx. 28–31 May 1940 (Gravelines–Bergues–Furnes–Nieuport perimeter, simplified). */
export const DUNKIRK_POCKET = poly([[2.0, 51.05], [2.12, 50.9], [2.4, 50.84], [2.7, 50.92], [2.9, 51.02], [2.85, 51.2], [2.4, 51.12]]);

// ================================================================ M-05 Eastern Front
/** 22 June 1941 start line = German/Axis–Soviet border (Baltic at Memel → Bug → San → Carpathians → Prut → Danube). */
export const FRONT_JUNE1941: LL[] = [
  [21.08, 55.85], [22.2, 55.1], [22.8, 54.4], [23.3, 54.1], [22.7, 53.65], [22.05, 53.4], [22.2, 52.95], [22.6, 52.6], [23.2, 52.3],
  [23.65, 52.08], [23.65, 51.6], [24.1, 50.9], [23.95, 50.4], [23.3, 50.1], [22.8, 49.8], [22.65, 49.25], [23.5, 48.65], [24.6, 47.95],
  [25.4, 47.95], [26.2, 48.12], [26.7, 48.3], [27.2, 47.85], [27.8, 47.2], [28.2, 46.5], [28.15, 45.9], [28.25, 45.45], [29.7, 45.25],
];
/** Optional northern extension along the Finnish–Soviet border (Finland joined the war on 25 June 1941). */
export const FRONT_JUNE1941_FINLAND: LL[] = [[28.0, 60.5], [29.5, 61.3], [31.0, 62.7], [30.0, 64.0], [29.6, 66.0], [29.1, 68.0], [31.0, 69.6]];

export const ARROWS_1941 = {
  /** Army Group North: East Prussia → Baltic states → Leningrad (siege from September 1941). */
  leningrad: [[21.8, 55.1], [24.5, 56.0], [27.5, 57.2], [29.3, 58.6], [30.2, 59.65]] as LL[],
  /** Army Group Centre: → Minsk → Smolensk → towards Moscow (stopped short, December 1941). */
  moscow: [[23.4, 52.6], [26.4, 53.6], [29.5, 54.4], [32.2, 54.8], [35.2, 55.3], [36.7, 55.6]] as LL[],
  /** Army Group South: → Ukraine → Kyiv (taken 19 September 1941). */
  kyiv: [[23.6, 50.5], [25.6, 50.55], [27.6, 50.4], [29.4, 50.4], [30.4, 50.45]] as LL[],
  /** Soviet counter-offensive before Moscow, from 5–6 December 1941 (pushed back roughly 100–250 km). */
  moscowCounter: [[37.4, 55.9], [36.4, 55.75], [35.3, 55.5], [34.4, 55.3]] as LL[],
  moscowCounterSouth: [[37.8, 54.5], [36.9, 54.2], [35.8, 53.9]] as LL[],
};

/** Operation Uranus, 19–23 November 1942: pincers meet at Kalach/Sovetsky. */
export const STALINGRAD = {
  northPincer: [[42.7, 49.65], [43.0, 49.3], [43.35, 48.95], [43.55, 48.7]] as LL[],
  southPincer: [[44.65, 48.15], [44.3, 48.25], [43.95, 48.45], [43.62, 48.62]] as LL[],
  /** Encircled Axis pocket between the Don and the Volga (approximate, late November 1942). */
  pocket: poly([[43.45, 48.95], [43.9, 49.15], [44.5, 49.0], [44.7, 48.75], [44.55, 48.5], [44.15, 48.4], [43.7, 48.55]]),
  city: [44.5, 48.7] as LL,
};

/** Operation Bagration, from 22 June 1944. */
export const FRONT_JUNE1944_BELARUS: LL[] = [
  [27.8, 56.4], [29.5, 55.6], [30.6, 55.1], [31.0, 54.45], [30.85, 53.8], [30.4, 53.15], [29.9, 52.5], [28.6, 52.0], [26.5, 51.7], [25.0, 51.25],
];
export const ARROWS_BAGRATION = {
  north: [[29.8, 55.8], [28.4, 55.4], [26.5, 55.2], [25.3, 54.7]] as LL[],
  centreN: [[31.2, 54.8], [29.6, 54.4], [28.3, 54.0], [27.6, 53.9]] as LL[],
  centreS: [[30.3, 52.6], [29.0, 53.0], [28.0, 53.6], [27.6, 53.85]] as LL[],
  west: [[27.3, 53.7], [25.3, 53.3], [23.5, 52.6], [21.6, 52.25]] as LL[],
};

// ================================================================ M-09 1944–45 fronts
/** Italy, spring 1944: Gustav Line (Garigliano mouth – Cassino – Sangro/Ortona). */
export const ITALY_GUSTAV_1944: LL[] = [[13.77, 41.22], [13.83, 41.49], [14.1, 41.75], [14.25, 42.05], [14.4, 42.33]];
/** Anzio beachhead (January–May 1944). */
export const ANZIO_BEACHHEAD = poly([[12.45, 41.6], [12.8, 41.62], [12.95, 41.45], [12.7, 41.38], [12.5, 41.45]]);
/** Italy, winter 1944–45: Gothic Line area (Apennines, La Spezia – Bologna front – Ravenna). */
export const ITALY_WINTER_1944: LL[] = [[10.0, 44.05], [10.6, 44.1], [11.3, 44.2], [11.9, 44.35], [12.3, 44.45]];

/** Western Front, mid-December 1944 (before the Ardennes offensive). North→south. */
export const WEST_DEC1944: LL[] = [
  [4.0, 51.85], [5.0, 51.8], [5.9, 51.85], [6.05, 51.4], [6.05, 51.0], [6.35, 50.7], [6.2, 50.2], [6.4, 49.6], [6.9, 49.2], [7.6, 48.9],
  [7.8, 48.45], [7.4, 48.1], [7.5, 47.55],
];
/** Western Front, mid-March 1945: the Rhine (Remagen bridgehead), with the Netherlands north of the rivers still held. */
export const WEST_MAR1945: LL[] = [
  [4.0, 51.85], [5.2, 51.8], [6.1, 51.85], [6.6, 51.65], [6.95, 50.94], [7.4, 50.6], [7.6, 50.35], [8.25, 50.0], [8.45, 49.5], [8.35, 49.0],
  [7.8, 48.4], [7.6, 47.56],
];
/** Western Front, about 20–25 April 1945: Elbe–Mulde–Czech border–Bavaria. */
export const WEST_APR1945: LL[] = [
  [6.6, 53.3], [9.0, 53.2], [10.6, 53.2], [11.6, 52.8], [11.7, 52.1], [12.3, 51.6], [12.9, 51.2], [12.5, 50.3], [13.0, 49.6], [12.6, 48.9],
  [11.6, 48.1], [11.0, 47.45],
];
/** Eastern Front, December 1944 (after Bagration): East Prussian border – Vistula – Carpathians – Budapest – Drava. North→south. */
export const EAST_DEC1944: LL[] = [
  [21.1, 55.7], [22.6, 54.9], [22.5, 54.3], [21.5, 53.1], [21.1, 52.25], [21.6, 51.5], [21.7, 50.6], [21.6, 49.4], [21.0, 48.6], [19.04, 47.5],
  [17.8, 46.8], [17.3, 45.9], [19.0, 45.0],
];
/** Eastern Front, mid-March 1945: Oder–Neisse – Silesia – Slovakia – Lake Balaton. */
export const EAST_MAR1945: LL[] = [
  [15.6, 54.2], [14.6, 53.4], [14.6, 52.6], [14.7, 52.0], [15.0, 51.3], [16.3, 50.8], [18.3, 49.8], [19.4, 48.9], [18.3, 47.9], [17.8, 46.8],
  [17.0, 46.0], [17.6, 45.2],
];
/** Eastern Front, about 20 April 1945: Soviet armies at Berlin, Vienna taken (13 April). */
export const EAST_APR1945: LL[] = [
  [13.9, 53.6], [13.8, 52.6], [13.65, 52.35], [14.0, 51.8], [14.3, 51.2], [15.0, 50.8], [16.5, 50.3], [17.8, 49.6], [16.9, 49.0], [16.4, 48.2],
  [16.0, 47.4], [15.8, 46.6],
];
/** Southern edge of the German-held block (Swiss border – Alps – Slovenia – Croatia), kept fixed. */
export const REICH_SOUTH_EDGE: LL[] = [[7.6, 47.56], [9.6, 47.55], [10.5, 46.9], [12.3, 46.6], [13.7, 46.5], [15.5, 46.0], [16.5, 45.6]];

export const FRONT_KEYS = {
  west: [WEST_DEC1944, WEST_MAR1945, WEST_APR1945],
  east: [EAST_DEC1944, EAST_MAR1945, EAST_APR1945],
  labels: ['DECEMBER 1944', 'MARCH 1945', 'APRIL 1945'],
};

/** Front line at time t in [0, 2] (0 = Dec 1944, 1 = Mar 1945, 2 = Apr 1945). */
export function frontAt(side: 'west' | 'east', t: number, n = 24): LL[] {
  const keys = FRONT_KEYS[side];
  const i = Math.min(keys.length - 2, Math.max(0, Math.floor(t)));
  return lerpLine(keys[i], keys[i + 1], Math.min(1, Math.max(0, t - i)), n);
}

/**
 * The shrinking German-held block between the western and eastern fronts at time t (0..2).
 * The northern edge runs over the sea (clipped away by the coastline clip).
 */
export function reichAt(t: number): Feature<Polygon> {
  const w = frontAt('west', t);
  const e = frontAt('east', t);
  const south = REICH_SOUTH_EDGE;
  const ring: LL[] = [
    [w[0][0], 58.0], ...w, ...south.filter((p) => p[0] > w[w.length - 1][0] && p[0] < e[e.length - 1][0]), ...e.slice().reverse(), [e[0][0], 58.0],
  ];
  return poly(ring);
}

/** German-held northern Italy: fixed Alpine edge + front interpolated winter 1944–45 (t ≤ 1) → the Po (late April 1945, t = 2). */
export const ITALY_PO_APR1945: LL[] = [[7.6, 44.95], [9.2, 45.1], [10.6, 45.05], [11.6, 45.0], [12.35, 45.25]];
export function italyFrontAt(t: number): LL[] {
  return lerpLine(ITALY_WINTER_1944, ITALY_PO_APR1945, Math.min(1, Math.max(0, t - 1)), 12);
}
export function italyHeldAt(t: number): Feature<Polygon> {
  const front = italyFrontAt(t);
  return poly([[7.1, 45.1], [6.85, 45.8], [7.6, 45.95], [8.5, 46.4], [10.5, 46.6], [12.3, 46.6], [13.7, 46.5], [13.9, 45.6], ...front.slice().reverse(), [8.0, 43.8], [7.5, 43.8]]);
}
/** Area held west of an Eastern-Front line (front north→south), used for the Bagration map fill. */
export function heldWestOf(front: LL[]): Feature<Polygon> {
  const n = front[0];
  const s = front[front.length - 1];
  return poly([...front, [s[0], 47.5], [5.0, 47.5], [5.0, 58.5], [n[0], 58.5]]);
}
/** Area east of an Eastern-Front line (Soviet-held), for the Bagration map fill. */
export function heldEastOf(front: LL[]): Feature<Polygon> {
  const n = front[0];
  const s = front[front.length - 1];
  return poly([...front, [s[0], 47.5], [50.0, 47.5], [50.0, 62.0], [n[0], 62.0]]);
}

/** Converging arrows on Berlin, 1945. */
export const ARROWS_1945 = {
  westNorth: [[6.6, 51.7], [8.5, 52.1], [10.5, 52.3], [11.6, 52.2]] as LL[],
  westSouth: [[7.3, 50.6], [9.2, 50.9], [11.0, 51.2], [12.5, 51.45]] as LL[],
  eastBerlin: [[14.65, 52.6], [14.1, 52.55], [13.55, 52.52]] as LL[],
  eastSouth: [[15.0, 51.4], [14.2, 51.5], [13.1, 51.55]] as LL[],
  italy: [[11.3, 44.3], [11.3, 45.0], [11.4, 45.8]] as LL[],
  /** Allied armies meet on the Elbe at Torgau, 25 April 1945. */
  torgau: [13.0, 51.56] as LL,
};

// ================================================================ M-06 East Asia
/** Manchuria, 1931–32 (the three north-eastern provinces seized after the Mukden Incident). Approximate. */
export const MANCHURIA_1931 = poly([
  [119.8, 40.0], [121.0, 38.4], [124.3, 39.7], [124.4, 40.1], [125.6, 40.8], [126.6, 41.7], [128.1, 42.0], [129.5, 42.45], [130.6, 42.45],
  [131.1, 43.3], [131.2, 44.8], [132.4, 45.2], [133.1, 45.5], [134.1, 46.8], [134.7, 47.7], [133.0, 48.1], [131.0, 47.7], [130.6, 48.9],
  [127.5, 49.8], [125.6, 52.9], [123.5, 53.5], [121.0, 53.3], [120.0, 52.6], [119.1, 50.3], [117.8, 49.5], [116.2, 47.9], [118.2, 47.0],
  [119.8, 46.6], [121.4, 45.3], [120.6, 43.6], [120.9, 42.2],
]);
export const ARROWS_CHINA_1937 = {
  /** July 1937 onwards: from the Beijing area south along the railways. */
  north: [[116.4, 39.9], [115.5, 38.9], [114.5, 38.0], [113.7, 36.6]] as LL[],
  /** August–December 1937: Shanghai → Nanjing (captured 13 December 1937). */
  shanghai: [[121.47, 31.23], [120.4, 31.55], [119.6, 31.9], [118.85, 32.05]] as LL[],
};
/** 9 August 1945: Soviet invasion of Manchuria on three fronts. */
export const ARROWS_MANCHURIA_1945 = {
  transbaikal: [[114.8, 46.6], [118.5, 45.6], [122.2, 44.5], [125.2, 43.9]] as LL[],
  firstFarEast: [[131.6, 44.6], [130.2, 44.6], [128.4, 45.0], [126.8, 45.6]] as LL[],
  secondFarEast: [[129.5, 49.6], [128.4, 48.2], [127.3, 46.8], [126.7, 45.9]] as LL[],
};
/** PENDING_R01 — Japanese-controlled areas, December 1941. Placeholder rings, NOT verified. */
export const JAPAN_1941_PLACEHOLDER: Feature<Polygon>[] = [
  // Korea, Manchukuo and occupied north/east China (very rough eastern China belt)
  poly([[124.3, 39.7], [119.8, 40.0], [117.5, 38.8], [114.6, 37.0], [113.5, 35.0], [114.3, 32.0], [113.0, 30.5], [114.5, 29.0], [117.0, 29.0],
    [119.5, 28.0], [121.9, 29.5], [122.5, 32.0], [121.0, 38.4]]),
  // Manchukuo incl. Jehol (from 1933)
  poly([[117.5, 40.4], [119.8, 40.0], [124.3, 39.7], [128.1, 42.0], [130.6, 42.45], [131.2, 44.8], [134.7, 47.7], [127.5, 49.8], [125.6, 52.9],
    [121.0, 53.3], [119.1, 50.3], [116.2, 47.9], [119.8, 46.6], [119.0, 43.5], [117.0, 42.0]]),
  // Taiwan and French Indochina (Japanese troops from 1940–41)
  poly([[119.9, 25.4], [122.2, 25.4], [121.0, 21.8], [120.0, 22.4]]),
  poly([[102.1, 22.4], [106.7, 23.0], [108.5, 21.5], [109.5, 12.0], [105.0, 8.4], [102.3, 12.5], [100.1, 17.5], [101.2, 21.5]]),
];

// ================================================================ M-07 Pacific
/** Midway, 4 June 1942 (approximate fleet positions at the time of the American strikes). */
export const MIDWAY = {
  island: [-177.37, 28.2] as LL,
  /** Kido Butai (four carriers), ~240 nautical miles north-west of Midway; Akagi was scuttled near 30.5°N 178.7°W. */
  japaneseCarriers: [-178.7, 30.6] as LL,
  /** US Task Forces 16 and 17, north-east of Midway; Yorktown sank near 30.6°N 176.6°W. */
  usCarriers: [-176.0, 31.7] as LL,
};
/** Island-hopping route (simplified): Guadalcanal (Aug 1942) → Saipan (Jun 1944) → Iwo Jima (Feb 1945) → Okinawa (Apr 1945). */
export const ISLAND_HOPPING: LL[] = [[160.0, -9.6], [155.0, -2.0], [150.0, 7.0], [145.75, 15.18], [141.32, 24.78], [127.8, 26.3]];
export const ISLAND_HOPPING_STOPS = ['Guadalcanal', 'Saipan', 'Iwo Jima', 'Okinawa'];

// ================================================================ M-08 Normandy (PENDING_R01 for verification)
/** D-Day beaches, west → east. Label points sit offshore of each sector; nationality per standard histories. */
export const DDAY_BEACHES: {name: string; nation: 'US' | 'UK' | 'CA'; at: LL; sector: LL[]}[] = [
  {name: 'UTAH', nation: 'US', at: [-1.17, 49.45], sector: [[-1.26, 49.5], [-1.15, 49.37]]},
  {name: 'OMAHA', nation: 'US', at: [-0.86, 49.41], sector: [[-0.95, 49.38], [-0.76, 49.36]]},
  {name: 'GOLD', nation: 'UK', at: [-0.56, 49.375], sector: [[-0.65, 49.35], [-0.47, 49.335]]},
  {name: 'JUNO', nation: 'CA', at: [-0.42, 49.365], sector: [[-0.47, 49.335], [-0.35, 49.325]]},
  {name: 'SWORD', nation: 'UK', at: [-0.29, 49.325], sector: [[-0.35, 49.31], [-0.23, 49.29]]},
];
/** Airborne drop zones (approximate centres): US 82nd/101st west of Utah, British 6th east of the Orne. */
export const DDAY_DROPS: {label: string; at: LL; nation: 'US' | 'UK'}[] = [
  {label: '82nd', at: [-1.35, 49.41], nation: 'US'},
  {label: '101st', at: [-1.25, 49.37], nation: 'US'},
  {label: '6th', at: [-0.24, 49.22], nation: 'UK'},
];
