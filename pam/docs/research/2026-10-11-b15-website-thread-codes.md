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

---

## b18 privacy re-test (11 October, 17:05 UTC)

**What I tested:** `main` at `b770551`, two ways:
- the app built locally (`pnpm --filter @pam/web build`, served from `out/`), every outside
  request stubbed and logged;
- `main`'s Chromatic Storybook, logging every request to a host other than Chromatic.

No sign-in, accounts or sends.

| | Result |
|---|---|
| **1** Explore's area picker | **Pass.** Typing "1234 Market" makes no outside request in en, es or ar (story `member-created-states-explore--live`). The app's own `area-picker.spec.ts` passes, including its D-536 carto.com watch. The words are there: "ZIP code" / "Código postal" / "الرمز البريدي (ZIP)", and "Pam remembers the area you pick on this phone only." in all three. "Nothing matched that. Try a ZIP code." answers a street. **Note:** "Like 19107." (`places.areaHint`) isn't on screen in the picker; that key is used only in the TextField and VoiceInput stories |
| **2** Use my current location | **Pass** (local build, `/places/`, with a fake device position). After picking 19122 and then the current location, `pam.origin` still holds 19122, never the device position. A reload comes back "Near 19122". A planted `{id:'here',…}` entry is removed on reload, which falls back to "Near City Hall". With nothing stored, it starts at City Hall. **Note:** in Storybook every reload comes back at City Hall even after a ZIP, so the story resets storage. Test reloads in the local build |
| **3** A person's policies page | **Pass.** "Policies signed" links to `/person/policies/?id=dummy-m1` (`program-lead-screens--member`), with no name. The source builds it from `{ id }` alone |
| **4** Messages, D-537 | **Pass.** `messages.spec.ts` (88/88 at 320) passes, including "a real account with an example-matching name gets no photo and no request to the photo host", and that a demo account still sees the example photo |
| **5** Trips | **Pass.** It loads with the drawn "Map preview", and "coming up" shows, with no script errors |

**Outside requests:**
- **App:** none from the area picker, current location or reload, and none in the local
  build.
- **Storybook:** the member Trips and Messages stories request `images.unsplash.com`. These
  stories run with example data on, which D-537 allows; the real-account case is the test in
  4. Explore's story made no outside request.

Iris

---

## b20 re-test: neighbourhoods (11 October, 21:45 UTC)

`main` at `e27afa24`. No sign-in, accounts or sends.

**1. Area search (D-540): PASS.**

- **Finding the right place.** The search runs in the database (`search_areas`). Postgres
  is installed here but PostGIS isn't, so `pnpm --filter @pam/db test` can't run. Instead I
  took the function's rules (every word typed must appear, in any order; labels that start
  with the first word come first, then landmarks, then A to Z) and ran them over the 205
  seeded areas (159 neighbourhoods, 46 ZIPs, City Hall). A logic check, not a database run:

  | Typed | First result |
  |---|---|
  | "fishtown" | Fishtown - Lower Kensington |
  | "kens" | Kensington, Old, then Kensington, West; East Kensington; Fishtown - Lower Kensington; Upper Kensington |
  | "east germantown" | Germantown, East |
  | "old kensington" | Kensington, Old |
  | "19107" | 19107 |
  | "city hall" | City Hall (landmark; both words match) |

  The new db test `63_…` asserts the same three sorted-name cases.
- **The words, from main's Storybook at 320** (`member-created-states-explore--live`, picker
  open), in the seven languages:

  | | Label (placeholder) | Hint |
  |---|---|---|
  | en | ZIP code or neighborhood | Like 19107, or Fishtown. |
  | es | Código postal o barrio | Como 19107, o Fishtown. |
  | pt-BR | CEP ou bairro | Como 19107, ou Fishtown. |
  | zh-CN | 邮政编码或街区 | 例如：19107，或 Fishtown。 |
  | zh-HK | ZIP 郵遞區號或社區 | 例如19107，或 Fishtown。 |
  | ru | Почтовый индекс (ZIP) или район | Например, 19107 или Fishtown. |
  | ar | الرمز البريدي (ZIP) أو الحي | مثل 19107، أو Fishtown. (rtl) |

  Nothing is cut or wider than 320 in any language, and the picker makes no outside
  request. Shot: `shots/2026-10-11-b20-area-picker-ar-320.png`.
