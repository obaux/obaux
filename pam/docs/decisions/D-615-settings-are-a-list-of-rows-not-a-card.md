# D-615 — Settings are a list of rows, not a card

**Date:** 2026-10-18 · **Branch:** `claude/pam-design-settings-list`

Will, 18 October, 17:51 (Control Room), on the Text alerts screen: the line above the list says when to receive a text; "Remove the card; it isn't needed. Each kind is its own item on the page, separated by lines"; "Move the badge below the row's name, so it fits longer text, especially in other languages"; remove the instructions (people already saw them when they first agreed to texts); remove the Privacy link (it is in Profile › Legal). "Please learn from this so the team can improve their design skills."

**Decided.** `SettingsList` and `SettingsRow` (`@pam/ui/SettingsList`) are the standard for any list of settings: no card, rows divided by a thin line, the name, the `StatusBadge` under it, the switch at the end; logical directions only, so it mirrors in Arabic, and the name wraps at 320. Text alerts uses it. The rules are written in Storybook, Foundations › Patterns: no card around a single list; badges under the name, not beside it; no instructions repeated after first consent; no legal links on task screens; a label over a list says what the list is.

**Coming soon goes to the bottom (Will, 18 October, after seeing the pictures).** What is on comes first; badged rows follow, each group in its own order. It is the pattern's fifth rule, and `AlertsView` does it with a stable sort on what is live.

**The agree screen is the only opt-in (Lena's answer, 18 October).** A switch on Text alerts can be someone's first agreement today (staff who joined by invite never saw the texts question; anyone who chose "Not now"). So with no yes on file (none, "Not now", or withdrawn) a tap records nothing and turns nothing on: it opens `/reminders/?next=alerts&kind=<kind>`, the agree screen for the person's own role (staff rows for staff), which after "Agree to receive texts" returns to Text alerts with that switch on and after "Not now" returns with it off. After a STOP the switches stay off and cannot be turned on from here. With that, Text alerts needs no STOP line and no Privacy link.

**Words.** The line is `alerts.kinds`, signed "Please choose when you'd like to get a text." (Sage, f0279243), now in en.json. The other six languages carry drafts of it (mine, not signed: Lena needs a native reader).

**The "Coming soon" badge follows `texts_live`, on purpose.** Every row is badged while the server's `texts_live` is off, including the saved-place row, because nothing is texted (D-481, Lena's promise check); once it is on, the one kind Pam really sends (`closed`) has no badge. Unused keys for Lena's retire pass: `alerts.how`, `alerts.privacy`, `alerts.privacy.label` (the agree screens do not carry a Privacy link either), `alerts.comingSoon` (the badge is `common.comingSoon`).

**Not proven by a spec: staff.** Staff kinds are not live yet, so no e2e can switch one. The code is the same path (`/reminders/` has its own staff branch) and `Case manager/Created/States/Text alerts: agree first` draws the staff agree screens; a staff routing spec goes in the day `ALERT_TEXTS_LIVE` is flipped.

**Turning the last switch off keeps the yes (Nico, 21b053e9).** So the routing above only meets people who never agreed, chose "Not now", or have a withdrawn yes; only a STOP ends everything. The held test in `alerts.spec` expects `{alert_booked: false}` and no `sms_enabled`, and stays skipped while texts are held.
