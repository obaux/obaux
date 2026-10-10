# Decisions from D-442 on

Everything up to D-441 is in `DECISIONS.md`, one long file. From D-442 each
decision is **its own file here**, named `D-<number>-<words>.md` and headed
`# D-<number> — <title>`, so two sessions writing decisions never edit the same
lines.

```
pnpm claim decision "Short title"
```

takes the next number (it looks at `main` and every pushed branch first), writes
the file, commits only that file and pushes — see `docs/lanes.md`, "Claiming a
number". Then replace the comment in the file with the decision.

What belongs in one: what was decided and by whom (Will's own words, with the
date), why, what it replaces, and what a later session would reasonably want to
reverse. Cite it from code and copy as `D-442`. To find one: `ls docs/decisions`
or `grep -rn "D-442" DECISIONS.md docs/decisions`.

`packages/config/test/numbering.test.ts` fails on a number used twice, across
`DECISIONS.md` and this folder, and on a file whose heading is not its own number.
