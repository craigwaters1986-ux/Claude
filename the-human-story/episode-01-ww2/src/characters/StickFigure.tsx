// Reusable skeletal stick figure in the channel's reference style:
// thin black limbs, big round white head, thick ink outlines, flat colours.
import React from 'react';
import {C, FONT} from '../styles/theme';
import {Head, HeadSpec, HatShape} from './Head';
import {Pose, ZERO} from './poses';
import {boil} from '../animations/core';
import {solveSkeleton, Skeleton} from './skeleton';

export type Outfit = {
  kind: 'none' | 'coat' | 'longcoat' | 'tunic' | 'suit' | 'dress' | 'shirt' | 'stripes' | 'overalls' | 'sailor' | 'morningcoat'
    // all-period additions: toga (draped sash in `accent`), robe (rope belt in `accent`), gown (fitted waist, long skirt), hoodie
    | 'toga' | 'robe' | 'gown' | 'hoodie';
  color?: string;
  accent?: string; // tie / belt / collar colour
  bowtie?: boolean;
  medals?: boolean;
  armband?: string; // plain armband colour (never an emblem)
  armbandCross?: boolean; // white armband with a red cross (medics)
  puttees?: string; // wrapped lower legs (Japanese, Chinese, British/Commonwealth infantry)
  harness?: string; // parachute harness straps over the tunic
  lifeVest?: string; // aircrew life vest (RAF yellow)
  shoulderBoards?: string; // plain shoulder boards, no insignia
  apron?: string; // nurse's apron (usually white)
};

export type HatInHand = {side?: 'L' | 'R'; rot?: number; dx?: number; dy?: number};

export type FigureProps = {
  x: number;
  y: number; // ground line
  scale?: number;
  dir?: 1 | -1;
  pose?: Pose;
  f: number;
  seed?: number;
  head?: HeadSpec;
  outfit?: Outfit;
  child?: boolean;
  turn?: number;
  look?: [number, number];
  talking?: boolean;
  angerMark?: boolean;
  sweat?: boolean;
  tear?: boolean;
  label?: string;
  sublabel?: string;
  labelSide?: 'top' | 'right' | 'left';
  holdR?: React.ReactNode; // drawn in right-hand space (x along forearm)
  holdL?: React.ReactNode;
  back?: React.ReactNode; // e.g. rifle on back (torso space)
  opacity?: number;
  limbColor?: string;
  shadow?: boolean;
  thin?: number; // limb width multiplier
  // --- ep01 additions ---
  eyesClosed?: boolean;
  fromBehind?: boolean; // figure seen from behind (rally crowds): no face, no front garment details
  lod?: 'full' | 'low'; // low = crowd level of detail (no boil, simpler face and garment)
  hatInHand?: HatInHand; // the head's hat is drawn in a hand instead (helmet to chest, Kaiser's pickelhaube)
  cutBelow?: number; // world y: everything below is hidden (wading figures at a waterline)
  overlay?: (sk: Skeleton) => React.ReactNode; // props drawn in local figure space, between far and near arm
  overlayFront?: (sk: Skeleton) => React.ReactNode; // props drawn in local figure space over the body (under the head)
  overlayTop?: (sk: Skeleton) => React.ReactNode; // props drawn over everything incl. the head (binoculars)
  nearArmFront?: boolean; // draw the near arm OVER the head (hand to the face: binoculars, salute, wiping eyes)
  part?: 'all' | 'body' | 'head'; // layered two-figure shots: draw body and head in separate passes
};


