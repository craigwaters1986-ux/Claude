// s03 · The man behind the plot (2:05-3:40)
import React from 'react';
import {Shots, Frame, Cam, sf} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {T, sectionWindow} from '../timeline';
import {ChapterCard} from '../kit/Cards';
import {NameTag} from '../characters/StickFigure';
import {BaseMap, PlaceDot, RegionLabel, useProjection, VIEW_ENGLAND, PLACES} from '../kit/Maps';
import {RoomShot, Portrait, walker, stand, standStiff, addPose, prog, clamp, kf, seated, talkGesture} from './sets';
import {LordsChamber, Sky, PlaceTag, INK} from '../kit/Places';
import {Particles, Vignette, SombreGrade} from '../components/Effects';
import {Tree, Hills, Clouds} from '../components/Environment';
import {C, FONT} from '../styles/theme';

const [S, E] = sectionWindow('s03');
const FIVE = ['catesby', 'winter', 'percy', 'wright', 'fawkes'];

/** The five men in a London room; `arrive` = shot-local frames at which each walks in; `focus` dims all but one. */
const FiveMen: React.FC<{f: number; d: number; arrive?: number[]; focus?: string; tags?: boolean; gesture?: number; cam?: [number, number, number, number][]}> = ({f, d, arrive, focus, tags = true, gesture = -1, cam}) => (
  <RoomShot f={f} d={d} tone="dark" fire window="day" fireX={1660} windowX={260} tag={arrive ? {text: 'LONDON', sub: 'May 1604'} : undefined} cam={cam ?? [[0, 1.0, 960, 540], [d, 1.04, 960, 540]]}>
    {(f) => (
      <>
        {FIVE.map((id, i) => {
          const home = 420 + i * 270;
          const a = arrive ? arrive[i] : -999;
          const w = walker(f, a, a + 50, 4.6, false, i * 0.21);
          const xx = arrive && i > 0 ? Math.min(home, home - 300 + 1.3 * w.d) : home;
          const walking = arrive && i > 0 && f >= a && f < a + 60;
          const present = !arrive || i === 0 || f >= a;
          const dim = focus && focus !== id ? 0.35 : 1;
          let p = walking ? w.p : stand(f, i * 3);
          if (id === 'catesby' && gesture >= 0) p = addPose(talkGesture(f, 2), {shR: 60 * prog(f, gesture, gesture + 12)});
          if (gesture >= 0 && id !== 'catesby') p = addPose(p, {lean: -3, headTilt: 6});
          return present ? (
            <g key={id} opacity={dim * (arrive && i > 0 ? prog(f, a, a + 8) : 1)}>
              <Person id={id} x={i === 0 || !arrive ? home : xx} y={846} scale={1.3} f={f} seed={i * 5} pose={p} look={id === 'catesby' ? [0.6, 0] : [-0.6, 0]} expression={id === 'catesby' && gesture >= 0 ? 'determined' : 'neutral'} dir={id === 'catesby' ? 1 : -1} shadow />
            </g>
          ) : null;
        })}
        {tags &&
          FIVE.map((id, i) => {
            const a = arrive ? arrive[i] : 0;
            const t = arrive ? prog(f, a + 12, a + 24) : 1;
            const labels: Record<string, string> = {catesby: 'ROBERT CATESBY', winter: 'THOMAS WINTER', percy: 'THOMAS PERCY', wright: 'JOHN WRIGHT', fawkes: 'GUY FAWKES'};
            const hot = !focus || focus === id;
            return t > 0 ? <NameTag key={id} x={420 + i * 270} y={i % 2 ? 418 : 360} text={labels[id]} opacity={t * (hot ? 1 : 0.45)} /> : null;
          })}
      </>
    )}
  </RoomShot>
);

