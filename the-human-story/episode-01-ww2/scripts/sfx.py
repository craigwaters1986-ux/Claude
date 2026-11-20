#!/usr/bin/env python3
"""Original synthesised sound effects + cue list for ep01-ww2.

All sounds are generated here from noise and oscillators (no recordings, no libraries).
Crowd / radio "voices" are formant babble built from random vowels, so no words can ever be
understood. Restraint rules: no comic SFX anywhere; no explosion at Hiroshima or Nagasaki
(white flash then total silence); only wind and candle around the Holocaust passage; nothing
crowds the last hook line (ends 22.77 s) or the title sting (22.9 s).

Outputs
  public/sfx/NNN-<shot>-<name>.wav       one file per cue (48 kHz stereo 16-bit, pan baked in,
                                         fades baked in, peak-normalised to -1 dBFS)
  src/timeline/sfx-cues.json             cue list (time, file, gain dB / linear volume, pan, shot)
  public/audio/sfx.wav                   the whole SFX stem placed on the 605 s timeline
  production/audio/ep01-ww2/episode-01-sfx.wav   same stem (24-bit)
Run:  python3 scripts/sfx.py
"""
import json
import os
import shutil
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_lib import *  # noqa
from music import T, E, HIRO_SIL, NAGA_SIL, DUR, N, ENG, PROD  # noqa

OUT_DIR = os.path.join(ENG, "public", "sfx")
CUES_JSON = os.path.join(ENG, "src", "timeline", "sfx-cues.json")


def R(seed):
    return np.random.default_rng(seed)


def env_fade(x, fi=0.3, fo=0.5):
    return fade(x, fi, fo)


def st(x, width=0.0, seed=0):
    """mono -> stereo; width>0 decorrelates with a short delay on one side."""
    if x.ndim == 2:
        return x
    if width <= 0:
        return np.stack([x, x], axis=1) * 0.7071
    d = int(0.011 * SR * width) + 1
    y = np.concatenate([np.zeros(d), x[:-d]])
    return np.stack([x * 0.75 + y * 0.25, y * 0.75 + x * 0.25], axis=1) * 0.75


def distance(x, amount=0.5, seed=1):
    """Push a sound away: lowpass + reverb wet."""
    x = lp(x, 9000 - 7000 * amount, 2)
    s = st(x, 0.5)
    return reverb(s, mix=0.25 + 0.5 * amount, dur=2.0 + 1.5 * amount, damp=4000 - 2500 * amount, seed=seed)


# ============================================================================ generators
def g_birds(dur, density=1.2, seed=1, far=0.3):
    n = ns(dur)
    out = np.zeros(n)
    r = R(seed)
    t = r.uniform(0, 0.5)
    while t < dur - 0.6:
        f0 = r.uniform(2600, 5200)
        k = r.integers(2, 7)
        for j in range(k):
            ln = r.uniform(0.04, 0.12)
            m = ns(ln)
            tt = np.arange(m) / SR
            sweep = f0 * (1 + r.uniform(-0.25, 0.3) * tt / ln)
            trill = 1 + 0.04 * np.sin(2 * np.pi * r.uniform(25, 60) * tt)
            sig = osc_sine(sweep * trill, m) * np.sin(np.pi * tt / ln) ** 2
            i = ns(t + j * (ln + r.uniform(0.02, 0.07)))
            if i + m < n:
                out[i:i + m] += sig * r.uniform(0.4, 1.0)
        t += r.exponential(1 / density) + 0.3
    return distance(out * 0.5, far, seed)


def voice_babble(dur, f0=120, seed=0, rate=4.5, sustain=False, energy=1.0):
    """One unintelligible 'voice': glottal pulses through moving vowel formants."""
    n = ns(dur)
    r = R(seed)
    # intonation contour
    contour = f0 * 2 ** ((smooth_noise(n, 1.5, seed) * 3 + smooth_noise(n, 6, seed + 1) * 0.8) / 12)
    src = blsaw(contour, n) * 0.6 + lp(noise_n(n, seed + 2), 4000) * 0.08
    vowels = [(730, 1090, 2440), (530, 1840, 2480), (270, 2290, 3010), (570, 840, 2410), (300, 870, 2240), (660, 1720, 2410)]
    bands = []
    for (f1, f2, f3) in vowels:
        b = bp(src, f1 * 0.85, f1 * 1.15, 2) + 0.6 * bp(src, f2 * 0.9, f2 * 1.1, 2) + 0.25 * bp(src, f3 * 0.92, f3 * 1.08, 2)
        bands.append(b)
    bands = np.array(bands)
    # syllables
    w = np.zeros((len(vowels), n))
    amp = np.zeros(n)
    t = r.uniform(0, 0.4)
    while t < dur:
        if sustain:
            ln = r.uniform(0.5, 1.4)
        else:
            ln = r.uniform(0.6, 1.4) / rate
        i0, i1 = ns(t), min(n, ns(t + ln))
        if i1 <= i0:
            break
        v = r.integers(len(vowels))
        x = np.linspace(0, 1, i1 - i0)
        shape = np.sin(np.pi * x) ** (0.6 if sustain else 1.2)
        w[v, i0:i1] += shape
        amp[i0:i1] = np.maximum(amp[i0:i1], shape * r.uniform(0.5, 1.0))
        t += ln
        if not sustain and r.uniform() < 0.18:      # word / phrase gap
            t += r.uniform(0.1, 0.5)
        if sustain:
            t += r.uniform(0.05, 0.4)
    ws = w / np.maximum(w.sum(axis=0), 1e-6)
    y = np.sum(bands * ws, axis=0) * amp
    cons = hp(noise_n(n, seed + 3), 3000) * np.maximum(0, np.diff(np.concatenate([[0], amp])) * SR / 30) * 0.2
    return (y + np.clip(cons, -0.3, 0.3)) * energy


def g_crowd(dur, voices=14, mood="murmur", seed=10, far=0.4):
    n = ns(dur)
    out = np.zeros((n, 2))
    r = R(seed)
    for v in range(voices):
        if mood == "cheer":
            f0 = r.uniform(170, 330)
            x = voice_babble(dur, f0, seed + v * 13, sustain=True, energy=1.0)
        elif mood == "anxious":
            x = voice_babble(dur, r.uniform(110, 230), seed + v * 13, rate=5.5)
        elif mood == "hushed":
            x = voice_babble(dur, r.uniform(100, 200), seed + v * 13, rate=3.5) * 0.6
            x = hp(x, 300)
        else:
            x = voice_babble(dur, r.uniform(95, 220), seed + v * 13, rate=r.uniform(3.8, 5.0))
        out += pan(x, r.uniform(-0.8, 0.8))
    if mood == "cheer":
        out += g_applause(dur, 30, seed + 5) * 0.5
    out = lp(out, {"murmur": 3200, "anxious": 3800, "cheer": 5000, "hushed": 2500}[mood])
    return reverb(out, mix=0.25 + 0.4 * far, dur=1.8 + far, damp=4000, seed=seed)


def g_applause(dur, people=30, seed=20, swell=None):
    n = ns(dur)
    out = np.zeros((n, 2))
    r = R(seed)
    for p in range(people):
        rate = r.uniform(3.5, 6.0)
        pp = r.uniform(-0.9, 0.9)
        t = r.uniform(0, 0.4)
        f = r.uniform(900, 2500)
        while t < dur - 0.05:
            m = ns(0.012)
            clap = bp(noise_n(m + 400, seed + p), f * 0.6, f * 2.2)[:m + 400] * exp_decay(m + 400, 0.006)
            i = ns(t)
            if i + len(clap) < n:
                out[i:i + len(clap)] += pan(clap, pp)
            t += 1 / rate * r.uniform(0.85, 1.15)
    if swell is not None:
        out *= bp_env(swell, n)[:, None]
    return reverb(out * 0.6, 0.3, 1.6, 5000, seed)


def g_wind(dur, strength=0.5, howl=0.0, seed=30, gust=None):
    n = ns(dur)
    base = pink(dur, seed)
    m = 0.55 + 0.45 * smooth_noise(n, 0.35, seed) * strength + 0.15 * smooth_noise(n, 1.3, seed + 1)
    if gust is not None:
        m *= bp_env(gust, n)
    lo = lp(base, 500) * 1.0
    hi = bp(base, 600, 2500) * 0.35 * strength
    out = (lo + hi * np.clip(m, 0, None)) * np.clip(m, 0.05, None)
    if howl > 0:
        for k, fc in enumerate([420, 610, 880]):
            x = bp(noise_n(n, seed + 10 + k), fc * 0.97, fc * 1.03, 2)
            mod = np.clip(smooth_noise(n, 0.25, seed + 20 + k), 0, None) ** 2
            out += x * mod * howl * 6
    L = out
    R_ = np.roll(lp(pink(dur, seed + 50), 1200), 500) * np.clip(m, 0.05, None) * 0.9 + out * 0.3
    s = np.stack([L, R_], axis=1)
    return hp(s, 40) * 0.5


