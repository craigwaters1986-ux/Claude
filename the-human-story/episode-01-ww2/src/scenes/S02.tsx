// s02 — Chapter 1: The World After World War I (30-90 s). Storyboard S02-01 … S02-09.
import React from 'react';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack} from '../components/Camera';
import {Sky, Ground, Clouds, Tree, BarbedWire, HistoryRoom, Chalk, Building, Document, Skyline} from '../components/Environment';
import {Particles, Smoke} from '../components/Effects';
import {Newspaper} from '../components/Vehicles';
import {HallOfMirrors, WallStreet1929, Reichstag} from '../components/env/Places';
import {MapVersailles} from '../maps/EpisodeMaps';
import {walk, march, stand, slump, seated, signDocument, point, talkGesture, shrug, mixPose, holdFront, cower, run, headBowed} from '../characters/poses';
import {Pen, FlyingPaper} from '../characters/props';
import {Crowd} from '../characters/Crowd';
import {castWith} from '../characters/cast';
import {StickFigure} from '../characters/StickFigure';
import {DateCard, FactPill, TermCard} from '../components/Text';
import {prog, clamp, easeOut, lerp} from '../animations/core';
import {sec, Fig, Walker, Shot, ck, ChalkPath, ChalkBox, ChalkSmudge, SimpleFlag, HandCart, Crater, Bench, fio} from './kit';

const {b, cut} = sec('s02');
const T = [0, cut(1), cut(2), cut(3), 700, cut(4), cut(6), cut(7), cut(8), 1800];

// ------------------------------------------------------------ S02-01 history room: the First World War
const Room1: React.FC<{f: number}> = ({f}) => {
  const gx = lerp(-120, 360, prog(f, 0, 60));
  const walking = f < 60;
  const writing = f >= 60;
  const pose = walking ? walk(f / 22) : mixPose(talkGesture(f, 2), point(f, 125), 0.6 + 0.4 * Math.sin(f / 9));
  return (
    <Shot f={f} bg={C.wallYellow} keys={ck([0, 1.05, 860, 540], [T[1], 1.05, 1060, 520])}>
      <HistoryRoom
        f={f}
        board={
          <g>
            <Chalk x={1140} y={330} text="1939" size={110} reveal={1} />
            <ChalkSmudge x={1140} y={320} w={360} t={prog(f, 30, 55)} />
            <Chalk x={1140} y={360} text="1914–1918" size={110} reveal={prog(f, 58, 85)} />
            <Chalk x={1140} y={520} text="THE FIRST WORLD WAR" size={76} reveal={prog(f, 82, 115)} />
          </g>
        }
      />
      <Particles f={f} kind="dust" n={10} seed={3} opacity={0.5 * fio(f, 30, 70)} />
      <Fig k="guide" x={gx} y={900} f={f} s={1.5} pose={pose} expr="neutral" talking={writing && f > b.at(0)} turn={writing ? 0.35 : 0} />
    </Shot>
  );
};

