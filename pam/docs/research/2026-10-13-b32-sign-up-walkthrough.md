# b32 pre-ship walk-through: W6 sign-up (13 October 2026)

Iris, User Research & Testing Lead. Mira, 18:52 UTC: walk through `mira/batch-b32` @
`72562dba` (main + Ava's W6 `8417d724` + Lena's `18035878`; Will signed card a82 at 18:40)
before it ships.

**How:**
- A local build of `72562dba` in the stub environment, served from `out`, with Playwright and
  pretend data.
- Sign-in used pretend replies only: no code was sent, and there is no real account, number or
  member.
- Seven languages, light and dark, at 390×844 and 320×568, with Arabic right to left.
- One script made **506 checks**. 58 came back red, and **every one traced to my script, not
  the app** (see "What the red checks were").

## 1. The screens: PASS

**Join, step 1** ([en dark, 320](shots/b32-join-en-dark-320-top.png),
[ar, 320, end of page](shots/b32-join-ar-320-end.png)):
- **Step count:**
  - "1 of 3" appears as quiet text at the start of Next, with no pill and a transparent
    background. It's level with "Next" (centres within 0.01px) and inside the button.
  - In Arabic it sits on the right ("1 من 3"), and in Chinese it reads "第1步，共3步".
  - Contrast, measured from the real colours with the 0.75 opacity blended in: **5.50:1 in
    light, 7.01:1 in dark** ([dark](shots/b32-step-count-dark.png)).
- **Language dropdown:**
  - The closed box shows the current language in its own script: "English", "Español",
    "简体中文（普通话）", "العربية"…
  - The open list has 7 rows, each at least 48px, with the chosen one selected and ticked.
  - Each row's words carry their own `lang`, and the Arabic row is `dir=rtl`. On an Arabic
    page the box, chevron and rows mirror, with the tag at the start side
    ([ar open](shots/b32-dropdown-open-ar.png)).
- **Hidden code:** Will's question and the underlined link show in place of the code box in
  all seven languages: "Click here", "Toca aquí", "Toque aqui", "点按这里", "點按這裏",
  "Нажмите здесь", "اضغط هنا".
- **Tapping the link** opens the box with the cursor in it, in all seven languages at 390 and
  320×568 ([ar](shots/b32-join-code-open-ar-320.png)).
- **Arriving with `?code=`** opens the box with the code filled in, in upper case.
- **Arriving with a remembered invite** shows "You were invited as: Member" and carries the
  code without a box, as designed.
- At 390 and 320×568 there's no sideways scroll and no clipped words, in any language or
  theme.

**Sign in from an invite** ([ar, 320, end](shots/b32-signin-join-pam-ar-320-end.png)):
- It's titled "Join Pam" in all seven languages ("الانضمام إلى Pam", …).
- The invite line has Lena's four sentences and is pinned at the top.
- "Send me a code" is fully on screen without scrolling at 320×568, invited or not, in all
  seven languages and both themes (56/56).

**Expired link:** with `invite_emails_live` on, it offers the email field, in English and
Arabic, light and dark ([ar dark](shots/b32-expired-ar-dark.png)).

## 2. Keyboard and screen reader: PASS

- **The link:**
  - It's a `button` (right, since it opens something). Its name is the link text: "Click
    here", "Toca aquí", "اضغط هنا"…
  - Reached with Tab, with a visible focus ring (`:focus-visible`); Enter opens the box and
    focus lands in it. Checked in English and Arabic.
- **The dropdown:** `combobox "Choose a language": English`, and in Arabic
  `combobox "اختر لغة": العربية`. The name and value are both read.
- **Next:** `button "Next, 1 of 3"`, and in Arabic `"التالي, 1 من 3"`. The step is in the
  name, and the count on screen is `aria-hidden`, so it's read once.

## 3. The bar on short phones (the zh-CN and ar case from b30): PASS

At 320×568 I scrolled to the end of the page, in seven languages × light and dark × invited
and not (28 cases):
- A Pam mark and the language button are in view by the invite note's bottom + 56px in every
  case.
- When invited, the invite line is at 0.
- The two that failed in b30, Arabic and Simplified Chinese not invited (they scroll only
  72px), now get the bar ([zh-CN dark](shots/b32-signin-zh-CN-dark-320-end.png)).

## Polish (none stops shipping)

- **P1. The handover leaves a sliver of the mark.** Between about 56 and 64px of scroll, the
  hero's mark is cut down to a 4–8px strip before the bar appears. The observer has
  `threshold: 0`, so it fires only when the mark has fully left. A threshold of about 0.5
  would hand over while the mark is still half in view. Owner: Dot.
- **P2. "Click here" has no context out of reading order.** In a screen reader's list of
  buttons it reads "Click here" alone. An `aria-describedby` pointing at the question would
  give it context with no visible change. Owner: Ava, with Will's words untouched.
- **P3. English says "Click" on a phone; the other six say "tap".** These are Will's words,
  signed on a82, so this is only for Sage, who may raise it with him.
- **P4. Spanish mixes formal and informal address on one screen.** The pre-existing label
  "Escoja un idioma" uses *usted*. The new lines "¿Alguien te invitó…?" and "Toca aquí", and
  "Ciudad donde vives", use *tú*. Owner: Lena.
- **P5. Next's name uses a Latin comma in Arabic and Chinese.** It reads
  "التالي, 1 من 3" and "下一步, 第1步，共3步". The comma is joined in `BigButton`, not
  translated. A screen reader treats it as a pause, so it's harmless, but "،" and "，" would
  be native. Owner: Dot.

## What the red checks were (my script, not the app)

- **28 "a mark in view at every scroll position":** the P1 sliver, sampled at exactly 60px.
  It's one 6px step, not a gap at the end of the page; the item 3 check passes everywhere.
- **14 "count contrast":** my first estimate blended the 0.75 opacity in linear light. The
  correct sRGB blend gives 5.50 and 7.01.
- **14 "tap opens the box" at 320×568:** I tapped the link just inside the bottom of the
  screen, where the sticky Next button covers it. With the link scrolled into the middle, all
  7 languages pass. At the end of the page the link sits at 328–376px and Next at 432–480px,
  with no overlap.
- **2 "remembered invite":** my expectation was wrong. That path shows "You were invited as"
  and needs no box.

Iris
