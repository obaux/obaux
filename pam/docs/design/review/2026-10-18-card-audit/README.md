# Card audit, 18 October 2026

Will's rule (D-615, Foundations › Patterns): **no card around a single list or form.** A card holds a thing of its
own (a person, an offer, a place, a warning). This is the list of every screen in the app where a `Card` wraps the
one list or form the screen is for, found by reading all 35 `<Card` uses in `apps/web/src` and drawing the screens in
Storybook (390 light, the built Storybook, on main 615e1078). It is a list, not fixes: nothing here was changed.
Owner lanes are from `docs/lanes.md`.

## Cards around a single list or form

| # | Screen (route) | File | Owner lane | What the card wraps | Picture |
|---|---|---|---|---|---|
| 1 | Text alerts (`/alerts/`) | `screens/AlertsView.tsx` | Messages & notifications (Nico) | the switches, the line over them | `alerts-text-alerts.png` — **already fixed** in D-615 (b74) |
| 2 | Something is wrong here (`/flag/`) | `app/flag/page.tsx` | Places & programs (Piper) | the reasons, the note, the button | `flag.png` — **already fixed** (b74) |
| 3 | Text reminders (`/reminders/`) | `app/reminders/page.tsx` | Messages & notifications (Nico) | "Kinds of texts" list and the two lines under it | `reminders.png` |
| 4 | Add a person, booking for a member (`/program/book/new/`) | `screens/AddPersonView.tsx` | Places & programs (Piper) | the two-field form | `program-book-new.png` |
| 5 | A program to check (`/programs/review/item/`) | `screens/ProgramReviewScreen.tsx` (lines 201, 230) | Places & programs (Piper) | "What was sent" list of fields; the note form when asking for changes | `programs-review-item.png` |
| 6 | Answer by text (`/reply/`) | `screens/SupportReplyScreen.tsx` (line 137) | not named in lanes.md; closest is Messages & notifications (texts) or Public website (support) | the one answer box. The quoted question above it is a thing of its own and can stay | `reply.png` |
| 7 | Connections, none yet (`/connections/`) | `screens/ConnectionsView.tsx` (line 71) | Accounts & invites (Ava) | an empty state | `connections-empty.png` |
| 8 | One policy (`/place/policies/view/`) | `screens/MemberPoliciesView.tsx` (line 455) | Places & programs (Piper) | the policy's paragraphs | `place-policy.png` |
| 9 | Calendar, link made (`/calendar/`) | `screens/CalendarLinkView.tsx` (lines 81, 117) | Places & programs (Piper) | the link, its Copy button and the how-to; a second card for one toggle row | `calendar-link-made.png` |
| 10 | A requested program (`/requests/program/`) | `screens/RequestProgramScreen.tsx` (line 65) | Accounts & invites (Ava) | one sentence and a button (top of the page) | `requests-program.png` |

## One form cut into several cards (borderline, for Will)

| Screen | File | Owner | Note | Picture |
|---|---|---|---|---|
| Add or edit a service (`/program/service/`) | `screens/ServiceEditView.tsx` (lines 163, 215, 274) | Places & programs (Piper) | one form in three cards: details, hours, policies. Rows with lines would read as one form | `program-service.png` |

## In the code, not pictured (the state needs data no story has)

- `screens/InviteNewView.tsx` (line 131) and `screens/RequestReviewScreen.tsx` (line 162), Accounts & invites (Ava): the city radio list is in a card, shown only when a person can pick among several cities.
- `screens/PoliciesView.tsx` (line 263), Places & programs (Piper): one policy's text in a card on the program's policy page.
- `screens/InviteReady.tsx` (line 102), Accounts & invites (Ava): the ready link in a card (it has an `isBare` form without one).

## Looked at and left alone (a thing of its own)

`/help/safety/` "In danger right now?" (a warning with its button); `/connections/` people (each person is a card);
`/program/` and `/place/` pages (stacked cards, each a different thing); `/points/` (a hero and a badge grid);
`PersonRow` (a row per person); `ReportsList` (a card per report); `DropInCard`; the sign-in card (drawn flat, no
visible card); `reminders.stopped` notices; the component gallery.

## Not checked

Screens in other roles' states that need data beyond what a story draws, and `apps/site` (the public website).
