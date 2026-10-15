# 2026-10-15 — languages legal case manager lists trips p10 and the stray symlink

**Branch:** `claude/lena-records-15-oct-pm` (stacked on `claude/lena-es-member-tu` @ `80721a97`, which carries the earlier 13:38 log) · **Lane:** Languages & legal (Lena) · written 15 October, about 14:45 UTC. The second half of the day's jobs from Iris's first passes.

## What changed

- **Case manager lists (Iris case manager P5), `claude/lena-cm-lists` @ `450f8eb3`.** Home said what a case manager can see in one paragraph (`admin.seeing.body`), the joining step said it in three lines (`join.privacy.admin.1`, `.2`, `.3`), and the two did not list the same things. Sage signed one wording for both (ledger `4269f020`); I translated the four keys into six languages with the same words in both places, so the two lists match word for word in every language (Spanish is usted: it is a staff screen). Strings only; `ADMIN_CAN_SEE` in `transparency.ts` is not touched.
- **Trips, Iris member P1 and P2, `claude/lena-trips-pick-words` @ `3a258bc9`** (stacked on Piper's `975cb919`, D-578): `trips.card.label.alone` (a trip card named with no companion; Chinese and Arabic get their own comma, `{place}，{when}` and `{place}، {when}`) and the three `trips.new.missing.*` lines as instructions ("Pick a day and a time.") in six languages. The same three Spanish lines are on the P4 branch (`80721a97`) so the two cannot say different things.
- **Iris program lead P10 (what a program sees of a member's saves), HELD until Will signs a92: `claude/lena-program-saves-held` @ `d0872818`.** `transparency.program.saves` and `join.privacy.provider.5` in seven languages (Sage, ledger `d05f9d80`), the one-sentence edit to `privacy.s.sharing.p2` ("…and, if you signed up, how that is going and when you save a new place, but not which one."), the program line in `transparency.ts`, the site's "What others can see" sentence and a new cell (`Yes, but only once you sign up with them`, signed by Sage, ledger `b2988e72`), and `program-sees-before-a-visit.test.ts` holding Privacy p2, the card and the site post together. `legal-updated.json` says 2026-10-15 **provisionally**. At ship: `pnpm --filter @pam/config legal:date privacy <ship day>`, then `copy:ack`.
- **Ava's case manager pass words (D-580), `claude/lena-cm-flow-words` @ `5e1f5603`**, off her `f80de52d`: `admin.caseload.empty.body` reworded ("…tap Invite someone below."; the quoted row name is `profile.menu.invite` in each language), `admin.seeing.told` (the closing sentence of the old Home paragraph, now its own line under the list), and the two new About-you lines for someone joining by a staff invite, `join.details.city.work` and `join.details.need.city.work` ("City you work in" / "Tell us the city you work in."). Sage's ledger `8710a563`. Spanish: usted on the two Home lines (staff-only), tú on the city lines (the shared Join step, D-577). Locales and ledger only, plus one commit that removes the stray symlink her branch had taken from my old cm-lists SHA. **Not translated:** `person.connect.distanceFrom` ("Distances are from City Hall.") until Sage signs it; W3 needs no string (the page title is the member's name).
- **Piper's program lead pass words (D-582), `claude/lena-lead-words` @ `65a83a33`**, off her `028588e7` (Sage, ledger `a575a9ae`): "No address yet" and its body (P2), "Policies for members" (`program.policies.row`, `policies.title`), `program.service.policies.none` and the `program.policies.rowBody` family (ru one/few/many, ar zero/one/two/few/many), six languages, Spanish usted. Three things beyond the lines: (1) the titles Piper had kept with `copy:ack --keep` said "participants" in five of six languages (es, pt-BR, zh-CN, zh-HK, ar), so they are changed to each language's own word for "members" in `join.privacy.provider.*` (Russian already used it); (2) English `program.policies.rowBody.one` is now `{count} policy` (it renders as "1 policy"), because the row always shows the count: Portuguese uses the "one" form for 0 and Russian for 21, 31 and 101, and a fixed "1" there is wrong; the key is in `NO_PLURAL_VARIANTS` in `test/_bundles.ts`; (3) a `ProgramWizard › ReviewNoAddress` story, because the existing Review story has an address and the warning was drawn by no story. Piper's temporary English allow-list in `copy.test.ts` is deleted. Fit audit (ProgramWizard, the Program tab and its states, Policies, Program services) at both heights: no findings; the plural forms the fixtures do not reach are unmeasured.
- **Not here yet:** Ava wires `join.privacy.provider.5`. Sage may swap "people" for "members" in `policies.intro`, `book.*` and `interested.title`; not translated until she answers.

## What was wrong, and what missed it

- **Three READY branches carried a committed symlink, `pam/packages/config/node_modules`.** I made it in my test worktrees so the config tests would run there; `git add -A` committed it. `pam/.gitignore` says `node_modules/`, with the slash, which matches directories and not a symlink; and I did not read the file list of the diff before sending READY. Checked out in `/home/user/obaux` it replaced the path with a link to itself (it did, at 14:30, on my own checkout). Nothing was lost (this repo links with `node-linker=hoisted`; that directory held only a `.vite` cache), and `origin/main` was never touched. Fixed with one commit per branch that deletes only that link, and Mira got the new SHAs (`450f8eb3`, `3a258bc9`, `d0872818`). **What now catches it:** `node_modules` is in my `.git/info/exclude`, and before a READY I run `git diff --stat <base>..HEAD` and read every path that is not a locale, the ledger, a test or a doc. **Not done, and for the desk to decide:** change `pam/.gitignore` from `node_modules/` to `node_modules`, so the next worktree does not do the same.
- **My first fit audit of the held branch measured the wrong commit.** The audit script did `git checkout -q claude/lena-program-saves-held`, which failed because `/tmp/wt/p10` already had that branch checked out, and `-q` hid it; Storybook was built from the parent `b7366b52`, which lacks the Privacy p2 edit. The numbers looked right (0 findings). I caught it by comparing the commit to the branch tip before reporting. I rebuilt on the tip. **What now catches it:** every audit script writes `git log --oneline -1` into its own log before it builds, and I read that line before I quote a number.
- **A story that does not draw a key says nothing about it.** `join.privacy.provider.5` is drawn by none of the program-lead staff-privacy stories yet (Ava has not wired it), so the fit audit is silent about it and "0 findings" cannot be read as "it fits". Its length sits with its neighbours in every language (en 97 chars, `.2` is 116; ru 128 and 126; zh 36 and 42; ar 95 and 94), which is a guess, not a check; the staff-privacy audit has to be run again when Ava's wiring lands.
- **Earlier in the day I told Mira the case manager audit had run when its command never started** (a relative `cd` from the wrong directory). I started it again with absolute paths and said so. Read the first line of an audit's output; do not trust that a command was sent.

## Decisions made

- None new. D-577 (Spanish tú for members and shared screens, usted for staff-only screens) covers the register of the case manager lists; D-578 is Piper's.

## Verified

| Check | Result |
|---|---|
| Fit audit, case manager lists: staff privacy step (5 stories) and case manager Home (6 stories) x 7 languages, 320x760 and 320x568 | 0 findings |
| Fit audit, held P10 branch rebuilt at `9bf1b56d`: Privacy (6 stories), Terms (1), What others can see (3) x 7 languages, both heights | 0 findings (the symlink fix after it changes no source) |
| What those stories draw (drawn-keys check, en and es) | `privacy.s.sharing.p2` on the Privacy page; `transparency.program.saves` on "What your guide can see in full"; `join.privacy.provider.5` on none |
| Fit audit, Ava's pass words rebuilt at `5e1f5603`: Case manager Home states (5 stories), Home, case manager Sign up, program lead Sign up x 7 languages, both heights | 0 findings. `join.details.need.city.work` (the error line) is drawn by no story, so unmeasured |
| `@pam/config` tests on `5e1f5603` | 1299 passed, 12 failed: all 12 are the key-for-key, own-script and status checks naming `person.connect.distanceFrom` (unsigned), and no other key |
| `@pam/config` tests on the held branch (before the symlink fix) | 1312 passed |
| `@pam/site` tests on the held branch | 100 passed |
| `copy.test.ts` after removing the symlink, in the main checkout and a worktree | 72 passed |
| `git ls-tree` of the four fixed branches for `config/node_modules` | none |

## Left undone

- **P10 ship (after Will signs a92):** `legal:date privacy <ship day>`, `copy:ack`; Ava wires `join.privacy.provider.5`; re-run the staff-privacy audit at both heights when she does; Wren may want the site cell read.
- **a86 p7:** the six translations of Sage's wording (ledger `4ac2770b`), `copy:ack`, `legal:date privacy <the day the inline search ships>`, the two descriptive notes in `third-party-hosts.test.ts`; after Will signs.
- **a84** Privacy lines (`what-we-keep.p14`, `p15`, `p7`, `sharing.p8`) and the Google sync lines: still with Will.
- **`person.connect.distanceFrom`** ("Distances are from City Hall."): translate when Sage signs it; one line in six files on `claude/lena-cm-flow-words`. Until then `@pam/config` is red on Ava's branch and on mine (12 tests, one key).
- **"People" → "members" on lead screens** (`policies.intro`, `book.*`, `interested.title`): wait for Sage, then translate with the word each language uses in `join.privacy.provider.*`. Piper's `ProgramPolicies.stories.tsx` still has a story labelled "Policies for participants".
- **`join.details.need.city.work`** has no story; Ava was asked for one on the case manager and program lead Sign up.
- **`admin.seeing.body`** is no longer drawn (Home draws `join.privacy.admin.1-4` and `admin.seeing.told`); its six translations stay until Ava deletes the key.
- **`badge.craftsman`** in six languages once Will picks (card a90).
- **Native readers** for every translation; first the Spanish member side (D-577) and the shared screens.
- Friday task: the welcome-slide promise sweep with Sage (`onboarding.provider.3`, `onboarding.admin.2`).

## Needs a human

- Will: sign a92 (P10), the p7 wording, a84, the Craftsman name (a90); whether Privacy and Terms follow Transparency into tú in Spanish (not decided).
- A native reader for Spanish, once, for D-577's lines and the case manager's usted lines.
- The desk: `pam/.gitignore` and `node_modules/`.
