"""Cut media/narration-draft.wav into the renderer's numbered phrase cache.

usage: seed-phrase-cache.py AUDIT.json DRAFT.wav OUTPUT_DIR [--skip N ...] [--verify]
Phrase files are written as phrase-NNN.wav (mono, 24 kHz, 16-bit) from the audit boundaries.
Use --skip for groups whose text or phonemes changed so voice_sample.py renders only those.
--verify re-assembles all phrases with the 0.21 s / 0.34 s gaps and compares with the draft.
"""
import argparse, json, wave
from pathlib import Path
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('audit', type=Path); ap.add_argument('wav', type=Path); ap.add_argument('out', type=Path)
ap.add_argument('--skip', type=int, nargs='*', default=[]); ap.add_argument('--verify', action='store_true')
a = ap.parse_args()
audit = json.loads(a.audit.read_text())
with wave.open(str(a.wav)) as w:
    assert (w.getnchannels(), w.getsampwidth(), w.getframerate()) == (1, 2, 24000)
    pcm = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2')
a.out.mkdir(parents=True, exist_ok=True)
phrases = []
for i, g in enumerate(audit):
    s, e = round(g['start'] * 24000), round(g['end'] * 24000)
    phrases.append(pcm[s:e])
    if i not in a.skip:
        with wave.open(str(a.out / f'phrase-{i:03d}.wav'), 'wb') as o:
            o.setnchannels(1); o.setsampwidth(2); o.setframerate(24000); o.writeframes(phrases[-1].tobytes())
if a.verify:
    parts = []
    for i, p in enumerate(phrases):
        end = i == len(audit) - 1 or audit[i]['section'] != audit[i + 1]['section']
        parts += [p, np.zeros(round(24000 * (0.34 if end else 0.21)), dtype='<i2')]
    rebuilt = np.concatenate(parts)
    print('rebuilt samples', len(rebuilt), 'draft samples', len(pcm), 'identical', bool(len(rebuilt) == len(pcm) and (rebuilt == pcm).all()))
print('wrote', len(audit) - len(a.skip), 'phrase files to', a.out)
