# 2026-10-11 — languages-legal a63 line 1, program card, test 68 and the City licence

**Branches:** `claude/lena-program-sees-before-a-visit` (held for Will), `claude/lena-a-message-is-not-a-link` (DB test, mergeable now), `claude/lena-city-data-licence` (docs), this record · **Lane:** Languages & legal (Lena)

## What changed

- **What a program sees before a visit** (D-543, `claude/lena-program-sees-before-a-visit`, held). Will, 11 October 20:22 and 20:24 (via the merge desk): members must be able to message a program before booking, and be told what a program
  sees even before they book. `privacy.s.sharing.p2` line 1 now reads "A program sees you only after you write to them, sign their rules, sign up with them or plan a visit there, and only what they need to help you. Before a visit,
  they see your first name, what you write to them, the day you signed their rules and, if you signed up, how that is going." (Sage's wording, 20:42; lines 2–4 are the ones Will signed, unchanged.) A new card on the transparency
  screen, "A program can see:", five lines; one new line in the short version; `transparency.canSee.signed` moved into the card. The contract gains two things seen and two kept hidden.
  The site's What others can see post carries the same words. A Storybook story shows the whole screen. Test: `program-sees-before-a-visit.test.ts`. Red only on the missing translations of its own seven keys and the stale p2.
- **DB test 68** (`claude/lena-a-message-is-not-a-link`): a member who has only written to a program is not linked to it, by the merge desk's rule. Fails if `can_message()` is widened to a shared conversation (checked by mutation).
  Whole DB suite green on main (1307 checks) and with Nico's D-541 part 2 merged in a scratch worktree (1344).
- **City data licence** (`claude/lena-city-data-licence`): `docs/data-licences.md` (the terms as far as seen, each City layer Pam uses and what it takes) and a before-launch item to read the real licence once.
- **Nico's seven-language strings** for `messages.program.*`: six corrections sent (see below).

## What was wrong, and what missed it

- **Privacy and the site said a program sees a member "only after you sign up".** That stopped being true on 10 October, when a member could sign a program's rules with no sign-up and the program read their first name and the date
  (`program_policy_signers`), and is far from true with messaging. Nothing tested what a program reads of a member against what a member is told; `program-sees-before-a-visit.test.ts` holds the contract, Privacy, the screen and
  the site to one story, and DB test 68 holds the database to the rule that a message is not a link.
- **`transparency.canSee.signed` sat under "Your guide can see:" and was wrong twice** (no case manager reads a signature; "a program you joined" was not the condition). Found by asking where a program-only fact could go; fixed by the new card.
- **The merge desk's first rule (an `appointments_provider` policy that let a lead write whole rows, 0007) was already closed live** (20261010074241); what is left is the read of whole rows (note, `attendance_method`, `check_in_code`),
  which Piper is narrowing. My first draft of the contract comment described 0007, not the live state; corrected after Mira's note. Read the live database, not the first migration.
- **Three of Nico's six-language drafts added "only"** (zh-CN, zh-HK, ar) to "This program sees your first name and what you write." The English does not say it and it is untrue once a visit is planned. zh-HK also used 項目 and 發送
  where the whole bundle says 計劃 and 傳送. Sent to Nico as corrections.
- **A claim I nearly shipped:** "a program can never write first". It is false (a program can start a chat with anyone signed up with it or with a visit planned there). Sage and the merge desk caught it before it was written anywhere.

## Decisions made

D-543 (the card, the move of `canSee.signed`, what is deliberately not said). Mine and Sage's, Will can reverse it.

## Verified

Config tests on the held branch: red only on the missing translations (the seven new keys in six languages, p2 stale); the contract, Privacy, legal and site-story tests pass; site tests 94 passed; `tsc` clean; Storybook builds and the new story
renders at 320px in English. DB test 68: green on main and with D-541 merged. Not done: the six translations (they wait for Will), a fit audit of the new card in ru/ar/zh (translations don't exist yet), Piper's narrowing of the appointment read.

## Left undone

- Will's signatures: [1] line 1 and the bridge in `privacy.s.sharing.p2` (a63), [2] the "A program can see:" card with `canSee.signed` moved into it, [3] the short-version line, and optionally [4] the sentence about who can start a chat
  (Sage signs the wording; it should go to Will only with or after D-541 part 2 is on main). Then the seven languages.
- Wren changes Messages in Pam (`MessagesInPam.tsx`) in the same deploy as D-541 part 2 (Mira holds the merge). I gave her the rule.
- Check the contract's hidden list against Piper's appointments migration when it lands; add her test number to `transparency.ts`.
- Read the City licence once (`docs/before-launch.md`).

## Needs a human

Will: the four cards above; read the City of Philadelphia licence on phila.gov (a before-launch item).
