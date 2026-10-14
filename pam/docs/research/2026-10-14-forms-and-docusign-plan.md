# Program forms: DocuSign, or filling PDFs inside Pam — how it meets what exists

**By** Piper (Places & programs) · **For** Will's 04:03 note, 14 October 2026, relayed by the merge desk · **Status:** plan only, nothing built, no code on this branch.
Iris is researching the tech, Lena the law, Dot the screens. Facts about DocuSign below are from memory and marked **(Iris to confirm)**.

Will: "reimagine how we offer policies, both from the program lead with a DocuSign integration and for the member who's signing forms." Programs have PDF forms with fields (name, initials, birth date, Social Security number, today's date, signatures, other information). A member may sign 100+ in one sitting. **Pam must not store those details.**

## 1. What exists today (D-485, D-489, D-313)

- `program_policies` (a program's policy: title, version, `replaces_id`, archived, never edited) and `program_policy_files` (up to 5 PDFs or photos, 10 MB each, in the private `policies` bucket). `program_policy_services` limits a policy to some of a program's services (D-313). Written only by `add_policy`, `archive_policy`, `set_policy_services`.
- A member reads the files and signs: `sign_policy` writes `policy_signatures` (policy, member, `signed_at`, **`image`, a PNG of the signature, NOT NULL**). The member's reusable picture is `member_signatures`. Both are private to the member (D-485 point 1). A program sees a **first name and a date** through `program_policy_signers`; the picture never leaves.
- The copy says the signature is "a record that you read and agreed", not a legal signature. A lawyer reads it before launch (`before-launch.md`).
- A booking is never stopped by an unsigned policy; Pam only reminds (D-485 point 6). Trips shows "Policies to sign" and "signed of total" (D-270); the place screen and Profile reach the same list.
- Lead side: `PoliciesView` (add by uploading files, archive, who signed), per-service scoping in `ServiceEditView`.
- **The conflict with Will's new rule:** today Pam *does* store a drawn signature picture for every policy a member signs. Will's list of what Pam must not store includes "signatures". See question 3.

## 2. The two routes

| | A. DocuSign, shown inside Pam | B. Fill and sign PDFs inside Pam |
|---|---|---|
| Where the member types SSN, birth date | In DocuSign's signing page. **Pam's servers never see the values.** | In Pam's page on the phone. Pam's code holds them in memory. |
| Who keeps the filled, signed form | DocuSign, until it is delivered and purged; the program gets its copy | Nobody, unless Pam adds a hand-off (see below) |
| Placing fields on a flat PDF | DocuSign's tagging editor, embedded in Pam, once per form | Pam must build a field-placement editor, or accept only fillable (AcroForm) PDFs |
| Legal weight | Audit trail and certificate of completion (Lena to confirm what they give for ESIGN/UETA) | A picture pasted into a PDF; no certificate; Lena to say whether that is enough |
| 100+ forms in one sitting | One envelope holds many documents and the signer adopts a signature and initials once; same-named fields can be shared across documents **(Iris to confirm limits, about 50 documents an envelope)** | Fully ours: one "form kit" fills every form on the phone |
| Cost and gates | Account, per-envelope cost, DocuSign's go-live review before production | Engineering only; a PDF library and a lot of screens |
| New outside company in Privacy | DocuSign (server and loaded): Privacy line, host table, Will signs | None |

**B and "must not store":** to reach the program, the filled PDF has to leave the phone. The only way that keeps the promise is end-to-end: the member's phone encrypts to a key the program's lead holds, Pam keeps ciphertext for days and cannot read it. That means key pairs for leads, recovery when a lead loses a phone, and more than one staff member per program. It is buildable, but it is the larger project and the harder promise to explain.

**Recommendation: A first, as Will said, with the form hand-off hidden behind a small provider interface** so B (or a program's own DocuSign account) can plug in later without touching the member or lead screens.

## 3. Route A, as the user sees it

**A program lead (Programs → a program → Policies)**
1. "Add" now asks: *a document to read* (today's flow) or *a form to sign*.
2. For a form they upload the blank PDF, then DocuSign's field editor opens inside Pam: they mark where the member signs, initials, dates, and the typed fields (name, birth date, SSN, other). They name who signs (the member; optionally the program countersigns). Done → the form is "Ready".
3. Same screen after: who has completed it (first name and date, as now), archive, "only for these services" (D-313), a new version replaces the old and the old completions stay (D-485 point 3). The blank form can still be attached as a preview, as members asked to preview ahead (D-271).
4. Completed forms reach the program as DocuSign delivers them to the lead's email (a recipient on the envelope); Pam shows "completed 12 October" and nothing else.

**A member (visit and Trips flow)**
- Trips and the place screen: "Forms to sign (3)" next to the policies, never blocking a booking.
- Each form row says what it needs in plain words ("Name, birth date, signature · about 5 minutes") and, before anything opens, one sentence: *Pam does not see or keep what you type.* (New copy: Sage signs, Lena translates, Privacy line for Will.)
- Tap → a full-screen signing page, with a round back; DocuSign's own page is framed, or on a phone redirected and returned **(Iris: framing on iOS Safari is unreliable; redirect-and-return may be the real answer)**. On return Pam asks DocuSign for the truth rather than trusting the address, then shows "Done".
- Many forms: "Sign all (7)" opens one envelope per program, so the member adopts a signature once per program, not per form, and a list shows progress across programs ("3 of 7 programs done"). The link to DocuSign is single-use and short-lived, so "Continue" always asks for a fresh one; an interrupted sitting resumes.
- Pam's own signature picture is **never** sent to DocuSign and nothing from `member_signatures` is read.
- A case manager sitting beside a member: the session is the member's own, on whatever phone is in hand; nothing is kept on the phone afterwards. Dot to design; Will to say if a case manager may drive.

## 4. What happens to today's policies

**Kept, and forms fold in as a second kind.** "Read and agree" house rules are a different job from a legal form and stay as they are. A form is a `program_policies` row with `kind = 'form'`, so versioning, service scoping, Trips counts, the verified tick, reminders and the lead's lists all work unchanged. Nothing is replaced. The only decision is the signature picture (question 3).

## 5. Pieces, by route A

**Database (expand-only; one migration unless noted; `pnpm claim migration`)**
1. `program_policies`: add `kind text not null default 'read' check (kind in ('read','form'))`, `provider text`, `provider_template_id text`, `form_ready boolean not null default false`. Existing rows are `read`.
2. `policy_signatures`: drop NOT NULL on `image` (a relaxing change; the PNG check passes on null), add `via text not null default 'pam'` (`pam` | `forms`) and `provider_ref text`. A completed form writes a normal row with no picture, so everything downstream works.
3. New `policy_form_sessions` (`id`, `policy_id`, `member_id`, `provider_envelope_id`, `status` created/sent/completed/declined/voided/expired, `created_at`, `completed_at`, `purge_state`, `purged_at`). **No field values, no documents, no signer details.** RLS on and forced, a member reads their own rows, nobody else; no grants to anon. Writes only by the service role (the functions below).
4. Purge: a scheduled job (pg_cron where it exists, as `purge-invite-email-addresses` does) asks DocuSign to purge completed envelopes after delivery, and records `purged_at`. Retention days are a decision (question 2).
5. Functions: none for creating envelopes in SQL. Reads reuse `program_policy_signers`. A `security definer` helper (search_path `public, extensions`) lets the webhook mark a session complete and insert the signature row; tested in `packages/db/test` with one user per role (a member cannot complete another's; a lead sees no sessions).
6. A later `-- contract:` migration only if question 3 retires the stored signature picture.

**Edge functions (`supabase/functions`, injected-deps pattern like `places-search`)**
- `forms-sign` (member): checks the JWT, role member, policy current, service live; creates the envelope from the template with the member as embedded signer; returns a recipient-view URL; `continue` and `status` actions; reads DocuSign's status, never the contents.
- `forms-connect` (DocuSign Connect webhook): verifies the HMAC, stores status only (configure Connect to send **no documents and no field data**), drops the payload.
- `forms-author` (lead): creates a template from the uploaded blank PDF and returns the embedded tagging URL; marks `form_ready` on return.
- Secrets in the function's environment (integration key, RSA key, account and user ids, Connect key), sandbox first. DocuSign must be told which account; consent once.
- `third-party-hosts.test.ts`: DocuSign's hosts as `server` and `loaded` entries and the function listed; Privacy names the company before it merges. The promise to members (`transparency`) gets a line.

**App (`apps/web`)**
- `lib/forms/` provider interface (`start`, `continue`, `status`) with a **stub provider** for Storybook and e2e (no real DocuSign, no keys), and the DocuSign provider behind the functions.
- Member: form rows in `MemberPoliciesView` and Trips (needed/done states, "Sign all"), a signing screen with SubPage back, return handling, resume, failed/declined/expired notices with a way to try again and Contact Pam (A26/A28).
- Lead: kind choice in `PoliciesView`, upload then tagging screen, Ready/Needs fields, completions list.
- Storybook: forms in `dummy-policies`, fixtures in `mockSupabase.ts`, a state per screen under `roles/states/`. e2e on the stub: add a form, sign three, see Done, nothing blocks a booking. Fit audit and all seven languages.
- Support: the "Signing a program's rules" post (D-489) needs a forms section; D-466's rule (screens real AND a signed language) applies again.

## 6. Questions that decide the build

1. **Whose DocuSign account?** Recommended start: Pam's one account (small programs will not have their own), with a "connect your own DocuSign" option later for larger organisations that already have one. In Pam's account the completed copy sits in Pam's DocuSign until purged. Is purge-after-delivery acceptable as "Pam does not store"? (Will, Lena.)
2. **Retention:** how many days between "completed" and "purged", and what if a program has not retrieved its copy? (Lena, Will.)
3. **The signature picture.** D-485 point 1 keeps a drawn signature picture for each policy a member signs. Forms never will. Should "read and agree" policies stop storing it too (a record of the date only), or keep it? Leaving it is a split promise; changing it is a contract migration and a copy change.
4. **Are programs' forms fillable PDFs or flat scans?** Decides whether route B is even possible without our own field editor.
5. **Languages and phones (Iris):** which of Pam's seven languages DocuSign's signing page covers, document limits per envelope, and framing versus redirect on iOS and Android.
6. **Cost and gates:** per-envelope price, nonprofit terms, and DocuSign's go-live review time. Who owns the account?
7. **Law (Lena):** what ESIGN/UETA need (consent to e-sign, record access), what DocuSign's certificate covers, SSN and any health-related forms, and what the lawyer must read before launch.
8. **A case manager driving a member's signing:** allowed, and on whose phone?

## 7. What I would build first once Will decides

1. **Spike, no merge (Iris with me):** sandbox account, one template, one embedded signing page, one Connect webhook; settle questions 5 and 6 on real behaviour.
2. **Migration 1** (kind, provider columns, nullable image, `via`, sessions) with its db tests. Smallest, safe, nothing visible.
3. **Provider interface and stub**, then the member flow and the lead flow in Storybook and e2e on the stub. Screens agreed with Dot, copy signed by Sage, Lena translating, in step with `copy:ack`.
4. **Edge functions and the real provider**, host table and Privacy line, sandbox only.
5. **Purge job** and the go-live review. Production switch is Will's, and the Support post follows.

Rough size: 1 small, 2 small, 3 large (screens and copy), 4 medium, 5 small plus waiting on DocuSign.

## 8. Not decided here

Route B stays on the shelf unless question 1 or 4 closes route A. The key design for end-to-end hand-off is written up in section 2 only to show what it would cost.
