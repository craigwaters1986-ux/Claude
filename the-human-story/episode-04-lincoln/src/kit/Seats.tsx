// Episode 4 seats. Every seat exports its seat-top height; `seatPose` puts the hip exactly on the seat
// top and solves the knee so the feet land on the floor line (no floating, no seat-less sitting).
// `sitDown` / `standUp` animate the transfer with a forward weight shift over 24 frames.
import React from 'react';
import {C} from '../styles/theme';
import {Pose, pose, mixPose} from '../characters/poses';
import {Build, dimsOf, Placement, solveSkeleton, toWorld} from '../characters/skeleton';
import {clamp, easeInOut, noise1} from '../animations/core';

const ink = C.ink;
const o = (w = 4) => ({stroke: ink, strokeWidth: w, strokeLinejoin: 'round' as const});

/** Natural seat height (world px above the floor) for a figure of this build and scale: thighs level. */
export const seatHeight = (build: Build, scale = 1) => dimsOf(build).L * 0.53 * scale;

/** Seated pose with the hip on a seat `h` world px above the floor (pl.y). Feet stay on the floor. */
export function seatPose(pl: Placement, h: number, build: Build, f = 0, seed = 0, extra: Partial<Pose> = {}): Pose {
  const s = pl.scale ?? 1;
  const L = dimsOf(build).L;
  const hl = h / s; // seat height in local units
  const bob = L - hl;
  // thigh angle: level (86°) unless overridden; the knee comes from the foot-on-floor condition for each leg
  const hipA = extra.hipR ?? 86;
  const kneeFor = (ha: number) => {
    const c = clamp((hl - 0.52 * L * Math.cos((ha * Math.PI) / 180)) / (0.5 * L), -1, 1);
    return ha - (Math.acos(c) * 180) / Math.PI; // shin angle from vertical, forward positive
  };
  const k = kneeFor(hipA);
  const kL = kneeFor(hipA - 4);
  return pose({
    lean: 2 + noise1(f / 80, seed) * 1.5,
    hipL: hipA - 4, kneeL: kL, hipR: hipA, kneeR: k,
    shL: 20, elL: 50, shR: 26, elR: 55,
    bob,
    headTilt: noise1(f / 60, seed + 9) * 3,
    ...extra,
  });
}

/** World y of the hip for a pose (to check hip-on-seat). */
export const hipWorldY = (pl: Placement, P: Pose, build: Build) => toWorld(pl, solveSkeleton(P, build).hip).y;
/** World foot points (both feet). */
export function feetWorld(pl: Placement, P: Pose, build: Build) {
  const sk = solveSkeleton(P, build);
  return [toWorld(pl, {x: sk.legL.fx, y: sk.legL.fy}), toWorld(pl, {x: sk.legR.fx, y: sk.legR.fy})];
}

/** Sit-down transfer: stand -> lean forward and bend -> lower onto the seat -> settle back. u 0..1 over ~24 frames. */
export function sitDown(standP: Pose, seatP: Pose, u: number): Pose {
  const t = easeInOut(clamp(u));
  const P = mixPose(standP, seatP, t);
  // weight shift: lean forward as the hips go back and down, then settle upright
  return {...P, lean: P.lean + 18 * Math.sin(Math.PI * t), headTilt: P.headTilt + 6 * Math.sin(Math.PI * t)};
}
export const standUp = (seatP: Pose, standP: Pose, u: number) => sitDown(standP, seatP, 1 - u);

// ---------------------------------------------------------------- seat drawings (x = seat centre, floor = floor line)

