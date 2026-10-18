import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BigButton, CheckIcon, CrossIcon, RefreshIcon, SyncIcon, TripsIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { PamSheet } from '@pam/ui/PamSheet';
import { SubPage } from '@pam/ui/SubPage';
import { CalendarVisitCard } from '../support/CalendarAction';
import { useI18n } from '@/lib/i18n';

/**
 * DRAWINGS for card a98, the plan after Will's 17 October notes ("let's think broader"). Nothing here ships: the words are drafts,
 * `CalendarLinkView`, `useCalendarLink` and the booked screen are untouched (Piper's), and the buttons do nothing.
 *
 * What Will asked for, in his words: no question about whether to put the address in the event ("it's obviously a yes"); a visit
 * goes into the phone's calendar from a calendar icon inside the green card on the booked screen, which opens a sheet of
 * calendars, one tap and it is on the phone; under it, in fine print, "Sync all future trip details?" with a sync icon, which opens
 * the Calendar screen (also on Profile): it shows which calendar is linked, and the ways to disconnect are listed plainly.
 */
const meta = { title: 'Design/Calendar plan (a98)', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj;

const WORDS = {
  en: {
    booked: 'Your trip is booked',
    close: 'Close',
    eyebrow: 'Your next visit',
    day: 'Thursday, October 22',
    time: '10:00 AM',
    countdown: 'In 2 days',
    change: 'Change appointment',
    addToCalendar: 'Add to calendar',
    // Sage's words (ledger a7f6b7f8): "Goes to {calendar}"; "Calendar link" if it wraps at 320.
    syncing: 'Goes to Apple Calendar',
    syncingName: 'Goes to Apple Calendar through your calendar link. Opens Calendar.',
    sync: 'Sync all future trip details?',
    // Sage's words (ledger 4aef64a9).
    syncTrips: 'Add all your future visits',
    // Will cut the hint to its first sentence (18 October).
    syncHint: 'Set up a calendar link once.',
    sheetTitle: 'Add to calendar',
    done: 'Done',
    apple: 'Apple Calendar',
    google: 'Google Calendar',
    outlook: 'Outlook',
    sheetHint: 'Place, address and time, in the calendar you pick.',
    calendar: 'Calendar',
    back: 'Back to Profile',
    introOff: 'Your future visits go into your calendar by themselves, and move if a visit changes. It can take up to a day.',
    pick: 'Which calendar do you use?',
    other: 'Another calendar',
    privacy: 'Your calendar will show each visit’s place and address. Anyone who can see your calendar will see them.',
    connected: 'Linked',
    since: 'since 12 October',
    addApple: 'Add to Apple Calendar',
    addGoogle: 'Add to Google Calendar',
    copy: 'Copy link',
    secret: 'Keep this link to yourself.',
    manage: 'Manage',
    newLink: 'Get a new link',
    newLinkHint: 'The old one stops working. Add the new one to your calendar again.',
    disconnect: 'Disconnect',
    disconnectApple: 'Disconnect Apple Calendar',
    disconnectGoogle: 'Disconnect Google Calendar',
    disconnectHint: 'Your calendar stops getting your visits. It may keep the ones it has for a while.',
    place: 'Example Learning Center',
  },
  ar: {
    booked: 'تم حجز رحلتك',
    close: 'إغلاق',
    eyebrow: 'زيارتك القادمة',
    day: 'الخميس، 22 أكتوبر',
    time: '10:00 ص',
    countdown: 'بعد يومين',
    change: 'غيّر الموعد',
    addToCalendar: 'أضف إلى التقويم',
    syncing: 'تتم المزامنة مع تقويم Apple', // stand-in until Lena translates Sage's words
    syncingName: 'تتم المزامنة مع تقويم Apple عبر رابط التقويم. يفتح التقويم.', // stand-in
    sync: 'مزامنة تفاصيل كل رحلاتك القادمة؟',
    syncTrips: 'أضف كل زياراتك القادمة', // stand-in until Lena's translation
    syncHint: 'أعدّ رابط التقويم مرة واحدة.', // stand-in
    sheetTitle: 'أضف إلى التقويم',
    done: 'تم',
    apple: 'تقويم Apple',
    google: 'تقويم Google',
    outlook: 'Outlook',
    sheetHint: 'المكان والعنوان والوقت، في التقويم الذي تختاره.',
    calendar: 'التقويم',
    back: 'العودة إلى الملف الشخصي',
    introOff: 'تنتقل زياراتك القادمة إلى تقويمك تلقائيًا، وتتغير إذا تغيّرت الزيارة. قد يستغرق ذلك يومًا.',
    pick: 'أي تقويم تستخدم؟',
    other: 'تقويم آخر',
    privacy: 'سيعرض تقويمك مكان كل زيارة وعنوانها. كل من يستطيع رؤية تقويمك سيراها.',
    connected: 'مرتبط',
    since: 'منذ 12 أكتوبر',
    addApple: 'أضف إلى تقويم Apple',
    addGoogle: 'أضف إلى تقويم Google',
    copy: 'انسخ الرابط',
    secret: 'احتفظ بهذا الرابط لنفسك.',
    manage: 'إدارة',
    newLink: 'احصل على رابط جديد',
    newLinkHint: 'يتوقف الرابط القديم. أضف الجديد إلى تقويمك مرة أخرى.',
    disconnect: 'افصل',
    disconnectApple: 'افصل تقويم Apple',
    disconnectGoogle: 'افصل تقويم Google',
    disconnectHint: 'يتوقف تقويمك عن تلقي زياراتك. قد يحتفظ بما لديه لبعض الوقت.',
    place: 'Example Learning Center',
  },
};
type Words = typeof WORDS.en;
const useWords = (): Words => (useI18n().locale === 'ar' ? WORDS.ar : WORDS.en);

const styles = stylex.create({
  body: { fontSize: '17px', lineHeight: 1.5 },
  small: { fontSize: '15px', lineHeight: 1.5 },
  heading: { fontSize: '20px', lineHeight: 1.3, fontWeight: 700 },
  tick: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: colorVars['--color-background-green'], color: colorVars['--color-icon-green'], flexShrink: 0 },
  on: { fontSize: '17px', fontWeight: 700, color: colorVars['--color-text-accent'] },
  sheet: { width: '100%', paddingInline: '20px', paddingBlockEnd: '28px' },
});

