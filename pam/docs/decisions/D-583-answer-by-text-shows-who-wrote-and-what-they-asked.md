# D-583 — Answer by text shows who wrote and what they asked

**Date:** 2026-10-15 · **Branch:** `claude/messages-answer-by-text-context`

**Decided by:** Mira, relaying Iris's W3 (Super admin first pass, `docs/research/2026-10-15-super-admin-flow.md`), 15 October 2026: Answer by text showed a raw `+1` number and an empty box, so the reply was written blind. Answering by text itself stays off (D-524, D-547); this changes only the screen.

**What the screen shows now:**
- the number as a person reads it, `(215) 555-0142` (`displayPhone`);
- the person's first name when Pam knows the number: "To Ana, (215) 555-0142";
- what they wrote and when, in a card above the box: "They wrote · Oct 15, 2026, 2:05 PM", and their words as written, shown as text, never as markup.

**Where each comes from, and why nothing is stored:**
- **The first name** is a new super-admin-only RPC, `profile_first_name_for_phone(p_phone)`: one number at a time, a first name and nothing else, null for a number Pam does not know or a value that is not a phone number. The super admin already sees every first name, role and region in Everyone (`directory_people`); what is new is going from a number to a name. **That is a new capability, not a new datum, and it is flagged to Mira as a decision for her and Will.** It writes no audit row (adding one would add stored data; Mira's rule was to add nothing to what is stored). Test 74.
- **The words and the time** are stored nowhere (D-521: the help request is an email and a rate-limit hash). So they come from the link that opens the screen, in the part after `#`: `/reply/?to=+12155550142#q=<words>&at=<ISO time>`. A fragment never goes to a server, so it is in no request log. The screen reads it from the address and keeps nothing. `lib/replyContext.ts` (capped at the form's 3,000 characters, control characters out, a bad time dropped). **Nothing builds such a link today**: the email's "Reply by text" link is part of a61, which is off (D-547). When it is turned on, the help-request email must build the link with the words after `#`, never in the query. Storybook and demo accounts also accept `q` and `at` as ordinary query values so a story can show the screen; a real link does not use them.
- Anyone but the super admin gets the closed door, asks for no name and sees no words.

**New words** (Sage signs, Lena translates; drafts are in all seven languages): `supportReply.toNamed` "To {name}, {phone}" and `supportReply.theyWrote` "They wrote".

**Not done, on purpose:** the email link (a61 is off); an audit row; showing the person's role or anything else from the profile.
