"""Shared DSP helpers for the procedural music score, sound effects and mix.

Everything here is original synthesis (numpy/scipy only): no samples, no third-party audio.
Conventions: SR = 48 kHz, mono signals are 1-D float64, stereo is (n, 2).
"""
import numpy as np
from scipy.signal import butter, sosfilt, oaconvolve, resample_poly, lfilter

SR = 48000
RNG = np.random.default_rng(1939)


# ----------------------------------------------------------------------------- basics
def t_axis(dur):
    return np.arange(int(round(dur * SR))) / SR


def ns(sec):
    return int(round(sec * SR))


def lp(x, fc, order=2):
    sos = butter(order, min(fc, SR * 0.45) / (SR / 2), btype="low", output="sos")
    return sosfilt(sos, x, axis=0)


def hp(x, fc, order=2):
    sos = butter(order, max(fc, 5) / (SR / 2), btype="high", output="sos")
    return sosfilt(sos, x, axis=0)


def bp(x, lo, hi, order=2):
    sos = butter(order, [max(lo, 5) / (SR / 2), min(hi, SR * 0.45) / (SR / 2)], btype="band", output="sos")
    return sosfilt(sos, x, axis=0)


def peak_eq(x, f0, gain_db, q=1.0):
    """RBJ peaking biquad."""
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    al = np.sin(w0) / (2 * q)
    b = np.array([1 + al * A, -2 * np.cos(w0), 1 - al * A])
    a = np.array([1 + al / A, -2 * np.cos(w0), 1 - al / A])
    return lfilter(b / a[0], a / a[0], x, axis=0)


def noise(dur, seed=None):
    r = np.random.default_rng(seed) if seed is not None else RNG
    return r.standard_normal(int(round(dur * SR)))


def noise_n(n, seed=None):
    r = np.random.default_rng(seed) if seed is not None else RNG
    return r.standard_normal(int(n))


def pink(dur, seed=None):
    """Approximate pink noise (Voss-McCartney style via filtering white noise)."""
    w = noise(dur, seed)
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    return lfilter(b, a, w) * 3.0


def brown(dur, seed=None):
    w = noise(dur, seed)
    y = lfilter([1.0], [1, -0.995], w)
    return hp(y, 15) / 12.0


def smooth_noise(n, rate_hz, seed=None):
    """Slowly varying random control signal in roughly -1..1 (rate = changes per second)."""
    r = np.random.default_rng(seed)
    k = max(2, int(n / SR * rate_hz) + 3)
    pts = r.uniform(-1, 1, k)
    xs = np.linspace(0, n, k)
    return np.interp(np.arange(n), xs, pts)


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


def env_swell(n, a=0.5, r=0.8, curve=2.0):
    """Smooth (raised-cosine) attack / release envelope for bowed or blown notes."""
    e = np.ones(n)
    a_n, r_n = min(n // 2, int(a * SR)), min(n // 2, int(r * SR))
    if a_n:
        e[:a_n] = (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, a_n))) ** (curve / 2)
    if r_n:
        e[-r_n:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, r_n))) ** (curve / 2)
    return e


def exp_decay(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def bp_env(points, n):
    """Breakpoint envelope: points [(sec, value), ...] -> array of n samples (linear interp)."""
    xs = np.array([p[0] for p in points]) * SR
    ys = np.array([p[1] for p in points])
    return np.interp(np.arange(n), xs, ys)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def nm(s):
    """'D4' / 'F#3' / 'Bb2' -> midi number."""
    k = NOTE[s[0]]
    i = 1
    while i < len(s) and s[i] in "#b":
        k += 1 if s[i] == "#" else -1
        i += 1
    return k + 12 * (int(s[i:]) + 1)


# ----------------------------------------------------------------------------- oscillators
def _phase(freq, n):
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,)) if np.ndim(freq) == 0 else freq[:n]
    dt = f / SR
    ph = np.cumsum(dt)
    return ph % 1.0, dt


def _polyblep(t, dt):
    out = np.zeros_like(t)
    m = t < dt
    x = t[m] / dt[m]
    out[m] = x + x - x * x - 1.0
    m2 = t > 1.0 - dt
    x = (t[m2] - 1.0) / dt[m2]
    out[m2] = x * x + x + x + 1.0
    return out


def blsaw(freq, n, phase0=0.0):
    """Band-limited (polyBLEP) sawtooth; freq may be a scalar or a per-sample array."""
    t, dt = _phase(freq, n)
    t = (t + phase0) % 1.0
    return (2.0 * t - 1.0) - _polyblep(t, dt)


