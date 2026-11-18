// s07 · Who had to answer for it? (8:25-10:05). Executions are never depicted; the family is illustrative.
import React from 'react';
import {Shots, Frame, Cam, sf} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {T, sectionWindow} from '../timeline';
import {ChapterCard} from '../kit/Cards';
import {RoomShot, PalaceShot, StreetShot, LetterDeskShot, Portrait, walker, HeldLetter, passPose, stand, standStiff, addPose, prog, clamp, kf, seated, talkGesture} from './sets';
import {HallInterior, LordsChamber, BoardTable, Bench, PlaceTag, INK} from '../kit/Places';
import {PrintedPage, Desk, Journal} from '../kit/Paper';
import {Commons} from './S05';
import {Particles, Vignette, SombreGrade} from '../components/Effects';
import {GroupTag} from '../characters/StickFigure';
import {C, FONT} from '../styles/theme';

const [S, E] = sectionWindow('s07');

const Trial: React.FC<{f: number; d: number}> = ({f, d}) => (
  <Frame>
    <Cam f={f} keys={[[0, 1.0, 960, 520], [d, 1.12, 960, 480]]}>
      <HallInterior f={f} />
      <rect x={760} y={560} width={400} height={60} fill="#7A5A3A" stroke={INK} strokeWidth={5} />
      {[0, 1, 2, 3, 4].map((i) => <Person key={'j' + i} id="judge" x={800 + i * 80} y={600} scale={0.6} f={f + i * 9} seed={i} pose={seated(f, i)} />)}
      {Array.from({length: 8}, (_, i) => <Person key={'p' + i} id={['winter', 'fawkes', 'officer', 'member', 'tresham', 'wright', 'officer', 'member'][i]} x={600 + i * 100} y={800} scale={0.85} f={f + i * 5} seed={i + 10} pose={standStiff(f, i)} fromBehind head={{hat: 'none'}} />)}
      {Array.from({length: 10}, (_, i) => <Person key={'c' + i} id={i % 2 ? 'neighbourMan' : 'member'} x={60 + (i % 5) * 110 + (i > 4 ? 1340 : 0)} y={900} scale={1.0} f={f + i * 7} seed={i + 30} pose={stand(f, i + 30)} fromBehind />)}
    </Cam>
    <PlaceTag text="WESTMINSTER HALL" sub="27 January 1606: eight men on trial" t={prog(f, 8, 24) * (1 - prog(f, d - 24, d - 8))} />
    <Vignette strength={0.45} />
  </Frame>
);

/** Date card on a sombre sky over Old Palace Yard (no execution is shown). */
const OldPalaceYard: React.FC<{f: number; d: number; card?: boolean; tag?: boolean}> = ({f, d, card, tag}) => (
  <>
    <PalaceShot f={f} d={d} time="day" boats={false} cam={[[0, 1.05, 760, 520], [d, 1.0, 760, 500]]}>
      {(f) => (
        <g>
          {Array.from({length: 12}, (_, i) => <Person key={i} id={i % 3 ? 'neighbourMan' : 'neighbour'} x={80 + i * 150} y={900} scale={1.0} f={f + i * 5} seed={i} pose={stand(f, i)} fromBehind />)}
          <SombreGrade amount={0.75} />
        </g>
      )}
    </PalaceShot>
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      {card && (
        <g opacity={prog(f, 6, 20)} transform="translate(960,300)">
          <rect x={-380} y={-80} width={760} height={150} rx={10} fill="#1E1B1A" stroke="#C0A573" strokeWidth={4} />
          <text y={-14} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={46} fill="#F4EBD6">30 AND 31 JANUARY 1606</text>
          <text y={40} textAnchor="middle" fontFamily={FONT.sans} fontWeight={700} fontSize={30} fill="#CFC2A4">the executions</text>
        </g>
      )}
      {tag && <PlaceTag text="OLD PALACE YARD" sub="Westminster, 31 January 1606" t={prog(f, 8, 24)} />}
    </svg>
  </>
);

/** The parish household hears the proclamation from the street. */
const Proclaimed: React.FC<{f: number; d: number; eye?: number; shut?: number}> = ({f, d, eye = -1, shut = -1}) => (
  <StreetShot f={f} d={d} time="grey" pan={0.08} cam={[[0, 1.05, 960, 560], [d, 1.12, 1000, 580]]}>
    {(f) => (
      <>
        <Person id="crier" x={1500} y={846} dir={-1} scale={1.35} f={f} seed={3} pose={addPose(standStiff(f, 3), {shR: 70, elR: 70, shL: 60, elL: 70})} holdR={<HeldLetter s={1.3} />} look={[0, 0.5]} expression="neutral" talking={eye < 0} />
        <Person id="father" x={460} y={846} scale={1.35} f={f} seed={2} pose={stand(f, 2)} look={[0.7, 0]} expression="worried" />
        <Person id="mother" x={620} y={846} scale={1.32} f={f} seed={4} pose={addPose(stand(f, 4), {shL: 30, elL: 40})} look={[0.7, 0]} expression="worried" />
        <Person id="child" x={740} y={856} scale={1.15} f={f} seed={6} pose={stand(f, 6)} look={[0.6, -0.2]} expression="curious" />
        {eye >= 0 && (
          <g opacity={prog(f, eye, eye + 14)}>
            <Person id="neighbour" x={1080} y={846} dir={-1} scale={1.3} f={f} seed={8} pose={addPose(stand(f, 8), {shL: 30, shR: 30, elL: 80, elR: 80})} look={[-0.8, 0]} expression="cold" />
            <Person id="neighbourMan" x={1230} y={846} dir={-1} scale={1.32} f={f} seed={9} pose={addPose(stand(f, 9), {shL: 30, shR: 30, elL: 80, elR: 80})} look={[-0.8, 0]} expression="cold" />
          </g>
        )}
        {shut >= 0 && <rect x={-300} y={-300} width={2520} height={1500} fill="#1A1A22" opacity={0.25 * prog(f, shut, shut + 40)} />}
      </>
    )}
  </StreetShot>
);

