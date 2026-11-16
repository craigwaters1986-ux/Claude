# QC report — ep01-ww2 — script v3 (focused re-check: s01 hook + s10 one-word change)

- **Reviewer:** quality-control (independent) · **Date:** 2026-11-15
- **Target:** `production/scripts/ep01-ww2/script.json` (v3) and `script.md` (v3), sections **s01** and **s10 last sentence only**
- **Checked against:** previous QC `qc-script-v2-20261115.md` (MINOR #1, #2, #4; SUGGESTION S2); `changelog-v3.md`; `production/research/ep01-ww2/fact-check-script-part1.md` (P1 #1–#4, estimate notes); `production/templates/qc-checklist.md` (Script section)
- **Scope:** writing, timing and consistency. A researcher is checking the facts in parallel. Visuals, audio, subtitles and technical checks are N/A (no v3 narration, SRT or render exists).

## 1. Scope check (git)

The v3 changes are now committed (`9f1ab74`). `git diff HEAD~1 HEAD -- production/scripts/ep01-ww2/script.json` shows **9 insertions and 9 deletions, and nothing else**:
- 7 `text` lines in s01 (sentence 1, "Summer, 1939.", unchanged)
- 1 `text` line in s10 ("that decision" → "Japan's decision")
- `"version": "v2"` → `"v3"`

No `start`, `end`, `lead`, `mustEndBy`, `pauseAfter` or `say` field changed. s01 has no `say` fields, and none are needed: it contains no numerals other than "1939" (as in v2) and no respelled words. The s10 sentence has no `say`. **PASS.**

`script.md` narration matches the `script.json` `text` exactly in all 11 sections, checked by script. The word counts agree: s01 = 47, total 1188.

## 2. Resolution of the v2 findings

| v2 item | Status | Evidence |
|---|---|---|
| MINOR #1: hook rushed (54 words, ~153 wpm, 1.139×) | **RESOLVED** | 47 words over a 1.60–22.77 s speech span gives 47 ÷ 21.17 s × 60 = **133 wpm** (my own arithmetic agrees with the scriptwriter's figure). The fitted speed is 1.006×, which is close to natural. This is now in line with the body (125–136 wpm). The written pauses (0.7 / 0.5 / 0.25 / 0.25 / 0.7 / 0.3) are kept, and the sentence layout in the changelog shows the 0.7 s beat before the questions (18.98 → 19.68 s). |
| MINOR #2: tense shift ("seems" → "would") | **RESOLVED** | The narrative uses one frame throughout: historic present + "will" ("seems … will be at war … will become … will fall / burn / die"). The closing "did it start? / did it end?" is the narrator speaking from the present, so the switch to past tense is correct and reads naturally. |
| MINOR #4: hook review assumed 30 s (youtube-specialist) | **Effectively resolved for the script** | The rewrite was sized on the real 21.2 s span. The hook-review file itself still says 30 s. That is a documentation matter only, and the youtube-specialist can annotate it; it does not block anything. |
| SUGGESTION S2: s10 "that decision" | **RESOLVED** | "…each shaped Japan's decision." Same word count, and the antecedent is now clear. Measured s10 end is 567.91 s / 568.6 s (+0.47 s v2→v3, which is still inside the window). The debate framing is unchanged. |
| MINOR #3: engine copy still v1 (audio-engineer) | Still open, out of scope | Re-stated here only so it is not lost. It must be done before any narration rebuild. |

## 3. Review of the new hook

> Summer, 1939. Across much of Europe, life seems normal. Within weeks, Europe will be at war, in what will become the deadliest war in human history. Countries will fall. Cities will burn. Tens of millions will die. So how did it start? And how did it end?

- **Hook strength:** improved from "moderate" to **good**. Date and place come at 1.6 s. The stakes ("deadliest war in human history") land at about 7–13 s, inside the first 15 s. Then comes a three-beat build of short sentences, a held silence, and two direct questions that close the open loop. The ending is now the title itself, which works well for click-to-content consistency. The "decisions made by people" channel angle is still missing, and the scriptwriter's reason for leaving it out is sound: it would cost 6–8 words and push the speed back to about 1.1×. s02 and s11 carry that angle. Not an issue.
- **Clarity for beginners:** PASS. Every sentence is short, with no jargon and no names a newcomer would need to know already. "It" in "So how did it start?" refers back two sentences, to "war". When spoken, after a 0.7 s beat and with the "WAR BREAKS OUT IN EUROPE" headline on screen, the reference is clear. See S2 only if a listening test suggests otherwise.
- **Match with the title "How It Started, How It Ended":** PASS. The two final questions mirror the title almost word for word. The title card follows at 22.8 s.
- **British English:** PASS. No spelling issues ("Summer, 1939." uses the comma correctly as a dateline). The grammar is correct. "In what will become the deadliest war" is idiomatic.
- **Tone:** PASS. The tone is restrained and not sensational. Civilian suffering is stated plainly ("Tens of millions will die") with no adjectives piled on, and the `script.md` tone note forbids explosions and comic SFX under the three-beat build.
- **Consistency with the rest of the script:**
  - Death toll: the hook's "Tens of millions" fits s11's "an estimated 60 million people or more", and both fit P1's estimate note. PASS.
  - Europe vs world: "Europe will be at war, in what will become…" fits s04 ("The Second World War in Europe had begun… But war had already come to Asia… 1931… 1937") and the s06 chapter "The War Becomes Global". The v2 implication that "the world" went to war in 1939 has gone. PASS, and an improvement.
  - The hook's "how did it end?" leads into the s10 chapter "How World War II Finally Ended". Consistent.
- **Timing margin:** the narration ends at 22.77 s against a `mustEndBy` of 22.8 s. That is only 0.03 s of headroom, but by design the fitter lands each section just under its limit, and at 1.006× there is plenty of room for the fitter to absorb small changes on rebuild. The consequence is that **the hook is word-locked**: any later addition would need re-timing. See S1 on the title-card handover.

## 4. Factual items noticed (for the researcher, not QC findings)

- R1: "Within weeks, Europe will be at war". P1 #1 verified "within weeks" (1 and 3 September 1939). "Europe will be at war" is a fair shorthand, but several European states stayed neutral or entered later (Italy in June 1940, the USSR in June 1941 in the Germany-vs-USSR sense). Please confirm the researcher is content with "Europe will be at war" as against "war in Europe". QC thinks it is acceptable as hook shorthand, and s04 gives the precise picture.
- R2: "Tens of millions will die" ("of people" removed). The meaning is unchanged, and P1 #4 still applies.

## Checklist — Script (s01 and s10 change only)
- [x] Factual claims match the research notes: **PASS** at the writing level (wording traces to P1 #1, #3, #4; researcher confirming in parallel, see R1/R2)
- [x] Estimates labelled; debates acknowledged: **PASS** (s10 debate sentence intact)
- [x] No single-cause oversimplification: **PASS** (the hook makes no causal claim)
- [x] No invented quotations: **PASS**
- [x] British spelling and grammar: **PASS** (v2 #2 resolved)
- [x] Hook in first 15 s; clear structure: **PASS**
- [x] Tone: **PASS**
- [x] Word count fits the window: **PASS** (133 wpm, 1.006×; v2 #1 resolved)
- Visuals / Audio / Subtitles / Technical / Rights: **N/A** for this deliverable

## Issues

| # | Severity | Location | Issue | Fix | Responsible agent |
|---|---|---|---|---|---|
| S1 | SUGGESTION | s01 end (22.77 s) → title card (22.8 s) | Only 0.03 s separates the last word, "end?", from the title card. If the title has a sting or whoosh, it could crowd the question and spoil the sombre beat. | Start any title audio sting at 22.8 s or later, or let it fade in gently. Do not move narration. Check on the first v3 narration build. | audio-engineer, storyboard |
| S2 | SUGGESTION | s01 sentence 3: "Europe will be at war, in what will become the deadliest **war**…" | "war … war" and "will be … will become" make this the clunkiest line in the hook, though it is clear and correct when spoken. It is not worth reopening the word-locked hook unless the audition sounds awkward. | Leave it as it is. If the listening test flags it, a word-neutral option is "Within weeks, Europe will be at war: the start of the deadliest conflict in human history." (would need a researcher check and re-timing). | scriptwriter (only if audition flags) |
| S3 | SUGGESTION | `production/exports/ep01-ww2/youtube/hook-review.md` | The file still describes a 30 s window and a ~60-word rewrite. It is now out of step with the adopted hook (v2 #4 follow-up). | Add a one-line note: "superseded by script v3 s01; real speech span 21.2 s." | youtube-specialist |
| S4 | SUGGESTION | s01 chapter label "The Hook" (`script.json` `chapter`) | If this label goes into the YouTube chapters as it is, viewers see an internal production term. | Use a viewer-facing label in the published chapters, e.g. "Summer 1939" or "Introduction". | youtube-specialist |

**Counts:** BLOCKER 0 · MAJOR 0 · MINOR 0 · SUGGESTION 4

## Verdict: **APPROVED**

v2 MINOR #1 and #2 and SUGGESTION S2 are resolved. `git diff` confirms that nothing outside s01, the s10 sentence and the version field changed. The new hook is clearer, better paced, consistent with s04 and s11, and matches the title. From QC's side the v3 script may go to the user for checkpoint 1, **subject to the researcher's parallel spot-check (R1/R2) coming back clean**. If the researcher changes any wording, s01 needs re-timing and a QC re-check of that line only. The suggestions are optional, and none needs a script change before sign-off. v2 MINOR #3 (sync the engine copy before rebuild) remains open for the audio-engineer.
