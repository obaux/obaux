# Brief: build the mood drawer for Split Bloom

Read `HANDOFF.md` in this folder first. It describes the page you are changing. Then do this task in `index.html`.

## Goal

Replace the developer-style controls panel with a simple, user-facing **mood drawer**. A person opens it, scans four moods in a second, taps one, and starts breathing.

Each mood is a breathing pattern that already exists. The drawer only changes how patterns are presented and chosen.

## Do not change

- The art: the sky, the two half-ellipses, the stars, the fade and blur behaviour, the counter in the middle.
- The breath engine (`PATTERNS`, `breathAt`, `ease`) and its timings.
- Controls stay at the **bottom** of the screen. Never put anything at the top. The Claude artifact viewer overlays its own UI there and it blocks taps.
- No new fonts, no external dependencies, no network calls. One HTML file.
- Do not add claims, benefits or wording beyond the copy in this brief.

## Mood to pattern mapping

Keep the existing pattern ids. Add mood metadata to each.

| Mood | Pattern id | Timing (for reference, not shown on cards) |
| --- | --- | --- |
| Calm | `calm` | in 4, out 6 |
| Balanced | `coherent` | in 5.5, out 5.5 |
| Sleepy | `relax` | in 4, hold 7, out 8 |
| Focused | `box` | in 4, hold 4, out 4, hold 4 |

Default mood: **Calm**.

## Entry point

- The bottom dock keeps one button. Its label is the **current mood name** followed by a small chevron (for example `Calm ⌄`). Tapping it opens the drawer.
- Minimum height 44px. Keep the existing dock position and safe-area padding.

## Drawer behaviour

- **Phone (width 640px or less):** bottom sheet, full width, rounded top corners (14px), max height 62% of the screen, content scrolls inside if needed. A small drag handle at the top.
- **Larger screens:** a 360px wide floating card, centered at the bottom.
- Close it by: tapping outside it, swiping the sheet down, pressing `Escape`, or choosing **Begin**.
- While the drawer is open, **pause the breath clock**. If it closes without Begin, resume exactly where it was.
- **Begin** starts the chosen mood from the start of its pattern (`clock = 0`), plays, and closes the drawer.
- Tapping a card selects it. It does not start anything. Only Begin starts.
- No Done button. No colour pickers, sliders or other developer controls in this drawer. Keep the old developer panel available behind `?dev` only, so the art can still be tuned.

## Content (use these exact strings)

Drawer heading: `How do you want to feel?`

Cards, in this order. Each has two lines: the mood name, then the "from → to" line.

| Mood | Line 2 |
| --- | --- |
| Calm | Wound up → Settled |
| Balanced | Scattered → Even |
| Sleepy | Wired → Winding down |
| Focused | Foggy → Clear |

Primary button: `Begin <Mood>` (for example `Begin Calm`). It always names the selected mood.

Footer line, always visible in the drawer: `Not medical advice.` followed by a link `Good to know`.

Do not show the timing, promise lines, "also known as" names or any extra text on the cards.

## "Good to know" panel

A small sheet or modal that opens from the footer link. It also opens **once automatically** the first time someone taps Begin, and Begin continues after they tap `Got it`.

Title: `Good to know`

Body, exactly:
- `Breathe gently.`
- `Stop if you feel dizzy.`
- `Skip the breath holds if you're pregnant or have a heart or lung condition, and check with your doctor.`

Button: `Got it`

Remember that the person has seen it with `localStorage` under a single key. Wrap every read and write in `try/catch`. If storage is unavailable, show it once per page load instead. Never block the app on storage.

## Visual style

Match the page. Use the same dark glass as the existing panel and the existing palette.

- Sheet: `rgba(20,18,20,.82)` with `backdrop-filter: blur(8px)`. White text. System font (`system-ui`).
- Heading 18px, weight 600. Card mood name 18px, weight 600. Card second line 14px, white at about 70% opacity.
- Cards: full width, minimum height 72px, 12px radius, 8px gap between them, 16px inner padding. A faint white 6% fill and a 1px white 12% border.
- Selected card: 2px border in orange `#ff8a3a` (the page's rim colour) and a white 10% fill. Do not rely on colour alone. Also show a check mark at the right edge of the selected card.
- Begin button: full width, minimum height 52px, orange `#ff8a3a` background with dark text `#060b24`, 12px radius.
- Footer text 13px, white at 70%. The `Good to know` link is underlined.
- Sheet open and close: 250ms slide and fade.
- Respect `prefers-reduced-motion`: turn the slide off, keep a quick fade.
- Respect `env(safe-area-inset-bottom)` for bottom padding. Keep at least 16px of side gutter.

## Accessibility

- The drawer is a dialog: `role="dialog"`, `aria-modal="true"`, labelled by the heading.
- The four cards are a radio group (`role="radiogroup"`, each card `role="radio"` with `aria-checked`). Arrow keys move between them. Enter or Space selects.
- Move focus into the drawer when it opens. Trap focus inside while open. Return focus to the dock button when it closes.
- Every tappable control is at least 44px tall.
- Visible keyboard focus ring on every control (2px white outline with offset).
- Text contrast of at least 4.5:1 on the glass background.

## Acceptance checks

Test at 390x780 and 360x740 phone viewports and at one wide desktop viewport.

1. Page opens on Calm and the breath is running as before. The dock button reads `Calm ⌄`.
2. Tap the dock button: drawer opens, breath pauses, four cards and Begin are visible. On a 390x780 phone, all four cards, the button and the footer fit without scrolling. If they do not fit at 360x740, the content scrolls inside the sheet.
3. Tap Sleepy: it shows as selected (border, check mark) and the button reads `Begin Sleepy`.
4. Tap Begin the first time: `Good to know` appears. Tap `Got it`: the drawer closes and Sleepy starts from the start of its inhale. The counter reads `Breathe in 4`.
5. Reopen, pick another mood, Begin: no `Good to know` this time.
6. Tap the `Good to know` link: the panel opens again.
7. Open the drawer and dismiss it (tap outside, swipe down, Escape): breath resumes where it was, mood unchanged.
8. Keyboard: Tab reaches every control, arrow keys change the selected card, Escape closes, focus returns to the dock button.
9. No horizontal scroll at any tested width. Nothing in the top 100px of the screen is interactive.
10. `?dev` still shows the old developer panel. Without it, no colour pickers or sliders are reachable.

## Deliverables

1. Updated `index.html`.
2. Regenerated `artifact.html` (steps in `HANDOFF.md`).
3. A short "Mood drawer" section added to `HANDOFF.md` describing the new behaviour and the `?dev` flag.
4. Fresh phone screenshots in `reference/` for: drawer closed, drawer open with Calm selected, drawer open with Sleepy selected, and the `Good to know` panel.

## Decisions made on Will's behalf (confirm or change)

- The dock button shows the current mood name instead of the word "Controls".
- The breath pauses while the drawer is open.
- Selecting a mood does not start it. Only the Begin button does.
- The selected state and Begin button use the page's orange.
- `Good to know` appears once, before the first Begin.
- The developer panel moves behind `?dev`.

## Review before launch

The `Good to know` wording and the `Not medical advice.` line should be reviewed by someone with legal or clinical background before this ships.
