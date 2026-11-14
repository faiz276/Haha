---
name: stickman-explainer-short
description: Produce a polished 45–90 second vertical (1080×1920) animated explainer short on any topic — original script, CPU text-to-speech narration, word-timed captions, 2D cutout characters inside a 3D set, whip-pan transitions, music and sound effects — entirely from code, with no image generation and no paid services. Use when asked for a stickman / cutout / "one X explains it" style YouTube Short, TikTok or Reel.
---

# Stickman Explainer Short

You are producing a finished MP4, not a plan. Follow the steps in order. Do not skip the review
steps: the quality comes from looking at stills and fixing them, not from the first draft.

**What is in this bundle**

| Path | Purpose |
| --- | --- |
| `SKILL.md` | This file. The whole process. |
| `references/script-guide.md` | How to pick a topic and write the script. Read before step 2. |
| `references/engine-api.md` | Every function, character option and prop you can use. Read before step 4. |
| `references/shot-cookbook.md` | Copy-paste shot patterns and camera distances. Read before step 4. |
| `references/qa-checklist.md` | What to check before delivering. Read before step 6. |
| `template/` | A complete working project (the "island inflation" video). Copy it and edit. |
| `example/` | Stills and a small copy of the finished example video, so you know the target. |

Look at `example/contact-sheet-1.jpg` and `example/contact-sheet-2.jpg` before you start. That is the
quality bar. If you can play video, watch `example/island-inflation-720p.mp4` too.

## The fixed specification

Do not change these unless the user asks.

| Setting | Value |
| --- | --- |
| Frame | 1080×1920 (9:16), 30 fps, H.264, yuv420p |
| Length | **60–70 seconds by default.** Allowed range 45–90 s. |
| Script | One sentence = one shot. Average shot 2.0 s, never longer than 4 s. |
| Voice | Kokoro-82M on CPU. Default voice `am_michael`, speed `1.08`. |
| Captions | 1–2 words at a time, white, heavy black outline, lower third (y = 1300 of 1920). |
| Transitions | No plain hard cuts between scenes. Whip-pan by default, dissolve or punch-in where listed below. |
| Audio | Voice + quiet music bed + spot effects. Final mix about −15 LUFS, peak below −1 dBFS. |
| Look | Flat outlined cutout characters and props, standing in a real 3D set with shadows and a moving camera. |

### Length: how many words to write

Measured on the example (184 words, 33 sentences → 67.2 s): the voice speaks about **3.3 words per
second** at speed 1.08, and the pauses between sentences add about **0.33 s per sentence**.

`duration ≈ words ÷ 3.3 + sum of gaps + 0.15`

| Target length | Words | Sentences (= shots) |
| --- | --- | --- |
| 45 s | 120–130 | 21–24 |
| **60–70 s (default)** | **165–190** | **29–34** |
| 75 s | 200–215 | 35–39 |
| 90 s | 240–255 | 42–46 |

`tts.py` prints the real duration. If it is more than 3 s off target, add or cut sentences and run it
again — never fix length by changing the speed beyond 1.0–1.15.

### Voice

Set `voice`, `speed` and `lang` in `template/audio.json`. All run on CPU; no account or key needed.

| Voice | Sound | Use for |
| --- | --- | --- |
| `am_michael` (default) | Warm, clear American male | Story/parable explainers. The tested default. |
| `am_fenrir` | Deeper, more dramatic American male | History, mystery, "dark" topics |
| `am_puck` | Lighter, playful American male | Comedy, kids' topics |
| `af_heart` | Warm American female | Story explainers, softer topics |
| `af_bella` | Bright, energetic American female | Fast fact lists |
| `bm_george` | British male, documentary tone | Science, history (`"lang": "en-gb"`) |
| `bf_emma` | British female, calm | Science, nature (`"lang": "en-gb"`) |

Only `am_michael` at 1.08 was used for the reference video; the other descriptions are the model's
published voice characters. If the user has no preference, use the default. To audition, run
`.venv/bin/python list_voices.py --samples "Your hook sentence here."` and listen to
`build/voice-samples/`. `list_voices.py` alone prints all 54 voices (other languages: `e*` Spanish,
`f*` French, `h*` Hindi, `i*` Italian, `j*` Japanese, `p*` Portuguese, `z*` Mandarin — captions still
work, but the script rules in this skill were written for English).

