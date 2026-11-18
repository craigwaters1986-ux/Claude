// s08 · How a date became a tradition (10:05-12:00). Effigies are generic straw figures with no faces.
import React from 'react';
import {Shots, Frame, Cam, sf} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {T, sectionWindow} from '../timeline';
import {ChapterCard, EndCardScene} from '../kit/Cards';
import {StreetShot, LetterDeskShot, Portrait, walker, bellSwing, stand, standStiff, addPose, prog, clamp, kf, talkGesture, seated} from './sets';
import {Church, Nave, Bonfire, Firework, Sky, Timbered, Cobbles, Roofline, PlaceTag, INK} from '../kit/Places';
import {PrintedPage, Desk, Letter} from '../kit/Paper';
import {ArchiveDesk} from './S04';
import {Particles, Vignette} from '../components/Effects';
import {cheer} from '../characters/poses';
import {C, FONT} from '../styles/theme';

const [S, E] = sectionWindow('s08');

const BellClose: React.FC<{f: number; d: number; era?: number}> = ({f, d, era = 1606}) => (
  <Frame>
    <Cam f={f} keys={[[0, 2.4, 1280, 400], [d, 2.3, 1280, 410]]}>
      <Sky time={era === 1606 ? 'day' : 'dusk'} id={'bell' + era} />
      <Church x={900} base={720} bell={bellSwing(f, 2, 20, 200)} fill={era === 1606 ? '#B3A791' : '#A89C88'} />
    </Cam>
    <PlaceTag text={String(era)} t={prog(f, 6, 20)} />
  </Frame>
);

const Congregation: React.FC<{f: number; d: number; page?: boolean; cam?: [number, number, number, number][]}> = ({f, d, page, cam}) => (
  <Frame>
    <Cam f={f} keys={cam ?? [[0, 1.0, 960, 540], [d, 1.08, 1200, 520]]}>
      <Nave f={f} />
      <Person id="preacher" x={1360} y={420} scale={0.95} f={f} seed={4} pose={page ? addPose(standStiff(f, 4), {shR: 70, elR: 70, shL: 60, elL: 70, headTilt: 10}) : talkGesture(f, 4)} look={[0, 0.4]} expression="solemn" holdR={page ? <rect x={-10} y={-50} width={60} height={70} fill="#F3E9D0" stroke={INK} strokeWidth={3} /> : undefined} />
      {Array.from({length: 3}, (_, r) => (
        <g key={r}>
          <rect x={-100} y={760 + r * 110} width={2120} height={30} fill="#6B4A30" stroke={INK} strokeWidth={4} />
          {Array.from({length: 7}, (_, i) => <Person key={i} id={['neighbour', 'neighbourMan', 'mother', 'father', 'neighbour', 'member', 'neighbourMan'][(i + r) % 7]} x={120 + i * 270 + r * 40} y={800 + r * 110} scale={0.95 + r * 0.12} f={f + i * 9} seed={i + r * 7} pose={stand(f, i + r)} fromBehind />)}
        </g>
      ))}
    </Cam>
    <Vignette strength={0.4} />
  </Frame>
);

