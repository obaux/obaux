import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Switch } from '@astryxdesign/core/Switch';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BigButton, CheckIcon, ClockIcon, TripsIcon } from '@pam/ui';
import { Button } from '@pam/ui/Button';
import { CategoryArt } from '@pam/ui/CategoryArt';
import { MenuList } from '@pam/ui/MenuList';
import { PamSheet } from '@pam/ui/PamSheet';
import { SubPage } from '@pam/ui/SubPage';
import { TripCard } from '@pam/ui/TripCard';
import { useI18n } from '@/lib/i18n';

/**
 * DRAWINGS for card a98 (Will, 17 October): Profile › Calendar is "too confusing". Nothing here ships: the words are drafts
 * (Sage signs, Lena translates, after Will picks), `CalendarLinkView` and `useCalendarLink` are untouched (Piper's), and the buttons do
 * nothing. Decisions from the merge desk drawn in every "after": the link can be shown again, so its buttons are always there; no
 * "connected" claim, only "On since {date}"; reset and turn off sit behind one row, "Stop or change the link"; the other calendar
 * apps' steps are one row, "Other calendar apps"; the privacy line is said once, beside the choice it is about; the place-name
 * switch stays, off by default.
 *
 * **A — per visit first** (Iris's recommendation): an "Add to my calendar" button on each visit, a small sheet that asks what to put
 * in the event, and Profile › Calendar as the quiet "keep every visit up to date" option.
 * **B — the feed only, simplified**: no button on the visit; Profile › Calendar is the one place, made simple.
 */
const meta = { title: 'Design/Calendar options (a98)', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj;

const WORDS = {
  en: {
    calendar: 'Calendar',
    back: 'Back to Profile',
    trips: 'Trips',
    backTrips: 'Back',
    addVisit: 'Add to my calendar',
    sheetTitle: 'Add to my calendar',
    sheetClose: 'Close',
    pamVisit: 'Only “Pam visit” and the time',
    withPlace: 'With the place’s name and address',
    detailsLabel: 'What goes in your calendar',
    apple: 'Apple Calendar or phone',
    google: 'Google Calendar',
    changed: 'If this visit changes, add it again.',
    introB: 'Put your Pam visits in your calendar. New visits and changes appear by themselves. It can take up to a day.',
    keepTitle: 'Keep every visit up to date',
    keepBody: 'Your calendar gets new visits and changes by itself. It can take up to a day.',
    oneAtATime: 'One visit at a time',
    oneAtATimeBody: 'Tap Add to my calendar on any visit in Trips.',
    goTrips: 'Go to my Trips',
    turnOn: 'Turn it on',
    privacy: 'Anyone who can see your calendar will see these visits.',
    onSince: 'On since 12 October',
    addApple: 'Add to Apple Calendar',
    copy: 'Copy link',
    secret: 'Keep this link to yourself.',
    addGoogle: 'Add to Google Calendar',
    otherApps: 'Other calendar apps',
    details: 'Show the place’s name and address in my calendar',
    detailsHint: 'Off: each visit says only “Pam visit” and its time.',
    stop: 'Stop or change the link',
    stopTitle: 'Stop or change the link',
    newLink: 'Make a new link',
    newLinkHint: 'The old link stops working. Add the new one to your calendar again.',
    off: 'Turn it off',
    offHint: 'Your calendar stops getting your visits. It may keep the ones it has for a while.',
    place: 'Example Learning Center',
    when: 'Thursday, Oct 22 · 10:00 AM',
    with: 'Sandra',
  },
  ar: {
    calendar: 'التقويم',
    back: 'العودة إلى الملف الشخصي',
    trips: 'الرحلات',
    backTrips: 'رجوع',
    addVisit: 'أضف إلى تقويمي',
    sheetTitle: 'أضف إلى تقويمي',
    sheetClose: 'إغلاق',
    pamVisit: '«زيارة Pam» والوقت فقط',
    withPlace: 'مع اسم المكان وعنوانه',
    detailsLabel: 'ما الذي يظهر في تقويمك',
    apple: 'تقويم Apple أو الهاتف',
    google: 'تقويم Google',
    changed: 'إذا تغيّرت هذه الزيارة، أضفها مرة أخرى.',
    introB: 'ضع زياراتك في تقويمك. تظهر الزيارات الجديدة والتغييرات تلقائيًا. قد يستغرق ذلك يومًا.',
    keepTitle: 'أبقِ كل زيارة محدّثة',
    keepBody: 'يتلقى تقويمك الزيارات الجديدة والتغييرات تلقائيًا. قد يستغرق ذلك يومًا.',
    oneAtATime: 'زيارة واحدة في كل مرة',
    oneAtATimeBody: 'اضغط «أضف إلى تقويمي» على أي زيارة في الرحلات.',
    goTrips: 'اذهب إلى رحلاتي',
    turnOn: 'شغّله',
    privacy: 'كل من يستطيع رؤية تقويمك سيرى هذه الزيارات.',
    onSince: 'يعمل منذ 12 أكتوبر',
    addApple: 'أضف إلى تقويم Apple',
    copy: 'انسخ الرابط',
    secret: 'احتفظ بهذا الرابط لنفسك.',
    addGoogle: 'أضف إلى تقويم Google',
    otherApps: 'تطبيقات تقويم أخرى',
    details: 'أظهر اسم المكان وعنوانه في تقويمي',
    detailsHint: 'مغلق: تقول كل زيارة «زيارة Pam» ووقتها فقط.',
    stop: 'أوقف الرابط أو غيّره',
    stopTitle: 'أوقف الرابط أو غيّره',
    newLink: 'أنشئ رابطًا جديدًا',
    newLinkHint: 'يتوقف الرابط القديم. أضف الجديد إلى تقويمك مرة أخرى.',
    off: 'أوقفه',
    offHint: 'يتوقف تقويمك عن تلقي زياراتك. قد يحتفظ بما لديه لبعض الوقت.',
    place: 'Example Learning Center',
    when: 'الخميس، 22 أكتوبر · 10:00 ص',
    with: 'Sandra',
  },
};
type Words = typeof WORDS.en;
const useWords = (): Words => {
  const { locale } = useI18n();
  return locale === 'ar' ? WORDS.ar : WORDS.en;
};

const styles = stylex.create({
  body: { fontSize: '17px', lineHeight: 1.5 },
  small: { fontSize: '15px', lineHeight: 1.5 },
  heading: { fontSize: '20px', lineHeight: 1.3, fontWeight: 700 },
  on: { fontSize: '17px', fontWeight: 700, color: colorVars['--color-text-accent'] },
  tick: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: colorVars['--color-background-green'], color: colorVars['--color-icon-green'], flexShrink: 0 },
  words: { flexGrow: 1, minWidth: 0 },
  sheet: { width: '100%', paddingInline: '20px', paddingBlockEnd: '28px' },
});

