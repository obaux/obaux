# D-612 — One badge for Coming soon and Example

**Date:** 2026-10-18 · **Branch:** `claude/pam-design-d608-badges`

D-608 (Will, 18 October, 15:19): "Instead of having 'coming soon' and explaining what we don't do yet, we can simply have a badge saying 'coming soon'." Sage's audit routed the rows; the merge desk asked for one badge look for Coming soon and Example, used the same way on Text alerts.

**Decided.** `StatusBadge` in `@pam/ui` is Astryx's neutral `Badge` in its own size, in its own row so a stretching column does not stretch it. Words are `common.comingSoon` and `common.example` (Sage). It is the only drawing of either word.
- Profile's three promo cards (member reminders, case manager alerts, program lead alerts) are a title and a "Coming soon" badge; `PromoCard` lost `body`. The link's accessible name is "Title. Coming soon", so the badge is read out (the card's own label is the link's name).
- The example notes (`example.people.note`, `notify.example.note`, `home.calendar.preview.note`) are an "Example" badge. On the staff Home it sits over the list, under the count, so made-up people are marked before a name is read; elsewhere it keeps the note's place under a short list.
- Help's two Shortens are Sage's en.json (`help.desk.body` → "Search in your own words."); nothing drawn changed. `help.stuck.body` waits for the Write to Pam row (a100).

**Why not Astryx's `Token` or `StatusDot`.** Astryx's own guidance says "Badge = counts only", and PAM already draws labels in `Badge` (role chip, audience, category); Will and the merge desk said badge. If a later session wants the Astryx-pure answer, `StatusBadge` is the one place to change.

**Left for others.** Unused keys, not deleted: `profile.promo.reminders.body`, `profile.promo.alerts.body.adminList`, `profile.promo.alerts.body.providerList`, `example.people.note`, `notify.example.note`, `home.calendar.preview.note`. Text alerts (Nico) adopts `StatusBadge` in place of its `alerts.comingSoon` sentence.
