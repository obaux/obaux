# b25 re-test, and the run-through for Ava's two changes (13 October 2026)

Iris, User Research & Testing Lead. Mira, 03:31: re-test b25 (`e94250ee`), and prepare the
run-through Will asked for at 03:23.

How: `main`'s Chromatic Storybook (built 03:10, after the 03:09 merge), plus local builds of
`e94250ee`: the app, using the e2e pretend data (network stubs; no real account, no member
data), and the website. 390px and 320px wide. I never used the live app.

## Part 1 — b25 re-test

| What | Result |
|---|---|
| About Pam: carousel words back on all three tabs | **Pass**: English, Arabic, Spanish, Russian ([en](shots/b25-about-case-managers-en.png)) |
| About Pam: the line under the tabs gone | **Pass**: no `about.how.*` text in any language |
| About Pam: intro without "coming home" | **Pass**: in all four languages checked |
| `onboarding.admin.2`, `onboarding.provider.3` | **Pass**: both drawn and fit, Arabic right to left ([ar](shots/b25-about-admin2-ar.png), [ru](shots/b25-about-provider3-ru.png)) |
| About Pam: Pause / Play | Pause **passes**; Play **doesn't restart on Android**, see **W1** |
| Privacy: `sharing.p5`, `p6`, `what-we-keep.p11`, `p12` | **Pass**: all four in English, Simplified Chinese and Arabic |
| Privacy: `translation.p2` absent | **Pass**: the whole translation section is absent (`MESSAGE_TRANSLATION.enabled: false`) |
| Privacy: the date | **W2**: still "Last updated 10 October 2026" |
| Explore bell (member), no notifications | **Pass**: no bell; the search box is full width ([shot](shots/b25-explore-bell-none.png)) |
| Explore bell (member), one notification | **Pass**: bell shown, "Notifications, 1 new" ([shot](shots/b25-explore-bell-one.png)); after reading, the bell stays with no dot; a case manager keeps the bell. The new e2e passes 9/9 |
| Explore bell arriving | **W3**: the page jumps when it appears |
| Website Home, Will's lines | **Pass**: band, programs, case managers and privacy lines as signed; 24/7 still held ([shot](shots/b25-site-home-programs.png)) |
| Website Home, "Add your program" → Sign in | **Works as built.** But see **S1** |

### S1 — "Add your program" makes a program lead into a member

**What happens.** The button goes to the app's front page. Signed out, that is Sign in,
showing the member slides ([shot](shots/b25-add-your-program-lands.png)). From there:

- A program lead with no invite who types their number gets a code.
- They then "finish signing up", which makes a **member** account.
- Nothing on that path adds a program. Program accounts are by invite only, and the
  add-a-program flow is still in the STATUS backlog.

The button used to go to the "can't sign in" help post.

**Why it stops someone.** The website's own HELD list keeps "Join as a case manager" off
Sign in for exactly this reason: "signing in would make a case manager a member account". The
same thing now happens to a program lead.

**Will asked for this link (a65)**, so the decision is his. The choices:

- keep the help post until the add-a-program flow exists; or
- point to `/signin/?as=…` for programs, which at least shows the program slides but still
  makes a member account; or
- accept it.

Owner if it changes: Wren.

### W1 — On Android, Play doesn't restart the carousel

The carousel holds while focus is inside it, which is right for a keyboard user (D-501).
But in Chrome, tapping a button gives it focus.

On About Pam (and on Sign in, which uses the same carousel):

1. Tap Pause. The slides stop and the button becomes Play.
2. Tap Play. The button turns back to Pause, but the slides **stay put**, because the button
   still has focus. I waited 15 seconds.
3. They start again only after you tap somewhere else on the page.

So the button seems to do nothing. iPhone Safari doesn't focus a button on tap, so this is
mostly Android. It came in with the button on 11 October (D-501), not with b25. Owner: Dot
(`packages/ui/src/OnboardingSlides.tsx`).

### W2 — Privacy still says "Last updated 10 October 2026"

Since then, Privacy has gained `what-we-keep.p9`–`p12` and `sharing.p5`–`p6`, and changed
`sharing.p2`. A member who checks the date would think nothing has changed. Nothing ties
`privacy.updated` to the paragraphs, and no test checks it. Owner: Lena / Sage, with Will
signing the date.

### W3 — The bell pushes the page down when it appears

The bell stays hidden until the notification list arrives, so it never flickers. That's
deliberate. But when it does appear, it takes room in the header:

