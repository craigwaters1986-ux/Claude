#!/usr/bin/env bash
# Episode 3 final render: 12 chunks of 1800 frames (resumable; a chunk is kept only once complete),
# concatenated without re-encoding, then muxed with public/audio/mix.wav (AAC 192k).
#   bash scripts/render.sh video   render the missing chunks and concatenate -> output/episode-03-video.mp4
#   bash scripts/render.sh mux     mux the video with the mix -> output/episode-03-gunpowder-plot.mp4
set -euo pipefail
ENGINE="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ENGINE"
CH=output/chunks; mkdir -p "$CH"
TOTAL=21600; CHUNK=1800; CONC="${CONCURRENCY:-4}"
if [[ "${1:-video}" == video ]]; then
  : > "$CH/list.txt"
  for ((i=0; i*CHUNK<TOTAL; i++)); do
    a=$((i*CHUNK)); b=$((a+CHUNK-1)); n=$(printf 'c%02d' "$i")
    if [[ ! -s "$CH/$n.mp4" ]]; then
      echo "[$(date +%T)] render $n $a-$b"
      npx remotion render src/index.tsx Episode "$CH/$n.part.mp4" --frames="$a-$b" --muted --concurrency="$CONC" \
        --codec=h264 --pixel-format=yuv420p --crf=17 --log=error
      mv "$CH/$n.part.mp4" "$CH/$n.mp4"
    fi
    echo "file '$n.mp4'" >> "$CH/list.txt"
  done
  ffmpeg -v error -y -f concat -safe 0 -i "$CH/list.txt" -c copy output/episode-03-video.mp4
  echo "[$(date +%T)] video done"
else
  ffmpeg -v error -y -i output/episode-03-video.mp4 -i public/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy \
    -c:a aac -b:a 192k -ar 48000 -movflags +faststart -t 720 output/episode-03-gunpowder-plot.mp4
  echo "muxed"
fi
