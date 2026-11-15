# Handoff — ep01-ww2 — quality-control-script-v2

- **From:** quality-control
- **To:** director (cc: scriptwriter, youtube-specialist, audio-engineer, storyboard, researcher)
- **Date:** 2026-11-15
- **Status:** COMPLETED

## Deliverables
- `production/reports/qc/ep01-ww2/qc-script-v2-20261115.md`: independent QC of script v2. It contains the fact-check resolution table, the checklist, the issue table and the verdict.

## Summary
Verdict: **APPROVED WITH MINOR FIXES** (BLOCKER 0, MAJOR 0, MINOR 4, SUGGESTION 5). Both required fact-check items are resolved verbatim: s08 sea-and-air (P2 #13) and s11 "an estimated 60 million people or more" (P2 #37). All seven NUANCE fixes match the researchers' wording. `git diff` confirms there are no other text changes and no new unsourced claims. `say` matches `text` throughout, and `script.md` matches `script.json`. Tone (Holocaust, atomic bombs, civilians), causes vs triggers, the German vs Japanese surrender and the surrender debate all pass. The main risk is pace: s01 runs at about 153 wpm (1.139×) in only 21.2 s of speech, while s03 at 1.154× is only about 131 wpm and is low risk.

## Changes to inputs / assumptions
- None. QC did not edit the script, status.json or the dashboard.

## Blockers / issues
- [minor #1] s01 pace may sound rushed. Bring it to ≤ ~50 words in the hook pass (scriptwriter).
- [minor #2] s01 tense shift ("seems" → "would") (scriptwriter).
- [minor #3] The engine copy `the-human-story/episode-01-ww2/research/script.json` is still v1. Sync it after approval, before any rebuild (audio-engineer).
- [minor #4] The hook review assumes a 30 s window. The real speech span is 21.2 s, so the ~60-word rewrite would need about 1.27×, over the cap (youtube-specialist).

## Requests for other agents
- scriptwriter: if the user agrees to a hook pass, fix #1 and #2 within ≤ ~50 words; optional S2 ("Japan's decision").
- youtube-specialist: re-base the hook proposals on the 21.2 s span (#4).
- audio-engineer: #3 after checkpoint 1; listening check of s03 (S1); tonal transitions in s09/s10 (S4).
- storyboard: card wording to match v2 (S3); tonal transitions (S4).
- researcher: spot-check any new factual wording in a hook rewrite; optional description line on Japan's road to war (S5).

## Recommended next action
- Director: present v2 and this report to the user for checkpoint 1. Recommend (the user's decision) a budget-limited hook pass **before** sign-off, so the user approves the final script once. After any hook change, the researcher spot-checks it and QC re-checks s01 only.
