# Handoff — ep01-ww2 — assembly

- **From:** video-editor
- **To:** director (cc: quality-control, environment-designer, audio-engineer)
- **Date:** 2026-11-16
- **Status:** AWAITING REVIEW (the assembly is done; the full render has not been run yet, as instructed)

## Deliverables
Engine: `the-human-story/episode-01-ww2/`
- `src/scenes/S01.tsx` … `S11.tsx`: one file per section. Each exports `SxxPicture` (the shots) and `SxxOverlay` (the cards). All 99 storyboard shots are implemented.
- `src/scenes/kit.tsx`: assembly helpers.
  - `sec()` gives the beat helpers: `cut(k)` is the midpoint of the gap before sentence k; `mid()` and `abs()` convert to section frames.
  - `Fig` and `Walker` wrap the cast figures. `Shot` is a Stage plus Camera, with drift always on.
  - Chalk line-art.
  - Simple scene props: `SimpleFlag` (Weimar, Polish, Republic of China), `PlainBanner`, `Microphone`, `HandCart`, `Bunting`, `Bench`, `Crater`.
- `src/scenes/Episode.tsx`: the `Episode` timeline (18,150 frames). Layers, bottom to top:
  - section pictures
  - section overlays and chapter banners
  - transitions (ink wipes; s09→s10 slow fade with 30 frames of pre-roll; s10→s11 dip)
  - global captions band
  - Audio is `<Audio src={staticFile('audio/mix.wav')}/>` only.
- `src/Root.tsx`: registers `Episode` and `TestLineup`. `Preview` was removed and `src/scenes/Preview.tsx` deleted, because s01 replaces it (T-03).
- `src/components/Text.tsx`:
  - T-01: DateCard and TermCard.
  - T-02: `EndCard`.
  - T-04: `ListPill` and `MemorialCard`.
  - FactPill now wraps onto two lines, can take a second line (`sub`), and is clamped inside the frame.
  - Text widths are measured with the loaded font (`measureW`).
  - Captions wrap by measured width and never rise above y 900.
- `src/components/Camera.tsx`: `ShotTrack` takes an explicit `f`, which allows pre-roll. New `SplitPanels` (T-05).
- `scripts/render.sh`: the render pipeline (see below).

## Shots implemented (99 / 99)
| Section | Shots | Notes |
|---|---|---|
| s01 | 6/6 | Fade up from black. Bench paper reads "DANZIG CRISIS · AUGUST 1939". Newspaper whips into the desk headline. Map has no title. Chalk 1939 → ? → 1945. Title "THE HUMAN STORY / Episode 1: World War II / How It Started, How It Ended" from 22.8 s. |
| s02 | 9/9 | Chapter 1 banner. All cards from the checklist. |
| s03 | 10/10 | Plain banners, no emblems. NAZI PROPAGANDA stamp. Hitler tagged at eye level. |
| s04 | 9/9 | Split screen for the radios. Two-line date card for 17 September. |
| s05 | 10/10 | Scored tail 261–270 s is a crane up to the Spitfires. |
| s06 | 10/10 | Pearl Harbor aftermath uses a sombre grade. Iris into the globe. |
| s07 | 9/9 | Three-panel split merges into the dusk sky (tail 380.8–390 s). |
| s08 | 10/10 | Tail 442.5–450 s is the stalled truck. |
| s09 | 10/10 | S09-09 and S09-10 are one continuous element (crane from VE Day up to the evening sea). |
| s10 | 10/10 | Hiroshima flash on frame **15992**. Nagasaki glow on frame **16485**. No people, no cloud. |
| s11 | 6/6 | End card from 595.5 s (frame 17865) held to frame 18149. |

All chapter banners (s02–s11 = Chapters 1–10) and all 26 required cards plus the §3.2 cards are placed. Each card is anchored to its narration beat and stays on screen for at least about 3 s.

