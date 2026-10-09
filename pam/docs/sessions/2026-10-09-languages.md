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

- Will, decided 9 October: **the merge to `main` is held** until 0079–0081
  (photos, documents, link previews) are live and members are told, because this
  branch carries that UI (STATUS row 36, `docs/before-launch.md`). Everything
  else is done: pushed, checked on the merged tree, 0083 and 0084 live.
- Will: a native reader for each new language (above), and a yes/no per SMS/email
  template for the languages it is not yet written in.
- Will: whether the language picker should be limited for staff (it is not;
  default left open, because a case manager may be a Russian speaker too).
- Will: before translation is switched on — the provider's no-retention terms in
  writing, the wording that tells members first, a per-person cap.
- Whoever applies 0079–0081 next: `list_migrations` first. 0083 and 0084 are
  already live ahead of them, so the ledger now reads 0078, 0082, 0083, 0084
  and the three are still to come.


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
- **0085 is not applied** (by hand with 0079–0081, before the merge).
- **The `PAM Language fit` workflow has not run on GitHub** (only its commands
  locally), and `scripts/fit-known.json` it reads **does not exist yet**: the audit
  that would write it (`--write-known`) is slow (~110 minutes for all eight
  columns, ~60 for the four it runs), so the first pull request that touches copy
  or UI will fail it once, listing the defects to look at and accept. The
  seven-language audit of 9 October (D-422) found 21 new defects after the fixes,
  each looked at, listed in D-422.
