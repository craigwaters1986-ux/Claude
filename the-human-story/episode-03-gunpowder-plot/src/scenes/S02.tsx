// s02 · A new king (0:45-2:05)
import React from 'react';
import {Shots, Frame, Cam, sf} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {T, sectionWindow} from '../timeline';
import {ChapterCard} from '../kit/Cards';
import {BaseMap, PlaceDot, RegionLabel, CrownIcon, useProjection, VIEW_BRITAIN, PLACES} from '../kit/Maps';
import {GroupTag} from '../characters/StickFigure';
import {RoomShot, StreetShot, CandleCircleShot, Portrait, Banner, walker, bellSwing, HeldLetter, stand, standStiff, addPose, prog, clamp, kf, seated, LetterDeskShot} from './sets';
import {BoardTable, PlaceTag, INK} from '../kit/Places';
import {Particles, Vignette} from '../components/Effects';
import {C, FONT} from '../styles/theme';
import {parishWalk} from '../characters/parishWalk';

const [S, E] = sectionWindow('s02');
const rel = (t: number, shotAt: number) => sf(t - shotAt);

const CrownsMap: React.FC<{f: number; d: number; at: number}> = ({f, d, at}) => {
  const proj = useProjection(VIEW_BRITAIN, [360, 30, 1560, 900]);
  const ed = proj(PLACES.Edinburgh)!, ld = proj(PLACES.London)!;
  const tEliz = rel(T('Elizabeth the First had died'), at), tScot = rel(T('already a king in Scotland') - 1.2, at);
  const tVI = rel(T('The Scots knew him'), at), tI = rel(T('now the English would'), at), tBoth = rel(T('One man now wore both crowns'), at);
  const tCath = rel(T('Among the people watching'), at);
  const z = kf(f, [[0, 1.9], [sf(3.2), 1.0], [d, 1.04]]);
  const cy = kf(f, [[0, 760], [sf(3.2), 470], [d, 480]]);
  const jx = kf(f, [[tBoth, ld[0]], [tBoth + 40, (ed[0] + ld[0]) / 2 + 160]]);
  const jy = kf(f, [[tBoth, ld[1]], [tBoth + 40, (ed[1] + ld[1]) / 2 + 120]]);
  const walk = parishWalk(Math.max(0, f - tBoth) * 1.6, false, 0.2, prog(f, tBoth + 34, tBoth + 60));
  return (
    <Frame bg="#9DB7BD">
      <Cam f={f} keys={[[0, z, 960, cy], [d, z, 960, cy]]}>
        <BaseMap proj={proj} id="crowns" tint={prog(f, sf(2.5), sf(4))} />
        <RegionLabel proj={proj} at={[-5.0, 57.75]} text="SCOTLAND" t={prog(f, sf(3), sf(4))} />
        <RegionLabel proj={proj} at={[-1.9, 53.75]} text="ENGLAND" t={prog(f, sf(3), sf(4))} />
        <PlaceDot proj={proj} at={PLACES.Edinburgh} label="Edinburgh" side="right" t={prog(f, tScot - 10, tScot + 6)} />
        <PlaceDot proj={proj} at={PLACES.London} label="London" side="right" t={prog(f, sf(3.4), sf(4.2))} />
        <Portrait x={ld[0] - 300} y={ld[1] - 250} id="elizabethI" f={f} s={0.7} t={prog(f, tEliz - 8, tEliz + 10) * (1 - prog(f, tScot + 30, tScot + 50))} grey={prog(f, tEliz + 20, tEliz + 50)} label="ELIZABETH I" sub="died March 1603" expression="solemn" />
        <CrownIcon x={ed[0]} y={ed[1] - 70} t={prog(f, tScot, tScot + 14)} />
        <CrownIcon x={ld[0]} y={ld[1] - 70} t={prog(f, tI, tI + 14)} />
        <g opacity={prog(f, tVI, tVI + 12)}><text x={ed[0] - 40} y={ed[1] + 52} textAnchor="end" fontFamily={FONT.sans} fontWeight={900} fontSize={34} fill={INK} stroke="#F4EBD6" strokeWidth={7} paintOrder="stroke">James VI of Scotland</text></g>
        <g opacity={prog(f, tI, tI + 12)}><text x={ld[0] - 40} y={ld[1] + 12} textAnchor="end" fontFamily={FONT.sans} fontWeight={900} fontSize={34} fill={INK} stroke="#F4EBD6" strokeWidth={7} paintOrder="stroke">James I of England</text></g>
        {f > tBoth - 4 && (
          <g opacity={prog(f, tBoth - 4, tBoth + 8)}>
            <path d={`M${ed[0]},${ed[1] - 40} Q${jx + 40},${jy - 420} ${jx},${jy - 330} Q${jx - 40},${jy - 420} ${ld[0]},${ld[1] - 40}`} fill="none" stroke={C.gold} strokeWidth={5} strokeDasharray="12 10" opacity={0.85} />
            <Person id="james" x={jx} y={jy} scale={1.0} f={f} seed={8} pose={f < tBoth + 40 ? walk : addPose(stand(f, 8), {shL: 30, shR: 30, elL: 40, elR: 40})} tag={f > tBoth + 30} expression="smug" shadow />
          </g>
        )}
        {f > tCath - 4 && Array.from({length: 7}, (_, i) => {
          const x = ld[0] - 360 + i * 70, y = ld[1] + 190;
          return <Person key={i} id={i % 3 === 0 ? 'mother' : i % 3 === 1 ? 'father' : 'neighbour'} x={x} y={y} scale={0.5} f={f + i * 9} seed={i} pose={stand(f, i)} look={[0.3, -0.8]} expression="curious" opacity={prog(f, tCath + i * 3, tCath + i * 3 + 10)} />;
        })}
        {f > tCath && <GroupTag x={ld[0] - 150} y={ld[1] + 210} text="ENGLAND’S CATHOLICS" opacity={prog(f, tCath + 20, tCath + 34)} scale={0.9} />}
      </Cam>
      <Vignette strength={0.3} />
    </Frame>
  );
};

