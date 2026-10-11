# D-498 — a place has a program lead on Pam when a provider account belongs to its organisation

**Date:** 2026-10-11 · **Branch:** `claude/places-programs-lead-added-vs-gathered`

## Decision

Places get into Pam two ways: **gathered** from public lists (the city's providers, a library's own page), and **added** by a program lead on Pam. Only the second has anybody on Pam to be told about a visit — and today nothing tells even them (`book_trip` and `book_trip_at_service` only queue the member's own day-before reminder). Will, 10 October 2026 (relayed by Mira): "we need a way to distinguish between programs added by a program lead versus programs already in the database… the program leads homepage only makes sense if they add their own program, but if I have public library links and the user books a visit we need to let them know that this is for their organizational purposes only and we don't notify the library for programs that are not built by program leads."

**The rule.** A place *has a program lead on Pam* when its listing has an organisation (`services.org_id`) that has an **active account holding the provider role** (`profiles.org_id` + `profile_roles`). Not `services.source` alone: `manual` also covers places Pam staff typed in by hand with no lead, and a lead can claim a listing that was imported. Anything else is *gathered from public information*. It is callable as `service_has_lead(id)` and `places_with_leads(ids[])` (migration `20261011002026`, expand only, signed-in only, a yes/no and nothing about who). A paused lead does not count: nobody is there to be told.

**What the app does with it.**
- A member planning or keeping a visit at a place with no lead is told, in one sentence, that it is only to help them plan and the place is not told; the words that said or implied the place knew (a note "to tell them", "booked", "so they know you're coming", "See you there") are replaced for such places. Places with a lead keep today's wording. Until the database has answered, or if it cannot, the answer is "no lead": the plainer wording says less than it could, never more than is true. An example place has a lead when the example people name it (as "Message the lead" already did).
- A **real** program lead with no program of their own is not shown the example program (it was shown to any lead who signed in on a new tab, because the example is the default when the database has none). Home leads with Add your program, with no calendar card (the People row stays: inviting someone works from day one, D-384); Policies and the service editor ask them to add their program first. A super admin previewing the role, and Storybook (which marks `window` when it answers Supabase itself), keep the example.
- A booking a case manager makes for a member is still an example (nothing is saved with the program), and already says so; it needed no change.

## Wording

The English sentences (the plan-only line, the note label, saved not booked, the moved line, the drop-in line, the case-manager line) were reviewed by Will on 11 October 2026 ("approve", on the Control Room card). The six other languages are drafts for Lena.

The two lines a program lead sees before adding a program (`program.tools.needsProgram.title`, "Add your program first"; `program.tools.needsProgram.body`, "This part is for your own program. Add it, and it will be here.") were approved by Will on 11 October 2026 at 00:57 UTC ("Sure", on the Control Room card).

## What a later session might reverse

Whether "has a lead" should also require the lead to have signed in (not only to be active). Whether a lead's own page should say which of their places are theirs. When bookings are really sent to leads, the sentence becomes true for places that have one and this rule is what says which.
