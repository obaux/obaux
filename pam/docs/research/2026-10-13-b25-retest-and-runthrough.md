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
