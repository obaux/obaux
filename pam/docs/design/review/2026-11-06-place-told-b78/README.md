# Is the place told I'm coming?: words for after b78 (held)

Sage signed these at 2be5f87c (claude/sage-signs, 6 November), after checking them against D-622 and D-624:

1. Before you go, step 2: "No Call button and no hours shown? Tap “Check hours on Google”. It usually shows a phone number too."
2. A line under the steps: "Pam does not show a phone number or hours for city Parks & Rec places."

**Hold until b78 is live.** Today's step 2 stays true until then. On the day it ships, from the repo root:

    git apply pam/docs/design/review/2026-11-06-place-told-b78/place-told-b78.patch
    pnpm --filter @pam/site posts:date is-the-place-told=<day>

Until `posts:date` runs, the site test "a post's Updated date follows its words" fails for is-the-place-told, by design.
