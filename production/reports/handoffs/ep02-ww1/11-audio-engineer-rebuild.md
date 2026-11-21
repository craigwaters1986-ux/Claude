# Handoff — ep02-ww1 — 11 audio rebuild (fresh container)

- **From:** audio-engineer
- **To:** director (cc: video-editor)
- **Date:** 2026-11-17
- **Status:** COMPLETED (with one note: narration md5 differs)

## Deliverables
- `the-human-story/episode-02-ww1/public/audio/narration.wav` (+ copies in `assets/audio/`, `output/`, `production/audio/ep02-ww1/episode-02-narration.wav`) — 720.000 s, 48 kHz mono s16
- `public/sfx/*` (222 files), `public/audio/sfx.wav`, `public/audio/music.wav`
- `public/audio/mix.wav` — RENDER MASTER, 720.000 s, 48 kHz stereo 16-bit, -14.1 LUFS, LRA 2.0, true peak -1.5 dBTP (same as v3)
- Stems and reference mix in `production/audio/ep02-ww1/`; results appended to `measurements.md`

## Summary
Rebuilt tts.py, sfx.py, music.py and mix.py unchanged. Kokoro set up per the voice bible (kokoro-onnx 0.6.1, onnxruntime 1.29.0). Narration md5 is `b0ff08dc...`, not the expected `b418917f...`. Duration, format, narration.json, SRT and every mix statistic still match v3.

## Changes to inputs / assumptions
- None to scripts, text, narration.json, SRT or sfx-cues.json (git clean). Listen MP3 restored with git checkout.

## Blockers / issues
- [low] md5 differs; probable cause is a different onnxruntime/numpy build (original pins not recorded), giving sample-level float differences. Timings are identical because the anchors and narration.json are unchanged. Not a different read, but if bit-exactness matters, the original library versions are needed.

## Requests for other agents
- none

## Recommended next action
- Video editor can use `public/audio/mix.wav` as the single audio track. Commit nothing from the WAVs (git-ignored).
