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

**This contradicts SOP §10 step 6: "Role is set by invite type and never
self-selected."** That rule is not decoration — it is the thing that stops a
stranger signing up as a supervising admin and watching returning citizens.
CLAUDE.md lists it among the rules enforced by tests rather than convention.

The request and the rule can both be satisfied, because they are about different
roles:

- **Safe to self-select: member, and program admin.** A member choosing "I am
  coming home" gains nothing they could not get from an invite. A program admin
  who self-registers can list a program and see nothing about any member until
  an enrolment exists — and their organisation badge stays unverified until a
  human verifies it (§6.4), so a self-registered organisation cannot pass itself
  off as vouched-for.
- **Never self-selectable: supervising admin.** It comes from an invite issued
  by a super admin, because it is the role that can watch people.
- **Never listed at all: super admin.** Will's own instruction, and correct.

**Status: not built. Needs Will's explicit confirmation**, because if he means
the supervising admin pill too, that is a deliberate decision to let anyone
claim oversight of returning citizens, and it should be made in writing rather
than inferred from a sentence.

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