def blsquare(freq, n, phase0=0.0, width=0.5):
    t, dt = _phase(freq, n)
    t = (t + phase0) % 1.0
    sq = np.where(t < width, 1.0, -1.0)
    sq += _polyblep(t, dt)
    sq -= _polyblep((t + 1 - width) % 1.0, dt)
    return sq


def osc_sine(freq, n, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,)) if np.ndim(freq) == 0 else freq[:n]
    return np.sin(2 * np.pi * (np.cumsum(f) / SR + phase0))


def saw(freq, dur, harmonics=24, detune_cents=0.0, phase=0.0):
    """Legacy additive saw (kept for compatibility)."""
    t = t_axis(dur)
    f = freq * 2 ** (detune_cents / 1200)
    out = np.zeros_like(t)
    nmax = int(min(harmonics, (SR * 0.45) // max(f, 1)))
    for k in range(1, nmax + 1):
        out += np.sin(2 * np.pi * k * f * t + phase * k) / k
    return out * 0.6


def sine(freq, dur, phase=0.0):
    return np.sin(2 * np.pi * freq * t_axis(dur) + phase)


def vibrato_curve(n, f0, rate=5.2, depth_cents=12, delay=0.35, seed=0):
    r = np.random.default_rng(seed)
    t = np.arange(n) / SR
    ramp = np.clip((t - delay) / 0.6, 0, 1)
    rate_var = rate * (1 + 0.06 * smooth_noise(n, 0.7, seed))
    ph = np.cumsum(rate_var) / SR
    drift = 3.0 * smooth_noise(n, 0.5, seed + 99)  # slow intonation drift (cents)
    cents = depth_cents * ramp * np.sin(2 * np.pi * ph + r.uniform(0, 6.28)) + drift
    return f0 * 2 ** (cents / 1200)


# ----------------------------------------------------------------------------- stereo utils
def pan(mono, p):
    """p in -1..1 -> stereo (equal power)."""
    a = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], axis=1)


def place(buf, sig, at, gain=1.0):
    """Add (stereo or mono) signal into stereo buffer at time `at` seconds."""
    i = int(round(at * SR))
    if i >= len(buf):
        return
    if sig.ndim == 1:
        sig = np.stack([sig, sig], axis=1) * 0.7071
    if i < 0:
        sig = sig[-i:]
        i = 0
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def reverb_ir(dur=2.6, seed=7, damp=3500, predelay=0.012):
    n = int(dur * SR)
    r = np.random.default_rng(seed)
    e = np.exp(-np.arange(n) / (dur * SR / 6.5))
    L = lp(r.standard_normal(n), damp) * e
    R = lp(r.standard_normal(n), damp) * e
    # high frequencies decay faster than lows: blend in a darker tail
    tail = np.linspace(0, 1, n)
    L = L * (1 - 0.5 * tail) + lp(L, damp / 3) * 0.5 * tail
    R = R * (1 - 0.5 * tail) + lp(R, damp / 3) * 0.5 * tail
    L[: int(predelay * SR)] *= np.linspace(0, 1, int(predelay * SR))
    R[: int((predelay + 0.005) * SR)] *= np.linspace(0, 1, int((predelay + 0.005) * SR))
    ir = np.stack([L, R], axis=1)
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def reverb(stereo, mix=0.25, dur=2.6, damp=3500, seed=7):
    ir = reverb_ir(dur, seed=seed, damp=damp)
    wet = np.stack([oaconvolve(stereo[:, 0], ir[:, 0])[: len(stereo)],
                    oaconvolve(stereo[:, 1], ir[:, 1])[: len(stereo)]], axis=1)
    return stereo * (1 - mix) + wet * mix


def fade(sig, fin=0.01, fout=0.05):
    n = len(sig)
    a, b = min(n, int(fin * SR)), min(n, int(fout * SR))
    g = np.ones(n)
    if a:
        g[:a] = np.linspace(0, 1, a)
    if b:
        g[-b:] = np.minimum(g[-b:], np.linspace(1, 0, b))
    return sig * (g[:, None] if sig.ndim == 2 else g)


def normalize(sig, peak=0.9):
    m = np.max(np.abs(sig))
    return sig * (peak / m) if m > 0 else sig


def db(x):
    return 20 * np.log10(max(x, 1e-12))


def undb(d):
    return 10 ** (d / 20)


