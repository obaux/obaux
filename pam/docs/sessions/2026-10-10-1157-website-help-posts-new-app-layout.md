# 2026-10-10 — website: help posts for the new app layout

**Branch:** `claude/compassionate-bohr-mzrchf` (restarted from main `522c808`) · **Lane:** Website

## What changed

Per post (Dot's shell, D-456, goes live with the night's deploy; screens read on main's Storybook):

- **Who is my guide**: the way to "What others can see" is Profile → **Legal** → "What others can see"
  (Profile no longer has a row for it). Caption says "opened from Legal".
- **Points and badges**: Profile has a **badge tile** ("Your badge") that opens Points, not "your points".
  The post said the Points screen lists more ways to earn than Pam pays; it now lists only the two real ones
  (the points-promise fix), so that sentence is replaced. Picture retaken, taller, with "Ways to earn".
- **One phone, two sides**: after "Use Pam as" you land on **Explore** (Me) or **Home** (My program).
- **Messages in Pam**: "New message" is the button at the top right; "More options" opens an **Options**
  screen (new picture) with Report suspicious activity; a new message shows on the bell and a dot on the
  Messages tab (staff also on their Home).
- **Texts from Pam**: Profile → "Text reminders" row only once you said yes; otherwise a "Get text
  reminders" card ("Get text alerts" for staff); messages show on the bell and Messages tab.
- **Joining Pam**: only the "About you" picture's description (it now shows the language choice and Next).
- **Unchanged, checked**: Joining as staff, Sending an invite (case manager Home and Profile; super admin
  Profile; program lead's + menu are on the old staff screens), What others can see, Pam words, Staff
  requests (draft), Case manager assignments.
- One screenshot run, from main's Storybook: 14 pictures, 3 differ (about-you, points, plus the new
  options); the rest are pixel-identical because Storybook already showed the redesign.

## What was wrong, and what missed it

- The posts' steps were written against Storybook screens but named the old routes in words ("Tap
  Profile → What others can see"). Nothing compares a post's steps with the app's menus; only reading the
  Profile, Legal and Options screens found it. Left for later: a check that each quoted label exists in
  `en.json` (listed in before-launch).
- The Points post's sentence about "more ways to earn" went stale when the points-promise fix merged, and
  nobody was told. Found by looking at the new screenshot.

## Decisions made

None new.

## Verified

- tsc, site tests, normal build and `a11y.mjs` (see the READY note for the numbers).
- Read on main's Storybook: Profile (with and without reminders on), Legal, Options, Messages, Use Pam as,
  Points.
- Not seen: the deployed app after tonight's deploy; staff Homes (still the old ones).

## Left undone

- Block ("Block this person", D-463) is not in a post. Staff Home steps change when Dot's staff Homes land.
- The app's onboarding slide still promises reminders (`onboarding.3`): not this lane.

## Needs a human

- Will: sign the English of About Pam.
