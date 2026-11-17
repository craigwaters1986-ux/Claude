# Handoff — ep01-ww2 — scriptwriter-v2-factcheck

- **From:** scriptwriter
- **To:** director (cc: researcher, audio-engineer, storyboard, quality-control, youtube-specialist)
- **Date:** 2026-11-15
- **Status:** AWAITING REVIEW

## Deliverables
- `production/scripts/ep01-ww2/script.json`: script v2, same schema (plus a top-level `"version": "v2"`). Validated with `python3 -m json.tool`.
- `production/scripts/ep01-ww2/script.md`: readable v2 with a v2 header and a per-section table of words, estimated duration and measured TTS speed.
- `production/scripts/ep01-ww2/changelog-v2.md`: every change (old → new, verdict, fact-check row), items not changed with reasons, and the timing table.

## Summary
I applied 9 narration changes from the two fact-check reports. Two were required: the s08 sea-and-air correction and the disputed s11 death toll, now "an estimated 60 million people or more, most of them civilians". The other seven were recommended or optional NUANCE fixes in s01, s03, s04, s05, s06, s07 and s10. The YouTube specialist's hook suggestions were not applied, as the user instructed. The new s01 line is the "much of Europe / seems to" wording that the hook review also endorses, so a later hook rewrite can build on it. The total word count goes from 1168 to 1195. I ran every section through the engine's Kokoro layout and speed-fitting logic on a scratch copy, and all of them fit their windows under the 1.17× cap. s11 now ends at 597.96 s, inside its 598.3 s mustEndBy.

## Changes to inputs / assumptions
- No windows, leads, pauses or mustEndBy values were changed.
- `say` fields were updated to match the new text.

## Blockers / issues
- [minor] s01 now needs 1.139× (was 1.102×) and s03 needs 1.154× (was 1.117×). Both are within the cap, but these are the two fastest sections. Any hook rewrite must keep s01 at no more than about 54 words of similar length.
- [minor] The engine copy `the-human-story/episode-01-ww2/research/script.json` is still v1. I did not edit it.

## Requests for other agents
- audio-engineer: sync v2 into the engine copy and rebuild the narration, timing JSON and SRT.
- researcher: quick re-check of the 9 new lines (all taken from your recommended wording).
- storyboard / animator: apply the fact-check visual notes. Little ships should not be shown carrying most of the Dunkirk army; show Mussolini at Munich if leaders appear; Pearl Harbor also hit Oahu's airfields; camp liberations ran from July 1944 to April 1945; D-Day visuals should include paratroopers and gliders as well as the beaches.
- youtube-specialist: hook proposals remain open for a later pass.

## Recommended next action
- Director: send v2 to QC. Then present it to the user for **checkpoint 1 (script approval)**, which needs the user's own approval. Ask the user whether a separate hook pass should follow.
