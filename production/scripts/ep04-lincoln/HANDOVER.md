# The Human Story · Episode 4 handover
Written 20 November 2026 (Phase 0: brief and upgrade spec; renumbered from Episode 5 to Episode 4 on 20 November 2026 after the Titanic episode was shelved) · **Abraham Lincoln: from birth to death, and his legacy** · episode ID `ep04-lincoln`

## Start here

**Where things stand (21 Nov 2026).** **Phase D2 is done: the second final render (ElevenLabs narration and score) is waiting for Craig's Approval 4.** See the 21 Nov entry under "Where things stand" below. **Approval 4 was given by Craig on 21 Nov 2026** (recorded on the dashboard). The 1922 seating shot and three captions about 0.5 s early were left as they are. Craig uploads manually; nothing is published automatically.

**Branch.** Phase D2 is on **`claude/sweet-einstein-gtzfnt`** (it continues `claude/clever-albattani-64lx7v`). Phase C is on **`claude/clever-albattani-64lx7v`** and mirrored to **`claude/tender-allen-8crxk1`** (the Phase C session's own branch; identical commits). Start Phase D from `claude/clever-albattani-64lx7v`.

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

> Director: continue ep04-lincoln Phase D (render, QC, publishing pack, thumbnail, iPhone copy) from `production/scripts/ep04-lincoln/HANDOVER.md` on branch `claude/clever-albattani-64lx7v`. Follow "Phase D notes (from Phase C)". Stop at Approval 4 and send me the video and the iPhone copy.

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
- 20 Nov 2026: **Approvals 2 and 3 given** by Craig; ElevenLabs music: yes.
- 20 Nov 2026, **Phase C** (branch `claude/clever-albattani-64lx7v`, mirrored to `claude/tender-allen-8crxk1`):
  - **ElevenLabs music:** licence checked (Music Terms, 9 Oct 2026, Exhibit A): every paid plan allows YouTube use, monetised included, with no attribution; the Free plan is non-commercial and needs attribution; avoid registering the music in Content ID. Ten cues were set up (flow "ep04-lincoln score"), but every generation failed with **"Insufficient funds"** (others refused as "free generations are busy"), so nothing was made or charged. The account's plan tier could not be read (the connector lacks usage permission). Score = original synthesised score.
  - **Narration** (`research/episode-draft.json` from script rev1): 27 groups, **486.55 s**, Kokoro bm_george speed 0.99. Fixes: the sentence splitter no longer splits at initials ("Robert E. | Lee"); overrides for Appomattox and for John T. Stuart, Robert E. Lee and Ulysses S. Grant (the full stop after an initial made the model swallow it). Committed as `production/audio/ep04-lincoln/narration-draft.flac` + audit + `words.json`; `pronunciation-log.md`.
  - **Plan:** `tools/build_plan.py` now takes `PLAN_CONFIG` (`production/scripts/ep04-lincoln/plan_config.py`: windows, beats by phrase, spoken years → numerals). 29 silent beats, 113.2 s; `edit-plan.md`, `chapters.txt`.
  - **Captions:** faster-whisper small.en word timings → `tools/align_captions.py` (now maps spoken years) → `captions-aligned.srt`, 151 cues, 96.8% of words matched, median shift 0.07 s. `scripts/timeline.py` → `src/timeline/timeline.json`.
  - **Picture:** `src/Episode.tsx` (composition `Episode`, 18,000 frames) plays `src/scenes/S01–S10.tsx`, each with its own solver/sets files (`s0N-*.ts(x)`). Shared kit: `USMap.tsx` (us-atlas, ISC; WV merged into VA before 1863; Natural Earth water; credits in `credits-maps.md`), `Horse.tsx`, `Flatboat.tsx`, `Flag.tsx`, `Sets04b.tsx`, plus test composition `KitTest`. Bliss plate corrected to "Written 1864 · the only copy signed and dated" (its signature line is dated 19 November 1863). Checks: `tsc` clean; `check-contacts.mjs` PASS (worst 1.22 px, all chapters); each builder ran freezedetect n=0.003 d=1.5 on its chapters and fixed every hit; Director's 40-frame contact sheet reviewed.
  - **Sound:** `scripts/audio.py` (Episode 4): original score cues 1M1–1M11 per the cue sheet (Phase B theme, fiddle/piano → strings/horns → war ostinato → piano reprise → full finale), 112 SFX cues, no public-domain tunes used. `public/audio/mix.wav` 600.000 s, **−14.1 LUFS, −1.5 dBTP**, no silence ≥ 1.5 s, narration 20 dB over music in speech, every group at its plan time (0.0 ms). Stems in `output/stems/`. Listen copy `production/audio/ep04-lincoln/episode-04-mix-listen.mp3`; `sound-notes.md`.
  - **Not done in C (Phase D):** full render, full QC, listening pass, thumbnail, publishing pack, iPhone copy.
  - **Next: Phase D.**
- 20 Nov 2026, **Phase D** (branch `claude/clever-albattani-64lx7v`):
  - **Render:** 10 chunks (about 6 min each at concurrency 4), muxed with the Phase C mix, then the video re-encoded from Remotion's full-range JPEG pipe (`yuvj420p`) to standard limited-range `yuv420p` BT.709 (crf 17). Final `production/exports/ep04-lincoln/episode-04-lincoln-1080p.mp4` (not in Git; `.gitignore` updated).
  - **Fixes made in D:** (1) the title plate now emerges on the score's impact at 28.72 s (`S01.tsx` TITLE = beat start + 3.6 s; it had appeared 3 s early); (2) two caption cues held text through silent beats (14.6 s and 12.1 s on screen) and were split at the sentence break (`captions-aligned.srt` now 153 cues, longest 5.3 s; `timeline.json` regenerated, no `T()` anchor moved); (3) near-freezes found by freezedetect: 3.4 waterfront, 8.7 dusk fields and 9.3 empty chair now keep the camera moving through their edges (the limited-range conversion shrinks frame differences by about 14%, which pushed slow eased moves under the threshold).
  - **Lesson:** a shot can straddle a chunk boundary; when a scene changes, re-render every chunk the shot touches (`Shots` start/end → frames ÷ 1800).
  - **QC:** `production/reports/qc/ep04-lincoln/qc-final-render-2026-11-20.md`. **iPhone copy:** `episode-04-lincoln-720p-small.mp4` + `iphone-parts/` (4 × 3 min). **Publishing pack:** `production/exports/ep04-lincoln/youtube/` (pack, titles, tags, chapters, thumbnail + alt, checklist). New `Thumbnail` composition (`src/scenes/Thumbnail.tsx`, `variant: main | memorial`).
  - **Open for Craig:** listen once at normal speed (nobody has heard the mix; the recogniser heard Bedell, Appomattox and Petersen correctly); Approval 4.
  - **Next: Craig's Approval 4.** Record it with `python3 production/tools/status.py approval final-render --episode ep04-lincoln --state APPROVED|CHANGES_REQUESTED --note "…"`. Nothing is uploaded or published automatically.

- 21 Nov 2026, **Phase D2** (branch `claude/sweet-einstein-gtzfnt`, which continues `claude/clever-albattani-64lx7v`): ElevenLabs narration and score, re-time, re-render, QC. **Stopped at Approval 4.**
  - **Captions:** aligned to the new narration (`tools/align_captions.py`), the two cues that straddled silent beats split (`split_long_cues.py`), then polished (`polish_captions.py`): seven runs re-segmented where the new voice's pauses had left breaks such as "Ulysses S." | "Grant. An estimated…", and every cue re-wrapped (two lines, 42 characters, no name split across the break). 155 cues, longest 5.5 s, no overlaps. The words never change. One command rebuilds plan, captions and timeline: `bash production/scripts/ep04-lincoln/rebuild-timing.sh`.
  - **Plan:** `plan_config.py` rebalanced again (total still 600 s) so three holds keep room: title beat 4.8 s, the clock at 7:22 3.6 s, end beat 6.7 s; chapter cards are 2.5 s. Chapter starts: 0:00, 0:32, 1:25, 2:15, 3:20, 4:28, 5:24, 6:55, 8:01, 8:50.
  - **Score:** ten instrumental cues from ElevenLabs Music in `production/audio/ep04-lincoln/elevenlabs-score/` (README there: prompts, ids, about 9,400 credits; **do not regenerate**). No sung words found by the voice detector. `audio.py` `compose_el()` places each cue on a picture moment measured inside the cue (title chord, hush in the grave beat, Cooper Union chord, crest falling away in the cemetery beat, piano at "At the dedication,", title chord again on the end card). Charleston has no music, as on the cue sheet. Synthesised hits kept: title impact and percussion-only accents. `SYNTH_SCORE=1` gives the old synthesised score.
  - **Mix:** −14.0 LUFS, −1.5 dBTP, no silence ≥ 1.5 s, narration 24 dB over the music (median), music in the beats −20 to −33 LUFS. New in `audio.py`: a slow level ride per cue, a 12 dB duck, and a speech-aware ceiling (music never closer than 19 dB to the narration under speech). Details and all measurements: `production/audio/ep04-lincoln/sound-notes.md`. **Nobody has listened.**
  - **Picture re-time:** every chapter was reviewed against the new shot lengths (`scripts/shot-table.mjs` prints the shot table; code timings plus stills). Fixed: four events in chapter 8 that were pinned to the first narration's clock times (tally board, Second Inaugural page, Douglass attribution, Hodges letter write-on) and the hard-coded times in `S10.tsx`; the firelight shot's camera (2.7), the parents' name tags (2.2), the Cooper Union camera keys that had crossed (5.9), the Fort Sumter flag that no longer finished coming down (6.7), the cut to the 1922 seating (10.5), title plates that ran into the narration (now tied to the card beat), and about a dozen smaller timings (clocks in 1.2, New Salem camera, 1841 letter, Atlanta map, marching columns, Bliss glow, "1,654 miles", lectern). Two small improvements beyond re-timing: the Grant and Lee tags stay until both are named, and the gold highlight on "are, and henceforward shall be free" now shows (it had always been hidden under the page).
  - **Render:** 10 chunks (65 minutes at concurrency 4), each scanned for freezes and black as it landed; one encode to limited-range BT.709 with the `colorspace` filter (`iall=bt601-6-625:irange=pc`, the chunks are full-range BT.601; crf 17) and the mix muxed in the same pass. Final `production/exports/ep04-lincoln/episode-04-lincoln-1080p.mp4` (318 MB, not in Git).
  - **QC:** `production/reports/qc/ep04-lincoln/qc-final-render-2026-11-21.md`: 600.000 s, 18,000 frames, −14.1 LUFS, −1.3 dBFS peak, no silence, no black, no freeze; caption sync median +5 ms. An independent visual pass of the delivered file was completed (see below).
  - **Deliverables:** 1080p master; `episode-04-lincoln-720p-small.mp4` (67 MB) + `iphone-parts/` (4 parts); `episode-04-subtitles.srt`; publishing pack with the new chapters and credits (narration: ElevenLabs voice Liam Dale, synthetic; music: ElevenLabs Music; do not register in Content ID).
  - **After the independent QC pass (same day):** seven reviewers checked the delivered file and the pack. Fixed and re-rendered (chunks c02 and c05 only, then one re-encode): three captions at 5:28-5:36 that ran up to 1.4 s early (the recogniser had dropped those words; they are now hand-timed in `polish_captions.py`, `RETIME`), and John T. Stuart's hidden name tag. **Open for Craig:** the 1922 dedication shot (9:23) does not visibly show a separate section (the crowd is the same on both sides of the rope; the series' all-white heads rule means it needs a staging idea, not a colour); three captions still lead by about 0.5 s (3:39, 7:33, 9:35: add them to `RETIME` if another render happens). Minor points not changed are listed in the QC report. The interim files sent before this pass are superseded.
  - **Left as it was (not re-timing; for a later pass if Craig wants):** 7.2 Willie's bedside is 3.4 s (the narration moves on quickly); the corridor door in 9.3 is fully open only 0.2 s before the cut; Douglass has no name tag in 10.6 (he is tagged at his first appearance, 7.8); neither quotation page in chapter 5 uses the glow-follows-the-words treatment; the write-on of the Hodges letter and the Second Inaugural runs a little ahead of the voice by the end of each page (the page shows slightly more text than is spoken).
  - **Lessons:** (1) grep scene code for programme seconds (`[0-9]{3}\\.[0-9]`) after any re-time: `T()` anchors move, literals do not; (2) a `kf()` camera whose keys cross snaps in one frame, so derive neighbouring keys from the same anchor; (3) a quick, tightly scoped reviewer per chapter (shot table + stills + "do not render") finds these in about three minutes each; (4) `audio.py` needs about 9 GB of memory, so do not run it beside a render and reviewers.
  - **Next: Craig's Approval 4.** Record it with `python3 production/tools/status.py approval final-render --episode ep04-lincoln --state APPROVED|CHANGES_REQUESTED --note "…"`. Nothing is uploaded or published automatically.

