# STICK FIGURE HISTORY — Production Studio Rules

This repository is the production studio for **Stick Figure History**, a YouTube channel of
animated historical documentaries. These rules are permanent and apply to every episode,
every agent and every session.

## Channel identity (never changes)

- **Channel:** STICK FIGURE HISTORY — "History is made by people."
  (Renamed from "The Human Story" by the user on 2026-11-17 because other channels share that
  name. The engine folder `the-human-story/` keeps its old name so paths don't break. On-screen
  name text: opening title card, end card, thumbnail badge, banner. The logo has no text.)
- **Format:** animated historical documentaries; default duration **10 minutes (600 s)**.
- **Audience:** roughly 16–55, including people who know little history. Intelligent, never childish.
- **Language:** British English everywhere (narration, captions, on-screen text, metadata).
- **Animation:** simple, expressive 2D stick figures in the style of the reference image
  `production/characters/style-reference.jpg`: big round white heads, thick black outlines,
  thin black limbs, expressive eyes/brows/mouths, flat muted colours, slightly hand-drawn.
  Only clothing, hair, props, scenery and colours change between periods. Never realistic,
  3D, anime or photographic. The full style guide is `production/characters/style-guide.md`.
- **Narration:** one consistent, natural British documentary voice (see `production/audio/voice-bible.md`).
- **Visuals:** genuine continuous movement — walking/talking characters, moving vehicles,
  animated maps, weather and particles. Never a slideshow of still images.
- **Audio:** clear narration on top; subtle, original or properly licensed music underneath; restrained SFX.
- **Text:** clear dates, names, places and short factual labels; readable on a phone.
- **Technical:** 1920×1080, 30 fps, H.264 + AAC MP4, synchronised SRT subtitles, chapters.
- **Channel logo (user rule, 2026-11-16):** the channel logo (`production/branding/logo-a.png`,
  gold circle with the spiky-haired stick figure) sits in the **top-left corner for the whole
  of every video**, via the engine's `ChannelLogo` overlay (`src/components/ChannelLogo.tsx`,
  104 px at x 32, y 28, top layer). Keep the top-left safe zone (x < 170, y < 150) clear of
  other on-screen text; date cards default to y = 150. QC checks it is present on every shot.

## Accuracy and ethics (non-negotiable)

- Never invent facts, figures or quotations. Every claim must trace to a source in the
  episode's research file. Label estimates as estimates and debates as debates.
- Distinguish long-term causes from triggering decisions; avoid single-cause explanations.
- Atrocities, genocide and civilian suffering: sombre, respectful, non-graphic, no jokes
  or comic SFX. Humour only where historically and emotionally appropriate.
- Extremist symbols only when genuinely necessary, never glorified; clearly label propaganda.
- Fictional illustrative characters are never presented as real people; historical figures carry name tags.
- Only use assets we created or that are properly licensed; record licences in the episode's credits.

## The team (`.claude/agents/`)

| Agent | Role |
|---|---|
| `director` | Head of production, the user's main contact. Plans, delegates, tracks, reports. |
| `researcher` | Research, fact-checking, sources, disputed interpretations. |
| `scriptwriter` | British English narration fitted to the exact duration. |
| `storyboard` | Timestamped scene plans, camera, actions, transitions, on-screen text. |
| `animator` | Characters, rigs, expressions, gestures, period clothing (reference style). |
| `environment-designer` | Backgrounds, maps, borders, troop movements, vehicles, weather. |
| `audio-engineer` | Narration, music, SFX, mixing, ducking, loudness, stems. |
| `video-editor` | Timeline assembly, subtitles, rendering, ffprobe verification. |
| `quality-control` | Independent review; never approves incomplete work. |
| `youtube-specialist` | Titles, descriptions, chapters, thumbnails, keywords, checklists. |

## How the main chat works

The main chat acts as the **Director**. When the user addresses a role ("Researcher, verify
Episode 1", "Audio Engineer, lower the music"), the Director delegates to that subagent with
the Agent tool (`subagent_type` = the agent name), giving full context in the prompt, because
subagents do not see this conversation. Independent tasks may run in parallel; dependent tasks
run in order. Follow `production/WORKFLOW.md` for the standard pipeline.

Delegation always happens from the main chat: subagents here cannot launch other subagents
(no Agent tool inside a subagent — verified 2026-11-15). The `director` subagent can be used
for planning/status and returns ready-to-launch prompts. Custom agents in `.claude/agents/`
load when a session starts; if one is missing in the current session, delegate to
`general-purpose` with the instruction "Read `.claude/agents/<name>.md` and follow it as your role".
Before launching any task set it IN PROGRESS on the dashboard; afterwards record deliverables.

## Credits: Lean mode

At the start of every new episode, offer **Lean mode** (`production/LEAN-MODE.md`) and use it
unless the user declines: research before script, one combined review, YouTube work once at the
end, MUST-only assets, no WIP previews, batched approvals, fresh session per phase.

## Model policy (user instruction: prioritise tokens)

Match the model to the difficulty of each task; pass `model` on the Agent call to override.
- **haiku** — easy/mechanical: status summaries, file housekeeping, copying/syncing files,
  SRT/format checks, ffprobe/loudness measurements, re-checks of a one-line change.
- **sonnet** (default for `quality-control`, `youtube-specialist`, `director`) — routine checks
  and reviews, fact spot-checks, YouTube copy, planning.
- **inherit (main model)** — hard creative/technical work only: research from scratch,
  scriptwriting, storyboard, character/environment/map building, music composition, assembly
  and render debugging.
Keep checks to one pass; no repeated verification loops unless something failed.

## Shared workspace and handoffs

- Episode IDs look like `ep01-ww2`, `ep02-rome`. Each agent works inside
  `production/<area>/<episode-id>/` for its own areas only (ownership table in `production/WORKFLOW.md`).
- Engine code (reusable animation system): `the-human-story/` — `episode-01-ww2/src/` currently
  holds the shared character, environment, map, text and camera libraries.
- Every finished task ends with a handoff note in `production/reports/handoffs/<episode-id>/`
  using `production/templates/handoff.md`: deliverables, blockers, changes, next action.
- **Only the Director updates the dashboard**, using
  `python3 production/tools/status.py` (never hand-edit `status.json`). The rendered dashboard
  is `production/reports/dashboard.md`. Statuses: NOT STARTED, IN PROGRESS, BLOCKED,
  AWAITING REVIEW, COMPLETED.
- Never claim an agent is working unless a real task is running. Never mark work COMPLETED
  without the deliverable existing on disk.
- Two agents must never edit the same file at the same time.

## Approval checkpoints (user sign-off required)

1. Final episode script. 2. Initial character and animation style. 3. Final storyboard before
full production. 4. Final render before publishing. Record each in
`production/reports/approvals.md` (`status.py approve`). Agents may continue independent
preparation while waiting. **Never upload or publish anything automatically.**

## Quality bar before anything is called finished

Exact duration verified with ffprobe; 1920×1080 at 30 fps; narration complete and in sync;
music under narration; captions synced; every scene moving; no blank frames or unexplained
silence; dates and spelling checked; QC report shows no open blocking issues.
