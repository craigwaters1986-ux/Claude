# HANDOVER v2 — Episode 2 "World War I: From Start to Finish" (ep02-ww1)

Written 2026-11-18 for **any AI assistant or person** (ChatGPT, Gemini, etc.) to finish the job.
It is self-contained: you do not need Claude, the `.claude/agents` team or anything else.
The older `HANDOVER-ep02-ww1.md` in the same folder is still accurate but this file supersedes it.

> **Where we are in one line:** the whole 12-minute animated episode is built in code, type-checks, and a
> 10-second smoke render passed. **The full video has not been rendered yet.** What remains is: rebuild the audio
> on a new machine → full render → check it → write the YouTube pack → the user approves → the user uploads.

---

## 1. The project

- **Channel:** THE HUMAN STORY — "History is made by people." Animated 2D stick-figure history documentaries (YouTube).
- **This episode:** "World War I: From Start to Finish", **12:00 exactly (720.000 s = 21,600 frames at 30 fps)**.
- **Repo:** https://github.com/craigwaters1986-ux/Claude — **work is on branch `claude/trusting-ritchie-6pgxw7`** (not `main`).
- **Engine folder:** `the-human-story/episode-02-ww1/` (Remotion 4.0.543 + React + SVG; TypeScript).
- **The user publishes manually. Never upload or publish anything.** The user must approve the final render.

```bash
git clone https://github.com/craigwaters1986-ux/Claude.git && cd Claude
git checkout claude/trusting-ritchie-6pgxw7
```

## 2. What is DONE (all committed to the branch)

| Item | Status |
|---|---|
| Research (132 facts), script, style, storyboard (70 shots) | ✅ all approved by the user |
| Narration v3 (British male voice "bm_george", Kokoro TTS) + SRT subtitles | ✅ approved by the user |
| Music + SFX + final mix (-14.1 LUFS) | ✅ approved by the user |
| Characters, environments, maps, vehicles | ✅ |
| All 11 scenes `src/scenes/S01…S11.tsx`, `Episode.tsx` timeline, `scripts/render.sh` | ✅ built; `npx tsc --noEmit -p .` = 0 errors |
| Label snags fixed today (stills verified): ANZACS card (S06), FRANCE/GERMANY labels (S10), TURKEY / "BORDERS APPROXIMATE" (S11-03), Versailles labels enlarged to 36/32 px and list panel moved top-right (S11-07) | ✅ |
| 10-second smoke render (frames 3300–3599) | ✅ ALL PASS: 1920×1080, 30 fps, H.264 yuv420p, AAC, 0 black / 0 frozen segments |

## 3. What is NOT done

1. **Full render of the video** (never run). Needs a machine with the tools in §4. About 2 h on 4 CPU cores.
2. **Rebuild of the audio** on the new machine (audio files are not stored in git — see §5).
3. **Final QC** of the rendered MP4 (§7). Motion has never been viewed; only still frames were checked.
4. **YouTube publishing pack** + thumbnail (§8).
5. **User approval** of the final render, then the user uploads manually.

## 4. Requirements (new machine)

- Linux or macOS, **Node 18+** (22 used), **ffmpeg 6+ with libx264**, **Python 3.10+**, 4+ CPU cores, ~10 GB free disk.
- **A headless Chromium** for Remotion. `remotion.config.ts` points at `/opt/pw-browsers/chromium_headless_shell-1243/...`.
  On another machine either let Remotion download its own browser (delete the `setBrowserExecutable` lines in
  `remotion.config.ts`) or set `REMOTION_BROWSER=/path/to/chrome-headless-shell`. Rendering uses `swangle` (software GL),
  so no GPU is needed.
- Python packages: `numpy scipy soundfile kokoro-onnx==0.6.1 onnxruntime==1.29.0` (see §5 for pins).

## 5. Step 0 — set up and rebuild the audio (~15 min; the TTS step alone takes ~10 min)

```bash
cd the-human-story/episode-02-ww1
npm ci --no-audit --no-fund

pip install kokoro-onnx==0.6.1 onnxruntime==1.29.0 numpy==2.5.3 soundfile==0.14.0 scipy==1.18.1
mkdir -p /opt/tts && cd /opt/tts            # the scripts look for the model here; if you use another folder, change the path in scripts/tts.py
B=https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main
curl -sSLo model.onnx $B/onnx/model.onnx && curl -sSLo bm_george.bin $B/voices/bm_george.bin
python3 -c "import numpy as np; np.savez('voices.npz', bm_george=np.fromfile('bm_george.bin', dtype=np.float32).reshape(-1,1,256))" && mv voices.npz voices.bin
cd -

# run in this order, unchanged:
python3 scripts/tts.py && python3 scripts/sfx.py && python3 scripts/music.py && python3 scripts/mix.py
git checkout -- ../../production/audio/ep02-ww1/episode-02-mix-reference-listen.mp3   # mix.py overwrites this approved file
```

