# 2026-10-10 — website: "Signing a program's rules" signed in English, and live

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** Website

Will (card a27, 15:28 UTC, relayed by Mira): "Approve" — the English of "Signing a program's rules", exactly as on the card.

## What changed

- `signed-off.json`: `"en"` in `program-rules`, `"program-rules-live": true`. The English post is a published Support post; the six
  other languages stay drafts. Planning a visit's signing paragraph (with a link to the post) and Pam words' "You sign it in Pam"
  come on with the switch. D-489 records the sign-off.
- Tests follow: the rules post is live and the English signed; nothing is built for the six outside a preview.
- Also on this branch, from Will's own messages earlier: the **post layout after Figma Learn** (`66571e3`): a centred column, a
  "Who this is for" box, gray `Needs` banners, `HowTo` (the steps in a black-outlined card and the screenshots in a tinted card next
  to it; stacked on a phone, smaller counters), step numbers centred on their text. Layout rules are in the skill.
- Mira's other ask (15:28): draft the program leads' post, "Adding your program's policies", hidden: next, not in this commit.

## What was wrong, and what missed it

- Two instructions from Mira 2 minutes apart disagreed (don't flip yet / flip now). The second came after Will's approval and said so;
  I followed it and told her.

## Decisions made

- D-489 — Will signs the English; the post goes live with member signing.

## Verified

- Site tests 26, tsc; normal build and a11y (numbers in the READY note).

## Left undone

- Lawyer; native readers; pictures after the deploy; the leads' post; "only for this service" when part 4 lands. Unchecked: the deployed app.

## Needs a human

- Piper/Mira: part 3 on main before this merges ("For programs" promises a first name and a date).
