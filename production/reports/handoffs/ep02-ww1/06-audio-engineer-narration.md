# Handoff — ep02-ww1 — narration

- **From:** audio-engineer
- **To:** director (cc: storyboard, animator, environment-designer, video-editor, quality-control)
- **Date:** 2026-11-16
- **Status:** COMPLETED

## Deliverables
- `production/audio/ep02-ww1/episode-02-narration.wav` — full narration, 48 kHz mono PCM16, 720.000 s (gitignored, as in ep01)
- `production/audio/ep02-ww1/narration.json` — per-section/sentence/caption timings, with `speed`, `fitAt1`, `budget` per section
- `production/audio/ep02-ww1/episode-02-subtitles.srt` — 162 cues, at most 2 × 42 chars
- `production/audio/ep02-ww1/measurements.md` — duration, loudness, peaks, silence, per-section fit, SRT checks, pronunciation
- `production/audio/ep02-ww1/licences.md` — narration licence (Kokoro-82M Apache-2.0), quotations
- Engine copies: `the-human-story/episode-02-ww1/output/episode-02-narration.wav`, `output/episode-02-subtitles.srt`, `public/audio/narration.wav`, `assets/audio/episode-02-narration.wav`, `src/timeline/narration.json` (all identical, md5 61fdc97e…)

## Summary
Kokoro-82M was set up in /opt/tts exactly as the voice bible says, with voice `bm_george`, en-gb. The whole approved script v2 (107 sentences, 1,519 words) was synthesised with the ep01 builder. Every section fits its window. Only s01 (1.034×) and s10 (1.036×) needed any speed-up. Nothing came near the 1.12× trim threshold, so no cuts are needed. Narration stem: −19.5 LUFS integrated, −1.4 dBTP true peak, LRA 1.5 LU. There is no silence inside any section.

## Changes to inputs / assumptions
- `the-human-story/episode-02-ww1/research/script.json` was still the ep01 script. It has been replaced with an unchanged copy of `production/scripts/ep02-ww1/script.json`.
- `scripts/tts.py` (ep02 copy): episode length is now read from script.json `duration` (720), and output names use `EPISODE_TAG` (default "02"). It also logs and stores `fitAt1`, `pauseScale` and `budget` per section. Synthesis logic is unchanged from ep01.
- RESPELL: added Gavrilo Princip, Passchendaele, Foch and Compiègne as safety nets. Two `say` respellings are corrected at synthesis time ("Kom-pyen" → "Komp-yen", "Eep-ruh" → "Ypres") because espeak phonemised them badly. The approved script was not edited.
- `src/timeline/narration.json` in the engine now holds ep02 timings and replaces the leftover ep01 file. Scene timing should key off it.

## Blockers / issues
- [minor] s05 (0.02 s spare) and s10 (0.00 s spare) end right on their budgets. Any later script addition there would need a trim or a higher speed (headroom to 1.17×).
- [minor] Long between-section gaps of 8.5 s (s01→s02, title) and 10.5 s (s02→s03; s02 has 8.2 s spare) must be carried by music and visuals. The other option is to retime s03 earlier, which is a storyboard decision.
- [info] Galli-poli is spoken /ˈɡalɪˈpəʊli/ (anglicised, not the usual British /ɡəˈlɪpəli/). It is acceptable, and QC may want to listen at about 333 s.

## Requests for other agents
- storyboard / animator / environment-designer: time scenes from `src/timeline/narration.json`, not from the script windows.
- quality-control: listening spot-checks for names: Sarajevo (s01/s03), Princip (s03), Ypres (s05), Gallipoli (s06), Passchendaele (s09), Foch and Compiègne (s10), Versailles (s11).

## Recommended next action
- Music and SFX build for ep02 (sombre around s06 Armenian Genocide, s07 Somme, s11), then the reference mix to −14 LUFS / ≤ −1 dBTP.
