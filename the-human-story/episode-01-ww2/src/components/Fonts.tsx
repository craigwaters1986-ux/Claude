import {continueRender, delayRender, staticFile} from 'remotion';

// Load bundled fonts once (no network access needed at render time).
const FONTS: [string, string, string, string][] = [
  ['Montserrat', 'montserrat-latin-500-normal.woff2', '500', 'normal'],
  ['Montserrat', 'montserrat-latin-700-normal.woff2', '700', 'normal'],
  ['Montserrat', 'montserrat-latin-800-normal.woff2', '800', 'normal'],
  ['Montserrat', 'montserrat-latin-900-normal.woff2', '900', 'normal'],
  ['Montserrat', 'montserrat-latin-600-italic.woff2', '600', 'italic'],
  ['Playfair Display', 'playfair-display-latin-700-normal.woff2', '700', 'normal'],
  ['Playfair Display', 'playfair-display-latin-900-normal.woff2', '900', 'normal'],
];

let loaded = false;
export function loadFonts() {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const handle = delayRender('fonts');
  Promise.all(
    FONTS.map(([family, file, weight, style]) => {
      const face = new FontFace(family, `url(${staticFile('fonts/' + file)})`, {weight, style});
      return face.load().then((f) => (document.fonts as unknown as {add: (x: FontFace) => void}).add(f));
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
}
