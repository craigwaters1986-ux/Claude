#!/usr/bin/env python3
"""Original procedural score for ep01-ww2 ("World War II: How It Started, How It Ended").

Every note is synthesised here (audio_lib instruments), cued to the real sentence timings in
src/timeline/narration.json, so the music follows the words. Home key D minor; the channel
motif "The Human Story" (A-D-E-F, E-D-C-D) appears in the title sting, as Churchill's resolute
theme, and in D major at the close.

Outputs
  output/music-stems/*.wav                 (per-instrument stems, un-ducked; for inspection)
  production/audio/ep01-ww2/episode-01-music.wav   un-ducked music stem, 605 s
  public/audio/music.wav                   music ducked under the narration (used by the render)
  output/music-duck.npy                    the ducking gain curve (for the mix script)

Run:  python3 scripts/music.py
"""
import json
import os
import sys
import time

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_lib import *  # noqa

HERE = os.path.dirname(os.path.abspath(__file__))
ENG = os.path.dirname(HERE)
ROOT = os.path.abspath(os.path.join(ENG, "..", ".."))
PROD = os.path.join(ROOT, "production", "audio", "ep01-ww2")
DUR = 605.0
N = int(DUR * SR)

NAR = json.load(open(os.path.join(ENG, "src", "timeline", "narration.json")))
SEC = {s["id"]: s for s in NAR["sections"]}


def T(sec, k):
    """start (s) of sentence k in section sec"""
    return SEC[sec]["sentences"][k]["start"]


def E(sec, k):
    return SEC[sec]["sentences"][k]["end"]


def ch(s):
    return [nm(x) for x in s.split()]


# ----------------------------------------------------------------------------- key moments
HIRO_FLASH = round(E("s10", 3), 2)          # 533.08: white flash on "...Hiroshima."
HIRO_SIL = (HIRO_FLASH, HIRO_FLASH + 1.5)    # total silence (music + SFX)
NAGA_GLOW = 549.50                           # glow on "devastated Nagasaki"
NAGA_SIL = (NAGA_GLOW, NAGA_GLOW + 1.0)
TITLE_STING = 22.90

# music fully out (mask applied after reverb, so tails are cut too): (start, end, fade_out, fade_in)
MUSIC_SILENCE = [
    (E("s03", 8) + 0.05, T("s03", 10) - 0.05, 0.10, 0.02),   # "It didn't work." (141.1-142.3)
    (311.45, 313.0, 0.45, 1.2),                               # Pearl Harbor: music out
    (E("s09", 2) + 0.02, T("s09", 3) + 0.02, 0.5, 0.6),       # 0.5 s before the Holocaust note
    (E("s09", 4), T("s09", 5), 0.6, 0.05),                    # 0.7 s held silence
    (HIRO_SIL[0], HIRO_SIL[1], 0.025, 1.5),                   # Hiroshima flash: everything cuts
    (NAGA_SIL[0], NAGA_SIL[1], 0.35, 0.3),                    # Nagasaki glow
    (NAGA_SIL[1], 553.4, 0.01, 2.0),                          # wind + radio only, music then soft
    (604.80, 605.0, 0.01, 0.0),                               # clean end
]


