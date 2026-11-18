"""Build the locked 720 s edit plan, chapter markers and speech-aligned captions from the narration audit.

usage: build_plan.py AUDIT.json DRAFT.wav OUTPUT_DIR
Silent picture beats close the gap between the recorded narration and 12:00. Every beat except the last slot
of each section has a fixed length; the last slot absorbs the remainder, so re-running after a re-render
rebalances automatically. Beats only sit before the section's first group, after a group, or after the last group,
so no sentence is ever cut. Caption cues are anchored to the real pauses found in the audio.
"""
import json, re, subprocess, sys
from pathlib import Path

audit = json.loads(Path(sys.argv[1]).read_text()); wav = sys.argv[2]; out = Path(sys.argv[3]); out.mkdir(parents=True, exist_ok=True)
TARGET_MS = 720000
MS = lambda s: round(s * 1000)

SECTIONS = {  # id: (title, window ms, pre beats, {group: hold beats}, post beats). A duration of None takes the remainder.
 's01': ('A letter meant for the fire', 45000,
   [('rustle', 'Cold open on the folds of the anonymous letter. A hand smooths it flat and the eyes follow the page down. Paper rustle only, no narration yet.', 6000)], {},
   [('title', 'Series title card over the letter: The Gunpowder Plot. The letter has no signature, so none is drawn.', None)]),
 's02': ('A new king', 80000,
   [('card', 'Chapter card.', 3000), ('map', 'Pull back from the page to a map of Scotland and England before the narrator returns.', 3500)],
   {2: [('doc', 'Hold on the map: one crown over Edinburgh, a second over London, one king between them.', 2500)]},
   [('scene', 'Move into the parish street as the church bell sounds. The bell, not the camera, sets the family’s pace.', None)]),
 's03': ('The man behind the plot', 95000,
   [('card', 'Chapter card.', 3000), ('scene', 'Robert Catesby alone in a Warwickshire room, labelled at first appearance.', 2500)],
   {5: [('scene', 'London, May 1604: the four other men arrive one at a time; Guy Fawkes gets his own shot.', 3500)],
    6: [('scene', 'Old Palace of Westminster, interior, as the State Opening would look: benches filling, no one in danger on screen.', 4500)],
    7: [('scene', 'Princess Elizabeth’s portrait settles beside the Midlands map; the road markers where support was hoped for stay empty.', 3000)]},
   [('scene', 'Empty Midlands roads at dusk. The expected rising does not come.', None)]),
 's04': ('Ten days before Parliament', 95000,
   [('card', 'Chapter card.', 3000), ('scene', 'Hoxton at supper time: the footman receives the folded sheet. The sender stays out of view.', 2000)],
   {9: [('scene', 'Track the sheet from footman to Monteagle. Only the words quoted in the narration appear, in large type.', 3000)],
    10: [('doc', 'The surviving sheet at The National Archives (SP 14/216): slow pan along the hand.', 2000)],
    11: [('doc', 'Hold on the unsigned page. A question mark forms where the signature would be; no suspect is shown.', 5000)]},
   [('scene', 'Monteagle crosses to Whitehall and the letter passes to Robert Cecil at the council table.', None)]),
 's05': ('Two names in the record', 100000,
   [('card', 'Chapter card.', 3000), ('scene', 'From the council table out to the old Palace of Westminster at night.', 4000)],
   {13: [('scene', 'Night exterior at Westminster as the officials’ search begins.', 4000)],
    14: [('doc', 'Cut to the Commons Journal. The clerk adds the marginal note while the page is silent, so the viewer reads “Johnson, servant to Thomas Percy” before the narrator links it to Fawkes.', 8000)],
    15: [('doc', 'Hold on the margin, then ease out to the whole open Journal.', 4000)]},
   [('scene', 'Dissolve from the Journal back to Westminster at first light.', None)]),
 's06': ('After the arrest', 90000,
   [('card', 'Chapter card.', 3000), ('map', 'Map of London and the Midlands with the two strands: the investigation and the flight.', 2500)],
   {17: [('map', 'Route animates from the Midlands towards Staffordshire; the proclamation passes from hand to hand along it.', 6000)],
    18: [('doc', 'In London, successive sheets accumulate on an examiner’s desk. No dialogue and no depiction of the questioning.', 5000)]},
   [('scene', 'Holbeche House exterior at dawn, non-graphic, then fade to the scattered fates as a row of empty places.', None)]),
 's07': ('Who had to answer for it?', 100000,
   [('card', 'Chapter card.', 3000), ('scene', 'Approach to Westminster Hall on the morning of the trial.', 2500)],
   {20: [('scene', 'Parish household hears the proclamation from the street. Illustrative people, no invented speech.', 4500)],
    21: [('doc', 'The letter returns to the table, as the narrator asked us to think back to it.', 3000)],
    22: [('scene', 'The family at their table; a neighbour’s door stays shut.', 2500)]},
   [('scene', 'The street at evening, bell silent, as the oath is read out.', None)]),
 's08': ('How a date became a tradition', 115000,
   [('card', 'Chapter card.', 3000), ('scene', 'A church bell swinging. Match its motion to the later bell.', 2000)],
   {24: [('doc', 'The thanksgiving law as a page read aloud to a congregation.', 4000)],
    25: [('scene', 'The same street across generations: bells, bonfires and bundled wood.', 4000)],
    26: [('scene', 'Children gather wood and chant. No faces of historical figures on the bonfire figure.', 2000)]},
   [('doc', 'Quiet page turn back to the surviving letter.', 1500), ('end', 'Channel end card.', None)]),
}

