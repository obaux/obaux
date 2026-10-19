# Screens don't explain: the audit (D-608)

**Sage (Voice & UX copy), 18 October 2026**, for Will's 15:19 note ("they explain too many things in the app that
should just be explained inside privacy or legal pages"), as the merge desk asked (Mira, 15:22). Read against `en.json`
on `main` (1,726 strings). Text alerts is done separately (ledger row "Text alerts, D-608", 9fcfd26f).

**What was looked at:** every intro, lead, note, hint, body and subtitle string, and every string that says "coming
soon", "not yet", "never", "does not", "nobody", "only…" or "can/cannot see". The same rule applied to each:

- **Cut** — the line explains, sells or repeats what the screen already shows. Nothing replaces it.
- **Shorten** — the screen needs something here (a choice, an error, a step mid-task), but less of it. New words are given.
- **Move** — a promise about what Pam does or never does. It goes to Privacy or Terms. "Covered" means a live Privacy
  line already says it, so the screen line can go now. "Lena" means it needs a new legal line and Will's signature first.
  Until he signs, the screen line stays.
- **Badge** — "not on yet" becomes a **Coming soon** badge.
- **Keep** — errors, empty states that say how to fill the list, consent lines carriers expect, and a step someone
  would be stuck without.
- **Will's** — a line Will himself signed at the moment of choice (a91, a94, a98, a101, the transparency screen). The
  rule would cut or move it, but it's his call, so these go on one card.

Not in scope: Message Pam (a101, signed), Privacy, Terms, the transparency screen's own lines (`join.privacy.*`,
`transparency.*`, which are the promise itself), notices (`notice.*`), errors (`*.failed.*`) and the website.

Owner lanes are the merge desk's to assign. The column says where the screen lives.

---

## Member