/** State Opening: the king on the throne, lords on the benches, members of the Commons at the bar. */
const StateOpening: React.FC<{f: number; d: number; speak?: number; members?: number; turn?: number; cam?: [number, number, number, number][]}> = ({f, d, speak = -1, members = -1, turn = -1, cam}) => (
  <Frame>
    <Cam f={f} keys={cam ?? [[0, 1.0, 960, 520], [d, 1.08, 960, 500]]}>
      <LordsChamber f={f} />
      <Person id="james" x={960} y={590} scale={1.05} f={f} seed={1} pose={speak >= 0 && f > speak ? talkGesture(f, 1) : standStiff(f, 1)} expression="neutral" />
      {[0, 1, 2, 3].map((i) => (
        <Person key={'l' + i} id="lord" x={120 + i * 150} y={760 - i * 14} scale={0.95} f={f + i * 13} seed={i} pose={seated(f, i)} look={[0.8, -0.3]} expression={turn >= 0 && f > turn && i % 2 ? 'worried' : 'neutral'} head={turn >= 0 && f > turn ? {} : {}} turn={turn >= 0 && f > turn + i * 4 && i % 2 ? -0.4 : 0.4} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Person key={'r' + i} id="lord" dir={-1} x={1800 - i * 150} y={760 - i * 14} scale={0.95} f={f + i * 17} seed={i + 5} pose={seated(f, i + 5)} look={[0.8, -0.3]} expression={turn >= 0 && f > turn && i % 2 === 0 ? 'smug' : 'neutral'} />
      ))}
      {members >= 0 &&
        [0, 1, 2, 3, 4].map((i) => {
          const w = walker(f, members + i * 8, members + 60 + i * 8, 1.8, false, i * 0.3);
          return <Person key={'m' + i} id="member" x={640 + i * 160 + w.d * 0.3} y={900} scale={1.15} f={f} seed={i + 20} pose={w.p} opacity={prog(f, members + i * 8, members + i * 8 + 12)} fromBehind />;
        })}
    </Cam>
    <PlaceTag text="THE STATE OPENING" sub="the House of Lords, Westminster" t={prog(f, 10, 26) * (1 - prog(f, 200, 216))} />
    <Vignette strength={0.35} />
  </Frame>
);

/** England and the Midlands: hoped-for support drawn as dashed, empty outlines. */
const MidlandsMap: React.FC<{f: number; d: number; hoped?: number; fade?: number; princess?: number; paper?: number}> = ({f, d, hoped = 0, fade = 0, princess = 0, paper = 0}) => {
  const proj = useProjection(VIEW_ENGLAND, [140, 40, 1780, 900]);
  const [mx, my] = proj([-1.7, 52.55])!;
  return (
    <Frame bg="#9DB7BD">
      <Cam f={f} keys={[[0, 1.0, 960, 470], [d, 1.06, 900, 470]]}>
        <BaseMap proj={proj} id="midlands" border={0} />
        <ellipse cx={mx} cy={my} rx={300} ry={190} fill="#B23A2E" opacity={0.14 * prog(f, 6, 20)} stroke="#B23A2E" strokeWidth={5} strokeDasharray="16 10" />
        <RegionLabel proj={proj} at={[-1.7, 53.15]} text="THE MIDLANDS" t={prog(f, 6, 20)} size={40} />
        <PlaceDot proj={proj} at={PLACES.London} label="London" side="right" />
        <PlaceDot proj={proj} at={PLACES.Westminster} label="" t={0} />
        {Array.from({length: 9}, (_, i) => {
          const x = mx - 230 + (i % 5) * 115 + (i > 4 ? 55 : 0), y = my - 40 + (i > 4 ? 110 : 0);
          const t = prog(f, hoped + i * 4, hoped + i * 4 + 12) * (1 - fade);
          return t > 0 ? (
            <g key={i} opacity={t} transform={`translate(${x},${y}) scale(0.55)`}>
              <circle cy={-150} r={40} fill="none" stroke={INK} strokeWidth={5} strokeDasharray="10 8" />
              <path d="M0,-110 V-20 M0,-80 L-40,-40 M0,-80 L40,-40 M0,-20 L-30,40 M0,-20 L30,40" stroke={INK} strokeWidth={6} strokeDasharray="10 8" fill="none" />
            </g>
          ) : null;
        })}
        {hoped > 0 && (
          <text x={mx} y={my + 170} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={30} fill={INK} stroke="#F4EBD6" strokeWidth={6} paintOrder="stroke" opacity={prog(f, hoped + 20, hoped + 34) * (1 - fade)}>
            Catholic gentlemen they hoped would rally
          </text>
        )}
      </Cam>
      {princess > 0 && <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}><Portrait x={1560} y={420} id="princess" f={f} s={0.95} t={princess} label="PRINCESS ELIZABETH" sub="daughter of James" /></svg>}
      {paper > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <g opacity={paper} transform={`translate(1180,${560 + (1 - paper) * 30}) rotate(-4)`}>
            <rect x={-150} y={-110} width={300} height={220} rx={6} fill="#EFE2C2" stroke={INK} strokeWidth={5} />
            <text x={0} y={-50} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={30} fill={INK}>A CLAIM</text>
            <text x={0} y={-14} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={30} fill={INK}>TO THE THRONE?</text>
            <path d="M-100,30 h200 M-100,56 h160" stroke="#6B5640" strokeWidth={6} />
          </g>
        </svg>
      )}
      <Vignette strength={0.3} />
    </Frame>
  );
};

