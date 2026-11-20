#!/usr/bin/env python3
"""Write src/timeline/timeline.json for the composition from the locked edit plan and the caption SRT.

usage: python3 scripts/timeline.py [SRT]   (default: production/scripts/ep04-lincoln/captions-provisional.srt)
Captions carry their own line breaks; shots anchor to caption text via T('phrase') in src/timeline/index.ts.
"""
import json, re, sys
from pathlib import Path
ENG = Path(__file__).resolve().parents[1]
PROD = ENG.parents[1] / 'production' / 'scripts' / 'ep04-lincoln'
srt = Path(sys.argv[1]) if len(sys.argv) > 1 else PROD / 'captions-provisional.srt'
plan = json.loads((PROD / 'edit-plan.json').read_text())
def sec(t):
    h, m, s = t.replace(',', '.').split(':'); return round(int(h) * 3600 + int(m) * 60 + float(s), 3)
cues = []
for block in re.split(r'\n\s*\n', srt.read_text().strip()):
    lines = block.strip().split('\n')
    a, b = lines[1].split(' --> ')
    cues.append(dict(start=sec(a), end=sec(b), lines=lines[2:]))
out = dict(
    chapters=[dict(start=c['start_ms'] / 1000, title=c['title'], section=c['section']) for c in plan['chapters']],
    beats=[dict(section=b['section'], kind=b['kind'], start=b['start_ms'] / 1000, end=b['end_ms'] / 1000) for b in plan['beats']],
    groups=[dict(group=g['group'], section=g['section'], start=g['final_start_ms'] / 1000, end=g['final_end_ms'] / 1000) for g in plan['groups']],
    captions=cues)
(ENG / 'src' / 'timeline').mkdir(parents=True, exist_ok=True)
(ENG / 'src' / 'timeline' / 'timeline.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
print('chapters', len(out['chapters']), 'beats', len(out['beats']), 'groups', len(out['groups']), 'cues', len(cues))