Speed: `1.08` default. `1.0` for a calmer piece, `1.15` maximum. Above that it sounds rushed.

## Step 0 — Inputs

Ask at most once, and only for what is missing. If the user gave a topic, or said to choose one,
do not ask anything: use the defaults.

- **Topic**: given by the user, or choose one yourself using `references/script-guide.md` § Choosing a topic.
- **Length**: default 60–70 s.
- **Voice**: default `am_michael`.

## Step 1 — Set up (once)

```sh
cp -r template my-video && cd my-video
./setup.sh
```

`setup.sh` installs the two npm packages, creates `.venv` with the Python packages and downloads the
Kokoro model (about 350 MB) into `models/`. It needs `node` ≥ 18, `python3` ≥ 3.10, `ffmpeg`, `curl`
and Chrome or Chromium. If Chrome is missing it prints the install command; then set `CHROME=/path`.

Prove the pipeline works before you change anything:

```sh
.venv/bin/python tts.py            # writes build/narration.wav and build/timings.json
node render.mjs --sheet --scale 0.5   # one still per shot into build/stills/ (about 20 s)
```

Open a few stills. If they look like `example/contact-sheet-1.jpg`, continue.

## Step 2 — Write the script

Read `references/script-guide.md` first. Then replace `script.json`:

```json
[
  {"id": "hook",   "text": "Why does everything keep getting more expensive?", "gap": 0.3},
  {"id": "island", "text": "One tiny island explains it.",                      "gap": 0.4}
]
```

- `id`: short, unique, a valid JavaScript identifier (`hook`, `cave`, `twenty`). It names the shot.
- `text`: exactly what the voice says. One sentence. 2–12 words. Numbers written as words.
- `gap`: silence after the sentence, in seconds. `0.2–0.3` normal, `0.4–0.5` before a turn in the
  story, `1.0–1.2` after the last sentence so the video does not end abruptly.

The required five-part structure, with where each part falls in a 65 s video:

| Part | Time | What happens |
| --- | --- | --- |
| 1. Hook | 0–3 s | A question the viewer wants answered. First frame already shows the problem. |
| 2. Promise | 3–5 s | "One ___ explains it." Introduce the small world. |
| 3. Setup | 5–16 s | The rules of the world, with countable things (10 people, 10 fish, 100 shells). |
| 4. Change and consequences | 16–46 s | One event changes one thing. Show the chain of results. Include a turn ("But there's a problem."). |
| 5. Two fates, then the lesson | 46–65 s | Who wins, who loses, why. Last line names the real-world idea in ≤ 4 words. |

Run `.venv/bin/python tts.py` and check the printed duration and the per-sentence times.

## Step 3 — Plan the shots (write this down before coding)

Make a table with one row per sentence: `id | what is on screen | what moves | camera | transition in | card text | sound`.
Rules:

1. **The picture shows the sentence literally.** If the line says "ten fish", ten fish appear, and a
   card counts them.
2. **Something moves in every shot**: a pop-in, a count-up, a jump, a prop flying, a camera push.
3. **Reuse 4–6 locations** in one continuous world and come back to them. Returning to a place with one
   thing changed (price tag 10 → 100) is the strongest device this format has.
4. **One recurring explainer device**: a small mascot beside a chalkboard that states the rule
   (`1 fish = 10 shells`), marks the turn (`BUT… PROBLEM!`) and writes the final word.
5. **Numbers go on cards**; never rely on the caption for a number.
6. **Colour follows mood**: neutral for setup, `morning` for a discovery, `sunset` for an ending,
   `cool` for loss, `sepia` for a flashback, `spot` to single out characters.
7. Choose the transition into each shot:
   - `whip` (default): any change of place or subject.
   - `fade`: entering an interior, a time jump, or a slow emotional beat. Use 3–5 per video.
   - `cont`: same location and nearly the same framing — the camera continues or punches in. Use for
     build-ups (20 → 50 → 100) and for a reaction right after an action.

## Step 4 — Build the set, cast, props and shots

