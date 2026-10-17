import type { Meta, StoryObj } from '@storybook/nextjs';
import { Banner } from '@astryxdesign/core/Banner';
import { Page } from '@pam/ui';
import { VisitWidget, type VisitWidgetProps } from '@pam/ui/VisitWidget';
import { useI18n } from '@/lib/i18n';
import { useStoryText } from '../support/useStoryText';

/**
 * A proposal for Will (card a91, 17 October): the green visit card as a widget, so Get directions is not pushed down. The footer
 * (Check in | Change) opens two views inside the card; "I'm here" is the one dark button; the card is as tall as its tallest view and
 * never changes height; marked, it has no buttons; the small eye at the top right opens the blue note. The words marked "stand-in"
 * are not signed: Sage writes them. Nothing here ships until Will picks.
 */
type Words = {
  checkIn: string;
  alt: string;
  change: string;
  back: string;
  changeDate: string;
  cancelVisit: string;
  noteLabel: string;
  closeNote: string;
};
const STAND_IN: Record<string, Words> = {
  en: {
    checkIn: 'Check in',
    alt: 'I made it',
    change: 'Change',
    back: 'Back',
    changeDate: 'Change date and time',
    cancelVisit: 'Cancel visit',
    noteLabel: 'About this visit',
    closeNote: 'Close',
  },
  ar: {
    checkIn: 'تسجيل الوصول',
    alt: 'وصلت للتو',
    change: 'تغيير',
    back: 'رجوع',
    changeDate: 'تغيير التاريخ والوقت',
    cancelVisit: 'إلغاء الزيارة',
    noteLabel: 'عن هذه الزيارة',
    closeNote: 'إغلاق',
  },
};

type Args = {
  readonly onPam: boolean;
  readonly alt?: boolean;
  readonly marked?: boolean;
  readonly view?: VisitWidgetProps['initialView'];
  readonly noteOpen?: boolean;
  readonly result?: 'notYet' | 'none';
};

function Widget({ onPam, alt = false, marked = false, view = 'visit', noteOpen = false, result = 'none' }: Args) {
  const tr = useStoryText();
  const { locale } = useI18n();
  const w = STAND_IN[locale] ?? STAND_IN['en']!;
  const place = 'Example Learning Center';
  return (
    <VisitWidget
      eyebrow={tr('place.visit.next')}
      day={locale === 'ar' ? 'الخميس، 22 أكتوبر' : 'Thursday, October 22'}
      time={locale === 'ar' ? '10:00 ص' : '10:00 AM'}
      service={null}
      countdown={locale === 'ar' ? 'بعد يومين' : 'In 2 days'}
      programOnPam={onPam}
      noteLabel={w.noteLabel}
      closeNoteLabel={w.closeNote}
      note={onPam ? tr(`place.lead.sees?place=${place}`) : tr(`place.noLead?place=${place}`)}
      checkInLabel={alt ? w.alt : w.checkIn}
      changeLabel={w.change}
      backLabel={w.back}
      hereLabel={tr('checkin.here')}
      wentLabel={tr('checkin.went')}
      changeDateLabel={w.changeDate}
      cancelVisitLabel={w.cancelVisit}
      changeDateHref="/trips/new/"
      isMarked={marked}
      markedTitle={tr('checkin.done')}
      markedDetail={tr('checkin.points?points=100')}
      initialView={view}
      isNoteInitiallyOpen={noteOpen}
      checkInResult={result === 'notYet' ? <Banner status="info" title={tr(`checkin.notYet?place=${place}`)} /> : undefined}
    />
  );
}

const meta = {
  title: 'Components/Cards/VisitWidget',
  tags: ['autodocs'],
  component: Widget,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  args: { onPam: true },
} satisfies Meta<typeof Widget>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Rest, a program on Pam: "Check in" and "Change" in the footer. */
export const Rest: Story = {};
/** Rest with Sage's alternative to "Check in" (a stand-in word here). */
export const RestAlternativeWord: Story = { args: { alt: true } };
/** Rest, a place not on Pam. */
export const RestNotOnPam: Story = { args: { onPam: false } };
/** The Check in view: "I'm here" and "I went"; Back returns to the visit. */
export const CheckIn: Story = { args: { view: 'checkin' } };
/** The Check in view with a result said inside the card. */
export const CheckInResult: Story = { args: { view: 'checkin', result: 'notYet' } };
/** The Change view: "Change date and time" and "Cancel visit". */
export const Change: Story = { args: { view: 'change' } };
/** Marked: no buttons, the card says so. */
export const Marked: Story = { args: { marked: true } };
/** The note, for a program on Pam. */
export const NoteOnPam: Story = { args: { noteOpen: true } };
/** The note, for a place not on Pam. */
export const NoteNotOnPam: Story = { args: { onPam: false, noteOpen: true } };
export const RestArabic: Story = { globals: { locale: 'ar' } };
export const CheckInArabic: Story = { args: { view: 'checkin' }, globals: { locale: 'ar' } };
export const ChangeArabic: Story = { args: { view: 'change' }, globals: { locale: 'ar' } };
export const MarkedArabic: Story = { args: { marked: true }, globals: { locale: 'ar' } };
export const NoteArabic: Story = { args: { noteOpen: true }, globals: { locale: 'ar' } };
export const Narrow: Story = { globals: { viewport: { value: 'narrow320', isRotated: false } } };
