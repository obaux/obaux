import { CompareTable } from '../components/CompareTable';
import { Body, Lead, P, Section } from '../components/Prose';
import { Screenshot } from '../components/Screenshot';
import { Steps } from '../components/Steps';

/**
 * Support post: Texts from Pam (everyone). Written against the LIVE `dispatch-sms`
 * (v15) and the live database on 10 October, not the repo's templates (the repo is
 * ahead of what is deployed): only three kinds of text are queued by anything live —
 * a saved place closing, and a staff request being approved or denied — and sign-in
 * codes come from the phone-sign-in provider. Visit reminders, message alerts,
 * "someone wants to connect" and the per-kind switches on the Text alerts screen
 * are not sent yet, so the post says so. The request-to-join texts are left out:
 * no screen creates a request any more (D-369). Re-check the live function before
 * changing this, and before any more kinds go live.
 */
export function TextsFromPam() {
  return (
    <Body>
      <Lead>
        Pam sends only a few kinds of texts today. This page lists them, so you know what to expect and what
        to do when one does not come.
      </Lead>

      <Section title="The texts Pam sends today">
        <CompareTable
          label="The texts Pam sends today"
          rowHeading="The text"
          columns={['When you get it', 'Who gets it']}
          rows={[
            {
              label: 'A sign-in code',
              cells: ['When you ask for one on the sign-in screen.', 'Anyone signing in.'],
            },
            {
              label: 'A place you saved has closed or moved',
              cells: ['When Pam finds out that a place you saved is closed, has moved or is listed wrong.', 'Members who said yes to texts.'],
            },
          ]}
        />
        <P>Every text starts with Pam’s name, so you know who it is from. Texts come in English or Spanish.</P>
      </Section>

      <Section title="Texts Pam does not send yet">
        <P>
          Pam does not send a reminder before a visit you planned. It does not text you when someone messages
          you, and it does not text you when someone wants to connect. The Text reminders and Text alerts screens
          list some of these as things Pam “would send”. Switching them on does not send anything yet.
        </P>
        <P>Messages and notes about new messages show up inside Pam, on the bell and on Home.</P>
      </Section>

      <Section title="The rules">
        <Steps
          items={[
            'Pam texts you reminders only if you said yes. You choose when you join (“Yes, text me reminders” or “Not now”), or later on the Text reminders screen (“Agree to receive texts” or “Not now”).',
            'No texts go out from 9 pm to 7 am, Philadelphia time. A text that is due in those hours waits until the morning.',
            'Reply STOP to any text and the texts stop. Nothing in the app can turn them back on. If you replied STOP by mistake, call Pam.',
            'A sign-in code is not a reminder. It comes when you ask for it.',
          ]}
        />
      </Section>

      <Section title="A text did not come">
        <Steps
          items={[
            'Think about which text it was. Pam does not send visit reminders or message alerts yet.',
            'Check that you said yes. Tap Profile, then Settings, then “Text reminders”. If you chose “Not now”, you can change it there.',
            'Check the time. Nothing is sent from 9 pm to 7 am, Philadelphia time.',
            'Check that the phone number on your account is the right one.',
            'For a sign-in code, wait for the “Send it again” timer to finish, then ask for a new code. Use the newest one.',
            'Still no text? Call Pam.',
          ]}
        />
        <Screenshot
          name="texts-from-pam/reminders.png"
          alt="The “Text reminders” screen in Pam, with a list headed “What we would send” and two buttons: “Agree to receive texts” and “Not now”."
          caption="The “Text reminders” screen."
        />
      </Section>
    </Body>
  );
}
