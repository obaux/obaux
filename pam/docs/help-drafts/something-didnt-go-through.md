# Draft post: When something doesn't go through

**For Wren to build** (slug `something-didnt-go-through`; topic: members; on the site and in the app's Help).
Words by Sage, signed under A29 (Mira 00:40: yes to the post; Will 00:13, D-618). **Goes live with D-618, not
before**: the site shows only what the live app does. Dot points the alert's "Get help" button here.

The headings are the alert's own titles (`notice.malfunction.<kind>.title`: `ab6b9cc4`, `5c1956c9`, and refused as revised
00:50), so a person can match what they saw. App words in brackets.

---

**Title:** When something doesn't go through

**Who it's for:** Everyone

**Summary:** What each message means when something you tap doesn't work, and what you can do about it.

**Keywords:** didn't go through, didn't work, not working, error, failed, offline, signed out, try again, slow,
something's wrong, couldn't use that, not at this time, already changed

**Lead:** When something doesn't work, Pam shows a short message at the bottom of the screen. Find its title below.

## You're offline
Your phone has no internet right now. (`notice.malfunction.offline`)
1. Check that Wi-Fi or mobile data is on.
2. If you're on Wi-Fi, try turning it off to use mobile data, or the other way round.
3. When you're back online, tap "Try again".

## That took too long
Your phone is online, but the answer didn't come back in time. (`notice.malfunction.timeout`)
1. Move to where the signal is stronger, or switch between Wi-Fi and mobile data.
2. Tap "Try again".

## You're signed out
Pam signs you out after a while. (`notice.malfunction.signedOut`)
1. Tap "Sign in". Pam texts you a code.
2. Then do it again.

## This account can't do that
The account you're using isn't allowed to do this here. (`notice.malfunction.notAllowed`)
- If you have more than one Pam account, check that you're signed in to the right one.
- If you run a program and use Pam as a member too, check which side you're on.

## This was already changed
Someone changed it before you, or it's already done. (`notice.malfunction.changed`)
1. Tap "Show the latest".
2. Look at what's there now. You may not need to do anything.

## This isn't here anymore
It was removed, for example a visit that was cancelled. (`notice.malfunction.gone`)
- Go back to see what's there now.

## Not at this time
Some things can only be done near the time of a visit. (`notice.malfunction.wrongTime`)
- A program lead can mark someone as there from 2 hours before their visit.
- "I'm here" works on the day of your visit, near its time.

## Pam couldn't do that
Pam couldn't use what was sent. Trying the same thing again won't help. (`notice.malfunction.refused`)
- Check what you typed or chose. A photo may be in a kind Pam can't read: pick another one.
- If everything looks right, tap "Get help".

## Something's wrong on our side
It's not your fault. (`notice.malfunction.server`)
1. Wait a moment.
2. Tap "Try again".

## Still not working
This shows when the same thing doesn't go through twice in a row, unless you're offline. (`notice.malfunction.again`)
- Try the steps above for the message you saw first.
- Tap "Get help" to find more help in Pam.

---

## Notes for Wren

- **Checks against today's app:** "Pam texts you a code" (`cant-sign-in`); "mark someone as there" from 2 h before
  the visit (Iris 6077dbd8, `OUTSIDE_THE_VISIT_WINDOW`); a photo Pam can't read (Iris: HEIC). For "I'm here" I give
  no number on purpose: the card and the database disagree about when it closes (Iris rows 36–37). Put a number in
  once Piper makes them match.
- **"Two sides" line:** this rests on `one-phone-two-sides`. Drop it if that post's rule changes.
- **"Contact Pam" is never named** (Will 00:13). The post's "Still stuck?" block (`StillStuck`, on every post) is the way to a
  person, last, as A28 wants.
- `tooMany` isn't here, because Iris found it never reaches the alert.
