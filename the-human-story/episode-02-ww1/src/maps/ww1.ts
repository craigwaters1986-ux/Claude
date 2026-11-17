// Episode 2 (WW1) historical map data, lon/lat.
// Every border here is a hand-plotted APPROXIMATION (simplified to roughly 5–15 km for a 1080p map)
// and is clipped to the Natural Earth coastline at render time.  States are built as ORDERED mask
// operations on Natural Earth 1:50m modern countries plus these polygons (add = paint, sub = cut out),
// so modern borders that already match the 1914 / 1923 line are reused exactly.
// Sources and simplifications: production/environments/ep02-ww1/map-notes.md.
import type {Feature, Polygon} from 'geojson';
import {poly, ALSACE_LORRAINE, GERMANY_1937, EAST_PRUSSIA, POLAND_1939, POLAND_SOVIET_ZONE} from './geo';
import {NORTH_SCHLESWIG, MEMEL, DANZIG, SAAR} from './versailles';
import {RUTHENIA} from './history';
import {C} from '../styles/theme';

export type LL = [number, number];
/** One mask operation: add (paint) or subtract a modern country (by Natural Earth 50m name) or a polygon. */
export type Op = {add: string | Feature} | {sub: string | Feature};
export type StateDef = {id: string; ops: Op[]};

const A = (x: string | Feature): Op => ({add: x});
const S = (x: string | Feature): Op => ({sub: x});

// ------------------------------------------------------------------ 1914 border lines
/** German–Russian border, 1914, from the Baltic at Nimmersatt to the Three Emperors' Corner (Myslowitz). */
export const GR_BORDER_1914: LL[] = [
  [21.06, 55.87], [21.2, 55.85], [21.3, 55.7], [21.45, 55.55], [21.65, 55.38], [22.0, 55.2], [22.6, 55.07], [22.85, 54.8], [22.85, 54.38],
  [22.75, 54.05], [22.5, 53.7], [22.1, 53.5], [21.6, 53.45], [21.0, 53.3], [20.5, 53.25], [20.4, 53.15], [19.3, 53.05], [18.75, 52.9],
  [18.35, 52.6], [17.8, 52.3], [17.95, 51.75], [18.0, 51.5], [18.12, 51.3], [18.2, 51.15], [18.45, 51.05], [18.75, 50.85], [19.0, 50.68],
  [19.15, 50.55], [19.17, 50.24],
];
/** Prussian Silesia – Galicia / Austrian Silesia border (Przemsza, Vistula, to Oderberg). */
export const AG_BORDER_1914: LL[] = [[19.17, 50.24], [19.2, 50.02], [18.95, 49.95], [18.6, 49.93], [18.33, 49.92]];
/** Austro-Russian border, 1914: Three Emperors' Corner – Vistula – San mouth – Bug – Zbruch – Dniester – Bukovina. */
export const AR_BORDER_1914: LL[] = [
  [19.17, 50.24], [19.4, 50.28], [19.65, 50.25], [19.95, 50.2], [20.2, 50.18], [20.45, 50.2], [20.72, 50.24], [21.0, 50.33], [21.3, 50.45],
  [21.55, 50.55], [21.75, 50.68], [21.86, 50.8], [22.15, 50.62], [22.45, 50.5], [22.65, 50.4], [22.95, 50.35], [23.3, 50.4], [23.65, 50.42],
  [24.0, 50.45], [24.15, 50.6], [24.4, 50.55], [24.7, 50.35], [25.0, 50.2], [25.25, 50.13], [25.55, 49.98], [25.85, 49.75], [26.1, 49.55],
  [26.15, 49.25], [26.2, 49.0], [26.35, 48.7], [26.4, 48.55], [26.3, 48.35], [26.27, 48.22],
];
/** Romania (Old Kingdom) – Austria-Hungary border, 1914: Iron Gates – Southern and Eastern Carpathians – Bukovina – Prut. */
export const ROMANIA_AH_1914: LL[] = [
  [22.45, 44.72], [22.55, 44.95], [22.75, 45.15], [23.1, 45.35], [23.55, 45.38], [24.0, 45.35], [24.35, 45.45], [24.75, 45.55], [25.1, 45.45],
  [25.3, 45.42], [25.6, 45.48], [25.95, 45.45], [26.25, 45.55], [26.45, 45.85], [26.42, 46.2], [26.1, 46.5], [26.05, 46.7], [25.85, 46.9],
  [25.75, 47.05], [25.55, 47.25], [25.9, 47.4], [26.2, 47.55], [26.3, 47.68], [26.1, 47.85], [26.2, 48.0], [26.27, 48.22],
];
/** Romania – Bulgaria border, 1913–40 (Tutrakan – Ekrene): Southern Dobruja Romanian. */
export const DOBRUJA_LINE_1913: LL[] = [[26.62, 44.05], [26.9, 43.8], [27.2, 43.6], [27.6, 43.45], [28.05, 43.33]];
/** Hungary (Vojvodina/Srem) – Serbia border, 1914: the Sava and the Danube. */
export const SAVA_DANUBE_1914: LL[] = [[19.35, 44.88], [19.7, 44.93], [20.1, 44.8], [20.45, 44.83], [20.8, 44.72], [21.1, 44.7], [21.45, 44.75]];
/** Austria-Hungary – Italy border, 1914 (Stelvio – Tonale – Garda – Asiago – Cortina – Carnic Alps). */
export const TRENTINO_LINE_1914: LL[] = [
  [10.45, 46.53], [10.58, 46.26], [10.5, 46.0], [10.52, 45.78], [10.8, 45.82], [10.95, 45.69], [11.2, 45.8], [11.5, 45.9], [11.75, 45.98],
  [11.95, 46.15], [12.15, 46.35], [12.35, 46.6],
];
export const ISONZO_LINE_1914: LL[] = [[13.3, 46.55], [13.4, 46.3], [13.45, 46.12], [13.48, 45.97], [13.38, 45.85], [13.3, 45.7]];
/** Bulgaria (Western Thrace, 1913–19) – Greece border: the Mesta. */
export const MESTA_LINE: LL[] = [[24.7, 40.85], [24.55, 41.2], [24.55, 41.45]];
/** German–Danish border, 1864–1920 (Kongeå). */
export const KONGEA_LINE: LL[] = [[8.6, 55.45], [9.15, 55.47], [9.65, 55.45]];
/** Alsace-Lorraine western edge (Franco-German border 1871–1918). */
export const AL_LINE: LL[] = [[5.95, 49.48], [5.95, 49.1], [6.0, 48.98], [6.2, 48.9], [6.45, 48.8], [6.8, 48.62], [7.12, 48.5], [7.05, 48.15], [6.85, 47.82], [7.1, 47.5]];
/** Russian–Ottoman border in the Caucasus (Kars and Ardahan Russian 1878–1918). */
export const KARS_LINE: LL[] = [[41.55, 41.5], [41.6, 40.9], [41.9, 40.5], [42.6, 40.1], [43.4, 40.0]];

