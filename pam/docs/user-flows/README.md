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

A screen that is only reached by doing something on it (a drawer dragged open, a list
scrolled) says so in its `actions`: `{ click }`, `{ fill }`, `{ press }`, `{ wait }`, and, for
moving things, `{ drag: name, dx?, dy? }` and `{ scroll: name | 'page', by }` (see the header of
`flows.mjs`). "Trips with a past visit" uses `drag` on the Trips drawer's handle.

**Updated once a day, at about 2am Pacific**, by the design lane's nightly run, from
the day's merges to `main` (Will, 10 October 2026: "once a day only, at 2am. Otherwise
we run too many tokens"). It replaces the old rule that every change updated the map in
its own session (D-264). A lane job that adds, removes or rewires a screen writes one
line in its READY, `Screens: …`; the merge desk copies it into the merge commit; the
nightly run reads those lines since the commit in `last-map.txt`. The steps, and the two
ways to publish, are in the `pam-user-flows` skill:
`.claude/skills/pam-user-flows/SKILL.md`.
