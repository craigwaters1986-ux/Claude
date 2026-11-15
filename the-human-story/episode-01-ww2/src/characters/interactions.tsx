// Two-figure interactions (A-13 handshake, A-16 hug / comfort).  The components place
// both figures so hands meet exactly (via arm IK in skeleton.ts); spread presets with
// castProps() or pass head/outfit directly.
import React from 'react';
import {StickFigure, FigureProps} from './StickFigure';
import {handshake, standStiff, stand, pose, Pose} from './poses';
import {reach, solveSkeleton, toLocal, toWorld} from './skeleton';

type Who = Omit<FigureProps, 'x' | 'y' | 'f' | 'pose' | 'dir' | 'scale'> & {pose?: Pose};

// ---- A-13 handshake ----------------------------------------------------------
export type HandshakeProps = {
  f: number;
  x: number; // centre between the two figures
  y: number; // ground line
  scale?: number;
  start: number; // frame the reach starts
  duration?: number; // whole reach-shake-release (default 54 frames = stiff and formal)
  gap?: number; // distance between the figures (local px, default 150)
  a: Who; // left figure, faces right
  b: Who; // right figure, faces left
};

export const Handshake: React.FC<HandshakeProps> = ({f, x, y, scale = 1, start, duration = 54, gap = 150, a, b}) => {
  const t = Math.max(0, Math.min(1, (f - start) / duration));
  const reachX = gap / 2; // hands meet in the middle
  const pA = handshake(f, t, reachX, 1);
  const pB = handshake(f, t, reachX, 2);
  const half = (gap / 2) * scale;
  return (
    <g>
      <StickFigure turn={0.6} {...b} x={x + half} y={y} f={f} scale={scale} dir={-1} pose={b.pose ?? pB} seed={b.seed ?? 22} />
      <StickFigure turn={0.6} {...a} x={x - half} y={y} f={f} scale={scale} dir={1} pose={a.pose ?? pA} seed={a.seed ?? 21} />
    </g>
  );
};

// ---- A-16 hug / comfort --------------------------------------------------------
export type HugProps = {
  f: number;
  x: number; // centre
  y: number; // ground line
  scale?: number;
  kind?: 'comfort' | 'embrace'; // comfort = side by side, arm round the shoulders; embrace = face to face
  sway?: number; // degrees of gentle sway (default 1.5)
  adult: Who; // the comforter (drawn in front)
  other: Who; // adult or child (set other.child = true)
  start?: number; // frame the arm goes round (default: already in place)
};

export const Hug: React.FC<HugProps> = ({f, x, y, scale = 1, kind = 'comfort', sway = 1.5, adult, other, start}) => {
  const k = start === undefined ? 1 : Math.max(0, Math.min(1, (f - start) / 18));
  const rot = Math.sin(f / 26) * sway;
  const childOther = !!other.child;
  if (kind === 'comfort') {
    // adult on the left facing right (towards the other), turned to camera; other on the right
    const gap = childOther ? 64 : 78;
    const plA = {x: x - (gap / 2) * scale, y, scale, dir: 1 as const};
    const plB = {x: x + (gap / 2) * scale, y, scale, dir: -1 as const};
    const pOther: Pose = other.pose ?? {...stand(f, 5), headTilt: childOther ? -8 : 6, lean: childOther ? -3 : -4};
    const skB = solveSkeleton(pOther, childOther);
    // target: the other's far shoulder, slightly beyond
    const target = toLocal(plA, toWorld(plB, {x: skB.sh.x - 14, y: skB.sh.y + 4}));
    const baseA: Pose = adult.pose ?? {...standStiff(f, 3), lean: 6, headTilt: 10};
    const hugA = reach(baseA, 'R', target, !!adult.child, false);
    const pA: Pose = {...baseA, shR: baseA.shR + (hugA.shR - baseA.shR) * k, elR: baseA.elR + (hugA.elR - baseA.elR) * k};
    return (
      <g transform={`rotate(${rot},${x},${y})`}>
        <StickFigure turn={-0.25} {...other} x={plB.x} y={y} f={f} scale={scale} dir={-1} pose={pOther} seed={other.seed ?? 32} />
        <StickFigure turn={-0.2} {...adult} x={plA.x} y={y} f={f} scale={scale} dir={1} pose={pA} seed={adult.seed ?? 31} />
      </g>
    );
  }
  // embrace: face to face, both lean in, arms round each other's backs
  const gap = childOther ? 60 : 70;
  const plA = {x: x - (gap / 2) * scale, y, scale, dir: 1 as const};
  const plB = {x: x + (gap / 2) * scale, y, scale, dir: -1 as const};
  const baseB: Pose = other.pose ?? pose({lean: childOther ? 4 : 8, hipL: -3, hipR: 3, shL: 60, elL: 50, shR: 70, elR: 60, headTilt: childOther ? -10 : 8});
  const skB = solveSkeleton(baseB, childOther);
  const baseA: Pose = adult.pose ?? pose({lean: childOther ? 16 : 8, hipL: -3, hipR: 3, kneeL: childOther ? 10 : 0, kneeR: childOther ? 10 : 0, shL: 60, elL: 60, shR: 60, elR: 60, headTilt: 12});
  const back = toLocal(plA, toWorld(plB, {x: skB.sh.x - 26, y: skB.sh.y + (childOther ? 14 : 10)}));
  let pA = reach(baseA, 'R', back, !!adult.child, false);
  pA = {...baseA, shR: baseA.shR + (pA.shR - baseA.shR) * k, elR: baseA.elR + (pA.elR - baseA.elR) * k};
  return (
    <g transform={`rotate(${rot},${x},${y})`}>
      <StickFigure turn={0.3} {...other} x={plB.x} y={y} f={f} scale={scale} dir={-1} pose={baseB} seed={other.seed ?? 32} />
      <StickFigure turn={0.5} {...adult} x={plA.x} y={y} f={f} scale={scale} dir={1} pose={pA} seed={adult.seed ?? 31} />
    </g>
  );
};