/** The button under a visit: a quiet secondary, the same width as the card. */
function VisitWithButton({ w }: { readonly w: Words }) {
  return (
    <VStack gap={2}>
      <TripCard
        placeName={w.place}
        when={w.when}
        href="/place/?id=dummy-place-learning&from=trips"
        art={<CategoryArt category="education" size="fill" />}
        withName={w.with}
        label={`${w.place}, ${w.when}`}
        policies={null}
      />
      <Button label={w.addVisit} variant="secondary" icon={<Icon icon="calendar" size="md" />} />
    </VStack>
  );
}

function TripsWithButton() {
  const w = useWords();
  return (
    <SubPage title={w.trips} backHref="/profile/" backLabel={w.backTrips}>
      <VisitWithButton w={w} />
    </SubPage>
  );
}

function AddSheet({ isOpen = true }: { readonly isOpen?: boolean }) {
  const w = useWords();
  const [open, setOpen] = useState(isOpen);
  const [what, setWhat] = useState('time');
  return (
    <>
      <TripsWithButton />
      <PamSheet isOpen={open} onOpenChange={setOpen} label={w.sheetTitle} kind="act" actionLabel={w.sheetClose}>
        <VStack gap={4} xstyle={styles.sheet}>
          <RadioList label={w.detailsLabel} isLabelHidden value={what} onChange={setWhat}>
            <RadioListItem value="time" label={w.pamVisit} />
            <RadioListItem value="place" label={w.withPlace} />
          </RadioList>
          <VStack gap={3}>
            <BigButton label={w.apple} />
            <BigButton label={w.google} variant="secondary" />
          </VStack>
          <Text type="supporting" xstyle={styles.small}>
            {w.changed}
          </Text>
        </VStack>
      </PamSheet>
    </>
  );
}

