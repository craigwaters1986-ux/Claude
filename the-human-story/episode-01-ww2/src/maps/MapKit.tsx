// Map overlays for Episode 1: front lines, brackets, pockets, icons (carriers, parachutes,
// gauges), wall maps and globe additions.  All draw in SCREEN coordinates using the
// `toScreen` function that GeoMap passes to its children, so they cost almost nothing.
import React from 'react';
import {C, FONT, W, H} from '../styles/theme';
import {clamp, lerp, easeOut} from '../animations/core';
import {GeoMap, Cam, MapLabel, Highlight} from './GeoMap';
import type {MapKind} from './geo';
import {COUNTRIES50} from './geo';
import {LL, lineKm, reichAt} from './history';
import type {Feature} from 'geojson';

const ink = C.ink;
type ToScreen = (ll: [number, number]) => [number, number];

/** Partial polyline (progress 0..1 along its screen length). */
function partial(pts: [number, number][], progress: number): [number, number][] {
  if (progress >= 1) return pts;
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const target = lens[lens.length - 1] * clamp(progress);
  const out: [number, number][] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (lens[i] <= target) out.push(pts[i]);
    else {
      const k = (target - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
      out.push([lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]);
      break;
    }
  }
  return out;
}
const dOf = (pts: [number, number][]) => 'M' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L');

/**
 * Front line drawn on the map (grows with `progress`).  style 'front' = thick ink line with a
 * coloured core and small "teeth" on the attacker's side; 'line' = plain; 'dashed' = treaty line.
 */
export const FrontLine: React.FC<{pts: LL[]; toScreen: ToScreen; progress?: number; color?: string; width?: number; style?: 'front' | 'line' | 'dashed'; teethSide?: 1 | -1; opacity?: number}> = ({
  pts, toScreen, progress = 1, color = C.red, width = 7, style = 'front', teethSide = 1, opacity = 1,
}) => {
  if (progress <= 0.001) return null;
  const sp = partial(pts.map(toScreen), progress);
  const d = dOf(sp);
  const teeth: React.ReactNode[] = [];
  if (style === 'front') {
    // small triangles every ~46 px on one side of the line
    let acc = 0;
    for (let i = 1; i < sp.length; i++) {
      const [x0, y0] = sp[i - 1];
      const [x1, y1] = sp[i];
      const L = Math.hypot(x1 - x0, y1 - y0);
      const nx = (-(y1 - y0) / (L || 1)) * teethSide;
      const ny = ((x1 - x0) / (L || 1)) * teethSide;
      for (let s = 46 - acc; s < L; s += 46) {
        const px = x0 + ((x1 - x0) * s) / L;
        const py = y0 + ((y1 - y0) * s) / L;
        const ux = (x1 - x0) / L;
        const uy = (y1 - y0) / L;
        teeth.push(<path key={`${i}-${s}`} d={`M${px - ux * 8},${py - uy * 8} L${px + nx * 12},${py + ny * 12} L${px + ux * 8},${py + uy * 8}Z`} fill={color} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />);
      }
      acc = (acc + L) % 46;
    }
  }
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={ink} strokeWidth={width + 5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={style === 'dashed' ? `${width * 2.4} ${width * 1.6}` : undefined} />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={style === 'dashed' ? `${width * 2.4} ${width * 1.6}` : undefined} />
      {teeth}
    </g>
  );
};

/**
 * Measuring bracket drawn alongside a geographic line, offset to one side, with a label
 * (e.g. "NEARLY 3,000 KM").  The bracket follows the line itself rather than a straight span.
 */
