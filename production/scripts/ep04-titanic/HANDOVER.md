# The Human Story · Episode 4 handover
Written 19 November 2026 (milestone 0: brief, animation upgrade spec and build route) · **Titanic** (working title; the title is set with the script)

## Start here

This handover is written for **ChatGPT Codex** working in the GitHub repository `craigwaters1986-ux/Claude`. Paste this into a new Codex task, with this file attached or committed:

> “Make The Human Story Episode 4 (Titanic) from `production/scripts/ep04-titanic/HANDOVER.md`. Follow `CLAUDE.md` and the handover exactly. Work through the next stage, update the handover before you finish, and stop at each approval point marked STOP.”

**Finish condition.** Deliver a reviewable **10:00** (600.000 s) H.264/AAC MP4 at 1920×1080, 30 fps. Also deliver a thumbnail, upload-ready subtitles, publishing copy, QC notes, an iPhone-sized copy and an updated handover. Craig publishes manually after final review. Nothing is ever uploaded or published automatically.

**Big change from Episode 3.** Craig wants the animation clearly better (section “Animation upgrade”):

- people sit on real seats
- more movement
- more facial expression
- speech bubbles
- letters and documents carry real, readable text instead of scribble

These are acceptance requirements, not suggestions. Build them into the engine first (Stage A2) and prove them in a short test reel before the episode is animated.

**Stages and approval points (Lean mode, `production/LEAN-MODE.md`).**

| Stage | Work | Ends with |
| --- | --- | --- |
| A1 | Environment setup and restore (below). Research (extend the existing ep00 Titanic notes), then the script, then one combined fact and quality review | **STOP: Approval 1 (script).** Show Craig the script and the source list |
| A2 | Engine upgrade: seats, movement, expressions, speech bubbles, readable documents. 20–30 s test reel `output/ep04-upgrade-test.mp4` plus a contact sheet | Batched with A3 |
| A3 | Narration render, locked edit plan, storyboard (scene plan per chapter) | **STOP: Approvals 2 + 3 (style and storyboard), batched.** Show the test reel, 6 style stills and the storyboard |
| B | Full animation, music and SFX, mix, render, QC, publishing pack, iPhone copy, handover update | **STOP: Approval 4 (final render).** Show the finished review package |

Record approvals in `production/reports/approvals.md` (`python3 production/tools/status.py approve …` if it runs; otherwise append by hand and say so). Make routine editorial and production decisions without extra approval rounds. Ask Craig only at the STOP points, or when a fact cannot be sourced.

**Credits.** Craig's Claude credits reset on Sunday. Episode 5 will be made in Claude after that, so leave this handover and the repository in a state a fresh session can pick up cold (section “Maintain this handover”).

## Episode 3: what this builds on (verified 18 November 2026)

Episode 3 (*The Gunpowder Plot: The Letter That Changed the Fifth of November*, 12:00) was finished and QC'd in Claude on 18 November 2026:

- 720.000 s at 1080p/30 fps, H.264 High + AAC 48 kHz
- −14.0 LUFS, −1.3 dBFS true peak
- no black frames, no freezes ≥ 2.5 s, no silence ≥ 1.5 s
- captions aligned to the recorded words

Everything is pushed to branch **`claude/epic-mccarthy-8szsrf`**. Episode 4 copies that engine and keeps its look. Read these before writing code:

- `production/scripts/ep03-gunpowder-plot/HANDOVER.md`: how Episode 3 was built and verified.
- `production/reports/qc/ep03-gunpowder-plot/qc-final-render-2026-11-18.md`: the QC bar to meet again.
- `the-human-story/episode-03-gunpowder-plot/`: the engine to copy.

