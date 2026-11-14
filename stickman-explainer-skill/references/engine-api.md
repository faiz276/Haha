# Engine API

Everything you call from `web/story.js`. Import from `./engine.js` and `./art.js` as the template does.

## The world

- Units: a character is **2 wide and 3 tall**. Ground is `y = 0`. `+x` is screen-right, `+z` is
  towards the default camera, `+y` is up.
- The frame is portrait, camera field of view 40°. Visible width at distance `D` is about `0.41 × D`,
  visible height about `0.73 × D`.
- Sky, clouds, sun, shadows, fog and the vignette are provided by the engine.

## Building the set (runs once, at the top of story.js)

| Call | Does |
| --- | --- |
| `box(w, h, d, colour, x, y, z)` | A box centred at x, y, z. Tables, posts, planks, walls. |
| `add(geometry, material, x, y, z, parent?)` | Any Three.js mesh, with shadows on. |
| `L(colour)` | Matte material: `L('#b17a42')`. |
| `canvasTex(w, h, (g) => {...})` | A texture painted with the 2D canvas API (stripes, sand, water). |
| `scene` | The Three.js scene, for anything else (`scene.add(...)`). |
| `THREE` | The Three.js namespace. |

The template's `hut()`, `palm()`, `rock()`, market stall, dock and cave show the level of detail that
is enough: 3–8 primitives per object, flat colours, slightly varied sizes. Keep the palette small
(one ground colour, one accent, 2–3 object colours). Replace the island with your own ground:
a large `CylinderGeometry` or `PlaneGeometry` at `y ≈ 0` with a `canvasTex` on it.

For a second, separate location (an interior, a flashback) build it far away — the template's cave
interior sits at `x = 120` — and show or hide non-sprite parts through the `reset` hook (see `start`).

## Sprites: flat cutouts that always face the camera

```js
const tag = new Sprite(300, 240, 1.2, 0.96, { shadow: false });   // canvas px w,h → world units w,h
tag.draw((g) => drawTag(g, 20, false)).put(x, y, z, scale, roll);
```

- `new Sprite(cw, ch, w, h, opt)`. Options: `shadow: false` (no ground shadow — use for signs, cards,
  glows), `fog: false`, `add: true` (additive glow), `draw: fn` (paint once at creation).
- `.draw(fn)` repaints the canvas. Call it in a shot only when the picture changes (it is the slow part).
- `.put(x, y, z, scale = 1, roll = 0)` shows the sprite **for this frame**. The origin is the bottom
  centre. Every sprite is hidden again at the start of the next frame, so a prop that is not `put`
  in a shot is simply not there.
- Need several copies on screen at once? Make a pool: `const fishS = Array.from({ length: 12 }, () => new Sprite(...))`.

## Cast

```js
makeCast([
  { skin: '#f2c9a0', shirt: '#c0392b', hat: 'feathers' },          // index 0
  { skin: '#e8b98a', shirt: '#3d7ea6', apron: '#fdf6e3', hat: 'straw' },
]);
A(0, x, z, { expr: 'happy', aL: 2.6, aR: 2.6 });
```

Character spec:

| Field | Values |
| --- | --- |
| `skin`, `shirt` | Any CSS colour |
| `stripe` | Stripe colour across the shirt |
| `apron` | Apron colour (shopkeepers) |
| `hat` | `'feathers'`, `'straw'`, `'bandana'`, `'cap'`, `'hair'`, `'hairbun'`, `'bun'`, `'flower'` |
| `hair` | Hair colour for `hair` / `hairbun` / `bun` / `flower` |
| `hatc` | Colour for `bandana` / `cap` |
| `glasses` | `true` |

Give every character a different shirt colour and headwear so they read apart at thumbnail size.
6–10 characters is plenty. To add a new hat, extend `drawChar` in `art.js` next to the existing ones.

`A(i, x, z, state)` — place cast member `i` this frame. State fields (all optional):

| Field | Meaning |
| --- | --- |
| `expr` | `'neutral'`, `'smile'`, `'happy'`, `'shock'`, `'awe'`, `'flat'`, `'smug'`, `'sad'`, `'angry'` |
| `aL`, `aR` | Arm angle in radians: `0.25` hanging, `1.5` straight out, `2.8` straight up |
| `hold` | `{ type: 'sack' \| 'fish' \| 'jar' \| 'plate', s: scale }` — held in both hands (overrides arms) |
| `look` | `[x, y]` each −1…1: where the face and pupils point |
| `run` | A phase number (e.g. `c.T * 17`) — legs cycle |
| `y` | Lift off the ground (jumps: `Math.abs(Math.sin(c.T * 8)) * 0.16`) |
| `tilt` | Lean in radians (dance: `Math.sin(p) * 0.17`; running: `-0.13`) |
| `squash` | Squash and stretch (landing: `Math.exp(-dt * 7) * Math.cos(dt * 22) * 0.16`) |
| `scale` | Size; use `pop(...)` to pop a character in |
| `tear` | `true` draws a tear |

Blinking and a slight breathing motion are automatic.

## Props in art.js

