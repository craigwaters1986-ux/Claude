// s05 · Two names in the record (5:15-6:55)
import React from 'react';
import {Shots, Frame, Cam, sf} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {T, sectionWindow} from '../timeline';
import {ChapterCard} from '../kit/Cards';
import {RoomShot, PalaceShot, CandleCircleShot, walker, HeldLetter, Lantern, passPose, stand, standStiff, addPose, prog, clamp, kf, seated, talkGesture} from './sets';
import {BoardTable, Bench, PlaceTag, INK} from '../kit/Places';
import {Journal, SheetStack, Desk} from '../kit/Paper';
import {NameTag} from '../characters/StickFigure';
import {Pen} from '../characters/props';
import {signDocument, handsUp, point, shrug} from '../characters/poses';
import {Particles, Vignette} from '../components/Effects';
import {C, FONT} from '../styles/theme';

const [S, E] = sectionWindow('s05');

/** Gunpowder barrels under firewood in a vault, lit by a lantern (non-graphic). */
const Vault: React.FC<{f: number; d: number; arrest: number; tag: number}> = ({f, d, arrest, tag}) => {
  const w = walker(f, 0, 70, 2.2);
  const held = f > arrest;
  return (
    <Frame bg="#141214">
      <Cam f={f} keys={[[0, 1.0, 960, 540], [d, 1.1, 1000, 560]]}>
        <rect x={-300} y={-300} width={2520} height={1500} fill="#2A2526" />
        {[0, 1, 2].map((i) => <path key={i} d={`M${-200 + i * 760},820 V300 Q${180 + i * 760},60 ${560 + i * 760},300 V820`} fill="none" stroke="#4A4244" strokeWidth={40} />)}
        <rect x={-300} y={820} width={2520} height={400} fill="#3A3434" />
        <circle cx={760 + 1.3 * w.d} cy={560} r={520} fill="#FFC870" opacity={0.13 + 0.02 * Math.sin(f / 3)} />
        {/* barrels and the firewood laid over them */}
        {Array.from({length: 7}, (_, i) => {
          const x = 1260 + (i % 4) * 120 + (i > 3 ? 60 : 0), y = i > 3 ? 690 : 820;
          return (
            <g key={i}>
              <path d={`M${x - 48},${y} Q${x - 58},${y - 70} ${x - 48},${y - 140} H${x + 48} Q${x + 58},${y - 70} ${x + 48},${y}Z`} fill="#6B4A30" stroke={INK} strokeWidth={5} />
              <path d={`M${x - 54},${y - 40} H${x + 54} M${x - 54},${y - 100} H${x + 54}`} stroke="#3A2A1E" strokeWidth={6} />
            </g>
          );
        })}
        {Array.from({length: 9}, (_, i) => <line key={i} x1={1180 + i * 60} y1={560 + (i % 3) * 8} x2={1300 + i * 60} y2={600 - (i % 2) * 14} stroke="#5A4630" strokeWidth={16} strokeLinecap="round" />)}
        <Person id="knyvett" x={460 + 1.3 * w.d} y={846} scale={1.35} f={f} seed={2} pose={f < 70 ? addPose(w.p, {shR: 75, elR: 40}) : addPose(standStiff(f, 2), {shR: 80, elR: 30})} holdR={<Lantern f={f} />} expression="determined" tag={f > tag} />
        <Person id="officer" x={260 + 1.3 * w.d} y={846} scale={1.3} f={f} seed={3} pose={f < 70 ? w.p : stand(f, 3)} expression="determined" />
        <Person id="fawkes" x={1100} y={846} dir={-1} scale={1.35} f={f} seed={4} pose={held ? addPose(standStiff(f, 4), {shL: 20, shR: 20, elL: 70, elR: 70, headTilt: 10}) : stand(f, 4)} look={[-0.7, 0]} expression={held ? 'solemn' : 'scared'} />
      </Cam>
      <PlaceTag text="UNDER THE HOUSE OF LORDS" sub="night of 4–5 November 1605" t={prog(f, 8, 24) * (1 - prog(f, d - 24, d - 8))} />
      <Vignette strength={0.7} />
    </Frame>
  );
};

