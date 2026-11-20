// A-08 Crowd system: 20–120 small figures from a cast pool, depth-sorted, with
// staggered cheer / wave / stand / clap cycles, blinking and a cheap level of detail.
// Deterministic: everything derives from `seed`, so frames render independently.
import React, {useMemo} from 'react';
import {StickFigure} from './StickFigure';
import {CAST, CROWD_POOLS} from './cast';
import {cheerV, waveSide, stand, standStiff, pose, Pose, mixPose} from './poses';
import type {Expression, Hat} from './Head';
import {rng} from '../animations/core';

export type CrowdAction = 'cheer' | 'wave' | 'stand' | 'clap' | 'still';

export type CrowdProps = {
  f: number;
  count?: number; // 20–120
  x0?: number; // world x range
  x1?: number;
  yBack?: number; // ground line of the back row (smallest figures)
  yFront?: number; // ground line of the front row (largest figures)
  scaleBack?: number; // default 0.35
  scaleFront?: number; // default 0.7
  pool?: string | string[]; // CROWD_POOLS key or a list of CAST keys
  mix?: Partial<Record<CrowdAction, number>>; // weights, e.g. {cheer: 3, wave: 2, stand: 1}
  view?: 'front' | 'back' | 'mixed'; // back = rally seen from behind
  excitement?: number; // 0..1 scales motion (0 = everyone falls still: e.g. the silence after S03-09)
  expression?: Expression; // default: happy/joy for cheering, neutral otherwise
  randomHats?: boolean; // swap civilian hats for variety
  seed?: number;
  lod?: 'auto' | 'full' | 'low'; // auto: low below scale 0.55
  facing?: 1 | -1 | 'random';
  opacity?: number;
  sombre?: boolean; // no cheering, closed mouths, slow
};

const CIV_HATS: Hat[] = ['none', 'none', 'flatCap', 'fedora', 'none', 'headscarf', 'beret'];
const isCivilianHat = (h?: Hat) => !h || h === 'none' || h === 'flatCap' || h === 'fedora' || h === 'beret' || h === 'headscarf';

const clap = (f: number, seed: number): Pose => {
  const k = Math.abs(Math.sin(f / 3.2 + seed));
  return pose({hipL: -4, hipR: 4, shL: 70, elL: 50 + k * 25, shR: 64, elR: 52 + k * 25, bob: Math.sin(f / 20 + seed), headTilt: -3});
};

export const Crowd: React.FC<CrowdProps> = (p) => {
  const count = Math.max(1, Math.min(160, p.count ?? 40));
  const seed = p.seed ?? 7;
  const poolKeys = typeof p.pool === 'string' ? CROWD_POOLS[p.pool] ?? CROWD_POOLS.finale : p.pool ?? CROWD_POOLS.finale;
  const mixW = p.mix ?? {cheer: 3, wave: 2, stand: 1};
  const x0 = p.x0 ?? 80;
  const x1 = p.x1 ?? 1840;
  const yBack = p.yBack ?? 700;
  const yFront = p.yFront ?? 1000;
  const sB = p.scaleBack ?? 0.35;
  const sF = p.scaleFront ?? 0.7;

  const people = useMemo(() => {
    const r = rng(seed * 9973 + 17);
    const acts = (Object.keys(mixW) as CrowdAction[]).filter((k) => (mixW[k] ?? 0) > 0);
    const total = acts.reduce((a, k) => a + (mixW[k] ?? 0), 0);
    const pick = () => {
      let v = r() * total;
      for (const k of acts) {
        v -= mixW[k] ?? 0;
        if (v <= 0) return k;
      }
      return acts[0] ?? 'stand';
    };
    const list = Array.from({length: count}, (_, i) => {
      const depth = r(); // 0 back .. 1 front
      const key = poolKeys[Math.floor(r() * poolKeys.length)];
      const c = CAST[key] ?? CAST.man1;
      let head = c.head;
      if (p.randomHats && isCivilianHat(c.head.hat) && !c.child) {
        const h = CIV_HATS[Math.floor(r() * CIV_HATS.length)];
        head = {...head, hat: h, hatColor: ['#4A4C4F', '#6B5B47', '#3A3A3A', '#7FA3CC', '#8A5A33'][Math.floor(r() * 5)]};
      }
      const fromBehind = p.view === 'back' ? true : p.view === 'mixed' ? r() < 0.5 : false;
      const dir: 1 | -1 = p.facing === 'random' || p.facing === undefined ? (r() < 0.5 ? 1 : -1) : p.facing;
      return {
        i, key, head, outfit: c.outfit, child: !!c.child, depth,
        x: x0 + ((i + r() * 0.9) / count) * (x1 - x0),
        act: pick(), phase: r() * 20, seedF: 1 + Math.floor(r() * 997), fromBehind, dir,
        turn: (r() - 0.5) * 0.8,
      };
    });
    return list.sort((a, b) => a.depth - b.depth);
  }, [count, seed, poolKeys.join(','), JSON.stringify(mixW), x0, x1, p.view, p.randomHats, p.facing]);

  const ex = Math.max(0, Math.min(1, p.excitement ?? 1));
  return (
    <g opacity={p.opacity ?? 1}>
      {people.map((m) => {
        const s = sB + (sF - sB) * m.depth;
        const y = yBack + (yFront - yBack) * m.depth;
        const lod = p.lod === 'full' ? 'full' : p.lod === 'low' ? 'low' : s < 0.55 ? 'low' : 'full';
        const ff = p.f + m.phase * 3;
        const act: CrowdAction = p.sombre ? 'still' : m.act;
        let ps: Pose;
        switch (act) {
          case 'cheer':
            ps = cheerV(ff, m.seedF);
            break;
          case 'wave':
            ps = waveSide(ff, m.seedF);
            break;
          case 'clap':
            ps = clap(ff, m.seedF);
            break;
          case 'still':
            ps = standStiff(ff, m.seedF);
            break;
          default:
            ps = stand(ff, m.seedF);
        }
        if (act !== 'stand' && act !== 'still' && ex < 1) ps = mixPose(stand(ff, m.seedF), ps, ex);
        const expression: Expression = p.expression ?? (p.sombre ? 'solemn' : ex > 0.5 && (act === 'cheer' || act === 'wave') ? (m.i % 3 === 0 ? 'joy' : 'happy') : 'neutral');
        return (
          <StickFigure
            key={m.i}
            x={m.x}
            y={y}
            f={p.f}
            seed={m.seedF}
            scale={m.child ? s * 1.0 : s}
            dir={m.fromBehind ? 1 : m.dir}
            pose={ps}
            head={{...m.head, expression}}
            outfit={m.outfit}
            child={m.child}
            turn={m.turn}
            talking={!p.sombre && ex > 0.5 && act === 'cheer' && m.i % 2 === 0}
            fromBehind={m.fromBehind}
            lod={lod}
            shadow={lod === 'full'}
          />
        );
      })}
    </g>
  );
};
