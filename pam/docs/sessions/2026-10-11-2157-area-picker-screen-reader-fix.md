# 2026-10-11 — Area picker screen reader fix

**Branch:** `claude/pam-design-area-picker-a11y` · **Lane:** Dot, Design Systems Lead · **Decision:** none new; the area search is D-540

## What changed

`packages/ui/src/SearchPill.tsx` (`SearchField`): the field's own label is left empty, because inside an `InputGroup` Astryx names the input by the group's label and its own, so one label was read twice; `placeholder` is optional; a new `describedBy` links a hint to the input. `apps/web/src/app/places/AreaPicker.tsx`: no placeholder (it repeated the label), and the hint "Like 19107, or Fishtown." has an id the field points to. New e2e in `area-picker.spec.ts`, English and Arabic at 320.

## What was wrong, and what missed it

Iris (b20) heard the name twice. The cause was the double label (`aria-labelledby` listed the group's label and the input's own, same words), not the placeholder alone; the placeholder was a second, smaller copy. An input in a group cannot take Astryx's own `description` (the element is never drawn there), so the hint is linked on the input itself. No test read the accessible name and description.

## Verified

New spec passes in en and ar at 320; `area-picker`, `places`, `places-without-a-lead`, `focus-text-boxes`, `a11y`, `admin` and `shell-flash` pass at narrow-320; web typecheck and build pass.

## Left undone

The four other `SearchField` screens (Messages, new message, Connect, Schedule) get the single name too, since the field is shared; they still pass their own placeholder. Whether those placeholders also repeat their labels is a look for their owners.

## Needs a human

Nothing.
