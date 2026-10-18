# Orb hero — handoff to the session that builds it into the app

**Status:** working prototype, not yet in the app. Written 18 October 2026.
**Prototype:** `hero-orbs/index.html` (one file, no dependencies) on branch
`claude/webgl-orb-hero`. Phone preview: https://claude.ai/artifact/9dSMKEdoW16Vm4b1iWp9te
(a copy; the repo file is the source).

**Start with [`README.md`](README.md).** It explains how the engine works, every configuration
option, recipes for common changes, and the checking tools. This file covers only what is
specific to building it into PAM.

> **Assumption to confirm with Will first:** "the app" is PAM (`pam/`) and "our DS"
> is `@pam/ui` on Astryx. Nothing in the request named PAM; it is inferred from
> this repo. If it is wrong, ignore sections 3 to 6.

---

## 1. What Will asked for

Recreate the entrance animation in a screen recording he made (a glass-orb
lattice) in WebGL, as a **hero section for the mobile app**, with **icons inside the
circles**. The source recording is not in the repo (it was a chat upload); Will still has it.
Over the session he changed the brief several times, in this order:

1. "Ignore the colour rainbow treatment for now, I'll just add circles with icons on them."
2. "Just 10 circles." (superseded by 4)
3. A **4:3 banner** at the top of the page, with the circles "more horizontal than
   vertical". Icons he will supply **fill the whole circle**; use that sizing. He also
   reported a flicker and a faint border around the icons (fixed; README §6).
4. "Add an empty circle on the top left and two empty circles on each edge of the middle.
   Then the top has four, the middle has five, and the bottom has four: fourfold
   symmetry." Read as: one empty circle at the top left, and one at each end of the middle
   row (two in all). Rows are 4 / 5 / 4 = 13 circles.
5. Feel, over several rounds: a "little jump" in the middle row as things settle (fixed);
   it felt stiff, so add physics with a slight overshoot but keep it smooth; then speed up
   the shrink-and-reveal, then the initial growth.
6. Make it fully customisable and understandable for the next developer (this handoff,
   the README, the single config object, the Tune panel and the check scripts).

So the deliverable is **13 circles in a 4:3 banner, 10 filled by an icon and 3 left empty**,
doing this entrance. The glass/rainbow look was built, shown, and deliberately dropped.
Do not bring it back.

## 2. What exists

The engine (`class OrbHero`) is finished as a prototype. Summary of what it does by default:
the hero grows for 0.65s, then springs back to rest while the other 12 circles spring out from
behind it, everything settling by about 1.4s with a slight overshoot; afterwards the circles
float gently and are pushed away by touch or hover, then spring back. All numbers are in one
`OrbHero.DEFAULTS` object, documented in the README.

For the next developer, in order of usefulness:

- **Tune panel** (button under the banner on the demo page). Sliders for the main values;
  "Copy config" outputs only what differs from the defaults. Use it on a real phone with Will.
- **`OrbHero.DEFAULTS`** in `index.html`: every tunable value, with units and what it does.
- **`hero.configure(patch)`**, **`onSettled`**, **`onExited`**: change at runtime, and know when
  it is done.
- **`tools/`**: `check-motion` (is it smooth?), `regress` (did my change alter the animation?),
  `snapshot` (PNGs at chosen instants). README §7.

## 3. What has to change to meet PAM's rules

The prototype is a standalone file and **breaks several PAM rules on purpose** (it had
to be a demo). Read `pam/CLAUDE.md`, `pam/STATUS.md` and the newest log in
`pam/docs/sessions/` before starting; this list is only what applies to this piece.