def g_room(dur, seed=40):
    x = lp(pink(dur, seed), 350) * 0.12
    return st(x, 0.6)


def g_chalk(n_strokes=3, seed=50):
    r = R(seed)
    parts = []
    for k in range(n_strokes):
        ln = r.uniform(0.12, 0.35)
        m = ns(ln)
        grit = bp(noise_n(m, seed + k), 1800, 6500)
        fr = r.uniform(18, 40)
        stutter = 0.5 + 0.5 * np.abs(np.sin(np.pi * fr * np.arange(m) / SR))
        squeak = osc_sine(r.uniform(2500, 3400) * (1 + 0.05 * smooth_noise(m, 8, seed + k)), m) * 0.05
        e = env_adsr(m, 0.01, 0.05, 0.8, 0.05)
        parts.append((grit * stutter + squeak) * e)
        parts.append(np.zeros(ns(r.uniform(0.05, 0.15))))
    x = np.concatenate(parts)
    return reverb(st(x * 0.6), 0.15, 0.8, 6000, seed)


def g_footsteps(dur, rate=1.9, surface="hard", seed=60, people=1, far=0.2, jitter=0.03):
    n = ns(dur)
    out = np.zeros(n)
    r = R(seed)
    for p in range(people):
        ph = r.uniform(0, 1 / rate)
        rt = rate * r.uniform(0.97, 1.03)
        t = ph
        k = 0
        while t < dur - 0.2:
            m = ns(0.12)
            tt = np.arange(m) / SR
            if surface == "snow":
                crunch = bp(noise_n(ns(0.25), seed + p * 1000 + k), 600, 5000) * (R(seed + k).uniform(size=ns(0.25)) > 0.7)
                crunch = crunch * exp_decay(len(crunch), 0.09)
                sig = crunch * 0.8
            else:
                heel = lp(noise_n(m, seed + p * 1000 + k), 1800 if surface == "hard" else 900) * np.exp(-tt / 0.012)
                thump = np.sin(2 * np.pi * 90 * tt) * np.exp(-tt / 0.02) * 0.6
                toe = np.zeros(m)
                d = ns(0.05)
                toe[d:] = lp(noise_n(m - d, seed + k + 77), 2500)[: m - d] * np.exp(-tt[: m - d] / 0.008) * 0.5
                sig = heel + thump + toe
            i = ns(t + r.normal(0, jitter))
            if 0 <= i and i + len(sig) < n:
                out[i:i + len(sig)] += sig * r.uniform(0.7, 1.0)
            t += 1 / rt
            k += 1
    return distance(out * 0.5, far, seed)


def g_rain(dur, intensity=0.6, seed=70):
    n = ns(dur)
    hiss = bp(pink(dur, seed), 800, 9000) * 0.25 * intensity
    drops = np.zeros(n)
    r = R(seed)
    cnt = int(dur * 220 * intensity)
    pos = r.integers(0, n - 600, cnt)
    for i, p in enumerate(pos):
        drops[p] += r.uniform(-1, 1)
    drops = bp(drops, 1500, 8000) * 0.8
    L = hiss + drops
    R_ = np.roll(hiss, 3000) + np.roll(drops, 1777)
    return hp(np.stack([L, R_], axis=1), 200) * 0.6


def g_boom_distant(seed=80, size=1.0, far=0.8):
    """Distant artillery / explosion: a low thud with a rolling tail (never a close blast)."""
    ln = 3.5
    n = ns(ln)
    t = np.arange(n) / SR
    r = R(seed)
    body = lp(noise_n(n, seed), 160 * size) * np.exp(-t / (0.35 * size)) * 2.5
    thud = osc_sine(45 * (1 + 0.6 * np.exp(-t / 0.05)), n) * np.exp(-t / 0.25)
    roll = lp(noise_n(n, seed + 1), 300) * np.exp(-t / 1.0) * 0.5 * (1 + 0.5 * smooth_noise(n, 6, seed))
    x = (body + thud + roll) * (1 - np.exp(-t / 0.008))
    return distance(x * 0.5, far, seed)


def g_guns_distant(dur, n_shots=4, seed=90, far=0.85, fade_to_silence=False):
    out = np.zeros((ns(dur) + ns(3.5), 2))
    r = R(seed)
    times = np.sort(r.uniform(0.1, dur - 0.5, n_shots))
    for k, t in enumerate(times):
        b = g_boom_distant(seed + k, r.uniform(0.7, 1.1), far)
        g = (1 - t / dur) if fade_to_silence else r.uniform(0.6, 1.0)
        place(out, b, t, g)
    return out[: ns(dur) + ns(1.5)]


def g_rifles(dur, n_shots=10, seed=95, far=0.85):
    out = np.zeros((ns(dur) + ns(1.5), 2))
    r = R(seed)
    for k in range(n_shots):
        t = r.uniform(0, dur - 0.3)
        m = ns(0.25)
        tt = np.arange(m) / SR
        crack = bp(noise_n(m, seed + k), 500, 3500) * np.exp(-tt / 0.015) + osc_sine(150, m) * np.exp(-tt / 0.03) * 0.3
        place(out, distance(crack, far, seed + k), t, r.uniform(0.3, 1.0))
    return out


def g_pen(dur, seed=100):
    n = ns(dur)
    r = R(seed)
    x = bp(noise_n(n, seed), 2500, 9000)
    strokes = np.clip(smooth_noise(n, 9, seed), 0, None) ** 0.7
    flick = 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 7 * np.arange(n) / SR + smooth_noise(n, 2, seed) * 3))
    return reverb(st(x * strokes * flick * 0.4), 0.1, 0.6, 7000, seed)


def g_paper(kind="rustle", seed=110, dur=1.0):
    r = R(seed)
    if kind == "rustle":
        n = ns(dur)
        x = np.zeros(n)
        cnt = int(dur * 500)
        pos = r.integers(0, n - 200, cnt)
        x[pos] = r.uniform(-1, 1, cnt) * np.clip(smooth_noise(n, 6, seed)[pos] + 0.3, 0, None)
        x = bp(x, 1200, 9000) + bp(noise_n(n, seed), 2000, 7000) * 0.05 * np.clip(smooth_noise(n, 5, seed), 0, None)
        return reverb(st(x * env_swell(n, 0.1, 0.2)), 0.12, 0.6, 7000, seed)
    if kind == "tear":
        n = ns(0.45)
        x = np.zeros(n)
        cnt = 900
        pos = np.sort(r.integers(0, n - 100, cnt))
        x[pos] = r.uniform(-1, 1, cnt)
        x = bp(x, 1500, 8000) * env_adsr(n, 0.02, 0.1, 0.7, 0.15)
        return reverb(st(x), 0.15, 0.6, 7000, seed)
    if kind == "slap":
        n = ns(0.3)
        t = np.arange(n) / SR
        x = bp(noise_n(n, seed), 400, 4000) * np.exp(-t / 0.02) + lp(noise_n(n, seed + 1), 400) * np.exp(-t / 0.03)
        return reverb(st(x), 0.2, 1.0, 5000, seed)
    if kind == "flip":
        n = ns(0.5)
        t = np.arange(n) / SR
        sw = bp(noise_n(n, seed), 800, 6000) * np.sin(np.pi * np.clip(t / 0.35, 0, 1)) ** 2
        flap = bp(noise_n(n, seed + 1), 300, 3000) * np.exp(-np.clip(t - 0.33, 0, None) / 0.02) * (t > 0.33)
        return reverb(st(sw * 0.4 + flap), 0.12, 0.6, 7000, seed)
    if kind == "whoosh":
        n = ns(dur)
        t = np.arange(n) / SR
        x = noise_n(n, seed)
        lo_ = lp(x, 800)
        hi_ = bp(x, 1500, 6000)
        pos_ = np.sin(np.pi * t / dur) ** 2
        y = lo_ * pos_ * 0.7 + hi_ * pos_ ** 3
        return st(y * 0.6, 0.8)
    raise ValueError(kind)


def g_low_swell(dur=4.0, seed=120):
    n = ns(dur)
    t = np.arange(n) / SR
    x = lp(brown(dur, seed), 140) * 8 + osc_sine(41, n) * 0.25
    e = (t / dur) ** 2 * (1 - np.clip((t - dur * 0.85) / (dur * 0.15), 0, 1))
    return st(x * e, 0.5)


