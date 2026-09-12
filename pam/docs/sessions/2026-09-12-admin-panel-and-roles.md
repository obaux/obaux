# 2026-09-12 — The case manager screen, a way to sign in, and four roles instead of three

**Phase:** 1 (with a Phase 4 requirement landing mid-session) · **Sessions so far:** 7

## What changed

**`/admin` exists.** A case manager sees their caseload and makes an invite.
Those two, and nothing else: the other admin powers — turning a feature off,
pausing an account, making an introduction — all hang off a single member and
belong on a member's screen rather than as controls scattered down a list.

The invite code is the largest thing on the page once it exists, because it gets
read down a phone line. A test asserts 32px or more; "legible across a room" is
the actual requirement and a stylesheet edit could quietly undo it.

The §4.1 transparency contract is on the page in the same words members agree to
at onboarding. A promise only the person taking it on faith can see is a weaker
promise.

**`/signin` exists**, because the panel was unreachable without it. Phone number,
then a code. No password anywhere (§9). The state a member will actually hit — a
code that never arrives — is a way forward rather than a spinner.

**Four new requirements arrived from Will mid-session** (super admin, role pills
at sign-up, full database view, program admin chat). Two are written up and not
built, on purpose. See below.

## What was wrong, and what missed it

**The session was being stored where nothing could read it.** The app used
`@supabase/ssr`'s browser client, which keeps the session in a cookie so a
server can read it. PAM has no server — it is a static export wrapped by
Capacitor and served from a local file scheme where cookie behaviour is a coin
toss. A session that fails to persist signs somebody out mid-enrolment, the
exact failure §12's 90-day rule exists to prevent.

Nothing caught it for six sessions because nothing had ever signed in. It
surfaced from the test side: a browser test could not seed a session at all,
because the client was looking somewhere the test had not thought to put one.
The awkward test was describing a real defect, which is worth remembering.

**A privacy test caught the privacy promise.** The check that no member card
shows a message body or a buddy post failed — on the card that *promises* not to
show them. Scoped to the member's own card now. A blunt check in the wrong place
is still a blunt check.

## Decisions

- **D-065** — the case manager screen does two things, and the invite code is the product.
- **D-066** — plain supabase-js, not the SSR client.
- **D-067** — amendments to the SOP are recorded, not absorbed.
- **D-068** — two of the new admin requirements are not built, deliberately.

New file: `docs/sop-amendments.md`, and CLAUDE.md now points a future session at
it before they trust a rule they remember from the SOP.

## Verified

| Check | Result |
|---|---|
| `pnpm -w typecheck` | 5/5 packages |
| `pnpm --filter @pam/config test` | 156 tests |
| `pnpm --filter @pam/ui test` | 43 tests |
| `pnpm --filter @pam/web test` | 3 tests |
| `playwright test` (3 projects incl. dark) | 108 checks |
| `node scripts/check-bundle-budget.mjs` | 485.1 kB of 500 kB, 14.9 kB spare |

The database suite was not re-run: nothing in `packages/db` changed this session.

Sign-in has **not** been exercised against the real service, and cannot be:
Supabase sends the code through an SMS provider that is not configured. What is
tested is every state around it.

## Left undone

- **The four new requirements.** Two are ready to build once Will answers (see
  Needs a human); two — the super admin role itself and the error log — are
  straightforward and simply were not reached.
- **A member's own admin screen**, which is where the rest of §4.1 lives:
  feature toggles, access status, facilitation.
- Renaming `provider` → program admin and `admin` → supervising admin touches
  the database enum, every access rule and the transparency wording. Worth doing
  once, deliberately.
- Astryx's `TextInput` takes no `inputMode`, so the code field opens a full
  keyboard rather than a numeric keypad. Worth raising upstream rather than
  casting past the type.
- Bundle headroom is down to 14.9 kB.

## Needs a human

- **Will, on role pills** (amendment A2): member and program admin are safe to
  self-select; supervising admin is the role that watches people and should come
  from an invite. Confirm, or say otherwise deliberately.
- **Will, on "view the full database"** (amendment A3): a super admin who sees
  everything except message bodies and buddy posts, or full access with the
  transparency screen rewritten before it ships.
- **An SMS provider in Supabase**, still. The admin account exists, the sign-in
  screen exists, and nobody can complete a sign-in.
- A Google Places key; a host for the web app.
