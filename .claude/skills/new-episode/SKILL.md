---
name: new-episode
description: Start a new The Human Story episode as the Director — create the episode ID, dashboard task list and brief, then launch the first independent tasks (research and keyword research) in parallel. Use when the user says "Director, start a new episode about ..." or runs /new-episode.
argument-hint: <subject> [duration-seconds]
---

Act as the Director (see `CLAUDE.md`, `production/WORKFLOW.md`). Subject: **$ARGUMENTS**

1. Choose the next episode ID: check `python3 production/tools/status.py show` and use
   `epNN-<short-slug>` (e.g. `ep02-rome`). Default duration 600 s unless given.
2. `python3 production/tools/status.py new-episode --episode <id> --title "<Title>" [--duration N]`
3. Write the brief to `production/reports/handoffs/<id>/00-director-brief.md`: subject, working
   title, audience, angle, section plan, sensitive topics and how to handle them, deliverables,
   and the four approval checkpoints. Mark `brief` COMPLETED with that deliverable.
4. Launch in parallel (one message, two Agent calls): `researcher` (task `research`) and
   `youtube-specialist` (task `keywords`), each with the full brief in the prompt and exact
   output paths. Set both to IN PROGRESS before launching. Optionally also launch `animator`
   for `style-sample` if the period needs new costumes.
5. When they return, update the dashboard (deliverables, AWAITING REVIEW/COMPLETED, issues),
   then continue the pipeline as far as it can go without user approval (script → fact-check →
   QC), and stop at approval checkpoint 1.
6. Report to the user: what each agent produced (paths), dashboard summary, and the approval
   you need (ask with AskUserQuestion when ready).
