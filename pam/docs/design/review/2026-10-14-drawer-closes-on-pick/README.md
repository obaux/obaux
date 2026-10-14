# The Location drawer closes on a pick (D-575, Will 06:45) — before and after, 390

Light and dark, from the built app with stub data (no live key).

| | Before (Done) | After (Cancel, closes on a pick) |
|---|---|---|
| 1. The drawer as it opens | `before-1-drawer-open-{light,dark}.png`: **Done** at the top right | `after-1-drawer-open-{light,dark}.png`: **Cancel** at the top right |
| 2. After picking "1500 Market" | `before-2-after-picking-1500-market-{light,dark}.png`: the drawer is still open, 19102 ticked, Done still to press | `after-2-after-picking-1500-market-{light,dark}.png`: the drawer has closed and Explore says **Near 19102**, the list measured from there |

Cancel leaves the area as it was (as do Escape, a swipe down and the scrim). In the "after" drawer the stub lists City Hall twice only because the stub's City Hall row has a different id from the app's own; the real list does not.
