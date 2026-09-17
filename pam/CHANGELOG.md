# Changelog

## [0.28.0] — 2026-09-17 · Messaging privacy migrations deployed live

### Deployed — `0055_conversation_partner_no_activity`, `0056_provider_linked_no_activity`

The migrations that limit what a conversation partner or a program admin can
read about a member (name and role only — never `last_active_at` or `phone`)
are now live on the Supabase project, not just verified locally.
`get_advisors` (security) ran clean afterward. No user-facing change — this
is the guarantee `0.27.0`'s test suite already proved, now actually in
effect.

### Found, not fixed — live/repo migration drift

Deploying surfaced six migrations applied to the live project with no
matching file in this repo (`staff_review`, `staff_denied_sms`,
`program_submission`, `demo_view`, `lock_notify_on_staff_request`,
`staff_requests_indexes`), and one committed local migration
(`0052_saved_places_say_what_they_are`) that was never deployed. Neither is
resolved here — see `STATUS.md` and D-158.

## [0.27.0] — 2026-09-17 · The transparency contract is now tested against a real database

### Added — `admin_visibility.test.ts`, built as `packages/db/test/04_transparency_contract_test.sql`

`transparency.ts`'s own file comment used to claim a test by that name
enforces the §4.1 contract against live RLS. It did not exist. Built and
run: a case manager who participates in a conversation reads its full
history; the same case manager, covering the same member but not a
participant in a *different* conversation, reads nothing from it; a
program admin gets no activity info back from either function that reaches
a member (`conversation_partners()`, `provider_linked_members()`); and a
case manager who participates in nothing gets nothing. Deliberately does
not re-test the report path — an existing test already covers that in
full.

### Fixed — this sandbox is no longer missing `postgis`

Every one of today's four migrations (`0054` through `0056`) had been
verified only by careful reading, not by execution — this sandbox lacked
the `postgis` extension `pnpm --filter @pam/db test` requires. Installed
it. **221 database checks now pass, 0 failures**, against every migration
and every test file written today, for real.

## [0.26.0] — 2026-09-17 · Program admins never see member activity, anywhere in the app

### Fixed — the pre-existing enrollment/appointment link also exposed a member's activity info to program admins

Independent of the messaging fix in [0.25.0] below: `profiles_select_provider_linked`,
a policy predating any of today's messaging work, let a program admin read
`last_active_at` and `phone` for any member they reach through an
enrollment, an appointment, or a connection — no conversation required.
Closed the same way: a database function
(`provider_linked_members()`) returning only a name, never a raw table
read. "Program admins don't see activity, across the entire app" is now
true everywhere it was checked, not just through messaging. Case managers
and super admins are unaffected — this is provider-role-specific.

### Changed — the §4.1 transparency screen states this plainly

A new line under "They cannot see": *"A program never sees the last day
you used PAM."* Re-checked every other line on the screen against what the
code actually does today rather than amending it a fourth time in one day
— found and removed one line, *"That a chat exists, and the last day you
used it,"* that described a capability no policy has ever actually
granted, predating today's messaging work entirely.

## [0.25.0] — 2026-09-17 · A conversation partner sees a name and a role, nothing else

### Fixed — the new messaging surface no longer exposes a member's activity info (or a staff person's) to a conversation partner

The `profiles` read policy added in [0.24.0] below, so a member could see
who was messaging them, turned out to hand back the *whole* profile row —
`last_active_at`, `phone`, everything — to any conversation partner,
regardless of role. Replaced with `conversation_partners()`, a database
function returning exactly two columns (name, role) for whoever shares a
conversation with the caller, following the same pattern `/directory/`
already used for a super admin's account list. Nobody sees activity info
through this path now — not a program admin, not a member, and case
managers are unaffected, since they already have real caseload visibility
through an entirely separate, untouched path. See D-154.

**Not fully closed**: an older, pre-existing policy already lets a program
admin read a member's `last_active_at` and `phone` directly, independent of
messaging — flagged, not fixed, in D-154's closing note.

## [0.24.0] — 2026-09-17 · Messaging corrected to staff-to-member

### Changed — messaging is a case manager or program admin reaching a member, never member-to-member

Corrects [0.23.0] below, shipped the same day and corrected before anyone
used it. A case manager can now message members on their caseload; a
program admin can message members enrolled in their program; a member can
see and reply within a conversation staff already started, but cannot start
one themselves and cannot message another member. The earlier
"accepted mentor/buddy connection" model is gone.

Reuses the same caseload and enrollment relationships `/admin/`'s "Your
people" screen and program screens already query — nothing new was
invented. See D-152 (supersedes D-148/149/150) for the full reasoning, and
for the RLS gap this still leaves open: who may *start* a conversation is
enforced by this screen today, not by the database.

