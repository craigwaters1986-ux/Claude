// s08 — Chapter 7: The Home Front (450–500 s, 1,500 frames). Storyboard S08-01 … S08-05 (ep02, editor B).
// High street and the 1916 notice · women at work → munitions ("canaries": yellow haze, heads stay white) ·
// VAD nurses at a hospital train · Poplar: an empty schoolroom (no children shown) · rationing → the blockade.
import React from 'react';
import {C, W, H, FONT} from '../styles/theme';
import {ShotTrack, SplitPanels, Camera} from '../components/Camera';
import {Sky, Ground, Clouds, Flag, Interior, Table, Building} from '../components/Environment';
import {Particles, Smoke} from '../components/Effects';
import {walk, stand, seated, wave, holdFront, addPose, talkGesture, point, mixPose} from '../characters/poses';
import {Shell} from '../characters/props';
import {CAST} from '../characters/cast';
import {DateCard, FactPill} from '../components/Text';
import {prog, clamp, lerp} from '../animations/core';
import {sec, Fig, Shot, ck, Walker} from './kit';
import {OLabel, OfficialNotice, SimpleChair} from './kit-b';

const {b, cut, abs} = sec('s08');
const END = b.dur; // 1500
const T = [0, cut(2), cut(4), abs(482.1), cut(6), END];
const ink = C.ink;

const mixHex = (a: string, c: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(c);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(t))).toString(16).padStart(2, '0')).join('');
};

// ------------------------------------------------------------ S08-01 the high street: volunteers → conscription
const HighStreet: React.FC<{f: number}> = ({f}) => {
  const paste = abs(456.4);
  return (
    <Shot f={f} bg="#C9D6DA" keys={ck([0, 1.0, 860, 540], [paste - 20, 1.0, 1060, 540], [paste + 40, 1.35, 1290, 470], [T[1], 1.4, 1300, 470])}>
      <Sky top="#A9C2CC" bottom="#E6E2D2" />
      <Clouds f={f} n={4} seed={81} speed={0.4} yMin={40} yMax={200} />
      {[[-200, 300, 520, '#B89A7A'], [100, 320, 560, '#A88A6A'], [420, 300, 600, '#C2A882'], [1560, 380, 560, '#B0927A'], [1940, 300, 520, '#A88A6A']].map(([x, w, h, c], i) => (
        <Building key={i} x={x as number} base={800} w={w as number} h={h as number} color={c as string} seed={i + 3} f={f} awning={i % 2 ? '#3F6EA6' : '#B23A2E'} />
      ))}
      {/* recruiting office */}
      <rect x={740} y={260} width={820} height={540} fill="#D8CCB0" stroke={ink} strokeWidth={5} />
      <rect x={720} y={240} width={860} height={40} fill="#8A6A4A" stroke={ink} strokeWidth={4} />
      <rect x={800} y={300} width={500} height={70} fill="#F4EBD6" stroke={ink} strokeWidth={4} />
      <text x={1050} y={350} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={40} fill={ink}>RECRUITING OFFICE</text>
      <rect x={880} y={560} width={140} height={240} fill="#3A2A1E" stroke={ink} strokeWidth={4} />
      <rect x={1080} y={430} width={160} height={120} fill="#9FC3D0" stroke={ink} strokeWidth={4} />
      <Flag x={950} y={560} f={f} kind="uk" pole={150} w={110} h={66} seed={4} />
      <rect x={1300} y={380} width={200} height={400} fill="#C9BC9E" stroke={ink} strokeWidth={3} />
      <OfficialNotice x={1400} y={400} s={0.5} paste={prog(f, paste - 10, paste + 10)} title="MILITARY SERVICE ACT" year="1916" />
      <Ground y={800} color="#9A968C" />
      <rect x={-200} y={800} width={2400} height={40} fill="#B8B4A8" stroke={ink} strokeWidth={3} />
      {/* the queue of young men shuffles into the office */}
      {Array.from({length: 6}).map((_, i) => {
        const x = 960 - 110 * i + Math.min(f * 0.35, 90) - (i === 0 ? prog(f, 140, 200) * -40 : 0);
        return <Fig key={i} k={i % 3 === 0 ? 'man1' : i % 3 === 1 ? 'worker' : 'man3'} x={x} y={860} f={f + i * 9} s={0.78} pose={f % 120 < 40 ? walk((f + i * 10) / 18, 0.3) : stand(f, i)} expr="neutral" dir={1} opacity={i === 0 ? 1 - prog(f, 150, 175) : 1} />;
      })}
      {/* bill-poster pastes the notice */}
      <Fig k="worker" x={1530} y={860} f={f} s={0.82} dir={-1} pose={f > paste - 30 && f < paste + 20 ? point(f, 125) : stand(f, 3)} expr="neutral" />
      {/* shoppers pass; a boy reads a soldier's letter to his gran */}
      <Walker k="woman1" f={f} x0={-120} speed={2.2} y={900} s={0.82} expr="happy" />
      <Walker k="man2" f={f} x0={2100} speed={-1.8} y={910} s={0.82} />
      <Fig k="woman3" x={300} y={890} f={f} s={0.8} pose={stand(f, 2)} expr="happy" />
      <Fig k="kid1" x={380} y={895} f={f} s={0.8} dir={-1} pose={holdFront(f, 1)} expr="happy" talking={f < 110} overlayFront={(sk) => <rect x={sk.armR.hx - 22} y={sk.armR.hy - 30} width={40} height={30} fill="#F4EBD6" stroke={ink} strokeWidth={2} />} />
      {/* passers-by stop to read the notice */}
      {f > paste && [0, 1].map((i) => <Fig key={'r' + i} k={i ? 'woman2' : 'man1'} x={1330 + i * 120} y={880} f={f} s={0.8} pose={addPose(stand(f, i), {headTilt: -6})} expr="worried" dir={1} />)}
    </Shot>
  );
};

