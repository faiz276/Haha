# island-short

A 67-second vertical explainer ("Why does everything keep getting more expensive? One tiny island explains it."),
built in the style of the Knox Clips shorts: 2D cutout characters inside a real 3D set, whip-pan and
dissolve transitions, word-by-word captions, CPU-only voiceover.

Everything is code — no image generation, no stock footage.

| Step | File | What it does |
| --- | --- | --- |
| Script | `script.json` | One entry per narrated sentence. Each sentence is one shot. |
| Voice + captions | `tts.py` | Kokoro (CPU) narration, then faster-whisper word timings → `build/timings.json` |
| Picture | `web/main.js`, `web/art.js` | Three.js world + canvas-drawn characters and props. Every frame is a pure function of time. |
| Render | `render.mjs` | Headless Chrome renders each frame and pipes it to ffmpeg → `build/video.mp4` |
| Sound | `mix.mjs` | Narration + music + spot effects → `out/island-inflation-short.mp4` |

## Run

```sh
npm install
uv venv .venv && uv pip install --python .venv/bin/python kokoro-onnx soundfile faster-whisper
# Kokoro model files (kokoro-v1.0.onnx, voices-v1.0.bin) from
# https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
.venv/bin/python tts.py /path/to/models am_michael 1.08
node render.mjs --sheet --scale 0.5      # one still per shot in build/stills (fast check)
node render.mjs                          # full 1080x1920 render, ~1.2 s per frame on 2 CPUs
node mix.mjs
```

To make a new video: rewrite `script.json`, add one `S.<id>` shot function per sentence in `web/main.js`,
rerun the four steps.

## Credits

- Music: "Easy Lemon" Kevin MacLeod (incompetech.com), licensed under Creative Commons: By Attribution 4.0
  (http://creativecommons.org/licenses/by/4.0/). **This credit must appear in the video description when publishing.**
- Sound effects: Kenney RPG Audio, artisticdude "Swishes", rubberduck "40 CC0 water/splash" — all CC0.
- Fonts: Nunito, Archivo Black (SIL OFL, licences in `web/fonts`).
- Audio and fonts were taken from the asset library of https://github.com/kaomei/stickman-video-director.
- Voice: Kokoro-82M (Apache-2.0) via kokoro-onnx.
