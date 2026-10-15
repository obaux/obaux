# 2026-10-15 — languages legal lead members reported places super admin words and the wrong-green audit checks

**Branch:** `claude/lena-records-15-oct-eve` (off main `9b9d31b2`, b43) · **Lane:** Languages & legal (Lena) · written 15 October, about 16:25 UTC. The third part of the day: the 14:45 log (`2026-10-15-1442-…the-stray-symlink`) covers the case manager lists, trips, P10 and the symlink; this one is what came after it, from Ava's, Piper's and Sage's keys.

## What changed

- **Ava's case manager pass, the last key:** `person.connect.distanceFrom` ("Distances are from City Hall.", Sage's ledger `f420e6e0`) in six languages, `claude/lena-cm-flow-words` @ `4b5a9a93` (in b43). With it `@pam/config` on her branch went green (it had been red on exactly that key). Each language says its own word for a city hall; Mira's call, a native reader may change it (one line per file).
- **Piper's lead pass words** (`claude/lena-lead-words` @ `65a83a33`, in b43; described in the 14:45 log) and then the four "people" → "members" swaps Sage signed (ledger `7fa02388`: `policies.intro`, `book.intro`, `book.people`, `interested.title`): `claude/lena-lead-members-words` @ `2b7f550a` (in b43), the word each language uses for members in `join.privacy.provider.*`, Spanish usted. One story added, Program lead › Screens › Interested (no story reached that screen).
- **Reported places** (Piper, D-585; Sage's ledger `7cfbcb03`): the seven lines `places.reported.wrote`, `keep.hint`, `remove.hint`, `remove.confirm.title`/`.body`, `done.keep`, `done.remove`, `claude/lena-reported-words` @ `353f156d` (in b43), her allow-list block in `copy.test.ts` deleted. Her stories (`3606792a`) then made all seven drawable. Afterwards **`claude/lena-wrote-singular` @ `59825d7b`** (not yet on main): `places.reported.wrote` said Escribieron: / Eles escreveram: / 他們寫道： (plural, for one reporter); it now says what Nico's `supportReply.theyWrote` says for the same English, Escribió: / Escreveu: / 對方寫道：.
- **Nico's `supportReply.theyWrote`** ("They wrote:"): his six drafts on `claude/messages-answer-by-text-context` @ `29dea226` are what I would write; no commit from me, `copy:status` in step.
- **Ava's super admin pass** (Sage's ledger `08637d18`): 23 keys in six languages, `claude/lena-superadmin-words` @ `67558940` (merged into her `claude/pam-super-admin-pass`, which is at `00b15039` with eight new decision-state stories): `requests.confirm.*`, `requests.decided.*`, `review.confirm.approve.*`, `review.decided.*`, `review.theProgramLead`, the spoken `directory.demoView.for` and `profile.menu.work`, and `requests.city` reworded to "City: {city}". Spanish usted (staff-only); Russian never declines a name (`{name}` first or after a colon).
- **Row 5 of the program lead's What to expect** (`join.privacy.provider.5`, Ava's `claude/pam-lead-expect-row5` @ `572ed044`) was fit-checked with my held translations on an unpushed scratch merge (`cc21ce1e`); both stay HELD for Will's card a92 (`claude/lena-program-saves-held` @ `d0872818`).

## What was wrong, and what missed it

