# DocuSign sandbox: test plan for the signing pages (14 October 2026)

Iris, User Research & Testing Lead. Mira, 05:32 UTC (card a88): Will is making his own
DocuSign developer (demo) account. Piper runs the API side; I check the signing pages. **Nothing
runs until Mira says consent is done.**

This plan answers the open questions in
[the forms research](2026-10-14-forms-and-docusign.md#to-confirm-before-building).

## Rules for the spike

- **Accounts:** I make no account and sign in to nothing. The demo account is Will's.
- **Data:** only made-up people and made-up forms go into DocuSign's demo. No member data.
  - Name "Test Member Ana", email on a non-delivering test address Piper picks.
  - SSN `000-00-0000`. That's an invalid number by design, so it can't be anyone's.
  - Birth date 1 Jan 1990.
- **Sending:** nothing is sent to a real person.
- **The live app** isn't touched.

## A blocker to clear first: my network

**This environment's network policy blocks DocuSign.** It refused every DocuSign host during the
research. To open the signing pages, Will would add DocuSign's demo hosts under the
environment's **Network access**, in its settings → **Allowed domains**. Piper should confirm
the exact list from the first recipient-view URL; it's likely to include:

- `demo.docusign.net`
- `apps-d.docusign.com`
- `account-d.docusign.com`
- DocuSign's asset host(s), such as `docucdn-a.akamaihd.net`

Steps: https://code.claude.com/docs/en/cloud-environments#network-access

**Without that, I can't run anything below**, and I won't fill the gap with made-up results. In
that case Piper runs my Playwright scripts in his session and sends me the output and
screenshots.

## How a signing link reaches me

A recipient-view link lasts **five minutes and works once**. So Piper can't send me links in a
message. Two ways:

1. **Piper's spike has a "mint" step.** A small local page or script creates the recipient
   view the moment I open it, then redirects. The DocuSign credentials stay in Piper's
   environment; I only ever see the one-time URL.
2. **Piper runs my scripts** (`scratchpad/docusign-*.mjs`, which I'll hand over as files), and
   sends back the results and shots.

I only ever handle the one-time signing URL, never a token or key.

## The test forms (Piper makes them)

Five made-up PDFs, each with DocuSign tabs:

| Form | Tabs |
|---|---|
| F1 "Intake" | Full name, Initials, Date of birth, **SSN**, Date signed, Signature |
| F2 "Release of information" | Full name, Initials ×3, Date signed, Signature |
| F3 "Program rules" | Full name, Initials ×5, Signature |
| F4 "Emergency contact" | Full name, a contact name, a phone (made up), Date signed, Signature |
| F5 "Photo consent" | Full name, a checkbox, Signature |

**Shared labels:** where a tab means the same thing in every form, it gets the same
`tabLabel` in every form: `fullName`, `initials`, `dob`, `ssn`. That's what question 2 tests.

**Envelopes:**
- **E1:** F1–F5 in one envelope.
- **E100:** 100 documents, F1–F5 repeated 20 times.
- **E-ar:** E1 with the signer's language set to Arabic.

## Questions, and how each is answered

### Q1. Which DocuSign plan allows API embedded signing? (Piper)

- **Demo account:** creating an envelope with a `clientUserId` recipient and getting a
  recipient view works or doesn't.
- **Production plan tier:** the demo account says nothing about it. Piper looks on the
  account's plan page and in DocuSign's plan comparison, both now reachable from his session if
  the hosts are open, and records the tier and its wording.
- **Pass:** the plan tier and its exact wording are written down.

### Q2. Do details carry across forms in one envelope? (me)

- In E1, type the name, initials, birth date and SSN **once**, in F1.
- **Pass:** F2–F5 show them already filled, or filled when reached, without retyping.
- **Record:**
  - which tab types carry across (text, initials, date, signature, checkbox);
  - whether initials and the signature are adopted once for all forms;
  - how many taps E1 takes end to end.

### Q3. Does it fit Pam on a phone? (me)

Pam opens the signing page **full screen**, then comes back through `returnUrl`. At 390×844
and 320×568, light and dark (DocuSign's own theme):

- **Fit:** nothing wider than the screen, nothing clipped. The "Finish" / "Done" control is
  reachable and at least 44px. The keyboard doesn't cover the field being typed in.
- **Return to Pam:**
  - after Finish, the browser lands on Pam's `returnUrl` with `event=signing_complete`;
  - after "Finish later" or Close, it lands with `event=cancel`;
  - after Decline, it lands with `event=decline`;
  - what happens with the browser's Back button in the middle of signing.
- **The iframe, for the record only:** E1 in focused view inside a 390×844 iframe, on Chrome
  and on WebKit (Playwright's WebKit, as the closest to iPhone Safari).
  - I record whether it loads, scrolls and finishes.
  - This is to confirm the advice to use full screen, not to build it.

### Q4. Arabic, right to left (me)

E-ar at 320×568:
- **Language and direction:** the page language is Arabic, `dir=rtl` on the document, and the
  controls mirrored (Back and Next, the progress, the menus).
- **Text:** DocuSign's own words are in Arabic, not English with Arabic only in the form. An
  Arabic name typed into a text tab shows right to left.
- **Disclosure:** DocuSign's consumer disclosure (the "agree to use electronic records" step)
  appears in Arabic.
- **Pass:** all of the above.
- **Also record:**
  - which of Pam's seven languages DocuSign offers by name (es, pt-BR, zh-CN, zh-HK, ru, ar);
  - whether Traditional Chinese is a separate choice from Simplified.

### Q5. A screen reader (me)

On E1 at 390×844, in English and Arabic:
- **The accessibility tree** (Playwright's aria snapshot) of each step: the disclosure, each
  form, each tab, Finish.
- **Every tab has a name** that says what it is ("Date of birth", not "Text 4"). That depends on
  the tab tooltip Piper sets, so it's also a note for how programs should build forms.
- **Keyboard:** Tab reaches every field and button in order, focus is visible, and Enter or
  Space acts.
- **Signature adoption** can be done without drawing ("Adopt" with a typed style).
- **Errors:** a missing required field is announced, and focus goes to it.
- **Moving between forms** is announced (which document, n of 5).
- What I can't do here is a real VoiceOver or TalkBack pass. I'll say so in the report and ask
  Will for a 10-minute check on his own phone if the tree looks right.

### Q6. 100 documents on a phone (me)

E100 at 390×844:
- **Time:** from opening the link to the first field, and to Finish (scripted typing and
  adopting).
- **"How many are left":** whether the member can see it, and whether DocuSign says it.
- **Memory:** whether the page stays responsive (no tab crash), checked through Playwright's
  page metrics.
- **Coming back:** "Finish later" partway, then a fresh link. Does it resume where they were?
  Are the details still there?

### Q7. What Pam sees (Piper and me)

- **Connect:** the webhook Piper sets up **without** documents or tab data. The payload for E1
  is saved and checked for any field value: name, SSN, birth date. **Pass:** none appear.
- **Pam's side:** after `signing_complete`, Pam can have only the envelope id and status. I check
  Piper's spike code reads nothing else (no `documents`, no `tabs` calls).

## The report

`docs/research/2026-10-1x-docusign-sandbox.md`:
- PASS or FAIL per question;
- screenshots under `docs/research/shots/docusign-*`, made-up data only;
- what it means for card a88.

Iris
