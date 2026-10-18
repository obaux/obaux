# Languages & Legal · the carrier refile packet (18 October 2026, ~19:00 UTC)

Lena, on `claude/lena-sms-refile-packet`, off main `615e1078`. Asked by Mira at 18:40 (for Will's plan to get texts live): one page Will can paste from, field by field, in the order the Twilio campaign form asks. Docs only; nothing submitted or sent.

## What changed

- **`docs/sms-refile-packet.md`** (new): use case; the campaign description (1,020 of 1,024); how people consent (985 of 1,024; a draft that is true only once the two agree screens are built); the samples in order, with the words exactly as `sms-templates.ts` and the dispatcher send them; the opt-in, opt-out, START and HELP keywords and replies; content attributes (links, phone numbers); the Privacy and Terms URLs; all 21 templates with what queues them, who gets them, the link and the signature; a slot for "Someone wants to connect"; what would repeat the two old rejections; the screenshots Wren re-shoots (placeholders); the order of work.
- `docs/sms-campaign-samples.md` gets a banner pointing at the packet; `docs/before-launch.md` (File the updated text-message registration) points at it too.

## Found

- **The saved-place text cannot send.** `queue_saved_place_closed` (0037) writes `{reason_key}` and no `link`; `saved_place_closed` needs both; the dispatcher throws "missing variable link" and fails the row. Only a unit test that supplies a link passes. Told to Mira and Nico. A small migration fixes it; the words do not change. Not a text to test on Will's phone until then.
- **Three statements in the filing on file are wrong against the screens.** (a) The description and the short opt-in field say the sign-in screen "states … how to stop"; it says "Pam texts you a code to sign in. No password to remember." (b) "STOP … permanently" and "HELP … reaches a person" (STOP is undone by START; HELP's reply is an address). (c) "Numbers are never … entered by staff for anyone": inviting someone needs their mobile number (`invite.who.phone`, "Only this number can use the link"). Pam never texts that number, so what is true is written in §3.
- **Only three kinds of text can send today:** the sign-in code (Twilio Verify), and the decision on a staff request, approved or not (account texts, which `texts_live` does not hold). Of the 21 templates, ten have nothing that queues them.
- **Unsigned:** `support_reply` and `reply_no_read` (card a61); the START reply in §5 is a proposal.
- `supabase/functions/dispatch-sms/templates.json` matches `sms-templates.ts` on main (21 of 21, words and signatures).

## Left undone

Nico to confirm the four alert templates (asked). Wren's screenshots and the agree screens (Nico, Ava). Will: the Verify console template, the Messaging Service's link-shortening setting, the START reply, the "connect" slot, card a61, then the filing.

## Needs a human

Will files in Twilio; I do not and cannot.