| Engine file (Episode 3) | What it is | Reuse in Episode 4 |
| --- | --- | --- |
| `src/Episode.tsx` | Sections in `<Sequence>`s, caption layer, logo | Copy; change the section list |
| `src/timeline/index.ts` + `timeline.json` | Plan, captions, `T('phrase')` caption anchors (throw if missing) | Copy as is |
| `src/kit/Shots.tsx` | `Shots` sequencer (absolute times, crossfade/dip/wipe), `Frame`, `Cam` | Copy as is |
| `src/kit/Cards.tsx` | Chapter card, title card, end card, `CaptionLayer` (band y 916–1080) | Copy; adjust titles |
| `src/kit/Cast.tsx` | Cast presets + `Person` wrapper (name tag on first appearance) | Replace the cast with 1912 people |
| `src/kit/Paper.tsx` | Letters, books, sheets, `Hand` scribble, `QuoteType` | **Upgrade**: readable text (below) |
| `src/kit/Maps.tsx` | Natural Earth map (`world-atlas` 50m), `PlaceDot`, `Route` | Copy; North Atlantic view |
| `src/kit/Places.tsx` | Sets (street, rooms, palace, bonfire …), `PlaceTag`, `Sky`, `River` | Keep generic parts; build ship sets |
| `src/scenes/sets.tsx` | Reusable shots, `walker()` with planted feet, `Portrait`, `passPose` | Copy; extend |
| `src/characters/*` | Stick-figure rig, `Head` (expressions, hats, ruffs), poses, IK | **Upgrade**: seats, expressions, bubbles |
| `scripts/voice_sample.py` | Kokoro narration renderer with phoneme overrides and `--groups-from` | Copy; new overrides |
| `scripts/timeline.py`, `scripts/stills.mjs`, `scripts/render.sh` | Timeline JSON, batch PNG stills, chunked resumable render + mux | Copy; set the total frames to 18,000 |
| `scripts/audio.py`, `audio_lib.py`, `sfxlib.py` | Narration placement, procedural score, synthesised SFX, ducking, −14 LUFS master | Copy; rewrite the cue list and score plan |
| `tools/build_plan.py`, `tools/align_captions.py`, `tools/seed-phrase-cache.py` | Locked edit plan + captions; word alignment; phrase cache | `build_plan.py` holds Episode 3's section table: replace it |

## Environment (Codex)

Earlier Codex workspaces had **no network during the task**: pip, npm and model downloads failed and no audio or video could be rendered (see the Episode 3 handover, milestone 2). Put **every download in the Codex environment's setup script**, which runs with internet before the agent starts. If the task phase has internet as well, nothing changes.

Setup script (runs from the repository root; idempotent):

```bash
set -euo pipefail
apt-get update -qq && apt-get install -y -qq ffmpeg espeak-ng zip >/dev/null
# engine for Episode 4 (created in Stage A2 by copying Episode 3; set it up for whichever exists)
for E in the-human-story/episode-04-titanic the-human-story/episode-03-gunpowder-plot; do
  if [ -f "$E/package.json" ]; then (cd "$E" && npm ci && npx remotion browser ensure); fi
done
pip install -q uv
uv venv --python 3.12 ../voice-pt
uv pip install --python ../voice-pt/bin/python --torch-backend cpu \
  kokoro==0.9.4 torch==2.15.0+cpu soundfile==0.14.0 phonemizer==3.6.0 espeakng-loader==0.2.4 faster-whisper==1.1.1
uv venv --python 3.12 ../audio-py && uv pip install --python ../audio-py/bin/python numpy scipy soundfile
mkdir -p ../voice-assets
for item in config.json kokoro-v1_0.pth voices/bm_george.pt; do
  curl -fsSL --retry 3 "https://huggingface.co/hexgrad/Kokoro-82M/resolve/main/$item" -o "../voice-assets/${item##*/}"
done
# speech-recognition model for caption alignment, cached for offline use
../voice-pt/bin/python -c "from faster_whisper import WhisperModel; WhisperModel('small.en', device='cpu', compute_type='int8')"
```

| Model file | Expected SHA-256 |
| --- | --- |
| `config.json` | `5abb01e2403b072bf03d04fde160443e209d7a0dad49a423be15196b9b43c17f` |
| `kokoro-v1_0.pth` | `496dba118d1a58f5f3db2efc88dbdc216e0483fc89fe6e47ee1f2c53f18ad1e4` |
| `bm_george.pt` | `f1bc812213dc59774769e5c80004b13eeb79bd78130b11b2d7f934542dab811b` |

