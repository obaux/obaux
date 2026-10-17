# 2026-10-17 — website a94 guide picture

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** website

## What changed
- A second held patch, `docs/design/review/2026-10-17-a94-site/a94-guide-picture.patch` (next to `a94-site.patch`, `git apply --check` passes on origin/main): the picture of the app's "What others can see" screen in Who is my guide (`who-is-my-guide/what-others-can-see.png`), re-shot from Lena's a94 tip 2c725ac1. Before and after are in the same folder.

## What the picture shows
The picture is the top of the screen: the "Your guide" card and "The short version". Lena's new row (`transparency.canSee.bookedBy`, "Which of your visits a program booked for you.") is in the "Your guide can see:" list lower down, so it is not in the picture. The new picture is not different because of the row. It differs because the old one was stale in two places: the last line said "If something here worries you, call us. A person answers." (the app now says "write to us at hello@joinpam.org", A28), and the program line ("A program sees your first name and what you write to them, even before you plan a visit…") was not there. The post's alt text still describes it truthfully ("The first card is titled “Your guide” and explains who your guide is."), so it is unchanged.

## Verified
Checked by eye at 390. The patch is only the PNG. No words, no `posts:date` change beyond the first patch.

## Left undone
Nothing.
