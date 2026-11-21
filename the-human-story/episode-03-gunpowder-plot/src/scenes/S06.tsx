// s06 · After the arrest (6:55-8:25). No imagined dialogue; the questioning is never shown.
import React from 'react';
import {Shots, Frame, Cam, sf} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {T, sectionWindow} from '../timeline';
import {ChapterCard} from '../kit/Cards';
import {BaseMap, PlaceDot, RegionLabel, Route, useProjection, VIEW_ENGLAND, PLACES, FLIGHT} from '../kit/Maps';
import {RoomShot, Portrait, walker, stand, standStiff, addPose, prog, clamp, kf, seated} from './sets';
import {Sky, Tower, BrickManor, Timbered, Cobbles, Roofline, PlaceTag, INK} from '../kit/Places';
import {Proclamation, SheetStack, Desk, Sheet, Hand} from '../kit/Paper';
import {Particles, Vignette, SombreGrade, Candle} from '../components/Effects';
import {Hills} from '../components/Environment';
import {C, FONT} from '../styles/theme';

const [S, E] = sectionWindow('s06');

/** Two strands on one map: London (the investigation) and the flight into the Midlands. */
const StrandsMap: React.FC<{f: number; d: number; route: [number, number]; london?: number; papers?: number; end?: number}> = ({f, d, route, london = 0, papers = -1, end = -1}) => {
  const proj = useProjection(VIEW_ENGLAND, [140, 40, 1780, 900]);
  const rt = prog(f, route[0], route[1]);
  const [lx, ly] = proj(PLACES.London)!;
  const pts = FLIGHT.map((p) => proj(p)!);
  return (
    <Frame bg="#9DB7BD">
      <Cam f={f} keys={[[0, 1.0, 960, 470], [d, 1.05, 900, 460]]}>
        <BaseMap proj={proj} id="strands" border={0} />
        <circle cx={lx} cy={ly} r={70 + 10 * Math.sin(f / 8)} fill="none" stroke={C.navy} strokeWidth={6} opacity={london} strokeDasharray="12 8" />
        <text x={lx + 30} y={ly + 110} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={30} fill={C.navy} stroke="#F4EBD6" strokeWidth={6} paintOrder="stroke" opacity={london}>the investigation</text>
        <Route proj={proj} pts={FLIGHT} t={rt} />
        <text x={pts[1][0] - 30} y={pts[1][1] + 10} textAnchor="end" fontFamily={FONT.sans} fontWeight={800} fontSize={30} fill={C.darkRed} stroke="#F4EBD6" strokeWidth={6} paintOrder="stroke" opacity={prog(f, route[0] + 20, route[0] + 34)}>the flight</text>
        <PlaceDot proj={proj} at={PLACES.London} label="London" side="right" />
        <PlaceDot proj={proj} at={PLACES.Dunchurch} label="Dunchurch" side="right" t={prog(f, route[0] + 30, route[0] + 44)} size={28} />
        <PlaceDot proj={proj} at={PLACES.Holbeach} label="Holbeach House" side="left" t={end >= 0 ? prog(f, end, end + 14) : 0} />
        {papers >= 0 &&
          Array.from({length: 5}, (_, i) => {
            const t = clamp((f - papers - i * 18) / 80);
            if (t <= 0 || t >= 1) return null;
            const k = t * (pts.length - 1);
            const a = pts[Math.floor(k)], b = pts[Math.min(pts.length - 1, Math.floor(k) + 1)];
            const x = a[0] + (b[0] - a[0]) * (k % 1), y = a[1] + (b[1] - a[1]) * (k % 1) - 30 - Math.abs(Math.sin(t * 12)) * 30;
            return <rect key={i} x={x - 18} y={y - 24} width={36} height={46} rx={3} fill="#F1E6CB" stroke={INK} strokeWidth={4} transform={`rotate(${Math.sin(t * 9) * 15} ${x} ${y})`} />;
          })}
      </Cam>
      {papers >= 0 && <PlaceTag text="7 NOVEMBER 1605" sub="proclaimed traitors" t={prog(f, 6, 20)} />}
      <Vignette strength={0.3} />
    </Frame>
  );
};