Version pins used for Episode 3:

- Remotion `4.0.543`, React `18.3.1`, TypeScript `5.6.3`
- Node 22, Python 3.12
- Kokoro `0.9.4`, torch `2.15.0+cpu`, faster-whisper `1.1.1`

Notes from Episode 3:

- faster-whisper's own audio loader failed on this PyAV build (`metadata_errors`). Decode a 16 kHz mono WAV with ffmpeg first, read it with `soundfile` and pass the array to `transcribe`.
- If Node cannot enumerate network interfaces in the sandbox, preload `tools/remotion-local-interfaces.cjs` from the Episode 3 checkpoint (`NODE_OPTIONS=--require=…`).
- Rendering ran at about 20 frames per second with concurrency 4, so about 15 minutes for 18,000 frames.
- `scripts/audio.py` took about 20 minutes, mainly the score and the crowd generator. It caches `output/music-stem.npy`; set `REUSE_MUSIC=1` to reuse it.
- `parliament.uk` and some museum sites refuse automated fetches (HTTP 403). Use another primary source or a search summary, and say which.

## Restore the source

```bash
git clone https://github.com/craigwaters1986-ux/Claude.git Claude && cd Claude
git switch claude/epic-mccarthy-8szsrf          # Episode 3 complete, plus this handover
git switch -c ep04-titanic                      # Episode 4 work branch
```

Commit on `ep04-titanic` at each stage and push or open a PR the way Codex allows. Do not rewrite existing history. Keep generated media out of Git: `.gitignore` already excludes engine `output/`, `public/audio/`, `public/sfx/`, model weights and node_modules. Add the Episode 4 exports MP4/ZIP rules as Episode 3 did. GitHub rejects files over 100 MB.

## Established decisions (carry over unchanged)

- Series look: stick figures with big round white heads, thick ink outlines, thin black limbs, flat muted colours and a slight hand-drawn boil.
- The channel logo (`ChannelLogo`, 104 px at x 32, y 28, top layer) is on every frame. Keep x < 170, y < 150 clear of all other text.
- Captions are burnt in, in the series band (`CaptionLayer`, dark band y 916–1080, gold rule, 45 px, at most 2 lines of 42 characters, 0.8–6 s per cue), and also supplied as SRT. Picture, labels and bubbles stay above y = 916 while captions show.
- British English everywhere.
- Narration: Kokoro `bm_george` (approved by Craig). Connected sentence groups, speed **0.99**, 0.21 s between groups, 0.34 s between sections. Phoneme overrides for names go in `voice_sample.py`. Pin grouping with `--groups-from` whenever a phoneme fix could regroup sentences.
- Captions are timed to the recorded words: faster-whisper word timestamps via `tools/align_captions.py`. Check coverage (Episode 3: 96.9%).
- Shots are anchored to caption text with `T('phrase')`, so script edits fail loudly instead of drifting. Normalise curly quotes in anchors (Episode 3 lost a 25-minute mix run to `’` vs `'`).
- Name tags for historical figures at first appearance. Illustrative people are never named or presented as real.
- Never invent facts, figures or quotations. Label estimates and disputed points. Death and suffering are shown soberly and never graphically: no bodies, no drowning, no comic sound effects.
- Music and SFX are original and synthesised (numpy/scipy; no samples). Narration sits about 20 dB above the music and effects during speech. Master to −14 LUFS, true peak ≤ −1 dBTP.
- Chapter cards in the silent beats. YouTube chapters list every section from 00:00.

## Animation upgrade (Craig's requirements: acceptance criteria)

Build these into the Episode 4 engine (`the-human-story/episode-04-titanic/src/`) in Stage A2. Each item has a test in the 20–30 s **upgrade test reel**, which Craig sees at the A3 stop.

### 1. People sit on seats

*Problem in Episode 3:* seated figures used `seated()` (hips at 54 px above the ground in local units) but often had no seat drawn under them, so some of them float.

