# Narration measurements — ep02-ww1 (script v2, approved)

Built 2026-11-16 with `the-human-story/episode-02-ww1/scripts/tts.py`. Kokoro-82M, voice `bm_george`, en-gb, base speed 1.0, cap 1.17×.
Source script: `production/scripts/ep02-ww1/script.json` (v2), copied unchanged to the engine as `research/script.json` (the engine copy was still ep01's).

## File
- `episode-02-narration.wav`: PCM s16le, 48 kHz, mono, **720.000000 s** (ffprobe).
- md5 `61fdc97e24be1270ebdcd14c3faf05bc`. Identical to engine `output/episode-02-narration.wav`, `public/audio/narration.wav` and `assets/audio/episode-02-narration.wav`.
- 107 sentences, 1,519 words. Every script sentence appears in `narration.json` in order (verified by script: identical list).

## Level (narration stem, before any music mix)
| Measure | Value | Tool |
|---|---|---|
| Integrated loudness | −19.5 LUFS | ebur128 / loudnorm |
| Loudness range | 1.5 LU | ebur128 |
| True peak | **−1.4 dBTP** (≤ −1 dBTP: PASS) | ebur128 peak=true; loudnorm input_tp |
| Sample peak | −1.4 dB | volumedetect max_volume |
| Mean volume | −19.3 dB | volumedetect |

The stem sits about 5.5 LU under the −14 LUFS programme target on purpose, as in ep01. The final mix gets there with music, gain and a limiter.

## Silence (silencedetect noise=−50 dB d=1.5)
| From | To | Length | Where |
|---|---|---|---|
| 0.00 | 1.62 | 1.62 s | s01 lead-in |
| 27.71 | 36.23 | 8.52 s | s01 → s02 (hook / title) |
| 100.33 | 110.83 | 10.50 s | s02 → s03 (s02 is the loosest section, 8.2 s spare) |
| 187.30 | 190.83 | 3.53 s | s03 → s04 |
| 255.55 | 260.81 | 5.26 s | s04 → s05 |
| 318.56 | 320.83 | 2.27 s | s05 → s06 |
| 387.72 | 390.82 | 3.10 s | s06 → s07 |
| 448.25 | 450.83 | 2.58 s | s07 → s08 |
| 498.14 | 500.83 | 2.68 s | s08 → s09 |
| 557.30 | 560.83 | 3.52 s | s09 → s10 |
| 618.57 | 620.83 | 2.25 s | s10 → s11 |
| 713.74 | 720.00 | 6.26 s | end tail |

**All gaps are between sections; none inside a section.** The longest pause between sentences inside a section is 1.0 s (s11, after the Binyon quotation, scripted `pauseAfter`). The music bed must carry the 8.5 s and 10.5 s gaps.

## Per-section fit
Fit@1.0 = (narration length at speed 1.0) ÷ (time available from narration start to budget). Above 1.000 means the builder had to speed up.

| Section | Chapter | Window (s) | Fit@1.0 | Speed used | Narration start | Narration end | Budget | Spare (s) | Sentences | Words | Max inner pause (s) | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| s01 | Two Shots, One Wrong Turn | 0–35 | 1.021 | 1.034 | 1.60 | 27.72 | 27.8 (mustEndBy) | 0.08 | 8 | 61 | 0.60 | OK |
| s02 | Europe Before 1914 | 35–110 | 0.886 | 1.000 | 36.20 | 100.37 | 108.6 | 8.23 | 11 | 157 | 0.50 | OK |
| s03 | Sarajevo and the July Crisis | 110–190 | 0.983 | 1.000 | 110.80 | 187.30 | 188.6 | 1.30 | 11 | 160 | 0.50 | OK |
| s04 | 1914: The War of Movement Stops | 190–260 | 0.956 | 1.000 | 190.80 | 255.59 | 258.6 | 3.02 | 11 | 163 | 0.50 | OK |
| s05 | Life in the Trenches | 260–320 | 1.000 | 1.000 | 260.80 | 318.58 | 318.6 | 0.02 | 9 | 136 | 0.40 | OK |
| s06 | A World War | 320–390 | 0.987 | 1.000 | 320.80 | 387.72 | 388.6 | 0.88 | 11 | 140 | 0.70 | OK |
| s07 | 1916: Verdun and the Somme | 390–450 | 0.994 | 1.000 | 390.80 | 448.27 | 448.6 | 0.33 | 8 | 135 | 0.50 | OK |
| s08 | The Home Front | 450–500 | 0.991 | 1.000 | 450.80 | 498.19 | 498.6 | 0.41 | 8 | 104 | 0.40 | OK |
| s09 | 1917: The Turning Year | 500–560 | 0.978 | 1.000 | 500.80 | 557.35 | 558.6 | 1.25 | 7 | 120 | 0.50 | OK |
| s10 | 1918: The Last Battles | 560–620 | 1.020 | 1.036 | 560.80 | 618.60 | 618.6 | 0.00 | 9 | 128 | 0.60 | OK |
| s11 | The Cost and the Legacy | 620–720 | 0.998 | 1.000 | 620.80 | 713.78 | 714.0 (mustEndBy) | 0.22 | 14 | 215 | 1.00 | OK |

Pauses ×1.00 everywhere; no OVERRUN. Fastest section 1.036× (s10), far under the 1.12× trim threshold and the 1.17× cap. **No cuts needed.**

## Subtitles (`episode-02-subtitles.srt`)
| Check | Result |
|---|---|
| Cue count | 162 (numbered 1–162, sequential) |
| Max characters per line | 42 (limit 42: PASS) |
| Max lines per cue | 2 (PASS) |
| Overlaps / non-positive durations | 0 / 0 |
| Cue duration range | 0.87–6.82 s |
| Max reading speed | 16.6 chars/s |
| First / last cue | 00:00:01,600 "28 June 1914." / 00:11:51,860–00:11:53,783 "And that is another story." |

Captions use the script's display `text` (numerals, e.g. "28 June 1914"); audio uses `say`.

## Pronunciation (checked with Kokoro's en-gb phonemiser, `tokenizer.phonemize`)
- RESPELL additions for ep02: Gavrilo Princip, Passchendaele, Foch, Compiègne (plain-text safety nets; the script's `say` already respells them).
- Two `say` respellings came out wrong in the phonemiser and are corrected in RESPELL at synthesis time, without editing the approved script: "Kom-pyen" gave /kɒmpˈaɪən/ ("comp-EYE-en"), now "Komp-yen" /kɒmpjˈɛn/; "Eep-ruh" gave /ˈiːpɹˈʌ/, now plain "Ypres" /ˈiːpɹə/.
- Checked and left alone (native phonemes fine): Sarajevo /sˌaɹɐjˈeɪvəʊ/, Franz Ferdinand, Verdun /vˈɜːdʌn/, Somme, Ludendorff, Tannenberg, Anzacs, Binyon, Bolsheviks, Czechoslovakia. Schlieffen and Brest-Litovsk do not occur in the script; they were checked anyway and need no respelling.
- Script `say` respellings used as written: Gav-reelo Prin-tsip, Passhen-dale, Fosh, Vair-sigh, Galli-poli (/ɡˈalipˈəʊli/, an acceptable anglicisation; the native form gave /ˈɡalɪpɒli/).
- Years spoken as words ("nineteen fourteen", "nineteen eighteen and nineteen nineteen"); "two thousand and six" and other numbers written out in `say`.
