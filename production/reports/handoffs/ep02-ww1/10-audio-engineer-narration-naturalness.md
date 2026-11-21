# Handoff — ep02-ww1 — narration naturalness (v3)

- **From:** audio-engineer
- **To:** director (cc: video-editor, animator, environment-designer, quality-control)
- **Date:** 2026-11-17
- **Status:** AWAITING REVIEW (user listen)

## Deliverables
- `production/audio/ep02-ww1/narration-before-after.mp3` — 90.3 s A/B comparison. A low beep comes before OLD and a high beep before NEW. Order: s03.b7 "11 p.m.", s01.b1–b2 "wrong turn, / and stops near a 19-year-old", s03.b1 "Gavrilo Princip, a 19-year-old Bosnian Serb", s09.b4 "Passchendaele", s10.b6 "5 a.m. … Compiègne".
- `production/audio/ep02-ww1/episode-02-mix-reference-listen.mp3` — replaced (full 720 s v3 mix, 96 kb/s).
- `production/audio/ep02-ww1/episode-02-narration.wav`, `narration.json`, `episode-02-subtitles.srt` — v3. Narration md5 `b418917f…`, 720.000 s.
- Engine: `public/audio/narration.wav`, `public/audio/music.wav`, `public/audio/mix.wav` (the render master), `src/timeline/narration.json` (identical to the production copy), `output/episode-02-subtitles.srt`, `output/tts-v3-report.json` (groups and the list of pause fixes).
- `the-human-story/episode-02-ww1/scripts/tts.py` (v3) and `scripts/narration-anchors-v2.json` (the v2 sentence starts used as timing anchors).
- `production/audio/voice-bible.md` — new delivery mechanics and spoken-form rules. `production/audio/ep02-ww1/measurements.md` — v3 section appended.

## Summary
- **Root cause of "P … M":** the spoken form "eleven p.m." became the phonemes `pˈiː.ˈɛm.`. Kokoro treats each full stop as the end of a sentence (falling tone plus a pause). "5 a.m." had the same fault.
- **Root cause of the general robotic sound:** every script entry was synthesised alone, so each one started with the same reset intonation. Even half-sentences split for captions ("…takes a wrong turn," / "and stops near…") were read as separate utterances. All pauses were a uniform 0.32 s. Hyphenated respellings and number words also carried two or three primary stresses.
- **Fixes:**
  - Spoken forms are fixed through a new `PHONEMES` (IPA) table, plus `RESPELL` and `speakable()` rules.
  - Narration is now synthesised in groups of up to 3 related sentences, so intonation carries across the joins. Each group is split at its natural pauses.
  - The model's own varied pauses are kept.
  - Over-long pauses inside a sentence are capped.
  - Every piece now has a lead-in, a tail and fades.
  - The v2 sentence starts are used as anchors, so the picture stays in sync.
- Voice (`bm_george`), script text and subtitle text are all unchanged.

