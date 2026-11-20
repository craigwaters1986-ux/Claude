// Episode 4 (ep04-lincoln) compositions. Phase B: the upgrade test reel. Phase C adds `Episode` (18,000 frames).
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {UpgradeTest} from './scenes/UpgradeTest';
import {REEL_FRAMES} from './scenes/reelSolve';
import {Episode} from './Episode';
import {TOTAL} from './timeline';
const Root = () => (
  <>
    <Composition id="UpgradeTest" component={UpgradeTest} width={1920} height={1080} fps={30} durationInFrames={REEL_FRAMES} defaultProps={{debug: false}} />
    <Composition id="Episode" component={Episode} width={1920} height={1080} fps={30} durationInFrames={TOTAL} />
  </>
);
registerRoot(Root);
