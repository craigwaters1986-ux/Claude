#!/usr/bin/env python3
"""Original procedural score for ep02-ww1 ("World War I: From Start to Finish").

Every note is synthesised here (audio_lib instruments), cued to the real sentence timings in
src/timeline/narration.json and to the approved storyboard (production/storyboards/ep02-ww1).
Home key D minor; the channel motif "The Human Story" (A-D-E-F, E-D-C-D) is stated in the title
sting (27.95 s), returns as Foch's resolve (s10) and in the end-card theme.

Special cues (asset request AU-02 / AU-S1):
  * hummed "Silent Night" (Gruber 1818 melody, public domain; original synthesised humming,
    distant and soft) 231.2-249.5, then a fragile solo violin finishes the tune with the snow
  * s02->s03 tail 100.4-110.0 carried musically: pizzicato keyed to the falling dominoes
    (clacks at SYNC['domino']), strings build, resolve on the Sarajevo glow at 108.0
  * title sting >= 27.8 s (27.95)
  * exactly 1.0 s of total silence (music + SFX) at 609.50-610.50 (S10-06, 11 o'clock)
  * a single sustained instrument, no percussion: S06-06-S06-07 (357.2-388.8), S07-04
    (418.3-428.0), S11-05 (668.3-685.7, with the approved quiet bugle phrase at 684.7-685.7)

Outputs
  output/music-stems/*.wav                 per-instrument stems, un-ducked (git-ignored)
  production/audio/ep02-ww1/episode-02-music.wav   un-ducked music stem, 720 s (git-ignored)
  public/audio/music.wav                   music ducked under the narration (-12 dB)
  output/music-duck.npy, music-unducked.npy        for mix.py (git-ignored)

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
EP = "ep02-ww1"
TAG = "02"
PROD = os.path.join(ROOT, "production", "audio", EP)
DUR = 720.0
N = int(round(DUR * SR))
DUCK_DB = -12.0

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
TITLE_STING = 27.95                       # storyboard: title sting from >= 27.8 (s01 ends 27.72)
SHOTS_1914 = (13.50, 13.90)               # S01-02 pistol reports
SHOTS_S03 = (126.95, 127.35)              # S03-02 "He shot them" (~127.2)
ELEVEN = 609.50                           # S10-06: 11 o'clock
ELEVEN_SIL = (ELEVEN, ELEVEN + 1.0)       # exactly 1.0 s total silence (music + SFX)
WHISTLE_XMAS = 248.40                     # S04-06 officer's whistle
WHISTLES_SOMME = 418.60                   # S07-04 whistles
BUGLE = (684.70, 685.70)                  # AU-S1 bugle phrase (gap between s11.b9 and b10)
DOMINO_CLACKS = [round(100.45 + 0.5 * k, 2) for k in range(8)]      # real dominoes 100.45-103.95
CHALK_DOMINOES = [round(104.50 + 0.5 * k, 2) for k in range(7)]    # chalk dominoes 104.5-107.5
SARAJEVO_GLOW = 108.00
HUM_EIGHTH = 0.42                         # Silent Night: eighth-note length (6/8, dotted crotchet ~ 48 bpm)
HUM_START = 231.20

# music fully out (mask applied after reverb, so tails are cut too): (start, end, fade_out, fade_in)
MUSIC_SILENCE = [
    (13.45, 14.85, 0.06, 0.25),                 # pistol reports, wing flutter, 0.6 s near-silence
    (SHOTS_S03[0] - 0.05, 127.90, 0.08, 0.05),  # S03-02: reports, then 0.5 s near-silence, low cello note
    (388.80, 390.00, 0.8, 0.02),                # S06-07: 1.2 s near-silence before the s07 ink
    (WHISTLES_SOMME, 421.0, 0.25, 1.2),         # S07-04: music drops out at the whistles
    (ELEVEN_SIL[0], E("s10", 7) + 0.55, 0.02, 0.0),   # 11 o'clock: out; re-enters at s10.b8
    (719.90, 720.0, 0.01, 0.0),                 # clean end
]

# single-instrument windows: every stem not listed is muted (after reverb) inside the window
EXCLUSIVE = [
    (357.19, 388.80, ("solo",), 0.8),           # S06-06-S06-07 Armenian Genocide: solo cello only
    (418.30, 428.00, ("solo",), 0.3),           # S07-04 Somme first day: one sustained cello note
    (428.00, 434.60, ("piano",), 0.4),          # S07-05: one soft piano line
    (482.10, 488.20, ("piano",), 0.4),          # S08-04 Poplar: one soft piano note
    (653.47, 668.20, ("piano",), 0.6),          # S11-04 graves: solo piano
    (668.20, 685.80, ("solo", "bugle"), 0.4),   # S11-05 remembrance + poem: solo cello, then bugle
]


class Score:
    STEMS = {  # name: (reverb mix, reverb length, damping, gain)
        "strings": (0.32, 3.4, 4200, 1.0),
        "low": (0.22, 2.8, 2500, 1.0),
        "brass": (0.30, 3.0, 3200, 0.8),
        "horn": (0.34, 3.2, 3000, 0.65),
        "piano": (0.30, 3.0, 5000, 1.0),
        "wood": (0.30, 2.8, 5000, 0.8),
        "solo": (0.36, 3.8, 3800, 1.0),
        "pizz": (0.26, 2.4, 4000, 0.9),
        "perc": (0.20, 2.4, 2500, 0.9),
        "bells": (0.38, 3.6, 5000, 0.7),
        "voice": (0.58, 4.2, 2600, 0.45),   # ep02: distant hummed carol (far side of no-man's land)
        "bugle": (0.55, 4.0, 3500, 0.6),   # ep02: AU-S1 distant bugle phrase
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
        pat = [nm(x) if isinstance(x, str) else ([nm(y) for y in x] if isinstance(x, (list, tuple)) else x) for x in pattern]
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
    def render(self, stem_dir=None, masks=None):
        out = np.zeros((N, 2))
        for k, (mix, d, damp, g) in self.STEMS.items():
            x = self.b[k]
            if np.max(np.abs(x)) == 0:
                continue
            x = reverb(x, mix=mix, dur=d, damp=damp, seed=sum(map(ord, k)))
            x = hp(x, 32)
            if k == "voice":
                x = lp(x, 1800, 2)            # distance: the carol comes from across no-man's land
            if masks is not None:
                x = x * masks[k][:, None]
            if stem_dir:
                sf.write(os.path.join(stem_dir, k + ".wav"), (x * 0.25).astype(np.float32), SR, subtype="FLOAT")
            out += x * g
        return out



# ============================================================================== composition
# Silent Night (Franz Xaver Gruber, 1818: public domain). Melody written in C, 6/8, in eighths.
SILENT_NIGHT = [
    ("G4", 1.5), ("A4", 0.5), ("G4", 1), ("E4", 3),
    ("G4", 1.5), ("A4", 0.5), ("G4", 1), ("E4", 3),
    ("D5", 2), ("D5", 1), ("B4", 3),
    ("C5", 2), ("C5", 1), ("G4", 3),
    ("A4", 2), ("A4", 1), ("C5", 1.5), ("B4", 0.5), ("A4", 1), ("G4", 1.5), ("A4", 0.5), ("G4", 1), ("E4", 3),
    ("A4", 2), ("A4", 1), ("C5", 1.5), ("B4", 0.5), ("A4", 1), ("G4", 1.5), ("A4", 0.5), ("G4", 1), ("E4", 3),
    ("D5", 2), ("D5", 1), ("F5", 1.5), ("D5", 0.5), ("B4", 1), ("C5", 3), ("E5", 3),
    ("C5", 1.5), ("G4", 0.5), ("E4", 1), ("G4", 1.5), ("F4", 0.5), ("D4", 1), ("C4", 6),
]


def sn_events(e0, e1, transpose, eighth, vscale=lambda i: 1.0):
    """Silent Night notes whose start lies in [e0, e1) eighths -> legato_line events (seconds, from e0)."""
    evs, pos = [], 0.0
    for i, (n_, d) in enumerate(SILENT_NIGHT):
        if e0 - 1e-6 <= pos < e1 - 1e-6:
            evs.append(((pos - e0) * eighth, min(d, e1 - pos) * eighth * 0.97, nm(n_) + transpose, vscale(pos)))
        pos += d
    return evs


def compose(S):
    # ---------------------------------------------------------------- s01 COLD OPEN (0-35)
    # Sarajevo, summer 1914: warm D major (strings, harp-like piano, flute), darkening at b2
    S.arp([(0.5, 3.4, "D3 A3 D4 F#4 A4"), (3.4, 5.9, "G2 D3 G3 B3 D4"), (5.9, 8.2, "D3 A3 D4 F#4 A4"),
           (8.2, 9.8, "A2 E3 A3 C#4 E4")], bpm=76, sub=2, order=[0, 2, 3, 4, 3, 2], vel=0.2, sustain=2.0)
    S.prog([(0.2, 3.4, "D3 A3 F#4"), (3.4, 5.9, "G2 D3 B3"), (5.9, 8.2, "D3 A3 F#4"), (8.2, 9.8, "A2 E3 C#4")],
           vel=0.19, a=1.3, r=0.9)
    S.line("wood", 1.2, [(0, 1, "A4"), (1, 1, "D5"), (2, 0.5, "E5"), (2.5, 2.5, "F#5"), (5.0, 1, "E5"), (6.0, 1, "D5"),
                         (7.0, 1, "B4"), (8.0, 2.5, "A4", 0.9)], bpm=76, timbre="flute", vel=0.11, p=0.25)
    # 9.8 b2 "stops near a 19-year-old with a pistol": Bb shadow, quiet cluster tension
    S.pad(9.8, 13.5, "Bb1 Bb2 F3", vel=0.26, a=0.4, r=0.1)
    S.swell(10.4, 13.45, "D4 Eb4", 0.0, 0.07, r=0.05, bright=0.6)
    # 13.45-14.85 music out (two reports + wing flutter in the SFX); 14.9 low pulse on the map
    S.pulse(T("s01", 4), 17.6, bpm=66, vel=0.45, double=True, cresc=(0.8, 1.0))
    S.pad(14.9, 18.3, "D2 A2 D3", vel=0.24, a=0.5, r=0.4)
    S.swell(15.6, 18.3, "Bb3 D4 F4", 0.03, 0.14, r=0.4, bright=0.7)
    # 18.3-24.9 low strings, cello lament ("around 9 to 10 million soldiers are dead")
    S.prog([(18.3, 20.6, "D2 A2 F3"), (20.6, 22.6, "Bb1 F2 D3"), (22.6, 24.9, "G1 D2 Bb2")], vel=0.22, a=0.9, r=1.2)
    S.line("solo", 18.6, [(0, 1.6, "A3"), (1.6, 1.4, "F3"), (3.0, 1.0, "E3"), (4.0, 2.4, "D3", 0.9)],
           bpm=60, timbre="cello", vel=0.14, p=-0.2)
    # 24.9-27.7 chalk, room tone: faint suspended fifth
    S.swell(24.9, 27.85, "A3 E4", 0.03, 0.05, r=0.2, bright=0.5)
    # 27.95 TITLE STING: timpani roll -> full chord; horn states the channel motif
    ts = TITLE_STING
    S.roll(ts, 0.95, "D2", 0.03, 0.42)
    S.timp(ts + 0.95, "D2", 0.55, 2.2)
    S.brass(ts + 0.95, 2.6, "D2 A2 D3", 0.40, r=1.6)
    S.pad(ts + 0.95, 31.6, "D3 A3 D4 F4 A4 E5", vel=0.26, a=0.08, r=1.6, bright=1.2)
    S.line("horn", ts + 1.05, [(0, 0.6, "A3"), (0.6, 0.6, "D4"), (1.2, 0.5, "E4"), (1.7, 2.2, "F4", 1.1),
                               (3.9, 0.6, "E4", 0.9), (4.5, 0.6, "D4", 0.85), (5.1, 0.6, "C4", 0.8),
                               (5.7, 2.0, "D4", 0.75)], bpm=88, timbre="horn", vel=0.32, p=-0.1)
    S.prog([(31.4, 33.0, "Bb2 F3 D4 F4"), (33.0, 34.6, "C3 G3 E4")], vel=0.24, a=0.5, r=1.4)
    S.prog([(34.3, 36.4, "D3 A3 F4")], vel=0.15, a=1.0)                 # settles into the s02 bed by 34.5

    # ---------------------------------------------------------------- s02 EUROPE BEFORE 1914 (35-110)
    S.prog([(36.0, 38.5, "D3 A3 F4"), (38.5, T("s02", 1), "Bb2 F3 D4"),
            (T("s02", 1), 43.5, "G2 D3 Bb3 D4"), (43.5, 45.5, "C3 G3 E4"), (45.5, 47.0, "F2 C3 A3"),
            (47.0, T("s02", 2), "A2 E3 C#4"),
            (T("s02", 2), 50.2, "D3 A3 F4"), (50.2, T("s02", 3), "Bb2 F3 D4"),
            (T("s02", 3), 54.5, "G2 D3 Bb3"), (54.5, 56.5, "Eb3 Bb3 G4"), (56.5, T("s02", 4), "A2 E3 C#4"),
            (T("s02", 4), 61.0, "D3 A3 F4"), (61.0, 63.5, "Bb2 F3 D4"), (63.5, 66.0, "G2 D3 Bb3"),
            (66.0, T("s02", 5), "A2 E3 G3 C#4")], vel=0.18, a=1.0, r=1.3)
    # great powers: a stately horn phrase under the globe
    S.line("horn", T("s02", 1) + 0.4, [(0, 1, "D4"), (1, 1, "F4"), (2, 1.5, "G4"), (3.5, 0.5, "F4"), (4, 2, "E4"),
                                       (6, 1, "D4"), (7, 2.5, "C#4", 0.9)], bpm=72, timbre="horn", vel=0.14, p=-0.15)
    # two camps: two answering lines (violin above / cello below)
    S.line("solo", T("s02", 3) + 0.2, [(0, 2, "D5"), (2, 1, "C5"), (3, 2, "Bb4"), (5, 1, "A4"), (6, 3, "G4", 0.9)],
           bpm=66, timbre="violin", vel=0.08, p=0.3)
    S.line("solo", T("s02", 4) + 0.3, [(0, 2, "D3"), (2, 1, "E3"), (3, 2, "F3"), (5, 1, "E3"), (6, 3, "A2", 0.9)],
           bpm=66, timbre="cello", vel=0.11, p=-0.3)
    # S02-03 58.5: a low snare roll enters
    S.drums(58.5, 68.0, 96, "s.......s...s...", vel=0.30, cresc=(0.5, 1.0))
    # S02-04 arms race 68.1-74.5: snare rhythm, low brass pulses, spiccato
    S.drums(T("s02", 5), 74.5, 104, "S.sSS.s.", vel=0.36)
    S.ostinato(T("s02", 5), 74.4, 104, 2, ["D2", "D2", "A2", "D2"], vel=0.20, accent=(1.0, 0.7))
    S.prog([(T("s02", 5), 71.0, "D3 A3 D4"), (71.0, 74.5, "C3 G3 E4")], vel=0.17, a=0.4, r=0.8)
    S.brass(T("s02", 5) + 0.05, 1.6, "D2 A2", 0.26, r=0.6)
    S.brass(71.0, 1.6, "C2 G2", 0.26, r=0.6)
    # S02-05 the Balkans 74.5-84.4: low drone; an uneasy augmented-second viola line
    S.swell(74.5, 84.3, "D2 A2", 0.16, 0.22, r=1.2, bright=0.7)
    S.line("solo", 75.2, [(0, 2, "D4"), (2, 1, "Eb4"), (3, 2, "F#4"), (5, 1, "G4"), (6, 2, "F#4"), (8, 2, "Eb4", 0.9)],
           bpm=60, timbre="violin", vel=0.07, p=0.25, bright=0.7)
    # S02-06 the war plans 84.4-93.5: spiccato ostinato accelerating, crescendo
    S.ostinato(84.4, 88.9, 108, 2, ["D3", "A3", "D3", "F3"], vel=0.16, cresc=(0.6, 0.9))
    S.ostinato(88.9, 93.4, 126, 2, ["D3", "A3", "D3", "G3"], vel=0.18, cresc=(0.9, 1.1))
    S.prog([(84.4, 88.9, "D3 A3 F4"), (88.9, 93.4, "Eb3 Bb3 G4")], vel=0.15, a=0.8, r=0.6)
    # S02-07 93.5-100.4 "None of this made war inevitable": the tension eases, unresolved
    S.prog([(93.5, 96.4, "Bb2 F3 D4"), (96.4, 100.4, "G2 D3 Bb3 E4")], vel=0.15, a=0.9, r=0.5)
    # TAIL 100.4-110.0: pizzicato keyed to each falling domino, strings build, glow at 108.0
    scale = ["A4", "G4", "F4", "E4", "D4", "C#4", "D4", "E4"]
    for k, t in enumerate(DOMINO_CLACKS):
        S.add("pizz", pizz_note(midi(nm(scale[k])), 0.40, seed=S._s()), t, 0.2)
        S.add("pizz", pizz_note(midi(nm(scale[k]) - 12), 0.28, seed=S._s()), t, -0.2)
    chalk_sc = ["F4", "G4", "A4", "Bb4", "C5", "D5", "E5"]
    for k, t in enumerate(CHALK_DOMINOES):
        S.add("piano", piano_note(midi(nm(chalk_sc[k])), 0.16 + 0.02 * k, dur=1.2, seed=S._s()), t, 0.15)
        S.add("pizz", pizz_note(midi(nm(chalk_sc[k]) - 24), 0.30, seed=S._s()), t, -0.2)
    S.prog([(100.4, 102.4, "D3 A3 F4"), (102.4, 104.5, "Bb2 F3 D4"), (104.5, 106.2, "G2 D3 Bb3 D4"),
            (106.2, SARAJEVO_GLOW, "A2 E3 A3 C#4 E4")], vel=lambda t: 0.13 + 0.10 * (t - 100.4) / 7.6, a=0.5, r=0.6)
    S.roll(106.4, 1.6, "A1", 0.02, 0.26)
    # 108.0 glow: the build resolves; bell + warm chord, then settles into the s03 bed at 110
    S.timp(SARAJEVO_GLOW, "D2", 0.34, 2.2)
    S.pad(SARAJEVO_GLOW, 110.6, "D2 A2 D3 F3 A3 D4", vel=0.22, a=0.06, r=1.4, bright=1.0)
    S.bell(SARAJEVO_GLOW + 0.01, "A5", 0.12, 4.0)
    S.bell(SARAJEVO_GLOW + 0.02, "D5", 0.10, 4.0)

    # ---------------------------------------------------------------- s03 SARAJEVO + JULY CRISIS (110-190)
    S.prog([(110.2, 113.8, "D3 A3 F4"), (113.8, 117.0, "Bb2 F3 D4 E4"), (117.0, T("s03", 1), "G2 D3 Bb3"),
            (T("s03", 1), 124.8, "A2 E3 C#4"), (124.8, SHOTS_S03[0], "Bb2 F3 Db4")], vel=0.15, a=1.1, r=0.4)
    S.line("solo", 111.5, [(0, 2, "A3"), (2, 1, "Bb3"), (3, 2, "A3"), (5, 1, "G3"), (6, 3, "F3"), (9, 1.5, "E3", 0.9)],
           bpm=60, timbre="cello", vel=0.12, p=-0.25)
    # S03-02: music out at the reports; 0.5 s near-silence; then a single low cello note
    S.line("solo", 127.95, [(0, 2.2, "D2")], bpm=60, timbre="cello", vel=0.20, p=-0.1, r=1.6)
    # S03-03 blank cheque (130.3-136.9): strings, tense
    S.prog([(130.3, 133.6, "G2 D3 Bb3"), (133.6, T("s03", 3), "Eb3 Bb3 G4")], vel=0.15, a=0.9, r=0.8)
    S.ostinato(130.3, 136.8, 60, 1, ["D4", None], vel=0.10, kind="pizz")
    # S03-04 ultimatum, 48 hours (136.9-147.3): a timpani pulse under strings
    for k in range(10):
        S.timp(T("s03", 3) + 0.05 + k * 1.0, "D2", 0.20 + 0.012 * k, 1.0)
    S.prog([(T("s03", 3), 140.2, "Bb2 F3 D4"), (140.2, T("s03", 4), "A2 E3 C#4"),
            (T("s03", 4), T("s03", 5), "G2 D3 Bb3 E4")], vel=0.16, a=0.7, r=0.6)
    # S03-05 declarations (147.3-160): one soft drum hit per map arrow, chain of chords
    for t in [147.6, 151.6, 153.6, 155.3, 157.3]:
        S.add("perc", war_drum(0.38, seed=S._s()), t, 0)
        S.timp(t, "D2", 0.25, 1.4)
    S.prog([(T("s03", 5), 151.5, "D3 A3 F4"), (151.5, 153.6, "Eb3 Bb3 G4"), (153.6, 155.3, "C3 G3 Eb4"),
            (155.3, 157.3, "Bb2 F3 D4"), (157.3, T("s03", 7), "A2 E3 C#4 G4")],
           vel=lambda t: 0.15 + 0.06 * (t - 147) / 13, a=0.4, r=0.8)
    S.brass(157.3, 2.4, "A1 E2 A2", 0.24, r=0.9)
    # S03-06 Britain at war (160-167.7): music holds an E pedal under the big-clock chime
    S.swell(T("s03", 7), 167.7, "E2 B2 E3 G3", 0.12, 0.16, r=1.0, bright=0.8)
    # S03-07 trigger, not the whole cause (167.7-175): reflective piano + strings
    S.prog([(167.7, 170.9, "F2 C3 A3"), (170.9, T("s03", 10), "D3 A3 F4")], vel=0.13, a=1.0, r=1.0)
    S.piano(167.9, "F3 C4 A4", 0.15, dur=3.0)
    S.piano(171.3, "D3 A3 F4", 0.14, dur=3.0)
    S.piano(173.1, "Bb2 F3 D4", 0.12, dur=2.0)
    # S03-08 the debate (175-190): even and unresolved, then rising unease into s04
    S.prog([(175.0, 178.5, "G2 D3 Bb3"), (178.5, 182.0, "Eb3 Bb3 G4"), (182.0, 185.0, "C3 G3 Eb4"),
            (185.0, 187.4, "D3 A3 F#4")], vel=0.14, a=1.0, r=0.6)
    S.swell(186.4, 190.0, "D2 A2 D3 Eb4", 0.06, 0.24, r=0.3, bright=0.9)
    S.roll(188.6, 1.35, "D2", 0.03, 0.32)

    # ---------------------------------------------------------------- s04 1914: MOVEMENT STOPS (190-260)
    # S04-01 190-196 "the war would be short": a brisk, bright march (D major)
    S.drums(190.0, 196.2, 112, "S.sSS.s.", vel=0.32)
    S.ostinato(190.0, 196.2, 112, 1, ["D2", "A2"], vel=0.32, kind="pizz")
    S.line("wood", 190.1, [(0, 0.5, "A4"), (0.5, 0.5, "D5"), (1, 1, "F#5"), (2, 0.5, "E5"), (2.5, 0.5, "D5"),
                           (3, 1, "A4"), (4, 0.5, "B4"), (4.5, 0.5, "C#5"), (5, 1.5, "D5"), (6.5, 0.5, "E5"),
                           (7, 1, "F#5", 0.9), (8, 2, "E5", 0.8)], bpm=112, timbre="flute", vel=0.10, p=0.3)
    S.prog([(190.0, 193.2, "D3 A3 F#4"), (193.2, 196.2, "A2 E3 C#4")], vel=0.13, a=0.15, r=0.5)
    # S04-02 196-203.4 the sweep through Belgium, Mons: urgent D minor
    S.ostinato(196.0, 203.3, 132, 2, ["D3", "D3", "F3", "D3", "A3", "D3", "F3", "D3"], vel=0.17, accent=(1, 0.7))
    S.prog([(196.0, T("s04", 2), "D3 A3 F4"), (T("s04", 2), 203.4, "Bb2 F3 D4")], vel=0.16, a=0.3, r=0.6)
    S.brass(196.1, 1.8, "D2 A2 D3", 0.26, r=0.7)
    S.brass(T("s04", 2), 1.8, "Bb1 F2 Bb2", 0.24, r=0.7)
    # S04-03 Marne 203.4-211.3: resolute strings, horn
    S.prog([(203.4, 205.4, "Bb2 F3 D4"), (205.4, 207.4, "F2 C3 A3"), (207.4, 209.4, "C3 G3 E4"),
            (209.4, 211.3, "D3 A3 F4")], vel=0.18, a=0.5, r=0.9)
    S.line("horn", 203.6, [(0, 1, "D4"), (1, 1, "F4"), (2, 2, "G4"), (4, 1, "A4"), (5, 1, "G4"), (6, 2, "F4"),
                           (8, 2.5, "E4", 0.9)], bpm=80, timbre="horn", vel=0.17, p=-0.15)
    # S04-04 race to the sea, the trench line 211.3-229.8: the music grinds lower and thins
    S.prog([(211.3, 215.5, "D2 A2 F3"), (215.5, 219.0, "C2 G2 Eb3"), (219.0, 222.5, "Bb1 F2 D3"),
            (222.5, 226.0, "A1 E2 C#3"), (226.0, 229.6, "D1 A1 D2")], vel=lambda t: 0.19 - 0.06 * (t - 211) / 18,
           a=0.9, r=1.2, bright=0.7)
    S.line("solo", 211.6, [(0, 2, "F3"), (2, 2, "E3"), (4, 2, "D3"), (6, 2, "C3"), (8, 2, "Bb2"), (10, 2, "A2"),
                           (12, 4, "D2", 0.8)], bpm=52, timbre="cello", vel=0.12, p=-0.2)
    for t in [211.4, 215.6, 219.1, 222.6]:
        S.timp(t, "D2", 0.16, 1.8)
    # S04-05/06 CHRISTMAS TRUCE: distant hummed Silent Night (A major, male voices), growing
    tr = -15  # C -> A, an octave down: humming range A2-D4
    cut_e = (WHISTLE_XMAS - HUM_START) / HUM_EIGHTH + 1.4     # the whistle breaks it up
    for v, (dt, cents, p, vg) in enumerate([(0.0, 0, 0.0, 1.0), (0.05, 9, -0.35, 0.8), (0.09, -8, 0.35, 0.7)]):
        evs = sn_events(0, cut_e, tr, HUM_EIGHTH, vscale=lambda pos: 0.55 + 0.45 * min(1.0, pos / 20))
        sig = legato_line([(a + dt * (1 + 0.3 * np.sin(i)), d, m + cents / 100.0, vs) for i, (a, d, m, vs) in enumerate(evs)],
                          vel=0.20 * vg, glide=0.05, vib=9, timbre="hum", seed=S._s(), a=0.12, r=0.6)
        k = ns(WHISTLE_XMAS + 0.9 - HUM_START)          # men part: fade out over 0.9 s after the whistle
        fadek = ns(WHISTLE_XMAS - HUM_START)
        if len(sig) > fadek:
            sig[fadek:k] *= np.linspace(1, 0, min(k, len(sig)) - fadek)
            sig[k:] = 0
        S.add("voice", sig, HUM_START, p)
    # warm, fragile A-major strings under the carol (from the reveal at ~234 / S04-06)
    e = lambda k: HUM_START + k * HUM_EIGHTH
    S.prog([(e(12) - 0.4, e(18), "E2 B2 G#3"), (e(18), e(24), "A2 E3 C#4"), (e(24), e(30), "D3 A3 F#4"),
            (e(30), e(36), "A2 E3 C#4"), (e(36), e(42), "D3 A3 F#4"), (e(42), 250.4, "A2 E3 C#4")],
           vel=lambda t: 0.06 + 0.04 * min(1, (t - 236) / 6), a=1.4, r=1.4, bright=0.7)
    # after the whistle a solo violin finishes the tune, fading with the snow
    v0 = 249.6
    S.line("solo", v0, [(a, d, m, vs) for a, d, m, vs in sn_events(48, 72, -3, HUM_EIGHTH)],
           bpm=60, timbre="violin", vel=0.075, p=0.2, bright=0.7)
    f = lambda k: v0 + k * HUM_EIGHTH
    S.prog([(f(0), f(6), "E2 B2 G#3"), (f(6), f(12), "A2 E3 C#4"), (f(12), f(15), "A2 E3 C#4"),
            (f(15), f(18), "E2 B2 D3 G#3"), (f(18), 259.0, "A2 E3 A3 C#4")], vel=0.07, a=1.0, r=1.2, bright=0.6)

    # ---------------------------------------------------------------- s05 LIFE IN THE TRENCHES (260-320)
    S.swell(260.0, 270.3, "D2 A2", 0.12, 0.18, r=0.8, bright=0.6)
    S.swell(270.3, 280.6, "D2 A2 Eb3", 0.15, 0.13, r=1.0, bright=0.6)
    S.swell(280.6, 299.2, "D2 A2", 0.06, 0.035, r=0.6, bright=0.5)         # "music almost gone"
    # S05-04 shell shock 299.3-308.4: a single sustained cello
    S.line("solo", 299.4, [(0, 3.0, "D3"), (3.0, 2.0, "C3"), (5.0, 4.0, "Bb2", 0.9)], bpm=60, timbre="cello",
           vel=0.14, p=-0.1, a=0.8, r=1.4)
    # S05-05 executions 308.4-320: one soft low note, nothing else
    S.swell(308.6, 318.6, "D2", 0.10, 0.07, r=1.4, bright=0.5)

    # ---------------------------------------------------------------- s06 A WORLD WAR (320-390)
    S.add("perc", war_drum(0.32, seed=S._s()), 320.3, 0)
    S.add("perc", war_drum(0.26, seed=S._s()), T("s06", 1), 0)
    S.prog([(320.2, T("s06", 1), "D3 A3 F4"), (T("s06", 1), 325.8, "Bb2 F3 D4 F4"),
            (325.8, T("s06", 2), "C3 G3 E4 G4")], vel=lambda t: 0.13 + 0.05 * (t - 320) / 9, a=1.0, r=1.0)
    S.prog([(T("s06", 2), 332.0, "D3 A3 F4"), (332.0, 335.0, "G2 D3 Bb3 D4"), (335.0, T("s06", 3), "A2 E3 C#4")],
           vel=0.16, a=0.8, r=1.0)
    S.line("horn", T("s06", 2) + 0.4, [(0, 1, "A3"), (1, 2, "D4"), (3, 1, "E4"), (4, 3, "F4"), (7, 2, "E4", 0.9)],
           bpm=70, timbre="horn", vel=0.12, p=-0.15)
    # S06-03 Gallipoli failed: subdued strings
    S.prog([(T("s06", 3), 341.9, "Bb2 F3 D4"), (341.9, 344.3, "G2 D3 Bb3")], vel=0.13, a=0.9, r=0.8, bright=0.7)
    # S06-04/05 the empires' troops: warm and dignified (F major colour)
    S.prog([(344.3, 346.9, "F2 C3 A3"), (346.9, 349.4, "C3 G3 E4"), (349.4, 351.6, "D3 A3 F4"),
            (351.6, 354.0, "Bb2 F3 D4"), (354.0, 356.6, "F2 C3 A3 C4")], vel=0.16, a=0.9, r=1.0)
    S.line("solo", 346.9, [(0, 1, "C4"), (1, 1, "F4"), (2, 2, "G4"), (4, 1, "A4"), (5, 1, "G4"), (6, 2, "F4"),
                           (8, 1, "D4"), (9, 2, "C4", 0.9)], bpm=72, timbre="violin", vel=0.08, p=0.25)
    # S06-06/07 ARMENIAN GENOCIDE 357.2-388.8: one solo cello, sustained, no percussion (EXCLUSIVE)
    S.line("solo", 357.4, [(0, 4, "D3"), (4, 2, "Eb3"), (6, 4, "D3"), (10, 2, "C3"), (12, 5, "D3", 0.9),
                           (17.5, 3, "F3"), (20.5, 2, "Eb3"), (22.5, 4, "D3"), (26.5, 2, "C3", 0.85),
                           (28.5, 2.5, "D3", 0.75)], bpm=60, timbre="cello", vel=0.15, p=-0.05, a=0.9, r=1.6)

    # ---------------------------------------------------------------- s07 VERDUN AND THE SOMME (390-450)
    S.drums(390.2, 400.6, 60, "B.......", vel=0.32)
    S.swell(390.2, 400.6, "D1 D2 A2", 0.14, 0.20, r=0.5, bright=0.6)
    # Verdun: heavy, slow brass
    S.brass(400.7, 3.6, "D2 A2 D3 F3", 0.30, a=0.3, r=0.9, dark=0.8)
    S.brass(404.4, 4.0, "Bb1 F2 Bb2 D3", 0.28, a=0.3, r=1.2, dark=0.8)
    S.timp(400.7, "D2", 0.35, 2.0)
    S.timp(404.4, "Bb1", 0.32, 2.0)
    S.prog([(400.7, 404.4, "D2 A2 F3"), (404.4, 408.9, "Bb1 F2 D3")], vel=0.16, a=0.4, r=0.8)
    # the Somme: the music sinks
    S.prog([(408.9, 412.4, "G1 D2 Bb2"), (412.4, 418.3, "Eb2 Bb2 G3")], vel=lambda t: 0.15 - 0.07 * (t - 409) / 9,
           a=0.8, r=0.3, bright=0.6)
    # S07-04 after the whistles: out, then one sustained low cello note (EXCLUSIVE)
    S.line("solo", 421.0, [(0, 6.4, "A2")], bpm=60, timbre="cello", vel=0.12, p=0.0, a=1.6, r=0.6)
    # S07-05 the Pals: one soft piano line (EXCLUSIVE piano)
    S.add("piano", piano_note(midi(nm("D4")), 0.14, dur=2.0, seed=S._s()), 428.2, 0)
    for k, (t, n_) in enumerate([(429.4, "F4"), (430.4, "E4"), (431.4, "D4"), (432.6, "C#4"), (433.5, "D4")]):
        S.add("piano", piano_note(midi(nm(n_)), 0.12, dur=1.6, seed=S._s()), t, 0)
    S.add("piano", piano_note(midi(nm("D3")), 0.09, dur=4.0, seed=S._s()), 428.2, -0.2)
    # S07-06 the cost: low drone, slow drum
    S.swell(434.6, 441.6, "D2 A2", 0.10, 0.14, r=0.6, bright=0.5)
    S.drums(435.0, 441.4, 50, "b.......", vel=0.28)
    # S07-07 the debate: even and open fifths, then rising briefly into s08
    S.prog([(441.6, 444.6, "D3 A3 E4"), (444.6, 447.4, "F3 C4 G4")], vel=0.12, a=1.0, r=0.6)
    S.swell(447.4, 450.4, "C3 G3 C4 E4", 0.08, 0.20, r=0.3, bright=0.9)

    # ---------------------------------------------------------------- s08 THE HOME FRONT (450-500)
    S.ostinato(450.0, 460.6, 120, 2, ["F3", "C4", "A3", "C4"], vel=0.12, accent=(1, 0.75))
    S.prog([(450.0, 452.5, "F2 C3 A3"), (452.5, T("s08", 1), "C3 G3 E4"), (T("s08", 1), 457.2, "D3 A3 F4"),
            (457.2, 460.6, "Bb2 F3 D4")], vel=0.13, a=0.5, r=0.7)
    # S08-02 women at work 460.7-469.9: light (pizz + flute), then muted at b3 "canaries"
    S.ostinato(460.7, 469.8, 120, 1, ["F2", "C3", "A2", "C3"], vel=0.24, kind="pizz")
    S.line("wood", 461.0, [(0, 1, "A4"), (1, 1, "C5"), (2, 1, "F5"), (3, 1, "E5"), (4, 2, "D5"), (6, 1, "C5"),
                           (7, 1, "A4"), (8, 2, "G4"), (10, 1, "A4"), (11, 1, "Bb4"), (12, 2, "C5"), (14, 2, "A4", 0.8)],
           bpm=120, timbre="flute", vel=0.09, p=0.25)
    S.prog([(460.7, 463.8, "F3 C4 A4"), (463.8, 466.8, "Bb2 F3 D4"), (466.8, 469.8, "C3 G3 E4")], vel=0.11, a=0.4)
    S.prog([(469.9, 472.8, "D3 A3 F4"), (472.8, 475.8, "A2 E3 C4")], vel=0.08, a=0.9, r=0.6, bright=0.5)
    # S08-03 nurses 475.9-482.1: warm, gentle strings
    S.prog([(475.9, 477.9, "Bb2 F3 D4"), (477.9, 479.9, "F2 C3 A3"), (479.9, 481.9, "C3 G3 E4 G4")], vel=0.13, a=0.9, r=0.6)
    S.line("solo", 476.1, [(0, 1, "F4"), (1, 1, "G4"), (2, 2, "A4"), (4, 1, "G4"), (5, 1.5, "E4", 0.8)],
           bpm=70, timbre="violin", vel=0.07, p=0.25)
    # S08-04 Poplar 482.1-488.3: one soft piano note (EXCLUSIVE piano)
    S.add("piano", piano_note(midi(nm("A4")), 0.12, dur=5.0, seed=S._s()), 482.4, 0.1)
    S.add("piano", piano_note(midi(nm("D3")), 0.07, dur=5.0, seed=S._s()), 482.42, -0.1)
    # S08-05 rationing, blockade 488.3-500: thin, high strings
    S.swell(488.3, 494.0, "D4 A4", 0.05, 0.07, r=0.6, bright=0.6)
    S.swell(493.6, 499.8, "C4 G4 D5", 0.05, 0.06, r=0.4, bright=0.6)
    S.swell(493.6, 499.8, "D2", 0.06, 0.08, r=0.4, bright=0.5)

    # ---------------------------------------------------------------- s09 1917 THE TURNING YEAR (500-560)
    # U-boats + telegram: suspense (low spiccato pulse, high tense fifths)
    S.ostinato(500.0, 519.8, 96, 2, ["D2", None, "D2", None, "D2", "Eb2", "D2", None], vel=0.14)
    S.swell(500.0, 510.0, "A3 E4", 0.04, 0.07, r=0.3, bright=0.6)
    S.swell(510.0, 519.8, "Bb3 E4", 0.05, 0.08, r=0.3, bright=0.6)
    S.swell(500.0, 519.8, "D2 A2", 0.10, 0.12, r=0.5, bright=0.5)
    # America enters 520-534.5: a rising swell, opening into a hopeful F-major horn phrase
    S.prog([(520.0, 523.4, "Bb2 F3 D4"), (523.4, 526.6, "C3 G3 E4"), (526.6, 530.0, "D3 A3 F4"),
            (530.0, 534.4, "F2 C3 A3 C4 F4")], vel=lambda t: 0.12 + 0.08 * (t - 520) / 14, a=0.9, r=0.6)
    S.line("horn", 528.6, [(0, 1, "C4"), (1, 1, "F4"), (2, 1, "G4"), (3, 3, "A4"), (6, 2.5, "G4", 0.85)],
           bpm=80, timbre="horn", vel=0.15, p=-0.15)
    # Passchendaele 534.5-543.8: slow, grinding low strings
    S.prog([(534.5, 537.6, "D2 A2 F3"), (537.6, 540.7, "Eb2 Bb2 G3"), (540.7, 543.8, "D2 A2 E3")], vel=0.17, a=0.8,
           r=0.8, bright=0.6)
    S.line("solo", 534.8, [(0, 3, "F3"), (3, 3, "Eb3"), (6, 3, "D3", 0.9)], bpm=60, timbre="cello", vel=0.12)
    S.brass(537.6, 3.0, "Eb1 Bb1", 0.18, a=0.6, r=1.0, dark=0.7)
    # Russia: restless strings
    S.ostinato(543.8, 549.9, 132, 2, ["G3", "Bb3", "D4", "Bb3"], vel=0.13, accent=(1, 0.7))
    S.prog([(543.8, 547.0, "G2 D3 Bb3"), (547.0, 549.9, "A2 E3 C#4")], vel=0.12, a=0.4, r=0.4)
    # 550-560 dark pulse into s10
    S.pulse(550.0, 559.6, bpm=60, vel=0.40, double=True, cresc=(0.7, 1.0))
    S.swell(550.0, 560.4, "D2 A2 D3 Eb3", 0.08, 0.16, r=0.4, bright=0.6)

    # ---------------------------------------------------------------- s10 1918 THE LAST BATTLES (560-620)
    # the Spring Offensive: train rhythm, then a heavy drum roll as the bulge grows
    S.ostinato(560.0, 566.7, 104, 4, ["D2", "D2", "A2", "D2"], vel=0.13, accent=(1, 0.5, 0.75, 0.5))
    S.prog([(560.0, 563.4, "D3 A3 F4"), (563.4, 566.7, "Bb2 F3 D4")], vel=0.13, a=0.6, r=0.4)
    S.roll(566.7, 6.8, "D2", 0.04, 0.42)
    S.prog([(566.7, 570.0, "D2 A2 F3"), (570.0, 573.8, "Eb2 Bb2 G3 Bb3")], vel=lambda t: 0.13 + 0.07 * (t - 566.7) / 7,
           a=0.5, r=0.5)
    S.brass(570.0, 3.4, "Eb2 Bb2", 0.26, a=0.4, r=0.6)
    # Foch, the Allies hold: resolute strings + the channel motif
    S.prog([(573.9, 575.6, "Bb2 F3 D4"), (575.6, 577.2, "F2 C3 A3"), (577.2, 578.9, "G2 D3 Bb3"),
            (578.9, 580.6, "A2 E3 C#4")], vel=0.17, a=0.4, r=0.6)
    S.line("horn", 574.1, [(0, 0.6, "A3"), (0.6, 0.6, "D4"), (1.2, 0.5, "E4"), (1.7, 1.8, "F4"),
                           (3.5, 0.6, "E4", 0.9), (4.1, 0.6, "D4"), (4.7, 0.6, "C#4"), (5.3, 1.4, "D4", 0.85)],
           bpm=84, timbre="horn", vel=0.17, p=-0.1)
    # Amiens, tanks: driving brass and drums
    S.ostinato(580.6, 590.5, 120, 2, ["D3", "D3", "A3", "D3", "F3", "D3", "A3", "D3"], vel=0.15, accent=(1, 0.7))
    S.drums(580.6, 590.5, 120, "B.s.b.s.", vel=0.30)
    for t, chd, bv in [(580.6, "D2 A2 D3", 0.28), (582.6, "C2 G2 C3", 0.28), (584.6, "Bb1 F2 Bb2", 0.28),
                       (586.6, "A1 E2 A2", 0.26), (588.6, "D2 A2 D3", 0.18)]:
        S.brass(t, 1.7, chd, bv, r=0.5)
    S.prog([(580.6, 584.6, "D3 A3 F4"), (584.6, 588.6, "Bb2 F3 D4"), (588.6, 590.6, "A2 E3 C#4")], vel=0.14, a=0.3)
    # Hundred Days, collapse: low drum, music begins to thin
    S.drums(590.6, 601.6, 84, "b.......", vel=0.26, cresc=(1.0, 0.5))
    S.prog([(590.6, 594.7, "D3 A3 F4"), (594.7, 598.2, "Bb2 F3 D4"), (598.2, 601.7, "G2 D3 Bb3")],
           vel=lambda t: 0.14 - 0.06 * (t - 590.6) / 11, a=0.8, r=0.6)
    # Compiegne before dawn: music almost out
    S.swell(601.7, ELEVEN - 0.1, "D2 A3", 0.05, 0.02, r=0.1, bright=0.4)
    # 609.5-610.5 total silence; music re-enters very quietly at b8 (612.83): a single sustained note
    S.line("solo", T("s10", 8), [(0, 6.4, "D3")], bpm=60, timbre="cello", vel=0.10, a=2.0, r=1.0)

    # ---------------------------------------------------------------- s11 THE COST AND THE LEGACY (620-720)
    # a sombre, reflective theme (D minor)
    S.prog([(620.2, 623.8, "D3 A3 F4"), (623.8, 627.0, "Bb2 F3 D4"), (627.0, T("s11", 2), "G2 D3 Bb3")],
           vel=0.14, a=1.2, r=0.9)
    S.piano(620.5, "D3 A3 F4", 0.12, dur=3.0)
    S.line("solo", 621.0, [(0, 2, "A3"), (2, 2, "F3"), (4, 1, "G3"), (5, 3, "E3"), (8, 2, "D3", 0.9)],
           bpm=66, timbre="cello", vel=0.12, p=-0.2)
    # S11-02 civilians, flu: low strings
    S.prog([(630.2, 633.6, "G2 D3 Bb3"), (633.6, 637.0, "D3 A3 F4"), (637.0, 640.4, "Bb2 F3 D4"),
            (640.4, 643.6, "A2 E3 C#4")], vel=0.13, a=1.0, r=0.8, bright=0.7)
    # S11-03 four empires collapse: steady, reflective (piano arpeggio)
    S.prog([(643.6, 646.0, "F2 C3 A3"), (646.0, 648.4, "C3 G3 E4"), (648.4, 650.8, "D3 A3 F4"),
            (650.8, 653.4, "Bb2 F3 D4")], vel=0.13, a=0.9, r=0.4)
    S.arp([(643.6, 646.0, "F2 C3 F3 A3"), (646.0, 648.4, "C3 G3 C4 E4"), (648.4, 650.8, "D3 A3 D4 F4"),
           (650.8, 653.3, "Bb2 F3 Bb3 D4")], bpm=72, sub=2, order=[0, 1, 2, 3, 2, 1], vel=0.10)
    # S11-04 the two graves near Mons: solo piano (EXCLUSIVE)
    for t, chd, v in [(653.6, "D3 A3 F4", 0.12), (656.6, "Bb2 F3 D4", 0.11), (659.6, "G2 D3 Bb3", 0.11),
                      (662.6, "A2 E3 C#4", 0.10), (665.6, "D3 A3 D4", 0.09)]:
        S.piano(t, chd, v, dur=3.0)
    for t, n_ in [(654.6, "A4"), (655.6, "F4"), (657.6, "D5"), (658.6, "C5"), (660.6, "Bb4"), (661.6, "A4"),
                  (663.6, "G4"), (664.6, "E4"), (666.2, "D4")]:
        S.add("piano", piano_note(midi(nm(n_)), 0.11, dur=1.6, seed=S._s()), t, 0.1)
    # S11-05 remembrance + poem (EXCLUSIVE solo cello, then bugle). b6: near-silence, very faint
    S.line("solo", 670.4, [(0, 4.4, "A2", 0.6)], bpm=60, timbre="cello", vel=0.09, a=2.0, r=0.6)
    S.line("solo", 675.0, [(0, 2.8, "D3"), (2.8, 1.6, "F3"), (4.4, 2.6, "A3"), (7.0, 1.4, "G3"), (8.4, 1.6, "F3"),
                           (10.0, 3.0, "E3", 0.85)], bpm=60, timbre="cello", vel=0.12, a=0.9, r=1.0)
    # AU-S1: a short, very quiet, original bugle phrase in the 1.0 s gap after the poem
    S.line("bugle", BUGLE[0] + 0.02, [(0, 0.22, "A4", 0.85), (0.24, 0.22, "D5", 0.9), (0.48, 0.52, "F#5", 1.0)],
           bpm=60, timbre="bugle", vel=0.10, p=0.15, glide=0.015, vib=4, a=0.03, r=0.5)
    # Versailles 685.7-704.8: quiet resolve, formal but uneasy
    S.prog([(685.9, 688.6, "D3 A3 F4"), (688.6, 691.2, "Bb2 F3 D4"), (691.2, 694.0, "F2 C3 A3"),
            (694.0, 697.4, "G2 D3 Bb3"), (697.4, 700.8, "Eb3 Bb3 G4"), (700.8, 704.6, "A2 E3 C#4 G4")],
           vel=lambda t: 0.08 + 0.06 * min(1, (t - 685.7) / 4), a=1.4, r=0.8)
    S.line("horn", 688.8, [(0, 1, "D4"), (1, 1, "F4"), (2, 2, "E4"), (4, 1, "D4"), (5, 3, "C4", 0.9)],
           bpm=66, timbre="horn", vel=0.10, p=-0.15)
    # "Just 20 years later": a low, uneasy note, then a resolving phrase into the end card
    S.swell(704.85, 711.6, "D1 D2 Eb2", 0.10, 0.18, r=0.4, bright=0.6)
    S.prog([(711.6, 713.8, "G2 D3 Bb3 E4"), (713.6, 715.2, "A2 E3 A3 C#4")], vel=0.13, a=0.6, r=0.6)
    # END CARD 713.8-720: the channel motif (piano + horn), resolving on D, fading to 0 at 720
    S.line("horn", 713.8, [(0, 0.6, "A3"), (0.6, 0.6, "D4"), (1.2, 0.5, "E4"), (1.7, 1.2, "F4"),
                           (2.9, 0.5, "E4", 0.9), (3.4, 0.5, "D4", 0.85), (3.9, 0.5, "C#4", 0.8), (4.4, 1.6, "D4", 0.75)],
           bpm=84, timbre="horn", vel=0.15, p=-0.1)
    S.pad(715.2, 719.9, "D2 A2 D3 F#3 A3 D4", vel=0.15, a=0.4, r=0.1)
    S.piano(715.2, "D3 A3 D4 F#4", 0.13, dur=4.5)
    S.bell(715.22, "A5", 0.06, 4.0)


# ============================================================================== automation
def _window_gain(s0, s1, fo, fi):
    """1 outside, 0 inside [s0, s1), with a fade-out before s0 and a squared fade-in after s1."""
    g = np.ones(N)
    a, b = ns(s0), ns(s1)
    fo_n, fi_n = ns(fo), ns(fi)
    g[max(0, a - fo_n):a] *= np.linspace(1, 0, a - max(0, a - fo_n))
    g[a:b] = 0
    e = min(N, b + fi_n)
    g[b:e] *= np.linspace(0, 1, e - b) ** 2
    return g


def stem_masks():
    """Per-stem gain curves for the single-instrument windows (EXCLUSIVE)."""
    m = {k: np.ones(N) for k in Score.STEMS}
    for s0, s1, allowed, f in EXCLUSIVE:
        g = _window_gain(s0, s1, f, f)
        for k in m:
            if k not in allowed:
                m[k] *= g
    return m


def master_curve():
    """Programme-level dynamics (pre-duck) + the silence masks."""
    g = np.ones(N)
    # final fade 716.0 -> 719.9 (end card), silent at 720
    i0, i1 = ns(716.0), ns(719.9)
    g[i0:i1] *= np.cos(np.linspace(0, np.pi / 2, i1 - i0)) ** 1.5
    g[i1:] = 0
    for (s0, s1, fo, fi) in MUSIC_SILENCE:
        g *= _window_gain(s0, s1, fo, fi)
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


def duck_curve(depth_db=DUCK_DB, attack=0.30, release=0.9):
    """Gain curve: depth_db under speech, smooth raised-cosine ramps (attack before the word)."""
    tgt = np.zeros(N)
    for a, b in speech_regions():
        tgt[ns(max(0, a)):ns(b)] = 1.0
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
    mus = S.render(stem_dir, stem_masks())
    print(f"rendered in {time.time() - t_start:.1f}s")
    mus *= master_curve()[:, None]
    # level: the un-ducked score peaks at -6 dBFS true peak (the mix script sets the final balance)
    tp = true_peak_db(mus)
    mus *= undb(-6.0 - tp)
    duck, d = duck_curve()
    np.save(os.path.join(ENG, "output", "music-duck.npy"), duck.astype(np.float32))
    ducked = mus * duck[:, None]
    os.makedirs(PROD, exist_ok=True)
    os.makedirs(os.path.join(ENG, "public", "audio"), exist_ok=True)
    sf.write(os.path.join(PROD, f"episode-{TAG}-music.wav"), mus.astype(np.float32), SR, subtype="PCM_24")
    sf.write(os.path.join(ENG, "public", "audio", "music.wav"), ducked.astype(np.float32), SR, subtype="PCM_16")
    np.save(os.path.join(ENG, "output", "music-unducked.npy"), mus.astype(np.float32))
    print(f"music: true peak {true_peak_db(mus):.2f} dBTP, integrated {integrated_lufs(mus):.2f} LUFS (un-ducked); "
          f"ducked {integrated_lufs(ducked):.2f} LUFS; done in {time.time() - t_start:.1f}s")


if __name__ == "__main__":
    main()
