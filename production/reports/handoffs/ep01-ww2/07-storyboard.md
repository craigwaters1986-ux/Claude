# Handoff — ep01-ww2 — storyboard

- **From:** storyboard
- **To:** director (cc: animator, environment-designer, video-editor, audio-engineer, researcher, quality-control)
- **Date:** 2026-11-15
- **Status:** AWAITING REVIEW (needs the user's approval, checkpoint 3)

## Deliverables
- `production/storyboards/ep01-ww2/storyboard.md`: the full timestamped storyboard, **99 shots** covering 0–600 s with no gaps. It contains:
  - conventions (beats, safe zones, transitions, symbol and tone policy)
  - one table per section
  - an on-screen text checklist with sources
  - four open questions for the user
- `production/storyboards/ep01-ww2/asset-requests.md`: new or extended assets split by owner and priority, with a spec and shot list for each.

## Summary
Every shot is tied to narration beats `sNN.bK` from the approved v3 `script.json`.
- **Timing:** s01 uses the scriptwriter's measured v3 layout. Other sections use word-proportional estimates that will snap to the regenerated `narration.json`.
- **Shots per section:**

  | s01 | s02 | s03 | s04 | s05 | s06 | s07 | s08 | s09 | s10 | s11 |
  |---|---|---|---|---|---|---|---|---|---|---|
  | 6 | 9 | 10 | 9 | 10 | 10 | 9 | 10 | 10 | 10 | 6 |

- **Cards:** all 26 required date cards, the title card and the end card are placed (§3.1). Every extra pill or card is traced to a fact-check item (§3.2).
- **Visual accuracy notes, all applied:**
  - At Dunkirk, most troops leave from the mole on destroyers, and a pill says so.
  - Mussolini appears at Munich, and Czechoslovakia is shown as not invited.
  - Oahu's airfields are hit as well as the fleet.
  - Camp liberations are dated July 1944 to April 1945, not all in 1945.
  - D-Day shows paratroopers and gliders as well as the beaches.
  - A pill notes the Allies had been fighting in Italy since 1943.
  - An optional Danzig headline appears in s01.
- **Symbols:**
  - No swastikas: plain dark-red banners and a plain armband.
  - The Balkenkreuz is kept on German vehicles (QC may veto).
  - No Rising Sun ensign.
  - Propaganda is labelled.
- **Sombre staging:**
  - Holocaust: candles and a memorial, the names of victim groups, no counter, no graphic imagery.
  - Hiroshima and Nagasaki: flash, then silence, then aftermath with no people and no explosion SFX.
  - Hitler's death: an empty corridor and a closing door; no figure shown.

## Changes to inputs / assumptions
- Chapter numbering: s01 is a cold open with no banner (the title closes it). s02–s11 are CHAPTER 1–10.
- Date and term cards sit at y = 120 so they clear the chapter banner. This needs the `Text.tsx` change T-01.
- The WIP `src/scenes/Preview.tsx` is kept as the basis for s01. Changes needed:
  - Remove the "WORLD WAR II 1939–1945" title over the map, which appears before 22.8 s.
  - Change the title text to "Episode 1: World War II".
  - Optionally, set the bench headline to "DANZIG CRISIS".
- The engine's current `src/timeline/narration.json` is still the older (pre-v3) draft; s01 sentence texts differ. I did not use its times.

## Blockers / issues
- [minor] **Silent narration tails:** s05 ≈ 9 s (261–270 s), s07 ≈ 9.3 s (380.8–390 s), s08 ≈ 7.5 s (442.5–450 s). Each has a moving music-led shot, and the audio engineer must score them so there is no unexplained silence.
- [minor] **Nagasaki beat is short:** s10.b6 runs ≈ 3.7 s plus a 0.4 s pause. Its pill runs into the opening of S10-08. If the 0.7 s s10 budget allows, the audio engineer could raise `pauseAfter` to about 0.9 s.
- [question for the user] **End card is visible for only ≈ 4.5 s** (595.5–600 s). YouTube end-screen elements need at least 5 s. Getting more would mean a runtime change, which the user would have to decide.
- [question for the user] Mushroom cloud: none by default. Balkenkreuz: kept by default. Chapter numbering as above. See storyboard §4.
- [minor] The text component has issues: `DateCard` sub text is 27 px (the style guide asks for ≥ 36 px for fact text), long titles overflow, and its default y collides with the banner (T-01).
- [minor, research] These need sources or verification before the maps are drawn:
  - the extents of Japanese-controlled areas in 1941 (S06-05; fall back to arrows only)
  - the D-Day beach names and nationalities
  - the Versailles territorial list
  - the Sudetenland outline

## Requests for other agents
- **animator:** 24 items (8 must / 12 should / 4 could). Section A of asset-requests.md has the details. Key items:
  - Japanese and Chinese soldiers, Japanese civilians
  - paratrooper with a dangle pose
  - dignified survivor poses, respect poses, and a document-signing pose
  - a crowd system
- **environment-designer:** 82 items (35 must / 36 should / 11 could). Section B of asset-requests.md has the details. Key items:
  - Versailles, Czech, spheres, Eastern Front, East Asia, Pacific, Normandy and 1944–45 map overlays
  - Hall of Mirrors, Reichstag and Berlin ruins, bunker
  - Dunkirk mole, Paris, Underground shelter, Pearl Harbor and airfield, Stalingrad
  - D-Day beach and night fields, camp perimeter, memorial
  - Hiroshima and Nagasaki before and after, USS *Missouri*, cemetery
  - glider and parachutes, beach obstacles, sombre grade
- **video-editor:** T-01 to T-06 (DateCard layout and size, end card, Preview fixes, stacked list pill and memorial card, split-screen helper, banner numbering).
- **audio-engineer:** AU-01 (silence windows, solo instrument for the camps and memorial, scored tails, title sting ≥ 22.9 s, no comic SFX) and AU-02 (optional Nagasaki pause). The music mood and key SFX for each shot are in the storyboard.
- **researcher:** R-01 (map extents, beach names, Versailles and Sudetenland lists, city coordinates).
- **quality-control:** check §3 (card wording against sources) and the §1.6 tone and symbol policy.

## Recommended next action
- Director: present the storyboard and the four open questions in §4 to the user for **checkpoint 3**. After approval, start the animator and environment-designer (must items first) in parallel, then T-01, T-03 and R-01. Once the audio engineer delivers the v3 `narration.json`, snap the shot cut points to the beat times (beat anchors do not change).
