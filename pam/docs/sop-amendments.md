# SOP amendments

The build SOP v1.1 was handed to the project as a document, not a file in this
repository. This is where changes to it are recorded: what changed, who asked,
when, and what it means for the rules the original set. A future session should
read the SOP and then this.

Each amendment says plainly where it **contradicts** the original, because the
original's rules are load-bearing and several are enforced by tests. An
amendment that quietly reverses one of them is how a safety property disappears.

---

## A1 — Four roles, not three (12 September 2026, Will)

The SOP §3 names three roles: member, provider, admin. Will has asked for four,
with the admin role splitting in two and a new role above it.

| Role | Who | What they do |
|---|---|---|
| **member** | A returning citizen | Finds places and people, enrols, keeps going. Unchanged. |
| **program admin** (was `provider`) | Staff at an agency or nonprofit | Adds and edits their own programs, and **chats with members directly** — new. |
| **case manager** (was `admin`) | Case managers, and parole and probation officers — **one account type, two job titles** | Watches their caseload's activity, within the §4.1 limits. Unchanged in substance. |
| **super admin** (new) | Will, and whoever he adds | Sees the error log, adds programs by hand, views the database, and creates other super admins. |

Notes that matter for the build:

- **Super admins are created only by an existing super admin**, from inside the
  super admin screen. Never self-selected at sign-up, never issued by anyone
  else. The first one exists already, seeded directly (see STATUS).
- **"Supervising admin" was my word and it caused a mix-up.** Will confirmed
  there is one role for whoever oversees a returning citizen, whether their job
  title is case manager or probation officer. The role is called **case
  manager** throughout, because that is the phrase a member recognises and the
  one already used in the app's own copy.
- **A program admin chatting with a member is new surface.** §4.1 currently
  says a provider reaches a member only through an enrolment, an appointment or
  a connection. Direct chat has to keep that gate or it becomes a way for any
  registered organisation to message any member.
- **Renaming `provider` → program manager** touches the database enum, every
  access rule, and the transparency screen's wording. Worth doing once and
  deliberately, not drifting into. `admin` keeps its name in the database and
  reads as "case manager" everywhere a person sees it.

## A2 — Who can create their own account (12 September 2026, Will)

> "During sign up, they can see pills to specify their role."

**This reverses SOP §10 step 6: "Role is set by invite type and never
self-selected."** Will was asked directly, twice, and confirmed. Recorded here
so the next person to read §10 knows the rule is gone rather than quietly
broken.

| Role | By invite | Creates their own account |
|---|---|---|
| member | yes, from their case manager | **no** |
| program manager | yes | **yes** |
| case manager | yes | **yes** |
| super admin | only from an existing super admin | **no** |

So the sign-up pills offer two choices — *I run a program* and *I work with
people coming home* — and a member never sees them, because a member arrives
holding a code.

### What follows from it, and is not optional

The concern was that a self-declared case manager could watch returning
citizens. Two properties of the existing design contain most of it, and they now
have to be **kept deliberately** rather than being true by accident:

1. **A case manager sees nobody until somebody redeems their invite.** The
   caseload comes from `admin_assignments`, written at redemption and pointing
   at the admin who issued the code. A fresh self-registered account sees an
   empty list, and cannot browse, search or reach a member it did not invite.
   That is a rule in the database, not a screen behaviour.
2. **The member is told who invited them, by name, before they accept.** The
   §4.1 transparency screen is shown at redemption and names the person and
   exactly what they will be able to see. Somebody who does not recognise the
   name can stop there.

One thing must be **added**, by the same logic that already governs
organisations (§6.4):

3. **A self-registered case manager is unverified until a super admin verifies
   them**, and a member redeeming their invite is shown that. An invited case
   manager — invited by somebody already verified — arrives verified. This costs
   a real case manager a badge and nothing else.

Without (3): anybody registers as a case manager, invites a person by phone
number, and on redemption sees that person's programmes, visits, points and
activity. With (3) they still can — but the person deciding whether to redeem
can see that nobody has vouched for them.

**Status: decided, not built.** Needs the sign-up screens, a verified flag on
case manager profiles, and the redemption screen to show it.

## A3 — What "view the full database" means (12 September 2026, Will)

> "...and view the full database, in the admin account."

**This is in tension with the §4.1 transparency contract**, which PAM shows
members at onboarding and asks them to trust. It says, in the app, in plain
words: the person who invited you **cannot** see what you write in your chats,
and cannot see what you share with your buddies.

