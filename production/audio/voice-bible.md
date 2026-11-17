# Voice bible — The Human Story narrator

- **Engine:** Kokoro-82M (open weights, Apache-2.0), run locally via `kokoro-onnx`.
- **Voice:** `bm_george` (British English male) — the channel voice for every episode.
- **Language code:** `en-gb`. Base speed 1.0; the builder may raise it to at most 1.17 to fit a
  section — if a section needs more, cut words instead.
- **Delivery target:** confident, warm, conversational; slightly dramatic for big events;
  serious and slower for tragedy (lengthen `pauseAfter` rather than changing voice).
- **Pronunciation fixes** (RESPELL table in `tts.py`): Versailles → "Vair-sigh",
  Luftwaffe → "Luft-vaffa", Sudetenland → "Soo-dayten-land", El Alamein → "El Ala-mayn".
  Years are converted to words ("nineteen thirty-nine"); write dates as "the first of September"
  in `say`.
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