| Screen | Key | Today | Call | New words / why |
|---|---|---|---|---|
| Profile | `profile.promo.reminders.body` | Coming soon: texts about your visits and the places you saved. | **Badge** | Card is its title, **Get text reminders**, plus a **Coming soon** badge. |
| Text reminders | `reminders.intro` | Pam can text you the reminders and notes listed below. It is your choice, and you can change it whenever you want. | **Cut** — carrier check | The list says what is sent and the switch is the choice. The campaign registration quotes this screen, so **Lena checks** it before it goes (before-launch, A28 item 2). |
| Text reminders | `reminders.what` | What we would send | **Shorten** | **Kinds of texts** (same label as Text alerts). |
| Text reminders | `reminders.what.1`–`.3` | A reminder before each visit, with the address. · A note if a place you saved closes or moves. · A note when someone wants to connect with you. | **Keep** .1 and .2; **cut .3 now** | .1 and .2 are what a person opts into, and carriers expect them at the switch. **`.3` ("A note when someone wants to connect with you.") is cut from the join step:** nothing queues a connection text (`connection_request` has a template and no caller), /reminders/ doesn't show it, and the registration names two (Lena, 15:50). It comes back when the text is built and the registration names it. |
| Text reminders | `reminders.today.member` | Pam does not send any of these yet. They are coming. | **Badge** | **Coming soon**, beside the list label. `promises-of-texts.test.ts` (lines 48, 50) pins today's sentence and changes in the same commit. |
| Text reminders | `reminders.how` | Reply STOP any time and they stop for good. Reply HELP to reach a person. Text and data rates may apply. | **Shorten** | **Pam sends one text each time something on this list happens. Reply STOP to stop, or HELP for help. Text and data rates may apply.** Signed 15:45, the same shape as `alerts.how` (Lena, 15:40: no "only"). It's in two places, the /reminders/ screen and the join flow, and the registration's consent paragraph follows whatever this screen says. |
| Text reminders | `reminders.saved` | Saved. You can change this whenever you want. | **Shorten** | **Saved.** |
| Text reminders | `reminders.stopped.body` | You replied STOP, so Pam does not text you. Nothing in the app can turn texts back on. | **Keep** | It explains why the switch is dead. Without it, people would be stuck. |
| Your points | `points.intro` | Points come from what you do out there… The person who invited you, or a staff member responsible for guiding you, can see them. Programs and other members cannot. | **Cut**, covered | Who sees points is in `who-can-see.p1` (and on the transparency screen). How points are earned shows on the board itself. |
| Connections | `connections.intro` | The people on your side. Message them any time. | **Cut** | The list shows it. |
| Language | `language.intro` | Pam's words, buttons and texts will be in the language you choose. | **Cut** | The title and the choices say it. |
| Calendar | `calendar.intro` | Add your Pam visits to the calendar you already use. If a visit moves or is cancelled, your calendar changes too. | **Will's** (a98) | The rule would cut it. Will signed plan C with it, so he decides. |
| Calendar | `calendar.warn`, `calendar.secret`, `calendar.details.hint`, `calendar.new.body`, `calendar.off.body` | (a98 lines) | **Will's** (a98) | Covered by `sharing.p6` and `what-we-keep.p12`, so they could go. `calendar.new.body` and `calendar.off.body` are confirmations of what a tap does, so I'd keep those two. The rest are Will's call. |
| Place | `place.lead.sees`, `place.noLead` | (a91) | **Will's** (a91, open) | a91 is still on Will's card. Suggest he decides the cut there too: `sharing.p2` covers what a program sees. |
| Place | `place.visit.cancel.body` | Any reminder for it is cancelled too. You can plan another time whenever you like. | **Cut** | A confirmation that explains. The visit leaving Trips says it. |
| Place | `place.dropin.body`, `.self` | Pick a day in Plan a trip so they know you're coming. | **Keep** | The step for a drop-in place: without it there's no visible next move. |
| Place | `place.policies.hint` | Read before your visit · {signed} of {total} signed | **Keep** | Status someone uses to choose. |
| Place | `memberPolicies.intro` | {place} asks everyone to sign these before a visit. Read them now, and sign when you are ready. | **Shorten** | **Sign before your visit.** (same as `place.policies.toSign.body`) |
| Place | `place.quick.message.body`, `place.quick.directions.body` | Ask a question before you go · Open in Google Maps | **Keep** | Second lines that help choose between two rows. |
| Place | `friend.body` | Going is easier with someone. Send this link so they can come too. | **Shorten** | **Send this link so they can come too.** |
| Report a place | `flag.intro` | Tell us what is wrong and we will check it. Nobody at the place is told who said so. | **Cut**, covered | `what-we-keep.p15` ("Nobody at the place is told who…"). e2e `flag.spec.ts` line 82 expects this sentence; change it in the same commit. The reasons list asks the question. |
| Report a place | `flag.done.body` | Somebody at Pam looks at every one of these. | **Cut** | Title "Thanks" says enough. A28 §3's "a person reads" stays on the site. |
| Trips | `trips.new.done.body` | It is on your map. | **Keep** | Says where it went: what comes next. |
| Trips | `trips.moved.note` | Taking you home in a few seconds. | **Keep** | Tells someone the screen is about to move. |
| Messages | `messages.report.intro`, `messages.report.thread.intro` | Pick what is wrong. Pam and your guide see this one message… Nothing else from the chat. | **Shorten** — Lena | **Pick what is wrong.** But `who-can-see.p3` speaks only of the guide, and no live Privacy line says the Pam team sees a reported message (Lena, 15:40). The rest stays on screen until Lena has a line and Will signs it. |
| Messages | `messages.report.done.body` | Pam and your guide can now see this one message… Nothing else from the chat. | **Cut** — Lena | Title "Thank you. Pam will look at it." is enough, once Lena's Privacy line for the Pam team exists (see the row above). |
| Messages | `messages.program.note` | This program sees your first name and what you write. | **Cut**, covered | `sharing.p2` and the transparency cards. Nico put it there on purpose (D-541, "said where a member writes"), so Will may want to see it go: it's on his card. |
| Messages | `messages.block.body` | Neither of you will be able to send messages… You can unblock them any time from this menu. | **Shorten** | **Neither of you can send messages here. You can unblock them later.** A confirm dialog before a hard-to-undo act needs its consequence. |
| Messages | `messages.block.done.body` | Neither of you can send messages here now. You can unblock any time from the ⋯ menu. | **Cut** | The changed composer shows it. |
| Messages | `messages.unblock.body`, `.done.body` | You will both be able to send messages here again. | **Cut** | The title "Unblock?" says it. |
| Messages | `messages.empty.body.member` | Once your case manager or your program messages you, it will show up here. | **Cut** | With Pam's conversation there from day one (a100), Messages is never empty for a member. |
| Help | `help.intro` | Someone at Pam can help you. You do not need to know what to ask for. | **Keep** | Help is the one screen where warmth is the job (voice.md §4 Help). Will can cut it. |
| Help | `help.desk.body` | Our help desk answers what people ask most, in plain words. Search it in your own words. | **Shorten** | **Search in your own words.** |
| Help | `help.stuck.body` | Write to us from the help desk. A person at Pam reads every message. | **Shorten** | Under a100 the row is **Write to Pam** with no hint, so this line goes with it. |
| Help | `help.safety.*`, `help.place.body` | Call 911 first. · Someone answers day and night. · steps | **Keep** | Safety and how-to steps. |
| Join | `join.details.city.note` | Pam is only in these cities for now. | **Cut** | The list shows it, and a city that isn't on it leads to the waiting screen. |
| Join | `join.code.hint` | 8 letters and numbers. Leave it blank if nobody gave you one. | **Keep** | Format help mid-task. |
| Join | `join.done.body` | Welcome, {name}. Your first points are on the board. | **Keep** | A welcome. |
| Sign in | `signin.code.hint` | Sent to {phone}. It works for 10 minutes. | **Keep** | Mid-task, someone would be stuck without it. |
| Use as | `useAs.intro` | Your account has two sides. Pick the one you want to use now. You can switch back any time. | **Shorten** | **Pick one. You can switch any time.** |
| Use as | `useAs.member.body`, `useAs.provider.body` | Your visits, saved places and points · Who's coming in… | **Keep** | Second lines that help choose. |
| Account | `account.signout.body` | You can sign back in with your phone number any time. | **Cut** | Nobody needs it to decide. |
| Example data | `example.people.note`, `notify.example.note`, `home.calendar.preview.note` | Example people, so you can see how this looks. | **Shorten** | **Example** as a badge. A note on made-up data is needed, but one word does it. |

