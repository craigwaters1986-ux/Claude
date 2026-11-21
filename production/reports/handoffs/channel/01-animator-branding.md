# Handoff — channel — 01-animator-branding

- **From:** animator
- **To:** director (cc: youtube-specialist, quality-control)
- **Date:** 2026-11-16
- **Status:** AWAITING REVIEW (the user picks a logo; nothing has been uploaded)

## Deliverables
- `production/branding/logo-a.png` (800×800): the Guide's spiky-haired head and stick shoulders on the yellow "history room" colour, with an ink ring.
- `production/branding/logo-b.png` (800×800): a "clock of history". The same head sits in the middle of a chalkboard-green disc, and the 12 hour marks are period hats (laurel, hood, tricorn, top hat, bonnet, flat cap, fedora, headscarf, baseball cap, beret, nurse's cap, sailor cap).
- `production/branding/banner.png` (2560×1440, about 0.34 MB): "THE HUMAN STORY" and "History is made by people." over a procession walking left to right. It runs from Rome and the Middle Ages through the 18th century, the Victorians, the early 20th century and the 1940s to today, with a skyline that changes in the same order: pyramids, aqueduct, castle, factory, modern towers.
- Check images: `logo-a-preview-48.png`, `logo-a-preview-98.png`, `logo-b-preview-48.png` and `logo-b-preview-98.png` (cropped to a circle), plus `banner-safe-area.png` (the 1546×423 crop that phones show).
- Code: `the-human-story/episode-01-ww2/src/scenes/Branding.tsx` (new); Stills `BrandLogoA`, `BrandLogoB` and `BrandBanner` added to `src/Root.tsx` (Episode and Thumbnail unchanged).
- Library additions, reusable for Rome and later episodes:
  - `Head.tsx`: hats `laurel`, `hood`, `tricorn`, `bonnet`, `baseballCap`; expression `curious`.
  - `StickFigure.tsx`: outfits `toga` (sash in `accent`), `robe` (rope belt), `gown` (fitted waist, long skirt), `hoodie`.

Re-render with: `npx remotion still src/index.ts BrandBanner ../../production/branding/banner.png --image-format=png`

## Summary
Both logos rely on one idea, the big white head, so they still read at 48 px. Logo A is the simplest and boldest. Logo B adds a sense of time: at small sizes the hats become clock ticks. In the banner, all text sits inside the safe area. The procession and skyline span the full desktop band (y 508–931). The sky, sun and lower ground outside that band are decoration for TV only. The banner has no WW2-specific, extremist or weapon imagery.

## Changes to inputs / assumptions
- These additions are new and existing presets are unchanged. `npx tsc --noEmit` passes.

## Blockers / issues
- [minor] On phones the tagline renders at about 14 px (cream with an ink outline on tan). It is readable, but it is the smallest element.

## Requests for other agents
- youtube-specialist: once the user has chosen, add the files to the channel checklist. The user uploads them manually.

## Recommended next action
- The user chooses logo A or B and approves the banner (brand style sign-off).
