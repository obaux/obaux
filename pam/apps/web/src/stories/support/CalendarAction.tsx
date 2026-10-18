import * as stylex from '@stylexjs/stylex';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { CalendarAddIcon, CalendarCheckIcon } from '@pam/ui';
import { Button } from '@pam/ui/Button';
import { VisitCard } from '@pam/ui/VisitCard';
import { useI18n } from '@/lib/i18n';

/**
 * The calendar button in the green visit card's corner (a98, Will 18 October): "Add to calendar" before (a white pill), "Added to
 * calendar" after (no fill, a calendar with a tick), both 48px, both the card's `action`. Added opens the Calendar screen. Drawings
 * only: the words are drafts (Sage signs them; the Arabic is a stand-in until Lena's).
 */
// The day is the weekday long and the month short, from Intl in each language (Will, 18 October): en "Thursday, Oct 22", es "jueves, 22 oct"; Arabic has no short month, so it stays whole.
const WORDS = {
  en: { add: 'Add to calendar', added: 'Added to calendar', addedName: 'Added to calendar. Opens Calendar settings.', eyebrow: 'Your next visit', day: 'Thursday, Oct 22', time: '10:00 AM', countdown: 'In 2 days', change: 'Change appointment' },
  ar: { add: 'أضف إلى التقويم', added: 'أُضيف إلى التقويم', addedName: 'أُضيف إلى التقويم. يفتح إعدادات التقويم.', eyebrow: 'زيارتك القادمة', day: 'الخميس، 22 أكتوبر', time: '10:00 ص', countdown: 'بعد يومين', change: 'غيّر الموعد' },
};
export const useCalendarWords = () => (useI18n().locale === 'ar' ? WORDS.ar : WORDS.en);

const styles = stylex.create({
  add: {
    flexShrink: 0,
    minHeight: '48px',
    paddingInline: '14px',
    fontSize: '16px',
    fontWeight: 700,
    backgroundColor: colorVars['--color-background-card'],
    color: colorVars['--color-text-green'],
    borderRadius: '24px',
  },
  // Added: no fill, the card's own green showing through; the same size and weight, still 48px to tap.
  added: { flexShrink: 0, minHeight: '48px', paddingInline: '4px', fontSize: '16px', fontWeight: 700, color: colorVars['--color-text-green'] },
});

export function CalendarAction({ added = false }: { readonly added?: boolean }) {
  const w = useCalendarWords();
  return added ? (
    <Button label={w.added} aria-label={w.addedName} variant="ghost" href="/calendar/" icon={<CalendarCheckIcon width={22} height={22} aria-hidden />} xstyle={styles.added} />
  ) : (
    <Button label={w.add} variant="secondary" icon={<CalendarAddIcon width={22} height={22} aria-hidden />} xstyle={styles.add} />
  );
}

/** The green card as the place page and the booked screen both draw it. */
export function CalendarVisitCard({ added = false, ownRow = false }: { readonly added?: boolean; readonly ownRow?: boolean }) {
  const w = useCalendarWords();
  return (
    <VisitCard
      eyebrow={w.eyebrow}
      day={w.day}
      time={w.time}
      countdown={w.countdown}
      changeLabel={w.change}
      changeHref="/trips/"
      actionOwnRow={ownRow}
      action={<CalendarAction added={added} />}
    />
  );
}
