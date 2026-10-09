# 2026-10-09 — Seven languages, messages in your own language, and text that fits

**Phase:** 1 (member flows) · **Sessions so far:** the one that proofread Spanish
(D-421) and this one are the same conversation; the other concurrent session
was on `claude/pam-storybook` (D-404–D-411) and was merged in at the end.

## What changed

Will asked for languages one message at a time, and the work grew by what he
added:

1. **Brazilian Portuguese, then Chinese (Mandarin and Cantonese), Russian,
   Arabic** — `pt-BR`, `zh-CN`, `zh-HK`, `ru`, `ar` beside `en` and `es`
   (D-422). One registry (`packages/config/src/i18n.ts`); lazily loaded
   bundles; CLDR plurals; right-to-left; the phone's language as a starting
   point; a switching screen that says what is happening in the language being
   switched to; migration 0083 (the one check). SMS and email deliberately
   stay English/Spanish.
2. **Messages, read in the reader's language** — "Uber's approach": the
   translation, labelled Translated, a link to show the original. Built end to
   end and **switched off** (D-423): migration 0084, the `translate-messages`
   function, the thread UI, copy in all seven languages, and the privacy
   section that appears with the switch.
3. **A text-fit audit** of every story in every language at 320px
   (`pnpm --filter @pam/web audit:fit`), and the fixes it led to: wrapping
   `Button`, `Badge` and `Segment`; large titles that step down for a word
   that will not wrap; notifications in full; Explore's heading row; and more
   (D-422).
4. **Merged `claude/pam-storybook`**, which had taken D-404–D-411, migration
   0081 and its own changelog numbers. Mine are now D-421 (Spanish), D-422,
   D-423; migrations 0083, 0084; CHANGELOG 0.50.1, 0.51.0.

## What was wrong, and what missed it

- **The first overflow test could not see the bug.** It compared the page's
  `scrollWidth` to the screen's, and the Russian sign-in footer was cut at both
  edges while the page did not scroll at all. Nothing is wider than the screen
  when a bar clips its own contents. It is now `offscreenText()` in
  `e2e/languages.spec.ts`: where each word actually is, against the viewport,
  except inside regions that scroll on purpose. That found the About tabs and
  the Russian "Конфиденциальность" title the first time it ran.
- **The audit's own first draft lied in both directions.** It skipped the text
  node's *own* element when looking for something hiding its overflow (so a
  fixed-height box that cut its own words was invisible), counted an ellipsis's
  full untrimmed width as an overlap, and measured journeys before their
  fixtures had loaded — so English, the baseline, came up empty and every
  other language's defect looked "new". Fixed: own element included, only
  fully visible lines can collide, wait for the page to stop changing. If the
  English baseline is ever suspiciously small, that is where to look.
- **Stepping a font size down in a loop does not work under "reduce motion".**
  `useFitTitle` first tried sizes one after another, reading the page between
  them. Pam's reduced-motion CSS gives every element a 0.01ms transition, and
  a style read in the same frame as its change returns the *old* value — so
  the title never shrank, only for people with that setting (and the audit,
  which emulates it, was the only thing that noticed). It now measures the
  widest word once, on a canvas, and works the size out.
- **Two sessions took the same numbers.** D-403 (mine: Spanish; theirs: the
  tab bar), D-404/D-405 and migration 0081 each exist twice. Found by fetching
  before writing the records, which is what CLAUDE.md says to do; the fix was a
  merge and a renumber (a script that changes a number only on lines this
  branch added, since both sides use the same ones in comments).
- **Their new strings arrived in two languages.** The merge brought 14 new
  English/Spanish strings, five changed and nine removed; the other five
  languages failed the key-for-key tests until they were translated or dropped.
  That is what the tests are for, and it is also the cost of a seven-language
  product: every string anybody adds is now seven strings.

## Decisions

- D-421 — Spanish, spelled properly (first numbered D-403).
- D-422 — Seven languages, and text that fits in every one of them.
- D-423 — Messages, read in the reader's own language (built, switched off).
- `docs/sop-amendments.md` A24 — Pam is in seven languages, not two.

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | clean (5 packages) |
| `@pam/config` tests | 397 pass (16 files), including the translation core and handler (51) and the privacy-switch tie |
| `@pam/ui` tests | 74 pass |
| `@pam/web` unit tests | 40 pass |
| Database suite | all pass through `19_message_translations_test.sql` (0084); `18_more_languages` proves 0083; `19` proves who can read, write and delete a translation |
| Browser e2e (3 projects, `pnpm build` first, run twice: before and after the last tab and bidi changes) | **816 pass**, 0 fail (8 minutes at 2 workers, re-run on the tree merged with `main` at D-420) — includes the new language page-fit checks |
| First-load JS (`check-bundle-budget.mjs`) | 542.7 kB of 600 kB; 57.3 kB to spare (after merging `main`) |
| Storybook build | passes on the merged tree (455 stories outside Foundations) |
| Fit audit, 455 stories × 7 languages × 320px (first run, before the merge: 446) | first run 353 new defects; after the fixes 29 remain, each looked at (design or detector noise — listed in D-422); the About tabs re-checked at 0 |
| Mutation checks | reading with the service role instead of the reader's sign-in fails 8 handler tests; the dignity check on the translation prompt was vacuous until it was given an object instead of a string |

