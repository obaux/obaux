# Help centre gaps

Questions people type into Support's search that no published post answers yet. Each is an
`answer: null` entry (or one whose post is still a draft) in `apps/site/src/content/search-phrases.ts`; the site test fails if
one is missing from this table, so the two cannot drift. Sage and Wren draft the
post together; the words go to Will before anything ships (the voice guide, D-503:
`docs/voice.md`).

When a post is written: give its slug to the phrase in `search-phrases.ts`, and
move the row here to "Done".

## Open

| Phrase | Who is asking | What a post would need to say | Owner |
|---|---|---|---|
| i got a new phone number | anyone | Changing your phone number: contact Pam, and what happens to your account and texts. | Sage, Wren |
| delete my account | anyone | Deleting your account, or getting a copy of what Pam keeps: contact Pam, we check it is you. | Sage, Wren |
| where can i find food | resident | Finding a place: Explore, the kinds of help (Learning, Earning, Family Support), the map, and saving a place. | Sage, Wren |
| i lost my phone | anyone | Same post as “i got a new phone number”. | Sage, Wren |
| change my number | anyone | Same post as “i got a new phone number”. | Sage, Wren |
| find a job | resident | Same post as “where can i find food”. | Sage, Wren |
| this place is closed | resident | Telling Pam a place is wrong: open the place, tap “Something is wrong here”, and what happens next. | Sage, Wren |
| my program is still in review | provider |  | Sage, Wren |
| change our address | provider |  | Sage, Wren |
| who is coming to my program | provider | Your calendar: who is coming, by day, and checking people in when they arrive. | Sage, Wren |
| approve a staff request | anyone |  | Sage, Wren |

## Parked

Not written on purpose. The phrase stays in `search-phrases.ts`, so the search still says "We do not have an article for that yet" and shows the way to a person.

| Phrase | Who is asking | Why it is parked | Revisit when |
|---|---|---|---|
| they said i missed it | A resident told they missed a visit they think they made. | Pam does not record attendance yet (`checkIns.ts` only keeps it in the browser), so a post would describe something that does not happen. Sage's FINDING to the merge desk, 11 October. | Attendance is recorded and a program can mark a visit missed. |

## Done

| Phrase | Post | Date |
|---|---|---|
| does the place know im coming | is-the-place-told | 2026-10-11 |
| why wasnt i told about a visit | is-the-place-told | 2026-10-11 |
| why is this happening | start-here | 2026-10-11 |
| something went wrong | start-here | 2026-10-11 |
| the page is blank | start-here | 2026-10-11 |
| it wont load | start-here | 2026-10-11 |
| how do i talk to a real person | talking-to-pam | 2026-10-11 |
| pam phone number | talking-to-pam | 2026-10-11 |
| change my language | your-language | 2026-10-11 |
| en español | your-language | 2026-10-11 |
| how do i add my program | cant-sign-in | 2026-10-11 |
| add my program | cant-sign-in | 2026-10-11 |
| cant sign in, i cant login, how do i join, become a case manager | cant-sign-in | 2026-10-11 |
| i feel unsafe, i am in danger, i am in crisis | your-safety | 2026-10-11 |
