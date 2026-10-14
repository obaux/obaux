# Forms with Social Security numbers and signatures: a legal and Privacy read

**Written by:** Lena (Languages & legal), 14 October 2026, for Mira and then Will. **Asked:** Will, 14 October, 04:03 UTC, relayed by Mira.
**Status:** a note. Nothing is built, nothing is translated, nothing here is for signing.

> **I am not a lawyer, and this is not legal advice.** It is a careful read by the session that keeps Pam's Privacy and Terms pages, so that
> Will and a lawyer start from the right questions. I read the statutes through search summaries and law-firm notes (the page fetcher
> was blocked from the statute sites in this session), so every legal citation below carries a tag:
> **[checked]** two or more sources agree, **[one source]** a single summary, **[not checked]** my general knowledge. Anything that decides a
> launch needs a Pennsylvania lawyer to read it against the statute itself. Section 5 lists what to ask them.

## What Will asked

Members of social programs must fill and sign PDF forms that ask for name, initials, birth date, Social Security number, today's date and
signatures, sometimes 100 or more forms in one sitting. **Pam must not store these details.** The routes on the table: DocuSign shown inside
Pam (programs already use it), or filling and signing inside Pam without DocuSign. Iris is researching the technology.

## The short version (read this if nothing else)

1. **The safest design is the one where Pam is never in the path.** The member types the number into the signing company's own page (shown
   inside Pam, or opened from a link), the signed form goes to the program, and Pam learns only *that* a form was signed, for which program,
   and when. Then "Pam does not store it" is true because Pam never receives it, not because Pam promises to delete it. Every other design
   makes the promise depend on every log, backup, cache, error report and vendor between the phone and the database.
2. **If a Social Security number plus a name ever reaches a Pam server, even for one second, Pam stops being outside the breach laws.** Today Pam
   holds a first name and a phone number, which are mostly outside Pennsylvania's breach-notice law; a Social Security number with a name is the
   first thing on that law's list. That would be a new kind of company, with duties Pam does not meet today (a breach plan, a way to reach
   people, a lawyer on call, probably insurance), for a population whose identity is already most at risk.
3. **"Store nothing" can be true of the data and still not be enough for a legal signature.** A signature that holds up needs someone to keep the
   signed record and the evidence of how it was made. That someone should be the program (or its DocuSign account), not Pam. If Pam did the
   signing itself and kept nothing, it could not show later who signed, when, after what consent. That is the one thing a signing tool must be
   able to do. D-485's "a record that you read and agreed, not a legal signature" is the right word for what Pam does today, and it should
   stay the word until Pam is a signing tool.
4. **DocuSign inside Pam works well for "store nothing" only on the program's own DocuSign account, with the narrowest access.** On Pam's own
   account, DocuSign would keep every completed envelope for Pam, which is Pam storing it by another name.
5. **Recommendation: the program's own DocuSign account, embedded in Pam, with least-privilege access and a test that fails if Pam's code ever
   gains a field for these numbers. First step, and a good place to stop for now: Pam only shows the program's DocuSign link.**

## 1. Social Security numbers and birth dates passing through Pam

### What the law keys on

- **Pennsylvania's Breach of Personal Information Notification Act** (73 P.S. § 2301 et seq., "BPINA") **[checked]**. It covers an entity that
  maintains, stores or manages computerized data containing "personal information" **[checked]**. Personal information is a first name or
  initial and a last name together with, among other things, a **Social Security number**, a driver's licence or state ID number, or a
  financial account number with its access code **[checked]**. Act 151 of 2022 (effective 2 May 2023) added medical information, health
  insurance information and an online account name or email with its password or security answer, and changed when the clock starts from
  "discovery" to "determination" of a breach **[checked]**. A breach is unauthorized **access and acquisition** of unencrypted, unredacted
  computerized data that materially compromises the information and is reasonably believed to cause loss or injury to a Pennsylvania resident
  **[checked]**. Notice goes to the affected residents without unreasonable delay, and **to the Attorney General when more than 500
  Pennsylvania residents are affected** **[checked]**. A 2024 amendment (SB 824, effective 26 September 2024) is reported to add the Attorney
  General notice for private entities and an offer of credit monitoring **[one source; verify the text]**. A vendor that maintains data for another
  entity must tell that entity when it suspects a breach **[one source; verify the exact words]**.
  - **A birth date is not on the list by itself.** It matters because a name, a birth date and a Social Security number together are what
    identity thieves use, and because a form that asks for all three is exactly the target a breach would be after.
  - **"Maintains, stores or manages" is the hook.** A server that only holds the number in memory for the length of one request is a hard
    case, not a safe one: the number can sit in a request log, a crash report, a database error message (Postgres can write the parameters of a
    failed statement into its log), a backup, a cache, a CDN, an analytics or error-tracking tool, or a screenshot taken for support. Any
    of those is a copy, and an attacker with live access to the server during the request has "acquired" it.
