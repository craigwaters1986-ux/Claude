#!/usr/bin/env python3
"""Re-time caption cues to recognised word timings (faster-whisper word timestamps on the narration WAV).

usage: align_captions.py WORDS.json EDIT_PLAN.json CAPTIONS.srt OUT.srt REPORT.json
Cue text and line breaks are kept; each cue's start/end move to its first/last word as recognised, mapped from
raw narration time to programme time through the plan's per-group shifts. Unmatched cue edges keep the
pause-anchored timing. Cues never overlap, keep a minimum 0.8 s on screen and a 1-frame gap.
"""
import json, re, sys, difflib
words, plan, srt_in, srt_out, rep = sys.argv[1:6]
W = json.load(open(words)); P = json.load(open(plan))
def norm(s): return re.sub(r"[^a-z0-9]", "", s.lower().replace("’", "'"))
NUM = {'1604': ['sixteen', 'oh', 'four'], '1605': ['sixteen', 'oh', 'five'], '1606': ['sixteen', 'oh', 'six']}
def toks(text):
    out = []
    for w in re.split(r"[\s\-–—]+", text):
        n = norm(w)
        if n in NUM: out += NUM[n]
        elif n: out.append(n)
    return out
def sec(t): h, m, s = t.replace(',', '.').split(':'); return int(h) * 3600 + int(m) * 60 + float(s)
def tc(x):
    ms = round(x * 1000); h, r = divmod(ms, 3600000); m, r = divmod(r, 60000); s, r = divmod(r, 1000); return f'{h:02d}:{m:02d}:{s:02d},{r:03d}'
cues = []
for b in re.split(r'\n\s*\n', open(srt_in).read().strip()):
    l = b.strip().split('\n'); a, e = l[1].split(' --> '); cues.append(dict(start=sec(a), end=sec(e), lines=l[2:]))
# whisper tokens (numbers like "1604" may come back as digits)
wt, wtime = [], []
for w in W:
    for t in toks(w['w']):
        wt.append(t); wtime.append((w['s'], w['e']))
st, owner = [], []
for i, c in enumerate(cues):
    for t in toks(' '.join(c['lines'])): st.append(t); owner.append(i)
sm = difflib.SequenceMatcher(a=st, b=wt, autojunk=False)
match = {}
for a, b, n in sm.get_matching_blocks():
    for k in range(n): match[a + k] = b + k
groups = P['groups']
def to_prog(raw):
    for g in groups:
        if g['raw_start'] - 0.2 <= raw <= g['raw_end'] + 0.25: return raw + g['shift_ms'] / 1000
    return None
moved = 0; first_idx = {}; last_idx = {}
for k, i in enumerate(owner):
    first_idx.setdefault(i, k); last_idx[i] = k
new = []
for i, c in enumerate(cues):
    s0, e0 = c['start'], c['end']
    a, b = first_idx[i], last_idx[i]
    s = to_prog(wtime[match[a]][0]) if a in match else None
    e = to_prog(wtime[match[b]][1]) if b in match else None
    ns_ = s if s is not None and abs(s - s0) < 1.5 else s0
    ne = e + 0.15 if e is not None and abs(e - e0) < 1.5 else e0
    if ns_ != s0 or ne != e0: moved += 1
    new.append(dict(start=ns_, end=ne, lines=c['lines'], dstart=round(ns_ - s0, 3), dend=round(ne - e0, 3)))
for i in range(len(new) - 1):
    new[i]['end'] = min(new[i]['end'], new[i + 1]['start'] - 1 / 30)
for c in new:
    c['end'] = max(c['end'], c['start'] + 0.8)
for i in range(len(new) - 1):
    assert new[i]['end'] < new[i + 1]['start'], i
open(srt_out, 'w').write('\n'.join(f"{i + 1}\n{tc(c['start'])} --> {tc(c['end'])}\n" + '\n'.join(c['lines']) + '\n' for i, c in enumerate(new)))
cov = len(match) / len(st)
ds = sorted(abs(c['dstart']) for c in new)
json.dump(dict(cues=len(new), script_tokens=len(st), matched_tokens=len(match), coverage=round(cov, 4), cues_moved=moved,
               median_abs_start_shift=ds[len(ds) // 2], max_abs_start_shift=ds[-1],
               transcript_mismatches=[(' '.join(st[a1:a2]), ' '.join(wt[b1:b2])) for op, a1, a2, b1, b2 in sm.get_opcodes() if op != 'equal']),
          open(rep, 'w'), indent=1, ensure_ascii=False)
print('coverage', round(cov, 4), 'moved', moved, 'median shift', ds[len(ds) // 2], 'max', ds[-1])
