// Episode 4 frame-timed, reusable actions. Pure functions (no React) so the contact checker
// (scripts/check-contacts.mjs) can evaluate every frame in Node.
// Each returns the figure pose, the prop transforms it drives, and the contacts (hand -> grip target)
// that the debug overlay and the checker measure. Timing follows the series motion rules: a held pose
// of at least 8 frames before a key action, anticipation, a fast eased action, follow-through, settle.
import {Pose, pose, mixPose, stand} from '../characters/poses';
import {Build, Placement, Pt, solveSkeleton, toWorld, headWorld} from '../characters/skeleton';
import {clamp, easeIn, easeInOut, easeOut, lerp, noise1} from '../animations/core';
import {AXE, BOOK, QUILL, gripWorld, handsOn, PropXf, approach, STOVEPIPE} from './Props';

export type Contact = {label: string; side: 'L' | 'R'; target: Pt};
export type ActionOut = {P: Pose; props: Record<string, PropXf & {open?: number; page?: number}>; contacts: Contact[]; events?: Record<string, number>};

const R2D = 180 / Math.PI;
const D2R = Math.PI / 180;

/** Local (figure-space) prop transform -> world transform, honouring dir mirroring and scale. */
export function localXf(pl: Placement, p: Pt, rotLocal: number, s = 1): PropXf {
  const w = toWorld(pl, p);
  const dir = pl.dir ?? 1;
  return dir === 1 ? {x: w.x, y: w.y, rot: rotLocal, s: (pl.scale ?? 1) * s} : {x: w.x, y: w.y, rot: -rotLocal, flip: true, s: (pl.scale ?? 1) * s};
}

/** Keyframed prop track: [frame, xf] pairs, eased between keys. */
export function track(f: number, keys: [number, PropXf][], ease: (t: number) => number = easeInOut): PropXf {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, a] = keys[i];
    const [f1, b] = keys[i + 1];
    if (f <= f1) {
      const t = ease(clamp((f - f0) / Math.max(1, f1 - f0)));
      return {x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), rot: lerp(a.rot ?? 0, b.rot ?? 0, t), s: lerp(a.s ?? 1, b.s ?? 1, t), flip: b.flip};
    }
  }
  return keys[keys.length - 1][1];
}

// ------------------------------------------------------------------ chopRail
/** Axe chop cycle. Returns the axe transform; `events.impact` = frame of each impact within the cycle. */
export const CHOP_CYCLE = 50;
export function chopRail(f: number, pl: Placement, build?: Build, start = 0, cycle = CHOP_CYCLE): ActionOut {
  const g = Math.max(0, f - start);
  const c = g % cycle;
  // keys (cycle frames): 0 ready · 14 raised · 24 still raised (hold ≥ 8 f) · 31 impact · 36 follow-through · 50 ready
  const keys: [number, number, number, number, number][] = [
    // frame, arc angle (deg, 0 = forward horizontal, - = up), lean, knee, bob
    [0, 12, 6, 12, 2],
    [14, -128, -7, 6, -2],
    [24, -134, -8, 6, -3],
    [31, 40, 16, 26, 7],
    [36, 46, 18, 28, 8],
    [50, 12, 6, 12, 2],
  ];
  let i = 0;
  while (i < keys.length - 2 && c > keys[i + 1][0]) i++;
  const [f0, a0, l0, k0, b0] = keys[i];
  const [f1, a1, l1, k1, b1] = keys[i + 1];
  const strike = i === 2;
  const t = (strike ? easeIn : easeInOut)(clamp((c - f0) / (f1 - f0)));
  const a = lerp(a0, a1, t);
  const base = pose({lean: lerp(l0, l1, t), hipL: -16, kneeL: lerp(k0, k1, t), hipR: 18, kneeR: lerp(k0, k1, t) * 0.8, bob: lerp(b0, b1, t), headTilt: lerp(l0, l1, t) * 0.6, shL: 30, elL: 30, shR: 30, elR: 30});
  const sk = solveSkeleton(base, build);
  const r = 44;
  const hl = {x: sk.sh.x + Math.cos(a * D2R) * r, y: sk.sh.y + Math.sin(a * D2R) * r};
  const rotLocal = a + 10;
  const axe = localXf(pl, hl, rotLocal);
  const gR = gripWorld(axe, AXE.grips.handle!);
  const gL = gripWorld(axe, AXE.grips.grip2!);
  const P = handsOn(pl, base, {R: gR, L: gL}, build);
  const impactCycleFrame = 31;
  const n = Math.floor(g / cycle);
  return {P, props: {axe}, contacts: [{label: 'R axe', side: 'R', target: gR}, {label: 'L axe', side: 'L', target: gL}], events: {impact: f >= start ? start + n * cycle + impactCycleFrame : -999}};
}
/** World point the axe head strikes (place the log here). */
export function chopImpactPoint(pl: Placement, build?: Build): Pt {
  const out = chopRail(31, pl, build, 0);
  return gripWorld(out.props.axe, {x: 112, y: 6});
}

