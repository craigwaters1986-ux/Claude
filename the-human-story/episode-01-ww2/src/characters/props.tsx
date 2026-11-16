// Small hand props for the character library (pen, papers, rifles, blanket, bread,
// bricks, binoculars) plus the free-flying paper used after a hand release (A-20).
// All are drawn in LOCAL figure space (use them inside overlay/overlayFront/overlayTop
// or holdR/holdL) unless stated otherwise.  Flat colours, ink outlines, no filters.
import React from 'react';
import {C} from '../styles/theme';
import {hash} from '../animations/core';
import type {Pt} from './skeleton';

const ink = C.ink;

/** Pen held in a fist at (x, y); the nib points down-forward onto the paper. */
export const Pen: React.FC<{x: number; y: number; angle?: number}> = ({x, y, angle = 25}) => (
  <g transform={`translate(${x},${y}) rotate(${angle})`}>
    <line x1={0} y1={-14} x2={0} y2={14} stroke={ink} strokeWidth={4.5} strokeLinecap="round" />
    <line x1={0} y1={14} x2={0} y2={19} stroke={C.gold} strokeWidth={2.5} strokeLinecap="round" />
  </g>
);

/** A flat document lying on a table top (world or local coords; y = table top). */
export const DocumentOnTable: React.FC<{x: number; y: number; w?: number; signed?: number}> = ({x, y, w = 70, signed = 0}) => (
  <g transform={`translate(${x},${y})`}>
    <path d={`M${-w / 2},0 L${w / 2},0 L${w / 2 - 8},-9 L${-w / 2 + 8},-9Z`} fill={C.paper} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
    {signed > 0 && <path d={`M${-w / 4},-4 q6,-5 10,0 t10,0 t10,0`} fill="none" stroke={ink} strokeWidth={1.6} strokeDasharray={`${signed * 40} 60`} />}
  </g>
);

/** A sheet of paper for holdR/holdL (hand space: x along the forearm). */
export const PaperSheet: React.FC<{flutter?: number}> = ({flutter = 0}) => (
  <g transform={`rotate(${-25 + flutter})`}>
    <path d={`M-2,-4 L34,-10 Q38,4 36,22 L2,28 Q-2,12 -2,-4Z`} fill={C.paper} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
    <line x1={6} y1={6} x2={28} y2={2} stroke="#9A9180" strokeWidth={2} />
    <line x1={6} y1={13} x2={28} y2={9} stroke="#9A9180" strokeWidth={2} />
  </g>
);

/**
 * WORLD-space paper that has left the hand: it tumbles away on the wind.
 * Get (x0, y0) from handWorld(...) at the release frame; `start` = release frame.
 */
