# The Human Story · Episode 3 handover
Updated 18 November 2026 · The Gunpowder Plot: The Letter That Changed the Fifth of November

## Start here

Attach this handover and the original `episode-03-handover.bundle` to a fresh chat. Say: “Continue The Human Story Episode 3 from the attached handover. Work through the next production stage and update the handover before you finish. Show me the finished episode and publishing pack for approval.”

**Finish condition.** Deliver a reviewable 12:00 H.264/AAC MP4 at 1920×1080, 30 fps, with thumbnail, upload-ready subtitles, publishing copy and QC notes. Craig publishes manually after final review.

**Next action.** Check for the full narration WAV and group audit in the current checkout. If they are absent, regenerate them with the command below. Listen for names and delivery, then edit the recording and storyboard together to reach 12:00. The only implemented animation is the eight-second silent ParishStreet sample.

**How to use context.** Read this section first, then open the specific files for the stage in progress. Use the machine-readable script and audit for text and timings. Open only the sections or lines needed. Preserve decisions and verification in this document rather than carrying chat history into the next session.

## Restore the source

The original attachment is an incremental Git bundle. A direct clone of the bundle fails because it needs the GitHub repository's base commit. The following recovery was verified in a fresh workspace.

```bash
git clone https://github.com/craigwaters1986-ux/Claude.git Claude
cd Claude
git bundle verify /absolute/path/to/episode-03-handover.bundle
git fetch /absolute/path/to/episode-03-handover.bundle HEAD:refs/heads/episode-03-handover
git switch episode-03-handover
```

| Identifier | Value |
| --- | --- |
| Original handover commit | `d857bdb4a5f47e1c7b7d83216a7f607ff596992c` |
| Required base commit | `f9f6f636230e4a863724896ba1a865581ec25c9f` |
| Original bundle SHA-256 | `c865c329ff98acad1033cd46c73ad7ff32d6fe03600a8bb33503fee060dd15f0` |
| Engine | `the-human-story/episode-03-gunpowder-plot` |
| Production script directory | `production/scripts/ep03-gunpowder-plot` |

If the updated branch `episode-03-handover` is available on origin, use it directly. If restoring only from the original bundle, apply the browser portability fix below as needed. The restored commit has the approved voice settings and visual sample. The handover references a standalone narrator approval report that is absent from the checkout. The approval is recorded explicitly in the original `HANDOVER.md`.

## Established decisions

- Keep the series stick figures, muted palette, ink outlines and top-left logo. Keep x < 170 and y < 150 clear around the logo. Picture and labels stay above y=916 when captions are active. Check moving labels against faces, props and the longest cues.
- Follow the parish proof for naturally motivated gestures and planted feet. Lead reactions with gaze, then head and weight shift, then the arm. Give recurring women visible hair or a visible hairline under period headwear. The parish woman has a chestnut bun.
- Craig approved the revised 37-second British Kokoro `bm_george` sample. Use connected sentence groups, speed 0.99, 0.21 seconds between groups and 0.34 seconds between sections. The draft JSON's `baseSpeed` is older metadata. The renderer uses the approved speed.
- Keep historical spelling in captions. Distinguish what the surviving documents show from speculation about who wrote the letter. Use non-graphic depictions. Make routine editorial and production decisions without another approval round. Ask for final approval with the finished review deliverables.

## Narration restart and QC

The prior workspace measured the raw draft at 564.360708 seconds across 29 groups. The WAV and audit were ignored by Git and absent from the fresh checkout. A same-settings rebuild was started on 18 November. Confirm its actual outputs and duration before using that measurement for timing. Finishing a render does not establish pronunciation or listening QC.

From the engine directory, install and run with Python 3.12. Put the environment and weights beside the repository, with `../../..` pointing to that parent. The CPU backend keeps this on PyTorch and uses local model files.

```bash
uv venv ../../../voice-pt
uv pip install --python ../../../voice-pt/bin/python --torch-backend cpu \
  kokoro==0.9.4 torch==2.15.0+cpu soundfile==0.14.0 phonemizer==3.6.0 espeakng-loader==0.2.4
mkdir -p ../../../voice-assets
for item in config.json kokoro-v1_0.pth voices/bm_george.pt; do
  curl -fL --retry 2 "https://huggingface.co/hexgrad/Kokoro-82M/resolve/main/$item" \
    -o "../../../voice-assets/${item##*/}" || break
done
HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 ../../../voice-pt/bin/python scripts/voice_sample.py \
  --assets ../../../voice-assets --output output/full-voice \
  --episode research/episode-draft.json > ../../../full-voice.log 2>&1
```

| Model file | SHA-256 of the copy used in the rebuild |
| --- | --- |
| `config.json` | `5abb01e2403b072bf03d04fde160443e209d7a0dad49a423be15196b9b43c17f` |
| `kokoro-v1_0.pth` | `496dba118d1a58f5f3db2efc88dbdc216e0483fc89fe6e47ee1f2c53f18ad1e4` |
| `bm_george.pt` | `f1bc812213dc59774769e5c80004b13eeb79bd78130b11b2d7f934542dab811b` |

