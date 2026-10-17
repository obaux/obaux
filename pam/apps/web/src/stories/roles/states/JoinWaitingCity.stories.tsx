import type { Meta, StoryObj } from '@storybook/nextjs';
import { userEvent, within } from 'storybook/test';
import en from '@pam/config/locales/en.json';
import es from '@pam/config/locales/es.json';
import ptBR from '@pam/config/locales/pt-BR.json';
import zhCN from '@pam/config/locales/zh-CN.json';
import zhHK from '@pam/config/locales/zh-HK.json';
import ru from '@pam/config/locales/ru.json';
import ar from '@pam/config/locales/ar.json';
import { screen } from '../screen';

/**
 * Signing up from a city Pam is not in yet: the step that says so and saves the city, and the line after it (the waiting list,
 * `join_waiting_city`). Lena's privacy guard (D-587) asked what this step promises, so both are here to be seen in every language.
 */
const meta = { title: 'Onboarding/Not in your city yet' } satisfies Meta;
export default meta;
type Story = StoryObj;

const WORDS = { en, es, 'pt-BR': ptBR, 'zh-CN': zhCN, 'zh-HK': zhHK, ru, ar } as Record<string, Record<string, string>>;
const wordFor = (globals: Record<string, unknown>, key: string): string =>
  (WORDS[String(globals['locale'] ?? 'en')] ?? (en as Record<string, string>))[key] ?? key;

const waiting = screen('member', 'Not in your city yet', '/prototype/join/', { kind: 'member', step: 'waiting', city: 'Camden' });

/** The step: Pam is not in Camden yet, where it is, and Save my city. */
export const NotInYourCityYet: Story = waiting;

/** After Save my city. */
export const CitySaved: Story = {
  ...waiting,
  name: 'Not in your city yet — saved',
  play: async ({ canvasElement, globals }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: wordFor(globals, 'join.waiting.action') }));
  },
};
