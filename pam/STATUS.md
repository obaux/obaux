# PAM — where the project stands

Last updated 2026-10-01. The member-facing product is real now: signing up
and signing out, invite codes for all four kinds of account, saving, points,
badges, reporting a place, and a screen for the person running PAM. Every place
now says what it is and has a screen of its own. Notifications are readable —
a place or a person's name, not just "something happened" — and follow you
around the app rather than living only on Home. A demo/dummy-data layer now
fills every people list and notification feed for a first look at PAM before
real data exists. Locale is now a real, switchable preference — a language
icon on sign-in, an onboarding step, and account settings all read and write
`profiles.preferred_language`. A place's own screen now returns to wherever it
was opened from (Home, Places, or Saved) instead of always to Places. The
header is now content-consistent across every signed-in screen — the same
compact role-preview icon, the same merged area/edit control, the same bell —
and since D-269 it no longer reloads on navigation; Home's people preview for Case
manager/Program/Super admin previews is now a scrollable stories-style strip
rather than a stacked list. Sign-in is a full-bleed photo hero — real
commissioned illustrations, sourced via Google Drive after Figma's own asset
URLs proved unreachable from this sandbox (D-135) — with the card riding up
over its bottom edge, an eased custom transition between slides that holds
each one two seconds longer (D-141), and image preloading behind a skeleton
so a slow connection doesn't jump the layout (D-142). The sign-in screen no
longer carries the STOP/rates sentence — it moved to the reminders screen,
which already had it and is where a member is actually choosing something
(D-139) — and a signed-out visitor lands straight on sign-in instead of a
splash screen first (D-146). The shared alert banner is now a solid-colour,
single-row, in-flow composition instead of Astryx's own translucent `Banner`,
fixing both a readability complaint and an overlap with the header (D-143,
D-144, D-145).

**A pending case-manager or program-lead request is now decided for
real, not just recorded**: a super admin reviews it at `/requests/`
(reached from the Everyone list, not from the notification itself — D-148),
approving creates the account immediately with the phone already on file
(D-149). A denial now texts the person too, at Will's explicit instruction to
skip the usual quiet-hours/STOP safety check for this one message and include
PAM's number (D-152) — both the approval and denial texts are signed off and
live (Will, 17 September). Approving a program lead who left their program's
details at sign-up (a new step in `/join/`, manual entry only — D-154) adds
the program straight to the catalogue (D-153). A super admin can grant any
account a demo view from the Everyone list, showing PAM's existing example
data everywhere that account looks rather than only when its own data
happens to be empty — wired into five of the screens that already had an
example-data fallback, not yet all of them (D-155). All of it — migrations
0054 through 0059 — is live on the real database (D-156). **PAM can text for
real now** (D-158): Twilio credentials are in place and proved with an actual
message sent end-to-end. Session log:
`docs/sessions/2026-09-17-everyone-list-and-program-requests.md`.

**There is now a first chat/messaging surface, staff-to-member, too**:
a case manager can message their caseload, a program admin can message
members enrolled in their program, and a member can see and reply within a
conversation staff already started — never member-to-member. `/messages/`
lists conversations plus, for staff, anyone eligible they haven't messaged
yet; `/messages/thread/` reads and sends within one. A first version of this
(17 September, same day) wrongly scoped it to member-to-member "connections"
and was corrected on Will's direction before anyone used it — see D-163,
superseding D-159/160/161. D-074's supervised-chat model still holds for
anyone *not* in a conversation (a case manager reads it only if it's
reported), and now explicitly covers the case of a case manager who *is* a
participant too — §4.1's transparency contract was widened to say so
(D-164). **A conversation partner reads a name and a role, nothing else** —
D-164's own first version handed back a whole `profiles` row, including
`last_active_at` and `phone`, to any conversation partner; replaced same day
with a column-limited function following 0043's `directory_people`
precedent (D-165), so a program admin (or anyone) never sees activity info
through this path. **"Program admins don't see activity, across the entire
app" is now a real, closed guarantee, not just a messaging-surface one**
(D-166, Will's confirmation and widening of D-165's closing note): the
older, pre-existing `profiles_select_provider_linked` policy — which let a
program admin read a member's `last_active_at` and `phone` through any
enrollment/appointment link, no conversation required — is gone, replaced
by `provider_linked_members()` (0062), the same column-limited-function
pattern. Case managers are unaffected throughout; this is provider-role-specific.
The §4.1 transparency screen was re-audited line by line, not just amended
again (D-167): it now says the program-activity guarantee plainly and
positively, and a stale, never-actually-true `canSee.chatMetadata` line
(predating all three of today's messaging sessions) was found and removed.
Who may *start* a conversation is still a client-side restraint, not a
database one — see D-163 for the gap and the migration that would close it.
**All of it is now actually verified, not just written**: `admin_visibility.test.ts`,
the test `transparency.ts` had claimed enforces this contract but which did
not exist (D-164), is built (`04_transparency_contract_test.sql`, D-168) —
and this sandbox turned out not to be permanently missing `postgis` after
all; installing it let `pnpm --filter @pam/db test` run for real against
every migration through `0062`. **221 checks pass, 0 failures.** `0060`,
`0061` and `0062` are all recorded as deployed to the live Supabase project
(`0060`'s policy was superseded by `0061` in the same deploy, the same way
it now is locally) and `get_advisors` came back clean. Deploying surfaced
real drift between this repo and the live schema — unrelated to messaging,
not caused by or fixed in that session — see the drift note under "What is
live" and D-169; `pam/CLAUDE.md` gained a "Working alongside another PAM
session" section as a direct result. Session log:
`docs/sessions/2026-09-17-deploy-and-concurrency-rules.md`.

**Both of the above were built by two concurrent PAM sessions working the
same day without knowing about each other**, which collided on the same
migration numbers (`0054`–`0056`) and the same decision numbers (D-148
through D-158) — reconciled by a merge that renumbered the messaging
session's migrations to `0060`–`0062` and its decisions to D-159–D-169,
in place, with every cross-reference updated to match (D-170). Newest
session log: `docs/sessions/2026-09-17-reconciling-a-concurrent-merge.md`.

**Messaging is previewable again, a super admin can demo-send a message, and
a caseload row now names a member's real program.** `/messages/`'s Home tile
and the screen itself had been gated on the real signed-in role only
(D-171), which meant they never appeared during any "Viewing as" preview —
inconsistent with `/admin/`, `/directory/` and `/interested/`, and flagged as
a bug (Will, 17 September). Now gated on the previewed role, matching those
three; real conversations and real "who can I message" data still only ever
run under the true, signed-in account's own permissions, never a previewed
one, and a preview's real gap is filled with non-interactive example
conversations (D-172). A super admin previewing a case manager or program
admin can also compose a message on `/person/` that visibly "arrives" on
`/messages/`'s example conversations once the preview switches to Member —
entirely client-side, sessionStorage only, never touching `messages` or
`conversations`, and explicitly not a reopening of D-171 (D-173). Home's own
greeting now reads an example name while a preview is active, reusing
`/account/`'s existing `DUMMY_SELF` substitution (D-174). Separately, a case
manager's caseload row now shows a clickable badge naming the program a
member is genuinely enrolled in (never a region-only match), opening that
program's own `/place/` screen — real data via existing RLS, no new
migration, plus a demo version on `/person/` (D-175). Session log:
`docs/sessions/2026-09-17-messaging-preview-and-demo-send.md`. One
verification gap: the Playwright a11y suite could not run in this sandbox —
`chromium_headless_shell` could not be downloaded (the agent proxy blocks
`cdn.playwright.dev`, not a missing-package problem) — so this session's UI
has not been checked against the 426-pass baseline in "What is proven"
below; a future session with a working browser download path should run it.

**The messenger is finished as a product surface (20 September, branch
`claude/pam-messenger`, D-176 through D-182).** The thread is drawn with
Astryx's Chat family, loaded only on that route; a member can start a
conversation with their own case manager or program, and staff with their
own people — and **who may message whom is a database rule now**
(`0063`: `open_direct_conversation()` is the only door, the direct insert
policies are gone, a super admin is refused there too). A message can be
reported from the thread with a fixed-list reason, and `/reports/` lists
what was reported to exactly D-074's audience — every super admin, plus
the case manager assigned to the sender or the reporter (`0065`, which
also narrows a policy that had let every case manager in every region read
every report). A new message lights the recipient's bell and the Home tile
shows an unread count; nothing about messages ever queues a text (`0064`).
**`0063`–`0065` are deployed** (Will, 20 September: merged to `main` and
applied to the live project after a `list_migrations` check; `get_advisors`
clean — `can_message()`/`notify_on_message()` are not callable by any role,
the four new RPCs by `authenticated` only).
Example conversations are one mirrored cast, and every example name — a
conversation row, a start row, "Message {name}" on `/person/` — opens the
example chat (D-183). DB suite: 272 checks pass. Session log:
`docs/sessions/2026-09-20-messenger.md`.

**21 September (branch `claude/pam-messenger-2`, D-184–D-189):** Messages
is rows, not cards; "New message" is one button that opens a picker with a
search box; a member sees "Case manager" or the program's name under a
name, staff see nothing under a member's. Reported messages moved into a
Reported section of Messages (case manager: beside Conversations; super
admin: Reported only), with an example set, and the `/reports/` screen and
Home tile are gone. Bell rows link to what they name. Places has a search
box (typo-tolerant, answered by `services_search`, `0066`) and a Reported
chip for reviewers with the decision on the card (`flagged_services`,
`0066`) — no reviewer screen for flags existed before. **`0066` is local
only — not deployed.** DB suite: 286 checks pass. Session log:
`docs/sessions/2026-09-21-messages-tidied-and-places-search.md`.

**Later the same day (branch `claude/pam-thread-layout`, D-192–D-194, A13,
A14):** the conversation screen fits a phone — the app header and a
one-row thread header (name, then a `Token` for "Case manager" / the
program's name) pinned at the top, the composer pinned at the bottom by
`ChatLayout`, only the messages scrolling; Send, mic and Report are 48px
squares (the one primary action in PAM that is not 64px — A13); and the
thread has no help link (A14 — the pinned way back leads to Messages, which
has one). `scripts/journeys.mjs` photographs it as `6b-conversation`.
Then polish from Will's phone (branch `claude/pam-messenger-polish`,
D-195–D-197): composer padding back and no ring on tap (keyboard still
rings the frame); a 48px scroll-to-bottom button in place of Astryx's
overflowing default; the example-thread sentence gone; the picker sheet
clear of its handle; the Messages title is the section switcher for a
case manager (no more control row); Home's saved cards spaced.
`journeys.mjs` also photographs `6a-messages`. Playwright: 480.
Then the people strip's ring became real (branch
`claude/pam-people-rings`, D-198, D-199): a real case manager or program
admin sees their own people on Home, lit and in front when there is an
unread message from them or a place they saved since the viewer last
looked; the transparency contract gained one line. DB suite: 302 checks.
Playwright: 495. **Merged to `main` the same day (Will): `0067` deployed
live, wording approved as proposed, and a matching stale line on the long
privacy page ("and that a chat exists," missed by D-167's cleanup of the
short screen) removed.** Then a fourth round of phone touchups (branch
`claude/pam-messenger-touchups`, A15, D-200–D-203): Messages loses its
help bar too — a distinct exception from the thread's, its own SOP
paragraph — reachable in one tap via the header mark to Home; the thread's
dead strip below the composer is gone (`ThreadFrame` is `position: fixed;
inset: 0` now, clearing the real safe-area inset instead of the 72px
sized for a bar this screen never draws); the send icon is sized to match
the mic icon (Astryx has no separate weight prop — checked directly); and
the message list runs `density="compact"`, which tightens the row gap and
widens the bubbles at once. Playwright: 507.

**1 October (branch `claude/pam-storybook`, D-208, D-209): Storybook is the
review surface now.** Every `@pam/ui` component (152 stories), every screen
as each role that reaches it (43 journeys, real screens against a pretend
Supabase that never touches the live project), and the member dock
(`TabBar`, new — the five tabs and Help, shaped there and not yet mounted in
the app). Published to Chromatic on every push once Will adds
`CHROMATIC_PROJECT_TOKEN`. What ships is still the branch, merged as usual —
nothing is exported from Storybook. 205 stories render with no page errors.
Session log: `docs/sessions/2026-10-01-storybook.md`.

**Later the same day (D-210): the redesign starts, in Storybook.** From
Will's reference screenshots: the page is white and every card has a soft
shadow (in the theme, so it is already true of every screen); five tabs at
the bottom — Explore, Saved, Trips, Messages, Profile — with Help moving to
each screen's header; Profile, Connections and an empty Trips page built as
views under `Redesign/*`. Not yet routes. 507 Playwright tests pass on the
white page; 216 stories render clean.

**Then (D-211): the app is clickable in Storybook.** `Prototype/*` runs the
real screens for each kind of account behind an in-story router — tap a
card, a tab, Back, and the next screen appears with the right `?id=`, on the
pretend database. `Prototype/Redesign — member` walks the new bottom bar
(Profile → Connections → Explore → a place → Trips → Messages → a
conversation and back); `Prototype/Today — *` walks the app as it ships, for
member, case manager, program and super admin, and signed out.

