// Character contact sheets for ep01 (animator verification; not part of the episode).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../../styles/theme';
import {StickFigure, GroupTag, NameTag} from '../StickFigure';
import {CAST, castProps} from '../cast';
import {Crowd} from '../Crowd';
import {Handshake, Hug} from '../interactions';
import {
  stand, standStiff, run, walk, dangle, survivorStand, survivorSit, receiveBothHands, helmetToChest, hatOff, headBowed, kneel,
  signDocument, wade, bucketChain, crouchRun, takeCover, kneelAim, paperWave, kneelSit, binocularsPose, seated, talkGesture, sitGround,
} from '../poses';
import {Pen, PaperSheet, FlyingPaper, RifleBetween, RifleAim, HeldItem, Binoculars, DocumentOnTable} from '../props';
import {handWorld, shoulderWorld} from '../skeleton';
import {Head} from '../Head';
import type {Expression} from '../Head';

const Label: React.FC<{x: number; y: number; t: string}> = ({x, y, t}) => (
  <text x={x} y={y} textAnchor="middle" fontFamily="Montserrat, Arial" fontWeight={700} fontSize={20} fill={C.ink}>{t}</text>
);

const Fig: React.FC<{k: string; x: number; y: number; f: number; pose?: any; expr?: Expression; dir?: 1 | -1; s?: number; label?: boolean} & Record<string, any>> = ({k, x, y, f, pose, expr, dir, s = 1, label = false, ...rest}) => {
  const c = CAST[k];
  return <StickFigure x={x} y={y} f={f} seed={x % 97} scale={s} dir={dir} pose={pose ?? stand(f, x)} head={{...c.head, expression: expr ?? 'neutral'}} outfit={c.outfit} child={c.child} label={label ? c.label : undefined} sublabel={label ? c.sublabel : undefined} {...rest} />;
};

/** Sheet 1: Asia-Pacific presets (A-01, A-02, A-03, A-09, A-17, A-23). */
export const SheetAsia: React.FC = () => {
  const f = useCurrentFrame();
  const top = ['japaneseSoldier', 'japaneseSoldierHelmet', 'japaneseOfficer', 'chineseSoldier', 'chineseSoldierHelmet', 'chineseSoldierKhaki', 'usMarine'];
  const bot = ['japaneseMan', 'japaneseMan2', 'japaneseWoman', 'japaneseWoman2', 'japaneseChild', 'japaneseGirl', 'japaneseDelegate', 'japaneseDelegate2'];
  return (
    <AbsoluteFill style={{background: C.wallYellow}}>
      <svg width={1920} height={1080}>
        <rect y={540} width={1920} height={540} fill={C.floor} />
        {top.map((k, i) => <g key={k}><Fig k={k} x={150 + i * 270} y={470} f={f} pose={i === 0 ? walk(f / 30) : i === 6 ? crouchRun(f / 22) : standStiff(f, i)} expr={i === 3 ? 'determined' : 'neutral'} /><Label x={150 + i * 270} y={515} t={k} /></g>)}
        {bot.map((k, i) => <g key={k}><Fig k={k} x={130 + i * 235} y={960} f={f} pose={i >= 6 ? standStiff(f, i) : stand(f, i)} expr={i === 2 ? 'worried' : i === 4 ? 'sad' : 'neutral'} /><Label x={130 + i * 235} y={1005} t={k} /></g>)}
        <GroupTag x={1600} y={735} text="JAPANESE DELEGATION" />
      </svg>
    </AbsoluteFill>
  );
};

