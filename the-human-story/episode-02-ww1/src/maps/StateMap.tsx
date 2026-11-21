// Historical-state fills for GeoMap (ep02).  A state is an ORDERED list of mask operations on
// Natural Earth 1:50m modern countries and hand-plotted polygons (see ./ww1.ts).  States with
// subtractions are drawn through an SVG mask, so each state is an independent opaque shape that
// can fade, hatch or pulse on its own (no darker seams where helper polygons overlap).
// Everything here renders in PROJECTION space, inside GeoMap's `layers` slot.
import React from 'react';
import type {Feature, LineString, MultiLineString} from 'geojson';
import {geoContains, geoPath} from 'd3-geo';
import {mesh} from 'topojson-client';
import countries50 from 'world-atlas/countries-50m.json';
import {baseMap, featurePath, MapKind, COUNTRIES50} from './geo';
import {C} from '../styles/theme';
import type {LL, Op} from './ww1';
import {clamp} from '../animations/core';

const ink = C.ink;
import {W, H} from '../styles/theme';
type Box = {x: number; y: number; width: number; height: number};
/** Visible region in projection space (+10 % margin) for a camera focus and zoom. */
export const viewBox = (focus: [number, number], z: number): Box => ({x: focus[0] - (W * 0.6) / z, y: focus[1] - (H * 0.6) / z, width: (W * 1.2) / z, height: (H * 1.2) / z});

export type StateStyle = {
  fill: string;
  opacity?: number;
  /** Hatch colour drawn over the fill (diagonal stripes). */
  hatch?: string;
  hatchOpacity?: number;
  /** Inner edge band (e.g. a darkening border), colour + strength 0..1. */
  edge?: string;
  edgeAmount?: number;
  /** 0..1 pulse strength (brightness oscillation). */
  pulse?: number;
};
export type StateEntry = {key: string; ops: Op[]; style: StateStyle};

const opPath = (kind: MapKind, x: string | Feature) => (typeof x === 'string' ? baseMap(kind).paths.get(x) ?? '' : featurePath(kind, x));
const hasSub = (ops: Op[]) => ops.some((o) => 'sub' in o);

/** Runs of consecutive "add" ops, each with the "sub" ops that come after it (order matters: a later add re-adds). */
type Run = {adds: (string | Feature)[]; subs: (string | Feature)[]};
export function runsOf(ops: Op[]): Run[] {
  const runs: Run[] = [];
  let cur: Run | null = null;
  ops.forEach((o, i) => {
    if ('add' in o) {
      if (!cur) runs.push((cur = {adds: [], subs: ops.slice(i + 1).filter((x) => 'sub' in x).map((x) => (x as {sub: string | Feature}).sub)}));
      cur.adds.push(o.add);
    } else cur = null;
  });
  return runs;
}
const rectD = (b: Box) => `M${b.x},${b.y} h${b.width} v${b.height} h${-b.width}Z`;

/**
 * Clip-path defs for a state: one "box minus subtractions" clip (even-odd) per run with subtractions.
 * Clip paths are resolved as vector geometry, which stays exact at any zoom (SVG masks failed in
 * headless Chrome once a frame held a dozen large masks: parts of the frame lost their mask).
 */
export const StateClips: React.FC<{id: string; kind: MapKind; ops: Op[]; box: Box}> = ({id, kind, ops, box}) => (
  <>
    {runsOf(ops).map((r, i) =>
      r.subs.length ? (
        <clipPath key={i} id={`${id}-${i}`}>
          <path d={rectD(box) + ' ' + r.subs.map((x) => opPath(kind, x)).join(' ')} clipRule="evenodd" />
        </clipPath>
      ) : null,
    )}
  </>
);
/** Paint a state's area (ops) with a fill, using the clips from StateClips. */
export const StateArea: React.FC<{id: string; kind: MapKind; ops: Op[]; fill: string; opacity?: number}> = ({id, kind, ops, fill, opacity = 1}) => (
  <g opacity={opacity}>
    {runsOf(ops).map((r, i) => {
      const body = r.adds.map((x, k) => <path key={k} d={opPath(kind, x)} fill={fill} />);
      return r.subs.length ? <g key={i} clipPath={`url(#${id}-${i})`}>{body}</g> : <g key={i}>{body}</g>;
    })}
  </g>
);

/**
 * Draws states (in order) clipped to the land.  Put inside GeoMap `layers`:
 *   layers={(ctx) => <StateLayer {...ctx} f={f} states={...} />}
 */
