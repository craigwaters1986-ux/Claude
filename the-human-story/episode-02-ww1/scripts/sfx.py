#!/usr/bin/env python3
"""Original synthesised sound effects + cue list for ep02-ww1 (asset request AU-01).

All sounds are generated here from noise and oscillators (no recordings, no sample libraries).
Crowd / voice sounds are formant babble built from random vowels, so no words can ever be
understood. Restraint rules (storyboard 1.6 / AU-01): no close explosions, no impact or
bullet-hit sounds anywhere; the two pistol reports are short, dry and distant (no echo FX);
artillery is only ever a far-off rumble or crump; nothing comic near death, the Armenian
Genocide, the Somme or remembrance; total silence (music + SFX) 609.50-610.50 at 11 o'clock.

Outputs
  public/sfx/NNN-<shot>-<name>.wav       one file per cue (48 kHz stereo 16-bit, pan baked in,
                                         fades baked in, peak-normalised to -1 dBFS; git-ignored)
  src/timeline/sfx-cues.json             cue list (time, frame, file, gain dB / linear volume, shot)
                                         + silenceWindows + syncPoints (picture sync)
  public/audio/sfx.wav                   the whole SFX stem placed on the 720 s timeline
  production/audio/ep02-ww1/episode-02-sfx.wav   same stem (24-bit; git-ignored)
Run (after music.py):  python3 scripts/sfx.py
"""
import json
import os
import shutil
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_lib import *  # noqa
from music import (T, E, DUR, N, ENG, PROD, EP, TAG, ELEVEN_SIL, SHOTS_1914, SHOTS_S03, WHISTLE_XMAS,  # noqa
                   WHISTLES_SOMME, DOMINO_CLACKS, CHALK_DOMINOES, SARAJEVO_GLOW, TITLE_STING, BUGLE, HUM_START,
                   EXCLUSIVE)


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


# ============================================================================ ep02 generators
def S2(x):
    """mono or stereo -> stereo"""
    return x if x.ndim == 2 else st(x)


def mixs(*sigs):
    """sum mono/stereo signals of different lengths (stereo out)."""
    sigs = [S2(s) for s in sigs]
    n = max(len(s) for s in sigs)
    out = np.zeros((n, 2))
    for s in sigs:
        out[: len(s)] += s
    return out


def g_pistol(seed=500):
    """Short, dry, distant pistol report: no echo FX, no impact."""
    n = ns(0.3)
    t = np.arange(n) / SR
    crack = bp(noise_n(n, seed), 500, 4500) * np.exp(-t / 0.005)
    body = lp(noise_n(n, seed + 1), 900) * np.exp(-t / 0.022) * 0.7
    low = osc_sine(110 * (1 + 0.3 * np.exp(-t / 0.01)), n) * np.exp(-t / 0.03) * 0.35
    x = lp(crack + body + low, 3200, 2) * (1 - np.exp(-t / 0.0008))
    return st(x)


def g_wings(dur=1.8, birds=14, seed=510):
    """Pigeons bursting off a roof: overlapping wing claps, spreading and fading."""
    n = ns(dur)
    out = np.zeros((n, 2))
    r = R(seed)
    for b in range(birds):
        t0 = r.uniform(0.0, 0.35)
        rate = r.uniform(8, 12)
        flaps = r.integers(7, 15)
        p = r.uniform(-0.8, 0.8)
        y = np.zeros(n)
        for k in range(flaps):
            m = ns(0.03)
            tt = np.arange(m) / SR
            fl = bp(noise_n(m, seed + b * 50 + k), 600, 3800) * np.sin(np.pi * tt / tt[-1]) * np.exp(-k / (flaps * 0.6))
            i = max(0, ns(t0 + k / rate + r.normal(0, 0.004)))
            if i + m < n:
                y[i:i + m] += fl * r.uniform(0.6, 1.0)
        out += pan(y, p)
    return reverb(out * 0.35, 0.18, 1.2, 6000, seed)


def g_car(dur, seed=520, far=0.45):
    """1914 open touring car: slow four-cylinder chug plus body rattle."""
    eng = g_engine(dur, f=19, seed=seed, rough=0.7, far=far)
    n = ns(dur)
    rat = bp(noise_n(n, seed + 3), 800, 3000) * (np.clip(smooth_noise(n, 9, seed + 4), 0, None) ** 2) * 0.05
    return mixs(eng, distance(rat, far, seed + 5))


def g_car_stall(seed=530):
    """Engine falters, coughs twice and stops (no bang)."""
    ln = 2.4
    n = ns(ln)
    t = np.arange(n) / SR
    f = 19 * np.clip(1 - t / 2.0, 0.25, 1)
    pulses = blsquare(f, n, width=0.2) + 0.4 * blsaw(f * 2.01, n)
    gate = np.ones(n)
    for a, b in [(0.9, 1.05), (1.4, 1.6)]:
        gate[ns(a):ns(b)] = 0.2
    env = np.clip(1 - (t - 1.6) / 0.5, 0, 1)
    x = lp(pulses, 380) * gate * env
    x = np.convolve(x, np.ones(ns(0.01)) / ns(0.01), mode="same")
    return distance(x * 0.5, 0.45, seed)


def g_brakes(seed=540):
    """Mechanical brake: short leather/metal squeak and tyres slowing on cobbles."""
    ln = 1.4
    n = ns(ln)
    t = np.arange(n) / SR
    sq = osc_sine(1350 * (1 + 0.02 * np.sin(2 * np.pi * 7 * t)), n) * np.clip(1 - t / 0.7, 0, 1) * (t < 0.7) * 0.18
    roll = bp(noise_n(n, seed), 120, 900) * np.clip(1 - t / ln, 0, 1) ** 1.5 * 0.7
    cob = np.zeros(n)
    for k in range(10):
        i = ns(0.05 + k * 0.1 * (1 + k * 0.12))
        m = ns(0.02)
        if i + m < n:
            cob[i:i + m] += lp(noise_n(m, seed + k), 700) * exp_decay(m, 0.005) * (1 - k / 10)
    return distance(sq + roll + cob * 0.6, 0.45, seed)


def g_ticks(dur, rate0=1.0, rate1=None, seed=550, pitch=1.0, close=False):
    """Clock ticks at a rate gliding from rate0 to rate1 ticks/s (speeding-up clock)."""
    rate1 = rate0 if rate1 is None else rate1
    n = ns(dur)
    out = np.zeros(n)
    t, k = 0.02, 0
    while t < dur - 0.05:
        m = ns(0.05)
        tt = np.arange(m) / SR
        f = (2400 if k % 2 == 0 else 1900) * pitch
        tick = bp(noise_n(m, seed + k), f * 0.7, min(f * 1.4, 20000)) * np.exp(-tt / 0.003) \
            + osc_sine(f * 0.5, m) * np.exp(-tt / 0.008) * 0.3
        i = ns(t)
        out[i:i + m] += tick
        r_ = rate0 + (rate1 - rate0) * t / dur
        t += 1.0 / r_
        k += 1
    return reverb(st(out * 0.6), 0.08 if close else 0.25, 0.8 if close else 1.2, 5000, seed)


def g_big_chime(n_strikes=11, spacing=1.0, seed=560, far=0.7):
    """A distant big clock striking (E3 hour bell)."""
    ln = (n_strikes - 1) * spacing + 6.0
    out = np.zeros(ns(ln))
    for k in range(n_strikes):
        b = bell_tone(midi(nm("E3")), 0.8 * (1 - 0.02 * k), decay=4.5, seed=seed + k)
        i = ns(k * spacing)
        j = min(len(out), i + len(b))
        out[i:j] += b[: j - i]
    return distance(out * 0.5, far, seed)


