# 2026-10-11 — languages-legal translation line and calendar fit check

**Branch:** `claude/lena-record-a70` (this record) and `claude/lena-translation-retention` (the line, held for Will) · **Lane:** Languages & legal (Lena)

## What changed

- **a70, the translation line** (`claude/lena-translation-retention`, 61f4cdf5, held): `privacy.s.translation.p2` no longer says "It keeps nothing and does not learn from them"
  about "a company that translates". It names Claude, an AI made by Anthropic, and says what Anthropic's published terms say: the words are deleted within 30 days and not used to train;
  a message its safety checks flag may be kept up to two years; a message may also be kept if the law requires it. Mira asked for it, Sage signed the English at 20:21 (her 20:18 note is replaced).
  All seven languages are written and the ledger is acknowledged, so a70 needs only Will's signature. It shows on the Privacy page only while `MESSAGE_TRANSLATION` is on (it is off).
- **The same claim in three more places**, all fixed on that branch: `docs/before-launch.md` (item 2 said to get "not kept and not used to train" in writing; it now says what the page says and to re-read
  Anthropic's retention page the day the switch goes on and whenever the model changes), a comment in `packages/config/src/translation.ts`, and two tests that pinned the old words
  (`legal.test.ts`, `third-party-hosts.test.ts`).
- **`translation-retention-line.test.ts`** pins the English, "Claude", "Anthropic" and "30" in every language, that the request to Anthropic carries only model, max_tokens, temperature, system and messages
  (no metadata or user id) and three headers, and the model name. A different model fails it until someone re-reads Anthropic's page and `docs/before-launch.md`.
- **Calendar link screen at 320px** (the open item from the last log): all seven languages, with the link made and with each "are you sure" box open (new link, turn off). No cut, clipped or overlapping text.
  Looked at in ru, ar and zh-HK as well as measured. Run on Piper's `claude/places-programs-calendar-link` at 01cd4590 (it carries my 29 `calendar.*` strings).

## What was wrong, and what missed it

- **The page promised what the supplier does not.** "It keeps nothing" was written when the key's terms were assumed, and `docs/before-launch.md` said to get that in writing. Anthropic's published terms say otherwise
  (30 days for the Covered Models, trust-and-safety retention up to two years for anything flagged, legal holds). Nothing tested the claim against the code or the terms; it was caught by reading Anthropic's page for a different reason (Mira's question).
  It never reached a member: the section is off with the switch.
- **The stock fit audit cannot see the calendar screen's long states.** The story loads with the link off, so the audit measured only the intro and one button. The made-link and the two dialogs hold the long strings and
  are reached by clicking. I measured them with a throwaway copy of the audit that clicks the make button and each link by its translated label (not kept in the repo). If these states matter again, they want their own stories
  (Piper's lane: `roles/states/`), and then `audit:fit` covers them.

## Decisions made

None of my own. Naming Claude and Anthropic on the page (rather than "a company that translates") is my recommendation to Mira, with reasons in her message; Sage's A29 signature and Will's signature on a70 govern it.

## Verified

Config tests on `claude/lena-translation-retention`: 36 files, 1119 passed, `tsc` clean, `copy:status` says all languages are in step. Calendar screen: stock audit on the story (exit 0, 7 languages, no findings), the clicking copy for
the made and dialog states (no findings, no failures), screenshots of ru, ar and zh-HK read by eye. Not run: the full seven-language audit on the a70 branch; the translation section is not rendered while the switch is off.

## Left undone

- Will's signature on a70, and on a63, a66, a67, a68 and the Google card (a71); then the six translations of each of the older four, and the Google card.
- A native reader for all seven languages of `privacy.s.translation.p2`, and for everything translated this week.
- Will should read Anthropic's data-retention page once himself before the switch goes on (`docs/before-launch.md`). I could not open the older privacy.claude.com page Mira quoted from here, so the 30 days and
  two years are from the current API page and Mira's quote, not cross-checked word for word.
- Friday 16 October's batch (the welcome slides, the attendance promise, the privacy guard, the staff-request words).

## Needs a human

Will: the signatures above; the Vercel plan; the Anthropic page. Nico: Twilio's retention.
