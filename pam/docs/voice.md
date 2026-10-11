# How Pam sounds

The guide to Pam's voice, for a person or an agent writing words for Pam: the app,
the website, the support posts. Read it once before you write; keep the checklist at
the end open while you do.

Written 11 October 2026 by Sage (Voice & UX copy), at Will's request: "create
impactful, yet very human UX copy that we can use to instill personality on certain
pages, like the website."

**What this guide does not change.** The rules in `CLAUDE.md` still decide: no justice
terms, ever; every string in seven languages, in step (`docs/copy-changes.md`); texts
start with "Pam:", stay inside their length and carry no emoji (Nico's and Lena's to
enforce). A promise (privacy, terms, the transparency screen, notices) never changes
meaning without Lena. And nothing ships without Will's sign-off.

---

## 1. Who we write for

Every line is measured against one person: **someone who hasn't used a phone in 8
years, reading on a cracked screen in the sun, who has little reason to trust an app.**
If they can follow it, everyone can.

| Who | What they bring to the screen | What they need from our words |
|---|---|---|
| **Members** — people coming home, many after years away | Phones and apps have changed under them. Forms have gone badly before. Some read English as a second language, some read slowly. Pride: nobody wants to be talked down to. | Short lines. One thing at a time. What happens next. That a problem is not their fault, and that a person will help. |
| **Case managers** (and probation officers; one role) | Busy, a big caseload, phones ringing. Used to systems that make work. | Fast scanning. Plain facts about what they can see and do. No selling. |
| **Program leads** (staff who run a program) | Proud of their program, short of time, wary of more paperwork. | What Pam does for their program, what members will see, how long things take. |

We write *to* the person on the screen, as "you". Pam speaks as "we" when a real team
stands behind the words ("We answer Monday to Friday"), and as "Pam" when the app
itself acts ("Pam texts you a code").

## 2. Four traits

Pam sounds like **a calm, kind person at a front desk who knows the city**: they look
up when you walk in, tell you straight, and walk you to the right door.

Each trait below has pairs taken from real Pam strings (the `en.json` key in brackets).
"Don't" lines are strings we would write differently today; they are proposals, not
changes, until Will signs them.

### 2.1 Plain — say it the way you'd say it out loud

Short words, short sentences, one idea per line. About a fifth-grade reading level
(the brief every translation gets, `copy-sync.ts`). Name things by what a person
sees, not by what the system calls them.

| Do | Don't |
|---|---|
| "That code is too old" (`notice.invite_expired.title`) | "Invite expired" |
| "Ask to join" (`action.requestToEnroll`) — the key says *enroll*; the screen doesn't | "Request enrollment" |
| "Pam texts you a code to sign in. No password to remember." (`signin.phone.consent`) | "We'll send a one-time passcode via SMS." |
| "Book a visit" | "Create new booking" (`home.book`) |
| "Remove {name} from Saved" | "Unsave {name}" (`saved.unsave`) |

### 2.2 Warm — a person, not a system

We sound like someone who is glad you came. Warmth is in *who is speaking* and *what
they offer*, not in exclamation marks or cheer.

| Do | Don't |
|---|---|
| "Someone at Pam can help you. You do not need to know what to ask for." (`help.intro`) | "Contact support for assistance." |
| "Welcome, {name}. Your first points are on the board." (`join.done.body`) | "Registration complete!" |
| "We need your first name so Pam can say hello." (`join.details.need.name`) | "First name is required." |
| "Nothing here yet. Say hello." (`messages.thread.empty`) | "No messages." |
| "Going is easier with someone. Send this link so they can come too." (`friend.body`) | "Invite friends and earn rewards!" |

### 2.3 Steady — certain, honest, never alarming

Say what is true, including what Pam does not do yet. Never blame the person. When
something fails, say what happened, that it is not their fault, and what to do.

| Do | Don't |
|---|---|
| "This is not your fault. Try again. If it keeps happening, contact Pam." (`notice.something_went_wrong.body`, A28) | "An error occurred. Please try again later." |
| "Taking longer than usual. Nothing is wrong on your side." (`home.setup.review.body.late`) | "Your submission is pending." |
| "Today Pam sends only one of these … The others are coming." (`reminders.today.member`) | Promising a reminder Pam doesn't send yet |
| "Pam is not in {city} yet." (`join.waiting.body`) | "Your area is not supported." |

### 2.4 Respectful — dignity first, always

People are members, not cases. Nobody is defined by their past, and nothing on a
screen suggests why someone needs help. Give people choice and control, and tell
them who can see what.

