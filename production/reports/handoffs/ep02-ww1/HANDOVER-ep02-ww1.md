# HANDOVER — Episode 2 (ep02-ww1) "World War I: From Start to Finish"

**Date:** 2026-11-18 · **From:** Director · **Branch:** `claude/trusting-ritchie-6pgxw7` (repo `craigwaters1986-ux/Claude`)
**Where we are:** end of Phase C (assets and assembly). **Next:** Phase D (render, final QC, publishing pack, your approval).

---

## 1. One-paragraph summary

The whole 12-minute episode (720 s, 21,600 frames at 30 fps) is now assembled in code. All 11 sections
(s01–s11, 70 storyboard shots) are built, the type check passes (`npx tsc --noEmit` = 0 errors), and the
render soundtrack (`mix.wav`) has been rebuilt and measured. **Nothing has been rendered as video yet:** the
editors checked still frames only. What's left: a short smoke-test render, the full render, the final QC
review, the publishing pack, and your sign-off at checkpoint 4. Think of it like a house that's been fully
built and wired but where nobody has flicked the lights on yet. The next session's job is to switch
everything on, walk through every room, and hand you the keys.

---

## 2. What's finished

| Area | Status | Key files |
|---|---|---|
| Research (132 facts) + sources | ✅ | `production/research/ep02-ww1/research-notes.md`, `sources.md` |
| Script (approved, checkpoint 1) | ✅ | `production/scripts/ep02-ww1/script.md`, `script.json` |
| Style (approved, checkpoint 2) | ✅ | `production/characters/ep02-ww1/style-sample.png` |
| Narration v3 (approved by you) | ✅ | `production/audio/ep02-ww1/narration.json`, `episode-02-subtitles.srt` |
| Storyboard (approved, checkpoint 3) | ✅ | `production/storyboards/ep02-ww1/storyboard.md` |
| Characters / environments / maps | ✅ | handoffs `09-animator-characters.md`, `09-environment-designer.md`, `production/environments/ep02-ww1/map-notes.md` |
| Music + SFX + mix (approved by you) | ✅ | `production/audio/ep02-ww1/measurements.md`, `licences.md` |
| Name checks (Foch, Ellison) | ✅ | handoff `09-researcher-name-checks.md` |
| **Assembly s01–s05** (editor A) | ✅ today | `src/scenes/S01–S05.tsx`, `kit-ep02.tsx`, handoff `12-video-editor-assembly-a.md` |
| **Assembly s06–s11** (editor B) | ✅ today | `src/scenes/S06–S11.tsx`, `kit-b.tsx`, handoff `12-video-editor-assembly-b.md` |
| **Render audio rebuild 2** | ✅ today | `public/audio/mix.wav` (git-ignored), handoff `13-audio-engineer-rebuild-2.md` |
| Timeline + render script | ✅ | `src/scenes/Episode.tsx`, `scripts/render.sh` |

Engine folder for everything below: `the-human-story/episode-02-ww1/`.

---

## 3. What's left (Phase D) — step by step

