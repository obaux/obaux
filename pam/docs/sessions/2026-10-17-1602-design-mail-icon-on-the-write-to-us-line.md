# 2026-10-17 — design mail icon on the write-to-us line

**Branch:** `claude/pam-design-mail-icon` · **Lane:** design system (Dot)

## What changed

New `MailIcon` (an envelope, `data-icon="mail"`) in `packages/ui/src/icons.tsx`, exported and in the Icons story. It replaces the handset on the short version's "write to us at hello@joinpam.org" row (`TransparencyReading`) and on the Legal pages' Contact section (`LegalPage`, same email line). The handset stays where something dials: 988 on Help, 911 under Emergencies, a place's number. No words change.

## What was wrong, and what missed it

## Decisions made

## Verified

New `e2e/mail-icon.spec.ts` fails on main and passes on narrow-320, dark-320 and iphone-se-viewport. tsc, @pam/ui and @pam/config tests pass. Before/after picture in `docs/design/review/2026-10-17-mail-icon/`.

## Left undone

## Needs a human
