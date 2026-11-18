// s05 — Chapter 4: Life in the Trenches (260–320 s; local frames 0–1799). Storyboard S05-01 … S05-05.
// Sombre chapter (storyboard 1.5/1.6): slow camera, rain, mist, candle flicker. Gas is a distant drifting cloud with no
// figures near it; we cut away before anyone is harmed. Shell shock is compassionate, never comic. Executions: no firing
// squad, only empty posts in mist and a text card; s05 → s06 is a slow fade out of that card (s06 pre-rolls 30 frames).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, W, H} from '../styles/theme';
import {ShotTrack} from '../components/Camera';
import {Document, Crate} from '../components/Environment';
import {Explosion, Candle, Particles} from '../components/Effects';
import {Trench, TrenchForeground, TRENCH, DUGOUT, DustFall, MistBands} from '../components/env/Trench';
import type {RatSpec} from '../components/env/Trench';
import {stand, slump, seated, addPose, takeCover, hugKnees, tremble, mixPose, walk, pose} from '../characters/poses';
import {DateCard, FactPill, TermCard, MemorialCard} from '../components/Text';
import {prog, easeOut, easeInOut, clamp, lerp} from '../animations/core';
import {sec, Fig, Shot, ck} from './kit';
import {HelmetPost, GroundMist} from './kit-ep02';

const {b, cut} = sec('s05');
const T1 = cut(2); // 293 S05-01 → 02 (CUT)
const T2 = cut(4); // 620 → 03 (FADE)
const T3 = cut(7); // 1176 → 04 (DIP)
const T4 = cut(8); // 1446 → 05 (CUT)
const END = 1800;

// ---------------------------------------------------------------- S05-01 rain on the firestep → crane up into the cutaway diagram
const CRANE = b.at(1); // 119 (≈264.1 s)
const RotationShot: React.FC<{f: number}> = ({f}) => {
  const k = prog(f, CRANE - 8, CRANE + 34, easeInOut);
  return (
    <Shot f={f} bg="#9AA0A0" keys={ck([0, 1.14, 900, 640], [CRANE - 8, 1.1, 960, 600], [CRANE + 34, 1.0, 960, 540], [T1, 1.04, 990, 560])}>
      {k < 1 && (
        <g transform={`translate(0,${560 * k})`} opacity={1 - k * 0.6}>
          <Trench f={f} variant="a" id="s0501" precip={0.9} />
          {[[560, 1], [1180, -1], [1420, 1]].map(([x, d], i) => (
            <Fig key={i} k="britSoldier1916" x={x} y={TRENCH.firestepY} f={f} s={1} dir={d as 1 | -1} pose={addPose(slump(f, i), {lean: 14, headTilt: 10})} expr="tired" seed={i + 4} />
          ))}
          {/* sentry at the box periscope */}
          <Fig k="britSoldier1916" x={TRENCH.periscopeX + 42} y={TRENCH.floorY} f={f} s={1} dir={-1} pose={addPose(stand(f, 7), {shR: 150, elR: 30, headTilt: -6})} expr="tired" seed={11} />
          <TrenchForeground f={f} rain={0.8} />
        </g>
      )}
      {k > 0 && (
        <g transform={`translate(0,${-420 * (1 - k)})`} opacity={k}>
          <Trench f={f} variant="f" id="s0501c" draw={prog(f, CRANE, CRANE + 60)} labels={prog(f, b.at(1) + 30, b.at(1) + 70)} />
          <Particles f={f} kind="rain" n={50} seed={3} wind={-0.6} opacity={0.35} />
        </g>
      )}
    </Shot>
  );
};

// ---------------------------------------------------------------- S05-02 lice, rats, trench foot
const PUSH = b.at(3); // 472
const CLIMB = 520;
const SEATED = 548;
const SOCKS = 570;
/** Keyed rats (rat-scurry SFX at 273.0 / 274.6 s): progress z across the frame, shown only while running. */
const keyedRats = (list: [RatSpec['lane'], number, 1 | -1][]): RatSpec[] =>
  list.filter(([, z]) => z > 0 && z < 1).map(([lane, z, dir]) => ({lane, t: dir === 1 ? z : 1 - z, dir}));
