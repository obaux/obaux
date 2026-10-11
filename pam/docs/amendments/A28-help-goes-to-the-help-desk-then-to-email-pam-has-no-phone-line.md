# A28 — Help goes to the help desk, then to email; Pam has no phone line

**Date:** 2026-10-11 · **Branch:** `mira/a28`

Will, on the Control Room at 03:06 UTC, answering card a54 ("Support without phone
calls: Contact Pam instead of Call Pam"):

> "let's forward to hello@pam, but only after they've explored the help desk. This is
> the flow. Problem -> help desk -> email forward"

> "take off phone number"

Earlier the same night (02:48): "Also let's avoid people calling. We'll need to funnel
help desk tickets to my email. But you try to resolve them first. … The whole phone
call thing is not viable."

## What the SOP said

- §2.4: the HelpBar on every screen carries Pam's support number, and a person who
  cannot get in can still call. `useSupportPhone()` reads `app_settings.support_phone`
  and falls back to `NEXT_PUBLIC_SUPPORT_PHONE`.
- A26: "The help screen, Call Pam and the support number stay where they are." The last
  item on its list: "any screen that tells the person to call or ask, which must then
  let them do it."
- About thirty English strings end "…or call Pam and we will help". The help screen has
  "Call us · We answer Monday to Friday, 9am to 5pm".

## What it says now

**Pam has no phone line.** No screen, post, page, email or legal text shows Pam's phone
number or tells a person to call Pam. Calling a *place* is unchanged: a place's own
number, "Call this place" and "call before you go" stay.

**Getting help has one path, in this order:**

1. **The problem.** Where A26 requires a way to get help, the screen offers
   **Contact Pam** (or the screen's own words for it) instead of a Call button. It opens
   the help desk, not a dialler.
2. **The help desk.** The support centre on the website (`pam-site`): search that
   understands everyday words, and the posts. The app's Help screen leads there. A
   person is shown answers before anything else.
3. **The email forward.** Only after the help desk: at the end of a post, and when a
   search finds nothing, "Still stuck?" offers to write to Pam. The request goes to
   `hello@joinpam.org`, which reaches Will. It carries what the person typed, how to
   answer them, the page they came from and the language they read in. It carries no
   member records. Until the form is live, "Still stuck?" shows that address.

**A26 still holds**, with "Contact Pam" in place of "Call Pam": a visible way to get
help wherever a person can get stuck, and a screen that says "ask Pam" must let them
do it in one tap.

## What did not change

- The help desk's search and posts (D-499, D-501, D-506, D-507).
- No outward email goes out until Will says so: the form is built off, Nico sends one
  test to `hello@joinpam.org` on Will's "test it", and it switches on after he sees it
  arrive.
- `app_settings.support_phone` stays in the database, unread. Removing the row is a
  later clean-up, not part of this.
- Words are Sage's to propose and Will's to sign (`docs/lanes.md`); Lena carries signed English
  into the other six languages.

## Who builds what

| Lane | Part |
| --- | --- |
| Sage | the English: "Contact Pam", "Still stuck?", and every "call Pam" string rewritten; flags any line that is about Pam calling *out* (`join.staff.title`, `onboarding.phone.callInstead`) |
| Dot | `Notice` and `HelpBar` in `packages/ui`: the Call action becomes Contact Pam; `useSupportPhone` and every `supportPhone` prop come out |
| Lena | the app's Help screen and the privacy contact line; the signed strings in seven languages |
| Wren | the help site: no phone anywhere; "Still stuck?" at the end of each post and on an empty search, with the address now and the form later |
| Nico | the forward: an edge function that sends a help request to `hello@joinpam.org` with reply-to set to the person, rate-limited, off until Will's word |
| Iris | the whole path on a preview, as someone stuck: problem → help desk → email, in English and Arabic |
