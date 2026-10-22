# Weekly pass, 22 October: the staff homes

Iris. This is the Thursday pass over what changed this week on the staff homes, for a case manager,
a program lead and a super admin.

## The flow and the people

| Who | Starting where | Trying to do what |
|---|---|---|
| **A case manager** | Home | Find one of their members by name (the new plain search field, also in Spanish). |
| **A program lead with no program yet** | Home | See what to do first (the setup cards). |
| **A super admin** | Home | Open each new row: Cities people are waiting for, and Problems. Get to Problems from the bell. Check Programs to check from Home, and come back. Change Pam's hours by tapping a whole day row. Answer someone by text. |

The changes under test:

- `707248da` and `3dae3817`: the case manager's search words, in English and Spanish.
- `c0b46a7c`: staff Home's plain search field.
- `760e52e1`: the setup cards.
- `1ad9679c`: `/person/saved/` removed.
- `1dd888f0`: the waiting cities row and list.
- `43aaf430`: Problems and the bell's problem row.
- `926276bb`: Pam's hours day rows full width, and rows tap at their edge.
- `07694a6e`: Answer by text.

**How.**

- **App and data:** the `build:e2e` app of main `6773c9c4` on 127.0.0.1. Supabase was stubbed with
  made-up people and 555 numbers, and every other host was refused. I never signed in to live, made
  no account, and sent nothing.
- **The setup:** Playwright in Chromium with touch.
- **Sizes:** 390×844, and 320×568.
- **Themes and languages:** light and dark; English, Spanish and Arabic.

## What happened

| Task | Taps | Result |
|---|---|---|
| Case manager finds Marcus | 1 (the field) + typing "Mar" + 1 (his row) | "Results for “Mar”" shows his row. For "zz": "Nothing matches “zz”. Check the spelling, or clear the search to see everyone." with Clear search. The field is 194×48 (390) and holds "Search members" / "Buscar personas" / "ابحث في الأعضاء" without cutting (`shots/2026-10-22-staff-cm-search-en-390.png`). |
| Super admin: Home → Cities people are waiting for → back | 1 + 1 | "25 waiting", biggest first (Camden 14, Chester 9). A long place name wraps. Back says "Back to Home" and goes to `/`. |
| Super admin: Home → Programs to check → back | 1 + 1 | `from=home` works: Back says "Back to Home" and goes to `/` (en, ar). |
| Super admin: bell → the problem row → Problems | 1 + 1 | The row reads "Changing the saved-place text alert didn't go through 7 times in the last hour." and opens `/problems/?from=notifications`. Arabic uses the right plural ("7 مرات"). |
| Super admin: Problems | 0 | Each problem's name, key, route and code, last and first seen, and a count. Nothing is cut at 320 in en, es or ar. |
| Super admin: Pam's hours, untick Saturday by tapping the far end of its row | 1 | **C1 is fixed.** Each day is a full-width row about 49px tall. A tap at its far end, or at its bottom edge, ticks it (`shots/2026-10-22-staff-pam-hours-en-320.png`). A screen reader hears "Monday" (an `aria-label` of "Checkbox" is overridden by the label). |
| Super admin: Home rows | 1 each | **C3 is fixed.** Every row's link text is 24px tall, but a tap 10px below the text, at either edge of the screen, opens the row (`shots/2026-10-22-staff-sa-home-en-390.png`). |
| Super admin: Answer by text | — | The "To" number line, a 48px answer box (282 wide at 390, 212 at 320), and "0 of 120". Fits in en, es and ar. |
| `/person/saved/` | — | Gone (404). Nothing in the app links to it any more. |

## Findings, ranked

### Stops someone

None.

### Slows someone

| # | Screen | What happened | What the person would expect | How sure |
|---|---|---|
| S1 | Program lead's Home with no program yet, 320×568 | "You can also Invite someone to Pam" is a 24px-tall text row sitting directly on the tab bar's fade. A tap 12px below its text opens the **Program** tab instead (`shots/2026-10-22-staff-lead-home-en-320-dark.png`). | The last row clear of the tab bar, or a 48px row | Sure of the tap; the fade is how it looks in dark |

Raised from polish by Iris: a tap a little low opens the Program tab and leaves Home, so the lead has to find their way back.

### Polish

| # | Screen | What happened | What the person would expect | How sure |
|---|---|---|---|---|
| S2 | Super admin's Home | Problems uses the same shield icon as Reported places and the staff request row. Three different things look alike. | Its own icon | Sure |
| S3 | Super admin's Home | "Invited people" sits alone at the very bottom, just above the tab bar, far from the other rows. It reads like a footer. | With the other rows, or under a label | Medium; it may be on purpose |
| S4 | Text under 16px across these screens | The request row's "Wants to be a case manager · City · Asked" (14px); Programs to check's "New program · From Lou · Sent Oct 6" (14px); Pam's hours' "Days", "Opens", "Closes" (14px); Notifications' "Today" (13px); Answer by text's "Your answer" (14px). | 16px for anything a person must read | Sure of the sizes; the team is the reader here, not a member |
| S5 | Case manager's Home in Spanish | The heading says "Sus miembros" but the search says "Buscar personas", the shorter word Lena chose so it fits. Two words for the same people. | One word, if it fits | Low; it's Lena's call |

## What worked

- **Search.** The case manager's search is one plain field. It filters as you type, says plainly when
  nothing matches, offers Clear search, and fits in three languages at 320.
- **The super admin's Home rows.** They open from anywhere on the row now (C3). Pam's hours days
  tick from anywhere on the row (C1).
- **Back links.** `from=home` brings Back to Home from Programs to check and from the waiting cities
  list.
- **Problems and the bell.** They name the action in words, with the right plural in Arabic.
- **No overflow.** Nothing scrolls sideways on any screen here, at either size, in any of the three
  languages.

## Not covered

- **A program lead's Home with interested people,** so its search and Person card. This run's lead had
  no program yet, so it showed the setup cards only.
- **Program services** (`760e52e1`), which is in the program lead's flow.

Iris
