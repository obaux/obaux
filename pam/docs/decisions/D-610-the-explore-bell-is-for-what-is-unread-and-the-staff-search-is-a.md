# D-610 — The Explore bell is for what is unread, and the staff search is a plain field

**Date:** 2026-10-18 · **Branch:** `claude/pam-design-explore-bell`

Will, 18 October (Control Room): "I'm on the homepage and I still see the notification bell even though there are no active notifications. Let's make sure that's hidden so the search for programs bar takes up full width unless there's a notification. Also when I click on Search Programs and start typing, there's a mini dropdown that covers the full page and the results that show up behind it. There's no need for that many dropdowns."

**Bell.** On a member's Explore with no Messages tab, the bell is drawn only while something is unread. This replaces D-548's reading ("the list is non-empty, read or not"): a list of only read rows draws no bell on Explore. Will's word was "active". With nothing new the launcher takes the whole row and no room is held; the "bell was there last time" note (`pam.explore.bell`) is now written from the same answer, so a phone that last had an unread one holds the room, and one that did not, does not. Profile and Messages keep the bell always, so read notifications stay one tap away. Examples and demo accounts follow what the bell itself would count. D-548 passed `hideWhenEmpty` on the old `/places/` page; D-565 retired that page and the prop went with it, so Explore never had it. `HeaderBell`'s prop is now `hideWhenNothingNew`, switched on by `HeaderActions` (`bellOnlyWhenNew`) from a member's Explore only.

**Staff Home search.** The "Search members" bar is the plain `SearchField`, not `SearchPill` with a Typeahead. The list under it already filters as you type; tapping a row opens the person. The `onPick` prop and `search.none` are gone from `PeopleHomeView`; `home.caseload.search.none` is left in the locale files, unused, for the retire sweep.

**What a later session might reverse.** If members with only read notifications lose their way back, the bell can return on Explore; the rule is one prop. The website's Support search keeps its suggestions (not asked).