- **Pennsylvania's Social Security number law**, Act 60 of 2006, 74 P.S. § 201 **[checked]**. A person or entity may not publicly post or
  display a Social Security number, may not print it on a card or in mailed material without limits, **may not require a person to send it
  over the internet unless the connection is secure or the number is encrypted**, and may not require it to log in to a website without a
  password or other authentication. Pam would meet the transmission rule with HTTPS and the sign-in code; the practical lesson is that Pam
  must never *require* the number to use Pam, only a program's form may ask for it. Volunteered transmission is outside that clause
  **[checked]**.
- **All other states' breach laws** apply to residents of those states **[not checked]**; a member who lives or was served in New Jersey or
  Delaware brings those laws with them. Pennsylvania has no single comprehensive consumer privacy statute **[one source; a bill may have moved
  since, check]**, so the heavy rules are the breach and Social Security number laws plus the general ban on deceptive practices.
- **Deceptive-practice law.** The Federal Trade Commission Act section 5 and Pennsylvania's Unfair Trade Practices and Consumer Protection Law
  treat a false privacy promise as a deceptive practice **[not checked in this pass; well established generally]**. This is the risk a sentence
  such as "Pam keeps nothing you type in a form" creates if it turns out to be untrue in any layer. Pam's Privacy page is a set of promises to
  people who "have good reason to be careful" (`privacy.intro`); a broken one costs more than a missing one.
- **Sector laws that apply only if Pam is the wrong kind of company for a program.** If a program is a **HIPAA covered entity** and its forms
  carry health information, a vendor that *maintains* that information for it is a business associate who needs an agreement; the "conduit"
  exception covers transmission only and is narrow, and the Department of Health and Human Services has said a cloud provider that holds
  encrypted data without the key is still a business associate **[checked]**. Substance-use treatment records have their own consent and
  redisclosure rules (42 CFR Part 2) **[not checked]**, and these forms are often those consents. The design that keeps Pam out of all of
  this is the same one: Pam never receives the content. Government agencies asking for a Social Security number have their own disclosure
  duties (the federal Privacy Act section 7 and state equivalents) **[not checked]**, and are the program's, not Pam's.

### What changes for Pam if the numbers pass through it

| | Today | If they pass through Pam |
|---|---|---|
| What Pam holds that the breach law names | A first name and a phone number; a last name for staff (`what-we-keep.p7`). Mostly outside BPINA's definition. | A name with a Social Security number: squarely inside it. |
| If something goes wrong | A phone number and first name leak: serious for this population, but not a legal notice event in the way a Social Security number is. | Notice to every affected person, to the Attorney General above 500, a credit-monitoring offer, a regulator's questions. |
| Reaching people to tell them | A phone number. | Pam has no email or postal address for members; a text would have to say what happened without naming a justice program (`privacy.s.never-say`). |
| The promises | `what-we-keep` lists first name, phone and language; the transparency screen lists what a guide can see. | A new category the transparency contract must name (below). |
| Who audits | Nobody. | A funder, a program's counsel or a security questionnaire from a program that signs a data agreement with Pam. |

### The transparency contract

