# D-491 — approving a request from someone who is already a member adds the role

**Date:** 2026-10-10 · **Branch:** `claude/places-programs-approve-existing-member`

## Decision

When a super admin approves a staff request and the person already has an account, `review_staff_request` no longer refuses. A member (or someone who already leads a program) who asked to lead a program is given the provider role on the account they have, the way `add_role_from_invite` does it (0078, D-374): a `profile_roles` row granted by the super admin, the acting role set to provider, and — if the request carries program details — the org and listing the no-profile path makes. Their own city stays theirs; a different city chosen is refused with `ACCOUNT_IN_OTHER_CITY`. Any other pair (a member asking to be a case manager, a case manager asking anything) raises `ROLE_PAIR_NOT_ALLOWED`, and denying still works. The no-profile path is unchanged. Mira asked for this at 16:07 on 10 October after Will, as super admin, could not approve a request from someone who became a member 46 seconds after asking.

The staff screen was also telling the super admin "This is not your fault. Try again, or call Pam": member words, and wrong for the person who is Pam. Now it says what happened (the person is now a program lead too, and keeps being a member), explains each refusal in staff words with a way forward, and never offers "Call Pam". Will's wording for the subtitle: "Wants to add a program" (provider) and "Wants to be a case manager".

## Why

A person can sign up as a member while their staff request waits; the old function could never approve them. Nothing in the data was wrong.

## What a later session might reverse

Whether a person who already leads a program and is approved again should get a second program (today: no org is made if they already have one).
