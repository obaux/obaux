'use client';

import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { BigButton } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';

/**
 * The help screen (§0, §2.4).
 *
 * The Help control in the bottom bar used to dial straight out. It now lands
 * here, which buys room for the five member tabs and lets the screen answer the
 * question a raw dial cannot: what PAM support actually does, when somebody
 * answers, and what to do if nobody does.
 *
 * Everything on it is a real anchor. The phone number is rendered into the
 * static HTML from the env value, so this page works with no JavaScript, no
 * session and no database — the state a member is most likely to be in when
 * they come looking for it.
 */

const styles = stylex.create({
  page: {
    maxWidth: '520px',
    marginInline: 'auto',
    paddingInline: '16px',
    paddingBlock: '24px',
  },
  title: { fontSize: '28px', lineHeight: 1.2 },
  intro: { fontSize: '18px', lineHeight: 1.5 },
  sectionTitle: { fontSize: '20px' },
  body: { fontSize: '17px', lineHeight: 1.5 },
  // §2.5 — a list a member reads when they are already stuck stays large.
  item: { fontSize: '17px', lineHeight: 1.5 },
  card: { width: '100%' },
  back: { minHeight: '48px', fontSize: '17px' },
});

export default function HelpPage() {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();

  const whatWeHelpWith = [
    'help.what.signIn',
    'help.what.findPlace',
    'help.what.appointment',
    'help.what.person',
    'help.what.anything',
  ];

  return (
    <main {...stylex.props(styles.page)}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Heading level={1} xstyle={styles.title}>
            {t('help.title')}
          </Heading>
          <Text xstyle={styles.intro}>{t('help.intro')}</Text>
        </VStack>

        {/*
          The call is the first thing on the page and a real tel: anchor, so it
          is reachable before anything has hydrated.
        */}
        <Card padding={4} xstyle={styles.card}>
          <VStack gap={3}>
            <Heading level={2} xstyle={styles.sectionTitle}>
              {t('help.call.heading')}
            </Heading>
            <Text xstyle={styles.body}>{t('help.call.body')}</Text>
            <BigButton label={t('help.call.action')} href={`tel:${supportPhone}`} />
          </VStack>
        </Card>

        <VStack gap={3}>
          <Heading level={2} xstyle={styles.sectionTitle}>
            {t('help.what.heading')}
          </Heading>
          <VStack gap={2}>
            {whatWeHelpWith.map((key) => (
              <Text key={key} xstyle={styles.item}>
                • {t(key)}
              </Text>
            ))}
          </VStack>
        </VStack>

        <VStack gap={2}>
          <Heading level={2} xstyle={styles.sectionTitle}>
            {t('help.closed.heading')}
          </Heading>
          <Text xstyle={styles.body}>{t('help.closed.body')}</Text>
        </VStack>

        {/* §0: every screen has a visible way back. */}
        <HStack>
          <Button label={t('help.back')} variant="secondary" href="/" xstyle={styles.back} />
        </HStack>
      </VStack>
    </main>
  );
}