- **Notes, not fails:**
  - **Screen readers:** the field's name is announced twice ("ZIP code or neighborhood ZIP
    code or neighborhood"), from the label and the placeholder together. The hint isn't
    linked to the field (`aria-describedby`), so a screen reader doesn't hear it with the
    field.
  - **Wording, for Lena:** the comma before "o"/"ou" in es and pt-BR reads stiffly ("Por
    ejemplo, 19107 o Fishtown" is more natural), and pt-BR's "CEP" is the Brazilian word,
    not a US ZIP code.

**2. Legal > Data sources: PASS.**

- **The text** (`member-created--legal`, 320, all seven languages) credits "Philadelphia
  Neighborhoods" by Abaca Labs and says Pam changed it to keep one point per neighbourhood
  instead of its boundaries.
- **The links:** "See the source data" goes to
  `github.com/azavea/geo-data/tree/5c4538b…/philadelphia-neighborhoods`, and "License: CC BY
  4.0" goes to `creativecommons.org/licenses/by/4.0/`. Both are 288×48, and nothing is cut
  at 320 in any language.
- **Do the links work?** Both hosts are blocked from this environment for a browser. A git
  fetch of that commit shows the folder exists, and its `license.txt` reads: "released under
  the Creative Commons 4.0 Attribution license… https://creativecommons.org/licenses/by/4.0/
  and attribute the data to Abaca Labs", which matches the page.

**3. Enrollments lockdown (D-541 part 1):** nothing to test on screen, as briefed.

Iris

---

## b22 re-test (12 October, 05:05 UTC)

`main` at `238135ec`: Storybook from Chromatic, and the site and web app built locally.
No sign-in, accounts or sends; `joinpam.org` is blocked here, so the site is the local build.

**1. Privacy, seven languages at 320: PASS.**

- **The sharing paragraph** (`privacy.s.sharing.p2`) ends in every language with who can
  start a chat: "A program can start a chat with you only if you are signed up with them or
  have a visit planned there. Otherwise only you can start one, and they can answer." Each
  translation reads as the same single thought.
- **"A program can see"** is the card on join step 2 (`TransparencyReading`, D-541/543),
  with five lines in all seven languages. It's drawn without the colon the string has.
- **p9 ("I'm here") and p10 (search near you)** each read as one thought. The buttons p9
  quotes match the app's `checkin.here` / `checkin.went` labels in es, pt-BR, zh-CN, zh-HK,
  ru and ar. In English the words match, but p9 quotes “I’m here” with a curly apostrophe
  and the button is "I'm here" with a straight one. A nit.
- **Layout:** Privacy and "What others can see" are 320 wide in every language, Arabic is
  rtl, and nothing is cut off. The section chips scroll sideways on purpose.

**2. Messages in Pam (site, local build): PASS.**

- **The lead:** "You can also write to a program that is on Pam, even before you plan a
  visit… A program can start a chat with you only if you are signed up with them or have a
  visit planned there."
- **The table:**
  - A member: "Your own case manager, or any program that is on Pam".
  - A program lead: "Members who are signed up with your program or have a visit planned
    there, and anyone who wrote to you (you can answer)".
- **Mention:** the page still says "Updated October 10, 2026".

**3. A place with no lead, and the I'm here card: PASS, with one story problem.**

- **`member-created--place-no-lead`:** no "Send a message" row, a ⋯ menu of only Flag
  something and Share this place, and no I'm here card. For comparison,
  `member-created--place-with-lead` has "Message the program" in its ⋯ menu. **Mention:** it
  has no "Send a message" row either.
- **The I'm here card:** `ImHereCard.tsx` keeps the button label "I'm here" after "I went";
  "Checking where you are…" appears only while an I'm here is locating. It ends with
  `checkin.done` "Your visit is marked." and `checkin.points` "You earned {points} points."
  - The app's `im-here.spec.ts` passes 6/6 at 320, including D-545: no I'm here or I went
    at a no-lead place.
  - An extra run of mine sampled the screen every 50ms after "I went": English never showed
    "Checking where you are…", only "Your visit is marked." and "You earned 60 points."
  - My Spanish and Arabic runs didn't reach the button, because the language came from my
    setup, not the app. The code path is the same in every language.
- **Story problem (W): `member-created-states-saved-trips--im-here` no longer shows the
  card.** Its place, Riverside Job Center, is a no-lead place, so under D-545 the card is
  hidden. The page says "Pam does not tell Riverside Job Center you are coming." Storybook
  can't show I'm here until the story uses a place with a lead.

Iris
