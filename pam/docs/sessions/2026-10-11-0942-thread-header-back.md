# 2026-10-11 — thread header back

**Branch:** `claude/messages-thread-header-back` · **Lane:** Messages & notifications

## What changed

`SubPageHeader` gained `variant="bar"` and `isBarTitleShown` (@pam/ui, Dot's file, small). The conversation's header is that bar; `ThreadIntro` (photo, name, who they are, the visit card) is the first thing in `ThreadView`'s scroll region (`intro` prop) and scrolls away. The bar's name fades in when the intro's name goes under the bar. D-529.

## What was wrong, and what missed it

D-411 put the large page title on a conversation, which cost 2–3 lines of a phone and kept the visit card in the way. Will wanted the small bar for position and the info to scroll.

## Decisions made

D-529. Supersedes D-193, D-395/D-400 (header parts) and D-411's large title.

## Verified

`messages.spec` on three projects (222 passed): the D-411 position test (back = Legal's back, ⋯ at the right edge, outlined), one `h1` at 22px, no fade, the long program name wraps uncut, the bar's name is clear at the top and fades to 1 when the messages scroll, with no movement, and changes at once under reduced motion. Storybook builds; stories: SubPage › Conversation (now the bar), Member › A conversation with a program.

## Left undone

Nothing. The photo is new in the header: Mira approved it on the screenshots.

## Needs a human

Nothing.