A super admin with unrestricted database access can read both.

Three honest options, in the order I would recommend them:

1. **Super admin sees everything except message bodies and buddy posts**,
   enforced in the database rather than by the screen not asking. The promise
   stays literally true, the error log and the operational view are unaffected,
   and the only thing given up is reading members' private messages — which no
   part of the product needs. **Recommended.**
2. **Full access, and the transparency screen changes to say so** — before it
   ships, not after. Members are told "the people who run PAM can read your
   messages". Honest, and it will cost trust with exactly the population that
   has least of it to spare.
3. Full access with the screen unchanged. Not an option. It makes the product
   say something untrue to people who were promised otherwise.

Worth separating from all of this: whoever holds the service key can already
read every row, and always could. That is true of every system and is not what
the contract is about. The contract is about what the **product** offers as a
feature, and what members were told.

**Status: not built. Needs Will's call between 1 and 2.**

## A4 — Super admin surfaces (12 September 2026, Will)

Three things, none of which exist yet:

- **Error log.** What failed, when, for whom, and whether anybody was left
  stuck. Distinct from the audit log, which records what people *did*.
- **Manual program entries.** A form that writes a `services` row by hand. The
  import machinery already refuses to invent facts (D-045, D-057); a human
  typing one should be able to, and the row should record who typed it.
- **Database view.** Read-only, scoped by A3.

Every super admin action belongs in the audit log, which already rejects UPDATE
and DELETE at the database level, including from the service role.

## A5 — Flagging a place that has closed (12 September 2026, Will)

The SOP has an import review queue (§5.2) for places arriving, and nothing for
places leaving. Added:

- **Any signed-in person can flag a place** — member, program manager, case
  manager. Whoever walked there finds out first.
- **The flag hides it immediately.** Not a queue: hidden until decided.
- **Only a super admin decides**, keep or remove, with a note. Removal sets
  `removed_at`, which the importers cannot clear (see D-072 for why this is not
  a DELETE).

This replaces what a case manager was previously going to use feature switches
for. A stale listing is a catalogue problem, not a member problem, and it should
never have been solved by restricting a person.

## A6 — Messaging is never switchable off (12 September 2026, Will)

Removed from §4.1's controllable features, and refused by the database. Every
other switch degrades an experience; that one isolates somebody from the people
the product exists to connect them to.

**Settled:** a case manager sees a message **only when somebody reports it as
unsafe** — the narrow path §4.1 already promised, and the one option of three
that required no change to what members are told. `messages` has no admin policy
at all; the quoted excerpt on the report is the only route, and since 0034 the
database writes that quote rather than the reporter. The transparency screen
stands as written.

## A7 — Who is told when something is flagged (12 September 2026, Will)

> "When a message is flagged, or a program is flagged, make sure to notify the
> case managers also, not just the admin."

A flag reaches the people it is about. It is not broadcast to staff.

| Event | Audience |
| --- | --- |
| A place is flagged | Every super admin (they decide whether it stays or goes) **and** the case managers of the members who saved that place — their person was planning to go there. |
| A message is reported | Every super admin **and** the case manager of the member the report is *about*: the **sender** of the reported message, not the person who reported it. |

### What follows from it, and is not optional

1. The audience is derived from the relationship — `saved_places` for a place,
   the message's sender for a report — never from a role list. A case manager
   with nobody affected is told nothing.
2. The reporter is never notified *as the reporter*. Reporting is not a status,
   and a notice back would tell the room who spoke up.
3. A notification carries a locale key and variables. Never a sentence, and
   never a line of anybody's message. §4.1 still decides who may read the words;
   a case manager reads them through the review screen behind the
   sensitive-information warning.
4. Both notices are written by database triggers, so a second code path cannot
   silently stop them.
5. Each panel — case manager and super admin — carries the list in its top bar,
   and the same notices appear inside the affected person's profile card.


## A8 — One screen without a help link (13 September 2026, Will)

§0 says every screen carries a visible way to get help. The reminders screen
(`/reminders/`) is the single exception, on Will's call.

It asks one question with two answers, both one tap away, and neither can fail
in a way that calling PAM would fix. A third button beside them makes the
question look harder than it is — and the screen a member is sent to right after
their very first sign-in is the wrong place to imply they might need rescuing.

The rule is unchanged everywhere else. Anyone adding a second exception should
be able to say the same three things about it: one question, no failure mode,
and help one tap away wherever the person lands next.


## A9 — A second screen without a help link (13 September 2026, Will)