- the "Member" chip drops to a second line;
- everything below moves down **25px at 390px and 20px at 320px**;
- on a slow connection that happens about a second after the page is drawn, under a thumb
  reaching for "Search by name or address".

Measured with an 800ms delay on the notification list.

Owner: Nico (`HeaderBell`), with Dot for the header. D-551 on `claude/pam-design-role-badge-fit`
may change the wrap; I'll re-measure in b26.

### Noted, not new

- **The chip breaks inside the word.** At 320px with the bell, "Member" breaks as "Membe / r"
  ([shot](shots/b25-explore-bell-one-320.png)). This was already true before b25 (members
  always had the bell then), and Dot's D-551 is in flight. Re-test in b26.
- **W4 — A real case manager sees made-up trips for a real member.** The person screen always
  uses `dummyTripsFor(person.id)` (`app/person/page.tsx:284`) ([shot](shots/rt-base-case-manager-member.png)).
  - The stat says "2 Trips coming up" with no "example" mark.
  - The note at the bottom says "examples until Pam books visits", but Pam has booked visits
    since b22.
  - D-509 says example trips are for Storybook, demos and `pam.examples` only.
  - A case manager could call someone about a visit that doesn't exist.

  Found while setting up part 2; it isn't in b25. Owner: Ava (the case manager's person
  screen) with Piper (trips).

## Part 2 — the run-through for Ava's two changes (planned, not run yet)

Will, 03:23: "have our UX testing team do a run-through to make sure that it works and it
shows up on the super admin". It covers two changes:

- (a) the super admin without the role switcher;
- (b) a case manager no longer sees "Connect {name} to…" on a real account.

### How it runs

- **Local build:** of Ava's merged SHA, with the e2e pretend data (network stubs, a made-up
  person "Keisha"; no real account or member). The script is ready and was run on `e94250ee`
  as the baseline.
- **Storybook:** `main`'s, for the demo views.
- **Screenshots:** 320px, every step, before (b25) and after.

### Baseline today (b25)

- The super admin has "Switch the view" in the header on Home, Places, Everyone, Requests,
  Notifications, Points and Person (7 of 7 screens) ([Home](shots/rt-base-super-admin-home.png)).
- A real case manager on a real member sees "Connect Keisha to…" above "Message Keisha".
  Storybook's case manager "Member" shows "Connect Jordan to…".

### (a) Super admin, no switcher: what "works" means

1. No "Switch the view" control on any of the seven screens above, or on Place or Reported
   places.
2. The header shows the "Super admin" chip in the switcher's place, with nothing left empty or
   misaligned, at 320 and 390.
3. Every super admin tool is still reachable in one or two taps from Home or Profile:
   - Requests, Programs to check, Invited people / invites log;
   - Everyone, Reported places, Notifications, Messages.

   A tool that was only reachable by switching views would now be lost, and that is the
   main thing to catch.
4. **A stale view, kept from before the update.** The chosen view lives in the tab's
   `sessionStorage` (`pam.view-as`). An open tab or installed app may still hold "member".
   - Today, a super admin with that value lands in the member's Explore with no switcher on
     that screen ([shot](shots/rt-base-super-admin-stale-view.png)).
   - After the change there is no switcher anywhere, so the app must ignore the stored value
     and show the super admin's own Home. If it doesn't, that is an S: they're stuck as a
     member until they close the tab.
5. **View as.** If `/view-as/` and `/use-as/` stay, they still open and come back. If they go,
   their links go too, and opening the address directly lands somewhere sensible.
6. **"It shows up on the super admin".** I read Will as asking that whatever replaced the
   switcher is visible on the super admin's own screens. I'll check where Ava says it lives.
   If it's something else, Mira, tell me and I'll add it.

### (b) Case manager, no "Connect {name} to…"

1. **Real case manager on a real member:** no "Connect … to…" row. "Message Keisha" moves up
   with no gap, at 320 and 390.
2. **Typing `/person/connect/?id=…`** directly: today it opens "Connect Keisha" with an
   example list. After the change it shouldn't offer a way to recommend. I'll check what it
   shows instead.
3. **Demo case manager and Storybook:** whatever Ava intends (kept as an example, or gone),
   matching the D-number she records.
4. **Elsewhere:** no "Connect" or "recommend" wording left for a real case manager, in
   Home's people strip, a member's row menu, or notifications.