// ------------------------------------------------------------------ grab / carry / put down (generic)
/** A prop that rests at `rest` until `grab`, travels along `keys` while held, and is set down at `release`.
 *  The hands approach for `ap` frames before `grab` and leave for `ap` frames after `release`. */
export function grabCarry(
  f: number, pl: Placement, base: Pose, free: Pose, def: {grips: {handle?: Pt; grip2?: Pt}}, keys: [number, PropXf][], grab: number, release: number,
  hands: 'R' | 'L' | 'both' = 'both', build?: Build, ap = 12, label = 'prop',
): ActionOut {
  const xf = track(f, keys);
  const gR = gripWorld(xf, def.grips.handle!);
  const gL = def.grips.grip2 ? gripWorld(xf, def.grips.grip2) : gR;
  const tgt = hands === 'both' ? {R: gR, L: gL} : hands === 'R' ? {R: gR} : {L: gR};
  const gripP = handsOn(pl, base, tgt, build);
  let u = 1;
  if (f < grab) u = clamp(1 - (grab - f) / ap);
  else if (f > release) u = clamp(1 - (f - release) / ap);
  const P = approach(free, gripP, u);
  const held = f >= grab && f <= release;
  const contacts: Contact[] = held ? (hands === 'both' ? [{label: 'R ' + label, side: 'R', target: gR}, {label: 'L ' + label, side: 'L', target: gL}] : [{label: hands + ' ' + label, side: hands, target: gR}]) : [];
  return {P, props: {[label]: xf}, contacts};
}

// ------------------------------------------------------------------ reading
/** Page-turn state for an open book: a leaf turns over 14 frames every `every` frames from `start`. */
export function pageTurn(f: number, start: number, every = 54) {
  if (f < start) return 0;
  const c = (f - start) % every;
  return c < 14 ? easeInOut(c / 14) : 0;
}

// ------------------------------------------------------------------ writing
/** Quill on a nib point (world). The hand holds the quill's grip; the quill angle wobbles with the strokes. */
export function writeAt(f: number, pl: Placement, base: Pose, nib: Pt, build?: Build, writing = true): ActionOut {
  const wob = writing ? Math.sin(f * 1.7) * 4 : 0;
  const quill: PropXf = {x: nib.x, y: nib.y, rot: wob + (pl.dir === -1 ? 180 : 0), s: (pl.scale ?? 1) * 0.9, flip: pl.dir === -1};
  const g = gripWorld(quill, QUILL.grips.handle!);
  const P = handsOn(pl, base, {R: g}, build);
  return {P, props: {quill}, contacts: [{label: 'R quill', side: 'R', target: g}]};
}
/** Nib position along a line being written: x advances with the revealed text; y makes small letter strokes. */
export const nibPath = (x0: number, baseY: number, width: number, u: number, f: number): Pt => ({
  x: x0 + width * clamp(u) + Math.sin(f * 2.3) * 2.5,
  y: baseY - 10 - Math.abs(Math.sin(f * 1.15)) * 14,
});

