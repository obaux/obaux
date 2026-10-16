# Member flow: first pass (10 October 2026)

Iris, User Research & Testing Lead. The first pass of the Member flow, from Will's ask
(10 October): "I'd also like to add a team member for user testing each flow and research."

## 1. The flow and the person

**Who:** Marcus, a returning citizen who hasn't used a phone in years. A case manager
has texted him an invite link. He reads slowly, taps what looks like a button, and doesn't
know the words "tab", "icon" or "scroll". On many cheap Android phones the browser bar
eats about 70px, so a 640-tall screen leaves him roughly 568px of page.

**Starting where:** signed out, on sign-in, opened from the invite link.

**Trying to:** join; find a place; save it; plan a visit; see the trip; sign the
program's policy; find help.

**Where tested:**

- the clickable prototype on Chromatic (`member-invited-by-case-manager--whole-way`,
  `member-app-prototype--prototype` and the `member-created--*` screens);
- the app built from `main` (`pnpm --filter @pam/web build`, served from `out/`, with every
  request outside localhost blocked);
- **not** the live app. The environment's network policy refused `app.joinpam.org`, so
  nothing in this report was seen there. The sign-in finding was reproduced in the local
  build, which is the same code.

**How:** Playwright in Chromium, touch emulated, at 390×844 and at 320 wide (320×700 and
320×568), with 360×640 and 375×667 for the sign-in check. Light and dark, English and
Spanish, and Arabic for the screens where right-to-left matters. On each screen I measured
the tap targets, the text sizes and the contrast, and checked a tap actually reaches the
target where size was in doubt.

## 2. What happened

| Step | Taps | Screen |
|---|---|---|
| Sign in from the invite | 2, plus typing the number and the code | Sign in (invite banner), then Enter your code. Six digits sign him in with no extra tap |
| Join | 4, plus typing his name | About you (1 of 3), then What others can see (2 of 3), then Text messages (3 of 3), then You are in, then Start |
| Find a place | 1 | Explore: tap a card |
| Save it | 1 | The bookmark icon on the place |
| Plan a visit | 6 | Pick a service, Plan a trip, a day, a time, Next, Add this trip |
| See the trip | 1 | Your trip is booked, then Done, which lands on Trips |
| Sign a policy | 4, plus drawing a signature | Sign (Trips banner), Start signing, Sign, draw, Sign |
| Find help | 2 | Profile, then the ? icon (or the Get help row); 3 to start a call |

**Total: about 21 taps** from the invite link to one policy signed and Get help open, plus
typing and one signature. Every step can be finished, except on a short screen (S1 below).

## 3. Findings

### Stops someone

**S1. On a short screen, the legal links cover "Send me a code".**

- **Screen:** Sign in, `/signin/` (`member-invited-by-case-manager--sign-in`,
  `member-created--sign-in`; `LegalFooter.tsx` is `position: fixed` at the bottom).
- **Steps:** open the invite link (`/signin/?invite=…&as=member`) on a 320×568 viewport.
- **What happened:** the About Pam / Privacy / Terms row sits on top of the primary button.
  A tap on the middle of the button opens Privacy or Terms instead. The button appears only
  if you scroll the page.
  - 320×568, invited: covered in English, Spanish and Arabic.
  - 320×568, not invited: covered in Spanish, clear in English and Arabic.
  - Clear at 360×640, 375×667 and 390×844.
  - Reproduced in the local build, not just Storybook.
  - Shot: `shots/2026-10-10-member-signin-320x568-invited.png`.
- **Expected:** the first button Pam ever shows him is fully visible and does what it says.
- **How sure:** high that it happens at a 568px-tall viewport. Medium on how many members
  have one: a 320×568 iPhone SE, or a 640-tall Android once the browser bar is counted.
  This is the first screen, so a member who hits it never gets in.

### Slows someone

**W1. No visible help on the main screens.**

- **Screens:** Explore, Saved, Trips, a place, and New trip step 1 have no help link or ?
  (`member-created--explore`, `--saved`, `--trips`, `--place-profile`, `--new-trip`).
  Help is visible on Profile (the ? icon and a Get help row) and on step 2 of a trip.
- **Steps:** sign in, land on Explore, look for help.
- **What happened:** help is two taps away, through Profile. Nothing on Explore says it is
  there.
- **Expected:** §0, "every screen has a visible way to get help". The exceptions Will
  signed (A8, A9, A14, A15, A19, A20) cover reminders, sign-in, the conversation,
  Messages, hero screens and What you sent, not these. A member stuck on a place screen
  has to already know help lives under Profile.
- **How sure:** high that it is missing. Medium that it wasn't decided somewhere I didn't
  find (the D-456 tab redesign).

**W2. Join step 2 of 3 has no way back and no way to call.**

- **Screen:** What others can see, step 2 of 3
  (`member-invited-by-case-manager--whole-way`).
- **Steps:** invite link, code, About you, Next.
- **What happened:** the only control is "I understand". There is no back arrow (steps 1
  and 3 both have one) and no help. The screen says "If something here worries you, call
  us. A person answers.", but there is no number and nothing to tap.
- **Expected:** a way back to step 1, and a "Call Pam" he can tap on the one screen that
  invites worry.
- **How sure:** high. Shot: `shots/2026-10-10-member-join-step2-no-back.png`.

