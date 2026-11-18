// s09 — Chapter 8: 1917: The Turning Year (500–560 s, 1,800 frames). Storyboard S09-01 … S09-06 (ep02, editor B).
// The U-boat war (periscope, torpedo wake, distant water column; no people) · codebreakers and the Zimmermann
// telegram · the newspaper → US troops land in France (whip pan) · Passchendaele (mud, duckboards, nobody hit) ·
// the Tsar abdicates (plain red banners outside) · Lenin → M-03 Brest-Litovsk (map match).
import React from 'react';
import {useCurrentFrame as useFrame} from 'remotion';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack, Camera} from '../components/Camera';
import {Sky, Ground, Clouds, Sea, Interior, Building, Flag, StreetLamp} from '../components/Environment';
import {Particles, Smoke} from '../components/Effects';
import {Ship, Truck, Newspaper} from '../components/Vehicles';
import {Periscope, TorpedoWake, WaterColumn} from '../components/VehiclesWW1';
import {Trench, MUD, MistBands} from '../components/env/Trench';
import {MapEasternFront, CAM_EF} from '../maps/MapsWW1';
import {camLerp} from '../maps/GeoMap';
import {walk, stand, seated, signDocument, orate, talkGesture, holdFront, point, addPose, mixPose, kneel, wave, cheer} from '../characters/poses';
import {Pen, DocumentOnTable, RifleSlung} from '../characters/props';
import {CAST, castWith} from '../characters/cast';
import {StickFigure, GroupTag} from '../characters/StickFigure';
import {DateCard, FactPill} from '../components/Text';
import {prog, clamp, lerp, easeInOut, easeOut} from '../animations/core';
import {sec, Fig, Shot, ck, PlainBanner, fio} from './kit';
import {OLabel, Telegram, WhipPan} from './kit-b';

const {b, cut, abs} = sec('s09');
const END = b.dur; // 1800
// Shot boundaries (section-local frames), snapped to beats; S09-06 starts 0.8 s into b6 (storyboard).
const T = [0, cut(2), cut(3), cut(4), cut(5), abs(550.0), END];
const ink = C.ink;

// ------------------------------------------------------------ S09-01 grey Atlantic: periscope, torpedo wake, the freighter lists
const HIT = abs(507.6); // torpedo reaches the hull
const shipX = (f: number) => (f < HIT ? 380 + f * 0.9 : 380 + HIT * 0.9 + (f - HIT) * 0.9 * Math.max(0.15, 1 - (f - HIT) / 90));
const UBoat: React.FC<{f: number}> = ({f}) => {
  const launch = abs(505.4);
  const perX = (g: number) => 1560 - g * 0.35;
  const x0 = perX(launch);
  const hx = shipX(HIT) + 20;
  const list = prog(f, HIT + 15, T[1], easeInOut) * 7;
  return (
    <Shot f={f} bg="#5E6A74" keys={ck([0, 1.12, 1180, 640], [HIT - 30, 1.08, 1000, 610], [T[1], 1.04, 900, 590])}>
      <Sky top="#4A5562" bottom="#B8A898" />
      <Clouds f={f} n={5} seed={91} speed={0.3} yMin={60} yMax={300} color="#8A929A" />
      <rect x={-200} y={420} width={W + 400} height={150} fill="#9A9690" opacity={0.25} />
      <WaterColumn x={hx} y={584} progress={prog(f, HIT, HIT + 75)} s={0.9} />
      <g transform={`rotate(${list},${shipX(f)},590)`}>
        <Ship x={shipX(f)} y={572} f={f} s={0.78} kind="freighter" seed={4} />
      </g>
      <Sea y={585} f={f} colors={['#5A6C78', '#4C5E6A', '#3E4E5A']} amp={10} speed={0.8} />
      <TorpedoWake x0={x0 - 40} y0={845} x1={hx} y1={600} progress={prog(f, launch, HIT, (t) => t)} fade={prog(f, HIT + 10, HIT + 70)} f={f} />
      <Periscope x={perX(f)} y={850} f={f} s={1.15} dir={-1} height={prog(f, 20, 70) * (1 - prog(f, HIT + 40, T[1] - 10) * 0.9)} />
      <Particles f={f} kind="rain" n={30} seed={12} wind={-0.4} opacity={0.35} />
    </Shot>
  );
};

