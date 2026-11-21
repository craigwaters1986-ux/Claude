#!/usr/bin/env bash
# Rebuild the locked plan, aligned captions (long cues split at silent beats, awkward breaks polished) and the engine timeline
# from the assembled narration (the-human-story/episode-04-lincoln/output/el-full). Run from the repo root.
set -euo pipefail
P=production/scripts/ep04-lincoln; ENG=the-human-story/episode-04-lincoln
PLAN_CONFIG=$P/plan_config.py python3 tools/build_plan.py $ENG/output/el-full/narration-draft-audit.json $ENG/output/el-full/narration-draft.wav $P
python3 tools/align_captions.py production/audio/ep04-lincoln/words.json $P/edit-plan.json $P/captions-provisional.srt $P/captions-aligned.srt $P/captions-alignment-report.json
python3 $P/split_long_cues.py
python3 $P/polish_captions.py
(cd $ENG && python3 scripts/timeline.py ../../$P/captions-aligned.srt)
