# Draft post: Telling Pam a place is wrong

**For Wren to register** (slug suggestion `a-place-is-wrong`; topic: places). Words by Sage, for Will to sign.
App words in brackets. Answers the gap phrase "this place is closed".

---

**Title:** Telling Pam a place is wrong

**Who it's for:** Everyone

**Summary:** If a place is closed, has moved, or is not what it says, tell Pam in a few taps.

**Lead:** You help everyone who comes after you.

## How
1. Open the place.
2. Tap "Something is wrong here". (`place.flag`)
3. Pick what is wrong: it is closed, it moved, they are not taking new people, or something like the address or the
   phone is wrong. (`flag.reason.*`)
4. Add anything else if you like. You can skip this. (`flag.note`)
5. Tap "Send this to Pam". (`flag.action`)

## What happens next
- Somebody at Pam looks at every report. (`flag.done.body`)
- Nobody at the place is told who said so. (`flag.intro`)

## If it didn't send
- Your connection may have dropped, or someone already reported the place. Try again, or contact Pam. (`flag.failed.body`, A28 wording)

---

**Check before it ships:** the app's thank-you screen also says "If the place comes off the list, anyone who saved
it is told." I left that out: if "told" means a text, member texts are not live yet (D-481). If it is a note in the
app's bell, it can go back in. FINDING for Lena / Nico to confirm.
