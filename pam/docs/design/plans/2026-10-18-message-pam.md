# Message Pam: support inside the app (plan, nothing built)

**Status:** plan only, for Will to choose on. No code, no migration, no strings. Written by Nico (Messages & notifications), 18 October 2026, off main c67be570.
**Asked by:** Will, 18 October 2026, 02:39 UTC, via the merge desk: "add the ability for anyone in the app to message Pam, which goes to the super admin messaging inbox, and allow the super admin to message programs and members", for support inside the app.
**Owns:** this file. Ava writes the super admin's screens in a file of their own; the seams between us are in section 5.

## The short version

- Everyone with an account gets one conversation called **Pam**, in their Messages. What they write there is read by the Pam team (the super admins) and by nobody else. It is the first place in Pam where the team reads message bodies, so it is a **widening of what the team can see**: it needs Will's sign-off, an entry in `ADMIN_CAN_SEE`, and the member told before it goes live (D-413).
- Pam is **not a person's account**. A Pam conversation has one member, the person writing, and no second member. The team reaches it through one new rule that is scoped to Pam conversations and to super admins; no other conversation becomes readable by anyone new.
- The super admin gets an **inbox** of Pam conversations, and can **start** one with any member or any program.
- The bell tells people; nothing is texted (`texts_live` is off, and this plan keeps it that way).
- Nine questions for Will are at the end, each with a recommendation. Nothing is built until he picks on the card.

## 1. What exists today, and what this keeps or replaces

