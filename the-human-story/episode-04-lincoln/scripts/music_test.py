"""Episode 4 music test (Phase B): 60 s cinematic score sketch, original and synthesised (numpy/scipy only).

  0:00–0:27  Lincoln theme: solo fiddle over piano (the cabin), then the same theme on full strings with
             horn swells (politics). The theme is an original hymn-like tune in D major.
  0:27–0:46  War build: D minor, low string ostinato, side drum, bass-drum heartbeat, the theme in the
             low brass, timpani roll and a formant choir pad cresting into an impact.
  0:46–1:00  Quiet reprise: the theme's first phrase on solo piano with a low choir pad (the assassination
             reprise), ending on an open D chord.

Richer synths than Episode 3: 6-voice detuned string ensembles with chorus, a convolution hall, a formant
choir. Mastered to -14 LUFS, true peak <= -1 dBTP.
Usage: python scripts/music_test.py output/ep04-music-test.wav
"""
import sys
import numpy as np
import soundfile as sf
from audio_lib import (SR, nm, midi, string_note, legato_line, brass_note, piano_note, timpani, timp_roll, war_drum,
                       snare_soft, pan, place, reverb, fade, lp, hp, bp, peak_eq, blsaw, vibrato_curve, env_swell,
                       noise_n, integrated_lufs, true_peak_db, limiter, undb, exp_decay)

BPM = 72
B = 60 / BPM          # one beat
BAR = 4 * B           # 3.33 s
DUR = 60.0
buf = np.zeros((int(DUR * SR) + SR * 4, 2))
hall = np.zeros_like(buf)   # send to the convolution hall


def put(sig, at, gain=1.0, p=0.0, wet=0.35):
    st = pan(sig, p) if sig.ndim == 1 else sig
    place(buf, st, at, gain)
    place(hall, st, at, gain * wet)


# ---------------------------------------------------------------- the Lincoln theme (original)
# scale degrees in D major -> (beats, note)
PHRASE1 = [(1, 'A4'), (1, 'D5'), (1, 'E5'), (1, 'F#5'), (1.5, 'F#5'), (0.5, 'E5'), (1, 'D5'), (1, 'E5'),
           (1, 'F#5'), (1, 'A5'), (1, 'G5'), (1, 'F#5'), (3, 'E5'), (1, 'A4')]
PHRASE2 = [(1, 'D5'), (1, 'E5'), (1, 'F#5'), (1.5, 'F#5'), (0.5, 'E5'), (1, 'D5'), (1, 'B4'), (1, 'D5'),
           (1, 'E5'), (1, 'F#5'), (1, 'E5'), (4, 'D5')]
CHORDS_A = [['D3', 'A3', 'D4', 'F#4'], ['G2', 'D3', 'B3', 'D4'], ['D3', 'A3', 'F#4'], ['A2', 'E3', 'C#4', 'E4'],
            ['B2', 'F#3', 'D4'], ['G2', 'D3', 'B3'], ['A2', 'E3', 'G3', 'C#4'], ['D3', 'A3', 'D4', 'F#4']]


def melody_notes(phrases, t0, shift=0, beat=B):
    out, t = [], t0
    for ph in phrases:
        for bts, n in ph:
            out.append((t, bts * beat * 0.98, nm(n) + shift))
            t += bts * beat
    return out, t


def choir(f0s, dur, vel=0.4, seed=0):
    """Formant 'ah' choir pad: detuned saws through vowel formants (~800, 1150, 2900 Hz)."""
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
    return hp(y * env_swell(n, 1.2, 1.8) * vel, 80)


def ensemble(notes, t, dur, vel, seed, wet=0.45, spread=0.5, voices=6, bright=1.0):
    for i, n in enumerate(notes):
        s = string_note(midi(nm(n)), dur, vel=vel, a=0.7, r=1.6, voices=voices, bright=bright, seed=seed + i, vib=12)
        put(s, t, 0.55, p=(i / max(1, len(notes) - 1) - 0.5) * spread, wet=wet)


# ---------------------------------------------------------------- A: theme statement (0:00 - 0:27)
t0 = 0.6
# piano chords under the solo fiddle, bars 1-4
for k in range(4):
    ch = CHORDS_A[k * 2]
    ch2 = CHORDS_A[k * 2 + 1]
    for j, n in enumerate(ch):
        put(piano_note(midi(nm(n)), vel=0.32, dur=B * 2, seed=10 * k + j), t0 + k * BAR + j * 0.06, 0.8, p=-0.15 + j * 0.1, wet=0.4)
    for j, n in enumerate(ch2):
        put(piano_note(midi(nm(n)), vel=0.28, dur=B * 2, seed=10 * k + j + 5), t0 + k * BAR + 2 * B + j * 0.06, 0.8, p=-0.15 + j * 0.1, wet=0.4)
