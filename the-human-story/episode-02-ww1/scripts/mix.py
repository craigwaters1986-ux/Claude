#!/usr/bin/env python3
"""Reference mix + master for ep02-ww1: narration (720 s) + music (ducked -12 dB under speech) + SFX.

Chain: narration -> gentle compressor (2:1 above -26 dBFS, glues the level so the limiter
works less) ; music already ducked by music.py ; SFX stem from sfx.py ; sum ; master gain
solved iteratively so the programme lands at -14.0 LUFS integrated ; true-peak look-ahead
limiter at -1.5 dBTP (4x oversampled detector).

Outputs
  production/audio/ep02-ww1/episode-02-mix-reference.wav   (48 kHz, stereo, 24-bit; git-ignored)
  production/audio/ep02-ww1/episode-02-mix-reference-listen.mp3 (small listen copy, 96 kb/s)
  public/audio/mix.wav                                     (48 kHz, stereo, 16-bit; what the render should use)
  output/mix-stats.json                                    (python-side measurements)
Run after music.py and sfx.py:  python3 scripts/mix.py
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_lib import *  # noqa
import subprocess

from music import N, ENG, PROD, TAG, speech_regions, DUR, ELEVEN_SIL  # noqa

TARGET = -14.0
CEIL = -1.5


def main():
    nar, sr = sf.read(os.path.join(ENG, "public", "audio", "narration.wav"))
    assert sr == SR
    if nar.ndim == 2:
        nar = nar.mean(axis=1)
    nar = np.pad(nar, (0, N - len(nar)))[:N]
    mus = np.load(os.path.join(ENG, "output", "music-unducked.npy")).astype(np.float64)
    duck = np.load(os.path.join(ENG, "output", "music-duck.npy")).astype(np.float64)
    musd = mus * duck[:, None]
    sfx = np.load(os.path.join(ENG, "output", "sfx-stem.npy")).astype(np.float64)

    narc = compressor(nar, thr_db=-26, ratio=2.0, attack=0.006, release=0.12)
    nar_st = np.stack([narc, narc], axis=1)
    bus = nar_st + musd + sfx

    # stats: speech-only loudness of each element (blocks wholly inside speech regions)
    regs = speech_regions(pre=0.0, post=0.0, merge=0.6)
    starts = np.array([a for a, b in regs])
    ends = np.array([b for a, b in regs])

    def in_speech(t):
        k = np.searchsorted(starts, t, side="right") - 1
        return k >= 0 and t >= starts[k] and t + 0.4 <= ends[k]

    def in_gaps(t):
        k = np.searchsorted(starts, t + 0.4, side="right") - 1
        return k < 0 or t >= ends[k]

    stats = {
        "narration_speech_lufs": integrated_lufs(nar_st, in_speech),
        "music_ducked_speech_lufs": integrated_lufs(musd, in_speech),
        "sfx_speech_lufs": integrated_lufs(sfx, in_speech),
        "music_unducked_lufs": integrated_lufs(mus),
        "music_in_gaps_lufs": integrated_lufs(musd, in_gaps),
    }
    # momentary (400 ms) difference narration - music during speech: median and worst 5 %
    ts, ln_, _ = block_loudness(nar_st)
    _, lm_, _ = block_loudness(musd)
    _, ls_, _ = block_loudness(sfx)
    sel = np.array([in_speech(t) for t in ts]) & (ln_ > -40)
    diff = ln_[sel] - lm_[sel]
    diff_bg = ln_[sel] - 10 * np.log10(10 ** (lm_[sel] / 10) + 10 ** (ls_[sel] / 10))
    stats.update({
        "speech_minus_music_median_db": float(np.median(diff)),
        "speech_minus_music_p05_db": float(np.percentile(diff, 5)),
        "speech_minus_music_min_db": float(np.min(diff)),
        "speech_minus_music_plus_sfx_median_db": float(np.median(diff_bg)),
        "speech_minus_music_plus_sfx_p05_db": float(np.percentile(diff_bg, 5)),
    })
    worst = np.argsort(diff)[:8]
    stats["worst_blocks"] = [(round(float(ts[sel][i]), 1), round(float(diff[i]), 1)) for i in worst]

    # master: solve gain for -14 LUFS after limiting
    g = TARGET - integrated_lufs(bus)
    for it in range(4):
        y, gr = limiter(bus * undb(g), CEIL)
        L = integrated_lufs(y)
        if abs(L - TARGET) < 0.05:
            break
        g += TARGET - L
    stats.update({"master_gain_db": g, "mix_lufs_py": L, "mix_true_peak_py": true_peak_db(y),
                  "max_gain_reduction_db": float(-db(gr.min())),
                  "percent_time_limiting_over_1db": float(np.mean(gr < undb(-1.0)) * 100)})
    y[ns(719.9):] *= np.linspace(1, 0, N - ns(719.9))[:, None]
    # music + SFX are silent 609.5-610.5; report what is left there (narration b7 only)
    a, b = ns(ELEVEN_SIL[0]), ns(ELEVEN_SIL[1])
    stats["eleven_oclock_music_plus_sfx_peak_dbfs"] = float(db(np.abs(musd[a:b] + sfx[a:b]).max() + 1e-12))
    ref = os.path.join(PROD, f"episode-{TAG}-mix-reference.wav")
    sf.write(ref, y.astype(np.float32), SR, subtype="PCM_24")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", ref, "-c:a", "libmp3lame", "-b:a", "96k",
                    os.path.join(PROD, f"episode-{TAG}-mix-reference-listen.mp3")], check=True)
    sf.write(os.path.join(ENG, "public", "audio", "mix.wav"), y.astype(np.float32), SR, subtype="PCM_16")
    json.dump(stats, open(os.path.join(ENG, "output", "mix-stats.json"), "w"), indent=1)
    for k, v in stats.items():
        print(f"{k:42s} {v if isinstance(v, list) else round(v, 2)}")


if __name__ == "__main__":
    main()
