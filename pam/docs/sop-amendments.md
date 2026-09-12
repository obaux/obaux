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
| **supervising admin** (was `admin`) | Parole and probation officers, case managers | Watches their caseload's activity, within the §4.1 limits. Unchanged in substance; renamed so it is not confused with the role below. |
| **super admin** (new) | Will, and whoever he adds | Sees the error log, adds programs by hand, views the database, and creates other super admins. |

Notes that matter for the build:

- **Super admins are never invited and never self-selected.** They are created
  from inside the super admin screen by an existing super admin. The first one
  exists already, seeded directly (see STATUS).
- **A program admin chatting with a member is new surface.** §4.1 currently
  says a provider reaches a member only through an enrolment, an appointment or
  a connection. Direct chat has to keep that gate or it becomes a way for any
  registered organisation to message any member.
- **Renaming `provider` and `admin`** touches the database enum, every access
  rule, and the transparency screen's wording. It is worth doing once and
  deliberately, not drifting into.

## A2 — Role pills at sign-up (12 September 2026, Will)

> "During sign up, they can see pills to specify their role."
> "Supervising admins are not invite-only, they can create an account, and use
> this by inviting their case load participants. The business owners / program
> managers are both by invite, or by creating an account themselves."

**This reverses SOP §10 step 6: "Role is set by invite type and never
self-selected."** Will was asked directly and confirmed directly. Recorded here
so that the next person to read §10 knows the rule is gone rather than being
quietly broken.

Who can create their own account, as decided:

| Role | Invite | Self sign-up |
|---|---|---|
| member | yes, from their supervising admin | — |
| program admin | yes | **yes** |
| supervising admin | — | **yes** |
| super admin | never | never — created from inside the super admin screen |

### What follows from it, and is not optional

The concern was that a self-declared supervising admin could watch returning
citizens. Two properties of the existing design already contain most of it, and
they now have to be *kept* rather than merely being true by accident:

1. **A supervising admin sees nobody until somebody redeems their invite.** The
   caseload comes from `admin_assignments`, which is written at redemption and
   points at the admin who issued the code. A fresh self-registered account sees
   an empty list. It cannot browse, search, or reach a member it did not invite —
   that is a rule in the database, not a screen behaviour.
2. **The member is told who invited them, by name, before they accept.** The
   §4.1 transparency screen is shown at redemption and names the person and what
   they will be able to see. Somebody who does not recognise the name can stop
   there.

One thing that must be **added**, by the same logic that already governs
organisations (§6.4):

3. **A self-registered supervising admin is unverified until a super admin
   verifies them**, and a member redeeming their invite is shown that. An
   invited admin — invited by someone already verified — is verified on arrival.
   This costs a self-registering officer nothing except a badge, and it is the
   difference between "somebody says they are a case manager" and "PAM says so".

Without (3) the model is: anybody can register as a supervising admin, invite a
person by phone number, and on redemption see that person's programmes, visits,
points and activity. With (3) they still can — but the person deciding whether
to redeem can see that nobody has vouched for them.

**Status: decided, not built.** Needs the sign-up screens, an `is_verified`
concept on admin profiles, and the redemption screen to show it.

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
