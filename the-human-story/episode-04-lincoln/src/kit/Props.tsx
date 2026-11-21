// Episode 4 prop and grip system.
// Every prop has grip points in its own local space (px at scale 1, y down) and a draw function.
// A prop is placed in the world by a transform {x, y, rot, s}. Hands are put ON the grips with the
// two-bone arm IK (`reach`), so a held object and the hand never separate: the prop moves, the hand
// follows it every frame. For one-handed props that the hand drives instead, `Hold` attaches the
// prop to the hand from `handWorld()` (forward kinematics). Either way the contact error is measured
// by `contactError` and drawn by `<GripDebug>` (dev overlay, `debug` input prop).
import React from 'react';
import {C, FONT} from '../styles/theme';
import {Pose} from '../characters/poses';
import {Build, handWorld, Placement, Pt, reach, toLocal} from '../characters/skeleton';
import {clamp, easeInOut} from '../animations/core';

export type PropXf = {x: number; y: number; rot?: number; s?: number; flip?: boolean};
export type GripName = 'handle' | 'grip2' | 'rest';
export type PropDef = {grips: Partial<Record<GripName, Pt>>; draw: (st: PropState) => React.ReactNode};
export type PropState = {f: number; open?: number; page?: number; angle?: number; t?: number};

const ink = C.ink;
const o = (w = 4) => ({stroke: ink, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});

/** World position of a prop's grip point. */
export function gripWorld(xf: PropXf, g: Pt): Pt {
  const s = xf.s ?? 1;
  const a = ((xf.rot ?? 0) * Math.PI) / 180;
  const gx = (xf.flip ? -g.x : g.x) * s;
  const gy = g.y * s;
  return {x: xf.x + gx * Math.cos(a) - gy * Math.sin(a), y: xf.y + gx * Math.sin(a) + gy * Math.cos(a)};
}

/** Pose with one or both hands on world targets (R = near arm, L = far arm). */
export function handsOn(pl: Placement, base: Pose, t: {R?: Pt; L?: Pt}, build?: Build, elbowDown = true): Pose {
  let P = base;
  if (t.R) P = reach(P, 'R', toLocal(pl, t.R), build, elbowDown);
  if (t.L) P = reach(P, 'L', toLocal(pl, t.L), build, elbowDown);
  return P;
}

/** Blend arm angles between a free pose and a gripping pose (approach / release), u 0..1. */
export function approach(free: Pose, grip: Pose, u: number): Pose {
  const k = easeInOut(clamp(u));
  return {...grip, shL: free.shL + (grip.shL - free.shL) * k, elL: free.elL + (grip.elL - free.elL) * k, shR: free.shR + (grip.shR - free.shR) * k, elR: free.elR + (grip.elR - free.elR) * k};
}

/** Distance (world px) between a hand and its target. */
export function contactError(pl: Placement, P: Pose, side: 'L' | 'R', target: Pt, build?: Build): number {
  const h = handWorld(pl, P, side, build);
  return Math.hypot(h.x - target.x, h.y - target.y);
}

/** Draw a prop at a world transform. */
export const PropAt: React.FC<{def: PropDef; xf: PropXf; st: PropState}> = ({def, xf, st}) => (
  <g transform={`translate(${xf.x},${xf.y}) rotate(${xf.rot ?? 0}) scale(${(xf.flip ? -1 : 1) * (xf.s ?? 1)},${xf.s ?? 1})`}>{def.draw(st)}</g>
);

/** Forward-kinematic hold: draws the prop so that its `grip` sits on the hand, rotated with the forearm. */
export const Hold: React.FC<{pl: Placement; P: Pose; side: 'L' | 'R'; def: PropDef; grip?: GripName; st: PropState; rot?: number; build?: Build; s?: number}> = ({pl, P, side, def, grip = 'handle', st, rot = 0, build, s = 1}) => {
  const h = handWorld(pl, P, side, build);
  const g = def.grips[grip] ?? {x: 0, y: 0};
  const sc = (pl.scale ?? 1) * s;
  return (
    <g transform={`translate(${h.x},${h.y}) rotate(${h.angle + rot}) scale(${sc}) translate(${-g.x},${-g.y})`}>{def.draw(st)}</g>
  );
};

// ---------------------------------------------------------------- props

/** Felling axe: handle end at the origin, along +x; head at x 96–122. */
export const AXE: PropDef = {
  grips: {handle: {x: 4, y: 0}, grip2: {x: 30, y: 0}},
  draw: () => (
    <g>
      <path d="M0,0 L104,-2" stroke="#2A1D12" strokeWidth={10} strokeLinecap="round" />
      <path d="M0,0 L104,-2" stroke="#9A7046" strokeWidth={5.5} strokeLinecap="round" />
      <path d="M96,-12 L118,-16 Q126,-2 118,13 L96,9Z" fill="#8E949A" {...o(3.5)} />
      <path d="M116,-14 Q123,-2 116,11" fill="none" stroke="#D8DCE0" strokeWidth={2.5} />
    </g>
  ),
};

