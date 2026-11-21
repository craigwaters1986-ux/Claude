# QC · Episode 4 final render (Phase D2) · 21 November 2026

File: `production/exports/ep04-lincoln/episode-04-lincoln-1080p.mp4` (318.1 MB, not in Git)
SHA-256: `29fffb174650ae083466925ae4ab5a58f7b6d386d6ed8de9a1f1f21f02bf3738`

This is the second final render: ElevenLabs narration (Liam Dale) and ElevenLabs Music score, picture re-timed to the new narration. It replaces the render of 20 November.

**Verdict: ready for Craig's review (Approval 4).** No blocking technical issues. Left for a person: a listen-through at normal speed (nobody has heard the new voice and score in the mix), and the approval itself.

## Technical (measured on the delivered file)

| Check | Target | Result |
| --- | --- | --- |
| Duration (container, video, audio) | 600.000 s | 600.000 / 600.000 / 600.000 s ✅ |
| Frames | 18,000 | 18,000 decoded ✅ |
| Video | H.264, 1920×1080, 30 fps | H.264 High, 1920×1080, yuv420p limited range (BT709), 30/1, about 4.0 Mb/s ✅ |
| Audio | AAC stereo | AAC-LC, 48 kHz, stereo, 199 kb/s ✅ |
| Fast start | moov atom first | yes ✅ |
| Loudness | −14 LUFS | −14.1 LUFS integrated, LRA 5.9 LU ✅ |
| True peak | ≤ −1 dBTP | −1.3 dBFS after AAC (−1.5 dBTP before encoding) ✅ |
| Narration over music | about 24 dB in speech | median 23.8 dB; against the narration's overall loudness the music is never closer than 18.9 dB under speech (mix report) ✅ |
| Silence | none ≥ 1.5 s | none at −50 dB ✅ |
| Black frames | none | blackdetect (0.4 s, pix_th 0.06): none ✅ |
| Frozen picture | none | freezedetect (n 0.003, d 1.5) over the whole file: none ✅ |
| A/V sync | captions on the words | speech recognition on the final mix, 146 of 155 cues matched by their first two words: median +5 ms, 118 within 150 ms, 121 within 300 ms, largest 1399 ms. Examples: “At New Salem he was a store” heard 120.20 s, cue 120.13; “That October, an eleven-year” heard 274.95 s, cue 274.92; “"With malice toward none; wi” heard 445.85 s, cue 446.28; “By December 1865, enough sta” heard 543.58 s, cue 543.58; “Historians still argue about” heard 568.69 s, cue 568.68 ❌ |
| Colour | matches the drawn frames | chunks are full-range BT.601 from Remotion's JPEG pipe; converted once to limited-range BT.709 (`colorspace` filter, crf 17). A converted frame differs from the browser-rendered still by 2.4 levels of 255 on average, with no colour cast (test floor 1.5) ✅ |

## What changed since the first render

1. **Narration:** ElevenLabs voice Liam Dale (27 takes, 525 s), replacing Kokoro. All 27 groups sit within 0.03 ms of their plan times in the mix.
2. **Score:** ten ElevenLabs Music cues, one per chapter, each anchored to a picture moment. No sung or spoken words found in any cue (voice detector and recogniser).
3. **Mix:** narration 24 dB over the music (first render 20 dB); music in the silent beats at −20 to −33 LUFS (first render −11 to −16).
4. **Timing:** plan rebalanced so the title plate (4.8 s), the clock at 7:22 (3.6 s) and the end card (5.4 s) keep proper holds; chapter cards 2.5 s.
5. **Picture:** every chapter reviewed against its new shot lengths; about 25 timing fixes (list in the handover), all confirmed on stills. Contact check re-run: worst 1.22 px (limit 3 px).
6. **Captions:** re-aligned, seven awkward breaks re-segmented, all cues re-wrapped.

## Captions

`episode-04-subtitles.srt`: 155 cues, UTF-8 without BOM, at most 2 lines × 42 characters, no overlaps, longest 5.5 s, fastest 21 characters a second (one cue). Word-aligned to the new narration (95% of script words matched by the recogniser). Seven runs were re-segmented where the new voice's pauses had left awkward breaks; the wording is unchanged. The same cues are burnt into the picture, so leave YouTube CC off by default.

## Picture

Each chapter's re-timed stills (one every 1.5 s, 400 in all) were reviewed by a separate reviewer before the render, and the fixes were confirmed on 64 further stills. On the delivered file the Director checked six contact sheets (cold open and title, firelight, Fort Sumter, Second Inaugural and reception, the clock, the last page and end card): logo top left on every frame, captions in the band and matching their cues, the documents readable, the flag fully down by the cut, the end card complete. **A full frame-by-frame visual pass of the delivered file by an independent reviewer was started but did not finish (the session's worker restarted); it has not been repeated.** The machine checks above cover the whole file.

## Sound

See `production/audio/ep04-lincoln/sound-notes.md`. All figures are measured; nobody has listened. Things to listen for: the voice-like quality at the start of the chapter 8 cue (6:55; the detector scored it weakly, below the speech threshold), chapter 4's cue being in C major where the others are in D, the joins between cues at each chapter start, and whether the music now sits low enough for Craig's taste.

## Pronunciation (machine check only)

The recogniser heard, in the final mix: Bedell ×1, Appomattox ×1, Petersen/Peterson ×1 (the same sound), Stuart ×0, Robert E. Lee ×1, Ulysses ×1, Grant ×1, Sumter ×1, Gettysburg ×3.

## Open (non-blocking)

1. **Listen once at normal speed.** Nobody has heard this mix.
2. **Sync outliers are a measuring artefact, not drift:** 25 of 146 matched cues read more than 0.3 s out, nearly all of them the first words after a pause, where the recogniser stretches a word back into the silence (it "hears" some words before the narration audio begins). The narration's placement is exact (0.03 ms) and the captions were aligned to its word timings.
3. **Independent full visual pass of the delivered file not completed** (see Picture).
4. Left as they were, for a later pass if wanted: Willie's bedside is 3.4 s; the corridor door is fully open only 0.2 s before the cut; Douglass has no name tag at the lectern (he is tagged at his first appearance); the write-on of the Hodges letter and Second Inaugural runs slightly ahead of the voice by the end of each page.
5. **Approval 4** is Craig's decision and has not been recorded.

## Deliverables

- 1080p master: `episode-04-lincoln-1080p.mp4` (318.1 MB).
- iPhone copy: `episode-04-lincoln-720p-small.mp4` (67.0 MB, 1280×720, H.264 Main 3.1, AAC 132 kb/s, faststart; audio encoded from the master mix 0.7 dB lower, −14.8 LUFS, peak −1.8 dBFS; freezedetect and blackdetect: none) + `iphone-parts/` (4 parts: 3:02, 3:00, 3:00, 0:58).
- Subtitles: `episode-04-subtitles.srt`. Publishing pack: `production/exports/ep04-lincoln/youtube/` (chapters and credits updated for the new voice and music).
