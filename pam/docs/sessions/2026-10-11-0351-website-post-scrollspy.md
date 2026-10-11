# 2026-10-11 — website: On this page menu (scrollspy) for help posts

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** Public website (Wren), job from Will via the merge desk (02:49 UTC)

## What changed

- `components/PostNav.tsx` (client): side column and top bar; `lib/sections.ts`, `lib/slug.ts`; `Section` carries an id, a `data-post-section` label and `scroll-margin-top`; `StillStuck` is the last stop; `PostScreen` lays the post and the column in a grid; `globals.css` sets `--post-scroll-offset`.
- `CaseManagerAssignments` used raw headings; it now uses `Section` so it has a menu.
- `scripts/scrollspy.mjs`; `test/sections.test.ts`.

## What was wrong, and what missed it

Three glitches, all found only by the browser script, none by a unit test:
1. On a phone the list closing above the target moved the page under a smooth scroll, so the heading landed hidden under the bar (top -96px). Fix: close the list, wait for the page height to settle, then scroll.
2. A heading scrolled *up* to never crosses the line the observer watches, so the mark stayed on the wrong section. Fix: look once when the scroll arrives (`scrollend`, with a timer where it is missing).
3. The last sections of a short post cannot reach the top, so the mark fell back to the one before as soon as the lock ended. Fix: keep the tapped section marked until a manual scroll. The first version of the test passed only because the lock outlasted its wait.

## Decisions made

D-517.

## Verified

| Check | Result |
|---|---|
| `scripts/scrollspy.mjs` | 249 section links in 16 posts at 320, 390 and 1280px: 0 problems, with reduced motion and with `SMOOTH=1` |
| `@pam/site` tests | 59 passed |
| Site a11y (axe) | 105 scans, 0 problems |
| Typechecks, site build, build-storybook | pass |
| Look | the menu at 1280px, and the bar closed and open at 390px |

## Left undone

- Iris's usability pass, and what she finds.
- Short labels from Sage (the menu shows the headings until then).
- The menu has no search for the post.

## Needs a human

Nothing.
