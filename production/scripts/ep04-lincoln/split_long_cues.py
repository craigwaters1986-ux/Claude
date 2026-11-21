#!/usr/bin/env python3
"""Split any aligned caption cue longer than 6 s at the silent beat it straddles (sentence break)."""
import json, re
P = 'production/scripts/ep04-lincoln/'
plan = json.load(open(P + 'edit-plan.json'))
def t(x):
    h, m, r = x.split(':'); return int(h) * 3600 + int(m) * 60 + float(r.replace(',', '.'))
def f(s):
    ms = round(s * 1000); return '%02d:%02d:%02d,%03d' % (ms // 3600000, ms // 60000 % 60, ms // 1000 % 60, ms % 1000)
G = sorted(plan['groups'], key=lambda g: g['final_start_ms'])
out = []
for c in open(P + 'captions-aligned.srt').read().strip().split('\n\n'):
    L = c.split('\n'); a, b = [t(x) for x in L[1].split(' --> ')]; txt = ' '.join(L[2:])
    gap = [(G[i]['final_end_ms'] / 1000, G[i + 1]['final_start_ms'] / 1000) for i in range(len(G) - 1)
           if a < G[i]['final_end_ms'] / 1000 < b and a < G[i + 1]['final_start_ms'] / 1000 < b]
    m = re.match(r'(.*?[.!?]["”]?)\s+(.*)', txt)
    if b - a > 6 and gap and m:
        e1, s2 = gap[0]
        out += [(a, min(e1 + 0.25, s2 - 0.1), m.group(1)), (s2, b, m.group(2))]
        print('split:', txt)
    else:
        out.append((a, b, '\n'.join(L[2:])))
open(P + 'captions-aligned.srt', 'w').write('\n\n'.join(f'{i + 1}\n{f(a)} --> {f(b)}\n{x}' for i, (a, b, x) in enumerate(out)) + '\n')
print(len(out), 'cues; longest', round(max(b - a for a, b, _ in out), 2), 's')
