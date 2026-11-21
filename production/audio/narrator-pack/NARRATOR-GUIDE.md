# The Human Story · Narrator guide

Pronunciation, pacing and breaks for the channel narrator. Written 19 November 2026 from the Episode 3 recording, which Craig approved as the channel voice.

## What's in this pack

| File | What |
| --- | --- |
| `narrator-sample-opening.mp3` | The first 34.6 s of Episode 3, narration only (no music): two connected sentence groups with the house pacing |
| `narrator-sample-names.mp3` | 36.6 s reel of seven short lines with the difficult names, 0.8 s apart (list below) |
| `NARRATOR-GUIDE.md` / `.pdf` | This guide |
| `voice-bible.md` | The channel voice rules (engine, spoken-form rules, checks) |
| `voice-direction-ep03.md` | Episode 3 direction and pronunciation sources |
| `pronunciation-log-ep03.md` | Episode 3 name-by-name decisions, evidence and open questions |

## The voice

- **Engine and voice:** Kokoro-82M, voice **`bm_george`** (British English male), language `en-gb`. The same voice is used for every episode; changing it needs Craig's approval.
- **Speed: 0.99.** Episode 2 used 0.96 with an older renderer. The approved Episode 3 setting is 0.99. Don't go above 1.05 to make a section fit; cut words instead.
- **Sound:** confident, warm and conversational, like a good documentary narrator talking to one person. A little more weight for big moments. Slower and quieter in feel for tragedy, but do this with **pauses, not a different voice**.
- **Render in connected groups:** render related sentences together in one pass (Episode 3: up to about 420 phonemes per group) so the intonation carries from one sentence to the next instead of resetting. Never render the halves of one sentence separately.

## Breaks between words and sentences

| Where | Break | How it is made |
| --- | --- | --- |
| Comma, colon, dash inside a sentence | short, about 0.15–0.30 s | The voice's own phrasing. Don't add silence |
| Full stop between sentences in the same group | about 0.30–0.55 s | The voice's own pause. Keep it; don't trim it |
| Between sentence groups in a section | **+0.21 s** of silence added after the group | Renderer setting |
| End of a section (a paragraph or chapter) | **+0.34 s** of silence added | Renderer setting |
| Change of scene, after a sensitive line | a longer beat | End the group there, so the line gets its own landing, and let the edit hold the picture. Don't stretch silence inside the narration |
| Chapter change | silent picture beat (chapter card, 3 s) | Done in the edit, not in the voice |

**Measured in the approved Episode 3 recording** (all pauses of 0.12 s or more at −40 dB, 288 in 9 min 24 s): median **0.33 s**, middle half 0.24–0.45 s, 95% under 0.52 s, longest 0.62 s. Nothing longer than 0.62 s inside the narration.

Rules of thumb:

- Never fill a chapter by stretching silences; the picture covers any gap.
- No mid-word or mid-phrase cuts. Edits happen only at group boundaries.
- Breaths stay as the voice makes them.

## Spoken form (what the narrator says vs what the caption shows)

The captions keep the normal written form. Only the spoken text changes.

1. **Years like a Brit says them:** 1605 → “sixteen oh five”, 1606 → “sixteen oh six”, 1912 → “nineteen twelve”, 2006 → “two thousand and six”.
2. **Dates in full:** 26 October 1605 → “the twenty-sixth of October, sixteen oh five”; 5 November → “the fifth of November”.
3. **Numbers as words, the British way:** 1,500 → “fifteen hundred” or “one thousand five hundred” (pick one per episode and keep it); 306 → “three hundred and six”; % → “per cent”; ranges “nine to ten million”.
4. **No full stops inside a spoken phrase.** The voice treats every “.” as the end of a sentence. Write “eleven forty at night” (or use the p.m. phoneme override), “Saint” not “St.”, “the US” not “U.S.”, “around” not “c.”.
5. **Monarchs:** James I → “James the First”, James VI → “James the Sixth”, Charles I → “Charles the First”.
6. **No hyphens inside spoken number words or long compounds:** “twenty sixth”, not “twenty-sixth”. Hyphens make the voice stress both halves.
7. **Quotation marks are not spoken.** Drop them from the spoken text.
8. Before rendering, print the phonemes for every group and look for stray full stops, spelled-out letters and words with two main stresses.

## Pronunciation: names

How each name is sent to the voice. IPA is what the renderer receives. Overrides go in `scripts/voice_sample.py` (`overrides` table). Longer keys must come first.

