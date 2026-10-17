# 2026-10-17 — accounts a93 rows not cards

**Branch:** `claude/pam-caseload-visit-line` · **Lane:** Accounts & invites (Ava)

## What changed

Will looked at the a93 case manager Home (card a93, 15:12) and said two things, relayed by Mira:

- "I don't like that you wrapped those items inside white background cards with shadow. There's no need for that."
- The unmarked visit should look like "Marked as there: Oct 16", on one line; "Not marked" in red.

Built on `main` 2de80122 (merged first; one conflict in STATUS.md, this lane's two sections, kept main's "live in b53").

- `PersonRow`'s compact form (only the case manager Home uses it) is a row, not a `Card`: the page behind it, 64px
  tall, a `--color-border` line under it. `PeopleHomeView` puts the rows in a `role="list"`, so each is a listitem.
- `PersonRow` takes `isMetaAlert`: the line under the name in `--color-text-red` (Dot, 15:20). `HomePerson` carries it.
- `CaseloadHome`: `lineAndChip` is gone; `visitLine` gives the one line and sets `isMetaAlert` for a missed visit. The
  status chip (switched off) is unchanged and independent of the visit line.
- Invite someone and What you can see: the `MenuList` without its `Card` and without `isInset`, so it is flush with the
  page like the members above (D-439).
- Removed from a93: the chip's `detail` and `spoken`, `ChipBlock`, and the use of `caseload.visit.missed.chip`
  (`PersonRow.tsx` is back to `main` plus the row change). Lena removes the key.
- D-596, the changelog fragment and STATUS say the new look.

## What was wrong, and what missed it

- `admin.spec`'s contract test found the member by `.astryx-card`; it now finds the listitem. A class selector was
  the only thing tying it to the card.

## Decisions made

- None new: amended D-596 (unmerged) with "Changed after Will saw it". Read "those items" as everything on the list,
  as Mira did.
- The red is Dot's `--color-text-red` (11.8:1 light, 9.6:1 dark). The line wraps like the next-visit line; no nowrap,
  no cut (Mira, 15:18).

## Verified

- `tsc` clean; `@pam/config` tests 1353 passed.
- `admin.spec` a93 test now checks: the unmarked line is one line, "Not marked as there: Oct 15" style, a different
  colour from "Marked as there"; no listitem on the list has a shadow or a background; each is at least 48px tall.
- Full e2e: see the READY.
- Storybook built; pictures at 390 and 320 (top and scrolled), light and dark, English and Arabic, and Russian at 320 (the red line wraps to two, uncut), in
  `docs/design/review/2026-10-17-cm-home-rows/`. Measured in the story: member rows 73px, the two rows 64px, no
  shadows, transparent backgrounds.

## Left undone

- What you can see moves to Dot's standard drawer later.

## Needs a human

- Will's yes on card a93.
