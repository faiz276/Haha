# Shot cookbook

Patterns taken from `template/web/story.js`. Copy, then change positions and props.

## Camera distances that work (portrait, 40° lens)

`cam(px, py, pz, lx, ly, lz)` with the subject standing at `(X, 0, Z)`:

| Framing | Camera | Use |
| --- | --- | --- |
| Close-up, one character | `X, 1.8, Z+5` looking at `X, 1.85, Z` | Emotion, final beat of a fate |
| Medium, one character | `X, 1.8, Z+6…7.5` looking at `X, 1.6, Z` | Hook, introducing someone |
| Two characters / a stall | `X, 2.6, Z+14…16` looking at `X, 1.75, Z` | Trades, comparisons |
| Mascot + chalkboard | `X, 1.8, Z+10` looking at `X, 1.2, Z` | Rule, turn, lesson |
| Group of ten (3 rows) | `0, 4.6, 23` looking at `0, 1.3, 6.3` | Introductions, group reactions |
| Low angle on a crowd | `X−1.5, 0.9, Z+8` looking at `X, 2.2, Z` | Cheering |
| Establishing aerial | `0, 30, 74` looking at `0, 4, 2` | "One tiny island explains it." |

Every shot moves the camera a little: push in 5–8% over the shot —
`cam(...mix([x, y, z, lx, ly, lz], [x, y, z - 1.2, lx, ly, lz], c.u))`.

Stage characters **in front of** set pieces by at least 2 units, and keep the nearest prop or tree
more than 4 units from the camera so nothing blocks the lens.

## Crowd in rows

Ten characters in rows of 3 / 4 / 3. Back rows are raised so every face is visible:

```js
const ROW = { 3: [-1.55, 8], 2: [0, 8], 9: [1.55, 8], 1: [-2.3, 6.3], 4: [-0.78, 6.3], 5: [0.78, 6.3], 6: [2.3, 6.3], 7: [-1.55, 4.6], 0: [0, 4.6], 8: [1.55, 4.6] };
const lift = (z) => (z < 5 ? 0.85 : z < 7 ? 0.42 : 0);
row((i) => ({ expr: 'happy', hold: { type: 'sack', s: 1 }, y: Math.abs(Math.sin(c.T * 8 + i)) * 0.16 }));
```

Offset each character's motion by its index (`+ i`) so the crowd never moves in unison.

## Pop-in with a counter

```js
let n = 0;
row((i, k) => { const t0 = 0.12 + k * 0.1, s = pop((c.t - t0) / 0.26); if (s > 0) n++; return { scale: s, expr: 'smile' }; });
setCard(`${n} PEOPLE`, 0.15);
```

One item every 0.1–0.13 s; the card counts with them. Use for any "there are N of X" line.

## Things flying in an arc

```js
arc(sprite, [x0, y0, z0], [x1, y1, z1], u, height, scale, spin);   // u 0→1
```

Fish jumping onto a dock, coins going from buyer to seller, goods from stall to customer. Stagger
several with `u - i * 0.07`.

## A value that escalates (the strongest device)

Same place, same framing, three shots joined with `cont`, each closer and bigger:

```js
const priceShot = (n, z0) => (c) => {
  cam(...mix([X, 1.85, z0, X, 1.75, 0.3], [X, 1.85, z0 - 0.5, X, 1.75, 0.3], c.u));
  tag.draw((g) => drawTag(g, n, n >= 100)).put(X, 1.3, 0.7, (n >= 100 ? 1.5 : 1.25) * pop(c.t / 0.2), n >= 100 ? Math.sin(c.T * 40) * 0.05 : 0);
};
S.twenty = priceShot(20, 7.6); S.fifty = priceShot(50, 7.0); S.hundred = priceShot(100, 6.5);
const TIN = { fifty: 'cont', hundred: 'cont' };
```

The last step turns red and shakes. Add a sound cue on each.

## Mascot and chalkboard

```js
crabScene(c, (g) => { chalk(g, '1', 108, 208, 124); drawFish(g, 226, 208, 0.66); chalk(g, '=', 322, 204, 100); chalk(g, '10', 428, 208, 110, '#ffe08a'); });
```

Use it three times: the rule (after setup), the turn (`BUT… / PROBLEM!`), the lesson (typed letter by
letter: `'INFLATION'.slice(0, n)` with an underline that draws in). Board canvas is 640×480 with the
writable area x 60–580, y 70–350. Keep text ≥ 86 px.

For another topic, redraw the mascot (an owl, a cat, a robot) by writing a new `draw…` function with
the same signature, or keep the crab.

## Reveal an interior

Outside shot ends on the character looking in, with a glow sprite in the doorway → `fade` → interior
built far away (dark backdrop plane + floor plane, both `MeshBasicMaterial` with `fog: false`) →
second interior shot with a camera tilt up and a fast counter (`100 → 9,999+`).

## Before / after with one prop swap

Hold a medium shot, then swap what the character holds behind a puff of white circles:

```js
const pu = (c.t - 0.75) / 0.45, after = pu > 0.35;
A(9, 4, 10, { expr: after ? 'sad' : 'neutral', tear: pu > 1.6, hold: after ? { type: 'fish', s: 0.6 } : { type: 'jar', s: 1.2 } });
setCard('= 1 FISH', 1.15);
```

