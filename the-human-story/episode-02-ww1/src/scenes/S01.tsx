// s01 — Cold open: Two Shots, One Wrong Turn (0–35 s, frames 0–1049). Storyboard S01-01 … S01-04. No chapter banner.
// Sarajevo: no gun is shown; two off-screen reports (sync frames 405 / 417) and pigeons scattering carry the moment.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack} from '../components/Camera';
import {HistoryRoom, Chalk, Birds} from '../components/Environment';
import {Particles, SombreGrade} from '../components/Effects';
import {Crowd} from '../characters/Crowd';
import {shrug, point, mixPose, walk, stand, seated} from '../characters/poses';
import {Globe, camLerp} from '../maps/GeoMap';
import {MapEurope1914} from '../maps/MapsWW1';
import {DateCard, BigTitle, FactPill} from '../components/Text';
import {prog, easeOut, easeIn, clamp} from '../animations/core';
import {sec, Fig, Shot, ck} from './kit';
import {CarParty, PigeonBurst, TimedTag, HelmetPost, StrikeList, SarajevoStreet, GroundMist} from './kit-ep02';

const {b, cut} = sec('s01');
const T1 = b.at(2) - 13; // 294: S01-01 → S01-02 (car stall SFX at 9.85 s = frame 296)
const T2 = cut(5); // 550: → S01-03 (DIP)
const T3 = cut(6); // 746: → S01-04 (WIPE)
const SHOT1 = 405; // first pistol report (sfx-cues syncPoints 13.5 s); second at 417
const MAP = b.at(4) - 4; // 444: street → map MATCH (≈14.8 s)
const PUSH = 834; // 27.8 s: push into the "?"
const TITLE = 858; // title picture (BigTitle from 843 in the overlay)
const END = 1050;

const CIVILIANS = ['man1', 'man2', 'man3', 'woman1', 'woman2', 'woman3'];

// ---------------------------------------------------------------- S01-01 Sarajevo riverside street, the car and the wrong turn
const carX1 = (f: number) => (f < 200 ? 240 + f * 5.6 : 1360 + (f - 200) * 4.2);
const StreetShot: React.FC<{f: number}> = ({f}) => {
  const x = carX1(f);
  const turn = prog(f, 205, 290, easeIn);
  const y = 880 - 70 * turn;
  return (
    <Shot f={f} bg="#8DBBD0" keys={ck([0, 1.0, 760, 560], [200, 1.0, 1520, 560], [T1, 1.04, 1780, 540])}>
      <SarajevoStreet f={f} />
      <Crowd f={f} count={34} x0={-200} x1={3000} yBack={650} yFront={700} scaleBack={0.42} scaleFront={0.55} pool={CIVILIANS} mix={{wave: 3, clap: 1, stand: 1}} expression="happy" randomHats seed={11} />
      {/* side street opening on the right (where the car turns) */}
      <rect x={2140} y={430} width={170} height={270} fill="#8E8A7E" stroke={C.ink} strokeWidth={4} />
      <CarParty f={f} x={x} y={y} dist={x} s={1 - 0.15 * turn} turn={turn} riders={['worker', 'sophie', 'franzFerdinand']} />
      <Birds f={f} n={4} seed={5} y={120} />
      <TimedTag f={f} at={165} until={285} x={x - 70 + 150} y={y - 330} text="ARCHDUKE FRANZ FERDINAND" sub="heir to Austria-Hungary" />
      <TimedTag f={f} at={165} until={285} x={x - 150 - 160} y={y - 260} text="SOPHIE" sub="his wife" />
    </Shot>
  );
};

