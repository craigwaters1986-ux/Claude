# Handoff — ep02-ww1 — music-sfx

- **From:** audio-engineer
- **To:** director (cc: video-editor, animator, environment-designer, quality-control)
- **Date:** 2026-11-17
- **Status:** AWAITING REVIEW

## Deliverables
- `the-human-story/episode-02-ww1/scripts/music.py`: the original ep02 score, cued to `narration.json` and the storyboard. It holds the key-moment constants (title sting, shots, dominoes, carol, whistles, 11 o'clock, bugle), the silence windows, the single-instrument windows and the −12 dB ducking curve.
- `scripts/sfx.py`: 222 synthesised SFX cues (about 124 sound types), the cue list and the SFX stem. About 40 new ep02 generators: pistol report, pigeon wings, 1914 car, stall and brakes, big-clock chime, steam train, pea whistles, mud, rats, gas-mask breathing and straps, Morse, typewriter, harness jingle, shipyard hammers, distant band, ship horn, oars, bugle, digging, owl, leaves, wood pigeon, dominoes, map-ink ticks, and more.
- `scripts/mix.py`: the reference mix and master, plus the MP3 listen copy.
- `scripts/audio_lib.py`: new `hum` and `bugle` timbres in `legato_line`.
- `src/timeline/sfx-cues.json`: **rewritten for ep02**. It holds 222 cues (`time`, `frame`, `file`, `duration`, `gainDb`, `volume`, `pan`, `shot`, `name`), plus `silenceWindows` and `syncPoints` (picture sync frames).
- `public/audio/mix.wav`: **the master for the render** (720.000 s, 48 kHz stereo 16-bit).
- `public/audio/music.wav` (ducked), `public/audio/sfx.wav` and `public/audio/narration.wav`: the stems.
- `public/sfx/NNN-<shot>-<name>.wav`: 222 individual cues, with pan and fades baked in.
- `production/audio/ep02-ww1/episode-02-mix-reference-listen.mp3`: small listen copy (96 kb/s, 8.3 MB, tracked).
- `production/audio/ep02-ww1/episode-02-mix-reference.wav`, `episode-02-music.wav` (un-ducked), `episode-02-sfx.wav` and `episode-02-narration.wav`: git-ignored.
- `production/audio/ep02-ww1/measurements.md` (new section appended) and `licences.md` (music, carol melody, bugle, band, SFX and mix recorded).

## Summary
The whole score is original and synthesised, in D minor with the channel motif. Each section follows the storyboard mood:
- s01: warm Sarajevo summer, then a darker Bb.
- s02: stately but uneasy. Snare roll and arms-race rhythm, a Balkan drone, the war-plan ostinato.
- s03: uneasy. Timpani for the ultimatum, a drum hit per declaration, an E pedal under the 11 chimes.
- s04: brisk march, urgency, Marne resolve, a grinding descent.
- s05: drone, almost nothing, one cello.
- s06: widening, dignified.
- s07: heavy Verdun brass, sinking.
- s08: light, busy home front.
- s09: suspense, America's swell, Passchendaele grind.
- s10: train, drum roll, Foch's motif, driving brass, thinning to silence.
- s11: sombre, solo piano, cello, a quiet resolve, the end-card motif.

All AU-02 special cues are in place:
- **Hummed "Silent Night"**: Gruber's public-domain melody in an original synthesised performance by three distant male hummers, 231.2–249.3. It breaks off at the officer's whistle (248.4), and a fragile solo violin finishes the tune by 259.7.
- **s02→s03 tail** (100.4–110.0): pizzicato on each domino, strings build, and it resolves on the Sarajevo glow at 108.0.
- **Title sting** at 27.95.
- **Exactly 1.0 s of total music + SFX silence** at 609.50–610.50, measured at digital zero on both stems.
- **Single sustained instrument, no percussion**: S06-06–S06-07, S07-04 and S11-05, enforced by per-stem masks and verified.
- **AU-S1**: a quiet original bugle phrase (A4–D5–F♯5) at 684.72–685.72.

SFX follow the per-shot column. Two dry, distant pistol reports land at 13.50/13.90 and 126.95/127.35. There are no close explosions and no impact or bullet-hit sounds anywhere: artillery is always a far rumble or crump.

The mix meets the stronger ducking QC asked for: **−12 dB under speech.** Music sits **16.7 dB under the narration** over the speech blocks (ep01: 12.0 dB). The momentary median is 18.0 dB and the 5th percentile 9.8 dB.

Master (ffmpeg): **−14.0 LUFS integrated, −1.5 dBTP true peak, LRA 1.6 LU.** The only silence of 1 s or more at −50 dB is the storyboard's deliberate near-silence at 388.75–390.01.

## How the video-editor wires the audio (exactly)
1. **Use one audio track only:** `<Audio src={staticFile('audio/mix.wav')} />` at frame 0 of the Episode composition, and nothing else. `src/scenes/Episode.tsx` line 98 already does this. Do **not** also add `narration.wav`, `music.wav`, `sfx.wav` or the `public/sfx/*` cues, or the audio will play double. Remotion cannot apply the +7.8 dB master gain or the true-peak limiter, so only `mix.wav` gives −14 LUFS / −1.5 dBTP.
2. **Composition length must be 21,600 frames (720 s at 30 fps).** `Episode.tsx` still has `EPISODE_FRAMES = 18150` from ep01, and `scripts/render.sh` still says `EP=ep01-ww2`, `TOTAL_FRAMES=18150` and the ep01 section chunks. Change these to ep02 (21,600 frames, last frame 21599). That is the editor's file; I have not touched it.
3. **Mux:** `render.sh` muxes `public/audio/mix.wav` → AAC 192k. Keep that. After the render, ffprobe the MP4: the audio should be 720.0 s and about −14 LUFS / ≤ −1 dBTP (re-measure with `ffmpeg -af ebur128=peak=true`).
4. **Fresh container:** every WAV is git-ignored, so `public/audio/` and `public/sfx/` will be missing. Rebuild them in this order:
   1. Set up Kokoro as in `voice-bible.md`.
   2. Run `python3 scripts/tts.py` (about 5 min). It is bit-identical to the approved narration, md5 61fdc97e….
   3. Run `python3 scripts/music.py` (about 4 min).
   4. Run `python3 scripts/sfx.py` (about 50 s).
   5. Run `python3 scripts/mix.py` (about 1.5 min).
5. **Picture sync points** (from `sfx-cues.json` → `syncPoints`; frames at 30 fps):

| Moment | Time (s) | Frame |
|---|---|---|
| Pistol reports, S01-02 | 13.50, 13.90 | 405, 417 |
| Pigeons burst | 13.56 | 407 |
| Title sting (roll) / hit | 27.95 / 28.90 | 838 / 867 |
| Domino clacks | 100.45 + 0.5 k (k = 0–7, last 103.95) | 3014–3118 |
| Chalk dominoes | 104.5 + 0.5 k (k = 0–6, last 107.5) | 3135–3225 |
| Sarajevo dot glow (timpani + bell) | 108.00 | 3240 |
| Pistol reports, S03-02 ("He shot them") | 126.95, 127.35 | 3808, 3820 |
| Big-clock chime ×11 | 160.3 + 1.0 k | 4809… |
| Carol hum starts / whistle, men part | 231.2 / 248.40 | 6936 / 7452 |
| Somme whistles, men climb | 418.60 | 12558 |
| 11:00 on the watch: guns stop, 1.0 s silence | 609.50–610.50 | 18285–18315 |
| Bugle phrase | 684.72–685.72 | 20542 |
| Map-fill ink ticks | 52.4, 53.7, 55.0, 58.9, 60.5, 62.4 | — |

   If the animation puts a beat elsewhere (domino fall, glow, map fills, whistle), tell me the frame. I will move the constant at the top of `music.py` and rebuild in about 7 min.

## Changes to inputs / assumptions
- Narration is unchanged. It was rebuilt only because the WAV is git-ignored, and the rebuild is bit-identical. `narration.json` and the SRT are byte-identical.
- At 11 o'clock the narration (s10.b7, from 609.475) continues through the 1.0 s window, because the narration timings are fixed. "Total silence" means music + SFX at digital zero, as with ep01's Hiroshima window.
- S07-04: the storyboard says "music drops out", and AU-02 says "single sustained instrument". Both are done: the music is out from 418.6 to 421.0, then one quiet sustained cello note plays to 428.
- Some cue times inside shots are my estimates, because the storyboard gives no exact time: map-fill ticks, the five declaration drum hits (147.6, 151.6, 153.6, 155.3, 157.3), the empire paper-cracks (645.0–649.2) and the car brakes (123.3).
- `the-human-story/episode-02-ww1/.gitignore`: added `public/sfx/` (177 MB, regenerable).
- Note: the Director committed a partial copy of my scripts mid-run (d3fd54c). The working tree now holds the final versions. Nothing has been committed by me.

## Blockers / issues
- [minor] Six 400 ms blocks have narration minus music between −2.8 and −4.6 dB (17.9, 532.0, 12.9, 18.0, 159.5, 113.3 s). All of them fall on sentence tails or breaths, not inside words. QC should listen there. The fix is a local −3 dB on that cue.
- [minor] Quality was checked by measurement only, not by ear. The hum's timbre (synthesised "mm" voices) and the bugle especially need a human listen at checkpoint 4. If the hum sounds artificial, the fallback is a soft solo-violin carol in its place: one line in `music.py`.
- [info] `public/sfx/` is 177 MB and is not needed when the render uses `mix.wav`.

## Requests for other agents
- video-editor: steps 1–3 above. Set the composition to 21,600 frames and update `render.sh` for ep02.
- animator / environment-designer: if you can, key the dominoes (100.45–107.5), the Sarajevo glow (108.0), the whistle (248.4), the Somme whistles (418.6) and the watch reaching 11:00 (609.5) to the frames above.
- quality-control: listen at the flagged blocks; at the carol (231–260), the tail (100–110), 11 o'clock (609–613), the poem and bugle (675–686) and the title (27.9–35); and check that no cue sounds like an impact.

## Recommended next action
- Director: route to video-editor for assembly with `audio/mix.wav`, then a combined QC listen.
- To rebuild: `python3 scripts/music.py && python3 scripts/sfx.py && python3 scripts/mix.py` (about 7 min; the narration must already be in `public/audio/`).