| Do | Don't |
|---|---|
| "For someone coming home" (`about.how.member`) | Any word that labels a person by their past (see the word list) |
| "Tell us what happened. You don't have to explain everything." (the Your safety post) | "Describe the incident in detail." |
| "Pam never tells you why someone is looking for help." (`join.privacy.provider.4`) | — |
| "Saved. You can change this whenever you want." (`reminders.saved`) | "Settings updated." |

## 3. How the voice flexes

The voice is always the same person. The *tone* moves with the moment, like that
person at the desk: chattier when you walk in, quieter when you're filling in a form.

```
  more personality                                                   plainest
  ◄──────────────────────────────────────────────────────────────────────────►
  website hero   welcome & done   empty states   tasks & forms   errors   privacy,
  & sections     moments                                                  terms, notices
```

| Moment | Tone | What's allowed | Example |
|---|---|---|---|
| **Website** (hero, sections) | Warmest, most personality. Confident, a little bold. | A strong verb, a short punchy line, a contrast ("people, not paperwork"). One idea per section. Talks to all three audiences, member first. | "Find help in your city. Talk to a real person." |
| **Welcome and done** (joined, booked, first points) | Glad for them. | A warm word ("Welcome"), the person's name, what they now have. Still no exclamation-mark cheer. | "You are in" / "Welcome, {name}." (`join.done.*`) |
| **Empty states** | Encouraging, practical. | What will appear here, and the one way to fill it. | "Tap Save on a place and it will be here, ready when you need the address." (`saved.empty.body`) |
| **Tasks and forms** | Calm, brief. | A question as the title, one hint, nothing else. | "What's your program called?" (`join.program.step.name`) |
| **Errors and waiting** | Calmest. Reassuring. | Not your fault, what happened, what to do, how to reach a person (Contact Pam). No jokes, ever. | "We could not send the code" + "This is not your fault…" (`signin.failed.send.*`) |
| **Privacy, terms, notices, the transparency screen** | Plainest of all. Exact. | Only what is true and only what is promised. No personality, no softening that changes meaning. Lena signs the meaning. | "Not their chats, photos or documents." (`join.privacy.admin.3`) |

### The website's headline lane: short, snappy, human

Will, 11 October 2026, on the Callout card options: "I really liked your tone in Option C, let's
remember to use copy more in that lane." The lines he meant:

- "Find help in your city. Plan your visit. Keep going."
- "Your policies, signed before they arrive."
- "Their plans, your guidance, in one place."

What they share, and what to write more of on the website:

- **Short beats, often three.** A full stop where a comma would go. Each beat is one thing a person does
  or gets: "Plan your visit. Keep going."
- **"Your" up front.** The line belongs to the reader: "Your policies…", "Their plans, your guidance…".
- **A turn at the end.** The last beat lands the benefit: "…signed before they arrive", "Keep going."
- **Plain words only.** Snappy comes from rhythm, not slang or idioms, so it still translates.
- **One supporting sentence underneath** carries the facts. The headline earns attention; the sentence
  keeps it true.

The headline lane is for the website, welcome moments and section headings. Tasks, errors and privacy
stay plain (above).

### People are guided, never watched

Will, 11 October 2026: "we don't want to market anything saying: Know where your people are going,
because it sounds like surveillance." The SOP says it in other words: admin is not surveillance.

When you write about case managers, programs or anyone who can see something about a member, write
about **helping**, not watching. The case manager is a guide and a mentor; the member is the one moving.

| Write | Not |
|---|---|
| "Guide your people from plan to progress." | "Know where your people are going." |
| "Walk with your people, one visit at a time." | "Know who showed up." |
| "See the steps they take, and message them along the way." | "Track", "monitor", "keep tabs on", "check up on", "see if they went" |
| "Their plans, your guidance, in one place." | "Everything about your caseload, at a glance." |

What a case manager can see is a promise to members (the transparency screen), so it is told plainly
where members read it, in the app and the privacy page. Marketing doesn't lead with it.

### Marketing may reach; everything else says only what's true today

Will, 11 October 2026: "marketing website can be more aspirational, making exceptions to what we say. It's okay
to say it on homepage if we're working towards it."

| Where | What it may say |
|---|---|
| **Marketing pages**: Home, and pages that sell Pam | What Pam does today, **and what we are working towards**: a feature on its way, the support we're building. Bold is fine. Make-believe isn't: only what is really planned. |
| **Help posts, the app, texts and emails, anything legal or a promise** (privacy, terms, the transparency screen, notices) | **Only what is true today.** Check the app's own strings and `apps/site/src/content/flags.ts` before you write it. If it isn't live, say "coming" or leave it out. |

So on Home, "reminders before every visit" or "help any time" can stand if they are on the way. In a help post or
on a screen, they wait until they are real. Two limits stay on marketing too: nothing about who can see a person's
information that the transparency screen doesn't say, and nothing that sounds like watching people (above).

