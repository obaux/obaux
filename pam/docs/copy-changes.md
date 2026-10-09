# Changing words in Pam

Pam is in seven languages (English, Spanish, Brazilian Portuguese, Simplified
and Traditional Chinese, Russian, Arabic — A24). A change to the English is not
finished until the other six say the same thing, **fit where they are shown,
and reach people by text and email too**. This is how, and what stops it going
wrong silently. (Why each piece exists: D-424, D-425.)

## On the screen

1. **Change the English** (`packages/config/src/locales/en.json`). A new key goes
   in `en.json` first, with the same key in every language file.
2. **See what now needs an answer.**
   `pnpm --filter @pam/config copy:status` lists, per language, every key that is
   **stale** (the English changed and the translation did not), **new**
   (`unrecorded`), or missing. The unit tests fail on the same list, so a push
   cannot skip it.
3. **Answer it**, either:
   - by hand, in each language file; or
   - `pnpm --filter @pam/config copy:draft` — asks a model for drafts of exactly
     the stale and missing keys, tells it what the English used to say and what
     the neighbouring strings on the same screen are, and checks what comes back
     (every key, the same `{placeholders}`, no markup, not absurdly long). Needs
     `ANTHROPIC_API_KEY` in your environment — never in a file in this
     repository. `--dry-run` shows the requests without sending them.
     **A draft is a draft:** read it; the dignity-term and parity tests still
     apply; and anything that is a promise (privacy, terms, the transparency
     screen, notices) still needs a native reader before it ships.
4. **Record it.** `pnpm --filter @pam/config copy:ack` writes what you answered
   into `locales/ledger.json`. It accepts new keys and changed translations by
   itself, and **never a stale one**: if the English change did not change the
   meaning (a typo, a comma) say so on purpose — `copy:ack --keep the.key`.
5. **Look at it fit.** Storybook's language switch has a *Pseudo-language*: the
   English stretched about 40% and wrapped in ⟦ ⟧ — a string with no closing
   bracket was cut off, and a string with no accents never went through `t()`.
   Then `pnpm --filter @pam/web build-storybook && pnpm --filter @pam/web
   audit:fit` measures every story in every language at 320px; the
   `PAM Language fit` workflow does it for Russian, Arabic, Simplified Chinese and
   the pseudo-language on a pull request that touches copy or UI.
   Text should wrap and grow (`@pam/ui` `Button`, `Badge`, `Segment`), never be
   trimmed; only a page title steps down in size (D-422).

## In a text message

Texts are written in `packages/config/src/sms-templates.ts`, one template at a
time, in all seven languages — and **each language is signed on its own**
(`reviewedBy` on the draft, by a person who reads it). Until a language is
signed for a template, **the person is texted in English**: a text cannot be
shown to someone for a second opinion first, so nothing a machine drafted is
ever sent.

- A text in a script the cheap encoding cannot carry (Chinese, Russian, Arabic)
  is held to **70 characters**, not 160, because Pam promised the carrier one
  segment per message. A template that cannot be said that briefly in a language
  — an appointment reminder has a time, an address and a link — has no text in
  it, and the person is texted in English. Allowing two segments would double the
  cost and change the registered campaign: Will's call (docs/before-launch.md).
- Every language has its own list of words a text may never contain (justice
  involvement), applied on top of the English list, and re-checked by the
  dispatcher as the last step before Twilio.
- Run `pnpm --filter @pam/config test`: it regenerates the dispatcher's bundle
  (`supabase/functions/dispatch-sms/templates.json`), and a bundle behind the
  source fails a test. Then deploy `dispatch-sms`.
- Changing an English text means asking again for its sign-off (clear
  `reviewedBy`), as before.

## In an email

`packages/config/src/invite-email.ts` has the invite email in all seven
languages the same way: Arabic is set right to left, each script has a font
stack its readers' devices carry, and a language nobody has signed gets the
English email. Preview any of them in Storybook (*Onboarding / Invite email*).

## Whose language it is

A text is rendered in the **recipient's** language at the moment it is sent:
their profile's `preferred_language`, so a member who switches language gets
their next text in it. For the two cases with no profile — a staff request that
is denied, a fresh invite link by email — the language they were reading Pam in
when they asked travels with the request (migration 0085).

## Numbers

Decisions, amendments, migrations and changelog versions are numbered by the
session that writes them: claim yours in `docs/allocations.md` first.
