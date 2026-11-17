# Audio engineer memory — lessons learned

- tts.py sample-peak normalisation of 0.89 (-1.01 dBFS) gave -0.98 dBTP true peak (fails <= -1).
  Now 0.85 (-1.41 dBFS) -> -1.38 dBTP. Always measure TRUE peak (loudnorm print_format=json
  input_tp, 2 decimals), not just volumedetect max_volume.
- The old caption chunker (84-char chunks) produced SRT lines up to 49 chars. It now uses a
  balanced DP split that guarantees <= 2 lines x 42 chars. Re-check max line length after any change.
- A full ep01 rebuild with a warm cache takes about 1.5 min (Kokoro CPU). Changing only the
  normalisation or captions leaves the sentence cache valid.
- The narration stem sits at about -19.7 LUFS integrated (LRA 1.6). Reach the -14 LUFS programme
  target in the final mix (music + gain/limiter), not in the narration stem.
- silencedetect noise=-50dB d=3: on ep01 v3 the only gaps over 3 s were between sections (music beds).
  Use d=1.5 too, to see section lead-ins/tails.
- Check git HEAD before assuming the engine script copy is stale (it was already v3 on 2026-11-15).
- Importing tts.py for speakable() checks creates scripts/__pycache__: delete it afterwards.
- Music/SFX/mix pipeline (2026-11-15): scripts/music.py (about 2.5 min) -> sfx.py (about 40 s) -> mix.py (about 45 s).
  ep01: 12.0 dB music under speech at duck -9 dB; master +7.7 dB, limiter -1.5 dBTP -> -14.0 LUFS / -1.5 dBTP.
  For more speech headroom, use duck -12 dB.
- Remotion can't pan, limit or apply gain >1. Hand the editor public/audio/mix.wav as the single audio track,
  and bake pan/fades into the SFX files.
- Gotchas: python hash() of a str is randomised per run (don't use it for seeds). Keep sample counts
  consistent with int(round(dur*SR)) everywhere, or the arrays mismatch by 1.
- The Director asked to save tokens: one measurement pass, no re-tuning loops, unless asked.
- ep02 (2026-11-17): WAVs are git-ignored, so a fresh container has no narration. Re-run tts.py (Kokoro setup per
  voice bible; about 5 min for 720 s). It is bit-identical (md5 matched) and leaves narration.json and the SRT unchanged.
- ep02 pipeline: music.py about 4 min, sfx.py about 50 s, mix.py about 1.5 min. Duck -12 dB gave music 16.7 dB under speech
  (median momentary 18 dB, p05 9.8). Master +7.8 dB -> -14.0 LUFS / -1.5 dBTP.
- music.py now has EXCLUSIVE windows (per-stem masks after reverb) for "single instrument, no percussion" shots.
  Verify them by checking per-stem peaks in output/music-stems.
- Check each special element's loudness against its surroundings (the hum was first 3.5 LU louder than the score; -6 dB fixed it).
- Wait for long background builds with `timeout N bash -c 'until grep -q X log; do sleep 5; done'` (a plain sleep is blocked).
