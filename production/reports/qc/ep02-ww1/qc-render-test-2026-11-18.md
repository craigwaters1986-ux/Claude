# Episode 2 render test · 18 November 2026

The source passed TypeScript checking. A new render of frames 3300–3359 passed ffprobe at 2.000 seconds, 1920 × 1080, 30 fps, H.264 yuv420p and 48 kHz stereo AAC. Automated detection found no black or frozen segments in those two seconds. The test audio was decoded from the approved reference MP3.

The chapter timestamps match the 11 section starts declared in the episode timeline. Final playback and sync checks remain pending. The WW1 thumbnail is a 1280 × 720 JPEG under 2 MB and was checked at 160 px wide.

The opening minute was also exported separately. It contains the approved reference mix decoded to 48 kHz PCM before the final AAC encode. The decoded reference measures −14.5 LUFS integrated, 2.0 LU loudness range and −1.1 dB true peak. The planned lossless rebuild was blocked when its runtime attempted an external telemetry connection. The original reference MP3, narration timeline and subtitles were preserved.

A stricter half-second freeze detector flagged two intervals of low motion between 31.67 and 32.67 seconds during the opening title. The title shot is designed with a rotating globe, dust and a slow zoom. Check that motion during final playback.
