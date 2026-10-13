# D-548 — About Pam shows its carousel words again and loses the line above the tabs

**Date:** 2026-10-13 · **Branch:** `claude/compassionate-bohr-mzrchf`

**Decided by Will, 12 October 2026 (06:20 ET):** "Revert back from About Pam shows pictures only... You didn't do what I asked. It's okay to add pause to carousel, but the words in it were great, and now they're gone. What I wanted removed was the text between carousel and Tabs, and it's still there." And 06:22: "Remove any mention of 'someone coming home' from Pam's about page. That's not the focus of this prelaunch prep."

**What.** Reverses D-499 part 1 (the website hero part stays).
1. App › About Pam: the carousel draws its words again, with its normal wash, and keeps the Pause / Play button. `AboutScreen` no longer passes `showLines={false}`. The prop stays in `OnboardingSlides` (default true), unused.
2. The sentence between the tabs and the carousel (`about.how.member|admin|provider`) is gone from the screen and its three keys from all seven locales and the ledger. Nothing else read them.
3. `about.intro` no longer says "coming home" (Sage signed it, 13 October: "Pam connects people with the programs, mentors and case managers who can help: learning, earning and family support, in one app."). `admin.invite.member` ("Someone coming home") is not touched; Will is asked separately.

**Why it was misread.** "Only tab and image — it's redundant text" (10 October) was about the line between the carousel and the tabs, and was taken to mean the words on the pictures.

**What a later session might reverse.** Nothing planned. If words on the pictures ever go, ask which text he means.
