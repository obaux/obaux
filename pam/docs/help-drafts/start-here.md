# Draft post: When something isn't working, start here

**For Wren to register** (slug suggestion `start-here`; topic: getting started). Words by Sage, for Will to sign.
Facts come from the app's own screens (keys in brackets), so the post says what Pam says. No phone number:
the site points to "Need help? Call Pam" in the app, like every post's "Still stuck?" card.
Answers the gap phrases: "why is this happening", "something went wrong", "the page is blank", "it wont load".

---

**Title:** When something isn't working, start here

**Who it's for:** Everyone

**Summary:** The most common reasons Pam gets stuck, and what to do about each one.

**Lead:** Most problems have a simple reason. Find yours below. None of them are your fault.

## The code didn't come
- Wait a minute. Texts can be slow.
- Check your phone number has the area code, like 215 555 0100. (`signin.phone.invalid`)
- Tap "Send it again". (`signin.code.resend`)
- More: Texts from Pam.

## The code didn't work
- A code works for 10 minutes. After that, ask for a new one. (`signin.code.hint`, `signin.failed.verify.body`)
- Type the code from the newest text.

## The invite code or link didn't work
- "That code is too old" or "That code was already used": ask the person who invited you for a new one. (`notice.invite_expired.*`, `notice.invite_already_used.*`)
- "That code is for a different phone": use the phone number the code was sent to, or ask for a new code. (`notice.invite_phone_mismatch.body`)
- More: Joining Pam.

## You can't send messages, or your account is paused
- Your guide turned this off. You can still read your messages. (`notice.account_limited.body`)
- If your account is paused, your guide can turn it back on. (`notice.account_suspended.body`)
- Call Pam and we will help you reach your guide.
- More: Case manager assignments.

## It says "You're offline"
- Your phone lost its connection. Your saved places and your plan still work. (`notice.offline.body`)
- Pam saves your changes. Try again when you have signal or Wi-Fi.

## It says "Something went wrong", or the screen stays empty
- This is not your fault. (`notice.something_went_wrong.body`)
- Close Pam and open it again.
- If the circle keeps turning, check your signal or Wi-Fi.
- If it keeps happening, call Pam and we will help.

## A place is missing or wrong
- "This place is not on Pam right now": it may come back. Call Pam and we can help you find another place. (`notice.service_not_available.body`)
- If a place is closed, has moved or is not what it says, open it and tap "Something is wrong here". (`help.place.body`)

*(Then the usual "Still stuck?" card.)*

---

**Check before it ships:** "Close Pam and open it again" and "If the circle keeps turning, check your signal"
are general advice, not app strings. They're true for a web app (A10: the waiting state is a spinner that
turns into an error notice), but Will should be happy with them.
