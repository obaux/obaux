# Program forms, signing, and DocuSign (14 October 2026)

Iris, User Research & Testing Lead. Mira, 04:05 UTC, for Will's 04:03 note.

**The need.** Programs have PDF forms with fields members fill in: name, initials, birth date,
Social Security number, today's date, signatures. A member may need to sign 100 or more in one
sitting, one at a time. **Pam must not store those details.** Programs also use DocuSign. Will
wants a DocuSign integration first, ideally with DocuSign's signing shown inside Pam. The
alternative is filling and signing the PDFs inside Pam without DocuSign.

**This is desk research from public sources only.** I signed up for nothing, made no
accounts, contacted no one, and didn't touch the live app.

**Two limits on the evidence:**
- This environment's network policy blocks the vendors' own sites: developers.docusign.com,
  docusign.com, dropbox.com, boldsign.com, documenso.com, pdf-lib.js.org and ecfr.gov all
  failed to connect.
- So every fact below comes from **search results that quote those pages**, and is marked:
  - **[docs]**: DocuSign's or the vendor's own docs or blog, as quoted in the results.
  - **[forum]**: the vendor's community forum.
  - **[3rd]**: a third party. Third-party prices disagree with each other and must be checked
    on the vendor's pricing page before anyone relies on them.
  - **[known]**: my own knowledge of the product, not confirmed in this pass.

The last section lists what to confirm in a DocuSign developer (demo) account. That would need
Will's say-so, since it means making an account.

---

## 1. DocuSign embedded signing

### How it works

- **An "embedded" signer is one created with a `clientUserId`.** Pam would set it to an
  opaque id of its own. Such a recipient signs only through the app; without it, DocuSign
  emails the signer instead. [forum][docs]
- **Pam authenticates the signer.** "Authenticating the user is the responsibility of your
  app" with embedded signing. [docs] Pam's text-code sign-in would be that authentication.
- **The signing link** comes from `EnvelopeViews:createRecipient` (the "recipient view"). It
  must repeat the same name, email and `clientUserId` the envelope was created with. [docs]
  - Links work only for envelopes in "sent" status. [docs]
  - Each link **expires after 300 seconds and is single use**. Request it just before showing
    it; never store or email it. [docs][forum]
- **Coming back.** `returnUrl` brings the signer back to Pam with
  `event=signing_complete | cancel | decline`, so Pam knows what happened without reading the
  document. [docs]

### Can it show inside Pam?

- **In an iframe (including "focused view"): technically yes.**
  - `displayFormat: "focused"`, plus `frameAncestors` and `messageOrigins` in the request and
    DocuSign's JS library. [docs]
  - `frameAncestors` must be origins only, not full URLs. Getting that wrong is the usual
    cause of a blank frame on Safari and iOS. [docs]
- **But DocuSign itself discourages iframes.** It calls them "rarely needed", citing weaker
  trust for the signer, clickjacking exposure, and missing features such as identity
  verification. It recommends opening the signing URL in its own tab or window. [docs] Also:
  - On mobile, "only full-screen iframes work for signers". [docs]
  - Iframes are not supported with all authentication options. [docs]
- **Phone web views:** DocuSign supports iOS WKWebView and Android WebView, and has native
  SDKs. [docs] **Pam is a web app with no native wrapper** (`apps/web` is a Next static
  export), so the realistic phone route is a full-screen redirect in the same tab, then back
  to Pam through `returnUrl`.

**My read:** on a phone, "inside Pam" should mean Pam's screen before and after, with
DocuSign's own full-screen signing page in between. A small iframe inside a Pam screen is the
pattern DocuSign warns against, and it breaks most easily on iPhones.

### What the program's DocuSign account needs

**Pam would be an "ISV":** one app, one integration key owned by Pam, many programs each
linking their own DocuSign account. DocuSign: "ISVs should avoid requiring customers to create
or manage integration keys." [docs]

