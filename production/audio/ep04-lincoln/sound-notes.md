# Episode 4 sound notes · Abraham Lincoln (ep04-lincoln)

Rebuilt 21 November 2026 (Phase D2) by `the-human-story/episode-04-lincoln/scripts/audio.py`. Programme length 600.000 s.
This replaces the first mix (Kokoro voice, synthesised score), which Craig reviewed on 20 November.

- **Narration:** ElevenLabs voice **Liam Dale** (`w2ZdKT3ghAOcMRbpjC3u`, `eleven_v4`), 27 group takes in `elevenlabs-groups/`, assembled by `scripts/el_assemble.py` (48 kHz, 525.1 s) and placed at each group's plan `final_start_ms`. A synthetic voice.
- **Score:** ten instrumental cues generated with **ElevenLabs Music** (`eleven_music_v2_5`), one per chapter, in `elevenlabs-score/` (prompts, node and generation ids, credits in its `README.md`). About 9,400 credits. Instrumental setting on for every cue.
- **Sound effects and sync hits:** synthesised in `audio.py` as before (112 effect cues, unchanged list; the water is the soft wash, no drips). The hits kept under the generated cues are percussion only (timpani, bass drum), tuned to each cue's key, plus the title impact.
- **Public-domain tunes:** none used.
- **Nobody has listened to this mix.** Everything below is measured. Craig's listen at Approval 4 is the first.

## How the cues are placed

Each cue is anchored to a picture moment measured inside the cue (a swell, a hush, a release), not only to its chapter start. Times are programme times.

| Time | Cue | What plays [span] |
| --- | --- | --- |
| 0:00.00 | EL c01 open | the first piano phrase of c01, stated in the silent open [0.00-4.00 s] |
| 0:00.00 | EL c01 | cold open: felt piano and low strings; chord arrival on the title plate [0.00-35.92 s] |
| 0:27.40 | hit title | short riser and timpani roll; impact (timpani, bass drum, low brass, D major) on the title plate, with c01's own chord |
| 0:32.35 | EL c02 | solo fiddle over felt piano; thins to a hush in the grave beat [32.35-88.95 s] |
| 1:26.59 | EL c03 | low strings, then clarinet and pizzicato; final chord through the captaincy beat [86.59-139.19 s] |
| 2:15.04 | EL c04 | warm strings and piano; full in the ball, circuit and Capitol beats [135.04-203.24 s] |
| 3:21.73 | EL c05 | low unsettled strings and sparse piano; horn swell into the Cooper Union beat [201.73-272.13 s] |
| 3:53.76 | EL c05 out | no music under the Charleston quotation (room tone only) [232.46-250.54 s]; strings return over 4.5 s |
| 4:27.56 | EL c06 | brass pulse and strings, falling bass, low drone at Fort Sumter [267.56-326.56 s] |
| 5:21.92 | hit flag | timpani and bass drum as the flag comes down at Fort Sumter (beat start + 0.2 s) |
| 5:23.56 | EL c07 | war ostinato, rising violin line at the Proclamation, march for the Black regiments, crest into the cemetery beat, then silence [323.56-408.89 s] |
| 5:51.61 | hit signature | soft timpani on the signature |
| 6:35.59 | hit cemetery | timpani and bass drum into the cemetery beat, under c07's crest |
| 6:54.61 | EL c08 | strings and horns enter with the title plate; calm held chords for the Second Inaugural; low strings dying away under the toll, silence over the fields [414.61-483.08 s] |
| 7:20.80 | hit tally | soft timpani as the tally board turns |
| 7:59.92 | EL c09 | quiet reprise on solo felt piano; no hits; silence for the clock [479.92-530.72 s] |
| 8:50.22 | EL c10 | funeral processional, full orchestra at the Memorial, solo piano for the historians and the last page [530.22-589.20 s] |
| 9:53.56 | EL c01 reprise | the title chord returns on the end card and rings out [593.56-603.08 s] |

Placement decisions worth knowing:

- **Title (0:27.40).** The cold-open cue's own chord arrival lands on the title plate, with the synthesised impact on the same frame. The plate starts 0.06 s earlier (`S01.tsx`, title beat start + 0.6 s).
- **Cold open.** The cue's first piano phrase is also stated once in the 3 s open, so there is music before the narrator speaks.
- **Grave beat (1:02.5).** The fiddle cue thins to a hush inside the beat and returns as the narrator does.
- **Chapter 4** came out in C major (the others are in D major or D minor as prompted); it enters only after chapter 3's final chord has gone.
- **Charleston (3:53–4:11).** No music under the quotation, as on the approved cue sheet: room tone only. The strings return over 4.5 s at "The legislature…".
- **Cooper Union (4:25.8).** The cue's last horn chord lands on the beat.
- **War and emancipation.** The cue starts 9.5 s in, so its rising violin line arrives with the Proclamation, its march with the Black regiments, and its crest falls away inside the cemetery beat. There is then no music under the opening of the Address, as on the cue sheet; the page holds in room tone.
- **Ford's Theatre.** Solo felt piano, 3 dB quieter than the other cues, no hits. It has died away before "Abraham Lincoln died"; the clock beat is the clock alone.
- **Legacy.** The cue starts 11 s in, so the full orchestra plays for the Memorial and drops to solo piano at "At the dedication,". The last line is spoken almost in the clear, then the title chord returns on the end card (the cold-open cue from 26.4 s) and rings out.

