# Languages & Legal · the retire sweep (18 October 2026, ~07:25 UTC)

Lena, on `claude/lena-retire-sweep`, off main `2bcb2e39`. Nobody asked for it today: it was the standing item "after Ava removes the tick, and the saved-places lines" on the list since the a94 batch, and a search of main showed both are gone from the code.

## What changed

- **Four keys are gone from `en.json` and the six bundles, and from the ledger:** `join.waitingDone.yes` ("We saved your city and that you want to hear when Pam opens there. Pam cannot text you about it yet, …") and `person.savedPlaces.empty`, `.title` and `.link` ("Places they saved", "Nothing saved yet.", "Programs saved by {name}").
- **How I know nothing uses them:** `git grep` over `apps`, `packages` (not the locale files), the docs and the stories finds none of the four names; no code builds a `person.` key, and the only dynamic `join.` key that reaches the waiting screen is `join.${phase}.title` (so `join.waitingDone.title`, "Thank you", **stays**: it is used). The waiting screen reads `join.waitingDone.heading` and `.no`.
- One of them was a promise-shaped line about texts ("Pam cannot text you about it yet"); an unused line that makes a promise is the kind that gets wired back in by accident.

## Verified

`copy:status`: all languages in step after `copy:ack`. `@pam/config` suite: 60 files, 1,403 tests pass (1 skipped, as before). No code changed, so nothing else to build.

## Left undone

Nothing on this sweep. If Ava or Piper bring any of the four back, the English and the six translations are in this commit's history.

## Needs a human

Nothing.
