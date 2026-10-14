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
 * Explore's one search field (D-573): inline, typing filters the list under it. These type a program word, nothing, and an address (the
 * journey has the street search on, so the list is sorted from it, with its quiet line and Google's mark).
 */
const meta = { title: 'Member/Created/States/One search' } satisfies Meta;

export default meta;
type Story = StoryObj;

const route = REDESIGN_ROUTES['/'];
if (!route) throw new Error('No prototype route for / — add it to src/stories/prototype/routes.tsx');

const BUNDLES: Record<string, Record<string, string>> = { en, es, 'pt-BR': ptBR, 'zh-CN': zhCN, 'zh-HK': zhHK, ru, ar };

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
    play: async ({ canvasElement, userEvent, globals }) => {
      if (typed === null) return;
      const bundle: Record<string, string> = BUNDLES[(globals as { locale?: string }).locale ?? 'en'] ?? en;
      const box = await waitFor(() => canvasElement.querySelector('input'));
      await userEvent.type(box, typed);
      // The words it waits for are in the language the story is shown in ("Results for “{query}”" up to the value).
      const wait = waitForKey ? (bundle[waitForKey] ?? (en as Record<string, string>)[waitForKey])!.split('{')[0]!.trim() : null;
      if (wait) await waitFor(() => (canvasElement.textContent?.includes(wait) ? canvasElement : null));
    },
  };
}

/** At rest: the field in place of the old launcher. */
export const Resting: Story = search('Resting', null);
/** A program word: the list under the field is those programs. */
export const ProgramWord: Story = search('A program word', 'work');
/** Digits and nothing found: "Nothing matched that." */
export const NothingMatched: Story = search('Nothing matched', '99999', 'explore.search.nothing');
/** An address no program matches: Pam's programs nearest it, the heading "Results for …", "Near 19102" and Google's mark. */
export const Address: Story = search('An address', '1500 Market', 'explore.results');
