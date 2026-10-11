# A26 — Help where people get stuck, not on every screen (11 October 2026, Will)

Iris's first Member flow pass found that Explore, Saved, Trips, a place and the first
step of New trip carry no help button. Help was two taps away, through Profile. Asked
whether to put a help button back on each, Will (11 October 2026, Control Room):
"rewrite the rule, we don't need help on every screen."

## The rule now

**Every screen has a visible way back.** On a tab screen the tab bar is the way back.
This part has not changed.

**A visible way to get help is required where a person can get stuck:**

- every step of signing in and joining;
- a form: typing or choosing something, and any error it can show;
- anything that failed, or is waiting on someone else (sent, pending, expired, refused);
- each step of a task with more than one step (planning a trip, signing a program's rules);
- any screen that tells the person to call or ask, which must then let them do it.

**Screens for looking around don't need their own.** The tabs (Home, Explore, Saved,
Trips, Messages), lists, and a place's page. Help is always one tap from Profile, and
Home carries a Help link (`e2e/a11y.spec.ts`).

## Where this contradicts the original

§0 said every screen has a visible way to get help. That is replaced by the list above.
A8, A9, A14, A15, A19 and A20 stand as written: each described a screen where help was
left out or moved, and each is now simply a case of this rule.

## What did not change

- The way back is still on every screen.
- The help screen, Call Pam and the support number stay where they are.
- Iris's W2 is still a fix: step 2 of joining says "call us" and offers nothing to tap,
  which breaks both the old rule and this one.
- A screen that grows into a form or a multi-step task gets its help back. The hero
  template's own condition (A19) says the same.
