# D-544 — A place nobody on Pam runs offers no message

**Date:** 2026-10-12 · **Branch:** `claude/messages-no-lead-no-message`

**Decided by:** Will, 12 October 2026: "When members open programs that were not created, they shouldn't be able to see the list item to message that program (since we don't have anyone representing that program in our system…). We have programs scraped from the internet and also programs created in Pam. We need different approaches."

A member on a place with no lead on Pam (`service_has_lead` false) is not offered a message: no "Send a message" row, and no "Message the program" item in the ⋯ menu. Call and Website stay. While the answer is still being fetched the entry points wait (`usePlaceLead` returns null), so they do not flash in and out; a failed lookup counts as "no lead", as it already did. A place with a lead keeps today's behaviour; D-541 part 2 later makes that row open a conversation. Staff keep what they had. No new strings.
