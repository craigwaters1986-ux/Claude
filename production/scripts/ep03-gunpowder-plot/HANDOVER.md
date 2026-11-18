# The Human Story · Episode 3 handover
Updated 18 November 2026 · The Gunpowder Plot: The Letter That Changed the Fifth of November

## Start here

Attach this handover and `episode-03-checkpoint.zip` to a fresh chat. Say: “Continue The Human Story Episode 3 from the attached handover. Work through the next production stage and update the handover before you finish. Show me the finished episode and publishing pack for approval.”

**Finish condition.** Deliver a reviewable 12:00 H.264/AAC MP4 at 1920×1080, 30 fps, with thumbnail, upload-ready subtitles, publishing copy and QC notes. Craig publishes manually after final review.

**Next action.** Open the full narration WAV and group audit in `checkpoint/media/`. Listen for names and delivery, then edit the recording and storyboard together to reach 12:00. The only implemented animation is the eight-second silent ParishStreet sample, included in the checkpoint.

**How to use context.** Read this section first, then open the specific files for the stage in progress. Use the machine-readable script and audit for text and timings. Open only the sections or lines needed. Preserve decisions and verification in this document rather than carrying chat history into the next session.

## Restore the source

Unzip the companion checkpoint. It contains the current incremental Git bundle, an Episode 3 source snapshot for offline use, generated review assets, and the local renderer helper. To retain repository history, import the bundled branch into the GitHub checkout. A direct clone of the incremental bundle requires the base commit first. This recovery was verified in a fresh workspace with the original bundle.

```bash
git clone https://github.com/craigwaters1986-ux/Claude.git Claude
cd Claude
git bundle verify /absolute/path/to/checkpoint/episode-03-resume.bundle
git fetch /absolute/path/to/checkpoint/episode-03-resume.bundle HEAD:refs/heads/episode-03-handover
git switch episode-03-handover
```

| Identifier | Value |
| --- | --- |
| Original handover commit | `d857bdb4a5f47e1c7b7d83216a7f607ff596992c` |
| Required base commit | `f9f6f636230e4a863724896ba1a865581ec25c9f` |
| Original bundle SHA-256 | `c865c329ff98acad1033cd46c73ad7ff32d6fe03600a8bb33503fee060dd15f0` |
| Engine | `the-human-story/episode-03-gunpowder-plot` |
| Production script directory | `production/scripts/ep03-gunpowder-plot` |

If GitHub is unreachable, use `source/` inside the checkpoint as the project root for Episode 3. It preserves the engine and production paths. If using the original attachment as a fallback, apply the browser portability fix below as needed. The current handover branch was committed locally. GitHub push failed at the network proxy, so the companion bundle carries the current branch. The restored commit has the approved voice settings and visual sample. The handover references a standalone narrator approval report that is absent from the checkout. The approval is recorded explicitly in the original `HANDOVER.md`.

## Established decisions

- Keep the series stick figures, muted palette, ink outlines and top-left logo. Keep x < 170 and y < 150 clear around the logo. Picture and labels stay above y=916 when captions are active. Check moving labels against faces, props and the longest cues.
- Follow the parish proof for naturally motivated gestures and planted feet. Lead reactions with gaze, then head and weight shift, then the arm. Give recurring women visible hair or a visible hairline under period headwear. The parish woman has a chestnut bun.
- Craig approved the revised 37-second British Kokoro `bm_george` sample. Use connected sentence groups, speed 0.99, 0.21 seconds between groups and 0.34 seconds between sections. The draft JSON's `baseSpeed` is older metadata. The renderer uses the approved speed.
- Keep historical spelling in captions. Distinguish what the surviving documents show from speculation about who wrote the letter. Use non-graphic depictions. Make routine editorial and production decisions without another approval round. Ask for final approval with the finished review deliverables.

## Narration restart and QC

The regenerated draft is **564.368 seconds (9:24.368)** across 29 groups. The WAV is mono, 24 kHz, 16-bit PCM. All eight sections are present, the individual phrase lengths match the audit, and the assembled duration matches the audit plus its final 0.34-second gap. The previous workspace reported 564.360708 seconds. Use the included audit for this recording. Continuous listening and name pronunciation QC are pending.

| Raw section | First speech (s) | Last speech (s) |
| --- | ---: | ---: |
| A letter meant for the fire | 0.000 | 34.371 |
| A new king | 34.711 | 99.195 |
| The man behind the plot | 99.535 | 172.722 |
| Ten days before Parliament | 173.062 | 247.092 |
| Two names in the record | 247.432 | 318.827 |
| After the arrest | 319.167 | 385.907 |
| Who had to answer for it? | 386.247 | 468.139 |
| How a date became a tradition | 468.479 | 564.028 |

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

Use the source trail in `production-notes.md` whenever factual copy changes. The three central records are the Monteagle letter, Commons Journal and annual thanksgiving law. The measured 2:35.632 gap between the raw read and the twelve-minute target needs motivated visual sequences and, where needed, verified narrative. Preserve delivery speed and fit the edit to an actual measured timeline. Establish chapter markers after recording, then time captions and picture to the locked edit.

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

`npm ci` and `npx tsc --noEmit` passed. Remotion downloaded its supported Headless Shell after the browser configuration was made portable. The current workspace also denied Node's network-interface enumeration despite working localhost sockets. The included `tools/remotion-local-interfaces.cjs` supplies the IPv4 loopback interface only if that enumeration fails. It was used to render frame 140 and the full parish proof. The proof was verified as 8.000 seconds, H.264, 1920×1080 at 30 fps. The still was visually checked for caption clearance, logo placement and the visible bun.

For a fresh render, run from the engine. On a host where Node can enumerate interfaces, the preload is optional.

```bash
npm ci
npx tsc --noEmit
mkdir -p /absolute/path/to/checkpoint/render-tmp
TMPDIR=/absolute/path/to/checkpoint/render-tmp \
NODE_OPTIONS=--require=/absolute/path/to/checkpoint/tools/remotion-local-interfaces.cjs \
npx remotion render src/index.tsx ParishStreet output/parish-street.mp4 --concurrency=2
```

If needed, set `REMOTION_BROWSER` to a compatible Headless Shell binary. The system Chromium failed in the current workspace. The target for the episode is an additional full composition, separate from the parish proof.

Build the remaining compositions using the existing rigs. Render and QC in chunks if needed. Check final codec, dimensions, 30 fps and 720.000-second duration with ffprobe. Verify caption sync and clearance, character motion, labels, levels and silence, and watch and listen in full before calling the episode ready. Keep generated media, model weights and dependency folders out of Git.

## Maintain this checkpoint automatically

Update this document at each production milestone and before ending a session. Put the next actionable step and current verification at the top. Replace obsolete in-progress notes once a result is verified. Record the source revision, file locations, exact restart commands, outstanding decisions and any non-reproducible media that must travel with the handover. Keep the full reference detail here and the chat summary short.

Commit the source handover with related changes on the dedicated episode branch and push it when authenticated Git access is available. Keep a current copy of this document available to attach to the next chat. The companion's `tools/package-source.sh REPOSITORY CHECKPOINT_DIRECTORY` regenerates and verifies the Git bundle and source snapshot from the committed branch. Update the media and checksums, then rezip the checkpoint directory. If Git push is unavailable, package the current verified bundle, the Episode 3 source snapshot and any new media needed for the next stage. Mention the fresh-chat option at each milestone.
