# QC · Episode 4 final render · 20 November 2026

File: `production/exports/ep04-lincoln/episode-04-lincoln-1080p.mp4` (294.6 MB, not in Git)
SHA-256: `114762d2fdc06370929cffe47b4e31dcb94245e26f2649d86641ea5f6df12961`

**Verdict: ready for Craig's review (Approval 4).** No blocking technical issues. Left for a person: one listen-through at normal speed, and the approval itself.

## Technical (measured on the delivered file)

| Check | Target | Result |
| --- | --- | --- |
| Duration (container, video, audio) | 600.000 s | 600.000 / 600.000 / 600.000 s ✅ |
| Frames | 18,000 | 18,000 decoded ✅ |
| Video | H.264, 1920×1080, 30 fps | H.264 High, yuv420p limited range (BT.709), 30/1, about 3.7 Mb/s ✅ |
| Audio | AAC stereo | AAC-LC, 48 kHz, stereo, 192 kb/s ✅ |
| Loudness | −14 LUFS | −14.1 LUFS integrated, LRA 3.6 LU ✅ |
| True peak | ≤ −1 dBTP | −1.4 dBFS after AAC (−1.5 dBTP before encoding) ✅ |
| Narration over music | about 20 dB in speech | median 20.0 dB, 5th percentile 9.3 dB (mix report) ✅ |
| Silence | none ≥ 1.5 s | none at −50 dB ✅ |
| Black frames | none | blackdetect (0.4 s, pix_th 0.06): none ✅ |
| Frozen picture | none | freezedetect (n 0.003, d 1.5) over the whole file: none ✅ (after the fixes below) |
| A/V sync | captions on the words | speech recognition on the final mix: “historians” 121.14 s vs cue 121.13; “At New Salem” 123.52 vs 123.49; “His son” ≈ 540.9 vs 540.84; “By December” 543.72 vs 543.70; “That October” 277.52 vs 277.53 ✅ |

## Fixed in Phase D

1. **Title plate vs score:** the plate appeared 3 s before the score's impact (28.72 s). Picture moved to the audio; the plate now emerges on the hit.
2. **Captions through silent beats:** cues 20 and 105 held text for 14.6 s and 12.1 s across beats. Split at the sentence break; 153 cues, longest 5.3 s, 2 lines × 42 characters maximum, no overlaps. Burnt-in captions re-rendered to match; no shot anchor moved.
3. **Colour range:** Remotion's JPEG pipe produced full-range `yuvj420p`; re-encoded to standard limited-range `yuv420p` BT.709.
4. **Near-freezes (1.6–2.0 s):** 3.4 waterfront (2:01), 8.7 dusk fields (7:51–7:58), 9.3 empty chair (8:20). Camera moves now continue through the shot edges. Re-scan: none.

## Captions

`episode-04-subtitles.srt`: 153 cues, UTF-8 without BOM, word-aligned (96.8% of script words matched). The same cues are burnt into the picture, so leave YouTube CC off by default.

## Picture

36-frame contact sheet of the final file reviewed: logo top left on every frame; captions in the band; readable documents (House Divided, Charleston, Greeley, Proclamation, Hodges, Bliss copy) match `documents.json`; name tags and date cards present; the war dead, assassination and death are non-graphic (empty fields with an estimate label, the empty chair, the clock). Known simplifications as listed in the handover (Fort Sumter reads a little like a ship; generic Cooper Union hall; simplified excepted areas, labelled).

## Pronunciation (machine check only)

The recogniser heard Bedell, Appomattox, Kansas–Nebraska and Petersen (as “Peterson”, the same sound) correctly, and “eighteen fifty-eight” as 1858.

## Open (non-blocking)

1. **Listen once at normal speed.** Nobody has heard the mix.
2. **Approval 4** is Craig's decision and has not been recorded.

## Deliverables

- iPhone copy: `episode-04-lincoln-720p-small.mp4` (52.9 MB, 1280×720, H.264 Main 3.1, AAC 96 kb/s, faststart) + `iphone-parts/` (4 parts: 3 × 3:00 + 1:00).
- Publishing pack: `production/exports/ep04-lincoln/youtube/`.
