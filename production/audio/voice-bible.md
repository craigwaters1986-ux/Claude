# Voice bible — The Human Story narrator

## Current channel narrator (from 21 November 2026; Craig's choice after his family's review)

- **Voice:** **John North - Warm Northerner**, voice_id `7rQX8r6PVq3gfJ8rZzyE`, `eleven_v4`, one take per group.
  Chosen from round 4 of the samples (`production/audio/ep04-lincoln/voice-samples/round4-northern/13-john-north.mp3`)
  because the family found Liam Dale too old and too slow and the other candidates too posh.
- **Pace:** about 141 spoken words a minute raw; `el_assemble.py` plays the takes at tempo **1.04** (ffmpeg
  `atempo`, pitch kept; `EL_TEMPO=1` for raw), about 146 words a minute. Budget about 140 words a minute when
  fitting a script. Episode 4: 539 s raw speech, 519 s after the tempo lift.
- Everything else below (engine, model, IPA, assembly) is unchanged.

## Previous narrator (Episode 4 first and second renders, 20–21 November 2026)

- **Engine:** ElevenLabs (Creator plan; commercial YouTube use allowed), connector `ElevenLabs` in Claude.
- **Voice:** **LIAM DALE (British Male 60's)**, voice_id `w2ZdKT3ghAOcMRbpjC3u` — a veteran British history
  documentary narrator. Chosen over Cedric M and Daniel Calder in an audition on the Episode 4 cold open.
- **Model:** `eleven_v4`, `generations_count` 1, one generation per paragraph group (about 150–400 characters).
  About 1 credit per character; a 10-minute episode's narration costs about 8,000 credits.
- **Text:** spoken forms as before (years in words, no full stops in abbreviations). On `eleven_v4`, put IPA
  between slashes for names the voice may misread: Appomattox `/ˌæpəˈmætəks/`, Bedell `/bəˈdɛl/`.
- **Pace:** about 8% slower than Kokoro at 0.99 (Episode 4: 515 s against 480 s). Budget about 135 spoken words a
  minute when fitting a script to its duration.
- **Assembly:** `the-human-story/episode-04-lincoln/scripts/el_assemble.py` → 48 kHz mono WAV + audit JSON for
  `tools/build_plan.py`; then faster-whisper words, `tools/align_captions.py`, `scripts/timeline.py`, `audio.py`.

## Fallback: Kokoro (Episodes 1–3)


- **Engine:** Kokoro-82M (open weights, Apache-2.0), run locally via `kokoro-onnx`.
- **Voice:** `bm_george` (British English male) — the channel voice for every episode.
- **Language code:** `en-gb`. Since ep02 v3 (2026-11-17) narration is synthesised in **groups** of
  up to 3 related sentences (one Kokoro pass, ≤ 330 phonemes), at base speed **0.96** (a group reads
  about 5 % faster than single sentences). The builder may go up to **1.05** to fit a section — if a
  section needs more, cut words instead (the old 1.17 cap sounded rushed).
- **Delivery target:** confident, warm, conversational; slightly dramatic for big events;
  serious and slower for tragedy (lengthen `pauseAfter` rather than changing voice).
- **Delivery mechanics (tts.py v3, keep for every episode):**
  - One Kokoro pass per group, then the group is cut at the pauses between sentences (cut in the
    middle of the longest quiet run near the predicted join; falls back to per-sentence synthesis if a
    join cannot be found). Intonation then carries across sentences instead of resetting each time.
  - A group ends after any sentence whose `pauseAfter` ≥ 0.5 s (a dramatic beat), or at a sentence the
    music is cut to (`HARD_ANCHORS`). Inside a group the model's own pause is kept (varies naturally,
    ~0.3–0.6 s); between groups `pauseAfter` (default 0.36 s).
  - Pauses inside one sentence entry are capped: comma/colon pauses > 0.32 s are shortened to 0.27 s;
    the pause at an internal full stop is capped at 0.48 s.
  - Each piece has a 25 ms lead-in, ~100 ms release tail, 8 ms fade-in and 30 ms fade-out (no clicks,
    no clipped word ends).
  - When re-voicing an episode whose picture is already timed, keep the previous `narration.json`
    starts as anchors (`scripts/narration-anchors-v2.json`) so beats move < 0.5 s.
