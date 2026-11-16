# QC report — ep01-ww2 final render — 2026-11-16

**Target:** `the-human-story/episode-01-ww2/output/episode-01-ww2.mp4`
**Reviewer:** quality-control (one pass; no listening possible)
**VERDICT: PASS WITH MINOR NOTES.** No blocking issues. Human listen and the usual user sign-off (checkpoint 4) are still required.

## Technical (measured)
| Check | Result |
|---|---|
| Duration / frames | 605.000 s, 18,150 frames, video and audio both 605.000 s. PASS |
| Format | 1920x1080, 30 fps, H.264, AAC 48 kHz stereo. PASS |
| Integrated loudness | -14.1 LUFS (target ~-14). PASS |
| True peak | -1.2 dBTP (limit -1.0). PASS |
| LRA | 1.8 LU (very even). PASS |
| Silence > 1 s at -50 dB | none, including the planned ~1.5 s hush around 536 s (not below -50 dB). PASS |
| Last frame | 600 s and 604.9 s both show the end card over the crowd scene, with figures moving. No black at the end. PASS |
| Movement | Frame differences 1 s apart are non-zero in sampled shots at 1, 100, 300 and 500 s; the four visible shots at 173.3/175.8 (tank, soldiers) and 190/194.7/197.5 (map arrows) clearly advance. PASS |

## Detector detections confirmed by frame
1. Freeze 25.9–29.7 s, title card: confirmed as a held title card with spotlight and globe; slow push only. Acceptable. Consider a little more visible motion (see N-9).
2. Black 468.2–470.5 s, Holocaust memorial: confirmed. Opens near-black, a single candle at 469 s, sombre, matches storyboard. Acceptable.
3. Freeze 536.2–538.4 s, Hiroshima aftermath: confirmed locked-off ruins with the estimate label "ABOUT 90,000–140,000 DEAD BY THE END OF 1945 (EST.)", during the planned silence. Respectful and non-graphic. Acceptable.

Not in the detector log: the first frame of each chapter (150, 210, 270, 330, 390, 450, 570 s) is dark and fades up within about 0.3 s, and 396 s is a deliberately dark shot (Y about 15, rising to normal by 400 s). Both are intentional chapter fade-ins/dark shots, not faults.

## Visual sample (50 frames: 2, 12, 27, 36, 48, 66.6, 78, 96, 108, 130, 150, 156, 173.3, 175.8, 190, 194.7, 197.5, 210, 216, 234, 252, 270, 278.8, 285.4, 300, 318, 330, 348, 366, 390, 396, 414, 432, 450, 459, 469, 486, 500, 510, 522, 533.5, 537, 549.5, 560, 570, 576, 590.5, 597, 600, 604.9)
- Style consistent with the stick-figure reference: round white heads, black outlines, flat muted colours. Maps, newspaper and title are clean 2D. PASS.
- British spelling and format ("kilometres", "Defeated", dates as "1 September 1939"). No US spellings seen. PASS.
- Dates and figures match the script: Nov 1918, 30 Jan 1933, Mar 1938, Aug 1939, 1 Sep 1939, 17 Sep 1939, Apr 1940, 330,000 evacuated, 22 Jun 1941, 3 million / ~3,000 km, 91,000 prisoners (Stalingrad), 7–8 May 1945, Hiroshima/Nagasaki, 2 Sep 1945, "estimated 60 million". Estimates are labelled "(EST.)". PASS.
- Historical figures carry name tags (Kaiser Wilhelm II, Hindenburg, Hitler, Ribbentrop, Molotov, Stalin, Roosevelt, Montgomery, MacArthur). PASS.
- No swastikas or glorified extremist symbols seen in the sample; tanks carry a plain cross marking only. Propaganda poster at 96 s is an abstract arrow. PASS.
- Atrocity scenes (459, 469, 486, 533–537) are sombre, non-graphic, no comic elements. PASS.
- The flash at 533.5 s is white with the caption still readable. PASS.

## Issues (none blocking)

### BLOCKING
None.

