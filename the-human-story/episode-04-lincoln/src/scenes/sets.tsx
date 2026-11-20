// Reusable, parameterised shots for Episode 3. Every shot keeps picture and labels above y = 916
// (the caption band) and clear of the top-left logo zone (x < 170, y < 150).
import React from 'react';
import {Frame, Cam} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {Letter, Desk, PaperHand, Hand, Sheet, QuoteType} from '../kit/Paper';
import {Sky, OldPalace, River, Room, Timbered, Church, Cobbles, Roofline, PlaceTag, Time, INK} from '../kit/Places';
import {parishWalk} from '../characters/parishWalk';
import {stand, standStiff, pose, Pose, addPose, holdFront, talkGesture, mixPose, seated} from '../characters/poses';
import {Candle, Particles, Vignette} from '../components/Effects';
import {prog, clamp, kf, easeOut, noise1} from '../animations/core';
import {C, FONT} from '../styles/theme';

/** Walking helper: distance travelled (px, unscaled) at frame f for a walker who starts at `start`, walks at `speed`
 *  px/frame until `stop` and then settles over ~24 frames (feet planted by parishWalk's foot solver). */
export function walkDist(f: number, start: number, stop: number, speed = 2.3) {
  const g = Math.max(0, f - start);
  const end = stop - start;
  return speed * (Math.min(g, end) + 24 * (1 - Math.exp(-Math.max(0, g - end) / 24)));
}
export function walker(f: number, start: number, stop: number, speed = 2.3, child = false, phase0 = 0.1): {d: number; p: Pose} {
  const d = walkDist(f, start, stop, speed);
  const settle = prog(f, stop, stop + 30);
  const moving = f >= start;
  return {d, p: moving ? parishWalk(d, child, phase0, settle) : stand(f, 3)};
}

/** A sheet held in a hand (for figures' holdR). */
export const HeldLetter: React.FC<{s?: number; rot?: number}> = ({s = 1, rot = -10}) => (
  <g transform={`rotate(${rot}) scale(${s})`}>
    <rect x={-6} y={-46} width={44} height={56} rx={2} fill="#EFE2C2" stroke={INK} strokeWidth={3} />
    <path d="M0,-34 h30 M0,-24 h26 M0,-14 h30 M0,-4 h20" stroke="#6B5640" strokeWidth={2.2} />
  </g>
);
export const Lantern: React.FC<{f: number; lit?: number}> = ({f, lit = 1}) => (
  <g>
    <line x1={0} y1={0} x2={0} y2={18} stroke={INK} strokeWidth={3} />
    <circle cx={0} cy={40} r={60} fill="#FFD27A" opacity={0.16 * lit + 0.03 * Math.sin(f / 3)} />
    <rect x={-14} y={18} width={28} height={40} rx={4} fill={`rgba(255,214,120,${0.5 + 0.4 * lit})`} stroke={INK} strokeWidth={3} />
    <path d="M-16,18 h32 l-6,-8 h-20Z" fill="#3A3A3A" stroke={INK} strokeWidth={2} />
  </g>
);

