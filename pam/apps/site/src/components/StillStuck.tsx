import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Button } from '@pam/ui/Button';
import { APP_URL } from '../lib/links';

/**
 * The end of every post: the way to a person. These are the words Pam's own Help
 * screen shows (`help.call.*`, `help.closed.*`, `help.needHelp` in the app's
 * en.json), so the site and the app say the same thing. No phone number is written
 * here: the app shows it, and the number can change in one place.
 */
export function StillStuck() {
  return (
    <Card padding={6} variant="muted">
      <VStack gap={3} maxWidth={720}>
        <Heading level={2}>Still stuck?</Heading>
        <Text as="p">
          Someone at Pam can help you. You do not need to know what to ask for. Open Pam and tap “Need help?
          Call Pam”. The call is free, and we answer Monday to Friday, 9am to 5pm.
        </Text>
        <Text as="p">
          If we are closed, leave a message and we will call you back the next day we are open.
        </Text>
        <HStack>
          <Button label="Open Pam" variant="secondary" href={APP_URL} />
        </HStack>
      </VStack>
    </Card>
  );
}
