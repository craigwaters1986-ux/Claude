// Episode 3 maps: Britain and Ireland in 1603-1605 (Natural Earth 1:50m via world-atlas, public domain).
// The England-Scotland border is a hand-placed approximation (Solway Firth to the Tweed) at this scale.
import React, {useMemo} from 'react';
import {geoMercator, geoPath, GeoProjection} from 'd3-geo';
import {feature} from 'topojson-client';
import world from 'world-atlas/countries-50m.json';
import {C, FONT} from '../styles/theme';
import {clamp} from '../animations/core';

type LonLat = [number, number];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FC = feature(world as any, (world as any).objects.countries) as any;
const NAMES = ['United Kingdom', 'Ireland', 'France', 'Belgium', 'Netherlands', 'Denmark', 'Norway', 'Germany'];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FEATS: any[] = FC.features.filter((f: {properties: {name: string}}) => NAMES.includes(f.properties.name));

export const PLACES: Record<string, LonLat> = {
  Edinburgh: [-3.19, 55.95],
  London: [-0.13, 51.51],
  Westminster: [-0.125, 51.499],
  Hoxton: [-0.08, 51.53],
  Warwickshire: [-1.58, 52.28],
  Dunchurch: [-1.29, 52.34],
  AshbyStLedgers: [-1.15, 52.31],
  Huddington: [-2.08, 52.22],
  Holbeach: [-2.17, 52.52],
};
// Approximate route of the flight from London into the Midlands (via Dunchurch) and on to Holbeach House.
export const FLIGHT: LonLat[] = [PLACES.London, [-0.75, 51.95], PLACES.AshbyStLedgers, PLACES.Dunchurch, [-1.7, 52.25], PLACES.Huddington, [-2.15, 52.36], PLACES.Holbeach];
const BORDER: LonLat[] = [[-3.06, 54.98], [-2.86, 55.04], [-2.63, 55.16], [-2.4, 55.32], [-2.18, 55.44], [-2.2, 55.6], [-2.03, 55.79]];
const SCOT_POLY: LonLat[] = [[-3.6, 54.9], [-5.5, 54.55], [-6.0, 55.1], [-6.3, 55.42], [-9, 55.5], [-9, 61.5], [3.5, 61.5], [3.5, 55.79], ...[...BORDER].reverse()];
const NI_POLY: LonLat[] = [[-8.4, 54.0], [-5.42, 54.0], [-5.42, 55.33], [-8.4, 55.33]];

export type MapView = {lon0: number; lat0: number; lon1: number; lat1: number};
export const VIEW_BRITAIN: MapView = {lon0: -8.6, lat0: 49.7, lon1: 2.4, lat1: 59.2};
export const VIEW_ENGLAND: MapView = {lon0: -4.6, lat0: 50.6, lon1: 1.9, lat1: 53.6};

export function useProjection(v: MapView, box: [number, number, number, number] = [0, 0, 1920, 916]): GeoProjection {
  return useMemo(() => {
    const b = {type: 'Feature', geometry: {type: 'MultiPoint', coordinates: [[v.lon0, v.lat0], [v.lon1, v.lat1]]}, properties: {}};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return geoMercator().fitExtent([[box[0], box[1]], [box[2], box[3]]], b as any);
  }, [v.lon0, v.lat0, v.lon1, v.lat1, box[0], box[1], box[2], box[3]]);
}

const polyD = (proj: GeoProjection, pts: LonLat[]) => 'M' + pts.map((p) => proj(p)!.map((n) => n.toFixed(1)).join(',')).join('L') + 'Z';
export const lineD = (proj: GeoProjection, pts: LonLat[]) => 'M' + pts.map((p) => proj(p)!.map((n) => n.toFixed(1)).join(',')).join('L');

/** Base map: sea, land, England and Scotland tinted separately (`tint` 0..1), Ireland neutral. */
export const BaseMap: React.FC<{proj: GeoProjection; tint?: number; border?: number; id: string; sea?: string}> = ({proj, tint = 1, border = 1, id, sea = '#9DB7BD'}) => {
  const path = useMemo(() => geoPath(proj), [proj]);
  const uk = FEATS.find((f: {properties: {name: string}}) => f.properties.name === 'United Kingdom');
  const ukD = path(uk) ?? '';
  return (
    <g>
      <rect x={-2000} y={-2000} width={6000} height={6000} fill={sea} />
      {Array.from({length: 14}, (_, i) => <path key={i} d={`M-200,${60 + i * 70} q240,-14 480,0 t480,0 t480,0 t480,0 t480,0`} stroke="#B3CACE" strokeWidth={3} fill="none" opacity={0.5} />)}
      {FEATS.map((f: any, i: number) => (
        <path key={i} d={path(f) ?? ''} fill={f.properties.name === 'United Kingdom' ? '#E2D4AE' : '#CFC7B2'} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      ))}
      <defs>
        <clipPath id={`uk-${id}`}><path d={ukD} /></clipPath>
      </defs>
      <g clipPath={`url(#uk-${id})`}>
        <path d={ukD} fill="#E6C98E" opacity={tint} />
        <path d={polyD(proj, SCOT_POLY)} fill="#B9C79A" opacity={tint} />
        <path d={polyD(proj, NI_POLY)} fill="#CFC7B2" />
      </g>
      <path d={ukD} fill="none" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d={lineD(proj, BORDER)} fill="none" stroke={C.ink} strokeWidth={4} strokeDasharray="14 9" opacity={border} />
    </g>
  );
};

