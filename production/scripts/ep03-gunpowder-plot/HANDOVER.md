# Episode 3 production handover

## Working preference
Remind the user to start a fresh chat with this handover at the end of each production stage, and sooner if the chat gets long. Update this file first. Use targeted file reads and avoid repeatedly reading the full conversation or studio documentation. Scheduled background checks are unnecessary for this conversational preference.

## Project
The Human Story, Episode 3, The Gunpowder Plot. Target 12:00, 1920×1080, 30 fps. Engine at the-human-story/episode-03-gunpowder-plot. Repository branch claude/trusting-ritchie-6pgxw7. Publish manually after approval.

## Decisions
Keep series stick figures, palette and top-left logo. User requested better text clearance, more natural movement, visible hair on women and richer staging close to existing style. Parish street sample demonstrates caption band, planted steps, a woman with a bun and motivated gestures.
User approved the revised 37-second bm_george narrator sample. Use speed 0.99, connected sentence groups and 0.21-second group gaps.

## Files
- production/scripts/ep03-gunpowder-plot/episode-03-script.md
- production/scripts/ep03-gunpowder-plot/production-notes.md
- production/audio/ep03-gunpowder-plot/voice-direction.md
- production/reports/approvals/ep03-gunpowder-plot/narrator-sample.md
- Engine research/episode-draft.json, scripts/voice_sample.py and src/scenes/ParishStreet.tsx.

## Start here in the next chat

**Copy/paste:** “Continue The Human Story Episode 3 from this handover. Carry forward the approvals and work autonomously through the next production stage. Show me the finished episode for approval before I publish it.”

Use the existing checkout if available. Its former absolute path was `/workspace/scratch/9f6f6ca06ba6/Claude`. In a fresh workspace, clone `https://github.com/craigwaters1986-ux/Claude.git` and import the accompanying incremental Git bundle. The remote branch predates the Episode 3 work. After cloning, run `git bundle verify /path/to/episode-03-handover.bundle`, then `git fetch /path/to/episode-03-handover.bundle HEAD:refs/heads/episode-03-handover` and `git switch episode-03-handover`. Keep generated audio, weights and video out of Git.

## How to make decisions without stopping

- Choose routine shot design, scene order within chapters, cast details, caption placement, music levels, technical fixes, naming and timing adjustments. Make reversible changes and keep moving. Fix issues you find and rerender the affected section.
- The sample voice is approved. Do not ask the user to choose a voice, speed, engine or animation style again. The parish clip is the working visual reference. The next conversation can develop the remaining scenes immediately.
- Keep the documentary historically grounded. Use the existing source trail, verify new historical claims as needed and distinguish unknowns from established facts. For disputed pronunciation use evidence when available, and record unresolved choices in QC. Preserve the historical spellings in text and captions.
- Ask only for an actual scope change, a decision genuinely needed to proceed, or an external publishing/destructive action. Work on everything else while waiting. Give the user a reviewable MP4 and pack before requesting final approval. Publishing is manual.
- At each major milestone update this handover, note what is verified, then remind the user that a fresh chat can resume from it. Use the handover and relevant files instead of traversing the whole conversation.

## Latest verified checkpoint

The full raw voice render finished. `output/full-voice/narration-draft.wav` is **564.360708 seconds (9:24.36)**. The accompanying `narration-draft-audit.json` records text, phonemes and raw start/end times for 29 groups. These outputs are local and ignored by Git. The full audio has not had a continuous listening or name QC pass. The renderer and narrator sample approval are included in the bundle. The approved sample was 37 seconds. The parish proof was 8 seconds and silent.

One timing implication matters: the rough chapter durations in the script are editorial targets, not recording timestamps. The raw voice is about 2:36 short of twelve minutes. Reconcile this with justified visual beats and additional verified narrative where needed. Do not slow the whole voice or pad chapter ends with dead air. Keep the approved connected delivery and lock clock timing after the narrative edit.

## Restart commands and dependencies

- Video engine: install from the engine directory with `npm ci`, then validate with `npx tsc --noEmit`. Package scripts include `npm run studio` and `npm run sample`. Set `REMOTION_BROWSER` to a valid Chrome Headless Shell path if the default browser path is absent. Set `TMPDIR` to a writable scratch directory when needed. Only the parish comp exists so far. Add a full episode composition and render in resumable chunks if resource limits require.
- Voice: use the tested Python 3.12 environment with CPU PyTorch, Kokoro 0.9.4, soundfile, phonemizer and espeakng-loader. In the original scratch workspace the Python is `voice-pt/bin/python` and the assets directory is `voice-assets`. On a new machine the model files are `config.json`, `kokoro-v1_0.pth` and `voices/bm_george.pt` from the official hexgrad/Kokoro-82M repository. Place the voice pack at `bm_george.pt` beside the weights and config. Use the local PyTorch runtime, with HF_HUB_OFFLINE and TRANSFORMERS_OFFLINE set to 1 for rendering.
- From the engine directory use `python scripts/voice_sample.py --assets /path/to/voice-assets --output output/full-voice --episode research/episode-draft.json`. Use a new output directory when the text, pronunciation, rate or grouping changes. The per-phrase cache is positional and otherwise can reuse old audio.

## Remaining production sequence

1. Review the pronunciation audit, resolve the remaining names where possible and check the actual rendered speech. The voice direction lists Catesby, Fawkes, Warwickshire, Hoxton and Salisbury overrides. Monteagle, Knyvett, Holbeach, Cecil, Tresham and Ralph Ewens still need attention. Cambridge gives the British place-name Holbeach as HOL-beach. Treat applicability to the Staffordshire house as a separate check.
2. Lock edited narration, chapter markers and captions from the actual audio. Use the letter, Commons Journal and thanksgiving law as recurring visual anchors. Depict the conspiracy and arrest at a historical level. Use non-graphic visuals for sensitive events.
3. Extend the parish sample into scene-specific animation. Reuse its logo, caption band, character rigs and anchored steps. Plan reactions through gaze, weight shift and gesture. Give women visible period hair or a visible hairline under headwear. Leave captions and the logo their own space. Check labels throughout camera moves against the longest caption.
4. Render the episode to 12:00 at 1920×1080, 30 fps, H.264 with AAC. Verify duration, caption sync, title and label clearance, motion, audio balance and silence. Watch and listen where possible and distinguish visual samples from continuous playback.
5. Supply the MP4, thumbnail, upload-ready subtitles, publishing copy and QC notes. Ask for final approval at that point.
