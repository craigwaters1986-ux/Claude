# Narration measurements — ep01-ww2 (script v3, approved)

Built 2026-11-15 with `the-human-story/episode-01-ww2/scripts/tts.py`. Kokoro-82M, voice `bm_george`, en-gb, speed cap 1.17×.
Source script: `production/scripts/ep01-ww2/script.json` (v3), identical to the engine copy `research/script.json` (checked with diff).

## File
- `episode-01-narration.wav`: PCM s16le, 48 kHz, mono, **600.000000 s** (ffprobe).
- md5 `6db778fa6ccdab345325389e191ec30e`. Identical to engine `output/`, `public/audio/narration.wav` and `assets/audio/`.
- Covers 98 sentences, 1,188 words. Every sentence in the script appears in `narration.json` in order (verified by script).

## Level (narration stem, before the music mix)
| Measure | Value | Tool |
|---|---|---|
| Integrated loudness | −19.6 LUFS (loudnorm: −19.67) | ebur128 / loudnorm |
| Loudness range | 1.6 LU | ebur128 |
| True peak | **−1.38 dBTP** (≤ −1 dBTP: PASS) | loudnorm input_tp; ebur128 peak=true −1.4 |
| Sample peak | −1.4 dB | volumedetect max_volume |
| Mean volume | −19.6 dB | volumedetect |

The first build peak-normalised to 0.89 and measured −0.98 dBTP, a fail. `tts.py` now normalises to 0.85, and the figures above come from that build.
The stem is about 5.7 LU below the −14 LUFS programme target on purpose. The final mix gets there with music, gain and a limiter.

## Silence (silencedetect noise=−50 dB)
Gaps over 3 s. All of them fall **between sections**, where the music bed will carry them.
| From | To | Length | Between |
|---|---|---|---|
| 22.76 | 31.22 | 8.46 s | s01 → s02 (end of hook / title) |
| 260.96 | 270.83 | 9.87 s | s05 → s06 |
| 380.72 | 390.83 | 10.11 s | s07 → s08 |
| 442.53 | 450.83 | 8.30 s | s08 → s09 |
| 507.41 | 510.83 | 3.42 s | s09 → s10 |

**No silence over 3 s inside any section.** At d=1.5 s, the only extra gaps found are section lead-ins/tails: 0–1.62, 88.5–90.8, 148.3–150.8, 208.6–210.8, 328.2–330.8, 567.9–570.4, 597.9–600.0. The longest pause between sentences inside a section is 0.7 s.

## Per-section fit
| Section | Chapter | Window (s) | Speed | Narration start | Narration end | Budget (mustEndBy) | Sentences | Words | Max inner pause (s) | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| s01 | The Hook | 0–30 | 1.006 | 1.60 | 22.77 | 22.8 | 8 | 47 | 0.7 | OK |
| s02 | The World After World War I | 30–90 | 1.075 | 31.20 | 88.53 | 88.6 | 10 | 130 | 0.5 | OK |
| s03 | Hitler's Rise to Power | 90–150 | 1.154 | 90.80 | 148.29 | 148.6 | 11 | 125 | 0.4 | OK |
| s04 | World War II Begins | 150–210 | 1.007 | 150.80 | 208.57 | 208.6 | 10 | 123 | 0.5 | OK |
| s05 | Europe Falls | 210–270 | 1.000 | 210.80 | 261.00 | 268.6 | 10 | 111 | 0.4 | OK |
| s06 | The War Becomes Global | 270–330 | 1.000 | 270.80 | 328.16 | 328.6 | 9 | 120 | 0.4 | OK |
| s07 | The Turning Points | 330–390 | 1.000 | 330.80 | 380.75 | 388.6 | 8 | 113 | 0.4 | OK |
| s08 | D-Day and the Liberation of Europe | 390–450 | 1.000 | 390.80 | 442.54 | 448.6 | 8 | 115 | 0.4 | OK |
| s09 | The Fall of Nazi Germany | 450–510 | 1.000 | 450.80 | 507.45 | 508.6 | 9 | 119 | 0.7 | OK |
| s10 | How World War II Finally Ended | 510–570 | 1.000 | 510.80 | 567.91 | 568.6 | 9 | 118 | 0.5 | OK |
| s11 | The Human Cost and the Legacy | 570–600 | 1.000 | 570.40 | 597.96 | 598.3 | 6 | 67 | 0.4 | OK |

Pauses ×1.00 in every section. No OVERRUN. Matches the scriptwriter's fit (s01 1.006×, ends 22.77 s; s11 ends 597.96 ≤ 598.3). s03 at 1.154× is the fastest, within the 1.17× cap but close to it.

## Subtitles (`episode-01-subtitles.srt`)
| Check | Result |
|---|---|
| Cue count | 140 (numbered 1–140, sequential) |
| Max characters per line | 42 (limit 42: PASS) |
| Max lines per cue | 2 (PASS) |
| Overlaps | 0 |
| Non-positive durations | 0. Timings monotonic |
| Cue duration range | 0.95–5.98 s (0.95 s = "It didn't work.", its true spoken length) |
| Max reading speed | 18.2 chars/s |
| First / last cue | 00:00:01,600 "Summer, 1939." / 00:09:54,879–00:09:57,960 |

The first build had 122 cues and 27 lines over 42 characters (max 49). `caption_chunks` in `tts.py` now does a balanced split that guarantees each cue fits 2 × 42.

## Pronunciation (speakable() output checked)
- RESPELL applied: Versailles → "Vair-sigh" (s02 ×2), Luftwaffe → "Luft-vaffa" (s05), Sudetenland → "Soo-dayten-land" (s03), El Alamein → "El Ala-mayn" (s07).
- Years are spoken as words, e.g. "Summer, nineteen thirty-nine.", "In November nineteen eighteen", "On the first of September, nineteen thirty-nine".
- Dates and numbers in `say` are written out, e.g. "the twenty-second of June, nineteen forty-one", "three hundred and thirty thousand", "one hundred and fifty-six thousand", "sixty million".
- No pronunciation fixes were needed. Neither the script nor RESPELL was changed.
