# Languages & Legal · `help.writeToPam` retired (18 October 2026, ~19:30 UTC)

Lena, on `claude/lena-retire-write-to-pam`, off main `bc96890b` (b73). Asked by Mira at 18:54: retire `help.writeToPam` and drop its pin in `pam-words.test.ts` now that Contact Pam opens the conversation (W2).

## What changed

- **`help.writeToPam` is gone from `en.json`, the six bundles and the ledger** (7 bundle lines, 6 ledger lines), and its pin (`'help.writeToPam': 'Write to Pam'`) is out of `packages/config/test/pam-words.test.ts`. `messages.pam.placeholder` ("Write to Pam", the composer's name) is a different key and stays.
- **One code line, so this is not retire-only.** The key still had one reference on main: `useWriteToPamItem` in `HelpDeskRow.tsx` built a menu item labelled `t('help.writeToPam')`. Nothing shows that label: its two callers (`useHelpDeskItem`, and "talk to someone" on Your safety) read only `.href`, so Help has no "Write to Pam" row any more. Retiring the key without touching it would have been a type error and a raw key name in a field nobody reads. The label is now `t('help.desk.label')` (the help desk row's own words, in the same file), with a comment.

## Checked

`copy:status` in step; `@pam/config` suite 65 files, 1,451 pass (1 skipped, 1 todo). Typecheck and the web unit tests: see the READY. The label is read nowhere, so no e2e changes; the Help specs check where Contact Pam and "talk to someone" go (`/messages/pam/`), which is the `href`, untouched.

## Left undone

Nothing on this key.
