# Handoff — ep02-ww1 — 13 audio rebuild 2 (fresh container)

- **From:** audio-engineer
- **To:** director (cc: video-editor)
- **Date:** 2026-11-18
- **Status:** COMPLETED

## Deliverables
- `the-human-story/episode-02-ww1/public/audio/narration.wav` (+ the copies tts.py writes) — 720.000 s, 48 kHz mono s16, md5 `b0ff08dc7c6fa39d7981b467a08c5df1`
- `public/sfx/*` (222 files), `public/audio/sfx.wav`, `public/audio/music.wav`
- `public/audio/mix.wav` — RENDER MASTER, 720.000 s, 48 kHz stereo 16-bit, -14.1 LUFS, LRA 2.0, true peak -1.5 dBTP
- Results and exact pip versions appended to `production/audio/ep02-ww1/measurements.md`

## Summary
tts.py, sfx.py, music.py, mix.py rebuilt unchanged. Pins: kokoro-onnx 0.6.1, onnxruntime 1.29.0, numpy 2.5.3, soundfile 0.14.0 (scipy 1.18.1). Narration md5 equals rebuild 1 (b0ff08dc...), so that output is reproducible; it differs from the approved b418917f.... Every mix statistic matches v3.

## Changes to inputs / assumptions
- None. `episode-02-mix-reference-listen.mp3` restored with git checkout after mix.py rewrote it. `src/` untouched by me (git shows other agents' edits there).

## Blockers / issues
- [low] md5 is still not b418917f...; original library builds are unknown. Perceptually equivalent, timings identical.

## Requests for other agents
- none

## Recommended next action
- Render with `public/audio/mix.wav`. Do not commit the WAVs (git-ignored).
