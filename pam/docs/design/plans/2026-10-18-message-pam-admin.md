# Message Pam: the super admin's side (plan, no code)

**Date:** 2026-10-18 · **Lane:** Accounts & invites (Ava) · **Status:** plan for Will's card. Nothing is built before he
picks.

**Companion:** Nico's `docs/design/plans/2026-10-18-message-pam.md` (`claude/messages-plan-message-pam` @ 0c024637).
It owns the model: the conversations, RLS, migrations, the functions, the bell, what is off in v1, and the
`ADMIN_CAN_SEE` entry. This file doesn't repeat any of that; it links to Nico's sections. It covers what the super admin
sees and does, and what the person on the other end sees as the sender. The split is in **Seams with Nico** at the
end, agreed with him at 02:48.

## What Will asked (02:39, via Mira)

Anyone in the app can message Pam, and it goes to the super admin's inbox. The super admin can message programs and
members. It is support, inside the app.

## The one thing to decide first: this reverses D-171 and D-262 for members

- **D-171** (Will, September): "a super admin cannot send messages to a member, a case manager, or a program."
- **D-262** (migration 0072) opened super admin ↔ case manager and program lead, and wrote down the rest: "**Never a
  member** — a member's messages stay between them, their case manager and their programs."
- **Super admin ↔ member is still closed.** `can_message` refuses it, and DB test 10 proves it.
- **Members read that promise at onboarding.** The transparency screen can't be skipped (Iris, research §4 risk 1).

Will's ask opens it, but in a narrower way than D-171 feared. D-171 was worried about the person with the broadest view
starting private conversations as themselves. Here it is **Pam**, the service, writing: one named sender, visible to
the person as Pam, in the one Pam conversation that person has (Nico §2). It is not Will's own account writing to
anyone it likes.

What stays true:
- The super admin still can't read any conversation Pam isn't part of. `ADMIN_CANNOT_SEE.message_bodies` stands.
- The super admin still can't open an ordinary person-to-person conversation with a member.

What Pam's own conversations add to what the super admin may see is Nico's proposed `ADMIN_CAN_SEE` entry
(`messages_written_to_pam`, his §2), for Will to approve.

Will should say this in his own words on the card. It then becomes a new decision that supersedes D-171 and D-262's
"never a member". Lena's lane tells members before it ships.

**There are two versions on the card** (Mira, 03:03):

- **A. Pam replies only.** The person writes first and Pam replies, with no Pam-first messages to members. This is
  Iris's smallest safe version (`docs/research/2026-10-18-message-pam.md` §4, `claude/research-message-pam` @ 90eb554a).
  Her reasons: a message arriving unasked can read like a check-in from supervision; nothing measures how this audience
  takes an organisation writing first; and Code for America found a "message about messaging" has to come first.
  - What it changes: this is still a change, since Pam reads what members send. But a member only ever talks to Pam
    after choosing to.
  - Pam-first to staff stays as D-262 has it, and can move under the Pam name (Q2).
- **B. Pam may also write first to a member**, as Will's ask reads.

  The plan below is drawn so that A is B with one path switched off: §6's message button for a *member*.
  **Recommendation: A for v1, then B once Will signs it and members have been told.** Every other part of this file
  holds either way.

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

**`/pam/messages/`, the list.** It reads from `pam_inbox()` (Nico §2): one row per conversation, in three groups:

1. **"Waiting for Pam"**: the person wrote last, so the conversation is waiting for a reply. **Longest waiting first**,
   and each row says how long: "Waiting 3 hours", "Waiting 2 days". The time is `pam_inbox()`'s `waiting_since` (Nico), worked out from
   message times, so nothing new is stored. Iris: unanswered first, with how long each has waited. For this audience, silence is what
   loses people.
2. **"Answered"**: open, and Pam wrote last. Newest first.
3. **"Closed"**: folded under a row that opens it. `pam_set_thread_status` closes a conversation. A closed one
   reopens on its own when the person writes again (Nico).

The screen title carries no count, because the groups say it. An empty inbox says so in one line, with no picture; Sage
has the words.

