# PAM user flows

The visual map of the whole app, by the person using it, lives in Figma:
**[PAM — User flows](https://www.figma.com/design/DtlJg9Klx5BRfHbXBhkg98)**
(team Oba Studio). One page per flow — Overview, Sign in & joining, Member,
Case manager, Program lead, Super admin — with a real screenshot of every
screen, the taps between them, and the newest changes marked with their
DECISIONS number.

It is generated, never drawn by hand:

| File | What it is |
|---|---|
| `docs/user-flows/flows.mjs` | The flows: screens (Storybook stories), taps between them, latest changes. **Edit this.** |
| `apps/web/scripts/user-flows.mjs` | Photographs each story and lays each flow out → `apps/web/user-flows-out/<flow>.html` and `.layout.json` |
| `apps/web/scripts/user-flows-figma.mjs` | Turns the layouts into Figma Plugin API scripts → `user-flows-out/figma/` |

Every change that adds, removes or rewires a screen updates the map in the
same session (Will, 4 October 2026, D-264). The steps, and the two ways to
publish (HTML import when `mcp.figma.com` is reachable; drawing scripts when
it is not), are in the `pam-user-flows` skill:
`.claude/skills/pam-user-flows/SKILL.md`.
