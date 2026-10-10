import { CompareTable } from '../components/CompareTable';
import { Needs } from '../components/Needs';
import { Body, Lead, P, ReadMore, Section } from '../components/Prose';
import { HowTo } from '../components/HowTo';

/**
 * Support post: Who is my guide? (members). Today's truth, kept short: a guide is
 * the person who invited you or a staff member responsible for guiding you; only a
 * case manager's own invite makes one (STATUS, "Assigning a case manager", D-415);
 * there is no screen to assign one yet, so nothing here promises it. Revise when the
 * assign-and-limit work (Accounts & invites) ships.
 */
export function WhoIsMyGuide() {
  return (
    <Body>
      <Lead>
        Your guide is the person who invited you to Pam, or a staff member who is responsible for guiding you.
        In Pam you may see the word “guide” or the words “case manager”. Most of the time they mean the same
        person.
      </Lead>

      <Section title="Do I have a guide?">
        <CompareTable
          label="How you joined and whether you have a guide"
          rowHeading="How you joined"
          columns={['Do you have a guide?']}
          rows={[
            { label: 'A case manager invited you', cells: ['Yes. The case manager who invited you.'] },
            { label: 'A program invited you', cells: ['Not yet. A program is not a guide.'] },
            { label: 'You signed up on your own', cells: ['Not yet.'] },
          ]}
        />
        <Needs title="You do not need a guide to use Pam.">
          You can still find places, save them and earn points. If you would like a guide, call Pam. We will help
          you reach someone.
        </Needs>
      </Section>

      <Section title="What your guide can see">
        <P>
          Your guide can see your plans, your progress and who you connect with. Your guide cannot read your
          messages to other people. Your guide sees a message only if you write to them, or if someone says it is
          not safe.
        </P>
        <ReadMore label="See the full list of who can see what" href="/support/what-others-can-see/" />
      </Section>

      <Section title="Find it in the app">
        <HowTo
          steps={[
            'Tap Profile.',
            'Tap Legal.',
            'Tap “What others can see”.',
            'The first card says “Your guide”. It tells you who that is.',
          ]}
          shots={[{ name: 'who-is-my-guide/what-others-can-see.png', alt: "The “What others can see” screen in Pam. The first card is titled “Your guide” and explains who your guide is.", caption: "“What others can see”, opened from Legal." }]}
        />
      </Section>
    </Body>
  );
}
