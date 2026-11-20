#!/usr/bin/env python3
"""Episode 3 sound: narration on the locked timeline, original procedural score, synthesised SFX, mix and master.

All music and effects are synthesised here (numpy/scipy, no samples or recordings). Restraint: no explosions,
no violence sounds; the executions and the questioning get silence or a low drone only.
Inputs : narration-draft.wav + audit (the re-rendered narration), production edit-plan.json, captions-aligned.srt
Outputs: public/audio/mix.wav (48 kHz stereo 16-bit, what the render muxes), output/mix-stats.json,
         production/audio/ep03-gunpowder-plot/episode-03-mix-listen.mp3 (listen copy)
usage  : python scripts/audio.py NARRATION_DIR
"""
import json, os, re, subprocess, sys
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_lib import *  # noqa
from sfxlib import *  # noqa

ENG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.abspath(os.path.join(ENG, '..', '..'))
PROD_S = os.path.join(ROOT, 'production', 'scripts', 'ep03-gunpowder-plot')
PROD_A = os.path.join(ROOT, 'production', 'audio', 'ep03-gunpowder-plot')
DUR = 720.0
N = ns(DUR)
NARDIR = sys.argv[1] if len(sys.argv) > 1 else '/home/user/full-voice-k2'
plan = json.load(open(os.path.join(PROD_S, 'edit-plan.json')))
audit = json.load(open(os.path.join(NARDIR, 'narration-draft-audit.json')))


def srt_cues(path):
    out = []
    for b in re.split(r'\n\s*\n', open(path).read().strip()):
        l = b.split('\n'); a, e = l[1].split(' --> ')
        f = lambda t: (lambda h, m, s: int(h) * 3600 + int(m) * 60 + float(s))(*t.replace(',', '.').split(':'))
        out.append((f(a), f(e), ' '.join(l[2:])))
    return out


CUES = srt_cues(os.path.join(PROD_S, 'captions-aligned.srt'))
CH = [c['start_ms'] / 1000 for c in plan['chapters']]


def cue(phrase, edge=0):
    norm = lambda x: x.lower().replace('’', "'").replace('\n', ' ')
    p = norm(phrase)
    for a, b, t in CUES:
        if p in norm(t):
            return a if edge == 0 else b
    raise KeyError(phrase)


# ------------------------------------------------------------------ narration on the programme timeline
def narration():
    raw, sr = sf.read(os.path.join(NARDIR, 'narration-draft.wav'))
    assert sr == 24000
    raw = resample_poly(raw, 2, 1)
    out = np.zeros(N)
    for g in plan['groups']:
        a = audit[g['group']]
        seg = raw[ns(a['start']):ns(a['end'])]
        i = ns(g['final_start_ms'] / 1000)
        out[i:i + len(seg)] += seg[: N - i]
    return out


def speech_regions(pre=0.15, post=0.3, merge=0.9):
    regs = sorted([[a - pre, b + post] for a, b, _ in CUES])
    out = [regs[0]]
    for a, b in regs[1:]:
        if a - out[-1][1] < merge:
            out[-1][1] = max(out[-1][1], b)
        else:
            out.append([a, b])
    return out


def duck_curve(depth_db=-13.0, attack=0.35, release=1.0):
    tgt = np.zeros(N)
    for a, b in speech_regions():
        tgt[ns(max(0, a)):ns(min(DUR, b))] = 1.0
    k = ns(attack)
    ker = np.hanning(2 * k + 1); ker /= ker.sum()
    d = np.convolve(tgt, ker, mode='same')
    return undb(depth_db * np.clip(d, 0, 1))


# ------------------------------------------------------------------ score
CHORDS = {  # D minor / modal colour; voicings (low to high)
    'Dm': ['D2', 'A2', 'D3', 'F3', 'A3'], 'Bb': ['Bb1', 'F2', 'D3', 'F3', 'Bb3'], 'F': ['F2', 'C3', 'F3', 'A3', 'C4'],
    'C': ['C2', 'G2', 'E3', 'G3', 'C4'], 'Gm': ['G1', 'D2', 'G2', 'Bb2', 'D3'], 'A': ['A1', 'E2', 'A2', 'C#3', 'E3'],
    'Am': ['A1', 'E2', 'A2', 'C3', 'E3'], 'D': ['D2', 'A2', 'D3', 'F#3', 'A3'], 'G': ['G1', 'D2', 'B2', 'D3', 'G3'],
    'Em': ['E2', 'B2', 'E3', 'G3', 'B3'], 'Dsus': ['D2', 'A2', 'D3', 'G3', 'A3'],
}
LETTER = ['D5', 'F5', 'E5', 'D5', 'A4']  # the letter motif