// circle / ellipse as path sub-commands (lets the crowd LOD merge several shapes into one element)
const blob = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx},${cy}a${rx},${ry} 0 1,0 ${rx * 2},0a${rx},${ry} 0 1,0 ${-rx * 2},0`;
const dot = (cx: number, cy: number, r: number) => blob(cx, cy, r, r);

export const StickFigure: React.FC<FigureProps> = (p) => {
  const s = p.scale ?? 1;
  const dir = p.dir ?? 1;
  const P = p.pose ?? ZERO;
  const seed = p.seed ?? 1;
  const child = !!p.child;
  const lod = p.lod ?? 'full';
  const sk = solveSkeleton(P, child);
  const {T, R} = sk.d;
  const limbW = (child ? 6.5 : 7.5) * (p.thin ?? 1);
  const col = p.limbColor ?? C.ink;
  const w = lod === 'low' ? (_n: number) => 0 : (n: number) => boil(p.f, seed * 31 + n, 0.6); // hand-drawn boil
  const {hip, sh} = sk;
  const lL = sk.legL;
  const lR = sk.legR;
  const aL = sk.armL;
  const aR = sk.armR;
  const headC = sk.head;

  const limb = (pts: number[], key: string) => (
    <polyline key={key} points={pts.join(',')} fill="none" stroke={col} strokeWidth={limbW} strokeLinecap="round" strokeLinejoin="round" />
  );
  const foot = (fx: number, fy: number, key: string) => (
    <ellipse key={key} cx={fx + 7} cy={fy - 2} rx={child ? 10 : 13} ry={child ? 6 : 7} fill={col} />
  );
  const hand = (hx: number, hy: number, key: string) => <circle key={key} cx={hx} cy={hy} r={child ? 5.5 : 6.5} fill={col} />;
  const puttee = (lg: {kx: number; ky: number; fx: number; fy: number}, key: string) => {
    if (!p.outfit?.puttees) return null;
    const x1 = lg.kx + (lg.fx - lg.kx) * 0.3;
    const y1 = lg.ky + (lg.fy - lg.ky) * 0.3;
    const x2 = lg.kx + (lg.fx - lg.kx) * 0.9;
    const y2 = lg.ky + (lg.fy - lg.ky) * 0.9;
    return (
      <g key={key}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.ink} strokeWidth={limbW + 7} strokeLinecap="round" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={p.outfit.puttees} strokeWidth={limbW + 2} strokeLinecap="round" />
      </g>
    );
  };

  // ---- garment (torso space: origin at hip, y up negative) ----
  const o = p.outfit ?? {kind: 'none'};
  let garment: React.ReactNode = null;
  const front = !p.fromBehind;
  let lapLen = 0;
  const detail = lod !== 'low';
  if (o.kind !== 'none') {
    const c = o.color ?? C.khaki;
    const top = -T * 0.95;
    const shW = child ? 16 : 22;
    const hipW = child ? 15 : 19;
    let bottom = 14;
    let botW = hipW;
    if (o.kind === 'coat' || o.kind === 'sailor') bottom = 26;
    if (o.kind === 'morningcoat') bottom = 16;
    if (o.kind === 'longcoat') { bottom = 62; botW = hipW + 9; }
    if (o.kind === 'dress') { bottom = 52; botW = hipW + 16; }
    if (o.kind === 'tunic') bottom = 22;
    if (o.kind === 'shirt') bottom = 6;
    if (o.kind === 'stripes') { bottom = 30; botW = hipW + 3; }
    if (o.kind === 'toga') { bottom = 70; botW = hipW + 12; }
    if (o.kind === 'robe') { bottom = 76; botW = hipW + 10; }
    if (o.kind === 'gown') { bottom = 96; botW = hipW + 30; }
    if (o.kind === 'hoodie') bottom = 12;
    // seated / kneeling: the skirt of the garment folds onto the thighs instead of hanging through them
    if ((P.hipL + P.hipR) / 2 > 55 && bottom > 10) { lapLen = Math.min(bottom + 20, 60); bottom = 8; botW = hipW; }
    const path = o.kind === 'gown' && lapLen === 0
      ? `M${-shW + 4 + w(1)},${top} Q0,${top - 6} ${shW - 4 + w(2)},${top} L${hipW - 6},${-14} Q${botW * 0.7},${bottom * 0.4} ${botW + w(3)},${bottom} Q0,${bottom + 8} ${-botW + w(4)},${bottom} Q${-botW * 0.7},${bottom * 0.4} ${-hipW + 6},${-14}Z`
      : `M${-shW + w(1)},${top} Q0,${top - 6} ${shW + w(2)},${top} L${botW + w(3)},${bottom} L${-botW + w(4)},${bottom}Z`;
    garment = (
      <g transform={`translate(${hip.x},${hip.y}) rotate(${P.lean})`}>
        {o.kind === 'morningcoat' && (
          <path d={`M${-hipW + 4},${4} L${-hipW - 2 + w(11)},${46} L${-hipW + 10},${44} L${-2},${8}Z`} fill={c} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        )}
        <path d={path} fill={c} stroke={C.ink} strokeWidth={4.5} strokeLinejoin="round" />
        {o.apron && lapLen === 0 && (
          <path d={front ? `M-12,${top + 10} L12,${top + 10} L13,${-2} L${hipW + 6},${bottom - 6} L${-hipW - 6},${bottom - 6} L-13,${-2}Z` : `M${-hipW - 2},-4 L${hipW + 2},-4`} fill={o.apron} stroke={C.ink} strokeWidth={front ? 3 : 4} strokeLinejoin="round" />
        )}
        {o.kind === 'toga' && (
          <path d={`M${shW - 2},${top + 2} L${shW + 3},${top + 12} L${-hipW + 2},${lapLen ? bottom - 2 : 26} L${-hipW - 4},${lapLen ? bottom - 12 : 12}Z`} fill={o.accent ?? C.red} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
        )}
        {o.kind === 'robe' && <path d={`M${-hipW + 1},-8 Q0,-3 ${hipW - 1},-8`} fill="none" stroke={o.accent ?? C.sand} strokeWidth={5} strokeLinecap="round" />}
        {o.kind === 'robe' && detail && front && lapLen === 0 && <line x1={-hipW + 6} y1={-6} x2={-hipW + 3} y2={22} stroke={o.accent ?? C.sand} strokeWidth={4} strokeLinecap="round" />}
        {o.kind === 'gown' && <path d={`M${-hipW + 5},-14 Q0,-10 ${hipW - 5},-14`} fill="none" stroke={o.accent ?? C.ink} strokeWidth={4} strokeLinecap="round" />}
        {o.kind === 'hoodie' && (
          <g>
            <path d={`M${-shW - 2},${top + 2} Q${-shW - 10},${top - 16} ${-shW + 8},${top - 14} L${-4},${top + 2}Z`} fill={o.color ?? C.khaki} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
            {front && detail && <path d={`M${-10},${top + 44} L${12},${top + 44} L${15},${top + 62} L${-13},${top + 62}Z`} fill="none" stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />}
            {front && detail && <path d={`M2,${top + 2} l-2,14 M7,${top + 2} l1,14`} stroke={o.accent ?? C.paper} strokeWidth={2.5} strokeLinecap="round" />}
          </g>
        )}
        {o.kind === 'stripes' && detail && [0, 1, 2, 3].map((i) => <line key={i} x1={-shW + 6 + i * 11} y1={top + 4} x2={-botW + 6 + i * 11.5} y2={bottom - 3} stroke="#4E5A6E" strokeWidth={4} />)}
        {(o.kind === 'tunic' || o.kind === 'longcoat') && <rect x={-hipW - 1} y={-6} width={hipW * 2 + 2} height={7} fill={o.accent ?? C.darkBrown} stroke={C.ink} strokeWidth={2.5} />}
        {(o.kind === 'tunic' || o.kind === 'longcoat' || o.kind === 'coat') && front && detail && !o.harness && [0, 1, 2].map((i) => <circle key={i} cx={2} cy={top + 16 + i * 20} r={2.6} fill={C.ink} />)}
        {(o.kind === 'suit' || o.kind === 'morningcoat') && front && (
          <g>
            <path d={`M-8,${top + 1} L0,${top + 26} L8,${top + 1}Z`} fill={C.paper} stroke={C.ink} strokeWidth={2.5} />
            {o.bowtie ? (
              <path d={`M-9,${top + 2} L0,${top + 7} L9,${top + 2} L9,${top + 12} L0,${top + 7} L-9,${top + 12}Z`} fill={o.accent ?? C.navy} stroke={C.ink} strokeWidth={2} />
            ) : (
              <path d={`M-3,${top + 4} L3,${top + 4} L4,${top + 24} L0,${top + 29} L-4,${top + 24}Z`} fill={o.accent ?? C.red} stroke={C.ink} strokeWidth={2} />
            )}
          </g>
        )}
        {o.kind === 'sailor' && <path d={`M${-shW},${top} L0,${top + 22} L${shW},${top} L${shW - 4},${top + 12} L0,${top + 30} L${-shW + 4},${top + 12}Z`} fill={C.navy} stroke={C.ink} strokeWidth={2} />}
        {o.medals && front && detail && [0, 1, 2].map((i) => <rect key={i} x={-shW + 6 + i * 6} y={top + 14} width={4.5} height={8} fill={[C.red, C.gold, C.allied][i]} />)}
        {o.armband && <rect x={-shW - 2} y={top + 20} width={10} height={9} fill={o.armband} />}
        {o.armbandCross && (
          <g>
            <rect x={-shW - 3} y={top + 18} width={13} height={12} fill={C.paper} stroke={C.ink} strokeWidth={1.5} />
            <rect x={-shW + 2} y={top + 20} width={3} height={8} fill="#C62828" />
            <rect x={-shW - 0.5} y={top + 22.5} width={8} height={3} fill="#C62828" />
          </g>
        )}
        {o.shoulderBoards && <rect x={-shW + 1} y={top - 3} width={14} height={6} rx={2} fill={o.shoulderBoards} stroke={C.ink} strokeWidth={1.5} />}
        {o.harness && (
          <g fill="none" stroke={o.harness} strokeWidth={4.5} strokeLinecap="round">
            <path d={`M${-shW + 6},${top + 1} L${hipW - 4},${-4} M${shW - 6},${top + 1} L${-hipW + 4},${-4}`} />
            <path d={`M${-hipW},${-4} L${hipW},${-4}`} strokeWidth={6} />
            {front && <rect x={-5} y={top + 34} width={10} height={10} fill="#9A9A90" stroke={C.ink} strokeWidth={1.5} />}
          </g>
        )}
        {o.lifeVest && (
          <path d={`M${-shW - 1},${top + 2} Q0,${top - 4} ${shW + 1},${top + 2} L${shW + 2},${top + 34} Q0,${top + 42} ${-shW - 2},${top + 34}Z`} fill={o.lifeVest} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
        )}
      </g>
    );
  }

  let lapEl: React.ReactNode = null;
  if (lapLen > 0) {
    const lg = lR;
    const dx = lg.kx - hip.x;
    const dy = lg.ky - hip.y;
    const len = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, lapLen / len);
    const ex = hip.x + dx * k;
    const ey = hip.y + dy * k;
    const cc = (p.outfit?.apron ?? p.outfit?.color) || C.khaki;
    lapEl = (
      <g>
        <line x1={hip.x - 4} y1={hip.y - 2} x2={ex} y2={ey} stroke={C.ink} strokeWidth={child ? 22 : 27} strokeLinecap="round" />
        <line x1={hip.x - 4} y1={hip.y - 2} x2={ex} y2={ey} stroke={cc} strokeWidth={child ? 15 : 19} strokeLinecap="round" />
      </g>
    );
  }
  const headSpecIn: HeadSpec = p.head ?? {hair: 'spiky'};
  const hih = p.hatInHand;
  const headSpec: HeadSpec = hih ? {...headSpecIn, hat: 'none', chinStrap: false, hatBadge: 'none'} : headSpecIn;
  const hatHeld = (side: 'L' | 'R') => {
    if (!hih || (hih.side ?? 'R') !== side || !headSpecIn.hat || headSpecIn.hat === 'none') return null;
    const a = side === 'R' ? aR : aL;
    return (
      <g transform={`translate(${a.hx + (hih.dx ?? 0)},${a.hy + (hih.dy ?? 0)}) rotate(${hih.rot ?? 70}) translate(0,${R * 0.62}) scale(0.85)`}>
        <HatShape hat={headSpecIn.hat} r={R} color={headSpecIn.hatColor} accent={headSpecIn.hatAccent} badge={headSpecIn.hatBadge} />
      </g>
    );
  };
  const handProp = (a: {hx: number; hy: number; ang: number}, node: React.ReactNode) =>
    node ? <g transform={`translate(${a.hx},${a.hy}) rotate(${90 - a.ang})`}>{node}</g> : null;

  const labelEl = p.label ? (
    <NameTag x={p.x + (p.labelSide === 'right' ? 120 * s : p.labelSide === 'left' ? -120 * s : 0)} y={p.y + (headC.y - R - (headSpecIn.hat && headSpecIn.hat !== 'none' ? 62 : 40)) * s} text={p.label} sub={p.sublabel} />
  ) : null;

  const clipId = `cut${React.useId().replace(/:/g, '')}`;
  const cut = p.cutBelow;
  const part = p.part ?? 'all';
  const headEl = (
    <g transform={`translate(${headC.x},${headC.y}) rotate(${P.headTilt + P.lean * 0.4})`}>
      <Head
        r={R}
        f={p.f}
        seed={seed}
        {...headSpec}
        turn={p.turn ?? 0.35}
        look={p.look}
        talking={p.talking}
        angerMark={p.angerMark}
        sweat={p.sweat}
        tear={p.tear}
        eyesClosed={p.eyesClosed}
        back={p.fromBehind}
        lod={lod}
      />
    </g>
  );
  if (part === 'head') {
    return (
      <g opacity={p.opacity ?? 1}>
        <g transform={`translate(${p.x},${p.y}) scale(${s * dir},${s})`}>{headEl}</g>
        {labelEl}
      </g>
    );
  }

  return (
    <g opacity={p.opacity ?? 1}>
      {cut !== undefined && (
        <defs>
          <clipPath id={clipId}>
            <rect x={p.x - 400 * s} y={p.y - 800 * s} width={800 * s} height={Math.max(0, cut - (p.y - 800 * s))} />
          </clipPath>
        </defs>
      )}
      {p.shadow !== false && cut === undefined && <ellipse cx={p.x} cy={p.y + 4} rx={42 * s} ry={8 * s} fill="rgba(0,0,0,0.16)" />}
      <g clipPath={cut !== undefined ? `url(#${clipId})` : undefined}>
      <g transform={`translate(${p.x},${p.y}) scale(${s * dir},${s})`}>
        {p.back && <g transform={`translate(${hip.x},${hip.y}) rotate(${P.lean})`}>{p.back}</g>}
        {lod === 'low' ? (
          // crowd LOD: far arm, legs and torso in ONE stroked path, hand + feet in ONE filled path
          <g>
            <path d={`M${sh.x},${sh.y}L${aL.ex},${aL.ey}L${aL.hx},${aL.hy}M${hip.x},${hip.y}L${lL.kx},${lL.ky}L${lL.fx},${lL.fy}M${hip.x},${hip.y}L${lR.kx},${lR.ky}L${lR.fx},${lR.fy}M${hip.x},${hip.y}L${sk.neck.x},${sk.neck.y}`} fill="none" stroke={col} strokeWidth={limbW} strokeLinecap="round" strokeLinejoin="round" />
            <path d={`${dot(aL.hx, aL.hy, child ? 5.5 : 6.5)}${blob(lL.fx + 7, lL.fy - 2, child ? 10 : 13, child ? 6 : 7)}${blob(lR.fx + 7, lR.fy - 2, child ? 10 : 13, child ? 6 : 7)}`} fill={col} />
            {handProp(aL, p.holdL)}
            {hatHeld('L')}
          </g>
        ) : (
          <>
            {/* far limbs */}
            {limb([sh.x, sh.y, aL.ex + w(5), aL.ey, aL.hx, aL.hy], 'aL')}
            {hand(aL.hx, aL.hy, 'hL')}
            {handProp(aL, p.holdL)}
            {hatHeld('L')}
            {limb([hip.x, hip.y, lL.kx + w(6), lL.ky, lL.fx, lL.fy], 'lL')}
            {puttee(lL, 'pL')}
            {foot(lL.fx, lL.fy, 'fL')}
            {limb([hip.x, hip.y, lR.kx + w(7), lR.ky, lR.fx, lR.fy], 'lR')}
            {puttee(lR, 'pR')}
            {foot(lR.fx, lR.fy, 'fR')}
            {/* torso */}
            {limb([hip.x, hip.y, sk.neck.x + w(8), sk.neck.y], 'torso')}
          </>
        )}
        {garment}
        {lapEl}
        {p.overlay?.(sk)}
        {/* near arm */}
        {!p.nearArmFront && limb([sh.x, sh.y, aR.ex + w(9), aR.ey, aR.hx, aR.hy], 'aR')}
        {!p.nearArmFront && lod !== 'low' && hand(aR.hx, aR.hy, 'hR')}
        {!p.nearArmFront && lod === 'low' && <path d={dot(aR.hx, aR.hy, child ? 5.5 : 6.5)} fill={col} />}
        {!p.nearArmFront && handProp(aR, p.holdR)}
        {hatHeld('R')}
        {p.overlayFront?.(sk)}
        {part === 'all' && headEl}
        {p.nearArmFront && limb([sh.x, sh.y, aR.ex + w(9), aR.ey, aR.hx, aR.hy], 'aR')}
        {p.nearArmFront && hand(aR.hx, aR.hy, 'hR')}
        {p.nearArmFront && handProp(aR, p.holdR)}
        {p.overlayTop?.(sk)}
      </g>
      </g>
      {part === 'all' && labelEl}
    </g>
  );
};