- **How a program links its account:** OAuth **Authorization Code Grant**, so it's the
  program's admin, not Pam, who logs in to DocuSign once and grants access. [docs]
  - The `extended` scope lets Pam renew refresh tokens indefinitely while the current one is
    valid. [docs]
  - All new integrations must use OAuth. [docs]
- **Why not JWT:** the JWT grant (server impersonation) needs consent from each impersonated
  user, and DocuSign says admin consent "generally can't be used by ISVs". [docs] Authorization
  Code Grant fits Pam better.
- **Go-Live:** Pam's integration key passes DocuSign's Go-Live review **once**, in the demo
  environment. Forum posts mention making about 20 API envelopes first. [forum] After that,
  each program only links its account.
- **The program's plan has to allow API sending.**
  - A DocuSign forum reply says API embedded signing is available on all plans. [forum]
  - Some third-party blogs say it's Enterprise-only. [3rd]
  - **Unresolved.** Confirm on DocuSign's developer pricing page.

### Whose account sends the envelope?

**The program's.** Pam calls the API with the program's linked token. The envelope, the
document and everything the member types live in **the program's** DocuSign account. That is
what keeps the SSN out of Pam (section 2).

If Pam sent from its own DocuSign account, every completed form, SSN included, would sit in
Pam's account. That's "storing it" in all but name.

### Can Pam open envelopes the program already sent from DocuSign?

**Not directly.** An envelope sent the usual way has an email (remote) recipient with no
`clientUserId`, and a signing link can only be made for the `clientUserId` the envelope
carries. [docs]

A forum answer says a web-app envelope can be **corrected** to add a `clientUserId`, but "the
initial recipient will always receive an email", so a placeholder address is suggested.
[forum] That's fragile and confusing for the program.

**What works cleanly:**
- The program keeps its forms as **DocuSign templates** in its own account.
- Pam creates the envelope from those templates through the API, with the member as an
  embedded recipient.
- So the program "sends through Pam", not from DocuSign's web app.

### Many forms in one sitting

There are two shapes:

- **A. One envelope holding many documents.**
  - A forum moderator says the limit is **130 documents per envelope**; a university FAQ says
    120. [forum][3rd] Size limits are around 25–50 MB per document and 200 MB per envelope;
    sources differ. [forum]
  - The member signs everything in **one** DocuSign session, document after document.
  - **It's one envelope against the plan's allowance, not a hundred.**
  - "Fill once": DocuSign fills tabs that share a label across an envelope's documents, so a
    name or birth date typed once can fill every form. [known; confirm]
- **B. One envelope per form.** Pam keeps the member's list of envelope ids. After each
  `signing_complete` it asks for a fresh recipient view (it expires in five minutes, so never
  ahead of time) and opens the next. That's 100 sessions, 100 returns to Pam and 100 envelopes
  billed.

**A fits Will's "100+ in one sitting".** B fits forms that arrive at different times.

### What it costs, and who pays

- **The program pays**, on its own DocuSign plan, because the envelopes are sent from its
  account. Pam pays nothing per envelope in this design.
- **Prices (DocuSign developer plans), from third-party pages that disagree:**
  - Starter: $50/month billed yearly, about 40 envelopes.
  - Intermediate: $300/month, about 100.
  - Advanced: $480/month (adds bulk send, PowerForms for API, signer attachments).
  - Enterprise: by quote.
  - One comparison lists $75 / $450 / $720 instead. [3rd] Check before quoting.
- With shape B, **100 forms = 100 envelopes**, which would exhaust a Starter or Intermediate
  allowance in one sitting. With shape A it's one.
- A HIPAA BAA, if a program needs one, is reported as Enterprise-only at DocuSign. [3rd]

---

## 2. What DocuSign keeps, and what Pam would touch

- **DocuSign keeps, in the program's account:**
  - the documents, everything typed into them (SSN included), the signatures and the
    certificate of completion;
  - by default, kept **indefinitely**. [docs]
  - A program admin can set an account-wide retention period, after which completed, voided
    or declined envelopes go to a 14-day purge queue and are deleted. [docs][forum]
  - Purge can remove documents only, documents and metadata, or a redacted version that also
    strips PII. [docs]
