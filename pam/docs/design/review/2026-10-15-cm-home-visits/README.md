# Case manager Home: who showed up (W4, 15 October 2026)

Iris's Case manager pass, W4: Home shows a name and points; nothing says who has a visit coming
up, who went or who missed one, though the sign-in slide promises "Know who showed up, without
chasing calls." Pictures only; nothing ships until Will picks. `proposal.patch` is the exact
change behind the "after" pictures (picture-only: stand-in words, and a third example member).

Shot in Storybook (`case-manager-screens--home`) with the same pretend data before and after:
Marcus has a visit on Saturday, Tanya's last visit was missed, Jordan's last was attended.
`home-before-after.png`: top row before, bottom row after; 320×568, 390×844, 320×568 Arabic, and
320 wide scrolled (English, Arabic) so all three cards show. `raw/` has each on its own.

## What each card says

One line under the name, the most useful fact first:

- **A visit coming up:** "Next visit: Sat 10:00 AM".
- **No visit coming, the last one was attended:** "Went Oct 14".
- **No visit coming, the last one was missed:** a warning chip, "Missed Oct 13" (the chip the card
  already has for "some things are off"; if both apply, that chip wins and the member's page says
  the rest).
- **No visits at all:** nothing, as today.

The line replaces "400 points" on Home. Points are one tap away on the member's page. If Will
wants both, a second line fits at 390 and at 320, at the cost of about one card fewer in view.

## Inside what a case manager already sees

Nothing new is revealed: visits and whether the member went or missed one are in the member's own
list of what a case manager sees (`transparency.canSee.appointments`, "Your visits, and if you
went or missed one"), and the member's page already shows them. "Missed" is the status the
database sets a day after an unmarked visit (D-526 part C).

## Cost to build

One `appointments` read for the whole caseload (`member_id in (...)`, not one per card), under the
case manager's existing rule (`appointments_select_admin`, D-509). Piper's lane. It needs a
fixture for it in the pretend database; the one from P2 (D-581) is the start.

## Words

"Next visit", "Went", "Missed" and the Arabic ones in the Arabic picture are my stand-ins. Sage
writes the real English, Lena the rest (A29). Arabic needs a form that fits a member of either
gender, so Lena's call matters there.

## For Will to pick

1. Is the one line right, or should Home also sort whoever missed to the top?
2. Points off Home, or kept as a second line?