// ------------------------------------------------------------ S08-02 women at work → the munitions factory
const Office: React.FC<{f: number}> = ({f}) => (
  <g>
    <Interior wall="#D8CCB0" floor="#8A7A62" floorY={800} />
    <rect x={180} y={180} width={260} height={300} fill="#9FC3D0" stroke={ink} strokeWidth={5} />
    <Table x={420} y={700} w={420} />
    <rect x={540} y={630} width={150} height={70} rx={8} fill="#2E2E30" stroke={ink} strokeWidth={4} />
    <rect x={570} y={590} width={90} height={50} fill="#F4EBD6" stroke={ink} strokeWidth={3} transform={`translate(${(f * 2) % 30 - 15},0)`} />
    <Fig k="woman1" x={500} y={850} f={f} s={0.95} pose={addPose(seated(f, 1), {shL: 70, elL: 60 + Math.sin(f / 2) * 12, shR: 70, elR: 60 + Math.cos(f / 2.2) * 12})} expr="determined" dir={1} />
  </g>
);
const Farm: React.FC<{f: number}> = ({f}) => {
  const x = 700 + ((f * 1.4) % 500);
  return (
    <g>
      <Sky top="#A9C8D6" bottom="#EDE6CC" />
      <Ground y={560} color="#9A8458" />
      {Array.from({length: 8}).map((_, i) => <line key={i} x1={300} y1={600 + i * 50} x2={1700} y2={600 + i * 50} stroke="#7A6440" strokeWidth={6} />)}
      <path d={`M${x + 60},820 L${x + 150},860 L${x + 60},860 Z`} fill="#5A5A5A" stroke={ink} strokeWidth={4} />
      <line x1={x + 70} y1={840} x2={x - 10} y2={740} stroke="#6A4A2E" strokeWidth={9} />
      <Fig k="workerW" x={x - 40} y={870} f={f} s={0.95} pose={addPose(walk(f / 16, 0.6), {shR: 60, elR: 20, shL: 55, elL: 25, lean: 8})} expr="determined" />
    </g>
  );
};
const Bus: React.FC<{f: number}> = ({f}) => (
  <g>
    <Sky top="#B8C8D0" bottom="#E8E2D0" />
    <Ground y={820} color="#8E8A80" />
    <rect x={900} y={300} width={1200} height={470} rx={20} fill="#B23A2E" stroke={ink} strokeWidth={6} />
    <rect x={900} y={300} width={1200} height={60} fill="#8A2A22" stroke={ink} strokeWidth={4} />
    {[0, 1, 2].map((i) => <rect key={i} x={1180 + i * 240} y={400} width={200} height={140} fill="#C9DCE2" stroke={ink} strokeWidth={4} />)}
    <rect x={960} y={600} width={160} height={200} fill="#6A2A22" stroke={ink} strokeWidth={4} />
    <circle cx={1300} cy={790} r={58} fill="#2A2A2A" stroke={ink} strokeWidth={5} />
    <Fig k="workerW" x={1040} y={800} f={f} s={0.95} pose={talkGesture(f, 2)} expr="happy" dir={-1} talking overlayFront={(sk) => <rect x={sk.armL.hx - 14} y={sk.armL.hy - 40} width={28} height={60} fill="#7A5A3A" stroke={ink} strokeWidth={2} />} />
    <Fig k="man2" x={800} y={850} f={f} s={0.95} pose={stand(f, 1)} expr="neutral" dir={1} />
  </g>
);