/** Book: closed (open = 0) or open (open = 1); `page` 0..1 drives one turning leaf. Spine at the origin. */
export const BOOK: PropDef = {
  grips: {handle: {x: -30, y: 6}, grip2: {x: 30, y: 6}, rest: {x: 0, y: 14}},
  draw: ({open = 0, page = 0}) => {
    const w = 30 + 0 * open;
    const coverL = -w * (0.15 + 0.85 * open);
    const lift = 10 * open;
    const turn = page > 0 && page < 1 ? Math.cos(page * Math.PI) : 1; // leaf x scale: +1 right page, -1 left page
    return (
      <g>
        <path d={`M0,${12} L${coverL},${12 - lift * 0.3} L${coverL},${-24 - lift * 0.6} L0,${-24}Z`} fill="#6E2A22" {...o(3.5)} />
        <path d={`M0,${12} L${w},${12 - lift * 0.3} L${w},${-24 - lift * 0.6} L0,${-24}Z`} fill="#6E2A22" {...o(3.5)} />
        {open > 0.3 && (
          <g opacity={clamp((open - 0.3) / 0.4)}>
            <path d={`M0,9 Q${coverL * 0.5},${2} ${coverL + 3},${8 - lift * 0.3} L${coverL + 3},${-21 - lift * 0.6} Q${coverL * 0.5},${-28} 0,-21Z`} fill="#F1E6C8" {...o(2.5)} />
            <path d={`M0,9 Q${w * 0.5},${2} ${w - 3},${8 - lift * 0.3} L${w - 3},${-21 - lift * 0.6} Q${w * 0.5},${-28} 0,-21Z`} fill="#F4EAD0" {...o(2.5)} />
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i} stroke="#8A7A5E" strokeWidth={1.4}>
                <line x1={coverL + 7} y1={-16 + i * 5} x2={-4} y2={-15 + i * 5} />
                <line x1={4} y1={-15 + i * 5} x2={w - 7} y2={-16 + i * 5} />
              </g>
            ))}
            {page > 0 && page < 1 && <path d={`M0,9 Q${w * 0.5 * turn},${2 - 8 * Math.sin(page * Math.PI)} ${(w - 3) * turn},${8 - lift * 0.3 - 10 * Math.sin(page * Math.PI)} L${(w - 3) * turn},${-21 - lift * 0.6 - 10 * Math.sin(page * Math.PI)} Q${w * 0.5 * turn},${-28} 0,-21Z`} fill="#FBF3DE" {...o(2.5)} />}
          </g>
        )}
      </g>
    );
  },
};

/** Quill: nib at the origin, feather up and back. Family review (Nov 2026): a real goose quill, not a white blade:
 *  a horn-coloured barrel and shaft, a curved central rachis, and a vane of many separate barbs (wider on one side,
 *  with a few splits and a downy base), so the feathers read even at desk distance. Same extent and grip as before. */