- **Pam would have to keep:**
  - the program's DocuSign link (OAuth refresh token, account id, base URL), stored
    server-side and encrypted;
  - per member and form: the **envelope id**, the program, the status (sent, completed,
    declined, voided) and the time.
- **Pam would have to pass to DocuSign:** the member's **name and an email** for the
  recipient, which DocuSign requires, plus Pam's opaque `clientUserId`.
  - The email can be a non-delivering address on Pam's domain; embedded recipients aren't
    emailed for signing. [docs]
  - The name is on the form anyway.
- **Pam never needs:** the document, the tab values, or the signing link after use. It must
  not call "get document" or "list tabs". Its DocuSign webhook (Connect) should be set up
  **without** documents or tab data, which are opt-in. [3rd, quoting DocuSign's Connect
  options] Status comes from `returnUrl` and the webhook's envelope status alone.

**Can Pam do this without ever seeing an SSN? Yes, by design.** The member types it into
DocuSign's page, which is DocuSign's own window, not a Pam field. It's stored in the program's
DocuSign account, and Pam never reads it. The one thing Pam must avoid is a "helpful"
prefill: no pushing the member's details from Pam into the form. Prefilling, if it's ever
wanted, should come from the member on DocuSign's page (fill once, section 1), not from Pam.

---

## 3. Alternatives built for embedding

| Product | Embedding | Price (check) | Free tier | Arabic | Note |
|---|---|---|---|---|---|
| **Dropbox Sign** (HelloSign) | Embedded signing in an iframe; needs the **Standard** API plan; embedded templates need Premium. [docs] | Essentials about $75/mo (50 requests); Standard about $250/mo (100). [3rd] | Test mode on a free account: watermarked, not binding. [docs] | **No Arabic** in its 22 interface languages, and **no right-to-left** in text fields (Hebrew listed without RTL). [docs] | Arabic alone rules it out for Pam. |
| **Adobe Acrobat Sign** | Embedding the signing UI is listed among API capabilities; iframe details not found. [docs] | Not published; through sales. Full API is reported to come with Enterprise. [3rd] | Free Developer Edition, test-labelled documents. [docs] | Not found. | Sales-led; heavy for small programs. |
| **BoldSign** | Embedded sign page in an iframe; locale set per request. [docs] | API from about $30/mo with 40 envelopes, then $0.75 each. [3rd] | Sandbox, watermarked, deleted after 14 days. [docs] | **No Arabic interface** for the embedded sign page; RTL only inside text fields. [docs] | Cheapest per envelope; Arabic missing. |
| **Documenso** | React/Preact SDKs and direct-template links; **does not recommend raw iframes**; embedding on Teams plan and up; embedded authoring Enterprise. [docs] | Hosted "Platform" plan about $250/mo; self-hosted Community Edition free (AGPL). [3rd][docs] | Self-hosted CE. | Not found. | Open source; Pam could self-host, but then **Pam stores the documents**, which conflicts with the rule. |

**What all of these share:** whoever's account sends the envelope holds the documents. If
Pam holds that account, Pam holds the SSNs. Only "the program's own account" keeps Pam clean,
and programs already have DocuSign.

---

## 4. The Pam-only route: fill and sign in Pam, no vendor

### Filling

- `pdf-lib` reads and writes AcroForm fields in the browser: `getForm()`, `getTextField()`,
  `setText()`, `getCheckBox()`, `getSignature()`, then `flatten()` so the result can't be
  edited. [3rd tutorials quoting pdf-lib's API; pdf-lib's site was blocked]
- Flattening draws the values into the page and removes the fields. Keep an unflattened copy
  only if the program needs the data back out. [3rd]
- **Field types are not reliable in PDFs.** A field named `Text12` could be anything. Pam
  can't safely guess "this is the SSN".
