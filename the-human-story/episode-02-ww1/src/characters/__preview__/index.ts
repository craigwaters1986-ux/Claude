// Stand-alone preview entry for the character library (animator verification only).
// npx remotion still src/characters/__preview__/index.ts SheetPoses out.png --frame=60
import {registerRoot} from 'remotion';
import {PreviewRoot} from './PreviewRoot';

registerRoot(PreviewRoot);
