# D-605 — Message Pam: Will's answers on card a100, and what they change

**Date:** 2026-10-18 · **Branch:** `claude/messages-pam-slices`

**Decided by:** Will, 18 October 2026, 07:04 UTC, answering card a100 (the nine questions in `docs/design/plans/2026-10-18-message-pam.md`), relayed by the merge desk:

> "I like the header for Pam where the icon is centered on top of message thread. No need to explain all the terms of use or crisis details, or who reads it written on the message or on the app's UI. Save it for the legal pages. Keep the UI clean. Messaging Pam should feel like messaging anyone else. Except Pam's message thread shows up on their inbox from day 1, with a welcome message preloaded on thread, message extends help inviting them to reply if they need support with anything. If they reply outside business hours, then reply with a message about when Pam is available. Progressive disclosure... 1. B... 2. Limited accounts can message Pam and vice versa no limit there. 3. Screenshots accepted, so they can submit feedback. So it's important the messaging feature is always prioritized so it works better than any other part of the app. This will become the primary channel for communication between users with accounts and Pam. Let's also update the help routes so they can reach Pam within the app, not just by filling out the 'still stuck' form."

## What it is now (the merge desk's reading, 07:05 UTC)

1. **B: Pam can start a conversation** with any member, staff member or program, in that person's one Pam conversation. **D-171 and D-262 change for Pam's conversation only** (a super admin still cannot open a `direct` conversation with a member; `can_message` is untouched).
2. **Pam's conversation is in every account's Messages from day one**, which changes **D-511** ("no Messages tab with nobody to message"): there is always someone now. It starts with Pam's welcome message.
3. **A clean thread.** No pinned card, no "who reads this" strip, no "Pam started this conversation" line on the member's side. Pam's mark centred above "Pam" is the thread's intro (Dot's x1); the bar says "Pam" once it scrolls away. The terms and the crisis lines live on the legal pages, not in the thread.
4. **Out of hours,** one automatic reply saying when Pam is available (Sage's words, ending with one 988 line), once per stretch of closed hours. The hours are a setting the super admin edits; default Monday to Friday, 9:00 to 17:00, America/New_York, until Will says otherwise.
5. **Screenshots:** photos in the composer, no documents; the microphone stays. **Limited accounts** can write to Pam and Pam to them, at no lower limit than anyone else; the general anti-abuse limit stays.
6. **Help routes:** Contact Pam and Help's "Write to Pam" open the Pam conversation for a signed-in person; signed out they still go to the website's help desk.
7. **Will's bar:** messaging works better than any other part of the app. A message is never lost; photos upload with progress and a retry.
8. **It ships behind a switch (off)** until Will signs the rewritten Privacy and Terms lines (Lena).

## What this replaces in earlier records

- **D-171 / D-262** (a super admin messages nobody / only staff): narrowed again, for the Pam conversation only.
- **D-511's tab rule:** the Messages tab shows for everyone with an account.
- **D-413's "a limited account can read but not send":** a limited account can send **to Pam**, and Pam can write to it. Every other conversation keeps D-413. `terms.s.limits.p2` changes (Lena).
- **My plan's answers 1 to 9**, where Will's answers differ: no pinned lines (question 4 of section 4 is dropped), photos yes (question 5 was "no"), limited accounts yes (question 2 a), Pam starts with anyone (question 3 a), a welcome message and an out-of-hours reply (new), a switch.

## What stays

`ADMIN_CAN_SEE` does not change. What the Pam team reads is `PAM_TEAM_CAN_READ` (Lena, taken by the merge desk, 18 October). Widening either needs Will, and members are told first (D-413): the Privacy and Terms lines ship before the switch is turned on.

The slices, the migrations and the switch are in `docs/design/plans/2026-10-18-message-pam-slices.md`.
