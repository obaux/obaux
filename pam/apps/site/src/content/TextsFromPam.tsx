import { CompareTable } from '../components/CompareTable';
import { Body, Lead, P, Section } from '../components/Prose';
import { HowTo } from '../components/HowTo';
import { VISIT_REMINDERS_LIVE } from './flags';

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
// The switch is `VISIT_REMINDERS_LIVE` in `./flags.ts`; the home page's "Keep going" card reads it too.

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
            ...(VISIT_REMINDERS_LIVE
              ? [
                  {
                    label: 'A reminder before a visit you planned',
                    cells: ['The day before, with the address.', 'Members who said yes to texts.'],
                  },
                ]
              : []),
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
          {VISIT_REMINDERS_LIVE
            ? 'Pam does not text you when someone messages you, and it does not text you when someone wants to connect.'
            : 'Pam does not send a reminder before a visit you planned. It does not text you when someone messages you, and it does not text you when someone wants to connect.'}{' '}
          The Text reminders screen lists what Pam would send, and says which of those it sends today. The Text
          alerts screen says “Coming soon” beside the ones it does not send yet.
        </P>
        <P>Messages and notes about new messages show up inside Pam, on the bell and on the Messages tab. A case manager or program lead also sees the number on Home.</P>
      </Section>

      <Section title="The rules">
        <HowTo
          steps={[
            'Pam texts you reminders only if you said yes. You choose when you join (“Yes, text me reminders” or “Not now”), or later, from the “Get text reminders” card on Profile (“Agree to receive texts” or “Not now”).',
            'No texts go out from 9 pm to 7 am, Philadelphia time. A text that is due in those hours waits until the morning. If a sign-in code is more than 12 hours late, Pam cancels it instead of sending it. Ask for a new one.',
            'Reply STOP to any text and the texts stop. Nothing in the app can turn them back on. If you replied STOP by mistake, call Pam.',
            'A sign-in code is not a reminder. It comes when you ask for it.',
          ]}
        />
      </Section>

      <Section title="A text did not come">
        <HowTo
          steps={[
            VISIT_REMINDERS_LIVE
              ? 'Think about which text it was. Pam does not text you about new messages or when someone wants to connect.'
              : 'Think about which text it was. Pam does not send visit reminders or message alerts yet.',
            'Check that you said yes. Tap Profile. If you said yes, the list has a “Text reminders” row. If you chose “Not now”, you will see a “Get text reminders” card at the top instead: tap it to change your answer. If you replied STOP, that card opens a screen that says “Texts are off”, and you need to call Pam. (A case manager or program lead sees “Get text alerts” on that card.)',
            'Check the time. Nothing is sent from 9 pm to 7 am, Philadelphia time.',
            'Check that the phone number on your account is the right one.',
            'For a sign-in code, wait for the “Send it again” timer to finish, then ask for a new code. Use the newest one.',
            'Still no text? Call Pam.',
          ]}
          shots={[{ name: 'texts-from-pam/reminders.png', alt: "The “Text reminders” screen in Pam. A list headed “What we would send”, then a line that says today Pam sends only a note when a place you saved closes or moves, then two buttons: “Agree to receive texts” and “Not now”.", caption: "The “Text reminders” screen." }, { name: 'texts-from-pam/texts-off.png', alt: "The “Text reminders” screen after someone replied STOP. It says “Texts are off” and that Pam does not text you, and that nothing in the app can turn texts back on.", caption: "After you reply STOP, the screen says “Texts are off”." }]}
        />
      </Section>
    </Body>
  );
}
