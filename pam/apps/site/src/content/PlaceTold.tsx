import { Body, Lead, P, Section } from '../components/Prose';
import { HowTo } from '../components/HowTo';

/**
 * Support post: Does the place know I'm coming? (residents, and programs). Words by Sage. Will approved the first
 * version (card a53). This is the version for the day Piper's attendance part A ships (D-526,
 * `my_program_visits`): a place whose program has a lead on Pam sees a planned visit with the member's first name,
 * the day and time and the service; any other place is told nothing (the app's `place.noLead` banner says so on the
 * place and on Plan a trip). Parts A and B (check-in) ship together, so the check-in mark is in. Live with b22
 * (12 October 04:30); this version published 12 October. App words: `place.call` "Call this place", `place.hoursOnGoogle` "Check hours
 * on Google", `place.flag` "Something is wrong here". The ending follows A28 (help desk, then Still stuck).
 */
export function PlaceTold() {
  return (
    <Body>
      <Lead>It depends on the place. Some programs are on Pam and see your visit. Most places are not told.</Lead>

      <Section title="Places that see your visit">
        <P>
          When a program is on Pam, the people who run it see the visits planned there: your first name, the day and
          time, the service you picked, and whether you were marked as there. They do not see your last name or the rest of your profile.
        </P>
        <P>
          If nobody marks you as there, the visit shows to them as missed a day after it ends. You can mark it
          yourself: tap “I’m here” when you get there, or “I went” up to 3 hours after the visit ends. This works only
          for a visit you planned at least 2 hours before it starts, and “I went” works 3 times in any 7 days. If you
          went and it says missed, tell the program. They can fix it for 14 days after the visit.
        </P>
        <P>If you cancel the visit, they stop seeing it.</P>
      </Section>

      <Section title="Places that are not told">
        <P>
          For every other place, your visit in Pam is there to help you plan. Pam says so on the place and when you
          plan a visit there.
        </P>
      </Section>

      <Section title="Before you go">
        <HowTo
          steps={[
            'Call ahead if you need an appointment. Open the place in Pam and tap “Call this place”.',
            'No Call button? Tap “Check hours on Google”. It usually shows a phone number too.',
          ]}
        />
      </Section>

      <Section title="If they didn’t know you were coming">
        <HowTo
          steps={[
            'Ask for the front desk.',
            'Show them your visit in Pam: the place, the day and the time are on your Trips.',
            'Ask what you need to do to be seen today, or to book a time.',
          ]}
        />
      </Section>

      <Section title="If the place was wrong">
        <P>
          If the place has closed, moved, or is not what Pam says, open it in Pam and tap “Something is wrong here”.
          Somebody at Pam checks every report.
        </P>
      </Section>

      <Section title="For programs">
        <P>
          If you run a program on Pam, the visits people plan with you show on your Home: their first name, the day
          and time, and the service. Cancelled visits drop off. You can mark someone as there from 2 hours before the visit
          until 14 days after it ends.
        </P>
      </Section>
    </Body>
  );
}
