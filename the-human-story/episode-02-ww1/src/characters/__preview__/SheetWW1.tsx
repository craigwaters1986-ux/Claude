// Episode 2 (WW1) style sample: the period cast in a simple trench setting (animator verification;
// the trench backdrop here is a stand-in, not an environment-library asset).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../../styles/theme';
import {StickFigure} from '../StickFigure';
import {CAST} from '../cast';
import {stand, standStiff, walk, run, march, kneelAim, cower, talkGesture, holdFront} from '../poses';
import {RifleAim, RifleSlung, Shell} from '../props';
import {BarbedWire} from '../../components/Environment';
import type {Expression} from '../Head';
import type {Skeleton} from '../skeleton';

const Fig: React.FC<{k: string; x: number; y: number; f: number; pose: any; expr: Expression; dir?: 1 | -1; s?: number} & Record<string, any>> = ({k, x, y, f, pose, expr, dir, s = 1, ...rest}) => {
  const c = CAST[k];
  return <StickFigure x={x} y={y} f={f} seed={(x % 97) + 1} scale={s} dir={dir} pose={pose} head={{...c.head, expression: expr}} outfit={c.outfit} child={c.child} label={c.label} sublabel={c.sublabel} {...rest} />;
};

const Sandbags: React.FC<{y0: number; y1: number}> = ({y0, y1}) => {
  const rows: React.ReactNode[] = [];
  const h = 46;
  let r = 0;
  for (let y = y0; y < y1; y += h - 4, r++) {
    for (let x = -60 + (r % 2) * 55; x < 1980; x += 110) {
      const tone = ['#B5A37A', '#A8956A', '#BCAB84'][(((r * 7 + Math.round(x / 110)) % 3) + 3) % 3];
      rows.push(<rect key={`${r}-${x}`} x={x} y={y} width={106} height={h} rx={18} fill={tone} stroke={C.ink} strokeWidth={3.5} />);
    }
  }
  return <g>{rows}</g>;
};

export const StyleSampleWW1: React.FC = () => {
  const f = useCurrentFrame();
  const aimOverlay = (sk: Skeleton) => <RifleAim stock={{x: sk.armR.hx, y: sk.armR.hy}} grip={{x: sk.armL.hx, y: sk.armL.hy}} len={130} />;
  const back = 0.86;
  const by = 735;
  const fy = 1015;
  return (
    <AbsoluteFill style={{background: '#D9D6CA'}}>
      <svg width={1920} height={1080}>
        {/* overcast sky, parapet with wire, sandbag wall, revetment posts, mud floor with duckboards */}
        <defs>
          <linearGradient id="ww1sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#B9BDB6" />
            <stop offset="1" stopColor="#E2DDCC" />
          </linearGradient>
        </defs>
        <rect width={1920} height={400} fill="url(#ww1sky)" />
        <BarbedWire x0={-20} x1={1940} y={300} posts={9} h={90} />
        <Sandbags y0={290} y1={760} />
        {[240, 760, 1280, 1800].map((x) => <rect key={x} x={x} y={300} width={22} height={470} fill="#6B4E32" stroke={C.ink} strokeWidth={3.5} />)}
        <rect y={740} width={1920} height={340} fill="#7A6248" />
        <path d="M0,740 Q480,728 960,742 T1920,738" fill="none" stroke={C.ink} strokeWidth={4} />
        <rect x={-10} y={920} width={1940} height={120} fill="#A88A5E" stroke={C.ink} strokeWidth={4} />
        {Array.from({length: 33}, (_, i) => <line key={i} x1={i * 60} y1={920} x2={i * 60 - 8} y2={1040} stroke={C.ink} strokeWidth={3} />)}

        {/* back row (smaller): Russian, Austro-Hungarian, Ottoman, French 1915, VAD, munitionette, historical figures */}
        <Fig k="russianSoldier" x={120} y={by} s={back} f={f} pose={stand(f, 1)} expr="determined" back={<RifleSlung />} />
        <Fig k="austroSoldier" x={330} y={by} s={back} f={f} pose={walk(f / 30 + 0.2)} expr="worried" />
        <Fig k="ottomanSoldier" x={540} y={by} s={back} f={f} pose={standStiff(f, 2)} expr="determined" dir={-1} />
        <Fig k="frenchSoldier1915" x={750} y={by} s={back} f={f} pose={walk(f / 30 + 0.55)} expr="tired" back={<RifleSlung />} />
        <Fig k="vadNurse" x={970} y={by} s={back} f={f} pose={talkGesture(f, 3)} expr="happy" talking dir={-1} />
        <Fig k="munitionette" x={1180} y={by} s={back} f={f} pose={holdFront(f, 2)} expr="curious" holdR={<Shell rot={-120} />} />
        <Fig k="franzFerdinand" x={1380} y={by} s={back} f={f} pose={standStiff(f, 5)} expr="smug" />
        <Fig k="princip" x={1775} y={by} s={back} f={f} pose={stand(f, 6)} expr="worried" dir={-1} />

        {/* front row: Britain 1914 / 1916, France 1914, Germany 1914 / 1916, gas mask */}
        <Fig k="britSoldier1914" x={170} y={fy} f={f} pose={march(f / 30)} expr="happy" back={<RifleSlung />} />
        <Fig k="frenchSoldier1914" x={500} y={fy} f={f} pose={run(f / 20)} expr="shout" talking />
        <Fig k="britSoldier1916" x={830} y={fy} f={f} pose={kneelAim(f)} expr="determined" overlay={aimOverlay} />
        <Fig k="britGasMask" x={1130} y={fy} f={f} pose={cower(f)} expr="scared" />
        <Fig k="germanSoldier1914" x={1440} y={fy} f={f} pose={march(f / 30 + 0.5)} expr="determined" dir={-1} back={<RifleSlung />} />
        <Fig k="germanSoldier1916" x={1750} y={fy} f={f} pose={stand(f, 9)} expr="tired" dir={-1} />
      </svg>
    </AbsoluteFill>
  );
};
