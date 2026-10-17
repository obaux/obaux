import type { Meta, StoryObj } from '@storybook/nextjs';
import { Banner } from '@astryxdesign/core/Banner';
import { Page } from '@pam/ui';
import { VisitWidget, type VisitWidgetProps } from '@pam/ui/VisitCard';
import { intlLocale } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useStoryText } from '../support/useStoryText';

/**
 * The green visit card as a widget (card a91, 17 October; Will chose it), so Get directions is not pushed down. The footer
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
// Stand-ins for every language but English: Sage signs the English, Lena the rest (A25). "alt" is Sage's "I made it".
const STAND_IN: Record<string, Words> = {
  en: { checkIn: 'Check in', alt: 'I made it', change: 'Change', back: 'Back', changeDate: 'Change date and time', cancelVisit: 'Cancel visit', noteLabel: 'About this visit', closeNote: 'Close' },
  es: { checkIn: 'Registrar llegada', alt: 'Ya llegué', change: 'Cambiar', back: 'Atrás', changeDate: 'Cambiar fecha y hora', cancelVisit: 'Cancelar visita', noteLabel: 'Sobre esta visita', closeNote: 'Cerrar' },
  'pt-BR': { checkIn: 'Fazer check-in', alt: 'Cheguei', change: 'Alterar', back: 'Voltar', changeDate: 'Alterar data e hora', cancelVisit: 'Cancelar visita', noteLabel: 'Sobre esta visita', closeNote: 'Fechar' },
  'zh-CN': { checkIn: '签到', alt: '我到了', change: '更改', back: '返回', changeDate: '更改日期和时间', cancelVisit: '取消访问', noteLabel: '关于这次访问', closeNote: '关闭' },
  'zh-HK': { checkIn: '簽到', alt: '我到咗', change: '更改', back: '返回', changeDate: '更改日期同時間', cancelVisit: '取消探訪', noteLabel: '關於今次探訪', closeNote: '關閉' },
  ru: { checkIn: 'Отметиться', alt: 'Я на месте', change: 'Изменить', back: 'Назад', changeDate: 'Изменить дату и время', cancelVisit: 'Отменить визит', noteLabel: 'Об этом визите', closeNote: 'Закрыть' },
  ar: { checkIn: 'تسجيل الوصول', alt: 'وصلت', change: 'تغيير', back: 'رجوع', changeDate: 'تغيير التاريخ والوقت', cancelVisit: 'إلغاء الزيارة', noteLabel: 'عن هذه الزيارة', closeNote: 'إغلاق' },
};

type Args = {
  readonly onPam: boolean;
  readonly alt?: boolean;
  readonly marked?: boolean;
  readonly view?: VisitWidgetProps['initialView'];
  readonly noteOpen?: boolean;
  readonly result?: 'notYet' | 'none';
  readonly showsCheckIn?: boolean;
};

function Widget({ onPam, alt = false, marked = false, view = 'visit', noteOpen = false, result = 'none', showsCheckIn = true }: Args) {
  const tr = useStoryText();
  const { locale } = useI18n();
  const w = STAND_IN[locale] ?? STAND_IN['en']!;
  const place = 'Example Learning Center';
  return (
    <VisitWidget
      eyebrow={tr('place.visit.next')}
      day={new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date('2026-10-22T12:00:00Z'))}
      time={new Intl.DateTimeFormat(intlLocale(locale), { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date('2026-10-22T10:00:00Z'))}
      service={null}
      countdown={tr('when.countdown.days?count=2')}
      hasLead={onPam}
      noteLabel={w.noteLabel}
      closeNoteLabel={w.closeNote}
      note={onPam ? tr(`place.lead.sees?place=${place}`) : tr(`place.noLead?place=${place}`)}
      showsCheckIn={showsCheckIn}
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
/** Outside the window where a visit can be marked the first action is gone and "Change" is alone. */
export const RestWithoutCheckIn: Story = { args: { showsCheckIn: false } };
export const Narrow: Story = { globals: { viewport: { value: 'narrow320', isRotated: false } } };
export const NarrowCheckIn: Story = { args: { view: 'checkin' }, globals: { viewport: { value: 'narrow320', isRotated: false } } };
export const NarrowChange: Story = { args: { view: 'change' }, globals: { viewport: { value: 'narrow320', isRotated: false } } };
export const NarrowMarked: Story = { args: { marked: true }, globals: { viewport: { value: 'narrow320', isRotated: false } } };
export const NarrowNote: Story = { args: { noteOpen: true }, globals: { viewport: { value: 'narrow320', isRotated: false } } };

const language = (locale: string, args: Partial<Args> = {}): Story => ({ args: { onPam: true, ...args }, globals: { locale } });
/** Every view in the six other languages (the footer, Check in, Change, Marked and the note). */
export const Spanish: Story = language('es');
export const SpanishCheckIn: Story = language('es', { view: 'checkin' });
export const SpanishChange: Story = language('es', { view: 'change' });
export const SpanishMarked: Story = language('es', { marked: true });
export const SpanishNote: Story = language('es', { noteOpen: true });
export const Portuguese: Story = language('pt-BR');
export const PortugueseCheckIn: Story = language('pt-BR', { view: 'checkin' });
export const PortugueseChange: Story = language('pt-BR', { view: 'change' });
export const PortugueseMarked: Story = language('pt-BR', { marked: true });
export const PortugueseNote: Story = language('pt-BR', { noteOpen: true });
export const ChineseSimplified: Story = language('zh-CN');
export const ChineseSimplifiedCheckIn: Story = language('zh-CN', { view: 'checkin' });
export const ChineseSimplifiedChange: Story = language('zh-CN', { view: 'change' });
export const ChineseSimplifiedMarked: Story = language('zh-CN', { marked: true });
export const ChineseSimplifiedNote: Story = language('zh-CN', { noteOpen: true });
export const ChineseTraditional: Story = language('zh-HK');
export const ChineseTraditionalCheckIn: Story = language('zh-HK', { view: 'checkin' });
export const ChineseTraditionalChange: Story = language('zh-HK', { view: 'change' });
export const ChineseTraditionalMarked: Story = language('zh-HK', { marked: true });
export const ChineseTraditionalNote: Story = language('zh-HK', { noteOpen: true });
export const Russian: Story = language('ru');
export const RussianCheckIn: Story = language('ru', { view: 'checkin' });
export const RussianChange: Story = language('ru', { view: 'change' });
export const RussianMarked: Story = language('ru', { marked: true });
export const RussianNote: Story = language('ru', { noteOpen: true });
export const Arabic: Story = language('ar');
export const ArabicCheckIn: Story = language('ar', { view: 'checkin' });
export const ArabicChange: Story = language('ar', { view: 'change' });
export const ArabicMarked: Story = language('ar', { marked: true });
export const ArabicNote: Story = language('ar', { noteOpen: true });