The way in (`/signin/`) is the second and, for now, last exception to §0's
"every screen has a visible way to get help". Will asked for the link removed
when the screen was rebuilt around the onboarding slides: between the slides and
the card it read as a fourth thing to decide before anybody had decided the
first.

A8 set the bar for an exception — one question, no failure mode help would fix,
and help one tap away wherever the person lands next. Sign-in clears two of
those three outright, and answers the third differently: signing in *can* fail,
and every one of its failure states already renders a notice carrying PAM's
number. The help path is therefore present exactly when it is useful and absent
when it is noise, which is a stronger position than a permanent ghost button.

What is not negotiable, and is asserted by a browser test: the number appears on
this screen the moment anything goes wrong. Anybody removing that has removed
the exception's justification, not just a notice.


## A10 — Waiting is a spinner, not a sentence (16 September 2026, Will)

§2.4 asks for plain language on every screen, and the SOP's loading guidance
assumes copy. PAM's waiting state is now a centred spinner with no visible
words, on Will's call.

The reason is that the state is not one screen, it is all of them. PAM is a
static export and the header's links are real anchors, so changing tab is a full
page load: every screen shows its waiting state every time somebody moves. One
sentence therefore has to be true everywhere, and the one we had — "Finding
places nearby..." — was true on two screens out of nine. It greeted people on
the way to their own account, their saved places and a caseload.

**Where this contradicts the original.** §2.4 would have this state carry
plain-language copy. It carries none. The argument is that plain language is a
rule about *explaining*, and this state has nothing to explain: it resolves in
under a second, or it becomes an error notice that does explain, in words, with
a phone number. A ring needs no reading level and no translation, which is worth
more here than a sentence that has to be right in English, in Spanish, and in
whatever PAM is translated into next.

**What did not change, and is asserted by a browser test.** §0 still holds: the
home screen's waiting state keeps its help bar, because a screen with nothing on
it but a ring is exactly the dead end §0 forbids, and this state is what a dying
connection actually shows somebody. The label is announced to screen readers in
the member's own language even though it is never drawn. And the spinner slows
under `prefers-reduced-motion` rather than stopping — a still ring reads as a
broken image, and what was promised to somebody who asked for less motion was
less, not none.

Anyone replacing this with copy again should be able to name a sentence that is
true on every screen in PAM, including the ones that do not exist yet.

## A11 — PAM says what a place does, in its own words (16 September 2026, Will)

0017 and §0 between them said PAM adds no words of its own to a provider's
listing: a provider's name is theirs, shown as it is, and nothing PAM writes may
imply what a member is there for. PAM now writes one sentence about every place
in the catalogue, and shows it on the card and on the place's own screen.

**Where this contradicts the original.** The neutrality rule was written to stop
PAM labelling a person by labelling a place — "substance use treatment" beside
somebody's name on a shared screen is a disclosure they did not make. The rule
worked, and it left 754 places reaching members as a name and an address. "J J
Peters" tells nobody anything. Protecting a provider's framing at the cost of a
member's ability to choose is the wrong trade, and it was made by default rather
than decided.

Put to Will explicitly, with the 524 behavioural-health places named as the hard
case. His answer was to say what each place does, everywhere.

**What did not change.** The SMS half of 0017 stands exactly as written.
`name_may_disclose` still governs what may appear in a text message, and a
description may never be put in one. The distinction is consent in the ordinary
sense: a screen is something a member opened, on their own phone, at a moment
they chose. A text arrives on a lock screen somebody else may be holding, and
the SOP's rule that no SMS may reveal justice involvement is untouched.

**What the words may be.** Plainly what the place does and who may walk in, at
most 200 characters — a check constraint, not a guideline. From the source data
or a published source, never invented: `enrich-places` is not written yet and
nothing here guesses. The `flag_unapproved_rewrite` trigger still flags any
plain-language column a provider has edited, and 0050's approval step clears
`needs_review` only for rows PAM itself wrote and no provider has touched.

## A12 — The first-load budget is 600 kB, not 500 (21 September 2026, Will)

§12 said "Web first load under 500 KB JS," and `scripts/check-bundle-budget.mjs`
failed the build past it. The app has been over that line since 17
September — by 0.7 kB at first, 4.8 kB by the 21st — and every session
since has spent effort disclosing the overage rather than shipping the
screen it was building. Will raised the ceiling to 600 kB.

