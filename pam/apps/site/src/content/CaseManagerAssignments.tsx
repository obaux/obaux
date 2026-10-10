import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { TextLink } from '@pam/ui/TextLink';
import { PRIVACY_URL } from '../lib/links';

/**
 * Support post: Case manager assignments.
 *
 * Says only what Pam does today (10 October, Will via Mira: nothing promised that
 * members or staff cannot do yet). The full "who can do what" table is in
 * `assignments.ts`, every row held with `live: false`, and `AssignmentsTable`
 * renders the rows that are live: when taking on, handing over, unassigning and
 * limiting have screens, flip their flags and add the table back here under
 * "Who can do what". The words below are the app's own: the privacy policy
 * (`privacy.s.limits.*`) and what `admin_covers` and `admin_set_access_status`
 * enforce in the database.
 */
export function CaseManagerAssignments() {
  return (
    <VStack gap={6} maxWidth={720}>
      <Text type="large" as="p">
        Your case manager is the person who invited you to Pam, or a staff member responsible for guiding
        you. If you joined another way, you may not have one yet.
      </Text>

      <VStack gap={2}>
        <Heading level={2}>A case manager looks after their own members</Heading>
        <Text as="p">
          Each member has one case manager at a time. A case manager looks after the members assigned to
          them, and only those members. They can’t see or change anyone else’s account.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Every change to your account has a reason</Heading>
        <Text as="p">
          If an account is hurting other people, we can turn off parts of Pam for it. Whoever does it has to
          write down why, and the reason is kept in a log.
        </Text>
        <Text as="p">
          A limited account can read messages but can’t send them. A paused account can’t sign in. Pam
          always tells you when something is turned off and who to call, and you can always call Pam for
          help.
        </Text>
        <HStack>
          <TextLink label="Read the privacy policy" href={PRIVACY_URL} />
        </HStack>
      </VStack>
    </VStack>
  );
}
