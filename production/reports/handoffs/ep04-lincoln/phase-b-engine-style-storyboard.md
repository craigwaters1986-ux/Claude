# Handoff — ep04-lincoln — style-sample + storyboard (Phase B)

- **From:** director (main session; engine, reel, score sketch and storyboard written directly)
- **To:** Craig (Approvals 2 + 3), then the Phase C session
- **Date:** 2026-11-20
- **Status:** AWAITING REVIEW

## Deliverables
- `production/exports/ep04-lincoln/phase-b/ep04-upgrade-test.mp4`: test reel, 40.0 s, 1920×1080, 30 fps, H.264 + AAC, music = first 40 s of the music test
- `production/exports/ep04-lincoln/phase-b/ep04-upgrade-test-contact-sheet.png`: 12 frames with the debug overlay (hand-to-grip distances, hip-on-seat and feet-on-floor markers)
- `production/exports/ep04-lincoln/phase-b/contact-report.json`: every frame of every reel shot measured in screen pixels
- `production/exports/ep04-lincoln/phase-b/ep04-music-test.mp4` (and `.m4a`): 60.0 s score sketch over a still, −14.0 LUFS, −1.2 dBTP
- `production/storyboards/ep04-lincoln/storyboard.md`: 66 shots, each ≥ 6 s, anchored to script phrases
- `production/storyboards/ep04-lincoln/music-cue-sheet.md`: motifs, 11 cues, hits, SFX list, the ElevenLabs option
- `production/scripts/ep04-lincoln/credits-fonts.md`: font licences
- Engine: `the-human-story/episode-04-lincoln/` (copied from Episode 3; no Titanic engine existed on any branch, so nothing came from Codex)

## What the engine now has (new or upgraded files)
| File | What |
| --- | --- |
| `src/kit/Cinema.tsx` | `CineCam` layered parallax camera (depth per plane, handheld option), depth-of-field blur filters, rim-light filters, time-of-day grades (dawn, day, golden, dusk, night, lamp, sombre), flickering `LightPool`, `GodRays`, film `Grain` (~3 %), `Vig`, `LightLeak` (titles only), cinematic `TitlePlate` with light sweep, `PassBy` foreground elements, whip streaks |
| `src/kit/Shots.tsx` | new transitions `whip`, `iris`, `page` (plus cut, fade, dip, wipe) |
| `src/kit/Props.tsx` | prop and grip system: props with grip points, `gripWorld`, `handsOn` (two-bone IK on both arms), `approach` (reach/release blend), `Hold` (forward-kinematic hold from `handWorld()`), `contactError`, `GripDebug`; props: axe, book (opens, page turns), quill, stovepipe hat, ink pot, rail log, wood chips, door with a working handle |
| `src/kit/Actions.ts` | pure, frame-timed actions: `chopRail` (anticipation, 10-frame hold at the top, eased strike, impact, follow-through), `grabCarry` (pick up / carry / put down / hand over), `pageTurn`, `writeAt` + `nibPath`, `shakeHands` (pump), `doffHat`, `exprAt` (expression timeline with blends), `blinkAt` (irregular blinks + reaction blinks), `track`, `localXf` |
| `src/kit/Seats.tsx` | `seatPose` (hip exactly on the seat top, knee solved so the feet land on the floor), `sitDown` / `standUp` with weight shift, `Chair`, `Stool`, `Bench`, `WritingDesk`, `SeatDebug` |
| `src/kit/Bubbles.tsx` | speech, thought, shout and telegraph bubbles, word-by-word reveal at 14 characters a second, hold (words ÷ 3 + 1) s, pop out; `Attribution` plate |
| `src/kit/Documents.tsx` + `src/timeline/documents.json` | real readable text only: 11 exact sourced texts (research notes Q1–Q12), font-metric layout, write-on reveal whose edge gives the nib point, `DocSheet`, labelled `SummaryPanel` |
| `src/kit/Cast.tsx` | Episode 4 cast: Lincoln at six ages (boy → 1865), family, Stuart, Douglas, Douglass, Grace Bedell, Davis, Grant, Lee, Booth, soldiers, illustrative townspeople |
| `src/characters/Head.tsx` | new expressions `thinking`, `shocked`, `relieved`, `hopeful`, `grim`, `afraid`; brow blending between expressions (`exprFrom`, `exprT`); `stovepipe` and `kepiUS` hats; `chinCurtain` beard; `age` face lines |
| `src/characters/skeleton.ts` | `TALL` build (Lincoln: longer legs and arms) usable everywhere a `child` flag was |
| `src/kit/Sets04.tsx` | woods planes, cabin interior and exterior, Springfield house front, study, writing slope, oil lamp, reception room |
| `src/scenes/reelSolve.ts`, `UpgradeTest.tsx` | the reel (pure solvers + drawing) |
| `scripts/check-contacts.mjs` | measures every frame: `node scripts/check-contacts.mjs out.json` |
| `scripts/music_test.py` | the score sketch: 6-voice string ensembles, formant choir, convolution hall, riser and impact |

## Acceptance results
- Contacts: **PASS**, worst 1.22 px on screen over all 1,200 frames (limit 3 px): axe (both hands), book (both hands), quill and the far hand on the page, door handle, hat, handshake (both hands). Hip on seat and feet on floor: 0.0 px in every seated frame.
- `freezedetect n=0.003 d=1.5` over the reel: nothing. `blackdetect`: nothing.
- Test-reel content: axe chop ✔, pick up and read a book by firelight ✔, writing a line of real text with a quill ✔ (Bliss copy text), handshake ✔, opening a door and walking through ✔, sitting down at a desk ✔ (plus hat off, carried while sitting, set on the desk). Bubbles: speech exchange ✔ (documented words only, with attribution), thought ✔, shout ✔. Expressions: all six new ones in a close-up sweep ✔.

## Known gaps (honest list)
- [minor] The reel is 40 s, not 30 s: seven tests, each needs about 5 s to read.
- [needs Phase C] Actions not yet built: `rideHorse` (horse rig), `polePushFlatboat`, `raiseFlag`, `pointAtMap`. A dedicated `handOver` between two people is covered by `grabCarry` but not shown in the reel. All listed as MUST assets in the storyboard.
- [minor] Telegraph bubble is built but not in the reel: no exact telegram text is in the research notes yet.
- [minor] Secondary overlap motion (coat tails, the stovepipe hat lagging a frame) is not implemented yet.
- [minor] Grain and rim light are subtle at phone size; they can go stronger if Craig wants.
- [info] The music was checked by measurement and spectrogram, not by ear (no audio playback here). Craig's ears are the real test.
- [info] Two transitions in the brief (match cuts) are edit choices, so they are planned in the storyboard, not built as effects.

## Recommended next action
- Craig: watch the reel and the music test, read the storyboard, then give Approvals 2 (style) and 3 (storyboard), and say yes or no to the ElevenLabs music option.
