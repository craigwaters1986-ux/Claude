// Animated historical map with a camera, country highlights, historical overlays,
// animated arrows, city markers and labels.
import React from 'react';
import type {Feature} from 'geojson';
import {geoGraticule10, geoOrthographic, geoPath} from 'd3-geo';
import {C, FONT, W, H} from '../styles/theme';
import {baseMap, featurePath, MapKind, COUNTRIES110, CITY} from './geo';
import {clamp, easeInOut, lerp} from '../animations/core';

const ink = C.ink;

export type Cam = {lon: number; lat: number; zoom: number};
export type MapCtx = {toScreen: (ll: [number, number]) => [number, number]; z: number; kind: MapKind};

export function camLerp(a: Cam, b: Cam, t: number): Cam {
  return {lon: lerp(a.lon, b.lon, t), lat: lerp(a.lat, b.lat, t), zoom: a.zoom * Math.pow(b.zoom / a.zoom, t)};
}

export type Highlight = {name?: string; feature?: Feature; fill: string; opacity?: number; stroke?: string; hatch?: boolean; pulse?: number};

type Props = {
  kind: MapKind;
  cam: Cam;
  f: number;
  highlights?: Highlight[];
  children?: (ctx: MapCtx) => React.ReactNode;
  sea?: string;
  land?: string;
  dim?: number; // darken (0..1) for sombre moments
  borders?: boolean;
};

