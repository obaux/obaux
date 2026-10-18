# Message Pam: the super admin's side (plan, no code)

**Date:** 2026-10-18 · **Lane:** Accounts & invites (Ava) · **Status:** plan for Will's card; nothing is built before he
picks.

**Companion:** Nico's `docs/design/plans/2026-10-18-message-pam.md` covers the threads, RLS, migrations, sending, the
bell and texts, and the member's and program's side. This file covers what the super admin sees and does, and what the
person on the other end sees as the sender. Where this file needs something from Nico's, it says so and links there
rather than repeating it. The seam is under **Seams with Nico** at the end.

## What Will asked (02:39, via Mira)

Anyone in the app can message Pam, and it goes to the super admin's inbox. The super admin can message programs and
members. It is support, inside the app.

## The one thing to decide first: this reverses D-171 for members

- **D-171** (Will, September): "a super admin cannot send messages to a member, a case manager, or a program."
- **D-262** (migration 0072) already opened super admin ↔ case manager and program lead.
- **Super admin ↔ member is still closed.** `can_message` refuses it, and DB test 10 proves it.

Will's ask opens it, but in a narrower way than D-171 feared. D-171 was worried about the person with the broadest view
starting private conversations as themselves. Here it is **Pam**, the service, writing: one named sender, visible to
the person as Pam. It is not Will's own account.

So the plan keeps D-171's reasons and changes how it is applied:

- A super admin still can't open an ordinary person-to-person conversation with a member, and still can't read any
  conversation Pam isn't a party to. `ADMIN_CANNOT_SEE.message_bodies` stands.
- A super admin *can* write **as Pam**, in a Pam thread. The person can always see that they are talking to Pam.

Will should say this in his own words on the card. It then becomes a new decision that supersedes D-171 for members, and
D-171 keeps its other reasons. Lena's lane then tells members before it ships (see **Privacy**).

## 1. Where the inbox lives

**On the super admin's Home, as the first row of the list Home already has.** That is `RequestsScreen`'s `MenuList`,
today: Programs to check, Reported places, Waiting cities. Staff requests come after it.