/** Bonfire night in the parish street; `era` changes the houses, `crowd` adds people, `effigy` the straw figure. */
const BonfireNight: React.FC<{f: number; d: number; era?: 1606 | 1680 | 1830; crowd?: number; effigy?: number; fireworks?: number; tag?: {text: string; sub?: string}; bell?: number; children?: boolean; size?: number; cam?: [number, number, number, number][]}> = ({
  f, d, era = 1606, crowd = 8, effigy = 0, fireworks = -1, tag, bell = -1, children, size = 1, cam,
}) => (
  <StreetShot f={f} d={d} time="night" era={era} lit={1} pan={0.03} bell={bell >= 0 ? bellSwing(f, bell, 15, 120) : 0} tag={tag} cam={cam}>
    {(f) => (
      <>
        {fireworks >= 0 && [0, 1, 2, 3].map((i) => <Firework key={i} x={300 + i * 450} y={180 + (i % 2) * 90} f={f} at={fireworks + i * 17} every={70 + i * 9} color={['#F2C14E', '#E8664A', '#9FD3E0', '#F4EBD6'][i]} />)}
        <Bonfire x={960} y={860} f={f} size={size} effigy={effigy} />
        {Array.from({length: crowd}, (_, i) => {
          const half = Math.ceil(crowd / 2);
          const x = i < half ? 760 - i * 125 : 1160 + (i - half) * 125;
          const kid = children && i % 2 === 0;
          const id = kid ? (i % 4 ? 'boy1800' : 'girl1800') : era === 1830 ? (i % 3 ? 'neighbourMan' : 'neighbour') : ['neighbourMan', 'neighbour', 'father', 'mother'][i % 4];
          return <Person key={i} id={id} x={x} y={880 + (i % 3) * 12} scale={kid ? 1.1 : 1.15} f={f + i * 5} seed={i} pose={i % 5 === 0 ? cheer(f, i) : stand(f, i)} fromBehind={i % 2 === 1} look={[x < 960 ? 0.6 : -0.6, -0.2]} dir={x < 960 ? 1 : -1} expression="happy" />;
        })}
      </>
    )}
  </StreetShot>
);

/** Earlier effigies: generic straw figures, one with a tall mitre-like hat, one horned (no faces, no symbols). */
const Effigies: React.FC<{f: number; d: number}> = ({f, d}) => (
  <Frame bg="#141018">
    <Cam f={f} keys={[[0, 1.0, 960, 540], [d, 1.06, 960, 520]]}>
      <Sky time="night" id="eff" f={f} />
      <Roofline base={760} color="#1E2232" seed={21} />
      <rect x={-300} y={760} width={2520} height={400} fill="#2A2630" />
      {[640, 1280].map((x, i) => (
        <g key={x} transform={`translate(${x},860)`}>
          <circle cy={-260} r={300} fill="#FFB060" opacity={0.14 + 0.03 * Math.sin(f / 4 + i)} />
          <line x1={0} y1={0} x2={0} y2={-470} stroke="#5A4630" strokeWidth={14} />
          <path d="M-80,-360 H80" stroke="#B89A5A" strokeWidth={24} strokeLinecap="round" />
          <path d="M-46,-380 L-56,-210 H56 L46,-380Z" fill="#C9A869" stroke={INK} strokeWidth={6} />
          <circle cy={-430} r={48} fill="#D8BE80" stroke={INK} strokeWidth={6} />
          {i === 0 ? <path d="M-36,-470 L0,-560 L36,-470Z" fill="#E8E0CC" stroke={INK} strokeWidth={5} /> : <path d="M-34,-462 Q-60,-520 -40,-540 Q-36,-500 -16,-474 M34,-462 Q60,-520 40,-540 Q36,-500 16,-474" fill="#7E2620" stroke={INK} strokeWidth={5} />}
        </g>
      ))}
    </Cam>
    <PlaceTag text="REIGN OF CHARLES I" sub="figures of the Pope or the devil" t={prog(f, 8, 24)} />
    <Vignette strength={0.5} />
  </Frame>
);

