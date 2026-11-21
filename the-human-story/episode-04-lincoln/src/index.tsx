// Episode 4 (ep04-lincoln) compositions. Phase B: the upgrade test reel. Phase C adds `Episode` (18,000 frames); Phase D the `Thumbnail`.
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {UpgradeTest} from './scenes/UpgradeTest';
import {REEL_FRAMES} from './scenes/reelSolve';
import {Episode} from './Episode';
import {KitTest, KIT_FRAMES} from './scenes/KitTest';
import {TOTAL} from './timeline';
import {Thumbnail} from './scenes/Thumbnail';
const Root = () => (
  <>
    <Composition id="UpgradeTest" component={UpgradeTest} width={1920} height={1080} fps={30} durationInFrames={REEL_FRAMES} defaultProps={{debug: false}} />
    <Composition id="KitTest" component={KitTest} width={1920} height={1080} fps={30} durationInFrames={KIT_FRAMES} defaultProps={{debug: false}} />
    <Composition id="Thumbnail" component={Thumbnail} width={1280} height={720} fps={30} durationInFrames={1} defaultProps={{variant: 'main' as const}} />
    <Composition id="Episode" component={Episode} width={1920} height={1080} fps={30} durationInFrames={TOTAL} />
  </>
);
registerRoot(Root);
