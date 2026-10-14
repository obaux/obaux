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
 * Explore's one search box (D-573): programs, Pam's areas and addresses in one list, no switch. The launcher opens a full screen with the
 * cursor in the box. These show it empty, with a program word (programs first, and the row that lets a person ask Google on purpose),
 * with a ZIP (Areas first) and with an address (Google's rows and mark, because the journey has the street search on).
 */
const meta = { title: 'Member/Created/States/One search' } satisfies Meta;

export default meta;
type Story = StoryObj;

const route = REDESIGN_ROUTES['/'];
if (!route) throw new Error('No prototype route for / — add it to src/stories/prototype/routes.tsx');

const BUNDLES: Record<string, Record<string, string>> = { en, es, 'pt-BR': ptBR, 'zh-CN': zhCN, 'zh-HK': zhHK, ru, ar };

/** Polls until the thing is drawn (the journey answers after a moment). */
async function waitFor<T extends Element>(find: () => T | null, ms = 6000): Promise<T> {
  const until = Date.now() + ms;
  for (;;) {
    const found = find();
    if (found) return found;
    if (Date.now() > until) throw new Error('the search did not draw what the story waits for');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

function search(name: string, typed: string | null, waitForKey?: string): Story {
  return {
    ...asRole('member', '/', {}, { streetSearch: true }),
    name,
    render: () => <>{route!.render()}</>,
    play: async ({ canvas, canvasElement, userEvent, globals }) => {
      // The launcher says its words in the language the story is shown in.
      const bundle: Record<string, string> = BUNDLES[(globals as { locale?: string }).locale ?? 'en'] ?? en;
      await userEvent.click(await canvas.findByRole('button', { name: bundle['explore.search.placeholder'] ?? en['explore.search.placeholder'] }));
      if (typed === null) return;
      const box = await waitFor(() => canvasElement.ownerDocument.querySelector('input'));
      await userEvent.type(box, typed);
      // The words it waits for are in the language the story is shown in.
      const wait = waitForKey ? (bundle[waitForKey] ?? (en as Record<string, string>)[waitForKey]) : null;
      if (wait) await waitFor(() => (canvasElement.ownerDocument.body.textContent?.includes(wait) ? canvasElement : null));
    },
  };
}

/** Open, nothing typed: Use my current location, and nothing else. */
export const Open: Story = search('Open', null);
/** A program word: Programs, and "Search addresses for …" below. Nothing is sent to Google until it is tapped. */
export const ProgramWord: Story = search('A program word', 'work');
/** A ZIP: an area first, then the programs whose address has it. */
export const Zip: Story = search('A ZIP', '191');
/** Digits and nothing found: "Nothing matched that." (no program, no area, and Google is never asked for digits). */
export const NothingMatched: Story = search('Nothing matched', '99999', 'explore.search.nothing');
/** An address no program matches: Google's rows with "Used for this search only." and the mark. */
export const Address: Story = search('An address', '1500 Market', 'places.area.hereNote');