`packages/config/src/transparency.ts` says anything not on its list is not visible to a guide, and widening the list needs Will's sign-off and
telling members first. A form's contents are not visible to a guide in any design here (a guide is Pam's case manager, and the form belongs to
the program), so the change is a **narrowing**: add to `ADMIN_CANNOT_SEE` an entry such as `form_contents`, and a line on the transparency
screen and in `who-can-see` that says so. That is a promise Pam can make only in the "never in the path" design; in a design where the numbers
pass through Pam's database, it would be untrue the moment a super admin could read the table.

### The population

People coming home from prison or jail are among the people most exposed to identity theft (their number and birth date may have been
handled by many institutions), most likely to share or lose a phone (the new-number feature exists because of it), most likely to use a
library or a friend's computer for a long form session, and least likely to be able to recover from a stolen identity. Three consequences for
the design, whatever the route:
- **Nothing is kept on the device either.** No saved number, no "remember this for next time", no browser autofill of the Social Security
  field (`autocomplete="off"`, masked while typing). A lost phone must not be a lost Social Security number.
- **100 forms in one sitting needs a way to type once.** The way that keeps the number out of Pam is for the signing company to carry the
  value across forms (DocuSign can fill several fields that share a data label from one entry, within an envelope, when its "data
  population scope" setting is on; community reports say API-created envelopes need the shared labels to end with an asterisk
  **[one source; Iris to confirm]**). One envelope with many documents, signed in one session, is the shape to test.
- **A session limit that is kind.** Long sittings need a pause and resume that does not keep the typed values, and a clear "you are on a shared
  computer" step at the start and end. The trade-off between a short timeout (safe) and the member's patience (100 forms) is a question for
  Will, below.

### Pam's own words must stay true: three places that could leak

1. **Link previews** (`privacy.s.what-we-keep.p6`): Pam's server opens a link once to read its title and picture. A signing link posted in a
   message would be opened by Pam's server, which may use up a one-time link, shows up in the signing audit trail as a visit from Pam, and
   keeps the page title (which can be the form's name). Signing domains must be on the list of addresses Pam never previews.
2. **The request log** (`what-we-keep.p11`): it records the request and not the typed text (and a test, `no-typed-text-in-urls.test.ts`, keeps typed
   words out of the address). That holds only while no Social Security field is sent to a Pam server. A test should fail the build if Pam's
   code gains an input for a Social Security number or birth date, or sends such a value anywhere.
3. **Notifications and texts**: a text or a notification must never say what a form is. The form's title can be as revealing as a conviction
   detail ("consent to release treatment records"), and the rule that a text never says why someone uses Pam or names their program is
   Pam's strongest (`never-say`). A notification can say "a form from {program}" and nothing else.

### My advice on the safest design

In order of safety:
1. **Pam shows the program's own DocuSign link** (opens DocuSign's page; no integration). Pam is a messenger, as it already is for a Google Docs
   link (`what-we-keep.p5`). Privacy changes by one sentence. Nothing sensitive can reach Pam.
2. **DocuSign signing shown inside Pam, on the program's own account, with the narrowest access.** Pam creates the signing session and shows
   DocuSign's page; the typing happens on DocuSign's page; Pam learns only the status.
3. **Filling and signing inside Pam with no DocuSign and no copy kept.** Possible, but the Social Security number is then in Pam's own code on the
   member's device. It never needs to touch a server, but it also cannot be proved (see section 2), and Pam would be building the part of a
   signing product that is hardest to get right. I would not choose it for Social Security numbers without a lawyer's and a security
   reviewer's yes.
4. **Never:** a Pam-held profile of the member's number or birth date to fill forms from, a Pam-owned DocuSign account that keeps the completed
   forms, a server-side filler that receives the values, a log or tracker that sees the form's page.

## 2. E-signatures (ESIGN and the Pennsylvania Electronic Transactions Act)

### What the law says a signature needs

- **ESIGN**, 15 U.S.C. § 7001 and § 7006 **[checked]**: a signature or record may not be denied legal effect only because it is electronic. An
  electronic signature is an electronic sound, symbol or process attached to or logically associated with a record and **executed or adopted
  with the intent to sign** **[checked]**. Where a law requires information to be given to a consumer in writing, the consumer must **consent
  affirmatively**, after a statement of the hardware and software needed, in a way that shows they can open the electronic form, and may
  withdraw **[checked]**. A contract is not invalid only because that consent step was missed, but the consent is what protects the sender
  **[checked]**. Records must be kept in a form that is accurate and can be reproduced for the period the law requires (§ 7001(d)) **[not
  checked; read the text]**.
