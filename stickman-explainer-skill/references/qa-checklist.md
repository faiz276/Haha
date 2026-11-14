# QA checklist

Go through every item. Fix and re-render the affected stills before the full render; the full render
is the expensive step.

## Script and voice (after `tts.py`)

- [ ] Duration is inside the target range (default 60–70 s).
- [ ] No sentence runs longer than 4 seconds in the printed timings.
- [ ] `caption-timing fallbacks` is small (a few is normal for very short sentences).
- [ ] Listen to `build/narration.wav` if you can. Check names and numbers are pronounced correctly.
      If you cannot hear audio, tell the user this was not checked.

## Stills (after `node render.mjs --sheet --scale 0.5`)

For every shot:

- [ ] The picture shows what the sentence says.
- [ ] Every character's face is fully visible; nobody is hidden behind another character or a prop.
- [ ] Nothing important is cut by the frame edge.
- [ ] Characters stand on the ground: no floating, no sinking, shadows present.
- [ ] Nothing (tree, post, roof) blocks the camera or fills the foreground by accident.
- [ ] The caption does not cover a face, a number or the key prop. If it does, move the camera or
      call `captionsTop()`.
- [ ] The card does not cover a face. Card text is ≤ 14 characters.
- [ ] Any number on screen matches the narration.
- [ ] The frame is not empty: there is a subject, a set piece behind it and sky or sea beyond.
- [ ] Consecutive shots differ clearly (place, framing or subject), except deliberate `cont` punch-ins.

Across the video:

- [ ] The first frame already shows the problem (it is the thumbnail).
- [ ] Each location is recognisable when the story returns to it.
- [ ] The mascot/board appears at least twice.
- [ ] At least three grades are used, each for a reason.
- [ ] `fade` is used 3–5 times, not everywhere.

## Motion (render short ranges: `--from A --to B --out build/part.mp4`, or stills 0.03 s apart)

- [ ] Whip-pans blur and land on the new scene without a flash of an empty frame.
- [ ] Pop-ins overshoot slightly and settle; nothing appears with no animation.
- [ ] Counters reach their final number before the shot ends.
- [ ] No shot is frozen: something moves in each.

## Final file (after `node mix.mjs`)

- [ ] `ffprobe` reports 1080×1920, 30 fps, h264 video, aac audio, duration as expected.
- [ ] Loudness is −17 to −14 LUFS and peak is below −1 dBFS
      (`ffmpeg -i out.mp4 -af ebur128=peak=true -f null -`).
- [ ] Review a contact sheet of the final file (2 frames per second) from start to end.
- [ ] The last second is not cut off: the final word is spoken and held.

## Report to the user

- The output path, duration and voice.
- What was checked by looking and what could not be checked (audio by ear, real-time motion).
- Known weak spots, plainly.
- The music credit line for the video description.
