#!/usr/bin/env python3
"""Story video pipeline: SD-Turbo backgrounds + code-drawn hero + Piper Hindi TTS + Ken Burns + karaoke subs.
Usage: python make.py [--scenes N] [--out file.mp4]
"""
import argparse, json, math, os, subprocess, wave
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).parent
W, H, FPS = 1920, 1080, 24
BUILD = ROOT / "build"
VOICES = ROOT.parent / "voices"


def sh(*a):
    subprocess.run(a, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


# ---------- backgrounds ----------
_pipe = None
def background(i, prompt, cfg):
    out = BUILD / f"bg_{i:02d}.png"
    if out.exists():
        return Image.open(out)
    global _pipe
    if _pipe is None:
        import torch
        from diffusers import AutoPipelineForText2Image
        torch.set_num_threads(os.cpu_count())
        _pipe = AutoPipelineForText2Image.from_pretrained(
            "stabilityai/sd-turbo", torch_dtype=torch.float32, variant="fp16")
        _pipe.enable_attention_slicing(); _pipe.vae.enable_tiling()  # fits 1024px in ~7 GB RAM
    import torch
    im = _pipe(prompt + cfg["style"], num_inference_steps=3, guidance_scale=0.0,
               width=1024, height=576, generator=torch.manual_seed(1000 + i)).images[0]
    im.save(out)
    return im


# ---------- hero (drawn in code so she is identical in every shot) ----------
INK, SKIN, KURTA, HAIR, COAT = (25, 25, 25), (255, 255, 255), (245, 190, 40), (20, 20, 20), (250, 250, 250)

def draw_hero(pose, h):
    """Stick-figure girl in the reference's style; drawn at 2x then downscaled for smooth edges."""
    s = 2
    u = h * s / 10.0  # 10 units tall
    img = Image.new("RGBA", (int(7 * u), int(10.4 * u)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = img.width / 2
    lw = max(3, int(0.16 * u))
    def P(x, y): return (cx + x * u, y * u)
    def line(*pts): d.line([P(*p) for p in pts], fill=INK, width=lw, joint="curve")
    # legs
    line((-0.5, 6.6), (-0.7, 9.8)); line((0.5, 6.6), (0.7, 9.8))
    line((-0.7, 9.8), (-1.2, 9.85)); line((0.7, 9.8), (1.2, 9.85))
    # arms (behind torso for some poses)
    arms = {
        "stand": [((-0.9, 3.9), (-1.5, 5.6), (-1.4, 6.6)), ((0.9, 3.9), (1.5, 5.6), (1.4, 6.6))],
        "wave":  [((-0.9, 3.9), (-1.5, 5.6), (-1.4, 6.6)), ((0.9, 3.9), (2.0, 3.0), (2.4, 1.6))],
        "read":  [((-0.9, 3.9), (-1.0, 5.2), (0.2, 5.0)), ((0.9, 3.9), (1.0, 5.2), (0.0, 5.0))],
        "sad":   [((-0.9, 3.9), (-0.8, 5.4), (0.3, 5.6)), ((0.9, 3.9), (0.8, 5.4), (-0.3, 5.6))],
        "hug":   [((-0.9, 3.9), (-2.2, 4.4), (-1.0, 4.9)), ((0.9, 3.9), (2.2, 4.4), (1.0, 4.9))],
    }
    arm = arms.get(pose if pose != "coat" else "stand", arms["stand"])
    # torso: kurta (or doctor coat)
    body = COAT if pose == "coat" else KURTA
    d.polygon([P(-0.95, 3.6), P(0.95, 3.6), P(1.35, 7.0), P(-1.35, 7.0)], fill=body, outline=INK, width=lw)
    if pose == "coat":
        line((0, 3.7), (0, 7.0))
        d.ellipse([P(0.35, 4.6), P(0.75, 5.0)], outline=(220, 40, 40), width=lw)  # stethoscope hint
    else:
        for yy in (4.6, 5.6):  # kurta trim
            for xx in (-0.5, 0.0, 0.5):
                d.ellipse([P(xx - 0.12, yy - 0.12), P(xx + 0.12, yy + 0.12)], fill=(30, 140, 140))
    d.line([P(-1.35, 7.0), P(1.35, 7.0)], fill=INK, width=lw)
    for a in arm:
        line(*a)
    # long hair behind head
    d.ellipse([P(-1.75, 0.2), P(1.75, 3.0)], fill=HAIR)
    d.rectangle([P(-1.75, 1.6), P(1.75, 4.2)], fill=HAIR)
    # head
    d.ellipse([P(-1.45, 0.4), P(1.45, 3.5)], fill=SKIN, outline=INK, width=lw)
    # bangs
    d.chord([P(-1.6, 0.1), P(1.6, 2.6)], 180, 360, fill=HAIR)
    for k in range(-3, 4):
        d.polygon([P(k * 0.42 - 0.25, 1.3), P(k * 0.42 + 0.25, 1.3), P(k * 0.42, 1.75)], fill=HAIR)
    # face
    sad = pose == "sad"
    eye_y = 2.2
    for ex in (-0.5, 0.5):
        if pose == "hug":
            d.arc([P(ex - 0.2, eye_y - 0.1), P(ex + 0.2, eye_y + 0.2)], 200, 340, fill=INK, width=lw)
        else:
            d.ellipse([P(ex - 0.12, eye_y - 0.12), P(ex + 0.12, eye_y + 0.12)], fill=INK)
    if sad:
        d.arc([P(-0.35, 2.85), P(0.35, 3.25)], 200, 340, fill=INK, width=lw)
    else:
        d.arc([P(-0.4, 2.35), P(0.4, 3.0)], 20, 160, fill=INK, width=lw)
    d.ellipse([P(-1.0, 2.55), P(-0.65, 2.8)], fill=(255, 170, 170))
    d.ellipse([P(0.65, 2.55), P(1.0, 2.8)], fill=(255, 170, 170))
    img = img.resize((img.width // s, img.height // s), Image.LANCZOS)
    return img


def compose(i, scene, cfg):
    out = BUILD / f"frame_{i:02d}.png"
    bg = background(i, scene["prompt"], cfg).convert("RGB")
    # upscale to 2x output so the Ken Burns crop stays sharp
    big = bg.resize((W * 2, H * 2), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 2))
    hero = scene.get("hero")
    if hero:
        fig = draw_hero(hero["pose"], int(hero["h"] * H * 2))
        x = int(hero["x"] * W * 2 - fig.width / 2)
        y = int(hero["y"] * H * 2 - fig.height)
        shadow = Image.new("RGBA", big.size, (0, 0, 0, 0))
        ImageDraw.Draw(shadow).ellipse([x + fig.width * .2, y + fig.height * .97, x + fig.width * .8, y + fig.height * 1.02], fill=(0, 0, 0, 70))
        big = Image.alpha_composite(big.convert("RGBA"), shadow.filter(ImageFilter.GaussianBlur(12)))
        big.alpha_composite(fig, (x, y))
    big.convert("RGB").save(out)
    return out


# ---------- audio ----------
def tts(i, text, voice):
    out = BUILD / f"vo_{i:02d}.wav"
    if not out.exists():
        subprocess.run(["piper", "-m", str(VOICES / f"hi_IN-{voice}-medium.onnx"), "--length-scale", "1.05",
                        "--sentence-silence", "0.1", "-f", str(out)], input=text.encode(), check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    with wave.open(str(out)) as w:
        return out, w.getnframes() / w.getframerate()


# ---------- subtitles (word-by-word yellow highlight like the reference) ----------
def ass_time(t):
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"

def subs(entries, path):
    hdr = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Noto Sans Devanagari,58,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,4,2,2,80,80,70,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    for start, dur, text in entries:
        words = text.split()
        weights = [len(w) + 2 for w in words]
        tot, t = sum(weights), start + 0.05
        for k, w in enumerate(words):
            wd = (dur - 0.1) * weights[k] / tot
            parts = [("{\\c&H00D7FF&}" + x + "{\\c&HFFFFFF&}") if j == k else x for j, x in enumerate(words)]
            lines.append(f"Dialogue: 0,{ass_time(t)},{ass_time(t + wd)},Main,,0,0,0,,{' '.join(parts)}")
            t += wd
    Path(path).write_text(hdr + "\n".join(lines) + "\n", encoding="utf-8")


# ---------- motion ----------
def clip(i, img, dur, motion):
    out = BUILD / f"clip_{i:02d}.mp4"
    n = math.ceil(dur * FPS)
    # img is 2x; zoompan on the large image then output at 1080p avoids the usual zoompan jitter
    z = {"in": "1.0+0.12*on/{n}", "out": "1.12-0.12*on/{n}", "left": "1.12", "right": "1.12"}[motion].format(n=n)
    x = {"left": "(iw-iw/zoom)*(1-on/{n})", "right": "(iw-iw/zoom)*on/{n}"}.get(motion, "(iw-iw/zoom)/2").format(n=n)
    vf = f"zoompan=z='{z}':x='{x}':y='(ih-ih/zoom)/2':d={n}:s={W}x{H}:fps={FPS},format=yuv420p"
    sh("ffmpeg", "-y", "-loop", "1", "-i", str(img), "-vf", vf, "-frames:v", str(n), "-c:v", "libx264",
       "-preset", "medium", "-crf", "18", str(out))
    return out, n / FPS


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scenes", type=int, default=0)
    ap.add_argument("--out", default=str(ROOT / "final.mp4"))
    a = ap.parse_args()
    cfg = json.loads((ROOT / "story.json").read_text())
    scenes = cfg["scenes"][: a.scenes or None]
    BUILD.mkdir(exist_ok=True)
    global _pipe
    for i, sc in enumerate(scenes):  # pass 1: all backgrounds, then free the model before 4K compositing
        background(i, sc["prompt"], cfg)
    _pipe = None
    import gc; gc.collect()
    clips, audio, entries, t = [], [], [], 0.0
    for i, sc in enumerate(scenes):
        wav, vdur = tts(i, sc["text"], cfg["voice"])
        img = compose(i, sc, cfg)
        c, cdur = clip(i, img, max(2.6, vdur + 0.45), sc.get("motion", "in"))
        clips.append(c); audio.append((wav, t + 0.15)); entries.append((t + 0.15, vdur, sc["text"]))
        t += cdur
        print(f"scene {i}: {cdur:.2f}s", flush=True)
    (BUILD / "list.txt").write_text("".join(f"file '{c.name}'\n" for c in clips))
    sh("ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(BUILD / "list.txt"), "-c", "copy", str(BUILD / "video.mp4"))
    # narration track: each line delayed to its scene start
    inputs, filt = [], []
    for k, (wav, st) in enumerate(audio):
        inputs += ["-i", str(wav)]
        filt.append(f"[{k}]adelay={int(st * 1000)}:all=1[a{k}]")
    filt.append("".join(f"[a{k}]" for k in range(len(audio))) + f"amix=inputs={len(audio)}:normalize=0,apad=whole_dur={t:.2f},loudnorm=I=-16[vo]")
    sh("ffmpeg", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "[vo]", "-ar", "48000", str(BUILD / "vo.wav"))
    subs(entries, BUILD / "subs.ass")
    sh("ffmpeg", "-y", "-i", str(BUILD / "video.mp4"), "-i", str(BUILD / "vo.wav"), "-vf", f"ass={BUILD / 'subs.ass'}",
       "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-c:a", "aac", "-b:a", "160k", "-shortest",
       "-movflags", "+faststart", a.out)
    print("done", a.out, f"{t:.1f}s")


if __name__ == "__main__":
    main()