Read `references/engine-api.md` and `references/shot-cookbook.md`. Edit **only** these files:

- `web/story.js` — the set, the cast, the prop sprites, one shot function per sentence, the
  transition table. It is the worked example; replace its contents section by section.
- `web/art.js` — add a `draw…` function for each new prop (and a `HOLD` entry if characters carry it).
- `audio.json` — voice, music, sound cues.

Do **not** edit `web/engine.js`, `render.mjs`, `tts.py` or `mix.mjs` unless something is broken.

Each shot is a pure function of time. It is called for every frame of its sentence:

```js
S.price = (c) => {            // c.t seconds into shot, c.u 0→1 progress, c.d shot length, c.T video time
  cam(...mix([-15.5, 2.6, 15.6, -15.5, 1.75, 0], [-15.5, 2.5, 14.5, -15.5, 1.75, 0], c.u));  // slow push-in
  A(1, -16.5, -0.9, { expr: 'happy' });                     // cast member 1 behind the stall
  A(2, -13.6, 0.55, { expr: 'smile', look: [-0.8, 0] });    // customer
  tag.draw((g) => drawTag(g, 10, false)).put(-15.8, 1.72, 0.35, 0.75 * pop((c.t - 0.15) / 0.25));
};
```

There must be exactly one `S.<id>` for every `id` in `script.json`; the renderer stops with a clear
error if one is missing. Never use `Math.random()` or the clock — use `rnd(i)` and `c.T`, so every
frame renders the same way twice.

Work in this loop until every shot is right:

```sh
node render.mjs --sheet --scale 0.5            # one still at 60% of every shot
node render.mjs --scale 0.5 --stills 12.4,12.5,12.6   # exact times, to check an animation or transition
```

**Look at the stills.** Fix: faces hidden behind other characters, anything cut off by the frame
edge, props floating or sunk in the ground, a caption covering a face or a number, text too small,
an empty or flat frame. If you cannot view images, say so to the user instead of claiming it was checked.

## Step 5 — Render and mix

```sh
nohup node render.mjs > build/render.log 2>&1 &     # full 1080×1920 → build/video.mp4
tail -f build/render.log                            # prints progress every 150 frames
node mix.mjs --out out/my-topic.mp4                 # adds voice, music, effects
```

Rendering is software 3D: about **1.3 s per frame on 2 CPU cores, so 40–50 minutes for a 65 s
video**. Start it detached (as above) and wait; do not run it inside a command with a short timeout,
and do not run two renders at once (it is not faster). On a machine with a GPU it is much quicker.
Only start the full render when the stills are right.

Sound cues go in `audio.json` → `cues`: `{ "file": "handleCoins.ogg", "shot": "price", "offset": 0.12, "vol": 0.55 }`
(`offset` = seconds after the shot starts, or `u` = fraction of the shot). Whip-pan swishes are added
automatically. Aim for 15–30 cues: one on every pop-in, count, impact or reveal. Bundled files are in
`template/assets/audio/`; see `template/assets/audio/CREDITS.md` for what each is.

## Step 6 — Check and deliver

Run `references/qa-checklist.md`. Minimum:

```sh
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of csv=p=0 out/my-topic.mp4
ffmpeg -hide_banner -i out/my-topic.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E " I:|Peak:"
ffmpeg -v error -y -i out/my-topic.mp4 -vf "fps=2,scale=180:320,tile=12x4" build/final_%02d.jpg   # review these
```

Tell the user: the file, its length, the voice used, what you could not verify (for example, if you
cannot hear audio), and the **music credit line they must paste into the video description**:

> "Easy Lemon" Kevin MacLeod (incompetech.com) — Licensed under Creative Commons: By Attribution 4.0 — http://creativecommons.org/licenses/by/4.0/

## Rules that are easy to break

- Write an original script. Do not copy another creator's script, characters or exact shots.
- Facts must be true or clearly a parable. Do not put invented statistics on cards.
- Do not add a logo, watermark, "subscribe" card or end screen unless asked.
- Do not swap the voice for a system voice or an online API without telling the user.
- Do not replace the music with a track you cannot show a licence for.
- Do not deliver without looking at the final stills.