### Added — a member can read their case manager's or program's name

New database policy (`profiles_select_conversation_partner`, migration
0054): a member had no way to read a staff person's profile before this,
because every existing `profiles` policy ran from staff down to a member,
never the reverse. Without it, `/messages/` would have shown a member every
conversation with no name attached.

### Changed — the §4.1 transparency screen now says what a direct message means

"Everything you say to them, if they message you directly" is a new line
under "They can see." A case manager who is a genuine participant in a
conversation reads it the ordinary way any participant does — a real
widening the screen did not previously disclose. "What you write in your
chats" (under "They cannot see") is now "What you say to someone else,"
since the old wording was no longer true for the only kind of conversation
that exists. D-074 is unchanged for a case manager who is *not* a
participant: a report is still the only route in.

### Fixed — nothing; another small, disclosed cost

§12's budget moved from 500.8 kB to 501.0 kB gz (now 1.0 kB over) from this
correction's rescoped copy. See D-151's update.

## [0.23.0] — 2026-09-17 · Member-to-member messaging (corrected same day — see [0.24.0] above)

### Added — a member can message a mentor or buddy they are already connected to

Two new screens: `/messages/` lists every conversation a member has, plus
anyone with an accepted mentor or buddy connection they haven't messaged
yet, and `/messages/thread/` reads and sends within one conversation. Built
entirely on the existing database and its RLS — `messages` still has no
admin read policy at all, so a case manager still only ever sees a message
if it is reported (D-074), unchanged by this release.

**Who can start a conversation is scoped to accepted `connections`**, never
an open directory of every member — see D-148 for the full reasoning and a
gap flagged for a follow-up migration: the scope is enforced by this screen
today, not by the database itself.

Reachable from a new "Messages" tile on Home, shown only to a signed-in
member's own real account — it is deliberately not part of the super admin
role-preview system (D-150).

### Fixed — nothing; a real, if tiny, cost

Adding this feature's copy pushed §12's already-disclosed 0.7 kB overage to
0.8 kB (D-151). The two new routes add nothing to the shared first-load
bundle themselves.

## [0.22.0] — 2026-09-17 · Hero motion, a quieter sign-in

### Changed — the sign-in hero's slide transition eases in and out, and holds each slide two seconds longer

The transition used the browser's own instant scroll before; it now animates
over 600ms with a custom ease, skipped entirely under reduced motion.

### Added — slide images preload behind a skeleton

A slow connection no longer jumps the layout while a slide's photo loads.

### Changed — the locale switcher's icon on the hero is larger, bolder, and sits on a darker chip

### Fixed — the hero no longer paints under the status bar on browsers that don't reserve space for it

### Changed — darker gradient wash, Medium-weight slide text, more room around the dots

### Removed — "Reply STOP to stop texts. Rates may apply." from the sign-in screen

It moved to the reminders screen, which already carries it and is the
screen a member is actually choosing something on — sign-in codes aren't
optional the way reminders are.

### Changed — a signed-out visitor lands straight on sign-in, not a splash screen first

### Changed — corner radius on the hero is now responsive

None on mobile, where the hero reaches every edge; matches the sign-in
card's own radius on wider screens where it doesn't.

### Fixed — the alert banner is now readable and thinner

It used to render nearly transparent (Astryx's own translucent status
colours) and could overlap the header below it. Rebuilt as a solid-colour,
in-flow, single-row banner.

### Fixed — a latent contrast bug in a warning badge, at 320px in light mode

Traced to the underlying design system's own colour pairing, not anything
this app set directly; overridden in PAM's own theme.

## [0.21.0] — 2026-09-17 · Flush to the edges

### Fixed — the sign-in hero now touches the true top of the screen

It used to sit 24px below it, inheriting padding meant for a page with
content in a column rather than a full-bleed photo.

### Fixed — the slide dots were covered, not missing

They sat inside the sign-in card's own overlap band and were covered by
the card's opaque surface. Moved clear of it.

### Fixed — looping from the last slide to the first no longer shows a blank flash

### Removed — the hero's corner radius

Now flush to every edge of the screen, so a rounded corner had nothing
left to read against.

## [0.20.0] — 2026-09-17 · The hero autoplays

### Changed — the sign-in hero is taller, and now advances on its own

The three-slide hero now takes roughly half the screen (up from about a
third) and autoplays to the next slide every 4 seconds, looping back to the
first after the last. A manual swipe still works at any time and resets the
4-second timer. Autoplay never runs for anyone whose device asks for
reduced motion — the carousel stays swipe-only for them.