/** Close-up: the letter on a desk, a hand smoothing it, the camera following the lines down the page. */
export const LetterDeskShot: React.FC<{f: number; d: number; unfold?: [number, number]; pan?: [number, number, number, number]; caption?: string; noName?: number; hand?: boolean; quote?: {text: string; at: number}}> = ({
  f, d, unfold = [0, 0], pan, hand = true, noName = -1, quote,
}) => {
  const fold = unfold[1] > unfold[0] ? 1 - prog(f, unfold[0], unfold[1]) : 0;
  const hx = kf(f, [[0, 1500], [unfold[1] || 1, 1180], [(unfold[1] || 1) + 50, 1260], [(unfold[1] || 1) + 90, 1700]]);
  const hy = kf(f, [[0, 760], [unfold[1] || 1, 520], [(unfold[1] || 1) + 50, 640], [(unfold[1] || 1) + 90, 900]]);
  const [z0, y0, z1, y1] = pan ?? [1.25, 360, 1.25, 720];
  const mid = noName >= 0 ? Math.min(noName, d - 1) : d;
  const z = kf(f, [[0, z0], [mid, z1], [d, z1]]);
  const cy = kf(f, [[0, y0], [mid, y1], [d, y1]]);
  const nm = noName >= 0 ? prog(f, noName, noName + 20) : 0;
  return (
    <Frame bg="#3C2C22">
      <Cam f={f} keys={[[0, z, 960, cy], [d, z, 960, cy]]} drift={0.6}>
        <Desk />
        <circle cx={1500} cy={260} r={420} fill="#FFD9A0" opacity={0.12 + 0.02 * Math.sin(f / 5)} />
        <Candle x={1540} y={430} f={f} s={1.4} />
        <Letter x={960} y={560} s={1.0} rot={-3} fold={fold} />
        {nm > 0 && (
          <g opacity={nm}>
            <rect x={1000} y={790} width={240} height={90} rx={8} fill="none" stroke={C.red} strokeWidth={5} strokeDasharray="16 10" transform="rotate(-3 960 560)" />
            <text x={1300} y={860} fontFamily={FONT.sans} fontWeight={900} fontSize={34} fill="#FFF3D6" stroke={INK} strokeWidth={6} paintOrder="stroke" transform="rotate(-3 960 560)">NO NAME · NO DATE</text>
          </g>
        )}
        {hand && hx < 1690 && <PaperHand x={hx} y={hy} rot={-18} s={1.1} />}
      </Cam>
      {quote && <QuoteType x={960} y={480} text={quote.text} t={prog(f, quote.at, quote.at + 14)} size={120} />}
      <Vignette strength={0.55} />
    </Frame>
  );
};

/** Interior with one or two figures (Monteagle at home, Catesby's room, council). */
export const RoomShot: React.FC<{f: number; d: number; tone?: 'oak' | 'dark' | 'plain' | 'green'; fire?: boolean; window?: Time | 'none'; cam?: [number, number, number, number][]; children: (f: number) => React.ReactNode; candles?: [number, number][]; tag?: {text: string; sub?: string; at?: number}; dust?: boolean; fireX?: number; windowX?: number}> = ({
  f, d, tone = 'oak', fire, window = 'dusk', cam, children, candles, tag, dust = true, fireX, windowX,
}) => (
  <Frame>
    <Cam f={f} keys={cam ?? [[0, 1.0, 960, 540], [d, 1.05, 960, 520]]}>
      <Room f={f} tone={tone} fire={fire} window={window} candles={candles} fireX={fireX} windowX={windowX} />
      {children(f)}
    </Cam>
    {dust && <Particles f={f} kind="dust" n={40} seed={9} wind={0.2} />}
    {tag && <PlaceTag text={tag.text} sub={tag.sub} t={prog(f, tag.at ?? 6, (tag.at ?? 6) + 16) * (1 - prog(f, d - 30, d - 10))} />}
    <Vignette strength={0.4} />
  </Frame>
);

/** The old Palace of Westminster from across the river (day / dusk / night). */
export const PalaceShot: React.FC<{f: number; d: number; time?: Time; lit?: number; tag?: {text: string; sub?: string}; cam?: [number, number, number, number][]; children?: (f: number) => React.ReactNode; lantern?: number; boats?: boolean}> = ({
  f, d, time = 'day', lit = 0, tag, cam, children, lantern = 0, boats = true,
}) => (
  <Frame>
    <Cam f={f} keys={cam ?? [[0, 1.0, 960, 520], [d, 1.06, 990, 520]]}>
      <Sky time={time} id={`pal-${time}`} f={f} />
      <Roofline base={700} color={time === 'night' ? '#2C3346' : '#A9B0AA'} seed={5} />
      <OldPalace f={f} time={time} lit={lit} lantern={lantern} />
      <River y0={820} y1={1200} f={f} night={time === 'night'} />
      {boats && (
        <g transform={`translate(${((f * 0.8) % 2600) - 400},860)`}>
          <path d="M-90,0 H90 L70,26 H-70Z" fill="#6B4A30" stroke={INK} strokeWidth={5} />
          <line x1={0} y1={0} x2={0} y2={-80} stroke={INK} strokeWidth={5} />
        </g>
      )}
      {children?.(f)}
    </Cam>
    {tag && <PlaceTag text={tag.text} sub={tag.sub} t={prog(f, 8, 24) * (1 - prog(f, d - 24, d - 8))} />}
    <Vignette strength={time === 'night' ? 0.6 : 0.3} />
  </Frame>
);

