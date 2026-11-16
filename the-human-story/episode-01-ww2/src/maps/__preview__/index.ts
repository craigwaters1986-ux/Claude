// Environment-designer preview entry (not part of the episode).  Render with:
//   npx remotion still src/maps/__preview__/index.ts <Id> out.png --scale=0.5
import {registerRoot} from 'remotion';
import {PreviewRoot} from './Root';
registerRoot(PreviewRoot);
