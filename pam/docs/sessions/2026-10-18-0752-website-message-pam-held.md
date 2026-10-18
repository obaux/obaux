# 2026-10-18 — website message pam held

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** website

## What changed
A held patch for Message Pam (card a100, Will 18 Oct 07:04), `docs/design/review/2026-10-18-message-pam/message-pam-site.patch` (one diff of apps/site, `git apply --check` passes on origin/main; my temp branch a2ce7cb1 was never pushed). Not to be applied before the app ships. Words all Sage's (cb5fde16, 07f41e39, fa8df003, and Lena's L3 table).
- Messages in Pam: Pam in the lead, the member, case manager and program lead rows, a "Pam" row replacing "A super admin" ("Anyone with an account."), "Messages from Pam are written by the Pam team, the people who run Pam.", and "The conversation with Pam has no block or report, because it is where you get help."
- Still stuck? (the card): a line for everyone, "Have an account? Write to Pam in the app.", with an "Open Pam" button (`OPEN_PAM_URL` in `lib/links.ts`, currently the app's home, until the app has a route for it), above "Write to us", in both the form and address versions. Focus after the dialog closes returns to "Write to us" (the button, not the new link).
- Getting help from Pam: a new first section "Write to Pam in the app" (steps and "A person at Pam reads every message. Pam answers in the app, not by text."), and the old section retitled "No account, or can’t sign in? Write to us" (its menu label key updated).
- Limited accounts can write to Pam: Start here (steps 1 and 3), Case manager assignments, Pam words.
- `posts:date` at 2026-10-18 for messages-in-pam, talking-to-pam, start-here, case-manager-assignments, pam-words.

## Verified
Site tsc 0, tests 124 pass, build 0, a11y 0 (125 scans, 0 problems), usability 0, scrollspy 0, on the patched tree. A first usability run failed: the new "Open Pam" link was the first link in the card, so focus returned to it after Esc instead of "Write to us"; fixed by returning focus to the button.

## Revised (07:57)
Sage's two Getting help from Pam lines (ledger 67fea9ad) are folded in: "Pam has no phone line. If you can’t use the app, writing to us here is how you reach a person." and "Pam’s answer comes in the app." (replacing "…not by text", which would be false once texts_live is on). The same checks pass again on the revised tree (tsc 0, tests 124, build 0, a11y 0, usability 0, scrollspy 0).

## Revised (14:50)
"Open Pam" (`OPEN_PAM_URL`) is now the app's `/messages/pam/` (Nico, 6b449896): signed in it opens the person's Pam conversation, signed out it goes through Sign in and comes back, with the switch off it lands on Messages. Checks again clean (tsc 0, tests 124, build 0, a11y 0 with 125 scans, usability 0, scrollspy 0).

## Left undone
- The dates are 2026-10-18; if the app ships on another day, run `pnpm --filter @pam/site posts:date <slug>=<day>` for the five slugs.
- Whether "You can add a photo, like a screenshot of what you see." stays in Getting help from Pam: Mira asked Will (his Privacy sign-off did not mention photos). Left in for now.
- When message texts go on (texts_live), Messages in Pam's "Pam does not send a text for a message" has to change (Sage).
- No hours or reply time anywhere (Will has not signed any). Screenshots of the new screens wait for the app.
