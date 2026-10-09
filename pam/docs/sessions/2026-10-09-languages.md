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
| Browser e2e (3 projects, `pnpm build` first, run twice: before and after the last tab and bidi changes) | **816 pass**, 0 fail (6 minutes at 4 workers) — includes the new language page-fit checks |
| First-load JS (`check-bundle-budget.mjs`) | 541.8 kB of 600 kB; 58.2 kB to spare |
| Storybook build | passes (455 stories outside Foundations) |
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

- Will: a native reader for each new language (above), and a yes/no per SMS/email
  template for the languages it is not yet written in.
- Will: whether the language picker should be limited for staff (it is not;
  default left open, because a case manager may be a Russian speaker too).
- Will: before translation is switched on — the provider's no-retention terms in
  writing, the wording that tells members first, a per-person cap.
- Whoever applies 0079–0081 next: `list_migrations` first. 0083 and 0084 are
  already live ahead of them, so the ledger now reads 0078, 0082, 0083, 0084
  and the three are still to come.