/** The parish family's table: coins for the fines, a candle; `mood` drives expressions. */
const Household: React.FC<{f: number; d: number; coins?: [number, number]; mood?: 'worried' | 'curious' | 'sad'; portrait?: number; cam?: [number, number, number, number][]}> = ({f, d, coins, mood = 'worried', portrait = 0, cam}) => {
  const n = coins ? Math.round(kf(f, [[coins[0], 10], [coins[1], 2]])) : 0;
  return (
    <RoomShot f={f} d={d} tone="plain" fire window="grey" fireX={1700} cam={cam ?? [[0, 1.05, 960, 520], [d, 1.12, 960, 520]]}>
      {(f) => (
        <>
          {portrait > 0 && <Portrait x={700} y={330} id="james" f={f} s={0.62} t={portrait} label="THE NEW KING" />}
          <BoardTable x={760} y={760} w={520} cloth="#7A5A3A" h={90} />
          <Person id="father" x={700} y={840} scale={1.3} f={f} seed={2} pose={addPose(seated(f, 2), {shR: 60, elR: 70, headTilt: 10})} expression={mood} look={[0.6, 0.4]} />
          <Person id="mother" x={1340} y={840} dir={-1} scale={1.27} f={f} seed={4} pose={addPose(seated(f, 4), {headTilt: 8})} expression={mood} look={[-0.5, 0.3]} />
          <Person id="child" x={1060} y={800} scale={1.2} f={f} seed={6} pose={stand(f, 6)} expression={mood === 'curious' ? 'curious' : 'worried'} look={[0.2, 0.3]} />
          {Array.from({length: n}, (_, i) => <ellipse key={i} cx={980 + (i % 2) * 6} cy={736 - i * 7} rx={22} ry={7} fill={C.gold} stroke={INK} strokeWidth={3} />)}
        </>
      )}
    </RoomShot>
  );
};

