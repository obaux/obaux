# 2026-10-13 — design google logo prep

**Branch:** `claude/pam-design-google-logo` · **Lane:** Design systems

## What changed
`PoweredByGoogle.tsx` now draws a picture (light and dark by colour scheme), 18px high with Google's clear space, alt "Google Maps", `translate="no"`, and falls back to the words if the file fails to load. A `public/google/README.md` for the files and a story `Components/Places/PoweredByGoogle`.

## What was wrong, and what missed it
The first brief said alt "Powered by Google"; the policy says "Google Maps". Mira corrected it.

## Decisions made
D-557.

## Verified
tsc passes. The files are not here yet, so the words show; no logo has been looked at.

## Left undone
The logo files (Will, card a81). Then: save them as downloaded, name them in the README, add them to the imagery list and a test that they are served locally, and look at 320/390 in light and dark.

## Needs a human
Will downloads Google's logo files and the page's size sentence.
