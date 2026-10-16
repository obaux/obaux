# Day / Week / Month tabs at 48px, before and after (320×568), 15 October 2026

For Piper's program lead pass (D-355 had the tabs at 38px; the pass makes them 48px, the touch
minimum). Mira asked for the 320 before/after. Pictures only.

- **Before:** Storybook built from `main` (origin/main, 15 October 14:00).
- **After:** Storybook built from `claude/places-programs-lead-flow-pass` @ 0b09e618.
- Story `program-lead-states-home--week`, 320×568, English and Arabic: `tabs-before-after.png`
  (`raw/` for each one).

Measured in the page (the three tab buttons, width × height, CSS px):

| | Before | After |
|---|---|---|
| English | Day 37×30, Week 47×30, Month 51×30 | Day 48×48, Week 48×48, Month 51×48 |
| Arabic | يوم 33×30, أسبوع 46×30, شهر 38×30 | all three 48×48 |

What the pictures show:

- The tabs are now 48px tall and none is under 48 wide, in English and in Arabic at 320; the pill
  still fits with room either side, and nothing wraps or clips.
- The header takes about 12px more above the tabs (the pill is 18px taller; the date row below
  moves down by about the same).
- The pass's other changes show in the same picture and are not the tabs: a Help (?) button beside
  the bell (A26), and the week starting today rather than on Monday, so the empty days before today
  are gone and Today sits higher. That is why After shows more of Today than Before even though the
  tabs are taller.
- At 320×568 About two rows of Today are in view in both; the third is cut by the tab bar in both.

Nothing here needs a decision from Will; it is evidence for the pass.