export const StateLayer: React.FC<{kind: MapKind; z: number; clipId: string; focus: [number, number]; f: number; states: StateEntry[]; tag?: string}> = ({kind, z, clipId, focus, f, states, tag = 's'}) => {
  const pre = `${clipId}-${tag}`;
  // Clip geometry, patterns and filters cover the visible region only, so their ids carry the camera:
  // two maps of the same kind on screen (crossfades, wall maps) never share an id unless they share the camera.
  const zk = `${Math.round(z * 100)}-${Math.round(focus[0])}-${Math.round(focus[1])}`;
  const box = viewBox(focus, z);
  return (
    <g>
      <defs>
        {states.map((s) => (hasSub(s.ops) ? <StateClips key={s.key} id={`${pre}-c-${s.key}-${zk}`} kind={kind} ops={s.ops} box={box} /> : null))}
        {states.map((s) =>
          s.style.hatch ? (
            <pattern key={s.key} id={`${pre}-h-${s.key}-${zk}`} patternUnits="userSpaceOnUse" width={16 / z} height={16 / z} patternTransform="rotate(45)">
              <rect width={6 / z} height={16 / z} fill={s.style.hatch} />
            </pattern>
          ) : null,
        )}
        {states.map((s) =>
          s.style.edge ? (
            <filter key={s.key} id={`${pre}-e-${s.key}-${zk}`} filterUnits="userSpaceOnUse" {...box}>
              <feMorphology in="SourceAlpha" operator="erode" radius={7 / z} result="er" />
              <feComposite in="SourceAlpha" in2="er" operator="out" result="band" />
              <feFlood floodColor={s.style.edge} />
              <feComposite in2="band" operator="in" />
            </filter>
          ) : null,
        )}
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {states.map((s) => {
          const st = s.style;
          const op = (st.opacity ?? 1) * (st.pulse ? 1 - 0.35 * st.pulse * (0.5 + 0.5 * Math.sin(f / 5)) : 1);
          if (op <= 0.002) return null;
          const cid = `${pre}-c-${s.key}-${zk}`;
          return (
            <g key={s.key}>
              <StateArea id={cid} kind={kind} ops={s.ops} fill={st.fill} opacity={op} />
              {st.hatch && (st.hatchOpacity ?? 1) > 0.002 && <StateArea id={cid} kind={kind} ops={s.ops} fill={`url(#${pre}-h-${s.key}-${zk})`} opacity={(st.hatchOpacity ?? 1) * (st.opacity ?? 1)} />}
              {st.edge && (st.edgeAmount ?? 1) > 0.002 && (
                <g filter={`url(#${pre}-e-${s.key}-${zk})`} opacity={clamp(st.edgeAmount ?? 1) * (st.opacity ?? 1)}>
                  <StateArea id={cid} kind={kind} ops={s.ops} fill="#000" />
                </g>
              )}
            </g>
          );
        })}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ borders
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const topo50 = countries50 as any;
const meshCache = new Map<string, string>();
/**
 * Faint state borders: modern 1:50m borders between countries that belong to different historical
 * states (mapping), minus excluded pairs, plus hand-plotted lines.  Memoised per (kind, key).
 */
export function borderPath(kind: MapKind, key: string, mapping: Record<string, string>, exclude: [string, string][], lines: LL[][]): string {
  const ck = `${kind}|${key}`;
  const hit = meshCache.get(ck);
  if (hit !== undefined) return hit;
  const ex = new Set(exclude.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = mesh(topo50, topo50.objects.countries, (a: any, b: any) => {
    if (a === b) return false;
    const na = a.properties?.name;
    const nb = b.properties?.name;
    const sa = mapping[na];
    const sb = mapping[nb];
    if (!sa && !sb) return false;
    if (sa === sb) return false;
    return !ex.has(`${na}|${nb}`);
  }) as MultiLineString;
  const gp = geoPath(baseMap(kind).proj).digits(1);
  const extra: Feature<MultiLineString> = {type: 'Feature', properties: {}, geometry: {type: 'MultiLineString', coordinates: lines}};
  const d = (gp(m) ?? '') + ' ' + (gp(extra) ?? '');
  meshCache.set(ck, d);
  return d;
}
/** Projected path of an arbitrary lon/lat polyline (projection space). */
export const linePath = (kind: MapKind, pts: LL[]) => geoPath(baseMap(kind).proj).digits(1)({type: 'LineString', coordinates: pts} as LineString) ?? '';

export const Borders: React.FC<{d: string; z: number; clipId: string; color?: string; width?: number; opacity?: number}> = ({d, z, clipId, color = '#5E523E', width = 1.8, opacity = 0.75}) => (
  <g clipPath={`url(#${clipId})`}>
    <path d={d} fill="none" stroke={color} strokeWidth={width / z} opacity={opacity} strokeLinejoin="round" strokeLinecap="round" />
  </g>
);

// ------------------------------------------------------------------ sampling (for dot effects)
const sampleCache = new Map<string, LL[]>();
/** Deterministic points inside any of `inside` features (and outside all `outside`), within a bbox. */
export function samplePoints(key: string, n: number, bbox: [number, number, number, number], inside: Feature[], outside: Feature[] = [], seed = 1): LL[] {
  const hit = sampleCache.get(key);
  if (hit) return hit;
  let s = seed >>> 0;
  const r = () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out: LL[] = [];
  for (let k = 0; k < n * 40 && out.length < n; k++) {
    const p: LL = [bbox[0] + r() * (bbox[2] - bbox[0]), bbox[1] + r() * (bbox[3] - bbox[1])];
    if (inside.some((f) => geoContains(f, p)) && !outside.some((f) => geoContains(f, p))) out.push(p);
  }
  sampleCache.set(key, out);
  return out;
}
export const cf = (name: string) => COUNTRIES50.features.find((c) => c.properties.name === name) as Feature;

// ------------------------------------------------------------------ colour helpers
const hex = (c: string) => {
  const h = c.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
/** Mix two #rrggbb colours (t = 0 → a, 1 → b). */
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  const k = clamp(t);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};

/** Screen-space point and heading at fraction t along a polyline. */
export function along(pts: [number, number][], t: number): {p: [number, number]; ang: number} {
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const target = lens[lens.length - 1] * clamp(t);
  for (let i = 1; i < pts.length; i++) {
    if (lens[i] >= target) {
      const k = (target - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
      const a = pts[i - 1];
      const b = pts[i];
      return {p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], ang: Math.atan2(b[1] - a[1], b[0] - a[0])};
    }
  }
  const a = pts[pts.length - 2] ?? pts[0];
  const b = pts[pts.length - 1];
  return {p: b, ang: Math.atan2(b[1] - a[1], b[0] - a[0])};
}

/** Ink outline of a set of states' outer edges is not computed; use Borders.  `ink` re-exported for callers. */
export {ink};
