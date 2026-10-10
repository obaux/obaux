# To do before launching Pam

Will's list of what must be true before real people use Pam. Add to it when
Will says "before launch", tick items off with the date and who did it, and
never delete one: a done item stays, struck through, so the list is also the
record of how launch was reached.

`STATUS.md` → "What needs a human" holds every open question; this list is
the subset that **blocks launch**. When an item here is done, update its
STATUS row too.

## Open

- [ ] **Set up the email provider for invite links** (Will, 4 October 2026,
  D-263). The expired-link page already queues a fresh link in
  `public.invite_emails` (live since 0071); nothing sends it yet. Needs:
  1. Pick a provider (Resend, Postmark or SendGrid all work from a Supabase
     Edge Function) and a from-address on Pam's own domain, with SPF/DKIM
     set up for it.
  2. Put the provider's API key in Supabase Edge Function secrets — never in
     this repo.
  3. Write the sender: an Edge Function on a schedule (like the SMS
     dispatcher, 0039/0040) that reads unsent `invite_emails` rows, builds the
     link with the new invite's code, renders `renderInviteEmail()` from
     `@pam/config/invite-email` (approved by Will, 4 October), sends it, and
     sets `sent_at`.
  4. Send one to yourself and check it in Gmail, Apple Mail and Outlook.

  Until this is done, someone with an expired link is told "Check your email"
  and nothing arrives.

- [x] **Merge and deploy 0068 and 0069** — done 8 October as 0075/0076 (D-388) (readiness fixes and blocking, on
  branch `claude/hopeful-thompson-07nj7n`, not yet on this one). 0068 is what
  lets an invite be redeemed at all (phone format) and closes several live
  holes (D-204–D-207). **0069 rewrites `can_message`, and so did 0072 (now
  live)** — whichever is deployed second wins, so 0069 must be rebased to keep
  0072's super admin ↔ staff arm before it goes live. Run the DB suite on the
  merged result first.
  - Merged and rebased 7 October as **0075/0076** (D-346): `can_message` keeps
    0072's arm, the DB suite passes. **Left: apply 0075 then 0076 to the live
    project, approving their `drop` statements.**
  - 8 October: Will asked for this deploy directly. Confirmed exactly what
    blocks it (D-387) — `DROP TRIGGER`/`DROP POLICY` statements time out
    through every tool this session has, Supabase-side, whether or not the
    object exists; `CREATE`/`COMMENT`/`REVOKE` all work instantly. This
    needs Will, in the Supabase dashboard itself, not another attempt from
    here. A harmless slice of 0075 (`to_e164()`, `normalise_phone()`, the
    `profiles_phone_e164` trigger) is live as a side effect of isolating
    this; 0075 is correctly not recorded as deployed.

- [x] **Deploy 0077 after 0075/0076** — done 8 October (D-388) (D-373): invites need a name and a
  phone, and sign-in finds a waiting invite by phone. The app on this
  branch calls the 4-argument `create_invite`; until 0077 is live, making
  an invite from it fails. Ship them together.

- [x] **Deploy 0078 after 0077** — done 8 October (D-388) (D-375): one
  account, member + program. The session reads `profile_roles`; it names the
  `profile_id` foreign key, because the table points at `profiles` twice.

- [ ] **Photos, documents and link previews in messages: merge, then look**
  (Will, 8–9 October 2026, D-394, D-399, D-407, D-428). **Will, 9 October: "Photo
  and messages are treated the same. Only reported if flagged."** Checked against
  the database: a photo or document is seen by the two people in the conversation
  and by a guide or super admin only after someone reports that message, by the
  same test as its words; link previews only by the two people, reported or not;
  no admin policy on any of them; the privacy copy says so. So the promise to
  members is unchanged and **"tell members first" does not block the merge** — a
  heads-up to the two member accounts on the live project is Will's courtesy to
  give or skip.
  - **Done 9 October:** 0079, 0080 and 0081 are live (applied through the
    connector without their no-op `drop … if exists` guards; read back: three
    private buckets, seven storage policies, link-preview table with row-level
    security forced and no `anon` access; `get_advisors` shows nothing new).
  - **Left:** (1) Will says "merge"; Claude merges to `main` and watches the
    Vercel deploy. (2) Send one photo, one document and one link between two test
    accounts and look at both screens.

