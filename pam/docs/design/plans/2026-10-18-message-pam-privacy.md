# Message Pam: the Privacy, transparency and Terms lines (one short card for Will, rewritten for his 7:04 answers)

**Status:** draft English for Will to sign; nothing built, **nothing translated until he signs**. Lena (Languages & legal), 18 October 2026, against Nico's plan `2026-10-18-message-pam.md`, Ava's `2026-10-18-message-pam-admin.md`, Sage's ledgers (`d9174a60`, `d849470f`, `179bd706`, `ebc727f1`, `e8164a44`) and Will's answers on a100 (18 October, 07:04). The first versions of this file (with a pinned line, an in-app notice and a Profile switch) are in its history; Will's answers retire them.

## What Will answered, and what it does to the lines

| Will | What it does |
|---|---|
| **B:** Pam can start a conversation with anyone. Pam is in everyone's Messages from day one with a welcome message; outside business hours Pam replies with when it is available. | L2 is B's line, nothing else. The welcome message and the after-hours reply are Pam's messages in the same conversation, so L1's "or Pam writes to you" already covers them; no line of its own. **The Profile switch (C) is retired**, with its hint and its notice. |
| **Limited accounts can message Pam and vice versa, no limit there.** | L3 changes seven places, with no lower limit mentioned anywhere (below). |
| **Screenshots accepted.** | Photos only (not PDF or Word files). L1 and L4 say photos, and `data-collected.ts` gets an entry (below). |
| **No in-app explaining of who reads it, the terms or the crisis details; save it for the legal pages. Keep the UI clean.** | The pinned line above the composer is gone, so is the in-app notice (L5), so is the staff variant of the card sentence (it was for the pinned line). Terms already has the crisis lines (`terms.s.emergencies.p1`, `p2`: 911 and 988) and the photo rule (`being-decent.p4`); no new Terms line is needed except L3. |

## The card: the lines to sign

**L1, Privacy `what-we-keep.p17` (new).** Photos added to what is kept and to who reads it:
> If you write to Pam in the app, or Pam writes to you, we keep what you both write, and any photos you send. Only the Pam team reads this conversation and sees its photos. Your guide and your programs don't see it. We keep it while you use Pam, and if you ask us to delete your account, we delete the whole conversation with it, photos too.

