# Member flow: second pass (15 October 2026)

Iris, User Research & Testing Lead. This is the Member flow again, five days and fifteen batches
after [the first pass](2026-10-10-member-flow.md). It was run in place of the weekly Thursday pass,
because the first pass over every flow isn't finished (`docs/team.md`, "User testing and research").
Since 10 October the flow has gained policies on the place and trip screens (D-270 and on), "I'm
here" and "I went" (D-535, b22) with points for both, the Location drawer (D-575) and the new Sign
in (W6, D-563 to D-572).

## 1. The flow and the person

- **Who:** Marcus, the same member as last time. He reads slowly, taps what looks like a button,
  and doesn't know "tab" or "scroll".
- **Starting where:** signed out, on Sign in.
- **Trying to:**
  1. find job training;
  2. plan a visit;
  3. sign the program's policies;
  4. find the visit again;
  5. on the day, say he's there;
  6. see what keeps him going.
- **Where tested:**
  - Storybook built locally from `main` (`dc3789e9`). The walk used `member-app-prototype--prototype`.
    The day of the visit used `member-created-states-saved-trips--im-here`, because the prototype's
    trips are example trips and "I'm here" shows only on a real visit. The rest used
    `member-created--points` and six other `member-created--*` screens.
  - Every host but this machine was refused, and no request was refused, so nothing tried to leave.
  - The app was also built with `build:e2e`; nothing in its output names the live project.
  - **Not the live app.**
- **How:**
  - Playwright in Chromium with touch, in New York's time zone.
  - The whole walk at 390×844 in English, light.
  - Seven of its screens again at 320×568 in English (light), at 390×844 in Spanish (dark), and at
    320×568 in Arabic (light). On each one I measured tap targets and text sizes, checked for
    sideways scroll, and read the accessibility tree.
  - "I'm here" was tested with the location allowed, and with the location prompt left unanswered.

## 2. What happened

| Step | Taps | Screen |
|---|---|---|
| Sign in | 2, plus the number and the code | Sign in, then Enter your code |
| Find job training | 2 | Explore: "Work and money", then a place |
| Plan a visit | 5 | Plan a trip, a day, a time, Next, Add this trip. Lands on "Your trip is saved" |
| Sign 4 policies | 13, plus 4 drawings | Policies to sign, Start signing; for each one Sign, draw, Sign; then Next ×3 |
| Back to Trips | 1 | The × on the last policy. Trips, with confetti |
| Find the visit | 1 | Tap the card |
| On the day | 1, plus allowing location | I'm here: "Your visit is marked. You earned 100 points." |
| See points | 2 | Profile, then Your points |

**About 27 taps** from Sign in to points. All four policies, signed one after another, are 13 of
them. The sign sheet still says "the next policy takes one tap". In the prototype it didn't: each
policy asked for a new drawing (W1, P8). Every step could be finished.

## 3. Findings

### Stops someone

None found on this pass.

### Slows someone

**W1. The second time the sign sheet opens, "Sign" is lit over an empty box and does nothing.**

- **Screen:** a policy's signature sheet: `member-created--place-policy`, reached in the prototype
  through Policies to sign.
- **Steps:**
  1. Sign the first policy (draw, then Sign).
  2. Go to "Next: Liability disclaimer" and tap Sign.
- **What happened:**
  - The sheet opens with an empty box, yet "Sign" and "Clear" are both lit.
  - Tapping Sign does nothing, and nothing on screen says why.
  - Drawing again, then Sign, works.
- **Shot:** `shots/2026-10-15-member-sign-sheet-blank.png`.
- **Cause:** in `SignSheet` (`MemberPoliciesView.tsx`), `hasInk` lives outside the part that is
  unmounted when the sheet closes. It stays `true` while the new `SignaturePad` starts empty. The
  pad's own `toDataURL()` then returns null, so the button does nothing.
- **Where it reaches a real member:** "Clear signature and sign again" (`forgetSignature()`, then the
  sheet opens again). In the prototype it happens on every policy after the first. See P8 for why.
