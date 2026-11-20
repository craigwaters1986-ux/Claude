// s03 · The rail-splitter (1:30–2:20) · shots 3.1–3.6 from the storyboard.
// Poses, props and cameras come from the pure solvers in s03-solve.ts (contacts measured by check-contacts).
import React from 'react';
import {Shots, Frame} from '../kit/Shots';
import {Person} from '../kit/Cast';
import {CineCam, CineDefs, TitlePlate, PassBy, Rim, GodRays} from '../kit/Cinema';
import {PropAt, AXE, RailLog, Chips} from '../kit/Props';
import {SkyGrad, Ridge, TreeRow, Clearing, RailPile} from '../kit/Sets04';
import {usProjection, USMap, StateLabel, PlaceDot, RouteLine, RiverLine, FLATBOAT_1828, OHIO, MISSISSIPPI, PLACES, MAPC} from '../kit/USMap';
import {Birds} from '../components/Environment';
import {Particles} from '../components/Effects';
import {T} from '../timeline';
import {C, FONT} from '../styles/theme';
import {prog, kf, noise1, hash} from '../animations/core';
import {FigEl, Look, DateTag, GreyTag, Pill, SACK, LETTER, Ox, Wagon} from './s02-parts';
import {IrisIn, TailDip} from './S02';
import * as Q from './s03-solve';
import {Flatboat, Pole, RiverBed, RiverWater, RiverBank, MistBand, PoleOut} from '../kit/Flatboat';

const AT = Q.AT03;
const lf = Q.lf3;
const ink = C.ink;
const o = (w = 4) => ({stroke: ink, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});

// ---------------------------------------------------------------- 3.1 river at dawn, the flatboat (kit Flatboat)
const River: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = Q.solveRiver(f);
  const o = Q.RIVER_OPTS;
  const p = s.pole as PoleOut;
  return (
    <Frame bg="#9AB0CC">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={31}>
        {(layer) => [
          layer(0.12, <SkyGrad time="dawn" id="s31sky" />),
          layer(0.12, <circle cx={1500} cy={560} r={80} fill="#FFE2B8" opacity={0.8} />),
          layer(0.3, <Ridge y={600} color="#A2A8C0" seed={6} amp={40} />, 3),
          layer(0.55, <g><RiverBank f={f} y={650} color="#7A8068" tree="#5E6A52" seed={7} /><MistBand f={f} y={640} op={0.5} seed={3} /></g>, 2),
          layer(1, (
            <g>
              <RiverBed f={f} bed={o.bedY} y0={o.waterY} />
              <Flatboat pl={p.boat} f={f} />
              <Pole out={p} />
              <Rim kind="warm" side="r"><FigEl g={s.figs[0]} f={f} seed={56} label="ABRAHAM LINCOLN" sublabel="aged 19" /></Rim>
              <RiverWater f={f} y0={o.waterY} bed={o.bedY} />
              <MistBand f={f + 40} y={o.waterY + 10} op={0.3} seed={5} />
            </g>
          )),
        ]}
      </CineCam>
      <Birds f={f} n={4} seed={31} y={220} />
      <Look f={f} grade="dawn" vig={0.45} />
      <TitlePlate f={f} d={90} num={3} title="The rail-splitter" />
      <IrisIn f={f} />
      {void d}
    </Frame>
  );
};

