"""Assemble the ElevenLabs narration (Phase D upgrade; voice Liam Dale, eleven_v4) into the pipeline's format:
output/el-full/narration-draft.wav (48 kHz mono) + narration-draft-audit.json (same groups and texts as the
Kokoro audit, new start/end). Each clip: decoded at 48 kHz, edge silence trimmed (-45 dB, 60 ms kept), loudness
matched to -20 LUFS, joined with the series' 0.34 s paragraph gap."""
import json, subprocess, sys
import numpy as np, soundfile as sf
sys.path.insert(0, 'scripts')
from audio_lib import integrated_lufs
SR = 48000
audit = json.load(open('output/full-voice/narration-draft-audit.json'))
GAP = 0.34
out, new, t = [], [], 0.25
def dec(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(float)
out.append(np.zeros(int(t * SR)))
for i, g in enumerate(audit):
    x = dec(f'output/el-voice/g{i:02d}.mp3')
    env = np.convolve(np.abs(x), np.ones(480) / 480, mode='same')
    on = np.where(env > 10 ** (-45 / 20))[0]
    a, b = max(0, on[0] - int(0.06 * SR)), min(len(x), on[-1] + int(0.06 * SR))
    x = x[a:b]
    L = integrated_lufs(np.stack([x, x], 1))
    x = x * 10 ** ((-20 - L) / 20)
    d = len(x) / SR
    new.append({**{k: v for k, v in g.items() if k not in ('start', 'end', 'phonemes')}, 'start': round(t, 3), 'end': round(t + d, 3), 'voice': 'ElevenLabs Liam Dale (eleven_v4)'})
    out += [x, np.zeros(int(GAP * SR))]
    t += d + GAP
y = np.concatenate(out + [np.zeros(int(0.5 * SR))])
pk = np.max(np.abs(y)); y = y * min(1, 0.89 / pk)
sf.write('output/el-full/narration-draft.wav', y, SR, subtype='PCM_24')
json.dump(new, open('output/el-full/narration-draft-audit.json', 'w'), indent=1, ensure_ascii=False)
print('groups', len(new), 'total', round(len(y) / SR, 2), 'speech', round(sum(g['end'] - g['start'] for g in new), 2))
