// Editor B helpers for ep02 sections s06–s11 (scene-local props and overlay text only; no library changes).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, W, H, FONT} from '../styles/theme';
import {measureW} from '../components/Text';
import {clamp, prog, easeOut, easeIn, easeInOut, lerp} from '../animations/core';

const ink = C.ink;

/** Overlay label (section-local frames): small rounded panel, fades in/out, never bounces.
 *  tone 'paper' (default) | 'dark' (sombre) | 'yellow' (group labels). */
export const OLabel: React.FC<{at: number; until: number; text: string; x: number; y: number; size?: number; anchor?: 'start' | 'middle' | 'end'; tone?: 'paper' | 'dark' | 'yellow'; sub?: string}> = ({
  at, until, text, x, y, size = 36, anchor = 'middle', tone = 'paper', sub,
}) => {
  const f = useCurrentFrame();
  if (f < at - 1 || f > until + 1) return null;
  return <Label op={prog(f, at, at + 12, easeOut) * (1 - prog(f, until - 12, until, easeIn))} text={text} x={x} y={y} size={size} anchor={anchor} tone={tone} sub={sub} />;
};

/** The same panel with an explicit opacity (for in-picture labels). */
export const Label: React.FC<{op: number; text: string; x: number; y: number; size?: number; anchor?: 'start' | 'middle' | 'end'; tone?: 'paper' | 'dark' | 'yellow'; sub?: string}> = ({
  op, text, x, y, size = 36, anchor = 'middle', tone = 'paper', sub,
}) => {
  if (op <= 0.001) return null;
  const subSize = Math.round(size * 0.78);
  const lines = text.split('\n');
  const lh = size * 1.18;
  const tw = Math.max(...lines.map((l) => measureW(l, size, 900)), sub ? measureW(sub, subSize, 700) : 0);
  const w = tw * 1.07 + 52;
  const h = size * 1.6 + (lines.length - 1) * lh + (sub ? subSize * 1.3 : 0);
  let x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  x0 = Math.max(40, Math.min(W - 40 - w, x0));
  const bg = tone === 'dark' ? '#1A1A1A' : tone === 'yellow' ? C.dustyYellow : '#F4EBD6';
  const fg = tone === 'dark' ? '#F4EBD6' : ink;
  return (
    <g opacity={op} transform={`translate(${x0},${y})`}>
      <rect x={5} y={6} width={w} height={h} rx={12} fill="rgba(0,0,0,0.3)" />
      <rect width={w} height={h} rx={12} fill={bg} stroke={ink} strokeWidth={4} />
      {lines.map((l, i) => (
        <text key={i} x={24} y={size * 1.12 + i * lh} fontFamily={FONT.sans} fontWeight={900} fontSize={size} fill={fg} letterSpacing={1}>
          {l}
        </text>
      ))}
      {sub && (
        <text x={24} y={size * 1.12 + (lines.length - 1) * lh + subSize * 1.3} fontFamily={FONT.sans} fontWeight={700} fontSize={subSize} fill={tone === 'dark' ? '#E3C77A' : C.darkRed}>
          {sub}
        </text>
      )}
    </g>
  );
};

/** Ticker: items appear one after another in a single pill (upper centre). */
export const Ticker: React.FC<{at: number; until: number; items: string[]; stagger: number; y: number; size?: number}> = ({at, until, items, stagger, y, size = 36}) => {
  const f = useCurrentFrame();
  if (f < at - 1 || f > until + 1) return null;
  const sep = '  ·  ';
  const full = items.join(sep);
  const w = measureW(full, size, 900) + 60;
  const op = prog(f, at, at + 12) * (1 - prog(f, until - 12, until));
  let x = W / 2 - w / 2 + 30;
  return (
    <g opacity={op}>
      <rect x={W / 2 - w / 2 + 5} y={y + 6} width={w} height={size * 1.7} rx={size * 0.85} fill="rgba(0,0,0,0.3)" />
      <rect x={W / 2 - w / 2} y={y} width={w} height={size * 1.7} rx={size * 0.85} fill="#F4EBD6" stroke={ink} strokeWidth={4.5} />
      {items.map((it, i) => {
        const t = it + (i < items.length - 1 ? sep : '');
        const x0 = x;
        x += measureW(t, size, 900);
        return (
          <text key={i} x={x0} y={y + size * 1.18} fontFamily={FONT.sans} fontWeight={900} fontSize={size} fill={ink} opacity={prog(f, at + i * stagger, at + i * stagger + 10)}>
            {t}
          </text>
        );
      })}
    </g>
  );
};

