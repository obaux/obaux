# Message Pam, the super admin's side: build slices (card a100)

**Date:** 2026-10-18 · **Lane:** Accounts & invites (Ava) · **Branch:** `claude/pam-message-pam-admin` (off `main`
2bcb2e39) · **Status:** plan before code (Mira, 07:05 and 07:12).

This is **slice 4 of Nico's build**: `docs/design/plans/2026-10-18-message-pam-slices.md` (`claude/messages-pam-slices`
@ af464ef3). Will's answers are D-605. It turns my earlier plan, `2026-10-18-message-pam-admin.md`, into build steps.

Nico owns:
- the database, all `pam_*` functions and the switch;
- the member's side, and `ThreadView` with its composer;
- photos (his slice 3);
- the welcome message and the out-of-hours reply.

Mine are:
- the inbox and the Home row (`RequestsScreen`);
- the thread header's Close and Reopen;
- saved replies;
- the start picker for people and programs;
- the hours editor.

Everything here is built on the hooks Nico hands over at the end of his slice 1.

## 1. What Will picked, as it lands on my side (D-605; Mira 07:05, corrected 07:12)

- **B:** Pam can start a conversation with anyone: a member, a staff member, or a program, which reaches each active
  lead.
- **The inbox:**
  - waiting longest first, then Answered, then Closed;
  - first name, role and region only;
  - the reply-time line;
  - saved replies (Sage's words).
- **Business hours:** a setting the inbox edits (`app_settings.pam_hours`, default Monday to Friday, 9:00 to 17:00,
  America/New_York). It drives Nico's out-of-hours reply.
- **Photos in the super admin's composer:** this comes with Nico's slice 3. I build nothing for it; S2 checks the team
  sees the button.
- **Not in v1:**
  - **No "Away until" line.** Will wants the conversation clean, and business hours cover being away.
  - **No "Read by Pam".**
- **Behind Nico's switch** `app_settings.pam_messaging_live`, off until Will signs Lena's lines.
- **Super admins have no Pam conversation of their own.** They are Pam.
- **Settled by the desk (Mira, 07:17):**
  - Will's existing staff conversations (D-262) stay on his Messages tab, so `/pam/messages/` lists only Pam
    conversations (`kind = 'support'`).
  - There is no block and no report on a Pam conversation, on either side.
  - Photos show in the team's view.
  - Limited accounts write to Pam, and Pam to them.
  - Hours are still open with Will. Build to `app_settings.pam_hours` with the default.

## 2. What I use from Nico (his slice 1, migration 6, and the hooks)

| Hook (Nico delivers, with `mockSupabase` fixtures) | Over | I use it for |
| --- | --- | --- |
| `usePamStatus` | `pam_status()`: the switch, hours, open now, next opening | Gating every entry point, and the hours editor's preview |
| `usePamInbox` | `pam_inbox()`, `pam_reply_times(days)` | The inbox, the Home row's count, the reply-time line |
| `useOpenPamConversation` | Opening a conversation by id | Opening a row |
| `useStartPamConversation` | `pam_start_conversation(profile, body)`, `pam_start_program_conversation(service, body)` | Everyone's button and "Message this program" |
| `usePamHours` | `pam_set_hours()` | The hours editor |
| (direct call) | `pam_set_thread_status()` | Close and Reopen |

**I write no migrations and touch no `pam_*` function.** If a screen needs a column, I ask Nico, and that piece waits
for it.

## 3. Slices (all inside Nico's slice 4)

Each is one READY with its tests, stories and pictures. 4a can start the moment the hooks land. 4b to 4d follow in any
order.

### 4a. The Home row and the inbox

- **Home row.** The first row of `RequestsScreen`'s `MenuList`, "Messages to Pam". It shows a plain `value` per D-586:
  the number of conversations waiting for a reply. It opens `/pam/messages/?from=home`. It is hidden while the switch
  is off.
- **`/pam/messages/`** (a `SubPage`). With the switch off it shows the not-found screen, and it is `TabGate`d to the
  super admin. Three groups:
  1. **Waiting for Pam**, longest waiting first. Each row says "Waiting 3 hours", from `waiting_since`.
  2. **Answered**, newest first.
  3. **Closed**, folded under one row that opens it.

  Each row (a `MenuList` row, 64px or more):
  - the first name;
  - under it, "Member · {region}", "Case manager · {region}" or "Program lead at {program}";
  - under that, the latest message's first line, prefixed "You: " when Pam wrote last;
  - the time on the right.

  Nothing else is shown. An empty inbox has one line.
- **The reply-time line** at the foot: "Last 30 days: Pam usually replies in about {duration}". It comes from
  `pam_reply_times(30)` (`median_seconds`, `mean_seconds`, `count`). The line uses the median, hence "usually". It is
  hidden while `count` is 0.
- **A row to the hours editor** at the foot: "Hours" (4d).
- **Tests:**
  - e2e `pam-inbox.spec`: the row and its count; group order and sort; the waiting words; only the listed columns; the
    reply-time line; everything hidden with the switch off; no WCAG A/AA violations at 320 and at the iPhone SE size,
    in light and dark.
  - A unit test for grouping and sorting.
  - Each new case is shown to fail on `main`.
- **Storybook:** `screen('super-admin', 'Messages to Pam', '/pam/messages/')`, plus an empty-state story and a
  long-waiting story, so `audit:fit` reads them in seven languages.

### 4b. In a Pam conversation, for the team

`ThreadView` is Nico's, so these are components of mine that his view mounts for the team. The exact mount point is
agreed with Nico; see §6.

- **Close and Reopen** in the conversation's menu (`/messages/thread/options/`), calling `pam_set_thread_status`.
  Never beside the composer.
- **Saved replies:** a button above the composer opens a short sheet. Picking a reply fills the composer; nothing is
  sent until Send. These are Sage's drafts (`claude/sage-signs` @ fb410c60), with no justice words:
  1. **Legal:** "We can't give legal advice. For free legal help, you can contact: {list}. We're glad to help with
     anything else." It is not offered until the `{list}` has had a lawyer's reading.
  2. **Wrong door, guide:** "Your guide is the best person for this. You can write to them in Messages."
  3. **Wrong door, program:** "The program can answer this best. You can message them from their page." The super
     admin edits it before sending if that program can't be messaged (§4).
  4. **Staff writing about a member:** "We can only help a member with them. Please ask them to write to Pam, or talk
     it through in your conversation with them."

  They are fixed text in `@pam/config`, in seven languages, and not editable in the app.
- **Photos:** the team sees the composer's photo button in a Pam conversation (Nico's slice 3). I only add the e2e
  check.
