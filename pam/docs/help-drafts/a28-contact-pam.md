# A28 words: Contact Pam, the Help screen, "Still stuck?", and every "call Pam" line

Words by Sage for Will to sign (A28, Will 11 October 03:06: "Problem -> help desk -> email forward", "take off phone
number"). Dot, Lena, Wren and Nico build from these. English only; Lena carries the signed English into the other six.

## 1. The action that replaces Call (Notice, HelpBar)

| Key | Now | Proposed |
|---|---|---|
| `help.callSupport` | Call Pam for help | **Contact Pam** |
| `help.needHelp` | Need help? Call Pam | **Need help? Contact Pam** |
| `help.menu.call` | Call Pam | **Contact Pam** |

"Contact Pam" opens the app's Help screen, which leads to the help desk. **It must work signed out** (sign-in errors and
a paused account show it to someone who cannot get in): signed out, it can open the help desk on the website directly.

**Keys (Mira and Lena, 03:17–03:19):** the Contact Pam button is Dot's new key **`help.contact.action` = "Contact Pam"**.
The Help screen rows in §2 move to Lena's new keys (table below); the words are unchanged. Error and notice bodies (§4)
and the privacy and terms lines keep their keys and are rewritten in place. **Lena applies all of it to en.json after Will
signs**; nobody else edits en.json for these.

| Old key in §2 | Lena's new key | Words |
|---|---|---|
| `help.menu.call` | `help.desk.label` | Contact Pam |
| `help.call.body` | `help.desk.body` | Our help desk answers what people ask most, in plain words. Search it in your own words. |
| `help.closed.heading` | `help.stuck.heading` | Still stuck? |
| `help.closed.body` | `help.stuck.body` | Write to us from the help desk. A person at Pam reads every message. |
| `help.safety.call.heading` | `help.safety.talk.heading` | Talk to someone now |
| `help.safety.call.body` | `help.safety.talk.body` | In crisis? Call or text 988. Someone answers day and night. |

Deleted when nothing uses them (Lena): `help.call.heading`, `help.call.action`, `help.call.body`, `help.menu.call`,
`help.closed.*`, `help.safety.call.*`.

**988 needs its own tap.** The safety row says "Call or text 988" but opens the safety post. A person in crisis should
not have to read a post to reach 988, so I recommend a second row beside it: **"Call or text 988"**, opening the phone's
dialler for 988. The first row keeps "Talk to someone now" and opens the safety post. Will's call; Lena builds one row
until he says.

## 2. The app's Help screen, without "Call us"

| Key | Now | Proposed |
|---|---|---|
| `help.intro` | Someone at Pam can help you. You do not need to know what to ask for. | *(keep)* |
| `help.call.heading` | Call us | **Find an answer** |
| `help.call.body` | We answer Monday to Friday, 9am to 5pm. The call is free. | **Our help desk answers what people ask most, in plain words. Search it in your own words.** |
| `help.call.action` | Call Pam | **Open the help desk** |
| `help.closed.heading` | If we are closed | **Still stuck?** |
| `help.closed.body` | Leave a message and we will call you back the next day we are open. | **Write to us from the help desk. A person at Pam reads every message.** |
| `help.safety.danger.body` | Call 911 first. You don't need to call Pam. | **Call 911 first.** |
| `help.safety.call.heading` | Talk to someone | **Talk to someone now** |
| `help.safety.call.body` | Tell us what happened. You don't have to explain everything. | **In crisis? Call or text 988. Someone answers day and night.** *(the terms' own line, `terms.s.emergencies.p2`)* |

Why 988 replaces "tell us" in the safety section: without a phone line, Pam can't be "someone to talk to" in a crisis,
and an email is too slow for one. 988 is real, free and always on. "Report a message" (`help.safety.message.*`) stays.

## 3. "Still stuck?" on the help desk

Shows at the end of a post and when a search finds nothing, never first.

**For now (the address):**
- Heading: **Still stuck?**
- Body: **Write to us at hello@joinpam.org. Tell us what happened and what you see on the screen. A person at Pam reads every message.**
- On an empty search, above it: **We do not have an article for that yet.**

**Later (the form, built off until Will says so):**
- Heading: **Still stuck?**
- Lead: **Tell us what happened. A person at Pam reads every message.**
- Field: **What's wrong?** · hint: **In your own words. You don't need to know what to ask for.**
- Field: **How should we answer you?** · **Your email** *(and, if Will says yes, **Or a phone number we can text**)*
- Line under the button: **We send what you write, this page and the language you read in. Nothing else from your account.**
- Button: **Send to Pam**
- Sent: **Sent. Thank you.** / **A person at Pam will read it and write back.**
- Failed: **That did not send.** / **Check your connection and try again, or write to hello@joinpam.org.**

