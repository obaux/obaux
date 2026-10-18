# Interaction run-through after b60: does every tap open what it should? (17 October 2026)

Iris. The merge desk's job at 19:15, started at 21:45 once Dot's row-tap fix (b60) was on `main`.
Will at 19:13: "We need to do a quick run-through of the interaction another time to make sure
everything is clicking and opening as planned."

## How

- **What I tested:** Storybook, from `main` `62ba50e4`. It covers every role's screens, each inside
  the clickable prototype with the pretend database:
  - **Member:** Member › Created, plus Onboarding;
  - **Case manager:** Case manager › Screens;
  - **Program lead:** Program lead › Screens;
  - **Super admin:** Super admin › Screens.

  That is 149 screens. The `build:e2e` app from the same commit was used where a result
  might be Storybook's own doing: the language menu, and the Terms and Privacy jump links.
- **Hosts:** everything ran on 127.0.0.1, and every other host was refused. Chromium's updater was
  off. I signed in to nothing and looked at no member's data.
- **The setup:** Playwright in Chromium with touch, at 390×844 and at 320×568.
- **For every control a person can tap (1,138 at 390):**
  - **Middle and edges:** I checked what a finger lands on at its middle and at 3px inside each
    edge, at both widths.
  - **The card or row around it:** if the control sits in a card or row that holds nothing else,
    I checked the card's edge and corner too.
  - **A real tap at 390:** I tapped the middle of the control. If nothing changed, I tapped again.
    Then I recorded where it went, or what opened, and whether I could close it or go back.
    Dead-looking edges and corners got a real tap as well, because Dot's fix answers taps on a row
    from the page, not from the link.
- **Checked by hand:** every hit the script flagged, then sorted into real findings and the
  script's own mistakes (listed at the end).
- **Not tapped:** `tel:`, `sms:`, `mailto:` and links to other sites. Their address is recorded
  instead.
- **One note on hosts:** tapping "Speak your message" made Chromium try Google's speech servers, and
  its updater tried Google too. The proxy refused all of it, so nothing left the machine. Later runs
  had Chromium's speech feature switched off.

## The result

**Dot's fix holds.** Every Profile, Help, Legal, Language, Invite and settings row opens from its
icon, its words, the space beside them and its chevron, on every role. So do the cards on Trips,
Explore, the program lists, the case manager's members and the program lead's checklist.

**Overall:**

- 1 finding that stops someone;
- 4 that slow someone;
- 5 polish.

**No dead taps in the app itself, and nothing that opens and can't be left.** One tap goes to the
wrong place, and it happens in Storybook only (P4).

### Stops someone

| # | Role | Screen | Control | What happened | What should happen |
|---|---|---|---|---|---|
| S1 | Everyone (before sign-in) | Sign in › the globe button; Sign up › "Choose a language" (member, case manager, program lead) | The language list | The list is 300px tall and holds seven 48px rows. Russian is cut in half and **Arabic is hidden below the edge** when it opens, in the app and in Storybook, at 390 and at 320. Nothing shows there is more. At 320 on Sign up, only four of seven languages show. I couldn't test whether a finger can scroll the list (Chromium here doesn't fake a finger drag). Even if it can, an Arabic reader who can't read the other six has no sign to try. (`shots/2026-10-17-run-signin-language-390.png`, `-320.png`, `shots/2026-10-17-run-signup-language-320.png`) | All seven languages show without scrolling (a taller list, or a sheet), or the cut-off row is obvious. Arabic is the language most likely to be needed by someone who reads nothing else on the screen. |

### Slows someone

| # | Role | Screen | Control | What happened | What should happen |
|---|---|---|---|---|---|
| W1 | Program lead | Home ("Coming in", week and day), Your calendar, Members interested | A visit row (time, name, visit type) | Only the member's name opens the member's page. It is a link 24px tall (Priya: 39×24). The time ("9:00 AM · 60 min"), the line under the name ("First visit · Not checked in") and the space between do nothing when tapped. This is the same kind of row as bug A, but it isn't an Astryx `Item`, so b60's fix doesn't reach it. (`shots/2026-10-17-run-calendar-rows.png`) | The whole row, apart from the check-in circle, opens the member's page. |
| W2 | Member, case manager, program lead, super admin | A place's "More options" (Flag something, Share this place, Message the program); Home's "+" (Create new booking, Invite someone to Pam, Add a program, Search); What you sent's "More" (**Delete and start over**, Help) | Items in the small drop-down menus | Each item is 34px tall, under 48. On What you sent, "Delete and start over" sits directly above Help, so a thumb aimed at Help can hit Delete. (`shots/2026-10-17-run-add-menu.png`) | 48px items, or a bottom sheet with 48px rows as the city and language pickers already use. |
| W3 | Everyone | Messages › New message (the sheet nearly fills the screen); a place's opening hours; a place's address › "Open in" | Leaving a bottom sheet | None of the three has a Close or Cancel. They close by dragging the grab handle or tapping the dim area. On New message, the dim area is a strip about 68px tall at the very top. Each one does close, so nobody is stuck; it just takes knowing the gesture. (`shots/2026-10-17-run-new-message-sheet.png`, `shots/2026-10-17-run-hours-sheet.png`) | A visible Close (or Cancel) on each sheet, as the photo viewer and the dialogs already have. |
| W4 | Everyone who writes | Any conversation | "Speak your message" (the microphone) | In this Chromium, the tap shows nothing: no "listening" state and no message. The speech service couldn't be reached here, so this may be only this browser. But if dictation can't start on a phone (microphone refused, or no connection), I couldn't find anything that says so. | Check on Will's phone. When dictation can't start, say so in one line, as "Pam can't send that file" does. |