def g_marching(dur, bpm=112, people=12, seed=130, thin=False, far=0.5):
    x = g_footsteps(dur, rate=bpm / 60, seed=seed, people=people, far=far, jitter=0.012)
    if thin:
        x *= np.linspace(1, 0.15, len(x))[:, None]
    return x


def g_creak(dur, seed=140, wheel=True):
    n = ns(dur)
    r = R(seed)
    out = np.zeros(n)
    t = 0.2
    while t < dur - 0.6:
        ln = r.uniform(0.25, 0.6)
        m = ns(ln)
        rate = r.uniform(180, 420) * (1 + 0.3 * np.linspace(-1, 1, m) * r.uniform(-1, 1))
        pulses = blsaw(rate, m) * 0.5 + blsquare(rate * 1.01, m) * 0.2
        y = bp(pulses, 500, 2200) * np.sin(np.pi * np.linspace(0, 1, m)) ** 1.5
        out[ns(t):ns(t) + m] += y * r.uniform(0.3, 0.8)
        t += ln + r.uniform(0.6, 1.4)
    if wheel:
        out += lp(noise_n(n, seed + 1), 250) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.3 * np.arange(n) / SR)) * 0.5
    return distance(out * 0.4, 0.35, seed)


def g_ticker(dur, seed=150):
    n = ns(dur)
    r = R(seed)
    out = np.zeros(n)
    t = 0.0
    while t < dur - 0.05:
        burst = r.uniform() < 0.8
        m = ns(0.008)
        click = bp(noise_n(m + 600, seed + int(t * 1000)), 1800, 6000)[: m + 600] * exp_decay(m + 600, 0.002) \
            + osc_sine(r.uniform(2200, 3000), m + 600) * exp_decay(m + 600, 0.004) * 0.4
        i = ns(t)
        if i + len(click) < n:
            out[i:i + len(click)] += click * (1.0 if burst else 0.4)
        t += r.uniform(0.045, 0.09) if burst else r.uniform(0.2, 0.4)
    return reverb(st(out * 0.5), 0.2, 0.9, 5000, seed)


def g_clock(dur, seed=160, bpm=60):
    n = ns(dur)
    out = np.zeros(n)
    step = 60 / bpm
    k = 0
    while k * step < dur - 0.1:
        m = ns(0.06)
        tt = np.arange(m) / SR
        f = 2400 if k % 2 == 0 else 1900
        tick = bp(noise_n(m, seed + k), f * 0.7, f * 1.4) * np.exp(-tt / 0.004) + osc_sine(f * 0.5, m) * np.exp(-tt / 0.01) * 0.3
        i = ns(k * step)
        out[i:i + m] += tick
        k += 1
    return reverb(st(out * 0.6), 0.25, 1.2, 4000, seed)


def g_machinery(dur, seed=170, rate=2.2, muted=False, slowdown=False, rivet=False):
    n = ns(dur)
    t = np.arange(n) / SR
    rr = R(seed)
    r_t = rate * (np.linspace(1, 0.25, n) if slowdown else np.ones(n))
    hum_f = 55 * (np.linspace(1, 0.5, n) if slowdown else 1)
    hum = (blsaw(hum_f, n) * 0.3 + osc_sine(hum_f * 2, n) * 0.2) if not np.isscalar(hum_f) else (blsaw(hum_f, n) * 0.3 + osc_sine(hum_f * 2, n) * 0.2)
    hum = lp(hum, 400) * (np.linspace(1, 0.2, n) if slowdown else 1)
    ph = np.cumsum(r_t) / SR
    idx = np.where(np.diff(np.floor(ph)) > 0)[0]
    out = hum * 0.6
    for k, i in enumerate(idx):
        m = ns(0.18)
        tt = np.arange(m) / SR
        clank = bp(noise_n(m, seed + k), 300, 3000) * np.exp(-tt / 0.03) + osc_sine(rr.uniform(300, 700), m) * np.exp(-tt / 0.05) * 0.3
        if i + m < n:
            out[i:i + m] += clank * 0.8
    if rivet:
        tq = 0.3
        while tq < dur - 0.6:
            burst_len = rr.uniform(0.4, 0.9)
            k = 0
            while k * 0.045 < burst_len:
                m = ns(0.03)
                tt = np.arange(m) / SR
                hit = bp(noise_n(m, seed + 999 + k + int(tq * 100)), 1500, 7000) * np.exp(-tt / 0.004) \
                    + osc_sine(1800, m) * np.exp(-tt / 0.008) * 0.4
                i = ns(tq + k * 0.045)
                if i + m < n:
                    out[i:i + m] += hit * 0.7
                k += 1
            tq += burst_len + rr.uniform(0.3, 0.9)
    if muted:
        out = lp(out, 700)
    return reverb(st(out * 0.5, 0.4), 0.3, 1.6, 4000, seed)


def g_shutter(seed=180):
    ln = 1.3
    n = ns(ln)
    r = R(seed)
    out = np.zeros(n)
    for k in range(40):
        t = k * 0.025 * (1 + 0.01 * k)
        m = ns(0.05)
        tt = np.arange(m) / SR
        hit = bp(noise_n(m, seed + k), 800, 5000) * np.exp(-tt / 0.01)
        i = ns(t)
        if i + m < n:
            out[i:i + m] += hit * r.uniform(0.4, 0.8)
    end = ns(1.05)
    m = ns(0.2)
    tt = np.arange(m) / SR
    out[end:end + m] += (lp(noise_n(m, seed), 1500) * np.exp(-tt / 0.03) + osc_sine(220, m) * np.exp(-tt / 0.06)) * 1.2
    return reverb(st(out * 0.5), 0.25, 1.2, 4000, seed)


def g_click(seed=190, n_clicks=2):
    n = ns(0.6)
    out = np.zeros(n)
    for k in range(n_clicks):
        m = ns(0.03)
        tt = np.arange(m) / SR
        c = bp(noise_n(m, seed + k), 2000, 8000) * np.exp(-tt / 0.002) + osc_sine(3200 - 600 * k, m) * np.exp(-tt / 0.006) * 0.5
        i = ns(0.05 + 0.18 * k)
        out[i:i + m] += c
    return reverb(st(out * 0.6), 0.12, 0.6, 6000, seed)


def g_thud(seed=200, kind="stamp"):
    n = ns(1.0)
    t = np.arange(n) / SR
    body = osc_sine(70 * (1 + 0.4 * np.exp(-t / 0.01)), n) * np.exp(-t / 0.07)
    knock = lp(noise_n(n, seed), 1500 if kind == "stamp" else 600) * np.exp(-t / 0.015)
    x = body + knock * 0.8
    if kind == "door":
        latch = np.zeros(n)
        m = ns(0.03)
        latch[ns(0.12):ns(0.12) + m] = bp(noise_n(m, seed + 1), 2000, 7000) * exp_decay(m, 0.004)
        x = x * 1.2 + latch * 0.6
    return reverb(st(x * 0.6), 0.25 if kind == "stamp" else 0.4, 1.4, 3000, seed)


def g_crack(seed=202):
    """Wooden barrier snapping: sharp knock + short splinter crackle."""
    n = ns(0.8)
    t = np.arange(n) / SR
    r = R(seed)
    knock = bp(noise_n(n, seed), 300, 3000) * np.exp(-t / 0.012) + osc_sine(240, n) * np.exp(-t / 0.04) * 0.5
    spl = np.zeros(n)
    pos = (r.uniform(0, 0.25, 160) ** 1.5 * SR).astype(int) + ns(0.01)
    spl[pos] = r.uniform(-1, 1, 160)
    spl = bp(spl, 1200, 7000) * np.exp(-t / 0.15)
    return reverb(st(knock + spl * 0.7), 0.3, 1.2, 4000, seed)


def g_engine(dur, f=32, seed=210, rough=0.5, far=0.4, strain=False):
    """Petrol/diesel engine drone: firing-rate pulse train + mechanical noise."""
    n = ns(dur)
    ff = f * (1 + 0.04 * smooth_noise(n, 0.8, seed) + (0.25 * np.clip(smooth_noise(n, 0.6, seed + 3), 0, None) if strain else 0))
    pulses = blsquare(ff, n, width=0.2) + 0.5 * blsaw(ff * 2.01, n)
    body = lp(pulses, 380) + bp(noise_n(n, seed), 200, 1200) * rough * 0.4 * (1 + 0.5 * blsquare(ff, n, width=0.3))
    x = body * (0.8 + 0.2 * smooth_noise(n, 2, seed + 1))
    return distance(x * 0.4, far, seed)