## Phase D2: next steps (done on 21 Nov 2026; kept for reference)

**Prompt for the new chat:**
> Director: continue ep04-lincoln Phase D2 (ElevenLabs narration and score, re-time, re-render, QC) from `production/scripts/ep04-lincoln/HANDOVER.md` on branch `claude/clever-albattani-64lx7v`. Follow "Phase D2: next steps". Stop at Approval 4 and send me the video and the iPhone copy.

**Craig's review of the first render (all agreed, 20 Nov):** the Gettysburg page at 6:40 was dizzying; dripping water sounds were annoying; chapter 9 needed real animation; the music was too loud; he then signed up to ElevenLabs Creator and wants "absolute quality" voice and soundtrack. He chose narrator **Liam Dale** ("voice 1 all day long") and liked the ElevenLabs music test ("excellent"). Channel-wide standards are now in `CLAUDE.md` and `production/audio/voice-bible.md`.

**Done and pushed:**
- Picture: steady slow push on the Bliss page with a glow following the words (`S07.tsx` Bliss; smoothed ride in `S10.tsx` Bliss107); chapter 9 animated (`S09.tsx`, `s09-sets.tsx`, `s09-solve.ts`: Booth walks down the corridor in silhouette and opens the box door a crack; the box dims, curtains sway, a playbill falls; four men carry a cloaked figure to the Petersen House; covered figure on the bed with a vigil).
- Sound: `sfxlib.g_water` is a soft wash (no drips); `audio.py` puts narration 24 dB over music and caps beat swells 5 dB lower.
- An interim render with these fixes and the **old Kokoro voice** was encoding to `production/exports/ep04-lincoln/episode-04-lincoln-1080p.mp4` when the chat ended (check it finished; the iPhone copy there is still the first render). It was not QC'd or sent. It will be replaced anyway.
- **New narration (ElevenLabs, Liam Dale `w2ZdKT3ghAOcMRbpjC3u`, `eleven_v4`):** 27 group MP3s in `production/audio/ep04-lincoln/elevenlabs-groups/g00–g26.mp3` (about 8,000 credits spent; do not regenerate). Assemble with `cd the-human-story/episode-04-lincoln && mkdir -p output/el-voice output/el-full && cp ../../production/audio/ep04-lincoln/elevenlabs-groups/*.mp3 output/el-voice/ && /home/user/audio-py/bin/python scripts/el_assemble.py` (needs `output/full-voice/narration-draft-audit.json`, restored as in the Phase D notes) → `output/el-full/narration-draft.wav` (48 kHz, 525.1 s, speech 515.2 s) + audit. `audio.py` accepts 48 kHz.
- **Plan rebuilt for the new narration** (`plan_config.py` windows rebalanced, total still 600 s; `edit-plan.json/.md`, `chapters.txt`, `captions-provisional.srt` regenerated). Chapter starts moved (e.g. 6:57, 8:03, 8:52): update `production/exports/ep04-lincoln/youtube/chapters.txt` and the description from the new `chapters.txt`.
- `production/audio/ep04-lincoln/words.json`: faster-whisper word timings of the **new** narration (1,258 words).
- ElevenLabs flow for this episode: `6mPDtzpEd9bY5xiPbI5f` (voice samples and the 40 s music test are on it; test MP3s in `production/audio/ep04-lincoln/voice-samples/`).

