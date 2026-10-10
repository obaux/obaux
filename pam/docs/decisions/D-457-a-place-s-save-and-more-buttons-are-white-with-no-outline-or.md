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

## The test that encoded the old look

`e2e/place.spec.ts` ("the week drawer opens with nothing chosen, and the bar's ⋯ is white with no outline
or shadow") asserted D-411's 1px border and shadow on the place bar's ⋯, and failed in CI on the first
push (three projects). I had not run the browser suite for this change, calling it "nothing structural";
a spec was checking the style itself, which is what a style change changes. It now asserts D-457: a 0px
border, no shadow, the page's own colour (read from the `--color-background-body` token, so it holds in
dark mode), and a target of at least 48px. 30 of 30 place tests pass in the three projects. Lesson: grep
`e2e/` for the thing being restyled before saying no test is affected.

## Settled question

**Answered by the merge desk, 10 October:** leave them. The ⋯ on a conversation's header and on What you
sent keeps the outline and shadow, because D-411 asked for it there on Will's own words and his screenshot
was the place page only. If he wants every ⋯ the same it is one line in each place
(`roundAction.button` to `roundAction.plain`).

## A first attempt that was wrong

My first fix made the two buttons the back arrow's soft grey, reading "not meant to be on these
buttons" as "make them match the arrow". Will's correction ("white, not grey") is the actual
instruction. Lesson: when a button's style is wrong, ask what it should look like if the screenshot
does not say.