const Munitions: React.FC<{f: number; t: number; canary: number}> = ({f, t, canary}) => {
  const overall = mixHex(CAST.munitionette.outfit.color ?? '#6A6A5A', '#C9B23A', canary * 0.55);
  return (
    <g>
      <Interior wall="#8A8678" floor="#5E5A52" floorY={760} />
      {Array.from({length: 6}).map((_, i) => <rect key={i} x={-100 + i * 420} y={80} width={260} height={220} fill="#C8CCC0" stroke={ink} strokeWidth={4} />)}
      {Array.from({length: 6}).map((_, i) => <line key={'b' + i} x1={-200 + i * 420} y1={0} x2={-200 + i * 420} y2={760} stroke="#5A564C" strokeWidth={18} />)}
      {/* long filling bench */}
      <rect x={-200} y={640} width={2800} height={30} fill="#7A5A3A" stroke={ink} strokeWidth={4} />
      {Array.from({length: 8}).map((_, i) => <rect key={'l' + i} x={-160 + i * 340} y={670} width={14} height={90} fill={ink} />)}
      {Array.from({length: 12}).map((_, i) => (
        <g key={'s' + i} transform={`translate(${-100 + i * 200},640)`}>
          <Shell rot={-90} s={1.1} />
        </g>
      ))}
      {[200, 600, 1000, 1400, 1800].map((x, i) => (
        <Fig key={i} k="munitionette" x={x} y={900} f={f + i * 13} s={1} outfit={{...CAST.munitionette.outfit, color: overall}} pose={addPose(stand(f, i), {shR: 75, elR: 55 + Math.sin(f / 6 + i) * 15, shL: 70, elL: 50, lean: 6, headTilt: 10})} expr="determined" />
      ))}
      {/* trolley of shells rolling past */}
      <g transform={`translate(${-300 + ((t * 3.2) % 2600)},960)`}>
        <rect x={-150} y={-70} width={300} height={40} fill="#5A5A5A" stroke={ink} strokeWidth={4} />
        {[-100, -40, 20, 80].map((x) => <g key={x} transform={`translate(${x},-70)`}><Shell rot={-90} s={0.9} /></g>)}
        {[-110, 110].map((x) => <circle key={x} cx={x} cy={-18} r={18} fill="#2A2A2A" stroke={ink} strokeWidth={4} />)}
      </g>
      {/* TNT haze over the filling bench (b3) */}
      <g opacity={canary}>
        <ellipse cx={960} cy={600} rx={1300} ry={220} fill="#D9C24A" opacity={0.22} />
        {Array.from({length: 60}).map((_, i) => {
          const x = ((i * 173 + f * (0.6 + (i % 5) * 0.2)) % 2400) - 240;
          const y = 430 + ((i * 89) % 300) + Math.sin(f / 20 + i) * 14;
          return <circle key={i} cx={x} cy={y} r={2 + (i % 3)} fill="#D9C24A" opacity={0.6} />;
        })}
      </g>
    </g>
  );
};