- Add `src/kit/Seats.tsx` with `Chair`, `Stool`, `Bench`, `Pew`, `DeckChair` (1912 wooden steamer chair, reclined), `LifeboatThwart` (a seat across a lifeboat) and `DiningChair`. Each exports its **seat-top height** and the **foot line**.
- Add `SeatedPerson` (wrapping `Person`). It draws the seat first, then the figure, with the hip exactly on the seat top. Get the hip from `solveSkeleton(pose).hip` in `characters/skeleton.ts` (hip y = −L + bob, L = 108 adult or 74 child, times scale). Feet go on the floor line; shorten or lengthen the shin with knee bend rather than letting feet float. Support `recline` for deck chairs (lean −20° to −35°) and `side` for benches seen end-on.
- Sitting down and standing up are animated poses, not cuts: `sitDown(t)` and `standUp(t)` over 20–30 frames with weight shift.
- Lifeboat shots: figures sit on thwarts, rocking with the boat (shared transform). Rowers use a looping `row(phase)` pose with oars.
- **Acceptance:**
  - In every seated figure in the test reel and the episode, the hip is within 3 px of the seat top and the feet are on the floor or footrest.
  - No seated pose is ever drawn without a seat.
  - Add a dev-only `?debug=seats` overlay that draws hip and seat-top markers, and use it on the contact sheet.

### 2. More movement

*Problem in Episode 3:* the first full-film scan found 7 near-still stretches on portrait cards, fixed by camera pushes. Many shots relied on camera drift with figures standing still.

Rules for every shot:

- At least one **character action** besides breathing and camera drift: walking, gestures, turning, sitting down or standing up, handing over an object, writing, rowing, pointing.
- **Secondary motion**: coat tails and skirts swing after walks; hats bob; smoke from funnels; water moving; lights flicker; flags and ropes move; background people cross.
- **Ship motion**: on deck and in the sea shots, add a slow roll (±0.6°) and swell. After the collision, interpolate the list and trim across the sinking chapter from the sources: bow down, then the stern rising. Show it soberly, never as spectacle.
- Hold no still card longer than 2 s. Portraits and documents always get a camera move plus an in-frame action, such as a hand turning a page or a pen writing.
- Background crowds use `lod="low"` and varied cadences. No two neighbours walk in step.
- **Acceptance:** `ffmpeg … freezedetect=n=0.003:d=1.5` over the final file reports **nothing**. Episode 3 used n = 0.0015, d = 2.5; this is stricter.

### 3. More facial expression

- Add an expression timeline helper, `exprAt(f, [[0,'neutral'],[40,'worried'],[90,'relieved']])`. It returns the expression for the frame and drives a blend: brows, eye openness and mouth interpolate over 6–8 frames instead of snapping.
- Extend `Head.tsx` expressions with `thinking` (eyes up-left, mouth to one side), `shocked` (wide eyes, small open mouth, raised brows), `relieved` (soft brows, small smile), `hopeful`, `grim` and `afraid` (fear without cartoon marks, for the sinking). Keep `solemn` and `tired` for grief.
- Faces react in order: **eyes first, then head, then body**. This matches the Episode 3 parish proof, where gaze leads, then head and weight shift, then the arm. Add `look` targets that follow events, such as the lookout's eyes before the bell.
- Add blinks (automatic, irregular, every 2–5 s) plus a deliberate blink on a reaction.
- Any character on screen for more than 4 s changes expression at least once, unless it is a deliberate frozen moment (for example shock).
- Talking mouths only when the character is shown speaking: during a speech bubble, or a silent conversation behind the narrator. Never lip-flap narration onto a character.
- **Acceptance:** the test reel shows each new expression in close-up, and one 4-second reaction beat: notice → worry → act.

### 4. Speech bubbles

- Add `src/kit/Bubbles.tsx`:
  - `SpeechBubble`: rounded, cream fill, 5 px ink outline, tail pointing at the speaker's mouth computed from `headWorld()`.
  - `ThoughtBubble`: cloud-shaped, with small circles.
  - `ShoutBubble`: spiky.
  - `RadioBubble`: square with a lightning tail, for wireless messages.