# ----------------------------------------------------------------------------- instruments
def string_note(f0, dur, vel=0.5, a=0.6, r=1.2, voices=3, bright=1.0, seed=0, vib=10):
    """Bowed-string ensemble note: detuned band-limited saws, vibrato, body EQ, bow noise."""
    n = int((dur + r) * SR)
    rr = np.random.default_rng(seed)
    out = np.zeros(n)
    for v in range(voices):
        det = 2 ** (rr.uniform(-9, 9) / 1200)
        fr = vibrato_curve(n, f0 * det, rate=rr.uniform(4.8, 5.8), depth_cents=vib, delay=rr.uniform(0.2, 0.6), seed=seed * 7 + v)
        out += blsaw(fr, n, rr.uniform())
    out /= voices
    fc = (900 + 2600 * vel * bright) * (1 + 0.3 * np.log2(max(f0, 40) / 220))
    out = lp(out, max(500, fc), 2)
    out = peak_eq(out, 420, 2.5, 1.2)
    out = peak_eq(out, 2600, -3, 1.0)
    bow = lp(hp(noise_n(n, seed + 5), 1200), 5000) * 0.02 * vel
    out = out + bow
    e = env_swell(n, a, r)
    hold = np.ones(n)
    hold[int(dur * SR):] = 1  # release is part of env_swell
    return hp(out * e * vel, 40)


def legato_line(notes, vel=0.6, glide=0.07, vib=16, bright=1.0, timbre="cello", seed=3, a=0.25, r=1.0):
    """Expressive monophonic bowed line. notes = [(t_rel, dur, midi, vel_scale), ...]."""
    end = max(t + d for t, d, *_ in notes) + r + 0.2
    n = int(end * SR)
    f = np.zeros(n)
    amp = np.zeros(n)
    for i, (t, d, m, *vs) in enumerate(notes):
        vsc = vs[0] if vs else 1.0
        i0, i1 = int(t * SR), int((t + d) * SR)
        f[i0:] = midi(m)
        # per-note swell: crescendo to the middle, gentle decay (expressive bowing)
        k = i1 - i0
        x = np.linspace(0, 1, k)
        shape = np.minimum(1, x / max(a / max(d, 0.01), 1e-3)) ** 1.5 * (0.82 + 0.18 * np.sin(np.pi * x))
        amp[i0:i1] = np.maximum(amp[i0:i1], shape * vsc)
    # glides: smooth the pitch track
    g = max(1, int(glide * SR))
    lf = np.log2(np.maximum(f, 1))
    lf = np.convolve(np.pad(lf, (g, g), mode="edge"), np.ones(g) / g, mode="same")[g:-g]
    f = 2 ** lf
    last_end = int((notes[-1][0] + notes[-1][1]) * SR)
    amp[last_end:] = amp[last_end - 1] * np.exp(-np.arange(n - last_end) / (r * SR / 4))
    amp = np.convolve(amp, np.ones(int(0.03 * SR)) / int(0.03 * SR), mode="same")
    vibf = vibrato_curve(n, 1.0, rate=5.4, depth_cents=vib, delay=0.25, seed=seed)
    fr = f * vibf
    if timbre == "cello":
        x = blsaw(fr, n) * 0.8 + blsquare(fr, n, width=0.3) * 0.2
        x = lp(x, 2600 * bright, 2)
        x = peak_eq(x, 230, 5, 1.4)
        x = peak_eq(x, 650, 3, 1.5)
        x = peak_eq(x, 1500, 2, 2.0)
        x = peak_eq(x, 3500, -6, 1.0)
        bow = lp(hp(noise_n(n, seed + 1), 900), 4000) * 0.025
        x = x + bow
    elif timbre == "violin":
        x = blsaw(fr, n)
        x = lp(x, 4200 * bright, 2)
        x = peak_eq(x, 500, 3, 1.4)
        x = peak_eq(x, 2900, 3, 1.5)
        x = x + lp(hp(noise_n(n, seed + 1), 2000), 7000) * 0.02
    elif timbre == "horn":
        x = blsaw(fr, n)
        dark = lp(x, 700, 2)
        brt = lp(x, 2200 * bright, 2)
        w = np.clip(amp, 0, 1) ** 2
        x = dark * (1 - w) + brt * w
        x = peak_eq(x, 400, 3, 1.0)
    elif timbre == "clarinet":
        x = blsquare(fr, n) * 0.7 + blsaw(fr, n) * 0.15
        x = lp(x, 2400 * bright, 2)
        x = x + bp(noise_n(n, seed + 2), 1500, 5000) * 0.015
    elif timbre == "flute":
        x = osc_sine(fr, n) + 0.25 * osc_sine(2 * fr, n) + 0.08 * osc_sine(3 * fr, n)
        x = x + bp(noise_n(n, seed + 2), 1800, 7000) * 0.05 * np.clip(amp, 0, 1)
    elif timbre == "hum":
        # ep02: closed-mouth male humming ("mm"): glottal buzz, nasal murmur formant ~260 Hz,
        # anti-resonance ~1 kHz, faint upper formant, a little breath. No words, no lyrics.
        x = blsaw(fr, n) * 0.7 + blsquare(fr, n, width=0.18) * 0.3
        x = lp(x, 1100 * bright, 2)
        x = peak_eq(x, 260, 9, 1.6)
        x = peak_eq(x, 1000, -9, 1.5)
        x = peak_eq(x, 2300, 2, 2.5)
        x = x + lp(hp(noise_n(n, seed + 4), 300), 2500) * 0.012
    elif timbre == "bugle":
        # ep02: valveless bugle, bright conical-brass colour with a brightness envelope
        x = blsaw(fr, n)
        w = np.clip(amp, 0, 1) ** 1.5
        x = lp(x, 900, 2) * (1 - w) + lp(x, 3200 * bright, 2) * w
        x = peak_eq(x, 1100, 4, 1.2)
        x = x + bp(noise_n(n, seed + 3), 800, 4000) * 0.01 * w
    else:
        x = blsaw(fr, n)
    return hp(x * amp * vel, 45)