def g_train(dur, seed=570, r0=1.0, r1=3.2, far=0.4):
    """Steam train pulling out: chuffs speeding up, wheels and rail joints."""
    n = ns(dur)
    out = np.zeros(n)
    r = R(seed)
    t, k = 0.1, 0
    while t < dur - 0.2:
        m = ns(0.22)
        tt = np.arange(m) / SR
        ch_ = bp(noise_n(m, seed + k), 250, 3200) * np.exp(-tt / 0.07) * (1 if k % 2 == 0 else 0.7)
        i = ns(t)
        if i + m < n:
            out[i:i + m] += ch_
        t += 1.0 / (r0 + (r1 - r0) * (t / dur) ** 0.8)
        k += 1
    rail = np.zeros(n)
    tj = 0.8
    while tj < dur - 0.2:
        for d in (0.0, 0.12):
            m = ns(0.03)
            i = ns(tj + d)
            if i + m < n:
                rail[i:i + m] += bp(noise_n(m, seed + int(tj * 10)), 300, 2500) * exp_decay(m, 0.006)
        tj += r.uniform(0.9, 1.1)
    hum = lp(noise_n(n, seed + 9), 200) * 0.3
    return distance(out * 0.6 + rail * 0.5 + hum, far, seed)


def g_pea_whistle(seed=580, ln=0.9, f=2900, far=0.5):
    """Officer's pea whistle: a trilled blast."""
    n = ns(ln)
    t = np.arange(n) / SR
    r = R(seed)
    trill = 1 + 0.035 * np.sin(2 * np.pi * r.uniform(24, 32) * t)
    x = osc_sine(f * trill * (1 + 0.01 * np.clip(t / 0.1, 0, 1)), n)
    x = x * (0.75 + 0.25 * np.sin(2 * np.pi * r.uniform(24, 32) * t)) + bp(noise_n(n, seed), 2000, 6000) * 0.15
    e = env_adsr(n, 0.02, 0.1, 0.85, 0.12)
    return distance(x * e * 0.35, far, seed)


def g_whistles_line(seed=590, times=(0.0, 0.35, 0.8, 1.3), far=(0.55, 0.7, 0.8, 0.9)):
    out = np.zeros((ns(4.0), 2))
    for k, (t, fa) in enumerate(zip(times, far)):
        w = g_pea_whistle(seed + k, ln=0.8 + 0.2 * (k % 2), f=2700 + 150 * k, far=fa)
        place(out, w, t, 1.0 - 0.15 * k)
    return out


def g_mud(seed=600):
    """Boot pulling out of mud: a soft suction squelch."""
    ln = 0.5
    n = ns(ln)
    t = np.arange(n) / SR
    src = lp(noise_n(n, seed), 900)
    f = 380 * np.exp(-t / 0.25) + 110
    y = np.zeros(n)
    # time-varying resonance by short block-wise band-pass
    blk = ns(0.025)
    for i in range(0, n, blk):
        fc = f[i]
        y[i:i + blk] = bp(src[max(0, i - blk):i + blk], fc * 0.7, fc * 1.4)[-len(src[i:i + blk]):]
    y *= np.sin(np.pi * np.clip(t / 0.35, 0, 1)) ** 1.5
    pop = bp(noise_n(n, seed + 1), 300, 1500) * np.exp(-np.clip(t - 0.33, 0, None) / 0.02) * (t > 0.33) * 0.5
    return reverb(st((y + pop) * 0.8), 0.15, 0.8, 3000, seed)


def g_rat(dur=1.2, seed=610):
    """Quiet scurry of small claws along wood."""
    n = ns(dur)
    out = np.zeros(n)
    r = R(seed)
    t = 0.0
    while t < dur - 0.05:
        m = ns(0.006)
        i = ns(t)
        if i + m < n:
            out[i:i + m] += hp(noise_n(m, seed + i % 997), 2500) * r.uniform(0.3, 1.0)
        t += r.uniform(0.03, 0.07)
    p = np.linspace(-0.6, 0.6, n)
    y = np.stack([out * np.cos((p + 1) * np.pi / 4), out * np.sin((p + 1) * np.pi / 4)], axis=1)
    return reverb(y * 0.4, 0.15, 0.8, 6000, seed)


def g_mask_breath(dur, seed=620, period=3.4):
    """Muffled breathing inside a gas-mask: in/out cycles through a canister, a valve flutter."""
    n = ns(dur)
    t = np.arange(n) / SR
    ph = (t % period) / period
    inh = np.sin(np.pi * np.clip(ph / 0.42, 0, 1)) ** 2 * (ph < 0.42)
    exh = np.sin(np.pi * np.clip((ph - 0.48) / 0.45, 0, 1)) ** 2 * (ph >= 0.48) * (ph < 0.93)
    src = noise_n(n, seed)
    x = bp(src, 250, 1300) * inh * 0.9 + bp(src, 180, 900) * exh * 0.7
    flutter = (0.7 + 0.3 * np.sign(np.sin(2 * np.pi * 38 * t))) * exh
    x = x * np.where(exh > 0, flutter, 1)
    return reverb(st(lp(x, 1500) * 0.6), 0.08, 0.5, 2500, seed)


def g_straps(seed=630):
    """Gas-mask straps: rubber stretch and a buckle click."""
    n = ns(1.0)
    t = np.arange(n) / SR
    rub = bp(blsaw(140 * (1 + 0.4 * t), n), 300, 1800) * np.sin(np.pi * np.clip(t / 0.45, 0, 1)) * (t < 0.45) * 0.3
    clk = np.zeros(n)
    for k, at in enumerate([0.55, 0.62]):
        m = ns(0.02)
        clk[ns(at):ns(at) + m] += bp(noise_n(m, seed + k), 2000, 8000) * exp_decay(m, 0.002)
    return reverb(st(rub + clk * 0.8), 0.1, 0.5, 5000, seed)


def g_morse(dur, seed=640):
    """Faint Morse ticking from a telegraph sounder (random dits/dahs; no message)."""
    n = ns(dur)
    out = np.zeros(n)
    r = R(seed)
    t = 0.1
    while t < dur - 0.3:
        L = 0.06 if r.uniform() < 0.6 else 0.18
        m = ns(L)
        tt = np.arange(m) / SR
        tone = osc_sine(700, m) * np.clip(np.minimum(tt, L - tt) / 0.004, 0, 1)
        i = ns(t)
        out[i:i + m] += tone
        t += L + (0.06 if r.uniform() < 0.75 else 0.22)
    out = lp(out, 2500) * 0.4 + bp(noise_n(n, seed + 1), 1000, 4000) * 0.01
    return st(out)


def g_typewriter(dur, seed=650):
    n = ns(dur + 0.8)
    out = np.zeros(n)
    r = R(seed)
    t = 0.05
    while t < dur - 0.1:
        m = ns(0.04)
        tt = np.arange(m) / SR
        k_ = bp(noise_n(m, seed + int(t * 100)), 1200, 6000) * np.exp(-tt / 0.004) + \
            osc_sine(r.uniform(280, 360), m) * np.exp(-tt / 0.01) * 0.5
        i = ns(t)
        out[i:i + m] += k_ * r.uniform(0.6, 1.0)
        t += r.uniform(0.09, 0.2)
    b = bell_tone(2400, 0.4, decay=0.6, seed=seed)
    i = ns(dur)
    out[i:i + len(b)] += b[: n - i] * 0.5
    return reverb(st(out * 0.6), 0.2, 0.9, 6000, seed)