- **The workable shape:** a program lead **maps each form once** (this box is name, initials,
  birth date, SSN, today, signature) on their own screen. The map is saved with the template;
  no member data is in it.
- **On the member's phone, Pam doesn't show the PDF's tiny boxes.** It shows its own screen,
  one question at a time, in Pam's 17px type, 56px fields and seven languages. It then writes
  the answers into the PDF on the phone.
- **Fill once, apply to many:** answers are held **in the phone's memory for that sitting
  only**, never sent to Pam's server and never in storage, then applied to every mapped form
  in the batch. When the sitting ends, they're gone.

### Signing

The member draws or types a signature once. It's stamped on every signature field in the
batch, with a separate "Sign all N" confirmation, not a silent auto-apply.

### Where the signed PDF goes, if Pam stores nothing

The PDF holds the SSN. Three routes:

1. **Encrypted hand-off through Pam.**
   - The phone encrypts the PDF with the **program's public key** before uploading.
   - Pam's server holds only ciphertext it cannot read, and deletes it as soon as the
     program's device downloads and decrypts it.
   - Honest wording: Pam *carries* a sealed envelope briefly but can't open it.
   - Biggest build: key handling on the program's side.
2. **Straight to the program's own storage.** The program gives Pam an upload address in its
   own system (for example a pre-signed upload link). The phone sends the PDF there directly,
   and Pam's server never touches it. This only works for programs that have such a system.
3. **The member sends it themselves**, using the phone's share sheet (Web Share with files)
   into email or another app. Pam touches nothing, but it puts the burden on exactly the
   people Pam is meant to make this easy for. Not recommended.

### What the law asks for (ESIGN, UETA)

This is a summary, not legal advice; programs and Will need counsel before relying on it.

- **Consent to do it electronically.**
  - Where a law requires information be given to a consumer *in writing*, ESIGN §7001(c)
    needs affirmative consent after a clear disclosure (paper copy, right to withdraw), and a
    demonstration the person can open the format. [3rd summaries of the statute]
  - DocuSign shows its own consumer disclosure; on the Pam-only route Pam would have to.
- **Intent.** A clear act of signing ("Sign", "Sign all 12"), not a side effect.
- **Attribution (UETA §9).** The signature is the person's if it was their act, which "may be
  shown in any manner, including … any security procedure". [text quoted in results] Pam's
  text-code sign-in is that procedure, **but showing it later needs a record linking this
  person, this document and this time.**
- **Retention (UETA §12, ESIGN §7001(d)).** Where a law requires a record be kept, an
  electronic copy that accurately reflects it and stays accessible satisfies that.
  [results quoting the text] The **program** keeping the signed PDF meets this; Pam doesn't
  have to.

**Where "store nothing" bites:** attribution. To prove later who signed what, *someone* must
keep an audit record, and on the Pam-only route that someone is Pam. It can be minimal and
hold no form contents:
- member id, program, form template and version;
- time;
- a **hash of the signed PDF**;
- the fact that the sign-in code was verified.

That's the same kind of record Pam already keeps for program rules (Privacy
`what-we-keep.p8`, D-485). With DocuSign, DocuSign's certificate of completion is that record,
in the program's account.

---

## 5. Accessibility on a small phone, with a screen reader, in seven languages

- **DocuSign:**
  - Signing claims WCAG 2.0 AA in one university's summary, and "strives for" 2.1 AA in its
    forum. Blogs say it partially meets 2.1 AA per its VPAT. [3rd][forum]
  - Screen readers and keyboard are supported. [docs]
  - **43 signing languages including Arabic**, set by the browser or by the sender. [3rd]
    DocuSign shows how to set the display language for embedded signing. [docs]
  - **Right-to-left layout in Arabic: not confirmed.** It needs a hands-on check.
  - On a phone, DocuSign's own full-screen page is its "responsive signing"; how well it
    handles 100+ documents on a 320px screen needs a hands-on check.