def pad(buf, chord, t0, dur, vel=0.18, bright=0.7, seed=0, top=5):
    notes = CHORDS[chord][:top]
    for k, n in enumerate(notes):
        s = string_note(midi(nm(n)), dur + 1.2, vel=vel * (1.1 if k == 0 else 0.8), a=min(1.2, dur * 0.3), r=1.4, voices=3, bright=bright, seed=seed + k, vib=6)
        place(buf, pan(s, -0.5 + k / max(1, len(notes) - 1)), t0)


def motif(buf, t0, step=0.55, vel=0.32, transpose=0, seed=5):
    for k, n in enumerate(LETTER):
        place(buf, pan(piano_note(midi(nm(n) + transpose), vel=vel, dur=3.2, seed=seed + k), 0.15), t0 + k * step * (1.6 if k == len(LETTER) - 1 else 1))


def section(buf, a, b, prog_, bar=4.0, vel=0.16, bright=0.6, pizz=0, pulse=0, seed=0, top=5):
    t, k = a, 0
    while t < b - 0.5:
        d = min(bar, b - t)
        pad(buf, prog_[k % len(prog_)], t, d, vel, bright, seed + k * 13, top)
        root = nm(CHORDS[prog_[k % len(prog_)]][0]) + 12
        if pizz:
            for j in range(int(d / 0.5)):
                if j % 2 == 0 or j % 4 == 3:
                    place(buf, pan(pizz_note(midi(root + (0, 7, 12, 7)[j % 4]), vel=pizz * (1 if j % 4 == 0 else 0.7), seed=seed + k * 7 + j), -0.3), t + j * 0.5)
        if pulse:
            for j in range(int(d)):
                place(buf, pan(pulse_thump(vel=pulse, f0=44, seed=seed + j), 0), t + j)
        t += bar; k += 1


