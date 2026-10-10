# Changes waiting for a release

A session that changes something a person using Pam would notice writes **one
small file here** instead of editing `CHANGELOG.md`:

```
pnpm claim changelog "What a person notices, in a few words"
```

The file is a `# Title` and a few plain sentences, ending with the decision it
came from, like `(D-442)`. It has no version and no date.

The merge desk (`docs/lanes.md`) turns the waiting files into a release when it
merges a batch to main:

```
pnpm records:release 0.52.0                       # one change: keeps its title
pnpm records:release 0.52.0 --title "Staff, limits and a quieter notice"   # several
```

That puts the entry at the top of `CHANGELOG.md` and removes the files. The version
is chosen once, by one session, which is why two sessions can no longer take the
same one.
