# 2026-10-14 — places-programs DocuSign spike (code, throwaway)

**Branch:** `claude/places-programs-docusign-spike` · **Lane:** Places & programs (Piper) · **Never merged.**

## What changed

Two Edge Functions and a local helper, for the sandbox test on card a88 (plan: `docs/research/2026-10-14-docusign-spike-plan.md`):
`docusign-spike` (JWT on; consent, whoami, envelope E1/E100/E-ar, mint, status, purge, template-view), `docusign-spike-hook` (JWT off; /connect, /return), `scripts/docusign-spike/mint-server.mjs`, `docs/research/2026-10-14-docusign-spike-run.md`, and `packages/config/test/docusign-spike.test.ts` (22 tests).

## What was wrong, and what missed it

Nothing run yet: demo.docusign.net is blocked from this container; only the code and tests exist. `third-party-hosts.test.ts` fails on this branch (a new host and a new function), which is the intended guard against merging it.

## Decisions made

None.

## Verified

22 unit tests: the lock (503 not set up, 410 after the end date, 401 without or with the wrong key, fixed actions), the host guard (only account-d.docusign.com and demo.docusign.net, https, no redirect; a base address off the list is refused), PKCS#1 and PKCS#8 keys, the RS256 JWT verifies, consent link with redirect https://joinpam.org, envelopes (5, 100, Arabic), tooltips, Connect without documents or field data, the hook's HMAC and 503 until the key exists.

## Left undone

Everything that needs DocuSign: whoami, the envelopes, Iris's checks, Connect, purge, Q1, the findings.

## Needs a human

Mira: deploy both, set the two lock secrets, tell me when consent is done. Will: DOCUSIGN_CONNECT_KEY at the Connect step.
