#!/usr/bin/env python3
"""
Narration builder for The Human Story.

Reads research/script.json, synthesises every sentence with the Kokoro-82M
neural TTS model (Apache-2.0, runs locally), lays the sentences out on the
episode timeline and writes:

  assets/audio/episode-NN-narration.wav   full-length narration (48 kHz)
  output/episode-NN-narration.wav         same file (deliverable copy)
  public/audio/narration.wav              copy used by the Remotion render
  src/timeline/narration.json             sentence + caption timings (drives animation)
  output/episode-NN-subtitles.srt         subtitles

NN = EPISODE_TAG (env, default "02"); episode length comes from script.json
"duration" (fallback 600 s).

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
BASE_SPEED = 0.96  # v3: groups are read ~5 % faster than single sentences; 0.96 restores the v2 pace
MAX_SPEED = 1.05   # v3: keep the delivery natural; tighten pauses before speeding up
SR_OUT = 48000
EPISODE_TAG = os.environ.get("EPISODE_TAG", "02")
EPISODE_LEN = 600.0  # overridden by script.json "duration"
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
    r"\bLuftwaffe\b": "Luft-vaffa",
    r"\bSudetenland\b": "Soo-dayten-land",
    r"\bEl Alamein\b": "El Ala-mayn",
    r"\bEep-ruh\b": "Ypres",        # native /ˈiːpɹə/ beats /ˈiːpɹˈʌ/
    # Hyphenated compounds: espeak glues them into one word with two or three
    # primary stresses ("twˈɛntiˈeɪtθ", "ˈɒstɹiəhˈʌŋɡəɹi"), which Kokoro reads
    # stiffly. A plain space gives normal word stress (v3, 2026-11-17).
    r"\bAustria-Hungary": "Austria Hungary",
    r"\bAustro-Hungarian\b": "Austro Hungarian",
    r"\bever-larger\b": "ever larger",
    r"\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)-(one|two|three|four|five|six|seven|eight|nine|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)\b": r"\1 \2",
    # Quotation marks are not spoken; Kokoro can stumble on them.
    r'["“”]': "",
}

# Exact phonemes (espeak/Kokoro IPA) for words espeak gets wrong or that a
# hyphenated respelling made stiff (two primary stresses). Applied to the
# spoken text AFTER RESPELL; the rest of the sentence is phonemised normally.
# Rule: never put full stops inside a spoken form ("p.m.", "a.m.", "U.S.",
# "c.") - Kokoro reads each "." as a sentence end (falling tone + pause).
PHONEMES = {
    r"\bp\.\s?m\.": "pˌiːˈɛm",                    # was pˈiː.ˈɛm. (pause between P and M)
    r"\ba\.\s?m\.": "ˌeɪˈɛm",
    r"\b(?:Gav-reelo Prin-tsip|Gavrilo Princip)\b": "ɡavɹˈiːləʊ pɹˈɪntsɪp",
    r"\b(?:Galli-poli|Gallipoli)\b": "ɡəlˈɪpəli",  # British /ɡəˈlɪpəli/
    r"\b(?:Passhen-dale|Passchendaele)\b": "pˈaʃəndeɪl",  # was "pass-HEN-dale"
    r"\b(?:Komp-yen|Kom-pyen|Compi[eè]gne)\b": "kɒmpjˈɛn",
    r"\b(?:Vair-sigh|Versailles)\b": "veəsˈaɪ",   # ep01 "Vair-sigh", one stress
    r"\bnineteen-year-old\b": "nˈaɪntiːn jɪəɹˌəʊld",
    r"\bRifleman\b": "ɹˈaɪfəlmən",                 # espeak: ɹˈaɪflɛmən
    r"\bTsar\b": "zˈɑː",                            # British /zɑː/
    r"\bBinyon\b": "bˈɪnjən",
    r"\bFoch\b|\bFosh\b": "fˈɒʃ",
}
_PH_RE = re.compile("|".join(f"(?:{k})" for k in PHONEMES))


def speakable(text: str) -> str:
    for pat, rep in RESPELL.items():
        text = re.sub(pat, rep, text)
    text = re.sub(r"\b(1[89]\d\d|20\d\d)\b", lambda m: year_words(int(m.group(1))), text)
    text = text.strip()
    return text[:1].upper() + text[1:]


PLACEHOLDER = "Quoggle"     # nonce word: espeak gives /kwˈɒɡəl/, found and swapped for the IPA
_PLACE_RE = re.compile(r"kw[ˈˌ]?ɒɡəl")


def phonemes(text: str) -> str:
    """Spoken text -> Kokoro phoneme string, with PHONEMES overrides spliced in.
    The whole sentence is phonemised in one go (a placeholder stands in for each
    override), so espeak keeps its sentence context ("a" stays /ɐ/, not /eɪ/)."""
    text = speakable(text)
    ipas = []

    def sub(m):
        ipas.append(next(v for k, v in PHONEMES.items() if re.fullmatch(k, m.group(0))))
        return PLACEHOLDER
    ph = kokoro().tokenizer.phonemize(_PH_RE.sub(sub, text), "en-gb")
    found = _PLACE_RE.findall(ph)
    assert len(found) == len(ipas), (text, ph)
    for ipa in ipas:
        ph = _PLACE_RE.sub(ipa, ph, count=1)
    return ph


_kokoro = None


def kokoro():
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(os.path.join(TTS_DIR, "model.onnx"), os.path.join(TTS_DIR, "voices.bin"))
    return _kokoro


# ----------------------------------------------------------------------------- audio helpers
FR = int(SR_OUT * 0.01)          # 10 ms analysis frames
QUIET_DB = -40.0                 # frame counts as pause if this far below the loudest frame


def frame_rms(sig):
    n = len(sig) // FR
    return np.sqrt(np.mean(sig[:n * FR].reshape(n, FR) ** 2, axis=1) + 1e-12)


def quiet_runs(sig, ref=None):
    """[(start_frame, length_frames)] of quiet runs."""
    r = frame_rms(sig)
    ref = ref if ref is not None else r.max()
    q = r < ref * 10 ** (QUIET_DB / 20)
    runs, i = [], 0
    while i < len(q):
        if q[i]:
            j = i
            while j < len(q) and q[j]:
                j += 1
            runs.append((i, j - i))
            i = j
        else:
            i += 1
    return runs


def speech_bounds(sig, ref):
    r = frame_rms(sig)
    idx = np.where(r >= ref * 10 ** (QUIET_DB / 20))[0]
    if len(idx) == 0:
        return 0, len(sig)
    return idx[0] * FR, min(len(sig), (idx[-1] + 1) * FR)


def fade(sig, fin=0.008, fout=0.03):
    sig = sig.copy()
    a, b = int(SR_OUT * fin), int(SR_OUT * fout)
    a, b = min(a, len(sig) // 4), min(b, len(sig) // 4)
    if a:
        sig[:a] *= np.linspace(0, 1, a)
    if b:
        sig[-b:] *= np.linspace(1, 0, b) ** 2
    return sig


GAP_DB = -34.0   # stricter than QUIET_DB: matches ffmpeg silencedetect -45 dBFS on the final track


def tighten_gaps(sig, ref, n_stops, max_gap=0.32, target=0.27, stop_cap=0.48):
    """Shorten over-long pauses INSIDE one sentence (Kokoro sometimes leaves
    0.4-0.7 s at a colon or comma). The n_stops longest runs are internal
    sentence ends ('. ') and may be up to stop_cap. Returns (sig, list of fixes)."""
    runs = [(a, n) for a, n in quiet_runs(sig, ref * 10 ** ((GAP_DB - QUIET_DB) / 20))
            if a > 0 and a + n < len(sig) // FR]
    longest = sorted(runs, key=lambda x: -x[1])[:n_stops]
    fixes, cuts = [], []
    for a, n in runs:
        cap, tgt = (stop_cap, stop_cap - 0.05) if (a, n) in longest else (max_gap, target)
        if n * 0.01 > cap:
            remove = int((n * 0.01 - tgt) * SR_OUT)
            mid = (a + n // 2) * FR
            cuts.append((mid - remove // 2, mid - remove // 2 + remove))
            fixes.append((round(a * 0.01, 2), round(n * 0.01, 2), round(tgt, 2)))
    for c0, c1 in reversed(cuts):
        x = int(SR_OUT * 0.005)
        head, tail = sig[:c0], sig[c1:]
        if len(head) > x and len(tail) > x:
            xf = head[-x:] * np.linspace(1, 0, x) + tail[:x] * np.linspace(0, 1, x)
            sig = np.concatenate([head[:-x], xf, tail[x:]])
    return sig, fixes


def synth_ph(ph: str, speed: float) -> np.ndarray:
    """Kokoro on a phoneme string -> 48 kHz float32 (cached)."""
    os.makedirs(CACHE, exist_ok=True)
    key = hashlib.sha1(f"v3|{VOICE}|{speed:.3f}|{ph}".encode()).hexdigest()[:16]
    path = os.path.join(CACHE, key + ".wav")
    if os.path.exists(path):
        sig, _ = sf.read(path, dtype="float32")
        return sig
    samples, sr = kokoro().create(ph, voice=VOICE, speed=speed, lang="en-gb", is_phonemes=True)
    sig = resample_poly(np.asarray(samples, dtype=np.float32), SR_OUT, sr).astype(np.float32)
    sf.write(path, sig, SR_OUT)
    return sig


# ----------------------------------------------------------------------------- grouping
GROUP_MAX_PH = 330      # phonemes per synthesis group (Kokoro context is 510)
GROUP_MAX_N = 3         # sentences per group
GROUP_BREAK = 0.5       # an authored pauseAfter >= this ends a group (dramatic beat)
DEFAULT_PAUSE = 0.36    # between groups when the script gives no pauseAfter
MIN_GAP = 0.14          # never closer than this between two sentence entries


# Beats the music/SFX are cut to: start a new group here and sit exactly on the
# v2 time (no stretch limit). s10.b7 "At 11 o'clock" (1.0 s silence at 609.5),
# s11.b10 "On 28 June 1919" (comes in after the bugle, 684.7-685.7).
HARD_ANCHORS = {"s10": [7], "s11": [10]}


# Music/SFX hard limits on a section's last word (v3): s02 must be clear of the
# domino clacks that start at 100.45 (v2 ended at 100.37).
SECTION_END_BY = {"s02": 100.40}


def groups_for(section):
    """Consecutive sentences synthesised in ONE Kokoro pass, so intonation
    carries across sentence joins instead of resetting every sentence."""
    out, cur, n = [], [], 0
    hard = HARD_ANCHORS.get(section["id"], [])
    for i, s in enumerate(section["sentences"]):
        ph = phonemes(s.get("say", s["text"]))
        if cur and (n + len(ph) > GROUP_MAX_PH or len(cur) >= GROUP_MAX_N or i in hard):
            out.append(cur)
            cur, n = [], 0
        cur.append((i, ph))
        n += len(ph) + 1
        if s.get("pauseAfter", 0) >= GROUP_BREAK:
            out.append(cur)
            cur, n = [], 0
    if cur:
        out.append(cur)
    return out


def split_group(audio, items, speed):
    """Cut a group's audio at the sentence joins. Each join is looked for near
    where the per-sentence durations predict it; the cut goes in the middle of
    the longest pause there. Returns [(piece, natural_gap_after)] or None."""
    ref = frame_rms(audio).max()
    solo = [len(synth_ph(ph, speed)) for _, ph in items]   # duration predictor
    scale = len(audio) / sum(solo)
    runs = quiet_runs(audio, ref)
    cuts, acc = [], 0
    for k in range(len(items) - 1):
        acc += solo[k] * scale
        est = acc / FR
        win = max(60, 0.25 * solo[k] * scale / FR)
        cand = [(a, n) for a, n in runs if abs(a + n / 2 - est) <= win and a > 0]
        if not cand:
            return None
        a, n = max(cand, key=lambda x: (x[1], -abs(x[0] + x[1] / 2 - est)))
        if n < 3:          # < 30 ms: the model ran through the join
            return None
        cuts.append(((a + n // 2) * FR, (a, n)))
    edges = [0] + [c for c, _ in cuts] + [len(audio)]
    pieces = []
    for k in range(len(items)):
        seg = audio[edges[k]:edges[k + 1]]
        a, b = speech_bounds(seg, ref)
        pieces.append((edges[k] + a, edges[k] + b))
    # sanity: each piece within 70-140 % of its solo duration
    for (a, b), d in zip(pieces, solo):
        if not 0.6 < (b - a) / d < 1.45:
            return None
    out = []
    for k, (a, b) in enumerate(pieces):
        a0 = max(0, a - int(0.025 * SR_OUT))
        b1 = min(len(audio), b + int(0.10 * SR_OUT))
        if k + 1 < len(pieces):
            b1 = min(b1, pieces[k + 1][0] - int(0.03 * SR_OUT))
            gap = (pieces[k + 1][0] - b) / SR_OUT
        else:
            gap = None
        out.append((audio[a0:b1], gap, (b - a0) / SR_OUT, (b1 - b) / SR_OUT))
    return out


def level(sig):
    voiced = sig[np.abs(sig) > 0.02]
    rms = np.sqrt(np.mean(voiced ** 2)) if len(voiced) else 0.1
    return sig * min(3.0, 0.12 / max(rms, 1e-4))


REPORT = {"gapFixes": {}, "fallbacks": {}, "groups": {}}


def build_section(section, speed):
    """-> list of dicts: audio, natural gap after (None = group end), text."""
    sents = section["sentences"]
    res = [None] * len(sents)
    sid = section["id"]
    REPORT["gapFixes"][sid], REPORT["fallbacks"][sid] = [], []
    REPORT["groups"][sid] = [[i for i, _ in g] for g in groups_for(section)]
    for g in groups_for(section):
        ph = " ".join(p for _, p in g)
        audio = level(synth_ph(ph, speed))
        parts = split_group(audio, g, speed) if len(g) > 1 else None
        if parts is None:
            if len(g) > 1:
                REPORT["fallbacks"][sid].append(f"{sid}.{g[0][0]}-{g[-1][0]}")
            parts = []
            for i, p in g:
                a = level(synth_ph(p, speed))
                ref = frame_rms(a).max()
                s0, s1 = speech_bounds(a, ref)
                a0, b1 = max(0, s0 - int(0.025 * SR_OUT)), min(len(a), s1 + int(0.10 * SR_OUT))
                parts.append((a[a0:b1], None, None, None))
            parts = [(x[0], None if k == len(g) - 1 else -1.0, None, None) for k, x in enumerate(parts)]
        for (i, _), (piece, gap, _, _) in zip(g, parts):
            # internal sentence ends, counted on the PHONEMES (so "a.m." is not one)
            stops = len(re.findall(r"[.!?]\s+\S", phonemes(sents[i].get("say", sents[i]["text"]))))
            ref = frame_rms(piece).max()
            piece, fixes = tighten_gaps(piece, ref, stops)
            if fixes:
                REPORT["gapFixes"][sid].append((i, fixes))
            res[i] = {"audio": fade(piece), "gap": gap, "text": sents[i]["text"],
                      "pauseAfter": sents[i].get("pauseAfter"), "groupStart": i == g[0][0]}
    return res


ANCHORS = {}
_anc = os.path.join(ROOT, "scripts", "narration-anchors-v2.json")
if os.path.exists(_anc):
    ANCHORS = json.load(open(_anc))["starts"]
MAX_STRETCH = 0.6       # a group may wait at most this long for its v2 start time
IN_GROUP_STRETCH = 0.25 # a sentence inside a group may wait this long (natural gap + <= 0.25 s)


def layout(section, built, pause_scale=1.0, anchored=True):
    t = section["start"] + section["lead"]
    anc = ANCHORS.get(section["id"]) if anchored else None
    out = []
    for k, x in enumerate(built):
        if anc and x["groupStart"] and k > 0 and len(anc) == len(built):
            if k in HARD_ANCHORS.get(section["id"], []):
                t = max(t, anc[k])
            else:
                t = max(t, min(anc[k], t + MAX_STRETCH))
        elif anc and k > 0 and len(anc) == len(built):   # inside a group: a little give
            t = max(t, min(anc[k], t + IN_GROUP_STRETCH))
        dur = len(x["audio"]) / SR_OUT
        out.append({"text": x["text"], "start": round(t, 3), "end": round(t + dur, 3), "audio": x["audio"]})
        # the piece already carries ~0.10 s of its own release tail
        # pieces carry 0.10 s of release tail and 0.025 s of lead-in
        if x["gap"] is not None and x["gap"] >= 0:          # inside a group: keep the model's own pause
            gap = max(x["gap"], x["pauseAfter"] or 0) - 0.125
        else:                                                 # between groups
            gap = (x["pauseAfter"] if x["pauseAfter"] is not None else DEFAULT_PAUSE)
        t += dur + max(MIN_GAP - 0.125, gap * pause_scale)
    return out


LINE_WIDTH = 42


def fits_two_lines(words, width=LINE_WIDTH) -> bool:
    s = " ".join(words)
    if len(s) <= width:
        return True
    return any(max(len(" ".join(words[:i])), len(" ".join(words[i:]))) <= width
               for i in range(1, len(words)))


def caption_chunks(text: str, start: float, end: float, width=LINE_WIDTH):
    """Split a sentence into caption chunks that are GUARANTEED to fit in
    <= 2 lines of <= `width` chars. Uses the fewest chunks possible, with the
    words spread so chunk lengths are balanced (no tiny trailing chunk)."""
    words = text.split()
    n = len(words)
    best = None
    for k in range(max(1, -(-len(text) // (2 * width))), n + 1):
        # DP: minimise the longest chunk over partitions into k fitting chunks
        INF = float("inf")
        cost = [[INF] * (n + 1) for _ in range(k + 1)]
        cut = [[0] * (n + 1) for _ in range(k + 1)]
        cost[0][0] = 0
        for j in range(1, k + 1):
            for e in range(1, n + 1):
                for b in range(j - 1, e):
                    if cost[j - 1][b] == INF or not fits_two_lines(words[b:e], width):
                        continue
                    c = max(cost[j - 1][b], len(" ".join(words[b:e])))
                    if c < cost[j][e]:
                        cost[j][e], cut[j][e] = c, b
        if cost[k][n] < INF:
            chunks, e = [], n
            for j in range(k, 0, -1):
                b = cut[j][e]
                chunks.insert(0, words[b:e])
                e = b
            best = chunks
            break
    chunks = best or [[w] for w in words]
    total = sum(len(" ".join(c)) for c in chunks)
    out, t = [], start
    for c in chunks:
        s = " ".join(c)
        d = (end - start) * len(s) / total
        out.append({"text": s, "start": round(t, 3), "end": round(t + d, 3)})
        t += d
    return out


def two_lines(s: str, width=LINE_WIDTH) -> str:
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
    global EPISODE_LEN
    script = json.load(open(os.path.join(ROOT, "research/script.json")))
    EPISODE_LEN = float(script.get("duration", EPISODE_LEN))
    track = np.zeros(int(EPISODE_LEN * SR_OUT), dtype=np.float32)
    timing = {"voice": VOICE, "sections": []}
    captions = []
    for sec in script["sections"]:
        budget = sec.get("mustEndBy", sec["end"] - 1.4)
        budget = min(budget, SECTION_END_BY.get(sec["id"], budget))
        # v3 fitting plan: stay anchored to the v2 beat times; if the section is
        # long, first read it a touch less slowly (0.96 -> 1.00), then tighten
        # pauses, and only as a last resort drop the anchors / speed up to 1.05.
        plan = [(sp, 1.0, True) for sp in (BASE_SPEED, 0.97, 0.98, 0.99, 1.0)] + \
               [(1.0, 0.92, True), (1.0, 0.85, True), (1.02, 0.85, True), (1.04, 0.85, True),
                (1.0, 0.85, False),
                (1.02, 0.85, False), (MAX_SPEED, 0.8, False), (MAX_SPEED, 0.7, False)]
        built, built_speed = None, None
        for attempt, (speed, pause_scale, anch) in enumerate(plan):
            if built_speed != speed:
                built, built_speed = build_section(sec, speed), speed
            lay = layout(sec, built, pause_scale, anchored=anch)
            end = lay[-1]["end"]
            if attempt == 0:
                t0 = lay[0]["start"]
                fit = round((end - t0) / (budget - t0), 3)  # >1 = needs a faster read
            if end <= budget:
                break
        status = "OK" if end <= budget else "OVERRUN"
        print(f"{sec['id']}: fit@1.0 {fit:.3f} speed {speed:.3f} pauses x{pause_scale:.2f} narration {lay[0]['start']:.2f}-{end:.2f} (budget {budget}) {status}", flush=True)
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
                                   "end": sec["end"], "speed": speed, "fitAt1": fit,
                                   "pauseScale": round(pause_scale, 3), "anchored": anch, "budget": budget,
                                   "sentences": sents})

    peak = np.max(np.abs(track))
    # 0.85 = -1.41 dBFS sample peak: leaves headroom so TRUE peak stays <= -1 dBTP
    # (0.89 measured -0.98 dBTP on ep01 v3 -- inter-sample overs)
    track *= 0.85 / peak
    for p in [f"assets/audio/episode-{EPISODE_TAG}-narration.wav", "public/audio/narration.wav", f"output/episode-{EPISODE_TAG}-narration.wav"]:
        full = os.path.join(ROOT, p)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        sf.write(full, track, SR_OUT, subtype="PCM_16")
    with open(os.path.join(ROOT, "src/timeline/narration.json"), "w") as f:
        json.dump(timing, f, indent=1, ensure_ascii=False)
    with open(os.path.join(ROOT, f"output/episode-{EPISODE_TAG}-subtitles.srt"), "w") as f:
        for i, c in enumerate(captions, 1):
            f.write(f"{i}\n{srt_time(c['start'])} --> {srt_time(c['end'])}\n{two_lines(c['text'])}\n\n")
    with open(os.path.join(ROOT, "output/tts-v3-report.json"), "w") as f:
        json.dump(REPORT, f, indent=1)
    print("internal-gap fixes:", {k: v for k, v in REPORT["gapFixes"].items() if v})
    print("group fallbacks (synthesised per sentence):", {k: v for k, v in REPORT["fallbacks"].items() if v})
    words = sum(len(s["text"].split()) for sec in script["sections"] for s in sec["sentences"])
    print(f"wrote narration ({words} words), {len(captions)} captions")


if __name__ == "__main__":
    main()
