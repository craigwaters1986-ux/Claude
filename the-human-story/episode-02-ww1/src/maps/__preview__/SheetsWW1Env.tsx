// ep02 (WW1) environment contact sheets: E-01 trench variants a–g + E-08 dominoes; vehicles + E-S1.
import React from 'react';
import {W, H, C} from '../../styles/theme';
import type {Panel} from './Sheet';
import {Trench, TrenchForeground, TRENCH, MUD, WoodenCross, Football} from '../../components/env/Trench';
import {DominoRow, ChalkDominoes} from '../../components/env/Dominoes';
import {PoppyWreath, PoppyPetals, TownWarMemorial} from '../../components/env/Remembrance';
import {TouringCar, CAR_COLORS, CAR_SEATS, EmptyBackSeat, RhomboidTank, TANK_DEPTH, Periscope, TorpedoWake, WaterColumn} from '../../components/VehiclesWW1';
import {HistoryRoom, Sea, Sky, Ground, Hills, Street} from '../../components/Environment';
import {Ship} from '../../components/Vehicles';
import {MistBands} from '../../components/env/Trench';
import {StickFigure} from '../../characters/StickFigure';
import {CAST} from '../../characters/cast';
import {stand, seated, walk} from '../../characters/poses';

const Fig: React.FC<{k: string; x: number; y: number; f: number; pose: never | ReturnType<typeof stand>; dir?: 1 | -1; s?: number}> = ({k, x, y, f, pose, dir, s = 1}) => {
  const c = CAST[k];
  return <StickFigure x={x} y={y} f={f} seed={(x % 97) + 1} scale={s} dir={dir} pose={pose} head={{...c.head}} outfit={c.outfit} />;
};

export const WW1_ENV: Panel[] = [
  {title: 'E-01a day + rain (rats, sump, scale check)', el: (f) => <g><Trench f={f} variant="a" rats={3} /><Fig k="britSoldier1916" x={760} y={TRENCH.firestepY} f={f} pose={stand(f, 1)} /><Fig k="britSoldier1916" x={1420} y={TRENCH.floorY} f={f} pose={stand(f, 2)} dir={-1} /><TrenchForeground f={f} rain={0.6} /></g>},
  {title: 'E-01b winter night (frost, stars, far lanterns)', el: (f) => <g><Trench f={f} variant="b" /><Fig k="britSoldier1914" x={760} y={TRENCH.firestepY} f={f} pose={stand(f, 3)} /></g>},
  {title: 'E-01c dawn mist + smoke (ladders)', el: (f) => <Trench f={f} variant="c" />},
  {title: 'E-01d mud (Passchendaele)', el: (f) => <g><Trench f={f} variant="d" /><Fig k="britSoldier1916" x={1100} y={MUD.trackY} f={f} pose={walk(f / 30)} dir={-1} /></g>},
  {title: 'E-01e over the parapet (frost, truce props)', el: (f) => <g><Trench f={f} variant="e" /><WoodenCross x={300} y={640} s={0.7} /><WoodenCross x={380} y={650} s={0.7} /><Football x={1240} y={760} /></g>},
  {title: 'E-01f cutaway: front / support / reserve', at: 120, el: (f) => <Trench f={f} variant="f" />},
  {title: 'E-01g dugout interior (dust cue 0.4)', el: (f) => <Trench f={f} variant="g" dust={0.4} />},
  {title: 'E-08 domino row (topple 0.45)', el: (f) => <g><HistoryRoom f={f} /><rect x={-50} y={820} width={W + 100} height={60} fill="#8A5A33" stroke={C.ink} strokeWidth={5} /><DominoRow x={260} y={826} labels={['ALLIANCES', 'ARMS RACE', 'NATIONALISM', 'EMPIRES', 'WAR PLANS']} topple={0.45} f={f} /></g>},
  {title: 'E-08 chalk dominoes -> SARAJEVO glow', el: (f) => <HistoryRoom f={f} board={<ChalkDominoes f={f} topple={1} glow={0.8} />} />},
];

export const WW1_VEH: Panel[] = [
  {title: 'V-01 touring car + seated passengers', el: (f) => (
    <g><Sky /><Street base={760} f={f} /><Ground y={760} color="#C9B48A" />
      <TouringCar x={900} y={900} dist={f * 6} f={f} layer="back" />
      <Fig k="franzFerdinand" x={900 + CAR_SEATS.rearLeft.x} y={900 + CAR_SEATS.rearLeft.y + 112} f={f} pose={seated(f)} />
      <TouringCar x={900} y={900} dist={f * 6} f={f} layer="front" />
    </g>)},
  {title: 'V-01 escort colour + turn-in 0.7', el: (f) => (
    <g><Sky /><Ground y={760} color="#C9B48A" /><TouringCar x={520} y={900} dist={f * 6} f={f} color={CAR_COLORS.escort} s={0.8} /><TouringCar x={1400} y={900} dist={f * 3} f={f} turn={0.7} s={0.9} /></g>)},
  {title: 'V-01 stall + empty back seat close-up', el: (f) => <EmptyBackSeat f={f} desat={0.3} />},
  {title: 'V-02 rhomboid tanks near / mid / far in mist', el: (f) => (
    <g><Sky top="#BFC3BE" bottom="#DCDCD2" /><Hills y={600} color="#8C9468" /><Ground y={640} color="#7E8A5A" />
      <RhomboidTank x={1500} y={600} dist={f * 2} f={f} {...TANK_DEPTH.far} />
      <RhomboidTank x={300} y={700} dist={f * 3} f={f} {...TANK_DEPTH.mid} />
      <MistBands f={f} y0={520} y1={760} amount={0.8} />
      <RhomboidTank x={900} y={960} dist={f * 4} f={f} {...TANK_DEPTH.near} />
    </g>)},
  {title: 'V-03 periscope + torpedo wake + water column', el: (f) => (
    <g><Sky top="#5E6A78" bottom="#A9A49A" /><Ship x={1350} y={560} f={f} kind="freighter" s={0.7} /><WaterColumn x={1300} y={585} progress={0.4} s={0.8} /><Sea y={600} f={f} colors={['#4E6470', '#5A7380', '#3E5560']} amp={8} />
      <TorpedoWake x0={520} y0={860} x1={1290} y1={600} progress={0.7} f={f} /><Periscope x={500} y={880} f={f} s={1.2} /></g>)},
  {title: 'E-S1 wreaths + petals at a town memorial', el: (f) => (
    <g><Sky top="#A9AEB2" bottom="#D6D3CA" /><Ground y={880} color="#9A9A8E" /><TownWarMemorial x={960} y={900} s={0.8} />
      <PoppyWreath x={760} y={905} s={0.8} tilt={-6} /><PoppyWreath x={1160} y={905} s={0.8} tilt={5} /><PoppyWreath x={960} y={915} s={0.6} /><PoppyPetals f={f} lift={0.8} /></g>)},
];
void H;
