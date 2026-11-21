// s04 · Ten days before Parliament (3:40-5:15)
import React from 'react';
import {Shots, Frame, Cam, sf} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {T, sectionWindow} from '../timeline';
import {ChapterCard} from '../kit/Cards';
import {RoomShot, StreetShot, LetterDeskShot, LondonPlan, Portrait, walker, HeldLetter, passPose, stand, standStiff, addPose, prog, clamp, kf, seated} from './sets';
import {Timbered, Sky, Cobbles, Archive, BoardTable, PlaceTag, Roofline, INK} from '../kit/Places';
import {Letter, QuoteType, PaperHand, Sheet, Hand} from '../kit/Paper';
import {Particles, Vignette, Candle} from '../components/Effects';
import {C, FONT} from '../styles/theme';

const [S, E] = sectionWindow('s04');

/** Hoxton at supper time: the footman at the door; a hand from outside the frame passes the folded sheet. */
const HoxtonDoor: React.FC<{f: number; d: number; give: number; tag?: boolean}> = ({f, d, give, tag}) => {
  const reach = prog(f, give, give + 20) * (1 - prog(f, give + 40, give + 60));
  const taken = f > give + 30;
  const handX = kf(f, [[give - 1, 520], [give + 20, 760], [give + 40, 760], [give + 60, 470]]);
  return (
    <Frame>
      <Cam f={f} keys={[[0, 1.25, 960, 560], [d, 1.35, 940, 580]]}>
        <Sky time="dusk" id="hox" />
        <Roofline base={640} color="#5E6680" seed={8} />
        <Timbered x={680} base={760} w={560} h={520} fill="#D2BC98" lit={0.9} doorOpen={1} seed={3} />
        <Cobbles y={755} />
        <Person id="footman" x={960} y={846} scale={1.35} f={f} seed={4} pose={addPose(standStiff(f, 4), {shR: 60 * reach + (taken ? 40 : 0), elR: 20 * reach + (taken ? 60 : 0)})} holdR={taken ? <HeldLetter s={1.1} /> : undefined} look={[-0.7, 0]} expression="curious" dir={-1} />
        {/* the sender stays out of view: only a gloved hand and a dark sleeve enter from the left */}
        {f > give - 2 && f < give + 62 && (
          <g>
            <PaperHand x={handX} y={640} s={0.55} cuff="#2E2A30" />
            {!taken && <g transform={`translate(${handX + 40},630) rotate(-8)`}><rect x={-10} y={-26} width={44} height={30} rx={2} fill="#EFE2C2" stroke={INK} strokeWidth={3} /></g>}
          </g>
        )}
      </Cam>
      {tag && <PlaceTag text="HOXTON" sub="26 October 1605, supper time" t={prog(f, 10, 26) * (1 - prog(f, d - 24, d - 8))} />}
      <Vignette strength={0.5} />
    </Frame>
  );
};

/** Monteagle at supper receives the letter from his footman. */
const Supper: React.FC<{f: number; d: number; pass: number; read?: number; afraid?: number; thought?: number}> = ({f, d, pass, read = -1, afraid = -1, thought = -1}) => {
  const handed = f > pass + 26;
  const w = walker(f, 0, pass - 10, 2.6);
  return (
    <RoomShot f={f} d={d} tone="oak" fire fireX={1660} window="night" windowX={220} candles={[[880, 700], [1080, 700]]} cam={read >= 0 && f > read ? [[0, 1.35, 1140, 560], [d, 1.4, 1150, 560]] : [[0, 1.0, 960, 540], [d, 1.05, 960, 540]]}>
      {(f) => (
        <>
          <BoardTable x={760} y={760} w={420} cloth="#E8DFC8" h={90} />
          <Person id="footman" x={Math.min(1040, 380 + 1.3 * w.d)} y={846} scale={1.3} f={f} seed={4} pose={f < pass - 10 ? addPose(w.p, {shR: 50, elR: 40}) : passPose(f, pass - 6, pass + 20, true)} holdR={!handed ? <HeldLetter s={1.1} /> : undefined} look={[0.6, 0]} opacity={1 - prog(f, pass + 60, pass + 80)} />
          <Person id="monteagle" x={1260} y={846} dir={-1} scale={1.35} f={f} seed={3} pose={handed ? addPose(seated(f, 3), {shR: 70, elR: 70, headTilt: 14 - (afraid >= 0 && f > afraid ? 8 : 0)}) : addPose(seated(f, 3), {shR: 60 * prog(f, pass, pass + 20), elR: 20})} holdR={handed ? <HeldLetter s={1.2} /> : undefined} look={handed ? [-0.3, 0.6] : [-0.6, 0]} expression={afraid >= 0 && f > afraid ? 'scared' : handed ? 'worried' : 'neutral'} sweat={afraid >= 0 && f > afraid + 20} />
          {thought >= 0 && f > thought && (
            <g opacity={prog(f, thought, thought + 14)} transform="translate(1420,330)">
              <circle cx={-110} cy={120} r={12} fill="#FFF" stroke={INK} strokeWidth={4} />
              <circle cx={-80} cy={80} r={18} fill="#FFF" stroke={INK} strokeWidth={4} />
              <ellipse cx={60} cy={-10} rx={210} ry={130} fill="#FFF" stroke={INK} strokeWidth={5} />
              <path d="M-90,40 Q-20,-40 60,10 T210,0 V60 H-90Z" fill="#9DB07A" />
              <path d="M10,20 V-40 L50,-80 L90,-40 V20Z" fill="#D2BC98" stroke={INK} strokeWidth={4} />
              <text x={60} y={100} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={26} fill={INK}>stay in the country?</text>
            </g>
          )}
        </>
      )}
    </RoomShot>
  );
};

