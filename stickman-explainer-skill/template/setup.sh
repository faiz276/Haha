#!/usr/bin/env bash
# One-time setup. Safe to re-run. Needs: node >= 18, python >= 3.10, ffmpeg, Chrome/Chromium, ~600 MB disk.
set -euo pipefail
cd "$(dirname "$0")"

for t in node npm ffmpeg python3 curl; do command -v "$t" >/dev/null || { echo "MISSING: $t — install it first"; exit 1; }; done

npm install --no-audit --no-fund

if command -v uv >/dev/null; then
  [ -d .venv ] || uv venv -q .venv
  uv pip install -q --python .venv/bin/python kokoro-onnx soundfile faster-whisper numpy
else
  [ -d .venv ] || python3 -m venv .venv
  .venv/bin/pip install -q kokoro-onnx soundfile faster-whisper numpy
fi

mkdir -p models
REL=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -s models/kokoro-v1.0.onnx ] || curl -fL --retry 3 -o models/kokoro-v1.0.onnx "$REL/kokoro-v1.0.onnx"
[ -s models/voices-v1.0.bin ] || curl -fL --retry 3 -o models/voices-v1.0.bin "$REL/voices-v1.0.bin"

CHROME_BIN="${CHROME:-}"
for c in google-chrome google-chrome-stable chromium chromium-browser; do [ -n "$CHROME_BIN" ] || CHROME_BIN="$(command -v "$c" || true)"; done
if [ -z "$CHROME_BIN" ] && [ ! -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  echo "No Chrome found. Install one with:  npx --yes @puppeteer/browsers install chrome@stable"
  echo "then export CHROME=<path it prints> before running render.mjs"
  exit 1
fi
echo "setup ok"
