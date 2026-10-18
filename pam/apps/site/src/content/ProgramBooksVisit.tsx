import { Body, Lead, P, Section } from '../components/Prose';
import { HowTo } from '../components/HowTo';

/**
 * Support post: When a program books a visit for you (members, and a short part for programs). a94 (Will, 17 October
 * 2026), live in b58. The lead is Sage's `sharing.p10` word for word; the rest is signed in ledger 15977c8b. What it
 * leaves out on purpose: "Add a person" on Book a visit (someone who has not used Pam yet) saves and texts nothing
 * yet, and visit reminders are not sent today, so nothing here promises either.
 */
export function ProgramBooksVisit() {
  return (
    <Body>
      <Lead>
        If you have written to a program, signed up with it or planned a visit there, it can book a visit for you. It
        shows in your Trips with the program’s name, and you can cancel it.
      </Lead>

      <Section title="Where you see it">
        <P>
          A visit a program booked for you says “Booked for you” on Trips. You also get a notice in the bell, like
          “Example Learning Center booked a visit for you: Sat 10:00 AM”. Pam does not text you when a program books a
          visit.
        </P>
      </Section>

      <Section title="Cancel it">
        <HowTo
          steps={[
            'Tap Trips, then tap the visit. The place opens.',
            'Tap “Cancel this visit”.',
            'Pam asks first. Tap “Yes, cancel it”, or tap “Keep my visit”.',
          ]}
        />
      </Section>

      <Section title="Who sees it">
        <P>Your guide sees that the program booked it. The program sees the visit it booked, like the visits you plan there.</P>
      </Section>

      <Section title="For programs">
        <P>
          Open “Book a visit for a member”. It lists members who wrote to your program, signed up with it or planned a
          visit there. Pick one, then the day and time.
        </P>
      </Section>
    </Body>
  );
}
