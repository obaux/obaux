import type { Meta, StoryObj } from '@storybook/nextjs';
import { userEvent, within } from 'storybook/test';
import en from '@pam/config/locales/en.json';
import es from '@pam/config/locales/es.json';
import ptBR from '@pam/config/locales/pt-BR.json';
import zhCN from '@pam/config/locales/zh-CN.json';
import zhHK from '@pam/config/locales/zh-HK.json';
import ru from '@pam/config/locales/ru.json';
import ar from '@pam/config/locales/ar.json';
import { CaseloadHome } from '../../../screens/StaffHomes';
import { ExamplePeopleProvider } from '../../../lib/examplePeople';
import { asRole } from '../../journeys/journey';

/**
 * A case manager's Home (D-212): their caseload under the search bar, Home on
 * the first tab. Type a name to filter; tap a person. Under the title, a row of
 * rings on the people with something new (D-198, D-486): an unread message or a
 * place saved since the last look, those first.
 *
 * Each card has one visit line (card a93, D-596): Marcus has a visit coming, Tanya's last was not marked as there (the chip),
 * Jordan's was. Under the cards, Invite someone and What you can see; the last story opens its sheet.
 */
const meta = {
  title: 'Case manager/States/Home',
  component: CaseloadHome,
} satisfies Meta<typeof CaseloadHome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Caseload: Story = { ...asRole('case-manager', '/'), name: 'Caseload' };
/**
 * Nobody on the list yet (D-486): under "Your members", faint circles with a (+) first that starts an invite
 * (a member's, straight away), and the list's own "Nobody on your list yet" below. The demo's example people
 * are off here so the empty state can be seen; in the app they stand in for it while the demo is on (D-172).
 */
export const Empty: Story = {
  ...asRole('case-manager', '/', {}, { noPeople: true }),
  name: 'Empty',
  decorators: [(Story) => <ExamplePeopleProvider value={false}><Story /></ExamplePeopleProvider>],
};
export const EmptyArabic: Story = { ...Empty, name: 'Empty — Arabic', globals: { locale: 'ar' } };
export const Arabic: Story = { ...Caseload, name: 'Arabic', globals: { locale: 'ar' } };
export const Spanish: Story = { ...Caseload, name: 'Spanish', globals: { locale: 'es' } };

const WORDS = { en, es, 'pt-BR': ptBR, 'zh-CN': zhCN, 'zh-HK': zhHK, ru, ar } as Record<string, Record<string, string>>;
const wordFor = (globals: Record<string, unknown>, key: string): string =>
  (WORDS[String(globals['locale'] ?? 'en')] ?? (en as Record<string, string>))[key] ?? key;

/** What you can see, opened (a93): the sheet with the promise to members, the same words as joining. */
export const WhatYouCanSee: Story = {
  ...Caseload,
  name: 'What you can see, open',
  play: async ({ canvasElement, globals }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: wordFor(globals, 'admin.seeing.title') }));
  },
};
