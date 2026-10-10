import { CompareTable } from '../components/CompareTable';
import { Body, Lead, P, ReadMore, Section } from '../components/Prose';
import { Screenshot } from '../components/Screenshot';
import { Steps } from '../components/Steps';

/**
 * Support post: Joining Pam (members). Three ways in — a link, a code, on your own —
 * and what is the same for all of them. Facts from the join and sign-in screens and
 * D-373 / D-369 (see the session log). Left out on purpose: the "email me a new link"
 * on the expired-link page (the email is queued but nothing sends it yet), and the
 * "text me when Pam opens in my city" box (no text for it is live).
 */
export function JoiningPam() {
  return (
    <Body>
      <Lead>
        You join Pam with your phone number. There are three ways in: with a link from the person who invited
        you, with a code, or on your own.
      </Lead>

      <Section title="Which way is mine?">
        <CompareTable
          label="The three ways to join Pam"
          rowHeading="How you join"
          columns={['What you do', 'Do you need a code?']}
          rows={[
            {
              label: 'With a link',
              cells: ['Open the link on your phone.', 'No. The link has it inside.'],
            },
            {
              label: 'With a code',
              cells: ['Type the code when Pam asks for it.', 'Yes.'],
            },
            {
              label: 'On your own',
              cells: ['Open Pam and sign in.', 'No. Leave the code box empty.'],
            },
          ]}
        />
      </Section>

      <Section title="Step 1: sign in with your phone">
        <Steps
          items={[
            'Type your phone number and tap “Send me a code”.',
            'Pam texts you a code. The screen says it works for 10 minutes.',
            'Type the code and tap “Sign in”.',
          ]}
        />
        <Screenshot
          name="joining-pam/sign-in.png"
          alt="Pam’s sign-in screen with a box for your phone number and a button that says “Send me a code”."
          caption="The sign-in screen."
        />
        <P>
          If the code does not work, ask for a new one. Wait for the “Send it again” timer to finish. If no text
          comes, read about texts below, or call Pam.
        </P>
        <ReadMore label="Texts from Pam: which ones, and why one didn’t come" href="/support/texts-from-pam/" />
      </Section>

      <Section title="Step 2: tell Pam about you">
        <Steps
          items={[
            'Type your first name and your last name.',
            'Choose the city you live in. Pam is only in some cities for now.',
            'Choose your language.',
            'If somebody gave you a code, type it. If not, leave the box empty.',
            'Tap Next.',
            'Read “What others can see”, then tap “I understand”.',
            'Choose “Yes, text me reminders” or “Not now”.',
            'Tap Start. You are in.',
          ]}
        />
        <P>
          If you joined with a link, you will see a green line at the top that says “You were invited as: Member”.
          You will not be asked for a code. The link already has it.
        </P>
        <Screenshot
          name="joining-pam/about-you.png"
          alt="The “About you” screen. A green line at the top says “You were invited as: Member”. Below it are boxes for first name, last name and city, a choice of language, and a Next button."
          caption="“About you”, for someone who joined with a link."
        />
      </Section>

      <Section title="About links">
        <P>
          A link works once, for one person, and only on the phone number it was made for. It lasts 30 days.
        </P>
        <P>
          If you use a different phone number, you will see “That code is for a different phone”. Use the number
          the link was sent to. Or ask the person who invited you to send you a new link.
        </P>
      </Section>
    </Body>
  );
}