def g_tank(dur, seed=220, far=0.35):
    eng = g_engine(dur, 26, seed, rough=0.8, far=far)
    n = ns(dur)
    out = np.zeros(n)
    r = R(seed)
    rate = 7.5
    k = 0
    while k / rate < dur - 0.1:
        m = ns(0.05)
        tt = np.arange(m) / SR
        clank = bp(noise_n(m, seed + k), 700, 4000) * np.exp(-tt / 0.008) + osc_sine(r.uniform(900, 1300), m) * np.exp(-tt / 0.012) * 0.3
        i = ns(k / rate + r.normal(0, 0.006))
        if 0 <= i and i + m < n:
            out[i:i + m] += clank * r.uniform(0.3, 0.7)
        k += 1
    squeal = bp(blsaw(1100 * (1 + 0.05 * smooth_noise(n, 1.5, seed)), n), 900, 2500) * np.clip(smooth_noise(n, 0.7, seed + 9), 0, None) ** 3 * 0.08
    return eng + distance(out * 0.35 + squeal, far, seed + 1)


def g_aircraft(dur, seed=230, f=88, far=0.6, passby=None, engines=2, fighter=False):
    """Propeller aircraft drone; passby=(t_closest, width) adds a Doppler pass and swell."""
    n = ns(dur)
    t = np.arange(n) / SR
    r = R(seed)
    if passby:
        tc, w = passby
        x = (t - tc) / w
        dop = 1 + 0.06 * (-x / np.sqrt(1 + x * x))
        level = 1 / (1 + x * x) ** 0.8
    else:
        dop = np.ones(n)
        level = 0.8 + 0.2 * smooth_noise(n, 0.4, seed)
    out = np.zeros(n)
    for e in range(engines):
        fe = f * (1 + r.uniform(-0.012, 0.012)) * dop
        tone = blsaw(fe, n) * 0.5 + blsquare(fe * 0.5, n, width=0.3) * 0.3
        out += lp(tone, 1800 if fighter else 900)
    out += bp(noise_n(n, seed), 300, 3000) * 0.3
    out *= level
    if passby:
        out = out * (0.6 + 0.4 * level)
    return distance(out * 0.25, far, seed)


def g_dive(dur=2.0, seed=240):
    n = ns(dur)
    t = np.arange(n) / SR
    f = 820 * (1 - 0.32 * (t / dur) ** 1.3)
    x = lp(blsaw(f, n), 2500) * 0.4 + bp(noise_n(n, seed), 600, 3000) * 0.3
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return distance(x * e * 0.4, 0.55, seed)


def g_radio(dur, seed=250, voice=True, crackle=1.0):
    n = ns(dur)
    r = R(seed)
    static = bp(noise_n(n, seed), 400, 5000) * 0.08 * (0.7 + 0.3 * smooth_noise(n, 3, seed))
    cr = np.zeros(n)
    cnt = int(dur * 25 * crackle)
    pos = r.integers(0, n - 100, cnt)
    cr[pos] = r.uniform(-1, 1, cnt) * r.uniform(0.2, 1, cnt) ** 3
    cr = bp(cr, 1000, 7000) * 1.5
    x = static + cr
    if voice:
        v = voice_babble(dur, 115, seed + 3, rate=4.2)
        v = bp(v, 350, 2800)
        v = v * (0.6 + 0.4 * np.clip(smooth_noise(n, 0.5, seed + 1), -1, 1))   # fading reception
        x += lp(v, 1800) * 0.6 + 0.02 * osc_sine(60, n)  # muffled so nothing is intelligible
    return reverb(st(x * 0.6), 0.1, 0.6, 5000, seed)


def g_whistle(seed=260, ln=1.6):
    n = ns(ln)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for f in [554, 698, 831]:
        fr = f * (1 + 0.01 * np.clip(t / 0.15, 0, 1) - 0.01)
        out += osc_sine(fr, n) + 0.3 * osc_sine(fr * 2, n)
    out = out / 3 + bp(noise_n(n, seed), 600, 4000) * 0.4
    e = env_adsr(n, 0.06, 0.2, 0.8, 0.4)
    return distance(out * e * 0.3, 0.6, seed)


def g_steam(seed=270, ln=1.4):
    n = ns(ln)
    x = hp(noise_n(n, seed), 2500) * env_adsr(n, 0.02, 0.3, 0.5, 0.8)
    return distance(x * 0.3, 0.4, seed)


def g_crow(seed=280):
    out = np.zeros(ns(2.2))
    r = R(seed)
    for k in range(2):
        m = ns(0.32)
        tt = np.arange(m) / SR
        f = 520 * (1 - 0.15 * tt / 0.32)
        src = blsaw(f, m) + noise_n(m, seed + k) * 0.4
        y = bp(src, 900, 1900) * np.sin(np.pi * tt / 0.32) ** 0.6
        i = ns(0.1 + k * 0.6)
        out[i:i + m] += y
    return distance(out * 0.4, 0.75, seed)


def g_surf(dur, seed=290, gentle=False):
    n = ns(dur)
    t = np.arange(n) / SR
    r = R(seed)
    base = pink(dur, seed)
    period = r.uniform(5.5, 7.5)
    wave = (0.5 + 0.5 * np.sin(2 * np.pi * t / period - 1.5)) ** 3
    wash = lp(base, 1200) * (0.3 + wave) + bp(base, 2000, 8000) * wave ** 2 * 0.6
    if gentle:
        wash = lp(wash, 1500) * 0.6
    L = wash
    R_ = np.roll(wash, ns(0.4)) * 0.9 + lp(pink(dur, seed + 1), 800) * 0.15
    return hp(np.stack([L, R_], axis=1), 60) * 0.35


def g_gulls(seed=300, calls=3):
    out = np.zeros(ns(3.5))
    r = R(seed)
    for k in range(calls):
        ln = r.uniform(0.25, 0.45)
        m = ns(ln)
        tt = np.arange(m) / SR
        f = r.uniform(1200, 1600) * (1 + 0.35 * np.sin(np.pi * tt / ln)) * (1 - 0.2 * tt / ln)
        y = blsaw(f, m) * 0.3 + osc_sine(f, m)
        y = bp(y, 900, 4000) * np.sin(np.pi * tt / ln) ** 0.8
        i = ns(0.1 + k * r.uniform(0.45, 0.9))
        if i + m < len(out):
            out[i:i + m] += y
    return distance(out * 0.35, 0.7, seed)


def g_siren(dur, seed=310, far=0.85):
    n = ns(dur)
    t = np.arange(n) / SR
    f = 260 + 300 * (0.5 - 0.5 * np.cos(2 * np.pi * t / 4.0))
    x = blsaw(f, n) * 0.4 + blsquare(f * 1.003, n) * 0.2
    x = lp(x, 1500) * env_swell(n, 1.0, 1.0)
    return distance(x * 0.35, far, seed)


def g_klaxon(dur, seed=320, far=0.7):
    n = ns(dur)
    t = np.arange(n) / SR
    gate = (np.sin(2 * np.pi * t / 1.0) > -0.2).astype(float)
    gate = np.convolve(gate, np.ones(ns(0.02)) / ns(0.02), mode="same")
    x = blsquare(392, n, width=0.4) * 0.5 + blsaw(588, n) * 0.2
    x = bp(x, 300, 2500) * gate
    return distance(x * 0.3, far, seed)


def g_fire(dur, seed=330):
    n = ns(dur)
    r = R(seed)
    roar = lp(brown(dur, seed), 500) * 3 * (0.7 + 0.3 * smooth_noise(n, 1.0, seed))
    cr = np.zeros(n)
    cnt = int(dur * 30)
    pos = r.integers(0, n - 300, cnt)
    cr[pos] = r.uniform(-1, 1, cnt) * r.uniform(0.2, 1, cnt) ** 2
    cr = bp(cr, 800, 6000) * 2
    return reverb(st(roar + cr, 0.6) * 0.4, 0.2, 1.2, 4000, seed)


def g_water(dur, seed=340):
    n = ns(dur)
    r = R(seed)
    out = lp(pink(dur, seed), 600) * 0.3 * (0.6 + 0.4 * np.sin(2 * np.pi * np.arange(n) / SR / 2.7))
    t = 0.1
    while t < dur - 0.3:
        m = ns(r.uniform(0.04, 0.12))
        tt = np.arange(m) / SR
        f = r.uniform(400, 1100) * (1 + 1.5 * tt / tt[-1])
        bub = osc_sine(f, m) * np.sin(np.pi * tt / tt[-1]) * 0.25
        splash = bp(noise_n(m, seed + int(t * 100)), 500, 3000) * np.exp(-tt / 0.03) * 0.4
        i = ns(t)
        out[i:i + m] += bub + splash
        t += r.uniform(0.3, 1.0)
    return reverb(st(out * 0.6, 0.6), 0.25, 1.5, 4000, seed)


