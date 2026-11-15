import React from 'react';
import {Composition} from 'remotion';
import {TestLineup} from './scenes/TestLineup';
import {Preview} from './scenes/Preview';
import {loadFonts} from './components/Fonts';

loadFonts();

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Preview" component={Preview} durationInFrames={900} fps={30} width={1920} height={1080} />
    <Composition id="TestLineup" component={TestLineup} durationInFrames={90} fps={30} width={1920} height={1080} />
  </>
);