**W3. "Plan a trip" is greyed out and doesn't say why.**

- **Screen:** a place (`member-created--place-profile`).
- **Steps:** Explore, tap a place.
- **What happened:** "Plan a trip" is faded and does nothing until a service is chosen
  under "Pick a service". Nothing says that is the missing step.
- **Expected:** either the button works and asks for the service next, or a line under it
  says "Pick a service first".
- **How sure:** medium. Shot: `shots/2026-10-10-member-place-plan-disabled.png`.

**W4. Some tap targets are under 48px.**

- **Screens:** Trips banner, a policy, the signature sheet (`member-created--trips`,
  `--place-policy`).
- **Steps:** Trips with policies left to sign; then open a policy and start signing.
- **What happened:** the targets measure:
  - the Trips banner's "Sign": 34px wide, 25px in Arabic;
  - the policy's "Done" in Arabic: 24px wide;
  - the signature sheet's "Clear": 40px wide.

  A tap 20px from the centre misses the first two.
- **Expected:** 48px or more, or the whole banner tappable.
- **How sure:** high (measured, and taps tested).

**W5. Policies opened from Trips have two ways out.**

- **Screen:** Policies to sign (`member-created--place-policies`).
- **Steps:** Trips, then the banner's Sign.
- **What happened:** the header has both a back arrow ("Back to this place") and "Done".
  He came from Trips, not from a place. I didn't check where each one goes.
- **Expected:** one way out, named for where it goes.
- **How sure:** medium.

**W6. An invited newcomer is told to "Sign in".**

- **Screen:** Sign in with the invite banner.
- **What happened:** the banner says "You were invited to join the Pam network. Sign in to
  get started." The title is "Sign in". Someone who has never had an account may think
  he needs one first, or that the link is for someone else.
- **Expected:** words for a first time, such as "Join Pam" or "Get started", while an
  invite is present.
- **How sure:** low to medium. Worth asking a real member.

### Polish

- **P1. Saving says nothing.** The bookmark fills in and that's all, with no "Saved"
  shown in words (`member-created--place-profile`).
- **P2. "Program" and "place" are used for the same thing:** "Search programs", "All
  programs", "About program" and "Save this place", "Back to this place". "About program"
  also reads oddly; "About this program" is clearer.
- **P3. "Nothing is booked", then "Your trip is booked".** Step 2 says "Example trips only
  for now — nothing is booked with the program yet." The next screen says "Your trip is
  booked". This only happens on example places (`NewTripView.tsx`, D-454), so a live
  member sees it only on demo data.
- **P4. Primary buttons are 48px tall, not 56 (A16):** Next, I understand, Start, Plan a
  trip, Add this trip, and Sign on a policy. "Yes, text me reminders", Done and Start
  signing are 56.
- **P5. Arabic, the program's own English text:** the sentence's full stop lands on the
  wrong end (".permission", ".Drop in any afternoon") on a place and a policy. Shot:
  `shots/2026-10-10-member-policy-ar-dark-320.png`.
- **P6. Arabic at 320:** a trip card's title is cut off ("Example Learning…") rather than
  wrapped.
- **P7. Words a member wouldn't use:**
  - "Rooted" and "Your first points are on the board" on You are in, with no word on what
    a level is;
  - "Confidentiality and disclosure" and "Liability disclaimer" as policy titles (these
    are the program's, but a plain subtitle would help);
  - "Reply STOP any time and they stop for good" may read as "you can never turn them
    back on".
- **P8. Trips cards carry a 9.6px "S" or "M" in a circle** with no word on who that is.
  For a trip with no person, the card's spoken name ends in a dangling "with".
- **P9. Get help, opened from Profile, says "Back to Home".**
- **P10. Text under 16px (A23)** on field labels ("Your phone number", "First name"), the
  line under Send me a code, help-row subtitles, a 12px category chip, an 11px "Your
  badge", and 12px tab labels. Some may count as supporting rather than body text.
- **P11. A drop-in place asks for a time.** "Drop in any afternoon", but the trip asks for
  a 9:00 AM–3:30 PM slot.
- **P12. Spanish switches register:** sign-in uses *usted* ("Vea lo que su ciudad le
  ofrece", "Su número"); in the app, New trip uses *tú* ("Elige un programa. Tus
  guardados").

## 4. What worked (keep it)

- **The code signs him in on the sixth digit.** No extra "Sign in" tap.
- **Joining is three short, numbered steps** ("1 of 3"), and the text opt-in has a real
  "Not now".
- **Your trip is booked** gives the day, the time, "In 3 days" and a way to change it.
- **The signature is kept for the next policy** ("so the next policy takes one tap").
- **Get help opens kindly:** "You do not need to know what to ask for" and "The call is
  free".
- **Contrast:** no text under WCAG AA contrast on the screens measured, light or dark.
- **No sideways scrolling at 320,** in English, Spanish or Arabic, and Arabic mirrors the
  layout properly.
- **Every list row** (Profile, Get help) **is a 64px tap,** even though the words in it are
  smaller.

## Not covered this pass

- **The live app:** blocked by this environment's network policy.
- **Screen readers:** VoiceOver and TalkBack.
- **A real phone's keyboard and browser bar.**
- **The other three policies.**
- **Changing or cancelling a trip.**
- **An invite that has expired or is already in use.**

Iris