5. **One more language:** Arabic, to check the gap closes right to left as well.
6. **Unchanged:** the super admin and the program lead don't change.

I report back to Mira with before-and-after screenshots for Will, and S / W / polish as
usual.

Iris

## b26 re-check (`d8b7d37f`, 04:40)

- **W2: pass.** Privacy says "Last updated 13 October 2026" and Terms says "11 October 2026", on
  screen in all seven languages (Storybook, built 04:19). The new `legal-updated.test.ts`
  ties the date to the paragraphs.
- **D-551, the role chip: pass.**
  - **Local build:** 56 of 56. The member's Places screen with one notification (the case
    that broke in b25), for member, case manager, program and super admin, in seven
    languages, at 320px and 390px. No chip word is split across lines, and nothing scrolls
    sideways.
  - **Longest labels:** "Кейс-менеджер" and "Gestor de casos" stay on one line. The area and
    the bell move to a second row instead
    ([ru, 320](shots/b26-chip-case-manager-ru-320.png)).
  - **Storybook:** 126 of 126 on the AppHeader stories and the role Home screens. Those Home
    screens have no chip, so they had nothing to break.
- **W3** is Nico's to measure in e2e, as Mira asked. With the area and bell now on their own
  row, the header is taller whenever the bell shows, so the jump when it appears is worth
  his measuring.

## b27 re-test (`2991f703`, 05:33)

Storybook (built 05:09) and a local build of `2991f703` with pretend data. I tested sign-in
with pretend replies: no code was sent, and no number or account is real. b27's three new e2e
tests pass 27/27.

### W1: pass

Tested with a real touch tap at Android size (412×915, Android Chrome):

- Pause holds the slides.
- After Play, the slides move on within 6 seconds without tapping anywhere else, though focus
  stays on the button.
- Keyboard: reaching Pause with Tab holds the slides (10 seconds, no move). Enter pauses;
  Enter again plays, and they move on.

This holds on About Pam and Sign in, in Storybook and the local build (4/4 surfaces).

### W4: pass, and one new W (W5)

A real case manager on a real member:

- With no visits, "None yet." shows, along with "0 Trips coming up", no example trips and no
  examples note ([shot](shots/b27-w4-real-member-none.png)).
- With visits, it shows only the place, picture, day and time, and the count matches
  ([shot](shots/b27-w4-real-member-visits.png)).
- The app asks only for `id, starts_at, service_id, services(name, category)`, leaving out
  cancelled visits.
- An example person (Storybook "Member", Jordan) still shows example trips.

**W5: a missed visit is listed as attended.** "Programs attended in the past" and its count
take every past visit that isn't cancelled (`useMemberTrips`: `status <> cancelled`, and
`status` isn't read). The database also has `scheduled` and `missed`
(`appointment_status`). So a visit the member missed, or one nobody marked, shows the case
manager a program the member "attended". That's live and untrue, the same kind of problem as
W4.

Either:
- show only `attended` under that heading; or
- rename the heading to something like "Past visits" and say on each one how it went, if the
  case manager may see that. Privacy `who-can-see.p1` says the guide sees "your visits".

Owner: Piper, with Sage for the words.

### S1: partly passes, one W (W6)

**What passes:**
- A signed-in member who opens `/signin/?next=/profile/add-program/` lands on Add a program,
  once. Opening Sign in again goes Home.
- `/profile/add-program` without the trailing slash works too.
- Every other value is ignored, lands Home, and leaves nothing stored: an outside address,
  `//…`, `/\…`, `%2F%2F…`, `/admin/`, `/profile/`, upper case, a query, `../`,
  `javascript:`, a leading space, a double slash.
- A program lead is never sent.
- **Brand-new person:** after the code, they go through Join's three steps ("What others can
  see", "Text messages", "You are in" → Start) and land on Add a program.
- **Member who has already answered the reminders question:** after the code, they go
  straight to Add a program.

**W6: a member who has never been asked about reminders loses the link, and it fires later.**
After the code, Sign in sends them to the reminders question first (`SignInScreen.tsx:309`).
"Not now" goes Home, not to Add a program
([shot](shots/b27-s1-never-asked-1-home.png)). The link stays in session storage. The next
time they open Sign in in that tab, they're taken to Add a program out of nowhere
([shot](shots/b27-s1-never-asked-2-later.png)).

The comment above that line says the opposite: "A listed way on (S1) goes first … the
reminders question waits for next time". The fix is to do what the comment says, or have
Reminders hand on to the link when it finishes. Owner: Piper.