// ------------------------------------------------------------------ 1914 helper polygons
/** German lands east of today's Oder–Neisse line, incl. Memelland (generous to the west and north; Czechia is cut out). */
export const GERMAN_EAST_1914 = poly([
  [14.1, 54.5], [15.5, 54.7], [16.5, 54.9], [18.0, 55.1], [19.5, 55.25], [20.9, 55.6], [21.0, 55.9], ...GR_BORDER_1914, ...AG_BORDER_1914.slice(1),
  [17.0, 49.9], [16.0, 49.8], [14.4, 50.3], [14.1, 51.0],
]);
/** Galicia + Bukovina + Carpathian Ruthenia (Austro-Hungarian; generous to the south where Hungary lies anyway). */
export const GALICIA_1914 = poly([...AR_BORDER_1914, [26.4, 47.5], [25.0, 46.8], [22.5, 47.6], [21.0, 48.3], [19.0, 48.9], [18.4, 49.4], ...AG_BORDER_1914.slice().reverse()]);
/** Romania's Old Kingdom: Wallachia + Moldavia + Northern Dobruja (generous east/south: Moldova, Ukraine, Bulgaria, Serbia are cut out). */
export const OLD_ROMANIA = poly([...ROMANIA_AH_1914, [26.62, 48.26], [27.5, 48.3], [29.0, 47.0], [29.0, 45.6], [30.0, 45.2], [29.9, 44.0], [28.9, 43.4], [28.0, 43.0], [22.6, 43.0], [22.35, 44.2]]);
export const SOUTH_DOBRUJA = poly([...DOBRUJA_LINE_1913, [28.9, 43.3], [28.9, 44.3], [26.62, 44.3]]);
export const VOJVODINA = poly([[18.8, 44.95], ...SAVA_DANUBE_1914, [21.6, 45.3], [21.0, 46.3], [19.0, 46.3], [18.8, 45.8]]);
export const TRENTINO = poly([...TRENTINO_LINE_1914, [12.7, 47.0], [11.0, 47.3], [10.47, 46.88]]);
export const LITORALE = poly([...ISONZO_LINE_1914, [13.6, 45.4], [14.5, 45.5], [14.5, 46.6]]);
export const WESTERN_THRACE = poly([...MESTA_LINE, [25.2, 41.3], [25.9, 41.35], [26.1, 41.3], [26.18, 41.0], [26.05, 40.72], [25.0, 40.5]]);
export const KARS = poly([...KARS_LINE, [43.7, 40.4], [43.45, 41.15], [42.5, 41.45]]);

