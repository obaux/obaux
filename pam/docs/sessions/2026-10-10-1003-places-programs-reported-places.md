# 2026-10-10 — places programs reported places

**Branch:** `claude/places-programs-reported-places` · **Lane:** Places & programs (Piper)

## What changed

A page of its own, `/places/reported/`, for the reported places that used to hide behind a chip on `/places/`. Reached from a Reported places row on the profile (admin, super admin) and from the `service_flagged` bell row (`?from=notifications`, so Back says Notifications). It reuses `ReportedPlaces`, `useFlaggedPlaces` and `resolve_service_flag()`; no database change. States: loading, signed out, no profile, suspended, error, not an admin, empty, list. Previews and real reviewers with nothing reported see the example flags.

`ReportedPlaces` now draws Keep it / Take it off the list only when `canResolve` is true. Before, example data drew them for anyone, which showed a case manager buttons they cannot use. Same change applies to `/places/`.

## What was wrong, and what missed it

The case-manager story showed decision buttons. The browser check caught it; no test covered who sees the buttons.

## Decisions made

None new.

## Verified

tsc clean; config 986 and web 67 tests pass; Storybook builds; in the browser the super admin story decides a card away, the case manager story shows no buttons; language-fit audit 0 new in seven languages, 3 pseudo clamps of a place description (the card clamps on purpose), accepted with a reason.

## Left undone

Figma flow map not republished from this session (flows.mjs is updated). The old `/places/` Reported chip is untouched.

## Needs a human

Nothing.