// ------------------------------------------------------------ S02-02 muddy front → the Kaiser
const Front1918: React.FC<{f: number}> = ({f}) => {
  const t = f - T[1];
  const helmetDown = t > 110;
  const kx = helmetDown ? 420 - (t - 110) * 2.2 : 420;
  const kaiserBare = castWith('kaiser', {hat: 'none', expression: 'sad'});
  return (
    <Shot f={f} bg="#7C7A72" keys={ck([T[1], 1.0, 1150, 540], [T[1] + 70, 1.0, 1100, 540], [T[1] + 120, 1.05, 700, 560], [T[2], 1.07, 640, 560])}>
      <Sky top="#6E6E6A" bottom="#AFA898" />
      <rect x={-200} y={-200} width={2900} height={1500} fill="url(#none)" opacity={0} />
      <Ground y={700} color="#6E5A44" />
      <rect x={-200} y={700} width={1100} height={600} fill="#8A8780" />
      {Array.from({length: 7}).map((_, i) => (
        <line key={i} x1={-200} y1={760 + i * 60} x2={900} y2={760 + i * 60} stroke="#77746E" strokeWidth={3} />
      ))}
      {[[1100, 760, 240], [1700, 820, 300], [2200, 760, 220], [1400, 950, 340]].map(([x, y, w], i) => (
        <Crater key={i} x={x} y={y} w={w} />
      ))}
      <Tree x={1250} y={705} kind="bare" s={1.1} f={f} color="#4A3A2A" />
      <Tree x={2050} y={705} kind="bare" s={0.9} f={f} color="#4A3A2A" seed={3} />
      <BarbedWire x0={1000} x1={2600} y={700} posts={8} h={110} />
      <Bench x={330} y={860} />
      {helmetDown && (
        <g transform="translate(330,795)">
          <path d="M-34,0 Q-34,-38 0,-40 Q34,-38 34,0 Z" fill="#3A3A36" stroke={C.ink} strokeWidth={4} />
          <rect x={-4} y={-66} width={8} height={28} fill="#C9B26A" stroke={C.ink} strokeWidth={2.5} />
        </g>
      )}
      {[0, 1, 2, 3, 4].map((i) => (
        <Walker key={i} k="germanSoldierWW1" f={f} x0={2350 + i * 170} speed={-1.6 - (i % 2) * 0.2} y={870 + (i % 2) * 40} s={0.95} expr={i % 2 ? 'tired' : 'sad'} amp={0.6} />
      ))}
      <StickFigure
        x={kx}
        y={860}
        f={f}
        dir={-1}
        head={helmetDown ? kaiserBare.head : {...kaiserBare.head, hat: 'pickelhaube', hatColor: '#3A3A36'}}
        outfit={kaiserBare.outfit}
        pose={helmetDown ? walk((t - 110) / 30, 0.7) : headBowed(stand(f, 3), 1)}
        hatInHand={helmetDown ? undefined : {side: 'R'}}
        label="KAISER WILHELM II"
        sublabel="German Emperor"
      />
      <g opacity={0.75}>
        <Particles f={f} kind="rain" n={90} seed={2} wind={-0.3} />
      </g>
      <rect x={-200} y={560} width={2900} height={200} fill="#C8C4BA" opacity={0.18} />
    </Shot>
  );
};

// ------------------------------------------------------------ S02-03 Hall of Mirrors: the treaty
const Versailles: React.FC<{f: number}> = ({f}) => {
  const t = f - T[2];
  const step = prog(t, 20, 70);
  const sign = signDocument(t, {start: 70});
  const signed = prog(t, 90, 170);
  const seats: [number, number, number, 1 | -1][] = [
    [745, 805, 0.5, 1], [690, 845, 0.58, 1], [610, 905, 0.68, 1], [500, 985, 0.8, 1],
    [1175, 805, 0.5, -1], [1230, 845, 0.58, -1], [1310, 905, 0.68, -1], [1420, 985, 0.8, -1],
  ];
  const keys = ['politician', 'politician2', 'man2', 'politician', 'politician2', 'politician', 'man2', 'politician2'];
  const delegate = castWith('politician', {expression: 'worried'}, {color: '#6E6F72'});
  return (
    <Shot f={f} bg="#C9A35A" keys={ck([T[2], 1.0, 960, 560], [T[3], 1.22, 960, 640])}>
      <HallOfMirrors f={f} />
      {seats.map(([x, y, s, d], i) => (
        <Fig key={i} k={keys[i]} x={x - d * 30} y={y} f={f} s={s} dir={d} pose={seated(f, i)} expr={i % 3 === 0 ? 'neutral' : 'solemn'} turn={0.4} look={[d * 0.6, 0]} />
      ))}
      <g transform="translate(960,842) scale(0.6,0.32)">
        <Document x={-75} y={-95} w={150} h={190} title="TREATY OF VERSAILLES" sign={signed} />
      </g>
      <StickFigure x={lerp(1060, 1010, step)} y={790 - step * 2} f={f} scale={0.62} dir={-1} head={delegate.head} outfit={delegate.outfit} pose={t < 70 ? walk(t / 20, step < 1 ? 0.8 : 0) : sign.pose} overlayFront={t >= 70 ? (sk) => <Pen x={sk.armR.hx} y={sk.armR.hy} /> : undefined} />
    </Shot>
  );
};

// ------------------------------------------------------------ S02-04 map: territories lost
const MapLoss: React.FC<{f: number}> = ({f}) => {
  const t = f - T[3];
  return (
    <Shot f={f} bg="#9DBCC4">
      <MapVersailles f={t} cues={{start: 10, stagger: 14, globe: b.at(3) + 100 - T[3], colonies: b.at(3) + 120 - T[3]}} />
    </Shot>
  );
};

