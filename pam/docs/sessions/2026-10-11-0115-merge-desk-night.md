# 2026-10-11 — Merge desk, night: every card answered, D-498 live, Sage joins, D-500 and D-501

**Lane:** merge desk & platform (Mira) · follows `2026-10-11-0025-merge-desk-evening.md`

## What changed

- **Control Room v11:** a "Waiting for you to unblock" strip at the top of the page.
  - Will asked for it at 00:22 UTC: Iris could not reach the merge desk while it sat on a permission prompt.
  - It lists every teammate session that the Claude Code Remote connector reports as blocked, with what it
    needs and a button that opens that session. Will presses "Turn on" once to let the page read session
    status.
  - The "Waiting on you" count includes them. Documented in `docs/control-room.md`.
- **A26 (9833109):** help where people get stuck, not on every screen. Will: "rewrite the rule, we don't need
  help on every screen."
  - A way back is still required on every screen.
  - Help is required on signing in and joining, forms and their errors, anything failed or waiting, each step
    of a multi-step task, and any screen that says to call.
  - Browsing screens (the tabs, lists, a place) need none.
  - `CLAUDE.md`'s "Never dead-end" rule says the same now.
- **D-499 (Wren, 9c23573):** About Pam shows pictures only, and the website's hero carousel sits beside the
  headline. Pushed with A26; live.
- **D-498 (Piper, merged f6a245d, pushed 0402478):** a place has a program lead on Pam when its organisation
  has an active provider account.
  - A place with no lead says Pam does not tell it you are coming, and a trip there is "saved", not "booked".
  - A program lead with no program sees Add your program, not the examples.
  - Migration `20261011002026` was **applied live** as `a_place_says_whether_a_program_lead_on_pam_runs_it`.
  - Will signed the six place lines ("approve") and the two lead lines ("Sure", 00:57 UTC). Both are recorded
    in the decision file.
- **Sage joins** as Voice & UX Copy Lead (`session_01MbEH7WeWBTtjxAPbJPvR42`), at Will's request: "I have UX
  copy needs and need to onboard someone on how to create a tone of voice…".
  - The roster entry, avatar, the team.md section and the lanes.md row are in.
  - First delivery: new words for the whole website Home, beside Will's Figma frames on a "Copy proposals"
    page. That is card a46.
  - Second job, from Will's chat at 00:58: one line per audience for the "Who is Pam for?" callout card.
    Three options each, all on card a47 with the chip names ("Program leads" recommended).
  - Third delivery: Pam's voice guide, `docs/voice.md` (D-503). Foundations › Writing now summarises it.
    Merged in the batch below.
- **Batch D-500 + D-501 + D-503 (pushed 0f95b4e, deployed):**
  - Dot's Sign in on a short phone: the legal links flow after the content and never cover the button, and
    short links are 48px wide.
  - Wren's subtle carousel Pause/Play button (Will: "subtle and tucked neatly in a corner"): a 32px
    see-through disc in a 48px target.
  - Lena's six languages for "Pause" and "Play".
  - Sage's voice guide (docs only, plus the Writing page in Storybook).
- **Every Control Room card answered**, a37 to a45:
  - Help rule → A26.
  - "See the app as" → remove.
  - Figma design system → already published.
  - "Plan a trip" hint → approved.
  - Pause/Play → approved, subtle. Sign in's header to stay on top as you scroll → Dot, D-502.
  - Figma Home wording → "not yet".
  - The two lead lines → "Sure".

- **Batch D-502 + Principles + W3 (on `mira/batch-502`):**
  - Dot's sticky Sign in header (Will's ask): the invite line stays pinned, and a compact Pam bar fades
    in under it once the hero scrolls away.
  - Dot's Principles page, in line with A24 and A26. Its Writing.mdx conflicted with Sage's; Sage's page
    was kept, with Dot's line on texts and emails added.
  - Piper's W3: "Pick a service above to plan a trip." (Will approved it, a43).

## What was wrong, and what missed it