### Changed — more space between the mark and the "Philadelphia" pill

### Fixed — the slide dots stay visible against bright parts of the photos

A drop shadow keeps the white dots readable regardless of what's behind
them.

## [0.19.0] — 2026-09-16 · A real sign-in hero

### Changed — sign-in is now a full-bleed photo hero, not a small icon on a card

The three "what PAM is" slides above the sign-in form now show full-bleed
illustrated artwork with a dark gradient wash, the PAM mark in white and
larger, a "Philadelphia" pill, and the locale switcher — all laid over the
art rather than in a plain header above it. The sign-in card now rides up
over the bottom edge of the hero instead of sitting below it, with more
padding around its own content.

### Fixed — the sign-in consent line stays on screen without scrolling

A layout regression from this same redesign briefly pushed the required
"PAM texts you a code..." consent sentence below the fold on the shortest
supported phone screens. Caught before shipping by the existing automated
check for exactly this.

## [0.18.0] — 2026-09-16 · A consistent top bar, everywhere

### Added — Program leads and Case managers: an IG-stories-style people strip on Home

While previewing Program or Case manager, Home now shows people as a
horizontal, scrollable row of circular avatars with a name underneath,
instead of a stacked list — the same shape as a stories row, with masked
edges and a mocked highlight ring standing in for future activity or
unread-message signals. Frees up a phone screen's worth of vertical space
that a row-per-person list was costing before the menu underneath was even
reached.

### Changed — the "Viewing as" role switcher is now a small icon, present on every screen

It used to spell out "Viewing as Member" in full on every screen a super
admin could see, and only appeared on some of them. It is now a compact icon
button, matching the locale switcher on sign-in, and shows up consistently
across Home, Places, Saved, the place screen, the directory, the case
manager screen, notifications, points, and account.

### Changed — Places category filter chips now match Saved's smaller size

The chips were 8px taller than the same style of chip on Saved, from an
underlying Astryx quirk rather than a chosen size. All five chips (All,
the three categories, and Saved) now render at the same height.

### Fixed — the example Family services place, saved to a member's profile, no longer errors

Opening it now shows the place's own screen, the same as any real saved
place.

### Changed — the location editor is one button, not two

The area chip in the header used to be an area-name button next to a
separate pencil button doing the same thing. It is now one button, with the
pencil trailing the area name rather than leading it.

### Changed — Settings: consistent sizing, added icons, left alignment

Every row on the account screen now shares one font size and is left-aligned
behind a leading icon. The language row's chip is white, with more room
between its icon, its label, and the chip that shows the current language.

### Changed — Case manager and Program lead people lists no longer show a location under each name

### Changed — a person's own profile no longer repeats their name under the page title

Shows their location and preferred language instead, since the title above
already says who this is.

### Added — the design system gallery now includes the role switcher, the area chip, and the people strip

## [0.17.0] — 2026-09-16 · Back where you came from

### Fixed — a saved place on Home opened the full saved list, not the place

Tapping a place card in Home's "Places you saved" strip now opens that
place's own screen, the way tapping it anywhere else already did.

### Fixed — "back" now returns to wherever a place was opened from

Opening a place from Home and going back now returns to Home. Opening it
from Places returns to Places; from Saved, to Saved. It used to always
return to Places, regardless of where the tap came from.

### Changed — sign-in: merged the password line into the consent sentence

"No password to remember" is now part of the sentence under the button
("PAM texts you a code to sign in. No password to remember. Reply STOP...")
rather than a separate line above it, freeing up a line of vertical space.

### Added — a taste of the example people, on Home itself

While a super admin previews Case manager, Program, or Super admin, Home now
shows three example people from that role's own list, with a link to see
the rest — instead of only reaching them through the menu tiles below.

## [0.16.0] — 2026-09-16 · One place for a message, one place for a language

### Added — a banner for things that already happened

Signing out used to leave a plain sentence sitting in the sign-in screen's own
column. It is now a dismissible banner over the top of the page — the first
thing to use PAM's new shared spot for saying something happened, manually
dismissed for now.

### Added — English and Spanish, switchable everywhere

A language icon on the sign-in screen, beside the mark, opens a panel to
choose English or Español — the mark stays centred either way. Onboarding
now asks directly, defaulting to whatever was already chosen. Signed in,
the choice is saved to the account and follows a person to their next
sign-in, on this device or another; it can also be changed from account
settings. Previously PAM shipped both language bundles but had no way to
actually switch between them at runtime.

### Changed — account settings: Sign Out is the last thing on the screen

Help now sits among the other settings, above Sign Out rather than below it.

### Changed — the sign-in slideshow's first line, and its width