/** The parish street: houses, church with bell; `people` draws figures in street space. */
export const StreetShot: React.FC<{f: number; d: number; time?: Time; bell?: number; cam?: [number, number, number, number][]; children?: (f: number) => React.ReactNode; tag?: {text: string; sub?: string}; era?: 1606 | 1680 | 1830; lit?: number; pan?: number}> = ({
  f, d, time = 'day', bell = 0, cam, children, tag, era = 1606, lit = 0, pan = 0.19,
}) => {
  const night = time === 'night';
  const tint = era === 1830 ? ['#B7A089', '#C9B08E', '#A99A86'] : era === 1680 ? ['#D2BC98', '#C3AA88', '#D9C4A0'] : ['#DCC7A0', '#C5AF91', '#DFC69F'];
  return (
    <Frame>
      <Cam f={f} keys={cam ?? [[0, 1, 960, 540], [d, 1, 960, 540]]}>
        <Sky time={time} id={`st-${time}-${era}`} f={f} />
        <g transform={`translate(${-f * pan * 0.35},0)`}><Roofline base={640} color={night ? '#283044' : '#A4ACA4'} seed={era} /></g>
        <g transform={`translate(${-f * pan},0)`}>
          <Timbered x={-60} base={720} fill={tint[0]} lit={lit} seed={1} />
          <Timbered x={260} base={720} w={280} h={350} fill={tint[1]} lit={lit} seed={2} />
          <Timbered x={560} base={720} fill={tint[2]} lit={lit} seed={3} />
          <Church x={900} base={720} bell={bell} />
          <Timbered x={1440} base={720} fill={tint[1]} lit={lit} seed={4} />
          <Timbered x={1760} base={720} w={280} fill={tint[0]} lit={lit} seed={5} />
          <Timbered x={2060} base={720} fill={tint[2]} lit={lit} seed={6} />
          {era === 1830 && [400, 1300, 2000].map((lx) => (
            <g key={lx}>
              <rect x={lx} y={560} width={10} height={160} fill={INK} />
              <rect x={lx - 14} y={530} width={38} height={34} fill={night ? '#FFD27A' : '#D8D2C0'} stroke={INK} strokeWidth={4} />
            </g>
          ))}
        </g>
        <Cobbles y={715} night={night} />
        {children?.(f)}
      </Cam>
      {tag && <PlaceTag text={tag.text} sub={tag.sub} t={prog(f, 8, 24) * (1 - prog(f, d - 24, d - 8))} />}
      <Vignette strength={night ? 0.6 : 0.28} />
    </Frame>
  );
};

/** Bell swing: starts at `at`, decays. */
export const bellSwing = (f: number, at: number, amp = 17, decay = 70) => (f < at ? 0 : amp * Math.sin((f - at) / 9) * prog(f, at, at + 14) * Math.exp(-Math.max(0, f - at - 40) / decay));

/** Conspirators around a candle in a dark room (no faces lit beyond the candle; no dialogue). */
export const CandleCircleShot: React.FC<{f: number; d: number; who?: string[]; tags?: boolean}> = ({f, d, who = ['winter', 'percy', 'catesby', 'wright', 'fawkes'], tags = false}) => (
  <Frame bg="#141214">
    <Cam f={f} keys={[[0, 1.08, 960, 560], [d, 1.0, 960, 560]]}>
      <rect x={-300} y={-300} width={2520} height={1500} fill="#1D1A1C" />
      <circle cx={960} cy={560} r={560} fill="#FFC870" opacity={0.12 + 0.03 * Math.sin(f / 3)} />
      <path d="M560,700 H1360 L1400,740 H520Z" fill="#4A3526" stroke={INK} strokeWidth={6} />
      <Candle x={960} y={700} f={f} s={1.5} />
      {who.map((id, i) => {
        const x = 520 + i * 220;
        const look: [number, number] = [x < 960 ? 0.6 : -0.6, 0.2];
        return <Person key={id} id={id} x={x} y={860} scale={1.25} dir={x < 960 ? 1 : -1} f={f} seed={i * 7} pose={addPose(stand(f, i), {lean: 4, headTilt: 6})} look={look} expression="determined" opacity={1} tag={tags && i === 2} />;
      })}
    </Cam>
    <rect width={1920} height={1080} fill="#000" opacity={0.25} />
    <Vignette strength={0.7} />
  </Frame>
);

