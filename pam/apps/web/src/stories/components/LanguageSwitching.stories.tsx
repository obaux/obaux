import type { Meta, StoryObj } from '@storybook/nextjs';
import { directionOf, SWITCHING_LANGUAGE, type Locale } from '@pam/config';
import { LanguageSwitching } from '@pam/ui';

/**
 * The screen between two languages (D-404). When the words of the language
 * somebody just chose have to be downloaded, the window is covered by a
 * spinner and one line — "Cambiando a español…" — in the language being
 * switched to, so the wait is explained in words they can read. It appears
 * only if the download takes more than a moment.
 *
 * It paints over everything, so each story is the whole window.
 */
function of(locale: Locale) {
  return { label: SWITCHING_LANGUAGE[locale], lang: locale, dir: directionOf(locale) } as const;
}

const meta = {
  title: 'Components/Feedback/LanguageSwitching',
  tags: ['autodocs'],
  component: LanguageSwitching,
  parameters: { layout: 'fullscreen' },
  args: of('es'),
} satisfies Meta<typeof LanguageSwitching>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Spanish: Story = {};
export const Portuguese: Story = { args: of('pt-BR') };
export const SimplifiedChinese: Story = { args: of('zh-CN') };
export const TraditionalChinese: Story = { args: of('zh-HK') };
export const Russian: Story = { args: of('ru') };
/** Right to left: the line reads from the right even though the page behind it has not switched yet. */
export const Arabic: Story = { args: of('ar') };
export const English: Story = { args: of('en') };
