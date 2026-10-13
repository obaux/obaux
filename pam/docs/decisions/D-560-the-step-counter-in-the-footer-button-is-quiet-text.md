# D-560 — The step counter in the footer button is quiet text

**Date:** 2026-10-13 · **Branch:** `claude/pam-design-button-counter`

Will (13 October, with a screenshot): "Let's fix the counter inside footer buttons, it's looking off. Also, let's remove the darker bg, just leave the number, make it smaller and more subtle. Ensure it's center aligned with button text." Replaces the pill of D-357; the count still rides in the button (D-357) and the name is still "Next, 1 of 3".

**What was off.** The pill was placed 12px from the top of a 56px button, but the button measures 48px, so its text sat 4px below the label's centre. And at 320px a wide count ("第1步，共3步") ran into the label.

**Decision.**
- No pill: just the words. 12px (the smallest size Pam allows, A27), weight 500, the button's own text colour at 75% opacity: **5.49:1 on the light green button, 7.02:1 on the dark theme's** (the label itself is 8.38 and 13.33). Both pass AA at this small size.
- A row of three: the count at the start, the label, and an invisible copy of the count at the end (drawn from `data-count` by CSS, so the words are in the page once). The two ends are the same width, so **the label is exactly centred whatever the count says** (measured in all seven languages), and a long label wraps in the room between. The row is the button's inside wide (the button is a size container).
- Level with the label because all three share a row and centre on it (not offset from the top). At the start, so at the right in Arabic.
- The accessible name and the aria-hidden count are as before.

**Checked** in Storybook and in the Join screen: 320 and 390, light and dark, English, Arabic and Chinese; `e2e/join.spec.ts` now measures, in each of the seven languages, that the label is centred (1.5px), the count level with it, 12px at most, no fill, not touching the label, inside the button. The pictures are in `docs/design/review/2026-10-13-button-counter/`.
