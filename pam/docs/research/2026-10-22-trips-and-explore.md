# Weekly pass: a member's trips, places and Explore (22 October 2026)

Iris, the Thursday pass. This covers the flows in this part of the app that changed since last
Thursday:

- **Trips:** the trip card's name and time, and the covered map for keyboards and screen readers
  (`6841cec2`, `76b2b0c4`, `2cdc72e6`).
- **New trip › When?:** the end spacing and the tab scroll.
- **The program lead's Home:** the Coming in header, with no Help.
- **A place page** (`760e52e1`).
- **A member's Explore:** no bell when nothing is new, and the bar at full width (`c0b46a7c`).
- **Book a visit for someone new**, a staff screen.
- **Every RadioList:** wrapped labels (`429258d9`).
- **A conversation:** the line shown when speaking can't start (`a2f5f480`).

## The flow and the person

**A member** opens Explore, picks a place near them, plans a trip there, and finds it on Trips.
**A program lead** opens their Home.

## How

- **App:** the `build:e2e` app of main `6773c9c4` (b77) on 127.0.0.1. Every other host was refused.
- **Data:** made-up places and people, with any phone a 555 number. Never live, no accounts.
- **Speech:** I stood in a fake speech recogniser that fails as a real one does (`not-allowed`,
  `network`, `audio-capture`).
- **Sizes and looks:** 390×844 and 320×568, light and dark, in English, Spanish and Arabic.

## What happened

**Explore → a planned trip takes 6 taps:**

1. the place card;
2. Plan a trip;
3. a day;
4. a time;
5. Next;
6. Add this trip.

It ends on "Your trip is saved", with Change appointment, Bring a friend and Done. That's the same
in all three languages and at both sizes, with nothing scrolling sideways and nothing cut.

## Findings

### Stops someone

None.

### Slows someone

| # | Screen | What happened | What the person would expect | Sure? |
|---|---|---|---|---|
| T3 | Flag ("Something is wrong here"), the reasons | Rows are 32px apart, but each radio is a 24×48 target, so the targets overlap. A tap 11px below "Se mudó a otro lugar", nearer it than the next row, picked the next reason. Tapping the words themselves picks the right one (`shots/2026-10-22-trips-flag-reasons-es-320.png`). The same as C1 on Pam's hours. | A tap anywhere on a row picks that row. | Sure |

Raised from polish by Iris: a missed tap silently picks a different reason, so the report goes to the team with the wrong problem, and the person may not notice.

### Polish

| # | Screen | What happened | What the person would expect | Sure? |
|---|---|---|---|---|
| T1 | Trips, the card's time, Arabic at 320 | "الأحد، 25 أكتوبر ·" ends the first line, and "10:30 ص" sits alone on the second, so the "·" hangs at a line end (`shots/2026-10-22-trips-card-time-ar-320-dark.png`). English keeps date and time on one line at 320 (the `trip-card-time` spec checks English only). | The date and time kept together, or the time on its own line with no "·" left behind. | Sure |
| T2 | New trip › When?, the day and time chips | The pills are 40px tall with a 3px touch margin, so 46px to a finger, under the 48 the README asks for. Their text is 15px. This is by design (`new-trip-chips` spec) and passes; I'm noting it for the measure only. | — | Sure |
| T4 | The bell's spoken label, Spanish and Portuguese | With one unread, Spanish says "Avisos, 1 nuevos" and Portuguese "1 novas": `notify.unread` has no one-form in `es` or `pt-BR`. Russian has its forms. | "1 nuevo", "1 nova". | Sure |
| T5 | A conversation, the line shown when speaking can't start | The words are right, but "Allow the microphone for Pam in your **browser's settings**" asks a member to find a place in an app they may not know is a browser. The line itself shows in all three languages, above the box, and focus stays on the mic (`shots/2026-10-22-trips-speech-line-ar-320.png`). | Words that say where to tap ("your phone's settings"), or a link to a help post. | Medium: Sage's call |
| T6 | The finished trip | The flow says "Plan a trip", "Check your trip" and "Your trip is saved", then offers "Change **appointment**", a third name for the same thing. Spanish and Arabic say "visita" and "زيارة" all through. | One word. | Sure |
| T7 | Trips, the map, a long place name | The pin's label stacks a 64-letter name onto six lines over the map. | Two lines, then "…", as the card already does. | Sure |

## What worked (so nobody "fixes" it)

- **Explore:**
  - With nothing unread, or only read notifications, there's no bell and the search bar runs edge to
    edge (16–374 of 390; 16–304 of 320).
  - With one unread, the bell is there, 48×48 with its dot (`shots/2026-10-22-trips-explore-bell-en-390.png`).
  - English and Arabic match.
- **The place card:** the name link is small (173×22), but the whole 328×90 card is the link. A tap
  on its lower text opened the place, at 390 and at 320 in Arabic.
- **New trip › When? at 320:** the last time (3:30 PM) scrolls clear of Next (it ends 72px above it)
  in English and Arabic.
- **Trips:**
  - A long name wraps to two lines on the card.
  - The map's pins are reached by Tab before the list.
  - Two trips at one spot merge into one pin ("زيارتان") at 320.
  - Nothing is cut at either size.
- **The lead's Home:** no Help beside the bell. "Coming in" is the page's heading for screen
  readers. Day / Week / Month are full-size, in all three languages.
- **Book a visit for someone new:** it opens on "Add a person", with name and number then "Next: pick
  a day". The untrue line is gone, and nothing is under 44px.
- **Flag:** a two-line reason wraps with its dot beside the first line, in Spanish and Arabic.
- **The speaking line:** it shows for a refused microphone, no connection and no microphone, each
  with its own title and the line "You can type your message instead", in English, Spanish and
  Arabic. The rest of the screen keeps working.

## Not covered

- **A real phone's speech recogniser and microphone permission:** that needs Will's phone.
- **The program lead's Coming in list with real visits.** I used the examples.

Iris
