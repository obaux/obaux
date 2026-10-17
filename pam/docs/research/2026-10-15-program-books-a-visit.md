# A program books a visit for a member who wrote to it: a plan for Will's card (15 October 2026)

Piper, Places & programs. **No code yet.** The merge desk asked for this after S1 (a real lead can now *see* the members who
wrote to her program, but "Book" still ends on "Example booking"). A program putting a visit on a member's Trips is new
behaviour, so Will decides before anything is built.

## What happens today

- The lead picks a member who wrote, then a day and time (New trip, "for" that member).
- `bookTrip` keeps it **in her browser tab only** (`addedTrips`). Nothing is saved with the program, the member is never
  told, and the screen says so: "This is only an example: nothing was booked with the program, and nobody was texted."
- A member's visit exists only if the member books it themselves (`book_trip_at_service`, D-454, D-470). Nobody else can
  write an appointment row: `appointments` has no insert, update or delete grant for `authenticated`, and DB test 69 holds
  that. Every write goes through a `security definer` function.
- What the member is told about programs today: Privacy says a program sees you "after you write to them, sign their rules,
  sign up with them or plan a visit there", and, for a visit, "your first name, the day and time, the service you picked,
  and whether you were marked as there" (`privacy.s.sharing.p2`). "A program sees the visits you plan there too"
  (`transparency.canSee.appointments`). **Nothing says a program can plan one for you.**

## The choice for Will

**A. Make it real (what the screen already promises).** The lead books; the visit lands on the member's Trips, marked
as booked by the program; the member can cancel it; the bell tells them. Details below.

**B. Suggest, don't book.** The lead picks a day and time and Pam sends the member a message in their conversation with the
program ("Fresh Start Kitchen suggests Friday at 9:00 AM") with one button: *Add to my trips*. Nothing is written to the
member's Trips unless they tap it, so no new behaviour in Privacy; a smaller build (a message with an action) and a slower
loop for a program that wants it settled at the desk.

**C. Leave it.** The lead sees who wrote, and tells them to plan the visit themselves (what the screen's intro nearly
says). Remove "Create new booking" from the + menu until A or B.

My recommendation is **A**, because it is what a program standing at a desk with a member already expects ("book me in"),
and because the member can always cancel. **B** is the safer first step if Will wants members never to see a visit they
did not make.

## A, in full

### 1. The database

One new `security definer` function, `book_visit_for_member(p_member_id, p_service_id, p_starts_at, p_program_service_id,
p_note, p_timezone)`, and the migration for it. **No RLS change, no new grant**: `appointments` stays closed to writes, so
DB test 69 stays true. It checks, in this order:

1. signed in, `my_role() = 'provider'`, an active account, with an organisation (`NOT_A_PROGRAM_LEAD`);
2. the place is one of *her own* organisation's services (`service.org_id = my_org()`), active and approved
   (`PLACE_NOT_FOUND`), and the optional program service belongs to it;
3. the member is an active member **linked** to her program: the same three arms `program_member_card` already uses
   (enrolled, a non-cancelled visit there, or a conversation with the org's staff), so someone who wrote to the program
   counts, and a stranger does not (`MEMBER_NOT_LINKED`); neither has blocked the other (`blocks`);
4. a start time in the future (`TRIP_IN_THE_PAST`), and no other non-cancelled visit of that member at that program
   within an hour of it (`ALREADY_BOOKED`);
5. a small daily limit per lead and member, so it cannot be used to flood someone's Trips (say 3).

It inserts the row the way `book_trip_at_service` does, with `provider_id = the lead` (the column already exists and is
null for a member's own plan, so it says who booked it) and `status = 'scheduled'`. **No points** are paid for planning
it (`plan_trip` is the member's own action); "I'm here" and "I went" pay as for any visit. The existing
`appointments_keep_reminder` trigger queues the day-before reminder only if the member has reminders on, and the
dispatcher sends nothing while `texts_live` is off. Both stay as they are.

Plus a read, `my_trip_booked_by()`, which returns `(appointment_id, program_name)` for the caller's visits that a program
booked, so `my_trips()` keeps its shape (the same trick as `my_trip_services()`, D-470). One migration, one DB test
(72): a linked lead can book; an unlinked member, another organisation's lead, a blocked pair, a member calling it, a
past time, a duplicate, and a direct `insert` all fail; the row has `provider_id`; DB test 69 is unchanged and still
green; a lead still cannot read an appointment row (65).

### 2. What the member sees

- **Trips:** the visit is on their list as any visit is, with one extra line on its card: "Booked for you by {program}"
  (picture 2). Its page is the visit's page as today: Change appointment, **Cancel this visit**, policies to sign,
  "I'm here" on the day.
- **The bell:** one notice, "{program} booked you a visit: {day}, {time}.", which opens the visit. A new
  `notifications.kind` (`visit_booked_for_you`) with a key and variables, never a sentence (the table's rule, 0038). A
  member's bell already exists (D-549).
- **Texts:** none while `texts_live` is off. With it on, a member who has agreed to texts gets the signed text
  `trips.booked.sms` ("Pam: {place} booked you for {day} at {time}. Tap to see it in Pam: {link}") that was written for
  this and never sent.
- **Today** the member is told nothing, because nothing is written. A is what adds all of the above.

### 3. What the program sees

No more than a visit the member planned (a63): first name, day and time, the service, whether marked as there; and when
the member cancels, it stops seeing it. It also now sees a booking it made on its own schedule, as it does for the
example one. Nothing about the member's account is added to what it reads.

### 4. Privacy and transparency lines (for Lena to check; Sage to sign anything new)

- A new sentence in `privacy.s.sharing`, next to p2: *"If a program you have written to books a visit for you, it shows
  on your Trips with the program's name, and you can cancel it."* It is a new behaviour, so it needs Will's signature
  (a63's pattern) and all seven languages before it goes live.
- `transparency.program.visits` ("The visits you plan there…") grows a clause for the visits a program plans for you.
- The bell notice, the Trips card line and the lead's confirmation:
  - The lead's confirmation already has signed words that fit the real thing. "Booked for {name}!" and "{place}, {day} at
    {time}. It is on their Trips now." (`trips.booked.title`, `trips.booked.body`) were written for this and held back
    until a booking is real, which is why the example screen replaced them. With texts on, `trips.booked.texted` is
    ready too.
  - New for Sage: the card line "Booked for you by {program}" and the bell "{program} booked you a visit: {day}, {time}."

### 5. Pictures (at 390, from the real components with the intended words)

1. The lead's confirmation: `shots/2026-10-15-piper-booking-plan-lead-confirmation.png` ("Booked for Jordan!", its signed
   words).
2. The member's Trips card: `shots/2026-10-15-piper-booking-plan-member-trips.png` (the extra line).

## What A costs, and what it does not touch

About one migration, one function, one read function, one DB test, the lead's New trip call (replace the local booking
with the function), the Trips card line, the bell kind and its copy, and three lines of Privacy. It does **not** touch
what a program may read (65), the closed writes (69), the member's own booking (D-454) or the points rules.

## Out of scope

"Add a person" (somebody who has not used Pam yet) texts an invite; it is a different flow and stays as it is. A lead
changing or cancelling a visit for a member is a second step (the member can cancel today; the lead cancelling is the
mirror and would need its own sentence).

## For Will

1. A, B or C? (My pick: A.)
2. If A: are you happy that a member sees a visit they did not plan, as long as it says who made it and they can cancel
   it? (The Privacy line above says so in one sentence.)
