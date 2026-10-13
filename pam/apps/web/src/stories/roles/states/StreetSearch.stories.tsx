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
 * The area sheet with street search ON (D-552). The plain story has the search off, so `audit:fit` never drew the street label, the
 * hint that says an address works, or Google's row and mark. These open the sheet in the language the story is shown in (the labels
 * come from that language's own bundle): empty, with the street hint, and with Google's suggestions showing under Pam's own.
 */
const meta = { title: 'Member/Created/States/Street search' } satisfies Meta;

export default meta;
type Story = StoryObj;

const BUNDLES: Record<string, Record<string, string>> = { en, es, 'pt-BR': ptBR, 'zh-CN': zhCN, 'zh-HK': zhHK, ru, ar };

/** Polls until the portal has drawn the thing (the sheet and its rows are outside the story's own element). */
async function waitFor<T extends Element>(find: () => T | null, ms = 6000): Promise<T> {
  const until = Date.now() + ms;
  for (;;) {
    const found = find();
    if (found) return found;
    if (Date.now() > until) throw new Error('the area sheet did not draw what the story waits for');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

const route = REDESIGN_ROUTES['/places/'];
if (!route) throw new Error('No prototype route for /places/ — add it to src/stories/prototype/routes.tsx');

function sheet(name: string, typed: string | null): Story {
  return {
    ...asRole('member', '/places/', {}, { streetSearch: true }),
    name,
    render: () => <>{route!.render()}</>,
    play: async ({ canvas, canvasElement, userEvent, globals }) => {
      const bundle = BUNDLES[(globals as { locale?: string }).locale ?? 'en'] ?? en;
      const near = (bundle['places.near'] ?? en['places.near']).replace('{area}', 'City Hall');
      const change = (bundle['places.changeArea'] ?? en['places.changeArea']).replace('{area}', near);
      await userEvent.click(await canvas.findByRole('button', { name: change }));
      if (typed === null) return;
      // The search field is in the sheet, which is in the document, not in the canvas.
      const page = canvasElement.ownerDocument;
      const box = await waitFor(() => page.querySelector('input'));
      await userEvent.type(box, typed);
      await waitFor(() => page.querySelector('[data-google-attribution]'));
    },
  };
}


/** Open, nothing typed: the street label and the hint that says an address works. */
export const SheetOpen: Story = sheet('Sheet open', null);
/** An address typed: Pam's own rows, then Google's with "Used for this search only." and the Google mark, centred. */
export const ResultsShowing: Story = sheet('Results showing', '1500 Market');
