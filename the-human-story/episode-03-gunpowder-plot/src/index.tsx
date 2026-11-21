import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ParishStreet} from './scenes/ParishStreet';
import {Episode} from './Episode';
import {Thumbnail} from './scenes/Thumbnail';
const Root = () => (
  <>
    <Composition id="Episode" component={Episode} width={1920} height={1080} fps={30} durationInFrames={21600} />
    <Composition id="Thumbnail" component={Thumbnail} width={1280} height={720} fps={30} durationInFrames={1} />
    <Composition id="ParishStreet" component={ParishStreet} width={1920} height={1080} fps={30} durationInFrames={240} />
  </>
);
registerRoot(Root);