**Opening a row** opens the conversation (Nico's thread view). Inside it, the super admin can close or reopen it. The
action sits in the header's menu, not as a button beside the composer, so it is never pressed by mistake.

**Saved replies in the super admin's composer** (Iris §2 and §4). A small "Saved replies" button above the composer
offers a few fixed answers to send or edit. The super admin sees it; the person never does.

- "Pam can't give advice about parole, probation or a legal case", followed by the free legal help list (Iris names
  Philadelphia Lawyers for Social Equity, Community Legal Services' record clearing, and the City's Office of Reentry
  Partnerships).
- "Please ask your guide" or "Please ask the program", for the wrong door.
- For a case manager writing *about* a member: Pam can't act on a member without the member; talk to them in your own
  conversation. That is Iris's risk 6: it keeps a member's situation out of a channel they can't see.

The words are Sage's, and the legal one is read by a lawyer before it ships (Iris). It is a short list in the code, in
seven languages, not something the super admin edits in the app.

**How long replies take** (Iris: measure two to four weeks before promising a time). At the foot of the list is one
quiet line: "Last 30 days: first reply in {median} on average". It comes from Nico's `pam_reply_times(days)`, which is Pam team only and returns a duration and counts, never text. The person never sees it. It is there so Will knows what can be
promised before anything is.

## 2. What each conversation row shows about who wrote

Only what `pam_inbox()` returns (Nico §2): first name, role, region, the program name for a lead, the time and first
line of the latest message, who wrote last, and the status. Nothing else. There is no last name, phone, email or city.

| Who wrote | Name line | Line under it |
| --- | --- | --- |
| Member | First name | "Member · {region}" |
| Case manager | First name | "Case manager · {region}" |
| Program lead | First name | "Program lead at {program}" (D-395's line) |

**Region** is in `pam_inbox()` at Ava's ask (Nico, 02:58). Everyone (`directory_people`) already shows the super admin
each person's region, so it isn't a widening. It is what tells two members both called "Marcus" apart.

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
only; Robin in the example data is fictional.

Every Pam function and policy calls `is_pam_team()` (Nico §2, 02:58), never `is_super_admin()` directly. Today
`is_pam_team()` returns exactly `is_super_admin()`.

**If Pam adds support staff later**, two things need Will's sign-off, because each adds people who can read what members
write to Pam:

1. **Who.** A support role, or a flag on a profile.
2. **What they get.** Widen `is_pam_team()`, not `is_super_admin()`.
   - Widening `is_super_admin()` would also hand support staff approvals, reported places, programs to check, waiting
     cities, Everyone's demo switch and staff requests.
   - Widening `is_pam_team()` gives them the inbox, starting Pam conversations (§6) and the bell, and nothing else.
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

**Under version A** (Pam replies only), the message button to a *member* is not drawn. Pam can still start a
conversation with a case manager or program lead, which D-262 already allows, and with a program.

From where the super admin already finds people, so no new search screen. Every path calls `pam_start_conversation`
(Nico §2). Each person has one Pam conversation ever, so "start" opens the existing one if there is one, with the
composer ready.

- **A person (member, case manager or program lead): Everyone (`/directory/`).**
  - Each real row gets the message button on its end, as the case manager's Home has (D-227). Today real rows have no
    link at all.
  - The label is "Message {first name} as Pam".
  - Under version A, a member's row has no message button.
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
- **Decisions, when Will picks:** A or B (and, for B, reversing D-171 and D-262's "never a member" as Pam only); the
  inbox's shape and the Home row; the sender rule; the saved replies' words.
- **Iris's other privacy points** (Copy and Delete include the Pam conversation, a stated retention period, a lawyer's
  reading of "What Pam keeps") are Nico's and Lena's, in his plan and her words. This file adds nothing to them.

## Open questions for Will (card)

- **Q1.** Version A (the person writes first, Pam replies) or B (Pam may also write first to a member)? B reverses
  D-171 and D-262's "never a member". Recommended: A for v1.
- **Q2.** Should the staff conversations you already have (D-262, where staff see "Pam team") move into Pam's inbox, or
  stay on your Messages tab?
- **Q3.** First name only in the inbox (as everywhere else), or last name too? Last name would be a new read under
  D-588.
- **Q4.** Messaging a live program needs a way to find one. Is reaching its lead from Everyone enough for now, or do
  you want a Programs list?
- **Q5.** Is "Pam" with Pam's mark the sender look you want for members? (Iris's question 5 asks the same; she gives
  the reader's first name as the warmer, more personal option.)
- **Q6.** Who covers when you're away? Iris puts silence third among the risks, and says a second reader or an away
  notice is needed before launch. With no second reader, the smallest step is an "Away until {date}" switch on the
  inbox. The person's conversation then shows a status line, "Pam is away until {date}" (Nico: `pam_status.away_until`).
  It is not an automatic message, because that would be a message nobody wrote, with no real author, ringing the
  person's bell. Which do you want?

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

**Asked of Nico and done (02:58):**
- `pam_inbox()` returns the asker's region.
- Every Pam function and policy goes through `is_pam_team()`, which today returns `is_super_admin()`.

**Asked of Nico after Iris's research (03:10), and done (03:15, his 0c024637):**
1. `pam_inbox()` returns `waiting_since`, and `pam_reply_times(days)` gives the median first reply.
2. If Will picks "Read by Pam": `pam_threads.last_team_read_at`, set by `pam_mark_read`. The words must say a person
   opened it. The Home count stays on waiting-for-reply.
3. If Will picks the away switch (Q6): a status line, not an automatic reply (`pam_status.away_until`).
4. Under version A, `pam_start_conversation` for members isn't built.

Dot draws it after both plans exist.
