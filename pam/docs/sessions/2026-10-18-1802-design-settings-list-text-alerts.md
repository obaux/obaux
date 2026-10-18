# 2026-10-18 — design settings list text alerts

**Branch:** `claude/pam-design-settings-list` (off `claude/pam-design-d608-badges`, which has `StatusBadge`; main 615e1078) · **Lane:** design system (Dot)

## What changed

- `SettingsList` and `SettingsRow` (`@pam/ui/SettingsList`): no card, rows under a thin line, the name, the `StatusBadge` under it, the switch at the end; logical directions only.
- `AlertsView` uses it (Nico handed the file over). Gone: the card, the STOP/HELP/rates line (`alerts.how`), the Privacy link (`alerts.privacy`, `alerts.privacy.label`). The label over the list is `alerts.kinds`; the badge is `common.comingSoon`. Built as if nobody can switch a text on without having agreed first (Lena and Nico confirming).
- Storybook: `Components/Lists/SettingsList` and Foundations › Patterns (the five rules).
- `alerts.spec`: five new or rewritten checks (the signed line; no card and thin lines; no STOP/rates line; no Privacy link; badge under the name).

- Routing (Lena's carrier answer, same commit): with no yes on file (none, Not now, withdrawn) a tap on a switch records nothing and opens `/reminders/?next=alerts&kind=<kind>`; "Agree" returns to `/alerts/?on=<kind>` with that switch on, "Not now" returns with it off; a STOP stays off. The agree screen is the only opt-in. Switches wait for the account's answer before they can be tapped. `alerts.kinds` is signed "Please choose when you'd like to get a text." (Sage f0279243), not in en.json yet.

- Mira's 18:05/18:11 follow-ups: `alerts.kinds` is in en.json ("Please choose when you'd like to get a text.") with my drafts in the other six, acked in the ledger (Lena needs a native reader); `useSearchParams` (with a Suspense fallback of the real header) replaces `window.location` in AlertsView and /reminders/ so the prototype can draw the return too; story `Case manager/Created/States/Text alerts: agree first` (case manager, program lead); the pictures are built, with no text edited in. The fourth row's badge follows `texts_live` (D-481), so it shows on all four while it is off; the `-texts-live` picture shows it on.

- Will, directly, after the pictures: "Move coming soon to the bottom of list." What is on comes first, badged rows below, each in their own order (a stable sort in `AlertsView`); Patterns' fifth rule; a spec (the live row is above every badge; fails on main, where the saved-place row is last). alerts.spec 48 pass.

- Mira's 18:22 fix: the (i) row on the case manager's screen drew its name line taller (the 48px button grew it: name-to-badge about 79px against 54 at 2x, and the switch not level). `SettingsRow` now boxes the adornment at the name's own line height; the button keeps its 48px target and overflows it evenly. Spec: name-to-badge gap and switch place equal with and without the (i); fails without the fix (12.5px off), passes with it. alerts.spec 51 pass. Admin pictures re-shot from the build.

## What was wrong, and what missed it

A card around a one-list screen, a badge beside a name that needs the room, and instructions repeated after consent: the first drawing followed the old card habit and nothing named it a pattern until Will did.

## Decisions made

D-615.

## Verified

On main's real build (615e1078, a worktree) the four new checks fail on their own assertion: `.astryx-card` count 1; "Reply STOP" count 1; the Privacy link count 1; the badge beside, not under (y 269 < 301). On this branch: alerts.spec 45 passed, 18 skipped (alerts not live), 0 failed; @pam/config 1447 passed. Before the en.json value landed 3 were red = "the line over the list is the one Will asked for", red until Sage's words are in `alerts.kinds` (en.json still says "Kinds of texts"; I did not touch it). @pam/ui 130/130, tsc clean, `build-storybook` passes. Pictures: `docs/design/review/2026-10-18-text-alerts-list/` (member, case manager, program lead at 390 light, 320 dark, 390 Arabic; member and case manager at 320 in ru, es, pt-BR). In them, only the English line is drawn as Will wrote it; the other languages show their current line until Sage signs.

Routing specs: no yes on file (Agree and Not now), a withdrawn yes, a yes on file, a STOP. On main's real build the first three fail (the switch turns on and records consent, no route); the last two pass there by design (the behaviour is kept). Staff routing cannot be run in e2e yet (staff kinds are not live), so it is not proven here.

## Left undone

A native reader for the six drafts of `alerts.kinds`; Nico's commit ('/alerts/' in signinNext's return list; the last switch off no longer withdraws) to merge when it arrives; Lena retires `alerts.how`, `alerts.privacy`, `alerts.privacy.label`, `alerts.comingSoon`. If consent can be skipped, the first switch-on routes to the consent screen (the merge desk tells me).

## Needs a human

Will looks at the pictures before it ships.
