# 2026-11-06 — languages & legal: four bar titles in Spanish and Portuguese that were wider than the bar

**Branch:** `claude/lena-bar-titles-es-pt` (off `mira/b78` @ `ba496c8f`) · **Lane:** Languages & legal (Lena) · from Mira (Friday 6 November, 14:10 UTC, weekly batch; her notes `docs/weekly/2026-11-06.md` on `mira/weekly-1023`)

## What the batch was
My own fit audit of 31 October found four existing titles in es and pt-BR that are wider than the nested-page bar's one line at 320px (**176px**, 18px bold) and are not in `fit-known.json`. The bar repeats the page's title from the first 48px of scrolling; the big title under it wraps and is always whole, so what a person loses is the end of the small one ("Un enlace para un mie…").

## What changed (six lines, two languages)
| key | es before → after | pt-BR before → after |
|---|---|---|
| `review.title`, `nav.back.review` (Programs to check) | "Programas por revisar" 182px → **"Programas a revisar"** 163px | "Programas para revisar" 190px → **"Programas a revisar"** 163px |
| `invite.link.title.member` (A link for a member) | "Un enlace para un miembro" 225px → **"Enlace para miembro"** 174px | "Um link para um membro" 207px → **"Link para membro"** 149px |

Widths were measured in the real bar (Figtree 700 18px) in a Storybook built from `mira/b78`, by putting each candidate into the same element, not estimated from letter counts. "a revisar" is ordinary Spanish and Portuguese for "to review" and loses nothing; `nav.back.review` is the same words as the page title, so it moves with it. The member title loses its article, which is how a Spanish or Portuguese heading is usually written; the words that carry the meaning, *link* and *member*, stay. Candidates that were shorter but changed the meaning were not used: "Enlace de miembro" / "Link de membro" read as "the member's link", and "Invitar a un miembro" / "Convidar um membro" turn a description of what is on the page into an instruction (and "Convidar um membro" is 179px, over anyway). `copy:ack` run; `copy:status` in step; config suite 73 files, 1,594 tests; web unit tests 246.

## Looked at and left
- `invite.link.title.provider` and `.admin` ("Un enlace para un programa" 232px, "Un enlace para un gestor de casos" 281px; pt-BR 218px and 267px) are over the same line, and so is English's own "A link for a case manager" (208px, already listed as the design's own). No story draws them, so no audit ever measured them, and they were not in the batch. They keep their article for now, so the three titles differ in shape in es and pt-BR; if the desk wants the trio to match, it is the same kind of edit ("Enlace para programa" is still 181px, and "gestor de casos" cannot get under 176px without dropping *de casos*).
- Russian's "Программы на проверку" and "Ссылка для участника" are already accepted in `fit-known.json`.

## Checks
The whole `audit:fit` (`node scripts/audit-language-fit.mjs --known scripts/fit-known.json`: 717 stories × 7 languages at 320×760) on a Storybook built from this branch, with `@pam/*` linked to this tree's own packages: 55 findings that are new in a language, 45 accepted in `fit-known.json`, **10 not accepted**, so it still exits 1. None of the four titles is among the findings, in the old wording or the new one, and nothing could not be measured. The ten are not from this change (none involves a string I touched) and were not in the batch; they are the same kind of defect, bar titles over the line:
- pt-BR "Adicionar um programa" 195px (`member-created--add-my-program`, `case-manager-screens--add-program`, `program-lead-screens--add-program`), "Alertas por mensagem" 186px (`member-created--text-alerts`, `member-created-states-texts-stopped--alerts`, `case-manager-screens--text-alerts`, `program-lead-screens--text-alerts`), "Adicionar uma pessoa" 181px (`program-lead-screens--add-person`), all over 176px;
- the report-message page, over the narrower 232px (its bar carries a button): es "Reportar actividad sospechosa" 255px and pt-BR "Denunciar atividade suspeita" 239px (`member-created--report-message`).
They are ready to take the same way (measure candidates in the bar, shorten or record with a reason); I did not widen this batch without the desk saying so.

## Lesson
The bar's width check was the only thing that read these titles; none of the four was in a test. The measuring trick above (put the candidate into the rendered element and read its width with a `Range`) is quicker than a rebuild per wording and gives the same number the audit uses.