/** 19th-century children with a guy in a cart, collecting coins and firewood. */
const GuyCart: React.FC<{f: number; d: number; portraits?: number}> = ({f, d, portraits = 0}) => (
  <StreetShot f={f} d={d} time="dusk" era={1830} lit={0.7} pan={0.25} tag={{text: 'THE 1800s', sub: 'collecting for the bonfire'}}>
    {(f) => {
      const w = walker(f, 0, d + 40, 1.7, true);
      const x0 = 300 + 1.15 * w.d;
      return (
        <>
          <g transform={`translate(${x0 + 230},846)`}>
            <rect x={-90} y={-70} width={180} height={60} fill="#7A5A3A" stroke={INK} strokeWidth={5} />
            {[-55, 55].map((cx) => <circle key={cx} cx={cx} cy={-10} r={30} fill="#5A4630" stroke={INK} strokeWidth={5} transform={`rotate(${w.d * 2} ${cx} -10)`} />)}
            <circle cx={0} cy={-150} r={36} fill="#D8BE80" stroke={INK} strokeWidth={5} />
            <path d="M-40,-120 L-50,-70 H50 L40,-120Z" fill="#C9A869" stroke={INK} strokeWidth={5} />
            <path d="M-46,-180 H46 L30,-206 H-30Z" fill="#3A2E26" stroke={INK} strokeWidth={4} />
          </g>
          <Person id="boy1800" x={x0 + 70} y={856} scale={1.2} f={f} seed={1} pose={addPose(w.p, {shR: 60, elR: 30})} expression="happy" talking />
          <Person id="girl1800" x={x0 - 80} y={856} scale={1.2} f={f} seed={2} pose={addPose(w.p, {shR: 70, elR: 70})} expression="happy" holdR={<circle r={12} fill={C.gold} stroke={INK} strokeWidth={3} />} talking />
          <Person id="boy1800b" x={x0 - 220} y={856} scale={1.15} f={f} seed={3} pose={addPose(w.p, {shL: 50, shR: 50, elL: 60, elR: 60})} expression="happy" holdR={<g><line x1={-40} y1={-10} x2={40} y2={10} stroke="#5A4630" strokeWidth={12} strokeLinecap="round" /><line x1={-40} y1={6} x2={40} y2={-6} stroke="#6B4A30" strokeWidth={12} strokeLinecap="round" /></g>} />
          {portraits > 0 && (
            <g opacity={portraits}>
              <Portrait x={1380} y={380} id="catesby" f={f} s={0.65} t={1} label="ROBERT CATESBY" grey={0.8} />
              <Portrait x={1680} y={380} id="ewens" f={f} s={0.65} t={1} label="RALPH EWENS" grey={0.8} />
            </g>
          )}
        </>
      );
    }}
  </StreetShot>
);