- [ ] **Approve the Pam-team line on the transparency screen** (STATUS row
  10b; the Pam team can now also read staff emails, 0086 / D-441). Members were promised they would hear first if what is visible
  changes; the super admin's Everyone list and invite log are visible now.

- [x] **Ship the privacy policy that tells members what limiting an account
  does** — **live since the 9 October 2026 merge to `main` (D-420); Will read
  and approved the wording the same day (D-427)** (Will, 9 October 2026, D-413,
  D-414: "We can tell members this in privacy policy"). Members were promised they would hear first when a promise
  changes. Written: a privacy section, "When we limit an account"
  (`privacy.s.limits.*`, en + es), and both documents' dates moved to 9
  October. It says the person who invited you, or a staff member responsible
  for guiding you, can limit or pause an account that is hurting others, that
  a limited account can read messages but not send them, and that a paused one
  cannot sign in. The badges now named on
  the transparency line are in the privacy page's list too. When this was written the live project had three accounts,
  so no one has agreed to the old wording who is not on the team. Nothing
  re-shows the policy to an account that already agreed (`transparency_ack_at`
  is set once); decide if that matters before the first real member.

- [x] **Apply migration 0082 to the live project** — **done 9 October 2026
  (Will, D-420)**, together with the merge to `main`. (Will, 9 October 2026,
  D-415: a case manager reaches only the people assigned to them). Written
  and tested (DB suite 440 checks, 0 failures; fails without it). The member copy already promises it ("the person who invited you,
  or a staff member responsible for guiding you"), so the live database must
  match before launch. First run `list_migrations` and diff against
  `packages/db/migrations/`; the file is one `create or replace function` plus
  a comment, so it does not hit the `DROP` gate (D-387). It numbers 0082
  because `claude/pam-storybook` and `claude/gallant-clarke-0dhizj` both use
  0079–0081 for their own migrations. Until it is live, a case manager can
  still read everyone in their city. Applying it also means members with no
  case manager (signed up alone, or invited by a program lead or a super
  admin) are read by none: the screen to assign one is on the STATUS backlog.

- [x] **Make `terms.s.limits.p3` true** — **done 9 October 2026 (Will, D-427:
  "resolve the remaining")** (Will, 9 October 2026: "Keep terms.s.limits.p3").
  The terms promise "When something is turned off, Pam tells you it is off and
  who to call." Messages now shows the `account_limited` notice (with the call
  button) in place of New message, a conversation shows it where the composer
  was, and a send the database refuses for a limited account says so instead of
  "Your connection dropped". Covered by `e2e/messages.spec.ts` and the Storybook
  story *Member / Created / States / Limited account*. Left over, on purpose: the
  New message picker's own failure line, reachable only by an account limited
  after Messages loaded. The app has no button that
  limits anyone yet (nothing calls `admin_set_access_status`, and the screen to
  assign a case manager is on the STATUS backlog), so a member only meets this
  once the database function is used by hand or that screen exists.

- [ ] **Send privacy policy updates by email — to the people Pam has an email for**
  (Will, 9 October 2026, D-429: "Moving forward, we'll send emails with privacy policy
  updates"; refined 10 October, D-441: "we just don't ask members … not everyone has an
  email. This will be typically just staff"). **What exists now (written and tested, not
  live):** a staff invite carries a required email and the account keeps it, tied to the
  phone (`0086`, D-441). **What is still needed:** (1) the email provider and a sender
  (the first item on this list); (2) a decision on what a *member* — who is never asked for
  an email — receives when the policy changes: the in-app notice, or a text a person has
  signed off (`reviewedBy`); (3) a way for staff who already have accounts to add an email
  (re-inviting is the only way today). Until then the policy and terms carry their dates
  (privacy: 10 October) and only team accounts and two members exist.

- [ ] **Make "Delete my account" work for everyone** (Will, 10 October, D-441: "if a user
  chooses to delete all their data, the email goes along with it"). **Audit log decided and
  built, not live (D-443):** Will, 10 October: "When account is deleted the account should sit
  in audit log for 6 months before it disappears." Deleting a profile now writes an
  `account.delete` row; a nightly purge removes every row that names the account six months
  later; the privacy policy says so (`privacy.s.how-long.p3`). **Still blocked:** a member
  who has **points** cannot be deleted — `points_ledger` cascades from the profile and is
  append-only, so the cascade is refused (probed 10 October: the seeded member with points
  fails; admins and providers delete). Will said yes, delete the points history too (10 October): built as D-445 — the ledger lets a
  DELETE through only once the member's profile is gone — and **not yet applied** (migration
  `20261010033917_points_history_is_deleted_with_the_member.sql`; no `drop`). **Then** write the routine for the Pam team (a
  function, tested like the privacy promises: profile, email, invites, messages, photos,
  points in one call). Until then a deletion on a call must remove the email by hand.