- **Tests:** e2e `pam-thread-team.spec`:
  - Close moves the conversation to Closed, and a new message from the person reopens it (stubbed);
  - a saved reply fills the composer and sends nothing by itself;
  - the legal reply is absent while `{list}` is unset;
  - the photo button shows for the team;
  - none of these show for the asker.

### 4c. Starting a conversation as Pam

- **Everyone (`/directory/`).** Every real row (member, case manager, program lead) gets a message button on its end,
  as on the case manager's Home (D-227). Its label is "Message {first name} as Pam". It calls
  `pam_start_conversation`, and if a conversation exists it opens that one. The Demo view switch stays, and both
  controls stay 48px.
- **"Message this program"** on a program's page (`/place/?id=`), for the super admin only. That is where they
  already reach every live program: Profile › Programs, then the program. Programs to check links to the same page.
  - A composer says "This goes to each of the program's active leads". Send calls `pam_start_program_conversation`.
  - With no active lead, see §4.
  - `/place/` is Piper's file, so the button's exact spot is agreed with her first.
- **Before the first message to someone**, the composer says once that they'll see it from "Pam".
- **Tests:** e2e `pam-start.spec`:
  - the button on each kind of row;
  - an existing conversation opens rather than a second one starting;
  - the program composer's line;
  - the no-lead state;
  - a member, a case manager and a program lead see none of these.

### 4d. Business hours

