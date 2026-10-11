# D-527 — The sign-in code step has a way to a person

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-signin-code-contact`

**Found by:** Iris, help-site research CP1 (`docs/research/2026-10-11-help-site.md`, Part 3), relayed by the merge desk (11 October 2026, 05:25 UTC). After a wrong or expired code, a person had Send again, Back, Language and the footer, and nobody to reach: no Contact Pam in English or Arabic, at 390 or 320. D-510 had moved the wrong-code message off the full Notice (which carried Contact Pam) onto a compact alert with no action, and the code step itself never had one. That breaks A26 ("a visible way to get help wherever a person can get stuck": sign-in is named) and step 1 of A28.

**What.** `PhoneSignInCard`'s code step gets a quiet link under Send again: the existing `help.needHelp`, "Need help? Contact Pam". It is outside the alert, so D-510 stands (a compact alert, staying on the code step, no button). It always shows on the code step, not only after a wrong code, since a code that never arrives is the commonest way to be stuck here. The person is signed out, so it goes straight to the help desk post for it, `SITE_URL/support/cant-sign-in/`, and not to Help in the app (A28, Sage's §1). The same card is step 1 of joining, where the same link is right.

**No new English.** `help.needHelp` exists in all seven languages.

**Tests.** `e2e/signin-wrong-code.spec.ts`: after a wrong code the link is there, to that address, under Send again, outside the alert, at least 44px tall, with no `tel:` link anywhere. `signin-short.spec.ts` (320×568, en/es/ar) still taps cleanly with it added.

**What a later session might reverse.** Always showing it, rather than after the first failure.