// ------------------------------------------------------------ S09-02 codebreakers: the Zimmermann telegram
const GROUPS = ['13042 13401 8501', '67893 14218', '5905 11311 10392'];
const WORDS = ['ALLIANCE', 'MEXICO', 'IF AMERICA JOINS THE WAR'];
const Codebreakers: React.FC<{f: number}> = ({f}) => {
  const t = f - T[1];
  const morph = [prog(f, abs(515.3), abs(515.9)), prog(f, abs(516.6), abs(517.2)), prog(f, abs(517.6), abs(518.3))];
  const lookUp = prog(f, abs(518.4), abs(518.9));
  const lamp = 0.85 + 0.05 * Math.sin(f / 23);
  const strip = (t * 2.2) % 420;
  return (
    <Shot f={f} bg="#4A4438" keys={ck([T[1], 1.0, 960, 520], [abs(512.6), 1.0, 940, 560], [abs(515.0), 1.5, 830, 810], [T[2], 1.58, 830, 820])}>
      <Interior wall="#7A7060" floor="#4E4234" floorY={760} />
      {/* filing cabinets and a blacked-out window */}
      {[100, 260].map((x) => (
        <g key={x}>
          <rect x={x} y={360} width={140} height={400} fill="#6A6658" stroke={ink} strokeWidth={4} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={x + 30} y={390 + i * 95} width={80} height={14} rx={4} fill="#3A3A34" />)}
        </g>
      ))}
      <rect x={1480} y={170} width={300} height={330} fill="#232A38" stroke={ink} strokeWidth={6} />
      <line x1={1630} y1={170} x2={1630} y2={500} stroke={ink} strokeWidth={4} />
      {/* desk lamp glow */}
      <ellipse cx={960} cy={640} rx={720} ry={260} fill="#F4D98A" opacity={0.18 * lamp} />
      {/* three codebreakers behind the desk */}
      <Fig k="man2" x={560} y={760} f={f} s={0.95} dir={1} pose={addPose(holdFront(f, 1), {headTilt: lerp(14, -4, lookUp)})} expr={lookUp > 0.5 ? 'surprised' : 'neutral'} />
      <Fig k="woman1" x={960} y={760} f={f + 11} s={0.95} dir={lookUp > 0.5 ? -1 : 1} pose={addPose(point(f, lerp(150, 120, Math.abs(Math.sin(f / 14)))), {headTilt: lerp(18, -2, lookUp)})} expr={lookUp > 0.5 ? 'surprised' : 'determined'} />
      <Fig k="man3" x={1360} y={760} f={f + 5} s={0.95} dir={-1} head={{...CAST.man3.head, hair: 'short', hairColor: '#4A3426', expression: lookUp > 0.5 ? 'surprised' : 'neutral'}} pose={addPose(holdFront(f, 3), {headTilt: lerp(14, -4, lookUp)})} expr={lookUp > 0.5 ? 'surprised' : 'neutral'} />
      {/* the desk */}
      <rect x={220} y={640} width={1480} height={40} fill="#7A5A3A" stroke={ink} strokeWidth={5} />
      <rect x={250} y={680} width={1420} height={180} fill="#5E4430" stroke={ink} strokeWidth={5} />
      {/* lamp */}
      <path d="M1440,640 L1460,520 L1520,500" fill="none" stroke={ink} strokeWidth={8} />
      <path d="M1490,470 L1590,500 L1560,540 L1470,520Z" fill="#2F4A3A" stroke={ink} strokeWidth={4} />
      {/* paper strips passing along the desk */}
      {[0, 1].map((i) => (
        <rect key={i} x={380 + ((strip + i * 210) % 420) * 2.2} y={612 - (i % 2) * 6} width={120} height={22} fill="#EFE6CC" stroke={ink} strokeWidth={2.5} opacity={fio(t, 0, abs(514.5) - T[1])} />
      ))}
      <rect x={300} y={600} width={160} height={36} fill="#D8CDB0" stroke={ink} strokeWidth={2.5} />
      <rect x={1240} y={596} width={150} height={40} fill="#E2D8BE" stroke={ink} strokeWidth={2.5} transform="rotate(4,1315,616)" />
      {/* the telegram (top view, on the desk front) */}
      <Telegram x={560} y={662} s={0.6} morph={morph} groups={GROUPS} words={WORDS} />
      {/* pencil circling */}
      <g transform={`translate(${830 + Math.cos(f / 6) * 60},${730 + Math.sin(f / 6) * 26}) rotate(30)`} opacity={1 - prog(f, abs(518.2), abs(518.6))}>
        <rect x={-6} y={-70} width={12} height={70} fill="#E3B23C" stroke={ink} strokeWidth={2.5} />
        <path d="M-6,0 L0,14 L6,0Z" fill="#3A3A3A" />
      </g>
    </Shot>
  );
};