New first line: "See what your city has to offer — Learning, Earning, and
Family Support." All three slides now wrap to better-balanced lines instead
of a long first line and a short, one-word second line.

## [0.15.0] — 2026-09-16 · What the app can do

### Added — example people, and a profile for each

The case manager's screen, the directory, and a new "people interested in
your program" screen for program leads now show an example roster — labelled
as an example — whenever the real list is genuinely empty, so a first look at
PAM has something to look at. Each person now opens into a profile of their
own at `/person/?id=…`; a case manager or program lead can see a member there
and the places they saved.

### Added — example notifications, and an example profile per role

The notifications screen and bell show an example notification when the real
list is empty, one per kind of account. The account screen now shows an
example provider, case manager, or member profile while previewing that
role — previously only the super admin's own, real profile ever appeared.

### Fixed — saving a place while previewing a role no longer touches your real account

A super admin who saved a place while previewing "Member" was writing a real
row under their own account, which then reappeared in every other preview.
Saving while previewing now stays local to that preview and never reaches
the database.

### Changed — Places: a fifth "Saved" chip, smaller filters, and a fixed transition glitch

"Saved" is now the fifth chip in the category filter row, carrying the
bookmark icon, so the separate "Places you saved" button below the list is
gone. The filter chips are smaller, to make room. Places and Home now line up
edge to edge and both fade in the same way — Places was the one screen not
using the app's shared page frame.

### Changed — the empty "Places you saved" screen

No Call PAM button — there is nothing there support can solve. The button
back to Places is smaller and now says "Return".

### Added — animated skeleton loaders for places and people

Places, a place's own screen, and every list of people now show a shaped,
animated placeholder while loading, instead of a spinner. Every other screen
still uses the spinner.

### Changed — the logo

Both the light and dark wordmarks are updated across the app.

### Known issue

First-load JavaScript on Home is 500.5 kB gzipped against the 500 kB §12
budget — 0.5 kB over, carried forward rather than fixed by trimming copy
further this release.

## [0.14.0] — 2026-09-16 · A bell worth trusting

### Changed — the notification bell only lights up when there is something new

It used to stay filled all the time. Now it is quiet — bordered, like the
account button beside it — until something needs you, and both icons in the
corner are bigger and drawn the same way.

### Changed — notifications say the place, or the person

"Someone reported a place: closed" is now "Example Learning Center was
reported: It is closed." A reported message now names who it was from.
Nothing about the message itself is ever shown.

### Changed — notifications are a log now, not a list of chores

Nothing in the list is clickable, and nothing needs to be marked read one at a
time. Opening the list is enough — the bell goes quiet on its own, and the
newest lines are marked "New" so you still know what changed since last time.

### Changed — the bell is on every screen, not just three of them

Before, leaving Home for Places, a place's own screen, Saved or Points lost
the way back to anything that needed attention. It didn't come back until you
went home again. Now it is wherever you are.

### Changed — a super admin's "Viewing as" choice follows them everywhere

Picking "Viewing as Program" used to work only on the home screen; opening
anything else quietly went back to showing the super admin's own screen. It
now holds everywhere, and the redundant sentence explaining the preview is
gone — the label on the switcher already says it.

## [0.13.0] — 2026-09-16 · What each place is

### Added — every place now says what it is

All 754 places carry one short sentence about what they do and who can walk in,
written from the city's own records or the place's published information. A
place's website is listed where there is one.

### Added — a screen for each place

Tapping a place opens its own screen: what it is, how to get there as the one
big button, the address, the week's opening hours, and then calling, the
website, saving, sharing and "something is wrong here" as full-width rows you
can read. It has its own link, so you can send a place to somebody.

### Added — open or closed on the card

Places show whether they are open. **These are sample opening hours for now.**
The place's screen says so, in those words, until PAM has checked the real ones.

### Added — places inside a school, or for young people only, are marked

A badge on the card and at the top of the place's screen, above the phone
number, so nobody works out the bus to a door that is not for them.

### Changed — the place card is simpler

Name, distance, open or closed, one sentence, and save. Call and Go and the
corner menu moved inside, where they are labelled. The whole card is now the
button.

### Fixed — walking directions go to the place, not to an old address

Directions were quietly using the written address instead of the place's actual
location, which sends people to the wrong building when a listing is out of
date.

## [0.12.1] — 2026-09-16 · Waiting looks like waiting

### Changed — no more "Finding places nearby..." on screens that find no places

Every screen showed that line while it worked out who was signed in — your
account, your saved places, the caseload. There is now a loading circle in the
middle of the screen instead, until the screen is ready.

## [0.12.0] — 2026-09-14 · The way out, and four ways in

### Added — your account, and sign out

