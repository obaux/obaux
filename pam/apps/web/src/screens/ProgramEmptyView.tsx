'use client';

import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, Page, PlaceDetail } from '@pam/ui';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { SetupArt } from '@pam/ui/SetupArt';
import { useI18n } from '@/lib/i18n';

/**
 * The Program tab before a lead has a program (D-352) — **a mockup for
 * review** (Will, 7 October: "let me see this faded preview before you
 * build"). Not wired: `ProgramScreen` still draws the example program, and
 * this shows only in Storybook until Will says yes.
 *
 * One card saying what goes here, with the one button that adds it; under
 * it, the page members will see, faded and fading out — the shape of what
 * they are about to make, in words that say what goes where. The preview
 * is a picture: hidden from screen readers and not tappable (`inert`).
 */
const styles = stylex.create({
  callout: { width: '100%' },
  art: { borderRadius: '24px', overflow: 'hidden', alignSelf: 'center' },
  title: { fontSize: '22px', lineHeight: 1.3, fontWeight: 700, textAlign: 'center' },
  body: { fontSize: '17px', lineHeight: 1.5, textAlign: 'center' },
  preview: {
    width: '100%',
    opacity: 0.45,
    pointerEvents: 'none',
    userSelect: 'none',
    maskImage: 'linear-gradient(to bottom, black 30%, transparent 95%)',
    filter: 'saturate(0.4)',
  },
});

export function ProgramEmptyView() {
  const { t } = useI18n();
  return (
    <Page gap={4}>
      <LargeTitleHeader title={t('program.empty.heading')} />
      <Card padding={6} xstyle={styles.callout}>
        <VStack gap={3} align="center">
          <VStack xstyle={styles.art}>
            <SetupArt kind="program" size={96} />
          </VStack>
          <Heading level={2} xstyle={styles.title}>
            {t('program.empty.title')}
          </Heading>
          <Text type="supporting" xstyle={styles.body}>
            {t('program.empty.body')}
          </Text>
          <BigButton label={t('home.setup.program.title')} href="/programs/new/?from=home" />
        </VStack>
      </Card>
      <VStack aria-hidden inert xstyle={styles.preview}>
        <PlaceDetail
          name={t('program.empty.preview.name')}
          category="education"
          categoryLabel={t('program.empty.preview.kind')}
          description={t('program.empty.preview.about')}
          address={t('program.empty.preview.address')}
          phone={null}
          website={null}
          labels={{
            directions: t('place.directions'),
            call: t('place.call'),
            website: t('place.website'),
            hours: t('place.hours'),
            hoursOnGoogle: t('place.hoursOnGoogle'),
            about: t('place.about'),
            address: t('place.address'),
            save: t('place.save'),
            saved: t('places.saved'),
            share: t('place.share'),
            flag: t('place.flag'),
          }}
        />
      </VStack>
    </Page>
  );
}
