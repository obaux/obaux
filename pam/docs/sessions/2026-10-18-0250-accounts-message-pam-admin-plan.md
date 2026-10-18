# 2026-10-18 — accounts message pam admin plan

**Branch:** `claude/pam-message-pam-admin-plan` (off `main` c67be570) · **Lane:** Accounts & invites (Ava)

## What changed

A plan, no code: `docs/design/plans/2026-10-18-message-pam-admin.md`. It covers the super admin's side of "Message Pam"
(Will, 02:39, via Mira). It goes with Nico's `docs/design/plans/2026-10-18-message-pam.md`
(`claude/messages-plan-message-pam` @ bfeead66).

- The inbox is the first row of the super admin's Home: a plain count of the conversations waiting for a reply
  (D-586). It opens `/pam/messages/`, grouped into waiting, answered and closed.
- Rows show only what `pam_inbox()` returns: first name, role, a lead's program, and region if Nico adds it. Region
  is already on Everyone.
- The person sees "Pam", never a staff name. Nothing is texted or emailed.
- New conversations start from Everyone's real rows and from a program's page. The program fan-out is a stub until
  Will picks.
- Who is the super admin: `is_super_admin()` alone today. For support staff later, the recommendation is a separate
  `is_pam_team()` for the Pam functions only, with Will's sign-off.

## What was wrong, and what missed it

- My first draft repeated Nico's model and said `transparency.ts` wouldn't change. Nico's plan proposes an
  `ADMIN_CAN_SEE` entry. Rewritten to link to his.

## Decisions made

- None claimed: it is a plan. When Will picks, the decisions to write are named in the plan's "Privacy and records".
- The plan names reversing D-171 for members (as Pam only) as Will's call, not something to slip in.

## Verified

- Facts checked against the code:
  - `RequestsScreen` is the super admin's Home.
  - `is_super_admin()` is migration 0033.
  - `can_message` and DB test 10 refuse super admin ↔ member.
  - Everyone's real rows have no link.
  - D-171, D-262, D-395, D-586 and D-588 are as cited.
- The split was agreed with Nico by message (02:48).

## Left undone

- Region in `pam_inbox()`: asked of Nico, 02:55.

## Needs a human

- Will, on the card: Q1–Q5 in the plan, Nico's §6 questions, and Dot's drawing after both plans.
