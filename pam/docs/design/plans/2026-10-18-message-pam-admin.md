# Message Pam: the super admin's side (plan, no code)

**Date:** 2026-10-18 · **Lane:** Accounts & invites (Ava) · **Status:** plan for Will's card. Nothing is built before he
picks.

**Companion:** Nico's `docs/design/plans/2026-10-18-message-pam.md` (`claude/messages-plan-message-pam` @ bfeead66).
It owns the model: the conversations, RLS, migrations, the functions, the bell, what is off in v1, and the
`ADMIN_CAN_SEE` entry. This file doesn't repeat any of that; it links to Nico's sections. It covers what the super admin
sees and does, and what the person on the other end sees as the sender. The split is in **Seams with Nico** at the
end, agreed with him at 02:48.

## What Will asked (02:39, via Mira)

Anyone in the app can message Pam, and it goes to the super admin's inbox. The super admin can message programs and
members. It is support, inside the app.

## The one thing to decide first: this reverses D-171 for members

- **D-171** (Will, September): "a super admin cannot send messages to a member, a case manager, or a program."
- **D-262** (migration 0072) already opened super admin ↔ case manager and program lead.
- **Super admin ↔ member is still closed.** `can_message` refuses it, and DB test 10 proves it.

Will's ask opens it, but in a narrower way than D-171 feared. D-171 was worried about the person with the broadest view
starting private conversations as themselves. Here it is **Pam**, the service, writing: one named sender, visible to
the person as Pam, in the one Pam conversation that person has (Nico §2). It is not Will's own account writing to
anyone it likes.

What stays true:
- The super admin still can't read any conversation Pam isn't part of. `ADMIN_CANNOT_SEE.message_bodies` stands.
- The super admin still can't open an ordinary person-to-person conversation with a member.

What Pam's own conversations add to what the super admin may see is Nico's proposed `ADMIN_CAN_SEE` entry
(`messages_written_to_pam`, his §2), for Will to approve.

Will should say this in his own words on the card. It then becomes a new decision that supersedes D-171 for members.
Lena's lane tells members before it ships.

## 1. Where the inbox lives

**On the super admin's Home, as the first row of the list Home already has.** That is `RequestsScreen`'s `MenuList`,
today: Programs to check, Reported places, Waiting cities. Staff requests come after it.

