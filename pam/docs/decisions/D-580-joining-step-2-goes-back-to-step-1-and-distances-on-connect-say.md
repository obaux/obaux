# D-580 — Joining step 2 goes back to step 1, and distances on Connect say they are from City Hall

**Date:** 2026-10-15 · **Branch:** `claude/pam-case-manager-flow`

**Asked by:** the merge desk (15 October, 13:51), routing Iris's case manager pass
(`docs/research/2026-10-15-case-manager-flow.md`): W1, W2, W3 and P3 to P9 for Accounts & invites.

## Joining step 2 has a way back (W1)

- **Before:** "What you will see" (staff) and "What others can see" (members) had no back arrow. The comment said
  there was nothing to go back to once the account exists. A case manager who mistyped their name on About you
  couldn't fix it. Staff also had no Help on step 2 (A26 asks for Help on each step of joining).
- **Now:** step 2's back ("Back a step") returns to About you, for members and staff alike. When the account already
  exists, Next on About you **saves the corrected name and city on the account** (`updateMyDetails`: an update of
  `first_name`, `last_name` and `home_city` on the person's own row, which `profiles_update_self` and the column
  grant already allow). It never redeems the invite a second time (that would fail as used) and never starts a
  second membership. The role and the region are untouched. Staff step 2 gets the same Contact Pam row as the
  member's (the help desk; no phone line, D-512).
- **The fade at 320×568:** once scrolled to the end, the last line sits clear of the button's fade, because the
  footer is in the page's flow. Before the scroll, a long screen runs under it by design (D-326).
- **Would reasonably be reversed:** members get the back arrow too, beyond what W1 asked. It's the same never-dead-end
  rule, and the save path is the same.

## Distances on Connect (P3)

- **Today:** `usePlaces` measures from a fixed point, Philadelphia's City Hall (`CITY_HALL`). That's neither the case
  manager's area nor the member's.
- **Not the member's area:** a member's area is not in `ADMIN_CAN_SEE` (`packages/config/src/transparency.ts`), so
  measuring from it would widen what a case manager learns. That would need Will's signature and members being told
  first.
- **So:** a line above the cards says "Distances are from City Hall." (`person.connect.distanceFrom`, for Sage).
  It shows only when a distance is shown.

## The rest, for the record

- **W3:** a member's page, as staff see it, is titled with the member's first name (falling back to "Profile").
- **P4:** after recommending, "Back to {name}" (the existing `nav.back.person`) as well as "Return home". Both are
  secondary, so the screen has no primary action.
- **P5:** "What you can see" is at reading size (16px), with its heading in the section style the other staff Home
  sections use. Its list is unchanged; Lena is checking it against the joining step and `transparency.ts`.
- **P7:** someone joining by a staff invite (case manager or program lead) is asked "City you work in"
  (`join.details.city.work`, for Sage). Members keep "City you live in".
- **P8:** `SearchPill` leaves the typeahead's own label empty inside its labelled group, as `SearchField` already
  does. The members search is now named once.
- **P9:** the invite form lists every missing field at once, in screen order, in one alert. The words are the existing
  `invite.who.need.*`.
- **W2:** `admin.caseload.empty.body` as Sage signed it (A29, ledger 8710a563): "…To invite someone, tap Invite someone
  below." It stays true only while the Invite someone row is under the empty list; if the row moves, tell Sage.
- **W3, signed:** the title is the member's name alone, with no wrapper word (Sage). `person.profile` stays wherever it
  labels a tab or a link.
- **P7, signed:** "City you work in", and its missing line "Tell us the city you work in." (`join.details.need.city.work`).
- **10. No "Programs saved by {name}" anywhere** (the merge desk, 13:57, from Lena's check against `transparency.ts`):
  a case manager learns that a member saved something new, never which place. Only the example member page had
  the link (D-243). It's gone, and so is the page it led to (`/person/saved/`, `SavedByView`), its Storybook story
  and its prototype route, so Will's review surface keeps the contract too. The `person.savedPlaces.*` keys stay for
  now; removing them touches all seven languages.
- **11. P5's list:** Lena's `claude/lena-cm-lists` (Sage's ledger 4269f020) is merged. Home now shows "What you can
  see" as the joining step's own four items (`join.privacy.admin.1–4`), a list at reading size, then "They were told
  exactly this." (`admin.seeing.told`: the last sentence of Sage's signed `admin.seeing.body`, word for word). It
  uses the same keys as joining rather than a second split of the same words, so the two can never drift. Nothing
  splits a sentence in code, which wouldn't work across seven scripts. `admin.seeing.body` is now unused.

## Program leads too (the merge desk, 14:18, from Iris's program lead pass)

- Their joining step 2, "What to expect", has the same back and Contact Pam. It's the same code path as the case
  manager's, now tested on its own.
- A member's page as a program lead sees it (`ProgramMemberCardView`) is titled with the member's first name. Before,
  the large title said "Profile" and the name sat under it as a second level-1 heading; now there's one h1.
- The title is marked as data (`isTitleData`), so a name keeps its own direction (D-534), on both member pages.

## Proof

`e2e/case-manager-pass.spec.ts` (W3, P3, P4, P5, P8, P9) and two new tests in `e2e/join.spec.ts` (W1 for a member and
for a case manager: back, the fix saved on the account, the invite redeemed once; P7). Before-and-after pictures:
`docs/design/review/2026-10-15-case-manager-pass/`.
