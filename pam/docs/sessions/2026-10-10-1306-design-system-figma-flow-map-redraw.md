# 2026-10-10 — Design system & Storybook (Dot): the Figma flow map, redrawn

**Branch:** `claude/pam-design-flow-map` · **Lane:** Design system & Storybook

Job from Mira (third after the shell and the scroller clip): redraw the map's Overview, Sign in, Member and
Program lead pages from `flows.mjs` on the merged tree, with real screenshots and a link to each screen's
story. Case manager and Super admin wait until D-446 is on `main`.

## What changed in the map

Figma file "PAM — User flows" (`DtlJg9Klx5BRfHbXBhkg98`): **0 · Overview, 1 · Sign in & joining, 2 · Member,
4 · Program lead** redrawn (5, 13, 26 and 21 screens), 65 real screenshots placed from `user-flows-out/shots/`
(390x844, light) on the cards, and an "Open in Storybook" link under every screen (`no story yet` on the invite
link preview, which has none). Looked at the Overview and the Program lead page in Figma; the Member and
Sign in pages were drawn and filled by the same script and counted (26 and 13 cards) but I did not look at them.

`flows.mjs` was not changed on this branch beyond what was already there; the screens are the merged app's
(staff show the old Home with its people strip, D-456), so the pages draw that.

## What was wrong, and what missed it

- **The generator lost the backslashes in its title-matching regex** (`/^\d+\s*·\s*/` came out as
  `/^d+s*·s*/` in every drawing script, because the source sits in a template literal). The "a page is found by
  its title, not its number" safeguard in the skill (added after a duplicate Member page, 10 October) therefore
  never worked: a renumbered page would have been drawn a second time. Fixed (`\\d`, `\\s` in
  `user-flows-figma.mjs`); it works today only because the pages kept their names.
- **Pages 3 · Case manager and 5 · Super admin are blank in the file** (no children when I listed them before
  drawing). Not something this job did; they were that way when I started, most likely since the duplicate-page
  clean-up. Left alone as Mira said (they wait for D-446), but a visitor to the file sees two empty pages.

## Verified

| Check | Result |
|---|---|
| `build-storybook`, `user-flows.mjs`, `user-flows-figma.mjs` on the merged tree | pass; 91 shots, 5 flows + overview |
| HTML pages before drawing | member page looked at; nothing overlapping |
| Figma: cards drawn | 13 + 26 + 21 + overview, arrows 10 + 29 + 27 |
| Screenshots uploaded and placed | 21 + 26 + 13 + 5 = 65 of 65 (each matched by slot name, not by list order) |
| Chromatic link | `main--...chromatic.com/?path=/story/member-created--explore` and its `iframe.html` return 200; I did not open a story in a browser |

## Left undone

- 3 · Case manager and 5 · Super admin: blank, waiting for D-446 in `flows.mjs` on `main` (not there yet).
- Member, Sign in pages: not looked at in Figma beyond counts.
- The map has not been updated for the shell's own changes to what a screen is for (a role's tab bar is now
  in the app; Home for staff is the old Home): the stories show it, the notes and "latest changes" do not say so.

## Needs a human

- Nothing.
