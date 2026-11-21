// Editor B preview entry (stills only; not part of the episode).
// npx remotion render src/scenes/__preview_b__/index.ts StillsB out/%04d.jpeg --sequence --scale=0.5
import {registerRoot} from 'remotion';
import {PreviewRootB} from './Root';

registerRoot(PreviewRootB);
