# Story Video Pipeline — Build Log

## 1. Analysis of the reference video (`VID_20261026_001513_300.mp4`)

| Property | Value |
|---|---|
| Resolution / fps | 1920×1080, 24 fps, H.264 |
| Duration | 84.46 s |
| Audio | AAC mono 24 kHz, single male narrator (Urdu), no music |
| Shots | 31 hard cuts (ffmpeg `select='gt(scene,0.25)'`), average ~2.7 s/shot |
| Visual style | AI-generated flat 2D storybook illustrations, warm pastel palette, very detailed backgrounds |
| Character | Simple stick figure: round white head, messy black hair, yellow tunic, thin black limbs. Same design in every shot |
| Motion | Each still gets a slow Ken Burns push-in or pan; no character animation |
| Subtitles | Bottom-centre, white with black outline, current word highlighted yellow (karaoke style) |

Cut times (s): 2.54 4.71 7.21 9.63 12.54 15.29 17.92 20.42 22.42 24.58 26.63 29.17 31.88 34.33 37.08 39.83 42.42 45.13 47.83 56.21 59.04 61.88 64.63 67.33 69.92 72.17 74.29 76.50 79.17 81.67

Story structure (from Whisper `small` transcript, `analysis/transcript.txt`):
poor boy in old Lahore → broken fridge / generator / broken bicycle → decides to go to Dubai → Dubai skyline → works hard, sends money → new fridge & car → Umrah in Makkah → Egyptian pyramids → reflection ("hard work is never wasted") → London in rain → misses home → returns, hugs mother → solar panels on roof → smiles, his effort paid off.
Pattern: **humble start → struggle → decision → montage of famous places → homesickness → emotional return → visible reward.**

Frame-analysis commands:
```bash
ffmpeg -i in.mp4 -vf "fps=1/6,scale=320:-1,tile=5x3" -frames:v 1 contact.jpg
ffmpeg -i in.mp4 -vf "select='gt(scene,0.25)',showinfo" -an -f null - 2>&1 | grep -o "pts_time:[0-9.]*"
ffmpeg -i in.mp4 -af silencedetect=n=-35dB:d=0.4 -f null -
```

## 2. Our version: "मीरा की उड़ान" (Hindi)
Same story arc, different story: Meera, a boatman's daughter in Varanasi, studies by lantern light, gets a medical scholarship in Delhi, becomes a doctor, runs camps across India (Rajasthan, Jaipur, Taj Mahal, Ladakh, Kerala, Mumbai), misses home, returns to hug her father, opens a free clinic at the ghat. Script: `story_video/story.json`.

## 3. Pipeline (`story_video/make.py`), all free/open source, CPU only
1. **Backgrounds**: `stabilityai/sd-turbo` via diffusers, 1024×576, 3 steps, fixed seed per scene (reproducible). ~75 s/image on 2 vCPU. The prompt suffix in `story.json → style` sets the flat-illustration look.
2. **Character**: drawn in code with Pillow (`draw_hero`) so she looks identical in every shot (diffusion models can't keep a character consistent). Poses: stand, wave, read, sad, hug, coat (doctor).
3. **Compose**: background upscaled to 3840×2160 (2× output) + unsharp mask, hero and soft shadow composited.
4. **Voice**: Piper TTS, `hi_IN-rohan-medium` (male, matches reference narrator; `priyamvada`/`pratham` also downloaded). `--length-scale 1.05`.
5. **Motion**: ffmpeg `zoompan` on the 2× image (avoids zoompan jitter), push-in / pull-out / pan left / pan right. Shot length = max(2.6 s, voice + 0.45 s).
6. **Subtitles**: generated ASS file, word-by-word yellow highlight; word timing is split by character length.
7. **Mix**: lines placed with `adelay`, `loudnorm` to -16 LUFS, burned-in subs, AAC 160k, `+faststart`.

Run: `python make.py --scenes 3 --out sample.mp4` (sample) or `python make.py` (full). Outputs are cached in `build/`; delete `build/bg_XX.png` to regenerate one background.

## 4. Environment setup
```bash
export UV_CACHE_DIR=/tmp/uvc
uv venv .venv && . .venv/bin/activate
uv pip install piper-tts faster-whisper pillow numpy diffusers transformers accelerate
uv pip install torch --index-url https://download.pytorch.org/whl/cpu
# voices: https://huggingface.co/rhasspy/piper-voices/tree/main/hi/hi_IN/{rohan,pratham,priyamvada}/medium
# font: NotoSansDevanagari-Bold.ttf in ~/.fonts ; cloudflared from GitHub releases
```

## 5. Problems hit & fixes
- `uv` cache permission error → set `UV_CACHE_DIR=/tmp/uvc`.
- SDXL-Turbo fp32 → `MemoryError` on 7 GB RAM. Switched to SD-Turbo.
- SD-Turbo at 1024 px OOM in VAE decode → `enable_attention_slicing()` + `vae.enable_tiling()`; also generate all backgrounds first and free the model before 4K compositing.
- faster-whisper `av.open(metadata_errors)` incompatibility → pass a numpy array instead of a file path.

## 6. Gap vs. reference & how to improve
- **Image quality** is the biggest gap. The reference uses a premium image model. Options, best first: FLUX.1-schnell or SDXL + a flat-illustration LoRA on a GPU (≥12 GB VRAM); on CPU, more RAM (16 GB+) lets SDXL-Turbo run.
- **Character**: a LoRA/IP-Adapter could put the character *inside* scenes (hug, boat) instead of overlaying her. The code-drawn overlay is consistent but can't interact with the scene.
- **Voice**: Piper Hindi is clear but flat. Better free options: AI4Bharat Indic-Parler-TTS or IndicF5 (heavier, GPU recommended).
- **Music**: the reference has none; a soft royalty-free pad at -28 dB would add warmth.
- Subtitle word timing is estimated; forced alignment (whisper word timestamps on our own TTS) would sync exactly.

## 7. Hero v2 (matches reference proportions)
Head ≈ 1/3 of body height, spiky messy black hair (fixed random seed so it's identical every shot), dot eyes, small arc mouth, mustard kurta with darker side shading, belt and hem stripe, thin limbs with oval feet. Raised arms are drawn in front of the hair. Preview: `hero_sheet.png`.

## 8. Browser for web image tools
`uv pip install playwright` + `PLAYWRIGHT_BROWSERS_PATH=/tmp/hoplite/pw playwright install chromium` (headless shell; `--with-deps` fails because sudo is blocked, but the plain install works).