**Expected result:** `public/audio/mix.wav` — 720.000 s, 48 kHz stereo 16-bit, integrated **−14.1 LUFS**, true peak **−1.5 dBTP**, LRA 2.0.
Verify: `ffmpeg -i public/audio/mix.wav -af ebur128=peak=true -f null - 2>&1 | tail -12`.
Known harmless difference: the narration file's md5 will be `b0ff08dc…` rather than the originally approved `b418917f…`
(library-build difference). Timings, loudness and subtitles are identical. Check by ear at QC.
If the audio is wrong the render script stops with "mix.wav is missing" — it never produces a silent video.

## 6. Steps 1–2 — render

```bash
cd the-human-story/episode-02-ww1
TEST=3300-3599 bash scripts/render.sh     # optional 10 s smoke test, writes to output/test/ (already passed once)
bash scripts/render.sh                    # FULL render: 24 chunks x 900 frames -> concat -> mux mix.wav -> ffprobe -> black/freeze detect -> previews
```
- **Resumable:** finished chunks are kept in `output/chunks/cNN.mp4`. If it is interrupted, run the same command again.
  To redo one bad chunk, delete just that `cNN.mp4` and re-run.
- Run it somewhere that will not sleep/kill background jobs for ~2 h. Don't poll it; watch `production/video/ep02-ww1/render.log`.
- **Outputs:** `output/episode-02-ww1.mp4`; `production/video/ep02-ww1/ffprobe-report.txt` (must say `RESULT: ALL PASS`),
  `qc-detect.log`, and a preview JPG every 30 s in `production/video/ep02-ww1/previews/`.
- Chunk map: c00 = frames 0–899 … c23 = 20700–21599 (30 fps).
- Render cost is CPU time only; no AI/API credits are used by rendering.

## 7. Step 3 — final QC checklist (the quality bar)

- ffprobe: **720.000 s** (±0.05), 1920×1080, 30 fps, H.264 yuv420p, AAC audio present.
- Watch the whole video. Every shot must **move** (no slideshow stills); no blank/black frames; no unexplained silence.
- Narration in sync with picture and subtitles; music sits under narration (see spots below).
- **Channel logo visible top-left on every frame**; nothing else in the top-left zone (x < 170, y < 150).
- Text readable on a phone (≥ 36 px for facts); dates/spelling correct; **British English**.
- **Listen:** music is within 3–5 dB of the narration at 12.9, 17.9, 18.0, 113.3, 159.5, 532.0 s. If audible, lower music 3 dB there (in `scripts/mix.py`, then rebuild the mix and re-mux).
- **Confirm by ear** that narration is natural and matches the approved version (§5 md5 note).
- Sensitive scenes must stay sombre, non-graphic, no jokes: Sarajevo (no gun shown; pigeons scatter, empty seat with hat),
  gas (high wide view, then masks), shell shock (trembling soldier + blanket), executions (empty posts + card only),
  remembrance shots (slow camera, mist, poppies). Revolutionary flags plain red.
- Name tags that must read exactly: **GENERAL FERDINAND FOCH / Allied commander, 1918**; headstones **J. PARR · 21 AUGUST 1914** and **G. E. ELLISON · 11 NOVEMBER 1918**. The 11:00 watch clicks at 609.48 s.
- Known remaining minor items to eyeball: S11-07 Versailles map (labels now larger — check none clash); S06-02 ANZACS card vs map labels (card moved up 40 px); S10-01 map labels; S11-03 labels.
- Write the result in `production/reports/qc/ep02-ww1/qc-final-render-<date>.md`. Fix blocking issues in the `src/scenes/*.tsx` file for that shot, delete the affected chunk(s), re-render.

## 8. Step 4 — publishing pack (write into `production/exports/ep02-ww1/youtube/`)

Copy the structure of `production/exports/ep01-ww2/youtube/` (it is a finished example): `publishing-pack.md`, `title-options.md`,
`keywords.md`, `chapters.txt`, `thumbnail-brief.md`, `publishing-checklist.md` (template: `production/templates/publishing-checklist.md`).
Also copy `production/audio/ep02-ww1/episode-02-subtitles.srt` to `production/exports/ep02-ww1/`.

- **Title:** ≤ 70 characters, accurate. Ep 1 was "WW2 - From Start to Finish"; the planned Ep 2 title matches: **"WW1 - From Start to Finish"** (offer 3–5 options; the user picks).
- **Chapters (start at 00:00, verify against the final edit):**
  00:00 Cold open (Two shots, one wrong turn) · 00:35 Europe Before 1914 · 01:50 Sarajevo and the July Crisis ·
  03:10 1914: The War of Movement Stops · 04:20 Life in the Trenches · 05:20 A World War · 06:30 1916: Verdun and the Somme ·
  07:30 The Home Front · 08:20 1917: The Turning Year · 09:20 1918: The Last Battles · 10:20 The Cost and the Legacy
  (YouTube chapter 1 should be a reader-friendly name for the cold open, not "The Hook".)
