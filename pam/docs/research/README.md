# User testing and research

Iris's lane (User Research & Testing Lead; `docs/team.md`, "User testing and research").
Will, 10 October 2026: "I'd also like to add a team member for user testing each flow and
research."

## The measure

Pam's own question: *can a person who hasn't used a phone in 8 years enroll in a program,
get to it, and keep going, without help?* Every finding answers it for one person, on one
screen.

## A pass

One flow, one role, end to end: a member, a case manager, a program lead or a super admin.

- **Where:** the clickable prototype in Storybook
  (`https://main--6abea9193da46b88ce90890f.chromatic.com`), the app built locally with stub
  data (`node scripts/journeys.mjs`, the Playwright harness in `apps/web/e2e`), and the live
  app (`https://app.joinpam.org`) signed out only.
- **Never:** sign in to the live app, make an account or an invite, send a text or an email,
  or look at a member's data. A real person's phone gets whatever the live app sends.
- **How:** phone size (390 by 844, and 320 wide), light and dark, in English and at least one
  other language (Spanish, and Arabic for right to left, when the flow has words that matter).
  Count the taps. Note every dead end, every word a member wouldn't use, every target smaller
  than 48px, text under 16px, and anything that only works if you already know Pam.

## A report

`docs/research/YYYY-MM-DD-<flow>.md`, one per pass:

1. **The flow and the person:** who, starting where, trying to do what.
2. **What happened:** the steps, with the tap count.
3. **Findings, ranked:**
   - **Stops someone:** they can't finish without help;
   - **Slows someone:** they finish, but get lost, guess or go back;
   - **Polish:** they finish fine; it could be clearer or kinder.
   Each one: the screen (and its Storybook story id), the steps to get there, what happened,
   what the person would expect, and how sure you are.
4. **What worked:** so nobody "fixes" it.

Screenshots only of stub data, a few per report, in `docs/research/shots/`.

Then **one** FINDING note to the merge desk for the whole pass: the report's path and its
"stops someone" findings in a line each. Iris finds; Iris never fixes. The merge desk turns
findings into jobs for Will to choose from.

## Research

Only when Will asks. Write it up here, `YYYY-MM-DD-<topic>.md`, with every source linked,
what it says, how sure it is, and what it would mean for Pam in one paragraph at the top.