const WomenAtWork: React.FC<{f: number}> = ({f}) => {
  const t = f - T[1];
  const m = abs(464.7);
  const expand = prog(f, m, m + 22);
  const canary = prog(f, b.at(3) - 10, b.at(3) + 30);
  const camX = lerp(700, 1200, prog(f, m, b.at(3)));
  const zoom = lerp(1.0, 1.18, prog(f, b.at(3), T[2]));
  return (
    <Shot f={f} bg="#3A3A3A" drift={0}>
      {expand < 1 && (
        <SplitPanels
          id="s08p"
          reveal={prog(t, 0, 16)}
          panels={[
            {x0: 0, x1: 640, node: <Camera f={f} keys={[[0, 0.62, 640, 560]]}><Office f={f} /></Camera>},
            {x0: 640, x1: 1280, node: <Camera f={f} keys={[[0, 0.62, 1000, 640]]}><Farm f={f} /></Camera>},
            {x0: 1280, x1: 1920, node: <Camera f={f} keys={[[0, 0.62, 1000, 560]]}><Bus f={f} /></Camera>},
          ]}
        />
      )}
      {expand > 0 && (
        <g>
          <defs>
            <clipPath id="s08m">
              <rect x={1280 * (1 - expand)} y={-10} width={W - 1280 * (1 - expand) + 10} height={H + 20} />
            </clipPath>
          </defs>
          <g clipPath="url(#s08m)">
            <rect width={W} height={H} fill="#5E5A52" />
            <Camera f={f} keys={[[m, 1.0, camX, 540], [T[2], zoom, camX, 540]]}>
              <Munitions f={f} t={t} canary={canary} />
            </Camera>
          </g>
          {expand < 1 && <line x1={1280 * (1 - expand)} y1={0} x2={1280 * (1 - expand)} y2={H} stroke={ink} strokeWidth={12} />}
        </g>
      )}
    </Shot>
  );
};