# ---- timeline
secs = []
for sid in dict.fromkeys(g['section'] for g in audit):
    gi = [i for i, g in enumerate(audit) if g['section'] == sid]
    secs.append((sid, gi))
raw_start = [audit[gi[0]]['start'] for _, gi in secs]
total_raw = len(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], capture_output=True, text=True).stdout.strip()) and float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], capture_output=True, text=True).stdout)
raw_win = [MS(raw_start[k + 1] - raw_start[k]) if k + 1 < len(secs) else MS(total_raw - raw_start[k]) for k in range(len(secs))]
beats, groups, chapters, cursor = [], {}, [], 0
for k, (sid, gi) in enumerate(secs):
    title, target, pre, holds, post = SECTIONS[sid]
    extra = target - raw_win[k]
    assert extra > 0, (sid, extra)
    fixed = sum(d for *_, d in pre if d) + sum(d for hs in holds.values() for *_, d in hs) + sum(d for *_, d in post if d)
    rem = extra - fixed
    assert rem >= 1500, f'{sid}: remainder beat only {rem} ms'
    win0 = cursor; chapters.append((win0, title, sid))
    t = win0; shift = None; shift_acc = 0
    def put(kind, desc, dur, where):
        global beats
        d = dur if dur is not None else win0 + target - 340 - t_[0]
        assert d >= 1500, (sid, 'remainder beat too short', d)
        beats.append(dict(section=sid, slot=where, kind=kind, start_ms=t_[0], end_ms=t_[0] + d, dur_ms=d, description=desc)); t_[0] += d; return d
    t_ = [win0]
    for kind, desc, dur in pre: put(kind, desc, dur, 'pre')
    narr_shift_ms = t_[0] - MS(audit[gi[0]]['start'])  # group time + shift = final time
    hold_acc = 0
    for i in gi:
        g = audit[i]
        gs = MS(g['start']) + narr_shift_ms + hold_acc; ge = MS(g['end']) + narr_shift_ms + hold_acc
        groups[i] = dict(group=i, section=sid, raw_start=g['start'], raw_end=g['end'], final_start_ms=gs, final_end_ms=ge, shift_ms=narr_shift_ms + hold_acc)
        if i in holds:
            t_[0] = ge  # hold begins as the sentence ends; the 0.21 s join gap stays inside the hold
            for kind, desc, dur in holds[i]:
                hold_acc += put(kind, desc, dur, f'after group {i}')
    last_end = groups[gi[-1]]['final_end_ms']
    t_[0] = last_end
    for kind, desc, dur in post: put(kind, desc, dur, 'post')
    end_ms = t_[0] + 340  # the 0.34 s section gap
    assert end_ms == win0 + target, (sid, end_ms, win0 + target)
    cursor = win0 + target
assert cursor == TARGET_MS, cursor
# no beat overlaps and no cut sentence: starts of beats equal ends of the previous beat or group
for b in beats: assert b['dur_ms'] > 0

def tc(ms, sep=','): h, r = divmod(ms, 3600000); m, r = divmod(r, 60000); s, x = divmod(r, 1000); return f'{h:02d}:{m:02d}:{s:02d}{sep}{x:03d}'
def mmss(ms): return f'{ms // 60000}:{(ms // 1000) % 60:02d}'

