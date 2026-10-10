# D-493 — A secondary button has a light edge, drawn as a ring, and chips opt out

**Date:** 2026-10-10 · **Branch:** `claude/pam-design-secondary-border`

Will, 10 October, on the public website: a secondary button "was hard to see on gray, adjust the ds."
Wren gave the site's `SecondaryButton` a local 1px border; Mira asked for the design-system version.

**Decided.** `@pam/ui/Button` draws a secondary button with a 1px ring in `--color-border`. Not a
`border`: a border takes 2px from the button's box and every secondary button in the app would change
size; the ring is an inset `box-shadow`, so only the edge changes.

**Where it does not apply.**
- Icon-only buttons (the wrapper already leaves them untouched).
- Anything that draws its own edge, with `hasEdge={false}`: `ChoiceChips` (the unselected chip has its own
  border; the selected one is the filled green). So the language chips keep exactly what they drew, and
  the option-tag reference needed no update: it still passes, which is the proof that nothing changed.
- `CategoryChips` and `SearchPill`, which use Astryx's button directly and keep their own edge and lift.
- Primary and the quieter variants: not pale fills on gray.
Everything else secondary gains the ring: `BigButton` secondary, HelpBar, Notice's button, the copy button,
the "Not now" kind, the places and trip-day toggles when off (the selected one is primary).

**Checked.** A story on gray, white, and "before" for comparison (Components / Actions / Secondary
button). `audit:fit` over the component stories and about 74 stories of screens with secondary buttons
(trips, messages, policies, connect, places, review) in en, es, pt-BR, zh-CN, zh-HK, ru, ar and pseudo:
nothing new anywhere (every finding was already in `fit-known.json`). The ring cannot move text, so none was
expected.

**A later session might reverse:** the opt-outs, if the chips ever lose their own border; the site can now
drop `apps/site/src/components/SecondaryButton.tsx`'s own border (Mira schedules that with Wren).
