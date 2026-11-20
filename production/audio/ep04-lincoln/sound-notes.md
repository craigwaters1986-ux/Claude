# Episode 4 sound notes · Abraham Lincoln (ep04-lincoln)

Built 20 November 2026 by `the-human-story/episode-04-lincoln/scripts/audio.py`. Programme length 600.000 s.

- **Narration:** `narration-draft.wav` (Kokoro `bm_george`, 24 kHz), all 27 groups placed at their plan `final_start_ms`.
- **Score:** original and fully synthesised (numpy/scipy). It uses the instruments and Lincoln theme from the approved Phase B test (`scripts/music_test.py`): solo fiddle over piano, string ensembles, horns, low brass, the formant choir, the war ostinato with side drum and bass-drum heartbeat, and the convolution hall.
- **ElevenLabs:** no generated music. Those generations had failed for lack of funds.
- **Public-domain tunes:** none used. The Battle Hymn, Johnny and Hail Columbia quotes on the cue sheet were left out because their melodies could not be checked against a printed source. Nothing needs crediting for tunes.

## Cue list as built

Hits use exact times from the plan (beat starts and chapter starts). Every chapter card except Ford's Theatre (1M10, no hits) gets a soft timpani sting and a paper whoosh. The Legacy card sting is quieter.

| Time | Cue | What plays / hit |
| --- | --- | --- |
| 0:00.30 | 1M1 | lamp-hum pad (D3/A3 strings); piano plays two notes of the theme (A4, D5) in the 3 s open; sparse piano chords under the narration |
| 0:28.72 | 1M1 hit | the riser runs over the first 4 s of the title beat, then the **impact** (timpani, bass drum, low brass, choir) lands, then a held D major chord. **Picture: the title plate should land at 28.72 s (title-beat start + 4.0 s)** |
| 0:35.00 | 1M2 | winter-air pad; Lincoln theme on solo fiddle over piano |
| 1:03.69 | 1M2 grave | music thins to one sustained fiddle D5 (plus a low D) for the grave beat |
| 1:12.44 | 1M2 | theme returns with the stepmother; strings join in the firelight beat (1:22.6) |
| 1:33.00 | 1M3 | theme on clarinet over pizzicato strings and a river pulse |
| 1:51.77 | 1M3 New Orleans | harmony darkens to D minor, no melody |
| 2:16.08 | 1M3 hit | soft timpani on the captaincy close-up; a D major chord swells in the beat |
| 2:23.00 | 1M4 | theme on full strings, warmer; strings and horn swell in the ball beat (2:46.8) |
| 2:49.01 | 1M4 1841 | everything drops to a solo cello, very quiet |
| 2:58.84 | 1M4 wedding | strings come back with the theme; pizzicato for the circuit and Congress |
| 3:20.48 | 1M4 Capitol | horn swell and D major cadence in the Capitol beat |
| 3:28.00 | 1M5 | low strings, unsettled harmony |
| 3:45.16 | 1M5 house divided | one held D minor chord under the quotation |
| 3:58.30 | 1M5 Charleston | no music: room tone only, until 4:12.2 |
| 4:12.21 | 1M5 | low strings return quietly ("Lincoln lost"), building to Cooper Union |
| 4:26.56 | 1M5 hit | horn swell at Cooper Union, peaking in the beat |
| 4:33.00 | 1M6 | brass pulse for the convention; pizzicato and a fiddle fragment for Grace Bedell; brass chord for the election |
| 4:53.55 | 1M6 secession | falling bass line, one note for each of the 7 seceding states |
| 5:07.83 | 1M6 Fort Sumter | low drone |
| 5:20.90 | 1M6 hit | **timpani + low brass hit in D minor as the flag comes down** (beat start + 0.2 s) |
| 5:28.00 | 1M7 | war motif enters (ostinato, side drum, heartbeat) |
| 5:30.43 | 1M7 Willie | drops to solo piano; ostinato returns quietly under the Greeley letter |
| 5:48.27 | 1M7 Proclamation | freedom line rises (violins, D major, up a sixth) |
| 5:52.14 | 1M7 hit | sting on the signature (timpani + brass, D major) |
| 6:00.47 | 1M8 | war motif and freedom line (minor) together |
| 6:10.15 | 1M8 march | steady march: side drum, bass drum, horns on the theme. No tune quote |
| 6:19.41 | 1M8 Gettysburg | war build: ostinato, drums, low-brass theme, choir, timpani roll, riser |
| 6:32.31 | 1M8 hit | **impact into the cemetery beat**, choir crest; music out by the end of the beat |
| 6:36.02 | 1M8 | silence under the opening words of the Bliss copy (room tone only) |
| 6:49.45 | 1M8 coda | quiet piano on the theme in the beat that holds the opening words |
| 6:58.00 | 1M9 | theme on full strings and horns, with piano (hope) |
| 7:18.40 | 1M9 hit | brass sting and timpani as the tally board turns (119 to 56) |
| 7:20.51 | 1M9 malice | one held D major chord under "With malice toward none"; warm horn for "a sacred effort" |
| 7:38.69 | 1M9 Appomattox | quiet strings |
| 7:48.19 | 1M9 toll | low choir and low strings |
| 7:54.54 | 1M9 beat | choir alone over the empty fields |
| 8:03.00 | 1M10 | quiet reprise: the theme's first phrase on solo piano, slower; low choir pad; no hits, nothing startling |
| 8:44.51 | 1M10 clock beat | one sustained piano chord (D major), then silence under the clock |
| 8:53.00 | 1M11 funeral train | slow processional: low strings, muffled drum |
| 9:03.70 | 1M11 Thirteenth | freedom line rises to the amendment |
| 9:14.91 | 1M11 crane | crescendo (timpani roll, strings) through the Thirteenth Amendment beat, peaking as the Memorial crane begins; theme in full (violins, horns, choir) |
| 9:27.84 | 1M11 | falls back: piano and soft strings for the historians, solo piano for the last page |
| 9:56.32 | 1M11 end | theme in full (orchestra + choir) through the last-line beat; **final D major chord** on the end card, fading over the last 1.2 s |