// ------------------------------------------------------------ S02-05 parade ground: army capped, reparations
const Parade: React.FC<{f: number}> = ({f}) => {
  const t = f - T[4];
  const figs: React.ReactNode[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      const i = r * 8 + c;
      const keep = c >= 3 && c <= 4 && r === 2;
      const leaveAt = 10 + ((i * 7) % 24) * 2.2;
      const gone = keep ? 0 : Math.max(0, t - leaveAt);
      const x = 420 + c * 150 + r * 30 + gone * 4.5;
      if (x > 2400) continue;
      const y = 700 + r * 70;
      const s = 0.55 + r * 0.1;
      figs.push(
        <Fig key={i} k="germanSoldier" x={x} y={y} f={f} s={s} pose={gone > 0 ? walk(gone / 25) : march(f / 18 + c * 0.0)} expr={gone > 0 ? 'neutral' : 'determined'} lod={r === 0 ? 'low' : undefined} />,
      );
    }
  }
  const cartX = lerp(-300, 1300, prog(t, 30, T[5] - T[4]));
  return (
    <Shot f={f} bg="#9AA0A4" keys={ck([T[4], 1.25, 960, 560], [T[4] + 50, 1.0, 960, 540], [T[5], 1.0, 860, 540])}>
      <Sky top="#8D969A" bottom="#C9C6BC" />
      <Building x={150} base={640} w={600} h={260} color="#A59E90" seed={3} roof="flat" />
      <Building x={800} base={640} w={700} h={300} color="#9C968A" seed={5} roof="flat" />
      <Building x={1550} base={640} w={500} h={240} color="#A59E90" seed={7} roof="flat" />
      <Ground y={640} color="#B2ACA0" />
      {figs}
      <g>
        <HandCart x={cartX} y={960} dist={cartX} s={1.1} label="REPARATIONS" />
        <Fig k="worker" x={cartX - 200} y={960} f={f} s={1.05} pose={{...walk(cartX / 60, 0.6), lean: 14, shR: 75, elR: 20, shL: 70, elL: 25}} expr={'tired'} />
        <Fig k="man1" x={cartX - 270} y={965} f={f} s={1.05} pose={{...walk(cartX / 60 + 0.5, 0.6), lean: 14, shR: 75, elR: 20, shL: 70, elL: 25}} expr={'tired'} />
      </g>
    </Shot>
  );
};

// ------------------------------------------------------------ S02-06 Berlin street, Reichstag, Weimar flag
const Berlin: React.FC<{f: number}> = ({f}) => {
  const b4 = b.at(4), b5 = b.at(5);
  const slumped = prog(f, b4 + 10, b4 + 30);
  const vet = mixPose(holdFront(f, 1), slump(f, 1), slumped);
  return (
    <Shot f={f} bg="#9AA0A4" keys={ck([T[5], 1.2, 900, 700], [b5, 1.15, 900, 680], [T[6], 1.0, 960, 470])}>
      <Reichstag f={f} lit={0.3 + 0.2 * Math.sin(f / 13)} crack={prog(f, b5 + 60, b5 + 120)} street base={800} />
      <SimpleFlag x={1450} y={380} f={f} pole={170} w={120} h={76} seed={4} />
      <SimpleFlag x={360} y={380} f={f} pole={170} w={120} h={76} seed={7} />
      <Walker k="man3" f={f} x0={1700} speed={-1.3} y={900} amp={0.6} expr="sad" pose={undefined} />
      <Walker k="woman3" f={f} x0={200} speed={1.1} y={910} amp={0.6} expr="worried" />
      <Walker k="worker" f={f} x0={1300} speed={-1.0} y={880} s={0.9} amp={0.5} expr="sad" />
      <Fig k="man1" x={860} y={900} f={f} s={1.1} pose={vet} expr={slumped > 0.5 ? 'sad' : 'worried'} holdR={slumped < 0.5 ? <g transform="translate(-10,-50)"><Newspaper w={70} h={90} headline="CRISIS" masthead="BERLIN" /></g> : undefined} />
      <Particles f={f} kind="dust" n={14} seed={9} wind={1} opacity={0.4} />
    </Shot>
  );
};

