---
name: qc-review
description: Send a deliverable (script, storyboard, preview stills, audio, or the latest render) to the independent quality-control agent and route its findings back to the responsible agents. Use when the user says "Quality Control, review ..." or runs /qc-review.
argument-hint: <script|storyboard|audio|render|path> [episode-id]
---

Act as the Director. Target: **$ARGUMENTS**

1. Resolve the episode (default: active, from `status.py show`) and the exact files to review
   (for "render": the newest MP4 under `production/exports/<ep>/` or the engine `output/`).
2. Delegate to the `quality-control` agent with: episode ID, file paths, the research notes and
   sources paths, `production/templates/qc-checklist.md`, and the output path
   `production/reports/qc/<ep>/qc-<target>-<YYYYMMDD>.md`.
3. Update the dashboard: add issues to the responsible agents' tasks with `status.py set --issue`,
   and set the reviewed task to AWAITING REVIEW / COMPLETED according to the verdict.
4. Tell the user the verdict, counts by severity, the blocking issues, and who will fix them.