Resume an interrupted render in the same output directory only with identical inputs and settings. The cache uses numbered phrase WAVs. Use a fresh output directory whenever text, grouping, pronunciation, speed, model or voice settings change. Check the log and existing files before launching another process. The complete render writes `output/full-voice/narration-draft.wav` and `narration-draft-audit.json`; the audit records the text, phonemes, time boundaries and section for each phrase group. Group timings are useful for the edit, but individual caption cues need alignment to the recorded words.

Existing phoneme overrides cover Catesby, Guy Fawkes, Warwickshire, Hoxton and Salisbury. Listen to Monteagle, Knyvett, Holbeach House, Cecil, Tresham and Ralph Ewens. Cambridge gives UK Cecil as /ˈses.əl/. Its Holbeach entry is for the place name, so confirm the Staffordshire house separately if possible. Record choices and evidence where available, and label unresolved pronunciations. Inspect audio from the rendered groups before deciding to change an override.

## Edit and picture

Use the source trail in `production-notes.md` whenever factual copy changes. The three central records are the Monteagle letter, Commons Journal and annual thanksgiving law. The approximate 2:36 gap between the raw read and the twelve-minute target needs motivated visual sequences and, where needed, verified narrative. Preserve delivery speed and fit the edit to an actual measured timeline. Establish chapter markers after recording, then time captions and picture to the locked edit.

| Chapter | Visual anchors for the next storyboard pass |
| --- | --- |
| A letter meant for the fire | Anonymous letter opens the film. Establish the absence of a signature and the warning to miss Parliament. |
| A new king | Distinguish the two crowns, then take the story down to street level with the parish family and church bell. |
| The man behind the plot | Establish Catesby and Fawkes in separate shots. Use Parliament and the Midlands to explain the stakes at a historical level. |
| Ten days before Parliament | Show the letter moving from Monteagle to Cecil. Return to the surviving page and treat authorship as unresolved. |
| Two names in the record | Transition from Westminster to the Commons Journal. Let the viewer read “Johnson” before connecting the name to Fawkes. |
| After the arrest | Track the investigation and flight across a map. Use documents for the interrogation and aftermath. |
| Who had to answer for it? | Stage the trial and its consequences through the courtroom, oath and household. |
| How a date became a tradition | Move from the act and church reading to commemoration, then return to the surviving letter. |

## Build and verify

| File | Purpose |
| --- | --- |
| `production/scripts/ep03-gunpowder-plot/episode-03-script.md` | Editorial script and provisional chapter timings |
| `production/scripts/ep03-gunpowder-plot/production-notes.md` | Visual direction and research trail |
| `production/audio/ep03-gunpowder-plot/voice-direction.md` | Approved voice direction and pronunciation reference links |
| `research/episode-draft.json` under the engine | Eight sections and renderer narration input |
| `scripts/voice_sample.py` under the engine | Sample and full voice renderer |
| `src/index.tsx` and `src/scenes/ParishStreet.tsx` under the engine | Composition entry and existing staging reference |
| `src/components/CaptionBand.tsx`, `ChannelLogo.tsx` and `src/characters/` under the engine | Caption layout, branding and reusable figure rigs |

`npm ci` and `npx tsc --noEmit` passed in the fresh checkout. System Chromium failed to launch because this runtime denies the socket operation it attempted. The original config hard-coded a Chrome Headless Shell path that this workspace did not have. For portability, call `Config.setBrowserExecutable(process.env.REMOTION_BROWSER)` only when that environment variable is set. Otherwise let Remotion manage its supported browser. Use a writable `TMPDIR` and set `REMOTION_BROWSER` to a known compatible binary if automatic setup is unavailable. Render a parish still at frame 140 and the full 240-frame proof before relying on a new renderer for the episode.

Build the remaining compositions using the existing rigs. Render and QC in chunks if needed. Check final codec, dimensions, 30 fps and 720.000-second duration with ffprobe. Verify caption sync and clearance, character motion, labels, levels and silence, and watch and listen in full before calling the episode ready. Keep generated media, model weights and dependency folders out of Git.

## Maintain this checkpoint automatically

Update this document at each production milestone and before ending a session. Put the next actionable step and current verification at the top. Replace obsolete in-progress notes once a result is verified. Record the source revision, file locations, exact restart commands, outstanding decisions and any non-reproducible media that must travel with the handover. Keep the full reference detail here and the chat summary short.

Commit the source handover with related changes on the dedicated episode branch and push it when authenticated Git access is available. Keep a current copy of this document available to attach to the next chat. If Git push is unavailable, provide a verified incremental bundle containing the new source changes whenever this handover alone cannot reproduce them. Mention the fresh-chat option at each milestone.
