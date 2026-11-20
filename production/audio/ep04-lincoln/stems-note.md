# Episode 4 stems · ep04-lincoln

`the-human-story/episode-04-lincoln/output/stems/` holds three stems. Each is 48 kHz stereo 16-bit WAV, exactly 600.000 s (28,800,000 samples).

| Stem | Contents | Loudness |
| --- | --- | --- |
| `narration.wav` | Kokoro `bm_george` narration (light 2:1 compression), 27 groups at plan times | −14.0 LUFS |
| `music.wav` | original synthesised score, with the ducking already applied (−13 dB under speech, hits −7 dB) | −19.9 LUFS |
| `sfx.wav` | synthesised SFX (112 cues) | −31.4 LUFS |

The stems have the master gain, the limiter gain curve and the 1.2 s end fade applied, so narration + music + SFX = `public/audio/mix.wav`. They are not clipped and nothing in them is generated or licensed from outside: every sound is original numpy/scipy synthesis apart from the narration.
