"""Shared DSP helpers for the procedural music score and sound effects."""
import numpy as np
from scipy.signal import butter, sosfilt, oaconvolve

SR = 48000
RNG = np.random.default_rng(1939)


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def lp(x, fc, order=2):
    sos = butter(order, min(fc, SR * 0.45) / (SR / 2), btype="low", output="sos")
    return sosfilt(sos, x, axis=0)


def hp(x, fc, order=2):
    sos = butter(order, fc / (SR / 2), btype="high", output="sos")
    return sosfilt(sos, x, axis=0)


def bp(x, lo, hi, order=2):
    sos = butter(order, [lo / (SR / 2), min(hi, SR * 0.45) / (SR / 2)], btype="band", output="sos")
    return sosfilt(sos, x, axis=0)


def noise(dur, seed=None):
    r = np.random.default_rng(seed) if seed is not None else RNG
    return r.standard_normal(int(dur * SR))


def env_adsr(n, a=0.01, d=0.1, s=0.7, r=0.2):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    s_n = max(0, n - a_n - d_n - r_n)
    e = np.concatenate([
        np.linspace(0, 1, max(1, a_n), endpoint=False),
        np.linspace(1, s, max(1, d_n), endpoint=False),
        np.full(s_n, s),
        np.linspace(s, 0, max(1, r_n)),
    ])
    if len(e) < n:
        e = np.pad(e, (0, n - len(e)))
    return e[:n]


def exp_decay(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def saw(freq, dur, harmonics=24, detune_cents=0.0, phase=0.0):
    t = t_axis(dur)
    f = freq * 2 ** (detune_cents / 1200)
    out = np.zeros_like(t)
    nmax = int(min(harmonics, (SR * 0.45) // max(f, 1)))
    for k in range(1, nmax + 1):
        out += np.sin(2 * np.pi * k * f * t + phase * k) / k
    return out * 0.6


def sine(freq, dur, phase=0.0):
    return np.sin(2 * np.pi * freq * t_axis(dur) + phase)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def pan(mono, p):
    """p in -1..1 -> stereo (equal power)."""
    a = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], axis=1)


def place(buf, sig, at):
    """Add (stereo or mono) signal into stereo buffer at time `at` seconds."""
    i = int(at * SR)
    if i >= len(buf):
        return
    if sig.ndim == 1:
        sig = np.stack([sig, sig], axis=1)
    j = min(len(buf), i + len(sig))
    if i < 0:
        sig = sig[-i:]
        i = 0
        j = min(len(buf), len(sig))
    buf[i:j] += sig[: j - i]


def reverb_ir(dur=2.6, seed=7, damp=3500):
    n = int(dur * SR)
    r = np.random.default_rng(seed)
    e = np.exp(-np.arange(n) / (dur * SR / 6.5))
    L = lp(r.standard_normal(n), damp) * e
    R = lp(r.standard_normal(n), damp) * e
    L[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    R[: int(0.017 * SR)] *= np.linspace(0, 1, int(0.017 * SR))
    ir = np.stack([L, R], axis=1)
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def reverb(stereo, mix=0.25, dur=2.6, damp=3500):
    ir = reverb_ir(dur, damp=damp)
    wet = np.stack([oaconvolve(stereo[:, 0], ir[:, 0])[: len(stereo)], oaconvolve(stereo[:, 1], ir[:, 1])[: len(stereo)]], axis=1)
    return stereo * (1 - mix) + wet * mix


def fade(sig, fin=0.01, fout=0.05):
    n = len(sig)
    a, b = int(fin * SR), int(fout * SR)
    g = np.ones(n)
    if a:
        g[:a] = np.linspace(0, 1, a)
    if b:
        g[-b:] = np.linspace(1, 0, b)
    return sig * (g[:, None] if sig.ndim == 2 else g)


def normalize(sig, peak=0.9):
    m = np.max(np.abs(sig))
    return sig * (peak / m) if m > 0 else sig
