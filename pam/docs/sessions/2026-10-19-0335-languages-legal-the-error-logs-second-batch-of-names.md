# 2026-10-19 — languages & legal: the error log's second batch of names, in six languages

**Branch:** `claude/lena-more-action-names` (on Piper's `claude/places-programs-d616-more` @ `0ed1a046`, off main 6773c9c4) · **Lane:** Languages & legal (Lena) · from Sage (02:08, 02:15, 02:50) and Piper (03:33)

## What changed
- Ten names (`appError.action.*`) in six languages, replacing Piper's English stand-ins. Before each replacement the script checked that the stand-in line was exactly the signed English, so nothing else could be touched. Ledger acknowledged.
- `request.withdraw` follows the revision at `26c7fe10` ("Cancelling changes sent to Pam", from the lead's "Cancel these changes"), not the first "program request" wording. `service.remove` (`2ed71bff`) follows "Remove this service" and `policies.remove`.
- The translations were parked in the scratchpad since 02:11 (`d616d_en.py`, `d616d_tr.py`) until Piper's list had the actions.

## Checks
`app-error-action-names.test.ts` passes with the ten actions on `APP_ERROR_ACTIONS`; `copy:status`: all languages in step; config suite 70 files, 1,501 tests.

## Open
Nothing of mine. Sage still has to sign `service.remove` in Piper's note (she signed it at `2ed71bff`).
