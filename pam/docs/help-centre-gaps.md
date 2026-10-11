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
| i got a new phone number | anyone | Changing your phone number: call Pam, and what happens to your account and texts. | Sage, Wren |
| does the place know im coming | resident | Is the place told about my visit? Only a place with a program lead on Pam sees it; a place from a public list is not told (D-498). | Sage, Wren |
| why is this happening | anyone | When something isn’t working, start here: the common reasons (a code, a link, a paused account, no connection), each with what to do, then how to call Pam. | Sage, Wren |
| something went wrong | anyone | Same post as “why is this happening”. | Sage, Wren |
| the page is blank | anyone | Same post as “why is this happening”. | Sage, Wren |
| it wont load | anyone | Same post as “why is this happening”. | Sage, Wren |
| how do i talk to a real person | anyone | Talking to someone at Pam: the number, Monday to Friday 9am to 5pm, the call is free, and what to do when we are closed. | Sage, Wren |
| pam phone number | anyone | Same post as “how do i talk to a real person”. | Sage, Wren |
| change my language | anyone | Using Pam in your language: the seven languages, how to switch, and that texts follow your choice. | Sage, Wren |
| en español | anyone | Same post as “change my language”. | Sage, Wren |
| delete my account | anyone | Deleting your account, or getting a copy of what Pam keeps: call Pam, we check it is you. | Sage, Wren |
| where can i find food | resident | Finding a place: Explore, the kinds of help (Learning, Earning, Family Support), the map, and saving a place. | Sage, Wren |
| find a job | resident | Same post as “where can i find food”. | Sage, Wren |
| this place is closed | resident | Telling Pam a place is wrong: open the place, tap “Something is wrong here”, and what happens next. | Sage, Wren |
| how do i add my program | provider |  | Sage, Wren |
| my program is still in review | provider |  | Sage, Wren |
| change our address | provider |  | Sage, Wren |
| who is coming to my program | provider | Your calendar: who is coming, by day, and checking people in when they arrive. | Sage, Wren |
| why wasnt i told about a visit | provider | Same post as “does the place know im coming”, from the program’s side: visits show on your calendar only for a program you added. | Sage, Wren |
| approve a staff request | anyone |  | Sage, Wren |

## Parked

Not written on purpose. The phrase stays in `search-phrases.ts`, so the search still says "We do not have an article for that yet" and shows the way to a person.

| Phrase | Who is asking | Why it is parked | Revisit when |
|---|---|---|---|
| they said i missed it | A resident told they missed a visit they think they made. | Pam does not record attendance yet (`checkIns.ts` only keeps it in the browser), so a post would describe something that does not happen. Sage's FINDING to the merge desk, 11 October. | Attendance is recorded and a program can mark a visit missed. |

## Done

| Phrase | Post | Date |
|---|---|---|
