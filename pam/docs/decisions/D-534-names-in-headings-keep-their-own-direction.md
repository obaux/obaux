# D-534 — Names in headings keep their own direction

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-data-headings`

## Decided

Mira, from Nico's D-533: a heading whose text is data (a place's, program's or person's name) can show a Latin name's punctuation on the wrong side, or cut it at the wrong end, on an Arabic page. Putting `dir="auto"` on every `Heading` would also turn Pam's own headings ("Your trips") around, so the design system marks the data ones instead:

- `@pam/ui/DataHeading`: the Astryx `Heading`, prop for prop, with `dir="auto"`.
- `SubPageHeader` takes `isTitleData`: the title, in the bar and large, reads in its own direction. Off by default; the bar title is no longer always `auto` (Nico's conversation passes it on).
- Used on a place or program's page title, the name on a profile card (`ProfileSummary`) and the name on a `PersonRow` (staff views: member and provider names).

- A policy's title on the member's policy page (`MemberPoliciesView`): the program uploads it with the file, so it is the program's own words and counts as data. The list of policies ("Policies") is Pam's and keeps the page's direction. (Iris, b16: "Confidentiality and disclosure" computed rtl in Arabic.)

Pam's own headings keep the page's direction. A name that sits inside a sentence (the "About {name}" lines) is not a heading of data; those keep the bidi isolates from D-435.

## Cost

A Latin name on an Arabic page aligns to the left of its line (its own start), an Arabic name on an English page to the right. That is how the conversation title behaves already (D-533) and how names read in the apps people use.

## Test

`apps/web/e2e/data-headings-pages.spec.ts` (Iris's two live cases, in Arabic with the network stubbed): the place page title "Example Library Tech Lab" and the policy page title "Confidentiality and disclosure" are `ltr`; the policies list title is `rtl`.

`apps/web/e2e/data-headings.spec.ts` on the gallery page: in Arabic a Latin name is `ltr`, an Arabic name `rtl` and "Your trips" `rtl`; in English the same names and a `ltr` Pam heading.

## What a later session might reverse

Add `DataHeading` wherever a new page puts a name in a heading; the test only covers the component, so a new page must opt in.