- **Row:** "Messages to Pam" (Sage's words to sign). Message icon. Opens `/pam/messages/`, a `SubPage` with a round
  back to Home (`?from=home`, as the other rows do).
- **It goes first** because it's the only row where a person is waiting on an answer from Pam. Everything else on Home
  is a queue of things to judge.
- **The Messages tab stays as it is:** the super admin's own staff conversations (D-262) and Reported. Two places
  would confuse people if they held the same threads. They don't: one is Pam's, one is Will's own account's.
  - Open question Q2: whether D-262's staff threads should move into Pam's inbox once Pam threads exist. Staff already
    see that sender as "Pam team" (D-395), so for them it is already Pam in all but name.

**`/pam/messages/`, the list.** One row per conversation, newest activity first, in two groups:

1. **"Waiting for Pam"**: the latest message is from the person and nobody on the Pam team has answered it since.
2. **"Answered"**: everything else.

The screen title carries no count, because the groups say it. An empty inbox says so in one line, with no picture; Sage
has the words.

**Opening a row** opens the thread. Nico's thread view, with Pam as the speaker on the super admin's side
(see **§5**).

## 2. What each conversation row shows about who wrote

Only what the super admin can already see today, from the same functions. **`ADMIN_CAN_SEE` doesn't widen, and nothing
is added to `transparency.ts`'s lists for this.**

| Who wrote | Name line | Line under it | Where that comes from today |
| --- | --- | --- | --- |
| Member | First name | "Member · {region}" | Everyone (`directory_people`): first name, role, region |
| Case manager | First name | "Case manager · {region}" | Everyone |
| Program lead | First name | "Program lead at {program}" (D-395's line) | `programs_to_check` already pairs a program with its lead's first name |

Then, on the right: the time of the latest message, and a red count if it's unread (§3).

Under the name, one line of the latest message, cut to one line (`isDescriptionOneLine`, D-306). The super admin is a
party to this thread, so reading it is not reading someone else's messages.

**Left out on purpose:**
- **Last name.** D-588 lets the Pam team read it only through specific server functions (staff requests, invites log).
  Adding it here would be a new read path. If Will wants it, it is a decision of its own (open question Q3).
- **Phone, email, case manager, caseload, enrollments, visits.** None of these are things the super admin sees about a
  member today.
- **Access state.** "Suspended" or "limited" is shown on Everyone. Repeating it here is harmless, but isn't needed to
  answer someone. Left out until someone asks for it.

Each row is the same shape as a Messages row (`MenuList`, 64px or more, the whole row the target). The words above are
placeholders for Sage.

## 3. Unread counts (D-586)

D-586 says a filled red badge means "new since you last looked", and that is what the Home row shows.

- **On the Home row:** `badge` = how many conversations are waiting for Pam *and* have a message newer than Pam last
  read. `badgeLabel` says it ("2 new messages to Pam"). With none, there is no badge and no `value`. The row does not
  also show a plain count of everything waiting. The "Waiting for Pam" group on the list does that.
- **On the list:** an unread row's name is bold, with a red count of its unread messages, the same as a Messages row
  today.
- **Read state belongs to Pam, not to each account.** When anyone on the Pam team opens a thread, it is read for the
  whole team. It is one inbox with one queue. If two people answer, each sees the other's reply in the thread (§4).
  This needs a `pam_last_read_at` on the thread, or Pam's own membership row, in Nico's tables. Q1 to Nico.
- **The tab bar's Messages badge doesn't count Pam threads.** That badge is for the super admin's own conversations,
  and Pam's queue is on Home. Otherwise one message would light up both.
- **The bell** (Nico's): a new message to Pam is a bell item for the Pam team, "New message to Pam from {first name}".
  It is collapsed per thread, like messages today.

## 4. Who is "the super admin" for this, now and later

**Today:**
- `is_super_admin()` is `profiles.role = 'super_admin'` (migration 0033). In live data that is Will's account only.
  Robin in the example data is fictional.
- There is no support-staff role, and "Pam team" is only a label (D-395, D-588).

**The plan doesn't tie Pam's threads to Will's account.** A Pam thread has Pam as a party, not a profile (Nico's model).
Who may act as Pam is a question asked at the moment someone reads or writes:

- Add one function, `is_pam_team()`. Today it is `is_super_admin()` and nothing more.
- Every Pam-inbox function and policy (Nico's RLS, my list) checks `is_pam_team()`, never `is_super_admin()` directly.

**If Pam adds support staff later**, the change is one place:
- A new role (or a flag on a profile) that `is_pam_team()` also accepts.
- That role gets the Pam inbox, starting Pam conversations (§6), and the bell for it. It does **not** get approvals,
  reported places, programs to check, waiting cities, Everyone's demo switch, or staff requests. Those stay
  `is_super_admin()`.
- Each reply already stores its real author (Nico's), so the Pam team sees "Answered by Robin" in the thread for each
  other. The person never does (§5).
- Not planned now, but the model leaves room for: assigning a thread to one of the team, and a per-person "mine" filter.
- A DB test for the day it happens: a support account can read and write Pam threads and nothing else that
  `is_super_admin()` guards.

## 5. What the person sees as the sender

**"Pam".** Never a staff member's name, photo, initials or phone. This holds wherever it shows:
- the thread header;
- each bubble's speaker;
- the conversation row in their Messages;
- the bell;
- a text or email that says they have a message (Nico's templates);
- an export of their data.

- **Header:** "Pam", with Pam's own mark as the avatar. Dot draws it; it is not the generic initials avatar. The line
  under it (D-395) reads "Pam team" for staff today. For members it needs words that make sense to them. Sage proposes;
  something like "Pam support".
- **Bubbles from Pam** all read as Pam, whichever team member wrote them. The real author is stored for audit (Nico's
  column) and shown only to the Pam team, as a small "by {first name}" in the super admin's view of the thread.
- **"Pam" is a name, not a word, so it is never translated.** In Arabic it is isolated like any other name (`t`, not
  `tPlain`, on screen; `tPlain` in labels, D-435).
- **Why "Pam" and not a person:**
  - The person wrote to the service, not to whoever is on shift.
  - A staff name invites "ask for Robin next time". When Robin leaves, that breaks.
  - A returning citizen may be warier writing to a named individual at an authority than to the service they signed
    up to.

## 6. Starting a conversation as Pam

From where the super admin already finds people, so no new search screen.

- **Members, case managers and program leads: Everyone (`/directory/`).**
  - Each real row gets the message button on its end, as the case manager's Home has (D-227). Today real rows have no
    link at all.
  - The label is "Message {first name} as Pam". Tapping it opens the existing Pam thread with that person, or starts one.
  - The Demo view switch stays where it is. The message button sits beside it, and both stay 48px.
- **Programs: the program's page from Programs to check** (`/programs/review/?id=`).
  - "Message this program" writes to the program. Which account that reaches is Nico's model: D-541's single
    longest-standing lead, or all leads (Q to Nico).
  - There is no list of *live* programs for the super admin today. Programs to check shows only those waiting for a
    check. Messaging a program that is already live needs one of:
    - a "Programs" row under Everyone; or
    - Everyone's program leads, reached from their row.
  - Recommendation: use the program lead's row on Everyone for now, and make a live-programs list its own card. Q4 for
    Will.
- **Not from a staff request.** Someone asking to be staff gets an answer by approval or denial (D-584), plus the text
  reply (D-524). A Pam thread before they have an account would be a second channel for the same answer.

Before anything is sent, the composer says once, above the first message, that the person will see it from "Pam".
After that it says nothing more.

## Privacy, words and records

- **`transparency.ts`:** the lists don't change. Members are promised two new things, which Lena's lane writes and
  dates (§4.1 changes go to members before they ship):
  1. "Pam can write to you here."
  2. "Only the Pam team reads what you send Pam."
  - The join step's lines (`join.privacy.admin.*`) for staff say the same.
- **DB tests to add** (they live in Nico's migration, listed here so nothing is missed):
  - the super admin still can't read a member ↔ case manager thread;
  - a non-Pam-team account can't read Pam threads or `pam_inbox()`;
  - a Pam thread's person sees "Pam" and never an author id;
  - D-171's test 10 changes from "can't" to "can't, except as Pam".
- **Decisions, when Will picks:** one for reversing D-171 for members as Pam; one for `is_pam_team()`; and this inbox's
  shape.

## Open questions for Will (card)

- **Q1.** Is reversing D-171 for members, as Pam only, what you mean? (§ "The one thing to decide first")
- **Q2.** Should the staff conversations you already have (D-262, where staff see "Pam team") move into Pam's inbox, or
  stay on your Messages tab?
- **Q3.** First name only on the inbox (as everywhere else), or the last name too? Last name would be a new read under
  D-588.
- **Q4.** Messaging a live program needs a way to find one. Is reaching its lead from Everyone enough for now, or do
  you want a Programs list?
- **Q5.** Pam's sender line for members: Sage proposes the words. Is "Pam" with Pam's mark the look you want, or do
  you want to sign it as you?

## Seams with Nico

Proposed to Nico by message at 02:45; marked here as agreed only once he answers. Nico's file owns:
- the thread model and how Pam is a party;
- RLS, migrations, sending, the author column;
- attachments, translation, blocking and reporting in a Pam thread;
- the bell, texts and emails;
- where "Message Pam" sits for a member and for a program, and their thread view.

This file owns:
- the super admin's Home row, the inbox list and what its rows show;
- the unread rule;
- `is_pam_team()` and support staff later;
- the "Pam" sender rule;
- where the super admin starts a conversation.

What this file needs from Nico's (pending his reply):
1. A shared Pam read marker per thread.
2. One read for the inbox, `pam_inbox()`, returning per thread: who wrote (profile id, first name, role, region,
   program name for a lead), the latest message's first line, its time, who sent it (person or Pam), and the unread
   count. It is guarded by `is_pam_team()`.
3. One thread per person, or per program, or not (his model).

Dot draws it after both plans exist.