export const NameTag: React.FC<{x: number; y: number; text: string; sub?: string; opacity?: number}> = ({x, y, text, sub, opacity = 1}) => {
  const w = Math.max(text.length * 17 + 36, (sub?.length ?? 0) * 11.5 + 30);
  const h = sub ? 66 : 44;
  return (
    <g transform={`translate(${x - w / 2},${y - h})`} opacity={opacity}>
      <rect x={4} y={5} width={w} height={h} rx={6} fill="rgba(0,0,0,0.35)" />
      <rect width={w} height={h} rx={6} fill={C.dustyYellow} stroke={C.ink} strokeWidth={3.5} />
      <text x={w / 2} y={30} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={25} fill={C.ink} letterSpacing={0.5}>
        {text}
      </text>
      {sub && (
        <text x={w / 2} y={54} textAnchor="middle" fontFamily={FONT.sans} fontWeight={600} fontSize={18} fill={C.ink}>
          {sub}
        </text>
      )}
      <path d={`M${w / 2 - 10},${h} L${w / 2},${h + 12} L${w / 2 + 10},${h}`} fill={C.dustyYellow} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    </g>
  );
};

/** A-17: neutral grey tag for unnamed groups ("GERMAN DELEGATION", "JAPAN'S LEADERS").
 *  Same geometry as NameTag but grey, so it never reads as a personal (yellow) tag.
 *  `pointer`: draw the little arrow under the tag (default true). */
