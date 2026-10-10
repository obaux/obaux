import { CompareTable } from '../components/CompareTable';
import { Body, Lead, P, Section } from '../components/Prose';
import { Screenshot } from '../components/Screenshot';
import { Steps } from '../components/Steps';

/**
 * Support post: Points and badges today (members). Only what is live: two ways to earn
 * points (docs/points-awarding.md; migrations 0045 and 0047), the ladder by points, and
 * that nothing is bought with points (REWARDS_ENABLED false). The Points screen's own
 * "Ways to earn" list shows more rows than are awarded; the post says only two add points
 * now. Category badges (Scholar, Griot, ...) are not awarded to real members yet, so they
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
          ]}
        />
        <P>
          The Points screen lists more ways to earn. Those are coming. Only these two add points now.
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
        <Steps items={['Tap Profile.', 'Tap your points.', 'Scroll to see the ladder and your badges.']} />
        <Screenshot
          name="points-and-badges/points.png"
          alt="The top of the “Your points” screen: a medal, the level name, the number of points and a bar showing how many more points to the next level."
          caption="“Your points”, for an example person."
        />
      </Section>
    </Body>
  );
}
