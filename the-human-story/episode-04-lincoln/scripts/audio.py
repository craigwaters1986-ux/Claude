#!/usr/bin/env python3
"""Episode 4 (Abraham Lincoln) sound: narration on the locked timeline, score, synthesised SFX, mix, master and stems.

Score (Phase D2, channel standard): ten instrumental cues generated with ElevenLabs Music, one per chapter
(production/audio/ep04-lincoln/elevenlabs-score/), placed by compose_el() below. Narration: ElevenLabs voice Liam Dale,
assembled by scripts/el_assemble.py (usage: python scripts/audio.py output/el-full). SFX and the few sync hits are
synthesised here. If the cue files are missing (or SYNTH_SCORE=1), the original synthesised score compose() is used.

The synthesised fallback (numpy/scipy, no samples, no recordings): the score builds
on the approved Phase B music test (scripts/music_test.py): the same original Lincoln theme (D major, 72 bpm), the same
instruments (solo fiddle + piano, string ensembles, horns, low brass, formant choir, war ostinato with side drum and
bass-drum heartbeat) and the same convolution hall. Cues 1M1-1M11 follow production/storyboards/ep04-lincoln/
music-cue-sheet.md; hits land on plan beats and chapter starts (exact). No public-domain tune is quoted.
Restraint: no gunshot at Ford's Theatre, no comic sounds, distant soft cannon only at Fort Sumter, no applause at
Charleston; 1M10 has no hits.

Inputs : NARRATION_DIR/narration-draft.wav + narration-draft-audit.json, production edit-plan.json, captions-aligned.srt
Outputs: public/audio/mix.wav (48 kHz stereo 16-bit, exactly 600.000 s), output/stems/{narration,music,sfx}.wav,
         output/mix-stats.json, production/audio/ep04-lincoln/episode-04-mix-listen.mp3 (96 kb/s)
usage  : python scripts/audio.py NARRATION_DIR          (REUSE_MUSIC=1 reuses output/music-stem.npy)
"""
import json, os, re, subprocess, sys, time
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_lib import *  # noqa
from audio_lib import _kweight  # noqa (not exported by *)
from sfxlib import *  # noqa

T0 = time.time()
ENG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.abspath(os.path.join(ENG, '..', '..'))
PROD_S = os.path.join(ROOT, 'production', 'scripts', 'ep04-lincoln')
PROD_A = os.path.join(ROOT, 'production', 'audio', 'ep04-lincoln')
DUR = 600.0
N = ns(DUR)
NARDIR = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ENG, 'output', 'full-voice')
plan = json.load(open(os.path.join(PROD_S, 'edit-plan.json')))
audit = json.load(open(os.path.join(NARDIR, 'narration-draft-audit.json')))
GR = [(g['final_start_ms'] / 1000, g['final_end_ms'] / 1000) for g in plan['groups']]
BEATS = [(b['start_ms'] / 1000, b['end_ms'] / 1000) for b in plan['beats']]
CH = [c['start_ms'] / 1000 for c in plan['chapters']]


def log(msg):
    print(f'[{time.time() - T0:6.0f}s] {msg}', flush=True)


def srt_cues(path):
    out = []
    for b in re.split(r'\n\s*\n', open(path).read().strip()):
        l = b.split('\n'); a, e = l[1].split(' --> ')
        f = lambda t: (lambda h, m, s: int(h) * 3600 + int(m) * 60 + float(s))(*t.replace(',', '.').split(':'))
        out.append((f(a), f(e), ' '.join(l[2:])))
    return out


CUES = srt_cues(os.path.join(PROD_S, 'captions-aligned.srt'))


def cue(phrase, edge=0):
    norm = lambda x: x.lower().replace('’', "'").replace('\n', ' ')
    p = norm(phrase)
    for a, b, t in CUES:
        if p in norm(t):
            return a if edge == 0 else b
    raise KeyError(phrase)


def beat_at(t):
    """The plan beat that starts at t (exact)."""
    for a, b in BEATS:
        if abs(a - t) < 0.01:
            return a, b
    raise KeyError(t)


# ------------------------------------------------------------------ narration on the programme timeline
def narration():
    raw, sr = sf.read(os.path.join(NARDIR, 'narration-draft.wav'))
    assert sr in (24000, 48000)
    if raw.ndim > 1: raw = raw.mean(axis=1)
    if sr == 24000: raw = resample_poly(raw, 2, 1)  # Kokoro drafts; the ElevenLabs narration is assembled at 48 kHz
    out = np.zeros(N)
    for g in plan['groups']:
        a = audit[g['group']]
        seg = raw[ns(a['start']):ns(a['end'])]
        i = ns(g['final_start_ms'] / 1000)
        out[i:i + len(seg)] += seg[: N - i]
    return out


def speech_regions(pre=0.2, post=0.35, merge=0.9):
    regs = sorted([[a - pre, b + post] for a, b in GR])
    out = [regs[0]]
    for a, b in regs[1:]:
        if a - out[-1][1] < merge:
            out[-1][1] = max(out[-1][1], b)
        else:
            out.append([a, b])
    return out


def speech_weight(attack=0.35):
    """1 under speech, 0 in the silent beats, with raised-cosine ramps (1 kHz control rate, interpolated)."""
    cr = 1000
    m = int(DUR * cr) + 1
    tgt = np.zeros(m)
    for a, b in speech_regions():
        tgt[int(max(0, a) * cr):int(min(DUR, b) * cr)] = 1.0
    k = int(attack * cr)
    ker = np.hanning(2 * k + 1); ker /= ker.sum()
    d = np.convolve(np.pad(tgt, k, mode='edge'), ker, mode='same')[k:-k]
    return np.clip(np.interp(np.arange(N) / SR, np.arange(m) / cr, d), 0, 1)


def duck_curve(depth_db=-13.0, attack=0.35, beat_db=0.0):
    """Gain curve: depth_db under speech, beat_db in the beats (Phase D: beats capped at -5 dB, Craig found the swells too loud)."""
    return undb(beat_db + (depth_db - beat_db) * speech_weight(attack))