## 4. Patterns

### Buttons
- **A verb, then the thing:** "Send me a code", "Save my city", "Contact Pam", "Ask to join".
- **Two to four words.** It must still fit at 40% longer (the pseudo-language).
- **Say what the tap does, not what the person feels:** "Book this visit", not "Let's go!".
- The button's words match the screen's title: a screen called "Block this person?"
  confirms with "Block" (`messages.block.*`).
- "Next", "Done", "Back" only where the step is obvious.

### Titles
- **Tasks: ask the question.** "What is your phone number?", "Where is it?"
- **Results: say the outcome.** "Your visit is booked", "That did not send".
- Sentence case, no full stop, no exclamation mark.

### Empty states
Title says what isn't here yet; body says what will appear and how.
> **No trips yet** — When you plan a visit to a place, it shows up here with the time and how to get there. (`trips.empty.*`)

### Errors
Three parts, in this order: **what happened** (title), **not your fault + what to do**
(body), **a way to a person** (Contact Pam). Never "error", "invalid", "failed" as a bare word,
never a code. Tell people how to fix input with an example:
> "That does not look like a phone number. Try again with the area code, like 215 555 0100." (`signin.phone.invalid`)

### Confirmations: say what happens next
A confirmation is not "Success". It says what is now true and what comes next.
> "Saved. Your new name or address is waiting for Pam. Members still see the old one until then." (`program.saved.change`)
> "We check every request by hand before we open an account. It takes a day or two." (`join.staff.body`)

If something will *not* happen, say so ("Nothing else is sent unless they join",
`book.new.note`).

### Help
- Lead with the person: "Someone at Pam can help you."
- **Pam has no phone line (A28).** Help goes in one order: the problem → the help desk (search and posts) → "Still
  stuck?", which lets a person write to Pam. Never tell someone to call Pam; "Contact Pam" opens the help desk.
- Answers first, the write-in after: "Still stuck?" sits at the end of a post or under an empty search. The one
  exception is safety, where writing to Pam comes straight away.
- Safety first and plain: "Call 911 first." (`help.safety.danger.body`) and "In crisis? Call or text 988."
  Pam is not an emergency service; say so.
- A place's own number is fine: "Call this place", "call before you go".
- Help goes where people get stuck (A26): sign-in and joining, forms, anything failed or waiting, each step of a task.

### Waiting
A spinner, not a sentence (A10). Don't write loading copy.

## 5. Words

### Words we use

| Say | Not | Why |
|---|---|---|
| **Pam** | PAM | The name is a person's name. Invite codes keep `PAM-XXXX`. |
| **member** | user, client, participant | A person who belongs. In the app only; the website says **residents** (see "The app and the website use different words", below). |
| **case manager** | caseworker, officer, PO, supervisor | The role's one name (A1), and the phrase members recognise. |
| **your guide** | — | The member's short word for their case manager or whoever invited them, **defined once on the screen where it appears** (D-416). Use "case manager" where there is no guide card. On the website, "Guides" is one of Will's words for case managers. |
| **program** | vendor, resource, service provider | What a member visits. ("Providers" on the website means the staff who run programs, not the program itself.) |
| **program lead** | admin | The staff person who runs a program, in the app. The invite still says "Program partner" (`join.invited.role.provider`); "program lead" is the app's word. The website says **providers** instead. |
| **place** | location, facility, site | What's on the map. |
| **visit** | appointment, booking, engagement | What a member plans. The tab is **Trips** (`glossary.trip.*` defines a trip); Spanish says "Visitas". |
| **join** | enroll, register, sign up for | "Ask to join". |
| **sign in** | log in | One phrase, everywhere. |
| **text** | SMS, message (for SMS) | "Pam texts you". "Message" is for chat in the app. |
| **contact Pam** | call Pam, contact support | Pam has no phone line (A28). "Contact Pam" opens the help desk, then "Still stuck?" reaches a person. |
| **Learning, Earning, and Family Support** | — | Pam's three kinds of help, capitalised as names. |

### The app and the website use different words

Will, 11 October 2026: "No need to say Program lead on marketing site, we call members: Residents or people
looking for help, Program leads = Providers or social services, and Case Managers = Case Managers or Guides."

| Who | In the app | On the website (marketing) |
|---|---|---|
| A person using Pam for themselves | member | **Residents**, or people looking for help |
| Staff who run a program | program lead | **Providers**, or social services ("Program Providers" on the Home chips) |
| Staff who guide members | case manager (and "your guide", defined on screen) | **Case managers**, or Guides |

The app's words stay as they are: they are on hundreds of screens in seven languages, and a member
learns them once. The website talks to people before they have an account, in the words they already use.
Support posts explain the app, so they use the app's words and may say both ("A program lead, the person who
runs a program…").