**Still to do, in order:**
1. **Captions:** `python3 tools/align_captions.py production/audio/ep04-lincoln/words.json production/scripts/ep04-lincoln/edit-plan.json production/scripts/ep04-lincoln/captions-provisional.srt production/scripts/ep04-lincoln/captions-aligned.srt production/scripts/ep04-lincoln/captions-alignment-report.json`. Then split any cue longer than 6 s at the sentence break (the first pass had two that straddled silent beats: "he has picked up." | "At nineteen," and "men are created equal." | "In April 1864,"). Check the names heard: Bedell, Appomattox, Petersen, John T. Stuart, Robert E. Lee, Ulysses S. Grant.
2. **Timeline:** `python3 scripts/timeline.py ../../production/scripts/ep04-lincoln/captions-aligned.srt`, then `npx tsc --noEmit` and stills of every chapter. Every shot is anchored to captions with `T()`, so shots re-time themselves, but check: `S10.tsx` Bliss107 has hard-coded times (579.0 and 584.6 s: re-anchor to the new caption times); `S01.tsx` title = title beat start + 3.6 s must still match `audio.py` T_TITLE (beat start + 4.0); chapter 1's window shrank from 35 s to 30.9 s (title plate hold is shorter); `S09.tsx` corridor timings (walk ends frame 168, door at 186–240) against the new shot length; run `node scripts/check-contacts.mjs`.
3. **Score with ElevenLabs Music** (`creative_generate_in_flow`, node_type `music`, model `eleven_music_v2_5`, `generations_count` 1, flow `6mPDtzpEd9bY5xiPbI5f`; a 40 s cue cost 900 credits, so about 13,500 for 600 s: tell Craig the estimate before generating; `account_get_usage` is not permitted on this connector, so the balance cannot be read). One instrumental cue per chapter at the chapter's exact new length, following `production/storyboards/ep04-lincoln/music-cue-sheet.md` and the prompt style of the approved test (in `CLAUDE.md`). The test output listed "Instrumental: False"; say "instrumental only, no vocals, no choir words" and check each cue for sung words. Then load the cues in `audio.py` in place of `compose()` (crossfade at chapter starts, keep the duck curve and the 24 dB rule, keep the SFX), and keep an impact on the title at T_TITLE.
4. **Mix, render, QC, deliver:** as in the Phase D notes (all 10 chunks must re-render because every caption and shot moved); convert to limited-range `yuv420p` (command in the Phase D entry); freezedetect on the delivered file; A/V sync spot check; new QC report; iPhone copy and parts; update the publishing pack (chapters; credits now "Narration: ElevenLabs voice (Liam Dale), synthetic voice; Music: generated with ElevenLabs Music"; keep the synthetic-voice disclosure); update the dashboard; stop at Approval 4 and send the video and iPhone copy.

