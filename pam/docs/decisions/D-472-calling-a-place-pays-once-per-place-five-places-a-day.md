# D-472 — Calling a place pays once per place, five places a day

**Date:** 2026-10-10 · **Branch:** `claude/places-programs-call-points`

**Decided** by the CTO under Will's delegation (Mira, 10 October 2026): calling a place pays 10 points, once per place, after planning a trip. The five-a-day limit is Piper's addition, below; Will or the CTO can change it.

**What.** `log_call(place, zone)` (migration `20261010122206`) pays 10 points, reason `call_service`, once per place ever, to a member only (a staff tap is ignored, no error). Honour system: the Call row is a plain `tel:` link, so Pam cannot know the call connected.

**The addition.** At most five new places a day (config `dailyCap: 5`; the spec had none). Without it a script could call `log_call` for every place in the catalogue at once. A sixth pays nothing and is not refused. It mirrors plan_trip's three a day.

**How the app hears the tap.** Astryx's list item passes no click on when the row is a link, so the place page listens on the document for a click on a `tel:` link and calls `log_call`, fire and forget. Nothing waits on it and the dialler opens at once. Only a real member on a real (catalogue) place asks.

**What a later session might reverse.** The cap; counting a program service's own number the same as the program's; paying only when the call lasted (not knowable).
