# 2026-10-10 — Design system & Storybook (Dot): the Figma flow map, redrawn

**Branch:** `claude/pam-design-flow-map` · **Lane:** Design system & Storybook

Job from Mira (third after the shell and the scroller clip): redraw the map's Overview, Sign in, Member and
Program lead pages from `flows.mjs` on the merged tree, with real screenshots and a link to each screen's
story. Case manager and Super admin wait until D-446 is on `main`.

## What changed in the map

Figma file "PAM — User flows" (`DtlJg9Klx5BRfHbXBhkg98`): **0 · Overview, 1 · Sign in & joining, 2 · Member,
4 · Program lead** redrawn (5, 13, 26 and 21 screens), 65 real screenshots placed from `user-flows-out/shots/`
(390x844, light) on the cards, and an "Open in Storybook" link under every screen (`no story yet` on the invite
link preview, which has none). Later the same day, on Mira's next note: **3 · Case manager (16 screens) and
5 · Super admin (15)** drawn from `main`'s `flows.mjs` the same way, so no page in the file is blank; a
`note` field on each flow says the tab bar is live in the app (D-456) and, for the case manager and program
lead, that Home is still the old Home with its people strip until the rings are on the new one (card a22).
All five pages and the Overview looked at by eye (top of each, a cropped copy rendered in Figma, then deleted).

`flows.mjs` was not changed on this branch beyond what was already there; the screens are the merged app's
(staff show the old Home with its people strip, D-456), so the pages draw that.

## What was wrong, and what missed it

- **The generator lost the backslashes in its title-matching regex** (`/^\d+\s*·\s*/` came out as
  `/^d+s*·s*/` in every drawing script, because the source sits in a template literal). The "a page is found by
  its title, not its number" safeguard in the skill (added after a duplicate Member page, 10 October) therefore
  never worked: a renumbered page would have been drawn a second time. Fixed (`\\d`, `\\s` in
  `user-flows-figma.mjs`); it works today only because the pages kept their names.
- **Pages 3 · Case manager and 5 · Super admin were blank in the file** (no children when I listed them before
  drawing; most likely since the duplicate-page clean-up). Drawn in the second round (above). They will be
  redrawn when D-446 is in `flows.mjs` on `main`.
- **The legend line ("Updated ... orange tag ...") ran into the arrow labels on Member and into the
  intro on Sign in, and had since the layout was written**: the lanes for the long arrows run at y 222 to 253
  under the title block, the legend sat at 236. I only saw it because Mira asked for every page to be looked at;
  my first attempt, a longer intro with the shell note in it, made it worse on Program lead and Case manager
  (found by the same look). Fixed: the legend wraps beside the kicker, the note under it, intros unchanged
  (`user-flows-figma.mjs`, `note:` in `flows.mjs`).
- **Two uploads "succeeded" and placed nothing**: the Case manager screenshots returned `success: true`
  without `placedOnNodeId`. Caught only because I checked each slot for an image fill afterwards (0 of 16),
  and re-uploaded with `currentPageId`. The upload response, not the HTTP status, says whether it landed.

## Verified

| Check | Result |
|---|---|
| `build-storybook`, `user-flows.mjs`, `user-flows-figma.mjs` on the merged tree | pass; 91 shots, 5 flows + overview |
| HTML pages before drawing | member page looked at; nothing overlapping |
| Figma: cards drawn | 13 + 26 + 16 + 21 + 15 + overview, arrows 10 + 29 + 12 + 27 + 13 |
| Screenshots uploaded and placed | 65 + 31 = 96 of 96 (matched by slot name; the Case manager slots confirmed as image fills after a re-upload) |
| Chromatic link | `main--...chromatic.com/?path=/story/member-created--explore` and its `iframe.html` return 200; I did not open a story in a browser |

## Left undone

- Redraw Case manager and Super admin when D-446 is in `flows.mjs` on `main`.
- The HTML pages (`user-flows-out/*.html`) still have the old legend position; only the Figma drawing was fixed.

## Needs a human

- Nothing.