export const S02: React.FC = () => (
  <Shots
    start={S}
    end={E}
    shots={[
      {at: S, el: (f, d) => <Frame><ChapterCard f={f} d={d} num={1} title="A New King" date="1603–1604" /></Frame>, trans: 'cut'},
      {at: S + 3, el: (f, d) => <CrownsMap f={f} d={d} at={S + 3} />, trans: 'fade'},
      // Sunday morning: the bell calls the parish to church
      {
        at: T('English law required attendance'),
        el: (f, d) => (
          <StreetShot f={f} d={d} time="day" bell={bellSwing(f, 4, 15, 120)} tag={{text: 'A PARISH STREET', sub: 'illustration'}}>
            {(f) => (
              <>
                {[0, 1, 2, 3].map((i) => {
                  const w = walker(f, i * 10, 140 + i * 12, 2.1, false, i * 0.27);
                  const x = 200 + i * 120 + 1.3 * w.d;
                  return <Person key={i} id={['neighbourMan', 'neighbour', 'crier', 'neighbourMan'][i]} x={Math.min(x, 1290)} y={846} scale={1.3} f={f} seed={i * 11} pose={w.p} opacity={1 - prog(f, 150 + i * 12, 170 + i * 12)} head={i === 2 ? {hat: 'none'} : {}} outfit={i === 2 ? {color: '#5E5446'} : {}} />;
                })}
                <Person id="mother" x={1600} y={850} dir={-1} scale={1.45} f={f} seed={12} pose={stand(f, 12)} look={[-0.8, -0.4]} expression="worried" />
                <Person id="child" x={1730} y={856} dir={-1} scale={1.25} f={f} seed={37} pose={stand(f, 37)} look={[-0.8, -0.2]} expression="curious" />
              </>
            )}
          </StreetShot>
        ),
      },
      {
        at: T('Catholics who stayed'),
        el: (f, d) => (
          <>
            <Household f={f} d={d} coins={[sf(1.2), sf(6.5)]} />
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}><PlaceTag text="FINES FOR STAYING AWAY" t={prog(f, 12, 28)} /></svg>
          </>
        ),
      },
      {at: T('Some Catholics hoped a change'), el: (f, d) => <Household f={f} d={d} mood="curious" portrait={prog(f, 4, 24)} cam={[[0, 1.0, 960, 500], [d, 1.08, 860, 480]]} />},
      // James's mother was Catholic; his own faith Protestant
      {
        at: T('James had a Catholic mother'),
        el: (f, d) => {
          const t2 = sf(T('although his own upbringing') - T('James had a Catholic mother'));
          return (
            <Frame bg="#2E2622">
              <rect width={1920} height={1080} fill="#3A2E28" />
              <Particles f={f} kind="dust" n={30} seed={4} />
              <Portrait x={640} y={430} id="mary" f={f} s={1.15} t={prog(f, 0, 16)} label="MARY, QUEEN OF SCOTS" sub="Catholic" />
              <path d={`M820,430 H${820 + 280 * prog(f, 20, 40)}`} stroke="#E3C77A" strokeWidth={8} strokeLinecap="round" />
              <path d="M1080,430 l-24,-16 v32Z" fill="#E3C77A" opacity={prog(f, 36, 42)} />
              <Portrait x={1280} y={430} id="james" f={f} s={1.15} t={prog(f, 26, 42)} label="JAMES VI AND I" sub={f > t2 ? 'raised Protestant' : 'her son'} />
            </Frame>
          );
        },
      },
      // peace with Spain (1604)
      {
        at: T('Then came peace between England'),
        el: (f, d) => (
          <RoomShot f={f} d={d} tone="green" window="day" tag={{text: 'PEACE WITH SPAIN', sub: '1604'}} cam={[[0, 1.1, 960, 560], [d, 1.0, 960, 540]]}>
            {(f) => {
              const reach = prog(f, 20, 44);
              return (
                <>
                  <Banner x={360} y={800} kind="en" f={f} />
                  <Banner x={1560} y={800} kind="es" f={f} />
                  <BoardTable x={760} y={780} w={400} cloth="#7E2620" h={70} />
                  <Person id="envoyEN" x={760} y={840} scale={1.4} f={f} seed={3} pose={addPose(standStiff(f, 3), {shR: 70 * reach, elR: 10 * reach, lean: 6 * reach})} expression="smug" />
                  <Person id="envoyES" x={1160} y={840} dir={-1} scale={1.4} f={f} seed={4} pose={addPose(standStiff(f, 4), {shR: 70 * reach, elR: 10 * reach, lean: 6 * reach})} expression="smug" />
                </>
              );
            }}
          </RoomShot>
        ),
      },
      {at: T('For people hoping that peace abroad'), el: (f, d) => <Household f={f} d={d} mood="sad" portrait={1} cam={[[0, 1.12, 1000, 560], [d, 1.2, 1040, 580]]} />},
      {at: T('Catholics had to decide how'), el: (f, d) => <Household f={f} d={d} mood="worried" cam={[[0, 1.25, 1040, 600], [d, 1.35, 1060, 600]]} />},
      {at: T('One small circle of men'), el: (f, d) => <CandleCircleShot f={f} d={d} />, trans: 'dip'},
      {at: T('Another Catholic would carry the'), el: (f, d) => <LetterDeskShot f={f} d={d} pan={[1.1, 560, 1.18, 600]} hand={false} />},
      // the bell sets the family's pace (parish street, walking proof)
      {
        at: T('Another Catholic would carry the', 0, 'end') + 0.06,
        el: (f, d) => (
          <StreetShot f={f} d={d} time="day" bell={bellSwing(f, 20, 17, 55)}>
            {(f) => {
              const travel = (end: number, sp: number) => sp * (Math.min(f, end) + 24 * (1 - Math.exp(-Math.max(0, f - end) / 24)));
              const wd = travel(70, 2.4), cd = travel(88, 2.25);
              const listen = prog(f, 70, 100);
              const wp = parishWalk(wd, false, 0.07, prog(f, 80, 120));
              wp.headTilt -= 12 * listen;
              const cp = parishWalk(cd, true, 0.36, prog(f, 98, 140));
              return (
                <>
                  <Person id="mother" x={560 + 1.47 * wd} y={846} scale={1.47} f={f} seed={12} pose={wp} look={[listen, -listen]} expression="curious" shadow />
                  <Person id="child" x={380 + 1.25 * cd} y={860} scale={1.25} f={f} seed={37} pose={cp} look={[listen, -listen]} expression="curious" shadow />
                </>
              );
            }}
          </StreetShot>
        ),
      },
    ]}
  />
);

export {PlaceTag, HeldLetter, clamp};