export const Chair: React.FC<{x: number; floor: number; h: number; dir?: 1 | -1; color?: string; back?: boolean}> = ({x, floor, h, dir = 1, color = '#6B4A30', back = true}) => {
  const top = floor - h;
  const bx = x - dir * 30;
  return (
    <g>
      {back && <path d={`M${bx},${top} L${bx - dir * 6},${top - 92} M${bx - dir * 6},${top - 90} L${bx + dir * 4},${top - 90}`} stroke={ink} strokeWidth={11} strokeLinecap="round" />}
      {back && <path d={`M${bx},${top} L${bx - dir * 6},${top - 92}`} stroke={color} strokeWidth={6} strokeLinecap="round" />}
      <path d={`M${x - 30},${top + 6} L${x - 26},${floor} M${x + 30},${top + 6} L${x + 26},${floor}`} stroke={ink} strokeWidth={8} strokeLinecap="round" />
      <path d={`M${x - 30},${top + 6} L${x - 26},${floor} M${x + 30},${top + 6} L${x + 26},${floor}`} stroke={color} strokeWidth={4} strokeLinecap="round" />
      <rect x={x - 38} y={top - 2} width={76} height={10} rx={3} fill={color} {...o(3.5)} />
    </g>
  );
};

export const Stool: React.FC<{x: number; floor: number; h: number; color?: string}> = ({x, floor, h, color = '#7A5A3A'}) => {
  const top = floor - h;
  return (
    <g>
      <path d={`M${x - 20},${top + 6} L${x - 28},${floor} M${x + 20},${top + 6} L${x + 28},${floor} M${x},${top + 6} L${x},${floor}`} stroke={ink} strokeWidth={8} strokeLinecap="round" />
      <path d={`M${x - 20},${top + 6} L${x - 28},${floor} M${x + 20},${top + 6} L${x + 28},${floor} M${x},${top + 6} L${x},${floor}`} stroke={color} strokeWidth={4} strokeLinecap="round" />
      <ellipse cx={x} cy={top + 3} rx={32} ry={8} fill={color} {...o(3.5)} />
    </g>
  );
};

export const Bench: React.FC<{x: number; floor: number; h: number; w?: number; color?: string}> = ({x, floor, h, w = 260, color = '#6B4A30'}) => {
  const top = floor - h;
  return (
    <g>
      {[-1, 1].map((k) => <rect key={k} x={x + k * (w / 2 - 22) - 5} y={top + 6} width={10} height={h - 6} fill={color} {...o(3)} />)}
      <rect x={x - w / 2} y={top - 2} width={w} height={12} rx={3} fill={color} {...o(3.5)} />
    </g>
  );
};

/** Writing desk seen side-on; returns nothing but exports its top height for props. */
export const DESK_H = 96;
export const WritingDesk: React.FC<{x: number; floor: number; w?: number; h?: number; color?: string}> = ({x, floor, w = 300, h = DESK_H, color = '#5E4230'}) => (
  <g>
    <rect x={x - w / 2 + 10} y={floor - h + 10} width={14} height={h - 10} fill={color} {...o(3.5)} />
    <rect x={x + w / 2 - 24} y={floor - h + 10} width={14} height={h - 10} fill={color} {...o(3.5)} />
    <rect x={x - w / 2 + 24} y={floor - h + 12} width={w - 48} height={30} fill={color} opacity={0.85} {...o(3)} />
    <rect x={x - w / 2} y={floor - h} width={w} height={14} rx={3} fill={color} {...o(4)} />
  </g>
);

/** Debug markers: hip vs seat top, feet vs floor. */
export const SeatDebug: React.FC<{hipY: number; seatY: number; x: number; feet: {x: number; y: number}[]; floor: number}> = ({hipY, seatY, x, feet, floor}) => {
  const d = Math.abs(hipY - seatY);
  const fd = Math.max(...feet.map((p) => Math.abs(p.y - floor)));
  const ok = d <= 3 && fd <= 3;
  return (
    <g>
      <line x1={x - 50} y1={seatY} x2={x + 50} y2={seatY} stroke="#18C0FF" strokeWidth={2} />
      <circle cx={x} cy={hipY} r={5} fill="#FF00C8" />
      {feet.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4} fill="#FFD000" />)}
      <text x={x + 56} y={seatY + 6} fontFamily="Montserrat" fontWeight={800} fontSize={18} fill={ok ? '#18C060' : '#FF3030'} stroke="#000" strokeWidth={4} paintOrder="stroke">
        hip {d.toFixed(1)} px · feet {fd.toFixed(1)} px
      </text>
    </g>
  );
};
