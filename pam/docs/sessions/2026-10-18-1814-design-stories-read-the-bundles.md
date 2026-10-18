# 2026-10-18 — design stories read the bundles

**Branch:** `claude/pam-design-stories-bundles` (off main 615e1078) · **Lane:** design system (Dot)

## What changed

Piper found component stories that hard-code English copied from before D-608, so they showed old sentences. Seven stories now read the app's own words from the bundle, the way `PeopleStrip` does (args are keys; a `Localised` wrapper calls `useStoryText`), so they follow the Language toolbar and cannot drift again: SetupCard (its program body was stale, and the review body), InfoTip (stale hint), BringFriend (stale body; its Spanish story is kept as a marked stand-in drawing), DashedRule (now the calendar preview's real line), SuccessScreen (Connect's done state, the real title, body and example note), TripCard (the policy chip), InviteForWho (its play steps read the English bundle). `ProgramPolicies` names its story from `policies.title`.

The role stories on Piper's list (ProgramSent, StaffJoinPrivacy, TextsStopped, ProgramOnFile, PrototypeJoin) draw the real screens, so they already show the bundle; the English in them is story names and comments, which I left.

## What was wrong, and what missed it

Component stories take strings as props, so a copied sentence kept compiling and rendering while the app's line changed under it. Nothing compared the two.

## Decisions made

None.

## Verified

tsc clean; `build-storybook` passes; I served the build and read seven stories' text: SetupCard (program, in review), DashedRule, SuccessScreen, TripCard, InfoTip, BringFriend show the current bundle lines (BringFriend's share button only draws where the browser can share). A scan of every story file for sentences equal to a value the bundle held and no longer does found one more (ProgramPolicies, fixed); the rest of the English in stories is equal to the current bundle (story names, navigation labels).

## Left undone

About 100 stories still have a literal that equals today's bundle value (Reading, PolicyStatusCard, SubPage, VisitCard, MenuList and the role stories' names). They are right today and could drift; the same wrapper fixes them one at a time. `ProfileCards`' Promo story still carries its own sentence: it moves with D-612 (`badge`) when that is on main.

## Needs a human

Nothing.
