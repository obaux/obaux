# 2026-10-13 — signing English under A29: b22, W6, the help form, street search

**Branch:** `claude/sage-signs` · **Lane:** Voice & UX copy

## What changed
Ledger rows only, in `docs/signed-english.md`. No app code. Each line was checked
against the code or the live project before it was signed:
- **b22 visits** (`checkin.*`): window, the 2-hour PLANNED_TOO_LATE rule, 3 "I went" in 7 days, 150 m for "I'm here". Messages copy follows D-541, which sets who can start a chat.
- **Help form** (site `HelpRequest.tsx`): call-out, the "How do you use Pam?" question, the line under the button. The email row is Nico's (D-559).
- **Street search**: `places.areaHint.street`, `places.areaLabel.street`; the "Google Maps" mark left in English. Privacy p7 signed by Will (a81).
- **W6 Join** (Ava, D-563): `join.staff.body`, `admin.caseload.empty.body`, `invite.expired.sent.body`. Will's `signin.invited.*` recorded.
- **Recorded as Will's**: a72, a77, a80 "Pause card"/"Play card", a81, and a82 "Did someone invite you via code?"/"Click here", which reverted my version (ce18f5ff).
- `nav.back.reported` "Back to Reported places" (Piper, D-565), signed as written.

## What was wrong, and what missed it
- `person.connect.done.body` promised a recommendation was sent; recommending is a placeholder. Fixed by hiding the Connect row on real accounts.
- I first assumed invite emails were off; they are on (Mira). The ledger row was corrected.
- My "Powered by Google" was not the required mark; it is now "Google Maps".
- Two ledger timestamps were wrong and were fixed.

## Verified
Each claim was traced to a migration, an Edge Function or a component; the notes column of each row cites it.

## Left undone
- a65 24/7 line: held for Will until launch.
- Any further W6 strings from Ava.

## Needs a human
Will: a65 24/7 line.
