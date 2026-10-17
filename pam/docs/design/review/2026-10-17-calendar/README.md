# Profile › Calendar: the plan after Will's notes (card a98, 17 October, later)

**Plan C supersedes A and B below.** Will: "let's think broader … there's no point in asking whether to add the address in the calendar invite, it's obviously a yes … let's just support the full calendar details. For adding a calendar link for an individual event … it could easily just be an icon from the Place booked screen, inside the green card (Calendar icon), clicks and opens a sheet with options of which calendar, clicking migrates it over to their phone … Under it in fine print a link says "Sync all future trip details?" next to a sync icon. Clicking it takes them to the calendar screen (also available from their profile as a secondary route), which shows which calendar is linked, and any disconnection options are clearly listed there."

Pictures: `plan-C-{390,320}-{light,dark}.png` (left to right: the booked screen · the sheet the icon opens · Profile › Calendar with nothing linked · with Apple linked · with Google linked), `plan-C-390-light-arabic.png` (booked, sheet, none, Apple), `plan-C-booked-closeup.png`. Stories: Design / Calendar plan (a98).

- **No question about what goes in the event.** Every event carries the place's name and address and the time. The "show the place's name" switch and the "Pam visit" title are gone.
- **Per visit:** a calendar-with-a-plus button in the green card's corner (the card's own calendar mark stays at the left, so this one is a different icon); it opens a sheet of calendars (Apple, Google, Outlook); one tap hands the visit to that app. Under the card, fine print with a sync icon: **Sync all future trip details?**, which goes to the Calendar screen.
- **Calendar screen** (from that link, and still a row on Profile): nothing linked → "Which calendar do you use?" and four rows; linked → a card that says which calendar and since when, the link's buttons always there (Add to Apple Calendar or Google Calendar, Copy link), and **Manage**, two plain rows: **Get a new link** and **Disconnect {calendar}**, each with what it does (each still asks to confirm, as today). The privacy line is said once, at the foot.

## What this needs that is not drawn (for Mira)

1. **Privacy:** the event now always names the place and address, so the Privacy line changes ("Your calendar will show each visit's place and address"); the details switch (`calendar_link_set_details`, `show_details`) goes away.
2. **"Which calendar is linked":** Pam cannot know that a calendar fetched the feed, only which one the member chose. That choice would be a new thing Pam stores (a calendar kind per member) and needs its own Privacy line; the screen says "Linked", never "connected".
3. **The link shown again** (vault key, Piper), as decided, so the buttons can always be there.
4. **Per-visit add** needs an `.ics` for Apple and Outlook and an event link for Google, both carrying the full details; the sheet cannot tell whether a visit later moves ("If this visit changes, add it again" is gone from the sheet in C: the sync link under the card is the answer to that).
5. Not drawn: the steps page for Google on a phone (web only), and the same icon on a Trips card.

---

# Earlier: two options, A and B (superseded by C above)

Will: "Let's research how other apps present this pattern. Let's improve the intuitiveness and simplify. We need a better design. It's too confusing."
Drawings only (Storybook: Design / Calendar options (a98)). The words are drafts; the buttons do nothing; `CalendarLinkView.tsx`, `useCalendarLink.ts` and the Trips card are untouched.

## I recommend A

A visit goes into the calendar at the moment the member is looking at it, in one tap, on every phone (Google's app cannot add a calendar from a link), at once, and with no secret to keep; the feed stays for the members who want visits to move by themselves. B keeps the one hard thing (pasting a link into another app) as the only way in.

## What is drawn

`before-390.png`: the six states today (nothing made, link made, coming back later, Make a new link?, Turn off?, cannot be read).

- **A** (`option-A-{390,320}-{light,dark}.png`; top row today, bottom row A; Arabic: `option-A-390-light-arabic.png`): a visit with an **Add to my calendar** button under its card in Trips · the small sheet it opens (the event says only "Pam visit" and the time, or the place's name and address; Apple Calendar or phone; Google Calendar; "If this visit changes, add it again.") · **Profile › Calendar** off · on · and **Stop or change the link**, the sheet its row opens.
- **B** (`option-B-{390,320}-{light,dark}.png`): the same Calendar screen with no visit button and no "One visit at a time" card: off, on.

## The merge desk's decisions, drawn in every "after"

1. The link can be shown again, so its buttons are always there once it is on: Add to Apple Calendar (the one dark button), Copy link, Add to Google Calendar. (Needs Piper's vault change and a Privacy line Will signs; **hash-only cannot draw this.**)
2. No "connected" claim: only **On since {date}**.
3. Reset and turn off are one row, **Stop or change the link**, which opens the two choices (each still asks to confirm, as today).
4. Outlook and desktop-Google steps are one row, **Other calendar apps**; the keep-it-secret line is said once, beside Copy link; the privacy line ("Anyone who can see your calendar will see these visits.") is said once, beside the choice it is about (the place-name switch, which stays and is off by default; before anything is on, it sits under Turn it on).

## Not drawn (say if you want them)

The "Other calendar apps" page; the confirmations (unchanged); the "Your trip is booked" confirmation with the same button (the same button as on the Trips card).

## Note for Piper's build

The sheet's pick (name and place or not) and the feed's switch are the same choice asked in two places; in A the sheet's default is the discreet one and the feed's switch stays off by default.