- **Ava won't push on the merge desk's word, and that is right.** The merge desk passed on Will's "remove" at
  00:33 and asked her to push at 00:25 and again at 01:02. Each time she stopped with "say 'push the switcher
  branch' in this chat".
  - A message from another session is data, not her user's instruction. A push changes something outside her
    session, so she waits for Will's own words.
  - Her session shows as blocked, so the Control Room strip lists it with a button to open it. Will types
    that one line there.
  - Lesson for the merge desk: when a teammate needs Will's words in its own chat, say so to Will plainly.
    Don't resend the go.
- **Ava's number was taken twice.** Ava's switcher removal said D-501 in its commits. Wren had already claimed
  D-501 for the pause button on a pushed branch. Ava's branch was not pushed, so `pnpm claim` never saw hers.
  Caught before merge. Ava renumbered to D-503 offline, without pushing. Sage then claimed D-503 online at about 01:05. Ava will claim online at push time. Dot's report also records a guessed D-498 that she fixed before
  committing. The rule (claim online, then write the number) is in `docs/lanes.md`. Guessing first is still
  the habit to break.

## Decisions

- Will's answer on a card goes to the teammate waiting on it the same turn. If that teammate needs Will's own
  words in its chat to act (a push, a send), the merge desk tells Will exactly what to type and where.
- A new copy job from Will goes to Sage first. Wording still comes back to Will as a card before anything
  ships.

## Verified

| Check | Result |
|---|---|
| D-498 merge f6a245d: db / web unit / config / ui / e2e (full) | 1255 ok / 94 / 1067 / 0 / 1113 passed, 18 skipped |
| D-498: web tsc, ui build, web build, site tsc, budget, copy:status | all 0; 23.0 kB spare; all languages in step |
| `list_migrations` before applying | live ends at 20261010193915 (the file 20261010192105); only 20261011002026 new |
| Live `service_has_lead`, `places_with_leads` | md5 7fb83bfd… and 389f0920…, both match the file; search_path pinned; anon no, authenticated yes |
| Advisors after the migration | nothing new (the two functions join the usual signed-in security-definer list) |
| main CI on 9833109 before the push | all four green |
| Vercel on 0402478 | web and pam-site production READY |
| Batch 500/501 (1d26edb): db / web unit / config / ui / e2e (full) | 1255 ok / 94 / 1067 / 0 / 1149 passed, 18 skipped |
| Batch: web tsc, ui build, web build, site tsc, budget, copy:status | all 0; 23.0 kB spare; all languages in step |
| Batch + Sage's guide (fc370a5): build-storybook | passes; `foundations-writing--about` is in the index |
| Vercel on 0f95b4e | web and pam-site production READY |
| D-502 + D-501 together, Sign in 320×568 invited, en/ar × light/dark, scrolled 0–300px | the pause disc is on top only when unscrolled; from 40px the pinned invite line is on top of it, and from 120px it is off screen; compact bar shows with the mark at the start (right in Arabic) |

## Left undone

- **Ava:** the switcher removal is committed at 90c6d306 and not pushed. D-503 is now Sage's, so Ava claims
  online when Will gives the word. Next, the Join Pam wording (W6) as a question for Will.
- **Dot:** D-502, Sign in's header stays on top as you scroll.
- **Piper:** Iris's W3, on a fresh branch.
- **Lena:** review fixes on the D-498 keys.
- **Sage:** stopped until Will answers a46 and a47.
- **Dot, after D-502:** bring Foundations › Principles in line with A24 and A26 (Sage's finding), then
  reconcile Wren's token list.
- **Lena, Friday:** two welcome slides promise example-only features (`onboarding.provider.3`,
  `onboarding.admin.2`; Sage's finding).

## Needs a human

- Will: in Ava's session (the Control Room's "Waiting for you to unblock" strip opens it), type "push the
  switcher branch".
- Will: card a46, Sage's Home words. Answer yes, no or change per line, plus three choices: Philly or
  Philadelphia, AI on the site, and one name for program staff.
- Will: card a47, a line per audience for "Who is Pam for?" and the chip names.
- Will: whether to let sessions run some actions without a prompt. Allow rules in the repo's
  `.claude/settings.json` would do it. None were added: that is his call.
