---
name: production-status
description: Show the Stick Figure History production dashboard — every agent's task, status, dependencies, deliverables, open issues, next action and pending approvals. Use when the user asks "Director, show me the progress", "what's the status", or runs /production-status.
argument-hint: [episode-id]
---

Run `python3 production/tools/status.py show` (add `--episode <id>` if one was given:
$ARGUMENTS) and read `production/reports/approvals.md`. Summarise for the user, grouped by agent:
- task and status (NOT STARTED / IN PROGRESS / BLOCKED / AWAITING REVIEW / COMPLETED)
- dependencies still outstanding
- completed deliverables (paths)
- outstanding issues
- next action

Then list approvals waiting for the user and the single most useful next step.
Be truthful: only say an agent is "working" if a background agent you launched is still
running in this session. Otherwise say the task is waiting, blocked or not started.
