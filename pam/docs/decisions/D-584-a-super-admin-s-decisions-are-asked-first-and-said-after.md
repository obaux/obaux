# D-584 — A super admin's decisions are asked first and said after

**Date:** 2026-10-15 · **Branch:** `claude/pam-super-admin-pass`

**Asked by:** the merge desk (15 October, 14:38), routing Iris's super admin first pass
(`docs/research/2026-10-15-super-admin-flow.md`): W1 and P1 to P7 for Accounts & invites. (W2 is D-568, held for card
a84; W3 is Nico's; W4 and "Take it off the list" are Piper's.)

## W1: ask, then say

- **Before:** Approve and Deny on a staff request, and Approve on a program to check, took effect on one tap. The
  screen went back to the list with no word. Deny texts the person (an account text, sent whatever `texts_live` says,
  D-481).
- **Now:**
  - Each of those taps opens Pam's `ConfirmDialog`:
    - Approve on a request: "Approve {name}?", body "Pam will text {name} that they are in."
    - Deny: "Deny {name}?", body "Pam will text {name} that the answer is no. They can ask again later."
    - Approve on a program: "Approve {program}?", body "What was sent goes on Pam as it is, for members to see."
    - The buttons are "Yes, approve" / "Yes, deny" and "Not yet". Approve still asks for the city first, before the
      confirm, as before.
  - After the decision the screen stays put and says what happened at the top ("{name} is in", "Request denied",
    "{program} is approved", "Your note is sent", "Discarded"). The one button goes back the way the person came
    (`goBack`).
  - Ask for changes and Discard already had their own step (the note; Discard's confirm); they now say after too.
- **Why stay on the screen rather than land on the list with a message:** the list has no room for a message that
  would survive the navigation. Staying is the pattern the new-number review (D-567) and the "is now a program lead
  too" notice already use. And going back with `goBack` fixes P2's "Back to Everyone" after a decision, which came
  from `navigate('/requests/')` pushing the stand-alone Requests page on top of Home.

## The polish

- **P1:** Home's "Programs to check" row shows how many are still to check. A request reads "City: {city}", not
  "Typed: {city}" (reworded `requests.city`).
- **P2:** Programs to check opened from Home goes "Back to Home" (`?from=home`); from Profile it still goes back to
  Profile.
- **P3:** "To look at" counts only programs in review (`toLookAt`), not a withdrawn one or one waiting on its leader.
- **P4:** on a program to check, the phone is written as a person reads it and calls; the website opens (with
  `https://` added when the leader left it off); the address opens in Maps (`directionsHref`, as on a place).
- **P5, half:**
  - Done: each "Demo view" switch is named for its person ("Demo view for Marcus", `tPlain`: a spoken name).
  - **Not done:** a person's row opening their page. A super admin has no person page for a real person today
    (`/person/` answers "not found" for anyone outside a case manager's caseload or a lead's program). Linking the rows
    would lead to a dead end, so it waits on a decision about what a super admin's person page shows.
- **P6:** Profile's list of staff tools is named "Your work" for a screen reader, not "Settings".
- **P7:** the invites log's states are at 14px (a label's size, A27). The theme draws every Token at 12px whatever its
  size prop, so the size is set here.

## Proof

`e2e/super-admin-pass.spec.ts` (P1–P7), and the decision tests in `invite.spec.ts`, `staff-request-approve.spec.ts`
and `programs-review.spec.ts`, which now go through the confirm and check the line after. Pictures:
`docs/design/review/2026-10-15-super-admin-pass/`.
