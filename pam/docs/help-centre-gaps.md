# Help centre gaps

Questions people type into Support's search that no post answers yet. Each is a
`null` entry in `apps/site/src/content/search-phrases.ts`; the site test fails if
one is missing from this table, so the two cannot drift. Sage and Wren draft the
post together; the words go to Will before anything ships (D-502 voice guide:
`docs/voice.md`).

When a post is written: give its slug to the phrase in `search-phrases.ts`, and
move the row here to "Done".

## Open

| Phrase | Who is asking, and what has just happened | What a post would need to say | Owner |
|---|---|---|---|

## Done

| Phrase | Post | Date |
|---|---|---|