## Left undone

- **0083 and 0084 were applied to the live project** at the end of the
  session (Will: "Migrate and proceed to merge"), after `list_migrations`
  showed the one drift there was — `0082_admin_reaches_assigned_only`,
  applied by the other session and committed on its branch — which touches
  nothing these do. Read back afterwards: the language check lists all seven
  codes; `message_translations` has RLS enabled and forced, one `select`
  policy for the people in the conversation, and `authenticated: SELECT` as its
  only grant. `translate-messages` is **not** deployed.
- **No native speaker has read any of the six new bundles.** See
  `docs/before-launch.md`; start with the privacy page, the terms, the
  transparency screen and the seven "Switching to…" lines.
- **Spanish has no dignity-term list of its own** (it is checked against the
  English terms); not caught because the old tests only ever had English.
- **A stale English count still reads "1 people"** in a few places in `en`,
  `es` and `pt-BR` (no plural form there; `ru` and `ar` have theirs). Listed in
  STATUS's backlog.
- **The audit cannot judge a translation, text in an image, or real phone fonts.**
  It is a floor, not a review.
- **Message translation has no per-person daily cap**, and no "always show the
  original" setting.
- No flow-map change: no screen was added or rewired (the switching screen is
  an overlay; the translated label sits inside an existing bubble).

## Needs a human

- Will, 9 October: the merge to `main` was held until 0079–0081 (photos,
  documents, link previews) were live; then "Photo and messages are treated the
  same. Only reported if flagged." (D-428). **0079–0081 are now live**, so what is
  left is Will's word to merge (STATUS row 36, `docs/before-launch.md`).
- Will: a native reader for each new language (above), and a yes/no per SMS/email
  template for the languages it is not yet written in.
- Will: whether the language picker should be limited for staff (it is not;
  default left open, because a case manager may be a Russian speaker too).
- Will: before translation is switched on — the provider's no-retention terms in
  writing, the wording that tells members first, a per-person cap.
- Whoever applies 0085: `list_migrations` first. The ledger reads 0078, 0082,
  0083, 0084, 0079, 0080, 0081 (in the order they were applied).


## Part 2 — merged, applied, and the rest of the ask (same session)

Will: "Migrate and proceed to merge. Ensure the other sessions align with this
one." and, before it, "what are best practices … We want SMS and emails to show
up on their desired language … implement it."

- **Migrated.** 0083 and 0084 live (see above). **Merge held by Will** until
  0079–0081 are live: this branch carries pam-storybook's photo, document and
  link UI. Branch merged with `main` (932d052) and pushed; `main` untouched.
- **Other sessions.** Both told (seven languages, the wrapping components, the
  numbers; what is held). `docs/allocations.md` + `numbering.test.ts` (D-426; the other session had also taken D-426, and moved its own decision to D-427).
- **Texts and emails in the recipient's language (D-424)** — see DECISIONS. The
  dispatcher and the config renderer had drifted (the dispatcher never shortened
  a long address; the Spanish STOP line had two spellings); a parity test now
  renders both. A reminder in English with a curly apostrophe in the street was
  one edit from being refused by a naive 70-character rule; the limit follows the
  template's own words instead.
- **Language where there is no profile — migration 0085.** Run twice on the
  throwaway database it changes nothing the second time; 17 new checks.
- **The copy pipeline (D-425, A25).** Ledger, draft script, pseudo-language, a
  fit workflow, `docs/copy-changes.md`.
- **Mistakes caught on the way.** A history check for "which translations are
  already stale" flagged 66 keys that were artefacts of merge order, so it is not
  claimed; the ledger starts from the merged tree. An early draft of the
  prompt for the draft script named the justice system; a test now forbids it.
  The font stacks first broke the email's `style="…"` attribute with their
  double quotes; a test now looks for that.

## Part 2 — what was checked

