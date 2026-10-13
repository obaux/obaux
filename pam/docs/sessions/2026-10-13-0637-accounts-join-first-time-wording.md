# 2026-10-13 — Accounts & invites: Join Pam (W6), a language dropdown and a hidden code field

**Branch:** `claude/pam-join-first-time-wording` (from `main` at `6d4697d5`) · **Lane:** Accounts & invites

Will signed W6 in this session ("w6 is approved by me", 13 October). Mira added his two Join screen
asks (06:00 UTC, with screenshots): bring back the language dropdown, and hide the code field behind
"Did someone invite you via code?".

## What changed

- Sign in from an invite: title "Join Pam" (`signin.title.invited`, `PhoneSignInCard` `isInvited`) and
  Will's three signed lines in `signin.invited.*`.
- The expired-link page reads its own copy of the old lines (`invite.expired.invited.*`, moved with
  their six translations), so it never says "start with your phone number".
- Join › About you: `ChoiceChips` → `Dropdown` for the language; the code field hidden behind
  `join.code.question` and the link `join.code.reveal`, open from the start with a code or an
  `inviteProblem`; the link moves focus into the field.
- Tests: `consent.spec` (Join Pam title; the expired page keeps its line), `account.spec` (closed by
  default, the link opens and focuses it, a wrong code leaves it open with the code; the dropdown
  changes the screen to Spanish), `join.spec` (the chips test is now the dropdown: all seven languages,
  starting on the active one, in English and Arabic).
- D-563, a changelog fragment, this log, a STATUS section.

## What was wrong, and what missed it

- **The link did not move focus at first.** `TextField` makes its own id and ignores the `id` passed
  in, so `getElementById(codeFieldId)` found nothing. Focusing by `input[name="inviteCode"]` a frame
  later works; the test caught it.
- **The signed member line is too long for 320×568.** `signin-short.spec` (tap and pinned header,
  English, invited) fails: "Send me a code" ends at 579px of 568. Not fixed: shorter words or a smaller
  hero is Sage's, Dot's and Will's choice.

## Decisions made

- D-563 — Join Pam, the language dropdown, the code behind a question; the expired page keeps its line.

## Verified

| Check | Result |
|---|---|
| `tsc` (web) | clean |
| `@pam/web` build | builds |
| Playwright join, account, consent, signin-short (320, dark-320, iPhone SE), after Dot's merge | 210 passed, 6 failed: the 320×568 invited English case above |
| `copy:status` | 6 per language for Lena: `signin.invited.*` stale, `signin.title.invited`, `join.code.question`, `join.code.reveal` missing; the unit test fails on the same list until she answers |
| Screenshots at 390px | before/after of Join › About you (closed and open) and Sign in from an invite, for Will's card |

- **Later, 06:40:** built with Sage's words for the code, then back to Will's at 06:50 (Mira: use
  Will's until he answers; only `join.code.question` and `join.code.reveal` differ).
- **06:50:** merged Dot's `claude/pam-design-button-counter` (eccfec15, D-561) at Mira's word and swapped
  in `LanguageField`; the D-451/D-455 tag test now runs on the open list's rows (English and Arabic).
- Pictures at 390px for Will: light, dark and Arabic, each closed, with the language list open and with
  the code open; Sign in from an invite. Arabic shows the two new lines in English until Lena answers.

## Left undone

- Lena: the six languages for the six keys above.
- Sage: record Will's signature for the W6 lines and the two Join lines; propose the held fixes
  (`join.staff.body` without "a day or two", `admin.caseload.empty.body` with an invite link and a next
  step, the expired-link "Check your email" while email may be off). Not built until she signs.
- Dot: the reveal link's look (today it is `TextLink`, with no underline, and reads as plain text).
- The 320×568 overflow.

## Needs a human

- Will: the 390px screenshots (Mira puts them on his card); the 320×568 overflow choice; W2's back arrow.