def g_crickets(dur, seed=350):
    n = ns(dur)
    out = np.zeros((n, 2))
    r = R(seed)
    for c in range(4):
        f = r.uniform(4200, 5200)
        rate = r.uniform(1.5, 2.6)
        t = np.arange(n) / SR
        chirp_gate = (np.sin(2 * np.pi * rate * t + r.uniform(0, 6)) > 0.75).astype(float)
        pulse = (np.sin(2 * np.pi * 30 * t) > 0).astype(float)
        g = np.convolve(chirp_gate * pulse, np.ones(48) / 48, mode="same")
        out += pan(osc_sine(f, n) * g * 0.2, r.uniform(-0.8, 0.8))
    return reverb(out, 0.35, 1.8, 6000, seed)


def g_bells(dur, seed=360, single=False, far=0.6):
    out = np.zeros(ns(dur) + ns(5))
    r = R(seed)
    notes = [nm(x) for x in ["E4", "D4", "C4", "B3", "A3", "G3"]]
    if single:
        out[: ns(6)] += bell_tone(midi(nm("G3")), 0.8, decay=5.0, seed=seed)[: ns(6)]
    else:
        k = 0
        t = 0.0
        while t < dur - 0.4:
            m = notes[k % len(notes)]
            b = bell_tone(midi(m), r.uniform(0.6, 0.9), decay=3.0, seed=seed + k)
            place_m = ns(t)
            j = min(len(out), place_m + len(b))
            out[place_m:j] += b[: j - place_m]
            t += 0.42
            k += 1
    return distance(out[: ns(dur) + ns(3)] * 0.5, far, seed)


def g_cicadas(dur, seed=370):
    n = ns(dur)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    r = R(seed)
    for c in range(3):
        carrier = bp(noise_n(n, seed + c), 4500, 7500)
        am = 0.5 + 0.5 * np.sin(2 * np.pi * r.uniform(60, 110) * t)
        sw = np.clip(0.4 + 0.6 * smooth_noise(n, 0.3, seed + c), 0, 1)
        out += pan(carrier * am * sw * 0.15, r.uniform(-0.7, 0.7))
    return reverb(out, 0.3, 1.5, 7000, seed)


def g_candle(dur, seed=380):
    n = ns(dur)
    x = lp(pink(dur, seed), 300) * (0.6 + 0.4 * np.clip(smooth_noise(n, 4, seed), 0, None)) * 0.3
    return st(x, 0.3)


def g_broom(dur, seed=390):
    n = ns(dur)
    t = np.arange(n) / SR
    strokes = np.clip(np.sin(2 * np.pi * 0.9 * t), 0, None) ** 2
    x = bp(noise_n(n, seed), 2000, 9000) * strokes * 0.4
    return distance(x, 0.35, seed)


def g_bricks(seed=400, n_hits=3):
    out = np.zeros(ns(1.5))
    r = R(seed)
    for k in range(n_hits):
        m = ns(0.12)
        tt = np.arange(m) / SR
        h = bp(noise_n(m, seed + k), 500, 2500) * np.exp(-tt / 0.02) + osc_sine(r.uniform(500, 800), m) * np.exp(-tt / 0.03) * 0.4
        i = ns(0.05 + k * r.uniform(0.18, 0.35))
        out[i:i + m] += h * r.uniform(0.5, 1)
    return distance(out * 0.5, 0.35, seed)


def g_flak(dur, seed=410, n_pops=6):
    out = np.zeros((ns(dur) + ns(2.0), 2))
    r = R(seed)
    for k in range(n_pops):
        m = ns(0.3)
        tt = np.arange(m) / SR
        p = lp(noise_n(m, seed + k), 900) * np.exp(-tt / 0.04) + osc_sine(80, m) * np.exp(-tt / 0.05) * 0.5
        place(out, distance(p, 0.85, seed + k), r.uniform(0, dur - 0.3), r.uniform(0.4, 1))
    return out


