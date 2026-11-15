#!/usr/bin/env python3
"""
Narration builder for The Human Story.

Reads research/script.json, synthesises every sentence with the Kokoro-82M
neural TTS model (Apache-2.0, runs locally), lays the sentences out on the
episode timeline and writes:

  assets/audio/episode-01-narration.wav   full-length narration (48 kHz)
  public/audio/narration.wav              copy used by the Remotion render
  src/timeline/narration.json             sentence + caption timings (drives animation)
  output/episode-01-subtitles.srt         subtitles

Each section is fitted inside its time window: if the spoken text would
overrun, the speaking rate is raised slightly (capped) and pauses tightened.
"""
import hashlib, json, os, re, sys
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TTS_DIR = os.environ.get("KOKORO_DIR", "/opt/tts")
VOICE = os.environ.get("NARRATOR_VOICE", "bm_george")
BASE_SPEED = 1.0
MAX_SPEED = 1.17
SR_OUT = 48000
EPISODE_LEN = 600.0
DEFAULT_PAUSE = 0.32
CACHE = os.path.join(ROOT, "assets/audio/tts-cache")

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def two_digits(n: int) -> str:
    if n < 20:
        return ONES[n]
    t, o = divmod(n, 10)
    return TENS[t] + ("" if o == 0 else "-" + ONES[o])


def year_words(y: int) -> str:
    hi, lo = divmod(y, 100)
    if lo == 0:
        return two_digits(hi) + " hundred"
    if lo < 10:
        return two_digits(hi) + " oh " + ONES[lo]
    return two_digits(hi) + " " + two_digits(lo)


RESPELL = {
    r"\bVersailles\b": "Vair-sigh",
    r"\bLuftwaffe\b": "Luft-vaffa",
    r"\bSudetenland\b": "Soo-dayten-land",
    r"\bEl Alamein\b": "El Ala-mayn",
}


def speakable(text: str) -> str:
    for pat, rep in RESPELL.items():
        text = re.sub(pat, rep, text)
    text = re.sub(r"\b(1[89]\d\d)\b", lambda m: year_words(int(m.group(1))), text)
    return text


_kokoro = None


def kokoro():
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(os.path.join(TTS_DIR, "model.onnx"), os.path.join(TTS_DIR, "voices.bin"))
    return _kokoro


def trim(sig: np.ndarray, sr: int, thresh=0.012) -> np.ndarray:
    win = int(sr * 0.01)
    env = np.convolve(np.abs(sig), np.ones(win) / win, mode="same")
    idx = np.where(env > thresh)[0]
    if len(idx) == 0:
        return sig
    a = max(0, idx[0] - int(sr * 0.03))
    b = min(len(sig), idx[-1] + int(sr * 0.08))
    return sig[a:b]


def synth(say: str, speed: float) -> np.ndarray:
    os.makedirs(CACHE, exist_ok=True)
    key = hashlib.sha1(f"{VOICE}|{speed:.3f}|{say}".encode()).hexdigest()[:16]
    path = os.path.join(CACHE, key + ".wav")
    if os.path.exists(path):
        sig, _ = sf.read(path, dtype="float32")
        return sig
    samples, sr = kokoro().create(say, voice=VOICE, speed=speed, lang="en-gb")
    sig = trim(np.asarray(samples, dtype=np.float32), sr)
    sig = resample_poly(sig, SR_OUT, sr).astype(np.float32)
    # gentle per-sentence loudness levelling (RMS of voiced part)
    voiced = sig[np.abs(sig) > 0.02]
    rms = np.sqrt(np.mean(voiced ** 2)) if len(voiced) else 0.1
    sig *= min(3.0, 0.12 / max(rms, 1e-4))
    # 6 ms fades to avoid clicks
    f = int(SR_OUT * 0.006)
    sig[:f] *= np.linspace(0, 1, f)
    sig[-f:] *= np.linspace(1, 0, f)
    sf.write(path, sig, SR_OUT)
    return sig


def layout(section, speed, pause_scale=1.0):
    t = section["start"] + section["lead"]
    out = []
    for s in section["sentences"]:
        sig = synth(speakable(s.get("say", s["text"])), speed)
        dur = len(sig) / SR_OUT
        out.append({"text": s["text"], "start": round(t, 3), "end": round(t + dur, 3), "audio": sig})
        t += dur + s.get("pauseAfter", DEFAULT_PAUSE) * pause_scale
    return out