// ------------------------------------------------------------ S09-03 the newspaper → US troops land in France (whip pan)
const WHIP = abs(526.6);
const DeskPaper: React.FC<{f: number}> = ({f}) => {
  const t = f - T[2];
  const spin = prog(t, 0, 22, easeOut);
  return (
    <Camera f={f} keys={[[T[2], 1.0, 960, 540], [WHIP, 1.12, 960, 520]]}>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#6A4A30" />
      {Array.from({length: 9}).map((_, i) => <path key={i} d={`M-200,${80 + i * 130} Q960,${60 + i * 130 + (i % 2) * 30} 2200,${90 + i * 130}`} stroke="#5A3E28" strokeWidth={6} fill="none" />)}
      <ellipse cx={1460} cy={260} rx={150} ry={150} fill="#F4D98A" opacity={0.18} />
      <g transform={`translate(1520,820) rotate(-20)`}>
        <rect x={-60} y={-40} width={120} height={80} rx={6} fill="#8A7A6A" stroke={ink} strokeWidth={3} />
      </g>
      <g transform={`translate(${W / 2},${H / 2 - 20}) rotate(${(1 - spin) * 720 - 4 + Math.sin(f / 50) * 0.6}) scale(${0.15 + 0.85 * spin})`}>
        <rect x={-372} y={-472} width={760} height={960} fill="rgba(0,0,0,0.25)" />
        <g transform="scale(10.6)">
          <Newspaper w={70} h={88} masthead="THE DAILY NEWS" headline="U.S. DECLARES WAR ON GERMANY" date="6 April 1917" />
        </g>
      </g>
    </Camera>
  );
};
const Quay: React.FC<{f: number}> = ({f}) => {
  const t = f - WHIP;
  const gang = (p: number) => [lerp(640, 1060, p), lerp(560, 790, p)] as const;
  return (
    <Camera f={f} keys={[[WHIP, 1.08, 760, 560], [T[3], 1.0, 1100, 540]]}>
      <Sky top="#A9BCC6" bottom="#EFE4CA" />
      <Clouds f={f} n={4} seed={33} speed={0.4} yMin={40} yMax={220} />
      {/* cranes */}
      {[1420, 1760].map((x, i) => (
        <g key={x}>
          <path d={`M${x},760 L${x},230 M${x - 30},760 L${x - 30},260 M${x},250 L${x - 260 + i * 40},200 M${x},250 L${x + 80},280`} stroke="#5A4E44" strokeWidth={10} fill="none" />
          <line x1={x - 220 + i * 40} y1={210} x2={x - 220 + i * 40} y2={430 + Math.sin(f / 30 + i) * 20} stroke={ink} strokeWidth={3} />
          <rect x={x - 250 + i * 40} y={430 + Math.sin(f / 30 + i) * 20} width={60} height={44} fill="#8A6A4A" stroke={ink} strokeWidth={3} />
        </g>
      ))}
      <Sea y={640} f={f} colors={['#6E8A96', '#5E7A86', '#4E6A76']} amp={6} speed={0.5} />
      {/* the troopship (liner) along the quay */}
      <g transform="translate(330,690) scale(2.1)">
        <Ship x={0} y={0} f={f} s={1} kind="liner" seed={7} />
      </g>
      {/* the quay */}
      <rect x={-200} y={790} width={2400} height={400} fill="#A49A88" stroke={ink} strokeWidth={5} />
      <line x1={-200} y1={812} x2={2200} y2={812} stroke="#7E766A" strokeWidth={4} />
      {/* gangway */}
      <path d="M630,552 L1070,786 L1070,800 L630,566Z" fill="#7A5A3A" stroke={ink} strokeWidth={4} />
      <path d="M630,500 L1070,736" stroke={ink} strokeWidth={4} />
      {Array.from({length: 7}).map((_, i) => <line key={i} x1={630 + i * 73} y1={500 + i * 39} x2={630 + i * 73} y2={554 + i * 39} stroke={ink} strokeWidth={3} />)}
      <Flag x={1240} y={490} f={f} kind="us" pole={300} w={150} h={90} seed={2} />
      <Flag x={1560} y={490} f={f + 13} kind="fr" pole={300} w={150} h={90} seed={5} />
      {/* US soldiers file down the gangway, then along the quay */}
      {Array.from({length: 7}).map((_, i) => {
        const p = (t * 0.0042 + i * 0.16) % 1.12;
        let x: number;
        let y: number;
        if (p < 0.62) {
          const g = gang(p / 0.62);
          x = g[0];
          y = g[1] + 4;
        } else {
          x = lerp(1060, 1460, (p - 0.62) / 0.5);
          y = 794 + 60;
        }
        const op = 1 - prog(p, 1.0, 1.1);
        return <Fig key={i} k="usSoldier1918" x={x} y={y} f={f + i * 9} s={0.72} pose={walk((t + i * 23) / 16, 0.6)} expr="determined" back={<RifleSlung />} opacity={op} />;
      })}
      {/* French children and a woman wave; a small band plays */}
      <Fig k="kid1" x={1700} y={900} f={f} s={0.8} dir={-1} pose={wave(f, 1)} expr="joy" />
      <Fig k="kid2" x={1800} y={905} f={f + 7} s={0.8} dir={-1} pose={wave(f + 9, 3)} expr="happy" />
      <Fig k="woman2" x={1880} y={895} f={f} s={0.85} dir={-1} pose={wave(f + 4, 2)} expr="happy" />
      {[0, 1].map((i) => (
        <Fig key={'b' + i} k="frenchSoldier1915" x={150 + i * 130} y={960} f={f + i * 5} s={0.8} dir={1} pose={addPose(stand(f, i), {shR: 70, elR: 70 + Math.sin(f / 6 + i) * 8, shL: 60, elL: 60})} expr="happy"
          overlayFront={(sk) => (i === 0
            ? <g><path d={`M${sk.armR.hx},${sk.armR.hy} l40,-14 l26,-24 l8,30 l-34,8Z`} fill="#D9B44A" stroke={ink} strokeWidth={3} /></g>
            : <circle cx={(sk.armR.hx + sk.armL.hx) / 2} cy={(sk.armR.hy + sk.armL.hy) / 2 + 20} r={34} fill="#B23A2E" stroke={ink} strokeWidth={4} />)} />
      ))}
      <Particles f={f} kind="dust" n={12} seed={44} wind={0.4} opacity={0.25} />
    </Camera>
  );
};
const Landing: React.FC<{f: number}> = ({f}) => (
  <Shot f={f} bg="#6A4A30" drift={0}>
    <WhipPan f={f} p={prog(f, WHIP, WHIP + 18)} a={<DeskPaper f={f} />} b={<Quay f={f} />} />
  </Shot>
);

