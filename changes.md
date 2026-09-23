# Changes — Meelad Programme Helper (updated 2026-09-22)

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

## 2. 📢 Announcement — approve results before they go public — `index.html`
- New **Announcement** tab under Management. Every competition whose results
  are saved appears here with Saved count, Live/Pending status and an
  **Approve checkbox** (`toggleApprove()` → `S.approved[compId]`).
- Until approved, that competition's scores are hidden from **Scoreboard,
  Top Students, team dashboards and the 📺 TV Display** (all point-sum
  helpers — `stPts`, `stStagePts`, `stNonStagePts`, `tmPts`, `tmCatPts` —
  skip un-approved comps). Judges/admins still see the saved marks in the
  Judge Panel. `delComp` clears the approval key too.
- Old data auto-approves once (`ensureApproved()` in `loadState`/
  `hydrateFromServer`/import), so existing live scores never vanish after
  the update. New marks start Pending until you tick Approve.
- Judge Panel infobox + save toast now point to Announcement; TV page shows
  a "⏳ Some results awaiting announcement" note while anything is pending;
  Poster Generator labels each comp ✅ live / ⏳ pending in its dropdown.

## 3. Top Students shows ALL students — `index.html`
- Removed the top-15 cap (`slice(0,15)`) from Overall, Stage and Non-Stage
  lists — every student in the category is ranked (un-scored students show
  0 at the bottom instead of "No results yet").

## 4. Chest-card background upload — `index.html`
- Settings has **Chest Card Background URL + Upload** (`S.config.cardBg`,
  removable via ✕). `chestCardHTML()` prints cards over it with a soft
  white veil so names/QR stay readable — leave empty for the plain card.

## 6. Program serial numbers (1, 2, 3…) everywhere — `index.html`, `poster.html`
- Competition Add/Edit modal has a new **"Program No"** field (`c.sl`).
  Existing competitions auto-get numbers once (`ensureCompSl()` in
  `loadState`/`hydrateFromServer`/import, same pattern as earlier migrations);
  cards show them as **#N badges**, lists as **"N) Name"** prefixes.
- Everywhere a competition is listed now sorts by Program No and shows the
  number: Competitions grid, Attendance dropdown, Judge Panel / Results,
  judge-assign checkboxes, Team Register, My Competitions, Search, PDF
  buttons + PDF headings, student-modal rows, participation chips,
  `viewCompParts` title, result-entry title — and the Poster Generator
  dropdown (also sorted). Announcement has a new **No** column.
- Approving stamps the time (`S.approvedAt[compId]` in `toggleApprove()`,
  cleared on un-approve and on `delComp`), so "latest approved" is exact.

## 7. "After Program N of T" progress line — `index.html`, `display.html`
- Admin **Scoreboard** shows a green note under the Rankings ribbon
  (`progNote()` from `apprProg()`): **"After Program N of T (#N Name) —
  team totals above include N announced programs; M still to go"**
  (or "all announced 🎉" / "No programs announced yet — 0 of T live").
- The 📺 **TV Display** shows the same line under its ribbon (`#progLine`,
  mirrored `apprProg` logic since it has its own script): e.g.
  **"After Program 1 of 2 (#1 kannada song) — team totals include 1
  announced program; 1 still to go"** — so viewers instantly know how many
  programs are done and how many remain.

## 5. TV scoreboard display page — `display.html` (new file)
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
