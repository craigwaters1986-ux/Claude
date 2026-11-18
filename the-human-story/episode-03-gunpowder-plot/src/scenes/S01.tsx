// s01 · A letter meant for the fire (0:00-0:45)
import React from 'react';
import {Shots, Frame, Cam} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {T, sectionWindow} from '../timeline';
import {LetterDeskShot, RoomShot, PalaceShot, StreetShot, walker, HeldLetter, Lantern, stand, standStiff, addPose, prog, kf} from './sets';
import {TitleOverLetter} from '../kit/Cards';
import {seated} from '../characters/poses';
import {BoardTable, Timbered} from '../kit/Places';

const [S, E] = sectionWindow('s01');

export const S01: React.FC = () => (
  <Shots
    start={S}
    end={E}
    shots={[
      // cold open: paper rustle, a hand smooths the letter flat, the eye travels down the page; the foot of the page is blank
      {at: 0, el: (f, d) => <LetterDeskShot f={f} d={d} unfold={[20, 110]} pan={[1.3, 520, 1.25, 760]} noName={Math.round(T('no name at the') * 30) - 10} />},
      // the man who opened it: Monteagle reads by candlelight
      {
        at: T('but the man who opened it'),
        el: (f, d) => (
          <RoomShot f={f} d={d} tone="dark" fire window="night" cam={[[0, 1.25, 900, 560], [d, 1.15, 900, 560]]}>
            {(f) => (
              <>
                <Person id="monteagle" x={880} y={820} scale={1.45} f={f} seed={3} pose={addPose(stand(f, 3), {shR: 62, elR: 62, shL: 50, elL: 60, headTilt: 12})} holdR={<HeldLetter s={1.3} />} look={[0.2, 0.6]} expression={f > 50 ? 'worried' : 'curious'} tag />
              </>
            )}
          </RoomShot>
        ),
      },
      {at: T('He was due in Parliament'), el: (f, d) => <PalaceShot f={f} d={d} time="day" tag={{text: 'PARLIAMENT', sub: 'Westminster'}} />},
      // he could have stayed at home; the sender stays unseen (an empty doorway)
      {
        at: T('Lord Monteagle could have made'),
        el: (f, d) => (
          <RoomShot f={f} d={d} tone="dark" fire window="night" cam={[[0, 1.0, 960, 540], [d, 1.08, 820, 540]]}>
            {(f) => {
              const w = walker(f, 10, 80, 2.0);
              return (
                <>
                  <BoardTable x={1150} y={720} w={420} cloth="#5A3A2A" h={100} />
                  <Person id="monteagle" x={520 + 1.4 * w.d} y={820} scale={1.4} f={f} seed={3} pose={f < 80 ? w.p : addPose(stand(f, 3), {shR: 30, elR: 50, headTilt: -6})} holdR={<HeldLetter s={1.2} />} look={f > 90 ? [-0.7, -0.2] : [0.3, 0]} expression={f > 120 ? 'worried' : 'neutral'} />
                  {/* the doorway the stranger's message came through: empty */}
                  <path d="M1690,820 V520 Q1760,470 1830,520 V820Z" fill="#141010" stroke="#2B2729" strokeWidth={6} />
                </>
              );
            }}
          </RoomShot>
        ),
      },
      // instead he took it to a minister: Monteagle walks out with the letter
      {
        at: T('Instead, Monteagle took the'),
        el: (f, d) => (
          <StreetShot f={f} d={d} time="dusk" lit={0.8} pan={0.5}>
            {(f) => {
              const w = walker(f, 0, d + 40, 2.6);
              return <Person id="monteagleOut" x={300 + 1.42 * w.d} y={846} scale={1.42} f={f} seed={4} pose={addPose(w.p, {shR: 40, elR: 50})} holdR={<HeldLetter s={1.2} />} look={[0.5, 0]} expression="determined" shadow />;
            }}
          </StreetShot>
        ),
      },
      // within days, an arrest at Westminster; the prisoner gave the name John Johnson
      {
        at: T('officials at Westminster had arrested'),
        el: (f, d) => (
          <PalaceShot f={f} d={d} time="night" lit={0.5} boats={false} cam={[[0, 1.12, 1100, 600], [d, 1.2, 1150, 610]]}>
            {(f) => {
              const w1 = walker(f, 0, d - 30, 1.5), w2 = walker(f, 0, d - 30, 1.5, false, 0.4), w3 = walker(f, 0, d - 30, 1.5, false, 0.7);
              const named = f > (T('We know him as Guy Fawkes') - T('officials at Westminster had arrested')) * 30;
              return (
                <g>
                  <rect x={-300} y={780} width={2520} height={60} fill="#3A3C46" />
                  <Person id="officer" x={760 + 1.3 * w1.d} y={830} scale={1.3} f={f} seed={1} pose={addPose(w1.p, {shR: 70, elR: 40})} holdR={<Lantern f={f} />} expression="determined" />
                  <Person id="fawkes" x={960 + 1.3 * w2.d} y={830} scale={1.3} f={f} seed={2} pose={addPose(w2.p, {shL: 10, shR: 10, elL: 60, elR: 60, headTilt: 8})} expression="solemn" label={named ? 'GUY FAWKES' : 'JOHN JOHNSON'} sublabel={named ? undefined : 'the name he gave'} />
                  <Person id="officer" x={1160 + 1.3 * w3.d} y={830} scale={1.3} f={f} seed={3} pose={w3.p} expression="neutral" head={{hat: 'none', hair: 'short'}} />
                </g>
              );
            }}
          </PalaceShot>
        ),
      },
      {at: T('We know him as Guy Fawkes', 0, 'end') + 0.05, el: (f, d) => <Frame><TitleOverLetter f={f} d={d} /></Frame>, trans: 'dip'},
    ]}
  />
);