# ============================================================================ cue table
# (time s, name, generator(), gain dB relative to the narration stem at unity, pan, shot, fade_in, fade_out)
def cue_table():
    C = []

    def add(t, name, sig, gain, p, shot, fi=0.05, fo=0.3, dur=None):
        C.append(dict(t=round(t, 3), name=name, sig=sig, gain=gain, pan=p, shot=shot, fi=fi, fo=fo, dur=dur))

    # ---- s01 hook (no SFX after 21.6 so the last line and the title sting are clear)
    add(0.0, "birdsong", g_birds(7.4, 1.6, 1, 0.35), -30, 0.2, "S01-01", 0.6, 1.5)
    add(0.0, "street-murmur", g_crowd(7.4, 10, "murmur", 11, 0.6), -34, -0.1, "S01-01", 0.6, 1.2)
    add(3.55, "bicycle-bell", st(lp(bell_tone(2100, 0.6, 0.8, 5) + np.concatenate([np.zeros(ns(0.22)), bell_tone(2100, 0.5, 0.8, 6)])[: ns(1.2)], 6000)), -34, 0.5, "S01-01", 0.0, 0.2)
    add(4.4, "paper-rustle", g_paper("rustle", 111, 1.2), -32, 0.2, "S01-02", 0.05, 0.3)
    add(6.4, "paper-rustle", g_paper("rustle", 112, 0.8), -34, 0.2, "S01-02", 0.05, 0.3)
    add(7.0, "paper-whoosh", g_paper("whoosh", 113, 0.9), -28, 0.0, "S01-03", 0.0, 0.2)
    add(9.4, "low-swell", g_low_swell(4.1, 120), -26, 0.0, "S01-03", 0.3, 0.4)
    add(16.8, "wind-soft", g_wind(2.4, 0.3, 0.0, 31), -33, 0.0, "S01-04", 0.6, 0.7)
    add(19.75, "room-tone", g_room(3.0, 41), -40, 0.0, "S01-05", 0.3, 0.5)
    add(19.8, "chalk", g_chalk(2, 51), -36, -0.2, "S01-05", 0.0, 0.05)
    add(20.5, "chalk", g_chalk(2, 52), -38, -0.2, "S01-05", 0.0, 0.05)
    add(21.4, "chalk", g_chalk(2, 53), -40, -0.2, "S01-05", 0.0, 0.05)

    # ---- s02
    add(30.3, "footsteps", g_footsteps(3.2, 1.8, "hard", 61), -34, -0.3, "S02-01", 0.1, 0.4)
    add(33.7, "chalk", g_chalk(3, 54), -36, -0.2, "S02-01", 0.0, 0.05)
    add(T("s02", 1) - 0.1, "rain", g_rain(6.3, 0.6, 71), -32, 0.0, "S02-02", 0.6, 0.8)
    add(T("s02", 1) + 0.2, "distant-guns", g_guns_distant(4.0, 3, 91, 0.9, fade_to_silence=True), -27, 0.0, "S02-02", 0.1, 1.0)
    add(T("s02", 2), "hall-murmur", g_crowd(6.8, 12, "murmur", 12, 0.7), -36, 0.0, "S02-03", 0.5, 0.6)
    add(T("s02", 2) + 2.0, "pen-scratch", g_pen(1.6, 101), -34, 0.2, "S02-03", 0.05, 0.2)
    add(T("s02", 2) + 4.3, "pen-scratch", g_pen(1.2, 102), -35, 0.2, "S02-03", 0.05, 0.2)
    for k, tt in enumerate([49.5, 51.0, 52.5, 54.0]):
        add(tt, "paper-tear", g_paper("tear", 114 + k), -36, (k - 1.5) * 0.25, "S02-04", 0.0, 0.1)
    add(54.3, "marching-boots-thinning", g_marching(5.1, 108, 10, 131, thin=True, far=0.55), -32, -0.2, "S02-05", 0.4, 0.6)
    add(55.6, "cart-creak", g_creak(3.8, 141), -34, 0.35, "S02-05", 0.4, 0.6)
    add(T("s02", 4), "wind", g_wind(7.6, 0.45, 0.0, 32), -33, 0.0, "S02-06", 0.6, 0.6)
    add(T("s02", 4) + 0.6, "muttering", g_crowd(6.6, 6, "hushed", 13, 0.5), -38, 0.0, "S02-06", 0.5, 0.6)
    add(T("s02", 6) + 0.05, "ticker-clatter", g_ticker(4.6, 151), -34, 0.3, "S02-07", 0.1, 0.5)
    add(T("s02", 6) + 0.3, "anxious-crowd", g_crowd(4.8, 14, "anxious", 14, 0.5), -35, -0.2, "S02-07", 0.4, 0.6)
    add(T("s02", 7), "rain", g_rain(4.6, 0.45, 72), -34, 0.0, "S02-08", 0.5, 0.5)
    add(T("s02", 7) + 0.1, "shuffling-feet", g_footsteps(4.4, 1.1, "soft", 62, people=5, far=0.4, jitter=0.12), -35, -0.1, "S02-08", 0.3, 0.5)
    add(T("s02", 8) + 0.4, "chalk", g_chalk(3, 55), -37, -0.2, "S02-09", 0.0, 0.05)
    add(T("s02", 9) + 0.4, "chalk", g_chalk(2, 56), -38, -0.2, "S02-09", 0.0, 0.05)
    add(85.5, "wind-low", g_wind(5.0, 0.3, 0.0, 33), -34, 0.0, "S02-09", 1.0, 1.0)

    # ---- s03
    add(90.2, "rally-murmur", g_crowd(5.3, 18, "murmur", 15, 0.7), -34, 0.0, "S03-01", 0.6, 0.5)
    add(T("s03", 1), "crowd", g_crowd(9.0, 14, "murmur", 16, 0.8), -38, 0.0, "S03-02", 0.5, 0.6)
    for k, tt in enumerate([96.0, 98.6, 101.2]):
        add(tt, "paper-slap", g_paper("slap", 120 + k), -31, (k - 1) * 0.4, "S03-02", 0.0, 0.1)
    add(T("s03", 2), "clock-tick", g_clock(4.2, 161), -32, 0.3, "S03-03", 0.2, 0.4)
    add(T("s03", 3) + 0.1, "press-winding-down", g_machinery(2.8, 171, 3.0, slowdown=True), -32, 0.0, "S03-04", 0.1, 0.5)
    add(T("s03", 3) + 3.1, "shutter", g_shutter(181), -32, 0.2, "S03-04", 0.0, 0.2)
    add(T("s03", 3) + 4.9, "padlock-click", g_click(191, 2), -32, 0.2, "S03-04", 0.0, 0.1)
    add(T("s03", 5), "wind-left", g_wind(4.9, 0.4, 0.0, 34), -33, -0.6, "S03-06", 0.5, 0.5)
    add(T("s03", 5) + 1.8, "machinery-muted-right", g_machinery(3.0, 172, 2.0, muted=True), -33, 0.6, "S03-06", 0.5, 0.5)
    add(T("s03", 8), "pens-murmur", g_crowd(3.6, 6, "hushed", 17, 0.6), -38, 0.0, "S03-08", 0.4, 0.5)
    add(T("s03", 8) + 0.8, "pen-scratch", g_pen(1.4, 103), -35, 0.2, "S03-08", 0.05, 0.2)
    add(137.0, "cheers", g_crowd(3.4, 16, "cheer", 18, 0.6), -33, 0.0, "S03-09", 0.4, 0.8)
    add(139.9, "wind-gust", g_wind(1.25, 0.8, 0.0, 35, gust=[(0, 0.3), (0.6, 1.0), (1.25, 0.2)]), -30, 0.0, "S03-09", 0.2, 0.25)
    add(T("s03", 10) + 0.12, "stamp-thud", g_thud(201, "stamp"), -27, 0.0, "S03-10", 0.0, 0.3)

    # ---- s04
    add(150.4, "clock-tick-faint", g_clock(5.2, 162), -37, 0.3, "S04-01", 0.4, 0.4)
    add(T("s04", 1) + 1.8, "pen-scratch", g_pen(1.6, 104), -34, 0.0, "S04-02", 0.05, 0.2)
    add(T("s04", 2) + 0.15, "page-flip", g_paper("flip", 125), -32, 0.1, "S04-03", 0.0, 0.1)
    add(T("s04", 3), "truck-engines", g_engine(5.6, 30, 211, 0.6, 0.45), -31, -0.2, "S04-04", 0.5, 0.6)
    add(T("s04", 3) + 0.45, "barrier-crack", g_crack(202), -33, 0.2, "S04-04", 0.0, 0.1)
    add(T("s04", 4) + 0.3, "dive-whine-restrained", g_dive(2.0, 241), -36, 0.3, "S04-05", 0.3, 0.4)
    add(T("s04", 4) + 1.9, "explosions-distant", g_guns_distant(3.6, 3, 92, 0.85), -29, -0.1, "S04-05", 0.0, 0.6)
    add(T("s04", 4) + 0.2, "rifle-fire-distant", g_rifles(5.0, 9, 96, 0.85), -32, 0.2, "S04-05", 0.1, 0.5)
    add(T("s04", 5), "radio-murmur", g_radio(4.0, 251, True, 0.6), -34, 0.1, "S04-06", 0.2, 0.4)
    add(T("s04", 5), "clock-tick", g_clock(4.1, 163), -36, -0.3, "S04-06", 0.2, 0.3)
    add(T("s04", 6) + 0.15, "train-whistle", g_whistle(261), -32, 0.3, "S04-07", 0.05, 0.4)
    add(T("s04", 6) + 0.8, "steam-hiss", g_steam(271), -34, 0.2, "S04-07", 0.05, 0.5)
    add(T("s04", 6), "platform-chatter", g_crowd(3.3, 12, "murmur", 19, 0.6), -35, -0.1, "S04-07", 0.3, 0.5)
    add(T("s04", 9) + 1.2, "distant-guns", g_guns_distant(9.0, 4, 93, 0.95), -30, 0.0, "S04-09", 0.0, 1.0)

    # ---- s05
    add(210.0, "wind-eerie", g_wind(4.5, 0.4, 0.1, 36), -32, 0.0, "S05-01", 0.8, 0.6)
    add(211.5, "crow", g_crow(281), -33, -0.5, "S05-01", 0.0, 0.2)
    add(T("s05", 3), "tank-engines-tracks", g_tank(5.3, 221, 0.35), -29, 0.0, "S05-03", 0.4, 1.4)
    add(T("s05", 4), "surf", g_surf(8.6, 291), -31, 0.0, "S05-04", 0.6, 0.8)
    add(T("s05", 4) + 1.3, "gulls", g_gulls(301, 3), -34, 0.4, "S05-04", 0.0, 0.3)
    add(T("s05", 4) + 1.5, "aircraft-distant", g_aircraft(6.0, 231, 92, 0.85, passby=(3.0, 2.0)), -33, -0.3, "S05-04", 0.5, 0.6)
    add(T("s05", 4) + 3.0, "guns-distant", g_guns_distant(4.0, 2, 94, 0.95), -32, 0.0, "S05-04", 0.0, 0.8)
    add(T("s05", 5), "marching-boots", g_marching(2.4, 112, 14, 132, far=0.55), -32, 0.0, "S05-05", 0.2, 0.4)
    add(T("s05", 6), "room-tone", g_room(5.1, 42), -38, 0.0, "S05-06", 0.3, 0.4)
    add(T("s05", 7), "engine-start", g_engine(2.0, 22, 212, 0.9, 0.3, strain=True), -33, -0.2, "S05-07", 0.3, 0.6)
    add(T("s05", 7) + 1.3, "aircraft-pass", g_aircraft(3.8, 232, 120, 0.45, passby=(1.6, 0.9), fighter=True), -30, 0.2, "S05-07", 0.3, 0.6)
    add(T("s05", 7) + 2.6, "gun-bursts-distant", g_rifles(1.8, 8, 97, 0.9), -33, 0.1, "S05-07", 0.0, 0.3)
    add(T("s05", 8), "air-raid-siren-distant", g_siren(4.0, 311), -33, -0.2, "S05-08", 0.6, 0.8)
    add(T("s05", 8) + 0.1, "bomber-drone", g_aircraft(3.6, 233, 70, 0.8, engines=4), -33, 0.2, "S05-08", 0.6, 0.6)
    add(T("s05", 8) + 1.5, "crumps-distant", g_guns_distant(2.4, 2, 95, 0.95), -31, 0.0, "S05-08", 0.0, 0.6)
    add(255.6, "muffled-thuds", g_guns_distant(3.0, 2, 98, 0.98), -33, 0.0, "S05-09", 0.0, 0.6)
    add(255.5, "hushed-voices", g_crowd(3.8, 5, "hushed", 20, 0.7), -38, 0.0, "S05-09", 0.4, 0.5)
    add(T("s05", 9), "birds-return", g_birds(10.2, 1.0, 2, 0.4), -31, 0.2, "S05-10", 1.0, 1.0)
    add(261.4, "bricks", g_bricks(401), -32, -0.3, "S05-10", 0.0, 0.2)
    add(263.4, "bricks", g_bricks(402, 2), -33, -0.3, "S05-10", 0.0, 0.2)
    add(262.5, "broom", g_broom(6.0, 391), -34, 0.35, "S05-10", 0.5, 0.8)
    add(266.2, "bricks", g_bricks(403, 3), -34, -0.3, "S05-10", 0.0, 0.2)

    # ---- s06
    add(270.3, "tank-engines-rumble", g_tank(9.0, 222, 0.55), -31, 0.0, "S06-01", 0.8, 1.0)
    add(271.4, "artillery-distant", g_guns_distant(7.5, 4, 99, 0.9), -30, 0.0, "S06-01", 0.0, 1.0)
    add(T("s06", 2), "wind", g_wind(5.7, 0.5, 0.0, 37), -33, 0.0, "S06-03", 0.5, 0.5)
    add(T("s06", 2) + 0.5, "cart-wheels", g_creak(4.8, 142), -34, 0.3, "S06-03", 0.4, 0.6)
    add(T("s06", 2) + 1.8, "guns-distant", g_guns_distant(3.5, 2, 100, 0.95), -32, 0.0, "S06-03", 0.0, 0.6)
    add(T("s06", 3), "howling-wind", g_wind(6.2, 0.9, 0.5, 38), -30, 0.0, "S06-04", 0.5, 0.6)
    add(T("s06", 3) + 0.9, "straining-engines", g_engine(4.2, 24, 213, 0.9, 0.5, strain=True), -33, -0.2, "S06-04", 0.5, 0.6)
    add(T("s06", 5), "aircraft-engines", g_aircraft(4.2, 234, 105, 0.6, engines=3), -32, 0.2, "S06-06", 0.4, 0.5)
    add(T("s06", 5) + 0.4, "alarm-klaxon-distant", g_klaxon(3.2, 321), -36, -0.4, "S06-06", 0.2, 0.5)
    add(T("s06", 5) + 1.6, "explosions-muffled", g_guns_distant(3.0, 3, 101, 0.95), -31, 0.0, "S06-06", 0.0, 0.6)
    add(307.2, "fire-crackle", g_fire(4.4, 331), -34, 0.0, "S06-07", 0.4, 0.6)
    add(307.2, "engines-distant", g_aircraft(3.6, 235, 100, 0.9, engines=2), -36, -0.3, "S06-07", 0.3, 0.8)
    add(311.5, "water-lapping", g_water(4.1, 341), -32, 0.0, "S06-08", 0.6, 0.6)
    add(T("s06", 7) + 0.15, "applause-swell", g_applause(3.6, 40, 21, swell=[(0, 0.0), (1.0, 1.0), (2.6, 0.8), (3.6, 0.0)]), -33, 0.0, "S06-09", 0.0, 0.3)
    add(T("s06", 7) + 4.0, "paper-rustle", g_paper("rustle", 127, 0.9), -35, 0.2, "S06-09", 0.05, 0.3)

    # ---- s07
    add(T("s07", 0) - 0.2, "chalk", g_chalk(3, 57), -37, -0.2, "S07-01", 0.0, 0.05)
    add(339.5, "dive-whine-restrained", g_dive(1.8, 242), -36, 0.3, "S07-03", 0.3, 0.4)
    add(339.8, "engine-roar", g_aircraft(2.8, 236, 115, 0.6, passby=(1.2, 0.8), fighter=True), -32, -0.2, "S07-03", 0.3, 0.5)
    add(341.7, "blast-distant", g_boom_distant(102, 1.0, 0.9), -31, 0.1, "S07-03", 0.0, 0.8)
    add(T("s07", 2), "artillery-rumble", g_guns_distant(7.6, 5, 103, 0.95), -31, 0.0, "S07-04", 0.3, 0.8)
    add(T("s07", 2), "desert-wind", g_wind(7.7, 0.4, 0.0, 39), -34, 0.0, "S07-04", 0.6, 0.6)
    add(T("s07", 2) + 1.5, "tank-engines", g_tank(6.0, 223, 0.5), -34, 0.2, "S07-04", 0.5, 0.6)
    add(T("s07", 3), "winter-wind", g_wind(7.4, 0.6, 0.3, 40), -32, 0.0, "S07-05", 0.5, 0.5)
    add(T("s07", 3) + 1.0, "gunfire-distant", g_guns_distant(5.5, 3, 104, 0.95), -32, 0.0, "S07-05", 0.0, 0.6)
    add(T("s07", 4), "wind", g_wind(7.0, 0.5, 0.2, 41), -34, 0.0, "S07-06", 0.5, 0.6)
    add(T("s07", 4) + 0.3, "snow-footsteps", g_footsteps(5.8, 1.3, "snow", 63, people=4, far=0.4, jitter=0.15), -33, -0.1, "S07-06", 0.5, 0.6)
    add(T("s07", 5) + 0.2, "chalk", g_chalk(2, 58), -37, -0.2, "S07-07", 0.0, 0.05)
    add(T("s07", 6) + 0.1, "riveting-machinery", g_machinery(11.4, 173, 2.2, rivet=True), -33, 0.0, "S07-08", 0.4, 1.2)
    add(379.6, "aircraft-fleet-drone", g_aircraft(10.2, 237, 82, 0.75, engines=6), -32, 0.0, "S07-09", 2.5, 1.0)

    # ---- s08
    add(390.2, "planning-room-murmur", g_crowd(5.9, 8, "hushed", 21, 0.5), -38, 0.0, "S08-01", 0.4, 0.5)
    add(T("s08", 1), "aircraft-drone-night", g_aircraft(3.8, 238, 80, 0.7, engines=6), -32, 0.0, "S08-02", 0.4, 0.5)
    add(T("s08", 1) + 0.7, "flak-pops-distant", g_flak(3.0, 411, 5), -33, 0.0, "S08-02", 0.0, 0.5)
    add(T("s08", 2), "sea", g_surf(13.7, 292, gentle=True), -32, 0.0, "S08-03", 0.6, 1.0)
    add(T("s08", 2) + 0.1, "landing-craft-engines", g_engine(6.5, 34, 214, 0.5, 0.55), -34, -0.2, "S08-03", 0.5, 1.0)
    add(T("s08", 2) + 1.5, "naval-guns-distant", g_guns_distant(4.5, 3, 105, 0.95), -31, 0.2, "S08-03", 0.0, 1.0)
    add(T("s08", 3), "surf", g_surf(4.6, 293), -33, 0.0, "S08-05", 0.3, 1.0)
    add(T("s08", 3) + 0.6, "gunfire-restrained", g_guns_distant(2.6, 2, 106, 0.97), -34, 0.0, "S08-05", 0.0, 0.6)
    add(418.0, "night-crickets", g_crickets(9.5, 351), -36, 0.0, "S08-05/06", 1.0, 0.6)
    add(T("s08", 4) + 0.5, "running-footsteps", g_footsteps(1.8, 3.2, "soft", 64, people=3, far=0.4), -35, 0.2, "S08-06", 0.1, 0.3)
    add(T("s08", 4) + 3.7, "distant-boom", g_boom_distant(107, 0.8, 0.9), -32, 0.3, "S08-06", 0.0, 0.8)
    add(T("s08", 5) + 0.1, "church-bells", g_bells(3.9, 361, far=0.6), -33, 0.2, "S08-07", 0.1, 0.8)
    add(T("s08", 5) + 0.3, "cheering", g_crowd(3.6, 18, "cheer", 22, 0.6), -34, -0.1, "S08-07", 0.4, 0.6)
    add(T("s08", 7), "clock-ticking", g_clock(5.4, 164), -33, 0.2, "S08-09", 0.3, 0.4)
    add(442.6, "wind", g_wind(7.4, 0.5, 0.15, 42), -32, 0.0, "S08-10", 0.8, 1.0)
    add(443.2, "distant-drone", g_aircraft(5.8, 239, 70, 0.95, engines=4), -36, 0.0, "S08-10", 1.5, 1.5)

    # ---- s09 (Holocaust passage: wind and candle only, no hits)
    add(T("s09", 1) - 0.3, "wind-only", g_wind(11.8, 0.35, 0.0, 43), -33, 0.0, "S09-02/03", 1.0, 1.2)
    add(T("s09", 3) + 0.4, "candle-flicker", g_candle(9.0, 381), -40, 0.0, "S09-04", 1.0, 0.8)
    add(T("s09", 4), "candle-flicker", g_candle(8.4, 382), -40, 0.0, "S09-05", 0.8, 0.6)
    add(T("s09", 5) + 0.1, "guns-engines-distant", g_guns_distant(3.6, 3, 108, 0.9), -30, 0.0, "S09-06", 0.0, 0.6)
    add(T("s09", 5), "engines", g_tank(3.7, 224, 0.6), -34, -0.2, "S09-06", 0.4, 0.5)
    add(T("s09", 6) + 0.3, "shelling-muffled", g_guns_distant(4.4, 3, 109, 0.98), -31, 0.0, "S09-07", 0.0, 0.6)
    add(T("s09", 6) + 4.7, "door-thud", g_thud(203, "door"), -30, 0.0, "S09-07", 0.0, 0.4)
    add(T("s09", 7) + 0.5, "pen-scratch", g_pen(1.7, 105), -33, 0.0, "S09-08", 0.05, 0.2)
    add(500.7, "cheering", g_crowd(6.6, 22, "cheer", 23, 0.6), -32, 0.0, "S09-09/10", 0.4, 2.2)
    add(500.9, "church-bells", g_bells(4.2, 362, far=0.6), -33, 0.2, "S09-09", 0.1, 0.8)
    add(T("s09", 8) + 0.8, "single-bell", g_bells(4.0, 363, single=True, far=0.75), -31, 0.1, "S09-10", 0.0, 1.0)

    # ---- s10 (Hiroshima / Nagasaki: no explosion sound; everything cuts at the flash)
    add(T("s10", 1), "rain", g_rain(7.2, 0.7, 73), -32, 0.0, "S10-02", 0.5, 0.6)
    add(T("s10", 1) + 1.4, "guns-distant", g_guns_distant(5.0, 3, 110, 0.95), -31, 0.0, "S10-02", 0.0, 0.6)
    add(T("s10", 2), "clock", g_clock(3.6, 165), -32, 0.2, "S10-03", 0.2, 0.3)
    hiro_len = HIRO_SIL[0] - T("s10", 3)
    add(T("s10", 3), "cicadas-birds", g_cicadas(hiro_len, 371) * 0.8 + g_birds(hiro_len, 0.7, 3, 0.6)[: ns(hiro_len)] * 0.5, -34, 0.0, "S10-04", 0.8, 0.025)
    add(T("s10", 3) + 0.6, "high-engine-drone", g_aircraft(hiro_len - 0.6, 240, 95, 0.97, engines=4), -36, 0.3, "S10-04", 1.0, 0.025)
    add(HIRO_SIL[1], "faint-wind", g_wind(E("s10", 4) - HIRO_SIL[1] + 0.3, 0.25, 0.0, 44), -36, 0.0, "S10-05", 1.5, 0.6)
    add(T("s10", 6), "faint-wind", g_wind(NAGA_SIL[0] - T("s10", 6), 0.25, 0.0, 45), -38, 0.0, "S10-07", 0.6, 0.35)
    add(NAGA_SIL[1], "wind", g_wind(T("s10", 7) - NAGA_SIL[1] + 0.4, 0.3, 0.0, 46), -35, 0.0, "S10-07", 0.3, 0.4)
    add(T("s10", 7), "radio-crackle", g_radio(4.4, 252, True, 1.5), -34, 0.0, "S10-08", 0.3, 0.4)
    add(555.9, "sea-wind", g_wind(5.3, 0.35, 0.0, 47) + g_surf(5.3, 294, gentle=True) * 0.6, -33, 0.0, "S10-09", 0.4, 0.6)
    add(557.4, "pen-scratch", g_pen(1.4, 106), -34, 0.0, "S10-09", 0.05, 0.2)
    add(557.8, "aircraft-overhead", g_aircraft(3.6, 241, 85, 0.75, passby=(1.8, 1.2), engines=6), -33, 0.0, "S10-09", 0.4, 0.6)
    add(T("s10", 8) + 0.3, "chalk", g_chalk(3, 59), -37, -0.2, "S10-10", 0.0, 0.05)
    add(T("s10", 8) + 3.3, "chalk", g_chalk(2, 60), -38, -0.2, "S10-10", 0.0, 0.05)

    # ---- s11
    add(570.0, "wind-birds", g_wind(6.3, 0.3, 0.0, 48) + g_birds(6.3, 0.6, 4, 0.7)[: ns(6.3)], -34, 0.0, "S11-01", 1.0, 1.0)
    add(T("s11", 4) + 0.2, "chalk", g_chalk(2, 61), -38, -0.2, "S11-05", 0.0, 0.05)
    add(595.0, "sunrise-birds", g_birds(9.6, 1.2, 5, 0.45), -33, 0.2, "S11-06", 1.0, 3.5)
    return C


