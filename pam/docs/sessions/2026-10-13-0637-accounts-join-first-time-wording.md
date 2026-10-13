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

- **06:52 (Mira):** Sage's two code strings go in as their own last commit, so it can be dropped if Will
  keeps his words (card a82); main merged (96f27a77); the 390px before/after pictures committed in
  `docs/design/review/2026-10-13-join/`. The 320×568 test stays as it is: the words are Will's, and Dot
  makes the hero smaller on short screens.
- After the merge: `pnpm -r typecheck` clean; ui 124, site 95, web 156 pass; config fails only on the
  six keys waiting for Lena (14 tests, every one naming them); Playwright join, account, consent,
  signin-short, a11y: 258 passed, 6 failed (320×568, waiting for Dot).

- **07:05:** Sage's signed fixes (`join.staff.body`, `admin.caseload.empty.body`, `invite.expired.sent.body`) and
  the expired page's email offer behind a new switch, `app_settings.invite_emails_live` (migration
  `20261013070505`, 'off'); off shows Contact Pam. Dot's `claude/pam-design-signin-fit` (f319ae54, D-564) merged:
  the short-screen hero, and `TextLink isUnderlined` for the reveal link. Sage's code words reverted and
  re-applied as the last commit, so it stays droppable.
- Checks then: `pnpm --filter @pam/db test` all pass; tsc clean; web build and build-storybook; Playwright join,
  account, consent, signin-short, a11y, admin on 3 projects: 330 passed (the 320×568 case is green). Pictures
  retaken with the underlined link.

- **07:30:** merged Dot's tighter fit (90533a90; Lena's longer pt-BR and Russian needed it) and Lena's
  `claude/lena-w6-invited-words` (629171de: the W6 lines and Sage's three fixes in six languages). Only
  `join.code.question` and `join.code.reveal` remain untranslated, waiting for Will's pick on a82; the
  config tests fail on those two keys alone (12 tests). Playwright join, account, consent, signin-short,
  a11y, admin: 329 of 330 passed, and the one timeout (account "picks a side on Profile", iPhone SE) passed
  9 of 9 on a re-run. Sage's code-words commit is ce18f5ff, no longer the tip: revert it if Will keeps his.

## Left undone

- Lena: the six languages for the six keys above.
- Sage: record Will's signature for the W6 lines and the two Join lines; propose the held fixes
  (`join.staff.body` without "a day or two", `admin.caseload.empty.body` with an invite link and a next
  step, the expired-link "Check your email" while email may be off). Not built until she signs.
- Dot: the reveal link's look (today it is `TextLink`, with no underline, and reads as plain text).

## Needs a human

- Will: the 390px screenshots (Mira puts them on his card); the 320×568 overflow choice; W2's back arrow.
