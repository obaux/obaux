# 2026-10-09 — Arabic: a name or an address in a sentence stays in one piece

**Phase:** 1 (member flows) · **Sessions so far:** many; the other three live
that day were `claude/gallant-clarke-0dhizj` (the languages, then the text-fit
baseline), `claude/affectionate-goldberg-tvu4sz` and `claude/compassionate-bohr-mzrchf`.
This one is `claude/amazing-archimedes-qvgnt2`, from `main` at `8dee5d4`. Not
merged; Will decides.

## What changed

The text-fit audit of that day found that a left-to-right value written into an
Arabic sentence is reordered by the browser: `places.near` ("بالقرب من {area}")
with `1231 N Broad St, North Philadelphia` drew `… St, North Philadelphia 1231
بالقرب من` — the number beside the Arabic words and the rest of the address on the
far side, and the ellipsis cutting the middle of it.

- **The fix (D-435).** `fillTemplate(template, vars, dir)` wraps each *text* value in
  U+2068 … U+2069 (first-strong isolates) when the language reads right to left;
  left-to-right languages are byte for byte as before. Numbers, and empty values, are
  not wrapped; isolates in a value are balanced so it cannot close ours early.
  `isolate`, `stripIsolates` and `splitIsolated` are in `packages/config/src/i18n.ts`.
- **`t` and `tPlain`** (`apps/web/src/lib/i18n.tsx`). `t` isolates for the active
  language; `tPlain` is the same lookup with nothing added. 41 call sites in 29 files
  moved to `tPlain`: accessible names (icon buttons, cards, the role switch, sheets,
  back buttons, star toggles), `alt`, text only a screen reader reads, and the text
  given to a share sheet. Everything drawn stays on `t`. `shareText` and `copyLink`
  also strip U+2068/U+2069 as a backstop.
- **The area chip** gives an isolated value a box of its own, so a line too long for
  it ends in an ellipsis at the end of the address instead of cutting its street
  number. No other language's chip changed (English screenshot byte-identical).
- **A guard.** `audit:fit` has a sixth detector, `isolate` (an isolate in an `aria-*`
  attribute, `alt`, or visually-hidden text). `ar` is in the CI job. Its ellipsis
  rule was also made consistent (below). The rule for the next session is in
  `CLAUDE.md`.
- Stories: `AreaChip › Arabic`; `useStoryText({ plain: true })` and the five stories
  that build accessible names with it.
- No screen was added or rewired, so no change to the user-flow map.

## What was wrong, and what missed it

- **Nothing could see the order.** The fit audit measures width, clipping and overlap;
  it has no idea which word is drawn where, so `1231` beside the Arabic words looked
  fine to it. What found it was a person reading a screenshot. What would now catch a
  *regression*: unit tests on the string (`packages/config/test/isolates.test.ts`), and
  for a *new* misordering — nothing automatic. I measured order for this session by
  asking the browser where each character was drawn and sorting by x, because I could
  not read a colon's or a full stop's side off a screenshot with confidence. That script
  is not in the repo; it is a short Range-per-character loop over a story's text nodes.
- **Reading call sites would have found about a tenth of the leaks.** I found one by
  reading (`places.changeArea` built from the visible `near`, putting isolates inside an
  `aria-label`). Scanning every story in Arabic found **240**: 143 `aria-label`, 92 in
  `VisuallyHidden` text, 4 `alt`, one tooltip. The hidden-text and `alt` sinks were not
  on my list at all. Do the scan, not the grep.
- **The story helper hides a difference from the app.** `useStoryText` turns
  `count=2` into the string "2" (so Spanish reads "1,2"); the app passes the number.
  In Arabic that made story-only isolates in `NavTile`, `NotificationBell`, `AppHeader`
  and others that the app does not have. Fixed with `{ plain: true }` in those stories;
  noted here because the next detector hit that "can't be real" may be this.
- **The first screenshot diff was wrong in a way that looked right.** 16 of 74 stories
  "changed" and one showed a blank "after". Five were stories still loading when
  captured (identical on a calm re-capture); I only knew because I re-took them rather
  than reporting 16. If a before/after diff shows a blank, re-capture before believing it.
- **The order fix was not the whole fix.** With isolates alone the address read
  correctly, but the ellipsis then cut `1231 N B` (a right-to-left line is clipped on
  the left, and the left of an English address is its number). That is the second
  symptom in the report, and isolation cannot fix it: the address needs its own box.
- **The audit's own detector counted an ellipsis as a sliver.** Its rule for "a line
  box overhanging its clip by a sliver loses no glyph" (under 20%) treated a line an
  ellipsis was trimming by 17% as fully visible, and reported it overlapping the
  words beside it. The script's comment already said a trimmed line "still reports its
  full width"; the rule now agrees. Both builds were re-run under the same detector so
  the before/after counts are comparable (153 and 153).