// ------------------------------------------------------------ S08-03 VAD nurses at a hospital train
const Platform: React.FC<{f: number}> = ({f}) => {
  const t = f - T[2];
  return (
    <Shot f={f} bg="#B8BCBC" keys={ck([T[2], 1.05, 820, 540], [T[3], 1.08, 1120, 540])}>
      <Sky top="#A6AEB4" bottom="#D6D4CC" />
      <rect x={-200} y={60} width={2400} height={40} fill="#5A5A60" stroke={ink} strokeWidth={4} />
      {Array.from({length: 8}).map((_, i) => <rect key={i} x={-150 + i * 330} y={100} width={18} height={560} fill="#5A5A60" stroke={ink} strokeWidth={3} />)}
      {/* hospital carriages with red crosses + engine with idling steam */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${-180 + i * 640},0)`}>
          <rect x={0} y={330} width={600} height={300} rx={10} fill="#5A4A3A" stroke={ink} strokeWidth={5} />
          {[40, 180, 420, 520].map((x) => <rect key={x} x={x} y={380} width={60} height={70} fill="#C9C4A8" stroke={ink} strokeWidth={3} />)}
          <rect x={240} y={370} width={130} height={130} fill="#F4F0E4" stroke={ink} strokeWidth={4} />
          <path d="M290,380 h30 v40 h40 v30 h-40 v40 h-30 v-40 h-40 v-30 h40 Z" fill={C.red} />
          <rect x={100} y={480} width={70} height={150} fill="#3A2E24" stroke={ink} strokeWidth={4} />
          <circle cx={120} cy={650} r={26} fill="#2A2A2A" stroke={ink} strokeWidth={4} />
          <circle cx={480} cy={650} r={26} fill="#2A2A2A" stroke={ink} strokeWidth={4} />
        </g>
      ))}
      <g transform="translate(1740,0)">
        <rect x={0} y={420} width={300} height={210} fill="#2E2E30" stroke={ink} strokeWidth={5} />
        <rect x={20} y={300} width={110} height={160} fill="#2E2E30" stroke={ink} strokeWidth={5} />
        <rect x={230} y={330} width={40} height={90} fill={ink} />
        <Smoke x={250} y={320} f={f} n={8} size={36} rise={200} drift={-80} color="#E8E8E4" opacity={0.6} outline={false} />
      </g>
      <rect x={-200} y={680} width={2400} height={420} fill="#A8A498" />
      <line x1={-200} y1={680} x2={2200} y2={680} stroke={ink} strokeWidth={5} />
      <line x1={-200} y1={700} x2={2200} y2={700} stroke="#F2E6A0" strokeWidth={8} />
      {/* nurses help walking wounded along the platform */}
      {[0, 1, 2].map((i) => {
        const x = 260 + i * 520 + t * 1.1;
        return (
          <g key={i}>
            <Fig k="britSoldier1916" x={x} y={880} f={f + i * 9} s={0.85} pose={addPose(walk(t / 20 + i, 0.4), {lean: 6, shL: 40, elL: 90})} expr={i === 1 ? 'happy' : 'tired'} overlayFront={(sk) => <path d={`M${sk.armL.hx - 26},${sk.armL.hy - 10} L${sk.armL.hx + 20},${sk.armL.hy - 4} L${sk.sh.x},${sk.sh.y} Z`} fill="#F4F0E4" stroke={ink} strokeWidth={2.5} />} />
            <Fig k="vadNurse" x={x + 90} y={890} f={f + i * 5} s={0.85} pose={addPose(walk(t / 20 + i + 0.5, 0.4), {shL: 70, elL: 20})} expr="solemn" dir={1} />
          </g>
        );
      })}
      <Fig k="vadNurse" x={1560 - t * 0.6} y={920} f={f} s={0.9} dir={-1} pose={addPose(walk(t / 22, 0.4), {shL: 80, elL: 70, shR: 80, elR: 70})} expr="happy" overlayFront={(sk) => (
        <g>
          <rect x={sk.armR.hx - 40} y={sk.armR.hy - 8} width={80} height={10} fill="#8A7A6A" stroke={ink} strokeWidth={2} />
          {[-24, 0, 24].map((dx) => <rect key={dx} x={sk.armR.hx + dx - 8} y={sk.armR.hy - 26} width={16} height={18} fill="#E8E2D2" stroke={ink} strokeWidth={2} />)}
        </g>
      )} />
    </Shot>
  );
};

// ------------------------------------------------------------ S08-04 an empty schoolroom (Poplar, sombre; no children shown)
const Schoolroom: React.FC<{f: number}> = ({f}) => {
  const sec2 = Math.floor(f / 30);
  return (
    <Shot f={f} bg="#C8C2B4" keys={ck([T[3], 1.0, 960, 540], [T[4], 1.04, 1080, 500])} drift={0.5} sombre={0.5}>
      <Interior wall="#D6CFBE" floor="#9A8A70" floorY={760} />
      {[1150, 1500].map((x) => (
        <g key={x}>
          <rect x={x} y={120} width={260} height={480} fill="#E8EEE8" stroke={ink} strokeWidth={6} />
          <line x1={x + 130} y1={120} x2={x + 130} y2={600} stroke={ink} strokeWidth={4} />
          <line x1={x} y1={360} x2={x + 260} y2={360} stroke={ink} strokeWidth={4} />
          <path d={`M${x},${120} L${x + 260},120 L${x - 300},1100 L${x - 700},1100 Z`} fill="#FFF6D8" opacity={0.18 + 0.03 * Math.sin(f / 40)} />
        </g>
      ))}
      <rect x={160} y={160} width={620} height={340} fill="#2F4A3A" stroke="#7A5A3A" strokeWidth={14} />
      {/* wall clock, ticking */}
      <g transform="translate(960,190)">
        <circle r={52} fill="#F4F0E4" stroke={ink} strokeWidth={5} />
        <line x1={0} y1={0} x2={0} y2={-36} stroke={ink} strokeWidth={5} transform="rotate(30)" />
        <line x1={0} y1={0} x2={0} y2={-44} stroke={ink} strokeWidth={3} transform={`rotate(${(sec2 % 60) * 6})`} />
      </g>
      {/* pegs with small coats */}
      {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${170 + i * 120},560 l-28,20 l6,110 l44,0 l6,-110 Z`} fill={['#6A7A8A', '#8A5A4A', '#5A6A4A', '#7A6A8A', '#8A7A5A'][i]} stroke={ink} strokeWidth={3} />)}
      {/* rows of small desks */}
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => {
          const x = 220 + c * 330 + r * 60;
          const y = 820 + r * 90;
          return (
            <g key={`${r}-${c}`}>
              <rect x={x} y={y - 70} width={190} height={22} fill="#8A6A4A" stroke={ink} strokeWidth={3} />
              <rect x={x + 10} y={y - 48} width={10} height={48} fill={ink} />
              <rect x={x + 170} y={y - 48} width={10} height={48} fill={ink} />
            </g>
          );
        }),
      )}
      <SimpleChair x={960} y={930} s={0.8} rot={-8} />
      {/* small bunch of flowers on one desk */}
      <g transform="translate(1110,732)">
        {[[-12, -18, '#E8E2D2'], [6, -24, '#D88A9A'], [16, -12, '#E8E2D2']].map(([x, y, c], i) => <circle key={i} cx={x as number} cy={y as number} r={9} fill={c as string} stroke={ink} strokeWidth={2} />)}
        <path d="M-16,0 L20,0 M0,0 L-10,-16 M2,0 L6,-22 M4,0 L14,-12" stroke="#4A6A3A" strokeWidth={3} />
      </g>
      <Particles f={f} kind="dust" n={30} seed={51} wind={0.2} speed={0.3} opacity={0.5} />
    </Shot>
  );
};

