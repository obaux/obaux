# D-458 — The help posts: what they say, what was left out, and the pieces they are built from

**Date:** 2026-10-10 · **Branch:** `claude/compassionate-bohr-mzrchf`

**Decided by Will, 10 October 2026**, through Mira (the merge desk): "Tell Wren to audit
how the app works and create more helpful posts for users needing support in the app.
Have her come up with the most confusing parts of the product and start with those posts
first, making it easy to understand. Using simple language and screenshots, tables, when
possible." Mira added: only what is live today; the way to reach a person is the one Pam's
Help screen shows; screenshots from Storybook at phone width, pretend people only.

## What was done

- **The audit** (three readers, then the claims I ranked on checked against the code) found
  the ten most confusing parts; the list went to Mira as a FINDING, and the problems in the app
  itself went to her separately, by lane. Nothing in the app was changed.
- **Ten posts, most confusing first:** Who is my guide? · Texts from Pam · What your guide, a
  program and others can see (a table) · Joining Pam · Joining as a case manager or program lead ·
  Pam words (a table) · One phone, two sides · Sending an invite · Messages · Points and badges.
  **One hidden draft:** Staff requests (for super admins). Support's front list, "Start here",
  leads with the first six.
- **Each post** says who it is for at the top, ends with "Still stuck?" in the words Pam's own Help
  screen uses (no phone number written on the site), and uses the pieces in `apps/site/src/components`:
  `Steps` (numbered, wraps), `CompareTable` (a table wide, cards on a phone), `Screenshot`, `StillStuck`.
  Screenshots are taken by `apps/site/scripts/screenshots.mjs` from the Storybook build at 390px, listed in
  `screenshots.json`; every one is a pretend person or place.

## What the posts say, and what they leave out (the part to question)

- **Texts.** Written against the **live** `dispatch-sms` v15 and database, not the repo: only three kinds
  are ever queued (a saved place closing, and a staff request approved or denied); sign-in codes come from
  the phone-sign-in provider. So the post says plainly that Pam does **not** send visit reminders, message
  alerts or "someone wants to connect" texts yet, although the Reminders and Text alerts screens list them
  ("What we would send"). Revise it when those go live.
- **Who can message.** My audit said only staff could start a chat; D-176 says a member may start one with their own case
  manager or a program they joined. The post follows D-176.
- **Joining as staff.** Staff join by invite link only (D-369, Will: "we'll have special links for login for programs and case
  managers"). Nothing in the app lets anyone ask to be staff, so no post describes asking, and Staff requests is held.
- **The table of who can see what** has only rows the app's own promises (transparency.ts, the privacy page) support.
  Left out because nobody could stand behind a "No": a phone number, the language you chose, what Pam's own staff see, whether
  a program is sent a report. The privacy policy covers the rest. One row repeats the app's promise ahead of the database: "the
  last day you used Pam" is shown to a program, though the database does not yet hand it over (transparency.ts).
- **Who is my guide?** says a program-invited or self-signed-up member has none, and tells them to call Pam: there is no
  screen to assign one yet. **Revise it when the assign-and-limit work (Ava) merges.**
- **Points and badges** says only two things add points (saving a place, +5 once per place; finishing setup, +25 once) and that
  the Points screen's "Ways to earn" list shows more than are awarded. Category badges are not described: none is awarded.
- **Left out on purpose:** blocking (the terms say "You can block anyone"; no screen has it), message translation (off),
  voice notes, the email for an expired link (queued, nothing sends it), the "text me when Pam opens in my city" box, the
  "dot on the switch" for two sides.

## Why

The Help screen is where a person with no one else to ask lands. A post that explains a promise Pam does not keep sends them
back to it confused. So each topic says what happens today, and where the app and the truth disagree the post says what is
true and the disagreement goes to the lane that owns it as a FINDING.

## What a later session might reverse

Saying plainly in public that reminders are not sent yet (Will may prefer to wait until they are); the audience line
under each title; "Start here" showing six, not all.