export const LineBracket: React.FC<{pts: LL[]; toScreen: ToScreen; label: string; progress?: number; offset?: number; color?: string; labelAt?: number; size?: number}> = ({
  pts, toScreen, label, progress = 1, offset = 46, color = C.ink, labelAt = 0.5, size = 34,
}) => {
  if (progress <= 0.001) return null;
  const sp = pts.map(toScreen);
  // offset each vertex along the averaged normal
  const off = sp.map((p, i) => {
    const a = sp[Math.max(0, i - 1)];
    const b = sp[Math.min(sp.length - 1, i + 1)];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [p[0] + (-(b[1] - a[1]) / L) * offset, p[1] + ((b[0] - a[0]) / L) * offset] as [number, number];
  });
  const shown = partial(off, progress);
  const first = off[0];
  const last = shown[shown.length - 1];
  const mid = off[Math.round((off.length - 1) * labelAt)];
  return (
    <g>
      <path d={dOf(shown)} fill="none" stroke="#F5F0E2" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      <path d={dOf(shown)} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="18 8" />
      <circle cx={first[0]} cy={first[1]} r={10} fill={color} stroke="#F5F0E2" strokeWidth={4} />
      <circle cx={last[0]} cy={last[1]} r={10} fill={color} stroke="#F5F0E2" strokeWidth={4} />
      {progress > 0.6 && <MapLabel at={[mid[0] + offset * 1.4, mid[1]]} text={label} size={size} opacity={clamp((progress - 0.6) / 0.3)} />}
    </g>
  );
};
/** Length of a front line in km (for checking the bracket label against the plotted line). */
export const frontKm = (pts: LL[]) => Math.round(lineKm(pts));

/** Pulsing pocket outline (e.g. Stalingrad, Dunkirk) — pass as a GeoMap highlight for the fill. */
export const pocketHighlight = (feature: Feature, f: number, fill = C.axis): Highlight => ({feature, fill, opacity: 0.55 + 0.2 * Math.sin(f / 8), stroke: C.red});

/** The shrinking German-held block (t: 0 = Dec 1944, 1 = Mar 1945, 2 = Apr 1945), plus neutral overpaint. */
export const reichHighlights = (t: number, fill = C.axis): Highlight[] => [
  {feature: reichAt(t), fill, opacity: 0.85},
  {feature: countryFeature('Switzerland'), fill: C.land},
  {feature: countryFeature('Sweden'), fill: C.land},
];

// ------------------------------------------------------------------ icons (M-10)
/** Top-down aircraft-carrier icon.  side 'us' = blue with a white star; 'jp' = grey with a red disc. */
export const CarrierIcon: React.FC<{x: number; y: number; side: 'us' | 'jp'; s?: number; rot?: number; hit?: number; f?: number}> = ({x, y, side, s = 1, rot = 0, hit = 0, f = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-60,-11 L52,-11 L64,0 L52,11 L-60,11 L-64,0Z" fill={side === 'us' ? '#3F5E8A' : '#8A8C8E'} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
    <line x1={-50} y1={0} x2={46} y2={0} stroke="#fff" strokeWidth={2} strokeDasharray="8 6" opacity={0.7} />
    <rect x={10} y={-17} width={18} height={7} fill="#5A5C5E" stroke={ink} strokeWidth={2.5} />
    {side === 'jp' ? <circle cx={-26} cy={0} r={6.5} fill="#BC002D" stroke="#fff" strokeWidth={2} /> : <path d="M-26,-7 L-24,-2 L-19,-2 L-23,1.5 L-21.5,7 L-26,3.5 L-30.5,7 L-29,1.5 L-33,-2 L-28,-2Z" fill="#fff" />}
    {hit > 0 && (
      <g opacity={clamp(hit * 2)}>
        {[0, 1, 2].map((i) => {
          const t = ((f / 30 + i / 3) % 1);
          return <circle key={i} cx={-10 + i * 16} cy={-14 - t * 40} r={8 + t * 14} fill="#3A3A3A" opacity={(1 - t) * 0.8} />;
        })}
        <circle cx={0} cy={0} r={9} fill={C.fire} />
      </g>
    )}
  </g>
);

/** Four-carrier tally strip: each carrier is struck through as `struck` passes i+1 (0..4). */
export const CarrierTally: React.FC<{x: number; y: number; struck: number; label?: string; f: number}> = ({x, y, struck, label = 'JAPANESE CARRIERS SUNK', f}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-20} y={-56} width={4 * 160 + 40} height={150} rx={14} fill="rgba(245,240,226,0.94)" stroke={ink} strokeWidth={5} />
    <text x={(4 * 160) / 2} y={-18} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={36} fill={ink} letterSpacing={1}>{label}</text>
    {[0, 1, 2, 3].map((i) => {
      const k = clamp(struck - i);
      return (
        <g key={i} transform={`translate(${80 + i * 160},44)`}>
          <CarrierIcon x={0} y={0} side="jp" s={1.05} hit={k} f={f + i * 7} />
          {k > 0 && <line x1={-62} y1={22} x2={-62 + 124 * easeOut(k)} y2={-22} stroke={C.red} strokeWidth={9} strokeLinecap="round" />}
        </g>
      );
    })}
  </g>
);

