# Handoff: ep01-ww2, researcher map sources (R-01)

- **From:** researcher
- **To:** director (cc: environment-designer, storyboard, quality-control)
- **Date:** 2026-11-15
- **Status:** COMPLETED

## Deliverables
- `production/research/ep01-ww2/map-sources.md`: sourced map data for M-01 (Versailles), M-02 (Czechoslovakia), M-03 (Nazi–Soviet line), M-06 (Japan in 1941), M-08 (D-Day) and M-12 (cities). For each it gives facts, [lon, lat] rings and points, confidence, simplification guidance, a review of the `geo.ts` polygons, and the full source list.

## Summary
All four R-01 items are sourced and give the environment designer geographically usable data. Every corrected ring was point-tested against reference towns of known allegiance. **Japan 1941:** the territory list is verified. Use the Natural Earth shapes for Korea, Taiwan and Indochina, and hand rings for Manchukuo, occupied China, Hainan, Guangzhou and Karafuto. Occupied China must be hatched and labelled approximate ("points and lines"), and Indochina shown lighter ("troops stationed"). **D-Day:** verified; the beach centres and drop zones are given and fit `PROJ.normandy`. **Versailles:** the list is verified; Memel went to Lithuania only in 1923, and the Saar was not lost. **Sudetenland:** "a band along the border" is fair if the band is uneven. A rump ring is provided, and no area figure should go on screen.

## Changes to inputs / assumptions
- None to the storyboard or the engine; I did not edit them. The recommended `geo.ts` replacements are written out in map-sources.md §5 for the environment designer to apply.

## Blockers / issues
- [MAJOR, S04-03] `MR_LINE` is the wrong line for the August 1939 secret protocol, which ran along the Narew, Vistula and San, through Warsaw. Even read as the September 1939 line, it gives Białystok and Łomża to Germany. Either use `MR_LINE_AUG1939` from §5 or relabel the line as the 28 Sept 1939 partition line. Needs the storyboard and environment designer.
- [MAJOR, S02-04] `LOST_TO_POLAND` includes Danzig (Free City) and the Marienwerder/Marienburg area, which stayed German. Use `LOST_TO_POLAND_FIX` and `DANZIG_FREE_CITY`.
- [MODERATE] `POLAND_1939` (includes Danzig and Gleiwitz), `EAST_PRUSSIA` (missing the Marienwerder area), `RHINELAND` (missing the Baden strip and the area around Frankfurt and Heidelberg), `ALSACE_LORRAINE` (Nancy, Lunéville and Saint-Dié fall inside) and `GERMANY_1937` (Gleiwitz, Beuthen, Lębork and Bytów fall outside). Replacement rings are in §5.
- [MINOR] Unverified in this pass: the Sudetenland area figure (do not use it), the Fuzhou withdrawal (leave Fuzhou unshaded) and the exact Suwałki/Augustów split.

## Requests for other agents
- environment-designer: build M-01, M-02, M-03, M-06, M-08 and M-12 from map-sources.md, and apply the §5 fixes to `geo.ts` (keep the "APPROXIMATE" labels where §1.3, §3.3 and §4.3 require them). Note that `PROJ.eastAsia` does not reach Saigon or the mandate islands at zoom 1.
- storyboard: S04-03 needs to choose between the August line and a "28 SEPT 1939" label. In S03-10, do not label Slovakia "neutral" (it was a German client state). In S02-04, Memel should fade to neutral or carry "TO LITHUANIA, 1923", and the Saar must not be shown as lost.
- quality-control: check the rendered maps against the town tests listed with each ring.

## Recommended next action
- Director: route the two MAJOR map issues (S04-03, S02-04) to the storyboard and environment designer, to be resolved with the user's storyboard review. Then the environment designer can start M-08 and M-12, which have no open issues.