// ---------------------------------------------------------------- S01-02 side-street corner: stall, Princip, two shots, pigeons → map
const CornerShot: React.FC<{f: number}> = ({f}) => {
  const stall = prog(f, T1 + 2, T1 + 40);
  const dusk = prog(f, SHOT1 + 6, MAP + 6);
  const mapO = prog(f, MAP - 6, MAP + 18);
  const cam = camLerp({lon: 15, lat: 49.5, zoom: 1.4}, {lon: 14, lat: 50, zoom: 1.0}, prog(f, MAP, b.endOf(4)));
  const look = f > T1 + 40; // Princip turns his head towards the car
  return (
    <Shot
      f={f}
      bg="#8DBBD0"
      keys={ck([T1, 1.05, 940, 600], [b.at(3) - 4, 1.22, 1000, 640], [b.at(3) + 6, 1.22, 1000, 600], [b.at(3) + 30, 1.1, 1000, -120], [MAP + 20, 1.1, 1000, -200])}
      over={
        mapO > 0 ? (
          <g opacity={mapO}>
            <MapEurope1914 f={f} idSuffix="-s01" cam={cam} flash={5 * prog(f, b.at(4), b.endOf(4) - 10)} />
          </g>
        ) : undefined
      }
    >
      <SarajevoStreet f={f} base={760} road={800} quay={false} seed={34} x0={-200} x1={2400} />
      {/* café awning on the corner */}
      <g>
        <path d="M1380,548 L1700,548 L1730,592 L1350,592Z" fill="#B23A2E" stroke={C.ink} strokeWidth={4} />
        {Array.from({length: 13}).map((_, i) => (
          <path key={i} d={`M${1350 + i * 30},592 q15,16 30,0`} fill="#B23A2E" stroke={C.ink} strokeWidth={3} />
        ))}
        <text x={1540} y={580} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={30} fill="#F4EBD6">
          CAFÉ
        </text>
      </g>
      <PigeonBurst f={f} at={SHOT1 + 2} x={1100} y={330} n={20} spread={900} seed={4} />
      {/* pavement crowd: a few onlookers, Princip among them (back three-quarters, hands at his sides, no gun) */}
      {[1180, 1530, 1640].map((px, i) => (
        <Fig key={i} k={CIVILIANS[(i * 2 + 1) % 6]} x={px} y={790} f={f} s={0.82} dir={-1} pose={stand(f, i + 4)} seed={40 + i} expr="neutral" />
      ))}
      <Fig k="princip" x={1340} y={800} f={f} s={0.86} dir={look ? -1 : 1} turn={look ? -0.1 : -0.4} pose={stand(f, 2)} expr="neutral" />
      <CarParty f={f} x={760} y={930} dist={760 + 40 * (1 - stall)} stall={stall} running={stall < 0.6} riders={['worker', 'sophie', 'franzFerdinand']} wave={false} poses={[seated(f, 1), seated(f, 2), seated(f, 3)]} expr={['neutral', 'neutral', 'neutral']} />
      <TimedTag f={f} at={T1 + 6} until={b.endOf(2) + 6} x={1340} y={560} text="GAVRILO PRINCIP" sub="Bosnian Serb, aged 19" />
      {/* the sky dims to dusk */}
      <rect x={-600} y={-1200} width={3600} height={2600} fill="#3A3550" opacity={0.45 * dusk} />
    </Shot>
  );
};

// ---------------------------------------------------------------- S01-03 misty dawn field, posts with empty helmets of every army
const HELMETS = ['britSoldier1916', 'frenchSoldier1915', 'germanSoldier1914', 'germanSoldier1916', 'russianSoldier', 'austroSoldier', 'ottomanSoldier'];
const PostsShot: React.FC<{f: number}> = ({f}) => {
  const t = f - T2;
  return (
    <Shot f={f} bg="#C9CCC6" keys={ck([T2, 1.06, 1500, 560], [T3, 1.06, 1100, 530])} sombre={0.55} vignette={0.5}>
      <rect x={-400} y={-300} width={3000} height={980} fill="#D3D2C8" />
      <rect x={-400} y={560} width={3000} height={900} fill="#8E9378" />
      <path d="M-400,600 Q400,560 1200,590 T2600,580 L2600,640 L-400,640Z" fill="#9EA288" />
      {/* receding rows of plain posts in the mist */}
      {[0, 1, 2].map((row) => (
        <g key={row} opacity={0.35 + row * 0.1}>
          {Array.from({length: 14}).map((_, i) => (
            <HelmetPost key={i} x={-200 + i * 200 + row * 70} y={610 + row * 25} h={90 + row * 20} s={0.5 + row * 0.08} tone="#8A8070" />
          ))}
        </g>
      ))}
      <GroundMist f={f} y0={560} y1={700} amount={0.9} />
      {HELMETS.map((k, i) => (
        <HelmetPost key={k} x={420 + i * 290} y={860} h={210} k={k} />
      ))}
      <GroundMist f={f + 400} y0={760} y1={900} amount={0.8} />
      <Particles f={f} kind="dust" n={50} seed={6} speed={0.6} opacity={0.6} />
      <g transform={`translate(${-t * 1.2},0)`}>
        <Birds f={f} n={1} seed={9} y={160} />
      </g>
    </Shot>
  );
};

