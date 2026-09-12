'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import {
  BigButton,
  HelpBar,
  Notice,
  PersonCard,
  PlaceCard,
  PointsBadge,
  StepHeader,
  VoiceInput,
} from '@pam/ui';
import { CATEGORY_LIST, NOTICES, TRANSPARENCY_SCREEN, distanceLabel } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';

/**
 * Phase 0 demo build.
 *
 * Each phase ends with a demo and an acceptance checklist (§13). This page is
 * Phase 0's: it renders every §2.4 component against the real Astryx theme with
 * real i18n strings, so "the foundation works" is something you can look at
 * rather than something the README claims.
 *
 * Phase 1 replaces this route with the real Home tab (§3.1).
 */

const styles = stylex.create({
  page: {
    maxWidth: '520px',
    marginInline: 'auto',
    paddingInline: '16px',
    paddingBlock: '24px',
  },
  section: {
    paddingBlock: '20px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'var(--astryx-color-border, rgba(0,0,0,0.12))',
  },
  sectionTitle: { fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.08em' },
  note: { fontSize: '15px', lineHeight: 1.5 },
  // §2.5 — every control clears the 48px floor, including this one.
  linkButton: { minHeight: '48px', fontSize: '17px' },
});

/**
 * Placeholder names, deliberately unmistakable for real listings. An earlier
 * version used plausible-sounding org names, and the first reviewer went looking
 * for them in Google Maps — reasonably, since the card offers a Google link.
 */
const SAMPLE_PLACE_NAMES = [
  'Example Learning Center',
  'Example Workforce Center',
  'Example Food Pantry',
];

export default function Page() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const [points, setPoints] = useState(250);

  /**
   * Distance is formatted in one place, from @pam/config, so the number and its
   * plural always agree and no raw float reaches a card.
   */
  const formatDistance = (miles: number): string | undefined => {
    const label = distanceLabel(miles, locale);
    return label ? t(label.key, label.vars) : undefined;
  };

  return (
    <main {...stylex.props(styles.page)}>
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={1}>{t('app.name')}</Heading>
          <Text type="supporting" xstyle={styles.note}>
            {t('app.tagline')}
          </Text>
          <Text type="supporting" xstyle={styles.note}>
            Phase 0 foundation check · locale: {locale}
          </Text>
        </VStack>

        <VStack gap={3} xstyle={styles.section}>
          <Text type="supporting" xstyle={styles.sectionTitle}>
            StepHeader
          </Text>
          <StepHeader
            current={2}
            total={4}
            title={t('onboarding.name.title')}
            progressLabel={t('step.progress', { current: 2, total: 4 })}
          />
        </VStack>

        <VStack gap={3} xstyle={styles.section}>
          <Text type="supporting" xstyle={styles.sectionTitle}>
            VoiceInput
          </Text>
          <VoiceInput
            label={t('onboarding.name.title')}
            value={name}
            onChange={setName}
            language={locale === 'es' ? 'es-US' : 'en-US'}
            micLabels={{ start: t('voice.start'), listening: t('voice.listening') }}
          />
        </VStack>

        <VStack gap={3} xstyle={styles.section}>
          <Text type="supporting" xstyle={styles.sectionTitle}>
            PlaceCard · the three fixed categories
          </Text>
          <Button
            label="See the real catalogue"
            variant="secondary"
            href="/places/"
            xstyle={styles.linkButton}
          />
          <Text type="supporting" xstyle={styles.note}>
            Sample data. These are placeholder names, not listings — nothing on this page reads
            from the database, so do not expect a match in Google. Real cards are built from the
            imported providers, which carry no hours yet, so no card claims to be open.
          </Text>
          {CATEGORY_LIST.map((category, index) => (
            <PlaceCard
              key={category.key}
              name={SAMPLE_PLACE_NAMES[index] ?? 'Example service'}
              category={category.key}
              categoryLabel={t(category.labelKey)}
              distanceLabel={formatDistance((index + 1) * 0.6)}
              phone={index === 2 ? undefined : '+15555550100'}
              address="123 Main St"
              isSaved={index === 0 ? saved : false}
              onSave={index === 0 ? () => setSaved((s) => !s) : undefined}
              labels={{
                call: t('action.call'),
                go: t('action.go'),
                save: t('action.save'),
                saved: t('places.saved'),
                hours: t('action.hours'),
              }}
            />
          ))}
        </VStack>

        <VStack gap={3} xstyle={styles.section}>
          <Text type="supporting" xstyle={styles.sectionTitle}>
            PersonCard
          </Text>
          <PersonCard
            firstName="Nia"
            roleLine="I can help you get your GED."
            sharedTags={[t('category.sub.ged_high_school'), t('category.sub.computer_skills')]}
            orgBadgeLabel="Example Learning Center"
            messageLabel={t('action.sendMessage')}
          />
        </VStack>

        <VStack gap={3} xstyle={styles.section}>
          <Text type="supporting" xstyle={styles.sectionTitle}>
            PointsBadge
          </Text>
          <HStack gap={3} align="center" wrap="wrap">
            <PointsBadge points={points} label={t('home.points')} />
            <Button
              label="+100"
              variant="secondary"
              clickAction={() => setPoints((p) => p + 100)}
            />
          </HStack>
        </VStack>

        <VStack gap={3} xstyle={styles.section}>
          <Text type="supporting" xstyle={styles.sectionTitle}>
            Notice · nothing here, and why
          </Text>
          {/*
            The case that prompted this: an admin opens a member who is in
            another region, every query returns null, and without a notice the
            screen is simply blank.
          */}
          <Notice
            notice="admin_out_of_region"
            title={t(NOTICES.admin_out_of_region.titleKey)}
            body={t(NOTICES.admin_out_of_region.bodyKey)}
            supportPhone={supportPhone}
            callLabel={t('help.callSupport')}
          />
        </VStack>

        <VStack gap={3} xstyle={styles.section}>
          <Text type="supporting" xstyle={styles.sectionTitle}>
            Notice · a problem to act on
          </Text>
          <Notice
            notice="account_limited"
            title={t(NOTICES.account_limited.titleKey)}
            body={t(NOTICES.account_limited.bodyKey)}
            supportPhone={supportPhone}
            callLabel={t('help.callSupport')}
          />
          <Notice
            notice="something_went_wrong"
            title={t(NOTICES.something_went_wrong.titleKey)}
            body={t(NOTICES.something_went_wrong.bodyKey)}
            supportPhone={supportPhone}
            callLabel={t('help.callSupport')}
            retry={{ label: t('action.next'), onPress: () => undefined }}
          />
        </VStack>

        <VStack gap={3} xstyle={styles.section}>
          <Text type="supporting" xstyle={styles.sectionTitle}>
            Transparency screen copy (§4.1)
          </Text>
          <Heading level={2}>{t(TRANSPARENCY_SCREEN.titleKey)}</Heading>
          <Text xstyle={styles.note}>{t(TRANSPARENCY_SCREEN.canSeeHeadingKey)}</Text>
          <VStack gap={1.5}>
            {TRANSPARENCY_SCREEN.canSee.map((line) => (
              <Text key={line.key} xstyle={styles.note}>
                • {t(line.key)}
              </Text>
            ))}
          </VStack>
          <Text xstyle={styles.note}>{t(TRANSPARENCY_SCREEN.cannotSeeHeadingKey)}</Text>
          <VStack gap={1.5}>
            {TRANSPARENCY_SCREEN.cannotSee.map((line) => (
              <Text key={line.key} xstyle={styles.note}>
                • {t(line.key)}
              </Text>
            ))}
          </VStack>
          <Text type="supporting" xstyle={styles.note}>
            {t(TRANSPARENCY_SCREEN.footerKey)}
          </Text>
          <BigButton label={t(TRANSPARENCY_SCREEN.confirmKey)} />
        </VStack>
      </VStack>

      <HelpBar label={t('nav.help')} />
    </main>
  );
}
