# How other apps put visits in a calendar, and what Pam's Calendar screen should do (17 October 2026)

Iris. The merge desk's job at 19:10, passing on Will at 19:08: "Let's research how other apps present
this pattern. Let's improve the intuitiveness and simplify. We need a better design. It's too
confusing." The screen is Profile › Calendar (D-538, `CalendarLinkView`).

Public pages only: help centres, docs and write-ups. I signed in to nothing, installed nothing and
sent nothing, and I didn't open Pam live. No pictures of other apps are in the repo; each one is
described below, with a link.

## What Pam's screen does today (from `main`)

- **Before a link exists:** the intro, the warning "Anyone who can see your calendar will see these
  visits." and one button, "Make my calendar link".
- **Right after making it:** the link, "Pam shows this link only once. Copy it now.", then:
  - Copy link;
  - Add to Apple Calendar (Apple devices only);
  - instructions for Google on a computer and for Outlook;
  - a paragraph on Google's phone app, and a button to Google on the web;
  - "may take up to a day";
  - the keep-it-secret paragraph.
- **Every visit after that:** the page says "Pam can't show your link again. Make a new link if you
  need it." This is the state Will saw. It has no button to add anything, and no sign that a
  calendar is connected.
- **Other controls:** the details switch, then "Make a new link" and "Turn off" as plain text links.
- **No per-visit add:** no screen offers "Add to calendar" for a single visit; nothing in
  `apps/web/src` makes an `.ics` file or a Google event link.
- **Why the link can't come back:** Pam keeps only a hash of the token (the 11 October security
  choice), so after the first view it can't show the link again.

## What other apps do

### Subscription feeds (a link that keeps a calendar up to date)

| App | Main action and words | Shows a calendar is connected? | Link shown again, or only reset? | Reset / turn off | Notes |
|---|---|---|---|---|---|
| **Google Calendar** (secret iCal address) | Settings › "Integrate calendar" › "Secret address in iCal format" | No | **Shown again** (hidden behind a click) | "Reset" next to it; the old link stops working | Workspace admins can hide it. [1][2] |
| **Outlook** (publish) | Settings › Calendar › Shared calendars › "Publish a calendar", with a permission level ("Can view when I'm busy" by default) | No | **Shown again** (HTML and ICS links) | "Unpublish" (the help page I read names no separate reset) | Subscribing on the other side is "Subscribe from web". [3][4] |
| **Airbnb** (export to other calendars) | Availability › "Connect calendars" › copy the export link | No (for export) | **Shown again** | Not stated in the help page | A `.ics` link with a secret parameter. [5] |
| **TripIt** | "Calendar Sync" / "Add TripIt to your calendar" in the app; on iOS one tap, Android two steps | No | **Shown again** | Not stated in the help page | The closest consumer model: one main button per platform. [6] |
| **Todoist** | "Calendar subscription" per project or all tasks; copy the link | No | **Shown again** | Not stated in the help page | Can't be set up from Todoist's own phone apps, only web or desktop. [7] |
| **TeamSnap** | Schedule › "Sync Calendar" / "Export"; a "Subscribe" button for Outlook, or copy the link | No | **Shown again** | — | Says plainly that the calendar may take up to 24 hours to update. [8] |
| **Asana** (My Tasks sync) | "Sync to calendar", copy the link | No | **Shown again** | **No reset**, per a forum moderator: remove and add again | An example of what to avoid. [9][10] |

**Not checked in the time:** Notion Calendar, Teamup, Meetup and Eventbrite.

**Google's phone app can't add a calendar from a link.** It has to be done on Google Calendar's web
page, and the calendar can take up to 24 hours to show changes [11]. On an iPhone, a link added via
Settings › Calendar › "Add Subscribed Calendar" (or a `webcal://` tap) works on the phone itself.

### Per-appointment "Add to calendar"