// ------------------------------------------------------------------ handshake
/** Two figures shake near hands at a meeting point; pumps 3 times. Returns both poses. */
export function shakeHands(f: number, plA: Placement, baseA: Pose, plB: Placement, baseB: Pose, meet: Pt, start: number, buildA?: Build, buildB?: Build, ap = 14) {
  const g = f - start;
  const pump = g > 0 && g < 54 ? Math.sin((g / 18) * Math.PI * 2) * 9 * (1 - g / 60) : 0;
  const m = {x: meet.x, y: meet.y + pump};
  const PA = handsOn(plA, baseA, {R: m}, buildA);
  const PB = handsOn(plB, baseB, {R: m}, buildB);
  const u = clamp((f - (start - ap)) / ap);
  return {
    PA: approach(baseA, PA, u),
    PB: approach(baseB, PB, u),
    contacts: g >= 0 ? [{label: 'A hand', side: 'R' as const, target: m}, {label: 'B hand', side: 'R' as const, target: m}] : [],
    meet: m,
  };
}

// ------------------------------------------------------------------ doff hat
/** Lifts the stovepipe off the head with the near hand and brings it to the chest. The head is drawn
 *  without its hat from `grab`. Returns the hat transform while in hand. */
export function doffHat(f: number, pl: Placement, base: Pose, grab: number, build?: Build): ActionOut & {onHead: boolean} {
  const hw = headWorld(pl, base, build);
  const s = pl.scale ?? 1;
  const dir = pl.dir ?? 1;
  const onHeadXf: PropXf = {x: hw.x, y: hw.y - hw.r * 0.66, rot: 0, s};
  const chest = toWorld(pl, {x: 26, y: solveSkeleton(base, build).sh.y + 30});
  const chestXf: PropXf = {x: chest.x + 10 * dir * s, y: chest.y - 10 * s, rot: dir * -70, s};
  const lift: PropXf = {x: onHeadXf.x + 6 * dir * s, y: onHeadXf.y - 26 * s, rot: dir * -10, s};
  const keys: [number, PropXf][] = [[grab, onHeadXf], [grab + 9, lift], [grab + 26, chestXf]];
  const out = grabCarry(f, pl, base, base, {grips: {handle: {x: 34 * dir, y: 0}}}, keys, grab, 1e9, 'R', build, 10, 'hat');
  return {...out, onHead: f < grab};
}

// ------------------------------------------------------------------ expression timeline
export type ExprKey = [number, string];
/** Expression at frame f from a timeline; blends over `blend` frames (eyes lead: pass `exprT` to Head). */
export function exprAt(f: number, keys: ExprKey[], blend = 7): {expression: string; exprFrom?: string; exprT?: number} {
  let i = 0;
  while (i < keys.length - 1 && f >= keys[i + 1][0]) i++;
  const cur = keys[i];
  const prev = i > 0 ? keys[i - 1] : undefined;
  if (prev && f - cur[0] < blend) return {expression: cur[1], exprFrom: prev[1], exprT: (f - cur[0]) / blend};
  return {expression: cur[1]};
}
/** Irregular blink: true on blink frames (every 2–5 s) plus a deliberate blink at each `reactions` frame. */
export function blinkAt(f: number, seed = 1, reactions: number[] = []): boolean {
  if (reactions.some((r) => f >= r && f < r + 5)) return true;
  let t = 0;
  let k = 0;
  while (t <= f) {
    const gap = 60 + Math.floor((noise1(k * 1.37, seed) * 0.5 + 0.5) * 90);
    if (f >= t && f < t + 5) return true;
    t += gap;
    k++;
  }
  return false;
}

export {stand, mixPose, BOOK, STOVEPIPE};
