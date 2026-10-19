# 2026-10-19 — languages & legal: the privacy guard counts choice controls

**Branch:** `claude/lena-guard-choice-controls-2` (off main 6773c9c4) · **Lane:** Languages & legal (Lena) · from Mira (00:44)

## What changed
- **Counted:** `RadioList`, `Switch`, `SelectableCard`, `Selector`, `Dropdown`, `DropdownMenuRadioGroup`, `TimeInput` (and `CheckboxList`, already). Not `SegmentedControl`. The list is `COUNTED_COMPONENTS` in `src/data-collected.ts`; the test builds its pattern from it, so the two cannot drift.
- **`INPUT_FILES`:** ten new files (`LanguageSwitcher`, `LanguageField`, `AlertsView`, `CalendarLinkView`, `ServiceCards`, `ThreadOptionsViews`, Directory `page`, `InviteNewView`, `RequestReviewScreen`, the shared `Dropdown`) and four counts raised (`flag/page` 1 to 2, `JoinScreen` 4 to 5, `PamHoursScreen` 1 to 3, `ServiceEditView` 7 to 9).
- **`DATA_COLLECTED`:** `language` (p1), `calendar-details` (p12), `visit-service` (p2, sharing.p2) covered; `text-alerts`, `message-report` and `staff-region` are three gaps "for Will" (a102, the reported-message clause, and a line for the city Pam's team picks for a staff member).
- **Two new checks.** (1) `INPUT_LIKE_IMPORTS`: every input-like name imported from `@astryxdesign/*` or `@pam/ui` is counted or has a reason it is not (26 names today), so a new kind of control fails the guard until someone says which. (2) `RAW_TEXT_INPUT_FILES`: Astryx's raw `TextInput` is imported only by `TextField`, `SearchPill` and `VoiceInput`.

## Checks
Guard test 12 of 12; config suite 70 files, 1,504 tests. Mutations, each failing the right test: a second `Switch`, a new `RadioList` in a new file, an unlisted `Slider` import, `TextInput` imported in a screen, an `INPUT_FILES` entry removed. A first attempt to revert a mutation with `git checkout -- packages` also discarded uncommitted work; lesson: commit before mutating.

## Open
- Mira's calls (19 October 02:07): the Directory demo switch is confirmed not personal (the reason is now that it says nothing about the person: it only makes one account's own screens show example data, 0057, `profiles.is_demo`); the two city pickers were NOT confirmed and are now `staff-region`, a third gap, because the city a staff member serves is kept on their account (`profiles.region_id`) and shown in the Everyone list.
- The three gaps close when Will signs a102, the reported-message clause, and a line for `staff-region` (Sage to word it).