// ------------------------------------------------------------ S09-04 Passchendaele: duckboards across the mud
const AUS_BRODIE = {...CAST.ausSoldier.head, hat: 'brodie' as const, hatColor: '#5E5A3A', expression: 'tired' as const};
const Mud: React.FC<{f: number}> = ({f}) => {
  const t = f - T[3];
  const slip = abs(537.0) - T[3];
  const crane = abs(538.8);
  const men = ['britSoldier1916', 'canSoldier', 'ausSoldier', 'britSoldier1916', 'canSoldier', 'ausSoldier'];
  return (
    <Shot f={f} bg="#6E6A60" keys={ck([T[3], 1.28, 1180, 760], [crane, 1.26, 980, 740], [crane + 75, 1.04, 960, 560], [T[4], 1.0, 940, 540])} sombre={0.25} drift={0.8}>
      <Trench f={f} variant="d" ripples={1} precip={1.3} id="s09m" />
      {men.map((k, i) => {
        const x = 1500 + i * 150 - t * 0.9;
        const slipping = i === 2 ? clamp((t - slip) / 70) : 0;
        const helpers = (i === 1 || i === 3) && t > slip + 8 && t < slip + 80;
        let pose = addPose(walk((t + i * 17) / 26, 0.45), {lean: 12, headTilt: 10});
        if (i === 2 && slipping > 0 && slipping < 1) pose = mixPose(pose, kneel(f), Math.sin(slipping * Math.PI));
        if (helpers) pose = addPose(stand(f, i), {lean: 16, shL: i === 1 ? 70 : 20, elL: 20, shR: i === 3 ? 70 : 20, elR: 20});
        const pack = (
          <g>
            <RifleSlung />
          </g>
        );
        return (
          <Fig key={i} k={k} x={x} y={MUD.trackY + (i % 2) * 6} f={f + i * 13} s={0.82} dir={-1} pose={pose} expr="tired" back={pack}
            {...(k === 'ausSoldier' ? {head: AUS_BRODIE} : {})}
            outfit={{...CAST[k].outfit, color: '#6A5E44'}} />
        );
      })}
      <MistBands f={f} y0={360} y1={620} amount={0.7} />
      <Particles f={f} kind="rain" n={110} seed={9} wind={-0.6} opacity={0.6} />
    </Shot>
  );
};