def compose():
    m = np.zeros((N + ns(8), 2))
    s = CH + [DUR]
    # s01 cold open: drone and the letter motif; title sting
    section(m, 0.5, 40.3, ['Dm', 'Dm', 'Bb', 'A'], bar=5.0, vel=0.12, bright=0.5, top=3)
    motif(m, 1.2, vel=0.26)
    place(m, pan(timpani(midi(nm('D2')), 0.55), 0), 40.37)
    pad(m, 'Dm', 40.37, 4.4, vel=0.26, bright=0.9)
    motif(m, 41.0, vel=0.34)
    # s02 a new king: measured pizzicato, brighter
    section(m, s[1], s[2] - 0.4, ['Dm', 'F', 'C', 'Dm', 'Bb', 'F', 'Gm', 'A'], bar=4.0, vel=0.13, bright=0.65, pizz=0.22, seed=20)
    # s03 the plot: low pulse, darker
    section(m, s[2], s[3] - 0.4, ['Dm', 'Gm', 'Bb', 'A', 'Dm', 'Gm', 'A', 'A'], bar=4.0, vel=0.14, bright=0.5, pulse=0.18, seed=40)
    # s04 the letter: sparse, suspense, motif returns
    section(m, s[3], s[4] - 0.4, ['Dm', 'Dsus', 'Bb', 'Gm', 'A', 'Dm'], bar=5.0, vel=0.12, bright=0.55, seed=60, top=4)
    motif(m, s[3] + 3.4, vel=0.24); motif(m, cue('Then comes the phrase') - 0.4, vel=0.22, transpose=-12)
    place(m, pan(timpani(midi(nm('A1')), 0.45), 0), cue('a terrible blow') + 2.2)
    motif(m, cue('Today the sheet is held') + 0.2, vel=0.2)
    # s05 the record: tension to the search, then quiet for the Journal
    section(m, s[4], cue('On the night before the opening') - 0.2, ['Dm', 'Gm', 'Dm', 'A'], bar=4.0, vel=0.14, bright=0.5, pulse=0.2, seed=80)
    place(m, st(timp_roll(midi(nm('A1')), 3.5, 0.03, 0.5)), cue('On the night before the opening') - 3.6)
    section(m, cue('On the night before the opening'), s[5] - 0.4, ['Dm', 'Bb', 'F', 'A', 'Dm', 'Gm', 'Dsus', 'Dm'], bar=5.0, vel=0.11, bright=0.5, seed=90, top=4)
    # s06 after the arrest: sombre; near silence on the torture line
    t_tort = cue('Fawkes was tortured')
    section(m, s[5], t_tort - 0.6, ['Dm', 'Am', 'Bb', 'A'], bar=5.0, vel=0.13, bright=0.45, pulse=0.12, seed=110)
    pad(m, 'Dm', t_tort - 0.6, 3.0, vel=0.06, bright=0.3, top=2)
    section(m, t_tort + 2.4, s[6] - 0.4, ['Gm', 'Dm', 'Bb', 'A', 'Dm'], bar=5.0, vel=0.12, bright=0.45, seed=130, top=4)
    # s07 who answered: solemn; drone only over the executions
    t_ex = cue('The executions followed')
    section(m, s[6], t_ex - 0.5, ['Dm', 'Gm', 'Bb', 'A'], bar=5.0, vel=0.12, bright=0.45, seed=150, top=4)
    pad(m, 'Dm', t_ex - 0.5, cue('Less than three months') - t_ex + 0.5, vel=0.06, bright=0.3, top=2)
    section(m, cue('Less than three months'), s[7] - 0.4, ['Dm', 'Bb', 'F', 'C', 'Gm', 'A', 'Dm', 'Dm'], bar=5.0, vel=0.12, bright=0.5, seed=170, top=4)
    motif(m, cue('Think back to the letter') + 0.2, vel=0.24)
    # s08 tradition: warmer, D major for the bonfires, then home to the letter
    t_bon = cue('Beyond the church doors')
    section(m, s[7], t_bon - 0.4, ['Dm', 'F', 'C', 'Dm', 'Bb', 'F', 'C', 'A'], bar=4.5, vel=0.13, bright=0.6, seed=190)
    t_arch = cue('Back in the archive')
    section(m, t_bon, t_arch - 0.6, ['D', 'G', 'D', 'A', 'Em', 'G', 'A', 'D'], bar=4.0, vel=0.13, bright=0.75, pizz=0.24, seed=210)
    section(m, t_arch, 717.0, ['Dm', 'Bb', 'Dsus', 'Dm'], bar=5.0, vel=0.11, bright=0.5, seed=230, top=4)
    motif(m, t_arch + 0.4, vel=0.22); motif(m, 715.6, vel=0.3)
    pad(m, 'D', 717.05, 3.0, vel=0.22, bright=0.8)
    # chapter cards: soft sting
    for t in CH[1:]:
        place(m, pan(timpani(midi(nm('D2')), 0.3), 0), t + 0.05)
        place(m, st(g_paper('whoosh', seed=int(t), dur=0.9)) * 0.0, t)
    m = reverb(m[:N], mix=0.22, dur=3.0, damp=4200)
    return m


