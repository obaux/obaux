# D-551 — The role chip keeps its words whole; the header's corner gives way

**Date:** 2026-10-13 · **Branch:** `claude/pam-design-role-badge-fit`

Mira (b26), after Dot's check of the Explore bell change: at 320px, with the bell, the role chip read "Membe / r".

**Cause.** `Badge` lets a pill break anywhere (`overflow-wrap: anywhere`, D-422) so a long "who is this for" line can take a second line. In the header the chip was squeezed by the bell and broke inside the word. Looking for it in all seven languages found a second fault: in Spanish at 320 the area chip, bell and account button were together wider than the screen, and the account button ran off the right edge (page scrolled sideways, 335 of 320).

**Decision.**
- The role chip (`AppHeader`) is one line (`white-space: nowrap`; a hyphenated label such as "Кейс-менеджер" would otherwise split at its hyphen) and does not shrink below its own width.
- The mark and chip are one group that may shrink to its narrowest (the chip goes under the mark). Only if the corner (area, bell, account) still does not fit beside that does the corner take a row of its own, at the end. The header row wraps for this; the sign-in header (mark alone or centred) is unchanged.
- English at 390 with the bell is as before (chip under the mark). Spanish, Russian and the long labels at 320 now show the chip beside the mark and the corner on a second row.

**Not decided.** Whether a smaller chip type from the existing scale would keep one row more often; at 12px the chip is already the smallest label size (A27), so I did not go smaller.

**Checks.** `e2e/role-badge-fit.spec.ts`: seven languages × member, case manager, program × 320 and 390: every word of the chip on one line, chip inside the screen, no sideways scroll. Story `Components/Navigation/AppHeader › Narrow rows`.