| PAM rule | Prototype | What to do |
|---|---|---|
| **Astryx only**; no `<div>`, no `style={{}}`, no raw hex/px; style via `stylex.create()` + `xstyle` | Raw HTML, inline CSS, hex colours | Wrap in an Astryx layout component; size the `<canvas>` through `xstyle`/tokens. Run `pnpm exec astryx build "hero with circles"` and `astryx docs layout` first (`apps/web/.claude/CLAUDE.md`). |
| Colours come from tokens | `colors.placeholder` / `colors.empty` (`#2a2d36`) and the page `#121317` are literals | Read the resolved token colours from the DOM at mount (`getComputedStyle` on a themed element) and pass them as `colors`; re-read on theme change with `configure({ colors })`. `light-dark()` tokens are used elsewhere, so handle both themes. The prototype is dark-only. |
| Icons from the DS | Hand-copied Lucide paths | Use Astryx's icons (`astryx docs icons`), rasterised and passed in `icons` (canvas or image), so the hero matches the rest of the app. The `{ path }` icons are placeholders. Will's own art goes in `icons` as images and fills the circle. |
| **i18n from day one; `t` vs `tPlain` (D-435)** | No strings | Any accessible name or label on these circles uses `tPlain`, and all seven languages stay in step (`docs/copy-changes.md`). |
| **48px minimum touch target** | Circles are not tappable | If a circle is tappable, put real Astryx buttons over the canvas at each circle's position, and enable them from `onSettled` (a resting circle is about 80px across on a 402px-wide banner, so size is fine). The canvas itself is decorative: `aria-hidden` (the prototype already sets it). |
| **One primary action per screen; never dead-end; help** | n/a | Decide where this lives. The `SubPage` **hero template** (D-376) has a help exception (A19); other screens need back and help (A26). |
| Reduced motion | Jumps to the finished layout, no float or touch (`prefers-reduced-motion`) | Keep that. `OnboardingSlides.tsx` has a `usePrefersReducedMotion` pattern to follow. |
| Illustration flow (flat colour, Memphis, print grain) | Plain discs | This is not an illustration from the kit, so the standing flow does not apply as is. Ask Will whether the circles should carry any of that style. |
| Storybook is where UI is reviewed | None | See section 5. |

## 4. Engine work still needed before shipping

Done since the first draft (so do not redo): `onSettled` / `onExited` callbacks, `destroy()`
that frees GL objects and listeners (safe under React strict mode), `ResizeObserver` resize,
validation of the layout, `configure()`.

Still open:

- **Pause when not visible.** It draws every frame. `requestAnimationFrame` already pauses in
  background tabs, but a banner scrolled out of view keeps drawing. Add an
  `IntersectionObserver`.
- **WebGL context loss and a no-WebGL2 fallback.** Today a failure throws from the
  constructor (and the demo shows a text line). Render the same 13 circles statically with
  Astryx components instead, and re-create on `webglcontextrestored`.
- **Idle cost.** After the entrance, it redraws every frame because of the float. If battery
  matters, lower the frame rate when idle or stop when nothing moves.
- **Real-device tuning.** Frame rate, battery and touch feel are untested. See README §8.
- **Module form.** `OrbHero` is a plain global in one file; split it for import.

## 5. Suggested build, in PAM's terms

Lane: **Design system & Storybook** (`packages/ui`, `apps/web/src/stories`). If the hero
lands on a specific screen, that screen's lane owns the wiring; that is two jobs
(`docs/lanes.md`), so split them.

1. `packages/ui/src/OrbHero.tsx` (`'use client'`), with the engine in its own file next
   to it; export from `packages/ui/src/index.ts`. Its props are the engine's config.
2. A story in `apps/web/src/stories/components/OrbHero.stories.tsx`. Make the Storybook controls
   the same knobs as the Tune panel (they map one to one). Show: the entrance, the settled
   state, `exit`, reduced motion, light and dark, and the no-WebGL fallback.
3. Checks: `pnpm --filter @pam/web build-storybook` must pass before pushing; then run
   `pnpm --filter @pam/web audit:fit` if any text is involved. Run `tools/regress.cjs --save`
   before porting and `--compare` after, so the port is proven not to change the animation.
4. Process: name the session `PAM · <Name> · <Job>`; report STARTED / READY to the
   merge desk with `send_message`; `pnpm claim session`, update **only your lane's
   section** of `STATUS.md`, `pnpm claim decision` for choices a later session could
   question, `pnpm claim changelog` if it is user-visible. Builders never push to
   `main`; Will decides what merges.

## 6. Open questions for Will

1. Which screen is this the hero for (sign-in, Home, a hero-template page)? That decides
   the help and navigation rules, and which lane wires it.
2. What do the 10 icon circles represent: fixed brand icons, or the user's categories /
   services? That decides whether they are tappable.
3. Should the circles take any of Pam's illustration style, or stay plain?
4. Does the exit animation ship, or only the entrance? (The recording shows both.)
5. `apps/native` is a Capacitor shell over the web build with no lane yet, so this runs
   in the WebView. WebGL2 needs iOS 15 or later; check the minimum iOS target.
6. Is the touch response wanted at all? It was added unasked (README §4, `touch.enabled`).
7. Are the three empty circles placeholders for icons to come, or intentionally empty?

## 7. Not tested

Frame rate or battery on a real phone GPU; any physical device or finger; the published
artifact viewer. Everything has been run in headless Chromium on a software renderer. The
motion was checked numerically (frame-to-frame smoothness, spring overshoot, a synthetic touch)
and by screenshots; see README §7 for how to repeat that.
