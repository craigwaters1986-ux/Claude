import React from 'react';
import {GeoMap} from '../GeoMap';
import {StateLayer} from '../StateMap';
import * as X from '../ww1';
import {Layers1914, styles1914} from '../MapsWW1';
const cam = {lon: 4.3, lat: 49.4, zoom: 4.6};
export const Exp: React.FC<{f: number; v: number}> = ({f, v}) => {
  const st = styles1914({base: 'war1914', f});
  const sets: X.State14[][] = [['FRA'], ['FRA', 'GER'], X.ORDER_1914, X.ORDER_1914.filter((s) => s !== 'RUS')];
  return (
    <GeoMap kind="europe" cam={cam} f={f} idSuffix={`-x${v}`} borders={false}
      layers={(ctx) => (v < 4 ? <StateLayer {...ctx} f={f} kind="europe" states={sets[v].map((s) => ({key: s, ops: X.STATES_1914[s], style: st[s]}))} /> : <Layers1914 {...ctx} kind="europe" f={f} styles={st} />)} />
  );
};
