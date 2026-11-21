import React from 'react';
import {Composition, Still} from 'remotion';
import {Episode, EPISODE_FRAMES} from './scenes/Episode';
import {TestLineup} from './scenes/TestLineup';
import {Thumbnail} from './scenes/Thumbnail';
import {ThumbnailWW2} from './scenes/ThumbnailWW2';
import {BrandLogoA, BrandLogoB, BrandBanner} from './scenes/Branding';
import {loadFonts} from './components/Fonts';

loadFonts();

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Episode" component={Episode} durationInFrames={EPISODE_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="TestLineup" component={TestLineup} durationInFrames={90} fps={30} width={1920} height={1080} />
    <Still id="Thumbnail" component={Thumbnail} width={1280} height={720} />
    <Still id="ThumbnailWW2" component={ThumbnailWW2} width={1280} height={720} />
    <Still id="BrandLogoA" component={BrandLogoA} width={800} height={800} />
    <Still id="BrandLogoB" component={BrandLogoB} width={800} height={800} />
    <Still id="BrandBanner" component={BrandBanner} width={2560} height={1440} />
  </>
);
