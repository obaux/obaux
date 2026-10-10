# D-489 — Will signs the English of "Signing a program's rules"; the post goes live with member signing

**Date:** 2026-10-10 · **Branch:** `claude/compassionate-bohr-mzrchf`

**Decided** by Will, 10 October 2026, 15:28 UTC (card a27, relayed by the merge desk): "Approve", on the English of
"Signing a program's rules" exactly as it was on the card (the text in `apps/site/src/content/rules.ts`, English).

## What

- `"en"` is in `program-rules` in `apps/site/src/content/signed-off.json` and `"program-rules-live"` is `true`
  (D-466's rule: the post needs the signing screens to be real AND a signed language). The English is a Support post,
  `signing-a-programs-rules`, for members and for programs. The six other languages stay drafts (D-461): no native
  reader yet; they are built only in a preview build and shown in Storybook.
- The two paragraphs that were held behind the same switch come on with it: "Planning a visit" says some places ask you to sign a
  policy ("Policies to sign", "Sign", never stops you booking) and links to the rules post; "Pam words" says "You sign it in
  Pam".
- It goes live with the app's deploy that carries members signing (Policies part 2) and part 3 (a program sees a first name
  and a date: the post's "For programs" section promises exactly that), so the post and the screens agree on the day.

## Left open (before-launch)

- A lawyer reads "What your signature means" in all seven languages, and the upload disclaimer (D-485 point 5).
- A native reader for each of the six; pictures from the live screens after the deploy; the post for program leads,
  "Adding your program's policies"; the "only for this service" part when part 4 lands.

## What a later session might reverse

Nothing here changes Will's wording. Adding a language is one line in `signed-off.json` once it has a reader.