- [x] **Apply the two audit-log migrations, in order** (D-443) — **done 10 October 2026 (Will: "Yes")**:
  `list_migrations` first (no drift), the first through the connector (nightly job
  `purge-erased-audit` confirmed in `cron.job`), the second (`drop constraint`) also through the
  connector, then a one-line fix after `get_advisors` flagged the guard function's search path
  (`20261010033722_pin_the_append_only_guard_search_path.sql`). The privacy sentence merges with them.

- [x] **Apply 0086 to the live project, together with the app change that uses it** (D-441) —
  **done 10 October 2026 (Will: "Apply and merge 0086")**: `list_migrations` checked (live ended
  at 0081; 0085 still held), applied through the connector (no `drop`), advisors showed nothing
  new (two tables with forced RLS and one policy each; `invite_create`, `keep_invite_email` and
  the deletion trigger function are not executable by clients), then merged to main (`0220ae0`).
  The live copy of the migration is the same statements without the explanatory comments.

- [ ] **Review the SMS copy** still waiting for a name in `reviewedBy`
  (STATUS row 2).

### Programs

- [ ] **Load a program lead's own program** (Will, 7 October 2026: "still on
  backlog list for programs before production"; D-218's follow-up, D-352,
  D-361). Today the Program tab draws the example program, and Home's Get
  started only knows a lead "has a program" once one is sent from that
  device (`markSetupDone`, sessionStorage). Needs:
  1. Read the lead's listing (their `org_id` and its `services` row, already
     readable under `services_write_provider`, 0007) and show it on the
     Program tab and in Edit, saving edits back.
  2. Have Add a program write the listing as a `needs_review` row instead of
     only showing "sent".
  3. Drive `useProgramSetup().hasProgram` from that, so Get started, the
     Program tab (Add a program when there is none) and the example data
     follow the real account, on any device.
  4. Then: switching between a lead's programs (D-318), also on the backlog.
  5. The review wait (D-381): the status (in review / taking longer / needs
     changes) and Pam's note from the database, a place for the reviewer to
     write that note, and a text to the lead when it goes live.
  6. The super admin's program review queue, including Delete and start
     over (D-385, D-386): build it as `docs/design/program-review-queue.md`
     says — a withdrawn request shown as "Withdrawn — started over" with only
     Discard, the new one approvable, and the database rules tested.

### Two roles (one account, member and program)

Will, 7 October 2026: "Add these to Before launch doc" (D-375).

- [ ] **Split notifications by side.** Today the bell shows everything for
  the account, whichever side it is acting as. Each notification should
  carry the role it is about; the bell shows the acting side's, and the
  other side's count shows as a dot on "Use Pam as".

- [ ] **Word the two lines on Pam's privacy promise to members** (Will to
  word; `docs/design/one-account-two-roles.md` §6), then add them to
  `transparency.ts` — the transparency tests will fail until the contract
  changes, by design:
  - to a member who also works at a program: people at that program can't
    see their activity as a member;
  - on What to expect for a program: if someone who works with you also uses
    Pam as a member, you won't see their member activity.

### Languages, and messages in your own language

Will, 9 October 2026: Brazilian Portuguese, Chinese (Mandarin and Cantonese),
Russian, Arabic (D-422); messages read in the reader's language (D-423).

- [x] **Deploy 0083 before the app that offers the languages ships** — done
  9 October 2026 (Will asked for the migration and the merge together; applied
  after `list_migrations` against `packages/db/migrations`, checked by reading
  `profiles_language_supported` back). It is the one check that lets a profile
  hold `pt-BR`, `zh-CN`, `zh-HK`, `ru` or `ar`. **0084 (message translations)
  went in with it** — it creates a table nothing reads or writes until
  translation is switched on, so it changes nothing a member sees. 0079–0081
  went in after them; neither pair touches what the other creates.

