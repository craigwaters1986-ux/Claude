# Production workflow — Stick Figure History

## Standard pipeline (one episode)

| # | Task ID | Owner | Depends on | Output |
|---|---|---|---|---|
| 1 | `brief` | director | — | `production/reports/handoffs/<ep>/00-director-brief.md` |
| 2 | `research` | researcher | brief | `production/research/<ep>/research-notes.md`, `sources.md` |
| 3 | `keywords` | youtube-specialist | brief | `production/exports/<ep>/youtube/keywords.md` (runs in parallel with research) |
| 4 | `script` | scriptwriter | research | `production/scripts/<ep>/script.md`, `script.json` |
| 5 | `script-factcheck` | researcher | script | `production/research/<ep>/fact-check-script.md` |
| 6 | `script-qc` | quality-control | script-factcheck | `production/reports/qc/<ep>/qc-script-*.md` |
| ✋ | **Approval 1: script** | user | script-qc | `approvals.md` |
| 7 | `style-sample` | animator | brief | `production/characters/<ep>/style-sample.png` (can start early) |
| ✋ | **Approval 2: character & animation style** | user | style-sample | |
| 8 | `narration` | audio-engineer | approval 1 | narration WAV, `narration.json`, SRT |
| 9 | `storyboard` | storyboard | approval 1 (+ narration timings when ready) | `production/storyboards/<ep>/storyboard.md`, `asset-requests.md` |
| ✋ | **Approval 3: storyboard** | user | storyboard | |
| 10 | `characters` | animator | approvals 2 & 3 | engine code + previews (parallel with 11) |
| 11 | `environments` | environment-designer | approval 3 | engine code + previews (parallel with 10) |
| 12 | `music-sfx` | audio-engineer | storyboard | music + SFX stems (parallel with 10/11) |
| 13 | `assembly` | video-editor | 8, 10, 11, 12 | timeline + preview renders |
| 14 | `final-render` | video-editor | assembly | MP4 + ffprobe report |
| 15 | `final-qc` | quality-control | final-render | `qc-render-*.md` (issues → back to owners) |
| 16 | `publishing-pack` | youtube-specialist | final-qc | title, description, chapters, tags, thumbnail brief, checklist |
| ✋ | **Approval 4: final render** | user | 15, 16 | |
| 17 | `wrap` | director | approval 4 | final report; user publishes manually |

`python3 production/tools/status.py new-episode --episode <ep> --title "<title>"` creates this
task list on the dashboard automatically.

## Who may write where (prevents conflicting edits)

| Area | Owner |
|---|---|
| `production/research/<ep>/` | researcher |
| `production/scripts/<ep>/` | scriptwriter |
| `production/storyboards/<ep>/` | storyboard |
| `production/characters/<ep>/`, `production/animations/<ep>/`, engine `src/characters/` | animator |
| `production/environments/<ep>/`, engine `src/components/{Environment,Effects,Vehicles}.tsx`, `src/maps/` | environment-designer |
| `production/audio/<ep>/`, engine `scripts/*.py`, `public/audio`, `public/sfx` | audio-engineer |
| `production/video/<ep>/`, `production/exports/<ep>/*.mp4`, engine `src/scenes/`, `src/Root.tsx`, `src/components/{Camera,Text}.tsx` | video-editor |
| `production/reports/qc/<ep>/` | quality-control |
| `production/exports/<ep>/youtube/`, `production/thumbnails/<ep>/` | youtube-specialist |
| `production/tools/status.json`, `production/reports/dashboard.md`, `approvals.md` | director (via `status.py` only) |
| `production/reports/handoffs/<ep>/` | everyone — one new file per handoff, never edit someone else's |

If a task needs a change in another owner's file, the agent writes the request in its handoff
note; the Director assigns it to the owner.

## Handoffs and communication

Subagents report back to the Director when they finish (they cannot interrupt each other mid-task).
Collaboration happens through:
1. **Delegation prompts** from the Director (full context: episode, goal, inputs, outputs, criteria).
2. **Handoff notes** (`production/templates/handoff.md`) — deliverables, decisions, blockers,
   requests for other agents, next action. Named `NN-<agent>-<task>.md`.
3. **The dashboard** — the single source of truth for status, kept by the Director.
4. **QC reports** — issues tagged with the responsible agent; the Director routes them.

## Running the engine (render reference)

Engine: `the-human-story/episode-01-ww2/` (Remotion 4, React, TypeScript, SVG).
```
cd the-human-story/episode-01-ww2
npm install                                   # once per fresh container
python3 scripts/tts.py                        # narration + timings + SRT (needs /opt/tts Kokoro model)
npx tsc --noEmit                              # type-check
npx remotion still src/index.ts <Comp> out.png --frame=N --scale=0.5   # preview still
npx remotion render src/index.ts <Comp> out.mp4 --frames=a-b --muted   # chunk render
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of json out.mp4
```
Kokoro TTS setup (fresh container): `pip install kokoro-onnx soundfile scipy` and download
`model.onnx` + `voices/bm_george.bin` from the HuggingFace repo
`onnx-community/Kokoro-82M-v1.0-ONNX` into `/opt/tts` (see `production/audio/voice-bible.md`).