## Group moods

| Mood | State |
| --- | --- |
| Celebrate | `expr: 'happy'`, `y: Math.abs(Math.sin(c.T * 8 + i)) * 0.16`, falling props (`shellRain`) |
| Dance | `tilt: Math.sin(p) * 0.17`, arms `1.7 ± Math.sin(p) * 0.9`, with `p = c.T * 9 + i * 1.3` |
| Cheer | arms `2.8`, staggered jumps `y: Math.max(0, Math.sin(c.t * 9 - rnd(i) * 1.2)) * 0.55` |
| Run | `run: c.T * 17 + i * 2`, `tilt: -0.13`, move the whole row and the camera with `dx = -(0.5 + c.t * 7.5)` |
| Deflated | `expr: 'flat'` or `'sad'`, `look: [0, 0.6]`, `grade('cool', 0.75)`, slow pull-back |
| Singled out | two characters only, `grade('spot')`, pop them in 0.5 s apart |

## Colour grading by story beat

| Beat | Call |
| --- | --- |
| Discovery, early morning | `grade('morning', 0.8)` |
| End of the day, "by sunset" | `grade('sunset')` |
| A problem, a loss | `grade('cool', 0.45…0.75)` |
| "Earlier…" / how someone got ahead | `grade('sepia')` |
| "But two people…" | `grade('spot')` |

## Sound cue map

| Event | File | vol |
| --- | --- | --- |
| Whip-pan | automatic | — |
| Number/price pops, money moves | `handleCoins.ogg` (long), `handleCoins2.ogg` (short) | 0.4–0.6 |
| Things hit or leave water | `splash_06/09/10.ogg` (short), `splash_02.ogg` (bigger) | 0.35–0.45 |
| A swap, a "poof", a pop | `bubble_02.ogg` | 0.7 |
| Fast movement inside a shot | `swish-7/8/9.wav` | 0.5 |

For other events (bells, boings, applause, crowd, impacts) take CC0 files from the audio library of
https://github.com/kaomei/stickman-video-director (`skills/directing-stickman-videos/assets/b-audio-library`,
774 effects with a `catalog.json` listing licence and source for each) and copy them into
`assets/audio/`. Add each to `assets/audio/CREDITS.md`.

## Shot plan of the example (use as a template for your own table)

| id | On screen | Motion | In |
| --- | --- | --- | --- |
| hook | Woman holding a fish; price tag beside her | Tag jumps 10 → 20 → 50 → 100, turns red; her face goes to shock | — |
| island | Same, camera flies up to show the whole island | Aerial pull-back | cont |
| people | Ten islanders | Pop in one by one, wave; card counts to 10 | whip |
| fish | Fisher on the dock | Ten fish leap out of the sea onto the dock; card counts | whip |
| shells | Shell pile between two islanders | Pile grows to 100; card counts | whip |
| price | Market stall | Shells fly to seller, fish flies to buyer; tag "10" | whip |
| simple | Crab + chalkboard `1 fish = 10 shells` | Board pops in, claw waves | whip |
| cave | Chief walks to a glowing cave mouth | Walk cycle, then shock | whip |
| full | Inside: mountain of sparkling shells | Mountain pops, sparkles | fade |
| thousands | Same | Camera tilts up; counter races to 9,999+ | fade |
| sacks | Chief + nine islanders | Sacks drop from the sky into each pair of hands, squash on catch | whip |
| rich / dance / cheer | Crowd | Jumping, dancing, low-angle cheering, shells raining | whip ×3 |
| run | Crowd running left | Camera tracks with them | whip |
| problem | Crab + board `BUT… PROBLEM!` | Second line appears; cool grade | whip |
| sea | Fisher on the dock, same ten fish | Slow pull-back | whip |
| still | Stall close-up | Each fish bumps as it is counted; card "STILL 10 FISH" | whip |
| paymore | Four buyers jumping with sacks around the stall | Staggered jumps | whip |
| theydo | Seller, smug, arms up | Close-up | whip |
| twenty / fifty / hundred | Price tag | Punch-in each time; last one red and shaking | whip, cont, cont |
| sunset | Crowd with huge sacks | Card "10× THE MONEY"; sunset grade | whip |
| dinner | Same crowd, each with one fish on a plate, flat faces | Card "SAME DINNER" | fade |
| two | Chief and Mara in a spotlight | Pop in one after the other | whip |
| chief | Sepia flashback at the stall, tag still "10" | Eight fish fly to the chief; card "OLD PRICES" | whip |
| boat | Chief on a fancy sailboat | Bobbing, waving | whip |
| mara | Mara hugging her jar | Gentle sway; card "30 YEARS" | whip |
| jar | Same | Puff; jar becomes one small fish; tear; card "= 1 FISH" | cont |
| nobody | Whole crowd, sad, chief smug | Pull-back; cool grade | whip |
| made | Shells pouring out of the cave past the chief | Stream of bouncing shells | whip |
| inflation | Crab + board | "INFLATION" typed, underline draws | whip |
