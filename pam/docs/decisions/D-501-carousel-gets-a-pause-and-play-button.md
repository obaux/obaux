# D-501 — Carousel gets a pause and play button

**Date:** 2026-10-11 · **Branch:** `claude/compassionate-bohr-mzrchf`

**Decided by:** the merge desk (11 October 2026), on my own finding: the carousel autoplays every 6 seconds with no way to stop it, on Sign in, About Pam and the website hero. Moving content that starts by itself and runs longer than 5 seconds needs a way to pause it (WCAG 2.2.2, SOP §12). The English of the button's name is Will's to sign off before it ships ("Pause" / "Play", the merge desk's suggestion; asked as a QUESTION).

**What.** `OnboardingSlides` has a round 48px pause/play button (Astryx `IconButton`, the photo viewer's dark round look, D-401), bottom right of the pictures. Its name is `pauseLabel` / `playLabel`, **required** props, passed through `tPlain` (D-435): the app uses `carousel.pause` and `carousel.play` (seven languages), the site passes "Pause" / "Play". Autoplay also holds while focus is inside the carousel, and the button is not drawn when nothing moves (one slide, or reduced motion, which already stops autoplay). Pressing it stops the carousel until Play; swiping and the dots still work.

**Why required.** A caller that forgets the words forgets the control; making them required means TypeScript and the build catch it.

**What a later session might reverse.** The 6-second interval itself (Will: 4, then 6 seconds); whether hover should also hold; whether the button's visible form should carry a word as well as the icon.

**Copy.** Two new keys, English only so far: `carousel.pause` "Pause", `carousel.play` "Play". The other six languages are Lena's. Until they are in and recorded (`copy:ack`), `@pam/config` tests fail by design, so this does not merge before then.
