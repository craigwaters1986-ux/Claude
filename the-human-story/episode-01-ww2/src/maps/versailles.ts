// Versailles territorial changes (M-01) and the Sudetenland (M-02).
// PENDING_R01: these rings are designer PLACEHOLDERS until the researcher's
// production/research/ep01-ww2/map-sources.md arrives; then replace the coordinates and
// set VERIFIED = true.  Rings are clipped to the coastline at render time.
import type {Feature, Polygon} from 'geojson';
import {poly, ALSACE_LORRAINE, LOST_TO_POLAND} from './geo';
import {LL, SUDETENLAND_PLACEHOLDER} from './history';

export const VERIFIED = false;

export const NORTH_SCHLESWIG = poly([[8.4, 55.45], [9.0, 55.47], [9.6, 55.52], [9.8, 55.3], [9.95, 54.9], [9.6, 54.83], [8.65, 54.9], [8.4, 55.0]]);
export const EUPEN_MALMEDY = poly([[5.95, 50.75], [6.25, 50.73], [6.4, 50.33], [6.2, 50.18], [6.0, 50.25], [5.95, 50.45]]);
export const MEMEL = poly([[21.0, 55.3], [21.1, 55.95], [21.9, 55.9], [22.6, 55.25], [22.85, 55.05], [21.5, 55.1]]);
export const HULTSCHIN = poly([[17.85, 50.0], [18.25, 50.03], [18.35, 49.92], [18.05, 49.85], [17.85, 49.9]]);
export const DANZIG = poly([[18.35, 54.42], [18.6, 54.56], [18.95, 54.38], [19.4, 54.38], [19.2, 54.2], [18.95, 54.1], [18.55, 54.2], [18.35, 54.3]]);
/** East Upper Silesia (to Poland in 1922 after the 1921 plebiscite) — not in the storyboard list; included for completeness. */
export const EAST_UPPER_SILESIA = poly([[18.25, 50.35], [18.9, 50.55], [19.2, 50.35], [19.1, 49.95], [18.75, 49.85], [18.4, 50.0], [18.2, 50.2]]);
export const SUDETENLAND: Feature<Polygon> = SUDETENLAND_PLACEHOLDER;

export type Loss = {feature: Feature<Polygon>; label: string; owner: string; color: string; labelAt: LL};
export const LOSSES: Loss[] = [
  {feature: ALSACE_LORRAINE, label: 'ALSACE-LORRAINE', owner: 'FRANCE', color: '#7FA3CC', labelAt: [5.6, 48.4]},
  {feature: LOST_TO_POLAND, label: 'WEST PRUSSIA & POSEN', owner: 'POLAND', color: '#D9A6A0', labelAt: [17.5, 52.9]},
  {feature: NORTH_SCHLESWIG, label: 'NORTH SCHLESWIG', owner: 'DENMARK', color: '#E3C77A', labelAt: [9.1, 55.75]},
  {feature: EUPEN_MALMEDY, label: 'EUPEN-MALMEDY', owner: 'BELGIUM', color: '#C9B26A', labelAt: [5.2, 50.4]},
  {feature: MEMEL, label: 'MEMEL', owner: 'ALLIED CONTROL', color: '#A9B7A6', labelAt: [22.3, 56.2]},
  {feature: HULTSCHIN, label: 'HULTSCHIN', owner: 'CZECHOSLOVAKIA', color: '#9FB58A', labelAt: [18.0, 49.55]},
  {feature: EAST_UPPER_SILESIA, label: 'EAST UPPER SILESIA (1922)', owner: 'POLAND', color: '#D9A6A0', labelAt: [19.6, 50.75]},
  {feature: DANZIG, label: 'DANZIG', owner: 'FREE CITY', color: '#F2EBDC', labelAt: [18.7, 54.75]},
];

/** German colonies before 1914 (approximate centres) for the inset globe. */
export const COLONIES: {name: string; at: LL}[] = [
  {name: 'Togoland', at: [1.0, 8.0]}, {name: 'Kamerun', at: [12.0, 5.0]}, {name: 'German South West Africa', at: [17.0, -22.0]},
  {name: 'German East Africa', at: [35.0, -6.0]}, {name: 'German New Guinea', at: [145.0, -5.5]}, {name: 'Samoa', at: [-172.0, -13.8]},
  {name: 'Kiautschou', at: [120.3, 36.1]}, {name: 'Pacific islands', at: [150.0, 8.0]},
];