/** Two-figure exchange: a sheet passes from the left figure's hand to the right figure's hand over t = [a, b] frames. */
export function passPose(f: number, a: number, b: number, giver: boolean): Pose {
  const reach = prog(f, a, (a + b) / 2) * (1 - prog(f, b, b + 24));
  const base = standStiff(f, giver ? 1 : 2);
  return addPose(base, {shR: 70 * reach, elR: 20 * reach, lean: 4 * reach, headTilt: 4 * reach});
}

export {pose, stand, standStiff, holdFront, talkGesture, mixPose, seated, addPose, prog, clamp, kf, easeOut, noise1, Hand, Sheet};

/** Gilt portrait frame with a cast member's head and shoulders inside. */
export const Portrait: React.FC<{x: number; y: number; id: string; f: number; s?: number; t?: number; label?: string; sub?: string; grey?: number; expression?: 'neutral' | 'solemn' | 'smug' | 'curious' | 'worried'}> = ({x, y, id, f, s = 1, t = 1, label, sub, grey = 0, expression = 'neutral'}) => {
  if (t <= 0) return null;
  const cid = `pf-${id}-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g transform={`translate(${x},${y}) scale(${s * (0.85 + 0.15 * clamp(t))})`} opacity={clamp(t * 1.6)}>
      <rect x={-130} y={-170} width={260} height={320} rx={10} fill="#C9A24A" stroke={INK} strokeWidth={7} />
      <rect x={-108} y={-148} width={216} height={276} fill="#3E4A44" stroke={INK} strokeWidth={4} />
      <defs><clipPath id={cid}><rect x={-108} y={-148} width={216} height={276} /></clipPath></defs>
      <g clipPath={`url(#${cid})`}>
        <Person id={id} x={0} y={300} scale={1.35} f={f} seed={5} pose={standStiff(f, 2)} expression={expression} />
      </g>
      {grey > 0 && <rect x={-108} y={-148} width={216} height={276} fill="#8A8A86" opacity={grey * 0.7} style={{mixBlendMode: 'saturation'}} />}
      {label && (
        <g>
          <rect x={-140} y={160} width={280} height={sub ? 74 : 48} rx={6} fill="#F1E6CB" stroke={INK} strokeWidth={4} />
          <text x={0} y={194} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={label.length > 16 ? 19 : 24} fill={INK}>{label}</text>
          {sub && <text x={0} y={222} textAnchor="middle" fontFamily={FONT.sans} fontWeight={700} fontSize={19} fill="#5A4A36">{sub}</text>}
        </g>
      )}
    </g>
  );
};

/** Small banner on a pole: 'en' (St George's cross) or 'es' (red saltire, the Cross of Burgundy). */
export const Banner: React.FC<{x: number; y: number; kind: 'en' | 'es'; f: number}> = ({x, y, kind, f}) => {
  const w = (k: number) => Math.sin(f / 9 + k) * 8;
  return (
    <g transform={`translate(${x},${y})`}>
      <line x1={0} y1={0} x2={0} y2={-300} stroke={INK} strokeWidth={8} />
      <path d={`M4,-296 Q60,${-306 + w(0)} 130,${-296 + w(1)} V${-196 + w(2)} Q60,${-206 + w(1)} 4,-196Z`} fill="#F4F0E4" stroke={INK} strokeWidth={5} />
      {kind === 'en' ? (
        <path d={`M4,${-252} Q60,${-256 + w(0.5)} 130,${-248 + w(1.5)} M62,-300 V-200`} stroke="#B23A2E" strokeWidth={16} fill="none" />
      ) : (
        <path d={`M14,-288 L120,${-206 + w(2)} M120,${-288 + w(1)} L14,-206`} stroke="#B23A2E" strokeWidth={12} strokeLinecap="round" />
      )}
    </g>
  );
};

