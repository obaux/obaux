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

- [ ] **Photos, documents and link previews in messages: deploy 0079 + 0080
  + 0081, and tell members first** (Will, 8–9 October 2026, D-394, D-399,
  D-407). All three now go in one SQL-editor file (`message-photos`,
  `message-files`, `message_link_previews` + `link-previews`; one
  transaction, tested through 0078, run twice, then the whole policy suite);
  it replaces the 0079 + 0080 file. The `link-preview` Edge Function is
  already deployed and refuses every request until 0081 is in. What
  follows was written for photos and holds for documents too (D-394). The private `message-photos` store and who can
  see a photo live in 0079 — applied to the live project before the branch
  that sends photos is merged, or the photo button fails. The connector
  stopped at its approval step for the `drop … if exists` guards (as with
  0075), so it is a one-transaction file for the SQL editor, tested against
  a copy built through 0078 (and harmless run twice); it records itself in
  `schema_migrations`. The transparency
  screen, privacy notice and terms now name photos; two member accounts on
  live saw the old wording, so if either is a real person they hear about
  photos before the merge ("If this changes, we will tell you first").

- [ ] **Approve the Pam-team line on the transparency screen** (STATUS row
  10b). Members were promised they would hear first if what is visible
  changes; the super admin's Everyone list and invite log are visible now.

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
Russian, Arabic (D-413); messages read in the reader's language (D-414).

- [ ] **Deploy 0082 before the app that offers the languages ships.** It is
  the one check (`profiles_language_supported`) that lets a profile hold
  `pt-BR`, `zh-CN`, `zh-HK`, `ru` or `ar`. Until it is live, somebody who
  picks one gets a failed save. It does not touch any other table. Check
  `list_migrations` against `packages/db/migrations` first (CLAUDE.md): 0081
  (link previews) is the one before it. **0083 (message translations) can
  wait** until translation is switched on; it changes nothing a member sees.

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

- [ ] **Write and sign off the texts and emails in each language, or decide
  they stay English/Spanish.** SMS and invite email are drafted and signed
  off (`reviewedBy`, 160 characters, no emoji, nothing about justice
  involvement) in English and Spanish only; a person who reads Pam in
  another language gets those in English. That may be fine for a code that
  expires in minutes; it is not fine for a reminder. Needs Will's decision
  per template.

- [ ] **Messages in your own language — switching it on.** Built and tested,
  off (`MESSAGE_TRANSLATION` in `packages/config/src/translation.ts`; the
  function's own switch is the secret `MESSAGE_TRANSLATION=on`). Before
  either is turned on:
  1. Deploy 0083, then `translate-messages` (`supabase functions deploy
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