- **Dropbox Sign:** no Arabic, no RTL. **Fails Pam's seven languages.** [docs]
- **BoldSign:** no Arabic interface on the embedded sign page. **Fails.** [docs]
- **Adobe, Documenso:** not established in this pass.
- **Pam-only route:** the only route where **Pam controls everything**: its own screens, the
  seven languages, Arabic RTL, 48px targets, screen-reader names, the same checks I run on
  every batch. The PDF itself never has to be read on the phone. The member answers Pam's
  questions; the PDF is written behind the scenes. Its weak spot is the program side (mapping
  each form once), not the member side.

---

## 6. Recommendation

**First, DocuSign, through each program's own account, signing in DocuSign's full-screen
page, many forms in one envelope.**

- **What the program does:**
  - Links its DocuSign once (its admin logs in; Authorization Code Grant).
  - Keeps its forms as templates.
  - Picks the forms for a member in Pam.
- **What Pam does:**
  - Creates **one envelope with all of them** from those templates, with the member as an
    embedded signer.
  - Opens DocuSign's signing page full screen and gets the member back with "Done".
  - Keeps only the envelope id and status.
- **What the member does:** types each detail once (if shared labels work, see below), signs,
  and is back in Pam.

**Why this first:**
- It's what Will asked for, and programs already have DocuSign.
- **Pam never sees an SSN**, and it costs Pam nothing per envelope.
- DocuSign already has a legal record, Arabic, and a mature signing page.

**What it costs the member:**
- Leaving Pam's look for DocuSign's during signing.
- DocuSign's accessibility and Arabic layout are **not ours to fix**.
- On iPhone, a small embedded frame is the fragile path, so it should be full screen.

**What it costs the program:** a DocuSign plan that allows API sending (which tier is
unconfirmed), and moving from "send from DocuSign" to "send through Pam" for these forms.

**Second, for programs without DocuSign: the Pam-only route, later, and only with:**
- a lawyer's read on consent and attribution;
- the program-side mapping screen;
- a delivery route that leaves Pam unable to read the PDF: encrypted hand-off, or straight to
  the program's storage;
- a minimal audit record that Will signs off as the one thing Pam keeps.

It's the better *member* experience (Pam's screens, all seven languages, one question at a
time), but the bigger build and the bigger legal surface.

**Not recommended as Pam's own vendor:** Dropbox Sign or BoldSign (no Arabic), or a
self-hosted Documenso (Pam would then hold the documents).

### To confirm before building

These need a DocuSign developer (demo) account, which needs Will's say-so:

1. Which DocuSign plan tier allows **API embedded signing** (forum says all; blogs say
   Enterprise).
2. That **tabs sharing a label fill across all documents** in one envelope, for fill once.
3. The **Arabic signing page right to left**, on a 320×568 phone, with VoiceOver and
   TalkBack.
4. What a 100-document envelope is like to sign on a phone: load time, scrolling, and how
   the member knows how many are left.
5. That an embedded recipient with a non-delivering email address is never emailed, and that
   DocuSign's consumer disclosure shows in the member's language.
6. That **Connect without documents or tab data** really carries no field values, and that
   the program's retention or purge setting suits it.

---

## Sources