A button in the corner of every screen opens your account: who PAM thinks you
are, and a way to sign out. Signing out takes you to the sign-in screen and
says so.

### Added — a code from the person who invited you

If somebody gave you a code, there is a place for it on the second step of
signing up. The code decides what kind of account you get. A code can also be
sent as a link.

### Added — the person running PAM can invite case managers

From the people screen: pick a city, make a code, read it out or text it.

### Changed — the way in stops looping

Signing in while already signed in goes home instead of asking for your phone
again. A phone that is verified but not set up is sent to finish setting up,
not to sign in again. A paused account is told so once, plainly, with the way
to sign out.

### Changed — "Send it again" waits thirty seconds, and says how long

## [0.11.0] — 2026-09-14 · A way in

### Added — signing up

PAM has a front door. Five steps: your phone, your name and the city you live
in, a screen saying what other people can see, whether you want texts, and the
points you have already earned by the time you get there. A bar across the top
says how far along you are.

The question about what kind of person you are is asked in plain words —
someone in need of support, someone willing to help, a parole officer or case
manager — and it changes what the privacy screen tells you, because those three
people need to know different things.

If PAM is not in your city yet, it says so, says where it is, and offers to text
you when it opens. Nothing is ticked for you.

### Added — your first points

Finishing setup earns 25 points and the first badge, Returned. The number counts
up on the last screen, so you land on home with something already on the board.

### Changed — signing in knows the difference between you and a stranger

A verified phone with no PAM account now goes to sign-up instead of a home
screen offering the door you just came through.

### Fixed — an account could make itself the account that sees everything

Any signed-in account could have given itself the top level of access by editing
its own record. Nothing had; it is now impossible, enforced by the database
rather than by the screens.

## [0.10.0] — 2026-09-14 · Places you keep, points you earn

### Added — saving a place actually saves it

Save on a place card writes it down. Home carries the places you kept as a row
of cards you swipe; the full list is its own screen with the same cards as the
search. Removing one is the bookmark you saved it with.

### Added — points, and what they are for

Keeping a place earns five points, counted by the database rather than the app.
The number beside your name opens a screen that shows the ladder — Returned,
Rooted, Builder, Provider, Pillar, Elder, Chief — where you are standing on it,
and the badges for each kind of help. Nothing on it compares you to anybody.

### Added — telling PAM a place is wrong

A menu in the corner of every place: share it, or report it. Reporting is four
plain reasons and a note you can skip, and it says on the screen that nobody at
the place is told who reported it.

### Added — a screen for the people running PAM

Everyone on PAM, filtered by what they are, with a switch to see the app the way
each kind of person sees it.

### Changed — the way in, and the way around

Sign-in opens with three slides saying what PAM is. Buttons wear the logo's
greens. Every screen has its way back in the same place, beside the title, and
the mark goes home. Animation throughout, on connections that can carry it.

## [0.9.0] — 2026-09-13 · A front door, and a home worth landing on

### Changed — sign-in says what PAM is before it asks for your number

Three slides above the form, one idea each: a place to look, a person to ask, a
reminder so nothing gets missed. The mark stays at the top of the screen while
the rest scrolls. Signing in is now one block — the heading, the field, the
button and the sentence about texts all sit together in the same card, with the
sentence directly under the button that hands the number over.

### Changed — home is the app, not a demo of it

The first screen after signing in was a demonstration page with sample places
and a points counter. It is now a short menu of real places to go — your people,
places near you, what is waiting, whether PAM texts you — greeting you by name
when PAM knows it, with unread counts written as words. Nothing on it is
invented: the plan and the points arrive when there are real ones to show.

## [0.8.0] — 2026-09-13 · Reminders are something you ask for

### Changed — the tick box that starts unticked

Text reminders are now a separate, deliberate yes. The sign-in screen asks, the
box starts empty, and signing in works whether or not it is ticked — nobody has
to accept texts to get help. A person who never ticks it still gets every
sign-in code they ask for and nothing else.

### Added — notifications have a screen

Reached from a bell in the case manager's header, with Back where every phone
puts it. What has happened, when, and a tick to clear it.

## [0.7.0] — 2026-09-13 · A working front door

### Added — sign-in actually signs you in

A code reaches a real phone. One screen for everybody: member, program manager,
case manager, super admin. The form sits in a card with a single button, the
mark is centred above it, and what PAM will text you is said on the screen
before you hand over a number — in both languages.

### Added — Privacy and Terms

Two pages anybody can read before they join, each with a contents list that
marks the section being read. Plain sentences, no defined terms. The privacy
page restates, word for word, the same limits the app shows a member after they
join — and a test fails if the two ever disagree.

