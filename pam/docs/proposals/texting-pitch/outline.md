# Answering a help request by text — a feature pitch for Will

Content and argument by Nico (Messages). Design, mockups and publishing by Dot. Written for Will, who asked
(Control Room, 11 October, 20:10 UTC): *"I'm going to need him to work with Dot to create a presentation similar to how a
product designer would create a pitch for a new feature … right now I don't understand how this feature would help. If you
believe that this would improve the user experience, how would it do so? What are other ways that we can leverage this in the
future to better service our user base?"*

**Rules for the deck.** Example people only. Fictional numbers only (215-555-01xx). The only email address is
hello@joinpam.org. Never sign in to the live app. Any wording that is not already on card a61 is marked
"draft, not signed". Nothing here changes code. Where Pam has no number, the slide says so. Honest, not a sales pitch: the case
against is made as clearly as the case for.

Images for the slides (example data, built from the real screens and email; in this folder):
`reply-light.png`, `reply-dark.png` (the page Will would use, 390 wide) and `request-email.png` (the request email, as the
function renders it). Dot makes everything else (storyboard, lock screen).

---

## 1. The decision, in one line

**Should Will be able to answer a help request with one text, from Pam's number, to a person who asked for help on
joinpam.org?**

Small print under it: built, and off. Nothing is texted until Pam's texts are on, and that waits for the carrier to approve
Pam's registration.

My recommendation (shown again on the last slide): **yes, the narrow version — one answer, one way — but not until two
questions on this deck are settled (email on the form; one text per number).** "Not now" is a fair answer.

## 2. Who it's for

The person who ends up on the website's help form: **someone who is stuck and cannot get into Pam to ask inside it.**

What Pam knows (each with where it comes from):

- Pam signs people in with a code texted to their phone number. There are no passwords. *(docs/sms-campaign-samples.md: "Pam has no passwords, so requesting the code is the request to be texted it")* A lost
  phone, a new phone or a changed number means the code goes somewhere else, and the person cannot get in.
- Someone who cannot sign in cannot reach the Help button inside the app. *(Iris, usability pass on the help site, 11 October,
  finding S1: "Someone who can't sign in can't open Pam.")*
- Pam's own list of what people are likely to type into the help desk includes "i lost my phone", "i got a new phone number",
  "change my number". *(docs/help-centre-gaps.md — phrases the team wrote down as likely, **not** counts from real people.)*
- Pam is built for a person who "hasn't used a phone in 8 years". Pam's own bundle limit assumes a member may be "on a prepaid
  plan and a throttled connection". *(CLAUDE.md; A12 — design assumptions, not measurements.)*
- The invite email Will tested landed in Spam. *(11 October; the cause is the sending
  domain's standing, which is Will's to fix at DNS: docs/email-setup.md.)* One example, not a rate.

What Pam does **not** know, and the deck should say so plainly: how many people will use the form; how many of them have no
email, or do not check it; how many have a smartphone; how many would see a text sooner than an email. The form is not live, so
there is no count of anything yet.

## 3. Today, as a storyboard

Six frames, one person ("Ana", example):

1. Ana gets a new phone. The sign-in code goes to the old number. She cannot get in.
2. She finds joinpam.org/support and searches. The posts help with some things, not this.
3. "Still stuck?" At the end of every post and on an empty search. **Today the form needs an email address.** (Until the form
   is switched on, the page shows the address hello@joinpam.org instead.)
4. The request arrives in hello@joinpam.org — the one email Will sees. (Image: `request-email.png`. Built and deployed, off.)
5. Will answers by email. *(He can; nothing sends until it is on.)*
6. **Ana may never see it:** she has no email, or does not check it, or it went to Spam.

Mark frames 3–5 "built, off" and frame 6 "the gap".

## 4. With the feature, the same journey

Same frames 1–2. Then:

