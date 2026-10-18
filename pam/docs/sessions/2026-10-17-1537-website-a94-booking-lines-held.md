# 2026-10-17 — website a94 booking lines held

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** website

## What changed
- A held patch (`docs/design/review/2026-10-17-a94-site/a94-site.patch`, two commits off main a2bd0654's successor, `git apply --check` passes on origin/main) for a94, "a program books a visit for a member" (Will signed it 17 Oct 15:21; ships in one batch with the booking, never before it).
- "What others can see": a new table row "Which of your visits a program booked for you" (guide Yes; program "Yes, but only visits to their own program"; other members No) and a paragraph, Sage's `sharing.p10` word for word: "If you have written to a program, signed up with it or planned a visit there, it can book a visit for you. It shows in your Trips with the program’s name, and you can cancel it." (the site's curly apostrophe).
- The post's fingerprint in `post-updated.json` (D-598), recorded at 2026-10-17.

## Words
Sage signed both, ledger e846cbd4. She asked me to leave the guide summary sentence ("Your guide can see your plans, your progress and who you connect with.") unchanged in "What others can see" and "Who is my guide": it mirrors `transparency.summary.see`, which is not changing. So "Who is my guide" has no change.

## Verified
Site tsc 0, site tests 123 pass, site build 0, a11y 0 (120 scans, 0 problems), and `program-sees-before-a-visit.test.ts` passes (26).

## Left undone
- On the day a94 ships: `pnpm --filter @pam/site posts:date what-others-can-see=<that day>` (the record says 17 Oct).
- "Who is my guide" has a screenshot of the app's "What others can see" screen ("Your guide" card). If Lena's lines change that card's picture, re-shoot it after her SHA.

## Needs a human
Nothing.
