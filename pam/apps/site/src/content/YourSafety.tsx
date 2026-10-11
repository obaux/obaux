import { Text } from '@astryxdesign/core/Text';
import { Link } from '@astryxdesign/core/Link';
import { tap } from '../lib/tap';
import { HowTo } from '../components/HowTo';
import { Body, P, ReadMore, Section } from '../components/Prose';
import { HelpAddress } from '../components/HelpAddress';

/**
 * Support post: Your safety (everyone). Words by Sage (docs/help-drafts/your-safety.md), signed by Will (a59). The
 * app's "Your safety > Talk to someone" opens this post. It starts with 911, says plainly that Pam is not an
 * emergency service, and puts the write-in at the TOP, not the end (so the post has `stillStuck: false` in
 * posts.ts and does not repeat it). The 911 and 988 links are the only `tel:` links on the site; a site test
 * fails on any other. Facts: `help.safety.*`, `terms.s.emergencies.*`. No reply time is promised.
 */
export function YourSafety() {
  return (
    <Body>
      <Section title="In danger right now?">
        <Text as="p" type="large">
          <Link href="tel:911" xstyle={tap.link}>Call 911.</Link>
        </Text>
        <P>Pam is not an emergency service. Nobody at Pam watches messages as they come in.</P>
      </Section>

      <Section title="In crisis?">
        <Text as="p" type="large">
          <Link href="tel:988" xstyle={tap.link}>Call or text 988.</Link> Someone answers, day and night.
        </Text>
      </Section>

      <Section title="Tell Pam what happened">
        <P>
          Write to us now at <HelpAddress />.
        </P>
        <P>Tell us what happened. You don’t have to explain everything. A person at Pam reads every message.</P>
      </Section>

      <Section title="A message feels unsafe">
        <HowTo
          steps={[
            'In the chat, tap ⋯ then “Report suspicious activity”.',
            'When you report, Pam sees only the last message they sent you.',
            'You can also block the person.',
          ]}
        />
        <ReadMore label="More: Messages in Pam" href="/support/messages-in-pam/" />
      </Section>
    </Body>
  );
}
