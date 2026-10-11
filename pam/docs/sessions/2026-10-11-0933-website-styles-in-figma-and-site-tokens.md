# 2026-10-11 — Website styles in Figma and site tokens

**Branch:** `claude/pam-design-website-styles` · **Lane:** Dot, Design Systems Lead · **Decision:** D-528

## What changed

Figma (Pam — Website, `wizzRwn3cjixue2p6eeZfG`): a variable collection `Website` (Light/Dark, 23 colours) and 32 text styles `Website/<Group>/<Name>` (Figtree). Every layer on Home, Support, Post, About, Copy proposals and Components is bound to them. Nothing was deleted or redrawn; the older Astryx library variables and local "Colour"/"Pam/…" styles are still in the file, unused by these pages.

Code (`apps/site`): `src/lib/website.stylex.ts` (colours, `--website-*`, `light-dark()`), `website-type.stylex.ts` (32 type styles), `website-palette.ts` (same colours as data), `test/website-tokens.test.ts` (AA in both themes, file agreement). `packages/ui` and the app's tokens are untouched.

## Merges (Figma)

#121212 → Text/Primary · #0F5947 → Brand/Primary (#0F5847) · #E0E0E0 → Border/Strong (#D4D4D4) · #F1F4F7 (local color/page) and #F7F7F5 → Surface/Muted (#F1F1F1) · #EDF7F2 → Surface/Brand soft (#E7EFE6) · #C5E0C0 → Surface/Green (#BCE0BB) · #1C1C1C → Surface/Ink (#1B1B1B) · #0E933E and #28A957 → Accent/Success (#0B991F) · library colours onto their Website twins (background-body → Surface/Page, text-primary → Text/Primary, accent → Brand/Primary, and so on) · #171717 and Icon/Primary → Icon/Primary. Kept apart on purpose: #666666 (Text/Muted) vs #474747, and #E2E2E2 (Surface/Gray) vs #F1F1F1. Text: 53.1 → 53, 26.1 → 26, 19.6 → 20, 16.6 → 17; the 140% and 150% line heights on the Copy proposals page became fixed px values.

## Contrast

Dark values moved to pass AA: Text/Secondary #9E9E9E → #A6A6A6; Text/Muted → #8F8F8F; Icon/Shamrock #0B603D → #108E5A. Light limits (the design's own values, not changed): Text/Muted is under 4.5:1 on Gray, Green and Purple; Accent/Success is 3.76:1 on white, so icons and strokes only. The test pins both.

## Verified

`pnpm typecheck` and `pnpm test` in `apps/site` (88 tests); both token files compile with the StyleX plugin; layout sizes on Home (desktop and phone), Post, About, Components unchanged (Copy proposals moved 1–5 px from merged line heights).

## Left undone

Not bound on purpose: image-backdrop fills and overlays on Components (black, white at 40/50%), two purple dashed outlines that are Figma's own component-set chrome, two `#FFFFFF` at 80% fills on image-plus-colour layers (Home 24:711, Copy proposals 31:302; Figma will not rewrite those), two 11.9px illustration texts on Home. Gradients and images untouched. Nothing imports the new files yet; Wren's pages will.

## Needs a human

The older library variables and styles can be removed in Figma once Will is happy. The redundant stand-in file `o9axtp3IwICQixuJVoSlpg` still needs deleting in Figma.