- Sage's earlier edit stands ("or Pam writes to you"). The second sentence is her card sentence with "and sees its photos" added: **hers to sign again** (ledger to come).
- "Pam writes to you" covers the welcome message and the after-hours reply (Pam's messages in the same conversation) and a conversation the team starts under B.
- *Optional, one line, Will's call (not in the text above):* "A screenshot shows everything on your screen, so look at it before you send it." The documents line already says the same of a file (`what-we-keep.p5`: "look at what is in it first"); a screenshot of a phone can show other people's names and messages. It is on the legal page, not the screen, so it keeps the UI clean.
- `what-we-keep.p4` ("Only the person you send it to can see it.") is left alone: for a photo sent to Pam, the person is the Pam team, which L1 says.

**L2, Privacy `contact.p3` (new): B's line, unchanged.**
> The Pam team can start a conversation with you, as Pam. You will see it in Messages, and only the Pam team can read it.

**L3, limited accounts write to Pam, and Pam to them, with no lower limit.** Seven places say today that a limited account cannot send; all seven change together, in the same batch:

| Place | Now | New |
|---|---|---|
| Privacy `limits.p2` | A limited account can read messages but cannot send them. A paused account cannot sign in. You can always contact Pam for help. | A limited account can read messages and write to Pam, but cannot send other messages. A paused account cannot sign in. You can always contact Pam for help. |
| Terms `limits.p2` | If an account is limited, it can read messages but not send them. If an account is paused, it cannot sign in. Either way, you can always contact Pam for help. | If an account is limited, it can read messages and write to Pam, but not send other messages. If an account is paused, it cannot sign in. Either way, you can always contact Pam for help. |
| App notice `notice.account_limited.body` (in `en.json` **and** `packages/config/src/notices.ts`, the banner's source) | You cannot send messages right now. Your guide turned this off for your account. You can still read your messages. Contact Pam and we will help you reach your guide. | You cannot send messages right now, except to Pam. Write to Pam and we will help you reach your guide. *(Sage, `ebc727f1`)* |
| Website post `StartHere.tsx`, section "You can’t send messages, or your account is paused" | Step 1: Your guide turned this off. You can still read your messages. / Step 3: Contact Pam and we will help you reach your guide. | Step 1: Your guide turned this off. You can still read your messages, and you can write to Pam. / Step 3: Write to Pam and we will help you reach your guide. (heading and step 2 unchanged) |
| Website post `CaseManagerAssignments.tsx` (line 39) | A limited account can read messages but can’t send them. A paused account can’t sign in. Pam always tells you when something is turned off and who to ask, and you can always contact Pam for help. | A limited account can read messages and write to Pam, but can’t send other messages. A paused account can’t sign in. Pam always tells you when something is turned off and who to ask, and you can always contact Pam for help. |
| Website post `PamWords.tsx` (line 109, the account-status table, "Limited") | An account with some things turned off. A limited account can read messages but cannot send them. | An account with some things turned off. A limited account can read messages and write to Pam, but cannot send other messages. |

- Nothing says anything about a limit on those messages: Will said none, so the pages do not mention one. (If Nico keeps a flood limit for everyone, it is not "a lower limit" for them and not a Privacy or Terms matter.)
- `terms.s.limits.p1` and `p3` do not change. `legal:date privacy` and `legal:date terms` move on the ship day. Wren changes the three posts in the same batch; Sage words the notice and the posts' steps, mine are proposals.
- If Will says no to L3 after all, none of the seven changes.

**L4, "What others can see"** (the screen members were promised: the last step of signing up shows every line, Profile › What others can see shows the short version; `TransparencyReading.tsx`, `TRANSPARENCY_SCREEN`). The Pam team is a third card beside "A program can see:", never in the guide's list, and a line in the short version. Photos added; worded with L1 (both directions, photos):
- Card heading `transparency.pam.heading`: **The Pam team can see:**
- Card line `transparency.pam.messages`: **What you and Pam write to each other, and the photos you send there. Your guide and your programs cannot see it.** (The screen splits a two-sentence line at the full stop into a lead and a grey line.)
- Short version `transparency.summary.pam`: **Only the Pam team can see what you and Pam write to each other, and the photos you send there.**
- Sage signed "What you and Pam write to each other." (ledger `179bd706`); "can see" and the photos are the new words, hers to sign.

**L5, telling members first (D-413): no in-app notice.** Will: nothing in the app explains who reads it. **The a94 precedent applies, and I recommend dropping the notice.** What a94 (D-595, b58) established: a change to what is seen is told to members on the Privacy page and on the transparency screens ("What others can see"), in the same batch as the change, with no in-app notice. Here the same two places carry it: L1 on the Privacy page, and L4 on the screen the promise is printed on (`transparency.footer`: "If this changes, we will tell you first."; `who-can-see.p4`). Two differences, both in this case's favour: nothing a member already has becomes visible (the team reads only what someone sends to Pam, which does not exist until they send it); and a new member sees the Pam card on the last step of signing up.

Plainly, for Will, in case it matters to him: "told first" is met by the Privacy page and the transparency screens being live **in the same batch as the conversation or before it, never after**. A member who writes to Pam without opening either page has not been told on the screen they are writing on. That is what he chose, it is what a94 did, and the legal pages say it. If Will would rather have even one line where people write, that is a design choice for him, not something the promise requires beyond a94. I do not think the promise needs more than the pages.

## Photos in the privacy guard (`data-collected.ts`): a new entry, drafted here, not applied

Applied when the lines are signed (the entry names `what-we-keep.p17`, which is not in `en.json` before then, and the guard would fail on it). One new entry, and `ThreadView.tsx` (which already has the photo picker) also collects it:

```ts
{
  id: 'pam-conversation',
  what:
    'What a person writes to Pam, and the photos (screenshots) they send there, and what Pam writes back, including its welcome ' +
    'message and its after-hours reply. The Pam team (`is_pam_team()`) reads and sees them; a guide and a program cannot. Not PDF ' +
    'or Word files and not link previews. Deleted with the account (the whole conversation, photos too).',
  covers: {
    keys: ['privacy.s.what-we-keep.p17', 'privacy.s.how-long.p1'],
    says: ['we keep what you both write', 'any photos you send', 'Only the Pam team reads this conversation and sees its photos', 'photos too'],
  },
},
// INPUT_FILES: apps/web/src/app/messages/ThreadView.tsx  collects: ['messages', 'pam-conversation']
```
The `messages` entry stays as it is (a Pam conversation uses the same composer; `what-we-keep.p3`, `p4` and the translation lines still cover the general case).

## What I will hold in tests once it is built, and what Nico's side must hold

1. **`message-pam-line.test.ts`** (mine): L1 and L4 each say both directions ("or Pam writes to you … what you both write"; "What you and Pam write to each other") and photos ("any photos you send … sees its photos"; "the photos you send there"), and each says only the Pam team (L1: "Only the Pam team reads this conversation and sees its photos. Your guide and your programs don't see it."; L4: "Your guide and your programs cannot see it"; the short version "Only the Pam team"). It fails if either drops Pam's side or the photos. No pinned line or notice to hold: there is none.
2. **L3 in seven places:** Privacy and Terms `limits.p2` both say "write to Pam"; the notice (`en.json` and `notices.ts`) is the same sentence; a test reads the three site posts (`StartHere.tsx`, `CaseManagerAssignments.tsx`, `PamWords.tsx`) and fails if one still says a limited account "cannot send" without Pam. (Today no test holds the posts to the policy.)
3. **L1 is true of the policies** (Nico's DB tests, mine to read): every new read policy on `messages`, `conversations`, `conversation_members` **and the photo storage** names `is_pam_team()` and `kind = 'support'`; none names the case-manager role or a program; `messages_select_conversation_member` keeps its "deliberately NO admin policy" comment.
4. **Erasure:** deleting the asker deletes the Pam conversation, its messages **and its photos in storage** (the same sweep as other conversations' photos, `how-long.p1`); L1 says "photos too".
5. **`PAM_TEAM_CAN_READ`** is its own list (not `ADMIN_CAN_SEE`), holds the messages and the photos, and a test ties it to L1 and L4; `ADMIN_CANNOT_SEE.message_photos` stays true of a guide.
6. **The transparency contract:** `TRANSPARENCY_SCREEN` gains the Pam card and the short-version line, and the existing test that no line falls out of `TRANSPARENCY_GROUPS` keeps holding.

## For Sage, Nico, Wren, Mira

- **Sage:** sign L1 again with the photo words, and L4's two new lines ("The Pam team can see:", the card line and the short-version line); the notice sentence and the three posts' steps are yours (mine above are proposals). The pinned line, the in-app notices (A, B, C) and the Profile switch are retired, so the notice words in `e8164a44` and `7b280684` are not used.
- **Nico:** photos in a Pam conversation need the storage policies for the team and two `PAM_TEAM_CAN_READ` entries (plan question 5b); erasure must delete the conversation's photos; the D-262 comments ("never a member") say "except as Pam"; the e2e on the limited screen (`messages.spec.ts` 161 and 626, both citing `terms.s.limits.p3`) now has a Pam conversation with a composer.
- **Wren:** the three posts above, same batch; and `MessagesInPam.tsx`, whose "Nobody else can [start a chat with you]" (line 24) and "A super admin: … Never a member." (line 36) are untrue under B and have no row for Pam.
- **Mira:** one card. `legal:date privacy` and `legal:date terms` on the ship day; the lines ship in the same batch as the conversation or before it. I translate when Will signs.