// ------------------------------------------------------------ S09-05 the Tsar abdicates (plain red banners outside)
const Abdication: React.FC<{f: number}> = ({f}) => {
  const t = f - T[4];
  const signEnd = abs(547.2);
  const sg = signDocument(t, {seated: true, start: 18});
  const look = prog(f, signEnd, signEnd + 30);
  const tp = mixPose(sg.pose, addPose(seated(f, 2), {headTilt: 8, shR: 30, elR: 50}), look);
  const winX = 1180;
  const winY = 150;
  const winW = 560;
  const winH = 520;
  return (
    <Shot f={f} bg="#5A4A3A" keys={ck([T[4], 1.04, 860, 600], [abs(547.0), 1.1, 1040, 560], [T[5], 1.2, 1300, 470])} sombre={0.15}>
      <Interior wall="#6E5E4A" floor="#4A3A2C" floorY={800} />
      {/* the window onto a Petrograd street */}
      <defs>
        <clipPath id="s09win">
          <rect x={winX} y={winY} width={winW} height={winH} />
        </clipPath>
      </defs>
      <g clipPath="url(#s09win)">
        <Sky top="#8C96A4" bottom="#D8D4CC" />
        {[0, 1, 2].map((i) => (
          <Building key={i} x={winX - 80 + i * 240} base={winY + winH - 60} w={220} h={300 + (i % 2) * 60} color={['#B89A7A', '#A08A72', '#C2AE90'][i]} seed={i + 11} f={f} />
        ))}
        <rect x={winX} y={winY + winH - 60} width={winW} height={60} fill="#D8D6D0" />
        {Array.from({length: 9}).map((_, i) => {
          const x = winX + winW + 40 - ((t * 1.1 + i * 70) % (winW + 160));
          return (
            <g key={i}>
              <Fig k={i % 3 ? 'worker' : 'russianSoldier'} x={x} y={winY + winH - 12} f={f + i * 9} s={0.34} dir={-1} pose={walk((t + i * 11) / 9, 0.6)} expr="determined" />
              {i % 3 === 1 && <PlainBanner x={x - 20} y={winY + winH - 170} f={f + i * 7} w={44} h={70} color="#B5302A" seed={i} />}
            </g>
          );
        })}
        <Particles f={f} kind="snow" n={40} seed={21} wind={0.6} opacity={0.8} />
      </g>
      <rect x={winX - 14} y={winY - 14} width={winW + 28} height={winH + 28} fill="none" stroke="#3A2A1E" strokeWidth={22} />
      <line x1={winX + winW / 2} y1={winY} x2={winX + winW / 2} y2={winY + winH} stroke="#3A2A1E" strokeWidth={12} />
      <line x1={winX} y1={winY + winH * 0.45} x2={winX + winW} y2={winY + winH * 0.45} stroke="#3A2A1E" strokeWidth={10} />
      {/* snow on the ledge */}
      <path d={`M${winX - 30},${winY + winH + 14} Q${winX + 120},${winY + winH - 4} ${winX + 280},${winY + winH + 8} T${winX + winW + 30},${winY + winH + 12} L${winX + winW + 30},${winY + winH + 26} L${winX - 30},${winY + winH + 26}Z`} fill="#F4F6F8" stroke={ink} strokeWidth={3} />
      {/* heavy curtains */}
      <path d={`M${winX - 70},${winY - 40} L${winX + 40},${winY - 40} Q${winX + 10},${winY + 260} ${winX + 60},${winY + winH + 60} L${winX - 70},${winY + winH + 60}Z`} fill="#6A2A26" stroke={ink} strokeWidth={4} />
      <path d={`M${winX + winW + 70},${winY - 40} L${winX + winW - 40},${winY - 40} Q${winX + winW - 10},${winY + 260} ${winX + winW - 60},${winY + winH + 60} L${winX + winW + 70},${winY + winH + 60}Z`} fill="#6A2A26" stroke={ink} strokeWidth={4} />
      {/* the Tsar at his desk */}
      <Fig k="tsarNicholas" x={720} y={900} f={f} s={1.0} dir={1} tag pose={tp} expr={look > 0.5 ? 'sad' : 'solemn'} turn={look * 0.4}
        overlayFront={look < 0.6 ? (sk) => <Pen x={sk.armR.hx} y={sk.armR.hy} /> : undefined} />
      <rect x={760} y={806} width={340} height={22} fill="#6A4A2E" stroke={ink} strokeWidth={4} />
      <rect x={780} y={828} width={300} height={140} fill="#5A3E26" stroke={ink} strokeWidth={4} />
      <DocumentOnTable x={792} y={806} signed={prog(t, 30, signEnd - T[4])} />
      {look > 0.4 && <g transform={`translate(${880},${800}) rotate(70)`}><Pen x={0} y={0} angle={0} /></g>}
    </Shot>
  );
};

