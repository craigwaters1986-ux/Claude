# Handoff — ep01-ww2 — scriptwriter-v3-hook

- **From:** scriptwriter
- **To:** director (cc: researcher, quality-control, storyboard, audio-engineer, youtube-specialist)
- **Date:** 2026-11-15
- **Status:** AWAITING REVIEW

## Deliverables
- `production/scripts/ep01-ww2/script.json`: script v3 (`"version": "v3"`). Only s01 and the last sentence of s10 changed. Validated with `python3 -m json.tool`.
- `production/scripts/ep01-ww2/script.md`: regenerated with a v3 header, a v2→v3 word and speed table, and s01 on-screen and tone notes.
- `production/scripts/ep01-ww2/changelog-v3.md`: old and new s01, sentence-by-sentence reasons, which hook-review and QC ideas were used or rejected, the s10 tweak, and measured timing.

## Summary
I rewrote the hook to 47 words (v2: 54). The new text is: "Summer, 1939. Across much of Europe, life seems normal. Within weeks, Europe will be at war, in what will become the deadliest war in human history. Countries will fall. Cities will burn. Tens of millions will die. So how did it start? And how did it end?"

The story is told in one tense (present plus "will"). The hook ends on the title's questions and puts Europe's war inside the larger conflict without suggesting the whole world went to war at once. "Much of Europe / seems" is kept.

I measured the fit with the engine's Kokoro logic on a scratch copy. s01 comes out at **1.006×** and ends at **22.77 s**, inside mustEndBy 22.8 s (v2: 1.139×). That is about 133 wpm, matching the body of the script. In s10, "that decision" became "Japan's decision" (QC S2). s10 now ends at 567.91 s, inside its 568.6 s budget.

## Changes to inputs / assumptions
- No lead, start, end, mustEndBy, pauseAfter or `say` values were changed. No other sections were touched.
- I left out the channel-angle line ("shaped by decisions made by people") because it would push the hook over the 50-word cap. Reasons are in the changelog.

## Blockers / issues
- None blocking. QC #1, #2 and #4 should now be resolved (QC to confirm). QC #3 is still open: the engine copy `the-human-story/episode-01-ww2/research/script.json` is still v1, and I did not edit it.

## Requests for other agents
- researcher: spot-check the new s01 wording. The key phrases are "life seems normal" and "Within weeks, Europe will be at war, in what will become the deadliest war in human history". These are based on P1 #1–4 and #39/#43.
- quality-control: re-check s01 only, plus the s10 wording.
- storyboard: the "WAR BREAKS OUT IN EUROPE" headline now matches the narration at about 7.4–13.0 s. The title card should come after "And how did it end?" (22.77 s).
- audio-engineer: after checkpoint 1, sync the approved script into the engine copy and rebuild (QC #3).
- youtube-specialist: the "decisions made by people" angle did not fit in the hook. You could use it in the description or thumbnail copy.

## Recommended next action
- Director: run the researcher spot-check and the QC re-check on s01. Then present v3 to the user for **checkpoint 1 (final script approval)**, which only the user can give.