/** Sheet 2: Europe/Africa presets (A-04, A-10, A-11, A-12, A-19, A-22, A-05 outfits). */
export const SheetEurope: React.FC = () => {
  const f = useCurrentFrame();
  const top: [string, any][] = [['germanOfficer', standStiff(f)], ['rafPilot', run(f / 20)], ['medic', stand(f, 2)], ['medicBrit', walk(f / 30)], ['nurse', stand(f, 4)], ['partyMember', stand(f, 5)], ['ausSoldier', stand(f, 6)]];
  const bot: [string, any, Expression][] = [['paratrooper', dangle(f), 'determined'], ['ausSoldierDesert', stand(f, 1), 'neutral'], ['britSoldierDesert', stand(f, 3), 'neutral'], ['survivor', survivorStand(f), 'tired'], ['survivorNoCap', survivorStand(f, 2), 'sad'], ['survivor', survivorSit(f), 'neutral']];
  const paraPl = {x: 160, y: 900};
  const sh = shoulderWorld(paraPl, dangle(f));
  return (
    <AbsoluteFill style={{background: C.wallYellow}}>
      <svg width={1920} height={1080}>
        <rect y={540} width={1920} height={540} fill={C.floor} />
        {top.map(([k, p], i) => <g key={k}><Fig k={k} x={150 + i * 270} y={470} f={f} pose={p} /><Label x={150 + i * 270} y={515} t={k} /></g>)}
        {/* stand-in canopy lines to show the attach points (V-02 is the environment designer's) */}
        <line x1={sh.x} y1={sh.y} x2={100} y2={600} stroke={C.ink} strokeWidth={1.5} />
        <line x1={sh.x} y1={sh.y} x2={220} y2={600} stroke={C.ink} strokeWidth={1.5} />
        {bot.map(([k, p, e], i) => <g key={i}><Fig k={k} x={160 + i * 300} y={i === 0 ? paraPl.y : 960} f={f} pose={p} expr={e} shadow={i !== 0} /><Label x={160 + i * 300} y={1005} t={k} /></g>)}
        <rect x={1620} y={906} width={110} height={56} fill={C.brown} stroke={C.ink} strokeWidth={4} />
      </svg>
    </AbsoluteFill>
  );
};

