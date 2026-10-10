import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

/**
 * Support post (draft): Keeping your program's listing up to date.
 *
 * The rule is D-447 (pam/docs/decisions/, branch claude/places-programs-load-own-program):
 * name, address and category go back to review; description, phone and website
 * apply at once. The draft as sent had one more sentence — "we'll let you know
 * when they're live" — which depends on a text-alert job that is not scheduled.
 * It is left out; restore it only if that job is live when this is published.
 */
export function KeepingYourListing() {
  return (
    <VStack gap={6} maxWidth={720}>
      <Text type="large" as="p">
        Your program’s listing is how people find you and how they get to your door. So we made two kinds
        of edits.
      </Text>

      <VStack gap={2}>
        <Heading level={2}>Small edits go live straight away</Heading>
        <Text as="p">
          Change your description, your phone number or your website and members see it right then. A wrong
          number shouldn’t wait days for a fix.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Big edits get a quick check first</Heading>
        <Text as="p">
          Changing your program’s name, address or category sends the change to the Pam team. Until they
          approve it, members keep seeing your listing as it was, so nobody is sent to the wrong place by a
          typo. You’ll see that your changes are being checked.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Why the difference?</Heading>
        <Text as="p">
          A phone number is easy to correct. An address is where someone travels to. We’d rather check that
          one extra time.
        </Text>
      </VStack>
    </VStack>
  );
}