| App | Main action and words | What the event shows |
|---|---|---|
| **MyChart (Epic)** | An "Add to Calendar" link right under the appointment's time. It asks whether to include the visit's details or only the time, then downloads a calendar file. | The member chooses: details, or only the time. **The strongest precedent for Pam.** [12] |
| **Zocdoc** | No patient help page on calendars found; its guide tells patients to put visits in their own calendar themselves. | — [13] |
| **Doctolib / One Medical** | No public patient help page found. One public post from a Doctolib patient asks for calendar sync, which suggests it isn't there. | — [14] |
| **Google event link** (any site) | A link to `calendar.google.com/calendar/render?action=TEMPLATE` with `text`, `dates`, `details`, `location` and `ctz`. It opens Google Calendar with the event filled in; the person taps Save. | Whatever the link carries. The words go into the link itself, so a discreet title must be in it. [15][16] |

**Re-entry and benefits tools:** I had no time to search them, so this report doesn't cover them.

### What the products have in common

1. **Nobody shows "connected".** None of the seven feed products says whether a calendar has
   subscribed; they show the link and a reset. Will's "nothing shows whether it's connected" is
   true everywhere, but in those products the link is always there to copy again, so it matters
   less.
2. **The link stays visible.** All seven show the link again whenever you open the page; Google
   pairs it with a reset that kills the old one, and Asana is criticised for having none. Hash-only, shown once, is the pattern for
   API keys, not for calendar feeds. For a member who left the page before copying, it's a dead end.
3. **The one-tap paths are per-platform buttons**, not instructions: TripIt's "Add to your
   calendar", TeamSnap's "Subscribe" for Outlook, and Apple's `webcal://`. Instructions that need a
   desktop browser (Google) are the part every product struggles with.
4. **Per-visit adds are the norm in health care**, and MyChart asks what to include at the moment
   of adding. That is the same choice Pam's details switch makes, but at a moment the member
   understands.
5. **Feeds are slow, and the products say so** (TeamSnap and Google: up to 24 hours).
   A member who adds a visit and checks their calendar right away sees nothing from a feed, but
   sees it at once from a per-visit add.

## Recommendation for Pam

### 1. Offer both, with per-visit first

- **On each visit** (Trips card, and the confirmation after planning a visit): an **"Add to my
  calendar"** button. It does the MyChart choice in one small sheet:
  - "Only 'Pam visit' and the time" (the default),
  - or "With the place's name and address".

  Then it offers "Apple / phone calendar" (an `.ics` file) and "Google Calendar" (the event link).
  - It works on every phone today, including Google's app.
  - It shows in the calendar at once.
  - It needs no secret to keep.
- **The cost of per-visit:** it's a copy. If the visit moves or is cancelled, the calendar doesn't
  change. The sheet should say so in one line ("If this visit changes, add it again"). This is the
  job the feed does better, which is why the feed stays.
- **The feed becomes the "keep it up to date" option,** for members who want every visit to appear
  and move by itself.

### 2. Show the link again, rather than hash-only

**My recommendation:** store the token encrypted and show it whenever the member opens the page,
with a reset, as all seven feed products above do.

- **Why:** the confusing state Will saw ("Pam can't show your link again") exists only because of
  hash-only. With the link always there, the page can always offer "Copy" and "Add to Apple
  Calendar".
- **The trade-off for whoever owns the 11 October security choice:**
  - Someone who gets into the member's Pam account can read the link.
  - But that person can already see the same visits in Trips.
  - The link adds no new data; it adds a way to keep seeing it after losing account access. Reset
    and Turn off end that.
- **If hash-only stays:** the page after the first view must not be a dead end. It should say
  "Your calendar link is on" with one plain button, "Get a new link", that explains the old one
  stops and the new one must be added again. It should not be a text link at the bottom.

### 3. Connection: say what Pam can know, and no more

- **Pam can't know** whether a calendar is connected; nobody can, and the products above don't try.
- **What Pam could show:** "Last checked by a calendar app: today, 3:12 PM". This only works if the
  feed function records the time of the last fetch.
  - It is honest and useful: it is the only sign that a paste worked.
  - It stores a time, not who fetched.
  - It needs a privacy check before anyone builds it: it's a new thing kept about a member.
- **If that's not wanted:** "Link made on 12 October" at least tells the member the link exists.

### 4. What the first screen should say and offer

Title: **Calendar**.

