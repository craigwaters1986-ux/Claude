# Handoff — ep01-ww2 — environments

- **From:** environment-designer
- **To:** director (cc: video-editor, quality-control, researcher)
- **Date:** 2026-11-15
- **Status:** AWAITING REVIEW (all 35 MUST items done; R-01 corrections applied; work stopped at the Director's token-saving instruction)

## Deliverables
- `the-human-story/episode-01-ww2/src/components/env/Places.tsx`: 22 MUST location backgrounds, plus `DistantFigures` and `MoscowSkyline`
- `the-human-story/episode-01-ww2/src/components/env/Obstacles.tsx`: `Hedgehog`, `Stake` (V-03)
- `the-human-story/episode-01-ww2/src/components/Vehicles.tsx`: `Glider`, `Parachute`, `CarrierTop`; new Plane kinds and props; Tank `variant="t34"`
- `the-human-story/episode-01-ww2/src/components/Effects.tsx`: `SombreGrade`, `sombreFrame` (FX-01)
- `the-human-story/episode-01-ww2/src/maps/geo.ts`: R-01-corrected regions, two MR lines, `eastFront` projection, 1:10m Normandy coast, new cities
- `the-human-story/episode-01-ww2/src/maps/history.ts`, `versailles.ts`, `MapKit.tsx`, `EpisodeMaps.tsx`, `data/normandy-land-10m.json`
- `the-human-story/episode-01-ww2/src/maps/GeoMap.tsx`: clip-path fix, `hatch` highlights, `idSuffix`/`seaLines` props
- Preview entry: `src/maps/__preview__/` (not part of the episode)
- Previews: `production/environments/ep01-ww2/env-all.png` (final sheet: all MUST backgrounds, vehicles, R-01 maps), plus the earlier `MapsA1/A2/B1/B2/C1/C2/D1.png`. Note: the A–D sheets predate the R-01 fixes.
- `production/environments/ep01-ww2/map-notes.md`: sources, the R-01 changes and the designer-plotted items

## Request status
| ID | Status | Notes |
|---|---|---|
| M-01 | done | `MapVersailles` (R-01 rings; Memel/Hultschin as dots; Saar not lost; East Upper Silesia optional) |
| M-02 | done | `MapCzech stage 0/1/2`, `czechHighlights` (R-01 rump; "SUDETENLAND (APPROX.)") |
| M-03 | done | `MapSpheres1939 line="aug"` (S04-03) / `line="sept"` (partition shot, labelled 28 SEPT 1939) |
| M-04 | done | `Map1940` (should) |
| M-05 | done | `MapBarbarossa`, `MapStalingrad`, `MapBagration` (`eastFront` projection) |
| M-06 | done | `MapEastAsia` cues `manchuria / china / japan1941 (+show1941) / soviet45`; R-01 Japan 1941 |
| M-07 | done | `MapMidway`, `MapIslandHopping` |
| M-08 | done | `MapNormandy` (R-01 coordinates, legend, Pegasus Bridge) |
| M-09 | done | `MapEurope1945 t=0..2` (shrinking fill + fronts + arrows); wall-map content `Europe1944Content` |
| M-10 | done | `CarrierIcon`, `CarrierTally`, `ParachuteIcon`, `Gauge` |
| M-11 | done | `GlobeHotspot` + `HOTSPOTS`, `GlobeCrack`, `COLD_WAR_HIGHLIGHTS` |
| M-12 | done | in `CITY` |
| B-01, 03, 04, 05, 06, 08, 11, 14, 15, 21, 22, 24, 28, 31, 33, 34, 36, 37, 42, 43, 44, 45 | done | all MUST backgrounds |
| B-32 / B-12 | partial | `WallMap` + `Europe1944Content` / `MapCzech` give the wall maps; no room set yet |
| B-02, 07, 09, 10, 13, 16–20, 23, 25–27, 29, 30, 35, 38–41, 46–48 | pending | should/could; most can be composed from existing parts |
| V-01, V-02, V-03 | done | `Glider`, `Parachute`, `Hedgehog`/`Stake` |
| V-04, V-05, V-06, V-08 | done | Plane `dauntless` + `brakes`; `CarrierTop`; Tank `variant="t34"`; Plane `airliner` + `door` |
| V-15, V-16 | done | Plane `kate`; Plane `p40` with `prop={false} gear` |
| V-07, 09, 10, 11, 12, 13, 14, 17 | pending | |
| FX-01 | done | `SombreGrade` |
| FX-04 | partial | `DDayBeach sky=0..2` has its own day→dusk→night sky |
| FX-02, FX-03, FX-05 | pending | for now use `ScreenFlash` (with a long `dur`) for the Hiroshima flash |

Counts: MUST 35/35. SHOULD 7/36 done (M-04, M-10, M-11, V-04, V-05, V-06, V-08), plus 3 partial. COULD 2/11.

## API for the video-editor (all take the shot-local frame `f`)
- **Map shots** (`src/maps/EpisodeMaps.tsx`). Each takes `f`, an optional `cues` object (shot-local frames, snap these to beats) and an optional `cam`:
  - `MapVersailles {cues: start, stagger, globe, colonies; inset; upperSilesia}`
  - `MapCzech {stage 0..2; cam; labels; prague}`
  - `MapSpheres1939 {cues: spheres, line, labels; line: 'aug' | 'sept'}`
  - `Map1940 {cues: north, low, sickle, pocket}`
  - `MapBarbarossa {cues: front, arrows, bracket, counter (-1 = off)}`
  - `MapStalingrad {cues: pincers, pocket}`
  - `MapBagration {cues: front, arrows, after}`
  - `MapEurope1945 {t 0..2 (Dec 44 → Mar 45 → Apr 45); cues: arrows; italy; label}`
  - `MapEastAsia {cues: manchuria, china, japan1941, soviet45; show1941}`
  - `MapMidway {cues: carriers, strike, hits}`
  - `MapIslandHopping {cues: route, dur}`
  - `MapNormandy {cues: drops, beaches, arrows}`
- **Map overlays and icons** (`MapKit.tsx`): `FrontLine`, `LineBracket`, `WallMap {x, y, w, kind, cam, f, id, highlights, children}`, `GlobeHotspot`, `GlobeCrack`, `CarrierTally {struck 0..4}`, `Gauge {value, label}`, `ParachuteIcon`, `CarrierIcon`.
- **GeoMap**: new props `idSuffix` and `seaLines`; highlights accept `hatch: true`.
- **Backgrounds** (`components/env/Places.tsx`):
  - `HallOfMirrors`
  - `WallStreet1929 {crash}`
  - `Reichstag {lit, crack, street, base}`
  - `BerlinRuins`
  - `Bunker {view: 'exterior' | 'interior', door}`
  - `PosterWall {shown, n}`: abstract posters, no text or faces; add the "NAZI PROPAGANDA" stamp in Text
  - `Factory {kind: 'aircraft' | 'tank' | 'shipyard', doors, launch, speed}`: grey, no insignia
  - `KremlinOffice`; `MoscowSkyline {base, x0, s, color}` for horizons (S06-04)
  - `BorderCrossing {barrier, snap, dawn}`
  - `Dunkirk`: troops mainly on the East Mole beside destroyers; little ships ferry to larger ships, per the fact-check
  - `ParisBoulevard {flags}`
  - `UndergroundShelter`: generic sign, no roundel
  - `PearlHarbor {burning: number[], calm}`; `OahuAirfield {burning}`
  - `Stalingrad`
  - `NormandyNight`
  - `DDayBeach {sky 0..2, obstacles}`
  - `CampPerimeter {view: 'road' | 'barracks'}`: no inscription, no interiors or chimneys
  - `Memorial {reveal, candles}`
  - `Hiroshima {state: 'before' | 'after'}` and `Nagasaki {state}`: no people, no cloud
  - `MissouriDeck`: sailors come from the crowd system
  - `Cemetery {dusk}`: plain headstones
- **Vehicles**:
  - `Glider {skid, mark, stripes, pitch}`
  - `Parachute {x, y = harness point, open 0..1, shoulder}`: draw it behind the paratrooper
  - `CarrierTop {rot, burning}`
  - `Plane`: new props `kind 'dauntless' | 'kate' | 'p40' | 'airliner'`, `brakes`, `gear`, `prop`, `door`, `burning`, `mark` override
  - `Tank`: new props `variant="t34"`, `snow`
- **FX-01**: put `<SombreGrade amount={0..1}/>` LAST inside the Stage svg. Pass `sombreFrame(f, amount)` as the characters' `f` to slow the boil.

## Benchmark
One timing run, as the Director allowed: `BenchEurope1945` (the heaviest new map: animated shrinking fill, three fronts, five arrows), concurrency 1. It took 16.7 s for 3 frames, about 5.6 s/frame including the tab's one-off projection set-up, so steady-state frames are cheaper. The backgrounds were not benchmarked. They use no filters or blur, and their particle counts stay within the limit (Dunkirk draws about 100 tiny figures as one path). `SombreGrade` uses CSS mix-blend-mode and has not been timed. QC should time one sombre frame.

## Changes to inputs / assumptions
- **GeoMap bug fixed:** the land clip carried the camera transform, so two same-kind maps on screen at once (e.g. during a crossfade) clipped each other. It now lives in projection space. This is backward compatible.
- `MR_LINE_COORDS` now aliases the corrected 28 Sept line. `POLAND_GERMAN_ZONE` and `POLAND_SOVIET_ZONE` follow it.
- The Plane `mark` override was added so factory and rearmament aircraft can carry no insignia.

## Blockers / issues
- `npx tsc --noEmit` passes clean on the final run (an earlier error in the animator's Head.tsx has since gone).
- [question for the researcher] Does Britannica's 2,900 km Barbarossa front include the Finnish/Arctic sector? This decides whether the bracket should follow the Baltic–Black Sea line alone. See map-notes.
- [minor] Designer-plotted lines (1940, Eastern Front, 1944–45 fronts, Manchuria 1931, China 1937, Soviet 1945, Midway) are approximate and not from R-01. They are listed in map-notes for an optional researcher check.

## Recommended next action
- video-editor: wire the map shots and backgrounds to the beats.
- Director: schedule the pending SHOULD items (FX-02 atomic flash decay, FX-03 contrails, FX-05 horizon flashes, V-07 microphones, V-12 banners, V-13 flags, B-07 meeting hall, B-13 airfields, B-18 station, B-39 VE Day) when the token budget allows.