/** Empty Midlands roads at dusk: the expected rising does not come. */
const EmptyRoad: React.FC<{f: number; d: number}> = ({f, d}) => (
  <Frame>
    <Cam f={f} keys={[[0, 1.0, 960, 540], [d, 1.05, 1000, 540]]}>
      <Sky time="dusk" id="road" />
      <Clouds f={f} n={5} seed={4} speed={0.3} yMin={80} yMax={300} color="#C9B8A6" s={0.9} />
      <Hills y={620} color="#7E8A6A" amp={50} seed={3} />
      <Hills y={700} color="#6E7A5A" amp={40} seed={7} />
      <path d="M760,920 C820,820 900,760 960,700 C1010,650 1080,630 1160,610" fill="none" stroke="#B8A27E" strokeWidth={90} strokeLinecap="round" />
      <path d="M760,920 C820,820 900,760 960,700 C1010,650 1080,630 1160,610" fill="none" stroke="#C9B48E" strokeWidth={70} strokeLinecap="round" />
      {[[300, 760, 1.4], [1500, 720, 1.2], [1700, 780, 1.6], [520, 700, 0.9]].map(([x, y, s], i) => <Tree key={i} x={x} y={y} s={s} f={f} seed={i} kind="bare" color="#5E6A4A" />)}
      <g transform="translate(1260,700)">
        <rect x={-6} y={-150} width={12} height={150} fill="#5A4630" stroke={INK} strokeWidth={3} />
        <path d="M0,-140 H120 L140,-122 L120,-104 H0Z" fill="#C9B48E" stroke={INK} strokeWidth={4} />
      </g>
    </Cam>
    <Particles f={f} kind="dust" n={30} seed={2} wind={1.2} opacity={0.6} />
    <PlaceTag text="THE MIDLANDS" sub="the rising they expected did not come" t={prog(f, 10, 26)} />
    <Vignette strength={0.45} />
  </Frame>
);