No reply time is promised until the team knows what it can keep.

## 4. Every "call Pam" line in the app (`en.json`)

Pattern: a failed action says "Try again. If it keeps happening, contact Pam." A screen that can't help says "Contact
Pam…" with what we will do. "This is not your fault" stays wherever it was.

| Key | Now | Proposed |
|---|---|---|
| `account.change` | Something wrong here? Call Pam and we will fix it with you. | Something wrong here? Contact Pam and we will fix it with you. |
| `admin.invite.failed.body` | This is not your fault. Try again, or call Pam and we will help. | This is not your fault. Try again. If it keeps happening, contact Pam. |
| `admin.notAdmin.body` | Your account does not open this. If that is wrong, call Pam and we will fix it. | Your account does not open this. If that is wrong, contact Pam. |
| `directory.empty.body` | Pick a different kind of person, or invite somebody. Call Pam if you expected to see someone here. | Pick a different kind of person, or invite somebody. Contact Pam if you expected to see someone here. |
| `directory.notSuper.body` | Your account does not open this. If that is wrong, call Pam and we will fix it. | Your account does not open this. If that is wrong, contact Pam. |
| `flag.failed.body` | Your connection dropped, or the place is already reported. Try again, or call Pam. | Your connection dropped, or the place is already reported. Try again, or contact Pam. |
| `invite.expired.failed` | That did not go through. Try again, or call Pam. | That did not go through. Try again, or contact Pam. |
| `join.failed.body` | This is not your fault. Try again, or call Pam and we will finish it with you. | This is not your fault. Try again. If it keeps happening, contact Pam. |
| `join.staff.title` | Someone will call you | **We will text you** *(see below)* |
| `messages.start.failed.body` | Your connection dropped. Try again, or call Pam and we will help. | Your connection dropped. Try again. If it keeps happening, contact Pam. |
| `messages.thread.failed.body` | *(same)* | Your connection dropped. Try again. If it keeps happening, contact Pam. |
| `messages.thread.notFound.body` | It may have been removed, or the link was wrong. Call Pam and we will help. | It may have been removed, or the link was wrong. Go back to Messages and look for it there. |
| `messages.report.failed.body` | Your connection dropped, or this message was already reported. Try again, or call Pam. | Your connection dropped, or this message was already reported. Try again, or contact Pam. |
| `messages.blocked.theirs.body` | …You can still read it. Questions? Call Pam. | …You can still read it. Questions? Contact Pam. |
| `notice.account_limited.body` | …You can still read your messages. Call Pam and we will help you reach your guide. | …You can still read your messages. Contact Pam and we will help you reach your guide. |
| `notice.account_suspended.body` | You cannot sign in right now. Your guide can turn it back on. Call Pam and we will help you reach them. | You cannot sign in right now. Your guide can turn it back on. Contact Pam and we will help you reach them. |
| `notice.feature_turned_off.body` | Your guide turned this off. Call Pam if you have questions. | Your guide turned this off. Contact Pam if you have questions. |
| `notice.no_mentors_found.body` | Check back soon. You can also call Pam and we will help you find someone. | Check back soon. You can also contact Pam and we will help you find someone. |
| `notice.no_places_found.body` | Try a bigger distance, or pick a different kind of help. You can also call Pam and we will look for you. | Try a bigger distance, or pick a different kind of help. You can also contact Pam and we will look for you. |
| `notice.service_not_available.body` | It may come back. Call Pam and we can help you find another place. | It may come back. Contact Pam and we can help you find another place. |
| `notice.something_went_wrong.body` | This is not your fault. Try again, or call Pam and we will help. | This is not your fault. Try again. If it keeps happening, contact Pam. |
| `places.reported.failed.body` | Your connection dropped. Try again, or call Pam. | Your connection dropped. Try again, or contact Pam. |
| `saved.failed.body` | Your connection dropped. Try again, or call Pam and we will help. | Your connection dropped. Try again. If it keeps happening, contact Pam. |
| `signin.failed.send.body` | This is not your fault. Check the number, or call Pam and we will sign you in. | This is not your fault. Check the number and try again. If it keeps happening, contact Pam. |
| `signin.failed.verify.body` | Codes stop working after 10 minutes. Ask for a new one, or call Pam. | Codes stop working after 10 minutes. Ask for a new one. Still stuck? Contact Pam. |
| `onboarding.phone.callInstead` | Call me instead | **Remove the key.** No screen uses it (checked: only the locale files and the ledger name it). |

