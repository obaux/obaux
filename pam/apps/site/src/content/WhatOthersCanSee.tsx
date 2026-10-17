import { CompareTable } from '../components/CompareTable';
import { LegalLink } from '../components/LegalLink';
import { Body, Lead, P, Section } from '../components/Prose';

/**
 * Support post: What others can see (everyone; a table). Built from what Pam promises
 * members on screen — `packages/config/src/transparency.ts` and the privacy page
 * (`privacy.s.who-can-see.*`, `transparency.canSee.*`) — not from guesses. Rows whose
 * answer the reader could not stand behind (a phone number, the language you chose,
 * what Pam's own staff see, whether a program is sent a report) are left out; the
 * privacy policy covers the rest. "Your guide" is the case manager who invited you.
 *
 * What a program sees is said here the way the Privacy page says it (`privacy.s.sharing.p2`) and the
 * "A program can see:" card says it (`transparency.program.*`): a program sees you only after you write to
 * it, sign its rules, sign up or plan a visit, and before a visit only a first name and what you did
 * (D-541). `program-sees-before-a-visit.test.ts` holds the three together.
 */
export function WhatOthersCanSee() {
  return (
    <Body>
      <Lead>
        Pam shows you exactly who can see what about you. This page puts it in one table. Anything not on the
        list is not shared.
      </Lead>

      <Section title="The short version">
        <P>
          Your guide can see your plans, your progress and who you connect with. Your guide cannot read your
          messages to other people, or what you share with your buddies. Your guide sees a message only if you
          write to them, or if someone says it is not safe.
        </P>
        <P>
          A program sees you only after you write to them, sign their rules, sign up with them or plan a visit
          there, and only what they need to help you. Before a visit, they see your first name, what you write to
          them, the day you signed their rules and, if you signed up, how that is going and when you save a new
          place, but not which one.
        </P>
        <P>
          If you have written to a program, signed up with it or planned a visit there, it can book a visit for
          you. It shows in your Trips with the program’s name, and you can cancel it.
        </P>
      </Section>

      <Section title="Who can see what">
        <CompareTable
          label="What your guide, a program and other members can see"
          rowHeading="What"
          columns={['Your guide', 'A program', 'Other members']}
          rows={[
            { label: 'What you want to work on', cells: ['Yes', 'No', 'No'] },
            {
              label: 'The programs you joined, and your progress',
              cells: ['Yes', 'Yes, but only for their own program', 'No'],
            },
            {
              label: 'Your visits, and whether you went or missed one',
              cells: ['Yes', 'Yes, but only visits to their own program', 'No'],
            },
            {
              label: 'Which of your visits a program booked for you',
              cells: ['Yes', 'Yes, but only visits to their own program', 'No'],
            },
            { label: 'Your points, your level and your badges', cells: ['Yes', 'No', 'No'] },
            { label: 'The last day you used Pam', cells: ['Yes', 'No', 'No'] },
            {
              label: 'That you saved a new place (not which one)',
              cells: ['Yes', 'Yes, but only once you sign up with them', 'No'],
            },
            { label: 'Which place you saved', cells: ['No', 'No', 'No'] },
            { label: 'Who you connect with', cells: ['Yes', 'No', 'No'] },
            {
              label: 'Messages you write to them',
              cells: [
                'Yes, if you write to them',
                'Yes, if you write to them, even before you plan a visit',
                'Not applicable',
              ],
            },
            {
              label: 'The day you signed a program’s rules',
              cells: ['No', 'Yes, the day only. Never your signature', 'No'],
            },
            { label: 'Your messages with anyone else', cells: ['No', 'No', 'No'] },
            { label: 'What you share with your buddies', cells: ['No', 'No', 'No'] },
          ]}
        />
      </Section>

      <Section title="If someone reports a message">
        <P>
          If you say a message is not safe, Pam and your guide see the last message that person sent you, and its
          photo or document if it has one. Nothing else from the chat.
        </P>
      </Section>

      <Section title="If this ever changes">
        <P>If the list ever changes, Pam will tell you first.</P>
        <LegalLink kind="privacy" label="Read the full privacy policy" variant="read-more" />
      </Section>
    </Body>
  );
}