/** A Midlands house: a gentleman hears the news and closes his door. */
const ClosedDoor: React.FC<{f: number; d: number}> = ({f, d}) => {
  const close = prog(f, 120, 160);
  const w = walker(f, 0, 70, 2.4);
  return (
    <Frame>
      <Cam f={f} keys={[[0, 1.05, 960, 560], [d, 1.12, 1100, 580]]}>
        <Sky time="grey" id="mid" />
        <Hills y={640} color="#7E8A6A" amp={40} seed={9} />
        <Timbered x={1080} base={760} w={560} h={480} fill="#C9B79A" doorOpen={1 - close} seed={8} />
        <Cobbles y={755} color="#A89878" />
        <Person id="catesby" x={360 + 1.35 * w.d} y={846} scale={1.35} f={f} seed={2} pose={f < 70 ? w.p : addPose(stand(f, 2), {shR: 50 + 12 * Math.sin(f / 10), elR: 50})} look={[0.6, 0]} expression="worried" />
        <Person id="neighbourMan" x={1360} y={846} dir={-1} scale={1.3} f={f} seed={6} pose={f > 100 ? addPose(stand(f, 6), {headTilt: -6}) : stand(f, 6)} look={[-0.6, 0]} expression={f > 90 ? 'worried' : 'neutral'} opacity={1 - close} head={{hat: 'capotain', hatColor: '#3A3530'}} outfit={{color: '#4A5A6A'}} />
      </Cam>
      <PlaceTag text="THE MIDLANDS" sub="after the arrest" t={prog(f, 8, 24)} />
      <Vignette strength={0.35} />
    </Frame>
  );
};

const TowerShot: React.FC<{f: number; d: number; time?: 'grey' | 'dusk'; sombre?: number; tag?: boolean}> = ({f, d, time = 'grey', sombre = 0, tag}) => (
  <Frame>
    <Cam f={f} keys={[[0, 1.0, 960, 520], [d, 1.08, 960, 500]]}>
      <Sky time={time} id={'tw' + time} />
      <Roofline base={700} color="#9AA0A0" seed={11} />
      <Tower x={680} base={780} time="grey" />
      <rect x={-300} y={780} width={2520} height={400} fill="#8C8A80" />
      <path d="M-300,820 H2220" stroke={INK} strokeWidth={5} />
    </Cam>
    <Particles f={f} kind="rain" n={sombre > 0 ? 90 : 0} seed={5} speed={0.8} opacity={0.6} />
    {tag && <PlaceTag text="THE TOWER OF LONDON" sub="7 November 1605" t={prog(f, 8, 24)} />}
    <SombreGrade amount={sombre} />
  </Frame>
);

/** Examiners' sheets accumulate on a desk; no depiction of the questioning. */
const Examiner: React.FC<{f: number; d: number; n: [number, number]; compare?: number}> = ({f, d, n, compare = 0}) => (
  <Frame bg="#3C2C22">
    <Cam f={f} keys={[[0, 1.05, 960, 520], [d, 1.12, 960, 540]]}>
      <Desk tone="cool" />
      <Candle x={1560} y={460} f={f} s={1.3} />
      <SheetStack x={compare > 0 ? 620 : 900} y={560} n={kf(f, [[0, n[0]], [d * 0.8, n[1]]])} s={1.3} />
      {compare > 0 &&
        [0, 1, 2].map((i) => (
          <g key={i} opacity={prog(f, 10 + i * 12, 24 + i * 12)} transform={`translate(${1100 + i * 230},${560 + (i % 2) * 40}) rotate(${(i - 1) * 4})`}>
            <Sheet x={0} y={0} w={200} h={270} folds="none" color={['#E8E0CC', '#F1E6CB', '#E6DCC2'][i]}><Hand x={20} y={40} w={160} lines={7} gap={30} size={9} seed={90 + i} /></Sheet>
          </g>
        ))}
    </Cam>
    {compare > 0 && <PlaceTag text="READ ALONGSIDE OTHER EVIDENCE" t={prog(f, 30, 46)} />}
    <Vignette strength={0.5} />
  </Frame>
);

const Holbeach: React.FC<{f: number; d: number; men?: number; led?: number}> = ({f, d, men = 0, led = -1}) => (
  <Frame>
    <Cam f={f} keys={[[0, 1.0, 960, 520], [d, 1.06, 960, 520]]}>
      <Sky time="dawn" id="holb" />
      <Hills y={660} color="#8A9070" amp={40} seed={4} />
      <BrickManor x={600} base={740} mist={1} f={f} />
      <rect x={-300} y={740} width={2520} height={400} fill="#7E8A64" />
      {men > 0 &&
        Array.from({length: 6}, (_, i) => {
          const w = led >= 0 && i > 3 ? walker(f, led, led + 200, 1.6, false, i * 0.3) : {d: 0, p: stand(f, i)};
          return <Person key={i} id={i > 3 ? 'officer' : 'officer'} x={200 + i * 260 - w.d * 0.6} y={880} scale={1.15} f={f} seed={i * 3} pose={w.p} fromBehind={i <= 3} opacity={men} dir={led >= 0 && i > 3 ? -1 : 1} />;
        })}
    </Cam>
    <PlaceTag text="HOLBEACH HOUSE, STAFFORDSHIRE" sub="8 November 1605" t={prog(f, 8, 24) * (1 - prog(f, d - 24, d - 8))} />
    <SombreGrade amount={0.35} />
  </Frame>
);

