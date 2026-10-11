# 2026-10-11 — lead-added vs gathered programs

**Branch:** `claude/places-programs-lead-added-vs-gathered` · **Lane:** Places & programs (Piper)

## What changed

Will's ask via Mira (00:18 UTC): tell members the truth about places no program lead runs, and stop a lead with no program seeing a program's Home. (1) The rule, D-498: a place has a lead on Pam when its organisation has an active provider account; not `services.source` alone. Migration `20261011002026` adds `service_has_lead(id)` and `places_with_leads(ids[])` (expand only, signed-in only). (2) Member side: `usePlaceHasLead` (database for a real place, "no lead" until answered or on error; the example people for an example place) drives six words: a line on the place page and the Check-your-trip step and the confirmation ("This is only to help you plan. Pam does not tell {place} you are coming."), the note field ("A note for yourself"), the confirmation title ("Your trip is saved"), the moved line, and the drop-in card's body. Places with a lead keep today's wording. (3) Lead side: a real lead with no program is no longer given the example program (`useProgramSetup`; a super admin's preview and Storybook keep it); Home shows Add your program with no people row or calendar card; Policies and the service editor ask them to add their program first (`NeedsOwnProgram`). (4) Stories: place with and without a lead, plan a trip at one with none; Home for a lead without a program is the existing Getting started story.

## What was wrong, and what missed it

The example program was the default whenever the database had no program for a lead, so a real lead who signed in on a fresh tab was shown example visits and a live "program". Nothing distinguished a real lead from the prototype's pretend one; Storybook's mock now is that marker.

## Decisions made

D-498.

## Verified

Whole database suite (new test 52: active lead yes; gathered no; manual with no org no; paused lead no; org with nobody no; bulk; over 200 refused; signed out refused). Config 1067, web 94, tsc. e2e places-without-a-lead (6) and the full suite.

## Left undone

Wording is Will's to sign (QUESTION sent to Mira); the six other languages are my drafts for Lena. The note a member types is kept only for them; when bookings are really sent to leads this rule says which places can be told. Case-manager bookings are still examples and say so.

## Needs a human

Mira: apply `20261011002026`. Will: sign the English wording. Lena: drafts in six languages. Screens: member place page, plan a trip (Check step and confirmation), a lead's Home, Policies and the service editor for a lead with no program (a "Add your program first" page).