// ---------------------------------------------------------------- 3.2 map: down the Ohio and Mississippi to New Orleans
const RouteMap: React.FC<{f: number; d: number}> = ({f, d}) => {
  const proj = usProjection('RIVER_ROUTE');
  const tMiles = lf(T('over twelve hundred miles'), 'map');
  const route = prog(f, 16, tMiles + 10, (t) => t);
  const [rx, ry] = proj(PLACES.Rockport)!;
  const [nx, ny] = proj(PLACES.NewOrleans)!;
  return (
    <Frame bg={MAPC.sea}>
      <CineCam f={f} keys={[[0, 1.5, rx - 40, ry + 60], [tMiles - 20, 1.18, 960, 540], [d, 1.15, 960, 545]]} seed={32}>
        {(layer) => [
          layer(1, (
            <g>
              <USMap proj={proj} f={f} year={1828} id="s32" states={{IN: {fill: '#B9C99A', t: 1}, LA: {fill: '#D9C08E', t: prog(f, tMiles - 30, tMiles)}}} />
              <RiverLine proj={proj} pts={OHIO} t={1} width={6} />
              <RiverLine proj={proj} pts={MISSISSIPPI} t={1} width={7} />
              <StateLabel proj={proj} code="IN" text="INDIANA" t={prog(f, 0, 14)} size={32} year={1828} />
              <StateLabel proj={proj} code="LA" text="LOUISIANA" t={prog(f, tMiles - 30, tMiles)} size={30} year={1828} dx={-60} />
              <PlaceDot proj={proj} at={PLACES.NewOrleans} label="New Orleans" side="left" t={prog(f, tMiles - 12, tMiles + 6)} size={34} ring={1} f={f} />
              <RouteLine proj={proj} pts={FLATBOAT_1828} t={route} icon="boat" iconScale={1.1} />
              <g opacity={prog(f, 30, 44)}>
                <text x={proj([-86.6, 37.62])![0]} y={proj([-86.6, 37.62])![1] + 26} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontStyle="italic" fontSize={24} fill="#3E5A62" stroke="#F4EBD6" strokeWidth={6} paintOrder="stroke">Ohio</text>
                <text x={proj([-91.6, 33.4])![0] - 14} y={proj([-91.6, 33.4])![1]} textAnchor="end" fontFamily={FONT.sans} fontWeight={800} fontStyle="italic" fontSize={26} fill="#3E5A62" stroke="#F4EBD6" strokeWidth={6} paintOrder="stroke">Mississippi</text>
              </g>
            </g>
          )),
        ]}
      </CineCam>
      <Pill t={prog(f, tMiles, tMiles + 12)} text="about 1,222 miles" x={1420} y={470} size={44} />
      <Look f={f} grade="day" vig={0.35} />
      {void nx}
      {void ny}
    </Frame>
  );
};

// ---------------------------------------------------------------- 3.3 Illinois clearing: splitting rails, golden hour
const Rails: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = Q.solveRails(f);
  const fl = Q.RAILS_FLOOR;
  const imp = s.impact as {x: number; y: number};
  const impacts = s.impacts as number[];
  const wx = 1900 - f * 0.9;
  return (
    <Frame bg="#E9B872">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={33}>
        {(layer) => [
          layer(0.12, <SkyGrad time="golden" id="s33sky" />),
          layer(0.12, <circle cx={420} cy={300} r={90} fill="#FFE6A0" opacity={0.85} />),
          layer(0.35, <Ridge y={610} color="#B89A6A" seed={8} amp={40} />, 3),
          layer(0.55, (
            <g>
              <TreeRow y={700} f={f} n={9} s={1.1} color="#7A7A40" seed={4} />
              <g transform={`translate(${wx},690) scale(0.42) translate(${-wx},-690)`}>
                <Wagon x={wx} floor={690} roll={f * 0.9 / 0.42} part="back" cover />
                <Wagon x={wx} floor={690} roll={f * 0.9 / 0.42} />
                <Ox x={wx - 210 - 250} y={690} s={1.25} dir={-1} phase={(f * 0.9) / 0.42 / 210} walking={1} f={f} />
              </g>
            </g>
          ), 2),
          layer(1, (
            <g>
              <Clearing y={fl} />
              <RailPile x={1420} y={fl} n={s.rails as number} />
              <rect x={imp.x - 60} y={imp.y + 30} width={120} height={fl - imp.y - 30} fill="#7A5A3A" stroke={ink} strokeWidth={4} />
              <RailLog x={imp.x} y={imp.y + 30} split={(s.nImp as number) % 2 === 1 ? 1 : 0.15} />
              <Rim kind="warm" side="l"><FigEl g={s.figs[0]} f={f} seed={51} /></Rim>
              <PropAt def={AXE} xf={s.axe as never} st={{f}} />
              {impacts.map((a) => <Chips key={a} x={imp.x} y={imp.y} f={f} at={a} />)}
            </g>
          )),
          layer(1.5, <PassBy f={f} x0={-200} speed={1.6} y={1120} kind="grass" s={1.6} />),
        ]}
      </CineCam>
      <Particles f={f} kind="dust" n={24} seed={33} />
      <Look f={f} grade="golden" vig={0.45} />
      <DateTag f={f} at={10} until={d - 8} text="1830 · Illinois" />
    </Frame>
  );
};

