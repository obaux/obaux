# A mark for "signed every policy" (Iris's program lead pass, P5; asked by Piper, 15 October 2026)

Pictures only; nothing ships until Will picks. `proposal.patch` is the picture-only change behind
them (the marks are chosen with `?mark=` in the story's address; it is not for merging as is).
Shot in Storybook, `program-lead-states-home--week` (Coming in), light, dark, 390 and 320 wide, and
Arabic. `marks-in-context.png` has the four marks side by side; `unsigned-options.png` is question 2.

## Why the pen reads as "edit"

The app already uses the pen for the other thing (D-270): `SignIcon`, the pen, is **a policy still
to sign** (orange, on the policy card and the trip card), and `SignedIcon`, a tick in a circle, is
**a policy signed**. D-316 then used the pen, in green, for "signed every policy", the opposite of
what it means everywhere else, and it is the usual edit icon besides. So the fix is not a nicer pen.

## 1. The mark

A circle with a tick is taken twice already: it is each signed policy in the popover (D-369) and the
check-in circle at the end of a visit's row (D-316). Beside the name it would read as "checked in".
So the mark has to be a different shape that still says "done":

- **A. A document with a tick (recommended).** The thing that was finished is the paperwork, and the
  shape is a page, so it can't be mistaken for a check-in circle or a pen. Green (the success
  colour); about 22px, the pen's size. Reads in dark, at 320 and in Arabic (it does not flip: a
  tick is not directional).
- **B. A seal with a tick.** Reads as "approved", but it is round with a tick: next to a check-in
  circle it is the same shape at the same size. Not recommended.
- **C. A shield with a tick.** Reads as "safe" or "protected", which is a claim about the person
  that this isn't. Not recommended.

The green circle behind the mark goes: a plain green document is lighter and the row is quieter.

## 2. People who haven't signed everything

**Recommended: nothing.** The absence is enough, and D-261 chose it on purpose ("a half-signed
person has no mark, not a half one"). On Coming in most people have signed nothing yet, so a mark on
them would be on most rows and would stop meaning anything. When a lead opens a person who hasn't
signed, their page already says it (D-324: "{first name} needs to finish signing on their device").

**Alternative, drawn (`unsigned-options.png`):** an amber pen on everyone who has not signed. It
uses the pen the way D-270 does ("to sign"), but on a day like the one pictured it is on half the
rows and reads as a warning list. If Will wants it, the lead's real question ("who still needs to
sign?") is better answered once on the page than on every row.

## Words

None new. The mark keeps its existing label (`verified.short` on Coming in, `verified.label` on the
member's page); an unsigned mark, if Will picks the alternative, would need one new label for Sage
and Lena ("still to sign" in the picture is a stand-in).

## Build (Piper)

`SignedMark` in `screens/VerifiedBadge.tsx` draws a new icon (add it to `packages/ui/src/icons.tsx`
as `SignedDocIcon`, with the note and a story) in place of the pen in a circle; both places that
use it change together (Coming in, `ScheduleView`, and the member's page, `VerifiedBadge`).
