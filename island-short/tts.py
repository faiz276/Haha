"""Narration with Kokoro (CPU) + per-word caption timings via faster-whisper."""
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel
from kokoro_onnx import Kokoro

HERE = Path(__file__).parent
MODELS = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/an/models")
VOICE = sys.argv[2] if len(sys.argv) > 2 else "am_michael"
SPEED = float(sys.argv[3]) if len(sys.argv) > 3 else 1.08
LEAD = 0.15

script = json.loads((HERE / "script.json").read_text())
kokoro = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))


def trim(x, sr, thr=0.012, pad=0.03):
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(pad * sr))
    b = min(len(x), idx[-1] + int(pad * sr))
    return x[a:b]


parts, sents, t, sr = [], [], LEAD, 24000
parts.append(np.zeros(int(LEAD * sr), dtype=np.float32))
for line in script:
    samples, sr = kokoro.create(line["text"], voice=VOICE, speed=SPEED, lang="en-us")
    samples = trim(samples.astype(np.float32), sr)
    dur = len(samples) / sr
    sents.append({"id": line["id"], "text": line["text"], "start": round(t, 3), "end": round(t + dur, 3)})
    parts.append(samples)
    gap = np.zeros(int(line["gap"] * sr), dtype=np.float32)
    parts.append(gap)
    t += dur + line["gap"]

audio = np.concatenate(parts)
out = HERE / "build"
out.mkdir(exist_ok=True)
sf.write(out / "narration.wav", audio, sr)

# word timings: whisper words inside each sentence, else proportional fallback
idx = np.linspace(0, len(audio) - 1, int(len(audio) * 16000 / sr)).astype(int)
wm = WhisperModel("small", device="cpu", compute_type="int8")
segs, _ = wm.transcribe(audio[idx], word_timestamps=True, language="en")
heard = [w for s in segs for w in s.words]

fallbacks = 0
for s in sents:
    words = s["text"].split()
    inside = [w for w in heard if s["start"] - 0.05 <= (w.start + w.end) / 2 <= s["end"] + 0.05]
    if len(inside) == len(words):
        s["words"] = [
            {"w": words[i], "s": round(max(s["start"], inside[i].start), 3), "e": round(min(s["end"], inside[i].end), 3)}
            for i in range(len(words))
        ]
    else:
        fallbacks += 1
        weights = [len(re.sub(r"\W", "", w)) + 1.5 for w in words]
        tot, acc, ws = sum(weights), 0.0, []
        span = s["end"] - s["start"]
        for w, wt in zip(words, weights):
            a = s["start"] + span * acc / tot
            acc += wt
            ws.append({"w": w, "s": round(a, 3), "e": round(s["start"] + span * acc / tot, 3)})
        s["words"] = ws

(out / "timings.json").write_text(json.dumps({"duration": round(len(audio) / sr, 3), "sentences": sents}, indent=1))
print("duration", len(audio) / sr, "sentences", len(sents), "fallbacks", fallbacks)
for s in sents:
    print(f'{s["start"]:6.2f}-{s["end"]:6.2f} {s["id"]}')