/** Sheet 3: action poses (A-05, A-06, A-07, A-13, A-14, A-15, A-16, A-18, A-20, A-21, A-24). */
export const SheetPoses: React.FC = () => {
  const f = useCurrentFrame();
  const tCycle = (f % 90) / 90;
  const sign1 = signDocument(f, {seated: true, lookUps: [[70, 100]]});
  const sign2 = signDocument(f, {});
  const chain = [0, 1, 2].map((i) => bucketChain(f / 40 + i * 0.12));
  const paperPl = {x: 1720, y: 470};
  const releaseAt = 40;
  const pw = paperWave(Math.min(f, releaseAt));
  const rel = handWorld(paperPl, paperWave(releaseAt), 'R');
  return (
    <AbsoluteFill style={{background: C.wallYellow}}>
      <svg width={1920} height={1080}>
        <rect y={540} width={1920} height={540} fill={C.floor} />
        {/* row 1 */}
        <Fig k="survivor" x={110} y={470} f={f} pose={receiveBothHands(f, Math.min(1, f / 60))} expr="tired" overlayFront={(sk: any) => f > 30 ? <HeldItem a={{x: sk.armL.hx, y: sk.armL.hy}} b={{x: sk.armR.hx, y: sk.armR.hy}} kind="blanket" /> : null} />
        <Label x={110} y={515} t="receiveBothHands" />
        <Fig k="usSoldier" x={300} y={470} f={f} pose={helmetToChest(f, Math.min(1, f / 60))} expr="sad" hatInHand={hatOff(Math.min(1, f / 60)) ? {} : undefined} eyesClosed={f > 55} />
        <Label x={300} y={515} t="helmetToChest" />
        <Fig k="britSoldier" x={480} y={470} f={f} pose={helmetToChest(f, Math.min(1, f / 60), true)} expr="sad" hatInHand={hatOff(Math.min(1, f / 60)) ? {} : undefined} eyesClosed />
        <Label x={480} y={515} t="…kneeling" />
        <Fig k="woman1" x={650} y={470} f={f} pose={headBowed(standStiff(f))} expr="solemn" eyesClosed />
        <Label x={650} y={515} t="headBowed" />
        <rect x={790} y={378} width={150} height={10} fill={C.brown} stroke={C.ink} strokeWidth={3} />
        <line x1={805} y1={388} x2={805} y2={470} stroke={C.ink} strokeWidth={5} /><line x1={925} y1={388} x2={925} y2={470} stroke={C.ink} strokeWidth={5} />
        <rect x={720} y={408} width={50} height={8} fill={C.brown} stroke={C.ink} strokeWidth={3} />
        <DocumentOnTable x={860} y={378} signed={Math.min(1, f / 60)} />
        <Fig k="chamberlain" x={760} y={470} f={f} pose={sign1.pose} expr="neutral" look={sign1.lookingUp ? [0.6, -0.2] : [0.4, 1]} overlayFront={(sk: any) => <Pen x={sk.armR.hx} y={sk.armR.hy} />} label />
        <Label x={850} y={515} t="signDocument seated" />
        <rect x={1010} y={378} width={150} height={10} fill={C.brown} stroke={C.ink} strokeWidth={3} />
        <Fig k="japaneseDelegate" x={1010} y={470} f={f} pose={sign2.pose} overlayFront={(sk: any) => <Pen x={sk.armR.hx} y={sk.armR.hy} />} look={[0.4, 1]} />
        <Label x={1060} y={515} t="…standing" />
        <Handshake f={f} x={1330} y={470} start={10} a={{...castProps('chamberlain'), label: undefined, head: {...CAST.chamberlain.head, expression: 'smug'}}} b={{...castProps('hitler'), label: undefined, head: {...CAST.hitler.head, expression: 'neutral'}}} />
        <Label x={1330} y={515} t="Handshake" />
        <Fig k="chamberlain" x={paperPl.x} y={paperPl.y} f={f} pose={pw} expr={f < releaseAt ? 'happy' : 'worried'} holdR={f < releaseAt ? <PaperSheet flutter={Math.sin(f / 3) * 8} /> : undefined} />
        {f >= releaseAt && <FlyingPaper f={f} start={releaseAt} x0={rel.x} y0={rel.y} />}
        <Label x={1720} y={515} t="paperWave + release" />
        {/* row 2 */}
        <rect x={0} y={900} width={330} height={180} fill={C.sea} opacity={0.85} />
        {[0, 1].map((i) => (
          <Fig key={i} k="usSoldier" x={90 + i * 150} y={900} f={f} pose={wade(f / 45 + i * 0.4, 60)} expr="determined" cutBelow={900} overlayTop={(sk: any) => <RifleBetween a={{x: sk.armL.hx - 20, y: sk.armL.hy}} b={{x: sk.armR.hx + 30, y: sk.armR.hy}} />} />
        ))}
        <Label x={160} y={1005} t="wade (depth 60)" />
        {chain.map((c, i) => (
          <Fig key={i} k={i === 1 ? 'workerW' : 'worker'} x={420 + i * 105} y={960} f={f} s={0.85} pose={c.pose} expr="determined" overlayFront={(sk: any) => c.holding ? <HeldItem a={{x: sk.armL.hx, y: sk.armL.hy}} b={{x: sk.armR.hx, y: sk.armR.hy}} kind="brick" /> : null} />
        ))}
        <Label x={525} y={1005} t="bucketChain" />
        <Fig k="usMarine" x={720} y={960} f={f} pose={crouchRun(f / 18)} expr="scared" overlay={(sk: any) => <RifleBetween a={{x: sk.armR.hx, y: sk.armR.hy}} b={{x: sk.armL.hx, y: sk.armL.hy}} />} />
        <Label x={720} y={1005} t="crouchRun" />
        <rect x={870} y={900} width={70} height={62} rx={14} fill="#8A8C8E" stroke={C.ink} strokeWidth={4} />
        <Fig k="britSoldier" x={830} y={960} f={f} pose={takeCover(f)} expr="scared" />
        <Label x={860} y={1005} t="takeCover" />
        <Fig k="sovietSoldier" x={1000} y={960} f={f} pose={kneelAim(f)} expr="determined" turn={0.5} overlay={(sk: any) => <RifleAim stock={{x: sk.armR.hx, y: sk.armR.hy}} grip={{x: sk.armL.hx, y: sk.armL.hy}} />} />
        <Label x={1030} y={1005} t="kneelAim" />
        <Fig k="japaneseWoman" x={1170} y={960} f={f} pose={kneelSit(f)} expr="sad" eyesClosed={f > 45} />
        <Label x={1180} y={1005} t="kneelSit (seiza)" />
        <Fig k="montgomery" x={1330} y={960} f={f} pose={binocularsPose(f, Math.min(1, f / 30))} nearArmFront overlayTop={(sk: any) => <Binoculars head={sk.head} r={sk.d.R} t={Math.min(1, f / 30)} />} />
        <Label x={1330} y={1005} t="binoculars" />
        <Hug f={f} x={1520} y={960} adult={castProps('anna')} other={castProps('leo')} />
        <Label x={1520} y={1005} t="Hug comfort" />
        <Hug f={f} x={1760} y={960} kind="embrace" adult={castProps('anna')} other={castProps('tom')} />
        <Label x={1760} y={1005} t="Hug embrace" />
      </svg>
    </AbsoluteFill>
  );
};

