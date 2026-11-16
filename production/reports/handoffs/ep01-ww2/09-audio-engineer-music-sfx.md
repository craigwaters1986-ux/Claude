# Handoff — ep01-ww2 — music-sfx

- **From:** audio-engineer
- **To:** director (cc: video-editor, environment-designer, quality-control)
- **Date:** 2026-11-15
- **Status:** AWAITING REVIEW

## Deliverables
- `the-human-story/episode-01-ww2/scripts/audio_lib.py`: DSP and instrument library. Band-limited oscillators, strings, cello/violin/horn/clarinet/flute lines, brass, piano, pizzicato, timpani, drums, bells, reverb, BS.1770 meter, true-peak limiter, compressor.
- `scripts/music.py`: the original score, cued to `narration.json`. It also contains the ducking curve.
- `scripts/sfx.py`: 159 synthesised SFX cues, the cue list and the SFX stem.
- `scripts/mix.py`: reference mix and master.
- `public/audio/music.wav`: 605 s, ducked under the narration.
- `public/audio/sfx.wav`: the whole SFX stem, pre-placed.
- `public/audio/mix.wav`: the final master (narration + music + SFX).
- `public/sfx/NNN-<shot>-<name>.wav`: 159 individual cue files. Pan and fades are baked in; each file peaks at −1 dBFS.
- `src/timeline/sfx-cues.json`: the cue list (`time`, `frame`, `file`, `duration`, `gainDb`, `volume`, `pan`, `shot`, `name`) and `silenceWindows`.
- `production/audio/ep01-ww2/episode-01-mix-reference.wav`, `episode-01-music.wav` (un-ducked), `episode-01-sfx.wav`.
- `measurements.md` (new section appended) and `licences.md` (music, SFX and mix recorded as original).

## Summary
The whole score is synthesised in D minor. The channel motif (A–D–E–F / E–D–C–D) is stated in the title sting, becomes Churchill's resolute theme, and returns in D major at the close. Music follows the user's brief and the storyboard per beat:

| Time | Music |
|---|---|
| 0–30 | Warm D-major piano and strings. Dark Bb at 7.0 s, low drone, heartbeat pulse, near-silence at 19.0–19.7, a suspended fifth, then the title sting at **22.90 s** (timpani roll, brass, horn motif). |
| 30–150 | Minor strings with cello and violin lines; pizzicato for 1929; a single low note and pulse for the shadow; low brass pulses; a tritone sting at the Chancellorship; marching drum; a sour waltz for Munich. Music stops on "It didn't work." |
| 150–330 | Ostinatos, a driving invasion cue, and a sad noble horn theme at the station. A C-minor woodwind colour for Asia (diatonic, with no stereotyped motifs). Hopeful Dunkirk, the resolute and heroic themes, a sombre Blitz. The scored tail at 261–270 resolves at 269.5. Grim Barbarossa, then **music out at Pearl Harbor (311.45–313.0)** followed by a single cello note, and the spreading global chord. |
| 330–450 | Hopeful flute, tense Midway, a build for El Alamein, Stalingrad in minor. An industry ostinato builds through the 380.8–390 tail to a suspended chord. D-Day pulse, armada swell, resistance pizzicato, a brief joy for Paris, and a dark 442.5–450 tail. |
| 450–570 | **Solo cello only from 455.75 s**. Then a single sustained note through the Holocaust passage, with silences at 467.95–468.45 and 486.75–487.45. Grim percussion for Berlin, a bunker drone, a VE-Day lift at 500.6, then unease. In s10, **everything cuts at 533.08** (1.5 s of total silence), then a low tone. Urgent percussion for Manchuria, **silence at 549.50–550.50**, wind and radio, a solemn resolution, sparse piano for the debate. |
| 570–605 | Reflective piano, the warm D-major theme, a final chord at 598.3 that rings out and is **silent by 604.8**. |

SFX: 159 cues across about 60 sound types, all subtle (−26 to −40 dB relative to the narration). There are no explosion sounds at Hiroshima or Nagasaki, only wind and candle in the Holocaust passage, nothing comic, and no SFX after 21.6 s in s01, so the last hook line and the sting are clear.

Mix (one final pass, by request): **−14.0 LUFS integrated, −1.5 dBTP true peak, LRA 1.8 LU, no silence ≥ 2 s at −50 dB.** Music sits 12.0 dB under the narration over the speech blocks (median momentary difference 13.0 dB).

## How the video-editor should wire the audio
1. **Preferred:** use a single `<Audio src={staticFile('audio/mix.wav')} />` at frame 0 of the 605 s / 18,150-frame composition, and nothing else. This is the measured master. Remotion cannot apply the +7.7 dB master gain or the true-peak limiter, so wiring the stems separately will not reproduce −14 LUFS / −1.5 dBTP.
2. **For editing or previews only:** `audio/narration.wav` at volume 1, `audio/music.wav` at volume 1, and either `audio/sfx.wav` at volume 1 or each cue from `sfx-cues.json` at `<Sequence from={frame}>` with `<Audio src={staticFile(file)} volume={volume}>`. That gives the right balance but lands about 7.7 dB quieter than the master. If you render this way, finish with `ffmpeg loudnorm` (I=−14, TP=−1.5) and re-measure.
3. **Picture sync points**, from `sfx-cues.json` `silenceWindows`:
   - Hiroshima ScreenFlash at **533.08 s (frame 15992)**. This is the end of s10.b3, a little later than the storyboard's estimate of 532.6.
   - Nagasaki glow at **549.50 s (frame 16485)**. This is an estimate for "devastated Nagasaki"; I did not detect the word onset. If the scene puts the glow elsewhere, tell me and I'll move `NAGA_GLOW` in `music.py` and rebuild.
   - Title card from 22.8 s, with the sting at 22.90 s.
   - The VE-Day surrender stamp should land at 500.6 s, where the music lifts.
   - The final chord falls at 598.3 s, inside the end card.

## Changes to inputs / assumptions
- Narration is unchanged. **AU-02** (a longer Nagasaki pause) was not done, because Director decision 08 keeps the narration timings fixed.
- The storyboard's "muffled shouts" in S08-05 ("Thousands were killed or wounded…") were left out on purpose, for restraint. That shot has surf, restrained distant gunfire, and then crickets.
- Large intermediates (`output/music-stems/`, `*.npy`) are git-ignored and are not deliverables. `output/mix-stats.json` is a small by-product.

## Blockers / issues
- [minor] In a few 400 ms blocks, music swells meet short words. Narration minus music drops to −7 dB at 66.6, 173.3, 175.8, 194.7, 197.5, 278.8, 285.4 and 590.5 s. QC should listen at those points. The fix is a local −3 to −4 dB in `music.py`, or `duck_curve(depth_db=-12)`. This was not tuned further, at the Director's request.
- [minor] `public/sfx/` is about 124 MB (159 stereo 16-bit files). If the render uses `mix.wav`, those files are only needed for re-editing.
- Music and SFX quality was checked by measurement only, not by listening. A human listen is needed at checkpoint 4.

## Recommended next action
- video-editor: wire `audio/mix.wav` as above, and put the Hiroshima and Nagasaki flash frames on 15992 and 16485.
- quality-control: listen to the flagged times, the silence windows and the tails (22.8–30, 261–270, 380.8–390, 442.5–450).
- To rebuild: `python3 scripts/music.py && python3 scripts/sfx.py && python3 scripts/mix.py` (about 4 minutes).
