# Episode 3 pronunciation log

Recorded 18 November 2026 against `media/narration-draft.wav` (564.368 s) and its audit. The audit phonemes show what the model was sent. Nobody has listened to the finished audio yet, so every row below is evidence about intent, not a check of what the recording sounds like. Craig or the next session should listen to the groups listed in the last column before approval.

| Name | Sent to the model | Target | Evidence | Decision | Groups to hear |
| --- | --- | --- | --- | --- | --- |
| Catesby | override `kˈeɪtsbi` | KAYTS-bee | Cambridge Dictionary (see voice-direction.md) | keep | 5, 7, 13, 17, 19, 26 |
| Guy Fawkes / Fawkes | override `ɡˈaɪ fˈɔːks`; bare "Fawkes" `fˈɔːks` | guy forks | Cambridge Dictionary | keep | 1, 5, 14, 18, 19, 20, 26, 27 |
| Warwickshire | override `wˈɒɹɪkʃə` | WORR-ik-shuh | Cambridge Dictionary | keep | 5 |
| Hoxton | override `hˈɒkstən` | HOCK-stuhn | Cambridge Dictionary | keep | 9 |
| Salisbury | override `sˈɔːlzbəɹi` | SAWLZ-buh-ree | Cambridge Dictionary | keep | 12 |
| Cecil | default `sˈɛsəl` | SESS-uhl | Cambridge gives UK /ˈses.əl/, which matches | keep, no override needed | 12 |
| **Knyvett** | default `nˈaɪvəts` (NY-vets) | NIV-it | Wikipedia's article on Thomas Knyvet, 1st Baron Knyvet gives /nɪvɪt/. Geneanet's entry for the variant Knivett derives it from a Norman French form of "Knight", which fits a short i | **change**: overrides `Knyvett` → `nˈɪvɪt`, `Knyvett’s` → `nˈɪvɪts` (voiceless s). Needs a re-render of group 14 | 14 |
| Monteagle | default `mˈɒntiːɡəl` (MON-tee-gul) | unresolved | No pronunciation reference found. The searches returned history pages only | **unresolved**. Keep the default and listen; if it sounds wrong, ask Craig which form he wants | 0, 1, 9, 10, 11, 12, 22, 27 |
| Tresham | default `tɹˈɛʃəm` (TRESH-um) | unresolved | No pronunciation reference found | **unresolved**, keep the default and listen | 11, 13 |
| Holbeach House | default `hˈɒlbiːtʃ` (HOL-beech) | unresolved | The house is listed by Historic England as Holbeche House, also written Holbeach or Holbeache. The town of Holbeach in Lincolnshire is a different place. No source found for how the Staffordshire house is said | **unresolved**, keep the default. Captions keep "Holbeach House" as in the script; mention "Holbeche" in the description | 18 |
| Ralph Ewens | default `ɹˈalf jˈuːənz` (RALF YOO-uh-nz) | unresolved | No source found for either word. "Ralph" has both RALF and RAYF in British use | **unresolved**, keep the default and listen | 15, 26 |

## Milestone 3 (18 November 2026): re-render and recognition check

- Group 14 was re-rendered with the Knyvett override (`nˈɪvɪts`); it is 21.021 s (was 21.091 s). Sentence grouping is now pinned to the earlier audit with `voice_sample.py --groups-from`, because the shorter phoneme string had moved one sentence from group 15 into group 14 and invalidated the cached phrases. All other 28 groups are bit-identical to the draft. New narration total: 564.299 s.
- A speech recogniser (faster-whisper small.en, word timestamps; `narration-words.json`) was run over the whole recording. It is not a substitute for a listen, but it shows how a listener hears the names: Knyvett’s → “nivets” (NIV-its, as intended), Fawkes → “forks” (correct British reading), Monteagle, Tresham, Catesby, Cecil and Salisbury → recognised as spelled, Ewens → “Ewins” (YOO-ins), Holbeach → “whole beach” (HOLE-beech rather than HOL-beech). 96.9% of script words matched the recognised words; the one unrecognised stretch (“The king was alive … to the plotters”, group 17) was re-checked and is present in the audio.
- Still unresolved, and still worth a human listen: Monteagle, Tresham, Holbeach House (HOLE-beech vs HOL-beech), Ralph Ewens.

## Signal checks (do not replace listening)

- Mean level −24.6 dB, peak −6.8 dB, so no clipping.
- The only silences of 0.5 s or more at −45 dB are 20 pauses inside phrases, each 0.50 to 0.60 s. None is longer, so nothing is dropped or stalled.
- Detected pauses at −38 dB line up with the commas and full stops in the text for 157 of 166 expected positions (95%), so the delivery follows the punctuation.

## Re-render route for the Knyvett fix

`tools/seed-phrase-cache.py` cuts the existing WAV back into numbered phrase files, bit-identical to the original render (verified by reassembling all 29 and comparing with the draft). Seed a fresh output directory while skipping group 14, then run `voice_sample.py` against it so only group 14 is rendered. Re-run `tools/build_plan.py` afterwards. The last silent beat in each section absorbs any change in length.
