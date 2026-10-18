# Message Pam: the Privacy, transparency and Terms lines (draft for Will's card)

**Status:** draft English for Will to sign, **L1 checked and agreed by Sage (ledger `d849470f`)**; nothing built, **no translations until he signs**. Written by Lena (Languages & legal), 18 October 2026, against Nico's plan `2026-10-18-message-pam.md` (his branch `claude/messages-plan-message-pam`), Ava's `2026-10-18-message-pam-admin.md` and Sage's words (ledgers `d9174a60`, `d849470f`, `179bd706`, `7b280684`). **Letters are the card's (a100)** from the second version on: **A** = the member always writes first (Pam still starts conversations with staff and programs, as the super admin can today); **B** = Pam can start a conversation with anyone (Sage's old "A"); **C** = B plus the Profile switch, on by default (Sage's `7b280684`). My earlier "B" (Iris's narrower wording) is not on the card and is gone.
**Why it needs Will:** the Pam team reading the text of a message is new. Today nobody at Pam reads a message body except one reported to them (`ADMIN_CANNOT_SEE.message_bodies`), and the Privacy page says so. This is a **widening**, and D-413 and D-414 say a changed promise is told to members **before it takes effect** and ships with its words.

## What the page has to say, and where (the four things Mira named)

| What a person is told | Line | Where |
|---|---|---|
| **Who reads it.** Only the Pam team (super admins); not their guide, not a program. | L1 | Privacy, new `what-we-keep.p17`; the same sentences on the transparency screen (L4) and pinned above the composer (Sage's card) |
| **What is kept, and for how long.** The conversation (what they write, what Pam writes back), while they use Pam; "Close" is a label, nothing is deleted when a thread is closed. | L1 | same |
| **What happens on erasure.** The whole conversation is deleted with the account, at once, replies included. The six-month record of what the account did and what Pam's staff did to it already covers the audit rows (`how-long.p3`) and has no message in it. | L1 | same; `how-long.p3` stands |
| **That Pam can write first** (reverses D-262 for members). **Only under B and C.** Under A nothing is said, see L2. | L2 | Privacy, new `contact.p3`; the in-app notice before go-live is Sage's |

## The lines

**L1, Privacy `what-we-keep.p17` (new).**
> If you write to Pam in the app, or Pam writes to you, we keep what you both write. Only the Pam team reads this conversation. Your guide and your programs don't see it. We keep it while you use Pam, and if you ask us to delete your account, we delete the whole conversation with it.

- "Only the Pam team reads this conversation. Your guide and your programs don't see it." is Sage's card sentence **word for word** (hers is pinned above the composer; the transparency line uses it too). One claim, three places; a test holds them together.
- **Sage's edit (ledger `d849470f`):** the first sentence covers a conversation Pam starts (under B or C), and a conversation Pam starts with a case manager or a program lead (under A too). The card's sentence is untouched. L1 is the same under A, B and C: under A, "or Pam writes to you" is a reply, or a first message to staff. Sage keeps "You'll" in her in-app notice and "You will" on the Privacy page: the same claim.
- "Pam team" is the page's own word for the people who read what the page names (`what-we-keep.p1`, `p7`, `p14`, `p15`).

**L2, Privacy `contact.p3` (new): Pam writes first.** The card's letters; the line says the same scope as Sage's notice for that letter.
- **A (the member always writes first): no L2. It is not needed.** Under A no member is ever written to first, so there is nothing for a member to be told. For a case manager or a program lead (or a program) Pam may start the conversation, as a super admin can today (D-262, a `direct` one); the Privacy page says nothing about that now, and it is not a thing kept or read that L1 does not already cover: L1 says that a conversation Pam writes into is kept, who reads it and how it ends. I checked every Privacy, Terms and transparency line for a promise that Pam does not write first: there is none (`texts.p1` is about texts; `what-we-keep.p7` says Pam writes to staff by email). So A has L1, L3 if Will says yes, L4 and the notice, and no L2. If Will wants it said to staff anyway, it is one more sentence and a card of its own.
- **B (Pam can start a conversation with anyone):** The Pam team can start a conversation with you, as Pam. You will see it in Messages, and only the Pam team can read it.
- **C (B, with the Profile switch, on by default):** B, plus: You can turn this off in Profile. What you write to Pam still gets an answer. Sage's switch (ledger `ebc727f1`): label "Pam can write to me first", hint "Off: Pam answers when you write, and doesn't start a conversation." She confirms this sentence matches as written; I hold it against the hint in the test.

**L3, only if Will says a limited account may write to Pam (Nico's question 2, option a).** Seven places say today that a limited account cannot send (the two policies, three website posts, the app notice and its config copy); they change together, in the same batch, or one of them says what the others do not. The exact words, now and if Will says yes:
- **Privacy `limits.p2`**, now: "A limited account can read messages but cannot send them. A paused account cannot sign in. You can always contact Pam for help." If yes: "A limited account can read messages and write to Pam, but cannot send other messages. A paused account cannot sign in. You can always contact Pam for help."
- **Terms `limits.p2`**, now (the Terms say it another way than the Privacy page): "If an account is limited, it can read messages but not send them. If an account is paused, it cannot sign in. Either way, you can always contact Pam for help." If yes: "If an account is limited, it can read messages and write to Pam, but not send other messages. If an account is paused, it cannot sign in. Either way, you can always contact Pam for help."
- **The two website posts** (Wren, `apps/site`; they repeat the policy in their own words and no test holds them to it):
  - `CaseManagerAssignments.tsx` line 39, now: "A limited account can read messages but can’t send them. A paused account can’t sign in. Pam always tells you when something is turned off and who to ask, and you can always contact Pam for help." If yes, the first sentence becomes: "A limited account can read messages and write to Pam, but can’t send other messages."
  - `PamWords.tsx` line 109 (the account-status table, "Limited"), now: "An account with some things turned off. A limited account can read messages but cannot send them." If yes: "An account with some things turned off. A limited account can read messages and write to Pam, but cannot send other messages."
- **Three more places Mira's list did not have** (I found them by searching the app, the site and the config for the limited-account sentence and its neighbours):
  - **The app notice, Sage's:** `notice.account_limited.body` in `en.json` and in `packages/config/src/notices.ts` (the same text, the banner's source; `LimitedNotice.tsx` shows it at the top of Messages and in the thread), now: "You cannot send messages right now. Your guide turned this off for your account. You can still read your messages. Contact Pam and we will help you reach your guide." If yes (Sage, `ebc727f1`): "You cannot send messages right now, except to Pam. Write to Pam and we will help you reach your guide." I translate it with the others, in six bundles and the ledger. It drops "Your guide turned this off" and "You can still read your messages"; the first is no longer promised by the notice and the second is still said by the Terms and Privacy lines, and `terms.s.limits.p3` ("Pam tells you it is off and who to ask") is still true of it.
  - **A third website post, Wren's:** `StartHere.tsx` line 50, the section "You can’t send messages, or your account is paused", step 1, now: "Your guide turned this off. You can still read your messages." Under yes it needs "and write to Pam" and the section title says "You can’t send messages", which is then half true. Sage's `ebc727f1` says StartHere step 1 uses her notice sentence ("You cannot send messages right now, except to Pam. Write to Pam and we will help you reach your guide."); step 3 of that section already says "Contact Pam and we will help you reach your guide", so Wren should drop or merge one. The Terms, Privacy and the two other posts keep the words above, which are mine; Sage to say if she wants them otherwise.
  - **The e2e** that reads the limited screen (`messages.spec.ts` at 161 and 626, both citing `terms.s.limits.p3`) expects no composer; under yes the Pam conversation is the one place that has one. Nico's.
- `terms.s.limits.p1` and `p3` do not change ("We can turn off parts of Pam for an account that is hurting other people." and "When something is turned off, Pam tells you it is off and who to ask."). `legal:date privacy` and `legal:date terms` both move on the day it ships.
- If Will says no, nothing changes and every place stays as D-413 left it.

**L4, the transparency screen, a third card beside "A program can see:" (new keys `transparency.pam.heading`, `transparency.pam.messages`).** Worded together with L1: L1 says "If you write to Pam in the app, or Pam writes to you, we keep what you both write."; L4 says the same two directions in a list line.
> **The Pam team can read:** What you and Pam write to each other. Only the Pam team reads this conversation. Your guide and your programs don't see it.

Sage proposed the same sentence independently (ledger `179bd706`), so L4 is signed English.

It must **not** go in the guide's list ("Your guide can see:"): your guide cannot read it, and a line there would say the opposite. The screen's footer already says "If this changes, we will tell you first."; L5 is how. L4 is the same under A, B and C (under A Pam still writes back).

**L5, telling people first (D-413: "If this changes, we will tell you first.").** One notice, once to every account, in Sage's words for the letter Will picks. **A needs one too**: under A the Pam team still reads what people write to Pam, and that is the change. The three notices:
- **A:** "You can now write to Pam in Messages. Only the Pam team reads what you write there." (Sage, ledger `179bd706`, unchanged in `ebc727f1`; her drafts, not yet signed by Will.) It is role-neutral, so staff get the same notice.
- **B:** Sage's notice from `d9174a60` (the read, and that Pam can start a conversation with you).
- **C:** Sage's `7b280684` (B, and the Profile switch).

**When it shows (the same under A, B and C), so that "first" is true for each person and not for the batch:**
1. **To every account that exists on the day it ships**, at the first open of the app after the release, before anything else on screen, not only on the Messages tab: a person who never opens Messages is told too. **To an account created later**, at its first open, in the same way, so nobody joins to a conversation they were not told about. Dismissed once; it does not come back.
2. **Before the composer, whatever the way in.** A person who opens Pam before they have dismissed it (from the bell, from Contact Pam, from a link) sees the notice first, then the conversation. The pinned line above the composer (Sage's card sentence) is the second reminder and is always there.
3. **Nothing is readable by the Pam team until a person writes.** The notice is therefore the thing that has to be on a person's screen before their first message; the page and the transparency screen are the places they can read it again.
4. **Same batch or earlier, never later:** the notice, the Privacy page and the transparency screen go live in the batch that turns the conversation on or before it (Nico's plan, section 6). `legal:date privacy` is that day, and the notice shows on that day.
5. **Where "seen" is kept** is for Nico and Sage: on the phone (as the calendar "Added" note is, nothing on Pam's side), or in the database. If it is in the database it is a new thing kept about a person and needs a privacy-guard entry and a line of its own; I recommend the phone. A person who changes phone sees it once more, which is harmless.
6. **If Will picks A and later moves to B or C,** the second notice (Pam can now start conversations) is a new change and is told first again, to everyone, once.


## A public page that stops being true (found while checking L2; Wren's, in the same batch)

`apps/site/src/content/MessagesInPam.tsx` (the website's "Messages in Pam") carries the D-262 rule as a public promise, in two places:
- line 24: "Your own case manager can start a chat with you too. **Nobody else can.**"
- line 36, the table: "A super admin: Case managers and program leads. **Never a member.**"

| If Will picks | These two lines |
|---|---|
| **A** (the member always writes first) | Still true of a person-to-person chat. But the page has no Pam in it: "Who can write to whom" needs a row for Pam (a member can write to Pam; Pam answers, and may start with staff and programs), and "Nobody else can" should say that Pam, replying, is not "somebody else". |
| **B or C** | **Untrue.** Pam can start a conversation with a member. Both lines must change in the same batch as the Privacy page, or the website says the opposite of the Privacy page. |

No test holds the page to the policy. I would ask for one once the words are signed (the page's table against `can_start_conversation` and `pam_start_conversation`). The code comment at `apps/web/src/app/messages/thread/page.tsx:88` ("never a member") is Nico's to change to "except as Pam", as noted below.

## What I will hold in tests once it is built (not before)

1. **A pin for the one claim:** "Only the Pam team reads this conversation. Your guide and your programs don't see it." is in L1, L4 and the pinned line, word for word, in English (`message-pam-line.test.ts`); the other six languages are held by the usual in-step check. **The second sentence depends on the reader (Sage, `ebc727f1`): one claim for everyone, "Only the Pam team reads this conversation."; then members get "Your guide and your programs don't see it." and case managers and program leads get "Members and other staff don't see it." The Privacy page (L1) and the transparency screen (L4) are member-facing and carry the member sentence; the staff sentence is on the staff pinned line only. The test holds the first sentence in all four places word for word, the member sentence in L1, L4 and the member's pinned line, the staff sentence in the staff's pinned line, and fails if the staff line says "guide" or the member line says "staff".** **And for the two directions:** L1 says "or Pam writes to you, we keep what you both write" and L4 says "What you and Pam write to each other"; the test fails if either drops Pam's side, so the page cannot go back to the narrower "what you write to Pam".
2. **L1 is true of the policies:** the migration that adds the team's read policy names `is_pam_team()` and `kind = 'support'` on every new policy on `messages`, `conversations` and `conversation_members`; **no** new policy mentions the case-manager role or a program; `messages_select_conversation_member` keeps its "deliberately NO admin policy" comment. Nico's DB tests (a super admin reads a support conversation and no direct one; a case manager, a program lead and another member read none) are the live check.
3. **L1's erasure sentence is true, for a conversation Pam starts too:** deleting the asker deletes `pam_threads` and its conversation and messages (Nico's after-delete trigger), tested at the database.
4. **The privacy guard (D-587):** no new field to count (the Pam conversation uses the existing composer in `ThreadView.tsx`), so the existing `messages` entry gains L1 as a covering line, with its sentence as a "must still say". The inbox shows a person's first name, role and region, which the team already sees (`directory_people`): no new entry.
5. **The transparency contract:** the plan puts `messages_written_to_pam` in `ADMIN_CAN_SEE`, which is the **guide's** list (RLS for the `admin` role is held to it). **I recommend a separate `PAM_TEAM_CAN_READ` list** (its own comment, its own pin tying it to L1 and L4), so the guide's list never widens and the two cannot be confused. Nico decides; I follow whichever.

## What changes with Will's answers (Nico's nine questions)

| Question | Words that move |
|---|---|
| 1 Where Pam lives; 4 a message to a program (every lead or one); 6 Pam or a first name; 7 texts later | none (behaviour; a separate card when texts go live) |
| 2 Limited account may write to Pam | **L3: Privacy and Terms `limits.p2`, the two site posts, and `notice.account_limited.body`**; if no, nothing |
| 3 The team may start a conversation (card letters A, B, C) | **L2**: none under A; B or C's line otherwise. **L5**: the notice for the letter; L1 and L4 are the same under all three |
| 5 Photos and documents | **L1 adds them and a second widening** (two storage policies, two more entries); L4 too |
| 8 Closing and keeping | if "delete closed conversations after a year": a new sentence in L1 and in `how-long`; as recommended (a label, nothing deleted) L1 stands |
| 9 Translation of Pam conversations | if yes: the translation section (`privacy.s.translation`, D-423) must say the Pam team's reading goes through Claude for this conversation; if no, nothing |

## For Sage, Nico, Mira

- **Sage:** L1's second and third sentences are your card sentence word for word. Three things from you: the **A notice** (words, and your ledger SHA, which Mira needs for the card); C's switch label and hint from `7b280684`, which L2 C's second sentence repeats; and `notice.account_limited.body` if Will says yes to L3. One question: for a case manager or a program lead, "Your guide and your programs don't see it" reads oddly (they have no guide, and "your programs" are theirs). It is true for them. Do they get a variant in the pinned line and the notice, or is the member's sentence the one claim for everyone? "We can't give legal advice" is on the card; if Terms get a legal-advice line it says "legal advice" too (no justice words on a member screen).
- **Nico:** the `PAM_TEAM_CAN_READ` suggestion; and the D-262 comments in code and database (`can_message`: "never a member") must say "except as Pam" so nobody "fixes" it later.
- **Mira:** one card for Will with L1 to L5 and his answers to the five questions that move words (2, 3, 5, 8, 9; the card's own numbering may differ). `legal:date` for Privacy (and Terms if 2a) on the day it ships. **Wren** changes the two posts in the same batch if Will says yes to L3. I translate once he signs.