- Text appears word by word, at 12–16 characters per second. Montserrat 700, at least 34 px at final frame scale, at most 2 lines of about 22 characters. The bubble holds for at least (words ÷ 3 + 1) s after the last word, then pops out over 6 frames.
- Placement: inside the frame, above y = 900, never over the logo zone, never covering a face. Bubbles from different speakers never overlap; offset them vertically.
- **Accuracy rules (non-negotiable):**
  - **Real people say only documented words.** Use words recorded in a source in `production/research/ep04-titanic/research-notes.md`, with the source key in a code comment next to the bubble. Wireless messages in `RadioBubble` must be exact transcriptions. If wording is uncertain, show no bubble; describe the action with the narrator or a `PlaceTag` instead.
  - **Illustrative people** (unnamed passengers, crew, families) may speak short, generic, non-factual lines that state no new fact, for example “Look!”, “Hold on to me.”, “Is it far?”. They never put words in a real person's mouth.
  - While the narrator speaks, use bubbles of at most 5 words so viewers are not reading two things at once. Longer bubbles go in the silent beats.
- **Acceptance:** the test reel shows all four bubble types with tails tracking a moving speaker, and one exchange between two people.

### 5. Real, readable text in letters and documents (no scribble)

*Problem in Episode 3:* every letter, page and book used `Hand` scribble (`scribble()` in `Paper.tsx`), which Craig calls gobbledygook.

- Close-ups use real text. Add `src/kit/Documents.tsx` with `DocText`: multi-line text set inside a sheet, with optional write-on reveal (a stroke-dash mask on handwriting fonts, typewriter reveal on telegraphs), plus `Telegram`, `Newspaper`, `Ticket`, `Menu`, `Letter` and `LogBook` layouts.
- **Source the text**: exact transcriptions of real 1912 documents, with historical spelling and punctuation. Examples: wireless messages from the inquiry transcripts and the Marconi message record, newspaper headlines of 15–16 April 1912, inquiry report sentences, ticket wording. Store each document's text in `src/timeline/documents.json` as `{id, text, source, transcribed: true}` and render from there.
- If no exact text can be sourced, use a clearly labelled **summary panel** (“summarised”), as Episode 3 did for the Commons Journal. Never write invented text in a period hand.
- Background-only paper (far away, smaller than 14 px a line) may keep the scribble, but **anything the viewer can read must be real**.
- Fonts: bundle woff2 files in `public/fonts/` and load them in `components/Fonts.tsx`; nothing is fetched at render time. Record each licence in the episode credits. Suggested:
  - handwriting: **Caveat** (SIL OFL)
  - typewriter or telegraph: **Special Elite** (Apache 2.0)
  - 1912 newspaper and print: **Old Standard TT** or **Libre Baskerville** (SIL OFL)
  - all available from Google Fonts or `@fontsource`
- Legibility: at least 30 px per line at final frame scale. At most 8 words per line in close-ups. Hold each readable document on screen for at least (words ÷ 3 + 1.5) s, and let the camera travel along the line being read. Burnt-in captions must not cover the text: push documents above y = 900.
- **Acceptance:** every document close-up in the episode is real text from `documents.json` or a labelled summary. The contact sheet shows them legible at 640 px wide.

### Upgrade test reel (Stage A2 deliverable)

20–30 s, 1080p, composition `UpgradeTest`, rendered to `output/ep04-upgrade-test.mp4`, with a 12-frame contact sheet:

1. A family sits down at a dining table, then talks with speech bubbles and changing expressions.
2. A passenger reclines in a deck chair. Another walks past and the first looks up and reacts.
3. A wireless operator types. A `RadioBubble` shows a real, sourced message, for example the first CQD text if the sources give it exactly.
4. A close-up of a real newspaper headline from 16 April 1912, sourced.
5. A lifeboat with four people on thwarts, rocking, one rowing.

## Episode 4 content brief (for research and script)

**Starting point:** the ep00 Titanic test has fact-checked notes for a 45 s teaser. Extend them; do not rely on memory.