export const GeoMap: React.FC<Props> = ({kind, cam, f, highlights = [], children, sea = '#9DBCC4', land = C.land, dim = 0, borders = true}) => {
  const bm = baseMap(kind);
  const focus = bm.proj([cam.lon, cam.lat]) ?? [W / 2, H / 2];
  const z = cam.zoom;
  const toScreen = (ll: [number, number]): [number, number] => {
    const p = bm.proj(ll) ?? [0, 0];
    return [W / 2 + (p[0] - focus[0]) * z, H / 2 + (p[1] - focus[1]) * z];
  };
  const tf = `translate(${W / 2},${H / 2}) scale(${z}) translate(${-focus[0]},${-focus[1]})`;
  const clipId = `land-${kind}`;
  return (
    <g>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={sea} />
      {/* subtle sea texture */}
      {Array.from({length: 18}).map((_, i) => (
        <path key={i} d={`M${-100 + ((i * 397) % 2000)},${60 + i * 58} q20,-10 40,0 t40,0`} stroke="#fff" strokeWidth={3} opacity={0.25} fill="none" transform={`translate(${Math.sin(f / 40 + i) * 10},0)`} />
      ))}
      <defs>
        <clipPath id={clipId}>
          <path d={bm.land} transform={tf} />
        </clipPath>
      </defs>
      <g transform={tf}>
        <path d={bm.land} fill={land} stroke="none" />
        {highlights
          .filter((h) => h.name)
          .map((h, i) => (
            <path key={'c' + i} d={bm.paths.get(h.name!) ?? ''} fill={h.fill} opacity={(h.opacity ?? 1) * (h.pulse ? 0.75 + 0.25 * Math.sin(f / 6) : 1)} />
          ))}
        {borders && [...bm.paths.values()].map((d, i) => <path key={i} d={d} fill="none" stroke="#6B5E48" strokeWidth={1.4} vectorEffect="non-scaling-stroke" opacity={0.55} />)}
      </g>
      <g clipPath={`url(#${clipId})`}>
        <g transform={tf}>
          {highlights
            .filter((h) => h.feature)
            .map((h, i) => (
              <g key={'h' + i} opacity={h.opacity ?? 1}>
                <path d={featurePath(kind, h.feature!)} fill={h.fill} stroke={h.stroke ?? 'none'} strokeWidth={3} vectorEffect="non-scaling-stroke" />
              </g>
            ))}
        </g>
      </g>
      <g transform={tf}>
        <path d={bm.land} fill="none" stroke={ink} strokeWidth={3} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </g>
      {dim > 0 && <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#0E1520" opacity={dim} />}
      {children?.({toScreen, z, kind})}
    </g>
  );
};

// ---------- arrows ----------
function catmull(pts: [number, number][], samples = 14): [number, number][] {
  if (pts.length < 3) {
    const out: [number, number][] = [];
    for (let i = 0; i <= samples * 2; i++) out.push([lerp(pts[0][0], pts[1][0], i / (samples * 2)), lerp(pts[0][1], pts[1][1], i / (samples * 2))]);
    return out;
  }
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < samples; j++) {
      const t = j / samples;
      const t2 = t * t;
      const t3 = t2 * t;
      const q = (k: 0 | 1) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([q(0), q(1)]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Thick military campaign arrow that "grows" along its route (progress 0..1). */
export const MapArrow: React.FC<{pts: [number, number][]; progress: number; color?: string; width?: number; opacity?: number; dashed?: boolean}> = ({pts, progress, color = C.axis, width = 26, opacity = 1, dashed}) => {
  if (progress <= 0.001) return null;
  const smooth = catmull(pts);
  const lens = [0];
  for (let i = 1; i < smooth.length; i++) lens.push(lens[i - 1] + Math.hypot(smooth[i][0] - smooth[i - 1][0], smooth[i][1] - smooth[i - 1][1]));
  const total = lens[lens.length - 1];
  const target = total * clamp(progress);
  const partial: [number, number][] = [];
  let tip = smooth[0];
  let dir = 0;
  for (let i = 0; i < smooth.length; i++) {
    if (lens[i] <= target) {
      partial.push(smooth[i]);
      tip = smooth[i];
    } else {
      const k = (target - lens[i - 1]) / (lens[i] - lens[i - 1]);
      tip = [lerp(smooth[i - 1][0], smooth[i][0], k), lerp(smooth[i - 1][1], smooth[i][1], k)];
      partial.push(tip);
      break;
    }
  }
  if (partial.length >= 2) {
    const a = partial[partial.length - 2];
    dir = Math.atan2(tip[1] - a[1], tip[0] - a[0]);
  }
  const headL = width * 1.5;
  const body = partial.slice();
  // pull body back under the head
  const back: [number, number] = [tip[0] - Math.cos(dir) * headL * 0.6, tip[1] - Math.sin(dir) * headL * 0.6];
  body[body.length - 1] = back;
  const d = 'M' + body.map((p) => `${p[0]},${p[1]}`).join(' L');
  const hx = (ang: number, r: number) => `${tip[0] + Math.cos(dir + ang) * r},${tip[1] + Math.sin(dir + ang) * r}`;
  const head = `M${hx(0, headL * 0.55)} L${hx(2.45, headL)} L${hx(-2.45, headL)}Z`;
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={ink} strokeWidth={width + 9} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashed ? `${width} ${width * 0.8}` : undefined} />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashed ? `${width} ${width * 0.8}` : undefined} />
      <path d={head} fill={color} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};

export const MapLabel: React.FC<{at: [number, number]; text: string; size?: number; color?: string; opacity?: number; italic?: boolean; stroke?: string; weight?: number; dy?: number}> = ({
  at, text, size = 30, color = ink, opacity = 1, italic, stroke = 'rgba(255,255,255,0.85)', weight = 800, dy = 0,
}) => (
  <text x={at[0]} y={at[1] + dy} textAnchor="middle" fontFamily={FONT.sans} fontWeight={weight} fontSize={size} fill={color} opacity={opacity} fontStyle={italic ? 'italic' : 'normal'} stroke={stroke} strokeWidth={size * 0.22} paintOrder="stroke" letterSpacing={1.5}>
    {text}
  </text>
);

export const CityMarker: React.FC<{at: [number, number]; name?: string; f: number; opacity?: number; color?: string; labelDx?: number; labelDy?: number; size?: number; pulse?: boolean}> = ({
  at, name, f, opacity = 1, color = C.red, labelDx = 0, labelDy = -22, size = 26, pulse = true,
}) => (
  <g opacity={opacity}>
    {pulse && <circle cx={at[0]} cy={at[1]} r={10 + ((f % 40) / 40) * 26} fill="none" stroke={color} strokeWidth={4} opacity={1 - (f % 40) / 40} />}
    <circle cx={at[0]} cy={at[1]} r={10} fill={color} stroke={ink} strokeWidth={4} />
    {name && <MapLabel at={[at[0] + labelDx, at[1] + labelDy]} text={name} size={size} />}
  </g>
);

export const city = (n: string) => CITY[n];

/** A rotating orthographic globe with highlighted countries. */
export const Globe: React.FC<{f: number; lon: number; lat: number; r?: number; cx?: number; cy?: number; highlights?: {name: string; fill: string; opacity?: number}[]; children?: (ctx: {proj: (ll: [number, number]) => [number, number] | null; path: (f: Feature | {type: 'LineString'; coordinates: [number, number][]}) => string}) => React.ReactNode; dim?: number; landColor?: string; seaColor?: string}> = ({
  f, lon, lat, r = 420, cx = W / 2, cy = H / 2, highlights = [], children, dim = 0, landColor = C.land, seaColor = '#9DBCC4',
}) => {
  const proj = geoOrthographic().rotate([-lon, -lat]).scale(r).translate([cx, cy]).clipAngle(90);
  const gp = geoPath(proj);
  const hl = new Map(highlights.map((h) => [h.name, h]));
  return (
    <g>
      <circle cx={cx + 14} cy={cy + 18} r={r} fill="rgba(0,0,0,0.25)" />
      <circle cx={cx} cy={cy} r={r} fill={seaColor} stroke={ink} strokeWidth={6} />
      <path d={gp(geoGraticule10()) ?? ''} fill="none" stroke="#fff" strokeWidth={1.2} opacity={0.35} />
      {COUNTRIES110.features.map((c, i) => {
        const h = hl.get(c.properties.name);
        return <path key={i} d={gp(c) ?? ''} fill={h ? h.fill : landColor} fillOpacity={h?.opacity ?? 1} stroke="#6B5E48" strokeWidth={1.2} />;
      })}
      {children?.({proj: (ll) => proj(ll), path: (ft) => gp(ft as never) ?? ''})}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={ink} strokeWidth={6} />
      <defs>
        <radialGradient id="globeShade" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0.5" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.35} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="url(#globeShade)" />
      {dim > 0 && <circle cx={cx} cy={cy} r={r} fill="#0E1520" opacity={dim} />}
    </g>
  );
};

export const growArrow = (f: number, a: number, b: number) => easeInOut(clamp((f - a) / (b - a)));
