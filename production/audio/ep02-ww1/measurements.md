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

---

# Music, SFX and reference mix: ep02-ww1 (2026-11-17)

Built with `scripts/music.py`, `scripts/sfx.py` and `scripts/mix.py` (engine `the-human-story/episode-02-ww1/`). Runtime **720.000 s** (21,600 frames). Lean mode: **one measurement pass** (ffmpeg), after one level fix: the hummed carol was lowered 6 dB to keep it "distant and soft", and three short music hits on sentence tails were trimmed.

The narration WAV was not in this fresh container because it is git-ignored. It was rebuilt with `tts.py` (Kokoro set up as in the voice bible). The result is **bit-identical** to the approved build: md5 `61fdc97e24be1270ebdcd14c3faf05bc`, and `narration.json` and the SRT are byte-identical (git clean).

## Files (ffprobe)
| File | Format | Duration | Size |
|---|---|---|---|
| `episode-02-mix-reference.wav` | 48 kHz stereo, 24-bit | 720.000 s | 198 MB (git-ignored) |
| `episode-02-mix-reference-listen.mp3` | MP3 96 kb/s stereo, 48 kHz | 720.02 s | 8.3 MB |
| `episode-02-music.wav` (un-ducked stem) | 48 kHz stereo, 24-bit | 720.000 s | 198 MB (git-ignored) |
| `episode-02-sfx.wav` (SFX stem, 222 cues placed) | 48 kHz stereo, 24-bit | 720.000 s | 198 MB (git-ignored) |
| engine `public/audio/mix.wav`, `music.wav` (ducked), `sfx.wav` | 48 kHz stereo, 16-bit | 720.000 s each | 132 MB each (git-ignored) |
| engine `public/sfx/NNN-<shot>-<name>.wav` | 222 files, 48 kHz stereo 16-bit | — | 177 MB (now git-ignored) |

`public/audio/mix.wav` decodes to the same 16-bit samples as the 24-bit reference (cmp: identical).

## Reference mix (`public/audio/mix.wav`; ffmpeg ebur128 peak=true, loudnorm, volumedetect)
| Measure | Value |
|---|---|
| Integrated loudness | **−14.0 LUFS** (loudnorm −14.09; target about −14: PASS) |
| Loudness range | 1.6 LU |
| True peak | **−1.5 dBTP** (≤ −1 dBTP: PASS) |
| Sample peak / mean | −1.5 dB / −16.7 dB |
| silencedetect noise=−50 dB d=1.0 | one window only: **388.75–390.01 (1.27 s)**. This is the storyboard's deliberate 1.2 s near-silence before the s07 ink (S06-07). Nothing else ≥ 1 s. |
| Listen MP3 | −14.5 LUFS, −1.6 dBTP (encoder only; not the master) |

## Special cues (checked on the stems)
| Cue | Check | Result |
|---|---|---|
| **11 o'clock silence, S10-06** | `music.wav` and `sfx.wav`, 609.50–610.50: max_volume | **−91 dB (digital zero) on both: PASS**. SFX resume at 610.50 (watch tick, birdsong). Music stays out until s10.b8 (612.83), then one sustained cello note. Narration b7 ("At 11 o'clock, the guns fell silent", from 609.475) runs over the window, as the narration timings are fixed. |
| Distant guns stop at 11:00 | last gun cue 606.4, hard-cut at 609.50 | PASS |
| Single instrument, no percussion: S06-06–S06-07 (357.19–388.80) | per-stem peaks in `output/music-stems` | solo cello only. Every other stem (perc included) is at −240 dB: PASS |
| S07-04 (418.30–428.00) | same | music out at the whistles (418.6–421.0), then one sustained cello note. All other stems −240 dB: PASS |
| S11-05 (668.20–685.80) | same | solo cello, plus the bugle phrase in 684.72–685.72. All other stems −240 dB: PASS |
| S07-05 / S08-04 / S11-04 | same | piano only: PASS |
| Hummed "Silent Night" | 231.2–249.3 | A major, 3 male hummers, low-passed and reverberant (distant). Un-ducked −28 LUFS over the window, below the surrounding score. It grows over the first 20 eighths, breaks off at the officer's whistle (248.4), then the solo violin finishes the tune 249.6–259.7. |
| s02→s03 tail | 100.4–110.0 | pizzicato on each of 8 domino clacks (100.45 + 0.5 k) and 7 chalk dominoes (104.5 + 0.5 k), strings build, resolve with timpani and bell on the Sarajevo glow at **108.0**, then the s03 bed at 110 |
| Title sting | 27.95 (≥ 27.8: PASS) | timpani roll, then the hit at 28.9; horn channel motif; settles into the s02 bed by 34.5 |
| Pistol reports | 13.50 / 13.90 and 126.95 / 127.35 | dry, short, distant: no reverb, low-passed 3.2 kHz. Music out 13.45–14.85 and 126.9–127.9 |
| Restraint | cue list | no close explosion, impact or bullet-hit cue anywhere. Artillery is only `g_guns_distant` / `g_boom_distant` with far ≥ 0.92 |

## Balance (computed in `mix.py`, BS.1770 K-weighted; `output/mix-stats.json`)
| Measure | Value |
|---|---|
| Ducking | **−12 dB under every sentence** (ep01 used −9). Raised-cosine attack 0.30 s before the word, release 0.9 s |
| Narration, speech blocks only (after the 2:1 glue compressor, before master gain) | −21.9 LUFS |
| Music (ducked), same speech blocks | −38.5 LUFS → **16.7 dB under the narration** (ep01: 12.0) |
| SFX, same speech blocks | −47.3 LUFS (25 dB under) |
| Narration minus music, 400 ms blocks during speech | **median 18.0 dB, 5th percentile 9.8 dB** (ep01: 13.0 / 5.3) |
| Narration minus (music + SFX) | median 17.5 dB, 5th percentile 9.4 dB |
| Music in narration gaps and tails (un-ducked) | −21.7 LUFS |
| Master gain / limiter | +7.82 dB. Peak gain reduction 4.0 dB. > 1 dB of reduction only 0.45 % of the time |

The worst single 400 ms blocks are at 17.9 (−4.6 dB), 532.0 (−4.3), 12.9 (−3.4), 18.0 (−3.4), 159.5 (−3.2) and 113.3 s (−2.8). Each one sits on a sentence tail or a breath, where the swelling music meets the last syllable (for example 17.9–18.3 is "…at war." ending at 18.04, and 532.0 is the swell into Passchendaele). They are not masked words, but QC should listen there. Fix if needed: a local −3 dB on that cue in `music.py`.
