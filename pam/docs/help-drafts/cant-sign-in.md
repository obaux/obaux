# Draft post: I can't sign in

**For Wren to register** (slug suggestion `cant-sign-in`; topic: getting started). Words by Sage, for Will to sign.
Will, 11 October 02:48: "When I type I can't login on help desk site, it should provide me with guidance, explaining
that anyone can be a member, and any member can create a program (I think that's true), but case managers must be
invited… provide instructions how to become a case manager. Also let's avoid people calling."
Every fact below is checked against the app and the published posts (Joining Pam, Joining as staff, Sending an
invite, Texts from Pam). Where Will's guess differs from the app, it's in "Check before it ships".
Answers: "i cant login", "cant sign in", "how do i join", "become a case manager".

---

**Title:** I can't sign in

**Who it's for:** Everyone

**Summary:** How to get into Pam: who can join on their own, who needs an invite, and what to do when the code or
the link doesn't work.

**Lead:** You sign in to Pam with your phone number. There is no password. Pam texts you a code.

## Who can join, and how
| You are | How you get in |
|---|---|
| **A resident** | Anyone can join on their own. Open Pam, sign in with your phone, and leave the code box empty. Pam is only in some cities for now. If it isn't in yours yet, you can save your city. |
| **Someone who runs a program** | Join as a resident, then ask us to add your program: Contact Pam and tell us its name and address. We check it by hand, then add it so people can find it. You can also join with an invite link from a case manager, a program lead or the Pam team. |
| **A case manager** | You join with an invite link. Another case manager or the Pam team can send you one. |

## I want to add my program
- Sign in to Pam as a resident first.
- Contact Pam and tell us your program's name and address. We check it by hand, then add it so people can find it.

## I want to be a case manager
- Ask a case manager you work with, or the Pam team, for an invite link. (Contact Pam, below.)
- The person who invites you sends you the link, by text or another app. Pam also emails it to you. Open it on your phone: it only works with the phone number it was made for.
- A link works once, for one person, and lasts 30 days. If it's too old, ask for a new one.
- More: Joining Pam as a case manager or program lead.

## The code didn't come
- Check your number has the area code, like 215 555 0100.
- Wait a minute, then tap "Send it again".
- More: Texts from Pam.

## The code didn't work
- A code works for 10 minutes. Ask for a new one, and type the code from the newest text.

## The invite didn't work
- "That code is too old" or "That code was already used": ask the person who invited you for a new one.
- "That code is for a different phone": use the phone number the invite was sent to, or ask for a new invite.
- Already have Pam on this number? Sign in as usual. Pam finds your invite.
- More: Joining Pam.

## Still can't get in?
- Contact Pam and tell us what you see on the screen. We'll get you in.

---

**When "Add my program" ships (Piper), swap in:**
- Table row: | **Someone who runs a program** | Anyone can add a program. Sign in, then tap "Add my program" [where Piper puts it]. Pam checks every program by hand before people can find it. |
- Section "I want to add my program": "1. Sign in to Pam. 2. Tap "Add my program" [place]. 3. Tell us what it is, where it is and how people reach you. 4. Pam checks it by hand. Your Program tab shows where it is." (the last line is `join.program.review.note`'s own promise)

**Check before it ships:**
- **Will, 03:22: "anyone should be able to create a program".** This replaces D-369's invite-only rule for programs. Until
  Piper's "Add my program" ships, the post says to ask through Contact Pam; the swap-in lines above are ready.
- **"Case manager links are sent by our team" is half true:** a super admin (the Pam team) can, and so can any case
  manager (Sending an invite: "A case manager: members, programs and other case managers").
- **"Contact Pam"** stands in for every "call Pam", per Will ("let's avoid people calling"). It needs the Contact Pam
  form (card a54) to exist before this ships. Until then, the line points at the existing help.
- **"Already have Pam on this number? Pam finds your invite":** from `invite.who.note` ("If they sign in to Pam with it,
  Pam finds the invite even without the link").
- Checked with Mira (03:15): Pam does not text a case manager's invite (no admin invite template; with `texts_live` off only verify_code, staff_request_*, access_limited_notice, invite_member and invite_provider go out). The inviter sends the link with "Send the link" (Sending an invite), and staff invites are emailed (`invite-email.ts`). So the post says the inviter sends it and Pam emails it.

- "We check it by hand, then add it" is true whichever way the team adds it today (by hand, or by approving a staff
  request, D-491). Asked Piper to confirm (Mira, 03:29).