/** The five: four portraits grey and empty out, Fawkes's stays. */
const Fates: React.FC<{f: number; d: number; grey: number; empty?: number; only?: string}> = ({f, d, grey, empty = 0, only}) => {
  const ids = ['catesby', 'percy', 'wright', 'winter', 'fawkes'];
  return (
    <Frame bg="#2A2420">
      <rect width={1920} height={1080} fill="#2E2622" />
      <Particles f={f} kind="dust" n={30} seed={8} />
      <Cam f={f} keys={[[0, 1.0, only ? (only === 'fawkes' ? 1200 : 720) : 960, 480], [d, only ? 1.15 : 1.08, only === 'fawkes' ? 1440 : only ? 480 : 960, 470]]}>
      {ids.map((id, i) => {
        const x = 240 + i * 360;
        const g = id === 'fawkes' ? 0 : prog(f, grey + i * 6, grey + i * 6 + 20);
        const e = id === 'fawkes' || id === 'winter' ? 0 : empty;
        const show = !only || only === id;
        return (
          <g key={id} opacity={show ? 1 : 0.25}>
            <Portrait x={x} y={420} id={id} f={f} s={0.95} t={1 - e} grey={g} label={id === 'catesby' ? 'ROBERT CATESBY' : id === 'percy' ? 'THOMAS PERCY' : id === 'wright' ? 'JOHN WRIGHT' : id === 'winter' ? 'THOMAS WINTER' : 'GUY FAWKES'} sub={id === 'winter' ? 'captured' : id === 'fawkes' ? 'tried and condemned' : 'died at Holbeach'} />
            {e > 0 && <rect x={x - 124} y={420 - 162} width={248} height={304} rx={10} fill="none" stroke="#6A5A46" strokeWidth={6} strokeDasharray="14 10" opacity={e} />}
          </g>
        );
      })}
      </Cam>
    </Frame>
  );
};

export const S06: React.FC = () => {
  const mapAt = S + 3;
  return (
    <Shots
      start={S}
      end={E}
      shots={[
        {at: S, el: (f, d) => <Frame><ChapterCard f={f} d={d} num={5} title="After the Arrest" date="5–8 November 1605" /></Frame>, trans: 'cut'},
        {at: mapAt, el: (f, d) => <StrandsMap f={f} d={d} london={prog(f, sf(T('In London, investigators') - mapAt), sf(T('In London, investigators') - mapAt) + 16)} route={[sf(T('In the Midlands, Catesby') - mapAt), sf(T('In the Midlands, Catesby') - mapAt) + 110]} />},
        {at: T('The king was alive and'), el: (f, d) => <ClosedDoor f={f} d={d} />},
        {
          at: T('On the seventh of November'),
          el: (f, d) => (
            <Frame bg="#3C2C22">
              <Desk />
              <Proclamation x={960} y={520} s={1.6 + 0.08 * prog(f, 0, d)} rot={-2} />
              <Vignette strength={0.5} />
            </Frame>
          ),
        },
        {at: T('declared the rebels traitors', 0, 'end') + 0.05, el: (f, d) => <StrandsMap f={f} d={d} london={0.4} route={[-10, -5]} papers={10} />},
        {at: T('That day, at the Tower of London'), el: (f, d) => <TowerShot f={f} d={d} tag />},
        {at: T('These documents are central'), el: (f, d) => <Examiner f={f} d={d} n={[1, 5]} />},
        {at: T('Fawkes was tortured'), el: (f, d) => <TowerShot f={f} d={d} time="dusk" sombre={0.8} />, trans: 'dip'},
        {at: T('A statement taken from'), el: (f, d) => <Examiner f={f} d={d} n={[5, 5]} compare={1} />},
        {at: T('By the eighth of November the flight'), el: (f, d) => <StrandsMap f={f} d={d} london={0} route={[-10, 50]} end={60} />},
        {at: T('had ended at Holbeach', 0, 'end') + 0.05, el: (f, d) => <Examiner f={f} d={d} n={[5, 11]} />},
        {at: T('Catesby, Percy and the Wright brothers'), el: (f, d) => <Holbeach f={f} d={d} men={prog(f, 10, 30)} led={sf(T('Others were captured') - T('Catesby, Percy and the Wright brothers'))} />},
        {at: T('There would be no trial at which'), el: (f, d) => <Fates f={f} d={d} grey={9999} only="catesby" />},
        {at: T('The man who lived to be questioned'), el: (f, d) => <Fates f={f} d={d} grey={9999} only="fawkes" />},
        {at: T('Their different fates help'), el: (f, d) => <Fates f={f} d={d} grey={20} />},
        {at: T('better than the others', 0, 'end') + 0.05, el: (f, d) => <Fates f={f} d={d} grey={-40} empty={prog(f, 40, 90)} />},
      ]}
    />
  );
};

export {seated, standStiff, RegionLabel, clamp};
