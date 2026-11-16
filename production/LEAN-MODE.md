# Lean mode — making the best use of credits (user request, 2026-11-15; v2 2026-11-16)

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
11. **Model policy (approved by the user):** haiku for mechanical tasks, sonnet for routine checks/reviews/YouTube copy (default for quality-control, youtube-specialist, director), main model only for hard creative/technical work — see CLAUDE.md "Model policy".
12. Don't run more than 2–3 agents at once when near the usage limit.

## v2 — lessons from Episode 1's production and render (2026-11-16)
13. **One Director session per phase, ended at the phase's handoff.** Episode 1's main chat ran for
    two days; every turn re-reads the whole conversation, so a long chat is the biggest single cost.
    Phases: (A) research + script → approval; (B) storyboard + style → approval; (C) assets + assembly;
    (D) render + QC + publishing pack → approval. Start each with "Director, continue <episode>".
14. **Smaller storyboard:** ~60 shots for 10 min (Ep1 had 99), each shot ≥ 6 s, reusing library
    scenes/maps/characters first. List only NEW assets as MUST.
15. **Build once, preview once:** one smoke test of the heaviest shot (`TEST=a-b bash scripts/render.sh`),
    then the full render. No per-scene preview renders.
16. **Render in ≤ 900-frame chunks from the start** (Ep1 lost ~1.5 h to 1,800-frame sections cut at
    2-hour background limits). Run it as a tracked background task (`run_in_background`, 2 h), never
    detached with nohup (killed when the idle container sleeps). Relaunch per slot; it resumes.
17. **Quiet repo during long jobs:** live render logs are git-ignored, so the commit-on-stop hook does
    not fire a commit every turn. Commit once at the end with the reports.
18. **No status pings while rendering:** don't ask "how long?" mid-render; the render log and dashboard
    show progress. The Director reports once when a slot ends or the render finishes.
19. **Publishing pack on sonnet, thumbnail with the animator in the same production phase**, so the
    final phase needs only: render → QC (sonnet) → pack → one approval question.
20. **Reuse Episode 1 branding and engine:** copy `the-human-story/episode-01-ww2/` as the new episode's
    engine (keep `node_modules` out of git), and keep shared characters/maps in the library.