**Tools in this container (gone in a new one; reinstall as in the Phase D notes):** `/home/user/audio-py` (numpy, scipy, soundfile), `/home/user/fw-py` (faster-whisper; decode audio with ffmpeg to a float32 array before `transcribe`, passing a file path fails here).

## Phase D notes (from Phase C)

**Restore the working state (about 10 minutes).** Generated media is not in Git except the narration.
```bash
cd the-human-story/episode-04-lincoln && npm ci
export REMOTION_BROWSER=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/*/)chrome-headless-shell
uv venv --python 3.12 /home/user/audio-py && uv pip install --python /home/user/audio-py/bin/python numpy scipy soundfile
mkdir -p output/full-voice && ffmpeg -i ../../production/audio/ep04-lincoln/narration-draft.flac -ar 24000 -sample_fmt s16 output/full-voice/narration-draft.wav
cp ../../production/audio/ep04-lincoln/narration-draft-audit.json output/full-voice/
/home/user/audio-py/bin/python scripts/audio.py output/full-voice     # about 4 min -> public/audio/mix.wav + output/stems/
npx tsc --noEmit && node scripts/check-contacts.mjs
bash scripts/render.sh video && bash scripts/render.sh mux          # 10 chunks of 1800 frames -> output/episode-04-lincoln.mp4
```
The narration need not be re-rendered. If it ever is: `scripts/voice_sample.py` (overrides for Appomattox and the initials), then `PLAN_CONFIG=production/scripts/ep04-lincoln/plan_config.py python3 tools/build_plan.py …`, faster-whisper words, `tools/align_captions.py`, `scripts/timeline.py` (exact commands in the Phase C entry below), and a re-run of `audio.py`.

