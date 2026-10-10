# 2026-10-10 — Places & programs: the services a program offers, on screens (D-313, D-462)

**Branch:** `claude/places-programs-services-list` (from `main` at `3ddac79`) · **Lane:** Places & programs (Piper)
**Job:** Mira, relaying the plan Will approved: after the pending changes, "their list of services" — the Program tab, the service editor and member place pages — on the `program_services` table that is live (D-462). Plus her small fix: pin the saved-trip story's time.

## What changed

- **`useServices` reads and writes the database for a real program.** Same interface (`services`, `forPlace`, `save`, `remove`); a program that is a listing in the catalogue (its id is a uuid) has its services read once from `program_services` and written there, an example program (a `dummy-place-…` id) keeps them in the tab. So the Program tab's Services card, the service editor, a member's place page (service cards) and the "Which service?" step in booking show a real program's services with no change of their own. `save` and `remove` are async and resolve false on failure; the editor says "We could not save that" and keeps what was typed.
- **Pure half** in `lib/programServices.ts` (row → the shape every screen reads, and what a save writes), with tests.
- **The Program tab and the service editor know their program.** `ProgramView` takes `programId` (the lead's own; the example's by default); `ServiceEditView` takes a new service's program from the lead's own program, and does not offer the *example* policies for a real program (its own policies are the next step, D-313).
- **The saved-trip story's time is pinned on the hour** (`onTheHour` in the mock), like the example trips, so its accepted fit entry matches every run (Mira's note: Dot's run saw "12:04").
- Stories: "Program — services" (a lead adds a service; the Program tab lists them; a member reads a program's services); the mock answers `program_services` (read, add, change, remove) and a real place for `service_detail`.

## What was wrong, and what missed it

- **The mock had no real programs.** The lead's program in the pretend database had the id `own-program`, not a uuid, so every service path would have taken the *example* branch and a story would have passed while testing nothing. The program now has a uuid like a real one; the browser check (add a service, see it on the tab) is what shows the real path.
- **Example policies leak onto real programs.** A member planning a trip to a real place is shown "Sign 4 policies for …" from the example policy set (`usePolicies` is example data for every place). That is how it was before this job and is D-313's second step; reported, not fixed here.
- **The fit audit's pseudo-language** flagged new stories the seven real languages did not (a trip card's one-line place name, a service's one-line description, the drawer fade): recorded in `fit-known.json` with reasons after looking at them at 320px.

## Decisions made

None new: this builds D-313 and D-462.

## Verified

- web tests (4 new, `programServices.test.ts`), tsc clean, `copy:status` in step (no copy changed), Storybook builds.
- In a browser (Chromium, 390px): the Program tab lists a real program's two services; the editor on a real program shows no example policies; adding "Interview practice" saves and it is on the tab beside the others; a member's place page shows the program's services as cards ("Pick a service", Plan a trip waits for one); no unanswered mock calls.
- Language fit at 320px in seven languages and the pseudo-language on the services and saved-trip stories: nothing unaccepted.
- **Not run:** anything against the live project; the real `program_services` RLS from the app (the database tests cover the rules).

## Left undone

- **A booking pointing at one service** (`appointments.program_service_id`, `book_trip` taking it): changing `book_trip`'s signature is a contract step and its own migration. Until then a trip to a real program records the program, not the service, and the reminder says the program's address.
- **Policies per service** for a real program: the next table.
- **Example policies shown for real places** (above).
- **Reordering services** (`sort_order` is kept in the order added).

## Needs a human

Nothing.
