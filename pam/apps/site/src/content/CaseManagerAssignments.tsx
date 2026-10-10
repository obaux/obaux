import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { TextLink } from '@pam/ui/TextLink';
import { AssignmentsTable } from '../components/AssignmentsTable';
import { PRIVACY_URL } from '../lib/links';

/** Support post: Case manager assignments. */
export function CaseManagerAssignments() {
  return (
    <>
      <VStack gap={3} maxWidth={720}>
        <Text type="large" as="p">
          A member has one case manager at a time: the person who invited them in, or a staff member
          responsible for guiding them. Some members don’t have one yet, for example because they
          joined without an invite from a case manager.
        </Text>
        <Text as="p">
          This page explains who can change that. In short: case managers look after their own
          members, and only a super admin, the person who runs Pam, can see who is unassigned and
          assign or unassign people. Limiting or pausing an account always needs a written reason,
          and every reason is kept.
        </Text>
      </VStack>

      <VStack gap={3}>
        <Heading level={2}>Who can do what</Heading>
        <AssignmentsTable />
      </VStack>

      <VStack gap={2} maxWidth={720}>
        <Heading level={2}>Good to know</Heading>
        <Text as="p">
          Limiting or pausing an account is never permanent. Whoever did it can use “Turn back on”
          from the same screen.
        </Text>
        <Text as="p">
          Every change needs a reason. It goes in the audit log, and it is the promise in our privacy
          policy: “They have to write down why.”
        </Text>
        <HStack>
          <TextLink label="Read the privacy policy" href={PRIVACY_URL} />
        </HStack>
      </VStack>
    </>
  );
}