**Reaching Pam today (A28, D-512, D-521, D-522).** Pam has no phone line. The path is: a problem, then the help desk (the website's Support pages), then an email.
- In the app, **Contact Pam** (`help.contact.action`, D-512) is the support action on a notice and the first row of Help. Signed in, it opens the app's Help (`/help/`); signed out, it opens the website's help desk. Help's rows open the help desk on the website.
- The help desk ends every post in **Still stuck?**: "Write to us at hello@joinpam.org." The website's **form** behind it posts to the `help-request` edge function, which sends one email to hello@joinpam.org with the person's address as reply-to (`docs/help-request-contract.md`). It is built **off**: it answers 503 until Will sets `HELP_REQUESTS_LIVE`. Three an hour a caller and thirty overall, kept against a salted hash. **Nothing is stored**: the request is an email and a rate-limit row (D-521).
- A person at Pam answers by email. That means the person must have an email address and open it; people the app serves often have a phone and not much else.

**Messaging today (D-171, D-262, D-541, a72).**
- A conversation has two members (`conversations`, `conversation_members`, `messages`: 0005). Reading and writing are by membership only (`in_conversation()`); `messages_select_conversation_member` is the one select policy on messages, and its comment is the rule: "there is deliberately NO admin policy on this table". `ADMIN_CANNOT_SEE` lists `message_bodies`, `message_photos`, `message_files` and `message_link_previews`.
- Who may start one: `can_message(a, b)` (case manager and their assigned member, program lead and a member signed up there, and so on) plus D-262 (0072: a super admin and a case manager or a program lead, **never a member**). `can_start_conversation` adds D-541: a member may write to a program (`message_program(service)` picks one lead) with no sign-up and no visit; and a program's lead may write to a member who has a visit there (a72). Opening writes an audit row `conversation.open`.
- A limited account can read but not send or start one (D-413, `is_active_account()`); a paused one cannot sign in.
- A new message lights the bell, never a text (0064, `notify_on_message`): `notifications` kind `message_received` with the sender's first name and never the body.
- A reported message is the one way a case manager or the Pam team reads a body outside a conversation (`report_message`, 0034/0065): the reported excerpt only.
- The Messages tab is hidden when a real account has nobody to message (D-511, `useMessagingReach`). A super admin's bar is Home, Explore, Messages, Profile (`tabs.ts`).

**What this plan replaces and what it keeps.**
- **Replaces** (for signed-in people): Contact Pam in the app. It would open the Pam conversation instead of sending a signed-in person out to a website form and an email.
- **Keeps**: the website help desk and its **Still stuck?** form, for people who cannot sign in (a bad code, a paused account, no account yet, the case-manager and program-lead askers on the website). The `help-request` function and its switch (`HELP_REQUESTS_LIVE`, a62) are untouched. A signed-in person who lands on the website is still shown the address.
- **Keeps** every existing conversation exactly as it is. `can_message`, `can_start_conversation`, `open_direct_conversation`, `message_program` and the two-member rule do not change.

## 2. The model

### Pam is a party without being an account

Three options were weighed.

| Option | What it is | Verdict |
|---|---|---|
| **A. A Pam conversation with one member** | `conversations.kind = 'support'`, one `conversation_members` row (the person), and the team reaches it through a rule scoped to `kind = 'support'` and `is_super_admin()`. | **Recommended.** No fake account; no change to any other conversation. |
| B. A "Pam" profile as the other member | A profiles row, which needs an `auth.users` row, a role, a region. | Rejected: a fake account is a thing every policy, count and `people_activity()` would have to learn to ignore. |
| C. The super admin as the other member | Each thread names a super admin. | Rejected: history breaks when the person changes; members would see and could block a person; a thread has two members and the team has more than one person. |

**Option A, in outline** (the names are proposals, not final):
- `conversation_kind` gains `'support'` (an enum value, added in its own migration because a new value cannot be used in the transaction that adds it).
- One table, `pam_threads(conversation_id pk → conversations on delete cascade, asker_id → profiles on delete cascade, status 'open' | 'closed', last_team_read_at, created_at)`, with a **unique index on `asker_id`**: one Pam conversation per person, ever. It holds what the inbox needs and nothing about the content. RLS on, one policy: super admins select and update; no one else. (Test 03 wants a policy on every RLS table.)
- `open_pam_conversation()` (security definer, `search_path = public, extensions`, signed-in only): returns the caller's Pam conversation id, creating it with the caller as its only member if it does not exist. It is the only way to create one. It writes no audit row that names the asker in `meta` (the D-599 lesson: if it must, `target_id` is the asker).
- The person writes with the existing insert on `messages` (they are the conversation's member). The existing `notify_on_message` trigger would notify "every other member", of whom there are none, so the team is notified by a new branch of the trigger (section 3).

### What the team can read: only Pam conversations

New policies, each of the shape `public.is_pam_team() and exists (select 1 from conversations c where c.id = conversation_id and c.kind = 'support')`:
`is_pam_team()` is one small function that today returns exactly `is_super_admin()`. Every Pam policy and function calls it and not `is_super_admin()` directly (Ava's suggestion). If support staff are added later, that is the one place to widen who reads Pam conversations, without giving them the super admin's other powers, such as approving staff requests. Widening it would itself be two sign-offs from Will (a new reader of message bodies, and a new role).

- `messages_select_pam_team` on `messages` (select);
- `messages_insert_pam_team` on `messages` (insert, `sender_id = auth.uid()`, active account), for replies;
- a select on `conversations` and `conversation_members` for the same case, so the inbox and the thread header can be read.

Everything else about `messages` stays. In particular **`messages_select_conversation_member` is untouched**, the existing "no admin policy" is untouched for every other `kind`, and a case manager (`admin`) gets **nothing**: only `is_super_admin()`. A Pam reply is a normal `messages` row with `sender_id` the super admin who wrote it. Nothing the asker can read resolves that id: the asker cannot read profiles outside `conversation_partners()`, and that function will return, for a Pam conversation, one fixed row whose name is "Pam" and whose role is `pam` (the app draws the label; there is no first name). The id is therefore on the row but never turns into a name for the asker. Which super admin replied is in `audit_log` (`pam.reply`, `actor_id` the replier, `target_id` the asker), which only the Pam team reads, and which the six-month purge removes with the asker's account (D-443, D-599: the asker in `target_id` is covered).

**`ADMIN_CAN_SEE` must not widen except for this, and this is a widening.** Proposed entry, super admin only:

> `messages_written_to_pam`: the messages a person writes in their Pam conversation, and the replies. Read by a super admin and nobody else (not a case manager, not a program). Said to the person on the Privacy page and in the conversation itself before it goes live.

`ADMIN_CANNOT_SEE.message_bodies` stays true for every other conversation; its comment gets "except a Pam conversation" and the decision that records Will's pick. There is no automated test today that holds `ADMIN_CAN_SEE` to the policies (D-153 says so). This work should add one, as part of the build: a DB test that (a) a super admin reads a support conversation's messages, (b) a super admin reads no message in a `direct` conversation they are not in, (c) a case manager, a program lead and a member who is not the asker read no support conversation, (d) the asker cannot read another person's, (e) `pam_threads` is closed to everyone but super admins.

### The super admin's side

- **Inbox.** `pam_inbox()` (super admin only; security definer): one row per Pam conversation: the person's first name, role and region (and the program's name for a lead; the region is what tells two members called Marcus apart, and the Pam team already sees it in `directory_people`, so it is not a widening; Ava's ask), `last_message_at`, who wrote last, status, whether it waits for a reply, and the first line of the last message (they read the messages anyway, and this is what makes an inbox usable). No last name, phone, email or city beyond the region (D-588 keeps those to the Pam team through their own screens; the inbox does not add them).
- **Reply.** The same `ThreadView` and the same composer, opened on a Pam conversation, with the header showing the asker. A reply is shown to the asker as from **Pam**.
- **Close and reopen.** `pam_set_thread_status(conversation, 'closed' | 'open')`. Closed is a label; the thread stays readable and a new message from the asker reopens it.
- **Start a conversation** with any member or any program. `pam_start_conversation(profile_id)` for a person: creates the person's Pam conversation (the same unique one) if it does not exist and writes the first message. For a program: the program's active leads; section 6 asks Will whether each lead gets their own Pam conversation or the program gets one. **A member is the case `can_message` forbids today (D-262: "never a member").** This plan does not widen `can_message`: a Pam conversation is not a `direct` one, so the rule that keeps the team out of members' own conversations is untouched; what changes is that the team can now write to a member **as Pam**, in the member's Pam conversation. That is a second thing to tell people (section 4).
- **Staff and Pam.** A super admin can already write to a case manager or a program lead as themselves (D-262, 0072: a `direct` conversation, and still the way to coordinate how to use the app). Writing to them **as Pam** is the Pam conversation, so a lead hears from "Pam" in one place whether they wrote first or the team did. The direct route is untouched.
- **Picker.** Section 5 (Ava). It lists people by first name, role and, for a lead, the program, and nothing else.

### Migrations (all expand; no DROP; each `security definer` sets `search_path = public, extensions`)

1. `conversation_kind` add value `'support'` (own migration).
2. `pam_threads` table, its unique index and its RLS policy; an after-delete trigger on `pam_threads` that deletes its conversation (so an erased asker leaves nothing behind; section 4).
3. The super admin policies on `messages`, `conversations` and `conversation_members`, scoped to `kind = 'support'`.
4. `open_pam_conversation()`, `pam_inbox()`, `pam_set_thread_status()`, `pam_start_conversation()`, and `conversation_partners()` returning the fixed "Pam" row for a support conversation. Grants: `authenticated` only; the three super-admin functions refuse anyone else inside the body (`ONLY_A_SUPER_ADMIN`, the existing code).
5. The notification kinds (section 3) and the `notify_on_message` branch for support conversations.
6. The send limit (section 4): a before-insert trigger on `messages` for support conversations.

Applied by Mira, after `list_migrations`, in that order, and a DB test per migration. `pnpm --filter @pam/db test` is the check.

## 3. Notifications, the tab and the badges

**The bell only.** `texts_live` is off; account texts are exempt, and a Pam reply is not an account text. A Pam message never goes to `outbound_messages`. (When `texts_live` is on and a61 "text back" is decided, "Pam wrote to you in the app" is a natural first text; it is not part of this.)
- **The asker** gets a bell row when the team replies or writes first: a new kind `pam_message` (or `message_received` with a `pam` marker; the kind is a check list in 0064 and gets one new entry), `body_key` and `body_vars` carrying no text of the message. The bell row opens the Pam conversation.
- **The team** gets a bell row when a person writes: every super admin, kind `pam_inbox_new`, carrying the asker's first name and role, never the body. A conversation that already has an unread row from the same person does not add another (so a burst of messages is one bell row, not twenty).
- Nobody else is notified. In particular a case manager hears nothing.

**The Messages tab and D-511.** D-511 hides the tab "if no connections exist". With Pam, nobody has "no one to message": a person can always write to Pam. Two ways, in section 6 as question 1. Recommended: **the tab shows for everyone with an account**, and a person with no other conversations sees Pam as their one conversation, not an empty list. It is a real conversation (created on first use, not before), so it is not "example data" (D-511's other rule is untouched: real accounts see no examples). Until the person writes, the Messages list shows one row, "Pam" with the line "Write to Pam" and no unread count. Opening it creates the conversation (`open_pam_conversation()`), so there is no thread to read yet and nothing to pay for.
- **Unread and the badge (D-586).** The tab shows the red badge only for new, the plain number is for a count at the end of a row. A Pam reply is new to the asker and lights the Messages badge like any other message. For the team, the Home row **Pam inbox** carries a **plain number**: the conversations waiting for a reply (D-586's rule for counts of work waiting); the red badge is only for what is new since they last looked. Ava builds the row; the number comes from `pam_inbox()`.
- **Contact Pam (D-512).** Signed in, it opens the Pam conversation (`/messages/thread/?pam=1`, in the way `?program=` opens a program's, D-541). Signed out, it is unchanged. The `Notice` action and Help's first row both go there. `ContactHrefProvider` already switches the destination by sign-in state, so this is its one new branch.

## 4. Safety and limits

- **The person is told, in the conversation, before they write.** One line pinned above the composer in every Pam conversation: that the Pam team reads what they write here. This is in addition to the Privacy page and the transparency screen, because a person reaches this screen from Help, not from Privacy. (Words: Sage.)
- **Not for emergencies.** A line in the same place: for an emergency call 911, and for a crisis 988 (the numbers the `your-safety` post and A28 already name). Pam has no hours and no phone and promises no reply time; the existing "A person at Pam reads every message." is the promise and the only one (A28 removed the hours).
- **Rate limits.** A before-insert trigger on `messages` for support conversations only. Proposal: ten messages an hour and forty a day from the asker; refusal code `PAM_RATE_LIMITED`, shown as a line in the composer's place (the W4 banner pattern, D-603). Same shape as `help_request_allowed`'s idea but keyed on `auth.uid()`, so it stores no hash. The team is not limited; every team reply is audited (`pam.reply`).
- **Length.** The same body cap as other messages.
- **Attachments: none in the first version.** Photos and documents live in two buckets with no admin policy (`message_photos`, `message_files` in `ADMIN_CANNOT_SEE`). A screenshot would help support, but it is a second widening (two storage policies, two more entries) and the first widening is enough to ask Will for. Text first; section 6 asks.
- **No link previews and no translation by default.** `message_link_previews` and the message translation (`MESSAGE_TRANSLATION`, 0084) read a message with a third party or a server step; both are keyed on `in_conversation`. A Pam conversation is excluded from both until Lena and Will have said how the Privacy page describes it. (The team reading Spanish, Arabic or Chinese without translation is a real cost; question 9.)
- **Reporting and blocking.** A Pam conversation has no Report and no Block. Reporting a message to the people who read it makes no sense, and blocking Pam would cut a person off from help. The menu items are hidden for `kind = 'support'`.
- **Limited accounts (D-413).** A limited account can read but not send. If that applied here, the people most likely to need to write to Pam (to ask why) could not. Recommended: a limited account **can** write to Pam, in the Pam conversation only, at a tighter limit; a paused one still cannot sign in, so it uses the website form. This changes `terms.s.limits.p2` ("it can read messages but not send them") and is question 2.
- **An erased account.** Deleting an account deletes the person's own messages today (`messages.sender_id` cascades). In a Pam conversation the team's replies would remain in a conversation with no member. The after-delete trigger on `pam_threads` deletes the conversation, and its messages cascade with it. So the day the person is erased, the whole Pam conversation goes, replies included, **immediately**, not after six months. The audit rows that name them (`pam.reply`, `conversation.open` if written) stay six months and go with the account's other rows (D-443; D-599 covers a person named in `target_id` or at the top level of `meta`). Nothing in the audit row quotes a message. A DB test proves it.
- **Retention.** The existing promise stands (`privacy.s.how-long.p1`: messages are kept while the account is used). No new retention rule is proposed; **Close** is a label, not a deletion. If Will wants Pam conversations to go after a period of quiet, that is a new line on the Privacy page and a nightly sweep (question 8's neighbour; not recommended for the first version).
- **Abuse by the asker** (harassing the team): the team closes the thread and limits the account through the existing `admin_set_access_status` (D-413), which is how a case manager already limits an account; the rate limit stops flooding. No new tool.
- **Abuse by the team** (a super admin writing to a member unprompted): every start and reply is in `audit_log`; section 6 asks whether a member can switch Pam's first message off.
- **The privacy guard (D-587).** A message to Pam is an input the app takes and the team reads; `packages/config/src/data-collected.ts` gets an entry with the Privacy line that covers it, or the tests fail.

## 5. What it needs from others

| Who | What |
|---|---|
| **Ava** (super admin screens) | The Pam inbox: the Home row ("Pam inbox" with a plain-number count, D-586), the inbox list (first name, role, program for a lead, waiting-for-reply, closed), the thread header on a Pam conversation (the asker's first name and role; Close and Reopen), and the **start** flow (a picker: any member, any program). **Seam, agreed with Ava:** I deliver the database (sections 2 and 4), `lib/usePamInbox.ts` (reads `pam_inbox()`), `lib/useOpenPamConversation.ts` (`open_pam_conversation()` and `pam_start_conversation()`), the `?pam=` entry on `/messages/thread/` and the `ThreadView` changes (Pam as the other party, the pinned lines, hiding Report and Block). Ava builds the screens on those hooks and their fixtures in `mockSupabase.ts`; Ava does not touch `ThreadView.tsx` or the messages migrations; I do not touch the inbox screens or `RequestsScreen`. If a screen needs a column the function does not return, Ava asks me and I add it. |
| **Dot** | A picture for Pam: the conversation's avatar and the Messages row (a mark, not a face, so it is not mistaken for a person); the pinned lines' look; the thread's header on both sides. Stories for the new states. |
| **Sage** (words, then Lena translates) | The Messages row and its empty line ("Write to Pam"), the thread title, the placeholder, the two pinned lines (the team reads this; for an emergency call 911 or 988), the bell lines for both sides, the Contact Pam label if it changes, the rate-limit line, the closed-thread line, and the Home row. Every one is a new app sentence (A29). |
| **Lena** (Privacy, Terms, seven languages) | **The Pam team reads these messages, and members must be told before it goes live (D-413).** A new paragraph on the Privacy page (who can see: only a super admin, only in the Pam conversation, never another conversation), the transparency screen's short line (`transparency.canSee`, added with the `ADMIN_CAN_SEE` entry), the second thing to tell people (the team can start a conversation with you as Pam), and, if Will says yes to question 2, the changed `terms.s.limits.p2`. `legal:date` for each page that changes; a native reader for the Privacy lines (`docs/before-launch.md` already holds that kind of item). |
| **Piper** | The program side of "message programs": which lead or leads a program-directed message reaches (section 6, question 4) reuses her `message_program` choice of lead (already-talked-to, else longest-standing). She should confirm the rule for a program with no active lead (refused with a plain line; the team writes to the program some other way). |
| **Iris** | Her support research is running in parallel. What she finds about how people ask for help (the words they use, the time they expect an answer) feeds Sage's lines and question 3. She should test the asker's side on a phone once built: write, wait, see the bell, read the reply. |
| **Wren** | Nothing to build. The website's help desk keeps **Still stuck?**; a post can say "in the app, Contact Pam opens a conversation". |
| **Mira** | Applies the migrations, in order; owns the switch to go live; and decides the order against the Privacy lines (the lines ship in the same batch or earlier, never later). |

## 6. Open questions for Will (choices, with my recommendation)

1. **Where does Pam live?**
   - **(a, recommended)** In Messages, for everyone. The tab shows for everyone with an account; a person with no other conversations sees Pam as their one row. Contact Pam (signed in) opens it. *Changes D-511's "no tab with no connections": there is always someone now.*
   - (b) Only behind Help and Contact Pam; the Messages tab stays as D-511 made it. Fewer people find it; no change to the tab.
2. **Can a Limited account write to Pam?**
   - **(a, recommended)** Yes, in Pam's conversation only, at a lower limit. It changes `terms.s.limits.p2`, which D-413 changed in the other direction, so it is a second promise change.
   - (b) No; a limited person uses the website form. Nothing in the Terms moves.
3. **May the team start a conversation with a member who has not written?** (Your words allow it.)
   - **(a, recommended)** Yes, as Pam, with a Privacy line and every start audited. The member sees "Pam" and a bell.
   - (b) Only with someone who has written to Pam first (plus programs and case managers). Safer, narrower than you asked.
   - (c) As (a), with a switch in Profile that stops Pam starting a conversation (replies to what they write still arrive). More to build; more respect for the person.
4. **A message to a program: who gets it?**
   - **(a, recommended)** Every active lead of the program, each in their own Pam conversation (the same text, written once).
   - (b) One lead, picked the way `message_program` picks, so a program with three leads hears from Pam in one place and the others do not know.
5. **Photos and documents in a Pam conversation?**
   - **(a, recommended)** Not yet. Text only, until the first version is working and you have seen what people ask.
   - (b) Photos too (screenshots), which needs the storage policies and two more `ADMIN_CAN_SEE` entries.
6. **Replies from "Pam", or from a name?**
   - **(a, recommended)** "Pam". The Pam team writes as one voice; a person can sign inside the message. Matches "A person at Pam reads every message."
   - (b) The first name of the super admin who answered. Warmer; it also means the asker can start to ask for "Will".
7. **Texts, later.** Bell only now (your instruction). Recommended: when texts go live and you decide a61, "Pam wrote to you in the app" is the first reply text, because a person who has not opened the app in a week will miss a bell. Yes or no for then.
8. **Closing and keeping.** Recommended: **Close** is a label; nothing is deleted except when the person erases their account, which deletes the whole conversation at once. Alternative: delete closed conversations after a year, with a Privacy line.
9. **Translation of Pam conversations.** The team will read Spanish, Portuguese, Chinese, Russian and Arabic. Recommended: no automatic translation in the first version; the team uses the translation tool they already use outside Pam. If you want the in-app translation (0084) to read these, it sends the text to a translation service and the Privacy page's translation section (D-423) has to say so for this conversation.

## What I would build, in order, once Will has picked

1. Migrations 1 to 3 and the DB test for who reads what (the test that does not exist today, D-153). This is the part Mira has to trust, so it ships first on its own.
2. The functions and `conversation_partners()` (4), the send limit (6), the erasure trigger (2), with tests.
3. The notification kinds and the trigger branch (5), with a test that nobody else is notified and nothing is queued for a text.
4. `ThreadView` and the app hooks, the `?pam=` entry, Contact Pam's new branch, Messages' always-on tab (if question 1a), the privacy-guard entry, Storybook fixtures.
5. Ava's screens on the hooks; Sage's words; Lena's Privacy, transparency and Terms lines; Dot's picture.
6. The Privacy and transparency lines go live **no later than** the batch that turns the conversation on (D-413).

Rough size: the database part is smaller than D-541 (one table, a handful of functions, three policies); the screens are Ava's; the words are the long pole.

## What this does not do

It does not change `can_message`, `can_start_conversation`, `open_direct_conversation` or `message_program`; does not let a case manager or a program read a Pam conversation; does not text anyone; does not store the website form's requests; does not switch on `HELP_REQUESTS_LIVE`; and does not touch `texts_live`, `dispatch-sms` or `sms-inbound`.
