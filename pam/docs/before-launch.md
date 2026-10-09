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

- [ ] **Approve the Pam-team line on the transparency screen** (STATUS row
  10b). Members were promised they would hear first if what is visible
  changes; the super admin's Everyone list and invite log are visible now.

- [ ] **Ship the privacy policy that tells members what limiting an account
  does** (Will, 9 October 2026, D-413, D-414: "We can tell members this in
  privacy policy"). Members were promised they would hear first when a promise
  changes. Written: a privacy section, "When we limit an account"
  (`privacy.s.limits.*`, en + es), and both documents' dates moved to 9
  October. It says the person who invited you, or a staff member responsible
  for guiding you, can limit or pause an account that is hurting others, that
  a limited account can read messages but not send them, and that a paused one
  cannot sign in. The badges now named on
  the transparency line are in the privacy page's list too. Tick this when the
  branch is live. When this was written the live project had three accounts,
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

## Done

_(nothing yet)_
- [ ] Text-message samples re-filed with the carrier with the "Pam:" prefix (D-321, 6 October 2026).
- [ ] A reviewed `booked_visit` SMS template (D-322): "Pam: {place} booked you for {day} at {time}. Tap to see it in Pam: {link}" — first contact, carries STOP; a human signs `reviewedBy`.