def ride_ceiling(music, weight, l_nar, under=19.0, beat=4.0, passes=2):
    """Speech-aware ceiling for the music bus (Phase D2). No 400 ms block of music may come closer to the narration's
    integrated loudness than `under` dB while the narrator speaks, or `beat` dB in the silent beats. Only blocks over
    the ceiling are turned down, by the excess, with 0.3 s ramps; everything else is untouched. Returns
    (music, the largest reduction in dB, the number of 100 ms blocks touched in the last pass that needed any)."""
    worst, touched = 0.0, 0
    for _ in range(passes):
        ts, lm, _ = block_loudness(music)
        wc = weight[np.minimum(N - 1, ((ts + 0.2) * SR).astype(int))]
        ceil = l_nar - (beat + (under - beat) * wc)
        ex = np.maximum(0.0, lm - ceil)
        if ex.max() < 0.05:
            break
        worst, touched = max(worst, float(ex.max())), int((ex > 0.05).sum())
        cr = 100
        red = np.zeros(int(DUR * cr) + 1)
        for t, e in zip(ts[ex > 0.05], ex[ex > 0.05]):
            i, j = int(round(t * cr)), int(round((t + 0.4) * cr))
            red[i:j + 1] = np.maximum(red[i:j + 1], e + 0.3)
        k = 30
        red = np.maximum.reduce([np.roll(red, q) for q in range(-k // 2, k // 2 + 1)])  # hold through the ramp
        ker = np.hanning(2 * k + 1); ker /= ker.sum()
        red = np.convolve(np.pad(red, k, mode='edge'), ker, mode='same')[k:-k]
        g = undb(-np.interp(np.arange(N) / SR, np.arange(len(red)) / cr, red))
        music = music * g[:, None]
    return music, worst, touched


# ------------------------------------------------------------------ score: instruments from the approved test
BPM = 72
B = 60 / BPM
BAR = 4 * B
BUF = {}


def put(sig, at, gain=1.0, p=0.0, wet=0.35, bus='m'):
    s = pan(sig, p) if sig.ndim == 1 else sig
    place(BUF[bus], s, at, gain)
    place(BUF[bus + 'h'], s, at, gain * wet)


PHRASE1 = [(1, 'A4'), (1, 'D5'), (1, 'E5'), (1, 'F#5'), (1.5, 'F#5'), (0.5, 'E5'), (1, 'D5'), (1, 'E5'),
           (1, 'F#5'), (1, 'A5'), (1, 'G5'), (1, 'F#5'), (3, 'E5'), (1, 'A4')]
PHRASE2 = [(1, 'D5'), (1, 'E5'), (1, 'F#5'), (1.5, 'F#5'), (0.5, 'E5'), (1, 'D5'), (1, 'B4'), (1, 'D5'),
           (1, 'E5'), (1, 'F#5'), (1, 'E5'), (4, 'D5')]
CHORDS_A = [['D3', 'A3', 'D4', 'F#4'], ['G2', 'D3', 'B3', 'D4'], ['D3', 'A3', 'F#4'], ['A2', 'E3', 'C#4', 'E4'],
            ['B2', 'F#3', 'D4'], ['G2', 'D3', 'B3'], ['A2', 'E3', 'G3', 'C#4'], ['D3', 'A3', 'D4', 'F#4']]
C = dict(D=['D3', 'A3', 'D4', 'F#4'], G=['G2', 'D3', 'B3', 'D4'], A=['A2', 'E3', 'C#4', 'E4'], Bm=['B2', 'F#3', 'D4'],
         Em=['E2', 'B2', 'G3', 'E4'], A7=['A2', 'E3', 'G3', 'C#4'], Dm=['D3', 'F3', 'A3'], Bb=['Bb2', 'F3', 'D4'],
         Gm=['G2', 'D3', 'Bb3'], C=['C3', 'G3', 'E4'], F=['F2', 'C3', 'A3'], Dlow=['D2', 'A2', 'D3', 'F#3'],
         Dmlow=['D2', 'A2', 'D3', 'F3'], Edim=['E2', 'Bb2', 'G3'], Gmaj7=['G2', 'D3', 'F#3', 'B3'], FsM=['F#2', 'C#3', 'A3'])
OSTI = ['D2', 'D2', 'F2', 'D2', 'A2', 'D2', 'F2', 'E2']


def melody(phrases, t0, shift=0, beat=B):
    out, t = [], t0
    for ph in phrases:
        for bts, n in ph:
            out.append((t, bts * beat * 0.98, nm(n) + shift))
            t += bts * beat
    return out, t


def line(notes, at, timbre='violin', vel=0.42, vib=20, seed=4, a=0.18, r=1.4, gain=0.9, p=0.12, wet=0.5, vs=0.9, bus='m'):
    """Bowed/blown legato line from absolute-time notes [(t, dur, midi)]; `at` later than the first note delays the line."""
    if at > notes[0][0]:
        dt = at - notes[0][0]
        notes = [(t + dt, d, m) for t, d, m in notes]
    at = notes[0][0] if at > notes[0][0] or at < notes[0][0] - 30 else at
    s = legato_line([(t - at, d, m, vs) for t, d, m in notes], vel=vel, vib=vib, timbre=timbre, seed=seed, a=a, r=r)
    put(s, at, gain, p=p, wet=wet, bus=bus)


def theme(phrases, t0, timbre='violin', shift=0, beat=B, tail=(), **kw):
    mel, tend = melody(phrases, t0, shift, beat)
    for d_beats, n in tail:
        mel.append((tend, d_beats * beat * 0.98, nm(n) + shift)); tend += d_beats * beat
    line(mel, t0, timbre=timbre, **kw)
    return tend


def piano_theme(phrases, t0, shift=-12, beat=B * 1.12, vel=0.4, seed=600, gain=0.9, wet=0.6):
    mel, tend = melody(phrases, t0, shift, beat)
    for j, (t, d, m) in enumerate(mel):
        put(piano_note(midi(m), vel=vel, dur=d * 1.4, seed=seed + j, bright=0.8), t, gain, p=0.05, wet=wet)
    return tend


def piano_chord(notes, t, vel=0.28, dur=B * 2, seed=0, gain=0.8, roll=0.06, wet=0.45, bright=1.0):
    for j, n in enumerate(notes):
        put(piano_note(midi(nm(n)), vel=vel, dur=dur, seed=seed + j, bright=bright), t + j * roll, gain, p=-0.15 + j * 0.1, wet=wet)


def piano_bed(t0, nbars, beat=B, vel=0.3, chords=CHORDS_A, seed=10, k0=0):
    bar = 4 * beat
    for k in range(nbars):
        piano_chord(chords[(2 * (k + k0)) % len(chords)], t0 + k * bar, vel, beat * 2, seed + 10 * k)
        piano_chord(chords[(2 * (k + k0) + 1) % len(chords)], t0 + k * bar + 2 * beat, vel * 0.88, beat * 2, seed + 10 * k + 5)


def ensemble(notes, t, dur, vel, seed, wet=0.45, spread=0.6, voices=4, bright=1.0, a=0.7, r=1.6, gain=0.55, bus='m'):
    for i, n in enumerate(notes):
        s = string_note(midi(nm(n)), dur, vel=vel, a=min(a, dur * 0.5), r=r, voices=voices, bright=bright, seed=seed + i, vib=12)
        put(s, t, gain, p=(i / max(1, len(notes) - 1) - 0.5) * spread, wet=wet, bus=bus)


def strings(a, b, chords, bar=BAR, vel=0.22, bright=0.8, seed=100, voices=4, spread=0.8, wet=0.45, bass=False):
    t, k = a, 0
    while t < b - 0.6:
        d = min(bar, b - t)
        ch = chords[k % len(chords)]
        ensemble(ch, t, d * 0.99, vel, seed + 7 * k, wet=wet, spread=spread, voices=voices, bright=bright)
        if bass:
            put(string_note(midi(nm(ch[0]) - 12), d, vel=vel * 0.9, a=0.5, r=1.4, voices=3, bright=0.6, seed=seed + 7 * k + 5, vib=6), t, 0.55, p=-0.1, wet=0.35)
        t += bar; k += 1


def drone(a, b, notes, vel=0.12, bright=0.5, seed=900, wet=0.5, att=2.0, rel=2.5):
    for i, n in enumerate(notes):
        s = string_note(midi(nm(n)), b - a, vel=vel, a=min(att, (b - a) * 0.4), r=rel, voices=3, bright=bright, seed=seed + i, vib=5)
        put(s, a, 0.55, p=(i - (len(notes) - 1) / 2) * 0.35, wet=wet)


def pizz(a, b, chords, step=B / 2, vel=0.22, seed=300, bar=BAR, pattern=(0, 2, 1, 2)):
    t, j = a, 0
    while t < b - 0.2:
        ch = chords[int((t - a) // bar) % len(chords)]
        n = ch[pattern[j % len(pattern)] % len(ch)]
        put(pizz_note(midi(nm(n)), vel=vel * (1.0 if j % 4 == 0 else 0.75), seed=seed + j), t, 0.9, p=-0.3 + 0.2 * (j % 3), wet=0.35)
        t += step; j += 1


def horn(notes, t, dur, vel=0.3, seed=60, gain=0.6, a=0.9, r=1.2, p=0.4, wet=0.6, bus='m'):
    for j, n in enumerate(notes):
        put(brass_note(midi(nm(n)), dur, vel=vel, a=a, r=r, seed=seed + j), t, gain, p=p - 0.25 * j, wet=wet, bus=bus)


def choir(f0s, dur, vel=0.4, seed=0):
    """Formant 'ah' choir pad (from the music test): detuned saws through vowel formants."""
    n = int((dur + 2.0) * SR)
    rr = np.random.default_rng(seed)
    x = np.zeros(n)
    for f0 in f0s:
        for v in range(4):
            fr = vibrato_curve(n, f0 * 2 ** (rr.uniform(-12, 12) / 1200), rate=rr.uniform(4.5, 5.5), depth_cents=18, delay=0.4, seed=seed + v)
            x += blsaw(fr, n, rr.uniform())
    x /= 4 * len(f0s)
    y = bp(x, 650, 950) * 1.0 + bp(x, 1000, 1300) * 0.6 + bp(x, 2600, 3200) * 0.25 + lp(x, 400) * 0.4
    y = y + bp(noise_n(n, seed + 9), 2000, 6000) * 0.01
    return hp(y * env_swell(n, min(1.2, dur * 0.4), 1.8) * vel, 80)


def put_choir(notes, t, dur, vel=0.4, seed=0, gain=0.7, wet=0.8, bus='m'):
    put(choir([midi(nm(n)) for n in notes], dur, vel=vel, seed=seed), t, gain, wet=wet, bus=bus)


def war(a, b, beat=B * 0.9, v0=0.3, v1=0.55, drums=True, drum_from=None, seed=200, bb_alt=True):
    """War motif: D-minor eighth-note ostinato (cellos/basses), side drum, bass-drum heartbeat."""
    t, i = a, 0
    while t < b - 0.05:
        m = nm(OSTI[i % 8])
        if bb_alt and (i // 16) % 2 == 1 and OSTI[i % 8] == 'D2':
            m -= 4
        v = v0 + (v1 - v0) * (t - a) / max(0.1, b - a)
        put(string_note(midi(m), beat / 2 * 0.8, vel=v, a=0.01, r=0.25, voices=4, bright=1.3, seed=seed + i, vib=0), t, 0.7, p=-0.2, wet=0.2)
        t += beat / 2; i += 1
    if not drums:
        return
    t, k = (drum_from if drum_from is not None else a), 0
    while t < b - 0.05:
        x = (t - a) / max(0.1, b - a)
        v = 0.22 + 0.4 * x * (v1 / 0.6)
        put(snare_soft(v, seed=seed + k), t, 0.8, p=0.3, wet=0.25)
        put(snare_soft(v * 0.6, seed=seed + k + 50), t + beat * 0.75, 0.8, p=0.3, wet=0.25)
        if k % 2 == 0:
            put(war_drum(0.5 + 0.3 * x, seed=seed + k), t, 0.9, wet=0.3)
            put(war_drum(0.38, seed=seed + k + 9), t + beat * 0.4, 0.9, wet=0.3)
        t += beat; k += 1


def march(a, b, beat=B * 0.9, vel=0.4, seed=1300):
    """Steady march: side-drum figure (ta-ta-tum) and bass drum on 1 and 3."""
    t, k = a, 0
    while t < b - 0.05:
        put(snare_soft(vel, seed=seed + k), t, 0.8, p=0.25, wet=0.25)
        put(snare_soft(vel * 0.55, seed=seed + k + 40), t + beat * 0.5, 0.8, p=0.25, wet=0.25)
        if k % 4 == 3:
            put(snare_soft(vel * 0.5, seed=seed + k + 80), t + beat * 0.75, 0.8, p=0.25, wet=0.25)
        if k % 2 == 0:
            put(war_drum(0.42, seed=seed + k), t, 0.9, wet=0.3)
        t += beat; k += 1


def riser(t_end, dur=3.0, vel=0.12, seed=77, bus='m'):
    rn = int(dur * SR)
    x = noise_n(rn, seed)
    cut = np.linspace(400, 7000, rn)
    x = np.concatenate([lp(x[j:j + 4800], cut[j]) for j in range(0, rn, 4800)])[:rn] * np.linspace(0, 1, rn) ** 2 * vel
    put(x, t_end - dur, 1.0, wet=0.5, bus=bus)


def impact(t, chord=('D2', 'A2', 'D3', 'F#3'), choir_notes=('D3', 'A3', 'D4', 'F#4', 'A4'), vel=1.0, seed=21, bus='h'):
    put(timpani(midi(nm('D2')), vel=0.95 * vel, decay=2.6, seed=seed), t, 1.0, wet=0.6, bus=bus)
    put(war_drum(1.0 * vel, f0=48, seed=seed + 78), t, 1.0, wet=0.6, bus=bus)
    for j, n in enumerate(chord):
        put(brass_note(midi(nm(n)), 1.8, vel=0.7 * vel, a=0.02, r=2.2, voices=3, seed=500 + seed + j), t, 0.6, p=(j - 1.5) * 0.3, wet=0.7, bus=bus)
    if choir_notes:
        put_choir(choir_notes, t - 0.4, 2.6, vel=0.45 * vel, seed=seed + 9, wet=0.8, bus=bus)


def sting(t, note='D2', vel=0.32, bus='h'):
    """Soft chapter-card sting: timpani with a light cymbal-less swell."""
    put(timpani(midi(nm(note)), vel=vel, decay=2.0, seed=int(t)), t, 0.9, wet=0.5, bus=bus)


def compose():
    for k in ('m', 'h'):
        BUF[k] = np.zeros((N + ns(10), 2))
        BUF[k + 'h'] = np.zeros((N + ns(10), 2))
    cues = []  # (time, cue, what) for the notes

    # ---------------- 1M1 Two minutes (0:00-0:35): lamp-hum pad, two notes of the theme, riser + impact on the title
    cues.append((0.3, '1M1', 'lamp-hum pad (D3/A3 strings), piano: two notes of the theme (A4, D5) in the 3 s open'))
    drone(0.3, 25.5, ['D3', 'A3'], vel=0.10, bright=0.45, seed=901, att=2.5)
    drone(0.3, 25.5, ['A4'], vel=0.05, bright=0.4, seed=905, att=4.0)
    put(piano_note(midi(nm('A4')), vel=0.36, dur=2.0, seed=1), 0.6, 0.9, wet=0.6)
    put(piano_note(midi(nm('D5')), vel=0.38, dur=3.0, seed=2), 0.6 + B, 0.9, wet=0.6)
    for t, ch in zip([cue('That is roughly'), cue('Five copies survive'), cue('Only one, known'), cue('It is kept in the White'), cue('The man who wrote it')],
                     [C['D'], C['G'], C['Bm'], C['G'], C['A']]):
        piano_chord(ch, t + 0.1, vel=0.2, dur=3.0, seed=int(t * 10))
    b0, b1 = beat_at(GR[0][1])
    T_TITLE = round(b0 + 1.0, 3)
    piano_theme([PHRASE1[:4]], b0 + 0.15, shift=0, beat=B, vel=0.34, seed=30)
    riser(T_TITLE, 3.0, vel=0.13)
    put(timp_roll(midi(nm('A1')), 2.2, v0=0.05, v1=0.85, seed=11), T_TITLE - 2.2, 0.9, wet=0.4, bus='h')
    impact(T_TITLE, choir_notes=('D3', 'A3', 'D4', 'F#4', 'A4'))
    ensemble(C['Dlow'] + ['A4'], T_TITLE, b1 - T_TITLE - 0.6, 0.30, seed=40, spread=0.9, bright=0.9, r=1.4)
    horn(['D4', 'A3'], T_TITLE + 0.2, 4.0, vel=0.32, seed=70)
    cues.append((T_TITLE, '1M1 hit', 'riser over the first 4 s of the title beat; impact (timpani, bass drum, low brass, choir) on the title plate; held D major'))

    # chapter cards: soft sting (no sting at Ford's Theatre, 1M10 has no hits)
    for k, t in enumerate(CH[1:], start=2):
        if k == 9:
            continue
        sting(t + 0.05, 'A1' if k in (5, 6) else 'D2', vel=0.22 if k == 10 else 0.32)

    # ---------------- 1M2 A cabin in Kentucky (0:35-1:30): fiddle over piano; one note in the grave beat
    s = CH[1]
    cues.append((s, '1M2', 'winter-air pad; Lincoln theme on solo fiddle over piano (as the approved test 0:00-0:14)'))
    drone(s + 0.2, GR[1][1], ['D3', 'A3', 'E4'], vel=0.07, bright=0.45, seed=910, att=3.0)
    t0 = s + 3.4
    piano_bed(t0, 4, vel=0.30, seed=10)
    theme([PHRASE1[:9]], t0, tail=((2, 'E5'), (2, 'D5')), vel=0.42, vib=22, seed=4, gain=0.9)
    g1b0, g1b1 = beat_at(GR[1][1])           # the grave beat
    t2 = g1b0 - 11 * B                        # phrase 2 lands its long final D5 on the beat
    piano_bed(t2, 3, vel=0.26, chords=CHORDS_A[4:] + CHORDS_A[:4], seed=50)
    mel2, _ = melody([PHRASE2], t2)
    mel2[-1] = (mel2[-1][0], g1b1 - mel2[-1][0] - 0.3, mel2[-1][2])
    line(mel2, t2, vel=0.42, vib=18, seed=6, gain=0.9, r=1.8)
    drone(g1b0, g1b1 + 1.0, ['D3'], vel=0.08, bright=0.35, seed=915, att=1.0, rel=2.0)
    cues.append((g1b0, '1M2 grave', 'music thins to one sustained fiddle D5 (plus low D) for the grave beat'))
    tm = cue('When he was nine, his mother died')
    strings(tm - 0.1, cue('His stepmother') - 0.1, [C['Bm'], C['G']], bar=2.1, vel=0.12, bright=0.4, seed=120)
    ts = cue('His stepmother')
    piano_bed(ts, 4, vel=0.28, seed=130)
    tend = theme([PHRASE1], ts, tail=((2, 'D5'),), vel=0.42, vib=22, seed=8, gain=0.9)
    p0, p1 = beat_at(GR[2][1])
    strings(p0, p1 - 0.3, [C['G'], C['D'], C['A'], C['D']], bar=(p1 - 0.3 - p0) / 4, vel=0.26, bright=0.8, seed=140)
    cues.append((ts, '1M2', 'theme returns on the stepmother; strings join in the firelight beat'))

    # ---------------- 1M3 The rail-splitter (1:30-2:20): clarinet + pizzicato, river pulse; New Orleans darkens
    s = CH[2]
    cues.append((s + 3.0, '1M3', 'theme on clarinet over pizzicato strings and a river pulse'))
    t_no = cue('On a second trip to New Orleans')
    t_ns = cue('At New Salem')
    pizz(s + 3.0, t_no - 0.3, [C['D'], C['G'], C['D'], C['A']], vel=0.22, seed=300)
    drone(s + 3.0, t_no, ['D3', 'A3'], vel=0.07, bright=0.5, seed=920)
    tend = theme([PHRASE1], s + 3.0, timbre='clarinet', vel=0.40, vib=8, seed=12, gain=0.85, p=0.2)
    theme([PHRASE2[:5]], tend + 0.2, timbre='clarinet', vel=0.36, vib=8, seed=13, gain=0.8, p=0.2)
    cues.append((t_no, '1M3 New Orleans', 'harmony darkens to D minor, no melody'))
    strings(t_no - 0.2, t_ns - 0.2, [C['Dm'], C['Bb'], C['Gm'], C['A7']], bar=(t_ns - t_no) / 4, vel=0.14, bright=0.45, seed=160, bass=True)
    for j in range(int((t_ns - t_no) / (2 * B))):
        put(pulse_thump(vel=0.18, f0=44, seed=j), t_no + j * B * 2, 0.8, wet=0.2)
    c0, c1 = beat_at(GR[4][1])
    t2 = c0 - 11 * B
    pizz(t_ns, c0 - 0.2, [C['D'], C['G'], C['A'], C['D']], vel=0.2, seed=340)
    mel2, _ = melody([PHRASE2], t2)
    mel2[-1] = (mel2[-1][0], c1 - mel2[-1][0] - 0.6, mel2[-1][2])
    line(mel2, t2, timbre='clarinet', vel=0.40, vib=8, seed=14, gain=0.85, p=0.2)
    put(timpani(midi(nm('D2')), vel=0.4, decay=2.2, seed=31), c0 + 0.15, 0.8, wet=0.5, bus='h')
    ensemble(C['D'], c0, c1 - c0 - 0.4, 0.26, seed=170, spread=0.9, bright=0.85)
    cues.append((c0 + 0.15, '1M3 hit', 'soft timpani on the captaincy close-up; D major chord swells in the beat'))

    # ---------------- 1M4 Lawyer and politician (2:20-3:25): warm strings; solo cello for 1841; horn at the Capitol
    s = CH[3]
    t0 = GR[5][0]
    cues.append((t0, '1M4', 'theme on full strings, warmer (as the test 0:14-0:27)'))
    mel2, tend = melody([PHRASE2], t0)
    line(mel2, t0, vel=0.46, vib=16, seed=17, a=0.3, r=1.6, gain=0.72, p=-0.25)
    line([(t, d, m - 12) for t, d, m in mel2], t0 + 0.012, vel=0.40, vib=14, seed=18, a=0.3, r=1.6, gain=0.66, p=0.3)
    for k in range(4):
        ensemble(CHORDS_A[4 + k], t0 + k * BAR, BAR * 0.98, 0.26, seed=400 + 5 * k, spread=0.9)
    b0, b1 = beat_at(GR[5][1])                          # the ball
    t1 = b1 - 15 * B
    mel1, _ = melody([PHRASE1[:13]], t1)
    line(mel1, t1, vel=0.42, vib=16, seed=19, a=0.25, r=1.6, gain=0.75, p=-0.2)
    strings(max(tend, t1), b1 - 0.1, [C['G'], C['D'], C['A'], C['D']], bar=BAR, vel=0.22, seed=420)
    horn(['D4'], b0 + 0.1, b1 - b0 - 0.3, vel=0.26, seed=80)
    t_eng = cue('Their engagement broke off')
    t_wed = cue('But in November')
    cues.append((t_eng, '1M4 1841', 'everything drops to a solo cello, very quiet'))
    cel = [('B2', 2), ('D3', 2), ('C#3', 2), ('B2', 2), ('A2', 3), ('F#2', 3)]
    tt, notes = t_eng - 0.2, []
    for n, bt in cel:
        notes.append((tt, bt * B * 1.1 * 0.98, nm(n))); tt += bt * B * 1.1
    line(notes, t_eng - 0.2, timbre='cello', vel=0.36, vib=14, seed=21, a=0.4, r=1.8, gain=0.75, p=-0.1, wet=0.55)
    cues.append((t_wed, '1M4 wedding', 'strings come back with the theme'))
    tend = theme([PHRASE1], t_wed, vel=0.42, vib=16, seed=22, gain=0.72, p=-0.2)
    strings(t_wed, GR[7][1], [C['D'], C['G'], C['Bm'], C['A'], C['G'], C['D'], C['Em'], C['A']], bar=BAR, vel=0.2, seed=440)
    pizz(GR[7][0], GR[7][1] - 0.2, [C['G'], C['D'], C['Em'], C['A']], vel=0.16, seed=380)
    c0, c1 = beat_at(GR[7][1])
    horn(['D3', 'A3', 'F#4'], c0 + 0.1, c1 - c0 - 1.2, vel=0.38, seed=90, a=1.2, r=1.4)
    ensemble(C['Dlow'] + ['A4'], c0 + 0.1, c1 - c0 - 1.0, 0.30, seed=460, spread=0.9)
    put(timpani(midi(nm('D2')), vel=0.3, decay=2.2, seed=41), c0 + 0.1, 0.8, wet=0.5)
    cues.append((c0 + 0.1, '1M4 Capitol', 'horn swell and D major cadence in the Capitol beat'))

    # ---------------- 1M5 A house divided (3:25-4:30): low unsettled strings; held chord; Charleston: no music
    s = CH[4]
    t_hd = cue('A house divided against')
    t_db = cue('the Democrat Stephen')
    t_ch = cue('At Charleston he said')
    t_lost = cue('The legislature, which chose')
    t_cu = cue('and in February 1860 he spoke')
    cues.append((GR[8][0], '1M5', 'low strings, unsettled harmony'))
    strings(GR[8][0], t_hd - 0.2, [C['Dm'], C['Bb'], C['Gm'], C['A7'], C['Dm'], C['Edim'], C['Bb'], C['A7']], bar=BAR * 0.9,
            vel=0.14, bright=0.45, seed=500, bass=True)
    drone(t_hd - 0.2, t_db, ['D2', 'A2', 'D3', 'F3', 'A3'], vel=0.12, bright=0.45, seed=930, att=1.5)
    cues.append((t_hd, '1M5 house divided', 'one held D minor chord under the quotation'))
    strings(t_db, t_ch - 0.3, [C['Gm'], C['A7']], bar=(t_ch - t_db) / 2, vel=0.13, bright=0.5, seed=520)
    pizz(t_db, t_ch - 0.5, [C['Dm'], C['A7']], vel=0.14, seed=400, bar=(t_ch - t_db) / 2)
    cues.append((t_ch, '1M5 Charleston', 'no music: room tone only'))
    cues.append((t_lost, '1M5', 'low strings return quietly: Lincoln lost'))
    strings(t_lost, t_cu, [C['Dm'], C['Bb'], C['Gm']], bar=(t_cu - t_lost) / 3, vel=0.12, bright=0.45, seed=540)
    c0, c1 = beat_at(GR[11][1])
    strings(t_cu, c0, [C['Bb'], C['F'], C['G'], C['A']], bar=(c0 - t_cu) / 4, vel=0.18, bright=0.7, seed=560, bass=True)
    horn(['A3'], t_cu + 1.0, c0 - t_cu - 0.5, vel=0.22, seed=95, a=3.0)
    horn(['D3', 'A3', 'D4', 'F#4'], c0 - 0.4, c1 - c0, vel=0.42, seed=100, a=0.6, r=1.6)
    ensemble(C['Dlow'] + ['A4'], c0, c1 - c0 - 0.5, 0.32, seed=580, spread=0.9)
    cues.append((c0, '1M5 hit', 'horn swell at Cooper Union, peaking in the beat'))

    # ---------------- 1M6 President of a breaking country (4:30-5:25)
    s = CH[5]
    t_gb = cue('That October, an eleven')
    t_won = cue('In November he won')
    t_fear = cue('Many white Southerners')
    t_sec = cue('Before he took office')
    t_root = cue('Slavery, and the fight')
    t_fs = cue('On the twelfth of April, 1861')
    cues.append((GR[12][0], '1M6', 'brass pulse for the convention'))
    t, k = GR[12][0], 0
    while t < t_gb - 0.6:
        ch = [C['D'], C['G'], C['A'], C['D']][(k // 2) % 4]
        horn([ch[0], ch[1]], t, B * 0.5, vel=0.30 + 0.03 * (k % 4), seed=110 + k, a=0.03, r=0.4, gain=0.5)
        t += B; k += 1
    strings(GR[12][0], t_gb, [C['D'], C['A']], bar=(t_gb - GR[12][0]) / 2, vel=0.16, seed=600)
    pizz(t_gb, t_won - 0.2, [C['D'], C['G']], vel=0.16, seed=420, bar=(t_won - t_gb) / 2)
    theme([PHRASE1[:5]], t_gb + 0.3, vel=0.34, vib=20, seed=24, gain=0.8)
    horn(['D3', 'A3', 'F#4'], t_won, t_fear - t_won, vel=0.3, seed=120)
    ensemble(C['D'], t_won, t_fear - t_won, 0.18, seed=610)
    drone(t_fear, t_sec, ['D2', 'A2', 'F3'], vel=0.11, bright=0.45, seed=940, att=1.0)
    cues.append((t_sec, '1M6 secession', 'falling bass line, one note per seceding state (7)'))
    step = (t_root - t_sec) / 7
    for j, n in enumerate(['D3', 'C3', 'Bb2', 'A2', 'G2', 'F2', 'E2']):
        put(string_note(midi(nm(n)), step * 0.95, vel=0.30, a=0.08, r=0.8, voices=4, bright=0.7, seed=700 + j, vib=4), t_sec + j * step, 0.7, p=-0.1, wet=0.4)
        put(pizz_note(midi(nm(n) - 12), vel=0.3, seed=710 + j), t_sec + j * step, 0.8, wet=0.3)
    drone(t_sec, t_root, ['A3', 'D4'], vel=0.06, bright=0.4, seed=945)
    strings(t_root, t_fs, [C['Bb'], C['A7']], bar=(t_fs - t_root) / 2, vel=0.13, bright=0.45, seed=620, bass=True)
    c0, c1 = beat_at(GR[14][1])
    cues.append((t_fs, '1M6 Fort Sumter', 'low drone'))
    drone(t_fs, c0 + 0.4, ['D1', 'D2', 'A2'], vel=0.14, bright=0.4, seed=950, att=2.0, rel=1.5)
    T_FLAG = round(c0 + 0.2, 3)
    impact(T_FLAG, chord=('D2', 'A2', 'D3', 'F3'), choir_notes=None, vel=0.75, seed=51)
    drone(T_FLAG, c1 - 0.5, ['D2', 'A2'], vel=0.10, bright=0.35, seed=955, att=0.3, rel=1.5)
    cues.append((T_FLAG, '1M6 hit', 'timpani + low brass D minor hit as the flag comes down (beat start + 0.2 s)'))

    # ---------------- 1M7 War and emancipation (5:25-6:10)
    s = CH[6]
    t_br = GR[15][0]
    t_wil = cue('In February 1862, his son')
    t_gre = cue('In August he wrote publicly')
    t_cab = cue('Yet he had already shown')
    t_jan = cue('On the first of January 1863')
    t_sig = cue('the Emancipation Proclamation declared')
    cues.append((t_br, '1M7', 'war motif enters (ostinato, side drum, heartbeat)'))
    war(t_br, t_wil - 0.1, v0=0.32, v1=0.42, drum_from=t_br + 0.5, seed=210)
    cues.append((t_wil, '1M7 Willie', 'drops to solo piano'))
    tw = t_wil + 0.1
    for j, (n, bt) in enumerate([('A4', 1), ('D5', 1), ('E5', 1), ('F5', 2), ('E5', 1), ('D5', 2)]):
        put(piano_note(midi(nm(n) - 12), vel=0.36, dur=bt * B * 1.6, seed=800 + j, bright=0.7), tw, 0.9, wet=0.6)
        tw += bt * B * 1.1
    piano_chord(['D3', 'F3', 'A3'], t_wil + 0.1, vel=0.2, dur=4.0, seed=820)
    piano_chord(['Bb2', 'F3', 'D4'], t_wil + 0.1 + 4 * B * 1.1, vel=0.18, dur=3.0, seed=830)
    war(t_gre, t_jan, v0=0.24, v1=0.34, drums=False, seed=240)
    strings(t_cab, t_jan, [C['Bb'], C['A7']], bar=(t_jan - t_cab) / 2, vel=0.13, bright=0.5, seed=640)
    cues.append((t_jan, '1M7 Proclamation', 'freedom line rises (violins, D major, scale up a sixth)'))
    strings(t_jan, GR[16][1], [C['D'], C['G'], C['D'], C['A'], C['Bm'], C['G'], C['Dm'], C['A7']], bar=(GR[16][1] - t_jan) / 8, vel=0.18, seed=660)
    fl = [('D4', 2), ('E4', 2), ('F#4', 2), ('G4', 2), ('A4', 3), ('B4', 4)]
    tt, notes = t_jan + 0.2, []
    for n, bt in fl:
        notes.append((tt, bt * B * 0.98, nm(n))); tt += bt * B
    line(notes, t_jan + 0.2, vel=0.44, vib=18, seed=26, a=0.4, r=1.8, gain=0.75, p=-0.2)
    line([(a, d, m + 12) for a, d, m in notes], t_jan + 0.21, vel=0.34, vib=18, seed=27, a=0.4, r=1.8, gain=0.55, p=0.25)
    T_SIG = round(t_sig - 0.05, 3)
    put(timpani(midi(nm('D2')), vel=0.55, decay=2.0, seed=61), T_SIG, 0.9, wet=0.5, bus='h')
    horn(['D3', 'A3', 'D4'], T_SIG, 1.6, vel=0.45, seed=130, a=0.03, r=1.4, bus='h')
    cues.append((T_SIG, '1M7 hit', 'sting on the signature (timpani + brass, D major)'))

    # ---------------- 1M8 (6:10-6:55): war motif + freedom line; march; impact into the cemetery beat; silence
    t_out = cue("It could not free anyone")
    t_now = cue('But the war was now')
    t_sol = cue('It also opened the army')
    t_get = cue('In July the Union won')
    c0, c1 = beat_at(GR[17][1])
    cues.append((t_out, '1M8', 'war motif and freedom line together'))
    war(t_out, t_sol, v0=0.26, v1=0.34, drums=False, seed=260)
    fl = [('D4', 2), ('E4', 2), ('F4', 2), ('G4', 2), ('A4', 2), ('Bb4', 3)]
    tt, notes = t_out + 0.3, []
    for n, bt in fl:
        notes.append((tt, bt * B * 0.98, nm(n))); tt += bt * B
    line(notes, t_out + 0.3, vel=0.40, vib=16, seed=28, a=0.4, r=1.6, gain=0.7, p=-0.2)
    ensemble(C['D'], t_now, t_sol - t_now, 0.2, seed=680)
    cues.append((t_sol, '1M8 march', 'steady march (side drum, bass drum, horns on the theme); no tune quote'))
    march(t_sol, t_get - 0.2, vel=0.36)
    mel, _ = melody([PHRASE1[:9]], t_sol + 0.4, shift=-12, beat=B * 0.9)
    line(mel, t_sol + 0.4, timbre='horn', vel=0.40, vib=6, seed=29, a=0.1, r=1.0, gain=0.7, p=0.3)
    strings(t_sol, t_get, [C['D'], C['G'], C['A'], C['D']], bar=(t_get - t_sol) / 4, vel=0.16, seed=700)
    cues.append((t_get, '1M8 Gettysburg', 'war build: ostinato, drums, low brass theme, choir, timpani roll'))
    war(t_get, c0, v0=0.32, v1=0.6, drum_from=t_get + 1.0, seed=280)
    for k, ch in enumerate([C['Dm'], C['Bb'], C['C'], C['A7']]):
        ensemble(ch, t_get + k * (c0 - t_get) / 4, (c0 - t_get) / 4, 0.22 + 0.05 * k, seed=720 + 7 * k, bright=1.1)
    melB = [(0, 2, 'A3'), (2, 2, 'D4'), (4, 2, 'E4'), (6, 4, 'F4'), (10, 2, 'E4'), (12, 3, 'D4')]
    bb = B * 0.9
    tb = c0 - 15 * bb
    for st_, bt, n in melB:
        put(brass_note(midi(nm(n)), bt * bb * 0.95, vel=0.40 + 0.02 * st_, a=0.12, r=0.8, voices=3, seed=300 + st_), tb + st_ * bb, 0.7, p=-0.35, wet=0.45)
        put(brass_note(midi(nm(n)) / 2, bt * bb * 0.95, vel=0.34, a=0.12, r=0.8, voices=2, seed=320 + st_, dark=0.8), tb + st_ * bb, 0.55, p=0.35, wet=0.45)
    put_choir(['D3', 'A3', 'D4', 'F4'], c0 - 5.0, 5.0, vel=0.38, seed=7, wet=0.7)
    put(timp_roll(midi(nm('A1')), 3.0, v0=0.05, v1=0.85, seed=12), c0 - 3.0, 0.9, wet=0.4, bus='h')
    riser(c0, 3.0, vel=0.10, seed=78, bus='h')
    T_CEM = round(c0, 3)
    impact(T_CEM, chord=('D2', 'A2', 'D3', 'F3'), choir_notes=('D3', 'A3', 'D4', 'F4', 'A4'), seed=71)
    put_choir(['D3', 'A3', 'F4'], T_CEM + 0.5, c1 - T_CEM - 1.8, vel=0.3, seed=17, wet=0.8)
    cues.append((T_CEM, '1M8 hit', 'impact into the cemetery beat, choir crest; music out by the end of the beat'))
    cues.append((GR[18][0], '1M8', 'silence under the opening words of the Bliss copy (room tone only)'))
    d0, d1 = beat_at(GR[18][1])
    piano_theme([PHRASE1[:5]], d0 + 0.2, shift=-12, beat=B * 1.05, vel=0.34, seed=900)
    ensemble(['D3', 'A3', 'F#4'], d0 + 0.2, d1 - d0 - 1.0, 0.13, seed=740, wet=0.7, bright=0.7)
    cues.append((d0, '1M8 coda', 'quiet piano on the theme in the beat that holds the opening words'))

    # ---------------- 1M9 Malice toward none (6:55-8:00)
    s = CH[7]
    t0 = GR[19][0]
    t_mal = cue('That March, in his Second')
    t_sac = cue('Douglass recalled calling')
    t_app = cue('On the ninth of April')
    t_tol = cue('An estimated six hundred')
    cues.append((t0, '1M9', 'theme in full strings and horns (hope)'))
    tend = theme([PHRASE1], t0 + 0.5, vel=0.44, vib=16, seed=31, gain=0.72, p=-0.2)
    piano_bed(t0 + 0.5, 4, vel=0.2, seed=950)
    for k in range(4):
        ensemble(CHORDS_A[2 * k], t0 + 0.5 + k * BAR, BAR * 0.98, 0.2, seed=760 + 5 * k, spread=0.9)
    tb0, tb1 = beat_at(GR[19][1])
    mel2, _ = melody([PHRASE2[:9]], tend)
    line(mel2, tend, vel=0.44, vib=16, seed=32, gain=0.72, p=-0.2)
    horn(['A3'], tend, tb0 - tend, vel=0.26, seed=140, a=1.5)
    strings(tend, tb0, [C['Bm'], C['G'], C['A']], bar=(tb0 - tend) / 3, vel=0.2, seed=780)
    T_TALLY = round(tb0 + 0.1, 3)
    horn(['D3', 'A3', 'D4', 'F#4'], T_TALLY, 1.8, vel=0.5, seed=150, a=0.03, r=1.2, bus='h')
    put(timpani(midi(nm('D2')), vel=0.5, decay=2.0, seed=81), T_TALLY, 0.9, wet=0.5, bus='h')
    ensemble(C['Dlow'], T_TALLY, tb1 - T_TALLY + 0.3, 0.28, seed=800)
    cues.append((T_TALLY, '1M9 hit', 'brass sting as the tally board turns (119 to 56)'))
    drone(tb1 - 0.2, t_sac, ['D3', 'A3', 'D4', 'F#4', 'A4'], vel=0.12, bright=0.6, seed=960, att=2.0)
    cues.append((t_mal, '1M9 malice', 'one held D major chord under "With malice toward none"'))
    horn(['F#4'], t_sac - 0.2, t_app - t_sac, vel=0.24, seed=160, a=1.0)
    ensemble(C['G'], t_sac - 0.2, t_app - t_sac, 0.15, seed=820)
    cues.append((t_app, '1M9 Appomattox', 'quiet strings'))
    strings(t_app, t_tol, [C['G'], C['D'], C['Em'], C['A']], bar=(t_tol - t_app) / 4, vel=0.13, bright=0.5, seed=840)
    e0, e1 = beat_at(GR[21][1])
    cues.append((t_tol, '1M9 toll', 'low choir and low strings'))
    put_choir(['D3', 'A3', 'F3'], t_tol, e0 - t_tol + 0.5, vel=0.24, seed=19, wet=0.8)
    drone(t_tol, e0 + 0.5, ['D2', 'A2'], vel=0.1, bright=0.35, seed=965)
    put_choir(['D3', 'F3', 'A3', 'D4'], e0, e1 - e0 - 1.2, vel=0.5, seed=23, wet=0.85)
    cues.append((e0, '1M9 beat', 'choir alone over the empty fields'))

    # ---------------- 1M10 Ford's Theatre (8:00-8:50): quiet piano reprise, low choir. No hits.
    s = CH[8]
    cues.append((GR[22][0], '1M10', 'quiet reprise: theme first phrase on solo piano, slower; low choir pad; no hits'))
    BC = B * 1.12
    drone(s - 0.8, GR[22][0] + 3.0, ['D2', 'A2'], vel=0.06, bright=0.35, seed=980, att=1.5)
    put_choir(['D3', 'A3'], s + 0.5, GR[22][1] - s + 0.5, vel=0.14, seed=29, wet=0.85)
    tend = piano_theme([PHRASE1[:9]], GR[22][0] + 0.3, beat=BC, vel=0.36, seed=1000)
    for k, ch in enumerate([['D3', 'A3'], ['G2', 'D3'], ['B2', 'F#3'], ['A2', 'E3']]):
        piano_chord(ch, GR[22][0] + 0.3 + k * BC * 2.25, vel=0.18, dur=BC * 3.5, seed=1050 + 3 * k, roll=0.08, wet=0.6, bright=0.7)
    t_shot = cue('a Confederate sympathiser')
    piano_chord(['B2', 'F#3', 'D4'], t_shot, vel=0.16, dur=5.0, seed=1080, roll=0.1, wet=0.6, bright=0.6)
    f0, f1 = beat_at(GR[22][1])
    piano_chord(['G2', 'D3', 'B3'], f0 + 0.1, vel=0.2, dur=3.5, seed=1090, roll=0.12, wet=0.65, bright=0.6)
    put_choir(['D3', 'A3', 'F#3'], f1 - 0.5, GR[23][1] - f1, vel=0.13, seed=31, wet=0.85)
    piano_theme([PHRASE1[:9]], GR[23][0] + 0.8, beat=BC * 1.05, vel=0.32, seed=1100)
    for k, ch in enumerate([['D3', 'A3'], ['G2', 'D3'], ['B2', 'F#3'], ['A2', 'E3']]):
        piano_chord(ch, GR[23][0] + 0.8 + k * BC * 1.05 * 2.25, vel=0.16, dur=BC * 3.5, seed=1150 + 3 * k, roll=0.08, wet=0.6, bright=0.7)
    t_died = cue('Abraham Lincoln died')
    piano_chord(['B2', 'F#3', 'D4'], cue('At twenty-two minutes past'), vel=0.15, dur=3.0, seed=1180, roll=0.1, wet=0.6, bright=0.6)
    piano_chord(['G2', 'D3', 'B3'], t_died, vel=0.15, dur=3.0, seed=1185, roll=0.1, wet=0.6, bright=0.6)
    k0, k1 = beat_at(GR[23][1])
    for j, n in enumerate(['D2', 'A2', 'D3', 'F#3', 'A3']):
        put(piano_note(midi(nm(n)), vel=0.3, dur=4.0, seed=1190 + j, bright=0.7), k0 + 0.2 + j * 0.09, 0.85, wet=0.7)
    cues.append((k0 + 0.2, '1M10 clock beat', 'one sustained piano chord (D major), then silence under the clock'))

    # ---------------- 1M11 Legacy (8:50-10:00)
    s = CH[9]
    t_ab = cue('By December 1865')
    t_hist = cue('Historians still argue')
    t_page = cue('The page he signed ends')
    a0, a1 = beat_at(GR[24][1])
    z0, z1 = beat_at(GR[26][1])
    cues.append((GR[24][0], '1M11 funeral train', 'slow processional: low strings, muffled drum'))
    strings(GR[24][0], t_ab, [C['Dmlow'], C['Gm'], C['Dmlow'], C['A7']], bar=(t_ab - GR[24][0]) / 4, vel=0.15, bright=0.4, seed=860, bass=True)
    t = GR[24][0] + 0.2
    while t < t_ab - 0.5:
        put(lp(war_drum(0.42, f0=52, seed=int(t * 10)), 400), t, 0.9, wet=0.4)
        t += 2 * B * 1.15
    cues.append((t_ab, '1M11 Thirteenth', 'freedom line rises to the amendment'))
    strings(t_ab, a0, [C['G'], C['D'], C['A']], bar=(a0 - t_ab) / 3, vel=0.18, seed=880)
    fl = [('D4', 2), ('E4', 2), ('F#4', 2), ('G4', 2), ('A4', 2), ('B4', 3)]
    tt, notes = t_ab + 0.2, []
    for n, bt in fl:
        notes.append((tt, bt * B * 0.98, nm(n))); tt += bt * B
    line(notes, t_ab + 0.2, vel=0.42, vib=18, seed=33, a=0.4, r=1.6, gain=0.72, p=-0.2)
    # crescendo through the doc beat; the theme in full (orchestra + choir) for the Memorial crane
    put(timp_roll(midi(nm('A1')), a1 - a0 - 0.2, v0=0.05, v1=0.7, seed=13), a0, 0.85, wet=0.4, bus='h')
    riser(a1, a1 - a0, vel=0.08, seed=79)
    ensemble(['A2', 'E3', 'A3', 'C#4', 'E4'], a0, a1 - a0, 0.3, seed=900, bright=1.0, spread=0.9)
    T_MEM = round(a1 - 0.05, 3)
    put(timpani(midi(nm('D2')), vel=0.75, decay=2.6, seed=91), T_MEM, 1.0, wet=0.6, bus='h')
    cues.append((T_MEM, '1M11 crane', 'crescendo through the Thirteenth Amendment beat, peak as the Memorial crane begins'))
    tm0 = T_MEM
    tend = theme([PHRASE1], tm0, vel=0.48, vib=16, seed=34, gain=0.75, p=-0.25)
    mel1, _ = melody([PHRASE1], tm0)
    line([(t, d, m - 12) for t, d, m in mel1], tm0 + 0.01, vel=0.42, vib=14, seed=35, gain=0.66, p=0.3)
    for k in range(4):
        ensemble(CHORDS_A[2 * k], tm0 + k * BAR, BAR * 0.98, 0.26, seed=920 + 5 * k, spread=0.9)
        horn([CHORDS_A[2 * k][0]], tm0 + k * BAR, BAR * 0.9, vel=0.3, seed=170 + k)
    put_choir(['D3', 'A3', 'D4', 'F#4'], tm0, 4 * BAR, vel=0.3, seed=37, wet=0.8)
    t_rep = cue('At the dedication')
    strings(tend, t_hist, [C['Bm'], C['G']], bar=(t_hist - tend) / 2, vel=0.13, bright=0.5, seed=960)
    cues.append((t_hist, '1M11', 'falls back: piano and soft strings for the historians, solo piano for the last page'))
    piano_bed(t_hist, int((t_page - t_hist) // BAR), vel=0.2, seed=1200, k0=2)
    drone(t_hist, t_page, ['D3', 'A3'], vel=0.07, bright=0.45, seed=970)
    piano_theme([PHRASE1[:9]], t_page + 0.2, shift=-12, beat=B * 1.1, vel=0.32, seed=1250)
    drone(t_page, z0 + 0.5, ['D3', 'A3'], vel=0.06, bright=0.45, seed=975)
    # end beat: the theme in full, orchestra + choir, final D chord, music up on the end card
    zb = B
    T_END = round(z0 + 7.6, 3)
    mel2, _ = melody([PHRASE2], T_END - 11 * zb, beat=zb)
    mel2[-1] = (T_END, DUR - T_END - 0.4, mel2[-1][2])
    line(mel2, mel2[0][0], vel=0.50, vib=16, seed=36, a=0.25, r=1.6, gain=0.75, p=-0.25)
    line([(t, d, m - 12) for t, d, m in mel2], mel2[0][0] + 0.01, vel=0.44, vib=14, seed=37, a=0.25, r=1.6, gain=0.66, p=0.3)
    for k, ch in enumerate([CHORDS_A[4], CHORDS_A[5], CHORDS_A[6]]):
        ensemble(ch, mel2[0][0] + k * (T_END - mel2[0][0]) / 3, (T_END - mel2[0][0]) / 3, 0.28 + 0.03 * k, seed=980 + 5 * k, spread=0.9)
        horn([ch[0]], mel2[0][0] + k * (T_END - mel2[0][0]) / 3, (T_END - mel2[0][0]) / 3 * 0.95, vel=0.3 + 0.05 * k, seed=180 + k)
    put_choir(['A2', 'E3', 'A3', 'C#4'], T_END - 4.0, 4.0, vel=0.3, seed=41, wet=0.8)
    put(timp_roll(midi(nm('A1')), 2.4, v0=0.05, v1=0.8, seed=14), T_END - 2.4, 0.85, wet=0.4, bus='h')
    fin = DUR - T_END - 0.2
    ensemble(['D2', 'A2', 'D3', 'F#3', 'A3', 'D4', 'F#4', 'A4'], T_END, fin, 0.34, seed=1000, spread=1.0, r=0.8)
    horn(['D3', 'A3', 'D4', 'F#4'], T_END, fin, vel=0.42, seed=190, a=0.05, r=0.8)
    put_choir(['D3', 'A3', 'D4', 'F#4', 'A4'], T_END - 0.3, fin, vel=0.42, seed=43, wet=0.8)
    put(timpani(midi(nm('D2')), vel=0.85, decay=2.6, seed=95), T_END, 1.0, wet=0.6, bus='h')
    cues.append((T_END, '1M11 end', 'theme in full (orchestra + choir) through the last-line beat; final D major chord on the end card'))

    log('score notes placed; reverb')
    out = {}
    for k in ('m', 'h'):
        wet = reverb(BUF[k + 'h'], mix=1.0, dur=3.4, damp=4200, seed=21)
        x = (BUF[k] + wet * 0.85)[:N]
        out[k] = hp(x, 30)
    return out['m'], out['h'], cues


# ------------------------------------------------------------------ score: ElevenLabs Music cues (Phase D2, channel standard)
# One generated cue per chapter (production/audio/ep04-lincoln/elevenlabs-score/c01-c10.mp3, see its README). Each cue is
# anchored to a picture moment measured inside the cue (a swell, a hush, a release), not just to the chapter start.
EL_DIR = os.path.join(PROD_A, 'elevenlabs-score')
EL_TARGET = -20.0  # LUFS per cue before the mix sets the absolute level (24 dB under the narration)


def el_available():
    return all(os.path.exists(os.path.join(EL_DIR, f'c{i:02d}.mp3')) for i in range(1, 11))


def el_load(i):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(EL_DIR, f'c{i:02d}.mp3'), '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(float).reshape(-1, 2)


def level_ride(x, lo=-6.0, hi=3.0, max_up=9.0, max_down=8.0, win=3.0):
    """Slow fader ride for a music bed under narration. The cue's 3 s loudness is left alone while it stays within
    [ref + lo, ref + hi] (ref = the cue's integrated loudness). Quieter passages are lifted towards ref + lo (at most
    max_up dB; natural fade-outs below ref - 36 are not lifted), louder ones are pulled back by 75 % of the excess
    (at most max_down dB). The gain moves over about 1.5 s, so phrases keep their shape."""
    ref = integrated_lufs(x)
    y = _kweight(x)
    p = np.sum(y ** 2, axis=1)
    cr = 50
    hop = SR // cr
    m = len(p) // hop
    pc = p[:m * hop].reshape(m, hop).mean(axis=1)

    def smooth(v, sec):
        k = int(sec * cr) | 1
        ker = np.hanning(k + 2)[1:-1]; ker /= ker.sum()
        return np.convolve(np.pad(v, k // 2, mode='edge'), ker, mode='valid')

    L = -0.691 + 10 * np.log10(np.maximum(smooth(pc, win), 1e-12))
    below, above = (ref + lo) - L, L - (ref + hi)
    taper = np.clip((L - (ref - 36)) / 12, 0, 1)  # full lift down to ref - 24, none below ref - 36
    g = np.where(below > 0, np.minimum(below, max_up) * taper, 0.0) - np.where(above > 0, np.minimum(above * 0.75, max_down), 0.0)
    g = smooth(g, 1.5)
    gi = np.interp(np.arange(len(x)) / SR, (np.arange(m) + 0.5) / cr, g)
    return x * undb(gi)[:, None], ref, float(g.min()), float(g.max())


def el_place(buf, x, at, skip=0.0, dur=None, fin=1.0, fout=2.5, gain_db=0.0):
    """Place a cue at programme time `at`, starting `skip` s into the cue, with equal-power fades. Returns (start, end)."""
    if at < 0:
        skip, at = skip - at, 0.0
    a = ns(skip)
    b = len(x) if dur is None else min(len(x), a + ns(dur))
    seg = x[a:b].copy()
    nf = min(len(seg), ns(fin))
    seg[:nf] *= (np.sin(np.linspace(0, np.pi / 2, nf)) ** 2)[:, None]
    nf = min(len(seg), ns(fout))
    seg[-nf:] *= (np.cos(np.linspace(0, np.pi / 2, nf)) ** 2)[:, None]
    place(buf, seg, at, undb(gain_db))
    return round(at, 3), round(at + len(seg) / SR, 3)


def compose_el():
    """Score from the ElevenLabs Music cues. Returns (music, hits, cue notes) like compose().

    Sync points (cue time -> programme time), measured from each cue's loudness envelope:
      c01  its chord arrival at 27.40 s            -> the title plate (title beat start + 0.66 s), with the synthesised impact
      c02  the melody's return at 34.68 s          -> the end of the grave beat (the hush before it sits inside the beat)
      c03  the final chord's release at 48.6 s     -> the start of chapter 4 (the held chord covers the captaincy beat)
      c05  the last horn chord at 64.04 s          -> the Cooper Union beat; no music under the Charleston quotation
      c07  the crest falling away at 84.0 s        -> one second before the cemetery beat ends; silent under the Address
      c10  the orchestra dropping to piano at 44 s -> "At the dedication," (the Memorial gets the full orchestra)
      c01  (reprise) the chord arrival at 27.40 s  -> the end card
    c04, c06, c08 and c09 start at or near their chapter starts. The synthesised hits kept from the first mix are
    percussion only (timpani, bass drum), tuned to each cue's key, plus the title impact."""
    for k in ('m', 'h'):
        BUF[k] = np.zeros((N + ns(10), 2))
        BUF[k + 'h'] = np.zeros((N + ns(10), 2))
    M = BUF['m']
    cues, X = [], {}
    for i in range(1, 11):
        x, ref, gmin, gmax = level_ride(el_load(i))
        X[i] = x * undb(EL_TARGET - integrated_lufs(x))
        log(f'  c{i:02d}: {len(x) / SR:6.2f} s, {ref:6.1f} LUFS, level ride {gmin:+.1f} to {gmax:+.1f} dB')

    def note(span, cid, what):
        cues.append((span[0], cid, f'{what} [{span[0]:.2f}-{span[1]:.2f} s]'))

    # 1 Two minutes: the cue's own chord arrival lands on the title plate
    b0, b1 = beat_at(GR[0][1])
    T_TITLE = round(b0 + 0.66, 3)
    note(el_place(M, X[1], T_TITLE - 27.40, fin=0.05, fout=3.0), 'EL c01', 'cold open: felt piano and low strings; chord arrival on the title plate')
    # the cue's first piano phrase (5.5-9.5 s, the bars before it are silent) is also stated once in the 3 s open, before the narrator
    note(el_place(M, X[1], 0.0, skip=5.5, dur=4.0, fin=0.5, fout=1.2), 'EL c01 open', 'the first piano phrase of c01, stated in the silent open')
    # 2 A cabin in Kentucky: the hush sits in the grave beat; the fiddle returns as the narrator does
    g1b0, g1b1 = beat_at(GR[1][1])
    note(el_place(M, X[2], g1b1 + 0.05 - 34.68, fin=0.3, fout=3.0), 'EL c02', 'solo fiddle over felt piano; thins to a hush in the grave beat')
    # 3 The rail-splitter: dark low strings for the river and New Orleans, clarinet from Illinois; the held chord covers the captaincy beat
    note(el_place(M, X[3], CH[3] + 0.15 - 48.6, fin=0.5, fout=0.6), 'EL c03', 'low strings, then clarinet and pizzicato; final chord through the captaincy beat')
    # 4 Lawyer and politician (the cue came out in C major; it enters after c03's chord has gone)
    note(el_place(M, X[4], CH[3], fin=0.05, fout=2.0), 'EL c04', 'warm strings and piano; full in the ball, circuit and Capitol beats')
    # 5 A house divided: last horn chord on the Cooper Union beat
    c50, c51 = beat_at(GR[11][1])
    note(el_place(M, X[5], c50 + 0.05 - 64.04, fin=1.0, fout=2.0, gain_db=-1.0), 'EL c05', 'low unsettled strings and sparse piano; horn swell into the Cooper Union beat')
    # 6 President of a breaking country: low drone under Fort Sumter, fading as the flag comes down
    note(el_place(M, X[6], CH[5], fin=0.3, fout=2.5), 'EL c06', 'brass pulse and strings, falling bass, low drone at Fort Sumter')
    # 7 War and emancipation: the crest ends inside the cemetery beat, then silence under the Address
    c70, c71 = beat_at(GR[17][1])
    v7 = c71 - 1.0 - 84.0
    note(el_place(M, X[7], CH[6], skip=CH[6] - v7, fin=1.2, fout=1.0), 'EL c07', 'war ostinato, rising violin line at the Proclamation, march for the Black regiments, crest into the cemetery beat, then silence')
    # 8 Malice toward none: the Gettysburg page holds in room tone, then the strings enter with the title plate
    note(el_place(M, X[8], CH[7] - 0.8, fin=0.05, fout=2.0), 'EL c08', 'strings and horns enter with the title plate; calm held chords for the Second Inaugural; low strings dying away under the toll, silence over the fields')
    # 9 Ford's Theatre: solo felt piano, 3 dB quieter than the other cues; silence at the clock
    note(el_place(M, X[9], CH[8] - 1.0, fin=0.05, fout=2.0, gain_db=-3.0), 'EL c09', 'quiet reprise on solo felt piano; no hits; silence for the clock')
    # 10 Legacy: full orchestra for the Memorial, down to piano at "At the dedication,"
    t_ded = cue('At the dedication')
    v10 = t_ded - 44.0
    note(el_place(M, X[10], CH[9], skip=CH[9] - v10, fin=1.2, fout=1.0), 'EL c10', 'funeral processional, full orchestra at the Memorial, solo piano for the historians and the last page')
    # end card: the title chord returns (c01 from 26.4 s; its arrival at 27.40 s lands on the end card)
    z0, z1 = beat_at(GR[26][1])
    T_END = round(z0 + 1.6, 3)  # = A10.end in src/scenes/s10-solve.ts
    note(el_place(M, X[1], T_END - 1.0, skip=26.4, fin=0.8, fout=0.5, gain_db=2.0), 'EL c01 reprise', 'the title chord returns on the end card and rings out')

    # Charleston: no music under the quotation (as in the approved cue sheet); the strings return quietly at "The legislature..."
    t_ch, t_lost = cue('At Charleston he said'), cue('The legislature, which chose')
    env = np.ones(len(M))
    a, b = ns(t_ch - 1.3), ns(t_ch + 0.2)
    env[a:b] = np.cos(np.linspace(0, np.pi / 2, b - a)) ** 2
    c, d = ns(t_lost + 0.3), ns(t_lost + 4.8)
    env[b:c] = 0.0
    env[c:d] = np.sin(np.linspace(0, np.pi / 2, d - c)) ** 2
    M *= env[:, None]
    cues.append((t_ch, 'EL c05 out', f'no music under the Charleston quotation (room tone only) [{t_ch - 1.3:.2f}-{t_lost + 0.3:.2f} s]; strings return over 4.5 s'))

    # ---- synthesised hits (bus 'h'): frame-accurate sync points the generated cues cannot guarantee
    riser(T_TITLE, 1.6, vel=0.10, bus='h')
    put(timp_roll(midi(nm('A1')), 1.2, v0=0.05, v1=0.7, seed=11), T_TITLE - 1.2, 0.9, wet=0.4, bus='h')
    impact(T_TITLE, choir_notes=None, vel=0.8)
    cues.append((T_TITLE, 'hit title', 'short riser and timpani roll; impact (timpani, bass drum, low brass, D major) on the title plate, with c01\'s own chord'))
    sting_note = {2: 'D2', 3: 'D2', 4: 'A1', 5: 'A1', 6: 'D2', 7: 'D2', 8: 'A1', 10: 'D2'}
    for k, t in enumerate(CH[1:], start=2):
        if k == 9:
            continue  # no hits anywhere in Ford's Theatre
        sting(t + 0.05, sting_note[k], vel=0.22 if k == 10 else 0.30)
    T_FLAG = round(beat_at(GR[14][1])[0] + 0.2, 3)
    put(timpani(midi(nm('D2')), vel=0.7, decay=2.6, seed=51), T_FLAG, 1.0, wet=0.6, bus='h')
    put(war_drum(0.7, f0=48, seed=129), T_FLAG, 1.0, wet=0.6, bus='h')
    cues.append((T_FLAG, 'hit flag', 'timpani and bass drum as the flag comes down at Fort Sumter (beat start + 0.2 s)'))
    T_SIG = round(cue('the Emancipation Proclamation declared') - 0.05, 3)
    put(timpani(midi(nm('D2')), vel=0.45, decay=2.0, seed=61), T_SIG, 0.9, wet=0.5, bus='h')
    cues.append((T_SIG, 'hit signature', 'soft timpani on the signature'))
    T_CEM = round(c70, 3)
    put(timpani(midi(nm('D2')), vel=0.6, decay=2.6, seed=71), T_CEM, 1.0, wet=0.6, bus='h')
    put(war_drum(0.6, f0=48, seed=149), T_CEM, 1.0, wet=0.6, bus='h')
    cues.append((T_CEM, 'hit cemetery', 'timpani and bass drum into the cemetery beat, under c07\'s crest'))
    T_TALLY = round(beat_at(GR[19][1])[0] + 0.1, 3)
    put(timpani(midi(nm('D2')), vel=0.45, decay=2.0, seed=81), T_TALLY, 0.9, wet=0.5, bus='h')
    cues.append((T_TALLY, 'hit tally', 'soft timpani as the tally board turns'))

    log('ElevenLabs cues placed; hall on the hits')
    m = hp(M[:N], 25)
    wet = reverb(BUF['hh'], mix=1.0, dur=3.4, damp=4200, seed=21)
    h = hp((BUF['h'] + wet * 0.85)[:N], 30)
    # balance the hits against the cues: the title impact peaks 8 dB over the cues' average loudness (c01's own arrival is about +6 dB)
    ts, lh, _ = block_loudness(h)
    sel = (ts >= T_TITLE - 0.2) & (ts <= T_TITLE + 1.0)
    h *= undb(EL_TARGET + 8.0 - float(lh[sel].max()))
    cues.sort(key=lambda c: c[0])
    return m, h, cues


# ------------------------------------------------------------------ SFX generators new for Episode 4
def g_chop(dur, rate=0.8, seed=900, far=0.25):
    """Axe into wood: a hard thwack, a woody knock and a few chips."""
    n = ns(dur); out = np.zeros(n); r = R(seed); t = 0.15
    while t < dur - 0.45:
        m = ns(0.4); tt = np.arange(m) / SR
        x = bp(noise_n(m, seed + int(t * 100)), 500, 4000) * np.exp(-tt / 0.012)
        x += (osc_sine(r.uniform(170, 240), m) * np.exp(-tt / 0.05) + 0.5 * osc_sine(r.uniform(420, 520), m) * np.exp(-tt / 0.03)) * 0.6
        for c in range(int(r.integers(2, 5))):
            d = ns(r.uniform(0.05, 0.28)); k = ns(0.012)
            x[d:d + k] += bp(noise_n(k, seed + c + int(t * 7)), 2000, 8000) * exp_decay(k, 0.002) * r.uniform(0.1, 0.3)
        i = ns(t)
        out[i:i + m] += x[: n - i] * r.uniform(0.75, 1.0)
        t += 1 / rate * r.uniform(0.9, 1.1)
    return distance(out * 0.5, far, seed)


def g_hooves(dur, rate=0.9, seed=910, far=0.35, soft=True):
    """Horse at a walk: four-beat clip-clop on dirt."""
    n = ns(dur); out = np.zeros(n); r = R(seed); t = 0.1; k = 0
    while t < dur - 0.3:
        for o in (0.0, 0.27, 0.5, 0.77):
            m = ns(0.1); tt = np.arange(m) / SR
            x = lp(noise_n(m, seed + k), 700 if soft else 1500) * np.exp(-tt / 0.01) \
                + osc_sine(110 * (1 + 0.5 * np.exp(-tt / 0.005)), m) * np.exp(-tt / 0.025) * 0.7
            i = ns(t + o / rate + r.normal(0, 0.01))
            if 0 <= i < n - m:
                out[i:i + m] += x * r.uniform(0.6, 1.0)
            k += 1
        t += 1 / rate
    return distance(out * 0.5, far, seed)


def g_pole(seed=920):
    """Flatboat pole: a soft wooden knock, the pole entering the water, a trickle as it lifts."""
    m = ns(1.6); tt = np.arange(m) / SR
    knock = osc_sine(140, m) * np.exp(-tt / 0.04) * 0.4
    sp = bp(noise_n(m, seed), 300, 2500) * np.clip(tt / 0.03, 0, 1) * np.exp(-tt / 0.15)
    tr = bp(noise_n(m, seed + 1), 800, 3000) * np.exp(-np.clip(tt - 0.9, 0, None) / 0.3) * (tt > 0.9) * 0.2
    return distance((knock + sp + tr) * 0.5, 0.3, seed)


def sfx_cues():
    L = []
    def add(t, sig, gain, p=0.0, name=''):
        L.append((t, sig, gain, p, name))
    # ch 1 Two minutes
    add(0.0, g_candle(25.0, 3), -30, 0.3, 'lamp flicker / room')
    add(0.3, g_pen(2.6, 4), -20, 0.1, 'quill: the first line writes on (write)')
    add(cue('after the main speaker') + 0.2, g_ticks(2.6, 3.0, 9.0, seed=5), -32, 0.2, 'clock face spins')
    add(cue('Five copies survive') - 0.1, g_paper('rustle', 6, 1.4), -22, 0, 'five sheets fan out')
    add(cue('Five copies survive') + 0.2, g_paper('flip', 7), -24, 0, 'page')
    add(GR[0][1] + 0.6, g_paper('rustle', 8, 1.0), -28, 0, 'quill rests, page dissolves')
    add(GR[0][1] + 3.0, g_wind(7.0, 0.35, 0.0, 9), -30, 0, 'woods at golden hour')
    add(GR[0][1] + 4.5, g_birds(5.0, 0.8, 10, 0.5), -34, 0, 'birds')
    for t in CH[1:]:
        add(t, g_paper('whoosh', int(t), 0.9), -26, 0, 'chapter card')
    # ch 2 A cabin in Kentucky
    s = CH[1]
    add(s + 3.0, g_wind(25.0, 0.45, 0.1, 11), -30, 0, 'winter wind in bare branches')
    add(s + 4.0, g_crow(12), -34, 0.6, 'distant crow')
    add(cue('His parents were Thomas'), g_broom(3.0, 13), -32, -0.3, 'plane on a board')
    add(cue('When he was seven, the family'), g_creak(7.5, 14, wheel=True), -30, 0, 'wagon wheels to Indiana')
    add(cue('When he was seven, the family'), g_hooves(7.5, 0.8, 15, far=0.45), -30, 0, 'horse')
    add(cue('An axe was put into') + 0.4, g_chop(4.4, 0.85, 16, far=0.2), -20, -0.15, 'axe chops, wood chips (chopRail)')
    add(GR[1][1] + 1.6, g_wind(7.0, 0.3, 0.0, 17), -30, 0, 'dusk wind over the grave')
    add(cue('His stepmother') - 0.3, g_creak(5.0, 18, wheel=True), -31, 0.3, 'wagon arrives')
    add(cue('His stepmother') - 0.3, g_hooves(4.5, 0.8, 19, far=0.45), -31, 0.3, 'horse')
    add(cue('He wrote of himself'), g_fire(GR[2][1] - cue('He wrote of himself') + 7.0, 20), -30, -0.3, 'firelight')
    add(GR[2][1] + 1.5, g_paper('flip', 21), -24, 0, 'page turn (readBook)')
    add(GR[2][1] + 4.5, g_paper('flip', 22), -25, 0, 'page turn (readBook)')
    # ch 3 The rail-splitter
    s = CH[2]
    add(s + 3.0, g_water(18.0, 23), -28, 0, 'river')
    for k, dt in enumerate([0.4, 3.2, 6.0, 8.8, 11.6, 14.4]):
        add(s + 3.0 + dt, g_pole(24 + k), -26, 0.2, 'flatboat pole')
    add(s + 3.0, g_birds(6.0, 1.0, 30, 0.6), -34, 0, 'dawn birds')
    add(cue('where he split rails') - 0.3, g_chop(5.0, 0.7, 31, far=0.3), -24, 0.2, 'maul and wedge splitting rails')
    add(cue('where he split rails'), g_creak(5.0, 32, wheel=True), -34, -0.5, 'ox-wagon behind')
    add(cue('On a second trip to New Orleans'), g_water(10.0, 33), -32, 0, 'waterfront at dusk')
    add(cue('At New Salem') + 0.2, g_creak(1.0, 34, wheel=False), -30, -0.3, 'store door')
    add(cue('At New Salem') + 1.6, g_paper('rustle', 35, 1.2), -28, 0.2, 'sorting letters')
    add(cue('In the Black Hawk War'), g_crowd(GR[4][1] - cue('In the Black Hawk War') + 2.0, 12, 'murmur', 36, 0.6), -34, 0, 'volunteers')
    # ch 4 Lawyer and politician
    s = CH[3]
    add(GR[5][0], g_crowd(4.5, 14, 'hushed', 37, 0.5), -32, 0, 'legislature room')
    add(cue('He borrowed law books') + 0.6, g_thud(38, 'stamp'), -30, 0, 'law book handed over')
    add(cue('later his law partner') + 1.0, g_paper('flip', 39), -26, 0, 'page turn (readBook)')
    add(cue('In 1837 he moved to Springfield'), g_hooves(5.0, 0.9, 40, far=0.3), -26, 0, 'riding into Springfield')
    add(cue('He met Mary Todd'), g_crowd(4.0, 16, 'murmur', 41, 0.55), -32, 0, 'the ball')
    add(cue('Their engagement broke off') + 0.4, g_pen(6.6, 42), -22, 0.1, 'pen scratch: the 1841 letter (write)')  # Phase D2: the writing runs to the end of the quotation
    add(cue('But in November 1842') + 2.0, g_creak(1.0, 43, wheel=False), -30, -0.2, 'door opens (openDoor)')
    add(cue('He rode the legal circuit'), g_hooves(GR[6][1] - cue('He rode the legal circuit') + 2.0, 0.85, 44, far=0.35), -26, 0, 'horseback on the circuit')
    add(cue('He rode the legal circuit'), g_rain(GR[6][1] - cue('He rode the legal circuit') + 2.2, 0.45, 45), -30, 0, 'rain')
    add(GR[7][0], g_crowd(8.0, 14, 'hushed', 46, 0.55), -34, 0, 'the House')
    # ch 5 A house divided
    s = CH[4]
    add(cue('and drew Lincoln back'), g_crowd(4.5, 12, 'murmur', 47, 0.5), -34, 0, 'party meeting')
    add(cue('In June 1858'), g_crowd(5.0, 14, 'hushed', 48, 0.5), -34, 0, 'Springfield hall')
    add(cue('A house divided against') - 0.1, g_paper('flip', 49), -24, 0, 'page: the quotation card')
    add(cue('the Democrat Stephen'), g_crowd(4.4, 18, 'murmur', 50, 0.6), -32, 0, 'debate crowd')
    add(cue('the Democrat Stephen') + 1.0, g_pen(2.5, 51), -32, 0.4, "reporters' pencils")
    add(cue('At Charleston he said'), g_room(cue('The legislature, which chose') - cue('At Charleston he said') + 0.5, 52), -26, 0, 'Charleston: room tone only')
    add(cue('The legislature, which chose') + 0.3, g_paper('rustle', 53, 0.8), -28, 0, 'he reads the result')
    add(cue('and in February 1860 he spoke'), g_crowd(GR[11][1] - cue('and in February 1860 he spoke') + 3.0, 20, 'hushed', 54, 0.6), -34, 0, 'Cooper Union hall')
    # ch 6 President of a breaking country
    s = CH[5]
    add(GR[12][0], g_crowd(4.5, 22, 'cheer', 55, 0.6), -34, 0, 'convention (low)')
    add(cue('That October, an eleven') + 0.3, g_pen(4.8, 56), -22, 0.1, "pen scratch: Grace Bedell's letter (write)")
    add(cue('Apparently taking her advice') - 0.2, g_paper('rustle', 57, 0.9), -26, 0, 'letter arrives on the desk')
    add(cue('Slavery, and the fight') + 0.3, g_crowd(4.0, 16, 'murmur', 58, 0.7), -36, 0, 'inauguration crowd')
    t_fs = cue('On the twelfth of April, 1861')
    add(t_fs, g_water(GR[14][1] - t_fs + 4.0, 59), -32, 0, 'harbour at night')
    add(t_fs, g_wind(GR[14][1] - t_fs + 4.0, 0.3, 0.0, 60), -32, 0, 'night wind')
    for k, dt in enumerate([1.4, 3.6, 5.2, 7.4]):
        add(t_fs + dt, g_boom_distant(61 + k, 0.8, 0.95), -26, (-0.4, 0.3, -0.1, 0.4)[k], 'distant soft cannon (Fort Sumter)')
    add(GR[14][1] - 0.45, g_creak(1.6, 66, wheel=False), -32, 0.3, 'flag halyard')  # Phase D2: the flag starts down 14 frames before the beat
    # ch 7 War and emancipation
    add(cue('In February 1862, his son'), g_wind(5.0, 0.2, 0.0, 67), -38, 0, 'quiet room air')
    add(cue('In August he wrote publicly') + 1.4, g_paper('flip', 68), -24, 0, 'page: the Greeley letter')
    for k in range(3):
        add(cue('Yet he had already shown') + 0.4 + k * 1.0, g_paper('rustle', 69 + k, 0.7), -27, (-0.4, 0.0, 0.4)[k], 'draft passed hand to hand')
    add(cue('On the first of January 1863') + 0.6, g_pen(3.2, 72), -20, 0.1, 'pen: the signature (signDocument)')
    add(cue('the Emancipation Proclamation declared') - 0.05, g_paper('slap', 73), -26, 0, 'page set down')
    add(cue('It also opened the army') + 0.8, g_marching(cue('In July the Union won') - cue('It also opened the army') - 0.8, 112, 14, 74, far=0.5), -28, 0, 'soldiers march')
    add(cue('In July the Union won'), g_wind(4.0, 0.35, 0.0, 75), -32, 0, 'wind')
    add(cue('Frederick Douglass protested') + 0.2, g_creak(1.0, 76, wheel=False), -30, -0.2, 'White House door (openDoor)')
    add(cue('Frederick Douglass protested') + 0.5, g_footsteps(1.6, 1.8, 'wood', 77, far=0.3), -30, -0.2, 'footsteps')
    add(cue('In November, Lincoln helped'), g_wind(GR[17][1] - cue('In November, Lincoln helped') + 3.6, 0.35, 0.05, 78), -30, 0, 'cemetery wind at dusk')
    add(GR[18][0] - 0.1, g_paper('flip', 79), -24, 0, 'page: the Bliss copy returns')
    add(GR[18][0], g_room(GR[18][1] - GR[18][0] + 5.0, 80), -28, 0, 'room tone')
    # ch 8 Malice toward none
    add(cue('I am naturally anti-slavery') - 1.2, g_pen(7.5, 81), -22, 0.1, 'pen: the Hodges letter (write)')
    add(cue('Then Union forces took Atlanta') + 1.0, g_crowd(3.6, 14, 'murmur', 82, 0.6), -34, 0, 'election-day queue')
    add(cue('In January 1865, the House'), g_crowd(GR[19][1] - cue('In January 1865, the House') + 1.8, 18, 'hushed', 83, 0.55), -32, 0, 'House chamber')
    add(GR[19][1] + 0.05, g_domino(84, 1.2), -26, 0, 'tally board turns')
    add(GR[20][0], g_crowd(2.6, 20, 'murmur', 85, 0.7), -34, 0, 'inauguration crowd')
    add(cue('With malice toward none') - 0.1, g_paper('flip', 86), -24, 0, 'page: the Second Inaugural')
    add(cue('Douglass recalled calling') - 0.1, g_crowd(3.4, 14, 'murmur', 87, 0.5), -34, 0, 'reception')
    add(cue('On the ninth of April'), g_room(9.0, 88), -30, 0, 'Appomattox parlour')
    add(cue('An estimated six hundred'), g_wind(GR[21][1] - cue('An estimated six hundred') + 5.0, 0.4, 0.05, 89), -28, 0, 'wind in the grass')
    # ch 9 Ford's Theatre (no gunshot, nothing startling)
    s = CH[8]
    add(CH[8] - 0.5, g_room(4.0, 89), -28, 0, 'night air under the card')
    add(GR[22][0], g_hooves(6.0, 0.9, 90, far=0.5), -30, 0.4, 'carriage passes')
    add(GR[22][0], g_creak(6.0, 91, wheel=True), -32, 0.4, 'carriage wheels')
    add(cue('Lincoln was at Ford') + 1.0, g_crowd(4.0, 16, 'hushed', 92, 0.7), -36, 0, 'theatre (muffled)')
    add(cue('At about a quarter past ten'), g_room(GR[22][1] - cue('At about a quarter past ten') + 2.5, 93), -28, 0, 'room tone only')
    add(GR[23][0] + 0.2, g_footsteps(3.0, 1.4, 'hard', 94, people=4, far=0.4), -32, 0, 'carried across the street')
    add(GR[23][0] + 3.0, g_creak(1.0, 95, wheel=False), -34, -0.3, 'door')
    add(cue('At twenty-two minutes past'), g_clock(GR[23][1] - cue('At twenty-two minutes past') + 3.5, 96), -26, 0.2, 'clock tick (9.5)')
    add(GR[23][1] + 3.6, g_room(2.2, 97), -28, 0, 'the hand stops: room tone')
    add(GR[23][1] + 3.0, g_birds(2.8, 0.6, 98, 0.6), -36, 0, 'morning')
    # ch 10 Legacy
    s = CH[9]
    add(GR[24][0], g_muffled(g_train(cue('Slavery was abolished') - GR[24][0], 99, 1.4, 1.4, far=0.5)), -30, 0, 'funeral train wheels (muted)')
    add(GR[24][0] + 0.5, g_muffled(g_whistle(100, 1.8)), -32, 0, 'train whistle (muted)')
    add(cue('Slavery was abolished') - 0.2, g_paper('flip', 101), -24, 0, 'page: the Thirteenth Amendment')
    add(GR[25][0], g_wind(8.0, 0.25, 0.0, 102), -36, 0, 'Memorial steps')
    add(cue('At the dedication'), g_crowd(4.6, 16, 'murmur', 103, 0.6), -36, 0, '1922 dedication crowd')
    add(cue('Historians still argue'), g_room(6.0, 104), -32, 0, 'lecture room')
    add(cue('The page he signed ends') - 0.1, g_paper('flip', 105), -24, 0, 'page: the Bliss copy, last line')
    return L


def write_wav(path, x):
    sf.write(path, np.clip(x, -1, 1).astype(np.float32), SR, subtype='PCM_16')


def main():
    os.makedirs(os.path.join(ENG, 'public', 'audio'), exist_ok=True)
    os.makedirs(os.path.join(ENG, 'output', 'stems'), exist_ok=True)
    nar = narration()
    log('narration placed')
    cache = os.path.join(ENG, 'output', 'music-stem.npz')
    cues_json = os.path.join(ENG, 'output', 'music-cues.json')
    if os.path.exists(cache) and os.environ.get('REUSE_MUSIC'):
        z = np.load(cache); mus, hit = z['m'].astype(float), z['h'].astype(float)
        mcues = json.load(open(cues_json))
        log('music reused from cache')
    else:
        use_el = el_available() and not os.environ.get('SYNTH_SCORE')
        mus, hit, mcues = compose_el() if use_el else compose()
        np.savez(cache, m=mus.astype(np.float32), h=hit.astype(np.float32))
        json.dump(mcues, open(cues_json, 'w'), indent=1)
        log('score: ElevenLabs Music cues' if use_el else 'score: synthesised fallback (no ElevenLabs cues found, or SYNTH_SCORE set)')
    # Phase D2 (ElevenLabs cues): the bed sits 12 dB under the beat level (was 8 with the synthesised score, whose own
    # crescendos peaked in the beats); the beats stay 5 dB below full, and the narration stays 24 dB above the bed.
    use_el_levels = el_available() and not os.environ.get('SYNTH_SCORE')
    duck = duck_curve(-17.0 if use_el_levels else -13.0, beat_db=-5.0)
    duck_h = duck_curve(-9.0 if use_el_levels else -7.0, beat_db=-4.0)
    musd = mus * duck[:, None] + hit * duck_h[:, None]
    fx = np.zeros((N + ns(30), 2))
    slog = []
    for t, sig, g, p, name in sfx_cues():
        x = sig if sig.ndim == 2 else pan(sig, p)
        x = normalize(fade(x, 0.05, 0.3), undb(-1.0))
        place(fx, x, t, undb(g))
        slog.append(dict(time=round(t, 2), name=name, gain_db=g, dur=round(len(x) / SR, 2)))
    fx = fx[:N]
    log('sfx placed')
    narc = compressor(nar, thr_db=-26, ratio=2.0, attack=0.006, release=0.12)
    nar_st = np.stack([narc, narc], axis=1)
    L_n = integrated_lufs(nar_st)
    # music gain: narration sits 24 dB above the (ducked) music during speech (Phase D: was 20), measured per 400 ms block
    regs = speech_regions(0, 0, 0.6)
    starts = np.array([a for a, b in regs]); ends = np.array([b for a, b in regs])
    def in_speech(t):
        k = np.searchsorted(starts, t, side='right') - 1
        return k >= 0 and t >= starts[k] + 0.2 and t + 0.6 <= ends[k]
    ts, ln_, _ = block_loudness(nar_st)
    _, lm, _ = block_loudness(musd)
    spb = np.array([in_speech(t) for t in ts]) & (ln_ > -45)
    selm = spb & (lm > np.median(lm[spb]) - 15)
    mus_g_db = float(np.median(ln_[selm] - lm[selm]) - 24.0)
    mus_g = undb(mus_g_db)
    music = musd * mus_g
    ceil_db, ceil_blocks = 0.0, 0
    if use_el_levels:
        music, ceil_db, ceil_blocks = ride_ceiling(music, speech_weight(), L_n, under=19.0, beat=4.0)
        log(f'speech-aware ceiling: at most {ceil_db:.1f} dB over, {ceil_blocks} blocks trimmed')
    bus = nar_st + music + fx
    TARGET, CEIL = -14.0, -1.5
    g = TARGET - integrated_lufs(bus)
    for _ in range(5):
        y, gr = limiter(bus * undb(g), CEIL)
        L = integrated_lufs(y)
        if abs(L - TARGET) < 0.05:
            break
        g += TARGET - L
    fo = np.ones(N); i0 = ns(DUR - 1.2); fo[i0:] = np.linspace(1, 0, N - i0) ** 1.5
    tot = undb(g) * gr * fo
    y = bus * tot[:, None]
    stems = dict(narration=nar_st * tot[:, None], music=music * tot[:, None], sfx=fx * tot[:, None])
    L = integrated_lufs(y)
    # stats
    _, ln2, _ = block_loudness(stems['narration'])
    _, lm2, _ = block_loudness(stems['music'])
    _, lb2, _ = block_loudness(stems['music'] + stems['sfx'])
    sel = spb & (lm2 > np.median(lm2[spb]) - 15)
    beat_lv = []
    for a, b in BEATS:
        if b - a >= 1.4:
            seg = stems['music'][ns(a):ns(b)]
            beat_lv.append(dict(start=a, end=b, music_lufs=round(float(integrated_lufs(seg)), 1),
                                music_max_momentary_lufs=round(float(block_loudness(seg)[1].max()), 1)))
    L_ns = integrated_lufs(stems['narration'])
    insp = np.array([in_speech(t) for t in ts])
    gap_int = L_ns - lm2[insp]
    stats = dict(mix_lufs=L, true_peak_dbtp=true_peak_db(y), master_gain_db=g, narration_lufs_premaster=L_n,
                 music_gain_db=mus_g_db, narration_lufs=integrated_lufs(stems['narration']),
                 music_lufs=integrated_lufs(stems['music']), sfx_lufs=integrated_lufs(stems['sfx']),
                 speech_minus_music_median_db=float(np.median(ln2[sel] - lm2[sel])),
                 speech_minus_music_p05_db=float(np.percentile(ln2[sel] - lm2[sel], 5)),
                 speech_minus_background_median_db=float(np.median(ln2[spb] - lb2[spb])),
                 speech_minus_background_p05_db=float(np.percentile(ln2[spb] - lb2[spb], 5)),
                 speech_blocks_with_music_pct=float(100 * sel.sum() / max(1, spb.sum())),
                 narration_level_minus_music_min_db=float(gap_int.min()), narration_level_minus_music_p05_db=float(np.percentile(gap_int, 5)),
                 narration_level_minus_music_median_db=float(np.median(gap_int)), ceiling_max_trim_db=float(ceil_db), ceiling_blocks_trimmed=float(ceil_blocks),
                 max_gain_reduction_db=float(-db(gr.min())), sfx_cues=len(slog), duration_s=len(y) / SR)
    write_wav(os.path.join(ENG, 'public', 'audio', 'mix.wav'), y)
    for k, v in stems.items():
        write_wav(os.path.join(ENG, 'output', 'stems', f'{k}.wav'), v)
    json.dump(dict(stats=stats, beats_music=beat_lv, music_cues=mcues, sfx=slog), open(os.path.join(ENG, 'output', 'mix-stats.json'), 'w'), indent=1)
    os.makedirs(PROD_A, exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(ENG, 'public', 'audio', 'mix.wav'), '-c:a', 'libmp3lame', '-b:a', '96k',
                    os.path.join(PROD_A, 'episode-04-mix-listen.mp3')], check=True)
    log('written')
    for k, v in stats.items():
        print(f'{k:36s} {round(v, 2)}')


if __name__ == '__main__':
    main()
