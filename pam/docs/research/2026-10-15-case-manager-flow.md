# Case manager flow: first pass (15 October 2026)

Iris, User Research & Testing Lead. This is the second role in the first pass over every flow,
after the Member (`docs/team.md`). The merge desk asked for it on 15 October at 13:24.

## 1. The flow and the person

- **Who:** Dana, a case manager at a reentry program.
  - Busy, between calls, on their own phone.
  - Reads well but has no patience for hunting.
  - Their measure of Pam is its own sign-in slide: "Know who showed up, without chasing calls."
- **Starting where:** an invite link, signed out.
- **Trying to:**
  1. join;
  2. see their members;
  3. invite a new member;
  4. open one member;
  5. point them to a program;
  6. message them;
  7. see whether they went.
- **Where tested:**
  - Storybook built locally from `main` `7b58b1f9`.
    - The walk used `case-manager-prototype--prototype`.
    - Joining used `onboarding--case-manager`, `case-manager-screens--sign-up` and
      `onboarding-staff-privacy-step--case-manager-invited`.
    - Seven other `case-manager-*` screens were checked as well.
  - One check in the app built with `build:e2e`, served from `out/`. Every Supabase call was
    answered by my script, and every other host refused.
  - **Not the live app.** No account, no invite and nothing sent: the made-up invite stopped at
    "Create link".
- **How:**
  - Playwright in Chromium with touch.
  - The walk at 390×844 in English, light.
  - Eleven screens again at 320×568 (English, light), at 390×844 (Spanish, dark) and at 320×568
    (Arabic, light).
  - On each one I measured tap targets and text sizes, checked for sideways scroll, and read the
    accessibility tree.

## 2. What happened

| Step | Taps | Screen |
|---|---|---|
| Sign in from the invite | 2, plus the number and the code | "Join Pam", then Enter your code |
| Join | 2, plus their name | About you (1 of 2), then What you will see (2 of 2) |
| See their members | 0 | Your members: a row of faces, a card each with points |
| Invite a member | 3, plus a name and a number | Invite someone, Invite a member, Create link. Then Send the link, or read the code aloud |
| Open a member | 1 | Their page, titled "Profile" |
| Point them to a program | 3 | Connect Marcus to…, Recommend, Recommend. Then "You're helping Marcus on their way!" |
| Message them | 1 | In the prototype, nothing happens (P1). In the app built for tests, the conversation opens |
| See whether they went | 1 | Programs attended in the past |

**About 13 taps** for all of it, plus typing. Every step could be finished in the app; in the
prototype, every step but messaging.

## 3. Findings

### Stops someone

None found on this pass.

### Slows someone

**W1. Joining, step 2 of 2 has no way back and no help.**

- **Screen:** What you will see (`onboarding-staff-privacy-step--case-manager-invited`).
- **Steps:** the invite link, the code, About you, then Next.
- **What happened:**
  - The only control is "I understand".
  - There is no back arrow, though step 1 has one ("Back to Sign in"), and there is no Help.
  - At 320×568, the last line sits under the button's fade.
- **Shot:** `shots/2026-10-15-cm-join-step2-no-back.png`.
- **Expected:**
  - "Never dead-end": every screen has a visible way back.
  - A26 asks for help on joining and on each step of a multi-step task.
  - A case manager who mistyped their name on step 1 can't go back to fix it.
- **How sure:** high. 10 October's member W2 was the same thing on the member's join.

**W2. A new case manager is told to look for Invite somewhere it isn't.**

- **Screen:** an empty Home (`case-manager-states-home--empty`).
- **Steps:** finish joining with nobody invited yet.
- **What happened:**
  - The empty list says "To invite someone, open Profile and choose Invite someone."
    (`admin.caseload.empty.body`).
  - "Invite someone" is a row on this same screen, and the dashed + at the top is next to it.
- **Shot:** `shots/2026-10-15-cm-empty-home.png`.
- **Expected:** the words point at the row under them, for example "Tap Invite someone below."
  This is the first screen a new case manager sees.
- **How sure:** high.

**W3. A member's page is titled "Profile".**