- **`/pam/settings/`**, from the inbox's "Hours" row. It edits `app_settings.pam_hours` through `usePamHours`
  (`pam_set_hours`):
  - which days;
  - opening and closing times (`Dropdown`s);
  - the time zone, shown as "Eastern time".

  It defaults to Monday to Friday, 9:00 to 17:00, America/New_York. `pam_status()` returns `hours_tz`, `hours_days`,
  `hours_open` and `hours_close`; Save calls `pam_set_hours(tz, days, open, close)`. `{hours}` uses Sage's signed
  template `pam.hours`: "{days}, {open} to {close} {zone} time".
- **A preview line under it** shows people's out-of-hours reply as it will read with these hours. The words are
  Sage's: "Thanks for writing. Pam is here {hours}, and we'll read your message then." plus "In a crisis, call or text
  988." The reply itself is Nico's system message (`system_key = 'pam.away'`, the next opening in `system_vars`). It never rings the person's bell and never counts as a reply, so a conversation keeps "waiting" until a person on the team writes. The preview draws `{hours}` with the same helper,
  so it can't differ.
- **Tests:** e2e `pam-hours.spec`:
  - the defaults on first open;
  - Save sends exactly what was chosen;
  - the preview follows the choice;
  - a non-super-admin is refused.

### 4e. Records

When 4a to 4d are READY:
- one decision for my side, cross-linked with D-605 and Nico's;
- changelog fragments;
- STATUS;
- a session log per slice.

## 4. A program with no active lead (for Piper)

What Piper needs to say, or confirm:

1. **The rule.** "Active lead" is the set `message_program` already chooses from. When can a live program have none:
   the lead left, was paused, or never finished joining?
2. **The words on the program's page for the super admin**, in place of "Message this program". It is one plain line,
   not a button and not an error. Draft: "Nobody runs this program in Pam right now, so it can't get messages. You can
   still find its contact details above." Sage words it; Piper confirms it's true in every case.
3. **Knowing before drawing the button.** The page has to know there's no active lead before it offers the button, so
   nobody writes a message that can't go. That needs either a read from Nico (`pam_program_has_lead(service)`, or a
   count) or a coded refusal from `pam_start_program_conversation`. Nico (07:20): the function raises
   `PAM_NO_ACTIVE_LEAD`, and "active lead" means a provider whose account is active and whose org is the program's
   (Piper confirms). A read before drawing the button is still asked (§6.2).

## 5. Words (Sage writes, Lena translates)

These keys are placeholders, marked unsigned in `en.json` until Sage signs them (A29; `copy:status` lists them):
- `pam.home.row`
- `pam.inbox.title`
- `pam.inbox.group.waiting`, `.answered`, `.closed`
- `pam.inbox.waiting` ({duration})
- `pam.inbox.you`
- `pam.inbox.role.member`, `.caseManager`, `.lead` ({program})
- `pam.inbox.empty`
- `pam.inbox.replyTime` ({duration})
- `pam.inbox.hoursRow`
- `pam.thread.close`, `.reopen`
- `pam.saved.title`
- `pam.saved.legal` ({list}), `.guide`, `.program`, `.aboutMember` (Sage's drafts, fb410c60)
- `pam.start.action` ({name})
- `pam.start.firstNote`
- `pam.program.action`, `.note`, `.noLead`
- `pam.hours.title`
- `pam.hours.days`, `.open`, `.close`, `.zone`
- `pam.hours.preview`

There are no justice words anywhere.

## 6. Open with Nico

1. **The mount point in `ThreadView`** for 4b's components: Close and Reopen in the options screen, and the saved
   replies button above the composer. I propose `ThreadView` takes a `teamTools` slot, rendered only when
   `is_pam_team()` and the conversation's kind is support.
2. **No active lead:** a read (`pam_program_has_lead(service)`) or a coded refusal (`PAM_NO_ACTIVE_LEAD`) from
   `pam_start_program_conversation` (§4).
3. **The `{hours}` helper** shared between his system message and my preview, so the two can't differ.

None of these blocks 4a.