/** Schematic plan of London c.1605: the Thames, the walled City, Westminster to the west, Hoxton to the north,
 *  the Tower at the City's east end. `show` picks which places are lit. Not to scale. */
export const LondonPlan: React.FC<{f: number; d: number; show: ('hoxton' | 'city' | 'westminster' | 'tower' | 'whitehall')[]; t?: number; route?: [number, number][]; routeT?: number}> = ({f, d, show, route, routeT = 0}) => {
  const P: Record<string, [number, number, string]> = {
    hoxton: [1120, 250, 'Hoxton'], city: [1120, 520, 'City of London'], westminster: [470, 690, 'Westminster'], whitehall: [560, 590, 'Whitehall'], tower: [1450, 600, 'Tower of London'],
  };
  const pts = route ?? [];
  const len = Math.max(1, pts.length - 1);
  const k = clamp(routeT) * len;
  const drawn = pts.slice(0, Math.floor(k) + 1).concat(k < len && pts.length > 1 ? [[pts[Math.floor(k)][0] + (pts[Math.floor(k) + 1][0] - pts[Math.floor(k)][0]) * (k % 1), pts[Math.floor(k)][1] + (pts[Math.floor(k) + 1][1] - pts[Math.floor(k)][1]) * (k % 1)] as [number, number]] : []);
  return (
    <Frame bg="#E6D9B8">
      <Cam f={f} keys={[[0, 1.0, 960, 480], [d, 1.05, 960, 470]]}>
        <rect x={-300} y={-300} width={2520} height={1500} fill="#E6D9B8" />
        {Array.from({length: 30}, (_, i) => <circle key={i} cx={(i * 331) % 1920} cy={(i * 197) % 860} r={14} fill="#D5C69E" opacity={0.6} />)}
        <path d="M-100,760 C200,780 380,740 520,770 C700,820 900,690 1150,700 C1400,710 1600,660 2050,700" fill="none" stroke="#7F9AA1" strokeWidth={70} strokeLinecap="round" />
        <path d="M-100,760 C200,780 380,740 520,770 C700,820 900,690 1150,700 C1400,710 1600,660 2050,700" fill="none" stroke={INK} strokeWidth={4} strokeDasharray="2 0" opacity={0.0} />
        <text x={1560} y={760} fontFamily={FONT.serif} fontWeight={700} fontStyle="italic" fontSize={34} fill="#4E6A72">River Thames</text>
        <path d="M900,620 Q880,440 1000,400 L1300,400 Q1420,470 1400,640 Q1150,690 900,620Z" fill="#CDB88E" stroke={INK} strokeWidth={6} strokeDasharray="20 8" opacity={show.includes('city') ? 1 : 0.5} />
        {(Object.keys(P) as (keyof typeof P)[]).map((key) => {
          const [x, y, name] = P[key];
          const on = show.includes(key as never);
          return (
            <g key={key} opacity={on ? 1 : 0.35}>
              <circle cx={x} cy={y} r={on ? 16 : 10} fill={on ? C.red : '#8A7A5A'} stroke={INK} strokeWidth={4} />
              <text x={x + 26} y={y + 12} fontFamily={FONT.sans} fontWeight={800} fontSize={on ? 36 : 28} fill={INK} stroke="#F4EBD6" strokeWidth={6} paintOrder="stroke">{name}</text>
            </g>
          );
        })}
        {drawn.length > 1 && <path d={'M' + drawn.map((p) => p.join(',')).join('L')} fill="none" stroke={C.darkRed} strokeWidth={8} strokeDasharray="18 10" strokeLinecap="round" />}
        <text x={1600} y={140} fontFamily={FONT.sans} fontWeight={700} fontSize={22} fill="#7A6A4A">plan, not to scale</text>
      </Cam>
      <Vignette strength={0.25} />
    </Frame>
  );
};