const Socks: React.FC = () => (
  <g>
    <path d="M0,-10 L22,-10 L22,10 L34,18 L30,26 L4,22 L0,10Z" fill="#F2EEE2" stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
  </g>
);
const FootShot: React.FC<{f: number}> = ({f}) => {
  const z1 = prog(f, 380, 440, (t) => t);
  const z2 = prog(f, 392, 470, (t) => t);
  const z3 = prog(f, 428, 500, (t) => t);
  const rats = keyedRats([['firestep', z1, -1], ['firestep', z2, -1], ['parapet', z3, 1]]);
  // the man in the water climbs out and sits on a crate on the firestep
  const climb = prog(f, CLIMB, SEATED, easeInOut);
  const mx = lerp(740, 820, climb);
  const my = lerp(TRENCH.floorY, TRENCH.firestepY, climb);
  const seatedNow = f >= SEATED;
  const manPose = seatedNow ? addPose(seated(f, 2), {lean: 24, shL: 50, elL: 20, shR: 58, elR: 22, headTilt: 14}) : climb > 0 ? walk(f / 8) : addPose(stand(f, 2), {headTilt: 10, lean: 6});
  const give = prog(f, SOCKS - 20, SOCKS, easeOut);
  const candleArm = Math.sin(f / 9) * 18;
  return (
    <Shot f={f} bg="#8A8C86" keys={ck([T1, 1.08, 1300, 580], [PUSH - 10, 1.08, 1000, 590], [PUSH + 30, 1.22, 830, 640], [T2, 1.25, 840, 650])} drift={0.8}>
      <Trench f={f} view="trench" weather="rain" time="grey" precip={0.5} sump={1} dugoutEntrance curtain={0.2} rats={rats} ladders={[420]} periscope={false} id="s0502" />
      {/* a man runs a candle along the seams of his tunic (lice), seriously */}
      <Fig
        k="britSoldier1916"
        x={1180}
        y={TRENCH.firestepY}
        f={f}
        s={1}
        dir={-1}
        pose={addPose(seated(f, 1), {shR: 62 + candleArm, elR: 96, shL: 40, elL: 70, headTilt: 18})}
        holdR={<Candle x={0} y={8} f={f} s={0.32} seed={3} />}
        expr="tired"
        seed={21}
      />
      <Crate x={820} y={TRENCH.firestepY} s={0.9} />
      {/* his mate brings dry socks */}
      <Fig k="britSoldier1916" x={lerp(1060, 990, give)} y={TRENCH.firestepY} f={f} s={1} dir={-1} pose={addPose(f > SOCKS - 30 ? stand(f, 4) : walk(f / 12), {shR: 75 * give, elR: 10 * give})} holdR={f > SOCKS - 30 ? <Socks /> : undefined} expr="sad" seed={22} opacity={prog(f, SOCKS - 70, SOCKS - 40)} />
      <Fig k="britSoldier1916" x={mx} y={my} f={f} s={1} dir={1} pose={manPose} expr="sad" seed={23} />
      <TrenchForeground f={f} flood={0.85} rain={0.5} />
    </Shot>
  );
};