- `production/research/ep00-test-titanic/research-notes.md` and `sources.md`: the British Wreck Commissioner's report (S1) and US Senate report (S2), via the Titanic Inquiry Project; Britannica; Royal Museums Greenwich; Library of Congress; Encyclopedia Titanica.
- `production/scripts/ep00-test-titanic/script.md` and `production/reports/qc/ep00-test-titanic/qc-script-20261115.md`: worded figures that passed QC, such as “about 2,200 aboard”, “around 1,500 died (estimates; inquiries give 1,490–1,517)”, “20 lifeboats with room for 1,178”, collision “about 11.40 p.m. ship's time”, sinking “2.20 a.m.”.
- Disputed points already flagged there (D1–D3) stay labelled as disputed.

**Angle (proposal: the scriptwriter refines it, Craig approves).** Tell it through people and the paper they left behind, as Episode 3 did with the letter:

- the ice warnings that came in by wireless
- the messages sent that night
- the lifeboat arithmetic
- the headlines and inquiries that changed the rules of the sea

Possible working title: *Titanic: The Messages That Night*. Choose with keyword research at the end.

**Draft chapter outline (10:00).** Windows are targets; the locked plan comes from the recorded narration, as in Episode 3.

| # | Chapter (draft) | Window | Must cover (each claim sourced) |
| --- | --- | --- | --- |
| 1 | Cold open | 0:00–0:40 | A wireless message in the dark; the arithmetic of the lifeboats; title |
| 2 | The biggest ship afloat | 0:40–1:50 | Built at Harland & Wolff, Belfast, for the White Star Line; what “largest” means and in what sense (verify); who sailed and why |
| 3 | Leaving Southampton | 1:50–2:50 | 10 April 1912; Cherbourg; Queenstown; three classes of passenger and the crew; illustrative family seated in third class |
| 4 | Messages about ice | 2:50–3:50 | The wireless room (Jack Phillips, Harold Bride); ice warnings received (count and wording from the inquiries; disputed points labelled) |
| 5 | 11.40 p.m. | 3:50–4:50 | The lookouts (Frederick Fleet), the bell, the turn, the collision; damage and Thomas Andrews's assessment (sourced) |
| 6 | Room for half | 4:50–6:30 | Lifeboats loaded and lowered; “women and children first” as practised on each side; distress calls (CQD and SOS) and Carpathia's response (Captain Arthur Rostron); the Californian question (DISPUTED, labelled) |
| 7 | 2.20 a.m. | 6:30–7:40 | The sinking, soberly; the ship breaking up (as established by the 1985 wreck discovery; verify wording); the cold water stated plainly without imagery of death |
| 8 | Who was saved | 7:40–8:40 | Carpathia picks up the boats (first at about 4.10 a.m.); survival by class and sex from the inquiry figures (as a chart; numbers sourced) |
| 9 | What changed | 8:40–10:00 | The British and US inquiries; lifeboats for all, 24-hour wireless, the International Ice Patrol, the 1914 SOLAS convention (verify dates and terms); end on a real message or page; end card |

**Avoid unless sourced and labelled:**

- the “unsinkable” claim (who said it, when)
- the band's last tune
- exact numbers stated as certain
- dramatised last words
- Hollywood scenes

Real people in the episode carry name tags at first appearance:

- Captain Edward Smith
- Thomas Andrews
- J. Bruce Ismay
- Jack Phillips and Harold Bride
- Frederick Fleet
- Arthur Rostron
- others only if sourced

The family and most passengers are illustrative and unnamed. Sombre treatment for death: no bodies, no struggling in water, no screams in the mix.

**Duration:** 10:00, the channel default, unless Craig asks otherwise at the script stop. Words ≈ 145 per minute at speed 0.99. Episode 3's narration took 9:24 of 12:00, with silent beats closing the gap; aim for 8:45–9:00 of narration in 10:00.

## Build route (Stages A3 and B)

