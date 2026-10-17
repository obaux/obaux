# Super admin flow: first pass (15 October 2026)

Iris, User Research & Testing Lead. This is the last of the four roles in the first pass over every
flow, after the Member, the Case manager and the Program lead (`docs/team.md`). The merge desk asked
for it on 15 October at 14:18.

## 1. The flow and the person

- **Who:** Will, the super admin, between other work, on his phone. He decides who gets in and
  what members see.
- **Starting where:** signed in.
- **Trying to:**
  1. approve or deny someone asking to be staff;
  2. check a new program;
  3. deal with a reported place;
  4. find someone in Everyone;
  5. answer a help request by text.
- **Where tested:**
  - Storybook built locally from `main` `7f850755`, with the stub settings.
    - The walk used `super-admin-prototype--prototype`.
    - Eleven `super-admin-screens--*` screens were checked as well.
  - The app was also built with `build:e2e`: 0 files name the live project.
  - Every other host was refused. The only one asked for was `images.unsplash.com`, by the example
    staff photo in a conversation. It is listed and allowed for example people
    (`third-party-hosts.test.ts`), so it is not a finding.
  - **Not the live app.** No account, and nothing sent. "Send text" was never pressed.
- **How:**
  - Playwright in Chromium with touch.
  - The walk at 390×844 in English, light.
  - The eleven screens again at 320×568 (English, light), at 390×844 (Spanish, dark) and at
    320×568 (Arabic, light).
  - On each one I measured tap targets and text sizes, checked for sideways scroll, and read the
    accessibility tree.

## 2. What happened

| Step | Taps | Screen |
|---|---|---|
| Sign in | 2, plus the number and the code | Sign in, then the code; Home is "Requests" |
| Decide a staff request | 2 | Priya Nair, then Approve (or Deny). Back on Requests, with nothing said |
| Check a new program | 3 | Programs to check, Hearth Kitchen Training, then Approve (or Ask for changes, then a note) |
| A reported place | 3 | Profile, Reported places, then Keep it or Take it off the list |
| Everyone | 2 | Profile, then Everyone |

**About 12 taps** for the lot. Every step can be finished.

## 3. Findings

### Stops someone

None found on this pass.

### Slows someone

**W1. Every decision takes effect on one tap, with no confirmation and no word after.**

- **Screens:**
  - a staff request (`super-admin-screens--request-review`): Approve and Deny;
  - a program to check (`--program-to-check-new`): Approve;
  - Reported places (`--reported-places`): Take it off the list.
- **Steps:** open any of them and tap.
- **What happened:**
  - The decision is made at once. The screen goes back to the list with no message, so Will can't
    tell it worked; in the prototype, Priya is still on the list after either decision.
  - **Deny** texts the person (staff-request decisions are texted whatever `texts_live` says;
    STATUS, b33). `RequestReviewScreen.tsx`'s `decide()` calls `review_staff_request` and
    navigates, with no confirmation step.
  - **Take it off the list** removes a place from what members see, with no undo.
  - Approve and Deny sit one above the other.
- **Expected:**
  - a confirmation where the person is texted or a place disappears ("Deny Priya? Pam will text
    her");
  - and a line afterwards saying what was done.
- **How sure:** high (seen, and in the code).

**W2. A request to be a case manager carries only a name and a city.**

- **Screen:** Priya Nair (`super-admin-screens--request-review`).
- **Steps:** Home, then the request.
- **What happened:**
  - The request shows "Wants to be a case manager · Typed: Philadelphia · Asked Oct 15", plus
    "Text Priya", Approve and Deny.
  - `staff_requests` holds a first and last name, the city and, for a program, the program
    (0046 and later). For a case manager there is nothing about where they work or who they help.
  - An approved case manager sees members' visits, points and last day on Pam.
- **Shot:** `shots/2026-10-15-sa-request.png`.
- **Expected:** something to check: an organisation, a work email or a reference, or at least a
  prompt to text them before approving.
- **How sure:** high that nothing else is asked. Whether more should be is Will's call.

**W3. Answer by text shows a raw number and an empty box.**

- **Screen:** Answer by text (`super-admin-screens--answer-by-text`).
- **What happened:** the screen shows "To" and a number in `+1…` form, "Your answer", "0 of 120"
  and Send text. It doesn't say who wrote or what they asked.
- **Shot:** `shots/2026-10-15-sa-answer-by-text.png`.
- **Expected:** the person's name (if any) and their question above the answer, and the number
  written as a person reads it.
- **How sure:**
  - high on what the screen shows;
  - medium on how often Will sees the question elsewhere first (the help email has it, D-559).

**W4. Reported places don't reach Home.**

- **Screens:** Home (`super-admin-screens--home`), then Profile, then Reported places.
- **What happened:**
  - Home lists staff requests and a "Programs to check" row. Reported places are only under
    Profile, or the bell.
  - On Reported places, the reason is the smallest text on the screen (12px): "Something here is
    wrong, like the address or the phone". Nothing says what is wrong.
  - The only choices are Keep it and Take it off the list.
- **Shot:** `shots/2026-10-15-sa-reported.png`.
- **Expected:**
  - a "Reported places" row with a count on Home, like Programs to check;
  - the reporter's words, if they gave any;
  - a way to fix the detail, not only keep or remove.
- **How sure:**
  - high on where it lives and on the sizes;
  - medium on what reports carry. With example data I could only see the reason.

### Polish

- **P1. Home's "Programs to check" row has no count**, and each request reads "Typed:
  Philadelphia". "Typed" is a builder's word.
- **P2. Back labels don't match the way in.**
  - Programs to check, opened from Home, says "Back to Profile".
  - After a decision, the Requests list says "Back to Everyone".
- **P3. "To look at: 4" counts a withdrawn program** ("Corner Pantry · Withdrawn — started over").
- **P4. A program to check shows its phone as `+1…` digits, not tappable**, and its website and
  address aren't links. Checking them means copying each one.
- **P5. Everyone:**
  - each person has a switch named only "Demo view", so a screen reader hears three identical
    switches;
  - a person's row doesn't open their page.
- **P6. Profile's list of work (Invite someone, All programs, Everyone, Staff requests, Programs to
  check, Reported places) is named "Settings"** for a screen reader.
- **P7. The invites log's states ("Link open", "Active", "Link expired") are 12px.**

## 4. What worked (keep it)

- **Home is the work:** Requests first, each one saying who, what for and when they asked.
- **Ask for changes asks for kindness:** "The leader will read this. Keep it kind and specific."
- **Approving needs a city** (`decide()` stops and asks for one) before a staff account exists.
- **No sideways scrolling** on any of the eleven screens at 320, in English, Spanish or Arabic.
- **Every outside host stayed shut.** The one asked for is an allowed example-only photo host.

## Not covered this pass

- **The live app**, signed out or in.
- **Screen readers on a phone:** VoiceOver and TalkBack.
- **Contrast in dark mode:** looked at, not measured.
- **Actually sending a text,** and the invite flow (the same screens as the case manager's).

## The first pass, done

All four roles have had a first pass:

- [Member](2026-10-10-member-flow.md) (and [again](2026-10-15-member-flow.md));
- [Case manager](2026-10-15-case-manager-flow.md);
- [Program lead](2026-10-15-program-lead-flow.md);
- Super admin, this report.

From here, the weekly Thursday pass covers the flows that changed that week.

Iris