## SFX (synthesised, restrained)

The full list of 112 cues, with times and gains, is in `output/mix-stats.json` (`sfx`). The main ones:

- **Pen scratch at every `write`:** the quill in the cold open (0:00.3), the 1841 letter (2:49), Grace Bedell's letter (4:38), the signature on the Proclamation (5:48.9) and the Hodges letter (6:58.8). There are also soft reporters' pencils at the debates.
- **Page turns at every document "page" transition:** 0:12, 1:24/1:27 (`readBook`), 2:31, 3:45, 5:37, 6:36, 7:23, 9:09 and 9:36.
- **Cabin and frontier:** winter wind and a distant crow. Axe chops with wood chips (1:01.8), wagon wheels and hooves (Indiana, the stepmother's arrival), firelight crackle.
- **River:** water and flatboat pole strokes (1:33), dawn birds, maul splitting rails, the waterfront at dusk.
- **Horses:** hooves riding into Springfield, horseback with rain on the circuit (3:04), the carriage outside Ford's (8:03).
- **Crowds, all low:** legislature, ball, party meeting, debates, Cooper Union, convention, House chamber, inauguration, reception, 1922 dedication. At Charleston there is room tone only, with no crowd and no applause.
- **Fort Sumter:** four **distant, soft** cannon (5:09–5:15), harbour water, night wind and the flag halyard. This is the only cannon in the episode.
- **War:** soldiers marching (6:11), wind at Gettysburg and the cemetery, and the White House door and footsteps for Douglass.
- **Other events:** the tally board turning (7:18.4). The clock ticks from 8:38.5 and stops in the clock beat (9.5), then room tone and faint morning birds.
- **Funeral train:** muted train wheels and a muted whistle (8:53).
- **Ford's Theatre:** **no gunshot** and no startling sound. The theatre murmur is muffled, then room tone only. There are no comic sounds anywhere.

## Levels (measured)

| Measure | Result |
| --- | --- |
| Integrated loudness (ffmpeg ebur128) | **−14.1 LUFS** (script: −14.05); LRA 3.6 LU |
| True peak (ffmpeg ebur128) | **−1.5 dBTP** |
| silencedetect n=−50 dB d=1.5 s | **none** |
| Narration minus music during speech (median of 400 ms blocks) | **20.0 dB** (5th percentile 9.3 dB) |
| Narration minus music + SFX during speech | 16.9 dB median |
| Music ducking under speech | −13 dB (hits bus −7 dB), 0.35 s ramps; music back to full in the beats |
| Stem loudness | narration −14.0, music −19.9, SFX −31.4 LUFS |
| Limiter | at most 3.3 dB gain reduction |
| Narration placement | all 27 groups cross-correlate at 0.0 ms (±1 sample) from `final_start_ms`, in both the narration stem and the mix |
| Music in the beats (LUFS) | title 1M1 −14.9, grave −13.2, Cooper Union −15.1, flag −15.6, cemetery −12.2, tally −14.2, end card −11.1 (full list in `output/mix-stats.json`, `beats_music`) |

## Files

- `public/audio/mix.wav`: 48 kHz stereo 16-bit, 28,800,000 samples (600.000 s). This is what the render muxes.
- `output/stems/{narration,music,sfx}.wav`: same format and length. See `stems-note.md`.
- `output/mix-stats.json`: stats, music cue list, SFX list.
- `output/music-stem.npz` + `output/music-cues.json`: the cache for `REUSE_MUSIC`.
- `production/audio/ep04-lincoln/episode-04-mix-listen.mp3`: 96 kb/s listen copy.

## Re-run

```
cd the-human-story/episode-04-lincoln
/home/user/audio-py/bin/python scripts/audio.py output/full-voice            # about 4 minutes on 4 cores
REUSE_MUSIC=1 /home/user/audio-py/bin/python scripts/audio.py output/full-voice   # remix only (SFX/levels changes)
```

Any change to the score in `compose()` needs a run without `REUSE_MUSIC`.
