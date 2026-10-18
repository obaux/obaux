'use client';

import { useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { CalendarAddIcon, SyncIcon, TripsIcon } from '@pam/ui';
import { Button } from '@pam/ui/Button';
import { MenuList } from '@pam/ui/MenuList';
import { PamSheet } from '@pam/ui/PamSheet';
import { useI18n } from '@/lib/i18n';
import { buildVisitFile, googleEventUrl, type FeedVisit } from '../../../../supabase/functions/calendar-feed/ics';

/**
 * Add this one visit to a calendar (D-604, a98 plan C), from the green card on the booked screen. A calendar-with-a-plus in the card's corner
 * opens a sheet of calendars; one tap hands the visit to that app: Apple Calendar and Outlook get a calendar file made here on the phone,
 * Google gets a link to its own add-an-event page. The event is the same one the member's link makes, by the same module as the feed
 * (the place's name, its address, the time). Nothing goes to Pam: no request, no database, nothing kept about which calendar was tapped.
 * Under the card, fine print: "Sync all future trip details?" opens the Calendar screen, for every visit at once.
 */
const styles = stylex.create({
  wrap: { position: 'relative', width: '100%' },
  // The button sits in the green card's top corner: a 36px circle in a 48px target.
  button: {
    position: 'absolute',
    insetBlockStart: '10px',
    insetInlineEnd: '10px',
    zIndex: 2,
    width: '48px',
    height: '48px',
    backgroundColor: 'transparent',
    boxShadow: 'none',
  },
  circle: {
    width: '36px',
    height: '36px',
    minWidth: '36px',
    flexShrink: 0,
    borderRadius: '50%',
    backgroundColor: colorVars['--color-background-card'],
    color: colorVars['--color-icon-green'],
  },
  fine: { alignSelf: 'center', minHeight: '48px', paddingInline: '12px', fontSize: '15px', fontWeight: 600, color: colorVars['--color-text-secondary'] },
  sheet: { width: '100%', paddingInline: '20px', paddingBlockEnd: '28px' },
  hint: { fontSize: '15px', lineHeight: 1.5 },
});

export interface VisitToAdd {
  readonly id: string;
  readonly placeName: string;
  readonly address: string | null;
  readonly startsAt: Date;
}

const toFeedVisit = (visit: VisitToAdd): FeedVisit => ({
  id: visit.id,
  starts_at: visit.startsAt.toISOString(),
  ends_at: null,
  name: visit.placeName,
  address: visit.address,
});

/** Hands a calendar file to the phone: a link to it, made here, tapped from here, and let go of after. */
function openCalendarFile(visit: VisitToAdd): void {
  const file = buildVisitFile(toFeedVisit(visit));
  if (!file) return;
  const url = URL.createObjectURL(new Blob([file], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'visit.ics';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function timeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

export function AddVisitToCalendar({ card, visit }: { readonly card: ReactNode; readonly visit: VisitToAdd }) {
  const { t, tPlain } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <VStack gap={1}>
      <div {...stylex.props(styles.wrap)}>
        {card}
        <IconButton
          label={tPlain('trips.addToCalendar')}
          variant="ghost"
          onClick={() => setIsOpen(true)}
          icon={
            <HStack align="center" justify="center" xstyle={styles.circle}>
              <CalendarAddIcon width={20} height={20} aria-hidden />
            </HStack>
          }
          xstyle={styles.button}
        />
      </div>
      <Button label={t('trips.syncAll')} variant="ghost" icon={<SyncIcon width={18} height={18} aria-hidden />} href="/calendar/" xstyle={styles.fine} />
      <PamSheet isOpen={isOpen} onOpenChange={setIsOpen} label={tPlain('trips.addToCalendar')} kind="act" actionLabel={t('trips.confirm.close')}>
        <VStack gap={2} xstyle={styles.sheet}>
          <Text type="supporting" xstyle={styles.hint}>
            {t('trips.addToCalendar.hint')}
          </Text>
          <MenuList
            label={tPlain('trips.addToCalendar')}
            hasDividers
            items={[
              {
                id: 'apple',
                label: t('calendar.kind.apple'),
                icon: <TripsIcon width={26} height={26} />,
                onSelect: () => {
                  openCalendarFile(visit);
                  setIsOpen(false);
                },
              },
              {
                id: 'google',
                label: t('calendar.kind.google'),
                icon: <TripsIcon width={26} height={26} />,
                href: googleEventUrl(toFeedVisit(visit), timeZone()),
                isExternal: true,
              },
              {
                id: 'outlook',
                label: t('calendar.kind.outlook'),
                icon: <TripsIcon width={26} height={26} />,
                onSelect: () => {
                  openCalendarFile(visit);
                  setIsOpen(false);
                },
              },
            ]}
          />
        </VStack>
      </PamSheet>
    </VStack>
  );
}