**`join.staff.title`, "Someone will call you":** it is Pam phoning out. It shows after someone asks to be staff
(`JoinScreen.tsx`, with `join.staff.body` "We check every request by hand before we open an account. It takes a day or
two."). The answer to a staff request reaches them as a text, and a staff-request decision is one of the account texts
that go out even while `texts_live` is off (D-481). So "We will text you" is true.

### Privacy and terms (Lena carries these; they are promises)

| Key | Now | Proposed |
|---|---|---|
| `privacy.s.contact.p1` | If something here worries you, call us. A person answers. | If something here worries you, write to us at hello@joinpam.org. A person reads every message. |
| `privacy.s.limits.p2` | …A paused account cannot sign in. You can always call Pam for help. | …A paused account cannot sign in. You can always contact Pam for help. |
| `privacy.s.translation.p3` | …If a message matters, ask the person or call us. | …If a message matters, ask the person. |
| `privacy.copy.body` | Call Pam and ask for a copy of what we keep about you. We will check that it is really you first. | Contact Pam and ask for a copy of what we keep about you. We will check that it is really you first. |
| `privacy.delete.body` | Call Pam and ask us to delete your account. We will check that it is really you, then delete it. | Contact Pam and ask us to delete your account. We will check that it is really you, then delete it. |
| `terms.s.limits.p2` | …Either way, you can always call Pam for help. | …Either way, you can always contact Pam for help. |
| `terms.s.limits.p3` | When something is turned off, Pam tells you it is off and who to call. | When something is turned off, Pam tells you it is off and who to ask. |

### Kept, on purpose
`place.call` "Call this place", `place.quick.call` / `action.call` "Call" (a place's number), `place.hours.sample` and
`places.source` "call before you go", `points.way.call` "Call a place", `terms.s.programs.p2` "Call ahead",
`terms.s.emergencies.*` (911, 988), `help.safety.danger.action` "Call 911", `onboarding.name.title` "What should we call
you?", `join.program.step.name` "What's your program called?". `onboarding.admin.1` "…without chasing calls" is not a
call to Pam (it is in the surveillance FINDING already).

## 5. Two live texts that carry Pam's number (`sms-templates.ts`)

They go today (account texts aren't held). Nico changes the templates; Lena carries the six translations (70
characters in Chinese, Russian and Arabic). No role named, no emoji, "Pam:" first.

| Template | Now | Proposed | Length |
|---|---|---|---|
| `staff_request_denied` | Pam: Your request was not approved. Questions? Call {supportPhone}. | **Pam: Your request was not approved. Questions? Visit joinpam.org/support** | 72 |
| `access_limited_notice` | Pam: Some parts of Pam are turned off for now. Call {supportPhone} with questions. | **Pam: Some parts of Pam are turned off for now. Questions? Visit joinpam.org/support** | 83 |

- Will asked (17 September) that someone denied "has somewhere real to ask why". The help desk leads to "Still stuck?"
  and a person, so it still does.
**The HELP auto-reply** (set in Will's Twilio console, Advanced Opt-Out; filed in `docs/sms-campaign-samples.md`):

| Now | Proposed | Length |
|---|---|---|
| Pam: Call {supportPhone} and a person will help you. | **Pam: Get help at joinpam.org/support or write to hello@joinpam.org. Reply STOP to stop.** | 87 |

It names Pam, gives a support contact (a web address and an email both count for carriers), says how to stop, and fits
one segment. Will pastes it when he refiles; Nico updates the samples file.

- Both need a person who reads them to sign again (`reviewedBy` cleared on the English change). The registered campaign
  samples (`docs/sms-campaign-samples.md`) may need the new wording: Nico to check.

## 6. Note for Will
The help desk is English only for now. A help request written in any language still reaches you.

## Questions for Will
1. **A phone number on the form so you can text back?** Many residents may not have, or check, an email. It needs
   member texts to be live for staff replies, and a way to send them.
2. **Checking it's really you, by email.** The copy and delete lines promise "we will check that it is really you". On
   the phone that was a conversation; by email it needs a method (for example, a code sent to the account's phone).
3. **The privacy contact line names the address directly** (`privacy.s.contact.p1`), skipping the help desk, because a
   privacy worry should not have to search first. OK?
