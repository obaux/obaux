# Orb hero — handoff to the session that builds it into the app

**Status:** working prototype, not yet in the app. Written 18 October 2026.
**Prototype:** `hero-orbs/index.html` (one file, no dependencies) on branch
`claude/webgl-orb-hero`. Phone preview: https://claude.ai/artifact/9dSMKEdoW16Vm4b1iWp9te
(a copy; the repo file is the source).

> **Assumption to confirm with Will first:** "the app" is PAM (`pam/`) and "our DS"
> is `@pam/ui` on Astryx. Nothing in the request named PAM; it is inferred from
> this repo. If it is wrong, ignore sections 3 to 6.

---

## 1. What Will asked for

Recreate the entrance animation in a screen recording he made (a glass-orb
lattice) in WebGL, as a **hero section for the mobile app**, with **icons inside the
circles**. He then changed it four times:

1. "Ignore the colour rainbow treatment for now, I'll just add circles with icons on them."
2. "Just 10 circles." (superseded by 4 below)
3. A **4:3 banner** at the top of the page, with the circles "more horizontal than
   vertical". Icons he will supply **fill the whole circle**; use that sizing.
   He also reported a flicker and a faint border around the icons; fixed, see below.
4. "Add an empty circle on the top left and two empty circles on each edge of the middle.
   Then the top has four, the middle has five, and the bottom has four: fourfold
   symmetry." Read as: one empty circle at the top left, and one empty circle at each end
   of the middle row (two in all). Rows are 4 / 5 / 4 = 13 circles.

So the deliverable is **13 circles in a 4:3 banner, 10 of them filled by an icon and 3
left empty**, doing this entrance. The glass/rainbow look was built, shown, and deliberately dropped. Do not
bring it back.

The source recording is not in the repo (it was a chat upload). The timeline below was
measured from it; Will still has the file.

## 2. What the prototype does

Timeline, in seconds (the constants live in `OrbHero.T`):