class Score:
    STEMS = {  # name: (reverb mix, reverb length, damping, gain)
        "strings": (0.32, 3.4, 4200, 1.0),
        "low": (0.22, 2.8, 2500, 1.0),
        "brass": (0.30, 3.0, 3200, 0.8),
        "horn": (0.34, 3.2, 3000, 0.8),
        "piano": (0.30, 3.0, 5000, 1.0),
        "wood": (0.30, 2.8, 5000, 0.8),
        "solo": (0.36, 3.8, 3800, 1.0),
        "pizz": (0.26, 2.4, 4000, 0.9),
        "perc": (0.20, 2.4, 2500, 0.9),
        "bells": (0.38, 3.6, 5000, 0.7),
    }

    def __init__(self):
        self.b = {k: np.zeros((N, 2)) for k in self.STEMS}
        self.seed = 100

    def _s(self):
        self.seed += 1
        return self.seed

    def add(self, stem, sig, at, p=0.0, gain=1.0):
        place(self.b[stem], pan(sig, p) if sig.ndim == 1 else sig, at, gain)

    # --- string pads -------------------------------------------------------------
    def pad(self, t0, t1, notes, vel=0.35, a=0.8, r=1.4, stem="strings", bright=1.0, spread=0.6, voices=3):
        if isinstance(notes, str):
            notes = ch(notes)
        lo, hi = min(notes), max(notes)
        for m in notes:
            p = 0 if hi == lo else (m - lo) / (hi - lo) * 2 - 1
            p = p * spread + np.random.default_rng(self._s()).uniform(-0.1, 0.1)
            v = vel * (0.85 if m < 48 else 1.0)
            st = "low" if (m < 50 and stem == "strings") else stem
            self.add(st, string_note(midi(m), t1 - t0, v, a=a, r=r, seed=self._s(), bright=bright, voices=voices), t0, p)

    def prog(self, seq, vel=0.35, a=0.8, r=1.4, stem="strings", bright=1.0, overlap=0.25, **kw):
        """seq = [(t0, t1, 'notes'), ...]; consecutive chords overlap slightly for legato."""
        for t0, t1, notes in seq:
            v = vel(t0) if callable(vel) else vel
            self.pad(t0, t1 + overlap, notes, v, a=a, r=r, stem=stem, bright=bright, **kw)

    def swell(self, t0, t1, notes, v0, v1, stem="strings", r=1.5, bright=1.0):
        """Crescendo/decrescendo chord: rendered as one long note with an amplitude curve."""
        if isinstance(notes, str):
            notes = ch(notes)
        lo, hi = min(notes), max(notes)
        n_len = int((t1 - t0 + r) * SR)
        curve = np.interp(np.arange(n_len) / SR, [0, t1 - t0, t1 - t0 + r], [v0, v1, 0])
        for m in notes:
            p = 0 if hi == lo else ((m - lo) / (hi - lo) * 2 - 1) * 0.6
            x = string_note(midi(m), t1 - t0, 1.0, a=0.3, r=r, seed=self._s(), bright=bright)
            x = x[:n_len] * curve[: len(x)]
            self.add("low" if m < 50 and stem == "strings" else stem, x, t0, p)

    # --- melodic lines -----------------------------------------------------------
    def line(self, stem, t0, notes, bpm, timbre="cello", vel=0.5, p=0.0, **kw):
        """notes = [(beat_offset, beats, 'D4' or midi, vel_scale?), ...]"""
        bt = 60.0 / bpm
        evs = []
        for nt in notes:
            b, d, m = nt[0], nt[1], nt[2]
            vs = nt[3] if len(nt) > 3 else 1.0
            evs.append((b * bt, d * bt, nm(m) if isinstance(m, str) else m, vs))
        sig = legato_line(evs, vel=vel, timbre=timbre, seed=self._s(), **kw)
        self.add(stem, sig, t0, p)

    def brass(self, t, dur, notes, vel=0.5, stem="brass", a=0.08, r=0.8, p=-0.15, dark=1.0):
        if isinstance(notes, str):
            notes = ch(notes)
        for i, m in enumerate(notes):
            self.add(stem, brass_note(midi(m), dur, vel, a=a, r=r, seed=self._s(), dark=dark), t, p + 0.1 * (i - len(notes) / 2) / max(1, len(notes)))

    # --- rhythmic parts ----------------------------------------------------------
    def ostinato(self, t0, t1, bpm, sub, pattern, vel=0.3, kind="spicc", accent=(1.0,), cresc=None, p=0.0, stem=None):
        """Repeat `pattern` (midi or note names; None = rest) at `sub` notes per beat."""
        step = 60.0 / bpm / sub
        pat = [nm(x) if isinstance(x, str) else x for x in pattern]
        k = 0
        t = t0
        while t < t1 - 1e-6:
            m = pat[k % len(pat)]
            if m is not None:
                v = vel * accent[k % len(accent)]
                if cresc:
                    x = (t - t0) / max(1e-6, t1 - t0)
                    v *= cresc[0] + (cresc[1] - cresc[0]) * x
                ms = m if isinstance(m, (list, tuple)) else [m]
                for mm in ms:
                    if kind == "spicc":
                        sig = string_note(midi(mm), step * 0.55, v, a=0.012, r=0.14, voices=2, seed=self._s(), vib=4)
                        self.add(stem or ("low" if mm < 50 else "strings"), sig, t, p)
                    elif kind == "pizz":
                        self.add(stem or "pizz", pizz_note(midi(mm), v, seed=self._s()), t, p)
                    elif kind == "piano":
                        self.add(stem or "piano", piano_note(midi(mm), v, dur=step * 1.6, seed=self._s()), t, p + (mm - 60) / 60)
                    elif kind == "brass":
                        self.add(stem or "brass", brass_note(midi(mm), step * 0.6, v, a=0.02, r=0.2, seed=self._s()), t, p)
                    elif kind == "bell":
                        self.add(stem or "bells", bell_tone(midi(mm), v, decay=2.5, seed=self._s()), t, p)
            k += 1
            t = t0 + k * step

    def arp(self, seq, bpm, sub, order, vel=0.3, p=0.0, sustain=1.8):
        """Piano arpeggio over chords: seq = [(t0, t1, 'notes')], order = indexes into chord."""
        for t0, t1, notes in seq:
            ns_ = ch(notes)
            step = 60.0 / bpm / sub
            k = 0
            t = t0
            while t < t1 - 1e-6:
                i = order[k % len(order)]
                if i is not None:
                    m = ns_[i % len(ns_)] + 12 * (i // len(ns_))
                    v = vel * (1.0 if k % len(order) == 0 else 0.75) * np.random.default_rng(self._s()).uniform(0.85, 1.05)
                    self.add("piano", piano_note(midi(m), v, dur=sustain, seed=self._s()), t, (m - 64) / 40 + p)
                k += 1
                t = t0 + k * step

    def piano(self, t, notes, vel=0.3, dur=3.0):
        if isinstance(notes, str):
            notes = ch(notes)
        for i, m in enumerate(notes):
            self.add("piano", piano_note(midi(m), vel, dur=dur, seed=self._s()), t + 0.012 * i, (m - 64) / 40)

    def timp(self, t, note="D2", vel=0.5, decay=1.6):
        self.add("perc", timpani(midi(nm(note)), vel, decay, seed=self._s()), t, 0.0)

    def roll(self, t, dur, note="D2", v0=0.05, v1=0.6):
        self.add("perc", timp_roll(midi(nm(note)), dur, v0, v1, seed=self._s()), t, 0.0)

    def drums(self, t0, t1, bpm, pattern, vel=0.4, cresc=None):
        """pattern chars per 8th note: B = low war drum, b = soft war drum, S = side drum, s = soft side, . = rest"""
        step = 60.0 / bpm / 2
        k = 0
        while t0 + k * step < t1 - 1e-6:
            t = t0 + k * step
            c = pattern[k % len(pattern)]
            v = vel
            if cresc:
                v *= cresc[0] + (cresc[1] - cresc[0]) * (t - t0) / (t1 - t0)
            if c == "B":
                self.add("perc", war_drum(v, seed=self._s()), t, 0)
            elif c == "b":
                self.add("perc", war_drum(v * 0.5, seed=self._s()), t, 0)
            elif c == "S":
                self.add("perc", snare_soft(v, seed=self._s()), t, 0.15)
            elif c == "s":
                self.add("perc", snare_soft(v * 0.45, seed=self._s()), t, 0.15)
            elif c == "P":
                self.add("perc", pulse_thump(v, seed=self._s()), t, 0)
            k += 1

    def pulse(self, t0, t1, bpm, vel=0.5, f0=46, double=False, cresc=None):
        step = 60.0 / bpm
        k = 0
        while t0 + k * step < t1 - 1e-6:
            t = t0 + k * step
            v = vel * ((cresc[0] + (cresc[1] - cresc[0]) * (t - t0) / (t1 - t0)) if cresc else 1)
            self.add("perc", pulse_thump(v, f0, seed=self._s()), t, 0)
            if double:
                self.add("perc", pulse_thump(v * 0.6, f0, seed=self._s()), t + step * 0.28, 0)
            k += 1

    def bell(self, t, note, vel=0.3, decay=4.0, p=0.2):
        self.add("bells", bell_tone(midi(nm(note)), vel, decay, seed=self._s()), t, p)

    # --- render ----------------------------------------------------------------------
    def render(self, stem_dir=None):
        out = np.zeros((N, 2))
        for k, (mix, d, damp, g) in self.STEMS.items():
            x = self.b[k]
            if np.max(np.abs(x)) == 0:
                continue
            x = reverb(x, mix=mix, dur=d, damp=damp, seed=sum(map(ord, k)))
            x = hp(x, 32)
            if stem_dir:
                sf.write(os.path.join(stem_dir, k + ".wav"), (x * 0.25).astype(np.float32), SR, subtype="FLOAT")
            out += x * g
        return out


# ============================================================================== composition
def compose(S):
    # ---------------------------------------------------------------- s01 THE HOOK (0-30)
    # warm summer: D major piano + strings, a darker note at 7.0, low drone, pulse, suspension
    S.arp([(0.6, 3.9, "D3 A3 D4 F#4 A4"), (3.9, 7.0, "G2 D3 G3 B3 D4")], bpm=72, sub=2,
          order=[0, 2, 3, 4, 3, 2], vel=0.22, sustain=2.0)
    S.prog([(0.2, 3.9, "D3 A3 F#4"), (3.9, 7.0, "G2 D3 B3")], vel=0.20, a=1.4, r=1.0)
    S.line("wood", 1.4, [(0, 1, "A4"), (1, 1, "D5"), (2, 0.5, "E5"), (2.5, 2.5, "F#5"),
                         (5.0, 1, "E5"), (6.0, 1.5, "D5")], bpm=72, timbre="flute", vel=0.12, p=0.25)
    # 7.0: first darker note (Bb under), into the low drone at 7.4
    S.pad(7.0, 13.6, "Bb1 Bb2", vel=0.34, a=0.5, r=1.5)
    S.swell(7.35, 13.4, "D2 A2 D3 F3", 0.08, 0.30, r=1.6, bright=0.7)
    S.swell(9.5, 13.4, "E4 F4", 0.0, 0.07, r=1.2, bright=0.6)          # cluster tension above
    # 13.5-19.0 low pulse under "Countries will fall / Cities will burn / Tens of millions"
    S.pulse(T("s01", 3), E("s01", 5) - 0.2, bpm=60, vel=0.45, double=True, cresc=(0.8, 1.0))
    S.pad(13.5, 18.9, "D2 A2", vel=0.26, a=0.6, r=0.25)
    S.swell(15.3, 18.8, "Bb3 D4 F4", 0.04, 0.16, r=0.3, bright=0.7)
    # 19.0-19.7 near-silence; 19.7-22.6 suspended faint fifth (A4 E5)
    S.swell(19.75, 22.35, "A4 E5", 0.035, 0.05, r=0.35, bright=0.5)
    # 22.9 title sting: timpani roll -> full chord, horn statement of the channel motif
    S.roll(TITLE_STING, 1.05, "D2", 0.04, 0.55)
    S.timp(TITLE_STING + 1.05, "D2", 0.75, 2.2)
    S.brass(TITLE_STING + 1.05, 2.6, "D2 A2 D3", 0.55, r=1.6)
    S.pad(TITLE_STING + 1.05, 26.4, "D3 A3 D4 F4 A4 E5", vel=0.36, a=0.08, r=1.8, bright=1.2)
    S.line("horn", TITLE_STING + 1.15, [(0, 0.6, "A3"), (0.6, 0.6, "D4"), (1.2, 0.5, "E4"), (1.7, 2.2, "F4", 1.1),
                                        (3.9, 0.6, "E4", 0.9), (4.5, 0.6, "D4", 0.85), (5.1, 0.6, "C4", 0.8),
                                        (5.7, 2.0, "D4", 0.75)], bpm=88, timbre="horn", vel=0.42, p=-0.1)
    S.prog([(26.2, 28.2, "Bb2 F3 D4 F4"), (28.2, 30.6, "C3 G3 E4"), ], vel=0.27, a=0.6, r=1.5)
    S.prog([(29.4, 33.1, "D3 A3 F4")], vel=0.16, a=1.2)                  # settles into the s02 bed

    # ---------------------------------------------------------------- s02 AFTER WWI (30-90)
    S.prog([(33.0, T("s02", 1), "D3 G3 Bb3 D4"),
            (T("s02", 1), 38.4, "Bb2 F3 D4"), (38.4, T("s02", 2), "A2 E3 C#4"),
            (T("s02", 2), 44.8, "G2 D3 Bb3 D4"), (44.8, T("s02", 3), "Eb3 Bb3 G4"),
            (T("s02", 3), 51.0, "D3 A3 F4"), (51.0, 53.8, "Bb2 F3 D4"), (53.8, 56.6, "G2 D3 Bb3"),
            (56.6, T("s02", 4), "A2 E3 C#4"), (T("s02", 4), T("s02", 5), "F2 C3 A3 D4"),
            (T("s02", 5), 64.6, "G2 D3 Bb3"), (64.6, T("s02", 6), "A2 E3 G3 C#4")], vel=0.2, a=1.0, r=1.4)
    # sombre cello line for the defeat of 1918
    S.line("solo", T("s02", 1) + 0.3, [(0, 2, "F3"), (2, 1, "E3"), (3, 1, "D3"), (4, 3, "C#3", 0.9)],
           bpm=60, timbre="cello", vel=0.16, p=-0.2)
    # high, quiet violin line over the treaty (formal, uneasy)
    S.line("solo", T("s02", 2) + 0.2, [(0, 2, "D5"), (2, 1, "C5"), (3, 2, "Bb4"), (5, 1, "A4"), (6, 2, "G4"),
                                        (8, 1, "A4"), (9, 3, "Bb4"), (12, 2, "A4"), (14, 2, "F4"),
                                        (16, 4, "E4", 0.8)], bpm=62, timbre="violin", vel=0.09, p=0.3)
    S.line("wood", T("s02", 3) + 4.0, [(0, 1.5, "F4"), (1.5, 0.5, "E4"), (2, 2, "D4"), (4, 1, "C#4"), (5, 3, "D4")],
           bpm=60, timbre="clarinet", vel=0.08, p=0.35)
    # 1929: tense pizzicato
    S.ostinato(T("s02", 6) - 0.1, T("s02", 8), bpm=126, sub=2,
               pattern=["D3", "A3", "F3", "A3", "D3", "Bb3", "F3", "Bb3"], vel=0.32, kind="pizz", accent=(1, .7, .8, .7), p=-0.3)
    S.prog([(T("s02", 6), T("s02", 7), "D3 A3 F4"), (T("s02", 7), 74.2, "Bb2 F3 D4"),
            (74.2, T("s02", 8), "A2 E3 C#4")], vel=0.15, a=0.5, r=1.0)
    S.ostinato(T("s02", 7), T("s02", 8), bpm=126, sub=1, pattern=["D2", None, "A1", None], vel=0.25, kind="pizz", p=0.0)
    # darkens to a single low note and a slow pulse as the shadow arrives
    S.prog([(T("s02", 8), T("s02", 9), "D3 F3 A3"), (T("s02", 9), 83.5, "Bb2 D3 G3")], vel=0.17, a=0.6, r=1.6)
    S.swell(83.0, 90.4, "D2 D3", 0.12, 0.28, r=1.4, bright=0.6)
    S.pulse(84.0, 90.6, bpm=50, vel=0.35, f0=44, cresc=(0.6, 1.0))

    # ---------------------------------------------------------------- s03 HITLER'S RISE (90-150)
    S.pad(90.4, T("s03", 1), "D2 A2 D3", vel=0.22, a=0.8, r=0.8, stem="strings")
    S.ostinato(90.6, T("s03", 1), bpm=80, sub=1, pattern=[["D2", "A2"], None], vel=0.30, kind="brass", p=-0.1)
    # propaganda: music tightens (semitone D/Eb spiccato)
    S.ostinato(T("s03", 1), T("s03", 2) - 0.3, bpm=100, sub=2, pattern=["D3", "D3", "Eb3", "D3"], vel=0.20, kind="spicc", cresc=(0.7, 1.1))
    S.prog([(T("s03", 1), 99.8, "D3 A3 F4"), (99.8, T("s03", 2), "Eb3 Bb3 G4")], vel=0.15, a=0.8)
    # Chancellor: a low sting (tritone), then held
    S.brass(T("s03", 2) + 0.05, 3.6, "D2 Ab2 D3", 0.42, a=0.06, r=1.2)
    S.timp(T("s03", 2) + 0.05, "D2", 0.45)
    S.pad(T("s03", 2) + 0.05, T("s03", 3), "D3 Ab3 F4", vel=0.16, a=0.4)
    # banned parties, press, camps: tense
    S.ostinato(T("s03", 3), T("s03", 4), bpm=100, sub=2, pattern=["D2", "D3", "Eb3", "D3", "D2", "D3", "C3", "D3"], vel=0.19, kind="spicc")
    S.prog([(T("s03", 3), 111.7, "G2 D3 Bb3"), (111.7, T("s03", 4), "Eb3 G3 C4")], vel=0.14)
    # ideology: low drone; stripped of rights / rearmament: no sting, drone only
    S.pad(T("s03", 4), T("s03", 6), "D2 A2", vel=0.20, a=0.8, r=1.0)
    S.swell(T("s03", 4), T("s03", 5), "F3 Bb3", 0.06, 0.10, r=0.8, bright=0.6)
    # Rhineland, Austria: low marching drum, music builds
    S.drums(T("s03", 6), T("s03", 8), bpm=104, pattern="Bs.sSs.s", vel=0.32, cresc=(0.6, 1.0))
    S.prog([(T("s03", 6), 126.8, "D2 A2 F3"), (126.8, T("s03", 7), "Bb1 F2 D3"),
            (T("s03", 7), 131.3, "C2 G2 E3"), (131.3, T("s03", 8), "A1 E2 C#3")], vel=0.2, a=0.4, r=0.8)
    S.line("brass", T("s03", 6) + 0.4, [(0, 2, "D3"), (2, 2, "F3"), (4, 2, "E3"), (6, 2, "D3"),
                                         (8, 1, "C3"), (9, 1, "D3"), (10, 2, "E3"), (12, 3, "A2")], bpm=104, timbre="horn", vel=0.22)
    # Munich: an uneasy waltz (3/4, 132 bpm), slightly sour
    wz = 60 / 132.0
    t = T("s03", 8)
    bars = [("D2", "F3 A3 D4"), ("A1", "E3 G3 C#4"), ("D2", "F3 A3 D4"), ("C2", "F3 A3 D4"),
            ("Bb1", "F3 Bb3 D4"), ("A1", "E3 G3 C#4"), ("D2", "F3 Ab3 D4"), ("A1", "E3 G3 C#4"),
            ("D2", "F3 A3 D4"), ("Bb1", "F3 Bb3 D4"), ("A1", "E3 G3 C#4"), ("D2", "F3 A3 D4")]
    for bi, (bass, chord_) in enumerate(bars):
        tb = t + bi * 3 * wz
        if tb > E("s03", 8) - 0.2:
            break
        S.add("pizz", pizz_note(midi(nm(bass)), 0.38, seed=S._s()), tb, -0.2)
        for beat in (1, 2):
            for m in ch(chord_):
                S.add("strings", string_note(midi(m) * 2 ** (np.random.default_rng(S._s()).uniform(-12, 12) / 1200),
                                             wz * 0.5, 0.11, a=0.02, r=0.25, voices=2, seed=S._s(), vib=6), tb + beat * wz, 0.2)
    S.line("wood", t + 3 * wz, [(0, 2, "A4"), (2, 1, "F4"), (3, 2, "E4"), (5, 1, "G4"), (6, 3, "F4"),
                                (9, 2, "D4"), (11, 1, "E4"), (12, 2, "F4"), (14, 1, "Ab4"), (15, 3, "G4")],
           bpm=132, timbre="clarinet", vel=0.10, p=0.3)
    # (music stops on "It didn't work." - see MUSIC_SILENCE)
    # occupation of the Czech lands: ominous resolve (half cadence)
    S.timp(T("s03", 10) + 0.05, "D2", 0.35)
    S.prog([(T("s03", 10), 144.4, "D2 A2 D3 F3"), (144.4, 146.4, "Bb1 F2 D3"), (146.4, 148.3, "G1 D2 Bb2 G3"),
            (148.3, 150.6, "A1 E2 C#3 A3")], vel=0.22, a=0.25, r=1.2)
    S.brass(T("s03", 10) + 0.05, 2.0, "D2 A2", 0.30, r=1.0)
    S.brass(148.3, 2.0, "A1 E2", 0.30, a=0.3, r=1.4)

    # ---------------------------------------------------------------- s04 WWII BEGINS (150-210)
    # tense low-string ostinato
    S.ostinato(150.4, T("s04", 3) - 0.5, bpm=92, sub=4,
               pattern=["D2", "D2", "F2", "D2", "E2", "D2", "F2", "A1"], vel=0.17, kind="spicc", stem="low", accent=(1.2, .7, .9, .7))
    S.prog([(150.4, T("s04", 1), "D3 A3 F4"), (T("s04", 1), 159.4, "Bb2 F3 D4"), (159.4, T("s04", 2), "G2 D3 Bb3"),
            (T("s04", 2), 166.8, "D3 F3 Bb3"), (166.8, T("s04", 3), "E3 G3 Bb3 C#4")], vel=0.14, a=0.9)
    # invasion: urgent, driving
    S.timp(T("s04", 3), "D2", 0.6)
    S.brass(T("s04", 3), 1.3, "D2 A2 D3", 0.42, r=0.8)
    S.ostinato(T("s04", 3), T("s04", 5) - 0.1, bpm=138, sub=2,
               pattern=["D3", "D3", "A2", "D3", "F3", "D3", "A2", "D3"], vel=0.20, kind="spicc", accent=(1.3, .7, .8, .7))
    S.ostinato(T("s04", 3), T("s04", 5) - 0.1, bpm=138, sub=1, pattern=["D2", "D2", "D2", "C2", "Bb1", "Bb1", "C2", "C2"],
               vel=0.18, kind="spicc", stem="low")
    S.drums(T("s04", 3), T("s04", 5) - 0.1, bpm=138, pattern="B.s.b.S.", vel=0.30, cresc=(0.8, 1.1))
    bar = 4 * 60 / 138
    for i, c in enumerate(["D3 A3 F4", "Bb2 F3 D4", "C3 G3 E4", "A2 E3 C#4"] * 3):
        t0 = T("s04", 3) + i * bar
        if t0 >= T("s04", 5) - 0.3:
            break
        S.pad(t0, min(t0 + bar, T("s04", 5) - 0.1), c, vel=0.18, a=0.15, r=0.5)
    S.brass(T("s04", 4), 1.2, "Bb1 F2 Bb2", 0.36)
    S.brass(T("s04", 4) + 2 * bar, 1.2, "C2 G2 C3", 0.36)
    # declaration: strings drop out, one low horn note
    S.line("horn", T("s04", 5) + 0.1, [(0, 6, "D3", 0.8)], bpm=60, timbre="horn", vel=0.16)
    # station: sad, noble theme (horn), low drums for the partition
    S.prog([(T("s04", 6), 187.7, "Bb2 F3 D4"), (187.7, T("s04", 7), "G2 D3 Bb3"),
            (T("s04", 7), 191.9, "A2 E3 C#4"), (191.9, T("s04", 8), "D3 A3 F4"),
            (T("s04", 8), 196.3, "Bb2 F3 D4")], vel=0.2, a=0.6, r=1.2)
    S.line("horn", T("s04", 6) + 0.1, [(0, 1, "A3"), (1, 1, "D4"), (2, 0.7, "E4"), (2.7, 2.3, "F4"), (5, 1, "E4"),
                                       (6, 1, "D4"), (7, 1, "C#4"), (8, 3, "D4", 0.9), (11, 1, "A3", 0.8),
                                       (12, 2, "Bb3", 0.8), (14, 3, "A3", 0.7)], bpm=66, timbre="horn", vel=0.25, p=-0.1)
    S.drums(T("s04", 7), T("s04", 9) - 0.4, bpm=66, pattern="B...b...", vel=0.36)
    # "carved up": minor chord
    S.brass(196.3, 1.8, "G1 D2 G2 Bb2", 0.34, a=0.15, r=1.3)
    S.pad(196.3, T("s04", 9), "G2 D3 Bb3 D4", vel=0.2, a=0.2, r=1.3)
    # Asia: a new colour - low strings and woodwind (diatonic C minor; no stereotyped motifs)
    S.prog([(T("s04", 9), 201.0, "C3 G3 Eb4"), (201.0, 204.0, "Ab2 Eb3 C4"), (204.0, 207.0, "F2 C3 Ab3"),
            (207.0, 210.6, "G2 D3 B3")], vel=0.17, a=1.0, r=1.4)
    S.line("wood", T("s04", 9) + 0.5, [(0, 2, "G4"), (2, 1, "Ab4"), (3, 2, "G4"), (5, 1, "F4"), (6, 2, "Eb4"),
                                       (8, 1, "D4"), (9, 2, "Eb4"), (11, 1, "F4"), (12, 3, "D4", 0.8)], bpm=72,
           timbre="clarinet", vel=0.11, p=0.3)
    S.line("solo", T("s04", 9) + 3.5, [(0, 4, "C3"), (4, 2, "Bb2"), (6, 4, "Ab2"), (10, 4, "G2")], bpm=72, timbre="cello", vel=0.12)

    # ---------------------------------------------------------------- s05 EUROPE FALLS (210-270)
    # phoney war: eerie, sparse
    S.swell(210.2, T("s05", 1), "E5 B5", 0.02, 0.05, r=0.6, bright=0.4)
    for tt, n_ in [(210.9, "B2"), (212.6, "E3"), (213.6, "F3")]:
        S.add("pizz", pizz_note(midi(nm(n_)), 0.3, seed=S._s()), tt, -0.2)
    S.bell(211.7, "B4", 0.10, 3.0)
    S.bell(213.2, "C5", 0.08, 3.0)
    # 1940: driving pulse, a low brass hit for each new invasion
    S.ostinato(T("s05", 1), T("s05", 4), bpm=120, sub=2, pattern=["D3", "D3", "F3", "D3", "E3", "D3", "A2", "D3"],
               vel=0.18, kind="spicc", cresc=(0.75, 1.15))
    S.ostinato(T("s05", 1), T("s05", 4), bpm=120, sub=1, pattern=["D2", "D2", "Bb1", "C2"], vel=0.16, kind="spicc", stem="low")
    for tt, c in [(T("s05", 1), "D2 A2"), (T("s05", 1) + 2.4, "D2 A2"), (T("s05", 2), "Bb1 F2"), (T("s05", 2) + 1.9, "C2 G2"),
                  (T("s05", 2) + 3.2, "D2 A2")]:
        S.brass(tt, 0.9, c, 0.36, a=0.03, r=0.6)
        S.timp(tt, "D2", 0.3, 1.0)
    S.prog([(T("s05", 1), T("s05", 2), "D3 A3 F4"), (T("s05", 2), T("s05", 3), "Bb2 F3 D4"),
            (T("s05", 3), 227.3, "C3 G3 E4"), (227.3, T("s05", 4), "A2 E3 C#4")], vel=0.15, a=0.4)
    S.drums(T("s05", 3) + 1.0, T("s05", 4), bpm=120, pattern="B.s.b.Ss", vel=0.3, cresc=(0.6, 1.1))
    # Dunkirk: urgent but hopeful
    S.ostinato(T("s05", 4), T("s05", 5) - 0.2, bpm=120, sub=2, pattern=["F3", "C4", "A3", "C4"], vel=0.13, kind="spicc")
    S.prog([(T("s05", 4), 232.6, "F2 C3 A3 F4"), (232.6, 234.6, "C3 G3 E4"), (234.6, 236.6, "D3 A3 F4"),
            (236.6, T("s05", 5), "Bb2 F3 D4")], vel=0.19, a=0.5)
    S.line("horn", T("s05", 4) + 0.5, [(0, 1, "C4"), (1, 1, "F4"), (2, 1, "G4"), (3, 2, "A4"), (5, 1, "G4"), (6, 1, "F4"),
                                       (7, 2, "G4"), (9, 1, "A4"), (10, 1, "Bb4"), (11, 3, "A4", 0.8)], bpm=90, timbre="horn", vel=0.2)
    # France fell: minor
    S.pad(T("s05", 5), T("s05", 6), "D3 F3 A3", vel=0.16, a=0.3)
    S.line("solo", T("s05", 5) + 0.05, [(0, 1, "D3"), (1, 1, "C3"), (2, 1, "Bb2"), (3, 1.5, "A2", 0.9)], bpm=100, timbre="cello", vel=0.17)
    # Churchill: resolute theme in low brass
    S.line("brass", T("s05", 6) + 0.1, [(0, 1, "A2"), (1, 1, "D3"), (2, 0.7, "E3"), (2.7, 2.3, "F3"), (5, 1, "E3"),
                                        (6, 1, "D3"), (7, 1, "C3"), (8, 2, "D3")], bpm=100, timbre="horn", vel=0.3, p=-0.15)
    S.prog([(T("s05", 6), 244.0, "D2 A2 F3"), (244.0, T("s05", 7), "Bb1 F2 D3")], vel=0.2, a=0.4)
    # Battle of Britain: heroic
    S.prog([(T("s05", 7), 248.4, "F2 C3 A3 F4"), (248.4, 250.0, "Bb2 F3 D4"), (250.0, T("s05", 8), "C3 G3 E4")], vel=0.21, a=0.25)
    S.line("horn", T("s05", 7) + 0.1, [(0, 1, "A3"), (1, 1, "D4"), (2, 0.7, "E4"), (2.7, 2.3, "F4"), (5, 1, "G4"),
                                       (6, 2, "A4"), (8, 1.5, "G4", 0.8)], bpm=104, timbre="horn", vel=0.26)
    S.timp(T("s05", 7), "F2", 0.4)
    S.roll(T("s05", 8) - 1.6, 1.5, "C2", 0.05, 0.3)
    # Blitz: sombre, not heroic
    S.prog([(T("s05", 8), 254.6, "G2 D3 Bb3"), (254.6, 256.6, "F2 D3 A3"), (256.6, T("s05", 9), "Eb2 Bb2 G3")], vel=0.18, a=1.0)
    # "But Britain kept fighting." + tail: resolute theme swells and resolves by 269.5
    t9 = T("s05", 9)
    S.prog([(t9, 261.4, "D2 A2 D3 F3"), (261.4, 263.2, "Bb1 F2 D3 F3"), (263.2, 265.0, "G1 D2 Bb2 G3"),
            (265.0, 267.2, "A1 E2 C#3 A3"), (267.2, 270.5, "D2 A2 D3 F#3 A3")],
           vel=lambda t: 0.2 + 0.1 * min(1, (t - 259) / 6), a=0.5, r=1.8)
    S.line("horn", t9 + 0.4, [(0, 1, "A3"), (1, 1, "D4"), (2, 0.7, "E4"), (2.7, 2.3, "F4", 1.1), (5, 1, "E4"), (6, 1, "D4"),
                              (7, 1, "C#4"), (8, 4.5, "D4", 0.9)], bpm=84, timbre="horn", vel=0.32)
    S.line("solo", t9 + 2.1, [(0, 1, "A4"), (1, 0.7, "Bb4"), (1.7, 2.3, "A4"), (4, 1, "G4"), (5, 1, "E4"),
                              (6, 4, "F#4", 0.8)], bpm=84, timbre="violin", vel=0.12, p=0.3)
    S.timp(267.2, "D2", 0.35, 2.4)

    # ---------------------------------------------------------------- s06 GLOBAL WAR (270-330)
    S.prog([(270.4, 274.4, "D2 A2 D3 F3"), (274.4, 278.4, "Eb2 Bb2 Eb3 G3"), (278.4, 282.4, "C2 G2 C3 Eb3"),
            (282.4, T("s06", 2), "D2 A2 D3 F3")], vel=0.21, a=1.0, r=1.4)
    for tt, c in [(270.8, "D1 A1 D2"), (274.4, "Eb1 Bb1 Eb2"), (278.4, "C2 G2"), (282.4, "D2 A2")]:
        S.brass(tt, 3.6, c, 0.30, a=0.5, r=1.0, dark=0.8)
    S.drums(270.8, T("s06", 2), bpm=72, pattern="B...b.b.", vel=0.32)
    S.ostinato(T("s06", 1), T("s06", 2) - 0.2, bpm=144, sub=2, pattern=["D3", "D3", "Eb3", "D3", "C3", "D3", "Eb3", "F3"],
               vel=0.16, kind="spicc", cresc=(0.7, 1.1))
    # deadliest theatre: sombre
    S.prog([(T("s06", 2), 288.6, "G2 D3 Bb3"), (288.6, T("s06", 3), "D2 A2 F3")], vel=0.17, a=0.8)
    # Moscow, winter: surge
    S.swell(T("s06", 3), 296.6, "D2 A2 D3 F3 A3", 0.04, 0.30, r=0.9)
    S.roll(294.6, 2.0, "D2", 0.04, 0.4)
    S.timp(296.6, "D2", 0.45, 1.6)
    # Pacific: the C minor woodwind colour returns
    S.prog([(T("s06", 4), 300.5, "C3 G3 Eb4"), (300.5, T("s06", 5), "Ab2 Eb3 C4")], vel=0.16, a=0.7)
    S.line("wood", T("s06", 4) + 0.3, [(0, 2, "G4"), (2, 1, "Ab4"), (3, 2, "G4"), (5, 1, "F4")], bpm=72, timbre="clarinet", vel=0.1, p=0.3)
    # Pearl Harbor attack: tension, then music out (MUSIC_SILENCE 311.45-313.0)
    S.ostinato(T("s06", 5), 311.4, bpm=132, sub=2, pattern=["C3", "C3", "Db3", "C3"], vel=0.17, kind="spicc", cresc=(0.8, 1.2))
    S.swell(T("s06", 5), 311.4, "C2 G2 Db3 G3", 0.05, 0.22, r=0.3)
    S.roll(308.8, 2.4, "C2", 0.04, 0.35)
    # a single sustained note after the silence
    S.line("solo", 313.0, [(0, 2.4, "D3", 0.9)], bpm=60, timbre="cello", vel=0.13, a=0.9, r=0.6)
    # America enters: rising, resolved
    S.prog([(T("s06", 7), 317.4, "Bb2 F3 D4"), (317.4, 319.2, "C3 G3 E4"), (319.2, 321.0, "D3 A3 F4"),
            (321.0, T("s06", 8), "C3 F3 A3 F4")], vel=lambda t: 0.16 + 0.05 * (t - 315) / 6, a=0.6)
    S.line("horn", T("s06", 7) + 0.3, [(0, 1, "F3"), (1, 1, "G3"), (2, 1, "A3"), (3, 2, "C4"), (5, 1, "D4"), (6, 3, "C4", 0.9)],
           bpm=80, timbre="horn", vel=0.22)
    # global: big ominous chord that spreads, then softens
    for i, m in enumerate(["D3", "A2", "F3", "D2", "Bb3", "A3", "D1", "E4"]):
        t0 = T("s06", 8) + 0.25 * i
        S.swell(t0, 327.0, m, 0.03, 0.24 if nm(m) < 50 else 0.18, r=2.8)
    S.brass(T("s06", 8) + 0.5, 3.0, "D2 A2 D3", 0.30, a=1.2, r=2.0)
    S.timp(T("s06", 8) + 1.5, "D2", 0.35, 2.4)

    # ---------------------------------------------------------------- s07 TURNING POINTS (330-390)
    S.prog([(330.3, 332.4, "F3 C4 A4"), (332.4, T("s07", 1), "E3 C4 G4")], vel=0.15, a=0.9)
    S.line("wood", T("s07", 0), [(0, 1, "C5"), (1, 1, "F5"), (2, 1, "G5"), (3, 3, "A5")], bpm=84, timbre="flute", vel=0.1, p=0.25)
    # Midway: tense strings
    S.prog([(T("s07", 1), 337.5, "D3 A3 F4"), (337.5, 340.5, "Eb3 Bb3 G4"), (340.5, T("s07", 2), "D3 A3 F4")], vel=0.15, a=0.6)
    S.ostinato(T("s07", 1), T("s07", 2), bpm=116, sub=4, pattern=["A3", "A3", "Bb3", "A3"], vel=0.11, kind="spicc", cresc=(0.8, 1.2))
    # El Alamein: building
    S.prog([(T("s07", 2), 346.6, "G2 D3 Bb3"), (346.6, 348.6, "A2 E3 C#4"), (348.6, 350.4, "Bb2 F3 D4"),
            (350.4, T("s07", 3), "C3 G3 E4")], vel=lambda t: 0.15 + 0.06 * (t - 344.6) / 8, a=0.4)
    S.drums(T("s07", 2), T("s07", 3), bpm=116, pattern="B.s.b.s.", vel=0.28, cresc=(0.6, 1.1))
    S.line("brass", T("s07", 2) + 0.2, [(0, 2, "G2"), (2, 2, "A2"), (4, 2, "Bb2"), (6, 2, "C3"), (8, 2, "D3"), (10, 3, "E3")],
           bpm=116, timbre="horn", vel=0.22)
    # Stalingrad: tense minor
    S.prog([(T("s07", 3), 356.0, "D2 A2 D3 F3"), (356.0, T("s07", 4), "Bb1 F2 Db3 F3")], vel=0.18, a=0.6)
    S.ostinato(T("s07", 3), T("s07", 4), bpm=96, sub=2, pattern=["D2", "D2", "Eb2", "D2"], vel=0.16, kind="spicc", stem="low")
    S.swell(T("s07", 3) + 1, T("s07", 4), "A4 Bb4", 0.02, 0.06, r=0.6, bright=0.5)
    # surrender: subdued
    S.prog([(T("s07", 4), 363.0, "D3 F3 A3"), (363.0, T("s07", 5), "D3 G3 Bb3")], vel=0.13, a=1.0)
    # light pause: a high held note only
    S.swell(T("s07", 5), T("s07", 6) + 0.2, "A4", 0.03, 0.04, r=0.6, bright=0.5)
    # production: rhythmic, optimistic, building through the tail; suspended chord at 389.5
    t6 = T("s07", 6)
    bpm = 132
    bar = 4 * 60 / bpm
    prog = ["F2 C3 A3", "C3 G3 E4", "D3 A3 F4", "Bb2 F3 D4"]
    nbar = int((389.5 - t6) / bar)
    for i in range(nbar):
        t0 = t6 + i * bar
        x = i / max(1, nbar - 1)
        S.pad(t0, t0 + bar, prog[i % 4], vel=0.12 + 0.12 * x, a=0.2, r=0.6)
    S.ostinato(t6, 389.5, bpm=bpm, sub=2, pattern=["F3", "F3", "C4", "F3", "A3", "F3", "C4", "F3"], vel=0.13, kind="spicc",
               accent=(1.3, .7, .9, .7), cresc=(0.7, 1.3))
    S.ostinato(t6 + 2 * bar, 389.5, bpm=bpm, sub=2, pattern=["F4", None, "C5", None, "A4", None, "C5", "F4"], vel=0.16, kind="pizz",
               cresc=(0.6, 1.2), p=0.3)
    S.drums(t6 + 4 * bar, 389.5, bpm=bpm, pattern="b.s.b.sS", vel=0.24, cresc=(0.6, 1.3))
    S.drums(380.9, 389.4, bpm=bpm, pattern="B...B...", vel=0.3, cresc=(0.7, 1.2))
    S.line("horn", 380.9, [(0, 2, "C4"), (2, 1, "F4"), (3, 1, "G4"), (4, 4, "A4"), (8, 2, "G4"), (10, 2, "F4"),
                          (12, 4, "G4", 1.1)], bpm=bpm, timbre="horn", vel=0.30)
    S.line("solo", 383.0, [(0, 4, "C5"), (4, 4, "D5"), (8, 6, "E5", 1.1)], bpm=bpm, timbre="violin", vel=0.13, p=0.3)
    # suspended chord, held into D-Day
    S.swell(388.3, 391.6, "D2 A2 D3 G3 A3 E4", 0.18, 0.24, r=1.6)
    S.timp(389.5, "D2", 0.4, 1.8)

    # ---------------------------------------------------------------- s08 D-DAY (390-450)
    S.drums(390.6, T("s08", 1), bpm=100, pattern="b.b.b.bb", vel=0.26)
    S.prog([(390.6, 393.4, "D3 A3 F4"), (393.4, T("s08", 1), "C3 G3 E4")], vel=0.15, a=0.5)
    S.ostinato(390.6, T("s08", 1), bpm=100, sub=2, pattern=["D2", "D2", "A2", "D2"], vel=0.16, kind="spicc", stem="low")
    # night: tension
    S.swell(T("s08", 1), T("s08", 2), "D3 A3 Eb4", 0.05, 0.13, r=0.8)
    S.line("wood", T("s08", 1) + 0.2, [(0, 2, "A4"), (2, 1, "Bb4"), (3, 2, "A4")], bpm=72, timbre="clarinet", vel=0.09, p=0.3)
    # armada: a long swell
    t2 = T("s08", 2)
    S.prog([(t2, 402.4, "Bb2 F3 D4"), (402.4, 404.6, "F2 C3 A3"), (404.6, 406.8, "C3 G3 E4"), (406.8, 409.0, "D3 A3 F4"),
            (409.0, 411.2, "Bb2 F3 D4 F4"), (411.2, T("s08", 3), "C3 G3 E4 G4")],
           vel=lambda t: 0.14 + 0.09 * (t - 399.9) / 12, a=0.6)
    S.line("horn", t2 + 0.5, [(0, 2, "F3"), (2, 1, "A3"), (3, 1, "Bb3"), (4, 3, "C4"), (7, 1, "D4"), (8, 2, "C4"),
                              (10, 2, "A3"), (12, 4, "G3")], bpm=72, timbre="horn", vel=0.22)
    S.roll(411.4, 2.0, "C2", 0.04, 0.3)
    # grave, then hopeful
    t3 = T("s08", 3)
    S.prog([(t3, 415.8, "D2 A2 F3"), (415.8, 417.8, "G2 D3 Bb3"), (417.8, 419.6, "Bb2 F3 D4"), (419.6, T("s08", 4), "F2 C3 A3")],
           vel=0.17, a=0.6)
    S.line("solo", t3 + 0.3, [(0, 2, "D3"), (2, 2, "D3"), (4, 2, "C3"), (6, 3, "Bb2"), (9, 3, "A2")], bpm=80, timbre="cello", vel=0.14)
    # resistance: tense pizzicato
    S.ostinato(T("s08", 4), T("s08", 5) - 0.1, bpm=132, sub=2, pattern=["D3", "F3", "A3", "F3", "E3", "G3", "A3", "G3"],
               vel=0.26, kind="pizz", p=-0.25)
    S.pad(T("s08", 4), T("s08", 5), "D3 A3", vel=0.12, a=0.5)
    # Paris: brief joy
    t5 = T("s08", 5)
    S.prog([(t5, 429.4, "F3 C4 A4"), (429.4, T("s08", 6), "C3 G3 E4 C5")], vel=0.2, a=0.2)
    S.line("horn", t5 + 0.1, [(0, 1, "C4"), (1, 1, "F4"), (2, 1, "A4"), (3, 3, "C5")], bpm=96, timbre="horn", vel=0.24)
    S.ostinato(t5, T("s08", 6), bpm=132, sub=2, pattern=["F4", "A4", "C5", "A4"], vel=0.12, kind="pizz", p=0.3)
    # east: driving
    S.ostinato(T("s08", 6), T("s08", 7), bpm=138, sub=2, pattern=["D3", "D3", "A2", "D3", "F3", "D3", "A2", "D3"], vel=0.18,
               kind="spicc", accent=(1.3, .7, .8, .7))
    S.drums(T("s08", 6), T("s08", 7), bpm=138, pattern="B.s.b.S.", vel=0.28)
    S.prog([(T("s08", 6), 434.2, "D3 A3 F4"), (434.2, T("s08", 7), "Bb2 F3 D4")], vel=0.17, a=0.2)
    # several fronts: ticking (SFX clock) and darkening; tail: sustained darker transition
    S.prog([(T("s08", 7), 440.0, "G2 D3 Bb3"), (440.0, 443.0, "Eb2 Bb2 G3")], vel=0.16, a=0.6)
    S.ostinato(T("s08", 7), 442.6, bpm=120, sub=1, pattern=["G4", None], vel=0.06, kind="pizz", p=0.2)
    S.prog([(443.0, 446.0, "Bb1 F2 Db3 F3"), (446.0, 450.6, "A1 E2 C#3 G3")], vel=0.21, a=1.2, r=1.6)
    S.line("brass", 443.2, [(0, 3, "F2"), (3, 3, "E2", 0.9)], bpm=60, timbre="horn", vel=0.2)
    S.swell(446.2, 450.6, "Bb3 E4", 0.04, 0.09, r=1.0, bright=0.6)

    # ---------------------------------------------------------------- s09 FALL OF GERMANY (450-510)
    S.pad(450.4, 455.6, "D2 A2 D3", vel=0.18, a=0.8, r=0.8)
    S.ostinato(450.6, 455.4, bpm=76, sub=2, pattern=["D2", "D2", "Eb2", "D2"], vel=0.14, kind="spicc", stem="low")
    S.drums(450.8, 455.4, bpm=76, pattern="b...b...", vel=0.22)
    # camps and the Holocaust: a solo cello only, then a single sustained note (no hits)
    S.line("solo", 455.75, [(0, 3, "D3", 0.7), (3, 1.5, "F3"), (4.5, 1.5, "E3"), (6, 3, "D3"),
                            (9, 1.5, "C3"), (10.5, 1.5, "Bb2"), (12, 4.5, "A2", 0.9), (16.5, 1.5, "Bb2", 0.8),
                            (18, 3.5, "A2", 0.6)], bpm=88, timbre="cello", vel=0.15, a=0.4, r=0.5)
    S.line("solo", T("s09", 3) + 0.05, [(0, 9.0, "D3", 0.8)], bpm=60, timbre="cello", vel=0.13, a=1.6, r=0.4)
    S.line("solo", T("s09", 4) - 0.1, [(0, 8.9, "A2", 0.75)], bpm=60, timbre="cello", vel=0.13, a=1.6, r=0.6)
    # Berlin: grim low percussion
    t5 = T("s09", 5)
    S.drums(t5, T("s09", 6), bpm=84, pattern="B.b.B.bb", vel=0.34)
    S.timp(t5, "D2", 0.35)
    S.brass(t5, 3.5, "D1 A1", 0.28, a=0.3, r=0.8, dark=0.8)
    S.pad(t5, T("s09", 6), "D2 Ab2", vel=0.16, a=0.3)
    # bunker: low drone
    S.swell(T("s09", 6), T("s09", 7), "D1 A1 D2", 0.18, 0.12, r=0.6, bright=0.5)
    # surrender: near-silence under the pen, then music lifts at the stamp; joyful VE Day
    stamp = 500.6
    S.swell(T("s09", 7), stamp, "A3 D4", 0.03, 0.06, r=0.2, bright=0.6)
    S.timp(stamp, "D2", 0.35)
    S.prog([(stamp, 502.0, "D3 A3 F#4 D5"), (502.0, 503.4, "G2 D3 B3 G4"), (503.4, T("s09", 8), "A2 E3 C#4 A4")], vel=0.22, a=0.1)
    S.line("horn", stamp + 0.05, [(0, 1, "A3"), (1, 1, "D4"), (2, 1, "E4"), (3, 3, "F#4"), (6, 1.5, "E4", 0.8)], bpm=100, timbre="horn", vel=0.28)
    S.ostinato(stamp, T("s09", 8) - 0.2, bpm=120, sub=2, pattern=["D4", "F#4", "A4", "F#4"], vel=0.1, kind="pizz", p=0.3)
    # the Pacific: the major chord sours, uneasy
    S.prog([(T("s09", 8), 507.2, "D3 F#3 A#3"), (507.2, 510.6, "D3 F3 Bb3")], vel=0.16, a=0.6, r=1.6)

    # ---------------------------------------------------------------- s10 HOW IT ENDED (510-570)
    S.pulse(510.8, T("s10", 1), bpm=84, vel=0.3, f0=46)
    S.prog([(510.4, 513.6, "D3 A3 F4"), (513.6, T("s10", 1), "Bb2 F3 D4")], vel=0.15, a=0.8)
    S.ostinato(510.8, T("s10", 1), bpm=84, sub=2, pattern=["D2", "D2", "A1", "D2"], vel=0.13, kind="spicc", stem="low")
    # Okinawa: grave
    S.prog([(T("s10", 1), 520.6, "G2 D3 Bb3"), (520.6, T("s10", 2), "Eb2 Bb2 G3")], vel=0.17, a=1.0)
    S.line("solo", T("s10", 1) + 0.3, [(0, 2, "G3"), (2, 1, "F3"), (3, 2, "Eb3"), (5, 3, "D3")], bpm=72, timbre="cello", vel=0.13)
    # refusal: tight
    for tt in [T("s10", 2), T("s10", 2) + 0.9, T("s10", 2) + 1.8]:
        S.pad(tt, tt + 0.35, "D3 Ab3 D4", vel=0.16, a=0.02, r=0.2)
    S.swell(T("s10", 2) + 2.2, E("s10", 2) + 0.4, "D3 Ab3", 0.05, 0.08, r=0.2)
    # Hiroshima morning: a thin, high, quiet note; everything cuts at the flash (MUSIC_SILENCE)
    S.swell(T("s10", 3) - 0.2, HIRO_FLASH + 0.2, "E5", 0.02, 0.04, r=0.1, bright=0.5)
    S.swell(T("s10", 3) - 0.2, HIRO_FLASH + 0.2, "A2", 0.06, 0.07, r=0.1, bright=0.4)
    # after the silence: a low sustained tone, no melody
    S.swell(HIRO_SIL[1], E("s10", 4) + 0.3, "D2 A2", 0.10, 0.12, r=0.6, bright=0.4)
    # Manchuria: low urgent percussion
    t5 = T("s10", 5)
    S.drums(t5, E("s10", 5) + 0.1, bpm=120, pattern="B.b.b.bb", vel=0.28, cresc=(0.8, 1.1))
    S.pad(t5, E("s10", 5) + 0.2, "D2 A2", vel=0.14, a=0.3, r=0.4)
    # before Nagasaki: low tone only, out at the glow
    S.swell(T("s10", 6) - 0.2, NAGA_GLOW + 0.2, "D2 A2", 0.10, 0.07, r=0.1, bright=0.4)
    # broadcast: music silent, then soft (from 553.4); signing: solemn resolution
    S.prog([(553.4, T("s10", 7) + 4.6, "D3 F3 A3"), (T("s10", 7) + 4.6, 557.9, "G2 D3 Bb3"),
            (557.9, 559.6, "C3 G3 E4"), (559.6, T("s10", 8) + 0.4, "F2 C3 A3")], vel=0.15, a=1.2, r=1.6)
    # debate: thoughtful, sparse piano
    t8 = T("s10", 8)
    for tt, notes, v in [(t8 + 0.1, "D3 A3", 0.22), (t8 + 1.0, "E4", 0.16), (t8 + 1.8, "F4", 0.16), (t8 + 3.0, "Bb2 F3", 0.2),
                         (t8 + 3.9, "D4", 0.15), (t8 + 4.7, "C4", 0.15), (t8 + 5.9, "F2 C3", 0.2), (t8 + 6.8, "A3", 0.15),
                         (t8 + 7.6, "G3", 0.14), (t8 + 8.8, "A2 E3", 0.18), (t8 + 10.0, "C#4", 0.12)]:
        S.piano(tt, notes, v, dur=3.0)
    S.prog([(t8, 566.0, "D3 A3"), (566.0, 570.4, "A2 E3")], vel=0.08, a=1.5, r=1.5)

    # ---------------------------------------------------------------- s11 COST AND LEGACY (570-605)
    t0 = T("s11", 0)
    S.prog([(569.8, 572.6, "D3 A3 F4"), (572.6, T("s11", 1), "Bb2 F3 D4")], vel=0.15, a=1.2)
    S.arp([(t0, 572.8, "D3 A3 D4 F4"), (572.8, T("s11", 1), "Bb2 F3 Bb3 D4")], bpm=66, sub=2, order=[0, 1, 2, 3, 2, 1],
          vel=0.14, sustain=2.0)
    # United Nations: hopeful; Cold War: uneasy turn
    t1 = T("s11", 1)
    S.prog([(t1, 578.2, "F3 C4 A4"), (578.2, 579.6, "C3 G3 E4"), (579.6, T("s11", 2), "Db3 G3 Bb3 E4")], vel=0.15, a=0.6)
    S.arp([(t1, 578.2, "F3 C4 F4 A4"), (578.2, 579.6, "C3 G3 C4 E4")], bpm=66, sub=2, order=[0, 1, 2, 3, 2, 1], vel=0.13)
    # the lesson: sombre strings
    t2 = T("s11", 2)
    S.prog([(t2, 583.6, "G2 D3 Bb3"), (583.6, 585.4, "D3 F3 A3"), (585.4, T("s11", 3), "Eb3 G3 Bb3")], vel=0.16, a=0.9)
    S.line("solo", t2 + 0.2, [(0, 2, "D3"), (2, 2, "C3"), (4, 2, "Bb2"), (6, 2, "A2")], bpm=72, timbre="cello", vel=0.12)
    # ordinary people: the warm theme rises in D major
    t3 = T("s11", 3)
    S.prog([(t3, 589.4, "D3 A3 F#4"), (589.4, T("s11", 4), "A2 E3 C#4"), (T("s11", 4), 592.8, "B2 F#3 D4"),
            (592.8, T("s11", 5), "G2 D3 B3"), (T("s11", 5), 596.6, "G2 D3 B3 E4"), (596.6, 598.2, "A2 E3 G3 C#4")],
           vel=lambda t: 0.16 + 0.05 * (t - 587) / 10, a=0.6, r=1.4)
    S.line("horn", t3 + 0.2, [(0, 1, "A3"), (1, 1, "D4"), (2, 0.7, "E4"), (2.7, 2.3, "F#4"), (5, 1, "E4"), (6, 1, "D4"),
                              (7, 1, "B3"), (8, 2, "C#4"), (10, 2, "D4", 0.9)], bpm=78, timbre="horn", vel=0.2)
    S.arp([(t3, 589.4, "D3 A3 D4 F#4"), (589.4, T("s11", 4), "A2 E3 A3 C#4"), (T("s11", 4), 592.8, "B2 F#3 B3 D4"),
           (592.8, 596.6, "G2 D3 G3 B3")], bpm=78, sub=2, order=[0, 1, 2, 3, 2, 1], vel=0.13)
    S.line("solo", T("s11", 4) + 0.2, [(0, 2, "F#4"), (2, 1, "G4"), (3, 2, "A4"), (5, 2, "B4"), (7, 4, "A4", 0.9)],
           bpm=78, timbre="violin", vel=0.1, p=0.3)
    # final resolution after the last word (597.96): D major sting at ~598.3, rings out, gone by 605
    fin = 598.3
    S.timp(fin, "D2", 0.38, 2.6)
    S.pad(fin, 601.5, "D2 A2 D3 F#3 A3 D4 F#4 A4", vel=0.22, a=0.12, r=3.2, bright=1.1)
    S.brass(fin, 2.2, "D2 A2 D3", 0.3, a=0.1, r=2.4)
    S.line("horn", fin, [(0, 4, "F#4", 0.9)], bpm=60, timbre="horn", vel=0.18, r=2.0)
    S.piano(fin, "D3 A3 D4 F#4 A4", 0.18, dur=6.0)
    S.bell(fin + 0.02, "D5", 0.10, 4.0)
    S.bell(fin + 0.6, "A5", 0.06, 3.5)


# ============================================================================== automation
def master_curve():
    """Programme-level dynamics (pre-duck) + the silence masks."""
    g = np.ones(N)
    # final fade 600.5 -> 604.8
    i0, i1 = ns(600.5), ns(604.8)
    g[i0:i1] *= np.cos(np.linspace(0, np.pi / 2, i1 - i0)) ** 1.5
    g[i1:] = 0
    # near-silence after "Tens of millions will die." (18.98-19.7)
    a, b = ns(E("s01", 5) + 0.05), ns(T("s01", 6))
    g[a:b] *= 0.12
    for (s0, s1, fo, fi) in MUSIC_SILENCE:
        a, b = ns(s0), ns(s1)
        fo_n, fi_n = ns(fo), ns(fi)
        g[max(0, a - fo_n):a] *= np.linspace(1, 0, a - max(0, a - fo_n))
        g[a:b] = 0
        e = min(N, b + fi_n)
        g[b:e] *= np.linspace(0, 1, e - b) ** 2
    return g


def speech_regions(pre=0.12, post=0.25, merge=1.0):
    regs = []
    for s in NAR["sections"]:
        for x in s["sentences"]:
            regs.append([x["start"] - pre, x["end"] + post])
    regs.sort()
    out = [regs[0]]
    for a, b in regs[1:]:
        if a - out[-1][1] < merge:
            out[-1][1] = max(out[-1][1], b)
        else:
            out.append([a, b])
    return out


def duck_curve(depth_db=-9.0, attack=0.30, release=0.9):
    """Gain curve: depth_db under speech, smooth raised-cosine ramps (attack before the word)."""
    tgt = np.zeros(N)
    for a, b in speech_regions():
        tgt[ns(max(0, a)):ns(b)] = 1.0
    # asymmetric smoothing: attack ramps start `attack` before speech; release `release` after
    d = np.zeros(N)
    on = np.diff(np.concatenate([[0], tgt])) > 0
    off = np.diff(np.concatenate([[0], tgt])) < 0
    d[:] = tgt
    an, rn = ns(attack), ns(release)
    ramp_a = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, an))
    ramp_r = 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, rn))
    for i in np.where(on)[0]:
        j = max(0, i - an)
        d[j:i] = np.maximum(d[j:i], ramp_a[an - (i - j):])
    for i in np.where(off)[0]:
        j = min(N, i + rn)
        d[i:j] = np.maximum(d[i:j], ramp_r[: j - i])
    return undb(depth_db * d), d