## Deviations from the storyboard (and why)
- **Shot cut points** are snapped to the midpoints of narration gaps (`cut(k)`), as §1.1 instructs. Card times therefore differ from the storyboard estimates by up to about 1 s.
- **S03-04 order:** party office (padlock) → newspaper press → Reichstag. This matches the narration order ("banned rival parties, crushed the free press, … dictatorship").
- **S03-08:** the leaders stand at the table. The name tags fade in one by one. The wall map is `WallMap` with `czechHighlights(1)`.
- **S04-07:** the beat is only 3.2 s, so the shot is: embrace → Tom waving from the departing train window → Leo waves. There is no hair-ruffle.
- **S05-05 Fall of France card:** it holds 3.0 s and so runs 0.7 s into S05-06 (the shot is only 2.3 s).
- **S08-02:** 8 paratroopers and 1 glider instead of 10 and 2, to save render time.
- **S09-08:** the surrender stamp lands at 500.0 s, close to the music lift at 500.6 s.
- **S09-09:** Tom lifting Leo is composed (Leo raised beside Tom). The animator has no lift move (A-16 partial).
- **S10-03:** the document prop text is too small to read, so a plain label card "ALLIED SURRENDER TERMS / POTSDAM · 26 JULY 1945" sits above the table.
- **S10-04/05:** the flash is at 533.07 s (the audio engineer's frame 15992), not the storyboard's 532.6 s. White decays to grey over 3 s.
- **S10-08:** the woman covering her mouth was dropped because it read as a moustache at that scale. All the family sit heads bowed with eyes closed. The grief expression stays.
- **S11-02:** the UN flag unfurls (grows) on its pole instead of being hoisted.
- **Composed rather than library assets:** meeting hall, press and party office, station, Western Front bunker, Congress chamber, Munich room, HQ briefing room, railway at night, Japanese rooms and Okinawa ridge. The missing should/could items (B-07, B-09, B-12, B-13, B-18, B-19, B-29, B-32, B-35, B-40, B-41, V-07, V-09, V-11, V-12, V-13, V-14) are covered by `kit.tsx` props and existing parts.
- **Environmental labels added:** "PARTY OFFICE", "NEWSPAPER", "MOSCOW" road sign, "CAFÉ", and the "ARDENNES" location label. These are British English and contain no new facts.

## T-requests
| ID | Status |
|---|---|
| T-01 | Done. DateCard defaults to y = 120. Titles over 1,040 px wrap to two lines, then auto-shrink. The sub-line is 32 px. TermCard defaults to y = 120, and its term auto-fits. |
| T-02 | Done. `EndCard`: "THE HUMAN STORY" / *History is made by people.* / button "SUBSCRIBE FOR THE NEXT CHAPTER", upper centre, 595.5–605 s. |
| T-03 | Done. s01 is built from the storyboard and narration.json. No title before 22.8 s. Title text corrected. DANZIG CRISIS paper. Cards at y = 120. |
| T-04 | Done. `ListPill` (camp liberations, lines appear one by one). `MemorialCard` (1 s fades, no bounce; victim groups appear one by one). |
| T-05 | Done. `SplitPanels` (2–3 panels, ink divider, centre-out reveal, per-panel camera). Used in S03-06, S04-06 and S07-09. |
| T-06 | Done. No banner on s01; s02–s11 show CHAPTER 1–10 with the storyboard titles. |

## Verification (lean)
- `npx tsc --noEmit`: clean.
- Half-scale stills were checked for s01–s11, about one per section. Fixed after review:
  - name tags colliding in Munich
  - a pill covering a face
  - wrong camera centre in the split panels
  - list-pill text size raised to 34 px
- **Smoke test of `render.sh`** on frames 2700–2729: ALL PASS. Duration 1.000 s, 1920×1080, 30/1, h264 High yuv420p, AAC 48 kHz stereo. Black segments 0, frozen segments 0.
- Found and fixed: Remotion's JPEG frames encode as full-range `yuvj420p`. The concat step now converts once to tv-range `yuv420p` with x264 CRF 18. The chunks are encoded at CRF 15 so this second encode costs little quality.

## How to run the render
```bash
cd /home/user/Claude/the-human-story/episode-01-ww2 && bash scripts/render.sh
```
(Run it in the background.)
- It renders 11 per-section chunks: `--frames=a-b --muted --concurrency=4`, JPEG, into `output/chunks/sNN.mp4`.
- It is resumable: a chunk is moved into place only when it is complete, and existing chunks are skipped. Just re-run the command.
- It then joins the chunks into `output/video-only.mp4` and muxes `public/audio/mix.wav` as AAC 192k into **`output/episode-01-ww2.mp4`** (605.000 s).
- Reports go to `production/video/ep01-ww2/`:
  - `ffprobe-report.txt` with PASS/FAIL lines
  - `qc-detect.log` (blackdetect d = 0.5 s, freezedetect 2 s)
  - `previews/000s.jpg` … `600s.jpg` (every 30 s)
  - `render.log`
- Set `CONCURRENCY=n` to change the concurrency.
- For a smoke test: `TEST=a-b bash scripts/render.sh` writes to `output/test/`.

## Render time estimate
Benchmarks are 30 frames each at concurrency 4, including about 5 s of start-up.
| Content | Speed |
|---|---|
| Europe GeoMap shots (s09-01 `MapEurope1945`) | 107 s, about 3.4 s/frame |
| s03-05 Europe map | about 2.9 s/frame |
| Finale crowd (70 figures, s11) | about 0.6 s/frame |
| VE Day street plus crowd | about 0.45 s/frame |

Europe-projection maps cover about 2,700 frames (≈ 2.4 h). The other maps cover about 1,800 frames (≈ 1 h at about 2 s/frame). Character and background shots cover about 13,700 frames (≈ 2.3 h at about 0.6 s/frame). Joining and the x264 pass take about 15 min.

**Total estimate: about 5.5–6.5 hours** on this 4-core container.

## Blockers / issues
- [minor] The music/SFX mix is still AWAITING the user's listen. The render uses `mix.wav` as it is now; if the mix changes, re-run only the mux step (delete `output/episode-01-ww2.mp4` and re-run; the chunks are reused).
- [minor] The Nagasaki glow is on the audio engineer's estimated frame 16485 (549.5 s). The picture matches the audio, so nothing needs to move.
- [minor] `production/video/ep01-ww2/ep01-hook-preview-wip.mp4` is an old WIP preview from before the approved storyboard. It is not a deliverable.
- Not yet produced: the final MP4, SRT and chapter file in `production/exports/ep01-ww2/`. These come after the render and QC. The SRT exists at `output/episode-01-subtitles.srt` (audio engineer) and should be checked against the 605 s edit at QC.

## Requests for other agents
- environment-designer (optional, performance): `GeoMap kind="europe"` costs about 3 s per frame. Caching the projected `bm.paths` and highlight paths across frames, or using 110m data at zoom ≤ 1.6, could cut about 2 h from future renders. No change is needed for this render.
- quality-control (final-qc): check the following:
  - grief scenes S06-08, S09-02…05, S10-05/07/08, S11-01
  - the flash at 533.07 s and the 1.5 s silence after it
  - the end card hold, 595.5–605 s
  - the composed scene labels (PARTY OFFICE, NEWSPAPER, MOSCOW, CAFÉ)
  - card wording against storyboard §3

## Recommended next action
- Director: launch `bash scripts/render.sh` in the background (final-render). When it finishes, read `ffprobe-report.txt` (expect RESULT: ALL PASS) and `qc-detect.log`, then go to final-qc.