/** Pocket watch close-up (diegetic clock face). minutes = minutes past 10 o'clock (60 = 11:00).
 *  f drives the small seconds hand at real speed (6° per second; pass f relative to the full minute). */
export const PocketWatch: React.FC<{x: number; y: number; r: number; minutes: number; f: number}> = ({x, y, r, minutes, f}) => {
  const mAng = (minutes / 60) * 360;
  const hAng = 300 + (minutes / 60) * 30;
  const sAng = (((f / 30) * 6) % 360 + 360) % 360;
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={0} cy={-r - 26} r={22} fill="none" stroke="#B8962E" strokeWidth={9} />
      <rect x={-16} y={-r - 14} width={32} height={22} rx={5} fill="#C9A645" stroke={ink} strokeWidth={4} />
      <circle r={r + 16} fill="#C9A645" stroke={ink} strokeWidth={6} />
      <circle r={r} fill="#F6F0DE" stroke={ink} strokeWidth={4} />
      {Array.from({length: 60}).map((_, i) => {
        const a = (i / 60) * Math.PI * 2;
        const long = i % 5 === 0;
        return <line key={i} x1={Math.sin(a) * r * (long ? 0.84 : 0.9)} y1={-Math.cos(a) * r * (long ? 0.84 : 0.9)} x2={Math.sin(a) * r * 0.96} y2={-Math.cos(a) * r * 0.96} stroke={ink} strokeWidth={long ? 6 : 2} />;
      })}
      {['XII', 'III', 'VI', 'IX'].map((t, i) => (
        <text key={t} x={Math.sin((i * Math.PI) / 2) * r * 0.66} y={-Math.cos((i * Math.PI) / 2) * r * 0.66 + r * 0.07} textAnchor="middle" fontFamily={FONT.serif} fontWeight={700} fontSize={r * 0.2} fill={ink}>
          {t}
        </text>
      ))}
      <g transform={`rotate(${hAng})`}>
        <path d={`M-9,10 L0,${-r * 0.5} L9,10 Z`} fill={ink} />
      </g>
      <g transform={`rotate(${mAng})`}>
        <path d={`M-6,12 L0,${-r * 0.82} L6,12 Z`} fill={ink} />
      </g>
      <g transform={`translate(0,${r * 0.42})`}>
        <circle r={r * 0.17} fill="none" stroke={ink} strokeWidth={2} />
        <line x1={0} y1={0} x2={Math.sin((sAng * Math.PI) / 180) * r * 0.15} y2={-Math.cos((sAng * Math.PI) / 180) * r * 0.15} stroke={C.red} strokeWidth={2.5} />
      </g>
      <circle r={9} fill="#C9A645" stroke={ink} strokeWidth={3} />
      <ellipse cx={-r * 0.35} cy={-r * 0.45} rx={r * 0.32} ry={r * 0.14} fill="#fff" opacity={0.35} transform={`rotate(-35,${-r * 0.35},${-r * 0.45})`} />
    </g>
  );
};

