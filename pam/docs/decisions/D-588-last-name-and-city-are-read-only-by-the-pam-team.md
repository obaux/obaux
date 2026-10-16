# D-588 — Last name and city are read only by the Pam team

**Date:** 2026-10-16 · **Branch:** `claude/pam-last-name-city-private`

## Decided

Mira asked for this on 16 October, from Lena's privacy guard (D-587). A person's `profiles.last_name` and
`profiles.home_city` can no longer be selected by anyone signed in or signed out, the person themselves included.
Only the service role and `security definer` functions read them. Migration `20261016145411` takes the two columns
out of 0075's column grant to `anon` and `authenticated`.

## Why

- 0075 gave every column but the phone to `anon` and `authenticated`. Through the 0007 policies, a regional case
  manager, an accepted buddy and anyone reading a public mentor could select a last name and a city. No screen does,
  so nothing was gained by allowing it. Lena is writing the Privacy line that says only the Pam team reads them.
- The person's own row loses them too, and no own-row function replaces them. About you starts empty and never
  prefills them, and Profile, Home, the caseload and the invite flow never ask for them. An own-row reader would be
  code with no caller.
- Writing stays: `updateMyDetails` uses 0046's `grant update (last_name, home_city)`. An update needs select only on
  the columns it filters on (`id`), so it still works. Test 74 shows it.
- Every database function that reads them is a definer (`start_membership`, `redeem_invite`, `request_staff_access`,
  `review_staff_request`, `invites_log`). Test 74 fails if a function that is not a definer ever reads either column.

## What a later session might reverse

- If a screen ever needs to show a person their own last name or city (say, to edit it later), add a narrow own-row
  function (`my_details()`, definer, `where id = auth.uid()`). Don't put the column grant back: that reopens it to
  every policy at once.
- Test 04 read the approved person's last name as the super admin, signed in. It now checks it as the server, which
  is what the super admin's paths do.
