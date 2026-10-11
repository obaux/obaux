# D-499 — About Pam carousel shows no words; website hero carousel sits right of the headline

**Date:** 2026-10-11 · **Branch:** `claude/compassionate-bohr-mzrchf`

**Decided by Will, 10 October 2026 (20:54 ET):** "For the about Pam link in sign in. That page should not have text over the carousel image. Only tab and image. It's redundant text. Also let's bring that carousel to the right of header text on hero section of website and update Figma mockup so I can edit with the latest update."

**What.**
1. App › About Pam (`/about/`): the carousel draws only its pictures; no sentence over them, and no dark wash (the wash was there to hold the words). The tabs, the way back, the dots and the "Sign in as ..." rows stay. `OnboardingSlides` gets `showLines` (default true, so Sign in is unchanged); with `false` each picture is `role="img"` named by the line it used to carry, passed through `tPlain` (D-435).
2. Website Home hero: the same carousel (pictures only, the member three) sits right of the headline, intro and buttons from 900px, and under them on a phone. No tabs on the site.

**Why the words were not "the only place".** None of the three lines per person is repeated word for word on About Pam; the `about.how.*` line says the same idea in other words for the member and, partly, the others. Will said they are redundant, so they are dropped as drawn text and kept as accessible names. Ideas now said only to a screen reader on About: "A real person can point you to the right one and answer questions" (member), "Know who showed up, without chasing calls" and "Send someone to a program in one tap" (case manager), "Case managers nearby send people your way" (program). Sign in still shows all of them.

**What a later session might reverse.** Put the lines back by passing `showLines` (or drop it). Add the Members / Case managers / Programs tabs to the site hero if Will wants the audience switch there. The site carousel autoplays every 6 seconds (stopped under reduced motion) with no pause control, as in the app; a pause control would be the next accessibility step.