mel, tend = melody_notes([PHRASE1[:9]], t0)
fid = legato_line([(t - t0, d, m, 0.9) for t, d, m in mel] + [(tend - t0, 2 * B, nm('E5'), 0.8), (tend - t0 + 2 * B, 2 * B, nm('D5'), 0.7)],
                  vel=0.42, vib=22, timbre='violin', seed=4, a=0.18, r=1.4)
put(fid, t0, 0.9, p=0.12, wet=0.5)
# bars 5-8: full strings, theme in violins an octave down + cellos, horn swells (politics)
tA2 = t0 + 4 * BAR
mel2, tend2 = melody_notes([PHRASE2], tA2)
vl = legato_line([(t - tA2, d, m, 1.0) for t, d, m in mel2], vel=0.5, vib=16, timbre='violin', seed=7, a=0.3, r=1.6)
vl2 = legato_line([(t - tA2, d, m - 12, 0.9) for t, d, m in mel2], vel=0.42, vib=14, timbre='violin', seed=8, a=0.3, r=1.6)
put(vl, tA2, 0.75, p=-0.25, wet=0.5)
put(vl2, tA2 + 0.012, 0.7, p=0.3, wet=0.5)
for k in range(4):
    ensemble(CHORDS_A[4 + k], tA2 + k * BAR, BAR * 0.98, 0.32, seed=40 + 5 * k, spread=0.9)
    put(brass_note(midi(nm(CHORDS_A[4 + k][0]) + 12), BAR * 0.9, vel=0.28 + 0.06 * k, a=0.9, r=1.2, seed=60 + k), tA2 + k * BAR, 0.6, p=0.4, wet=0.6)
put(timpani(midi(nm('D2')), vel=0.35, decay=2.2, seed=3), tA2, 0.8, wet=0.5)