- [ ] **Have a native speaker read every new language** — nobody has. The six
  new bundles were drafted by a model (Brazilian Portuguese; the other four in
  parallel against a frozen English snapshot, then re-checked by script) and
  have not been read by anybody who speaks them. **Start with what is a
  promise:** the privacy notice, the terms, the transparency screen, the
  notices (`NOTICES`), and the seven "Switching to…" lines
  (`SWITCHING_LANGUAGE`, the first words somebody sees in their language).
  Cantonese readers: check `zh-HK` for Hong Kong wording (訊息, 電話號碼,
  傾談), not Taiwan's. Arabic: Modern Standard, and check that the
  right-to-left screens read naturally. Russian: "вы" throughout.

- [ ] **Sign off the texts and the invite email, language by language, and
  decide the two things only Will can** (D-424). Drafts now exist: **53 texts**
  (Portuguese 15, Simplified Chinese 12, Traditional Chinese 12, Russian 7,
  Arabic 7 — `unsignedSmsDrafts()` lists them) and the **invite email in all
  five**. None is signed, so **everyone is still texted and emailed in English
  (or Spanish) whatever their language**; the day a person writes their name in a
  draft's `reviewedBy`, that language starts for that message and no other.
  Needs:
  1. A native reader for each language reads its texts and email against §9 (no
     word that reveals justice involvement — each language has its own list now —
     160 characters, or 70 in Chinese, Russian and Arabic, no emoji) and signs
     them. **I never fill in `reviewedBy`.**
  2. **Will: two segments or English for the reminders?** The three appointment
     reminders (a time, an address, a link) cannot be said in 70 characters in
     Chinese, Russian or Arabic, so those readers get them in English. Allowing
     two segments doubles their cost and changes the carrier registration, which
     says one. Also the shorter the link, the more fits: the live `app_url` is
     36 characters.
  3. **Re-file the campaign** with the carrier before the first text in a new
     language: `docs/sms-campaign-samples.md` names English and Spanish only.
  4. The email provider (the item at the top) is what sends the invite email at
     all.

- [ ] **Apply 0085 whenever convenient — nothing waits on it** (D-424, D-428). It
  keeps the language a person asked in, so a denial text and a fresh-link email
  are written in it and an approved account opens in it. It replaces two
  functions, so the live connector hangs on it (tried 9 October; nothing left
  behind) and it goes in by hand: paste
  `packages/db/manual/2026-10-09-language-where-there-is-no-profile.sql` into the
  Supabase SQL editor (`pam` project), Run, "Success"; tell Claude "applied". Until
  then the app asks for the language and, finding no such parameter, asks again
  without it, so everything works and is simply in English. Run
  `list_migrations` first.

- [ ] **Messages in your own language — switching it on.** Built and tested,
  off (`MESSAGE_TRANSLATION` in `packages/config/src/translation.ts`; the
  function's own switch is the secret `MESSAGE_TRANSLATION=on`). Before
  either is turned on:
  1. 0084 is live (9 October); deploy `translate-messages` (`supabase functions deploy
     translate-messages`), and read `get_advisors`.
  2. Set `ANTHROPIC_API_KEY` as a function secret — never in this repo — on an
     account whose terms say what is sent is **not kept and not used to
     train**. Get that in writing; the privacy page says it ("It keeps
     nothing and does not learn from them").
  3. A native speaker reads `privacy.s.translation.*` in all seven languages
     (it appears on the privacy page the moment the switch is on).
  4. **Tell members first** (the transparency promise): translation sends the
     words of a message to another company. Will to word it, as for the two
     roles (above).
  5. Decide a cap per person per day. The function limits one call to 30
     messages and 4,000 characters each, not how often it is called.
  6. Flip `MESSAGE_TRANSLATION.enabled` to `true`; `legal.test.ts` fails on
     purpose until it is updated with it. Send two messages between two test
     accounts in different languages and look at both screens.

## Done

_(nothing yet)_
- [ ] Text-message samples re-filed with the carrier with the "Pam:" prefix (D-321, 6 October 2026).
- [ ] A reviewed `booked_visit` SMS template (D-322): "Pam: {place} booked you for {day} at {time}. Tap to see it in Pam: {link}" — first contact, carries STOP; a human signs `reviewedBy`.
