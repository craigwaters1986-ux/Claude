# Prompt for the next session (Episode 4, after the John North render)

Paste everything below the line into a new Claude Code session on the repository `craigwaters1986-ux/Claude`.

---

Director: continue **ep04-lincoln** from branch `claude/sweet-einstein-gtzfnt` (fetch it and branch from it).

**State (21 November 2026):** render 3 is finished and QC'd: John North narration (ElevenLabs `7rQX8r6PVq3gfJ8rZzyE`, tempo 1.04) and the family-review picture fixes (quill, horse and brougham, Booth's shooting shown without blood, Lincoln carried by lit characters). QC report: `production/reports/qc/ep04-lincoln/qc-final-render-2026-11-21-john-north.md`. Read the last section of `production/scripts/ep04-lincoln/HANDOVER.md` first. **Approval 4 is PENDING.** The rendered MP4s are not in Git: if you need them, rebuild with the "Restore the working state" steps in HANDOVER.md (narration takes in `production/audio/ep04-lincoln/elevenlabs-groups-john-north/`; do not regenerate any ElevenLabs audio).

**Your job:**
1. If I write "approved": record it with
   `python3 production/tools/status.py approval final-render --episode ep04-lincoln --state APPROVED --note "<my words>"`,
   then commit and push.
2. If I send changes: plan them, fix them, re-render only the chunks the changed shots touch (`Shots` start/end in frames ÷ 1800), and re-run QC on the delivered file. Then send me the 1080p file and the iPhone copy, and stop at Approval 4 again.
3. Publishing: walk me through uploading by hand with `production/exports/ep04-lincoln/youtube/` (publishing pack, chapters, thumbnail, checklist). Keep the synthetic-voice disclosure and don't register the music in Content ID. **Never upload or publish anything yourself.**

**Token rules (CLAUDE.md model policy):** hand mechanical work (downloads, renders and their monitoring, ffprobe/loudness/freeze/sync measurements, iPhone copies, document and dashboard housekeeping) to a `haiku` subagent with a tight prompt, and use `sonnet` for reviews. Keep the main model for creative and debugging decisions. Keep this session to one phase.
