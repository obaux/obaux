'use client';

import { useEffect, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { CalendarAddIcon, CalendarCheckIcon, SyncIcon, TripsIcon } from '@pam/ui';
import { Button } from '@pam/ui/Button';
import { MenuList } from '@pam/ui/MenuList';
import { PamSheet } from '@pam/ui/PamSheet';
import { useI18n } from '@/lib/i18n';
import { useCalendarLink } from '@/lib/useCalendarLink';
import { useSession } from '@/lib/useSession';
import { addedStart, markAdded } from '@/lib/visitAddedToCalendar';
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
  // Added: no fill, the card's own green showing through; the same size and weight, still 48px to tap (Dot's story).
  added: { flexShrink: 0, minHeight: '48px', paddingInline: '4px', fontSize: '16px', fontWeight: 700, color: colorVars['--color-text-green'] },
  changed: { fontSize: '15px', lineHeight: 1.4, color: colorVars['--color-text-secondary'], textAlign: 'center' },
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
  // "Added" is true for a member with a calendar link (every visit reaches their calendar by itself, a moved one too), or for a visit added from
  // this sheet on this phone at its present time. Read after the page is up, so the static page and the first paint agree.
  const { state: session } = useSession();
  const { state: link } = useCalendarLink(session.status === 'signed-in');
  const [noted, setNoted] = useState<string | null>(null);
  useEffect(() => setNoted(addedStart(visit.id)), [visit.id]);
  const isLinked = link.status === 'on';
  const startsAt = visit.startsAt.toISOString();
  const isAdded = isLinked || noted === startsAt;
  // Added here, and the visit has moved since: add it again (Sage, b875573a). Pam never sees the save, so it cannot say the calendar changed.
  const hasChanged = !isLinked && noted !== null && noted !== startsAt;
  const hand = () => {
    markAdded(visit.id, visit.startsAt);
    setNoted(startsAt);
    setIsOpen(false);
  };
  const label = tPlain(isAdded ? 'calendar.addOne.added' : 'trips.addToCalendar');
  return (
    <VStack gap={1}>
      {card({
        action: isAdded ? (
          <Button
            label={label}
            aria-label={tPlain('calendar.addOne.added.label')}
            variant="ghost"
            href="/calendar/"
            icon={<CalendarCheckIcon width={22} height={22} aria-hidden />}
            xstyle={styles.added}
          />
        ) : (
          <Button
            label={label}
            variant="secondary"
            icon={<CalendarAddIcon width={22} height={22} aria-hidden />}
            onClick={() => setIsOpen(true)}
            xstyle={styles.calendar}
          />
        ),
        actionOwnRow: ownRowFor(visit.placeName, label),
      })}
      {hasChanged ? (
        <Text type="supporting" xstyle={styles.changed}>
          {t('calendar.addOne.changed')}
        </Text>
      ) : null}
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
                  hand();
                },
              },
              {
                id: 'google',
                label: t('calendar.kind.google'),
                icon: <TripsIcon width={26} height={26} />,
                href: googleEventUrl(toFeedVisit(visit), timeZone()),
                isExternal: true,
                onSelect: hand,
              },
              {
                id: 'outlook',
                label: t('calendar.kind.outlook'),
                icon: <TripsIcon width={26} height={26} />,
                onSelect: () => {
                  openCalendarFile(visit);
                  hand();
                },
              },
              // For every visit at once: set up a calendar link once (Will, 18 October). Opens the Calendar screen.
              {
                id: 'all',
                label: t('calendar.addOne.syncAll'),
                description: t('calendar.addOne.syncAll.hint'),
                icon: <SyncIcon width={26} height={26} />,
                href: '/calendar/',
              },
            ]}
          />
        </VStack>
      </PamSheet>
    </VStack>
  );
}