def brass_note(f0, dur, vel=0.6, a=0.08, r=0.6, voices=2, seed=0, dark=1.0):
    """Low brass / horns: saw with a brightness envelope (crossfade dark->bright filtered copies)."""
    n = int((dur + r) * SR)
    rr = np.random.default_rng(seed)
    x = np.zeros(n)
    for v in range(voices):
        fr = vibrato_curve(n, f0 * 2 ** (rr.uniform(-5, 5) / 1200), rate=5.0, depth_cents=5, delay=0.5, seed=seed + v)
        # little pitch scoop on the attack
        scoop = 1 - 0.012 * np.exp(-np.arange(n) / (0.04 * SR))
        x += blsaw(fr * scoop, n, rr.uniform())
    x /= voices
    e = env_adsr(n, a, 0.25, 0.8, r)
    blare = np.clip(e * vel * 1.4, 0, 1) ** 1.5
    d = lp(x, 500 * dark, 2)
    b = lp(x, (1200 + 2400 * vel) * dark, 2)
    y = d * (1 - blare) + b * blare
    y = peak_eq(y, 300, 3, 0.9)
    return hp(y * e * vel, 35)


def piano_note(f0, vel=0.5, dur=3.0, seed=0, bright=1.0):
    """Additive piano: inharmonic partials, two-stage decay, unison beating, hammer thump."""
    sustain = min(dur, 6.0)
    n = int((sustain + 1.2) * SR)
    t = np.arange(n) / SR
    B = 0.00025 * (f0 / 261.6) ** 0.5
    out = np.zeros(n)
    rr = np.random.default_rng(seed)
    nh = int(min(18, (SR * 0.42) // f0))
    for k in range(1, nh + 1):
        fk = k * f0 * np.sqrt(1 + B * k * k)
        ak = (1 / k ** (1.1 + 0.6 * (1 - vel) / bright)) * (1 + 0.5 * np.sin(k * 1.3))
        tau1 = 0.45 * (300 / f0) ** 0.35 / (1 + 0.18 * k)
        tau2 = 3.5 * (300 / f0) ** 0.5 / (1 + 0.12 * k)
        env = 0.6 * np.exp(-t / tau1) + 0.4 * np.exp(-t / tau2)
        det = 1 + rr.uniform(0.2, 0.9) / 1200 * 2
        ph = rr.uniform(0, 6.28)
        out += ak * env * (np.sin(2 * np.pi * fk * t + ph) + 0.6 * np.sin(2 * np.pi * fk * det * t + ph))
    thump = lp(noise(0.03, seed), 1800) * exp_decay(int(0.03 * SR), 0.006) * 0.15 * vel
    out[: len(thump)] += thump
    # damper at note end
    off = int(sustain * SR)
    damp = np.ones(n)
    damp[off:] = np.exp(-np.arange(n - off) / (0.18 * SR))
    out *= damp
    return lp(out * vel, 1500 + 6000 * vel * bright) * 0.35


def pizz_note(f0, vel=0.5, seed=0):
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, int(min(14, (SR * 0.4) // f0)) + 1):
        out += np.sin(2 * np.pi * k * f0 * t * (1 + 0.0003 * k)) / k ** 1.4 * np.exp(-t * (6 + 5 * k))
    out = peak_eq(out, 400, 4, 1.2)
    click = lp(noise(0.01, seed), 3000) * np.linspace(1, 0, int(0.01 * SR)) * 0.2
    out[: len(click)] += click
    return out * vel * 0.8


def timpani(f0, vel=0.6, decay=1.6, seed=0):
    n = int((decay * 2.2) * SR)
    t = np.arange(n) / SR
    fr = f0 * (1 + 0.06 * np.exp(-t / 0.05))
    body = osc_sine(fr, n) * np.exp(-t / decay) + 0.5 * osc_sine(fr * 1.505, n) * np.exp(-t / (decay * 0.5)) \
        + 0.3 * osc_sine(fr * 1.98, n) * np.exp(-t / (decay * 0.35))
    hit = lp(noise_n(n, seed), 900) * np.exp(-t / 0.035) * 0.6
    return (body + hit) * vel * 0.6


def timp_roll(f0, dur, v0=0.05, v1=0.6, rate=14, seed=0):
    n = int((dur + 2.5) * SR)
    out = np.zeros(n)
    rr = np.random.default_rng(seed)
    k = int(dur * rate)
    for i in range(k):
        x = i / max(1, k - 1)
        v = v0 + (v1 - v0) * x ** 1.6
        tt = i / rate + rr.uniform(-0.008, 0.008)
        s = timpani(f0, v * rr.uniform(0.8, 1.0), decay=1.2, seed=seed + i)
        a = int(max(0, tt) * SR)
        b = min(n, a + len(s))
        out[a:b] += s[: b - a]
    return out * 0.45


def war_drum(vel=0.6, f0=58, seed=0):
    """Low, soft-mallet bass drum (no boom-cliché, short)."""
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    fr = f0 * (1 + 0.5 * np.exp(-t / 0.03))
    body = osc_sine(fr, n) * np.exp(-t / 0.35)
    skin = bp(noise_n(n, seed), 80, 700) * np.exp(-t / 0.05) * 0.5
    return (body + skin) * vel * 0.8


def snare_soft(vel=0.4, seed=0):
    """Distant military side drum with brushes-like softness."""
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    tone = osc_sine(185 * (1 + 0.1 * np.exp(-t / 0.01)), n) * np.exp(-t / 0.06)
    sn = bp(noise_n(n, seed), 1500, 7000) * np.exp(-t / 0.09)
    return lp(tone * 0.5 + sn * 0.8, 6000) * vel * 0.5


def pulse_thump(vel=0.5, f0=46, seed=0):
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    return osc_sine(f0 * (1 + 0.25 * np.exp(-t / 0.02)), n) * np.exp(-t / 0.18) * vel * (1 - np.exp(-t / 0.004))


def bell_tone(f0, vel=0.5, decay=4.0, seed=0):
    """Tuned bell / celesta-ish tone (inharmonic additive)."""
    n = int(decay * 1.5 * SR)
    t = np.arange(n) / SR
    ratios = [(0.5, 0.6, 1.4), (1.0, 1.0, 1.0), (1.19, 0.4, 0.7), (1.5, 0.35, 0.6), (2.0, 0.3, 0.5),
              (2.5, 0.2, 0.35), (2.66, 0.15, 0.3), (3.0, 0.12, 0.25), (4.07, 0.08, 0.18)]
    out = np.zeros(n)
    for r, a, dk in ratios:
        if f0 * r < SR * 0.45:
            out += a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / (decay * dk))
    out *= 1 - np.exp(-t / 0.002)
    return out * vel * 0.4


# ----------------------------------------------------------------------------- loudness / dynamics
def _kweight(x):
    # ITU-R BS.1770-4 K-weighting coefficients at 48 kHz
    b1 = [1.53512485958697, -2.69169618940638, 1.19839281085285]
    a1 = [1.0, -1.69065929318241, 0.73248077421585]
    b2 = [1.0, -2.0, 1.0]
    a2 = [1.0, -1.99004745483398, 0.99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)


def block_loudness(x, block=0.4, hop=0.1):
    """Momentary loudness (LUFS) per 400 ms block, hop 100 ms. Returns (times, lufs)."""
    if x.ndim == 1:
        x = x[:, None]
    y = _kweight(x)
    p = np.sum(y ** 2, axis=1)
    c = np.concatenate([[0], np.cumsum(p)])
    bn, hn = int(block * SR), int(hop * SR)
    starts = np.arange(0, len(p) - bn + 1, hn)
    ms = (c[starts + bn] - c[starts]) / bn
    return starts / SR, -0.691 + 10 * np.log10(np.maximum(ms, 1e-20)), ms


def integrated_lufs(x, mask_fn=None):
    """BS.1770 integrated loudness with absolute (-70) and relative (-10) gates.
    mask_fn(t_block_start) -> bool restricts which blocks are included (used for speech-only stats)."""
    ts, l, ms = block_loudness(x)
    sel = l > -70
    if mask_fn is not None:
        sel &= np.array([mask_fn(t) for t in ts])
    if not np.any(sel):
        return -np.inf
    rel = -0.691 + 10 * np.log10(np.mean(ms[sel])) - 10
    sel2 = sel & (l > rel)
    return -0.691 + 10 * np.log10(np.mean(ms[sel2]))


def true_peak_db(x, os=4):
    if x.ndim == 1:
        x = x[:, None]
    m = 0.0
    for c in range(x.shape[1]):
        u = resample_poly(x[:, c], os, 1)
        m = max(m, np.max(np.abs(u)))
    return db(m)


def limiter(x, ceiling_db=-1.5, lookahead=0.005, release=0.12, os=4):
    """Look-ahead brick-wall limiter on a true-peak (4x oversampled) envelope."""
    if x.ndim == 1:
        x = x[:, None]
    ceil = undb(ceiling_db)
    pk = np.zeros(len(x))
    for c in range(x.shape[1]):
        u = np.abs(resample_poly(x[:, c], os, 1))
        u = u[: len(x) * os].reshape(-1, os).max(axis=1)
        pk = np.maximum(pk, u[: len(x)])
    need = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    la = max(1, int(lookahead * SR))
    # look-ahead: minimum over the next `la` samples (sliding min via reversed max filter)
    from scipy.ndimage import minimum_filter1d
    g = minimum_filter1d(need, size=2 * la + 1, mode="nearest")
    # release smoothing (one-pole, only on the way up) then attack smoothing with a short window
    # instant attack (already looked ahead), exponential release, on a 1 ms grid
    cur = 1.0
    gi = g
    step = 48
    gs = gi[: len(gi) // step * step].reshape(-1, step).min(axis=1)
    gs = np.concatenate([gs, [gi[len(gs) * step:].min()] if len(gi) % step else []])
    rel_s = np.exp(-step / (release * SR))
    sm = np.empty_like(gs)
    for i, v in enumerate(gs):
        cur = v if v < cur else v + (cur - v) * rel_s
        sm[i] = cur
    # smooth the attack over the look-ahead window so there is no click
    k = max(1, la // step)
    sm = np.minimum(sm, np.convolve(np.pad(sm, (k, k), mode="edge"), np.ones(2 * k + 1) / (2 * k + 1), mode="same")[k:-k])
    out = np.interp(np.arange(len(x)), np.arange(len(sm)) * step + step / 2, sm)
    out = np.minimum(out, g)
    y = x * out[:, None]
    return y, out


def compressor(x, thr_db=-24, ratio=2.5, attack=0.008, release=0.15, knee=6):
    """Simple feed-forward RMS compressor (mono or stereo-linked)."""
    m = x if x.ndim == 1 else np.max(np.abs(x), axis=1)
    win = max(1, int(0.005 * SR))
    rms = np.sqrt(np.convolve(m ** 2, np.ones(win) / win, mode="same") + 1e-12)
    lv = 20 * np.log10(rms)
    over = lv - thr_db
    gr = np.where(over <= -knee / 2, 0,
                  np.where(over >= knee / 2, over * (1 - 1 / ratio),
                           (1 - 1 / ratio) * (over + knee / 2) ** 2 / (2 * knee)))
    # smooth gain reduction (attack/release) on a 1 ms grid
    step = 48
    g = gr[: len(gr) // step * step].reshape(-1, step).max(axis=1)
    a_c, r_c = np.exp(-step / (attack * SR)), np.exp(-step / (release * SR))
    sm = np.empty_like(g)
    cur = 0.0
    for i, v in enumerate(g):
        c = a_c if v > cur else r_c
        cur = v + (cur - v) * c
        sm[i] = cur
    gain = undb(-np.interp(np.arange(len(m)), np.arange(len(sm)) * step + step / 2, sm))
    return (x * gain) if x.ndim == 1 else x * gain[:, None]