**Where this contradicts the original.** The number, not the reason. A
member on a prepaid plan and a throttled connection still pays for every
kilobyte, so the check still fails the build, the animation chunk still has
its own 40 kB ceiling, and the measurement is unchanged: what the entry page
actually loads, gzipped, polyfills excluded. What changed is that 500 was set
before the app had a design system, a messenger or two languages, and holding
it was costing more than it protected.

**What did not change.** Route-only code stays route-only — the Chat family,
the picker, example data and the reported-places list all load on their own
routes, not Home, and that discipline is what keeps a bigger number from
becoming a slope. 600 is a ceiling to build under, not a target to reach.

## A13 — The chat composer's send button is 48px, not 64 (21 September 2026, Will)

CLAUDE.md's rule is "48px minimum touch target, 64px primary buttons". The
message thread's one primary action — Send — is drawn at 48×48, a square
icon button beside the input, on Will's call after using the screen on a
phone.

**Where this contradicts the original.** The 64px number, for one screen.
The rule was written for a screen with one big thing to do — sign in, save,
send a report — where the button is tapped once and can afford to be the
largest thing there. A chat's primary action is tapped dozens of times per
screen and sits at the bottom of every conversation; at 64px it took a
quarter of the visible message area on an iPhone SE, and the message area is
what the screen is for.

**What did not change.** The 48px floor holds, and the browser suite checks
every control on the thread against it — send, mic and Report are 48px
squares, the input clears 48px on its own text and padding with no wrapper
around it. Every other screen's primary action is still `BigButton` at 64px.
Anyone shrinking a second primary action should be able to say why that
screen's action repeats the way a chat's does.

## A14 — A third screen without a help link: the conversation (21 September 2026, Will)

§0 says every screen has a visible way to get help. The message thread —
`/messages/thread/` — has none, on Will's call, joining the two screens A8
and A9 already named.

**Where this contradicts the original.** The letter of the rule, on one
screen. Three things make it the right call here. The person on this screen
is already in a conversation with their case manager or their program — a
human who can help, one message away, which is more than a phone number is.
The way back is pinned at the top of the screen and leads to Messages —
which, since A15, is itself a fourth exception and no longer carries the
bar; the chain now runs thread → Messages → the header's own mark → Home,
which always does, two taps rather than one. That is a real loosening of
the third test below, recorded here rather than left for the next reader
to notice as a discrepancy. And the thread is the one screen
in PAM with two pinned bars — header and composer — so a third would come out
of the messages, which is the screen's reason to exist.

**What did not change.** The way back is always visible (it is pinned, so
more visible than on any scrolling screen). The error, not-found and
signed-out states of the same route are ordinary `Page`s whose notices carry
the support number as they always did — only a conversation that actually
loaded is without the bar. The browser suite asserts the thread has no help
link, so the next person to add one back has to read this first.


## A15 — A fourth screen without a help link: the Messages index (21 September 2026, Will)

`/messages/` loses its `HelpBar` on Will's call, tested on the phone
alongside A13/A14's screens the same day.

**This is not A8's test restated.** A8 set the bar for an exception — one
question, no failure mode help would fix, and help one tap away wherever
the person lands next — and A9 already found a screen that fails the first
part of that test outright (sign-in is not one question) and stands on the
third instead. Messages is the same kind of exception, not A14's: A14 is
about *shape* (a screen with two pinned bars has no room for a third), and
Messages scrolls normally and has room. It is A9's kind of exception —
multiple actions, not one question — carried a screen further:

- **Not one question.** Messages lists every conversation, offers "New
  message," and (for staff) switches to Reported. Removing the bar cannot
  rest on A8's letter here, the way it did for the reminders screen.
- **No failure mode help would fix that the screen does not already
  handle.** Both scans this screen runs — conversations and reports —
  already render `Notice` with the support number the moment either
  fails offline or otherwise; a permanent bar sat above states that
  already carry the number to reach for.
- **Help one tap away wherever the person lands next.** From Messages: a
  conversation (which itself has no bar, A14, but is reached only from
  here) or a tap on the header's own mark, which always leads Home — and
  Home always carries the bar. The chain from a conversation is therefore
  two taps to Help, not one; recorded as a real loosening in A14's own
  text above, not left as a silent gap between the two amendments.

**What did not change.** The signed-out, loading and error states of this
route are ordinary `Page`s that still carry the notice pattern with the
support number, same as every other screen — only the loaded, ordinary
list is without the bar. `messages.spec.ts` asserts no help link renders
on the loaded screen, the same way `admin.spec.ts` and `consent.spec.ts`
already assert it for their own exceptions.