// ------------------------------------------------------------ S09-06 Lenin in a Petrograd square → M-03 Brest-Litovsk
const LENIN_CAP = castWith('lenin', {hat: 'flatCap', hatColor: '#2F2F33'});
const Lenin: React.FC<{f: number}> = ({f}) => {
  const t = f - T[5];
  const m0 = abs(553.4);
  const match = prog(f, m0, m0 + 30, easeInOut);
  const zoomOut = prog(f, m0 - 10, m0 + 40, easeInOut);
  const cam = camLerp(CAM_EF.poland, CAM_EF.brest, prog(f, m0, m0 + 60, easeInOut));
  return (
    <Shot f={f} bg="#1E2230" drift={0.8}>
      {match < 1 && (
        <g opacity={1 - match} transform={`translate(${W / 2},${H / 2}) scale(${1 - zoomOut * 0.45}) translate(${-W / 2},${-H / 2})`}>
          <Camera f={f} keys={[[T[5], 1.0, 960, 560], [m0, 1.14, 1060, 520]]}>
            <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#1E2434" />
            {[[-200, 380, 560, '#4A4A58'], [160, 420, 600, '#5A5260'], [560, 380, 520, '#4E4A56'], [1420, 400, 600, '#56505E'], [1800, 380, 520, '#4A4A58']].map(([x, w, h, c], i) => (
              <Building key={i} x={x as number} base={780} w={w as number} h={h as number} color={c as string} seed={i + 21} f={f} lit={0.6} />
            ))}
            <Ground y={780} color="#C8CCD4" />
            {[300, 1700].map((x) => (
              <g key={x}>
                <StreetLamp x={x} y={780} lit />
                <circle cx={x} cy={500} r={140} fill="#F4D98A" opacity={0.12 + 0.02 * Math.sin(f / 9 + x)} />
              </g>
            ))}
            {/* the truck with Lenin speaking from the back */}
            <Truck x={1120} y={850} dist={0} s={1.5} dir={-1} color="#4A4A3A" cover="#5A5848" />
            <Fig k="lenin" x={1270} y={792} f={f} s={0.9} dir={-1} tag pose={orate(f)} talking={f < b.endOf(6)} expr="determined" head={{...LENIN_CAP.head, expression: 'determined'}} />
            {/* the crowd: workers and soldiers with plain red banners */}
            {Array.from({length: 12}).map((_, i) => {
              const x = 120 + i * 92 + (i % 2) * 20;
              const y = 900 + (i % 3) * 22;
              const raise = i % 4 === 0;
              return (
                <g key={i}>
                  {raise && <PlainBanner x={x - 30} y={y - 420} f={f + i * 5} w={80} h={150} color="#B5302A" seed={i + 2} />}
                  <Fig k={i % 2 ? 'russianSoldier' : 'worker'} x={x} y={y} f={f + i * 7} s={0.78} dir={1} pose={raise ? addPose(stand(f, i), {shR: 165, elR: 5}) : i % 3 === 0 ? cheer(f + i * 4, i) : stand(f, i)} expr="determined" fromBehind={i % 3 === 2} />
                </g>
              );
            })}
            <Particles f={f} kind="snow" n={70} seed={27} wind={0.5} opacity={0.85} />
          </Camera>
        </g>
      )}
      {match > 0 && (
        <g opacity={match}>
          <MapEasternFront f={f} cam={cam} idSuffix="-s09" labels={1} front1917={1} brest={prog(f, abs(554.4), abs(556.6))} frontVanish={prog(f, abs(555.6), abs(557.6))} brestLabels={fio(f, abs(554.3), abs(559.6))} />
        </g>
      )}
    </Shot>
  );
};