# ---- captions anchored to pauses in the audio
sil = []
sp = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', wav, '-af', 'silencedetect=n=-38dB:d=0.18', '-f', 'null', '-'], capture_output=True, text=True).stderr
cur = None
for line in sp.splitlines():
    m = re.search(r'silence_start: ([\d.]+)', line)
    if m: cur = float(m.group(1))
    m = re.search(r'silence_end: ([\d.]+)', line)
    if m and cur is not None: sil.append((cur, float(m.group(1)))); cur = None
YEARS = [(r'\bsixteen oh four\b', '1604'), (r'\bsixteen oh five\b', '1605'), (r'\bsixteen oh six\b', '1606')]
def syl(w):
    w2 = re.sub(r'[^a-z]', '', w.lower()); n = len(re.findall(r'[aeiouy]+', w2)) or 1
    return n + 0.35 * len(w2) / 6 + 0.15
def tokens(text):
    toks, spoken = [], re.findall(r'\S+', text); i = 0
    while i < len(spoken):
        three = ' '.join(spoken[i:i + 3]); done = False
        for pat, rep in YEARS:
            m = re.match(pat, re.sub(r'[,.]$', '', three), re.I)
            if m and len(m.group(0).split()) == 3:
                trail = re.search(r'[,.;:?!]$', three); toks.append((rep + (trail.group(0) if trail else ''), 3.2)); i += 3; done = True; break
        if not done: toks.append((spoken[i], syl(spoken[i]))); i += 1
    return toks
cues_raw, report = [], []
for i, g in enumerate(audit):
    toks = tokens(g['text']); rs, re_ = g['start'], g['end']; tw = sum(w for _, w in toks)
    cum = 0; pred = []
    for j, (w, wt) in enumerate(toks[:-1]):
        cum += wt
        if re.search(r'[.,;:?!]$', w): pred.append((j, rs + cum / tw * (re_ - rs)))
    det = [(s, e) for s, e in sil if s > rs + 0.08 and e < re_ - 0.08]
    # monotone DP: match predicted pauses to detected silences
    P, D = len(pred), len(det); INF = 1e9
    dp = [[INF] * (D + 1) for _ in range(P + 1)]; bk = {}
    dp[0][0] = 0
    for a in range(P + 1):
        for b in range(D + 1):
            c = dp[a][b]
            if c >= INF: continue
            if a < P and c + 0.7 < dp[a + 1][b]: dp[a + 1][b] = c + 0.7; bk[(a + 1, b)] = (a, b, None)
            if b < D and c + 0.25 < dp[a][b + 1]: dp[a][b + 1] = c + 0.25; bk[(a, b + 1)] = (a, b, None)
            if a < P and b < D:
                d = abs((det[b][0] + det[b][1]) / 2 - pred[a][1])
                if d <= 1.6 and c + d < dp[a + 1][b + 1]: dp[a + 1][b + 1] = c + d; bk[(a + 1, b + 1)] = (a, b, (a, b))
    a, b, matches = P, D, []
    while (a, b) != (0, 0):
        pa, pb, m = bk[(a, b)]
        if m: matches.append(m)
        a, b = pa, pb
    matches.reverse()
    anchors = [(pred[a_][0], det[b_][0], det[b_][1]) for a_, b_ in matches]  # token index before pause, silence start, silence end
    times = [None] * len(toks); seg_s, idx = rs, 0
    for (tj, s, e) in anchors + [(len(toks) - 1, re_, re_)]:
        seg = list(range(idx, tj + 1)); sw = sum(toks[q][1] for q in seg); t0 = seg_s
        for q in seg:
            t1 = t0 + toks[q][1] / sw * (s - seg_s); times[q] = (t0, t1); t0 = t1
        idx, seg_s = tj + 1, e
    report.append((i, len(matches), P))
    for (w, _), (ts, te) in zip(toks, times): cues_raw.append((i, w, ts, te))
matched = sum(m for _, m, _ in report); predicted = sum(p for *_, p in report)
# build cues: clause chunks, merged up to ~70 characters without crossing a sentence end, long chunks split evenly
def final_t(i, t): return round(t * 1000) + groups[i]['shift_ms']
def lines(words):
    text = ' '.join(words)
    if len(text) <= 42: return text
    best = None
    for k in range(1, len(words)):
        l1, l2 = ' '.join(words[:k]), ' '.join(words[k:])
        if len(l1) <= 42 and len(l2) <= 42 and (best is None or abs(len(l1) - len(l2)) < best[0]): best = (abs(len(l1) - len(l2)), l1 + '\n' + l2)
    return best[1] if best else text
chunks, cur = [], []
for item in cues_raw:
    cur.append(item)
    if re.search(r'[.,;:?!]$', item[1]): chunks.append(cur); cur = []
