# Scriptwriter memory — lessons learned

- Size a section by its real speech window (start + lead → mustEndBy/end − 1.4 s), not the
  section length. Ep01 hook: 21.2 s of speech → 45–48 words at ~1.0× (54 words needed 1.14×).
- Always run the measured TTS fit (engine tts.py logic, Kokoro bm_george, cap 1.17×), not just a
  word count: longer words alone pushed ep01 s03 from 1.117× to 1.154×.
- Keep one tense in a hook; closing questions addressed to the viewer may use past tense.
- When shortening fact-checked wording, keep the hedges that made it accurate ("much of", "seems").
- If Kokoro isn't installed (/opt/tts missing), estimate fit by syllables: ~4.0 syl/s at 1.0× for
  bm_george (ep01 v3 calibration) + each pauseAfter (default 0.32 s). Word targets of 2.2 w/s
  overshoot on date/name-dense history: ep02 needed ~2.1–2.3 w/s, total 1,535 words for 720 s.
- Copy approved quotations from the primary transcription, not the research note: Binyon on
  Wikisource has a comma after "grow old", not a colon (ep02).
- Keep the Armenian-style sensitive beat at ~45–50 words with longer pauses; budget the rest of
  that section around it first, and move cut facts (e.g. Lusitania, Jutland) to on-screen or out.
- Read every new line for unsourced glosses ("attacking ships without warning", "far worse
  shortages", "Germany's new ally" is fine) — explanatory phrases can sneak in unsourced claims.