## Case manager

| Screen | Key | Today | Call | New words / why |
|---|---|---|---|---|
| Profile | `profile.promo.alerts.body.adminList` | Coming soon: texts about messages and trips. | **Badge** | **Get text alerts** + **Coming soon**. |
| Text reminders (staff) | `reminders.introStaff` | Pam can text you when something needs you. It is your choice… | **Cut** — carrier check | As `reminders.intro`. |
| Text reminders (staff) | `reminders.today.staff` | Pam does not send any of these yet. They are coming. | **Badge** | **Coming soon**. |
| Text reminders (staff) | `reminders.what.messages/.visits/.trips` | A text when… | **Keep** | What they opt into. |
| Home | `admin.seeing.title` | What you can see | **Keep** | A link to the transparency screen, not an explanation. |
| Caseload | `admin.caseload.empty.body` | When someone joins with an invite from you, they show up here. To invite someone, tap Invite someone below. | **Shorten** | **Invite someone, and they show up here when they join.** |
| Person | `person.connect.intro` | Find a program to recommend to {name}. | **Cut** | The title "Recommend a program" says it. |
| Person | `person.connect.confirm.body`, `.done.body` | {name} will see it on their Home and can choose to say yes. | **Shorten** | Confirm: **{name} sees it on Home.** Done: **Sent to {name}.** |
| Invite | `invite.intro` | Each invite is a link for one person. Send it by text. | **Cut** | The steps say it. |
| Invite | `invite.who.note` | Only this number can use the link. If they sign in to Pam with it, Pam finds the invite even without the link. | **Shorten** | **Only this number can use the link.** The second sentence explains the system. |
| Invite | `invite.link.body` | Send it by text. It opens Pam's sign in, ready for them. Works until {date}. One person, once. | **Shorten** | **Works until {date}, for one person.** |
| Invite | `invite.member.body` etc. | People looking for resources · Someone who runs a program · Someone who helps people find programs | **Keep** | Help choose the kind. |
| Reported messages | `reports.intro` | A message shows here only because someone said it was not safe. That is the only way a message reaches Pam. | **Cut**, now | Untrue once Message Pam is on: the Pam team reads the conversation with Pam (a101 L1), so "the only way a message reaches Pam" contradicts Will's signed line (Lena, 15:45). The empty state says how a message gets here. |
| Reported places | `places.reported.keep.hint`, `.remove.hint`, `.remove.confirm.body` | The place goes back on the list for members. · Members won't find it in Pam anymore. | **Keep** | They say what each choice does. Choosing between them is the job. |
| Messages | `messages.empty.body.admin` | When someone you invited writes to you, or you message them, it shows up here. | **Cut** | Pam's conversation means the list is never empty. |
| Glossary | `guide.body` | Your guide is the person who invited you, or a staff member responsible for guiding you. | **Keep** | A definition someone opens on purpose (TermInfo). |

