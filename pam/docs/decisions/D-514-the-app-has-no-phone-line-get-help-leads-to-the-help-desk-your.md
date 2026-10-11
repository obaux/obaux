# D-514 — The app has no phone line: Get help leads to the help desk, Your safety keeps 911 and 988

**Date:** 2026-10-11 · **Branch:** `claude/lena-a28-help`

**Decided by:** Will, via the merge desk. 11 October 2026, 03:06 UTC (card a54): "Problem -> help desk -> email forward"
and "take off phone number" (A28). 03:25 UTC (Mira, on Sage's question): Your safety gets a one-tap 988 row. 03:37 UTC
(card a59): "signed", for all of Sage's words in `docs/help-drafts/a28-contact-pam.md`, with three answers (the privacy
contact line names `hello@joinpam.org`; deleting an account and getting a copy will be confirmed with a fresh sign-in
code, which Ava builds; the help form takes a phone number once texts are on).

**Why.** Pam has no phone line. Every screen that told a person to call it, or dialled it, was promising something that
does not exist. The path is now: the problem, then the help desk on the website (answers first), then an email to
`hello@joinpam.org` (A28).

**What (the Languages & legal part).**
- **Get help**, first row: "Contact Pam" (`help.desk.label`, with `help.desk.body` under it). It opens the help desk,
  `HELP_DESK_URL` = `SITE_URL` + `/support/` (`lib/helpDesk.ts`), in a new tab. `helpDesk.test.ts` pins it to the website's
  own address and to the route the site builds. It is a plain link, so the screen still works with no JavaScript.
- **What we can help with**: "If we are closed" (hours, a call back) becomes "Still stuck?" (`help.stuck.*`) above the same row.
- **Your safety**: 911 stays. New row "Call or text 988" (`help.safety.crisis.*`, `tel:988`): someone in crisis should not
  have to read a post first; 988 is a national line, not Pam. "Talk to someone now" (`help.safety.talk.*`) opens the help
  desk (`/support/` until Wren's "Your safety" post exists, then that post). `e2e/a11y.spec.ts` fails if `/help/` carries
  any `tel:` link or `/help/safety/` any `tel:` link other than 911 and 988.
- **Privacy Copy and Delete**: the button is Contact Pam (Dot's `help.contact.action`), which opens Help.
- **Thirty-one lines** (`account.change`, the notice and failure bodies, `join.staff.title`, `privacy.s.contact.p1`,
  `privacy.s.limits.p2`, `privacy.s.translation.p3`, `privacy.copy.body`, `privacy.delete.body`, `terms.s.limits.p2` and
  `.p3`, and the rest of Sage's table §4) are Sage's signed English in place, with the six translations. The English of
  seven notices is also in `packages/config/src/notices.ts`, which a test pins to `en.json`. `onboarding.phone.callInstead`
  is gone: no screen used it. The old Help keys (`help.call.*`, `help.menu.call`, `help.closed.*`, `help.safety.call.*`)
  are deleted.
- **Two older labels** (`help.callSupport` "Contact Pam", `help.needHelp` "Need help? Contact Pam", Sage's §1) are signed
  and applied; real screens no longer use them (Dot's `help.contact.action` and `nav.help` took over), a story and an e2e
  assertion still do.
- **The wrong-code alert** (`signin.code.wrong`, Dot's D-510 line) is Sage's A29 English, "That code did not work. Check it, or tap Send
  again.", with each language's own `signin.code.again` as the button name. It is one row, so the Russian and Arabic lines were measured.
- **Two texts that carried the number** (`staff_request_denied`, `access_limited_notice`): the English ("Questions? Visit
  joinpam.org/support", Sage's §5, signed with the rest) goes in with Nico's D-519, which also drops the old other-language lines
  (they fall back to English). **Not in this branch**, on Mira's routing (04:19 UTC): my six translations go on top of D-519 once it
  is on `main`, in one 70-character segment where the script allows, signed the usual way. The live `dispatch-sms` is still the
  old function; until Nico redeploys it, the live texts still carry the number.

**What a later session might reverse, or must still do.**
- "Talk to someone now" opens `/support/`, not the safety post, until Wren confirms the post's address.
- The privacy page names the address (`hello@joinpam.org`) in one line. The line about what a help request sends (what
  the person typed, how to answer them, the page and the language, no records) is **not written**: it goes in the day
  Nico's form works, not before (Mira, 03:33).
- `privacy.copy.body` and `privacy.delete.body` promise a check that it is really the person. When Ava's in-app flow
  lands (a fresh sign-in code), both change to the in-app steps; Lena carries them.
- Pam's number stays in the database (`app_settings.support_phone`), unread (A28).