// ------------------------------------------------------------ S08-05 rationing in Britain → the blockade in Germany
const Rationing: React.FC<{f: number}> = ({f}) => {
  const a7 = b.at(7);
  const t = f - T[4];
  return (
    <Shot f={f} bg="#C9C4B0" keys={ck([T[4], 1.04, 900, 540], [a7 - 18, 1.0, 960, 540], [a7 + 36, 1.0, 2880, 540], [END, 1.04, 2960, 560])}>
      {/* British kitchen */}
      <Interior wall="#D8C49A" floor="#8A6A4A" floorY={780} />
      <rect x={1280} y={180} width={300} height={260} fill="#BFD6DC" stroke={ink} strokeWidth={5} />
      <line x1={1430} y1={180} x2={1430} y2={440} stroke={ink} strokeWidth={4} />
      <Table x={520} y={700} w={700} cloth="#E8E2D2" />
      {/* ration book and coupons */}
      <rect x={760} y={668} width={90} height={30} fill="#C9A86A" stroke={ink} strokeWidth={3} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={880 + i * 34} y={680 - (i < Math.floor(t / 25) % 5 ? 0 : 0)} width={28} height={18} fill="#E8D8A8" stroke={ink} strokeWidth={2} opacity={i < (Math.floor(t / 22) % 5) ? 1 : 0.15} />)}
      <Fig k="woman2" x={700} y={880} f={f} s={1} pose={addPose(stand(f, 2), {shR: 60, elR: 70 + Math.sin(f / 5) * 10, headTilt: 12})} expr="worried" dir={1} />
      <Fig k="kid2" x={1150} y={880} f={f} s={1} pose={addPose(seated(f, 3), {shR: 70, elR: 80 + Math.sin(f / 7) * 15})} expr="neutral" dir={-1} />
      <rect x={1060} y={668} width={80} height={14} rx={6} fill="#F4F0E4" stroke={ink} strokeWidth={2} />
      {/* painted dividing line */}
      <rect x={1904} y={-300} width={32} height={1700} fill={ink} />
      {/* German winter street */}
      <g transform="translate(1920,0)">
        <Sky top="#8A96A4" bottom="#D8DAD8" />
        {[[-40, 380, 620, '#9A9A92'], [330, 400, 560, '#8E8A84'], [1260, 420, 600, '#9A948C'], [1640, 360, 640, '#8A8680']].map(([x, w, h, c], i) => (
          <Building key={i} x={x as number} base={780} w={w as number} h={h as number} color={c as string} seed={i + 11} f={f} />
        ))}
        {/* shop with bare shelves */}
        <rect x={740} y={300} width={520} height={480} fill="#8A7A6A" stroke={ink} strokeWidth={5} />
        <rect x={790} y={400} width={420} height={250} fill="#3A3634" stroke={ink} strokeWidth={4} />
        {[470, 540, 610].map((y) => <rect key={y} x={800} y={y} width={400} height={10} fill="#7A6A5A" />)}
        <rect x={850} y={320} width={300} height={60} rx={8} fill="#D8CCB0" stroke={ink} strokeWidth={4} />
        <ellipse cx={1000} cy={350} rx={60} ry={20} fill="#B88A4A" stroke={ink} strokeWidth={3} />
        <rect x={0} y={780} width={1920} height={400} fill="#E8EAE8" />
        <line x1={0} y1={780} x2={1920} y2={780} stroke={ink} strokeWidth={5} />
        {['woman3', 'kid1', 'woman1', 'woman2', 'kid2', 'woman3', 'woman1'].map((k, i) => {
          const x = 680 - i * 110 + Math.min(t * 0.25, 60);
          return (
            <g key={i}>
              <Fig k={k} x={x} y={880} f={f + i * 7} s={0.85} pose={(f + i * 20) % 90 < 30 ? walk((f + i * 9) / 30, 0.25) : addPose(stand(f, i), {headTilt: 8})} expr="cold" outfit={{...CAST[k].outfit, color: mixHex(CAST[k].outfit.color ?? '#777777', '#6A6A70', 0.4)}} dir={1} />
              <circle cx={x + 40} cy={880 - (CAST[k].child ? 150 : 220) * 0.85 + 30} r={8 + ((f + i * 13) % 40) / 4} fill="#FFFFFF" opacity={0.5 * (1 - ((f + i * 13) % 40) / 40)} />
            </g>
          );
        })}
        <Particles f={f} kind="snow" n={70} seed={61} wind={0.5} opacity={0.9} />
      </g>
    </Shot>
  );
};