# ------------------------------------------------------------------ SFX cue list
def sfx_cues():
    C = []
    def add(t, sig, gain, p=0.0, name=''):
        C.append((t, sig, gain, p, name))
    s = CH
    add(0.2, g_paper('rustle', 1, 2.6), -14, 0.1, 'letter unfolds')
    add(3.4, g_paper('slap', 2), -18, 0, 'letter flat')
    add(0.0, g_candle(13.8, 3) if True else None, -30, 0.4, 'candle')
    add(cue('but the man who opened it') - 0.3, g_fire(6.8, 4), -30, -0.5, 'fire')
    add(cue('Lord Monteagle could have made') - 0.3, g_fire(8.2, 5), -31, -0.5, 'fire')
    add(cue('Lord Monteagle could have made') + 0.3, g_footsteps(2.4, 1.8, 'wood', 6, far=0.25), -24, 0, 'pacing')
    add(cue('Instead, Monteagle took the'), g_footsteps(4.8, 1.9, 'hard', 7, far=0.3), -22, 0.2, 'street walk')
    add(cue('officials at Westminster had arrested') - 0.3, g_footsteps(7.0, 1.4, 'hard', 8, people=3, far=0.4), -22, 0, 'arrest walk')
    add(cue('officials at Westminster had arrested') - 0.3, g_water(7.0, 9), -32, 0, 'river')
    for t in s[1:]:
        add(t, g_paper('whoosh', int(t), 0.9), -24, 0, 'chapter card')
    add(cue('English law required attendance') + 0.1, g_bells(4.0, 12, single=True, far=0.5), -20, 0.25, 'church bell')
    add(cue('English law required attendance'), g_footsteps(5.5, 2.0, 'hard', 13, people=4, far=0.35), -26, 0, 'parish walking')
    add(cue('English law required attendance'), g_birds(7.0, 0.8, 14, 0.5), -30, 0, 'birds')
    for k in range(8):
        add(cue('Catholics who stayed') + 1.2 + k * 0.62, g_click(15 + k, 1), -30, 0.1, 'coin')
    add(cue('Catholics who stayed'), g_fire(11.5, 16), -32, 0.5, 'hearth')
    add(cue('One small circle of men') - 0.3, g_low_swell(3.6, 17), -22, 0, 'swell')
    add(cue('Another Catholic would carry the', 1) + 0.6, g_bells(6.0, 18, single=True, far=0.45), -18, 0.25, 'church bell (pace)')
    add(cue('Another Catholic would carry the', 1), g_footsteps(5.0, 1.9, 'hard', 19, people=2, far=0.25), -24, 0, 'family steps')
    add(s[2] + 3.0, g_fire(7.5, 20), -30, -0.5, 'fire')
    add(s[2] + 4.0, g_footsteps(3.0, 1.6, 'wood', 21, far=0.25), -24, 0, 'Catesby paces')
    for k, dt in enumerate([2.6, 4.6, 5.7, 6.7]):
        add(cue('In May 1604, Catesby met four') + dt, g_footsteps(1.6, 2.4, 'wood', 22 + k, far=0.3), -26, -0.4, 'arrival')
    add(cue('In May 1604, Catesby met four') + 2.4, g_creak(1.0, 26, wheel=False), -30, -0.6, 'door')
    add(cue('His intended victims were the king') - 0.3, g_crowd(26.5, 20, 'hushed', 27, 0.5), -30, 0, 'chamber')
    add(cue("the conspirators’ expectations", 1), g_wind(5.4, 0.45, 0.2, 28), -22, 0, 'wind')
    add(cue("the conspirators’ expectations", 1) + 1.5, g_crow(29), -28, 0.6, 'crow')
    add(s[3] + 3.0, g_footsteps(2.0, 1.8, 'hard', 30, far=0.3), -26, 0, 'footman')
    add(s[3] + 5.0, g_creak(1.0, 31, wheel=False), -28, -0.3, 'door')
    add(cue('A contemporary account says') + 0.5, g_paper('rustle', 32, 0.8), -22, -0.2, 'sheet handed')
    add(cue('Here was a message important'), g_fire(6.2, 33), -30, 0.5, 'fire')
    add(cue('Here was a message important'), g_footsteps(2.0, 2.0, 'wood', 34, far=0.25), -25, -0.2, 'footman')
    add(cue('The writer appeals to') , g_paper('rustle', 35, 1.0), -24, 0, 'paper')
    add(cue('Today the sheet is held'), g_room(10.0, 36), -30, 0, 'archive')
    add(cue('We can inspect the') + 1.8, g_paper('slap', 37), -26, 0.3, 'paper')
    add(cue('Monteagle took it to Robert') - 0.2, g_footsteps(3.8, 1.9, 'hard', 38, far=0.3), -22, 0, 'walk')
    add(cue('the king’s chief minister') + 0.6, g_paper('rustle', 39, 0.8), -22, 0, 'letter passed')
    add(s[4] + 3.0, g_water(4.0, 40), -30, 0, 'river')
    add(cue('When he returned to London'), g_footsteps(2.2, 1.8, 'wood', 41, far=0.3), -25, -0.4, 'king enters')
    add(cue('Catesby and Winter challenged'), g_room(6.0, 42), -30, 0, 'room')
    add(cue('lay in other hands', 1), g_footsteps(4.2, 1.5, 'hard', 43, people=3, far=0.5), -24, 0, 'search party')
    add(cue('On the night before the opening'), g_footsteps(2.4, 1.6, 'hard', 44, people=2, far=0.25), -22, -0.2, 'vault steps')
    add(cue('Sir Thomas Knyvett') + 1.0, g_low_swell(3.2, 45), -22, 0, 'discovery')
    add(cue('The king, the Lords and'), g_birds(3.0, 1.0, 46, 0.5), -30, 0, 'dawn birds')
    add(cue('The House of Commons met briefly') - 0.2, g_crowd(3.6, 14, 'hushed', 47, 0.5), -30, 0, 'Commons')
    add(cue('The House of Commons met briefly', 1) + 0.4, g_pen(4.0, 48), -20, 0.1, 'margin note')
    add(cue('Its clerk, Ralph Ewens') + 0.2, g_pen(3.0, 49), -26, 0, 'pen')
    for k in range(6):
        add(cue('We know who Johnson was') + 0.25 + k * 0.42, g_paper('slap', 50 + k), -28, 0.2, 'records')
    add(cue('because other records survive', 1), g_birds(5.0, 1.2, 56, 0.4), -28, 0, 'dawn')
    add(cue('The king was alive and'), g_wind(10.0, 0.3, 0, 57), -30, 0, 'Midlands wind')
    add(cue('The king was alive and') + 5.3, g_thud(58, 'door'), -20, 0.4, 'door shut')
    add(cue('On the seventh of November'), g_paper('flip', 59), -22, 0, 'proclamation')
    add(cue('declared the rebels traitors', 1), g_paper('rustle', 60, 4.0), -30, 0, 'papers pass')
    add(cue('That day, at the Tower of London'), g_wind(4.8, 0.4, 0.1, 61), -28, 0, 'Tower wind')
    for k in range(5):
        add(cue('These documents are central') + 0.4 + k * 0.9, g_paper('slap', 62 + k), -28, 0.1, 'sheets')
    add(cue('Fawkes was tortured') - 0.3, g_rain(1.8, 0.4, 67), -32, 0, 'rain')
    add(cue('had ended at Holbeach', 1), g_paper('slap', 68), -28, 0, 'sheet')
    add(cue('Catesby, Percy and the Wright brothers'), g_wind(8.0, 0.35, 0.1, 69), -28, 0, 'dawn wind')
    add(cue('Catesby, Percy and the Wright brothers') + 2.5, g_crow(70), -30, -0.6, 'crow')
    add(s[6] + 3.0, g_footsteps(5.0, 1.8, 'hard', 71, people=5, far=0.45), -26, 0, 'to the Hall')
    add(cue('On the twenty-seventh of January'), g_crowd(6.0, 24, 'hushed', 72, 0.6), -30, 0, 'Hall')
    add(cue('The executions followed'), g_wind(7.5, 0.3, 0.2, 73), -30, 0, 'grey wind')
    add(cue('appeared in the Commons Journal', 1), g_crowd(4.5, 10, 'murmur', 74, 0.5), -30, 0.3, 'street')
    add(cue("its consequences were only beginning", 1), g_crowd(5.4, 18, 'anxious', 75, 0.45), -30, 0, 'members demand')
    add(cue('Think back to the letter') + 0.2, g_paper('rustle', 76, 1.6), -24, 0, 'letter')
    add(cue('For his fellow Catholics'), g_crowd(5.0, 10, 'murmur', 77, 0.5), -32, 0, 'street')
    add(cue('The arrests ended the'), g_wind(8.0, 0.3, 0.1, 78), -32, 0, 'evening')
    add(s[7] + 3.0, g_bells(5.0, 79, single=True, far=0.3), -16, 0.2, 'bell')
    add(cue('Each year,'), g_room(5.2, 80), -30, 0, 'church')
    add(cue('Beyond the church doors') + 0.2, g_bells(3.6, 81, single=False, far=0.6), -24, 0.4, 'bells')
    t_b, t_a = cue('Beyond the church doors'), cue('Back in the archive')
    add(t_b, g_fire(t_a - t_b - 0.3, 82), -26, 0, 'bonfire')
    add(t_b, g_crowd(t_a - t_b - 0.3, 22, 'murmur', 83, 0.55), -32, 0, 'crowd')
    for k in range(10):
        add(cue('Some of the earliest') + 0.5 + k * 0.7, g_crack(84 + k), -30, (-0.6, 0.5, -0.1, 0.7)[k % 4], 'firework')
    add(cue('By the nineteenth century'), g_creak(10.0, 95, wheel=True), -30, 0, 'cart')
    add(cue('By the nineteenth century'), g_footsteps(10.0, 2.4, 'hard', 96, people=3, far=0.3), -28, 0, 'children')
    for k in range(10):
        add(cue('Guy Fawkes, the fifth of') + 0.4 + k * 0.33, g_crack(100 + k), -28, (-0.5, 0.4, 0.1, -0.2)[k % 4], 'fireworks')
    add(t_a, g_room(20.0, 110), -32, 0, 'archive')
    add(cue('chose to pass it on', 1) + 0.1, g_paper('flip', 111), -18, 0, 'page turn')
    return C