1. **Engine:** `cp -r the-human-story/episode-03-gunpowder-plot the-human-story/episode-04-titanic`. Rename the package, then delete the Episode 3 scenes and cast. Keep the kit, timeline, scripts and characters. Update `scripts/render.sh` (TOTAL=18000; 10 chunks of 1800 frames; output names) and `Episode.tsx` (9 sections).
2. **Narration:** put the approved script into `research/episode-draft.json` (same schema as Episode 3: `sections[{id, narration}]`). Add phoneme overrides for names the phonemiser gets wrong (check Ismay, Andrews, Rostron, Queenstown, Cherbourg, Carpathia, Californian, Harland & Wolff), then render:
   ```bash
   HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 ../../../voice-pt/bin/python scripts/voice_sample.py \
     --assets ../../../voice-assets --output output/full-voice --episode research/episode-draft.json
   ```
   Write `production/audio/ep04-titanic/pronunciation-log.md` (format as Episode 3).
3. **Plan:** adapt `tools/build_plan.py` (its `SECTIONS` table is Episode 3's) to Episode 4's sections, window lengths and silent beats from the storyboard. Target 600000 ms. It asserts each section ends on its boundary and the total is exact. Outputs `edit-plan.json`, `edit-plan.md`, `chapters.txt`, `captions-provisional.srt` in `production/scripts/ep04-titanic/`.
4. **Captions:** ffmpeg → 16 kHz mono WAV → faster-whisper `small.en` with word timestamps → `tools/align_captions.py` → `captions-aligned.srt`. Re-check any stretch the recogniser skips (Episode 3 had one) with a short clip run.
5. **Timeline:** `python3 scripts/timeline.py ../../production/scripts/ep04-titanic/captions-aligned.srt`.
6. **Scenes:** `src/scenes/S01.tsx`…`S09.tsx` using `Shots`, `T()` anchors and the upgraded kit. Ship sets to build:
   - exterior side view with four funnels, smoke, portholes and lit windows
   - boat deck with davits and lifeboats
   - wireless room
   - third-class general room
   - first-class dining saloon
   - bridge and crow's nest
   - the North Atlantic map (`Maps.tsx`, view about 60°W–0°, 40°N–55°N) with the route Southampton → Cherbourg → Queenstown → collision position (S1 gives 41°46′N 50°14′W)
   - Carpathia
   - night sky with stars and no moon (verify), calm sea
   - New York pier and newspaper sellers for the aftermath
7. **Stills check while building:** `node scripts/stills.mjs /tmp/stills <frames…>`, then tile with ffmpeg `xstack` and review. Check labels against faces, the caption band and the logo, as Episode 3 did per section.
8. **Sound:** rewrite the cue list and score sections in `scripts/audio.py`. Suggested sound world, all synthesised:
   - engine hum
   - sea and wind
   - wireless sparks and Morse
   - lookout bell
   - lifeboat davits and ropes
   - oars
   - Carpathia at dawn
   Keep it sober: no impact booms for the collision beyond a low scrape; no screams. Music drops to a drone over the sinking and the death toll. Then run `../../../audio-py/bin/python scripts/audio.py output/full-voice`.
9. **Render and mux:** `bash scripts/render.sh video && bash scripts/render.sh mux`. Re-render only changed chunks after fixes: delete `output/chunks/cNN.mp4` and run again.
10. **Thumbnail:** a `Thumbnail` composition at 1280×720, legible at 160 px, exported as JPEG under 2 MB.

## QC and deliverables (Stage B)

Run and record (copy the table format of the Episode 3 QC report into `production/reports/qc/ep04-titanic/qc-final-render-<date>.md`):

```bash
F=production/exports/ep04-titanic/episode-04-titanic-1080p.mp4
ffprobe -v error -show_format -show_streams "$F" > production/reports/qc/ep04-titanic/ffprobe-report.txt
ffprobe -v error -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$F"          # 18000
ffmpeg -nostats -i "$F" -vn -af ebur128=peak=true -f null - 2>&1 | grep -A12 Summary          # −14 LUFS, ≤ −1 dBTP
ffmpeg -nostats -i "$F" -vn -af silencedetect=n=-50dB:d=1.5 -f null - 2>&1 | grep silence_    # none
ffmpeg -nostats -i "$F" -an -vf "scale=480:-2,blackdetect=d=0.4:pix_th=0.06,freezedetect=n=0.003:d=1.5" -f null - 2>&1 | grep -E "black_start|freeze_start"   # none
```

Also run:

- an A/V sync spot-check with the recogniser on two 12 s clips of the final mix against SRT cue starts (within 0.3 s)
- a 36-frame contact sheet, reviewed for seats, bubbles, readable documents, labels, logo and caption clearance

Deliverables:

| File | What |
| --- | --- |
| `production/exports/ep04-titanic/episode-04-titanic-1080p.mp4` | Final review render (not in Git) |
| `production/exports/ep04-titanic/episode-04-titanic-720p-small.mp4` + `iphone-parts/` | **iPhone copy**: 1280×720, H.264 Main 3.1, about 600 kb/s video, AAC 96 kb/s, `+faststart`, about 55 MB for 10 min, plus 3-minute parts (`-c copy` segments) for when a single file will not download (not in Git) |
| `production/exports/ep04-titanic/episode-04-subtitles.srt` | Upload-ready subtitles (UTF-8, no BOM) |
| `production/exports/ep04-titanic/youtube/` | `publishing-pack.md` (description, chapters, sources, credits and licences including fonts, synthetic-voice note, content note), `title-options.md`, `keywords.md` (tags under 500 characters; search-led order as advised for Episode 3), `chapters.txt`, `thumbnail.jpg` + brief, `publishing-checklist.md` |
| `production/reports/qc/ep04-titanic/` | QC report and ffprobe report |
| `production/audio/ep04-titanic/episode-04-mix-listen.mp3` | Listen copy |

iPhone copy command used for Episode 3:
```bash
ffmpeg -i episode-04-titanic-1080p.mp4 -vf scale=1280:720 -c:v libx264 -preset medium -b:v 600k -maxrate 900k -bufsize 1800k \
  -profile:v main -level 3.1 -pix_fmt yuv420p -tag:v avc1 -c:a aac -b:a 96k -ac 2 -movflags +faststart episode-04-titanic-720p-small.mp4
for i in 0 1 2 3; do ffmpeg -ss $((i*180)) -t 180 -i episode-04-titanic-720p-small.mp4 -c copy -movflags +faststart iphone-parts/episode-04-part$((i+1))-of-4.mp4; done
```

## Lessons from Episode 3 (avoid repeating)

- Long labels overflowed fixed-width tags and pages. Measure text, or size from the character count with headroom (`PlaceTag` width = 22 px a character + 60).
- Map labels collided with icons and with each other. Place region labels away from markers, and keep groups of figures above y = 900 at the final camera zoom.
- An arm raised straight up was hidden behind the big head. Raise arms forward-up (shoulder about 105°, elbow about 60°) and use `nearArmFront`.
- A component that calls `useCurrentFrame()` inside a section (`FactPill`, `DateCard` from `Text.tsx`) receives section-local frames, not shot-local ones. Prefer components that take `f` explicitly.
- Never nest a `Frame` (an `AbsoluteFill` div) inside another `Frame`'s `<svg>`; it renders black.
- Validate every `cue()` and `T()` anchor before long renders (a quick script that evaluates them all).

## Maintain this handover

Update this document at each stage and before ending any Codex task:

- Put the next actionable step and the current verification at the top.
- Replace in-progress notes once results are verified.
- Record the branch and commit, file locations, exact restart commands, outstanding decisions and any media that cannot be regenerated: the narration WAV and audit, and the final MP4. These travel in `production/exports/ep04-titanic/episode-04-checkpoint.zip`, built as in Episode 3 (bundle, media, tools, SHA256SUMS), because they are not in Git.
- Keep the chat summary short; put the detail here.

**Hand-back for Episode 5 (Claude, after Craig's Sunday credit reset):** when Episode 4 is approved or paused, add a short section here called “State for Episode 5” saying:

- which engine (`episode-04-titanic`) is the newest and should be copied
- what the animation upgrade delivered and what is still weak
- the branch and commit to start from

Episode 5's subject has not been chosen.