const QUILL_GEOM = (() => {
  const L = 104; // nib to tip along the axis
  const ux = -0.803, uy = -0.596; // axis (nib -> tip)
  const nx = 0.596, ny = -0.803; // normal (towards the long side of the vane)
  const curve = (t: number) => 0.0022 * (t - 20) * (t - 20) * (t > 20 ? 1 : 0); // gentle bend of the rachis
  const P = (t: number, n = 0) => ({x: ux * t + nx * (n - curve(t)), y: uy * t + ny * (n - curve(t))});
  const f = (v: number) => v.toFixed(1);
  const rach = [0, 10, 20, 30, 45, 60, 75, 90, L].map((t) => P(t));
  const rachis = 'M' + rach.map((q) => `${f(q.x)},${f(q.y)}`).join(' L');
  // vane outline: long side (n > 0) and short side (n < 0), widths along t
  const wide = (t: number) => (t < 26 ? 0 : t > L ? 0 : 18 * Math.sin(Math.PI * Math.pow((t - 26) / (L - 26), 0.72)));
  const narrow = (t: number) => (t < 30 ? 0 : t > L ? 0 : 9 * Math.sin(Math.PI * Math.pow((t - 30) / (L - 30), 0.8)));
  const ts: number[] = [];
  for (let t = 26; t <= L; t += 2) ts.push(t);
  const outline = 'M' + ts.map((t) => { const q = P(t, wide(t)); return `${f(q.x)},${f(q.y)}`; }).join(' L') + ' L' +
    ts.slice().reverse().map((t) => { const q = P(t, -narrow(t)); return `${f(q.x)},${f(q.y)}`; }).join(' L') + 'Z';
  // barbs: each leaves the rachis and sweeps back towards the tip; small gaps make the splits
  const splits = new Set([44, 46, 72, 90]);
  const barbs: string[] = [];
  for (let t = 27; t <= L - 2; t += 2) {
    if (splits.has(t)) continue;
    const a = P(t), b = P(t + 7, wide(t + 3) * 0.98);
    barbs.push(`M${f(a.x)},${f(a.y)} Q${f(P(t + 3, wide(t) * 0.55).x)},${f(P(t + 3, wide(t) * 0.55).y)} ${f(b.x)},${f(b.y)}`);
    if (t >= 31) {
      const c = P(t + 5, -narrow(t + 2) * 0.96);
      barbs.push(`M${f(a.x)},${f(a.y)} Q${f(P(t + 2.5, -narrow(t) * 0.5).x)},${f(P(t + 2.5, -narrow(t) * 0.5).y)} ${f(c.x)},${f(c.y)}`);
    }
  }
  // the split notches cut into the long side
  const notches = [45, 73].map((t) => { const a = P(t, wide(t) + 1), b = P(t + 4, wide(t) * 0.35); return `M${f(a.x)},${f(a.y)} L${f(b.x)},${f(b.y)}`; });
  // downy afterfeather at the base of the vane
  const down: string[] = [];
  for (let k = 0; k < 7; k++) {
    const t = 22 + k * 1.3; const a = P(t);
    const side = k % 2 ? 1 : -1; const b = P(t + 4, side * (5 + (k % 3) * 2));
    down.push(`M${f(a.x)},${f(a.y)} q${f((b.x - a.x) * 0.4 + 2)},${f((b.y - a.y) * 0.4 - 2)} ${f(b.x - a.x)},${f(b.y - a.y)}`);
  }
  const barrelEnd = P(22);
  const tipDark = 'M' + ts.filter((t) => t > 84).map((t) => { const q = P(t, wide(t)); return `${f(q.x)},${f(q.y)}`; }).join(' L') + ` L${f(P(L).x)},${f(P(L).y)} Z`;
  return {rachis, outline, barbs: barbs.join(' '), notches: notches.join(' '), down: down.join(' '), barrelEnd, tipDark};
})();
export const QUILL: PropDef = {
  grips: {handle: {x: -13, y: -10}},
  draw: () => {
    const Q = QUILL_GEOM;
    return (
      <g>
        {/* vane (behind the shaft), light grey-white with a darker tip */}
        <path d={Q.outline} fill="#EEE8DA" stroke={ink} strokeWidth={2} strokeLinejoin="round" />
        <path d={Q.tipDark} fill="#B9AE98" opacity={0.75} />
        <path d={Q.barbs} fill="none" stroke="#9C927E" strokeWidth={0.9} strokeLinecap="round" />
        <path d={Q.notches} fill="none" stroke="#7E7462" strokeWidth={1.2} strokeLinecap="round" />
        <path d={Q.down} fill="none" stroke="#D8D0C0" strokeWidth={1.4} strokeLinecap="round" />
        {/* rachis and the horn barrel down to the cut nib */}
        <path d={Q.rachis} fill="none" stroke="#5A4A34" strokeWidth={2.2} strokeLinecap="round" />
        <path d={`M0,0 L${Q.barrelEnd.x.toFixed(1)},${Q.barrelEnd.y.toFixed(1)}`} stroke="#3A2A1C" strokeWidth={4.5} strokeLinecap="round" />
        <path d={`M0,0 L${Q.barrelEnd.x.toFixed(1)},${Q.barrelEnd.y.toFixed(1)}`} stroke="#CDB88C" strokeWidth={2.2} strokeLinecap="round" />
        <path d="M0,0 L-6,-3 L-3,-7Z" fill={ink} />
      </g>
    );
  },
};

/** Lincoln's stovepipe hat as a held prop (brim edge = grip). */
export const STOVEPIPE: PropDef = {
  grips: {handle: {x: 34, y: 0}},
  draw: () => (
    <g>
      <ellipse cx={0} cy={0} rx={48} ry={7} fill="#1C1C20" {...o(3.5)} />
      <path d="M-29,-2 L-31,-70 Q0,-74 31,-70 L29,-2Z" fill="#1C1C20" {...o(3.5)} />
      <rect x={-29} y={-14} width={58} height={8} fill="#38383E" />
    </g>
  ),
};