// ------------------------------------------------------------------ 1919–23 helper polygons
/** Istria, Trieste, Gorizia and western Carniola: to Italy (Rapallo, 1920). */
export const ISTRIA_1920 = poly([[13.6, 46.52], [13.85, 46.38], [14.05, 46.0], [14.2, 45.8], [14.35, 45.5], [14.45, 45.35], [14.1, 44.9], [13.4, 44.8], [13.3, 45.7], [13.5, 45.95]]);
/** Bukovina + northern Bessarabia (Khotyn) – Romanian 1918–40 (today's Chernivtsi region, Ukraine). */
export const BUKOVINA_N = poly([[25.3, 47.73], [24.95, 47.95], [25.2, 48.15], [25.55, 48.35], [25.95, 48.48], [26.45, 48.55], [27.0, 48.45], [27.4, 48.48], [27.2, 48.25], [26.62, 48.26], [26.27, 48.22], [25.9, 47.95]]);
/** Southern Bessarabia (Budjak) – Romanian 1918–40 (today in Ukraine). */
export const BUDJAK = poly([[28.2, 45.45], [28.85, 45.3], [29.7, 45.15], [30.15, 45.9], [30.15, 46.2], [29.9, 46.4], [29.6, 46.4], [29.0, 46.1], [28.6, 45.95]]);
export {DANZIG, SAAR, MEMEL};

// ------------------------------------------------------------------ Brest-Litovsk (3 March 1918) — APPROXIMATE
/** Western Belarus ceded at Brest-Litovsk (line Dvinsk – Svir – Pruzhany – Brest, simplified). */
export const BREST_BELARUS = poly([[23.0, 54.4], [26.5, 55.7], [26.2, 55.1], [25.9, 54.3], [25.3, 53.6], [24.9, 52.9], [24.4, 52.5], [23.6, 52.1], [23.0, 52.3]]);
/** Eastern Front, winter 1917–18 (Gulf of Riga – Dvinsk – Baranovichi – Pinsk – Lutsk – Brody – Czernowitz – Romanian front). */
export const EAST_FRONT_1917: LL[] = [
  [24.4, 57.15], [25.2, 56.6], [26.4, 55.9], [26.6, 55.3], [26.8, 54.6], [26.2, 53.6], [25.9, 53.0], [26.0, 52.2], [25.5, 51.4], [25.2, 50.8],
  [25.0, 50.4], [25.3, 49.6], [25.7, 49.1], [25.95, 48.5], [26.0, 47.8], [26.4, 46.6], [27.0, 45.8], [27.9, 45.4], [28.6, 45.25],
];
/** Tannenberg, 26–30 August 1914 (schematic). */
export const TANNENBERG = {
  russianArrow: [[20.4, 52.85], [20.3, 53.2], [20.25, 53.48], [20.35, 53.72]] as LL[],
  germanWest: [[19.45, 53.65], [19.8, 53.5], [20.1, 53.4]] as LL[],
  germanEast: [[21.25, 53.95], [20.95, 53.62], [20.6, 53.42]] as LL[],
  firstArmy: [[23.2, 54.6], [22.6, 54.62], [22.0, 54.6]] as LL[],
  battle: [20.15, 53.5] as LL,
};

// ------------------------------------------------------------------ Western Front
/** Front line, winter 1914–15 (static until 1917): Nieuport – Ypres – Arras – the Somme – Noyon – Soissons – Reims – the Argonne – Verdun – St-Mihiel – the Vosges – Swiss border. */
export const WF_NORTH: LL[] = [
  [2.75, 51.14], [2.85, 51.03], [2.88, 50.93], [2.97, 50.9], [3.0, 50.86], [2.93, 50.8], [2.9, 50.74], [2.85, 50.65], [2.79, 50.56], [2.78, 50.45],
  [2.8, 50.36], [2.82, 50.3],
];
export const WF_MID_1915: LL[] = [[2.82, 50.3], [2.75, 50.18], [2.65, 50.1], [2.72, 50.0], [2.78, 49.85], [2.8, 49.7], [2.95, 49.6], [3.1, 49.48], [3.45, 49.48]];
export const WF_SOUTH: LL[] = [
  [3.45, 49.48], [3.7, 49.42], [3.9, 49.38], [4.05, 49.3], [4.4, 49.2], [4.8, 49.18], [5.05, 49.22], [5.3, 49.25], [5.5, 49.22], [5.62, 49.08],
  [5.55, 48.9], [5.75, 48.87], [6.05, 48.9], [6.25, 48.88], [6.55, 48.72], [6.88, 48.5], [7.05, 48.3], [7.12, 48.05], [7.2, 47.87], [7.15, 47.7], [7.1, 47.5],
];
/** Middle sector before 21 March 1918 (Hindenburg Line, after Cambrai). */
export const WF_MID_MAR1918: LL[] = [[2.82, 50.3], [2.9, 50.2], [3.08, 50.12], [3.12, 50.02], [3.18, 49.88], [3.3, 49.72], [3.38, 49.6], [3.45, 49.48]];
/** Middle sector, early April 1918: the bulge towards Amiens (up to ~64 km). */
export const WF_MID_APR1918: LL[] = [[2.82, 50.3], [2.7, 50.15], [2.62, 50.0], [2.55, 49.87], [2.48, 49.77], [2.57, 49.65], [2.85, 49.58], [3.1, 49.55], [3.45, 49.48]];
/** Front line at the Armistice, 11 November 1918 (Ghent – Mons – Sedan – Pont-à-Mousson – Vosges). */
export const WF_NOV1918: LL[] = [
  [3.8, 51.25], [3.75, 51.05], [3.85, 50.85], [3.85, 50.65], [3.95, 50.47], [4.1, 50.3], [4.3, 50.05], [4.5, 49.9], [4.75, 49.78], [4.95, 49.65],
  [5.2, 49.45], [5.4, 49.3], [5.75, 49.12], [5.95, 49.0], [6.05, 48.9], [6.25, 48.88], [6.55, 48.72], [6.88, 48.5], [7.05, 48.3], [7.12, 48.05],
  [7.2, 47.87], [7.15, 47.7], [7.1, 47.5],
];
export const WF_1915: LL[] = [...WF_NORTH, ...WF_MID_1915.slice(1), ...WF_SOUTH.slice(1)];
export const WF_MAR1918: LL[] = [...WF_NORTH, ...WF_MID_MAR1918.slice(1), ...WF_SOUTH.slice(1)];

