# Changes — Meelad Programme Helper (updated 2026-09-20)

Base: user's `public_html (5).zip` upload, plus the fixes below.

## 1. Multi-judge marking (final out of 10) — `index.html`
- Before: one shared Points box per student; last save overwrote everything.
- Now: every judge assigned to a competition gets their **own marks column** in
  Judge Panel / Results (`compJudges()` = judges assigned to that comp).
- EVERY judge marks **out of the full competition max** (default 100) in
  their own column — e.g. Judge 1 gives 60, Judge 2 gives 70. Boxes validate
  0–max and block Save with an error naming the judge + student.
- A logged-in judge can edit **only their own column** (other columns disabled);
  admin sees/edits all columns.
- Marks stored per judge in new `S.marks[]` (`{compId, studentId, judgeId,
  judgeName, points}`); each judge marks **out of the full competition max**
  (default 100). Student **final = average scaled to 10**:
  60 + 70 = 130 ÷ 2 = 65 → 65 × 10 ÷ 100 = **6.5**; 3 judges → ÷ 3 then
  × 10 ÷ max, and so on — empty boxes are skipped, not counted as zero.
  Positions auto-ranked from the final with tie-sharing (`rankComp()`).
- Competition Add/Edit modal has a new **"Max Marks per Judge"** field
  (blank/0 = 100 — the final always auto-scales to 10).
- One-time migration (`resScale10` flag in `loadState`/`hydrateFromServer`/
  import): results saved earlier at 100-scale are converted to 10-scale
  (`points × 10 ÷ comp max`), so old scoreboards keep their order with the
  new numbers. Team/student/scoreboard totals now sum these /10 finals.
- Grade stays free text and does not affect ranking.
- Old pre-change totals are kept as legacy results until per-judge marks are
  entered for that student.
- Cleanup paths updated: deleting a team/student/competition/judge also
  removes/recomputes the related per-judge marks. Full backup import/export
  and team export include `marks`.

## 2. TV scoreboard display page — `display.html` (new file)
- Separate full-screen page showing **Overall Rankings only** (no Prathiba
  awards): dark theme, large fonts, gold/silver/bronze top-3 rows, event name,
  logo, LIVE clock.
- Auto-refreshes from `api.php` every 10s (+ manual Refresh, Fullscreen
  buttons); falls back to the TV browser's cached copy if offline.
- Scoreboard tab in the admin app has a new **📺 TV Display** button that opens
  it in a new tab.

## Files in the zip
- `index.html`, `poster.html`, `display.html` (new), `api.php`
- `data/state.json` (your current data), `data/.htaccess`, `data/index.php`

## Deploy notes
- Upload the zip contents to `public_html`, preserving the `data/` folder.
- `API_KEY` in `api.php` must match `API_KEY` in `index.html` /
  `display.html` (currently the default `change-me-please` — set a private
  value in all three files).
- PHP's built-in/dev servers ignore `data/.htaccess`, so on real hosting
  (Apache/cPanel) the file protection applies; still, all passwords in
  `data/state.json` are plaintext — rotate the admin/team/judge passwords
  after deploying.
