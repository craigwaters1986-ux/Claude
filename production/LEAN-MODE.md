# Lean mode — making the best use of credits (user request, 2026-11-15)

The Director offers this at the start of every new episode and uses it unless the user says otherwise.
Based on Episode 1's actual agent usage: storyboard ~200k tokens; each fact-check ~160k;
each QC review ~90–100k; tests/failed Director test ~300k; the long main chat grows every turn.

## Pipeline changes
1. **Research first, then script.** Researcher writes verified notes + sources; Scriptwriter uses
   only those. No separate post-script fact-check round.
2. **One combined review** of the script: QC checks facts against the research notes and quality
   in a single pass (replaces `script-factcheck` + `script-qc`). Mark `script-factcheck` COMPLETED
   with `--force` and a note "covered by combined QC review".
3. **One researcher**, not parallel splits (parallel saves time, not credits).
4. **Hook sized correctly first time** (scriptwriter memory: words ≈ speech window × ~2.2 wps).
5. **YouTube work once, at the end** — keywords, titles, description, chapters in the publishing pack.
6. **No WIP previews, tests or benchmarks** unless the user asks.
7. **Assets: MUST items only** by default; SHOULD/COULD only on request. Reuse the engine library.
8. **Batch approvals:** style + script together; storyboard decisions in one question round.

## Habits
9. Suggest a **fresh session per phase** (research+script / storyboard / production / render);
   the dashboard, handoffs and agent memory carry context across.
10. Point the user to `production/reports/dashboard.md` for free progress checks.
11. Optional (user approval needed): lighter model (`model: sonnet`) for youtube-specialist and
    small re-checks.
12. Don't run more than 2–3 agents at once when near the usage limit.