3. The form also takes a **mobile number** (only shown while Pam's texts are on, so nobody waits for a text that cannot come).
4. The request email gets a **"Reply by text"** link. *(Not built yet; waits for Will's yes.)*
5. The link opens a page only a super admin can open. Will writes a short answer and presses **Send text**.
6. Within about five minutes — Pam's sender runs every five minutes — Ana's phone shows one text.

**Lock-screen mockup** (Dot): the text, word for word, as it is on card a61:

> **Pam:** *[Will's answer, 120 characters at most]* Reply STOP to stop texts.

with an **example** of Will's words, clearly marked as an example: *"Your new number is saved. Sign in at app.joinpam.org"*
→ on the phone: `Pam: Your new number is saved. Sign in at app.joinpam.org Reply STOP to stop texts.`

Notes under it: the "Pam:" start and the STOP line are Pam's (signed on a61, pending Will's signature); the words in the middle
are Will's, one at a time.

## 5. What Will sees

Two screens, as built, with example data (images in this folder):

- **The request email** — `request-email.png`. It has: what the person typed, how to answer them, the page they came from, their
  language, their role if the site knows it. Nothing from any member record: the function reads none. *(The "Reply by text"
  link is not in it yet.)*
- **The "Answer by text" page** — `reply-light.png` / `reply-dark.png`. The number from the link, one box, a counter
  ("52 of 120"), one button. Only a super admin sees it; anyone else meets the closed door.

Honest notes on what the page does not do yet (for the "gaps" slide at the end): it does not show Will the **whole** text as the
phone will show it ("Pam: …" and the STOP line). It checks his words against the same rules as the sender and says why if it
refuses, but it measures an Arabic or Chinese answer against the English limit of 160 characters.

## 6. What it does NOT do

- **No conversation.** One text to one number. Pam does not read replies (decision D-460). If the person replies, Pam does not see
  what they wrote.
- **One answer.** Today that is Will's discipline, not a rule in the code — the sender has no "one per number" cap (see slide 8).
- **STOP stops it.** Twilio itself blocks a number that replied STOP. Pam's own stop list (which also remembers numbers nobody in
  Pam has, and cancels a support text already waiting) fills only once the receiver for replies, `sms-inbound`, is deployed and
  Twilio points at it. **It is not deployed yet.**
- **Never marketing.** It is only for answering a request someone made.
- **Nothing stored about the person.** The number travels in the link. Pam keeps a log row for each text: when, who sent it, a
  scrambled form of the number (a hash), the outcome. Never the words, never the number.
- **Off until texts are on** and the carrier has approved Pam's registration.

## 7. The benefits

**To the person (Ana):**
- The answer arrives where she already is: her phone, not an inbox she may not have.
- She does not need an email address to receive it.
- It says who it is from ("Pam:") and how to stop it.
- Faster than waiting to find her email — *expected, not measured.*

**To Will:**
- One tap from the request email to the answer.
- He sees at once why something cannot go (texts off; number stopped; too long; not a number).
- The people he currently cannot reach at all become reachable.

**To Pam:** the help desk's last step stops at a dead end less often. All of this is expected, none of it measured; the deck
should say so once, plainly.

## 8. The costs and the risks (the catches)

1. **The "never reads your texts" promise (D-460).** A text from Pam that invites a reply, and then reads nothing, is a promise
   Pam would keep only by never reading. A person who replies will think someone read it. Mitigation (a61, question 1): anyone who
   replies gets one fixed answer: *"Pam: This number can't read replies. Write to hello@joinpam.org."* — **draft, not signed,
   not wired.** The catch inside it: a person with no email cannot "write to hello@"; they can only use the form again.
2. **The carrier registration.** Pam's texts are registered as in-app opt-in. A number typed into a web form is a different door.
   The filing needs one sentence for it (drafted, pending Will) and one new sample message. Until the filing is approved, no text of
   this kind can go; getting it wrong risks the whole campaign being suspended, which would also stop reminders. Texts stay off
   until it is approved.
3. **The 120-character limit.** The answer plus "Pam:" and the STOP line must fit one text. For Latin letters that is 120
   characters of Will's words. **Arabic, Chinese and Russian count about half** (70 characters per text) and cost more than one
   text; the page does not yet measure that. A gap to close before launch.
4. **Cost per text: unknown.** Pam's own notes name a monthly campaign fee ("roughly a dollar fifty a month") and "the per-message
   price" but never the number. Will can read it from the Twilio account. Expected volume is small, but that is a guess.
5. **Texting a number someone else typed.** Anyone can type any mobile number into the form, including somebody else's. Pam would
   then text a stranger. The text says nothing about the person, and has a STOP line, but a stranger gets a text from "Pam"; and
   today nothing caps how many answers one number can get. The form limits how many requests one person can make an hour (three),
   not how many texts one number receives. Options: send only to numbers Will judges real; add a cap per number; confirm the
   number with a code first (costs a text and defeats the speed). **A decision for Will.**
6. **Email is required on the form today.** The person this is for — no email — cannot use the form at all. The feature only helps
   if the form accepts "email **or** mobile number". That is a change to the form, not to the text.
7. **It adds a way for Pam to be wrong to the wrong person.** A text is read on a lock screen, at work, by whoever is near.
   Nothing in the text says why Pam is writing. (Pam's rules: never reveal justice involvement; the sender refuses banned words.)

## 9. Alternatives (including "don't build it")

| | What it is | For | Against |
|---|---|---|---|
| **A. Don't build it; email only** (today) | Will answers by email | Nothing to build, nothing to refile, nothing texted to a stranger | Fails the person with no email or an unchecked one — the reason for this deck |
| **B. In-app messages** | Will answers inside Pam | Already exists; replies possible | Needs a person who can sign in, which this person cannot |
| **C. Ask the person who invited them** | The case manager or program who invited them relays the answer | A human the person knows; no new texting | Depends on a person being available; only for invited people; the form does not know who invited them |
| **D. A phone line** | Call Pam | Familiar | Out: A28, Will, 11 October |
| **E. Fix the email** (the sending domain's standing: SPF, DKIM, DMARC) | Make Pam's email arrive | Helps every email Pam sends | Does not help someone with no email |
| **F. The narrow text (this deck)** | One answer by text | Reaches the unreachable | Slide 8 |

## 10. How we would know it works

Only counts Pam can keep **without reading anything**:

- Support texts sent, per week. *(the log of support texts; exists)*
- Of those, how many were delivered, failed or cancelled. *(the queue's status; exists)*
- How many numbers replied STOP after a support text. *(once the reply receiver is deployed, the stopped-numbers list can be matched with the log; no content)*
- Requests received through the form, per week. **Does not exist yet as a count:** the platform's request log shows that
  requests arrived, but nothing totals them, and the limit table forgets after a day. A daily counter with no content would be needed.
- Time from request to answer. **Not possible without keeping the request's time with the number** — which the design avoids on
  purpose.
- Whether the person got back into Pam. **Not knowable** without linking the number to an account.

Honest line: Pam can tell if texts go out and are not rejected; it cannot tell if they helped. The only way to know that is to ask
a few people, with their say-so.

## 11. Where else this could go (each an idea that needs its own decision)

Mark every one: **idea — not built — not decided.**

- **What Pam already has, built and off until texts are on:** visit reminders (day before), "a saved place has closed", and four
  alerts (a message waiting, a visit booked, a booking changed, a visit planned). They share the same registration.
- **A sign-in link by text** for people who can read a link but not a six-digit code. Needs its own design.
- **"A spot opened" alerts** when a program has room again for someone who was interested. Needs data Pam does not hold yet.
- **A nudge to a case manager** when someone they invited has not signed in. Reaches the helper, not the person.
- **Confirming a visit by replying YES or NO.** The wording exists ("Did you make it today? Reply YES or NO") and is not used.
  It would mean Pam **reads replies**, which changes the privacy promise (D-460). The largest decision on the list.
- **Pam for people without a smartphone.** Reminders and help by text for a person who has only a basic phone. Needs everything
  above to be reliable first.

## 12. The ask

Card a61's four questions, each with my recommendation. "Not now" is allowed for every one.

1. **Forward people's text replies to hello@?** *Recommend no.* Keep the promise in D-460. Instead, anyone who replies gets one
   fixed answer ("Pam: This number can't read replies. Write to hello@joinpam.org."), once you sign it.
2. **One answer only, never marketing, plus one sentence about the web form in the carrier filing?** *Recommend yes* — and add a
   cap of one text per number per day in the code.
3. **Keep the sender's checks, and show you the reason when it refuses?** *Recommend yes.* (It already does.)
4. **Store nothing about the person — the number in the link, a log row without words?** *Recommend yes.* (Already built so.)

Two more I would add, not on a61:

5. **Make email optional on the form, so the person with no email can use it?** *Recommend yes; without it the feature does not
   help the people it is for.*
6. **Texting a number someone else typed: accept the risk with a per-number cap, or require a confirming code?**
   *Recommend the cap.*

And the overall question: **build the narrow version once the carrier filing is approved, or not now?** *Recommend: do items 5
and 6 first; switch on only after the filing is approved; measure with the counts on slide 10; decide on anything in slide 11 only
afterwards.*

---

### Sources for the deck's footers

D-460 (what Pam reads), D-511 (examples vs real accounts), D-521 (the help-request function), D-524 (this feature), A28 (no phone
line; help goes problem → help desk → email), docs/research/2026-10-11-help-site.md (Iris S1), docs/help-centre-gaps.md,
docs/sms-setup.md (cost lines, filing), docs/sms-campaign-samples.md (sample 10 and the opt-in sentence), docs/email-setup.md.

### What is built, what is not (for an appendix slide if Dot wants one)

Built, off: the help-request function (deployed; answers "not live" until switched on), its limit (three requests an hour per
person), the "Answer by text" page, the support-text sender with its checks, the list of numbers that asked to stop, the log, and
the two draft texts (unsigned). **Not built:** the receiver that hears a STOP reply (`sms-inbound`; not deployed, so Pam's own stop list is empty until it is); the mobile-number field on the form; the "Reply by text" link in the request email;
the fixed answer to replies; forwarding replies (and not recommended); a cap per number; a daily request counter; a check that
measures non-Latin answers.