- **Pennsylvania's Electronic Transactions Act**, 73 P.S. § 2260.101 et seq. (the state's version of the Uniform Electronic Transactions Act)
  **[checked]**. It applies where the parties have agreed to transact electronically, and treats an electronic signature or record as
  equal to ink and paper. It lets Commonwealth agencies set their own rules for their own use (Management Directive 210.12 and the Office of
  Administration's electronic signature policy) **[checked]**. Attribution (a signature is the signer's act, shown in any way including a
  security procedure) and record retention are in the uniform act's sections 9 and 12 **[not checked here]**.
- **Exceptions and the program's own rules.** Both laws exclude wills, family law, court orders and some notices, and a **government agency or
  funder can require a particular kind of signature for its own forms** (some require ink, a particular vendor, or a certificate of the
  signing). Whether a DocuSign signature satisfies a given program's form depends on the form's recipient, not on Pam. **Pam cannot
  promise legal validity; it can only promise to be a good place to sign.** That is a Terms sentence.

### What a valid signature made by Pam itself would need

1. **Consent to sign electronically**, shown and agreed before the first form, with a paper alternative and a way to withdraw (the ESIGN
   disclosure; DocuSign shows its own).
2. **Intent**: a plain button that says "Sign", after the person has seen the whole document, so the act cannot be mistaken for something else.
3. **The signature attached to the record it signs**: the same version shown is the version signed (Pam's policies already never change once signable: D-485).
4. **Attribution**: that the person signing is the person named. Pam has a phone and a sign-in code; a program's form may need more.
5. **A record that can be reproduced**: the signed document, and the evidence (who, when, from where, after what consent and what version).
6. **A copy to the signer.**
7. **The right retention**: for as long as the law or the funder requires, kept by someone.

### Can "store nothing" meet that?

**For the data, yes; for the proof, only if someone else keeps it.** The law does not need *Pam* to keep the record. It needs *the parties* to be able to
show one. If Pam builds the signing, fills the form on the device, and sends the signed copy to the program (by the program's email or by the
member's share sheet) and deletes everything, then:
- the program holds the record (good, it has a duty to), but
- the evidence of consent, intent and attribution is gone (Pam kept none), and only the PDF with a drawn mark remains. That is the weak
  position a dispute begins from ("I never signed that"), and Pam, as the maker of the tool, would be asked.
- **A middle path that stores no content:** a *signing receipt* Pam keeps: the program, the form's name or id, the version, the time, the
  member's account id, the consent version, and a keyed hash (HMAC with a secret) of the final PDF. The receipt holds no number or date; the
  keyed hash lets the program or Pam show later that a given file is the one signed and has not been altered, without the hash being a way to
  guess the contents (a plain hash of a form where only the Social Security number is unknown could be guessed, which is why it must be keyed).
  A lawyer should confirm this is enough for the funders who matter.

DocuSign's own **certificate of completion and audit trail**, held in the account that sent the form, is exactly this evidence, held by the
program's vendor and not by Pam. That is the strongest reason to prefer DocuSign for these forms.

### What D-485 says, and what would change

D-485 (card a25, 10 October) decided that a member's signature on a program's policy is a picture kept privately with their account, shown
only to them, with the program seeing the first name and the date; that the policy never changes once signable; and that a lawyer reads
the sentence about what a signature in Pam means ("a record that you read and agreed", not a legal signature) before launch
(`docs/before-launch.md`). `privacy.s.what-we-keep.p8` says what Pam keeps. **That sentence should stay exactly as it is for Pam's own policies.**
It becomes a legal-signature feature only if the seven items above are added: electronic-consent step, a clear intent button, attribution,
a copy to the signer, a retention rule and a record. That is a product, a Terms section and a lawyer's yes, not a wording change. The lawyer
who reads D-485's sentence should read this note at the same time.

## 3. DocuSign inside Pam

### What Pam is

- **Not a "controller" in the European sense; US law has no single such word.** What matters is who decides why the data is collected (the
  program, for its forms), who holds it (DocuSign, for the program), and who is on the hook if it leaks (whoever "maintains" it).
- **If the program's own DocuSign account sends the form:** the program owns the forms and their data; DocuSign is the program's vendor (it
  has its own data agreement with the program); **Pam is the program's integration and agent**: it creates the signing session and shows
  the page. For the form data Pam is a *service provider that never receives the content*. For its own small record (which form, which
  program, signed or not, when) Pam is the owner. A short written agreement with each program should say: Pam never reads, copies or keeps
  the contents; uses the access only to create and show signing sessions and to read status; deletes its access on request; tells the
  program if its credentials are exposed.
- **If Pam's own DocuSign account sends the form on a program's behalf:** Pam is the account holder and the data owner, DocuSign is *Pam's*
  vendor, and **the completed forms, with every Social Security number, sit in Pam's account** until Pam deletes them. That is Pam storing
  them. Avoid it.
- **"Conduit"** is the wrong word. In embedded signing Pam does not carry the data (the member's browser talks to DocuSign directly), so Pam is
  a *launcher* of someone else's page. If Pam's server received and forwarded the values, it would be a conduit in the weak sense that the
  health-privacy rules do not protect (see section 1).

### What the embedding itself needs, to be checked by Iris and a lawyer

- Embedded signing works by Pam asking DocuSign for a one-time **recipient view** link for a recipient Pam marks as embedded (the recipient's
  `clientUserId`), then showing that link. **Authenticating the person is the integrating app's job** **[one source]**: Pam's sign-in code
  would be the authentication, and the program should know that is all it is.
- **Least privilege.** Pam gets an access token to the program's account. A token that can read completed documents is a key to every Social
  Security number in that account, and holding it makes Pam a place a breach could happen even if Pam stores no form. Ask for the smallest
  scope that can create an envelope and read its status, never one that downloads documents; keep the token in a secret store, never in a
  log, and rotate it.
- **DocuSign Connect** (its status webhook) can be set to include the documents and recipient data; documents are opt-in **[one source]**.
  Pam's webhook must be configured to send **status only**, and its signature must be checked.
- **Frame rules.** The page can only be shown inside Pam if DocuSign allows it from Pam's address, and Pam's own content-security rule must
  list DocuSign's address (the host guard in `third-party-hosts.test.ts` is the place to pin it, with a Privacy key).
- **Plans.** Some DocuSign plans do not include API access **[not checked]**; a program that "already uses DocuSign" may not be able to
  connect Pam.

### Privacy and Terms for this route (what each would need to say)

Privacy, in plain words, would need to say:
- forms from a program are signed in DocuSign, and what a person types into them goes to DocuSign and the program, **not to Pam**;
- Pam does not see it and does not keep a copy;
- what Pam does keep: that the person signed that form for that program, and when;
- the program decides what its form asks, and keeps what is signed; a person asks the program for a copy;
- DocuSign is one of "the companies that run Pam" in a narrow sense (a new line in `sharing`), and has its own privacy notice;
- a text or notification about a form never says what the form is.

Terms would need to say: Pam is not a party to the form; the program is responsible for what its form asks and says and for whether an
electronic signature is accepted; Pam cannot promise a signature's legal effect; a person may ask for paper; Pam is not a place to keep
records, so people should ask the program for their copies.

## 4. The questions Will has to answer, and Privacy lines per route (drafts, not for signing)

### Questions for Will

1. **Which route?** (A) Pam only shows the program's DocuSign link; (B) DocuSign shown inside Pam, on the program's own account; (C) Pam fills
   and signs with no DocuSign. *My advice: A now, B when Iris's research shows it works for the programs and the numbers; C only with a lawyer.*
2. **Whose DocuSign account sends the form?** The program's (advised) or Pam's. *If Pam's, it must delete completed forms on a schedule, and
   "Pam does not keep" is false for as long as they are there.*
3. **What is the promise?** "Pam never sees what you type" (advised: the design can make it true) or "Pam does not keep what you type" (true
   only if every log, backup and vendor is clean; a promise Pam would have to prove).
4. **Is a receipt allowed?** Pam keeps that a form was signed (which program, which form, when, the version) and nothing that was typed. *Advised: yes.*
5. **What may a program see in Pam about a form?** (Advised: signed or not, when; the signed form itself lives in the program's account.)
6. **What may the words around a form say?** A form's title can be revealing. *Advised: Pam shows the program's name and "a form", never the title, in
   any text or notification.* Also: if a form itself contains words Pam forbids in its own screens ("inmate", a conviction), is a program's own
   document allowed inside Pam? (Pam's rule is about what Pam says; the form is the program's. Will should decide on purpose.)
7. **How long a sitting, and what happens at the end?** A short inactivity limit is safer; 100 forms need patience. Will chooses the limit and
   whether the member can pause.
8. **Is anyone required to use it?** Pam must never *require* a Social Security number to use Pam; only a program's form may ask, and a program
   decides whether a paper form is accepted instead.
9. **Who reads this?** A Pennsylvania lawyer, in the same sitting as D-485's sentence: the points in section 5.
10. **If it goes wrong:** who decides what Pam tells people and whom it calls first (the Attorney General above 500 residents; the program;
    the member by text), and is there cyber insurance? Pam needs a written one-page incident plan before any number could reach it, and
    even in the safest design for the credentials Pam holds.

### Privacy lines each route would need (Sage edits first; Will signs; I translate)

*Placement is only a suggestion; all of them are drafts.*

**Route A: Pam shows the program's link** (one line, beside `what-we-keep.p5`):
> A link to sign a form opens in DocuSign. What you type there goes to DocuSign and the program, not to Pam. Pam does not see it or keep a copy.

**Route B: DocuSign inside Pam** (A's line plus these):
> **What we keep:** When you sign a form from a program in Pam, DocuSign shows you the form and the program gets what you sign. Pam does not see what you type and does not keep a copy. Pam keeps only that you signed the form, which program it was for, and when.
>
> **What a text will never say:** A text or a notice about a form never says what the form is.
>
> **Who else gets your information:** DocuSign runs the signing for the program. What it keeps is up to the program and DocuSign. Ask the program for a copy of anything you signed.
>
> **What we will never do** (new, in the promise section): Pam will never ask for your Social Security number, and will never keep one. A program's form may ask for it, and you type it into the signing page, not into Pam.

**Route C: Pam fills and signs** (if it is ever chosen; each sentence must be true of the final design):
> When you fill in a program's form in Pam, what you type stays on your phone until you sign. Pam sends the signed form to the program and keeps no copy. [or, if a receipt is kept: Pam keeps a code that shows which form you signed and when, and nothing you typed.]
>
> When you sign, you agree that your signature on your phone counts as your signature on paper, as far as the program accepts it. You can ask the program for a paper form instead.

**The transparency screen and `who-can-see`** (any route): a line such as "Your guide cannot see what you type in a form," and `form_contents` added to `ADMIN_CANNOT_SEE`.

**Terms (any route):** the sentences listed at the end of section 3.

## 5. What to ask a Pennsylvania lawyer

- Does BPINA reach Pam in Route B (credentials to a program's DocuSign account, no content), and in Route C (values in the member's browser)?
- The vendor-notice and credit-monitoring provisions as they stand after the 2024 amendment, and the Attorney General's current guidance.
- Act 60 of 2006: does anything in Pam's design "require" the number, and is a program's form a "requirement" attributable to Pam?
- Is a DocuSign signature, embedded in an app Pam runs, enough for the funders who matter (the state agencies and housing and benefits programs these programs serve)?
- Is the signing receipt (a keyed hash and a record) enough evidence if Pam never holds the document?
- D-485's sentence ("a record that you read and agreed") and the upload disclaimer, as already planned.
- Do any programs' forms make Pam a business associate (HIPAA) or touch 42 CFR Part 2 records, and does the "launcher, never receives the content" design keep Pam out?
- A short data agreement with each program, and DocuSign's own terms for an integrator.

## 6. What I would build into the design (for Iris and the lanes, not decided)

- A test that fails if Pam's code (the app, the functions) has a field named for a Social Security number or birth date, or sends such a value to any address.
- A `frame-src` and host-guard entry for DocuSign's addresses (the demo and the live hosts, to be confirmed by Iris), with the Privacy key that points at the new line.
- Signing addresses on the never-preview list (`what-we-keep.p6`).
- DocuSign Connect set to status only; the signature on each delivery checked; tokens held as secrets and rotated; the narrowest scope.
- No analytics, error tracker or session recorder on any page that shows a form (`docs/before-launch.md` already says to read p11 before adding one).
- Notification wording: "a form from {program}", never the title.
- An end-of-sitting step that clears anything held in memory and says so.

## Sources

Statutes and summaries I read (not all primary; see the tags above). The statute sites could not be fetched from this session, so the text itself
was not read:
- Pennsylvania Attorney General, [Breach of Personal Information Notification Act](https://www.attorneygeneral.gov/?p=8394), and [a second page](https://www.attorneygeneral.gov/?p=30144)
- Eckert Seamans, [Pennsylvania Amends its Breach of Personal Information Notification Act](https://www.eckertseamans.com/legal-updates/pennsylvania-amends-its-breach-of-personal-information-notification-act)
- Blank Rome, [Executive summary of Pennsylvania's Breach of Personal Information Notification Act](https://www.bipc.com/executive-summary-of-pennsylvanias-breach-of-personal-information-notification-act)
- McDonald Hopkins, [Pennsylvania's amended breach notification law now in effect](https://mcdonaldhopkins.com/insights/news/pennsylvania-amended-breach-notification-law-in-effect)
- Perkins Coie, [Security breach notification chart: Pennsylvania](https://perkinscoie.com/insights/publication/security-breach-notification-chart-pennsylvania)
- Pennsylvania General Assembly, [Act 60 of 2006](https://www.legis.state.pa.us/WU01/LI/LI/US/HTM/2006/0/0060..HTM); [Knobbe summary](https://www.knobbe.com/sites/default/files/2021-04/Pennsylvania201204.pdf)
- Lex Mundi, [Pennsylvania data privacy guide](https://www.lexmundi.com/guides/global-data-privacy-guide/jurisdictions/united-states/usa-pennsylvania)
- ESIGN, [15 U.S.C. § 7001 on govinfo](https://www.govinfo.gov/content/pkg/USCODE-2019-title15/html/USCODE-2019-title15-chap96-subchapI-sec7001.htm); [Federal Reserve's Consumer Compliance Outlook on the consent steps](https://consumercomplianceoutlook.org/2009/fourth-quarter/q4_02)
- Pennsylvania Office of Administration, [electronic signature policy](https://www.pa.gov/content/dam/copapwp-pagov/en/oa/documents/policies/it-policies/electronic%20signature%20policy.pdf) and [Management Directive 210.12](https://www.oa.pa.gov:443/Policies/md/Documents/210_12.pdf)
- HHS guidance on HIPAA and cloud computing, as summarised by [ClearDATA](https://cleardata.com/?p=5794) and [Paubox](https://www.paubox.com/blog/the-problem-with-zero-knowledge-cloud-storage-and-presumed-compliance)
- DocuSign: [recipient view and `clientUserId`](https://developers.qodex.ai/plaid-com/docusign-esignature-rest-api-7/envelopes-13/returns-a-url-to-the-recipient-view-ui-10); [Connect payload options](https://hookdeck.com/webhooks/platforms/guide-to-docusign-webhooks-features-and-best-practices); [data labels and population scope (community answers; confirm in DocuSign's own documentation)](https://community.docusign.com/esignature-api-63/can-t-get-pre-filled-field-values-to-replicate-across-documents-via-the-api-5363)

Inside Pam: `docs/decisions/D-485-…`, `packages/config/src/transparency.ts`, `privacy.s.what-we-keep.p5`, `p6`, `p8`, `p11`, `privacy.s.never-say`,
`privacy.s.sharing`, `packages/config/test/third-party-hosts.test.ts`, `docs/before-launch.md`.