def caption_chunks(text: str, start: float, end: float, max_chars=84):
    """Split a sentence into caption chunks (<= 2 lines of ~42 chars)."""
    words = text.split()
    chunks, cur = [], []
    for w in words:
        trial = " ".join(cur + [w])
        if len(trial) > max_chars and cur:
            chunks.append(cur)
            cur = [w]
        else:
            cur.append(w)
    if cur:
        chunks.append(cur)
    # rebalance: avoid a tiny trailing chunk
    if len(chunks) > 1 and len(" ".join(chunks[-1])) < 18:
        tail = chunks.pop()
        if len(" ".join(chunks[-1] + tail)) <= max_chars + 14:
            chunks[-1] += tail
        else:
            chunks.append(tail)
    total = sum(len(" ".join(c)) for c in chunks)
    out, t = [], start
    for c in chunks:
        s = " ".join(c)
        d = (end - start) * len(s) / total
        out.append({"text": s, "start": round(t, 3), "end": round(t + d, 3)})
        t += d
    return out


def two_lines(s: str, width=42) -> str:
    if len(s) <= width:
        return s
    words = s.split()
    best, best_cost = s, 1e9
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        cost = max(len(a), len(b))
        if cost < best_cost:
            best, best_cost = a + "\n" + b, cost
    return best


def srt_time(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    script = json.load(open(os.path.join(ROOT, "research/script.json")))
    track = np.zeros(int(EPISODE_LEN * SR_OUT), dtype=np.float32)
    timing = {"voice": VOICE, "sections": []}
    captions = []
    for sec in script["sections"]:
        budget = sec.get("mustEndBy", sec["end"] - 1.4)
        speed, pause_scale = BASE_SPEED, 1.0
        for attempt in range(6):
            lay = layout(sec, speed, pause_scale)
            end = lay[-1]["end"]
            if end <= budget:
                break
            speech = sum(x["end"] - x["start"] for x in lay)
            over = end - budget
            if speed < MAX_SPEED:
                speed = min(MAX_SPEED, round(speed * (speech / max(1.0, speech - over)) + 0.005, 3))
            else:
                pause_scale *= 0.7
        status = "OK" if end <= budget else "OVERRUN"
        print(f"{sec['id']}: speed {speed:.3f} pauses x{pause_scale:.2f} narration {lay[0]['start']:.2f}-{end:.2f} (budget {budget}) {status}", flush=True)
        if end > budget + 0.05:
            print("  !! section overruns its window", file=sys.stderr)
        sents = []
        for x in lay:
            a = int(x["start"] * SR_OUT)
            track[a:a + len(x["audio"])] += x["audio"]
            chunks = caption_chunks(x["text"], x["start"], x["end"])
            captions += chunks
            sents.append({"text": x["text"], "start": x["start"], "end": x["end"], "captions": chunks})
        timing["sections"].append({"id": sec["id"], "chapter": sec["chapter"], "start": sec["start"],
                                   "end": sec["end"], "speed": speed, "sentences": sents})

    peak = np.max(np.abs(track))
    track *= 0.89 / peak  # about -1 dBFS peak
    for p in ["assets/audio/episode-01-narration.wav", "public/audio/narration.wav", "output/episode-01-narration.wav"]:
        full = os.path.join(ROOT, p)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        sf.write(full, track, SR_OUT, subtype="PCM_16")
    with open(os.path.join(ROOT, "src/timeline/narration.json"), "w") as f:
        json.dump(timing, f, indent=1, ensure_ascii=False)
    with open(os.path.join(ROOT, "output/episode-01-subtitles.srt"), "w") as f:
        for i, c in enumerate(captions, 1):
            f.write(f"{i}\n{srt_time(c['start'])} --> {srt_time(c['end'])}\n{two_lines(c['text'])}\n\n")
    words = sum(len(s["text"].split()) for sec in script["sections"] for s in sec["sentences"])
    print(f"wrote narration ({words} words), {len(captions)} captions")


if __name__ == "__main__":
    main()