/** Commonwealth-style white headstone with engraved text (diegetic). */
export const Headstone: React.FC<{x: number; y: number; s?: number; lines: string[]; cross?: boolean; light?: number}> = ({x, y, s = 1, lines, cross = true, light = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={150} ry={18} fill="rgba(0,0,0,0.18)" />
    <path d="M-120,0 L-120,-330 Q-120,-380 0,-388 Q120,-380 120,-330 L120,0 Z" fill="#EFECE4" stroke={ink} strokeWidth={5} />
    <path d="M-92,-20 L-92,-320 Q-92,-356 0,-362 Q92,-356 92,-320 L92,-20" fill="none" stroke="#D2CEC2" strokeWidth={3} />
    {cross && <path d="M-9,-170 h18 v-40 h30 v-18 h-30 v-38 h-18 v38 h-30 v18 h30 Z" fill="none" stroke="#9A968A" strokeWidth={4} />}
    {lines.map((l, i) => (
      <text key={i} x={0} y={-300 + i * 44 + (cross && i > 0 ? 160 : 0)} textAnchor="middle" fontFamily={FONT.serif} fontWeight={700} fontSize={i === 0 ? 36 : 30} fill="#4A4840" letterSpacing={1.5}>
        {l}
      </text>
    ))}
    {light > 0 && <path d="M-120,0 L-120,-330 Q-120,-380 0,-388 Q120,-380 120,-330 L120,0 Z" fill="#FFF6D8" opacity={light} />}
  </g>
);

/** Simple bicycle (side view), wheels turn with dist. */
export const Bicycle: React.FC<{x: number; y: number; dist: number; s?: number; dir?: 1 | -1}> = ({x, y, dist, s = 1, dir = 1}) => {
  const rot = (dist / 34) * (180 / Math.PI);
  const wheel = (wx: number) => (
    <g transform={`translate(${wx},-34) rotate(${rot})`}>
      <circle r={34} fill="none" stroke={ink} strokeWidth={4} />
      {[0, 45, 90, 135].map((a) => (
        <line key={a} x1={0} y1={-32} x2={0} y2={32} stroke={ink} strokeWidth={1.5} transform={`rotate(${a})`} />
      ))}
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${s * dir},${s})`}>
      {wheel(-52)}
      {wheel(52)}
      <path d="M-52,-34 L-10,-34 L30,-86 L-26,-86 Z M-10,-34 L-26,-96 M30,-86 L52,-34 M30,-86 L26,-104" fill="none" stroke="#2F4A3A" strokeWidth={6} strokeLinejoin="round" />
      <path d="M-38,-98 h26" stroke={ink} strokeWidth={7} strokeLinecap="round" />
      <path d="M14,-108 h24" stroke={ink} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

/** Plain stone house front with a door (angle 0..1 = open), a window and a step. */
export const StoneHouse: React.FC<{x: number; base: number; w: number; h: number; door?: number; color?: string; roof?: string; dark?: boolean}> = ({x, base, w, h, door = 0, color = '#C8B89A', roof = '#8A6A52', dark = true}) => {
  const dw = 120;
  const dx = x + w / 2 - dw / 2;
  const open = clamp(door);
  return (
    <g>
      <rect x={x} y={base - h} width={w} height={h} fill={color} stroke={ink} strokeWidth={5} />
      <path d={`M${x - 20},${base - h} L${x + w / 2},${base - h - 110} L${x + w + 20},${base - h} Z`} fill={roof} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
      {[0.18, 0.82].map((k, i) => (
        <g key={i}>
          <rect x={x + w * k - 50} y={base - h + 70} width={100} height={110} fill={dark ? '#2E2A28' : '#9FC3D0'} stroke={ink} strokeWidth={4} />
          <line x1={x + w * k} y1={base - h + 70} x2={x + w * k} y2={base - h + 180} stroke={ink} strokeWidth={3} />
        </g>
      ))}
      <rect x={dx} y={base - 230} width={dw} height={230} fill="#141210" stroke={ink} strokeWidth={4} />
      {/* door leaf swinging inwards on its left hinge */}
      <path d={`M${dx},${base - 230} L${dx + dw * (1 - open * 0.8)},${base - 230 + open * 14} L${dx + dw * (1 - open * 0.8)},${base - open * 14} L${dx},${base} Z`} fill="#6A4E36" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      <rect x={dx - 20} y={base} width={dw + 40} height={18} fill="#9A8E7A" stroke={ink} strokeWidth={3} />
    </g>
  );
};

/** Washing line with cloths swaying in the wind. */
export const WashingLine: React.FC<{x0: number; x1: number; y: number; f: number; colors?: string[]; wind?: number}> = ({x0, x1, y, f, colors = ['#D8D0C0', '#8A7A6A', '#B8A890', '#C9C2B0'], wind = 1}) => {
  const n = colors.length;
  return (
    <g>
      <path d={`M${x0},${y} Q${(x0 + x1) / 2},${y + 40} ${x1},${y}`} stroke={ink} strokeWidth={3} fill="none" />
      <rect x={x0 - 6} y={y - 10} width={10} height={400} fill="#5A4A3A" stroke={ink} strokeWidth={2} />
      <rect x={x1 - 4} y={y - 10} width={10} height={400} fill="#5A4A3A" stroke={ink} strokeWidth={2} />
      {colors.map((c, i) => {
        const t = (i + 0.7) / (n + 0.4);
        const cx = lerp(x0, x1, t);
        const cy = y + 40 * 4 * t * (1 - t) * 0.5 + 4;
        const sw = Math.sin(f / 14 + i * 1.3) * 16 * wind + 10 * wind;
        const w = 70 + (i % 2) * 20;
        const h = 90 + (i % 3) * 18;
        return <path key={i} d={`M${cx - w / 2},${cy} L${cx + w / 2},${cy} L${cx + w / 2 + sw},${cy + h} L${cx - w / 2 + sw * 0.8},${cy + h - 6} Z`} fill={c} stroke={ink} strokeWidth={3} strokeLinejoin="round" />;
      })}
    </g>
  );
};

/** Wooden chair (side-on), slightly askew. */
export const SimpleChair: React.FC<{x: number; y: number; s?: number; rot?: number; color?: string}> = ({x, y, s = 1, rot = 0, color = '#6A4E36'}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-40} y={-80} width={80} height={12} fill={color} stroke={ink} strokeWidth={3} />
    <rect x={-40} y={-170} width={10} height={170} fill={color} stroke={ink} strokeWidth={3} />
    <rect x={30} y={-80} width={10} height={80} fill={color} stroke={ink} strokeWidth={3} />
    <rect x={-40} y={-160} width={10} height={60} fill={color} />
    <line x1={-35} y1={-140} x2={-35} y2={-100} stroke={ink} strokeWidth={2} />
  </g>
);

/** Chalk balance scale (S07-07). tilt: degrees (positive = right pan down). */
export const ChalkScale: React.FC<{x: number; y: number; tilt: number; reveal: number; left: string; right: string; size?: number}> = ({x, y, tilt, reveal, left, right, size = 34}) => {
  const r = clamp(reveal);
  const arm = 360;
  const rad = (tilt * Math.PI) / 180;
  const lx = x - Math.cos(rad) * arm;
  const ly = y - Math.sin(rad) * arm;
  const rx = x + Math.cos(rad) * arm;
  const ry = y + Math.sin(rad) * arm;
  const stroke = {stroke: '#F4F1E8', strokeWidth: 7, fill: 'none', strokeLinecap: 'round' as const, opacity: 0.92};
  const pan = (px: number, py: number, text: string, t: number) => (
    <g opacity={clamp(t * 2)}>
      <path d={`M${px},${py} L${px - 130},${py + 150} M${px},${py} L${px + 130},${py + 150}`} {...stroke} strokeWidth={4} />
      <path d={`M${px - 170},${py + 150} Q${px},${py + 230} ${px + 170},${py + 150} Z`} {...stroke} />
      <text x={px} y={py + 290} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={size} fill="#F4F1E8" opacity={clamp(t * 2 - 1)}>
        {text.split('\n').map((l, i) => (
          <tspan key={i} x={px} dy={i === 0 ? 0 : size * 1.15}>
            {l}
          </tspan>
        ))}
      </text>
    </g>
  );
  return (
    <g>
      <path d={`M${x},${y + 330} L${x},${y}`} {...stroke} pathLength={1} strokeDasharray={`${clamp(r * 3)} 1`} />
      <path d={`M${x - 110},${y + 330} L${x + 110},${y + 330}`} {...stroke} opacity={clamp(r * 3) * 0.92} />
      <path d={`M${lx},${ly} L${rx},${ry}`} {...stroke} opacity={clamp(r * 3 - 0.5) * 0.92} />
      <path d={`M${x - 26},${y - 30} L${x},${y} L${x + 26},${y - 30} Z`} {...stroke} opacity={clamp(r * 3 - 0.5) * 0.92} />
      {pan(lx, ly, left, r * 2 - 0.6)}
      {pan(rx, ry, right, r * 2 - 1)}
    </g>
  );
};

/** Official notice pasted on a wall (diegetic). paste 0..1 = slides up and flattens. */
export const OfficialNotice: React.FC<{x: number; y: number; w?: number; h?: number; paste: number; title: string; year: string; s?: number}> = ({x, y, w = 360, h = 470, paste, title, year, s = 1}) => {
  const p = clamp(paste);
  if (p <= 0) return null;
  const words = title.split(' ');
  const half = Math.ceil(words.length / 2);
  return (
    <g transform={`translate(${x},${y + (1 - p) * 30}) rotate(${(1 - p) * -4}) scale(${s})`} opacity={clamp(p * 3)}>
      <rect x={-w / 2 + 6} y={6} width={w} height={h} fill="rgba(0,0,0,0.2)" />
      <rect x={-w / 2} y={0} width={w} height={h} fill="#F2EAD6" stroke={ink} strokeWidth={4} />
      <rect x={-w / 2 + 16} y={16} width={w - 32} height={h - 32} fill="none" stroke={ink} strokeWidth={2} />
      <text x={0} y={92} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={46} fill={ink}>
        {words.slice(0, half).join(' ')}
      </text>
      <text x={0} y={144} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={46} fill={ink}>
        {words.slice(half).join(' ')}
      </text>
      <line x1={-w / 2 + 50} y1={172} x2={w / 2 - 50} y2={172} stroke={ink} strokeWidth={3} />
      <text x={0} y={240} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={64} fill={C.darkRed}>
        {year}
      </text>
      {Array.from({length: 6}).map((_, i) => (
        <line key={i} x1={-w / 2 + 50} y1={290 + i * 26} x2={w / 2 - 50 - (i % 3) * 30} y2={290 + i * 26} stroke="#8A8170" strokeWidth={8} />
      ))}
    </g>
  );
};

/** Paper telegram strip with number groups morphing into words (S09-02). */
export const Telegram: React.FC<{x: number; y: number; morph: number[]; groups: string[]; words: string[]; s?: number}> = ({x, y, morph, groups, words, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-6} y={8} width={900} height={330} fill="rgba(0,0,0,0.2)" transform="rotate(-2)" />
    <g transform="rotate(-2)">
      <rect x={-12} y={0} width={900} height={330} fill="#EFE6CC" stroke={ink} strokeWidth={4} />
      <text x={30} y={46} fontFamily={FONT.sans} fontWeight={800} fontSize={24} fill="#7A6A4A" letterSpacing={3}>
        TELEGRAM · BERLIN
      </text>
      {words.map((w, i) => {
        const m = clamp(morph[i] ?? 0);
        return (
          <g key={i} transform={`translate(30,${110 + i * 78})`}>
            <text x={0} y={0} fontFamily="monospace" fontWeight={700} fontSize={40} fill={ink} opacity={1 - m} letterSpacing={6}>
              {groups[i]}
            </text>
            <text x={0} y={0} fontFamily={FONT.sans} fontWeight={900} fontSize={46} fill={C.darkRed} opacity={m}>
              {w}
            </text>
            {m > 0.6 && <ellipse cx={measureW(w, 46, 900) / 2} cy={-15} rx={measureW(w, 46, 900) / 2 + 22} ry={36} fill="none" stroke={C.red} strokeWidth={4} opacity={clamp((m - 0.6) * 2.5)} />}
          </g>
        );
      })}
    </g>
  </g>
);

/** Pals telegram-boy street: curtain in a window (closed 0..1). */
export const CurtainWindow: React.FC<{x: number; y: number; w?: number; h?: number; closed: number; color?: string}> = ({x, y, w = 110, h = 130, closed, color = '#7A3A34'}) => {
  const c = clamp(closed);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#E8D9A0" stroke={ink} strokeWidth={4} />
      <rect x={x} y={y} width={(w / 2) * (0.2 + 0.8 * c)} height={h} fill={color} stroke={ink} strokeWidth={2.5} />
      <rect x={x + w - (w / 2) * (0.2 + 0.8 * c)} y={y} width={(w / 2) * (0.2 + 0.8 * c)} height={h} fill={color} stroke={ink} strokeWidth={2.5} />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={ink} strokeWidth={3} opacity={1 - c} />
    </g>
  );
};

/** End card for ep02 (overlay, section-local). "THE HUMAN STORY" + tagline + WATCH NEXT frame. */
export const EndCardWW1: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const t = prog(f, at, at + 24, easeOut);
  const b = prog(f, at + 20, at + 44, easeOut);
  return (
    <g>
      <g opacity={t} transform={`translate(${W / 2},${236 - (1 - t) * 30})`}>
        <text x={0} y={0} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={96} fill="#FFFFFF" stroke={ink} strokeWidth={9} paintOrder="stroke" letterSpacing={5}>
          THE HUMAN STORY
        </text>
        <text x={0} y={72} textAnchor="middle" fontFamily={FONT.sans} fontWeight={600} fontStyle="italic" fontSize={44} fill="#FFF3D6" stroke={ink} strokeWidth={6} paintOrder="stroke">
          History is made by people.
        </text>
      </g>
      <g opacity={b} transform={`translate(${W / 2},${560 + (1 - b) * 30})`}>
        <text x={0} y={-150} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={44} fill={C.dustyYellow} stroke={ink} strokeWidth={6} paintOrder="stroke" letterSpacing={2}>
          WATCH NEXT: WW2 — FROM START TO FINISH
        </text>
        <rect x={-330} y={-110} width={660} height={372} rx={14} fill="none" stroke={C.dustyYellow} strokeWidth={6} />
        <rect x={-310} y={-90} width={620} height={332} rx={8} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={3} strokeDasharray="14 10" />
      </g>
    </g>
  );
};

/** Whip pan between two full-frame scenes (p 0..1): A slides out left, B slides in from the right, with motion streaks. */
export const WhipPan: React.FC<{p: number; a: React.ReactNode; b: React.ReactNode; f: number}> = ({p, a, b, f}) => {
  const k = easeInOut(clamp(p));
  const streak = Math.sin(Math.PI * k);
  return (
    <g>
      {k < 1 && <g transform={`translate(${-k * W * 1.15},0)`}>{a}</g>}
      {k > 0 && <g transform={`translate(${(1 - k) * W * 1.15},0)`}>{b}</g>}
      {streak > 0.02 && (
        <g opacity={streak * 0.85}>
          <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#E8E2D2" opacity={0.35} />
          {Array.from({length: 26}).map((_, i) => (
            <rect key={i} x={((i * 377 + f * 90) % (W + 800)) - 400} y={(i * 131) % H} width={300 + (i % 4) * 140} height={6 + (i % 3) * 5} rx={4} fill={i % 2 ? '#FFFFFF' : '#5A5448'} opacity={0.5} />
          ))}
        </g>
      )}
    </g>
  );
};

/** Quotation card (overlay, section-local frames): lines fade in at their own times, plus a small credit line.
 *  Light text on a soft dark band, centred; slow fades, no bounce (sombre). */
export const QuoteCard: React.FC<{at: number; until: number; lines: {text: string; at: number}[]; credit?: string; creditAt?: number; y?: number; size?: number}> = ({at, until, lines, credit, creditAt, y = 330, size = 46}) => {
  const f = useCurrentFrame();
  if (f < at - 1 || f > until + 1) return null;
  const op = prog(f, at, at + 30) * (1 - prog(f, until - 30, until));
  const lh = size * 1.45;
  const cs = 34;
  const h = lines.length * lh + (credit ? cs * 1.9 : 0) + 70;
  const tw = Math.max(...lines.map((l) => measureW(l.text, size, 800)), credit ? measureW(credit, cs, 700) : 0) + 120;
  return (
    <g opacity={op}>
      <rect x={W / 2 - tw / 2} y={y - size - 28} width={tw} height={h} rx={18} fill="#14161C" opacity={0.62} />
      {lines.map((l, i) => (
        <text key={i} x={W / 2} y={y + i * lh} textAnchor="middle" fontFamily={FONT.serif} fontWeight={700} fontStyle="italic" fontSize={size} fill="#F4EBD6" opacity={prog(f, l.at, l.at + 30)}>
          {l.text}
        </text>
      ))}
      {credit && (
        <text x={W / 2} y={y + (lines.length - 1) * lh + cs * 2} textAnchor="middle" fontFamily={FONT.sans} fontWeight={700} fontSize={cs} fill="#E3C77A" opacity={prog(f, creditAt ?? at, (creditAt ?? at) + 30)}>
          {credit}
        </text>
      )}
    </g>
  );
};

/** Vertical list in one paper panel (overlay, section-local): lines appear in turn; calm fades, no bounce. */
export const ListLabel: React.FC<{at: number; until: number; lines: string[]; x: number; y: number; stagger: number; size?: number; anchor?: 'start' | 'middle' | 'end'}> = ({at, until, lines, x, y, stagger, size = 36, anchor = 'end'}) => {
  const f = useCurrentFrame();
  if (f < at - 1 || f > until + 1) return null;
  const op = prog(f, at, at + 12) * (1 - prog(f, until - 12, until));
  const lh = size * 1.45;
  const w = Math.max(...lines.map((l) => measureW(l, size, 800))) + 110;
  const h = lines.length * lh + size * 0.9;
  let x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  x0 = Math.max(40, Math.min(W - 40 - w, x0));
  return (
    <g opacity={op} transform={`translate(${x0},${y})`}>
      <rect x={6} y={7} width={w} height={h} rx={14} fill="rgba(0,0,0,0.3)" />
      <rect width={w} height={h} rx={14} fill="#F4EBD6" stroke={ink} strokeWidth={4.5} />
      {lines.map((l, i) => {
        const o = prog(f, at + i * stagger, at + i * stagger + 12);
        return (
          <g key={i} opacity={o}>
            <rect x={30} y={size * 0.62 + i * lh} width={14} height={14} rx={3} fill={C.darkRed} />
            <text x={62} y={size * 1.18 + i * lh} fontFamily={FONT.sans} fontWeight={800} fontSize={size} fill={ink}>
              {l}
            </text>
          </g>
        );
      })}
    </g>
  );
};

/** Ease helper re-export for scene files. */
export const ease = {easeInOut, easeOut, easeIn};
export {lerp, clamp, prog, H};
