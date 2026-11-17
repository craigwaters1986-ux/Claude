# Handoff — ep02-ww1 — 09 environment designer (Phase C: sets, maps, vehicles)

- **From:** environment-designer
- **To:** director (cc: video-editor, animator, quality-control)
- **Date:** 2026-11-17
- **Status:** AWAITING REVIEW

## Deliverables
- `the-human-story/episode-02-ww1/src/maps/MapsWW1.tsx`: **M-01** `MapEurope1914`, **M-02** `MapWesternFront` + `WesternFrontWallMap`, **M-03** `MapEasternFront`, **M-04** `MapGallipoli` (with inset), **M-05** `MapEurope1919` (crack, fade and morph from M-01), camera presets `CAM_1914`, `CAM_WF`, `CAM_EF`, `CAM_GP`, `CAM_1919`, and `SafeLabel` (drops labels in the logo zone).
- `the-human-story/episode-02-ww1/src/maps/ww1.ts`: 1914 and 1919–23 state definitions (ordered add/subtract ops), hand-plotted 1914 border lines, Western Front lines (1915, March 1918, April 1918, 11 Nov 1918), Somme creep, Tannenberg, Brest-Litovsk, Gallipoli places, palette.
- `the-human-story/episode-02-ww1/src/maps/StateMap.tsx`: clip-path state renderer (`StateLayer`), border mesh, sampling and colour helpers.
- `the-human-story/episode-02-ww1/src/maps/IconsWW1.tsx`: train, ship, envelope, stopwatch, 48-hour dial, flip calendar, tick list, marcher, plain red flag, crown, book card.
- `the-human-story/episode-02-ww1/src/maps/data/gallipoli-land-10m.json`: Natural Earth 1:10m coast clipped to the Dardanelles.
- `the-human-story/episode-02-ww1/src/components/env/Trench.tsx`: **E-01** `Trench` (variants a–g), `TrenchForeground`, layout constants `TRENCH`, `MUD`, `NML`, `DUGOUT`, `CUTAWAY`, and props (`Rat`, `Lantern`, `TrenchLadder`, `BoxPeriscope`, `WireCoils`, `Sandbags`, `MistBands`, `HorizonFlashes`, `DustFall`, `WoodenCross`, `Football`).
- `the-human-story/episode-02-ww1/src/components/env/Dominoes.tsx`: **E-08** `DominoRow` (blocks) and `ChalkDominoes` (board version, SARAJEVO glow).
- `the-human-story/episode-02-ww1/src/components/VehiclesWW1.tsx`: **V-01** `TouringCar` (+ `CAR_COLORS.escort`, `CAR_SEATS`, `EmptyBackSeat`), **V-02** `RhomboidTank` (+ `TANK_DEPTH`), **V-03** `Periscope`, `TorpedoWake`, `WaterColumn`.
- `the-human-story/episode-02-ww1/src/components/env/Remembrance.tsx`: **E-S1** `PoppyWreath`, `PoppyPetals`, plus `TownWarMemorial` (stone cross, "1914–1918").
- Small, backward-compatible engine edits: `GeoMap` gains an optional `layers` slot (projection-space fills under the coastline); `WallMap` passes `layers`/`borders` through; `geo.ts` adds the `gallipoli` projection and exports `POLAND_WEST_CHAIN`.
- Preview sheets: `src/maps/__preview__/SheetsWW1.tsx`, `SheetsWW1Env.tsx` (registered in the preview root `src/maps/__preview__/Root.tsx`; the episode `Root.tsx` is untouched).
- Stills: `production/environments/ep02-ww1/maps-sheet-A.png`, `maps-sheet-B.png`, `maps-sheet-C.png`, `sheet-Env.png`, `sheet-Vehicles.png`.
- Notes: `production/environments/ep02-ww1/map-notes.md` (APIs, keyable values, shots, sources and simplifications).

## Summary
All section-B MUST items (E-01 a–g, E-08 both versions, M-01 to M-05 with the M-02 wall-map inset, V-01 with the escort colour and the empty-back-seat close-up, V-02, V-03) and the approved SHOULD E-S1 are built. Every animation is a pure function of `f` plus progress props, so the editor keys it from beats. The historical maps reuse Natural Earth modern borders wherever they match the 1914 or 1923 line and add only the changed lines by hand. Each state is an independent opaque shape (clip paths), so states fade, hatch and pulse without seams. Approximate borders carry "approx." or "BORDERS APPROXIMATE", as the research asks. The ep01 rules hold: Danzig Free City, Memel 1923, the Saar and the Rhineland not drawn as lost. Labels are ≥ 36 px and are dropped automatically inside the logo zone. Flags are plain, with no emblem.

## Changes to inputs / assumptions
- S11-05: the existing `Memorial` is the ep01 candle wall, so I added a simple `TownWarMemorial` (stone cross) for the wreaths. No new asset request was needed.
- The Western Front line plots at 660 km once smoothed. On-screen text must say "about 700 km" (research 4.7), never the plotted figure.
- Brest-Litovsk: Kars/Ardahan/Batum are not drawn. Eupen-Malmedy, Fiume and Zadar are not drawn either (too small at this scale). All are recorded in map-notes §2.
- The touring car's pennants are plain yellow with a black band (no emblem).

## Blockers / issues
- [minor] Rendering: SVG masks failed in headless Chrome once a frame held about a dozen large masks, so I replaced them with clip paths. M-05 still uses one mask per empire, only while that empire is cracking. Its sheet panel rendered correctly.
- [minor] Two maps of the **same kind with the same camera** on screen at once need different `idSuffix` values. Crossfades between different cameras are safe.
- [minor] Map frames were not benchmarked (lean mode). Expect them to be slower than character shots.
- [info] Stills only. No motion test renders (lean mode).

## Requests for other agents
- video-editor: compose shots from map-notes §3. Put the S01-02 street → map MATCH and the S04-04 `trenchZoom` → E-01 MATCH inside one shot. Use `TrenchForeground` after the figures for the S05-02 knee-deep water. Draw seated figures between `TouringCar layer="back"` and `layer="front"` at `CAR_SEATS`.
- animator: the trench layout is `TRENCH.firestepY` 760 (looking over) and `TRENCH.floorY` 878 (in cover) at figure scale 1. Seated car passengers use the `seated` pose at `CAR_SEATS`.
- quality-control: check the map borders against map-notes §2 and the sheet stills.

## Recommended next action
- Director: route to the video editor for scene assembly (S01–S11). Run a QC pass on the five sheet stills and map-notes.
