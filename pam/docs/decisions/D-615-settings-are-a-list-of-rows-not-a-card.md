# D-615 — Settings are a list of rows, not a card

**Date:** 2026-10-18 · **Branch:** `claude/pam-design-settings-list`

Will, 18 October, 17:51 (Control Room), on the Text alerts screen: the line above the list says when to receive a text; "Remove the card; it isn't needed. Each kind is its own item on the page, separated by lines"; "Move the badge below the row's name, so it fits longer text, especially in other languages"; remove the instructions (people already saw them when they first agreed to texts); remove the Privacy link (it is in Profile › Legal). "Please learn from this so the team can improve their design skills."

**Decided.** `SettingsList` and `SettingsRow` (`@pam/ui/SettingsList`) are the standard for any list of settings: no card, rows divided by a thin line, the name, the `StatusBadge` under it, the switch at the end; logical directions only, so it mirrors in Arabic, and the name wraps at 320. Text alerts uses it. The rules are written in Storybook, Foundations › Patterns: no card around a single list; badges under the name, not beside it; no instructions repeated after first consent; no legal links on task screens; a label over a list says what the list is.

**Built as if consent is already given.** Lena and Nico are confirming that nobody can turn a text on without having agreed first. If they find a way, the first switch-on routes to the consent screen (the merge desk tells me); the screen does not carry the lines.

**Words.** The line is `alerts.kinds`; Sage signs it and Lena puts it in seven languages. Until it lands, `alerts.spec` "the line over the list is the one Will asked for" is red on purpose. Unused keys for Lena's retire pass: `alerts.how`, `alerts.privacy`, `alerts.privacy.label`, `alerts.comingSoon` (the badge is `common.comingSoon`).

**What a later session might reverse.** A screen where people turn texts on without ever having seen the lines would need them back at the first switch-on, not on every visit.
