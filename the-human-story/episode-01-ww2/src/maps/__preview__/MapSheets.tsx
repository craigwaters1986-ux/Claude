import React from 'react';
import {Panel} from './Sheet';
import {MapVersailles, MapCzech, MapSpheres1939, Map1940, MapBarbarossa, MapStalingrad, MapBagration, MapEurope1945, MapEastAsia, MapMidway, MapIslandHopping, MapNormandy, Europe1944Content} from '../EpisodeMaps';
import {CarrierTally, Gauge, WallMap, GlobeHotspot, GlobeCrack, HOTSPOTS, COLD_WAR_HIGHLIGHTS, ParachuteIcon, CarrierIcon} from '../MapKit';
import {Globe} from '../GeoMap';
import {W, H, C} from '../../styles/theme';

export const MAPS_A: Panel[] = [
  {title: 'M-01 S02-04 Versailles (PLACEHOLDER)', at: 200, el: (f) => <MapVersailles f={f} />},
  {title: 'M-02 S03-10 Czech stage 1', el: (f) => <MapCzech f={f} stage={1} />},
  {title: 'M-02 Czech stage 2 (Mar 1939)', el: (f) => <MapCzech f={f} stage={2} />},
  {title: 'M-03 S04-03 spheres', at: 200, el: (f) => <MapSpheres1939 f={f} />},
  {title: 'M-04 S05-02 Norway/Denmark', at: 100, el: (f) => <Map1940 f={f} />},
  {title: 'M-04 S05-03 sickle + pocket', at: 330, el: (f) => <Map1940 f={f} />},
];
export const MAPS_B: Panel[] = [
  {title: 'M-05 S06-02 Barbarossa', at: 200, el: (f) => <MapBarbarossa f={f} cues={{counter: 170}} />},
  {title: 'M-05 S07-05 Stalingrad', at: 150, el: (f) => <MapStalingrad f={f} />},
  {title: 'M-05 S08-08 Bagration', at: 100, el: (f) => <MapBagration f={f} />},
  {title: 'M-05 Bagration after', at: 220, el: (f) => <MapBagration f={f} />},
  {title: 'M-09 S08-09 Dec 1944', el: (f) => <MapEurope1945 f={f} t={0} />},
  {title: 'M-09 S09-01 Apr 1945 + arrows', at: 100, el: (f) => <MapEurope1945 f={f} t={2} cues={{arrows: 10}} />},
];
export const MAPS_C: Panel[] = [
  {title: 'M-06 S04-09 Manchuria + China 1937', at: 120, el: (f) => <MapEastAsia f={f} cues={{manchuria: 0, china: 30}} />},
  {title: 'M-06 S06-05 1941 (PLACEHOLDER)', at: 120, el: (f) => <MapEastAsia f={f} cues={{manchuria: 0, japan1941: 0}} show1941 />},
  {title: 'M-06 S10-06 Soviet Aug 1945', at: 120, el: (f) => <MapEastAsia f={f} cam={{lon: 125, lat: 45, zoom: 1.5}} cues={{manchuria: 0, soviet45: 10}} />},
  {title: 'M-07 S07-02 Midway', at: 160, el: (f) => <MapMidway f={f} />},
  {title: 'M-07 S10-01 island hopping', at: 200, el: (f) => <MapIslandHopping f={f} />},
  {title: 'M-08 S08-04 Normandy (PENDING)', at: 140, el: (f) => <MapNormandy f={f} />},
];
export const MAPS_D: Panel[] = [
  {title: 'M-10 tally + gauges + icons', at: 60, el: (f) => (
    <g>
      <rect width={W} height={H} fill="#9DBCC4" />
      <CarrierTally x={300} y={200} struck={2.6} f={f} />
      <Gauge x={400} y={620} value={0.2} label="MEN" />
      <Gauge x={800} y={620} value={0.1} label="FUEL" />
      <Gauge x={1200} y={620} value={0.35 + 0.05 * Math.sin(f / 5)} label="TIME" />
      <ParachuteIcon x={1550} y={600} s={2} f={f} />
      <CarrierIcon x={1550} y={300} side="us" s={2} />
    </g>
  )},
  {title: 'M-11 S06-10 globe hotspots', at: 80, el: (f) => (
    <g>
      <rect width={W} height={H} fill={C.deepNavy} />
      <Globe f={f} lon={60} lat={25} r={420}>
        {({proj}) => <g>{Object.entries(HOTSPOTS).map(([k, v], i) => <GlobeHotspot key={k} proj={proj} at={v} f={f} delay={i * 10} label={k.toUpperCase()} />)}</g>}
      </Globe>
    </g>
  )},
  {title: 'M-11 S11-02 US/USSR + crack', at: 80, el: (f) => (
    <g>
      <rect width={W} height={H} fill={C.deepNavy} />
      <Globe f={f} lon={-20} lat={45} r={420} highlights={COLD_WAR_HIGHLIGHTS()}>
        {({path}) => <GlobeCrack path={path} reveal={1} />}
      </Globe>
    </g>
  )},
  {title: 'M-09 S08-01 wall map (1944)', el: (f) => (
    <g>
      <rect width={W} height={H} fill="#7A6A55" />
      <WallMap x={360} y={160} w={1200} kind="europe" cam={{lon: 14, lat: 49, zoom: 1.5}} f={f} id="hq" highlights={[{name: 'Germany', fill: C.axis, opacity: 0.8}, {name: 'France', fill: C.axis, opacity: 0.5}]}>
        {({toScreen}) => <Europe1944Content toScreen={toScreen} f={f} />}
      </WallMap>
    </g>
  )},
];
