# D-559 — The help form asks who the person is, and only the email carries it

**Date:** 2026-10-13 · **Branch:** `claude/messages-help-request-roles`

**Decided by:** Will, 13 October 2026, after testing the live help form: "I didn't know whether the user was a member, program, both, or case manager. Let's ask this on the form." Wren adds the question on the site (choose all that apply; Sage words it).

`help-request` accepts an optional `roles` array of `member`, `program`, `case_manager`. The email says it in plain words near the top: "Says they are: a member and a case manager" (or "not said").

- **Dropped, not refused:** repeats and any value outside the three are dropped, so a label the site has not been told about never costs the person their message. A `roles` that is not an array, or has more than 10 entries, is refused with `field: "roles"` (a bug on the site, worth seeing). Values are read case-insensitively, a space or hyphen as an underscore.
- **Nothing kept:** the answer is in the email only. It is not stored, not logged, not in the limit call or the duplicate check (a double tap is still one email whatever was ticked), and not in the subject. The subject stays "Pam help request": the answer reads better inside the email than in a subject Will would not filter by.
- **The old `role` field** (a single string, usually not sent) is unchanged.

Tests: `packages/config/test/help-request.test.ts` (roles block). Contract: `docs/help-request-contract.md`. The function is redeployed by the merge desk after the merge; the site can send `roles` before then (an old function ignores unknown fields).

## Addendum, 13 October (Mira, after Sage's fourth choice)

Wren's form has a fourth choice, "I don't use Pam yet", sent as `not_yet` in `roles`. The email says "Says they are: not using Pam yet". If `not_yet` is ticked beside a role, the roles are kept and `not_yet` is dropped (the role says more). The email's "Role:" row now appears only when the free-text `role` was actually sent; the site no longer sends it, and "Role: not known" beside "Says they are" would only confuse. Still in the email to Pam's inbox only: nothing stored or logged.
