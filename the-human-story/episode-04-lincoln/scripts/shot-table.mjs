// Print every shot of the episode (chapter, index, start s, length s/frames, transition) from the scene modules,
// using the current src/timeline/timeline.json. Usage: node scripts/shot-table.mjs [out.json]
// Each S0N component is a plain function returning <Shots start end shots=[...]>, so calling it gives the shot list.
import {build} from 'esbuild';
import {writeFileSync, mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
mkdirSync('output', {recursive: true});
const entry = `
${Array.from({length: 10}, (_, i) => `import {S${String(i + 1).padStart(2, '0')}} from '../src/scenes/S${String(i + 1).padStart(2, '0')}';`).join('\n')}
export const ALL = [${Array.from({length: 10}, (_, i) => `S${String(i + 1).padStart(2, '0')}`).join(', ')}];
`;
writeFileSync('output/shot-table-entry.tsx', entry);
await build({entryPoints: ['output/shot-table-entry.tsx'], bundle: true, platform: 'node', format: 'esm', outfile: 'output/shot-table.bundle.mjs',
  loader: {'.json': 'json', '.png': 'dataurl', '.jpg': 'dataurl', '.svg': 'text', '.ttf': 'dataurl', '.woff2': 'dataurl', '.woff': 'dataurl', '.css': 'empty'},
  external: ['react', 'react-dom', 'remotion', '@remotion/*'], jsx: 'automatic', logLevel: 'error'});
const m = await import(pathToFileURL('output/shot-table.bundle.mjs').href + '?' + Date.now());
const rows = [];
m.ALL.forEach((S, i) => {
  const el = S({});
  const {start, end, shots} = el.props;
  shots.forEach((s, k) => {
    const b = k + 1 < shots.length ? shots[k + 1].at : end;
    rows.push({chapter: i + 1, shot: k + 1, start: Math.round(s.at * 1000) / 1000, dur: Math.round((b - s.at) * 1000) / 1000, frames: Math.round((b - start) * 30) - Math.round((s.at - start) * 30), trans: k === 0 ? 'cut' : s.trans ?? 'fade'});
  });
});
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(rows, null, 1));
else console.table(rows);