export const WF_ARROWS = {
  /** August–September 1914: German armies through Belgium into France (schematic: 1st, 2nd and 3rd/4th Armies). */
  germanRight: [[6.1, 50.78], [5.6, 50.65], [4.4, 50.85], [3.9, 50.45], [3.1, 49.75], [2.85, 49.05]] as LL[],
  germanCentre: [[6.3, 50.4], [5.2, 50.4], [4.45, 50.35], [3.8, 49.65], [3.4, 49.0]] as LL[],
  germanLeft: [[6.0, 49.75], [5.2, 49.6], [4.6, 49.35], [4.2, 48.95]] as LL[],
  /** 23 August 1914: the BEF at Mons, then the retreat. */
  britishMons: [[3.75, 50.15], [3.92, 50.4]] as LL[],
  britishRetreat: [[3.95, 50.38], [3.6, 49.75], [3.0, 49.15], [2.85, 48.85]] as LL[],
  /** 9–13 September 1914: German retreat from the Marne to the Aisne. */
  marneBack: [[3.0, 48.98], [3.15, 49.2], [3.3, 49.4]] as LL[],
  marneBack2: [[3.6, 48.95], [3.75, 49.15], [3.85, 49.38]] as LL[],
  /** Verdun 1916: German attacks converge; French reinforcement up the Voie Sacrée from Bar-le-Duc. */
  verdun: [[[5.3, 49.45], [5.36, 49.24]], [[5.62, 49.4], [5.43, 49.22]], [[5.75, 49.18], [5.48, 49.17]]] as LL[][],
  voieSacree: [[5.16, 48.75], [5.25, 48.95], [5.33, 49.1]] as LL[],
  /** 1 July 1916: the Somme. */
  somme: [[2.5, 49.98], [2.85, 50.0]] as LL[],
  /** Small probing arrows that bounce off the static line (1915). */
  bumps: [
    [[2.55, 50.6], [2.8, 50.58]], [[3.2, 50.4], [2.88, 50.38]], [[2.6, 49.6], [2.82, 49.65]], [[4.4, 49.45], [4.4, 49.24]], [[4.6, 48.95], [4.65, 49.15]], [[6.8, 48.8], [6.55, 48.75]],
  ] as LL[][],
};
/** "Race to the sea", autumn 1914: four leapfrogging Allied/German arrow pairs, south → north. */
export const RACE_PAIRS: {allied: LL[]; german: LL[]}[] = [
  {allied: [[2.55, 49.45], [2.5, 49.75]], german: [[2.95, 49.5], [2.88, 49.78]]},
  {allied: [[2.5, 49.85], [2.55, 50.2]], german: [[2.88, 49.9], [2.92, 50.25]]},
  {allied: [[2.55, 50.3], [2.6, 50.65]], german: [[2.97, 50.35], [3.02, 50.7]]},
  {allied: [[2.6, 50.75], [2.65, 51.06]], german: [[3.05, 50.8], [2.98, 51.1]]},
];
/** Somme, 1 July – 18 November 1916: the front crept forward a few miles (simplified Serre–Maricourt sector). */
export const SOMME_JUL1916: LL[] = [[2.62, 50.12], [2.65, 50.05], [2.7, 50.0], [2.75, 49.96], [2.8, 49.93]];
export const SOMME_NOV1916: LL[] = [[2.62, 50.12], [2.72, 50.08], [2.8, 50.06], [2.88, 49.98], [2.9, 49.93]];