// ---------------------------------------------------------------- S01-04 history room: the Guide's question → title
const RoomShot: React.FC<{f: number}> = ({f}) => {
  const b6 = b.at(6), b7 = b.at(7);
  const turnT = prog(f, b7, b7 + 10);
  const aside = prog(f, PUSH - 10, PUSH + 16);
  const pose = f < b7 ? shrug(f) : aside > 0 ? mixPose(point(f, 115), walk(aside * 1.2), aside) : mixPose(shrug(f), point(f, 112), turnT);
  const dark = prog(f, PUSH + 8, TITLE + 4);
  return (
    <Shot f={f} bg={C.wallYellow} keys={ck([T3, 1.0, W / 2, H / 2], [PUSH, 1.1, W / 2 + 40, H / 2 - 10], [TITLE + 6, 3.4, 1150, 430])}>
      <HistoryRoom
        f={f}
        board={
          <g>
            <Chalk x={830} y={460} text="1914" size={120} reveal={prog(f, 794, 806)} />
            <Chalk x={1010} y={455} text="→" size={110} reveal={prog(f, 809, 813)} />
            <Chalk x={1150} y={465} text="?" size={150} reveal={prog(f, 814, 818)} />
            <Chalk x={1290} y={455} text="→" size={110} reveal={prog(f, 822, 825)} />
            <Chalk x={1470} y={460} text="1918" size={120} reveal={prog(f, 826, 834)} />
          </g>
        }
      />
      <Fig k="guide" x={360 - 150 * aside} y={900} f={f} s={1.55} pose={pose} expr={f < b7 ? 'worried' : 'curious'} talking={(f >= b6 && f < b.endOf(6)) || (f >= b7 && f < b.endOf(7))} turn={f < b7 ? 0.1 : 0.45} dir={1} />
      <rect x={-500} y={-500} width={3000} height={2200} fill={C.deepNavy} opacity={dark} />
    </Shot>
  );
};

const TitleShot: React.FC<{f: number}> = ({f}) => {
  const t = f - TITLE;
  const z = 1 + 0.03 * prog(t, 0, END - TITLE);
  return (
    <Shot f={f} bg={C.deepNavy} vignette={0.4}>
      <g transform={`translate(${W / 2},${H / 2}) scale(${z}) translate(${-W / 2},${-H / 2})`}>
        <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={C.deepNavy} />
        <g opacity={0.3}>
          <Globe f={f} lon={14 + t * 0.12} lat={38} r={640} cx={W / 2} cy={H + 280} />
        </g>
        <Particles f={f} kind="dust" n={36} seed={8} opacity={0.4} />
      </g>
    </Shot>
  );
};

export const S01Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: 0, to: T1, el: <StreetShot f={f} />},
      {from: T1, to: T2, el: <CornerShot f={f} />, trans: 'cut'},
      {from: T2, to: T3, el: <PostsShot f={f} />, trans: 'dip'},
      {from: T3, to: TITLE, el: <RoomShot f={f} />, trans: 'wipe'},
      {from: TITLE, to: END, el: <TitleShot f={f} />, trans: 'fade'},
    ]}
  />
);

export const S01Overlay: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <g>
      <DateCard at={42} until={225} date="28 JUNE 1914" title="SARAJEVO" />
      <FactPill at={570} until={735} text="AROUND 9–10 MILLION SOLDIERS DEAD (EST.)" x={1860} y={400} anchor="end" size={38} maxW={760} />
      <StrikeList f={f} at={639} until={741} heading="4 EMPIRES FALL" lines={['German', 'Austro-Hungarian', 'Russian', 'Ottoman']} x={640} y={170} strikeAt={672} strikeStep={14} />
      <BigTitle at={843} until={1038} text="THE HUMAN STORY" size={140} y={500} />
      <g opacity={prog(f, 866, 884) * (1 - prog(f, 1026, 1038))}>
        <text x={W / 2} y={612} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={66} fill={C.dustyYellow} stroke={C.ink} strokeWidth={5} paintOrder="stroke" letterSpacing={2}>
          Episode 2: World War I
        </text>
      </g>
      <text x={W / 2} y={706} textAnchor="middle" fontFamily={FONT.sans} fontWeight={600} fontStyle="italic" fontSize={46} fill="#E8E1CF" opacity={prog(f, 890, 910) * (1 - prog(f, 1026, 1038))}>
        From Start to Finish
      </text>
      {/* fade up from black (0.5 s) */}
      <rect x={0} y={0} width={W} height={H} fill="#000" opacity={1 - prog(f, 0, 15)} />
    </g>
  );
};

void H;
void clamp;
void easeOut;
void SombreGrade;
