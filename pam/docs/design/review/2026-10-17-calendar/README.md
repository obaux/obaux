# Profile › Calendar: two options for card a98 (Will, 17 October)

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
