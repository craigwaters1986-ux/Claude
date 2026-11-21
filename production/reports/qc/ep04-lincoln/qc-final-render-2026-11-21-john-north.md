# QC · Episode 4 render 3 (John North narration, family-review fixes) · 21 November 2026

File: `production/exports/ep04-lincoln/episode-04-lincoln-1080p.mp4` (299.5 MB, not in Git). Replaces the Liam Dale render approved earlier on 21 November.

**Verdict: ready for Craig's review (Approval 4).** No blocking technical issues. Nobody has listened to the new voice in the mix at normal speed yet.

| Check | Target | Result |
| --- | --- | --- |
| Duration / frames | 600.000 s, 18,000 | 600.0 s, 18,000 decoded ✅ |
| Video | H.264 1920×1080 30 fps, limited-range BT.709 | as before (same encode command) ✅ |
| Loudness | −14 LUFS, ≤ −1 dBTP | −14.0 LUFS, −1.2 dBFS after AAC (−1.5 dBTP in the mix), LRA 4.5 ✅ |
| Narration over music | about 24 dB | 24.0 dB median in speech ✅ |
| Silence ≥ 1.5 s / black | none | none / none ✅ |
| Frozen picture | freezedetect n 0.003 d 1.5 | none. The first pass found two (4.x 1841 window shot, 8.4 Second Inaugural page); both cameras now push through the cut ✅ |
| Caption sync | captions on the words | caption starts against speech onsets measured in the narration (silencedetect −38 dB): 144 of 150 within 0.3 s, median −0.02 s. The recogniser-on-mix check (142 cues matched, 106 within 150 ms, worst 0.87 s) is noisier for this voice: its worst cue (4.49 s) was checked by hand and is correct ✅ |
| iPhone copy | 720p H.264 Main 3.1 | 66.8 MB + 4 parts in `iphone-parts/` ✅ |

## Changed since the approved render
- Narration: ElevenLabs **John North - Warm Northerner** (`7rQX8r6PVq3gfJ8rZzyE`, `eleven_v4`), played at tempo 1.04, pitch kept (he reads at about 141 words a minute against Liam Dale's 146).
- Plan: about 2.6 s moved from chapters 1–4, 9 and 10 into chapters 5–8. Title beat 4.2 s, clock beat 3.2 s, end beat 5.0 s (end card about 4.3 s). Chapters: 0:00, 0:31, 1:24, 2:14, 3:19, 4:27, 5:24, 6:56, 8:02, 8:51.
- Captions: 155 cues. Re-segmented: "His election was the spark." | "On the twelfth of April, 1861,", and the Gettysburg / "That August," run. One cue hand-timed ("That year he joined…").
- Picture (family review): feathered quill; brougham with a kit horse, harness and coachman; Booth shown firing in the box (flash and smoke, no blood), Lincoln slumps, Mary turns; Lincoln carried in arms by lit soldiers and civilians; Booth a lit character in the corridor. The box shot starts 0.6 s earlier, so Booth is seen aiming; corridor walk 20 frames tighter.
