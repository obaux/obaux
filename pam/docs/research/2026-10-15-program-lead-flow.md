# Program lead flow: first pass (15 October 2026)

Iris, User Research & Testing Lead. This is the third role in the first pass over every flow,
after the Member and the Case manager (`docs/team.md`). The merge desk asked for it on 15 October
at 13:51.

## 1. The flow and the person

- **Who:** Alice, who runs a free job-skills program.
  - She does the program's paperwork herself, on her phone, between classes.
  - Her measure of Pam is its sign-in slide: "See who is coming, before they walk in."
- **Starting where:** an invite link, signed out, with no program on Pam yet.
- **Trying to:**
  1. join;
  2. add her program and send it for review;
  3. see who's coming;
  4. check someone in;
  5. open a member;
  6. look at her policies;
  7. book a visit for someone who wrote to her.
- **Where tested:**
  - Storybook built locally from `main` `7b58b1f9`. No app code has changed on `main` since,
    up to `73f96b76`.
    - The new lead used `program-lead-prototype--new-program-lead`.
    - Her running program used `program-lead-prototype--prototype`.
    - Eleven `program-lead-*` and `onboarding--program-lead` screens were checked as well.
  - One check in the app built with `build:e2e`, served from `out/`. Every Supabase call was
    answered by my script.
  - Every other host was refused in both, and none was asked for.
  - **Not the live app.** No account, and nothing sent. The program was made up and stayed in the
    prototype.
- **How:**
  - Playwright in Chromium with touch, in New York's time zone.
  - The walk at 390×844 in English, light.
  - The eleven screens again at 320×568 (English, light), at 390×844 (Spanish, dark) and at
    320×568 (Arabic, light).
  - On each one I measured tap targets and text sizes, checked for sideways scroll, and read the
    accessibility tree.

## 2. What happened

| Step | Taps | Screen |
|---|---|---|
| Sign in from the invite | 2, plus the number and the code | "Join Pam", then Enter your code |
| Join | 2, plus her name | About you (1 of 2), then What to expect (2 of 2) |
| First Home | 0 | "Get started": two faces, then Add your program and Add your photo |
| Add her program | 9, plus typing | Name, kind, a sentence, an address. Then Skip (phone and website), one service, Review details, Add program |
| Sent for review | 0 | "Sent to Pam": what happens next, and what to do while she waits |
| See who's coming | 0 | Coming in: this week, with today's four people under it |
| Check someone in | 1 | The ✓ beside Jordan; it then reads "Jordan is checked in. Undo" |
| Open a member | 1 | Jordan's page: next visit, policies 4 of 4, Message, visits with her |
| Her policies | 2 | Program, then Policies for participants |
| Book for someone who wrote | 2 | +, then Create new booking. In the app, there is nobody to pick (S1) |

**About 19 taps** for the lot, plus typing. Every step can be finished except the last, which a
real program lead cannot do.

## 3. Findings

### Stops someone

**S1. A real program lead can't book a visit for someone who has written to her.**

- **Screen:** Book a visit for a member, `/program/book/`
  (`program-lead-screens--book-for-member`).
- **Steps:** Home, then +, then Create new booking.
- **What happened:**
  - The screen says "People who have written to your program. Pick one, then the day and time."
    (`book.intro`).
  - In the prototype it lists Jordan and Miguel.
  - In the app it lists nobody and says "Nobody has written to your program yet." That held in the
    app built with `build:e2e` with a program lead signed in.
