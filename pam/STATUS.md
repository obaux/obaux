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
database, not in the function. All sixteen templates in the catalogue are now
signed off — the original thirteen (13 September) plus the two built this
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
| `@pam/config` tests | **695 pass** (9 October: all seven languages key-for-key with plural forms, the translation ledger and pseudo-language, texts and the invite email in every language, number collisions, the translation core and handler, the privacy-switch tie; was 231 on 21 September) | No SMS can send unreviewed *in its language*, over 160 chars (70 in Chinese, Russian, Arabic), a draft in a language nobody signed, a translation older than its English, with emoji, or with a term that reveals justice involvement. Locales are key-for-key. The transparency screen matches its contract, including the new `new_save_without_the_place` line (D-199). |
| `@pam/ui` tests | **79 pass** (9 October; 65 on 21 September) | Every component is axe-clean. `PlaceCard` offers exactly three actions in a fixed order. Reduced motion is respected. The mic hides when unsupported. |
| Database suite | **546 checks pass** (9 October, `0001`–`0085` with `0079`–`0081`, through `20_language_without_a_profile_test.sql`; 302 on 21 September, `0001`–`0067`) | See below. Grew from 286 with `07_people_activity_test.sql` (D-199): 16 checks that `people_activity()` returns a time and nothing else, only for `can_message()`'s own relationship, and that a case manager or a program admin still cannot read `saved_places` directly. `0067` is now live. |
| Live RLS fingerprint | **not re-verified since `0060`–`0062` deployed** | This row's last "identical to local" claim predates today. `0060`–`0062` (deployed under their original names, `0054`–`0056`) are now live and `get_advisors` came back clean, but the fingerprint comparison itself hasn't been re-run against the combined migration set — this repo and the other concurrent session's are now merged, but neither has been re-fingerprinted since (see D-169/D-170, and the drift note under "What is live") |
| Live anonymous attack | 0 rows leaked | A signed-out caller reads no profiles, messages, invites or audit rows on the real database, while still reaching the support number and the public catalogue |
| Browser a11y + theme (Playwright, full suite) | **828 pass** (9 October, `claude/gallant-clarke-0dhizj` = `main` at D-420 + `claude/pam-storybook` through D-411 + D-422–D-423, re-run on the tree merged with `main` and with `claude/affectionate-goldberg-tvu4sz` (D-427: 816 + its 12 for the limited-account notice), on a fresh `pnpm build`, three projects, 9 minutes at 2 workers; `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium`); includes `languages.spec.ts` — sign-in, About, Privacy and Terms in all seven languages with no word off the screen. Earlier: 639 (9 October, through D-402), 507 (21 September, `claude/pam-messenger-touchups`) | No WCAG AA violations at 320px or iPhone SE. Every control clears 48px. No horizontal scroll. The Astryx theme really resolves. Runs in dark mode as well as light. Includes the people strip (D-198) and the fourth round of phone touchups (A15, D-200–D-203): no help link on Messages, the thread frame fills the true viewport, the send icon matches the mic icon, and message rows measure the compact density directly rather than by on-screen distance. |
| First-load JS | **544.6 kB** of **600 kB** — within budget, 55.4 kB to spare (9 October, merged build after `main` and the other session's branch were merged in; only English is in it, the other six languages load when picked — D-413). Earlier: 505.3 kB, 94.7 kB to spare (ceiling raised from 500 on 21 September: A12, D-191) | §12 budget, measured gzipped on what `index.html` actually loads; `/signin` and `/gallery` carry `OnboardingSlides`' `framer-motion` weight on their own subpath export (D-140), every other route unaffected. Grew from 500.7 kB across the messaging sessions alone (1.0 kB, D-162), entirely new locale strings — irreducible without lazy-loading translations per route, which is out of scope. Grew a further 2.3 kB when merged with the other concurrent session's own additions (D-170). Grew 0.3 kB on the 17th (D-174), **and 1.0 kB on 20 September** (the messenger's locale strings and `Badge` in `NavTile`; `useConversations` and the whole Chat family were kept out of Home's first load — D-181, D-182) — the messaging-preview/demo-send/program-badge session's other additions (D-172, D-173, D-175) all landed off Home's own bundle and did not move this number, though D-175's `Token` component does add real weight to `/admin/`, `/person/` and `/directory/` individually (~4 kB each), not tracked by this check |

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
| 28 | **A Chromatic project token** | Storybook updating on every push | chromatic.com → sign in with GitHub → link `obaux/obaux` → add the token as the repository secret `CHROMATIC_PROJECT_TOKEN`. The workflow (`pam-storybook.yml`) skips itself until then. |
| 29 | ~~Where the dock's People and My Plan lead~~ **Answered by the redesign (D-210)** | — | Will, 1 October: the bar is Explore, Saved, Trips, Messages, Profile; Help moves to each screen's header and Profile. Next: his reference screenshots for the other screens, then wiring the redesigned views to routes and data. Walk it in `Prototype/Redesign — member` (D-211). |
| 30 | ~~Deploy `0071` and `0072`~~ **Done (Will, 4 October)** | — | `list_migrations` first: live ran to `0070`, no live-only drift; `can_message`, `messageable_people` and `open_direct_conversation` matched 0063 exactly, which 0072 was written against. Both applied; `get_advisors` (security) shows no new kind of finding (the definer functions are guarded inside, as every other one is; `invite_preview` and `request_invite_link` are anon on purpose). Spot-checked: `invite_emails` forced RLS with one policy and no anon access; `invites_log` and `staff_request_phone` not callable signed out. See D-264. |
| 34 | **Read the short version; translate the new strings** | D-416, D-417, D-427 | The look is chosen (icons) and built, and "your guide" is settled as the short word (Will, 9 October, D-427): the long phrase now appears only where it defines the word, and Help, the report screens and the paused / turned-off / limited notices say "your guide". Still Claude's draft for Will's word: the four short-version lines (`transparency.summary.*`) — a new promise. **Translated into the five other languages** on `claude/gallant-clarke-0dhizj` — D-412–D-417 in the first merge, D-427's eight (`access.limitedNotice`, `help.what.person`, `messages.report.*`, `notice.account_*`, `notice.feature_turned_off.body`) when the two branches met (all drafts for native review; `locales/ledger.json` records them). |
| 33 | ~~Apply `0082`~~ **Done (9 October, D-420)**; **update the language bundles for D-415's wording — done on `claude/gallant-clarke-0dhizj` (drafts for native review)** | Launch (D-415) | `0082_admin_reaches_assigned_only.sql` is live (`list_migrations` first, no drift; function checked; `get_advisors` unchanged in kind). The five other bundles carry D-415's wording on the languages branch. D-415 lists every changed string. |
| 32 | **Ship the policy, update five languages** (the limited notice is wired — D-427) | Launch (D-413, D-414, D-427) | Will, 9 October: the terms say a limited account can read but not send and a paused one cannot sign in; the transparency line names badges; members are told in the privacy policy (new section "When we limit an account", live since the merge, D-420). **Done (D-427):** `terms.s.limits.p3` ("Pam tells you it is off and who to call") is kept — a limited account sees the `account_limited` notice on Messages and where the composer was, and a refused send no longer says "Your connection dropped". Left: (1) the privacy section's wording is a draft for Will to edit; (2) the strings changed in D-412–D-415 and D-427 in pt-BR, zh-CN, zh-HK, ru, ar — **done** on `claude/gallant-clarke-0dhizj` once the two branches met (drafts for native review). |
| 31 | **The before-launch list** | Launch | `docs/before-launch.md` — Will's list of what must be done before real people use PAM. First entry: the email provider for invite links. **0068/0069** are merged as 0075/0076 with 0072's arm kept (D-346); they wait for Will to apply them live. Program sign-up and Add a program are a one-question wizard with a review (D-347); Add a policy is a card (D-348); super admin → program lead message from a place (D-349). |
| 34 | **Languages: native readers, the texts and emails, deploy 0083** | The new languages going to real people (D-422, A24) | Nobody who speaks Portuguese, Chinese, Russian or Arabic has read the six new bundles; start with the privacy page, the terms, the transparency screen, the notices and the seven "Switching to…" lines. Texts and the invite email have drafts in all five (53 texts) and are **sent in English until a person signs each** — `docs/before-launch.md` has what only Will can decide (two segments for reminders; re-filing the carrier campaign). **0083 is live** (applied 9 October, with the merge to `main`). Open question left at its default (no restriction): should staff be able to pick any language? In `docs/before-launch.md`. |
| 35 | **Messages in your own language: switching it on** | D-423 | Built and off. Needs the provider's no-retention terms in writing, the key as a function secret, a native read of `privacy.s.translation.*`, a way to tell members first, a per-person daily cap, then both switches. `docs/before-launch.md`. |
| 36 | **Merge of `claude/gallant-clarke-0dhizj` to `main`: one step left, Will's** | Will, 9 October 2026 (hold until 0079–0081 are live; then "Photo and messages are treated the same. Only reported if flagged.", D-428) | The branch is `main` plus `claude/pam-storybook` plus the seven languages and the other session's D-427, pushed and checked (e2e 828, Storybook, first load 544.6 kB, DB suite 546). It ships the photo, document and link UI, whose migrations 0079–0081 (and 0085) are not live. **Photos follow the message rule (checked), so "tell members first" no longer gates the merge.** Left: Will pastes `packages/db/manual/2026-10-09-photos-documents-links-and-languages.sql` into the Supabase SQL editor (one transaction, proved on a live-shaped database), then Claude reads it back and merges. If `main` moves first, merge it into the branch again (`list_migrations` first). |

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

## Seven languages, messages in your own language, and text that fits (9 October) — 0.50.1 and 0.51.0, on a branch

D-421 to D-423, **on `claude/gallant-clarke-0dhizj`, which is
`claude/pam-storybook` (through D-411, `1a89000`) plus `main` (through D-420,
`932d052`) plus this work; none of it is merged to `main` yet and none of its
migrations is on the live project** (0079–0081 are the other branch's and are
held; 0082 is `main`'s and is live).

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
- **Texts and emails in every language (D-424) — drafts, none signed.** 53 text
  drafts (pt-BR 15, zh-CN 12, zh-HK 12, ru 7, ar 7) and the invite email in all
  five, each language with its own empty `reviewedBy`; until a person signs a
  wording the recipient is texted or emailed in English. 160 characters, or 70
  where the script needs the other encoding (the appointment reminders have no
  text there); a justice-word list per language, applied again in the
  dispatcher; one STOP table the dispatcher and the config package share; a
  parity test renders both. **Migration 0085 (held, by hand, with 0079–0081)**
  keeps the language a person asked in on staff requests and invite emails; the
  app already sends it (`p_language`) — apply the migration *before* merging.
- **Keeping the languages in step (D-425, A25).** `locales/ledger.json` +
  `copy:status|draft|ack`: a reworded English string fails the tests until its
  six translations are answered or kept on purpose. Storybook's *Pseudo-language*
  (English +45%), a `PAM Language fit` workflow on pull requests, web unit tests
  now in CI. How: `docs/copy-changes.md`. Numbers (D-, A, migrations) are claimed
  in `docs/allocations.md` (D-426).
- **Migrations 0083 and 0084 are live** (applied 9 October after a
  `list_migrations` check; `get_advisors` clean). 0083 is
  `profiles_language_supported` taking the five new codes; 0084 is
  `message_translations` (RLS on and forced, `select` for the people in the
  conversation only, nothing for `anon` — read back from the live database).
  They sit after 0082 (the other session's, live) and *before* 0079–0081
  (photos, documents, link previews), which are still held; neither touches
  anything those three create.
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
photos. **0079 is not on live yet:** the connector stopped at its approval
step, so it waits for Will in the SQL editor (a tested one-transaction file;
before-launch).

**Documents (D-399, 0.47.0).** A document button beside the photo button
(and a drop onto the conversation, or a paste) sends a PDF or Word file, 10
MB at most, into a second private bucket (`message-files`, 0080) with the
photo rules; the message carries its name and size, and the file is fetched
with the reader's sign-in only when tapped. A Google Docs link in a message
gets a card that opens it in Google. Copy everywhere that named photos names
documents (`test/16_message_files_test.sql`, 23 checks; legal test).
**0079, 0080 and 0081 go to live together** in one tested SQL-editor file for
Will (before-launch).

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
**0081 is not live:** it rides in the 0079 + 0080 + 0081 SQL-editor file
(before-launch); until then links show as their address.

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
  `admin_set_access_status` exists — no screen, no member-facing notice (see
  `terms.s.limits.p3` in `docs/before-launch.md`), and any case manager with
  the person in their list may use it.

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
undone: `0052_saved_places_say_what_they_are.sql` has never reached the
live project, and the live RLS fingerprint has not been re-verified since
either session's migrations deployed — see the drift note under "What is
live" and the "Live RLS fingerprint" row under "What is proven."
