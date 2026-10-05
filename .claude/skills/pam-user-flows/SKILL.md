---
name: pam-user-flows
description: Keep PAM's Figma user-flow map ("PAM — User flows") in step with the app. Use at the end of every PAM change that adds, removes, renames or rewires a screen, or changes what a screen is for — and whenever Will asks to see, create or update the user flows, the app map, or "how the app fits together". Also use when a DECISIONS entry (D-###) touches navigation, onboarding, invites, tabs or a role's screens.
---

# PAM user flows — the visual map of the whole app

Will (4 October 2026): "document app changes by also updating user flows …
so we have a visual map of how the entire app is designed." The map is a
deliverable of every change that touches screens, like the DECISIONS entry
and the session log. A change that moves a screen and leaves the map behind is
not finished.

**The file:** Figma, team Oba Studio — "PAM — User flows"
https://www.figma.com/design/DtlJg9Klx5BRfHbXBhkg98 (file key
`DtlJg9Klx5BRfHbXBhkg98`). Pages: `0 · Overview`, then one page per flow
(`1 · Sign in & joining`, `2 · Member`, `3 · Case manager`, `4 · Program lead`,
`5 · Super admin`).

**The source of truth is code, not the Figma file:** `pam/docs/user-flows/flows.mjs`.
Every screen is a Storybook story, so the map is drawn from the real screens.
Never hand-edit the Figma pages — the next run replaces them.

## When to update

After the change is built and Storybook builds:

1. **A new screen** → add a node (title, `story` id, `path`, `changed: 'D-###'`,
   a short `note` if its point is not obvious) and the edge(s) that reach it.
2. **A removed screen** → delete its node and edges.
3. **A screen reached differently** → change the edges (label = what the
   person taps, in their words).
4. **A screen that changed in a way the map should show** → set `changed` to
   the new D-number, and put a one-line entry at the top of that flow's
   `changes` (newest first, keep about three).
5. Set `UPDATED` to today.
6. A brand-new role or flow → a new entry in `flows`; it gets its own page.

Story ids are `<title-kebab>--<export-kebab>`, e.g. `Super admin/Screens` +
`InvitesLog` → `super-admin-screens--invites-log`. A state you can only reach
by tapping (a code step, a sent screen, an invite link ready) uses `actions`
(`{ fill: label, value }`, `{ click: name }`, `{ wait: ms }`).

## How to regenerate and publish

```bash
cd pam/apps/web
pnpm build-storybook                 # the map photographs these stories
node scripts/user-flows.mjs          # screenshots + user-flows-out/<flow>.html + .layout.json
node scripts/user-flows-figma.mjs    # user-flows-out/figma/*.js + order.txt
```

Check the HTML pages first (open `user-flows-out/<flow>.html`, or screenshot
them with Playwright): nothing overlapping, every screen showing the state the
title says.

Then publish. Load `skill://figma/figma-use/SKILL.md` first; pass
`skillNames: "resource:figma-use"` on every `use_figma` call.

1. **Draw the pages that changed** with `use_figma`, one call per page,
   running `user-flows-out/figma/<n>-<key>.js`. Each script replaces its page
   and draws the title, the latest-changes panel, the arrows and labels, and
   one card per screen. Every card has an empty `shot:<key>--<node>` slot with
   the screen's name and an **Open in Storybook ↗** link to the live story.
   They are 7–15 KB of plain code, which is safe to pass through a tool call.
2. **Screenshots — only when `mcp.figma.com` is reachable.** Will chose on
   4 October to keep it blocked for now (`curl -sI https://mcp.figma.com`
   gives a proxy 403). When it is allowed:
   - run `<n>-<key>.slots.js` to get the slot ids;
   - call `upload_assets` with `nodeIds` = those ids;
   - `curl -X POST` each `user-flows-out/thumbs/<key>--<node>.jpg` (or the
     full-size HTML shot) to its URL.

   The bytes go from disk, never through a tool parameter.
   **Never paste base64 into a `use_figma` script.** A model cannot copy
   40 KB of base64 exactly; that was tried on 4 October and failed with
   "Invalid base64 string" (D-264).
3. With the host open, the one-call alternative per page is `html_to_figma`
   (fileKey above, `cssSelector: "#canvas"`): POST
   `user-flows-out/<flow>.html`, delete the old page, and rename the new one
   to `N · Title`.

Finish with `get_screenshot` of each page you changed (page node ids come back
from the drawing script) and look at it.

## Record it

- Session log: one line — which pages of the map changed.
- If Will has not seen the map since the change, give him the Figma link.
- `user-flows-out/` is generated and git-ignored; commit `flows.mjs` and any
  script change.
