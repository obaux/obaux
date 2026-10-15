# Website help form walk-through (main 4d41d542, 13 October 2026)

Iris, User Research & Testing Lead. Mira, 19:56 UTC: walk through the help form that shipped
in b32 (Wren `ee49f7cf` with Dot `f703f4d7`, D-562, card a83).

**How, without touching anything live:**
- A local build of main's site at `4d41d542`, served **to the test browser as
  `https://joinpam.org` from disk**.
- The form only appears on the real site's origin, and nothing else shows it.
- The help function was answered by my script. Every other host was blocked (none was
  asked). Nothing was sent anywhere: 2 calls to the function, both answered locally.
- No live form was submitted.

I checked 390, 320×568 and 1280 wide, light and dark, using Playwright. The script ran 80
checks plus re-measures. Every red check traced to my script except the three findings
below (see "My mistakes" at the end).

## 1. "Still stuck?" call-out and the dialog: PASS (one polish)

- **The call-out:** on a post (`/support/cant-sign-in/`) and on `/support/`, the card reads
  "Still stuck?", "Write to us. A person at Pam reads every message.", and a "Write to us"
  pill (292×48 at 390, full width).
- **Opening:**
  - At 390 it's full screen (390×844, no radius) ([shot](shots/b32-help-dialog-390.png)).
  - At 1280 it's a centred 560px box with 24px corners ([shot](shots/b32-help-dialog-1280.png)).
- **Closing:** Close and Esc both close it, and focus goes back to "Write to us", on both
  pages and at both widths.
- **The page behind** doesn't scroll while the dialog is open.
- **Clicking outside doesn't close it** on desktop. This happened at 1280 and 1024, with a
  mouse click and a pointer down/up on the backdrop; see P1
  ([shot](shots/b32-help-backdrop-click-still-open-1280.png)). On a phone the dialog is full
  screen, so there's no outside to tap.

## 2. The form: PASS

([390](shots/b32-help-form-390.png), [390, end](shots/b32-help-form-390-end.png))

- **Labels:** "What’s wrong?" and "How should we answer you?" are 17px and sit above their
  boxes. Each has a "· Required" mark.
- **Field sizes:** the email box is **56px** with 17px text. The message box is 164px with
  17px text and a 0/3000 counter.
- **"How do you use Pam? Choose all that fit."** is a real fieldset and legend, optional, with
  four answers: "I’m a member", "I run a program", "I’m a case manager", "I don’t use Pam
  yet".
  - Each answer can be ticked anywhere across its row's height (48px): on the text, on the
    box, or 8px above or below the text.
- **The line about what is sent** is there: "We send what you write, how you use Pam if you
  tell us, this page and the language you read in. Nothing else from your account."
- **What's actually sent** (from the request my script answered) is only `message`, `email`,
  `page`, `lang`, `roles` and the empty spam-trap `website`. For "I don’t use Pam yet" that's
  `roles: ["not_yet"]`.
- **Fade:** 0 to 1 opacity in **156ms**, on `cubic-bezier(0.2, 0, 0, 1)`. With reduced
  motion, the animation is `none` and it opens fully at once.
- Nothing is wider than the dialog at 320, 390 or 1280.

## 3. Night mode: PASS

([/support/, dark](shots/b32-help-dark-support-390.png),
[a row on keyboard focus](shots/b32-help-row-focus-dark-1280.png))

- **Help desk link titles:** 31 rows on `/support/`, every title `rgb(238, 241, 194)` =
  **#EEF1C2**. On the page (#1B1B1B) that's **14.76:1**.
- **Icons and arrows** are lime (`rgb(220, 224, 104)`).
- **Underlines:**
  - On hover and keyboard focus, a row's title is underlined, 1.5px with a 4px offset, over
    the soft lime fill (`rgba(220, 224, 104, 0.14)`).
  - Links in sentences are always underlined: the "Support" breadcrumb (14.76:1) and
    "Contact" (11.79:1).

## 4. The gap above the footer: PASS

I measured from the bottom of the last block to the top of the footer. On
`/support/cant-sign-in/` and `/support/joining-pam/` the last block is the Still stuck? card.
On `/support/your-safety/` it's "In danger right now?".

| | 390 | 1280 |
|---|---|---|
| cant-sign-in (form on / address only) | 60 / 60 | 120 / 120 |
| joining-pam | 60 / 60 | 120 / 120 |
| your-safety | 60 / 60 | 120 / 120 |

([your-safety, 390](shots/b32-help-gap-support-your-safety-390.png))

## 5. Keyboard and screen reader: PASS (one W, one polish)

- **Getting there and opening:** Tab reaches "Write to us". Enter opens a **modal** dialog
  named **"Still stuck?"** (`aria-labelledby` the heading), with focus in the message box.
- **Inside the dialog:**
  - The Tab order is: Close → message → four checkboxes → email → Send → (the page itself) →
    Close.
  - Nothing behind the dialog can take focus, and the hidden spam trap is never reached.
  - Space ticks a checkbox.
- **What a screen reader hears:**
  - `textbox "What’s wrong? Required"` and `textbox "How should we answer you? Required"`.
  - `group "How do you use Pam? Choose all that fit."` with its four checkboxes.
  - `button "Send to Pam"`.
- **Errors:** an empty Send marks both fields `aria-invalid` and ties the words to them with
  `aria-describedby`: "Tell us what happened, in a few words." and "Add your email so we can
  write back." The red is never the only signal; the words say it
  ([shot](shots/b32-help-errors-390.png)).
- **After Send:** "Sent. Thank you. A person at Pam will read it and write back." is in a
  `role=status`, so it's announced ([shot](shots/b32-help-sent-390.png)).

## Findings

- **W1. A screen-reader user who presses Send with an empty field hears nothing.** The errors
  appear and are linked to their fields, but focus stays on Send, and nothing in the dialog
  is a live region (`role=alert` or `aria-live`), so nothing is announced. A blind person
  presses Send and, as far as they can tell, nothing happens. The usual fix is to move focus
  to the first field with an error, so its name and error are read. Owner: Wren.
- **P1. Clicking outside doesn't close the dialog on desktop, though D-562 says it should.**
  The dialog uses Astryx `purpose="form"`, which deliberately ignores backdrop clicks so typed
  text isn't lost to a stray click. I'd keep that and change D-562's sentence, but it's Dot's
  decision.
- **P2. After Send, focus falls to the page.** The dialog closes and "Write to us" is replaced
  by the thank-you, so the button focus would return to no longer exists. A keyboard user
  goes back to the top of the page. Giving the thank-you block `tabIndex={-1}` and focusing
  it would keep their place. Owner: Wren.

## My mistakes, not the app's

- **"Fields are 24px tall":** I measured the inner input, not the visible 56px box.
- **"Checkboxes are 24px":** that was the label text; the tap area covers the row.
- **"A tap on a label at 320 missed":** the label was below the screen.
- **"Gap = 0 / 64":** I measured a layout wrapper that runs down to the footer.
- **"No underline on hover/focus" and "breadcrumb not underlined":** I read the inner span's
  style; the underline is on the link.
- **"Focus leaves the dialog":** what gets focus after Send is the page itself, which stands
  in for the browser's own controls. Nothing behind the dialog can take focus.

Iris
