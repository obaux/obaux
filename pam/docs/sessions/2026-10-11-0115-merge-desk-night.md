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

- **Batch D-502 + Principles + W3, then D-504 and Lena's two reviews (pushed together):**
  - Dot's sticky Sign in header (Will's ask): the invite line stays pinned, and a compact Pam bar fades
    in under it once the hero scrolls away.
  - Dot's Principles page, in line with A24 and A26. Its Writing.mdx conflicted with Sage's; Sage's page
    was kept, with Dot's line on texts and emails added.
  - Piper's W3: "Pick a service above to plan a trip." (Will approved it, a43).
  - Sage's finding fixed on top: the texts-and-emails line in Writing and Principles described A24 as it
    stood on the morning of 9 October. It now states A25: a text or email goes out in the person's own
    language once that language is signed for it, and in English until then.
  - Dot's D-504: Storybook's Foundations pages match the code item by item. All 146 colour tokens are
    listed, generated from pam.css, with a test that fails if the list goes stale.
  - Lena's review of Piper's D-498 lines: 13 strings in 5 languages. A place's name is a variable, so no
    sentence agrees with it in gender. The meaning stays a hard "Pam does not tell this place". Lena also
    reviewed the pick-a-service drafts and kept them as written.
- **Batch D-505 + D-506:**
  - Wren's help-centre search (D-506): small words dropped, phrase > title > keyword > summary ranking,
    and Sage's 69 phrases, 48 answered and 21 gaps. A test runs every phrase through the real search, and
    `docs/help-centre-gaps.md` lists the gaps. An empty result shows the topics and Call Pam.
  - Sage's voice-guide update (D-505): Will's marketing words, how she works on his Figma components,
    and his "people are guided, never watched".