- **Line 1:** "Put your Pam visits in your phone's calendar."
- **Card 1, "One visit at a time":**
  - "Tap **Add to my calendar** on any visit in Trips."
  - A button: **Go to my Trips**.
- **Card 2, "Keep every visit up to date":**
  - "Your calendar gets new visits and changes by itself. It can take up to a day."
  - One button per platform, shown by device:
    - **Add to Apple Calendar** on Apple devices;
    - **Add to Google Calendar** elsewhere, which opens a short step page for the web-only route;
    - **Copy link** for anything else.
  - When the link is on, a status line: "On · last checked {time}" or "On since {date}".
- **The privacy line** ("Anyone who can see your calendar will see these visits") stays. It
  belongs beside the details choice, where it applies, not at the top as the first thing read.

### 5. What moves out of sight

- **The secret-link paragraph and the full address:** behind "Show the link", or in the Copy
  confirmation.
- **Outlook and Google desktop steps:** on a "How to add it" page, opened from the Google button or
  from Help.
- **The details switch:** inside the feed card, labelled as the MyChart choice ("What your calendar
  shows: only 'Pam visit' and the time / the place's name and address").
- **"Make a new link" and "Turn off":** under a "Stop or change the link" row at the bottom of the
  feed card, each with its existing confirm dialog. Today they are two loose text links.

## How sure

- **High:** for what Google, Airbnb, TripIt, Todoist, TeamSnap, Outlook and MyChart show, as
  described by their own or university help pages.
- **Medium:** for the Google event link's parameters. They come from third-party pages, not Google's
  own reference, so they need one test in the stub app before anyone relies on them.
- **Low:** for Doctolib and One Medical, where no help page was found.
- **Not checked on a phone:** how Android opens an `.ics` download differs by phone and browser. A
  check on Will's phone is needed.

## Sources

1. Google Calendar Help, "Sync your calendar with other applications" / secret address: https://support.google.com/calendar/answer/37648?hl=en
2. University of Michigan, "Creating a New Google Calendar Secret Address": https://teamdynamix.umich.edu/TDClient/30/Portal/KB/Article/5618/Creating-a-New-Google-Calendar-Secret-Address
3. Ablebits, "How to make an Outlook calendar public" (publish, permission levels): https://www.ablebits.com/office-addins-blog/make-outlook-calendar-public/
4. UW–Madison KB, subscribing vs. importing in Outlook: https://kb.wisc.edu/education/154693
5. Airbnb Help, article 99 (connect calendars, export link): https://www.airbnb.com/help/article/99
6. TripIt Help, "Calendar feed setup and sync": https://help.tripit.com/en/support/solutions/articles/103000063280-calendar-feed-setup-and-sync
7. Todoist Help, calendar subscription: https://todoist.com/help/articles/208789889
8. TeamSnap Help, "Subscribe to a team schedule": https://helpme.teamsnap.com/article/128-subscribe-to-a-team-schedule
9. Asana Forum, "Reset Google Calendar task sync link": https://forum.asana.com/t/reset-google-calendar-task-sync-link/114336
10. Asana Help, "Calendars and Asana": https://help.asana.com/s/article/calendars-and-asana
11. OneCal, "How to subscribe to a web ICS calendar in Google Calendar": https://www.onecal.io/blog/how-to-subscribe-to-a-web-ics-calendar-in-google-calendar
12. URMC MyChart, website changes (Add to Calendar, details or time only): https://mychart.urmc.rochester.edu/mychart/en-US/docs/MyChart-Nov11-Website-Changes.pdf
13. Zocdoc blog, keeping track of medical appointments: https://www.zocdoc.com/blog/guides/a-guide-to-keeping-track-of-important-medical-appointments/
14. A Doctolib patient's public request for calendar sync (LinkedIn): https://fr.linkedin.com/in/julien-mk
15. Interaction Design Foundation, add-event-to-calendar docs, Google: https://github.com/InteractionDesignFoundation/add-event-to-calendar-docs/blob/master/services/google.md
16. University of Michigan Depression Center, "How to Create 'Add to Calendar' Links": https://teamdynamix.umich.edu/TDClient/210/DepressionCenter/KB/Article/13454/How-to-Create-Add-to-Calendar-Links

Iris
