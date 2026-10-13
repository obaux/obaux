# 2026-10-13 — languages-legal W6 words and the Spanish register of the Join screen

**Branches:** `claude/lena-w6-invited-words` (92943790, then 629171de), `claude/lena-w6-code-lines` (18035878), this one (`claude/lena-join-es-tu`, off b32) · **Lane:** Languages & legal (Lena)

## What changed

- **Ava's W6 (D-563), my part, in three sends.** (1) `signin.title.invited` ("Join Pam") and `signin.invited.member` / `.admin` / `.provider` in six languages (Will's English, 05:40). (2) Sage's three signed lines `join.staff.body`, `admin.caseload.empty.body`, `invite.expired.sent.body`, which Ava's branch still carried in the older wording, so the signed English went into `en.json` too. (3) Will's two hidden-code lines (card a82, 18:40, his own words kept over Sage's): `join.code.question` "Did someone invite you via code?" and `join.code.reveal` "Click here".
- **"Join" is a different verb from "sign in" in every language.** The point of Will's change is that a newcomer does not read "Sign in": es unirse, pt-BR juntar-se (the bundle's older "entrar" would have read as sign in), ru присоединиться, ar الانضمام, zh 加入. "Click" is not a phone word in this bundle, so each language says the tap (es toca, pt-BR toque, 点按/點按, нажмите, اضغط), as it does for "Tap" everywhere; Iris noted English says Click and the other six tap (P3): Will's word, stays.
- **The fit audit can run at 320×568** (`audit-language-fit.mjs --height`, default 760): a hero that is half the window is shorter on the shortest phone. Ran the invited, sign-up, expired-link and caseload stories at both heights.
- **A story for the expired-link page after the request** (`onboarding--expired-link-sent`, a play function that types an email and presses the button), because the audit only measures what a story draws.
- **Iris's P4: the Spanish Join screen mixed usted ("Escoja un idioma") with tú.** Smallest fix: `onboarding.language.title` is now the neutral "Elegir un idioma" (the key is used on the Join screen only, for member and staff alike, and in one e2e test, updated), and `join.booked.title` / `.body` ("Su visita está reservada", "sus Visitas") became tú ("Tu visita…", "tus Visitas"), the member Join's last step.

## What was wrong, and what missed it

- **Three of the lines had no story, so the audit had never seen them:** `invite.expired.sent.body` (fixed: the new story), `join.staff.body` (still none: reaching it needs a staff request completed with no account), and the staff-invited Sign in carousel earlier. The 568-high run also showed that the Sign in "button below the fold" in ru, pt-BR and ar is the hero, not the words.
- **The ledger records the English each translation answers.** For Will's two lines, Ava was reverting Sage's English in `en.json` at the same time; I acknowledged the ledger with Will's English put in `en.json` temporarily, restored the file and committed only the six locale files and the ledger. On that commit alone two tests are red until Ava's revert lands, because the ledger already holds Will's words: expected, said in the READY.
- **The Spanish staff Join screens mix too** (found while checking P4): titles such as `join.privacy.title.provider` ("Qué puedes esperar") and `join.invited.as` ("Te invitaron como:") are tú, while `join.privacy.provider.*` and `join.program.*` are usted. Not changed: it needs a register decision for the staff Join (the standing rule is usted for staff).

## Decisions made

None new to record. Mine to be reversed by Will or Sage: join verbs as above; the neutral infinitive for the language label.

## Verified

Config tests: 1310 passed, 1 skipped, `copy:status` in step (on this branch, with b32's English). Fit audit at 320×568 and 320×760 in seven languages: nothing new for any W6 line; the one 568-only finding, the Expired link page's collapsed header title in Russian, is the sticky title by design and unrelated. Spanish stories checked by text for the new lines and for no usted left on them. Not run: the Playwright e2e (the changed assertion in `e2e/account.spec.ts` is the new label as the bundle says it).

## Left undone

- The Spanish staff Join register (above), and `join.staff.body` without a story.
- The expired-link banner (`invite.expired.invited.*`) keeps its older wording on purpose (Ava).
- Native readers for every translation.

## Needs a human

Sage or Will: the register of the staff Join in Spanish.
