'use client';

import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { intlLocale } from '@pam/config';
import { BigButton, CheckIcon, CrossIcon, Notice, RefreshIcon, TripsIcon } from '@pam/ui';
import { Button } from '@pam/ui/Button';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { appleUrl, feedUrl, isAppleDevice, useCalendarLink, type CalendarKind } from '@/lib/useCalendarLink';
import { ConfirmDialog } from './ConfirmDialog';
import { HelpButton } from './HelpButton';

/**
 * Calendar (D-538, D-604, a98 plan C): a secret address that puts a member's Pam visits in the calendar app they already use, each visit with
 * its place's name and address (there is no longer a question about that). Nothing linked: "Which calendar do you use?". Linked: which calendar
 * and since when, the link's buttons always there (Pam works the address out again for the member who is looking), and Manage: get a new link,
 * or disconnect, each asking first. The privacy line is said once, at the foot. Pam keeps only which calendar the member said they use and the
 * day, never that a calendar asked for the feed: the screen says "Linked", never "connected".
 */
const styles = stylex.create({
  body: { fontSize: '17px', lineHeight: 1.5 },
  small: { fontSize: '15px', lineHeight: 1.5 },
  heading: { fontSize: '20px', lineHeight: 1.3, fontWeight: 700 },
  tick: { width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0 },
  name: { fontSize: '20px', lineHeight: 1.3, fontWeight: 700 },
});

/** Google Calendar's page for adding a calendar by its address: it works on the web, not in the phone app. */
const GOOGLE_ADD_BY_URL = 'https://calendar.google.com/calendar/r/settings/addbyurl';
const KINDS: readonly CalendarKind[] = ['apple', 'google', 'outlook', 'other'];