**Polish: Add a program is offered to everyone but a program lead.** `takeNext` skips only
program leads, so a signed-in case manager or super admin is sent to Add a program
([shot](shots/b27-s1-case-manager-lands.png)). Profile offers that screen only to members
(`ProfileScreen.tsx:88`). The same member-only rule would fit here.

## b29 re-test (`96f27a77`, 07:00)

joinpam.org is blocked from this environment, so I tested a local build of the website at
`96f27a77` (the same code Vercel built). For the app, I used a local build with pretend data
and the e2e suite. I never signed in.

### 1. Website on phones (a77) and the green card (a80): pass

- **Layout:**
  - At 320, 390 and 1280px, nothing scrolls sideways and every tap target is at least 44px
    high. The name chips are 48px high on phones.
  - Shots: [320](shots/b29-site-card-320.png), [1280](shots/b29-site-card-1280.png),
    [390, programs row](shots/b29-site-programs-390.png).
  - I checked against what D-550/553/556 describe, not against the Figma frame itself, which
    I can't open from here.
- **Cycle:** Residents → Program Providers → Case managers → Residents, at 5.7s, 11.8s and
  17.9s, so every 6 seconds.
- **Crossfade:** the incoming picture goes from 0 to 1 over about 600ms while the outgoing one
  stays at 1 underneath, then drops. The green never shows through.
- **Pill:**
  - It reads "Pause card" while playing and "Play card" when paused.
  - It has no `aria-label`, so its screen-reader name is its text and the two match.
  - It's 48px high.
  - A tap on Pause held the card for 13 seconds; a tap on Play moved it on.
- **A tap on a chip:** it shows that view and stops the cycle (held for 14 seconds), and the
  pill turns to "Play card".
- **Reduced motion:** nothing moves in 14 seconds, there's no pill, and no fill animates.
- **b28's link:** "Add your program" now goes to
  `app.joinpam.org/signin/?next=/profile/add-program/`. "Join as a case manager" still goes
  to the help post.

**An artefact, not a finding:** a full-page screenshot shows blank stretches. The rows draw
in as they scroll into view; scrolling the page shows every row.

### 2. W3, the Explore bell: pass for a phone that has had the bell before

- Nico's `explore-bell-shift.spec.ts` and `explore-bell.spec.ts`: 21/21.
- **Returning phone** (`pam.explore.bell` = 1) with the notification list held back 0.8s or
  2s: the bell's place is kept from the first frame. The search box doesn't move after the
  page appears, and the browser's layout-shift score is **0.000** at both 390px and 320px.
  - In b25 the same case scored 0.006 at 390px and 0.027 at 320px.