## Program lead

| Screen | Key | Today | Call | New words / why |
|---|---|---|---|---|
| Profile | `profile.promo.alerts.body.providerList` | Coming soon: texts about bookings, changes and messages. | **Badge** | **Get text alerts** + **Coming soon**. |
| Home setup | `home.setup.program.body` | Say what you offer and where. Pam checks it before members see it. | **Shorten** | **Say what you offer and where.** |
| Home setup | `home.setup.photo.body` | A friendly face helps people feel welcome before they walk in. | **Cut** | Sells. The row title "Add your photo" says what to do. |
| Home setup | `home.setup.calendar.body` | When members plan a trip to your program, you will see them here and check them in. | **Cut** | The preview shows it. |
| Home setup | `home.setup.review.body.*` | Pam checks it by hand. See where it is. · Taking longer than usual. Nothing is wrong on your side. · See what to change… | **Shorten** | Review: **See where it is.** Late: **Taking longer than usual.** Changes: keep. |
| Calendar preview | `home.calendar.preview.intro` | When members plan a trip to your program, they show up here, by day. When someone arrives, tap the circle… | **Shorten** | **Tap the circle when someone arrives.** That's the one thing they'd miss. |
| Program review | `programs.review.body.review` | Your program is in. We check every new program before members can find it. | **Shorten** | **Your program is in.** The steps show the check. |
| Program review | `programs.review.body.late` | This is taking longer than usual. Nothing is wrong on your side. If you have a question, ask Pam below. | **Shorten** | **This is taking longer than usual.** The Ask row is below it. |
| Program review | `programs.review.step.note.review` | Pam checks each one by hand | **Cut** | The step's name says it. |
| Program review | `programs.review.photo.body`, `.policies.body`, `.ask.body`, `.text.body` | Members see who they'll meet · Members sign them before they visit · A person will answer · Turn on text alerts | **Cut** | Rows are their names. "A person will answer" is a promise. |
| Add program | `join.program.review.note`, `programs.new.done.body`, `addProgram.ask.sent.body`, `.waiting.body` | Pam reviews every new program… · We will check it by hand and add it to the list. · We check every new program by hand. We will text you when we have checked it. | **Shorten** | Done/sent: **Sent. We'll text you when it's checked.** It says what comes next and drops "by hand". `join.program.review.note`: **Your Program tab shows where it is.** |
| Add program | `join.program.services.hint` | Name each thing you do, like GED classes or a computer room. Later, from your Program tab, you can give each one… | **Shorten** | **Name each thing you do, like GED classes or a computer room.** |
| Add program | `join.program.step.name.hint` | The name people know it by. You can change it later. | **Shorten** | **The name people know it by.** |
| Program | `program.services.hint` | Each service can have its own address, hours, phone, website and policies. Members pick one before they book. | **Cut** | The service rows show it. |
| Program | `program.service.intro`, `program.service.hours.hint` | Leave anything blank to use the program's. · Tick the days it runs. Leave every day unticked to use the program's hours. | **Keep** | Mid-task, someone would get it wrong without them. |
| Program | `program.service.policies.hint` | A policy you do not pick for any service is asked of everyone. | **Keep** | Changes what they choose. |
| Program | `program.service.remove.body` | Visits already booked for it stay booked. Members will not see it any more. | **Keep** | The consequence of a hard-to-undo act. |
| Program | `program.pending.body` | You asked to change the name or address. Members still see your program as it was. | **Shorten** | **Waiting for Pam. Members see the old one until then.** |
| Program | `program.switch.add.body`, `program.switch.row.body` | Tell Pam about another program you run. · Switch to another program, or add one. | **Cut** | Rows are their names. |
| Program | `program.tools.needsProgram.body` | This part is for your own program. Add it, and it will be here. | **Shorten** | **Add your program first.** |
| Policies | `policies.intro` | Documents members read and sign before they take part. They sign in Pam, and you can see who has. | **Cut** | The list and the "signed" counts show it. |
| Policies | `policy.replace.hint` | A policy is not edited once people can sign it. Add the new version… what they signed before stays on record. | **Shorten** | **People are asked to sign the new version.** Lena checked the record line (15:45: true; `add_policy` archives the old policy and the signatures stay). It goes to Will for Terms/Privacy. The "stays on record" fact goes to Terms (Lena). |
| Policies | `policies.remove.body` | People who signed it keep their copy. New people will not be asked to sign it. | **Keep** | The consequence of removing. |
| Person | `person.policies.intro` | What {name} has signed of your policies. They sign on their own device. | **Cut** | The list shows it. |
| Person | `person.card.note` | Here you see their first name and the visits they plan at your program. | **Move**, covered | `sharing.p2`, and the transparency screen for programs. |
| Book a visit | `book.intro` | Members who wrote to your program, signed up with it or planned a visit there. Pick one, then the day and time. | **Shorten** | **Pick a member, then the day and time.** Who's eligible is `sharing.p9`. |
| Book a visit | `book.new.intro` | Someone who has not used Pam yet. Their name and number, then the day and time. Pam texts them a link… | **Shorten**, now | **Their name and number, then the day and time.** "Pam texts them a link" is untrue today: "Add a person" books nothing and texts nobody (D-322; Lena, 15:45). |
| Book a visit | `book.new.note` | They get one text from Pam with a link. Nothing else is sent unless they join. | **Cut**, now | Untrue on a live screen: no text is sent and no visit is saved (D-322, `trips.booked.example.*`). Cutting it breaks no promise. Building the real flow is a decision for Will and a carrier filing (staff-entered numbers), not a Privacy line (Lena, 15:45). |
| Book a visit | `trips.booked.example.body` | …This is only an example: nothing was booked with the program, and nobody was texted. | **Shorten** | **Example. Nothing was booked.** |
| Interested | `interested.empty.body` | When members can tell Pam they are interested in your program, you will see them here. | **Shorten** | **Members who are interested show up here.** |
| Messages | `messages.empty.body.provider` | When a member writes to you about your program, or you message someone… | **Cut** | Never empty with Pam's conversation. |
| Schedule | `schedule.checkin.undo.body` | Their visit goes back to not checked in. | **Shorten** | **Their visit goes back to not marked as there.** "Checked in" reads as supervision (standing rule), and this matches `program-visits-contract`. |

