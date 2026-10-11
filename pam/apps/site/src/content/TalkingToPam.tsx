import { Body, Lead, P, ReadMore, Section } from '../components/Prose';
import { HowTo } from '../components/HowTo';

/**
 * Support post: Talking to someone at Pam (everyone). Words by Sage, signed by Will (card a51, 11 October 2026).
 * Every line is on the app's Help screen: `help.intro`, `help.needHelp`, `help.call.body`, `help.closed.body`,
 * `help.what.*`, `help.safety.danger.body`, `help.safety.message.body` and `.note`. No phone number is written
 * here: the app shows it in one place, and it can change there.
 */
export function TalkingToPam() {
  return (
    <Body>
      <Lead>Someone at Pam can help you. You do not need to know what to ask for.</Lead>

      <Section title="Call us">
        <HowTo
          title="How to call"
          steps={[
            'Open Pam and tap “Need help? Call Pam”.',
            'We answer Monday to Friday, 9am to 5pm. The call is free.',
          ]}
        />
      </Section>

      <Section title="If we are closed">
        <P>Leave a message and we will call you back the next day we are open.</P>
      </Section>

      <Section title="What we can help with">
        <P>Getting into the app.</P>
        <P>Finding a place that can help.</P>
        <P>Changing or missing a visit.</P>
        <P>Reaching your guide.</P>
        <P>Anything else. If we cannot help, we will find someone who can.</P>
      </Section>

      <Section title="In danger right now?">
        <P>Call 911 first. You don’t need to call Pam.</P>
      </Section>

      <Section title="A message feels unsafe">
        <HowTo
          steps={[
            'In the chat, tap ⋯ then “Report suspicious activity”.',
            'When you report, Pam sees only the last message they sent you.',
          ]}
        />
        <ReadMore label="More: Messages in Pam" href="/support/messages-in-pam/" />
      </Section>
    </Body>
  );
}
