# Template project

The complete, working source of the example video ("Why does everything keep getting more
expensive? One tiny island explains it." — 67 s, 1080×1920). Copy this folder for each new video.
The full process is in `../SKILL.md`.

| File | Edit for a new video? | What it is |
| --- | --- | --- |
| `script.json` | **Yes** | One entry per narrated sentence = one shot |
| `audio.json` | **Yes** | Voice, speed, music, sound cues |
| `web/story.js` | **Yes** | Set, cast, props, one shot function per sentence, transitions |
| `web/art.js` | Add to it | Canvas drawing functions for characters and props |
| `web/engine.js` | No | Renderer, sprites, camera, transitions, cards, grading, captions |
| `tts.py` | No | Kokoro narration + word timings → `build/` |
| `render.mjs` | No | Headless Chrome → frames → `build/video.mp4` |
| `mix.mjs` | No | Voice + music + effects → `out/` |
| `setup.sh` | No | Installs dependencies and downloads the voice model |

```sh
./setup.sh
.venv/bin/python tts.py
node render.mjs --sheet --scale 0.5     # check build/stills/
nohup node render.mjs > build/render.log 2>&1 &   # ~45 min on 2 CPU cores
node mix.mjs --out out/video.mp4
```

Credits: music and effects in `assets/audio/CREDITS.md`; fonts Nunito and Archivo Black (SIL OFL,
licences in `web/fonts/`); voice Kokoro-82M (Apache-2.0) via kokoro-onnx; Three.js (MIT).