### Words we never use

- **Justice terms, anywhere a person can see** (`CLAUDE.md`, enforced by tests):
  prisoner, ex-offender, inmate, felon, convict, parolee, parole violation, or
  anything about a conviction. "Returning citizen" is an internal term; on screen,
  say "someone coming home" or just "member".
- **Words that hint at someone's past** where it isn't needed: "second chance",
  "reentry", "background", "history". On the website a privacy line may speak of
  people "whatever their past" only if Will chooses it; in the app, never.
- **System words:** user, submit, invalid, error, required field, expired,
  authenticate, verify (say "check"), configure, settings updated.
- **Jargon and buzzwords:** leverage, empower, seamless, solution, resources, engagement,
  gamified, intake, AI-powered (unless Will decides to say it, and it is true).
- **Watching words about people:** track, monitor, keep tabs, know where they are, see if they showed up.
  Guide, walk with, help, cheer on instead (see "People are guided, never watched").
- **Blame and pressure:** "you failed to", "you must", "don't miss out", countdowns.
- **Cheer that isn't earned:** "Awesome!", "Yay!", exclamation marks on titles.

## 6. How we work on words

- **In Figma, Sage writes straight into Will's component when he asks** (Will, 11 October 2026: "When I ask
  for help in Figma, you can go ahead and write over the text in component. It's collaborative, but I need
  someone to be responsible for the copy pass."). Only the component he names: "Just the component, not
  all home page." Change the words, not the design. If longer words make a variant grow, keep variants from
  overlapping and tell him. Figma comments don't reach the team; his asks come through Mira with the link.
- **No translation while words are still in Figma.** Will: "We don't need to translate it right away. Only
  when the website is merged, then handle languages after. It's too soon in the collaborative flow to start
  translating. We're just brainstorming inside Figma." Website words are translated after the change is
  merged. App strings still go into all seven languages when they are built (`docs/copy-changes.md`).
- **Everything still goes to Will.** A Figma pass is his to keep or change; nothing reaches the live site
  until he says so.

## 7. Writing for seven languages

Every English line becomes six more (Spanish, Brazilian Portuguese, Simplified and
Traditional Chinese, Russian, Arabic), translated from your words and checked to
fit at 320px.

- **Short sentences, one idea each.** A long sentence grows 30–40% and wraps badly.
- **No idioms that don't travel.** "in your corner", "want in", "on the board",
  "raise the bar", "game-changer" become nonsense or need rewriting. Prefer the
  literal: "with a person who helps you" over "a person in your corner". On the
  website hero, one idiom is allowed only if the line still works word for word.
- **Keep `{placeholders}` whole and readable on their own.** Don't build a sentence out
  of pieces ("You have " + n + " visits"): word order changes. Write the full
  sentence with the placeholder inside it: "{count} people on your list".
- **No gender, no "he/she".** Use "they" or the person's role. Russian is told to avoid
  gendered verb forms (`LOCALE_BRIEFS`); give it a sentence that allows that.
- **Don't lean on capital letters, puns or rhyme.** Chinese and Arabic have no capitals;
  a pun has no translation.
- **Dates, times and numbers come from the app**, not written into the sentence.
- **Leave room.** If the English only just fits, the Russian won't.
- **Changing an English string makes the other six stale** (`copy:status`). A wording
  tweak that doesn't change meaning is marked so on purpose (`copy:ack --keep`).

## 8. One-screen checklist

Before you send words to Will:

- [ ] Would someone who hasn't used a phone in 8 years understand every word?
- [ ] One idea per sentence; can any word go?
- [ ] Does the title ask the question (task) or say the outcome (result)?
- [ ] Does the button start with a verb and say what the tap does?
- [ ] Does a confirmation say what happens next? Does an error say it's not their fault, what to do, and how to reach a person (Contact Pam, never a phone)?
- [ ] Is every claim true today? In help, the app and anything legal it must be. On marketing pages it may be what we are working towards.
- [ ] No justice terms, no hints at someone's past, no system words, no buzzwords.
- [ ] Our words. App: member, case manager / your guide, program lead, program, place, visit, join, sign in, text, contact Pam. Website: residents, providers, case managers / guides.
- [ ] No idioms, no pieced-together sentences, `{placeholders}` whole, no gender.
- [ ] Right tone for the moment: on the website and in welcomes, the headline lane (short beats, "your", a turn at the end); plainest in errors and privacy.
- [ ] Does anything sound like watching people? Write it as guiding them.
- [ ] Touches a promise (privacy, terms, transparency, notices)? Lena reads the meaning.
- [ ] Sent to Mira as a QUESTION for Will. Nothing ships unsigned.