def main():
    os.makedirs(os.path.join(ENG, 'public', 'audio'), exist_ok=True)
    os.makedirs(os.path.join(ENG, 'output'), exist_ok=True)
    nar = narration()
    cache = os.path.join(ENG, 'output', 'music-stem.npy')
    if os.path.exists(cache) and os.environ.get('REUSE_MUSIC'):
        mus = np.load(cache)
    else:
        mus = compose()
        np.save(cache, mus.astype(np.float32))
    duck = duck_curve()
    musd = mus * duck[:, None]
    fx = np.zeros((N + ns(10), 2))
    log = []
    for t, sig, g, p, name in sfx_cues():
        x = sig if sig.ndim == 2 else pan(sig, p)
        x = normalize(fade(x, 0.05, 0.3), undb(-1.0))
        place(fx, x, t, undb(g))
        log.append(dict(time=round(t, 2), name=name, gain_db=g, dur=round(len(x) / SR, 2)))
    fx = fx[:N]
    # music level: -24 LUFS in the gaps relative to the narration; set by gain on the stem
    narc = compressor(nar, thr_db=-26, ratio=2.0, attack=0.006, release=0.12)
    nar_st = np.stack([narc, narc], axis=1) * 0.7071 * 1.4142
    L_n = integrated_lufs(nar_st)
    mus_g = undb((L_n - 16) - integrated_lufs(mus))
    bus = nar_st + musd * mus_g + fx
    TARGET, CEIL = -14.0, -1.5
    g = TARGET - integrated_lufs(bus)
    for _ in range(4):
        y, gr = limiter(bus * undb(g), CEIL)
        L = integrated_lufs(y)
        if abs(L - TARGET) < 0.05:
            break
        g += TARGET - L
    y[ns(719.0):] *= np.linspace(1, 0, N - ns(719.0))[:, None]
    regs = speech_regions(0, 0, 0.6)
    starts = np.array([a for a, b in regs]); ends = np.array([b for a, b in regs])
    def in_speech(t):
        k = np.searchsorted(starts, t, side='right') - 1
        return k >= 0 and t >= starts[k] and t + 0.4 <= ends[k]
    ts, ln_, _ = block_loudness(nar_st * undb(g))
    _, lb, _ = block_loudness((musd * mus_g + fx) * undb(g))
    sel = np.array([in_speech(t) for t in ts]) & (ln_ > -40)
    diff = ln_[sel] - lb[sel]
    stats = dict(mix_lufs=L, true_peak_dbtp=true_peak_db(y), master_gain_db=g, narration_lufs_premaster=L_n,
                 speech_minus_background_median_db=float(np.median(diff)), speech_minus_background_p05_db=float(np.percentile(diff, 5)),
                 max_gain_reduction_db=float(-db(gr.min())), sfx_cues=len(log))
    sf.write(os.path.join(ENG, 'public', 'audio', 'mix.wav'), y.astype(np.float32), SR, subtype='PCM_16')
    json.dump(dict(stats=stats, sfx=log), open(os.path.join(ENG, 'output', 'mix-stats.json'), 'w'), indent=1)
    os.makedirs(PROD_A, exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(ENG, 'public', 'audio', 'mix.wav'), '-c:a', 'libmp3lame', '-b:a', '96k',
                    os.path.join(PROD_A, 'episode-03-mix-listen.mp3')], check=True)
    for k, v in stats.items():
        print(f'{k:36s} {round(v, 2)}')


if __name__ == '__main__':
    main()