// ------------------------------------------------------------------ Gallipoli (25 April 1915)
export const GALLIPOLI = {
  helles: [26.18, 40.05] as LL,
  anzac: [26.278, 40.247] as LL,
  suvla: [26.3, 40.31] as LL,
  chanak: [26.41, 40.15] as LL,
  narrows: [26.39, 40.13] as LL,
  gelibolu: [26.67, 40.41] as LL,
  landingHelles: [[25.95, 39.92], [26.08, 39.99], [26.17, 40.04]] as LL[],
  landingAnzac: [[25.98, 40.18], [26.15, 40.23], [26.26, 40.245]] as LL[],
  ships: [[25.9, 39.88], [25.78, 40.0], [25.88, 40.15], [26.05, 39.84]] as LL[],
};

// ------------------------------------------------------------------ places
export const PLACE: Record<string, LL> = {
  London: [-0.13, 51.5], Paris: [2.35, 48.86], Berlin: [13.4, 52.52], Vienna: [16.37, 48.21], 'St Petersburg': [30.32, 59.94], Petrograd: [30.32, 59.94],
  Rome: [12.5, 41.9], Constantinople: [28.98, 41.01], Belgrade: [20.46, 44.82], Sarajevo: [18.41, 43.86], Brussels: [4.35, 50.85], Budapest: [19.04, 47.5],
  Mons: [3.95, 50.45], Ypres: [2.88, 50.85], Arras: [2.78, 50.29], Amiens: [2.3, 49.89], Verdun: [5.38, 49.16], 'Compiègne': [2.83, 49.42],
  Nieuport: [2.75, 51.13], Albert: [2.65, 50.0], Passchendaele: [3.02, 50.9], 'Liège': [5.57, 50.63], Kiel: [10.13, 54.32], Aachen: [6.08, 50.78],
  Tannenberg: [20.13, 53.5], Allenstein: [20.48, 53.78], Warsaw: [21.01, 52.23], 'Brest-Litovsk': [23.69, 52.09], Riga: [24.1, 56.95], 'Königsberg': [20.51, 54.71],
  Sofia: [23.32, 42.7], Bucharest: [26.1, 44.43], Athens: [23.73, 37.98], Madrid: [-3.7, 40.42], Moscow: [37.6, 55.75], Spa: [5.86, 50.49], Eijsden: [5.72, 50.77],
  Brest: [-4.49, 48.39], 'St-Quentin': [3.29, 49.85], 'Bar-le-Duc': [5.16, 48.77], Warsaw1919: [21.01, 52.23], Prague: [14.42, 50.08], Danzig: [18.65, 54.35],
};

// ------------------------------------------------------------------ palette (flat, opaque, muted)
export const P14 = {
  entente: '#6F9C93', // muted blue-green
  ententeDeep: '#557F77',
  ententeLight: '#A9C7BE', // Britain's looser ties
  central: '#9C8C75', // muted grey-brown
  centralDeep: '#7D6E59',
  centralLight: '#BFB29C',
  neutral: '#EDE5D0', // pale
  greyStart: '#BDB8AC', // "neutral grey" great powers before alliances are shown
  minor: '#E2D6B8',
  serbia: '#C9A08A',
  red: C.red,
  outside: '#DCD2BA', // non-European land (not part of the story)
  hatchLost: '#8A5A4A',
};
export const P19 = {
  germany: '#A89C88', poland: '#D9A6A0', czech: '#9FB58A', austria: '#C2B4D0', hungary: '#C9A27A', scs: '#B9C79A', romania: '#DCC27E',
  estonia: '#9FC0C8', latvia: '#C7AE98', lithuania: '#A9BFA0', finland: '#B5C8DD', soviet: '#C98A7A', turkey: '#C9B49A', danzig: '#F4EEDF',
  neutral: '#EDE5D0', italy: '#D6C9A6', greece: '#D6CFA8', bulgaria: '#CDB79C', albania: '#D3C3A8', ireland: '#C9D6B0',
};

// ------------------------------------------------------------------ 1914 states (mask ops)
export type State14 =
  | 'GER' | 'AH' | 'RUS' | 'OTT' | 'FRA' | 'GBR' | 'ITA' | 'SRB' | 'MNE' | 'ALB' | 'GRC' | 'BGR' | 'ROU' | 'BEL' | 'LUX' | 'NLD' | 'CHE'
  | 'ESP' | 'PRT' | 'DNK' | 'NOR' | 'SWE';
