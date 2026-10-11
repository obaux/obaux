'use client';

import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, FlagIcon, HelpIcon, ShieldIcon } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { MenuList } from '@pam/ui/MenuList';
import { useI18n } from '@/lib/i18n';
import { SITE_URL } from '@/lib/project';

/**
 * Get help, as a list of the kinds of help (D-213, from the reference Will
 * gave on 1 October: "there are different types of help").
 *
 * Contact Pam stays first and is the row itself, one tap (§0, §2.4). Pam has no
 * phone line (A28): it opens the help desk on the website, where answers come
 * first and an email to Pam is offered only after them. The other rows open a
 * page each, on the same template. Every one of them is a plain link and static
 * text, so the whole of Get help still works with no JavaScript, no session and
 * no database (the rule this screen has had since it was built).
 */
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
  heading: { fontSize: '20px', lineHeight: 1.3 },
  body: { fontSize: '18px', lineHeight: 1.5 },
  danger: { fontSize: '24px', lineHeight: 1.25, fontWeight: 700 },
  section: { fontSize: '15px', fontWeight: 600, letterSpacing: '0.02em' },
  note: { fontSize: '15px', lineHeight: 1.5 },
});

/** The help desk on the website (A28): problem, then the help desk, then an email. */
const HELP_DESK = `${SITE_URL}/support/`;

/** Contact Pam as a row — one tap to the help desk. */
function ContactPamRow({ label }: { readonly label: string }) {
  const { t } = useI18n();
  return (
    <MenuList
      label={label}
      items={[{ id: 'contact', label: t('help.contact.action'), href: HELP_DESK, icon: <HelpIcon {...ICON} /> }]}
    />
  );
}

export function HelpView({ backHref = '/', backLabel }: { readonly backHref?: string; readonly backLabel?: string }) {
  const { t } = useI18n();
  return (
    <SubPage title={t('help.title')} backHref={backHref} backLabel={backLabel ?? t('nav.back.home')}>
      <Text type="supporting" xstyle={styles.intro}>
        {t('help.intro')}
      </Text>
      <MenuList
        label={t('help.menu.label')}
        items={[
          { id: 'contact', label: t('help.contact.action'), href: HELP_DESK, icon: <HelpIcon {...ICON} /> },
          { id: 'topics', label: t('help.menu.topics'), href: '/help/topics/', icon: <HelpIcon {...ICON} /> },
          { id: 'safety', label: t('help.menu.safety'), href: '/help/safety/', icon: <ShieldIcon {...ICON} /> },
          { id: 'place', label: t('help.menu.place'), href: '/help/report-place/', icon: <FlagIcon {...ICON} /> },
        ]}
      />
    </SubPage>
  );
}

/** What Pam support helps with, and what to do when it is closed. */
export function HelpTopicsView() {
  const { t } = useI18n();
  const topics = [
    'help.what.signIn',
    'help.what.findPlace',
    'help.what.appointment',
    'help.what.person',
    'help.what.anything',
  ];
  return (
    <SubPage title={t('help.menu.topics')} backHref="/help/" backLabel={t('nav.back.help')}>
      <VStack gap={2}>
        {topics.map((key) => (
          <Text key={key} xstyle={styles.body}>
            • {t(key)}
          </Text>
        ))}
      </VStack>
      <VStack gap={2}>
        <Heading level={2} xstyle={styles.heading}>
          {t('help.closed.heading')}
        </Heading>
        <Text xstyle={styles.body}>{t('help.closed.body')}</Text>
      </VStack>
      {/* The same row as Get help and Your safety (Will, 2 October), not a big button. */}
      <ContactPamRow label={t('help.menu.topics')} />
    </SubPage>
  );
}

/**
 * Your safety (D-223, Will, 2 October: "more space and hierarchy… less
 * reading"). One card first, for the one thing that cannot wait — in danger,
 * call 911, the page's only big button. Under it, the two other situations as
 * plain rows, each a short line and one tap: a message that feels unsafe
 * (to Messages, where ⋯ › Report is), and someone to talk to (the help desk). Then
 * one quiet sentence on what reporting shares.
 */
export function HelpSafetyView() {
  const { t } = useI18n();
  return (
    <SubPage title={t('help.safety.title')} backHref="/help/" backLabel={t('nav.back.help')}>
      <Card padding={6}>
        <VStack gap={3}>
          <VStack gap={1}>
            <Heading level={2} xstyle={styles.danger}>
              {t('help.safety.danger.heading')}
            </Heading>
            <Text type="supporting" xstyle={styles.body}>
              {t('help.safety.danger.body')}
            </Text>
          </VStack>
          <BigButton label={t('help.safety.danger.action')} href="tel:911" />
        </VStack>
      </Card>

      <VStack gap={1}>
        <Heading level={2} xstyle={styles.section}>
          {t('help.safety.more')}
        </Heading>
        <MenuList
          label={t('help.safety.more')}
          items={[
            {
              id: 'message',
              label: t('help.safety.message.heading'),
              description: t('help.safety.message.body'),
              href: '/messages/',
              icon: <FlagIcon {...ICON} />,
            },
            {
              id: 'talk',
              label: t('help.safety.call.heading'),
              description: t('help.safety.call.body'),
              href: HELP_DESK,
              icon: <HelpIcon {...ICON} />,
            },
          ]}
        />
      </VStack>

      <Text type="supporting" xstyle={styles.note}>
        {t('help.safety.message.note')}
      </Text>
    </SubPage>
  );
}

/**
 * How to tell Pam a listing is wrong — the report lives on the place itself
 * (D-185). "Find the place" opens Explore, where places are found now (D-216).
 */
export function HelpReportPlaceView() {
  const { t } = useI18n();
  return (
    <SubPage title={t('help.place.title')} backHref="/help/" backLabel={t('nav.back.help')}>
      <Text xstyle={styles.body}>{t('help.place.body')}</Text>
      <BigButton label={t('help.place.action')} href="/" />
    </SubPage>
  );
}
