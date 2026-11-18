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
args = parser.parse_args()
torch.set_num_threads(3)
EspeakWrapper.set_library(espeakng_loader.get_library_path())
EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
model = KModel(repo_id='hexgrad/Kokoro-82M',config=str(args.assets/'config.json'),model=str(args.assets/'kokoro-v1_0.pth')).eval()
voice = torch.load(args.assets/'bm_george.pt',weights_only=True,map_location='cpu')
# Context-preserving name overrides. The placeholder is replaced after phonemisation.
overrides = {'Guy Fawkes':'ɡˈaɪ fˈɔːks','Catesby':'kˈeɪtsbi','Hoxton':'hˈɒkstən','Warwickshire':'wˈɒɹɪkʃə','Salisbury':'sˈɔːlzbəɹi'}
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
args.output.mkdir(parents=True,exist_ok=True)
parts=[];audit=[]
for i,text in enumerate(groups):
    p=phones(text)
    assert len(p)<500
    a=model(p,voice[len(p)-1],speed=0.99).numpy().reshape(-1)
    # Preserve the model's phrase rhythm. Only shorten long edge silence.
    active=np.flatnonzero(np.abs(a)>0.0015)
    a=a[max(0,active[0]-480):min(len(a),active[-1]+1440)]
    fade=min(192,len(a)//2);a[:fade]*=np.linspace(0,1,fade);a[-fade:]*=np.linspace(1,0,fade)
    parts.extend([a,np.zeros(round(24000*0.21),dtype=np.float32)])
    audit.append(dict(text=text,phonemes=p,duration=len(a)/24000))
    print(i,round(len(a)/24000,2),flush=True)
sf.write(args.output/'narration-sample.wav',np.concatenate(parts),24000,subtype='PCM_16')
(args.output/'narration-sample-audit.json').write_text(json.dumps(audit,indent=2,ensure_ascii=False)+'\n')