def main():
    t_start = time.time()
    S = Score()
    compose(S)
    print(f"composed in {time.time() - t_start:.1f}s")
    stem_dir = os.path.join(ENG, "output", "music-stems")
    os.makedirs(stem_dir, exist_ok=True)
    mus = S.render(stem_dir)
    print(f"rendered in {time.time() - t_start:.1f}s")
    mus *= master_curve()[:, None]
    # level: the un-ducked score peaks at -6 dBFS true peak (the mix script sets the final balance)
    tp = true_peak_db(mus)
    mus *= undb(-6.0 - tp)
    duck, d = duck_curve()
    np.save(os.path.join(ENG, "output", "music-duck.npy"), duck.astype(np.float32))
    ducked = mus * duck[:, None]
    os.makedirs(PROD, exist_ok=True)
    sf.write(os.path.join(PROD, "episode-01-music.wav"), mus.astype(np.float32), SR, subtype="PCM_24")
    sf.write(os.path.join(ENG, "public", "audio", "music.wav"), ducked.astype(np.float32), SR, subtype="PCM_16")
    np.save(os.path.join(ENG, "output", "music-unducked.npy"), mus.astype(np.float32))
    print(f"music: true peak {true_peak_db(mus):.2f} dBTP, integrated {integrated_lufs(mus):.2f} LUFS (un-ducked); "
          f"ducked {integrated_lufs(ducked):.2f} LUFS; done in {time.time() - t_start:.1f}s")


if __name__ == "__main__":
    main()
