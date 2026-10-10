# 2026-10-10 — Languages & legal — review of Wren's About Pam sentences and the "Signing a program's rules" post

**Branch:** `claude/lena-site-drafts-review` (from `main` at `2aa5801`) · **Lane:** Languages & legal (Lena); the files are Wren's (`apps/site/src/content/about.ts`, `rules.ts`), edited at Mira's ask
("correct anything wrong")

From Mira (the merge desk), 15:00: review the six new About Pam sentences (summary and lead, after Will took "Pam is a human-touch company" out, D-483), and Wren's hidden post "Signing a
program's rules" in the six languages. Both stay drafts until a reader signs them (D-461, D-466); nothing here changes what is live.

## What changed

- **`about.ts`, ru lead:** "…и не забыть о них" ("…and not forget them") → "…и не забыть прийти" ("…and not forget to come"), as the summary says and as the English "remember to go" says.
  Mira had spotted it. The other eleven sentences (es, pt-BR, zh-CN, zh-HK, ar, and the ru summary) are right as written.
- **`rules.ts`** (the post, six languages), after reading every language against the English and against the app's own words:
  - Every quoted label ("Policies to sign", "Sign", "Type my name instead", "Policies for participants") was checked against that language's `locales/*.json`: all five labels in all six languages **match the app
    word for word** (a short script, not by eye). The "NOT" hits were the example rule text ("Bring ID").
  - **es** "Una política son las reglas de un programa" → "Una política es el conjunto de reglas de un programa" (a plural predicate does not make the verb plural).
  - **pt-BR** the same fix ("Uma política é o conjunto de regras…"); "os membros são convidados a assinar de novo" read as optional, the English says *asked*: "são solicitados"; the heading "O que um programa
    enxerga" → "…vê", the word the privacy page and the rest of the post use.
  - **zh-CN / zh-HK** "成员会被请求重新签署" / "成員會被請求重新簽署" ("requested") → "被要求" ("asked to"), the app's own verb (`policy.replace.hint`).
  - es, ru and ar kept: they say what the English says, with the app's labels and registers (es usted, ru вы, ar formal).
- Facts checked against the build: a program sees the first name and the date and never the picture (D-485 point 1, and `privacy.s.what-we-keep.p8`, D-490); signing never stops a booking (D-485 point 6);
  a policy is never edited, a new version asks people again (D-485 point 3); the signature is kept so the next one takes a tap (`member_signatures`); and "not a legal signature" is the sentence a lawyer reads
  before launch (D-485 point 5).

## What was wrong, and what missed it

- Nothing that was untrue in the rules post. The drafts follow the app's words well, because Wren took the quoted labels from the bundles; the slips were grammar and a verb that softened "asked to".
- **A question for Mira, not a fix** (the English is hers and Wren's): the new About Pam summary and lead say, as a fact, "Pam helps people … **remember to go**". Today Pam does not text a reminder
  (`VISIT_REMINDERS_LIVE = false`); the same page says so under "What is coming" and "Why Pam is here" ("Our aim is for Pam to message people at the right time"). The trip you plan is kept in one place,
  which helps you remember, but the sentence reads as a reminder. If a12 ("say only what Pam does") applies, the line could be an aim in the same voice as the page (D-466: "our aim is for Pam to…"), or "get to
  them, and keep track of the visit". I did not change the English.
- "Human-touch" in public: none. The only hits are code comments quoting Will, and the guard test in `apps/site/test/about.test.ts` (D-483).

## Decisions made

None: a review of drafts.

## Verified

`@pam/site` 26 tests, typecheck, and `PAM_SITE_DRAFTS=1 pnpm --filter @pam/site build` (the six draft pages build). No app copy changed, so the browser suite and the fit audit were not run: the edits are in files the app does not read.

## Left undone

- The English question above ("remember to go").
- zh-HK's About post uses "裡" (four places) where the app's zh-HK says "裏": both are in use in Hong Kong; left for the native reader to choose.
- Piper's review queue and the honest booking: not on `main` yet.
- A native reader for all six languages (before-launch).

## Needs a human

Will or Mira: the "remember to go" question.