- **My drawn-keys check said "drawn" for lines that were not on screen.** It looks for the pieces of a string between its placeholders, and a short title such as "Approve {name}?" is "Approve" plus a question mark, which the button already on screen satisfies. On the super admin stories it reported 8 of 23 keys drawn; the truth was fewer. **What now catches it:** I check the long lines (bodies, "Yes, …" buttons) as the proof that a state is drawn, name the short ones as the weak check in my READY, and ask for a story per state. With Ava's eight Decisions stories all 16 state lines are drawn in all seven languages; three keys are still not drawn (below).
- **A story that does not reach its state is silent in every language.** Four of Piper's seven Reported places lines and 15 of Ava's 23 were drawn by no story at first, and the fit audit said "0 findings" on both: the confirm dialogs and "done" banners open only after a tap. The audit's "0" is about what is drawn. Both stories were then added by their owners with long names, and I audited those.
- **English `.one` as a literal "1 policy" would have been wrong in two languages.** The Program tab's Policies row always shows the count, and Portuguese uses the "one" form for 0 as well as 1, Russian for 21, 31 and 101, so a fixed "1" there says "1 política" with none and "1 правило" with 21. The placeholder test had forced the literal because English had no `{count}`. English is now `{count} policy` (it renders the same), and the key is in `NO_PLURAL_VARIANTS` in `test/_bundles.ts`, the helper's own list for a key already chosen for "one".
- **`copy:ack --keep` on a title is a claim that the old translation still says the same, and it was false in five of six.** Piper changed "Policies for participants" to "members" and kept the translations; es, pt-BR, zh-CN, zh-HK and ar still said participants. **What catches it:** after a `--keep`, read the kept lines against the signed rule (Sage: the word each language uses for members in `join.privacy.provider.*`).
- **Two lines with the same English were written apart.** "They wrote:" came out plural in my Reported places line and singular in Nico's, found only when his arrived. Before translating a line, search the bundle for its English.
- **I ran the drawn-keys check against `storybook-static` while my own script was rebuilding it** (twice; `page.goto` failed). Run it inside the script, straight after the build it checks, and read the results from the script's log.
- **A `sed` that was meant to drop other phases of my audit script also deleted its function definition,** so the first launch ran nothing. I counted the `^phase` lines (1, expected 2) before trusting it.

## Decisions made

- None new. Mira's: City Hall keeps each language's own word; "{count} policy" for the one form is agreed (Mira, Piper).

## Verified

| Check | Result |
|---|---|
| `@pam/config` on `4b5a9a93`, `65a83a33`, `2b7f550a`, `353f156d`, `67558940`, `59825d7b` | 1311 passed, 1 skipped each; `copy:status` in step (on Ava's pass with `distanceFrom` missing it had 12 failures, all that one key) |
| Fit, Connect (`--match connect`, 11 stories) built at `4b5a9a93`, 7 languages, 320x760 and 320x568 | 0 new; `person.connect.distanceFrom` drawn in all 7 |
| Fit, staff privacy step (5 stories) at `cc21ce1e` = row 5 `572ed044` + held `d0872818` | 0 new; `join.privacy.provider.4` and `.5` drawn in all 7 |
| Fit, Policies (3), Book (6), Interested (1) at `2b7f550a` | 0 new; all four "members" keys drawn |
| Fit, Reported places (10 stories) at `3606792a` | 0 new; all 7 keys drawn (en, es, ru, ar) |
| Fit, case manager and program lead Sign up with the city missing (2 stories) at `8a1c31ff` = Ava `99f84302` + `4b5a9a93` | 0 new; `join.details.need.city.work` drawn |
| Fit, Program lead pass (ProgramWizard 5, Program tab and states, Policies 3, services 4) at `65a83a33` | 0 new at both heights |
| Fit, super admin screens (24 stories) at `67558940`, then the 8 Decisions stories at `00b15039` | 0 new at both heights; 16 of 16 decision lines drawn in all 7 languages |

## Left undone

- **`claude/lena-wrote-singular` @ `59825d7b`** is not on main (three values: es, pt-BR, zh-HK).
- **Not drawn by any story:** `review.theProgramLead` (the fallback for a program with no lead name; both stories give a lead), `directory.demoView.for` and `profile.menu.work` (spoken only). The plural forms the fixtures do not reach (ru few/many, ar zero/two/few/many for `program.policies.rowBody`) are unmeasured; they are the same length as the base form.
- **P10, held for Will's card a92:** `claude/lena-program-saves-held` @ `d0872818`; at ship `legal:date privacy <ship day>`, `copy:ack`. The row 5 wiring (`572ed044`) is held with it.
- **a86 p7** (Sage's ledger `4ac2770b`), **a84** Privacy lines, the **Google sync** lines (#61), **`badge.craftsman`** (card a90): all waiting for Will.
- **`admin.seeing.body` and the unused `person.savedPlaces.*` keys:** retire in my next sweep (Ava, Mira); six translations each.
- **Native readers** for every translation. First: Spanish member side (D-577), the shared screens, and now City Hall (es Ayuntamiento, pt-BR Prefeitura, zh 市政厅/市政廳, ru здание мэрии, ar مبنى البلدية).
- The Friday task: the welcome-slide promise sweep with Sage (`onboarding.provider.3`, `onboarding.admin.2`).

## Needs a human

- Will: a92 (P10 and row 5), the p7 wording, a84, the Craftsman name (a90).
- A native reader per language, and for Spanish once for D-577's lines and the usted lines on staff screens.
