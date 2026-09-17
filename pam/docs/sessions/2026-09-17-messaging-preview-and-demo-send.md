# 2026-09-17 — Messaging is previewable again, a demo-only "send", and a program badge

**Phase:** 1 (member-facing product) · **Sessions so far:** many, this the
fourth on messaging alone today (following D-163/D-164/D-165/D-166/D-167,
D-168/D-169, D-170's merge, and D-171)

## What changed

D-171 (recorded earlier today, same overall arc) confirmed a super admin
cannot send a real message — correct, but the code that shipped alongside it
gated messaging on `trueRole` only, which meant the Home Messages tile and
`/messages/` itself never appeared during **any** "Viewing as" preview, for
any role. Every other previewable screen (`/admin/`, `/directory/`,
`/interested/`) gates on the previewed role; this was flagged as a bug
testing the live deployment (Will, 17 September), not a deliberate
restriction — so this session split the question D-171's code had
conflated: what a screen *shows* now follows `viewedRole`, and what data it
*fetches or writes* still only ever follows `trueRole`. See D-172.

That split leaves a gap — a preview shows chrome around a screen whose real
data intentionally never loads — filled with example content, the same
"real always wins, silently" fallback `/admin/` already applies to
`DUMMY_MEMBERS`:

- `packages/config/src/dummy-conversations.ts` (new) — `DUMMY_CONVERSATIONS`
  (one example set per member/admin/provider) and `DUMMY_STARTABLE`
  (case-manager/program "start a conversation" examples).
- `apps/web/src/app/messages/DummyRows.tsx` — renders them as plain,
  **non-interactive** `Card`s: no `href`, no `onClick`. This is the one place
  `/admin/`'s own dummy-row pattern could not simply be copied — its dummy
  `PersonRow`s are tappable because they only ever navigate to `/person/`, a
  read-only demo page, while `/messages/`'s real action (`openConversation`)
  is a live write. A tappable dummy row here would have been exactly the
  backdoor D-171 closed, one layer down.
- `apps/web/src/app/messages/DummyRowsLazy.tsx` — `next/dynamic` wrapper, so
  `dummy-conversations.ts` only loads for a preview or a genuinely empty
  real list, not every visit to `/messages/`.
- `apps/web/src/app/page.tsx` — the Messages tile now gates on `viewed`,
  matching the other three tiles.
- `apps/web/src/app/messages/page.tsx` — `canMessage`/`isStaff` now read
  `viewedRole`; `useConversations`/`useMessageableMembers` still read
  `trueRole` only, unchanged in spirit from before, just now clearly
  commented as the boundary that matters.

**Mid-session, a follow-up ask from Will, same arc**: while previewing as a
case manager or program admin and looking at an example member on
`/person/`, be able to compose a message and have it visibly "arrive" when
switching the preview to Member. Confirmed explicitly: not a real send, no
real recipient, nothing touching `messages`/`conversations`. Built as:

- `apps/web/src/lib/demoMessages.ts` (new) — `sendDemoMessage`/
  `useDemoMessages`, `sessionStorage`-backed (same mechanism `useViewAs`
  already uses, for the same "survive a preview switch this tab, gone next
  session" reasoning), keyed by *sending role* (`admin`/`provider`) rather
  than by a specific dummy person — `/messages/`'s member preview has no
  notion of "which member you are," so a message cannot honestly promise to
  arrive for one dummy identity over another.
- `apps/web/src/app/person/page.tsx` — a `DemoMessageComposer`, rendered only
  when `viewedRole` is `admin`/`provider` and the dummy person is a member.
- `DummyRows.tsx`'s `DummyConversations` reads the stored demo message and,
  only for the `member` preview, bumps the matching example row (by
  `otherRole`) to unread with the composed text shown — a display
  substitution on an already non-interactive row.

**Final follow-up, same arc**: Home's greeting always showed the real
signed-in account's real name, even mid-preview, which read as "the same
account wearing a badge" rather than a demonstration. Fixed by reusing
`/account/page.tsx`'s existing `DUMMY_SELF` substitution (D-174) — with one
difference: Home sits inside §12's bundle budget and `/account/` does not,
so `DUMMY_SELF` is loaded with a dynamic `import()` inside a `useEffect`
gated on `demoRole`, mirroring `HeaderBell`'s existing pattern for
`dummy-notifications`, rather than a static top-of-file import.

**Fourth follow-up, same arc**: a clickable badge naming which program a
member is genuinely connected to, opening that program's `/place/` screen.
Confirmed not a privacy widening first — a service is public catalogue data
and the enrollment link is already something a case manager/program admin
can legitimately see through existing RLS (`admin_covers()`,
`provider_linked_to()`). Built as:

- `apps/web/src/app/ProgramBadge.tsx` (new) — wraps Astryx's `Token` with
  `href`, the library's own clickable-chip pattern.
- `apps/web/src/app/PersonRow.tsx` — a new `programBadge` slot.
- `apps/web/src/lib/useCaseload.ts` — an added `enrollments` → `services`
  query (existing RLS, no new migration or RPC), filtered to
  `status in ('enrolled', 'active')` only — never a region-only match, never
  `interested`/`requested`/`dropped`.
- `apps/web/src/app/admin/page.tsx` — real caseload rows now pass
  `programBadge`; the dummy caseload rows deliberately do not (each already
  has its own card-wide `href` to `/person/`; a second nested link would
  contest the same tap).
- `packages/config/src/dummy-people.ts` — three of six `DUMMY_MEMBERS` carry
  a `program`, reusing existing `dummy-place-…` ids from `dummy-places.ts`;
  the other three deliberately carry none, to keep demonstrating "no badge
  without a genuine connection."
- `apps/web/src/app/person/page.tsx` — renders the badge when the dummy
  person has one.

Deliberately **not** added to a program admin's own screens: their view is
always their own org, so the same badge would name nothing they don't
already know from the screen it's on. See D-175 for the full reasoning.

Full set of decisions: D-172, D-173, D-174, D-175.

## What was wrong, and what missed it

A first version of the Home greeting fix used a static
`import { DUMMY_SELF } from '@pam/config/dummy-people'` at the top of
`page.tsx`. Nothing caught this as *wrong*, exactly — it worked — but it
cost Home's first load 0.8 kB (503.3 kB → 504.1 kB against the 500 kB
budget), because `dummy-people.ts` is the same file `HeaderBell`'s own
comment already warns against loading statically on Home, for the identical
reason. `node scripts/check-bundle-budget.mjs` is the check that caught it;
rewriting it as a dynamic import gated on `demoRole` (the `HeaderBell`
pattern) brought the growth down to 0.3 kB. Left as a small, disclosed
addition on top of the pre-existing 3.3 kB overage — not fixed, not hidden.

## Decisions

- D-172 — Messaging's Home tile and screen now gate on `viewedRole`; real
  data and real writes still only ever follow `trueRole`. Dummy rows are
  non-interactive by design, not merely by omission.
- D-173 — A demo-only "send a message" on `/person/`, entirely client-side,
  explicitly not in tension with D-171. Keyed by sending role, not by
  specific dummy identity — read the entry for why that's the most this
  composition can honestly promise.
- D-174 — Home's preview greeting reuses `/account/`'s `DUMMY_SELF`
  substitution, loaded dynamically to protect the bundle budget.

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | 5/5 packages pass |
| `pnpm --filter @pam/config test` | 225 pass (includes en/es key-parity, which the new `person.message.*` keys had to clear) |
| `pnpm --filter @pam/ui test` | 65 pass |
| `pnpm --filter @pam/web build` | Succeeds, static export, 25 routes |
| `node scripts/check-bundle-budget.mjs` | 503.6 kB gz on `/` — 3.6 kB over the 500 kB budget, unchanged by D-175: the Astryx `Token` component D-175 pulls in is not on Home's own bundle. It does add ~4 kB to `/admin/`, `/person/` and `/directory/` individually (all now 502–521 kB first-load, none of them the route §12 actually measures) — disclosed here since it is real growth, even though it does not move the one number the budget check enforces. |
| `pnpm --filter @pam/web test:a11y` (Playwright) | **Could not run.** `chromium_headless_shell` was not installed in this sandbox; `playwright install` failed — the agent proxy returned `403` for `cdn.playwright.dev` (`gateway answered 403 to CONNECT (policy denial or upstream failure)`), a host not on this environment's allowlist. Not a code problem; unresolved here. |

Not run: `pnpm --filter @pam/db test` — nothing in this session touched
`packages/db`, no migration, no RLS change.

## Left undone

- **The Playwright a11y suite has not been run against this session's
  changes.** `chromium_headless_shell` could not be downloaded in this
  sandbox (network policy, not a missing-package problem the way `postgis`
  was) — see "Verified" above. A future session with a working browser
  download path (or a pre-provisioned one) should run
  `pnpm --filter @pam/web test:a11y` against this branch before it merges,
  specifically checking the new `DummyConversations`/`DummyStartable`
  Cards and the `DemoMessageComposer` for target size and contrast, since
  neither existed in the 426-pass run recorded in `STATUS.md`.
- **The §12 bundle overage (3.6 kB now) is still disclosed, not fixed** —
  pre-existing from earlier sessions today (D-162, D-170) plus this
  session's own 0.3 kB. Reducing it is real, separate work.
- **The demo "send" only ever bumps one example row per staff role** — by
  design (see D-173), not a bug, but worth restating here in case a future
  session is asked for "a message per dummy person" and reaches for this
  code expecting it to already support that.

## Needs a human

Nothing new. This session answered its own scope entirely from Will's three
messages in this conversation (D-172's base ask, D-173's compose follow-up,
D-174's greeting follow-up) — no open question was left for him beyond the
Playwright gap above, which is an environment limitation, not a decision.
