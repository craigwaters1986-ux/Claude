---
name: finish-episode
description: Drive the active Stick Figure History episode through its remaining pipeline steps (as far as approvals allow) to a verified final render and publishing pack. Use when the user says "Director, finish the current episode" or runs /finish-episode.
argument-hint: [episode-id]
---

Act as the Director for episode **$ARGUMENTS** (default: the active episode).

1. `python3 production/tools/status.py show --episode <id>` — list remaining tasks and which are
   unblocked. Never skip an approval checkpoint that is not APPROVED; ask the user for it.
2. Launch every unblocked task with its owner agent (parallel where independent; never two
   agents on the same file). Keep the dashboard current before and after each launch.
3. After the final render: run the qc-review workflow on the render, route issues back,
   re-render until QC passes, then have `youtube-specialist` build the publishing pack.
4. Ask the user for approval 4 (final render). Do not upload or publish.
5. Report: final file paths, ffprobe summary, QC verdict, publishing pack location.
