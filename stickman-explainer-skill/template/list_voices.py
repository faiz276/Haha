"""Print every voice in the Kokoro voices file. Optional: render a short sample per voice.
usage: python list_voices.py [--samples "Sentence to speak"]"""
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
voices = sorted(np.load(HERE / "models" / "voices-v1.0.bin").keys())
print(len(voices), "voices")
print(" ".join(voices))

if "--samples" in sys.argv:
    import soundfile as sf
    from kokoro_onnx import Kokoro

    text = sys.argv[sys.argv.index("--samples") + 1]
    k = Kokoro(str(HERE / "models/kokoro-v1.0.onnx"), str(HERE / "models/voices-v1.0.bin"))
    out = HERE / "build" / "voice-samples"
    out.mkdir(parents=True, exist_ok=True)
    for v in [x for x in voices if x[0] in "ab"]:   # American and British English
        samples, sr = k.create(text, voice=v, speed=1.08, lang="en-us" if v[0] == "a" else "en-gb")
        sf.write(out / f"{v}.wav", samples, sr)
    print("samples in", out)