### Fixed — an account created by the seeding script could not sign in

It failed looking the person up before it ever reached the text message, with an
error that pointed nowhere near the cause.

## [0.6.0] — 2026-09-12 · The dispatcher, and who hears about a flag

### Added — PAM can send a text message, and deliberately does not

The dispatcher is live and wakes every five minutes to send what is due. It
refuses every message today, because no human has signed off the copy — and it
writes the refusal onto the message rather than going quiet. Signing the copy is
what turns it on; nothing has to be rebuilt.

Quiet hours (21:00–07:00, per person), a member who replied STOP, and a member
with no phone number are all decided in the database rather than in the sender,
where they cannot be redeployed away. Two overlapping runs can never both send
the same reminder.

### Added — a flag reaches the people it is about

A flagged place tells every super admin and the case managers of the members who
saved it. A reported message tells every super admin and the case manager of the
member the report is about — the sender, not the person who reported it. Nobody
else is told, and the notice carries no words anybody wrote.

### Fixed — a message could be recorded as sent when it never was

The failure path in the dispatcher could itself fail, leaving a message marked
sent that nobody received. Found by running the deployed sender against the real
database rather than by a test.

## [0.5.0] — 2026-09-12 · Rec centres, evening centres, and a verified partner

### Added — 166 Parks & Recreation program sites

From the department's own list of staffed sites with programming, not the
asset register that counts basketball courts. Addresses are borrowed from the
properties layer only when the match is safe to believe: a name match once
punctuation is stripped, or a centroid within 60 metres. Seven sites get no
address rather than the wrong one.

### Added — the city's six Community Evening Resource Centers

Open in the evening as an alternative to a young person being taken into
custody, with addresses and phone numbers. The rest of the Department of Human
Services' family page is citywide programmes with no location, which PAM cannot
show yet without pretending they are somewhere.

### Added — OIC Philadelphia is verified

### Security — three more words that give somebody away

`juvenile`, `incarcerat` and `domestic violence` join the list of names that
must never appear in a text message or a push notification. A notification
naming a domestic violence service can reach the person somebody is getting away
from. Every row already in the catalogue was re-checked against the new rule.

## [0.4.0] — 2026-09-12 · Work and money, and a place to start from

### Added — OIC Philadelphia fills the Work and money category

Six programmes at 1231 N Broad St: information technology, culinary arts,
digital media and audio engineering, insurance, healthcare, and reentry support.
Curated from the organisation's own pages rather than imported, and marked as
such. It brings the first phone number and the first opening hours into the
catalogue — so the first card in PAM whose primary action is Call.

All three categories now have real places in them.

### Added — a member can change where the list is measured from

The area is a button, not a label. Tapping it opens a search over the city's ZIP
codes, populated before anything is typed; typing a street address looks it up
live against the City of Philadelphia's public property API, which needs no key.

The typed address goes to the city and nowhere else — not to PAM's server, not
into a log, not into a table. The chosen area is kept on the device. If the
address lookup is unavailable, the ZIP list still answers.

### Changed — only libraries are kept from the city facilities layer

205 recreation centres and 8 older adult centres were crowding out food,
housing, ID and legal help under Home and family — none of which PAM has yet.
The 52 libraries stay; the allow-list machinery is unchanged, so re-adding a
facility type is one row.

## [0.3.0] — 2026-09-12 · Libraries, and the Education category

### Added — 52 Free Library branches, and a second import source

`City_Facilities_pub` is imported through an allow-list, `city_facility_map`:
libraries to Education, city health centres and staffed recreation and older
adult centres to Home and family. The other ~2,900 rows in that layer —
playgrounds, statues, fuel pumps, police stations, and a detention centre — are
skipped at import, not filtered in the UI. A database invariant asserts the
detention centre never becomes a place.

Education is no longer empty: 52 libraries, free and walk-in, which is the best
answer PAM currently has for a GED, a computer, or a job application.

### Added — category filter on `/places`

All three categories are always offered, including Workforce, which has nothing
in it yet and says so rather than disappearing.

### Fixed — walking directions could send someone to the wrong building

The city's facilities feed keeps geometry current and lets address text rot: one
library imported with correct coordinates and an address five miles away. The Go
link is now built from the place's own point, so directions and the map pin
cannot disagree. The address remains the fallback and still drives the Google
listing search.

### Fixed — duplicate and mis-filed facilities

The same building appearing as two assets is imported once. A museum filed under
`Library Specialized` is not imported as a library. "Library Branch - Santore"
reads as "Santore Library".

## [0.2.0] — 2026-09-12 · The catalogue is real

### Added — a places screen backed by Supabase

