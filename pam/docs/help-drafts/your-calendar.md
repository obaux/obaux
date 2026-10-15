# Draft post: Your calendar: who is coming in

**For Wren to register** (slug suggestion `your-calendar`; topic: programs). Words by Sage, for Will to sign.
App words in brackets. Answers the gap phrase "who is coming to my program", with "is-the-place-told" for
"why wasnt i told about a visit".

---

**Title:** Your calendar: who is coming in

**Who it's for:** Program leads

**Summary:** See the members who planned a visit to your program, by day, week or month, and check them in when
they arrive.

**Lead:** When members plan a visit to your program, they show up on your calendar, by day. (`home.calendar.preview.intro`)

## Where it is
- On Home, under "Coming in". (`schedule.title`)
- You see visits only for a program you added to Pam. Not there yet? Add your program first. (D-498)

## Look at a day, a week or a month
- Switch between Day, Week and Month. (`schedule.tab.*`)
- Each visit shows the person's name, the time, how long it is, and what kind of visit it is: a first visit, a class,
  a check-in or a tour. (`schedule.kind.*`)
- Search by a first name, a day like "Tuesday", or a time like "10:30". (`schedule.search.empty.body`)

## Check someone in
- When someone arrives, tap the circle beside their name. (`home.calendar.preview.intro`)
- Tapped the wrong one? Tap it again and choose "Undo check-in". (`schedule.checkin.undo.*`)
- For now, a check-in stays on the phone or computer you tapped it on. It is not shared with anyone else yet.

## Nobody on a day?
- "Nobody is booked" means no one has a time with you that day. (`schedule.none.*`)

---

**Check before it ships:**
- "A check-in stays on the phone or computer you tapped it on" is true today: nothing saves check-ins to Pam yet
  (`checkIns.ts`). Take the line out the day check-ins are saved. See the attendance FINDING.
