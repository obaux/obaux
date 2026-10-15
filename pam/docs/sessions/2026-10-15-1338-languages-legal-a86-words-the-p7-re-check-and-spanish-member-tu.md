# 2026-10-15 — languages legal a86 words, the p7 re-check and Spanish member tu

**Branch:** `claude/lena-es-member-tu` · **Lane:** Languages & legal (Lena) · written 15 October, about 14:00 UTC. It also carries the 13 October 22:45 log (`claude/lena-records-13-oct-pm`, merged in: that branch never reached main).

## What changed

- **a86, one search on Explore (D-573), the words.** Seven `explore.search.*` strings in six languages (`claude/lena-explore-search-words` @ `84ffe2ab`, Piper merged it), then, when Will reshaped the search to a field that filters the list in place, the one new key `explore.search.nearest` (`claude/lena-explore-nearest` @ `fdfde536`). Mira then dropped "Nearest to {zip}" for the "Near 19102" control and a "Results for" heading, both already translated (`places.near`, `explore.results`), so the keys of both branches are gone from Piper's tip `5084c0dc` and nothing of theirs is left to merge except the pin below.
- **The p7 re-check, and a pin.** Read against Piper's `useAddressOrigin.ts` and the `places-search` handler: *when* Google is asked still fits the signed p7 (it never required a tap); *who picks* did not (the bar asks for Google's first place, no one picks), so Sage wrote the new wording (ledger `4ac2770b`, signed from her side, with Will). I translate it, run `copy:ack` and `legal:date privacy <ship day>` after Will signs, in the same batch as the inline search (Mira, 06:57). `street-search-line.test.ts` now reads `lib/useAddressOrigin.ts` without its comments and fails on a storage API, on `saveOrigin`/`loadOrigin`/`pam.origin`, and on a non-type import from `useAreaSearch`; tried failing both ways, and it is in Piper's branch.
- **Iris P4, Spanish member lines to tú (D-577).** 194 Spanish lines, `es.json` and the ledger only (English and the other six languages do not move). Her list named nine groups; reading every member-side string found the rest, most of them with no "su" or "usted" in them. The rule, written down for the first time: tú for anything a member reads and for every key on a screen both roles use (so no screen mixes the two); usted for screens only staff see and for Privacy, Terms and `legal.*`. The root cause was `LOCALE_BRIEFS.es` saying "Formal usted" to the drafting model; it now says the rule, and `docs/copy-changes.md` has a section. One Privacy line quotes a screen by its name (`what-we-keep.p13`, "abrieron “Tus puntos” y su Perfil", which `privacy-counter-line.test.ts` pins to `points.title`): only that name moved. `connections.empty.body` said "administrador de casos"; now "gestor de casos" like the 18 others.

## What was wrong, and what missed it

- **My `usted` finder found half of it.** The first scan looked for "su", "usted" and a list of imperatives and found about 100 lines. The other half were third-person verbs with no marker ("Aprendió un oficio que vale", "Los marcó mientras editaba", "las visitas que planea"). **What now catches it:** the second pass lists every non-staff line whose English says "you" and whose Spanish has no tú marker, and a person reads those; the rule and the verb warning are in `docs/copy-changes.md`.
- **My Storybook builds carried the live URL.** After 06:39 the containers could reach the live project and a build without the stub env falls back to it. I re-ran all 59 stories I audit with every Supabase and Google request refused and counted: 0 tried to leave, so I was not among the roughly 3,500 refused calls Mira found. From now on: `NEXT_PUBLIC_SUPABASE_URL=https://stub.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=stub-anon-key-for-ci pnpm build-storybook`.
- **Piper's One search stories could not see "Nothing matched that."**, and the Address story waited for English text, so in six languages its play function threw after 6 seconds. Found by the drawn-keys check (every key a story draws, by language). Piper fixed both.

## Decisions made

- **D-577**, Spanish tú for everything a member reads, and for screens both roles use (see the file). Decided by me on Mira's 15 October 13:24 job; told to Mira before it was built; the Privacy page staying usted while Transparency is tú is hers and Will's to settle.

## Verified

| Check | Result |
|---|---|
| `copy:status` / `copy:ack` after each branch | in step |
| `@pam/config` tests | 1311 passed, 1 skipped (P4 branch, after merging main) |
| Fit audit, One search stories x 7 languages, 320x760 and 320x568 | 0 new findings (3 and 1 `clamp` already in English) |
| Fit audit, whole Storybook, English and Spanish, 320x760 and 320x568 (P4) | see the READY to Mira |
| 59 stories of mine with every Supabase and Google request refused | 0 requests tried to leave |
| `street-search-line.test.ts` pin on `useAddressOrigin.ts` | fails on a storage call and on a `saveOrigin` import |

## Left undone

- **p7 (a86):** the six translations of Sage's signed wording, `copy:ack` (the meaning changed), `legal:date privacy <the day the inline search ships>`, and the two descriptive notes in `third-party-hosts.test.ts`; after Will signs. If a84 lands on another day, `legal-updated.json` is edited twice (a one-line conflict, the last day wins); Mira tells me before she merges.
- **a84** (`what-we-keep.p14`, `p15`, `p7` short or full, `sharing.p8`): still Will's signature.
- **From Iris's second pass, waiting for Sage to sign:** P1 ("Pick a day and a time."), P2 (a trip card name with no "with"), W2's Ways-to-earn labels for I'm here and I went, and P5 (badge names left in English: a decision, not mine). I translate them for Piper's branch.
- **Native readers** for every translation; for this job, first the Spanish member side (D-577) and the shared screens (Messages, reminders, alerts).
- Staff screens that mix: `home.caseload.*` and `join.program.services.hint` are tú among usted lines. Not touched, outside P4.

## Needs a human

- Will: the p7 wording and a84; whether Privacy and Terms should follow Transparency into tú in Spanish (not decided here).
- A Spanish native reader, once, for D-577's 194 lines.