| Function | Canvas size it expects | Notes |
| --- | --- | --- |
| `drawShell(g, x, y, r, rot, colour)` | any | The "money" of the example |
| `drawFish(g, x, y, scale, rot)` | any | |
| `drawSack(g, x, y, scale)` | 200×200 | |
| `drawJar(g, x, y, scale)` | any | |
| `drawPlate(g, x, y, scale)` | any | |
| `drawTag(g, number, red)` | 300×240 | Price tag: number + unit icon; `red` = alarm state |
| `drawBoard(g, (g) => {...})` | 640×480 | Chalkboard on legs; draw the content in the callback |
| `chalk(g, text, x, y, size, colour, align)` | — | Chalk lettering for the board |
| `drawCrab(g, T, clawUp, blink)` | 360×300 | The mascot |
| `drawBoat(g, fancy)` | 720×720 | |
| `shellHeap(n, w, h, r, seed)` + `drawHeap(g, pts, n, r)` | — | A pile that can grow item by item |
| `drawStar(g, x, y, r, alpha)` | — | Sparkle |

**Adding a prop.** Write `export function drawThing(g, x, y, s) {...}` in `art.js` in the same style:

- outline colour `#161616`, line width 7–10 at scale 1, `lineJoin = 'round'`;
- one flat fill plus at most one lighter highlight shape and one darker band;
- big simple shapes — it will be seen at 100–300 px tall.

To let characters carry it, add an entry to `HOLD` in `art.js` (`[half hand spacing, hand height]`)
and a branch in the `if (st.hold)` block of `drawChar`.

Change the tag's unit icon by replacing the `drawShell(...)` call at the end of `drawTag`.

## Per-shot calls

| Call | Does |
| --- | --- |
| `cam(px, py, pz, lx, ly, lz)` | Camera position and the point it looks at. Call once in every shot. |
| `mix(a, b, u)` | Blend two arrays: `cam(...mix(from, to, c.u))` is a camera move. |
| `setCard(text, t0, colour?)` | Big rounded card in the upper third, popping in `t0` seconds into the shot. One per shot. |
| `grade(name, amount = 1)` | `'sunset'`, `'cool'`, `'morning'`, `'sepia'`, `'spot'` (dark vignette spotlight) |
| `captionsTop()` | Move captions to the top for this shot (when the action is in the lower third). |

Easing: `eo(u)` ease-out, `eio(u)` ease-in-out, `pop(u)` overshoot (pop-ins), `clamp(x)`, `lerp(a, b, u)`.
Deterministic random: `rnd(i)` → 0…1. Never use `Math.random()`.

Shot argument `c`: `c.t` seconds since the shot began, `c.d` shot length, `c.u = c.t / c.d`,
`c.T` time since the start of the video (use it for continuous motion such as bobbing).

## start()

```js
start({
  shots: S,                       // { id: (c) => {...} } — one per sentence id in script.json
  transitions: TIN,               // { id: 'whip' | 'fade' | 'cont' } — how that shot is entered; default 'whip'
  reset: () => { interior.visible = false; },                  // hide non-sprite objects each frame
  perFrame: (T) => { seaTex.offset.set(T * 0.012, T * 0.006); },  // continuous set animation
});
```

Shot start = 0.12 s before its sentence is spoken; shot end = start of the next shot. The first shot
always starts at 0 with no transition.

- `whip`: 5 frames out + 5 frames in, camera yaw plus horizontal motion blur, alternating direction.
- `fade`: 8-frame dissolve from the last frame of the previous shot.
- `cont`: no effect. Only use between shots in the same place with a similar or tighter framing.

## Captions and cards

Captions are generated from `build/timings.json`: 1–2 words, at most about 12 characters, split at
punctuation, each staying on screen until the next one. Font Nunito 900, 88 px, white with a 20 px
black outline, at y = 1300 (or 330 with `captionsTop()`). Cards: Archivo Black 92 px at y = 430.

Keep the important part of every shot between y = 500 and y = 1200 of the 1920 frame so neither the
card nor the caption covers it.

## Commands

| Command | Result |
| --- | --- |
| `.venv/bin/python tts.py [voice] [speed]` | `build/narration.wav`, `build/timings.json`; prints duration |
| `.venv/bin/python list_voices.py [--samples "text"]` | List voices; write a sample of each English voice |
| `node render.mjs --sheet --scale 0.5` | One still per shot (at 60% through) in `build/stills/` |
| `node render.mjs --scale 0.5 --stills 3.2,3.3` | Stills at exact times |
| `node render.mjs --from 300 --to 450 --out build/part.mp4` | A frame range, to check motion |
| `node render.mjs` | Full video → `build/video.mp4` (silent) |
| `node mix.mjs --out out/name.mp4` | Final video with sound |

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `PAGE ERROR No shot function for sentence id(s): …` | Add `S.<id>` in `story.js` or fix the id in `script.json`. |
| `PAGE ERROR A(7): no such cast member` | The cast array is shorter than the index used. |
| `Chrome not found` | Install Chrome/Chromium or set `CHROME=/path/to/chrome`. |
| Render stops with "Target closed" | The command was killed by a timeout. Run it with `nohup … &` and poll the log. |
| Black or empty frame | The shot did not call `cam(...)`, or the camera is inside an object. |
| A prop is missing in one shot | It was not `put()` in that shot — sprites do not persist between frames. |
| Captions out of sync by a word | `tts.py` printed fallbacks > 0 for that sentence; shorten or rephrase it, or accept (the fallback spreads words evenly). |
| Narration mispronounces a word | Respell it in `text` (e.g. "sea shells"), or write numbers as words. |
| Final video is loud/clipping | Lower `music.volume` or cue `vol` values in `audio.json`. |
