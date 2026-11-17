import React from 'react';
import {Composition} from 'remotion';
import {loadFonts} from '../../components/Fonts';
import {Sheet} from './Sheet';
import {MAPS_A, MAPS_B, MAPS_C, MAPS_D} from './MapSheets';
import {ENV} from './EnvSheet';
import {Sheet as SheetC, Full} from './Sheet';
import {MapEurope1945} from '../EpisodeMaps';
import {BigSheet, WW1_MAPS_A, WW1_MAPS_B, WW1_MAPS_C} from './SheetsWW1';
import {WW1_ENV, WW1_VEH} from './SheetsWW1Env';

loadFonts();

type Panels = React.ComponentProps<typeof Sheet>['panels'];
/** Registers sheets of 4 panels: <id>1, <id>2, ... */
const sheet = (id: string, panels: Panels) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < panels.length; i += 4) {
    const chunk = panels.slice(i, i + 4);
    const cid = `${id}${i / 4 + 1}`;
    out.push(<Composition key={cid} id={cid} component={() => <Sheet panels={chunk} cols={2} />} durationInFrames={600} fps={30} width={1920} height={1080} />);
  }
  return out;
};

export const PreviewRoot: React.FC = () => (
  <>
    {sheet('MapsA', MAPS_A)}
    {sheet('MapsB', MAPS_B)}
    {sheet('MapsC', MAPS_C)}
    {sheet('MapsD', MAPS_D)}
    <Composition id="WW1MapsA" component={() => <BigSheet panels={WW1_MAPS_A} />} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="WW1MapsB" component={() => <BigSheet panels={WW1_MAPS_B} />} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="WW1MapsC" component={() => <BigSheet panels={WW1_MAPS_C} />} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="WW1Env" component={() => <BigSheet panels={WW1_ENV} />} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="WW1Vehicles" component={() => <BigSheet panels={WW1_VEH} />} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="EnvAll" component={() => <SheetC panels={ENV} cols={6} />} durationInFrames={600} fps={30} width={1920} height={1080} />
    <Composition id="BenchEurope1945" component={() => <Full el={(f) => <MapEurope1945 f={f} t={f / 30} cues={{arrows: 0}} />} />} durationInFrames={90} fps={30} width={1920} height={1080} />
  </>
);
