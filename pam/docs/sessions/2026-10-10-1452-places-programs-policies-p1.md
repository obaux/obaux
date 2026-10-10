# 2026-10-10 — places programs policies p1

**Branch:** `claude/places-programs-policies-p1` · **Lane:** Places & programs (Piper)

## What changed

Policies P1 (Will's card a25, D-485). Migration `20261010144052`, expand only: `program_policies` + `program_policy_files` (RLS: a lead their own incl. archived; admins all; any signed-in person the current ones of a live program), `add_policy` (files already in the program's folder of the private `policies` bucket; ≤5 files, ≤10 MB, PDF/photo; `p_replaces` makes version n+1 and archives the old) and `archive_policy`; the bucket and its three storage policies (insert in the lead's own folder, read by the lead/admin/people reading a current policy of a live program, delete only an unused file). App: `usePolicies` reads and writes a real lead's policies (the example set for everyone else), uploads then calls `add_policy`, says a wrong file before sending, archives on remove, replaces on a policy's page, opens a page through a short-lived signed link. 12 strings in seven languages (drafts for Lena); stories; mock. Lawyer item added to before-launch.

## What was wrong, and what missed it

`PoliciesScreen` asked the example program's services for its "Every service" label even for a real program; it now asks the real program's.

## Decisions made

D-485 (Will's six answers, recorded).

## Verified

Whole database suite passes (new test 45: a lead makes and archives their own; titles, file count/size/type/folder checked; nobody writes the tables directly; replacing makes version 2 and archives 1; another lead sees nothing of it; a member reads only the current policies of a live program; signed-out reads nothing; the bucket is private, 10 MB, PDFs and photos; a lead puts files only in their own folder and takes back an unused one). Web 91, config 1035, tsc clean, Storybook builds; fit 0 new in seven languages and pseudo; e2e new program-policies (5 tests: list, upload to bucket then add_policy, wrong file refused first, remove asks then archives, version/pages/replace) + policies, a11y, place, visit-change, trip-booked: 123 passed.

## Left undone

Parts 2–4. Members and the example people still use the example policies; real places show none. The bucket policy SQL is in the migration for Mira to read at merge.

## Needs a human

Lena: 12 strings. Mira: apply `20261010144052`, read back the bucket and its three policies.