| Check | Result |
|---|---|
| `@pam/config` | 695 pass (was 401): texts in seven languages (349 in `sms.test.ts`), dispatcher parity, the invite email (14), the ledger and drafting (20), numbering (5) |
| `@pam/web` unit | 44 pass (was 40); now in CI |
| Database suite | 546 checks pass, 0 fail, `0001`–`0085`; 0083–0085 run a second time cleanly |
| Mutation checks | sign-off ignored (config, dispatcher, email) → caught; UCS-2 held to 160 → caught; language word lists off → caught; RTL off → caught; a reworded English string → 6 stale entries reported |
| Typecheck | clean, all packages |
| e2e / Storybook / budget | On the tree merged with `main` and with `claude/affectionate-goldberg-tvu4sz` (D-427): e2e **828/828** (816 + that session's 12), first load **544.6 kB** of 600 (55.4 to spare), Storybook builds with no `[journey] no fixture`. The full eight-column fit audit was started and **stopped** (about 800 of 3,720 renders, ~75 minutes more) because the merge changed what it measured; see left undone |

## Part 2 — left undone

- **No language is signed**, so nothing is sent in another language. A native
  reader per language, Will's two-segments call, the carrier re-filing and the
  email provider are all in `docs/before-launch.md`.
- **The `copy:draft` network call has not run** (no API key here); its prompt,
  parsing and batching are tested against a fake provider.
- **0085 is not applied; nothing waits on it.** 0079–0081 *were* applied (below). 0085 replaces two functions, the connector timed out on its `drop function` (again leaving nothing behind), so it is one short file, `packages/db/manual/2026-10-09-language-where-there-is-no-profile.sql`, for Will to paste whenever convenient (D-428). The app asks for the language and falls back without it (`rpcLanguage.ts`), so the merge does not wait.
- **The `PAM Language fit` workflow has not run on GitHub** (only its commands
  locally), and `scripts/fit-known.json` it reads **does not exist yet**: the audit
  that would write it (`--write-known`) is slow (~110 minutes for all eight
  columns, ~60 for the four it runs), so the first pull request that touches copy
  or UI will fail it once, listing the defects to look at and accept. The
  seven-language audit of 9 October (D-422) found 21 new defects after the fixes,
  each looked at, listed in D-422.

## Part 3 — photos, documents, link previews live; 0085 left for Will

Will: "Photo and messages are treated the same. Only reported if flagged." Then:
"Still need me to paste file to Supabase?"

- **Checked, not assumed.** 0079/0080 policies and the privacy copy do exactly
  that (D-428). Link previews are stricter still.
- **0079, 0080 and 0081 applied through the connector** after `list_migrations`
  showed no drift. The first attempt at 0079 timed out (60 s) on its `drop policy
  if exists` guards and left nothing behind (no bucket, functions, policies,
  constraint or ledger row; no hung query). Retried without the guards — no-ops
  on objects that did not exist — and it went in; 0080 kept its two real
  constraint replacements and went in; 0081 likewise. Read back: three private
  buckets (5 / 10 / 2 MB), seven storage policies, the preview table with row
  security forced, one policy, no write for signed-in users and no read for
  `anon`; the two attachment constraints; `anon` cannot call the new functions.
  `get_advisors`: nothing new for `anon`. The applied SQL is the migration files'
  statements minus those guards (stated in each migration's comment).
- **0085 timed out** on its real `drop function` and left nothing behind (checked
  the same way). Rather than make Will paste before merging, the app now asks
  with the language and, on PGRST202 ("no such function"), asks again without it
  (`apps/web/src/lib/rpcLanguage.ts`, 4 tests). The short 0085 file replaces the
  four-in-one file; proved again on a database shaped like the live one: refused
  without 0084, rolled back (no columns, no ledger row) when its own check failed,
  twice-safe.
- **Left:** Will's word to merge; one photo, document and link between two test
  accounts; 0085 whenever convenient.

## Part 4 — merged; the languages approved to learn from; the draft script run end to end

After the merge (PR #29, `8dee5d4`, Vercel READY) Will answered the open
question about the new languages: "Let's approve new languages for now. We'll take
a fail first then fix it approach. We'll adjust languages based on feedback."

- **The sign-off is recorded in so many words** (D-430): `reviewedBy` on the 53 text
  drafts and the five invite-email languages reads `APPROVED_TO_LEARN_FROM` ("Will
  (Oba), 9 October 2026 — approved to learn from; no native reader yet"). Tests
  rewritten for the approved state; a new one empties the approvals and asserts
  everyone is texted in English again, and one pulls a single language and leaves the
  rest.
- **Will asked whether signing could ever stop someone getting a text. It could, in
  one place.** An unsigned language already meant English, never nothing. But a
  *signed* text that failed a check at send time (a link longer than the wording
  was written for, a forbidden word) was refused and the person got nothing. The
  dispatcher now falls back to English, logs the template, language and reason (never
  the words), and throws only when English cannot be sent either.
- **The draft script (`copy:draft`) was run end to end** against a stand-in
  Anthropic API (`ANTHROPIC_BASE_URL`), which found a real bug: plural forms in
  Russian and Arabic were left stale because the script drafted the base key. It
  now drafts the actual stale keys with a `form` hint. `test/copy-sync-cli.test.ts`
  covers the dry run (sends nothing), the six requests, the plural forms and the
  refusal without a key; a mutation check confirmed the test catches the bug. It
  has still not talked to the real API (no key here).
- **Not redeployed.** The live `dispatch-sms` (v15) is the old one: "PAM:" prefix,
  English and Spanish only. Redeploying switches the prefix to "Pam:" and starts
  texting in the new languages, so it goes together with re-filing the carrier
  campaign — Will's call.
- **Left:** the redeploy and the carrier filing; two segments for the three
  appointment reminders in Chinese, Russian and Arabic; an email provider and a
  domain; native readers for the privacy, terms and transparency screens; the full
  text-fit audit baseline (`apps/web/scripts/fit-known.json`).
- **A note for the next session:** the Python I used to edit these records asserted
  on text that wrapped differently than I had assumed and stopped half way. Edits
  before the assertion were applied, the ones after were not; check `git diff` after
  a scripted edit, not the script's last line.

## Part 5 — two segments for the three reminders (D-431)

Will asked why SMS has a length limit and whether people should simply get the text in
the language they chose. The limit is the encoding (70 characters a segment in
Chinese, Russian and Arabic) plus the carrier registration that says one segment;
the three appointment reminders could not be said in 70, so those readers were
being texted them in English. Will: "allow two segments for those three reminders
only and update the registration."

- **Code:** `ucs2Segments: 2` on `appointment_24h`, `appointment_2h`,
  `appointment_morning_of`; a wide script may run to 134 (two parts of 67),
  everything else is unchanged. Mirrored in the dispatcher's `render.ts`; the
  generated bundle carries it. Twelve new drafts (3 reminders × zh-CN, zh-HK, ru, ar)
  carrying Will's approval to learn from.
- **Tests:** the limit per template; the cheap encoding never gets two; each reminder
  rendered at its variable budgets with the 36-character link has ≥ 8 characters to
  spare; the dispatcher accepts 134 and falls back to English at 135; the parity
  test fails if the dispatcher is stuck at 70 (checked by breaking it, then restoring).
- **Registration:** `docs/sms-campaign-samples.md` — the description rewritten to
  1,018 of 1,024 characters, seven languages, the two-segment exception, a sample of
  the reminder in each added language. **Will files it with the carrier**, before
  `dispatch-sms` is redeployed. I did not touch the Twilio account.
- **Found, not fixed:** nothing queues any appointment reminder yet (no function,
  trigger or screen references them), so the time format a reminder carries in each
  language is not decided; the tests assume up to ten characters.
- **Will asked for the carrier filing and its instructions on the before-launch
  list** ("no need for my approval on wording added"): a new item, *File the updated
  text-message registration with the carrier, then deploy `dispatch-sms`*, with eight
  steps from "copy what is registered today" to "read one text in each script on
  your phone". It points at `docs/sms-campaign-samples.md` rather than repeating it.
  Two things in it are unverified and say so: the Twilio menu path, and whether an
  approved campaign can be edited or has to be replaced.

## Part 6 — the text-fit baseline (D-434)

Will: "do the full text-fit audit (fills the fit check's accepted list)". The audit ran
over every story, all seven languages and the pseudo-language, at 320px (about 37
minutes, 3,752 measurements, none unmeasurable): 137 defects new in a language.

- **Looked at, in screenshots.** The 35 in real languages are not text cut off where it
  should show; they are scrolling or fading areas, lines that are one line with an
  ellipsis by design (a Shared-things title slides to show its end, D-407), a thread
  scrolling under its header. All 119 distinct ones are in
  `apps/web/scripts/fit-known.json` with a reason each, so the `PAM Language fit` job
  has its baseline. A first slice run with `--known` exits 0.
- **One real fault fixed:** `LargeTitleHeader`'s invisible compact title pushed the
  header buttons past the edge in the pseudo-language (nine screens scrolled
  sideways); it now shortens. Re-audited English and pseudo on a rebuilt Storybook:
  pseudo 102 → 94, sideways scroll 9 screens → 1, English unchanged at 159.
- **A fix I tried and did not ship:** letting tab labels wrap. It broke Russian,
  Portuguese and Spanish words mid-word, which the first screenshot showed at once.
  Tabs sized by content work but move the English tabs; Will's call (before-launch).
- **Numbers:** I pushed a claim for D-432 that the goldberg branch had already taken,
  because I read their allocations row after bumping mine; corrected within minutes to
  D-434 (goldberg D-429, D-432; bohr D-433). Read the other branches' rows *before*
  editing yours.
- **Not known:** whether GitHub's runner (its own fonts) reports defects this sandbox did
  not; the first run of the job will say. Each would be looked at and added.
