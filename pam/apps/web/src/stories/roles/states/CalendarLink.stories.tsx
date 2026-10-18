import type { Meta, StoryObj } from '@storybook/nextjs';
import ar from '@pam/config/locales/ar.json';
import en from '@pam/config/locales/en.json';
import es from '@pam/config/locales/es.json';
import ptBR from '@pam/config/locales/pt-BR.json';
import ru from '@pam/config/locales/ru.json';
import zhCN from '@pam/config/locales/zh-CN.json';
import zhHK from '@pam/config/locales/zh-HK.json';
import { asRole } from '../../journeys/journey';
import type { MockOptions } from '../../journeys/mockSupabase';
import { REDESIGN_ROUTES } from '../../prototype/routes';

/**
 * Profile › Calendar in every state the fit audit could not see (D-538; a98 plan C, D-604). The plain story is nothing linked ("Which
 * calendar do you use?"); the long strings are in what the other states draw: which calendar and since when, the buttons for each
 * calendar app, "Manage" (get a new link, disconnect), the older link made before the place was shown, and the two "are you sure" boxes.
 * The two questions play the tap, in the language the story is shown in (the line tapped is read from that language's own bundle), so
 * `audit:fit` measures them in all seven.
 */
const meta = { title: 'Member/Created/States/Calendar link' } satisfies Meta;

export default meta;
type Story = StoryObj;

const BUNDLES: Record<string, Record<string, string>> = { en, es, 'pt-BR': ptBR, 'zh-CN': zhCN, 'zh-HK': zhHK, ru, ar };

const route = REDESIGN_ROUTES['/calendar/'];
if (!route) throw new Error('No prototype route for /calendar/ — add it to src/stories/prototype/routes.tsx');

/** A line of the page in the language this story is being shown in. */
const words = (locale: string | undefined, key: string) => BUNDLES[locale ?? 'en']?.[key] ?? en[key as keyof typeof en];

function calendar(name: string, options: MockOptions, tap?: string): Story {
  const story: Story = {
    ...asRole('member', '/calendar/', {}, options),
    name,
    render: () => <>{route!.render()}</>,
  };
  // The row's own small line, which carries no name in it, so it is found whatever the language puts around a calendar's name.
  if (tap) {
    story.play = async ({ canvas, userEvent, globals }) => {
      const locale = (globals as { locale?: string }).locale;
      await userEvent.click(await canvas.findByText(words(locale, tap)));
    };
  }
  return story;
}

/** Nothing linked: "Which calendar do you use?" and the four kinds. */
export const WhichCalendar: Story = calendar('Which calendar?', {});
/** Linked to Apple Calendar: "Set up on …", its button, Copy, "Keep this link to yourself", Manage. */
export const LinkedApple: Story = calendar('Linked: Apple', { calendarLink: 'apple' });
/** Linked to Google Calendar: the add-by-address button and the note that the phone app cannot add it. */
export const LinkedGoogle: Story = calendar('Linked: Google', { calendarLink: 'google' });
/** Linked to Outlook (or another calendar): Copy is the main button, with the note on how to add it. */
export const LinkedOther: Story = calendar('Linked: another calendar', { calendarLink: 'other' });
/** A link made before the place's name was shown: it still works, and says so; the four kinds below get a new one. */
export const OlderLink: Story = calendar('Older link', { calendarLink: 'legacy' });
/** Linked: "Get a new link?" asked (Manage's first line). */
export const NewLinkAsked: Story = calendar('Get a new link?', { calendarLink: 'apple' }, 'calendar.newLink.hint');
/** Linked: "Disconnect Apple Calendar?" asked (Manage's second line). */
export const DisconnectAsked: Story = calendar('Disconnect?', { calendarLink: 'apple' }, 'calendar.disconnect.hint');
/** The older link: "Turn it off?" asked. */
export const OlderLinkOffAsked: Story = calendar('Older link: turn off?', { calendarLink: 'legacy' }, 'calendar.disconnect.hint');

const booked = REDESIGN_ROUTES['/trips/new/'];
if (!booked) throw new Error('No prototype route for /trips/new/ — add it to src/stories/prototype/routes.tsx');

/** A booked visit, and "Add to calendar" tapped: the sheet with the hint and the three calendars (one visit, nothing stored). */
export const AddOneVisit: Story = {
  ...asRole('member', '/trips/new/', { booked: 'dummy-trip-1' }),
  name: 'Add one visit to a calendar',
  render: () => <>{booked!.render()}</>,
  play: async ({ canvas, userEvent, globals }) => {
    const locale = (globals as { locale?: string }).locale;
    await userEvent.click(await canvas.findByRole('button', { name: words(locale, 'trips.addToCalendar') }));
  },
};