/** The surviving letter at The National Archives: lamp, folder, magnifier; `q` grows the question mark. */
export const ArchiveDesk: React.FC<{f: number; d: number; magnify?: number; q?: number; account?: number; cam?: [number, number, number, number][]}> = ({f, d, magnify = -1, q = 0, account = 0, cam}) => {
  const mx = kf(f, [[magnify, 760], [magnify + 90, 1100], [magnify + 180, 820]]);
  const my = kf(f, [[magnify, 360], [magnify + 90, 520], [magnify + 180, 680]]);
  return (
    <Frame>
      <Cam f={f} keys={cam ?? [[0, 1.0, 960, 520], [d, 1.12, 960, 560]]}>
        <Archive f={f} />
        <rect x={420} y={250} width={1080} height={760} rx={10} fill="#5E5A52" stroke={INK} strokeWidth={6} />
        <rect x={440} y={270} width={1040} height={720} rx={6} fill="#8A8476" />
        <Letter x={960} y={600} s={0.95} question={q} />
        {account > 0 && (
          <g opacity={account} transform={`translate(${1520 - 120 * account},620) rotate(5)`}>
            <Sheet x={0} y={0} w={320} h={430} folds="none" color="#F1E6CB"><Hand x={30} y={60} w={260} lines={10} gap={34} size={11} seed={77} /></Sheet>
          </g>
        )}
        {magnify >= 0 && f > magnify && (
          <g transform={`translate(${mx},${my})`} opacity={prog(f, magnify, magnify + 12)}>
            <circle r={110} fill="rgba(220,236,240,0.28)" stroke={INK} strokeWidth={10} />
            <line x1={78} y1={78} x2={190} y2={190} stroke="#5A4630" strokeWidth={26} strokeLinecap="round" />
          </g>
        )}
      </Cam>
      <PlaceTag text="THE NATIONAL ARCHIVES" sub="State Papers, SP 14/216" t={prog(f, 8, 24) * (1 - prog(f, d - 24, d - 8))} />
      <Vignette strength={0.4} />
    </Frame>
  );
};

