# 2026-10-11 — Languages & legal — A28: no phone line in the Help screen, the privacy page or the terms

**Branch:** `claude/lena-a28-help` (from `main` at `6badde7`, then `main` three more times and Dot's D-512 branch) · **Lane:** Languages & legal (Lena)

From Mira (the merge desk), 03:11 UTC, relaying Will (card a54, 03:06): "Problem -> help desk -> email forward" and "take off phone number" (A28). Sage wrote the words,
Will signed them at 03:37 UTC (card a59, "signed"), and I built the app's part and carried them into seven languages. Records: **D-514** (the Help screen and the signed lines)
and **D-515** (the saved-place text lines).

## What changed

- **Get help, What we can help with, Your safety, Privacy › Copy and Delete** no longer dial anyone. The first row of Get help is "Contact Pam" and opens the help desk
  (`SITE_URL/support/`, one constant in `lib/helpDesk.ts`, pinned by `helpDesk.test.ts` to the site's own address and route) in a new tab. "If we are closed" became "Still stuck?".
  Your safety keeps Call 911, gets a one-tap "Call or text 988" row (Mira, 03:25) and "Talk to someone now", which opens `/support/` until Wren's "Your safety" post exists.
  Copy and Delete end in Dot's Contact Pam button, which opens Help. New keys `help.desk.*`, `help.stuck.*`, `help.safety.talk.*`, `help.safety.crisis.*`; the old `help.call.*`,
  `help.menu.call`, `help.closed.*`, `help.safety.call.*` and `onboarding.phone.callInstead` are deleted.
- **Thirty-one lines, two labels and the wrong-code alert** (Sage's §4 and §1) are the signed English in place, with the six translations: the notice and failure bodies, `account.change`,
  `join.staff.title`, three privacy lines (`privacy.s.contact.p1` now names `hello@joinpam.org`), two privacy-controls bodies, two terms lines. `notices.ts` carries the English of seven
  notices and a test pins it to `en.json`, so it changed too.
- **The wrong-code alert** `signin.code.wrong` (Dot's D-510 line) is Sage's A29 English, "That code did not work. Check it, or tap Send again.", with each
  language's own `signin.code.again` for the button's name; it is a one-row alert, so Russian and Arabic were measured.
- **The two live texts that carried Pam's number are not in this branch.** I first carried them here (seven languages, signed with Will's hour, bundle regenerated), then Mira
  (04:19 UTC) routed them: Nico's D-519 puts Will's signed English in `sms-templates.ts` and drops the old other-language lines, so my six translations go on top of it once
  it is on `main`. I took my edits to `sms-templates.ts`, `sms.test.ts`, `dispatcher.test.ts` and the bundle back out. Staged drafts, lengths measured (zh 40–45, ru 63–64, ar 61–62 of 70).
- **The promise check** (item 4 of the job) found three lines untrue since D-481: `flag.done.body`, `reminders.today.member`, `profile.promo.reminders.body`. Fixed in seven languages
  (D-515), with restore lines in `docs/before-launch.md`; Sage signed all three under A29 at about 04:10 UTC (her ledger, `claude/sage-signs` @ 38496ece). "Get your texts" in the terms is true today and stays.
- While in those files: pt-BR "O Pam" → "Pam" (three places), zh-HK "還未會" (Cantonese) → written Chinese, zh spaces round "Pam" removed, es `help.intro` usted → tú to match the rest of
  the member's Help screen, and Dot's `help.contact.action` aligned to the bundle (pt-BR "Entrar em contato com Pam", zh-CN "联系Pam", zh-HK "聯絡Pam").

## What was wrong, and what missed it

- **D-474's list of "what Pam texts today" went stale within hours.** I wrote it on 10 October with the saved-place note as the one text that was sent; D-481 then held every text except the
  account texts, the same day. `promises-of-texts.test.ts` compares English with a flag in the app, not with the database setting (`texts_live`), so nothing could notice. It now
  covers these three lines too, under the same flag, so the day texts go on they are put back together with the others. Still true: a test cannot read the live database; the before-launch list is the net.
- **Two texts carried the number and were in no bundle.** A search of `en.json` for "call Pam" cannot find them; `grep supportPhone` did. Found because the job's own list said "~30 strings in seven languages".
- **The repo is ahead of what is live.** The live `dispatch-sms` is still the old function, which fills `{supportPhone}`, so until Nico redeploys it the two texts still give the number. Nothing in the repo shows that.
- **I was about to edit the same lines as Nico.** Both of us were putting Will's signed English into `sms-templates.ts`; Mira's routing note came after I had pushed it. Taking mine out cost a revert and a re-run of the config tests; the lesson is to ask who owns a file before carrying words into it, which the job's table (Nico changes the templates) already said.
- **A key vanished between staging and applying** (D-510 removed `signin.failed.verify.body`). My staging script refused to run on a key the bundle no longer had, which is why it was caught before a bad write.
- **Dot's D-512 and my branch rewrote the same five files.** Mira's order (hers first) settled it; I merged her branch into mine on Mira's instruction and took mine in the Help and Privacy screens.

## Decisions made

- D-514 — the app has no phone line: Get help leads to the help desk, Your safety keeps 911 and 988.
- D-515 — the saved-place text is held with the rest, so three lines stop promising it.

## Verified

On `4b9cf14` (`main` b979a49 plus Dot's D-512 branch plus this):

| Check | Result |
|---|---|
| `@pam/config` | 1068 tests green, `copy:status` in step |
| `@pam/ui` / `@pam/web` unit | 120 / 119 green; `tsc` clean |
| Every `t('…')` key in the source exists in `en.json` | yes (script) |
| Storybook | builds |
| Fit audit (7 languages, 320px) | 30 story-id searches (help, safety, privacy, legal, terms, reminders, alerts, profile, notice, messages, thread, blocked, limited, account, places, saved, invite, person, notifications, program, review, trips, explore, onboarding and others); 25 matched stories. Only `program` and `trips` found defects new in a language (7), all **already accepted** in `fit-known.json` (0 not accepted); none is a string I changed |
| Browser suite, three viewports | E2E_RESULT |

**Not measured:** the privacy Copy and Delete pages with the final words are inside the "privacy" and "nested pages" stories only if those match; the two live texts were measured as strings (length, segment), not sent.

## Left undone

- **My six translations of the two texts**, on top of Nico's D-519 once it is on `main` (Mira, 04:19 UTC).

Listed with owners in `docs/before-launch.md` › *A28*: the live `dispatch-sms` (Nico), "Reply HELP to reach a person" (Sage), Ava's in-app copy/delete (the two privacy lines change then), the help-request line on the
privacy page (the day Nico's form works), the your-safety post address (Wren), the public site's "call Pam" in eight files (Wren). A native reader for the six languages.

## Needs a human

Nobody new. Mira/Nico: which comes first, the carrier re-filing or the `dispatch-sms` redeploy, since until then two live texts still carry the number.
