# 2026-10-11 — Languages & legal — About Pam, the case manager's line (Will, card a50)

**Branch:** `claude/lena-about-how-admin` (from `main` at `abf68ea`) · **Lane:** Languages & legal (Lena)

From Mira (the merge desk), 02:17 UTC: Will said "yes" (a50, 02:16) to taking "know where your people are going" off the app; he told Sage it sounds like surveillance. `about.how.admin` on About Pam becomes, in English,
**signed by Will:** "For a case manager: their plans, your guidance, in one place." Do the six languages and the ledger; keep the sense that the case manager *guides*, never that they watch.

## What changed

`about.how.admin` in all seven languages, `copy:ack`ed (status "in step", config 1067 green):

| | Before | After |
|---|---|---|
| en | For a case manager: know where your people are going, and connect them in a tap. | For a case manager: their plans, your guidance, in one place. |
| es | …sepa a dónde van sus personas y conéctelas con un toque. | Para un gestor de casos: los planes de sus personas y su orientación, en un solo lugar. |
| pt-BR | …saiba para onde as suas pessoas estão indo e conecte-as com um toque. | Para um gestor de casos: os planos das suas pessoas e a sua orientação, em um só lugar. |
| zh-CN | …了解您帮助的人要去哪里，点一下就能为他们牵线。 | 给个案管理员：您帮助的人的计划和您的指导，都在一个地方。 |
| zh-HK | …知道您協助的人要去哪裏，並一按就把他們連繫起來。 | 給個案經理：您協助的人的安排和您的指導，都在同一個地方。 |
| ru | …знайте, куда идут ваши люди, и связывайте их одним нажатием. | Для кейс-менеджера: планы ваших людей и ваше сопровождение — в одном месте. |
| ar | …اعرف إلى أين يتجه أشخاصك، واربطهم بالبرامج بضغطة واحدة. | لمدير الحالة: خطط أشخاصك وتوجيهك لهم، في مكان واحد. |

Choices, to keep "guides, never watches":
- The English "their" has no noun to hang on, so every translation names whose plans: "sus personas", "as suas pessoas", "您帮助的人", "您協助的人", "ваших людей", "أشخاصك": the bundle's own words for *your people* in the old line.
- "Guidance": es "orientación" (not "guía", which is the bundle's word for the *person*, "su guía", the case manager, so "su guía" would read as "your guide", the very person reading it); pt-BR "orientação"; zh "指导" / "指導"; ar "توجيه";
  ru "сопровождение" (the social-work word for case management; "руководство" would read as management, "рекомендации" would promise recommending a program, which is still only an example).
- "Plans": zh-CN "计划" (the bundle's word for a plan, `notice.offline.body`); zh-HK "安排" (not "計劃", which in this bundle means *program*; `notice.offline.body` uses "安排" for plans).
- No word of seeing, knowing where, or tracking is left in any language.

## What was wrong, and what missed it

The old line's "know where your people are going" is Will's own judgment, 11 October: it sounds like surveillance (D-505, `docs/voice.md`). It was in all seven languages and was a claim the app did not need to make:
what a case manager does see of a member's plans is the visits and whether they went, which the promise to members already says (`transparency.canSee.appointments`); the new line says no more than that. Still quoted elsewhere, not in my lane: the public site's Home card for case managers (`apps/site/src/screens/HomeScreen.tsx` line 64,
"Know where your people are going, and connect them in a tap."), and `docs/voice.md`'s table of what not to say. Reported to Mira for Wren.

## Decisions made

None: Will's decision is D-505 / card a50.

## Verified

On `2e68061` (main `abf68ea` plus this): `@pam/config` 1067 tests, `copy:status` in step, the browser suite on all three viewports **1170 passed, 18 skipped** (12.8 min), Storybook builds, and the fit audit
(7 languages and the pseudo-language) on the 10 stories with "about" in their id (the app's About Pam and the website's seven): 2 new, both already accepted, **0 not**; on the 28 onboarding stories: 2 new, accepted.
Those static stories show the member's line, so I also opened the app's About Pam (`onboarding--about`), tapped **Case managers** and measured the new line at 320px in all seven languages: it wraps inside the 288px
column in each (54px tall in en, zh-CN, zh-HK, ar; 81px in es and pt-BR; 108px, four lines, in ru), nothing wide or cut.

## Left undone

- `onboarding.admin.1` ("Know who showed up, without chasing calls.") and `onboarding.admin.2` / `onboarding.provider.3` stay on Friday's list with Sage.
- A native reader for the six (before-launch).

## Needs a human

Nothing.
