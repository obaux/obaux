# D-525 — a member can ask to add a program from Profile

**Date:** 2026-10-11 · **Branch:** `claude/places-programs-add-my-program`

## Decision

Will, 11 October 2026 (on the "I can't sign in" card, relayed by Mira): "anyone should be able to create a program." Until now a program lead joined only by invite (D-369). Pam's team still checks every new program once by hand so no fake programs go up (Will can say to skip the check); then it is live and they run it.

- **The door.** One row on a member's Profile, "Add my program" (not Explore: people there are looking for programs). Mira approved it. A member who already holds the provider role does not see it.
- **The questions.** The program lead's own (`AddProgramView` through `ProgramWizard`), with a `mode="ask"`: first name and city from the profile, language from the app. The send is `request_staff_access('provider', …)`, which any signed-in person could already call; it grants nothing.
- **Waiting.** The Profile row says "Being checked" and its page is a short status with what was sent. **A no**: "Not approved this time" with "Change it and ask again", which reopens the questions with what was sent. **A yes**: the account keeps its member side and gains the provider role and the program (D-491), and "Use Pam as" takes over; the row goes.
- **Asking again** (migration `20261011044654`): a request still waiting is not sent twice (`REQUEST_ALREADY_WAITING`); one that was approved is not reopened (`REQUEST_ALREADY_APPROVED`); one turned down can be asked again, which clears the old answer so Approve works (before, the upsert kept the decision and Approve said "already decided"). Sign-up's retry treats "already waiting" as sent. Test 55; test 20 now turns a request down before asking again.

## Role model

0078 lets one account hold member + provider and nothing else, so a member who adds a program keeps saved places, trips and their guide; there is no second account. D-369's worry (people choosing staff by mistake at sign-up) is not touched: this is a deliberate button after sign-up, and a super admin approves. Case managers are not part of it. Ava's removal of the super admin's role-preview icon does not touch "Use Pam as".

## Open

The decision text on a no (`staff_request_denied`) still says "Questions? Call {supportPhone}", which A28 makes wrong; Sage's version ("Questions? Visit joinpam.org/support") is on card a59 for Will, and Nico changes the template. Whether Pam's team should be told when a request arrives is the existing Requests bell.