export const STATES_1914: Record<State14, Op[]> = {
  GER: [A(GERMAN_EAST_1914), S('Czechia'), A('Germany'), A(ALSACE_LORRAINE), A(NORTH_SCHLESWIG)],
  AH: [A(GALICIA_1914), A('Austria'), A('Hungary'), A('Czechia'), A('Slovakia'), A('Slovenia'), A('Croatia'), A('Bosnia and Herz.'), A('Romania'), S(OLD_ROMANIA), S('Moldova'), A(VOJVODINA), A(TRENTINO), A(LITORALE), S('Switzerland'), S('Liechtenstein')],
  RUS: [A('Russia'), A('Belarus'), A('Ukraine'), A('Finland'), A('Estonia'), A('Latvia'), A('Lithuania'), A('Poland'), A('Georgia'), A('Armenia'), A('Azerbaijan'), A('Kazakhstan'), A(KARS), S(GERMAN_EAST_1914), S(GALICIA_1914), A('Moldova')],
  OTT: [A('Turkey'), A('Syria'), A('Iraq'), A('Lebanon'), A('Israel'), A('Palestine'), A('Jordan'), S(KARS)],
  FRA: [A('France'), S(ALSACE_LORRAINE)],
  GBR: [A('United Kingdom'), A('Ireland')],
  ITA: [A('Italy'), S(TRENTINO), S(LITORALE)],
  SRB: [A('Serbia'), A('Kosovo'), A('Macedonia'), S(VOJVODINA)],
  MNE: [A('Montenegro')],
  ALB: [A('Albania')],
  GRC: [A('Greece'), S(WESTERN_THRACE)],
  BGR: [A('Bulgaria'), A(WESTERN_THRACE), S(SOUTH_DOBRUJA), S('Turkey')],
  ROU: [A(OLD_ROMANIA), S('Moldova'), S('Ukraine'), S('Serbia'), S('Bulgaria'), A(SOUTH_DOBRUJA)],
  BEL: [A('Belgium')], LUX: [A('Luxembourg')], NLD: [A('Netherlands')], CHE: [A('Switzerland'), A('Liechtenstein')],
  ESP: [A('Spain')], PRT: [A('Portugal')], DNK: [A('Denmark'), S(NORTH_SCHLESWIG)], NOR: [A('Norway')], SWE: [A('Sweden')],
};
/** Paint order (later states sit on top where helper polygons overlap). */
export const ORDER_1914: State14[] = ['RUS', 'OTT', 'ESP', 'PRT', 'NOR', 'SWE', 'GBR', 'FRA', 'ITA', 'BEL', 'LUX', 'NLD', 'DNK', 'GRC', 'ALB', 'MNE', 'SRB', 'BGR', 'ROU', 'AH', 'GER', 'CHE'];
export const NAME_1914: Record<State14, string> = {
  GER: 'GERMANY', AH: 'AUSTRIA-HUNGARY', RUS: 'RUSSIA', OTT: 'OTTOMAN EMPIRE', FRA: 'FRANCE', GBR: 'BRITAIN', ITA: 'ITALY', SRB: 'SERBIA',
  MNE: 'MONTENEGRO', ALB: 'ALBANIA', GRC: 'GREECE', BGR: 'BULGARIA', ROU: 'ROMANIA', BEL: 'BELGIUM', LUX: 'LUXEMBOURG', NLD: 'NETHERLANDS',
  CHE: 'SWITZERLAND', ESP: 'SPAIN', PRT: 'PORTUGAL', DNK: 'DENMARK', NOR: 'NORWAY', SWE: 'SWEDEN',
};
/** Label anchor (lon/lat) per state. */
export const LABEL_1914: Partial<Record<State14, LL>> = {
  GER: [10.4, 51.4], AH: [18.6, 47.4], RUS: [32.0, 55.0], OTT: [33.5, 39.2], FRA: [2.4, 46.8], GBR: [-1.8, 53.0], ITA: [12.8, 42.6], SRB: [21.0, 43.6],
  ROU: [25.6, 44.6], BGR: [25.3, 42.75], GRC: [22.0, 39.6], BEL: [4.6, 50.6], NLD: [5.6, 52.5], SWE: [15.4, 61.5], NOR: [9.5, 61.4], ESP: [-3.6, 40.2], DNK: [9.3, 56.2], CHE: [8.0, 46.75], MNE: [19.2, 42.7], ALB: [20.0, 41.2],
};
/** Modern country → 1914 state for the faint border mesh (countries not listed are "outside"). */
export const MODERN_TO_1914: Record<string, State14> = {
  Germany: 'GER', Austria: 'AH', Hungary: 'AH', Czechia: 'AH', Slovakia: 'AH', Slovenia: 'AH', Croatia: 'AH', 'Bosnia and Herz.': 'AH', Romania: 'ROU',
  Russia: 'RUS', Belarus: 'RUS', Ukraine: 'RUS', Finland: 'RUS', Estonia: 'RUS', Latvia: 'RUS', Lithuania: 'RUS', Poland: 'RUS', Moldova: 'RUS', Georgia: 'RUS', Armenia: 'RUS', Azerbaijan: 'RUS', Kazakhstan: 'RUS',
  Turkey: 'OTT', Syria: 'OTT', Iraq: 'OTT', Lebanon: 'OTT', Israel: 'OTT', Palestine: 'OTT', Jordan: 'OTT', France: 'FRA', 'United Kingdom': 'GBR', Ireland: 'GBR', Italy: 'ITA',
  Serbia: 'SRB', Kosovo: 'SRB', Macedonia: 'SRB', Montenegro: 'MNE', Albania: 'ALB', Greece: 'GRC', Bulgaria: 'BGR', Belgium: 'BEL', Luxembourg: 'LUX',
  Netherlands: 'NLD', Switzerland: 'CHE', Liechtenstein: 'CHE', Spain: 'ESP', Portugal: 'PRT', Denmark: 'DNK', Norway: 'NOR', Sweden: 'SWE',
};
/** Modern borders that were NOT 1914 state borders (or are replaced by the hand-plotted lines below). */
export const MESH_EXCLUDE_1914: [string, string][] = [
  ['France', 'Germany'], ['Germany', 'Poland'], ['Germany', 'Denmark'], ['Austria', 'Italy'], ['Slovenia', 'Italy'], ['Croatia', 'Serbia'], ['Hungary', 'Serbia'],
  ['Hungary', 'Romania'], ['Ukraine', 'Romania'], ['Ukraine', 'Hungary'], ['Ukraine', 'Slovakia'], ['Ukraine', 'Poland'], ['Poland', 'Slovakia'], ['Poland', 'Belarus'],
  ['Poland', 'Lithuania'], ['Poland', 'Russia'], ['Lithuania', 'Russia'], ['Ukraine', 'Moldova'], ['Finland', 'Russia'], ['Greece', 'Bulgaria'], ['Armenia', 'Turkey'],
  ['Romania', 'Bulgaria'], ['Romania', 'Serbia'], ['Czechia', 'Poland'],
];
/** Hand-plotted 1914 border lines drawn with the mesh. */
export const LINES_1914: LL[][] = [
  GR_BORDER_1914, AG_BORDER_1914, AR_BORDER_1914, ROMANIA_AH_1914, DOBRUJA_LINE_1913, SAVA_DANUBE_1914, TRENTINO_LINE_1914, ISONZO_LINE_1914, MESTA_LINE, KONGEA_LINE, AL_LINE, KARS_LINE,
  // Danube, Romania–Bulgaria (Tutrakan → Timok) and Romania–Serbia (Timok → Iron Gates)
  [[26.62, 44.05], [26.1, 43.92], [25.6, 43.68], [24.9, 43.7], [24.0, 43.73], [23.3, 43.82], [22.88, 44.0], [22.68, 44.2], [22.62, 44.55], [22.45, 44.72]],
  // Silesia: Prussian–Austrian border (= today's Czech–Polish border, simplified)
  [[18.33, 49.92], [18.0, 50.0], [17.65, 50.25], [17.2, 50.4], [16.9, 50.45], [16.6, 50.2], [16.3, 50.65], [15.8, 50.75], [15.0, 50.95], [14.85, 50.88]],
];

