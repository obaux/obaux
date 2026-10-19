import { HowTo } from '../components/HowTo';
import { Body, Lead, P, Section } from '../components/Prose';

/**
 * Support post: When something doesn't go through (everyone). Words by Sage, signed under A29
 * (docs/help-drafts/something-didnt-go-through.md at 98875861; Mira 00:40, Will 00:13, D-618).
 * A draft until D-618 is live: the site shows only what the live app does. The section titles are the alert's own
 * titles (`notice.malfunction.<kind>.title` in en.json), so a person can match what they saw: keep them in step.
 * "Contact Pam" is never named (Will); the way to a person is the "Still stuck?" block on every post (A28).
 * "I'm here" has no number on purpose: the card and the database disagree about when it closes. Add one once
 * Piper makes them match.
 */
export function SomethingDidntGoThrough() {
  return (
    <Body>
      <Lead>When something doesn’t work, Pam shows a short message at the bottom of the screen. Find its title below.</Lead>

      <Section title="You’re offline">
        <P>Your phone has no internet right now.</P>
        <HowTo
          title="What to do"
          steps={[
            'Check that Wi-Fi or mobile data is on.',
            'If you’re on Wi-Fi, try turning it off to use mobile data, or the other way round.',
            'When you’re back online, tap “Try again”.',
          ]}
        />
      </Section>

      <Section title="That took too long">
        <P>Your phone is online, but the answer didn’t come back in time.</P>
        <HowTo
          title="What to do"
          steps={['Move to where the signal is stronger, or switch between Wi-Fi and mobile data.', 'Tap “Try again”.']}
        />
      </Section>

      <Section title="You’re signed out">
        <P>Pam signs you out after a while.</P>
        <HowTo title="What to do" steps={['Tap “Sign in”. Pam texts you a code.', 'Then do it again.']} />
      </Section>

      <Section title="This account can’t do that">
        <P>The account you’re using isn’t allowed to do this here.</P>
        <P>If you have more than one Pam account, check that you’re signed in to the right one.</P>
        <P>If you run a program and use Pam as a member too, check which side you’re on.</P>
      </Section>

      <Section title="This was already changed">
        <P>Someone changed it before you, or it’s already done.</P>
        <HowTo
          title="What to do"
          steps={['Tap “Show the latest”.', 'Look at what’s there now. You may not need to do anything.']}
        />
      </Section>

      <Section title="This isn’t here anymore">
        <P>It was removed, for example a visit that was cancelled.</P>
        <P>Go back to see what’s there now.</P>
      </Section>

      <Section title="Not at this time">
        <P>Some things can only be done near the time of a visit.</P>
        <P>A program lead can mark someone as there from 2 hours before their visit.</P>
        <P>“I’m here” works on the day of your visit, near its time.</P>
      </Section>

      <Section title="Pam couldn’t do that">
        <P>Pam couldn’t use what was sent. Trying the same thing again won’t help.</P>
        <P>Check what you typed or chose. A photo may be in a kind Pam can’t read: pick another one.</P>
        <P>If everything looks right, tap “Get help”.</P>
      </Section>

      <Section title="Something’s wrong on our side">
        <P>It’s not your fault.</P>
        <HowTo title="What to do" steps={['Wait a moment.', 'Tap “Try again”.']} />
      </Section>

      <Section title="Still not working">
        <P>This shows when the same thing doesn’t go through twice in a row, unless you’re offline.</P>
        <P>Try the steps above for the message you saw first.</P>
        <P>Tap “Get help” to find more help in Pam.</P>
      </Section>
    </Body>
  );
}