/** Small parachute map icon. */
export const ParachuteIcon: React.FC<{x: number; y: number; s?: number; color?: string; f?: number; seed?: number}> = ({x, y, s = 1, color = '#F2EBDC', f = 0, seed = 0}) => (
  <g transform={`translate(${x},${y + Math.sin(f / 14 + seed) * 3}) rotate(${Math.sin(f / 20 + seed) * 6}) scale(${s})`}>
    <path d="M-22,-8 C-22,-34 22,-34 22,-8 Q16,-12 11,-8 Q5,-12 0,-8 Q-5,-12 -11,-8 Q-16,-12 -22,-8Z" fill={color} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M-22,-8 L0,16 M22,-8 L0,16 M0,-8 L0,16" stroke={ink} strokeWidth={1.8} />
    <circle cx={0} cy={19} r={5} fill={ink} />
  </g>
);

/** Round gauge icon with a label (MEN / FUEL / TIME) and an animatable needle (value 0..1). */
export const Gauge: React.FC<{x: number; y: number; value: number; label: string; s?: number; color?: string}> = ({x, y, value, label, s = 1, color = C.red}) => {
  const a = Math.PI * (1 - clamp(value)); // 1 = full right... value 0 = left (empty)
  const nx = Math.cos(a) * 60;
  const ny = -Math.sin(a) * 60;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M-82,10 A82,82 0 0 1 82,10 L82,26 L-82,26Z" fill="#F5F0E2" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
      <path d="M-66,10 A66,66 0 0 1 -38,-44" fill="none" stroke={C.red} strokeWidth={10} />
      {Array.from({length: 7}).map((_, i) => {
        const t = Math.PI * (1 - i / 6);
        return <line key={i} x1={Math.cos(t) * 70} y1={10 - Math.sin(t) * 70} x2={Math.cos(t) * 80} y2={10 - Math.sin(t) * 80} stroke={ink} strokeWidth={4} />;
      })}
      <line x1={0} y1={10} x2={nx} y2={10 + ny} stroke={color} strokeWidth={7} strokeLinecap="round" />
      <circle cx={0} cy={10} r={10} fill={ink} />
      <text x={0} y={70} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={38} fill={ink} stroke="#fff" strokeWidth={8} paintOrder="stroke">{label}</text>
    </g>
  );
};

// ------------------------------------------------------------------ wall map
/**
 * A framed map on a wall (briefing room, Munich).  Renders a GeoMap into a nested SVG
 * viewport so it is clipped to the frame.  Keep `w` ≥ 480 so labels stay legible.
 */