## Spoken-form fixes (old phonemes or spoken form → new)
| Where | Old | New |
|---|---|---|
| s03.b7 "11 p.m." | eleven `pˈiː.ˈɛm.` (two sentence ends) | eleven `pˌiːˈɛm`, one fluent word: "eleven pee-em London time" |
| s10.b6 "5 a.m." | five `ˈeɪ.ˈɛm.` | five `ˌeɪˈɛm` |
| s01.b0, s03.b0/b3/b5, s10.b1, s11.b10 dates | `twˈɛntiˈeɪtθ`, `twˈɛntiθˈɜːd`, `twˈɛntifˈɜːst` (one glued word with 2 stresses) | "twenty eighth", "twenty third", "twenty first" with normal stress |
| s03.b3 "48 hours", s07.b4 "57,000", s11.b1 "21 million" | `fˈɔːtiˈeɪt`, `fˈɪftisˈɛvən`, `twˈɛntiwˈɒn` | "forty eight", "fifty seven", "twenty one" |
| s01.b2, s03.b1 "19-year-old" | `nˈaɪntiːnjˈiəɹˈəʊld` (3 stresses) | `nˈaɪntiːn jɪəɹˌəʊld` ("NINEteen-year-old") |
| Austria-Hungary (×6), Austro-Hungarian, ever-larger | `ˈɒstɹiəhˈʌŋɡəɹi` glued | "Austria Hungary", "Austro Hungarian", "ever larger" |
| s03.b1 Gavrilo Princip | "Gav-reelo Prin-tsip" → `ɡˈavɹˈiːləʊ pɹˈɪntsˈɪp` (4 stresses) | `ɡavɹˈiːləʊ pɹˈɪntsɪp` |
| s06.b2 Gallipoli | "Galli-poli" → `ɡˈalipˈəʊli` | `ɡəlˈɪpəli` (British "ga-LIP-o-li"; closes the v2 QC note) |
| s09.b4 Passchendaele | "Passhen-dale" → `pˈashɛndˈeɪl` ("pass-HEN-dale", a spoken h) | `pˈaʃəndeɪl` ("PASH-en-dale") |
| s10.b6 Compiègne | `kˈɒmpjˈɛn` (2 stresses) | `kɒmpjˈɛn` |
| s11.b10 Versailles | `vˈeəsˈaɪ` (2 stresses) | `veəsˈaɪ` ("vair-SIGH") |
| s10.b2 Foch | "Fosh" → `fˈɒʃ` | unchanged phonemes, now set explicitly |
| s04.b9 Rifleman | `ɹˈaɪflɛmən` ("rifle-MEN") | `ɹˈaɪfəlmən` |
| s09.b5 Tsar | `tsˈɑː` | `zˈɑː` (British "zar") |
| s11.b7 Binyon | `bˈɪnɪən` | `bˈɪnjən` |
| s03.b2, s04.b9, s07.b5, s08.b3, s11.b11 quotation marks | `"` passed to the model | dropped from the spoken form |
| s09.b0 "1917 was…" | "nineteen seventeen" lower-case start | capitalised (no audible change) |

I checked these and left them native: Sarajevo, Franz Ferdinand, Sophie, Bosnia, Ypres, Mons, Marne, Verdun, Somme, Tannenberg, Anzacs, Amiens (/ˈamiənz/, the standard English form), Ludendorff, Bolsheviks, Poplar, TNT, U-boats, Czechoslovakia, Entente. All other numbers and dates were already British words in `say`, for example "the twenty-eighth of June, nineteen fourteen", "fourteen hundred" and "two thousand and six".

## Prosody changes (tts.py v3)
1. **Group synthesis:** up to 3 sentences, or 330 phonemes, in one Kokoro pass. A group ends after any `pauseAfter` ≥ 0.5 s and at the music sync beats s10.b7 and s11.b10. Result: 107 entries in 50 groups, and every split succeeded (0 fallbacks).
2. **Splitting:** each join is predicted from the solo durations. The cut goes in the middle of the longest quiet run within ±25 % of the prediction, and each piece is sanity-checked against its solo length.
3. **Pauses:**
   - Inside a group, the model's own pause is kept (it varies with the text). The script's `pauseAfter` is a minimum, plus at most 0.25 s of give towards the v2 time.
   - Between groups, the pause is `pauseAfter` (default 0.36 s), plus at most 0.6 s of give towards the v2 start.
   - Gaps now run from 0.12 s (comma joins) to 1.10 s, median 0.55 s.
4. **Pauses inside a sentence:** `tighten_gaps()` shortened 83 of them. Comma and colon pauses over 0.32 s become 0.27 s, and internal full-stop pauses are capped at 0.48 s. The ffmpeg check (−45 dB, 0.35 s) now finds hits only at internal full stops of two-sentence entries (0.39–0.48 s). None remain at a comma, colon or abbreviation.
5. **Speed:**
   - Groups read about 5 % faster than single sentences, so the base speed is 0.96.
   - Speeds per section: s01 0.97, s02 0.97, s05 0.98, s11 0.97, s10 1.04 (v2: 1.036), all others 0.96. Nothing is above 1.05; the cap was cut from 1.17 to 1.05.
   - The fitting order is: slightly faster read (≤ 1.00), then tighter pauses, then speed (≤ 1.05).
6. **Joins:** each piece has a 25 ms lead-in, about 100 ms release tail, 8 ms fade-in and 30 ms fade-out. Measured |sample| is 0 within ±5 ms of every sentence edge, so there are no clicks or clipped ends. Levelling is now per group rather than per sentence, so the natural dynamics inside a group survive.