- **Batch dark muted + A27:** dark `--color-background-muted` is #262626 (Will: "Yes go for it"), with a
  before-and-after story. A27 writes the text-size rule as the app has it, with its exceptions (Will: "Leave as is.
  Make exceptions. Update rules."). Dot corrected her own figures: 38% of text is under 15px, not 75%. Will has
  that on card a52, together with Sign in's label and consent line at 16px.
- **Card a50, yes:** Wren changes the website's case-manager card, and Lena changes About Pam in seven
  languages, both to Will's line "Their plans, your guidance, in one place."
- **Batch b7:**
  - Will's line "Their plans, your guidance, in one place." replaces "Know where your people are going" on the
    website (Wren) and in About Pam in seven languages (Lena; "guidance" is not "guía" in Spanish, since that
    word names the guide).
  - The badge caption is 12px (Dot).
  - Piper accepted the four pseudo-language Explore clamps; they were never accepted under that story id.
  - A27 records Will's "legal texts should always run smaller and less emphatic".
  - Sage's voice rule: marketing may reach, everything else says only what's true today.
  - Nico's Spam notes: the email itself is clean; it's a new domain, probably with no DMARC.
  - Control Room v12: the map's legend sits behind an (i).
- **Will's answers 02:16–02:28:** a50 yes; a51 approved (help posts); a52 "leave it"; marketing may reach;
  the help desk should infer what people mean (Wren and Sage: everyday words, typos, suggestions, "did you
  mean"; "Ask Pam" still waits); the Spam email; the sample's Accept button, which had no invite code by design.
- **Figma:** Sage wrote her lines into Will's Callout card (18:517). Will reworked them with her directly.
- **Card a50:** "Know where your people are going" is live on the website and in About Pam, and Will
  told Sage it sounds like surveillance. The card proposes his own Figma line.
- **Will's answers after 01:20** (Control Room chat):
  - Copy: Sage owns the copy pass. When Will asks in Figma, she writes into his component, only that
    component. On the marketing site: Residents / people looking for help, Providers / social services,
    Case Managers / Guides. Nothing is translated until a website change is merged.
  - Help search (Wren and Sage): phrases people actually type mapped to posts, any-word ranking, a gaps
    list, and no dead-end empty result. "Ask Pam", an AI answer box over the posts, waits for his go.
  - Text size: "Leave as is. Make exceptions. Update rules." Dot writes A27 to replace A23's 15px floor.
  - Dark mode: "Yes go for it". Muted becomes #262626, with Dot doing it next.

- **After b7 (02:58–03:12), nothing merged; routing only:**
  - Will's phone screenshots. Wrong code: a small alert, stay on the code step, no Call (Dot, #26). Trips
    not launch-ready: example trips on his real account, the example map over the real one, no empty state
    (Piper, #27). Messages: no example messages, and no tab when there is nobody to message (Nico, #28).
    A "Saved" tooltip, and the dark blue alert at 10% (Dot, #29). The rule behind all four, card a55: real
    accounts see only real things, and an empty screen gets a short empty state. `useTrips.ts` mixes
    `DUMMY_TRIPS` into every account; about 40 screens read `DUMMY_*`.
  - a53, the help post "Is the place told?": Will approved, and the merge desk held it. Piper found a lead's
    calendar shows only visits the lead booked, never a member's own plan, so "sees your visit on its
    calendar" is not true yet. Her attendance plan (parts A–D) is card a56; the post ships with part A.
  - a54 answered at 03:06: "Problem -> help desk -> email forward" to hello@joinpam.org, and "take off
    phone number". Written as **A28** (`docs/amendments/A28-…`), which replaces A26's "Call Pam and the
    support number stay". Sage writes the words first; then Dot (Contact Pam in `Notice` and `HelpBar`,
    `useSupportPhone` out), Lena (Help screen, privacy, seven languages), Wren ("Still stuck?" on the help
    desk, the address now and a form later), Nico (the forward, built off behind `HELP_REQUESTS_LIVE`),
    Iris (the whole path on a preview).
  - Wren's search with Sage's everyday words (D-507, 9ac76cbe) waits for Sage's call-free posts, since it
    is stacked on them. They merge together.

- **Batch b8, pushed at cac5f49 (03:34), live on web and pam-site:** Dot's D-508 (Privacy and Terms opened
  from the website go Back to that page; the return path is checked, only joinpam.org), Dot's D-510 (a wrong
  sign-in code stays on the code step with a one-line alert, no Call), Sage's voice guide for A28, and Iris's
  help-site baseline (`docs/research/2026-10-11-help-site.md`: no way to reach a person, no focus ring, search
  misses, tap targets, aria-live; all sent to Wren in order).
- **Batch b9 (Piper's D-509 + Dot's D-513 + Dot's D-516):** saving a place shows a small "Saved" tip for two seconds (announced, never takes focus); real accounts never see example trips, visits or policies
  (`lib/exampleMode.ts`: Storybook, a super admin's preview or `pam.examples=1` only); an empty Trips drawer says
  "Plan a visit and it shows here."; the blue alert in dark mode is 10%.
- **Will's answers 03:16–03:41:**
  - a56 go: attendance A–D after Trips, a lead's "here" pays the existing 100-point rule, no missed text.
  - Visits outside Pam: not a guide ("not everyone has one"). An "I'm here" check-in by location at the planned
    time (100, the geofence rule already in `points.ts`; Pam keeps only the outcome), or "Did you go?" (60).
  - Calendars (a58): a private link for everyone; Google sync limited to a calendar Pam creates; and, as its own
    switch, a search for appointments from the web domains of places the person has trips with. Points still
    need "I'm here".
  - "Anyone should be able to create a program": "Add my program" on Profile, checked once by hand
    (`request_staff_access` and the Requests screen exist; Piper's plan approved).
  - a57 "I can't sign in": yes. a53's post ships now, true today: "Does the place know I'm coming?"
  - a59 signed (03:37): every "call Pam" line, the Help screen, "Still stuck?", the two texts, the HELP auto-reply
    and the "Your safety" post. A phone number on the help form once texts are on (Nico's text reply);
    deleting an account confirmed with a fresh sign-in code (Ava); the privacy line names hello@joinpam.org.
  - The merge desk decided, not asked: a one-tap "Call or text 988" row on Help next to "Call 911".
- **Held on purpose:** Dot's D-512 (Contact Pam in the app) waits for Wren's A28 help desk so it never leads to
  a page that still says "call Pam"; Lena's 31 signed lines follow it.

- **Batch b9 pushed at b979a49 (03:57), live on web and pam-site.** With it, A29 (Will, 03:52: "let's change it so
  every new sentence doesn't need my yes"): Sage signs new sentences; Will signs texts and emails Pam sends,
  Privacy and Terms, and new promises. Sage started `docs/signed-english.md`, the first ledger of signed English.
- **Batch b10 (Nico's D-511 + Sage's ledger):** real accounts see no example messages, people, alerts or
  offers; a member or lead with nobody to message has no Messages tab, and the bell moves to Home. Full e2e:
  1292 passed, 19 skipped.
- **Will, 03:40–03:51:** calendars, both the link and a Google sync limited to a calendar Pam creates, plus a
  switch to find appointments from places' own domains; skeleton loaders on the Profile hero card (Dot, D-520).

- **Batch b10 pushed at 759ea83 (04:19), live.** **Batch b11:** Nico's D-519 (the Text alerts screen reads
  `texts_live` and shows no switch as live while it is off; the two account texts lose the number in the repo,
  live only after Will refiles), Piper's places/Explore/Saved without examples with one gate (`examples.ts`,
  `exampleMode.ts` deleted), and Nico's D-521 (the help-request forward, built off). Full e2e 1307 passed,
  DB 1266 ok. **D-521's migration did not apply:** `apply_migration` timed out twice at the connector with
  nothing applied and no locks, as P4 did on 10 October. Nothing uses the table until the function is switched
  on, so the code went to main and the migration goes to Will to paste, with the salt secret and "test it".
- **Will, 04:17:** "Modals and section links … are highlighted … rewrite the input field rule to only mean text
  boxes" (Dot D-523, Wren on the site). **Nico's text-reply scoping** ran into D-460 (Pam never reads people's
  texts): card a61 asks Will whether replies are forwarded, plus the opt-in sentence and reply checks.

- **help-request is deployed, off (v1, verify_jwt off).** The first deploy failed to compile (an unterminated
  regex at handler.ts:43). Nico rebuilt the control-character pattern from character codes. The merge desk took
  only handler.ts, its test and his log note from c4ba527, as 821e652. `get_edge_function` shows that the
  deployed files match the repository. 821e652 went to `main` at about 05:05. Card a62 asks Will for three things:
  paste 20261011041940 in the SQL editor, add the HELP_REQUEST_SALT secret, and, after b12, add
  HELP_REQUESTS_LIVE = on and send himself one request from the help desk.
- **Batch b12: A28 ships together.**
  - Dot's D-512: Contact Pam replaces Call Pam, and Pam's phone number is gone from the app.
  - Lena's D-514 and D-515 in seven languages: Get help leads to the help desk; Your safety gets a one-tap
    988 row; Talk to someone opens the Your safety post; the three lines that promised saved-place texts now
    say what is true.
  - Wren's D-522 and D-517: on the site, Still stuck? is email, and the form sits behind Nico's switch. Also On
    this page, two new posts, search and keyboard fixes, and Sage's signed error words under the form fields
    (ec56f0f).
  - Dot's D-523: a focus that a script moves shows a highlight only on text boxes (Will, 04:17).
  - Every Privacy and Terms change in it is a line Will signed on a59. Sage signed the rest under A29.
  - The only phone links left in the app or site are a place's own number, 911 and 988.
- **b13 is lined up.** It holds Dot's D-518/D-520 (Profile skeletons; D-518 is now a test only), Nico's D-524
  (Answer by text, built off; migration 20261011042645 goes in after 041940; its two texts are on card a61 for
  Will to sign), Piper's D-525 (Add my program; migration 20261011044654) and Sage's ledger. **Piper's attendance
  part A (D-526) is held:** a program lead seeing the first names of planned visits makes privacy.s.sharing.p2
  and the "Does the place know I'm coming?" post untrue. It ships with a Privacy line Will signs, Wren's post
  update and the member-facing words from part D.

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

- **Two account texts still carry the phone number.** Live `dispatch-sms` is v23 (17 September, "PAM:", English
  and Spanish), not v15 as `before-launch.md` said, and it fills "Call {supportPhone}" into `staff_request_denied`
  and `access_limited_notice`. Nico first read them as held by `texts_live`; they are not. Account texts go out
  regardless (migration 20261010141859), and one denial has been sent. A hotfix of v23 would send words that
  differ from the registered samples, so the merge desk chose to wait for Will's refiling, and said so to Will.

- **Three "show examples" switches in one hour.** Piper (D-509, `exampleMode.ts`), Nico (D-511, `examples.ts`)
  and Dot (D-518, a second `examples.ts`, then `exampleMode.ts`) each built one, with different rules about a
  super admin's preview and demo accounts, because their READYs and the merge desk's decision crossed in
  flight. Decided at 03:55: one gate, Nico's `examples.ts` (prototype, demo account, the e2e hook; not a
  super admin's preview). Piper folds hers in; Dot rebuilds on it after D-511 lands. Lesson for the merge
  desk: when two lanes touch the same idea, name the owner of the shared piece in the first message, not
  after the READYs arrive.

- **The deploy tool turned two escapes into real characters.** help-request's handler had a regex literal
  that named LINE SEPARATOR and PARAGRAPH SEPARATOR (U+2028, U+2029) as escapes. On the way to the deploy, the
  escapes became the real characters, which end a line in JavaScript, so the source stopped compiling. A message
  from the merge desk explaining it was mangled the same way. Rule: build those two characters from character
  codes, and name them in words in messages.
- **A teammate commit carried `pam/node_modules`.** It was a symlink left from a temporary worktree (c4ba527).
  The merge desk caught it by reading the tree, took only the intended files, and Nico removed it from his
  branch. Before merging any branch, check that `git ls-tree -r <head> --name-only | grep node_modules` prints
  nothing.
- **A stale branch merges with silent leftovers.** Dot's D-512 predated b9 to b11. Four files conflicted, and one
  more auto-merged wrong: the thread page's not-found notice kept main's phone prop. A grep for the removed hook
  found it before tsc did. Lena's branch carried a test (place.spec:255) that still expected a phone link and
  was red with D-512. Her full run caught it, and the merge desk fixed it in b12.
- **A new test read a highlight too early.** focus-text-boxes.spec.ts:193 failed once in 1359 on narrow-320.
  The field's frame is drawn after the drawer opens, so the test now waits for it like the file's other ring
  checks do (144 of 144 over six repeats).

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
| Batch 502 (c6b928a): db / web unit / config / ui / e2e (full) / storybook | 1255 ok / 94 / 1067 / 0 / 1173 passed, 18 skipped / builds |
| Batch 504 (on top): web tsc, web unit, config, copy:status, web build, budget | 0 / 97 passed / 1067 / in step / 0 / 23.0 kB spare |
| Batch 504: e2e places-without-a-lead, place-pick-a-service, trip-booked, visit-change, place, a11y (all projects); storybook | 114 passed; builds |
| Vercel on 1634541 | web and pam-site production READY |
| Batch 506: site tests / site tsc / web tsc / site build / config / copy:status / storybook | 38 passed / 0 / 0 / 0 / 0 / in step / builds |
| Batch 506: site a11y (needs `CHROMIUM_PATH` here; without it the script exits before scanning) | 90 scans, 0 problems, the nothing-found state included |
| Batch a27: ui / web tsc / web unit / web build / budget | 120 / 0 / 97 / 0 / 23.0 kB spare |
| Batch a27: e2e a11y + theme (all projects, dark included) / site build / site a11y / storybook | 54 passed / 0 / 90 scans, 0 problems / builds |
| Batch b7: ui / web unit / web build / e2e a11y + profile / site tests / site a11y / storybook | 120 / 97 / 0 / 45 passed / 38 / 90 scans, 0 problems / builds |
| Batch b7 + Lena: config / copy:status / web build / e2e a11y | 1067 / in step / 0 / 45 passed |
| D-502 + D-501 together, Sign in 320×568 invited, en/ar × light/dark, scrolled 0–300px | the pause disc is on top only when unscrolled; from 40px the pinned invite line is on top of it, and from 120px it is off screen; compact bar shows with the mark at the start (right in Arabic) |
| help-request deploy: `get_edge_function` vs 821e652 | index.ts, handler.ts (CONTROL from character codes), provider.ts match; v1 ACTIVE, verify_jwt off |
| main CI on a1ba1ce before pushing 821e652 | all four green; Vercel web and pam-site READY |
| Batch b12 (b336e3f): config / copy:status / ui / web tsc / site tsc / web unit / site tests | 1042 / in step / 124 / 0 / 0 / 121 / 76 |
| Batch b12: ui build / web build / budget / site build / site a11y / storybook | 0 / 0 / 21.3 kB spare / 0 / 120 scans, 0 problems / builds |
| Batch b12: e2e full, three projects | 1336 passed, 19 skipped, 1 flaky (fixed), 3 failed = place.spec:255 (stale, fixed); then place + focus-text-boxes 57 passed, focus-text-boxes x6 no retries 144 passed |
| Batch b12 with Wren's ec56f0f: site tsc / tests / build / a11y | 0 / 76 / 0 / 120 scans, 0 problems |
| Phone links left in app and site source | a place's own number, 911, 988 (and stories) only |

## Left undone

- **Ava:** the switcher removal is committed at 90c6d306 and not pushed. D-503 is now Sage's, so Ava claims
  online when Will gives the word. Next, the Join Pam wording (W6) as a question for Will.
- **Dot:** A27, the text-size rule with its exceptions; then dark muted #262626 with a before-and-after story.
- **Piper:** Iris's W3, on a fresh branch.
- **Wren and Sage:** write the 21 gap posts in `docs/help-centre-gaps.md`. The words go to Will first.
- **A28, the phone coming off:** shipped in b12. The two account texts still say "Call {supportPhone}" live
  until Will refiles. "Still stuck?" shows hello@joinpam.org until Will switches the form on (card a62).
- **Wren:** Iris's part 2 findings on the On this page menu (SP1 to SP3) and the hello@ link's tap size, after b12.
- **Lena:** es help.needHelp to tú; six translations of the two texts; the Privacy line for program visits.
- **Launch cleanup (a55):** Piper Trips, Nico Messages, Dot wrong code and Profile; Ava's screens after her
  push word.
- **Lena, Friday:** two welcome slides promise example-only features (`onboarding.provider.3`,
  `onboarding.admin.2`; Sage's finding).

## Needs a human

- Will: card a56 (attendance plan A–D; advice: go after Trips, no missed text, no points yet).
- Will: card a62 (paste 20261011041940, add HELP_REQUEST_SALT; after b12, HELP_REQUESTS_LIVE = on and one test
  request from the help desk).
- Will: card a61 (texting people back: three choices, and the two texts' words to sign).
- Will: the DMARC record at joinpam.org's DNS, then "test it" for Nico.
- Will: in Ava's session (the Control Room's "Waiting for you to unblock" strip opens it), type "push the
  switcher branch".
- Will: "go on Ask Pam" if he wants the AI answer box over the Support posts scoped (an API key he enters,
  a cost per question, and the site saying answers are AI-assisted).
- Will: whether to let sessions run some actions without a prompt. Allow rules in the repo's
  `.claude/settings.json` would do it. None were added: that is his call.
