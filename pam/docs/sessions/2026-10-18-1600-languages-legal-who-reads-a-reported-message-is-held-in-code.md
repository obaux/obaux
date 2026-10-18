# Languages & Legal · who can read a reported message, held in code (18 October 2026, ~16:00 UTC)

Lena, on `claude/lena-report-reach-pin`, off main `1551ed31`. From Sage's D-608 audit (`04768917`, then `8e302eea`): the report screens say "Pam and your guide see this one message", and the Privacy page says only the guide does.

## What changed

- **`reported-message-reach.test.ts`:** holds in the database what the one-clause fix for `who-can-see.p3` will say ("The Pam team can too, and so can the guide of the person who wrote it"). `report_visible_to_me()` (0065) lets a super admin read any report, and a case manager only through an open assignment to the sender or the reporter of the message; the only policies that can read `reports` are the reporter's own and the one that calls that function; a reported message's photo and document go through the same function (0079, 0080). Mutation-tested five ways (no super admin; reporter dropped from the assignment; assignment not required to be open; a widening `select` policy; the photo path off the function).
- One `it.todo` for the sentence itself, to be written when Will signs it.

## Found

- No live Privacy line or transparency card says the Pam team reads a reported message (only Terms, "A person reads it", and Wren's two site posts). Sage has made the clause a condition of cutting `messages.report.*` from the screens.
- The sender's guide reads a reported message too, not only the reporter's; the screen lines understate it.
- The transparency screen's Pam card lists one thing ("What you and Pam write to each other") under the heading "The Pam team can see:", which reads as a complete list; the team also reads reported messages and, per Privacy p1/p7/p14, last names, cities and staff emails. Raised with Mira for Will.

## Left undone

Will's signature on the clause; then `who-can-see.p3` in `en.json` and six languages, the Pam card's second line if he wants it, `legal:date privacy <ship day>`, `copy:ack`, and the todo above.
