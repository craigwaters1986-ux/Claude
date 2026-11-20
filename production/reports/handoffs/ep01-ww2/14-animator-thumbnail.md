# Handoff — ep01-ww2 — thumbnail (Concept B)

- **From:** animator
- **To:** director (cc: youtube-specialist, quality-control)
- **Date:** 2026-11-16
- **Status:** AWAITING REVIEW (the user chooses the thumbnail; nothing uploaded)

## Deliverables
- `production/thumbnails/ep01-ww2/thumbnail-ep01.png`: 1280×720 PNG, about 127 KB
- `production/thumbnails/ep01-ww2/thumbnail-ep01.jpg`: 1280×720 JPG (ffmpeg -q:v 2), about 151 KB, under the 2 MB limit
- `production/thumbnails/ep01-ww2/thumbnail-ep01-160px.png`: a 160 px wide phone-size check
- `the-human-story/episode-01-ww2/src/scenes/Thumbnail.tsx`: the thumbnail scene, built with the shared StickFigure and cast library
- `the-human-story/episode-01-ww2/src/Root.tsx`: adds `<Still id="Thumbnail" width={1280} height={720}>`. The Episode composition is unchanged.

## Summary
Concept B from `production/exports/ep01-ww2/youtube/thumbnail-brief.md`, for the title "WW2 - From Start to Finish". The frame is split down the middle by an ink line.

- **Left, 1939, muted grey-blue:** a man in a flat cap and coat (`man1`) looks worried as he reads a blank newspaper. The masthead and headline are solid bars, so nothing is legible.
- **Right, 1945, warm cream:** five civilians and a sailor cheer. They use `cheerV` and `waveSide` poses with joy/happy expressions. The plain coloured bunting and confetti carry no flags or symbols, and the frame shows no casualties.
- **Dates:** "1939 → 1945" sits across the middle in white Montserrat 900 at 200 px, with a thick black outline and a hard shadow. The digits are about 23% of the frame height. The arrow is drawn as a shape because the bundled Montserrat subset has no arrow glyph.
- **Channel mark:** a small "THE HUMAN STORY" pill sits at the top left.

`npx tsc --noEmit` passes. Re-render with `npx remotion still src/index.ts Thumbnail <out.png>`.

## Changes to inputs / assumptions
- I used a vertical split, not a diagonal one, so that each half stays clean and readable at small sizes.
- I left out a soldier in the crowd because the Brodie helmet's chin strap read as a scratch across the face at this scale. The only service figure is the sailor.

## Blockers / issues
- [minor] The channel mark cannot be read at 160 px wide. That is expected: it is only a brand cue, and it does not clutter the frame.
- [info] The dates follow the conventional span. The war in Asia began in 1937, and the video covers this (see the brief).

## Requests for other agents
- youtube-specialist: pair this with the chosen title when the publishing pack is finalised.
- quality-control: one visual check.

## Recommended next action
- Director shows the thumbnail to the user for approval, alongside checkpoint 4.