- **Cause:** `BookForMemberView.tsx:106` builds the list from
  `examples ? dummyConversationsFor('provider') : []`. Since D-509 (11 October, "no examples for
  real accounts"), a real account always gets the empty list, whoever has written.
- **What's left:** "Add a person" is for "Someone who has not used Pam yet", so there is no way to
  book for a member who is already on Pam. Jordan's page has Policies and Message, but no Book.
- **Shots:**
  - `shots/2026-10-15-pl-book-prototype.png` (the prototype);
  - `shots/2026-10-15-pl-book-real-empty.png` (the app).
- **Expected:** the people who wrote to her program, as the screen promises.
- **How sure:** high that the list is always empty for a real lead (code and app). It stops this
  one task: she has to ask the member to book it themselves.

### Slows someone

**W1. The program lead's Home has no Help.**

- **Screens:** Coming in, and Get started for a new lead (`program-lead-screens--home`,
  `--home-get-started`).
- **What happened:** the header has the bell and + only. A case manager's Home has a ? beside the
  bell.
- **Expected:** A26 keeps help "one tap from Profile and on Home".
- **How sure:** high.

**W2. Joining, step 2 of 2 has no way back and no help.**

- **Screen:** What to expect (`onboarding--program-lead`, the step after About you).
- **What happened:** the only control is "I understand", the same as the case manager's W1 of
  today.
- **Shot:** `shots/2026-10-15-pl-join-step2.png`.
- **Note:** listed so the fix lands for both staff roles, not only the case manager's.
- **How sure:** high.

**W3. The Day / Week / Month switch is small, and the week opens on days already gone.**

- **Screen:** Coming in (`program-lead-screens--home`).
- **What happened:**
  - The three choices are 30px tall and 33 to 60px wide, in 12px text, against 48px for taps and
    12px as the smallest caption (A27).
  - The schedule opens on the week, so on a Thursday it shows Monday, Tuesday and Wednesday
    ("Nobody booked") above today.
  - At 390×844, today's four visits start at the middle of the screen. At 320×568, the first is
    under the fold.
- **Shots:** `shots/2026-10-15-pl-home-week.png` (390) and
  `shots/2026-10-15-pl-home-320-today-at-fold.png` (320).
- **Expected:**
  - targets of 48px;
  - today first: open on Day, or start the week at today.
- **How sure:**
  - high on the sizes;
  - medium on what a lead wants first. Her slide promises "who is coming", which means today.

**W4. A new lead sees two faces with no word on who they are.**

- **Screen:** Get started (`program-lead-screens--home-get-started`), before she has added a
  program.
- **What happened:**
  - Above "Add your program" are rings for Tanya and Marcus, with no visible heading; "Saved a new
    place" is only in their spoken names.
  - She has no program yet, so who are they?
  - The region is named "People interested in your program" for a screen reader only.
- **Shot:** `shots/2026-10-15-pl-get-started.png`.
- **Expected:** a visible heading, and no strip until she has someone.
- **How sure:**
  - medium. These are example people;
  - I could not see what a real new lead gets without real data.

### Polish

- **P1. Program, step 2 onwards: the back arrow is named "Back to Home"** but goes back one step,
  keeping what was typed (which is right). A screen reader user hears it will leave.
- **P2. A program can be sent with no address** ("Skip for now" on Where is it?). A member then has
  nowhere to go. Worth a warning on Review details.
- **P3. The last step's button is "Next, 6 of 6"**, and Review details follows. Fine; but "Sent to
  Pam" gives no idea how long review takes. "Pam checks each one by hand" says nothing about when.
- **P4. "Policies for participants · 4 to sign"** on the lead's Program tab is the member's
  wording: the lead signs nothing. Her own Policies screen says "Signed by 4". "Participants",
  "members", "people" and "program partner" (on the invite) all appear for the same people.
- **P5. On Coming in, a person who signed every policy has a small green pencil;** one who hasn't
  has nothing. The pencil reads as "edit". Nothing says who still needs to sign.
- **P6. Jordan's page says "7 Visits with you" over a list of ten visits**, all ahead. The number
  may count past visits, but the label is the same for both.
- **P7. The + menu holds "Search"** among Create new booking, Invite someone and Add a program.
- **P8. A member's page is titled "Profile"**, as for the case manager (W3 there, routed to Ava);
  the program lead's page shares `person.profile`.
- **P9. Small targets:**
  - "About services" (36×36) on Add a program step 6;
  - "Jordan signed every policy. See which." (36×36) on his page;
  - Copy address (32px wide).
- **P10. What a program sees of saves isn't on the member's "A program can see:" card.**
  - `people_activity()` gives a program lead the time a member saved a place (D-199, never which
    place). Members are told so under "Your guide can see" ("A program you joined sees this too",
    `transparency.canSee.saves`).
  - It is not on the "A program can see:" card (`transparency.program.*`), and not on the lead's
    own What to expect.
  - It is not a breach (D-199 decided it); it's the one place it isn't said. For Lena.

## 4. What worked (keep it)

- **Adding a program is six short steps with a Review details page,** where every line is a button
  back to its step. Back keeps what was typed.
- **"Sent to Pam"** says what happens next in three steps, and what to do while waiting (photo,
  policies).
- **Checking someone in is one tap, and it can be undone** ("Jordan is checked in. Undo"), spoken
  as a pressed button.
- **Her policies screen says who signed each one and which services it is for.**
- **What to expect** tells a new lead plainly: "Pam never tells you why someone is looking for
  help."
- **Spanish is *usted* throughout** the program lead's screens, as the rule for staff says.
- **No sideways scrolling** on any of the eleven screens at 320, in English, Spanish or Arabic.

## Not covered this pass

- **The live app, signed out:** not opened.
- **Screen readers on a phone:** VoiceOver and TalkBack.
- **Contrast in dark mode:** looked at, not measured.
- **Uploading a policy (Choose files)**, editing a service, and a program with more than one place.
- **Messages:** not walked.
- **"Add a person"** (booking for someone new). It sends a text in the real app, so it was left
  alone.
- **What a real new lead's Get started shows** (W4): it needs real data.

Iris