/** Ink pot (sits on a desk; the quill dips into it). */
export const InkPot: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x},${y})`}>
    <path d="M-16,0 L-18,-24 Q0,-30 18,-24 L16,0Z" fill="#2A2A30" {...o(3)} />
    <ellipse cx={0} cy={-25} rx={10} ry={3} fill="#0E0E12" />
  </g>
);

/** Split rail log lying on a chopping block; `split` 0..1 opens the cut. */
export const RailLog: React.FC<{x: number; y: number; split?: number; len?: number}> = ({x, y, split = 0, len = 260}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-len / 2} y={-34} width={len} height={34} rx={14} fill="#8A6440" {...o(4)} />
    <ellipse cx={-len / 2 + 6} cy={-17} rx={9} ry={16} fill="#C49A62" {...o(3)} />
    {[0, 1, 2].map((i) => <path key={i} d={`M${-len / 2 + 40 + i * 70},-26 q20,4 40,0`} stroke="#5E4128" strokeWidth={2.5} fill="none" />)}
    {split > 0 && <path d={`M-8,-34 L${-2 + split * 6},${-34 + 30 * split} L4,-34Z`} fill="#3A2614" />}
  </g>
);

/** Wood chips thrown from an impact point at frame `at` (deterministic). */
export const Chips: React.FC<{x: number; y: number; f: number; at: number; dir?: 1 | -1}> = ({x, y, f, at, dir = 1}) => {
  const t = f - at;
  if (t < 0 || t > 26) return null;
  return (
    <g>
      {Array.from({length: 7}, (_, i) => {
        const vx = (2 + (i % 4) * 1.6) * (i % 2 ? dir : -dir * 0.6);
        const vy = -6 - (i % 3) * 2.2;
        const px = x + vx * t;
        const py = y + vy * t + 0.42 * t * t;
        return <rect key={i} x={px} y={py} width={7} height={4} rx={1} fill="#D2A86E" stroke={ink} strokeWidth={1.5} transform={`rotate(${t * 25 * (i % 2 ? 1 : -1)},${px},${py})`} opacity={1 - t / 26} />;
      })}
    </g>
  );
};

/** A panelled door on a vertical hinge at (x, floor); `angle` 0 = shut, 90 = fully open towards the camera. */
export const DOOR_W = 118;
export const DOOR_H = 236;
export const doorHandle = (hx: number, floor: number, angle: number, s = 1): Pt => ({x: hx + (DOOR_W - 16) * s * Math.cos((angle * Math.PI) / 180), y: floor - 120 * s});
export const Door: React.FC<{x: number; floor: number; angle: number; s?: number; color?: string; dark?: string; frameOnly?: boolean}> = ({x, floor, angle, s = 1, color = '#6B4A30', dark = '#1A1412'}) => {
  const c = Math.cos((angle * Math.PI) / 180);
  const w = DOOR_W * c;
  const sk = 10 * Math.sin((angle * Math.PI) / 180); // the free edge drops a little in perspective
  const h0 = doorHandle(0, 0, angle, 1);
  const h = {x: h0.x + x, y: h0.y + floor};
  void h;
  return (
    <g transform={`translate(${x},${floor}) scale(${s}) translate(${-x},${-floor})`}>
      <rect x={x} y={floor - DOOR_H} width={DOOR_W} height={DOOR_H} fill={dark} />
      <path d={`M${x},${floor} L${x},${floor - DOOR_H} L${x + w},${floor - DOOR_H - sk} L${x + w},${floor + sk}Z`} fill={color} {...o(4)} />
      {c > 0.25 && (
        <g opacity={clamp((c - 0.25) * 3)}>
          <rect x={x + w * 0.14} y={floor - DOOR_H + 22} width={w * 0.72} height={84} fill="none" stroke="#3E2A1A" strokeWidth={3} />
          <rect x={x + w * 0.14} y={floor - 118} width={w * 0.72} height={94} fill="none" stroke="#3E2A1A" strokeWidth={3} />
        </g>
      )}
      <circle cx={x + h0.x} cy={floor + h0.y} r={6} fill="#C9A24A" {...o(2.5)} />
    </g>
  );
};

/** Debug overlay: a ring on every grip target, a dot on the hand, the distance in px. */
export const GripDebug: React.FC<{items: {label: string; hand: Pt; grip: Pt}[]}> = ({items}) => (
  <g>
    {items.map((it, i) => {
      const d = Math.hypot(it.hand.x - it.grip.x, it.hand.y - it.grip.y);
      const ok = d <= 3;
      return (
        <g key={i}>
          <circle cx={it.grip.x} cy={it.grip.y} r={9} fill="none" stroke={ok ? '#18C060' : '#FF3030'} strokeWidth={3} />
          <circle cx={it.hand.x} cy={it.hand.y} r={3} fill="#FF00C8" />
          <text x={it.grip.x + 12} y={it.grip.y - 10 - (i % 2) * 22} fontFamily={FONT.sans} fontWeight={800} fontSize={20} fill={ok ? '#18C060' : '#FF3030'} stroke="#000" strokeWidth={4} paintOrder="stroke">
            {it.label} {d.toFixed(1)} px
          </text>
        </g>
      );
    })}
  </g>
);