/** A man affirms his loyalty before an official (illustrative). */
const OathShot: React.FC<{f: number; d: number}> = ({f, d}) => (
  <RoomShot f={f} d={d} tone="plain" window="grey" windowX={1460} cam={[[0, 1.05, 960, 540], [d, 1.15, 960, 560]]}>
    {(f) => (
      <>
        <BoardTable x={820} y={790} w={360} cloth="#5A3A2A" h={80} />
        <g transform="translate(1000,760)"><rect x={-60} y={-24} width={120} height={36} fill="#EFE2C2" stroke={INK} strokeWidth={3} /></g>
        <Person id="examiner" x={1300} y={846} dir={-1} scale={1.3} f={f} seed={6} pose={seated(f, 6)} look={[-0.6, 0]} expression="cold" />
        <Person id="father" x={640} y={846} scale={1.35} f={f} seed={2} pose={addPose(standStiff(f, 2), {shR: 105 * prog(f, 20, 40), elR: 60 * prog(f, 20, 40)})} nearArmFront look={[0.6, -0.1]} expression="solemn" head={{hat: 'none'}} />
      </>
    )}
  </RoomShot>
);

export const S07: React.FC = () => (
  <Shots
    start={S}
    end={E}
    shots={[
      {at: S, el: (f, d) => <Frame><ChapterCard f={f} d={d} num={6} title="Who Had to Answer for It?" date="1606" /></Frame>, trans: 'cut'},
      {
        at: S + 3,
        el: (f, d) => (
          <PalaceShot f={f} d={d} time="grey" boats={false} cam={[[0, 1.25, 560, 520], [d, 1.3, 560, 540]]}>
            {(f) => (
              <g>
                {Array.from({length: 7}, (_, i) => {
                  const w = walker(f, i * 6, d + 40, 1.8, false, i * 0.2);
                  return <Person key={i} id={i % 2 ? 'member' : 'neighbourMan'} x={20 + i * 90 + 1.1 * w.d} y={880} scale={1.0} f={f} seed={i} pose={w.p} />;
                })}
              </g>
            )}
          </PalaceShot>
        ),
      },
      {at: T('On the twenty-seventh of January'), el: (f, d) => <Trial f={f} d={d} />},
      {at: T('The executions followed'), el: (f, d) => <OldPalaceYard f={f} d={d} card />, trans: 'dip'},
      {at: T('Fawkes died on the second day'), el: (f, d) => <OldPalaceYard f={f} d={d} tag />},
      {
        at: T('Less than three months'),
        el: (f, d) => (
          <Frame bg="#3C2C22">
            <Cam f={f} keys={[[0, 1.0, 960, 540], [d, 1.15, 960, 520]]}>
              <Desk />
              <Journal x={960} y={500} s={0.8} note={1} />
            </Cam>
            <g>
              <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
                <g opacity={prog(f, 10, 24)} transform="translate(960,820)">
                  <rect x={-520} y={-56} width={1040} height={100} rx={10} fill="#F1E6CB" stroke={INK} strokeWidth={4} />
                  <text x={-480} y={10} fontFamily={FONT.sans} fontWeight={900} fontSize={32} fill={INK}>5 NOV 1605</text>
                  <path d={`M-260,0 H${-260 + 470 * prog(f, 20, 60)}`} stroke={C.darkRed} strokeWidth={8} strokeLinecap="round" />
                  <text x={480} y={10} textAnchor="end" fontFamily={FONT.sans} fontWeight={900} fontSize={32} fill={INK} opacity={prog(f, 56, 66)}>31 JAN 1606</text>
                </g>
              </svg>
            </g>
            <Vignette strength={0.5} />
          </Frame>
        ),
      },
      {at: T('appeared in the Commons Journal', 0, 'end') + 0.05, el: (f, d) => <Proclaimed f={f} d={d} />},
      {at: T('its consequences were only beginning', 0, 'end') + 0.05, el: (f, d) => <Commons f={f} d={d} write={-200} cam={[[0, 1.0, 960, 540], [d, 1.05, 960, 540]]} />},
      {
        at: T('James himself acknowledged'),
        el: (f, d) => (
          <Frame>
            <Cam f={f} keys={[[0, 1.3, 960, 460], [d, 1.4, 960, 440]]}>
              <LordsChamber f={f} />
              <Person id="james" x={960} y={590} scale={1.05} f={f} seed={1} pose={talkGesture(f, 1)} expression="neutral" />
            </Cam>
            <Vignette strength={0.4} />
          </Frame>
        ),
      },
      {
        at: T('Yet he supported an oath'),
        el: (f, d) => (
          <Frame bg="#3C2C22">
            <Cam f={f} keys={[[0, 1.0, 960, 520], [d, 1.1, 960, 500]]}>
              <Desk />
              <PrintedPage x={960} y={520} s={1.25} heading="THE OATH OF ALLEGIANCE" reveal={prog(f, 4, 80)} />
            </Cam>
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}><PlaceTag text="1606" sub="an oath for Catholics" t={prog(f, 10, 26)} /></svg>
            <Vignette strength={0.5} />
          </Frame>
        ),
      },
      {at: T('Think back to the letter'), el: (f, d) => <LetterDeskShot f={f} d={d} pan={[1.0, 560, 1.15, 560]} unfold={[10, 70]} hand />},
      {at: T('Monteagle had been faced with'), el: (f, d) => (
        <Frame>
          <Cam f={f} keys={[[0, 1.0, 960, 520], [d, 1.06, 960, 520]]}>
            <LordsChamber f={f} />
            {Array.from({length: 8}, (_, i) => <Person key={i} id={i % 2 ? 'lord' : 'member'} x={140 + i * 230} y={800} scale={0.95} f={f + i * 7} seed={i} pose={seated(f, i)} />)}
          </Cam>
          <Vignette strength={0.4} />
        </Frame>
      )},
      {
        at: T('He had taken it to the authorities'),
        el: (f, d) => (
          <RoomShot f={f} d={d} tone="dark" window="night" windowX={1500} candles={[[820, 730], [1140, 730]]}>
            {(f) => {
              const handed = f > 40;
              return (
                <>
                  <BoardTable x={700} y={790} w={520} cloth="#3F5E45" h={80} />
                  <Person id="monteagle" x={640} y={846} scale={1.35} f={f} seed={3} pose={passPose(f, 12, 38, true)} holdR={!handed ? <HeldLetter s={1.1} /> : undefined} look={[0.6, 0]} expression="determined" />
                  <Person id="cecil" x={1340} y={846} dir={-1} scale={1.35} f={f} seed={6} pose={handed ? addPose(standStiff(f, 6), {shR: 66, elR: 70, headTilt: 12}) : passPose(f, 18, 40, false)} holdR={handed ? <HeldLetter s={1.1} /> : undefined} look={[-0.6, 0]} />
                </>
              );
            }}
          </RoomShot>
        ),
      },
      {
        at: T('If you were looking for'),
        el: (f, d) => (
          <Frame bg="#3C2C22">
            <Cam f={f} keys={[[0, 1.0, 960, 520], [d, 1.08, 960, 520]]}>
              <Desk />
              <PrintedPage x={760} y={520} s={1.2} rot={-3} />
              <Portrait x={1360} y={460} id="monteagle" f={f} s={1.0} t={prog(f, 30, 50)} label="LORD MONTEAGLE" sub="a Catholic who warned" />
            </Cam>
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}><PlaceTag text="THE OFFICIAL ACCOUNT" sub="of the king’s deliverance" t={prog(f, 8, 24)} /></svg>
            <Vignette strength={0.5} />
          </Frame>
        ),
      },
      {at: T('For his fellow Catholics'), el: (f, d) => <Proclaimed f={f} d={d} eye={6} />},
      {
        at: T('protection against suspicion', 0, 'end') + 0.05,
        el: (f, d) => (
          <StreetShot f={f} d={d} time="dusk" lit={0.6} pan={0.05} cam={[[0, 1.1, 900, 560], [d, 1.15, 900, 560]]}>
            {(f) => (
              <>
                <Person id="mother" x={420} y={846} scale={1.35} f={f} seed={4} pose={stand(f, 4)} look={[0.8, 0]} expression="sad" />
                <Person id="child" x={560} y={856} scale={1.15} f={f} seed={6} pose={stand(f, 6)} look={[0.8, 0]} expression="worried" />
              </>
            )}
          </StreetShot>
        ),
      },
      {at: T('A handful of men had chosen'), el: (f, d) => <OathShot f={f} d={d} />},
      {at: T('The arrests ended the'), el: (f, d) => <PalaceShot f={f} d={d} time="dusk" lit={0.5} cam={[[0, 1.0, 960, 520], [d, 1.08, 960, 520]]} />},
      {at: T('set in motion outside it', 0, 'end') + 0.05, el: (f, d) => <StreetShot f={f} d={d} time="dusk" lit={0.9} pan={0.03} />},
    ]}
  />
);

export {GroupTag, Particles, Bench, kf, clamp};