**Known items for QC** (from the builders' reports and the Director's 40-frame contact sheet):
- Shots 8.5, 10.2 and 10.5 run 5–6 s, and 7.4 (the Cabinet hand-overs) only about 3.7 s, because the narration is tight there.
- Fort Sumter (6.6) reads a little like a ship on the water. Figures are cropped at the frame edges in the Douglass reception (8.5).
- No speech bubbles anywhere: `documents.json` has no sourced Douglass wording, so 8.5 carries only "as Frederick Douglass later recalled".
- Kit simplifications: generic hall for Cooper Union; the Appomattox parlour and the Petersen House are chapter-local sets; Kansas–Nebraska and the Proclamation's excepted areas are approximate shapes, labelled "excepted areas simplified"; the flatboat poler turns with an instant flip; the kit `doffHat` over-reaches (10.1 uses a local fix).
- The title impact in the score assumes the title plate lands at 28.72 s; check it against the picture. The Memorial crescendo peaks at 554.9 s, as the crane starts. Nobody has listened yet: listen for Petersen, Bedell and Appomattox (`production/audio/ep04-lincoln/pronunciation-log.md`) and for the mix balance.
- The end card is drawn in `s10-sets.tsx` (the kit's end card is Episode 3's).
- Render stills with `--scale=0.25`, not 0.33 (non-integer height). Put check stills and test renders in the scratchpad, not `production/` (Phase C moved 36 MB of them out of Git).

## Phase C notes (from Phase B)

- Browser for Remotion here: `export REMOTION_BROWSER=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/*/)chrome-headless-shell` (no `remotion browser ensure` needed). The 40 s reel rendered in about 2 minutes at concurrency 4.
- Audio Python: `uv venv --python 3.12 ../audio-py && uv pip install --python ../audio-py/bin/python numpy scipy soundfile` (about 1 minute). Kokoro and faster-whisper still need the Episode 3 setup.
- Build scenes the reel's way: a pure solver per shot (pose, props, camera, `checks`, `seats`) plus a drawing component. Add each new shot's solver to `check-contacts.mjs` so contact errors fail loudly.
- Placement scales already include the cast scale: `Person scale = pl.scale / CAST[id].scale` (see `FigEl` in `UpgradeTest.tsx`).
- Reach limits are real: adult arm 93 px × scale, Lincoln (TALL) 101 px × scale. Stage props within reach (the checker found three out-of-reach moments in the first pass).
- `src/Episode.tsx` is a stub and `src/timeline/timeline.json` is still Episode 3's; Phase C replaces both from the narration, plan and captions.
