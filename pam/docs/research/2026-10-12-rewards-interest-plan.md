# Plan: how many members look at their points (12 October 2026)

Iris, User Research & Testing Lead. Will, a69 (06:02 UTC): "please tell user research to
set up a way to analyze how many members tap on rewards screen so we can learn the demand
for it." This is a plan, not a build.

## 1. Which screen, and which taps count

There's no screen called "Rewards". What a member sees about points today (`main`
`238135e`):

| Where | What it shows | Counts as interest? |
|---|---|---|
| **Your points** (`/points/`, `app/points/page.tsx`) | the ladder, "Ways to earn", badges | **Yes: the main measure** |
| Profile, the **"Your badge"** tile (`ProfileView.tsx`, `href="/points/"`) | badge name and art | **Yes:** today it's the only way into Your points |
| Profile's "Points" number | the total | No; it's on screen whether you want it or not |
| "You are in" after joining; "You earned N points" after I'm here / I went | points just earned | No; shown, not chosen |

So **one tap counts**: opening Your points. Profile opens are counted too, as the
denominator: of the people who reach Profile, how many go on to their points.

## 2. The question and the measure

**Question:** do members come back to look at their points by choice, often enough to
justify building something to spend them on?

**Measures, per week (Monday to Sunday, Philadelphia time):**

- **P:** times Your points was opened.
- **F:** times Profile was opened.
- **A:** members active that week. This is one total from `profiles.last_active_at`, which
  Pam already keeps, so nothing new is stored for it.
- **Read as:** P ÷ A (opens per active member) and P ÷ F (how often Profile leads on to
  points).

## 3. Counting without knowing who

- **One row per screen per day:** `screen`, `day`, `count`. No member id, no account, no
  device id, no time of day, no place, no language. Nothing a person could be found from.
- **Each phone counts at most once per screen per day.** The app keeps a "counted today"
  mark in the phone's own storage and never sends it. So `count` is roughly "phones that
  opened it today", not taps, without Pam knowing which phones.
- **Small numbers stay hidden.** A total under 5 is read as "under 5". With few members, a
  "1" on a quiet day could point at someone.
- **I see only weekly totals,** read by the merge desk or Will from a summary function. No
  row-level access for me; my rule holds.
- **The call itself is signed in.** A member's phone calls the counter while signed in, so
  Pam's request log sees who made the call, as it does for every request. That log is
  deleted within a week (Privacy, "What we keep", p11, a67). The count table never has it,
  and nothing joins the two. (Sage, 12 Oct.)

## 4. What it needs

- **A Privacy line, signed by Will.** The Privacy page lists everything Pam keeps, so the
  count is new. My draft went to Sage, and her final is with Mira for Will's card. It goes
  under "What we keep":

  > "Each day, we count how many phones opened Your points and your Profile. It is one
  > number for each screen, for everyone together. It has no name, phone number or account
  > in it, so it can't show who opened what. To count each phone only once a day, your
  > phone keeps a note that stays on it. In our reports, a number under 5 shows only as
  > "under 5"."

  It names the two screens, so **counting any other screen means changing this line**
  (tell Sage). It says "shows as under 5", not "hidden", because the table keeps the exact
  number. It needs all seven languages (Lena), and a matching line on the transparency
  screen if Will wants one.
- **Who builds it:** Piper (Places & programs), who owns `app/points` and Home. The work:
  - a migration: a `screen_counts` table and an `increment_screen_count(screen)` function
    any member may call, that takes no id and returns nothing;
  - a weekly summary function readable by staff only;
  - the call on `/points/` and on Profile, with the once-a-day mark.

  Ava should look at the Profile call, since Profile is her screen. Merge desk applies the
  migration.
- **A test** that the table has no column that could hold a person, and that the function
  stores nothing but the screen name.

## 5. When to read it, and what would mean demand

- **When:** start counting the day it ships. Read on my Thursday pass after **four full
  weeks**, and use only weeks 3 and 4. New members open everything once, so the first weeks
  measure novelty.
- **Too few to say:** fewer than 30 active members a week (A < 30). We keep counting
  instead of deciding.
- **Real demand:** in weeks 3–4, **P ÷ A ≥ 0.5** (half an open per active member per week,
  i.e. people returning by choice) **and** **P ÷ F ≥ 25%** (one Profile visit in four goes
  on to points).
- **Weak demand:** **P ÷ A < 0.2.** Points are something people get, not something they
  come for; build visits and programs first.
- **In between:** keep counting another month, and ask in person. A one-question check on
  the Points screen ("Would you use your points for something?"), with consent, is a
  separate decision for Will.

**Caveat:** this measures interest in points, not in a reward that doesn't exist yet. It
won't say what reward people want. With most programs not on Pam, points come mostly from
calls, saves and planning, so the counts reflect how members use Pam today.

Iris