export const FlyingPaper: React.FC<{f: number; start: number; x0: number; y0: number; wind?: [number, number]; scale?: number; seed?: number}> = ({f, start, x0, y0, wind = [9, -5], scale = 1, seed = 3}) => {
  const t = Math.max(0, f - start);
  const gust = Math.min(1, t / 12);
  const x = x0 + wind[0] * t * gust + Math.sin(t / 7 + seed) * 18;
  const y = y0 + wind[1] * t * gust + Math.sin(t / 5 + seed * 2) * 14 + 0.004 * t * t;
  const rot = t * (6 + hash(seed) * 4) + Math.sin(t / 4) * 30;
  const squash = Math.cos(t / 6 + seed); // tumbling: flips edge-on and back
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale * (0.25 + 0.75 * Math.abs(squash))},${scale})`}>
      <path d="M-18,-22 L18,-22 L18,22 L-18,22Z" fill={C.paper} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
      <line x1={-10} y1={-8} x2={10} y2={-8} stroke="#9A9180" strokeWidth={2} />
      <line x1={-10} y1={0} x2={10} y2={0} stroke="#9A9180" strokeWidth={2} />
    </g>
  );
};

const rifleBody = (len: number) => (
  <g>
    <path d={`M${-len * 0.5},-3 L${len * 0.22},-3 L${len * 0.22},3 L${-len * 0.32},4 L${-len * 0.5},9 Z`} fill="#5A3E2A" stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
    <rect x={len * 0.18} y={-2.5} width={len * 0.32} height={4} fill={ink} />
  </g>
);

/** Rifle spanning two hand points (wading overhead, carried across the body).  Muzzle towards b. */
export const RifleBetween: React.FC<{a: Pt; b: Pt; len?: number}> = ({a, b, len = 120}) => {
  const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  return <g transform={`translate(${(a.x + b.x) / 2},${(a.y + b.y) / 2}) rotate(${ang})`}>{rifleBody(len)}</g>;
};

/** Rifle in the aim: stock at the near hand/shoulder, muzzle forward along the far hand. */
export const RifleAim: React.FC<{stock: Pt; grip: Pt; len?: number}> = ({stock, grip, len = 120}) => {
  const ang = (Math.atan2(grip.y - stock.y, grip.x - stock.x) * 180) / Math.PI;
  return <g transform={`translate(${stock.x},${stock.y}) rotate(${ang}) translate(${len * 0.32},0)`}>{rifleBody(len)}</g>;
};

/** Something held in both hands: drawn centred between them. */
export const HeldItem: React.FC<{a: Pt; b: Pt; kind: 'blanket' | 'bread' | 'brick' | 'bucket' | 'bundle'; color?: string}> = ({a, b, kind, color}) => {
  const x = (a.x + b.x) / 2;
  const y = (a.y + b.y) / 2;
  switch (kind) {
    case 'blanket':
      return (
        <g transform={`translate(${x},${y})`}>
          <path d="M-26,-14 Q0,-20 26,-14 L28,22 Q0,28 -28,22Z" fill={color ?? '#8A6F52'} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
          <path d="M-26,-4 Q0,-9 26,-4 M-27,8 Q0,3 27,8" fill="none" stroke="#6B5440" strokeWidth={2.5} />
        </g>
      );
    case 'bread':
      return <ellipse cx={x} cy={y - 4} rx={22} ry={12} fill={color ?? '#C79A5A'} stroke={ink} strokeWidth={3} />;
    case 'brick':
      return <rect x={x - 16} y={y - 9} width={32} height={16} fill={color ?? '#A4553A'} stroke={ink} strokeWidth={2.5} />;
    case 'bucket':
      return (
        <g transform={`translate(${x},${y})`}>
          <path d="M-8,0 Q0,-14 8,0" fill="none" stroke={ink} strokeWidth={2.5} />
          <path d="M-13,2 L13,2 L10,26 L-10,26Z" fill={color ?? '#8A8C8E'} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
        </g>
      );
    default:
      return <rect x={x - 20} y={y - 14} width={40} height={28} rx={8} fill={color ?? '#B8A27A'} stroke={ink} strokeWidth={3} />;
  }
};

/** Binoculars at the eyes; pass the head centre and radius from the skeleton (sk.head, sk.d.R). */
export const Binoculars: React.FC<{head: Pt; r: number; t?: number}> = ({head, r, t = 1}) => (
  <g transform={`translate(${head.x + r * 0.62 * t + 30 * (1 - t)},${head.y + r * 0.02 + 60 * (1 - t)})`}>
    <rect x={-6} y={-20} width={26} height={16} rx={4} fill="#2E2E2A" stroke={ink} strokeWidth={2.5} />
    <rect x={-6} y={-2} width={26} height={16} rx={4} fill="#2E2E2A" stroke={ink} strokeWidth={2.5} />
    <rect x={18} y={-21} width={6} height={18} rx={2} fill="#555" stroke={ink} strokeWidth={2} />
    <rect x={18} y={-3} width={6} height={18} rx={2} fill="#555" stroke={ink} strokeWidth={2} />
  </g>
);
