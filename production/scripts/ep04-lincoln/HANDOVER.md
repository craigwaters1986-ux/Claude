# The Human Story · Episode 4 handover
Written 20 November 2026 (Phase 0: brief and upgrade spec; renumbered from Episode 5 to Episode 4 on 20 November 2026 after the Titanic episode was shelved) · **Abraham Lincoln: from birth to death, and his legacy** · episode ID `ep04-lincoln`

## Start here

**Where things stand.** Phase B done (20 Nov 2026): engine upgrade, a 40 s test reel, a 60 s music test, a 66-shot storyboard and a music cue sheet. **Waiting for Craig's Approvals 2 (style) and 3 (storyboard)**, and his yes or no on the ElevenLabs music option. Then **Phase C** (prompt below). Phase B summary: `production/reports/handoffs/ep04-lincoln/phase-b-engine-style-storyboard.md`.

**Branch.** Phase B work is on **`claude/clever-albattani-64lx7v`** (it contains all of `claude/epic-mccarthy-8szsrf` plus Phase B). Start Phase C from that branch.

**How this episode runs (Lean mode, to save Craig's credits).** One fresh Claude session per phase. Each session:
- starts from this file
- does only its phase
- updates this file's "Where things stand"
- commits and pushes to the session's branch (Phase B: `claude/clever-albattani-64lx7v`), and records the branch here
- ends by giving Craig the **ready-to-paste prompt for the next phase**, and a link to a pre-created session if the session can create one

Keep chats short; put detail here, not in chat. Subagents only where they save tokens. Model policy: see `CLAUDE.md`.

**Finish condition.** A reviewable **10:00** (600.000 s) H.264/AAC MP4 at 1920×1080, 30 fps, plus thumbnail, SRT, publishing pack, QC report, iPhone copy (720p small + 3-minute parts) and an updated handover. Nothing is uploaded or published automatically. Craig set 10:00 on 20 November 2026, the channel default, so the script must be tight: aim for 8:45–9:00 of narration at speed 0.99 (about 145 spoken words a minute, so about 1,270–1,300 words); silent beats close the gap.

| Phase | Work | Ends with |
| --- | --- | --- |
| **A** | Research (from scratch, sourced), script fitted to 10:00, one combined fact and quality review | **STOP: Approval 1 (script).** Show the script plus the sources list |
| **B** | Engine upgrade (cinematic camera, object interaction, motion, faces, bubbles, readable documents). 30 s test reel. Score sketch (60 s cinematic music test). Storyboard and music cue sheet | **STOP: Approvals 2 + 3 (style + storyboard), batched.** Show the test reel, the music test and the storyboard |
| **C** | Narration, plan, captions, all scenes, score, SFX, mix | Commit; prompt for D |
| **D** | Render, QC, publishing pack, thumbnail, iPhone copy | **STOP: Approval 4 (final render)** |

Approvals go through `python3 production/tools/status.py approval <checkpoint> --episode ep04-lincoln --state …`.

### Prompt for Phase A (paste into a new Claude Code session on this repo)

> Director: continue The Human Story Episode 4 (ep04-lincoln), Phase A (research and script), from `production/scripts/ep04-lincoln/HANDOVER.md` on branch `claude/epic-mccarthy-8szsrf`. Lean mode: research, then the script, then one combined review. Stop at Approval 1, update the handover, push, and give me the prompt for Phase B.

### Prompt for Phase B

> Director: continue ep04-lincoln Phase B (engine upgrade, test reel, music test, storyboard) from `production/scripts/ep04-lincoln/HANDOVER.md`. Stop at Approvals 2 + 3, update the handover, push, and give me the prompt for Phase C.

### Prompt for Phase C

> Director: continue ep04-lincoln Phase C (narration, captions, all scenes, score and mix) from `production/scripts/ep04-lincoln/HANDOVER.md` on branch `claude/clever-albattani-64lx7v`. Approvals 2 and 3: [approved / changes: …]. ElevenLabs music: [no / yes]. Update the handover, push, and give me the prompt for Phase D.

### Prompt for Phase D

> Director: continue ep04-lincoln Phase D (render, QC, publishing pack, thumbnail, iPhone copy) from `production/scripts/ep04-lincoln/HANDOVER.md`. Stop at Approval 4 and send me the video and the iPhone copy.

## Content brief (Phase A)

**Subject.** Abraham Lincoln (12 February 1809 – 15 April 1865), from birth to death, then his legacy. Told through people, places and the paper he left behind, as Episode 3 was told through the letter. The narrator's words are the only claims; every claim traces to `production/research/ep04-lincoln/sources.md`.

**Draft chapter outline (the scriptwriter refines it; the windows are targets).**

| # | Chapter (draft) | Window | Must cover, each claim sourced |
| --- | --- | --- | --- |
| 1 | Cold open | 0:00–0:35 | One real document or moment (for example the Gettysburg Address manuscript, or the final page of the Second Inaugural); title |
| 2 | A cabin in Kentucky | 0:35–1:30 | Birth, 1809, Kentucky; family; moves to Indiana; his mother's death; little schooling; borrowed books |
| 3 | The rail-splitter | 1:30–2:20 | Illinois; flatboat trip to New Orleans (what he saw, as sourced); New Salem; store, postmaster, surveyor; Black Hawk War |
| 4 | Lawyer and politician | 2:20–3:25 | Self-taught law; Springfield; Mary Todd; the Illinois legislature; one term in Congress; the circuit |
| 5 | A house divided | 3:25–4:30 | The Kansas–Nebraska Act; the Republican Party; the “House Divided” speech (quote exactly); the Lincoln–Douglas debates; Cooper Union |
| 6 | President of a breaking country | 4:30–5:25 | The 1860 election; secession; Fort Sumter; the war begins |
| 7 | War and emancipation | 5:25–6:55 | Losses and generals; the Emancipation Proclamation (1 January 1863; text exact; what it did and did not do); Black soldiers; Gettysburg and the Address (text exact) |
| 8 | Malice toward none | 6:55–8:00 | 1864 re-election; the Thirteenth Amendment passes Congress; Second Inaugural (quote exactly); Appomattox |
| 9 | Ford's Theatre | 8:00–8:50 | 14 April 1865; John Wilkes Booth; death on 15 April at the Petersen House. Non-graphic: no wound, no blood. Show the theatre, the empty chair, the clock |
| 10 | Legacy | 8:50–10:00 | The funeral train; the Thirteenth Amendment ratified (December 1865); how he has been remembered and argued over (the Memorial, the debates about his views on race, labelled as historians' debates); end on a real page; end card |

**Accuracy and sensitivity (non-negotiable).**
- **Slavery and race:**
  - Present Lincoln's evolving and contested views honestly, using his own documented words where quoted.
  - Present historians' disagreements as disagreements; no hero-worship and no anachronistic verdicts.
  - Enslaved people and Black Americans are shown with dignity, as agents (for example Black soldiers, and Frederick Douglass if he is in the script and sourced). Never as background props.
  - No caricature in costumes or faces.
- **War dead:** sombre and non-graphic; no gore.
- **The assassination:** no wound or blood; staged from behind or as a silhouette, or through objects.
- **Quotes:**
  - Exact text from primary sources only, with historical spelling and punctuation.
  - Public-domain primary texts to use: the Gettysburg Address (choose the Bliss copy and say so), the Emancipation Proclamation, the House Divided speech, the Second Inaugural, the 1858 debates.
  - Famous misattributed quotes are banned unless flagged as misattributed.
- **Likely disputes to flag:**
  - the cabin's authenticity
  - the Ann Rutledge romance
  - Lincoln's religious views
  - his depression (“melancholy” is documented; avoid diagnosis)
  - what he saw in New Orleans
  - the Douglas debates' “winner”
  - death-toll estimates (label as estimates; give the range used)
- **Real people get name tags at first appearance:** Lincoln, Mary Todd Lincoln, Stephen Douglas, Frederick Douglass, Ulysses S. Grant, Robert E. Lee, John Wilkes Booth (sombre, never glamorised), plus others as sourced.

**Sources to start from** (verify reachability; some sites block automated fetches, so use another primary source or say “search summary”):
- the Library of Congress (Abraham Lincoln Papers)
- the National Archives (Emancipation Proclamation)
- the National Park Service (Lincoln Home, Ford's Theatre, Gettysburg, Lincoln Memorial)
- the Abraham Lincoln Presidential Library
- *Collected Works of Abraham Lincoln* (University of Michigan digital edition)
- the Miller Center
- Britannica
- the Smithsonian

**Spoken form** (see `production/audio/narrator-pack/NARRATOR-GUIDE.md`):
- 1809 → “eighteen oh nine”; 1865 → “eighteen sixty-five”
- the Thirteenth Amendment → “the Thirteenth Amendment”
- Ford's Theatre (British spelling in captions; the venue's proper name uses “Theatre”)
- check the pronunciation of Appomattox, Petersen, Springfield and New Salem

**American subject, British channel.** Narration and captions are in British English (theatre, defence, colour), while proper names keep their own spelling. Dates go in British order (12 February 1809).

## Upgrade spec: “more cinematic” (Phase B builds it; acceptance tested)

**Baseline.** The shelved Titanic handover (`production/scripts/ep04-titanic/HANDOVER.md`, section “Animation upgrade”) already specifies the following, with acceptance tests:
- seats and `SeatedPerson`
- more movement (freezedetect n = 0.003, d = 1.5 → nothing)
- the expression timeline and new expressions
- speech, thought, shout and radio bubbles, with the accuracy rules
- **real readable documents** (`documents.json`, licensed fonts, no scribble)

Implement all of it here too, in a new engine `the-human-story/episode-04-lincoln/` copied from `episode-03-gunpowder-plot/`. If Codex pushed a Titanic engine with these upgrades (branch `ep04-titanic`), copy that instead and say so.

On top of that, Craig asked for the following.

### 1. Cinematic camera and look

- **Shot grammar:** every scene opens on an establishing wide, cuts or pushes to medium and close shots, and uses reaction close-ups on faces. At least 3 shot sizes per chapter. Over-the-shoulder shots for two-person scenes.
- **Depth:** 3–5 parallax layers per exterior (sky, far, mid, subject, foreground silhouette such as grass, a door frame or a lamp). The camera moves at different rates per layer. Add foreground elements passing the lens in tracking shots.
- **Lens feel:** subtle depth-of-field (an SVG Gaussian blur on the far and foreground layers, 2–6 px), slow ease-in-out dolly and push-ins, occasional crane-up reveals, and a gentle handheld drift only in tense scenes.
- **Light and grade:** per-scene time-of-day grade (dawn, day, golden hour, night), rim light on characters against the light, lamp and fire light pools with flicker, god-rays through windows, a vignette. Sombre scenes desaturate (the existing `SombreGrade`). Add a film-grain overlay at about 3% opacity and gentle light leaks only on the title.
- **Transitions:** match cuts (for example the cabin fire becomes the White House fireplace), whip-pans between places, page-turn into documents, iris or dip only for chapter changes.
- **Titles:** chapter cards become cinematic title plates (slow push over a scene, serif title with a light sweep), still in the series colours. Keep the logo top left and the caption band at the bottom.
- **Aspect:** stay 16:9 full frame (no letterbox; captions need the band). Keep the picture above y = 916 while captions are on screen.

### 2. Stick figures that actually interact with objects

- Add `src/kit/Props.tsx` with a **prop and grip system**. Every prop defines grip points (`handle`, `grip2`) and a rest pose. `Hold` attaches a prop to a hand each frame from the skeleton (`handWorld()`), so objects move with the hand. Two-handed props (axe, rifle, flag, book) solve both arms with `reach()` IK to their two grip points.
- **Actions** (frame-timed and reusable):
  - `pickUp` / `putDown`: reach, grip, lift with weight, set down with a small settle
  - `carry`
  - `handOver` (one hand releases as the other grips, in the same frame)
  - `write` (quill nib on the paper; ink appears in real text under the nib)
  - `readBook` (page turns)
  - `chopRail` (axe swing with anticipation, impact, wood-chip particles, follow-through)
  - `shakeHands`, `doffHat`, `openDoor` (hinge and hand on the handle), `sitDown` / `standUp`, `pointAtMap`, `raiseFlag`, `rideHorse` (simple horse rig) or `driveWagon`, `polePushFlatboat`, `signDocument`
- **Contact rules:**
  - Hands touch what they hold, within 3 px.
  - Feet plant on the ground; no sliding.
  - Objects don't pass through bodies or tables.
  - Weight shows: knees bend before lifting, lean for heavy things.
- **Motion quality:** anticipation, follow-through and overlap (coat tails, Lincoln's stovepipe hat lagging a frame), arcs not straight lines, eased timing, and a holding pose of at least 8 frames before a key action. Lincoln is tall and lean: scale 1.15 with longer legs, a stovepipe hat and a beard only from 1860 on (sourced). Age him visibly across chapters (hair, posture, face lines).
- **Acceptance:** the test reel shows:
  - an axe chop
  - pick up and read a book by firelight
  - writing a line of real text with a quill
  - a handshake
  - opening a door and walking through
  - sitting down at a desk

  The debug overlay shows hand-to-grip distances; all are 3 px or less on the contact sheet.

### 3. Cinematic music: “pull out all the stops”

- **Score shape:**
  - A **Lincoln theme** (a simple, hymn-like leitmotif) that grows across the film: solo piano or fiddle in the cabin; fuller strings in the politics; brass and timpani in the war; a quiet reprise at the assassination; full orchestra in the legacy finale.
  - Contrasting motifs for the war (low ostinato, snare) and for freedom (rising string line).
  - Use **public-domain period tunes** where they fit and are sourced as public domain, for example “Battle Hymn of the Republic” (Howe, 1862, to the older “John Brown's Body” tune), “When Johnny Comes Marching Home” (1863), “Hail, Columbia”. Credit each in the publishing pack.
- **Orchestration (synthesised, as in the series):**
  - layered strings with a long reverb
  - French horns and low brass swells
  - timpani rolls and hits on picture cuts
  - a choir pad (formant “ah”) for the big moments
  - piano and fiddle for intimacy
  - a bass drum heartbeat for tension
  - risers and impacts on chapter title plates

  Score to picture: stings land on cuts (frame-accurate from the plan). Crescendos peak in the silent beats, then duck under narration (about 13 dB).
- **Mix:** narration on top (about 20 dB above music during speech); music up to full in the silent beats; −14 LUFS master, true peak ≤ −1 dBTP; deliver stems (narration, music, SFX). Make the procedural synths richer (detuned voices, ensemble chorus, convolution hall), building on `scripts/audio_lib.py` from Episode 3.
- **Option for Craig at the B stop:** generated music through the ElevenLabs connector, if the account has credits and its licence terms allow YouTube use. **Only with Craig's approval.** It changes cost and licensing, and generations spend his credits. The default is the original synthesised score.
- **Acceptance:** a 60 s music test (theme statement, war build, quiet reprise) with a picture test reel, approved at the B stop.

## Reuse from Episode 3 (do not rebuild)

Engine, kit, shot sequencer with `T('phrase')` caption anchors, caption band and logo, Kokoro narration pipeline (speed 0.99, 0.21 s and 0.34 s gaps), word-aligned captions, `build_plan.py` (replace its section table), chunked resumable render, mix and master, QC commands, publishing-pack format and iPhone copy. All documented in `production/scripts/ep03-gunpowder-plot/HANDOVER.md` (section “Milestone 3 build and restart”) and in the shelved Titanic handover (`production/scripts/ep04-titanic/HANDOVER.md`) sections “Build route”, “QC and deliverables” and “Lessons from Episode 3”. Tools (Python venvs, Kokoro weights, faster-whisper) are installed fresh per session as described there. Expect about 15 minutes of setup.

## Where things stand (update at the end of every phase)

- 20 Nov 2026: **duration changed to 10:00 (600 s) by Craig**; chapter windows rescaled above. (Dashboard duration set to 600 s with the new `status.py rename-episode` command.)
- 20 Nov 2026, Phase 0 (this file): brief and upgrade spec written; dashboard episode `ep04-lincoln` created with the standard tasks. **Next: Phase A.**
- 20 Nov 2026, **Phase A**: research `production/research/ep04-lincoln/research-notes.md` + `sources.md` (37 sources; LoC, UMich Collected Works, Britannica, Smithsonian, fords.org blocked automated fetches, so Collected Works texts came via Abraham Lincoln Online, cross-checked with NPS/NARA). Script `production/scripts/ep04-lincoln/episode-04-script.md` (1,300 spoken words, about 8:57 + 28 s beats) with claim map `script-sources.md`. Combined QC `production/reports/qc/ep04-lincoln/qc-script-2026-11-20.md`: PASS WITH FIXES; the one BLOCKING issue (House Divided line wrongly called the speech's opening) is fixed, as is the minor "Cooper Union in New York". 8 MINOR notes remain optional (schooling "by his own count", "1863" at Gettysburg, explaining "Bliss copy", Chapter 7 order and "their pay", Charleston quote context, Douglas/Douglass homophones, explaining *Our American Cousin* and Lee/Grant roles, 1922 seating claim MEDIUM confidence) plus chapters 3, 7, 8 and 9 running 1–2 s over their windows (fix in timing). Any wording change must stay within 1,300 words. **Next: Craig's Approval 1, then Phase B.**
- 20 Nov 2026: **renumbered to Episode 4** (`ep04-lincoln`; the Titanic episode is shelved). **Approval 1 given**; script rev1 applies all QC minor notes, 1,295 spoken words. Changes: *Our American Cousin* called "a play" (genre not in the research notes); Grant is "the Union commander" (rank not in notes); the Gettysburg casualty estimate and the date of death moved from narration to on-screen date cards. `script.json` is built in Phase C. **Next: Phase B.**
- 20 Nov 2026, **Phase B** (branch `claude/clever-albattani-64lx7v`):
  - **Engine** `the-human-story/episode-04-lincoln/`, copied from Episode 3 (no Titanic engine existed on any branch). New: `kit/Cinema.tsx` (parallax camera, depth of field, grades, rim light, light pools, god-rays, grain, title plates), `kit/Props.tsx` + `kit/Actions.ts` (grip points, two-hand IK, chopRail, grabCarry, writeAt, shakeHands, doffHat, page turns, expression timeline, irregular blinks), `kit/Seats.tsx` (hip on seat, feet on floor, sitDown/standUp), `kit/Bubbles.tsx`, `kit/Documents.tsx` + `timeline/documents.json` (11 exact sourced texts), Lincoln cast at six ages, new expressions/hats/beard/age lines in `Head.tsx`, `TALL` build, whip/iris/page transitions. Fonts Caveat, Libre Baskerville (OFL) and Special Elite (Apache 2.0) bundled; see `credits-fonts.md`.
  - **Test reel** `production/exports/ep04-lincoln/phase-b/ep04-upgrade-test.mp4` (40.0 s, 1080p30, music under it) + contact sheet + `contact-report.json`. Contacts PASS (worst 1.22 px, limit 3 px, every frame measured by `scripts/check-contacts.mjs`); freezedetect n=0.003 d=1.5: nothing.
  - **Music test** `…/phase-b/ep04-music-test.mp4` / `.m4a` (60.0 s, −14.0 LUFS, −1.2 dBTP): Lincoln theme (fiddle + piano → strings + horns), war build (ostinato, side drum, brass theme in minor, timpani, choir) to an impact at 45.3 s, quiet piano reprise. Script `scripts/music_test.py`.
  - **Storyboard** `production/storyboards/ep04-lincoln/storyboard.md` (66 shots ≥ 6 s, each anchored to a script phrase for `T()`), **cue sheet** `music-cue-sheet.md`.
  - Known gaps for Phase C: `rideHorse`, `polePushFlatboat`, `raiseFlag`, `pointAtMap` still to build; telegraph bubble untested (no sourced telegram text); coat-tail and hat-lag overlap motion not yet in; US state maps need us-atlas (ISC). Music checked by measurement only, not by ear.
  - **Next: Craig's Approvals 2 + 3, then Phase C.**

## Phase C notes (from Phase B)

- Browser for Remotion here: `export REMOTION_BROWSER=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/*/)chrome-headless-shell` (no `remotion browser ensure` needed). The 40 s reel rendered in about 2 minutes at concurrency 4.
- Audio Python: `uv venv --python 3.12 ../audio-py && uv pip install --python ../audio-py/bin/python numpy scipy soundfile` (about 1 minute). Kokoro and faster-whisper still need the Episode 3 setup.
- Build scenes the reel's way: a pure solver per shot (pose, props, camera, `checks`, `seats`) plus a drawing component. Add each new shot's solver to `check-contacts.mjs` so contact errors fail loudly.
- Placement scales already include the cast scale: `Person scale = pl.scale / CAST[id].scale` (see `FigEl` in `UpgradeTest.tsx`).
- Reach limits are real: adult arm 93 px × scale, Lincoln (TALL) 101 px × scale. Stage props within reach (the checker found three out-of-reach moments in the first pass).
- `src/Episode.tsx` is a stub and `src/timeline/timeline.json` is still Episode 3's; Phase C replaces both from the narration, plan and captions.