# ---------------------------------------------------------------- B: war build (0:27 - 0:46)
tB = t0 + 8 * BAR  # ~27.3 s
bars_b = 6
end_b = tB + bars_b * BAR * 0.9   # the war section runs a touch faster (pressing forward)
BB = B * 0.9
# low ostinato: D minor, eighth notes, cellos/basses (two layers)
osti = ['D2', 'D2', 'F2', 'D2', 'A2', 'D2', 'F2', 'E2']
t = tB
i = 0
while t < end_b:
    m = nm(osti[i % 8])
    if (i // 16) % 2 == 1 and osti[i % 8] == 'D2':
        m -= 4  # Bb under the D on alternate bars
    v = 0.34 + 0.25 * (t - tB) / (end_b - tB)
    s = string_note(midi(m), BB / 2 * 0.8, vel=v, a=0.01, r=0.25, voices=4, bright=1.3, seed=200 + i, vib=0)
    put(s, t, 0.7, p=-0.2, wet=0.2)
    t += BB / 2
    i += 1
# side drum and heartbeat
t = tB + 2 * BAR * 0.9
k = 0
while t < end_b:
    v = 0.25 + 0.45 * (t - tB) / (end_b - tB)
    put(snare_soft(v, seed=k), t, 0.8, p=0.3, wet=0.25)
    put(snare_soft(v * 0.6, seed=k + 50), t + BB * 0.75, 0.8, p=0.3, wet=0.25)
    if k % 2 == 0:
        put(war_drum(0.55 + 0.3 * (t - tB) / (end_b - tB), seed=k), t, 0.9, wet=0.3)
        put(war_drum(0.4, seed=k + 9), t + BB * 0.4, 0.9, wet=0.3)
    t += BB
    k += 1
# the theme in the low brass, minor, augmented
melB = [(0, 2, 'A3'), (2, 2, 'D4'), (4, 2, 'E4'), (6, 4, 'F4'), (10, 2, 'E4'), (12, 2, 'D4'), (14, 2, 'C4'), (16, 4, 'A3')]
for st, bt, n in melB:
    put(brass_note(midi(nm(n)), bt * BB * 0.95, vel=0.42 + 0.02 * st, a=0.12, r=0.8, voices=3, seed=300 + st), tB + 2 * BAR * 0.9 + st * BB, 0.75, p=-0.35, wet=0.45)
    put(brass_note(midi(nm(n)) - 12, bt * BB * 0.95, vel=0.36, a=0.12, r=0.8, voices=2, seed=320 + st, dark=0.8), tB + 2 * BAR * 0.9 + st * BB, 0.6, p=0.35, wet=0.45)
# strings tremolo-like pad and choir building to the peak
for k, ch in enumerate([['D3', 'F3', 'A3'], ['Bb2', 'F3', 'D4'], ['C3', 'G3', 'E4'], ['A2', 'E3', 'C#4']]):
    ensemble(ch, tB + (2 + k) * BAR * 0.9, BAR * 0.9, 0.26 + 0.06 * k, seed=400 + 7 * k, bright=1.2)
put(choir([midi(nm(n)) for n in ['D3', 'A3', 'D4', 'F4']], 2 * BAR * 0.9, vel=0.42, seed=7), tB + 3.5 * BAR * 0.9, 0.8, wet=0.7)
put(timp_roll(midi(nm('A1')), 2 * BAR * 0.9, v0=0.05, v1=0.9, seed=11), end_b - 2 * BAR * 0.9, 0.9, wet=0.4)
# riser into the impact (filtered noise sweep)
rn = int(3.0 * SR)
riser = noise_n(rn, 77)
cut = np.linspace(400, 7000, rn)
riser = np.concatenate([lp(riser[j:j + 4800], cut[j]) for j in range(0, rn, 4800)])[:rn] * np.linspace(0, 1, rn) ** 2 * 0.12
put(riser, end_b - 3.0, 1.0, wet=0.5)
# impact on the cut: timpani + low brass + bass drum
T_IMPACT = end_b
put(timpani(midi(nm('D2')), vel=0.95, decay=2.6, seed=21), T_IMPACT, 1.0, wet=0.6)
put(war_drum(1.0, f0=48, seed=99), T_IMPACT, 1.0, wet=0.6)
for j, n in enumerate(['D2', 'A2', 'D3', 'F3']):
    put(brass_note(midi(nm(n)), 1.6, vel=0.7, a=0.02, r=2.0, voices=3, seed=500 + j), T_IMPACT, 0.6, p=(j - 1.5) * 0.3, wet=0.7)
put(choir([midi(nm(n)) for n in ['D3', 'A3', 'D4', 'F4', 'A4']], 2.0, vel=0.45, seed=9), T_IMPACT - 0.4, 0.7, wet=0.8)

# ---------------------------------------------------------------- C: quiet reprise (0:46 - 1:00)
tC = T_IMPACT + 2.4
BC = B * 1.12  # slower
mel3, _ = melody_notes([PHRASE1[:9]], tC, shift=-12, beat=BC)
for j, (t, d, m) in enumerate(mel3):
    put(piano_note(midi(m), vel=0.4, dur=d * 1.4, seed=600 + j, bright=0.8), t, 0.9, p=0.05, wet=0.6)
for k, ch in enumerate([['D3', 'A3'], ['G2', 'D3'], ['B2', 'F#3'], ['A2', 'E3']]):
    for j, n in enumerate(ch):
        put(piano_note(midi(nm(n)), vel=0.22, dur=BC * 3.5, seed=650 + 3 * k + j, bright=0.7), tC + k * BC * 2.25 + j * 0.08, 0.8, p=-0.1, wet=0.6)
put(choir([midi(nm(n)) for n in ['D3', 'A3', 'F#3']], 9.0, vel=0.22, seed=13), tC + 1.0, 0.55, wet=0.8)
tEnd = mel3[-1][0] + mel3[-1][1] + 0.3
for j, n in enumerate(['D2', 'A2', 'D3', 'F#3', 'A3']):
    put(piano_note(midi(nm(n)), vel=0.3, dur=4.0, seed=700 + j, bright=0.7), tEnd + j * 0.09, 0.85, wet=0.7)
ensemble(['D3', 'A3', 'F#4'], tEnd, 4.0, 0.16, seed=720, wet=0.7, bright=0.7)

# ---------------------------------------------------------------- mix and master
wet = reverb(hall, mix=1.0, dur=3.4, damp=4200, seed=21)
mix = buf + wet * 0.85
mix = mix[: int(DUR * SR)]
mix = hp(mix.T, 30).T if mix.ndim == 2 else mix
mix = fade(mix, 0.3, 3.5)
# loudness to -14 LUFS, true peak <= -1 dBTP
for _ in range(3):
    L = integrated_lufs(mix)
    mix = mix * undb(-14.0 - L)
    lim = limiter(mix, ceiling_db=-1.2)
    mix = lim[0] if isinstance(lim, tuple) else lim
L = integrated_lufs(mix)
tp = true_peak_db(mix)
out = sys.argv[1] if len(sys.argv) > 1 else 'output/ep04-music-test.wav'
sf.write(out, mix.astype(np.float32), SR, subtype='PCM_24')
print(f'wrote {out}: {len(mix) / SR:.2f} s, {L:.2f} LUFS, true peak {tp:.2f} dBTP; war impact at {T_IMPACT:.2f} s, reprise from {tC:.2f} s')
