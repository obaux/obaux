# Split Bloom — handoff

A full-screen breathing guide. Two soft, glowing half-ellipses sit on the left and right screen edges over a midnight-to-orange sky. They reach toward each other as you breathe in and pull back as you breathe out. A counter in the middle says what to do and for how many seconds.

Everything is one static HTML file (WebGL 1 fragment shader + vanilla JS). No build step, no dependencies, no network.

## What is in this folder

| File | What it is |
| --- | --- |
| `index.html` | The canonical source. Open it in a browser. Edit this one. |
| `artifact.html` | The same page in the form Claude Artifacts publishes: a `<title>`, a `<style>` block and the body content, with no `<html>`, `<head>` or `<body>` tags (the publisher adds the skeleton). Regenerate it from `index.html` (see "Publishing as a Claude Artifact"). |
| `reference/` | Renders of the intended look. Match these. |
| `reference/banner-1920x800.png` | The cover image made from this page in banner mode. |
| `HANDOFF.md` | This file. |

Live version (private to Will until shared): https://claude.ai/artifact/R2nM3Y8qkckwT23JA2HkpM

Source in the repo: `gradient-art/split.html` on branch `claude/arch-glow-gradient` (this folder's `index.html` is a copy). `gradient-art/index.html` in the same repo is an earlier, different page ("Breath Guide", five styles). It is not part of this work. Do not merge the two.

## The design in one paragraph

Midnight blue at the top of the screen, fading through red into orange at the bottom. In the dark upper part, a few tiny stars fade in and out. Two tall half-ellipses, flat sides on the screen edges, curved sides facing the middle. Each is white along the screen edge and fades to orange toward the curve, with a very soft blurred edge and no outline. The middle between them is just sky. Inhale: the halves reach inward and brighten. Exhale: they pull back and dim to 50%.

## Behaviour (the contract)

### Breath
- The breath is driven by a clock, `state.clock`, in seconds. It only advances while playing. It is independent of any visual motion.
- A pattern is a list of phases. Phase kinds: `in`, `out`, `full` (hold with lungs full), `empty` (hold with lungs empty).
- `breathAt(pattern, clock)` returns `v` in 0..1 where 1 is fully inhaled.
  - `in`: `v = ease(u)`; `out`: `v = 1 - ease(u)`; `full`: 1; `empty`: 0.
  - `ease(u) = 0.5 - 0.5 * cos(pi * u)` (slow start, slow end).
  - `u` is progress through the phase, 0..1.
- Patterns shipped (seconds): Calm in 4 / out 6. Coherent in 5.5 / out 5.5. Relax 4-7-8 (in 4, hold 7, out 8). Box 4-4-4-4 (in, hold, out, hold).
- Box breathing has no special visual. No square, no tracker. It is only a timing pattern.
- The page starts fully exhaled (`v = 0`) with the first phase at its start.

### Counter
- Centered on screen. Two lines: the cue (`Breathe in`, `Breathe out`, or `Hold`) in small uppercase letter-spaced text, and the whole seconds remaining in the phase (counting 4, 3, 2, 1) in a large light number.
- Holds are labeled `Hold` for both full and empty.
- The text is white with `mix-blend-mode: difference`, so it reads over both the white halves and the dark sky. Over the sky it comes out slightly teal. That is expected, not a bug.
- The DOM is only rewritten when the cue or the number changes.

### Shape
- Left half: an ellipse centered on the left screen edge. Right half: its mirror. Only the half that is on screen exists.
- The ellipse is measured from the nearest screen edge: `xe = W - |x|`, `en = length(vec2(xe / reach, y / ry))`. `en = 1` is the curved edge.
- `reach` is a fraction of half the screen width. `reachMin = 0.52` on full exhale, `reachMax = 0.88` on full inhale. Interpolated by the breath value.
- `ry = max(0.42, reach * 1.2)` in screen-height units, so each half is always taller than wide.
- Edge blur (`soft = 0.65`): alpha is `1 - smoothstep(1 - soft, 1.05, en)`. Never draw an outline, stroke or hard edge anywhere.
- Colour across the half: `uCore` (white) at the screen edge to `uTop` (orange) at the rim, via a quintic ease from `en = 0.18` to `en = 1.12`.
- Fade: the halves' strength is `mix(fadeMin, 1, breath)` with `fadeMin = 0.5`. At full exhale they are at 50%. The soft orange halo past the curved edge fades with them.
- The two halves never merge and there is no seam in the middle. Only one sky.

### Sky
- Vertical gradient in screen-height units, same constants as the earlier "Horizon" style without its landscape line, water or sun:
  - `HY = 0.24`, `skyK = smoothstep(0.85, HY, y)`.
  - Colour: `mix(uBg, mix(uGlowRed, uGlowOrange, smoothstep(0.55, HY, y)), skyK * (0.35 + 0.65 * breath))`.
- The glow brightens on inhale and relaxes on exhale. The orange stays on the bottom half at all times.
- A gentle vignette darkens the corners.
- A few-percent dither (about 1/255, changing each frame) hides gradient banding. Keep it.

### Stars
- Only in the dark upper part of the sky. The mask is the luminance of the sky colour: fully on below luma 0.07, fully off above 0.20. This is why stars retreat upward on inhale as the glow climbs, and why the orange bottom stays clean.
- Stars are behind the halves. When the halves dim to 50%, stars show faintly through them.
- Two layers of a hashed cell grid: about 46 and 24 cells per screen height. Per-cell chance of holding a star in a cycle: 0.15 and 0.06. Star radius is tiny (about 1 px). Brightness is low.
- Each cell runs its own life cycle of 2.5 to 5.5 seconds. A star fades in and fully out (`sin^2` envelope). The next cycle can put a star in a different place in the cell, or none. So stars fade out fast and new ones appear soon, without any flash.
- Slight tint variation, warm to cool. No sparkle, no glow around stars. No shooting stars. Will asked for them to be removed.
- `state.stars` scales the whole thing (0 hides it).
- Star time is `state.time`, which stops when paused.

### Sway
- A very small sinusoidal wobble of the curved edges: 0.006 screen-heights, scaled by `state.motion` (default 0.45). Set to 0 for perfectly still.

## Controls and layout

- Bottom dock: one `Controls` button, centered. It is at least 44px tall. It respects `env(safe-area-inset-bottom)`.
- The controls panel is a bottom sheet on phones (width <= 640px) and a 300px floating panel on larger screens. Closed by default. The dock hides while the panel is open. `Done` closes it. **The top of the screen must stay free of controls.** The Claude artifact viewer overlays its own UI there, which made controls unreachable.
- Panel contents:
  - Pattern select, Restart, Pause/Resume.
  - Five colour pickers: Sky top, Sky upper glow, Sky lower glow, Rim orange, Centre.
  - Sliders: Reach inhale, Reach exhale, Blur, Exhale dimming, Night sky, Sway.
- On touch (`pointer: coarse`) or narrow screens every control is at least 44px tall. Colour swatches are 56x40. Range inputs have a 44px touch area.
- Keyboard: `C` toggles the panel, space pauses.
- The canvas fills the whole viewport (device pixel ratio capped at 2). The halves must touch the real screen edges.

## URL parameters

| Param | Effect |
| --- | --- |
| `pattern=calm\|coherent\|relax\|box` | Start with that pattern. |
| `t=<seconds>` | Start at that point of the breath clock. |
| `time=<seconds>` | Seed the star field / flow time. |
| `motion=<0..2>` | Sway amount. |
| `clean` | Hide the dock and the keyboard hint. |
| `banner` | Cover-image mode: right half only, no counter, no controls. `reach=<n>` sets the half's size in screen-height units (default 0.5). |

To render the banner: open `index.html?banner&pattern=calm` at 1920x800, run `art.pause(); art.state.clock = 2.5; art.state.time = 12;` and take a screenshot. The reference render was made that way.

## JavaScript API (`window.art`)

`state`, `PALETTE`, `PATTERNS`, `setColors({ uTop: '#ff8a3a', ... })`, `setPattern(name)`, `addPattern(name, label, phases)`, `play()`, `pause()`, `restart()`.

Example custom pattern: `art.addPattern('mine', 'Mine · 5-2-7', [['in', 5], ['full', 2], ['out', 7]])`.

## Palette (defaults)

| Uniform | Hex | Role |
| --- | --- | --- |
| `uBg` | `#060b24` | Sky at the top, deep midnight blue |
| `uGlowRed` | `#c43c47` | Sky, upper glow |
| `uGlowOrange` | `#c8703e` | Sky, lower glow |
| `uTop` | `#ff8a3a` | Rim of the halves (and their halo), orange |
| `uCore` | `#ffffff` | Centre of the halves, white |

## Code map (all in `index.html`)

- `<script id="fs">`: the fragment shader. Uniforms: `uRes`, `uTime`, `uMotion`, `uBreath`, `uSoft`, `uReachMin`, `uReachMax`, `uFadeMin`, `uStars`, `uRight`, `uReachAbs` plus five colours. `starField()` is the star layer. `main()` composes sky, stars, halves.
- `PALETTE`, `LABELS`: colours and their picker labels.
- `PATTERNS`, `CUES`, `ease`, `breathAt()`: the breath engine.
- GL setup, `resize()`, `draw(b)`, and the `requestAnimationFrame` loop. Frame time is capped at 50 ms so a backgrounded tab does not jump.
- Panel construction, then the `window.art` API at the bottom.

## Publishing as a Claude Artifact

Artifacts take a page without `<!doctype>`, `<html>`, `<head>` or `<body>`. Build `artifact.html` from `index.html`:

1. Keep `<title>Split Bloom</title>` first.
2. Keep the whole `<style>…</style>` block.
3. Keep everything inside `<body>…</body>` (the scripts included), without the body tags.

Rules that matter here: no external scripts or fonts (none are used), every colour is explicit because the page is one deliberate dark look, and downloads and `window.print()` are blocked in the viewer (the page uses neither). Keep the title "Split Bloom" so the link and name stay stable.

## Decisions already made (do not undo)

- One style only. The earlier Sphere, Bloom (round), Horizon, Ripple and Lotus styles were dropped.
- No outline anywhere. No guide ring. No squircle or box visual. No tracker dot. No shooting stars.
- No split or seam in the middle. The halves touch the screen edges. The rim is orange, not green.
- Stars are sparse, tiny and quiet, and fade out fully on short cycles.
- Controls live at the bottom, never the top.

## Verified and not verified

Verified: shader compiles and renders in headless Chromium (software GL). Frames checked at the start, middle and end of an inhale, a mid-exhale, a hold, on a 390x780 phone viewport and a 1000x600 landscape viewport. Counter text matched the breath at every checked moment. Panel and dock sizes (44px targets) measured on a phone viewport. No horizontal scroll at 360, 390 and 430 px wide.

Not verified:
- Real devices. No one has watched this animate on a phone or inside the Claude app's frame, including frame rate on older phones.
- The pace of the star fades and of the breath easing in real time. They are judgment calls.
- Landscape and desktop. The halves are tuned for portrait phones. On wide screens they get large and are clipped at the top and bottom on a full inhale. If desktop matters, cap `reach` in absolute units there.
- Accessibility beyond touch size and a visible focus ring for native controls. There is no `prefers-reduced-motion` handling yet, and no screen-reader announcement of phase changes (`aria-live` is set to off on purpose, because it would announce every second).

## Ideas Will has not asked for

Soft chime or vibration on phase changes. Session timer or cycle count. A start screen so it does not begin until tapped. A `prefers-reduced-motion` mode that keeps the breath but removes sway and star churn.
