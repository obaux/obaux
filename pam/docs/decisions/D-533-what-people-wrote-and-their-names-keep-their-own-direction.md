# D-533 — what people wrote, and their names, keep their own direction

**Date:** 2026-10-11 · **Branch:** `claude/messages-thread-direction`

Iris tested b15 (report `docs/research/2026-10-11-b15-website-thread-codes.md`, T1 and T2): in an Arabic conversation an English message showed its full stop and question mark on the wrong side, and the small bar cut the start of a long Latin name ("…illanueva de la Cruz") where English shows "Maria Guadalupe H…". Both are words that are data, not Pam's, drawn inside a right-to-left page without a direction of their own (the same class as P5 in her Member flow report).

## Decision

`dir="auto"` on every place a person's words or name are drawn in a conversation:

- the message text in a bubble (`ThreadView`; `TranslatedBody`'s original already had it);
- the name and who-they-are line in the thread's intro, and the name in the pinned bar — `SubPageHeader`'s bar title, both variants, in @pam/ui (Dot's file, one attribute);
- the Messages list: the name, and the last thing said when it is what the row shows (staff). Who they are (a member's row) is Pam's own words and keeps the page's direction.

With a direction of its own, a Latin name in an Arabic page runs left to right, so what does not fit is cut at its end with the ellipsis, and an Arabic name is cut at its own end. The box still sits at the page's start (beside back), because only the text's direction changes, not the box's.

Not done on purpose: the large `Heading` of every other page (a place's or a program's name in an Arabic page) is unchanged. It is the same class of problem and may deserve the same attribute; that is a design-system change for Dot, not a conversation fix.

## Tests

`messages.spec`: in an Arabic account (`preferred_language: 'ar'`, the account's language wins over the device's) an English message computes `ltr` and an Arabic one `rtl`; the list's last-message line is `ltr`; a long Latin name's bar copy is `ltr`, ellipsised, truncated, and the h1 `ltr`; an Arabic name's bar and h1 are `rtl`. Without the fix the first two fail (checked by building without it).