/** The Calendar screen. `variant` A is the quiet "keep every visit up to date" option; B is the one place for it. */
function CalendarScreen({ variant, isOn }: { readonly variant: 'A' | 'B'; readonly isOn: boolean }) {
  const w = useWords();
  const [showPlace, setShowPlace] = useState(false);
  return (
    <SubPage title={w.calendar} backHref="/profile/" backLabel={w.back}>
      {variant === 'B' ? (
        <Text xstyle={styles.body}>{w.introB}</Text>
      ) : (
        <>
          <Card padding={5}>
            <VStack gap={2}>
              <Text xstyle={styles.heading}>{w.oneAtATime}</Text>
              <Text xstyle={styles.body}>{w.oneAtATimeBody}</Text>
              <MenuList label={w.goTrips} items={[{ id: 'trips', label: w.goTrips, icon: <TripsIcon width={26} height={26} />, href: '/trips/' }]} />
            </VStack>
          </Card>
          <VStack gap={1}>
            <Text xstyle={styles.heading}>{w.keepTitle}</Text>
            <Text xstyle={styles.body}>{w.keepBody}</Text>
          </VStack>
        </>
      )}

      {!isOn ? (
        <VStack gap={3}>
          <BigButton label={w.turnOn} />
          <Text type="supporting" xstyle={styles.small}>
            {w.privacy}
          </Text>
        </VStack>
      ) : (
        <>
          <HStack gap={3} align="center" wrap="nowrap">
            <HStack align="center" justify="center" xstyle={styles.tick}>
              <CheckIcon width={18} height={18} aria-hidden />
            </HStack>
            <Text xstyle={styles.on}>{w.onSince}</Text>
          </HStack>
          <VStack gap={3}>
            <BigButton label={w.addApple} />
            <BigButton label={w.copy} variant="secondary" />
            <Text type="supporting" xstyle={styles.small}>
              {w.secret}
            </Text>
            <BigButton label={w.addGoogle} variant="secondary" />
          </VStack>
          <MenuList label={w.otherApps} items={[{ id: 'other', label: w.otherApps, icon: <ClockIcon width={26} height={26} />, href: '/help/' }]} />
          <Card padding={5}>
            <VStack gap={3}>
              <HStack gap={3} align="center" wrap="nowrap">
                <VStack gap={1} xstyle={styles.words}>
                  <Text xstyle={styles.body}>{w.details}</Text>
                  <Text type="supporting" xstyle={styles.small}>
                    {w.detailsHint}
                  </Text>
                </VStack>
                <Switch label={w.details} isLabelHidden value={showPlace} changeAction={setShowPlace} />
              </HStack>
              <Text type="supporting" xstyle={styles.small}>
                {w.privacy}
              </Text>
            </VStack>
          </Card>
          <MenuList label={w.stop} items={[{ id: 'stop', label: w.stop, icon: <ClockIcon width={26} height={26} />, href: '/calendar/' }]} />
        </>
      )}
    </SubPage>
  );
}

function StopSheet() {
  const w = useWords();
  const [open, setOpen] = useState(true);
  return (
    <>
      <CalendarScreen variant="A" isOn />
      <PamSheet isOpen={open} onOpenChange={setOpen} label={w.stopTitle} kind="review" actionLabel={w.sheetClose}>
        <VStack gap={2} xstyle={styles.sheet}>
          <MenuList
            label={w.stopTitle}
            hasDividers
            items={[
              { id: 'new', label: w.newLink, description: w.newLinkHint, icon: <ClockIcon width={26} height={26} />, onSelect: () => {} },
              { id: 'off', label: w.off, description: w.offHint, icon: <ClockIcon width={26} height={26} />, onSelect: () => {} },
            ]}
          />
        </VStack>
      </PamSheet>
    </>
  );
}


/** A: a button on each visit, under its card in Trips. */
export const A_Visit: Story = { render: () => <TripsWithButton /> };
/** A: what that button opens. The default is the discreet one. */
export const A_Sheet: Story = { render: () => <AddSheet /> };
/** A: Profile › Calendar, nothing turned on. */
export const A_CalendarOff: Story = { render: () => <CalendarScreen variant="A" isOn={false} /> };
/** A: Profile › Calendar, on: the link's buttons are always there. */
export const A_CalendarOn: Story = { render: () => <CalendarScreen variant="A" isOn /> };
/** Both: "Stop or change the link" opens these two choices (each still asks to confirm). */
export const Both_StopSheet: Story = { render: () => <StopSheet /> };
/** B: the feed only, nothing turned on. */
export const B_CalendarOff: Story = { render: () => <CalendarScreen variant="B" isOn={false} /> };
/** B: the feed only, on. */
export const B_CalendarOn: Story = { render: () => <CalendarScreen variant="B" isOn /> };

const arabic = { globals: { locale: 'ar' } } as const;
export const A_Visit_Arabic: Story = { ...A_Visit, ...arabic };
export const A_Sheet_Arabic: Story = { ...A_Sheet, ...arabic };
export const A_CalendarOff_Arabic: Story = { ...A_CalendarOff, ...arabic };
export const A_CalendarOn_Arabic: Story = { ...A_CalendarOn, ...arabic };
