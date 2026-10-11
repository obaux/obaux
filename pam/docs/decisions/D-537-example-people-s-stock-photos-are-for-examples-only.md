# D-537 — example people's stock photos are for examples only

**Date:** 2026-10-11 · **Branch:** `claude/messages-example-photos-gated`

Found by Lena while building the third-party host guard, verified by Mira on main f62ba03: `staffPhotoFor(firstName, programName)` returned an example person's stock photo (images.unsplash.com) whenever a name and program matched an example staff member, and its callers in Messages were not behind the example gate. A real case manager named Teresa with no program would show a real member a stranger's face, and Unsplash would receive that member's IP address. It broke Will's a55 rule: a real account sees only its real things.

## Decision

The lookup by name happens only where `examplesOn()` is true (D-511): the real thread (`thread/page.tsx`, both the composer's avatar and the intro's photo) and the Messages list's real rows (`MessagesScreen`). `DemoThread` and the list's example rows are examples-only already (reached only when examples are on). The place page's `programStaffFor(place.id)` matches by an example place's id, which a real place never has, so it needs no change.

## Tests

`messages.spec`: a real account whose conversation partner is "Teresa" (no program) gets no image from the photo host on the list or the thread, and the browser makes no request to it; a demo account still sees the example photo. The first fails without the fix (checked).

## What a later session might reverse

Nothing; the cleaner long-term shape is for `staffPhotoFor` to take the gate itself, so a caller cannot forget it. Left as it is to keep the fix to the two call sites Mira named; the config package cannot import the app's gate.
