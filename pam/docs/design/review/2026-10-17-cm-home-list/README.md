# Case manager Home: Invite someone and What you can see, in a list under the cards (card a93, Will 17 October 2026)

Pictures only; nothing ships until Will agrees. Ava builds it. `proposal.patch` is the change behind the pictures (to `StaffHomes.tsx`, on top of the W4
visit lines Will chose on a93 earlier, which are picture-only in these shots: they are not built yet).

- `home-390.png`, `home-320.png`, `home-320-ar.png`: the foot of Home, and the sheet open. Light and dark at 390 and 320; Arabic at 320.
- Under the member cards, one card with two rows between a line: "Invite someone" (moved up from the corner of the bar, where the floating button sat) and
  "What you can see". Same row look as Profile and a place's quick actions (icon, words, chevron, 64px).
- "What you can see" opens a bottom sheet, the same kind as a place's hours sheet (`BottomSheet`, no outline, handle, its own Close, focus lands inside): its title and
  today's words, the four items and "They were told exactly this." Nothing is reworded; it is the same promise to members (§4.1), one tap away.
- The floating "Invite someone" is gone from this Home (the other staff Homes keep theirs); the 12px paragraph and its heading at the foot are gone.
- Eye icon on "What you can see" is the existing `EyeIcon` (D-416: what somebody can see). No new words.

## Sage's visit-line words (06:06) and the chip's tone

The line under a name now reads "Next visit: {when}", "Marked as there: {date}" or, for a visit nobody marked, a dark chip "Not marked as there" with the date under it. (Went and Missed
are gone: an unmarked visit is not proof of a miss.)
- The chip keeps Will's dark look (amber `warning` tone) so it is seen at a glance, but it is not the red `error` tone and carries no "missed", "no-show" or exclamation mark: it says what the
  record says. It stays on the card's own second line, not in a badge at the corner.
- The date is not inside the chip: at 320 "Not marked as there: Oct 15" is cut ("Not marked as there: Oc…"), so the chip is the five words and the date is the line under it. The
  longer lines wrap to two lines when they must (Next visit at 320, Marked as there in Arabic); nothing is cut. Arabic words in the pictures are my stand-ins for Lena.
- `proposal.patch` includes these words and the chip as picture-only code; Ava builds the real thing from the signed keys.