// ---------------------------------------------------------------- 3.4 the campaign rail, then New Orleans at dusk (distant)
const ZigFence: React.FC<{x0: number; x1: number; floor: number; s?: number}> = ({x0, x1, floor, s = 1}) => {
  const n = Math.ceil((x1 - x0) / (150 * s));
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const x = x0 + i * 150 * s;
        const up = i % 2 === 0;
        return (
          <g key={i}>
            {[0, 1, 2, 3].map((k) => (
              <path key={k} d={`M${x - 20 * s},${floor - (14 + k * 34) * s + (up ? 0 : 6 * s)} L${x + 170 * s},${floor - (20 + k * 34) * s + (up ? 6 * s : 0)}`} stroke="#3A2A1C" strokeWidth={15 * s} strokeLinecap="round" />
            ))}
            {[0, 1, 2, 3].map((k) => (
              <path key={'b' + k} d={`M${x - 20 * s},${floor - (14 + k * 34) * s + (up ? 0 : 6 * s)} L${x + 170 * s},${floor - (20 + k * 34) * s + (up ? 6 * s : 0)}`} stroke={k % 2 ? '#9A7046' : '#8A6440'} strokeWidth={10 * s} strokeLinecap="round" />
            ))}
          </g>
        );
      })}
    </g>
  );
};
/** A distant waterfront at dusk: low roofs, church spires, warehouses and ship masts along the levee. No people. */
const Waterfront: React.FC<{f: number; base: number}> = ({f, base}) => (
  <g>
    {Array.from({length: 26}, (_, i) => {
      const x = -200 + i * 92 + hash(i * 7) * 30;
      const h = 40 + hash(i * 3) * 70;
      const w = 70 + hash(i * 5) * 40;
      return (
        <g key={i}>
          <rect x={x} y={base - h} width={w} height={h} fill="#3A3448" stroke={ink} strokeWidth={2.5} />
          <path d={`M${x - 4},${base - h} L${x + w / 2},${base - h - 22} L${x + w + 4},${base - h}Z`} fill="#2E2A3A" stroke={ink} strokeWidth={2.5} />
          {hash(i * 11) > 0.45 && <rect x={x + w * 0.3} y={base - h * 0.6} width={9} height={11} fill="#F2B04A" opacity={0.55 + 0.35 * noise1(f / 30 + i, 4)} />}
        </g>
      );
    })}
    <g transform={`translate(980,${base})`}>
      <rect x={-60} y={-130} width={120} height={130} fill="#3E3850" stroke={ink} strokeWidth={3} />
      {[-48, 0, 48].map((x, i) => <path key={i} d={`M${x - 14},-130 L${x - 14},-150 L${x},${i === 1 ? -230 : -196} L${x + 14},-150 L${x + 14},-130Z`} fill="#3E3850" stroke={ink} strokeWidth={3} />)}
    </g>
    {Array.from({length: 9}, (_, i) => {
      const x = 120 + i * 210 + hash(i * 13) * 60;
      const sw = Math.sin(f / 40 + i) * 1.5;
      return (
        <g key={'m' + i} transform={`rotate(${sw},${x},${base + 30})`}>
          <path d={`M${x - 60},${base + 22} L${x + 60},${base + 22} L${x + 46},${base + 40} L${x - 46},${base + 40}Z`} fill="#2A2632" stroke={ink} strokeWidth={2.5} />
          <line x1={x} y1={base + 22} x2={x} y2={base - 150 - hash(i) * 40} stroke="#2A2632" strokeWidth={5} />
          <line x1={x - 30} y1={base - 100} x2={x + 30} y2={base - 100} stroke="#2A2632" strokeWidth={4} />
          <line x1={x + 34} y1={base + 22} x2={x + 26} y2={base - 90 - hash(i) * 30} stroke="#2A2632" strokeWidth={3.5} />
        </g>
      );
    })}
  </g>
);
const Orleans: React.FC<{f: number; d: number}> = ({f, d}) => {
  const tB = lf(T('On a second trip'), 'orleans');
  const tTag = lf(T('Stories of its effect'), 'orleans');
  const mix = prog(f, tB - 10, tB + 14);
  return (
    <Frame bg="#E9B872">
      <CineDefs />
      {mix < 1 && (
        <g>
          <CineCam f={f} keys={[[0, 1.25, 980, 640], [tB + 14, 1.42, 1000, 650]]} seed={34}>
            {(layer) => [
              layer(0.12, <SkyGrad time="golden" id="s34sky" />),
              layer(0.4, <Ridge y={640} color="#B89A6A" seed={12} amp={36} />, 3),
              layer(0.7, <TreeRow y={700} f={f} n={8} s={1.0} color="#7A7A40" seed={9} />, 2),
              layer(1, (
                <g>
                  <Clearing y={860} color="#A8965A" />
                  <ZigFence x0={300} x1={1900} floor={860} s={1.3} />
                  <g transform="rotate(-62,1040,858)">
                    <rect x={1040} y={842} width={330} height={26} rx={10} fill="#9A7046" {...o(4)} />
                    <path d="M1060,850 q30,4 60,0 M1180,860 q30,-4 60,0" stroke="#5E4128" strokeWidth={3} fill="none" />
                    <path d="M1040,842 L1370,846" stroke="#C49A62" strokeWidth={4} />
                  </g>
                </g>
              )),
            ]}
          </CineCam>
          <GodRays x={420} y={160} w={260} f={f} angle={-34} len={1000} op={0.12} />
          <Particles f={f} kind="dust" n={20} seed={34} />
          <Look f={f} grade="golden" vig={0.42} />
        </g>
      )}
      {mix > 0 && (
        <g opacity={mix}>
          <CineCam f={f} keys={[[tB - 10, 1.0, 960, 520], [d, 1.12, 980, 500]]} seed={35}>
            {(layer) => [
              layer(0.12, <SkyGrad time="dusk" id="s34dsk" />),
              layer(0.12, <circle cx={1500} cy={560} r={70} fill="#F2B07A" opacity={0.7} />),
              layer(0.5, <Waterfront f={f} base={600} />),
              layer(0.8, (
                <g>
                  <rect x={-600} y={598} width={3200} height={900} fill="#3E4A6A" />
                  <line x1={-600} y1={600} x2={2600} y2={600} stroke={ink} strokeWidth={4} />
                  {Array.from({length: 26}, (_, i) => {
                    const y = 640 + ((i * 41) % 360);
                    const x = ((i * 233 + f * (0.5 + (i % 3) * 0.25)) % 2600) - 400;
                    return <path key={i} d={`M${x},${y} q30,-7 60,0 t60,0`} stroke={i % 4 === 0 ? '#C88A6A' : '#5E6A8A'} strokeWidth={4} fill="none" opacity={0.8} />;
                  })}
                  <rect x={1420} y={612} width={160} height={6} fill="#F2B07A" opacity={0.35 + 0.15 * noise1(f / 20, 2)} />
                </g>
              )),
            ]}
          </CineCam>
          <Birds f={f} n={3} seed={34} y={260} />
          <Look f={f} grade="dusk" vig={0.55} />
        </g>
      )}
      <GreyTag f={f} at={tTag} until={d - 6} text="Later accounts · treated with caution" x={1860} y={800} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 3.5 New Salem: store, mailbag, surveyor's chain (one track)
const Shelves: React.FC<{x: number; fl: number; w: number}> = ({x, fl, w}) => (
  <g>
    {[0, 1, 2].map((k) => <rect key={k} x={x} y={fl - 520 + k * 120} width={w} height={12} fill="#6E4C30" {...o(3)} />)}
    {Array.from({length: Math.floor(w / 70) * 3}, (_, i) => {
      const k = i % 3;
      const cx = x + 30 + Math.floor(i / 3) * 70;
      const y = fl - 520 + k * 120;
      return k === 1 ? <rect key={i} x={cx - 18} y={y - 52} width={36} height={52} rx={6} fill={['#8A6440', '#B8A27A', '#6A7A5A'][i % 3]} {...o(3)} /> : <path key={i} d={`M${cx - 16},${y} L${cx - 12},${y - 40} Q${cx},${y - 50} ${cx + 12},${y - 40} L${cx + 16},${y}Z`} fill={['#C9B07A', '#9AAAB0', '#B88A5A'][i % 3]} {...o(3)} />;
    })}
  </g>
);
const Salem: React.FC<{f: number; d: number}> = ({f}) => {
  const s = Q.solveSalem(f);
  const fl = Q.SALEM_FLOOR;
  const A = Q.SALEM.a;
  const B = Q.SALEM.b;
  const Cx = Q.SALEM.c;
  const [a, b, c] = s.figs;
  const tableTop = s.tableTop as number;
  const counterTop = s.counterTop as number;
  const crateTop = s.crateTop as number;
  const n = s.nSorted as number;
  const cR = s.chainR as {x: number; y: number};
  const pin = {x: Cx + 760, y: fl - 4};
  const chainPts = Array.from({length: 30}, (_, i) => {
    const u = i / 29;
    return {x: cR.x + (pin.x - cR.x) * u, y: cR.y + (pin.y - cR.y) * u + Math.sin(Math.PI * u) * 60};
  });
  return (
    <Frame bg="#C9B79A">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={36}>
        {(layer) => [
          layer(0.3, <g><SkyGrad time="day" id="s35sky" /><TreeRow y={700} f={f} n={20} s={1.0} color="#6E7A42" seed={21} x0={2200} x1={5200} /></g>, 2),
          layer(1, (
            <g>
              {/* store interior */}
              <rect x={-400} y={-200} width={1620} height={fl + 200} fill="#B8976E" />
              {Array.from({length: 12}, (_, i) => <line key={i} x1={-400 + i * 140} y1={-200} x2={-400 + i * 140} y2={fl} stroke="#A2825C" strokeWidth={3} />)}
              <Shelves x={A - 360} fl={fl} w={300} />
              <Shelves x={A + 300} fl={fl} w={420} />
              {/* post-office corner: pigeonholes */}
              <rect x={1220} y={-200} width={1260} height={fl + 200} fill="#A88A64" />
              <rect x={1220} y={-200} width={24} height={fl + 200} fill="#6E4C30" {...o(4)} />
              <g transform={`translate(${B - 200},${fl - 560})`}>
                <rect width={300} height={220} fill="#6E4C30" {...o(4)} />
                {Array.from({length: 20}, (_, i) => <rect key={i} x={12 + (i % 5) * 56} y={12 + Math.floor(i / 5) * 52} width={50} height={44} fill="#3E2A1A" stroke="#2A1C12" strokeWidth={2} />)}
                {Array.from({length: 9}, (_, i) => <rect key={'l' + i} x={20 + ((i * 2) % 5) * 56} y={30 + Math.floor((i * 2) / 5) * 52} width={34} height={14} fill="#F4EAD0" stroke={ink} strokeWidth={1.5} />)}
              </g>
              {/* field edge for the surveying */}
              <rect x={2480} y={-200} width={24} height={fl + 200} fill="#6E4C30" {...o(4)} />
              <rect x={2504} y={fl - 40} width={2400} height={40} fill="#8E9A52" />
              <rect x={-400} y={fl} width={5400} height={500} fill="#7A6248" />
              <rect x={2504} y={fl} width={2400} height={500} fill="#8E9A52" />
              <line x1={-400} y1={fl} x2={5000} y2={fl} stroke={ink} strokeWidth={5} />
              {/* A: counter behind the crate */}
              <rect x={A + 70} y={counterTop} width={360} height={fl - counterTop} fill="#7A5A3A" {...o(4)} />
              <rect x={A + 60} y={counterTop - 12} width={380} height={14} fill="#9A7046" {...o(3)} />
              {s.sackPlaced ? null : null}
              <rect x={A + 50} y={crateTop} width={84} height={fl - crateTop} fill="#9A7046" {...o(4)} />
              <path d={`M${A + 50},${crateTop + 30} H${A + 134} M${A + 50},${crateTop + 66} H${A + 134}`} stroke="#5E4128" strokeWidth={3} />
              <PropAt def={SACK} xf={{x: A + 250, y: counterTop - 30, s: 1}} st={{f}} />
              <PropAt def={SACK} xf={{x: A + 330, y: counterTop - 28, rot: 4, s: 1}} st={{f}} />
              <FigEl g={a} f={f} seed={52} />
              <PropAt def={SACK} xf={s.sack as never} st={{f}} />
              {/* B: table, mailbag, sorted pile */}
              <rect x={B + 30} y={tableTop} width={260} height={16} fill="#8A6440" {...o(3)} />
              <path d={`M${B + 50},${tableTop + 16} V${fl} M${B + 270},${tableTop + 16} V${fl}`} stroke="#5E4128" strokeWidth={10} />
              <FigEl g={b} f={f} seed={53} />
              <g transform={`translate(${B + 92},${tableTop})`}>
                <path d="M-34,0 Q-44,-50 -22,-62 L22,-62 Q44,-50 34,0Z" fill="#8A7458" {...o(4)} />
                <path d="M-22,-62 Q0,-50 22,-62" stroke="#5E4A34" strokeWidth={3} fill="none" />
                <path d="M-30,-30 H30" stroke="#5E4A34" strokeWidth={3} />
              </g>
              {Array.from({length: Math.min(8, n)}, (_, i) => <rect key={i} x={B + 112 + (i % 2) * 3} y={tableTop - 6 - i * 4} width={30} height={6} fill="#F4EAD0" stroke={ink} strokeWidth={1.5} />)}
              {Boolean(s.letterHeld) && <PropAt def={LETTER} xf={s.letter as never} st={{f}} />}
              {/* C: surveyor's chain to a pin, compass on a staff */}
              <line x1={Cx - 70} y1={fl} x2={Cx - 66} y2={fl - 250} stroke="#5E4128" strokeWidth={7} />
              <ellipse cx={Cx - 66} cy={fl - 256} rx={22} ry={8} fill="#B08A3A" {...o(3)} />
              <path d={`M${chainPts.map((p) => `${p.x},${p.y}`).join(' L')}`} fill="none" stroke="#4A4A4E" strokeWidth={5} strokeDasharray="8 5" />
              <line x1={pin.x} y1={pin.y + 4} x2={pin.x} y2={pin.y - 40} stroke="#4A4A4E" strokeWidth={5} />
              <FigEl g={c} f={f} seed={54} />
            </g>
          )),
        ]}
      </CineCam>
      <Look f={f} grade="day" vig={0.45} />
    </Frame>
  );
};

// ---------------------------------------------------------------- 3.6 volunteers raise hands: elected captain
const VOL_LOOKS = [
  {head: {hat: 'wideBrim' as const, hatColor: '#6A5A40'}, outfit: {color: '#8A7A5A'}},
  {head: {hat: 'none' as const, hair: 'short' as const, hairColor: '#5A4030', facial: 'none' as const}, outfit: {color: '#6A7A8A'}},
  {head: {hat: 'flatCap' as const, hatColor: '#4A4A40'}, outfit: {color: '#9A6A4A'}},
  {head: {hat: 'none' as const, hair: 'side' as const, hairColor: '#3A2A20'}, outfit: {color: '#7A6A4A'}},
];
const Captain: React.FC<{f: number; d: number}> = ({f, d}) => {
  const s = Q.solveCaptain(f);
  const fl = Q.CAPT_FLOOR;
  const [abe, ...vols] = s.figs;
  return (
    <Frame bg="#9CC4D8">
      <CineDefs />
      <CineCam f={f} keys={s.cam} seed={37}>
        {(layer) => [
          layer(0.12, <SkyGrad time="day" id="s36sky" />),
          layer(0.35, <Ridge y={640} color="#8E9A6A" seed={14} amp={40} />, 3),
          layer(0.6, <TreeRow y={720} f={f} n={10} s={1.1} color="#5E6A32" seed={15} />, 2),
          layer(1, (
            <g>
              <Clearing y={fl} color="#8E9A52" />
              {vols.map((v, i) => i < 4 ? (
                <Person key={i} id="farmer" x={v.pl.x} y={v.pl.y} scale={v.pl.scale} dir={v.pl.dir} pose={v.P} f={f + i * 11} seed={60 + i} look={v.look} head={{...VOL_LOOKS[i % 4].head, expression: v.ex!.expression as never}} outfit={VOL_LOOKS[(i + 1) % 4].outfit} lod="low" />
              ) : null)}
              {vols.map((v, i) => i >= 4 ? (
                <Person key={i} id="farmer" x={v.pl.x} y={v.pl.y} scale={v.pl.scale} dir={v.pl.dir} pose={v.P} f={f + i * 11} seed={60 + i} look={v.look} head={{...VOL_LOOKS[i % 4].head, expression: v.ex!.expression as never}} outfit={VOL_LOOKS[i % 4].outfit} />
              ) : null)}
              <Rim kind="warm" side="l"><FigEl g={abe} f={f} seed={55} /></Rim>
            </g>
          )),
        ]}
      </CineCam>
      <Look f={f} grade="day" vig={0.45} />
      <DateTag f={f} at={14} until={190} text="Black Hawk War, 1832" />
      <TailDip f={f} d={d} />
    </Frame>
  );
};

export const S03: React.FC = () => (
  <Shots
    start={AT.river}
    end={AT.end}
    overlap={14}
    shots={[
      {at: AT.river, el: (f, d) => <River f={f} d={d} />},
      {at: AT.map, trans: 'whip', el: (f, d) => <RouteMap f={f} d={d} />},
      {at: AT.rails, trans: 'cut', el: (f, d) => <Rails f={f} d={d} />},
      {at: AT.orleans, trans: 'fade', el: (f, d) => <Orleans f={f} d={d} />},
      {at: AT.salem, trans: 'cut', el: (f, d) => <Salem f={f} d={d} />},
      {at: AT.captain, trans: 'cut', el: (f, d) => <Captain f={f} d={d} />},
    ]}
  />
);