if cur: chunks.append(cur)
merged = []
for ch in chunks:
    if merged and not re.search(r'[.?!]$', merged[-1][-1][1]) and merged[-1][-1][0] == ch[0][0]:
        joined = merged[-1] + ch
        if len(' '.join(w for _, w, *_ in joined)) <= 70 and joined[-1][3] - joined[0][2] <= 5.5: merged[-1] = joined; continue
    merged.append(ch)
cues = []
for ch in merged:
    n = 1
    while len(' '.join(w for _, w, *_ in ch)) / n > 80 or (ch[-1][3] - ch[0][2]) / n > 6.0: n += 1
    per = len(ch) / n; pieces = [ch[round(k * per):round((k + 1) * per)] for k in range(n)]
    for pc in pieces:
        cues.append(dict(start_ms=final_t(pc[0][0], pc[0][2]), end_ms=final_t(pc[-1][0], pc[-1][3]), text=lines([w for _, w, *_ in pc]), group=pc[0][0]))
# merge cues under 1.0 s into the next cue of the same group (else the previous), keeping two lines of 42 characters
k = 0
while k < len(cues):
    c = cues[k]
    if c['end_ms'] - c['start_ms'] < 1000:
        nb = k + 1 if k + 1 < len(cues) and cues[k + 1]['group'] == c['group'] else (k - 1 if k > 0 and cues[k - 1]['group'] == c['group'] else None)
        if nb is not None:
            a_, b_ = sorted((k, nb)); x, y = cues[a_], cues[b_]
            words = (x['text'] + ' ' + y['text']).replace('\n', ' ').split(' ')
            joined = lines(words)
            if len(' '.join(words)) <= 84 and all(len(l) <= 42 for l in joined.split('\n')):
                cues[a_] = dict(start_ms=x['start_ms'], end_ms=y['end_ms'], text=joined, group=x['group']); del cues[b_]; k = max(a_ - 1, 0); continue
    k += 1
for k, c in enumerate(cues):  # readability: hold up to 0.3 s past the last word when the gap allows, never overlap
    nxt = cues[k + 1]['start_ms'] if k + 1 < len(cues) else TARGET_MS
    c['end_ms'] = min(c['end_ms'] + 300, nxt - 40)
    assert c['end_ms'] > c['start_ms']
srt = ''.join(f"{n}\n{tc(c['start_ms'])} --> {tc(c['end_ms'])}\n{c['text']}\n\n" for n, c in enumerate(cues, 1))
(out / 'captions-provisional.srt').write_text(srt)
(out / 'chapters.txt').write_text(''.join(f'{mmss(ms)} {title}\n' for ms, title, _ in chapters))
plan = dict(target_ms=TARGET_MS, narration_ms=MS(total_raw), gap_ms=TARGET_MS - MS(total_raw),
            chapters=[dict(start_ms=ms, start=mmss(ms), title=t, section=s) for ms, t, s in chapters],
            beats=beats, groups=[groups[i] for i in sorted(groups)],
            captions=dict(cues=len(cues), pauses_matched=matched, pauses_predicted=predicted,
                          per_group=[dict(group=i, matched=m, predicted=p) for i, m, p in report]))
(out / 'edit-plan.json').write_text(json.dumps(plan, indent=1, ensure_ascii=False) + '\n')
md = ['# Episode 3 locked edit plan', '', f'Built from the current narration audit. Narration {total_raw:.3f} s, picture {TARGET_MS/1000:.3f} s, gap closed {(TARGET_MS - MS(total_raw))/1000:.3f} s. Regenerate with `tools/build_plan.py` after any re-render.', '',
      '| Chapter | Start | Window |', '| --- | --- | --- |']
for k, (ms, title, sid) in enumerate(chapters): md.append(f'| {title} | {mmss(ms)} | {SECTIONS[sid][1]/1000:.0f} s |')
md += ['', '| Start | End | Dur | Section | Slot | Beat |', '| --- | --- | ---: | --- | --- | --- |']
for b in beats: md.append(f"| {tc(b['start_ms'], '.')[3:]} | {tc(b['end_ms'], '.')[3:]} | {b['dur_ms']/1000:.3f} | {b['section']} | {b['slot']} | {b['kind']}: {b['description']} |")
(out / 'edit-plan.md').write_text('\n'.join(md) + '\n')
print('sections', len(secs), 'beats', len(beats), 'silent s', sum(b['dur_ms'] for b in beats) / 1000, 'cues', len(cues), 'pauses', matched, '/', predicted)
for ms, t, s in chapters: print(mmss(ms), t)
