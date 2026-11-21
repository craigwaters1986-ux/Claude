# Handoff — ep01-ww2 — start here in the next session (assembly + render)

- **From:** director · **To:** director (next session), video-editor, quality-control · **Date:** 2026-11-15

## Where we are
Approvals: style ✅, script v3 ✅, storyboard ✅ (decisions: `08-director-storyboard-decisions.md` —
no mushroom cloud, keep Balkenkreuz, runtime **605 s = 18,150 frames**). Final render approval is next.
All asset tasks are COMPLETED; music/SFX is AWAITING REVIEW (user to listen to
`production/audio/ep01-ww2/episode-01-mix-reference-listen.mp3`). Lean mode + model policy apply (CLAUDE.md).

## Next task: `assembly` → `final-render` (owner: video-editor, main model)
Inputs for the video-editor:
- Storyboard: `production/storyboards/ep01-ww2/storyboard.md` (99 shots, beats `sNN.bK`) + T-01..T-06 requests in `asset-requests.md`
  (T-01: DateCard collides with ChapterBanner, overflows on long titles, sub-line 27 px < 36 px guideline;
  T-03: Preview.tsx shows a title before 22.8 s — the opening must follow the storyboard).
- Narration timings: `the-human-story/episode-01-ww2/src/timeline/narration.json` (v3, 98 sentences).
- Audio: use **one track only** — `public/audio/mix.wav` at frame 0 (605 s, −14 LUFS, −1.5 dBTP). Hiroshima flash at
  frame 15992; Nagasaki glow ~16485 (estimate — tell audio-engineer if the scene differs). Details: `09-audio-engineer-music-sfx.md`.
- Characters API: `09-animator-characters.md`. Environments/maps API (one component per map shot, with cue frames):
  `09-environment-designer.md`. Known gaps: Weimar flag (black-red-gold) not built — needed in S02-06; FX-02 atomic flash
  pending — use ScreenFlash with a long fade.
- Engine: `the-human-story/episode-01-ww2/` (Remotion 4). `npm install` once in a fresh container. Kokoro TTS is NOT needed
  for assembly (narration already rendered into mix.wav). Note: `public/audio/*.wav` and `public/sfx/` are git-ignored —
  in a fresh container regenerate them first: `python3 scripts/tts.py` needs Kokoro (see voice-bible.md); then
  `python3 scripts/music.py && python3 scripts/sfx.py && python3 scripts/mix.py` (~4 min).

## Render plan (performance lessons)
- Render video in chunks per section, `--muted`, concurrency 4; mux `mix.wav` with ffmpeg; verify with ffprobe
  (605.0 s, 1920×1080, 30 fps, H.264 + AAC), blackdetect/freezedetect, preview frames every ~30 s.
- Heavy items: high-detail map borders (fixed: 110m borders), crowds (~1.5 s/frame at 210 figures — use only what a shot
  needs), heavy maps ~5.6 s/frame/tab. Expect a multi-hour render; run it in the background.

## Then
`final-qc` (quality-control, sonnet, one pass; listen at the 8 masking timestamps and the 4 respelled words) →
`publishing-pack` (youtube-specialist, sonnet; chapters from the final edit, s01 chapter "Summer 1939",
mark hook-review.md superseded) → ask the user for approval 4. Never upload or publish.