export const WallMap: React.FC<{x: number; y: number; w: number; kind: MapKind; cam: Cam; f: number; highlights?: Highlight[]; children?: React.ComponentProps<typeof GeoMap>['children']; id: string; frame?: string; pins?: boolean}> = ({
  x, y, w, kind, cam, f, highlights, children, id, frame = '#6B4A2E', pins = true,
}) => {
  const h = (w * H) / W;
  return (
    <g>
      <rect x={x - 22} y={y - 22} width={w + 44} height={h + 44} rx={6} fill={frame} stroke={ink} strokeWidth={5} />
      <svg x={x} y={y} width={w} height={h} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" overflow="hidden">
        <GeoMap kind={kind} cam={cam} f={f} highlights={highlights} idSuffix={`-wall-${id}`} seaLines={0}>{children}</GeoMap>
        <rect x={0} y={0} width={W} height={H} fill="#F4E9C8" opacity={0.18} />
      </svg>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={ink} strokeWidth={4} />
      {pins && [[x + 14, y + 14], [x + w - 14, y + 14]].map(([px, py], i) => <circle key={i} cx={px} cy={py} r={8} fill={C.red} stroke={ink} strokeWidth={2.5} />)}
    </g>
  );
};

// ------------------------------------------------------------------ globe additions (M-11)
/** Glowing hotspot for use inside Globe children: ({proj}) => <GlobeHotspot proj={proj} at={...} f={f} />. */
export const GlobeHotspot: React.FC<{proj: (ll: [number, number]) => [number, number] | null; at: LL; f: number; color?: string; r?: number; delay?: number; label?: string}> = ({
  proj, at, f, color = C.fire, r = 26, delay = 0, label,
}) => {
  const p = proj(at);
  if (!p) return null;
  const t = ((f + delay) % 50) / 50;
  const on = clamp((f - delay) / 15);
  if (on <= 0) return null;
  return (
    <g opacity={on}>
      <circle cx={p[0]} cy={p[1]} r={r * 2.2} fill={color} opacity={0.14} />
      <circle cx={p[0]} cy={p[1]} r={r * (1 + t * 1.6)} fill="none" stroke={color} strokeWidth={5} opacity={1 - t} />
      <circle cx={p[0]} cy={p[1]} r={r * 0.55} fill={C.fireYellow} stroke={ink} strokeWidth={3} />
      {label && <MapLabel at={[p[0], p[1] - r * 1.6]} text={label} size={30} />}
    </g>
  );
};
export const HOTSPOTS: Record<string, LL> = {Europe: [15, 50], 'North Africa': [22, 31], Asia: [115, 33], Pacific: [165, 10], Atlantic: [-35, 45]};

/** Iron-Curtain style crack across the globe between the US and Soviet blocs (reveal 0..1). */
export const CRACK_LINE: LL[] = [[14.3, 54.6], [13.0, 53.0], [11.2, 52.0], [10.5, 50.8], [12.2, 50.3], [13.7, 48.8], [16.0, 48.3], [16.4, 47.2], [13.8, 45.7], [16.0, 43.0], [20.5, 40.3], [26.0, 41.7], [28.5, 41.2]];
export const GlobeCrack: React.FC<{path: (ft: {type: 'LineString'; coordinates: [number, number][]}) => string; reveal: number}> = ({path, reveal}) => {
  if (reveal <= 0) return null;
  const n = Math.max(2, Math.round(CRACK_LINE.length * clamp(reveal)));
  const coords = CRACK_LINE.slice(0, n) as [number, number][];
  const d = path({type: 'LineString', coordinates: coords});
  return (
    <g>
      <path d={d} fill="none" stroke="#fff" strokeWidth={12} strokeLinejoin="miter" opacity={0.85} />
      <path d={d} fill="none" stroke={ink} strokeWidth={6} strokeLinejoin="miter" />
    </g>
  );
};
export const COLD_WAR_HIGHLIGHTS = (k = 1) => [
  {name: 'United States of America', fill: C.allied, opacity: k},
  {name: 'Russia', fill: C.soviet, opacity: k},
  {name: 'Ukraine', fill: C.soviet, opacity: k},
  {name: 'Belarus', fill: C.soviet, opacity: k},
  {name: 'Kazakhstan', fill: C.soviet, opacity: k},
];

/** Country feature lookup (50m) for use as a fill highlight by feature. */
export const countryFeature = (name: string): Feature => COUNTRIES50.features.find((c) => c.properties.name === name) as Feature;