export const S03: React.FC = () => {
  const tMeet = T('In May 1604, Catesby met four');
  const arrive = [0, sf(T('men in London: Thomas Winter') - tMeet + 2.6), sf(T('Thomas Percy, John Wright') - tMeet), sf(T('Thomas Percy, John Wright') - tMeet + 1.1), sf(T('Thomas Percy, John Wright') - tMeet + 2.1)];
  return (
    <Shots
      start={S}
      end={E}
      shots={[
        {at: S, el: (f, d) => <Frame><ChapterCard f={f} d={d} num={2} title="The Man Behind the Plot" date="1604" /></Frame>, trans: 'cut'},
        {
          at: S + 3,
          el: (f, d) => (
            <RoomShot f={f} d={d} tone="oak" fire window="dusk" tag={{text: 'WARWICKSHIRE', at: 4}} cam={[[0, 1.15, 900, 560], [d, 1.0, 960, 540]]}>
              {(f) => {
                const w = walker(f, 30, 120, 1.9);
                return <Person id="catesby" x={520 + 1.45 * w.d} y={846} scale={1.45} f={f} seed={2} pose={f < 30 ? addPose(stand(f, 2), {headTilt: 10}) : w.p} look={[0.5, 0.1]} expression="determined" tag={f > sf(T('conspiracy was Robert Catesby') - S - 3)} shadow />;
              }}
            </RoomShot>
          ),
        },
        {at: tMeet, el: (f, d) => <FiveMen f={f} d={d} arrive={arrive} />},
        {at: T('Of those five names'), el: (f, d) => <FiveMen f={f} d={d} focus="fawkes" cam={[[0, 1.0, 960, 540], [d, 1.2, 1500, 560]]} />},
        {at: T('It was Catesby who proposed'), el: (f, d) => <FiveMen f={f} d={d} focus="catesby" gesture={6} tags={false} cam={[[0, 1.15, 600, 560], [d, 1.25, 620, 560]]} />},
        {
          at: T('It was Catesby who proposed', 0, 'end') + 0.05,
          el: (f, d) => (
            <RoomShot f={f} d={d} tone="dark" window="night" windowX={1100} cam={[[0, 1.3, 1000, 560], [d, 1.4, 1020, 560]]}>
              {(f) => <Person id="fawkes" x={980} y={846} scale={1.5} f={f} seed={9} pose={addPose(stand(f, 9), {headTilt: -4})} look={[0.7, -0.2]} expression="determined" label="GUY FAWKES" sublabel="one of the five" shadow />}
            </RoomShot>
          ),
        },
        {at: T('His intended victims were the king'), el: (f, d) => <StateOpening f={f} d={d} speak={sf(T('James would address the political') - T('His intended victims were the king'))} members={sf(T('Members of the Commons') - T('His intended victims were the king'))} turn={sf(T('Men who disagreed about') - T('His intended victims were the king'))} cam={[[0, 1.0, 960, 520], [d, 1.12, 960, 520]]} />},
        {at: T('beyond Westminster'), el: (f, d) => <MidlandsMap f={f} d={d} hoped={sf(T('The conspirators hoped') - T('beyond Westminster'))} princess={prog(f, sf(T("James’s young daughter") - T('beyond Westminster')), sf(T("James’s young daughter") - T('beyond Westminster')) + 16)} paper={prog(f, sf(T('On paper') - T('beyond Westminster')), sf(T('On paper') - T('beyond Westminster')) + 14) * (1 - prog(f, sf(T('In life, she was') - T('beyond Westminster')) - 10, sf(T('In life, she was') - T('beyond Westminster'))))} />},
        {
          at: T('In life, she was'),
          el: (f, d) => (
            <RoomShot f={f} d={d} tone="green" window="day" windowX={1080} cam={[[0, 1.1, 1100, 560], [d, 1.3, 1160, 600]]}>
              {(f) => (
                <>
                  <Person id="princess" x={1140} y={846} scale={1.5} f={f} seed={3} pose={addPose(stand(f, 3), {headTilt: -6})} look={[0.6, -0.5]} expression="neutral" tag shadow />
                  <SombreGrade amount={0.35 * prog(f, 20, 60)} />
                </>
              )}
            </RoomShot>
          ),
        },
        {at: T('In life, she was', 0, 'end') + 0.05, el: (f, d) => <MidlandsMap f={f} d={d} hoped={-20} fade={prog(f, sf(T('depended existed largely') - T('In life, she was', 0, 'end')), sf(T('depended existed largely') - T('In life, she was', 0, 'end')) + 40)} princess={1 - prog(f, 40, 60)} />},
        {at: T('the conspirators’ expectations', 0, 'end') + 0.1, el: (f, d) => <EmptyRoad f={f} d={d} />},
      ]}
    />
  );
};

export {clamp, kf, C};
