# Episode 3 concise handover

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

## Current work
Full narration draft is rendering with local PyTorch Kokoro, using the same weights and voice. This avoids the ONNX runtime whose external telemetry connection was rejected. Log at /workspace/scratch/9f6f6ca06ba6/full-voice.log. Output in engine output/full-voice. At this checkpoint process session 90687 was active. Check actual files and process status before restarting. Audio phrase cache is indexed by sequence number, so invalidate cache if wording changes.

## Pending
Verify remaining name pronunciations, inspect full audio and natural duration, then fit a complete 12-minute edit without excessive silence. Build remaining scenes and captions. Only the parish sample is animated. Full episode, mix, QC and publishing pack remain.