export const S08: React.FC = () => (
  <Shots
    start={S}
    end={E}
    shots={[
      {at: S, el: (f, d) => <Frame><ChapterCard f={f} d={d} num={7} title="How a Date Became a Tradition" date="1606 onwards" /></Frame>, trans: 'cut'},
      {at: S + 3, el: (f, d) => <BellClose f={f} d={d} />},
      {
        at: T('In January 1606,'),
        el: (f, d) => (
          <Frame bg="#3C2C22">
            <Cam f={f} keys={[[0, 1.0, 960, 520], [d, 1.12, 960, 500]]}>
              <Desk />
              <PrintedPage x={960} y={520} s={1.25} heading="5 NOVEMBER: THANKSGIVING" reveal={prog(f, 6, 120)} />
            </Cam>
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}><PlaceTag text="ACT OF PARLIAMENT" sub="January 1606: an annual thanksgiving" t={prog(f, 10, 26)} /></svg>
            <Vignette strength={0.5} />
          </Frame>
        ),
      },
      {at: T('Each year,'), el: (f, d) => <Congregation f={f} d={d} page />},
      {
        at: T('Before the anniversary'),
        el: (f, d) => (
          <Frame bg="#3C2C22">
            <Desk />
            <g transform={`translate(960,500) rotate(-2) scale(${1 + 0.05 * prog(f, 0, d)})`}>
              <rect x={-300} y={-300} width={600} height={600} rx={10} fill="#F3E9D0" stroke={INK} strokeWidth={6} />
              <rect x={-300} y={-300} width={600} height={120} rx={10} fill={C.darkRed} stroke={INK} strokeWidth={6} />
              <text y={-218} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={56} fill="#F4EBD6">NOVEMBER</text>
              <text y={70} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={260} fill={INK}>5</text>
              <text y={200} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={36} fill="#5A4A36">on the church calendar</text>
            </g>
            <Vignette strength={0.5} />
          </Frame>
        ),
      },
      {at: T('with a lesson that preachers'), el: (f, d) => <Congregation f={f} d={d} cam={[[0, 1.6, 1360, 420], [d, 1.7, 1360, 420]]} />},
      {at: T('with a lesson that preachers', 0, 'end') + 0.05, el: (f, d) => <Congregation f={f} d={d} page cam={[[0, 1.9, 1360, 400], [d, 2.0, 1360, 400]]} />},
      {at: T('Beyond the church doors'), el: (f, d) => <BonfireNight f={f} d={d} bell={4} fireworks={sf(T('Some of the earliest') - T('Beyond the church doors'))} tag={{text: 'BONFIRE NIGHT', sub: 'bells, bonfires, fireworks'}} />},
      {at: T('What went into the fire'), el: (f, d) => <BonfireNight f={f} d={d} effigy={prog(f, 10, 30)} cam={[[0, 1.4, 960, 600], [d, 1.5, 960, 580]]} />},
      {at: T('In the reign of Charles the First'), el: (f, d) => <Effigies f={f} d={d} />},
      {at: T('At moments of particular anxiety'), el: (f, d) => <BonfireNight f={f} d={d} era={1680} crowd={14} size={1.25} tag={{text: 'LATER 1600s', sub: 'bigger crowds, bigger fires'}} />},
      {at: T('such displays became more popular', 0, 'end') + 0.05, el: (f, d) => <BonfireNight f={f} d={d} era={1830} crowd={12} fireworks={0} tag={{text: 'GENERATION AFTER GENERATION'}} />},
      {at: T('The figure on the bonfire'), el: (f, d) => <BonfireNight f={f} d={d} era={1830} effigy={1} crowd={6} cam={[[0, 1.5, 960, 560], [d, 1.6, 960, 540]]} tag={{text: 'THE GUY'}} />},
      {at: T('By the nineteenth century'), el: (f, d) => <GuyCart f={f} d={d} />},
      {at: T('Children could take part'), el: (f, d) => <GuyCart f={f} d={d} portraits={prog(f, sf(T('heard the names of Robert') - T('Children could take part')), sf(T('heard the names of Robert') - T('Children could take part')) + 16)} />},
      {at: T('Catesby or Ralph Ewens', 0, 'end') + 0.05, el: (f, d) => <GuyCart f={f} d={d} />},
      {at: T('Across generations,'), el: (f, d) => <BonfireNight f={f} d={d} era={1830} crowd={12} children fireworks={0} />},
      {at: T('Guy Fawkes, the fifth of'), el: (f, d) => <BonfireNight f={f} d={d} era={1830} crowd={10} size={1.4} fireworks={10} cam={[[0, 1.0, 960, 540], [d, 1.25, 960, 640]]} />},
      {at: T('Back in the archive'), el: (f, d) => <ArchiveDesk f={f} d={d} cam={[[0, 1.0, 960, 520], [d, 1.15, 960, 560]]} />, trans: 'dip'},
      {at: T('Its writer left no signature'), el: (f, d) => <LetterDeskShot f={f} d={d} pan={[1.15, 560, 1.4, 820]} hand={false} />},
      {
        at: T('Monteagle kept it'),
        el: (f, d) => (
          <Frame bg="#2E2622">
            <rect width={1920} height={1080} fill="#2E2622" />
            <Letter x={1180} y={540} s={0.9} rot={4} />
            <Portrait x={600} y={440} id="monteagle" f={f} s={1.1} t={prog(f, 0, 14)} label="LORD MONTEAGLE" />
          </Frame>
        ),
      },
      {at: T('Of all the objects that might'), el: (f, d) => <LetterDeskShot f={f} d={d} pan={[0.85, 560, 1.15, 560]} hand={false} />},
      // quiet page turn back to the letter, then the end card
      {at: T('chose to pass it on', 0, 'end') + 0.05, el: (f, d) => <LetterDeskShot f={f} d={d} pan={[1.15, 560, 1.2, 560]} unfold={[0, 0]} hand={false} />, trans: 'wipe'},
      {at: 717.05, el: (f) => <Frame><EndCardScene f={f} /></Frame>, trans: 'dip'},
    ]}
  />
);

export {seated, clamp, kf, Timbered, Cobbles, Particles};
