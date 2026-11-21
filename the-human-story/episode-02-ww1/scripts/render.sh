#!/usr/bin/env bash
# Episode 2 (ep02-ww1) final render (video-editor). Lean mode v2 (#15-16): <= 900-frame chunks, resumable.
#   bash scripts/render.sh                 full render: 24 chunks of 900 frames (resumable) -> concat -> mux -> checks
#   TEST=2700-2729 bash scripts/render.sh  smoke test on one small frame range (writes to output/test/)
# Run the full render as a tracked background task (run_in_background, 2 h); when a slot ends, relaunch the
# same command: finished chunks are skipped (a chunk is only moved into place once complete).
# Video: muted JPEG-frame chunks, concurrency 4, H.264 yuv420p; audio: public/audio/mix.wav -> AAC 192k.
set -euo pipefail

ENGINE="$(cd "$(dirname "$0")/.." && pwd)"
STUDIO="$(cd "$ENGINE/../.." && pwd)"
EP=ep02-ww1
VID="$STUDIO/production/video/$EP"
LOG="$VID/render.log"
PREV="$VID/previews"
CONC="${CONCURRENCY:-4}"
mkdir -p "$VID" "$PREV"
cd "$ENGINE"

log() { echo "[$(date '+%F %T')] $*" | tee -a "$LOG"; }

# 900-frame chunks: c00 0-899 ... c23 20700-21599 (30 fps; 720 s = 21,600 frames)
TOTAL_FRAMES=21600
CHUNK=900
SECTIONS=()
for ((i=0; i*CHUNK<TOTAL_FRAMES; i++)); do
  a=$((i*CHUNK)); b=$((a+CHUNK-1)); ((b>=TOTAL_FRAMES)) && b=$((TOTAL_FRAMES-1))
  SECTIONS+=("$(printf 'c%02d' "$i") $a $b")
done

if [[ -n "${TEST:-}" ]]; then
  A="${TEST%-*}"; B="${TEST#*-}"
  SECTIONS=("test $A $B")
  TOTAL_FRAMES=$((B - A + 1))
  OUTDIR="$ENGINE/output/test"
  FINAL="$OUTDIR/test-$A-$B.mp4"
  AUDIO_SS=$(python3 -c "print($A/30)")
  PREV="$OUTDIR/previews"; mkdir -p "$PREV"
else
  OUTDIR="$ENGINE/output"
  FINAL="$OUTDIR/episode-02-ww1.mp4"
  AUDIO_SS=0
fi
CHUNKS="$OUTDIR/chunks"
mkdir -p "$CHUNKS"
DUR=$(python3 -c "print(f'{$TOTAL_FRAMES/30:.3f}')")

log "=== render start ($EP) frames=$TOTAL_FRAMES dur=${DUR}s concurrency=$CONC ==="
LIST="$CHUNKS/list.txt"; : > "$LIST"
for s in "${SECTIONS[@]}"; do
  read -r name a b <<<"$s"
  out="$CHUNKS/$name.mp4"
  if [[ -s "$out" ]]; then
    log "skip $name ($a-$b): already rendered"
  else
    log "render $name frames $a-$b"
    t0=$(date +%s)
    npx remotion render src/index.ts Episode "$CHUNKS/$name.part.mp4" \
      --frames="$a-$b" --muted --concurrency="$CONC" --image-format=jpeg --jpeg-quality=92 \
      --codec=h264 --pixel-format=yuv420p --crf=15 --log=error >>"$LOG" 2>&1
    mv "$CHUNKS/$name.part.mp4" "$out"
    log "done $name in $(( $(date +%s) - t0 )) s"
  fi
  echo "file '$out'" >> "$LIST"
done

# Remotion's JPEG frames come out as full-range yuvj420p; the concat pass converts once to
# broadcast-range yuv420p (one x264 pass over the joined chunks; ~1-2x real time on 4 cores).
log "concatenate chunks + convert to yuv420p (tv range)"
ffmpeg -y -v error -f concat -safe 0 -i "$LIST" -vf "scale=in_range=full:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset medium -crf 18 -profile:v high -color_range tv -r 30 "$OUTDIR/video-only.mp4" >>"$LOG" 2>&1

if [[ ! -s public/audio/mix.wav ]]; then
  log "STOP: public/audio/mix.wav is missing (audio engineer). Video chunks are kept; re-run once the mix exists."
  exit 1
fi
log "mux public/audio/mix.wav as AAC 192k"
ffmpeg -y -v error -i "$OUTDIR/video-only.mp4" -ss "$AUDIO_SS" -t "$DUR" -i public/audio/mix.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -t "$DUR" -movflags +faststart "$FINAL" >>"$LOG" 2>&1

log "ffprobe report"
REPORT="$VID/ffprobe-report.txt"; [[ -n "${TEST:-}" ]] && REPORT="$OUTDIR/ffprobe-report.txt"
{
  echo "file: $FINAL"
  ffprobe -v error -show_entries format=duration,size,bit_rate -of default=nw=1 "$FINAL"
  ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,profile,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_frames -of default=nw=1 "$FINAL"
  ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels,bit_rate -of default=nw=1 "$FINAL"
} > "$REPORT"
cat "$REPORT" | tee -a "$LOG"

# pass/fail on the technical targets
python3 - "$REPORT" "$DUR" <<'PY' | tee -a "$LOG"
import sys, re
txt = open(sys.argv[1]).read(); want = float(sys.argv[2])
g = lambda k: (re.findall(rf'^{k}=(.*)$', txt, re.M) or [''])
dur = float(g('duration')[0] or 0)
codecs = g('codec_name')
checks = {
  f'duration {dur:.3f}s == {want:.3f}s (±0.05)': abs(dur - want) <= 0.05,
  'resolution 1920x1080': g('width')[0] == '1920' and g('height')[0] == '1080',
  'frame rate 30/1': g('r_frame_rate')[0] == '30/1',
  'video h264 yuv420p': codecs[0] == 'h264' and g('pix_fmt')[0] == 'yuv420p',
  'audio aac present': len(codecs) > 1 and codecs[1] == 'aac',
}
for k, v in checks.items(): print(('PASS ' if v else 'FAIL ') + k)
print('RESULT: ' + ('ALL PASS' if all(checks.values()) else 'FAILED'))
PY

log "blackdetect / freezedetect"
QC="$VID/qc-detect.log"; [[ -n "${TEST:-}" ]] && QC="$OUTDIR/qc-detect.log"
ffmpeg -hide_banner -nostats -i "$FINAL" -vf "blackdetect=d=0.5:pix_th=0.10,freezedetect=n=0.003:d=2" -an -f null - 2>&1 \
  | grep -E "black_start|freeze_start|freeze_duration|freeze_end" > "$QC" || true
log "black segments: $(grep -c black_start "$QC" || true); frozen segments: $(grep -c freeze_start "$QC" || true) (details: $QC)"
cat "$QC" >> "$LOG"

log "preview frames every 30 s -> $PREV"
end=$(python3 -c "print(int($TOTAL_FRAMES/30))")
step=30; [[ -n "${TEST:-}" ]] && step=1
for ((t=0; t<end; t+=step)); do
  ffmpeg -y -v error -ss "$t" -i "$FINAL" -frames:v 1 -vf scale=960:-2 -q:v 3 "$PREV/$(printf '%03d' $((t + ${AUDIO_SS%.*})))s.jpg" || true
done
log "=== render finished: $FINAL ==="