`/places` lists the nearest walk-in services from the live catalogue through one
RPC, `services_near`, which runs `security invoker` so RLS decides what comes
back. Distances are formatted by `distanceLabel()`; no card claims a place is
open, because PAM still holds no hours.

Four states, all of which the screen renders: loading, results, nothing found,
and a failed query — the last two as plain-language notices with a working phone
number, never a blank list.

### Fixed — PAM was labelling 525 providers with a health subcategory

The DBHIDS import wrote `subcategory = 'health_counseling'` on every row. A
provider's own name is theirs to keep, but the subcategory is PAM's word, and
the source gives no honest basis for one. Imported rows now carry none, and a
database invariant fails the build if that changes.

### Fixed — the whole catalogue was invisible to members

Every imported row sat in the review queue, which the public-catalogue policy
hides. The queue exists to keep unapproved plain-language rewrites off a
member's screen; these rows contain no PAM-authored prose at all. They are
published, and a trigger returns any row to the queue the moment plain-language
copy is written to it.

### Security

`name_discloses_condition`, `url_encode_component` and `google_place_url` now
pin their `search_path`.

## [0.1.2] — 2026-09-12 · Cards that only say what they know

### Fixed — a distance read `1.7999999999999998 miles`

The demo interpolated a raw float into `{count} miles`. Distance is now built by
`distanceLabel()` in `@pam/config`: rounded to one decimal, pluralised from the
rounded value, locale-formatted (so Spanish gets its decimal comma), and omitted
entirely when the number is not a real measurement. Below a tenth of a mile it
says "Less than 0.1 miles" rather than inventing precision a GPS fix lacks.

### Fixed — a card claimed "Open now" about a place Google said was closed

The chip was a hard-coded boolean in the component gallery. PAM has no hours for
any imported provider — that is why the Hours action links out to Google — so no
card claims an open state until real hours exist. The sample places are now
plainly named as examples, and the gallery says it is sample data.

### Fixed — `pnpm -w test` failed in `apps/web`

Vitest was collecting the Playwright specs. Collection is now scoped to `src/`.

## [0.1.1] — 2026-09-12 · Astryx applied, Supabase live, Philadelphia seeded

### Fixed — the design system was never applied

Will flagged that the build did not look like Astryx. It did not. Astryx puts its
theme on the subtree from React, and the app was never wrapped in `<Theme>`, so
all three stylesheets loaded with 200s and every component rendered unthemed in
browser-default serif.

Three setup faults came out with it:

- `@import '…' layer(reset)` was rewritten by Next's CSS pipeline into an
  invalid `@media layer(reset)` block, dropping the entire Astryx reset.
- `@astryxdesign/core` sat in `transpilePackages`, re-running the StyleX
  transform over its source and minting class names its shipped stylesheet does
  not contain.
- theme-neutral asks for Figtree and nothing loaded it. Self-hosted now — two
  variable subsets, 30 KB, no third-party round trip on a 3G first load.

`astryx init` had been skipped entirely and the UI built against guessed APIs.
The CLI is now a dependency and its conventions are committed at
`apps/web/.claude/CLAUDE.md`.

Three browser tests assert the theme is really applied: computed typography is
not a browser default, the theme tokens resolve, and the webfont returns 200.

### Added — Supabase project `pam`

`shobqzuhicoiymtumiaz`, us-east-1, all 12 migrations applied.

The RLS was verified rather than trusted: the applied policy set was
fingerprinted against the locally-tested one and matches exactly —
`ce9636c3b77e4827368e6575742b899c`, 73 policies on both.

### Fixed — two security findings on the live project

Supabase's advisors caught a class of hole the local suite could not see.
PostgREST exposes every `public` function at `/rest/v1/rpc/<name>`, so a
`SECURITY DEFINER` helper taking a caller-supplied id can be called with someone
else's. The policies were correct; the leak was around them.

- `member_points(<any member>)` returned that member's points balance to anyone,
  signed in or not.
- `are_buddies`, `is_blocked_between` and `feature_allowed` let a caller probe
  the social graph and another user's access controls.

Each now carries a self-participation guard, and three trigger functions have a
pinned `search_path`. Eight tests assert both halves: the probe fails, and the
legitimate reader still gets their answer.

The first attempt at the fix — revoking `EXECUTE` from `anon` — broke signed-out
reads, because a policy declared `for all` is evaluated on SELECT too. Reading
`services` evaluated the provider's *write* policy and failed with "permission
denied for function": a member not signed in could not see the places that can
help. Corrected, with a regression test covering the whole anonymous read path.

### Added — Philadelphia pilot and the support line

- Philadelphia region seeded, centred on City Hall.
- Four import sources registered, all `is_active = false`: their endpoints could
  not be verified because the build environment blocks those hosts, and an
  invented URL in a source registry is worse than an absent one.
