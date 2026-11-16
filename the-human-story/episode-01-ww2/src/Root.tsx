import React from 'react';
import {Composition} from 'remotion';
import {Episode, EPISODE_FRAMES} from './scenes/Episode';
import {TestLineup} from './scenes/TestLineup';
import {loadFonts} from './components/Fonts';

loadFonts();

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Episode" component={Episode} durationInFrames={EPISODE_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="TestLineup" component={TestLineup} durationInFrames={90} fps={30} width={1920} height={1080} />
  </>
);
