# Help centre gaps

Questions people type into Support's search that no post answers yet. Each is a
`null` entry in `apps/site/src/content/search-phrases.ts`; the site test fails if
one is missing from this table, so the two cannot drift. Sage and Wren draft the
post together; the words go to Will before anything ships (the voice guide, D-503:
`docs/voice.md`).

When a post is written: give its slug to the phrase in `search-phrases.ts`, and
move the row here to "Done".

## Open

| Phrase | Who is asking, and what has just happened | What a post would need to say | Owner |
|---|---|---|---|
| why is this happening | Anyone on a screen that is not doing what they expected, who does not know what to ask. | Start here when something isn't working: the common reasons (a code, a link, a paused account, no connection), each with what to do, then how to call Pam. | Sage + Wren |
| something went wrong | Anyone who just saw an error. | Same post as "why is this happening". | Sage + Wren |
| the page is blank | Anyone looking at an empty screen. | Same post as "why is this happening". | Sage + Wren |
| it wont load | Anyone on a slow or dropped connection. | Same post as "why is this happening". | Sage + Wren |
| how do i talk to a real person | Anyone who wants a human, now. | Talking to someone at Pam: the number, Monday to Friday 9am to 5pm, the call is free, and what to do when we are closed. | Sage + Wren |
| pam phone number | Anyone looking for the number to call. | Same post as "how do i talk to a real person". | Sage + Wren |
| change my language | Anyone reading Pam in a language that is not theirs. | Using Pam in your language: the seven languages, how to switch, and that texts follow your choice. | Sage + Wren |
| i got a new phone number | Anyone who changed numbers and worries about signing in. | Changing your phone number: call Pam, and what happens to your account and your texts. | Sage + Wren |
| delete my account | Anyone who wants to leave Pam. | Deleting your account, or getting a copy of what Pam keeps: call Pam, and we check it is really you first. | Sage + Wren |
| where can i find food | A resident looking for help near them for the first time. | Finding a place: Explore, the kinds of help (Learning, Earning, Family Support), the map, and saving a place. | Sage + Wren |
| find a job | A resident looking for work. | Same post as "where can i find food". | Sage + Wren |
| this place is closed | A resident who went to a place and found it closed or moved. | Telling Pam a place is wrong: open the place, tap "Something is wrong here", and what happens next. | Sage + Wren |
| does the place know im coming | A resident who planned a visit and wonders if the place expects them. | Is the place told about my visit? Only a place with a program lead on Pam sees it; a place from a public list is not told (D-498). | Sage + Wren |
| they said i missed it | A resident told they missed a visit they think they made. | A visit marked missed: who marks it, who sees it, and what to do if it is wrong. | Sage + Wren |
| how do i add my program | A provider who just joined and wants their program on Pam. | Adding your program: the steps, and that Pam checks it before residents see it. (The listing post is still a draft.) | Sage + Wren |
| my program is still in review | A provider waiting for Pam to approve their program. | Same post as "how do i add my program": how long a review takes and where to see it. | Sage + Wren |
| who is coming to my program | A provider who wants to see the week's visits. | Your calendar: who is coming, by day, and checking people in when they arrive. | Sage + Wren |
| why wasnt i told about a visit | A provider who learned of a visit late, or not at all. | From the program's side: visits show on your calendar only for a program you added (D-498). | Sage + Wren |
| approve a staff request | A super admin with a request waiting. | Staff requests: where they wait and what Approve and Deny do. (The post is still a draft.) | Sage + Wren |

## Done

| Phrase | Post | Date |
|---|---|---|
