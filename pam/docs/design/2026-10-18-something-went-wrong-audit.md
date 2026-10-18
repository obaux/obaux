# Where "Something went wrong" is drawn (D-616 audit)

Will, 18 October, 21:14: use the smaller alert banner as the pattern for malfunctions. Mira's scope: a **failed action**
(a save, a switch or a send that did not go through) gets the small alert at the bottom; a **page that cannot load**
keeps its Notice card, since there is nothing else on the screen. This is the list, by file, read from main e1a2cbec.
Owners are by `docs/lanes.md`. Owners convert their own files in the next batch; nothing here was changed.

`grep` finds 78 lines with `something_went_wrong` in 40 files under `apps/web/src` (stories and tests apart). About a
third of them are the second half of a pair (the `notice=` prop and the `NOTICES[...]` title lookup for the same
card), so the screens below are the real count: **23 rows of failed actions and 18 rows of pages that cannot load** (a row
is a screen; two rows name two files), plus the join result codes and the component gallery. `ReportedSection` and
`BookForMemberView` were classified from their conditions without opening the screen: the owners should confirm.

## Failed action (the small alert, at the bottom)

| Screen (route) | File | Owner | What failed |
|---|---|---|---|
| Text alerts (`/alerts/`) | `screens/AlertsView.tsx` | Dot (D-615 file) | a switch's save (first, D-616) |
| Text reminders (`/reminders/`) | `app/reminders/page.tsx` (line 194) | Nico | the Agree / Not now save |
| Message options: block, report (`/messages/thread/...`) | `screens/ThreadOptionsViews.tsx` (lines 113, 234) | Nico | a block or a report |
| Report a message | `app/messages/ReportedSection.tsx` | Nico | resolving a report |
| Something is wrong here (`/flag/`) | `app/flag/page.tsx` (line 130) | Piper | sending the report |
| Save or remove a place (Explore) | `screens/ExploreScreen.tsx` (line 266, `saveFailed`) | Piper | saving a place |
| Saved (`/saved/`) | `screens/SavedView.tsx` (line 142) | Piper | a save or unsave |
| Add a program | `screens/AddProgramView.tsx` | Piper | sending the program |
| Program (`/program/`) | `screens/ProgramView.tsx` (line 241) | Piper | saving a change |
| A service | `screens/ServiceEditView.tsx` (line 156) | Piper | saving a service |
| What you sent | `screens/WhatYouSentView.tsx` | Piper | withdrawing a request |
| Policies (program) | `screens/PoliciesView.tsx` (lines 127, 249) | Piper | uploading or removing a policy |
| Book a trip | `screens/NewTripView.tsx` (line 607) | Piper | booking a visit |
| Book for a member | `screens/BookForMemberView.tsx` (line 194) | Piper | the list could not be read (borderline: a list, not an action) |
| Calendar link (`/calendar/`) | `screens/CalendarLinkView.tsx` (line 70, the `failed` half) | Piper | making a link, the details switch |
| Reported places (review) | `app/places/ReportedPlaces.tsx` (line 148) | Piper | a review decision |
| Review a program | `screens/ProgramReviewScreen.tsx` (line 254) | Piper | approve, ask for changes |
| Sign in | `app/signin/SignInScreen.tsx` (line 331) | Ava | sending or checking a code |
| Join | `app/join/JoinScreen.tsx` (line 560) | Ava | finishing joining |
| Invite someone | `screens/InviteNewView.tsx` (line 152), `screens/InviteAddScreen.tsx` (line 99) | Ava | making or adding a link |
| A request | `screens/RequestReviewScreen.tsx` (line 231) | Ava | approve or deny |
| Use as | `screens/UseAsView.tsx` (line 74) | Ava | switching role |

## Page that cannot load (keeps the Notice card)

| Screen (route) | File | Owner |
|---|---|---|
| a member's page (`/person/`) | `app/person/page.tsx` (line 214) | Ava |
| Account | `app/account/page.tsx` (line 91) | Ava |
| Everyone (`/directory/`) | `app/directory/page.tsx` (lines 126, 237) | Ava |
| Requests | `screens/RequestsScreen.tsx` (line 156) | Ava |
| Cities people are waiting for | `screens/WaitingCitiesScreen.tsx` | Ava |
| Invited people | `screens/InvitesLogScreen.tsx` | Ava |
| Invite someone (session) | `screens/InviteNewView.tsx` (line 96) | Ava |
| The tab shell (session) | `app/TabGate.tsx` (line 65) | Ava |
| Message thread (`/messages/thread/`) | `app/messages/thread/page.tsx` (lines 184, 372) | Nico |
| Notifications | `app/notifications/page.tsx` (line 194) | Nico |
| Calendar link (state) | `screens/CalendarLinkView.tsx` (line 70, the `state.status === 'error'` half) | Piper |
| A place (`/place/`) | `app/place/page.tsx` (line 341) | Piper |
| Interested members | `app/interested/page.tsx` (line 83) | Piper |
| Explore | `screens/ExploreView.tsx` (line 206) | Piper |
| Home, staff | `screens/PeopleHomeView.tsx` (line 171) | Piper |
| Saved | `screens/SavedView.tsx` (line 156) | Piper |
| Reported places | `app/places/ReportedPlaces.tsx` (line 139), `screens/ReportedPlacesScreen.tsx` (line 72) | Piper |
| Programs to check | `screens/ProgramsToCheckScreen.tsx` | Piper |

## Neither (not a drawn alert)

- `lib/useJoin.ts` (3 lines): result codes for joining, not UI.
- `app/gallery/page.tsx`: the component gallery's sample (Dot).

## Switches and other controls that save to the server

A switch moves only once the save has succeeded (D-616). Every `Switch` in the app, with its owner. Nothing here is
edited by Dot except Text alerts.
- Text alerts, one per kind: `screens/AlertsView.tsx` (Dot; first).
- Everyone's demo-view switch: `app/directory/page.tsx` (line 264, `toggleDemo`): **Ava**. It is disabled while the write is in flight but its value comes from the person's row, so it moves on the refetch, not on the tap: check that it stays put on a failure.
- Calendar link, "Show details": `screens/CalendarLinkView.tsx` (line 125, `setShowDetails`): **Piper**.
Not switches but they save on a tap (looked at, not fixed): the star on a person (`StarToggle`, `PeopleHomeView.tsx`, Piper), a saved place's heart (`useSavedPlaces`, Piper), the language choice (Lena), the role switcher (Ava). Checkboxes in `ServiceEditView.tsx` are form fields saved with the form, not instant.
