# D-505 — The website uses Will's marketing words; the app keeps its own; no translation while words are in Figma

**Date:** 2026-10-11 · **Branch:** `claude/voice-marketing-words` · **Decided by:** Will, on the Control Room
(01:28 and 01:30 UTC), relayed by Mira.

## Will's words

- "No need to say Program lead on marketing site, we call members: Residents or people looking for help,
  Program leads = Providers or social services, and Case Managers = Case Managers or Guides."
- "When I ask for help in Figma, you can go ahead and write over the text in component. It's
  collaborative, but I need someone to be responsible for the copy pass." / "Just the component, not all
  home page."
- "We don't need to translate it right away. Only when the website is merged, then handle languages after.
  It's too soon in the collaborative flow to start translating. We're just brainstorming inside Figma."

## What it changes

- `docs/voice.md` has a table of app words against website words, and a section "How we work on words".
  It replaces the guide's earlier suggestion (D-503) that the website say "members" and "program lead".
  The app's words do not change: member, program lead, case manager, "your guide".
- Support posts explain the app, so they keep the app's words.
- Sage writes into Will's Figma component when he asks, and only that component. The first pass was the
  Callout card (node 18:517), on 11 October.
- Website words are translated after the website change merges, not while they are in Figma. App strings
  are unchanged: still written in all seven languages when built (A25).

## What a later session might reverse

"Providers" on the website and "program lead" in the app are two names for one role. If people moving from
the site into the app get confused, one should give way. Will's call.