**Then (D-212): Explore, and Home for staff — and no more 404s.** Every
journey now opens inside the prototype's router, and any other story's link
is cancelled rather than followed, so nothing in Storybook 404s. Explore
(the member's home) has the search bar first — suggestions by name or
address, a clear button — category chips, and every state drawn (loading,
can't connect, nothing matches, empty category). A case manager's and a
program's first tab is Home: their people under the same search bar. Walk
them in `Prototype/Redesign — member / case manager / program`; each state
is under `Redesign/Explore` and `Redesign/Staff home`. Still Storybook
only: not routed in the app.

**Then (D-213): the rest of the member app, on two templates.** Tab screens
(Profile, Messages, Saved) share the large shrinking title; every screen you
tap into shares the nested template (round back, large title) — Legal,
Language, Get help, What others can see, Connections, Notifications, a
place, the policies, a conversation and its ⋯ page. Profile lost Account
(Language and Legal are rows now); Get help is a list of kinds of help; Saved
is a 2×2 grid with Edit; Trips is a map with a three-height drawer; Messages
has search and plain rows; Connections are photo cards with a profile.
Notifications, a place, the policies, the conversation and Get help changed
**in the app too** (they are real routes); Legal, Language, What others can
see, the help pages, Connections and the thread's Options/Report are new real
routes. 507 Playwright tests pass on a fresh build; 263 stories render clean.
The Google Maps browser key is set in Vercel (`NEXT_PUBLIC_GOOGLE_MAPS_KEY`,
Production/Preview/Development, 2 October) and Trips is a real route
(`/trips/`) so the map can be seen on a deployment; if Google refuses the key
the drawn preview shows instead. Storybook keeps the drawn preview. Needs a
human: the key's website restriction must list each domain PAM is served
from, and real staff photos in place of the
placeholders.

**2 October (D-216, D-217): one design, one folder per role.** Storybook
no longer shows the old design anywhere. The sidebar is four folders —
`Member app`, `Case manager`, `Program lead`, `Super admin` — each with a
clickable `Prototype`, `Screens` (one story per screen that role reaches)
and, where a screen has states worth seeing, `States`; then `Components`.
The old `Journeys/*`, `Redesign/*`, `Shell/Member app` and the "Today"
prototypes are gone. Every screen left on the old frame moved onto the
nested template **in the app too**: Report a place, Points, a member's page,
Invite someone (`/admin/`), Everyone, Staff requests, Interested, Text
reminders, Sign in's code step, and the sign-up step header. Help on those
screens is the round button in the top bar (`HelpButton`), not the old Help
bar. Profile is now a session-aware screen (`ProfileScreen`): staff see no
points/trips/connections, and get their tools as rows (case manager: Invite
someone; super admin: Everyone, Staff requests, and **See the app as** — the
role preview, a new route `/view-as/`). In the prototype `/interested/`
opens Home. The tab screens themselves (Explore, Saved, Trips, Messages,
Profile) are still Storybook-only — not yet routed in the app.

**2 October, later (D-218): an app per staff role.** Case managers: Home
(caseload, a star per person, Invite someone floating above the bar), Saved
(People | Programs), Messages, Profile. Program leads: Home (a Day / Week /
Month schedule with search by name or time), Program (their listing, Edit),
Messages, Profile. `/invite/` (two rows, a member or a program), `/programs/`
(All programs, from Profile) and `/programs/new/` (Add a program) are new
routes. Example data: starred people (session only), appointments, the
example program; Add a program and Program edits store nothing yet (the RLS
already allows both — wiring is a follow-up). Will answered both (D-219): program
leads may create invites — migration 0070, **live** — and starred people
stay a session-only demo.

**2 to 3 October (D-220 to D-228): polish from Will's screenshots.** Every
search, including the new-message sheet, is the same pill. A place has round
quick actions with small labels. Saved tiles show their full shadow. Each
change is in DECISIONS. A case manager's member page (D-231) has the profile
card, Message (with a count) and Connect to… (`/person/connect/`, an example
only, nothing stored). **Transparency changed (D-242):** members are now told
a program they joined sees the last day they used PAM; the database does not
expose it to programs yet (a follow-up migration needs Will's go-ahead), so it
shows for example people only. Members should be told before it is real.
Each role's Storybook Prototype now starts at Sign in and walks through that
role's whole onboarding to Home (D-249; the join screen has a Storybook-only
`preview`). Privacy and Terms opened from Sign in or joining go Back there
(D-250).
The code step is six paste-friendly boxes, joining uses the nested template
with "Step N of M", and Privacy and Terms are pinned to the foot of the way in
(D-251).
Each role's Prototype now only signs in (number, code, Home); account
creation is the separate Onboarding stories. Buttons are full pills
everywhere, through Astryx's `--_button-radius` (D-253).
Invites are links to Sign in (`/signin/?invite=&as=`, D-254); no migration.
Telling someone their link has expired before they enter their phone would
need one (a signed-out invite-state lookup) — Will's call.
Saved's Edit holds removals until Done and asks before leaving or unstarring
(D-255). Staff get text alerts rather than visit reminders; programs choose
per kind at `/alerts/`, kept on the phone until a column exists, and no SMS
template for them is written or reviewed yet (D-256).
A super admin's Home is the staff requests (D-257).
Invites are a link again, with no phone asked for, and a "You're invited"
preview picture when pasted into a text. Links last 30 days. An expired link
asks for an email address and a fresh link is queued for it, with no approval.
The super admin has an Invited people log (Active / Link open / Link expired).
Migrations **0071 and 0072 are live** (Will, 4 October; D-264). The invite
email's words are approved, but **nothing sends it yet**: it waits in
`invite_emails` for an email provider, which is on the before-launch list
(`docs/before-launch.md`).
The whole app is mapped in Figma, "PAM — User flows"
(https://www.figma.com/design/DtlJg9Klx5BRfHbXBhkg98), generated from
`docs/user-flows/flows.mjs` and kept current with every screen change (D-264).
A member's Explore has a centred search launcher, smaller chips and a "Your
next visit" card, and no bell or Help (D-265). Sign in's card sits flat under
the slides, and the code step is drawn in to match (D-266).
Moving between screens no longer reloads the app (`ClientNav`). Each move
has a direction: forward slides in, back slides out, tabs cross-fade, and a
tapped card grows into its screen. Sections of a screen arrive 30ms apart.
All of it uses View Transitions and CSS, and none of it runs under reduced
motion, Data Saver or 2G (D-269).
Programs have policies for participants with a verified tick (D-261), on
example data until tables, file storage and a transparency line are agreed.
Members can now read a program's policies from the foot of its page, and sign
them: the first Sign opens a half sheet to draw (or type) a signature, and
each policy after that is one tap. Trips show "Signatures needed" or
"Policies signed", and a just-booked trip offers Sign policies (D-270). A place with a visit
booked shows the policies under its name, orange to sign or green when done,
and a corner × clears a signature to sign again (D-271). Connections cards are
the whole profile: a message button, the program as a link, and who connected
the member; the separate profile page is gone (D-272). A place opened from a trip shows the visit
(green, day and time) instead of "Plan a trip" (D-273). Profile's member
tile is the award level (D-274). Choosing the area is a drawer with search,
current location and Done (D-275). A conversation with a program shows the booked
visit, opening the place and back (D-276). Back goes through history to
wherever the member came from, with the fixed target only for a cold link
(D-277). Signing keeps its button pinned at the bottom, and Done (top
right) leaves the whole flow (D-279). Points is a journey screen: hero with progress
to the next rung, ways to earn, compact ladder, badge medals, confetti on a
new level (D-278). A place opened from a trip leads with a green "Your next visit"
card whose "Change appointment" moves the visit and returns, with address and hours
before About; Storybook's example places now share the example set's ids, so a saved
one shows saved from a trip too (D-281). Saving the new time celebrates it
(confetti, the new day and time) and goes home after 5 seconds or on Go home (D-282). A 96px eased fade sits above the tab bar so lists soften into it, with room for the last card to scroll clear (D-283, D-284); a strip resting on the bar
draws its own fade above it (D-285). Since D-403 the bar is the same on every tab: no
top line, the fade on every tab, Trips included (its drawer sits above the bar and
draws the same fade at the foot of its list, `edgeFade.inScroll`), and a switch neither
cross-fades the bar nor fades a tab's colour. The tab bar exists only in
Storybook's prototype: the live app has no bottom bar until the member shell is built.
The award tile has a "Your badge" ribbon (D-286). Place cards lead with an illustrated
category tile (`CategoryArt`), a top-aligned save, and a quieter open line (D-287). Category chips glow behind
their icons (D-288). The docked Trips drawer is 100px with its list hidden; unread dots on
the tab bar and the bell use `pam.brandPink`, the selected tab's pink (D-289). The half stop is 50% of the height + 48px (D-290). A place's quick actions are
`MenuList` rows (directions, message, call, website), and directions carry Google's
place ID when known (D-291). Saved's tiles are white with a glowing category icon, and
show a visit's day and time when one is booked, opening the visit view (D-292). `GlowIcon` (sm/md/lg) is the single, softer glow; trip
cards and the next-visit card use `CategoryGlow` on white tiles (D-293). Directions set no
travel mode (D-294, SOP A17); MenuList descriptions are 14px. Every badge, every rung and
Profile's two tiles have pictures from one art kit (`art/kit.tsx`, `BadgeArt`,
`ConnectionsArt`), and a unit test keeps badges and pictures in step (D-295). CI's unit-test
job was red from D-287 to D-293 (a PlaceCard test) and is fixed with D-295. Saved's visit tag is a small white chip in the corner (D-296). Category colour is flat
everywhere: `ToneDot` (half-circle pair) on chips, `ToneGround` (pale fill + shards) on
Saved, trip cards and the next-visit tile; `GlowIcon` is deleted (D-297). A print grain (`Grain`, 30%, D-299) sits on every ArtFrame and
ToneGround; ToneDot is darker on the left (D-298) and sits 11px from the chip's top and left (D-300). Home and family's picture is the home with a heart on
its door (D-301, D-302); trip icons are baked in with a doubled overlay (`ToneBakedIcon`, D-302). Saved's chip is
12px in from the corner; a member's example trips are two (no pantry visit); Trips map pins
are placed in pixels between the note and the half drawer (D-303). Nine example places,
three per category; three saved, two with visits (D-304). Place profile vs Visit profile
is one story with controls; `VisitTag` is the one visit chip (Saved, Explore); a place's
message row becomes "New message" with a pink dot when its program wrote (D-305); its
preview is one line, and Call shows the number (D-306). Points: badges in a card; the
example member has earned Scholar, shown on the hero card too (D-307). Steward is no longer a badge (D-308). Place: hours as a row (today) with the week in a
drawer, Plan a trip in a fixed footer, "About program" (D-309). Sign in footer links spaced (D-310); small language dial (D-311);
Program tab lists policies with the rows and says "Contact phone number" (D-312, D-314). Sign up per step per role in Storybook (D-319). Case managers invite case managers
(0073, deployed 7 October); super admin invites from Profile and Invited people (D-315). Program Home range is a
dropdown beside the title (D-320). Program Home check-ins (session-kept) with burst and undo, signature
badge, and "Book a visit for a member" from the + (D-316). "Pam", not "PAM", in every
user-visible string; texts say "Pam:" too (D-321). Book a visit: booked / wrote / snippet rows,
Add a person, the member arrives on "Your visit is booked" (D-322). Program Home head
simplified (D-323). Member profile (program view): Policies signed row and page with
a finish-signing alert; one SignedMark (D-324). Member stories in Created / Invited by program / Invited by case
manager (D-325). Invite codes stay "PAM-". A screen's one action can be the
page's `footer` (sticky, with the page fading out above it); a place's Plan a
trip is, and Policies to sign is a quick-action row (D-326). Services (D-313):
example services per place with their own phone, website and policies, a lead's
editor on the Program tab (session-kept), service names at sign-up, a member's
service picker on the place page (grey cards, Main/Service address, hours
per service), drop-in programs, and booking in two steps from a place.
Program onboarding as a simpler step by step is open (Will). The design system
is ready for Claude Design (D-328): the theme, Figtree and `tokens.css` live in
`@pam/ui` (not apps/web), `PamProvider` mounts a component anywhere,
`pnpm --filter @pam/ui build` writes `dist/` (CI builds it), every component has
a `Components/<Category>/<Component>` story, and usage rules are MDX under
`Foundations/`. A member's program page leads with "Bring a friend"
(`/place/friend/`, a link with the program and no code); sign in does not
read that program yet (D-329). The friend screen is "Go together"; a friend who
joins is worth 150 points (SOP amendment A18), listed first under Ways to
earn, not yet awarded by the database (D-330). `ProgramVisitCard` (visit / invite) is the
program card on Check and Go together; a booked place shows its service in the
visit card, with no picker (D-332). Bring a friend is a folded section on the new
"Your trip is booked" step (no page, Copy, then the share sheet — D-344); walk-ins plan a trip from their meeting days; the signature sheet
holds still while drawing — tested in Chromium touch emulation, not yet on iOS
Safari, an Android WebView or the Capacitor build (D-333). A footer is pinned to the bottom of the screen on
every page that has one; the booked screen closes with an × and lists policies
to sign (D-334). Staff photos (example only) on a booked place and in
Messages (D-335). Booked: how soon, Policies to sign and Bring a friend (a
drawer) as rows; signing from a trip ends on × into Trips; Trips reads each
visit's own service policies; floating rows have hairlines top and bottom
(D-336). The booked screen is the green visit card with Change; Back from
its policies returns to it; Bring a friend copies on tap, under Will's banner
(WebP, 21/35 KB); every place picture is its category illustration, the
tinted grounds are gone except the chips (D-337). Drawers have no border (`sheet.panel` on every BottomSheet); the friend banner runs edge to edge over the handle strip (D-338). VisitCard spacing opened up; "Link copied" spans field and Copy (D-339). Friend drawer: 24px under the banner and above the link (D-340). VisitCard: countdown plain, Change link even in its corner (D-341). 20px above and below it (D-342). Chevron after it; eyebrow in black (D-343). Bring a friend shares through the phone's share sheet where there is one; the Android app shares through `@capacitor/share` (D-350; not yet run on a device). **Pam stays a web app for now (D-351):** no native build; device QA means phone browsers. Staff photos: camera button on Profile, `staff-photos` bucket (0074, live) (D-345). 0073 live. 0068/0069 carried over as 0075/0076 (reconciled with 0072, DB suite green) — **written, not deployed: Will applies them, approving their drop statements** (D-346). Note:
the web app's vitest tests are not run in CI. How points should be awarded — two rules live
(save a place, finish setup), the rest to build, with order and open
questions — is specified in `docs/points-awarding.md`. The
signatures are example data too, kept only for the visit (session storage).
From a request the super admin can open the requested program and text the
requester. In the redesign they can also message staff (never members),
backed by 0072, now live (D-262).

**9 October (D-412, D-413): two English promises that contradicted other
copy, found by translators — both now say what is true.** *Points:* Will
confirmed case managers see awards, badges and points, so `points.intro` says
the person who invited you can see them and programs and other members cannot.
*Messages:* "Messages are never turned off" was true only of the per-feature
switch (0031, A6); a **limited** account cannot send or start a message
(`is_active_account()` on `messages_insert_sender` and
`open_direct_conversation`, live) and a **suspended** one cannot sign in. Will
chose to change the promise, not the code: `terms.s.limits.p2` now says so
(A6 clarified). The member's transparency line also names badges. Members
are told in the privacy policy, which has a new section for it (D-414: any
case manager with the person in their list may limit them; Will wants how
they do it enriched later). `terms.s.limits.p3` is kept
for a limited account (D-427: the notice on Messages and in a conversation, and a
refused send says why). The pt-BR, zh-CN, zh-HK, ru and ar bundles are on
`claude/gallant-clarke-0dhizj`, not here. See "What needs a human" row 32.

**Later that day (D-415): a case manager reaches only the people assigned to
them.** Will meant "in their list" as the caseload, not the city, so
`admin_covers()` loses its same-city arm (migration `0082`, SOP amendment
A22): profile, goals, enrollments, appointments, connections, points, badges,
and limiting or pausing someone are the caseload alone. The member copy now
says "the person who invited you, or a staff member responsible for guiding
you" wherever it describes the case manager (en + es). DB suite **440 checks,
0 failures** (was 420; the new `17_assigned_only_test.sql` fails without
0082). **`0082` is applied to the live project** (Will, 9 October, D-420; the
branch merged to `main` the same day): the live project has one super admin,
two members, no case managers and no assignments, so it changed nothing for
anyone today. A member with no assigned case manager is read by none, and
there is no screen to assign one (Backlog).

**And (D-416, D-417): the long, important screens are easier to read.**
"Your guide" is the short word for the person who invited you or a staff member
responsible for guiding you, defined once in a small card (icon beside the
title) on the sign-up step, Profile › What others can see and the privacy page.
Will chose the icon look after seeing both (D-417): **Profile › What others can
see** is now the guide, the short version, a link to the full privacy policy,
then Request a copy / Delete my account with no "Your data" heading. **The
sign-up step keeps the full list**, because SOP §4.1 requires that required
step to list every line. **Privacy and terms** are one flat design — Explore's
white chips for the sections, an icon beside each heading, no cards — with one
copy icon top right that copies the whole page and shows a "Copied" tooltip,
the icon swapped for a tick, for 5 seconds. The Listen button was skipped. Still
open: his read of the short-version wording, the same strings in the other
languages, and the long phrase in Help, the report screens and two notices,
which can switch to "your guide".

This is the handover document: what exists, what is proven, what is live, and
what the next person needs to know before touching anything.

**It is the only document that is always current.** `docs/sessions/` is the
history — one immutable log per build session, saying what changed and what the
session got wrong. `DECISIONS.md` is the reasoning behind each choice.
`CHANGELOG.md` is the user-visible record.

Start a session by reading this file and the newest session log. End one by
writing a new session log and updating this file. `CLAUDE.md` states the rule.

---

## In one paragraph

PAM connects people to people at services and facilities — for mentorship,
earning and learning. It serves returning citizens, the providers who run
programs, and the case managers who invite them in and introduce them to each
other. **Phase 0 (Foundation) is complete.** The data model, its access rules,
the design system, the shared product rules, and CI all exist and are verified.
No member-facing flow is built yet: that is Phase 1.

Every decision was measured against one question, from the SOP: *can a person
who hasn't used a phone in 8 years enroll in a program, get to it, and keep
going — without help?*

---

## What is live

**Supabase project `pam`** — `shobqzuhicoiymtumiaz`, us-east-1 (closest region to
Philadelphia). The database is real and reachable. **The web app is deployed
on Vercel** (project `web`, auto-deploys from `main`):
https://web-will-3199s-projects.vercel.app — production is `main` at `c0a6334`
as of 20 September.

**The "six unknown live migrations" this repo could not explain are now
explained: they were the other concurrent PAM session's own committed
work**, merged into this branch as `0054`–`0059` (`staff_review`,
`staff_denied_sms`, `program_submission`, `demo_view`,
`lock_notify_on_staff_request`, `staff_requests_indexes`) — see D-170 for
the merge that reconciled two independently-numbered sessions' migrations
and decisions in one pass. This session's own three messaging-privacy
migrations were renamed `0060`–`0062` to make room and are also deployed
and verified via `get_advisors` (clean); the live project still records
them under their original deploy-time names (`0054_conversation_partner_visibility`
etc. — a cosmetic mismatch, not a functional one, since Supabase tracks
migrations by timestamp, not the filename's number prefix — see D-169's
addendum).

**The `0052` gap is closed.** `0052_saved_places_say_what_they_are.sql` sat
committed but undeployed from 16 to 20 September — a genuine local-vs-live
gap, not a numbering collision. Applied on 20 September together with
`0063`–`0065`, after a `list_migrations` check found no new live-only drift.
As of that check, every file in `packages/db/migrations/` is on the live
project (this session's `0060`–`0062` under their deploy-time names — D-169
addendum). Keep running the check before any deploy; it is what found the
gap in the first place.

**The text-message dispatcher is live, running, and sending for real (17
September).** The `dispatch-sms` function is deployed and a database schedule
calls it every five minutes. Twilio credentials are in place and proved with a
real end-to-end test: a signed-off template queued to Will's own number came
back `status: sent`, no failure reason, picked up by the very next scheduled
run. Quiet hours, the STOP list and atomic claiming are enforced in the
database, not in the function. All fifteen templates in the catalogue were then
("sixteen" was a miscount, corrected 10 October; since then four Text alerts texts
were added and signed, so the catalogue has nineteen, and the deployed dispatcher
carries the fifteen until it is redeployed) signed off — the original thirteen (13 September) plus the two built this
week, `staff_request_approved` and `staff_request_denied` (17 September) —
so nothing is currently held back at the `reviewedBy` gate; the next template
anyone adds still starts blank and stays refused until it is read. See
`docs/sms-setup.md`.

**Sign-in and sign-up work, and sign-out exists.** Supabase is pointed at
Twilio, and a real code reached a real phone on 13 September; a real member
signed themselves up on the 14th. One door for every role: what you see after
the code comes from the account, never from which link you followed. Every
signed-in screen carries the same button to `/account/`, which is the way out.

**How each kind of account gets in** (0049): a member signs up alone or with a
case manager's code; a program lead asks at sign-up and gets a code; a case
manager gets a code only a super admin can make, from the people screen, into a
named city; a super admin is made by the seeding script and nothing else.

**The Twilio account is still in trial.** Only numbers verified by hand in the
Twilio console receive a code. A tester with an unverified number sees "we
sent you a code" and nothing arrives — which is what the logs show happened on
the 14th.

**The carrier campaign was APPROVED on 13 September.** Two rejections got there:
the first submission declared no embedded links, which nine of the thirteen
messages carry; the second was rejected for implied consent (30925), which was
right — PAM now asks on a screen of its own, with nothing pre-selected, and the
agreement is the button's own words (D-085, D-086).

~~What was left before a real text sends~~ — **done, 17 September**: Twilio
credentials are in the `dispatch-sms` Edge Function secrets (the Messaging
Service SID, not a bare from-number, so the A2P approval carries through) and
proved with a real message. What is still open, neither of them a blocker on
sending in general:

1. Reminder-type texts specifically are opt-in per account (`sms_enabled =
   false` by default, 0042) — nothing about Twilio being configured changes
   that. Somebody still has to say yes on the reminders screen before PAM
   texts them one, including Will's own account.
2. The HELP auto-reply on the Messaging Service, matching what was filed with
   the carrier, is not yet confirmed set up.

The account is still in trial: only numbers verified by hand in the Twilio
console can receive a text. Setup and the known traps are in
`docs/sms-setup.md`; what was filed is in `docs/sms-campaign-samples.md`.

**The first admin exists** — Will, Philadelphia, created 12 September and proven
by generating a live invite code (`9T3YTVMT`, valid 30 days).

To create further admins from a machine with the service role key:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  pnpm --filter @pam/db seed:admin -- \
    --phone +1XXXXXXXXXX --name <first name> --region Philadelphia
```

**Pilot city: Philadelphia.** Region seeded, centred on City Hall.

---

## What is built

| Package | What it holds | State |
|---|---|---|
| `packages/config` | The product's rules as code: the three fixed categories and their subcategories, SMS templates with the §9 safety gates, the §4.1 transparency contract, points/levels/badges, the §0 dignity-language checks, en + es bundles | Complete for Phase 0 |
| `packages/db` | 13 migrations: full §4 model, RLS on every table, the admin layer, server-side RPCs, `app_settings`, the Philadelphia seed | Complete and deployed |
| `packages/ui` | The §2.4 components — `BigButton`, `PlaceCard`, `PersonCard`, `StepHeader`, `PointsBadge`, `HelpBar`, `VoiceInput` — plus the shared shell the screens stopped retyping: `Page`, `AppHeader`, `TextField`, `TextLink`, `Notice`, `NotificationBell`, `NotificationList`, `NavTile`, `OnboardingSlides`, `Loading`, the icon set and PAM's own tokens | Complete for Phase 0 |
| `apps/web` | Next.js 15 + React 19, static export, Astryx themed and working, i18n, PWA manifest, Supabase client, runtime support-phone lookup, staff-to-member messaging (`/messages/`, `/messages/thread/`) | Foundation, plus the first chat surface — see gaps |
| `apps/native` | Capacitor 6 config wrapping the web export; native speech recogniser wired to `VoiceInput` | Config only, never built for a device |

---

## What is proven, and how

Numbers here are from the last run, not aspirations.

| Check | Result | What it actually proves |
|---|---|---|
| Typecheck | 5/5 packages | — |
| `@pam/config` tests | **723 pass** (9 October: the Arabic isolates, 24 — every template in every left-to-right language is byte-for-byte what it was, every Arabic one wraps each text value once, and no text, email or bundle carries one (D-435); all seven languages key-for-key with plural forms, the translation ledger and pseudo-language, texts and the invite email in every language, number collisions, the translation core and handler, the privacy-switch tie; was 231 on 21 September) | No SMS can send unreviewed *in its language*, over 160 chars (70 in Chinese, Russian, Arabic), a draft in a language nobody signed, a translation older than its English, with emoji, or with a term that reveals justice involvement. Locales are key-for-key. The transparency screen matches its contract, including the new `new_save_without_the_place` line (D-199). |
| `@pam/ui` tests | **84 pass** (9 October, with the share/copy scrub and the area chip's value box, D-435; 65 on 21 September) | Every component is axe-clean. `PlaceCard` offers exactly three actions in a fixed order. Reduced motion is respected. The mic hides when unsupported. |
| Database suite | **546 checks pass** (9 October, `0001`–`0085` with `0079`–`0081`, through `20_language_without_a_profile_test.sql`; 302 on 21 September, `0001`–`0067`) | See below. Grew from 286 with `07_people_activity_test.sql` (D-199): 16 checks that `people_activity()` returns a time and nothing else, only for `can_message()`'s own relationship, and that a case manager or a program admin still cannot read `saved_places` directly. `0067` is now live. |
| Live RLS fingerprint | **not re-verified since `0060`–`0062` deployed** | This row's last "identical to local" claim predates today. `0060`–`0062` (deployed under their original names, `0054`–`0056`) are now live and `get_advisors` came back clean, but the fingerprint comparison itself hasn't been re-run against the combined migration set — this repo and the other concurrent session's are now merged, but neither has been re-fingerprinted since (see D-169/D-170, and the drift note under "What is live") |
| Live anonymous attack | 0 rows leaked | A signed-out caller reads no profiles, messages, invites or audit rows on the real database, while still reaching the support number and the public catalogue |
| Browser a11y + theme (Playwright, full suite) | **861 pass, 0 fail** (10 October, `main` with `claude/gallant-clarke-0dhizj` (PR #30) and `claude/amazing-archimedes-qvgnt2` (D-435) merged, on a fresh `pnpm build`, three projects). With the languages branch alone, **861 pass, 0 fail** (10 October, `9b8b8d8`, 9.2 minutes). Before that **834 pass** (9 October, `claude/affectionate-goldberg-tvu4sz` = `main` + D-429 and D-432: a refused New message says the account is limited, and the limited notice is the calm card; fresh `pnpm build`, 8.6 minutes). Before that **828 pass** (9 October, `claude/gallant-clarke-0dhizj` = `main` at D-420 + `claude/pam-storybook` through D-411 + D-422–D-423, re-run on the tree merged with `main` and with `claude/affectionate-goldberg-tvu4sz` (D-427: 816 + its 12 for the limited-account notice), on a fresh `pnpm build`, three projects, 9 minutes at 2 workers; `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium`); includes `languages.spec.ts` — sign-in, About, Privacy and Terms in all seven languages with no word off the screen. Earlier: 639 (9 October, through D-402), 507 (21 September, `claude/pam-messenger-touchups`) | No WCAG AA violations at 320px or iPhone SE. Every control clears 48px. No horizontal scroll. The Astryx theme really resolves. Runs in dark mode as well as light. Includes the people strip (D-198) and the fourth round of phone touchups (A15, D-200–D-203): no help link on Messages, the thread frame fills the true viewport, the send icon matches the mic icon, and message rows measure the compact density directly rather than by on-screen distance. |
| First-load JS | **543.3 kB** of **600 kB** — within budget, 56.7 kB to spare (10 October, `main` with the languages branch and the Arabic isolates merged; 542.7 kB with the languages branch alone). Before that **545.1 kB** (9 October, D-435, on `main` at `8dee5d4` plus the Arabic isolates; 544.6 kB before it — about half a kilobyte; the earlier build was `main` and the other session's branch merged in; only English is in it, the other six languages load when picked — D-413). Earlier: 505.3 kB, 94.7 kB to spare (ceiling raised from 500 on 21 September: A12, D-191) | §12 budget, measured gzipped on what `index.html` actually loads; `/signin` and `/gallery` carry `OnboardingSlides`' `framer-motion` weight on their own subpath export (D-140), every other route unaffected. Grew from 500.7 kB across the messaging sessions alone (1.0 kB, D-162), entirely new locale strings — irreducible without lazy-loading translations per route, which is out of scope. Grew a further 2.3 kB when merged with the other concurrent session's own additions (D-170). Grew 0.3 kB on the 17th (D-174), **and 1.0 kB on 20 September** (the messenger's locale strings and `Badge` in `NavTile`; `useConversations` and the whole Chat family were kept out of Home's first load — D-181, D-182) — the messaging-preview/demo-send/program-badge session's other additions (D-172, D-173, D-175) all landed off Home's own bundle and did not move this number, though D-175's `Token` component does add real weight to `/admin/`, `/person/` and `/directory/` individually (~4 kB each), not tracked by this check |
| Arabic isolates in places nobody sees (`audit:fit`, `ar`) | **0** across 470 stories (was 240: 143 `aria-label`, 92 hidden text, 4 `alt`, 1 tooltip), D-435 | Every story is opened in Arabic at 320px and its `aria-*`, `alt` and visually-hidden text searched for U+2068/U+2069. English has none, so any hit fails `pam-fit`. It cannot see a call site no story reaches, or how a screen reader speaks anything. |
| Arabic layout defects, before and after D-435 (`audit:fit`, `ar`, same detector) | **153 and 153** | Identical but for the area chip's long address: its `spill` (text 4px past its button) is gone and its designed ellipsis now sits on the address's own box. 74 stories show a value on screen; 58 were pixel-identical, 5 were timing noise, 11 differ, 7 of them in the order words are drawn in, each for the better. |

### The database suite is the one that matters

`pnpm --filter @pam/db test` stands up a throwaway Postgres, applies a shim for
the parts of Supabase the migrations need, runs every migration, then attacks the
result with one test user per role. It proves:

- members reach only their own rows
- `is_public = false` hides a member from all discovery; blocks are mutual
- an admin reaches their caseload and **no one else** (0082; until then,
  also their city — `17_assigned_only_test.sql`)
- **an admin cannot read message bodies or buddy-feed posts** — the promise
  members are shown at onboarding
- providers reach a member only through an enrollment, appointment or connection
- `points_ledger` and `audit_log` reject UPDATE and DELETE *even from
  `service_role`*, which bypasses RLS
- a disabled feature is refused server-side, not merely hidden
- invite codes carry no ambiguous glyphs, are admin-only, region-scoped,
  single-use, and honour a phone prefill
- a signed-out visitor can still reach the support number and the catalogue

---

## What is deliberately not done

Phase 0 owns foundations. These are Phase 1–7 and their absence is not an
oversight:

- **Arabic isolates (D-435): not done on purpose.** Numbers are not isolated (they
  cannot be reordered). The inviter's name in an Arabic *email* has the same
  problem for a multi-word English name; the fix there is an HTML `<bdi>`, not an
  invisible character, and Arabic email is not signed off or sent. Other one-line
  rows (conversation rows, trip cards) still cut at the left edge, which in Arabic
  is the end of the sentence; only the area chip gives its value a box.

- **No map, no enrollment.** Sign-up exists — `/join/`, five steps — and an
  invite code is typed into its second step, or arrives as `/join/?code=`.
- **Chat is a messenger now (20 September, D-176–D-182).** Both directions
  within a real relationship, enforced by `0063`; report from the thread;
  `/reports/` for review; unread on the tile and the bell. What is still
  not built: resolving a report (columns exist, no function), group or
  broadcast, member ↔ member (by design, forever), SMS for messages (by
  design). The paragraph below is the 17th's history of how it got here.
- **Chat exists now, staff-to-member.** `/messages/` and `/messages/thread/`
  (17 September, corrected same day — D-163) work against a case manager's
  real caseload (`admin_covers()`, the same relationship `/admin/` already
  uses) and a program admin's real enrolled members (`provider_linked_to()`),
  and against real conversations either has already started with a member. A
  member sees and replies but never starts one. Scoping who may *start* a
  conversation is a client-side choice today, not a database-enforced one —
  see D-163 for exactly what a follow-up migration should check. A member
  reading a staff person's name in a conversation needed a new `profiles`
  read policy, and a widened §4.1 transparency contract (D-164), because a
  case manager who is a real conversation participant reads more than the
  contract previously disclosed. That first read policy (0060) handed back
  the whole `profiles` row — `last_active_at`, `phone`, everything — to any
  conversation partner of any role; replaced same day (0061,
  `conversation_partners()`, D-165) with a two-column function so nobody,
  including a program admin, sees activity info through this path.
  **Closed app-wide, same day (0062, D-166)**: the older, pre-existing
  `profiles_select_provider_linked` policy — which let a program admin read
  a member's `last_active_at` and `phone` through any
  enrollment/appointment link, no conversation required — is gone too,
  replaced by `provider_linked_members()` (id, first name only). "Program
  admins don't see activity, across the entire app" is now true, not just
  true of messaging. Case managers are unaffected. The transparency screen
  was re-audited line by line (D-167) rather than amended piecemeal a
  fourth time. `admin_visibility.test.ts` — the test that comment claimed
  enforces the contract but did not exist — is now built and passing
  (`04_transparency_contract_test.sql`, D-168), part of the 221-check
  database suite that ran for real once this sandbox got `postgis`.
- **`staff_requests` is now reviewed, for real (17 September, D-148/D-149).**
  A pending claim notifies every super admin (a plain alert, not a clickable
  one — D-148) and is decided on a new screen, `/requests/`, linked from the
  Everyone list: approve creates the real account immediately, phone pulled
  from `auth.users`; deny records the decision and creates nothing. Both the
  approval and denial SMS are signed off and live (Will, 17 September) — the
  denial text skips the usual quiet-hours/STOP check by explicit instruction
  (D-150, D-152), a deliberate exception, not a general precedent.
- **What does exist and works:** sign-up, sign-in, home, saved places, points
  and badges, the places list, a screen per place at `/place/?id=…`, reporting
  a place, the notifications list, the
  reminders question, the case manager screen, the people directory, deciding
  a staff request, and the privacy and terms pages.
- **Home is a menu, and only a menu.** It lists where to go and what is waiting.
  No next step, no points, no plan: PAM has no real ones yet, and a home screen
  that invents its own content is worse than a short one (D-098). `/gallery/` is
  the workbench where every component is rendered in the states nobody can
  navigate to.
- **Notices exist but are not wired to real failures.** Every condition has
  plain-language copy and a component (D-035), and the demo renders three of
  them. Connecting them to actual query results is Phase 1.
- **The §12 budget has 0.4 kB left** — 499.6 kB gz against a 500 kB ceiling,
  plus a 36.5 kB animation chunk against its separate 40 kB one. The place
  screen fitted only because the lazy imports stopped going through package
  barrels: `import('@pam/ui')` pulls every component in the library, so a
  "lazy" chunk contained the whole thing and webpack hoisted the shared parts
  back into the first load (D-125). Packages now declare subpath exports, and
  `@pam/config/hours` is deliberately absent from that package's barrel. The
  next component on a shared screen still breaches the budget.
- **The five-tab member shell exists but is not mounted** (`@pam/ui/TabBar`,
  D-209 — see it in Storybook under Shell). Before that: `AppShell` + `TabList` was the first UI task of
  Phase 1. The layout is settled and the pieces are ready: Help is now a compact
  item sized to share the bottom bar rather than a full-width row (D-039), and
  the five navigation icons exist. Only the dock itself is unbuilt.
- **Partial import, now described.** **754 active places** live in `services`
  — DBHIDS providers plus the city's recreation and facility feeds and twelve
  hand-added places. As of 0050 every one carries a `description_plain` of at
  most 200 characters, 230 carry a website, and 361 are marked with who may
  walk in. None is hidden for review. City Facilities (3,197 features) is
  verified and active but not yet fetched. Endpoints were confirmed through `pg_net` from the database, since the
  build sandbox blocks all external egress (D-030).
- **Opening hours are a stand-in, and the screen says so.** The Google Maps key
  is in Supabase Edge Function secrets, but `enrich-places` is not written —
  deferred by Will until nearer kick-off. Until then `USE_PLACEHOLDER_HOURS` in
  `@pam/config/hours` makes cards show open or closed from a deterministic
  stand-in, and the place screen prints "These are sample hours while PAM checks
  the real ones. Call before you go." Flipping that one boolean is the whole
  swap (D-122). Real phone numbers are still thin: 12 of 754.
- **The SMS copy is signed off** (13 September, Will) and the dispatcher is
  deployed with it. The only thing still stopping a real text is the Twilio
  credentials in the function's secrets — and, beyond that, the carrier
  registration. Blank `reviewedBy` still stops everything, and a new template
  starts blank.
- **Notifications have a screen of their own** at `/notifications/`, reached
  from a bell that is now on every signed-in screen (16 September) — it used
  to exist only on Home, the case manager screen and the directory, so
  leaving Home for anywhere else lost the way back to a flagged place. A row
  says the place or the person's name, not just that something happened, and
  is a log line rather than a button: nothing here is clicked, and nothing is
  marked read one at a time — the whole list is marked seen the moment it is
  opened, which is what clears the bell for next time.
- **A super admin's "Viewing as" preview now follows them off Home.** It used
  to be read only by the Home screen, so a super admin who picked "Program"
  there and then opened Places, Saved, the case manager screen or the
  directory fell straight back to their own role — the header said one thing
  and the next screen said another. Every screen that gates on role now reads
  the same stored preview, and the redundant sentence under the switcher
  ("This is what a Program sees...") is gone — the switcher's own chip
  ("Viewing as Program") already says it, in the header, on every screen.
- **No device build.** Capacitor is configured; `cap add ios/android` has never
  been run.
- **The top bar is content-consistent, not yet architecturally persistent.**
  Every signed-in screen now renders the same role-preview control, area
  chip, and bell (16 September), but each navigation is still a full page
  reload — Will chose the fuller "client-side routing everywhere" option over
  this lighter fix (D-134) and it has not been built.
- **Sharing a place with a case manager's people is not built.** Will chose a
  fully persisted version (real table, RLS, a notification to the recipient)
  over a UI-only stand-in (D-134); nothing exists yet — no migration, no UI.

---

## Five bugs worth remembering

Each of these passed a build, and most passed the tests too. They are recorded
because the *class* will recur.

**Reminders would have silently failed to send.** The Spanish 24-hour reminder
renders at 159 of 160 characters with a 31-character address. Any longer address
pushed it over, `renderSms` threw, and the reminder never went. Templates now
budget each variable and shorten at a word boundary. *A safety gate that throws
at send time is a feature that doesn't happen.*

**The design system was never applied.** All three Astryx stylesheets loaded with
200s and every component rendered unthemed, because Astryx applies its theme from
React via `<Theme>`. The build passed, axe passed, the unit tests passed on
accessible names. Only a screenshot showed it. *Some classes of wrong are
invisible to every check that isn't an eye.*

**`member_points(<any member>)` leaked every member's points.** The RLS was
correct; the leak was around it. PostgREST exposes every `public` function at
`/rest/v1/rpc/<name>`, so a `SECURITY DEFINER` helper taking a caller-supplied id
could be called with someone else's. *Row-level security does not cover the RPC
surface. Supabase's advisors caught this; the local suite could not.*

**Revoking a grant broke the signed-out catalogue.** The fix for the above —
revoking `EXECUTE` from `anon` — made a public read fail with "permission denied
for function", because a policy declared `for all` is evaluated on SELECT too.
Reading `services` evaluated the *provider's write policy*. A member not signed
in could not see the places that can help. *The guard inside the function was
always the boundary; the grant never was.*

---

**A message was marked sent that was never sent.** The dispatcher claims a
message as sent, then reports back if it fails. Reporting a failure called a
database function that returns nothing, and asking an empty answer for JSON
throws — so the report died and the row stayed marked sent. Every unit test
passed; none of them could see it, because they all tested rendering, which is
pure. What caught it was running the deployed function against the live database
with one real queued row. *The refusal path is the path that runs in production
while the copy is unsigned, so it earned the first live test, not the last.*

---

## What needs a human

| # | Needs | Blocks | Note |
|---|---|---|---|
| 1 | ~~Create the first admin~~ **Done** | — | Will, Philadelphia, created 12 Sept and verified by generating a live invite code. Sign-in still needs an SMS provider configured in Supabase — see row 9. |
| 2 | **Review the SMS copy** and record a name in `reviewedBy` | Phase 2 | Nothing can text a member until someone signs off against §9. **A review sheet is prepared and waiting**: all twelve messages rendered as lock-screen notifications in both languages, with the two open questions — https://claude.ai/code/artifact/f1dfb8d4-f64d-47c4-97d3-6a67f4c0eb09 |
| 3 | **Get the PA 211 export URL** from the 211 contact | 211 data only | Licence cleared and the host reachable, but it serves a consumer search UI rather than a feed. Philadelphia's own datasets are verified and active. |
| 4 | ~~A Google Places API key~~ **Done — but `enrich-places` is not written** | Real hours and phone numbers | Will added the key to Supabase Edge Function secrets on 16 September, and deferred building `enrich-places` until nearer kick-off. Until it runs, `place_id` is null on every imported row, hours are the stand-in described above, and only 12 of 754 places have a phone. |
| 5 | ~~Brand colours and logo~~ **Logo done** | Phase 6 | Category pins use Astryx palette defaults chosen for hue separation at AAA contrast. |
| 6 | Whether points redeem for real rewards | Phase 3 | Built behind a flag, shipped off. |
| 7 | Retention: missed-appointment history beyond 90 days | Phase 5 | No purge job. Keeping this data indefinitely is the wrong default for this population. |
| 8 | Pilot partner orgs and usability test scheduling | Phase 7 | Five members, three providers, two admins. |
| 9 | ~~Point Supabase at Twilio~~ **Done** | — | Verified on 14 September from the auth logs: a real code, a real `user_signedup` with `provider: phone`, and a member profile a minute later. This row read "the single thing blocking the product" until 16 September, when the logs said otherwise. |
| 10a | ~~Who calls the people who ask to help?~~ **Done** | — | Resolved by the other concurrent session's `/requests/` screen (D-148/D-149): a super admin is notified when a claim arrives and reviews it there, approving or denying for real. Sign-up still collects the request in `staff_requests`; it is now worked, not just recorded. |
| 9b | ~~754 places, and not one of them says what it is~~ **Done** | — | 0050, 16 September: all 754 carry a description of at most 200 characters, written from the city's own `service_type` / `park_name` / `asset_name` fields or, for the twelve hand-added places, from published sources. 230 have a website and 361 are marked `audience`. Verified live: 754 active, 754 described, 0 hidden for review, longest 152 characters. This reversed the screen half of 0017 and needed Will's word — see A11 and D-121. The words are sourced, not invented, but **no provider has read their own entry yet.** |
| 10c | **Confirm the Twilio account's state** | Anybody whose number is not verified | This row said the account was in trial. Will, 16 September: the Twilio console says it is active. That earlier claim came from a 13–14 September finding and was repeated afterwards without re-checking; this session did not verify it either way, so it stands as Will's word and unverified here. If it is active the trial concern is gone; if not, a code to an unverified number is not sent and nothing says so — the live logs on the 14th show one phone asking three times. Carrier registration is a separate question (row 10). |
| 10b | **A line about the PAM team on the transparency screen** | A promise already made | Members were told they would hear first if what is visible changes, and the directory now shows a super admin every account (name, role, region, status, last active; never messages or contact details). Proposed, for `packages/config/transparency.ts`: *"The PAM team can see your name, your city and the last day you used PAM. Never your messages."* It is a change to the contract, so it wants Will's word. |
| 14 | **Storing members' policy signatures** | Policies being real (D-261, D-270) | Signing works on example data, kept in the browser tab only. Making it real needs a table for each program's policies and one for signatures (who, which policy and which version, when, the drawn image or typed name), file storage for the documents, and a transparency line telling a member the program keeps a record of what they signed. Schema and contract changes, so Will's word first. |
| 15 | **Points: four questions before awarding is built** | Points beyond saving and finishing setup | Listed at the top of `docs/points-awarding.md` under "Decide before building": points for signing policies (+10 per program?); the return bonus window (weekly or daily); location at visit time for the checked-in award; whether points ever redeem. Two fixes ride along: reseed the database's `badges` table from config, and delete the unused `LEVELS` ladder. |
| 10 | ~~Twilio credentials into the dispatcher's secrets~~ **Done** | — | Will, 17 September. Confirmed with a real end-to-end test: a `staff_request_denied` text queued to Will's own number was picked up by the 5-minute dispatcher cycle and sent successfully (`status: sent`, no failure reason). PAM can now text for real. |
| 11 | ~~Sign off `staff_request_approved`'s wording~~ **Done** | — | Will, 17 September. `pnpm --filter @pam/config test` is green. |
| 12 | ~~Migrations 0054 through 0057 are local only~~ **Done** | — | Applied to the live Supabase project 17 September, along with two follow-ups `get_advisors` surfaced: `notify_on_staff_request` (0058) was callable directly via PostgREST, unlike its two siblings in 0038 — its own migration run never got the schema-level default-privileges lockdown 0038's did; and `staff_requests` had two foreign keys with no covering index (0059). `/requests/`, `/join/`'s program step, and the demo view all work against the real database now. |
| 13 | ~~Sign off `staff_request_denied`'s wording too~~ **Done** | — | Will, 17 September. Still sent with quiet-hours/STOP enforcement deliberately skipped, at Will's own instruction (D-152) — that was never what this row was about. |
| 14 | **The demo view is not wired into every screen yet** | An account granted it still sees real data on `place`, `person`, `HomePeoplePreview`, and the saved-places dummy path | The mechanism (`useDemoView`) is built and proven on five screens (D-155); finishing the rest is the same pattern repeated, not new design. |
| 15 | ~~Confirm client-side caseload/enrollment scoping in `/messages/` is an acceptable interim state (D-163)~~ **Closed at the database layer (0063, D-176)** | Staff-to-member messaging | RLS lets a client create a conversation with any profile id; only `useMessageableMembers`'s own restraint (a case manager's real caseload, a program admin's real enrolled members) keeps this screen scoped to real relationships. A follow-up migration should enforce it at the database layer — see D-163 for exactly what to check. Shipped now, conservatively, rather than blocked on that migration; flagged for Will's word on whether that trade is right, given it now involves staff accounts with real caseload access rather than peers. |
| 16 | ~~Wire `report_message()` (0034) to a UI action in the thread view~~ **Done (D-177), plus `/reports/` (D-178)** | Member safety | The RPC is complete and correct at the database layer; nothing in `/messages/thread/` calls it yet. D-074's whole premise is that a report is the *only* route a case manager who is **not** a participant ever has into message content — a chat surface with no way to file one is a real gap, not a nice-to-have. |
| 17 | ~~Run `pnpm --filter @pam/db test` against migrations 0060, 0061 and 0062~~ **Done (D-168); now also deployed live (D-169)** | — | This sandbox turned out not to be permanently missing `postgis` — `apt-get install postgresql-16-postgis-3` closed the gap. `pnpm --filter @pam/db test` ran for real: **221 checks pass, 0 failures.** `0060` was superseded (locally) before deploy but is still recorded live under its deploy-time name; `0061` and `0062` are also applied to the live Supabase project, and `get_advisors` (security) came back clean. Deploying also surfaced live/repo drift unrelated to this work — see the "What is live" drift note and D-169 — left for Will to reconcile. Deployed and merged under different numbers than they were built with — see D-170. |
| 18 | ~~`profiles_select_provider_linked` grants activity info~~ **Done — closed app-wide (0062, D-166)** | — | Was: a program admin could read `last_active_at`/`phone` for any enrolled member with no conversation required. Replaced with `provider_linked_members()` (id, first name only). Will confirmed this needed to be a blanket rule, not just a messaging-surface one, and the transparency screen now says so (D-167). Case managers unaffected. |
| 19 | **Decide whether `profiles.phone` needs a column-level `REVOKE` more broadly still** | Staff/member privacy | The provider-role exposure is now closed everywhere it was found (D-165, D-166 — `conversation_partners()` and `provider_linked_members()` both return name/role only). `profiles_select_admin_caseload` (case managers) still exposes the whole row, including `phone`, for a caseload/region member — untouched, since every instruction so far has been explicitly provider-role-specific, not about case managers. The `bidder_contact`-style column grant pattern used elsewhere in this repo would close it if Will wants that too. |
| 20 | ~~Build `admin_visibility.test.ts`~~ **Done, as `04_transparency_contract_test.sql` (D-168)** | — | `transparency.ts`'s own file comment used to claim a test by that name enforces `ADMIN_CAN_SEE` against live RLS; it never existed (D-164, D-167). Built and run: `packages/db/test/04_transparency_contract_test.sql`, covering the four contract lines that changed today (case-manager participation, non-participation, program-admin activity via both read paths, and total visibility) against a real database, not just documentation. Passes, per row 17. |
| 21 | ~~Can a super admin send messages?~~ **Confirmed: no (D-171)** | — | A super admin gets no "Messages" tile and `/messages/` reads "not for your role" for that account — this is correct, confirmed by Will, not a bug. Testing on the live deployment also found the live database has **zero `admin` and zero `provider` accounts** — only Will's `super_admin` and two plain members — so the caseload/enrollment messaging paths need a real case-manager or program-admin account (invite-created, with an actual caseload assignment or enrollment) before `/messages/`'s "Start a conversation" section will show anyone. |
| 22 | ~~Messaging never appeared during a role preview~~ **Fixed (D-172)** | — | Was gating `canMessage`/`isStaff` and the Home tile on the real role only, so a preview never showed them for any role — a bug, not the restriction D-171 actually called for. Now gates visibility on `viewedRole`, matching `/admin/`/`/directory/`/`/interested/`; real data/writes still only ever follow `trueRole`. |
| 23 | ~~Run the Playwright a11y suite against this session's changes~~ **Done 20 September** with `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` | Confidence in the new `DummyConversations`/`DummyStartable`/`DemoMessageComposer`/`ProgramBadge` UI | Could not run in this sandbox: `playwright install` fails downloading `chromium_headless_shell` (`cdn.playwright.dev` blocked by the agent proxy — a network-policy gap, not a missing-package one the way `postgis` was). The 426-pass figure in "What is proven" predates this session's changes. |
| 24 | ~~Deploy `0063`, `0064`, `0065`~~ **Done, with `0052` (Will, 20 September)** | — | `list_migrations` checked first: no new live-only drift since the 17th. All four applied in order; `get_advisors` (security) clean. `0052` closes the saved-places gap that had been open since the 16th. The live ledger records this session's earlier three under their deploy-time names (`0054_…`–`0056_…`, D-169 addendum) and these four under their real names. |
| 25 | **D-178's audience** | Who reads a reported message | The reporter's case manager is included alongside the sender's. Say if it should be the sender's only. |
| 27 | ~~Approve the new transparency line, then deploy `0067`~~ **Done (Will, 21 September)** | — | Wording approved as proposed. `list_migrations` first: no drift since the 20th. `0067_people_activity.sql` applied; `get_advisors` (security) clean — `people_activity()` is `authenticated`-only. The ring for a new save now lights for real. Also fixed in the same push: `privacy.s.who-can-see.p1` (the long privacy page, not the short transparency screen) still carried "and that a chat exists" — a claim D-167 removed from the short screen on the 17th but missed here. Removed, en/es. |
| 26 | ~~Deploy `0066`~~ **Done (Will, 21 September)** | — | `list_migrations` first: no drift since the 20th. Applied; `get_advisors` (security) clean — `flagged_services()` and the recreated `conversation_partners()` are `authenticated`-only, `services_search()` is security invoker and so not even listed. `pg_trgm` now lives in `extensions`. Case managers keep the Reported places list read-only — Will's call, recorded as D-190. |
| 28 | ~~A Chromatic project token~~ **Done** | — | The token is the repository secret `CHROMATIC_PROJECT_TOKEN`, and `pam-storybook.yml` publishes Storybook to Chromatic on every push: checked 10 October on `main` (`bf08d60`), where "Publish to Chromatic" ran and passed. |
| 29 | ~~Where the dock's People and My Plan lead~~ **Answered by the redesign (D-210)** | — | Will, 1 October: the bar is Explore, Saved, Trips, Messages, Profile; Help moves to each screen's header and Profile. Next: his reference screenshots for the other screens, then wiring the redesigned views to routes and data. Walk it in `Prototype/Redesign — member` (D-211). |
| 30 | ~~Deploy `0071` and `0072`~~ **Done (Will, 4 October)** | — | `list_migrations` first: live ran to `0070`, no live-only drift; `can_message`, `messageable_people` and `open_direct_conversation` matched 0063 exactly, which 0072 was written against. Both applied; `get_advisors` (security) shows no new kind of finding (the definer functions are guarded inside, as every other one is; `invite_preview` and `request_invite_link` are anon on purpose). Spot-checked: `invite_emails` forced RLS with one policy and no anon access; `invites_log` and `staff_request_phone` not callable signed out. See D-264. |
| 34 | **Read the short version; translate the new strings** | D-416, D-417, D-427 | The look is chosen (icons) and built, and "your guide" is settled as the short word (Will, 9 October, D-427): the long phrase now appears only where it defines the word, and Help, the report screens and the paused / turned-off / limited notices say "your guide". Will has read and approved the four short-version lines (`transparency.summary.*`, 9 October, D-427). **Translated into the five other languages** on `claude/gallant-clarke-0dhizj` — D-412–D-417 in the first merge, D-427's eight (`access.limitedNotice`, `help.what.person`, `messages.report.*`, `notice.account_*`, `notice.feature_turned_off.body`) when the two branches met (all drafts for native review; `locales/ledger.json` records them). |
| 33 | ~~Apply `0082`~~ **Done (9 October, D-420)**; **update the language bundles for D-415's wording — done on `claude/gallant-clarke-0dhizj` (drafts for native review)** | Launch (D-415) | `0082_admin_reaches_assigned_only.sql` is live (`list_migrations` first, no drift; function checked; `get_advisors` unchanged in kind). The five other bundles carry D-415's wording on the languages branch. D-415 lists every changed string. |
| 32 | **Ship the policy, update five languages** (the limited notice is wired — D-427) | Launch (D-413, D-414, D-427) | Will, 9 October: the terms say a limited account can read but not send and a paused one cannot sign in; the transparency line names badges; members are told in the privacy policy (new section "When we limit an account", live since the merge, D-420). **Done (D-427):** `terms.s.limits.p3` ("Pam tells you it is off and who to call") is kept — a limited account sees the `account_limited` notice on Messages and where the composer was, and a refused send no longer says "Your connection dropped". Will has read and approved the privacy section's wording (9 October). Left: (1) the strings changed in D-412–D-415 and D-427 in pt-BR, zh-CN, zh-HK, ru, ar — **done** on `claude/gallant-clarke-0dhizj` once the two branches met (drafts for native review). |
| 31 | **The before-launch list** | Launch | `docs/before-launch.md` — Will's list of what must be done before real people use PAM. First entry: the email provider for invite links. **0068/0069** are merged as 0075/0076 with 0072's arm kept (D-346); they wait for Will to apply them live. Program sign-up and Add a program are a one-question wizard with a review (D-347); Add a policy is a card (D-348); super admin → program lead message from a place (D-349). |
| 34 | **Languages: native readers, the texts and emails, redeploy `dispatch-sms`** | The new languages going to real people (D-422, A24, D-430) | Will approved every new language **to learn from** (9 October, D-430): the five languages' screens are live, and the 53 texts and the five invite emails are signed `Will (Oba) … approved to learn from; no native reader yet`. Nobody who speaks Portuguese, Chinese, Russian or Arabic has read the six new bundles; start with the privacy page, the terms, the transparency screen, the notices and the seven "Switching to…" lines, and fix what they say (`docs/copy-changes.md` › *When somebody says a translation is wrong*). **The live `dispatch-sms` (v15) is still the old one** — "PAM:" prefix, English and Spanish only — so no one is texted in a new language until Will says to redeploy it, together with re-filing the carrier campaign; `docs/before-launch.md` has the rest (the three reminders now take two segments in Chinese, Russian and Arabic, D-431 — the carrier filing has to say so first — the steps, ready to paste, are in `docs/before-launch.md` › *File the updated text-message registration*; an email provider). **0083 is live.** Open question left at its default (no restriction): should staff be able to pick any language? |
| 35 | **Messages in your own language: switching it on** | D-423 | Built and off. Needs the provider's no-retention terms in writing, the key as a function secret, a native read of `privacy.s.translation.*`, a way to tell members first, a per-person daily cap, then both switches. `docs/before-launch.md`. |
| 36 | ~~Merge of `claude/gallant-clarke-0dhizj` to `main`~~ **Done** — PR #29, merged as `8dee5d4` on 9 October 2026 at Will's word; Vercel production READY and smoke-checked. Its later work (D-430–D-444), PR #30, merged as `9b8b8d8` and `63a3f3e` on 10 October at Will's word, with no migrations | Will, 9 October 2026 (D-428) | 0079–0081 were live first (read back; advisors show nothing new for `anon`). Left for Will: send one photo, one document and one link between two test accounts. **0085 is live (10 October):** Will pasted `packages/db/manual/…language-where-there-is-no-profile.sql` into the SQL editor. Read back by the merge desk: the two old signatures are gone, the new ones are there with the file's grants (`request_staff_access` for `authenticated` only, `request_invite_link` for `anon` too, `supported_language` for neither), both language columns and the check are present, one ledger row; advisors unchanged in kind. |
| 37 | ~~Apply `0086` (staff email on invites) with the app change that uses it~~ **Done (10 October, D-441)** | Launch (D-441) | Will, 10 October: a staff invite carries a required email, the account keeps it tied to the phone, members are never asked; only super admins read it; it is deleted with the account. **0086 is live** (applied after `list_migrations` showed no drift; advisors unchanged in kind) and the app change is on `main` (`0220ae0`; CI and Storybook green). Open: a native read of the new-language privacy lines (the `What we keep` paragraph and `how-long.p3`); staff who already have accounts have no email and no screen to add one; sending any email needs the provider (first item on `docs/before-launch.md`). |
| 38 | ~~Apply the two audit-log migrations, in order~~ **Done (10 October, D-443)** | Launch (D-443) | Will, 10 October: "When account is deleted the account should sit in audit log for 6 months before it disappears." **Live:** a deleted profile leaves an `account.delete` audit row; a nightly job (`purge-erased-audit`, 03:30 UTC) deletes every row naming the account six months later; the foreign key from `audit_log.actor_id` to `profiles` is gone so an account that acted can be deleted; the privacy page says it (`privacy.s.how-long.p3`). A member who has points can now be deleted too: **D-445 is live (10 October)** — `points_history_is_deleted_with_the_member` applied after `list_migrations` showed no drift (read back: the guard lets a ledger row go only once its account is gone; the helper is not callable by `anon` or `authenticated`; advisors unchanged in kind). Then the one routine for the Pam team that deletes everything (`docs/before-launch.md`). |
| 39 | **Arabic: a native reader and a screen reader** | D-435 | Nobody who reads Arabic has seen where an English name, address or date now sits in a sentence — in particular a colon or full stop beside an English word (`:Pam`, `then.`), correct by the bidi rules — and no screen reader (VoiceOver, TalkBack, NVDA, JAWS) has been run over the Arabic labels. `docs/before-launch.md`, under "Have a native speaker read every new language" and the new screen-reader item. |
| 40 | ~~A domain for Pam~~ **Done (10 October)** | — | Will bought **joinpam.org** (DNS at GoDaddy). The website (pam-site) is at `joinpam.org` (`www` 308s to it); the app is at `app.joinpam.org`, and the old `web-ten-umber-88.vercel.app` 308s there, same path (`apps/web/vercel.json`). Still to move: email from `mail.joinpam.org` (Nico's sender + Will's mail-service setup) and the database's `app_url` (links in texts), which moves with the updated carrier filing. |
| 41 | ~~Apply D-447's two migrations~~ **Done (10 October)** | — | `a_program_lead_submits_their_own_program` (042108) and `an_approved_program_lead_gets_an_org` (062347, on 0085's body) are live: `list_migrations` first (no drift), read back (`submit_program` for `authenticated` only; the review guard trigger on `services`; `flag_unapproved_rewrite` lets a lead edit a live listing's words; `review_staff_request` gives an approved lead an org and keeps 0085's language), advisors unchanged in kind. Approved leads from before today have no org until their first Add a program. |

---

## Looking at it

```bash
node scripts/journeys.mjs     # every screen, every role, both themes
```

Writes `docs/journeys/index.html` — 130 screenshots of the built app against
stubbed data. Open it in a browser to review the whole product at once, which is
the only way to see the class of problem no test catches (D-091).

## Picking it up

```bash
cd pam && pnpm install
pnpm dev                                # web app on :3000

pnpm -r typecheck
pnpm --filter @pam/config test          # SMS safety, copy rules, points
pnpm --filter @pam/ui test              # components + axe
pnpm --filter @pam/db test              # migrations + RLS penetration suite
pnpm --filter @pam/web build
pnpm --filter @pam/web test:a11y        # browser: contrast, target size, 320px — serves out/, so build first
node scripts/check-bundle-budget.mjs    # §12 first-load budget
```

The database suite needs `postgresql-16`, `postgresql-16-postgis-3` and
`pgcrypto`. It creates a throwaway cluster and cleans up after itself.

### Read these before changing anything

- `apps/web/.claude/CLAUDE.md` — Astryx's own conventions, generated by its CLI.
  They override default instincts, and ignoring them is what produced the
  unthemed build.
- `packages/config/transparency.ts` — a promise made to people with little reason
  to trust promises. Widening it fails tests by design; change the contract
  first and tell members before it ships.
- `DECISIONS.md` — 110 decisions with their reasoning, and the open questions.
- `docs/sop-amendments.md` — ten changes to the SOP since handover, several of
  which contradict it. Read before trusting a rule you remember from the SOP.
  A8 and A9 are the two screens that deliberately carry no help link; A10 is why
  the waiting state carries no words.

---

## Languages & legal · the privacy page on email and signatures (10 October) — on `claude/lena-privacy-three-sentences`, not merged

Will approved card a29 (10 October 15:15 UTC), three sentences word for word, pinned in `test/legal.test.ts` (D-490): `privacy.s.sharing.p4` now says a company that sends email for us gets the address
and the email whenever **Pam sends an email** (it said "a case manager or a program"); the end of `privacy.s.what-we-keep.p7` says a member is asked for an email only if their invite link has run
out, and that it is deleted once the link is sent (D-487); new `privacy.s.what-we-keep.p8`: when a program asks you to sign its rules, Pam keeps what you signed, the date and your signature,
only you see the signature, the program sees your first name and the date. Six translations each, no native reader. **Must be on the live page before the first email goes out** and before tonight's deploy.

## Languages & legal · Spanish says "visita", not "viaje" (10 October) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/lena-es-visitas` (17e22db), after the sweep. 
The Spanish tab said "Visitas" and sixteen strings around it said "viaje" (New trip, Trip added, Go to Trips, alerts, glossary); all say "visita" now,
and one Simplified Chinese stray ("行程") says "预约". `test/one-word-for-a-visit.test.ts` keeps each language to the word on its tab (D-480). This branch
contains the queued promise sweep below, so **merge that first**. Open: the public site's Spanish draft (`about.ts`, Wren) still says "viaje"; Piper's
review-queue strings are reviewed when they are on `main`.

## Languages & legal · the app says only what Pam texts today (10 October) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/lena-promise-sweep` (481afaf), with Piper's Cancel-a-visit drafts reviewed. Will's rule (a12): a line says only what Pam does. The first slide said "Pam reminds you before you go, so nothing gets
missed"; no visit reminder is sent (the public site says "coming", `VISIT_REMINDERS_LIVE = false`). Ten lines, seven
languages, no migration (D-474): the slide ("Pam keeps your planned visits in one place."), the program leads' slide
("Members find your program and plan a visit."), the booked and trip-added screens, the member Profile card (the one text
Pam sends: a saved place closes or moves), the two staff text-alert cards ("Coming soon: …"), the program form's "We will
let you know when yours is live" (the Program tab shows where it is), the terms line about a new number, and the empty
bell. `test/promises-of-texts.test.ts` fails if English says Pam reminds you while the site's flag is false, and if the
site's flag and the app's copy of it disagree. `docs/before-launch.md` › *Visit reminders go live* lists, key by key, what
to put back (and where the old six languages are in git).

- **Not words, reported:** after a program books a visit for a member, the app says "Booked for … Pam texted … a link", but
  nothing is saved or texted (`bookTrip` keeps it in the tab). Places & programs / Trips to build it or label it an example.
- **Left on purpose:** `reminders.intro` (the carrier-reviewed screen's first line; the line under its list says what is sent).

## Languages & legal · the language loader comes down; the flaky sign-in menu test (10 October) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/lena-steady-tag-test` (D-471). The "Switching to…" loader could go up a moment after the new language had already arrived and then stay up for good, covering every tap: the take-down now runs whether or not the loader was up in that render (`lib/i18n.tsx`). Found by the flaky `languages.spec` sign-in menu test (5 or 6 stalled clicks in 260 runs under load); after the fix 260 of 260, twice. The sign-in menu and join chip tests also wait for the settled page and read every row's position at once. No migration, no copy change.

## Languages & legal · the last-day line and the blocking words (10 October) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/lena-honest-promises` (e82e815). Will's rule, via Mira: a screen that promises something Pam does not do is
fixed or rewritten (D-465).

- **"The last day you used Pam."** — the transparency screen no longer says a program sees it. A case manager does; a
  program does not (0062), whatever D-242 intended; that half stays open. Seven languages, the contract's `en` and
  comments, a test. The **public site's** "What others can see" row (`apps/site`) said a program does; changed with
  Mira's OK, in Wren's lane, so the app and the page change in the same merge.
- **Blocking, in its true form** now that the Block control is on `main` (D-463): privacy "Both are in a conversation's
  ⋯ menu"; terms "You can block someone you talk to, from a conversation's ⋯ menu. Neither of you can send messages
  there after that. They will see that messages are blocked." — not "anyone", not "they will not know". The Block
  session's STATUS line that the terms were untrue can go at merge.
- **Not here:** the mail-service paragraph on the privacy page (its English is with Will).
- **Verified:** unit tests (`@pam/config` 995, `@pam/ui` 117, `@pam/web` 71, `@pam/site` 18), typecheck and the copy
  ledger on the merged tree; the browser suite on all three viewports, 909 passed (on the tree one merge before the last);
  the full fit audit: 92 new in a language, 84 accepted, 8 not, all in stories this branch does not touch (Explore's pseudo
  clamps; the two Block conversation stories; the one-trip-saved date). See the session log.

## Languages & legal · English tags before each language name; the privacy wording (10 October) — merged 10 October

From `claude/lena-english-language-tags` (1f59d62), merged to `main` by the merge desk, 10 October; no
migration. At merge, `fit-known.json` took seven overlaps on `conversation-file-refused` (the thread
under the header, which comes and goes; looked at in Russian and Arabic at 320px). Two jobs from Will via Mira (D-455, D-452).

- **Every list of languages starts each name with an English tag** — EN, ES, PT-BR, ZH-CN, ZH-HK, RU, AR
  (`LANGUAGE_TAGS` in `@pam/config`, constants, never bundle strings; a test fails if one is missing,
  differs from its code, or turns up in a bundle). On the Language screen, the sign-in globe menu and
  the current-language chip, the join screen's language chips, Profile's Language row (before the
  current language) and Storybook's locale menu. Hidden from a screen reader; each name carries its own
  `lang`, so it is spoken in its own voice. Left to right and isolated, at the start of the row (the
  right in Arabic). Screenshots at 320px: `docs/languages/language-tags/`.
- **Crossing into the design system, with Mira's OK:** `ChoiceChips` no longer turns a chip round with its
  language (the Arabic chip on an English page read "العربية  AR"); `lang` stays on the button for the
  spoken name, `dir` is on the words only. `@pam/ui` exports `./OptionTag` (`OptionTag`, `TaggedWords`),
  which the sign-in menu now uses.
- **The privacy page says what a guide can and cannot read**, as the transparency screen does: a guide
  sees everything you send them directly, nothing you send to anyone else, and one message if someone
  reports it. Seven languages; `legal.test.ts` pins the wording. The contract is unchanged. The six
  translations are Claude's and are promises: they still need a native reader (`before-launch.md`).
- **Verified:** unit tests (`@pam/config` 986, `@pam/ui` 117, `@pam/web` 61), typecheck and the copy ledger on the
  merged tree; the browser suite on all three viewports, 903 passed (on the tree one merge before the last); the
  full fit audit (480 stories × en, ru, ar, zh-CN, pseudo): 93 new in a language, 81 accepted, 12 not accepted, all in
  two stories this job does not touch (Explore's pseudo-language clamps; the file-refused conversation's overlaps,
  which come and go between runs). See the session log.
- **Not done:** hearing the tags with a screen reader (before-launch). Next, one small branch: the last-day line
  (case manager only), the blocking words back in their true form (D-463), and a mail-service paragraph awaiting
  Will's approval.

---

## Places & programs · the services a program offers, on screens (10 October) — merged 10 October

D-313 and D-462, from `claude/places-programs-services-list` (Piper, 0dba5bb), merged to `main` by
the merge desk, 10 October. **No migration of its own** (`program_services` is live, `20261010083715`).

- **Built:** a real program's services are read from and written to the database; the Program
  tab's Services card, the service editor and a member's place page show them on any phone; an
  example program keeps its services in the tab. The editor does not offer the example policies
  for a real program.
- **Not built:** a booking pointing at one service (changes `book_trip`'s signature: its own
  contract migration); policies per service; reordering.
- **Proven:** 4 new web tests, Storybook build, a browser look at adding and reading a service,
  language fit in seven languages and the pseudo-language.

---

## Places & programs · no example policies for a real place (10 October) — merged 10 October

D-313, from `claude/places-programs-no-example-policies` (Piper, 4bf27cb), merged to `main` by the
merge desk, 10 October. **No migration.** A place from the catalogue (a uuid id) asks a member to sign
nothing: `placeAsksForPolicies` says no, and the Trips list, which had bypassed it, goes through
it. Example places keep the example policies (Storybook). **Not built:** real policies per program
and per service; the leads' and staff's policy screens still show example data.

---

## Places & programs · a live program's pending change (10 October) — merged 10 October

D-447 and D-462, from `claude/places-programs-program-changes` (Piper, 24aad8b), merged to `main` by
the merge desk, 10 October. No migration of its own; it reads `20261010083715`, live since the
merge of the database half. Programs sent before that migration have no submission row: the tab
reads them as before and does not offer Delete and start over (the backfill goes with part 6).

- **Built:** a live program's new name or address is asked of Pam and waits beside the live one
  ("Waiting for Pam", with Cancel); the description, phone and website still change at once;
  Delete and start over withdraws a first send and lands on Add a program; the Program tab reads
  the open submission.
- **Not built:** the services list (`program_services`) on screens; a lead resending after Pam
  asks for changes; the super admin's side (part 6); the kind of help is not editable there.
- **Proven:** web 67 tests, Storybook build, a browser look at the three flows, language fit
  (seven languages and the pseudo-language).

---

## Places & programs · save a member's trips (10 October) — merged 10 October

D-454, from `claude/places-programs-save-trips` (Piper). A trip a member
plans to a real place is saved, and the day-before reminder text is queued for a member who
turned reminders on. **Merged to `main` by the merge desk, 10 October, after the database half.**
Both migrations are live (see "trips saved, the database half" below):
`20261010074045_a_planned_trip_is_saved_and_its_day_before_reminder_is.sql` (expand), then
`20261010074241_appointments_are_written_only_through_the_trip_functions.sql` (contract).

- **Built:** `book_trip` / `move_trip` / `cancel_trip` / `my_trips()`; a trigger that queues,
  re-times or cancels one `appointment_24h` text, only when the member has reminders on; every
  screen that lists trips shows saved ones (`SavedTripsSync`, `useTrips`); Plan a trip saves for
  real and says so if it cannot. Wording: a sent program promises no time, `/interested` speaks
  in a program's words, the review wait drops the "Text me" row.
- **Closed:** any signed-in person could write an appointment for any member, and a member could
  mark their own appointment attended.
- **Not built:** a program booking for a member (D-316) and example places stay on the device;
  no cancel button; the text links to Trips on `app_settings.app_url`, which still holds the old
  address. (The dispatcher's claim now texts a reminder only to a member who agreed:
  Messages' `20261010072848_…`, live.)
- **Proven:** database suite (`28_` file, renumbered at merge), numbering test, 61 web and 822 config tests,
  Storybook build, a browser look at planning, moving and reading a saved trip, language fit.

---

## Places & programs · load a lead's own program (10 October) — merged 10 October

D-447, from `claude/places-programs-load-own-program` (Piper). A program lead's program is
now read from, and saved to, the database instead of remembered by the tab. **Merged to `main`
10 October (`aff402d`); 0085 and both migrations are live.** Two migrations, in this order: **0085** (by hand, it
drops signatures), then `20261010042108_a_program_lead_submits_their_own_program.sql`, then
`20261010062347_an_approved_program_lead_gets_an_org.sql` (refuses without 0085).

- **Built:** the Program tab, Home's getting-started cards and "Sent to Pam" follow the
  lead's own program (waiting for review, or live) on any phone; Add a program sends it for
  real; Edit saves it. A live program's name, address and kind of help are shown but not
  editable (D-447); its description, phone and website save at once.
- **Closed by the migrations:** a lead had no org, so could neither read nor edit their
  program; a lead could approve their own listing by setting `needs_review = false`; editing a
  live program's words hid it from members.
- **Not built:** Delete and start over for a program on file; changing a live program's
  name/address (part 5a); the review wait's real status and Pam's note (5b); the super
  admin's queue (6); switching between programs (4). Approved leads from before the second
  migration still have an org-less program.
- **Proven:** database suite (both migrations, incl. the refusal without 0085), 55 web and 808
  config tests, Storybook build and a browser look at the new states. Language fit on the one
  new sentence is left to the PR check.

---

## Messages & notifications · the expired-link address is deleted (10 October 2026) — merged 10 October

Merged by the merge desk from 7a9b1d9. Live: applied as 20261010152709; the four function bodies match the file by md5 (purge, mark sent, claim, invites_log), the check constraint is in, `purge-invite-email-addresses` runs at 03:40 nightly; purge, mark and claim are service-role only. `send-invite-emails` redeployed from main with the D-488 bundle (see below).

Branch `claude/messages-member-address-deleted`. One migration (`20261010151208_…`, **not yet applied to the live
project**, no DROP): the address typed on the expired-link page is removed as soon as the fresh link is sent, and when a
request can no longer be sent (older than seven days, out of tries, fresh link used or run out). The row keeps that it was
sent and when. The invites log shows no address for a removed one. Staff's own address is untouched. DB test 48. D-487.
Also on this branch: the staff invite email's six other languages are unsigned again (they go out in English until a person
signs them; Will approved only the English) and the sender's bundle is regenerated. **Redeploy `send-invite-emails`.** D-488.

## Messages & notifications · the clocks send the shared secret (10 October 2026) — merged 10 October

Merged by the merge desk from 03d2338. Live: applied as 20261010145909; vault `dispatch_secret` made (64 hex, never read out); cron jobs 3 (`dispatch-sms`) and 4 (`send-invite-emails`) every five minutes with the header from the vault; 15:00 and 15:05 ticks: `dispatch-sms` 200 `{claimed:0,sent:0,failures:[]}`. `send-invite-emails` deployed from main as version 1 (verify_jwt on), answering `{enabled:false}` until Will sets the secrets (card a28).

Branch `claude/messages-invite-email-clock`. One migration (`20261010144844_…`, **not yet applied to the live
project**): the vault secret `dispatch_secret` (made in the database), `dispatch-sms` rescheduled with the
`x-dispatch-secret` header, `send-invite-emails` scheduled every five minutes. This removes the DISPATCH_SECRET trap:
clock header first, then the function secret. Will's dashboard steps are in `docs/email-setup.md`. D-484.

## Messages & notifications · texts held until the day (10 October 2026) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/messages-alert-texts-wired` (0a011ee). Migration `20261010141859_…` (**applied live at merge**, before the night's deploy, recorded as 20261010142604; read back: body identical to the file, service role only, `texts_live` reads off):
`app_settings.texts_live` ('off'); until it is 'on' the claim hands the dispatcher account texts only (sign-in code,
request decisions, "parts of Pam are off", invitations), and every reminder and alert stays scheduled. Opened by the
merge desk on the day Will says go, with `ALERT_TEXTS_LIVE` and reply-start (runbook, `docs/sms-setup.md`). DB test 44 (numbered 43 on its branch; Piper's resend test took 43 first). D-481.

## Messages & notifications · the approved text alerts are wired (10 October 2026) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/messages-alert-texts-wired` (2d27149). One migration
(`20261010134429_…`, **applied live at merge**, recorded as 20261010135947; read back: the three bodies identical to
the file, service role only, both triggers in place, every switch off for everyone): per-kind Text alerts switches, and triggers that queue the four approved texts (a message, a visit
booked, moved/cancelled, planned) for people who switched them on. **Held behind `ALERT_TEXTS_LIVE = false`
(`apps/web/src/lib/alertTextsLive.ts`, c362c31, merged on top)**: the four switches say "Coming soon" and nothing writes
`alert_*` until the day Will says go (flip it with `claude/messages-reply-start`; runbook, `docs/sms-setup.md`).
DB test 42; `e2e/alerts.spec.ts`. D-478.

## Messages & notifications · the expired-link email has a sender (10 October 2026) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/messages-expired-link-email` (ca4f683). `send-invite-emails`
now also sends the fresh link to someone whose link ran out, under the same `INVITE_EMAILS` switch and secrets, in
Will's 4 October wording. One migration (`20261010133313_…`, **applied live at merge**, recorded as 20261010133956;
read back: the three bodies identical to the file, service role only, `invite_emails` still forced RLS, 0 rows waiting);
DB test 40 (numbered 39 on its branch; Piper's quiet-hours test took 39 first); sender tests. Still not deployed or switched on: that waits for Will's email setup. D-476.

## Messages & notifications · overdue texts are cancelled (10 October 2026) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/messages-overdue-cutoff` (4de80ab). One migration
(`20261010130754_…`, **applied live at merge**, recorded as 20261010131653; read back: body identical to the file, service role only): the claim cancels an appointment reminder whose visit
has started, and a time-bound text more than 12 hours late (quiet hours allowed for); texts still useful late are
unchanged. Test 38 (numbered 37 on its branch; Piper's reminder-gaps test took 37 first). Gap 4 of the rehearsal
closed. D-475.

## Messages & notifications · day-before reminder rehearsal (10 October 2026) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/messages-reminder-rehearsal` (81a6681). At merge, test 36's
ids moved to d0x and two checks were scoped to its own members, since 35 (written at the same time) used the same
ids and leaves a sent text on a cancelled trip on purpose. Tests and a runbook, no app code. DB test 36 (44 checks) and
`dispatch-sms.test.ts` (18) rehearse trip → reminder → claim → Twilio (faked) in all seven languages;
runbook at the top of `docs/sms-setup.md`. Four gaps found and pinned as KNOWN GAP (evening visits reminded
on their own day, texts turned on later queue nothing for planned trips, place names cut mid-word, an
overdue reminder not dropped), all four since fixed: 1 to 3 by Piper's `20261010130831`, 4 by Nico's
`20261010130754` (and 1b, quiet hours changed after planning, by Piper's `20261010133227`). Cancel and move work. D-473.

## Messages & notifications · legacy Messages page removed (10 October 2026)

Merged to `main` by the merge desk, 10 October, from `claude/messages-remove-legacy` (5c3d6f1); live with the next deploy. Case managers and super admins now get the redesigned Messages
screen with "Conversations | Reported"; `LegacyMessagesPage` and the old example-conversation half of
`DummyRows` are deleted. `?show=reported` still works; every reported-message test kept and moved to the
new switch. No database change. messages.spec passes on all three projects (174). D-469.

## Messages & notifications · Will's sign-off (10 October 2026)

Merged to `main` by the merge desk, 10 October (no migration). Will approved the four Text alerts texts and the staff
invite email (English, in his words: no expiry days, "Accept invite", human). The alert texts and the email
now carry his name; the other languages are drafts approved to learn from. Nothing sends yet: the alert texts
are not queued by anything, and the email needs the function deployed, the mail domain and its secrets, and
`INVITE_EMAILS=on`. D-461.

## Messages & notifications · staff invite email (10 October 2026)

Merged to `main` by the merge desk, 10 October. A staff invite's email now has a
queue (`20261010063304_…`, expand only, **applied to the live project 10 October**; read back:
forced RLS, no client grants, the sender's functions service-role only), a sender
(`supabase/functions/send-invite-emails`, **not deployed**, off unless `INVITE_EMAILS=on`) and
first-invite wording in seven languages (English signed by Will, D-461; the rest are drafts).
D-450. What Will has to set up, in order: `docs/email-setup.md`. Checked: config 831, database
suite passes (with `24_staff_invite_emails_test.sql`), Storybook builds, fit audit on the new
page clean. Not done: the expired-link email, an email for staff who already have accounts,
the privacy line about the mail service.

## Arabic reads in the right order (9 October) — 0.51.1, merged 10 October

D-435, on `claude/amazing-archimedes-qvgnt2` (`main` at `8dee5d4` plus this; merged
to `main` on 10 October at Will's word). An English name, address or date written into an Arabic
sentence was pulled apart by the Arabic around it — `places.near` with `1231 N
Broad St, North Philadelphia` drew `… St, North Philadelphia 1231 بالقرب من`.

- **Fixed.** `t` wraps each text value in invisible first-strong isolates when the
  language reads right to left (Arabic only); every other language is byte for
  byte as it was. Numbers are not wrapped. `tPlain` is `t` with nothing added.
- **Where `tPlain` is used, and why it matters.** An isolate in an accessible name
  or `alt`, in text only a screen reader reads, or in what goes to a share sheet or
  the clipboard is an invisible character in a string that something else reads.
  Forty-one call sites in 29 files were switched; the share and copy functions also scrub. The rule
  for the next session is in `CLAUDE.md`, and `audit:fit` fails on a miss.
- **Texts and emails** fill their own templates and are untouched (tested).
- **Seen on the Arabic stories:** the address reads in order and a line too long
  for the area chip loses the end of the address, not its street number; a date
  after "Pam:", the signed-policy counts, the points left to a level and the full
  stop at the end of an English message were all misordered and are fixed.
- **No native Arabic reader and no screen reader has seen any of it.** See
  `docs/before-launch.md`.
- **At merge:** `gallant-clarke`'s `fit-known.json` needs two `ar|ellipsis|…`
  entries for the area chip's long address (`areachip--long-address` and the new
  `areachip--arabic`; reason: a long address ends in an ellipsis by design), and its
  `ar|spill|…long-address` entry becomes unused. This branch also moved off D-434
  (see `docs/allocations.md`). **Done at the merge (10 October):** the `long-address` ellipsis is in
  `fit-known.json` and the old `ar|spill` entry is gone; `areachip--arabic` needs none
  (its ellipsis is the story's own in every column).

## Messages & notifications · Twilio receiver (10 October 2026)

Merged to `main` by the merge desk, 10 October. `sms-inbound` (**not deployed yet**: it is deployed
together with Will's Twilio step and his go, and is off unless `SMS_INBOUND=on`) records a STOP or
START reply, after checking Twilio's signature; migration `20261010081342_…` (**applied 10 October**,
read back: both functions service-role only) adds `record_sms_stop` / `record_sms_start`. Until it is switched
on and Twilio is pointed at it, Pam still does not learn a STOP. Setup: `docs/sms-setup.md` § 3.
YES/NO replies are not built. D-460.

## Places & programs · reported places screen (10 October 2026) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/places-programs-reported-places` (dca16c6). A page at `/places/reported/` for admins and case managers, linked from the profile and the reported-place bell row. Only a super admin can keep or remove; case managers read. No database change. Shared files touched: `ProfileView.tsx`, `app/notifications/page.tsx`, `ReportedPlaces.tsx` (buttons only when allowed). Figma flow map not republished.

## Places & programs · a trip names its service (10 October 2026) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/places-programs-trip-service` (D-470). Migration `20261010121853`, expand only: `appointments.program_service_id`, a new door `book_trip_at_service`, `my_trip_services()`; `book_trip` keeps its signature and is now a one-line wrapper. **Applied live at merge**, read back (all three bodies identical to the file, grants unchanged). Test `33_a_trip_names_its_service_test.sql`. Later contract step: drop the old `book_trip` by a manual SQL file once no live app calls it. Next: `log_call`.

## Places & programs · planning a trip earns points (10 October 2026) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/places-programs-trip-points` (D-468). Migration `20261010115117` replaces `book_trip` (same signature): 25 points once per place ever, three a day, members only. Expand only; **applied live at merge**, read back (body identical to the file, grants unchanged). Test `32_plan_a_trip_points_test.sql`. The Points screen lists it as "Plan a trip to a place". Next: `program_service_id` (contract), then `log_call`.

## Places & programs · the Points promise (10 October 2026) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/places-programs-points-promise` (4bf85c2). "Ways to earn" lists only what Pam pays today (save a place +5, finish setup +25), driven by `AWARDED_TODAY`. The proposal for making plan-a-trip and call-a-place real is in `docs/points-awarding.md`, waiting on Will. No migration.

## Places & programs · cancel a visit, past visits (10 October 2026) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/places-programs-cancel-trip` (599f2e8). No migration: the database already cancels a cancelled trip's day-before text (`sync_trip_reminder`), now attacked by test `35_cancelling_a_trip_cancels_its_text_test.sql` (two trips, a sent text kept as history, no second cancel or move, moved close then cancelled). The place page offers "Cancel this visit" (asks first; a failed cancel keeps the visit); Trips has a "Past visits" section. Seven new strings: the six translations are Piper's drafts, for Lena to review. Not yet: attended or missed visits listed; cancelling a visit a program booked (D-316).

## Places & programs · calling a place earns points (10 October 2026) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/places-programs-call-points` (D-472). Migration `20261010122206`, expand only: `log_call` (10 points, once per place, five places a day, members only; a staff tap is ignored). **Applied live at merge**, read back (body identical to the file; signed-in only, not anon). The place page reports a tap on a phone link, fire and forget. Test `34_call_a_place_points_test.sql`. The Points screen's Call row now shows.

## Places & programs · the day-before reminder gaps (10 October 2026) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/places-programs-reminder-gaps`. Migration `20261010130831`, expand only: evening visits are texted on the day before (five minutes before the member's quiet hours begin, the merge desk's rule), texts turned on later queue the reminders for future trips, and the place name and street are passed whole (the renderer cuts at a word). **Applied live at merge** (recorded as 20261010131522), read back: all five bodies identical to the file, service role only, both triggers in place. Test `37_day_before_reminder_gaps_test.sql`; Nico's test 36 had its gap 1, 2 and 3 checks flipped at merge. Still open, both pinned or noted: quiet hours changed *after* planning do not re-time a reminder until the trip changes (KNOWN GAP 1b in test 36); and the dispatcher's `in_quiet_hours` (0039) reads New York time, so for a trip in another time zone it can hold a text this trigger placed just before quiet hours. Fine for the Philadelphia pilot; fix before a second city.

## Places & programs · the super admin reviews programs (10 October 2026) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/places-programs-review-queue` (D-479). Migrations `20261010134145` (review function, list, closing trigger) and `20261010134146` (backfill), expand only, **applied live at merge** (recorded as 20261010140620 and 20261010140632), read back: the three bodies identical to the file, the closing trigger in place, the backfill wrote six 'approved' rows (none with a submitter: no organisation has exactly one profile); test `41_a_super_admin_reviews_a_program_test.sql`. App: Programs to check (list + a page per program) from Profile and Requests. No text and no bell row yet. A leader asked for changes re-sends since 5b (merged right after).

## Places & programs · quiet hours re-time queued reminders (10 October 2026) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/places-programs-quiet-hours-retime`. Migration `20261010133227`, expand only: changing quiet hours re-runs `queue_trip_reminder` for every future trip (consent still checked inside). **Applied live at merge** (recorded as 20261010133736), read back: body identical to the file, service role only, the trigger beside the turn-on one. Test `39_quiet_hours_change_retimes_texts_test.sql`; test 36's gap 1b flipped, so every gap the rehearsal found is closed. A story "Trips with a past visit" (for Wren's "Planning a visit").

## Places & programs · a leader switches between their programs (10 October 2026) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/places-programs-switch-programs` (D-318). No migration. `/program/switch/` and a Your programs row; the lead's pick is kept on that phone.

## Places & programs · booking for a member says it is an example (10 October 2026) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/places-programs-booked-for-honest`. No migration. The end screen after a program books a visit for a member is an example and says nothing was booked or texted. A real booking for a member is not built.

## Places & programs · a leader answers a request for changes (10 October 2026) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/places-programs-lead-reads-review`. Migration `20261010135742` (`resend_program_submission`), expand only, **applied live at merge** (recorded as 20261010140904), read back: body identical to the file, for authenticated (checks inside for the program's own lead). With part 6 live too, "Ask for changes" is safe to use. Test `43_a_lead_sends_the_program_again_test.sql` (numbered 42 on its branch; Nico's alerts test took 42 first). Edit and send again resends the same submission; a program being checked is corrected through it. Land after part 6.

## Places & programs · policies, part 3 of 4: a program sees who signed (10 October 2026) — READY, not merged (on top of part 2)

Branch `claude/places-programs-policies-p3` (D-485). Migration `20261010150922`, expand only: `program_policy_signers` (first name and date, never the picture). The Signed tab and the verified tick read it. Test `47_a_program_reads_who_signed_by_first_name_and_test.sql`.

## Places & programs · policies, part 2 of 4: members sign (10 October 2026) — READY, not merged (on top of part 1)
## Places & programs · policies, part 2 of 4: members sign (10 October 2026) — merged 10 October

Merged by the merge desk from 10b3f0b. Live: applied as 20261010151152; read back: both tables RLS on and forced, own-row select only, `program_policies_select_signed`, `can_read_policy_file` / `sign_policy` / `forget_my_signature` match the file by md5, authenticated only, anon nothing. For P3: `archive_policy` checks `is_active_account()`, `add_policy` leaves `p_replaces` out of the 30 cap, pin `reminder_is_quiet`'s search_path (advisor).

Branch `claude/places-programs-policies-p2` (D-485). Migration `20261010145337`, expand only: `policy_signatures`, `member_signatures`, `sign_policy`, `forget_my_signature`. A real place asks for what its program keeps in the database; a member reads each page and signs (draw or type); the program's record line is shown before signing; the transparency promise has its new line. Test `46_a_member_signs_a_program_s_policy_once_and_only_test.sql`. Wren's public post can go once this is merged.

## Places & programs · policies, part 1 of 4: a lead's real policies (10 October 2026) — merged 10 October

Merged by the merge desk from b928b2b. Live: applied as 20261010145952; read back: bucket `policies` private, 10 MB, five types; the three storage policies and four table policies; RLS forced; anon nothing; four function bodies match by md5.

Branch `claude/places-programs-policies-p1` (D-485, Will's card a25). Migration `20261010144052`, expand only: `program_policies`, `program_policy_files`, `add_policy`, `archive_policy`, the private `policies` bucket. A lead adds, opens, replaces and removes real policies; members see nothing new until signing (part 2). Test `45_a_program_s_policies_are_private_to_its_lead_and_test.sql`.

## Places & programs · review record, pending change, program services — the database half (10 October 2026)

Merged to `main` by the merge desk, 10 October, from `claude/places-programs-submissions-and-services`
(071c781, Piper; D-462, part 5a). **Live:** `20261010083715_…` (expand only), applied at merge and read
back: `program_submissions` and `program_services` (RLS on and forced; policies and client grants as
written), `withdraw_program_submission` and `request_program_change` (authenticated only), and
`submit_program` replaced with the same signature (live body identical to the file). It now also writes a
submission, and a withdrawn program no longer blocks a new send. The live app calls none of the new
pieces yet. Nothing here can approve a submission (part 6). Programs sent before this have no
submission row, so the app part must handle a listing in review with no record. Test:
`30_program_submissions_and_services_test.sql`.

## Places & programs · trips saved, the database half (10 October 2026)

Merged to `main` by the merge desk, 10 October, from `claude/places-programs-trips-database`
(7713e69, Piper; D-454). The app half (`claude/places-programs-save-trips`) followed later the same day.

- **Live:** `20261010074045_…` (expand): `book_trip`, `move_trip`, `cancel_trip`, `my_trips`, the
  `appointments_keep_reminder` trigger that queues, re-times or cancels the day-before text, and
  two columns. Read back 10 October; the app on `main` calls none of it yet.
- **Live, run by Will from the SQL editor 10 October (D-387):** `20261010074241_…` (contract)
  from `packages/db/manual/2026-10-10-appointments-written-only-through-the-trip-functions.sql`.
  Read back: only the three read policies remain, no insert/update/delete for `anon` or
  `authenticated`, one ledger row. Appointments are written only through the trip functions.
- The trips database test is `28_saved_trips_and_reminders_test.sql` (renumbered at merge: 26 and
  27 were taken by Messages).

## Messages & notifications · alert texts, STOP, promises (10 October 2026)

Merged to `main` by the merge desk, 10 October. Two migrations, **both applied to the live project
10 October** and read back: `20261010071947_…` (a stored STOP
cannot be cleared from the app: a person could clear their own at the API) and `20261010072848_…`
(the claim texts a reminder only to somebody who agreed). Text alerts offers switches only for what
is sent; the four alert texts are signed by Will (D-461). A STOP shows as "Texts are off". A STOP is
recorded once `sms-inbound` is deployed (D-460); nothing queues the check-in or "someone wants to
connect" yet. Samples file: nine texts. D-453. Text reminders' staff list (merged 10 October) names
only the alert texts Will signed: no "introduced to your program", no "your account changes".

## Design system & Storybook · staff rings in Storybook (10 October) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/pam-design-staff-rings` (db5e55f). The redesigned case manager and program lead Homes carry
D-198's rings in their own row (everyone on the list, lit first, no heading), from the old Home's data, in
Storybook only; staff still use the old Home. D-477. Fit: nothing new; axe clean. Needs Will: keep or drop (a22).

## Design system & Storybook · Points badge names (10 October) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/pam-design-badge-names` (8c859ef). Badge names on the Points screen wrap instead of being
trimmed with an ellipsis (Mira's call; four columns kept). Eight pseudo entries leave `fit-known.json`; the
three English ones were never in it. Not seen: a syllable hyphen on a real phone (headless Chromium has no
dictionaries).

## Design system & Storybook · scroller clip (10 October) — merged 10 October

Merged to `main` by the merge desk, 10 October, from `claude/pam-design-scroller-clip` (612d696). `audit:fit` treats a scroller as a clip (D-467): a line
wholly outside a scroller is not on screen, so the conversation threads' overlaps stop changing run to run.
Same build, old rule against new: overlaps 22 to 0, cuts and ellipses identical. 19 known entries removed,
16 added (the old Home's peeking saved card; four Explore pseudo clamps), all looked at. The Points badge
names, trimmed in English too, were fixed in the section above. Full audit at merge: 95 findings, all accepted.

## Design system & Storybook · live app shell (10 October)

Merged to `main` by the merge desk, 10 October, from `claude/pam-design-app-shell` (6318b48); live after the next production deploy. The redesigned tabs are the app (D-456): the role's tab bar
from the root layout, a gate under every tab screen (Help bar on each state), and `/`, `/saved/`, `/trips/`,
`/program/`, `/programs/`, `/profile/`, `/messages/` draw the redesigned screens. Kept on purpose: `/places/`,
`/interested/`, Messages for case managers and super admins, and the old Home (+ `/admin/`) for case managers
and program leads until the people strip's rings are on the new staff Homes (Mira). First-load **572.4 kB** gz of 600. A super
admin's view switch now reaches the whole page; a case manager's Home keeps "What you can see".

- Proven: web tests, build, Storybook build, e2e per file on three projects; whole suite narrow-320 279 pass.
- Not proven: Playwright per role at phone size on the built app; 5 `audit:fit` entries not in the known
  list (3 Block conversation stories, 2 saved-trips with a clock-minute key), none in a screen changed here.
- Needs a human: Will's answer on the people strip's D-198 rings (asked by Mira); the five `people-strip` specs pass on the old Home.

## Design system & Storybook · language tag (10 October)

Merged to `main` by the merge desk (5dd52b8), 10 October. Job from Will via Mira: a short English tag before a
language's own name, so a person can see which language a row is before they can read it (D-451).

- **`@pam/ui`:** `MenuItem` takes `tag?`, `lang?`, `valueTag?`; a `ChoiceChips` option takes `tag?` and
  `lang?`. All optional; a row or chip without them draws exactly what it drew (checked against a
  snapshot recorded from `main`).
- **The tag** is a 43px cell (3.6em, the widest of EN, ES, PT-BR, ZH-CN, ZH-HK, RU, AR plus slack),
  quiet, left to right, `aria-hidden`, at the start of the row (the right in Arabic). `lang` goes on a
  span round a row's label and on the button of a chip, so a screen reader speaks the name in its own
  voice. `valueTag` is the same tag at its natural width, before a row's value.
- **Nothing uses it yet**; Lena's Language list, sign-up and Profile will. Stories: Components ›
  Navigation › MenuList (Language tags, Arabic, Spanish, Value tag) and Inputs › ChoiceChips (new).
- Verified: 116 UI tests, 48 web tests, typecheck, Storybook build, and the full fit audit on the merged
  tree (471 stories × 7 languages: 26 new in a language, all 26 accepted, 0 not). Not run: the
  Playwright browser suite, which is what measures the tag's colour contrast.

## Messages & notifications · Reported in the new Messages (10 October 2026)

Merged to `main` by the merge desk, 10 October (no migration). The redesigned Messages screen has "Conversations | Reported" for case managers and
super admins, with `?show=reported` working, so the old `/messages/` page can go. The old page is still the live
route until Dot's shell merges; deleting it (and `DummyRowsLazy`) is a follow-up after both. D-464.

## Messages & notifications · Block (10 October 2026)

Merged to `main` by the merge desk, 10 October (no migration: 0076 is live). A conversation's ⋯ menu has
Block this person (asks first) and, once blocked, Unblock; the composer gives way to a notice for both
sides, and the person blocked is told. The database half was 0069/0076. D-463. Test:
`31_block_in_conversation_test.sql` (renumbered at merge: 30 went to Places). The terms and privacy page say what Block does since D-465 (merged 10 October). Staff can block too: kept as built (the merge desk decided, under Will's delegation).

## Design system & Storybook · area chip, fit audit (10 October) — merged 10 October

Branch `claude/pam-design-areachip-long-address`, merged to `main` on 10 October; D-448 confirmed by Mira. Job: Will asked for the
`AreaChip` long address in Spanish, Portuguese and Russian to be fixed; it turned out the chip was
fine and the fit audit was over-counting (D-448).

- **The chip needs no change.** At 320px it reads "Cerca de 1231 N Broad St, North Phila…" and keeps its
  pencil: Astryx's `Button` already trims its label with an ellipsis. `packages/ui` is untouched.
- **`audit:fit` no longer calls an ellipsis-trimmed line a spill** (`scripts/audit-language-fit.mjs`).
  The trimming is still reported by the ellipsis check. On `d4f325e` it dropped 9 of 35 new-in-a-language
  defects, all `spill`; no `cut`, `overlap` or `ellipsis` went. Five defects were looked at and accepted in
  `scripts/fit-known.json`, each with its reason.
- **How to read the audit's numbers:** the figure that matters is defects **not in the known list**
  (8 on `d4f325e`, 0 on this branch: the full run, 464 stories × 7 languages, found 26 new in a language and all 26 are in the known list). The raw count the script prints is a different measure.
- Outside this lane, seen and left: some English file names in the attachment lists are cut at the
  timestamp column with no ellipsis ("Free resume worksl").

## Seven languages, messages in your own language, and text that fits (9 October) — 0.50.1 and 0.51.0, merged 9 October (PR #29)

## Website · public site and help centre (10 October) — `apps/site`, on `main`

The public site, `joinpam.org` (Vercel project `pam-site`; the app is `app.joinpam.org`), is a static
Next export on the app's theme (`pnpm --filter @pam/site dev|build|test`; no Supabase, no sign-in; D-433,
D-437). **Home** and **Support**: a help-centre home with search, topics and "Start here". **Ten help
posts** (D-458), most confusing first, each saying who it is for, with numbered steps in the screen's own
words, tables, screenshots, and "Still stuck?" in the words of Pam's Help screen: who is my guide · texts
from Pam · what your guide, a program and others can see · joining Pam · joining as staff · Pam words ·
one phone, two sides · sending an invite · messages · points and badges, plus the earlier "Case manager
assignments" (only what is live; the full table is held behind `live` flags, D-449). **Two hidden
drafts** (`status: 'draft'`, not built into the site; Storybook only): "Keeping your program's listing up
to date" (until listing editing ships) and "Staff requests" (no way to ask to be staff since D-369). The
posts say only what is live, so they go stale as features ship: `docs/before-launch.md` lists which.
There is no `joinpam.org/j/<code>` short link: it was removed (the app has no `/j/` page); it returns when a text or email uses it, with its author.
New posts: the `pam-support-post` skill. Storybook: **Website/Journey** (every post, drafts with a banner)
and **Share and icon**. Checks: CI builds the site and runs `scripts/a11y.mjs` (axe, light and dark, desktop,
phone and 320px: 70 scans, 0 problems on 10 October); screenshots from `scripts/screenshots.mjs`. Not on the
user-flow map: it is not a screen of the app. Session logs: `docs/sessions/2026-10-09-a-public-website.md`,
`2026-10-10-0423-…`, `2026-10-10-0631-…`, `2026-10-10-0807-website-help-posts.md`.

**About Pam, in seven languages (D-466, 10 October; English signed, D-483).** One post at
`/<lang>/about-pam/` in English, Spanish, Brazilian Portuguese, Simplified and Traditional (Hong Kong)
Chinese, Russian and Arabic: own `<html lang>` (Arabic `dir="rtl"`), a language list, `hreflang`,
`x-default` English; not under a Support topic; one wordless illustration (header + 1200×630 share
image, alt text in all seven; `social/about-art.mjs`); and a section on the home page. **Will signed the
English on 10 October 2026, after the "human-touch company" line was taken out ("human-touch" is an internal
principle, never public copy; D-483)**: `/en/about-pam/` and the home section are live with the deploy
(`apps/site/src/content/signed-off.json` has `"en"`). The other six are drafts with no native reader (D-461),
built only in a preview (`PAM_SITE_DRAFTS=1`; CI runs axe on all seven).
Storybook › Website › Journey: **About Pam** per language (Draft banner) and **Home with About Pam**.
**Signing a program's rules (10 October, draft, not live).** A post for members and programs in seven languages (English: Support post `signing-a-programs-rules`; the other six at `/<lang>/program-rules/`); says only what Pam will do once Piper's signing screens ship. Hidden until `program-rules-live` and the language are set in `signed-off.json`; Storybook › Website › Journey › Program rules ×7. One sentence ("What your signature means") goes to a lawyer before launch.
Reminder texts are plainly "coming"; the home card "Keep going" now says the same and reads `VISIT_REMINDERS_LIVE` (`content/flags.ts`, 10 October).

## Seven languages, messages in your own language, and text that fits (9 October) — 0.50.1 and 0.51.0, merged 9 October (PR #29)

## Website · public site and support centre (10 October) — `apps/site`, preview only

Home and Support, for anyone to read before they have an account (D-433). Support's index is a help-center home: search, topics, popular articles. A
separate Next static export (`pnpm --filter @pam/site dev|build|test`) on the
app's theme, Figtree and Astryx components; no Supabase, no sign-in. Support's
first post, **Case manager assignments** (`src/content/`), has an introduction
and the "who can do what" table (a real table from 720px up, stacked cards
below). Built in CI (`pam-ci.yml`) and covered by `test/content.test.ts`;
looked at in light, dark and a 390px phone. **Preview-only**: deployed as a preview from the branch (D-437), and it should not
reach production until the post is true: taking on, handing over and unassigning a member, the
Unassigned filter and "Turn back on" are not built (backlog, D-415) —
`docs/before-launch.md`. Deploy steps: `docs/deploying.md`. Storybook has a **Website/Journey** group (Home, Support, Support search, Post — every link works; D-437). It has its own Vercel project, **`pam-site`** (Vercel Auth off; previews from this branch; production is `main`, not merged). The site has a social preview ("City services in your pocket") and a favicon, both previewed in Storybook › Website › Share and icon (D-437). Every Pam website — the site, the app, Storybook — has the same "p" favicon, generated by `scripts/make-icons.mjs`. New posts: the `pam-support-post` skill. A post can be a **draft** (`status: 'draft'`): not built into the site, shown in Storybook only. One is held: "Keeping your program's listing up to date", until the listing-edit feature ships (before-launch). **The first post now says only what is live** (D-449); the full table is held behind `live` flags until its screens ship. Checked 10 October: axe on the built site (20 scans, 0), the language-fit audit on the Website stories (0). Not on the user-flow
map: it is not a screen of the app. Session log:
`docs/sessions/2026-10-09-a-public-website.md`.

## Seven languages, messages in your own language, and text that fits (9 October) — 0.50.1 and 0.51.0, on a branch


D-421 to D-423, **on `claude/gallant-clarke-0dhizj`, which is
`claude/pam-storybook` (through D-411, `1a89000`) plus `main` (through D-420,
`932d052`) plus this work; none of it is merged to `main` yet and none of its
migrations is on the live project** — correction, 9 October, later: 0083, 0084 and
0079–0081 (the other branch's) are now live; 0082 is `main`'s and is live; only
0085 is not).

- **Languages (D-422).** English, Spanish, **Brazilian Portuguese, Simplified
  Chinese (Mandarin readers), Traditional Chinese (Cantonese readers),
  Russian, Arabic**. One registry (`packages/config/src/i18n.ts`); the six
  non-English bundles load when picked, behind a switching screen that says
  what is happening in the language being switched to; plural forms where the
  language has them; right-to-left for Arabic; the phone's language as the
  starting point (never saved as a choice; nothing uses location). **Native
  speakers have not read any of the six new ones** — the first item in
  `docs/before-launch.md`. Texts and emails stay English/Spanish (A24).
- **Text fits (D-422).** Wrapping `@pam/ui/Button`, `Badge` and `Segment`
  (Astryx's trim a label to one line); titles that step down 34→24px for a
  word that cannot wrap; notifications in full; and more. Checked by
  `pnpm --filter @pam/web build-storybook` then `audit:fit` (455 stories ×
  7 languages at 320px; English is the baseline). **353 new defects at
  first, 29 now, each looked at** (see D-422). The audit is a floor: it
  cannot judge a translation or see real phone fonts.
- **Messages in your own language (D-423) — built, off.** Migration 0084,
  the `translate-messages` function, the thread UI ("Translated", "Show
  original"), seven languages of copy, and the privacy section that appears
  with the switch. `MESSAGE_TRANSLATION.enabled` is `false`, and the function
  answers `{enabled:false}` unless its own secret is set. What is owed first
  is in `docs/before-launch.md`.
- **Spanish, spelled properly (D-421, 0.50.1).** 172 strings got their
  accents, ñ and ¿ back; spelling only, checked by script.
- **Texts and emails in every language (D-424, D-430) — approved by Will to learn
  from; not yet deployed.** 53 text drafts (pt-BR 15, zh-CN 12, zh-HK 12, ru 7, ar 7)
  and the invite email in all five carry Will's approval of 9 October ("no native
  reader yet"); pull a language by emptying its `reviewedBy`. A text always goes out:
  English if the person's language is not signed or cannot be sent safely. The live
  `dispatch-sms` (v15) is older than the repo ("PAM:" prefix, English/Spanish) and is
  **not redeployed** — see before-launch (the carrier filing comes first). 160
  characters, or 70 where the script needs the other encoding, **except the three
  appointment reminders, which may take two segments (134) in Chinese, Russian and
  Arabic (D-431, Will)**; a justice-word list per language, applied again in the
  dispatcher; one STOP table the dispatcher and the config package share; a
  parity test renders both. **Migration 0085 (not applied; by hand, and nothing waits on it)**
  keeps the language a person asked in on staff requests and invite emails. The
  app sends it (`p_language`) and, while the database has no such parameter,
  asks again without it (`rpcLanguage.ts`); `packages/db/manual/2026-10-09-
  language-where-there-is-no-profile.sql` applies it whenever convenient.
- **Keeping the languages in step (D-425, A25).** `locales/ledger.json` +
  `copy:status|draft|ack`: a reworded English string fails the tests until its
  six translations are answered or kept on purpose. Storybook's *Pseudo-language*
  (English +45%), a `PAM Language fit` workflow on pull requests, web unit tests
  now in CI. How: `docs/copy-changes.md`. Numbers (D-, A, migrations) are claimed
  in `docs/allocations.md` (D-426). **The fit check has its baseline (D-434):**
  the full audit's 137 defects were looked at and 121 distinct ones are in
  `apps/web/scripts/fit-known.json` with reasons; one real fault was fixed (the
  header's invisible compact title pushed its buttons off the screen); the tab bar
  is left for Will (before-launch). The job takes about an hour (limit 90 minutes).
- **An address can be copied or opened in a maps app (D-439, 0.52.0).** On the
  address card of a place or program: a small 32px copy button (no ring: Will's rule for
  copy actions inside a card), the address itself a link that opens a drawer with Google
  Maps and Apple Maps as Will's own app icons, one corner radius for both, and the address kept
  in its own reading order in Arabic. The drawer's rows are flush with its title, each
  app says "Opens in app", and on a phone a tap opens the app or, failing that, the
  App Store / Play Store page (Android has no Apple Maps row). Eight strings in seven
  languages (the six are machine drafts). **The app-or-store hand-off has not been tried
  on a real phone** (before-launch).
- **Super admin screens on the latest templates (D-444).** Inviting is a page per kind
  (`/invite/new/?role=`), with the city asked there — Profile › Invite someone had been
  failing for a super admin because no city was sent. Requests are rows, and a request is
  a page with Approve and Deny pinned to the foot (`/requests/review/`). Everyone has two
  rows instead of a card of buttons. Every list of rows is flush with the page margin
  (`MenuList isInset` is the exception). Unused layouts and components were removed (see
  D-444 for the list and for what was kept on purpose: `VoiceInput`, the older
  `AppHeader`/`PageTitle` screens that are still the live app, and `/admin/`'s in-place
  invite). Browser test: `e2e/invite.spec.ts`.
- **A place has one layout (D-440).** The labelled-rows layout (Call this place,
  Their website, Save, Share, Flag) is retired everywhere, including Storybook, the
  components gallery and the program-request screen: a place is its details, a list of
  ways to reach it, and one button in the sticky footer (*Plan a trip* for a member,
  *How to get there* otherwise; nothing once a visit is booked). `PlaceDetail` lost its
  `phone`, `website`, `directionsHref`, `isSaved`, `onSave`, `onShare`, `onCall`,
  `flagHref` props.
- **Migrations 0083 and 0084 are live** (applied 9 October after a
  `list_migrations` check; `get_advisors` clean). 0083 is
  `profiles_language_supported` taking the five new codes; 0084 is
  `message_translations` (RLS on and forced, `select` for the people in the
  conversation only, nothing for `anon` — read back from the live database).
  They sit after 0082 (the other session's, live); 0079–0081 (photos,
  documents, link previews) went in after them the same day, and neither pair
  touches anything the other creates.
- **Merged with `main` (9 October):** the "your guide" wording, the account-limits
  sections and the short transparency screen (D-412–D-420) arrived in English
  and Spanish; the other five languages were written for all 32 of those
  strings in the same merge (drafts, for native review).
- **Two things to know about copy.** A reworded English string does *not*
  update the other six languages (a new key fails the tests, a reworded one
  stays stale silently); and every string anybody adds is now seven.

## Conversations, redrawn (8–9 October) — 0.45.5 to 0.50.0, on the branch

D-389 to D-411 (D-405: Trips' policies banner action is just "Sign"; D-406: a photo's name set like its time; D-408: photos are JPEG, PNG or an iPhone's, documents PDF or Word, and either can be pasted into the box; D-409: things are called Photo, Document or Link, and a refused file gets a shaking alert banner; D-410: a link shows its address instead; D-411: the conversation header is the regular one, ⋯ outlined, Messages rows flush left, no button pre-chosen in dialogs), **on `claude/pam-storybook`, not merged to `main`.** A
conversation's header says who the person is on a line under the name —
"Program lead at Example Food Pantry", "Case manager" (D-395). Each day opens
with one divider ("Today", "Yesterday", a weekday, a date). Bubbles carry no name or time: mine are light green on the
right, theirs grey on the left with their photo, and a sideways drag slides
the times in at the right edge (`RevealTimes`; each message keeps "name,
time" as its screen-reader label). The composer is one rounded field: the
mic bottom left, a round send button bottom right, grey until there is text,
then dark green; every icon in the conversation at stroke 2.25. Bubbles sit 12px from the screen
edge, the composer 8px from the sides and at least 40px off the bottom,
that room inside the dock's frosted fade so the conversation runs to the
edge (D-391, D-393, D-396); mic, photo and idle send in the secondary icon
grey (D-396); the box grows to 8 lines, and while the mic listens it
scrolls to the newest words (D-397); the jump-to-newest button is white with a 24px arrow, grows in as it fades
in, and swells then fades when tapped (D-398, CSS, none with reduced motion). Each day is a section: 32px above its divider, 16px below; message
and composer text are 16px (D-392, A21).

**Photos (D-394, 0.46.0).** A picture button beside the mic sends a photo
(with or without words), shrunk to 1600px and stripped of where/when on the
phone, into a private per-conversation folder (`message-photos`, 0079).
Only the two people see it; a reported photo reaches the report's reviewers
and nobody else (`test/15_message_photos_test.sql`, 18 checks). Photos are
downloaded with the person's sign-in, never handed out as links. The
transparency screen, privacy notice, terms and staff sign-up copy name
photos. **0079 is live (9 October)**: applied through the connector, without
the `drop … if exists` guards the connector hangs on (no-ops on objects that did
not exist yet), and read back (private bucket, three policies, constraint, no
`anon` access).

**Documents (D-399, 0.47.0).** A document button beside the photo button
(and a drop onto the conversation, or a paste) sends a PDF or Word file, 10
MB at most, into a second private bucket (`message-files`, 0080) with the
photo rules; the message carries its name and size, and the file is fetched
with the reader's sign-in only when tapped. A Google Docs link in a message
gets a card that opens it in Google. Copy everywhere that named photos names
documents (`test/16_message_files_test.sql`, 23 checks; legal test).
**0079, 0080 and 0081 are live (9 October)**, applied one by one through the
connector the same way.

**Header, composer and viewer (D-400, D-401, 0.47.1).** The visit card is
the compact `StatusCard`; the subtitle is one line (the blurred fade under
the header was removed by D-411); the
Messages list preloads the conversation's code. The composer's bottom
corners round to 32px around the send button; photos and documents sit in
an even 8px rim; document icons are `FileTypeIcon` in Google-Doc blue
(`--pam-document-blue`); photos open in `PhotoViewer` on near-black with
48px dark circle buttons.

**The conversation's header (D-411, 0.50.0)** is the nested-page template
every other tapped-into screen has — back and ⋯ (outlined, `roundAction`) in
the same places, the name large, who they are on one line; no fade under it.
Dialogs and sheets open with focus on their content, not a button
(`landFocus`; the photo viewer focuses itself); undo check-in is a
`ConfirmDialog`. Messages rows start at the page edge.

**Stuff shared (D-402 → D-407, 0.49.0).** From a conversation's ⋯: one flat
list of policy-style rows, newest first — a 48px preview (photo; document
icon on its colour; a link's picture or a globe), the name on one line
(`MarqueeText` slides a cut-off name to its end once per view, ≤5s, never
with reduced motion), what it is in one word — Photo or Document (D-409), or
for a link its address (D-410) — and who over when at the end. Photos open
the viewer; documents download; Google Docs and links open in a new tab.
**Link previews** come from the `link-preview` Edge Function (deployed 9
October, verify_jwt): asked on send and for older links, it checks the
person through `link_preview_targets` (0081), opens https public pages only
(SSRF guard in `preview.ts`), and keeps title, site and a copy of the
picture in the private `link-previews` bucket (`test/17`, 17 unit tests).
**0081 is live (9 October)** — the table and bucket exist; the `link-preview`
function was already deployed and now has a table to write to. Until the app that
asks for previews is merged, links show as their address.

**What can be attached (D-408, 0.49.1).** Photos: JPEG, PNG, or an iPhone's
HEIC — the photo button asks for JPEG/PNG so an iPhone converts its own; a
HEIC dropped or pasted on a computer opens where the browser can read it
(Safari) and is refused in words where it cannot. Documents: PDF and Word
only. Picking, dropping and pasting into the message box all go through one
`take()`; a photo is shrunk to the JPEG that will be sent as soon as it is
picked.
A file Pam can't take gets a warning `Banner` in the box that shakes once
(450 ms; none with reduced motion) and closes with a 48px × (D-409).

## Release 0.45.0-two-roles (7 October) — one account, member and program

D-375, **merged to `main` 8 October; 0078 live 8 October (D-388)**
(order: 0075, 0076, 0077, 0078). `profile_roles` + acting `profiles.role`,
`switch_role`, `add_role_from_invite`, own-program guards; app: `roles` in the
session, `/use-as/`, `/invite/add/`. DB suite (file 14) and e2e 588/588
green. Left: notifications split by role; the transparency lines need Will's
wording before launch.

## Release 0.44.0-invites (7 October) — invites know who they're for

D-373, **merged to `main` 8 October; 0077 live 8 October (D-388)**.
Invites need a name and phone (`InviteForWho` on every invite screen);
sign-in asks `pending_invite_for_me()` and joins a person as their waiting
invite even without the link; a member's number with a staff invite gets
`/invite/in-use/`. Migration `0077_invites_know_who.sql` + DB test 13 (suite
green locally). Order for the live project: 0075, 0076, then 0077.
D-374 (one account, member + program; hidden from their own program's lists)
is decided and is the next phase — design note first.

## Release 0.43.2 (7 October) — forms, tidied; sign-up, cleaner

D-364 to D-372, **merged to `main` 8 October (PR #27)**. Add a program is
on the page, no card, no focus step, kind as `ChoiceChips` with Other,
"Review details" with the review note as a banner. Fields: label 8px above,
weight 600, typed text 16px. `@pam/ui/InfoTip` — a 36px circle
(`--pam-touch-target-tip`, documented in Foundations › Actions as the
explain-only exception) that picks the side of its button it fits on.
Sign-up: no cards, "You were invited as: **role**" banner, city a `Selector`
of served cities (text box only if the list fails — the one path left to
the waiting list), no role question (members only without a link), code
hint in an InfoTip. Member page: "Jordan has signed 4 of 4", green ticks.
`@pam/ui/Dropdown` (D-370): the list under the box, field-sized box, 48px
rows, heavier tick; "Create new booking". InfoTip padding 18px; signed tip
with a quiet heading and strong policy names (D-371). D-372: chevron 20px,
21px in; every input 16px (search pills were 14); InfoTip 20px padding and a
layered shadow; signed list 18px ticks, ruled.

## Release 0.43.0-programs (7 October)

A program lead's first day, D-352 to D-363. Home is Get started (program,
photo, calendar preview cards; New booking and Invite someone to Pam rows)
until somebody books, then the calendar: Day / Week / Month tabs (38px, below
the floor on Will's word, D-355), Search in the +, folded while setup is
unfinished, month days as a two-row strip with dots. Sign-up starts at About
you (Sign in does the phone), two steps for staff and three for members, the
count as a badge in each pinned button; What to expect for programs is four
illustrated lines; Text messages has bell bullets. A fresh account sees no
example notifications or messages and its Program tab is Add a program.
Shared now in `@pam/ui`: `SetupCard`/`SetupArt`, `DashedRule`
(`--pam-rule-dashed`), `BigButton badge`, `emptyState.icon`
(`--pam-empty-icon`), `BellOutlineIcon`. Story: Program lead › Prototype ›
New program lead. User-facing summary: the top of `CHANGELOG.md`.

**Known:** "a program" is only known once one is sent from this device — the
app has no "my program" query yet (D-218's follow-up, backlog).

## Release 0.42.0-members (6–7 October)

The member experience, revamped: booking ends on "Your trip is booked";
policies, Bring a friend (copy, drawer, share sheet), category
illustrations, staff photos, the program wizard, the policy upload card,
super admin → program lead messages. D-327 to D-351, merged to main in
#24, #25 and #26; the user-facing summary is the top of `CHANGELOG.md`.
Trips' sign-before-you-go banner (D-327) and the member prototype's kept
link (D-331) are part of it.

## Backlog

Open items Will asked to keep (7 October), newest first. Read this before
"Next" below, which is older.

- **Spanish wording pass** (D-403, for someone fluent to sign off): one name
  for a case manager (`gestor de casos` almost everywhere; "Gerentes de caso",
  "Un trabajador del caso", "administrador de casos" once each); "Visitas"
  vs "Viajes" for trips; "resume" → "currículum"
  (`category.sub.resume_interview_help`); "quiere trabajar en"
  (`transparency.canSee.goals`); "se inscriba" (`privacy.s.sharing.p2`);
  and whether the tú screens (sign-in, account, join, the redesigned member
  screens) should be usted like the rest.
- **Voice notes** (D-394): `attachment_kind 'voice'` is refused by 0079
  until voice notes get storage and rules of their own. Photos are built.
- **Assigning a case manager** (D-415). Only the inviting case manager is
  assigned, when the invite names one. A member who signed up alone, or was
  invited by a program lead or a super admin, has none and is read by no case
  manager since 0082. Needs a way for a case manager (or a super admin) to
  take a member on, hand one over, and see who is unassigned; the schema
  already allows one active case manager per member (`admin_assignments`).
- **How a case manager limits or pauses someone** (Will, 9 October, D-414:
  "We'll need to enrich how case managers do this later on"). Only the RPC
  `admin_set_access_status` exists — **no screen** (nothing in the app calls
  it), and it works for a case manager the person is assigned to (0082). What a
  limited member meets is built (D-427: the notice on Messages and in a
  conversation; a refused send and a refused New message say why).

  **Start here for the next session** (Will, 9 October: "I'll handle this in a
  new session"). These two items belong together: a limit button has nobody to
  act on until a member is assigned. Already true and tested, so build on it, do
  not redo it: the schema (`admin_assignments`, one active case manager per
  member), the rule that a case manager reaches only assigned people (0082, A22,
  `17_assigned_only_test.sql`), the transparency contract and the privacy section
  "When we limit an account" (Will approved the wording), the member-side notice
  and its tests (`e2e/messages.spec.ts`), and the Storybook state *Member / Created
  / States / Limited account*. Missing: the case manager's screen to take on /
  hand over / see unassigned members, and the limit / pause / turn back on
  control with a plain note (never the internal reason, §4.1). A change that adds
  a screen also needs its story, its route in `src/stories/prototype/routes.tsx`,
  and `docs/user-flows/flows.mjs` regenerated. Claim decision, amendment and
  migration numbers in `docs/allocations.md` (on `claude/gallant-clarke-0dhizj`
  until that branch merges).

- **One account, both roles — follow-ups** (D-375): notifications by
  role (the bell shows the acting side's; a dot on the switch for the other);
  the two transparency lines, worded by Will, before launch.
- **Super admin's program review queue** (D-386): specified in
  `docs/design/program-review-queue.md`, not built — submissions with a
  status, withdrawn-on-start-over, Discard, Approve / Ask for changes.
- **The review wait, for real** (D-381): in review / taking longer / needs
  changes, What you sent, and Home's status card run on sessionStorage and
  story state. Real status, Pam's note on "needs changes", and a text when it
  goes live need "Load a program lead's own program" (before-launch) plus a
  reviewer-note field. Delete and start over (D-385) clears it here only.
- **0075–0078 are live** (8 October, D-388): Will ran them from the Supabase
  SQL editor as one transaction (the connector can't run `DROP TRIGGER`/
  `DROP POLICY`, D-387); recorded in `schema_migrations` under their file
  names, so `list_migrations` matches `packages/db/migrations/` again.
  `get_advisors` shows only the by-design SECURITY DEFINER warnings.
- **Block in conversations** — 0076 adds `block_in_conversation` /
  `unblock_in_conversation` / `conversation_block_state`; the redesign's
  thread options have Report but no Block row.
- **The friend link is not read at sign-up** — Bring a friend's link carries
  `program` and `at`; joining ignores them, and the +150 for a friend who
  joins is not awarded by the database yet (D-330, D-336).
- **Program leads switch between their programs** — and Add a program
  returns to the new one (D-318).
- **Load a lead's own program** instead of the example (D-218's follow-up;
  on `docs/before-launch.md` under Programs since 7 October):
  then Get started and the Program tab know for real whether one exists
  (D-352, D-361).
- **Real staff photos to members** — staff can upload (D-345, 0074 live), but
  the booked place's badge and Messages still show the example photos
  (D-335) until they read `photo_url`.
- **Real-device QA in phone browsers** — Safari on iPhone, Chrome on
  Android (Pam stays a web app, D-351): copy-on-tap, the share sheet, the
  signature sheet, the friend drawer's drag.
- **DS for Claude Design** — usage rules in MDX (principles, buttons,
  spacing, type, colour).
- **Keeping seven languages in step (D-422).** A new English key fails the
  tests until all seven have it; a *reworded* English string does not, and
  the other six go stale without a word. A check that compares each
  translation against the English it was made from, and a script that drafts
  the new and changed lines for a native speaker to sign off, would close it —
  not built, Will to say.
- **Spanish has no dignity-term list of its own** (`language.ts` checks it
  against the English terms); the other six do. Found while adding the lists.
- **Counts that need no plural form still read "1 people" in a few places in
  English, Spanish and Portuguese** (Russian and Arabic have theirs because
  they must). Found by the plural tests, left alone because it is wording.
- **Wording noticed by the translation pass, not investigated:** a line in
  the points copy and a line in the messages copy that seem to say different
  things, and `place.dropin.monthly`'s phrasing. They are in the English; the
  translators kept them.
- **The audit's blind spots (D-422):** a translation's quality, text inside
  images, and real phone fonts for Chinese and Arabic (the container's are
  fallbacks).

## Next

Phase 1: invite redemption (generation works, and sign-up covers the person who
has no code), the map and list with three-category filters, and the Philadelphia
importer. The first UI task is the five-tab member shell on `AppShell` +
`TabList`.

Two pieces of security groundwork carry into it, both in `DECISIONS.md`:
move the internal RLS helpers into a `private` schema PostgREST does not expose
(D-025), and split write policies off `for all` so a read never evaluates a
write rule (D-026).

Two pieces follow directly from the messaging work now that verification has
caught up with it: the migration that closes D-163's gap (who may start a
conversation — a case manager's caseload, a program admin's enrolled
members — should be a database rule, not just this screen's own restraint),
and wiring `report_message()` to a visible action in the thread view.
`admin_visibility.test.ts` is built and passing (D-168); this session's four
migrations (`0060` onward through `0062`) are deployed and verified
(D-169), and reconciled with the other concurrent session's own `0054`–`0059`
by the merge that renumbered them (D-170). What is still genuinely
undone: `0052_saved_places_say_what_they_are.sql` had not reached the
live project (it went live on 20 September — "What needs a human" row 24), and the live RLS fingerprint has not been re-verified since
either session's migrations deployed — see the drift note under "What is
live" and the "Live RLS fingerprint" row under "What is proven."
