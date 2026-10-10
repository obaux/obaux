---
name: pam-user-flows
description: Keep PAM's Figma user-flow map ("PAM — User flows") in step with the app, once a day. Use for the design lane's nightly map run (about 2am Eastern, from the day's merges to main), and whenever Will asks to see, create or update the user flows, the app map, or "how the app fits together" right now. A lane job that adds or rewires a screen does NOT use this: it writes a `Screens:` line in its READY instead.
---

# PAM user flows — the visual map of the whole app

Will (4 October 2026): "document app changes by also updating user flows …
so we have a visual map of how the entire app is designed."

**Once a day, not per change** (Will, 10 October 2026: "switch up the cadence for
Figma flow updates once a day only, at 2am. Otherwise we run too many tokens, and
changes may happen in a day that would require too many updates to flow"). The
design lane runs it at about 2am Eastern from `main`; nobody else touches
`flows.mjs` or the Figma file. Outside the nightly run, only when Will asks.

## The nightly run

1. Merge `origin/main` into a fresh branch `claude/pam-flow-map-<YYYY-MM-DD>`.
2. `cat docs/user-flows/last-map.txt` is the `main` commit the map was last drawn
   from. `git log --merges <that>..origin/main` lists what merged since; read their
   `Screens:` lines (the merge desk copies each READY's into its merge commit), and
   `git diff --stat <that>..origin/main -- apps/web/src/app apps/web/src/screens
   apps/web/src/stories/roles` for anything a line missed.
3. **Nothing changed a screen → stop.** No commit, no message, no Figma call.
4. Otherwise: the steps below for the pages that changed; write the new `main`
   commit into `last-map.txt`; commit `flows.mjs` and `last-map.txt`; push the
   branch; send the merge desk one READY: the pages redrawn and the Figma link.
   Any screen the map could not show, as a FINDING in the same note.

**The file:** Figma, team Oba Studio — "PAM — User flows"
https://www.figma.com/design/DtlJg9Klx5BRfHbXBhkg98 (file key
`DtlJg9Klx5BRfHbXBhkg98`). Pages: `0 · Overview`, then one page per flow
(`1 · Sign in & joining`, `2 · Member`, `3 · Case manager`, `4 · Program lead`,
`5 · Super admin`).

**The source of truth is code, not the Figma file:** `pam/docs/user-flows/flows.mjs`.
Every screen is a Storybook story, so the map is drawn from the real screens.
Never hand-edit the Figma pages — the next run replaces them.

## What to change in `flows.mjs`

For each screen that changed (Storybook built from the branch):

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
   one card per screen. A page is found by its **title, not its number**
   (renumbering the pages once left a second Member page behind): the page is
   reused and renamed, and any other page with that title is removed. Under
   every screen sits a link to its story, `<STORYBOOK_URL>/?path=/story/<id>`,
   or **no story yet** where it has none. Every card has an empty
   `shot:<key>--<node>` slot with the screen's name on a card behind it; a
   screenshot placed on the slot covers that card. They are 7–15 KB of plain
   code, which is safe to pass through a tool call.

   **Draw only pages whose `flows.mjs` is on `main`, or merged with the branch
   that changed them.** Another session's branch can redraw a page from its own
   unmerged `flows.mjs` (10 October: Case manager and Super admin showed
   D-446's Limit or pause, Hand over and A member's guide before `main` had
   them). Drawing from `main` then removes those screens. Compare the page's
   screen names in Figma with the `flows.mjs` you are about to draw first.
2. **Screenshots — only when `mcp.figma.com` is reachable.** Both
   `mcp.figma.com` (where `upload_assets` URLs point) and `*.chromatic.com` are
   denied by the sandbox's network policy until the environment's allowed
   domains include them (`curl -sI https://mcp.figma.com` gives a proxy 403).
   When they are allowed:
   - `node scripts/user-flows.mjs` already saved the real screen at 390×844,
     light, to `user-flows-out/shots/<key>--<node>.jpg`;
   - run `<n>-<key>.slots.js` to get the slot ids (name → id);
   - `<n>-<key>.shots.json` says which file fills which slot;
   - call `upload_assets` with `nodeIds` = those ids, in the manifest's order;
   - `curl -X POST` each file to its URL with `-F file=@<path>`.

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
