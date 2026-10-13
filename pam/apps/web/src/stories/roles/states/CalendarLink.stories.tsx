import type { Meta, StoryObj } from '@storybook/nextjs';
import ar from '@pam/config/locales/ar.json';
import en from '@pam/config/locales/en.json';
import es from '@pam/config/locales/es.json';
import ptBR from '@pam/config/locales/pt-BR.json';
import ru from '@pam/config/locales/ru.json';
import zhCN from '@pam/config/locales/zh-CN.json';
import zhHK from '@pam/config/locales/zh-HK.json';
import { asRole } from '../../journeys/journey';
import { REDESIGN_ROUTES } from '../../prototype/routes';

/**
 * The calendar link page in the states the fit audit could not see (D-538). The plain story loads with the link off, but the
 * long strings are in what a tap shows: the address once it is made (with the Apple, Google and "others" lines), the "Make a
 * new link?" question, and the "Turn it off?" question. Each of these plays the tap, in the language the story is shown in
 * (the labels are read from that language's own bundle), so `audit:fit` measures them in all seven.
 */
const meta = { title: 'Member/Created/States/Calendar link' } satisfies Meta;

export default meta;
type Story = StoryObj;

const BUNDLES: Record<string, Record<string, string>> = { en, es, 'pt-BR': ptBR, 'zh-CN': zhCN, 'zh-HK': zhHK, ru, ar };

const route = REDESIGN_ROUTES['/calendar/'];
if (!route) throw new Error('No prototype route for /calendar/ — add it to src/stories/prototype/routes.tsx');

/** The label of a button in the language this story is being shown in. */
const label = (locale: string | undefined, key: string) => BUNDLES[locale ?? 'en']?.[key] ?? en[key as keyof typeof en];

function calendar(name: string, calendarOn: boolean, key: string): Story {
  return {
    ...asRole('member', '/calendar/', {}, { calendarOn }),
    name,
    render: () => <>{route!.render()}</>,
    play: async ({ canvas, userEvent, globals }) => {
      const locale = (globals as { locale?: string }).locale;
      const button = await canvas.findByRole('button', { name: label(locale, key) });
      await userEvent.click(button);
    },
  };
}

/** Off, then "Make my calendar link": the address, "shown once", and the lines for each calendar app. */
export const LinkMade: Story = calendar('Link made', false, 'calendar.make');
/** On: "Make a new link" asked. */
export const NewLinkAsked: Story = calendar('New link?', true, 'calendar.new');
/** On: "Turn it off" asked. */
export const TurnOffAsked: Story = calendar('Turn off?', true, 'calendar.off');