/** `added`: the visit is in the calendar (a link, or added on this phone): the same corner, "Added to calendar", no fill, opens Calendar. */
function BookedScreen({ added = false }: { readonly added?: boolean }) {
  const w = useWords();
  return (
    <SubPage title={w.booked} backHref="/trips/" backLabel={w.close} backIcon="close">
      <CalendarVisitCard added={added} />
    </SubPage>
  );
}

function AddSheet() {
  const w = useWords();
  const [open, setOpen] = useState(true);
  return (
    <>
      <BookedScreen />
      <PamSheet isOpen={open} onOpenChange={setOpen} label={w.sheetTitle} kind="act" actionLabel={w.close}>
        <VStack gap={2} xstyle={styles.sheet}>
          <Text type="supporting" xstyle={styles.small}>
            {w.sheetHint}
          </Text>
          <MenuList
            label={w.sheetTitle}
            hasDividers
            items={[
              { id: 'apple', label: w.apple, icon: <TripsIcon width={26} height={26} />, onSelect: () => {} },
              { id: 'google', label: w.google, icon: <TripsIcon width={26} height={26} />, onSelect: () => {} },
              { id: 'outlook', label: w.outlook, icon: <TripsIcon width={26} height={26} />, onSelect: () => {} },
              // Sync moves in here from under the card (Will, 18 October): an action row like its neighbours, with its hint.
              { id: 'sync', label: w.syncTrips, description: w.syncHint, icon: <SyncIcon width={26} height={26} aria-hidden />, href: '/calendar/' },
            ]}
          />
        </VStack>
      </PamSheet>
    </>
  );
}