## Level control

- **Level ride per cue** (`level_ride`): a slow fader ride. A cue is left alone while its 3 s loudness stays within −6 to +3 dB of its own average; quieter passages are lifted towards −6 (at most 9 dB), louder ones pulled back by three quarters of the excess. Natural fade-outs are not lifted.
- **Ducking:** the music sits 12 dB lower under speech than in the silent beats (0.35 s ramps). The beats stay 5 dB below full.
- **24 dB rule:** the music gain is set so the narration sits 24 dB above the music during speech (median of 400 ms blocks).
- **Speech-aware ceiling** (`ride_ceiling`): no 400 ms block of music may come closer than 19 dB to the narration's loudness while the narrator speaks, or closer than 4 dB in a silent beat. 60 blocks were trimmed, by at most 7.6 dB.
- **Master:** −14 LUFS target, limiter ceiling −1.5 dBTP, 1.2 s fade at the end.

## Levels (measured)

| Measure | Result |
| --- | --- |
| Integrated loudness (ffmpeg ebur128) | **-14.0 LUFS** (script: -14.02); LRA 5.9 LU |
| True peak (ffmpeg ebur128) | **-1.5 dBTP** |
| silencedetect n=−50 dB d=1.5 s | **none** |
| Narration minus music during speech (median of 400 ms blocks) | **23.8 dB** |
| Narration's overall loudness minus music, each 400 ms block under speech | median 24.7 dB, 5th percentile 20.4 dB, closest 18.9 dB |
| Narration minus music + effects during speech | 19.4 dB median |
| Stem loudness | narration -13.9, music -32.5, effects -31.3 LUFS |
| Limiter | at most 4.0 dB gain reduction |
| Music in the silent beats (LUFS) | title plate -20.4, grave (hush) -32.3, ball -26.2, Capitol -27.1, Cooper Union -25.3, flag at Fort Sumter -24.5, cemetery -22.1, tally board -25.6, fields (silence) -50.7, empty chair -25.3, clock (silence) -40.7, Thirteenth Amendment -22.1, end card -21.7 (full list in `output/mix-stats.json`, `beats_music`) |

For comparison, the first mix (the one Craig found too loud) had the narration 20 dB over the music and the music in the beats at −11 to −16 LUFS.

The per-block figure the first notes quoted as a "5th percentile" (14.7 dB here, 9.3 dB in the first mix) compares the music with each instant of the narration, pauses between words included, so it reads low; the row above compares the music with the narration's overall loudness instead.

## Checks on the generated cues

- **Sung or spoken words:** none found. Each cue was run through a voice-activity detector (Silero, via faster-whisper) and the recogniser. Nothing reached the speech threshold (0.5); real narration scores above 0.7. The first 13 s of the chapter 8 cue scored weakly voice-like (0.15–0.35), which fits a string or horn melody in a vocal register. Worth a listen at 6:55.
- **Key:** estimated from each cue's pitch content. All in D major or D minor except chapter 4 (C major).
- **Clipping:** none; cue peaks are between −5.3 and −0.2 dBFS before the mix.

## Files

- `public/audio/mix.wav`: 48 kHz stereo 16-bit, exactly 600.000 s. This is what the render muxes.
- `output/stems/{narration,music,sfx}.wav`: same format and length.
- `output/mix-stats.json`: stats, cue list, effects list, beat levels.
- `production/audio/ep04-lincoln/episode-04-mix-listen.mp3`: 96 kb/s listen copy.

## Re-run

```
cd the-human-story/episode-04-lincoln
mkdir -p output/el-voice output/el-full output/full-voice
cp ../../production/audio/ep04-lincoln/elevenlabs-groups/*.mp3 output/el-voice/
cp ../../production/audio/ep04-lincoln/narration-draft-audit.json output/full-voice/
/home/user/audio-py/bin/python scripts/el_assemble.py                       # narration -> output/el-full
/home/user/audio-py/bin/python scripts/audio.py output/el-full              # about 3 minutes; needs about 9 GB of memory
REUSE_MUSIC=1 /home/user/audio-py/bin/python scripts/audio.py output/el-full  # remix only (effects or level changes)
SYNTH_SCORE=1 /home/user/audio-py/bin/python scripts/audio.py output/el-full  # fallback: the synthesised score
```
