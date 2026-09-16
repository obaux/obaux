# 2026-09-16 — Waiting looks like waiting

**Phase:** 1 (member-facing) · **Sessions so far:** 10

One thing, asked for plainly: moving between tabs showed a message about
finding places, and it should be a loader in the middle of the screen instead
(Will, 16 September).

## What was wrong

`places.loading` — "Finding places nearby..." — was the loading state on eleven
call sites across nine screens. Two of them were actually finding places. The
other nine were working out who was signed in, on the way to the account
screen, the saved list, the caseload, the directory, the notifications list and
sign-up.

It is on screen more often than it looks, because PAM is a static export and
the header's links are real anchors: changing screen is a full page load, so
that sentence is what a person reads every time they move. Copy that is wrong
three times out of four is copy people stop reading, which is a bad habit to
teach on the one screen where an error notice might later appear in the same
place.

## What changed

**`Loading`** (`packages/ui`) — Astryx's `Spinner`, centred, with the label
announced and never drawn (D-119). Two variants: `screen` fills the window
under the header, for a screen that knows nothing yet; `inline` sits in the
flow, for a list arriving under a header that is already drawn. Every one of
the eleven call sites is one or the other.

**The theme draws `xl` at 40px** rather than Astryx's 28. `--spinner-diameter`
is a themeable variable and `xstyle` will not take custom properties — the
type is `StyleXStyles`, which is a closed list — so the size belongs in
`pam.theme.ts` beside the brand, which is where the Astryx docs put it.

**`places.loading` is gone from both locales.** The spinner says the one thing
that is true on every screen, in every language.

## What was wrong, and what missed it

**Two screens were left with an empty `stylex.create({})`.** Saved and
Notifications had exactly one `<Text>` between them — the loading line — so
removing it left a dead style block, a dead import, and in Notifications two
style keys (`back`, `title`) that had been dead since before this session.
Typecheck does not mind unused StyleX keys, and `pnpm lint` still cannot run
non-interactively, so nothing would have said so.

**Two `role="status"` elements on the home screen.** The first test for "one
spinner per view" failed on a strict-mode violation: Astryx puts an empty
`aria-live="polite"` region inside the help link. The assertion now names the
spinner. Worth remembering before writing `getByRole('status')` again — the
role is not rare.

## Decisions

D-119 (waiting is a spinner, not a sentence), and amendment **A10**, which is
the same call written as a standing rule: §2.4 expects copy here and there is
none, so the next session reads why before putting a sentence back.

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | clean, 5/5 |
| `pnpm --filter @pam/config test` | 202 tests; en/es parity at 488 keys |
| `pnpm --filter @pam/ui test` | 66 tests, axe clean (3 new) |
| `pnpm --filter @pam/web test:a11y` | 393 browser tests across 3 viewports (12 new) |
| `node scripts/check-bundle-budget.mjs` | 499.8 kB first load, 0.2 kB to spare |
| By eye | 320px, light and dark: brand ring centred, mark above, help bar below |

The new browser spec holds the profile request open so the state stays still,
then measures the ring's box against the viewport — "centred" is a claim about
pixels, and the screenshot that proves it once does not prove it next week.

## Left undone

- **The §12 budget has 0.2 kB left**, and the spinner cost 0.1 of it. Nothing
  else ships until the Astryx imports are split.
- Unchanged from the last log: nothing reviews `staff_requests`, nobody can
  edit their own name or city, and the Twilio account is still in trial.

## Needs a human

Nothing new. The three from the 14th still stand: Twilio out of trial, somebody
to work the staff-request list, and the two design questions (the coral
dark-mode wordmark, the PAM-team line on the transparency screen).