### Non-blocking
| # | Time | Issue | Why it matters | Fix | Agent |
|---|---|---|---|---|---|
| N-1 | 190–195 s | "POLAND" map label collides with the "Warsaw" label (reads "POLWarsaw"). | Text overlap, mildly sloppy on a phone. | Offset the Warsaw label or fade the POLAND label before the city tag appears. | environment-designer |
| N-2 | 285.4 s | "MORE THAN 3 MILLION AXIS SOLDIERS" / "A FRONT NEARLY 3,000 KM LONG" pills hide a map label (shows a stray "S"), and "NEARLY 3,000 KM" sits across an arrow. | Overlap and clipping. | Move pills clear of map labels, or shift the km label. | storyboard / video-editor |
| N-3 | 108 s | Name tags for Hindenburg and Hitler overlap ("PAUL VON HINDENBURG" runs into "HITLER"). | Name tag partly unreadable. | Separate the tags horizontally or stagger the characters. | animator / video-editor |
| N-4 | 318 s | The chapter/date banner covers the top of the Roosevelt name tag (only "...LT" visible). | Historical figure's tag unreadable while banner is up. | Delay the tag until the banner fades, or lower the tag. | video-editor |
| N-5 | 318 s | Several crowd figures render with solid black heads / striped eye-bands. Possibly hair or hat blocks at that scale. | Off-style, looks like a glitch. | Check the crowd variants; use white heads with hair/hats. | animator |
| N-6 | 597–604.9 s | End-card title overlaps clouds and the caption band sits over the crowd. Legible, but the clouds touch the title text at 597 s. | Minor legibility. | Shift clouds or add a subtle shadow. | video-editor |
| N-7 | 150, 210, 270, 330, 390, 450, 570 s | Chapter starts have a brief fade from near-black (about 0.3 s). | Not an error; noted so it is not mistaken for dropped frames. | None needed. | n/a |
| N-8 | 500 s | The surrender document and "GERMAN DELEGATION" tag are small. | Readability on a phone. | Enlarge slightly if time allows. | video-editor |
| N-9 | 26–30 s | Title card is almost static for 3.8 s (freeze detector). | The brief says every shot must move; the push-in and dust are very faint. | Optionally increase push or add visible particles. | video-editor |
| N-10 | Process | The SRT (`output/episode-01-subtitles.srt`) was not independently timed against the final 605 s edit in this pass beyond burned-in captions in the sample, which matched narration at each frame checked. Exports, chapter file and thumbnail are not yet produced. | Deliverables incomplete for publishing. | Run the SRT check at export; produce chapters/metadata. | video-editor / youtube-specialist |

## Audio (objective only)
Stem levels (EBU short-term-style integrated over a 2 s window) at the requested points. Narration sits about 11–14 dB above the music and 25+ dB above SFX at every point, so masking is very unlikely.
| Time | Narration | Music | SFX | Final mix (3 s) |
|---|---|---|---|---|
| 66.6 | -19.8 | -32.9 | -48.2 | -14.3 |
| 173.3 | -19.3 | -33.3 | -46.0 | -13.7 |
| 175.8 | -19.3 | -31.4 | -48.3 | -14.1 |
| 194.7 | -19.8 | -30.5 | -70.0 | -14.1 |
| 197.5 | -19.6 | -29.0 | -70.0 | -13.6 |
| 278.8 | -19.2 | -31.4 | -48.2 | -13.8 |
| 285.4 | -19.8 | -31.5 | -52.5 | -14.0 |
| 590.5 | -19.3 | -31.3 | -52.7 | -14.7 |
These are stem levels before the final mastering gain, so only the relative gaps matter. The mix is a stable -14 LUFS, with no clipping.

## Needs a human ear (cannot be verified objectively)
1. Respelled pronunciations (narration.json times): **Versailles** 41.4–47.8 s and 76.6–79.6 s; **Sudetenland** 133.3–140.8 s; **Luftwaffe** 246.6–251.6 s; **El Alamein** 344.7–352.1 s.
2. Overall music taste and mood, the sombre cues at 459–470 s and 533–540 s, and the music lift at 500.6 s with the surrender stamp.
3. SFX appropriateness around the atrocity and atomic-bomb sections (no comic SFX allowed), including the silence at 536–538 s.
4. Narration naturalness and consistency of the bm_george voice across all 11 sections.
5. Sync of the audio against the visuals at the flash (533.07 s) and Nagasaki glow (549.5 s).

## Rights
Not re-audited here. The credits file should list the music (original or licensed) and fonts before publishing.