/** The House of Commons sitting in St Stephen's Chapel; the clerk writes at the table. */
export const Commons: React.FC<{f: number; d: number; write?: number; tag?: number; cam?: [number, number, number, number][]}> = ({f, d, write = 0, tag = -1, cam}) => {
  const sign = signDocument(f, {seated: true, start: write, lookUps: [[90, 130]], seed: 2});
  return (
    <RoomShot f={f} d={d} tone="oak" window="day" windowX={810} cam={cam ?? [[0, 1.0, 960, 540], [d, 1.08, 960, 560]]}>
      {(f) => (
        <>
          {[0, 1, 2].map((r) => <Bench key={'bl' + r} x={-80} y={700 + r * 70} w={560} color="#4E6A4A" />)}
          {[0, 1, 2].map((r) => <Bench key={'br' + r} x={1440} y={700 + r * 70} w={560} color="#4E6A4A" />)}
          {Array.from({length: 6}, (_, i) => <Person key={'ml' + i} id="member" x={20 + (i % 3) * 160} y={700 + Math.floor(i / 3) * 70} scale={0.75} f={f + i * 11} seed={i} pose={seated(f, i)} look={[0.8, 0]} />)}
          {Array.from({length: 6}, (_, i) => <Person key={'mr' + i} id="member" dir={-1} x={1900 - (i % 3) * 160} y={700 + Math.floor(i / 3) * 70} scale={0.75} f={f + i * 7} seed={i + 9} pose={seated(f, i + 9)} look={[0.8, 0]} />)}
          <BoardTable x={820} y={790} w={300} cloth="#2E4A34" h={70} />
          <Person id="ewens" x={900} y={846} scale={1.25} f={f} seed={5} pose={sign.pose} look={sign.lookingUp ? [0.2, -0.4] : [0.4, 0.8]} tag={tag >= 0 && f > tag} overlayFront={(sk) => <Pen x={sk.armR.hx} y={sk.armR.hy} />} />
        </>
      )}
    </RoomShot>
  );
};

/** Close-up of the open Journal; `note` writes the margin; `card` shows the plain-English reading of the note. */
export const JournalShot: React.FC<{f: number; d: number; note: [number, number]; card?: number; cam?: [number, number, number, number][]; johnson?: number; missing?: number}> = ({f, d, note, card = 0, cam, johnson = 0, missing = 0}) => (
  <Frame bg="#3C2C22">
    <Cam f={f} keys={cam ?? [[0, 1.6, 980, 400], [d, 1.6, 980, 420]]}>
      <Desk />
      <Journal x={960} y={540} s={0.95} note={prog(f, note[0], note[1])} />
      {f > note[0] && f < note[1] + 6 && (
        <g transform={`translate(${kf(f, [[note[0], 1000], [note[1], 1080]])},${kf(f, [[note[0], 345], [note[1], 545]], (t) => t)})`}>
          <path d="M0,0 L120,-200" stroke="#E8E0CC" strokeWidth={7} />
          <path d="M60,-100 Q140,-210 170,-260 Q100,-200 60,-100Z" fill="#F4EFE2" stroke={INK} strokeWidth={3} />
        </g>
      )}
    </Cam>
    {card > 0 && (
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <g opacity={card} transform={`translate(960,${700 + (1 - card) * 20})`}>
          <rect x={-560} y={-90} width={1120} height={176} rx={12} fill="#F1E6CB" stroke={INK} strokeWidth={5} />
          <text y={-44} textAnchor="middle" fontFamily={FONT.sans} fontWeight={700} fontSize={24} fill="#5A4A36">Margin of the Commons Journal, 5 November 1605 (summarised)</text>
          <text y={14} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={50} fill={INK}>
            the prisoner: <tspan fill={johnson > 0 ? C.darkRed : INK}>Johnson</tspan>, servant to Thomas Percy
          </text>
          <text y={64} textAnchor="middle" fontFamily={FONT.sans} fontWeight={700} fontSize={24} fill="#5A4A36" opacity={missing}>no mention of Guy Fawkes</text>
        </g>
      </svg>
    )}
    <Vignette strength={0.5} />
  </Frame>
);

