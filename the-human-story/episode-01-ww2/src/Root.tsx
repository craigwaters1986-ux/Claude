import React from 'react';
import {Composition, Still} from 'remotion';
import {Episode, EPISODE_FRAMES} from './scenes/Episode';
import {TestLineup} from './scenes/TestLineup';
import {Thumbnail} from './scenes/Thumbnail';
import {loadFonts} from './components/Fonts';

loadFonts();

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Episode" component={Episode} durationInFrames={EPISODE_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="TestLineup" component={TestLineup} durationInFrames={90} fps={30} width={1920} height={1080} />
    <Still id="Thumbnail" component={Thumbnail} width={1280} height={720} />
  </>
);
