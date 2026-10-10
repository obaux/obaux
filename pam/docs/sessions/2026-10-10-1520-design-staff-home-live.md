# 2026-10-10 — design staff home live

**Branch:** `claude/pam-design-staff-home-live` · **Lane:** design system & Storybook (Dot)

## What changed

Will's answer on a22 ("Rebuild into the new home for staff, create an empty state with faint circle slots and
the first circle is a (+) to invite someone"), relayed by Mira.

- `HomeScreen` sends case managers to `CaseloadHome` and program leads to `ProgramHome` (the D-477 Homes, with
  the rings row). Deleted `LegacyHome`, `HomePeople`, `HomePeopleLazy`, `HomePeoplePreview(+Lazy)`,
  `SavedStripLazy`, `HomePeopleSection`. `/admin/` is the invite page again.
- `PeopleStripEmpty` in `@pam/ui`: faint dashed `aria-hidden` slots, a (+) link first (44px+, name
  "Invite someone" = `profile.menu.invite`, so no new strings). `StaffPeopleRow` picks strip, examples or empty.
- Invite targets: case manager `/invite/new/?role=member`; program lead `/invite/`.
- `lib/examplePeople.tsx`: examples are off for a just-signed-up account (`isFreshAccount`, D-361). Without it
  the demo (`USE_DUMMY_PEOPLE`) would hide the empty state from everyone.
- Stories: PeopleStrip Empty / EmptyArabic / EmptyRussian, case manager Home Empty / EmptyArabic, program lead
  Home Empty (mock option `noPeople`). Existing full / few / long-names stories kept.
- e2e `staff-home.spec.ts` (5 tests): both roles land on the new Home; the (+) reaches each invite flow; axe.

## What was wrong, and what missed it

I wrote a decision number in code comments before claiming it (D-478 was taken). Third time; caught at the
claim and fixed. Rule kept: claim first, then write the number.

`people-strip.spec.ts` (super admin previewing a case manager) relied on unstubbed people calls and on the old
Home; it now stubs an empty list and an empty caseload, which is the case it describes.

## Decisions made

D-486.

## Verified

tsc clean; web 91 and ui 117 unit tests; `build-storybook`; web build with the bundle budget (about 24.8 kB
spare); `audit:fit` on the three story groups in en, es, pt-BR, zh-CN, zh-HK, ru, ar and pseudo: nothing new;
`staff-home` and `people-strip` specs in all three projects; one full Playwright suite (see the READY).

## Left undone

Figma map: the case manager and program lead Home screens still show the old design until the next refresh.
Program lead/super admin pages wait on "Your programs" and Piper's part 6.

## Needs a human

Nothing new. Mira to merge `claude/pam-design-flow-map-2` (c561616) and this branch.