- **Row:** "Messages to Pam" (Sage's words to sign). Message icon. Opens `/pam/messages/`, a `SubPage` with a round
  back to Home (`?from=home`, as the other rows do).
- **It goes first** because it's the only row where a person is waiting on an answer from Pam. Everything else on Home
  is a queue of things to judge.
- **The Messages tab stays as it is:** the super admin's own staff conversations (D-262) and Reported. One place is
  Pam's, the other is Will's own account's.
  - Open question Q2: whether D-262's staff conversations should move into Pam's inbox later. Staff already see that
    sender as "Pam team" (D-395).

**`/pam/messages/`, the list.** It reads from `pam_inbox()` (Nico §2): one row per conversation, newest activity first,
in three groups:

1. **"Waiting for Pam"**: the person wrote last, so the conversation is waiting for a reply.
2. **"Answered"**: open, and Pam wrote last.
3. **"Closed"**: folded under a row that opens it. `pam_set_thread_status` closes a conversation. A closed one
   reopens on its own when the person writes again (Nico).

The screen title carries no count, because the groups say it. An empty inbox says so in one line, with no picture; Sage
has the words.

**Opening a row** opens the conversation (Nico's thread view). Inside it, the super admin can close or reopen it. The
action sits in the header's menu, not as a button beside the composer, so it is never pressed by mistake.

## 2. What each conversation row shows about who wrote

Only what `pam_inbox()` returns (Nico §2): first name, role, the program name for a lead, the time and first line of the
latest message, who wrote last, and the status. Nothing else. There is no last name, phone, email or city.

| Who wrote | Name line | Line under it |
| --- | --- | --- |
| Member | First name | "Member · {region}"* |
| Case manager | First name | "Case manager · {region}"* |
| Program lead | First name | "Program lead at {program}" (D-395's line) |

\* **Region is one column to ask Nico for.** Everyone (`directory_people`) already shows the super admin each person's
region, so adding it isn't a widening, and two members both called "Marcus" need something to tell them apart. If Will
or Nico would rather not, the line is just "Member" and "Case manager".

Then, on the right, the time of the latest message. A row waiting for Pam has a bold name. Under the name is the latest
message's first line, cut to one line (`isDescriptionOneLine`, D-306), prefixed "You: " when Pam wrote last.

**Left out on purpose:**
- **Last name.** D-588 lets the Pam team read it only through specific server functions. If Will wants it here, that
  is its own decision (Q3).
- **Access state, and anything about a member's case manager, caseload, enrollments or visits.** None of it is needed
  to answer someone.

Each row is the same shape as a Messages row (`MenuList`, 64px or more, the whole row the target). The words above are
placeholders for Sage.

## 3. The count on the Home row (D-586)

**A plain number (`value`): how many conversations are waiting for Pam** (Nico: `pam_inbox()` gives it). It is a
queue, like every other row on that Home, so D-586's plain number applies, not the red badge. With none waiting, the
row has no number.

- Nico's model has no per-reader "last read". So "waiting for a reply" (the person wrote last) is the one measure, and
  it clears when someone on the Pam team answers, or closes the conversation. That suits a support queue: opening a
  conversation and walking away doesn't make it disappear from the count.
- **The tab bar's Messages badge doesn't count Pam conversations.** That badge is for the super admin's own
  conversations, and Pam's queue is on Home.
- **The bell** (Nico's): a new message to Pam is a bell item for the super admin.

## 4. Who is "the super admin" for this, now and later

**Today:** `is_super_admin()` (`profiles.role = 'super_admin'`, migration 0033). In live data that is Will's account
only; Robin in the example data is fictional. Every Pam function and policy uses `is_super_admin()` alone (Nico).

**If Pam adds support staff later**, two things need Will's sign-off, because each adds people who can read what members
write to Pam:

1. **Who.** A support role, or a flag on a profile.
2. **What they get.** The recommendation is a separate `is_pam_team()`. Today it would be `is_super_admin()` and nothing
   more. Only the Pam functions (`pam_inbox`, `pam_set_thread_status`, `pam_start_conversation`, the program fan-out)
   would switch to it.
   - Widening `is_super_admin()` itself would also hand support staff approvals, reported places, programs to check,
     waiting cities, Everyone's demo switch and staff requests.
   - With `is_pam_team()`, support staff get the inbox, starting Pam conversations (§6) and the bell, and nothing else.
   - That day comes with a DB test: a support account reaches Pam conversations and nothing else `is_super_admin()`
     guards.

The real author of each Pam reply is already stored (Nico: `messages.sender_id` and `audit_log` `pam.reply`). So when
there are several of the team, they can see "by {first name}" under each other's replies in the super admin's view.
With one super admin there is nothing to show, so v1 shows nothing.

## 5. What the person sees as the sender

**"Pam".** Never a staff member's name, photo, initials or phone, anywhere it shows:
- the conversation header;
- each bubble's speaker;
- the row in their Messages;
- the bell;
- an export of their data.

Nothing in the data the person can read resolves the author to a name (Nico §2). Pam conversations aren't texted or
emailed (Nico: bell only, `texts_live` stays off).

- **Header:** "Pam", with Pam's own mark as the avatar. Dot draws it; it is not the generic initials avatar. The line
  under it (D-395) reads "Pam team" for staff today. For members it needs words that make sense to them. Sage proposes;
  something like "Pam support".
- **Bubbles from Pam** all read as Pam, whoever on the team wrote them.
- **"Pam" is a name, so it is never translated.** On screen it goes through `t`, which isolates it in Arabic like any
  name; in labels it goes through `tPlain` (D-435).
- **Why "Pam" and not a person:**
  - The person wrote to the service, not to whoever is on shift.
  - A staff name invites "ask for Robin next time". When Robin leaves, that breaks.
  - A returning citizen may be warier writing to a named individual than to the service they signed up to.

## 6. Starting a conversation as Pam

From where the super admin already finds people, so no new search screen. Every path calls `pam_start_conversation`
(Nico §2). Each person has one Pam conversation ever, so "start" opens the existing one if there is one, with the
composer ready.

- **A person (member, case manager or program lead): Everyone (`/directory/`).**
  - Each real row gets the message button on its end, as the case manager's Home has (D-227). Today real rows have no
    link at all.
  - The label is "Message {first name} as Pam".
  - The Demo view switch stays where it is. The message button sits beside it, and both stay 48px.
- **A program: the program's page from Programs to check** (`/programs/review/?id=`), "Message this program".
  - Programs have no shared conversation. One message fans out to each recipient's own Pam conversation (Nico §2).
    Whether that is every active lead (recommended) or one lead is Nico's §6 question 4, for Will.
  - Until Will picks, the picker is drawn for both a person and a program. The program's recipient list is left as a
    stub, and the composer says who it will reach ("This goes to each of the program's leads").
  - There is no list of *live* programs for the super admin today. Programs to check shows only those waiting for a
    check. For a live program, reach its lead from Everyone for now. A live-programs list is its own card (Q4).
- **Not from a staff request.** Someone asking to be staff gets their answer by approval or denial (D-584), plus the
  text reply (D-524). A Pam conversation would be a second channel for the same answer.

Before the first message to a person, the composer says once that they will see it from "Pam". After that it says
nothing more.

## Privacy and records

- **Promises to members and staff** (what Pam can now do, and who reads what is sent to Pam): Lena's lane writes and
  dates them from Nico's `ADMIN_CAN_SEE` entry, before anything ships.
- **DB tests:** Nico's §2 and §5. For this file's paths, two are worth naming:
  - `pam_inbox()` returns nothing to anyone who isn't the super admin;
  - its columns are exactly the ones listed in §2 above.
- **Decisions, when Will picks:** reversing D-171 for members, as Pam only; the inbox's shape and the Home row; the
  sender rule.

## Open questions for Will (card)

- **Q1.** Is reversing D-171 for members, as Pam only, what you mean?
- **Q2.** Should the staff conversations you already have (D-262, where staff see "Pam team") move into Pam's inbox, or
  stay on your Messages tab?
- **Q3.** First name only in the inbox (as everywhere else), or last name too? Last name would be a new read under
  D-588.
- **Q4.** Messaging a live program needs a way to find one. Is reaching its lead from Everyone enough for now, or do
  you want a Programs list?
- **Q5.** Is "Pam" with Pam's mark the sender look you want for members?

Nico's own questions are in his §6, including who a program's message reaches and what's off in v1.

## Seams with Nico

Agreed with Nico at 02:48.

**Nico's file owns:**
- the conversation model (one per person, ever; one per lead, with no shared program conversation);
- RLS and migrations;
- `pam_inbox()`, `pam_set_thread_status()`, `pam_start_conversation()` and the program fan-out;
- storing the author (`sender_id`, `audit_log` `pam.reply`);
- the bell (nothing texted or emailed);
- attachments, translation, blocking and reporting, all off for Pam conversations in v1;
- the `ADMIN_CAN_SEE` entry;
- the member's and program's side.

**This file owns:**
- the super admin's Home row and its count;
- the inbox list and what its rows show;
- closing and reopening in the super admin's view;
- support staff later;
- the "Pam" sender rule;
- where the super admin starts a conversation.

**Asked of Nico:** `pam_inbox()` adds the asker's region (§2). Nothing else in his function's return needs to change.

Dot draws it after both plans exist.
