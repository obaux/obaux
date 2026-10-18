# Message Pam: support inside the app (18 October 2026)

Iris. The merge desk's job at 02:41, from Will at 02:39: anyone in the app (member, case manager,
program lead) can message Pam, which lands in the super admin's inbox, and the super admin can
message programs and members. Nico and Ava are planning the build; Dot, Sage and Lena work from this.

- **Sources:** Pam's code and docs at `main` `c67be570`, and public sources. I didn't sign in to
  anything or look at any member's data.
- **Source caveat:** the public sources were gathered by search. Neither Pam's fetch tool nor a
  second agent could open the pages from this machine (the hosts didn't resolve). So every outside
  claim below rests on a search summary and carries a **[check]** mark. Open the page before
  quoting its wording.
- **Vendor data:** marked **[vendor]**.

## In one paragraph

Today every way to reach a person at Pam ends in an email to Pam's hello address. You get there
through the help desk on the website, and the help desk deliberately shows answers first. That path
works signed out and needs an email account. A Message Pam thread would replace the email step for
people who are signed in, and only for them. It would not replace the help desk, the signed-out
paths, the text-message HELP reply or the safety rows.

The research points one way. People coming home have good reason to feel watched by apps, often
have shaky phones and little time online, and judge a service by whether a reply comes. So the first
version should:

- open only when the person writes first;
- say up front who reads it, when replies come, and that it is not an emergency service;
- never be the route for a crisis or for legal advice.

**Pam writing first to a member reverses a signed decision (D-262: "Never a member")** and the
transparency promise every member reads at onboarding. That part should wait for Will to sign it
and for members to be told.

## 1. How someone asks for help today, and what this would replace

| Way in | Where it starts | Where it ends | Works signed out? | Would Message Pam replace it? |
|---|---|---|---|---|
| **"Contact Pam"** (`help.contact.action`) | About 28 error and notice lines in the app: "Try again. If it keeps happening, contact Pam.", a paused or limited account, "no places found", the privacy Copy and Delete lines… | The app's Help screen ("Someone at Pam can help you. You do not need to know what to ask for."), then **Open the help desk**, which is the website. Signed out, it opens the help desk directly (A28). | Yes, by design. Sign-in errors and paused accounts show it to people who can't get in. | **Only its last step, for signed-in people.** The button can open the Help screen, which then offers "Write to Pam". Signed out, it must keep going to the help desk. |
| **The help desk** (joinpam.org/support) | The Help screen, the privacy pages, the Your safety row, and text messages | Posts in plain words, then **"Still stuck?"** at the end of a post or an empty search, never first (A28 §3) | Yes | **No.** It is where people find answers without waiting for anyone. Keep it first, inside the app too. |
| **"Still stuck?" form** (`help-request` function, in `docs/help-request-contract.md`) | The help desk | One email to Pam's inbox, with reply-to set to the person. It sends what they wrote, the page, the language and the role they ticked. It reads nothing from the database. **Built but switched off:** until it is on, the page shows the hello address instead. | Yes; it asks for an email (a text-back phone field comes once texts are on) | **For signed-in people, yes.** A thread in the app needs no email address, and the answer arrives where they already are. For everyone else, the form stays. |
| **Email to the hello address** | The help desk, the privacy page ("If something here worries you, write to us…"), the text-message HELP reply | Will's inbox | Yes | **No.** It is the fallback for everything else, and carriers need a support contact in the HELP reply. |
| **Your safety** (Help › Your safety) | The Help screen | **Call 911** (the only big button), **Call or text 988**, "A message feels unsafe" (report it in the chat), and **"Talk to someone now"**, which opens the help desk's Your safety post. That post says: "Pam is not an emergency service. Nobody at Pam watches messages as they come in." It then offers the write-in. | Yes | **Partly.** "Talk to someone now" could open Message Pam for a signed-in person, but only if the thread shows 911 and 988 first and says plainly that nobody watches it live. **911 and 988 stay first.** |
| **Text-message HELP reply** (Twilio, A28) | A person replying HELP to a Pam text | "Pam: Get help at joinpam.org/support or write to [the hello address]. Reply STOP to stop." | Yes | **No.** Carriers require it. The `sms-inbound` function today learns only STOP and START; it does not turn a reply into a message. |
| **Staff ↔ super admin messages** (D-262, migration 0072) | The super admin's Home, and New message for a case manager or program lead | An ordinary conversation between the super admin (as themselves) and that staff member | No (in the app) | **It already is "Message Pam" for staff**, but it's addressed to Will by name, not to "Pam". |
| **A staff request** (Join as staff) | The join screen | "We will text you" (the answer comes by text, D-481) | n/a | No |

**What would actually be new:**

1. A member can write to Pam inside the app. Today they can't; they have to leave for the website
   and use email.
2. The thread has a shared "Pam" name rather than Will's.
3. Pam can write first to a member. Today the rules forbid it.

## 2. What people coming home expect, where support chat goes wrong, and what Pam must say up front

### What the research says

- **Feeling watched is learned.**
  - People leaving prison describe devices inside as constant surveillance with rules that change
    without warning. [check] (University of Washington preprint, 2026, 17 interviews:
    https://arxiv.org/abs/2604.01370v1)
  - On parole, some states use phone apps that check voice and location for the officer. One person
    said it was "like being locked up again." [check] (The Guardian, March 2021, via
    https://www.pressreader.com/australia/the-guardian-australia/20210305/281904480914070; related:
    https://www.techdirt.com/2020/05/01/prisons-replace-ankle-bracelets-with-expensive-smartphone-app-that-doesnt-work/)
  - **So a message from "Pam" that arrives unasked can read like a check-in from supervision.**
- **Phones are fragile, and time online is short.**
  - People come home with large gaps in digital skills, even when family hands them a smartphone.
    [check] (University of Michigan, 23 interviews in Detroit: https://news.umich.edu/?p=50070)
  - Problems are worse in the first two years after release. [check]
    (https://tprc2024ab.sched.com/event/1ftlD/everything-is-technology-examining-technology-access-and-use-among-returning-citizens)
  - A Philadelphia group hands out prepaid smartphones with a three-month plan. [check]
    (https://billypenn.com/2020/05/29/this-philly-group-is-giving-people-free-smartphones-when-they-get-out-of-jail/)
  - Prepaid numbers change; in one study of older homeless adults, numbers changed about monthly.
    [check] (UCSF, via https://www.cbsnews.com/amp/sanfrancisco/news/new-study-shows-cell-phone-are-essential-lifeline-for-bay-area-homeless)
  - **Pam's account is tied to a phone number, so a thread can be lost with the number.**
- **People wait longer if they know someone got the message.**
  - Live chat sets an expectation of minutes ([vendor] [check]
    https://aircall.io/en-gb/blog/research/customer-service-wait-time-infographic/), but texting is
    judged more loosely: "the same day" was the most common answer in one survey ([vendor] [check]
    https://leadferno.com/blog/survey-response-times-for-text-messages-vs-live-chat-replies).
  - Several roundups report that people wait longer when they know their message was received.
    [vendor] [check] (https://www.thisandthat.chat/blog/customer-response-time-statistics/)
  - Support tools show the expected reply time and the hours, and say when the team is back.
    [vendor] [check] (Intercom:
    https://www.intercom.com/help/en/articles/732436-let-your-users-know-when-to-expect-a-response,
    https://www.intercom.com/help/en/articles/732390-set-your-office-hours)
  - **The independent research is thin. None of it is about this audience, and all of it is vendor
    data.**
- **Crisis words arrive in non-crisis inboxes.** Services that aren't crisis lines say so where the
  person writes, and route to 911 or 988:
  - BetterHelp: "not intended for crisis situations" ([check] https://www.betterhelp.com/crisis_resources/);
  - PA 211: not for emergencies, use 988 for distress ([check] https://www.pa211.org/?p=159);
  - Dartmouth's in-app messenger "is not monitored on a regular basis" ([check]
    https://path.dartmouth.edu/user_resources/materials/handouts);
  - the NHS contact form says what it can't help with, before the box ([check]
    https://www.nhs.uk/contact-us/nhs-website-contact-us).

  Ireland's HSE has a 2024 guide for public-facing staff answering suicidal contact by email or text
  ([check]
  https://hse.ie/eng/services/list/4/mental-health-services/connecting-for-life/publications/responding-to-a-person-in-suicidal-distress-2024.pdf).
  Pam's own Your safety post already says the key sentence: "Pam is not an emergency service. Nobody
  at Pam watches messages as they come in."
- **988 and police.**
  - Some people avoid 988 for fear of police.
  - The Lifeline says under 2% of contacts involve emergency services, more than half of those with
    the caller's agreement, and only when risk is imminent ([check]
    https://988lifeline.org/faq/about-us/faq-does-vibrant-use-police-intervention-for-callers-texters-and-chatters-to-the-988-lifeline/).
  - Critics say even that rate keeps people away ([check]
    https://www.kunc.org/2024-10-17/critics-call-for-less-police-involvement-when-responding-to-988-crisis-hotline-calls).
  - Pam can say true, calming facts about 988 if it wants. It shouldn't promise what 988 does.
- **Parole, probation and legal questions.**
  - The usual line is "legal information, not legal advice": advice is applying the law to one
    person's facts ([check]
    https://judicature.duke.edu/articles/legal-information-vs-legal-advice-a-25-year-retrospective/).
  - In Pennsylvania, practising law without a licence is a misdemeanour (42 Pa.C.S. § 2524) ([check]
    https://www.pabar.org/public/committees/unautpra/Opinions/Opinions.asp).
  - Legal-aid sites say that writing to them creates no lawyer relationship and isn't confidential
    ([check] https://idaholegalaid.org/node/1062/web-site-legal-disclaimer), and ask people not to
    send case details through a form ([check] https://wislawhelp.org/contact).
  - A nonprofit's records can be subpoenaed ([check]
    https://www.socialworker.com/feature-articles/practice/You've_Been_Served:_How_to_Handle_the_Stress_of_Subpoenas/).
    I found nothing specific to a reentry app or to Pennsylvania; **this needs a lawyer's eye before
    Pam words it.**
  - Free routes in Philadelphia that Pam could point to: Philadelphia Lawyers for Social Equity
    (record clearing, pardons, online intake) ([check] https://plsephilly.org/); Community Legal
    Services' record clearing ([check] https://howtojustice.org/?p=166194); and the City's Office of
    Reentry Partnerships ([check]
    https://www.phila.gov/departments/office-of-reentry-partnerships/our-initiatives/).
- **When the organisation writes first.**
  - Code for America's texting pilot hit a wall where the state had told people it never texts. Its
    advice: send a "message about messaging" first, through channels people already trust, then
    make every message say who it is from, why, and what to do next ([check]
    https://codeforamerica.org/news/shoulder-to-shoulder-connecticut/,
    https://codeforamerica.org/resources/texting-playbook/).
  - Stopping must be easy, and consent must never be a condition of service ([check]
    https://www.nclc.org/wp-content/uploads/2023/08/Ex-Parte-on-Revocation.pdf).
  - **Nothing I found measures how people with justice involvement react to it. That is a gap.**

### Where it goes wrong, for this audience

| What happens | Why it hurts here | What helps |
|---|---|---|
| **A reply comes late, or never.** One reader (Will) is away, ill, or swamped. | For someone who has been let down by services before, silence confirms it. Unlike email, a thread in the app looks like chat, and people expect chat replies in minutes. | Say the hours and the likely wait before they write. Send an automatic "We got it" at once. Show "Read by Pam" when it's opened. Have someone cover when the reader is away. Don't promise a time until two to four weeks of real replies show what can be kept (A28 already says so). |
| **A crisis message at night** ("I can't do this anymore") | Nobody reads it until morning. That is the worst possible silence. | 911 and 988 at the top of the thread, every time, not only on first use. The automatic reply repeats them. Nothing in the thread suggests someone is watching. **Don't build automatic crisis-word detection in v1:** it misses and misfires, and a wrong "we noticed" is worse than none. |
| **A parole, probation or legal question** ("Can I go to this program if my PO says…") | Pam staff aren't lawyers. A confident answer could cost someone their freedom. And the person may not know a message can end up in court. | A fixed line: Pam can't advise on parole, probation or legal matters, with a short list of free legal help. A line on what Pam keeps and who could ask for it, worded by a lawyer. Staff use a set reply for these. |
| **"Pam" writes first** | It can read as being watched, especially if it mentions anything they did in the app. | v1: Pam only replies. Later, if Will signs it: Pam writes first only about the person's own account or a request they made, says why, and the person can mute it. |
| **The reply never reaches them** | Replies sit in the app. Texts are off until `texts_live`, and a changed phone number loses the account. | The bell now. Once texts are on, a text that says only "Pam answered your message. Open Pam to read it.", with no content. Keep email and the help desk for people who can't get in. |
| **The wrong door** | A member writes to Pam about a program's hours, or a staff member writes about a member. | The thread says what Pam can help with (getting into the app, finding a place, a visit, reaching your guide; the TalkingToPam post already lists these) and when to ask your guide or the program. Pam can hand over: "I've asked [program] to reply to you." |
| **Language** | A member writes in Russian; one reader reads English. | Say plainly that messages are translated by machine, as Privacy already does for conversations, and that a reply may be in English with a translation. Lena words it. |

### What Pam must say up front (drafts for Sage and Lena; Will signs)

A short card at the top of the thread. It is always visible, and stays on screen when the thread
scrolls:

> **Write to Pam**
> A person on the Pam team reads every message. We answer Monday to Friday, usually within
> [one working day, once measured]. Nobody watches messages as they come in.
>
> **In danger? Call 911.** · **In crisis? Call or text 988. Someone answers day and night.**
>
> Pam can help with the app, finding a place, a visit, or reaching your guide. We can't give
> advice about parole, probation or a legal case, but we can point you to free legal help.
>
> Who sees this: the Pam team, and nobody else. Your guide and your programs don't see it.
> [What Pam keeps, and for how long →]

The hard parts, each one Will's to sign:

1. **"Who sees this."** It has to match `transparency.ts` word for word. Today the contract says
   admins can't read message bodies; a Message Pam thread makes the Pam team a participant, the way
   a program is. That fits the contract's rule, but members must be told before it ships (CLAUDE.md:
   "tell members before it takes effect").
2. **The reply time.** Leave the number out until it has been kept for a few weeks. "Usually within
   one working day" is the kind of line support tools show, and it is honest only once measured.
3. **"What Pam keeps"** and the legal line need a lawyer's reading before they're shown.

## 3. What a program lead and a case manager would use it for

From Pam's own help posts, flows and notices: `KeepingYourListing`, `StaffRequests`,
`CaseManagerAssignments`, `SendingAnInvite`, the staff join flow and the admin notices.

| Who | What they'd write about | What they'd expect |
|---|---|---|
| **Program lead** | Their listing is wrong, or a change is waiting in review ("A few changes needed"). A member they can't book for. Policies to sign. Adding a second program. An invite that expired. Someone in their messages who worries them. | A working-hours answer, the same day if possible. Pam says when a listing change is done. A clear line between "tell Pam about the app" and "tell Pam about a person". |
| **Case manager** | An assignment that's wrong or missing. A member's account paused or limited ("Your guide can turn it back on"). An invite that didn't arrive. A member who can't sign in. A member they're worried about. | The same, plus help on behalf of a member who can't write themselves, which needs care (see risk 6). |
| **Both** | Coordination Will already asked for (D-262: "to make sure they coordinate how to use the app"). | It exists today as a conversation with Will by name. Message Pam would give it a shared name and one inbox. |

**Research gap:** I found nothing on how fast case managers expect a platform's support to answer.
General staff-tool research says adoption fails without training and time ([check]
https://nij.ojp.gov/library/publications/recommendations-correctional-agencies-use-web-and-application-based-tools),
and that wrong listings are common enough to need an easy report ([check]
https://oig.hhs.gov/reports/all/2025/samhsas-findtreatmentgov-contained-some-inaccurate-information-on-substance-use-and-mental-health-treatment-facilities).
Pam already has Report a place for wrong listings, so Message Pam needn't replace it.

## 4. Risks, and the smallest safe first version

### Risks, worst first

1. **Pam writing first to members reverses D-262 and the transparency promise.** Migration 0072 lets
   the super admin message staff, "**Never a member** — a member's messages stay between them, their
   case manager and their programs (§4.1, `transparency.ts` unchanged)". Members are shown that list
   at onboarding, and it can't be skipped. Changing it needs Will's sign-off, a new line on the
   transparency screen, and members told before it ships.
2. **A crisis at night, read in the morning.** Mitigation is words, not code: 911 and 988 always
   visible, an automatic reply, and no promise of watching.
3. **Silence.** One reader means holidays and sick days leave people unanswered. That is the
   fastest way to lose this audience. A second reader, or an away notice, is needed before launch,
   not after.
4. **Legal exposure.** Advice on parole or probation (unauthorised practice), and messages that can
   be subpoenaed. That means a set reply, referral routes, a retention period, and a lawyer's
   wording.
5. **Feeling watched.** The thread must never mention what the person did elsewhere in the app. A
   reply about one member must never quote another. Read receipts should go one way only: the person
   sees "Read by Pam"; Pam doesn't track them.
6. **Staff writing about members.** A case manager writing "I'm worried about Marcus" puts a member's
   situation in a channel the member can't see, which is the surveillance the contract forbids.
   v1 should steer staff to their own conversation with the member, and say in the staff thread that
   Pam can't act on a member without the member.
7. **Sensitive attachments.** Photos of IDs, court papers or parole conditions. v1 allows a
   screenshot of the screen, says "Don't send ID or legal papers", and has no documents.
8. **People who can't sign in can't use it.** A paused account, a lost phone or a sign-in failure
   are exactly when people need help. The help desk and email stay for them, and every "Contact
   Pam" shown signed out keeps going to the help desk.
9. **Abuse of the inbox.** Harassment of staff, spam. Use rate limits and the existing
   Report, and let Pam end a thread politely.
10. **Language.** Machine translation both ways. Say so, and let the reader see the original.

### The smallest safe first version

1. **Write to Pam, signed in only.** It sits on the Help screen under "Find an answer", as the
   "Still stuck?" step (answers first, as A28 decided). It opens one thread per person, addressed to
   **Pam**, not to a person's name.
2. **The person writes first, Pam replies.** No Pam-first messages to members in v1. Pam-first to
   staff already exists (D-262) and can move to the shared Pam name.
3. **The card above** is fixed at the top of the thread, and Will signs its words.
4. **An automatic first reply**, once per thread and outside hours. It says the message was received,
   when a person will read it, and repeats 911 and 988. Show "Read by Pam" on each message once it's
   opened.
5. **Text and screenshots only**, with no documents, and a line asking people not to send ID or
   legal papers.
6. **The super admin's inbox:** unanswered first, with how long each has waited. Set replies for
   "can't give legal advice" (with the free legal help list) and "please ask your guide". Measure the
   first-reply time for two to four weeks before showing any promise.
7. **Telling them a reply came:** the bell now. Once texts are on, a text with no content ("Pam
   answered your message. Open Pam to read it.").
8. **Privacy:**
   - a new line on the transparency screen and in "What others can see" (Will signs; members told
     first);
   - the Pam thread is included in Copy and removed by Delete;
   - a retention period is set and stated.
9. **Unchanged:** the help desk, "Still stuck?" for signed-out people, email, the text-message HELP
   reply, Your safety's 911 and 988 rows, Report a place, Report a message.

**Not in v1:** Pam writing first to members, broadcasts, automatic crisis-word detection, documents,
staff reporting on members through Pam, and any promised reply time.

## Decisions for Will

1. May Pam write first to a member at all, and about what? This changes D-262 and the transparency
   promise.
2. Who reads the inbox besides Will, and who covers when he's away?
3. The card's words: who sees it, hours, legal help, and the retention line (with a lawyer).
4. One thread per person (simple), or one per question (tidier for the team, more for the member to
   follow)?
5. The name the person sees: "Pam" (shared) or the reader's first name (warmer, but personal)?

## How sure

- **High:** the map of today's routes, from Pam's code and docs (A28, `help-request-contract.md`,
  migration 0072, `transparency.ts`, `HelpViews.tsx`, the website's Your safety and Talking to Pam
  posts).
- **Medium on the outside research.** Every source above came through search summaries I couldn't
  open from here, many reply-time figures are from vendors, and the research specific to this
  audience is thin. Before any outside wording is quoted, open it.
- **Gaps:**
  - how people with justice involvement react to an organisation writing first;
  - what reply time case managers expect;
  - whether a Pennsylvania court could reach messages to Pam.

Iris
