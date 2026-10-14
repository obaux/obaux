# D-570 — The website's text boxes draw no ring, and Write to us fits its words

**Date:** 2026-10-14 · **Branch:** `claude/compassionate-bohr-mzrchf`

**Decided by Will, 14 October 2026 (04:08 ET, a83):** "the still stuck card still touches footer on mobile. Also please undo any rules about text box being selected, I don't want that. All I want is for the keyboard to be active when a text box presents itself, for the user's convenience in typing. Additionally the desktop 'Still stuck?' card: there's something off about that button, 'Write to us,' being so long, stretching all the way. Just make it fit the text. No reason for it to be so wide but on mobile it's okay."

**What.**
1. **No ring on text boxes.** In `globals.css`, `input` (text, email, search, tel, url, number, password), `textarea` and the combobox input are out of the focus-ring list, in every mode. The cursor shows where you are. Buttons, links, tick boxes, radio buttons, selects, `summary`, tabs and `[tabindex]` targets keep their ring when someone Tabs to them. This replaces D-523's rule for text boxes on the site (the ring on programmatic focus). No new `!important`.
2. **The keyboard comes up as the form opens.** iOS raises the keyboard only for focus that happens inside the tap. The dialog's message box does not exist until after the tap, so the "Write to us" tap first focuses a hidden one-pixel text input, then the message box takes focus once the form is there; the keyboard stays up. When the form closes, focus goes back to "Write to us". Focus-to-error (W1) and focus-to-thank-you (P2) are unchanged and draw no ring.
3. **"Write to us" is as wide as its words from 900px** (the width where the form becomes a card, not 600px: the site's card breakpoint is 900), left-aligned under the line; the width of the phone below 900px.
4. **The gap under Still stuck? is padding, not a margin.** The 60px (phone) and 120px (desktop) sit as `padding-block-end` on the container that ends the page (the post's article, the Support page's column), from the same consts. A margin at the end of a nested flex or grid chain is what an engine can drop or collapse; padding cannot be.

**What was found about the gap.** On the live build, in Chromium, the card's bottom was 60px above the footer at 390 on /support/, every post and /support/your-safety/; the margin was applied. WebKit is not installed here, so iOS Safari could not be run. Will's phone may have had a page from before b32, or an engine behaved differently; the change to padding removes the one difference an engine could make.

**What a later session might reverse.** Add a ring back to text boxes if Will wants one; take the proxy input out if iOS stops needing it.
