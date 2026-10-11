# 2026-10-11 — messages email deliverability

**Branch:** `claude/messages-email-deliverability` · **Lane:** Messages & notifications (Nico)

## What changed

Docs only: `docs/email-setup.md` gains "If the email lands in Spam".

## What was wrong, and what missed it

Will's first sample landed in Spam. Checked the email itself (rendered it from the signed bundle): a plain-text part is sent
with the HTML; HTML is 2.5 KB, text 0.4 KB, one 9 KB logo; the link is written out beside the button; no tracking; no spam words;
From, DKIM and SPF align on `mail.joinpam.org`. Nothing to fix in the function or template. The likely causes are the
domain's standing: no DMARC record (unknown, this container cannot do DNS), a brand-new sending domain, a test sent to a
forwarded address (ImprovMX breaks SPF at the final inbox), and possibly `APP_URL` on `vercel.app`.

## Decisions made

None. No wording changed; no outside spam test run (needs Will's yes).

## Verified

Rendered the email with the real bundle and read it.

## Left undone

Will: DMARC TXT record, a direct-to-inbox test, "Not spam".

## Needs a human

Will, as above.
