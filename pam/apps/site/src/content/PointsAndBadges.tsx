import { CompareTable } from '../components/CompareTable';
import { Body, Lead, P, Section } from '../components/Prose';
import { Screenshot } from '../components/Screenshot';
import { Steps } from '../components/Steps';

/**
 * Support post: Points and badges today (members). Only what is live: four ways to earn
 * points, the same four as `AWARDED_TODAY` in packages/config/src/points.ts and the Points
 * screen's "Ways to earn" list (docs/points-awarding.md; save a place and finish setup, plus
 * plan a trip, D-468, and call a place, D-472), the ladder by points, and that nothing is
 * bought with points (REWARDS_ENABLED false). When a rule ships, add it here and to
 * AWARDED_TODAY in the same change. Category badges (Scholar, Griot, ...) are not awarded to real members yet, so they
 * are not named here.
 */
export function PointsAndBadges() {
  return (
    <Body>
      <Lead>
        Points show what you have done in Pam. They are not money and they cannot be cashed out. You will not
        lose points for missing a visit.
      </Lead>

      <Section title="How you earn points today">
        <CompareTable
          label="Ways to earn points today"
          rowHeading="What you do"
          columns={['Points']}
          rows={[
            { label: 'Save a place', cells: ['5 points, once for each place.'] },
            { label: 'Finish setting up', cells: ['25 points, once.'] },
            { label: 'Plan a trip to a place', cells: ['25 points, once for each place. Up to three new places a day.'] },
            { label: 'Call a place', cells: ['10 points, the first time you tap Call on that place. Up to five new places a day.'] },
          ]}
        />
        <P>
          The “Ways to earn” list on the Points screen shows these four. Pam cannot tell whether a call
          connected, so it counts the tap on Call.
        </P>
      </Section>

      <Section title="Levels">
        <P>
          Your level is your step on the ladder. It goes up as your points go up. You start at Returned.
        </P>
        <CompareTable
          label="The ladder"
          rowHeading="Level"
          columns={['Points you need']}
          rows={[
            { label: 'Returned', cells: ['0'] },
            { label: 'Rooted', cells: ['250'] },
            { label: 'Builder', cells: ['750'] },
            { label: 'Provider', cells: ['1,500'] },
            { label: 'Pillar', cells: ['3,000'] },
          ]}
        />
        <P>Two more steps, Elder and Chief, are coming later.</P>
      </Section>

      <Section title="Badges">
        <P>
          A badge is a picture for a step on the ladder, or for something you have done. Today your badge
          follows your points. More badges are coming.
        </P>
      </Section>

      <Section title="Who can see your points">
        <P>
          You can. So can the person who invited you, or a staff member who is responsible for guiding you.
          Programs and other members cannot.
        </P>
      </Section>

      <Section title="See your points">
        <Steps items={['Tap Profile.', 'Tap the badge with your level on it. It says “Your badge”.', 'Scroll to see the ladder and your badges.']} />
        <Screenshot
          name="points-and-badges/points.png"
          alt="The top of the “Your points” screen: your badge, the level name, the number of points and a bar showing how many more points to the next level. Under it, the “Ways to earn” list: Save a place, Plan a trip to a place, Call a place and Finish setting up Pam."
          caption="“Your points”, for an example person."
        />
      </Section>
    </Body>
  );
}
