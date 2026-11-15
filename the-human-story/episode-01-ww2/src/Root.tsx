import React from 'react';
import {Composition} from 'remotion';
import {TestLineup} from './scenes/TestLineup';
import {loadFonts} from './components/Fonts';

loadFonts();

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TestLineup" component={TestLineup} durationInFrames={90} fps={30} width={1920} height={1080} />
  </>
);
