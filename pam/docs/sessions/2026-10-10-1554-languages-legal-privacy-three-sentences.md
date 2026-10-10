# 2026-10-10 — Languages & legal — Will's three privacy sentences (card a29)

**Branch:** `claude/lena-privacy-three-sentences` (from `main` at `673ccb0`) · **Lane:** Languages & legal (Lena)

From Mira (the merge desk), 15:25, priority over the reviews: Will answered card a29 at 15:15 UTC with "approved", covering three sentences word for word. Put all three in, with the six
translations, as Will's English; pin them in `legal.test.ts`; record a decision. It has to be on `main` before tonight's deploy (~01:30 UTC).

## What changed

- **`privacy.s.sharing.p4`** (replaces D-482's "…emails a case manager or a program…"): "When Pam sends an email, a company that sends email for us gets the email address and the email. It
  may not use them for anything else." Covers every email, a member's expired-link email included.
- **`privacy.s.what-we-keep.p7`**, last sentence: "Members are never asked for an email." → "Members are asked for an email only if their invite link has run out and they want a new one by
  email. We use it only to send that link, and delete it once it is sent." (the deletion is D-487).
- **`privacy.s.what-we-keep.p8`** (new): "If a program asks you to sign its rules, we keep what you signed, the date, and your signature. Only you see your signature. The program sees only your
  first name and the date." Section count in `legal.ts`: 8.
- Six translations of each (es, pt-BR, zh-CN, zh-HK, ru, ar), in each bundle's own words for first name, a run-out link ("venció", "venceu", 已过期, 已過期, срок истёк, انتهت صلاحية) and
  **for a policy**: the English says "rules", the app's English and every bundle's signing screen say "policy", so the translations use "políticas" / "规定" / "守則" / "правила" / "سياسات".
- `test/legal.test.ts`: the three sentences pinned word for word, p8 is in the section's list, every language has all three translated, and the old "never asked" is gone.
- D-490, changelog fragment, the before-launch item rewritten.

## What was wrong, and what missed it

Nothing new: D-482's two open points (the sentence did not cover a member; "Members are never asked for an email" had become untrue) were found last time, and Will's card settled them.
The third sentence fills a gap I found while reviewing D-485 part 2: the privacy page did not say Pam keeps a signed policy and the signature picture.

## Decisions made

- **D-490** — the three sentences, where they sit, and the "rules" / "policy" note.

## Verified

On `7725a50` (main `673ccb0` plus this): `@pam/config` 1052 tests (the three sentences pinned, readability grade included), `copy:status` in step, the browser suite on all three viewports **996 passed, 18 skipped**
(11.6 min), Storybook builds, the fit audit on the privacy page in all seven languages and the pseudo-language: 0 new defects. Merged with `main` again before pushing (below).

## Left undone

- **Guard, proposed to Mira, not built:** "nothing ties the privacy page's claims to the screens that collect the data." A cheap one: a list in `packages/config` of every input that collects personal
  data (phone, name, email, signature, photo, location/ZIP, message) with the privacy key that covers it, and a test that fails if the list is missing an input found by a grep of the app
  (`type="email"`, `inputMode`, the `request_invite_link`, `bookTrip`-style RPC names) or a covering key is empty. See the READY note for the proposal.
- The About Pam six, Wren's "Signing a program's rules" post six, Piper's review queue and the honest booking: after this.
- A native reader for all of it (before-launch).

## Needs a human

Nothing new.