def g_jingle(dur, seed=660):
    """Plough-horse harness jingle (small bells) with slow hoof steps on soft earth."""
    n = ns(dur)
    out = np.zeros(n)
    r = R(seed)
    t = 0.1
    while t < dur - 0.4:
        for j in range(r.integers(2, 5)):
            b = bell_tone(r.uniform(2600, 3600), r.uniform(0.2, 0.5), decay=0.35, seed=seed + int(t * 37) + j)
            i = ns(t + j * 0.03)
            k = min(n, i + len(b))
            out[i:k] += b[: k - i]
        t += r.uniform(0.6, 0.8)
    steps = g_footsteps(dur, 1.3, "soft", seed + 1, far=0.5)
    return mixs(distance(out * 0.3, 0.55, seed), steps * 0.6)


def g_ding(seed=670, f=1650, hits=2):
    out = np.zeros(ns(1.6))
    for k in range(hits):
        b = bell_tone(f, 0.6, decay=0.8, seed=seed + k)
        i = ns(k * 0.22)
        j = min(len(out), i + len(b))
        out[i:j] += b[: j - i]
    return distance(out * 0.5, 0.4, seed)


def g_hammering(dur, seed=680, rate=1.7, far=0.7):
    """Shipyard rivet hammers, far away (metallic clangs)."""
    n = ns(dur)
    out = np.zeros(n)
    r = R(seed)
    for h in range(2):
        t = r.uniform(0, 0.4)
        while t < dur - 0.3:
            m = ns(0.25)
            tt = np.arange(m) / SR
            f0 = r.uniform(700, 1100)
            y = sum(osc_sine(f0 * q, m) * np.exp(-tt / (0.05 / q)) * a for q, a in [(1, 1), (2.76, 0.5), (5.4, 0.25)])
            y += bp(noise_n(m, seed + int(t * 50) + h), 1500, 7000) * np.exp(-tt / 0.004)
            i = ns(t)
            if i + m < n:
                out[i:i + m] += y * r.uniform(0.5, 1.0)
            t += 1 / rate * r.uniform(0.9, 1.1)
    return distance(out * 0.3, far, seed)


def g_splash(seed=690, ln=3.0):
    n = ns(ln)
    t = np.arange(n) / SR
    x = lp(noise_n(n, seed), 1400) * np.clip(t / 0.25, 0, 1) * np.exp(-np.clip(t - 0.25, 0, None) / 0.8)
    x += bp(noise_n(n, seed + 1), 1500, 6000) * np.exp(-np.clip(t - 0.3, 0, None) / 0.6) * (t > 0.2) * 0.3
    return distance(x * 0.6, 0.8, seed)