- **A phone's first-ever bell:** it still moves the page once (25px at 390px, 26px at
  320px). The code says so (`HeaderBell.tsx`: "The first time a bell appears on a phone it
  still moves the page once"). I'm not filing it: it happens once per phone, and holding a
  slot for every member would leave members with no notifications an empty gap.

### Noted: the a76 screen counter shipped in b29

- The migration is `20261013042956_count_how_many_phones_open_your_points_and_profile_each_day`.
- Sage's line is in Privacy as `what-we-keep.p13` in all seven languages, and Privacy is dated
  13 October.
- As planned (`2026-10-12-rewards-interest-plan.md`), the first full week is Mon 19–Sun 25
  October. Four full weeks end Sun 15 November, so **I read weeks 3–4 on Thursday 19
  November.**

## b30 run-through (`8f0af8d1`, 07:47)

This is the run-through planned in Part 2, plus Mira's items 2–5. I used a local build of
`8f0af8d1` with pretend data, at 320px unless I say otherwise, and Storybook (built 07:30).
Sign-in used pretend replies: no code was sent, and no real account or number was involved.
Items 1–3 ran as one script, 29/29.

### 1. Ava's a78 list: pass

**The switcher is gone:**
- None of the ten super admin screens has a "Switch the view" control: Home, Places, Place,
  Interested, Notifications, Points, Everyone, Person, Reported places and Requests. Profile
  has no "See the app as" row either.
- Home keeps just the bell and Help where the switcher was
  ([shot](shots/b30-super-admin-home-320.png)).
- `/view-as/` has gone from the build. A typed address gets the 404.
- In Storybook, the super admin Home and Profile stories have no switcher.

**A stale view from before the update:** I opened a tab already holding `pam.view-as` set to
`member`, `admin` or `provider`. Each time it landed on the super admin's own Home (Requests),
and the key was then removed ([shot](shots/b30-super-admin-stale-view-member.png)). This was
the case I flagged as a possible S, and it doesn't happen.

**Connect:**
- A real case manager on a real member gets no "Connect … to…" row. "Message Keisha" moves up
  into its place with no gap ([shot](shots/b30-case-manager-real-member.png)).
- Typing `/person/connect/?id=…` goes back to `/person/`.
- In Storybook, example Jordan still has "Connect Jordan to…" and its Connect screen.

**Join step 2:** "What others can see" now has a Contact Pam row, linking to
`https://joinpam.org/support/`. No `tel:` link appears anywhere in the flow
([shot](shots/b30-join-step2-contact.png)).

### 2. W5, past visits: pass

I gave the member four visits: one attended, one missed, and one unmarked in the past, plus
one upcoming.

- "Programs attended in the past" shows a count of **1**, and its screen lists only the
  attended visit ([shot](shots/b30-w5-past-attended-only.png)).
- "Trips coming up" shows 1, the upcoming visit.

### 3. W6, the way on after Sign in: pass

**Signing in by code, with `?next=/profile/add-program/`:**
- A member never asked about reminders lands on Add a program. The link is cleared, and Sign
  in later goes Home. **Fixed.**
- A member who has already answered lands on Add a program, cleared.
- A program lead, a case manager and a super admin each land Home, with the link cleared.

**Already signed in:** a member goes to Add a program; the other three roles don't. In every
case nothing is left stored.

### 4. Street search off: pass, one polish

I tested four ways the switch can be off: Pam's server says off, the server errors, the
network fails, and signed out.

- The area sheet keeps the old label "ZIP code or neighborhood" and hint "Like 19107, or
  Fishtown."
- Typing "Broad and Girard" shows no Google rows, no Google mark, and no error. The page makes
  no request to Google, and "Fish" still finds Fishtown.
- When the server says off, the app asks only for `status`, once.
- When the switch can't be read (server error or no network), the app also sends `suggest`
  with the typed words to **Pam's server**, which without a key asks Google nothing. Not a
  finding; noted.
- Privacy `sharing.p7` is on screen in all seven languages, with the date 13 October.

**Polish:** "Pam remembers the area you pick on this phone only." is now centred even when
street search is off. It was centred to sit under Google's mark (Will, 13 October), which only
shows when the search is on. Everything else in the sheet is left-aligned, so with the search
off this one line no longer matches "exactly as before"
([shot](shots/b30-street-search-off.png)). Owner: Piper.

### 5. Dot's test change (`claude/pam-design-signin-fit` @ `90533a90`): fail, and it hides a real gap

**What the test was for:** the old test (D-502, Will: "otherwise they lose context") checked
that after you scroll, the mark and the language switch are still at the top. Its
precondition was "the page scrolled more than 100px".

**The change:** the new version checks the bar only if the page scrolls **250px or more**;
otherwise it only checks that the page scrolled more than 40px.

**Why that doesn't test the same thing:**
- I ran it on the branch with logging. The six cases at 320×568 scroll 114, 165, 165, 114,
  123 and **72**px. None reaches 250, so **the bar is never checked in any case**.
- The bar appears once the page has scrolled more than **72px** (`SignInScreen.tsx:382`). So
  the 250 cut-off skips exactly the range where the bar should appear (73–249px).

**The gap it hides** (on the branch, 320×568):
- Arabic and Simplified Chinese, not invited, scroll **exactly 72px** at most (and Arabic at
  360×640 too). The bar never appears, and the hero's mark has already left at about 60px.
- At the bottom of the page there's **no Pam mark and no language button**
  ([shot](shots/b30-dot-branch-signin-ar-320x568-scrolled.png)).
- English and Russian scroll 114 and 133px and get the bar.
- The old test failed on that Arabic case (72 is not more than 100), which is presumably why
  its precondition was changed. The new one passes it.

**A version that keeps the meaning:** drop the precondition. After scrolling to the end,
whatever the distance, assert that a Pam mark and the language button are visible in the top
140px, and that the invite line is at 0 when invited. That fails today on Arabic and Chinese
at 320×568, which is right.

**The fix to the page itself:** the bar should appear where the hero's mark actually leaves
(about 60px, or measured with an `IntersectionObserver` on the hero's mark), not at a fixed
72px. Owner: Dot. This is W-level for anyone on a small phone in those languages.