export const S05: React.FC = () => {
  const t0 = T('Meanwhile, news of the warning');
  return (
    <Shots
      start={S}
      end={E}
      shots={[
        {at: S, el: (f, d) => <Frame><ChapterCard f={f} d={d} num={4} title="Two Names in the Record" date="November 1605" /></Frame>, trans: 'cut'},
        {at: S + 3, el: (f, d) => <PalaceShot f={f} d={d} time="night" lit={0.6} tag={{text: 'WESTMINSTER', sub: 'early November 1605'}} />},
        // the king returns and is shown the letter
        {
          at: T('The king was away when'),
          el: (f, d) => (
            <RoomShot f={f} d={d} tone="dark" window="day" windowX={1460} candles={[[960, 730]]}>
              {(f) => {
                const back = sf(T('When he returned to London') - T('The king was away when'));
                const w = walker(f, back, back + 60, 2.6);
                const handed = f > back + 80;
                return (
                  <>
                    <BoardTable x={760} y={790} w={420} cloth="#3F5E45" h={80} />
                    <Person id="cecil" x={1340} y={846} dir={-1} scale={1.3} f={f} seed={6} pose={passPose(f, back + 56, back + 80, true)} holdR={!handed ? <HeldLetter s={1.1} /> : undefined} look={[-0.6, 0]} expression="determined" />
                    {f > back - 4 && <Person id="james" x={Math.min(800, 200 + 1.35 * w.d)} y={846} scale={1.35} f={f} seed={1} pose={handed ? addPose(standStiff(f, 1), {shR: 66, elR: 70, headTilt: 12}) : f < back + 60 ? w.p : passPose(f, back + 60, back + 82, false)} holdR={handed ? <HeldLetter s={1.1} /> : undefined} look={handed ? [0.2, 0.6] : [0.6, 0]} expression={handed ? 'worried' : 'neutral'} opacity={prog(f, back - 4, back + 6)} />}
                  </>
                );
              }}
            </RoomShot>
          ),
        },
        // the conspirators hear of it; Catesby and Winter challenge Tresham
        {
          at: t0,
          el: (f, d) => {
            const ch = sf(T('Catesby and Winter challenged') - t0), per = sf(T('He persuaded them') - t0);
            return (
              <RoomShot f={f} d={d} tone="dark" fire fireX={1700} window="night" windowX={200} cam={[[0, 1.0, 960, 540], [d, 1.12, 980, 560]]}>
                {(f) => (
                  <>
                    <Person id="catesby" x={620} y={846} scale={1.35} f={f} seed={2} pose={f > ch ? point(f, 92, 2) : stand(f, 2)} look={[0.6, 0]} expression={f > ch ? 'angry' : 'worried'} />
                    <Person id="winter" x={840} y={846} scale={1.3} f={f} seed={3} pose={f > ch ? addPose(stand(f, 3), {shR: 40, elR: 60}) : stand(f, 3)} look={[0.6, 0]} expression={f > ch ? 'angry' : 'worried'} />
                    <Person id="tresham" x={1260} y={846} dir={-1} scale={1.32} f={f} seed={4} pose={f > per ? addPose(talkGesture(f, 4), {shL: 40, elL: 50}) : f > ch ? handsUp(f, 4) : stand(f, 4)} look={[-0.6, 0]} expression={f > per ? 'worried' : f > ch ? 'scared' : 'neutral'} tag={f > ch} />
                  </>
                )}
              </RoomShot>
            );
          },
        },
        {at: T('and on the third of November'), el: (f, d) => (
          <>
            <CandleCircleShot f={f} d={d} who={['winter', 'catesby', 'percy']} />
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}><PlaceTag text="3 NOVEMBER 1605" sub="they decide to go on" t={prog(f, 4, 18)} /></svg>
          </>
        )},
        {
          at: T('By then,'),
          el: (f, d) => (
            <RoomShot f={f} d={d} tone="dark" window="night" windowX={1460} candles={[[960, 730]]} cam={[[0, 1.1, 960, 560], [d, 1.2, 960, 580]]}>
              {(f) => (
                <>
                  <BoardTable x={760} y={790} w={420} cloth="#3F5E45" h={80} />
                  <g transform="translate(900,760) rotate(-6)"><rect x={-40} y={-30} width={80} height={56} fill="#EFE2C2" stroke={INK} strokeWidth={3} /></g>
                  <Person id="james" x={640} y={846} scale={1.3} f={f} seed={1} pose={addPose(standStiff(f, 1), {headTilt: 10})} look={[0.5, 0.6]} expression="determined" />
                  <Person id="cecil" x={1300} y={846} dir={-1} scale={1.3} f={f} seed={6} pose={point(f, 40, 6)} look={[-0.4, 0.6]} expression="determined" />
                </>
              )}
            </RoomShot>
          ),
        },
        {at: T('could meet safely lay in other hands', 0, 'end') + 0.05, el: (f, d) => (
          <PalaceShot f={f} d={d} time="night" lit={0.3} boats={false} lantern={prog(f, 20, 40)} cam={[[0, 1.0, 960, 520], [d, 1.25, 1400, 640]]} />
        )},
        {at: T('On the night before the opening'), el: (f, d) => <Vault f={f} d={d} arrest={sf(T('Sir Thomas Knyvett') - T('On the night before the opening') + 2.4)} tag={sf(T('Sir Thomas Knyvett') - T('On the night before the opening'))} />},
        {at: T('The king, the Lords and'), el: (f, d) => <PalaceShot f={f} d={d} time="dawn" lit={0.2} tag={{text: '5 NOVEMBER 1605', sub: 'Parliament is safe'}} />},
        // put aside the familiar pictures: a bonfire guy fades out, the Journal fades in
        {
          at: T('For a moment, put aside the'),
          el: (f, d) => (
            <Frame bg="#141018">
              <rect width={1920} height={1080} fill="#1A1420" />
              <g opacity={1 - prog(f, 50, 90)} transform="translate(960,860)">
                <circle cy={-300} r={300} fill="#FFB060" opacity={0.18} />
                <line x1={0} y1={0} x2={0} y2={-480} stroke="#5A4630" strokeWidth={14} />
                <path d="M-90,-380 H90" stroke="#B89A5A" strokeWidth={26} strokeLinecap="round" />
                <path d="M-50,-400 L-60,-220 H60 L50,-400Z" fill="#C9A869" stroke={INK} strokeWidth={6} />
                <circle cy={-450} r={52} fill="#D8BE80" stroke={INK} strokeWidth={6} />
                <path d="M-80,-490 H80 L56,-520 H-56Z" fill="#3A2E26" stroke={INK} strokeWidth={5} />
              </g>
              <text x={960} y={200} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={40} fill="#F1E6CB" opacity={prog(f, 6, 20) * (1 - prog(f, 50, 80))}>the familiar picture…</text>
              <g opacity={prog(f, 70, 110)}>
                <text x={960} y={500} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={44} fill="#F1E6CB">…and what an official actually wrote</text>
              </g>
            </Frame>
          ),
        },
        {at: T('The House of Commons met briefly'), el: (f, d) => <Commons f={f} d={d} write={10} />},
        // silent beat: the clerk's marginal note is written, then the viewer reads it
        {at: T('The House of Commons met briefly', 0, 'end') + 0.05, el: (f, d) => <JournalShot f={f} d={d} note={[10, 130]} card={prog(f, 140, 160)} cam={[[0, 1.25, 960, 520], [130, 1.7, 820, 400], [d, 1.7, 820, 400]]} />},
        {at: T('Its clerk, Ralph Ewens'), el: (f, d) => <Commons f={f} d={d} write={0} tag={6} cam={[[0, 1.4, 960, 600], [d, 1.5, 960, 620]]} />},
        {at: T('The prisoner appears there as'), el: (f, d) => <JournalShot f={f} d={d} note={[-10, -5]} card={prog(f, 0, 14)} johnson={1} missing={prog(f, sf(T('If that single page') - T('The prisoner appears there as')), sf(T('If that single page') - T('The prisoner appears there as')) + 14)} cam={[[0, 1.7, 820, 400], [d, 1.8, 820, 380]]} />},
        {at: T('That detail tells us something'), el: (f, d) => <Commons f={f} d={d} write={0} cam={[[0, 1.25, 960, 600], [d, 1.0, 960, 540]]} />},
        {at: T('while the identity of the', 0, 'end') + 0.05, el: (f, d) => <JournalShot f={f} d={d} note={[-10, -5]} cam={[[0, 1.8, 820, 400], [d, 1.0, 960, 540]]} />},
        {
          at: T('We know who Johnson was'),
          el: (f, d) => (
            <Frame bg="#3C2C22">
              <Desk />
              <SheetStack x={760} y={560} n={kf(f, [[0, 0], [70, 6]])} s={1.2} />
              <g opacity={prog(f, 50, 66)}>
                <NameTag x={1340} y={520} text="JOHNSON" sub="as the Journal names him" />
                <text x={1340} y={600} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={60} fill="#F1E6CB">=</text>
                <NameTag x={1340} y={720} text="GUY FAWKES" sub="known from other records" />
              </g>
              <Vignette strength={0.5} />
            </Frame>
          ),
        },
        {at: T('because other records survive', 0, 'end') + 0.05, el: (f, d) => <PalaceShot f={f} d={d} time="dawn" lit={0} cam={[[0, 1.1, 1000, 540], [d, 1.0, 960, 520]]} />},
      ]}
    />
  );
};

export {clamp, Particles, shrug};