/** Profile › Calendar (also reached from the fine print under the card). `which` is the calendar linked, or none. */
function CalendarScreen({ which }: { readonly which: 'none' | 'apple' | 'google' }) {
  const w = useWords();
  return (
    <SubPage title={w.calendar} backHref="/profile/" backLabel={w.back}>
      {which === 'none' ? (
        <>
          <Text xstyle={styles.body}>{w.introOff}</Text>
          <VStack gap={2}>
            <Text xstyle={styles.heading}>{w.pick}</Text>
            <MenuList
              label={w.pick}
              hasDividers
              items={[
                { id: 'apple', label: w.apple, icon: <TripsIcon width={26} height={26} />, href: '/calendar/' },
                { id: 'google', label: w.google, icon: <TripsIcon width={26} height={26} />, href: '/calendar/' },
                { id: 'outlook', label: w.outlook, icon: <TripsIcon width={26} height={26} />, href: '/calendar/' },
                { id: 'other', label: w.other, icon: <TripsIcon width={26} height={26} />, href: '/calendar/' },
              ]}
            />
          </VStack>
          <Text type="supporting" xstyle={styles.small}>
            {w.privacy}
          </Text>
        </>
      ) : (
        <>
          <Card padding={5}>
            <VStack gap={1}>
              <HStack gap={3} align="center" wrap="nowrap">
                <HStack align="center" justify="center" xstyle={styles.tick}>
                  <CheckIcon width={18} height={18} aria-hidden />
                </HStack>
                <Text xstyle={styles.heading}>{which === 'apple' ? w.apple : w.google}</Text>
              </HStack>
              <Text type="supporting" xstyle={styles.small}>
                {w.connected} · {w.since}
              </Text>
            </VStack>
          </Card>
          <VStack gap={3}>
            <BigButton label={which === 'apple' ? w.addApple : w.addGoogle} />
            <BigButton label={w.copy} variant="secondary" />
            <Text type="supporting" xstyle={styles.small}>
              {w.secret} {w.introOff.split('. ').pop()}
            </Text>
          </VStack>
          <VStack gap={2}>
            <Text xstyle={styles.heading}>{w.manage}</Text>
            <MenuList
              label={w.manage}
              hasDividers
              items={[
                { id: 'new', label: w.newLink, description: w.newLinkHint, icon: <RefreshIcon width={26} height={26} />, onSelect: () => {} },
                {
                  id: 'off',
                  label: which === 'apple' ? w.disconnectApple : w.disconnectGoogle,
                  description: w.disconnectHint,
                  icon: <CrossIcon width={26} height={26} />,
                  onSelect: () => {},
                },
              ]}
            />
          </VStack>
          <Text type="supporting" xstyle={styles.small}>
            {w.privacy}
          </Text>
        </>
      )}
    </SubPage>
  );
}

/** The booked screen: a calendar icon in the green card; under it, fine print and a sync icon. */
export const C_Booked: Story = { render: () => <BookedScreen /> };
/** What the icon opens: pick a calendar and the visit is on the phone. */
/** The corner button once the visit is added: "Added to calendar", no fill, opens the Calendar screen. */
export const C_Booked_Added: Story = { render: () => <BookedScreen added /> };
export const C_Sheet: Story = { render: () => <AddSheet /> };
/** Profile › Calendar, nothing linked. */
export const C_CalendarNone: Story = { render: () => <CalendarScreen which="none" /> };
/** Profile › Calendar, Apple linked: which calendar, since when, the buttons, and the ways out. */
export const C_CalendarApple: Story = { render: () => <CalendarScreen which="apple" /> };
/** The same with Google linked. */
export const C_CalendarGoogle: Story = { render: () => <CalendarScreen which="google" /> };

const arabic = { globals: { locale: 'ar' } } as const;
export const C_Booked_Arabic: Story = { ...C_Booked, ...arabic };
export const C_Booked_Added_Arabic: Story = { ...C_Booked_Added, ...arabic };
export const C_Sheet_Arabic: Story = { ...C_Sheet, ...arabic };
export const C_CalendarNone_Arabic: Story = { ...C_CalendarNone, ...arabic };
export const C_CalendarApple_Arabic: Story = { ...C_CalendarApple, ...arabic };