/** Sheet 4: crowds (A-08) — rally from behind, VE Day facing, finale mixed. */
export const SheetCrowd: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.wallYellow}}>
      <svg width={1920} height={1080}>
        <rect y={330} width={1920} height={30} fill={C.darkRed} />
        <Crowd f={f} count={40} x0={40} x1={920} yBack={250} yFront={350} pool="germany1930s" view="back" mix={{cheer: 2, stand: 3}} seed={3} />
        <Crowd f={f} count={50} x0={1000} x1={1880} yBack={250} yFront={350} pool="london1945" mix={{cheer: 3, wave: 2, stand: 1}} randomHats seed={5} />
        <rect y={360} width={1920} height={720} fill={C.floor} />
        <Crowd f={f} count={120} x0={30} x1={1890} yBack={640} yFront={1040} pool="finale" view="mixed" mix={{wave: 2, cheer: 1, stand: 3}} seed={9} />
        <NameTag x={300} y={60} text="CROWD: RALLY (BACK)" />
        <GroupTag x={1440} y={60} text="CROWD: VE DAY (FRONT)" />
      </svg>
    </AbsoluteFill>
  );
};

/** Sheet 5: sombre expressions and the Kaiser's pickelhaube in the hand. */
export const SheetExpressions: React.FC = () => {
  const f = useCurrentFrame();
  const ex: Expression[] = ['neutral', 'sad', 'tired', 'solemn', 'grief', 'worried'];
  return (
    <AbsoluteFill style={{background: C.wallYellow}}>
      <svg width={1920} height={1080}>
        <rect y={600} width={1920} height={480} fill={C.floor} />
        {ex.map((e, i) => (
          <g key={e} transform={`translate(${170 + i * 300},200) scale(2.2)`}>
            <Head r={44} f={10} seed={i + 3} {...(i % 2 ? CAST.survivorNoCap.head : CAST.japaneseWoman.head)} expression={e} turn={0.3} />
          </g>
        ))}
        {ex.map((e, i) => <Label key={'c' + e} x={170 + i * 300} y={480} t={e + ' + eyesClosed'} />)}
        {ex.map((e, i) => <Label key={e} x={170 + i * 300} y={340} t={e} />)}
        {ex.map((e, i) => (
          <g key={'e' + e} transform={`translate(${170 + i * 300},420) scale(0.9)`}>
            <Head r={44} f={10} seed={i + 3} {...CAST.medic.head} expression={e} eyesClosed turn={0.3} />
          </g>
        ))}
        <Fig k="kaiser" x={260} y={960} f={f} pose={helmetToChest(f, 0.7)} hatInHand={{rot: -20}} expr="sad" label />
        <Fig k="survivor" x={600} y={960} f={f} pose={sitGround(f)} expr="tired" />
        <Label x={600} y={1005} t="sitGround" />
        <Fig k="politician" x={900} y={960} f={f} pose={seated(f)} expr="neutral" talking />
        <rect x={860} y={906} width={110} height={56} fill={C.brown} stroke={C.ink} strokeWidth={4} />
        <Label x={900} y={1005} t="seated (feet on ground)" />
        <Fig k="germanOfficer" x={1200} y={960} f={f} pose={headBowed(standStiff(f), 0.6)} expr="solemn" />
        <Fig k="japaneseOfficer" x={1400} y={960} f={f} pose={standStiff(f)} expr="solemn" />
        <Fig k="truman" x={1650} y={960} f={f} pose={talkGesture(f)} talking label />
      </svg>
    </AbsoluteFill>
  );
};

export {kneel};
