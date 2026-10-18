# Message Pam: the Privacy, transparency and Terms lines (draft for Will's card)

**Status:** draft English for Will to sign, with Sage; nothing built, **no translations until he signs**. Written by Lena (Languages & legal), 18 October 2026, against Nico's plan `2026-10-18-message-pam.md` (his branch `claude/messages-plan-message-pam`), Ava's `2026-10-18-message-pam-admin.md` and Sage's words (ledger `d9174a60`).
**Why it needs Will:** the Pam team reading the text of a message is new. Today nobody at Pam reads a message body except one reported to them (`ADMIN_CANNOT_SEE.message_bodies`), and the Privacy page says so. This is a **widening**, and D-413 and D-414 say a changed promise is told to members **before it takes effect** and ships with its words.

## What the page has to say, and where (the four things Mira named)

| What a person is told | Line | Where |
|---|---|---|
| **Who reads it.** Only the Pam team (super admins); not their guide, not a program. | L1 | Privacy, new `what-we-keep.p17`; the same sentences on the transparency screen (L4) and pinned above the composer (Sage's card) |
| **What is kept, and for how long.** The conversation (what they write, what Pam writes back), while they use Pam; "Close" is a label, nothing is deleted when a thread is closed. | L1 | same |
| **What happens on erasure.** The whole conversation is deleted with the account, at once, replies included. The six-month record of what the account did and what Pam's staff did to it already covers the audit rows (`how-long.p3`) and has no message in it. | L1 | same; `how-long.p3` stands |
| **That Pam can write first** (reverses D-262 for members). | L2 | Privacy, new `contact.p3`; the in-app notice before go-live is Sage's |

## The lines

**L1, Privacy `what-we-keep.p17` (new).**
> If you write to Pam in the app, we keep what you write and what the Pam team writes back. Only the Pam team reads this conversation. Your guide and your programs don't see it. We keep it while you use Pam, and if you ask us to delete your account, we delete the whole conversation with it.

- "Only the Pam team reads this conversation. Your guide and your programs don't see it." is Sage's card sentence **word for word** (hers is pinned above the composer; the transparency line uses it too). One claim, three places; a test holds them together.
- "Pam team" is the page's own word for the people who read what the page names (`what-we-keep.p1`, `p7`, `p14`, `p15`).

**L2, Privacy `contact.p3` (new): Pam writes first.** Will picks the scope (question 3 in Nico's plan); the line states the same scope as Sage's notice.
- **A (Will's words):** The Pam team can start a conversation with you, as Pam. You will see it in Messages, and only the Pam team can read it.
- **B (Iris's narrower):** The Pam team can write to you first, as Pam, about your account or something you asked about. You will see it in Messages, and only the Pam team can read it.
- **C (A, with a switch in Profile):** A, plus: You can turn this off in Profile; what you write to Pam still gets an answer.

**L3, only if Will says a limited account may write to Pam (Nico's question 2, option a).** Privacy `limits.p2` and Terms `limits.p2` say the same, in the same words:
- now: "A limited account can read messages but cannot send them." → "A limited account can read messages and write to Pam, but cannot send other messages."
- If Will says no, nothing changes and the page stays as D-413 left it.

**L4, the transparency screen, a third card beside "A program can see:" (new keys `transparency.pam.heading`, `transparency.pam.messages`).**
> **The Pam team can read:** What you write to Pam, and what Pam writes back. Only the Pam team reads this conversation. Your guide and your programs don't see it.

It must **not** go in the guide's list ("Your guide can see:"): your guide cannot read it, and a line there would say the opposite. The screen's footer already says "If this changes, we will tell you first."; L5 is how.

**L5, telling people first (the notice Sage drafted).** One notice to everyone with an account **before** the conversation can be used, dismissed once: Sage's A or B, whichever Will picks for L2. Nothing is readable by the Pam team until a person writes, and the pinned line is above the composer before they do. The notice, the Privacy page and the transparency screen go live **in the same batch or earlier, never later** (Nico's plan, section 6).

## What I will hold in tests once it is built (not before)

1. **A pin for the one claim:** "Only the Pam team reads this conversation. Your guide and your programs don't see it." is in L1, L4 and the pinned line, word for word, in English (`message-pam-line.test.ts`); the other six languages are held by the usual in-step check.
2. **L1 is true of the policies:** the migration that adds the team's read policy names `is_pam_team()` and `kind = 'support'` on every new policy on `messages`, `conversations` and `conversation_members`; **no** new policy mentions the case-manager role or a program; `messages_select_conversation_member` keeps its "deliberately NO admin policy" comment. Nico's DB tests (a super admin reads a support conversation and no direct one; a case manager, a program lead and another member read none) are the live check.
3. **L1's erasure sentence is true:** deleting the asker deletes `pam_threads` and its conversation and messages (Nico's after-delete trigger), tested at the database.
4. **The privacy guard (D-587):** no new field to count (the Pam conversation uses the existing composer in `ThreadView.tsx`), so the existing `messages` entry gains L1 as a covering line, with its sentence as a "must still say". The inbox shows a person's first name, role and region, which the team already sees (`directory_people`): no new entry.
5. **The transparency contract:** the plan puts `messages_written_to_pam` in `ADMIN_CAN_SEE`, which is the **guide's** list (RLS for the `admin` role is held to it). **I recommend a separate `PAM_TEAM_CAN_READ` list** (its own comment, its own pin tying it to L1 and L4), so the guide's list never widens and the two cannot be confused. Nico decides; I follow whichever.

## What changes with Will's answers (Nico's nine questions)

| Question | Words that move |
|---|---|
| 1 Where Pam lives; 4 a message to a program (every lead or one); 6 Pam or a first name; 7 texts later | none (behaviour; a separate card when texts go live) |
| 2 Limited account may write to Pam | **L3: Privacy and Terms `limits.p2`**; if no, nothing |
| 3 The team may start a conversation | **L2** A, B or C; Sage's notice |
| 5 Photos and documents | **L1 adds them and a second widening** (two storage policies, two more entries); L4 too |
| 8 Closing and keeping | if "delete closed conversations after a year": a new sentence in L1 and in `how-long`; as recommended (a label, nothing deleted) L1 stands |
| 9 Translation of Pam conversations | if yes: the translation section (`privacy.s.translation`, D-423) must say the Pam team's reading goes through Claude for this conversation; if no, nothing |

## For Sage, Nico, Mira

- **Sage:** L2 and L1's second sentence match your card word for word as drafted. If the card takes different words, send them and I match. "We can't give legal advice" is on the card; if Terms get a legal-advice line it says "legal advice" too (no justice words on a member screen).
- **Nico:** the `PAM_TEAM_CAN_READ` suggestion; and the D-262 comments in code and database (`can_message`: "never a member") must say "except as Pam" so nobody "fixes" it later.
- **Mira:** one card for Will with L1 to L5 and his answers to the five questions that move words (2, 3, 5, 8, 9). `legal:date` for Privacy (and Terms if 2a) on the day it ships. I translate once he signs.