### Polish

| # | Role | Screen | Control | What happened | What should happen |
|---|---|---|---|---|---|
| P1 | Everyone | Every screen | Pressing a control | This is noted once per kind, as asked; it's expected until the press layer is built. I forced the pressed state (with hover and focus) in Chromium's tools and compared before and after:<br>- **No visible change at all:** trip cards, program cards, the Day / Week / Month switch, a place's service choices (GED classes…) and conversation rows.<br>- **Some change (Astryx's own shade):** list rows, the tab bar, header icon buttons, chips, big and secondary buttons, and the calendar's name links.<br>On iPhone the shade now shows too: b60 added the touch listener. | The press-in layer, starting with cards and the switch, which show nothing today. |
| P2 | Everyone | Terms of service, Privacy | The "jump to a section" links at the top | They work in the app (tapping "Points" scrolls to Points). They are 40px tall, a little under 48. In Storybook they do nothing, because the prototype catches every same-site link, `#points` included. | 48px rows. In Storybook, let `#` links scroll. |
| P3 | Member | Trips | The two map pins under the sheet | With the sheet up, the map's pins ("Example Learning Center, Mon, Oct 19"…) are covered but still in the page. A screen reader reaches them, and a finger on that spot lands on the sheet's card instead. | Hide the covered pins from the screen reader while the sheet covers them. |
| P4 | Program lead | Storybook only: Program lead › Screens › "Home — folded" | The visit rows | "Marcus" opens Jordan, "Tanya" opens Keisha and "Luis" opens Miguel. The story's home names don't match the pretend database's people. The app reads both from one place, so this is the story's data only. | Same names in the story and the pretend database. |
| P5 | Member, case manager, program lead | Sign up › "City you live in" | "Pam is only in these cities for now." | It is drawn as a 48px row in the city list, like a choice, but tapping it does nothing. | A line of text under the list, not a row. |

## Checked and fine (what the script flagged that isn't a problem)

- **Overlays that seemed impossible to close:**
  - Every menu and sheet closes with a tap outside.
  - Every dialog has its own way out: "Not yet", "Cancel", "Keep the star".
  - The city and language pickers close when you tap outside them.
- **"Done", "Back to Home" and "Back to Sign in" that seemed dead:** they only had nothing to go back to because the
  story opened that screen directly. Reached by tapping through, they work (Trips › Sign › Done goes
  back to Trips).
- **The current tab, the selected chip, and the selected choice:** "All", "Week", "Me", English on
  Language, and "Preview" do nothing when tapped, because they are already chosen.
- **Add a photo, Add a document, Choose files:** each opens the phone's file picker.
- **The Pause / Play button on Sign in:** it switches.
- **"Back to top":** it scrolls.
- **"Show more of your trips":** it raises the sheet.
- **Stuff shared:** a document row downloads the file.
- **"Close this message":** it closes the "can't send" note.
- **The "Programs to check" row on the super admin's Profile:** one script tap landed on the tab bar
  while the page was still scrolling. Tapped by hand, it opens Programs to check.
- **The page's side margins:** the 16px each side of full-width rows doesn't open them. That is page
  margin, not part of the row.
- **"Text Andre" and "Text {name}":** these buttons hand an `sms:` link to the phone. I didn't tap
  them.
- **Link cards that look small by measurement:** these include program and member cards and the
  program lead's checklist. The link's own box is only the title, but the card is a stretched link,
  and a tap on the picture, the description or the chevron opens it.

## How sure

- **High:** S1 (app and Storybook, both widths), W1, W2 and W3, each confirmed by a real tap.
- **Medium:** W4. It may be only this Chromium; it needs Will's phone.
- **Not covered:**
  - a real finger scroll inside a menu;
  - the on-screen keyboard;
  - VoiceOver and TalkBack.

  These still need Will's phone.

Iris
