# D-613 — The Pam team's side of Message Pam: its own ⋯, fixed saved replies, writing first, hours with the reply shown

**Date:** 2026-10-18 · **Branch:** `claude/pam-message-pam-admin`

Builds on **D-605** (Will's answers on card a100), which says the Pam team reads people's Pam conversations and edits Pam's
hours. This records how the team's side works, decided while building S1 to S4, with Mira, Dot (x4 to x6, b5, b6), Sage,
Nico and Piper. Ava, accounts lane.

## What was decided

1. **The team's ⋯ is its own screen**, `/pam/thread/options/`: Close or Reopen, and what was shared. It has no Report and
   no Block: the team does not report or block someone who wrote to Pam. Nico's ordinary ⋯ (`ThreadOptionsViews`) is
   unchanged; the thread page picks one or the other (Nico, 16:23, a third option he chose).
2. **Saved replies are fixed words**, signed by Sage (5b9bc977) and kept in seven languages. They are never edited in the
   app. A pick fills the box and only Send sends it. The legal reply is held until a lawyer has read its list of free legal
   help. Nothing on screen marks that it is missing (Mira, 16:22).
3. **Closing asks nothing first.** Reopen undoes it, and so does the person writing again.
4. **Pam writes first to a person once.** If the person already has a Pam conversation, `/pam/start/` opens it instead of
   starting another. **To a program**, the words go to each active lead in a conversation of their own. A program with no
   active lead says so in one line and shows no composer, so nobody writes a message that cannot be delivered.
5. **On a program's page, while the switch is on,** the super admin's D-349 row becomes "Message this program" (Piper,
   16:41). When the switch is off it is D-349's row, as before.
6. **Pam's hours show the reply people get**, drawn by the same `pamSystemText('pam.away')` that the conversation uses, so
   the editor and the thread cannot say different things. The time zone stays Eastern. With no day ticked, Save refuses
   and says why.
7. **No reply-time line in v1** (Dot's review, Mira 16:25, under D-608's fewer words). It was built and then cut, along with
   its words in all seven languages. Nico's `pam_reply_times()` stays, if Will later wants reply times as a feature of
   their own.
8. **Staff sub-screens have back only**, with no Help (x5): Messages to Pam, Closed, and Pam's hours.

## What a later session might reverse

- Item 7 is the one most likely to come back. If it does, the median, rounded up and worded as "within", was what Sage
  signed (b947f366).
- "Message this program" goes to leads by `profiles.role`. Piper found this should be `profile_roles` (16:41), or a lead
  acting as a member is missed. That fix is Nico's.

