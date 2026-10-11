import { Body, Lead, P, Section } from '../components/Prose';
import { HowTo } from '../components/HowTo';

/**
 * Support post: Does the place know I'm coming? (residents, and programs). Words by Sage. Will approved the first
 * version (card a53); this one says only what is true today (Mira, 03:27, answering Will's "if I search: I showed up
 * but they had no clue. What should we say or direct to on help desk?"). Pam does not tell any place about a visit
 * yet, so the line that a place with a program lead sees it on its calendar is left out until that ships (Piper's
 * part A); add it back then. App words: `place.call` "Call this place", `place.hoursOnGoogle` "Check hours on
 * Google", `place.flag` "Something is wrong here". The ending follows A28 (help desk, then Still stuck).
 */
export function PlaceTold() {
  return (
    <Body>
      <Lead>Pam does not tell a place that you are coming. Your visit in Pam is there to help you plan.</Lead>

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
        <P>Pam does not tell programs about planned visits yet. When it does, this page will say how.</P>
      </Section>
    </Body>
  );
}
