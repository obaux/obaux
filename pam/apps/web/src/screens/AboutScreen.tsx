'use client';

import { useMemo, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { MeIcon, Page, PeopleIcon, PlacesIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { OnboardingSlides } from '@pam/ui/OnboardingSlides';
import { SubPageHeader } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { goBack } from '@/lib/navigate';

/**
 * About PAM (Will, 4 October, D-259), from the foot of Sign in: what PAM is,
 * and how it helps each kind of person — a member, a case manager, a
 * program; not the super admin, who runs it rather than uses it.
 *
 * - The nested template: back (to where it was opened) and PAM's wordmark
 *   where the round buttons usually sit.
 * - One sentence for what PAM is; then a pill switch for who is reading, a
 *   line for how it helps them, and their three-slide story — the Sign in
 *   carousel, but in line with the page, rounded, the words in the middle.
 *   The slides are the same lines Sign in shows each of them (D-254).
 * - The way on: "Sign in as …", one row each, opening Sign in with that
 *   person's slides.
 */
type Who = 'member' | 'admin' | 'provider';
const WHO: readonly Who[] = ['member', 'admin', 'provider'];
const AS: Record<Who, string> = { member: 'member', admin: 'case-manager', provider: 'program' };
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const styles = stylex.create({
  logo: { height: '32px', width: 'auto', display: 'block' },
  intro: { fontSize: '19px', lineHeight: 1.5 },
  pills: { borderRadius: '999px', alignSelf: 'flex-start' },
  how: { fontSize: '18px', lineHeight: 1.5 },
  section: { fontSize: '20px', lineHeight: 1.3 },
});

export function AboutScreen() {
  const { t } = useI18n();
  const [who, setWho] = useState<Who>('member');
  const lines = who === 'member' ? 'onboarding.' : `onboarding.${who}.`;
  const slides = useMemo(
    () => [
      { id: `${who}-1`, image: '/onboarding/hero-city.webp', text: t(`${lines}1`) },
      { id: `${who}-2`, image: '/onboarding/hero-phone.webp', text: t(`${lines}2`) },
      { id: `${who}-3`, image: '/onboarding/hero-sneakers.webp', text: t(`${lines}3`) },
    ],
    [t, who, lines],
  );

  return (
    <Page gap={4}>
      <SubPageHeader
        title={t('about.title')}
        backHref="/signin/"
        backLabel={t('nav.back.signInScreen')}
        onBack={() => goBack('/signin/')}
        actions={<img src="/pam-wordmark-light.svg" alt={t('about.logo')} {...stylex.props(styles.logo)} />}
      />
      <Text xstyle={styles.intro}>{t('about.intro')}</Text>

      <SegmentedControl
        label={t('about.tabs')}
        value={who}
        onChange={(next) => setWho(next as Who)}
        size="md"
        xstyle={styles.pills}
      >
        {WHO.map((w) => (
          <SegmentedControlItem key={w} value={w} label={t(`about.tab.${w}`)} />
        ))}
      </SegmentedControl>

      <VStack gap={3}>
        <Text xstyle={styles.how}>{t(`about.how.${who}`)}</Text>
        {/* Keyed by who, so switching starts their story at its first slide. */}
        <OnboardingSlides key={who} slides={slides} label={t(`about.tab.${who}`)} variant="inline" />
      </VStack>

      <VStack gap={2}>
        <Heading level={2} xstyle={styles.section}>
          {t('about.signin.title')}
        </Heading>
        <MenuList
          label={t('about.signin.title')}
          items={WHO.map((w) => ({
            id: w,
            label: t(`about.signin.${w}`),
            href: `/signin/?as=${AS[w]}`,
            icon: w === 'member' ? <MeIcon {...ICON} /> : w === 'admin' ? <PeopleIcon {...ICON} /> : <PlacesIcon {...ICON} />,
          }))}
        />
      </VStack>
    </Page>
  );
}