export const S08Picture: React.FC<{f: number}> = ({f}) => (
  <ShotTrack
    f={f}
    shots={[
      {from: T[0], to: T[1], el: <HighStreet f={f} />},
      {from: T[1], to: T[2], el: <WomenAtWork f={f} />, trans: 'wipe'},
      {from: T[2], to: T[3], el: <Platform f={f} />, trans: 'fade'},
      {from: T[3], to: T[4], el: <Schoolroom f={f} />, trans: 'dip'},
      {from: T[4], to: T[5], el: <Rationing f={f} />, trans: 'cut'},
    ]}
  />
);

export const S08Overlay: React.FC = () => (
  <g>
    <DateCard at={abs(455.3)} until={abs(460.3)} date="1916" title="CONSCRIPTION" />
    <FactPill at={abs(465.1)} until={abs(469.5)} text="BY 1918: ALMOST A MILLION BRITISH WOMEN IN MUNITIONS" x={1860} y={170} anchor="end" maxW={800} />
    <OLabel at={abs(470.4)} until={abs(475.4)} text={'"CANARIES"'} sub="TNT turned their skin yellow" x={W / 2} y={170} size={48} tone="yellow" />
    <OLabel at={abs(476.6)} until={abs(480.7)} text="VOLUNTARY AID DETACHMENT (VAD) NURSES" x={W / 2} y={160} size={38} />
    <DateCard at={abs(482.5)} until={abs(487.7)} date="13 JUNE 1917" title="POPLAR, LONDON" tone="dark" />
    <FactPill at={abs(483.0)} until={abs(487.8)} text="AIR RAIDS ON BRITAIN, 1915–18: ABOUT 1,400 KILLED (EST.)" x={1860} y={640} anchor="end" maxW={760} />
    <DateCard at={abs(488.9)} until={abs(493.2)} date="1918" title="RATIONING IN BRITAIN" />
    <FactPill at={abs(494.4)} until={END - 6} text="BRITISH NAVAL BLOCKADE: SEVERE FOOD SHORTAGES IN GERMANY" x={1860} y={170} anchor="end" maxW={800} />
  </g>
);