Start a **fresh session** (Lean mode #13) and say: **"Director, continue ep02-ww1 — Phase D"**, then point it at this file.

### Step 0 — Fresh container set-up (about 15 min)
The render audio and `node_modules` are **not stored in git**, so every new container must recreate them.

```bash
cd the-human-story/episode-02-ww1
npm ci --no-audit --no-fund

# Kokoro TTS: pinned versions (these reproduce narration md5 b0ff08dc… exactly)
pip install kokoro-onnx==0.6.1 onnxruntime==1.29.0 numpy==2.5.3 soundfile==0.14.0 scipy==1.18.1
mkdir -p /opt/tts && cd /opt/tts
B=https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main
curl -sSLo model.onnx $B/onnx/model.onnx && curl -sSLo bm_george.bin $B/voices/bm_george.bin
python3 -c "import numpy as np; np.savez('voices.npz', bm_george=np.fromfile('bm_george.bin', dtype=np.float32).reshape(-1,1,256))" && mv voices.npz voices.bin
cd -

# rebuild audio (run unchanged, in this order; tts.py takes about 10 min)
python3 scripts/tts.py && python3 scripts/sfx.py && python3 scripts/music.py && python3 scripts/mix.py
git checkout -- ../../production/audio/ep02-ww1/episode-02-mix-reference-listen.mp3   # mix.py rewrites it
```
**Expect:** `public/audio/mix.wav` = 720.000 s, 48 kHz stereo, **−14.1 LUFS, −1.5 dBTP, LRA 2.0**.
(The audio-engineer agent can do all of this. Delegate it as "rebuild render audio per handoff 13".)

### Step 1 — Smoke test (Lean mode #15: one only)
```bash
TEST=3300-3599 bash scripts/render.sh
```
Covers the heaviest motion that editor A flagged (S03-02 crowd recoil). Check `output/test/` frames and
the ffprobe PASS lines. If fine, go straight to the full render.

### Step 2 — Full render
```bash
bash scripts/render.sh
```
- 24 chunks × 900 frames → concat → mux `mix.wav` → ffprobe → blackdetect/freezedetect → preview frames every 30 s.
- Run it as a **tracked background task** (`run_in_background`, 2 h), **not** with nohup. If a slot ends, run the
  same command again: finished chunks are skipped.
- Map-heavy shots render more slowly (S03-08 has two mini-maps).
- Output: `output/episode-02-ww1.mp4`; reports in `production/video/ep02-ww1/` (`ffprobe-report.txt`, `qc-detect.log`, `previews/`).
- Don't ask for progress mid-render (Lean #18); the log shows it.

### Step 3 — Final QC (quality-control agent, sonnet)
Hand it the MP4, ffprobe report, previews and **all open issues in §4**. Pass bar = CLAUDE.md "Quality bar":
exact 720.000 s, 1920×1080, 30 fps, H.264 + AAC, narration in sync, captions synced, every scene moving,
no blank frames or silence, channel logo on every shot, dates and spelling checked.

### Step 4 — Fix anything blocking, re-render only the affected chunk(s)
Delete just the bad `output/chunks/cNN.mp4` file(s) and re-run `render.sh`; only those chunks re-render.

### Step 5 — Publishing pack + thumbnail (youtube-specialist, sonnet; animator for the thumbnail)
Keywords, title options, description, chapters (from the 10 chapter banners), tags, SRT copy, checklist,
all in `production/exports/ep02-ww1/youtube/`. Lean mode: do the keyword work here, once.

### Step 6 — Your approval (checkpoint 4)
Watch and listen to the final MP4, pick the title and thumbnail, then approve. **Nothing is ever uploaded
automatically.** You publish manually.

### Step 7 — Clean-up
Delete `src/scenes/preview-a/`, `src/scenes/__preview_b__/` and the `a-*` / `b-*` stills in
`production/video/ep02-ww1/previews/` once the full render passes.

---

## 4. Open issues to carry into final QC

None of these block the render. They're the "snag list" for the final walkthrough.

| # | Severity | Where | Issue | Suggested fix |
|---|---|---|---|---|
| 1 | Check | whole episode | **Motion not yet seen**: stills only. Transitions, timed movement and sync are unverified. | Smoke test, then QC on the full render |
| 2 | Minor | S11-07 | Versailles map loss labels are 22–26 px, below the 36 px phone-readability rule | Library change in ep01 `MapVersailles` (environment designer) |
| 3 | Minor | S06-02 | ANZACS term card partly covers the map label "GALLIPOLI PENINSULA" for about 5 s | Nudge the card or the label |
| 4 | Minor | S11-03 | "BORDERS APPROXIMATE" note sits next to the TURKEY label | Move the note |
| 5 | Minor | S10-01 | FRANCE label on the wide map reaches into the caption band | Shift the label up |
| 6 | Listen | mix | Music within 3–5 dB of narration at 12.9, 17.9, 18.0, 113.3, 159.5, 532.0 s | −3 dB music at those spots if audible |
| 7 | Listen | narration | Rebuilt narration md5 `b0ff08dc…` ≠ approved `b418917f…` (library build difference). Same timings, same −14.1 LUFS, null-test residual −38.6 dB | Confirm by ear at final QC; now pinned and reproducible |
| 8 | Minor | library | `FlipCalendar` shows the previous date for a whole-number index (worked around in S03) | Note in map-notes / fix in library later |

### Deviations from the storyboard (deliberate, recorded in handoffs 12-a / 12-b)
- Cuts land on gaps between sentences, not on the storyboard's rounded times (v3 narration moved beats by up to 0.7 s).
- S03-06 holds about 0.4 s longer so the BRITAIN AT WAR newspaper can be read.
- "A DEBATE" is a fact pill (top right) with book covers FISCHER 1961 / CLARK 2012.
- S04-01 French and German station panels slide in on a split screen; the S04-06 pan goes centre → left → right.
- S05-02 rats run on the firestep and parapet (the trench floor is flooded); the executions card stays up to 320 s and fades out as s06 fades in.
- The ZIMMERMANN TELEGRAM label starts at 514.4 s (not 511.4 s) so it doesn't cover faces; the S10-04 ticker sits at the top centre.
- The end card starts at 714.2 s (the last word ends at 713.995 s). Its "WATCH NEXT" frame uses our own ep01 thumbnail (`public/endcard/ep01-thumb.jpg`).
- The Versailles terms list has no heading (the storyboard gives none). No capes on the Australians (not in the library).

### Ethics checks already applied (for QC to confirm on motion)
Sarajevo: no gun shown; pigeons scatter, then an empty seat with the hat. Gas: a high, wide view, then masks
going on. Shell shock: trembling, and a comrade with a blanket. Executions: empty posts and a card only.
Remembrance shots: slow cameras, mist, poppies; nobody is hit and nobody cheers. Revolutionary flags are
plain red. Name tags: **GENERAL FERDINAND FOCH / Allied commander, 1918**; headstones
**J. PARR · 21 AUGUST 1914** and **G. E. ELLISON · 11 NOVEMBER 1918**. The 11:00 watch click lands at 609.48 s.

---

## 5. Key facts for whoever picks this up

- **Spec:** 1920×1080, 30 fps, H.264 yuv420p + AAC 192k, **720.000 s** (Episode 2 is 12 min, set at brief stage).
- **Composition ID:** `Episode` (`src/Root.tsx`); timeline table in `src/scenes/Episode.tsx` (`SECTIONS_EP`).
- **Chapters (banner titles):** 1 Europe Before 1914 (0:35) · 2 Sarajevo and the July Crisis (1:50) ·
  3 1914: The War of Movement Stops (3:10) · 4 Life in the Trenches (4:20) · 5 A World War (5:20) ·
  6 1916: Verdun and the Somme (6:30) · 7 The Home Front (7:30) · 8 1917: The Turning Year (8:20) ·
  9 1918: The Last Battles (9:20) · 10 The Cost and the Legacy (10:20). The cold open is 0:00–0:35.
- **Dashboard:** `production/reports/dashboard.md`. Update it only via `python3 production/tools/status.py`.
- **Approvals:** script ✅ · style ✅ · storyboard ✅ · final render ⏳ (not yet requested).
- **Git-ignored (must be regenerated per container):** `node_modules/`, `public/audio/`, `public/sfx/`, `output/`.
- **Custom agents** sometimes don't load at session start. Fallback: `general-purpose` with
  "Read `.claude/agents/<name>.md` and follow it as your role".
- **Model policy:** main model for render debugging; sonnet for QC and the publishing pack; haiku for ffprobe/SRT checks.

---

## 6. Commit trail for this session (branch `claude/trusting-ritchie-6pgxw7`)
- Merged the previous branch `claude/director-ep02-continue-kr8iof` (assembly half done when the old container ended)
- `ab3998b` assembly relaunched (A: S03–S05, B: S09–S11)
- Audio rebuild 2 complete (versions pinned)
- Editor B complete: S09–S11 (21 shots), handoff 12-b
- Editor A complete: S03–S05, handoff 12-a; assembly COMPLETED; this handover