# ============================================================================ build
def main():
    if os.path.isdir(OUT_DIR):
        shutil.rmtree(OUT_DIR)
    os.makedirs(OUT_DIR)
    stem = np.zeros((N, 2))
    cues = []
    table = sorted(cue_table(), key=lambda c: c["t"])
    for i, c in enumerate(table, 1):
        x = c["sig"]
        if x.ndim == 1:
            x = pan(x, c["pan"])
        else:
            # balance a stereo file towards the pan position (equal-power)
            a = (c["pan"] + 1) * np.pi / 4
            x = np.stack([x[:, 0] * np.cos(a) * 1.4142, x[:, 1] * np.sin(a) * 1.4142], axis=1) if c["pan"] != 0 else x
        if c["dur"]:
            x = x[: ns(c["dur"])]
        # trim trailing near-silence, bake fades, peak normalise to -1 dBFS
        mag = np.max(np.abs(x), axis=1)
        nz = np.where(mag > 1e-4 * mag.max())[0]
        x = x[: nz[-1] + 1] if len(nz) else x
        x = fade(x, c["fi"], c["fo"])
        x = normalize(x, undb(-1.0))
        fname = f"{i:03d}-{c['shot'].replace('/', '-')}-{c['name']}.wav"
        sf.write(os.path.join(OUT_DIR, fname), x.astype(np.float32), SR, subtype="PCM_16")
        g = undb(c["gain"])
        place(stem, x, c["t"], g)
        cues.append({
            "id": i, "time": c["t"], "frame": int(round(c["t"] * 30)), "file": "sfx/" + fname,
            "duration": round(len(x) / SR, 3), "gainDb": c["gain"], "volume": round(g, 5),
            "pan": c["pan"], "panBaked": True, "shot": c["shot"], "name": c["name"],
        })
    # hard rules: total silence windows (Hiroshima, Nagasaki, Holocaust edges, "It didn't work.")
    for a, b, fo in [(HIRO_SIL[0], HIRO_SIL[1], 0.025), (NAGA_SIL[0], NAGA_SIL[1], 0.3),
                     (E("s09", 4), T("s09", 5), 0.5), (E("s03", 8) + 0.05, T("s03", 10) - 0.05, 0.1)]:
        i0, i1 = ns(a), ns(b)
        k = ns(fo)
        stem[i0 - k:i0] *= np.linspace(1, 0, k)[:, None]
        stem[i0:i1] = 0
    stem[ns(604.8):] = 0
    meta = {
        "episode": "ep01-ww2", "fps": 30, "sampleRate": SR, "durationSec": DUR,
        "note": ("Times are absolute seconds on the 605 s timeline (derived from narration.json). "
                 "Each file already has its fades and pan baked in; play it whole at `time` with "
                 "<Audio volume={volume}>. Gains are relative to public/audio/narration.wav at volume 1. "
                 "public/audio/sfx.wav is this whole list pre-placed (preferred)."),
        "silenceWindows": [
            {"what": "Hiroshima white flash: total silence (music + SFX). Flash frame = start.", "start": HIRO_SIL[0], "end": HIRO_SIL[1], "startFrame": int(round(HIRO_SIL[0] * 30))},
            {"what": "Nagasaki glow: total silence (music + SFX), then wind.", "start": NAGA_SIL[0], "end": NAGA_SIL[1], "startFrame": int(round(NAGA_SIL[0] * 30))},
            {"what": "'It didn't work.' music + SFX out", "start": round(E("s03", 8) + 0.05, 2), "end": round(T("s03", 10) - 0.05, 2)},
            {"what": "Holocaust: 0.5 s before the sustained note", "start": round(E("s09", 2) + 0.02, 2), "end": round(T("s09", 3) + 0.02, 2)},
            {"what": "Holocaust: 0.7 s held silence after the victims list", "start": E("s09", 4), "end": T("s09", 5)},
            {"what": "Pearl Harbor S06-08: music out (water lapping only)", "start": 311.45, "end": 313.0},
        ],
        "cues": cues,
    }
    json.dump(meta, open(CUES_JSON, "w"), indent=1)
    sf.write(os.path.join(ENG, "public", "audio", "sfx.wav"), stem.astype(np.float32), SR, subtype="PCM_16")
    sf.write(os.path.join(PROD, "episode-01-sfx.wav"), stem.astype(np.float32), SR, subtype="PCM_24")
    np.save(os.path.join(ENG, "output", "sfx-stem.npy"), stem.astype(np.float32))
    print(f"{len(cues)} SFX cues, {len(set(c['name'] for c in cues))} distinct sounds; stem peak {db(np.abs(stem).max()):.1f} dBFS")


if __name__ == "__main__":
    main()
