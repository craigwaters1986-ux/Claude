# Scriptwriter memory — lessons learned

- Size a section by its real speech window (start + lead → mustEndBy/end − 1.4 s), not the
  section length. Ep01 hook: 21.2 s of speech → 45–48 words at ~1.0× (54 words needed 1.14×).
- Always run the measured TTS fit (engine tts.py logic, Kokoro bm_george, cap 1.17×), not just a
  word count: longer words alone pushed ep01 s03 from 1.117× to 1.154×.
- Keep one tense in a hook; closing questions addressed to the viewer may use past tense.
- When shortening fact-checked wording, keep the hedges that made it accurate ("much of", "seems").
