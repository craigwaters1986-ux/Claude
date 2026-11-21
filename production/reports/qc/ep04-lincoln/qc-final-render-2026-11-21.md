# QC · Episode 4 final render (Phase D2) · 21 November 2026

File: `production/exports/ep04-lincoln/episode-04-lincoln-1080p.mp4` (318.2 MB, not in Git)
SHA-256: `b69a8c99940728d9ff46522a2b34d61298ecf85783cdc91669a1481c90f39bfc`

This is the second final render: ElevenLabs narration (Liam Dale) and ElevenLabs Music score, picture re-timed to the new narration. It replaces the render of 20 November.

**Verdict: ready for Craig's review (Approval 4), with one open picture question (the 1922 seating shot) and three captions half a second early.** No blocking technical issues. Left for a person: a listen-through at normal speed (nobody has heard the new voice and score in the mix), and the approval itself.

## Technical (measured on the delivered file)

| Check | Target | Result |
| --- | --- | --- |
| Duration (container, video, audio) | 600.000 s | 600.000 / 600.000 / 600.000 s ✅ |
| Frames | 18,000 | 18,000 decoded ✅ |
| Video | H.264, 1920×1080, 30 fps | H.264 High, 1920×1080, yuv420p limited range (BT709), 30/1, about 4.0 Mb/s ✅ |
| Audio | AAC stereo | AAC-LC, 48 kHz, stereo, 199 kb/s ✅ |
| Fast start | moov atom first | yes ✅ |
| Loudness | −14 LUFS | −14.1 LUFS integrated, LRA 5.9 LU ✅ |
| True peak | ≤ −1 dBTP | −1.2 dBFS after AAC (−1.5 dBTP before encoding) ✅ |
| Narration over music | about 24 dB in speech | median 23.8 dB; against the narration's overall loudness the music is never closer than 18.9 dB under speech (mix report) ✅ |
| Silence | none ≥ 1.5 s | none at −50 dB ✅ |
| Black frames | none | blackdetect (0.4 s, pix_th 0.06): none ✅ |
| Frozen picture | none | freezedetect (n 0.003, d 1.5) over the whole file: none ✅ |
| A/V sync | captions on the words | speech recognition on the final mix, 141 of 155 cues matched by their first two words: median -7 ms, 119 within 150 ms, 122 within 300 ms, largest 847 ms. Examples: “At New Salem he was a store” heard 120.17 s, cue 120.13; “That October, an eleven-year” heard 275.01 s, cue 274.92; “"With malice toward none; wi” heard 446.40 s, cue 446.28; “By December 1865, enough sta” heard 543.66 s, cue 543.58; “Historians still argue about” heard 568.69 s, cue 568.68 ❌ |
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

Each chapter's re-timed stills were reviewed before the render and the fixes confirmed on 64 further stills. **Independent visual pass of the delivered file (completed):** five reviewers read contact sheets cut from the delivered file (one frame every 2 s, about 500 frames, plus full-size frames where needed) against the script, the subtitle file and `documents.json`; a sixth checked the publishing pack and subtitles; a seventh looked for gaps. Result: logo on every frame, captions matching their cues, all dates, names, labels and document texts correct, nothing graphic, no broken frames. They raised 3 major and about 25 minor points. Two majors were fixed and the two affected chunks re-rendered (this file): the captions at 5:28-5:36 ran up to 1.4 s ahead of the voice (the recogniser had dropped those words, so three cues were guesses; now hand-timed from the pauses in the recording, which also gives Willie's bedside 4.8 s instead of 3.4), and John T. Stuart's name tag was partly hidden behind the foreground figure (2:25). Both confirmed on frames from this file. The third major is open, below.

## Sound

See `production/audio/ep04-lincoln/sound-notes.md`. All figures are measured; nobody has listened. Things to listen for: the voice-like quality at the start of the chapter 8 cue (6:55; the detector scored it weakly, below the speech threshold), chapter 4's cue being in C major where the others are in D, the joins between cues at each chapter start, and whether the music now sits low enough for Craig's taste.

## Pronunciation (machine check only)

The recogniser heard, in the final mix: Bedell ×0, Appomattox ×1, Petersen/Peterson ×1 (the same sound), Stuart ×0, Robert E. Lee ×1, Ulysses ×1, Grant ×1, Sumter ×1, Gettysburg ×3.

## Open (non-blocking)

1. **Listen once at normal speed.** Nobody has heard this mix. Listen in particular at 2:23 (Stuart), 4:35 (Bedell), 6:55 (start of the chapter 8 music, faintly voice-like on the detector), 7:47 (Appomattox), 8:28 (Petersen), and the cue joins at each chapter start (chapter 4's cue is in C major).
2. **The 1922 dedication shot (9:23-9:28) does not visibly show a separate section.** The rope is drawn but the crowd is the same on both sides of it, so the picture does not carry what the narration says ("Black guests were reportedly seated in a separate section"). It is unchanged from the first render. The series draws every head the same white, so the reviewer's suggested fix (a different head colour) is against the style guide; how to show this is Craig's call (for example a "reserved" sign and a visibly set-apart block of seats, or a plain label).
3. **Three captions still lead the voice by about half a second:** 3:39 ("A house divided…", 0.6 s), 7:33 ("let us strive on…", 0.35 s) and 9:35 ("Frederick Douglass, who knew him…", 0.5 s). Other "early" readings in the sync check are the recogniser stretching a word back into a pause.
4. **Minor points from the visual pass, not changed** (full list in the handover): the quill crosses Lincoln's face in the opening shot; he sits low behind the caption band at 0:23-0:27; a stroke crosses the "aged 19" tag at 1:29; the wagon icon is tipped on the 0:53 map; a label overlaps the legend on the Proclamation map (6:05); the last push-in on the Bliss page runs line ends off the right edge (9:49); Douglass has no tag at the lectern (9:28); the corridor door is fully open only 0.2 s before the cut.
5. **Approval 4** is Craig's decision and has not been recorded.

## Deliverables

- 1080p master: `episode-04-lincoln-1080p.mp4` (318.2 MB).
- iPhone copy: `episode-04-lincoln-720p-small.mp4` (67.0 MB, 1280×720, H.264 Main 3.1, AAC 132 kb/s, faststart; −14.8 LUFS, peak −1.8 dBFS; no freezes or black) + `iphone-parts/` (4 parts: 3:02, 3:00, 3:00, 0:58).
- Subtitles: `episode-04-subtitles.srt`. Publishing pack: `production/exports/ep04-lincoln/youtube/` (chapters and credits updated for the new voice and music).