// ------------------------------------------------------------------ 1919–23 states
export type State19 =
  | 'GER' | 'POL' | 'CZE' | 'AUT' | 'HUN' | 'SCS' | 'ROU' | 'EST' | 'LVA' | 'LTU' | 'FIN' | 'SOV' | 'TUR' | 'DZG' | 'ITA' | 'GRC' | 'BGR' | 'ALB' | 'IRL';
export const STATES_1919: Record<State19, Op[]> = {
  GER: [A('Germany'), A(GERMANY_1937), A(EAST_PRUSSIA), S('Czechia'), S('Poland'), S('Denmark')],
  POL: [A(POLAND_1939), S('Czechia'), S('Slovakia'), S('Latvia'), S(EAST_PRUSSIA), S(DANZIG)],
  CZE: [A('Czechia'), A('Slovakia'), A(RUTHENIA)],
  AUT: [A('Austria')],
  HUN: [A('Hungary')],
  SCS: [A('Slovenia'), A('Croatia'), A('Bosnia and Herz.'), A('Serbia'), A('Montenegro'), A('Kosovo'), A('Macedonia'), S(ISTRIA_1920)],
  ROU: [A('Romania'), A('Moldova'), A(BUKOVINA_N), A(BUDJAK), S(RUTHENIA), A(SOUTH_DOBRUJA)],
  EST: [A('Estonia')], LVA: [A('Latvia')], LTU: [A('Lithuania'), S(POLAND_1939), A(MEMEL)], FIN: [A('Finland')],
  SOV: [A('Russia'), A('Belarus'), A('Ukraine'), A('Georgia'), A('Armenia'), A('Azerbaijan'), A('Kazakhstan'), S(POLAND_1939), S(EAST_PRUSSIA), S(MEMEL), S(BUKOVINA_N), S(BUDJAK), S(RUTHENIA)],
  TUR: [A('Turkey')],
  DZG: [A(DANZIG)],
  ITA: [A('Italy'), A(ISTRIA_1920)],
  GRC: [A('Greece')], BGR: [A('Bulgaria'), S(SOUTH_DOBRUJA)], ALB: [A('Albania')], IRL: [A('Ireland')],
};
export const ORDER_1919: State19[] = ['SOV', 'TUR', 'GRC', 'ALB', 'BGR', 'ITA', 'IRL', 'FIN', 'EST', 'LVA', 'LTU', 'ROU', 'SCS', 'HUN', 'AUT', 'CZE', 'GER', 'POL', 'DZG'];
export const COLOR_1919: Record<State19, string> = {
  GER: P19.germany, POL: P19.poland, CZE: P19.czech, AUT: P19.austria, HUN: P19.hungary, SCS: P19.scs, ROU: P19.romania, EST: P19.estonia, LVA: P19.latvia,
  LTU: P19.lithuania, FIN: P19.finland, SOV: P19.soviet, TUR: P19.turkey, DZG: P19.danzig, ITA: P19.italy, GRC: P19.greece, BGR: P19.bulgaria, ALB: P19.albania, IRL: P19.ireland,
};
/** New-state labels, in the storyboard's order (S11-03). Lines split for width. */
export const NEW_STATES_1919: {id: State19; lines: string[]; at: LL}[] = [
  {id: 'POL', lines: ['POLAND'], at: [19.6, 52.3]},
  {id: 'CZE', lines: ['CZECHOSLOVAKIA'], at: [17.6, 49.45]},
  {id: 'AUT', lines: ['AUSTRIA'], at: [13.3, 47.55]},
  {id: 'HUN', lines: ['HUNGARY'], at: [19.9, 47.0]},
  {id: 'SCS', lines: ['KINGDOM OF SERBS,', 'CROATS AND SLOVENES'], at: [19.6, 44.35]},
  {id: 'EST', lines: ['ESTONIA'], at: [25.8, 58.75]},
  {id: 'LVA', lines: ['LATVIA'], at: [25.6, 56.85]},
  {id: 'LTU', lines: ['LITHUANIA'], at: [23.9, 55.45]},
  {id: 'FIN', lines: ['FINLAND'], at: [26.0, 62.4]},
];
export const MODERN_TO_1919: Record<string, State19> = {
  Germany: 'GER', Poland: 'POL', Czechia: 'CZE', Slovakia: 'CZE', Austria: 'AUT', Hungary: 'HUN', Slovenia: 'SCS', Croatia: 'SCS', 'Bosnia and Herz.': 'SCS',
  Serbia: 'SCS', Montenegro: 'SCS', Kosovo: 'SCS', Macedonia: 'SCS', Romania: 'ROU', Moldova: 'ROU', Estonia: 'EST', Latvia: 'LVA', Lithuania: 'LTU', Finland: 'FIN',
  Russia: 'SOV', Belarus: 'SOV', Ukraine: 'SOV', Georgia: 'SOV', Armenia: 'SOV', Azerbaijan: 'SOV', Kazakhstan: 'SOV', Turkey: 'TUR', Italy: 'ITA', Greece: 'GRC',
  Bulgaria: 'BGR', Albania: 'ALB', Ireland: 'IRL',
};
export const MESH_EXCLUDE_1919: [string, string][] = [
  ['Germany', 'Poland'], ['Poland', 'Belarus'], ['Poland', 'Ukraine'], ['Poland', 'Lithuania'], ['Poland', 'Russia'], ['Poland', 'Slovakia'], ['Poland', 'Czechia'],
  ['Belarus', 'Lithuania'], ['Ukraine', 'Romania'], ['Ukraine', 'Moldova'], ['Ukraine', 'Slovakia'], ['Slovenia', 'Italy'], ['Lithuania', 'Russia'],
];
export const LINES_1919: Feature<Polygon>[] = [POLAND_1939, EAST_PRUSSIA, DANZIG, RUTHENIA, ISTRIA_1920, BUKOVINA_N, BUDJAK, SOUTH_DOBRUJA, MEMEL];
/** Disputed eastern lands (between the Bug line and the 1921 Riga border; fought over 1919–21): hatched. */
export const DISPUTED_EAST = POLAND_SOVIET_ZONE;

/** Simple ring → polyline (for outlines of helper polygons). */
export const ringOf = (f: Feature<Polygon>): LL[] => f.geometry.coordinates[0] as LL[];