## Super admin

| Screen | Key | Today | Call | New words / why |
|---|---|---|---|---|
| Requests | `requests.confirm.approve.body`, `.deny.body` | Pam will text {name} that they are in. · …the answer is no. They can ask again later. | **Keep** | What the tap does, including the text it sends. |
| Requests | `requests.done.body` | They already used Pam as a member. They keep that, and can switch between the two. We texted them that they are in. | **Shorten** | **We texted them that they are in.** |
| Review | `review.note.hint` | The leader will read this. Keep it kind and specific. | **Keep** | It changes what the super admin writes. |
| Review | `review.discard.body` | It leaves this list. The leader already took the program off when they started over. | **Shorten** | **It leaves this list.** |
| Directory | `directory.empty.body` | Pick a different kind of person, or invite somebody. Contact Pam if you expected to see someone here. | **Shorten** | **Pick another kind, or invite someone.** (The super admin *is* Pam.) |
| Waiting cities | `waitingCities.empty.body` | When someone signs up from a city Pam is not in yet, the city shows up here, with how many people. | **Shorten** | **Cities people ask for show up here.** |

## Kept as they are, in bulk

- **Badge descriptions** (`badge.*.desc`). They are what the badge means, and they're the app's personality (voice.md §3), not an explanation.
- **Empty states that say how to fill the list:** `saved.empty.body`, `saved.people.empty.body`, `trips.empty.body`, `reports.empty.body`, `places.reported.empty.body`, `notify.empty.body`, `requests.empty.body`, `review.empty.body`, and the search "none" lines.
- **Signed-out and wrong-account bodies** (`*.signedOut.body`, `*.notAdmin.body`, `*.notSuper.body`, `messages.notForRole.body`). They say why the screen is empty and what to do, as errors do.
- **Visit and booking confirmations** that say what is true now (`trips.booked.body`, `join.booked.body`, `trips.moved.body`).