- `app_settings` table, so the support line (+1 267 309 5265) can change without
  a redeploy. Readable signed-out, admin-writable, tested both ways.

### Verified

| Check | Result |
|---|---|
| Typecheck, 5 packages | pass |
| Unit tests (`@pam/config`, `@pam/ui`) | 133 pass |
| Database suite, local | 80 checks pass |
| Live RLS fingerprint vs local | identical, 73 policies |
| Live anonymous read attack | 0 profiles, messages, invites, audit rows |
| Browser a11y + theme, 320px and iPhone SE | 18 pass |
| First-load JS | 478 kB of the 500 kB budget |


## [0.1.0] — 2026-09-12 · Phase 0: Foundation

First commit. Everything a later phase needs, and nothing a later phase owns.

### Added

**Monorepo** — pnpm workspaces: `apps/web`, `apps/native`, `packages/db`,
`packages/ui`, `packages/config`. Versions pinned to the majors §1 fixes.

**`packages/config`** — the product's rules as code:
- three fixed service categories with their subcategories (§2.5)
- SMS templates with the §9 safety rules enforced at runtime: `PAM:` prefix,
  160 characters, no emoji, no term that reveals justice involvement, and a
  required `reviewedBy` without which nothing sends
- the §4.1 transparency contract, as the single source the screen renders from
- points, levels and badges (§8), with leaderboards and rewards off
- dignity-language rules (§0) as a checker CI runs over all copy
- English and Spanish bundles, key-for-key

**`packages/db`** — 8 migrations covering the whole §4 model, every table with
RLS enabled *and* forced:
- identity, invites, caseload, facilitations, access controls, audit log
- services with a subcategory registry an admin can edit, import bookkeeping,
  geocode cache
- the plan loop: enrollments, appointments, reminders, tasks
- people: connections, chat, buddy feed, reports, points ledger, badges
- `SECURITY DEFINER` RPCs for invite create/redeem and access changes, each
  writing to `audit_log`

**`packages/ui`** — the seven §2.4 components, composed from Astryx primitives:
`BigButton`, `PlaceCard`, `PersonCard`, `StepHeader`, `PointsBadge`, `HelpBar`,
`VoiceInput`.

**`apps/web`** — Next.js 15 + React 19, static export, Astryx theme with an
explicit cascade-layer order, StyleX compiled through PostCSS, i18n provider,
PWA manifest, and a Phase 0 demo page rendering every component against real
theme and real strings.

**`apps/native`** — Capacitor 6 config wrapping the web export, with the native
speech recogniser wired to `VoiceInput`.

**CI** — three jobs, path-scoped to `pam/**`: types + unit tests + build +
bundle budget; migrations + RLS penetration suite; browser accessibility.

### Verified

| Check | Result |
|---|---|
| Typecheck, 5 packages | pass |
| Unit tests (`@pam/config`) | 113 pass |
| Unit tests (`@pam/ui`, incl. axe) | 20 pass |
| Migrations against Postgres 16 + PostGIS | 8/8 apply clean |
| RLS penetration suite | 60+ checks pass |
| Browser a11y, 320px and iPhone SE | 12 pass, no WCAG AA violations |
| First-load JS | 455 kB gzipped of the 500 kB budget |
| Web build | static export, 2 routes |

### Fixed during the build

Four defects the tests and a screenshot caught, all recorded in `DECISIONS.md`:

- **Reminders would have silently failed to send.** Spanish `appointment_24h`
  renders at 159 of 160 characters; an ordinary longer street address pushed it
  over and made `renderSms` throw. Templates now budget each variable and
  shorten at a word boundary (D-013).
- **The mic button appeared on browsers with no speech support.** A `!== null`
  check against an `undefined` return meant every unsupported browser showed a
  control that did nothing — the opposite of what §1 requires.
- **`BigButton` rendered at 35px instead of 64px.** The StyleX layer was empty:
  a custom `babelConfig` had replaced the project config without re-listing the
  StyleX plugin, so `@stylex;` resolved to nothing and every component carried
  correct class names with no rules behind them (D-011).
- **The mic button rendered the literal word "microphone".** Astryx's `icon`
  prop takes a `ReactNode`; a bare string is a valid `ReactNode`, so it
  typechecked and the tests passed on the accessible name while the page looked
  broken. Only the screenshot caught it.

### Not included

Phase 0 scope. Phases 1–7 own these: onboarding and invite redemption screens,
the map and importer, enrollment and reminders, points award paths, chat, the
provider and admin apps, and the AI features.

No Supabase project has been provisioned — see D-003.