// ---------------------------------------------------------------- S05-03 shellfire → the gas cloud (high, wide, no figures) → masks
const B5 = b.at(5) - 6; // 716 high wide
const B6 = cut(6); // 916 cut-in to the masks
const BURSTS = [632, 662, 694];
const GasCloud: React.FC<{f: number; t: number}> = ({f, t}) => {
  // a low green-yellow cloud rolling from the far line towards us with the wind (right → left drift)
  const front = lerp(400, 820, t);
  return (
    <g opacity={clamp(t * 6) * 0.9}>
      {Array.from({length: 26}).map((_, i) => {
        const row = i % 4;
        const x = ((i * 157) % 2200) - 140 - f * 0.25 - row * 30;
        const y = front - row * 70 + Math.sin(f / 40 + i) * 8;
        const rx = 160 + (i % 5) * 30 + 60 * t;
        if (y < 392) return null;
        return <ellipse key={i} cx={x} cy={y} rx={rx} ry={42 + row * 6 + 20 * t} fill="#B8B860" opacity={0.28 + 0.06 * (3 - row)} />;
      })}
    </g>
  );
};
const MASKERS = [700, 960, 1220];
const GasShot: React.FC<{f: number}> = ({f}) => {
  const burst = BURSTS.reduce((a, at) => Math.max(a, f >= at && f < at + 14 ? 1 - (f - at) / 14 : 0), 0);
  const toWide = prog(f, B5, B5 + 24);
  const masks = f >= B6;
  const shake = 6 * burst;
  return (
    <Shot
      f={f}
      bg="#A9ACA6"
      shake={shake}
      keys={masks ? ck([B6, 1.12, 960, 640], [T3, 1.24, 960, 620]) : ck([T2, 1.06, 960, 560], [B5, 1.06, 960, 560], [B5 + 24, 1.12, 960, 720], [B6, 1.0, 960, 520])}
      sombre={masks ? 0.15 : 0.25 * toWide}
    >
      {!masks && toWide < 1 && (
        <g opacity={1 - toWide}>
          <Trench f={f} view="trench" weather="clear" time="grey" id="s0503a" />
          {BURSTS.map((at, i) => (
            <Explosion key={i} x={[420, 1200, 1620][i]} y={430} f={f} at={at} s={0.38} dur={40} seed={i + 2} />
          ))}
          {[560, 860, 1160, 1460].map((x, i) => {
            const duck = prog(f, BURSTS[0] + 4 + i * 3, BURSTS[0] + 18 + i * 3, easeOut);
            return <Fig key={i} k="britSoldier1916" x={x} y={lerp(TRENCH.firestepY, TRENCH.floorY, duck)} f={f} s={1} dir={i % 2 ? -1 : 1} pose={mixPose(stand(f, i), takeCover(f, i), duck)} expr={duck > 0.5 ? 'scared' : 'neutral'} seed={i + 40} />;
          })}
          <DustFall progress={prog(f, 651, 705)} x0={200} x1={1720} y0={TRENCH.crestY} y1={TRENCH.floorY} />
        </g>
      )}
      {!masks && toWide > 0 && (
        <g opacity={toWide}>
          <Trench f={f} view="nomansland" weather="clear" time="grey" mist={0.25} id="s0503b" />
          <GasCloud f={f} t={prog(f, B5, B6 + 60, (t) => t)} />
        </g>
      )}
      {masks && (
        <g>
          <Trench f={f} view="trench" weather="clear" time="grey" mist={0.3} id="s0503c" />
          <g opacity={0.5}>
            <MistBands f={f} y0={260} y1={460} amount={0.6} color="#C8C890" />
          </g>
          {MASKERS.map((x, i) => {
            const on = b.at(6) + i * 8;
            const lift = prog(f, on - 18, on, easeOut) * (1 - prog(f, on + 14, on + 30));
            const masked = f >= on + 2;
            const stand2 = prog(f, 1040 + i * 12, 1070 + i * 12, easeInOut);
            return (
              <Fig
                key={i}
                k={masked ? 'britGasMask' : 'britSoldier1916'}
                x={x}
                y={lerp(TRENCH.floorY, TRENCH.firestepY, stand2)}
                f={f}
                s={1}
                dir={i % 2 ? -1 : 1}
                pose={addPose(stand(f, i), {shR: 150 * lift, elR: 100 * lift, shL: 140 * lift, elL: 100 * lift})}
                expr="determined"
                seed={i + 45}
              />
            );
          })}
        </g>
      )}
    </Shot>
  );
};

// ---------------------------------------------------------------- S05-04 the dugout: shell shock
const THUD = 1218; // 300.6 s
const WRAP = 1262;
const DugoutShot: React.FC<{f: number}> = ({f}) => {
  const k = prog(f, WRAP, WRAP + 30, easeInOut);
  const arm = prog(f, WRAP - 20, WRAP + 10, easeInOut);
  return (
    <Shot f={f} bg="#2A2018" keys={ck([T3, 1.0, 960, 560], [T4, 1.05, 820, 600])} drift={0.5} vignette={0.5}>
      <Trench f={f} view="dugout" dust={prog(f, THUD, THUD + 50)} id="s0504" />
      {/* the older comrade sits beside him and stays */}
      <Fig k="britSoldier1914" x={640} y={DUGOUT.bunkSeatY + 64} f={f * 0.6} s={1} dir={1} turn={0.3} pose={addPose(seated(f, 3), {shR: 96 * arm, elR: 30 * arm, headTilt: 10})} expr="sad" seed={51} />
      {/* the young soldier: knees drawn up, staring, hands trembling */}
      <Fig
        k="britSoldier1916"
        x={820}
        y={DUGOUT.bunkSeatY}
        f={f * 0.6}
        s={1}
        dir={1}
        turn={0.2}
        pose={tremble(hugKnees(f), f, 1 - 0.4 * k)}
        expr="stare"
        seed={52}
        overlayFront={
          k > 0
            ? (sk) => (
                <path
                  d={`M${sk.sh.x - 50},${sk.sh.y + 6 - 24 * (1 - k)} Q${sk.sh.x},${sk.sh.y - 26 - 24 * (1 - k)} ${sk.sh.x + 52},${sk.sh.y + 4 - 24 * (1 - k)} L${sk.sh.x + 62},${sk.sh.y + 104} Q${sk.sh.x},${sk.sh.y + 118} ${sk.sh.x - 60},${sk.sh.y + 104}Z`}
                  fill="#7A6A5A"
                  stroke={C.ink}
                  strokeWidth={4}
                  strokeLinejoin="round"
                  opacity={k}
                />
              )
            : undefined
        }
      />
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#1A140E" opacity={0.16} />
    </Shot>
  );
};