| Name | Say it | IPA sent | Status | Hear it |
| --- | --- | --- | --- | --- |
| Catesby | KAYTS-bee | `kˈeɪtsbi` | override, Cambridge Dictionary | names reel, line 1 |
| Warwickshire | WORR-ik-shuh | `wˈɒɹɪkʃə` | override, Cambridge | line 1 |
| Guy Fawkes | guy FORKS (no r sound) | `ɡˈaɪ fˈɔːks` | override, Cambridge | opening sample, end |
| Hoxton | HOCK-stun | `hˈɒkstən` | override, Cambridge | line 2 |
| Monteagle | MON-tee-gul | default `mˈɒntiːɡəl` | **unresolved**: no reference found; keep until Craig hears it | lines 2 and 4 |
| Tresham | TRESH-um | default `tɹˈɛʃəm` | **unresolved**: no reference found | line 3 |
| Cecil | SESS-ul | default `sˈɛsəl` | matches Cambridge UK /ˈses.əl/ | line 4 |
| Salisbury | SAWLZ-buh-ree | `sˈɔːlzbəɹi` | override, Cambridge | line 4 |
| Knyvett / Knyvett’s | NIV-it / NIV-its | `nˈɪvɪt` / `nˈɪvɪts` | override, Wikipedia /nɪvɪt/ | line 5 |
| Ralph Ewens | RALF YOO-unz | default `ɹˈalf jˈuːənz` | **unresolved**: “Ralph” can also be RAYF in older British use | line 6 |
| Holbeach House | HOLE-beech (as voiced) | default `hˈɒlbiːtʃ` | **unresolved**: the place is also written Holbeche; a listener hears “whole beach” | line 7 |

**Names reel line by line:**
1. “The man at the centre of the conspiracy was Robert Catesby, a gentleman from Warwickshire.”
2. “Lord Monteagle received the warning at his house in Hoxton”
3. “Francis Tresham, a conspirator and Monteagle’s brother-in-law”
4. “Monteagle took it to Robert Cecil, Earl of Salisbury, the king’s chief minister.”
5. “Sir Thomas Knyvett’s party found gunpowder and took a man into custody.”
6. “Its clerk, Ralph Ewens, made a note in the margin of the Journal.”
7. “By the eighth of November the flight had ended at Holbeach House in Staffordshire.”

### Next episode (Titanic): names to check before rendering

These are proposed targets only. They must be checked against a pronunciation source, and then heard, before the full render.

| Name | Proposed target | Note |
| --- | --- | --- |
| Ismay (J. Bruce Ismay) | IZ-may | check the default; it may say “ISS-may” |
| Rostron (Arthur Rostron) | ROSS-trun | |
| Queenstown | KWEENZ-town | today Cobh (COVE); say the 1912 name if the script uses it |
| Cherbourg | SHAIR-boorg | British usage; avoid an American “SHER-burg” |
| Carpathia | kar-PAY-thee-uh | |
| Californian | kal-i-FOR-nee-un | British non-rhotic |
| Harland & Wolff | HAR-lund and WOOLF | say “and”, not “ampersand” |
| Southampton | sowth-AMP-tun | |
| Titanic | tie-TAN-ik | |
| 11.40 p.m. | “eleven forty at night” or the p.m. override | no “P. M.” letters |

## How to check a finished recording

1. **Listen once at normal speed**, start to end, with the names table in front of you.
2. **Speech recognition check:** run faster-whisper (`small.en`, word timestamps) on the narration. Names it hears oddly (Episode 3: “whole beach”, “Ewins”) are worth a human listen. Episode 3 matched 96.9% of the script words.
3. **Silence check:** `ffmpeg -i narration.wav -af silencedetect=n=-45dB:d=0.65 -f null -` should report nothing inside the narration (nothing over 0.62 s in Episode 3).
4. **Levels:** no clipping. Episode 3's raw narration was mean −24.6 dB, peak −6.8 dB. The final mix is mastered to −14 LUFS with the narration about 20 dB above the music.

## Fixing one name later

Change the override, then re-render **only the groups that contain the name**. Cut the old recording into the phrase cache with `tools/seed-phrase-cache.py … --skip N`. Pin the grouping with `--groups-from OLD_AUDIT.json` so the other sentences don't regroup. Then rebuild the plan and captions. Exact commands are in `production/scripts/ep03-gunpowder-plot/HANDOVER.md` (Milestone 3 build and restart).
