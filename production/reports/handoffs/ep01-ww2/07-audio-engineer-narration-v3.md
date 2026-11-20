# Handoff — ep01-ww2 — narration

- **From:** audio-engineer
- **To:** director (cc: video-editor, quality-control, animator)
- **Date:** 2026-11-15
- **Status:** AWAITING REVIEW

## Deliverables
- `production/audio/ep01-ww2/episode-01-narration.wav`: full narration, 600.000 s, 48 kHz mono PCM16 (md5 6db778fa…)
- `production/audio/ep01-ww2/episode-01-subtitles.srt`: 140 cues, ≤ 2 lines × 42 chars
- `production/audio/ep01-ww2/narration.json`: sentence and caption timings (drives animation)
- `production/audio/ep01-ww2/measurements.md`: all measurements and the per-section fit table
- `production/audio/ep01-ww2/licences.md`: Kokoro-82M Apache-2.0, voice bm_george; music and SFX original (not yet built)
- Engine copies used by the render: `the-human-story/episode-01-ww2/public/audio/narration.wav`, `assets/audio/episode-01-narration.wav`, `output/episode-01-narration.wav`, `output/episode-01-subtitles.srt`, `src/timeline/narration.json`

## Summary
I rebuilt the narration from the approved script v3 with Kokoro bm_george (en-gb). All 11 sections fit (OK, pauses ×1.00). Speeds range from 1.000 to 1.154× (s03), and the timings match the scriptwriter's fit: s01 ends at 22.77 s, s11 at 597.96 s. The stem measures −19.6 LUFS integrated with a −1.38 dBTP true peak. The only silences over 3 s fall between sections. Pronunciation checked: the four respellings are applied and years are spoken as words. No fixes were needed.

## Changes to inputs / assumptions
- I copied the engine `research/script.json` from production and confirmed it identical with diff. It was already v3 in git HEAD (c2b9e1e), so the brief's "still v1" was stale and the copy changed nothing.
- `scripts/tts.py`, fix 1: the peak normalisation target went from 0.89 to 0.85. The first build measured −0.98 dBTP, which fails ≤ −1 dBTP. The new build measures −1.38 dBTP. Loudness dropped 0.4 dB and timing is unchanged.
- `scripts/tts.py`, fix 2: `caption_chunks` was rewritten as a balanced split that guarantees ≤ 2 lines × 42 chars. The old 84-char chunks produced 27 lines over 42 (max 49). The cue count went from 122 to 140. The `narration.json` schema (`captions: [{text,start,end}]`) is unchanged, and sentence timings are unchanged.
- No script text, `say` field or RESPELL entry was changed.

## Blockers / issues
- [minor] The stem is at −19.6 LUFS. The −14 LUFS programme target has to be reached in the final mix (music + gain/limiter), not here.
- [minor] s03 runs at 1.154×, close to the 1.17× cap. Any word added to s03 later would need a cut elsewhere in it.
- [info] The voice is synthetic. YouTube's synthetic content disclosure should be considered (youtube-specialist).

## Requests for other agents
- video-editor / animator: re-read `src/timeline/narration.json`. Caption chunks changed (140 cues); sentence timings did not.
- quality-control: listen-through of the respelled words (Vair-sigh, Luft-vaffa, Soo-dayten-land, El Ala-mayn) and of s03 pacing.

## Recommended next action
- Director: launch the audio-engineer music and mix task: a procedural score following the storyboard moods, ducked under narration, final mix at −14 LUFS and ≤ −1 dBTP.
