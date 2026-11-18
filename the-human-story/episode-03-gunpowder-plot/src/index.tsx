import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {ParishStreet} from './scenes/ParishStreet';
const Root=()=> <Composition id="ParishStreet" component={ParishStreet} width={1920} height={1080} fps={30} durationInFrames={240}/>;
registerRoot(Root);
