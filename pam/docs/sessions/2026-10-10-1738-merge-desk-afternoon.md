# 2026-10-10 — merge desk afternoon

**Branch:** `main` (merges only; worktree off `main`) · **Lane:** merge desk & platform (Mira)

## What changed

The afternoon after the morning's merges, from about 14:30 to 17:45 UTC. Everything below is on `main`
and, where it touches the database or a function, live on the real project.

- **Both clocks carry a secret from the vault** (D-484). `dispatch-sms` and `send-invite-emails` run every
  five minutes from pg_cron with a header read from vault `dispatch_secret`. Live as 20261010145909.
- **Program policies, parts 1 to 3** (D-485, Will's card a25). Live as 20261010145952 (policies),
  20261010151152 (members sign, keep their signature) and 20261010153405 (a program sees a first name and a
  date; plus the merge desk's fixes: `is_active_account()` on archive, the 30-cap leaves out the policy
  being replaced, a case manager no longer reads archived or not-yet-live programs' policies).
- **A member's typed email is deleted once its link is sent** (D-487). Live as 20261010152709.
- **The privacy page says what Will approved** (D-482, D-490: card a29, three sentences, English signed).
- **About Pam** (D-483): no "human-touch" in public copy (Will: that is for our own decisions only);
  "remember to go" kept (Will, card a32).
- **Staff get the new Home with the rings** and the empty row of faint circles whose first is (+) invite (D-486).
- **The invite email sends.** `send-invite-emails` v8 (Resend's reason kept, addresses redacted; six staff
  drafts, D-488). Resend showed `mail.joinpam.org` verified by 17:10; the test staff invite to Pam's own inbox
  was delivered at 17:15.
- **A super admin can approve a request from someone who already has an account** (D-491, Piper). Live as
  20261010171050. This was Eric's request, which Will could not approve.
- **Will's phone bugs** (D-492, Dot): Privacy and Terms Back returns to Sign in, the tabs stop jumping, Back to
  top reaches the top, the loading screen is the new layout, no member flash on a super admin's Profile.
- **The website** (Wren): the white post page, the post layout, "Signing a program's rules" live (English
  signed by Will, D-489), a site-only border on its secondary buttons.
- **Languages** (Lena): Piper's review queue (38) and the honest booking (2) reviewed in six languages; the
  zh-HK queue had been written in Cantonese and is now the bundle's written Chinese.
- **Lena and Wren work once a week, on Friday** (Will, 10 October: "We don't need the website to be updated
  every time a change is made. Especially since we change a lot during one week."). `docs/team.md`, "The
  weekly update"; the notes are `docs/weekly/2026-10-16.md`, sent on Friday by a scheduled message.

## What was wrong, and what missed it

- **Resend refused every email with a 403, and Pam could not say why.** The DNS records were right, but Resend
  had never started its own check of the domain ("not started"). The sender kept only the status code, by
  design, so no address reached a log; the merge desk could only guess (wrong From address? key scope?). What
  found it: Resend's own log, read through the Resend connector Will added. What catches it now: the sender
  keeps Resend's `name` and `message` with addresses and keys redacted (Nico, `explain()`), so the next
  refusal says what it is.
- **Approve failed for someone who had become a member while their request waited.** `review_staff_request`
  always inserted a new profile; every test made the request from a phone with no account. Piper's database
  test 50 and `e2e/staff-request-approve.spec.ts` now cover it, including the pairs Pam refuses.
- **Policies part 3 first used `is_admin()`**, which on the live project also means a case manager (0082), so
  a case manager could have read who signed any program's policies. Caught at merge review, before it was
  applied; the applied version allows only the program's own lead or a super admin. The lesson is the same as
  the morning's: on this project "admin" is not "super admin", and a review should search for `is_admin()` in
  every new function.
- **Back on Privacy and Terms stayed on the page.** The section tabs were `#hash` links, each adding a history
  entry; `e2e/legal.spec.ts` pressed Back without tapping a tab first. `e2e/legal-phone.spec.ts` taps two tabs,
  then Back. The tab "glitch" Will saw is reproduced only as history and landing position: headless Chromium has
  no iOS toolbar resize, so his phone is the real test.
- **The website's border change broke an app test.** Wren's first version put the border in `@pam/ui`'s
  Button, which every app screen uses; the option-tag test failed and the merge was thrown away. The border
  is now the site's own, and the app-wide one is Dot's job. A website job does not edit `packages/ui`.
- **Policies part 4 would not apply.** `apply_migration` timed out four times with nothing applied and no locks
  held; a rolled-back dry run of the same SQL ran fine. Not worked around: Will pastes it
  (card a31) and the app code waits off `main`.

## Decisions made

- D-484 to D-492, each with its job (above). The weekly batch for languages and the website is Will's rule,
  written in `docs/team.md` with his words; no D number.

## Verified

- Approve fix (713584b): database suite 1221 ok / 0 not ok; config 1060; web 93; ui 117; site 26; both
  builds; bundle budget 24.2 kB spare; browser tests staff-request-approve, invite, admin and a11y 138 passed.
  Live body md5 matches the file (`aff04c7d…`); the one waiting request is a program-lead request from a member
  in the only city, so Approve will work on the live app.
- Website and languages (d079db9): config 1060, web 93, ui 117, site 26, both builds, budget, a11y and
  programs-review 60 passed, the site's own a11y scan 85 pages 0 problems, `copy:status` in step.
- Phone bugs (c04cdf6): web 93, ui 117, typecheck, both builds, budget 23.3 kB spare, the whole browser suite
  1038 passed, 18 skipped, 0 failed.
- Email: Resend lists the test invite as delivered (17:15:02).

## Left undone

- **Policies part 4** waits for Will's paste (card a31); then read it back and merge the latest head of
  `claude/places-programs-policies-p4`.
- **Dot, next:** the secondary-button border in the design system (then drop the site's own), the Proposed
  card in Figma (a22), the drawer drag action. A small question to put to Dot: after a tab tap on a legal page,
  focus stays on the tab rather than moving to the section (the old hash link moved the reading point); the
  a11y suite passes, but a screen-reader user may want it to move.
- **Friday 16 October:** the scheduled message sends Lena and Wren their notes. Lena builds the privacy guard
  then.
- Texts other than account texts stay off (`texts_live` off, `ALERT_TEXTS_LIVE` false) until Will says go.

## Needs a human

- Will: paste part 4 (a31); look at the test invite and say "go" or what to change (a33); tap Approve on
  Eric's request (a34); try the legal-page tabs and Back on his phone.
- Before launch, as before: a lawyer for the one sentence on what a signature in Pam means, and a native
  reader for each of the six translated languages.
