# To do before launching Pam

Will's list of what must be true before real people use Pam. Add to it when
Will says "before launch", tick items off with the date and who did it, and
never delete one: a done item stays, struck through, so the list is also the
record of how launch was reached.

`STATUS.md` → "What needs a human" holds every open question; this list is
the subset that **blocks launch**. When an item here is done, update its
STATUS row too.

## Open

- [ ] **Public help posts: re-check them when what they describe changes** (Wren, 10 October
  2026, D-458). Each post says only what is live today, so these go stale as features ship:
  "Texts from Pam" when visit reminders, message alerts or connect texts go live (it says they
  are not sent yet; check the live `dispatch-sms`, not the repo). The day-before visit reminder is
  **one line**: set `VISIT_REMINDERS_LIVE = true` in `apps/site/src/content/TextsFromPam.tsx` the day
  it is merged and the live function queues it (Mira, 10 October); "Who is my guide?" when the
  assign-and-limit work merges; "Points and badges" when more point rules or any badge are
  awarded; "Messages" if blocking appears; "What others can see" if transparency.ts changes
  (its "last day you used Pam" row now says No for a program, D-465; it returns to Yes when
  the database hands a program that day and the app's line says so again). The hidden draft "Staff requests" is published only if a way to ask to be staff
  comes back (D-369).
- [ ] **Public site: Will signs "About Pam" (D-466, 10 October 2026).** English first: read
  `apps/site/src/content/about.ts`, then put `"en"` in `apps/site/src/content/signed-off.json`
  (`{"about-pam": ["en"]}`) — that builds `/en/about-pam/` and shows the home section. The other
  six are drafts with no native reader (D-461): add each code to the same file only once someone
  who reads it has been over it. The home card that promised reminders is fixed (10 October, it now reads `VISIT_REMINDERS_LIVE`).
  When visit reminders go live, flip `VISIT_REMINDERS_LIVE` in `TextsFromPam.tsx` and rewrite
  the "What is coming" paragraph in all seven.
- [ ] **Public site: help posts after Dot's new app layout (D-456) and visit reminders** (10 October 2026).
  *Layout, done 10 October* on a branch from main `522c808`, for the layout that goes live with that night's
  deploy: Who is my guide and What others can see are reached from Profile → **Legal** → "What others can
  see" (was Profile → "What others can see"); Points from the **badge tile** on Profile (was "your points");
  One phone, two sides opens **Explore** (Me) or **Home** (My program); Messages: "New message" is the button
  at the top right, **More options** opens an **Options** screen (new picture), new messages show on the bell
  and a **dot on the Messages tab** (staff also see the number on their Home); Texts from Pam: Profile has a
  "Text reminders" row once you said yes, or a **"Get text reminders"** card if not (staff: "Get text
  alerts"); Points: the "Ways to earn" list now shows only the two real ways; the About-you picture shows the
  language choice. Case managers and program leads keep the OLD Home (Dot, card a22), so their Home steps are
  unchanged. *Still to do when they land:* when the staff Homes change (rings), the steps that say "Home"
  for case managers and program leads (Joining as staff, Sending an invite, One phone two sides, Messages,
  Texts) and `reminders`-adjacent screenshots; when a deploy actually carries a given screen, check it is
  there. *Block* (D-463) has its own section in Messages in Pam (added 10 October; it is on main, so it ships with the same deploy). *Reminders:* the day `dispatch-sms` really sends the day-before reminder, flip
  `VISIT_REMINDERS_LIVE` in `apps/site/src/content/flags.ts` (drives the Texts post and the home card); then
  by hand: **Planning a visit** follows the flag by itself, but add ONE plain sentence to its Reminders
  section about timing: a visit at 9 pm or later gets its reminder the evening before, just before quiet
  hours (Piper, 10 October); About Pam's "What is coming" in all seven languages (the other six need a native reader again),
  the Joining Pam reminder choice, the Texts screenshots and limits (quiet hours, 134 characters, D-431).
  Seen, not mine: the Trip-added screen says "We will remind you the day before if text reminders are on" (`trips.new.done.body`) while no reminder is sent (flag off); the app's own onboarding slide still says "Pam reminds you before you go, so nothing gets
  missed" (`onboarding.3`, all seven languages): Languages & legal / Lena's promise sweep.
- [ ] **Public site: publish the draft post "Keeping your program's listing up to
  date" only when the feature ships** (from PAM · Places & programs, 10 October
  2026, rule D-447, branch `claude/places-programs-load-own-program`, not on
  main). It is a draft in `apps/site/src/content/posts.ts` (`status: 'draft'`):
  not built into the site, only reviewable in Storybook › Website › Journey › Post.
  To publish, delete that line after the Places & programs session sends its
  ready note. The sentence "we'll let you know when they're live" was left out
  because the text-alert job behind it is not scheduled; restore it in
  `KeepingYourListing.tsx` only if that job is live then.
- [ ] **Public site: publish the held rows of "Case manager assignments" as their
  screens ship** (D-449, 10 October 2026). The post now says only what is live; Will's
  full table is in `apps/site/src/content/assignments.ts` with `live: false`. When
  taking on, handing over, unassigning, the Unassigned filter, limiting, pausing and
  turning back on have screens (Accounts & invites, assign-and-limit), flip each row's
  flag and add the table back to the post. Then set a real domain
  (`NEXT_PUBLIC_SITE_URL`; Will's to pick).
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

  **10 October (D-450):** the sender for *staff invites* is built, off, and waits for
  a signature (`docs/email-setup.md` is the plain-words list for Will; the function is
  `send-invite-emails`). The expired-link email above still has no sender.

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

- [ ] **Texts: ~~sign the four alert texts~~ (done 10 October, D-461), the STOP receiver (built, D-460; Will pastes its address into Twilio), file the carrier once**
  (Will, 10 October 2026, D-453). `message_waiting`, `visit_booked`, `booking_changed` and
  `trip_planned` are signed by Will (10 October, D-461; the other languages as drafts to learn from); nothing queues them yet. A stored
  STOP cannot be cleared from the app once `20261010071947_…` is applied, but nothing stores a
  STOP: an Edge Function Twilio calls (STOP/START/HELP and the YES/NO replies) is not built —
  Will to say yes. `docs/sms-campaign-samples.md` has the nine texts and the description
  (981 of 1,024 characters) for the one filing.

- [ ] **Review the SMS copy** still waiting for a name in `reviewedBy`
  (STATUS row 2).

### Programs

- [ ] **Load a program lead's own program** — *parts 1–3 are built on `claude/places-programs-load-own-program` (D-447, 10 October); live once it is merged and its two migrations are applied (0085 first). Parts 4–6 follow.* (Will, 7 October 2026: "still on
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

### Trips and reminders

- [ ] **Saved trips and the day-before text are built** (`claude/places-programs-save-trips`, D-454, 10 October): live once the two migrations are applied.
- [ ] **Point `app_settings.app_url` at Pam's real address** before the first reminder: the text links to `/trips/` on it, and it still holds the address 0054 seeded.
- [ ] **A program booking for a member (D-316)** is still a trip on the device only, so that member gets no reminder.
- [ ] **A Cancel button on a trip** (`cancel_trip` exists and is tested; no screen calls it).
- [ ] **Past trips** (attended, missed) are returned by `my_trips()` but not shown.

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
  **Arabic, since 9 October (D-435):** an English name, address or date inside an
  Arabic sentence is now laid out as a piece of its own. Check that it looks right
  to a native reader — where a colon or a full stop lands beside an English word
  (`:Pam`, `then.`) is correct by the bidi rules but nobody who reads Arabic has
  seen it — and whether an English value in the middle of a sentence reads better
  isolated or flowing with the sentence.

- [ ] **A native reader for what D-465 reworded (10 October).** The last-day line on the
  transparency screen (`transparency.canSee.lastActive`), the privacy page's "What you can do"
  blocking sentence and the terms' blocking sentence now say only what is true (a guide, not a
  program, sees the last day; blocking is in a conversation's ⋯ menu and the other person is told).
  Six translations each, written by Claude; promises, so the same native readers as below.

- [ ] **A native reader for the privacy page's "Who can see it" (10 October, D-452).**
  `privacy.s.who-can-see.p2` and `.p3` were rewritten to say what a guide sees and does
  not (what you send them directly; nothing you send to anyone else; one reported
  message), so the page stops contradicting the transparency screen. The six
  translations are Claude's, and this is a promise: a native reader of Spanish,
  Brazilian Portuguese, Simplified and Traditional Chinese, Russian and Arabic should
  confirm it says exactly that and no more.

- [ ] **Hear the language tags with a screen reader (10 October, D-455).** Every list
  of languages now starts each name with an English tag (EN, ES, PT-BR, ZH-CN, ZH-HK,
  RU, AR). The tag is hidden from a screen reader on purpose and each name carries
  its own `lang`, so "Русский" should be spoken in a Russian voice and the tag not at
  all. Nothing has been heard yet: try the Language screen and the sign-in menu with
  VoiceOver and TalkBack, in English and in Arabic.

- [ ] **Run an Arabic screen reader pass** (VoiceOver and TalkBack on a phone, and
  NVDA if it can be had): that the labels on icon buttons, cards, photos and the
  role switch are spoken in order and whole. Nothing here has been tried with a
  screen reader. Pam keeps its invisible bidi isolates out of every accessible name
  (`tPlain`, D-435) rather than trusting a reader to ignore them, so this is a check
  that the labels *read well*, not that they are clean of characters.

- [ ] **Arabic: names, addresses and other data inside a sentence are reordered**
  (found 9 October 2026 by the text-fit audit; Will asked whether it is on this
  list). An English street address, person's name, program name or file name placed
  in the middle of an Arabic sentence is laid out by the right-to-left rules, so a
  leading number jumps to the wrong end ("Near 1231 N Broad St" reads with the 1231
  beside the Arabic words and the rest on the far side) and an ellipsis cuts the
  start of the value instead of its end. **Done (D-439): the address card on a place
  or program** keeps its own order. **Left: every other sentence that carries data**,
  the area chip's "Near {area}" first (`places.near`, the `long-address` story), then
  anything built from `{name}`, `{program}`, `{address}`. The fix is to wrap each
  interpolated value in a first-strong isolate (U+2068 … U+2069) when the screen is
  right-to-left, in the translate function (`packages/config/src/i18n.ts`,
  `apps/web/src/lib/i18n.tsx`), keeping those marks out of texts, emails and
  screen-reader labels. A suggested task with the full brief is queued in the app
  (title "Isolate interpolated values in Arabic strings"); say "do the Arabic
  isolates" and Claude does it here. A native Arabic reader should confirm the result
  (the item below).

- [ ] **Texts and the invite email in the new languages: approved to learn from;
  deploy, and decide the rest** (D-424, D-430). **Will, 9 October: "approve new
  languages for now ... fail first then fix ... adjust languages based on
  feedback."** Done: his approval is on all 53 text drafts (Portuguese 15, Simplified
  Chinese 12, Traditional Chinese 12, Russian 7, Arabic 7) and the five email
  languages; a text always goes out (English if the person's language cannot be sent
  safely); pull a language by emptying its `reviewedBy`. Left:
  1. **Deploy `dispatch-sms`** (`supabase functions deploy dispatch-sms`, or the
     connector). The live one is v15 from 17 September: it sends **"PAM:"** and only
     English and Spanish; the repo says **"Pam:"** and has the new languages. Deploying
     switches both on at once. Nothing is queued today, so it can go any time — but
     do it together with the next item, because the prefix changes on the live number.
  2. **Re-file the campaign** with the carrier — its own item, just below, with the
     steps. This is the "fail" to watch: a text in an unregistered language may be
     filtered.
  3. ~~Two segments or English for the three appointment reminders~~ **Decided,
     9 October 2026 (D-431): two segments** for those three in Chinese, Russian and
     Arabic (134 characters), one for everything else. The reminders are written, in
     the code and tested; what is left is the filing in item 2, which now has to say
     it (`docs/sms-campaign-samples.md`: the description, the checklist row and the
     sample).
  4. The email provider (the item at the top) is what sends the invite email at all.
  5. **Feedback loop:** when somebody who reads one of these languages says it is
     wrong, tell Claude the language, where, and what it should say; it is fixed in
     that language (docs/copy-changes.md).

- [ ] **File the updated text-message registration with the carrier, then deploy
  `dispatch-sms`** (Will, 9 October 2026: "add the file registration and
  instructions to the do-before-launch list"; D-431, D-424). The campaign on file
  says English and Spanish, one segment, and (unconfirmed, see the old line under
  *Done*) maybe still the "PAM:" prefix. Pam now texts in seven languages, and
  three reminders take two segments in Chinese, Russian and Arabic. A text that does
  not match what was registered is how an approved campaign gets filtered or
  suspended, so this goes first. **The filing is ready to paste:
  `docs/sms-campaign-samples.md`** (its description is 1,018 of 1,024 characters).
  Only Will can do the filing: the Twilio account and the brand (Oba) are his.
  1. **Open the Twilio console and find the A2P 10DLC campaign for the Oba brand**
     (Messaging → Regulatory Compliance → A2P 10DLC → Campaigns; Twilio moves its
     menus, so search the console for "A2P" if that is not where it is). Before
     changing anything, copy what is registered today (description, samples,
     opt-in text) into a note, and write down its status. That is what Claude needs
     to tell you whether the "PAM:" → "Pam:" change was ever filed.
  2. **Open `docs/sms-campaign-samples.md`** and work down "The resubmission
     checklist", in order. It says what to put in each field and why; the two marked
     *rejected before* are where this campaign already failed once each.
     - **Campaign description:** paste the block under "The campaign description, to
       paste as written". Do not edit it without counting: the field caps at 1,024.
     - **Sample messages:** the thirteen under "The messages", placeholders intact,
       then the reminder in each added language under "The same messages in the
       other languages". If the form takes only five samples, send the sign-in code,
       a reminder, the check-in, and one Chinese and one Russian or Arabic reminder:
       the point is that every script and the two-segment reminder appear.
     - **Opt-in description:** paste the answer under "How do end-users consent…" and
       attach the **Text reminders** screenshot, not the sign-in one.
     - **Embedded links: Yes.** Rejected before when it said No.
  3. **Open the privacy and terms URLs in a private window** first (listed in the
     checklist). A reviewer fetches them signed out; a page behind a login or a
     moved deployment is rejection 30921 or 30933 and costs another round.
  4. **Submit it.** If the console will not let you edit an approved campaign, the
     same fields go into a new campaign under the same brand, and the Messaging
     Service is pointed at it once it is approved (the old one keeps working until
     then). I did not check Twilio's current rules for this, so look before
     deleting anything.
  5. **Wait for the approval.** Do not deploy before it comes: deploying
     `dispatch-sms` puts the "Pam:" prefix and the new languages on the live number
     at once.
  6. **Tell Claude "registered".** Claude then checks the live function
     (`list_edge_functions`: it is v15 now), deploys the repo's `dispatch-sms`
     (only on your say-so; the repo's `templates.json` is generated by the tests and
     already carries the seven languages and the two-segment reminders), and reads
     the function's log for lines starting "sent in English", which name a template
     and why a person's language was not used (never the words).
  7. **Read one text in each script on your own phone** (Claude arranges them to your
     number, with your say-so) and look for texts that do not arrive: that is the
     carrier filtering one.
  8. **Tick this item**, and the old line under *Done* ("Text-message samples
     re-filed … with the 'Pam:' prefix", D-321), and update STATUS row 34.
  If a new language later changes what a text says materially, or another template
  is given a second segment, the filing changes with it (`docs/copy-changes.md`).

- [ ] **Tap "Open in…" on a real iPhone and a real Android phone** (Will,
  10 October 2026, D-439: "if no app installed, redirect to app store, based on their
  device"). A web page cannot ask a phone whether an app is installed, so Pam tries
  the app and falls back (`packages/ui/src/mapsLaunch.ts`); the unit tests prove the
  logic, not what a phone's browser does with it. On each phone, with the app
  installed and without it, check: **Android** — Google Maps opens the route, or the
  Play Store page for Google Maps; no Apple Maps row. **iPhone** — Google Maps opens
  the route, or (after about 2 seconds) the App Store page for Google Maps, and
  Safari does not leave an "address is invalid" alert behind or open the store *over*
  an "Open in Google Maps?" prompt; Apple Maps opens the route. Also check the two
  store addresses by opening them (Google Maps `id585027354`, package
  `com.google.android.apps.maps`; both written from memory, no network to check them
  from). If the iPhone path misbehaves, the safe fallback is to give Google Maps there
  the plain web link (it opens the app when it can) and drop the store redirect.

- [ ] **Decide how the tab bar behaves when a language has longer words than
  Russian** (D-434; Will's design, so his call; not blocking while the seven
  languages are the only ones). Five one-word labels share 320px and a tab does not
  shrink below its longest word. Tested 9 October: equal tabs that wrap **break**
  Russian, Portuguese and Spanish words mid-word (do not); tabs sized by their
  content (`flex: 1 1 auto`, `min-width: 0`, wrapping, in `packages/ui/src/TabBar.tsx`)
  fit all seven and wrap the pseudo-language, and move the English tabs by a few
  pixels. Say "size the tabs by content" and Claude makes the change and re-runs the
  fit check; or leave it until a language with longer words is added.

- [x] **Apply 0085** — **done 10 October** (Will, by hand; read back by the merge desk). (D-424, D-428). It
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
