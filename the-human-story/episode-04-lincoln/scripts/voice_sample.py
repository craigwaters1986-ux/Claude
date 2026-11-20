"""Render the series voice through PyTorch with local weights and British phonemes."""
import argparse
import json
import os
import re
from pathlib import Path
import numpy as np
import soundfile as sf
import torch
from phonemizer import phonemize
from phonemizer.backend.espeak.wrapper import EspeakWrapper
import espeakng_loader
from kokoro import KModel

parser = argparse.ArgumentParser()
parser.add_argument('--assets', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--episode', type=Path)
# Pin sentence grouping to an earlier audit so a phoneme fix cannot regroup later sentences (and so cached phrases stay valid).
parser.add_argument('--groups-from', type=Path)
args = parser.parse_args()
torch.set_num_threads(3)
EspeakWrapper.set_library(espeakng_loader.get_library_path())
EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
model = KModel(repo_id='hexgrad/Kokoro-82M',config=str(args.assets/'config.json'),model=str(args.assets/'kokoro-v1_0.pth')).eval()
voice = torch.load(args.assets/'bm_george.pt',weights_only=True,map_location='cpu')
# Context-preserving name overrides. The placeholder is replaced after phonemisation.
# Knyvett: Wikipedia gives /nɪvɪt/ (NIV-it); the default phonemiser said NY-vet. The possessive has its own key so the
# s stays voiceless after t. Keys that contain another key must come first in this dict.
# Initials: the phonemiser keeps the full stop after an initial ("tˈiː."), and the model then swallows it. No stop here.
overrides = {'Appomattox':'ˌapəmˈatəks','John T. Stuart':'dʒˈɒn tˈiː stjˈuːət','Robert E. Lee':'ɹˈɒbət ˈiː lˈiː','Ulysses S. Grant':'juːlˈɪsiːz ˈɛs ɡɹˈɑːnt'}
def phones(text):
    found=[]
    def substitute(match):
        found.append(overrides[match.group()])
        return 'Quoggle'
    text=re.sub('|'.join(re.escape(n) for n in overrides),substitute,text)
    p=phonemize(text,language='en-gb',backend='espeak',preserve_punctuation=True,with_stress=True,language_switch='remove-flags').strip()
    for name in found:
        p,n=re.subn(r'kw[ˈˌ]?ɒɡəl',name,p,count=1)
        assert n==1
    return p
groups=[
"Whoever wrote this letter wanted it burnt, yet four hundred years later you can still read it.",
"There’s no name at the bottom or date at the top, but the man who opened it knew exactly which appointment he was being warned to miss. He was due in Parliament.",
"Within days, officials at Westminster had arrested a man who called himself John Johnson. We know him as Guy Fawkes.",
"The man at the centre of the conspiracy was Robert Catesby, a gentleman from Warwickshire.",
"On the twenty sixth of October, sixteen oh five, Lord Monteagle received the warning at his house in Hoxton."
]
# Sentence groups carry intonation across joins without exceeding model context.
section_ids = [None] * len(groups)
if args.episode:
    groups, section_ids = [], []
    for section in json.loads(args.episode.read_text())['sections']:
        pending = ''
        for sentence in re.split(r'(?<=[.!?])(?<!\s[A-Z]\.)\s+', section['narration']):
            candidate = (pending + ' ' + sentence).strip()
            if pending and len(phones(candidate)) > 420:
                groups.append(pending)
                section_ids.append(section['id'])
                pending = sentence
            else:
                pending = candidate
        if pending:
            groups.append(pending)
            section_ids.append(section['id'])

if args.groups_from:
    pinned = json.loads(args.groups_from.read_text())
    assert ' '.join(g['text'] for g in pinned).split() == ' '.join(groups).split(), 'pinned audit text differs from episode text'
    groups, section_ids = [g['text'] for g in pinned], [g['section'] for g in pinned]
args.output.mkdir(parents=True, exist_ok=True)
parts, audit = [], []
cursor = 0.0
for i, text in enumerate(groups):
    p = phones(text)
    assert len(p) < 500
    cache = args.output / f'phrase-{i:03d}.wav'
    if cache.exists():
        a, sample_rate = sf.read(cache, dtype='float32')
        assert sample_rate == 24000
    else:
        a = model(p, voice[len(p)-1], speed=0.99).numpy().reshape(-1)
        active = np.flatnonzero(np.abs(a) > 0.0015)
        a = a[max(0, active[0]-480):min(len(a), active[-1]+1440)]
        fade = min(192, len(a)//2)
        a[:fade] *= np.linspace(0, 1, fade)
        a[-fade:] *= np.linspace(1, 0, fade)
        sf.write(cache, a, 24000, subtype='PCM_16')
    duration = len(a)/24000
    section_end = i == len(groups)-1 or section_ids[i] != section_ids[i+1]
    gap = 0.34 if section_end else 0.21
    parts.extend([a, np.zeros(round(24000*gap), dtype=np.float32)])
    audit.append(dict(section=section_ids[i],text=text,phonemes=p,
                      start=cursor,end=cursor+duration,duration=duration))
    cursor += duration + gap
    print(i, round(duration, 2), flush=True)
name = 'narration-draft' if args.episode else 'narration-sample'
sf.write(args.output / (name+'.wav'), np.concatenate(parts), 24000, subtype='PCM_16')
(args.output / (name+'-audit.json')).write_text(json.dumps(audit, indent=2, ensure_ascii=False)+'\n')
