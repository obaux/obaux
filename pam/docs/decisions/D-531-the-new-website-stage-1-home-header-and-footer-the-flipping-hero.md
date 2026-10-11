# D-531 — The new website: Home, header and footer, the flipping hero pictures (stage 1); Support index and post template (stage 2); About Pam and Still stuck (stages 3, 4)

**Date:** 2026-10-11 · **Branch:** `claude/compassionate-bohr-mzrchf`

**Decided by:** Will, 11 October 2026 (via the merge desk, 09:17 UTC): "When ready please have this new website built. [Figma Pam — Website, Home 24:575] Desktop and mobile, and add smooth animations similar to the app." and "For the image carousel, have it be tappable and images flip through, to show the brand, have images be floating up and down, so they look alive!" Mira approved the plan and answered Q1–Q5 at 09:41.

**What.**
- **Home** is the Figma Home: hero (headline with green words, the lead, the pictures), the deep-green "Who is Pam for?" band with the Philadelphia picture, three feature rows with a phone panel (Explore, a program lead's calendar, a conversation), the Privacy / Support callouts. Built on Dot's Website tokens (D-528: `website.stylex.ts`, `website-type.stylex.ts`), Astryx and stylex; no new library. Light and dark (the Figma is light only; dark uses the tokens' dark values). All its words are in `content/home-copy.ts`.
- **Header and footer** are the new ones on every page: wordmark, "Get help", Sign in (the globe button waits for a second signed-off language); deep green footer with Support, Privacy, Terms, Contact (mailto hello@joinpam.org), © line and the tagline.
- **Held words.** Lines that are untrue today or a new promise are held, each with a true sentence shown instead (`HELD` in `home-copy.ts`; a test fails if a held line appears on the page): the phone-only "talk to a real person", "24/7 member support…", "you see who's coming on your calendar", the "PRIVACY FIRST … regardless of background or history" promise, "cheer on every step". Cards for Will.
- **CTAs.** "Add your program" and "Join as a case manager" go to the post "I can't sign in": `/join/` has no program path for a visitor (programs and case managers arrive by link; a program is added from Profile after sign-in).
- **Hero pictures** (`FlipCarousel`): a real button (tap, Enter, Space; arrows), a calm auto-flip (6s) that stops on touch, hover, focus, off screen and Pause, a slow transform-only drift staggered per picture, a labelled Pause / Play (WCAG 2.2.2), reduced motion = no drift or auto-flip and a plain swap, a polite announcement only for reader-caused changes. The app's easing and durations (`PAM_MOTION`).
- **Motion kit.** `Reveal`: a block below the fold rises and fades in once as it is scrolled to (240ms, (0.2, 0, 0, 1)); never above the fold, without JavaScript or under reduced motion; chips lift 2px on hover and press to 97%.
- **Images** (public/home, 270 KB in all): the Philadelphia picture exported from Figma (the Figma asset URLs are blocked here, so through `get_screenshot`) at 900 and 1600px; the three phone screens taken from Storybook at 2x (`screenshots.json`) at 390 and 780px, WebP, with width and height set, lazy below the fold.
- **`@pam/ui/icons`** export added (one line in package.json, additive) for the category icons.

**Not done / later stages.** Support index, post template, About Pam, Still stuck (stages 2–4). The Home has no link to About Pam (the design has none); the live About section on Home is gone with the old design.

**What a later session might reverse.** The `!important` focus ring (D-522) still stands. The 53px / 40px headline sizes are typed in HomeScreen because the type tokens have no responsive pair.

## Stage 2: the Support index and the post template

- **Support index** (Figma "Support", 8:3 / 9:3): the purple band (`surface-purple`) with the question and the search pill, topic cards (white, radius 24, soft shadow, a dashed success-green line under the title block, a 2px lift on hover), post rows (`PostRow`: newspaper mark, title, chevron, hairline, 48px tall), "Most asked" and "Start here" as the same rows with the summary under each. Search, suggestions, did-you-mean, `?q=`, the count announcement, Esc, the Still stuck? form: unchanged. The Figma frame's "Still need help? Open Pam" card and "Help Desk" nav are not built (A28): the end of the page is Still stuck?.
- **Post template** (Figma "Post", 10:3 / 11:3): title `heading_title35`, section headings `heading_title24`, lead `lead_large20`, the breadcrumb pill and the "Who this is for" box on Website tokens, the page on `surface-page` (body background is now `--website-surface-page` everywhere). The menu stays first in the page (SP4) in the right column, "On this page" and scrollspy unchanged. Body text stays 16px (the Figma shows 15px; A27 sets reading text at 16).
- Reading text colours use the AA tokens (`text-muted-strong`) wherever muted text sits on a grey, green or purple surface.

## Stages 3 and 4: About Pam and Still stuck

- **About Pam** (Figma 12:3 / 13:3): the grey page (`surface-muted`) with the title, the picture (radius 24), the lead and headed sections on Website type, "What Pam does today" as hairline rows (not cards), the 720 text column. English, and every language once signed off (`lang`/`dir` on the section, logical properties, so Arabic flips). The page runs down to the footer with no white strip. The footer links to it (About Pam) while English is signed off (Mira, 10:12).
- **Still stuck** (Figma Components "Still stuck block"): a soft grey card, radius 24, 32px inside, a hairline, the heading on `heading_title24`. The words are the live A28 ones; the form (Nico's switch) and its error words are unchanged. Dark mode checked.