// ------------------------------------------------------------ S02-07 New York 1929
const WallSt: React.FC<{f: number}> = ({f}) => {
  const t = f - T[6];
  return (
    <Shot f={f} bg="#9AA0A4" keys={ck([T[6], 1.0, 960, 560], [T[6] + 60, 1.12, 1000, 600], [T[7], 1.15, 1000, 600])} shake={prog(t, 20, 40) * 0.5}>
      <WallStreet1929 f={f} crash={prog(t, 0, 90)} />
      <Crowd f={f} count={18} x0={250} x1={1700} yBack={770} yFront={800} scaleBack={0.4} scaleFront={0.5} pool={['man1', 'man2', 'politician', 'woman1', 'worker']} mix={{stand: 3}} expression="worried" seed={12} />
      {[0, 1, 2].map((i) => (
        <Fig key={i} k={i === 1 ? 'politician' : 'man2'} x={900 + i * 120 + (i === 1 ? 0 : (t * (i === 0 ? -4 : 4)))} y={900 + i * 15} f={f} s={1.0} dir={i === 0 ? -1 : 1} pose={i === 1 ? {...cower(f, 2), lean: 6} : run(t / 12 + i)} expr={i === 1 ? 'worried' : 'scared'} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <FlyingPaper key={i} f={t} start={5 + i * 9} x0={950 + i * 40} y0={700} wind={[(i % 2 ? 6 : -6), -4]} seed={i + 2} />
      ))}
      {Array.from({length: 14}).map((_, i) => {
        const x = 100 + ((i * 263) % 1800);
        const y = ((t * (3 + (i % 3)) + i * 140) % 1100) - 100;
        return <path key={'tk' + i} d={`M${x},${y} q12,30 0,60 t0,60`} stroke="#F4F1E8" strokeWidth={6} fill="none" opacity={0.8} />;
      })}
    </Shot>
  );
};

// ------------------------------------------------------------ S02-08 Berlin 1932: the dole queue in the rain
const Queue: React.FC<{f: number}> = ({f}) => {
  const t = f - T[7];
  const ks = ['man1', 'worker', 'woman3', 'workerW', 'man3', 'man2', 'woman1', 'worker', 'man1', 'woman2', 'man3', 'worker', 'workerW', 'man2'];
  return (
    <Shot f={f} bg="#7E868A" keys={ck([T[7], 1.08, 1200, 560], [T[8], 1.08, 760, 560])}>
      <Sky top="#6E767A" bottom="#A9ABA6" />
      <Building x={-200} base={800} w={700} h={520} color="#8C8478" seed={2} roof="flat" />
      <Building x={500} base={800} w={600} h={560} color="#958C7E" seed={4} roof="flat" />
      <Building x={1100} base={800} w={900} h={500} color="#857E74" seed={6} roof="flat" />
      <Ground y={800} color="#7F7A72" />
      {ks.map((k, i) => {
        const shuffle = Math.max(0, Math.sin(t / 22 + i * 0.4)) * 0.6;
        const x = 220 + i * 120 + t * 0.15;
        return <Fig key={i} k={k} x={x} y={890 + (i % 2) * 10} f={f} dir={-1} pose={shuffle > 0.3 ? walk(t / 30 + i, 0.35) : slump(f, i)} expr={i % 3 === 0 ? 'sad' : 'tired'} />;
      })}
      <g opacity={0.8}>
        <Particles f={f} kind="rain" n={110} seed={4} wind={-0.2} />
      </g>
    </Shot>
  );
};

