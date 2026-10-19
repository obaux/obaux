'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import * as stylex from '@stylexjs/stylex';
import { CheckboxList, CheckboxListItem } from '@astryxdesign/core/CheckboxList';
import { Text } from '@astryxdesign/core/Text';
import { TimeInput } from '@astryxdesign/core/TimeInput';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BigButton, Loading, Notice, Page } from '@pam/ui';
import { SubPageHeader } from '@pam/ui/SubPage';
import { DEFAULT_PAM_HOURS, intlLocale, type PamHours } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { setPamHours, usePamStatus } from '@/lib/pam';
import { pamSystemText } from '@/lib/pamMessages';
import { NotIn } from '../app/NotIn';

/**
 * When Pam is here (card a100, D-605): the days and the opening and closing times, which drive the out-of-hours reply.
 * Monday to Friday, 9:00 to 17:00 Eastern until Will changes it. The zone stays Eastern for now. Under the fields, the reply
 * itself, as someone writing outside these hours will get it, drawn by the same function the conversation uses
 * (`pamSystemText`), so the two cannot differ.
 */
const styles = stylex.create({
  label: { fontSize: '15px', fontWeight: 700, color: colorVars['--color-text-secondary'] },
  // A row's words at a row's size (17–18px); the list's own are smaller.
  day: { fontSize: '17px', lineHeight: 1.35 },
  time: { width: '100%' },
  preview: { fontSize: '17px', lineHeight: 1.45, whiteSpace: 'pre-line' },
  status: { fontSize: '17px', lineHeight: 1.4 },
});

type Time = NonNullable<ComponentProps<typeof TimeInput>['value']>;
/** ISO weekdays, Monday first, as people say a week. */
const WEEK = [1, 2, 3, 4, 5, 6, 7] as const;
const hhmm = (value: string) => value.slice(0, 5);

export function PamHoursScreen() {
  const { t, tPlain, locale } = useI18n();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const isTeam = viewedRole === 'super_admin' && trueRole === 'super_admin';
  const pam = usePamStatus(isTeam);
  const [draft, setDraft] = useState<PamHours | null>(null);
  const [saving, setSaving] = useState(false);
  const [said, setSaid] = useState<'saved' | 'failed' | 'noDays' | 'order' | null>(null);

  useEffect(() => {
    if (pam.status === 'ready' && draft === null) {
      setDraft({ tz: pam.pam.hoursTz, days: pam.pam.hoursDays, open: hhmm(pam.pam.hoursOpen), close: hhmm(pam.pam.hoursClose) });
    }
  }, [pam, draft]);

  const header = <SubPageHeader title={t('pam.hours.title')} backHref="/pam/messages/" backLabel={t('pam.inbox.title')} />;

  if (session.status === 'loading' || (isTeam && pam.status === 'loading')) {
    return (
      <Page gap={3}>
        {header}
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }
  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        {header}
        <NotIn status={session.status} title={t('directory.signedOut.title')} body={t('directory.signedOut.body')} />
      </Page>
    );
  }
  if (!isTeam || pam.status !== 'ready') {
    return (
      <Page gap={4}>
        {header}
        <Notice
          notice="service_not_available"
          title={t('directory.notSuper.title')}
          body={t('directory.notSuper.body')}
          contactLabel={t('help.contact.action')}
        />
      </Page>
    );
  }

  const hours = draft ?? DEFAULT_PAM_HOURS;
  const dayName = (day: number) =>
    new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, day)));
  const change = (patch: Partial<PamHours>) => {
    setDraft({ ...hours, ...patch });
    setSaid(null);
  };
  // Hours that cannot be (no day, or closing before opening) have no reply to show: Save says what to fix (Iris T4).
  const valid = hours.days.length > 0 && hhmm(hours.close) > hhmm(hours.open);
  const preview = valid ? pamSystemText('pam.away', { t, tPlain, locale, firstName: null, hours }) : null;

  const save = async () => {
    if (hours.days.length === 0) return setSaid('noDays');
    if (hours.close <= hours.open) return setSaid('order');
    setSaving(true);
    const result = await setPamHours(hours.tz, hours.days, hours.open, hours.close);
    setSaving(false);
    setSaid(result.ok ? 'saved' : 'failed');
  };

  return (
    <Page gap={4}>
      {header}

      {/* Each day a full-width row, the whole row its target (Iris C1): single boxes 32px apart overlapped their 48px targets. */}
      <CheckboxList
        label={t('pam.hours.days')}
        value={hours.days.map(String)}
        onChange={(values) => change({ days: values.map(Number).sort((a, b) => a - b) })}
        density="spacious"
        hasDividers
        width="100%"
      >
        {WEEK.map((day) => (
          <CheckboxListItem key={day} value={String(day)} label={<Text xstyle={styles.day}>{dayName(day)}</Text>} />
        ))}
      </CheckboxList>

      <VStack gap={2}>
        <Text xstyle={styles.label}>{t('pam.hours.times', { zone: t('pam.hours.zone.eastern') })}</Text>
        {/* One above the other: side by side, two time fields push the page wider than a phone. The typed field on every
            phone (Iris T5): the touch picker's own open button is a 16px target, so here the clock is only a picture. */}
        <VStack gap={2}>
          <TimeInput
            label={t('pam.hours.open')}
            value={hours.open as Time}
            onChange={(v) => change({ open: v ?? hours.open })}
            width="100%"
            size="lg"
            nativePicker="never"
            xstyle={styles.time}
          />
          <TimeInput
            label={t('pam.hours.close')}
            value={hours.close as Time}
            onChange={(v) => change({ close: v ?? hours.close })}
            width="100%"
            size="lg"
            nativePicker="never"
            xstyle={styles.time}
          />
        </VStack>
      </VStack>

      {preview ? (
        <VStack gap={2}>
          <Text xstyle={styles.label}>{t('pam.hours.preview')}</Text>
          <Text dir="auto" xstyle={styles.preview}>
            {preview}
          </Text>
        </VStack>
      ) : null}

      {said ? (
        <Text role={said === 'saved' ? 'status' : 'alert'} xstyle={styles.status}>
          {t(`pam.hours.said.${said}`)}
        </Text>
      ) : null}
      <BigButton label={t('pam.hours.save')} variant="primary" onPress={() => void save()} isDisabled={saving} />
    </Page>
  );
}