// ---------------------------------------------------------------- S05-05 empty posts in dawn mist; the 2006 pardon
const PARDON = 1677; // ≈315.9 s
const PostsShot: React.FC<{f: number}> = ({f}) => {
  const fall = prog(f, PARDON - 40, PARDON + 30, easeOut);
  const dx = lerp(1420, 1250, fall);
  const dy = lerp(240, 840, fall);
  const rot = (1 - fall) * 26 * Math.sin(f / 14);
  const fog = prog(f, PARDON, PARDON + 50);
  return (
    <Shot f={f} bg="#C9CCC6" keys={ck([T4, 1.1, 760, 600], [PARDON, 1.12, 1000, 580], [PARDON + 60, 1.25, 1250, 700], [END, 1.26, 1250, 705])} sombre={0.7} vignette={0.5} drift={0.5}>
      <rect x={-400} y={-300} width={3000} height={980} fill="#A7ABAC" />
      <rect x={-400} y={600} width={3000} height={900} fill="#8E9282" />
      <GroundMist f={f * 0.6} y0={560} y1={680} amount={1} />
      {/* a single row of plain posts receding into the mist */}
      {Array.from({length: 13}).map((_, i) => {
        const t = i / 12;
        return <HelmetPost key={i} x={lerp(240, 1760, t)} y={lerp(900, 640, Math.pow(t, 0.7))} h={240} s={lerp(1.0, 0.32, Math.pow(t, 0.6))} tone="#7E7464" />;
      })}
      <GroundMist f={f * 0.6 + 300} y0={640} y1={880} amount={0.9} />
      <rect x={-400} y={-300} width={3000} height={1600} fill="#E6E6E0" opacity={0.35 * fog} />
      {/* foreground desk top */}
      <path d="M-200,1010 L700,790 L2400,790 L2400,1400 L-200,1400Z" fill="#7A5A3A" stroke={C.ink} strokeWidth={5} />
      <path d="M700,790 L2400,790" stroke="#9A7650" strokeWidth={6} />
      {f > PARDON - 42 && <Document x={dx} y={dy} w={200} h={250} title="PARDON" stamp="2006" rot={-6 + rot} lines={5} />}
    </Shot>
  );
};

export const S05Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: 0, to: T1, el: <RotationShot f={f} />},
      {from: T1, to: T2, el: <FootShot f={f} />, trans: 'cut'},
      {from: T2, to: T3, el: <GasShot f={f} />, trans: 'fade'},
      {from: T3, to: T4, el: <DugoutShot f={f} />, trans: 'dip'},
      {from: T4, to: END, el: <PostsShot f={f} />, trans: 'cut'},
    ]}
  />
);

const sx = (t: number) => Math.round((t - 260) * 30);
export const S05Overlay: React.FC = () => {
  useCurrentFrame();
  return (
    <g>
      <FactPill at={sx(266.3)} until={sx(270.0)} text="A FEW DAYS AT A TIME" x={1860} y={440} anchor="end" size={42} />
      <TermCard at={sx(276.5)} until={sx(280.5)} term="TRENCH FOOT" meaning="feet swollen and rotting after long hours in cold water" />
      <DateCard at={sx(284.9)} until={sx(290.5)} date="APRIL 1915" title="YPRES" sub="first large-scale gas attack" />
      <FactPill at={sx(294.1)} until={sx(298.8)} text="FEARED MORE THAN IT KILLED" x={1860} y={560} anchor="end" size={42} />
      <FactPill at={sx(300.2)} until={sx(308.1)} text="SHELL SHOCK: ABOUT 80,000 RECORDED CASES · BRITISH ARMY" sub="many more unrecorded" x={1860} y={340} anchor="end" size={38} maxW={700} />
      {/* held to the end of the section: s06 fades in over it (slow fade out of the executions card) */}
      <MemorialCard
        at={sx(309.1)}
        until={END}
        heading="306 BRITISH AND COMMONWEALTH SOLDIERS EXECUTED"
        lines={[
          {text: 'mostly for desertion or cowardice', at: sx(309.1) + 40},
          {text: 'PARDONED IN 2006', at: PARDON},
        ]}
        y={330}
      />
    </g>
  );
};

void H;
void pose;