// ------------------------------------------------------------ S02-09 history room: causes → an opening
const Room2: React.FC<{f: number}> = ({f}) => {
  const b8 = b.at(8), b9 = b.at(9);
  const boxes: [string, number, number, number][] = [
    ['ECONOMIC DESPAIR', 580, 230, 1497],
    ['FRAGILE POLITICS', 1310, 230, 1540],
    ['NATIONALISM', 580, 560, 1580],
    ['ANTISEMITISM', 1310, 560, 1606],
  ];
  const gapX = 1140, gapY = 430;
  const shadow = prog(f, 1690, 1780);
  const stepBack = prog(f, 1700, 1730);
  const pose = f < b9 ? (f < b8 + 60 ? point(f, 120) : shrug(f)) : mixPose(talkGesture(f, 3), point(f, 110), 0.5);
  const wipeOut = prog(f, b8 - 10, b8 + 10);
  return (
    <Shot f={f} bg={C.wallYellow} keys={ck([T[8], 1.0, 960, 540], [1548, 1.0, 960, 540], [1700, 1.35, gapX, gapY + 40], [1800, 1.38, gapX, gapY + 40])}>
      <HistoryRoom
        f={f}
        board={
          <g>
            <g opacity={1 - prog(f, b9 - 5, b9 + 10)}>
              <Chalk x={1140} y={330} text="VERSAILLES" size={100} reveal={prog(f, b8 + 2, b8 + 30) * wipeOut + (1 - wipeOut)} />
              <Chalk x={1140} y={480} text="≠ THE ONLY CAUSE" size={72} reveal={prog(f, b8 + 40, b8 + 80)} />
            </g>
            {boxes.map(([txt, x, y, at], i) => (
              <g key={i}>
                <ChalkBox x={x - 230} y={y} w={460} h={84} text={txt} reveal={prog(f, at, at + 18)} size={36} />
                <ChalkPath d={`M${x},${y + (y < 400 ? 84 : 0)} L${gapX + (x < gapX ? -70 : 70)},${gapY + (y < 400 ? -30 : 30)}`} reveal={prog(f, 1631, 1660)} w={6} />
              </g>
            ))}
            <g opacity={prog(f, 1631, 1650)}>
              <ellipse cx={gapX} cy={gapY} rx={150} ry={60} fill="#101410" stroke="#F4F1E8" strokeWidth={4} strokeDasharray="10 8" />
              <Chalk x={gapX} y={gapY + 12} text="AN OPENING" size={34} />
            </g>
          </g>
        }
      />
      <g opacity={0.55 * shadow}>
        <path d={`M${2100 - shadow * 1500},120 q120,-40 200,40 l60,620 l-420,0 Z`} fill="#0E0E0E" />
        <circle cx={2210 - shadow * 1500} cy={170} r={95} fill="#0E0E0E" />
      </g>
      <Fig k="guide" x={330 - stepBack * 120} y={900} f={f} s={1.5} pose={stepBack > 0 ? {...stand(f, 2), lean: -6} : pose} expr={stepBack > 0 ? 'worried' : f < b9 ? 'neutral' : 'determined'} talking={(f > b8 && f < b.endOf(8)) || (f > b9 && f < b.endOf(9))} turn={0.35} />
    </Shot>
  );
};

export const S02Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: T[0], to: T[1], el: <Room1 f={f} />},
      {from: T[1], to: T[2], el: <Front1918 f={f} />},
      {from: T[2], to: T[3], el: <Versailles f={f} />, trans: 'cut'},
      {from: T[3], to: T[4], el: <MapLoss f={f} />},
      {from: T[4], to: T[5], el: <Parade f={f} />, trans: 'cut'},
      {from: T[5], to: T[6], el: <Berlin f={f} />},
      {from: T[6], to: T[7], el: <WallSt f={f} />, trans: 'wipe'},
      {from: T[7], to: T[8], el: <Queue f={f} />},
      {from: T[8], to: T[9], el: <Room2 f={f} />, trans: 'cut'},
    ]}
  />
);

export const S02Overlay: React.FC = () => (
  <g>
    <DateCard at={T[1] + 15} until={T[2] - 6} date="NOVEMBER 1918" title="GERMANY DEFEATED" sub="The Kaiser abdicates" />
    <DateCard at={T[2] + 12} until={T[3] - 6} date="1919" title="TREATY OF VERSAILLES" />
    <FactPill at={545} until={T[4] - 4} text="AROUND 13% OF ITS EUROPEAN TERRITORY LOST" x={1880} y={350} anchor="end" />
    <FactPill at={610} until={T[4] - 4} text="ALL COLONIES LOST" x={1880} y={450} anchor="end" />
    <FactPill at={T[4] + 8} until={T[5] - 20} text="ARMY CAPPED AT 100,000 MEN" x={1880} y={330} anchor="end" />
    <FactPill at={750} until={T[5] - 2} text="HUGE REPARATIONS" x={1880} y={430} anchor="end" />
    <TermCard at={b.at(5) + 10} until={T[6] - 4} term="WEIMAR REPUBLIC" meaning="Germany's new democracy after the First World War" />
    <DateCard at={T[6] + 10} until={T[7] - 4} date="1929" title="GREAT DEPRESSION" sub="Wall Street Crash, October 1929" />
    <FactPill at={T[7] + 10} until={T[8] - 4} text="1932: AROUND 6 MILLION GERMANS OUT OF WORK" x={W / 2} y={160} anchor="middle" />
  </g>
);