export const GroupTag: React.FC<{x: number; y: number; text: string; sub?: string; opacity?: number; pointer?: boolean; scale?: number}> = ({x, y, text, sub, opacity = 1, pointer = true, scale = 1}) => {
  const w = Math.max(text.length * 17 + 40, (sub?.length ?? 0) * 11.5 + 30);
  const h = sub ? 66 : 44;
  const fill = '#D4D2CC';
  return (
    <g transform={`translate(${x},${y}) scale(${scale}) translate(${-w / 2},${-h})`} opacity={opacity}>
      <rect x={4} y={5} width={w} height={h} rx={6} fill="rgba(0,0,0,0.3)" />
      <rect width={w} height={h} rx={6} fill={fill} stroke={C.ink} strokeWidth={3.5} />
      <rect x={6} y={6} width={w - 12} height={h - 12} rx={3} fill="none" stroke="#8A8C8E" strokeWidth={1.5} />
      <text x={w / 2} y={30} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={25} fill={C.ink} letterSpacing={1}>
        {text}
      </text>
      {sub && (
        <text x={w / 2} y={54} textAnchor="middle" fontFamily={FONT.sans} fontWeight={600} fontSize={18} fill={C.ink}>
          {sub}
        </text>
      )}
      {pointer && <path d={`M${w / 2 - 10},${h} L${w / 2},${h + 12} L${w / 2 + 10},${h}`} fill={fill} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />}
    </g>
  );
};
