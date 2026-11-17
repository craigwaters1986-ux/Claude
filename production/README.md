# Stick Figure History — operating the production team

## The team
Ten specialist agents live in `.claude/agents/`: director, researcher, scriptwriter,
storyboard, animator, environment-designer, audio-engineer, video-editor, quality-control,
youtube-specialist. Their permanent rules are in `/CLAUDE.md`; the pipeline and file ownership
are in `production/WORKFLOW.md`.

## Talking to the team (main chat = the Director)
Just write naturally in the main chat; the main session acts as Director and delegates:

| You say | What happens |
|---|---|
| "Director, start a new episode about the Roman Empire." | `/new-episode` workflow: episode ID, dashboard, brief, research + keyword research in parallel → script → fact-check → QC → asks for script approval |
| "Researcher, verify the historical facts in Episode 1." | researcher fact-checks `production/scripts/ep01-ww2/` → `production/research/ep01-ww2/fact-check-script.md` |
| "Scriptwriter, make the introduction more engaging." | scriptwriter revises the hook; researcher re-checks facts; you approve |
| "Animator, improve the character movements." | animator edits the engine's character code and renders preview stills |
| "Audio Engineer, lower the background music." | audio-engineer remixes and reports loudness measurements |
| "Quality Control, review the latest render." | `/qc-review render` |
| "Director, show me the progress of every agent." | `/production-status` |
| "Director, finish the current episode." | `/finish-episode` |

Slash commands (project skills in `.claude/skills/`):
- `/new-episode <subject>` — start an episode.
- `/production-status [episode]` — dashboard summary.
- `/approve <script|style|storyboard|final-render> [approved|changes] [episode] [note]` — **only
  you can run this** (the model cannot invoke it), records your sign-off and unblocks work.
- `/qc-review <script|storyboard|audio|render> [episode]` — independent review.
- `/finish-episode [episode]` — drive the remaining pipeline.

## Checking progress
- `production/reports/dashboard.md` — per task: agent, task, status, dependencies, deliverables,
  open issues, next action. `production/reports/approvals.md` — the four checkpoints.
- Terminal: `python3 production/tools/status.py show [--episode ep01-ww2]`.
- Handoff notes from each agent: `production/reports/handoffs/<episode>/`.
- QC reports: `production/reports/qc/<episode>/`.

## How the agents communicate
Hub-and-spoke through the Director plus shared files:
1. Director → agent: a delegation prompt with full context (agents don't see the chat).
2. Agent → Director: its final report + a handoff note file (deliverables, blockers, requests
   for other agents).
3. Director routes requests/QC issues to the right owner and updates the dashboard.
4. Each folder has one owner, so two agents never edit the same file.
Independent tasks run in parallel (e.g. research + keyword research; animator + environment
designer + music after storyboard approval).

## Limitations (verified in this environment, 2026-11-15)
- **New agents load at session start.** Agents created during a session are only available as
  native types in the next session. The workaround (general-purpose agent reading the role file)
  is built into CLAUDE.md.
- **No nested delegation here:** subagents do not get the Agent tool, so the main chat must be
  the Director that launches everyone. The `director` subagent returns delegation plans instead.
- **Agent Teams (experimental) are not enabled.** They need an interactive terminal session,
  are documented for 3–5 teammates (not 10), use substantially more tokens, and support in
  Claude Code on the web is not documented. To try them in a local terminal session, add to
  your *personal* `.claude/settings.local.json`:
  `{"env": {"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"}}` — then ask the lead to create a
  team of 3–5 of these agents. The subagent workflow keeps working either way.
- **Permissions:** no permission rules were added to `.claude/settings.json` (an agent should
  not grant itself permissions). If you want fewer prompts, add allow-rules yourself, e.g. for
  `Bash(python3 production/tools/status.py *)` and `Bash(ffprobe *)`.
- **Voice:** ElevenLabs had 0 credits; the channel voice is local Kokoro `bm_george`
  (see `production/audio/voice-bible.md`). Fresh cloud containers need the model re-downloaded.
- **Publishing:** never automated. You upload and publish.
