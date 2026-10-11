# D-512 — Contact Pam replaces Call Pam in the app: no phone number in ui or screens

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-contact-pam`

**Decided by:** Will, via the merge desk (11 October 2026, 03:06 UTC, card a54), recorded as A28: "Problem -> help desk -> email forward" and "take off phone number". Pam has no phone line.

**What.**
- `Notice` (`@pam/ui`): the support action is **Contact Pam**, a link to the app's Help screen (`/help/`), the same place the HelpBar goes. Props: `contactLabel` (omit it and there is no action) and `contactHref`. `supportPhone` and `callLabel` are gone; the `tel:` anchor and the phone icon are gone. Which notices offer support is still decided by `@pam/config/notices` (`offersSupport`).
- `useSupportPhone` is deleted, and every `supportPhone` prop and variable across the app's screens (about 40 call sites, including other lanes' screens: a mechanical change). `callLabel={t('help.callSupport')}` became `contactLabel={t('help.contact.action')}`.
- New key `help.contact.action`, "Contact Pam" (six drafts for Lena), recorded in the ledger. Sage is writing the final label; when it lands it replaces the English here.
- The Help screen: its first row, and the "Talk to someone" row under Your safety, no longer dial; they open the help desk on the website (`SITE_URL` + `/support/`, `NEXT_PUBLIC_SITE_URL`). The hours line under the old Call row is gone with it. Privacy's "copy of my data" and "delete my account" pages, which ended in a Call Pam button, now end in Contact Pam, which opens Help. The HelpBar's phone glyph became the help glyph.
- **Contact Pam works signed out** (Sage's words §1, Mira 03:20): `Notice` takes its destination from `ContactHrefProvider`, which `Providers` fills through a lazy `ContactHrefSync`: Help (`/help/`) when signed in, the help desk (`SITE_URL/support/`) otherwise, since a sign-in error or a paused account shows the button to somebody who cannot get in. A screen's own `contactHref` still wins.
- `help.needHelp` is "Need help? Contact Pam" (six drafts); `onboarding.phone.callInstead` (no screen uses it) is removed from all seven languages and the ledger. The bodies in Sage's §4 are Lena's to apply, so I did not touch them.
- The gallery page's hard-coded number is gone.
- Left alone on purpose: `place.call` ("Call this place") and a program's own number are a place's, not Pam's. `tel:911` on Your safety stays. `app_settings.support_phone` stays in the database, unread (A28).
- Tests: `packages/ui/test/notice.test.tsx` expects a `/help/` link and no `tel:` link; the e2e that looked for a Call link (account, directory, messages, places, consent, a11y) now look for Contact Pam, and the a11y spec checks the help desk link is in the server-rendered HTML and no `tel:` is.

**Not part of this.** About 33 English strings still say "call Pam" or "call us" (for example `notice.something_went_wrong.body`, `join.failed.body`, `privacy.copy.body`, `help.needHelp`, and the legal texts); the words are Sage's to propose and Will's to sign, then Lena's to carry. `help.call.*`, `help.callSupport` and `help.menu.call` are now unused, left for that pass.

**What a later session might reverse.** Where the Help screen's first row goes (the help desk on the website, rather than a page inside the app); the HelpBar glyph.