DocuSign:
- Embedded signing (developers.docusign.com/docs/esign-rest-api/esign101/concepts/embedding/embedded-signing/), quoted in search results
- New browser security settings and iframes: https://www.docusign.com/blog/developers/new-browser-security-settings-and-iframes
- Focused View, Safari, iOS Oh My!: https://www.docusign.com/blog/focused-view-safari-ios-oh-my
- 15 minutes to better UX, focused view: https://www.docusign.com/blog/developers/15-minutes-to-better-ux-enhancing-embedded-signing-focused-view
- Embedded signing examples: https://docusign.github.io/app-examples/embedded-signing/
- OAuth JWT, granting consent: https://www.docusign.com/blog/developers/oauth-jwt-granting-consent
- ISV connector implementation plan: https://developers.docusign.com/partner/isv-connector-implementation/
- Public Authorization Code Grant: https://developers.docusign.com/platform/auth/public-authcode-get-token/
- Developer FAQ, integration keys and Go-Live: https://docusign.my.site.com/partner/s/article/DocuSign-Developer-FAQs-Integration-Keys-and-Go-Live
- Purging envelopes: https://www.docusign.com/blog/common-api-tasks-purging-envelopes-your-docusign-account
- Change the display language in embedded signing: https://www.docusign.com/blog/developers/common-api-tasks-change-the-display-language-embedded-signing
- System requirements for signing: https://support.docusign.com/s/document-item?bundleId=yca1573855023892&topicId=thx1573854978578.html
- Developer plans: https://ecom.docusign.com/plans-and-pricing/developer

DocuSign community forum:
- https://community.docusign.com/esignature-111/embedded-signing-plan-22694
- https://community.docusign.com/esignature-api-63/embedded-signing-client-userid-for-docusign-webapp-22413
- https://community.docusign.com/go-live-70/go-live-review-failed-22469
- https://community.docusign.com/esignature-api-63/docusign-envelope-file-size-limitations-for-rest-api-and-power-automate-27664
- https://community.docusign.com/esignature-111/document-retention-policy-3257
- https://community.docusign.com/esignature-111/using-docusign-with-a-screen-reader-5024

Other vendors:
- Dropbox Sign API pricing: https://help.dropbox.com/plans/how-much-does-the-dropbox-sign-api-cost
- Dropbox Sign API overview: https://developers.hellosign.com/docs/overview.md
- Dropbox Sign supported languages: https://help.dropbox.com/view-edit/supported-languages-text-fields-dropbox-sign
- Force a signer page language: https://help.dropbox.com/integrations/force-foreign-language-on-signer-page
- Acrobat Sign developer guide: https://developer.adobe.com/acrobat-sign/docs/overview/developer_guide/
- BoldSign pricing: https://boldsign.com/pricing
- BoldSign embedded sign page language: https://developers.boldsign.com/how-to-guides/set-language-for-emedded-sign-page/
- BoldSign right-to-left fields: https://support.boldsign.com/kb/article/13253/align-text-in-the-form-fields-from-right-to-left
- Documenso embedding: https://docs.documenso.com/developers/embedding
- Documenso iframe: https://docs.documenso.com/docs/developers/embedding/iframe
- Documenso self-hosted: https://documenso.com/self-hosted
- Documenso pricing: https://documenso.com/pricing

PDF and law:
- pdf-lib on npm: https://npmjs.com/pdf-lib
- Flattening with pdf-lib: https://dev.to/sunshey/how-to-flatten-pdf-forms-and-annotations-in-the-browser-with-vue-3-and-pdf-lib-1mo3
- ESIGN Act guide (NCUA): https://ncua.gov/regulation-supervision/manuals-guides/federal-consumer-financial-protection-guide/compliance-management/deposit-regulations/electronic-signatures-global-and-national-commerce-act-e-sign-act
- ESIGN consumer disclosures (DLA Piper): https://www.dlapiper.com/en/insights/publications/2024/06/esign-consumer-disclosures-must-be-provided-and-consent-obtained-to-meet-tcpa
- UETA official text (1999): https://scs.nevada.edu/wp-content/uploads/2020/07/FED_Act99.pdf
- UETA overview: https://en.wikipedia.org/wiki/Uniform_Electronic_Transactions_Act

Third-party price comparisons (check each figure with the vendor):
- https://signeasy.com/blog/business/docusign-api-pricing
- https://firma.dev/insights/docusign-api-pricing-limitations-alternatives
- https://pricingsaas.com/companies/docusign?page=api
- https://verdocs.com/blog/boldsign-pricing
- https://toolradar.com/tools/documenso/pricing
- https://casrai.org/guides/hipaa-compliant-esignature

Iris
