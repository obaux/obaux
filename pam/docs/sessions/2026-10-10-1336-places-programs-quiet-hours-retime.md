# 2026-10-10 — places programs quiet hours retime

**Branch:** `claude/places-programs-quiet-hours-retime` · **Lane:** Places & programs (Piper)

## What changed

Migration `20261010133227` (expand only): a trigger on `notification_preferences` runs `queue_trip_reminder` for every future scheduled trip when `quiet_hours_start` or `quiet_hours_end` changes, so a queued text is re-timed (or queued, or cancelled) under the new window. Test 36's KNOWN GAP 1b is now a plain check. A story, "Trips with a past visit" (a `pastTrip` option on the pretend database), for Wren's help post.

## What was wrong, and what missed it

Test 36's 'once quiet hours are over it goes out' forced a queued text due by hand, then changed the window; the new trigger re-timed it back to the future. That is the intended behaviour, so the test now makes the text due again after the window change.

## Decisions made

None.

## Verified

Whole database suite passes (new test 39: a window set after planning moves a 21:30 visit's text to 20:55; a mid-morning one stays; widening the other way moves it back to the mark; another preference touches nothing; a cancelled trip is not revived; a member who said no is not queued). Config 1015, web 76, tsc clean, Storybook builds; the story shows the Past visits heading; fit audit 0 new in seven languages, pseudo's six place-name/scroll-fade hits accepted with reasons.

## Left undone

Part 6, the super admin queue.

## Needs a human

Mira applies the migration at merge.
