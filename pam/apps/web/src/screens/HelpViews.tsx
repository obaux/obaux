'use client';

import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, FlagIcon, GlobeIcon, HelpIcon, PhoneIcon, ShieldIcon } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { MenuList } from '@pam/ui/MenuList';
import { useI18n } from '@/lib/i18n';
import { HELP_DESK_URL } from '@/lib/helpDesk';
import { HelpDeskRow, useHelpDeskItem } from '@/screens/HelpDeskRow';

/**
 * Get help, as a list of the kinds of help (D-213, from the reference Will
 * gave on 1 October: "there are different types of help").
 *
 * The help desk is first and is the row itself — a link to the support centre
 * on the website, one tap — because it is what most people who open this
 * screen came for (§0, §2.4). Pam has no phone line (A28, Will, 11 October
 * 2026): a person who is stuck is shown answers first, and the help desk's
 * "Still stuck?" is the way to an email to Pam after that. The other rows open
 * a page each, on the same template. Every one of them is a plain link and
 * static text, so the whole of Get help still works with no JavaScript, no
 * session and no database (the rule this screen has had since it was built).
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

export function HelpView({ backHref = '/', backLabel }: { readonly backHref?: string; readonly backLabel?: string }) {
  const { t } = useI18n();
  const helpDesk = useHelpDeskItem();
  return (
    <SubPage title={t('help.title')} backHref={backHref} backLabel={backLabel ?? t('nav.back.home')}>
      <Text type="supporting" xstyle={styles.intro}>
        {t('help.intro')}
      </Text>
      <MenuList
        label={t('help.menu.label')}
        items={[
          helpDesk,
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
      {/* Not everything is here: the help desk answers the rest, and its "Still stuck?" is the way to a person (A28). */}
      <VStack gap={2}>
        <Heading level={2} xstyle={styles.heading}>
          {t('help.stuck.heading')}
        </Heading>
        <Text xstyle={styles.body}>{t('help.stuck.body')}</Text>
      </VStack>
      {/* The same row as Get help and Your safety (Will, 2 October), not a big button. */}
      <HelpDeskRow label={t('help.menu.topics')} />
    </SubPage>
  );
}

/**
 * Your safety (D-223, Will, 2 October: "more space and hierarchy… less
 * reading"). One card first, for the one thing that cannot wait — in danger,
 * call 911, the page's only big button. Under it, the other ways as plain
 * rows, each a short line and one tap: call or text 988 (the dialler), a
 * message that feels unsafe (to Messages, where ⋯ › Report is), and someone to
 * talk to (the help desk). Then one quiet sentence on what reporting shares.
 * No row dials Pam: Pam has no phone line (A28).
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
            // Someone in crisis should not have to read a post to reach 988 (Mira, 11 October): one tap opens
            // the dialler. 988 is a national line, not Pam (A28 keeps it, as it keeps 911).
            {
              id: 'crisis',
              label: t('help.safety.crisis.heading'),
              description: t('help.safety.crisis.body'),
              href: 'tel:988',
              icon: <PhoneIcon {...ICON} />,
            },
            {
              id: 'message',
              label: t('help.safety.message.heading'),
              description: t('help.safety.message.body'),
              href: '/messages/',
              icon: <FlagIcon {...ICON} />,
            },
            {
              id: 'desk',
              label: t('help.safety.talk.heading'),
              description: t('help.safety.talk.body'),
              href: HELP_DESK_URL,
              isExternal: true,
              icon: <GlobeIcon {...ICON} />,
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