- **Two sessions took D-434.** I claimed it at 16:54 UTC (pushed). `gallant-clarke`
  took it at 17:13 and wrote its decision, `fit-known.json` reasons and code comments
  around it; its commit message names goldberg's and bohr's numbers but not mine, and
  my branch then held one changed line. `numbering.test.ts` cannot see another branch (it
  says so). I moved to D-435 rather than touch their branch, re-claimed before writing
  anything else, and renamed my own references. Changelog 0.51.1 is also claimed.

## Decisions

- D-435 — A value written into an Arabic sentence is laid out as a piece of its own
  (numbers not wrapped; `t` / `tPlain`; where each is used; the area chip's box; the
  guard; what was not judged).

## Verified

| Check | Result |
|---|---|
| `@pam/config` tests | 723 pass (20 files); 24 new, in `isolates.test.ts` |
| `@pam/ui` tests | 84 pass (8 files); 5 new (share/copy scrub, area chip) |
| `@pam/web` unit tests | 48 pass |
| `pnpm -r typecheck` | clean, 5 packages |
| Mutation checks | RTL ignored → 7 Arabic tests fail; wrapping in every language → 2 fail; wrapping numbers → 2 fail; no balancing → 1 fails; an isolate put into the email → 1 fails; share not scrubbed → 1 fails; copy not scrubbed → 1 fails. Each was restored and the suite re-run green |
| `pnpm --filter @pam/web build-storybook` | passes, 470 stories outside Foundations, no `[journey] no fixture` |
| `audit:fit --locales ar`, isolates in spoken places | 240 before the call sites were fixed, **0** after, 470 stories, 0 unmeasured |
| `audit:fit --locales ar`, layout defects, same detector, before / after | **153 / 153**; the only difference is the area chip's long address: its `spill` is gone, its designed ellipsis is on the address's box |
| 320px, Arabic stories with a value on screen (74), pixel diff | 58 identical, 5 timing noise (identical on re-capture), 11 differ: 7 change the order words are drawn in, each for the better (measured from character positions), 4 differ by a pixel or two with the same order |
| `AreaChip › Long address`, English | byte-identical screenshot before and after |
| First-load JS (`check-bundle-budget.mjs`) | 545.1 kB of 600 kB, 54.9 spare (was 544.6) |
| Browser suite (Playwright, 3 projects, `pnpm build` first) | **828 pass**, 0 fail (7.3 minutes, 3 workers), on this branch before the comment-only renames of D-434 to D-435 |

## Left undone

- **Nothing was run with a screen reader**, or read by anybody who reads Arabic. Both are
  in `docs/before-launch.md` and `STATUS.md` (row 37).
- **At merge with `gallant-clarke-0dhizj`:** its `scripts/fit-known.json` needs two
  `ar|ellipsis|…` entries for the long address (`components-inputs-areachip--long-address`
  with the text `1231 N Broad St, North Philadelphia`, and the new
  `components-inputs-areachip--arabic`; reason: "a long address ends in an ellipsis by
  design, and the end of it is what is lost"), and its `ar|spill|…long-address` entry
  becomes unused. Both sessions also add to the same end of `DECISIONS.md`, `STATUS.md`
  and `CHANGELOG.md`; the second to merge resolves those by keeping both.
- **An Arabic email** with a multi-word English inviter name has the same ordering
  fault; the fix there is an HTML `<bdi>` (not a character). Not done: Arabic email is
  not signed off or sent.
- **Other one-line rows** (conversation rows, trip cards, connection cards) still cut
  at the left edge, which in Arabic is the end of the sentence. The area chip is the
  only one whose last thing is an address that starts with a number.
- **A call site no story reaches** was checked by reading only: `join.program.services.remove`,
  `staff.label` on the place screen, the share text in `InviteReady` and `NewTripView`.
- Not run: the database suite (nothing in `packages/db` changed), Chromatic.

## Needs a human

- **A native Arabic reader**, for what I could not judge. Where a colon or full stop lands
  beside an English word (`:Pam`, `then.`) is right by the bidi rules and has never been
  seen by someone who reads Arabic. Whether an English value in the *middle* of a sentence
  reads better isolated or flowing with it is a judgement, not a rule. Nothing in the six
  new bundles has been read by a native speaker either (STATUS row 34).
- **A screen reader** (VoiceOver and TalkBack on a phone; NVDA if it can be had) over the
  Arabic labels. I kept isolates out of every accessible name rather than assume they are
  ignored, so this is a check that the labels read well.
- **Will:** the merge. And which of the two D-434s stands: `gallant-clarke` holds D-434 (the
  text-fit baseline) and this work is D-435.