- **Screen:** a member, as their case manager sees them (`case-manager-screens--member`).
- **Steps:** Home, then tap a member.
- **What happened:**
  - The big title is "Profile" (`person.profile`), the same word as Dana's own tab.
  - Marcus's name is the smaller heading under it.
  - A screen reader announces "Profile" first.
- **Shot:** `shots/2026-10-15-cm-member-profile-title.png`.
- **Expected:** the member's name as the title, or "Marcus's profile".
- **How sure:** medium. It reads as Dana's own profile at a glance.

**W4. Home doesn't say who showed up.**

- **Screens:** Home (`case-manager-screens--home`), then a member.
- **Steps:** look at Home.
- **What happened:**
  - Each card shows a name and points, and the faces at the top have a ring when something is
    new. Nothing on Home says who has a visit coming up, who went, or who missed one.
  - To find out, Dana opens each member, then "Programs attended in the past".
  - Pam's sign-in slide to case managers is "Know who showed up, without chasing calls."
- **Shot:** `shots/2026-10-15-cm-home.png`.
- **Expected:** the next visit, or the last one and whether they went, on each card.
- **How sure:** medium. This is a design question more than a defect; worth asking one real case
  manager.

### Polish

- **P1. In the prototype, "Message Marcus" does nothing, on Home or on his page.**
  - **What happened:** the pretend database answers `open_direct_conversation` (traced: one call,
    200), but no screen opens. The prototype logs no error and no navigation.
  - **The app is fine:** in the app built with `build:e2e`, the same tap opens the conversation.
  - **Why it matters:** this is a prototype gap, but it is the surface Will reviews the case manager
    on.
- **P2. The prototype shows a member with no visits.**
  - **What happened:** Marcus's page reads "0 Trips coming up", "None yet" and an empty "Programs
    attended in the past".
  - **Cause:** `appointments` for a real member has no fixture: `[journey] no fixture for GET …/appointments?…member_id=eq.m1`.
  - **Why it matters:** the part a case manager most cares about can't be reviewed in Storybook.
- **P3. "Connect Marcus" lists distances, and nothing says from where.** "0.2 miles" on each program
  is presumably from Dana's area, not Marcus's.
- **P4. After a recommendation, the only way on is "Return home".** Dana is in the middle of
  Marcus's page and probably wants to go back to him, for example to message him about it.
- **P5. "What you can see" is a 12px paragraph on Home**, in every language. It is the promise to
  members, in the smallest text on the screen. And Home's list (goals, level…) differs from the
  joining step's list (no goals, no level).
- **P6. Spanish staff screens mix registers.** The rule is *usted* for staff.
  - *Tú*: Home ("Tus miembros") and About you ("Sobre ti").
  - *Usted*: the joining privacy step ("Lo que verá").
  - For Lena's Friday batch.
- **P7. "City you live in" on a case manager's About you.** For staff, the city they work in is
  probably what matters.
- **P8. The search box's spoken name is doubled:** "Search your members by name Search your members
  by name".
- **P9. Each invite form error is shown alone.** An empty "Create link" says only "Add their first
  name." The missing number is reported only after the name is filled.

## 4. What worked (keep it)

- **The invite screen is honest and quick.**
  - "Each invite is a link for one person. Send it by text."
  - "Only this number can use the link."
  - The finished link says when it stops working (October 22).
  - It offers "On the phone? Read them this code instead", which suits a case manager on a call.
- **Recommend asks first**, in plain words: "Marcus will see it on their Home and can choose to say
  yes."
- **What you will see** is plain and complete, and says what Dana can't see.
- **No sideways scrolling** on any of the eleven screens at 320, in English, Spanish or Arabic.
  Names keep their own direction in Arabic.
- **Every list row** (Invite a member, Connect…, Message…) **is a full-width tap.**

## Not covered this pass

- **The live app, signed out:** not opened.
- **Screen readers on a phone:** VoiceOver and TalkBack.
- **Contrast in dark mode:** looked at, not measured.
- **Starring a member and the Saved tab:** only measured, not walked.
- **Inviting a program or another case manager, and the Messages tab's report flow.**
- **A case manager who is also a program lead ("Use Pam as").**

Iris
