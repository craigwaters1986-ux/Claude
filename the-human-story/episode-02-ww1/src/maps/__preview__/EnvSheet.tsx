import React from 'react';
import {Panel} from './Sheet';
import * as P from '../../components/env/Places';
import {Glider, Parachute, CarrierTop} from '../../components/Vehicles';
import {SombreGrade} from '../../components/Effects';
import {Sky, Ground} from '../../components/Environment';
import {MapEurope1945, MapEastAsia, MapCzech, MapVersailles} from '../EpisodeMaps';

export const ENV: Panel[] = [
  {title: 'B-01 Hall of Mirrors', el: (f) => <P.HallOfMirrors f={f} />},
  {title: 'B-03 Wall St 1929', el: (f) => <P.WallStreet1929 f={f} crash={1} />},
  {title: 'B-04 Reichstag + crack', el: (f) => <P.Reichstag f={f} crack={1} lit={0.4} />},
  {title: 'B-05 Berlin ruins', el: (f) => <P.BerlinRuins f={f} />},
  {title: 'B-06 Bunker ext', el: (f) => <P.Bunker f={f} view="exterior" />},
  {title: 'B-06 Bunker int', el: (f) => <P.Bunker f={f} door={0.5} />},
  {title: 'B-08 Poster wall', el: (f) => <P.PosterWall f={f} shown={5.5} />},
  {title: 'B-11a aircraft line', el: (f) => <P.Factory f={f} doors={0.6} />},
  {title: 'B-11b tank line', el: (f) => <P.Factory f={f} kind="tank" />},
  {title: 'B-11c shipyard', el: (f) => <P.Factory f={f} kind="shipyard" launch={0.5} />},
  {title: 'B-14 Kremlin office', el: (f) => <P.KremlinOffice f={f} />},
  {title: 'B-15 border', el: (f) => <P.BorderCrossing f={f} barrier={0.6} />},
  {title: 'B-21 Dunkirk', el: (f) => <P.Dunkirk f={f} />},
  {title: 'B-22 Paris + flags', el: (f) => <P.ParisBoulevard f={f} flags={1} />},
  {title: 'B-24 Underground', el: (f) => <P.UndergroundShelter f={f} />},
  {title: 'B-28a Pearl Harbor', el: (f) => <P.PearlHarbor f={f} burning={[0, 1, 0, 1, 0]} />},
  {title: 'B-28b Oahu airfield', el: (f) => <P.OahuAirfield f={f} />},
  {title: 'B-31 Stalingrad', el: (f) => <P.Stalingrad f={f} />},
  {title: 'B-33 Normandy night', el: (f) => <P.NormandyNight f={f} />},
  {title: 'B-34 D-Day beach', el: (f) => <P.DDayBeach f={f} sky={0.8} />},
  {title: 'B-36 camp + FX-01', el: (f) => <g><P.CampPerimeter f={f} /><SombreGrade amount={0.8} /></g>},
  {title: 'B-36 barracks', el: (f) => <P.CampPerimeter f={f} view="barracks" />},
  {title: 'B-37 memorial', el: (f) => <P.Memorial f={f} />},
  {title: 'B-42 Hiroshima before', el: (f) => <P.Hiroshima f={f} />},
  {title: 'B-42 after', el: (f) => <P.Hiroshima f={f} state="after" />},
  {title: 'B-43 Nagasaki', el: (f) => <P.Nagasaki f={f} />},
  {title: 'B-44 Missouri', el: (f) => <P.MissouriDeck f={f} />},
  {title: 'B-45 cemetery', el: (f) => <P.Cemetery f={f} />},
  {title: 'V-01/02/05', el: (f) => <g><Sky top="#0E1626" bottom="#2E3F5A" /><Glider x={600} y={300} f={f} /><Parachute x={1400} y={600} f={f} open={1} /><CarrierTop x={960} y={850} f={f} s={0.8} burning={0.7} /></g>},
  {title: 'M-01 Versailles (R-01)', at: 200, el: (f) => <MapVersailles f={f} />},
  {title: 'M-02 Sudetenland (R-01)', el: (f) => <MapCzech f={f} stage={1} />},
  {title: 'M-06 Japan 1941 (R-01)', at: 120, el: (f) => <MapEastAsia f={f} cam={{lon: 115, lat: 30, zoom: 1.2}} cues={{japan1941: 0}} show1941 />},
  {title: 'M-09 Mar 1945', el: (f) => <MapEurope1945 f={f} t={1} />},
];