## For Lena (new legal lines, Will's signature)

Checked against the code by Lena, 15:45.

1. ~~`privacy.s.texts.p4`~~ withdrawn (untrue for the visit reminder and the closed-place text). Lena's a102 line replaces it.
2. ~~From `book.new.note`~~ withdrawn. It described something Pam doesn't do; the screen line is cut instead.
3. From `policy.replace.hint`: **When a program replaces a policy, what you signed before stays on record.** Placed with `what-we-keep.p8`. True (Lena).
4. Reported messages, so `messages.report.*` can shorten. Add to `who-can-see.p3`, after "Then they see that message, and its photo or document if it has one.": **The Pam team can too, and so can the guide of the person who wrote it.** True (`report_visible_to_me()`, 0065), and today the screen line understates it. The transparency screen's Pam card (a101) would take the guide's line, which is Will's to widen.
5. `reminders.how`: signed 15:45 ("…each time something on this list happens"). `reminders.intro` is cut. (This line first said "with the carrier check done" before Lena had ruled on the intro. Her ruling came at 17:47: yes, cut. Both consent screens: ledger 1c09f1de.)

Everything marked "covered" can go as soon as its lane takes it, because a live Privacy line already says it.

## For Will (one card)

Lines he signed at the moment of choice that the rule would cut: a98's `calendar.intro`, `calendar.warn`,
`calendar.secret` and `calendar.details.hint` (all covered by `sharing.p6`/`what-we-keep.p12`); a91's `place.lead.sees`
and `place.noLead` (covered by `sharing.p2`; a91 still open); `messages.program.note` (covered, but put where a member writes on purpose, D-541); `help.intro`. Plus Lena's line 4 above (reported messages), and the matching widening of the Pam card. My recommendation: cut the a98 four and
fold the a91 cut into the open a91 card. Keep `help.intro`.

## Counts

By row (a row is one key or one small family of keys): **cut 27** (4 of them already covered by Privacy, 2 waiting on Lena's carrier check), **shorten 35** (1 covered), **move 3** (2 covered, 1 to Lena), **badge 5**, **keep 24**, **Will's 3**. Lanes can take them screen by screen.