- **Expected:** an empty box with Sign greyed until something is drawn, or the kept signature
  drawn in the box.
- **How sure:**
  - high that it happens (seen, and traced in the code);
  - medium on how often a real member reaches it.

**W2. The points screen doesn't say that going to a visit earns points, though going earns the
most.**

- **Screen:** Your points (`member-created--points`), "Ways to earn".
- **Steps:** Profile, then Your points.
- **What happened:**
  - The list shows Plan a trip +25, Call a place +10, Save a place +5 and Finish setting up +25.
  - "I'm here" pays 100 and "I went" 60, and the screen says so right after you tap them. They are
    not on the list.
  - The list is filtered by `AWARDED_TODAY` (`packages/config/src/points.ts`), which still lacks
    `attend_appointment_verified` and `attend_appointment_sms`. The database has paid both since
    b22 (D-535).
- **Expected:** the habit Pam most wants ("get to it, and keep going") at the top of Ways to earn.
- **How sure:** high, unless it was held back on purpose. I found no decision saying so.

**W3. On a 320×568 phone, the services to pick are hidden under "Plan a trip".**

- **Screen:** a place whose program is on Pam (`member-created--place-with-lead`).
- **Steps:** open the place at 320×568.
- **What happened:**
  - The first screen shows "Pick a service", with its first choice cut off behind the sticky Plan a
    trip area.
  - "Plan a trip" is greyed out.
  - The reason is a 12px line under it: "Pick a service above to plan a trip."
  - The same in Arabic.
- **Shot:** `shots/2026-10-15-member-place-320-services-hidden.png`.
- **Expected:** the choices he has to make are in view before the button that waits for them.
- **How sure:** high that it happens at 568 tall. This is the 10 October W3: the hint line answers
  it at 390, but not at 320.

**W4. No help on the first step of Plan a trip, or anywhere in signing policies.**

- **Screens:**
  - New trip step 1, "When?" (`member-created--new-trip`);
  - Policies to sign (`member-created--place-policies`);
  - each policy, and its signature sheet (`member-created--place-policy`).
- **Steps:** a place, then Plan a trip; or a saved trip, then Policies to sign.
- **What happened:**
  - Step 2, "Check your trip", has a Help link. Step 1 has none, and neither do the policy screens.
  - A26 asks for a visible way to get help on "each step of a multi-step task" and on "forms and
    their errors". Signing four legal policies is the step where he is most likely to want a
    person.
- **Expected:** the same Help as step 2 on each of these screens.
- **How sure:** high that it is missing. 10 October's W1 named step 1 too, and it still lacks one.

**W5. On the day of the visit, the way to get there is below the fold.**

- **Screen:** the visit's place page in its window (`member-created-states-saved-trips--im-here`).
- **Steps:** Trips, then the visit, on the day.
- **What happened:**
  - Top to bottom, the page shows:
    1. the visit card;
    2. "Cancel this visit";
    3. I'm here;
    4. I went;
    5. what the program will see;
    6. only then, Get directions.
  - At 390×844, Get directions starts at the bottom edge. At 320×568 it is a full screen down.
  - Two hours before the visit, before he leaves, the screen offers "I'm here" first.
- **Shot:** `shots/2026-10-15-member-im-here.png`.
- **Expected:** Get directions near the top until he is there.
- **How sure:** medium. It depends on where members open it from; worth one real member.

**W6. While the phone waits for location permission, "I went" is locked too.**

- **Screen:** as W5.
- **Steps:** tap "I'm here" and leave the location prompt unanswered.
- **What happened:**
  - "Checking where you are…" and "I went" are both disabled.
  - The 12-second time-out (`lib/imHere.ts`) starts only once the prompt is answered. Until then,
    neither way of marking the visit works.
- **Expected:** "I went" stays available; it sends no position.
- **How sure:** low. A real phone shows the prompt over the page, so this needs Will's phone for a
  minute.

### Polish

- **P1. "Day & time must be selected."**
  - **Where:** New trip, Next with nothing picked (`shots/2026-10-15-member-when-empty-next.png`).
  - **What:** the words are passive and use "&".
  - **Expected:** "Pick a day and a time."