export const S09Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: T[0], to: T[1], el: <UBoat f={f} />},
      {from: T[1], to: T[2], el: <Codebreakers f={f} />, trans: 'fade'},
      {from: T[2], to: T[3], el: <Landing f={f} />, trans: 'wipe'},
      {from: T[3], to: T[4], el: <Mud f={f} />, trans: 'dip'},
      {from: T[4], to: T[5], el: <Abdication f={f} />, trans: 'cut'},
      {from: T[5], to: T[6], el: <Lenin f={f} />, trans: 'fade'},
    ]}
  />
);

const GTag: React.FC<{at: number; until: number; x: number; y: number; text: string}> = ({at, until, x, y, text}) => {
  const f = useFrame();
  const o = fio(f, at, until);
  return o <= 0 ? null : <GroupTag x={x} y={y} text={text} opacity={o} pointer={false} scale={1.3} />;
};
export const S09Overlay: React.FC = () => (
  <g>
    <DateCard at={abs(505.1)} until={abs(510.0)} date="FEBRUARY 1917" title="UNRESTRICTED U-BOAT WARFARE" sub="ships sunk without warning" />
    <GTag at={abs(510.3)} until={abs(514.0)} x={W / 2} y={260} text="BRITISH INTELLIGENCE" />
    <OLabel at={abs(514.4)} until={abs(519.5)} text="ZIMMERMANN TELEGRAM · JANUARY 1917" x={W / 2} y={650} size={40} />
    <FactPill at={abs(528.0)} until={abs(534.0)} text="US TROOPS ARRIVED IN STRENGTH ONLY IN 1918" x={1860} y={330} anchor="end" maxW={760} />
    <DateCard at={abs(534.9)} until={abs(539.7)} date="JULY–NOVEMBER 1917" title="PASSCHENDAELE" sub="Third Battle of Ypres" />
    <FactPill at={abs(538.8)} until={abs(543.4)} text="AROUND 250,000 CASUALTIES ON EACH SIDE (EST.)" x={1860} y={330} anchor="end" maxW={760} />
    <DateCard at={abs(544.3)} until={abs(549.3)} date="MARCH 1917" title="THE TSAR ABDICATES" />
    <DateCard at={abs(550.3)} until={abs(553.7)} date="NOVEMBER 1917" title="BOLSHEVIKS SEIZE POWER" sub="October in Russia's old calendar" />
  </g>
);
