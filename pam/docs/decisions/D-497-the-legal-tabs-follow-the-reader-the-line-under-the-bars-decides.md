# D-497 — The legal tabs follow the reader: the line under the bars decides, a tapped tab is held

**Date:** 2026-10-10 · **Branch:** `claude/pam-design-legal-tabs`

Will, 10 October, on the Privacy page on his phone: "The tap doesn't glitch, but the anchors that highlight chips
get confused when two sections are in view on the same screen: if I select 'Talking to a person' then select 'what you
can do', the what you can do won't always select. Also let's ensure the tabs highlight when the section is at top of
page, and make sure the chips smoothly scroll so the selected section is always visible."

**What was wrong.** The reading position was "the last heading above the middle of the screen", and, when the end of the
text was on screen, forced to the last section. "Talk to a person" is the last, short section: tapping "What you can
do" (the one above it) put that heading at the top, but the end of the text was still on screen, so the last tab won.
The same rule let the page's own glide light neighbours on the way.

**Decided.**
1. The highlighted tab is the last section whose heading has reached the line under the two bars (136px, the line a
   tap lands on, with 8px for the glide's last frames). With two sections in view, the one at the top wins. Only the very
   bottom of the page overrides it: the last section's heading can never reach the line, so at the bottom it is "here".
   The old "end of the text is on screen" rule is gone.
2. A tap highlights its tab at once and holds it (`lock`) until the reader scrolls for themselves (wheel, touch, a key,
   a press anywhere but on the tabs; Back to top lets go too). So the glide cannot light a neighbour, and a short section
   the page cannot scroll far enough to bring to the top stays the one tapped. A second tap in the middle of the first
   glide does not let go.
3. The row of tabs follows the highlight: when the highlighted tab is not wholly in view it is brought to the row's
   start edge, which is one of the row's own snap points (aimed anywhere else, scroll-snap pulled the smooth scroll on to
   the next tab and left a wide one half hidden: found by the test). Measured from rectangles, so right to left too. It moves
   the row, never the page.
4. After a tap, focus moves to the section's heading (`tabIndex -1`, `preventScroll`), as the old hash link moved the
   reading position (Mira's question after D-492).

**Checked.** `e2e/legal-tabs.spec.ts` at 320 and 390 wide, in all three projects: the top one wins with two in view; Will's
exact case (Talk to a person, then What you can do); a tapped tab stays when the page cannot scroll far enough; nothing
else lights during a glide; the reader's scroll takes over; the highlighted tab is wholly on screen, reading on and
tapping; focus is on the heading and it sits under the bars. On the old LegalPage 10 of 14 fail (the other 4 are guards for
behaviour the old code already had). `legal.spec`'s "says where you are" now scrolls to the bottom instead of
scrolling the last heading into view, which was the old rule.

**A later session might reverse:** the held tap, if it ever feels stuck; it lets go on any scroll the reader makes.
