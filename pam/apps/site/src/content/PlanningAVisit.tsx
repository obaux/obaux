import { Body, Lead, P, ReadMore, Section } from '../components/Prose';
import { Screenshot } from '../components/Screenshot';
import { Steps } from '../components/Steps';
import { VISIT_REMINDERS_LIVE } from './flags';

/**
 * Support post: Planning a visit (members). Written from main on 10 October (Piper's trips:
 * D-454 saved trips, D-470 a trip names its service, cancel + past visits) in the app's own
 * words (en.json: trips.*, place.visit.*, place.services.pickFirst, place.schedule). The
 * reminder paragraph follows `VISIT_REMINDERS_LIVE`
 * (./flags.ts) and say only what is live. When the flag flips, add one plain sentence about
 * when the reminder comes (a visit at 9 pm or later is reminded the evening before): it is
 * in docs/before-launch.md. Points are one sentence and a link; the numbers live in
 * Points and badges.
 */
export function PlanningAVisit() {
  return (
    <Body>
      <Lead>
        You can plan a visit to a place in Pam. Pam saves it to your account, so you can see it on Trips from
        any phone you sign in on. You can change it, or cancel it.
      </Lead>

      <Section title="Plan a visit">
        <Steps
          items={[
            'Tap Trips.',
            'Tap “New trip”. The screen is called “Plan a trip”.',
            'Pick a place. It says “Pick a program. Your saved ones are first.” You can also tap “View all places to visit”, or search by name.',
            'If the place lists services, its page opens with “Pick a service”. Choose one, then tap “Plan a trip”.',
            'Pick a day and a time. Tap Next.',
            'Look it over on “Check your trip”. You can add a note for them, or skip it. Tap “Add this trip”.',
          ]}
        />
        <P>
          You can also start from a place. Open it from Explore or Saved, and tap “Plan a trip”. If it lists
          services, pick one first.
        </P>
        <Screenshot
          name="planning-a-visit/pick-a-service.png"
          alt="A place with two services to choose from, “Computer classes” and “Drop-in help”, and a “Plan a trip” button at the bottom."
          caption="A place that lists services: pick one, then “Plan a trip”."
        />
        <P>
          Some places ask you to sign a policy before you go. If so, you will see “Policies to sign” on the
          place, and a “Sign” link on Trips.
        </P>
      </Section>

      <Section title="Change a visit">
        <Steps
          items={[
            'Tap Trips, then tap the visit. The place opens.',
            'On “Your next visit”, tap “Change appointment”.',
            'Pick a new day and time. Tap “Save the new time”.',
          ]}
        />
        <Screenshot
          name="planning-a-visit/your-next-visit.png"
          alt="A place with a green card, “Your next visit”: Monday, October 12 at 10:00 AM for GED classes, with “Change appointment” on the card and “Cancel this visit” under it."
          caption="A place with a visit coming up."
        />
      </Section>

      <Section title="Cancel a visit">
        <Steps
          items={[
            'Tap Trips, then tap the visit. The place opens.',
            'Tap “Cancel this visit”.',
            'Pam asks first. Tap “Yes, cancel it”, or tap “Keep my visit”.',
          ]}
        />
        <P>Pam says: “Any reminder for it is cancelled too. You can plan another time whenever you like.”</P>
        <Screenshot
          name="planning-a-visit/cancel.png"
          alt="A box that asks “Cancel your visit to Example Learning Center?” with a green button, “Yes, cancel it”, and “Keep my visit” under it."
          caption="Pam asks before it cancels."
        />
      </Section>

      <Section title="Past visits">
        <P>
          When a visit’s time has gone, it moves down to “Past visits” on Trips, with the most recent first.
          “Past visits” lists the visits you planned.
        </P>
        <Screenshot
          name="planning-a-visit/past-visits.png"
          alt="The Trips screen, scrolled down. Under the visits coming up there is a heading, “Past visits”, and under it one earlier visit, to Riverside Job Center on Wednesday, October 7 at 10:00 AM."
          caption="Trips, with a past visit."
        />
      </Section>

      <Section title="Reminders">
        <P>
          {VISIT_REMINDERS_LIVE
            ? 'Pam texts you a reminder the day before a visit, if you said yes to text reminders. If you change a visit, the reminder moves with it.'
            : 'Texts that remind you before a visit are coming. Pam does not send them yet. We will say here when they are ready.'}
        </P>
        <ReadMore label="Texts from Pam: which ones, and why one didn’t come" href="/support/texts-from-pam/" />
      </Section>

      <Section title="Points">
        <P>Planning a visit to a place you have not planned before earns points.</P>
        <ReadMore label="Points and badges, today" href="/support/points-and-badges/" />
      </Section>
    </Body>
  );
}
