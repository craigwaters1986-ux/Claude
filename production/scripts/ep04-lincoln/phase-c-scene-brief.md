# Phase C scene brief (ep04-lincoln): rules for every chapter build

Read this first, then your chapter rows in `production/storyboards/ep04-lincoln/storyboard.md`.

## What exists
- Engine `the-human-story/episode-04-lincoln/` (Remotion 4, React 18, TypeScript). `src/Episode.tsx` plays `src/scenes/S01.tsx` … `S10.tsx` (one per chapter, each currently a placeholder) inside `<Sequence>`s, then the caption band and the logo. **You own only your `S0N.tsx` files** (plus new files you create, prefixed with your chapter, e.g. `src/scenes/s09-sets.tsx`).
- Locked timing: `src/timeline/timeline.json` (from the narration and aligned captions). Use `T('phrase')` / `TE('phrase')` from `src/timeline` (caption anchors; they throw if a phrase is missing, so a typo fails loudly), `sectionWindow('s0N')`, `beat('s0N', n)` (silent beats; see `production/scripts/ep04-lincoln/edit-plan.md` for what each beat is for). Read the captions in `production/scripts/ep04-lincoln/captions-aligned.srt` to choose anchors. Times are programme seconds; `Shots` takes `start/end` of the section and shot `at` times.
- Episode 3's scenes (`the-human-story/episode-03-gunpowder-plot/src/scenes/S02.tsx` etc.) show the section pattern: `const [S, E] = sectionWindow('s02'); export const S02 = () => <Shots start={S} end={E} shots={[{at: S, el: (f, d) => …}, {at: T('…'), trans: 'whip', el: …}]} />`. Shot elements receive the shot-local frame `f` and length `d`.
- Phase B kit (study `src/scenes/UpgradeTest.tsx` and `src/scenes/reelSolve.ts`, the approved test reel, before writing anything): `kit/Cinema.tsx` (CineCam parallax layers, depth of field, GradeLayer grades incl. `sombre`, Rim, LightPool, GodRays, Grain, Vig, TitlePlate, LightLeak, PassBy, WhipStreaks), `kit/Props.tsx` + `kit/Actions.ts` (grip props, two-hand IK, chopRail, grabCarry, writeAt, shakeHands, doffHat, page turns, expression timeline), `kit/Seats.tsx`, `kit/Bubbles.tsx`, `kit/Documents.tsx` + `timeline/documents.json` (the ONLY source of readable quoted text), `kit/Sets04.tsx`, `kit/Cast.tsx` (Lincoln at six ages: abeBoy, abeYoung, abeLawyer, abe1858, abePres, abe1865; add new cast members you need in your own file if Cast lacks them, or ask the Director), `kit/Maps.tsx`, `kit/Cards.tsx`, `kit/Paper.tsx`, `kit/Places.tsx`, `components/Text.tsx`.
- Shared new kit from the kit build (may land while you work; check `src/kit/` for `USMap.tsx`, `Horse.tsx`, `Flatboat.tsx`, `Flag.tsx`, `Sets04b.tsx` and their header comments): US state maps (1809–1865 views), horse + rideHorse, flatboat + polePushFlatboat, flag + raiseFlag, Capitol with unfinished dome, hall with lectern and benches, gaslit night street. **Do not edit existing kit files** (other agents build in parallel). If you need a kit change, put a local helper in your own file.

## Rules (non-negotiable)
- Style: series stick figures (white round heads, thick ink outlines), flat muted colours, never realistic. Genuine continuous movement in every shot (camera drift or push, figures breathing/blinking, particles, weather): freezedetect n=0.003 d=1.5 must find nothing.
- Shot grammar per the storyboard: open each chapter on an establishing wide, at least 3 shot sizes per chapter, transitions as listed (`iris` for chapter changes, `whip`, `page`, `dip`, match cuts). Each chapter starts with its title plate in its first silent beat (`beat('s0N', 0)`, 3 s, chapter number and title; s01 instead has its title beat at the end: "ABRAHAM LINCOLN"). Use `TitlePlate` from Cinema.
- Text: only facts in the storyboard/script. Readable quotations only from `documents.json` (exact). Date cards, name tags (yellow tag at first appearance for real people; unnamed people are illustrative, never named), labels like "620,000–750,000 dead (est.)" exactly as the storyboard gives. British spelling in labels. Keep the logo zone (x < 170, y < 150) clear; keep picture text and faces above y = 916 while captions are on screen (the caption band sits below).
- Sensitivity: war dead, Willie's death, the assassination are sombre and non-graphic: no wounds, blood, guns, bodies, no leap to the stage. Booth only as a dark silhouette. Enslaved people and Black Americans with dignity and agency, never props, no caricature. Black soldiers in Union blue.
- Contacts: hands on held props within 3 px, feet planted, no sliding; build poses with pure solver functions like `reelSolve.ts` and add your solvers' checks to `scripts/check-contacts.mjs` (re-read it immediately before editing; edit minimally, other agents append too).
- Episode 3 lessons: never nest a `Frame` inside another `Frame`'s `<svg>` (renders black); components that call `useCurrentFrame()` inside a section get section-local frames, so pass `f` explicitly; arms raised forward-up, not straight up; size tags from text length.

## How to check your work
```bash
cd /home/user/Claude/the-human-story/episode-04-lincoln
export REMOTION_BROWSER=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/*/)chrome-headless-shell
npx tsc --noEmit
node scripts/stills.mjs /tmp/sNN <frame> <frame> …      # programme frames (s × 30); 0.5 scale PNGs; look at them with the Read tool
node scripts/check-contacts.mjs
```
Look at stills from every shot (at least 2 per shot, including the first and last 10 frames) before you finish; fix overlaps, text collisions, black frames, clipped figures. Optionally render a low-res check of your chapter: `npx remotion render src/index.tsx Episode /tmp/sNN.mp4 --frames=A-B --scale=0.33 --concurrency=2 --muted` and run `ffmpeg -i /tmp/sNN.mp4 -vf freezedetect=n=0.003:d=1.5 -f null -`.
Do not commit or push. Report: shots built (number, anchor, what is on screen), any storyboard item you could not do and why, check results.