## Beats moved > 0.5 s (video editor: please re-snap)
| Beat | v2 start | v3 start | Δ |
|---|---|---|---|
| s03.b10 "Some put the main responsibility…" | 175.045 | 174.471 | −0.57 |
| s10.b2 "But the Allies held…" | 573.937 | 573.267 | −0.67 |
| s10.b4 "In the Hundred Days…" | 590.646 | 589.506 | −1.14 |
| s10.b5 "Germany's allies collapsed…" | 594.738 | 593.500 | −1.24 |
| s10.b6 "At about 5 a.m. on 11 November…" | 601.763 | 601.089 | −0.67 |

All other 102 starts move by 0.5 s or less. Section starts are unchanged and the total is 720.000 s.

Held exactly: s10.b7 "At 11 o'clock" stays at 609.475, so the 1.0 s silence at 609.5 is unchanged. s11.b10 starts at 685.682 (v2 685.664), after the bugle at 684.70–685.70; s11.b9 ends at 684.682.

The s02 narration ends at 100.30, clear of the domino clacks at 100.45. Inside s03.b1 the words sit 0.2–0.3 s earlier than in v2, relative to the pistol reports at 126.95/127.35. That is within tolerance, so I did not move the cue.

## Measurements (one pass)
- **Master `mix.wav`:** 720.000 s, −14.1 LUFS integrated (loudnorm −14.09), **−1.50 dBTP**, LRA 2.0 LU. The only silence ≥ 1 s at −50 dB is the storyboard's 388.74–390.01.
- **Narration stem:** −19.9 LUFS, −1.4 dBTP.
- **Music under speech:** 16.5 dB under (LUFS over the speech blocks). Narration minus music over 400 ms blocks: median 18.0 dB, 5th percentile 10.7 dB (v2: 9.8).
- **Worst blocks:** 572.6 (−4.4 dB), 159.3 (−3.7), 408.2 (−2.5). All fall on the release tail after a last word, not inside words.
- **Music + SFX at 609.5–610.5:** digital zero.
- **SRT:** 162 cues, at most 42 characters per line. Caption text is byte-identical to v2.

## Changes to inputs / assumptions
- The script (`production/scripts/ep02-ww1/script.json` and the engine copy `research/script.json`) is not edited. Every fix is in `tts.py`.
- `music.py` and `mix.py` were re-run with unchanged code, because the ducking follows `narration.json`. `sfx.py` does not read the narration, so the SFX stem is unchanged.
- The tts cache gained v3 entries in `assets/audio/tts-cache` (git-ignored).
- To rebuild in a fresh container, run `python3 scripts/tts.py`: about 9 min cold, about 1 min warm. It needs `scripts/narration-anchors-v2.json`.

## Blockers / issues
- [info] **Limits of Kokoro.** These are better but not perfect:
  - Kokoro has no breaths and only a narrow emotional range, so the sombre passages (s06 genocide, s11 poem) are restrained but not truly "moved".
  - Sentence starts at a group start (50 places) still begin from a fresh intonation, though much less often than the 107 places before.
  - "pee-em" is now fluent. If the user prefers it, "eleven at night, London time" is a one-line `say` override.
  - Versailles is still anglicised "vair-SIGH" (channel convention from ep01).
  - A different provider would change the channel voice and needs user approval (ElevenLabs had 0 credits on 2026-11-15).
- [minor] I verified this by measurement and phoneme inspection only, not by ear. The user or QC should listen to `narration-before-after.mp3`, then to the full listen copy.
- [minor] ep01's `tts.py` is still the old per-sentence builder. Port v3 before any ep01 re-voice; it would need its own anchors file.

## Requests for other agents
- video-editor: re-snap the 5 beats above (all in s03 and s10) from `src/timeline/narration.json`. Keep using `public/audio/mix.wav` as the only audio track.
- animator / environment-designer: no action, unless a lip-sync or caption-driven move keys to s10.b2–b6.
- quality-control: listen at 160 (11 p.m.), 127 (Princip), 333 (Gallipoli), 537 (Passchendaele), 601–612 (5 a.m. to 11 o'clock), 675–686 (poem and bugle).

## Recommended next action
- Director: send the user `narration-before-after.mp3` and the new `episode-02-mix-reference-listen.mp3` for approval, then route to the video-editor for the beat re-snap.