- **Spoken-form rules** (the subtitle keeps the written form; only the spoken form changes):
  1. **No full stops inside a spoken form.** Kokoro reads every "." as a sentence end (falling tone +
     pause): "11 p.m." came out "eleven P… M". Use the `PHONEMES` overrides `p.m.` → /pˌiːˈɛm/,
     `a.m.` → /ˌeɪˈɛm/, or write "eleven at night". Same for "U.S." ("the US"), "c." ("around"),
     "St." ("Saint"/"Street"), "Dr." ("Doctor"), "No." ("number").
  2. **Numbers and dates are words**, the British way: "28 June 1914" → "the twenty-eighth of June,
     nineteen fourteen"; "1 July" → "the first of July"; "2006" → "two thousand and six"; "1,400" →
     "fourteen hundred"; "306" → "three hundred and six"; "Nicholas II" → "Nicholas the Second";
     ranges "9 to 10 million" → "nine to ten million"; "700 km" → "seven hundred kilometres";
     "%" → "per cent". Years 1800–2099 are converted automatically.
  3. **No hyphens inside spoken number words or long compounds**: espeak glues "twenty-eighth",
     "forty-eight", "Austria-Hungary", "ever-larger" into one word with two primary stresses, which
     sounds stiff. `speakable()` turns these hyphens into spaces; "19-year-old" has its own phonemes.
  4. **Respell names with exact phonemes, not hyphenated spellings.** "Gav-reelo Prin-tsip",
     "Passhen-dale", "Galli-poli" gave two stresses or the wrong sounds. Put the IPA in the `PHONEMES`
     table of `tts.py` (check with `kokoro.tokenizer.phonemize(text, "en-gb")`). Current table:
     Gavrilo Princip /ɡavɹˈiːləʊ pɹˈɪntsɪp/, Gallipoli /ɡəlˈɪpəli/, Passchendaele /pˈaʃəndeɪl/,
     Compiègne /kɒmpjˈɛn/, Versailles /veəsˈaɪ/, Foch /fˈɒʃ/, Tsar /zˈɑː/, Rifleman /ɹˈaɪfəlmən/,
     Binyon /bˈɪnjən/. RESPELL (text level): Luftwaffe → "Luft-vaffa", Sudetenland →
     "Soo-dayten-land", El Alamein → "El Ala-mayn". Checked and left native: Sarajevo, Franz
     Ferdinand, Schlieffen, Verdun, Somme, Ypres, Mons, Amiens, Tannenberg, Anzacs, Ludendorff.
  5. **Quotation marks are dropped** from the spoken form (they are not spoken; Kokoro can stumble).
  6. Do not split one grammatical sentence across two script entries unless the caption needs it; if
     it is split (e.g. "…takes a wrong turn," / "and stops near…"), the group synthesis keeps it as one
     breath — never synthesise the halves separately.
  7. Before building, print every sentence's phonemes and scan for "." inside a sentence, letter
     names (/ˈeɪ/, /pˈiː/), words with 2+ primary stresses (ˈ) and quotation marks.
- **Checks after every build:** `silencedetect=noise=-45dB:d=0.35` on the narration — every hit inside
  a sentence must be an internal full stop (≤ 0.48 s); 720/600 s exact; −1.4 dBTP stem.
- **Setup in a fresh container:**
  ```
  pip install kokoro-onnx soundfile scipy
  mkdir -p /opt/tts && cd /opt/tts
  B=https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main
  curl -sSLo model.onnx $B/onnx/model.onnx && curl -sSLo bm_george.bin $B/voices/bm_george.bin
  python3 -c "import numpy as np; np.savez('voices.npz', bm_george=np.fromfile('bm_george.bin', dtype=np.float32).reshape(-1,1,256))" && mv voices.npz voices.bin
  ```
- **ElevenLabs:** a connector exists in this account but had 0 credits on 2026-11-15 (free-tier
  quota used). Switching to it later would change the channel voice — needs user approval.
- **Disclosure:** narration is synthetic (AI-generated); consider YouTube's altered/synthetic
  content disclosure when publishing.
