# 2026-10-13 — languages-legal b25 privacy text, about intro, carousel lines and the staff stories

**Branches:** `claude/lena-b25-privacy` (92f81ff9), `claude/lena-about-intro` (ff2206ee), `claude/lena-staff-carousel-stories` (this one) · **Lane:** Languages & legal (Lena)

## What changed

- **b25 Privacy text, one SHA (`92f81ff9`).** The a67 lines (`what-we-keep.p11` the request log, `sharing.p5` the Trips map), the a68 lines (`sharing.p6`, `what-we-keep.p12` the calendar link) and a70 (`translation.p2` names Claude by Anthropic, with its retention terms) in six languages, on one branch so Piper's calendar link could go in b25. Clean against main; config 46 files / 1211 passed / 1 skipped; fit audit of the Privacy page clean.
- **About Pam (`c873ec9a`) and the two carousel lines (`ff2206ee`).** `about.intro` in seven languages, `about.how.*` removed with the line it fed in `AboutScreen.tsx`; then `onboarding.admin.2` ("Message the people you work with, and see the visits they plan.") and `onboarding.provider.3` ("Members can message you, even before they plan a visit.") in six languages, both signed by Sage on 13 October (02:15), both shown on About and on Sign in. The desk merged both into b25 (`f7e3ff8a`).
- **Stories for the staff welcome lines** (Mira, 02:20; stories and one support helper, no screen code). `onboarding--case-manager-second-slide`, `-third-slide`, `onboarding--program-lead-second-slide`, `-third-slide` (Sign in as each invite, scrolled to that slide), and `onboarding--about-case-managers`, `-about-case-managers-second-slide`, `-about-programs`, `-about-programs-third-slide` (About Pam with the tab chosen, and each tab on the slide that changed). `src/stories/support/showSlide.ts` scrolls the carousel's own scroller the way a swipe does (right-to-left aware) and chooses a tab by its `data-value`, so it holds in every language.

## What was wrong, and what missed it

- **The 320px audit had never drawn a staff line on slide 2 or 3.** A carousel shows one slide, and `audit-language-fit.mjs` counts the others as "scrolled away" (D-467), so only slide 1 of each carousel was ever measured. The existing Case manager and Program lead Sign in stories load on slide 1; the Sign in stories that matched "sign-in" show the member carousel. My first report to Mira ("About and Sign in clean, 0 new") was true and told her nothing about `admin.2` and `provider.3`. I said so in the same message; the new stories are the fix. They are not vacuous: a check of every new story in all seven languages (70 of them) reads which slide is on screen and compares its text with the key's translation: 70 matched, 0 did not.
- **The same gap is still there for the member's own carousel** (`onboarding.2` and `onboarding.3` on Sign in): not asked for, not done. Four stories more if the desk wants it.
- **Notifications arrived about twenty hours late** (the sessions had been paused), so b24 went out without a70; the text rode in b25's one SHA instead.
- **p5 looked like a mismatch and was not.** Mira named `3a034680` (the older wording "loads anything from Google"); the sentence Will signed on a67 is the reworded "your phone loads from Google" (`e130f619`/`cd0292b7`). I flagged it, she confirmed the card is the reworded one, no change.

## Decisions made

None new.

## Verified

Config tests on `ff2206ee`: 41 files, 1176 passed, 1 skipped; `copy:status` in step; clean merge with main. On this branch: web `tsc` clean, web unit tests 26 files / 139 passed; Storybook builds; the 320px audit of all 36 Onboarding stories in seven languages (252 renders): 0 new, exit 0, with Wren's `AboutScreen.tsx` (the words on the pictures, `bd6d016a`) put in the working tree for the run and taken out again, since the desk merges hers. Pictures checked by eye: pt-BR `admin.2` on Sign in and About (4 lines on About), Russian `provider.3` on Sign in, Arabic `provider.3` on About.

## Left undone

- The member carousel's slides 2 and 3 on Sign in (above).
- Will's word on Google sync (a71, `claude/lena-google-sync-privacy` and `-strings`): six translations wait for it. The street-address search needs a Privacy line (Sage; Will signs) and a host-guard entry once Piper sends the function name and the data flow.
- Native readers for every translation; the retention in p11/p12 before Supabase goes to Team; Twilio's retention (Nico); the Vercel plan; the City licence read once; Friday 16 October's batch.

## Needs a human

Will: a71's word and the street-search signature when they come; native readers; the licence read.
