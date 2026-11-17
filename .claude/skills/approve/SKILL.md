---
name: approve
description: Record the user's approval decision at a production checkpoint (script, style, storyboard, final-render) for Stick Figure History.
argument-hint: <script|style|storyboard|final-render> [approved|changes] [episode-id] [note]
disable-model-invocation: true
---

The user is recording an approval decision: **$ARGUMENTS**

1. Parse the checkpoint (script, style, storyboard, final-render), the decision (default:
   approved; "changes" → CHANGES_REQUESTED), the episode (default: active) and any note.
2. Run `python3 production/tools/status.py approval <checkpoint> --episode <id> --state <APPROVED|CHANGES_REQUESTED> --note "<note>"`.
3. If approved, act as the Director and start the tasks this approval unblocks (see
   `production/WORKFLOW.md`), running independent ones in parallel. If changes were requested,
   delegate the revision to the responsible agent with the user's note.
4. This is never approval to upload or publish — publishing is always done by the user.