export const S04: React.FC = () => (
  <Shots
    start={S}
    end={E}
    shots={[
      {at: S, el: (f, d) => <Frame><ChapterCard f={f} d={d} num={3} title="Ten Days Before Parliament" date="26 October 1605" /></Frame>, trans: 'cut'},
      {at: S + 3, el: (f, d) => <HoxtonDoor f={f} d={d} give={sf(9)} tag />},
      {at: T('north of the City of London'), el: (f, d) => <LondonPlan f={f} d={d} show={['hoxton', 'city']} />},
      {at: T('A contemporary account says'), el: (f, d) => <HoxtonDoor f={f} d={d} give={20} />},
      {at: T('Here was a message important'), el: (f, d) => <Supper f={f} d={d} pass={sf(2.2)} />},
      {at: T('The writer appeals to'), el: (f, d) => <LetterDeskShot f={f} d={d} pan={[1.25, 420, 1.3, 600]} hand={false} />},
      {at: T('He’s urged to find an excuse'), el: (f, d) => <Supper f={f} d={d} pass={-80} read={0} thought={20} />},
      {at: T('Then comes the phrase'), el: (f, d) => <LetterDeskShot f={f} d={d} pan={[1.6, 560, 2.0, 560]} hand={false} quote={{text: '“a terrible blow”', at: sf(T('will receive “a terrible blow”') - T('Then comes the phrase') + 2.2)}} />},
      {at: T('It gives Monteagle enough'), el: (f, d) => <Supper f={f} d={d} pass={-80} read={0} afraid={10} />},
      {at: T('Today the sheet is held'), el: (f, d) => <ArchiveDesk f={f} d={d} cam={[[0, 0.95, 960, 520], [d, 1.25, 960, 520]]} />},
      {at: T('We can inspect the'), el: (f, d) => <ArchiveDesk f={f} d={d} magnify={6} account={prog(f, sf(1.8), sf(2.6))} cam={[[0, 1.2, 960, 560], [d, 1.0, 1000, 560]]} />},
      // suspicion fell on Tresham at the time; the evidence cannot settle it
      {
        at: T('Francis Tresham, a conspirator'),
        el: (f, d) => {
          const tFam = sf(T('A family connection') - T('Francis Tresham, a conspirator'));
          const tNo = sf(T('It cannot establish') - T('Francis Tresham, a conspirator'));
          return (
            <Frame bg="#3A2E28">
              <rect width={1920} height={1080} fill="#3A2E28" />
              <Particles f={f} kind="dust" n={30} seed={6} />
              <Cam f={f} keys={[[0, 1.0, 960, 480], [d, 1.12, 960, 470]]}>
              <Portrait x={620} y={430} id="tresham" f={f} s={1.1} t={prog(f, 0, 16) * (1 - 0.6 * prog(f, tNo, tNo + 20))} label="FRANCIS TRESHAM" sub="suspected at the time" expression="worried" />
              <Portrait x={1300} y={430} id="monteagle" f={f} s={1.1} t={prog(f, tFam - 10, tFam + 6) * (1 - 0.6 * prog(f, tNo, tNo + 20))} label="LORD MONTEAGLE" sub="his brother-in-law" />
              <path d={`M760,330 H${760 + 400 * prog(f, tFam, tFam + 20)}`} stroke="#E3C77A" strokeWidth={6} strokeDasharray="14 10" />
              <text x={960} y={310} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={28} fill="#F1E6CB" opacity={prog(f, tFam + 10, tFam + 24)}>family</text>
              <g opacity={prog(f, tNo, tNo + 16)}>
                <rect x={560} y={760} width={800} height={90} rx={10} fill="#F1E6CB" stroke={INK} strokeWidth={5} />
                <text x={960} y={818} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={36} fill={INK}>THE WRITER IS STILL UNKNOWN</text>
              </g>
              </Cam>
            </Frame>
          );
        },
      },
      {at: T('who sent the letter', 0, 'end') + 0.05, el: (f, d) => <ArchiveDesk f={f} d={d} q={prog(f, 10, 50)} cam={[[0, 1.3, 1100, 840], [d, 1.45, 1100, 860]]} />},
      // Monteagle takes the letter to Robert Cecil
      {
        at: T('Monteagle took it to Robert'),
        el: (f, d) => (
          <StreetShot f={f} d={d} time="night" lit={0.9} pan={0.45} tag={{text: 'TO WHITEHALL', sub: 'late October 1605'}}>
            {(f) => {
              const w = walker(f, 0, d + 30, 2.8);
              return <Person id="monteagleOut" x={260 + 1.42 * w.d} y={846} scale={1.42} f={f} seed={4} pose={addPose(w.p, {shR: 40, elR: 50})} holdR={<HeldLetter s={1.2} />} look={[0.5, 0]} expression="determined" shadow />;
            }}
          </StreetShot>
        ),
      },
      {
        at: T('the king’s chief minister'),
        el: (f, d) => (
          <RoomShot f={f} d={d} tone="dark" window="night" windowX={1500} candles={[[820, 730], [1140, 730]]} cam={[[0, 1.0, 960, 540], [d, 1.12, 1060, 540]]}>
            {(f) => {
              const handed = f > 46;
              return (
                <>
                  <BoardTable x={700} y={790} w={520} cloth="#3F5E45" h={80} />
                  <Person id="monteagle" x={640} y={846} scale={1.35} f={f} seed={3} pose={passPose(f, 18, 44, true)} holdR={!handed ? <HeldLetter s={1.1} /> : undefined} look={[0.6, 0]} expression="worried" />
                  <Person id="cecil" x={1340} y={846} dir={-1} scale={1.35} f={f} seed={6} pose={handed ? addPose(standStiff(f, 6), {shR: 66, elR: 70, headTilt: 12}) : passPose(f, 24, 46, false)} holdR={handed ? <HeldLetter s={1.1} /> : undefined} look={handed ? [-0.2, 0.6] : [-0.6, 0]} expression={handed ? 'determined' : 'neutral'} tag />
                </>
              );
            }}
          </RoomShot>
        ),
      },
    ]}
  />
);

export {clamp, Candle, C, standStiff, stand};
