'use client';

import { useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { CalendarAddIcon, SyncIcon, TripsIcon } from '@pam/ui';
import { Button } from '@pam/ui/Button';
import { MenuList } from '@pam/ui/MenuList';
import { PamSheet } from '@pam/ui/PamSheet';
import { useI18n } from '@/lib/i18n';
import { useCalendarLink } from '@/lib/useCalendarLink';
import { useSession } from '@/lib/useSession';
import { buildVisitFile, googleEventUrl, type FeedVisit } from '../../../../supabase/functions/calendar-feed/ics';

/**
 * Add this one visit to a calendar (D-604, a98 plan C), from the green card on the booked screen. A calendar-with-a-plus in the card's corner
 * opens a sheet of calendars; one tap hands the visit to that app: Apple Calendar and Outlook get a calendar file made here on the phone,
 * Google gets a link to its own add-an-event page. The event is the same one the member's link makes, by the same module as the feed
 * (the place's name, its address, the time). Nothing goes to Pam: no request, no database, nothing kept about which calendar was tapped.
 * Under the card, fine print: "Sync all future trip details?" opens the Calendar screen, for every visit at once.
 */
const styles = stylex.create({
  // "Add to calendar" is a real button in the green card's header (Will, a98; Dot's story): the card's white, the green icon and words, 48px.
  calendar: {
    flexShrink: 0,
    minHeight: '48px',
    paddingInline: '14px',
    fontSize: '16px',
    fontWeight: 700,
    backgroundColor: colorVars['--color-background-card'],
    color: colorVars['--color-text-green'],
    borderRadius: '24px',
  },
  // Synced: no fill, the card's own green showing through; the words stay green and 16px bold, still 48px to tap (Dot's story).
  synced: { flexShrink: 0, minHeight: '48px', paddingInline: '4px', fontSize: '16px', fontWeight: 700, color: colorVars['--color-text-green'] },
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

/** What the card is given: the button for VisitCard's `action`, and whether the header cannot hold the title and it (`actionOwnRow`). */
export interface CalendarSlot {
  readonly action: ReactNode;
  readonly actionOwnRow: boolean;
}

/** A long place name, or a long label, leaves the button no room beside the title at 320 wide: it takes a row of its own. */
const ownRowFor = (placeName: string, label: string): boolean => placeName.length + label.length > 30;

export function AddVisitToCalendar({ card, visit }: { readonly card: (slot: CalendarSlot) => ReactNode; readonly visit: VisitToAdd }) {
  const { t, tPlain } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  // A member who already has a calendar link: Pam cannot see a save, so "Add to calendar" never changes after adding one visit, but with a
  // link the corner button says where the visits go and opens the Calendar screen (Mira, Sage's words, Dot's drawing).
  const { state: session } = useSession();
  const { state: link } = useCalendarLink(session.status === 'signed-in');
  if (link.status === 'on') {
    const calendar = link.calendar ? t(`calendar.kind.${link.calendar}`) : t('calendar.kind.other.inline');
    const calendarPlain = link.calendar ? tPlain(`calendar.kind.${link.calendar}`) : tPlain('calendar.kind.other.inline');
    return (
      <VStack gap={1}>
        {card({
          action: (
            <Button
              label={t('trips.addToCalendar.linked', { calendar })}
              aria-label={tPlain('trips.addToCalendar.linked.label', { calendar: calendarPlain })}
              variant="ghost"
              href="/calendar/"
              icon={<SyncIcon width={22} height={22} aria-hidden />}
              xstyle={styles.synced}
            />
          ),
          actionOwnRow: true,
        })}
      </VStack>
    );
  }
  return (
    <VStack gap={1}>
      {card({
        action: (
          <Button
            label={tPlain('trips.addToCalendar')}
            variant="secondary"
            icon={<CalendarAddIcon width={22} height={22} aria-hidden />}
            onClick={() => setIsOpen(true)}
            xstyle={styles.calendar}
          />
        ),
        actionOwnRow: ownRowFor(visit.placeName, tPlain('trips.addToCalendar')),
      })}
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