def g_band(dur, seed=700, far=0.85, bpm=112):
    """A distant brass band playing an original march figure (Bb major), far away."""
    n = ns(dur) + ns(1.5)
    out = np.zeros(n)
    bt = 60 / bpm
    mel = ["F4", "Bb4", "D5", "F5", "D5", "Bb4", "C5", "A4", "Bb4", "D5", "C5", "A4", "F4", "G4", "A4", "Bb4"]
    bass = ["Bb2", "F2", "Bb2", "F2", "F2", "C3", "Bb2", "F2"]
    k = 0
    while k * bt < dur - 0.4:
        t = k * bt
        x = brass_note(midi(nm(mel[k % len(mel)])), bt * 0.8, 0.45, a=0.03, r=0.15, seed=seed + k)
        i = ns(t)
        j = min(n, i + len(x))
        out[i:j] += x[: j - i] * 0.6
        if k % 2 == 0:
            y = brass_note(midi(nm(bass[(k // 2) % len(bass)])), bt * 0.7, 0.5, a=0.02, r=0.1, seed=seed + 500 + k)
            j = min(n, i + len(y))
            out[i:j] += y[: j - i] * 0.6
        s = snare_soft(0.5 if k % 2 == 0 else 0.3, seed + 900 + k)
        j = min(n, i + len(s))
        out[i:j] += s[: j - i]
        k += 1
    out[ns(dur):] = 0
    return distance(lp(out, 2500) * 0.5, far, seed)


def g_ship_horn(seed=710, ln=2.8, f=98, far=0.85):
    n = ns(ln)
    t = np.arange(n) / SR
    fr = f * (1 + 0.012 * np.clip(t / 0.3, 0, 1))
    x = lp(blsaw(fr, n) + 0.6 * blsaw(fr * 1.5, n), 700) * env_adsr(n, 0.15, 0.2, 0.9, 0.6)
    return distance(x * 0.4, far, seed)


def g_oars(dur, seed=720, period=2.2):
    n = ns(dur)
    out = np.zeros(n)
    r = R(seed)
    t = 0.2
    while t < dur - 0.8:
        m = ns(0.7)
        tt = np.arange(m) / SR
        sw = bp(noise_n(m, seed + int(t * 10)), 400, 2500) * np.sin(np.pi * tt / 0.7) ** 2
        cr = bp(blsaw(r.uniform(220, 300), m), 300, 1500) * np.exp(-tt / 0.08) * 0.25
        i = ns(t)
        out[i:i + m] += sw * 0.6 + cr
        t += period * r.uniform(0.95, 1.05)
    return distance(out * 0.5, 0.5, seed)


def g_globe_hum(dur, seed=730):
    n = ns(dur)
    t = np.arange(n) / SR
    x = (osc_sine(55, n) + 0.4 * osc_sine(110.3, n) + 0.15 * osc_sine(165.2, n)) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.3 * t))
    return st(x * 0.2, 0.4)


def g_bugle_call(seed=740, far=0.85):
    """A distant bugle (S06-05): an original short call on the natural harmonics."""
    evs = [(0.0, 0.18, nm("G4"), 0.8), (0.2, 0.18, nm("C5"), 0.9), (0.4, 0.5, nm("E5"), 1.0), (0.95, 0.18, nm("C5"), 0.8),
           (1.15, 0.7, nm("G4"), 0.8)]
    x = legato_line(evs, vel=0.4, glide=0.015, vib=4, timbre="bugle", seed=seed, a=0.03, r=0.5)
    return distance(x, far, seed)


def g_bike_tick(dur, seed=750):
    """Bicycle freewheel ticking, slowing as it coasts."""
    n = ns(dur)
    out = np.zeros(n)
    t, k = 0.05, 0
    while t < dur - 0.05:
        m = ns(0.01)
        out[ns(t):ns(t) + m] += bp(noise_n(m, seed + k), 3000, 9000) * exp_decay(m, 0.0015)
        t += 1 / (16 - 8 * t / dur)
        k += 1
    return distance(out * 0.4, 0.35, seed)


def g_digging(dur, seed=760, rate=0.75, far=0.5):
    """Spades into earth: a scrape and a soft thud (no impacts on people)."""
    n = ns(dur)
    out = np.zeros(n)
    r = R(seed)
    t = 0.2
    while t < dur - 0.7:
        m = ns(0.6)
        tt = np.arange(m) / SR
        scrape = bp(noise_n(m, seed + int(t * 10)), 900, 4500) * np.sin(np.pi * np.clip(tt / 0.25, 0, 1)) * (tt < 0.25) * 0.4
        thud = (lp(noise_n(m, seed + int(t * 10) + 1), 300) * 1.5 + osc_sine(75, m) * 0.4) * \
            np.exp(-np.clip(tt - 0.3, 0, None) / 0.05) * (tt > 0.3)
        i = ns(t)
        out[i:i + m] += (scrape + thud) * r.uniform(0.6, 1.0)
        t += 1 / rate * r.uniform(0.8, 1.2)
    return distance(out * 0.5, far, seed)


def g_ball(seed=770):
    n = ns(0.5)
    t = np.arange(n) / SR
    x = osc_sine(130 * (1 + 0.3 * np.exp(-t / 0.01)), n) * np.exp(-t / 0.03) + lp(noise_n(n, seed), 1000) * np.exp(-t / 0.01)
    return distance(x * 0.5, 0.55, seed)


def g_drips(dur, seed=780, rate=1.4):
    n = ns(dur)
    out = np.zeros(n)
    r = R(seed)
    t = r.uniform(0, 0.5)
    while t < dur - 0.1:
        m = ns(0.03)
        tt = np.arange(m) / SR
        f = r.uniform(900, 1600) * (1 + 1.2 * tt / tt[-1])
        out[ns(t):ns(t) + m] += osc_sine(f, m) * np.exp(-tt / 0.008) * r.uniform(0.4, 1.0)
        t += r.exponential(1 / rate) + 0.08
    return reverb(st(out * 0.4, 0.5), 0.35, 1.4, 4000, seed)


def g_patter(seed=790, ln=1.8):
    """Earth pattering down after a far-off shell (grains, no blast)."""
    n = ns(ln)
    out = np.zeros(n)
    r = R(seed)
    cnt = 260
    pos = (np.sort(r.exponential(0.5, cnt)) * SR).astype(int)
    pos = pos[pos < n - 10]
    out[pos] = r.uniform(-1, 1, len(pos)) * np.exp(-pos / SR / 0.8)
    return reverb(st(bp(out, 600, 5000) * 0.8, 0.5), 0.2, 0.9, 5000, seed)


def g_owl(seed=800):
    """Tawny owl, far: hoo ... hoo-hoo-hoo."""
    out = np.zeros(ns(3.2))
    for k, (t, ln, f) in enumerate([(0.0, 0.55, 430), (1.1, 0.18, 410), (1.35, 0.18, 410), (1.6, 0.6, 400)]):
        m = ns(ln)
        tt = np.arange(m) / SR
        y = osc_sine(f * (1 - 0.04 * tt / ln) * (1 + 0.01 * np.sin(2 * np.pi * 18 * tt)), m) * np.sin(np.pi * tt / ln) ** 1.2
        y += bp(noise_n(m, seed + k), 300, 900) * 0.05
        out[ns(t):ns(t) + m] += y
    return distance(out * 0.5, 0.8, seed)


def g_leaves(dur, seed=810, rate=1.1, far=0.4):
    """Footsteps on dry autumn leaves."""
    n = ns(dur)
    out = np.zeros(n)
    r = R(seed)
    t = 0.1
    while t < dur - 0.4:
        m = ns(0.3)
        g = np.zeros(m)
        cnt = 120
        pos = (r.exponential(0.06, cnt) * SR).astype(int)
        pos = pos[pos < m]
        g[pos] = r.uniform(-1, 1, len(pos))
        g = bp(g, 900, 7000) + lp(noise_n(m, seed + int(t * 10)), 500) * exp_decay(m, 0.03) * 0.5
        out[ns(t):ns(t) + m] += g * r.uniform(0.6, 1.0)
        t += 1 / rate * r.uniform(0.9, 1.1)
    return distance(out * 0.4, far, seed)


def g_woodpigeon(seed=820):
    """Wood pigeon, five-note coo (far)."""
    out = np.zeros(ns(3.4))
    pat = [(0.0, 0.32, 1.0), (0.42, 0.5, 1.15), (1.02, 0.3, 1.0), (1.55, 0.3, 1.0), (1.95, 0.35, 0.95)]
    for k, (t, ln, fm) in enumerate(pat):
        m = ns(ln)
        tt = np.arange(m) / SR
        y = osc_sine(480 * fm * (1 + 0.05 * np.sin(np.pi * tt / ln)), m) * np.sin(np.pi * tt / ln) ** 1.5
        y = lp(y + 0.3 * osc_sine(960 * fm, m) * np.sin(np.pi * tt / ln) ** 2, 1500)
        out[ns(t):ns(t) + m] += y
    return distance(out * 0.4, 0.7, seed)


def g_domino(seed=830, size=1.0):
    """A wooden domino tipping onto the next: a tip click and a landing clack."""
    out = np.zeros(ns(0.35))
    for k, (at, a) in enumerate([(0.0, 0.5), (0.035, 1.0)]):
        m = ns(0.06)
        tt = np.arange(m) / SR
        y = bp(noise_n(m, seed + k), 1500, 7000) * np.exp(-tt / 0.003)
        y += (osc_sine(1900 / size, m) * 0.5 + osc_sine(3100 / size, m) * 0.3) * np.exp(-tt / 0.018)
        y += osc_sine(700 / size, m) * np.exp(-tt / 0.012) * 0.4
        out[ns(at):ns(at) + m] += y * a
    return reverb(st(out * 0.6), 0.12, 0.7, 6000, seed)


def g_ink_tick(seed=840):
    """Soft map 'ink' tick when a country fills."""
    n = ns(0.4)
    t = np.arange(n) / SR
    x = osc_sine(880 * (1 - 0.1 * t), n) * np.exp(-t / 0.05) * 0.4 + bp(noise_n(n, seed), 1500, 6000) * np.exp(-t / 0.004)
    return reverb(st(x * 0.5), 0.2, 0.8, 6000, seed)


def g_tap(seed=850):
    n = ns(0.3)
    t = np.arange(n) / SR
    x = bp(noise_n(n, seed), 800, 5000) * np.exp(-t / 0.004) + osc_sine(620, n) * np.exp(-t / 0.02) * 0.5
    return reverb(st(x * 0.5), 0.15, 0.6, 5000, seed)


def g_muffled(x):
    """Through a wall / window."""
    return lp(S2(x), 700, 2) * 1.6


# ============================================================================ cue list
def cue_table():
    C = []

    def add(t, name, sig, gain, p, shot, fi=0.05, fo=0.3, dur=None):
        C.append(dict(t=round(t, 3), name=name, sig=sig, gain=gain, pan=p, shot=shot, fi=fi, fo=fo, dur=dur))

    # ---- s01 cold open (0-35). No SFX under the title sting (27.95-35).
    add(0.0, "crowd-murmur", g_crowd(13.5, 14, "murmur", 11, 0.55), -35, -0.1, "S01-01", 0.8, 0.12)
    add(1.0, "light-applause", g_applause(3.4, 24, 21), -38, 0.15, "S01-01", 0.6, 1.0)
    add(0.0, "car-engine-1914", g_car(10.0, 521), -33, 0.0, "S01-01", 1.0, 0.1)
    add(9.85, "car-stall", g_car_stall(531), -31, 0.1, "S01-02", 0.02, 0.4)
    add(SHOTS_1914[0], "pistol-report-distant", g_pistol(501), -27, 0.15, "S01-02", 0.0, 0.05)
    add(SHOTS_1914[1], "pistol-report-distant", g_pistol(502), -28, 0.15, "S01-02", 0.0, 0.05)
    add(SHOTS_1914[0] + 0.06, "pigeon-wing-burst", g_wings(1.6, 14, 511), -30, 0.0, "S01-02", 0.0, 0.5)
    add(18.3, "wind", g_wind(6.6, 0.35, 0.0, 34), -34, 0.0, "S01-03", 0.6, 0.6)
    add(20.6, "crow-distant", g_crow(281), -36, -0.4, "S01-03", 0.0, 0.3)
    add(24.9, "room-tone", g_room(3.0, 42), -42, 0.0, "S01-04", 0.3, 0.4)
    for k, tt in enumerate([26.45, 26.95, 27.4]):
        add(tt, "chalk", g_chalk(2, 62 + k), -37, -0.2, "S01-04", 0.0, 0.05)

    # ---- s02 Europe before 1914 (35-110)
    add(35.0, "street-murmur", g_crowd(13.6, 12, "murmur", 12, 0.65), -37, -0.1, "S02-01", 0.8, 0.8)
    add(35.2, "brass-band-distant", g_band(5.4, 701, 0.85), -37, 0.3, "S02-01", 0.6, 1.0)
    add(40.5, "paper-whoosh", g_paper("whoosh", 131, 0.9), -32, 0.0, "S02-01", 0.0, 0.2)
    add(41.2, "sea-wash-soft", g_surf(7.4, 295, gentle=True), -38, 0.0, "S02-01", 1.0, 1.0)
    for k, tt in enumerate([52.4, 53.7, 55.0, 58.9, 60.5, 62.4]):
        add(tt, "map-ink-tick", g_ink_tick(841 + k), -38, (k % 3 - 1) * 0.3, "S02-02" if tt < 58.5 else "S02-03", 0.0, 0.1)
    add(68.2, "shipyard-hammering", g_hammering(4.0, 681), -36, 0.2, "S02-04", 0.3, 0.4)
    add(71.6, "launch-splash", g_splash(691), -34, 0.1, "S02-04", 0.1, 0.8)
    add(72.4, "marching-boots", g_marching(2.1, 112, 10, 132, far=0.5), -36, -0.2, "S02-04", 0.2, 0.3)
    add(78.0, "clock-tick", g_ticks(6.4, 1.0, 1.0, 551), -38, 0.25, "S02-05", 0.5, 0.05)
    clock_a = g_ticks(16.0, 1.0, 2.4, 552)
    add(84.4, "clock-speeding-up", clock_a, -36, 0.25, "S02-06/07", 0.05, 0.02, dur=100.4 - 84.4)   # stops at 100.4
    add(87.0, "arrow-swish", g_paper("whoosh", 132, 0.7), -36, 0.2, "S02-06", 0.0, 0.2)
    add(90.6, "arrow-swish", g_paper("whoosh", 133, 0.7), -37, -0.2, "S02-06", 0.0, 0.2)
    for k, tt in enumerate([93.8, 94.4, 95.0, 95.6, 96.2]):
        add(tt, "domino-set-down", g_domino(831 + k, 1.1), -39, -0.3 + 0.15 * k, "S02-07", 0.0, 0.05)
    add(96.8, "chalk", g_chalk(3, 66), -37, 0.2, "S02-07", 0.0, 0.05)
    add(97.8, "chalk", g_chalk(3, 67), -38, 0.2, "S02-07", 0.0, 0.05)
    for k, tt in enumerate(DOMINO_CLACKS):
        add(tt, "domino-clack", g_domino(850 + k), -30, -0.5 + 0.14 * k, "S02-07", 0.0, 0.05)
    for k, tt in enumerate(CHALK_DOMINOES):
        add(tt, "chalk-domino-tick", g_chalk(1, 70 + k), -35, 0.1 * (k - 3), "S02-07", 0.0, 0.05)

    # ---- s03 Sarajevo and the July Crisis (110-190)
    add(110.2, "crowd-murmur", g_crowd(16.75, 14, "murmur", 13, 0.6), -36, -0.1, "S03-01/02", 0.8, 0.1)
    add(110.2, "car-engine-1914", g_car(13.2, 522), -34, 0.0, "S03-01", 0.8, 0.5)
    add(112.6, "polite-applause", g_applause(3.4, 20, 22), -38, 0.2, "S03-01", 0.5, 1.0)
    add(123.3, "car-brakes", g_brakes(541), -32, 0.1, "S03-02", 0.0, 0.3)
    add(124.5, "car-idle", g_car(2.4, 523, far=0.5), -36, 0.1, "S03-02", 0.2, 0.1)
    add(SHOTS_S03[0], "pistol-report-distant", g_pistol(503), -27, 0.15, "S03-02", 0.0, 0.05)
    add(SHOTS_S03[1], "pistol-report-distant", g_pistol(504), -28, 0.15, "S03-02", 0.0, 0.05)
    add(SHOTS_S03[0] + 0.06, "pigeon-wing-burst", g_wings(1.4, 12, 512), -31, 0.0, "S03-02", 0.0, 0.45)
    add(130.3, "clock-tick", g_ticks(6.5, 1.0, 1.0, 553), -37, 0.25, "S03-03", 0.3, 0.3)
    add(131.6, "paper-slide", g_paper("rustle", 134, 0.9), -34, 0.0, "S03-03", 0.05, 0.3)
    add(136.95, "paper-whoosh", g_paper("whoosh", 135, 0.8), -33, 0.0, "S03-04", 0.0, 0.2)
    add(137.2, "clock-ticking", g_ticks(10.0, 1.0, 1.0, 554), -36, 0.25, "S03-04", 0.3, 0.5)
    add(154.8, "marching-boots-distant", g_marching(5.1, 112, 16, 133, far=0.75), -36, 0.2, "S03-05", 0.8, 0.6)
    add(160.3, "big-clock-chime-x11", g_big_chime(11, 1.0, 561), -31, -0.1, "S03-06/07", 0.0, 2.5)
    add(160.0, "crowd-murmur", g_crowd(7.7, 16, "hushed", 14, 0.6), -37, 0.1, "S03-06", 0.6, 0.6)
    add(164.9, "running-footsteps", g_footsteps(1.6, 3.2, "hard", 63, far=0.4), -38, 0.3, "S03-06", 0.05, 0.2)
    add(165.6, "newspaper-slap", g_paper("slap", 136), -34, 0.2, "S03-06", 0.0, 0.1)
    for k, tt in enumerate([168.1, 168.9, 172.0]):
        add(tt, "chalk", g_chalk(2, 75 + k), -37, -0.2, "S03-07", 0.0, 0.05)
    for k, tt in enumerate([176.0, 179.7, 183.5]):
        add(tt, "page-turn", g_paper("flip", 137 + k), -35, 0.1, "S03-08", 0.0, 0.1)

    # ---- s04 1914: the war of movement stops (190-260)
    add(190.1, "steam-whistle", g_whistle(261, 1.5), -31, 0.2, "S04-01", 0.05, 0.4)
    add(190.0, "cheering-restrained", g_crowd(6.0, 20, "cheer", 24, 0.7), -37, -0.1, "S04-01", 0.3, 0.8)
    add(190.4, "train-departure", g_train(5.8, 571), -34, 0.0, "S04-01", 0.3, 0.6)
    add(196.0, "boots-distant", g_marching(7.3, 116, 18, 134, far=0.75), -36, 0.0, "S04-02", 0.5, 0.6)
    add(196.6, "arrow-swish", g_paper("whoosh", 140, 0.8), -35, 0.2, "S04-02", 0.0, 0.2)
    add(199.3, "arrow-swish", g_paper("whoosh", 141, 0.8), -36, 0.2, "S04-02", 0.0, 0.2)
    add(203.5, "artillery-rumble-distant", g_guns_distant(7.6, 5, 111, 0.93), -31, 0.0, "S04-03", 0.3, 0.8)
    add(204.0, "rifle-crackle-far", g_rifles(6.0, 9, 96, 0.92), -39, 0.2, "S04-03", 0.2, 0.6)
    for k, tt in enumerate([215.6, 216.9, 218.4]):
        add(tt, "arrow-swish", g_paper("whoosh", 142 + k, 0.7), -36, 0.15 * (k - 1), "S04-04", 0.0, 0.2)
    add(221.2, "digging-spades", g_digging(8.4, 761), -36, -0.1, "S04-04", 1.5, 0.6)
    add(229.8, "night-hush", g_wind(8.2, 0.15, 0.0, 35), -40, 0.0, "S04-05", 1.0, 0.6)
    add(238.0, "quiet-voices", g_crowd(10.2, 8, "hushed", 15, 0.75), -39, 0.0, "S04-06", 1.0, 0.6)
    add(238.4, "boots-on-frost", g_footsteps(9.0, 1.4, "snow", 64, people=3, far=0.45, jitter=0.1), -37, 0.1, "S04-06", 0.5, 0.6)
    for k, tt in enumerate([243.2, 244.6, 246.1]):
        add(tt, "ball-thump-soft", g_ball(771 + k), -36, 0.45, "S04-06", 0.0, 0.1)
    add(WHISTLE_XMAS, "officer-whistle", g_pea_whistle(581, 0.9, 2850, 0.6), -30, -0.25, "S04-06", 0.0, 0.3)
    add(249.0, "boots-on-frost-returning", g_footsteps(6.0, 1.2, "snow", 65, people=4, far=0.55, jitter=0.12), -38, 0.0, "S04-06", 0.4, 1.0)
    add(248.6, "snow-wind", g_wind(11.2, 0.3, 0.0, 36), -37, 0.0, "S04-06", 1.0, 1.5)

    # ---- s05 life in the trenches (260-320)
    add(260.0, "rain", g_rain(10.4, 0.6, 74), -33, 0.0, "S05-01", 0.8, 0.6)
    add(260.0, "dripping", g_drips(20.6, 781, 1.4), -36, 0.2, "S05-01/02", 0.5, 0.6)
    add(262.0, "boots-on-duckboards", g_footsteps(7.4, 1.6, "hard", 66, people=2, far=0.3), -35, -0.2, "S05-01", 0.3, 0.5)
    add(270.4, "water-slosh", g_water(10.3, 341), -35, 0.0, "S05-02", 0.5, 0.6)
    add(273.0, "rat-scurry", g_rat(1.0, 611), -40, 0.0, "S05-02", 0.0, 0.2)
    add(274.6, "rat-scurry", g_rat(1.2, 612), -41, 0.0, "S05-02", 0.0, 0.2)
    add(280.8, "shell-crumps-distant", g_guns_distant(3.4, 3, 112, 0.95), -31, 0.0, "S05-03", 0.1, 0.6)
    add(281.7, "dirt-patter", g_patter(791), -38, 0.2, "S05-03", 0.0, 0.4)
    add(284.0, "wind", g_wind(6.6, 0.4, 0.0, 37), -35, 0.0, "S05-03", 0.6, 0.6)
    add(291.2, "gas-mask-straps", g_straps(631), -35, 0.1, "S05-03", 0.0, 0.1)
    add(292.0, "muffled-breathing-mask", g_mask_breath(7.2, 621), -34, 0.0, "S05-03", 0.4, 0.4)
    add(299.3, "candle-hiss", g_candle(9.1, 383), -40, 0.0, "S05-04", 0.6, 0.6)
    add(299.6, "breathing", lp(g_mask_breath(8.4, 622, 4.2), 2000) * 0.8, -38, 0.0, "S05-04", 0.6, 0.6)
    add(300.6, "muffled-distant-thud", g_boom_distant(81, 0.8, 0.97), -34, 0.0, "S05-04", 0.0, 0.8)
    add(308.4, "wind", g_wind(11.4, 0.3, 0.0, 38), -35, 0.0, "S05-05", 1.0, 2.5)

    # ---- s06 a world war (320-390)
    add(320.1, "globe-whoosh", g_paper("whoosh", 143, 1.2), -31, 0.0, "S06-01", 0.0, 0.3)
    add(329.0, "surf", g_surf(15.3, 296), -36, 0.0, "S06-02/03", 1.0, 0.8)
    add(329.4, "ship-horn-distant", g_ship_horn(711, 2.6, 98), -33, -0.3, "S06-02", 0.2, 0.8)
    add(333.3, "ship-horn-distant", g_ship_horn(712, 2.2, 87), -35, 0.35, "S06-02", 0.2, 0.8)
    add(338.2, "oars", g_oars(4.6, 721), -37, 0.2, "S06-03", 0.3, 0.5)
    add(341.0, "boots-on-shingle", g_footsteps(3.2, 1.8, "snow", 67, people=3, far=0.45, jitter=0.08), -37, -0.1, "S06-03", 0.2, 0.4)
    add(344.3, "globe-hum", g_globe_hum(6.8, 731), -41, 0.0, "S06-04", 0.8, 0.8)
    add(351.2, "marching-boots", g_marching(5.8, 112, 14, 135, far=0.6), -36, 0.1, "S06-05", 0.4, 0.6)
    add(352.6, "bugle-distant", g_bugle_call(741, 0.85), -36, -0.3, "S06-05", 0.0, 0.6)
    add(357.2, "wind", g_wind(31.5, 0.35, 0.05, 39), -35, 0.0, "S06-06/07", 1.2, 1.5)
    add(362.4, "door-creak", g_creak(1.6, 142, wheel=False), -37, 0.3, "S06-06", 0.1, 0.4)
    add(378.1, "candle-flicker", g_candle(10.5, 384), -40, 0.0, "S06-07", 1.0, 1.0)

    # ---- s07 Verdun and the Somme (390-450)
    add(390.0, "rumble-distant", g_guns_distant(10.6, 6, 113, 0.95), -32, 0.0, "S07-01", 0.8, 0.6)
    add(400.7, "rain", g_rain(8.2, 0.5, 75), -35, 0.0, "S07-02", 0.5, 0.5)
    add(400.9, "trucks-distant", g_engine(7.6, 24, 211, 0.6, 0.7), -36, 0.2, "S07-02", 0.6, 0.6)
    add(401.0, "shellfire-distant", g_guns_distant(7.5, 6, 114, 0.93), -31, 0.0, "S07-02", 0.2, 0.6)
    add(408.9, "bombardment-rumble-distant", g_guns_distant(9.6, 14, 115, 0.96), -31, 0.0, "S07-03", 0.4, 0.4)
    add(WHISTLES_SOMME, "officers-whistles", g_whistles_line(591), -29, 0.0, "S07-04", 0.0, 0.3)
    add(418.6, "wind", g_wind(9.4, 0.4, 0.05, 40), -34, 0.0, "S07-04", 0.6, 0.6)
    add(420.2, "guns-muffled-distant", g_guns_distant(7.6, 4, 116, 0.99), -35, 0.0, "S07-04", 0.4, 0.8)
    add(428.0, "wind", g_wind(6.8, 0.25, 0.0, 41), -37, 0.0, "S07-05", 0.4, 0.5)
    for k, tt in enumerate([428.6, 431.2, 433.8]):
        add(tt, "church-bell-single", g_bells(3.0, 364 + k, single=True, far=0.8), -33, 0.2, "S07-05", 0.0, 0.6)
    add(429.0, "bicycle-tick", g_bike_tick(3.4, 751), -38, -0.3, "S07-05", 0.1, 0.3)
    add(434.8, "wind-faint", g_wind(6.8, 0.2, 0.0, 42), -40, 0.0, "S07-06", 0.5, 0.6)
    for k, tt in enumerate([442.0, 443.4, 445.8]):
        add(tt, "chalk", g_chalk(2, 80 + k), -37, -0.2, "S07-07", 0.0, 0.05)

    # ---- s08 the home front (450-500)
    add(450.0, "street-murmur", g_crowd(10.6, 12, "murmur", 16, 0.6), -37, 0.0, "S08-01", 0.6, 0.6)
    add(451.5, "paste-brush", g_broom(2.6, 391), -35, 0.2, "S08-01", 0.2, 0.3)
    add(460.8, "typewriter", g_typewriter(2.8, 651), -36, 0.2, "S08-02", 0.05, 0.3)
    add(464.0, "plough-harness-jingle", g_jingle(2.9, 661), -38, -0.2, "S08-02", 0.3, 0.5)
    add(467.2, "bus-bell-ding", g_ding(671), -34, 0.25, "S08-02", 0.0, 0.3)
    add(467.8, "factory-hum-low", g_machinery(8.0, 172, 2.0, muted=True), -38, 0.0, "S08-02", 0.6, 0.6)
    add(476.0, "steam-hiss", g_steam(272, 1.6), -35, 0.3, "S08-03", 0.05, 0.6)
    add(476.4, "footsteps", g_footsteps(5.2, 1.7, "hard", 68, people=2, far=0.35), -37, -0.1, "S08-03", 0.2, 0.4)
    add(476.2, "quiet-voices", g_crowd(5.6, 6, "hushed", 17, 0.55), -39, 0.0, "S08-03", 0.4, 0.4)
    add(482.1, "classroom-clock", g_ticks(6.1, 1.0, 1.0, 555), -36, 0.3, "S08-04", 0.2, 0.3)
    add(482.1, "birdsong-distant", g_birds(6.1, 0.8, 6, 0.6), -38, -0.2, "S08-04", 0.6, 0.6)
    add(488.3, "kitchen-clock", g_ticks(5.2, 1.0, 1.0, 556, pitch=0.85), -37, 0.3, "S08-05", 0.2, 0.3)
    add(489.6, "coupon-tear", g_paper("tear", 144), -34, 0.1, "S08-05", 0.0, 0.1)
    add(491.0, "coupon-tear", g_paper("tear", 145), -35, 0.1, "S08-05", 0.0, 0.1)
    add(493.5, "wind", g_wind(6.3, 0.3, 0.0, 43), -37, 0.0, "S08-05", 0.6, 0.6)
    add(494.0, "shuffling-feet", g_footsteps(5.6, 1.1, "soft", 69, people=5, far=0.4, jitter=0.12), -37, -0.1, "S08-05", 0.3, 0.6)

    # ---- s09 1917: the turning year (500-560)
    add(500.0, "waves", g_surf(10.1, 297), -35, 0.0, "S09-01", 0.8, 0.6)
    add(500.4, "engine-distant", g_engine(9.4, 30, 212, 0.4, 0.8), -38, 0.2, "S09-01", 1.0, 0.8)
    add(506.2, "boom-far-off", g_boom_distant(82, 0.9, 0.95), -32, -0.2, "S09-01", 0.0, 0.8)
    add(510.2, "morse-faint", g_morse(9.6, 641), -39, 0.25, "S09-02", 0.3, 0.4)
    add(511.0, "pencil-scratch", g_pen(2.2, 107), -35, 0.0, "S09-02", 0.05, 0.2)
    add(513.8, "paper", g_paper("rustle", 146, 0.9), -35, 0.0, "S09-02", 0.05, 0.3)
    add(515.0, "pencil-scratch", g_pen(1.6, 108), -35, 0.0, "S09-02", 0.05, 0.2)
    add(520.1, "paper-whoosh", g_paper("whoosh", 147, 0.9), -32, 0.0, "S09-03", 0.0, 0.2)
    add(526.0, "harbour-water", g_surf(8.5, 298, gentle=True), -39, 0.0, "S09-03", 0.8, 0.6)
    add(526.5, "brass-band-distant", g_band(7.9, 702, 0.85), -36, 0.3, "S09-03", 0.8, 0.8)
    add(527.5, "harbour-gulls", g_gulls(301, 3), -36, -0.3, "S09-03", 0.0, 0.3)
    add(528.0, "boots-on-gangway", g_footsteps(6.0, 2.2, "hard", 70, people=4, far=0.4), -36, 0.1, "S09-03", 0.3, 0.5)
    add(530.6, "harbour-gulls", g_gulls(302, 2), -37, 0.4, "S09-03", 0.0, 0.3)
    add(534.5, "heavy-rain", g_rain(9.3, 0.85, 76), -32, 0.0, "S09-04", 0.4, 0.5)
    for k, tt in enumerate([536.2, 537.6, 539.1, 540.5, 542.0]):
        add(tt, "mud-suction", g_mud(601 + k), -34, -0.2 + 0.1 * k, "S09-04", 0.0, 0.1)
    add(535.0, "guns-distant", g_guns_distant(8.5, 5, 117, 0.95), -33, 0.0, "S09-04", 0.3, 0.6)
    add(543.8, "muffled-crowd-outside", g_muffled(g_crowd(6.2, 18, "anxious", 18, 0.5)), -38, 0.0, "S09-05", 0.5, 0.5)
    add(544.2, "pen-scratch", g_pen(1.8, 109), -35, 0.0, "S09-05", 0.05, 0.2)
    add(550.0, "crowd-voices", g_crowd(6.2, 18, "anxious", 19, 0.6), -37, 0.0, "S09-06", 0.4, 0.8)
    add(550.0, "wind", g_wind(9.8, 0.4, 0.0, 44), -36, 0.0, "S09-06", 0.6, 0.6)
    add(556.8, "map-ink-tick", g_ink_tick(847), -38, 0.0, "S09-06", 0.0, 0.1)
    add(557.6, "map-ink-tick", g_ink_tick(848), -38, 0.2, "S09-06", 0.0, 0.1)

    # ---- s10 1918: the last battles (560-620)
    add(560.0, "train-rhythm", g_train(6.8, 572, 2.6, 3.0, 0.45), -35, 0.0, "S10-01", 0.6, 0.6)
    add(573.9, "room-tone", g_room(6.7, 43), -42, 0.0, "S10-02", 0.3, 0.4)
    add(576.0, "pointer-tap", g_tap(851), -35, 0.1, "S10-02", 0.0, 0.1)
    add(577.2, "pointer-tap", g_tap(852), -36, 0.1, "S10-02", 0.0, 0.1)
    add(580.6, "tank-engines-tracks", g_tank(9.9, 221, 0.45), -33, 0.0, "S10-03", 0.5, 0.6)
    add(581.0, "guns-distant", g_guns_distant(9.0, 5, 118, 0.94), -33, 0.0, "S10-03", 0.3, 0.6)
    for k, tt in enumerate([591.4, 592.6, 593.8, 595.0]):
        add(tt, "map-ink-tick", g_ink_tick(849 + k), -38, 0.1 * (k - 1.5), "S10-04", 0.0, 0.1)
    add(601.8, "forest-hush", g_wind(4.9, 0.15, 0.0, 45), -39, 0.0, "S10-05", 0.8, 0.6)
    add(603.4, "owl-distant", g_owl(801), -35, -0.3, "S10-05", 0.0, 0.4)
    add(604.6, "footsteps-on-leaves", g_leaves(3.9, 811, 1.1), -37, 0.2, "S10-05", 0.2, 0.4)
    add(606.4, "guns-distant-last", g_guns_distant(3.2, 4, 119, 0.93), -32, 0.0, "S10-05/06", 0.3, 0.02, dur=ELEVEN_SIL[0] - 606.4)
    add(ELEVEN_SIL[1], "pocket-watch-tick", g_ticks(3.6, 5.0, 5.0, 557, pitch=1.8, close=True), -34, 0.1, "S10-06", 0.05, 0.6)
    add(ELEVEN_SIL[1], "birdsong-faint", g_birds(9.3, 0.6, 7, 0.7), -38, -0.1, "S10-06", 2.5, 1.5)

    # ---- s11 the cost and the legacy (620-720)
    add(620.0, "wind", g_wind(10.2, 0.3, 0.0, 46), -36, 0.0, "S11-01", 1.0, 0.8)
    add(622.5, "bird-distant", g_crow(282), -39, 0.4, "S11-01", 0.0, 0.3)
    add(630.4, "cart-wheels", g_creak(5.2, 143, wheel=True), -37, -0.2, "S11-02", 0.4, 0.6)
    add(630.2, "wind", g_wind(13.4, 0.25, 0.0, 47), -38, 0.0, "S11-02", 0.6, 0.6)
    add(635.8, "globe-hum", g_globe_hum(7.8, 732), -41, 0.0, "S11-02", 0.8, 0.8)
    for k, tt in enumerate([645.0, 646.4, 647.8, 649.2]):
        add(tt, "paper-crack", g_paper("tear", 150 + k), -34, 0.2 * (k - 1.5), "S11-03", 0.0, 0.1)
    add(653.5, "leaves-and-wind", g_wind(14.8, 0.3, 0.0, 48) + g_paper("rustle", 155, 14.8)[: ns(14.8)] * 0.3, -38, 0.0, "S11-04", 1.0, 1.0)
    add(656.0, "wood-pigeon", g_woodpigeon(821), -37, 0.35, "S11-04", 0.0, 0.3)
    add(662.6, "wood-pigeon", g_woodpigeon(822), -38, 0.35, "S11-04", 0.0, 0.3)
    add(668.3, "wind", g_wind(17.4, 0.2, 0.0, 49), -38, 0.0, "S11-05", 1.0, 1.0)
    add(668.6, "distant-bell-single", g_bells(4.0, 368, single=True, far=0.85), -34, 0.2, "S11-05", 0.0, 1.0)
    add(685.8, "murmur", g_crowd(8.3, 10, "murmur", 20, 0.65), -39, 0.0, "S11-06", 0.6, 0.6)
    add(686.6, "pen-scratch", g_pen(2.4, 110), -35, 0.0, "S11-06", 0.05, 0.2)
    for k, tt in enumerate([694.8, 696.0, 697.3]):
        add(tt, "paper-tear", g_paper("tear", 160 + k), -36, 0.2 * (k - 1), "S11-07", 0.0, 0.1)
    add(700.4, "street-wind", g_wind(4.4, 0.35, 0.0, 50), -37, 0.0, "S11-07", 0.4, 0.6)
    add(700.6, "muttering", g_crowd(4.2, 5, "hushed", 21, 0.5), -39, 0.0, "S11-07", 0.4, 0.6)
    for k, tt in enumerate([705.4, 707.0, 709.4]):
        add(tt, "chalk", g_chalk(2, 85 + k), -37, -0.2, "S11-08", 0.0, 0.05)
    return C


# ============================================================================ build
def silence_windows():
    return [
        {"what": "11 o'clock (S10-06): exactly 1.0 s of total silence (music + SFX); the guns stop at the start. "
                 "Narration b7 continues over it.", "start": ELEVEN_SIL[0], "end": ELEVEN_SIL[1],
         "startFrame": int(round(ELEVEN_SIL[0] * 30)), "endFrame": int(round(ELEVEN_SIL[1] * 30))},
        {"what": "S01-02 pistol reports + 0.6 s near-silence (music out; wing flutter only)", "start": 13.45, "end": 14.85},
        {"what": "S03-02 reports, then 0.5 s near-silence before the low cello note", "start": 126.9, "end": 127.9},
        {"what": "S06-07: 1.2 s near-silence before the s07 ink (music + SFX out)", "start": 388.8, "end": 390.0},
    ]


def main():
    out_dir = os.path.join(ENG, "public", "sfx")
    cues_json = os.path.join(ENG, "src", "timeline", "sfx-cues.json")
    if os.path.isdir(out_dir):
        shutil.rmtree(out_dir)
    os.makedirs(out_dir)
    stem = np.zeros((N, 2))
    cues = []
    table = sorted(cue_table(), key=lambda c: c["t"])
    for i, c in enumerate(table, 1):
        x = c["sig"]
        if x.ndim == 1:
            x = pan(x, c["pan"])
        elif c["pan"] != 0:
            a = (c["pan"] + 1) * np.pi / 4
            x = np.stack([x[:, 0] * np.cos(a) * 1.4142, x[:, 1] * np.sin(a) * 1.4142], axis=1)
        if c["dur"]:
            x = x[: ns(c["dur"])]
        mag = np.max(np.abs(x), axis=1)
        nz = np.where(mag > 1e-4 * mag.max())[0]
        x = x[: nz[-1] + 1] if len(nz) else x
        x = fade(x, c["fi"], c["fo"])
        x = normalize(x, undb(-1.0))
        fname = f"{i:03d}-{c['shot'].replace('/', '-')}-{c['name']}.wav"
        sf.write(os.path.join(out_dir, fname), x.astype(np.float32), SR, subtype="PCM_16")
        g = undb(c["gain"])
        place(stem, x, c["t"], g)
        cues.append({
            "id": i, "time": c["t"], "frame": int(round(c["t"] * 30)), "file": "sfx/" + fname,
            "duration": round(len(x) / SR, 3), "gainDb": c["gain"], "volume": round(g, 5),
            "pan": c["pan"], "panBaked": True, "shot": c["shot"], "name": c["name"],
        })
    # hard rules: total silence windows for SFX
    for a, b, fo in [(ELEVEN_SIL[0], ELEVEN_SIL[1], 0.01), (388.8, 390.0, 0.6), (127.4, 127.9, 0.1)]:
        i0, i1 = ns(a), ns(b)
        k = ns(fo)
        stem[i0 - k:i0] *= np.linspace(1, 0, k)[:, None]
        stem[i0:i1] = 0
    stem[ns(719.9):] = 0
    meta = {
        "episode": EP, "fps": 30, "sampleRate": SR, "durationSec": DUR,
        "note": ("Times are absolute seconds on the 720 s timeline (from narration.json beats and storyboard shot "
                 "times). Each file already has its fades and pan baked in; play it whole at `time` with "
                 "<Audio volume={volume}>. Gains are relative to public/audio/narration.wav at volume 1. "
                 "public/audio/sfx.wav is this whole list pre-placed, and public/audio/mix.wav is the measured "
                 "master (narration + music + SFX): the render should use mix.wav only."),
        "silenceWindows": silence_windows(),
        "syncPoints": {
            "titleSting": {"time": TITLE_STING, "frame": int(round(TITLE_STING * 30))},
            "pistolReports1914": [{"time": t, "frame": int(round(t * 30))} for t in SHOTS_1914],
            "pistolReportsS03": [{"time": t, "frame": int(round(t * 30))} for t in SHOTS_S03],
            "dominoClacks": [{"time": t, "frame": int(round(t * 30))} for t in DOMINO_CLACKS],
            "chalkDominoes": [{"time": t, "frame": int(round(t * 30))} for t in CHALK_DOMINOES],
            "sarajevoGlow": {"time": SARAJEVO_GLOW, "frame": int(round(SARAJEVO_GLOW * 30))},
            "hummedCarol": {"start": HUM_START, "end": WHISTLE_XMAS + 0.9},
            "christmasWhistle": {"time": WHISTLE_XMAS, "frame": int(round(WHISTLE_XMAS * 30))},
            "sommeWhistles": {"time": WHISTLES_SOMME, "frame": int(round(WHISTLES_SOMME * 30))},
            "elevenOClock": {"time": ELEVEN_SIL[0], "frame": int(round(ELEVEN_SIL[0] * 30))},
            "bugle": {"start": BUGLE[0], "end": BUGLE[1]},
            "singleInstrumentWindows": [{"start": a, "end": b, "instruments": list(s)} for a, b, s, f in EXCLUSIVE],
        },
        "cues": cues,
    }
    json.dump(meta, open(cues_json, "w"), indent=1)
    os.makedirs(os.path.join(ENG, "public", "audio"), exist_ok=True)
    sf.write(os.path.join(ENG, "public", "audio", "sfx.wav"), stem.astype(np.float32), SR, subtype="PCM_16")
    sf.write(os.path.join(PROD, f"episode-{TAG}-sfx.wav"), stem.astype(np.float32), SR, subtype="PCM_24")
    np.save(os.path.join(ENG, "output", "sfx-stem.npy"), stem.astype(np.float32))
    print(f"{len(cues)} SFX cues, {len(set(c['name'] for c in cues))} distinct sounds; stem peak {db(np.abs(stem).max()):.1f} dBFS")


if __name__ == "__main__":
    main()
