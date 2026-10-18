# Brief: build the mood drawer for Split Bloom

Read `HANDOFF.md` in this folder first. It describes the page you are changing. Then do this task in `index.html`.

## Goal

Replace the developer-style controls panel with a simple, user-facing **mood drawer**. A person opens it, scans four moods in a second, taps one, and starts breathing.

Each mood is a breathing pattern that already exists. The drawer only changes how patterns are presented and chosen.

## Design system boundary

Will's team has its own design system (typography, colour, components, spacing). It owns how things **look**. This brief owns what things **do** and **say**.

The design system owns:
- The dock button, including how the mood name is shown on it.
- The timer and its labels: the counter in the middle (`#phase` cue and `#count` number).
- All typography, colour, radius, elevation and spacing tokens.
- The drawer's cards, buttons and links as components.

You build structure and behaviour only:
- Use semantic markup and stable class names or `data-` attributes so the design system can be applied without rewriting the logic (suggested: `data-mood`, `data-selected`, `.mood-card`, `.mood-drawer`, `.mood-begin`, `.dock-mood`).
- Do not choose fonts, font sizes, colours, radii or shadows. Where a style is unavoidable to make the page usable, put it in one clearly marked `/* placeholder: replace with design system tokens */` block using neutral defaults and CSS custom properties (for example `--ds-surface`, `--ds-text`, `--ds-accent`), so the design system can override them in one place.
- Do not restyle `#phase` or `#count`. Leave them exactly as they are. The design system will take them over.
- Layout rules that exist for function stay: minimum 44px touch targets, safe-area padding, bottom placement, no horizontal scroll.

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

- The bottom dock keeps one button. It shows the **current mood name** (Calm, Balanced, Sleepy or Focused). Tapping it opens the drawer. The design system decides how the mood name is presented on the button; render the name as plain text inside `.dock-mood` and expose the current mood as `data-mood` on the button.
- Minimum height 44px. Keep the existing dock position and safe-area padding.

## Drawer behaviour

- **Phone (width 640px or less):** bottom sheet, full width, rounded top corners, max height 62% of the screen, content scrolls inside if needed. A drag handle at the top.
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

## Styling: handled by the design system

Do not invent a visual style. Build the structure with neutral placeholder styling and leave the real look to the design system (see "Design system boundary").

What the structure must provide so the design system can style it:
- Each card is one tappable element containing two separate text nodes: the mood name and the "from → to" line, in that order.
- The selected card carries `data-selected="true"` and `aria-checked="true"`, and shows a **non-colour** selected indicator in the markup (an element for a check mark, not only a colour change). The design system styles it.
- The Begin button, the footer line and the `Good to know` link are separate elements, each with its own class.
- The sheet has a handle element, a heading, a card list, a button and a footer, in that order.

Behaviour that stays in this build:
- Sheet open and close is a slide and fade. Keep the transition duration in one custom property (default 250ms) so the design system can change it.
- Respect `prefers-reduced-motion`: turn the slide off, keep a quick fade.
- Respect `env(safe-area-inset-bottom)` for bottom padding. Keep at least 16px of side gutter.
- A neutral dark placeholder surface and light text are fine, so the drawer is readable until the design system is applied. Keep them in the marked placeholder block.

## Accessibility

- The drawer is a dialog: `role="dialog"`, `aria-modal="true"`, labelled by the heading.
- The four cards are a radio group (`role="radiogroup"`, each card `role="radio"` with `aria-checked`). Arrow keys move between them. Enter or Space selects.
- Move focus into the drawer when it opens. Trap focus inside while open. Return focus to the dock button when it closes.
- Every tappable control is at least 44px tall.
- Visible keyboard focus ring on every control (2px white outline with offset).
- Text contrast is the design system's job, but do not ship placeholder colours that fail 4.5:1.

## Acceptance checks

Test at 390x780 and 360x740 phone viewports and at one wide desktop viewport.

1. Page opens on Calm and the breath is running as before. The dock button shows `Calm`.
2. Tap the dock button: drawer opens, breath pauses, four cards and Begin are visible. On a 390x780 phone, all four cards, the button and the footer fit without scrolling. If they do not fit at 360x740, the content scrolls inside the sheet.
3. Tap Sleepy: it is marked selected (`data-selected`, `aria-checked`, check mark element present) and the button reads `Begin Sleepy`.
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

- The dock button shows the current mood name. The design system decides how it looks.
- The breath pauses while the drawer is open.
- Selecting a mood does not start it. Only the Begin button does.
- `Good to know` appears once, before the first Begin.
- The developer panel moves behind `?dev`.
- Everything visual (typography, colour, the dock button, the timer and its labels) is left to the design system. This build ships neutral placeholders in one marked block.

## Review before launch

The `Good to know` wording and the `Not medical advice.` line should be reviewed by someone with legal or clinical background before this ships.
