# Changelog — ep01-ww2 script v2 → v3 (hook pass)

_Scriptwriter, 2026-11-15. Scope set by the user via the Director: rewrite s01 (the hook, 00:00–00:30) only, plus QC suggestion S2 in s10. No other section, `lead`, `start`, `end`, `mustEndBy` or `say` field was changed._

Inputs: QC report `production/reports/qc/ep01-ww2/qc-script-v2-20261115.md` (MINOR #1, #2, #4; SUGGESTION S2); hook review `production/exports/ep01-ww2/youtube/hook-review.md`; fact-checks `production/research/ep01-ww2/fact-check-script-part1.md` (P1) and `fact-check-script-part2.md` (P2).

## s01 — old vs new

**v2 (54 words, 1.139×):**

> Summer, 1939. Across much of Europe, life seems to go on as normal. But within weeks, the world would be plunged into the deadliest war in human history. Countries would fall. Cities would burn. Tens of millions of people would die. So how did the world get here? And how did it finally end?

**v3 (47 words, 1.006×):**

> Summer, 1939. Across much of Europe, life seems normal. Within weeks, Europe will be at war, in what will become the deadliest war in human history. Countries will fall. Cities will burn. Tens of millions will die. So how did it start? And how did it end?

| # | v2 sentence | v3 sentence | Why | Fact basis |
|---|---|---|---|---|
| 1 | "Summer, 1939." (pause 0.7) | unchanged | Brief: keep the opening beat; the visuals open on a 1939 street. | P1 #1 VERIFIED |
| 2 | "Across much of Europe, life seems to go on as normal." | "Across much of Europe, life seems normal." | Keeps the two qualifiers that make it accurate ("much of", "seems"), but uses 3 fewer words. Option C, which kept the full v2 wording, came to 50 words. That is the absolute limit, and outside the 44–48 target. | P1 #2 NUANCE, recommended wording kept in substance |
| 3 | "But within weeks, the world would be plunged into the deadliest war in human history." (pause 0.5) | "Within weeks, Europe will be at war, in what will become the deadliest war in human history." (pause 0.5) | QC/hook review: separate Europe from the world. Europe goes to war "within weeks" (1 and 3 September 1939). "In what will become" places that European war inside a larger conflict that was already under way in Asia, so it does not suggest the whole world went to war at once. China's war since 1937 is still covered at 02:30 (s04). This line also matches the "WAR BREAKS OUT IN EUROPE" headline in the opening visuals. | P1 #1 ("within weeks" VERIFIED), #3 ("deadliest war" VERIFIED), #39/#43 and estimate note ("in Europe"; China 1937) |
| 4–6 | "Countries would fall. / Cities would burn. / Tens of millions of people would die." | "Countries will fall. / Cities will burn. / Tens of millions will die." | One tense throughout (QC #2, hook review #6): historic present plus "will". "Of people" dropped (−2 words) with no change of meaning. Pauses unchanged (0.25 / 0.25 / 0.7). | P1 #4 VERIFIED (estimate); "tens of millions" holds across all estimates |
| 7–8 | "So how did the world get here? / And how did it finally end?" | "So how did it start? / And how did it end?" | QC/hook review priority 1: end on the title's own questions ("How It Started, How It Ended"). These two questions are the narrator speaking to the viewer from the present, so the past tense ("did") is correct there. The story itself stays in present/"will" throughout. | Framing only, no factual claim |

### Hook-review / QC ideas: used and not used

| Idea | Source | Used? | Reason |
|---|---|---|---|
| End on the title's questions | QC hook-pass priority 1; hook review suggestion 3 | **Yes** | "So how did it start? And how did it end?" |
| Separate Europe from the world | QC priority 2; hook review 5 and 7 | **Yes**, adapted | I did not use the review's "a war that will spread across the globe": "spread" could suggest the war in Asia grew out of Europe's, when China had been at war since 1937. "In what will become the deadliest war" avoids that. |
| Keep "much of Europe / seems" | QC priority 3; P1 #2; hook review 4 | **Yes**, shortened | "life seems normal" keeps both qualifiers. |
| One consistent tense | QC #2; hook review 6 | **Yes** | Present + "will" (the hook review's preference for a cold open). |
| Hook ≤ ~50 words, speed ≤ ~1.08–1.10× | QC #1, #4 | **Yes** | 47 words, 1.006× |
| Channel angle "shaped by decisions made by people" | QC priority 4; hook review 2 | **No** | It is about 6–8 words, which would push the hook to 53–55 words, over the ≤50 cap and back to about 1.1×. The angle is still set up by s02 ("Versailles alone did not cause another war…") and paid off in s11 ("It's about people. And every person has a story."). It could go in the description or on a thumbnail. |
| Open on named cities / people ("In Warsaw, London and Berlin, people go to work…") | Hook review 1 | **No** | No room in a 21.2 s speech window (the review assumed 30 s; QC #4). The storyboard can show this visually with ordinary illustrative stick figures on the 1939 street, without narration. |
| "Late August, 1939" / "Within days" | Hook review rewrite | **No** | The brief says keep "Summer, 1939." "Within weeks" is the wording P1 #1 verified. |
| Sombre restraint on "Cities will burn", silence before the questions | Hook review 8 | **Yes** (tone note in `script.md`) | The 0.7 s pause after "Tens of millions will die." is kept. |

## s10 — QC suggestion S2

| v2 | v3 | Why |
|---|---|---|
| "Historians still debate how much the bombs and the Soviet invasion each shaped that decision." | "…each shaped **Japan's decision**." | The antecedent was loose. Same word count. No `say` field on this sentence. Fact basis unchanged (P2 #36 VERIFIED). |

## Timing check (measured, not estimated)

I measured the timings with the engine's Kokoro builder logic (`tts.layout` plus the same speed-fitting loop as `tts.py` `main()`, voice bm_george, cap 1.17×). I ran it on a scratch copy of `tts.py` with its TTS cache in the scratchpad. No engine files were written, and the scratch files have been deleted.

| Section | Words v2 → v3 | Fitted speed v2 → v3 | Narration end v3 / budget |
|---|---|---|---|
| s01 | 54 → 47 | 1.139 → **1.006** | **22.77 s** / 22.8 s (mustEndBy) |
| s10 | 118 → 118 | 1.000 → 1.000 | 567.91 s (v2 567.44) / 568.6 s |
| s02–s09, s11 | unchanged | unchanged (identical to v2 log) | unchanged |
| Total | 1195 → 1188 | | |

s01 sentence layout at 1.006×: "Summer, 1939." 1.60–3.52 · "Across much of Europe…" 4.22–7.06 · "Within weeks, Europe will be at war…" 7.38–13.02 · "Countries will fall." 13.52–15.10 · "Cities will burn." 15.35–16.68 · "Tens of millions will die." 16.93–18.98 · "So how did it start?" 19.68–21.10 · "And how did it end?" 21.40–22.77.

The speech span is 1.6–22.77 s, which works out at about 133 wpm including pauses (v2: 153 wpm). That is now in line with the 125–136 wpm body. The fitter hardly speeds anything up: it only nudged the speed to 1.006× to land under 22.8 s.

Candidates measured: A (50 words, two-sentence war line) 1.074×; B (47 words, adopted) 1.006×; C (50 words, full "seems to go on as normal") 1.029×. B was chosen because it is the only one inside the 44–48 target.
