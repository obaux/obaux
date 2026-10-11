import * as stylex from '@stylexjs/stylex';
import { Divider } from '@astryxdesign/core/Divider';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/Stack';
import { TextLink } from '@pam/ui/TextLink';
import { Frame } from './Frame';
import { LegalLink } from './LegalLink';

const styles = stylex.create({
  foot: { marginBlockStart: '64px', paddingBlockEnd: '40px' },
  links: { flexWrap: 'wrap' },
});

export function SiteFooter() {
  return (
    <VStack gap={4} xstyle={styles.foot} as="footer">
      <Divider />
      <Frame gap={2}>
        <HStack gap={4} xstyle={styles.links}>
          <TextLink label="Support" href="/support/" size="quiet" />
          <LegalLink kind="privacy" label="Privacy" />
          <LegalLink kind="terms" label="Terms" />
        </HStack>
        <Text type="supporting">
          Pam connects people to people at services and facilities.
        </Text>
      </Frame>
    </VStack>
  );
}