- **P2. Every trip card's spoken name ends in "with" when nobody comes along**, for example
  "Example Trade Skills Workshop, Wednesday, Oct 21 · 10:30 AM, with".
  - **Where:** `trips.card.label` is "{place}, {when}, with {name}", and `TripsView.tsx:182` fills it
    with `''`.
  - **Status:** still open from 10 October's P8. Most trips are like this.
- **P3. Long place names are cut on Trips** ("Example Trade Skills Work…"), in English as well as
  Arabic, rather than wrapped (`shots/2026-10-15-member-trips.png`). Still open from 10 October's
  P6.
- **P4. Spanish mixes *usted* and *tú* inside the member flow.**
  - **What:** the rule is *tú* for members, but many member lines are *usted*:
    - `trips.confirm.title(.self)` "Su visita está reservada/guardada";
    - `checkin.done` "Su visita quedó marcada";
    - `points.title` "Sus puntos";
    - `explore.nextTrip.*` "Su próxima visita";
    - `place.schedule.pickService` "Elija un servicio…";
    - `place.dropin.body(.self)`;
    - `guide.*`, `transparency.*`;
    - `signin.phone.label`.
  - **Where it shows:** on the same screens as *tú* lines. "Su visita está reservada" sits above
    "Léelas antes de tu visita", and "Elige un servicio" sits above "Elija un servicio arriba".
  - **Status:** still open from 10 October's P12, and wider. For Lena's Friday batch.
- **P5. Badge names stay English in Spanish and Arabic** ("Scholar", "Griot", "Craftsman"…) on Your
  points. Fine if they are names on purpose; if so, a decision should say so.
- **P6. "Cancel this visit" is still offered after the visit is marked.** It shows after "Your visit
  is marked. You earned 100 points." on the same screen.
- **P7. Two small targets:**
  - Copy address is 32px wide on every place;
  - "View all places to visit" on New trip is 24px tall.
- **P8. The prototype no longer keeps the signature.**
  - **What:** 10 October's pass recorded "the next policy takes one tap" as working. Today each
    policy asks for a new drawing.
  - **Cause:** for a signed-in member, `useMySignatures` returns the account's saved signature
    (`member_signatures`), but an example place keeps it in session storage. Storybook also has no
    fixture for `member_signatures` or `policy_signatures`: both log `[journey] no fixture` on
    every place and policy screen.
  - **Who sees it:** real members see no example places (a55), so this is the prototype, the
    surface Will reviews on.

## 4. What worked (keep it)

- **Sign in is two taps** with the prefilled code, and "Need help? Contact Pam" is on the code step.
- **Plan a trip is the one big button**, and its day and time chips say which is picked
  (`pressed`), to a screen reader too.
- **An empty Next says what's missing** at the top of the step, in view at 390 and 320.
- **"Your trip is saved"** gives the day, the time, "In 6 days", Policies to sign and Bring a
  friend, with one Done.
- **"Type my name instead"** is offered for anyone who can't draw a signature.
- **The last policy's × lands on Trips with the trip marked "Policies signed".** The banner moves
  on to the next program that still needs signatures.
- **"I'm here" and "I went"** each answer in one tap, with the points earned.
- **No sideways scrolling** on any screen at 320, in English, Spanish or Arabic, and Arabic mirrors
  the back arrow and the layout.
- **Since 10 October, fixed:**
  - Policies to sign has one way out ("Back to Trips"), not two (W5 then);
  - the greyed Plan a trip now says why at 390 (W3 then).

## Not covered this pass

- **The live app, signed out:** not opened.
- **Screen readers on a phone:** VoiceOver and TalkBack. W6 and the keyboard need Will's phone for
  about 10 minutes, as for the DocuSign plan.
- **Contrast in dark mode:** only looked at, not measured.
- **Messaging a program before a visit, changing or cancelling a trip, and Bring a friend.**
- **The Location drawer (D-575):** on Explore, but not on this person's way through.

Iris
