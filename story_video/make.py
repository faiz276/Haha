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
INK, SKIN, KURTA, KDARK, HAIR, COAT, LEG = (30, 30, 30), (255, 255, 255), (222, 168, 52), (176, 122, 30), (22, 22, 22), (250, 250, 250), (150, 120, 70)

def draw_hero(pose, h):
    """Meera in the reference's style: big round head (~1/3 height), spiky messy hair, dot eyes, belted mustard kurta."""
    import random
    rnd = random.Random(7)  # fixed seed -> identical hair every shot
    s = 3
    u = h * s / 10.0
    img = Image.new("RGBA", (int(8 * u), int(10.4 * u)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = img.width / 2
    lw = max(3, int(0.13 * u))
    def P(x, y): return (cx + x * u, y * u)
    def line(*pts, w=lw): d.line([P(*p) for p in pts], fill=INK, width=w, joint="curve")
    # legs + feet
    line((-0.4, 7.4), (-0.5, 9.8)); line((0.4, 7.4), (0.5, 9.8))
    d.ellipse([P(-0.95, 9.6), P(-0.3, 9.95)], fill=INK); d.ellipse([P(0.3, 9.6), P(0.95, 9.95)], fill=INK)
    arms = {
        "stand": [((-0.75, 4.4), (-1.3, 6.0), (-1.25, 7.0)), ((0.75, 4.4), (1.3, 6.0), (1.25, 7.0))],
        "wave":  [((-0.75, 4.4), (-1.3, 6.0), (-1.25, 7.0)), ((0.75, 4.4), (1.8, 3.8), (2.2, 2.6))],
        "read":  [((-0.75, 4.4), (-0.9, 5.7), (0.2, 5.5)), ((0.75, 4.4), (0.9, 5.7), (-0.1, 5.5))],
        "sad":   [((-0.75, 4.4), (-0.7, 5.8), (0.2, 6.0)), ((0.75, 4.4), (0.7, 5.8), (-0.2, 6.0))],
        "hug":   [((-0.75, 4.4), (-2.0, 4.8), (-1.0, 5.3)), ((0.75, 4.4), (2.0, 4.8), (1.0, 5.3))],
    }
    arm = arms.get("stand" if pose == "coat" else pose, arms["stand"])
    # kurta: shaded trapezoid, belt, hem stripe (like the reference tunic)
    body = COAT if pose == "coat" else KURTA
    shade = (215, 215, 215) if pose == "coat" else KDARK
    d.polygon([P(-0.8, 4.1), P(0.8, 4.1), P(1.2, 7.6), P(-1.2, 7.6)], fill=body, outline=INK, width=lw)
    d.polygon([P(0.2, 4.1), P(0.8, 4.1), P(1.2, 7.6), P(0.5, 7.6)], fill=shade)
    d.polygon([P(-0.8, 4.1), P(0.8, 4.1), P(1.2, 7.6), P(-1.2, 7.6)], outline=INK, width=lw)
    if pose == "coat":
        line((0, 4.2), (0, 7.6)); line((-0.3, 4.2), (-0.2, 5.6), (0.3, 5.9), w=max(2, lw // 2))
        d.ellipse([P(0.15, 5.75), P(0.45, 6.05)], fill=(90, 90, 90))
    else:
        d.rectangle([P(-0.98, 5.7), P(0.98, 6.0)], fill=KDARK, outline=INK, width=max(2, lw // 2))
        d.line([P(-1.15, 7.3), P(1.15, 7.3)], fill=KDARK, width=lw)
        d.line([P(-0.25, 4.1), P(0, 4.6), P(0.25, 4.1)], fill=INK, width=max(2, lw // 2))
    for a in arm:
        if not (a[-1][1] < 4.4 or pose in ("hug", "read", "sad")):
            line(*a)
    # hair: back mass with jagged outline (shoulder length)
    hc = (0, 2.1)
    pts = []
    for k in range(60):
        t = math.pi * 2 * k / 60
        r = (1.72 + rnd.random() * 0.15 if k % 2 else 1.5 + rnd.random() * 0.1)
        x, y = hc[0] + math.cos(t) * r * 1.05, hc[1] + math.sin(t) * r
        if y > 2.6: y = min(y + 0.55, 4.0)  # longer at the back / sides
        pts.append(P(x, y))
    d.polygon(pts, fill=HAIR)
    # head
    d.ellipse([P(-1.45, 0.75), P(1.45, 3.95)], fill=SKIN, outline=INK, width=lw)
    # spiky fringe
    fr = [P(-1.6, 2.3)]
    for k in range(9):
        x = -1.5 + k * 0.375
        fr += [P(x + 0.18, 1.0 + rnd.random() * 0.25), P(x + 0.32, 1.35 + rnd.random() * 0.35)]
    fr += [P(1.6, 2.3), P(1.7, 0.6), P(0, 0.05), P(-1.7, 0.6)]
    d.polygon(fr, fill=HAIR)
    for k in range(7):  # stray spikes on top
        x = -1.2 + k * 0.4
        d.polygon([P(x - 0.2, 0.4), P(x + 0.2, 0.4), P(x + rnd.uniform(-0.3, 0.3), -0.15 - rnd.random() * 0.2)], fill=HAIR)
    for a in arm:  # drawn last so waving/hugging arms sit in front of the hair
        if a[-1][1] < 4.4 or pose in ("hug", "read", "sad"):
            line(*a)
    # face
    for ex in (-0.5, 0.5):
        if pose == "hug":
            d.arc([P(ex - 0.2, 2.45), P(ex + 0.2, 2.75)], 200, 340, fill=INK, width=lw)
        else:
            d.ellipse([P(ex - 0.11, 2.4), P(ex + 0.11, 2.75)], fill=INK)
    if pose == "sad":
        line((-0.4, 2.05), (-0.65, 2.15)); line((0.4, 2.05), (0.65, 2.15))
        d.arc([P(-0.25, 3.3), P(0.25, 3.6)], 200, 340, fill=INK, width=lw)
    else:
        d.arc([P(-0.3, 2.95), P(0.3, 3.35)], 20, 160, fill=INK, width=lw)
    return img.resize((img.width // s, img.height // s), Image.LANCZOS)


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
