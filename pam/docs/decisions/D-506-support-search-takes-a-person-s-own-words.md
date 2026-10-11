# D-506 — Support search takes a person's own words

**Date:** 2026-10-11 · **Branch:** `claude/compassionate-bohr-mzrchf`

**Decided by:** Will, via the merge desk (11 October 2026, 01:24 ET): "We want the help desk search to catch phrases like 'why is this happening?', outline use cases, and find keywords to help map them to the posts; if no posts exist and user hits an empty page, document this and push it to Wren and Sage for collaboration."

**Why.** Support's search needed every typed word to be in a post's title, summary or keywords, so a sentence about what happened ("why is this happening") found nothing.

**What.**
- `apps/site/src/lib/search.ts`: the query is cut into words, small words (why, is, this, my, the ...) are dropped, the rest lightly stemmed (texts = text, happening = happen). A post scores for every remaining word it contains: title 10, a keyword 5 (a whole keyword said in full, 8 more), summary 1. A known phrase scores up to 100 by how many words it shares with the query (shared ÷ all distinct words in both), so a phrase mapped to a post puts it first and its `also` posts follow at 60%. Ranked by score, any post that scores is a result. In the page, no server.
- `apps/site/src/content/search-phrases.ts` holds the use cases, 77 phrases written the way people type them: `{ phrase, who, answer, also?, gap? }` — `answer` the slug of the post that should come first (or `null`), `also` posts that may follow, `gap` what a missing post needs to say. Sage writes it; `SEARCH_GAPS` is the phrases with no published post (a draft counts as no post).
- A phrase with no published post is a gap: the page says "We do not have an article for that yet" and `docs/help-centre-gaps.md` lists them (a test fails if one is missing there). Sage and Wren draft those posts together; Will sees the words before they ship.
- An empty result is never a dead end (A26): it says plainly that nothing matched, keeps Browse by topic, and shows "Still stuck?" (the words of Pam's Help screen, Call Pam).
- `test/search.test.ts` runs every phrase through the real search: a phrase must find its `answer` first (in the top three when it names `also` posts); a gap phrase must be recognised as a gap and be in the gaps doc. All 77 pass.

**Not part of this.** An "Ask Pam" AI answer box over the posts: put to Will as an option, waits for his go.

**What a later session might reverse.** The weights; the stop-word list; the stemmer (deliberately light: no library). A fuzzy match for typing mistakes is not done.