export function CalendarLinkView() {
  const { t, tPlain, locale } = useI18n();
  const { state: session } = useSession();
  const signedIn = session.status === 'signed-in';
  const { state, busy, make, turnOff } = useCalendarLink(signedIn);
  const [asking, setAsking] = useState<'new' | 'off' | null>(null);
  const [copied, setCopied] = useState(false);
  // Apple Calendar's button only where a webcal:// address opens something. Read after the page is up (the
  // first paint is the server's); until then, and when the device cannot be told, it is shown.
  const [apple, setApple] = useState(true);
  useEffect(() => setApple(isAppleDevice(navigator.userAgent, navigator.platform)), []);

  const linked = state.status === 'on' ? state : null;
  const token = linked?.token ?? null;
  const calendar = linked?.calendar ?? null;
  const calendarName = (kind: CalendarKind) => t(`calendar.kind.${kind}`);
  const since = linked?.linkedOn
    ? new Intl.DateTimeFormat(intlLocale(locale), { month: 'long', day: 'numeric' }).format(new Date(`${linked.linkedOn}T12:00:00`))
    : null;
  const copy = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(feedUrl(token));
      setCopied(true);
    } catch {
      // The address is not on screen; where the phone will not copy, the buttons above open it in the calendar app.
    }
  };

  /** "Which calendar do you use?": picking one makes the link (a first link, or one to replace an older kind). */
  const choose = (
    <VStack gap={2}>
      <Text xstyle={styles.heading}>{t('calendar.which')}</Text>
      <MenuList
        label={t('calendar.which')}
        hasDividers
        items={KINDS.map((kind) => ({
          id: kind,
          label: calendarName(kind),
          icon: <TripsIcon width={26} height={26} />,
          onSelect: () => {
            if (!busy) void make(kind);
          },
        }))}
      />
    </VStack>
  );

  return (
    <SubPage title={t('calendar.title')} backHref="/profile/" backLabel={tPlain('nav.back.profile')} actions={<HelpButton />}>
      <Text xstyle={styles.body}>{t('calendar.intro.plan')}</Text>

      {state.status === 'error' ? (
        <Notice
          notice="something_went_wrong"
          title={t('notice.something_went_wrong.title')}
          body={t('notice.something_went_wrong.body')}
          contactLabel={t('help.contact.action')}
        />
      ) : null}

      {state.status === 'off' ? choose : null}

      {linked && linked.isLegacy ? (
        <>
          {/* A link made before the place's name was shown: it still works as it did, and Pam has no address to show for it. */}
          <Card padding={5}>
            <VStack gap={1}>
              <Text xstyle={styles.name}>{t('calendar.legacy.title')}</Text>
              <Text type="supporting" xstyle={styles.small}>
                {t('calendar.legacy.body')}
              </Text>
            </VStack>
          </Card>
          {choose}
          <MenuList
            label={t('calendar.manage')}
            hasDividers
            items={[{ id: 'off', label: t('calendar.off'), description: t('calendar.disconnect.hint'), icon: <CrossIcon width={26} height={26} />, onSelect: () => setAsking('off') }]}
          />
        </>
      ) : null}

      {linked && !linked.isLegacy ? (
        <>
          <Card padding={5}>
            <VStack gap={1}>
              <HStack gap={3} align="center" wrap="nowrap">
                <HStack align="center" justify="center" xstyle={styles.tick}>
                  <CheckIcon width={18} height={18} aria-hidden />
                </HStack>
                <Text xstyle={styles.name}>{calendar ? calendarName(calendar) : ''}</Text>
              </HStack>
              {since ? (
                <Text type="supporting" xstyle={styles.small}>
                  {t('calendar.linkedSince', { date: since })}
                </Text>
              ) : null}
            </VStack>
          </Card>

          {token ? (
            <VStack gap={3}>
              {calendar === 'apple' && apple ? <BigButton label={t('calendar.apple')} href={appleUrl(token)} /> : null}
              {calendar === 'google' ? <BigButton label={t('calendar.add.google')} href={GOOGLE_ADD_BY_URL} /> : null}
              <BigButton label={t(copied ? 'calendar.copied' : 'calendar.copy')} variant={calendar === 'apple' || calendar === 'google' ? 'secondary' : 'primary'} onPress={() => void copy()} />
              {calendar === 'google' ? (
                <Text type="supporting" xstyle={styles.small}>
                  {t('calendar.google.phone')}
                </Text>
              ) : null}
              {calendar === 'outlook' || calendar === 'other' ? (
                <Text type="supporting" xstyle={styles.small}>
                  {t('calendar.others')}
                </Text>
              ) : null}
              <Text type="supporting" xstyle={styles.small}>
                {t('calendar.keepPrivate')}
              </Text>
            </VStack>
          ) : null}

          <VStack gap={2}>
            <Text xstyle={styles.heading}>{t('calendar.manage')}</Text>
            <MenuList
              label={t('calendar.manage')}
              hasDividers
              items={[
                { id: 'new', label: t('calendar.newLink'), description: t('calendar.newLink.hint'), icon: <RefreshIcon width={26} height={26} />, onSelect: () => setAsking('new') },
                {
                  id: 'off',
                  label: calendar && calendar !== 'other' ? t('calendar.disconnect', { calendar: calendarName(calendar) }) : t('calendar.off'),
                  description: t('calendar.disconnect.hint'),
                  icon: <CrossIcon width={26} height={26} />,
                  onSelect: () => setAsking('off'),
                },
              ]}
            />
          </VStack>
        </>
      ) : null}

      {state.status === 'off' || linked ? (
        <Text type="supporting" xstyle={styles.small}>
          {t('calendar.privacy')}
        </Text>
      ) : null}

      <ConfirmDialog
        isOpen={asking === 'new'}
        title={t('calendar.newLink.title')}
        body={t('calendar.newLink.body')}
        confirmLabel={t('calendar.newLink.confirm')}
        onConfirm={() => {
          setAsking(null);
          setCopied(false);
          void make();
        }}
        cancelLabel={t('calendar.new.keep')}
        onCancel={() => setAsking(null)}
      />
      <ConfirmDialog
        isOpen={asking === 'off'}
        title={calendar && calendar !== 'other' ? t('calendar.disconnect.title', { calendar: calendarName(calendar) }) : t('calendar.off.title')}
        body={t('calendar.off.body')}
        confirmLabel={calendar && calendar !== 'other' ? t('calendar.disconnect.confirm') : t('calendar.off.confirm')}
        onConfirm={() => {
          setAsking(null);
          void turnOff();
        }}
        cancelLabel={t('calendar.off.keep')}
        onCancel={() => setAsking(null)}
      />
    </SubPage>
  );
}
