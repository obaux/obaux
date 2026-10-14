# D-569 — Text boxes show no ring of ours, however focus gets there

**Date:** 2026-10-14 · **Branch:** `claude/pam-design-text-box-no-ring`

**Decided by:** Will, via the merge desk (14 October 2026, 04:08 UTC, card a83): "please undo any rules about text box being selected, I don't want that. All I want is for the keyboard to be active when a text box presents itself, for the user's convenience in typing."

**Supersedes** the text-box line of D-523 (Will, 11 October: a text box focused by script keeps a visible highlight) and the frame rings Pam drew for text fields (D-195's composer line stays as it was, below; D-212's search-pill ring and the field-frame ring are removed).

**The rule.** A text box (input, textarea, contenteditable) shows no outline ring of ours in any mode, whether a script, a tap or Tab put focus there. The blinking cursor shows where you are. A screen that opens with a text box ready (search on arrival, the sign-in fields) still focuses it, so the keyboard is up: only the highlight is gone. In `globals.css` the two rules that drew a 3px ring on the frame round a field (`:has(> input:focus-visible)` and the search pill's `.astryx-input-group[data-size='lg']:has(input:focus-visible)`) are gone, with their cancelling rules. Astryx's own field styling is left as it is. Buttons, links, tick boxes and selects keep the brand ring when Tab lands on them; D-523's no-ring on dialog content, sheets and section headings stays.

**Tests.** `focus-text-boxes.spec.ts` (search focused on arrival: focused, no ring on field or frame; Tab onto it, none), `consent.spec.ts` (sign-in phone: no outline on the field or its frame), `theme.spec.ts` (the brand-ring contrast is now read on a button Tab lands on, not on the phone field). Pictures, before and after at 390 in light and dark, a search box focused on arrival and a sign-in field: `docs/design/review/2026-10-14-text-box-no-ring/`.

**The chat composer (Will, via the merge desk, 14 October, 04:27).** "Any rules about text box being selected" includes the composer: it is a text box, and every text box behaves the same. D-195 said Astryx draws a ring on the composer's frame for keyboard focus. Checked on this build (Astryx 0.6.0), Tabbing into the composer by keyboard: no outline on the frame or anything in it, no box-shadow ring, and the composer's pixels are identical to the ones with focus elsewhere. So there is no ring to turn off, and no `xstyle` override was added (it would be dead code). `messages.spec.ts` used to assert a ring on Tab, but its Tab landed on another control and the check was skipped; it now Tabs until the editor is focused and asserts no outline anywhere on the composer, so an Astryx upgrade that adds one fails it.

**Kept on purpose: the sign-in code boxes' 2px accent edge (D-251).** It shows which of the six boxes the next digit goes into, a job a caret cannot do across six boxes, and it is not an outline ring. It stays; Will can still say otherwise when he sees it.

**A trade, said plainly.** WCAG 2.4.7 (focus visible) asks that a keyboard user can see where focus is. In a text box the caret does that, which is what Will relies on; with no ring and a blinking caret that is hard to see (low vision, a bright screen), the position of focus is less obvious. Will's call, recorded as his. The website does the same (Wren).

## Search bars are the exception (Will, 14 October, 05:55, a86)

Will asked for the dark pill outline round a search bar back while it is active. D-574 does that in the shared search field; D-569 stands for every other text box. The sentence above ("a text box draws no ring of ours") now reads: every text box except a search bar.
