# D-457 — A place's save and more buttons are white, with no outline or shadow

**Date:** 2026-10-10 · **Branch:** `claude/pam-design-place-bar-buttons`

Will, 10 October 2026, with a screenshot of a place's page: "This gray outline and shadow is
not meant to be on these buttons. Please fix." Then, after a first fix that made them grey like
the back arrow: "No these are meant to be white buttons. Not grey. Only back button is grey."

## What was decided

The bookmark (Save) and the ⋯ on a place's bar are `roundAction.plain`: a 48px round button in the
page's own colour, with **no outline and no shadow**. The back arrow beside them is the only grey
one (`SubPage`'s `back`, unchanged).

## What it replaces

D-411 (9 October) gave every bar's round action a grey outline and a soft shadow, on Will's own
words: "the ellipsis more actions button needs a grey outline and shadow. It's getting missed."
This reverses that **for a place's save and ⋯ only** (`PlaceBarActions`). `roundAction.button`
(white, grey edge, shadow) is unchanged and is still what the others use: the conversation header's
⋯ (`ThreadFrame`), What you sent (`WhatYouSentView`) and the SubPage story. Will's screenshot was the
place page, and he named these two buttons, so this changes these two.

## What it looks like, and what a later session should know

On a plain white page the button's disc is the page's own colour, so only the icon shows. That is
what white with no outline is; it is the same "missed" risk D-411 was written to fix, accepted here
on Will's word. Over a place's photo the white disc still shows. If the icons are missed again, the
options are a fill that is not the page's (but he said white) or putting the outline back.

## Open question for Will

The ⋯ on a conversation's header and on What you sent still has the outline and shadow, because
D-411 asked for it there and today's screenshot was the place page. If he wants every ⋯ the same,
it is one line in each place (`roundAction.button` to `roundAction.plain`).

## A first attempt that was wrong

My first fix made the two buttons the back arrow's soft grey, reading "not meant to be on these
buttons" as "make them match the arrow". Will's correction ("white, not grey") is the actual
instruction. Lesson: when a button's style is wrong, ask what it should look like if the screenshot
does not say.
