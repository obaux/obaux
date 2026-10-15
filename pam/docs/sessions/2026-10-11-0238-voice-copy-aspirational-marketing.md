# 2026-10-11 — Voice & UX copy: marketing may reach; the first help-post drafts

**Branch:** `claude/voice-aspirational-marketing` · **Lane:** Voice & UX copy (Sage)

## What changed

- `docs/voice.md`: a new rule from Will (02:25, Control Room, quoted). Marketing pages may say what we are working
  towards. Help posts, the app, texts and emails, and anything legal or a promise say only what's true today.
  The old "Personality is never a substitute for a fact" paragraph is replaced by it, and the checklist line changed
  to match.
- Since the last log, drafts for the missing help posts, one branch each, words for Will:
  `start-here` (e799dda4), `talking-to-pam` (0969ca70), `your-language` (1e7b9245): approved by Will 02:18, Wren
  builds them. `is-the-place-told` (7835c6a3): on Will's next card.
- Figma, at Will's direct ask: the three feature rows under the Callout card on Home (24:905 and the two below),
  written in place. The Callout card's case-manager line is now "Guide your people from plan to progress."

## What was wrong, and what missed it

- The language draft promised "your next text comes in the language you picked". Member texts are off
  (`texts_live`), and the sign-in code comes from Supabase Auth's template. Mira caught it; the line is out until
  texts go live. The app's own `language.intro` says the same and is a FINDING for Lena.
- The place-told draft said every place page shows a phone number. Wren checked: only when one is on file. The
  draft now falls back to "Check hours on Google".
- Pam does not record attendance (check-ins stay in the lead's browser; nothing sets 'missed'). The transparency
  screen and the privacy page say otherwise. FINDING for Lena; the "missed visit" help post is parked.

## Verified

| Check | Result |
|---|---|
| `docs/voice.md` only | docs, no build impact |

## Left undone

- The everyday-words list for Wren's search (Mira, 02:36): next, shape to agree with Wren.
- 17 more gap posts.
