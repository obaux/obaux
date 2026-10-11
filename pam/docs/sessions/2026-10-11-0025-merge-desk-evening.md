# 2026-10-10/11 — Merge desk, evening: the batch, the deploy limit, Will's Control Room notes

**Lane:** merge desk & platform (Mira) · follows `2026-10-10-1738-merge-desk-afternoon.md`

## What changed

- **Live database:** Piper's `20261010192105` (the approval text for a program lead with no program opens
  `/programs/new/`, D-496) applied as 20261010193915. `review_staff_request` matches the file by md5, its
  search path is pinned, anon cannot run it and authenticated can. Advisors: nothing new.
  `list_migrations` against the repo before applying: no drift.
- **Merged and pushed** `00bde97`:
  - Piper's policies part 4 (D-485);
  - Dot's flow-map-3 (D-494);
  - Piper's add-program link (D-496);
  - STATUS: D-496 marked live; the stale "READY, not merged" headers on policies parts 2 and 3 fixed.
- **Deploys:** Vercel refused the web builds for 3f0bb5e and 00bde97 ("Deployment rate limited"). Branch
  previews are now off for `web` and `pam-site`. `main` was redeployed by hand and was READY on
  app.joinpam.org at 00:20 UTC. See below.
- **Merged** Dot's legal tabs (D-497, b1d85b7) after the checks. Pushed with this log.
- **Iris's Member flow pass:**
  - Report on `claude/research-member-flow`; it arrived as a Routine because Iris's session has no
    `send_message`.
  - S1 (Sign in's legal links cover the button at 320×568) and W4 → Dot.
  - W2 and W6 → Ava, whose own question had sat unseen for the same reason.
  - W3 and W5 → Piper, in the next note.
  - W1 (no help on the main screens) → Will, card a41.
- **Control Room v10:** a round button on the conversation takes you to the newest message. It shows when you
  have scrolled up, with a dot when something new arrived. Earlier, v9 moved the page to Figtree, semibold at most.
- **For Will:**
  - A sample of the staff invite email was sent to his address, at his request. It was rendered by
    `send-invite-emails/render.ts` from the signed bundle, with a sample link to the sign-in page, so no real
    invite row exists.
  - Card a37 (`APP_URL` → app.joinpam.org) is done by Will.
  - Card a38 is new: publish the Figma design system.
- **Jobs out:**
  - Wren: the website in Figma (done), and "Pam — Design system" as a Figma library (done, waiting for Will
    to publish). Then About Pam with no words over the carousel, the website hero carousel to the right of
    the headline, and the Figma file updated.
  - Piper: keep lead-added programs apart from listings gathered from public sites. Members are told a
    place without a lead isn't told of their visit. A lead's Home shows program tools only once they have
    a program. The wording goes to Will first.
  - Ava: take the role switcher off the super admin's screens.
- **Team rules** (`docs/team.md`): the merge desk checks the Vercel deploy after every push, and there are
  no Vercel previews.

## What was wrong, and what missed it

- **Two pushes never went live, and every check said green.** Vercel's free plan allows about 100 deploys a
  day. Branch previews for two projects used about half of them: web 21, pam-site 28, 19 of which failed.
  - When the limit hit, Vercel reported it only as a failed commit status. The merge desk's push routine
    watched GitHub CI and assumed a Vercel deploy followed.
  - It noticed only because a deploy was expected for the Ready cards.
  - Now: no previews, and `team.md` makes "check the Vercel status after a push" a merge desk duty.
  - Will had already chosen (morning of 10 October, in the Control Room) to wait out the limit rather than
    pay, so the plan stays as it is.
- **Will's notes waited over an hour.** Between about 20:47 and 00:16 UTC this session did not act on queued
  Control Room comments: four notes, two of them "done" sent twice because no answer came. Nothing caught it.
  When the session came back, all were answered and acted on in one pass. "Answers within its next turn" is
  in `team.md`. The gap was the session not taking a turn, not a rule missing.
- **A green test page can be stale.** The Control Room harness embeds an old copy of the page. The new button
  "did not exist" until the harness was rebuilt from `index.html`. Rebuild it before every run.

## Decisions

- Vercel preview deployments are off for both projects. Review happens in Storybook (Chromatic), and the live
  app is `main`. It's reversible: one project setting each. Recorded in `docs/team.md` and STATUS, not as a
  D-number.
- The sample email went straight through Resend with Pam's configured sender, not through a fake invite in
  the database. A real invite to Will's own address would have put a redeemable code against his
  super-admin account.

## Verified

| Check | Result |
|---|---|
| Batch 00bde97: db / web unit / config / e2e (full) | 1244 ok / 94 passed / 1067 passed / 1053 passed, 18 skipped |
| Batch: web tsc, ui build, web build, site tsc, budget, copy:status | all 0; 23.2 kB spare; all languages in step |
| main CI on 3f0bb5e before the push | success |
| Live `review_staff_request` after 20261010193915 | md5 7930ac23…, search_path pinned, anon no, authenticated yes |
| Vercel redeploy dpl_5Y2E9FKPPgQ7MYRcpwm7HRJ3MDif | READY, aliased to app.joinpam.org |
| app.joinpam.org/programs/new/ | 200, title "Add your program to Pam", og:image /og/add-program.jpg |
| web-ten-umber-88.vercel.app/signin/index.txt | 200 (no longer redirected off-site) |
| Control Room chat button (phone 390, laptop 1280 dark) | hidden at bottom, shown when scrolled up, tap returns to newest; no sideways scroll, no errors |
| D-497 merge b1d85b7: web tsc, web unit, ui build, web build, budget | 0 / 94 passed / 0 / 0 / 23.2 kB spare |
| D-497: e2e legal-tabs, legal, legal-phone, a11y, failed-load (all projects) | 138 passed |
| copy:status | all languages in step |

## Left undone

- **Figma design system:** waits for Will to press Publish (card a38). After that, Wren links the website
  file to it.
- **Wren's mismatch list** (Storybook vs code: body 16 vs 14 px, the card radius, 2 and 6 px spacing steps,
  undocumented colours, dark-mode grounds all #1B1B1B) is for Dot. Sent with the D-497 note.
- **Piper and Wren jobs** are in progress. Piper's wording comes to Will as a question.
- **Ava's role-switcher removal:** no report yet.
- Piper's W3 and W5 from Iris go in Piper's next job note.
- The Control Room's "waiting on your OK" strip, asked for by Will at 00:22 UTC, is being built after this push.

## Needs a human

- Will: publish "Pam — Design system" in Figma (a38).
- Will: approve Piper's new member-facing sentences when they arrive.
