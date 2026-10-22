# Sign up and sign in: the weekly pass (22 October 2026)

Iris. This is the Thursday pass over what changed this week in signing up and signing in:

- Sign in's language menu, and Sign up's language list, which is now a bottom sheet (`622c780a`,
  `8933b153`);
- Join › About you's city list, with no note under it (`0853407f`);
- the texts step (`46ac16b1`, `3ea0b3c1`);
- the "Not here yet" step, with no tick (`07f6d5c2`);
- a program lead's What to expect, now five rows (`3d3fee1d`);
- an unfinished account's Sign out, with no line under it (`0853407f`).

## The flow and the person

- **A member:** has just confirmed their phone and starts at About you. They want to finish signing
  up and get in.
- **A member in a city Pam isn't in yet:** the same start, typing Scranton.
- **A program lead:** opens an invite and wants to finish signing up.
- **Someone with an unfinished account:** wants to sign out.
- **Someone signed out:** on Sign in, wants to change the language.

**How:**

- The `build:e2e` app of main at `6773c9c4` (b77), on 127.0.0.1. Every other host was refused, and
  the database was stubbed.
- Made-up people. No account was made, nothing was sent, and nothing was live.
- 390×844 and 320×568, plus 320×320 for Sign in's menu. Light and dark. English, Spanish and Arabic
  (and Russian for the texts step).

## What happened

**A member, About you to "You are in": 6 taps.**

1. Open the language sheet (optional).
2. First name.
3. Last name.
4. Next.
5. I understand, on What others can see.
6. Agree to receive texts.

The city comes already chosen (Philadelphia, the one city served). The same 6 taps in English,
Spanish (320, dark) and Arabic (320). The sign-up call carried no role, and "finished" was written.

**Not here yet, from About you: 2 taps** (Next, then Save my city), then Done. There's no tick
anywhere on the screen, and the save sends `p_wants_updates: false`. The thank-you reads "We have your
city. Your city is on our list. Come back any time to see if Pam has opened." The same in Spanish
and Arabic.

**A program lead, from the invite: 2 taps** to What to expect (the first name, then Next). It has five
rows, the fifth "When a member who signed up with your program saves a new place, you see when. Never
which place." The same in Spanish (formal "usted", 320 dark) and Arabic.

**An unfinished account:**

- The page says "Your account is not finished yet. It takes a minute.", then Finish setting up, Help
  and Sign out.
- Nothing is under Sign out.
- One tap signs out, and lands on Sign in.

**Sign in's language menu:**

- The globe is 48×48 and opens all seven languages, each row 48px, at 390, at 320 (light and dark)
  and in Arabic.
- At 320×320 the menu shows four rows at a time and scrolls inside itself. The last language,
  العربية, scrolls to 268–316 of 320 without the page moving
  (`shots/2026-10-22-signup-signin-menu-320x320-es.png`).

**Sign up's language sheet:** it opens from the bottom with all seven languages, each row 48px, none
hidden, at 390 and 320. In Arabic it mirrors, with the tags on the left and a tick by the chosen
language (`shots/2026-10-22-signup-language-sheet-320-ar.png`).

## Findings, ranked

### Stops someone

None.

### Slows someone

| # | Screen | What happened | What the person would expect | How sure |
|---|---|---|---|---|
| S1 | The texts step, at 320 (es, en) | On arrival, the paragraph with STOP, HELP and "rates may apply" runs under the sticky Agree bar. In Spanish the last line, "Pueden aplicar tarifas de…", is cut by the bar (`shots/2026-10-22-signup-texts-step-320-es-dark.png`). It can all be read after scrolling 124–146px (it ends at 324px, exactly where the bar starts). But a person can tap Agree without having seen the rates line. | The whole consent line in view above Agree on arrival, or a page that shows there's more. | Sure (measured) |

Raised from polish by Iris: this is the consent screen, and the STOP, HELP and rates line is what the carrier expects a person to see before agreeing. At 320 someone can agree without it on screen.

### Polish

| # | Screen | What happened | What the person would expect | How sure |
|---|---|---|---|---|
| S2 | About you (English) | "Did someone invite you via code? **Click here**". On a phone you tap, and "Click here" doesn't say what it opens. Spanish already says "Toca aquí" (`shots/2026-10-22-signup-about-you-390-en.png`). | "I have a code" or "Enter a code". | Sure |
| S3 | What others can see (member), and What to expect (lead) | "Contact Pam" is a 296×24 link at 390 and 226×24 at 320: half the height of everything else on the step. | At least 48px tall, like the buttons. | Sure (measured) |
| S4 | About you, What others can see, the texts step, Sign in | Text under 16px: the field labels at 14px (First name, City you live in, Choose a language, Your phone number); the step count at 12px ("1 of 3"); "Coming soon" badges at 12px; the STOP/HELP line and the three "can see" rows at 15px. Readable, but small for someone who hasn't used a phone in years. | Labels at 16px. | Sure (measured) |

## What worked

- **No role asked, and no tick.** The member's sign-up sends no role. "Not here yet" has no checkbox,
  and saves `p_wants_updates: false`.
- **Six taps** from About you to "You are in", with the only city already picked.
- **The language lists.**
  - Sign in's menu: all seven, 48px rows, scrolls inside itself at 320×320.
  - Sign up's sheet: all seven, none hidden, mirrored in Arabic.
- **The lead's five rows** are plain and complete in three languages.
- **An unfinished account's Sign out** is one tap, with nothing under it.
- **Everything fits.** Nothing scrolled sideways, and no text was cut, at 320 in any language I tried.
- **The texts step** names the same kinds of texts as Text alerts ("A reminder before your trip",
  "A saved place closes or moves"), each with Coming soon. It doesn't say "Pam does not send any of
  these yet".

## Not covered

- **The 988 line from `3ea0b3c1`:** it's in the "texting pitch", which I didn't find on these steps;
  the texts step has no 988 line. Someone who knows which screen that pitch is on should check it.
- **A case manager's sign-up:** not changed this week.
- **A real keyboard over About you's fields:** needs Will's phone.

Iris
