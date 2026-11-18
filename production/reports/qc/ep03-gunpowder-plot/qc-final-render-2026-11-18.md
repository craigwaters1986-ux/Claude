# QC · Episode 3 final render · 18 November 2026

File: `production/exports/ep03-gunpowder-plot/episode-03-gunpowder-plot-1080p.mp4` (230.5 MB, not in Git)
SHA-256: `746b5f4e70db30e0a35fb464a316b3326e93b2b2b22144060c3ee73aa3364600`

**Verdict: ready for Craig's review.** No blocking technical issues found. Two things are left for a person: the listen-through for pronunciation and the final approval.

## Technical (measured)

| Check | Target | Result |
| --- | --- | --- |
| Duration (container, video, audio) | 720.000 s | 720.000 / 720.000 / 720.000 s ✅ |
| Frames | 21,600 | 21,600 decoded ✅ |
| Video | H.264, 1920×1080, 30 fps | H.264 High, yuv420p, 1920×1080, 30/1, about 2.36 Mb/s ✅ |
| Audio | AAC stereo | AAC-LC, 48 kHz, stereo, 192 kb/s ✅ |
| Loudness | −14 LUFS | −14.0 LUFS integrated (ffmpeg ebur128), LRA 11.3 LU ✅ |
| True peak | ≤ −1 dBTP | −1.3 dBFS after AAC encoding (−1.5 dBTP before encoding) ✅ |
| Narration over music and SFX | clear | narration a median 23.2 dB louder, and 10.6 dB louder at the 5th percentile, during speech ✅ |
| Silence | none unexplained | no silence ≥ 1.5 s at −50 dB anywhere ✅ |
| Black frames | none | ffmpeg blackdetect (0.4 s, pix_th 0.06): none ✅ |
| Frozen picture | none | the first pass found 7 near-still spans of 2.6–4.1 s, all on portrait cards (1:34, 4:41, 4:49, 8:03–8:18). Slow camera pushes were added and the three affected chunks re-rendered. Re-scan of the final file: no freezes ≥ 2.5 s and no black frames ✅ |
| A/V sync | captions on the words | spot checks by speech recognition on the final mix: “clerk” heard at 377.96 s against a cue at 377.74 s; “Some of the earliest” at 641.46 s against 641.37 s ✅ |

## Captions

- `episode-03-subtitles.srt`: 181 cues, at most 2 lines of 42 characters, 0.8–6.0 s each, no overlaps, UTF-8 without a BOM.
- Timing: re-timed to word timestamps from faster-whisper (small.en) on the narration. 96.9% of script words matched. A few cues in group 17 (“The king was alive … to the plotters”) keep their earlier pause-based timing because the recogniser skipped that stretch. A second check confirmed the words are in the audio.
- The same cues are burnt into the picture in the series caption band (y 916–1080). Upload the SRT for search and translation, but leave CC off by default so the captions don't show twice.

## Picture

- Contact sheets of every section were reviewed during the build, and a 36-frame sheet of the final file was checked afterwards. The channel logo is top left on every frame; the logo zone and the caption band stay clear of labels.
- Historical figures are labelled at first appearance (Monteagle, Catesby, the five plotters, Cecil, James, Tresham, Knyvett, Ewens, Princess Elizabeth, Elizabeth I, Mary, Queen of Scots). The parish family, neighbours and children are unnamed illustrative people.
- Non-graphic throughout. The questioning of Fawkes, the attack at Holbeach and the executions are not shown: a grey Tower in the rain, a misty house with figures seen from behind, and a date card over a desaturated Old Palace Yard. Effigies are faceless straw figures.
- Readable quotations: only “a terrible blow” from the letter. The Commons Journal panel is labelled “summarised” (“the prisoner: Johnson, servant to Thomas Percy”) rather than presented as a transcription. The Oath and Act pages use descriptive headings, not invented title text.

## Content checks

- 3 November decision: kept as scripted. A search summary of the UK Parliament timeline dates Catesby and Winter's accusation of Tresham to 1–2 November and the decision to continue to 3 November. A direct fetch of parliament.uk was refused (HTTP 403), so this rests on the search summary and a secondary source. It is worth one look at the page in a browser.
- Dates shown on screen: 26 Oct 1605 (Hoxton), 3 Nov 1605, night of 4–5 Nov, 5 Nov, 7 Nov (proclamation, Tower), 8 Nov (Holbeach), 27 Jan 1606 (trial), 30 and 31 Jan 1606 (executions), January 1606 (thanksgiving Act). All come from the script and its research trail.
- The route of the flight (London → Dunchurch → Holbeach) is a simplified sketch and is not labelled with dates.

## Open (non-blocking)

1. **Listen once at normal speed.** The machine checks show no gaps or clipping, but nobody has heard the narration or the mix. Watch for Monteagle, Tresham, Holbeach (the recogniser hears “HOLE-beech”) and Ewens. See `production/audio/ep03-gunpowder-plot/pronunciation-log.md`.
2. **Approval 4** (final render) is Craig's decision and has not been recorded.
