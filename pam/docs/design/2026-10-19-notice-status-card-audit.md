# The status cards on main 9aac8b6f, for D-619 (Notice becomes the toast)

Scope (Mira, 19 October): every use of `Notice` whose kind is not `empty` (`NOTICES` kinds `banner`: error, warning, info). Not in scope: `EmptyState` (kind `empty`: `service_not_available`, `no_caseload_members`, `admin_out_of_region`, `no_places_found`, `no_mentors_found`, 37 uses) and `CompactNotice` (the one-line alert by a field).

85 `<Notice` uses in `apps/web/src` outside stories and tests (89 with the stories' own); 44 are status cards. **Lasting** = a state the person is in: the toast has no close while it is true and goes when the state ends. **One-off** = something that happened: it can be closed. **Action** = a failed save or send: these are the rows the D-616/D-618 owners are already moving onto `useMalfunction().show`, so they stop being cards at all (see "What this leaves for the toast").

## Account states (lasting)

| Screen | Key | Notes |
|---|---|---|
| `app/NotIn.tsx:51` | `account_suspended` | the only thing on the screen |
| `app/account/page.tsx:121` | `account_suspended` | above the account page |
| `app/account/page.tsx:96` | `key` (suspended or limited) | the only thing on the screen |
| `app/TabGate.tsx:69` | `key` | the tab gate for a paused or limited account: the only thing on the screen |
| `app/messages/LimitedNotice.tsx:19` | `account_limited` | above Messages |
| `app/messages/thread/page.tsx:191` | `key` | a conversation that cannot open for the account's state |
| `app/person/page.tsx:218` | `key` | a person screen the account may not open |
| `app/interested/page.tsx:96` | `key` | same, Interested |
| `app/directory/page.tsx:148` | `key` | same, Directory |

## A page that cannot load (lasting: `something_went_wrong` or `offline`)

`app/places/ReportedPlaces.tsx:138`, `app/notifications/page.tsx:201`, `app/messages/thread/page.tsx:385`, `app/directory/page.tsx:245`, `app/messages/ReportedSection.tsx:49` (`failure`), `screens/WaitingCitiesScreen.tsx:81`, `screens/ProgramsToCheckScreen.tsx:99`, `screens/RequestsScreen.tsx:181`, `screens/InvitesLogScreen.tsx:110`, `screens/ReportedPlacesScreen.tsx:75`, `screens/InviteNewView.tsx:95` (session error), `screens/CalendarLinkView.tsx:69` (state error), `screens/BookForMemberView.tsx:194` (list could not be read). All but the last four are `state.offline ? 'offline' : 'something_went_wrong'`. Where the card is the only thing on the screen (ReportedPlacesScreen, InviteNewView) a calm page behind it is needed.

## Not here, not there (lasting)

| Screen | Key | Notes |
|---|---|---|
| `app/place/page.tsx:347` | `service_not_available` (missing) or `key` | "This place isn't here": the only thing on the screen. The missing case is an empty kind and stays EmptyState. |
| `app/flag/page.tsx:81` | `something_went_wrong` | the place to flag is missing: the only thing on the screen |
| `screens/ReportedPlacesScreen.tsx:88` | `something_went_wrong` | not an admin: the only thing on the screen |
| `app/join/JoinScreen.tsx:709` | `inviteProblem` (`invite_not_found`, `_already_used`, `_expired`, `_phone_mismatch`) | an invite that cannot be used; lasting until they leave |

## A failed action (one-off; these become `useMalfunction().show` as the owners convert them)

| Screen | Keys | Words |
|---|---|---|
| `app/join/JoinScreen.tsx:561`, `screens/ProgramView.tsx:240`, `screens/AddProgramView.tsx:165`, `screens/WhatYouSentView.tsx:112`, `screens/NewTripView.tsx:606`, `screens/ServiceEditView.tsx:155` | `something_went_wrong` | `join.failed.*` |
| `screens/ExploreScreen.tsx:265`, `screens/SavedView.tsx:141` | `something_went_wrong` | `saved.failed.*` |
| `app/flag/page.tsx:129` | `something_went_wrong` | `flag.failed.*` |
| `screens/InviteNewView.tsx:151`, `screens/InviteAddScreen.tsx:98`, `screens/UseAsView.tsx:73` | `something_went_wrong` | `admin.invite.failed.*` / `useAs.failed` / `invite.add.failed` |
| `screens/ProgramReviewScreen.tsx:253`, `screens/RequestReviewScreen.tsx:231` | `something_went_wrong` | `requests.failed.*` |
| `app/places/ReportedPlaces.tsx:147` | `something_went_wrong` | `places.reported.failed.*` |
| `app/signin/SignInScreen.tsx:330` | `something_went_wrong` | `signin.failed.<reason>`: the code could not be sent; a reason the person can fix |
| `screens/PamStartScreen.tsx:179` | `something_went_wrong` | `pam.start.failed` (first message) |
| `screens/PoliciesView.tsx:126`, `:248` | `something_went_wrong` | `policies.upload.problem.*`: a reason the person can fix (D-616: inline stays) |

## The gallery (not a screen a person reaches)

`app/gallery/page.tsx:385` (`offline`), `:391` (`something_went_wrong`): the component gallery's own examples.

## What this leaves for the toast

- **Lasting, 22 uses**: the 9 account states, 13 pages that cannot load, plus the 4 not-here rows and the invite problems (counted above). No close while true.
- **One-off actions, 18 uses**: most are D-616/D-618 conversions in flight; once converted they no longer render a `Notice`. Until then they become a closable toast.
- **A reason the person can fix, 3 uses** (`SignInScreen`, `PoliciesView` ×2): D-616 keeps these inline by the field, so they are better left a card or a `CompactNotice` than a toast; to decide.
