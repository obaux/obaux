# b15: new website, thread header, Arabic code boxes (11 October 2026)

Iris, User Research & Testing Lead. Mira's b15 brief, 11:41 UTC.

## The flows and the person

- **New website (Wren, D-531):** someone who has heard of Pam opens joinpam.org on a phone or
  a laptop. They look at Home, find Support, read a post and reach a person.
- **Thread header (Nico, D-529):** a member reads a conversation in English, Spanish or
  Arabic, scrolls, and goes back.
- **Arabic code boxes (Dot, D-530):** an Arabic reader types or pastes the code from their
  text.

## Where and how

- **Site:** `main` at `f0fb902`, built locally (`pnpm --filter @pam/site build`, served from
  `out/`, outside requests blocked). Not the live joinpam.org: this environment's network
  policy refuses it. Pages: `/`, `/support/`, `/support/cant-sign-in/`, `/en/about-pam/`.
  Sizes 320×568, 390×844 and 1280×800, light and dark.
- **App:** `main` from its Chromatic Storybook build, with stub data:
  - `member-created--conversation`;
  - the clickable prototype;
  - `member-created--sign-in-wrong-code`.

  No sign-in, accounts, sends or member data.
- **Not filed:** lines that wait on Will's card a65.

## What happened

### Website

- **The sweep:** at every size and theme there's no sideways scroll, no clipped text, no
  layout jump (shift ≤0.05) and no script error.
- **Keyboard order on Home:** Skip link → Pam → Get help → Sign in → the picture card →
  Pause → Residents → Program Providers → Case managers. Every stop shows a 2px ring, in
  light and dark, at 320, 390 and 1280.
- **The carousel:**
  - a group labelled "Pam in pictures" with three pictures;
  - auto-flips about every 5s;
  - the floating is a gentle 12–16px drift on a 5.6s loop.
- **Flipping:** tap, click and Enter all flip the card and announce "Picture 2 of 3: Talk
  to a real person…" in a polite live region. Auto flips aren't announced, which is right.
- **Pause:**
  - becomes "Play pictures";
  - stops both the floating (animation paused) and the auto-flip (nothing changed over
    9s);
  - tapping still flips while paused.
- **Reduced motion:** no floating, no auto-flip, and no Pause button, since nothing moves.
  Tap still flips.
- **Motion feel:** calm. One gentle drift and a flip every few seconds, nothing fast.
- **Support, a help post and About:** clean, and "Still stuck?" is unchanged from b13.

### Thread header

- **The header:**
  - at the top: the person's initial, name and role;
  - scrolled: a small bar with the name next to Back and ⋯.
- **Back:** 48×48 in English, Spanish and Arabic (on the right in Arabic), at 390 and 320.
  In the prototype, Messages → a conversation → Back returns to Messages.
- **Long name**, "Maria Guadalupe Hernández-Villanueva de la Cruz", put into the page at
  320: the big header wraps onto three lines and the small bar ends it with "…". Nothing
  covers the buttons, and nothing is wider than the screen.

### Arabic code boxes

- **Order:** the boxes now run left to right in Arabic; "1234" shows as 1 2 3 4.
- **Arabic-Indic and Persian digits:** typed or pasted, they become 1 2 3 4 5 in the boxes.
  Six digits submit, the same as Latin digits.

## Findings

No **S** (stops someone) this time.

**T1 (W). Arabic: English messages show punctuation on the wrong side.**

- **Screen:** a conversation, Arabic, 390 (`member-created--conversation`, `locale:ar`).
- **What I saw:** a case manager's English message shows as ".starts Monday at 10" and
  "?Thank you. Which bus goes there". This is the same class as P5 in the Member flow
  report: text people write, shown inside a right-to-left page without its own direction.
- **Expected:** each message reads in its own direction, for example `dir="auto"` on a
  bubble.
- **Shot:** `shots/2026-10-11-thread-ar-punctuation-and-long-name.png`, left.
- **How sure:** high.

**T2 (W). Arabic: the small bar cuts the start of a long Latin name.**

- **Screen:** a conversation, Arabic, 320, scrolled.
- **What I saw:** the small bar shows "…illanueva de la Cruz", the end of the name. In
  English it shows "Maria Guadalupe H…".
- **Expected:** the start of the name, then "…", in every language.
- **Shot:** `shots/2026-10-11-thread-ar-punctuation-and-long-name.png`, right.
- **How sure:** high that it happens. The name was put into the page by hand, not by a
  story.