| When | What |
|---|---|
| 0 – 1.15 | Hero circle grows from 15% to 34% radius (as a share of the banner's width), ease-out |
| 1.15 – ~1.8 | Hero springs back to its resting size (10.1%, 12% larger than the rest), dipping about 6% under it before settling |
| 1.15 – ~1.8 | The other 12 circles spread out from the hero's centre, nearest first (0.22s per unit of distance). Each follows **damped springs**: position overshoots ~1.3%, size ~7.6%, then both settle. Springs (omega 10, 9.5 for the hero) are driven through a 0.2s ramp so they leave rest smoothly |
| after each circle lands | Idle: a slow two-axis float (about 3px) plus ~1% breathing, faded in over 1.2s |
| any time after ~1.9 | Touch / hover: nearby circles are pushed away (up to ~23px on a press) and spring back with a small wobble. `interactive: false` turns it off. Pointer only; no device tilt |
| `exit()` | Everything shrinks away, outer circles first, hero last (0.6s each) |

**Physics (18 Oct).** First pass was eased curves with a sine bob, which felt stiff once settled. Now: springs (`OrbHero.SPRING`; `zeta` below 1 overshoots, overshoot = exp(-pi*zeta/sqrt(1-zeta^2))), a tiny float after landing, and a touch response (`OrbHero.TOUCH`). The springs are precomputed into 480Hz tables, so any frame is drawn from `t` alone and `seek()` stays deterministic; touch is real-time state and is skipped when frozen. Two earlier jumps to avoid repeating: never switch a motion on at full strength (fade it in; the old bob switched on at 2.4s and every circle stepped ~5px), and never start a spring with a kick (the ramp).

**How it was checked.** Step `hero.seek(t)` then `hero._frame(t*1000)` at 60fps, read each circle's x/y/radius from `hero.data`, and look at the frame-to-frame change of the change (acceleration). Entrance: smooth, worst ~1.5 device px/frame² on the outer circles' long travel. After landing: ~0.04. Touch was driven with a synthetic pointer: a circle pushed 23px, released, returned through -6, +2, -1px.

**Speed (18 Oct, "a bit slow").** The shrink-and-reveal was sped up by about 1.45x: spring omega 7 to 10, stagger 0.4 to 0.22s per unit, lattice starting as the hero lets go (1.15s), ramp 0.3 to 0.2s. Damping (`zeta`) was left alone, so overshoot is unchanged; the layout now settles by ~1.8s instead of ~2.3s. Faster springs mean a larger acceleration on the outer circles' long travel (about 3 device px/frame² at worst, still a smooth curve, no step). To go faster or slower, scale `omega` and `latticeStagger` together.

**Not tried:** a real finger on a real phone. Touch and hover strengths (`TOUCH.hover`, `press`, `tap`) are guesses to tune by feel.

Layout: the canvas is the banner (4:3, `aspect-ratio` set by CSS; the engine lays out
to whatever size the canvas is, via `ResizeObserver`). A hex lattice in canvas-width
units (pitch 0.195). Rows are explicit, `rows: [4, 5, 4]`, each centred, so the lattice is
exactly mirror-symmetric (no jitter, one circle size); the hero is the centre of the middle
row. `empty: [[0,0],[1,0],[1,4]]` lists `[row, column]` of the empty circles, drawn as a
plain disc (`emptyFill`). Five across leaves about 8px of margin each side on a 402px
banner; widen the banner or lower `pitch`/`restSize` together if more room is wanted.

All circles are drawn in **one instanced WebGL2 call**. Each icon is one layer of a
**texture array** (512px per layer), mapped across the whole circle, cover-fit.

Public API (`class OrbHero`, constructor options in the header comment of the file):

```js
const hero = new OrbHero(canvas, { icons, fill, rows, empty, emptyFill, center, pitch, heroSize, restSize });
hero.play();   hero.exit();   hero.seek(t, exitT);   hero.destroy();
hero.ready     // Promise: atlas built, loop started
```

`icons` accepts URLs / data URIs, `<img>`/`<canvas>`/`ImageBitmap`, or `{ path }`
(a 24×24 SVG path, drawn white on a coloured disc; placeholder art only). Slot 0 is the
hero; the rest cycle outward. **Supplied art is the circle**: it is scaled to cover the
whole disc and clipped by it, so transparent corners or a square photo both work. `fill`
now only colours the disc behind the `{ path }` placeholders; there is no separate
circle fill under real icons.

**Flicker / faint border, fixed.** Cause: icons shared one atlas, so bilinear and mipmap
sampling bled neighbouring cells into the edge of each icon box (it shimmered as circles
bobbed), plus a baked drop-shadow added a dark halo. Now: one array layer per icon (no
cross-icon sampling), no shadow, no tilt offset on the icon, and edge coverage stays solid
to the circle's radius and only feathers outside it. Checked by sampling pixels across a
circle edge: one blended pixel from background to fill, nothing darker or lighter.

## 3. What has to change to meet PAM's rules

The prototype is a standalone file and **breaks several PAM rules on purpose** (it had
to be a demo). Read `pam/CLAUDE.md`, `pam/STATUS.md` and the newest log in
`pam/docs/sessions/` before starting; this list is only what applies to this piece.

| PAM rule | Prototype | What to do |
|---|---|---|
| **Astryx only**; no `<div>`, no `style={{}}`, no raw hex/px; style via `stylex.create()` + `xstyle` | Raw HTML, inline CSS, hex colours | Wrap in an Astryx layout component; size the `<canvas>` through `xstyle`/tokens. Run `pnpm exec astryx build "hero with circles"` and `astryx docs layout` first (`apps/web/.claude/CLAUDE.md`). |
| Colours come from tokens | Fill `#2a2d36` and the page `#121317` are literals | Read the resolved token colours from the DOM at mount (`getComputedStyle` on a themed element) and pass them to `fill`; re-read on theme change. `light-dark()` tokens are used elsewhere, so handle both themes. The prototype is dark-only. |
| Icons from the DS | Hand-copied Lucide paths | Use Astryx's icons (`astryx docs icons`), rasterised into the atlas, so the hero matches the rest of the app. The path icons are placeholders. |
| **i18n from day one; `t` vs `tPlain` (D-435)** | No strings | Any accessible name or label on these circles uses `tPlain`, and all seven languages stay in step (`docs/copy-changes.md`). |
| **48px minimum touch target** | Circles are not tappable | If a circle is tappable, put real Astryx buttons over the canvas at each circle's position, and enable them only once the layout has settled (a resting circle is about 80px across on a 402px-wide banner, so size is fine). The canvas itself is decorative: `aria-hidden` (the prototype already sets it). |
| **One primary action per screen; never dead-end; help** | n/a | Decide where this lives. The `SubPage` **hero template** (D-376) has a help exception (A19); other screens need back and help (A26). |
| Reduced motion | Jumps to the end state (`prefers-reduced-motion`) | Keep that. `OnboardingSlides.tsx` has a `usePrefersReducedMotion` pattern to follow. |
| Illustration flow (flat colour, Memphis, print grain) | Plain flat discs | This is not an illustration from the kit, so the standing flow does not apply as is. Ask Will whether the circles should carry any of that style. |
| Storybook is where UI is reviewed | None | See section 5. |

## 4. Engine fixes needed before shipping

These are gaps in the prototype, not design choices:

- **Pause when not visible.** It runs `requestAnimationFrame` forever. Stop on
  `visibilitychange` and when scrolled off-screen (`IntersectionObserver`).
- **Clean up properly.** `destroy()` stops the loop and the resize listener but does
  not delete GL buffers/texture. React strict mode mounts twice in dev.
- **WebGL context loss and no-WebGL2 fallback.** Today a failure just shows a text
  line. Render the same 13 circles statically with Astryx components instead.
- **Callbacks.** None. A screen will want `onSettled` (to enable taps) and
  `onExited`.
- **No tilt/parallax.** It was in an earlier version and was removed with the flicker fix;
  it is not in the recording. Do not add it back without checking the icon edges.
- **Idle cost.** After the entrance, redraw only if something is still moving.

## 5. Suggested build, in PAM's terms

Lane: **Design system & Storybook** (`packages/ui`, `apps/web/src/stories`). If the hero
lands on a specific screen, that screen's lane owns the wiring; that is two jobs
(`docs/lanes.md`), so split them.

1. `packages/ui/src/OrbHero.tsx` (`'use client'`), with the engine in its own file next
   to it; export from `packages/ui/src/index.ts`.
2. A story in `apps/web/src/stories/components/OrbHero.stories.tsx`. Show: the entrance,
   the settled state, `exit`, reduced motion, light and dark, and the no-WebGL fallback.
3. Checks: `pnpm --filter @pam/web build-storybook` must pass before pushing; then run
   `pnpm --filter @pam/web audit:fit` if any text is involved.
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

## 7. How to run and check the prototype

Open `hero-orbs/index.html` in a browser (Replay / Exit buttons at the bottom).
Freeze a frame for screenshots with `?t=1.8` (and `&x=0.5` to freeze mid-exit). The page is a 4:3 banner capped at 560px wide (PAM's page width), buttons below.

Headless check used so far (software GL, so it proves correctness, not speed):

```js
chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] })
// viewport 402x500, deviceScaleFactor 2, then goto file://…/index.html?t=3 and clip the top 330px
```

**Not tested:** frame rate or battery on a real phone GPU; any physical device; the
published artifact viewer. The whole thing has only been seen in headless Chromium.
