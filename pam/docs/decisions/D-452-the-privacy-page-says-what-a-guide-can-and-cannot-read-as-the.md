# D-452 — The privacy page says what a guide can and cannot read, as the transparency screen does

**Date:** 2026-10-10 · **Branch:** `claude/lena-english-language-tags`

Will, 10 October 2026, relayed by the merge desk: every screen that promises something Pam does not
do is built to keep the promise or rewritten. The privacy page and the transparency screen read as a
contradiction. This is the rewrite for the one that is wording.

**The contradiction.** The privacy page's "Who can see it" section said a guide "cannot read your
messages or see your photos or documents" and that "they see one of your messages only if someone
reports it as not safe". The transparency screen, which the same section is meant to restate, says a
guide can see "everything you say or send to them, if they message you directly" and cannot see "what
you say or send to someone else". Both are true of the system; the page was the broader, and so the
wrong, of the two: a reader of the page would think a guide could never read what they themselves
wrote to that guide. (The merge desk's note named `privacy.s.texts.p2`; that line is about texts. The
mismatch is `privacy.s.who-can-see.p2` and `.p3`.)

**What was decided.** The page now says what the screen says, in so many words:
- p2: a guide cannot read "your messages to other people", or see the photos or documents you send to
  other people; nor what you share with your buddies; nor people not on their list.
- p3: a guide does see everything you say or send to them when they message you directly. Of your
  messages to anyone else they see one only if someone reports it as not safe, and then that message
  and its photo or document, nothing else from the chat.

The contract itself (`TRANSPARENCY_SCREEN`) is unchanged, so no member is told something new about what
a guide can see: the page now says what the contract already said. Per `CLAUDE.md`, widening the
contract would have meant telling members first; this does not widen it.

**Tests.** `legal.test.ts` pinned the old sentences (`cannot read your messages`, `see your photos or
documents`). It now pins the exact wording, forbids a bare "cannot read your messages", and checks the
page names what you send a guide directly, as the screen does. The page's reading grade stays within
the limit the same file sets.

**The six other languages** (Spanish, Brazilian Portuguese, Simplified and Traditional Chinese, Russian,
Arabic) were written by hand to the same meaning, in each language's existing words for a guide and for
buddies, and recorded with `copy:ack`. They are promises, so each still needs a native reader
(`docs/copy-changes.md`); they stand as every language stands today, approved by Will to learn from
(D-430).

**What a later session might reverse.** If Will wants the page shorter, the two paragraphs could say only
"A guide sees what you send to them, and nothing you send to anyone else, unless someone reports it" and
leave the list to the transparency screen; the tests would then need to follow.

**`language.intro` is unchanged**, as Will said: "Pam's words, buttons and texts will be in the language
you choose" becomes true for texts in all seven languages once the carrier filing is done.