**H1 (W). Pause on Home doesn't look like a control, and on a phone it sits below the
first screen.**

- **Page:** `/`, 390 and 320, and 1280.
- **What I saw:**
  - "Pause pictures" is a 116×48 target, but it's drawn as plain small text under the cards
    (shot: `shots/2026-10-11-website-home-1280-dark.png`).
  - On a phone the cards start moving at once, while Pause is below the first screen:
    - 390: at y 930 on an 844 screen;
    - 320: at y 913 on a 568 screen.
- **Expected:** a control that looks pressable (an icon and an outline), near the cards'
  top or side.
- **How sure:** medium. WCAG only asks that a pause exists, and it does; this is about
  being found.

**H2: withdrawn (12:15 UTC).** "Search Support" is the search field's visually-hidden label: two 1×1px spans clipped to `rect(0,0,0,0)`, never drawn. My contrast script counted hidden text and measured it against the nearest coloured background, `#9E9E9E` on `#4A2F51`. The drawn placeholder passes, as Dot measured (5.65:1 on the pill).

**C1 (polish). Sign in turns on after one digit.**

- **Screen:** Enter your code, wrong-code state, Arabic, 320.
- **What I saw:** "تسجيل الدخول" (Sign in) is enabled once one digit is in. It may be
  deliberate, so that a person who taps early gets told what's missing; I didn't check what
  a short code says.

## What worked (keep it)

- **The carousel:** honest and calm. Pause truly stops everything, reduced motion is
  respected completely, and only a person's own flips are announced.
- **Keyboard order on Home** is the reading order, with a ring on every stop.
- **Thread header:** Back is always visible, and the info collapses to a bar instead of
  leaving.
- **Arabic code boxes** now match the text a person receives, whatever digits their
  keyboard types.

Iris

---

## b16 re-test (11 October, 13:45 UTC)

`main` at `4e0c32f`: the site built locally, and the app from `main`'s Chromatic Storybook.
No sign-in, accounts or sends.

| | Result |
|---|---|
| **T1** English messages in an Arabic thread | **Pass.** The bubbles carry `dir="auto"` and compute LTR; the final "." and "?" sit at the end of the line. Arabic text is unchanged |
| **T2** long name in the small bar | **Pass.** At 320, scrolled: a Latin name shows "Maria Guadalupe H…", and an Arabic name shows its own start, then "…" (`dir="auto"`, `unicode-bidi: isolate`) |
| **H1** Pause pictures | **Pass.** A 146×48 pill with a pause icon, a 1px outline and a translucent fill, in light and dark. It sits on the top corner of the picture stack and is inside the first screen: y 505–553 on 568 at 320, y 434 on 844 at 390, y 134 at 1280. It switches to "Play pictures" and is hidden under reduced motion. Tab order: the picture card, then Pause, then Residents |
| **C1** six digits | **Pass.** Sign in stays off at 0–5 digits for Latin, Arabic-Indic and Persian digits, and the sixth digit submits by itself |

**Noted, not filed (Nico's heads-up, Dot building next).** In Arabic, a place's or policy's
English name as the page heading takes the page's right-to-left direction:
`member-created--place-profile` "Example Library Tech Lab" and
`member-created--place-policy` "Confidentiality and disclosure" compute `rtl`.

Iris

---

## b17 re-test: names in headings (11 October, 14:58 UTC)

From `main`'s Chromatic Storybook, Arabic, 390 (the conversation bar at 320).

| | Result |
|---|---|
| place-profile "Example Library Tech Lab" | **Pass:** `ltr` (`dir="auto"`). The page's own headings ("اختر خدمة", "عن البرنامج") stay `rtl` |
| place-policy "Confidentiality and disclosure" | **Pass:** `ltr` |
| Policies list title "سياسات للتوقيع" | **Pass:** `rtl` |
| Profile card name "Marcus" | **Pass:** `ltr` |
| Staff: a case manager's member screen "Jordan", and the member list on Home ("Marcus", "Tanya") | **Pass:** `ltr` |
| Conversation bar (b16 behaviour) | **Pass:** a Latin name is `ltr` and an Arabic one `rtl`, each showing its own start. English bubbles are still `ltr` |

**Noted, not a fail.** The case manager's Home people strip ("الشريحة 1 من 2") puts its name
captions in the page's `rtl`. With one-word names nothing changes on screen; with a
two-word Latin name the words would still read in order. Mention only.

Iris
