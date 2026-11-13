# 2026-11-13 — languages & legal: the rest of the bar titles in Spanish and Portuguese

**Branch:** `claude/lena-bar-titles-rest` (off `claude/lena-bar-titles-es-pt` @ `4b4dd3a4`, which is on `mira/b78` @ `ba496c8f` and in b79) · **Lane:** Languages & legal (Lena) · from Mira (Friday 13 November, 15:45 UTC, weekly batch; her notes `docs/weekly/2026-11-13.md` on `mira/weekly-1023`)

## What the batch was
The ten findings the 6 November full `audit:fit` left over after the first four: pt-BR "Adicionar um programa" (195px), "Alertas por mensagem" (186px) and "Adicionar uma pessoa" (181px) over the bar's 176px; on the report-message page's 232px bar es "Reportar actividad sospechosa" (255px) and pt-BR "Denunciar atividade suspeita" (239px). And one decision: whether `invite.link.title.provider` and `.admin` should take the shape of the member title (in es and pt-BR) so the three invite titles match.

Method as on 6 November: each candidate put into the rendered bar element in a Storybook of this tree and measured with a `Range` (Figtree 700 18px), not counted in letters.

## What changed
| key | language | before | after |
|---|---|---|---|
| `programs.new.title` and `programs.add` | pt-BR | "Adicionar um programa" 195px | **"Adicionar programa"** 165px |
| `book.new.title` and `book.add` | pt-BR | "Adicionar uma pessoa" 181px | **"Adicionar pessoa"** 142px |
| `messages.options.report` and the quote of it in `help.safety.message.body` | es | "Reportar actividad sospechosa" 255px (bar 232px) | **"Reportar algo sospechoso"** 214px |
| the same two | pt-BR | "Denunciar atividade suspeita" 239px | **"Denunciar algo suspeito"** 198px |
| `invite.link.title.provider` | es / pt-BR | "Un enlace para un programa" 232px / "Um link para um programa" 218px | **"Enlace para programa"** 181px / **"Link para programa"** 160px |
| `invite.link.title.admin` | es / pt-BR | "Un enlace para un gestor de casos" 281px / "Um link para um gestor de casos" 267px | **"Enlace para gestor de casos"** 229px / **"Link para gestor de casos"** 209px |

- **A title and the row that opens it stay the same words.** "Adicionar programa" and "Adicionar pessoa" are also the labels of the buttons and menu rows that open those pages (`programs.add`, `book.add`; English uses one string for both), so both keys move together. The help line "Na conversa, toque em ⋯ e depois em “Denunciar atividade suspeita”" quotes the report row, so its quote moves with the label (es and pt-BR); nothing else in the app or the website quotes any of these wordings.
- **Report row.** The shorter wording keeps the word that matters, *sospechoso / suspeito*, and the usual verb of each language (Reportar; Denunciar, which is the word for "report" in a Brazilian app); the object becomes "algo" ("something suspicious"), which is how a person says it. The ones that fit but said less were not used: es "Reportar actividad dudosa" (219px, "questionable", weaker), pt-BR "Relatar atividade suspeita" (214px, "Relatar" is "to recount", not "to report").
- **The invite trio now has one shape in es and pt-BR:** *Enlace para miembro / programa / gestor de casos* and *Link para membro / programa / gestor de casos*. Yes to Mira's question; it is what the member title had since 6 November, 
- **A story for the third one.** There were stories for the member and case-manager links and none for the program's. `InviteProgram` (super admin, "A link for a program", role `provider`) is added to `SuperAdmin.stories.tsx`, so the audit now measures it.

## Two left over the line, recorded in `fit-known.json` with their reasons
- **pt-BR "Alertas por mensagem" (186px, four stories).** It is the feature's name: the Profile row that opens the page (`profile.menu.reminders`), `reminders.settings`, the back label "Voltar para Alertas por mensagem" (`nav.back.alerts`), the promo "Receba alertas por mensagem" and the error-log names of its switches all use it. A shorter title ("Alertas de texto" 132px, "Alertas por texto" 140px) would not match what the person tapped, and the pt-BR words for a text everywhere else are "mensagem de texto". Renaming the feature is a wider change than a bar title, so it is accepted: 10px over, the end of "mensagem" is cut from the first 48px of scrolling, the large title is whole. Revisit if the name ever changes.
- **es "Enlace para programa" (181px, 5px over).** The only shorter wording, "Enlace de programa" (165px), reads as the program's own link, and the three titles would stop matching. The case-manager titles are over too, in English as well (208px), which the audit counts as the design's own.

## Checks
The whole `audit:fit` (`node scripts/audit-language-fit.mjs --known scripts/fit-known.json`: 718 stories × 7 languages at 320×760) on a Storybook built from this tree, `@pam/*` linked to it: 50 findings that are new in a language, nothing that could not be measured. The run itself said 49 accepted and 1 not: the one was ru «Ссылка для программы» (220px) on the new `InviteProgram` story. Russian titles are accepted as a standing case in `fit-known.json` (24 of them on 18 October; the siblings «Ссылка для участника» and «Пригласить человека» are among them), so it is recorded the same way, with the siblings' reason. I did not rerun the whole thing after adding that entry (it takes about forty minutes); I re-read the run's 50 findings against the file, which is the same key check the script's exit status uses, and **0 are unaccepted**, and ran the invite stories again in all seven languages (`--match invite`, exit 0).
- Gone from the 6 November list: pt-BR «Adicionar um programa» (three stories), «Adicionar uma pessoa», and the report-message title in es and pt-BR. Still there and now accepted with a reason: pt-BR «Alertas por mensagem» (four stories) and es «Enlace para programa» (one). New and accepted: that ru title.
- The count is 50 where 6 November's was 55: six fixed, two added by the new story, so one more finding from the earlier run did not appear this time. I did not identify which; most of what is left in the `cut` kind (animated sheets in street search, trips) depends on timing.
- Config suite 73 files, 1,594 tests; web unit tests 246; `copy:status` in step; `copy:ack` run.

## Lesson
After a container reset the old worktrees and their linked `node_modules` were gone. A fresh `pnpm install --frozen-lockfile` inside the new worktree took seconds from the package cache and makes every `@pam/*` link point at the worktree itself, which is simpler and safer than the hand-wired links of 31 October.
