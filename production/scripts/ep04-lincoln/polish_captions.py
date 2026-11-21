#!/usr/bin/env python3
"""Polish the aligned captions for the ElevenLabs narration (Phase D2). Run from the repo root, after
tools/align_captions.py and split_long_cues.py (rebuild-timing.sh does this).

1. Re-segment a few runs of cues where the new voice's pauses left awkward breaks ("Ulysses S." | "Grant. An
   estimated ..."). The words are never changed: each run's new segments must spell exactly the same text. New
   cue times come from the recognised word timings (production/audio/ep04-lincoln/words.json), mapped to
   programme time through the plan's group shifts.
2. Re-wrap every cue to one or two balanced lines (max 42 characters) without splitting a proper name across
   the line break where it can be avoided.
"""
import difflib, json, re

P = 'production/scripts/ep04-lincoln/'
SRT = P + 'captions-aligned.srt'
plan = json.load(open(P + 'edit-plan.json'))
W = json.load(open('production/audio/ep04-lincoln/words.json'))

# ------------------------------------------------------------------ helpers (token rules as tools/align_captions.py)
def norm(s): return re.sub(r"[^a-z0-9]", "", s.lower().replace("’", "'"))
_U = 'zero one two three four five six seven eight nine'.split()
_T = {2: 'twenty', 3: 'thirty', 4: 'forty', 5: 'fifty', 6: 'sixty', 7: 'seventy', 8: 'eighty', 9: 'ninety'}
NUM = {}
for _y in list(range(1800, 1900)) + [1922]:
    _a, _b = divmod(_y, 100); _h = {18: 'eighteen', 19: 'nineteen'}[_a]
    if _b == 0: _w = [_h, 'hundred']
    elif _b < 10: _w = [_h, 'oh', _U[_b]]
    elif _b < 20: _w = [_h, 'ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()[_b - 10]]
    else: _w = [_h, _T[_b // 10]] + ([_U[_b % 10]] if _b % 10 else [])
    NUM[str(_y)] = _w
def toks(text):
    out = []
    for w in re.split(r"[\s\-–—]+", text):
        n = norm(w)
        if n in NUM: out += NUM[n]
        elif n: out.append(n)
    return out
def sec(t): h, m, s = t.replace(',', '.').split(':'); return int(h) * 3600 + int(m) * 60 + float(s)
def tc(x):
    ms = round(x * 1000); h, r = divmod(ms, 3600000); m, r = divmod(r, 60000); s, r = divmod(r, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{r:03d}'
def to_prog(raw):
    for g in plan['groups']:
        if g['raw_start'] - 0.2 <= raw <= g['raw_end'] + 0.25:
            return raw + g['shift_ms'] / 1000
    return None

cues = []
for b in re.split(r'\n\s*\n', open(SRT).read().strip()):
    l = b.strip().split('\n'); a, e = l[1].split(' --> ')
    cues.append(dict(start=sec(a), end=sec(e), text=' '.join(l[2:])))

wt = []  # (token, programme start, programme end)
for w in W:
    s, e = to_prog(w['s']), to_prog(w['e'])
    if s is None or e is None:
        continue
    for t in toks(w['w']):
        wt.append((t, s, e))

# ------------------------------------------------------------------ 1. re-segmentation
# (first words of the run's first cue, number of cues in the run, new segments)
RESEG = [
    ('He borrowed law books from John T.', 2,
     ['He borrowed law books from John T. Stuart,', 'later his law partner, and taught himself.']),
    ('where he opposed the war with Mexico and proposed a', 2,
     ['where he opposed the war with Mexico', 'and proposed a bill to begin ending slavery in the District of Columbia.']),
    ('"A house divided against itself cannot', 4,
     ['"A house divided against itself cannot stand."', '"I believe this government cannot endure,',
      'permanently half slave and half free."', 'He met the Democrat Stephen Douglas in seven debates across Illinois.']),
    ('At Charleston he said something hard to hear today: "I am not,', 4,
     ['At Charleston he said something hard to hear today:', '"I am not, nor ever have been, in favor of bringing about in any way',
      'the social and political equality of the white and black races…"', 'He also opposed Black voting and jury service.']),
    ('If slavery is not wrong,', 2,
     ['If slavery is not wrong, nothing is wrong."', 'That summer he expected to lose.']),
    ("to bind up the nation's wounds…\" Frederick", 7,
     ["to bind up the nation's wounds…\"", 'Frederick Douglass recalled calling it "a sacred effort".',
      'On the ninth of April, at Appomattox Court House,', 'Robert E. Lee surrendered his Confederate army',
      'to the Union commander, Ulysses S. Grant.', 'An estimated six hundred and twenty thousand',
      'to seven hundred and fifty thousand died in the war.']),
    ('shall not perish from the earth." Two minutes, a few sheets of paper,', 2,
     ['shall not perish from the earth."', 'Two minutes, a few sheets of paper, and an argument that has never ended.']),
]
GAP, MIN = 0.033, 0.8
changed = []
for head, n, segs in RESEG:
    i = next((k for k, c in enumerate(cues) if c['text'].startswith(head)), None)
    assert i is not None, 'run not found: ' + head
    run = cues[i:i + n]
    old_text = ' '.join(c['text'] for c in run)
    assert ' '.join(segs) == old_text, 'text changed:\n  ' + old_text + '\n  ' + ' '.join(segs)
    a, e = run[0]['start'], run[-1]['end']
    win = [k for k, (t, s, x) in enumerate(wt) if a - 0.6 <= s <= e + 0.6]
    st = []; owner = []
    for j, sg in enumerate(segs):
        for t in toks(sg):
            st.append(t); owner.append(j)
    sm = difflib.SequenceMatcher(a=st, b=[wt[k][0] for k in win], autojunk=False)
    match = {}
    for x, y, m in sm.get_matching_blocks():
        for q in range(m):
            match[x + q] = win[y + q]
    cov = len(match) / len(st)
    assert cov > 0.6, f'low word match {cov:.2f} for: {head}'  # figures come back as digits ("620,000"), so not every word matches
    new = []
    for j, sg in enumerate(segs):
        idx = [k for k, o in enumerate(owner) if o == j]
        # start: the segment's first word as recognised; if that word was not matched, just after the last matched word before it
        if idx[0] in match:
            s = wt[match[idx[0]]][1]
        else:
            prev = next((match[k] for k in range(idx[0] - 1, -1, -1) if k in match), None)
            assert prev is not None or j == 0, 'segment start unmatched: ' + sg
            s = wt[prev][2] + 0.1 if prev is not None else a
        # end: the segment's last word as recognised; if unmatched, hold until the next segment starts (set below)
        x = wt[match[idx[-1]]][2] + 0.12 if idx[-1] in match else None
        new.append(dict(start=s, end=x, text=sg))
    for j, c in enumerate(new):
        if c['end'] is None:
            c['end'] = new[j + 1]['start'] - GAP if j + 1 < len(new) else e
    new[0]['start'] = a; new[-1]['end'] = e
    for j in range(len(new) - 1):
        if new[j]['end'] > new[j + 1]['start'] - GAP:
            new[j]['end'] = new[j + 1]['start'] - GAP
    for j, c in enumerate(new):  # minimum time on screen: borrow from the gap after, never overlap
        if c['end'] - c['start'] < MIN:
            lim = new[j + 1]['start'] - GAP if j + 1 < len(new) else e
            c['end'] = min(c['start'] + MIN, lim)
    assert all(c['end'] > c['start'] + 0.4 for c in new), new
    changed.append((head, [(round(c['start'], 2), round(c['end'], 2), c['text']) for c in new]))
    cues[i:i + n] = new

# ------------------------------------------------------------------ 1b. hand-timed cues
# The recogniser dropped the words between "Bull Run." and "paramount" (narration 283.8-291.0 s), so these three cues
# had fallen back to pause-anchored guesses and ran up to 1.4 s ahead of the voice. Times below are raw narration
# seconds measured from the pauses in the recording (silencedetect -38 dB); to_prog maps them through the plan.
RETIME = [
    ('In February 1862, his son', None, 288.92),
    ('In August he wrote publicly,', 289.20, 291.01),
    ('"My paramount object in this', 291.33, None),
]
for head, rs, re_ in RETIME:
    c = next(c for c in cues if c['text'].startswith(head))
    if rs is not None: c['start'] = round(to_prog(rs), 3)
    if re_ is not None: c['end'] = round(to_prog(re_), 3)
    assert c['end'] > c['start'] + 0.8, c
assert all(b_['start'] >= a_['end'] for a_, b_ in zip(cues, cues[1:])), 'overlap after retime'

# ------------------------------------------------------------------ 2. line wrapping
SMALL = {'a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'his', 'her', 'its', 'and', 'or', 'but', 'with', 'from', 'that', 'he', 'it', 'as'}
NAMEWORD = re.compile(r"^[\"“]?[A-Z][A-Za-z.'’–-]*[,;:.]?$")
def wrap(text, limit=42):
    if len(text) <= limit:
        return [text]
    words = text.split(' ')
    best = None
    for k in range(1, len(words)):
        l1, l2 = ' '.join(words[:k]), ' '.join(words[k:])
        cost = abs(len(l1) - len(l2))
        cost += (max(0, len(l1) - limit) + max(0, len(l2) - limit)) * 30
        a, b = words[k - 1], words[k]
        if re.search(r'[,;:.!?…"”]$', a): cost -= 10          # break after punctuation
        if norm(a) in SMALL: cost += 8                        # no small word dangling at the line end
        if norm(b) in SMALL: cost -= 2
        if re.search(r'[,;:.!?]["”]?$', b) and k < len(words) - 1 and not re.search(r'[,;:.!?…"”]$', a):
            cost += 8                                         # no single word stranded before a clause break ("Bliss | copy,")
        if any(re.match(r'^["“]', w) for w in words[max(0, k - 2):k]): cost += 8  # keep the first words of a quotation together
        # do not split a proper name ("Abraham | Lincoln", "Fort | Sumter", "Robert E. | Lee")
        if NAMEWORD.match(a) and NAMEWORD.match(b) and not re.search(r'[,;:!?…"”]$', a) and k > 1:
            if not (a.endswith('.') and len(a) > 3): cost += 14
        if re.match(r'^\d', b) and not re.search(r'[,;:]$', a): cost += 6  # keep "January | 1863", "In | 1922" together
        if best is None or cost < best[0]:
            best = (cost, [l1, l2])
    return best[1]

out = []
for k, c in enumerate(cues):
    out.append(f"{k + 1}\n{tc(c['start'])} --> {tc(c['end'])}\n" + '\n'.join(wrap(c['text'])))
open(SRT, 'w').write('\n\n'.join(out) + '\n')
longest = max(c['end'] - c['start'] for c in cues)
maxline = max(len(l) for c in cues for l in wrap(c['text']))
overlaps = sum(1 for a, b in zip(cues, cues[1:]) if b['start'] < a['end'])
print(f'{len(cues)} cues; longest {longest:.2f} s; longest line {maxline} chars; overlaps {overlaps}')
for head, new in changed:
    print('re-segmented:', head)
    for s, e, t in new:
        print(f'   {s:7.2f}-{e:7.2f}  {t}')
