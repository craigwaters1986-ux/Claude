// Render a set of frames to PNG with one bundle and one browser: node scripts/stills.mjs OUTDIR frame [frame ...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const [out, ...frames] = process.argv.slice(2);
fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/scenes/s09-preview-entry.tsx'), publicDir: path.resolve('public')});
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'swangle'}});
const comp = await selectComposition({serveUrl, id: process.env.COMP || 'Episode', puppeteerInstance: browser});
for (const fr of frames) {
  const f = Number(fr);
  await renderStill({composition: comp, serveUrl, output: path.join(out, `f${String(f).padStart(5, '0')}.png`), frame: f, puppeteerInstance: browser, scale: Number(process.env.SCALE || 0.5)});
  process.stdout.write(f + ' ');
}
await browser.close({silent: true});
console.log('done');