/** City dot with a label placed beside it. */
export const PlaceDot: React.FC<{proj: GeoProjection; at: LonLat; label: string; t?: number; side?: 'left' | 'right' | 'above' | 'below'; size?: number; dot?: number; color?: string}> = ({
  proj, at, label, t = 1, side = 'right', size = 34, dot = 11, color = C.red,
}) => {
  if (t <= 0) return null;
  const [x, y] = proj(at)!;
  const dx = side === 'right' ? 22 : side === 'left' ? -22 : 0;
  const dy = side === 'above' ? -24 : side === 'below' ? 46 : 12;
  const anchor = side === 'right' ? 'start' : side === 'left' ? 'end' : 'middle';
  return (
    <g opacity={clamp(t * 2)}>
      <circle cx={x} cy={y} r={dot * (0.6 + 0.4 * clamp(t))} fill={color} stroke={C.ink} strokeWidth={4} />
      <text x={x + dx} y={y + dy} textAnchor={anchor} fontFamily={FONT.sans} fontWeight={800} fontSize={size} fill={C.ink} stroke="#F4EBD6" strokeWidth={7} paintOrder="stroke">
        {label}
      </text>
    </g>
  );
};

/** Region label in large spaced capitals (ENGLAND, SCOTLAND). */
export const RegionLabel: React.FC<{proj: GeoProjection; at: LonLat; text: string; t?: number; size?: number}> = ({proj, at, text, t = 1, size = 44}) => {
  const [x, y] = proj(at)!;
  return (
    <text x={x} y={y} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={size} letterSpacing={8} fill="#5A4A36" opacity={clamp(t) * 0.85}>
      {text}
    </text>
  );
};

/** Dashed route that draws on with `t` 0..1, with a moving head marker. */
export const Route: React.FC<{proj: GeoProjection; pts: LonLat[]; t: number; color?: string; width?: number}> = ({proj, pts, t, color = C.darkRed, width = 7}) => {
  const xy = pts.map((p) => proj(p)!);
  const seg = xy.slice(1).map((p, i) => Math.hypot(p[0] - xy[i][0], p[1] - xy[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  let left = total * clamp(t);
  const drawn: [number, number][] = [xy[0]];
  for (let i = 0; i < seg.length && left > 0; i++) {
    const k = Math.min(1, left / seg[i]);
    drawn.push([xy[i][0] + (xy[i + 1][0] - xy[i][0]) * k, xy[i][1] + (xy[i + 1][1] - xy[i][1]) * k]);
    left -= seg[i];
  }
  const head = drawn[drawn.length - 1];
  return (
    <g>
      <path d={'M' + drawn.map((p) => p.join(',')).join('L')} fill="none" stroke={C.ink} strokeWidth={width + 5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={'M' + drawn.map((p) => p.join(',')).join('L')} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="18 10" />
      {t > 0.01 && t < 0.995 && <circle cx={head[0]} cy={head[1]} r={13} fill="#F4EBD6" stroke={C.ink} strokeWidth={5} />}
    </g>
  );
};

/** A simple crown icon drawn at a map point (two crowns, one king). */
export const CrownIcon: React.FC<{x: number; y: number; s?: number; t?: number}> = ({x, y, s = 1, t = 1}) => {
  if (t <= 0) return null;
  const k = 0.4 + 0.6 * clamp(t);
  return (
    <g transform={`translate(${x},${y}) scale(${s * k})`} opacity={clamp(t * 2)}>
      <path d="M-46,20 L-52,-30 L-24,-6 L0,-42 L24,-6 L52,-30 L46,20Z" fill={C.gold} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-48} y={14} width={96} height={18} rx={3} fill="#9E2E26" stroke={C.ink} strokeWidth={5} />
      {[-52, 0, 52].map((cx) => <circle key={cx} cx={cx} cy={cx === 0 ? -44 : -32} r={7} fill="#FFF" stroke={C.ink} strokeWidth={4} />)}
    </g>
  );
};
