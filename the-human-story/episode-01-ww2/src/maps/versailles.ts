// Versailles territorial changes (M-01) and the Sudetenland (M-02).
// Rings from the researcher's R-01 file (production/research/ep01-ww2/map-sources.md §3.2, §4.3).
// All approximate; clipped to the coastline at render time.  The Saar is NOT a loss (League
// administration 1920–35) and is deliberately not animated.
import type {Feature, Polygon} from 'geojson';
import {poly, ALSACE_LORRAINE, LOST_TO_POLAND} from './geo';
import {LL} from './history';

export const VERIFIED = true;

export const NORTH_SCHLESWIG = poly([[8.6, 55.45], [9.15, 55.47], [9.65, 55.45], [9.75, 55.2], [10.05, 55.05], [9.75, 54.85], [9.42, 54.83], [8.66, 54.91], [8.5, 55.05]]);
export const EUPEN_MALMEDY = poly([[5.97, 50.75], [6.12, 50.72], [6.27, 50.55], [6.4, 50.33], [6.15, 50.13], [5.97, 50.2], [6.02, 50.45], [5.9, 50.65]]);
export const MEMEL = poly([[21.06, 55.87], [21.2, 55.85], [21.3, 55.7], [21.45, 55.55], [21.65, 55.38], [22.0, 55.2], [22.6, 55.07], [22.0, 55.07], [21.5, 55.22], [21.3, 55.25], [20.95, 55.27], [21.1, 55.72]]);
export const HULTSCHIN = poly([[17.98, 49.98], [18.12, 50.05], [18.3, 49.97], [18.3, 49.88], [18.12, 49.86], [17.98, 49.9]]);
export const DANZIG = poly([[18.56, 54.47], [18.4, 54.4], [18.42, 54.25], [18.6, 54.15], [18.8, 54.13], [19.0, 54.03], [19.15, 54.15], [19.3, 54.27], [19.3, 54.4]]);
/** East Upper Silesia (to Poland 1922 after the 1921 plebiscite): optional, animate last. Label APPROXIMATE. */
export const EAST_UPPER_SILESIA = poly([[18.4, 50.05], [18.75, 50.22], [19.0, 50.36], [18.8, 50.48], [18.55, 50.75], [18.75, 50.85], [19.15, 50.55], [19.17, 50.24], [19.1, 50.0], [18.9, 49.92], [18.55, 49.9]]);
export const SAAR = poly([[6.37, 49.46], [6.6, 49.55], [6.95, 49.6], [7.25, 49.55], [7.4, 49.4], [7.35, 49.2], [7.05, 49.11], [6.7, 49.2], [6.55, 49.4]]);

export type Loss = {feature: Feature<Polygon>; label: string; owner: string; color: string; labelAt: LL; dot?: LL; optional?: boolean};
/** Animated in this order (R-01 §3.3). Memel and Hultschin are shown as dots; Memel fades to neutral. */
export const LOSSES: Loss[] = [
  {feature: ALSACE_LORRAINE, label: 'ALSACE-LORRAINE', owner: 'FRANCE', color: '#7FA3CC', labelAt: [5.4, 48.3]},
  {feature: LOST_TO_POLAND, label: 'WEST PRUSSIA & POSEN', owner: 'POLAND', color: '#D9A6A0', labelAt: [17.3, 52.6]},
  {feature: DANZIG, label: 'DANZIG', owner: 'FREE CITY', color: '#F2EBDC', labelAt: [18.7, 54.85]},
  {feature: NORTH_SCHLESWIG, label: 'NORTH SCHLESWIG', owner: 'DENMARK', color: '#E3C77A', labelAt: [9.1, 55.8]},
  {feature: EUPEN_MALMEDY, label: 'EUPEN-MALMEDY', owner: 'BELGIUM', color: '#C9B26A', labelAt: [5.0, 50.5]},
  {feature: MEMEL, label: 'MEMEL', owner: 'TO LITHUANIA, 1923', color: '#E6D9B8', labelAt: [22.6, 56.3], dot: [21.13, 55.71]},
  {feature: HULTSCHIN, label: 'HULTSCHIN', owner: 'CZECHOSLOVAKIA', color: '#9FB58A', labelAt: [17.6, 49.5], dot: [18.19, 49.9]},
  {feature: EAST_UPPER_SILESIA, label: 'EAST UPPER SILESIA (1922, APPROX.)', owner: 'POLAND', color: '#D9A6A0', labelAt: [19.9, 50.85], optional: true},
];

/** German colonies before 1914 (approximate centres) for the inset globe. */
export const COLONIES: {name: string; at: LL}[] = [
  {name: 'Togoland', at: [1.0, 8.0]}, {name: 'Kamerun', at: [12.0, 5.0]}, {name: 'German South West Africa', at: [17.0, -22.0]},
  {name: 'German East Africa', at: [35.0, -6.0]}, {name: 'German New Guinea', at: [145.0, -5.5]}, {name: 'Samoa', at: [-172.0, -13.8]},
  {name: 'Kiautschou', at: [120.3, 36.1]}, {name: 'Pacific islands', at: [150.0, 8.0]},
];