- **Description:** hook line, 2–3 sentence summary, chapters, sources (from `production/research/ep02-ww1/sources.md`), credits/licences,
  content note (war, loss of life; handled non-graphically), AI-narration disclosure.
- **Credits line (from `production/audio/ep02-ww1/licences.md`):** "Music and sound design: original, The Human Story. 'Silent Night' melody by Franz Xaver Gruber (1818, public domain). Narration voice: Kokoro-82M (Apache-2.0)."
- **Disclosure:** the narration is a synthetic (AI) voice — consider YouTube's "altered or synthetic content" setting; the user decides.
- **Thumbnail:** 1280×720, < 2 MB, readable small, channel stick-figure style. A Remotion still exists: `npx remotion still src/index.ts Thumbnail out.jpg` (edit `src/scenes/Thumbnail.tsx`; it may still be the Ep 1 design — check, and redo for WW1 per the brief).
- Tags/keywords, category Education, language English (UK), SRT as English (UK) subtitles.

## 9. Step 5 — approval and publishing

Give the user the MP4 + QC report + pack. The user watches it, picks the title/thumbnail and approves. **They upload manually.**

## 10. Channel rules that must be kept (summary of `CLAUDE.md`)

- British English everywhere. Audience 16–55, intelligent, never childish.
- Style: simple expressive 2D stick figures (big round white heads, thick black outlines, thin limbs, flat muted colours). Never realistic/3D/anime.
- Genuine continuous movement; text readable on a phone; clear dates and names.
- **Accuracy:** never invent facts, figures or quotations; every claim traces to `production/research/ep02-ww1/research-notes.md`. Label estimates as estimates and debates as debates.
- Atrocities/civilian suffering: sombre, respectful, non-graphic. Fictional characters are never presented as real; historical figures carry name tags.
- Only original or properly licensed assets (all audio here is original or public domain).
- Spec: 1920×1080, 30 fps, H.264 + AAC MP4, synchronised SRT.

## 11. Key files map

| What | Where |
|---|---|
| Studio rules | `CLAUDE.md`, `production/WORKFLOW.md`, `production/LEAN-MODE.md` |
| Script / research / storyboard | `production/scripts/ep02-ww1/`, `production/research/ep02-ww1/`, `production/storyboards/ep02-ww1/storyboard.md` (text checklist in §3) |
| Narration timings | `the-human-story/episode-02-ww1/src/timeline/narration.json`, `sfx-cues.json` |
| Scenes | `the-human-story/episode-02-ww1/src/scenes/S01.tsx … S11.tsx`, `Episode.tsx` (section table `SECTIONS_EP`) |
| Maps / characters / components | `src/maps/`, `src/characters/`, `src/components/` |
| Audio scripts / pins / measurements | `scripts/tts.py sfx.py music.py mix.py`; `production/audio/ep02-ww1/measurements.md`, `licences.md` |
| Per-agent handoff notes (history) | `production/reports/handoffs/ep02-ww1/` (esp. `12-video-editor-assembly-a.md`, `-b.md`, `13-audio-engineer-rebuild-2.md`) |
| Dashboard | `production/reports/dashboard.md` (generated by `python3 production/tools/status.py`; optional if you are not using Claude) |
| Ep 1 finished example | `production/exports/ep01-ww2/youtube/`, `production/reports/qc/ep01-ww2/` |

**Git-ignored (recreate per machine):** `node_modules/`, `public/audio/`, `public/sfx/`, `output/`, render logs.
Commit your work to the branch (`git push -u origin claude/trusting-ritchie-6pgxw7`). Don't commit the WAVs/MP4.

## 12. Gotchas

- Do **not** change `Episode.tsx` timing or the narration/SRT — everything is frame-locked to `narration.json`.
- Remotion `still`/`render` use the composition id **`Episode`**.
- Always run `npx tsc --noEmit -p .` after any code edit.
- `Flag` y = top of the pole; `FlipCalendar` with a whole-number index shows the previous date (worked around in S03).
- Clean-up after the render passes: delete `src/scenes/preview-a/`, `src/scenes/__preview_b__/` and the `a-*`, `b-*` stills in `production/video/ep02-ww1/previews/`.
- If a step fails, the logs are in `production/video/ep02-ww1/render.log` and `output/test/`.

## 13. Suggested prompt to paste into the new assistant

> I'm handing you a nearly finished animated documentary project. Read `production/reports/handoffs/ep02-ww1/HANDOVER-v2-for-any-assistant.md`
> and `CLAUDE.md` in the repo https://github.com/craigwaters1986-ux/Claude (branch `claude/trusting-ritchie-6pgxw7`). Guide me step by step through
> §5 (audio rebuild), §6 (render), §7 (QC), §8 (publishing pack). Never upload anything; I publish manually. Ask me before changing any scene file.
